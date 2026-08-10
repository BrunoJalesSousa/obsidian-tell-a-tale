import { Character } from "../types";

const STYLE_ID = "tell-a-tale-character-styles";

export function injectCharacterStyles(characters: Character[]): void {
  let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = STYLE_ID;
    document.head.appendChild(styleEl);
  }

  const css = characters
    .map((char) => {
      const color = char.color.startsWith("#") ? char.color : "#7c7c7c";
      return `
        .callout[data-callout="tat-dialogue"][data-callout-metadata="${char.id}"],
        .callout[data-callout="tat-monologue"][data-callout-metadata="${char.id}"] {
          --tat-char-color: ${color};
          --tat-char-bg: ${color}18;
        }
      `;
    })
    .join("\n");

  styleEl.textContent = css;
}

export function removeCharacterStyles(): void {
  document.getElementById(STYLE_ID)?.remove();
}
