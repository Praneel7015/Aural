"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShieldX, PhoneOff, Phone, Flag } from "lucide-react";

type Props = {
  visible: boolean;
  score: number;
  reasons: string[];
  onDismiss: () => void;
};

export function ScamOverlay({ visible, score, reasons, onDismiss }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="flex w-full max-w-md flex-col items-center rounded-2xl border border-trust-danger/40 bg-card p-5 sm:p-8"
          >
            {/* Pulsing icon */}
            <div className="relative mb-6">
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-trust-danger/20"
              />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-trust-danger/10">
                <ShieldX className="h-10 w-10 text-trust-danger" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-trust-danger">
              SCAM DETECTED
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              This call shows strong indicators of a scam. Do not share personal
              information or send money.
            </p>

            {/* Trust score */}
            <div className="mt-5 flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Trust Score
              </span>
              <span className="font-[family-name:var(--font-mono)] text-2xl font-bold text-trust-danger">
                {score}
              </span>
            </div>

            {/* Reasons */}
            {reasons.length > 0 && (
              <div className="mt-5 w-full rounded-lg border border-trust-danger/30 bg-trust-danger/10 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-trust-danger">
                  Red Flags
                </p>
                <ul className="flex flex-col gap-1.5">
                  {reasons.map((r) => (
                    <li key={r} className="text-sm text-foreground-secondary">
                      <span className="mr-2 text-trust-danger">--</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-6 flex w-full flex-col gap-2.5">
              <button
                type="button"
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-trust-danger px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                onClick={onDismiss}
              >
                <PhoneOff className="h-4 w-4" />
                Hang Up Now
              </button>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  onClick={onDismiss}
                >
                  <Phone className="h-3.5 w-3.5" />
                  Call Back Official
                </button>
                <button
                  type="button"
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  onClick={onDismiss}
                >
                  <Flag className="h-3.5 w-3.5" />
                  Report
                </button>
              </div>
            </div>

            <button
              type="button"
              className="mt-4 cursor-pointer text-xs text-muted-foreground transition-colors hover:text-foreground"
              onClick={onDismiss}
            >
              Dismiss warning
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
