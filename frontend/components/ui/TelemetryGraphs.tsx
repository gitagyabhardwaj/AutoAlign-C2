import React from "react";
import { cn } from "@/lib/utils";

interface TelemetryProps {
  rmse: number;
  inliers: number;
  totalMatches: number;
  ratio: number;
}

export function TelemetryGraphs({ rmse, inliers, totalMatches, ratio }: TelemetryProps) {
  // RMSE scales: < 1.0 is excellent, < 3.0 is good, > 5.0 is poor
  const rmsePercent = Math.min((rmse / 10) * 100, 100);
  const isRmseGood = rmse <= 2.5;

  return (
    <div className="w-full max-w-7xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* 1. Alignment Precision (RMSE) Gauge */}
      <div className="bg-neutral-900/60 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-xl flex flex-col justify-center">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", isRmseGood ? "bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]" : "bg-red-500 shadow-[0_0_8px_#ef4444]")} />
            <h4 className="text-xs font-mono font-bold tracking-widest text-neutral-300">ALIGNMENT RMSE (px)</h4>
          </div>
          <span className={cn("font-mono text-sm font-bold", isRmseGood ? "text-[#00E5FF]" : "text-red-400")}>
            {rmse.toFixed(2)} px
          </span>
        </div>
        
        {/* Progress Bar Container */}
        <div className="w-full h-2.5 bg-black/80 rounded-full overflow-hidden border border-white/5 relative">
          {/* Target Zone Marker */}
          <div className="absolute left-[25%] top-0 bottom-0 w-0.5 bg-white/30 z-10" />
          
          <div 
            className={cn("h-full transition-all duration-1000 ease-out", isRmseGood ? "bg-gradient-to-r from-cyan-600 to-[#00E5FF]" : "bg-gradient-to-r from-orange-500 to-red-500")}
            style={{ width: `${rmsePercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] font-mono text-neutral-500 mt-2 uppercase">
          <span>Perfect (0.0)</span>
          <span>Target (&lt;2.5)</span>
          <span>Drift (10.0+)</span>
        </div>
      </div>

      {/* 2. Feature Retention Funnel (Inliers vs Matches) */}
      <div className="bg-neutral-900/60 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-xl flex flex-col justify-center">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80]" />
            <h4 className="text-xs font-mono font-bold tracking-widest text-neutral-300">INLIER CONFIDENCE</h4>
          </div>
          <span className="font-mono text-sm font-bold text-green-400">
            {ratio.toFixed(1)}%
          </span>
        </div>
        
        {/* Double Bar Graph */}
        <div className="w-full h-2.5 bg-black/80 rounded-full overflow-hidden border border-white/5 relative">
          {/* Total Matches Background Bar */}
          <div className="absolute inset-y-0 left-0 bg-neutral-700 w-full" />
          
          {/* Inlier Matches Overlay Bar */}
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-600 to-green-400 transition-all duration-1000 ease-out z-10"
            style={{ width: `${ratio}%` }}
          />
        </div>
        
        <div className="flex justify-between items-center mt-2">
          <div className="text-[9px] font-mono text-green-500 uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-green-400 block" /> Inliers: {inliers.toLocaleString()}
          </div>
          <div className="text-[9px] font-mono text-neutral-400 uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-neutral-600 block" /> Total Matches: {totalMatches.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
