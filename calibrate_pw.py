#!/usr/bin/env python3
"""Piecewise-linear interpolation for duration & price vs distance.
Anchored on real measured points; interpolates between, extrapolates beyond.
Target: within +/- 5% on anchors and physically monotonic everywhere.
"""
import math

A = {
    'KWI': (29.2266, 47.9689), 'DXB': (25.2532, 55.3657), 'HBE': (30.9177, 29.6964),
    'BOM': (19.0887, 72.8679), 'BAH': (26.2708, 50.6336), 'CAI': (30.1219, 31.4056),
    'IST': (41.2753, 28.7519), 'DAC': (23.8434, 90.3978), 'LTN': (51.8747, -0.3683),
    'DEL': (28.5562, 77.1000), 'AYT': (36.8987, 30.8005), 'JED': (21.6796, 39.1565),
}
def dist(a, b):
    R = 6371.0
    la1, lo1 = map(math.radians, A[a]); la2, lo2 = map(math.radians, A[b])
    dla = la2 - la1; dlo = lo2 - lo1
    h = math.sin(dla/2)**2 + math.cos(la1)*math.cos(la2)*math.sin(dlo/2)**2
    return 2*R*math.asin(math.sqrt(h))

def interp(x, pts):
    """piecewise linear; pts sorted by x. Extrapolate using end slopes."""
    pts = sorted(pts)
    if x <= pts[0][0]:
        (x0,y0),(x1,y1)=pts[0],pts[1]
        return y0 + (y1-y0)/(x1-x0)*(x-x0)
    if x >= pts[-1][0]:
        (x0,y0),(x1,y1)=pts[-2],pts[-1]
        return y1 + (y1-y0)/(x1-x0)*(x-x1)
    for i in range(len(pts)-1):
        x0,y0=pts[i]; x1,y1=pts[i+1]
        if x0 <= x <= x1:
            return y0 + (y1-y0)/(x1-x0)*(x-x0)

# DURATION anchors (km -> minutes) from real data
dur_anchors = [
    (dist('KWI','BAH'), 70),
    (dist('KWI','DXB'), 135),
    (dist('KWI','HBE'), 180),
    (dist('KWI','BOM'), 260),
]
print("=== DURATION piecewise ===")
for c, m in [('BAH',70),('DXB',135),('HBE',180),('BOM',260)]:
    x=dist('KWI',c); pred=interp(x,dur_anchors)
    print(f"  {c}: real={m} pred={pred:.0f} err={abs(pred-m)/m*100:.1f}%")
print("  far predictions:")
for c in ['CAI','IST','DEL','DAC','LTN','AYT','JED']:
    x=dist('KWI',c); p=interp(x,dur_anchors)
    p5=round(p/5)*5
    print(f"   {c} ({x:.0f}km): {p5} min = {p5//60}h{p5%60:02d}m")

# PRICE anchors (km -> KWD typical lowest)
price_anchors = [
    (dist('KWI','BAH'), 16),
    (dist('KWI','DXB'), 23),
    (dist('KWI','HBE'), 52),
    (dist('KWI','BOM'), 57),
]
print("\n=== PRICE piecewise ===")
for c, p in [('BAH',16),('DXB',23),('HBE',52),('BOM',57)]:
    x=dist('KWI',c); pred=interp(x,price_anchors)
    print(f"  {c}: real={p} pred={pred:.1f} err={abs(pred-p)/p*100:.1f}%")
# cross-check CAI/IST which are NOT anchors
print("  cross-check (not anchors):")
for c, real in [('CAI',30),('IST',60),('DEL',57)]:
    x=dist('KWI',c); pred=interp(x,price_anchors)
    print(f"   {c} ({x:.0f}km): pred={pred:.0f} real~{real} err={abs(pred-real)/real*100:.1f}%")
print("  far price predictions:")
for c in ['DAC','LTN']:
    x=dist('KWI',c); print(f"   {c} ({x:.0f}km): {interp(x,price_anchors):.0f} KWD")
