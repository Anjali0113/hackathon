import { useState } from "react";
import axios from "axios";
import { ShieldCheck, Info } from "lucide-react";
import Map from "./components/Map";
import SearchPanel from "./components/SearchPanel";
import RouteDetails from "./components/RouteDetails";
import { resolveLocation } from "./services/geminiService";

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [routeData, setRouteData] = useState<any>(null);
  const [startCoords, setStartCoords] = useState<[number, number] | undefined>();
  const [endCoords, setEndCoords] = useState<[number, number] | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [mood, setMood] = useState<"day" | "night">("day");

  const geocodeWithFallback = async (query: string) => {
    // Try initial geocode
    let res = await axios.get(`/api/geocode?q=${encodeURIComponent(query)}`);
    
    // If it fails, try to resolve with Gemini
    if (res.data.length === 0) {
      console.log(`Nominatim failed for "${query}", trying Gemini resolution...`);
      const resolved = await resolveLocation(query);
      console.log(`Gemini resolved "${query}" to "${resolved}"`);
      res = await axios.get(`/api/geocode?q=${encodeURIComponent(resolved)}`);
    }
    
    return res.data;
  };

  const handleSearch = async (start: string, end: string, mode: string) => {
    const [prefMode, time, travelMood] = mode.split("|");
    if (travelMood) setMood(travelMood as "day" | "night");
    
    setIsLoading(true);
    setError(null);
    try {
      // 1. Geocode Start
      const startData = await geocodeWithFallback(start);
      if (startData.length === 0) throw new Error(`Could not find location: ${start}. Please be more specific.`);
      const s = startData[0];
      const sCoords: [number, number] = [parseFloat(s.lat), parseFloat(s.lon)];

      // 2. Geocode End
      const endData = await geocodeWithFallback(end);
      if (endData.length === 0) throw new Error(`Could not find location: ${end}. Please be more specific.`);
      const e = endData[0];
      const eCoords: [number, number] = [parseFloat(e.lat), parseFloat(e.lon)];

      setStartCoords(sCoords);
      setEndCoords(eCoords);

      // 3. Get Route
      const routeRes = await axios.get(`/api/route`, {
        params: {
          start: `${s.lon},${s.lat}`,
          end: `${e.lon},${e.lat}`,
          mode
        }
      });

      setRouteData(routeRes.data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while fetching the route.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0F172A] p-6 flex flex-col gap-6 overflow-hidden">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#3B82F6] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white leading-tight tracking-tight">SMART<span className="text-[#3B82F6]">SAFE</span>.IO</h1>
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.2em]">Urban Mobility Solution</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="px-3 py-1.5 bg-[#22C55E]/20 text-[#22C55E] text-[10px] font-bold rounded-full uppercase tracking-wider border border-[#22C55E]/20">
            Live Traffic: Normal
          </div>
          <div className="px-3 py-1.5 bg-white/10 text-white text-[10px] font-bold rounded-full uppercase tracking-wider border border-white/10">
            Bangalore, KA
          </div>
        </div>
      </header>

      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_280px] gap-4 flex-1 min-h-0">
        {/* Left: Search Panel */}
        <div className="flex flex-col gap-4 min-h-0">
          <SearchPanel onSearch={handleSearch} isLoading={isLoading} />
          
          <div className="bg-[#1E293B] p-5 rounded-[20px] border border-white/10 flex-1 overflow-y-auto">
            <p className="text-xs text-[#94A3B8] leading-relaxed italic">
              Using OpenStreetMap data for Bangalore Urban. Real-time lighting and crowd density calculations applied to secondary arterial roads.
            </p>
            
            {error && (
              <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm font-medium">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Middle: Map Area */}
        <div className="relative bg-[#111827] rounded-[20px] overflow-hidden border border-white/10">
          <Map start={startCoords} end={endCoords} route={routeData} mood={mood} />
          
          {routeData && (
            <div className="absolute bottom-5 left-5 z-10 bg-[#0F172A]/80 backdrop-blur p-3 px-4 rounded-xl border border-white/10 text-xs text-white font-medium">
              Showing: Primary Safe Route via {routeData.segments[0]?.name || "Main Road"}
            </div>
          )}
        </div>

        {/* Right: Safety Dashboard */}
        <div className="bg-[#1E293B] rounded-[20px] border border-white/10 overflow-y-auto p-5">
          {routeData ? (
            <RouteDetails route={routeData} />
          ) : !isLoading && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                <Info className="w-8 h-8 text-[#94A3B8]" />
              </div>
              <div className="space-y-1">
                <p className="text-[#F8FAFC] font-medium">Ready to analyze</p>
                <p className="text-xs text-[#94A3B8]">Enter locations to start</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-[0.3em] text-center opacity-50">
        Prototype for Hackathon 2026 • India Focus
      </footer>
    </div>
  );
}
