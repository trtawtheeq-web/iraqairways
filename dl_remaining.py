#!/usr/bin/env python3
import json, os, io, time, re, urllib.parse, urllib.request
from PIL import Image

ROOT = "/home/ubuntu/jazeera"
OUT = os.path.join(ROOT, "client/public/airports")

CITY2IATA = {
    "Abu Dhabi, United Arab Emirates": "AUH", "Ahmedabad, India": "AMD",
    "Beirut, Lebanon": "BEY", "Chennai, India": "MAA", "Delhi, India": "DEL",
    "Dhaka, Bangladesh": "DAC", "Doha, Qatar": "DOH", "Dubai, United Arab Emirates": "DXB",
    "Dushanbe, Tajikistan": "DYU", "Buraydah Gassim, Saudi Arabia": "ELQ",
    "Jeddah, Saudi Arabia": "JED", "London, United Kingdom": "LTN",
    "Namangan, Uzbekistan": "NMA", "Osh, Kyrgyzstan": "OSS", "Sochi, Russia": "AER",
    "Sohag, Egypt": "HMB", "Yerevan, Armenia": "EVN",
}

def thumb(url, width=400):
    m = re.match(r"^(https://upload\.wikimedia\.org/wikipedia/commons)/(\w)/(\w\w)/([^/]+)$", url)
    if m:
        base, a, b, fn = m.groups()
        return f"{base}/thumb/{a}/{b}/{fn}/{width}px-{fn}"
    return url

def fetch(url, tries=5):
    last=None
    for i in range(tries):
        try:
            req=urllib.request.Request(url, headers={"User-Agent":"JazeeraDemo/1.0 (contact test@example.com)"})
            with urllib.request.urlopen(req, timeout=45) as r:
                return r.read()
        except Exception as e:
            last=e; time.sleep(4+i*5)
    raise last

data=json.load(open("/home/ubuntu/find_city_image_urls.json"))["results"]
ok=[];fail=[]
for row in data:
    iata=CITY2IATA.get(row["input"])
    if not iata: continue
    path=os.path.join(OUT, iata+".jpg")
    if os.path.exists(path) and os.path.getsize(path)>1500:
        ok.append(iata); continue
    url=row["output"]["image_url"]
    try:
        raw=fetch(thumb(url,400))
        im=Image.open(io.BytesIO(raw)).convert("RGB")
        w,h=im.size; s=min(w,h)
        im=im.crop(((w-s)//2,(h-s)//2,(w-s)//2+s,(h-s)//2+s)).resize((160,160),Image.LANCZOS)
        im.save(path,"JPEG",quality=82)
        ok.append(iata); print("OK",iata,os.path.getsize(path)); time.sleep(2)
    except Exception as e:
        fail.append((iata,str(e)[:70])); print("FAIL",iata,str(e)[:70]); time.sleep(2)

print("\n=== ok:",len(ok)," fail:",len(fail))
for f in fail: print("  -",f)
