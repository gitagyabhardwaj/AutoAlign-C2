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
  Compass,
  Layers,
  Sparkles,
  Activity,
  Image as ImageIcon,
  ChevronDown,
  UploadCloud,
  Download,
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

  // Dynamic Payload Image for Phase 2
  const [payloadImage, setPayloadImage] = useState(
    "https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?q=80&w=2500&auto=format&fit=crop&grayscale=true"
  );

  // Sensor reference frames image states
  const defaultSensorImg =
    "https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=800&auto=format&fit=crop&grayscale=true";
  const [ohrcImage, setOhrcImage] = useState<string | null>(null);
  const [tmcImage, setTmcImage] = useState<string | null>(null);
  const [iirsImage, setIirsImage] = useState<string | null>(null);

  // Simulation Stage (1 to 4)
  const [simulationStage, setSimulationStage] = useState(0);

  // Interactive Fact Bubble Index & Data
  const [factIndex, setFactIndex] = useState(0);
  const moonFacts = [
    "Did you know? Chandrayaan-2's OHRC camera provides the highest resolution lunar images ever taken (0.25m/px).",
    "The lunar south pole features permanently shadowed craters that act as cold traps for water ice.",
    "TMC-2 on board the orbiter maps the lunar surface in 3D to help us understand its geological evolution.",
    "The IIRS sensor maps lunar mineralogy in the infrared spectrum to locate hydroxyl and water signatures."
  ];

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
  };

  const handlePresetClick = (latStr: string, lonStr: string, imageUrl: string) => {
    setLatitude(latStr);
    setLongitude(lonStr);
    setPayloadImage(imageUrl);
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setSensorImage: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // Creates a temporary local URL to preview the uploaded file
      const imageUrl = URL.createObjectURL(file);
      setSensorImage(imageUrl);
    }
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
      desc: "SuperPoint + LoFTR cross-sensor keypoints",
      subtext: "Matches: 1,482 keypoints / Inlier Ratio: 89.4%",
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
      desc: "Computing target RMSE convergence < 1.0 px",
      subtext: "Residual: 0.38 px RMS / Multimodal boundary verified",
    },
  ];

  // Lunar surface placeholder image for final fused payload & sensor reference frames
  const fusedPayloadImg =
    "https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?q=80&w=2500&auto=format&fit=crop&grayscale=true";

  const sensorCardImg =
    "https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=800&auto=format&fit=crop&grayscale=true";

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

              {/* Centered Moon 3D Model with Perfectly Clean Container */}
              <div className="absolute inset-0 z-0 flex items-center justify-center p-4">
                <div className="w-[85%] h-[85%] max-w-[650px] max-h-[650px] m-auto flex items-center justify-center">
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

              {/* Sleek Rounded Lunar Fact Bubble */}
              <div
                onClick={() => setFactIndex((prev) => (prev + 1) % moonFacts.length)}
                className="absolute bottom-6 left-6 z-20 max-w-[280px] bg-cyan-600/30 backdrop-blur-md border border-cyan-400/50 text-white text-sm p-4 rounded-2xl rounded-bl-none shadow-[0_4px_20px_rgba(0,229,255,0.15)] cursor-pointer hover:bg-cyan-600/40 transition-all select-none"
              >
                <p className="leading-relaxed">{moonFacts[factIndex]}</p>
                <span className="block mt-2 text-[10px] text-cyan-200 opacity-70">Tap for next fact...</span>
              </div>
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
                  Sensor Data Ingestion
                </h1>
                <p className="text-xs text-neutral-400">
                  Upload raw .zip photo archives for OHRC, TMC-2, and IIRS sensors to initiate multi-sensor fusion.
                </p>
              </div>

              {/* Target Coordinates Input Form */}
              <div className="p-6 rounded-2xl border border-white/10 bg-neutral-950/80 backdrop-blur-xl shadow-2xl space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-white font-semibold flex items-center gap-2">
                    <Crosshair className="w-4 h-4 text-[#00E5FF]" />
                    SENSOR ARCHIVE UPLOADS
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500">PDS4-CRS / ELLIPSOID</span>
                </div>

                <form onSubmit={handleInitiatePipeline} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* OHRC Upload */}
                    {ohrcImage ? (
                      <div className="bg-black/60 border border-cyan-500/60 p-3 rounded-lg flex flex-col relative w-full h-full shadow-[0_0_15px_rgba(0,229,255,0.1)]">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-cyan-400 font-bold text-xs tracking-widest">OHRC</span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-cyan-900/50 text-cyan-300 rounded border border-cyan-500/30">LOCKED</span>
                        </div>
                        
                        <img src={ohrcImage} alt="OHRC Preview" className="w-full h-24 object-cover rounded mb-3 border border-white/10 grayscale contrast-125" />
                        
                        <div className="bg-black/80 p-2 rounded border border-white/5 text-left space-y-1.5 w-full">
                          <div className="text-[10px] text-gray-400 flex justify-between"><span>RMSE:</span> <span className="text-cyan-400 font-mono">0.38 px</span></div>
                          <div className="text-[10px] text-gray-400 flex justify-between"><span>Inliers:</span> <span className="text-cyan-400 font-mono">1,482</span></div>
                          <div className="text-[10px] text-gray-400 flex justify-between"><span>Ratio:</span> <span className="text-cyan-400 font-mono">89.4%</span></div>
                        </div>
                        <input
                          type="file"
                          accept=".zip, image/*, .tif, .tiff"
                          onChange={(e) => handleFileUpload(e, setOhrcImage)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    ) : (
                      <div className="bg-black/60 border border-dashed border-cyan-500/40 p-6 rounded-lg flex flex-col items-center justify-center space-y-2 hover:bg-cyan-950/30 hover:border-cyan-400 transition-all cursor-pointer relative">
                        <span className="text-cyan-400 font-bold text-xs tracking-widest">OHRC</span>
                        <span className="text-[10px] text-gray-500">Select .zip</span>
                        <input
                          type="file"
                          accept=".zip, image/*, .tif, .tiff"
                          onChange={(e) => handleFileUpload(e, setOhrcImage)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    )}
                    
                    {/* TMC-2 Upload */}
                    {tmcImage ? (
                      <div className="bg-black/60 border border-cyan-500/60 p-3 rounded-lg flex flex-col relative w-full h-full shadow-[0_0_15px_rgba(0,229,255,0.1)]">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-cyan-400 font-bold text-xs tracking-widest">TMC-2</span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-cyan-900/50 text-cyan-300 rounded border border-cyan-500/30">LOCKED</span>
                        </div>
                        
                        <img src={tmcImage} alt="TMC-2 Preview" className="w-full h-24 object-cover rounded mb-3 border border-white/10 contrast-150 brightness-85 sepia-[0.25]" />
                        
                        <div className="bg-black/80 p-2 rounded border border-white/5 text-left space-y-1.5 w-full">
                          <div className="text-[10px] text-gray-400 flex justify-between"><span>RMSE:</span> <span className="text-cyan-400 font-mono">0.42 px</span></div>
                          <div className="text-[10px] text-gray-400 flex justify-between"><span>Inliers:</span> <span className="text-cyan-400 font-mono">1,120</span></div>
                          <div className="text-[10px] text-gray-400 flex justify-between"><span>Ratio:</span> <span className="text-cyan-400 font-mono">84.2%</span></div>
                        </div>
                        <input
                          type="file"
                          accept=".zip, image/*, .tif, .tiff"
                          onChange={(e) => handleFileUpload(e, setTmcImage)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    ) : (
                      <div className="bg-black/60 border border-dashed border-cyan-500/40 p-6 rounded-lg flex flex-col items-center justify-center space-y-2 hover:bg-cyan-950/30 hover:border-cyan-400 transition-all cursor-pointer relative">
                        <span className="text-cyan-400 font-bold text-xs tracking-widest">TMC-2</span>
                        <span className="text-[10px] text-gray-500">Select .zip</span>
                        <input
                          type="file"
                          accept=".zip, image/*, .tif, .tiff"
                          onChange={(e) => handleFileUpload(e, setTmcImage)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    )}

                    {/* IIRS Upload */}
                    {iirsImage ? (
                      <div className="bg-black/60 border border-cyan-500/60 p-3 rounded-lg flex flex-col relative w-full h-full shadow-[0_0_15px_rgba(0,229,255,0.1)]">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-cyan-400 font-bold text-xs tracking-widest">IIRS</span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-cyan-900/50 text-cyan-300 rounded border border-cyan-500/30">LOCKED</span>
                        </div>
                        
                        <img src={iirsImage} alt="IIRS Preview" className="w-full h-24 object-cover rounded mb-3 border border-white/10 invert hue-rotate-90 saturate-200 brightness-110" />
                        
                        <div className="bg-black/80 p-2 rounded border border-white/5 text-left space-y-1.5 w-full">
                          <div className="text-[10px] text-gray-400 flex justify-between"><span>RMSE:</span> <span className="text-cyan-400 font-mono">0.51 px</span></div>
                          <div className="text-[10px] text-gray-400 flex justify-between"><span>Inliers:</span> <span className="text-cyan-400 font-mono">984</span></div>
                          <div className="text-[10px] text-gray-400 flex justify-between"><span>Ratio:</span> <span className="text-cyan-400 font-mono">81.3%</span></div>
                        </div>
                        <input
                          type="file"
                          accept=".zip, image/*, .tif, .tiff"
                          onChange={(e) => handleFileUpload(e, setIirsImage)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    ) : (
                      <div className="bg-black/60 border border-dashed border-cyan-500/40 p-6 rounded-lg flex flex-col items-center justify-center space-y-2 hover:bg-cyan-950/30 hover:border-cyan-400 transition-all cursor-pointer relative">
                        <span className="text-cyan-400 font-bold text-xs tracking-widest">IIRS</span>
                        <span className="text-[10px] text-gray-500">Select .zip</span>
                        <input
                          type="file"
                          accept=".zip, image/*, .tif, .tiff"
                          onChange={(e) => handleFileUpload(e, setIirsImage)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>

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
            className="absolute inset-0 z-50 bg-black overflow-y-auto flex flex-col select-none scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-transparent"
          >
            {/* ------------------------------------------------------------ */}
            {/* Section 1: Single Full-Screen 100vh Fused Terrain View       */}
            {/* ------------------------------------------------------------ */}
            <div
              className="h-screen w-full relative shrink-0 bg-cover bg-center overflow-hidden"
              style={{ backgroundImage: `url("${payloadImage}")` }}
            >
              {/* Subtle vignette shadow gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />

              {/* HUD Badge: Composite Payload */}
              <div className="absolute top-6 left-6 z-20 pointer-events-none flex items-center gap-2 bg-black/80 px-3.5 py-1.5 rounded-full border border-cyan-500/40 text-xs font-mono text-cyan-300 backdrop-blur-md shadow-xl">
                <span className="w-2 h-2 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF] animate-pulse" />
                <span>CHANDRAYAAN-2 COMPOSITE LUNAR PAYLOAD</span>
              </div>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* Section 2: Scrollable Raw Sensor Reference Frames Section     */}
            {/* ------------------------------------------------------------ */}
            <div className="min-h-screen bg-[#050505] pt-24 px-12 pb-48 relative z-40">
              {/* Section Header */}
              <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#00E5FF]">
                    <Layers className="w-4 h-4 text-[#00E5FF]" />
                    <span>PAYLOAD BREAKDOWN ARCHITECTURE</span>
                  </div>
                  <h2 className={cn(orbitron.className, "text-2xl md:text-3xl font-bold tracking-tight text-white mt-1")}>
                    RAW SENSOR REFERENCE FRAMES
                  </h2>
                  <p className="text-xs font-mono text-neutral-400 max-w-2xl mt-1">
                    Inspect the three independent sensor streams fused into the composite payload. Each sensor captures a distinct spatial and spectral regime over the lunar surface.
                  </p>
                </div>

                {/* Telemetry Registration Summary Chips */}
                <div className="flex items-center gap-4 bg-neutral-900/90 border border-cyan-500/30 px-5 py-3 rounded-xl font-mono text-xs shrink-0 shadow-lg backdrop-blur-md">
                  <div>
                    <span className="text-[9px] text-gray-400 uppercase tracking-wider block">REGISTRATION RMSE</span>
                    <span className="text-cyan-400 font-bold text-sm">0.38 px</span>
                  </div>
                  <div className="w-[1px] h-7 bg-white/10" />
                  <div>
                    <span className="text-[9px] text-gray-400 uppercase tracking-wider block">INLIER MATCHES</span>
                    <span className="text-cyan-400 font-bold text-sm">1,482</span>
                  </div>
                  <div className="w-[1px] h-7 bg-white/10" />
                  <div>
                    <span className="text-[9px] text-gray-400 uppercase tracking-wider block">INLIER RATIO</span>
                    <span className="text-cyan-400 font-bold text-sm">89.4%</span>
                  </div>
                </div>
              </div>

              {/* 3-Column Grid for the 3 Sensor Reference Frames */}
              <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                {/* Card 1: OHRC (0.25m/px) - High-Res Panchromatic Base */}
                <div className="border-2 border-dashed border-white/20 hover:border-cyan-400/60 rounded-2xl overflow-hidden p-6 bg-neutral-900 backdrop-blur-md shadow-2xl transition-all group flex flex-col justify-between relative">
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
                      Optical High Resolution Camera providing extreme structural detail, crater rim topography, and boulder shadows.
                    </p>

                    {/* Crater Macro Image Container */}
                    <div className="relative w-full h-56 rounded-xl overflow-hidden border border-white/10 bg-black mt-2">
                      <img
                        src={ohrcImage || defaultSensorImg}
                        alt="OHRC preview"
                        className="w-full h-full object-cover grayscale brightness-90 contrast-125 group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2.5 left-2.5 bg-black/80 px-2 py-0.5 rounded text-[9px] font-mono text-cyan-300 border border-cyan-500/30">
                        BAND: PAN (450-900nm)
                      </div>
                      <div className="absolute inset-0 border-2 border-dashed border-white/10 rounded-xl pointer-events-none" />
                    </div>

                    {/* Card Telemetry Strip */}
                    <div className="grid grid-cols-3 gap-2 bg-black/60 border border-cyan-500/20 rounded-lg p-2.5 font-mono text-center mt-3">
                      <div>
                        <span className="text-[9px] text-gray-400 uppercase tracking-wider block">RMSE</span>
                        <span className="text-xs font-bold text-cyan-400">0.24 px</span>
                      </div>
                      <div className="border-x border-white/10">
                        <span className="text-[9px] text-gray-400 uppercase tracking-wider block">Inliers</span>
                        <span className="text-xs font-bold text-cyan-400">1,840</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 uppercase tracking-wider block">Ratio</span>
                        <span className="text-xs font-bold text-cyan-400">94.2%</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-neutral-500 relative cursor-pointer hover:text-white transition-colors">
                    <span className="flex items-center gap-1.5 text-neutral-400">
                      <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Drop final OHRC GeoTIFF here</span>
                    </span>
                    <span>SWATH: 12 km</span>
                    <input
                      type="file"
                      accept=".zip, image/*, .tif, .tiff"
                      onChange={(e) => handleFileUpload(e, setOhrcImage)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Card 2: TMC-2 (5.0m/px) - Stereo Mapping */}
                <div className="border-2 border-dashed border-white/20 hover:border-blue-400/60 rounded-2xl overflow-hidden p-6 bg-neutral-900 backdrop-blur-md shadow-2xl transition-all group flex flex-col justify-between relative">
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
                      <img
                        src={tmcImage || defaultSensorImg}
                        alt="TMC-2 preview"
                        className="w-full h-full object-cover contrast-150 brightness-85 sepia-[0.25] group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2.5 left-2.5 bg-black/80 px-2 py-0.5 rounded text-[9px] font-mono text-blue-300 border border-blue-500/30">
                        STEREO TRIPLET DEM
                      </div>
                      <div className="absolute inset-0 border-2 border-dashed border-white/10 rounded-xl pointer-events-none" />
                    </div>

                    {/* Card Telemetry Strip */}
                    <div className="grid grid-cols-3 gap-2 bg-black/60 border border-blue-500/20 rounded-lg p-2.5 font-mono text-center mt-3">
                      <div>
                        <span className="text-[9px] text-gray-400 uppercase tracking-wider block">RMSE</span>
                        <span className="text-xs font-bold text-blue-400">0.38 px</span>
                      </div>
                      <div className="border-x border-white/10">
                        <span className="text-[9px] text-gray-400 uppercase tracking-wider block">Inliers</span>
                        <span className="text-xs font-bold text-blue-400">1,482</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 uppercase tracking-wider block">Ratio</span>
                        <span className="text-xs font-bold text-blue-400">89.4%</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-neutral-500 relative cursor-pointer hover:text-white transition-colors">
                    <span className="flex items-center gap-1.5 text-neutral-400">
                      <UploadCloud className="w-3.5 h-3.5 text-blue-400" />
                      <span>Drop final TMC-2 DEM here</span>
                    </span>
                    <span>SWATH: 20 km</span>
                    <input
                      type="file"
                      accept=".zip, image/*, .tif, .tiff"
                      onChange={(e) => handleFileUpload(e, setTmcImage)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Card 3: IIRS (80m/px) - Hyperspectral SWIR */}
                <div className="border-2 border-dashed border-white/20 hover:border-purple-400/60 rounded-2xl overflow-hidden p-6 bg-neutral-900 backdrop-blur-md shadow-2xl transition-all group flex flex-col justify-between relative">
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
                      Imaging Infrared Spectrometer characterizing water-ice signatures, hydroxyl absorption, and pyroxene mineralogy.
                    </p>

                    {/* Crater Macro Image Container with Hyperspectral Gradient */}
                    <div className="relative w-full h-56 rounded-xl overflow-hidden border border-white/10 bg-black mt-2">
                      <img
                        src={iirsImage || defaultSensorImg}
                        alt="IIRS preview"
                        className="w-full h-full object-cover invert hue-rotate-90 saturate-200 brightness-110 group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/30 via-pink-500/20 to-amber-500/30 mix-blend-color-dodge pointer-events-none" />
                      <div className="absolute top-2.5 left-2.5 bg-black/80 px-2 py-0.5 rounded text-[9px] font-mono text-purple-300 border border-purple-500/30">
                        SWIR (0.8 - 5.0 µm)
                      </div>
                      <div className="absolute inset-0 border-2 border-dashed border-white/10 rounded-xl pointer-events-none" />
                    </div>

                    {/* Card Telemetry Strip */}
                    <div className="grid grid-cols-3 gap-2 bg-black/60 border border-purple-500/20 rounded-lg p-2.5 font-mono text-center mt-3">
                      <div>
                        <span className="text-[9px] text-gray-400 uppercase tracking-wider block">RMSE</span>
                        <span className="text-xs font-bold text-purple-400">0.51 px</span>
                      </div>
                      <div className="border-x border-white/10">
                        <span className="text-[9px] text-gray-400 uppercase tracking-wider block">Inliers</span>
                        <span className="text-xs font-bold text-purple-400">984</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 uppercase tracking-wider block">Ratio</span>
                        <span className="text-xs font-bold text-purple-400">81.3%</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-neutral-500 relative cursor-pointer hover:text-white transition-colors">
                    <span className="flex items-center gap-1.5 text-neutral-400">
                      <UploadCloud className="w-3.5 h-3.5 text-purple-400" />
                      <span>Drop final IIRS spectral cube here</span>
                    </span>
                    <span>256 BANDS</span>
                    <input
                      type="file"
                      accept=".zip, image/*, .tif, .tiff"
                      onChange={(e) => handleFileUpload(e, setIirsImage)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Dedicated invisible spacer to push content above fixed bottom bar */}
              <div className="h-40 w-full shrink-0"></div>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* Section 3: Fixed Frosted Black Glassmorphic Aerospace Bottom Bar */}
            {/* ------------------------------------------------------------ */}
            <footer className="fixed bottom-0 w-full h-24 bg-black/60 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-50 flex items-center justify-between px-12">
              {/* Left Side: Global Telemetry Metrics */}
              <div className="flex items-center gap-4 font-mono">
                <div className="bg-black/50 border border-cyan-500/20 px-3.5 py-1.5 rounded-lg flex items-center gap-2">
                  <span className="text-[9px] uppercase tracking-wider text-gray-400">RMSE:</span>
                  <span className="text-xs font-bold text-cyan-400">0.38 px</span>
                </div>
                <div className="bg-black/50 border border-cyan-500/20 px-3.5 py-1.5 rounded-lg flex items-center gap-2">
                  <span className="text-[9px] uppercase tracking-wider text-gray-400">Inliers:</span>
                  <span className="text-xs font-bold text-cyan-400">1,482</span>
                </div>
                <div className="bg-black/50 border border-cyan-500/20 px-3.5 py-1.5 rounded-lg flex items-center gap-2">
                  <span className="text-[9px] uppercase tracking-wider text-gray-400">Ratio:</span>
                  <span className="text-xs font-bold text-cyan-400">89.4%</span>
                </div>
              </div>

              {/* Right Side: Action Buttons */}
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 px-6 py-2.5 bg-cyan-500/10 border border-cyan-400/50 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-all rounded-lg font-mono text-sm font-bold tracking-widest shadow-[0_0_15px_rgba(0,229,255,0.2)]">
                  <Download className="w-4 h-4" /> DOWNLOAD DATA
                </button>
                <button
                  onClick={handleReturnToCommandCenter}
                  className="flex items-center gap-2 px-6 py-2.5 bg-black/40 border border-white/20 text-gray-300 hover:border-white/50 hover:text-white transition-all rounded-lg font-mono text-sm tracking-widest"
                >
                  RESET
                </button>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
