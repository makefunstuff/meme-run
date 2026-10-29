/* ============================================================
   3. atlas bake — the only moment any vector art is rasterised
   ============================================================ */
const AT = { ent: new Atlas(2048, 4096, 1), world: new Atlas(2048, 3072, 0), text: new Atlas(2048, 1024, 2) };
const PBOX = [-92, -60, 136, 104];

function bakeFx(A) {
  A.add('fx_dot', [-9, -9, 18, 18], drawDot);
  A.add('fx_heart', [-20, -18, 40, 36], drawHeartShape);
  A.add('fx_star', [-12, -12, 24, 24], drawStarShape);
  A.add('fx_square', [-9, -9, 18, 18], drawSquare);
  A.add('fx_ring', [-18, -18, 36, 36], drawRingShape);
  A.add('glow', [-17, -17, 34, 34], drawGlowSprite, { s: 1 });
  A.add('px', [0, 0, 4, 4], drawPx, { s: 1 });
  A.add('shadow', [-17, -6, 34, 12], drawShadow, { s: 1 });
  A.add('speed', [0, -2, 104, 5], drawSpeedLine, { s: 1 });
  A.add('hole', [-26, -26, 52, 52], () => {
    const hg = grad('hole', c => {
      const q = c.createRadialGradient(0, 0, 0, 0, 0, 24);
      q.addColorStop(0, '#000'); q.addColorStop(0.6, '#1b0a2c'); q.addColorStop(1, '#4a1e6e');
      return q;
    });
    circ(0, 0, 24); ctx.fillStyle = hg; ctx.fill();
  });
  A.add('holering', [-46, -22, 92, 44], () => {
    for (let i = 0; i < 3; i++) {
      ell(0, 0, 40 - i * 8, 14 - i * 3, i * 0.7);
      ctx.strokeStyle = rgba(['#c9a8e8', '#ff9dbd', '#8fd6ff'][i], 0.8);
      ctx.lineWidth = 3 - i * 0.6; ctx.stroke();
    }
  });
  A.add('flash', [2, -32, 68, 68], drawMuzzleFlash);
}
function bakeMemes(A) {
  for (const m of MEMES) A.add(m.art, m.box, () => m.draw(m.col));
}
function bakeBlocks(A, S) { const O = o => Object.assign({ s: S }, o || {});
  A.add('b_spike', [-10, -60, 72, 76], () => drawSpikeBox(52, 44), O());
  A.add('b_mount', [-4, -22, 34, 28], () => { rrPath(0, -14, 16, 16, 4, O()); sticker('#6b7a8f', { pad: 3 }); });
  for (let i = 0; i < 8; i++) A.add('b_saw' + i, [-40, -40, 80, 80], () => drawSaw(52, 52, i * (TAU / 8) / 6), { s: 1 });
  A.add('b_cone', [-40, -56, 80, 64], () => drawCone(64, 48), O());
  A.add('b_monitor', [-10, -62, 78, 70], () => drawMonitor(60, 52), O());
  A.add('b_nft', [-8, -58, 66, 66], () => drawNft(50, 56), O());
  A.add('b_rug', [-10, -50, 96, 64], () => drawRugCarpet(76, 44), O());
  A.add('b_candle', [-10, -76, 60, 96], () => drawCandleBlock(40, 62), O());
  A.add('b_engine', [-12, -70, 92, 84], () => drawEngine(70, 54), O());
  A.add('b_atm', [-10, -72, 76, 84], () => drawAtm(56, 58), O());
}
function bakeBullets(A, S) { const O = o => Object.assign({ s: S }, o || {});
  A.add('bl_bolt', [-40, -12, 62, 24], drawBolt, { s: 1 });
  A.add('bl_laser', [-56, -12, 80, 24], drawLaser, { s: 1 });
  A.add('bl_orb', [-30, -30, 60, 60], drawOrb, O());
  A.add('bl_bread', [-20, -18, 40, 36], drawBreadBullet, O());
  A.add('bl_crew', [-32, -44, 64, 74], drawCrewBullet, O());
  A.add('bl_coin', [-16, -16, 32, 32], drawCoinBullet, O());
  A.add('bl_rocket', [-30, -14, 54, 28], drawRocketBullet, O());
  A.add('bl_pump', [-28, -28, 56, 56], drawPumpBullet, O());
  A.add('bl_lever', [-24, -12, 48, 24], drawLeverBullet, { s: 1 });
  A.add('bl_down', [-20, -18, 40, 36], drawDownVote);
  A.add('bl_mid', [-24, -16, 48, 32], drawMidBullet);
  A.add('bl_heart', [-20, -17, 40, 34], drawHeartBullet);
  A.add('bl_rekt', [-24, -20, 48, 40], drawRektBullet);
}
function bakePickups(A, S) { const O = o => Object.assign({ s: S }, o || {});
  A.add('pk_coin', [-22, -22, 44, 44], drawCoinPickup, O());
  A.add('pk_bag', [-26, -26, 52, 52], drawBagPickup, O());
  A.add('pk_gem', [-26, -28, 52, 56], drawGemPickup, O());
  A.add('pk_heart', [-26, -26, 52, 52], drawHeartPickup, O());
  A.add('pk_diamond', [-24, -24, 48, 48], drawDiamondPickup, O());
  A.add('pk_advisory', [-26, -26, 52, 52], drawAdvisoryPickup, O());
  A.add('pk_lever', [-24, -24, 48, 48], drawLeverPickup, O());
  for (const k of Object.keys(WEAPONS)) {
    if (k === 'blaster') continue;
    A.add('cr_' + k, [-32, -34, 64, 68], () => drawCratePickup(k), O());
  }
}
function bakeGuns(A, S) { const O = o => Object.assign({ s: S }, o || {});
  for (const k of Object.keys(WEAPONS)) {
    gunKind = k;
    A.add('g_' + k, [-38, -28, 96, 60], drawPlayerGun, O());
  }
  gunKind = 'blaster';
}
function bakePlayer(A, S) { const O = o => Object.assign({ s: S }, o || {});
  const keep = { run: runPhase, muz: muzzle, st: state, gr: player.grounded, aim: player.aim, bl: player.blink };
  const setF = o => {
    runPhase = o.phase || 0; muzzle = o.muz || 0; state = o.st || 'play';
    player.grounded = o.gr === undefined ? true : o.gr;
    player.aim = o.aim || 0; player.blink = o.bl || 0;
  };
  for (let i = 0; i < 12; i++) { setF({ phase: i * TAU / 12 }); A.add('p' + i, PBOX, () => drawPlayerBody(0.4), O()); }
  for (let i = 0; i < 12; i++) { setF({ phase: i * TAU / 12, muz: 0.09 }); A.add('ps' + i, PBOX, () => drawPlayerBody(0.4), O()); }
  const air = [{ phase: 0 }, { phase: 2 }, { phase: 4 }, { phase: 5 }];
  for (let i = 0; i < air.length; i++) { setF({ phase: air[i].phase, gr: false }); A.add('pa' + i, PBOX, () => drawPlayerBody(0.4), O()); }
  setF({ phase: 0, bl: 0.5 }); A.add('pb0', PBOX, () => drawPlayerBody(0.4), O());
  setF({ phase: 0, bl: 0.25 }); A.add('pb1', PBOX, () => drawPlayerBody(0.4), O());
  setF({ phase: 0, st: 'dying' }); A.add('pd', PBOX, () => drawPlayerBody(0.4), O());
  runPhase = keep.run; muzzle = keep.muz; state = keep.st;
  player.grounded = keep.gr; player.aim = keep.aim; player.blink = keep.bl;
}
function bakeBoss(A, S) { const O = o => Object.assign({ s: S }, o || {});
  A.add('boss0', [-86, -134, 172, 236], () => bakeBossPhone(0), O());
  A.add('boss1', [-92, -116, 184, 204], () => bakeBossPhone(1), O());
  A.add('boseye0', [-44, -34, 88, 68], () => bakeBossEye(0), O());
  A.add('boseye1', [-36, -30, 72, 60], () => bakeBossEye(1), O());
  for (let i = 0; i < 5; i++) A.add('badge' + i, [-18, -16, 36, 32], () => bakeBadge(i), O());
}
function bakeWorld(B, S) {
const O = o => Object.assign({ s: S }, o || {});
  for (let i = 0; i < 4; i++) B.add('md' + i, [-232, -240, 544, 272], () => bakeMound(i), { s: 1 });
  for (let i = 0; i < 2; i++) B.add('hl' + i, [-200, -240, 464, 272], () => bakeHill(i), { s: 1 });
  const mon = ['toilet', 'crew', 'crown', 'arch', 'eye'];
  const mbox = { toilet: [-36, -100, 72, 112], crew: [-30, -82, 60, 92], crown: [-40, -64, 80, 72], arch: [-36, -116, 72, 124], eye: [-46, -82, 92, 60] };
  for (const k of mon) B.add('mon_' + k, mbox[k], () => bakeMonument(k), { s: 1 });
  const bills = ['NO CAP', 'SO MID', '1:1', 'RATIO', 'FREE RIZZ', 'NPC LIFE'];
  bills.forEach((w, i) => B.add('bill' + i, [-46, -42, 92, 96], () => bakeBill(w), O()));
  B.add('cloud', [-48, -40, 104, 72], bakeCloud, O());
  B.add('eye0', [-40, -40, 80, 80], () => bakeEye(false), O());
  B.add('eye1', [-40, -40, 80, 80], () => bakeEye(true), O());
  const words = ['brainrot', 'ratio', 'sus', 'ohio', 'rizz', 'npc', 'gyatt', 'no cap', 'skibidi', 'sigma', 'fanum tax', 'mewing', 'wagmi', 'degen', '$ape', 'hodl'];
  words.forEach((w, i) => {
    const c = B.c; c.font = '700 26px Fredoka, ui-rounded, sans-serif';
    const wid = Math.ceil(c.measureText(w).width) + 22;
    B.add('w' + i, [-wid / 2, -22, wid, 44], () => bakeWordSprite(w), O());
  });
  ['#ff9dbd', '#ffd166', '#8fe3d0', '#ffb3c8', '#7ff0a8'].forEach((col, i) => B.add('hc' + i, [-22, -20, 44, 40], () => bakeHeartSprite(col), O()));
  B.add('sun', [-48, -48, 96, 96], bakeSun, O());
  B.add('rays', [-74, -74, 148, 148], bakeRays, { s: 1 });
  B.add('shaft', [-78, -2, 156, 764], bakeShaft, { s: 1 });
  ['#ffffff', '#ffd0e2', '#bdeee0'].forEach((col, i) => B.add('band' + i, [-6, -6, 412, 58], () => bakeBand(col), { s: 1 }));
  B.add('road', [-2, -4, 92, 46], bakeRoadTile, { s: 1.5 });
  B.add('strata', [0, 0, 300, 460], bakeStrata, { s: 1 });
  B.add('ceil', [-2, -126, 92, 130], bakeCeilingStrip, { s: 1.5 });
  for (let i = 0; i < 3; i++) B.add('gr' + i, [-12, -18, 24, 22], () => bakeGrass(i * 3));
  ['#ff5d73', '#ffd166', '#fff', '#c9a8e8', '#7ff0a8'].forEach((col, i) => B.add('fl' + i, [-8, -8, 16, 16], () => bakeFlower(col), { s: 1.5 }));
  for (let i = 0; i < 3; i++) B.add('bg' + i, [-9, -12, 18, 24], () => bakeBling(i), { s: 1.5 });
  SKIES.forEach((stops, i) => {
    B.add('sky' + i, [0, 0, 8, 1024], () => {
      const q = ctx.createLinearGradient(0, 0, 0, 1024);
      for (const s of stops) q.addColorStop(s[1], s[0]);
      ctx.fillStyle = q; ctx.fillRect(0, 0, 8, 1024);
    }, { s: 1 });
  });
  /* the horizon haze: the band the ground is seated in, and the bottom of the
     screen falling into shadow */
  B.add('haze', [0, 0, 16, 128], () => {
    const q = ctx.createLinearGradient(0, 128, 0, 0);
    q.addColorStop(0, 'rgba(255,255,255,0.95)'); q.addColorStop(0.45, 'rgba(255,255,255,0.42)');
    q.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = q; ctx.fillRect(0, 0, 16, 128);
  }, { s: 1 });
  B.add('vigb', [0, 0, 16, 128], () => {
    const q = ctx.createLinearGradient(0, 0, 0, 128);
    q.addColorStop(0, 'rgba(14,7,20,0)'); q.addColorStop(1, 'rgba(14,7,20,0.55)');
    ctx.fillStyle = q; ctx.fillRect(0, 0, 16, 128);
  }, { s: 1 });
  B.add('vig', [0, 0, 256, 256], () => {
    const q = ctx.createRadialGradient(128, 128, 40, 128, 128, 128);
    q.addColorStop(0, 'rgba(60,20,50,0)');
    q.addColorStop(1, 'rgba(60,20,50,0.4)');
    ctx.fillStyle = q; ctx.fillRect(0, 0, 256, 256);
  }, { s: 1 });
  B.add('scan', [0, 0, 8, 6], () => {
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(0, 0, 8, 2);
  }, { s: 1 });
}

/* ---------------- dynamic text sprites (pop-ups, labels) ---------------- */
const textCache = new Map();
let textReset = 0;
function bakeTextSprite(name, str, o) {
  const T = AT.text, c = T.c;
  const size = o.size || 30;
  c.font = (o.weight || 700) + ' ' + size + 'px ' + (o.font || 'Fredoka') + ', Fredoka, ui-rounded, sans-serif';
  const lw = o.stroke === false ? 0 : (o.lw || size * 0.3);
  const w = Math.ceil(c.measureText(str).width) + lw + 16;
  const h = Math.ceil(size * 1.5) + 14;
  return T.add(name, [-w / 2, -h / 2, w, h], () => txt(str, 0, 0, o), { s: 1 });
}
function popSprite(str) {
  let s = textCache.get('p|' + str);
  if (s) return s;
  if (AT.text.x + 400 > AT.text.size) {
    AT.text.c.clearRect(0, 0, AT.text.size, AT.text.size);
    AT.text.x = 1; AT.text.y = 1; AT.text.rowH = 0;
    textCache.forEach((v, k) => { if (!k.startsWith('l|')) textCache.delete(k); });
    textReset++;
  }
  const nm = 'pop' + textCache.size;
  s = bakeTextSprite(nm, str, { size: 30, color: '#fff', stroke: INK });
  if (s) { textCache.set('p|' + str, nm); return nm; }
  return null;
}
function labelSprite(label) {
  let cached = textCache.get('l|' + label);
  if (cached) return cached;
  const T = AT.text, c = T.c;
  c.font = '700 10px Fredoka, ui-rounded, sans-serif';
  const w = Math.ceil(c.measureText(label).width) + 17, h = 16;
  const nm = 'lbl' + textCache.size;
  const s = T.add(nm, [-w / 2, -h / 2, w, h], () => {
    rrPath(-w / 2, -h / 2, w, h, h / 2);
    sticker('rgba(255,252,250,0.9)', { pad: 2.4, lw: 1.2 });
    ctx.font = '700 10px Fredoka, ui-rounded, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#6b4560'; ctx.fillText(label, 0, 0.5);
  }, { s: 1 });
  if (s) { textCache.set('l|' + label, nm); return nm; }
  return null;
}

/* ---------------- build everything ---------------- */
let TEX = {}, BATCH = {};
function bakeAll() {
  bakeFx(AT.ent);              /* particles, glow, shadow, flash: the only baked entity art left */
  makeKits();                  /* the cast is geometry, not pixels */
  for (const m of MEMES) labelSprite(m.label);
  bakeWorld(AT.world, 1);
  TEX = { 0: AT.world.texture(), 1: AT.ent.texture(), 2: AT.text.texture() };
  const mk = (page, max, additive) => {
    const b = new Quads(TEX[page], max, additive);
    scene.add(b.mesh);
    b.mesh.renderOrder = page * 10 + (additive ? 1 : 0);
    return b;
  };
  BATCH = {
    0: [mk(0, 900, false), mk(0, 600, true)],
    1: [mk(1, 1500, false), mk(1, 1000, true)],
    2: [mk(2, 90, false), mk(2, 60, true)]
  };
  console.log('baked', AT.ent.n, 'entity sprites (used to y=' + AT.ent.y + '),', AT.world.n, 'world sprites (used to y=' + AT.world.y + '),', AT.text.n, 'text sprites (used to y=' + AT.text.y + ')');
}
