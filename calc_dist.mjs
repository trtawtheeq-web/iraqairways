import { getAirport } from './client/src/lib/flightEngine.ts';

function distKm(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lon - a.lon) * Math.PI / 180;
  const x = Math.sin(dLat/2)**2 + Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}

const bgw = getAirport('BGW');
const dests = ['EBL','KIK','ISU','NJF','BSR','OSM','BEY','AMM','DXB','IST','CAI','SHJ','KWI','BAH','MCT','KUL','CAN','FRA','CPH','AYT','TZX','SZF','SAW','ESB','IKA','MHD','DEL','VKO'];
for (const d of dests) {
  const ap = getAirport(d);
  if (!ap) { console.log(d, 'NOT FOUND'); continue; }
  const km = Math.round(distKm(bgw, ap));
  console.log(d, ap.city, km, 'km');
}
