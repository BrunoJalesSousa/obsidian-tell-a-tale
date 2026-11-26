export interface TellATaleSettings {
  characterTag: string;
  showAvatars: boolean;
  /**
   * Frontmatter property holding the avatar image (path or [[link]]), used when a note has no
   * "tat-avatar-" embed. Empty = embeds only (the default for installs that predate this setting).
   */
  avatarProperty: string;
}

export const DEFAULT_SETTINGS: TellATaleSettings = {
  characterTag: "dialogue-character",
  showAvatars: true,
  avatarProperty: "avatar",
};
