"use client";
import { TelemetryGraphs } from "@/components/ui/TelemetryGraphs";

import React, { useState, useEffect, useRef } from "react";
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
  AlertCircle,
  Loader2,
} from "lucide-react";
import { StarsBackground } from "@/components/ui/stars";
import { orbitron, sans, mono } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import {
  runPipeline,
  downloadAlignedTiff,
  type PipelineResult,
  type PipelineResponse,
} from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface UploadedSensor {
  file: File;
  previewUrl: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MissionControlDashboard() {
  // Mission lifecycle: setup → processing → payload
  const [missionState, setMissionState] = useState<
    "setup" | "processing" | "payload"
  >("setup");

  // Uploaded file state (keeps both File + blob preview URL)
  const [ohrcUpload, setOhrcUpload] = useState<UploadedSensor | null>(null);
  const [tmcUpload, setTmcUpload] = useState<UploadedSensor | null>(null);
  const [iirsUpload, setIirsUpload] = useState<UploadedSensor | null>(null);

  // Pipeline result from the backend
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(
    null
  );

  // Processing state
  const [processingStage, setProcessingStage] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Interactive Fact Bubble
  const [factIndex, setFactIndex] = useState(0);
  const moonFacts = [
    "Did you know? Chandrayaan-2's OHRC camera provides the highest resolution lunar images ever taken (0.25m/px).",
    "The lunar south pole features permanently shadowed craters that act as cold traps for water ice.",
    "TMC-2 on board the orbiter maps the lunar surface in 3D to help us understand its geological evolution.",
    "The IIRS sensor maps lunar mineralogy in the infrared spectrum to locate hydroxyl and water signatures.",
  ];

  // Default placeholder for sensor cards before results arrive
  const defaultSensorImg =
    "https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=800&auto=format&fit=crop&grayscale=true";

  // Dynamic import of @google/model-viewer on client mount
  useEffect(() => {
    import("@google/model-viewer").catch((err) =>
      console.error("Failed to load @google/model-viewer:", err)
    );
  }, []);

  // ─── File Upload Handler ─────────────────────────────────────────────────

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<UploadedSensor | null>>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setter({ file, previewUrl });
    }
  };

  // ─── Pipeline Execution ──────────────────────────────────────────────────

  const handleInitiatePipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate: OHRC + TMC are required
    if (!ohrcUpload || !tmcUpload) {
      setErrorMessage("Please upload both OHRC and TMC-2 sensor archives before running the pipeline.");
      return;
    }

    setMissionState("processing");
    setProcessingStage(1);

    try {
      // Animate the stages while the real backend processes
      const stageTimer = setInterval(() => {
        setProcessingStage((prev) => {
          if (prev < 4) return prev + 1;
          return prev;
        });
      }, 2500);

      const response: PipelineResponse = await runPipeline(
        ohrcUpload.file,
        tmcUpload.file,
        iirsUpload?.file
      );

      clearInterval(stageTimer);

      if (!response.success) {
        const errMsg = "error" in response ? response.error : "Unknown pipeline error.";
        setErrorMessage(errMsg);
        setMissionState("setup");
        setProcessingStage(0);
        return;
      }

      // Success! Store the result and show all stages as complete before transitioning
      const result = response as PipelineResult;
      setPipelineResult(result);
      setProcessingStage(4);

      // Brief pause to let the user see all 4 checkmarks before transition
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setMissionState("payload");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Network error — is the backend running on localhost:8000?";
      setErrorMessage(message);
      setMissionState("setup");
      setProcessingStage(0);
    }
  };

  // ─── Reset ───────────────────────────────────────────────────────────────

  const handleReturnToCommandCenter = () => {
    setMissionState("setup");
    setProcessingStage(0);
    setPipelineResult(null);
    setErrorMessage(null);
  };

  // ─── Download Handler ────────────────────────────────────────────────────

  const handleDownload = async () => {
    try {
      await downloadAlignedTiff();
    } catch {
      setErrorMessage("Download failed. The GeoTIFF may not have been exported.");
    }
  };

  // ─── Stage Definitions ───────────────────────────────────────────────────

  const stages = [
    {
      id: 1,
      title: "GeoTIFF Ingestion",
      desc: "Extracting PDS4 archives and loading raster bands",
      subtext: "Payload: 16-bit GeoTIFF / PDS4 CRS Projection",
    },
    {
      id: 2,
      title: "LoFTR Feature Matching",
      desc: "Transformer-based deep geometric matching on CUDA",
      subtext: "Engine: kornia.feature.LoFTR / Attention-based",
    },
    {
      id: 3,
      title: "RANSAC Homography",
      desc: "Outlier rejection and projective warp estimation",
      subtext: "Method: cv2.findHomography + RANSAC",
    },
    {
      id: 4,
      title: "Validation & Export",
      desc: "Computing RMSE, checkerboard, and GeoTIFF export",
      subtext: "Output: Aligned_Composite.tif + quality metrics",
    },
  ];

  // ─── Metric Helpers ──────────────────────────────────────────────────────

  const metrics = pipelineResult?.metrics;
  const displayRmse = metrics ? metrics.rmse.toFixed(2) : "—";
  const displayInliers = metrics ? metrics.num_inliers.toLocaleString() : "—";
  const displayRatio = metrics
    ? metrics.inlier_ratio.toFixed(1) + "%"
    : "—";

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <main
      className={cn(
        sans.className,
        "relative w-screen h-screen overflow-hidden bg-[#07060c] text-white select-none"
      )}
    >
      {/* Absolute Cosmic Starfield Base Layer */}
      <StarsBackground
        factor={0.02}
        speed={50}
        className="absolute inset-0 z-0 pointer-events-none"
      />

      <AnimatePresence mode="wait">
        {/* ================================================================ */}
        {/* PHASE 1: The 50/50 Command Center ('setup' | 'processing')      */}
        {/* ================================================================ */}
        {(missionState === "setup" || missionState === "processing") && (
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

              {/* Centered Moon 3D Model */}
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
                onClick={() =>
                  setFactIndex((prev) => (prev + 1) % moonFacts.length)
                }
                className="absolute bottom-6 left-6 z-20 max-w-[280px] bg-cyan-600/30 backdrop-blur-md border border-cyan-400/50 text-white text-sm p-4 rounded-2xl rounded-bl-none shadow-[0_4px_20px_rgba(0,229,255,0.15)] cursor-pointer hover:bg-cyan-600/40 transition-all select-none"
              >
                <p className="leading-relaxed">{moonFacts[factIndex]}</p>
                <span className="block mt-2 text-[10px] text-cyan-200 opacity-70">
                  Tap for next fact...
                </span>
              </div>
            </section>

            {/* ------------------------------------------------------------ */}
            {/* RIGHT HALF: Mission Targeting & Pipeline Control              */}
            {/* ------------------------------------------------------------ */}
            <section className="relative h-full w-full overflow-y-auto p-6 md:p-8 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent flex flex-col justify-center">
              {/* Header Title */}
              <div className="pb-4 border-b border-white/10 space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#00E5FF]">
                  <Compass className="w-3.5 h-3.5 text-[#00E5FF]" />
                  <span>CHANDRAYAAN-2 FLIGHT TERMINAL</span>
                </div>
                <h1
                  className={cn(
                    orbitron.className,
                    "text-xl md:text-2xl font-bold tracking-tight text-white"
                  )}
                >
                  Sensor Data Ingestion
                </h1>
                <p className="text-xs text-neutral-400">
                  Upload raw .zip photo archives for OHRC, TMC-2, and IIRS
                  sensors to initiate multi-sensor fusion.
                </p>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 p-4 rounded-xl border border-red-500/40 bg-red-950/40 backdrop-blur-md"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-300 font-medium">
                      Pipeline Error
                    </p>
                    <p className="text-xs text-red-400/80 mt-1">
                      {errorMessage}
                    </p>
                  </div>
                  <button
                    onClick={() => setErrorMessage(null)}
                    className="ml-auto text-red-400 hover:text-red-200 text-xs"
                  >
                    ✕
                  </button>
                </motion.div>
              )}

              {/* Upload Cards & Pipeline Button */}
              <div className="p-6 rounded-2xl border border-white/10 bg-neutral-950/80 backdrop-blur-xl shadow-2xl space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-white font-semibold flex items-center gap-2">
                    <Crosshair className="w-4 h-4 text-[#00E5FF]" />
                    SENSOR ARCHIVE UPLOADS
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500">
                    PDS4-CRS / ELLIPSOID
                  </span>
                </div>

                <form onSubmit={handleInitiatePipeline} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* OHRC Upload */}
                    {ohrcUpload ? (
                      <div className="bg-black/60 border border-cyan-500/60 p-3 rounded-lg flex flex-col relative w-full h-full shadow-[0_0_15px_rgba(0,229,255,0.1)]">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-cyan-400 font-bold text-xs tracking-widest">
                            OHRC
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-cyan-900/50 text-cyan-300 rounded border border-cyan-500/30">
                            LOCKED
                          </span>
                        </div>
                        <div className="w-full h-24 bg-black/80 rounded mb-3 border border-cyan-500/20 flex flex-col items-center justify-center">
                          <span className="text-cyan-500 font-mono text-xs">PDS4 ARCHIVE</span>
                          <span className="text-gray-500 font-mono text-[9px] mt-1">.zip loaded</span>
                        </div>
                        <p className="text-[10px] text-gray-400 truncate">
                          {ohrcUpload.file.name}
                        </p>
                        <input
                          type="file"
                          accept=".zip, image/*, .tif, .tiff"
                          onChange={(e) => handleFileUpload(e, setOhrcUpload)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    ) : (
                      <div className="bg-black/60 border border-dashed border-cyan-500/40 p-6 rounded-lg flex flex-col items-center justify-center space-y-2 hover:bg-cyan-950/30 hover:border-cyan-400 transition-all cursor-pointer relative">
                        <span className="text-cyan-400 font-bold text-xs tracking-widest">
                          OHRC
                        </span>
                        <UploadCloud className="w-6 h-6 text-cyan-500/50" />
                        <span className="text-[10px] text-gray-500">
                          Select .zip
                        </span>
                        <input
                          type="file"
                          accept=".zip, image/*, .tif, .tiff"
                          onChange={(e) => handleFileUpload(e, setOhrcUpload)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    )}

                    {/* TMC-2 Upload */}
                    {tmcUpload ? (
                      <div className="bg-black/60 border border-cyan-500/60 p-3 rounded-lg flex flex-col relative w-full h-full shadow-[0_0_15px_rgba(0,229,255,0.1)]">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-cyan-400 font-bold text-xs tracking-widest">
                            TMC-2
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-cyan-900/50 text-cyan-300 rounded border border-cyan-500/30">
                            LOCKED
                          </span>
                        </div>
                        <div className="w-full h-24 bg-black/80 rounded mb-3 border border-cyan-500/20 flex flex-col items-center justify-center"><span className="text-cyan-500 font-mono text-xs">PDS4 ARCHIVE</span><span className="text-gray-500 font-mono text-[9px] mt-1">.zip loaded</span></div>
                        <p className="text-[10px] text-gray-400 truncate">
                          {tmcUpload.file.name}
                        </p>
                        <input
                          type="file"
                          accept=".zip, image/*, .tif, .tiff"
                          onChange={(e) => handleFileUpload(e, setTmcUpload)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    ) : (
                      <div className="bg-black/60 border border-dashed border-cyan-500/40 p-6 rounded-lg flex flex-col items-center justify-center space-y-2 hover:bg-cyan-950/30 hover:border-cyan-400 transition-all cursor-pointer relative">
                        <span className="text-cyan-400 font-bold text-xs tracking-widest">
                          TMC-2
                        </span>
                        <UploadCloud className="w-6 h-6 text-cyan-500/50" />
                        <span className="text-[10px] text-gray-500">
                          Select .zip
                        </span>
                        <input
                          type="file"
                          accept=".zip, image/*, .tif, .tiff"
                          onChange={(e) => handleFileUpload(e, setTmcUpload)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    )}

                    {/* IIRS Upload (Optional) */}
                    {iirsUpload ? (
                      <div className="bg-black/60 border border-cyan-500/60 p-3 rounded-lg flex flex-col relative w-full h-full shadow-[0_0_15px_rgba(0,229,255,0.1)]">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-cyan-400 font-bold text-xs tracking-widest">
                            IIRS
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-cyan-900/50 text-cyan-300 rounded border border-cyan-500/30">
                            LOCKED
                          </span>
                        </div>
                        <div className="w-full h-24 bg-black/80 rounded mb-3 border border-purple-500/20 flex flex-col items-center justify-center"><span className="text-purple-500 font-mono text-xs">PDS4 ARCHIVE</span><span className="text-gray-500 font-mono text-[9px] mt-1">.zip loaded</span></div>
                        <p className="text-[10px] text-gray-400 truncate">
                          {iirsUpload.file.name}
                        </p>
                        <input
                          type="file"
                          accept=".zip, image/*, .tif, .tiff"
                          onChange={(e) => handleFileUpload(e, setIirsUpload)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    ) : (
                      <div className="bg-black/60 border border-dashed border-cyan-500/40 p-6 rounded-lg flex flex-col items-center justify-center space-y-2 hover:bg-cyan-950/30 hover:border-cyan-400 transition-all cursor-pointer relative">
                        <span className="text-cyan-400 font-bold text-xs tracking-widest">
                          IIRS
                        </span>
                        <UploadCloud className="w-6 h-6 text-purple-500/50" />
                        <span className="text-[10px] text-gray-500">
                          Optional .zip
                        </span>
                        <input
                          type="file"
                          accept=".zip, image/*, .tif, .tiff"
                          onChange={(e) => handleFileUpload(e, setIirsUpload)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>

                  {/* INITIATE PIPELINE Button (visible only in setup) */}
                  {missionState === "setup" && (
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      disabled={!ohrcUpload || !tmcUpload}
                      className={cn(
                        orbitron.className,
                        "w-full mt-3 text-xs font-bold uppercase tracking-[0.2em] py-4 px-6 rounded-xl flex items-center justify-center gap-2.5 transition-all cursor-pointer border",
                        ohrcUpload && tmcUpload
                          ? "bg-[#00E5FF] hover:bg-[#33ebff] text-black shadow-[0_0_30px_rgba(0,229,255,0.5)] hover:shadow-[0_0_45px_rgba(0,229,255,0.8)] border-[#00E5FF]"
                          : "bg-neutral-800 text-neutral-500 border-neutral-700 cursor-not-allowed shadow-none"
                      )}
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>INITIATE PIPELINE</span>
                    </motion.button>
                  )}
                </form>

                {/* 4-Stage Progress Timeline (visible during processing) */}
                {missionState === "processing" && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="pt-4 border-t border-white/10 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-semibold flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-[#00E5FF] animate-spin" />
                        PIPELINE RUNNING ON GPU
                      </span>
                      <span className="text-[11px] font-mono text-cyan-400 font-medium">
                        Stage {processingStage} of 4
                      </span>
                    </div>

                    <div className="relative pl-1 space-y-4">
                      {stages.map((st, index) => {
                        const isCompleted = processingStage > st.id;
                        const isActive = processingStage === st.id;

                        return (
                          <div
                            key={st.id}
                            className="relative flex items-start gap-3.5"
                          >
                            {/* Vertical connecting line */}
                            {index < stages.length - 1 && (
                              <div
                                className={cn(
                                  "absolute left-[13px] top-7 bottom-[-16px] w-[1.5px] transition-colors duration-500",
                                  isCompleted
                                    ? "bg-[#00E5FF]"
                                    : "bg-white/10"
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
                              {isCompleted ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                st.id
                              )}
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
                                  {isCompleted
                                    ? "Complete"
                                    : isActive
                                    ? "Running..."
                                    : "Queued"}
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
        {missionState === "payload" && pipelineResult && (
          <motion.div
            key="phase-2-payload-reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 z-50 bg-black overflow-y-auto flex flex-col select-none scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-transparent"
          >
            {/* ------------------------------------------------------------ */}
            {/* Section 1: Full-Screen Warped Overlay (hero image)            */}
            {/* ------------------------------------------------------------ */}
            <div className="h-screen w-full relative shrink-0 overflow-hidden">
              <img
                src={pipelineResult.images.warped_overlay}
                alt="Aligned Composite Overlay"
                className="w-full h-full object-cover"
              />
              {/* Subtle vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />

              {/* HUD Badge */}
              <div className="absolute top-6 left-6 z-20 pointer-events-none flex items-center gap-2 bg-black/80 px-3.5 py-1.5 rounded-full border border-cyan-500/40 text-xs font-mono text-cyan-300 backdrop-blur-md shadow-xl">
                <span className="w-2 h-2 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF] animate-pulse" />
                <span>ALIGNED COMPOSITE — REAL PIPELINE OUTPUT</span>
              </div>

              {/* Scroll hint */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/50 animate-bounce">
                <span className="text-[10px] font-mono uppercase tracking-widest">
                  Scroll for details
                </span>
                <ChevronDown className="w-5 h-5" />
              </div>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* Section 2: Results Breakdown                                  */}
            {/* ------------------------------------------------------------ */}
            <div className="min-h-screen bg-[#050505] pt-24 px-12 pb-48 relative z-40">
              {/* Section Header */}
              <div className="max-w-7xl mx-auto space-y-2 border-b border-white/10 pb-6">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#00E5FF]">
                  <Layers className="w-4 h-4 text-[#00E5FF]" />
                  <span>PIPELINE RESULTS</span>
                </div>
                <h2
                  className={cn(
                    orbitron.className,
                    "text-2xl md:text-3xl font-bold tracking-tight text-white mt-1"
                  )}
                >
                  ALIGNMENT QUALITY ANALYSIS
                </h2>
                <p className="text-xs font-mono text-neutral-400 max-w-2xl mt-1">
                  All images and metrics below are real outputs from the LoFTR +
                  RANSAC pipeline running on your local CUDA GPU.
                </p>

              </div>

              {/* ── Metric Graphs ── */}
              {metrics && (
                <TelemetryGraphs 
                  rmse={metrics.rmse} 
                  inliers={metrics.num_inliers} 
                  totalMatches={metrics.num_matches} 
                  ratio={metrics.inlier_ratio} 
                />
              )}

              {/* ── Results Grid ── */}

              <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                {/* Card 1: OHRC Input Preview */}
                <div className="border-2 border-dashed border-white/20 hover:border-cyan-400/60 rounded-2xl overflow-hidden p-6 bg-neutral-900 backdrop-blur-md shadow-2xl transition-all group flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider text-white font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]" />
                        OHRC INPUT
                      </span>
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                        0.25 m/px
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-white tracking-tight">
                      OHRC Preprocessed (Downsampled)
                    </h3>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Downsampled OHRC image as fed into the LoFTR matching
                      engine, padded to multiples of 8.
                    </p>
                    <div className="relative w-full h-56 rounded-xl overflow-hidden border border-white/10 bg-black mt-2">
                      <img
                        src={pipelineResult.images.ohrc_preview}
                        alt="OHRC Input"
                        className="w-full h-full object-cover grayscale brightness-90 contrast-125 group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2.5 left-2.5 bg-black/80 px-2 py-0.5 rounded text-[9px] font-mono text-cyan-300 border border-cyan-500/30">
                        BAND: PAN (450-900nm)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: TMC-2 Input Preview */}
                <div className="border-2 border-dashed border-white/20 hover:border-blue-400/60 rounded-2xl overflow-hidden p-6 bg-neutral-900 backdrop-blur-md shadow-2xl transition-all group flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider text-white font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_#3b82f6]" />
                        TMC-2 INPUT
                      </span>
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30">
                        5.0 m/px
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-white tracking-tight">
                      TMC-2 Reference Frame
                    </h3>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      TMC-2 image used as the reference target for homography
                      alignment.
                    </p>
                    <div className="relative w-full h-56 rounded-xl overflow-hidden border border-white/10 bg-black mt-2">
                      <img
                        src={pipelineResult.images.tmc_preview}
                        alt="TMC-2 Input"
                        className="w-full h-full object-cover contrast-150 brightness-85 sepia-[0.25] group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2.5 left-2.5 bg-black/80 px-2 py-0.5 rounded text-[9px] font-mono text-blue-300 border border-blue-500/30">
                        STEREO TRIPLET DEM
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 3: Match Visualization */}
                <div className="border-2 border-dashed border-white/20 hover:border-purple-400/60 rounded-2xl overflow-hidden p-6 bg-neutral-900 backdrop-blur-md shadow-2xl transition-all group flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider text-white font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_#a855f7]" />
                        MATCH VISUALIZATION
                      </span>
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                        LoFTR
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-white tracking-tight">
                      Keypoint Correspondences
                    </h3>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      LoFTR-detected matches with RANSAC inlier filtering. Lines
                      connect corresponding keypoints.
                    </p>
                    <div className="relative w-full h-56 rounded-xl overflow-hidden border border-white/10 bg-black mt-2">
                      <img
                        src={pipelineResult.images.match_visualization}
                        alt="Match Visualization"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2.5 left-2.5 bg-black/80 px-2 py-0.5 rounded text-[9px] font-mono text-purple-300 border border-purple-500/30">
                        {pipelineResult.metrics.num_inliers} INLIERS / {pipelineResult.metrics.num_matches} MATCHES
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Checkerboard Full-Width ── */}
              <div className="max-w-7xl mx-auto mt-12">
                <div className="border-2 border-dashed border-white/20 hover:border-green-400/60 rounded-2xl overflow-hidden p-6 bg-neutral-900 backdrop-blur-md shadow-2xl transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                      <span className="text-xs font-mono uppercase tracking-wider text-white font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_#22c55e]" />
                        ALIGNMENT CHECKERBOARD
                      </span>
                      <p className="text-xs text-neutral-400">
                        Alternating tiles from TMC-2 reference and warped OHRC —
                        smooth transitions indicate sub-pixel alignment quality.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-green-500/10 text-green-300 border border-green-500/30">
                      RMSE: {displayRmse} px
                    </span>
                  </div>
                  <div className="relative w-full h-72 md:h-96 rounded-xl overflow-hidden border border-white/10 bg-black">
                    <img
                      src={pipelineResult.images.checkerboard}
                      alt="Alignment Checkerboard"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Spacer for footer */}
              <div className="h-40 w-full shrink-0" />
            </div>

            {/* ------------------------------------------------------------ */}
            {/* Section 3: Fixed Bottom Bar with REAL Metrics                 */}
            {/* ------------------------------------------------------------ */}
            <footer className="fixed bottom-0 w-full h-24 bg-black/60 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-50 flex items-center justify-between px-12">
              {/* Left Side: Real Telemetry Metrics */}
              <div className="flex items-center gap-4 font-mono">
                <div className="bg-black/50 border border-cyan-500/20 px-3.5 py-1.5 rounded-lg flex items-center gap-2">
                  <span className="text-[9px] uppercase tracking-wider text-gray-400">
                    RMSE:
                  </span>
                  <span className="text-xs font-bold text-cyan-400">
                    {displayRmse} px
                  </span>
                </div>
                <div className="bg-black/50 border border-cyan-500/20 px-3.5 py-1.5 rounded-lg flex items-center gap-2">
                  <span className="text-[9px] uppercase tracking-wider text-gray-400">
                    Inliers:
                  </span>
                  <span className="text-xs font-bold text-cyan-400">
                    {displayInliers}
                  </span>
                </div>
                <div className="bg-black/50 border border-cyan-500/20 px-3.5 py-1.5 rounded-lg flex items-center gap-2">
                  <span className="text-[9px] uppercase tracking-wider text-gray-400">
                    Ratio:
                  </span>
                  <span className="text-xs font-bold text-cyan-400">
                    {displayRatio}
                  </span>
                </div>
                <div className="bg-black/50 border border-cyan-500/20 px-3.5 py-1.5 rounded-lg flex items-center gap-2">
                  <span className="text-[9px] uppercase tracking-wider text-gray-400">
                    Matches:
                  </span>
                  <span className="text-xs font-bold text-cyan-400">
                    {metrics?.total_raw?.toLocaleString() ?? "—"} → {metrics?.total_filtered?.toLocaleString() ?? "—"}
                  </span>
                </div>
              </div>

              {/* Right Side: Action Buttons */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-6 py-2.5 bg-cyan-500/10 border border-cyan-400/50 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-all rounded-lg font-mono text-sm font-bold tracking-widest shadow-[0_0_15px_rgba(0,229,255,0.2)]"
                >
                  <Download className="w-4 h-4" /> DOWNLOAD GEOTIFF
                </button>
                <button
                  onClick={handleReturnToCommandCenter}
                  className="flex items-center gap-2 px-6 py-2.5 bg-black/40 border border-white/20 text-gray-300 hover:border-white/50 hover:text-white transition-all rounded-lg font-mono text-sm tracking-widest"
                >
                  <RotateCcw className="w-4 h-4" /> RESET
                </button>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
