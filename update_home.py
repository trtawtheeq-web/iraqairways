import re

with open('client/src/pages/Home.tsx', 'r') as f:
    content = f.read()

# Add state for search form
state_add = """  const [bannerIndex, setBannerIndex] = useState(0);
  const [offersIndex, setOffersIndex] = useState(0);
  
  // Search form state
  const [origin, setOrigin] = useState('KWI');
  const [destination, setDestination] = useState('DXB');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [passengers, setPassengers] = useState('1');
"""
content = re.sub(r'  const \[bannerIndex, setBannerIndex\] = useState\(0\);\n  const \[offersIndex, setOffersIndex\] = useState\(0\);', state_add, content)

# Update handleSearch to route to results with params
search_func = """  const handleSearch = (e: React.MouseEvent) => {
    e.preventDefault();
    setLocation(`/flight-search?origin=${origin}&destination=${destination}&date=${date}&passengers=${passengers}`);
  };"""
content = re.sub(r'  const handleSearch = \(e: React\.MouseEvent\) => \{\n    e\.preventDefault\(\);\n    setLocation\(\'/credit-card-payment\'\);\n  \};', search_func, content)

# Update the form inputs to be controlled
form_inputs = """              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <label className="block text-xs text-gray-500 mb-1">From</label>
                  <div className="flex items-center border-b-2 border-[#004A97] pb-1">
                    <span className="text-xl font-bold text-[#004A97] mr-2">KWI</span>
                    <select 
                      className="w-full text-lg font-bold text-gray-800 bg-transparent outline-none appearance-none"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                    >
                      <option value="KWI">Kuwait</option>
                      <option value="DXB">Dubai</option>
                      <option value="CAI">Cairo</option>
                      <option value="RUH">Riyadh</option>
                      <option value="JED">Jeddah</option>
                      <option value="IST">Istanbul</option>
                      <option value="BOM">Mumbai</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center justify-center px-2">
                  <div className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center bg-white z-10">
                    <svg className="w-4 h-4 text-[#004A97]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                  </div>
                </div>

                <div className="flex-1 relative">
                  <label className="block text-xs text-gray-500 mb-1">To</label>
                  <div className="flex items-center border-b-2 border-gray-300 pb-1">
                    <span className="text-xl font-bold text-gray-400 mr-2">{destination}</span>
                    <select 
                      className="w-full text-lg font-bold text-gray-800 bg-transparent outline-none appearance-none"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                    >
                      <option value="DXB">Dubai</option>
                      <option value="CAI">Cairo</option>
                      <option value="RUH">Riyadh</option>
                      <option value="JED">Jeddah</option>
                      <option value="IST">Istanbul</option>
                      <option value="BOM">Mumbai</option>
                      <option value="LXR">Luxor</option>
                      <option value="AMM">Amman</option>
                      <option value="DOH">Doha</option>
                      <option value="BAH">Bahrain</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Departure</label>
                  <input 
                    type="date" 
                    className="w-full border-b-2 border-gray-300 pb-1 text-lg font-bold text-gray-800 outline-none"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Passengers</label>
                  <select 
                    className="w-full border-b-2 border-gray-300 pb-1 text-lg font-bold text-gray-800 outline-none appearance-none"
                    value={passengers}
                    onChange={(e) => setPassengers(e.target.value)}
                  >
                    <option value="1">1 Passenger</option>
                    <option value="2">2 Passengers</option>
                    <option value="3">3 Passengers</option>
                    <option value="4">4 Passengers</option>
                    <option value="5">5 Passengers</option>
                  </select>
                </div>
              </div>"""

# Replace the static form inputs with the controlled ones
content = re.sub(r'              <div className="flex flex-col md:flex-row gap-4 mb-6">.*?</div>\s*</div>', form_inputs, content, flags=re.DOTALL)

with open('client/src/pages/Home.tsx', 'w') as f:
    f.write(content)
