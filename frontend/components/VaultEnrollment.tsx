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
      <div className="flex flex-col gap-4 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-6">
        <h2 className="font-display text-2xl font-bold text-black dark:text-white">
          Enroll contact
        </h2>
        <label className="flex flex-col gap-2 text-sm font-bold text-black/60 dark:text-white/60">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-black/20 dark:border-white/20 bg-white dark:bg-black px-4 py-3 text-black dark:text-white outline-none transition focus:ring-2 focus:ring-black dark:focus:ring-white"
            placeholder="e.g. Aarav"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-bold text-black/60 dark:text-white/60">
          Relationship
          <select
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            className="rounded-md border border-black/20 dark:border-white/20 bg-white dark:bg-black px-4 py-3 text-black dark:text-white outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
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
            "rounded-md px-5 py-4 font-bold uppercase tracking-wide transition",
            recording
              ? "cursor-wait bg-black/10 dark:bg-white/10 text-black/50 dark:text-white/50"
              : "bg-black text-white dark:bg-white dark:text-black hover:scale-105",
          )}
        >
          {recording ? `Recording… ${tick}s` : "Record 30 seconds"}
        </button>
        {msg ? <p className="text-sm font-bold text-black/60 dark:text-white/60">{msg}</p> : null}
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="font-display text-xl font-bold text-black dark:text-white">
          Vault
        </h3>
        <ul className="flex flex-col gap-2">
          {contacts.map((c) => (
            <li
              key={c.id}
              className="flex flex-row items-center justify-between gap-4 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-4 py-3"
            >
              <div className="flex flex-col">
                <span className="font-bold text-black dark:text-white">{c.name}</span>
                <span className="text-xs font-bold uppercase tracking-wide text-black/60 dark:text-white/60">
                  {c.relationship}
                </span>
              </div>
              <button
                type="button"
                onClick={() => void remove(c.id)}
                className="rounded-md border border-rose-500/30 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
              >
                Remove
              </button>
            </li>
          ))}
          {!contacts.length ? (
            <li className="rounded-lg border border-dashed border-black/20 dark:border-white/20 px-4 py-8 text-center text-sm font-bold text-black/60 dark:text-white/60">
              No enrolled voices yet.
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
