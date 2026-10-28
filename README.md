# MEME RUN

An endless auto-runner brainrot shooter with modes, weapons, random reality events and a boss.

**Live:** https://makefunstuff.github.io/meme-run/

## Controls

- **Desktop:** `SPACE` / `↑` / `W` jump, hold `F` (or `J`) to shoot.
- **Phone:** tap the left half to jump, hold the right half (or **SHOOT**) to fire.

## Modes

| mode | what it does |
|---|---|
| **CLASSIC** | the standard doomscroll |
| **CHAOS** | 1.75× spawn density, faster, events every ~9s |
| **OHIO** | neon night palette, heavy gravity, events every ~6s |
| **ZEN** | no damage, no score recorded — just vibes |

## Content

- **19 meme enemies**, each hand-drawn with its own silhouette: SUS crewmates, NPC, Skibidi toilet, DOGE, BRAINROT, RIZZ crown, OHIO portal, TOUCH GRASS, RATIO, FANUM TAX, RICKROLL, MEWING, GYATT megaphone, THIS IS FINE, BIRDACCINO, GIGACHAD and the ranged **SPAM BOT** that fires notifications at you.
- **5 weapons**: BLASTER (infinite), BREAD (4-slice spread), PRISM (piercing laser), VOID (orbs that collapse into black holes which suck in memes) and SUS (homing crewmates). Weapon crates drop from `patCrate` spawns.
- **8 random events** with a banner announcement: MOON GRAVITY, HEAVY DAY, GRAVITY FLIP (stand on the ceiling), MEME RAIN, BULLET TIME, FANUM FRENZY, TOUCH GRASS, OHIO LEAK (RGB glitch).
- **Boss: THE ALGORITHM** — a crowned phone with a giant eye, orbiting notification badges and a loading bar. It fires downvotes and spawns minion drops every ~1150 m. Kill it for +400 aura and a screen clear.
- Obstacles: spike crates, buzzsaws, traffic cones, 404 monitors, NFT frames.
- Combo multiplier, aura/rizz/brain pickups, screen shake, hit-stop, slow-mo death, procedural WebAudio SFX, local best score.

## Run locally

```bash
python3 -m http.server 8767   # then open http://127.0.0.1:8767/
```

Single file, no build step.
