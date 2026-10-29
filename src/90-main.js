/* ============================================================
   8. resize, perf governor, main loop, boot
   ============================================================ */
function sizeCanvas() {
  W = window.innerWidth; H = window.innerHeight;
  DPR = Math.min(window.devicePixelRatio || 1, QUAL.dpr);
  cv.style.width = W + 'px'; cv.style.height = H + 'px';
  renderer.setPixelRatio(DPR);
  renderer.setSize(W, H, false);
  /* the play field sits closer than it used to: at 1.0 the cast was a
     thumbnail on a big empty sky */
  SC = Math.max(0.72, Math.min(1.32, H / 690));
  GROUND = Math.round(H * 0.755);
  camera.left = 0; camera.right = W; camera.top = 0; camera.bottom = -H;
  camera.updateProjectionMatrix();
  sizePost();
}
let resizeT = 0;
window.addEventListener('resize', () => {
  clearTimeout(resizeT);
  resizeT = setTimeout(() => { sizeCanvas(); resetWorld(); }, 180);
});

/* ---------------- perf governor ---------------- */
let frameMs = 16.7, fpsWin = 16.7, fpsT = 0, badWindows = 0, goodWindows = 0, qLock = 0;
function perf(rawMs) {
  /* rawMs is the real frame interval, not the js cost: a gpu that cannot keep up
     shows up here, a cheap js frame does not */
  fpsWin = fpsWin * 0.9 + rawMs * 0.1;
  fpsT += rawMs / 1000;
  if (fpsT > 0.5) {
    fpsT = 0;
    const el = $('fps');
    if (el && el.classList.contains('on')) {
      el.textContent = (1000 / fpsWin).toFixed(0) + ' fps · ' + QUAL.lvl + ' · ' +
        Math.round(cv.width) + '×' + Math.round(cv.height) + ' · js ' + frameMs.toFixed(1) + 'ms';
    }
    if (qualityPref === 'auto') {
      qLock -= 0.5;
      if (fpsWin > 33) { badWindows++; goodWindows = 0; } else if (fpsWin < 20) { goodWindows++; badWindows = 0; }
      if (qLock <= 0) {
        if (badWindows >= 3 && QUAL.lvl === 'high') { applyQuality('mid'); badWindows = 0; qLock = 12; toast('GPU is cooking. Dropping to MID.'); }
        else if (badWindows >= 3 && QUAL.lvl === 'mid') { applyQuality('low'); badWindows = 0; qLock = 12; toast('GPU is on fire. Dropping to LOW.'); }
        else if (goodWindows >= 24 && QUAL.lvl === 'mid') { applyQuality('high'); goodWindows = 0; qLock = 20; }
      }
    }
  }
}

/* ---------------- main loop ---------------- */
let last = performance.now();
function frame(now) {
  const t0 = performance.now();
  kitBeginAll();
  const rawMs = Math.min(Math.max(now - last, 1), 250);
  let dt = Math.min((now - last) / 1000, 1 / 30);
  last = now;
  if (hitStop > 0) { hitStop -= dt; dt *= 0.1; }
  bgT += dt;

  if (state === 'play') step(dt * timeScale);
  else if (state === 'menu') {
    player.x += 120 * dt;
    runPhase += dt * 7;
    camX = player.x - W * 0.30 / SC;
    player.vy += GRAV * dt; player.y += player.vy * dt;
    if (player.y > -R) { player.y = -R; player.vy = 0; }
    updateFx(dt);
  } else if (state === 'dying') stepDeath(dt);
  else updateFx(dt);

  scanT = Math.max(0, scanT - dt * 1.4);
  pnlMarket *= Math.pow(0.6, dt);
  shakeX = shake ? (Math.random() - 0.5) * shake : 0;
  shakeY = shake ? (Math.random() - 0.5) * shake : 0;

  const keys = Object.keys(BATCH);
  for (const k of keys) { BATCH[k][0].begin(); BATCH[k][1].begin(); }

  drawSky(bgT);
  if (QUAL.band) { drawFarLayer(bgT); drawMidLayer(bgT); }
  drawCloudLayer(bgT);
  if (QUAL.band) drawEyeLayer(bgT);
  drawWordLayer(bgT);
  drawHeartLayer(bgT);
  drawGround(bgT);
  drawCeiling(bgT);
  for (const b of blocks) drawBlockObj(b, bgT);
  for (const h of holes) drawHole(h, bgT);
  for (const p of pickups) drawPickup(p, bgT);
  labelBudget = 5;                 // a crowd of name tags is noise, not information
  for (const e of enemies) drawEnemy(e, bgT);
  drawBossQuad(bgT);
  for (const b of bullets) drawBullet(b);
  for (const b of eBullets) drawEBullet(b, bgT);
  if (state !== 'over') drawPlayerQuad(bgT);
  drawPartsQ();
  drawTextsQ();
  drawRingsQ();
  drawFgLayer(bgT);
  drawOverlayFx(bgT);
  drawGallery();

  for (const k of keys) { BATCH[k][0].end(); BATCH[k][1].end(); }
  kitEndAll();
  stepGrade(dt);
  renderFrame(bgT);

  syncBanner(); syncToast(); syncBossBar(); syncTape(dt);
  frameMs = performance.now() - t0;
  perf(rawMs);
  requestAnimationFrame(frame);
}

/* ---------------- boot ---------------- */
sizeCanvas();
resetWorld();
(async () => {
  if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) { /* fonts not ready */ } }
  bakeAll();
  try { initPost(); } catch (e) { POST.on = false; console.warn('post chain off:', e.message); }
  sizePost();
  $('tape').innerHTML = tapeHTML();
  last = performance.now();
  requestAnimationFrame(frame);
  toast('Not financial advice. Do not send money to $MOON.', 4200);
})();

/* dev telemetry — used by the fps meter, the profiler and my own testing *//* dev telemetry — read by the fps meter, the profiler and my own test harness */
window.MEMERUN = {
  stats: () => ({
    state, kills, dist: Math.round(dist), bag, pnl, wpn,
    enemies: enemies.length, bullets: bullets.length, parts: parts.length, texts: texts.length,
    quads: Object.keys(BATCH).reduce((a, k) => a + BATCH[k][0].n + BATCH[k][1].n, 0),
    batches: Object.keys(BATCH).map(k => k + ':' + (BATCH[k][0] ? BATCH[k][0].n : 0) + '+' + (BATCH[k][1] ? BATCH[k][1].n : 0)),
    lvl: QUAL.lvl, dpr: DPR, frameMs: +frameMs.toFixed(2), fpsWin: +fpsWin.toFixed(2),
    draws: renderer.info.render.calls, tris: renderer.info.render.triangles,
    geo: renderer.info.memory.geometries, textures: renderer.info.memory.textures,
    spr: Object.keys(SPR).length, kits: Object.keys(KITS).length,
    kitN: Object.keys(KITS).reduce((a, k) => a + KITS[k].n, 0),
    kitDraws: Object.keys(KITS).filter(k => KITS[k].n).length,
    canvas: cv.width + 'x' + cv.height,
    post: POST.on ? (POST.w + 'x' + POST.h + ' msaa' + POST.samples + (POST.hdr === THREE.HalfFloatType ? ' hdr' : ' ldr')) : 'off',
    postDraws: POST.on ? 5 : 0
  }),
  env: () => ({ W, H, SC, GROUND, DPR, camX, shakeX, shakeY }),
  sprites: () => SPR,
  kits: () => KITS,
  start: () => startGame(),
  quality: q => applyQuality(q)
};

/* dev hooks: tuning, screenshots, my profiling harness. Nothing in the game calls these. */
window.MEMERUN.dev = {
  mode: m => { mode = m; resetWorld(); },
  event: id => {
    ev = EVENTS.find(e => e.id === id) || null; evT = 30;
    gravMul = 1; gravDir = 1; wind = 0; scanT = 1; glitch = 0;
    if (id === 'flip') gravDir = -1;
    if (id === 'rug') { gravDir = -1; glitch = 1; }
    if (id === 'crash') wind = -300;
    if (id === 'moonshot') gravMul = 0.22;
    if (id === 'bull') invulnT = 1;
  },
  boss: () => { spawnBoss(); },
  bossKill: () => { if (boss) hitBoss(boss, boss.hp + 1); },
  weapon: w => { setWeapon(w); },
  pickup: (k, n) => { for (let i = 0; i < (n || 1); i++) addPickup(player.x + 220 + i * 60, -90 - i * 20, k); },
  meme: tag => {
    const m = MEMES.find(x => x.tag === tag) || MEMES[0];
    addEnemy(player.x + 420, m, 0, tag === 'rocket' || tag === 'moon' || tag === 'whale');
  },
  hole: () => { bullets.push({ x: player.x + 300, y: -80, vx: 400, vy: 0, life: 0.05, kind: 'orb', dmg: 2, bh: true, hits: null, seed: 0 }); },
  quality: q => applyQuality(q),
  hurtFx: () => { hurtFx = 1; shake = 14; },
  die: () => { state = 'over'; showOver(); },
  atlasCanvas: n => AT[n] ? AT[n].cv : null,
  gallery: (names, cols, rows, zoom) => {
    GAL = { names, cols: cols || 7, rows: rows || 5, zoom: zoom || 1, scale: 4 };
    return GAL;
  },
  galleryOff: () => { GAL = null; },
  layout: () => (GAL && GAL.layout) || [],
  spritesOn: pg => Object.keys(SPR).filter(k => SPR[k].page === pg),
  kitNames: () => Object.keys(KITS),
  kitDrop: () => Object.keys(KITS).filter(k => KITS[k].drop).map(k => k + ':' + KITS[k].drop),
  _g: { THREE, primGeo, pillowGeo, ballGeo, capsuleGeo, TILT, partGeo, buildKitGeo, mergeGeos,
    B, BX, PL, S, BA, E, CP, CY, CN, RG, OC, HX, PR, GM, P, col, bandOf, LIGHT, RIM, KITS },
  distance: m => { player.x = m * 60; camX = player.x - W * 0.30 / SC; nextX = player.x + 400; }
};
