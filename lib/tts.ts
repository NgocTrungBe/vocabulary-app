"use client";

let cachedVoices: SpeechSynthesisVoice[] = [];

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  const voices = window.speechSynthesis.getVoices();
  if (voices.length) cachedVoices = voices;
  return cachedVoices;
}

if (typeof window !== "undefined" && window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = () => loadVoices();
}

function pickVoice(accent: "en-US" | "en-GB"): SpeechSynthesisVoice | undefined {
  const voices = loadVoices();
  const exact = voices.find((v) => v.lang === accent);
  if (exact) return exact;
  const prefix = accent.slice(0, 2);
  return voices.find((v) => v.lang.startsWith(prefix));
}

export function speak(text: string, accent: "en-US" | "en-GB" = "en-US") {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = accent;
  utterance.rate = 0.95;
  const voice = pickVoice(accent);
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

export function ttsSupported(): boolean {
  return typeof window !== "undefined" && !!window.speechSynthesis;
}
