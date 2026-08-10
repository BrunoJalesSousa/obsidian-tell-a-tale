import { App, TFile } from "obsidian";
import { Character } from "../types";

export interface BlockLocation {
  start: number;
  end: number;
  prefix: string;
}

/** Find the nth (index) block of a given callout type+charId within a line range. */
export async function findBlockLocation(
  app: App,
  sourcePath: string,
  calloutType: string,
  charId: string | undefined,
  index: number,
  lineStart = 0,
  lineEnd = Infinity
): Promise<BlockLocation | null> {
  const file = app.vault.getAbstractFileByPath(sourcePath);
  if (!(file instanceof TFile)) return null;

  const lines = (await app.vault.read(file)).split("\n");

  const pattern = charId
    ? new RegExp(`^(>+)\\s*\\[!${calloutType}\\|${charId}\\]`, "i")
    : new RegExp(`^(>+)\\s*\\[!${calloutType}\\]`, "i");

  let count = 0;
  const limit = Math.min(lineEnd, lines.length - 1);

  for (let i = lineStart; i <= limit; i++) {
    const match = lines[i].match(pattern);
    if (match) {
      if (count === index) {
        const prefix = match[1];
        const end = getBlockEnd(lines, i, prefix);
        return { start: i, end, prefix };
      }
      count++;
    }
  }

  return null;
}

function getBlockEnd(lines: string[], headerLine: number, prefix: string): number {
  const deeper = prefix + ">";
  // Matches a new callout at exactly our prefix level (not deeper)
  const newCallout = new RegExp(
    `^${prefix.replace(/>/g, "\\>")}\\s*\\[!`
  );

  let end = headerLine + 1;
  while (end < lines.length) {
    const line = lines[end];
    if (!line.startsWith(prefix)) break;
    if (!line.startsWith(deeper) && newCallout.test(line)) break;
    end++;
  }

  return end - 1;
}

/** Extract the title text from a block's header line (text after [!callout-type]). */
export function getBlockTitle(lines: string[], loc: BlockLocation): string {
  const match = lines[loc.start].match(/\[![^\]]+\]\s*(.*)/);
  return match ? match[1].trim() : "";
}

/** Extract the text content of a block (strips blockquote prefix from each line). */
export function getBlockContent(lines: string[], loc: BlockLocation): string {
  const prefixRe = new RegExp(`^${loc.prefix.replace(/>/g, "\\>")}\\s?`);
  return lines
    .slice(loc.start + 1, loc.end + 1)
    .map((l) => l.replace(prefixRe, ""))
    .join("\n")
    .trimEnd();
}

/** Build source lines for a block. */
export function buildBlockLines(
  prefix: string,
  calloutType: string,
  char: Character | null,
  content: string
): string[] {
  const header = char
    ? `${prefix} [!${calloutType}|${char.id}] ${char.name}`
    : `${prefix} [!${calloutType}]`;
  const body = content
    .split("\n")
    .map((l) => `${prefix} ${l}`);
  return [header, ...body];
}

export async function replaceBlockInFile(
  app: App,
  sourcePath: string,
  loc: BlockLocation,
  newLines: string[]
): Promise<void> {
  const file = app.vault.getAbstractFileByPath(sourcePath);
  if (!(file instanceof TFile)) return;

  const lines = (await app.vault.read(file)).split("\n");
  lines.splice(loc.start, loc.end - loc.start + 1, ...newLines);
  await app.vault.modify(file, lines.join("\n"));
}

export async function deleteBlockFromFile(
  app: App,
  sourcePath: string,
  loc: BlockLocation
): Promise<void> {
  const file = app.vault.getAbstractFileByPath(sourcePath);
  if (!(file instanceof TFile)) return;

  const lines = (await app.vault.read(file)).split("\n");

  // Also remove a trailing empty blockquote line if present
  let count = loc.end - loc.start + 1;
  const next = lines[loc.end + 1];
  if (next !== undefined && /^>*\s*$/.test(next)) count++;

  lines.splice(loc.start, count);
  await app.vault.modify(file, lines.join("\n"));
}
