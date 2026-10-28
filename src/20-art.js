function drawCrew(col) {
  col = col || C.red;
  // backpack (darker shade of the suit)
  rrPath(-24, -1, 11, 17, 4); sticker(shade(col, 0.72), { pad: 3.5 });
  // body with leg notch
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-13, 26);
    ctx.lineTo(-13, -8);
    ctx.arc(0, -8, 13, Math.PI, 0);
    ctx.lineTo(13, 26);
    ctx.lineTo(5, 26);
    ctx.lineTo(5, 16);
    ctx.lineTo(-5, 16);
    ctx.lineTo(-5, 26);
    ctx.closePath();
  };
  body(); sticker(col, { pad: 4.5 });
  ctx.save();
  body(); ctx.clip();
  ctx.globalAlpha = 0.17; ctx.fillStyle = '#000';
  ell(8, 10, 7, 13); ctx.fill();
  ctx.globalAlpha = 0.55; ctx.fillStyle = '#fff';
  ell(-6, -13, 4.5, 2.6, -0.4); ctx.fill();
  ctx.restore();
  // visor
  rrPath(-2, -16, 16, 11, 5.5); sticker('#bfe9ff', { pad: 3 });
  rrPath(0, -14, 5.5, 3.4, 1.7); fillc(rgba('#fff', 0.95));
  rrPath(7, -11, 4, 2.6, 1.3); fillc(rgba('#7dbfe8', 0.9));
}
function drawNpc() {
  rrPath(-12, 2, 24, 22, 6); sticker('#93a6c0');
  circ(-7, 24, 5); sticker('#4a5568', { pad: 3 });
  circ(7, 24, 5); sticker('#4a5568', { pad: 3 });
  rrPath(-16, -24, 32, 28, 7); sticker('#dbe4ef');
  circ(-6, -12, 3.2); fillc(INK);
  circ(6, -12, 3.2); fillc(INK);
  ctx.beginPath(); ctx.moveTo(-5, -3); ctx.lineTo(5, -3); line(2.4, INK);
  ctx.save(); ctx.globalAlpha = 0.55;
  [-3, 1, 5].forEach(dx => { circ(18 + dx, -28, 1.7); fillc(INK); });
  ctx.restore();
}
function drawToilet() {
  rrPath(-22, -26, 15, 20, 4); sticker('#dfe8f2', { pad: 4 });
  ctx.beginPath();
  ctx.moveTo(-17, 2); ctx.lineTo(19, 2); ctx.lineTo(14, 24); ctx.lineTo(-12, 24); ctx.closePath();
  sticker('#f2f7fc', { pad: 5 });
  ell(1, 0, 20, 7); sticker('#fff', { pad: 4 });
  ell(1, 0, 13, 4); fillc('#c6d6e6');
  circ(2, -14, 12.5); sticker('#f3c6a2', { pad: 5 });
  circ(-3, -16, 2.6); fillc(INK);
  circ(7, -16, 2.6); fillc(INK);
  ctx.beginPath(); ctx.arc(2, -10, 6, 0.1, Math.PI - 0.1); line(2.4, INK);
  ctx.beginPath(); ctx.moveTo(-8, -22); ctx.lineTo(-2, -20); line(2, INK);
  ctx.beginPath(); ctx.moveTo(12, -20); ctx.lineTo(7, -22); line(2, INK);
}
function drawDoge() {
  poly([[-19, -12], [-13, -27], [-3, -16]]); sticker('#d9964a');
  poly([[19, -12], [13, -27], [3, -16]]); sticker('#d9964a');
  ell(0, 0, 21, 19); sticker('#e8a94b');
  ell(0, 8, 13, 10); sticker('#fff2dc', { pad: 3 });
  ell(-8, -4, 4.2, 4.8); fillc(INK);
  ell(8, -4, 4.2, 4.8); fillc(INK);
  circ(-6.5, -5.5, 1.4); fillc('#fff');
  circ(9.5, -5.5, 1.4); fillc('#fff');
  ctx.beginPath(); ctx.moveTo(-13, -11); ctx.lineTo(-4, -9); line(2.2, INK);
  ell(0, 3, 3.4, 2.6); fillc(INK);
  ctx.beginPath(); ctx.moveTo(0, 6); ctx.quadraticCurveTo(4, 11, 8, 6); line(2, INK);
  ctx.beginPath(); ctx.moveTo(0, 6); ctx.quadraticCurveTo(-4, 11, -8, 6); line(2, INK);
}
function drawBrain() {
  ctx.save();
  ctx.beginPath();
  const bumps = 9;
  for (let i = 0; i <= bumps; i++) {
    const a = -Math.PI / 2 + (i / bumps) * TAU;
    const rr2 = 21 + Math.sin(i * 2.6) * 3.4;
    const px = Math.cos(a) * rr2 * 1.02, py = Math.sin(a) * rr2 * 0.92;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
  sticker('#ff9dbd');
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = rgba('#c9506f', 0.55); ctx.lineWidth = 2.2; ctx.lineCap = 'round';
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(-18, i * 8);
    ctx.bezierCurveTo(-8, i * 8 - 7, 4, i * 8 + 7, 18, i * 8);
    ctx.stroke();
  }
  ctx.restore();
  ctx.beginPath(); ctx.moveTo(-2, -20); ctx.lineTo(-2, 18); line(2, rgba('#c9506f', 0.5));
  ctx.restore();
  ell(-8, -2, 5, 6.5); fillc('#fff');
  ell(8, -2, 5, 6.5); fillc('#fff');
  circ(-7, -1, 2.6); fillc(INK);
  circ(9, -1, 2.6); fillc(INK);
  ctx.beginPath(); ctx.arc(0, 9, 6, 0.15, Math.PI - 0.15); line(2.2, INK);
}
function drawCrownArt() {
  ctx.save();
  poly([[-19, 8], [-19, -14], [-9, -4], [0, -19], [9, -4], [19, -14], [19, 8]]);
  const gg = grad('crown', c => {
    const q = c.createLinearGradient(0, -19, 0, 10);
    q.addColorStop(0, '#fff0b8'); q.addColorStop(0.5, '#ffd166'); q.addColorStop(1, '#e0a33c');
    return q;
  });
  sticker(gg);
  circ(0, 1, 3.4); fillc(C.red);
  circ(-11, 2, 2.6); fillc(C.blue);
  circ(11, 2, 2.6); fillc(C.mint);
  ctx.restore();
  rrPath(-14, 10, 12, 8, 3); sticker('#3a2340', { pad: 3, ink: '#20131f' });
  rrPath(2, 10, 12, 8, 3); sticker('#3a2340', { pad: 3, ink: '#20131f' });
  ctx.beginPath(); ctx.moveTo(-2, 13); ctx.lineTo(2, 13); line(2, '#3a2340');
  ctx.beginPath();
  ctx.moveTo(-9, 21); ctx.quadraticCurveTo(0, 26, 9, 21); line(2.4, INK);
}
function drawPortal() {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i <= 18; i++) {
    const a = (i / 18) * TAU;
    const rad = 21 + (i % 2 ? 2.6 : -1.6);
    const px = Math.cos(a) * rad, py = Math.sin(a) * rad * 0.95;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
  sticker('#4a2f5e', { halo: '#e8d6f5' });
  ell(-8, -6, 4.4, 5.4); fillc('#fff');
  ell(8, -6, 4.4, 5.4); fillc('#fff');
  circ(-8, -5, 2.2); fillc(C.red);
  circ(8, -5, 2.2); fillc(C.red);
  ctx.beginPath();
  ctx.moveTo(-9, 6);
  for (let i = 0; i < 5; i++) ctx.lineTo(-9 + (i + 0.5) * 3.6, i % 2 ? 6 : 10);
  ctx.lineTo(9, 6);
  line(2.2, '#fff');
  ctx.beginPath(); ctx.moveTo(-21, 4); ctx.lineTo(-29, -2); line(3, '#4a2f5e');
  ctx.beginPath(); ctx.moveTo(21, 4); ctx.lineTo(29, -2); line(3, '#4a2f5e');
  ctx.restore();
}
function drawGrassArt() {
  ell(0, 14, 21, 10); sticker('#5cb874');
  ctx.save();
  for (let i = -3; i <= 3; i++) {
    const bx = i * 6;
    poly([[bx - 3, 12], [bx + 3, 12], [bx + 1 + hash(i + 9) * 3 - 1.5, -16 - hash(i) * 8]]);
    sticker('#7fd48a', { pad: 3 });
  }
  ctx.restore();
  ell(16, 4, 7, 6, 0.3); sticker('#f3c6a2', { pad: 3 });
  ctx.beginPath(); ctx.moveTo(11, 6); ctx.lineTo(4, 10); line(3, '#f3c6a2');
  circ(-8, 2, 3); fillc(INK);
  circ(2, 2, 3); fillc(INK);
}
function drawRatioBubble() {
  rrPath(-22, -20, 44, 30, 10); sticker('#f4f8ff');
  poly([[-8, 9], [2, 9], [-4, 20]]); sticker('#f4f8ff', { pad: 3 });
  txt('0', -4, -5, { size: 26, color: '#8fa6c4', stroke: false, weight: 700 });
  poly([[10, -14], [20, -14], [15, 2]]); fillc('#ff5d73');
  rrPath(-6, 16, 18, 12, 5); sticker('#ffe27a', { pad: 3 });
  txt('1', 3, 22, { size: 11, color: INK, stroke: false, weight: 700 });
}
function drawFries() {
  for (let i = -2; i <= 2; i++) {
    poly([[i * 6 - 2.5, -6], [i * 6 + 2.5, -6], [i * 6 + 2, -24 - hash(i + 3) * 6], [i * 6 - 2, -24 - hash(i + 7) * 6]]);
    sticker('#ffd166', { pad: 3 });
  }
  poly([[-17, -10], [17, -10], [13, 24], [-13, 24]]); sticker('#ff5d73');
  rrPath(-15, -4, 30, 7, 3); fillc('#fff');
  circ(-6, 10, 2.4); fillc('#fff');
  circ(6, 10, 2.4); fillc('#fff');
  ctx.beginPath(); ctx.arc(0, 14, 6, 0.2, Math.PI - 0.2); line(2.2, INK);
}
function drawCoat() {
  poly([[-13, 24], [-9, -8], [9, -8], [13, 24]]); sticker('#3d3d4f', { halo: '#e6e6f0' });
  poly([[-9, -8], [0, 8], [9, -8]]); fillc('#5a5a72');
  circ(0, -17, 11); sticker('#e8c3a0', { pad: 4 });
  poly([[-11, -20], [-6, -28], [7, -27], [11, -19], [6, -23], [-5, -24]]); fillc('#2a2a38');
  ell(-4, -17, 2.4, 1.6); fillc(INK);
  ell(4, -17, 2.4, 1.6); fillc(INK);
  ctx.beginPath(); ctx.moveTo(-4, -11); ctx.lineTo(4, -11); line(2, INK);
  rrPath(15, -14, 6, 22, 3); sticker('#8d99ae', { pad: 3 });
  circ(18, -19, 6); sticker('#4a5568', { pad: 3 });
}
function drawJaw() {
  ctx.beginPath();
  ctx.moveTo(-16, -6);
  ctx.quadraticCurveTo(-16, -25, 0, -25);
  ctx.quadraticCurveTo(16, -25, 16, -6);
  ctx.lineTo(11, 14);
  ctx.lineTo(0, 24);
  ctx.lineTo(-11, 14);
  ctx.closePath();
  sticker('#f0c8a8');
  ell(-6, -8, 4, 4.6); fillc('#fff');
  ell(6, -8, 4, 4.6); fillc('#fff');
  circ(-6, -7, 2.3); fillc(INK);
  circ(6, -7, 2.3); fillc(INK);
  ctx.beginPath(); ctx.moveTo(-11, -15); ctx.lineTo(-2, -13); line(2.4, INK);
  ctx.beginPath(); ctx.moveTo(11, -15); ctx.lineTo(2, -13); line(2.4, INK);
  ctx.beginPath(); ctx.moveTo(-5, 6); ctx.lineTo(5, 6); line(2.6, INK);
  ctx.save(); ctx.globalAlpha = 0.25; ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(-11, 12); ctx.lineTo(0, 20); ctx.lineTo(11, 12); ctx.stroke();
  ctx.restore();
  ell(-14, 8, 5, 7, 0.5); sticker('#f3c6a2', { pad: 3 });
}

function drawMegaphone() {
  rrPath(-7, 6, 13, 18, 4); sticker('#c98c5a', { pad: 3 });
  poly([[-16, -15], [10, -23], [18, 9], [-14, 3]]);
  const mg = grad('mega', c => {
    const q = c.createLinearGradient(-16, -20, 18, 10);
    q.addColorStop(0, '#ffb066'); q.addColorStop(0.5, '#ff8a4c'); q.addColorStop(1, '#d05a17');
    return q;
  });
  sticker(mg);
  ell(-16, -6, 5, 12, -0.13); sticker('#ffd9b3', { pad: 3 });
  ell(7, -7, 7, 5); fillc('#7a2a1a');
  ctx.strokeStyle = rgba('#ffd166', 0.95); ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (let i = 1; i <= 3; i++) { ctx.beginPath(); ctx.arc(20, -7, 6 * i, -0.7, 0.7); ctx.stroke(); }
  circ(-6, -13, 2.6); fillc(INK);
  circ(1, -15, 2.6); fillc(INK);
}
function drawFine() {
  for (let i = -1; i <= 1; i++) {
    poly([[i * 11 - 6, -6], [i * 11 + 6, -6], [i * 11 + i * 3, -28 - Math.abs(i) * 7]]);
    sticker(i === 0 ? '#ffd166' : '#ff9f43', { pad: 3 });
  }
  rrPath(-20, -8, 40, 32, 4);
  const bx = grad('box', c => {
    const q = c.createLinearGradient(0, -8, 0, 24);
    q.addColorStop(0, '#d9a06a'); q.addColorStop(1, '#a9713f');
    return q;
  });
  sticker(bx);
  ctx.save(); rrPath(-20, -8, 40, 32, 4); ctx.clip();
  ctx.strokeStyle = rgba('#6b3d1c', 0.45); ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(-20, 8); ctx.lineTo(20, 8); ctx.stroke();
  ctx.restore();
  ell(0, -13, 14, 12); sticker('#e8c39a');
  poly([[-13, -18], [-16, -27], [-6, -22]]); sticker('#c99a6a', { pad: 2.5 });
  poly([[13, -18], [16, -27], [6, -22]]); sticker('#c99a6a', { pad: 2.5 });
  ell(-5, -15, 2.6, 3); fillc(INK);
  ell(5, -15, 2.6, 3); fillc(INK);
  ell(0, -9, 3, 2.2); fillc(INK);
  ctx.beginPath(); ctx.moveTo(-5, -5); ctx.lineTo(5, -5); line(2.2, INK);
}
function drawBirdaccino() {
  poly([[-3, 6], [15, 6], [12, 27], [0, 27]]); sticker('#f4e3c8', { pad: 3 });
  rrPath(-5, 2, 23, 6, 3); sticker('#8a5a2a', { pad: 2.5 });
  ctx.beginPath(); ctx.moveTo(9, 2); ctx.lineTo(13, -13); line(3.2, '#e8618c');
  ell(-7, -6, 15, 13); sticker('#a97c50');
  ell(-15, -3, 7.5, 6, -0.3); sticker('#8a5f3a', { pad: 2.5 });
  circ(-14, -11, 3.6); fillc('#fff');
  circ(-14.8, -11, 2); fillc(INK);
  poly([[-22, -9], [-30, -5.5], [-22, -2]]); sticker('#ffb347', { pad: 2 });
  ctx.save(); ctx.globalAlpha = 0.5;
  ell(6, -16, 3, 2); fillc('#fff');
  ctx.restore();
}
function drawChad() {
  ctx.beginPath();
  ctx.moveTo(-14, -4);
  ctx.quadraticCurveTo(-14, -25, 0, -25);
  ctx.quadraticCurveTo(14, -25, 14, -4);
  ctx.lineTo(10, 12); ctx.lineTo(0, 25); ctx.lineTo(-10, 12);
  ctx.closePath();
  sticker('#e6e0f0');
  poly([[-14, -14], [-8, -27], [8, -27], [14, -14], [6, -21], [-6, -21]]); fillc('#5a4a6a');
  ctx.strokeStyle = rgba('#8f86a8', 0.85); ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-11, 1); ctx.lineTo(-3, 9); ctx.lineTo(3, 3); ctx.lineTo(11, 9); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-10, -9); ctx.lineTo(-3, -7.5); line(2.8, INK);
  ctx.beginPath(); ctx.moveTo(10, -9); ctx.lineTo(3, -7.5); line(2.8, INK);
  ctx.beginPath(); ctx.moveTo(-4, 15); ctx.lineTo(4, 15); line(2.8, INK);
  ctx.save(); ctx.globalAlpha = 0.35;
  ell(-8, -14, 3, 2, -0.4); fillc('#fff');
  ctx.restore();
}
function drawBot() {
  rrPath(-14, -24, 28, 48, 8); sticker('#3a2340', { pad: 4.5, halo: '#e4d8f0' });
  rrPath(-10.5, -18, 21, 34, 4); sticker('#dff0ff', { pad: 0, lw: 1.6 });
  circ(-4.5, -8, 2.8); fillc(INK);
  circ(4.5, -8, 2.8); fillc(INK);
  ctx.beginPath(); ctx.arc(0, 8, 6, Math.PI + 0.4, -0.4); line(2.4, INK);
  ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(0, -33); line(2.6, '#3a2340');
  circ(10, -26, 6.5); sticker('#ff5d73', { pad: 2.5 });
  txt('!', 10, -26, { size: 11, color: '#fff', stroke: false });
}

const BOX_D = [-40, -52, 80, 86];
const MEMES = [
  { label: 'SUS', draw: drawCrew, col: C.red, r: 24, tag: 'sus', art: 'm_sus0', box: BOX_D },
  { label: 'SUS', draw: drawCrew, col: C.blue, r: 24, tag: 'sus', art: 'm_sus1', box: BOX_D },
  { label: 'SUS', draw: drawCrew, col: C.mintD, r: 24, tag: 'sus', art: 'm_sus2', box: BOX_D },
  { label: 'NPC', draw: drawNpc, col: '#93a6c0', r: 24, tag: 'npc', art: 'm_npc', box: BOX_D },
  { label: 'SKIBIDI', draw: drawToilet, col: '#f2f7fc', r: 27, tag: 'toilet', art: 'm_toilet', box: [-42, -56, 84, 90] },
  { label: 'DOGE', draw: drawDoge, col: '#e8a94b', r: 25, tag: 'doge', art: 'm_doge', box: BOX_D },
  { label: 'BRAINROT', draw: drawBrain, col: '#ff9dbd', r: 25, tag: 'brain', art: 'm_brain', box: BOX_D },
  { label: 'RIZZ', draw: drawCrownArt, col: '#ffd166', r: 24, tag: 'crown', art: 'm_crown', box: BOX_D },
  { label: 'OHIO', draw: drawPortal, col: '#4a2f5e', r: 25, tag: 'ohio', art: 'm_ohio', box: [-46, -52, 92, 88] },
  { label: 'TOUCH GRASS', draw: drawGrassArt, col: '#7fd48a', r: 24, tag: 'grass', art: 'm_grass', box: BOX_D },
  { label: 'RATIO', draw: drawRatioBubble, col: '#f4f8ff', r: 25, tag: 'ratio', art: 'm_ratio', box: BOX_D },
  { label: 'FANUM TAX', draw: drawFries, col: '#ff5d73', r: 25, tag: 'fries', art: 'm_fries', box: [-42, -52, 84, 86] },
  { label: 'RICKROLL', draw: drawCoat, col: '#3d3d4f', r: 25, tag: 'coat', art: 'm_coat', box: [-46, -54, 92, 88] },
  { label: 'MEWING', draw: drawJaw, col: '#f0c8a8', r: 25, tag: 'jaw', art: 'm_jaw', box: BOX_D },
  { label: 'GYATT', draw: drawMegaphone, col: '#ff8a4c', r: 25, tag: 'mega', art: 'm_mega', box: [-44, -52, 88, 86] },
  { label: 'THIS IS FINE', draw: drawFine, col: '#d9a06a', r: 25, tag: 'fine', art: 'm_fine', box: [-46, -52, 92, 86] },
  { label: 'BIRDACCINO', draw: drawBirdaccino, col: '#a97c50', r: 24, tag: 'bird', art: 'm_bird', box: BOX_D },
  { label: 'GIGACHAD', draw: drawChad, col: '#e6e0f0', r: 26, tag: 'chad', art: 'm_chad', box: [-46, -54, 92, 88] },
  { label: 'SPAM BOT', draw: drawBot, col: '#3a2340', r: 24, tag: 'bot', shoots: true, art: 'm_bot', box: [-46, -52, 92, 88] },
  /* degen edition */
  { label: 'PEPE', draw: drawPepe, col: '#69c96a', r: 25, tag: 'pepe', art: 'm_pepe', box: BOX_D },
  { label: '$SHIB', draw: drawShib, col: '#e8b072', r: 25, tag: 'shib', art: 'm_shib', box: BOX_D, degen: 1 },
  { label: '$WIF', draw: drawWif, col: '#f2f4f8', r: 25, tag: 'wif', art: 'm_wif', box: [-40, -56, 80, 90], degen: 1 },
  { label: 'BONK', draw: drawBonk, col: '#e8a94b', r: 26, tag: 'bonk', art: 'm_bonk', box: [-42, -56, 84, 88], degen: 1 },
  { label: 'WHALE', draw: drawWhale, col: '#5b8fd6', r: 30, tag: 'whale', art: 'm_whale', box: [-50, -40, 100, 72], hp: 5, degen: 1, heavy: 1 },
  { label: '$MOON', draw: drawRocket, col: '#ff9040', r: 26, tag: 'rocket', art: 'm_rocket', box: [-42, -42, 84, 84], fly: true, degen: 1 },
  { label: 'REKT', draw: drawCandle, col: '#ff5d73', r: 24, tag: 'candle', art: 'm_candle', box: [-34, -58, 68, 92], degen: 1 },
  { label: 'DIAMOND', draw: drawDiamond, col: '#bfe9ff', r: 26, tag: 'diamond', art: 'm_diamondm', box: [-48, -46, 96, 76], hp: 6, degen: 1, heavy: 1 },
  { label: 'RUG', draw: drawRug, col: '#b2546f', r: 27, tag: 'rug', art: 'm_rug', box: [-48, -40, 96, 68], degen: 1 },
  { label: 'PRINTER', draw: drawPrinter, col: '#8fe3a0', r: 26, tag: 'printer', art: 'm_printer', box: [-40, -46, 80, 76], shoots: true, degen: 1 },
  { label: 'TO THE MOON', draw: drawMoonFace, col: '#ffe27a', r: 26, tag: 'moon', art: 'm_moon', box: [-42, -44, 84, 80], fly: true, degen: 1 }
];
const DEGEN_MEMES = MEMES.filter(m => m.degen);
const BOSS_KINDS = ['ALGORITHM', 'WHALE'];

/* ============================================================
   OBSTACLE ART — origin at (0,0) = ground level, left edge
   ============================================================ */
function drawSpikeBox(w, h) {
  const gg = grad('crate', c => {
    const q = c.createLinearGradient(0, -40, 0, 0);
    q.addColorStop(0, '#d9a06a'); q.addColorStop(1, '#a9713f');
    return q;
  });
  rrPath(0, -h, w, h, 6); sticker(gg);
  ctx.save();
  ctx.beginPath(); rrPath(0, -h, w, h, 6); ctx.clip();
  ctx.strokeStyle = rgba('#6b3d1c', 0.4); ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(2, -h + 4); ctx.lineTo(w - 2, -6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(2, -6); ctx.lineTo(w - 2, -h + 4); ctx.stroke();
  ctx.restore();
  const n = Math.max(2, Math.round(w / 16));
  for (let i = 0; i < n; i++) {
    const x = (i + 0.5) * (w / n);
    poly([[x - 7, -h], [x + 7, -h], [x, -h - 11]]);
    sticker('#cfd8e3', { pad: 3 });
  }
  txt('404', w / 2, -h * 0.5, { size: 12, color: '#fff6e6', stroke: false });
}
function drawSaw(w, h, t) {
  const cy = -h * 0.42;
  ctx.save();
  // mount
  rrPath(w * 0.34, -14, w * 0.32, 16, 4); sticker('#6b7a8f', { pad: 3 });
  ctx.translate(w / 2, cy);
  ctx.rotate(t * 6);
  const teeth = 8;
  ctx.beginPath();
  for (let i = 0; i < teeth; i++) {
    const ab = (i / teeth) * TAU;
    const ap = ab + 0.16;
    const an = ((i + 1) / teeth) * TAU;
    const rO = h * 0.70, rI = h * 0.46;
    ctx.lineTo(Math.cos(ab) * rI, Math.sin(ab) * rI);
    ctx.lineTo(Math.cos(ap) * rO, Math.sin(ap) * rO);
    ctx.lineTo(Math.cos(an - 0.1) * rI, Math.sin(an - 0.1) * rI);
  }
  ctx.closePath();
  const sg = grad('saw', c => {
    const q = c.createLinearGradient(-20, -20, 20, 20);
    q.addColorStop(0, '#f2f6fa'); q.addColorStop(0.5, '#b9c6d4'); q.addColorStop(1, '#7d8ea3');
    return q;
  });
  sticker(sg, { halo: '#fff', pad: 4, lw: 2.4 });
  circ(0, 0, h * 0.30); line(2, rgba('#5a6b80', 0.65));
  circ(0, 0, h * 0.17); sticker('#e8618c', { pad: 3 });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU + 0.4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * h * 0.22, Math.sin(a) * h * 0.22);
    ctx.lineTo(Math.cos(a) * h * 0.36, Math.sin(a) * h * 0.36);
    line(3, rgba('#5a6b80', 0.85));
  }
  ctx.restore();
}
function drawCone(w, h) {
  const conePath = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, 0); ctx.lineTo(w * 0.5, 0);
    ctx.lineTo(w * 0.2, -h * 0.88); ctx.lineTo(-w * 0.2, -h * 0.88);
    ctx.closePath();
  };
  const cg = grad('cone', c => {
    const q = c.createLinearGradient(-w * 0.5, 0, w * 0.5, 0);
    q.addColorStop(0, '#f0691f'); q.addColorStop(0.4, '#ff9040'); q.addColorStop(1, '#d05a17');
    return q;
  });
  conePath(); sticker(cg);
  ctx.save();
  conePath(); ctx.clip();
  ctx.fillStyle = '#fff8f0';
  ctx.fillRect(-w, -h * 0.60, w * 2, h * 0.11);
  ctx.fillStyle = rgba('#fff', 0.22);
  ctx.fillRect(-w * 0.5, -h, w * 0.34, h);
  ctx.restore();
  rrPath(-w * 0.24, -h * 0.96, w * 0.48, h * 0.12, 4); sticker('#f0691f', { pad: 3 });
  rrPath(-w * 0.55, -6, w * 1.1, 7, 3); sticker('#f0691f', { pad: 3 });
  rrPath(-w * 0.3, -h * 0.40, w * 0.26, h * 0.12, 4); sticker(INK, { pad: 2.5, ink: '#20131f' });
  rrPath(w * 0.04, -h * 0.40, w * 0.26, h * 0.12, 4); sticker(INK, { pad: 2.5, ink: '#20131f' });
  ctx.beginPath(); ctx.moveTo(-w * 0.04, -h * 0.35); ctx.lineTo(w * 0.04, -h * 0.35); line(2, INK);
}
function drawMonitor(w, h) {
  rrPath(w * 0.36, -h * 0.34, w * 0.28, h * 0.34, 4); sticker('#8d99ae', { pad: 3 });
  rrPath(0, -h, w, h * 0.78, 10); sticker('#cfd8e3');
  rrPath(4, -h + 5, w - 8, h * 0.78 - 12, 7);
  const sg = grad('crt', c => {
    const q = c.createLinearGradient(0, -h, 0, -h * 0.25);
    q.addColorStop(0, '#4b6cb7'); q.addColorStop(1, '#182848');
    return q;
  });
  sticker(sg, { pad: 0, lw: 0 });
  ctx.save();
  ctx.globalAlpha = 0.18; ctx.fillStyle = '#fff';
  for (let y = -h + 6; y < -h * 0.25; y += 4) ctx.fillRect(5, y, w - 10, 1.5);
  ctx.restore();
  circ(w * 0.34, -h * 0.66, 3.2); fillc('#fff');
  circ(w * 0.66, -h * 0.66, 3.2); fillc('#fff');
  ctx.beginPath(); ctx.arc(w * 0.5, -h * 0.44, 7, Math.PI + 0.3, -0.3); line(2.4, '#fff');
  txt('404', w * 0.5, -h * 0.9, { size: 10, color: '#8fd6ff', stroke: false });
}
function drawNft(w, h) {
  rrPath(0, -h, w, h, 5);
  const fg = grad('frame', c => {
    const q = c.createLinearGradient(0, -h, w, 0);
    q.addColorStop(0, '#ffe9a8'); q.addColorStop(0.5, '#d9a13c'); q.addColorStop(1, '#a8762a');
    return q;
  });
  sticker(fg);
  rrPath(6, -h + 6, w - 12, h - 14, 3); sticker('#2b1e33', { pad: 2 });
  const px = (a, b, col) => { ctx.fillStyle = col; ctx.fillRect(6 + a * ((w - 12) / 8), -h + 6 + b * ((h - 14) / 8), (w - 12) / 8 + 0.6, (h - 14) / 8 + 0.6); };
  px(1, 1, '#8fd6ff'); px(6, 1, '#8fd6ff');
  px(2, 3, '#ffb3c8'); px(3, 3, '#ffb3c8'); px(4, 3, '#ffb3c8'); px(5, 3, '#ffb3c8');
  px(1, 4, '#ffb3c8'); px(6, 4, '#ffb3c8');
  px(2, 5, '#ffe9a8'); px(3, 5, '#ffe9a8'); px(4, 5, '#ffe9a8'); px(5, 5, '#ffe9a8');
  px(3, 6, '#ff5d73'); px(4, 6, '#ff5d73');
  txt('1/1', w * 0.5, 8, { size: 9, color: '#fff', stroke: INK, lw: 3 });
}
const BLOCKS = [drawSpikeBox, drawSaw, drawCone, drawMonitor, drawNft];

/* ============================================================
   PLAYER ART
   ============================================================ */
/* Baked once per animation frame of the run cycle. All world transforms
   (tilt, squash, flip, invuln flicker, recoil) are applied by the quad emitter. */
function drawPlayerBody(t) {
  const p = player;
  ctx.save();

  // scarf
  const segs = 6;
  const pts = [], pts2 = [];
  for (let i = 0; i <= segs; i++) {
    const k = i / segs;
    const bx = -R * 0.55 - i * 8.5;
    const by = -R * 0.35 + Math.sin(t * 13 - i * 0.85) * (2 + i * 1.5) + i * 1.2;
    const wdt = 7 - i * 0.7;
    pts.push([bx, by - wdt]); pts2.push([bx, by + wdt]);
  }
  poly(pts.concat(pts2.reverse()));
  sticker('#ff5d73', { pad: 4 });
  ctx.save();
  ctx.beginPath();
  poly(pts.concat(pts2.reverse()));
  ctx.clip();
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 4; i++) ctx.fillRect(-R - 56 + i * 22, -40, 8, 80);
  ctx.restore();

  // legs
  const stride = p.grounded ? Math.sin(runPhase) * 7 : 3;
  const lift = p.grounded ? Math.max(0, Math.sin(runPhase)) * 3 : 6;
  ell(-8 + stride, R * 0.92 - (p.grounded ? 0 : 4) - lift * 0, 8.5, 6); sticker('#d4708f', { pad: 3 });
  ell(9 - stride, R * 0.92 - (p.grounded ? 0 : 6), 8.5, 6); sticker('#d4708f', { pad: 3 });

  // body
  const bg = grad('body', c => {
    const q = c.createRadialGradient(-7, -9, 2, 0, 0, R * 1.5);
    q.addColorStop(0, '#fff2f7'); q.addColorStop(0.42, '#ffc2d6'); q.addColorStop(1, '#ff8fb3');
    return q;
  });
  ell(0, 0, R, R * 1.08);
  sticker(bg, { pad: 5.5 });

  // rim light
  ctx.save();
  ctx.beginPath(); ell(0, 0, R, R * 1.08); ctx.clip();
  glow(R * 0.7, R * 0.5, R * 0.9, '#fff0f6', 0.5);
  ctx.beginPath(); ell(-R * 0.42, -R * 0.62, R * 0.34, R * 0.2, -0.5);
  ctx.fillStyle = rgba('#fff', 0.75); ctx.fill();
  ctx.restore();

  // blush
  ctx.save(); ctx.globalAlpha = 0.55;
  ell(-R * 0.68, R * 0.24, 6, 3.8, -0.2); fillc('#ff7d9c');
  ell(R * 0.68, R * 0.24, 6, 3.8, 0.2); fillc('#ff7d9c');
  ctx.restore();

  // eyes
  p.blinkT -= 1 / 60;
  if (p.blinkT <= 0) { p.blink = 1; p.blinkT = rnd(1.6, 4.2); }
  if (p.blink > 0) p.blink = Math.max(0, p.blink - 0.13);
  const openY = 1 - Math.sin(p.blink * Math.PI) * 0.95;
  const ax = clamp(p.aim, -1, 1);
  if (state === 'dying') {
    ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    [-1, 1].forEach(s => {
      const ex = s * R * 0.42, ey = -R * 0.3;
      ctx.beginPath(); ctx.moveTo(ex - 4.5, ey - 4.5); ctx.lineTo(ex + 4.5, ey + 4.5);
      ctx.moveTo(ex + 4.5, ey - 4.5); ctx.lineTo(ex - 4.5, ey + 4.5); ctx.stroke();
    });
  } else [-1, 1].forEach(s => {
    const ex = s * R * 0.42, ey = -R * 0.3;
    ell(ex, ey, 6.4, 7.6 * openY); fillc('#fff');
    if (openY > 0.25) {
      circ(ex + ax * 2.4, ey + 1, 3.4); fillc(INK);
      circ(ex + ax * 2.4 - 1.2, ey - 0.6, 1.3); fillc('#fff');
    }
  });

  // brows (determined little frown while shooting)
  if (shootHeld || muzzle > 0) {
    ctx.beginPath(); ctx.moveTo(-R * 0.62, -R * 0.78); ctx.lineTo(-R * 0.16, -R * 0.66); line(2.6, INK);
    ctx.beginPath(); ctx.moveTo(R * 0.62, -R * 0.78); ctx.lineTo(R * 0.16, -R * 0.66); line(2.6, INK);
  }

  // mouth
  ctx.beginPath();
  if (!p.grounded) { ell(0, R * 0.36, 4.2, 5); sticker(INK, { pad: 2, ink: '#7a3350' }); }
  else if (muzzle > 0) { ctx.arc(0, R * 0.24, 7, 0.1, Math.PI - 0.1); line(2.6, INK); ell(0, R * 0.4, 4, 2.4); fillc('#ff7d9c'); }
  else { ctx.arc(0, R * 0.22, 6.5, 0.15, Math.PI - 0.15); line(2.6, INK); }

  // antenna
  ctx.beginPath();
  ctx.moveTo(2, -R * 0.95);
  ctx.quadraticCurveTo(11, -R * 1.45, 18, -R * 1.2 + Math.sin(t * 6) * 2);
  line(3, '#d4708f');
  const hx = 19, hy = -R * 1.2 + Math.sin(t * 6) * 2;
  const pulse = 1 + Math.sin(t * 7) * 0.12;
  glow(hx, hy, 16 * pulse, '#ff8fb3', 0.7);
  ctx.save();
  ctx.translate(hx, hy); ctx.scale(pulse, pulse);
  ctx.beginPath();
  ctx.moveTo(0, 4.4);
  ctx.bezierCurveTo(-7, 0.6, -6.2, -5.6, 0, -3.2);
  ctx.bezierCurveTo(6.2, -5.6, 7, 0.6, 0, 4.4);
  ctx.closePath();
  sticker('#ff5d73', { pad: 2.5 });
  ctx.restore();

  ctx.restore();
}

/* The gun is a separate sprite so aim and recoil stay live. Pivot = (0,0). */
function gunArt(kind) {
  const bgun = grad('gun' + kind, c => {
    const q = c.createLinearGradient(0, -8, 0, 10);
    q.addColorStop(0, '#6b5a7d'); q.addColorStop(0.5, '#3f2f52'); q.addColorStop(1, '#251834');
    return q;
  });
  const grip = () => { rrPath(-2, 8, 9, 10, 3); sticker('#d4708f', { pad: 3 }); };
  if (kind === 'blaster') {
    rrPath(-4, -6, 30, 15, 5); sticker(bgun, { pad: 4, halo: '#e9d9f2' });
    rrPath(2, -9, 14, 5, 2); sticker('#7fd3a8', { pad: 2.5 });
    rrPath(22, -3, 10, 9, 3); sticker('#7fd3a8', { pad: 3 });
    circ(33, 1.5, 4); fillc('#c6f5d6');
    circ(33, 1.5, 2); fillc('#fff');
    grip();
  } else if (kind === 'bread') {
    rrPath(-6, -7, 26, 16, 6); sticker(bgun, { pad: 4 });
    ell(26, 0, 12, 9); sticker('#e8b45a', { pad: 3.5 });
    ell(26, 0, 7, 5); sticker('#f7dca8', { pad: 0, lw: 0 });
    circ(24, -2, 1.4); fillc(INK); circ(29, -2, 1.4); fillc(INK);
    grip();
  } else if (kind === 'prism') {
    poly([[-6, 7], [16, -3], [34, 0], [16, 6]]); sticker('#7be0ff', { pad: 3.5 });
    poly([[10, 0], [22, -2], [30, 0]]); fillc(rgba('#fff', 0.8));
    ctx.beginPath(); ctx.moveTo(-2, 9); ctx.lineTo(10, 9); line(3, '#ff9dbd');
    rrPath(-8, -10, 14, 8, 3); sticker('#3f2f52', { pad: 2.5 });
    grip();
  } else if (kind === 'voidgun') {
    rrPath(-8, -7, 22, 15, 6); sticker(bgun, { pad: 4 });
    circ(22, 0, 10); fillc('#1b0a2c');
    ell(22, 0, 16, 5, 0.4); line(3, '#c9a8e8');
    circ(19, -3, 2.4); fillc(rgba('#fff', 0.85));
    grip();
  } else if (kind === 'susgun') {
    rrPath(-8, -8, 22, 17, 6); sticker(bgun, { pad: 4 });
    ctx.save(); ctx.translate(24, 0); ctx.scale(0.42, 0.42); drawCrew('#ff5d73'); ctx.restore();
    grip();
  } else if (kind === 'moonshot') {
    rrPath(-8, -9, 30, 18, 7); sticker('#cfd8e3', { pad: 4 });
    poly([[22, -7], [40, 0], [22, 7]]); sticker('#ff5d73', { pad: 3.5 });
    poly([[-2, -9], [4, -18], [10, -9]]); sticker('#6fb7ff', { pad: 2.5 });
    rrPath(-4, 3, 12, 6, 2); fillc(rgba('#3a2340', 0.35));
    txt('MOON', 6, 0, { size: 8, color: '#3a2340', stroke: false });
    grip();
  } else if (kind === 'pump') {
    poly([[-10, -9], [6, -4], [6, 7], [-10, 10]]); sticker('#ff9dbd', { pad: 3.5 });
    poly([[6, -4], [20, -8], [20, 11], [6, 7]]); sticker('#ffd3e2', { pad: 3.5 });
    rrPath(20, -6, 16, 13, 4); sticker('#e8618c', { pad: 3 });
    txt('$', 28, 0, { size: 11, color: '#fff', stroke: false });
    grip();
  } else if (kind === 'leverage') {
    rrPath(-14, -5, 22, 12, 4); sticker('#cfd8e3', { pad: 3.5 });
    poly([[4, -3], [40, -13], [44, -6], [8, 4]]); sticker('#ff5d73', { pad: 3.5 });
    circ(2, 1, 5); sticker('#ffd166', { pad: 3 });
    txt('100x', -22, -14, { size: 10, color: '#ff5d73', stroke: '#fff', lw: 3 });
    grip();
  } else {
    rrPath(-10, -10, 26, 22, 6); sticker('#e8b45a', { pad: 4 });
    rrPath(-6, -6, 18, 14, 4); sticker('#a9713f', { pad: 2.5 });
    txt('$$$', 3, 1, { size: 9, color: '#ffe27a', stroke: false });
    circ(22, -4, 5); sticker('#ffd166', { pad: 2.5 });
    circ(28, 3, 4); sticker('#ffd166', { pad: 2.5 });
    grip();
  }
}
function drawPlayerGun(t) {
  ctx.save();
  gunArt(gunKind);
  ctx.restore();
}
function drawMuzzleFlash(t) {
  ctx.save();
  ctx.translate(36, 1.5);
  glow(0, 0, 30, '#fff2a8', 0.95);
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    ctx.lineTo(Math.cos(a) * (i % 2 ? 5 : 15), Math.sin(a) * (i % 2 ? 5 : 15));
  }
  ctx.closePath();
  fillc('#fff6c8');
  ctx.restore();
}

/* ============================================================
   BACKGROUND
