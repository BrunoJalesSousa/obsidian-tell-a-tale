import { App, FuzzySuggestModal } from "obsidian";
import { Character } from "../types";

const ANONYMOUS = { id: "", name: "— no character —", color: "", noteLink: undefined, avatarPath: undefined } as const;

export class CharacterPickerModal extends FuzzySuggestModal<Character | typeof ANONYMOUS> {
  private characters: Character[];
  private onChoose: (character: Character | null) => void;

  constructor(
    app: App,
    characters: Character[],
    onChoose: (character: Character | null) => void
  ) {
    super(app);
    this.characters = characters;
    this.onChoose = onChoose;
    this.setPlaceholder("Who is speaking?");
  }

  getItems(): (Character | typeof ANONYMOUS)[] {
    return [ANONYMOUS, ...this.characters];
  }

  getItemText(item: Character | typeof ANONYMOUS): string {
    return item.name;
  }

  onChooseItem(item: Character | typeof ANONYMOUS): void {
    this.onChoose(item === ANONYMOUS ? null : item);
  }
}
