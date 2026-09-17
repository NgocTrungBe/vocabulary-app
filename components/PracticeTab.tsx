"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { CheckCircle2, XCircle, RotateCcw, ArrowLeft } from "lucide-react";
import { db, recordAnswer, markTopicComplete } from "@/lib/db";
import type { Direction, Word } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { LevelBadge } from "@/components/ui/LevelBadge";
import { SpeakButton } from "@/components/ui/SpeakButton";

const ALL_TOPICS_KEY = "__ALL__";

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ").replace(/[.,!?;:'"]+$/g, "");
}

function isCorrect(userInput: string, targetField: string): boolean {
  const candidates = targetField.split("/").map((c) => normalize(c));
  return candidates.includes(normalize(userInput));
}

type Phase = "setup" | "session" | "done";

interface SessionState {
  topic: string;
  direction: Direction;
  queue: number[];
  wrongIds: Set<number>;
  current: Word | null;
  feedback: "correct" | "wrong" | null;
  answered: number;
}

export default function PracticeTab({ accent }: { accent: "en-US" | "en-GB" }) {
  const words = useLiveQuery(() => db.words.toArray(), [], []);
  const statuses = useLiveQuery(() => db.topicStatus.toArray(), [], []);

  const topicList = useMemo(() => {
    const set = new Set<string>();
    for (const w of words || []) set.add(w.topic);
    return Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
  }, [words]);

  const [phase, setPhase] = useState<Phase>("setup");
  const [selectedTopic, setSelectedTopic] = useState<string>(ALL_TOPICS_KEY);
  const [direction, setDirection] = useState<Direction>("en-vi");
  const [session, setSession] = useState<SessionState | null>(null);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (phase === "session") inputRef.current?.focus();
  }, [phase, session?.current?.id]);

  function statusFor(topic: string, dir: Direction) {
    return statuses?.find((s) => s.topic === topic && s.direction === dir)?.completed ?? false;
  }

  function startSession() {
    const pool =
      selectedTopic === ALL_TOPICS_KEY
        ? words || []
        : (words || []).filter((w) => w.topic === selectedTopic);
    if (pool.length === 0) return;
    const ids = pool.map((w) => w.id!);
    shuffle(ids);
    const byId = new Map(pool.map((w) => [w.id!, w]));
    const firstId = ids.shift()!;
    setSession({
      topic: selectedTopic,
      direction,
      queue: ids,
      wrongIds: new Set(),
      current: byId.get(firstId) || null,
      feedback: null,
      answered: 0,
    });
    (window as any).__wordsById = byId; // simple lookup cache for this session
    setInput("");
    setPhase("session");
  }

  function nextWord(state: SessionState): SessionState {
    const byId: Map<number, Word> = (window as any).__wordsById;
    const queue = [...state.queue];
    const nextId = queue.shift();
    return {
      ...state,
      queue,
      current: nextId != null ? byId.get(nextId) || null : null,
      feedback: null,
    };
  }

  async function submitAnswer() {
    if (!session || !session.current || !input.trim()) return;
    const word = session.current;
    const target = session.direction === "en-vi" ? word.vi : word.en;
    const correct = isCorrect(input, target);
    await recordAnswer(word.id!, session.direction, correct);

    setSession((s) => {
      if (!s) return s;
      const wrongIds = new Set(s.wrongIds);
      let queue = [...s.queue];
      if (correct) {
        // done with this word for now
      } else {
        wrongIds.add(word.id!);
        queue.push(word.id!); // requeue for retry
      }
      return { ...s, wrongIds, queue, feedback: correct ? "correct" : "wrong", answered: s.answered + 1 };
    });
    setInput("");
  }

  function proceedAfterFeedback() {
    setSession((s) => {
      if (!s) return s;
      if (s.queue.length === 0 && s.feedback === "correct") {
        // finished — mark complete
        markTopicComplete(s.topic, s.direction);
        setPhase("done");
        return s;
      }
      return nextWord(s);
    });
  }

  if (phase === "setup") {
    return (
      <div className="space-y-6 max-w-lg">
        <div>
          <h2 className="font-serif text-xl text-ink mb-3">Chọn nội dung ôn tập</h2>
          <div className="space-y-1">
            <label className="text-xs font-medium text-ink/60">Chủ đề</label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="input"
            >
              <option value={ALL_TOPICS_KEY}>🔀 Tất cả (lộn xộn)</option>
              {topicList.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-ink/60">Chiều ôn tập</label>
          <div className="flex gap-2">
            <DirectionOption
              active={direction === "en-vi"}
              onClick={() => setDirection("en-vi")}
              label="Anh → Việt"
              sub="Nhìn từ tiếng Anh, đoán nghĩa tiếng Việt"
            />
            <DirectionOption
              active={direction === "vi-en"}
              onClick={() => setDirection("vi-en")}
              label="Việt → Anh"
              sub="Nhìn nghĩa tiếng Việt, đoán từ tiếng Anh"
            />
          </div>
        </div>

        {selectedTopic !== ALL_TOPICS_KEY && (
          <p className="text-sm text-ink/60">
            Trạng thái: {statusFor(selectedTopic, direction) ? (
              <span className="text-moss font-medium">Đã hoàn thành ✓</span>
            ) : (
              <span>Chưa hoàn thành</span>
            )}
          </p>
        )}

        <Button onClick={startSession} disabled={!words || words.length === 0}>
          Bắt đầu ôn tập
        </Button>
        {(!words || words.length === 0) && (
          <p className="text-sm text-ink/50">Chưa có từ vựng nào. Hãy thêm từ ở tab "Quản lý từ" trước.</p>
        )}

        <style jsx global>{`
          .input {
            width: 100%;
            border: 1px solid #CBCABF;
            border-radius: 6px;
            padding: 0.5rem 0.7rem;
            font-size: 0.9rem;
            background: white;
            color: #1C2B39;
          }
          .input:focus {
            outline: 2px solid #2F6F62;
            outline-offset: 1px;
          }
        `}</style>
      </div>
    );
  }

  if (phase === "done" && session) {
    return (
      <div className="max-w-lg space-y-5 text-center py-10">
        <CheckCircle2 className="mx-auto text-moss" size={48} />
        <h2 className="font-serif text-2xl text-ink">Hoàn thành 100%!</h2>
        <p className="text-ink/60">
          Chủ đề <span className="font-medium text-ink">{session.topic === ALL_TOPICS_KEY ? "Tất cả" : session.topic}</span>{" "}
          ({session.direction === "en-vi" ? "Anh → Việt" : "Việt → Anh"}) đã được đánh dấu hoàn thành.
        </p>
        <p className="text-sm text-ink/50">
          Bạn đã trả lời sai {session.wrongIds.size} từ trong lúc ôn (đã ôn lại đến khi đúng).
        </p>
        <div className="flex justify-center gap-3">
          <Button variant="secondary" onClick={() => setPhase("setup")}>
            <span className="inline-flex items-center gap-1.5"><ArrowLeft size={16} /> Chọn chủ đề khác</span>
          </Button>
          <Button onClick={startSession}>
            <span className="inline-flex items-center gap-1.5"><RotateCcw size={16} /> Ôn lại</span>
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "session" && session?.current) {
    const word = session.current;
    const prompt = session.direction === "en-vi" ? word.en : word.vi;
    const promptAccent = session.direction === "en-vi";
    const remaining = session.queue.length + 1;
    const target = session.direction === "en-vi" ? word.vi : word.en;

    return (
      <div className="max-w-lg space-y-6">
        <div className="flex items-center justify-between text-sm text-ink/50">
          <span>{session.topic === ALL_TOPICS_KEY ? "Tất cả" : session.topic} · {session.direction === "en-vi" ? "Anh → Việt" : "Việt → Anh"}</span>
          <span>Còn lại: {remaining}</span>
        </div>

        <div className="rounded-lg border border-line bg-white/60 p-8 text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <span className="font-serif text-3xl text-ink">{prompt}</span>
            {promptAccent && <SpeakButton text={prompt} accent={accent} size={22} />}
          </div>
          {promptAccent && word.phonetic && <p className="text-ink/40">{word.phonetic}</p>}
          <LevelBadge level={word.level} />
        </div>

        {session.feedback == null ? (
          <form
            onSubmit={(e) => { e.preventDefault(); submitAnswer(); }}
            className="space-y-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={session.direction === "en-vi" ? "Nhập nghĩa tiếng Việt..." : "Nhập từ tiếng Anh..."}
              className="input text-center text-lg"
              autoComplete="off"
              autoFocus
            />
            <Button type="submit" className="w-full" disabled={!input.trim()}>
              Kiểm tra
            </Button>
          </form>
        ) : (
          <div className="space-y-3">
            <div
              className={`rounded-lg p-4 flex items-center gap-3 ${
                session.feedback === "correct" ? "bg-moss/10 text-mossDark" : "bg-clay/10 text-clay"
              }`}
            >
              {session.feedback === "correct" ? <CheckCircle2 size={22} /> : <XCircle size={22} />}
              <div>
                <p className="font-medium">{session.feedback === "correct" ? "Chính xác!" : "Chưa đúng"}</p>
                <p className="text-sm opacity-80">Đáp án: {target}</p>
              </div>
            </div>
            <Button className="w-full" onClick={proceedAfterFeedback} autoFocus>
              Tiếp tục
            </Button>
          </div>
        )}
      </div>
    );
  }

  return null;
}

function DirectionOption({
  active,
  onClick,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sub: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 text-left rounded-lg border p-3 transition-colors ${
        active ? "border-moss bg-moss/5" : "border-line hover:border-ink/30"
      }`}
    >
      <p className={`font-medium ${active ? "text-mossDark" : "text-ink"}`}>{label}</p>
      <p className="text-xs text-ink/50 mt-0.5">{sub}</p>
    </button>
  );
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
