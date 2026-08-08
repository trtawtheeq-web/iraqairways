import math
A = {
 'KWI': (29.2266, 47.9689),'DXB': (25.2532, 55.3657),'HBE': (30.9177, 29.6964),
 'BOM': (19.0887, 72.8679),'CAI': (30.1219, 31.4056),'IST': (41.2753, 28.7519),
 'LTN': (51.8747, -0.3683),'BAH': (26.2708, 50.6336),'AMM_ADJ':(31.7226,35.9932),
 'DAC':(23.8434,90.3978),
}
def dist(a,b):
    R=6371; la1,lo1=A[a]; la2,lo2=A[b]
    dLat=math.radians(la2-la1); dLon=math.radians(lo2-lo1)
    h=math.sin(dLat/2)**2+math.cos(math.radians(la1))*math.cos(math.radians(la2))*math.sin(dLon/2)**2
    return 2*R*math.asin(math.sqrt(h))

obs = {'DXB':135,'HBE':180,'BOM':260}
pts=[(dist('KWI',k),obs[k]) for k in obs]

# Quadratic exact fit through 3 points: y = c2 x^2 + c1 x + c0
import numpy as np
X=np.array([[x*x,x,1] for x,_ in pts]); Y=np.array([y for _,y in pts])
c2,c1,c0=np.linalg.solve(X,Y)
print("quadratic: c2=%.8e c1=%.6f c0=%.4f"%(c2,c1,c0))
def qdur(x): return c2*x*x+c1*x+c0
for k in ['DXB','HBE','BOM','CAI','IST','BAH','DAC','LTN','AMM_ADJ']:
    x=dist('KWI',k); print(k, round(x), "dur=%.0f"%qdur(x), "->5:", round(qdur(x)/5)*5)
