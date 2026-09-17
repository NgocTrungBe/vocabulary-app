import { CEFR_LEVELS, type CEFRLevel, type Word } from "./types";

export interface ParsedWordRow {
  en: string;
  vi: string;
  phonetic?: string;
  level: CEFRLevel;
  example?: string;
}

export interface ParsedGroup {
  topic: string;
  rows: ParsedWordRow[];
}

export interface ParseResult {
  groups: ParsedGroup[];
  errors: string[];
}

function normalizeLevel(raw?: string): CEFRLevel {
  const v = (raw || "").trim().toUpperCase() as CEFRLevel;
  return CEFR_LEVELS.includes(v) ? v : "A1";
}

/**
 * Format supported (each line separated by "|"):
 *
 *   ## Chủ đề: Travel
 *   airport | sân bay | /ˈeəpɔːt/ | A1 | We arrived at the airport early.
 *   passport | hộ chiếu | | A2
 *
 * - A "## " line starts a new topic group. "Chủ đề:" prefix is optional.
 * - Each word line: en | vi | phonetic(optional) | level(optional) | example(optional)
 * - Lines starting with "#" that aren't "##" are treated as comments.
 * - If no "##" heading appears before the first word line, fallbackTopic is used.
 */
export function parseImportText(text: string, fallbackTopic: string): ParseResult {
  const lines = text.split(/\r?\n/);
  const groups: ParsedGroup[] = [];
  const errors: string[] = [];
  let current: ParsedGroup | null = null;

  const ensureCurrent = () => {
    if (!current) {
      current = { topic: fallbackTopic || "Chưa đặt tên", rows: [] };
      groups.push(current);
    }
    return current;
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();
    if (!line) return;

    if (line.startsWith("##")) {
      let topic = line.replace(/^##+/, "").trim();
      topic = topic.replace(/^ch[ủu]\s*đ[ềe]\s*:?/i, "").trim();
      if (!topic) topic = fallbackTopic || "Chưa đặt tên";
      current = { topic, rows: [] };
      groups.push(current);
      return;
    }
    if (line.startsWith("#")) return; // comment line

    const parts = line.split("|").map((p) => p.trim());
    if (parts.length < 2 || !parts[0] || !parts[1]) {
      errors.push(`Dòng ${idx + 1}: cần ít nhất "tiếng anh | tiếng việt" — "${rawLine}"`);
      return;
    }
    const [en, vi, phonetic, level, example] = parts;
    const group = ensureCurrent();
    group.rows.push({
      en,
      vi,
      phonetic: phonetic || undefined,
      level: normalizeLevel(level),
      example: example || undefined,
    });
  });

  return { groups, errors };
}

export function groupsToWords(groups: ParsedGroup[]): Omit<Word, "id" | "createdAt">[] {
  const out: Omit<Word, "id" | "createdAt">[] = [];
  for (const g of groups) {
    for (const r of g.rows) {
      out.push({
        topic: g.topic,
        en: r.en,
        vi: r.vi,
        phonetic: r.phonetic,
        level: r.level,
        example: r.example,
      });
    }
  }
  return out;
}
