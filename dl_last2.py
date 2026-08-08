#!/usr/bin/env python3
import os, io, time, json, urllib.parse, urllib.request
from PIL import Image
OUT="/home/ubuntu/jazeera/client/public/airports"
TARGETS={"DYU":"Dushanbe","ELQ":"Buraidah"}
def get_thumb(title,size=500):
    api=("https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages"
         "&piprop=thumbnail&pithumbsize=%d&redirects=1&titles=%s"%(size,urllib.parse.quote(title)))
    req=urllib.request.Request(api,headers={"User-Agent":"JazeeraDemo/1.0 (test@example.com)"})
    with urllib.request.urlopen(req,timeout=40) as r: data=json.load(r)
    for _,p in data["query"]["pages"].items():
        t=p.get("thumbnail",{}).get("source")
        if t: return t
    return None
def fetch(url,tries=5):
    last=None
    for i in range(tries):
        try:
            req=urllib.request.Request(url,headers={"User-Agent":"JazeeraDemo/1.0 (test@example.com)"})
            with urllib.request.urlopen(req,timeout=45) as r: return r.read()
        except Exception as e: last=e; time.sleep(3+i*3)
    raise last
for iata,title in TARGETS.items():
    try:
        src=get_thumb(title,500); print(iata,"src=",src)
        raw=fetch(src)
        im=Image.open(io.BytesIO(raw)).convert("RGB"); w,h=im.size; s=min(w,h)
        im=im.crop(((w-s)//2,(h-s)//2,(w-s)//2+s,(h-s)//2+s)).resize((160,160),Image.LANCZOS)
        im.save(os.path.join(OUT,iata+".jpg"),"JPEG",quality=82)
        print("OK",iata,os.path.getsize(os.path.join(OUT,iata+".jpg")))
    except Exception as e:
        print("FAIL",iata,str(e)[:80])
