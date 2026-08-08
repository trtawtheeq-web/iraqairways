# Jazeera Airways Real Flight Data (collected from official + EaseMyTrip)

NOTE: EaseMyTrip "duration" includes timezone offset (wall-clock arrival minus wall-clock departure), NOT pure flight time.
We need actual departure/arrival local times to compute realistic schedules. The official Flight Schedule page gives local times.

## J9 flight numbers + routes (from EaseMyTrip, real)
- J9-37  KWI -> PRG (Kuwait-Prague)  dep 07:55 KWI -> arr 12:30 PRG (local)
- J9-38  PRG -> KWI
- J9-101 KWI -> BAH (Kuwait-Bahrain)
- J9-102 BAH -> KWI
- J9-115 KWI -> DOH (Kuwait-Doha)
- J9-116 DOH -> KWI
- J9-123 KWI -> DXB (Kuwait-Dubai)
- J9-124 DXB -> KWI
- J9-125 KWI -> DXB (second daily)
- J9-126 DXB -> KWI
- J9-131 KWI -> AUH (Kuwait-Abu Dhabi)
- J9-132 AUH -> KWI
- J9-121 KWI -> DXB (another)
- J9-122 DXB -> KWI

## Flight number ranges by region (observed pattern)
- 1xx: Gulf (BAH 101/102, DOH 115/116, DXB 121-126, AUH 131/132)
- 2xx: Saudi / regional (201-251 range)
- 4xx: Egypt / others (401-432)
- 5xx: India / South Asia (531-554)
- 6xx: others (611/612)
- 37/38: Prague

## Known real local-time anchor
- KWI->PRG: dep 07:55, arr 12:30 local (Prague is KWI-2h in summer? KWI=GMT+3, PRG=GMT+2). 
  Wall clock 4h35m, +1h tz diff = ~5h35m actual flight... (long haul)

## TODO
- Get official Flight Schedule local times for key routes: KWI-DXB, KWI-CAI, KWI-IST, KWI-DEL, AUH-AYT etc.
