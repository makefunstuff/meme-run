/* ============================================================
   4. emitters — every entity is one textured quad
   Screen space: x right, y down (converted to the ortho camera on push).
   World space: x = world px, y = down px, ground line at y = 0.
   ============================================================ */
const WHITE = [1, 1, 1];
const _cc = new Map();
function tint(hex) {
  if (!hex) return WHITE;
  let c = _cc.get(hex);
  if (!c) {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(x => x + x).join('');
    const n = parseInt(h, 16);
    c = [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
    _cc.set(hex, c);
  }
  return c;
}
let shakeX = 0, shakeY = 0;
let labelBudget = 5;

/* page: 0 world, 1 entity, 2 text */
const PB = [[0, 0], [1, 1], [2, 2]];
function pushW(page, add, name, x, y, sw, sh, rot, col, a) {
  let sp = SPR[name];
  if (!sp || a <= 0.004) return;
  let ox = sp.ox, oy = sp.oy;
  if (rot) {
    const c = Math.cos(rot), s = Math.sin(rot);
    const nx = ox * c - oy * s, ny = ox * s + oy * c;
    ox = nx; oy = ny;
  }
  BATCH[sp.page][add ? 1 : 0].push(sp,
    (x + ox - camX) * SC + shakeX,
    -(GROUND + (y + oy) * SC + shakeY),
    sw * SC, sh * SC, rot, col, a);
}
function pushS(page, add, name, x, y, sw, sh, rot, col, a) {
  let sp = SPR[name];
  if (!sp || a <= 0.004) return;

  let ox = sp.ox, oy = sp.oy;
  if (rot) {
    const c = Math.cos(rot), s = Math.sin(rot);
    const nx = ox * c - oy * s, ny = ox * s + oy * c;
    ox = nx; oy = ny;
  }
  BATCH[sp.page][add ? 1 : 0].push(sp, x + ox * sw / sp.w + shakeX,
    -(y + oy * sh / sp.h + shakeY), sw, sh, rot, col, a);
}
/* world helpers */
const wq = (name, x, y, s, rot, col, a, add) => { const sp = SPR[name]; if (sp) pushW(1, !!add, name, x, y, sp.w * s, sp.h * s, rot, col || WHITE, a === undefined ? 1 : a); };
const wqr = (name, x, y, sw, sh, rot, col, a, add) => pushW(1, !!add, name, x, y, sw, sh, rot, col || WHITE, a === undefined ? 1 : a);
const gw = (name, x, y, s, rot, col, a, add) => { const sp = SPR[name]; if (sp) pushW(0, !!add, name, x, y, sp.w * s, sp.h * s, rot, col || WHITE, a === undefined ? 1 : a); };
const gwr = (name, x, y, sw, sh, rot, col, a, add) => pushW(0, !!add, name, x, y, sw, sh, rot, col || WHITE, a === undefined ? 1 : a);
const tq = (name, x, y, s, rot, col, a) => { const sp = SPR[name]; if (sp) pushW(2, false, name, x, y, sp.w * s, sp.h * s, rot, col || WHITE, a === undefined ? 1 : a); };
/* screen helpers */
const sq = (name, x, y, s, rot, col, a, add) => { const sp = SPR[name]; if (sp) pushS(0, !!add, name, x, y, sp.w * s, sp.h * s, rot, col || WHITE, a === undefined ? 1 : a); };
const s8 = (name, x, y, sw, sh, rot, col, a, add) => pushS(0, !!add, name, x, y, sw, sh, rot, col || WHITE, a === undefined ? 1 : a);
function fillR(x, y, w, h, col, a, add) {  // solid screen rect
  const sp = SPR.px; if (!sp) return;
  BATCH[sp.page][add ? 1 : 0].push(sp, x + w / 2 + shakeX, -(y + h / 2 + shakeY), w, h, 0, col, a);
}
function fillW(x, y, w, h, col, a, add) {  // solid world rect (world units)
  const sp = SPR.px; if (!sp) return;
  BATCH[sp.page][add ? 1 : 0].push(sp, (x + w / 2 - camX) * SC + shakeX, -(GROUND + (y + h / 2) * SC + shakeY), w * SC, h * SC, 0, col, a);
}

/* ---------------- parallax helper ----------------
   Tiles a layer across the screen. The offset has to wrap modulo ONE tile, not
   modulo the whole strip: wrapping the strip left the offset anywhere in
   [0, n*spacing), and since the loop only walked n+2 tiles from there, most of
   the screen got no hills at all. */
function layerCount(spacing) { return Math.ceil((W + 700) / spacing); }
function repeat(n, spacing, factor, drawOne, t) {
  const cam = camX * factor;
  const iBase = Math.floor(cam / spacing);
  const off = cam - iBase * spacing;
  const count = Math.ceil((W + 720) / spacing) + 2;
  for (let i = -1; i <= count; i++) {
    const x = i * spacing - off;
    if (x < -540 || x > W + 540) continue;
    /* i + iBase is the absolute tile index, so a tile keeps its identity as the
       camera moves instead of reshuffling every frame */
    drawOne(x, i + iBase, t);
  }
}

/* ---------------- sky + background ---------------- */
/* the world is baked once in one palette, so each mode re-lights it by tint:
   one colour family from the sky down to the soil */
const LTINT = { classic: WHITE, degen: [0.72, 1.06, 0.74], chaos: [1.10, 0.92, 0.84], ohio: [1.04, 0.80, 1.16], zen: [1.02, 1.00, 1.04] };
const STINT = { classic: WHITE, degen: [0.80, 1.10, 0.66], chaos: [1.12, 0.98, 0.86], ohio: [1.12, 0.84, 1.06], zen: WHITE };
const lt = () => LTINT[mode] || WHITE;
const st = () => STINT[mode] || WHITE;
function drawSky(t) {
  const sky = SPR['sky' + ((MODES[mode] || MODES.classic).sky)];
  if (sky) s8('sky' + ((MODES[mode] || MODES.classic).sky), 0, 0, W, H, 0, WHITE, 1);
  const sx0 = W * 0.86, sy0 = H * 0.15;
  const lc = st();
  const ss = clamp(H / 700, 0.5, 1.3);
  for (let i = 0; i < (QUAL.sh ? 3 : 0); i++) {
    const a = -0.48 + i * 0.40 + Math.sin(t * 0.25 + i) * 0.05;
    pushS(0, true, 'shaft', sx0, sy0, 148 * ss, 764 * ss, a, lc, 0.035);
  }
  if (QUAL.band) {
    for (let i = 0; i < 4; i++) {
      const yy = H * (0.20 + i * 0.11) + Math.sin(t * 0.35 + i) * 12 - 20;
      const w = 412 * (W / 1200 + 0.6);
      const ox = -((camX * (0.014 + i * 0.006)) % w) - 6;
      s8('band' + (i % 3), ox, yy, w, 52, 0, WHITE, 0.055);
      s8('band' + (i % 3), ox + w, yy, w, 52, 0, WHITE, 0.055);
    }
  }
  const rs = clamp(H / 900, 0.55, 1.15);
  pushS(0, true, 'glow', sx0, sy0, 320 * rs, 320 * rs, 0, tint('#fff0a8'), 0.42);
  pushS(0, false, 'rays', sx0, sy0, 148 * rs, 148 * rs, t * 0.12, lc, 0.85);
  pushS(0, false, 'sun', sx0, sy0, 96 * rs, 96 * rs, 0, lc, 1);
  /* the horizon haze, in the colour of the sky's lowest stop, so the ground
     joins the sky instead of being pasted under it */
  const sk = SKIES[(MODES[mode] || MODES.classic).sky] || SKIES[0];
  s8('haze', 0, GROUND - 92, W, 94, 0, tint(sk[sk.length - 1][0]), 0.20);
}
function drawFarLayer(t) {
  const n = layerCount(300);
  repeat(n, 300, 0.055, (x, i) => {
    const v = Math.floor(hash(i * 3 + 1) * 4);
    const c = lt();
    pushW(0, false, 'md' + v, camX + x / SC, 20 / SC, 544, 272, 0, c, 0.62);
    const mon = Math.floor(hash(i * 11 + 2) * 13);
    if (mon < 7) {
      const kinds = ['toilet', 'crew', 'crown', 'arch', 'eye'];
      const kind = kinds[Math.floor(hash(i * 13 + 4) * 5)];
      const r1 = hash(i * 3 + 1), r2 = hash(i * 7 + 5);
      pushW(0, false, 'mon_' + kind, camX + (x + 40 + r1 * 90) / SC, (-30 - r2 * 40) / SC,
        SPR['mon_' + kind].w, SPR['mon_' + kind].h, 0, c, 0.42);
    }
  }, t);
}
function drawMidLayer(t) {
  const n = layerCount(240);
  repeat(n, 240, 0.16, (x, i) => {
    const c = lt();
    pushW(0, false, 'hl' + (i & 1), camX + x / SC, 20 / SC, 464, 272, 0, c, 0.94);
    if (hash(i * 19 + 3) > 0.30) {
      const r1 = hash(i * 5 + 11);
      const bx = x + 30 + r1 * 80, by = -90 - hash(i * 23) * 60;
      pushW(0, false, 'bill' + (Math.floor(hash(i * 31) * 6) % 6), camX + bx / SC, by / SC,
        92, 96, (hash(i * 29) - 0.5) * 0.16, c, 1);
    }
  }, t);
}
function drawCloudLayer(t) {
  /* far, small, pale: the layer that gives the sky depth */
  const nf = layerCount(300);
  repeat(nf, 300, 0.16, (x, i) => {
    const y = 30 + hash(i * 5 + 3) * (H * 0.30);
    const s = 0.42 + hash(i * 9) * 0.5;
    pushS(0, false, 'cloud', x, y + Math.sin(t * 0.22 + i) * 4, 104 * s, 72 * s, 0, lt(), 0.55);
  }, t);
  /* near: bigger, brighter, faster */
  const n = layerCount(230);
  repeat(n, 230, 0.3, (x, i) => {
    const y = 52 + hash(i * 3) * (H * 0.34);
    const s = 0.6 + hash(i * 7) * 0.85;
    pushS(0, false, 'cloud', x, y + Math.sin(t * 0.4 + i) * 7, 104 * s, 72 * s, 0, lt(), 0.95);
  }, t);
}
function drawEyeLayer(t) {
  const n = layerCount(300);
  repeat(n, 300, 0.42, (x, i) => {
    const y = 70 + hash(i * 13) * (H * 0.34);
    const r = 11 + hash(i * 17) * 12;
    const shut = Math.sin(t * 1.5 + i * 2) > 0.94;
    const s = r / 26;
    /* the watchers: present, but the same tonal family as the sky so they sit
       in the air instead of floating on top of it */
    const c = tint('#e8f0f8').map((v, j) => v * lt()[j]);
    pushS(0, false, shut ? 'eye1' : 'eye0', x, y + Math.sin(t * 0.9 + i) * 8, 80 * s, 80 * s, 0, c, 0.55);
  }, t);
}
function drawWordLayer(t) {
  const n = layerCount(260);
  repeat(n, 260, 0.52, (x, i) => {
    const y = 60 + hash(i * 7 + 21) * (H * 0.42);
    const w = Math.floor(hash(i * 5 + 41) * 16) % 16;
    const s = (15 + hash(i * 9) * 14) / 26;
    pushS(0, false, 'w' + w, x, y + Math.sin(t * 0.8 + i) * 10, SPR['w' + w].w * s, SPR['w' + w].h * s,
      (hash(i * 3 + 33) - 0.5) * 0.5, WHITE, 0.44);
  }, t);
}
function drawHeartLayer(t) {
  const n = layerCount(220);
  repeat(n, 220, 0.6, (x, i) => {
    const y = 90 + hash(i * 27) * (H * 0.5);
    const s = (4 + hash(i * 5) * 6) / 12;
    pushS(0, false, 'hc' + (Math.floor(hash(i * 41) * 5) % 5), x, y + Math.sin(t * 1.1 + i * 2) * 14,
      44 * s, 40 * s, Math.sin(t + i) * 0.3, lt(), 0.45);
  }, t);
}
function drawFgLayer(t) {
  if (!QUAL.fg) return;
  const n = layerCount(520);
  repeat(n, 520, 1.35, (x, i) => {
    const r = 40 + hash(i * 3) * 60;
    const cols = ['#ff5d73', '#ffd166', '#7fd3a8', '#c9a8e8'];
    pushS(0, true, 'glow', x, H + r * 0.3, r * 4, r * 4, 0, tint(cols[Math.floor(hash(i * 11) * 4) % 4]), 0.13);
  }, t);
}

/* ---------------- ground ---------------- */
/* the same soil, lit by the mode's sky */
const GTINT = { classic: WHITE, degen: [0.78, 1.06, 0.82], chaos: [1.06, 0.90, 0.94], ohio: [1.02, 0.80, 1.16], zen: [1.02, 1.01, 1.04] };
function drawGround(t) {
  const x0 = camX - 80, x1 = camX + W / SC + 80;
  const gt = GTINT[mode] || WHITE;
  /* 310 wide for a 300 step: the tiles overlap, which hides the sampled seam
     at the atlas cell edge */
  for (let X = Math.floor(x0 / 300) * 300; X < x1; X += 300) gwr('strata', X, 30, 310, 460, 0, gt, 1);
  for (let i = Math.floor(x0 / 88); i * 88 < x1; i++) gwr('road', i * 88, 0, 92, 56, 0, gt, 1);
  // grass + flowers
  const gs = 26;
  for (let i = Math.floor(x0 / gs); i * gs < x1; i++) {
    const h1 = hash(i * 3 + 7);
    if (h1 > 0.55) continue;
    const X = i * gs + hash(i) * 18;
    gw('gr' + ((i % 3) + 3) % 3, X, 1, 1, Math.sin(t * 2 + i) * 0.08, WHITE, 0.55);
    if (h1 < 0.1) gw('fl' + (Math.floor(hash(i * 13) * 5) % 5), X + 8, -12, 1, 0, WHITE, 1);
  }
  /* a foreground row of taller weeds on the turf line: the play field needs a
     bottom edge with something living on it, not a straight green cut */
  for (let i = Math.floor(x0 / 62); i * 62 < x1; i++) {
    const h1 = hash(i * 7 + 31);
    if (h1 > 0.42) continue;
    const X = i * 62 + hash(i * 3) * 28;
    const sc = 1.25 + hash(i * 11) * 1.15;
    gw('gr' + ((i % 3) + 3) % 3, X, -1, sc, Math.sin(t * 1.5 + i) * 0.10, [0.96, 1.0, 0.96], 0.62);
    if (h1 < 0.10) gw('fl' + (Math.floor(hash(i * 13) * 5) % 5), X + 10, -9, 0.9, 0, WHITE, 1);
  }
  /* pebbles and debris at the very edge of the stage */
  for (let i = Math.floor(x0 / 96); i * 96 < x1; i++) {
    const r1 = hash(i * 17 + 9);
    if (r1 > 0.5) continue;
    const X = i * 96 + hash(i * 5) * 40, Y = 2 + r1 * 7;
    gwr('shadow', X, Y, 10 + r1 * 16, 5 + r1 * 4, 0, [0.30, 0.22, 0.30], 0.30 + r1 * 0.2);
  }
  // buried bling
  for (let i = Math.floor(x0 / 150); i * 150 < x1; i++) {
    for (let k = 0; k < 5; k++) {
      const r1 = hash(i * 7 + k * 13), r2 = hash(i * 11 + k * 29), r3 = hash(i * 3 + k * 41);
      if (r1 < 0.07) {
        const px = i * 150 + r2 * 150, py = 120 + r3 * 250;
        gw('bg' + (Math.floor(r2 * 3) % 3), px, py, 1, 0, WHITE, 0.9);
        gw('glow', px, py, 1.1, 0, tint(['#ff9dbd', '#8fe3d0', '#ffd166'][Math.floor(r2 * 3) % 3]), 0.2, true);
      }
    }
  }
}
function drawCeiling(t) {
  if (!(ev && ev.id === 'flip')) return;
  const x0 = camX - 80, x1 = camX + W / SC + 80;
  for (let i = Math.floor(x0 / 88); i * 88 < x1; i++) gwr('ceil', i * 88, CEIL, 92, 130, 0, WHITE, 1);
}

/* ---------------- entities: 3D kits ---------------- */
const KS = 1.15;                       // global kit world scale
const KIT_SC = { rug: 1.25, engine: 1.3, atm: 1.15, cone: 1.1, nft: 1.08, monitor: 1.05 };

/* world -> screen, with SC and shake baked in (same mapping the quads use) */
function pushK(name, wx, wy, sx, sy, rot, tint, boost) {
  const k = KITS[name];
  if (!k) return;
  k.push((wx - camX) * SC + shakeX, -(GROUND + wy * SC + shakeY),
    (sx === undefined ? 1 : sx) * KS * SC, (sy === undefined ? sx : sy) * KS * SC, rot, tint, boost);
}

function drawEnemy(e, t) {
  const bob = Math.sin(t * 2.4 + e.ph) * 4;
  const shs = clamp(1 - (-e.y) / 400, 0.35, 1);
  pushW(0, false, 'shadow', camX + (e.x - e.r * 0.95 * shs) / SC, 2 / SC,
    e.r * 1.9 * shs, 11, 0, [0.23, 0.14, 0.25], 0.26);
  let sx = 1, sy = 1;
  if (e.spawn > 0) { const k = 1 + e.spawn * 0.6; sx = k; sy = 1 / k; }
  const rot = e.fly ? Math.sin(t * 2.1 + e.ph) * 0.16 : Math.sin(t * 1.7 + e.ph) * 0.07;
  const hot = e.hit > 0;
  pushK(e.m.art, e.x, e.y + bob, sx, sy, rot, hot ? '#ffd166' : null, hot ? 2.3 : 1);
  const hpMax = e.m.hp || 1;
  if (hpMax > 1) {
    const f = clamp(e.hp / hpMax, 0, 1);
    fillW(e.x - 20, e.y - e.r - 42, 40, 5, [0.15, 0.08, 0.18], 0.7);
    fillW(e.x - 20, e.y - e.r - 42, 40 * f, 5, tint(f > 0.5 ? '#7ff0a8' : '#ff5d73'), 0.95);
  }
  if (QUAL.lab && labelBudget > 0) {
    const lbl = labelSprite(e.m.label);
    if (lbl) {
      labelBudget--;
      /* a label is a caption, not a name tag: it fades out away from the
         player, so the feed is only annotated where it can be read */
      const d = Math.abs(e.x - (camX + W / SC * 0.42));
      const a = clamp(1.35 - d / (W / SC * 0.6), 0, 1);
      if (a > 0.06) { const l = SPR[lbl]; pushW(2, false, lbl, e.x, e.y + bob - e.r - 24, l.w, l.h, 0, WHITE, a * 0.94); }
    }
  }
}

function drawBlockObj(b, t) {
  pushW(0, false, 'shadow', camX + (b.x - b.w * 0.6) / SC, 3 / SC, b.w * 1.2, 10, 0, [0.23, 0.14, 0.25], 0.24);
  const ks = KIT_SC[b.kind] || 1;
  if (b.kind === 'saw') {
    pushK('b_saw', b.x + b.w / 2, -b.h * 0.44, ks, ks, t * 5.4, null, 1);
    pushK('b_mount', b.x + b.w * 0.34, -b.h * 0.10, 1, 1, 0, null, 1);
    return;
  }
  pushK('b_' + b.kind, b.x, -b.h * 0.44, ks, ks, 0, null, 1);
}

function drawPickup(p, t) {
  const bob = Math.sin(t * 2.6 + p.ph) * 5;
  if (p.kind === 'weapon') {
    wq('glow', p.x, p.y + bob, 2.6, 0, tint('#ffe27a'), 0.4, true);
    pushK('cr_' + p.wpn, p.x, p.y + bob, 1, 1, Math.sin(t * 1.6 + p.ph) * 0.1, null, 1);
    return;
  }
  const name = p.kind === 'aura' ? 'pk_coin' : p.kind === 'gem' ? 'pk_gem' : p.kind === 'heart' ? 'pk_heart'
    : p.kind === 'bag' ? 'pk_bag' : p.kind === 'diamond' ? 'pk_diamond' : p.kind === 'advisory' ? 'pk_advisory' : 'pk_lever';
  const gl = { aura: '#ffd166', gem: '#ff9dbd', heart: '#ff5d73', bag: '#ffd166', diamond: '#8fd6ff', advisory: '#ffe27a', lever: '#ff5d73' }[p.kind];
  wq('glow', p.x, p.y + bob, p.kind === 'aura' ? 1.2 : 2.4, 0, tint(gl), p.kind === 'aura' ? 0.35 : 0.5, true);
  const sx = p.kind === 'aura' ? Math.max(0.18, Math.abs(Math.cos(t * 3 + p.ph))) : 1;
  const k = p.kind === 'heart' ? 1 + Math.sin(t * 6 + p.ph) * 0.1 : 1;
  pushK(name, p.x, p.y + bob, sx * k, k,
    p.kind === 'gem' ? Math.sin(t * 1.4 + p.ph) * 0.15 : 0, null, 1);
}

function drawBullet(b) {
  const ang = Math.atan2(b.vy, b.vx);
  const add = b.kind === 'laser' || b.kind === 'bolt' || b.kind === 'pump' || b.kind === 'lever' || b.kind === 'coin';
  const name = 'bl_' + (b.kind === 'bolt' ? 'bolt' : b.kind);
  if (b.kind === 'bread') pushK(name, b.x, b.y, 1, 1, Math.sin(bgT * 14 + b.seed) * 0.35, null, 1);
  else if (b.kind === 'crew') {
    pushK(name, b.x, b.y, 1, 1, ang - Math.PI / 2, b.col, 1.3);
    wq('glow', b.x, b.y, 1.1, 0, tint(b.col || '#ff5d73'), 0.35, true);
  } else if (b.kind === 'orb') {
    wq('glow', b.x, b.y, 1.9, 0, tint('#a05ae0'), 0.7, true);
    pushK(name, b.x, b.y, 1, 1, ang + Math.sin(bgT * 3 + b.seed) * 0.2, null, 1);
  } else if (b.kind === 'rocket') {
    wq('glow', b.x, b.y, 1.7, ang, tint('#ff9040'), 0.7, true);
    pushK(name, b.x, b.y, 1, 1, ang - Math.PI / 2, null, 1);
  } else if (b.kind === 'pump') {
    const g = 1 + Math.min(1.8, (1.3 - b.life) * 1.4);
    wq('glow', b.x, b.y, 2.1 * g, 0, tint('#ff9dbd'), 0.6, true);
    pushK(name, b.x, b.y, g, g, ang - Math.PI / 2, null, 1);
  } else {
    if (add) wq('glow', b.x, b.y, 0.9, ang, tint('#ffffff'), 0.5, true);
    pushK(name, b.x, b.y, 1, 1, b.kind === 'down' ? 0 : ang - Math.PI / 2, null, 1);
  }
}

function drawEBullet(b, t) {
  const name = b.kind === 'down' ? 'bl_down' : b.kind === 'mid' ? 'bl_mid' : b.kind === 'rekt' ? 'bl_rekt' : 'bl_heart';
  pushK(name, b.x, b.y, 1, 1, Math.sin(t * 8 + b.seed) * 0.25 + (b.kind === 'down' ? 0 : -Math.PI / 2), null, 1);
}

function drawHole(h, t) {
  const k = clamp(h.life / h.max, 0, 1);
  const rr2 = h.r * (0.6 + 0.4 * Math.sin(k * Math.PI)) / 26;
  wq('glow', h.x, h.y, rr2 * 1.6, 0, tint('#a05ae0'), 0.6 * k, true);
  pushK('hole', h.x, h.y, rr2, rr2, 0, null, 1);
  pushK('holering', h.x, h.y, rr2 * 1.5, rr2 * 1.5, t * 2.2, null, k);
}

/* The player is assembled from separate kits so the run cycle is real motion.
   Two things this has to get right:

   - vertical order. World y is up, and the kit origin is its own centre, so the
     head must be pushed at a SMALLER y than the body. Pushing it at a larger y
     puts it at the player's feet, which is what made the character an
     unreadable blob.
   - scale. pushK multiplies by KS * SC itself, so what it is handed is a
     multiple of the authored size, not a screen size. */

function drawPlayerQuad(t) {
  const p = player;
  const airH = Math.max(0, -R - p.y);
  const shs = clamp(1 - airH / 260, 0.4, 1);
  pushW(0, false, 'shadow', camX + (p.x - R * 1.15 * shs) / SC, (gravDir > 0 ? 2 : CEIL) / SC,
    R * 2.3 * shs, 12 * shs, 0, [0.23, 0.14, 0.25], 0.28 * shs);

  const flick = invuln > 0 && Math.floor(invuln * 14) % 2 === 0 ? 0.42 : 1;
  const bob = Math.sin(runPhase * 2) * 2.0;
  const tilt = clamp(p.vy / 1600, -0.16, 0.22);
  const sq = p.squash;
  const spin = state === 'dying' ? deathSpin : 0;
  const PKS = 1.05;
  const psx = (1 + sq * 0.45) * PKS;
  const psy = (1 - sq * 0.45) * PKS;

  /* legs trail the run cycle: swing in screen Z, lift on the back stroke */
  for (let i = 0; i < 2; i++) {
    const ph = runPhase + i * Math.PI;
    const sw = Math.sin(ph) * 0.62 + spin;
    const lift = Math.max(0, Math.cos(ph)) * 6;
    pushK('pl_leg', p.x + Math.sin(ph) * 12, p.y + 8 + lift, PKS * 0.94, PKS * 0.94, sw, i ? '#ffc4d6' : null, flick);
  }
  pushK('pl_body', p.x, p.y + 1 + bob, psx, psy, tilt + spin, null, flick);
  pushK('pl_head', p.x + 1, p.y - 32 + bob * 1.3, psx, psy, tilt * 0.55 + spin, null, flick);

  /* the far arm swings behind the body, the near arm holds the gun */
  const rec = recoil * 5;
  pushK('pl_arm', p.x - 5, p.y - 13 + bob, PKS, PKS, 0.5 - Math.sin(runPhase) * 0.35 + spin, '#c9435f', flick);
  pushK('pl_arm', p.x + 7 - rec * 0.6, p.y - 12 + bob, PKS, PKS, -0.30 + Math.sin(runPhase) * 0.18 + spin, null, flick);
  const grot = -0.05 + p.aim * 0.10 + spin;
  pushK('g_' + gunKind, p.x + 17 - rec, p.y - 9 + bob, PKS, PKS, grot, null, flick);

  if (muzzle > 0) {
    const m = muzzle / 0.09;
    pushW(1, true, 'flash', p.x + 27 - rec, p.y - 8.5 + bob, 64 * m, 64 * m, grot + (p.phFlash || 0), tint('#fff6c8'), 0.95 * m);
  }
  if (shield > 0) {
    wq('glow', p.x, p.y - 12, 3.4, 0, tint('#8fd6ff'), 0.45 + Math.sin(t * 6) * 0.1, true);
    pushK('pk_diamond', p.x + R * 1.1, p.y - R * 0.9, 0.8, 0.8, t * 1.2, null, 1);
  }
}

function drawBossQuad(t) {
  const b = boss;
  if (!b) return;
  const kind = b.kind === 1 ? 1 : 0;
  const by = b.y + Math.sin(t * 1.7) * 10;
  const k = 1 + b.enter * 0.8;
  const hot = b.hitFx > 0;
  const BS = 1.55;                                   // the algorithm towers over the feed
  wq('glow', b.x, by, 6 * (1 + b.enter), 0, tint(kind ? '#6fb7ff' : '#ff5d73'), 0.4, true);
  pushK('boss' + kind, b.x, by, k * BS, 1 / k * BS, 0, hot ? '#ff8888' : null, hot ? 2.1 : 1);
  const blink = Math.sin(t * 1.1) > 0.95 ? 0.16 : 1;
  const look = Math.sin(t * 1.6) * 10;
  wq('glow', b.x, by - 6 * BS, 3.4, 0, tint(kind ? '#6fb7ff' : '#c9366f'), 0.4, true);
  pushK('boss_eye', b.x + look, by - 5 * BS, BS * 1.18, BS * 1.18 * blink, 0, hot ? '#ff8888' : null, hot ? 2 : 1);
  for (let i = 0; i < (QUAL.lab ? 5 : 3); i++) {
    const a = t * 0.9 + (i / 5) * TAU;
    pushK('boss_badge' + i, b.x + Math.cos(a) * 104, by + Math.sin(a) * 70 - 6, BS * 0.95, BS * 0.95, a * 0.6, null, 1);
  }
  const pr = clamp(b.hp / b.maxHp, 0, 1);
  pushW(1, false, 'px', b.x - 46, by + 52, 92, 14, 0, [0.12, 0.05, 0.2], 1);
  if (pr > 0) pushW(1, false, 'px', b.x - 46, by + 52, 92 * pr, 14, 0,
    tint(pr > 0.5 ? '#7fd3a8' : pr > 0.22 ? '#ffd166' : '#ff5d73'), 1);
}

function drawPartsQ() {
  for (const p of parts) {
    const k = 1 - p.life / p.max;
    const nm = p.kind === 'heart' ? 'fx_heart' : p.kind === 'star' ? 'fx_star' : p.kind === 'square' ? 'fx_square' : 'fx_dot';
    const sp = SPR[nm];
    const s = p.size / (p.kind === 'heart' ? 14 : p.kind === 'star' ? 10 : 9);
    wq(nm, p.x, p.y, s, p.rot, tint(p.col), clamp(k * 1.4, 0, 1));
  }
}
function drawTextsQ() {
  if (!QUAL.lab) return;
  for (const f of texts) {
    const k = 1 - f.life / 0.9;
    const nm = popSprite(f.s);
    if (!nm) continue;
    const sp = SPR[nm];
    const pop = f.life > 0.75 ? 1 + (f.life - 0.75) * 1.6 : 1;
    const s = (f.size / 30) * pop;
    pushW(2, false, nm, f.x, f.y, sp.w * s, sp.h * s, 0, tint(f.col), clamp(k * 1.5, 0, 1));
  }
}
function drawRingsQ() {
  for (const r of rings) {
    const k = r.life / 0.45;
    const rr = lerp2(r.r, r.r1, k) / 14;
    wq('fx_ring', r.x, r.y, rr, 0, tint(r.col), clamp(1 - k, 0, 1) * 0.85);
  }
}

/* ---------------- screen overlays ---------------- */
function drawOverlayFx(t) {
  if (state === 'play' && QUAL.line) {
    const spd = clamp(player.x * 0.00004, 0, 0.5);
    for (let i = 0; i < 12; i++) {
      const y = 40 + hash(i * 3 + Math.floor(t * 30) + 1) * (GROUND - 90);
      const x = W - ((hash(i * 7) * W + t * (900 + hash(i) * 900)) % (W + 200));
      pushS(0, true, 'speed', x, y, 100 + hash(i * 5) * 90, 3, 0, tint('#fff4e0'), 0.10 + spd * 0.22);
    }
  }
  if (mode === 'ohio') fillR(0, 0, W, H, tint('#ff2e88'), 0.13, true);
  if (mode === 'degen') fillR(0, 0, W, H, tint('#7ff0a8'), 0.05, true);
  if (ev && ev.tint) { const c = ev.tint.match(/[\d.]+/g); fillR(0, 0, W, H, [c[0] / 255, c[1] / 255, c[2] / 255], +c[3], true); }
  if (glitch > 0 && QUAL.glitch) {
    for (let i = 0; i < 7; i++) {
      const yy = Math.random() * H, hh = 6 + Math.random() * 26;
      fillR((Math.random() - 0.5) * 40, yy, W, hh, tint(pick(['#ff2e88', '#2ee8ff', '#ffe27a'])), 0.10 + Math.random() * 0.16, true);
    }
  }
  if (QUAL.vig && !POST.on) {
    /* the composite pass does a shaped, coloured vignette of its own; the
       baked one is only for when the chain is off */
    s8('vigb', 0, H - 190, W, 190, 0, WHITE, 0.9);
    s8('vig', 0, 0, W, H, 0, WHITE, 1);
  }
  if (hurtFx > 0) s8('vig', 0, 0, W, H, 0, tint('#ff5050'), hurtFx * 0.9, true);
  if (scanT > 0) {
    for (let i = 0; i < 40; i++) {
      const yy = (i * 26 + (bgT * 260) % 26) % H;
      s8('scan', 0, yy, W, 10, 0, tint('#7ff0a8'), 0.06 * scanT);
    }
  }
}

/* dev-only: sheet preview through the real render path (dev.gallery / dev.galleryOff).
   Names are matched against baked sprites first, then kits. */
let GAL = null;
function drawGallery() {
  if (!GAL) return;
  const { names, cols, rows, scale } = GAL;
  const cw = W / cols, ch = (H - 12) / rows;
  GAL.layout = [];
  for (let i = 0; i < names.length; i++) {
    const name = names[i], sp = SPR[name], kit = KITS[name];
    const c = i % cols, r = (i / cols) | 0;
    const x = c * cw + cw / 2, y = r * ch + ch / 2;
    pushW(0, false, 'px', x, y, cw - 6, ch - 6, 0, [0.10, 0.10, 0.16], 1);
    if (sp) {
      const sc = Math.min((cw - 20) / sp.w, (ch - 20) / sp.h, scale || 3) * GAL.zoom;
      pushW(0, false, 'px', x, y, sp.w * sc, sp.h * sc, 0, [1, 0, 1], 0.55);
      pushS(sp.page, false, name, x, y, sp.w * sc, sp.h * sc, 0, WHITE, 1);
      GAL.layout.push({ name, x, y, w: sp.w * sc, h: sp.h * sc, box: [sp.w, sp.h], page: sp.page });
    } else if (kit) {
      const sc = Math.min((cw - 16) / kit.w, (ch - 16) / kit.h, 6) * GAL.zoom;
      pushW(0, false, 'px', x, y, kit.w * sc, kit.h * sc, 0, [1, 0, 1], 0.55);
      const s2 = sc * KS * SC;
      kit.push(x, -y, s2, s2, 0, null, 1);   /* grid space == screen space here */
      GAL.layout.push({ name, x, y, w: kit.w * sc, h: kit.h * sc, box: [Math.round(kit.w), Math.round(kit.h)], kit: true });
    } else GAL.layout.push({ name, missing: true });
  }
}
