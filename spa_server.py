import os
from http.server import SimpleHTTPRequestHandler, HTTPServer

ROOT = "/home/ubuntu/jazeera/dist"

class H(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        # strip query
        p = path.split("?", 1)[0].split("#", 1)[0]
        full = os.path.join(ROOT, p.lstrip("/"))
        if p == "/" or p == "":
            return os.path.join(ROOT, "jazeera-home.html")
        if os.path.isfile(full):
            return full
        # SPA fallback for non-asset routes
        if "." not in os.path.basename(p):
            return os.path.join(ROOT, "index.html")
        return full

if __name__ == "__main__":
    os.chdir(ROOT)
    HTTPServer(("0.0.0.0", 8105), H).serve_forever()
