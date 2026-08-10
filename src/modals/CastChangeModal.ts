import { App, Modal, Setting, Editor } from "obsidian";
import TellATalePlugin from "../main";
import { insertBlock } from "../editor/insertBlock";

export class CastChangeModal extends Modal {
  private plugin: TellATalePlugin;
  private editor: Editor;
  private description = "";

  constructor(app: App, plugin: TellATalePlugin, editor: Editor) {
    super(app);
    this.plugin = plugin;
    this.editor = editor;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Cast Change" });

    new Setting(contentEl)
      .setName("Description")
      .setDesc('e.g. "Carol enters the scene" or "Bob leaves"')
      .addText((text) =>
        text
          .setPlaceholder("What changed?")
          .onChange((value) => {
            this.description = value;
          })
      );

    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText("Insert")
        .setCta()
        .onClick(() => {
          insertBlock(
            this.editor,
            "tat-cast",
            undefined,
            this.description || "Cast Change"
          );
          this.close();
        })
    );
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
