export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export const CEFR_LEVELS: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export interface Word {
  id?: number;
  topic: string;
  en: string;
  vi: string;
  phonetic?: string;
  level: CEFRLevel;
  example?: string;
  createdAt: number;
}

export type Direction = "en-vi" | "vi-en";

export interface WordProgress {
  id?: number;
  wordId: number;
  direction: Direction;
  mastered: boolean;
  wrongCount: number;
  correctCount: number;
  lastReviewedAt?: number;
}

export interface TopicStatus {
  id?: number;
  topic: string;
  direction: Direction;
  completed: boolean;
  completedAt?: number;
}

export interface AccentPref {
  id?: number;
  key: "accent";
  value: "en-US" | "en-GB";
}
