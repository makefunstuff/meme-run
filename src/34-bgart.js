/* ============================================================
   2c. world art bake sources (parallax layers, ground, sky pieces)
   Local origin: ground line = y 0, layer items sit above it.
   ============================================================ */
/* every land layer is drawn twice: once shifted up in a pale tone, then the
   body on top, which leaves a rim of light along the ridge. Cheap aerial
   perspective, and it stops the far layers reading as flat cut-outs. */
function ridgePath(spread, h0, h1, r1, r2) {
  ctx.beginPath();
  ctx.moveTo(-spread, 20);
  ctx.quadraticCurveTo(-spread * 0.42, -h0, spread * 0.2, -h1);
  ctx.quadraticCurveTo(spread * 0.62, 10, spread * 1.36, 20);
  ctx.closePath();
}
function bakeMound(v) {
  const r1 = hash(v * 3 + 1), r2 = hash(v * 7 + 5);
  ctx.globalAlpha = 1;
  ridgePath(220, 130 + r1 * 90, 40 + r2 * 60, r1, r2);
  ctx.save(); ctx.translate(0, -7);
  ctx.fillStyle = '#fbd8ea'; ctx.fill(); ctx.restore();
  const q = ctx.createLinearGradient(0, -200, 0, 20);
  q.addColorStop(0, '#e9b6d6'); q.addColorStop(0.6, '#d79cc4'); q.addColorStop(1, '#bd82b4');
  ridgePath(220, 130 + r1 * 90, 40 + r2 * 60, r1, r2);
  ctx.fillStyle = q; ctx.fill();
}
function bakeMonument(kind) {
  ctx.fillStyle = '#c98cb8'; ctx.strokeStyle = '#c98cb8';
  if (kind === 'toilet') {
    rrPath(-26, -90, 20, 40, 6); ctx.fill();
    ell(0, -46, 34, 16); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-30, -40); ctx.lineTo(30, -40); ctx.lineTo(22, 0); ctx.lineTo(-22, 0); ctx.closePath(); ctx.fill();
  } else if (kind === 'crew') {
    ctx.beginPath();
    ctx.moveTo(-22, 0); ctx.lineTo(-22, -60); ctx.arc(0, -60, 22, Math.PI, 0); ctx.lineTo(22, 0); ctx.closePath();
    ctx.fill();
    rrPath(-4, -74, 24, 16, 7); ctx.fillStyle = '#f0c9dd'; ctx.fill();
  } else if (kind === 'crown') {
    ctx.beginPath();
    ctx.moveTo(-34, 0); ctx.lineTo(-34, -46); ctx.lineTo(-14, -22); ctx.lineTo(0, -58); ctx.lineTo(14, -22); ctx.lineTo(34, -46); ctx.lineTo(34, 0); ctx.closePath();
    ctx.fill();
  } else if (kind === 'arch') {
    ctx.beginPath();
    ctx.moveTo(-30, 0); ctx.lineTo(-30, -70); ctx.quadraticCurveTo(0, -110, 30, -70); ctx.lineTo(30, 0);
    ctx.lineTo(12, 0); ctx.quadraticCurveTo(0, -70, -12, 0); ctx.closePath();
    ctx.fill();
  } else {
    ell(0, -50, 40, 26); ctx.fill();
    circ(0, -50, 13); ctx.fillStyle = '#a06a95'; ctx.fill();
  }
}
function bakeHill(v) {
  const r1 = hash(v * 5 + 11);
  const h0 = 120 + r1 * 110, h1 = 30 + r1 * 40;
  ridgePath(190, h0, h1, r1, r1);
  ctx.save(); ctx.translate(0, -6);
  ctx.fillStyle = '#d6f5e2'; ctx.fill(); ctx.restore();
  const q = ctx.createLinearGradient(0, -h0, 0, 20);
  q.addColorStop(0, '#93ddba'); q.addColorStop(0.45, '#74cba2'); q.addColorStop(1, '#4e9f86');
  ridgePath(190, h0, h1, r1, r1);
  ctx.fillStyle = q; ctx.fill();
  /* a few bush silhouettes on the ridge so the mid layer has texture */
  ctx.save(); ridgePath(190, h0, h1, r1, r1); ctx.clip();
  ctx.fillStyle = rgba('#3f8a70', 0.5);
  for (let i = 0; i < 7; i++) {
    const x = -170 + hash(i * 7 + v * 13) * 380, y = -20 - hash(i * 3 + v) * (h0 * 0.7);
    ell(x, y, 12 + hash(i) * 16, 5 + hash(i * 5) * 6); ctx.fill();
  }
  ctx.restore();
}
function bakeBill(word) {
  rrPath(-34, -30, 68, 40, 8); sticker('#fff3e2', { pad: 4 });
  ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(0, 44); line(4, '#c9a882');
  txt(word, 0, -10, { size: 12, color: '#e8618c', stroke: false });
}
function bakeCloud() {
  const lumps = () => {
    ctx.beginPath();
    ctx.ellipse(-30, 8, 28, 19, 0, 0, TAU);
    ctx.ellipse(2, -6, 34, 25, 0, 0, TAU);
    ctx.ellipse(34, 6, 28, 18, 0, 0, TAU);
    ctx.ellipse(6, 12, 32, 16, 0, 0, TAU);
    ctx.closePath();
  };
  lumps(); fillc('rgba(150,120,160,0.30)');      // the drop, so it sits in the air
  ctx.save(); ctx.translate(0, -2.5);
  lumps(); ctx.fillStyle = '#fffdf8'; ctx.fill();  // the sunlit top
  ctx.restore();
  ctx.save(); lumps(); ctx.clip();
  ell(0, 20, 34, 9); ctx.fillStyle = 'rgba(178,150,190,0.45)'; ctx.fill();
  ctx.restore();
  circ(-8, 0, 3.4); fillc('#7a5a6c');
  circ(10, 0, 3.4); fillc('#7a5a6c');
  ctx.beginPath(); ctx.arc(1, 7, 8, 0.2, Math.PI - 0.2); line(2.4, '#7a5a6c');
  ell(-16, 6, 5, 3); fillc('rgba(255,140,170,0.5)');
  ell(18, 6, 5, 3); fillc('rgba(255,140,170,0.5)');
}
function bakeEye(shut) {
  const r = 26;
  const k = shut ? 0.14 : 1;
  ctx.save(); ctx.scale(1, k);
  circ(0, 0, r); sticker('#fffdf8', { pad: 4 });
  ctx.save();
  circ(0, 0, r * 0.94); ctx.clip();
  ctx.strokeStyle = rgba('#e88aa4', 0.5); ctx.lineWidth = 1.2; ctx.lineCap = 'round';
  for (let v = 0; v < 5; v++) {
    const a = hash(v * 13 + 3) * TAU;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.quadraticCurveTo(Math.cos(a + 0.3) * r * 0.6, Math.sin(a + 0.3) * r * 0.6, Math.cos(a) * r * 0.32, Math.sin(a) * r * 0.32);
    ctx.stroke();
  }
  ctx.restore();
  circ(0, 0, r * 0.52); fillc('#4b6cb7');
  circ(0, 0, r * 0.5); line(1.6, rgba('#241428', 0.5));
  circ(0, 0, r * 0.26); fillc('#241428');
  circ(-r * 0.17, -r * 0.19, r * 0.15); fillc('#fff');
  ctx.restore();
  /* the lid: a lid, not a sea urchin */
  ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-r * 1.02, -r * 0.16 * k); ctx.quadraticCurveTo(0, -r * 1.24 * k, r * 1.02, -r * 0.16 * k);
  ctx.stroke();
}
function bakeWordSprite(w) {
  txt(w, 0, 0, { size: 26, color: '#fff', stroke: '#c9739a', lw: 6 });
}
function bakeHeartSprite(col) {
  const s = 12;
  poly([[0, s * 0.85], [-s * 1.4, s * 0.15], [-s * 1.2, -s * 1.1], [0, -s * 0.55], [s * 1.2, -s * 1.1], [s * 1.4, s * 0.15]]);
  ctx.fillStyle = col; ctx.fill();
}
function bakeSun() {
  const sg2 = grad('sun', c => {
    const q = c.createRadialGradient(-10, -12, 4, 0, 0, 40);
    q.addColorStop(0, '#fffbe6'); q.addColorStop(0.6, '#ffe27a'); q.addColorStop(1, '#ffbe3d');
    return q;
  });
  circ(0, 0, 38); sticker(sg2, { pad: 4, halo: '#fff6d6' });
  rrPath(-21, -8, 17, 10, 4); sticker('#3a2340', { pad: 2.5, ink: '#20131f' });
  rrPath(4, -8, 17, 10, 4); sticker('#3a2340', { pad: 2.5, ink: '#20131f' });
  ctx.beginPath(); ctx.moveTo(-4, -4); ctx.lineTo(4, -4); line(2.4, '#3a2340');
  ctx.beginPath(); ctx.arc(0, 6, 13, 0.2, Math.PI - 0.2); line(3, '#c97b2f');
}
function bakeRays() {
  ctx.strokeStyle = rgba('#ffd166', 0.85); ctx.lineWidth = 6; ctx.lineCap = 'round';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 44, Math.sin(a) * 44);
    ctx.lineTo(Math.cos(a) * (56 + (i % 2) * 12), Math.sin(a) * (56 + (i % 2) * 12));
    ctx.stroke();
  }
}
function bakeShaft() {
  const q = ctx.createLinearGradient(0, 0, 0, 760);
  q.addColorStop(0, 'rgba(255,255,220,0.85)'); q.addColorStop(1, 'rgba(255,255,220,0)');
  ctx.fillStyle = q;
  poly([[-9, 0], [9, 0], [70, 760], [-70, 760]]);
  ctx.fill();
}
function bakeBand(col) {
  /* a high streak of atmosphere: faded at both ends so it never reads as a bar */
  const q = ctx.createLinearGradient(0, 0, 400, 0);
  q.addColorStop(0, rgba(col, 0)); q.addColorStop(0.28, rgba(col, 0.85));
  q.addColorStop(0.72, rgba(col, 0.85)); q.addColorStop(1, rgba(col, 0));
  ctx.beginPath();
  ctx.moveTo(0, 26);
  for (let x = 0; x <= 400; x += 16) ctx.lineTo(x, 22 + Math.sin(x * 0.016) * 16);
  for (let x = 400; x >= 0; x -= 16) ctx.lineTo(x, 30 + Math.sin(x * 0.016) * 16);
  ctx.closePath();
  ctx.fillStyle = q; ctx.fill();
}
/* The stage floor: a sunlit grass edge, a saturated grass body, then laid soil.
   Tiles every 88 world px, so everything in it is periodic at 88. */
function bakeRoadTile() {
  const g = ctx.createLinearGradient(0, 0, 0, 22);
  g.addColorStop(0, '#c6ee8e'); g.addColorStop(0.30, '#8ed96e'); g.addColorStop(1, '#3f9a55');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 88, 22);
  ctx.fillStyle = '#f6ffe2'; ctx.fillRect(0, 0, 88, 2.6);           // the sunlit lip
  ctx.fillStyle = rgba('#2c6f3f', 0.30); ctx.fillRect(0, 20.5, 88, 2.5);
  for (let i = 0; i < 11; i++) {                                     // blade notches
    const x = i * 8 + hash(i * 5) * 5;
    poly([[x, 0], [x + 2.4, 0], [x + 1.2, -3 - hash(i) * 3]]);
    fillc('#d8f7a8');
  }
  const s = ctx.createLinearGradient(0, 20, 0, 46);                  // the soil
  s.addColorStop(0, '#7a5136'); s.addColorStop(0.55, '#5b3a2e'); s.addColorStop(1, '#402a28');
  ctx.fillStyle = s; ctx.fillRect(0, 22, 88, 24);
  ctx.fillStyle = rgba('#2a1a20', 0.55);                             // the seam under the turf
  ctx.fillRect(0, 22, 88, 2.2);
  for (let r = 0; r < 2; r++) {                                      // brick courses
    const y = 26 + r * 9;
    ctx.fillStyle = rgba('#a8763f', 0.22 - r * 0.06);
    for (let i = 0; i < 3; i++) ctx.fillRect(i * 29 + (r ? 14 : 0), y, 27, 7);
    ctx.fillStyle = rgba('#241618', 0.35);
    for (let i = 0; i < 3; i++) ctx.fillRect(i * 29 + (r ? 14 : 0) - 1.5, y, 1.5, 7);
  }
}
/* The earth under the stage: warm soil, laid strata (periodic at 300 so the
   tiles join), pebbles and buried bling. */
function bakeStrata() {
  /* The earth under the stage. It fills the bottom fifth of every frame, so it
     gets real strata: a warm lit crust, cold deep layers, buried junk and a
     darkening toward the bottom of the screen. Periodic at 300 so tiles join. */
  const q = ctx.createLinearGradient(0, 0, 0, 460);
  q.addColorStop(0, '#8a6041');
  q.addColorStop(0.10, '#6f4833');
  q.addColorStop(0.42, '#553a3a');
  q.addColorStop(0.74, '#3d2a38');
  q.addColorStop(1, '#241827');
  ctx.fillStyle = q; ctx.fillRect(0, 0, 300, 460);
  /* the lit crust just under the turf */
  const c2 = ctx.createLinearGradient(0, 0, 0, 34);
  c2.addColorStop(0, 'rgba(196,142,84,0.85)');
  c2.addColorStop(1, 'rgba(196,142,84,0)');
  ctx.fillStyle = c2; ctx.fillRect(0, 0, 300, 34);

  /* strata: each band is a filled ribbon with a lit top edge, which reads as
     geology instead of a stripe */
  const bands = [
    [54, '#c08a55', 26, 0.30], [118, '#a2715d', 34, 0.26], [186, '#8a5f74', 42, 0.24],
    [268, '#6e4d6e', 52, 0.22], [356, '#553c5e', 60, 0.20]
  ];
  bands.forEach(([yy, col, hh, a], i) => {
    ctx.globalAlpha = a;
    ctx.fillStyle = col;
    ctx.beginPath();
    for (let x = -8; x <= 308; x += 8) ctx.lineTo(x, yy + Math.sin(x * (TAU * (i + 1) / 300) + i * 1.7) * 8);
    for (let x = 308; x >= -8; x -= 8) ctx.lineTo(x, yy + hh + Math.sin(x * (TAU * (i + 1) / 300) + i * 1.7) * 8);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = a * 0.9;
    ctx.strokeStyle = 'rgba(226,178,132,0.55)'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = -8; x <= 308; x += 8) {
      const y = yy + Math.sin(x * (TAU * (i + 1) / 300) + i * 1.7) * 8;
      x === -8 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  });
  ctx.globalAlpha = 1;

  /* buried pipes and roots */
  ctx.globalAlpha = 0.45;
  for (let i = 0; i < 6; i++) {
    const x = 20 + hash(i * 17 + 5) * 250, y = 70 + hash(i * 7 + 3) * 320;
    ctx.strokeStyle = 'rgba(34,22,34,0.7)'; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 44 + hash(i) * 46, y + 9); ctx.stroke();
    ctx.strokeStyle = 'rgba(150,116,132,0.45)'; ctx.lineWidth = 3.4;
    ctx.beginPath(); ctx.moveTo(x, y - 2); ctx.lineTo(x + 38 + hash(i) * 40, y + 7); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  /* stones: lit on top, dark underneath */
  for (let i = 0; i < 46; i++) {
    const r1 = hash(i * 7 + 3), r2 = hash(i * 11 + 9), r3 = hash(i * 3 + 5);
    if (r1 > 0.52) continue;
    const px = 10 + r2 * 280, py = 40 + r3 * 400, rx = 2.6 + r1 * 7;
    ell(px, py, rx, rx * 0.68);
    ctx.fillStyle = r3 > 0.6 ? 'rgba(198,156,116,0.34)' : 'rgba(30,20,32,0.42)';
    ctx.fill();
    ell(px, py - rx * 0.34, rx * 0.8, rx * 0.34);
    ctx.fillStyle = 'rgba(240,200,160,0.16)'; ctx.fill();
  }
  /* a few bones of dead tokens, because it is that kind of world */
  for (let i = 0; i < 4; i++) {
    const px = 30 + hash(i * 23 + 7) * 240, py = 120 + hash(i * 31 + 11) * 240;
    rrPath(px, py, 16, 7, 3.4);
    ctx.fillStyle = 'rgba(226,206,196,0.20)'; ctx.fill();
    rrPath(px + 14, py + 1, 7, 7, 3.4); ctx.fill();
  }
}

function bakeGrass(v) {
  for (let b = -1; b <= 1; b++) {
    poly([[b * 3 - 2, 0], [b * 3 + 2, 0], [b * 3 + (b * 2), -7 - hash(v + b) * 7]]);
    fillc('#63c98a');
  }
}
function bakeFlower(col) {
  circ(0, 0, 4.4); fillc(col);
  circ(0, 0, 1.8); fillc('#fff7d6');
}
function bakeBling(i) {
  const col = ['#ffd166', '#8fe3d0', '#ff9dbd'][i % 3];
  poly([[0, -8], [4.4, 0], [0, 8], [-4.4, 0]]);
  ctx.fillStyle = col; ctx.fill();
  ctx.strokeStyle = rgba('#fffdf0', 0.75); ctx.lineWidth = 1.2; ctx.stroke();
}
function bakeCeilingStrip() {
  const q = ctx.createLinearGradient(0, -120, 0, 0);
  q.addColorStop(0, '#1d1324'); q.addColorStop(1, '#573630');
  ctx.fillStyle = q; ctx.fillRect(0, -120, 88, 120);
  ctx.fillStyle = '#5b3a2e'; ctx.fillRect(0, -26, 88, 24);
  ctx.fillStyle = '#3f9a55'; ctx.fillRect(0, -6, 88, 6);
  ctx.fillStyle = rgba('#f6ffe2', 0.85); ctx.fillRect(0, -3, 88, 2.6);
  for (let i = 0; i < 3; i++) { ctx.fillStyle = rgba('#a8763f', 0.2); ctx.fillRect(i * 29, -22, 27, 8); }
}
function bakeBossPhone(kind) {
  // kind 0: THE ALGORITHM (phone + eye + crown)   kind 1: THE WHALE (chart terminal)
  if (kind === 0) {
    rrPath(-62, -92, 124, 184, 20);
    const pg = grad('phone', c => {
      const q = c.createLinearGradient(-62, -92, 62, 92);
      q.addColorStop(0, '#5a3f6e'); q.addColorStop(0.5, '#31203f'); q.addColorStop(1, '#1d1128');
      return q;
    });
    sticker(pg, { pad: 7, halo: '#fff' });
    rrPath(-51, -76, 102, 140, 13);
    const sg = grad('bscreen', c => {
      const q = c.createLinearGradient(0, -76, 0, 64);
      q.addColorStop(0, '#2a1240'); q.addColorStop(1, '#0e0618');
      return q;
    });
    sticker(sg, { pad: 0, lw: 0 });
    ctx.save(); rrPath(-51, -76, 102, 140, 13); ctx.clip();
    ctx.globalAlpha = 0.12; ctx.fillStyle = '#fff';
    for (let y = -76; y < 64; y += 5) ctx.fillRect(-51, y, 102, 2);
    ctx.restore();
    poly([[-20, -96], [-20, -118], [-8, -104], [0, -124], [8, -104], [20, -118], [20, -96]]);
    const cg2 = grad('bcrown', c => {
      const q = c.createLinearGradient(0, -124, 0, -96);
      q.addColorStop(0, '#fff0b8'); q.addColorStop(1, '#e0a33c');
      return q;
    });
    sticker(cg2);
    circ(48, 78, 15); sticker('#6fb7ff', { pad: 3 });
    ctx.beginPath(); ctx.moveTo(41, 78); ctx.lineTo(46, 84); ctx.lineTo(56, 71); line(4.5, '#fff');
  } else {
    rrPath(-74, -70, 148, 130, 16);
    const pg = grad('phone1', c => {
      const q = c.createLinearGradient(-74, -70, 74, 60);
      q.addColorStop(0, '#4b7bc0'); q.addColorStop(0.6, '#22406b'); q.addColorStop(1, '#122038');
      return q;
    });
    sticker(pg, { pad: 7, halo: '#fff' });
    rrPath(-62, -58, 124, 96, 10); sticker('#0a1626', { pad: 0, lw: 0 });
    ctx.save(); rrPath(-62, -58, 124, 96, 10); ctx.clip();
    // the chart of your losses
    ctx.strokeStyle = '#ff5d73'; ctx.lineWidth = 4; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-58, -40);
    for (let i = 0; i < 8; i++) ctx.lineTo(-58 + i * 16, -40 + i * i * 1.6 + hash(i) * 8);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? '#ff5d73' : '#7ff0a8';
      rrPath(-56 + i * 16, -46 + i * i * 1.4, 7, 16, 2); ctx.fill();
    }
    ctx.restore();
    // whale fin on top
    poly([[-30, -74], [-6, -104], [14, -74]]); sticker('#5b8fd6', { pad: 4 });
    circ(58, 52, 14); sticker('#ff5d73', { pad: 3 });
    txt('-99%', 58, 52, { size: 11, color: '#fff', stroke: false, font: 'Space Mono' });
  }
}
function bakeBossEye(kind) {
  if (kind === 0) {
    ell(0, 0, 38, 27); fillc('#fff8fb');
    circ(0, 0, 16); fillc('#c9366f');
    circ(0, 0, 16); line(2.4, rgba('#241428', 0.6));
    circ(0, 0, 8); fillc('#160a1c');
    circ(-5, -6, 4.6); fillc('#fff');
  } else {
    ell(0, 0, 30, 22); fillc('#eaf6ff');
    circ(0, 0, 12); fillc('#1b3f80');
    circ(0, 0, 5); fillc('#0a1626');
    circ(-4, -4, 3.4); fillc('#fff');
  }
}
function bakeBadge(i) {
  if (i % 3 === 0) {
    circ(0, 0, 11); sticker('#ff5d73', { pad: 2.5 });
    txt('1', 0, 1, { size: 12, color: '#fff', stroke: false });
  } else if (i % 3 === 1) {
    rrPath(-12, -8, 24, 16, 6); sticker('#fff', { pad: 2.5 });
    txt('0', 0, 1, { size: 12, color: '#8a5f76', stroke: false });
  } else {
    poly([[-8, -7], [8, -7], [0, 7]]); sticker('#6fb7ff', { pad: 2.5 });
  }
}
