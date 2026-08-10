import { Plugin, Editor, TFile, MarkdownPostProcessorContext, Modal, Setting, setIcon } from "obsidian";
import { TellATaleSettings, DEFAULT_SETTINGS } from "./settings";
import { TellATaleSettingTab } from "./settingsTab";
import { insertBlock } from "./editor/insertBlock";
import { injectCharacterStyles, removeCharacterStyles } from "./editor/styles";
import { getVaultCharacters } from "./editor/characters";
import {
  findBlockLocation,
  getBlockContent,
  getBlockTitle,
  buildBlockLines,
  replaceBlockInFile,
  deleteBlockFromFile,
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

    this.app.workspace.onLayoutReady(() => this.refreshCharacterStyles());
    this.registerEvent(
      this.app.metadataCache.on("changed", () => this.refreshCharacterStyles())
    );

    this.registerMarkdownPostProcessor(
      (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
        this.processCallouts(el, ctx);
      }
    );

    // ── Insert Dialogue ───────────────────────────────────────────────────────
    this.addCommand({
      id: "insert-dialogue",
      name: "Insert Dialogue",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "d" }],
      editorCallback: (editor: Editor) => {
        const chars = this.getVaultCharacters();
        if (chars.length === 0) {
          insertBlock(editor, "tat-dialogue");
          return;
        }
        new CharacterPickerModal(this.app, chars, (char) => {
          insertBlock(editor, "tat-dialogue", char ?? undefined);
        }).open();
      },
    });

    // ── Insert Monologue ──────────────────────────────────────────────────────
    this.addCommand({
      id: "insert-monologue",
      name: "Insert Monologue",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "m" }],
      editorCallback: (editor: Editor) => {
        const chars = this.getVaultCharacters();
        if (chars.length === 0) {
          insertBlock(editor, "tat-monologue");
          return;
        }
        new CharacterPickerModal(this.app, chars, (char) => {
          insertBlock(editor, "tat-monologue", char ?? undefined);
        }).open();
      },
    });

    // ── Insert Narration ──────────────────────────────────────────────────────
    this.addCommand({
      id: "insert-narration",
      name: "Insert Narration",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "o" }],
      editorCallback: (editor: Editor) => {
        insertBlock(editor, "tat-narration");
      },
    });

    // ── Insert Direction ──────────────────────────────────────────────────────
    this.addCommand({
      id: "insert-direction",
      name: "Insert Direction",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "g" }],
      editorCallback: (editor: Editor) => {
        insertBlock(editor, "tat-direction");
      },
    });

    // ── Insert Cast Change ────────────────────────────────────────────────────
    this.addCommand({
      id: "insert-cast-change",
      name: "Insert Cast Change",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "a" }],
      editorCallback: (editor: Editor) => {
        new CastChangeModal(this.app, this, editor).open();
      },
    });
  }

  onunload() {
    removeCharacterStyles();
  }

  getVaultCharacters(): Character[] {
    return getVaultCharacters(this.app, this.settings.characterTag);
  }

  refreshCharacterStyles(): void {
    injectCharacterStyles(this.getVaultCharacters());
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

      const counterKey = `${calloutType}|${charId ?? ""}`;
      const sectionIndex = sectionCounters.get(counterKey) ?? 0;
      sectionCounters.set(counterKey, sectionIndex + 1);

      // ── Avatar (dialogue / monologue only) ──────────────────────────────────
      // Always reserve the avatar column when showAvatars is on, so text
      // starts at the same horizontal position regardless of whether the
      // character has an image.
      if (CHAR_TYPES.has(calloutType) && this.settings.showAvatars) {
        const wrap = callout.createEl("div", { cls: "tat-avatar-wrap" });
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
        ? callout.createEl("div", { cls: "tat-actions tat-actions-overlay" })
        : titleEl?.createEl("div", { cls: "tat-actions" });
      if (!actions) return;

      // Edit button
      const editBtn = actions.createEl("button", {
        cls: "tat-action-btn",
        attr: { "aria-label": "Edit block" },
      });
      setIcon(editBtn, "pencil");
      editBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        e.preventDefault();

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
          async (newContent, newChar) => {
            const newLines = isCast
              ? [`${loc.prefix} [!tat-cast] ${newContent}`, `${loc.prefix} `]
              : buildBlockLines(loc.prefix, calloutType, newChar, newContent);
            await replaceBlockInFile(this.app, ctx.sourcePath, loc, newLines);
          }
        ).open();
      });

      // Delete button
      const deleteBtn = actions.createEl("button", {
        cls: "tat-action-btn tat-action-delete",
        attr: { "aria-label": "Delete block" },
      });
      setIcon(deleteBtn, "trash-2");
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();

        this.confirmDelete(async () => {
          const loc = await findBlockLocation(
            this.app, ctx.sourcePath, calloutType, charId,
            sectionIndex, sectionInfo?.lineStart, sectionInfo?.lineEnd
          );
          if (!loc) return;

          await deleteBlockFromFile(this.app, ctx.sourcePath, loc);
        });
      });
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.refreshCharacterStyles();
  }

  private confirmDelete(onConfirm: () => void): void {
    const modal = new Modal(this.app);
    modal.titleEl.setText("Delete block?");
    modal.contentEl.createEl("p", {
      text: "This can be undone with Ctrl+Z (Cmd+Z on Mac).",
      cls: "setting-item-description",
    });
    new Setting(modal.contentEl)
      .addButton((btn) => btn.setButtonText("Cancel").onClick(() => modal.close()))
      .addButton((btn) =>
        btn.setButtonText("Delete").setWarning().onClick(() => {
          modal.close();
          onConfirm();
        })
      );
    modal.open();
  }
}
