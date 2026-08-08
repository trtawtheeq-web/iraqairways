import math
import numpy as np
A = {
 'KWI': (29.2266, 47.9689),'DXB': (25.2532, 55.3657),'HBE': (30.9177, 29.6964),
 'BOM': (19.0887, 72.8679),'CAI': (30.1219, 31.4056),'IST': (41.2753, 28.7519),
 'LTN': (51.8747, -0.3683),'BAH': (26.2708, 50.6336),'ADJ':(31.7226,35.9932),
 'DAC':(23.8434,90.3978),'JED':(21.6796,39.1565),'DEL':(28.5562,77.1000),
 'AYT':(36.8987,30.8005),'TBS':(41.6692,44.9547),
}
def dist(a,b):
    R=6371; la1,lo1=A[a]; la2,lo2=A[b]
    dLat=math.radians(la2-la1); dLon=math.radians(lo2-lo1)
    h=math.sin(dLat/2)**2+math.cos(math.radians(la1))*math.cos(math.radians(la2))*math.sin(dLon/2)**2
    return 2*R*math.asin(math.sqrt(h))

# DURATION: 4 points
dur = {'BAH':70,'DXB':135,'HBE':180,'BOM':260}
xs=np.array([dist('KWI',k) for k in dur]); ys=np.array([dur[k] for k in dur])

print("=== DURATION ===")
# Model 1: linear
a,b=np.polyfit(xs,ys,1)
print("linear: a=%.6f b=%.3f"%(a,b))
for k in dur:
    x=dist('KWI',k); print("  %s d=%d pred=%.1f obs=%d"%(k,round(x),a*x+b,dur[k]))
# Model 2: speed model block = pad + dist/V*60  -> linear in dist anyway, same as above
# Model 3: quadratic
c=np.polyfit(xs,ys,2)
print("quadratic: ",c)
def q(x): return c[0]*x*x+c[1]*x+c[2]
for k in dur:
    x=dist('KWI',k); print("  %s pred=%.1f obs=%d ->5:%d"%(k,q(x),dur[k],round(q(x)/5)*5))
print("predictions (quadratic ->5):")
for k in ['CAI','IST','LTN','DAC','JED','DEL','AYT','TBS','ADJ']:
    x=dist('KWI',k); print("  %s d=%d -> %d"%(k,round(x),round(q(x)/5)*5))

print("\n=== PRICE (base lowest stable fare) ===")
pr = {'BAH':16,'DXB':23,'HBE':52,'BOM':57}
xs2=np.array([dist('KWI',k) for k in pr]); ys2=np.array([pr[k] for k in pr])
ap,bp=np.polyfit(xs2,ys2,1)
print("linear: a=%.6f b=%.3f"%(ap,bp))
for k in pr:
    x=dist('KWI',k); print("  %s d=%d pred=%.1f obs=%d"%(k,round(x),ap*x+bp,pr[k]))
cp=np.polyfit(xs2,ys2,2)
print("quadratic:",cp)
def qp(x): return cp[0]*x*x+cp[1]*x+cp[2]
for k in pr:
    x=dist('KWI',k); print("  %s pred=%.1f obs=%d"%(k,qp(x),pr[k]))
print("price predictions (quadratic):")
for k in ['CAI','IST','LTN','DAC','JED','DEL','AYT','TBS','ADJ']:
    x=dist('KWI',k); print("  %s d=%d -> %.1f"%(k,round(x),qp(x)))
