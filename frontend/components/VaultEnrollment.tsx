"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

import { apiBase } from "@/lib/ws";
import { recordSecondsAsWav } from "@/lib/audio-capture";

const RELATIONSHIPS = ["son", "daughter", "mother", "father", "spouse", "friend", "other"];

export function VaultEnrollment() {
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("son");
  const [recording, setRecording] = useState(false);
  const [tick, setTick] = useState(0);
  const [contacts, setContacts] = useState<{ id: number; name: string; relationship: string }[]>([]);
  const [msg, setMsg] = useState<{ text: string; type: "info" | "error" } | null>(null);

  const refresh = useCallback(async () => {
    const r = await fetch(`${apiBase()}/api/vault/contacts`);
    if (!r.ok) return;
    const j = (await r.json()) as { contacts: typeof contacts };
    setContacts(j.contacts);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function enroll() {
    setMsg(null);
    if (!name.trim()) { setMsg({ text: "Enter a display name.", type: "error" }); return; }
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
        const errMsg = typeof d === "string" ? d : Array.isArray(d) ? d.map((x: { msg?: string }) => x.msg ?? "").join("; ") : "Enrollment failed";
        setMsg({ text: errMsg || "Enrollment failed", type: "error" });
        return;
      }
      setName("");
      await refresh();
      setMsg({ text: "Voice enrolled successfully.", type: "info" });
    } catch { setMsg({ text: "Microphone or network error.", type: "error" }); }
    finally { setRecording(false); setTick(0); }
  }

  async function remove(id: number) {
    await fetch(`${apiBase()}/api/vault/contacts/${id}`, { method: "DELETE" });
    await refresh();
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8">
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-foreground">Enroll contact</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Record 30 seconds of a family member&apos;s voice to add them to the vault.
        </p>
        <div className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-ring"
              placeholder="e.g. Aarav"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Relationship</span>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="cursor-pointer rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-ring"
            >
              {RELATIONSHIPS.map((r) => (<option key={r} value={r}>{r}</option>))}
            </select>
          </label>
          <button
            type="button"
            disabled={recording}
            onClick={() => void enroll()}
            className={`mt-1 cursor-pointer rounded-md px-4 py-3 text-sm font-semibold transition-colors ${
              recording ? "bg-muted text-muted-foreground" : "bg-foreground text-background hover:opacity-90"
            }`}
          >
            {recording ? `Recording... ${tick}s remaining` : "Record 30 seconds"}
          </button>
          {msg && (
            <p className={`text-sm ${msg.type === "error" ? "text-trust-danger" : "text-trust-safe"}`}>
              {msg.text}
            </p>
          )}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Enrolled contacts ({contacts.length})
        </h3>
        <div className="flex flex-col gap-2">
          {contacts.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.relationship}</p>
              </div>
              <button
                type="button"
                onClick={() => void remove(c.id)}
                className="cursor-pointer rounded-md p-2 text-muted-foreground transition-colors hover:bg-trust-danger/10 hover:text-trust-danger"
                aria-label={`Remove ${c.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {!contacts.length && (
            <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              No enrolled voices yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
