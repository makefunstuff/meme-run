/* ============================================================
   2b. DEGEN art — new memes, obstacles, bullets, pickups.
   All of this is rasterised into the atlas at load, never per frame.
   ============================================================ */
function drawPepe(col) {
  // head
  poly([[-22, 6], [-18, -18], [0, -24], [18, -18], [22, 6], [12, 20], [-12, 20]]);
  sticker('#69c96a', { pad: 4 });
  ell(0, 12, 17, 9); sticker('#57b45c', { pad: 0, lw: 0 });
  // eyes on the brow
  [-10, 10].forEach(s => {
    ell(s, -8, 8, 9); sticker('#fffaf2', { pad: 3 });
    circ(s + 1, -6, 3.4); fillc('#1b1020');
    circ(s - 1, -8, 1.3); fillc('#fff');
  });
  ctx.beginPath(); ctx.moveTo(-17, -17); ctx.lineTo(-4, -14); line(2.6, '#2f7a34');
  ctx.beginPath(); ctx.moveTo(17, -17); ctx.lineTo(4, -14); line(2.6, '#2f7a34');
  // mouth, the famous frown
  ctx.beginPath(); ctx.moveTo(-11, 12); ctx.quadraticCurveTo(0, 8, 11, 12); line(3, '#2f7a34');
  circ(-4, 14, 1.6); fillc('#2f7a34'); circ(4, 14, 1.6); fillc('#2f7a34');
}
function drawShib(col) {
  // shiba head with a coin in the mouth
  poly([[-20, 4], [-16, -14], [-6, -22], [6, -22], [16, -14], [20, 4], [10, 18], [-10, 18]]);
  sticker('#e8b072', { pad: 4 });
  poly([[-16, -14], [-8, -24], [-4, -14]]); sticker('#c98c5a', { pad: 2.5 });
  poly([[16, -14], [8, -24], [4, -14]]); sticker('#c98c5a', { pad: 2.5 });
  ell(0, 8, 12, 9); sticker('#fff3e2', { pad: 2.5 });
  [-9, 9].forEach(s => { ell(s, -6, 6.4, 7); sticker('#fffaf2', { pad: 2.5 }); circ(s, -5, 3); fillc('#2a1a20'); });
  ell(0, 3, 4, 3); sticker('#3a2340', { pad: 2 });
  // coin in the mouth
  circ(0, 14, 8); sticker('#ffd166', { pad: 3 });
  txt('$', 0, 14, { size: 10, color: '#a8762a', stroke: false });
}
function drawWif(col) {
  // the whining dog, wearing the hat
  poly([[-19, 2], [-15, -16], [0, -21], [15, -16], [19, 2], [11, 19], [-11, 19]]);
  sticker('#f2f4f8', { pad: 4 });
  ell(0, 12, 11, 8); sticker('#fff', { pad: 2.5 });
  ell(0, 8, 4.4, 3.4); sticker('#3a2340', { pad: 2 });
  [-8, 8].forEach(s => { ell(s, -5, 6, 7); sticker('#fffaf2', { pad: 2.5 }); circ(s, -2.5, 3.2); fillc('#2a1a20'); });
  // the whine
  ctx.beginPath(); ctx.arc(0, 15, 5, 0.2, Math.PI - 0.2); ctx.lineTo(-5, 17); ctx.closePath();
  sticker('#8c3a55', { pad: 2 });
  // hat
  rrPath(-14, -30, 28, 11, 5); sticker('#6fb7ff', { pad: 3 });
  rrPath(-19, -21, 38, 6, 3); sticker('#4b8fe0', { pad: 3 });
}
function drawBonk(col) {
  // dog head being bonked
  poly([[-18, 4], [-14, -14], [0, -19], [14, -14], [18, 4], [9, 18], [-9, 18]]);
  sticker('#e8a94b', { pad: 4 });
  [-8, 8].forEach(s => { ell(s, -4, 5.6, 6.4); sticker('#fffaf2', { pad: 2.5 }); circ(s + 1, -3, 2.8); fillc('#2a1a20'); });
  ell(0, 8, 5, 4); sticker('#3a2340', { pad: 2 });
  // bonk hammer
  ctx.save(); ctx.translate(6, -26); ctx.rotate(-0.55);
  rrPath(-6, -9, 26, 16, 6); sticker('#c98c5a', { pad: 3.5 });
  rrPath(16, -4, 26, 6, 3); sticker('#8d5a34', { pad: 3 });
  ctx.restore();
  txt('BONK', -2, 24, { size: 10, color: '#ff5d73', stroke: '#fff', lw: 3 });
}
function drawWhale(col) {
  // the whale, with a saddlebag of your money
  ctx.beginPath();
  ctx.moveTo(-30, 4);
  ctx.quadraticCurveTo(-22, -18, 2, -18);
  ctx.quadraticCurveTo(26, -18, 30, 2);
  ctx.quadraticCurveTo(24, 18, -6, 18);
  ctx.quadraticCurveTo(-24, 18, -30, 4);
  ctx.closePath();
  sticker('#5b8fd6', { pad: 4.5 });
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-6, 18); ctx.quadraticCurveTo(24, 18, 30, 2); ctx.lineTo(24, 4); ctx.quadraticCurveTo(18, 14, -4, 12);
  ctx.closePath(); ctx.clip();
  ctx.fillStyle = rgba('#bfe9ff', 0.85);
  for (let i = 0; i < 6; i++) ell(-2 + i * 6, 12, 3, 4); ctx.fill();
  ctx.restore();
  poly([[-30, 4], [-44, -6], [-40, 12], [-46, 20], [-28, 14]]); sticker('#4b7bc0', { pad: 3.5 });
  circ(18, -4, 5); sticker('#fffaf2', { pad: 2.5 }); circ(19, -3, 2.4); fillc('#1b1020');
  // it is eating your bag
  circ(-4, 8, 7); sticker('#ffd166', { pad: 2.5 });
  ctx.beginPath(); ctx.moveTo(-14, 10); ctx.quadraticCurveTo(-4, 18, 4, 12); line(2.6, '#2a4f80');
}
function drawRocket(col) {
  // to the moon
  ctx.save(); ctx.rotate(-0.7);
  rrPath(-16, -8, 34, 16, 8); sticker('#fffaf2', { pad: 4 });
  poly([[16, -8], [32, 0], [16, 8]]); sticker('#ff5d73', { pad: 3.5 });
  poly([[-10, -8], [-16, -20], [-2, -8]]); sticker('#6fb7ff', { pad: 2.5 });
  poly([[-10, 8], [-16, 20], [-2, 8]]); sticker('#6fb7ff', { pad: 2.5 });
  circ(2, 0, 6); sticker('#bfe9ff', { pad: 3 });
  txt('$', 2, 0, { size: 8, color: '#3a2340', stroke: false });
  // flame
  poly([[-16, -6], [-32, 0], [-16, 6]]); sticker('#ffd166', { pad: 2.5 });
  poly([[-16, -3], [-24, 0], [-16, 3]]); fillc('#ff9040');
  ctx.restore();
}
function drawCandle(col) {
  // a red candlestick with a face, falling
  rrPath(-11, -22, 22, 40, 4); sticker('#ff5d73', { pad: 3.5 });
  ctx.beginPath(); ctx.moveTo(0, -32); ctx.lineTo(0, -22); line(3, '#c9366f');
  ctx.beginPath(); ctx.moveTo(0, 18); ctx.lineTo(0, 30); line(3, '#c9366f');
  [-5, 5].forEach(s => { circ(s, -8, 3.4); fillc('#3a1020'); });
  ctx.beginPath(); ctx.arc(0, 4, 6, 0.3, Math.PI - 0.3); ctx.lineTo(-6, 8); ctx.closePath();
  sticker('#7a1830', { pad: 2 });
  txt('L', 0, 24, { size: 11, color: '#ff5d73', stroke: '#fff', lw: 3 });
}
function drawDiamond(col) {
  // diamond hands
  poly([[-24, 4], [-12, -14], [0, -22], [12, -14], [24, 4], [0, 24]]);
  sticker('#bfe9ff', { pad: 4 });
  poly([[-12, -14], [0, -4], [12, -14], [0, -22]]); fillc(rgba('#fff', 0.75));
  poly([[-24, 4], [-12, -14], [0, -4]]); fillc(rgba('#8fd6ff', 0.7));
  poly([[24, 4], [12, -14], [0, -4]]); fillc(rgba('#e9f6ff', 0.6));
  ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, 24); line(2.4, rgba('#4b7bc0', 0.6));
  // two little hands gripping it
  [-26, 26].forEach(s => {
    ell(s, 10, 8, 6, s > 0 ? 0.4 : -0.4); sticker('#f0c8a8', { pad: 3 });
    for (let i = 0; i < 3; i++) ell(s + (s > 0 ? -3 : 3), 4 + i * 4, 3, 2.2); ctx.fill();
  });
}
function drawRug(col) {
  // the rug, being pulled
  poly([[-32, 14], [22, 6], [30, -6], [-24, 2]]);
  sticker('#b2546f', { pad: 4 });
  ctx.save(); poly([[-32, 14], [22, 6], [30, -6], [-24, 2]]); ctx.clip();
  ctx.fillStyle = rgba('#ffd166', 0.55);
  for (let i = -3; i < 4; i++) { rrPath(i * 14 - 3, 2, 8, 12, 2); ctx.fill(); }
  ctx.restore();
  poly([[-24, 2], [30, -6], [34, 2], [-18, 12]]); sticker('#8c3a55', { pad: 3 });
  // little degen pulling the corner
  ctx.save(); ctx.translate(30, 4); ctx.scale(0.55, 0.55); drawCrew('#7fd3a8'); ctx.restore();
  txt('RUG', -6, 20, { size: 11, color: '#fff', stroke: '#8c3a55', lw: 4 });
}
function drawPrinter(col) {
  // money printer goes brrr
  rrPath(-24, -14, 48, 32, 6); sticker('#cfd8e3', { pad: 4 });
  rrPath(-18, -8, 26, 14, 4); sticker('#3a2340', { pad: 2.5 });
  txt('PRINT', -5, -1, { size: 9, color: '#7ff0a8', stroke: false, font: 'Space Mono' });
  rrPath(-22, 12, 44, 8, 3); sticker('#8d99ae', { pad: 2.5 });
  // bills coming out
  for (let i = 0; i < 3; i++) {
    ctx.save(); ctx.translate(10 + i * 8, -18 - i * 7); ctx.rotate(0.3 - i * 0.2);
    rrPath(-9, -6, 18, 12, 2); sticker('#8fe3a0', { pad: 2.5 });
    circ(0, 0, 3.4); sticker('#43a86c', { pad: 0, lw: 0 });
    ctx.restore();
  }
  circ(16, 4, 5); sticker('#ff5d73', { pad: 2.5 });
  circ(16, 4, 2.4); fillc('#fff');
}
function drawMoonFace(col) {
  circ(0, 0, 24); sticker('#ffe27a', { pad: 4 });
  circ(-9, -8, 5); fillc(rgba('#d9982f', 0.4));
  circ(8, 4, 6.5); fillc(rgba('#d9982f', 0.35));
  circ(2, -12, 3.5); fillc(rgba('#d9982f', 0.3));
  [-8, 8].forEach(s => { ctx.beginPath(); ctx.arc(s, -3, 4, 0.35, Math.PI - 0.35); ctx.lineTo(s - 4, -3); ctx.closePath(); sticker('#7a5a10', { pad: 1.6 }); });
  ctx.beginPath(); ctx.arc(0, 8, 9, 0.15, Math.PI - 0.15); ctx.lineTo(-9, 8); ctx.closePath();
  sticker('#7a5a10', { pad: 2 });
  ell(-5, 4, 3, 2, -0.4); fillc(rgba('#fff', 0.55));
}

/* ---------------- degen obstacles (origin = ground level) ---------------- */
function drawRugCarpet(w, h) {
  poly([[0, 0], [w, -4], [w * 0.9, -h * 0.55], [w * 0.1, -h * 0.35]]);
  sticker('#b2546f', { pad: 4 });
  ctx.save(); poly([[0, 0], [w, -4], [w * 0.9, -h * 0.55], [w * 0.1, -h * 0.35]]); ctx.clip();
  ctx.fillStyle = rgba('#ffd166', 0.5);
  for (let i = 0; i < 4; i++) { rrPath(6 + i * (w / 4), -h * 0.32, w / 8, h * 0.22, 3); ctx.fill(); }
  ctx.restore();
  poly([[w * 0.1, -h * 0.35], [w * 0.9, -h * 0.55], [w, -h * 0.4], [w * 0.2, -h * 0.16]]);
  sticker('#8c3a55', { pad: 3 });
  txt('RUG PULL', w / 2, -h * 0.62, { size: 11, color: '#fff', stroke: '#5c2038', lw: 4 });
}
function drawCandleBlock(w, h) {
  rrPath(0, -h, w, h, 5); sticker('#ff5d73', { pad: 4 });
  ctx.beginPath(); ctx.moveTo(w / 2, -h - 16); ctx.lineTo(w / 2, -h); line(4, '#c9366f');
  ctx.beginPath(); ctx.moveTo(w / 2, 8); ctx.lineTo(w / 2, 22); line(4, '#c9366f');
  ctx.save(); rrPath(0, -h, w, h, 5); ctx.clip();
  ctx.fillStyle = rgba('#7a1830', 0.35);
  for (let i = 0; i < 4; i++) ctx.fillRect(3, -h + 8 + i * (h / 4), w - 6, 3);
  ctx.restore();
  txt('-100%', w / 2, -h * 0.5, { size: 11, color: '#fff', stroke: false, font: 'Space Mono' });
}
function drawEngine(w, h) {
  rrPath(0, -h, w, h, 8); sticker('#c9366f', { pad: 4 });
  rrPath(6, -h + 8, w - 12, h * 0.42, 5); sticker('#2a1240', { pad: 3 });
  circ(w * 0.28, -h * 0.22, 9); sticker('#ffd166', { pad: 3 });
  ctx.beginPath(); ctx.moveTo(w * 0.28, -h * 0.22); ctx.lineTo(w * 0.28 + 6, -h * 0.22 - 5); line(2.6, '#7a3a20');
  circ(w * 0.62, -h * 0.22, 9); sticker('#7ff0a8', { pad: 3 });
  ctx.beginPath(); ctx.moveTo(w * 0.62, -h * 0.22); ctx.lineTo(w * 0.62 - 5, -h * 0.22 - 6); line(2.6, '#1d5a34');
  rrPath(w * 0.12, -h * 0.02, w * 0.76, h * 0.16, 4); sticker('#ffb3cc', { pad: 2.5 });
  txt('LIQUIDATION', w / 2, -h * 0.56, { size: 9, color: '#fff', stroke: false, font: 'Space Mono' });
  poly([[w - 6, -h - 8], [w + 8, -h - 18], [w + 2, -h - 2]]); sticker('#ff9040', { pad: 2.5 });
}
function drawAtm(w, h) {
  rrPath(0, -h, w, h, 7); sticker('#cfd8e3', { pad: 4 });
  rrPath(6, -h + 7, w - 12, h * 0.4, 4); sticker('#182848', { pad: 2.5 });
  txt('CEX', w / 2, -h * 0.28, { size: 12, color: '#7ff0a8', stroke: false, font: 'Space Mono' });
  rrPath(w * 0.18, -h * 0.06, w * 0.64, 7, 3); sticker('#3a2340', { pad: 2 });
  circ(w * 0.8, -h * 0.16, 5); sticker('#ff5d73', { pad: 2.5 });
  rrPath(w * 0.2, h * 0.02, w * 0.6, 6, 3); sticker('#8d99ae', { pad: 2.5 });
}

/* ---------------- bullets ---------------- */
function drawBolt() {
  const tg = grad('tracer', c => {
    const q = c.createLinearGradient(-34, 0, 12, 0);
    q.addColorStop(0, 'rgba(140,255,205,0)');
    q.addColorStop(0.55, 'rgba(150,255,210,0.55)');
    q.addColorStop(1, 'rgba(255,255,255,0.95)');
    return q;
  });
  poly([[-34, -1.4], [12, -3.4], [15, 0], [12, 3.4], [-34, 1.4]]);
  ctx.fillStyle = tg; ctx.fill();
  circ(11, 0, 3.2); fillc('#ffffff');
  circ(11, 0, 1.7); fillc('#d6ffe6');
}
function drawLaser() {
  const lg = grad('laser', c => {
    const q = c.createLinearGradient(-46, 0, 16, 0);
    q.addColorStop(0, 'rgba(120,220,255,0)');
    q.addColorStop(0.6, 'rgba(150,230,255,0.75)');
    q.addColorStop(1, 'rgba(255,255,255,1)');
    return q;
  });
  poly([[-52, -1.5], [14, -5], [19, 0], [14, 5], [-52, 1.5]]);
  ctx.fillStyle = lg; ctx.fill();
  poly([[-20, -1.4], [14, -2.4], [14, 2.4], [-20, 1.4]]);
  ctx.fillStyle = '#fff'; ctx.fill();
}
function drawOrb() {
  glow(0, 0, 26, '#a05ae0', 0.8);
  circ(0, 0, 9); fillc('#1b0a2c');
  ell(0, 0, 16, 5, 0.6); line(2.6, '#c9a8e8');
  circ(-3, -3, 2.2); fillc(rgba('#fff', 0.85));
}
function drawBreadBullet() {
  ell(0, 0, 13, 10); sticker('#e8b45a', { pad: 3.5 });
  ell(0, 0, 8, 6); sticker('#f7dca8', { pad: 0, lw: 0 });
  circ(-3, -1, 1.3); fillc(INK); circ(3, -1, 1.3); fillc(INK);
}
function drawCrewBullet() {
  ctx.save(); ctx.scale(0.5, 0.5); drawCrew('#ff5d73'); ctx.restore();
}
function drawCoinBullet() {
  glow(0, 0, 16, '#ffd166', 0.7);
  circ(0, 0, 8); sticker('#ffd166', { pad: 3 });
  circ(0, 0, 5.4); line(1.6, rgba('#a8762a', 0.7));
  txt('$', 0, 0, { size: 9, color: '#a8762a', stroke: false });
}
function drawRocketBullet() {
  glow(0, 0, 22, '#ff9040', 0.8);
  poly([[-14, -5], [8, -5], [16, 0], [8, 5], [-14, 5]]);
  sticker('#fffaf2', { pad: 3 });
  poly([[8, -4], [16, 0], [8, 4]]); fillc('#ff5d73');
  poly([[-14, -3], [-24, 0], [-14, 3]]); fillc('#ffd166');
}
function drawPumpBullet() {
  glow(0, 0, 22, '#ff9dbd', 0.7);
  circ(0, 0, 11); sticker('#ff9dbd', { pad: 3.5 });
  circ(-3, -3, 4); fillc(rgba('#fff', 0.6));
  ctx.beginPath(); ctx.moveTo(-5, 4); ctx.lineTo(0, -2); ctx.lineTo(5, 4); line(2.6, '#c9366f');
  txt('$', 0, 6, { size: 8, color: '#c9366f', stroke: false });
}
function drawLeverBullet() {
  glow(0, 0, 18, '#ff5d73', 0.7);
  poly([[-18, -3], [14, -5], [18, 0], [14, 5], [-18, 3]]);
  sticker('#ff5d73', { pad: 3 });
  txt('100x', -2, 0, { size: 8, color: '#fff', stroke: false, font: 'Space Mono' });
}
function drawDownVote() {
  rrPath(-13, -11, 26, 22, 6); sticker('#ffe3ea', { pad: 3 });
  poly([[-7, -6], [7, -6], [0, 6]]); fillc('#ff5d73');
}
function drawMidBullet() {
  rrPath(-17, -10, 34, 20, 9); sticker('#fff', { pad: 3 });
  txt('mid', 0, 1, { size: 13, color: '#e8618c', stroke: false });
}
function drawHeartBullet() {
  glow(0, 0, 16, '#ff5d73', 0.5);
  poly([[0, 9], [-14, 1], [-12, -11], [0, -5.5], [12, -11], [14, 1]]);
  sticker('#ff5d73', { pad: 2.5 });
  ctx.strokeStyle = INK; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(0, -1); ctx.lineTo(-3, 3); ctx.lineTo(2, 7); ctx.stroke();
}
function drawRektBullet() {
  glow(0, 0, 16, '#ff2e88', 0.6);
  rrPath(-15, -11, 30, 22, 5); sticker('#1b0a2c', { pad: 3, halo: '#ff2e88' });
  txt('L', 0, 0, { size: 15, color: '#ff5d73', stroke: false, font: 'Space Mono' });
}

/* ---------------- pickups ---------------- */
function drawCoinPickup() {
  const cg = grad('coin', c => {
    const q = c.createRadialGradient(-5, -6, 2, 0, 0, 17);
    q.addColorStop(0, '#fff6cc'); q.addColorStop(0.55, '#ffd166'); q.addColorStop(1, '#e0a33c');
    return q;
  });
  circ(0, 0, 15); sticker(cg, { pad: 4 });
  circ(0, 0, 10); line(1.8, rgba('#a8762a', 0.7));
  txt('$', 0, 1, { size: 16, color: '#a8762a', stroke: false });
}
function drawBagPickup() {
  glow(0, 0, 40, '#ffd166', 0.5);
  poly([[-16, -6], [16, -6], [13, 16], [-13, 16]]);
  sticker('#c98c5a', { pad: 4 });
  rrPath(-6, -14, 12, 9, 4); sticker('#a9713f', { pad: 3 });
  circ(0, 5, 8); sticker('#ffd166', { pad: 3 });
  txt('$', 0, 5, { size: 11, color: '#a8762a', stroke: false });
}
function drawGemPickup() {
  glow(0, 0, 44, '#ff9dbd', 0.6);
  poly([[-13, -4], [0, -18], [13, -4], [0, 16]]);
  const gg2 = grad('gem', c => {
    const q = c.createLinearGradient(-13, -18, 13, 16);
    q.addColorStop(0, '#ffd3e2'); q.addColorStop(0.5, '#ff7fa8'); q.addColorStop(1, '#c9366f');
    return q;
  });
  sticker(gg2);
  poly([[-13, -4], [0, -18], [0, -4]]); fillc(rgba('#fff', 0.55));
  poly([[13, -4], [0, -18], [0, -4]]); fillc(rgba('#fff', 0.2));
}
function drawHeartPickup() {
  glow(0, 0, 40, '#ff5d73', 0.55);
  poly([[0, 13], [-20, 2], [-17, -16], [0, -8], [17, -16], [20, 2]]);
  const hg2 = grad('heart', c => {
    const q = c.createRadialGradient(-5, -6, 1, 0, 0, 18);
    q.addColorStop(0, '#ffb3c8'); q.addColorStop(0.5, '#ff5d73'); q.addColorStop(1, '#c92448');
    return q;
  });
  sticker(hg2);
  ell(-6, -5, 3.4, 2.4, -0.5); fillc(rgba('#fff', 0.8));
}
function drawDiamondPickup() {
  glow(0, 0, 42, '#8fd6ff', 0.6);
  poly([[-14, 2], [-7, -12], [0, -17], [7, -12], [14, 2], [0, 15]]);
  sticker('#bfe9ff', { pad: 4 });
  poly([[-7, -12], [0, -3], [7, -12], [0, -17]]); fillc(rgba('#fff', 0.8));
  poly([[-14, 2], [-7, -12], [0, -3]]); fillc(rgba('#6fb7ff', 0.6));
}
function drawAdvisoryPickup() {
  glow(0, 0, 42, '#ffe27a', 0.55);
  rrPath(-16, -12, 32, 26, 6); sticker('#fffaf2', { pad: 4 });
  ctx.save(); rrPath(-16, -12, 32, 26, 6); ctx.clip();
  ctx.fillStyle = rgba('#c9366f', 0.16);
  for (let i = 0; i < 4; i++) ctx.fillRect(-16, -10 + i * 6, 32, 2);
  ctx.restore();
  txt('ADQ', 0, 1, { size: 11, color: '#c9366f', stroke: false, font: 'Space Mono' });
  circ(13, -13, 7); sticker('#ff5d73', { pad: 2.5 });
  txt('!', 13, -13, { size: 10, color: '#fff', stroke: false });
}
function drawLeverPickup() {
  glow(0, 0, 42, '#ff5d73', 0.6);
  poly([[0, -18], [16, 0], [0, 18], [-16, 0]]);
  sticker('#ff5d73', { pad: 4 });
  txt('100x', 0, 1, { size: 11, color: '#fff', stroke: false, font: 'Space Mono' });
}
function drawCratePickup(kind) {
  glow(0, 0, 46, '#ffe27a', 0.5);
  rrPath(-22, -18, 44, 36, 9);
  const cg = grad('crate2', c => {
    const q = c.createLinearGradient(0, -18, 0, 18);
    q.addColorStop(0, '#fff3d6'); q.addColorStop(1, '#e8b45a');
    return q;
  });
  sticker(cg);
  ctx.save();
  rrPath(-22, -18, 44, 36, 9); ctx.clip();
  ctx.fillStyle = rgba('#fff', 0.4);
  for (let i = -3; i < 4; i++) ctx.fillRect(i * 12 - 3, -20, 6, 40);
  ctx.restore();
  const w = WEAPONS[kind] || WEAPONS.blaster;
  txt(w.label, 0, 27, { size: 10, color: '#fff', stroke: INK, lw: 4 });
  ctx.save(); ctx.translate(0, -4); ctx.scale(0.62, 0.62); gunArt(kind); ctx.restore();
}

/* ---------------- particles + fx primitives ---------------- */
function drawDot() { circ(0, 0, 8); fillc('#fff'); }
function drawSquare() { ctx.fillRect(-8, -8, 16, 16); }
function drawHeartShape() {
  poly([[0, 12], [-17, 1], [-14, -13], [0, -7], [14, -13], [17, 1]]); fillc('#fff');
}
function drawStarShape() {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    ctx.lineTo(Math.cos(a) * (i % 2 ? 4 : 10), Math.sin(a) * (i % 2 ? 4 : 10));
  }
  ctx.closePath(); fillc('#fff');
}
function drawRingShape() {
  circ(0, 0, 14); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.4; ctx.stroke();
}
function drawGlowSprite() {
  const q = grad('glowsprite', c => {
    const g = c.createRadialGradient(0, 0, 0, 0, 0, 16);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.42)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    return g;
  });
  ctx.fillStyle = q; ctx.fillRect(-16, -16, 32, 32);
}
function drawPx() { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 4, 4); }
function drawShadow() { ell(0, 0, 16, 4.6); fillc('#000'); }
function drawSpeedLine() { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 100, 3); }
