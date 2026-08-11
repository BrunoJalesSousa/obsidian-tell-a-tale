import { App, Modal, Setting } from "obsidian";
import { Character } from "../types";

export class EditBlockModal extends Modal {
  private content: string;
  private character: Character | null;
  private readonly allChars: Character[];
  private readonly calloutType: string;
  private readonly onSave: (content: string, char: Character | null) => void;

  constructor(
    app: App,
    content: string,
    character: Character | null,
    allChars: Character[],
    calloutType: string,
    onSave: (content: string, char: Character | null) => void
  ) {
    super(app);
    this.content = content;
    this.character = character;
    this.allChars = allChars;
    this.calloutType = calloutType;
    this.onSave = onSave;
  }

  onOpen(): void {
    const { contentEl } = this;
    const labels: Record<string, string> = {
      "tat-dialogue": "Dialogue",
      "tat-monologue": "Monologue",
      "tat-narration": "Narration",
      "tat-direction": "Direction",
      "tat-cast": "Cast Change",
    };
    contentEl.createEl("h2", {
      text: `Edit ${labels[this.calloutType] ?? this.calloutType}`,
    });

    // Character selector
    if (this.allChars.length > 0) {
      new Setting(contentEl)
        .setName("Character")
        .addDropdown((dd) => {
          dd.addOption("", "— none —");
          this.allChars.forEach((c) => { dd.addOption(c.id, c.name); });
          dd.setValue(this.character?.id ?? "");
          dd.onChange((value) => {
            this.character = this.allChars.find((c) => c.id === value) ?? null;
          });
        });
    }

    // Content textarea
    contentEl.createEl("p", { text: "Content", cls: "setting-item-name" });

    const textarea = contentEl.createEl("textarea");
    textarea.value = this.content;
    textarea.setCssStyles({
      width: "100%",
      minHeight: "100px",
      padding: "8px",
      border: "1px solid var(--background-modifier-border)",
      borderRadius: "4px",
      background: "var(--background-primary)",
      color: "var(--text-normal)",
      fontFamily: "var(--font-text)",
      fontSize: "0.95em",
      resize: "vertical",
      boxSizing: "border-box",
      marginBottom: "12px",
    });

    // Focus and place cursor at end
    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
    });

    new Setting(contentEl)
      .addButton((btn) =>
        btn.setButtonText("Cancel").onClick(() => this.close())
      )
      .addButton((btn) =>
        btn
          .setButtonText("Save")
          .setCta()
          .onClick(() => {
            this.onSave(textarea.value.trimEnd(), this.character);
            this.close();
          })
      );
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
