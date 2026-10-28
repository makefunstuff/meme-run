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

Everything is drawn by **three.js in one orthographic camera** as instanced textured quads:

- All art is vector-drawn on a 2D canvas **once at boot** and baked into three atlases
  (world 2048×3072, entities 2048×4096, text 2048×1024). Nothing is rasterised per frame.
- One instanced quad mesh per atlas page, one material for normal blending and one for additive
  (glow) — a full frame is **5 draw calls** and ~2k triangles with ~900 sprites on screen.
- The old build spent most of a frame in canvas-2D `createRadialGradient`, `shadowBlur`,
  `drop-shadow` and full-screen fills; those are now baked pixels, and the per-frame cost is
  ~1–2 ms of JS at 1080p with a chaos load.
- **DPR is capped** (1.5 high / 1.25 mid / 1.0 low) and an **auto governor** watches the real
  frame interval: over 33 ms for three half-second windows drops quality a notch, under 20 ms
  for ~12 s lifts it back. `AUTO GPU` is the default; force `HIGH`/`LOW` in the menu or with `Q`.

## Build

Single file, no runtime deps except the three.js module from the CDN import map.

```sh
./build.sh            # src/*.js + src/00-head.html -> index.html (node --check gate)
python3 -m http.server 8767   # then open http://127.0.0.1:8767/
```

`legacy/canvas-classic.html` is the original canvas-2D build, kept for comparison.

## Dev hooks

`window.MEMERUN` is telemetry (`stats()`, `env()`, `sprites()`, `quality('low'|'mid'|'high')`),
`window.MEMERUN.dev` is for tuning and screenshots (`mode`, `event`, `boss`, `bossKill`,
`weapon`, `pickup`, `meme`, `hole`, `hurtFx`, `die`, `distance`). Nothing in the game calls them.

PNL is fictional. So is the market. Do not send money to `$MOON`.
