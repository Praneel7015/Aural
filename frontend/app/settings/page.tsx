"use client";

import Link from "next/link";
import { AudioWaveform, ChevronLeft, Save } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuralStore } from "@/lib/store";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const settings = useAuralStore((s) => s.settings);
  const updateSettings = useAuralStore((s) => s.updateSettings);

  const [provider, setProvider] = useState("openai");
  const [openaiKey, setOpenaiKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setProvider(settings.provider || "openai");
    setOpenaiKey(settings.openaiKey || "");
    setGeminiKey(settings.geminiKey || "");
  }, [settings]);

  const handleSave = () => {
    updateSettings({ provider, openaiKey, geminiKey });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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

      <div className="relative mx-auto max-w-2xl px-4 pt-10">
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-4xl font-bold tracking-tight">
              Settings
            </h1>
            <p className="text-sm text-black/60 dark:text-white/60 font-body">
              Configure your LLM provider and API keys locally.
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

        <div className="flex flex-col gap-6 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-6">
          <label className="flex flex-col gap-2 text-sm font-bold text-black/60 dark:text-white/60">
            LLM Provider
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="rounded-md border border-black/20 dark:border-white/20 bg-white dark:bg-black px-4 py-3 text-black dark:text-white outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            >
              <option value="openai">OpenAI (GPT-4o, etc.)</option>
              <option value="gemini">Google Gemini</option>
              <option value="featherless">Featherless</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-bold text-black/60 dark:text-white/60">
            OpenAI API Key
            <input
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              className="rounded-md border border-black/20 dark:border-white/20 bg-white dark:bg-black px-4 py-3 text-black dark:text-white outline-none transition focus:ring-2 focus:ring-black dark:focus:ring-white"
              placeholder="sk-..."
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-bold text-black/60 dark:text-white/60">
            Gemini API Key
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="rounded-md border border-black/20 dark:border-white/20 bg-white dark:bg-black px-4 py-3 text-black dark:text-white outline-none transition focus:ring-2 focus:ring-black dark:focus:ring-white"
              placeholder="AIzaSy..."
            />
          </label>

          <button
            type="button"
            onClick={handleSave}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-black text-white dark:bg-white dark:text-black px-5 py-4 font-bold uppercase tracking-wide transition hover:scale-105"
          >
            <Save className="w-5 h-5" />
            {saved ? "Saved!" : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}