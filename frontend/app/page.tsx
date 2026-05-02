"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Shield, BrainCircuit, Fingerprint, ChevronRight, Activity, Check, AudioWaveform } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function LandingPage() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300 font-sans">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <AudioWaveform className="w-6 h-6" />
            <span>Aural</span>
          </div>
          
          <nav className="flex items-center gap-4 md:gap-8 text-sm font-medium text-black/60 dark:text-white/60">
            <a href="#features" className="hover:text-black dark:hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hidden sm:block hover:text-black dark:hover:text-white transition-colors">How it works</a>
          </nav>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link 
              href="/dashboard"
              className="flex items-center justify-center bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 md:px-4 md:py-2 rounded-md text-xs md:text-sm font-bold hover:scale-105 transition-transform"
            >
              Launch App
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-32 md:pt-40">
        {/* Hero Section */}
        <section className="container mx-auto px-6 pb-24 md:pb-32">
          <motion.div 
            className="flex flex-col items-center text-center"
            variants={container}
            initial="hidden"
            animate="show"
          >
            <motion.h1 
              variants={item}
              className="font-display text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-[1.05] mb-8"
            >
              Real-time AI <br />
              <span className="italic opacity-80">scam-call shield.</span>
            </motion.h1>
            
            <motion.p 
              variants={item}
              className="font-body text-lg md:text-2xl text-black/70 dark:text-white/70 max-w-2xl mb-12"
            >
              Detect voice deepfakes, analyze social-engineering language, and verify impersonated callers instantly before the damage is done.
            </motion.p>
            
            <motion.div variants={item} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link 
                href="/dashboard"
                className="group flex items-center justify-center gap-2 bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-lg text-lg font-bold hover:bg-black/90 dark:hover:bg-white/90 transition-all"
              >
                Launch Dashboard
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            <motion.div 
              variants={item}
              className="mt-20 w-full max-w-4xl relative h-64 md:h-96 rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 overflow-hidden flex items-center justify-center"
            >
              {/* Abstract Waveform Graphic */}
              <div className="absolute inset-0 flex items-center justify-center opacity-20 dark:opacity-40">
                {[...Array(30)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 md:w-2.5 bg-black dark:bg-white mx-1.5 rounded-full"
                    animate={{
                      height: ["12.5%", `${Math.random() * 100 + 25}%`, "12.5%"],
                    }}
                    transition={{
                      duration: 1.5 + Math.random() * 0.5,
                      repeat: Infinity,
                      delay: i * 0.05,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
              <div className="relative z-10 bg-white dark:bg-black p-6 rounded-2xl border border-black/10 dark:border-white/10 shadow-2xl flex items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black">
                  <Shield className="w-8 h-8" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-xl uppercase tracking-widest">Call Secured</div>
                  <div className="text-black/60 dark:text-white/60 font-body">0.02% Deepfake Probability</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Features / The 3 Pillars */}
        <section id="features" className="py-24 md:py-32 border-t border-black/10 dark:border-white/10">
          <div className="container mx-auto px-6">
            <div className="text-center mb-24">
              <h2 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-6">The Three Pillars</h2>
              <p className="font-body text-xl text-black/60 dark:text-white/60 max-w-2xl mx-auto">
                Aural uses a multi-layered approach to guarantee authenticity.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="group p-10 border border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white bg-white dark:bg-black transition-all">
                <BrainCircuit className="w-12 h-12 mb-8 text-black dark:text-white" />
                <h3 className="font-display text-3xl font-bold mb-4">Synthetic Voice Detection</h3>
                <p className="font-body text-black/70 dark:text-white/70 leading-relaxed">
                  Powered by AASIST3 architecture, detecting AI-generated audio artifacts imperceptible to the human ear.
                </p>
              </div>
              <div className="group p-10 border border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white bg-black text-white dark:bg-white dark:text-black transition-all transform md:-translate-y-4 shadow-2xl">
                <Activity className="w-12 h-12 mb-8" />
                <h3 className="font-display text-3xl font-bold mb-4">Social-Engineering Analysis</h3>
                <p className="font-body opacity-80 leading-relaxed">
                  Real-time intent analysis using Claude Haiku to flag coercive language, urgency, and manipulative patterns.
                </p>
              </div>
              <div className="group p-10 border border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white bg-white dark:bg-black transition-all">
                <Fingerprint className="w-12 h-12 mb-8 text-black dark:text-white" />
                <h3 className="font-display text-3xl font-bold mb-4">Voice-Print Verification</h3>
                <p className="font-body text-black/70 dark:text-white/70 leading-relaxed">
                  Family Voice Vault compares incoming audio against securely enrolled biometric voiceprints for absolute certainty.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* The Problem Section */}
        <section className="bg-black text-white dark:bg-white dark:text-black py-24 md:py-32">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="font-display text-5xl md:text-6xl font-bold tracking-tight mb-8">
                  The billion-dollar fraud industry.
                </h2>
                <p className="font-body text-xl opacity-80 mb-10 leading-relaxed">
                  Voice clones are now indistinguishable from reality. Scammers use AI to impersonate family members, executives, and authorities, bypassing traditional security measures and exploiting human trust.
                </p>
                <div className="flex flex-col gap-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-white text-black dark:bg-black dark:text-white p-2 rounded-full shrink-0">
                      <Check className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="block text-2xl font-display font-bold">Grandparent Scams</strong>
                      <span className="font-body opacity-70">AI clones pleading for emergency funds.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-white text-black dark:bg-black dark:text-white p-2 rounded-full shrink-0">
                      <Check className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="block text-2xl font-display font-bold">Executive Impersonation</strong>
                      <span className="font-body opacity-70">Deepfaked CEOs ordering wire transfers.</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative h-full min-h-[400px] border border-white/20 dark:border-black/20 p-12 flex flex-col justify-center overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Shield className="w-48 h-48" />
                </div>
                <div className="relative z-10">
                  <div className="font-display text-7xl md:text-9xl font-bold mb-4">$1B+</div>
                  <div className="font-body text-2xl opacity-80 uppercase tracking-widest font-bold">Lost annually to AI voice fraud</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 md:py-32">
          <div className="container mx-auto px-6">
            <h2 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-center mb-24">How It Works</h2>
            <div className="flex flex-col md:flex-row gap-12 justify-center relative">
              {/* Connecting line for desktop */}
              <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-px bg-black/20 dark:bg-white/20"></div>
              
              {[
                { step: "1", title: "Listen", desc: "Aural passively monitors the audio stream in real-time during the call." },
                { step: "2", title: "Analyze", desc: "The 3-pillar engine dissects acoustic artifacts and semantic intent." },
                { step: "3", title: "Protect", desc: "Visual alerts and warnings appear before any sensitive information is shared." },
              ].map((item, i) => (
                <div key={i} className="flex-1 relative text-center">
                  <div className="w-24 h-24 mx-auto bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center font-display font-bold text-4xl mb-8 z-10 relative shadow-2xl transition-transform hover:scale-110">
                    {item.step}
                  </div>
                  <h4 className="font-display text-3xl font-bold mb-4">{item.title}</h4>
                  <p className="font-body text-black/70 dark:text-white/70 text-lg">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-24 md:py-32 bg-black/5 dark:bg-white/5 border-t border-black/10 dark:border-white/10 text-center">
          <div className="container mx-auto px-6">
            <h2 className="font-display text-4xl md:text-6xl font-bold mb-8">Ready to secure your voice channels?</h2>
            <Link 
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 bg-black dark:bg-white text-white dark:text-black px-10 py-5 rounded-lg text-xl font-bold hover:scale-105 transition-transform"
            >
              Launch App
              <ChevronRight className="w-6 h-6" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-black/10 dark:border-white/10 py-12 bg-white dark:bg-black">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <AudioWaveform className="w-6 h-6" />
            <span>Aural</span>
          </div>
          <p className="font-body text-black/50 dark:text-white/50 text-sm font-medium">
            &copy; {new Date().getFullYear()} Aural Security. All rights reserved.
          </p>
          <div className="flex gap-8 text-sm font-medium font-body">
            <a href="#" className="hover:text-black/70 dark:hover:text-white/70 transition-colors">GitHub</a>
            <a href="#" className="hover:text-black/70 dark:hover:text-white/70 transition-colors">Demo</a>
            <Link href="/dashboard" className="font-bold hover:text-black/70 dark:hover:text-white/70 transition-colors">Launch App</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
