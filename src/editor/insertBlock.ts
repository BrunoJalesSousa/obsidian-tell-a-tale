import { Editor } from "obsidian";
import { BlockType, Character } from "../types";

export function insertBlock(
  editor: Editor,
  type: BlockType,
  character?: Character,
  title?: string
): void {
  const cursorLine = editor.getCursor().line;
  const lineContent = editor.getLine(cursorLine);
  const insertPos = { line: cursorLine, ch: lineContent.length };
  const prefix = lineContent.trim() === "" ? "" : "\n";

  let block = "";

  switch (type) {
    case "tat-dialogue": {
      block = character
        ? `> [!tat-dialogue|${character.id}] ${character.name}\n> `
        : `> [!tat-dialogue]\n> `;
      break;
    }
    case "tat-monologue": {
      block = character
        ? `> [!tat-monologue|${character.id}] ${character.name}\n> `
        : `> [!tat-monologue]\n> `;
      break;
    }
    case "tat-narration": {
      block = `> [!tat-narration]\n> `;
      break;
    }
    case "tat-direction": {
      block = `> [!tat-direction]\n> `;
      break;
    }
    case "tat-cast": {
      block = `> [!tat-cast] ${title || "Cast Change"}\n> `;
      break;
    }
  }

  const insertText = prefix + block;
  editor.replaceRange(insertText, insertPos);

  const insertedLines = insertText.split("\n");
  const newLine = cursorLine + insertedLines.length - 1;
  const newCh = insertedLines[insertedLines.length - 1].length;
  editor.setCursor({ line: newLine, ch: newCh });
  editor.focus();
}
