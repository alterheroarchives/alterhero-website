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
  fadeWhenNotOver: 0.75,   // 0 = invisible until hovered … 1 = no fade (always full)   (default 0.28)

  /* ───────────── THE THREE CHARACTERS ─────────────
     Each one has a RESTING look and an "over" look (while hovered / tapped).
     Set the resting numbers, then set `over` for how it changes on hover.    */

  MF: {                                   // littleMF — the small one on the LEFT
    x: 0,   y: 0,   scale: 2,   fps: 13.8,
    over: { x: 0, y: 0, scale: 2.1, fps: 13.8 },   // while hovered / tapped — scale matches resting, no size change
  },

  WB: {                                   // WalkBoy — the one in the MIDDLE
    x: 0,   y: 0,   scale: 3,   fps: 13.3,
    over: { x: 0, y: 0, scale: 3.2, fps: 13.3 },
  },

  GIANT: {                                // GIANT — the tall one on the RIGHT
    x: 0,   y: 0,   scale: 3,   fps: 11.4,
    over: { x: 0, y: 0, scale: 3.05, fps: 11.4 },
  },

  /* ───────────── CLOUDS  (blow in from the right when GIANT is hovered / tapped) ───────────── */
  clouds: {
    enterDuration:  7,      // seconds for the fast blow-in from off-screen right                        (default 7)
    cruiseDuration: 15,     // seconds for the slow drift afterward, once it settles — was 51, sped up because that pace was too slow to render smoothly (default 51)
    startOffset:    150,    // how far right (px) it starts, past its resting spot                        (default 150)
    driftDistance:  120,    // how far left (px) it drifts during the slow cruise                         (default 120)
    frontSpeedBoost: 0.02,  // the front (darker) cloud runs this much faster — parallax edge              (default 0.02 = 2%)
  },

  /* ───────────── CAR / VAN  (drives in from the left when littleMF is hovered / tapped) ───────────── */
  car: {
    duration: 1.5,   // seconds for the drive-in, braking to a stop                                       (default 1.5)
  },

  /* ───────────── MOON BOUNCE  (drops from the sky when WalkBoy is hovered / tapped) ─────────────
     Falls from the sky (3-stage gravity) to FLOOR 1 behind the logo, plays its own bounce rhythm there,
     hops DOWN to FLOOR 2 (closer to WalkBoy) with its own independent rhythm, then RISES back up to
     floor1 at a constant staged speed — repeating for as long as WalkBoy stays hovered. */
  moon: {
    /* the TWO landing positions */
    floor1Offset: -8,      // px nudge from the logo's measured bottom — negative = up, positive = down       (default -8)
    floor2Fraction: 0.444, // how far along the gap between the logo and WalkBoy's head floor2 sits, 0–1      (default 0.333 ≈ 1/3)

    /* sky → floor1: 3-stage gravity, staged by SHARE of the fall (not raw %) */
    descentGravity1: 900,  // fall speed for the FIRST portion of the sky→floor1 descent                    (default 700)
    descentGravity2: 425,  // fall speed for the MIDDLE portion                                            (default = same as descentGravity1)
    descentGravity3: 225,  // fall speed for the LAST portion — lower = smoother landing                   (default = same as descentGravity2)
    descentStage1: 0.30,   // SHARE of the fall using descentGravity1                                      (default 0.25)
    descentStage2: 0.30,   // SHARE using descentGravity2                                                  (default 0.50)
    descentStage3: 0.40,   // SHARE using descentGravity3 — don't need to add to 1, auto-normalized        (default 0.25)

    /* FLOOR 1 (behind the logo) — first stop, one shared height across all its swings */
    firstMoveSpeed: 1.8,   // speed of the VERY FIRST down-up swing, right after it lands                 (default = same as firstCycleSpeed)
    firstCycleSpeed: 1.4,  // speed of the SECOND down-up swing                                           (default = same as floatSpeed)
    floatSpeed:  1.2,      // dip+bob speed for every swing after the first two — lower = slower, dreamier (default 1)
    floatHeight: 5,        // how far it dips down / drifts while floating, in px — shared by all floor1 swings (default 6)
    bounceCount: 4,        // how many float cycles at FLOOR 1 before it hops down to floor2               (default 4)

    /* the HOP down to floor2 — constant speed per stage (not accelerating gravity — over a short hop,
       momentum from stage 1 would drown out stages 2/3), staged by FIXED PIXEL distance into the hop */
    toFloor2Speed1: 150,   // speed for the FIRST portion of the hop down (see toFloor2Break1/2 below)     (default = same as ascentSpeed1)
    toFloor2Speed2: 200,   // speed for the MIDDLE portion                                                (default = same as toFloor2Speed1)
    toFloor2Speed3: 300,   // speed for the LAST portion — lower = smoother arrival at floor2             (default = same as toFloor2Speed2)
    toFloor2Break1: 15,    // px INTO the hop where it switches from speed1→speed2                        (default 15)
    toFloor2Break2: 30,    // px INTO the hop where it switches from speed2→speed3                        (default 30)

    /* FLOOR 2 (second position, closer to WalkBoy) — fully independent from floor1: own speed AND height
       for each swing */
    floor2MoveSpeed: 1.5,    // speed of floor2's VERY FIRST down-up swing after arriving                 (default = same as floor1's)
    floor2MoveHeight: 7,     // height of that first swing, in px                                         (default = same as floor1's)
    floor2CycleSpeed: 1.5,   // speed of floor2's SECOND down-up swing                                    (default = same as floor1's)
    floor2CycleHeight: 5,    // height of that second swing, in px                                        (default = same as floor1's)
    floor2FloatSpeed: 1.3,   // speed of every floor2 swing after the first two                           (default = same as floor1's)
    floor2FloatHeight: 6,    // height of those steady swings, in px                                      (default = same as floor1's)
    floor2BounceCount: 5,    // how many float cycles at FLOOR 2 before it rises back up to floor1        (default = same as floor1's)

    /* the RISE back up to floor1 — a constant-speed climb (not gravity, nothing pulls it up), staged by
       FIXED PIXEL distance into the rise, same idea as the hop above */
    ascentSpeed1: 80,    // speed for the FIRST portion of the rise (see ascentBreak1/2 below)             (default 120)
    ascentSpeed2: 250,   // speed for the MIDDLE portion                                                  (default = same as ascentSpeed1)
    ascentSpeed3: 180,   // speed for the LAST portion                                                    (default = same as ascentSpeed2)
    ascentBreak1: 15,    // px INTO the rise where it switches from speed1→speed2                        (default 15)
    ascentBreak2: 30,    // px INTO the rise where it switches from speed2→speed3                        (default 30)
  },

  /* ───────────── SOUNDTRACK  (littleMF's world — the BEAH!TS player) ─────────────
     Drop your audio files in assets/ (or an assets/tracks/ folder) and list them below.
     Each track: { title: "name shown", src: "assets/your-file.mp3" }  · order = play order.
     Leave src "" and the track shows as "soon" (greyed) until you add the file. */
  music: {
    tracks: [
      { title: "ODB",         src: "assets/tracks/ODB.wav" },
      { title: "Manège",      src: "assets/tracks/MANEGE.wav" },
      { title: "Goodbye SIM", src: "assets/tracks/GoodbyeSIM.wav" },
      { title: "Sleep",       src: "assets/tracks/SLEEP.wav" },
      { title: "FAReast",     src: "assets/tracks/FAReast.wav" },
    ],
  },

};
