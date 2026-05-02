import Link from "next/link";
import { AudioWaveform, ChevronLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function NotFound() {
  return (
    <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300 font-sans pb-16 pt-24 flex flex-col items-center justify-center">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight hover:opacity-80 transition-opacity">
            <AudioWaveform className="w-6 h-6" />
            <span>Aural</span>
          </Link>
          
          <nav className="flex items-center gap-4">
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <div className="flex flex-col items-center justify-center text-center gap-6 px-4">
        <h1 className="font-display text-8xl md:text-9xl font-bold tracking-tight">404</h1>
        <h2 className="font-display text-2xl md:text-3xl font-bold">Page not found</h2>
        <p className="text-black/60 dark:text-white/60 font-body max-w-md">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-black dark:bg-white px-6 py-3 text-sm font-bold text-white dark:text-black hover:scale-105 transition-transform"
        >
          <ChevronLeft className="w-4 h-4" />
          Return to Home
        </Link>
      </div>
    </div>
  );
}