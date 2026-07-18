# AH! Sprite Library

Drop a character folder in here, e.g.:

```
assets/sprites/Characters/Little MF/
  IDLE.png
  WALK.png
  ATTACK.png
  meta.json   (optional)
```

## meta.json (all fields optional)

```json
{
  "displayName": "Little MF",
  "palette": "Retro32",
  "pivot": [16, 58],
  "author": "Alter Hero"
}
```

## After adding files

1. Ask Claude (this chat) to regenerate `manifest.json` — never edit it by hand.
2. Commit and push:
   ```
   git add .
   git commit -m "Added Little MF sprites"
   git push
   ```
3. Refresh Sprite Studio — the new character shows up under LIBRARY automatically.

Categories beyond `Characters/` (Enemies/, Items/, FX/) can be added the same way whenever needed — just create the folder and tell Claude to include it next time it rebuilds the manifest.
