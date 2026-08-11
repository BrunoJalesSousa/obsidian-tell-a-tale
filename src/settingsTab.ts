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

    new Setting(containerEl).setName("Tell-A-Tale").setHeading();

    // ── Character Discovery ───────────────────────────────────────────────────
    new Setting(containerEl).setName("Characters").setHeading();

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
          .onChange((value) => {
            this.plugin.settings.characterTag = value.trim() || "dialogue-character";
            void this.plugin.saveSettings().then(() => { this.display(); });
          })
      );

    // ── Character chips ───────────────────────────────────────────────────────
    const chars = this.plugin.getVaultCharacters();

    const chipsSection = containerEl.createEl("div", { cls: "tat-chips-section" });

    chipsSection.createEl("p", {
      text: `Detected characters — ${chars.length}`,
      cls: "tat-chips-label",
    });

    if (chars.length === 0) {
      chipsSection.createEl("p", {
        text: `No notes found with the tag "${this.plugin.settings.characterTag}". Add this tag to a note's properties to register it as a character.`,
        cls: "setting-item-description tat-chips-empty",
      });
    } else {
      const chipsWrap = chipsSection.createEl("div", { cls: "tat-chips-wrap" });

      chars.forEach((char) => {
        const chip = chipsWrap.createEl("div", { cls: "tat-chip" });
        chip.setCssProps({
          "--tat-chip-color": char.color,
          "--tat-chip-border": char.color + "55",
          "--tat-chip-bg": char.color + "18",
          "--tat-chip-dot-shadow": char.color + "30",
          "--tat-chip-id-bg": char.color + "25",
        });

        chip.createEl("span", { cls: "tat-chip-dot" });
        chip.createEl("span", { text: char.name, cls: "tat-chip-name" });
        chip.createEl("span", { text: char.id, cls: "tat-chip-id" });

        if (char.avatarPath) {
          chip.createEl("span", { text: "avatar", cls: "tat-chip-avatar" });
        }
      });
    }

    containerEl.createEl("p", {
      text: 'To set a custom color, add a "color" property (hex) to the character note. ' +
            'For an avatar, embed an image named "tat-avatar-[anything]" in the character note.',
      cls: "setting-item-description tat-chips-hint",
    });

    // ── Avatar Settings ───────────────────────────────────────────────────────
    new Setting(containerEl).setName("Avatars").setHeading();

    new Setting(containerEl)
      .setName("Show avatars by default")
      .setDesc(
        "Show character portrait images beside dialogue and monologue blocks in reading view."
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showAvatars)
          .onChange((value) => {
            this.plugin.settings.showAvatars = value;
            void this.plugin.saveSettings();
          })
      );

    containerEl.createEl("p", {
      text: 'Avatar images must be embedded in the character\'s note and named with the prefix "tat-avatar-" ' +
            '(e.g. ![[tat-avatar-alice.png]]). Any image format Obsidian supports works.',
      cls: "setting-item-description",
    });

    // ── Hotkeys Reference ─────────────────────────────────────────────────────
    new Setting(containerEl).setName("Hotkeys").setHeading();
    containerEl.createEl("p", {
      text: 'Remap any shortcut in Settings → Hotkeys → search "Tell-A-Tale".',
      cls: "setting-item-description",
    });

    const hotkeysWrap = containerEl.createEl("div", { cls: "tat-hotkeys-wrap" });

    const rows: [string, string][] = [
      ["Insert Dialogue", "Mod+Shift+D"],
      ["Insert Monologue", "Mod+Shift+M"],
      ["Insert Narration", "Mod+Shift+O"],
      ["Insert Direction", "Mod+Shift+G"],
      ["Insert Cast Change", "Mod+Shift+A"],
    ];

    rows.forEach(([action, shortcut]) => {
      const card = hotkeysWrap.createEl("div", { cls: "tat-hotkey-card" });
      card.createEl("span", { text: action, cls: "tat-hotkey-action" });
      const kbdWrap = card.createEl("div", { cls: "tat-kbd-wrap" });
      shortcut.split("+").forEach((key, i, arr) => {
        kbdWrap.createEl("kbd", { text: key, cls: "tat-kbd" });
        if (i < arr.length - 1) {
          kbdWrap.createEl("span", { text: " + ", cls: "tat-kbd-sep" });
        }
      });
    });
  }
}
