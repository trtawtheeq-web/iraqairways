#!/usr/bin/env python3
import json, os, time, re, urllib.parse, urllib.request

ROOT="/home/ubuntu/jazeera"; OUT=os.path.join(ROOT,"client/public/airports")
CITY2IATA={
 "Abu Dhabi, United Arab Emirates":"AUH","Ahmedabad, India":"AMD","Beirut, Lebanon":"BEY",
 "Chennai, India":"MAA","Delhi, India":"DEL","Dhaka, Bangladesh":"DAC","Doha, Qatar":"DOH",
 "Dubai, United Arab Emirates":"DXB","Dushanbe, Tajikistan":"DYU","Buraydah Gassim, Saudi Arabia":"ELQ",
 "Jeddah, Saudi Arabia":"JED","London, United Kingdom":"LTN","Namangan, Uzbekistan":"NMA",
 "Osh, Kyrgyzstan":"OSS","Sochi, Russia":"AER","Sohag, Egypt":"HMB","Yerevan, Armenia":"EVN",
}
def thumb(url,width=400):
    m=re.match(r"^(https://upload\.wikimedia\.org/wikipedia/commons)/(\w)/(\w\w)/([^/]+)$",url)
    if m:
        base,a,b,fn=m.groups(); return f"{base}/thumb/{a}/{b}/{fn}/{width}px-{fn}"
    return url
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
data=json.load(open("/home/ubuntu/find_city_image_urls.json"))["results"]
ok=[];fail=[]
for row in data:
    iata=CITY2IATA.get(row["input"])
    if not iata: continue
    path=os.path.join(OUT,iata+".jpg")
    if os.path.exists(path) and os.path.getsize(path)>1500: ok.append(iata); continue
    url=row["output"]["image_url"]
    try:
        d=fetch(proxy(thumb(url,400)))
        open(path,"wb").write(d); ok.append(iata); print("OK",iata,len(d)); time.sleep(0.6)
    except Exception as e:
        fail.append((iata,str(e)[:60])); print("FAIL",iata,str(e)[:60]); time.sleep(1)
print("\n=== ok:",len(ok)," fail:",len(fail))
for f in fail: print("  -",f)
