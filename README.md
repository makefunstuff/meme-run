# MEME RUN

An endless brainrot shooter about outrunning the feed. **The playable build on
GitHub Pages is now the Godot version** (`godot/`); the three.js build that came
before it is preserved at `legacy/threejs.html`.

- Play: <https://makefunstuff.github.io/meme-run/>
- Godot source: `godot/` (open the folder in the Godot editor)
- Web export: `web/` (regenerate with `godot/export.sh`)
- Previous three.js build: `legacy/threejs.html`, sources in `src/`, `./build.sh`

## The Godot edition

Rebuilt from scratch in Godot 4.7 rather than ported, because most of what made
the old build feel clunky was structural.

**Mechanics**
- Auto-run, but the control is real: coyote time, a jump buffer, variable jump
  height, a double jump, a dash with invulnerability frames, and air control
  that steers. Landing and jumping squash the character.
- Nine weapons with genuinely different feel — the shotgun knocks you backwards,
  the laser pierces, the rocket explodes, the void orb pulls, the crew round
  homes. Ammo runs out and drops you back to the blaster.
- Seven enemy archetypes with distinct rules, not reskins: walkers, sine-wave
  flyers, chargers that telegraph and then dash, shooters that keep a firing
  distance, brutes, splitters that break into two on death, and drifters.
- A boss on a cadence with three phases. Every attack is telegraphed — the eye
  narrows before a volley, the phone tilts before a dive — so the fight is
  readable rather than arbitrary.
- Combo multiplier, magnetised coins, pickups, four modes with their own pacing.

**Feel**
- Hitstop on heavy hits (wall-clock based, so it cannot scale itself), camera
  shake that moves the backdrop too, screen-edge flash on damage, muzzle light,
  shell casings, squash and stretch.
- Floating damage and P&L numbers, particle bursts per event rather than one
  generic puff.

**Graphics — you are inside the feed**
The first pass was pastel hills over a grass-and-dirt strip: the default
platformer look, and it said nothing about the game. The world was rebuilt around
the subject instead.

- **The sky is a feed.** A saturated sunset gradient with a halftone dot screen,
  drifting scanlines, a LIVE badge with a ticking viewer count, and rows of
  distant post cards — photo block, caption bars and all — falling away into the
  dark. The parallax layers are content, not scenery.
- **The floor is a timeline.** The player runs along a scrubber: a mint "now"
  line, tick marks, live candlesticks, a playhead, a price ticker underneath, and
  the app panel below it with a tab bar and a scrub handle reading the run
  percentage. A reaction rail (like/comment/share/coin with counts) hangs down
  the right edge.
- **The cast is die-cut stickers.** Every character and pickup gets a thick white
  border under its ink outline, so it reads as a cut-out pasted onto the feed.
  One flag in `toy.gd`, no shader.
- No imported art at all: everything is drawn from arcs, rounded rectangles and
  polygons (`godot/src/toy.gd`). Tiny download, crisp at any resolution, and one
  palette table re-skins the game — which is how the four modes differ.

**Engineering**
- Deterministic, hand-rolled collision and movement (no physics bodies), which
  keeps the feel tunable and the build tiny.
- `game.gd` owns the run; entities are plain `Node2D`s reporting to it.
- A capture harness (`--shot=`, `--seq=`, `--spawn=`) so frames can be reviewed
  headlessly without a compositor.

**Web export notes**
- Built for the Compatibility renderer on purpose: Forward+ does not exist in
  WebGL2.
- `variant/thread_support=false`, because the threaded build needs COOP/COEP
  headers (`SharedArrayBuffer`) and GitHub Pages cannot send them.


## Controls (Godot edition)

| Input | Action |
| --- | --- |
| `A` / `D`, arrows | move (you auto-run; this steers and brakes) |
| `SPACE` / `W` | jump, then double jump |
| `SHIFT` | dash (brief invulnerability) |
| `J` / `F` / left click | shoot (auto-aims at the nearest threat) |
| `ESC` / `P` | pause |
| `1`-`4` in the menu | pick a mode |
| `ENTER` | start / restart |

## Previous: the three.js edition

Everything below describes `legacy/threejs.html` and the `src/` sources. It is kept
for reference; the Godot build above is the shipping game.

## Modes

| mode | what it does |
|---|---|
| **CLASSIC** | the standard doomscroll |
| **DEGEN** | market is open: degen memes, market events, leverage, diamond hands, 2× coin |
| **CHAOS** | 1.75× spawn density, faster, events every ~9s |
| **OHIO** | neon night palette, heavy gravity, events every ~6s |
| **ZEN** | no damage, no score recorded — just vibes |

## The degen economy

Score is **PNL**, shown as `$` in the HUD, paid out as a **WAGMI BAG** on death.

- **Coins / bags** fill the bag; the market ticker at the bottom of the screen is a live random
  walk of `$MOON`, `$SUS`, `$PEPE`, `$SHIB`, `$WIF`, `$BONK`, `$OHIO`, `$RIZZ`, `$NPC` and moves P&L with it.
- **Leverage** (pickup): 5s of ×3 bullets and ×2 P&L.
- **Diamond hands** (pickup): 6s of invulnerability, and you cannot be liquidated.
- **Advisory** (pickup): a random degen tip that is definitely not financial advice.
- **Market events**: `RUG PULL` (gravity flips, screen glitches, you are the exit liquidity),
  `MARKET CRASH` (wind shoves you backwards), `TO THE MOON` (near-zero gravity + coin rain),
  `PUMP THE DIP`, `AIRDROP`, `WHALE DUMP`, `BULL RUN`.
- **Degen content**: PEPE, SHIB, WIF, BONK, WHALE, ROCKET, CANDLE, DIAMOND HANDS, RUG PULL,
  MONEY PRINTER, MOON and LIQUIDATION ENGINE obstacles, ATM pickups, `RUG` / `SO MID` / `NO CAP` signage.
- **Weapons**: BLASTER (infinite), BREAD (4-slice spread), PRISM (piercing laser),
  PUMP (growing blob that blasts on impact), LEVERAGE (piercing 5-dmg kick), MOONSHOT (lifting rocket),
  AIRDROP (5-coin spread), VOID (orbs that collapse into black holes that suck memes in),
  SUS (homing crewmates).
- **Boss: THE ALGORITHM** — crowned phone with a giant eye, orbiting notification badges, loading bar.
  Kill it for +400 aura, a screen clear and a realised gain.

## Rendering

**The cast is 3D primitives, the world is baked pixels, one orthographic camera looks at both.**

- Player, every meme, every bullet, pickup, obstacle and the boss are built from **pillow
  primitives**: a rounded box, a smooth ball and a smooth capsule, generated from an icosphere with
  analytic smooth normals (plus faceted prisms for gems and blades). Under the orthographic camera a
  part seen face-on is a flat shape — circle, square, pill — while the extruded sides read as volume,
  so it looks 2D without ever drawing a 2D sprite at runtime. They read as moulded plastic toys.
- Shading is baked into vertex colours: **four cel bands** from a fixed key light (warm key, neutral
  mid, cool fill, deep underside), **contact darkening** toward the bottom of every part, and a
  **rim highlight** on the edge away from the key. Every part carries an inflated ink-coloured shell
  whose width scales with the part, so a pupil does not get the outline of a torso; face features
  opt out with `ink: 0` and stay crisp. Faces are shared furniture (`eyePair`, `mouth`, `blush`,
  `feet`, `ears`) so the cast reads as one toy line.
  A kit's triangles are ordered shell-first, body-after: that is a painter's algorithm for a sticker,
  which is why the renderer needs no depth buffer at all.
- **The frame goes through a post chain** (`src/16-post.js`). The world renders into an HDR,
  MSAA'd, supersampled target; a bright pass feeds a two-level separable blur for bloom; a composite
  pass then does the grade — a soft highlight shoulder so stacked additive light rolls to white
  instead of clipping, a gentle S-curve, a two-light lift/gain per mode, vibrance, a tinted vignette
  and film grain that doubles as dither against 8-bit sky banding. Slight lateral chromatic
  aberration is driven by shake and damage, so a hit registers in the lens as well as in the world.
  Colour management is switched off end to end (`THREE.ColorManagement.enabled = false`) because the
  atlas art is authored in display space: that keeps the offscreen target and the canvas meaning the
  same thing, so what the artist tuned is what ships.
- **MSAA is on** (`antialias: true`): a hard pixel edge on every primitive silhouette is what makes
  geometry look cheap.
- One kit type = one `InstancedMesh` = one draw call (~93 kit types, ~65 of them live in a chaos
  frame). Tint is per instance (hit flash blows the band colours out), opacity is per kit
  (invulnerability flicker).
- The world is baked pixels: a sunlit turf edge over laid soil, strata that tile without a seam,
  ridge-lit hills and mounds, a horizon haze in the colour of the sky's lowest stop, and a screen
  bottom falling into shadow. Each mode re-lights the same baked art by tint (sky, layers, ground
  and sun all move in one colour family), so DEGEN is green and OHIO is neon rather than a filter.
- The parallax world, clouds, sun, particles, glow, shadows, muzzle flash and label chips are
  vector-drawn once at boot into atlases. The old build spent most of a frame in canvas-2D
  `createRadialGradient`, `shadowBlur`, `drop-shadow` and full-screen repaints; those are baked
  pixels now, and the per-frame cost is ~2–5 ms of JS at 1080p with a chaos load.
- **DPR is capped** (1.5 high / 1.25 mid / 1.0 low) and an **auto governor** watches the real frame
  interval: over 33 ms for three half-second windows drops quality a notch, under 20 ms for ~12 s
  lifts it back. `AUTO GPU` is the default; force `HIGH`/`LOW` in the menu or with `Q`.

## UI

One dark glass panel system: mint is the signal colour, gold the money, red the loss, and every
number is tabular mono so the HUD never jitters as it ticks.

- The HUD is **one instrument strip** with divided cells — P&L as the hero cell with a ▲/▼ delta that
  ticks on change, metres, bag, hearts (SVG mask), weapon — not a bag of floating chips.
- Menu and death screen are the same card: accent bar, live eyebrow, a 3-column grid where the
  sixth cell is the GPU segmented control, one primary CTA, `kbd` hints (hidden on touch), and a
  4-cell ledger on the death screen. The strip sheds its least useful cells as the viewport narrows.
- Banner is a skewed ribbon (gold in, mint out), the toast is a pill with an accent edge, the boss
  bar is a panel with a name plate and a glowing track, the ticker has a LIVE tag and scrolls.

## Build

Single file, no runtime deps except the three.js module from the CDN import map.

```sh
./build.sh            # src/*.js + src/00-head.html -> index.html (node --check gate)
python3 -m http.server 8767   # then open http://127.0.0.1:8767/
```

`legacy/canvas-classic.html` is the original canvas-2D build, kept for comparison.

## Dev hooks

`window.MEMERUN` is telemetry (`stats()` — including `kits`, `kitN`, `kitDraws`, `draws`, `tris`,
`frameMs` — plus `env()`, `sprites()`, `kits()`, `quality('low'|'mid'|'high')`).
`window.MEMERUN.dev` is for tuning and screenshots (`mode`, `event`, `boss`, `bossKill`, `weapon`,
`pickup`, `meme`, `hole`, `hurtFx`, `die`, `distance`, `quality`, `gallery`, `layout`, `kitNames`,
`kitDrop`, `atlasCanvas`, `_g`). `dev.gallery(names)` draws any kit or sprite through the real
render path in a labelled grid — that is how the cast gets reviewed. Nothing in the game calls them.

PNL is fictional. So is the market. Do not send money to `$MOON`.
