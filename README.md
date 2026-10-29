# MEME RUN

Endless auto-runner brainrot shooter with an open market. Modes, weapons, reality events, a boss,
and a P&L that means nothing.

**Live:** https://makefunstuff.github.io/meme-run/

## Controls

- **Desktop:** `SPACE` / `↑` / `W` jump, hold `F` (or `J`) to shoot.
- **`V`** fps meter (real frame interval, quad count, render size). **`Q`** cycles GPU quality: `AUTO → HIGH → LOW`.
- **Phone:** tap the left half to jump, hold the right half (or **SHOOT**) to fire.

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

- Player, every meme, every bullet, pickup, obstacle and the boss are built from boxes,
  icosahedra, capsules, cylinders and cones. Under the orthographic camera a part seen face-on is a
  flat shape — circle, square, triangle — while the extruded sides read as volume, so it looks 2D
  without ever drawing a 2D sprite at runtime.
- Shading is baked into vertex colours as **three flat cel bands** from a fixed light direction, and
  every part carries an inflated ink-coloured shell, so silhouettes get a solid cartoon outline.
  A kit's triangles are ordered shell-first, body-after: that is a painter's algorithm for a sticker,
  which is why the renderer needs no depth buffer at all.
- One kit type = one `InstancedMesh` = one draw call (~93 kit types, ~65 of them live in a chaos
  frame). Tint is per instance (hit flash blows the band colours out), opacity is per kit
  (invulnerability flicker).
- The parallax world, clouds, sun, particles, glow, shadows, muzzle flash and label chips are still
  vector-drawn once at boot into atlases. The old build spent most of a frame in canvas-2D
  `createRadialGradient`, `shadowBlur`, `drop-shadow` and full-screen repaints; those are baked
  pixels now, and the per-frame cost is ~2–5 ms of JS at 1080p with a chaos load.
- **DPR is capped** (1.5 high / 1.25 mid / 1.0 low) and an **auto governor** watches the real frame
  interval: over 33 ms for three half-second windows drops quality a notch, under 20 ms for ~12 s
  lifts it back. `AUTO GPU` is the default; force `HIGH`/`LOW` in the menu or with `Q`.

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
