#!/usr/bin/env python3
"""Manual Netlify deploy via file-digest API. Bypasses git/commit dedup."""
import os, sys, hashlib, json, time
import requests

TOKEN = os.environ["NETLIFY_AUTH_TOKEN"]
SITE = "8239e587-e149-404b-9554-eff592287b0b"
DIST = "/home/ubuntu/jazeera-repo/dist"
H = {"Authorization": f"Bearer {TOKEN}"}

# 1. Walk dist, compute sha1 per file keyed by web path
files = {}
paths = {}
for root, _, names in os.walk(DIST):
    for n in names:
        full = os.path.join(root, n)
        rel = "/" + os.path.relpath(full, DIST).replace(os.sep, "/")
        with open(full, "rb") as f:
            data = f.read()
        sha = hashlib.sha1(data).hexdigest()
        files[rel] = sha
        paths[rel] = full

print(f"prepared {len(files)} files")
print("index.html sha1:", files.get("/index.html"))

# 2. Create deploy with full digest
r = requests.post(
    f"https://api.netlify.com/api/v1/sites/{SITE}/deploys",
    headers={**H, "Content-Type": "application/json"},
    data=json.dumps({"files": files, "draft": False}),
)
r.raise_for_status()
dep = r.json()
dep_id = dep["id"]
required = dep.get("required", [])
print("deploy id:", dep_id, "| required uploads:", len(required))

# 3. Upload required files (by sha). Map sha -> path (first match)
sha_to_path = {}
for rel, sha in files.items():
    sha_to_path.setdefault(sha, paths[rel])

for sha in required:
    p = sha_to_path.get(sha)
    if not p:
        print("WARN no path for", sha); continue
    # find a rel path for this sha to use in upload URL
    rel = next(rp for rp, s in files.items() if s == sha)
    with open(p, "rb") as f:
        body = f.read()
    up = requests.put(
        f"https://api.netlify.com/api/v1/deploys/{dep_id}/files{rel}",
        headers={**H, "Content-Type": "application/octet-stream"},
        data=body,
    )
    print("uploaded", rel, up.status_code)

# 4. Poll until ready
for _ in range(30):
    s = requests.get(f"https://api.netlify.com/api/v1/deploys/{dep_id}", headers=H).json()
    print("state:", s.get("state"))
    if s.get("state") in ("ready", "error"):
        break
    time.sleep(4)

print("DONE deploy:", dep_id)
print("permalink: https://%s--jazera.netlify.app/" % dep_id)
