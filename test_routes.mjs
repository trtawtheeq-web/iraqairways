import { generateFlights, getAirport } from './client/src/lib/flightEngine.ts';

const destinations = ['EBL','KIK','ISU','NJF','BSR','BEY','AMD','AMM','AYT','BOM','CAI','CAN','CPH','DEL','DUS','DXB','ESB','FRA','GYD','IFN','IKA','ISB','IST','KHI','KUL','KWI','MCT','MHD','MUC','OSM','SAW','SHJ','SZF','TUN','TZX','VKO','BAH'];

const date = '2026-08-12';
const origin = 'BGW';

console.log(`Testing all routes from ${origin} on ${date}:\n`);
let allGood = true;
let total = 0;

for (const dest of destinations) {
  const airport = getAirport(dest);
  if (!airport) {
    console.log(`❌ ${dest} - Airport NOT FOUND in database`);
    allGood = false;
    continue;
  }
  const flights = generateFlights(origin, dest, date);
  total++;
  if (flights.length === 0) {
    console.log(`❌ ${origin} → ${dest} (${airport.city}) - NO FLIGHTS`);
    allGood = false;
  } else {
    const prices = flights.map(f => f.priceKWD);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    // IQD conversion (1 KWD ≈ 4250 IQD approximately, but we use the currency system)
    console.log(`✅ ${origin} → ${dest} (${airport.city}) - ${flights.length} flights, Duration: ${flights[0].duration}, Price range: ${minPrice}-${maxPrice} KWD, Flight#: ${flights[0].flightNumber}`);
  }
}

console.log(`\nTested ${total} routes. ${allGood ? '✅ ALL ROUTES WORKING!' : '❌ SOME ROUTES FAILED!'}`);
