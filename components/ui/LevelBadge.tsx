import type { CEFRLevel } from "@/lib/types";

const colors: Record<CEFRLevel, string> = {
  A1: "bg-moss/15 text-mossDark",
  A2: "bg-moss/25 text-mossDark",
  B1: "bg-ochre/20 text-[#8A6320]",
  B2: "bg-ochre/30 text-[#8A6320]",
  C1: "bg-clay/15 text-clay",
  C2: "bg-clay/25 text-clay",
};

export function LevelBadge({ level }: { level: CEFRLevel }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-sm px-1.5 py-0.5 text-xs font-semibold tracking-wide ${colors[level]}`}
    >
      {level}
    </span>
  );
}
