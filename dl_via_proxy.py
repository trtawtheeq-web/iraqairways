#!/usr/bin/env python3
import json, os, time, urllib.parse, urllib.request

ROOT = "/home/ubuntu/jazeera"
OUT = os.path.join(ROOT, "client/public/airports")
os.makedirs(OUT, exist_ok=True)

CITY2IATA = {
    "Abha, Saudi Arabia": "AHB", "Abu Dhabi, United Arab Emirates": "AUH",
    "Ahmedabad, India": "AMD", "Al Ain, United Arab Emirates": "AAN",
    "Aleppo, Syria": "ALP", "Alexandria, Egypt": "HBE", "Almaty, Kazakhstan": "ALA",
    "Amman, Jordan": "ADJ", "Antalya, Turkey": "AYT", "Asyut, Egypt": "ATZ",
    "Bahrain (Manama)": "BAH", "Baku, Azerbaijan": "GYD", "Batumi, Georgia": "BUS",
    "Beirut, Lebanon": "BEY", "Bengaluru, India": "BLR", "Bishkek, Kyrgyzstan": "BSZ",
    "Budapest, Hungary": "BUD", "Cairo, Egypt": "CAI", "Chennai, India": "MAA",
    "Colombo, Sri Lanka": "CMB", "Damascus, Syria": "DAM", "Delhi, India": "DEL",
    "Dhaka, Bangladesh": "DAC", "Doha, Qatar": "DOH", "Dubai, United Arab Emirates": "DXB",
    "Dushanbe, Tajikistan": "DYU", "Buraydah Gassim, Saudi Arabia": "ELQ",
    "Giza, Egypt": "SPX", "Hail, Saudi Arabia": "HAS", "Hurghada, Egypt": "HRG",
    "Hyderabad, India": "HYD", "Islamabad, Pakistan": "ISB", "Istanbul, Turkey": "IST",
    "Jeddah, Saudi Arabia": "JED", "Karachi, Pakistan": "KHI", "Kathmandu, Nepal": "KTM",
    "Kochi, India": "COK", "Krakow, Poland": "KRK", "Lahore, Pakistan": "LHE",
    "Larnaca, Cyprus": "LCA", "London, United Kingdom": "LTN", "Luxor, Egypt": "LXR",
    "Madinah, Saudi Arabia": "MED", "Milan, Italy": "BGY", "Moscow, Russia": "DME",
    "Mumbai, India": "BOM", "Namangan, Uzbekistan": "NMA", "Osh, Kyrgyzstan": "OSS",
    "Prague, Czech Republic": "PRG", "Riyadh, Saudi Arabia": "RUH", "Salalah, Oman": "SLL",
    "Sarajevo, Bosnia and Herzegovina": "SJJ", "Sharm el Sheikh, Egypt": "SSH",
    "Sochi, Russia": "AER", "Sohag, Egypt": "HMB", "Taif, Saudi Arabia": "TIF",
    "Tashkent, Uzbekistan": "TAS", "Tbilisi, Georgia": "TBS",
    "Thiruvananthapuram, India": "TRV", "Tivat, Montenegro": "TIV",
    "Trabzon, Turkey": "TZX", "Yerevan, Armenia": "EVN", "Kuwait City, Kuwait": "KWI",
}
INPUT2IATA = {"Sabiha Istanbul Turkey": "SAW"}

def proxy(url):
    inner = url.replace("https://", "").replace("http://", "")
    return "https://wsrv.nl/?url=" + urllib.parse.quote(inner, safe="") + "&w=160&h=160&fit=cover&output=jpg&q=82"

def fetch(url, tries=4):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=45) as r:
                d = r.read()
                if len(d) > 1500:
                    return d
                raise Exception("too small %d" % len(d))
        except Exception as e:
            last = e; time.sleep(2 + i*3)
    raise last

data = json.load(open("/home/ubuntu/find_city_image_urls.json"))["results"]
done, fail = [], []
for row in data:
    inp = row["input"]; url = row.get("output", {}).get("image_url", "")
    iata = CITY2IATA.get(inp) or INPUT2IATA.get(inp)
    if not iata or not url: continue
    path = os.path.join(OUT, iata + ".jpg")
    if os.path.exists(path) and os.path.getsize(path) > 1500:
        done.append(iata); continue
    try:
        d = fetch(proxy(url))
        open(path, "wb").write(d)
        done.append(iata); print("OK", iata, len(d)); time.sleep(0.6)
    except Exception as e:
        fail.append((iata, str(e)[:60])); print("FAIL", iata, str(e)[:60]); time.sleep(1)

print("\n=== ok:", len(done), " fail:", len(fail))
for f in fail: print("  -", f)
