"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

export default function NotFound() {
  const [mounted, setMounted] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 20, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 20, damping: 30 });

  useEffect(() => {
    setMounted(true);
    const handleMove = (e: MouseEvent) => {
      // Very subtle sensitivity for professional feel
      mouseX.set((e.clientX / window.innerWidth) - 0.5);
      mouseY.set((e.clientY / window.innerHeight) - 0.5);
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [mouseX, mouseY]);

  // Subtle Parallax (Cinema Camera Pan)
  const bgX = useTransform(springX, (v) => v * -40);
  const bgY = useTransform(springY, (v) => v * -40);
  const contentX = useTransform(springX, (v) => v * 20);
  const contentY = useTransform(springY, (v) => v * 20);

  if (!mounted) return <div className="h-screen bg-[#0a0a0a]" />;

  return (
    <div className="relative h-screen w-full bg-[#0a0a0a] overflow-hidden flex flex-col items-center justify-center">
      
      {/* FULL-SCREEN CINEMATIC BACKDROP */}
      <motion.div 
        style={{ x: bgX, y: bgY, scale: 1.15 }}
        className="absolute inset-0 z-0"
      >
        <Image 
          alt="The Horizon Seeker" 
          src="/Axiora_404_telescope_1778856637413.png"
          fill
          className="object-cover opacity-70 grayscale-[30%]"
          priority
          unoptimized
        />
        {/* Professional Color Grade Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/40"></div>
        <div className="absolute inset-0 bg-[#0a0a0a]/20 mix-blend-multiply"></div>
      </motion.div>

      {/* MINIMALIST EDITORIAL CONTENT */}
      <motion.main 
        style={{ x: contentX, y: contentY }}
        className="relative z-10 flex flex-col items-center text-center px-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* THE 404 STATEMENT */}
          <h1 className="text-[120px] md:text-[240px] font-serif font-extralight text-white leading-none tracking-tighter opacity-10">
            404
          </h1>
          
          <div className="max-w-2xl -mt-10 md:-mt-20">
            <h2 className="text-3xl md:text-6xl font-light text-white mb-6 tracking-tight leading-[1.1]">
              Horizon <span className="italic font-serif opacity-40">not found.</span>
            </h2>
            
            <p className="text-[#fbf9f6]/30 max-w-sm mx-auto text-[10px] md:text-[11px] uppercase tracking-[0.5em] font-bold leading-relaxed mb-16">
              You have reached the edge of the architecture. The signal is lost in the deep void.
            </p>

            <div className="flex justify-center">
              <Link 
                href="/"
                className="glass-panel group px-12 py-5 bg-white/5 border border-white/10 text-white text-[10px] uppercase tracking-[0.4em] font-bold overflow-hidden transition-all duration-500 hover:bg-white hover:text-black rounded-full backdrop-blur-xl shadow-2xl"
              >
                <span className="relative z-10 flex items-center gap-4">
                  Return to Origin 
                  <span className="w-8 h-[1px] bg-current opacity-30 group-hover:w-12 transition-all duration-500"></span>
                </span>
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.main>

      {/* STATUS INDICATORS (INDUSTRIAL RULES) */}
      <div className="absolute bottom-12 left-12 hidden lg:flex flex-col gap-2 opacity-20 border-l border-white/20 pl-4">
        <span className="text-[8px] uppercase tracking-widest text-white font-bold">Protocol: Search_Failure_404</span>
        <span className="text-[8px] uppercase tracking-widest text-white font-bold">Coordinates: Infinite_Void</span>
      </div>

      <div className="absolute top-12 right-12 hidden lg:flex items-center gap-4 opacity-10">
        <span className="text-[9px] uppercase tracking-[0.4em] font-bold text-white tracking-tighter">Axiora Intelligence System v2.0</span>
      </div>

      {/* NOISE OVERLAY FOR TEXTURE */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[url('/noise.svg')]" />
    </div>
  );
}
