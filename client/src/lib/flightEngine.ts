// =============================================================================
// Jazeera Airways – realistic flight engine
// -----------------------------------------------------------------------------
// Everything here is computed so the numbers are *logical and consistent*:
//   • Flight DURATION is derived from the real great-circle distance between the
//     two airports + a realistic Airbus A320/A320neo cruise speed + taxi/climb
//     padding. (Jazeera operates an all-A320 family fleet.)
//   • ARRIVAL TIME is the local departure time + flight duration, corrected by
//     the real UTC offset difference between the two airports (so crossing time
//     zones shows the correct local arrival, e.g. westbound can "gain" hours).
//   • PRICE scales with distance within a realistic band and varies by day in a
//     deterministic way (same search => same result), with weekend uplift.
//   • FLIGHT NUMBERS use Jazeera's real J9 numbering bands per region.
// =============================================================================

export interface Airport {
  iata: string;
  city: string;
  lat: number;   // degrees
  lon: number;   // degrees
  /** Standard UTC offset in hours (DST handled coarsely where relevant). */
  utc: number;
}

// Coordinates + UTC offsets for every destination in the Jazeera network.
// (KWI = Kuwait hub.) Offsets reflect the local standard/most-of-year value.
export const airports: Airport[] = [
  { iata: 'KWI', city: 'Kuwait',                lat: 29.2266, lon: 47.9689, utc: 3 },
  { iata: 'CAI', city: 'Cairo',                 lat: 30.1219, lon: 31.4056, utc: 3 },
  { iata: 'DXB', city: 'Dubai',                 lat: 25.2532, lon: 55.3657, utc: 4 },
  { iata: 'DAM', city: 'Damascus',              lat: 33.4114, lon: 36.5156, utc: 3 },
  { iata: 'HMB', city: 'Sohag',                 lat: 26.3428, lon: 31.7427, utc: 3 },
  { iata: 'BOM', city: 'Mumbai',                lat: 19.0887, lon: 72.8679, utc: 5.5 },
  { iata: 'RUH', city: 'Riyadh',                lat: 24.9576, lon: 46.6988, utc: 3 },
  { iata: 'DAC', city: 'Dhaka',                 lat: 23.8434, lon: 90.3978, utc: 6 },
  { iata: 'HBE', city: 'Alexandria',            lat: 30.9177, lon: 29.6964, utc: 3 },
  { iata: 'BAH', city: 'Bahrain',               lat: 26.2708, lon: 50.6336, utc: 3 },
  { iata: 'JED', city: 'Jeddah',                lat: 21.6796, lon: 39.1565, utc: 3 },
  { iata: 'COK', city: 'Kochi',                 lat: 10.1520, lon: 76.4019, utc: 5.5 },
  { iata: 'IST', city: 'Istanbul',              lat: 41.2753, lon: 28.7519, utc: 3 },
  { iata: 'DEL', city: 'Delhi',                 lat: 28.5562, lon: 77.1000, utc: 5.5 },
  { iata: 'BEY', city: 'Beirut',                lat: 33.8209, lon: 35.4884, utc: 3 },
  { iata: 'CMB', city: 'Colombo',               lat: 7.1808,  lon: 79.8841, utc: 5.5 },
  { iata: 'KTM', city: 'Kathmandu',             lat: 27.6966, lon: 85.3591, utc: 5.75 },
  { iata: 'ATZ', city: 'Asyut',                 lat: 27.0465, lon: 31.0119, utc: 3 },
  { iata: 'AUH', city: 'Abu Dhabi',             lat: 24.4330, lon: 54.6511, utc: 4 },
  { iata: 'SAW', city: 'Istanbul (Sabiha)',     lat: 40.8986, lon: 29.3092, utc: 3 },
  { iata: 'SPX', city: 'Giza/Sphinx',           lat: 30.1050, lon: 30.8939, utc: 3 },
  { iata: 'HYD', city: 'Hyderabad',             lat: 17.2403, lon: 78.4294, utc: 5.5 },
  { iata: 'DOH', city: 'Doha',                  lat: 25.2731, lon: 51.6080, utc: 3 },
  { iata: 'BLR', city: 'Bengaluru',             lat: 13.1986, lon: 77.7066, utc: 5.5 },
  { iata: 'MAA', city: 'Chennai',               lat: 12.9941, lon: 80.1709, utc: 5.5 },
  { iata: 'AMD', city: 'Ahmedabad',             lat: 23.0772, lon: 72.6347, utc: 5.5 },
  { iata: 'TRV', city: 'Thiruvananthapuram',    lat: 8.4821,  lon: 76.9200, utc: 5.5 },
  { iata: 'LXR', city: 'Luxor',                 lat: 25.6710, lon: 32.7066, utc: 3 },
  { iata: 'OSS', city: 'Osh',                   lat: 40.6090, lon: 72.7930, utc: 6 },
  { iata: 'ADJ', city: 'Amman',                 lat: 31.7226, lon: 35.9932, utc: 3 },
  { iata: 'TZX', city: 'Trabzon',               lat: 40.9951, lon: 39.7897, utc: 3 },
  { iata: 'LHE', city: 'Lahore',                lat: 31.5216, lon: 74.4036, utc: 5 },
  { iata: 'ISB', city: 'Islamabad',             lat: 33.5607, lon: 72.8516, utc: 5 },
  { iata: 'SSH', city: 'Sharm el Sheikh',       lat: 27.9773, lon: 34.3950, utc: 3 },
  { iata: 'AYT', city: 'Antalya',               lat: 36.8987, lon: 30.8005, utc: 3 },
  { iata: 'MED', city: 'Madinah',               lat: 24.5534, lon: 39.7051, utc: 3 },
  { iata: 'NMA', city: 'Namangan',              lat: 40.9846, lon: 71.5567, utc: 5 },
  { iata: 'PRG', city: 'Prague',                lat: 50.1008, lon: 14.2600, utc: 2 },
  { iata: 'ALA', city: 'Almaty',                lat: 43.3521, lon: 77.0405, utc: 5 },
  { iata: 'TBS', city: 'Tbilisi',               lat: 41.6692, lon: 44.9547, utc: 4 },
  { iata: 'DME', city: 'Moscow',                lat: 55.4088, lon: 37.9063, utc: 3 },
  { iata: 'FRU', city: 'Bishkek',               lat: 43.0613, lon: 74.4776, utc: 6 },
  { iata: 'KRK', city: 'Krakow',                lat: 50.0777, lon: 19.7848, utc: 2 },
  { iata: 'GYD', city: 'Baku',                  lat: 40.4675, lon: 50.0467, utc: 4 },
  { iata: 'HAS', city: 'Hail',                  lat: 27.4379, lon: 41.6863, utc: 3 },
  { iata: 'ELQ', city: 'Gassim',                lat: 26.3028, lon: 43.7744, utc: 3 },
  { iata: 'EVN', city: 'Yerevan',               lat: 40.1473, lon: 44.3959, utc: 4 },
  { iata: 'SJJ', city: 'Sarajevo',              lat: 43.8246, lon: 18.3315, utc: 2 },
  { iata: 'TIF', city: 'Taif',                  lat: 21.4834, lon: 40.5435, utc: 3 },
  { iata: 'TIV', city: 'Tivat',                 lat: 42.4047, lon: 18.7233, utc: 2 },
  { iata: 'ALP', city: 'Aleppo',                lat: 36.1807, lon: 37.2244, utc: 3 },
  { iata: 'AAN', city: 'Al Ain',                lat: 24.2617, lon: 55.6092, utc: 4 },
  { iata: 'DYU', city: 'Dushanbe',              lat: 38.5433, lon: 68.8250, utc: 5 },
  { iata: 'KHI', city: 'Karachi',               lat: 24.9065, lon: 67.1608, utc: 5 },
  { iata: 'BUD', city: 'Budapest',              lat: 47.4369, lon: 19.2556, utc: 2 },
  { iata: 'LCA', city: 'Larnaca',               lat: 34.8751, lon: 33.6249, utc: 3 },
  { iata: 'BUS', city: 'Batumi',                lat: 41.6103, lon: 41.5997, utc: 4 },
  { iata: 'BGY', city: 'Milan (Bergamo)',       lat: 45.6739, lon: 9.7042,  utc: 2 },
  { iata: 'HRG', city: 'Hurghada',              lat: 27.1783, lon: 33.7994, utc: 3 },
  { iata: 'SLL', city: 'Salalah',               lat: 17.0387, lon: 54.0913, utc: 4 },
  { iata: 'AER', city: 'Sochi',                 lat: 43.4499, lon: 39.9566, utc: 3 },
  { iata: 'TAS', city: 'Tashkent',              lat: 41.2579, lon: 69.2812, utc: 5 },
  { iata: 'AHB', city: 'Abha',                  lat: 18.2404, lon: 42.6566, utc: 3 },
  { iata: 'LTN', city: 'London (Luton)',        lat: 51.8747, lon: -0.3683, utc: 1 },
  // --- Additional network airports (match original site list) ---
  { iata: 'ADD', city: 'Addis Ababa',           lat: 8.9779,  lon: 38.7993, utc: 3 },
  { iata: 'BGW', city: 'Baghdad',               lat: 33.2625, lon: 44.2346, utc: 3 },
  { iata: 'BWA', city: 'Bhairahawa',            lat: 27.5056, lon: 83.4163, utc: 5.75 },
  { iata: 'BSZ', city: 'Bishkek',               lat: 43.0613, lon: 74.4776, utc: 6 },
  { iata: 'DMM', city: 'Dammam',                lat: 26.4712, lon: 49.7979, utc: 3 },
  { iata: 'EBL', city: 'Erbil',                 lat: 36.2376, lon: 43.9632, utc: 3 },
  { iata: 'FEG', city: 'Fergana',               lat: 40.3588, lon: 71.7450, utc: 5 },
  { iata: 'GRV', city: 'Groznyy',               lat: 43.3883, lon: 45.6986, utc: 3 },
  { iata: 'IKA', city: 'Tehran',                lat: 35.4161, lon: 51.1522, utc: 3.5 },
  { iata: 'KZN', city: 'Kazan',                 lat: 55.6063, lon: 49.2787, utc: 3 },
  { iata: 'MCX', city: 'Makhachkala',           lat: 42.8168, lon: 47.6523, utc: 3 },
  { iata: 'MHD', city: 'Mashhad',               lat: 36.2351, lon: 59.6410, utc: 3.5 },
  { iata: 'MLE', city: 'Male',                  lat: 4.1918,  lon: 73.5291, utc: 5 },
  { iata: 'NAL', city: 'Nalchik',               lat: 43.5129, lon: 43.6366, utc: 3 },
  { iata: 'NJF', city: 'Najaf',                 lat: 31.9897, lon: 44.4044, utc: 3 },
  { iata: 'SYZ', city: 'Shiraz',                lat: 29.5392, lon: 52.5898, utc: 3.5 },
  { iata: 'HSA', city: 'Turkistan',             lat: 43.3133, lon: 68.1467, utc: 5 },
  { iata: 'VOG', city: 'Volgograd',             lat: 48.7825, lon: 44.3455, utc: 3 },
  { iata: 'AQI', city: 'Qaisumah',              lat: 28.3352, lon: 46.1250, utc: 3 },
  // --- Iraqi domestic airports ---
  { iata: 'KIK', city: 'Kirkuk',                lat: 35.4681, lon: 44.3489, utc: 3 },
  { iata: 'ISU', city: 'Sulaymaniyah',           lat: 35.5617, lon: 45.3167, utc: 3 },
  { iata: 'BSR', city: 'Basra',                  lat: 30.5491, lon: 47.6621, utc: 3 },
  { iata: 'OSM', city: 'Mosul',                  lat: 36.3058, lon: 43.1474, utc: 3 },
  // --- International airports missing ---
  { iata: 'AMM', city: 'Amman',                  lat: 31.7226, lon: 35.9932, utc: 3 },
  { iata: 'CAN', city: 'Guangzhou',              lat: 23.3924, lon: 113.2988, utc: 8 },
  { iata: 'CPH', city: 'Copenhagen',             lat: 55.6180, lon: 12.6508, utc: 2 },
  { iata: 'DUS', city: 'Dusseldorf',             lat: 51.2895, lon: 6.7668, utc: 2 },
  { iata: 'ESB', city: 'Ankara',                 lat: 40.1281, lon: 32.9951, utc: 3 },
  { iata: 'FRA', city: 'Frankfurt',              lat: 50.0379, lon: 8.5622, utc: 2 },
  { iata: 'IFN', city: 'Isfahan',                lat: 32.7508, lon: 51.8613, utc: 3.5 },
  { iata: 'KUL', city: 'Kuala Lumpur',           lat: 2.7456, lon: 101.7099, utc: 8 },
  { iata: 'MCT', city: 'Muscat',                 lat: 23.5933, lon: 58.2844, utc: 4 },
  { iata: 'MUC', city: 'Munich',                 lat: 48.3538, lon: 11.7861, utc: 2 },
  { iata: 'SHJ', city: 'Sharjah',                lat: 25.3286, lon: 55.5172, utc: 4 },
  { iata: 'SZF', city: 'Samsun',                 lat: 41.2545, lon: 36.5671, utc: 3 },
  { iata: 'TUN', city: 'Tunis',                  lat: 36.8510, lon: 10.2272, utc: 1 },
  { iata: 'VKO', city: 'Moscow',                 lat: 55.5915, lon: 37.2615, utc: 3 },
  { iata: 'BAH', city: 'Bahrain',                lat: 26.2708, lon: 50.6336, utc: 3 },
];

// -----------------------------------------------------------------------------
// Backwards-compatible "Route" view (some components import jazeeraRoutes).
// -----------------------------------------------------------------------------
export interface Route {
  iata: string;
  city: string;
  durationMinutes: number;  // nominal KWI<->dest block time (for legacy callers)
  basePriceKWD: number;
}

const KWI = airports.find(a => a.iata === 'KWI')!;

/** Great-circle distance (km) using the haversine formula. */
export const distanceKm = (a: Airport, b: Airport): number => {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

/**
 * Realistic A320-family block time (minutes) for a given distance.
 *
 * Calibrated against REAL jazeeraairways.com schedule block times (great-circle
 * distance using the same coordinates as below):
 *   • KWI-BAH   420 km -> 1h10m (70 min)
 *   • KWI-DXB   854 km -> 2h15m (135 min)
 *   • KWI-HBE  1766 km -> 3h00m (180 min)
 *   • KWI-BOM  2758 km -> 4h20m (260 min)
 * A piecewise-linear interpolation through these anchors reproduces the real
 * block time within a few minutes and stays physically monotonic for every
 * other sector (e.g. CAI 2h50m, IST 3h35m, DEL 4h25m, LTN ~6h55m). Result is
 * rounded to the nearest 5 minutes like published schedules.
 */
// Real non-stop scheduled block times (minutes) for routes touching the Kuwait
// hub (KWI <-> destination). Collected from public flight sources (Google
// Flights, FlightAware, FlightConnections, airline timetables) and verified
// against the original jazeeraairways.com results page so the displayed
// "Direct • Xh Ym" matches the real site exactly. Arrival time is then computed
// as departure + this block time + the timezone difference, identical to the
// original site's behaviour.
export const KWI_BLOCK_MINUTES: Record<string, number> = {
    AAN: 155, ADD: 250, ADJ: 125, AER: 170, AHB: 135, ALA: 250, ALP: 165, AMD: 220,
    AQI: 45, ATZ: 175, AUH: 100, AYT: 215, BAH: 65, BEY: 145, BGW: 60, BGY: 370,
    BLR: 280, BOM: 265, BSZ: 235, BUD: 310, BUS: 155, BWA: 280, CAI: 170, CMB: 330,
    COK: 310, DAC: 335, DAM: 140, DEL: 270, DME: 305, DMM: 75, DOH: 85, DXB: 105,
    DYU: 195, EBL: 95, ELQ: 70, EVN: 140, FEG: 210, FRU: 235, GRV: 149, GYD: 240,
    HAS: 80, HBE: 195, HMB: 175, HRG: 165, HSA: 210, HYD: 275, IKA: 115, ISB: 225,
    IST: 245, JED: 150, KHI: 235, KRK: 320, KTM: 290, KZN: 255, LCA: 165, LHE: 215,
    LTN: 410, LXR: 150, MAA: 290, MCX: 155, MED: 120, MHD: 145, MLE: 320, NAL: 180,
    NJF: 85, NMA: 215, OSS: 215, PRG: 325, RUH: 80, SAW: 240, SJJ: 285, SLL: 185,
    SPX: 185, SSH: 165, SYZ: 75, TAS: 215, TBS: 155, TIF: 125, TIV: 265, TRV: 355,
    TZX: 155, VOG: 220,
};

// Real Iraqi Airways block times from BGW (minutes) - based on actual schedules
// Real Iraqi Airways block times from BGW (minutes) - from actual 10 June 2026 schedule
export const BGW_BLOCK_MINUTES: Record<string, number> = {
    // Domestic (same timezone UTC+3)
    KIK: 30, ISU: 45, EBL: 60, BSR: 60, NJF: 50, OSM: 45,
    // Regional Middle East
    BEY: 90, AMM: 90, KWI: 60, BAH: 90,
    // Gulf (UTC+4, add 1h apparent)
    DXB: 215, SHJ: 210, MCT: 180,
    // Turkey (same timezone UTC+3)
    IST: 180, SAW: 165, AYT: 150, TZX: 120, SZF: 130, ESB: 150,
    // Egypt (same timezone UTC+3 in summer)
    CAI: 150,
    // Iran (UTC+3.5)
    IKA: 90, MHD: 135, IFN: 90,
    // Caucasus
    GYD: 150,
    // South Asia
    DEL: 270, BOM: 255, ISB: 210, KHI: 195, AMD: 255,
    // Far East
    KUL: 480, CAN: 450,
    // Europe
    CPH: 330, FRA: 300, MUC: 285, DUS: 300,
    // Other
    VKO: 240, TUN: 240,
};

/**
 * Real non-stop block time (minutes) for a given distance, used ONLY as a
 * fallback for city pairs that do not touch the Kuwait hub. Calibrated by
 * least-squares on all 82 real KWI routes: minutes ≈ 52 + 0.0723 * km
 * (≈ 830 km/h cruise + ~30 min taxi/climb/descent). Rounded to the nearest 5.
 */
export const blockMinutes = (km: number): number => {
  const raw = Math.max(40, 51.9 + 0.07232 * km);
  return Math.round(raw / 5) * 5;
};

/**
 * Exact block time (minutes) for an origin/destination pair. If either endpoint
 * is the Kuwait hub, use the real measured table (matches the original site
 * exactly). Otherwise fall back to the calibrated distance model.
 */
export const routeBlockMinutes = (origin: string, destination: string, km: number): number => {
  // Iraqi Airways hub: BGW
  if (origin === 'BGW' && BGW_BLOCK_MINUTES[destination] !== undefined) {
    return BGW_BLOCK_MINUTES[destination];
  }
  if (destination === 'BGW' && BGW_BLOCK_MINUTES[origin] !== undefined) {
    return BGW_BLOCK_MINUTES[origin];
  }
  if (origin === 'KWI' && KWI_BLOCK_MINUTES[destination] !== undefined) {
    return KWI_BLOCK_MINUTES[destination];
  }
  if (destination === 'KWI' && KWI_BLOCK_MINUTES[origin] !== undefined) {
    return KWI_BLOCK_MINUTES[origin];
  }
  return blockMinutes(km);
};

/** Realistic one-way base fare (IQD) from distance, calibrated against real Iraqi Airways prices.
 *  Returns price in IQD directly (no KWD conversion needed).
 *  Real data points:
 *    BGW-BEY  1000km -> 257,096 IQD
 *    BGW-DXB  1400km -> 284,270 IQD
 *    BGW-AMM   800km -> 301,300 IQD
 *    BGW-IST  2000km -> 374,660 IQD
 *    BGW-MCT  1700km -> 586,880 IQD
 *    BGW-KUL  7500km -> 665,480 IQD
 */
const baseFareFromKm = (km: number): number => {
  // Iraqi Airways real pricing anchors (km -> IQD base economy fare)
  const anchors: [number, number][] = [
    [160, 120000],    // NJF domestic short
    [350, 150000],    // EBL/OSM domestic
    [500, 170000],    // BSR domestic
    [800, 230000],    // AMM regional
    [1000, 257000],   // BEY
    [1400, 285000],   // DXB
    [2000, 375000],   // IST
    [3500, 500000],   // DEL/MUC
    [5000, 590000],   // MCT far
    [7500, 665000],   // KUL/CAN
  ];
  let raw: number;
  if (km <= anchors[0][0]) {
    raw = anchors[0][1];
  } else if (km >= anchors[anchors.length - 1][0]) {
    const [xL, yL] = anchors[anchors.length - 1];
    raw = yL + (km - xL) * 30; // gentle growth beyond
  } else {
    raw = anchors[0][1];
    for (let i = 0; i < anchors.length - 1; i++) {
      const [x0, y0] = anchors[i];
      const [x1, y1] = anchors[i + 1];
      if (km >= x0 && km <= x1) {
        raw = y0 + ((y1 - y0) / (x1 - x0)) * (km - x0);
        break;
      }
    }
  }
  return Math.max(80000, Math.min(900000, Math.round(raw / 100) * 100));
};

export const getAirport = (iata: string): Airport | undefined =>
  airports.find(a => a.iata === iata);

// Legacy export: nominal KWI<->dest figures, computed from real geography.
export const jazeeraRoutes: Route[] = airports
  .filter(a => a.iata !== 'KWI')
  .map(a => {
    const km = distanceKm(KWI, a);
    return {
      iata: a.iata,
      city: a.city,
      durationMinutes: routeBlockMinutes('KWI', a.iata, km),
      basePriceKWD: baseFareFromKm(km),
    };
  });

export interface Flight {
  id: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  /** Set when the flight lands on the day after departure (local). */
  arrivesNextDay?: boolean;
  priceKWD: number;
  aircraft: string;
  fareClass: 'Light' | 'Value' | 'Extra';
  /** Boarding gate at Terminal 5 (Kuwait departures) or destination terminal. */
  gate: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
const formatHM = (totalMinutes: number) => {
  const m = ((totalMinutes % 1440) + 1440) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
};
const formatDuration = (minutes: number) => `${Math.floor(minutes / 60)}h ${pad(minutes % 60)}m`;

// Deterministic seed from a string (stable per search).
const seedFrom = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

/**
 * Real Jazeera J9 numbering bands keyed by region of the non-KWI endpoint.
 * Outbound (from hub side) uses the odd/base number; the inbound uses +1.
 */
const flightNumberBand = (iata: string): number => {
  const gulf: Record<string, number> = { BAH: 101, DOH: 115, DXB: 121, AUH: 131, AAN: 135, SLL: 145 };
  if (gulf[iata]) return gulf[iata];
  const ksa: Record<string, number> = { RUH: 201, JED: 205, MED: 211, AHB: 215, TIF: 219, HAS: 223, ELQ: 227, HBE: 0 };
  if (ksa[iata]) return ksa[iata];
  const levantTurkey: Record<string, number> = { BEY: 251, DAM: 255, ALP: 259, ADJ: 263, IST: 401, SAW: 405, AYT: 409, TZX: 413, LCA: 417 };
  if (levantTurkey[iata]) return levantTurkey[iata];
  const egypt: Record<string, number> = { CAI: 421, HBE: 425, ATZ: 429, SPX: 433, LXR: 437, HMB: 441, SSH: 445, HRG: 449 };
  if (egypt[iata]) return egypt[iata];
  const india: Record<string, number> = { BOM: 531, DEL: 535, COK: 539, HYD: 543, BLR: 547, MAA: 551, AMD: 555, TRV: 559, DAC: 563, CMB: 567, KTM: 571, KHI: 575, LHE: 579, ISB: 583 };
  if (india[iata]) return india[iata];
  const cis: Record<string, number> = { GYD: 601, TBS: 605, EVN: 609, BUS: 613, ALA: 617, TAS: 621, FRU: 625, OSS: 629, NMA: 633, DYU: 637, DME: 641, AER: 645 };
  if (cis[iata]) return cis[iata];
  const europe: Record<string, number> = { PRG: 37, KRK: 41, BUD: 45, SJJ: 49, TIV: 53, BGY: 57, LTN: 61 };
  if (europe[iata]) return europe[iata];
  return 700; // fallback band
};

/**
 * Generate a realistic set of daily flights for origin -> destination on a date.
 * Times are local; arrival is timezone-corrected from the real distance.
 */
export const generateFlights = (origin: string, destination: string, dateStr: string): Flight[] => {
  const from = getAirport(origin);
  const to = getAirport(destination);
  if (!from || !to || origin === destination) return [];

  const km = distanceKm(from, to);
  const block = routeBlockMinutes(origin, destination, km);
  const baseFare = baseFareFromKm(km);

  // ----- Operating days: not every route flies every day -----
  // A route operates only on a fixed subset of weekdays, derived from a
  // route-stable seed (independent of the date) so the schedule is consistent.
  // Short Gulf sectors operate (almost) daily; long-haul flies a few days/week.
  const routeSeed = seedFrom(`${origin}-${destination}`);
  const dowCheck = new Date(dateStr + 'T00:00:00').getDay(); // 0 Sun .. 6 Sat
  let operatingDays: number; // how many days per week this route operates
  if (km < 1200) operatingDays = 7;            // short haul: daily
  else if (km < 3000) operatingDays = 5 + (routeSeed % 2); // medium: 5-6 days/week
  else operatingDays = 3 + (routeSeed % 2);    // long haul: 3-4 days/week
  // The first 30 days from today always have flights every day; no-flight
  // days only start from the second month onward.
  const today0 = new Date(); today0.setHours(0, 0, 0, 0);
  const target0 = new Date(dateStr + 'T00:00:00');
  const daysFromToday = Math.floor((target0.getTime() - today0.getTime()) / 86400000);
  if (operatingDays < 7 && daysFromToday >= 30) {
    // Build a stable set of operating weekdays for this route.
    const allDays = [0, 1, 2, 3, 4, 5, 6];
    // Deterministic shuffle based on routeSeed.
    for (let k = allDays.length - 1; k > 0; k--) {
      const j = (routeSeed >> (k % 16)) % (k + 1);
      const tmp = allDays[k]; allDays[k] = allDays[j]; allDays[j] = tmp;
    }
    const activeDays = new Set(allDays.slice(0, operatingDays));
    if (!activeDays.has(dowCheck)) return []; // no flights on this day
  }

  // Frequency: Iraqi Airways realistic schedule.
  const seed = seedFrom(`${origin}-${destination}-${dateStr}`);
  let numFlights: number;
  if (km < 600) numFlights = 2 + (seed % 2);         // 2-3 domestic
  else if (km < 1500) numFlights = 1 + (seed % 2);   // 1-2 regional
  else numFlights = 1;                               // 1 long haul

  // Weekend (Thu/Fri/Sat) demand uplift for fares.
  const dow = new Date(dateStr + 'T00:00:00').getDay(); // 0 Sun .. 6 Sat
  const weekendUplift = dow === 4 || dow === 5 || dow === 6 ? 1.12 : 1.0;

  // ----- Advance-purchase curve: nearer dates are pricier -----
  // Calibrated against real Jazeera day-by-day fares (e.g. KWI-BOM 1Jul=131
  // decaying to ~57 after ~3 weeks; KWI-HBE 79 -> 52). Model:
  //   multiplier = 1 + peak * exp(-daysAhead / tau)
  // The peak (how much pricier the closest days are) grows with distance:
  // short Gulf sectors ~1.5x on day 0, long-haul ~2.2x on day 0. It settles
  // back to the base fare after roughly 3-4 weeks.
  const apDays = Math.max(0, daysFromToday);
  const apPeak = km < 1200 ? 0.55 : km < 3000 ? 0.85 : 1.2; // day-0 uplift by haul
  const apTau = 8; // decay constant in days (settles ~3-4 weeks out)
  const advanceUplift = 1 + apPeak * Math.exp(-apDays / apTau);

  // Spread departures across the operating day (about 05:00 - 23:00).
  const dayStart = 5 * 60;     // 05:00
  const daySpan = 18 * 60;     // until ~23:00
  const tzDiff = to.utc - from.utc; // hours added to local dep to get local arr base

  const flights: Flight[] = [];
  const band = flightNumberBand(destination);
  // Outbound from the hub uses even? We use base for BGW-origin, base+1 otherwise.
  const isFromHub = origin === 'BGW';

  for (let i = 0; i < numFlights; i++) {
    // Distribute and add deterministic per-day jitter so times differ by date.
    const slot = numFlights === 1 ? daySpan / 2 : (daySpan * i) / (numFlights - 1);
    const jitter = ((seed >> (i + 1)) % 50) - 25; // +/- ~25 min
    let depLocalMin = Math.round((dayStart + slot + jitter) / 5) * 5;
    if (depLocalMin < dayStart) depLocalMin = dayStart;
    if (depLocalMin > dayStart + daySpan) depLocalMin = dayStart + daySpan;

    // Arrival local minutes = dep + block + timezone difference.
    const arrLocalRaw = depLocalMin + block + tzDiff * 60;
    const arrivesNextDay = arrLocalRaw >= 1440;
    const arrivesPrevDay = arrLocalRaw < 0;

    // Flight number: base + 2*i for the outbound; +1 for the return direction.
    const flightNo = band + i * 2 + (isFromHub ? 0 : 1);
    const flightNumber = `IA ${flightNo}`;

    // Time-of-day peak: early-morning (06-09) and evening (18-22) departures are
    // pricier than mid-day off-peak, matching the original's demand shaping.
    const depHour = depLocalMin / 60;
    let timeOfDayFactor: number;
    if (depHour >= 6 && depHour < 9) timeOfDayFactor = 1.12;       // morning peak
    else if (depHour >= 18 && depHour < 22) timeOfDayFactor = 1.10; // evening peak
    else if (depHour >= 11 && depHour < 15) timeOfDayFactor = 0.95; // mid-day off-peak
    else timeOfDayFactor = 1.0;

    // Fare: base * advance-purchase curve * weekend uplift * time-of-day peak
    //       * small distance-stable daily variation.
    const dayFactor = 1 + (((seed % 17) - 6) / 100); // ~ -0.06 .. +0.10
    const price = Math.max(
      80000,
      Math.round(baseFare * advanceUplift * weekendUplift * timeOfDayFactor * dayFactor)
    );

    flights.push({
      id: `${flightNumber}-${dateStr}-${i}`,
      flightNumber,
      departureTime: formatHM(depLocalMin),
      arrivalTime: formatHM(arrLocalRaw),
      duration: formatDuration(block),
      arrivesNextDay: arrivesNextDay || undefined,
      priceKWD: price,
      aircraft: km > 4000 ? 'Boeing 787-8' : km > 2000 ? 'Airbus A321neo' : 'Boeing 737-800',
      fareClass: 'Light',
      gate: `${128 + ((seed + i * 3) % 8)}`,
    });
  }

  return flights.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
};
