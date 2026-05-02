import { NextResponse } from "next/server";

export const runtime = "nodejs";
/** Seconds — raise on hosts that allow long serverless runs (local `next dev` ignores many caps). */
export const maxDuration = 300;

function backendBase(): string {
  const u =
    process.env.AURAL_BACKEND_URL ??
    process.env.BACKEND_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://127.0.0.1:8000";
  return u.replace(/\/$/, "");
}

/** Milliseconds for Node fetch to the FastAPI `/upload` handler. CPU + cold models often need several minutes. */
function uploadProxyTimeoutMs(): number {
  const raw = process.env.AURAL_UPLOAD_PROXY_TIMEOUT_MS?.trim();
  if (raw === "0" || raw?.toLowerCase() === "none") return 0;
  const parsed = raw ? Number(raw) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
  return 900_000; // 15 minutes default
}

export async function POST(req: Request) {
  let fd: FormData;
  try {
    fd = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid_multipart", detail: "Could not read form data." }, { status: 400 });
  }

  const url = `${backendBase()}/upload`;
  const timeoutMs = uploadProxyTimeoutMs();
  const signal = timeoutMs > 0 ? AbortSignal.timeout(timeoutMs) : undefined;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      body: fd,
      ...(signal ? { signal } : {}),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const timedOut = /aborted|timeout/i.test(msg);
    return NextResponse.json(
      {
        error: "backend_unreachable",
        detail: msg,
        hint: timedOut
          ? `Upload/analysis exceeded the proxy wait limit (${timeoutMs || "unlimited"} ms). Set AURAL_UPLOAD_PROXY_TIMEOUT_MS to a larger value (ms), or 0 to disable. Ensure the API is running.`
          : "Start the Aural FastAPI server (port 8000 by default) or set AURAL_BACKEND_URL / NEXT_PUBLIC_API_URL to the correct base URL.",
      },
      { status: 503 },
    );
  }

  const text = await res.text();
  const ct = res.headers.get("content-type") ?? "application/json";
  return new NextResponse(text, { status: res.status, headers: { "Content-Type": ct } });
}
