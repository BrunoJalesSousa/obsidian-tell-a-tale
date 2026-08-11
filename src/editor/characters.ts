import { App, getAllTags, TFile } from "obsidian";
import { Character } from "../types";

export function getVaultCharacters(app: App, characterTag: string): Character[] {
  const tag = characterTag.startsWith("#") ? characterTag : `#${characterTag}`;

  return app.vault
    .getMarkdownFiles()
    .filter((file) => {
      const cache = app.metadataCache.getFileCache(file);
      if (!cache) return false;
      const tags = (getAllTags(cache) ?? []) as string[];
      return tags.includes(tag);
    })
    .map((file) => {
      const cache = app.metadataCache.getFileCache(file);
      const fm = cache?.frontmatter ?? {};
      const name = typeof fm.name === "string" ? fm.name : file.basename;
      const color =
        typeof fm.color === "string" ? fm.color : generateColor(file.basename);
      const id = file.basename
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      // Find the first embedded image whose filename starts with "tat-avatar-"
      const embeds = cache?.embeds ?? [];
      const avatarEmbed = embeds.find((e) => {
        const filename = e.link.split("/").pop() ?? e.link;
        return /^tat-avatar-/i.test(filename);
      });
      const avatarFile = avatarEmbed
        ? app.metadataCache.getFirstLinkpathDest(avatarEmbed.link, file.path)
        : null;
      const avatarPath =
        avatarFile instanceof TFile ? avatarFile.path : undefined;

      return { id, name, color, noteLink: `[[${file.basename}]]`, avatarPath };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function generateColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return hslToHex(hue, 65, 62);
}

function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number): string => {
    const k = (n + h / 30) % 12;
    const c = ln - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
