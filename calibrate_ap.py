import numpy as np
# BOM real series (day index from "today"=~1 Jul as day0): fare
# We treat day0=1Jul. settle ~57.
bom = {0:131,1:121,2:99,3:91,4:91,5:91,6:83,7:83,8:85,10:74,11:68,12:62}
bom_settle = 57
# HBE: near ~79 settling ~52
hbe = {0:79,1:79,2:85,3:79,4:79,5:80,9:63,12:56}
hbe_settle = 52

def fit(series, settle):
    ds = np.array(sorted(series.keys()),dtype=float)
    ratio = np.array([series[int(d)]/settle for d in ds])  # multiplier over settle
    # model: ratio = 1 + peak*exp(-d/tau)
    best=None
    for tau in np.linspace(2,30,200):
        for peak in np.linspace(0.1,2.0,200):
            pred = 1+peak*np.exp(-ds/tau)
            err = np.mean((pred-ratio)**2)
            if best is None or err<best[0]:
                best=(err,tau,peak)
    return best

for name,series,settle in [("BOM",bom,bom_settle),("HBE",hbe,hbe_settle)]:
    err,tau,peak = fit(series,settle)
    print(f"{name}: tau={tau:.1f} peak={peak:.2f} rmse={err**0.5:.3f}")
    ds=sorted(series.keys())
    for d in ds:
        pred=settle*(1+peak*np.exp(-d/tau))
        print(f"   d={d:2d} real={series[d]:3d} pred={pred:5.1f}")

# Combined compromise values
print("\nSuggested combined: peak~1.0-1.3, tau~7-10 days (settles after ~3-4 weeks)")
for tau in [7,9,11]:
    for peak in [0.9,1.1,1.3]:
        print(f"  tau={tau} peak={peak}: d0={1+peak:.2f}x d7={1+peak*np.exp(-7/tau):.2f}x d14={1+peak*np.exp(-14/tau):.2f}x d30={1+peak*np.exp(-30/tau):.2f}x")
