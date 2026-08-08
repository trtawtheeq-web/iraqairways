import math
import numpy as np
A = {
 'KWI': (29.2266, 47.9689),'DXB': (25.2532, 55.3657),'HBE': (30.9177, 29.6964),
 'BOM': (19.0887, 72.8679),'CAI': (30.1219, 31.4056),'IST': (41.2753, 28.7519),
 'LTN': (51.8747, -0.3683),'BAH': (26.2708, 50.6336),'ADJ':(31.7226,35.9932),
 'DAC':(23.8434,90.3978),'JED':(21.6796,39.1565),'DEL':(28.5562,77.1000),
 'AYT':(36.8987,30.8005),'TBS':(41.6692,44.9547),'DMM_AQI':(28.3352,46.1250),
}
def dist(a,b):
    R=6371; la1,lo1=A[a]; la2,lo2=A[b]
    dLat=math.radians(la2-la1); dLon=math.radians(lo2-lo1)
    h=math.sin(dLat/2)**2+math.cos(math.radians(la1))*math.cos(math.radians(la2))*math.sin(dLon/2)**2
    return 2*R*math.asin(math.sqrt(h))

dur = {'BAH':70,'DXB':135,'HBE':180,'BOM':260}
xs=np.array([dist('KWI',k) for k in dur]); ys=np.array([dur[k] for k in dur])

print("=== DURATION: speed model block = pad + dist/V*60 (linear lsq) ===")
# This is just linear; we already have linear a=0.0758 b=51.3
a,b=np.polyfit(xs,ys,1)
V=60/a
print("pad=%.1f min, V=%.1f km/h"%(b,V))
resid=[(k, dur[k]-(a*dist('KWI',k)+b)) for k in dur]
print("residuals:",[(k,round(r,1)) for k,r in resid])
print("max abs residual:",max(abs(r) for _,r in resid))
print("long-haul check (linear): LTN=%.0f DAC=%.0f DEL=%.0f"%(a*dist('KWI','LTN')+b, a*dist('KWI','DAC')+b, a*dist('KWI','DEL')+b))

# The linear residual at DXB is +19 (under-predicts). Try forcing through more weight.
# Use a slightly higher fixed pad and tuned speed by anchoring BAH and BOM (endpoints):
xb,yb=dist('KWI','BAH'),70; xm,ym=dist('KWI','BOM'),260
a2=(ym-yb)/(xm-xb); b2=yb-a2*xb
print("\nanchored BAH&BOM: pad=%.1f V=%.1f"%(b2,60/a2))
for k in dur:
    x=dist('KWI',k); print("  %s pred=%.1f obs=%d ->5:%d"%(k,a2*x+b2,dur[k],round((a2*x+b2)/5)*5))
print("long-haul: LTN=%d DAC=%d DEL=%d IST=%d CAI=%d"%(
  round((a2*dist('KWI','LTN')+b2)/5)*5, round((a2*dist('KWI','DAC')+b2)/5)*5,
  round((a2*dist('KWI','DEL')+b2)/5)*5, round((a2*dist('KWI','IST')+b2)/5)*5,
  round((a2*dist('KWI','CAI')+b2)/5)*5))

print("\n=== PRICE: linear with floor (anchored) ===")
pr = {'BAH':16,'DXB':23,'HBE':52,'BOM':57}
xs2=np.array([dist('KWI',k) for k in pr]); ys2=np.array([pr[k] for k in pr])
ap,bp=np.polyfit(xs2,ys2,1)
print("linear: a=%.6f b=%.3f"%(ap,bp))
for k in pr:
    x=dist('KWI',k); print("  %s pred=%.1f obs=%d"%(k,ap*x+bp,pr[k]))
print("predictions:")
for k in ['CAI','IST','LTN','DAC','JED','DEL','AYT','TBS','ADJ']:
    x=dist('KWI',k); v=ap*x+bp; print("  %s d=%d -> %.1f"%(k,round(x),v))
