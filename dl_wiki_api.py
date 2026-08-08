#!/usr/bin/env python3
import os, time, json, urllib.parse, urllib.request

OUT="/home/ubuntu/jazeera/client/public/airports"

# iata -> wikipedia page title (well-known city pages)
TARGETS={
 "AUH":"Abu Dhabi","AMD":"Ahmedabad","BEY":"Beirut","MAA":"Chennai","DEL":"New Delhi",
 "DAC":"Dhaka","DOH":"Doha","DXB":"Dubai","DYU":"Dushanbe","ELQ":"Buraidah",
 "JED":"Jeddah","LTN":"Luton","NMA":"Namangan","OSS":"Osh","AER":"Sochi",
 "HMB":"Sohag","EVN":"Yerevan",
}

def get_thumb(title, size=400):
    api=("https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages"
         "&piprop=thumbnail&pithumbsize=%d&redirects=1&titles=%s"%(size, urllib.parse.quote(title)))
    req=urllib.request.Request(api, headers={"User-Agent":"JazeeraDemo/1.0 (test@example.com)"})
    with urllib.request.urlopen(req, timeout=40) as r:
        data=json.load(r)
    pages=data["query"]["pages"]
    for _,p in pages.items():
        t=p.get("thumbnail",{}).get("source")
        if t: return t
    return None

def proxy(url):
    inner=url.replace("https://","").replace("http://","")
    return "https://wsrv.nl/?url="+urllib.parse.quote(inner,safe="")+"&w=160&h=160&fit=cover&output=jpg&q=82"

def fetch(url,tries=4):
    last=None
    for i in range(tries):
        try:
            req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0"})
            with urllib.request.urlopen(req,timeout=45) as r:
                d=r.read()
                if len(d)>1500: return d
                raise Exception("small")
        except Exception as e:
            last=e; time.sleep(2+i*3)
    raise last

ok=[];fail=[]
for iata,title in TARGETS.items():
    path=os.path.join(OUT,iata+".jpg")
    if os.path.exists(path) and os.path.getsize(path)>1500: ok.append(iata); continue
    try:
        src=get_thumb(title,400)
        if not src: raise Exception("no thumb from api")
        d=fetch(proxy(src))
        open(path,"wb").write(d); ok.append(iata); print("OK",iata,title,len(d)); time.sleep(0.8)
    except Exception as e:
        fail.append((iata,title,str(e)[:60])); print("FAIL",iata,title,str(e)[:60]); time.sleep(1)

print("\n=== ok:",len(ok)," fail:",len(fail))
for f in fail: print("  -",f)
