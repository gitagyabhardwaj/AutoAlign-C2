"use client";

import React from "react";
import Link from "next/link";
import { sans } from "@/lib/fonts";
import { cn } from "@/lib/utils";

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps = {}) {
  return (
    <div className="fixed top-4 md:top-5 inset-x-0 z-50 pointer-events-none flex justify-center">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header
          className={cn(
            sans.className,
            "pointer-events-auto w-full bg-[#0a0a10]/80 border border-white/10 hover:border-white/20 backdrop-blur-xl shadow-xl shadow-black/60 rounded-full px-5 py-2.5 text-white flex items-center justify-between transition-all duration-300",
            className
          )}
        >
          {/* Brand Logo / Title */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-4 h-4 flex items-center justify-center">
              <span className="absolute w-1 h-1 rounded-full bg-[#00E5FF] top-0 left-1/2 transform -translate-x-1/2 opacity-90 shadow-[0_0_8px_#00E5FF]"></span>
              <span className="absolute w-1 h-1 rounded-full bg-[#00E5FF] left-0 top-1/2 transform -translate-y-1/2 opacity-90 shadow-[0_0_8px_#00E5FF]"></span>
              <span className="absolute w-1 h-1 rounded-full bg-[#00E5FF] right-0 top-1/2 transform -translate-y-1/2 opacity-90 shadow-[0_0_8px_#00E5FF]"></span>
              <span className="absolute w-1 h-1 rounded-full bg-[#00E5FF] bottom-0 left-1/2 transform -translate-x-1/2 opacity-90 shadow-[0_0_8px_#00E5FF]"></span>
            </div>
            <span className="font-semibold text-xs tracking-wider uppercase text-neutral-200 group-hover:text-white transition-colors">
              AutoAlign C2
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono text-neutral-500 border-l border-neutral-800 pl-2.5 ml-0.5">
              CHANDRAYAAN-2 MULTI-MODAL
            </span>
          </Link>

          {/* Single Clean Login Action Button */}
          <button
            onClick={() => {
              alert("Mission Authentication Portal: Authorization token verified.");
            }}
            className="text-xs font-medium tracking-wide text-neutral-300 hover:text-black bg-white/5 hover:bg-white border border-white/10 hover:border-white px-4 py-1.5 rounded-full transition-all duration-200 cursor-pointer"
          >
            Login
          </button>
        </header>
      </div>
    </div>
  );
}
