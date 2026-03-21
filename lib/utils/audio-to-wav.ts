type WindowWithAudioContext = Window & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

export async function blobToWav(blob: Blob): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  const Win = typeof window !== "undefined" ? (window as WindowWithAudioContext) : null;
  const Ctor = Win?.AudioContext ?? Win?.webkitAudioContext;
  if (!Ctor) throw new Error("AudioContext not supported");
  const audioContext = new Ctor();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));

  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length * numChannels * 2;
  const buffer = new ArrayBuffer(44 + length);
  const view = new DataView(buffer);
  const offset = 44;

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + length, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, length, true);

  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(audioBuffer.getChannelData(c));
  }
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let c = 0; c < numChannels; c++) {
      const s = Math.max(-1, Math.min(1, channels[c][i]));
      const v = s < 0 ? s * 0x8000 : s * 0x7fff;
      view.setInt16(offset + (i * numChannels + c) * 2, v, true);
    }
  }

  await audioContext.close();
  return new Blob([buffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
