"use client";
import { Volume2 } from "lucide-react";
import { speak, ttsSupported } from "@/lib/tts";

export function SpeakButton({
  text,
  accent,
  size = 18,
  label,
}: {
  text: string;
  accent: "en-US" | "en-GB";
  size?: number;
  label?: string;
}) {
  if (!ttsSupported()) return null;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        speak(text, accent);
      }}
      aria-label={label || `Phát âm ${text}`}
      title={accent === "en-US" ? "Nghe giọng Anh-Mỹ" : "Nghe giọng Anh-Anh"}
      className="inline-flex items-center justify-center rounded-full p-1.5 text-moss hover:bg-moss/10 transition-colors"
    >
      <Volume2 size={size} />
    </button>
  );
}
