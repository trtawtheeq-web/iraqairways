#!/usr/bin/env python3
"""Calibrate duration (block minutes) and base fare (KWD) from distance,
using the SAME coordinates the flight engine uses, against real Jazeera data.
Target accuracy: within +/- 5%.
"""
import math

# Coordinates copied from flightEngine.ts (lat, lon)
A = {
    'KWI': (29.2266, 47.9689),
    'DXB': (25.2532, 55.3657),
    'HBE': (30.9177, 29.6964),
    'BOM': (19.0887, 72.8679),
    'BAH': (26.2708, 50.6336),
    'CAI': (30.1219, 31.4056),
    'IST': (41.2753, 28.7519),
    'DAC': (23.8434, 90.3978),
    'LTN': (51.8747, -0.3683),
    'DEL': (28.5562, 77.1000),
}

def dist(a, b):
    R = 6371.0
    la1, lo1 = map(math.radians, A[a])
    la2, lo2 = map(math.radians, A[b])
    dla = la2 - la1
    dlo = lo2 - lo1
    h = math.sin(dla/2)**2 + math.cos(la1)*math.cos(la2)*math.sin(dlo/2)**2
    return 2*R*math.asin(math.sqrt(h))

# Real measured DURATION (block minutes) from the site
dur_points = [
    ('BAH', 70),    # 1h10
    ('DXB', 135),   # 2h15
    ('HBE', 180),   # 3h0
    ('BOM', 260),   # 4h20
]
print("=== Distances (engine coords) ===")
for code, _ in dur_points:
    print(f"  KWI-{code}: {dist('KWI', code):.0f} km")

print("\n=== DURATION calibration ===")
xs = [dist('KWI', c) for c, _ in dur_points]
ys = [m for _, m in dur_points]

# Linear least squares: block = a*km + b
n = len(xs)
sx = sum(xs); sy = sum(ys); sxx = sum(x*x for x in xs); sxy = sum(x*y for x, y in zip(xs, ys))
a = (n*sxy - sx*sy) / (n*sxx - sx*sx)
b = (sy - a*sx) / n
print(f"Linear: block = {a:.5f}*km + {b:.2f}")
maxerr = 0
for (c, m), x in zip(dur_points, xs):
    pred = a*x + b
    err = abs(pred-m)/m*100
    maxerr = max(maxerr, err)
    print(f"  {c}: real={m} pred={pred:.0f} err={err:.1f}%")
print(f"  max err = {maxerr:.1f}%")

# Predictions for far routes
print("\n  Far-route predictions (linear):")
for c in ['CAI','IST','DEL','DAC','LTN']:
    x = dist('KWI', c)
    print(f"   {c} ({x:.0f}km): {a*x+b:.0f} min = {int((a*x+b)//60)}h{int((a*x+b)%60):02d}m")

print("\n=== PRICE calibration ===")
# Real lowest base fares (KWD) - use stable/typical lowest, not promo outliers
price_points = [
    ('BAH', 16),
    ('DXB', 23),
    ('CAI', 30),   # CAI settles ~ high-20s/30s lowest (near-term higher)
    ('HBE', 52),
    ('IST', 60),
    ('BOM', 57),
]
pxs = [dist('KWI', c) for c, _ in price_points]
pys = [p for _, p in price_points]
n = len(pxs)
sx = sum(pxs); sy = sum(pys); sxx = sum(x*x for x in pxs); sxy = sum(x*y for x, y in zip(pxs, pys))
pa = (n*sxy - sx*sy) / (n*sxx - sx*sx)
pb = (sy - pa*sx) / n
print(f"Linear: fare = {pa:.5f}*km + {pb:.2f}")
for (c, p), x in zip(price_points, pxs):
    pred = pa*x + pb
    print(f"  {c}: real={p} pred={pred:.1f} err={abs(pred-p)/p*100:.1f}%")
print("\n  Far-route price predictions (linear):")
for c in ['DEL','DAC','LTN']:
    x = dist('KWI', c)
    print(f"   {c} ({x:.0f}km): {pa*x+pb:.0f} KWD")
