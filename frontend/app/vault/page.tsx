import Link from "next/link";
import { AudioWaveform, ChevronLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

import { VaultEnrollment } from "@/components/VaultEnrollment";

export default function VaultPage() {
  return (
    <div className="relative min-h-screen bg-white text-black dark:bg-black dark:text-white transition-colors duration-300 font-sans pb-16 pt-24">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight hover:opacity-80 transition-opacity">
            <AudioWaveform className="w-6 h-6" />
            <span>Aural</span>
          </Link>
          
          <nav className="flex items-center gap-4">
            <ThemeToggle />
            <Link 
              href="/dashboard"
              className="hidden md:flex items-center justify-center gap-1 text-sm font-medium text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <div className="relative mx-auto max-w-6xl px-4 pt-10">
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-4xl font-bold tracking-tight">
              Family Voice Vault
            </h1>
            <p className="text-sm text-black/60 dark:text-white/60 font-body">
              Store embeddings locally on this machine for caller verification.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-black/20 dark:border-white/20 bg-transparent px-4 py-2 text-sm font-bold text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
        <VaultEnrollment />
      </div>
    </div>
  );
}
