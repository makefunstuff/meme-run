/* ============================================================
   2c. world art bake sources (parallax layers, ground, sky pieces)
   Local origin: ground line = y 0, layer items sit above it.
   ============================================================ */
function bakeMound(v) {
  const r1 = hash(v * 3 + 1), r2 = hash(v * 7 + 5);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#e8b4d0';
  ctx.beginPath();
  ctx.moveTo(-220, 20);
  ctx.quadraticCurveTo(-90, -130 - r1 * 90, 60, -40 - r2 * 60);
  ctx.quadraticCurveTo(170, 10, 300, 20);
  ctx.closePath();
  ctx.fill();
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
  const q = ctx.createLinearGradient(0, -190, 0, 20);
  q.addColorStop(0, '#b6ead0'); q.addColorStop(1, '#7fd3a8');
  ctx.fillStyle = q;
  ctx.beginPath();
  ctx.moveTo(-190, 20);
  ctx.quadraticCurveTo(-40, -120 - r1 * 110, 90, -30 - r1 * 40);
  ctx.quadraticCurveTo(160, 12, 250, 20);
  ctx.closePath();
  ctx.fill();
}
function bakeBill(word) {
  rrPath(-34, -30, 68, 40, 8); sticker('#fff3e2', { pad: 4 });
  ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(0, 44); line(4, '#c9a882');
  txt(word, 0, -10, { size: 12, color: '#e8618c', stroke: false });
}
function bakeCloud() {
  ctx.beginPath();
  ctx.ellipse(-30, 8, 28, 19, 0, 0, TAU);
  ctx.ellipse(2, -6, 34, 25, 0, 0, TAU);
  ctx.ellipse(34, 6, 28, 18, 0, 0, TAU);
  ctx.ellipse(6, 12, 32, 16, 0, 0, TAU);
  ctx.fillStyle = '#fff'; ctx.fill();
  ell(0, 18, 30, 6); ctx.fillStyle = 'rgba(190,160,180,0.35)'; ctx.fill();
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
  ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineCap = 'round';
  for (let v = -1; v <= 1; v++) {
    const a = -Math.PI / 2 + v * 0.5;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.96, Math.sin(a) * r * 0.96 * k);
    ctx.lineTo(Math.cos(a) * (r * 1.26), Math.sin(a) * (r * 1.26) * k);
    ctx.stroke();
  }
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
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (let x = 0; x <= 400; x += 20) ctx.lineTo(x, Math.sin(x * 0.016) * 20);
  ctx.lineTo(400, 46); ctx.lineTo(0, 46);
  ctx.closePath(); ctx.fill();
}
function bakeRoadTile() {
  for (let i = 0; i < 2; i++) {
    const X = i * 44;
    const q = ctx.createLinearGradient(0, 0, 0, 26);
    q.addColorStop(0, (i & 1) ? '#b7f0d1' : '#ffe0cd');
    q.addColorStop(1, (i & 1) ? '#8adcb0' : '#f7bfa4');
    ctx.fillStyle = q;
    ctx.fillRect(X, 0, 44, 26);
    ctx.fillStyle = rgba('#3a2340', 0.13);
    ctx.fillRect(X, 0, 2.5, 26);
    ctx.fillStyle = rgba('#fff', 0.35);
    ctx.fillRect(X + 5, 6, 32, 2);
    if ((i % 2) === 0) { ctx.fillStyle = rgba('#fff', 0.45); ctx.fillRect(X + 6, 12, 22, 2.5); }
  }
  ctx.fillStyle = rgba('#fff', 0.85); ctx.fillRect(0, 0, 88, 3);
  ctx.fillStyle = '#5d9d7c'; ctx.fillRect(0, 26, 88, 8);
  ctx.fillStyle = rgba('#20131f', 0.45); ctx.fillRect(0, 34, 88, 7);
}
function bakeStrata() {
  const q = ctx.createLinearGradient(0, 0, 0, 460);
  q.addColorStop(0, '#7e5f9c'); q.addColorStop(0.18, '#5d4378');
  q.addColorStop(0.6, '#3b2a4e'); q.addColorStop(1, '#1e1428');
  ctx.fillStyle = q; ctx.fillRect(0, 0, 300, 460);
  ctx.globalAlpha = 0.22;
  [46, 102, 170].forEach((yy, i) => {
    ctx.strokeStyle = ['#a98cc4', '#8a6ba6', '#6b4f88'][i];
    ctx.lineWidth = 2 + i;
    ctx.beginPath();
    for (let x = 0; x <= 300; x += 20) {
      const y = yy + Math.sin(x * 0.021 + i) * 6;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
  for (let i = 0; i < 22; i++) {
    const r1 = hash(i * 7 + 3), r2 = hash(i * 11 + 9), r3 = hash(i * 3 + 5);
    if (r1 > 0.62) {
      ctx.fillStyle = rgba('#a98cc4', 0.32 - r3 * 0.18);
      ell(r2 * 290 + 5, 52 + r3 * 210, 4 + r1 * 8, (4 + r1 * 8) * 0.72);
      ctx.fill();
    }
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
  const col = ['#ff9dbd', '#8fe3d0', '#ffd166'][i % 3];
  poly([[0, -9], [5, 0], [0, 9], [-5, 0]]);
  ctx.fillStyle = col; ctx.fill();
  ctx.strokeStyle = rgba('#fff', 0.6); ctx.lineWidth = 1; ctx.stroke();
}
function bakeCeilingStrip() {
  const q = ctx.createLinearGradient(0, -120, 0, 0);
  q.addColorStop(0, '#3b2a4e'); q.addColorStop(1, '#7e5f9c');
  ctx.fillStyle = q; ctx.fillRect(0, -120, 88, 120);
  for (let i = 0; i < 2; i++) {
    ctx.fillStyle = (i & 1) ? '#b7f0d1' : '#ffe0cd';
    ctx.fillRect(i * 44, -24, 44, 24);
    ctx.fillStyle = rgba('#3a2340', 0.13);
    ctx.fillRect(i * 44, -24, 2.5, 24);
  }
  ctx.fillStyle = rgba('#fff', 0.85); ctx.fillRect(0, -3, 88, 3);
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
