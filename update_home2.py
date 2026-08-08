import re

with open('client/src/pages/Home.tsx', 'r') as f:
    content = f.read()

# Add cities import
if 'import { jazeeraRoutes }' not in content:
    content = content.replace("import { useLocation } from 'wouter';", "import { useLocation } from 'wouter';\nimport { jazeeraRoutes } from '../lib/flightEngine';\n\nconst cities = [\n  { iata: 'KWI', city: 'Kuwait' },\n  ...jazeeraRoutes.map((r) => ({ iata: r.iata, city: r.city })),\n].sort((a, b) => a.city.localeCompare(b.city));")

# Replace the static form inputs with the controlled ones
form_inputs = """            {/* Inputs */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch">
              {/* From */}
              <div className="flex-1 w-full bg-[#EBF3FF] rounded-xl p-3 flex items-center gap-3 border border-transparent focus-within:border-[#41b4e6] transition-colors">
                <img src="/jazeera_files/Plane - take off_darkblue.svg" alt="Departure" className="w-6 h-6" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500">From</div>
                  <select
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full bg-transparent font-bold text-lg text-[#001326] outline-none cursor-pointer"
                  >
                    {cities.map((c) => (
                      <option key={c.iata} value={c.iata}>{c.city} ({c.iata})</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { const o = origin; setOrigin(destination); setDestination(o); }}
                className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center shrink-0 z-10 self-center md:-mx-4 hover:scale-110 transition-transform"
              >
                <img src="/jazeera_files/swapIcon.svg" alt="Swap" className="w-5 h-5" />
              </button>

              {/* To */}
              <div className="flex-1 w-full bg-white border rounded-xl p-3 flex items-center gap-3 focus-within:border-[#41b4e6] transition-colors">
                <img src="/jazeera_files/Plane - Landing_darkblue.svg" alt="Destination" className="w-6 h-6" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500">To</div>
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full bg-transparent font-bold text-lg text-[#001326] outline-none cursor-pointer"
                  >
                    {cities.map((c) => (
                      <option key={c.iata} value={c.iata}>{c.city} ({c.iata})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date */}
              <div className="flex-1 w-full bg-white border rounded-xl p-3 flex items-center gap-3 focus-within:border-[#41b4e6] transition-colors">
                <img src="/jazeera_files/airplane_ticket.svg" alt="Date" className="w-6 h-6" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500">Departure</div>
                  <input
                    type="date"
                    value={date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-transparent font-bold text-base text-[#001326] outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Passengers */}
              <div className="flex-1 w-full bg-white border rounded-xl p-3 flex items-center gap-3 focus-within:border-[#41b4e6] transition-colors">
                <img src="/jazeera_files/account_circle.png" alt="Passengers" className="w-6 h-6" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500">Passengers</div>
                  <select
                    value={passengers}
                    onChange={(e) => setPassengers(e.target.value)}
                    className="w-full bg-transparent font-bold text-lg text-[#001326] outline-none cursor-pointer"
                  >
                    {[1,2,3,4,5,6].map((n) => (
                      <option key={n} value={String(n)}>{n} {n === 1 ? 'Passenger' : 'Passengers'}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search Button */}
              <button 
                onClick={handleSearch}
                className="w-full md:w-auto bg-[#004A97] hover:bg-[#003875] text-white rounded-full px-8 py-4 font-bold text-lg flex items-center justify-center gap-2 transition-colors shadow-lg"
              >
                Search <img src="/jazeera_files/fsArrow.svg" alt="Search" className="w-4 h-4 filter brightness-0 invert" />
              </button>
            </div>"""

content = re.sub(r'            \{\/\* Inputs \*\/\}.*?<\/button>\s*<\/div>', form_inputs, content, flags=re.DOTALL)

with open('client/src/pages/Home.tsx', 'w') as f:
    f.write(content)
