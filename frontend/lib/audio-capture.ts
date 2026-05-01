function floatTo16BitPCM(output: Float32Array): Int16Array {
  const buf = new Int16Array(output.length);
  for (let i = 0; i < output.length; i++) {
    const s = Math.max(-1, Math.min(1, output[i]));
    buf[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return buf;
}

function downsampleBuffer(buffer: Float32Array, sampleRate: number, outSampleRate: number) {
  if (outSampleRate === sampleRate) return buffer;
  const sampleRateRatio = sampleRate / outSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = count ? accum / count : 0;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

function encodeChunkBase64(i16: Int16Array): string {
  const u8 = new Uint8Array(i16.buffer, i16.byteOffset, i16.byteLength);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < u8.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(u8.subarray(i, i + chunk)));
  }
  return btoa(binary);
}

export type MicSession = {
  stop: () => void;
};

export function startMicStreaming(
  wsSendJson: (payload: { type: string; data: string }) => void,
  onError?: (e: Error) => void,
): Promise<MicSession> {
  return navigator.mediaDevices
    .getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } })
    .then((stream) => {
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const bufferSize = 4096;
      const processor = ctx.createScriptProcessor(bufferSize, 1, 1);
      const mute = ctx.createGain();
      mute.gain.value = 0;
      processor.onaudioprocess = (ev) => {
        const input = ev.inputBuffer.getChannelData(0);
        const down = downsampleBuffer(input, ctx.sampleRate, 16000);
        const pcm = floatTo16BitPCM(down);
        wsSendJson({ type: "pcm16", data: encodeChunkBase64(pcm) });
      };
      source.connect(processor);
      processor.connect(mute);
      mute.connect(ctx.destination);
      return {
        stop: () => {
          processor.disconnect();
          mute.disconnect();
          source.disconnect();
          stream.getTracks().forEach((t) => t.stop());
          void ctx.close();
        },
      };
    })
    .catch((e) => {
      onError?.(e instanceof Error ? e : new Error(String(e)));
      throw e;
    });
}

export function float32ToWavBlob(samples: Float32Array, sampleRate: number): Blob {
  const pcm = floatTo16BitPCM(samples);
  const buffer = new ArrayBuffer(44 + pcm.byteLength);
  const view = new DataView(buffer);

  function writeString(off: number, s: string) {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  }

  writeString(0, "RIFF");
  view.setUint32(4, 36 + pcm.byteLength, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, pcm.byteLength, true);

  const out = new Uint8Array(buffer);
  out.set(new Uint8Array(pcm.buffer), 44);
  return new Blob([out], { type: "audio/wav" });
}

export async function recordSecondsAsWav(
  seconds: number,
  onTick?: (left: number) => void,
): Promise<Blob> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: true },
  });
  const ctx = new AudioContext();
  const inputSampleRate = ctx.sampleRate;
  const source = ctx.createMediaStreamSource(stream);
  const bufferSize = 4096;
  const processor = ctx.createScriptProcessor(bufferSize, 1, 1);
  const mute = ctx.createGain();
  mute.gain.value = 0;
  const chunks: Float32Array[] = [];
  processor.onaudioprocess = (ev) => {
    chunks.push(new Float32Array(ev.inputBuffer.getChannelData(0)));
  };
  source.connect(processor);
  processor.connect(mute);
  mute.connect(ctx.destination);

  const start = performance.now();
  await new Promise<void>((resolve) => {
    const iv = setInterval(() => {
      const elapsed = (performance.now() - start) / 1000;
      const left = Math.max(0, seconds - elapsed);
      onTick?.(left);
      if (elapsed >= seconds) {
        clearInterval(iv);
        resolve();
      }
    }, 100);
  });

  processor.disconnect();
  mute.disconnect();
  source.disconnect();
  stream.getTracks().forEach((t) => t.stop());
  await ctx.close();

  const total = chunks.reduce((a, c) => a + c.length, 0);
  const merged = new Float32Array(total);
  let off = 0;
  for (const c of chunks) {
    merged.set(c, off);
    off += c.length;
  }

  const down = downsampleBuffer(merged, inputSampleRate, 16000);
  return float32ToWavBlob(down, 16000);
}
