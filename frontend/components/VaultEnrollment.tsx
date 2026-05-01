"use client";

import { useCallback, useEffect, useState } from "react";

import { apiBase } from "@/lib/ws";
import { recordSecondsAsWav } from "@/lib/audio-capture";
import { cn } from "@/lib/utils";

const REL = ["son", "daughter", "mother", "father", "spouse", "friend", "other"];

export function VaultEnrollment() {
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("son");
  const [recording, setRecording] = useState(false);
  const [tick, setTick] = useState(0);
  const [contacts, setContacts] = useState<{ id: number; name: string; relationship: string }[]>(
    [],
  );
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const r = await fetch(`${apiBase()}/api/vault/contacts`);
    if (!r.ok) return;
    const j = (await r.json()) as { contacts: typeof contacts };
    setContacts(j.contacts);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function enroll() {
    setMsg(null);
    if (!name.trim()) {
      setMsg("Add a display name.");
      return;
    }
    setRecording(true);
    try {
      const blob = await recordSecondsAsWav(30, (left) => setTick(Math.ceil(left)));
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("relationship", relationship);
      fd.append("audio", blob, "enroll.wav");
      const r = await fetch(`${apiBase()}/api/vault/enroll`, { method: "POST", body: fd });
      if (!r.ok) {
        const err = (await r.json().catch(() => ({}))) as { detail?: unknown };
        const d = err.detail;
        const msg =
          typeof d === "string"
            ? d
            : Array.isArray(d)
              ? d.map((x: { msg?: string }) => x.msg ?? "").join("; ")
              : "Enrollment failed";
        setMsg(msg || "Enrollment failed");
        return;
      }
      setName("");
      await refresh();
      setMsg("Voice enrolled.");
    } catch {
      setMsg("Microphone permission or network error.");
    } finally {
      setRecording(false);
      setTick(0);
    }
  }

  async function remove(id: number) {
    await fetch(`${apiBase()}/api/vault/contacts/${id}`, { method: "DELETE" });
    await refresh();
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8">
      <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--foreground)]">
          Enroll contact
        </h2>
        <label className="flex flex-col gap-2 text-sm text-[var(--muted)]">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-[var(--foreground)] outline-none ring-emerald-400/0 transition focus:ring-2 focus:ring-emerald-400/60"
            placeholder="e.g. Aarav"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[var(--muted)]">
          Relationship
          <select
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            className="rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-[var(--foreground)] outline-none focus:ring-2 focus:ring-emerald-400/60"
          >
            {REL.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={recording}
          onClick={() => void enroll()}
          className={cn(
            "rounded-xl px-5 py-4 font-semibold uppercase tracking-wide transition",
            recording
              ? "cursor-wait bg-white/10 text-[var(--muted)]"
              : "bg-[var(--trust-safe)] text-black hover:brightness-110 active:brightness-95",
          )}
        >
          {recording ? `Recording… ${tick}s` : "Record 30 seconds"}
        </button>
        {msg ? <p className="text-sm text-[var(--muted)]">{msg}</p> : null}
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--foreground)]">
          Vault
        </h3>
        <ul className="flex flex-col gap-2">
          {contacts.map((c) => (
            <li
              key={c.id}
              className="flex flex-row items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
            >
              <div className="flex flex-col">
                <span className="font-medium text-[var(--foreground)]">{c.name}</span>
                <span className="text-xs uppercase tracking-wide text-[var(--muted)]">
                  {c.relationship}
                </span>
              </div>
              <button
                type="button"
                onClick={() => void remove(c.id)}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-rose-200 hover:bg-rose-500/15"
              >
                Remove
              </button>
            </li>
          ))}
          {!contacts.length ? (
            <li className="rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center text-sm text-[var(--muted)]">
              No enrolled voices yet.
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
