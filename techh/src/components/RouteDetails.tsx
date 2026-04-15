import React from "react";
import { Shield, Clock, Ruler, AlertTriangle, Volume2, Leaf, Train, Footprints, Car, Map as MapIcon } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface RouteDetailsProps {
  route: any;
}

export default function RouteDetails({ route }: RouteDetailsProps) {
  if (!route) return null;
  const score = parseFloat(route.safetyScore);

  const formatDistance = (m: number) => {
    if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
    return `${Math.round(m)} m`;
  };

  const formatDuration = (s: number) => {
    const mins = Math.round(s / 60);
    if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
    return `${mins} mins`;
  };

  const handleReadAloud = () => {
    if (!window.speechSynthesis) {
      console.warn("Speech synthesis not supported in this browser.");
      return;
    }
    const text = `Safety score is ${score} out of 10. Estimated arrival is ${route.arrivalTime}. ${route.fatigueNudge || ""}. Recommended multi-modal route takes ${formatDuration(route.multiModalTotalTime)}.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Voice & Header */}
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] ml-1">Safety Analysis</label>
        <button 
          onClick={handleReadAloud}
          className="p-2 bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 text-[#3B82F6] rounded-lg transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
        >
          <Volume2 className="w-3 h-3" />
          Read Aloud
        </button>
      </div>

      {/* Fatigue Nudge */}
      {route.fatigueNudge && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl animate-pulse">
          <p className="text-xs font-bold text-amber-400 leading-relaxed">
            {route.fatigueNudge}
          </p>
        </div>
      )}

      {/* Safety Score Gauge */}
      <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 border-2 border-dashed border-[#22C55E]/30 rounded-full scale-110"></div>
        <div className={cn(
          "w-full h-full rounded-full border-8 flex flex-col items-center justify-center bg-black/20",
          score >= 8 ? "border-[#22C55E]" : score >= 6 ? "border-[#F59E0B]" : "border-[#EF4444]"
        )}>
          <div className={cn(
            "text-3xl font-black",
            score >= 8 ? "text-[#22C55E]" : score >= 6 ? "text-[#F59E0B]" : "text-[#EF4444]"
          )}>{score}</div>
          <div className="text-[8px] font-bold uppercase tracking-widest text-[#94A3B8]">
            {score >= 8 ? "Excellent" : score >= 6 ? "Moderate" : "Low"}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
          <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-1">Dist</div>
          <div className="text-xl font-black text-white">{formatDistance(route.distance).split(' ')[0]}</div>
          <div className="text-[10px] font-bold text-[#94A3B8] uppercase">{formatDistance(route.distance).split(' ')[1]}</div>
        </div>
        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
          <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-1">Time</div>
          <div className="text-xl font-black text-white">{formatDuration(route.duration).split(' ')[0]}</div>
          <div className="text-[10px] font-bold text-[#94A3B8] uppercase">{formatDuration(route.duration).split(' ')[1] || "min"}</div>
        </div>
      </div>

      {/* Arrival & Traffic */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
          <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-1">Arrival</div>
          <div className="text-lg font-black text-white">{route.arrivalTime}</div>
          <div className="text-[10px] font-bold text-[#94A3B8] uppercase">Estimated</div>
        </div>
        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
          <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-1">Traffic</div>
          <div className={cn(
            "text-lg font-black",
            route.trafficIntensity === "Heavy" ? "text-rose-400" : route.trafficIntensity === "Moderate" ? "text-amber-400" : "text-emerald-400"
          )}>{route.trafficIntensity}</div>
          <div className="text-[10px] font-bold text-[#94A3B8] uppercase">Intensity</div>
        </div>
      </div>

      {/* Carbon Footprint */}
      <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 flex items-center gap-4">
        <div className="p-2 bg-emerald-500/20 rounded-xl">
          <Leaf className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Eco Impact</div>
          <div className="text-sm font-black text-white">Saved {route.carbonSaved}kg CO₂</div>
          <div className="text-[8px] font-medium text-emerald-400/60 uppercase">Equivalent to 60 phone charges</div>
        </div>
      </div>

      {/* Multi-modal Stitcher */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest ml-1">Multi-modal Suggestion</h3>
        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
          {route.multiModal.map((m: any, idx: number) => (
            <div key={idx} className="relative">
              <div className={cn(
                "absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-[#1E293B]",
                m.mode === "Walk" ? "bg-slate-400" : m.mode === "Metro" ? "bg-purple-500" : "bg-amber-500"
              )}></div>
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-white/5 rounded-lg">
                  {m.mode === "Walk" ? <Footprints className="w-3 h-3 text-slate-400" /> : 
                   m.mode === "Metro" ? <Train className="w-3 h-3 text-purple-400" /> : 
                   <Car className="w-3 h-3 text-amber-400" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{m.mode} • {formatDuration(m.duration)}</div>
                  <div className="text-[10px] text-[#94A3B8]">{m.instruction}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {route.alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest ml-1">Active Alerts</h3>
          <div className="space-y-2">
            {route.alerts.map((alert: string, idx: number) => (
              <div key={idx} className={cn(
                "p-3 rounded-lg border-l-4 text-xs font-medium",
                alert.includes("Low lighting") || alert.includes("Less crowded") || alert.includes("Predictive")
                  ? "bg-[#F59E0B]/10 border-[#F59E0B] text-[#F59E0B]" 
                  : "bg-[#EF4444]/10 border-[#EF4444] text-[#EF4444]"
              )}>
                {alert}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
