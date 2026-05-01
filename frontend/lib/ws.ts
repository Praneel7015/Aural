import type { TrustState } from "@/lib/types";

export function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}

export function wsStreamUrl(): string {
  const base = apiBase();
  return base.replace(/^http/, "ws") + "/ws/stream";
}

export function openTrustSocket(handlers: {
  onTrust: (t: TrustState) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (e: Event) => void;
}): WebSocket {
  const ws = new WebSocket(wsStreamUrl());
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
