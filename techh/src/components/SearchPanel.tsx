import React, { useState } from "react";
import { Search, MapPin, Navigation, Loader2, Clock, Sparkles, Sun, Moon } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { getSuggestions } from "@/src/services/geminiService";

interface SearchPanelProps {
  onSearch: (start: string, end: string, mode: string) => void;
  isLoading: boolean;
}

export default function SearchPanel({ onSearch, isLoading }: SearchPanelProps) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [mode, setMode] = useState("safest");
  const [persona, setPersona] = useState("office");
  const [fatigueHours, setFatigueHours] = useState("5");
  const [mood, setMood] = useState<"day" | "night">(() => {
    const hour = new Date().getHours();
    return (hour >= 6 && hour < 18) ? "day" : "night";
  });
  const [departureTime, setDepartureTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeInput, setActiveInput] = useState<"start" | "end" | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const handleSuggest = async (input: "start" | "end") => {
    const val = input === "start" ? start : end;
    if (val.length < 3) return;
    
    setIsSuggesting(true);
    setActiveInput(input);
    const results = await getSuggestions(val);
    setSuggestions(results);
    setIsSuggesting(false);
  };

  const selectSuggestion = (s: string) => {
    if (activeInput === "start") setStart(s);
    else if (activeInput === "end") setEnd(s);
    setSuggestions([]);
    setActiveInput(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (start && end) {
      onSearch(start, end, `${mode}|${departureTime}|${mood}|${persona}|${fatigueHours}`);
    }
  };

  return (
    <div className="bg-[#1E293B] p-5 rounded-[20px] border border-white/10 flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <Navigation className="w-5 h-5 text-[#3B82F6]" />
        </div>
        <h2 className="text-lg font-bold text-white tracking-tight">Route Finder</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2 relative">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] ml-1">Start Point</label>
          <div className="relative group">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] group-focus-within:text-[#3B82F6] transition-colors" />
            <input
              type="text"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              onBlur={() => setTimeout(() => setSuggestions([]), 200)}
              placeholder="e.g. Bangalore"
              className="w-full pl-10 pr-10 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent outline-none transition-all placeholder:text-[#94A3B8]/50"
              required
            />
            <button 
              type="button"
              onClick={() => handleSuggest("start")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#3B82F6]"
            >
              <Sparkles className={cn("w-4 h-4", isSuggesting && activeInput === "start" && "animate-pulse")} />
            </button>
          </div>
          {activeInput === "start" && suggestions.length > 0 && (
            <div className="absolute z-50 top-full left-0 w-full mt-1 bg-[#1E293B] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectSuggestion(s)}
                  className="w-full text-left px-4 py-2 text-xs text-white hover:bg-[#3B82F6] transition-colors border-b border-white/5 last:border-0"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2 relative">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] ml-1">Destination</label>
          <div className="relative group">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] group-focus-within:text-[#3B82F6] transition-colors" />
            <input
              type="text"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              onBlur={() => setTimeout(() => setSuggestions([]), 200)}
              placeholder="e.g. Mysore Palace"
              className="w-full pl-10 pr-10 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent outline-none transition-all placeholder:text-[#94A3B8]/50"
              required
            />
            <button 
              type="button"
              onClick={() => handleSuggest("end")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#3B82F6]"
            >
              <Sparkles className={cn("w-4 h-4", isSuggesting && activeInput === "end" && "animate-pulse")} />
            </button>
          </div>
          {activeInput === "end" && suggestions.length > 0 && (
            <div className="absolute z-50 top-full left-0 w-full mt-1 bg-[#1E293B] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectSuggestion(s)}
                  className="w-full text-left px-4 py-2 text-xs text-white hover:bg-[#3B82F6] transition-colors border-b border-white/5 last:border-0"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] ml-1">Commuter Persona</label>
          <select 
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-[#3B82F6] outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="office" className="bg-[#1E293B]">Daily Office Commuter</option>
            <option value="parent" className="bg-[#1E293B]">School Parent</option>
            <option value="delivery" className="bg-[#1E293B]">Delivery Rider</option>
            <option value="senior" className="bg-[#1E293B]">Senior Citizen</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] ml-1">Weekly Commute (Hours)</label>
          <input
            type="range"
            min="0"
            max="40"
            value={fatigueHours}
            onChange={(e) => setFatigueHours(e.target.value)}
            className="w-full h-1.5 bg-black/20 rounded-lg appearance-none cursor-pointer accent-[#3B82F6]"
          />
          <div className="flex justify-between text-[10px] font-bold text-[#94A3B8] px-1">
            <span>0h</span>
            <span className="text-white">{fatigueHours}h commuted</span>
            <span>40h</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] ml-1">Departure Time</label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input
              type="time"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent outline-none transition-all"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] ml-1">Traveling Mood</label>
          <div className="flex p-1 bg-black/20 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => setMood("day")}
              className={cn(
                "flex-1 py-2 text-xs font-bold rounded-lg transition-all uppercase tracking-wider flex items-center justify-center gap-2",
                mood === "day" ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : "text-[#94A3B8] hover:text-white"
              )}
            >
              <Sun className="w-3 h-3" />
              Day
            </button>
            <button
              type="button"
              onClick={() => setMood("night")}
              className={cn(
                "flex-1 py-2 text-xs font-bold rounded-lg transition-all uppercase tracking-wider flex items-center justify-center gap-2",
                mood === "night" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-[#94A3B8] hover:text-white"
              )}
            >
              <Moon className="w-3 h-3" />
              Night
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] ml-1">Routing Preference</label>
          <div className="flex p-1 bg-black/20 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => setMode("safest")}
              className={cn(
                "flex-1 py-2 text-xs font-bold rounded-lg transition-all uppercase tracking-wider",
                mode === "safest" ? "bg-[#3B82F6] text-white shadow-lg shadow-blue-500/20" : "text-[#94A3B8] hover:text-white"
              )}
            >
              Safest
            </button>
            <button
              type="button"
              onClick={() => setMode("shortest")}
              className={cn(
                "flex-1 py-2 text-xs font-bold rounded-lg transition-all uppercase tracking-wider",
                mode === "shortest" ? "bg-[#3B82F6] text-white shadow-lg shadow-blue-500/20" : "text-[#94A3B8] hover:text-white"
              )}
            >
              Fastest
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-[#3B82F6] hover:bg-blue-500 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 uppercase tracking-[0.1em]"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Search className="w-4 h-4" />
              Find Safe Route
            </>
          )}
        </button>
      </form>

      <div className="mt-6 space-y-4">
        <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] ml-1">Safe Catchup Spots</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: "Indiranagar", city: "Bangalore", q: "100 Feet Road, Indiranagar, Bangalore" },
            { name: "Cyber Hub", city: "Gurgaon", q: "DLF Cyber Hub, Gurgaon" },
            { name: "BKC", city: "Mumbai", q: "Bandra Kurla Complex, Mumbai" },
            { name: "Khan Market", city: "Delhi", q: "Khan Market, New Delhi" },
            { name: "UB City", city: "Bangalore", q: "UB City, Vittal Mallya Road, Bangalore" },
            { name: "Marine Drive", city: "Mumbai", q: "Marine Drive, Mumbai" },
            { name: "Phoenix Marketcity", city: "Pune", q: "Phoenix Marketcity, Viman Nagar, Pune" },
            { name: "Hitech City", city: "Hyderabad", q: "Hitech City, Hyderabad" }
          ].map((spot, i) => (
            <button
              key={i}
              onClick={() => {
                setEnd(spot.q);
              }}
              className="text-left p-3 bg-black/10 hover:bg-black/20 border border-white/5 rounded-xl transition-all group"
            >
              <div className="text-[10px] font-black text-white group-hover:text-[#3B82F6] transition-colors">{spot.name}</div>
              <div className="text-[8px] font-bold text-[#94A3B8] uppercase">{spot.city}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] ml-1">Recent Routes</label>
        <div className="grid grid-cols-1 gap-2">
          {[
            { s: "MG Road, Bangalore", e: "Koramangala" },
            { s: "Connaught Place, Delhi", e: "Noida Sector 18" }
          ].map((ex, i) => (
            <button
              key={i}
              onClick={() => {
                setStart(ex.s);
                setEnd(ex.e);
              }}
              className="text-left p-3 bg-black/10 hover:bg-black/20 border border-white/5 rounded-xl transition-all"
            >
              <div className="text-[10px] font-bold text-white truncate">{ex.s} → {ex.e}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
