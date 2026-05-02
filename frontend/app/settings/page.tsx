"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Plus, Trash2, Phone, Bell, Globe } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { apiBase } from "@/lib/ws";

type EmergencyContact = {
  id: string;
  name: string;
  phone: string;
  relationship: string;
};

const STORAGE_KEY = "verity-emergency-contacts";
const LANG_KEY = "verity-language";

function loadContacts(): EmergencyContact[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveContacts(contacts: EmergencyContact[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
}

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "es", name: "Spanish" },
  { code: "ta", name: "Tamil" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "ja", name: "Japanese" },
  { code: "auto", name: "Auto-detect" },
];

export default function SettingsPage() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("family");
  const [language, setLanguage] = useState("en");
  const [alertOnScam, setAlertOnScam] = useState(true);
  const [langMsg, setLangMsg] = useState("");

  useEffect(() => {
    setContacts(loadContacts());
    const saved = localStorage.getItem(LANG_KEY);
    if (saved) setLanguage(saved);
    const alert = localStorage.getItem("verity-alert-on-scam");
    if (alert !== null) setAlertOnScam(alert === "true");
  }, []);

  function addContact() {
    if (!name.trim() || !phone.trim()) return;
    const c: EmergencyContact = {
      id: Date.now().toString(36),
      name: name.trim(),
      phone: phone.trim(),
      relationship,
    };
    const updated = [...contacts, c];
    setContacts(updated);
    saveContacts(updated);
    setName("");
    setPhone("");
  }

  function removeContact(id: string) {
    const updated = contacts.filter((c) => c.id !== id);
    setContacts(updated);
    saveContacts(updated);
  }

  const changeLang = useCallback(async (lang: string) => {
    setLanguage(lang);
    localStorage.setItem(LANG_KEY, lang);
    try {
      await fetch(`${apiBase()}/language/${lang}`, { method: "POST" });
      setLangMsg(`Language set to ${LANGUAGES.find((l) => l.code === lang)?.name}`);
      setTimeout(() => setLangMsg(""), 2000);
    } catch {
      setLangMsg("Backend offline -- language saved locally");
      setTimeout(() => setLangMsg(""), 2000);
    }
  }, []);

  function toggleAlert() {
    const v = !alertOnScam;
    setAlertOnScam(v);
    localStorage.setItem("verity-alert-on-scam", String(v));
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-[family-name:var(--font-brand)] text-base font-semibold tracking-tight text-foreground">
              Verity
            </Link>
            <div className="h-4 w-px bg-border" />
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="h-3 w-3" />
              Dashboard
            </Link>
            <div className="h-4 w-px bg-border" />
            <span className="text-xs font-medium text-muted-foreground">Settings</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Language */}
        <section className="mb-8">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base font-semibold text-foreground">Language</h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Set the transcription language for audio analysis. Whisper supports 100+ languages.
            </p>
            <select
              value={language}
              onChange={(e) => void changeLang(e.target.value)}
              className="w-full cursor-pointer rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-ring"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>
            {langMsg && <p className="mt-2 text-xs text-trust-safe">{langMsg}</p>}
          </div>
        </section>

        {/* Alerts */}
        <section className="mb-8">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base font-semibold text-foreground">Alerts</h2>
            </div>
            <label className="flex cursor-pointer items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Full-screen scam alert</p>
                <p className="text-xs text-muted-foreground">Show emergency overlay when scam is detected</p>
              </div>
              <button
                type="button"
                onClick={toggleAlert}
                className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
                  alertOnScam ? "bg-trust-safe" : "bg-border"
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    alertOnScam ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </label>
          </div>
        </section>

        {/* Emergency contacts */}
        <section>
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base font-semibold text-foreground">Emergency Contacts</h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              People to notify when a scam is detected. They will be shown as quick-call options during an alert.
            </p>

            <div className="flex flex-col gap-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contact name"
                className="rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-ring"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                type="tel"
                className="rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-ring"
              />
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="cursor-pointer rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-ring"
              >
                {["family", "friend", "neighbor", "caregiver", "police"].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={addContact}
                disabled={!name.trim() || !phone.trim()}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
                Add Contact
              </button>
            </div>

            {contacts.length > 0 && (
              <div className="mt-5 flex flex-col gap-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Saved Contacts ({contacts.length})
                </p>
                {contacts.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.phone} -- {c.relationship}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeContact(c.id)}
                      className="cursor-pointer rounded-md p-2 text-muted-foreground transition-colors hover:bg-trust-danger/10 hover:text-trust-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
