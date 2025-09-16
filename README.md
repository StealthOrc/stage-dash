# Stage Dash

The fastest way to lookup anything Sonic Adventure 2 related, making you dash from stage to stage.


## Gallery configuration (src/app/gallery.json)

The gallery and section dividers are driven by `src/app/gallery.json`. It defines:

- Characters: order of top-level sections, their icon, and the base directory that contains their stages under `public/stages/<character>/`.
- Stages: ordered list per character (`subs` array). Each stage has a name, a directory (relative to the character directory), and a stage icon.

Schema:

```json
{
  "Sonic": {
    "dir": "/public/stages/sonic/",
    "img": "/icons/SonicMap.png",
    "subs": [
      { "name": "City Escape", "dir": "city-escape", "img": "/icons/levels/city_escape_available.png" }
    ]
  }
}
```

- `dir`: Absolute path starting with `/public/...` that points to the character’s folder. Images are discovered recursively below this directory.
- `img`: Public path to the character divider icon (e.g. `/icons/SonicMap.png`).
- `subs[]`: Ordered stages for that character.
  - `name`: Display name for the stage divider.
  - `dir`: Folder name of the stage relative to the character’s `dir`.
  - `img`: Public path to the stage icon (e.g. `/icons/levels/city_escape_available.png`).

How it renders

1. The home page reads `gallery.json` server-side, in the order provided.
2. For each character, a divider row is inserted using `img` and the character name.
3. For each stage in `subs`, a stage divider is inserted using its `img` and `name`.
4. All images found under the stage directory are appended to the gallery after that divider.

Notes

- Reorder characters or stages by reordering keys and array items in `gallery.json`.
- To add a new stage, drop images into `public/stages/<character>/<stage>/...`, add a stage entry to `subs`, and provide an icon path.
- Icons are served from `public/` (e.g. `/icons/...` or `/icons/levels/...`).

## Development

Prerequisites: Bun installed (`https://bun.sh`).

Run locally:

```bash
bun install
bun run dev
```

Then open `http://localhost:3000`.

## Credits

Big thanks to.. 
- the [Sonic Adventure 2 Achipelago Wiki](https://sa2archipelago.miraheze.org/) for the great Wiki and inspiring me to do this!
- [@PoryGone](https://github.com/PoryGone) for the [SA2B_Archipelago Mod](https://github.com/PoryGone/SA2B_Archipelago) and the [SA2B_AP_Tracker](https://github.com/PoryGone/SA2B_AP_Tracker) for the icons (and a great [poptracker](https://poptracker.github.io/) pack)!
- The whole [Archipelago Community](https://archipelago.gg/) and the [Archipelago Discord](https://discord.com/invite/8Z65BR2) for making Archipelago and in turn even this possible in the first place - You're great! Big thanx! <3