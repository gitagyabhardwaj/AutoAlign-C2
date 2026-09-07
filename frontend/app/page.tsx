"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Target, ArrowRight, ShieldCheck, Cpu } from "lucide-react";
import { StarsBackground } from "@/components/ui/stars";
import { orbitron, mono } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export default function CoverPage() {
  return (
    <div className={cn(mono.className, "relative min-h-screen bg-[#050505] text-white overflow-hidden flex flex-col")}>
      {/* Background Starfield */}
      <StarsBackground factor={0.02} speed={50} className="absolute inset-0 z-0 pointer-events-none opacity-40" />

      {/* Top Navigation Bar */}
      <header className="flex justify-between items-center px-8 py-6 border-b border-white/10 z-20">
        <div className="flex items-center gap-2 text-xs tracking-widest text-cyan-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>CHANDRAYAAN-2 LUNAR MONITOR</span>
        </div>
        <div className="text-xs text-gray-400 tracking-wider">
          PDS4-CRS / ELLIPSOID COMPLIANT
        </div>
      </header>

      {/* Main Split Content */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-2 items-center px-12 lg:px-24 gap-12 max-w-[1600px] mx-auto w-full">
        
        {/* Left Side: Mission Branding & Overview */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col justify-center space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs tracking-widest w-fit">
            <Target className="w-3.5 h-3.5" /> AUTOALIGN C2 SYSTEM
          </div>
          
          <h1 className={cn(orbitron.className, "text-4xl lg:text-6xl font-extrabold tracking-tight uppercase leading-none")}>
            Multi-Modal <br />
            <span className="text-cyan-400">Registration</span>
          </h1>
          
          <p className="text-gray-400 text-sm lg:text-base max-w-lg leading-relaxed">
            Automated sub-pixel projective warp and multi-sensor data fusion fusing OHRC, TMC-2, and IIRS orbital datasets for Chandrayaan-2.
          </p>

          <div className="flex items-center gap-4 pt-4">
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-cyan-500 text-black font-bold tracking-widest text-sm hover:bg-cyan-400 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(0,229,255,0.4)] cursor-pointer"
            >
              INITIALIZE COMMAND <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        {/* Right Side: Telemetry / Target Parameters Box */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl blur-lg opacity-30"></div>
          
          <div className="relative bg-[#0a0a0a] border border-cyan-500/30 rounded-xl p-8 backdrop-blur-xl shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <span className="text-xs text-cyan-400 tracking-widest font-bold">TARGET COORDINATES COMMAND</span>
              <span className="text-[10px] text-gray-500">SYSTEM ID: #129</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/40 border border-white/10 p-4 rounded-lg">
                <span className="text-[10px] text-gray-500 block mb-1">LATITUDE (°N/S)</span>
                <span className="text-xl font-bold text-white">-43.31</span>
              </div>
              <div className="bg-black/40 border border-white/10 p-4 rounded-lg">
                <span className="text-[10px] text-gray-500 block mb-1">LONGITUDE (°E/W)</span>
                <span className="text-xl font-bold text-white">-11.36</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] text-gray-500 tracking-wider">ACTIVE DATASETS</span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-cyan-950/40 border border-cyan-500/20 py-2 rounded text-cyan-300">OHRC 0.25m</div>
                <div className="bg-cyan-950/40 border border-cyan-500/20 py-2 rounded text-cyan-300">TMC-2 5.0m</div>
                <div className="bg-cyan-950/40 border border-cyan-500/20 py-2 rounded text-cyan-300">IIRS 80m</div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-gray-400 border-t border-white/10">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-cyan-400" /> RMSE &lt; 1.0 px</span>
              <span className="flex items-center gap-1.5"><Cpu className="w-4 h-4 text-cyan-400" /> LoFTR Matching Active</span>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
