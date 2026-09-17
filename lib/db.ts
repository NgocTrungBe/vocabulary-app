import Dexie, { type Table } from "dexie";
import type { Word, WordProgress, TopicStatus, AccentPref } from "./types";

class VocabDB extends Dexie {
  words!: Table<Word, number>;
  progress!: Table<WordProgress, number>;
  topicStatus!: Table<TopicStatus, number>;
  settings!: Table<AccentPref, number>;

  constructor() {
    super("tuvung-db");
    this.version(1).stores({
      words: "++id, topic, level, en, vi",
      progress: "++id, wordId, direction, [wordId+direction]",
      topicStatus: "++id, topic, direction, [topic+direction]",
      settings: "++id, key",
    });
  }
}

export const db = new VocabDB();

// --- Word CRUD -------------------------------------------------------

export async function addWord(word: Omit<Word, "id" | "createdAt">) {
  return db.words.add({ ...word, createdAt: Date.now() });
}

export async function addWordsBulk(words: Omit<Word, "id" | "createdAt">[]) {
  const now = Date.now();
  return db.transaction("rw", db.words, async () => {
    for (const w of words) {
      await db.words.add({ ...w, createdAt: now });
    }
  });
}

export async function updateWord(id: number, changes: Partial<Word>) {
  return db.words.update(id, changes);
}

export async function deleteWord(id: number) {
  return db.transaction("rw", db.words, db.progress, async () => {
    await db.words.delete(id);
    await db.progress.where("wordId").equals(id).delete();
  });
}

export async function deleteTopic(topic: string) {
  const words = await db.words.where("topic").equals(topic).toArray();
  const ids = words.map((w) => w.id!).filter(Boolean);
  return db.transaction("rw", db.words, db.progress, db.topicStatus, async () => {
    await db.words.where("topic").equals(topic).delete();
    await db.progress.where("wordId").anyOf(ids).delete();
    await db.topicStatus.where("topic").equals(topic).delete();
  });
}

export async function renameTopic(oldName: string, newName: string) {
  const words = await db.words.where("topic").equals(oldName).toArray();
  return db.transaction("rw", db.words, db.topicStatus, async () => {
    for (const w of words) {
      await db.words.update(w.id!, { topic: newName });
    }
    const statuses = await db.topicStatus.where("topic").equals(oldName).toArray();
    for (const s of statuses) {
      await db.topicStatus.update(s.id!, { topic: newName });
    }
  });
}

// --- Progress ----------------------------------------------------------

export async function getOrCreateProgress(wordId: number, direction: "en-vi" | "vi-en") {
  const existing = await db.progress
    .where("[wordId+direction]")
    .equals([wordId, direction])
    .first();
  if (existing) return existing;
  const id = await db.progress.add({
    wordId,
    direction,
    mastered: false,
    wrongCount: 0,
    correctCount: 0,
  });
  return db.progress.get(id) as Promise<WordProgress>;
}

export async function recordAnswer(
  wordId: number,
  direction: "en-vi" | "vi-en",
  correct: boolean
) {
  const p = await getOrCreateProgress(wordId, direction);
  await db.progress.update(p.id!, {
    correctCount: p.correctCount + (correct ? 1 : 0),
    wrongCount: p.wrongCount + (correct ? 0 : 1),
    mastered: correct ? true : false,
    lastReviewedAt: Date.now(),
  });
}

// --- Topic completion ---------------------------------------------------

export async function markTopicComplete(topic: string, direction: "en-vi" | "vi-en") {
  const existing = await db.topicStatus
    .where("[topic+direction]")
    .equals([topic, direction])
    .first();
  if (existing) {
    await db.topicStatus.update(existing.id!, {
      completed: true,
      completedAt: Date.now(),
    });
  } else {
    await db.topicStatus.add({
      topic,
      direction,
      completed: true,
      completedAt: Date.now(),
    });
  }
}

export async function resetTopicCompletion(topic: string, direction: "en-vi" | "vi-en") {
  const existing = await db.topicStatus
    .where("[topic+direction]")
    .equals([topic, direction])
    .first();
  if (existing) {
    await db.topicStatus.update(existing.id!, { completed: false, completedAt: undefined });
  }
}

// --- Settings ---------------------------------------------------------

export async function getAccent(): Promise<"en-US" | "en-GB"> {
  const row = await db.settings.where("key").equals("accent").first();
  return (row?.value as "en-US" | "en-GB") ?? "en-US";
}

export async function setAccent(value: "en-US" | "en-GB") {
  const row = await db.settings.where("key").equals("accent").first();
  if (row) {
    await db.settings.update(row.id!, { value });
  } else {
    await db.settings.add({ key: "accent", value });
  }
}
