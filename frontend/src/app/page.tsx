"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Mouse tracking for the interactive wave
  const mouseX = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 100, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    mouseX.set(x);
  };

  const tiers = [
    {
      name: "Essential",
      price: "$0",
      description: "For individual visionaries exploring the new frontier.",
      features: ["100 Neural Cycles/mo", "Standard Visual Synthesis", "Cloud Persistence", "Community Protocol"],
      button: "Begin",
      highlight: false,
    },
    {
      name: "Pro",
      price: "$20",
      description: "The gold standard for professional architects.",
      features: ["Unlimited Neural Cycles", "High-Fidelity Synthesis", "Priority Compute", "Early Access Beta", "Custom Personas"],
      button: "Elevate",
      highlight: true,
    },
    {
      name: "Legacy",
      price: "Custom",
      description: "Tailored infrastructure for enterprise-scale operations.",
      features: ["Dedicated Infrastructure", "Advanced Security Suite", "Team Synergies", "24/7 Strategic Support", "Full API Access"],
      button: "Partner",
      highlight: false,
    }
  ];

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8, ease: "easeOut" as const }
  };

  const staggerContainer = {
    initial: { opacity: 0 },
    whileInView: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    },
    viewport: { once: true }
  };

  const cardVariants = {
    initial: { opacity: 0, y: 40 },
    whileInView: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }
    }
  };

  return (
    <div className="scroll-smooth selection:bg-amber-200 selection:text-black min-h-screen flex flex-col">
      {/* Ambient Gradient Background */}
      <div
        className="fixed inset-0 z-[-1] pointer-events-none opacity-40"
        style={{ background: "radial-gradient(circle at 50% 0%, #e4e2df 0%, #fbf9f6 70%)" }}
      ></div>

      {/* Navigation Bar */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="fixed top-4 md:top-6 left-1/2 -translate-x-1/2 w-full max-w-container-max px-4 md:px-6 z-50"
      >
        <nav className="glass-panel rounded-full px-4 md:px-8 py-3 flex items-center justify-between shadow-ambient transition-all duration-300 hover:bg-background/50 backdrop-blur-xl border border-border/20">
          <Link className="flex items-center gap-2 md:gap-3 group" href="/">
            <motion.div 
              whileHover={{ scale: 0.9, rotate: -5 }}
              className="w-9 h-9 md:w-11 md:h-11 bg-foreground rounded-lg md:rounded-xl flex items-center justify-center transition-transform shadow-lg"
            >
              <span className="material-symbols-outlined text-background text-lg md:text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
            </motion.div>
            <span className="text-lg md:text-xl text-foreground tracking-tighter font-semibold">Axiora</span>
          </Link>

          <div className="hidden lg:flex items-center gap-10">
            <Link className="text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/50 hover:text-foreground transition-colors" href="#features">The Suite</Link>
            <Link className="text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/50 hover:text-foreground transition-colors" href="#pricing">Pricing</Link>
            <Link className="text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/50 hover:text-foreground transition-colors" href="#about">Philosophy</Link>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <Link className="bg-foreground hover:bg-foreground/90 text-background text-[9px] md:text-[10px] uppercase tracking-[0.15em] font-bold px-5 md:px-7 py-2.5 md:py-3 rounded-full transition-all duration-300 shadow-md hover:shadow-xl" href="/login">
              Portal
            </Link>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden w-8 h-8 flex items-center justify-center text-foreground transition-transform active:scale-90"
              aria-label="Toggle menu"
            >
              <span className="material-symbols-outlined">{isMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-0 right-0 mt-4 mx-4 p-6 bg-background rounded-3xl border border-border/5 shadow-2xl lg:hidden flex flex-col gap-6"
            >
              <Link onClick={() => setIsMenuOpen(false)} className="text-xs uppercase tracking-widest font-bold text-foreground" href="#features">The Suite</Link>
              <Link onClick={() => setIsMenuOpen(false)} className="text-xs uppercase tracking-widest font-bold text-foreground" href="#pricing">Pricing</Link>
              <Link onClick={() => setIsMenuOpen(false)} className="text-xs uppercase tracking-widest font-bold text-foreground" href="#about">Philosophy</Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Hero Section */}
      <main className="flex-grow pt-40 md:pt-32 pb-24 flex flex-col items-center justify-center relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 z-[-1]">
          <Image
            alt="Axiora Aesthetic Background"
            className="w-full h-full object-cover object-center scale-110 opacity-80"
            src="/bg-landscape.png?v=2"
            fill
            priority
            sizes="100vw"
            quality={100}
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-[#fbf9f6]"></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] as const }}
          className="w-full max-w-container-max mx-auto px-6 text-center flex flex-col items-center z-10"
        >
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="inline-flex items-center gap-3 bg-background/40 backdrop-blur-md border border-border/40 px-4 md:px-5 py-1.5 md:py-2 rounded-full mb-8 md:mb-10 shadow-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
            <span className="text-[8px] md:text-[9px] uppercase tracking-[0.3em] font-bold text-foreground/70">Protocol Active</span>
          </motion.div>

          <div className="mb-8 md:mb-12">
            <h1 className="text-4xl md:text-8xl text-foreground max-w-5xl mx-auto tracking-tighter leading-[1.1] md:leading-[0.9] font-medium flex flex-col items-center gap-2">
              <InfiniteTypewriter text="The Architecture" />
              <InfiniteTypewriter text="of Thought." isSerif />
            </h1>
          </div>

          <p className="text-base md:text-xl text-foreground/60 max-w-2xl mx-auto mb-10 md:mb-12 text-balance font-light leading-relaxed px-4">
            Axiora is a refined creative partner, bridging the gap between human intuition and unyielding neural performance.
          </p>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link href="/register" className="bg-foreground hover:bg-foreground/90 text-background text-[9px] md:text-[10px] uppercase tracking-[0.4em] font-bold px-8 md:px-12 py-4 md:py-5 rounded-sm flex items-center gap-4 transition-all duration-500 shadow-2xl group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <span>Begin Synthesis</span>
              <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
            </Link>
          </motion.div>
        </motion.div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-24 md:py-40 bg-background relative overflow-hidden">
        <div className="max-w-container-max mx-auto px-6 md:px-10 relative z-10">
          <motion.div 
            {...fadeIn}
            className="mb-16 md:mb-28"
          >
            <div className="inline-flex items-center gap-2 bg-foreground/5 border border-border/10 px-4 py-1.5 rounded-full mb-6 md:mb-8">
              <span className="font-label-sm text-[9px] text-foreground uppercase tracking-[0.4em] font-bold">The Core Suite</span>
            </div>
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 md:gap-12">
              <h2 className="text-4xl md:text-8xl text-foreground tracking-tighter font-medium max-w-3xl leading-[1] md:leading-[0.85]">
                Intelligence, <br/> 
                <span className="italic font-serif font-light opacity-30 text-5xl md:text-9xl">Redefined.</span>
              </h2>
              <p className="text-foreground/40 max-w-sm leading-relaxed text-[9px] md:text-[10px] uppercase tracking-[0.3em] font-medium border-l border-border/10 pl-6 md:pl-8">
                A modular ecosystem built for the next generation of creative architects.
              </p>
            </div>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 h-auto md:h-[900px]"
          >
            {/* Feature 1: Neural Chat */}
            <motion.div 
              ref={cardRef}
              onMouseMove={handleMouseMove}
              variants={cardVariants}
              whileHover={{ y: -8 }}
              className="md:col-span-8 bg-background border border-border/5 rounded-[32px] md:rounded-[40px] p-8 md:p-12 flex flex-col justify-between group overflow-hidden relative shadow-sm hover:shadow-xl transition-all duration-700"
            >
              <div className="absolute top-0 right-0 p-6 md:p-12 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-1000 pointer-events-none">
                <span className="text-[120px] md:text-[200px] font-serif italic text-foreground leading-none">01</span>
              </div>
              <div className="relative z-10 pointer-events-none">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-foreground rounded-xl md:rounded-2xl flex items-center justify-center mb-8 md:mb-10 shadow-2xl">
                  <span className="material-symbols-outlined text-background text-xl md:text-2xl">psychology</span>
                </div>
                <h3 className="text-2xl md:text-4xl font-medium text-foreground mb-4 md:mb-6 tracking-tight">Neural Narrative Engine</h3>
                <p className="text-foreground/50 max-w-md leading-relaxed text-base md:text-lg font-light">
                  Dialogue that evolves. Axiora adapts to your unique creative DNA, remembering context and intent across every interaction.
                </p>
              </div>
              
              {/* INTERACTIVE MAGNETIC BARS */}
              <div className="mt-12 h-[180px] md:h-[250px] w-full bg-gradient-to-br from-foreground/[0.02] to-transparent rounded-[24px] md:rounded-[32px] border border-border/5 flex items-center justify-center relative overflow-hidden">
                 <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.05] pointer-events-none" />
                 <div className="flex gap-2 md:gap-4 relative z-10 items-end h-32 pointer-events-none">
                  {[...Array(9)].map((_, i) => {
                    const barPos = i / 8;
                    return (
                      <Bar key={i} index={i} springX={springX} pos={barPos} />
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Feature 2: Visual Studio */}
            <motion.div 
              variants={cardVariants}
              whileHover={{ y: -8 }}
              className="md:col-span-4 bg-foreground rounded-[32px] md:rounded-[40px] p-8 md:p-12 flex flex-col justify-between group overflow-hidden relative text-background shadow-sm hover:shadow-2xl transition-all duration-700"
            >
              <div className="absolute inset-0 opacity-30 pointer-events-none bg-[url('/noise.svg')]" />
              <div className="relative z-10">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-background/10 backdrop-blur-xl border border-border/10 rounded-xl md:rounded-2xl flex items-center justify-center mb-8 md:mb-10">
                  <span className="material-symbols-outlined text-background text-xl md:text-2xl">auto_awesome</span>
                </div>
                <h3 className="text-2xl md:text-4xl font-medium mb-4 md:mb-6 tracking-tight leading-tight">Visual <br/>Synthesis</h3>
                <p className="text-background/40 text-[10px] md:text-sm leading-relaxed font-light uppercase tracking-widest">
                  Transmute text into assets.
                </p>
              </div>
              <div className="relative z-10 mt-12 md:mt-auto">
                <div className="aspect-square bg-gradient-to-tr from-amber-500/30 to-white/5 rounded-[24px] md:rounded-[32px] border border-border/5 overflow-hidden transition-all duration-1000 shadow-2xl">
                  <div className="w-full h-full bg-background/[0.02] animate-pulse" />
                </div>
              </div>
            </motion.div>

            {/* Feature 3: Economy */}
            <motion.div 
              variants={cardVariants}
              className="md:col-span-6 bg-background border border-border/5 rounded-[32px] md:rounded-[40px] p-8 md:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-6 md:gap-10 group transition-all"
            >
              <div className="w-16 h-16 md:w-24 md:h-24 bg-amber-500/[0.05] rounded-2xl md:rounded-3xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-700">
                <span className="material-symbols-outlined text-amber-600 text-3xl md:text-4xl">payments</span>
              </div>
              <div>
                <h3 className="text-[8px] md:text-[9px] font-bold text-foreground/40 mb-2 md:mb-3 tracking-[0.4em] uppercase">Unified Economy</h3>
                <p className="text-foreground/80 text-lg md:text-xl font-light tracking-tight leading-snug">
                  Seamless global infrastructure.
                </p>
              </div>
            </motion.div>

            {/* Feature 4: Security */}
            <motion.div 
              variants={cardVariants}
              className="md:col-span-6 bg-background border border-border/5 rounded-[32px] md:rounded-[40px] p-8 md:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-6 md:gap-10 group transition-all"
            >
              <div className="w-16 h-16 md:w-24 md:h-24 bg-foreground/[0.03] rounded-2xl md:rounded-3xl flex items-center justify-center flex-shrink-0 group-hover:rotate-12 transition-transform duration-700">
                <span className="material-symbols-outlined text-foreground/80 text-3xl md:text-4xl">shield_lock</span>
              </div>
              <div>
                <h3 className="text-[8px] md:text-[9px] font-bold text-foreground/40 mb-2 md:mb-3 tracking-[0.4em] uppercase">Fortress Protocol</h3>
                <p className="text-foreground/80 text-lg md:text-xl font-light tracking-tight leading-snug">
                  Uncompromising encryption.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 md:py-32 bg-background relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 md:px-10 relative z-10">
          <motion.div 
            {...fadeIn}
            className="text-center mb-16 md:mb-24"
          >
            <h2 className="text-5xl md:text-7xl text-foreground mb-6 tracking-tighter font-medium">Select Your Horizon</h2>
            <p className="text-lg text-foreground/50 max-w-2xl mx-auto font-light leading-relaxed">Infrastructure built for every scale of ambition.</p>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
          >
            {tiers.map((tier) => (
              <motion.div 
                key={tier.name} 
                variants={cardVariants}
                whileHover={{ y: -12 }}
                className={`relative flex flex-col p-12 rounded-[44px] border transition-all duration-700 ${
                  tier.highlight 
                  ? "bg-foreground text-background border-border shadow-[0_40px_100px_rgba(27,28,26,0.2)] md:scale-105 z-10" 
                  : "bg-background/40 backdrop-blur-xl text-foreground border-border/5 hover:bg-background hover:shadow-xl"
                }`}
              >
                {tier.highlight && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-black px-6 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] shadow-lg">
                    Peak Signal
                  </div>
                )}
                
                <div className="mb-10">
                  <h2 className="text-2xl font-serif italic mb-4 font-light">{tier.name}</h2>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-5xl font-medium tracking-tighter">{tier.price}</span>
                    {tier.price !== "Custom" && <span className="text-[10px] opacity-40 font-bold uppercase tracking-widest">/cycle</span>}
                  </div>
                  <p className={`text-sm leading-relaxed font-light ${tier.highlight ? "opacity-60" : "text-foreground/40"}`}>
                    {tier.description}
                  </p>
                </div>

                <ul className="flex-1 space-y-5 mb-12">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-4 text-xs font-light tracking-wide uppercase">
                      <span className={`w-1.5 h-1.5 rounded-full ${tier.highlight ? "bg-amber-500" : "bg-foreground/20"}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link href="/register" className={`w-full py-5 rounded-2xl text-[10px] uppercase tracking-[0.3em] font-bold transition-all text-center block shadow-lg active:scale-[0.98] ${
                  tier.highlight 
                  ? "bg-background text-black hover:bg-amber-500" 
                  : "bg-foreground text-background hover:bg-foreground/90"
                }`}>
                  {tier.button}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section id="about" className="py-24 md:py-40 bg-background relative overflow-hidden px-6">
        <motion.div 
          {...fadeIn}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <div className="w-16 h-16 md:w-20 md:h-20 bg-foreground rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-8 md:mb-12 shadow-2xl">
            <span className="material-symbols-outlined text-background text-3xl md:text-4xl">eco</span>
          </div>
          <h2 className="text-5xl md:text-7xl text-foreground mb-10 tracking-tighter font-medium leading-tight">The Philosophy</h2>
          <p className="text-xl md:text-2xl text-foreground/60 leading-relaxed mb-12 max-w-3xl mx-auto font-light italic font-serif">
            "Technology should feel like a breath of fresh air, not a storm of noise."
          </p>
          <div className="flex justify-center pt-8 border-t border-border/5">
             <Link href="/register" className="text-[10px] uppercase tracking-[0.5em] font-bold text-amber-600 flex items-center gap-4 group">
               Become an Architect 
               <span className="hidden sm:block w-12 h-[1px] bg-amber-500/30 group-hover:w-24 transition-all duration-700"></span>
             </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-border/5 bg-background/40 backdrop-blur-sm px-6">
        <div className="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 md:gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-foreground text-3xl">eco</span>
              <span className="text-2xl tracking-tighter font-semibold text-foreground">Axiora.</span>
            </div>
            <p className="text-sm text-foreground/40 max-w-xs leading-relaxed font-light uppercase tracking-widest">
              Synthesizing the future of human-AI collaboration.
            </p>
          </div>
          
          <div className="flex flex-col gap-6">
            <h4 className="text-[9px] uppercase tracking-[0.3em] font-bold text-foreground">Network</h4>
            <Link href="/privacy" className="text-sm text-foreground/50 hover:text-foreground transition-colors font-light">Privacy Protocol</Link>
            <Link href="/help" className="text-sm text-foreground/50 hover:text-foreground transition-colors font-light">Strategic Support</Link>
          </div>

          <div className="flex flex-col gap-6">
            <h4 className="text-[9px] uppercase tracking-[0.3em] font-bold text-foreground">Connect</h4>
            <Link href="#" className="text-sm text-foreground/50 hover:text-foreground transition-colors font-light italic font-serif">@Axiora_intelligence</Link>
            <p className="text-[9px] text-foreground/20 uppercase tracking-widest pt-4">© 2026 Axiora v2.0</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// INFINITE TYPEWRITER COMPONENT
function InfiniteTypewriter({ text, isSerif = false }: { text: string, isSerif?: boolean }) {
  const characters = text.split("");
  
  return (
    <motion.div 
      initial="initial"
      animate="animate"
      className={`flex ${isSerif ? "italic font-serif font-light text-foreground/40" : ""}`}
    >
      {characters.map((char, i) => (
        <motion.span
          key={i}
          variants={{
            initial: { opacity: 0, y: 10 },
            animate: { 
              opacity: [0, 1, 1, 0],
              y: [10, 0, 0, -10],
              transition: {
                duration: 4,
                repeat: Infinity,
                delay: i * 0.1,
                times: [0, 0.1, 0.9, 1]
              }
            }
          }}
          className={char === " " ? "mr-4" : ""}
        >
          {char}
        </motion.span>
      ))}
    </motion.div>
  );
}

// SUB-COMPONENT FOR THE MAGNETIC BAR
function Bar({ index, springX, pos }: { index: number, springX: any, pos: number }) {
  const height = useTransform(springX, (val: number) => {
    const distance = Math.abs(val - pos);
    const scale = Math.max(0, 1 - distance * 3);
    return 30 + scale * 90; // Slightly taller for more presence
  });

  return (
    <motion.div 
      style={{ height }}
      className="w-1.5 md:w-2 bg-amber-500/60 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.2)]"
    />
  );
}
