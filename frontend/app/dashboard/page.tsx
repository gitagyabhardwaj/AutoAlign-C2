"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Crosshair,
  Play,
  RotateCcw,
  CheckCircle2,
  Radio,
  Globe2,
  Compass,
  Layers,
  Sparkles,
  Activity,
  Image as ImageIcon,
  ChevronDown,
  UploadCloud,
} from "lucide-react";
import { StarsBackground } from "@/components/ui/stars";
import { orbitron, sans, mono } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export default function MissionControlDashboard() {
  // 2-Phase Mission Control State: 'setup' | 'simulating' | 'payload'
  const [missionState, setMissionState] = useState<"setup" | "simulating" | "payload">("setup");

  // Coordinate Inputs
  const [latitude, setLatitude] = useState("-43.31");
  const [longitude, setLongitude] = useState("-11.36");

  // Simulation Stage (1 to 4)
  const [simulationStage, setSimulationStage] = useState(0);

  // Full-Screen Swipe Slider Position (0 to 100%)
  const [sliderPos, setSliderPos] = useState(50);

  // Dynamic import of @google/model-viewer on client mount
  useEffect(() => {
    import("@google/model-viewer").catch((err) =>
      console.error("Failed to load @google/model-viewer:", err)
    );
  }, []);

  // 4-Stage Simulation Progression: ~4 seconds total, then wait 1 second and transition to 'payload'
  useEffect(() => {
    if (missionState !== "simulating") return;

    setSimulationStage(1);

    const t1 = setTimeout(() => {
      setSimulationStage(2);
    }, 1000);

    const t2 = setTimeout(() => {
      setSimulationStage(3);
    }, 2000);

    const t3 = setTimeout(() => {
      setSimulationStage(4);
    }, 3000);

    const t4 = setTimeout(() => {
      // Stage 4 complete; wait 1 second, then change missionState to 'payload'
      const tPayload = setTimeout(() => {
        setMissionState("payload");
      }, 1000);

      return () => clearTimeout(tPayload);
    }, 4000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [missionState]);

  const handleInitiatePipeline = (e: React.FormEvent) => {
    e.preventDefault();
    setMissionState("simulating");
  };

  const handleReturnToCommandCenter = () => {
    setMissionState("setup");
    setSimulationStage(0);
    setSliderPos(50);
  };

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
      desc: "Extracting LoFTR dense correspondences across modalities",
      subtext: "Transformer correlation matrix / Tie-points locked",
    },
    {
      id: 3,
      title: "Projective Homography",
      desc: "Solving H ∈ SE(2) perspective warp with RANSAC consensus",
      subtext: "Perspective transform solver / Inlier ratio: 94.2%",
    },
    {
      id: 4,
      title: "Sub-Pixel Verification",
      desc: "Computing target RMSE convergence < 1.0 px",
      subtext: "Residual: 0.38 px RMS / Multimodal boundary verified",
    },
  ];

  // Lunar surface placeholder image URLs
  const lunarBaseImg =
    "https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=2000&auto=format&fit=crop&grayscale=true";
  const lunarOverlayImg =
    "https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=2000&auto=format&fit=crop";

  return (
    <main className={cn(sans.className, "relative w-screen h-screen overflow-hidden bg-[#07060c] text-white select-none")}>
      {/* Absolute Cosmic Starfield Base Layer */}
      <StarsBackground factor={0.02} speed={50} className="absolute inset-0 z-0 pointer-events-none" />

      <AnimatePresence mode="wait">
        {/* ================================================================ */}
        {/* PHASE 1: The 50/50 Command Center ('setup' | 'simulating')       */}
        {/* ================================================================ */}
        {(missionState === "setup" || missionState === "simulating") && (
          <motion.div
            key="phase-1-command-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 w-full h-full grid grid-cols-1 lg:grid-cols-2 overflow-hidden"
          >
            {/* ------------------------------------------------------------ */}
            {/* LEFT HALF: 3D Lunar View & Telemetry (Fixed Viewport)        */}
            {/* ------------------------------------------------------------ */}
            <section className="relative h-full w-full overflow-hidden border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col justify-between p-6 bg-black/40">
              {/* Top Navigation Ribbon */}
              <div className="relative z-20 flex items-center justify-between">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-black/60 hover:bg-white/10 hover:border-white/20 text-neutral-300 hover:text-white text-xs font-mono transition-all backdrop-blur-md group"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-[#00E5FF] group-hover:-translate-x-0.5 transition-transform" />
                  <span>ORBITAL VIEW</span>
                </Link>

                <div className="px-3 py-1 rounded-full text-[10px] font-mono tracking-wider uppercase bg-black/60 border border-white/10 text-neutral-300 backdrop-blur-md flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] shadow-[0_0_6px_#00E5FF] animate-pulse" />
                  <span>CHANDRAYAAN-2 LUNAR MONITOR</span>
                </div>
              </div>

              {/* Centered Moon 3D Model with Controlled Sizing (w-[80%] h-[80%] max-w-[600px] m-auto) */}
              <div className="absolute inset-0 z-0 flex items-center justify-center p-4">
                <div className="w-[80%] h-[80%] max-w-[600px] max-h-[600px] m-auto flex items-center justify-center">
                  <model-viewer
                    src="/moon.glb"
                    alt="3D Lunar Model"
                    auto-rotate
                    camera-controls
                    rotation-per-second="16deg"
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
              </div>

              {/* Floating Glassmorphism Fact Pop-ups Overlay */}
              <div className="relative z-10 pointer-events-none flex flex-col justify-between h-[75%] my-auto">
                {/* Fact Pop-up 1 (Top Left) */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="pointer-events-auto self-start max-w-xs p-3 rounded-xl border border-white/10 bg-black/60 backdrop-blur-md shadow-2xl space-y-1"
                >
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-[#00E5FF]">
                    <Globe2 className="w-3.5 h-3.5 text-[#00E5FF]" />
                    <span className="font-semibold">LUNAR PHYSICAL PARAMETERS</span>
                  </div>
                  <p className="text-xs font-mono text-neutral-200 font-medium">
                    LUNAR RADIUS: 1,737.4 km | GRAVITY: 1.62 m/s²
                  </p>
                  <div className="text-[10px] font-mono text-neutral-500">
                    Mean Density: 3.34 g/cm³ • Surface Area: 3.793×10⁷ km²
                  </div>
                </motion.div>

                {/* Fact Pop-up 2 (Bottom Left) */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="pointer-events-auto self-start max-w-xs p-3 rounded-xl border border-white/10 bg-black/60 backdrop-blur-md shadow-2xl space-y-1"
                >
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-[#F59E0B]">
                    <Radio className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span className="font-semibold">ORBITAL METRICS</span>
                  </div>
                  <p className="text-xs font-mono text-neutral-200 font-medium">
                    MISSION: Chandrayaan-2 | ALTITUDE: 100km Polar
                  </p>
                  <div className="text-[10px] font-mono text-neutral-500">
                    Inclination: 90.0° • Orbital Velocity: 1.68 km/s
                  </div>
                </motion.div>
              </div>

              {/* Bottom Edge Fact Pop-up 3 (Sensor Specs) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="relative z-10 pointer-events-auto max-w-md p-3 rounded-xl border border-white/10 bg-black/60 backdrop-blur-md shadow-2xl flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-neutral-500">PRIMARY COREGISTRATION ARRAY</div>
                  <div className="text-neutral-200 font-medium mt-0.5">OHRC (0.25m) • TMC-2 (5.0m) • IIRS (80m)</div>
                </div>
                <div className="text-right pl-3 border-l border-white/10">
                  <div className="text-[10px] uppercase tracking-wider text-cyan-400">WARP ENGINE</div>
                  <div className="text-cyan-300 font-semibold mt-0.5">H ∈ SE(2)</div>
                </div>
              </motion.div>
            </section>

            {/* ------------------------------------------------------------ */}
            {/* RIGHT HALF: Mission Targeting & Simulation (Scrollable)      */}
            {/* ------------------------------------------------------------ */}
            <section className="relative h-full w-full overflow-y-auto p-6 md:p-8 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent flex flex-col justify-center">
              {/* Header Title with Orbitron font */}
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

              {/* Target Coordinates Input Form */}
              <div className="p-6 rounded-2xl border border-white/10 bg-neutral-950/80 backdrop-blur-xl shadow-2xl space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-white font-semibold flex items-center gap-2">
                    <Crosshair className="w-4 h-4 text-[#00E5FF]" />
                    TARGET COORDINATES
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500">PDS4-CRS / ELLIPSOID</span>
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
                          disabled={missionState === "simulating"}
                          placeholder="-43.31"
                          className="w-full bg-black/60 border border-white/10 focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] rounded-xl px-4 py-3 text-xs font-mono text-neutral-100 placeholder-neutral-600 focus:outline-none transition-all disabled:opacity-50"
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
                          disabled={missionState === "simulating"}
                          placeholder="-11.36"
                          className="w-full bg-black/60 border border-white/10 focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] rounded-xl px-4 py-3 text-xs font-mono text-neutral-100 placeholder-neutral-600 focus:outline-none transition-all disabled:opacity-50"
                          required
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-neutral-500">
                          DEG
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Preset Targets */}
                  {missionState === "setup" && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[10px] font-mono uppercase text-neutral-500">Target Presets:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setLatitude("-43.31");
                          setLongitude("-11.36");
                        }}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-mono border border-white/10 bg-white/[0.03] hover:bg-white/10 text-neutral-300 hover:text-white transition-all cursor-pointer"
                      >
                        Tycho Crater (-43.31°, -11.36°)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLatitude("-89.90");
                          setLongitude("0.00");
                        }}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-mono border border-white/10 bg-white/[0.03] hover:bg-white/10 text-neutral-300 hover:text-white transition-all cursor-pointer"
                      >
                        Shackleton (-89.90°, 0.00°)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLatitude("-53.00");
                          setLongitude("-169.00");
                        }}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-mono border border-white/10 bg-white/[0.03] hover:bg-white/10 text-neutral-300 hover:text-white transition-all cursor-pointer"
                      >
                        Aitken Basin (-53.00°, -169.00°)
                      </button>
                    </div>
                  )}

                  {/* Large Glowing Cyan INITIATE PIPELINE Button (Hidden when simulating) */}
                  {missionState === "setup" && (
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={cn(
                        orbitron.className,
                        "w-full mt-3 bg-[#00E5FF] hover:bg-[#33ebff] text-black text-xs font-bold uppercase tracking-[0.2em] py-4 px-6 rounded-xl flex items-center justify-center gap-2.5 shadow-[0_0_30px_rgba(0,229,255,0.5)] hover:shadow-[0_0_45px_rgba(0,229,255,0.8)] transition-all cursor-pointer border border-[#00E5FF]"
                      )}
                    >
                      <Play className="w-4 h-4 fill-black text-black" />
                      <span>INITIATE PIPELINE</span>
                    </motion.button>
                  )}
                </form>

                {/* 4-Stage Vertical Progress Timeline (Revealed when Simulating) */}
                {missionState === "simulating" && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="pt-4 border-t border-white/10 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-semibold flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#00E5FF] animate-spin" />
                        PIPELINE SIMULATION ACTIVE
                      </span>
                      <span className="text-[11px] font-mono text-cyan-400 font-medium">
                        Stage {simulationStage} of 4
                      </span>
                    </div>

                    <div className="relative pl-1 space-y-4">
                      {stages.map((st, index) => {
                        const isCompleted = simulationStage > st.id;
                        const isActive = simulationStage === st.id;

                        return (
                          <div key={st.id} className="relative flex items-start gap-3.5">
                            {/* Vertical connecting line */}
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
                                "relative z-10 w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-all duration-300",
                                isCompleted
                                  ? "bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.4)]"
                                  : isActive
                                  ? "bg-amber-500/20 text-amber-300 border-2 border-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.6)] animate-pulse"
                                  : "bg-neutral-900 text-neutral-500 border border-white/10"
                              )}
                            >
                              {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : st.id}
                            </div>

                            {/* Stage metadata */}
                            <div className="flex-1 min-w-0 pt-0.5">
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={cn(
                                    "text-xs font-mono font-semibold truncate",
                                    isActive
                                      ? "text-amber-300"
                                      : isCompleted
                                      ? "text-white"
                                      : "text-neutral-500"
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
                                  {isCompleted ? "Complete" : isActive ? "Running..." : "Queued"}
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-400 mt-0.5">
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
              </div>
            </section>
          </motion.div>
        )}

        {/* ================================================================ */}
        {/* PHASE 2: Full-Screen Payload Reveal ('payload')                  */}
        {/* ================================================================ */}
        {missionState === "payload" && (
          <motion.div
            key="phase-2-payload-reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="overflow-y-auto h-screen flex flex-col relative w-screen select-none bg-[#050505] scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-transparent"
          >
            {/* ------------------------------------------------------------ */}
            {/* Section 1: Full-Screen 100vh Interactive Surface Comparator  */}
            {/* ------------------------------------------------------------ */}
            <div className="h-screen w-full relative shrink-0 overflow-hidden bg-black">
              {/* 1. Base Layer: Reference Base Photo (Panchromatic Optical Surface) */}
              <div
                className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat grayscale brightness-90 contrast-130 select-none pointer-events-none"
                style={{
                  backgroundImage: `url("${lunarBaseImg}")`,
                }}
              >
                {/* HUD Badge: Reference Base Photo */}
                <div className="absolute top-6 left-6 z-20 pointer-events-none flex items-center gap-2 bg-black/75 px-3.5 py-1.5 rounded-full border border-white/10 text-xs font-mono text-neutral-300 backdrop-blur-md shadow-xl">
                  <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
                  <span>REFERENCE BASE PHOTO (OHRC 0.25m PANCHROMATIC)</span>
                </div>
              </div>

              {/* 2. Top Layer: Stitched 3-Frame Result (Clipped via sliderPos %) */}
              <div
                className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none transition-all"
                style={{
                  clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`,
                }}
              >
                <div
                  className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat hue-rotate-180 contrast-140 saturate-200 brightness-110 select-none pointer-events-none"
                  style={{
                    backgroundImage: `url("${lunarOverlayImg}")`,
                  }}
                />

                {/* Multi-spectral thermal gradient wash */}
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/25 via-purple-500/20 to-amber-500/25 mix-blend-color-dodge pointer-events-none" />

                {/* HUD Badge: Stitched 3-Frame Result */}
                <div className="absolute top-6 right-6 z-20 pointer-events-none flex items-center gap-2 bg-black/75 px-3.5 py-1.5 rounded-full border border-[#00E5FF]/40 text-xs font-mono text-[#00E5FF] backdrop-blur-md shadow-xl">
                  <span className="w-2 h-2 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF] animate-pulse" />
                  <span>STITCHED 3-FRAME RESULT (OHRC + TMC-2 + IIRS MULTIMODAL)</span>
                </div>
              </div>

              {/* Center Vertical Divider Line Over the Full-Screen Image */}
              <div
                className="absolute top-0 bottom-24 w-[2px] bg-[#00E5FF] shadow-[0_0_12px_#00E5FF,0_0_24px_rgba(0,229,255,0.7)] z-30 pointer-events-none"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-cyan-950 border-2 border-[#00E5FF] shadow-[0_0_15px_#00E5FF] flex items-center justify-center text-[#00E5FF]">
                  <Layers className="w-4 h-4" />
                </div>
              </div>

              {/* Floating Top Center Alignment Metric */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none bg-cyan-950/80 px-4 py-1.5 rounded-full border border-cyan-400/50 text-xs font-mono text-cyan-300 backdrop-blur-md shadow-[0_0_20px_rgba(0,229,255,0.3)] flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>SUB-PIXEL CONVERGED (0.38 px RMSE)</span>
              </div>

              {/* Subtle Scroll Down Prompt Indicator */}
              <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-[10px] font-mono uppercase tracking-widest text-cyan-300/80 flex items-center gap-1.5 bg-black/60 px-3 py-1 rounded-full border border-cyan-500/20 backdrop-blur-sm animate-bounce">
                <span>SCROLL DOWN FOR RAW SENSOR FRAMES</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* Section 2: Scrollable Raw Sensor Reference Frames Section     */}
            {/* ------------------------------------------------------------ */}
            <div className="min-h-screen bg-[#050505] pt-24 px-6 md:px-12 pb-36 relative z-40">
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
                  Inspect the three independent sensor streams fused into the composite payload. Each sensor captures a distinct spatial and spectral regime over the lunar surface.
                </p>
              </div>

              {/* 3-Column Grid for the 3 Sensor Reference Frames */}
              <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                {/* Card 1: OHRC (0.25m/px) - High-Res Panchromatic Base */}
                <div className="border-2 border-dashed border-white/20 hover:border-cyan-400/60 rounded-2xl overflow-hidden p-5 bg-neutral-950/80 backdrop-blur-md shadow-2xl transition-all group flex flex-col justify-between">
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

                    <h3 className="text-sm font-semibold text-white tracking-tight">
                      OHRC (0.25m/px) - High-Res Panchromatic Base
                    </h3>

                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Optical High Resolution Camera providing extreme structural detail, crater rim topography, and boulder shadows.
                    </p>

                    {/* Crater Macro Image Container */}
                    <div className="relative w-full h-56 rounded-xl overflow-hidden border border-white/10 bg-black mt-2">
                      <div
                        className="w-full h-full bg-cover bg-center grayscale brightness-90 contrast-125 group-hover:scale-105 transition-transform duration-500"
                        style={{ backgroundImage: `url("${lunarBaseImg}")` }}
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
                <div className="border-2 border-dashed border-white/20 hover:border-blue-400/60 rounded-2xl overflow-hidden p-5 bg-neutral-950/80 backdrop-blur-md shadow-2xl transition-all group flex flex-col justify-between">
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

                    <h3 className="text-sm font-semibold text-white tracking-tight">
                      TMC-2 (5.0m/px) - Stereo Mapping
                    </h3>

                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Terrain Mapping Camera 2 generating high-resolution Digital Elevation Models (DEM) from fore, nadir, and aft views.
                    </p>

                    {/* Crater Macro Image Container with Stereo Shading */}
                    <div className="relative w-full h-56 rounded-xl overflow-hidden border border-white/10 bg-black mt-2">
                      <div
                        className="w-full h-full bg-cover bg-center contrast-150 brightness-85 sepia-[0.25] group-hover:scale-105 transition-transform duration-500"
                        style={{ backgroundImage: `url("${lunarOverlayImg}")` }}
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
                <div className="border-2 border-dashed border-white/20 hover:border-purple-400/60 rounded-2xl overflow-hidden p-5 bg-neutral-950/80 backdrop-blur-md shadow-2xl transition-all group flex flex-col justify-between">
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

                    <h3 className="text-sm font-semibold text-white tracking-tight">
                      IIRS (80m/px) - Hyperspectral SWIR
                    </h3>

                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Imaging Infrared Spectrometer characterizing water-ice signatures, hydroxyl absorption, and pyroxene mineralogy.
                    </p>

                    {/* Crater Macro Image Container with Hyperspectral Gradient */}
                    <div className="relative w-full h-56 rounded-xl overflow-hidden border border-white/10 bg-black mt-2">
                      <div
                        className="w-full h-full bg-cover bg-center invert hue-rotate-90 saturate-200 brightness-110 group-hover:scale-105 transition-transform duration-500"
                        style={{ backgroundImage: `url("${lunarOverlayImg}")` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/30 via-pink-500/20 to-amber-500/30 mix-blend-color-dodge" />
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
            </div>

            {/* ------------------------------------------------------------ */}
            {/* Section 3: Fixed Translucent Blue Aerospace Bottom Bar       */}
            {/* ------------------------------------------------------------ */}
            <footer className="fixed bottom-0 left-0 right-0 w-full h-24 bg-cyan-950/80 backdrop-blur-xl border-t border-cyan-500/50 px-6 sm:px-10 flex items-center justify-between z-50 gap-4 sm:gap-8 shadow-[0_-10px_35px_rgba(0,229,255,0.15)]">
              {/* Coordinates Display with Scanning Radar Effect */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative w-9 h-9 rounded-full bg-cyan-500/20 border border-cyan-400/60 flex items-center justify-center text-[#00E5FF] shrink-0 shadow-[0_0_12px_rgba(0,229,255,0.4)]">
                  <Crosshair className="w-4 h-4 animate-spin [animation-duration:8s]" />
                  <span className="absolute inset-0 rounded-full border border-[#00E5FF] animate-ping opacity-40" />
                </div>
                <div className="min-w-0 font-mono">
                  <div className="text-[10px] uppercase tracking-widest text-cyan-300 font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] shadow-[0_0_6px_#00E5FF]" />
                    <span>LUNAR SCANNING PAYLOAD COORDS</span>
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-white truncate mt-0.5">
                    LAT: <span className="text-[#00E5FF]">{latitude}°</span> | LON: <span className="text-[#00E5FF]">{longitude}°</span>
                  </div>
                </div>
              </div>

              {/* Interactive Horizontal Scroller / Slider */}
              <div className="flex-1 max-w-xl hidden md:flex flex-col items-center gap-1.5">
                <div className="flex items-center justify-between w-full text-[10px] font-mono text-cyan-200/90">
                  <span>◀ STITCHED PAYLOAD ({sliderPos}%)</span>
                  <span className="text-[#00E5FF] font-bold tracking-wider">SWIPE COMPARISON</span>
                  <span>REFERENCE BASE ({100 - sliderPos}%) ▶</span>
                </div>
                <div className="relative w-full flex items-center">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderPos}
                    onChange={(e) => setSliderPos(Number(e.target.value))}
                    className="w-full h-2.5 bg-cyan-950 rounded-full appearance-none cursor-pointer accent-[#00E5FF] border border-cyan-500/40 shadow-[0_0_10px_rgba(0,229,255,0.3)]"
                  />
                </div>
              </div>

              {/* Action Button: Return to Command Center */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={handleReturnToCommandCenter}
                  className={cn(
                    orbitron.className,
                    "px-4 sm:px-5 py-2.5 rounded-xl border border-cyan-400/40 bg-cyan-900/60 hover:bg-[#00E5FF] text-cyan-200 hover:text-black font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-2 shadow-lg shadow-black/60 hover:shadow-[0_0_25px_rgba(0,229,255,0.6)]"
                  )}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">RETURN TO COMMAND CENTER</span>
                  <span className="sm:hidden">RESET</span>
                </button>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
