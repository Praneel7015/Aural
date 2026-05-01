import Link from "next/link";

import { VaultEnrollment } from "@/components/VaultEnrollment";

export default function VaultPage() {
  return (
    <div className="relative min-h-screen px-4 pb-16 pt-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.12),transparent_55%)]" />
      <div className="relative mx-auto max-w-6xl">
        <div className="mb-10 flex flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--foreground)]">
              Family Voice Vault
            </h1>
            <p className="text-sm text-[var(--muted)]">
              Store embeddings locally on this machine for caller verification.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-white/10"
          >
            Dashboard
          </Link>
        </div>
        <VaultEnrollment />
      </div>
    </div>
  );
}
