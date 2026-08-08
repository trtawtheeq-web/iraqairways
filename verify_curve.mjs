// Standalone re-implementation of the calibrated pricing to verify the curve.
const airports = {
  KWI:{lat:29.2266,lon:47.9689,utc:3},
  BAH:{lat:26.2708,lon:50.6336,utc:3},
  DXB:{lat:25.2532,lon:55.3657,utc:4},
  HBE:{lat:30.9177,lon:29.6964,utc:3},
  BOM:{lat:19.0887,lon:72.8679,utc:5.5},
  IST:{lat:41.2753,lon:28.7519,utc:3},
  LTN:{lat:51.8747,lon:-0.3683,utc:1},
};
const distanceKm=(a,b)=>{const R=6371,r=d=>d*Math.PI/180;const dLat=r(b.lat-a.lat),dLon=r(b.lon-a.lon),la1=r(a.lat),la2=r(b.lat);const h=Math.sin(dLat/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(h));};
const anchorsFare=[[420,16],[854,23],[1602,30],[1766,52],[2191,60],[2758,58]];
const baseFareFromKm=km=>{let raw;if(km<=anchorsFare[0][0]){const[[x0,y0],[x1,y1]]=[anchorsFare[0],anchorsFare[1]];raw=y0+((y1-y0)/(x1-x0))*(km-x0);}else if(km>=anchorsFare[anchorsFare.length-1][0]){const[xL,yL]=anchorsFare[anchorsFare.length-1];raw=yL+(km-xL)*0.012;}else{raw=anchorsFare[0][1];for(let i=0;i<anchorsFare.length-1;i++){const[x0,y0]=anchorsFare[i],[x1,y1]=anchorsFare[i+1];if(km>=x0&&km<=x1){raw=y0+((y1-y0)/(x1-x0))*(km-x0);break;}}}return Math.max(12,Math.min(190,Math.round(raw)));};

function price(origin,dest,daysAhead,depHour,dow){
  const km=distanceKm(airports[origin],airports[dest]);
  const baseFare=baseFareFromKm(km);
  const weekendUplift=(dow===4||dow===5||dow===6)?1.12:1.0;
  const apDays=Math.max(0,daysAhead);
  const apPeak=km<1200?0.55:km<3000?0.85:1.2;
  const apTau=8;
  const advanceUplift=1+apPeak*Math.exp(-apDays/apTau);
  let tod;
  if(depHour>=6&&depHour<9)tod=1.12;else if(depHour>=18&&depHour<22)tod=1.10;else if(depHour>=11&&depHour<15)tod=0.95;else tod=1.0;
  const dayFactor=1; // ignore tiny seed jitter for the curve view
  return Math.max(9,Math.round(baseFare*advanceUplift*weekendUplift*tod*dayFactor));
}

for(const [o,d] of [["KWI","BOM"],["KWI","HBE"],["KWI","DXB"],["KWI","BAH"]]){
  const km=distanceKm(airports[o],airports[d]);
  console.log(`\n=== ${o}->${d}  (${Math.round(km)} km, base=${baseFareFromKm(km)} KWD) ===`);
  console.log("advance-purchase curve (mid-day, weekday, off-peak hour=12):");
  for(const dd of [0,1,3,7,14,21,30,45,60]){
    console.log(`  day +${String(dd).padStart(2)} -> ${price(o,d,dd,12,1)} KWD`);
  }
  console.log("time-of-day at day+1 (weekday):");
  for(const h of [6,8,12,16,19,22]){
    console.log(`  ${String(h).padStart(2)}:00 -> ${price(o,d,1,h,1)} KWD`);
  }
}
console.log("\nReal references: BOM 1Jul=131 ->...-> ~57 settle | HBE 79 -> ~52 | DXB ~23-28 | BAH ~16-18");
