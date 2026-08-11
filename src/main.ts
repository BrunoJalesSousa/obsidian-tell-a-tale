import { Plugin, Editor, Menu, TFile, MarkdownPostProcessorContext, setIcon } from "obsidian";
import { TellATaleSettings, DEFAULT_SETTINGS } from "./settings";
import { TellATaleSettingTab } from "./settingsTab";
import { insertBlock } from "./editor/insertBlock";
import { getVaultCharacters } from "./editor/characters";
import {
  findBlockLocation,
  getBlockContent,
  getBlockTitle,
  buildBlockLines,
  replaceBlockInFile,
} from "./editor/sourceBlock";
import { CharacterPickerModal } from "./modals/CharacterPickerModal";
import { CastChangeModal } from "./modals/CastChangeModal";
import { EditBlockModal } from "./modals/EditBlockModal";
import { Character } from "./types";

export default class TellATalePlugin extends Plugin {
  settings: TellATaleSettings;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new TellATaleSettingTab(this.app, this));

    this.registerMarkdownPostProcessor(
      (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
        this.processCallouts(el, ctx);
      }
    );

    // ── Insert Dialogue ───────────────────────────────────────────────────────
    this.addCommand({
      id: "insert-dialogue",
      name: "Insert Dialogue",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "D" }],
      editorCallback: (editor: Editor) => {
        this.insertDialogue(editor);
      },
    });

    // ── Insert Monologue ──────────────────────────────────────────────────────
    this.addCommand({
      id: "insert-monologue",
      name: "Insert Monologue",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "M" }],
      editorCallback: (editor: Editor) => {
        this.insertMonologue(editor);
      },
    });

    // ── Insert Narration ──────────────────────────────────────────────────────
    this.addCommand({
      id: "insert-narration",
      name: "Insert Narration",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "O" }],
      editorCallback: (editor: Editor) => {
        insertBlock(editor, "tat-narration");
      },
    });

    // ── Insert Direction ──────────────────────────────────────────────────────
    this.addCommand({
      id: "insert-direction",
      name: "Insert Direction",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "G" }],
      editorCallback: (editor: Editor) => {
        insertBlock(editor, "tat-direction");
      },
    });

    // ── Insert Cast Change ────────────────────────────────────────────────────
    this.addCommand({
      id: "insert-cast-change",
      name: "Insert Cast Change",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "A" }],
      editorCallback: (editor: Editor) => {
        new CastChangeModal(this.app, this, editor).open();
      },
    });

    // ── Editor right-click context menu ───────────────────────────────────────
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor) => {
        menu.addItem((item) => {
          item.setTitle("Tell-A-Tale").setIcon("book-text").setSection("tell-a-tale");
          // setSubmenu exists at runtime but is absent from the installed type definitions
          const sub = (item as unknown as { setSubmenu(): Menu }).setSubmenu();

          sub.addItem((i) =>
            i.setTitle("Insert Dialogue").setIcon("message-circle").onClick(() => {
              this.insertDialogue(editor);
            })
          );
          sub.addItem((i) =>
            i.setTitle("Insert Monologue").setIcon("brain").onClick(() => {
              this.insertMonologue(editor);
            })
          );
          sub.addItem((i) =>
            i.setTitle("Insert Narration").setIcon("book-open").onClick(() => {
              insertBlock(editor, "tat-narration");
            })
          );
          sub.addItem((i) =>
            i.setTitle("Insert Direction").setIcon("video").onClick(() => {
              insertBlock(editor, "tat-direction");
            })
          );
          sub.addItem((i) =>
            i.setTitle("Insert Cast Change").setIcon("users").onClick(() => {
              new CastChangeModal(this.app, this, editor).open();
            })
          );
        });
      })
    );
  }

  private insertDialogue(editor: Editor): void {
    const chars = this.getVaultCharacters();
    if (chars.length === 0) {
      insertBlock(editor, "tat-dialogue");
      return;
    }
    new CharacterPickerModal(this.app, chars, (char) => {
      insertBlock(editor, "tat-dialogue", char ?? undefined);
    }).open();
  }

  private insertMonologue(editor: Editor): void {
    const chars = this.getVaultCharacters();
    if (chars.length === 0) {
      insertBlock(editor, "tat-monologue");
      return;
    }
    new CharacterPickerModal(this.app, chars, (char) => {
      insertBlock(editor, "tat-monologue", char ?? undefined);
    }).open();
  }

  getVaultCharacters(): Character[] {
    return getVaultCharacters(this.app, this.settings.characterTag);
  }

  private processCallouts(
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
  ): void {
    const chars = this.getVaultCharacters();
    const sectionInfo = ctx.getSectionInfo(el);

    const CHAR_TYPES = new Set(["tat-dialogue", "tat-monologue"]);
    const ALL_TYPES = [
      "tat-dialogue", "tat-monologue", "tat-narration", "tat-direction", "tat-cast",
    ];
    const selector = ALL_TYPES.map((t) => `.callout[data-callout="${t}"]`).join(", ");

    // Per-section index counter keyed by calloutType|charId
    const sectionCounters = new Map<string, number>();

    el.querySelectorAll<HTMLElement>(selector).forEach((callout) => {
      if (callout.querySelector(".tat-actions")) return;

      const calloutType = callout.dataset.callout!;
      const charId = callout.dataset.calloutMetadata;
      const char = chars.find((c) => c.id === charId) ?? null;
      if (char) {
        callout.setCssProps({ "--tat-char-color": char.color, "--tat-char-bg": char.color + "18" });
      }

      const counterKey = `${calloutType}|${charId ?? ""}`;
      const sectionIndex = sectionCounters.get(counterKey) ?? 0;
      sectionCounters.set(counterKey, sectionIndex + 1);

      // ── Avatar (dialogue / monologue only) ──────────────────────────────────
      // Always reserve the avatar column when showAvatars is on, so text
      // starts at the same horizontal position regardless of whether the
      // character has an image.
      if (CHAR_TYPES.has(calloutType) && this.settings.showAvatars) {
        const wrap = callout.createDiv({ cls: "tat-avatar-wrap" });
        if (char?.avatarPath) {
          const avatarFile = this.app.vault.getAbstractFileByPath(char.avatarPath);
          if (avatarFile instanceof TFile) {
            const img = wrap.createEl("img", { cls: "tat-avatar" });
            img.src = this.app.vault.getResourcePath(avatarFile);
            img.alt = char.name;
          }
        }
        callout.prepend(wrap);
        callout.addClass("tat-has-avatar");
      }

      // ── Action buttons ──────────────────────────────────────────────────────
      // For types with a hidden title, inject the actions div directly into the
      // callout so it can be positioned as an overlay via CSS.
      const titleEl = callout.querySelector<HTMLElement>(".callout-title");
      const isTitleHidden = calloutType === "tat-narration" || calloutType === "tat-direction";
      const actions = isTitleHidden
        ? callout.createDiv({ cls: "tat-actions tat-actions-overlay" })
        : titleEl?.createDiv({ cls: "tat-actions" });
      if (!actions) return;

      // Edit button
      const editBtn = actions.createEl("button", {
        cls: "tat-action-btn",
        attr: { "aria-label": "Edit block" },
      });
      setIcon(editBtn, "pencil");
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        void (async () => {
          const loc = await findBlockLocation(
            this.app, ctx.sourcePath, calloutType, charId,
            sectionIndex, sectionInfo?.lineStart, sectionInfo?.lineEnd
          );
          if (!loc) return;

          const file = this.app.vault.getAbstractFileByPath(ctx.sourcePath);
          if (!(file instanceof TFile)) return;
          const lines = (await this.app.vault.read(file)).split("\n");

          // Cast change stores its data in the title, not the body
          const isCast = calloutType === "tat-cast";
          const currentContent = isCast
            ? getBlockTitle(lines, loc)
            : getBlockContent(lines, loc);
          const editChars = CHAR_TYPES.has(calloutType) ? chars : [];

          new EditBlockModal(
            this.app, currentContent, char, editChars, calloutType,
            (newContent, newChar) => {
              void (async () => {
                const newLines = isCast
                  ? [`${loc.prefix} [!tat-cast] ${newContent}`, `${loc.prefix} `]
                  : buildBlockLines(loc.prefix, calloutType, newChar, newContent);
                await replaceBlockInFile(this.app, ctx.sourcePath, loc, newLines);
              })();
            }
          ).open();
        })();
      });

    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<TellATaleSettings>);
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

}
