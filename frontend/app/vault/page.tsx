import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { VaultEnrollment } from "@/components/VaultEnrollment";

export default function VaultPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-3">
          <Link href="/" className="font-[family-name:var(--font-brand)] text-base font-semibold tracking-tight text-foreground">
            Verity
          </Link>
          <div className="h-4 w-px bg-border" />
          <Link
            href="/dashboard"
            className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" aria-hidden />
            Dashboard
          </Link>
          <div className="h-4 w-px bg-border" />
          <span className="text-xs font-medium text-muted-foreground">Voice Vault</span>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <VaultEnrollment />
      </main>
    </div>
  );
}
