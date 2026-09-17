"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Upload, ChevronDown, ChevronRight, Pencil, Trash2, X, Check } from "lucide-react";
import { db, addWord, addWordsBulk, updateWord, deleteWord, deleteTopic, renameTopic } from "@/lib/db";
import { CEFR_LEVELS, type CEFRLevel, type Word } from "@/lib/types";
import { parseImportText, groupsToWords, type ParseResult } from "@/lib/importParser";
import { SAMPLE_IMPORT_TEXT } from "@/lib/sampleData";
import { Button } from "@/components/ui/Button";
import { LevelBadge } from "@/components/ui/LevelBadge";

const emptyForm = {
  topic: "",
  en: "",
  vi: "",
  phonetic: "",
  level: "A1" as CEFRLevel,
  example: "",
};

export default function WordsTab() {
  const words = useLiveQuery(() => db.words.toArray(), [], []);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Word>>({});

  const topics = useMemo(() => {
    const map = new Map<string, Word[]>();
    for (const w of words || []) {
      if (!map.has(w.topic)) map.set(w.topic, []);
      map.get(w.topic)!.push(w);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], "vi"));
  }, [words]);

  const existingTopicNames = useMemo(() => topics.map(([t]) => t), [topics]);

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.topic.trim() || !form.en.trim() || !form.vi.trim()) return;
    await addWord({
      topic: form.topic.trim(),
      en: form.en.trim(),
      vi: form.vi.trim(),
      phonetic: form.phonetic.trim() || undefined,
      level: form.level,
      example: form.example.trim() || undefined,
    });
    setForm({ ...emptyForm, topic: form.topic });
  }

  function startEdit(w: Word) {
    setEditingId(w.id!);
    setEditForm({ ...w });
  }

  async function saveEdit() {
    if (editingId == null) return;
    await updateWord(editingId, {
      topic: (editForm.topic || "").trim(),
      en: (editForm.en || "").trim(),
      vi: (editForm.vi || "").trim(),
      phonetic: (editForm.phonetic || "").trim() || undefined,
      level: editForm.level as CEFRLevel,
      example: (editForm.example || "").trim() || undefined,
    });
    setEditingId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => { setShowAdd((v) => !v); setShowImport(false); }} size="sm">
          <span className="inline-flex items-center gap-1.5">
            <Plus size={16} /> Thêm từ
          </span>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => { setShowImport((v) => !v); setShowAdd(false); }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Upload size={16} /> Nhập nhiều từ
          </span>
        </Button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAddSubmit}
          className="rounded-lg border border-line bg-white/60 p-4 space-y-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Chủ đề">
              <input
                list="topic-names"
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                placeholder="ví dụ: Du lịch"
                className="input"
                required
              />
              <datalist id="topic-names">
                {existingTopicNames.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </Field>
            <Field label="Trình độ (CEFR)">
              <select
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value as CEFRLevel })}
                className="input"
              >
                {CEFR_LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </Field>
            <Field label="Từ / cụm từ tiếng Anh">
              <input
                value={form.en}
                onChange={(e) => setForm({ ...form, en: e.target.value })}
                placeholder="airport"
                className="input"
                required
              />
            </Field>
            <Field label="Nghĩa tiếng Việt">
              <input
                value={form.vi}
                onChange={(e) => setForm({ ...form, vi: e.target.value })}
                placeholder="sân bay"
                className="input"
                required
              />
            </Field>
            <Field label="Phiên âm (không bắt buộc)">
              <input
                value={form.phonetic}
                onChange={(e) => setForm({ ...form, phonetic: e.target.value })}
                placeholder="/ˈeəpɔːt/"
                className="input"
              />
            </Field>
            <Field label="Câu ví dụ (không bắt buộc)">
              <input
                value={form.example}
                onChange={(e) => setForm({ ...form, example: e.target.value })}
                placeholder="We arrived at the airport early."
                className="input"
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="submit" size="sm">Lưu từ</Button>
          </div>
        </form>
      )}

      {showImport && <ImportPanel existingTopics={existingTopicNames} onClose={() => setShowImport(false)} />}

      <div className="space-y-3">
        {topics.length === 0 && (
          <div className="text-center py-8 space-y-3">
            <p className="text-ink/50 text-sm">
              Chưa có từ nào. Thêm từ đầu tiên hoặc nhập nhiều từ cùng lúc ở trên.
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                const { groups } = parseImportText(SAMPLE_IMPORT_TEXT, "Chưa phân loại");
                await addWordsBulk(groupsToWords(groups));
              }}
            >
              Nhập dữ liệu mẫu để dùng thử
            </Button>
          </div>
        )}
        {topics.map(([topic, list]) => {
          const isCollapsed = collapsed[topic];
          const levelCounts = CEFR_LEVELS.map((l) => ({
            level: l,
            count: list.filter((w) => w.level === l).length,
          })).filter((x) => x.count > 0);

          return (
            <div key={topic} className="rounded-lg border border-line overflow-hidden">
              <button
                onClick={() => setCollapsed((c) => ({ ...c, [topic]: !c[topic] }))}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white/40 hover:bg-white/70 transition-colors text-left"
              >
                <span className="flex items-center gap-2 min-w-0">
                  {isCollapsed ? <ChevronRight size={16} className="shrink-0 text-ink/40" /> : <ChevronDown size={16} className="shrink-0 text-ink/40" />}
                  <span className="font-serif text-lg text-ink truncate">{topic}</span>
                  <span className="text-ink/40 text-sm shrink-0">({list.length} từ)</span>
                </span>
                <span className="flex gap-1 shrink-0">
                  {levelCounts.map(({ level, count }) => (
                    <span key={level} className="hidden sm:inline">
                      <LevelBadge level={level} /> <span className="text-xs text-ink/40 mr-1">{count}</span>
                    </span>
                  ))}
                </span>
              </button>

              {!isCollapsed && (
                <div className="border-t border-line">
                  <div className="flex justify-end gap-1 px-3 pt-2">
                    <button
                      className="text-xs text-ink/50 hover:text-ink px-2 py-1 rounded hover:bg-ink/5"
                      onClick={async () => {
                        const name = prompt("Đổi tên chủ đề:", topic);
                        if (name && name.trim() && name.trim() !== topic) {
                          await renameTopic(topic, name.trim());
                        }
                      }}
                    >
                      Đổi tên chủ đề
                    </button>
                    <button
                      className="text-xs text-clay/80 hover:text-clay px-2 py-1 rounded hover:bg-clay/10"
                      onClick={async () => {
                        if (confirm(`Xoá toàn bộ chủ đề "${topic}" và ${list.length} từ trong đó?`)) {
                          await deleteTopic(topic);
                        }
                      }}
                    >
                      Xoá chủ đề
                    </button>
                  </div>
                  <ul className="divide-y divide-line">
                    {list.map((w) => (
                      <li key={w.id} className="px-4 py-2.5">
                        {editingId === w.id ? (
                          <div className="grid gap-2 sm:grid-cols-2 py-1">
                            <input className="input" value={editForm.en || ""} onChange={(e) => setEditForm({ ...editForm, en: e.target.value })} placeholder="Tiếng Anh" />
                            <input className="input" value={editForm.vi || ""} onChange={(e) => setEditForm({ ...editForm, vi: e.target.value })} placeholder="Tiếng Việt" />
                            <input className="input" value={editForm.phonetic || ""} onChange={(e) => setEditForm({ ...editForm, phonetic: e.target.value })} placeholder="Phiên âm" />
                            <select className="input" value={editForm.level as string} onChange={(e) => setEditForm({ ...editForm, level: e.target.value as CEFRLevel })}>
                              {CEFR_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                            </select>
                            <input className="input sm:col-span-2" value={editForm.example || ""} onChange={(e) => setEditForm({ ...editForm, example: e.target.value })} placeholder="Câu ví dụ" />
                            <div className="flex gap-2 sm:col-span-2 justify-end">
                              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X size={16} /></Button>
                              <Button size="sm" onClick={saveEdit}><Check size={16} /></Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap">
                            <LevelBadge level={w.level} />
                            <span className="font-medium text-ink">{w.en}</span>
                            {w.phonetic && <span className="text-ink/40 text-sm">{w.phonetic}</span>}
                            <span className="text-ink/30">—</span>
                            <span className="text-ink/80">{w.vi}</span>
                            {w.example && (
                              <span className="text-ink/40 text-xs italic hidden sm:inline">“{w.example}”</span>
                            )}
                            <span className="ml-auto flex items-center gap-0.5 shrink-0">
                              <button
                                className="p-1.5 rounded hover:bg-ink/5 text-ink/50 hover:text-ink"
                                onClick={() => startEdit(w)}
                                aria-label="Sửa từ"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                className="p-1.5 rounded hover:bg-clay/10 text-ink/50 hover:text-clay"
                                onClick={async () => {
                                  if (confirm(`Xoá từ "${w.en}"?`)) await deleteWord(w.id!);
                                }}
                                aria-label="Xoá từ"
                              >
                                <Trash2 size={15} />
                              </button>
                            </span>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-ink/60">{label}</span>
      {children}
    </label>
  );
}

function ImportPanel({ existingTopics, onClose }: { existingTopics: string[]; onClose: () => void }) {
  const [text, setText] = useState("");
  const [fallbackTopic, setFallbackTopic] = useState(existingTopics[0] || "");
  const [result, setResult] = useState<ParseResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState<number | null>(null);

  function handlePreview() {
    setDone(null);
    setResult(parseImportText(text, fallbackTopic));
  }

  async function handleImport() {
    if (!result) return;
    setImporting(true);
    const rows = groupsToWords(result.groups);
    await addWordsBulk(rows);
    setImporting(false);
    setDone(rows.length);
    setText("");
    setResult(null);
  }

  return (
    <div className="rounded-lg border border-line bg-white/60 p-4 space-y-3">
      <p className="text-sm text-ink/70">
        Dán danh sách theo định dạng: mỗi dòng{" "}
        <code className="bg-ink/5 px-1 rounded">tiếng anh | tiếng việt | phiên âm | trình độ | ví dụ</code>.
        Bắt đầu một chủ đề mới bằng dòng <code className="bg-ink/5 px-1 rounded">## Tên chủ đề</code>.
        Phiên âm, trình độ, ví dụ có thể bỏ trống.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        placeholder={`## Du lịch\nairport | sân bay | /ˈeəpɔːt/ | A1 | We arrived at the airport early.\npassport | hộ chiếu | | A2`}
        className="input font-mono text-[13px]"
      />
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Chủ đề mặc định (nếu không có dòng ## nào)">
          <input
            list="topic-names"
            value={fallbackTopic}
            onChange={(e) => setFallbackTopic(e.target.value)}
            className="input"
            placeholder="ví dụ: Chưa phân loại"
          />
        </Field>
        <Button size="sm" variant="secondary" onClick={handlePreview} disabled={!text.trim()}>
          Xem trước
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}>Đóng</Button>
      </div>

      {result && (
        <div className="space-y-2 text-sm">
          {result.errors.length > 0 && (
            <div className="rounded border border-clay/30 bg-clay/5 p-2 text-clay">
              {result.errors.map((e, i) => <div key={i}>{e}</div>)}
            </div>
          )}
          {result.groups.map((g) => (
            <div key={g.topic} className="text-ink/70">
              <span className="font-medium text-ink">{g.topic}</span>: {g.rows.length} từ
            </div>
          ))}
          {result.groups.some((g) => g.rows.length > 0) && (
            <Button size="sm" onClick={handleImport} disabled={importing}>
              {importing ? "Đang nhập..." : `Nhập ${result.groups.reduce((a, g) => a + g.rows.length, 0)} từ`}
            </Button>
          )}
        </div>
      )}
      {done != null && (
        <p className="text-moss text-sm">Đã nhập thành công {done} từ.</p>
      )}
    </div>
  );
}
