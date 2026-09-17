"use client";

import { useEffect, useState } from "react";
import { BookOpen, GraduationCap, BarChart3 } from "lucide-react";
import { getAccent, setAccent } from "@/lib/db";
import WordsTab from "@/components/WordsTab";
import PracticeTab from "@/components/PracticeTab";
import StatsTab from "@/components/StatsTab";

type TabKey = "words" | "practice" | "stats";

const TABS: { key: TabKey; label: string; icon: typeof BookOpen }[] = [
  { key: "words", label: "Quản lý từ", icon: BookOpen },
  { key: "practice", label: "Ôn tập", icon: GraduationCap },
  { key: "stats", label: "Thống kê", icon: BarChart3 },
];

export default function Home() {
  const [tab, setTab] = useState<TabKey>("words");
  const [accent, setAccentState] = useState<"en-US" | "en-GB">("en-US");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getAccent().then((a) => {
      setAccentState(a);
      setReady(true);
    });
  }, []);

  async function toggleAccent() {
    const next = accent === "en-US" ? "en-GB" : "en-US";
    setAccentState(next);
    await setAccent(next);
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink/50">
        Đang tải...
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-paper/95 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex items-center justify-between py-4">
            <h1 className="font-serif text-2xl sm:text-[28px] text-ink">
              Từ Vựng
            </h1>
            <button
              onClick={toggleAccent}
              className="flex items-center gap-2 rounded border border-line px-3 py-1.5 text-sm text-ink/70 hover:border-ink/40 hover:text-ink transition-colors"
              title="Đổi giọng đọc phát âm"
            >
              <span className="text-base leading-none">
                {accent === "en-US" ? "🇺🇸" : "🇬🇧"}
              </span>
              <span>{accent === "en-US" ? "Anh - Mỹ" : "Anh - Anh"}</span>
            </button>
          </div>
          <nav className="flex gap-1 -mb-px">
            {TABS.map(({ key, label, icon: Icon }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    active
                      ? "border-moss text-moss"
                      : "border-transparent text-ink/55 hover:text-ink"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-6 pb-16">
        {tab === "words" && <WordsTab />}
        {tab === "practice" && <PracticeTab accent={accent} />}
        {tab === "stats" && <StatsTab />}
      </main>
    </div>
  );
}
