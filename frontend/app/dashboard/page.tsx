"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Compass,
  Radio,
  CheckCircle2,
  Layers,
  Sparkles,
  Activity,
  Crosshair,
  UploadCloud,
  RotateCcw,
  Play,
  Cpu,
  Target,
} from "lucide-react";
import { StarsBackground } from "@/components/ui/stars";
import { orbitron, sans, mono } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export default function MissionControlDashboard() {
  // Coordinate Inputs: Defaulting to Shackleton Crater (-89.90° S, 0.00° E)
  const [latitude, setLatitude] = useState("-89.90");
  const [longitude, setLongitude] = useState("0.00");

  // Pipeline Execution State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStage, setSimulationStage] = useState(4); // Default to converged state

  // Interactive Fact Bubble Index & Data (IIRS South Pole Fact first as in image_5.png)
  const [factIndex, setFactIndex] = useState(0);
  const moonFacts = [
    "The IIRS sensor maps lunar mineralogy in the infrared spectrum to locate hydroxyl and water signatures.",
    "The lunar south pole features permanently shadowed craters that act as cold traps for water ice.",
    "Chandrayaan-2's OHRC camera provides the highest resolution lunar images ever taken (0.25m/px).",
    "TMC-2 on board the orbiter maps the lunar surface in 3D to help us understand its geological evolution.",
  ];

  // Dynamic import of @google/model-viewer on client mount
  useEffect(() => {
    import("@google/model-viewer").catch((err) =>
      console.error("Failed to load @google/model-viewer:", err)
    );
  }, []);

  const handleInitiatePipeline = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    setSimulationStage(1);

    const t1 = setTimeout(() => setSimulationStage(2), 1000);
    const t2 = setTimeout(() => setSimulationStage(3), 2000);
    const t3 = setTimeout(() => {
      setSimulationStage(4);
      setIsSimulating(false);
    }, 3000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  };

  const handlePresetClick = (latStr: string, lonStr: string) => {
    setLatitude(latStr);
    setLongitude(lonStr);
  };

  // Pipeline Milestones Configuration
  const stages = [
    {
      id: 1,
      title: "GeoTIFF Ingestion",
      desc: "Parsing multi-band OHRC, TMC-2 & IIRS raster streams",
      subtext: "Payload: 16-bit GeoTIFF / PDS4 CRS Projection",
    },
    {
      id: 2,
      title: "Scale & Feature Matching",
      desc: "SuperPoint + LoFTR cross-sensor keypoints",
      subtext: "Transformer correlation matrix / Tie-points locked",
    },
    {
      id: 3,
      title: "Projective Homography",
      desc: "Non-linear RANSAC + Spline surface warping",
      subtext: "Projection: Affine + Thin-Plate Spline (TPS)",
    },
    {
      id: 4,
      title: "Sub-Pixel Verification",
      desc: "Multimodal boundary & epipolar alignment verified",
      subtext: "Residual: 0.42 px RMSE / Convergence confirmed",
    },
  ];

  // Dense LoFTR tie-point matches across the crater payload
  const loftrTiePoints = [
    { id: 1, x1: 22, y1: 30, x2: 25, y2: 33, color: "#10b981" },
    { id: 2, x1: 35, y1: 24, x2: 38, y2: 26, color: "#f59e0b" },
    { id: 3, x1: 52, y1: 28, x2: 55, y2: 31, color: "#10b981" },
    { id: 4, x1: 68, y1: 34, x2: 71, y2: 36, color: "#10b981" },
    { id: 5, x1: 82, y1: 40, x2: 84, y2: 43, color: "#f59e0b" },
    { id: 6, x1: 26, y1: 52, x2: 29, y2: 55, color: "#10b981" },
    { id: 7, x1: 44, y1: 46, x2: 47, y2: 49, color: "#10b981" },
    { id: 8, x1: 58, y1: 50, x2: 61, y2: 52, color: "#f59e0b" },
    { id: 9, x1: 75, y1: 56, x2: 78, y2: 59, color: "#10b981" },
    { id: 10, x1: 30, y1: 70, x2: 33, y2: 73, color: "#f59e0b" },
    { id: 11, x1: 46, y1: 66, x2: 49, y2: 69, color: "#10b981" },
    { id: 12, x1: 63, y1: 72, x2: 66, y2: 74, color: "#10b981" },
    { id: 13, x1: 79, y1: 78, x2: 82, y2: 81, color: "#f59e0b" },
    { id: 14, x1: 18, y1: 42, x2: 21, y2: 45, color: "#10b981" },
    { id: 15, x1: 85, y1: 28, x2: 87, y2: 30, color: "#10b981" },
    { id: 16, x1: 38, y1: 84, x2: 41, y2: 86, color: "#f59e0b" },
    { id: 17, x1: 54, y1: 86, x2: 57, y2: 88, color: "#10b981" },
    { id: 18, x1: 72, y1: 22, x2: 74, y2: 24, color: "#10b981" },
  ];

  // Matched Lunar South Pole Shackleton terrain image placeholder
  const shackletonSouthPoleImg =
    "https://images.unsplash.com/photo-1628126235206-5260b9ea6441?q=80&w=1200&auto=format&fit=crop";

  return (
    <main className={cn(sans.className, "min-h-screen w-full bg-[#07060c] text-white select-none overflow-x-hidden relative flex flex-col")}>
      {/* Absolute Cosmic Starfield Base Layer */}
      <StarsBackground factor={0.02} speed={50} className="fixed inset-0 z-0 pointer-events-none" />

      {/* ------------------------------------------------------------ */}
      {/* Top Navigation Bar Ribbon (Global Aerospace Header)          */}
      {/* ------------------------------------------------------------ */}
      <header className="relative z-30 w-full h-14 border-b border-white/10 bg-black/60 backdrop-blur-xl px-6 md:px-12 flex items-center justify-between shrink-0">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-widest cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>ORBITAL VIEW</span>
        </Link>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
            <span className="font-semibold text-white tracking-wider">CHANDRAYAAN-2 LUNAR MONITOR</span>
          </span>
          <span className="hidden sm:inline-block text-neutral-600">|</span>
          <span className="hidden sm:inline-block text-[11px] text-cyan-300/80">
            ALT: 100km POLAR • INC: 90.0° • EPHEMERIS SYNCED
          </span>
        </div>
      </header>

      {/* ------------------------------------------------------------ */}
      {/* Split-Panel Command Center (Left: 3D Moon & Payload / Right: Terminal) */}
      {/* ------------------------------------------------------------ */}
      <div className="relative z-10 w-full grid grid-cols-1 lg:grid-cols-2 border-b border-white/10">
        {/* ========================================================== */}
        {/* LEFT PANEL: 3D Lunar South Pole & Composite Payload Blend  */}
        {/* ========================================================== */}
        <section className="relative min-h-[640px] lg:min-h-[850px] w-full border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col justify-between p-6 md:p-8 bg-black/40 overflow-hidden">
          {/* Subtle Polar Grid Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_40%,_rgba(0,0,0,0.85)_100%)] pointer-events-none z-10" />

          {/* 3D Moon Model Centerpiece (Focused on South Pole) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
            <div className="w-[85%] h-[85%] max-w-[620px] max-h-[620px] m-auto relative">
              {/* @ts-ignore - model-viewer custom web component */}
              <model-viewer
                src="/moon.glb"
                alt="3D Lunar South Pole Shackleton Model"
                auto-rotate
                rotation-per-second="1.5deg"
                camera-orbit="0deg 110deg 2.8m"
                camera-target="0m 0m 0m"
                field-of-view="35deg"
                shadow-intensity="1.5"
                exposure="1.0"
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: "transparent",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* In-Place Fused 'COMPOSITE LUNAR PAYLOAD' Over Shackleton Crater */}
          <div className="relative z-20 max-w-md w-full bg-neutral-950/85 backdrop-blur-xl border border-cyan-500/40 rounded-2xl overflow-hidden shadow-[0_0_35px_rgba(0,229,255,0.18)] self-start mt-2 transition-all">
            {/* Top Bar Header */}
            <div className="bg-cyan-950/70 border-b border-cyan-500/30 px-4 py-2.5 flex items-center justify-between font-mono text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF] animate-pulse" />
                <span className="font-bold uppercase tracking-wider text-cyan-200">
                  COMPOSITE LUNAR PAYLOAD
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-semibold">
                <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                CONVERGED (0.42 px)
              </span>
            </div>

            {/* In-Place Detailed Blend Image Container */}
            <div className="relative w-full h-64 bg-black overflow-hidden group">
              {/* Layer 1: High-Contrast Panchromatic Terrain (OHRC) in Grayscale */}
              <div
                className="absolute inset-0 bg-cover bg-center grayscale brightness-95 contrast-150"
                style={{ backgroundImage: `url("${shackletonSouthPoleImg}")` }}
              />

              {/* Layer 2: Subtle, Complex False-Color IIRS Map (Cyan & Blue Hydroxyl/Water Ice Signatures) */}
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/35 via-blue-600/25 to-teal-400/35 mix-blend-screen pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,229,255,0.25)_0%,_rgba(30,58,138,0.3)_50%,_transparent_75%)] mix-blend-color-dodge pointer-events-none" />

              {/* Layer 3: Thousands of Tiny Connecting Green & Yellow Tie-Point Lines (Matched LoFTR Matches) */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none z-20"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {loftrTiePoints.map((pt) => (
                  <g key={pt.id}>
                    {/* Connecting tie-point line */}
                    <line
                      x1={`${pt.x1}%`}
                      y1={`${pt.y1}%`}
                      x2={`${pt.x2}%`}
                      y2={`${pt.y2}%`}
                      stroke={pt.color}
                      strokeWidth="0.6"
                      strokeDasharray="1,1"
                      opacity="0.85"
                    />
                    {/* Keypoint dot 1 */}
                    <circle cx={`${pt.x1}%`} cy={`${pt.y1}%`} r="0.9" fill={pt.color} opacity="0.9" />
                    {/* Keypoint dot 2 */}
                    <circle cx={`${pt.x2}%`} cy={`${pt.y2}%`} r="0.7" fill="#ffffff" opacity="0.9" />
                  </g>
                ))}
              </svg>

              {/* Center Target Crosshair over Shackleton */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 flex flex-col items-center">
                <div className="relative w-8 h-8 rounded-full border border-cyan-400/80 flex items-center justify-center text-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.5)]">
                  <Target className="w-4 h-4 text-[#00E5FF]" />
                  <span className="absolute inset-0 rounded-full border border-[#00E5FF] animate-ping opacity-35" />
                </div>
                <span className="mt-1 bg-black/80 px-2 py-0.5 rounded text-[9px] font-mono text-cyan-300 border border-cyan-500/30">
                  SHACKLETON (-89.90°, 0.00°)
                </span>
              </div>

              {/* Bottom Sensor Overlay Badges */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between z-20 font-mono text-[9px] text-neutral-300 pointer-events-none">
                <span className="bg-black/80 px-2 py-0.5 rounded border border-white/10 text-cyan-300">
                  OHRC 0.25m PAN + IIRS 80m SWIR
                </span>
                <span className="bg-black/80 px-2 py-0.5 rounded border border-white/10 text-amber-300">
                  1,192 LoFTR MATCHES
                </span>
              </div>
            </div>
          </div>

          {/* Sleek Rounded Lunar Fact Bubble (Retaining Exact IIRS Text) */}
          <div
            onClick={() => setFactIndex((prev) => (prev + 1) % moonFacts.length)}
            className="relative z-20 max-w-[320px] bg-cyan-600/30 backdrop-blur-md border border-cyan-400/50 text-white text-sm p-4 rounded-2xl rounded-bl-none shadow-[0_4px_20px_rgba(0,229,255,0.15)] cursor-pointer hover:bg-cyan-600/40 transition-all select-none self-start mt-6"
          >
            <p className="leading-relaxed text-xs">{moonFacts[factIndex]}</p>
            <span className="block mt-2 text-[10px] text-cyan-200 opacity-70">Tap for next fact...</span>
          </div>
        </section>

        {/* ========================================================== */}
        {/* RIGHT PANEL: Chandrayaan-2 Flight Terminal & Telemetry Engine */}
        {/* ========================================================== */}
        <section className="relative w-full p-6 md:p-8 space-y-6 flex flex-col justify-start bg-neutral-950/50">
          {/* Header Title with Orbitron Font */}
          <div className="pb-4 border-b border-white/10 space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#00E5FF]">
              <Compass className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>CHANDRAYAAN-2 FLIGHT TERMINAL</span>
            </div>
            <h1 className={cn(orbitron.className, "text-xl md:text-2xl font-bold tracking-tight text-white")}>
              Target Coordinates Command
            </h1>
            <p className="text-xs text-neutral-400">
              Specify lunar target sub-points to initiate sub-pixel projective warp and multi-sensor fusion.
            </p>
          </div>

          {/* Target Coordinates Command Box */}
          <div className="p-5 rounded-2xl border border-white/10 bg-neutral-950/80 backdrop-blur-xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-white font-semibold flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-[#00E5FF]" />
                TARGET COORDINATES
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                PDS4-CRS / ELLIPSOID
              </span>
            </div>

            <form onSubmit={handleInitiatePipeline} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Latitude Input */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                    LATITUDE (°N/S)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      placeholder="-89.90"
                      className="w-full bg-black/60 border border-white/10 focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] rounded-xl px-4 py-3 text-xs font-mono text-neutral-100 placeholder-neutral-600 focus:outline-none transition-all"
                      required
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-neutral-500">
                      DEG
                    </span>
                  </div>
                </div>

                {/* Longitude Input */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                    LONGITUDE (°E/W)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-black/60 border border-white/10 focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] rounded-xl px-4 py-3 text-xs font-mono text-neutral-100 placeholder-neutral-600 focus:outline-none transition-all"
                      required
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-neutral-500">
                      DEG
                    </span>
                  </div>
                </div>
              </div>

              {/* Target Presets */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[10px] font-mono uppercase text-neutral-500">Target Presets:</span>
                <button
                  type="button"
                  onClick={() => handlePresetClick("-89.90", "0.00")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-colors cursor-pointer",
                    latitude === "-89.90" && longitude === "0.00"
                      ? "border-cyan-400 bg-cyan-950/70 text-cyan-300 shadow-[0_0_10px_rgba(0,229,255,0.3)]"
                      : "border-white/10 bg-white/[0.03] hover:bg-cyan-900/40 text-neutral-300 hover:text-white"
                  )}
                >
                  Shackleton (-89.90°, 0.00°)
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetClick("-43.31", "-11.36")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-colors cursor-pointer",
                    latitude === "-43.31" && longitude === "-11.36"
                      ? "border-cyan-400 bg-cyan-950/70 text-cyan-300 shadow-[0_0_10px_rgba(0,229,255,0.3)]"
                      : "border-white/10 bg-white/[0.03] hover:bg-cyan-900/40 text-neutral-300 hover:text-white"
                  )}
                >
                  Tycho Crater (-43.31°, -11.36°)
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetClick("-53.00", "-169.00")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-colors cursor-pointer",
                    latitude === "-53.00" && longitude === "-169.00"
                      ? "border-cyan-400 bg-cyan-950/70 text-cyan-300 shadow-[0_0_10px_rgba(0,229,255,0.3)]"
                      : "border-white/10 bg-white/[0.03] hover:bg-cyan-900/40 text-neutral-300 hover:text-white"
                  )}
                >
                  Aitken Basin (-53.00°, -169.00°)
                </button>
              </div>

              {/* Glowing Pipeline Button */}
              <button
                type="submit"
                disabled={isSimulating}
                className={cn(
                  orbitron.className,
                  "w-full mt-2 bg-[#00E5FF] hover:bg-[#33ebff] text-black text-xs font-bold uppercase tracking-[0.2em] py-3.5 px-6 rounded-xl flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(0,229,255,0.45)] hover:shadow-[0_0_40px_rgba(0,229,255,0.7)] transition-all cursor-pointer border border-[#00E5FF] disabled:opacity-50"
                )}
              >
                <Play className="w-4 h-4 fill-black text-black" />
                <span>{isSimulating ? "EXECUTING MULTI-MODAL WARP..." : "INITIATE PIPELINE"}</span>
              </button>
            </form>
          </div>

          {/* Precision Metrics Dashboard */}
          <div className="grid grid-cols-3 gap-3 font-mono">
            <div className="p-3.5 rounded-xl border border-white/10 bg-black/60 text-center space-y-1">
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider">SUB-PIXEL RMSE</div>
              <div className="text-base md:text-lg font-bold text-emerald-400">0.42 px</div>
              <div className="text-[9px] text-neutral-500">Target &lt; 0.50 px</div>
            </div>
            <div className="p-3.5 rounded-xl border border-white/10 bg-black/60 text-center space-y-1">
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider">INLIER RATIO</div>
              <div className="text-base md:text-lg font-bold text-[#00E5FF]">87.4%</div>
              <div className="text-[9px] text-neutral-500">RANSAC Consensus</div>
            </div>
            <div className="p-3.5 rounded-xl border border-white/10 bg-black/60 text-center space-y-1">
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider">LoFTR MATCHES</div>
              <div className="text-base md:text-lg font-bold text-amber-300">1,192</div>
              <div className="text-[9px] text-neutral-500">Dense Tie-Points</div>
            </div>
          </div>

          {/* Projective Tensor Matrix Display */}
          <div className="p-4 rounded-xl border border-white/10 bg-black/60 font-mono space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-neutral-400 font-semibold uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>PROJECTIVE TENSOR (ESTIMATED 3×3 HOMOGRAPHY)</span>
              </div>
              <span className="text-cyan-400 font-bold">H ∈ SE(2)</span>
            </div>
            <pre className="text-xs text-cyan-300 font-mono tracking-wider leading-relaxed bg-black/70 p-3 rounded-lg border border-cyan-500/20 shadow-inner overflow-x-auto">
{`[  +1.0142   -0.0189   +24.81  ]
[  +0.0184   +1.0118   -14.36  ]
[  +0.0000   -0.0000   +1.0000  ]`}
            </pre>
            <div className="text-[11px] font-mono text-neutral-400 flex items-center justify-between pt-1 border-t border-white/5">
              <span>det(H) = <strong className="text-white">1.0264</strong></span>
              <span>Scale: <strong className="text-white">1.013×</strong></span>
              <span>Rot: <strong className="text-white">-1.05°</strong></span>
            </div>
          </div>

          {/* Pipeline Milestones */}
          <div className="p-4 rounded-xl border border-white/10 bg-black/60 space-y-3 font-mono">
            <div className="flex items-center justify-between text-[11px] text-neutral-300 font-semibold uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>PIPELINE MILESTONES</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-medium">4/4 STAGES COMPLETE</span>
            </div>
            <div className="space-y-2.5">
              {stages.map((st) => (
                <div key={st.id} className="flex items-start gap-2.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white truncate">{st.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                        Verified
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5">{st.desc}</p>
                    <span className="text-[10px] text-neutral-500">{st.subtext}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ------------------------------------------------------------ */}
      {/* Bottom Section: RAW SENSOR REFERENCE FRAMES Grid            */}
      {/* ------------------------------------------------------------ */}
      <section className="relative z-20 w-full bg-[#050505] pt-16 px-6 md:px-12 pb-24">
        {/* Section Header */}
        <div className="max-w-7xl mx-auto space-y-2 border-b border-white/10 pb-6">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#00E5FF]">
            <Layers className="w-4 h-4 text-[#00E5FF]" />
            <span>PAYLOAD BREAKDOWN ARCHITECTURE</span>
          </div>
          <h2 className={cn(orbitron.className, "text-2xl md:text-3xl font-bold tracking-tight text-white")}>
            RAW SENSOR REFERENCE FRAMES
          </h2>
          <p className="text-xs font-mono text-neutral-400 max-w-2xl">
            Inspect the three independent sensor streams fused into the composite payload. Each sensor captures a distinct spatial and spectral regime over the lunar South Pole (Shackleton Crater region).
          </p>
        </div>

        {/* 3-Column Grid for the 3 Sensor Reference Frames */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
          {/* Card 1: OHRC (0.25m/px) - High-Res Panchromatic Base */}
          <div className="border-2 border-dashed border-white/20 hover:border-cyan-400/60 rounded-2xl overflow-hidden p-6 bg-neutral-900/90 backdrop-blur-md shadow-2xl transition-all group flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-white font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]" />
                  SENSOR STREAM A
                </span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  0.25 m/px
                </span>
              </div>

              <h3 className="text-base font-semibold text-white tracking-tight">
                OHRC (0.25m/px) - High-Res Panchromatic Base
              </h3>

              <p className="text-xs text-neutral-400 leading-relaxed">
                Optical High Resolution Camera providing extreme structural detail, crater rim topography, and boulder shadows over Shackleton.
              </p>

              {/* Crater Macro Image Container */}
              <div className="relative w-full h-56 rounded-xl overflow-hidden border border-white/10 bg-black mt-2">
                <div
                  className="w-full h-full bg-cover bg-center grayscale brightness-95 contrast-130 group-hover:scale-105 transition-transform duration-500"
                  style={{ backgroundImage: `url("${shackletonSouthPoleImg}")` }}
                />
                <div className="absolute top-2.5 left-2.5 bg-black/80 px-2 py-0.5 rounded text-[9px] font-mono text-cyan-300 border border-cyan-500/30">
                  BAND: PAN (450-900nm)
                </div>
                <div className="absolute inset-0 border-2 border-dashed border-white/10 rounded-xl pointer-events-none" />
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-neutral-500">
              <span className="flex items-center gap-1.5 text-neutral-400">
                <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
                <span>Drop final OHRC GeoTIFF here</span>
              </span>
              <span>SWATH: 12 km</span>
            </div>
          </div>

          {/* Card 2: TMC-2 (5.0m/px) - Stereo Mapping */}
          <div className="border-2 border-dashed border-white/20 hover:border-blue-400/60 rounded-2xl overflow-hidden p-6 bg-neutral-900/90 backdrop-blur-md shadow-2xl transition-all group flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-white font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_#3b82f6]" />
                  SENSOR STREAM B
                </span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30">
                  5.0 m/px
                </span>
              </div>

              <h3 className="text-base font-semibold text-white tracking-tight">
                TMC-2 (5.0m/px) - Stereo Mapping
              </h3>

              <p className="text-xs text-neutral-400 leading-relaxed">
                Terrain Mapping Camera 2 generating high-resolution Digital Elevation Models (DEM) from fore, nadir, and aft views.
              </p>

              {/* Crater Macro Image Container with Stereo Shading */}
              <div className="relative w-full h-56 rounded-xl overflow-hidden border border-white/10 bg-black mt-2">
                <div
                  className="w-full h-full bg-cover bg-center contrast-150 brightness-85 sepia-[0.35] group-hover:scale-105 transition-transform duration-500"
                  style={{ backgroundImage: `url("${shackletonSouthPoleImg}")` }}
                />
                <div className="absolute top-2.5 left-2.5 bg-black/80 px-2 py-0.5 rounded text-[9px] font-mono text-blue-300 border border-blue-500/30">
                  STEREO TRIPLET DEM
                </div>
                <div className="absolute inset-0 border-2 border-dashed border-white/10 rounded-xl pointer-events-none" />
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-neutral-500">
              <span className="flex items-center gap-1.5 text-neutral-400">
                <UploadCloud className="w-3.5 h-3.5 text-blue-400" />
                <span>Drop final TMC-2 DEM here</span>
              </span>
              <span>SWATH: 20 km</span>
            </div>
          </div>

          {/* Card 3: IIRS (80m/px) - Hyperspectral SWIR */}
          <div className="border-2 border-dashed border-white/20 hover:border-purple-400/60 rounded-2xl overflow-hidden p-6 bg-neutral-900/90 backdrop-blur-md shadow-2xl transition-all group flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-white font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_#a855f7]" />
                  SENSOR STREAM C
                </span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  80 m/px
                </span>
              </div>

              <h3 className="text-base font-semibold text-white tracking-tight">
                IIRS (80m/px) - Hyperspectral SWIR
              </h3>

              <p className="text-xs text-neutral-400 leading-relaxed">
                Imaging Infrared Spectrometer characterizing water-ice signatures, hydroxyl absorption, and pyroxene mineralogy in Shackleton.
              </p>

              {/* Crater Macro Image Container with Hyperspectral Gradient */}
              <div className="relative w-full h-56 rounded-xl overflow-hidden border border-white/10 bg-black mt-2">
                <div
                  className="w-full h-full bg-cover bg-center invert hue-rotate-180 saturate-200 brightness-110 group-hover:scale-105 transition-transform duration-500"
                  style={{ backgroundImage: `url("${shackletonSouthPoleImg}")` }}
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/30 via-blue-500/25 to-purple-500/30 mix-blend-color-dodge" />
                <div className="absolute top-2.5 left-2.5 bg-black/80 px-2 py-0.5 rounded text-[9px] font-mono text-purple-300 border border-purple-500/30">
                  SWIR (0.8 - 5.0 µm)
                </div>
                <div className="absolute inset-0 border-2 border-dashed border-white/10 rounded-xl pointer-events-none" />
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-neutral-500">
              <span className="flex items-center gap-1.5 text-neutral-400">
                <UploadCloud className="w-3.5 h-3.5 text-purple-400" />
                <span>Drop final IIRS spectral cube here</span>
              </span>
              <span>256 BANDS</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
