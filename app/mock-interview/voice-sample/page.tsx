"use client";

import { useEffect, useState } from "react";

const SAMPLE_TEXT =
  "Welcome to your mock interview. I'll be your interviewer today. Please take a moment to settle in, and we'll begin when you're ready. Tell me a bit about yourself and your background.";

export default function VoiceSamplePage() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => {
    const load = () => {
      const all = window.speechSynthesis.getVoices();
      setVoices(all.filter((v) => v.lang.startsWith("en")));
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const play = (voice: SpeechSynthesisVoice) => {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(SAMPLE_TEXT);
    utt.voice = voice;
    utt.rate = 0.95;
    utt.volume = 1.0;
    utt.onstart = () => setPlaying(voice.voiceURI);
    utt.onend = () => setPlaying(null);
    utt.onerror = () => setPlaying(null);
    window.speechSynthesis.resume();
    window.speechSynthesis.speak(utt);
  };

  return (
    <div style={{ maxWidth: 680, margin: "48px auto", padding: "0 24px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Voice Sampler</h1>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>
        All English voices on this device. Click Play to hear the interview opener.
      </p>

      {voices.length === 0 && <p style={{ color: "#9ca3af" }}>Loading voices...</p>}

      {voices.map((v) => (
        <div key={v.voiceURI} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "11px 16px", borderRadius: 8, marginBottom: 8,
          border: "1px solid #e5e7eb",
          background: playing === v.voiceURI ? "#eff6ff" : "#fff",
        }}>
          <div>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{v.name}</span>
            <span style={{ marginLeft: 8, fontSize: 12, color: "#9ca3af" }}>{v.lang}</span>
          </div>
          <button
            onClick={() => playing === v.voiceURI ? (window.speechSynthesis.cancel(), setPlaying(null)) : play(v)}
            style={{
              padding: "6px 14px", borderRadius: 6, border: "none",
              background: playing === v.voiceURI ? "#dc2626" : "#2563eb",
              color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 13,
            }}
          >
            {playing === v.voiceURI ? "Stop" : "Play"}
          </button>
        </div>
      ))}
    </div>
  );
}
