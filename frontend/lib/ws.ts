import type { TrustState } from "@/lib/types";

export function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}

/** Same-origin upload — proxied by `app/api/upload` to the FastAPI backend. Avoids browser CORS/mixed-content pitfalls. */
export function uploadEndpoint(): string {
  return "/api/upload";
}

export function wsStreamUrl(settings?: { provider: string; openaiKey: string; geminiKey: string }): string {
  const base = apiBase();
  let url = base.replace(/^http/, "ws") + "/ws/stream";
  if (settings) {
    const params = new URLSearchParams();
    if (settings.provider) params.append("provider", settings.provider);
    if (settings.openaiKey) params.append("openai_key", settings.openaiKey);
    if (settings.geminiKey) params.append("gemini_key", settings.geminiKey);
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }
  return url;
}

export function openTrustSocket(
  handlers: {
    onTrust: (t: TrustState) => void;
    onOpen?: () => void;
    onClose?: () => void;
    onError?: (e: Event) => void;
  },
  settings?: { provider: string; openaiKey: string; geminiKey: string }
): WebSocket {
  const ws = new WebSocket(wsStreamUrl(settings));
  ws.onopen = () => handlers.onOpen?.();
  ws.onclose = () => handlers.onClose?.();
  ws.onerror = (e) => handlers.onError?.(e);
  ws.onmessage = (ev) => {
    try {
      const data = JSON.parse(ev.data as string) as TrustState;
      handlers.onTrust(data);
    } catch {
      /* ignore */
    }
  };
  return ws;
}

export function sendPcmChunk(ws: WebSocket | null, payload: { type: string; data: string }) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}
