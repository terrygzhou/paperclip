import type { TranscriptEntry } from "../types";

export function parseDshStdoutLine(line: string, ts: string): TranscriptEntry[] {
  if (!line.trim()) return [];
  return [{ kind: "stdout", ts, text: line }];
}
