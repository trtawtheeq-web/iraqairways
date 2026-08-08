#!/usr/bin/env python3
import json, os, io, time, re
import urllib.request
from PIL import Image

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

def to_thumb(url, width=320):
    """Convert a Wikimedia 'commons/x/yy/Name.jpg' URL into a smaller thumbnail URL."""
    m = re.match(r"^(https://upload\.wikimedia\.org/wikipedia/commons)/(\w)/(\w\w)/([^/]+)$", url)
    if m:
        base, a, b, fname = m.groups()
        return f"{base}/thumb/{a}/{b}/{fname}/{width}px-{fname}"
    # already a thumb url -> downscale width
    m2 = re.match(r"^(.*/thumb/\w/\w\w/[^/]+/)\d+px-(.+)$", url)
    if m2:
        return f"{m2.group(1)}{width}px-{m2.group(2)}"
    return url

def fetch(url, tries=4):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": "JazeeraThumbs/1.0 (educational demo; contact test@example.com)"
            })
            with urllib.request.urlopen(req, timeout=45) as r:
                return r.read()
        except Exception as e:
            last = e
            time.sleep(3 + i * 4)
    raise last

data = json.load(open("/home/ubuntu/find_city_image_urls.json"))["results"]
done, fail = [], []
for row in data:
    inp = row["input"]
    url = row.get("output", {}).get("image_url", "")
    iata = CITY2IATA.get(inp) or INPUT2IATA.get(inp)
    if not iata or not url:
        continue
    path = os.path.join(OUT, iata + ".jpg")
    if os.path.exists(path) and os.path.getsize(path) > 2000:
        done.append(iata); continue
    try:
        raw = fetch(to_thumb(url, 320))
        im = Image.open(io.BytesIO(raw)).convert("RGB")
        w, h = im.size; s = min(w, h)
        im = im.crop(((w - s)//2, (h - s)//2, (w - s)//2 + s, (h - s)//2 + s)).resize((160,160), Image.LANCZOS)
        im.save(path, "JPEG", quality=82)
        done.append(iata)
        print("OK", iata, os.path.getsize(path))
        time.sleep(1.5)
    except Exception as e:
        fail.append((iata, inp, str(e)[:80]))
        print("FAIL", iata, str(e)[:80])
        time.sleep(2)

print("\n=== ok:", len(done), " fail:", len(fail))
for f in fail: print("  -", f)
