# Real Jazeera samples (KWI origin) — collected 2026-06-25

Note: departure times vary per request (site is partly randomized). The reliable, stable values are:
- DURATION (block time) per route
- LOWEST FARE per day (calendar strip)

## KWI -> DXB (Dubai), distance ~853 km
Duration: **2h 15m** (consistent across all flights)
Real-time arrivals confirm: 06:55->10:10 (KWI UTC+3, DXB UTC+4 => clock +3h15m = block 2h15m + 1h tz) ✓
Calendar lowest fares (KWD): 27Jun=28, 28=25, 29=25, 30=23, 1Jul=28, 2=29, most Jul=23-24
Flight-card prices: 24.5, 27.5, 27.5
Lowest fare ~ **23-25 KWD**

## KWI -> HBE (Alexandria), distance ~1640 km
Duration: **3h 0m** (13:40->16:40, same tz UTC+3) ✓
Calendar lowest fares (KWD): 27Jun=79, 28=79, 29=85, 30=79, 1Jul=79, 2=80, then declines 8-10Jul~74-63, mid-late Jul ~52-56
Lowest fare ~ **79 KWD** (near-term), **52 KWD** (later)

## KWI -> BOM (Mumbai), distance ~2418 km
Duration: **4h 20m** (18:45->01:35+1, KWI UTC+3, BOM UTC+5:30 => clock 6h50m - 2:30 tz = block 4h20m) ✓
J9 401, fare-strip 84.840 (with fees), calendar base 85 (9Jul)
Calendar base fares: 1Jul=131, 2=121, 3=99, 4-6=91, 7-8=83, 9=85, 11=74, 12=68, 13=62, settles ~57

## DURATION CALIBRATION (block minutes from distance km)
Data points (great-circle approx):
- DXB  853 km -> 135 min
- HBE  1640 km -> 180 min
- BOM  2418 km -> 260 min

Fit duration = a*dist + b:
- (180-135)/(1640-853) = 45/787 = 0.05718 min/km
- (260-180)/(2418-1640) = 80/778 = 0.10283 min/km  -> NOT linear (longer routes slower-per-km? actually steeper)
Try two-segment / check with cruise speed model:
- block = taxi(b) + dist/speed*60
- DXB: 135 = b + 853/V*60
- BOM: 260 = b + 2418/V*60
  subtract: 125 = (2418-853)/V*60 = 1565*60/V => V = 93900/125 = 751 km/h
  b = 135 - 853/751*60 = 135 - 68.1 = 66.9 min
  check HBE: 66.9 + 1640/751*60 = 66.9 + 131 = 197.9 (~3h18m) vs actual 180 -> off by 18min
Better fit using least-squares on 3 points -> compute in script.
