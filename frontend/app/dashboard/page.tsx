"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Crosshair,
  Play,
  Layers,
  CheckCircle2,
  Clock,
  Sparkles,
  Compass,
  Radio,
  Globe2,
} from "lucide-react";
import { StarsBackground } from "@/components/ui/stars";
import { sans, mono } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export default function CommandCenterDashboard() {
  // Targeting Inputs
  const [latitude, setLatitude] = useState("-43.31");
  const [longitude, setLongitude] = useState("-11.36");

  // State Management as specified: isSimulating, simulationStage, showResult
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStage, setSimulationStage] = useState(0); // 0 = idle, 1..4 = active stages
  const [showResult, setShowResult] = useState(false);

  // Dynamic import of @google/model-viewer on client mount
  useEffect(() => {
    import("@google/model-viewer").catch((err) =>
      console.error("Failed to load @google/model-viewer:", err)
    );
  }, []);

  // Step-by-step automatic progression of the 4-stage pipeline simulation
  useEffect(() => {
    if (!isSimulating) return;

    const timer1 = setTimeout(() => {
      setSimulationStage(2);
    }, 1100);

    const timer2 = setTimeout(() => {
      setSimulationStage(3);
    }, 2200);

    const timer3 = setTimeout(() => {
      setSimulationStage(4);
    }, 3300);

    const timer4 = setTimeout(() => {
      setIsSimulating(false);
      setShowResult(true);
    }, 4500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [isSimulating]);

  const handleInitiatePipeline = (e: React.FormEvent) => {
    e.preventDefault();
    setShowResult(false);
    setSimulationStage(1);
    setIsSimulating(true);
  };

  const setPresetTarget = (lat: string, lon: string) => {
    setLatitude(lat);
    setLongitude(lon);
    setShowResult(false);
    setSimulationStage(0);
    setIsSimulating(false);
  };

  const stages = [
    {
      id: 1,
      title: "Stage 1: GeoTIFF Ingestion",
      desc: "Parse multi-band OHRC, TMC-2 & IIRS raster streams",
      subtext: "Payload: 16-bit GeoTIFF / PDS4 CRS Projection",
    },
    {
      id: 2,
      title: "Stage 2: Scale & Feature Matching",
      desc: "Extract LoFTR dense correspondences across modalities",
      subtext: "Transformer correlation matrix / Tie-points locked",
    },
    {
      id: 3,
      title: "Stage 3: Projective Homography",
      desc: "Solve H ∈ SE(2) perspective warp with RANSAC consensus",
      subtext: "Perspective transform solver / Inlier ratio: 94.2%",
    },
    {
      id: 4,
      title: "Stage 4: Sub-Pixel Verification",
      desc: "Compute target RMSE convergence < 1.0 px",
      subtext: "Residual: 0.38 px RMS / Multimodal boundary verified",
    },
  ];

  return (
    <main className={cn(sans.className, "relative w-screen h-screen overflow-hidden bg-[#07060c] text-white select-none")}>
      {/* Absolute Cosmic Base Layer */}
      <StarsBackground factor={0.02} speed={50} className="absolute inset-0 z-0 pointer-events-none" />

      {/* 50/50 Split-Screen Command Center Container */}
      <div className="relative z-10 w-full h-full grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        {/* ================================================================ */}
        {/* LEFT HALF: 3D Lunar View & Telemetry (Fixed Viewport)             */}
        {/* ================================================================ */}
        <section className="relative h-full w-full overflow-hidden border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col justify-between p-5 md:p-6 bg-black/40">
          {/* 3D Moon Model Viewer taking up the majority of space */}
          <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-auto">
            <model-viewer
              src="/moon.glb"
              alt="3D Lunar Model"
              auto-rotate
              camera-controls
              rotation-per-second="18deg"
              shadow-intensity="1"
              shadow-softness="0.8"
              exposure="1.1"
              camera-orbit="0deg 75deg 105%"
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: "transparent",
                outline: "none",
              }}
            />
          </div>

          {/* Top Edge: Mission Return Link & Breadcrumb Header */}
          <div className="relative z-10 flex items-center justify-between pointer-events-auto">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-black/60 hover:bg-white/10 hover:border-white/20 text-neutral-300 hover:text-white text-xs font-mono transition-all backdrop-blur-md group"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#00E5FF] group-hover:-translate-x-0.5 transition-transform" />
              <span>ORBITAL VIEW</span>
            </Link>

            <div className="px-3 py-1 rounded-full text-[10px] font-mono tracking-wider uppercase bg-black/60 border border-white/10 text-neutral-300 backdrop-blur-md flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] shadow-[0_0_6px_#00E5FF] animate-pulse" />
              <span>CHANDRAYAAN-2 ORBITER</span>
            </div>
          </div>

          {/* Floating Glassmorphism Telemetry Cards Over 3D Viewer */}
          <div className="relative z-10 pointer-events-none space-y-4 my-auto">
            {/* Telemetry Card 1: Mission Orbit Specs */}
            <div className="pointer-events-auto w-fit max-w-xs p-3.5 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md shadow-2xl space-y-1.5">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                <Radio className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span className="font-semibold text-white">MISSION: Chandrayaan-2</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                <div>
                  <span className="text-[10px] text-neutral-500 block">ALTITUDE</span>
                  <span className="text-neutral-200 font-medium">100 km Polar</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 block">INCLINATION</span>
                  <span className="text-cyan-300 font-medium">90.0° Orbit</span>
                </div>
              </div>
              <div className="text-[11px] font-mono text-neutral-400 pt-1 border-t border-white/5">
                TARGET RESOLUTION: <strong className="text-white font-medium">OHRC 0.25m/px</strong>
              </div>
            </div>

            {/* Telemetry Card 2: Lunar Physical Telemetry */}
            <div className="pointer-events-auto w-fit max-w-xs p-3.5 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md shadow-2xl space-y-1.5">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                <Globe2 className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span className="font-semibold text-white">LUNAR TELEMETRY</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                <div>
                  <span className="text-[10px] text-neutral-500 block">RADIUS</span>
                  <span className="text-neutral-200 font-medium">1,737.4 km</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 block">GRAVITY</span>
                  <span className="text-amber-300 font-medium">1.62 m/s²</span>
                </div>
              </div>
              <div className="text-[11px] font-mono text-neutral-400 pt-1 border-t border-white/5">
                SOLAR INCIDENCE: <strong className="text-amber-300 font-medium">21.4° (High Sun)</strong>
              </div>
            </div>
          </div>

          {/* Bottom Edge: Telemetry Card 3 - Payload Configuration */}
          <div className="relative z-10 pointer-events-auto">
            <div className="w-full max-w-md p-3.5 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md shadow-2xl flex items-center justify-between text-xs font-mono">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-neutral-500">PAYLOAD CONSTELLATION</div>
                <div className="text-neutral-200 font-medium mt-0.5">OHRC (0.25m) • TMC-2 (5.0m) • IIRS (80m)</div>
              </div>
              <div className="text-right pl-3 border-l border-white/10">
                <div className="text-[10px] uppercase tracking-wider text-cyan-400">WARP SOLVER</div>
                <div className="text-cyan-300 font-semibold mt-0.5">H ∈ SE(2)</div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* RIGHT HALF: Mission Control & Simulation (Scrollable Viewport)   */}
        {/* ================================================================ */}
        <section className="relative h-full w-full overflow-y-auto p-5 md:p-8 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {/* Header Title */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#00E5FF]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] shadow-[0_0_6px_#00E5FF]" />
                Command Center Terminal
              </div>
              <h1 className="text-lg md:text-xl font-semibold tracking-tight text-white mt-1">
                Multi-Modal Lunar Registration
              </h1>
            </div>
            <div className="text-[11px] font-mono px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] text-neutral-300">
              PDS4 CRS: <span className="text-[#00E5FF] font-medium">LUNAR-S</span>
            </div>
          </div>

          {/* Targeting Input Form */}
          <div className="p-5 rounded-2xl border border-white/10 bg-neutral-950/70 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#00E5FF]" />
                <h2 className="text-xs font-mono uppercase tracking-wider text-white font-semibold">
                  Target Coordinates Input
                </h2>
              </div>
              <span className="text-[10px] font-mono text-neutral-500">WGS-84 / LUNAR ELLIPSOID</span>
            </div>

            <form onSubmit={handleInitiatePipeline} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Latitude Input */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                    Latitude (° N / S)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      placeholder="-43.31"
                      className="w-full bg-black/60 border border-white/10 focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] rounded-xl px-3.5 py-2.5 text-xs font-mono text-neutral-100 placeholder-neutral-600 focus:outline-none transition-all"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-neutral-500">
                      LAT
                    </span>
                  </div>
                </div>

                {/* Longitude Input */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                    Longitude (° E / W)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      placeholder="-11.36"
                      className="w-full bg-black/60 border border-white/10 focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] rounded-xl px-3.5 py-2.5 text-xs font-mono text-neutral-100 placeholder-neutral-600 focus:outline-none transition-all"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-neutral-500">
                      LON
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Targeting Presets */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[10px] font-mono uppercase text-neutral-500 mr-1">Presets:</span>
                <button
                  type="button"
                  onClick={() => setPresetTarget("-43.31", "-11.36")}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-mono border border-white/10 bg-white/[0.02] hover:bg-white/10 text-neutral-300 hover:text-white transition-all cursor-pointer"
                >
                  Tycho (-43.31°, -11.36°)
                </button>
                <button
                  type="button"
                  onClick={() => setPresetTarget("-89.90", "0.00")}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-mono border border-white/10 bg-white/[0.02] hover:bg-white/10 text-neutral-300 hover:text-white transition-all cursor-pointer"
                >
                  Shackleton (-89.90°, 0.00°)
                </button>
                <button
                  type="button"
                  onClick={() => setPresetTarget("-53.00", "-169.00")}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-mono border border-white/10 bg-white/[0.02] hover:bg-white/10 text-neutral-300 hover:text-white transition-all cursor-pointer"
                >
                  Aitken (-53.00°, -169.00°)
                </button>
              </div>

              {/* Prominent Accent-Colored Trigger Button */}
              <button
                type="submit"
                disabled={isSimulating}
                className="w-full bg-[#00E5FF] hover:bg-[#33ebff] active:scale-[0.99] text-black font-mono text-xs uppercase tracking-widest font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2.5 shadow-[0_0_20px_rgba(0,229,255,0.4)] hover:shadow-[0_0_30px_rgba(0,229,255,0.7)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group border border-transparent"
              >
                <Play className="w-4 h-4 fill-black text-black group-hover:scale-110 transition-transform" />
                <span>{isSimulating ? "EXECUTING REGISTRATION SEQUENCE..." : "INITIATE PIPELINE"}</span>
              </button>
            </form>
          </div>

          {/* 4-Stage Vertical Progress Timeline */}
          {(isSimulating || simulationStage > 0 || showResult) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl border border-white/10 bg-neutral-950/70 backdrop-blur-xl shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-white font-semibold">
                  <Clock className="w-4 h-4 text-[#00E5FF]" />
                  <span>Pipeline Execution Timeline</span>
                </div>
                <span className="text-[11px] font-mono text-[#00E5FF] font-medium">
                  {showResult
                    ? "4/4 Stages Complete (Verified)"
                    : `Active Stage: ${simulationStage}/4`}
                </span>
              </div>

              <div className="relative pl-1 space-y-4">
                {stages.map((st, index) => {
                  const isCompleted = simulationStage > st.id || showResult;
                  const isActive = isSimulating && simulationStage === st.id;
                  const isQueued = simulationStage < st.id && !showResult;

                  return (
                    <div key={st.id} className="relative flex items-start gap-3.5">
                      {/* Connecting vertical line */}
                      {index < stages.length - 1 && (
                        <div
                          className={cn(
                            "absolute left-[13px] top-7 bottom-[-16px] w-[1.5px] transition-colors duration-500",
                            isCompleted ? "bg-[#00E5FF]" : "bg-white/10"
                          )}
                        />
                      )}

                      {/* Numbered circular badge */}
                      <div
                        className={cn(
                          "relative z-10 w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-all",
                          isCompleted
                            ? "bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF] shadow-[0_0_10px_rgba(0,229,255,0.4)]"
                            : isActive
                            ? "bg-amber-500/20 text-amber-300 border-2 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)] animate-pulse"
                            : "bg-neutral-900 text-neutral-500 border border-white/10"
                        )}
                      >
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : st.id}
                      </div>

                      {/* Milestone details */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              "text-xs font-mono font-semibold truncate",
                              isActive
                                ? "text-amber-200"
                                : isCompleted
                                ? "text-white"
                                : "text-neutral-400"
                            )}
                          >
                            {st.title}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 font-medium",
                              isCompleted
                                ? "bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30"
                                : isActive
                                ? "bg-amber-500/10 text-amber-300 border border-amber-400/40 animate-pulse"
                                : "bg-white/[0.02] text-neutral-500 border border-white/5"
                            )}
                          >
                            {isCompleted ? "Complete" : isActive ? "Active..." : "Queued"}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                          {st.desc}
                        </p>
                        <p className="text-[10px] font-mono text-neutral-500 mt-0.5">
                          {st.subtext}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* The Result Payload: Multimodal Sensor Fusion Panel */}
          <AnimatePresence>
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.4 }}
                className="p-5 rounded-2xl border border-white/10 bg-neutral-950/70 backdrop-blur-xl shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#00E5FF]" />
                    <h3 className="text-xs font-mono uppercase tracking-wider text-white font-semibold">
                      Multimodal Sensor Fusion Result
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    SUB-PIXEL CONVERGED: 0.38 px
                  </span>
                </div>

                {/* Large Blank Placeholder div with Dashed Border as specified */}
                <div className="relative border-2 border-dashed border-[#00E5FF]/40 bg-black/60 backdrop-blur-md rounded-2xl min-h-[320px] flex flex-col items-center justify-center p-8 text-center transition-all group hover:border-[#00E5FF]/80">
                  <div className="w-14 h-14 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF] mb-3.5 shadow-[0_0_20px_rgba(0,229,255,0.3)] group-hover:scale-105 transition-transform">
                    <Crosshair className="w-7 h-7 animate-pulse" />
                  </div>

                  <p className="font-mono text-xs text-neutral-200 tracking-wider uppercase font-bold max-w-md leading-relaxed">
                    AWAITING MULTI-FRAME PAYLOAD FROM SENSORS...
                  </p>

                  <p className="font-mono text-[11px] text-neutral-400 mt-2 max-w-sm leading-relaxed">
                    Target Coords: <span className="text-cyan-300 font-medium">{latitude}° N/S, {longitude}° E/W</span>
                    <br />
                    Sensors: OHRC (0.25m) + TMC-2 (5.0m) + IIRS (80m) Ready for Multi-Frame Ingestion
                  </p>

                  {/* Telemetry metrics bar */}
                  <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5 pt-4 border-t border-white/10 font-mono text-[10px]">
                    <span className="px-3 py-1 rounded-md bg-white/[0.04] border border-white/10 text-neutral-300">
                      RMSE RESIDUAL: <strong className="text-[#00E5FF] ml-1">0.38 px</strong>
                    </span>
                    <span className="px-3 py-1 rounded-md bg-white/[0.04] border border-white/10 text-neutral-300">
                      INLIER RATIO: <strong className="text-emerald-400 ml-1">94.2%</strong>
                    </span>
                    <span className="px-3 py-1 rounded-md bg-white/[0.04] border border-white/10 text-neutral-300">
                      TIE-POINTS LOCKED: <strong className="text-blue-400 ml-1">1,428</strong>
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </main>
  );
}
