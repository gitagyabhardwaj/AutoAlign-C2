"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { StarsBackground } from "@/components/ui/stars";
import { orbitron } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export default function CoverPage() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Track pointer down coordinates to distinguish between click and drag/orbit
  const pointerDownPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setIsLoaded(true);
    // Dynamically import @google/model-viewer on the client side
    import("@google/model-viewer").catch((err) =>
      console.error("Failed to load model-viewer element:", err)
    );
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isNavigating) return;

    const deltaX = Math.abs(e.clientX - pointerDownPos.current.x);
    const deltaY = Math.abs(e.clientY - pointerDownPos.current.y);

    // If movement is under 5px in both axes, treat as true click/tap
    if (deltaX < 5 && deltaY < 5) {
      setIsNavigating(true);
      // After ~800ms swish animation completes, push to /dashboard
      setTimeout(() => {
        router.push("/dashboard");
      }, 800);
    }
    // If delta is 5px or greater, user was dragging/orbiting the model: do nothing
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black flex flex-col items-center justify-center select-none">
      <StarsBackground className="w-full h-full flex flex-col items-center justify-center bg-[#07060c]">
        {/* Top Center Title with Google Orbitron font and cinematic subtle ice-glow */}
        <motion.h1
          animate={
            isNavigating
              ? {
                  opacity: 0,
                  scale: 1.4,
                  letterSpacing: "0.5em",
                  filter: "blur(6px)",
                }
              : { opacity: 1, scale: 1 }
          }
          transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
          style={{
            textShadow:
              "0 0 20px rgba(255, 255, 255, 0.7), 0 0 40px rgba(34, 211, 238, 0.25)",
          }}
          className={cn(
            orbitron.className,
            "absolute top-10 md:top-14 left-1/2 -translate-x-1/2 text-2xl sm:text-3xl md:text-4xl font-bold uppercase tracking-[0.3em] text-white pointer-events-none select-none z-30 text-center whitespace-nowrap"
          )}
        >
          AUTOALIGN C2
        </motion.h1>

        {/* 3D Model Container with Pointer Delta Tracking */}
        <motion.div
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          animate={
            isNavigating
              ? {
                  scale: 18,
                  opacity: 0,
                  filter: "blur(8px) brightness(2.2)",
                }
              : {
                  scale: 1,
                  opacity: 1,
                  filter: "blur(0px) brightness(1)",
                }
          }
          transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
          className="relative w-[90vw] max-w-4xl h-[65vh] min-h-[460px] flex items-center justify-center cursor-grab active:cursor-grabbing z-20"
        >
          {isLoaded &&
            React.createElement("model-viewer", {
              src: "/chandrayaan2.glb",
              alt: "Chandrayaan-2 3D Model",
              "auto-rotate": "",
              "auto-rotate-delay": "0",
              "rotation-per-second": "24deg",
              "camera-controls": "",
              "shadow-intensity": "1.2",
              "shadow-softness": "0.75",
              exposure: "1.15",
              "camera-orbit": "40deg 55deg 105%",
              "interaction-prompt": "none",
              style: {
                width: "100%",
                height: "100%",
                backgroundColor: "transparent",
              },
            })}
        </motion.div>

        {/* Screen Fade-to-Black Overlay */}
        <motion.div
          className="pointer-events-none fixed inset-0 z-50 bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: isNavigating ? 1 : 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
      </StarsBackground>
    </main>
  );
}
