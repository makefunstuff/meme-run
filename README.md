# MEME RUN

An endless auto-runner brainrot shooter. The algorithm is chasing you: outrun it, shoot the memes, steal the aura back.

## Play

**Live:** https://makefunstuff.github.io/meme-run/

- **Desktop:** `SPACE` / `↑` / `W` to jump, hold `F` (or `J`) to shoot.
- **Phone:** tap the left half of the screen to jump, hold the right half (or the **SHOOT** button) to fire. Big JUMP / SHOOT buttons appear on touch devices.

## What is in it

- Hand-drawn canvas art, no assets: sticker-outlined characters, gradient skies, layered parallax world (hills, monuments, clouds with faces, eyeballs with lashes, god rays, buried crystals).
- 14 distinct meme enemies (SUS crewmates, NPC, SKIBIDI toilet, DOGE, BRAINROT, RIZZ crown, OHIO portal, TOUCH GRASS, RATIO, FANUM TAX, RICKROLL, MEWING) with auto-aim gunfire.
- Obstacles: spike crates, buzzsaws, traffic cones, 404 monitors, NFT frames.
- Aura coins, rizz gems and brain pickups; combo multiplier with screen shake, hit-stop, particles and floating text.
- Procedural spawn patterns (rows, arcs, stacks, forts, saw gauntlets, choir) with a difficulty ramp.
- Procedural audio (WebAudio) for shots, jumps, kills, pickups and death.

## Run locally

```bash
python3 -m http.server 8767   # then open http://127.0.0.1:8767/
```

Single file, no build step.
