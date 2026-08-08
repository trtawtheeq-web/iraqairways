// Verify the calibrated duration & price against real data by reimplementing
// the exact engine math (kept in sync with flightEngine.ts).
const coords = {
  KWI:[29.2266,47.9689],DXB:[25.2532,55.3657],HBE:[30.9177,29.6964],BOM:[19.0887,72.8679],
  BAH:[26.2708,50.6336],CAI:[30.1219,31.4056],IST:[41.2753,28.7519],DAC:[23.8434,90.3978],
  LTN:[51.8747,-0.3683],DEL:[28.5562,77.1000],JED:[21.6796,39.1565],RUH:[24.9576,46.6988],
  AYT:[36.8987,30.8005],DOH:[25.2731,51.6080],TBS:[41.6692,44.9547],BEY:[33.8209,35.4884],
};
function distanceKm(a,b){
  const R=6371,toRad=d=>d*Math.PI/180;
  const dLat=toRad(coords[b][0]-coords[a][0]),dLon=toRad(coords[b][1]-coords[a][1]);
  const la1=toRad(coords[a][0]),la2=toRad(coords[b][0]);
  const h=Math.sin(dLat/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}
function blockMinutes(km){
  const anchors=[[420,70],[854,135],[1766,180],[2758,260]];
  let raw;
  if(km<=anchors[0][0]){const[[x0,y0],[x1,y1]]=[anchors[0],anchors[1]];raw=y0+((y1-y0)/(x1-x0))*(km-x0);}
  else if(km>=anchors.at(-1)[0]){const[[x0,y0],[x1,y1]]=[anchors.at(-2),anchors.at(-1)];raw=y1+((y1-y0)/(x1-x0))*(km-x1);}
  else{raw=anchors[0][1];for(let i=0;i<anchors.length-1;i++){const[x0,y0]=anchors[i],[x1,y1]=anchors[i+1];if(km>=x0&&km<=x1){raw=y0+((y1-y0)/(x1-x0))*(km-x0);break;}}}
  raw=Math.max(45,raw);return Math.round(raw/5)*5;
}
function baseFareFromKm(km){
  const anchors=[[420,16],[854,23],[1602,30],[1766,52],[2191,60],[2758,58]];
  let raw;
  if(km<=anchors[0][0]){const[[x0,y0],[x1,y1]]=[anchors[0],anchors[1]];raw=y0+((y1-y0)/(x1-x0))*(km-x0);}
  else if(km>=anchors.at(-1)[0]){const[xL,yL]=anchors.at(-1);raw=yL+(km-xL)*0.012;}
  else{raw=anchors[0][1];for(let i=0;i<anchors.length-1;i++){const[x0,y0]=anchors[i],[x1,y1]=anchors[i+1];if(km>=x0&&km<=x1){raw=y0+((y1-y0)/(x1-x0))*(km-x0);break;}}}
  return Math.max(12,Math.min(190,Math.round(raw)));
}
const fmt=m=>`${Math.floor(m/60)}h${String(m%60).padStart(2,'0')}m`;
// Real measured values: [code, realDurMin, realFareKWD]
const real={BAH:[70,16],DXB:[135,23],HBE:[180,52],BOM:[260,57],CAI:[null,30],IST:[null,60],DEL:[null,57]};
console.log("route   dist   durPred  realDur  durErr   farePred realFare fareErr");
for(const c of ['BAH','DXB','CAI','HBE','IST','BOM','DEL','JED','RUH','AYT','DOH','TBS','BEY','DAC','LTN']){
  const km=distanceKm('KWI',c);
  const d=blockMinutes(km),f=baseFareFromKm(km);
  const rd=real[c]?.[0],rf=real[c]?.[1];
  const de=rd?((Math.abs(d-rd)/rd*100).toFixed(1)+'%'):'-';
  const fe=rf?((Math.abs(f-rf)/rf*100).toFixed(1)+'%'):'-';
  console.log(`${c.padEnd(5)} ${String(Math.round(km)).padStart(5)}  ${fmt(d).padStart(7)} ${(rd?fmt(rd):'-').padStart(8)} ${de.padStart(6)}   ${String(f).padStart(6)}  ${(rf??'-').toString().padStart(7)} ${fe.padStart(6)}`);
}
