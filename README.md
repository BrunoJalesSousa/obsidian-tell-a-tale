# Tell-A-Tale

An Obsidian plugin for storytelling — write dialogue, monologue, narration, and scene direction with structured, visually distinct blocks. The objective was to put together a way to speedup dialogue construction while keeping it visually telling.

---

## Features

- **Five block types** — dialogue, monologue, narration, direction, and cast change
- **Character-aware dialogue** — pick who's speaking from a fuzzy search picker
- **Per-character colors** — dialogue and monologue blocks are color-coded by character
- **Character avatars** — portrait images shown beside blocks in reading view
- **Edit and delete actions** — hover any block to edit or remove it
- **Keyboard shortcuts** for every block type

---

## Installation

### From Obsidian Community Plugins (recommended)
1. Open Obsidian → Settings → Community Plugins → Browse
2. Search for **Tell-A-Tale**
3. Install and enable

## Setup

### Add characters

Characters are discovered from your vault automatically — no manual entry needed.

1. Create a note for each character (e.g. `Alice.md`)
2. Add the character tag to the note's properties (default tag: `dialogue-character`)
3. Optionally add frontmatter properties:
   - `name` — display name shown in blocks and the picker (defaults to filename)
   - `color` — hex color used to tint their blocks, e.g. `#e06c75`

```yaml
---
tags:
  - dialogue-character
name: Alice
color: "#e06c75"
---
```

The character's **ID** is derived automatically from the filename (lowercased, spaces become dashes). A file named `Lord Valen.md` gets the ID `lord-valen`.

You can change the tag Tell-A-Tale looks for in **Settings → Tell-A-Tale → Character tag**.

### Add an avatar

Embed an image in the character's note with a filename starting with `tat-avatar-`:

```markdown
![[tat-avatar-alice.png]]
```

Any image format Obsidian supports works. Avatars appear beside dialogue and monologue blocks when **Show avatars** is enabled in settings.

---

## Block Types

All blocks are stored as Obsidian callouts, so they're readable as plain Markdown even without the plugin.

### Dialogue
A spoken line by a named character.

```
> [!tat-dialogue|alice] Alice
> "I've been waiting for you."
```

**Shortcut:** `Ctrl+Shift+D` / `Cmd+Shift+D`

Opens a fuzzy picker to choose who is speaking. Select **— no character —** for unattributed dialogue.

---

### Monologue
An inner thought — same picker as dialogue, styled in italic with a tinted background.

```
> [!tat-monologue|lord-valen] Lord Valen
> *She knows. She has to know.*
```

**Shortcut:** `Ctrl+Shift+M` / `Cmd+Shift+M`

---

### Narration
Third-person narration. Inserts immediately with no picker.

```
> [!tat-narration]
> The tavern fell silent. Even the fire seemed to hold its breath.
```

**Shortcut:** `Ctrl+Shift+O` / `Cmd+Shift+O`

---

### Direction
Stage or visual directions — scenery, lighting, atmosphere, camera notes. Rendered small and muted so it doesn't interrupt reading flow.

```
> [!tat-direction]
> Warm amber lighting. Low music fades as Alice stands.
```

**Shortcut:** `Ctrl+Shift+G` / `Cmd+Shift+G`

---

### Cast Change
Marks a shift in who is present in the scene. Rendered as a centered annotation.

```
> [!tat-cast] Carol enters through the back door
```

**Shortcut:** `Ctrl+Shift+A` / `Cmd+Shift+A`

A modal asks for a short description of the change.

---

## Keyboard Shortcuts

| Action | Windows / Linux | Mac |
|---|---|---|
| Insert Dialogue | `Ctrl+Shift+D` | `Cmd+Shift+D` |
| Insert Monologue | `Ctrl+Shift+M` | `Cmd+Shift+M` |
| Insert Narration | `Ctrl+Shift+O` | `Cmd+Shift+O` |
| Insert Direction | `Ctrl+Shift+G` | `Cmd+Shift+G` |
| Insert Cast Change | `Ctrl+Shift+A` | `Cmd+Shift+A` |

To remap any shortcut: **Settings → Hotkeys → search "Tell-A-Tale"**.

---

## Example Document

```markdown
> [!tat-direction]
> Dimly lit. Rain against the windows. A single candle on the table.

> [!tat-narration]
> The door opened slowly. Alice stepped inside, shaking water from her cloak.

> [!tat-dialogue|lord-valen] Lord Valen
> "You're late."

> [!tat-monologue|alice] Alice
> *Don't let him see you're nervous.*

> [!tat-dialogue|alice] Alice
> "The roads were bad. It happens."

> [!tat-cast] Carol enters through the back door

> [!tat-dialogue|alice] Alice
> "Carol. I wasn't expecting you."
```

---

## Development

```bash
git clone https://github.com/BrunoJalesSousa/obsidian-tell-a-tale
cd obsidian-tell-a-tale
npm install

# Watch mode (dev)
npm run dev

# Production build
npm run build
```

After building, copy `main.js`, `styles.css`, and `manifest.json` to your vault's `.obsidian/plugins/tell-a-tale/` folder.

---

## License

MIT
