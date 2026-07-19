/* ============================================================================
   AH!rchives — HOME PAGE CONTROLS   ✎ this is the ONLY file you edit
   ----------------------------------------------------------------------------
   HOW TO USE:
     1. Change any number below.
     2. Save this file  (⌘S).
     3. Refresh home.html in the browser  (⌘R).
   You never need to open home.html. Every line here has a comment telling you
   what it does and its default number, so you can always put it back.

   POSITION x / y  →  a NUDGE in pixels from where the thing already sits.
                      x: – = left,  + = right      y: – = up,  + = down
   SCALE           →  size. whole numbers (2, 3) keep the pixel art crispest.
   FPS             →  animation speed, in frames per second (higher = faster).
   ============================================================================ */
window.AH_PARAMS = {

  /* ───────────── LOGO  (the graffiti mark at the top) ───────────── */
  logo: {
    size:  184,    // biggest width it can reach, in px          (default 184)
    scale: 1.00,   // overall multiplier — 1.2 = 20% bigger       (default 1.00)
    x:     0,      // nudge left / right, in px                   (default 0)
    y:     13.4,   // distance down from the top, in vh (screen-height %)  (default 13.4)
  },

  /* ───────────── SPEECH BUBBLE  (the pixel dialogue box) ───────────── */
  /* one setting, shared by all three characters' bubbles */
  bubble: {
    scale: 2.0,    // bubble size — 2 = current, 2.5 = bigger      (default 2.0)
    x:     0,      // nudge left / right, in px                    (default 0)
    y:     14,     // gap above the character's head, in px        (default 14)
  },

  /* ───────────── FADE when NOT hovered ───────────── */
  /* every character RESTS at this opacity; the one you hover / tap lights up to full */
  fadeWhenNotOver: 0.5,   // 0 = invisible until hovered … 1 = no fade (always full)   (default 0.28)

  /* ───────────── THE THREE CHARACTERS ─────────────
     Each one has a RESTING look and an "over" look (while hovered / tapped).
     Set the resting numbers, then set `over` for how it changes on hover.    */

  MF: {                                   // littleMF — the small one on the LEFT
    x: 0,   y: 0,   scale: 2,   fps: 13.8,
    over: { x: 0, y: 0, scale: 2.12, fps: 13.8 },   // while hovered / tapped
  },

  WB: {                                   // WalkBoy — the one in the MIDDLE
    x: 0,   y: 0,   scale: 3,   fps: 13.3,
    over: { x: 0, y: 0, scale: 3.18, fps: 13.3 },
  },

  GIANT: {                                // GIANT — the tall one on the RIGHT
    x: 0,   y: 0,   scale: 3,   fps: 11.4,
    over: { x: 0, y: 0, scale: 3.18, fps: 11.4 },
  },

  /* ───────────── MOON BOUNCE  (drops from the sky when WalkBoy is hovered / tapped) ───────────── */
  moon: {
    gravity:     225,   // speed of the DESCENT from the sky — higher = drops faster                (beach-ball drift; was 700)
    floatSpeed:  0.85,  // levitation bob speed once it settles — lower = slower & dreamier          (0.85 ≈ ~3.7s float)
    floatHeight: 4.5,   // how far it drifts up & down while floating, in px — small = subtle        (default 6)
  },

  /* ───────────── SOUNDTRACK  (littleMF's world — the BEAH!TS player) ─────────────
     Drop your audio files in assets/ (or an assets/tracks/ folder) and list them below.
     Each track: { title: "name shown", src: "assets/your-file.mp3" }  · order = play order.
     Leave src "" and the track shows as "soon" (greyed) until you add the file. */
  music: {
    tracks: [
      { title: "Side A — the ascent",  src: "" },   // ← e.g. "assets/tracks/side-a.mp3"
      { title: "Side B — the archive", src: "" },
    ],
  },

};
