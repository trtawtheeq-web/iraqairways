import math

# Coordinates copied from flightEngine.ts (must match exactly)
A = {
 'KWI': (29.2266, 47.9689),
 'DXB': (25.2532, 55.3657),
 'HBE': (30.9177, 29.6964),
 'BOM': (19.0887, 72.8679),
 'CAI': (30.1219, 31.4056),
 'IST': (41.2753, 28.7519),
 'LTN': (51.8747, -0.3683),
 'BAH': (26.2708, 50.6336),
}

def dist(a,b):
    R=6371
    la1,lo1=A[a]; la2,lo2=A[b]
    import math
    dLat=math.radians(la2-la1); dLon=math.radians(lo2-lo1)
    h=math.sin(dLat/2)**2+math.cos(math.radians(la1))*math.cos(math.radians(la2))*math.sin(dLon/2)**2
    return 2*R*math.asin(math.sqrt(h))

# Distances from KWI
for d in ['DXB','HBE','BOM','CAI','IST','LTN','BAH']:
    print(d, round(dist('KWI',d)))

print("---- DURATION FIT ----")
# Observed block minutes
obs = {'DXB':135,'HBE':180,'BOM':260}
xs=[dist('KWI',k) for k in obs]; ys=[obs[k] for k in obs]
# least squares linear y = a*x + b
n=len(xs); sx=sum(xs); sy=sum(ys); sxx=sum(x*x for x in xs); sxy=sum(x*y for x,y in zip(xs,ys))
a=(n*sxy-sx*sy)/(n*sxx-sx*sx); b=(sy-a*sx)/n
print("linear a=%.6f b=%.3f"%(a,b))
for k in obs:
    x=dist('KWI',k); pred=a*x+b
    print(k, round(x), "pred=%.1f"%pred, "obs=%d"%obs[k])
# rounded to nearest 5
print("rounded5:")
for k in obs:
    x=dist('KWI',k); pred=round((a*x+b)/5)*5
    print(k, "pred5=%d"%pred, "obs=%d"%obs[k])

print("---- PRICE FIT (base lowest fare) ----")
# Observed lowest base fares (calendar): use stable near-term lows
pobs = {'DXB':23,'HBE':52,'BOM':57}  # settled lows
# but near-term: DXB 23-25, HBE 79->52, BOM 131->57. Use settled stable lows for base.
xs=[dist('KWI',k) for k in pobs]; ys=[pobs[k] for k in pobs]
n=len(xs); sx=sum(xs); sy=sum(ys); sxx=sum(x*x for x in xs); sxy=sum(x*y for x,y in zip(xs,ys))
a2=(n*sxy-sx*sy)/(n*sxx-sx*sx); b2=(sy-a2*sx)/n
print("linear a=%.6f b=%.3f"%(a2,b2))
for k in pobs:
    x=dist('KWI',k); print(k, round(x), "pred=%.1f"%(a2*x+b2), "obs=%d"%pobs[k])
print("predict others:")
for k in ['CAI','IST','LTN','BAH']:
    x=dist('KWI',k); print(k, round(x), "pred=%.1f"%(a2*x+b2))
