import { App, PluginSettingTab, Setting } from "obsidian";
import TellATalePlugin from "./main";

export class TellATaleSettingTab extends PluginSettingTab {
  plugin: TellATalePlugin;

  constructor(app: App, plugin: TellATalePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Tell-A-Tale" });

    // ── Character Discovery ───────────────────────────────────────────────────
    containerEl.createEl("h3", { text: "Characters" });

    new Setting(containerEl)
      .setName("Character tag")
      .setDesc(
        "Tag to look for in note properties. Any note with this tag is treated as a character. " +
        'Optionally add a "color" property (hex, e.g. #e06c75) for a custom color.'
      )
      .addText((text) =>
        text
          .setPlaceholder("dialogue-character")
          .setValue(this.plugin.settings.characterTag)
          .onChange(async (value) => {
            this.plugin.settings.characterTag = value.trim() || "dialogue-character";
            await this.plugin.saveSettings();
            this.display();
          })
      );

    // ── Character chips ───────────────────────────────────────────────────────
    const chars = this.plugin.getVaultCharacters();

    const chipsSection = containerEl.createEl("div");
    chipsSection.style.cssText = "margin: 0 0 6px;";

    const chipsLabel = chipsSection.createEl("p");
    chipsLabel.style.cssText =
      "font-size: 0.82em; font-weight: 600; text-transform: uppercase; " +
      "letter-spacing: 0.06em; opacity: 0.5; margin: 0 0 10px;";
    chipsLabel.textContent = `Detected characters — ${chars.length}`;

    if (chars.length === 0) {
      const empty = chipsSection.createEl("p", {
        text: `No notes found with the tag "${this.plugin.settings.characterTag}". Add this tag to a note's properties to register it as a character.`,
        cls: "setting-item-description",
      });
      empty.style.margin = "0";
    } else {
      const chipsWrap = chipsSection.createEl("div");
      chipsWrap.style.cssText =
        "display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px;";

      chars.forEach((char) => {
        const chip = chipsWrap.createEl("div");
        chip.style.cssText = `
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 5px 12px 5px 8px;
          border-radius: 999px;
          border: 1.5px solid ${char.color}55;
          background: ${char.color}18;
          font-size: 0.88em;
          line-height: 1;
          cursor: default;
        `;

        const dot = chip.createEl("span");
        dot.style.cssText = `
          width: 9px; height: 9px;
          border-radius: 50%;
          background: ${char.color};
          flex-shrink: 0;
          box-shadow: 0 0 0 2px ${char.color}30;
        `;

        chip.createEl("span", { text: char.name }).style.fontWeight = "500";

        const idBadge = chip.createEl("span", { text: char.id });
        idBadge.style.cssText = `
          font-size: 0.78em;
          font-family: monospace;
          padding: 1px 5px;
          border-radius: 4px;
          background: ${char.color}25;
          color: ${char.color};
          opacity: 0.8;
        `;

        if (char.avatarPath) {
          const avatarBadge = chip.createEl("span", { text: "avatar" });
          avatarBadge.style.cssText = `
            font-size: 0.72em;
            padding: 1px 5px;
            border-radius: 4px;
            background: var(--background-modifier-success);
            color: var(--text-success);
            font-family: monospace;
          `;
        }
      });
    }

    containerEl.createEl("p", {
      text: 'To set a custom color, add a "color" property (hex) to the character note. ' +
            'For an avatar, embed an image named "tat-avatar-[anything]" in the character note.',
      cls: "setting-item-description",
    }).style.cssText = "margin-top: 0;";

    // ── Avatar Settings ───────────────────────────────────────────────────────
    containerEl.createEl("h3", { text: "Avatars" });

    new Setting(containerEl)
      .setName("Show avatars by default")
      .setDesc(
        "Show character portrait images beside dialogue and monologue blocks in reading view."
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showAvatars)
          .onChange(async (value) => {
            this.plugin.settings.showAvatars = value;
            await this.plugin.saveSettings();
          })
      );

    containerEl.createEl("p", {
      text: 'Avatar images must be embedded in the character\'s note and named with the prefix "tat-avatar-" ' +
            '(e.g. ![[tat-avatar-alice.png]]). Any image format Obsidian supports works.',
      cls: "setting-item-description",
    });

    // ── Hotkeys Reference ─────────────────────────────────────────────────────
    containerEl.createEl("h3", { text: "Hotkeys" });
    containerEl.createEl("p", {
      text: 'Remap any shortcut in Settings → Hotkeys → search "Tell-A-Tale".',
      cls: "setting-item-description",
    });

    const hotkeysWrap = containerEl.createEl("div");
    hotkeysWrap.style.cssText =
      "display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 8px;";

    const rows: [string, string][] = [
      ["Insert Dialogue", "Mod+Shift+D"],
      ["Insert Monologue", "Mod+Shift+M"],
      ["Insert Narration", "Mod+Shift+O"],
      ["Insert Direction", "Mod+Shift+G"],
      ["Insert Cast Change", "Mod+Shift+A"],
    ];

    rows.forEach(([action, shortcut]) => {
      const card = hotkeysWrap.createEl("div");
      card.style.cssText = `
        display: flex; flex-direction: column; gap: 4px;
        padding: 8px 10px;
        border-radius: 6px;
        border: 1px solid var(--background-modifier-border);
        background: var(--background-secondary);
      `;

      card.createEl("span", { text: action }).style.cssText =
        "font-size: 0.85em; opacity: 0.7;";

      const kbdWrap = card.createEl("div");
      shortcut.split("+").forEach((key, i, arr) => {
        const kbd = kbdWrap.createEl("kbd", { text: key });
        kbd.style.cssText = `
          display: inline-block; padding: 1px 6px;
          border-radius: 4px;
          border: 1px solid var(--background-modifier-border);
          background: var(--background-primary);
          font-size: 0.82em; font-family: monospace; font-weight: 600;
        `;
        if (i < arr.length - 1) {
          kbdWrap.createEl("span", { text: " + " }).style.cssText =
            "font-size: 0.75em; opacity: 0.5;";
        }
      });
    });
  }
}
