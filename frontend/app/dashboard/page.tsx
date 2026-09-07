"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  Layers,
  Crosshair,
  Grid3X3,
  Play,
  Terminal,
  MoveHorizontal,
} from "lucide-react";
import { StarsBackground } from "@/components/ui/stars";
import { Navbar } from "@/components/ui/mini-navbar";
import { sans, mono } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [selectedRegion, setSelectedRegion] = useState("Tycho Crater (High Contrast Rim)");
  const [testLowOverlap, setTestLowOverlap] = useState(false);
  const [pipelineRun, setPipelineRun] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState("Ready");
  const [activeTab, setActiveTab] = useState<"slider" | "loftr" | "checker">("slider");
  const [sliderPos, setSliderPos] = useState(50);
  const [comparisonMode, setComparisonMode] = useState<"aligned" | "unaligned">("aligned");
  const [tileSize, setTileSize] = useState(48);

  const telemetryData: Record<string, { coords: string; diam: string; sun: string; focus: string }> = {
    "Tycho Crater (High Contrast Rim)": {
      coords: "43.31° S, 11.36° W",
      diam: "85.0 km",
      sun: "21.4° incidence",
      focus: "Central peak & bright ray ejecta",
    },
    "Shackleton Crater (Lunar South Pole)": {
      coords: "89.90° S, 0.00° E",
      diam: "21.0 km",
      sun: "1.5° grazing (PSR)",
      focus: "Permanently Shadowed Region (Ice traps)",
    },
    "South Pole - Aitken Basin": {
      coords: "53.00° S, 169.00° W",
      diam: "2,500 km",
      sun: "28.0° incidence",
      focus: "Deepest impact basin (mafic mantle)",
    },
  };

  const handleRunPipeline = () => {
    setIsExecuting(true);
    setProgress(0);
    setPipelineRun(false);

    const stages = [
      { name: "Stage 1: GeoTIFF Ingestion (OHRC, TMC-2, IIRS)", p: 25 },
      { name: "Stage 2: Scale & Feature Matching (LoFTR)", p: 50 },
      { name: "Stage 3: Projective Homography H ∈ SE(2)", p: 75 },
      { name: "Stage 4: Sub-Pixel Verification (RMSE < 1.0 px)", p: 100 },
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < stages.length) {
        setCurrentStage(stages[i].name);
        setProgress(stages[i].p);

        if (testLowOverlap && i === 1) {
          clearInterval(interval);
          setIsExecuting(false);
          setPipelineRun(true);
          setCurrentStage("Failed: Insufficient Overlap (<10 Keypoints)");
          return;
        }
        i++;
      } else {
        clearInterval(interval);
        setIsExecuting(false);
        setPipelineRun(true);
        setCurrentStage("Optimal Lock (0.38 px)");
      }
    }, 400);
  };

  const isFailed = testLowOverlap && pipelineRun;

  return (
    <StarsBackground factor={0.02} speed={50} className={cn(sans.className, "min-h-screen text-white bg-[#07060c]")}>
      {/* Floating Mini Navbar */}
      <Navbar />

      <div className="relative z-10 w-full max-w-7xl mx-auto min-h-screen px-4 sm:px-6 lg:px-8 pt-24 md:pt-28 pb-16">
        {/* Top Header & Sensor Metadata Ribbon */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 mb-8 border-b border-white/10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 text-neutral-400 hover:text-white text-xs font-medium transition-all group"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-cyan-400 group-hover:-translate-x-0.5 transition-transform" />
            <span>Return to Orbital View</span>
          </Link>

          {/* Muted Metadata Pills with Subtle Status Dots */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-white/[0.03] border border-white/10 text-neutral-300 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00E5FF] mr-2 shrink-0" />
              OHRC: <span className="text-white font-medium ml-1.5">0.25 m/px</span>
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-white/[0.03] border border-white/10 text-neutral-300 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_#3b82f6] mr-2 shrink-0" />
              TMC-2: <span className="text-white font-medium ml-1.5">5.0 m/px</span>
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-white/[0.03] border border-white/10 text-neutral-300 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_#a855f7] mr-2 shrink-0" />
              IIRS: <span className="text-white font-medium ml-1.5">80 m/px</span>
            </span>
            <span
              className={cn(
                "px-3 py-1 rounded-full text-xs font-mono border flex items-center gap-2 transition-colors",
                isFailed
                  ? "bg-red-500/10 border-red-500/30 text-red-300"
                  : pipelineRun
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-white/[0.03] border-white/10 text-neutral-300"
              )}
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  isFailed
                    ? "bg-red-400 shadow-[0_0_6px_#f87171]"
                    : pipelineRun
                    ? "bg-emerald-400 shadow-[0_0_6px_#34d399]"
                    : "bg-cyan-400 shadow-[0_0_6px_#00E5FF] animate-pulse"
                )}
              />
              <span>{currentStage}</span>
            </span>
          </div>
        </header>

        {/* 2-Column Precision Engineering Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ============================================================ */}
          {/* LEFT COLUMN: Mission Parameters, Controls & Projective Tensor */}
          {/* ============================================================ */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Target & Execution Module */}
            <div className="bg-neutral-950/70 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-xl shadow-xl shadow-black/40 space-y-5 transition-all">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm font-semibold text-white tracking-tight">
                    Mission Target
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-cyan-400/90 border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 rounded-full font-medium">
                  PDS4-CRS
                </span>
              </div>

              {/* Region Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-neutral-400">
                  Target Dataset
                </label>
                <select
                  value={selectedRegion}
                  onChange={(e) => {
                    setSelectedRegion(e.target.value);
                    setPipelineRun(false);
                    setCurrentStage("Ready");
                  }}
                  className="w-full bg-neutral-900/90 border border-white/10 hover:border-white/20 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl px-3 py-2 text-xs font-medium text-neutral-200 focus:outline-none transition-all cursor-pointer"
                >
                  <option value="Tycho Crater (High Contrast Rim)">Tycho Crater (High Contrast Rim)</option>
                  <option value="Shackleton Crater (Lunar South Pole)">Shackleton Crater (Lunar South Pole)</option>
                  <option value="South Pole - Aitken Basin">South Pole - Aitken Basin</option>
                </select>
              </div>

              {/* Parameter Readouts (Clean 2-Column Avionics Spec Grid) */}
              <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="space-y-0.5">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Coordinates</div>
                  <div className="text-xs font-mono text-cyan-300 font-medium">{telemetryData[selectedRegion].coords}</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Diameter</div>
                  <div className="text-xs font-mono text-neutral-200 font-medium">{telemetryData[selectedRegion].diam}</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Incidence</div>
                  <div className="text-xs font-mono text-blue-300 font-medium">{telemetryData[selectedRegion].sun}</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Geologic Focus</div>
                  <div className="text-xs font-mono text-neutral-300 truncate font-medium" title={telemetryData[selectedRegion].focus}>
                    {telemetryData[selectedRegion].focus}
                  </div>
                </div>
              </div>

              {/* Marginal Overlap Test Checkbox */}
              <div className="pt-1">
                <label className="flex items-center gap-2.5 text-xs text-neutral-400 hover:text-neutral-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={testLowOverlap}
                    onChange={(e) => setTestLowOverlap(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-cyan-400 focus:ring-0 accent-cyan-400 cursor-pointer"
                  />
                  <span>Simulate Marginal Overlap (&lt;10 keypoints)</span>
                </label>
                {testLowOverlap && (
                  <p className="mt-2 text-[11px] font-mono text-amber-300/90 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
                    ⚠ Injects sparse tie-points to evaluate safety trip &amp; singularity fallback.
                  </p>
                )}
              </div>

              {/* Flight Terminal Trigger Button */}
              <button
                onClick={handleRunPipeline}
                disabled={isExecuting}
                className="w-full bg-white hover:bg-neutral-100 text-neutral-950 font-medium text-xs tracking-wider uppercase py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-white/5 hover:shadow-cyan-500/20 hover:border-cyan-400 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group border border-transparent"
              >
                <Play className="w-3.5 h-3.5 fill-neutral-950 text-neutral-950 group-hover:fill-cyan-600 group-hover:text-cyan-600 transition-colors" />
                <span>{isExecuting ? "Executing Pipeline..." : "Run Registration Pipeline"}</span>
              </button>

              {/* Progress Indicator */}
              {isExecuting && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs font-mono text-neutral-400">
                    <span className="truncate text-cyan-300 font-medium">{currentStage}</span>
                    <span className="text-cyan-400 font-semibold">{progress}%</span>
                  </div>
                  <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden border border-white/5">
                    <div
                      className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full transition-all duration-300 shadow-[0_0_8px_rgba(0,229,255,0.6)]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 4-Stage Vertical Pipeline Execution Timeline */}
              <div className="mt-5 pt-4 border-t border-white/10 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00E5FF]" />
                    Pipeline Milestones
                  </span>
                  <span className="text-xs font-mono text-cyan-400 font-medium">
                    {isFailed ? "Halted (Stage 2)" : isExecuting ? `Progress: ${progress}%` : "4/4 Complete"}
                  </span>
                </div>

                <div className="relative pl-0.5">
                  {/* Stage 1: GeoTIFF Ingestion */}
                  <div className="relative flex items-start gap-3 pb-4">
                    {/* Connecting vertical line */}
                    <div
                      className={cn(
                        "absolute left-[11px] top-6 bottom-0 w-[1.5px] transition-colors duration-500",
                        isFailed
                          ? "bg-gradient-to-b from-cyan-400 to-red-500"
                          : "bg-cyan-500/40"
                      )}
                    />
                    <div className="relative z-10 w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-mono text-[11px] font-semibold shrink-0">
                      1
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-white truncate">
                          Stage 1: GeoTIFF Ingestion
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-medium uppercase shrink-0">
                          Complete
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        Parse OHRC, TMC-2, IIRS bands
                      </p>
                    </div>
                  </div>

                  {/* Stage 2: Scale & Feature Matching */}
                  <div className="relative flex items-start gap-3 pb-4">
                    {/* Connecting vertical line */}
                    <div
                      className={cn(
                        "absolute left-[11px] top-6 bottom-0 w-[1.5px] transition-colors duration-500",
                        isFailed
                          ? "bg-white/10"
                          : isExecuting && progress < 50
                          ? "bg-white/10"
                          : "bg-cyan-500/40"
                      )}
                    />
                    <div
                      className={cn(
                        "relative z-10 w-6 h-6 rounded-full flex items-center justify-center font-mono text-[11px] font-semibold shrink-0 transition-all",
                        isFailed
                          ? "bg-red-500/10 text-red-400 border border-red-500/50"
                          : isExecuting && progress < 50
                          ? "bg-amber-500/10 text-amber-300 border border-amber-400/50 animate-pulse"
                          : "bg-cyan-500/10 text-cyan-300 border border-cyan-500/40"
                      )}
                    >
                      {isFailed ? "✕" : "2"}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-white truncate">
                          Stage 2: Scale &amp; Feature Matching
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-mono px-2 py-0.5 rounded-full font-medium uppercase shrink-0",
                            isFailed
                              ? "bg-red-500/10 text-red-400 border border-red-500/30"
                              : isExecuting && progress < 50
                              ? "bg-amber-500/10 text-amber-300 border border-amber-500/30 animate-pulse"
                              : "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30"
                          )}
                        >
                          {isFailed ? "Tripped" : isExecuting && progress < 50 ? "Active" : "Complete"}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        Extract LoFTR dense correspondences
                      </p>
                    </div>
                  </div>

                  {/* Stage 3: Projective Homography */}
                  <div className="relative flex items-start gap-3 pb-4">
                    {/* Connecting vertical line */}
                    <div
                      className={cn(
                        "absolute left-[11px] top-6 bottom-0 w-[1.5px] transition-colors duration-500",
                        isFailed
                          ? "bg-white/10"
                          : isExecuting && progress < 75
                          ? "bg-white/10"
                          : "bg-cyan-500/40"
                      )}
                    />
                    <div
                      className={cn(
                        "relative z-10 w-6 h-6 rounded-full flex items-center justify-center font-mono text-[11px] font-semibold shrink-0 transition-all",
                        isFailed
                          ? "bg-neutral-900 text-neutral-600 border border-white/10"
                          : isExecuting && progress >= 50 && progress < 75
                          ? "bg-amber-500/10 text-amber-300 border border-amber-400/50 animate-pulse"
                          : isExecuting && progress < 50
                          ? "bg-neutral-900 text-neutral-500 border border-white/10"
                          : "bg-cyan-500/10 text-cyan-300 border border-cyan-500/40"
                      )}
                    >
                      3
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn("text-xs font-medium truncate", isFailed ? "text-neutral-500" : "text-white")}>
                          Stage 3: Projective Homography
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-mono px-2 py-0.5 rounded-full font-medium uppercase shrink-0",
                            isFailed
                              ? "bg-neutral-900 text-neutral-500 border border-white/10"
                              : isExecuting && progress >= 50 && progress < 75
                              ? "bg-amber-500/10 text-amber-300 border border-amber-500/30 animate-pulse"
                              : isExecuting && progress < 50
                              ? "bg-neutral-900 text-neutral-500 border border-white/10"
                              : "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30"
                          )}
                        >
                          {isFailed ? "Halted" : isExecuting && progress >= 50 && progress < 75 ? "Active" : isExecuting && progress < 50 ? "Queued" : "Complete"}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        Solve H ∈ SE(2) perspective warp
                      </p>
                    </div>
                  </div>

                  {/* Stage 4: Sub-Pixel Verification */}
                  <div className="relative flex items-start gap-3">
                    <div
                      className={cn(
                        "relative z-10 w-6 h-6 rounded-full flex items-center justify-center font-mono text-[11px] font-semibold shrink-0 transition-all",
                        isFailed
                          ? "bg-neutral-900 text-neutral-600 border border-white/10"
                          : isExecuting && progress >= 75 && progress < 100
                          ? "bg-amber-500/10 text-amber-300 border border-amber-400/50 animate-pulse"
                          : isExecuting && progress < 75
                          ? "bg-neutral-900 text-neutral-500 border border-white/10"
                          : "bg-amber-500/10 text-amber-300 border border-amber-400/50"
                      )}
                    >
                      4
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn("text-xs font-medium truncate", isFailed ? "text-neutral-500" : "text-amber-200")}>
                          Stage 4: Sub-Pixel Verification
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-mono px-2 py-0.5 rounded-full font-medium uppercase shrink-0",
                            isFailed
                              ? "bg-neutral-900 text-neutral-500 border border-white/10"
                              : isExecuting && progress >= 75 && progress < 100
                              ? "bg-amber-500/10 text-amber-300 border border-amber-500/30 animate-pulse"
                              : isExecuting && progress < 75
                              ? "bg-neutral-900 text-neutral-500 border border-white/10"
                              : "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                          )}
                        >
                          {isFailed ? "Halted" : isExecuting && progress >= 75 && progress < 100 ? "Active" : isExecuting && progress < 75 ? "Queued" : "Active / Complete"}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        Compute target RMSE convergence &lt; 1.0 px
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Projective Matrix Module */}
            <div className="bg-neutral-950/70 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-xl shadow-xl shadow-black/40 space-y-3.5 transition-all">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-semibold text-white tracking-tight">
                    Projective Tensor
                  </span>
                </div>
                <span className="text-xs font-mono text-neutral-400">H ∈ SE(2)</span>
              </div>

              <pre className="bg-black/40 border border-white/5 rounded-xl p-3.5 text-xs font-mono text-neutral-300 leading-relaxed overflow-x-auto">
                {isFailed
                  ? `[   NaN        NaN        NaN    ]\n[   NaN        NaN        NaN    ]\n[ 0.000000   0.000000   1.000000 ]`
                  : `[  1.038421  -0.012480  +28.14022 ]\n[ +0.011815   1.035190  -19.82410 ]\n[ +0.000040  -0.000020   1.000000 ]`}
              </pre>

              <div className="flex justify-between items-center text-xs font-mono text-neutral-400 pt-1">
                <span>det(H): <strong className="text-cyan-300 font-semibold">1.0749</strong></span>
                <span>Scale: <strong className="text-blue-300 font-semibold">1.037×</strong></span>
                <span>Rot: <strong className="text-cyan-300 font-semibold">2.38°</strong></span>
              </div>
            </div>
          </aside>

          {/* ============================================================ */}
          {/* RIGHT COLUMN: Ground Truth Metrics & Interactive Visualizer  */}
          {/* ============================================================ */}
          <main className="lg:col-span-8 space-y-6">
            {/* Ground Truth Metric Cards with Clean Minimalist Telemetry */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-neutral-950/70 border border-white/10 hover:border-cyan-500/30 rounded-2xl p-5 backdrop-blur-xl transition-colors">
                <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00E5FF]" />
                  <span>Sub-Pixel RMSE</span>
                </div>
                <div
                  className={cn(
                    "text-2xl sm:text-3xl font-mono font-semibold tracking-tight",
                    isFailed ? "text-red-400" : "text-cyan-400"
                  )}
                >
                  {isFailed ? "DEGENERATE" : pipelineRun ? "0.38 px" : "0.42 px"}
                </div>
                <div className="text-xs font-mono text-neutral-500 mt-1">
                  Target &lt; 1.0 px
                </div>
              </div>

              <div className="bg-neutral-950/70 border border-white/10 hover:border-blue-500/30 rounded-2xl p-5 backdrop-blur-xl transition-colors">
                <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_#3b82f6]" />
                  <span>Inlier Ratio</span>
                </div>
                <div
                  className={cn(
                    "text-2xl sm:text-3xl font-mono font-semibold tracking-tight",
                    isFailed ? "text-red-400" : "text-blue-400"
                  )}
                >
                  {isFailed ? "14.2%" : pipelineRun ? "88.6%" : "87.4%"}
                </div>
                <div className="text-xs font-mono text-neutral-500 mt-1">
                  Target &gt; 50.0%
                </div>
              </div>

              <div className="bg-neutral-950/70 border border-white/10 hover:border-emerald-500/30 rounded-2xl p-5 backdrop-blur-xl transition-colors">
                <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                  <span>LoFTR Matches</span>
                </div>
                <div
                  className={cn(
                    "text-2xl sm:text-3xl font-mono font-semibold tracking-tight",
                    isFailed ? "text-red-400" : "text-emerald-400"
                  )}
                >
                  {isFailed ? "7" : pipelineRun ? "1,248" : "1,192"}
                </div>
                <div className="text-xs font-mono text-neutral-500 mt-1">
                  Tie-Points Locked
                </div>
              </div>
            </div>

            {/* Failure Alert Banner */}
            {isFailed && (
              <div className="bg-red-950/30 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3.5 backdrop-blur-xl">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <div className="text-xs">
                  <div className="font-semibold text-red-200">
                    Registration Failed: Insufficient geometric overlap detected.
                  </div>
                  <div className="text-red-300/80 mt-0.5 font-mono text-[11px]">
                    LoFTR identified only 7 feature correspondences (Threshold: ≥15). Projective matrix singular.
                  </div>
                </div>
              </div>
            )}

            {/* Visualizer Workspace Module */}
            <div className="bg-neutral-950/70 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-xl shadow-xl shadow-black/40 space-y-5">
              {/* Segmented Tab Controls (Vercel Style Clean Pill Bar) */}
              <div className="flex border-b border-white/10 pb-3 gap-1 overflow-x-auto">
                <button
                  onClick={() => setActiveTab("slider")}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap",
                    activeTab === "slider"
                      ? "bg-white/10 text-white border border-white/10 font-semibold shadow-sm"
                      : "text-neutral-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Swipe Comparison</span>
                </button>
                <button
                  onClick={() => setActiveTab("loftr")}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap",
                    activeTab === "loftr"
                      ? "bg-white/10 text-white border border-white/10 font-semibold shadow-sm"
                      : "text-neutral-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
                  <span>LoFTR Matches</span>
                </button>
                <button
                  onClick={() => setActiveTab("checker")}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap",
                    activeTab === "checker"
                      ? "bg-white/10 text-white border border-white/10 font-semibold shadow-sm"
                      : "text-neutral-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Grid3X3 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Checkerboard Blend</span>
                </button>
              </div>

              {/* TAB 1: Before/After Swipe Slider */}
              {activeTab === "slider" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-cyan-400" />
                        <h3 className="text-sm font-semibold text-white tracking-tight">
                          Multi-Modal Optical to Hyperspectral Overlay
                        </h3>
                      </div>
                      <p className="text-xs text-neutral-400 mt-1">
                        Compare high-res panchromatic OHRC (0.25 m/px) with reflectance IIRS spectral signature (80 m/px).
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono">
                      <button
                        onClick={() => setComparisonMode("aligned")}
                        className={cn(
                          "px-3 py-1 rounded-full border text-xs transition-all flex items-center gap-1.5 cursor-pointer",
                          comparisonMode === "aligned"
                            ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/40 font-medium"
                            : "bg-neutral-900/60 text-neutral-400 border-white/10 hover:text-white"
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full", comparisonMode === "aligned" ? "bg-cyan-400 shadow-[0_0_6px_#00E5FF]" : "bg-neutral-600")} />
                        Sub-Pixel Locked
                      </button>
                      <button
                        onClick={() => setComparisonMode("unaligned")}
                        className={cn(
                          "px-3 py-1 rounded-full border text-xs transition-all flex items-center gap-1.5 cursor-pointer",
                          comparisonMode === "unaligned"
                            ? "bg-amber-500/10 text-amber-300 border-amber-500/40 font-medium"
                            : "bg-neutral-900/60 text-neutral-400 border-white/10 hover:text-white"
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full", comparisonMode === "unaligned" ? "bg-amber-400 shadow-[0_0_6px_#f59e0b]" : "bg-neutral-600")} />
                        Raw Drift (3.4 px)
                      </button>
                    </div>
                  </div>

                  {/* Visualizer Canvas with Explicit Overflow Containment */}
                  {(() => {
                    const clampedPos = Math.min(Math.max(sliderPos, 6), 94);
                    return (
                      <div className="relative w-full h-[440px] bg-black rounded-xl overflow-hidden border border-white/10 select-none group isolate">
                        {/* Layer 1: Simulated Grayscale OHRC Base (0.25 m/px Panchromatic) */}
                        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black flex items-center justify-center pointer-events-none">
                          <div className="relative w-80 h-80 rounded-full border-[12px] border-neutral-600 bg-neutral-900 shadow-[inset_0_20px_35px_rgba(0,0,0,0.95)] flex items-center justify-center">
                            <div className="absolute inset-4 rounded-full border border-neutral-700/50" />
                            <div className="w-20 h-20 rounded-full bg-neutral-700 shadow-md border border-neutral-500 flex items-center justify-center">
                              <div className="w-6 h-6 rounded-full bg-neutral-400" />
                            </div>
                            {/* Grayscale Ejecta Rays */}
                            <div className="absolute w-full h-0.5 bg-neutral-700/40 rotate-45" />
                            <div className="absolute w-full h-0.5 bg-neutral-700/40 -rotate-45" />
                          </div>

                          {/* Top Left Sensor Metadata Badge */}
                          <div className="absolute top-3.5 left-3.5 z-20 pointer-events-none flex items-center gap-2 bg-black/85 px-3 py-1 rounded-full border border-cyan-500/40 text-xs font-mono text-cyan-300 shadow-lg">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00E5FF]" />
                            <span>OHRC (0.25 m/px Optical)</span>
                          </div>

                          {/* Bottom Left Coordinate Sub-badge */}
                          <div className="absolute bottom-3.5 left-3.5 z-20 pointer-events-none text-[11px] font-mono text-neutral-400 bg-black/80 px-2.5 py-1 rounded-full border border-white/10">
                            BASE: PANCHROMATIC REF
                          </div>
                        </div>

                        {/* Layer 2: Simulated High-Precision Spectral IIRS Overlay (Revealed by Slider) */}
                        <div
                          className="absolute inset-0 overflow-hidden pointer-events-none"
                          style={{
                            clipPath: `polygon(${clampedPos}% 0, 100% 0, 100% 100%, ${clampedPos}% 100%)`,
                          }}
                        >
                          {/* Stationary Spectral Background */}
                          <div className="absolute inset-0 bg-gradient-to-br from-[#120726] via-[#1a0f35] to-[#070b19]" />

                          {/* Isolated Crater Structure with Sub-Pixel Alignment / Raw Drift Transform */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div
                              className={cn(
                                "relative w-80 h-80 rounded-full border-[12px] border-amber-500 bg-purple-950/80 shadow-[inset_0_20px_35px_rgba(0,0,0,0.95),0_0_30px_rgba(245,158,11,0.3)] flex items-center justify-center transition-transform duration-300 ease-out",
                                comparisonMode === "unaligned"
                                  ? "translate-x-5 -translate-y-3 rotate-1"
                                  : "translate-x-0 translate-y-0 rotate-0"
                              )}
                            >
                              <div className="absolute inset-4 rounded-full border border-cyan-500/40" />
                              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-400 to-amber-300 shadow-[0_0_15px_#00E5FF] flex items-center justify-center">
                                <div className="w-6 h-6 rounded-full bg-white shadow-md" />
                              </div>
                              {/* False-Color Spectral Streaks */}
                              <div className="absolute w-full h-0.5 bg-cyan-400/50 rotate-45 shadow-[0_0_8px_#00E5FF]" />
                              <div className="absolute w-full h-0.5 bg-pink-500/50 -rotate-45 shadow-[0_0_8px_#ec4899]" />
                            </div>
                          </div>

                          {/* Top Right Sensor Metadata Badge */}
                          <div className="absolute top-3.5 right-3.5 z-20 pointer-events-none flex items-center gap-2 bg-black/85 px-3 py-1 rounded-full border border-amber-500/40 text-xs font-mono text-amber-300 shadow-lg">
                            <span
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                comparisonMode === "aligned"
                                  ? "bg-cyan-400 shadow-[0_0_6px_#00E5FF]"
                                  : "bg-amber-400 shadow-[0_0_6px_#f59e0b]"
                              )}
                            />
                            <span>
                              IIRS 80m ({comparisonMode === "aligned" ? "Sub-Pixel Locked" : "Raw Drift"})
                            </span>
                          </div>

                          {/* Bottom Right Coordinate Sub-badge */}
                          <div className="absolute bottom-3.5 right-3.5 z-20 pointer-events-none text-[11px] font-mono text-neutral-400 bg-black/80 px-2.5 py-1 rounded-full border border-white/10">
                            OVERLAY: SWIR BAND 128
                          </div>
                        </div>

                        {/* Prominent High-Visibility Cyan Split Divider Line & Clamped Grab Handle */}
                        <div
                          className="absolute top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_15px_#00E5FF,0_0_30px_rgba(0,229,255,0.8)] cursor-ew-resize z-10 pointer-events-none"
                          style={{ left: `${clampedPos}%` }}
                        >
                          {/* Top Anchor Dot */}
                          <div className="absolute top-2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#00E5FF] border border-black" />

                          {/* Tactile Grab Handle at Center (Vertically centered away from top and bottom badges) */}
                          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none select-none">
                            {/* Split Ratio Badge */}
                            <div className="bg-black/95 text-cyan-300 border border-cyan-400/80 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-medium tracking-wider shadow-[0_0_15px_rgba(0,229,255,0.4)] whitespace-nowrap mb-2 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                              <span>SPLIT: {clampedPos}%</span>
                            </div>

                            {/* Center Circular Disc */}
                            <div className="w-10 h-10 rounded-full bg-cyan-400 text-black font-semibold flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.8)] ring-4 ring-black ring-offset-1 ring-offset-cyan-400 group-hover:scale-110 active:scale-95 transition-all">
                              <MoveHorizontal className="w-4 h-4 text-black stroke-[3]" />
                            </div>

                            {/* Drag Indicator Text */}
                            <div className="bg-black/95 text-neutral-300 border border-white/10 px-2 py-0.5 rounded-full font-mono text-[9px] font-medium tracking-widest shadow-md whitespace-nowrap mt-2">
                              ◀ DRAG ▶
                            </div>
                          </div>

                          {/* Bottom Anchor Dot */}
                          <div className="absolute bottom-2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#00E5FF] border border-black" />
                        </div>

                        {/* Transparent Range Input Overlay for Dragging */}
                        <input
                          type="range"
                          min="6"
                          max="94"
                          value={sliderPos}
                          onChange={(e) => setSliderPos(Number(e.target.value))}
                          className="absolute inset-0 opacity-0 cursor-ew-resize z-30"
                        />
                      </div>
                    );
                  })()}

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-neutral-400 px-1">
                    <span className="flex items-center gap-1.5 text-cyan-400">
                      <MoveHorizontal className="w-3.5 h-3.5" />
                      <span>Drag vertical split handle across the crater to verify boundary alignment</span>
                    </span>
                    <span className="text-neutral-400">
                      RMSE Residual:{" "}
                      <span className="text-white font-medium">
                        {comparisonMode === "aligned" ? "0.38 px (Convergence Verified)" : "3.42 px (Unregistered Drift)"}
                      </span>
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 2: LoFTR Keypoint Matches */}
              {activeTab === "loftr" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Crosshair className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-sm font-semibold text-white tracking-tight">
                          Dense LoFTR Geometric Locking
                        </h3>
                      </div>
                      <p className="text-xs text-neutral-400 mt-1">
                        Detector-free transformer feature-matching establishing cross-modal tie-points across sensor strips.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-xs px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-neutral-300 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                        <span>1,428 Matched Pairs</span>
                      </span>
                      <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-medium">
                        94.2% Inlier Consensus
                      </span>
                    </div>
                  </div>

                  {/* Dual-Sensor Strip LoFTR Canvas with SVG Correspondence Vectors */}
                  <div className="relative w-full h-[420px] bg-black rounded-xl border border-white/10 overflow-hidden select-none">
                    <svg className="w-full h-full" viewBox="0 0 800 420" preserveAspectRatio="none">
                      <defs>
                        {/* Grid pattern for sensor strip backgrounds */}
                        <pattern id="loftr-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="0.8" />
                        </pattern>
                      </defs>

                      {/* Left Strip: OHRC Sensor Strip (0.25 m/px Panchromatic) */}
                      <g id="ohrc-sensor-strip">
                        <rect x="20" y="20" width="365" height="380" rx="8" fill="#0d0d12" stroke="#27272a" strokeWidth="1" />
                        <rect x="20" y="20" width="365" height="380" fill="url(#loftr-grid)" />

                        {/* OHRC Crater Structure in High-Contrast Grayscale */}
                        <ellipse cx="202" cy="210" rx="100" ry="80" stroke="#71717a" strokeWidth="14" fill="#141418" />
                        <ellipse cx="198" cy="206" rx="86" ry="68" fill="#09090b" />
                        {/* Central Peak */}
                        <polygon points="194,220 202,192 210,220" fill="#a1a1aa" stroke="#d4d4d8" strokeWidth="1.5" />
                        {/* Ejecta radial rays */}
                        <line x1="102" y1="130" x2="140" y2="160" stroke="#3f3f46" strokeWidth="2" strokeDasharray="2,2" />
                        <line x1="302" y1="130" x2="264" y2="160" stroke="#3f3f46" strokeWidth="2" strokeDasharray="2,2" />
                        <line x1="102" y1="290" x2="140" y2="260" stroke="#3f3f46" strokeWidth="2" strokeDasharray="2,2" />
                        <line x1="302" y1="290" x2="264" y2="260" stroke="#3f3f46" strokeWidth="2" strokeDasharray="2,2" />
                        {/* Coordinate Reticle */}
                        <circle cx="202" cy="210" r="14" fill="none" stroke="#00E5FF" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.6" />
                        <line x1="202" y1="190" x2="202" y2="230" stroke="#00E5FF" strokeWidth="0.8" opacity="0.5" />
                        <line x1="182" y1="210" x2="222" y2="210" stroke="#00E5FF" strokeWidth="0.8" opacity="0.5" />
                      </g>

                      {/* Right Strip: IIRS Multispectral Frame (80 m/px Hyperspectral) */}
                      <g id="iirs-sensor-strip">
                        <rect x="415" y="20" width="365" height="380" rx="8" fill="#100b1a" stroke="#27272a" strokeWidth="1" />
                        <rect x="415" y="20" width="365" height="380" fill="url(#loftr-grid)" />

                        {/* IIRS Crater Structure in False-Color Spectral Tones */}
                        <ellipse cx="598" cy="210" rx="100" ry="80" stroke="#f59e0b" strokeWidth="14" fill="#1e1035" />
                        <ellipse cx="594" cy="206" rx="86" ry="68" fill="#071326" stroke="#00E5FF" strokeWidth="2" />
                        {/* Central Peak */}
                        <polygon points="590,220 598,192 606,220" fill="#00E5FF" stroke="#f43f5e" strokeWidth="1.5" />
                        {/* Ejecta radial rays */}
                        <line x1="498" y1="130" x2="536" y2="160" stroke="#a855f7" strokeWidth="2" strokeDasharray="2,2" />
                        <line x1="698" y1="130" x2="660" y2="160" stroke="#a855f7" strokeWidth="2" strokeDasharray="2,2" />
                        <line x1="498" y1="290" x2="536" y2="260" stroke="#a855f7" strokeWidth="2" strokeDasharray="2,2" />
                        <line x1="698" y1="290" x2="660" y2="260" stroke="#a855f7" strokeWidth="2" strokeDasharray="2,2" />
                        {/* Coordinate Reticle */}
                        <circle cx="598" cy="210" r="14" fill="none" stroke="#00FF66" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.6" />
                        <line x1="598" y1="190" x2="598" y2="230" stroke="#00FF66" strokeWidth="0.8" opacity="0.5" />
                        <line x1="578" y1="210" x2="618" y2="210" stroke="#00FF66" strokeWidth="0.8" opacity="0.5" />
                      </g>

                      {/* LoFTR Correspondence Matching Lines & Keypoint Circles */}
                      {[
                        // Rim Correspondence Points (Vibrant Cyan, Green, Magenta inliers)
                        { x1: 202, y1: 130, x2: 598, y2: 130, inlier: true, color: "#00E5FF" },
                        { x1: 236, y1: 136, x2: 632, y2: 136, inlier: true, color: "#00FF66" },
                        { x1: 268, y1: 152, x2: 664, y2: 152, inlier: true, color: "#FF007F" },
                        { x1: 292, y1: 178, x2: 688, y2: 178, inlier: true, color: "#00E5FF" },
                        { x1: 302, y1: 210, x2: 698, y2: 210, inlier: true, color: "#00FF66" },
                        { x1: 292, y1: 242, x2: 688, y2: 242, inlier: true, color: "#FF007F" },
                        { x1: 268, y1: 268, x2: 664, y2: 268, inlier: true, color: "#00E5FF" },
                        { x1: 236, y1: 284, x2: 632, y2: 284, inlier: true, color: "#00FF66" },
                        { x1: 202, y1: 290, x2: 598, y2: 290, inlier: true, color: "#FF007F" },
                        { x1: 168, y1: 284, x2: 564, y2: 284, inlier: true, color: "#00E5FF" },
                        { x1: 136, y1: 268, x2: 532, y2: 268, inlier: true, color: "#00FF66" },
                        { x1: 112, y1: 242, x2: 508, y2: 242, inlier: true, color: "#FF007F" },
                        { x1: 102, y1: 210, x2: 498, y2: 210, inlier: true, color: "#00E5FF" },
                        { x1: 112, y1: 178, x2: 508, y2: 178, inlier: true, color: "#00FF66" },
                        { x1: 136, y1: 152, x2: 532, y2: 152, inlier: true, color: "#FF007F" },
                        { x1: 168, y1: 136, x2: 564, y2: 136, inlier: true, color: "#00E5FF" },

                        // Floor & Central Peak Landmark Points
                        { x1: 202, y1: 210, x2: 598, y2: 210, inlier: true, color: "#00FF66" },
                        { x1: 190, y1: 198, x2: 586, y2: 198, inlier: true, color: "#00E5FF" },
                        { x1: 214, y1: 198, x2: 610, y2: 198, inlier: true, color: "#FF007F" },
                        { x1: 202, y1: 226, x2: 598, y2: 226, inlier: true, color: "#00FF66" },
                        { x1: 178, y1: 214, x2: 574, y2: 214, inlier: true, color: "#00E5FF" },
                        { x1: 226, y1: 214, x2: 622, y2: 214, inlier: true, color: "#FF007F" },

                        // Ejecta Rays & Peripheral Regolith Locks
                        { x1: 75,  y1: 105, x2: 471, y2: 105, inlier: true, color: "#00FF66" },
                        { x1: 328, y1: 105, x2: 724, y2: 105, inlier: true, color: "#00E5FF" },
                        { x1: 75,  y1: 315, x2: 471, y2: 315, inlier: true, color: "#FF007F" },
                        { x1: 328, y1: 315, x2: 724, y2: 315, inlier: true, color: "#00FF66" },

                        // RANSAC Outliers (Flagged with Red Dashed Vectors)
                        { x1: 120, y1: 110, x2: 545, y2: 155, inlier: false, color: "#EF4444" },
                        { x1: 285, y1: 300, x2: 650, y2: 250, inlier: false, color: "#EF4444" },
                      ]
                        .filter((_, idx) => (isFailed ? idx < 8 : true))
                        .map((pt, idx) => {
                          const isInlier = isFailed ? false : pt.inlier;
                          const vectorColor = isFailed ? "#EF4444" : pt.color;
                          const targetX2 = isFailed ? pt.x2 + ((idx * 27) % 60 - 30) : pt.x2;
                          const targetY2 = isFailed ? pt.y2 + ((idx * 31) % 50 - 25) : pt.y2;

                          return (
                            <g key={idx}>
                              {/* Ambient radiant glow on inlier correspondence lines */}
                              {isInlier && (
                                <line
                                  x1={pt.x1}
                                  y1={pt.y1}
                                  x2={targetX2}
                                  y2={targetY2}
                                  stroke={vectorColor}
                                  strokeWidth="4"
                                  strokeOpacity="0.25"
                                />
                              )}

                              {/* Primary correspondence vector */}
                              <line
                                x1={pt.x1}
                                y1={pt.y1}
                                x2={targetX2}
                                y2={targetY2}
                                stroke={vectorColor}
                                strokeWidth={isInlier ? "2" : "1.5"}
                                strokeOpacity={isInlier ? "0.9" : "0.7"}
                                strokeDasharray={isInlier ? "none" : "4,4"}
                              />

                              {/* Left Sensor Keypoint */}
                              <circle
                                cx={pt.x1}
                                cy={pt.y1}
                                r="5.5"
                                fill="none"
                                stroke={vectorColor}
                                strokeWidth="1.2"
                                opacity="0.8"
                              />
                              <circle
                                cx={pt.x1}
                                cy={pt.y1}
                                r="3"
                                fill={vectorColor}
                              />
                              <circle
                                cx={pt.x1}
                                cy={pt.y1}
                                r="1.2"
                                fill="#FFFFFF"
                              />

                              {/* Right Sensor Keypoint */}
                              <circle
                                cx={targetX2}
                                cy={targetY2}
                                r="5.5"
                                fill="none"
                                stroke={vectorColor}
                                strokeWidth="1.2"
                                opacity="0.8"
                              />
                              <circle
                                cx={targetX2}
                                cy={targetY2}
                                r="3"
                                fill={vectorColor}
                              />
                              <circle
                                cx={targetX2}
                                cy={targetY2}
                                r="1.2"
                                fill="#FFFFFF"
                              />
                            </g>
                          );
                        })}
                    </svg>

                    {/* Sensor Strip HUD Badges */}
                    <div className="absolute top-3.5 left-3.5 pointer-events-none flex items-center gap-2 bg-black/85 px-3 py-1 rounded-full border border-cyan-500/40 text-xs font-mono text-cyan-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00E5FF]" />
                      <span>OHRC STRIP (0.25 m/px Optical)</span>
                    </div>

                    <div className="absolute top-3.5 right-3.5 pointer-events-none flex items-center gap-2 bg-black/85 px-3 py-1 rounded-full border border-purple-500/40 text-xs font-mono text-purple-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF007F] shadow-[0_0_6px_#FF007F]" />
                      <span>IIRS FRAME (80 m/px SWIR Band 128)</span>
                    </div>

                    <div className="absolute bottom-3.5 left-3.5 pointer-events-none text-[11px] font-mono text-neutral-400 bg-black/80 px-2.5 py-1 rounded-full border border-white/10">
                      LAT: 43.31° S | LON: 11.36° W
                    </div>

                    <div className="absolute bottom-3.5 right-3.5 pointer-events-none text-[11px] font-mono text-neutral-400 bg-black/80 px-2.5 py-1 rounded-full border border-white/10">
                      SCALE RATIO: 320:1 | CANNY BRIDGED
                    </div>
                  </div>

                  {/* Multi-Color Technical Engineering Legend */}
                  <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#00E5FF] shadow-[0_0_6px_#00E5FF]" />
                        <span className="text-neutral-300">Electric Cyan: Spectral Tie-Points</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#00FF66] shadow-[0_0_6px_#00FF66]" />
                        <span className="text-neutral-300">Neon Green: Edge Gradient Locks</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#FF007F] shadow-[0_0_6px_#FF007F]" />
                        <span className="text-neutral-300">Bright Magenta: Topographic Invariants</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3.5 h-0.5 bg-red-400 border-t border-dashed border-red-400" />
                        <span className="text-neutral-400">Dashed Red: Epipolar Outliers</span>
                      </span>
                    </div>

                    <div className="text-neutral-400">
                      Geometric Error: <span className="text-emerald-400 font-medium">0.38 px RMS</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Checkerboard Blend */}
              {activeTab === "checker" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Grid3X3 className="w-4 h-4 text-cyan-400" />
                      <div>
                        <h3 className="text-sm font-semibold text-white tracking-tight">
                          Checkerboard Tile Verification
                        </h3>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          High-contrast alternating spectral/thermal false-color and panchromatic optical tiles.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                      {/* Sub-Pixel Lock vs Drift Toggle */}
                      <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-full border border-white/10">
                        <button
                          onClick={() => setComparisonMode("aligned")}
                          className={cn(
                            "px-3 py-0.5 rounded-full text-xs transition-all flex items-center gap-1 cursor-pointer",
                            comparisonMode === "aligned"
                              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-medium"
                              : "text-neutral-400 hover:text-white"
                          )}
                        >
                          <span className={cn("w-1.5 h-1.5 rounded-full", comparisonMode === "aligned" ? "bg-cyan-400" : "bg-neutral-600")} />
                          Locked
                        </button>
                        <button
                          onClick={() => setComparisonMode("unaligned")}
                          className={cn(
                            "px-3 py-0.5 rounded-full text-xs transition-all flex items-center gap-1 cursor-pointer",
                            comparisonMode === "unaligned"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium"
                              : "text-neutral-400 hover:text-white"
                          )}
                        >
                          <span className={cn("w-1.5 h-1.5 rounded-full", comparisonMode === "unaligned" ? "bg-amber-400" : "bg-neutral-600")} />
                          Simulate Drift
                        </button>
                      </div>

                      {/* Tile Size Buttons */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-neutral-500 text-xs">Tile:</span>
                        {[24, 32, 48, 64].map((s) => (
                          <button
                            key={s}
                            onClick={() => setTileSize(s)}
                            className={cn(
                              "px-2.5 py-0.5 rounded-md border text-xs transition-all cursor-pointer",
                              tileSize === s
                                ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/50 font-medium"
                                : "border-white/10 text-neutral-400 hover:text-white"
                            )}
                          >
                            {s}px
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* High-Contrast SVG Checkerboard Canvas */}
                  <div className="relative w-full h-[420px] rounded-xl border border-white/10 overflow-hidden select-none bg-black">
                    <svg className="w-full h-full" viewBox="0 0 800 420" preserveAspectRatio="none">
                      <defs>
                        {/* Checkerboard mask pattern: even tiles 0, odd tiles fill white */}
                        <pattern id="checker-mask-pattern" width={tileSize * 2} height={tileSize * 2} patternUnits="userSpaceOnUse">
                          <rect x="0" y="0" width={tileSize} height={tileSize} fill="#ffffff" />
                          <rect x={tileSize} y={tileSize} width={tileSize} height={tileSize} fill="#ffffff" />
                        </pattern>
                        <mask id="checkerboard-mask">
                          <rect width="100%" height="100%" fill="url(#checker-mask-pattern)" />
                        </mask>

                        {/* High-contrast glowing cyan grid line pattern for tile boundaries */}
                        <pattern id="checker-grid-lines" width={tileSize} height={tileSize} patternUnits="userSpaceOnUse">
                          <rect width={tileSize} height={tileSize} fill="none" stroke="#00E5FF" strokeWidth="1.2" strokeOpacity="0.65" />
                        </pattern>

                        {/* Distinct false-color spectral overlay tint on alternating tiles */}
                        <pattern id="odd-tile-tint" width={tileSize * 2} height={tileSize * 2} patternUnits="userSpaceOnUse">
                          <rect x="0" y="0" width={tileSize} height={tileSize} fill="rgba(245, 158, 11, 0.12)" />
                          <rect x={tileSize} y={tileSize} width={tileSize} height={tileSize} fill="rgba(245, 158, 11, 0.12)" />
                        </pattern>
                      </defs>

                      {/* Layer 1: OHRC 0.25m Panchromatic Grayscale Base (Even Tiles Visible) */}
                      <g id="ohrc-grayscale-base">
                        <rect width="100%" height="100%" fill="#111116" />
                        {/* Grayscale Ejecta Rays */}
                        <line x1="160" y1="50" x2="280" y2="140" stroke="#27272a" strokeWidth="4" />
                        <line x1="640" y1="50" x2="520" y2="140" stroke="#27272a" strokeWidth="4" />
                        <line x1="160" y1="370" x2="280" y2="280" stroke="#27272a" strokeWidth="4" />
                        <line x1="640" y1="370" x2="520" y2="280" stroke="#27272a" strokeWidth="4" />

                        {/* Panchromatic Crater Rim */}
                        <ellipse cx="400" cy="210" rx="170" ry="120" stroke="#71717a" strokeWidth="18" fill="#18181b" />
                        {/* Crater Floor Shadow */}
                        <ellipse cx="395" cy="205" rx="150" ry="102" fill="#09090b" />
                        {/* Central Peak in Grayscale */}
                        <polygon points="388,228 400,192 412,228" fill="#52525b" stroke="#a1a1aa" strokeWidth="2" />
                      </g>

                      {/* Layer 2: IIRS 80m False-Color Thermal/Spectral Overlay (Odd Tiles Masked) */}
                      <g
                        id="iirs-false-color-overlay"
                        mask="url(#checkerboard-mask)"
                        transform={comparisonMode === "unaligned" ? "translate(12, -8)" : "translate(0, 0)"}
                      >
                        {/* Thermal Infrared Regolith (Deep Violet) */}
                        <rect width="100%" height="100%" fill="#180d2e" />

                        {/* Spectral False-Color Ejecta Rays (Neon Magenta & Cyan) */}
                        <line x1="160" y1="50" x2="280" y2="140" stroke="#ec4899" strokeWidth="4" opacity="0.8" />
                        <line x1="640" y1="50" x2="520" y2="140" stroke="#00E5FF" strokeWidth="4" opacity="0.8" />
                        <line x1="160" y1="370" x2="280" y2="280" stroke="#00E5FF" strokeWidth="4" opacity="0.8" />
                        <line x1="640" y1="370" x2="520" y2="280" stroke="#ec4899" strokeWidth="4" opacity="0.8" />

                        {/* Vibrant Thermal Rim (Vivid Amber/Orange with Illuminated Yellow Crest) */}
                        <ellipse
                          cx="400"
                          cy="210"
                          rx="170"
                          ry="120"
                          stroke="#f59e0b"
                          strokeWidth="18"
                          fill="#2e1065"
                        />
                        <ellipse
                          cx="400"
                          cy="210"
                          rx="170"
                          ry="120"
                          stroke="#fef08a"
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray="60 30"
                          opacity="0.9"
                        />
                        {/* Spectral Mineral Basin (Electric Cyan) */}
                        <ellipse cx="395" cy="205" rx="150" ry="102" fill="#061224" stroke="#00E5FF" strokeWidth="3.5" />
                        {/* Spectral Peak (Electric Cyan & Magenta) */}
                        <polygon points="388,228 400,192 412,228" fill="#00E5FF" stroke="#f43f5e" strokeWidth="2" />
                      </g>

                      {/* Layer 3: High-Contrast Grid Lines Demarcating Tile Boundaries */}
                      <rect width="100%" height="100%" fill="url(#checker-grid-lines)" pointerEvents="none" />

                      {/* Layer 4: Luminous False-Color Tint on Alternating Odd Tiles */}
                      <rect width="100%" height="100%" fill="url(#odd-tile-tint)" pointerEvents="none" />
                    </svg>

                    {/* HUD Status Badges */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/85 px-3 py-1.5 rounded-full border border-cyan-500/40 text-xs font-mono">
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full",
                          comparisonMode === "aligned"
                            ? "bg-cyan-400 shadow-[0_0_8px_#00E5FF] animate-pulse"
                            : "bg-amber-400 shadow-[0_0_8px_#f59e0b]"
                        )}
                      />
                      <span className={comparisonMode === "aligned" ? "text-cyan-300 font-medium" : "text-amber-300 font-medium"}>
                        {comparisonMode === "aligned"
                          ? "Sub-Pixel Boundary Convergence: VERIFIED (0.38 px)"
                          : "Boundary Discontinuity Detected: DRIFT (3.42 px)"}
                      </span>
                    </div>

                    <div className="absolute bottom-3 right-3 hidden sm:flex items-center gap-3 bg-black/85 px-3 py-1.5 rounded-full border border-white/10 text-xs font-mono text-neutral-300">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 bg-[#18181b] border border-neutral-500 rounded-sm" />
                        <span>OHRC (Panchromatic)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 bg-amber-500/90 border border-amber-400 rounded-sm shadow-[0_0_6px_#f59e0b]" />
                        <span>IIRS (Spectral False-Color)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-neutral-400 px-1">
                    <span className="text-neutral-400">
                      Notice how the crater rim maintains continuous geometric curvature across alternating grayscale and false-color tiles when{" "}
                      <span className="text-cyan-300 font-medium">Sub-Pixel Locked</span>.
                    </span>
                    <span className="text-neutral-500 hidden md:inline">
                      Grid Pitch: {tileSize}px × {tileSize}px
                    </span>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </StarsBackground>
  );
}
