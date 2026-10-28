/* ============================================================
   1b. state + render quality
   ============================================================ */
let state = 'menu';
let camX = 0, bgT = 0, runPhase = 0;
let player, bullets, enemies, blocks, pickups, parts, texts, rings;
let score = 0, kills = 0, aura = 0, brains = 3, combo = 0, bestCombo = 0, comboT = 0;
let shake = 0, hitStop = 0, hurtFx = 0, deathT = 0, dist = 0, nextX = 0, spawnGate = 0;
let shootHeld = false, shootCd = 0, jumpBuf = 0, coyote = 0, invuln = 0, muzzle = 0, recoil = 0, deathSpin = 0;
let hudScore = -1, hudDist = -1, hudBrains = -1, hudWpn = -1, hudBag = -1;
let toastMsg = '', toastUntil = 0;
let mode = 'classic', best = 0;
let ev = null, evT = 0, nextEvT = 12;
let boss = null, nextBossDist = BOSS_EVERY, bossKind = 0;
let holes = [], eBullets = [];
let wpn = 'blaster', ammo = Infinity, gravDir = 1, timeScale = 1, glitch = 0, gunKind = 'blaster';
/* degen economy */
let bag = 0;              // coins pocketed
let pnl = 0;              // the number on the HUD
let pnlPeak = 0;
let shield = 0;           // diamond hands: blocks a hit
let leverT = 0;           // 100x: double P&L for a while
let wind = 0;             // horizontal market wind
let invulnT = 0;          // bull run
let scanT = 0;            // glitch/overlay pulse
let coinRain = 0;

/* quality */
let qualityPref = 'auto';
let QUAL = { lab: true, vig: true, line: true, fg: true, sh: true, band: true, glitch: true, parts: 260, dpr: 1.5, lvl: 'high' };
function applyQuality(lvl) {
  QUAL.lvl = lvl;
  if (lvl === 'low') QUAL = { lab: false, vig: false, line: false, fg: false, sh: false, band: false, glitch: false, parts: 110, dpr: 1, lvl: 'low' };
  else if (lvl === 'mid') QUAL = { lab: true, vig: true, line: true, fg: false, sh: true, band: true, glitch: true, parts: 190, dpr: 1.25, lvl: 'mid' };
  else QUAL = { lab: true, vig: true, line: true, fg: true, sh: true, band: true, glitch: true, parts: 260, dpr: 1.5, lvl: 'high' };
  sizeCanvas();
}
