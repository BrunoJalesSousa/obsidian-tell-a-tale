import { App, getAllTags, TFile } from "obsidian";
import { Character } from "../types";

export function getVaultCharacters(app: App, characterTag: string, avatarProperty = "avatar"): Character[] {
  const tag = characterTag.startsWith("#") ? characterTag : `#${characterTag}`;

  return app.vault
    .getMarkdownFiles()
    .filter((file) => {
      const cache = app.metadataCache.getFileCache(file);
      if (!cache) return false;
      const tags: string[] = getAllTags(cache) ?? [];
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

      // 1. The first embedded image whose filename starts with "tat-avatar-" (the original behaviour, and it
      //    always wins, so an avatar that shows today never changes).
      // 2. Only if there's no such embed: the avatar property (path or [[link]]), e.g. set by Make-a-Wiki.
      const avatarFile =
        resolveAvatarEmbed(app, file, cache?.embeds ?? []) ??
        resolveAvatarProperty(app, file, avatarProperty ? fm[avatarProperty] : undefined);
      const avatarPath = avatarFile?.path;

      return { id, name, color, noteLink: `[[${file.basename}]]`, avatarPath };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "avif"]);

/** The avatar property as an image file in the vault, or null (URLs, lists, notes, missing files are ignored). */
function resolveAvatarProperty(app: App, file: TFile, value: unknown): TFile | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const linkpath = value.trim().replace(/^!?\[\[|\]\]$/g, "").split("|")[0].trim();
  if (!linkpath) return null;
  const direct = app.vault.getAbstractFileByPath(linkpath);
  const target = direct instanceof TFile ? direct : app.metadataCache.getFirstLinkpathDest(linkpath, file.path);
  return target instanceof TFile && IMAGE_EXTENSIONS.has(target.extension.toLowerCase()) ? target : null;
}

function resolveAvatarEmbed(app: App, file: TFile, embeds: { link: string }[]): TFile | null {
  const avatarEmbed = embeds.find((e) => {
    const filename = e.link.split("/").pop() ?? e.link;
    return /^tat-avatar-/i.test(filename);
  });
  if (!avatarEmbed) return null;
  const linked = app.metadataCache.getFirstLinkpathDest(avatarEmbed.link, file.path);
  return linked instanceof TFile ? linked : null;
}

function generateColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return hslToHex(hue, 65, 62);
}

function hslChannel(h: number, a: number, ln: number, n: number): string {
  const k: number = (n + h / 30) % 12;
  const minVal: number = Math.min(k - 3, 9 - k, 1);
  const maxVal: number = Math.max(minVal, -1);
  const c: number = ln - a * maxVal;
  const byte: number = Math.round(255 * c);
  const hexStr: string = byte.toString(16);
  const padded: string = hexStr.padStart(2, "0");
  return padded;
}

function hslToHex(h: number, s: number, l: number): string {
  const sn: number = s / 100;
  const ln: number = l / 100;
  const a: number = sn * Math.min(ln, 1 - ln);
  return `#${hslChannel(h, a, ln, 0)}${hslChannel(h, a, ln, 8)}${hslChannel(h, a, ln, 4)}`;
}
