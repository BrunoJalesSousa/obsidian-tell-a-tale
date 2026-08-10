export interface Character {
  id: string;
  name: string;
  color: string;
  noteLink?: string;
  avatarPath?: string;
}

export type BlockType =
  | "tat-dialogue"
  | "tat-monologue"
  | "tat-narration"
  | "tat-direction"
  | "tat-cast";
