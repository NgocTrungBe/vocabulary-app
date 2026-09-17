"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { CEFR_LEVELS, type CEFRLevel } from "@/lib/types";
import { LevelBadge } from "@/components/ui/LevelBadge";

export default function StatsTab() {
  const words = useLiveQuery(() => db.words.toArray(), [], []);
  const statuses = useLiveQuery(() => db.topicStatus.toArray(), [], []);
  const progress = useLiveQuery(() => db.progress.toArray(), [], []);

  const total = words?.length || 0;

  const byLevel = useMemo(() => {
    const map: Record<CEFRLevel, number> = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
    for (const w of words || []) map[w.level]++;
    return map;
  }, [words]);

  const topics = useMemo(() => {
    const map = new Map<string, number>();
    for (const w of words || []) map.set(w.topic, (map.get(w.topic) || 0) + 1);
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], "vi"));
  }, [words]);

  const masteredWordIds = useMemo(() => {
    const ids = new Set<number>();
    for (const p of progress || []) {
      if (p.mastered) ids.add(p.wordId);
    }
    return ids;
  }, [progress]);

  const maxLevelCount = Math.max(1, ...CEFR_LEVELS.map((l) => byLevel[l]));

  function statusFor(topic: string, dir: "en-vi" | "vi-en") {
    return statuses?.find((s) => s.topic === topic && s.direction === dir)?.completed ?? false;
  }

  if (total === 0) {
    return <p className="text-ink/50 text-sm py-8 text-center">Chưa có dữ liệu để thống kê. Hãy thêm từ vựng trước.</p>;
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Tổng số từ" value={total} />
        <StatCard label="Chủ đề" value={topics.length} />
        <StatCard label="Đã ghi nhớ đúng gần nhất" value={masteredWordIds.size} />
        <StatCard
          label="Chủ đề hoàn thành"
          value={new Set((statuses || []).filter((s) => s.completed).map((s) => s.topic)).size}
        />
      </section>

      <section>
        <h2 className="font-serif text-lg text-ink mb-3">Số từ theo trình độ CEFR</h2>
        <div className="space-y-2">
          {CEFR_LEVELS.map((level) => (
            <div key={level} className="flex items-center gap-3">
              <div className="w-8"><LevelBadge level={level} /></div>
              <div className="flex-1 h-5 bg-ink/5 rounded overflow-hidden">
                <div
                  className="h-full bg-moss/70 rounded"
                  style={{ width: `${(byLevel[level] / maxLevelCount) * 100}%` }}
                />
              </div>
              <span className="w-8 text-right text-sm text-ink/60 tabular-nums">{byLevel[level]}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-lg text-ink mb-3">Tiến độ theo chủ đề</h2>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-ink/50 border-b border-line">
                <th className="py-2 pr-3 font-medium">Chủ đề</th>
                <th className="py-2 px-3 font-medium text-center">Số từ</th>
                <th className="py-2 px-3 font-medium text-center">Anh → Việt</th>
                <th className="py-2 pl-3 font-medium text-center">Việt → Anh</th>
              </tr>
            </thead>
            <tbody>
              {topics.map(([topic, count]) => (
                <tr key={topic} className="border-b border-line/60">
                  <td className="py-2 pr-3 text-ink">{topic}</td>
                  <td className="py-2 px-3 text-center text-ink/60">{count}</td>
                  <td className="py-2 px-3 text-center">
                    {statusFor(topic, "en-vi") ? <span className="text-moss">✓</span> : <span className="text-ink/25">—</span>}
                  </td>
                  <td className="py-2 pl-3 text-center">
                    {statusFor(topic, "vi-en") ? <span className="text-moss">✓</span> : <span className="text-ink/25">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line bg-white/50 p-3">
      <p className="font-serif text-2xl text-ink tabular-nums">{value}</p>
      <p className="text-xs text-ink/50 mt-0.5">{label}</p>
    </div>
  );
}
