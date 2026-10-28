function newPlayer() {
  return { x: 140, y: -R, vy: 0, grounded: true, blink: 0, blinkT: rnd(1.2, 3.5), aim: 0, squash: 0 };
}
function resetWorld() {
  player = newPlayer();
  bullets = []; enemies = []; blocks = []; pickups = [];
  parts = []; texts = []; rings = []; holes = []; eBullets = [];
  score = kills = aura = combo = bestCombo = 0; brains = 3;
  comboT = 0; shake = 0; hitStop = 0; hurtFx = 0; deathT = 0; dist = 0;
  invuln = 0; muzzle = 0; recoil = 0; shootCd = 0; jumpBuf = 0; shootHeld = false;
  ev = null; evT = 0; nextEvT = MODES[mode].eventEvery * 0.6;
  boss = null; nextBossDist = MODES[mode].bossEvery;
  gravDir = 1; timeScale = 1; glitch = 0;
  wpn = 'blaster'; ammo = Infinity;
  camX = player.x - W * 0.30 / SC;
  nextX = player.x + 620; spawnGate = 0;
  hudScore = hudDist = hudBrains = -1; hudWpn = '';
  if (mode === 'zen') brains = 9;
  updateHearts();
  updateWpnHud();
}

/* ---------------- toast ---------------- */
function toast(s, d) {
  toastMsg = s; toastUntil = performance.now() + (d || 2100);
  const el = document.getElementById('toast');
  if (el) { el.textContent = s; el.classList.add('on'); }
}

/* ---------------- particles ---------------- */
function burst(x, y, n, o) {
  o = o || {};
  if (parts.length > 260) return;
  for (let i = 0; i < n; i++) {
    const a = o.a === undefined ? rnd(TAU) : o.a + rnd(-0.6, 0.6);
    const sp = rnd(o.sp0 || 60, o.sp1 || 300);
    parts.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up || 40),
      g: o.g === undefined ? 620 : o.g, life: 0, max: rnd(0.35, 0.8),
      size: rnd(o.s0 || 3, o.s1 || 8),
      col: o.cols ? pick(o.cols) : (o.col || C.gold),
      kind: o.kind || (Math.random() < 0.34 ? 'heart' : 'dot'),
      rot: rnd(TAU), vr: rnd(-9, 9)
    });
  }
}
function addText(x, y, s, col, size) {
  texts.push({ x, y, s, col: col || '#fff', size: size || 22, life: 0, vy: -60 });
}
function addRing(x, y, r0, r1, col, w) {
  rings.push({ x, y, r: r0, r1: r1, col: col || '#fff', w: w || 5, life: 0 });
}

/* ============================================================
   ENEMY ART — each draws centred on (0,0), feet near y=+24
   ============================================================ */
function shade(hex, f) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  const r = Math.round(((n >> 16 & 255) * f)), g = Math.round(((n >> 8 & 255) * f)), b = Math.round((n & 255) * f);
  return `rgb(${clamp(r, 0, 255)},${clamp(g, 0, 255)},${clamp(b, 0, 255)})`;
}
