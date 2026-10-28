function deleteEnemy(idx, byGun) {
  const e = enemies[idx];
  enemies.splice(idx, 1);
  kills++;
  combo++;
  comboT = 2.6;
  bestCombo = Math.max(bestCombo, combo);
  burst(e.x, e.y, 16, { cols: [C.gold, C.pink, C.mint, '#fff', C.lilac], kind: 'dot', s0: 3, s1: 9 });
  burst(e.x, e.y, 6, { cols: ['#ff5d73', '#ff9dbd'], kind: 'heart', s0: 5, s1: 9, sp1: 220 });
  addRing(e.x, e.y, e.r * 0.4, e.r * 2.6, '#fff8fb', 6);
  const degen = MODES[mode].market;
  const words = combo >= 5
    ? (degen ? ['REKT', 'LIQUIDATED', 'NGMI', 'SHORTED'] : ['RATIO’D', 'DELETED', 'CANCELLED', 'BANNED'])
    : (degen ? ['GET REKT', 'BYE', 'NEXT', 'MID'] : ['POOF', 'BYE', 'NEXT', 'MID']);
  addText(e.x, e.y - 16, pick(words), '#fff', combo >= 5 ? 26 : 21);
  /* the bag: memes drop coins, tanky memes drop more */
  const drop = ((e.m.hp || 1) > 1 ? 3 : 1) * (degen ? 2 : 1);
  bag += drop;
  pnlMarket = clamp(pnlMarket + rnd(-2, 7), -60, 380);
  if (Math.random() < 0.34) addPickup(e.x, e.y - 10, 'aura');
  if (byGun) { shake = Math.min(10, shake + 4); hitStop = 0.045; }
  tone(byGun ? 720 : 480, 0.09, 'triangle', 0.05);
  tone(byGun ? 1080 : 720, 0.11, 'sine', 0.04, 0.05);
  if (combo > 1) {
    addText(e.x, e.y - 46, '×' + combo, '#ffe27a', 30);
    const el = document.getElementById('combo');
    el.textContent = (degen ? 'WAGMI ×' : '×') + combo + (degen ? ' WAGMI' : ' COMBO');
    el.classList.add('on');
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
  }
  if (Math.random() < 0.22) toast(pick(QUIPS));
}

function hurt(msg) {
  if (invuln > 0 || state !== 'play') return;
  const zen = MODES[mode].dmg === 0;
  if (invulnT > 0) { addText(player.x, player.y - 60, 'TOO GREEN', '#7ff0a8', 22); return; }
  if (shield > 0) {
    shield = 0;
    invuln = 1.1;
    combo = 0;
    burst(player.x, player.y, 26, { cols: ['#bfe9ff', '#fff', '#8fd6ff'], kind: 'star', s1: 12, sp1: 380 });
    addRing(player.x, player.y, 14, 190, '#8fd6ff', 9);
    addText(player.x, player.y - 60, 'DIAMOND HANDS', '#bfe9ff', 26);
    toast('Diamond hands. One hit absorbed, one dignity retained.');
    tone(880, 0.16, 'triangle', 0.05); tone(1320, 0.12, 'sine', 0.04, 0.08);
    return;
  }
  if (!zen) brains--;
  invuln = zen ? 0.8 : 1.4;
  combo = 0;
  document.getElementById('combo').classList.remove('on');
  hurtFx = 1;
  shake = 16;
  hitStop = 0.07;
  updateHearts();
  burst(player.x, player.y, 18, { cols: ['#ff5d73', '#ff9dbd', '#fff'], kind: 'dot', s1: 8 });
  addRing(player.x, player.y, 10, 90, '#ff9dbd', 7);
  toast(msg + ' ' + pick(QUIPS));
  tone(240, 0.2, 'sawtooth', 0.06);
  tone(150, 0.26, 'square', 0.04, 0.06);
  if (!zen && brains <= 0) {
    state = 'dying';
    deathT = 0;
    deathSpin = 0;
    player.vy = -560;
    player.grounded = false;
    burst(player.x, player.y, 40, { cols: ['#ff5d73', '#ffd166', '#7fd3a8', '#fff', '#c9a8e8'], s1: 12, sp1: 420 });
    addRing(player.x, player.y, 12, 240, '#fff', 10);
    tone(200, 0.3, 'sawtooth', 0.07);
    tone(120, 0.5, 'sawtooth', 0.06, 0.12);
  }
}

function setWeapon(k) {
  if (!WEAPONS[k]) k = 'blaster';
  wpn = k;
  ammo = WEAPONS[k].ammo;
  updateWpnHud();
  if (k !== 'blaster') {
    addText(player.x, player.y - 54, WEAPONS[k].label + '!', '#ffe27a', 26);
    toast(WEAPONS[k].label + ' acquired. Use it responsibly. Or don\'t.');
    tone(700, 0.1, 'triangle', 0.05); tone(1050, 0.12, 'sine', 0.04, 0.06);
  }
}

function fire() {
  const WP = WEAPONS[wpn];
  let target = null, bestT = 1e9;
  for (const e of enemies) {
    const dx = e.x - player.x;
    if (dx < 20 || dx > 780) continue;
    const d = Math.abs(e.y - player.y) * 2 + dx;
    if (d < bestT) { bestT = d; target = e; }
  }
  if (boss && boss.enter <= 0) target = boss;
  const ox = player.x + R * 0.6 + 34, oy = player.y + 1;
  let baseAng = 0;
  if (target) {
    baseAng = Math.atan2(target.y - oy, target.x - ox);
    player.aim = clamp((target.y - oy) / 160, -1, 1);
  }
  const n = WP.pellets || 1;
  const speed = WP.speed || 980;
  for (let i = 0; i < n; i++) {
    let a = baseAng;
    if (n > 1) a += (i / (n - 1) - 0.5) * (WP.spread || 0.25);
    else if (WP.spread) a += rnd(-WP.spread, WP.spread) * 0.35;
    bullets.push({
      x: ox, y: oy, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
      life: 1.3, kind: WP.kind, dmg: WP.dmg || 1, pierce: !!WP.pierce, homing: !!WP.homing,
      hits: null, seed: rnd(TAU), bh: !!WP.blackhole, lift: !!WP.lift, grow: !!WP.grow,
      blast: WP.blast || 0, coins: !!WP.coins,
      col: WP.kind === 'crew' ? pick(['#ff5d73', '#6fb7ff', '#43a86c']) : null
    });
  }
  if (WP.kick) {                                  // 100x kicks you backwards and up
    player.vy -= 260;
    player.x -= 26;
    shake = Math.min(16, shake + 7);
    addText(player.x, player.y - 66, '100x', '#ff5d73', 22);
  }
  if (ammo !== Infinity) {
    ammo--;
    if (ammo <= 0) { setWeapon('blaster'); toast('Ammo gone. Back to the rental blaster.'); }
    else updateWpnHud();
  }
  muzzle = 0.09;
  recoil = 1;
  shake = Math.min(9, shake + (n > 1 ? 3.4 : 1.6));
  burst(ox + 6, oy, 3, { cols: ['#fff6a8', '#ffd166'], kind: 'star', s0: 2, s1: 5, sp1: 160, g: 60 });
  const f = wpn === 'voidgun' ? 220 : wpn === 'bread' ? 340 : 520;
  tone(f + rnd(-40, 40), wpn === 'prism' ? 0.04 : 0.055, wpn === 'voidgun' ? 'sawtooth' : 'square', 0.035);
  tone(f * 1.7, 0.05, 'triangle', 0.022, 0.02);
}

/* ---------------- events ---------------- */
let gravMul = 1, banner = null, evSpeed = 1;
function triggerEvent() {
  const M = MODES[mode];
  const e = (M.market && Math.random() < 0.62) ? pick(MARKET_EVENTS) : pick(EVENTS);
  ev = e; evT = rnd(7.5, 11);
  nextEvT = M.eventEvery + rnd(-3, 5);
  banner = { text: e.label, line: e.line, t: 2.6 };
  shake = Math.min(16, shake + 9);
  addRing(player.x, player.y, 18, 300, '#fff', 9);
  tone(160, 0.26, 'sawtooth', 0.05);
  tone(560, 0.2, 'triangle', 0.04, 0.08);
  wind = 0; coinRain = 0; invulnT = 0; evSpeed = 1; scanT = 1;
  switch (e.id) {
    case 'moon': gravMul = 0.33; break;
    case 'heavy': gravMul = 1.95; break;
    case 'flip': gravDir = -1; break;
    case 'slow': timeScale = 0.55; break;
    case 'glitch': glitch = 1; break;
    /* degen market */
    case 'rug': gravDir = -1; glitch = 1; addText(player.x, player.y - 70, 'RUGGED', '#ff5d73', 30); break;
    case 'crash': wind = -300; evSpeed = 1.15; break;
    case 'moonshot': gravMul = 0.22; coinRain = 0.7; break;
    case 'pump': evSpeed = 1.55; coinRain = 0.4; break;
    case 'airdrop': coinRain = 1; break;
    case 'whale': wind = -140; coinRain = 0.3; break;
    case 'bull': invulnT = 1; evSpeed = 1.3; break;
  }
  if (e.market) pnlMarket = clamp(pnlMarket + rnd(-40, 90), -70, 400);
}
function updateEvents(dt) {
  if (boss) return;
  if (ev) {
    evT -= dt;
    if (ev.id === 'bull') invulnT = 1;
    if (ev.id === 'pump' && evT < 3.4 && evSpeed > 1) evSpeed = 0.72;   // the dump
    if (evT <= 0) {
      if (ev.id === 'pump' && evSpeed < 1) { for (let i = 0; i < 5; i++) addFallingEnemy(player.x + rnd(220, 700), pickMeme()); }
      ev = null; gravMul = 1; gravDir = 1; timeScale = 1; glitch = 0;
      wind = 0; coinRain = 0; invulnT = 0; evSpeed = 1;
      toast('Reality re-enabled. Market closed.');
    }
  } else {
    nextEvT -= dt;
    if (nextEvT <= 0) triggerEvent();
  }
  if (ev && ev.id === 'whale' && Math.random() < dt * 0.5) addEnemy(player.x + W * 0.9 / SC, MEMES.find(m => m.tag === 'whale'), 120, true);
}

/* ---------------- black holes ---------------- */
function spawnHole(x, y) {
  holes.push({ x, y, r: 36, life: 2.3, max: 2.3 });
  addRing(x, y, 8, 150, '#c9a8e8', 8);
  shake = Math.min(16, shake + 7);
  burst(x, y, 18, { cols: ['#c9a8e8', '#ff9dbd', '#8fd6ff', '#fff'], kind: 'star', s1: 9, sp1: 240 });
  tone(90, 0.35, 'sine', 0.06); tone(140, 0.3, 'triangle', 0.03, 0.04);
  if (Math.random() < 0.5) toast('You folded spacetime for no reason.');
}
function updateHoles(dt) {
  for (let i = holes.length - 1; i >= 0; i--) {
    const h = holes[i];
    h.life -= dt;
    if (h.life <= 0) { spawnHoleEnd(h); holes.splice(i, 1); continue; }
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      const dx = h.x - e.x, dy = h.y - e.y;
      const d = Math.max(8, Math.hypot(dx, dy));
      if (d < 260) {
        const pull = 620 / Math.max(0.35, d / 90);
        e.x += (dx / d) * pull * dt;
        e.y += (dy / d) * pull * dt;
        if (d < h.r * 0.85) deleteEnemy(j, false);
      }
    }
    for (let j = pickups.length - 1; j >= 0; j--) {
      const p = pickups[j];
      const dx = h.x - p.x, dy = h.y - p.y;
      const d = Math.max(8, Math.hypot(dx, dy));
      if (d < 220) { p.x += (dx / d) * 480 * dt; p.y += (dy / d) * 480 * dt; }
    }
  }
}
function spawnHoleEnd(h) {
  burst(h.x, h.y, 14, { cols: ['#c9a8e8', '#fff', '#ff9dbd'], kind: 'dot', s1: 8, sp1: 300 });
}

/* ---------------- enemy projectiles ---------------- */
function updateEBullets(dt) {
  for (let i = eBullets.length - 1; i >= 0; i--) {
    const b = eBullets[i];
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    const dx = b.x - player.x, dy = b.y - player.y;
    if (dx * dx + dy * dy < (R + 13) * (R + 13)) {
      eBullets.splice(i, 1);
      hurt('You got notified.');
      continue;
    }
    if (b.life <= 0 || b.x < camX - 120 || b.y > 200) eBullets.splice(i, 1);
  }
}

/* ---------------- boss ---------------- */
function spawnBoss() {
  const kind = bossKind++ % 2;
  const hp = (kind ? 74 : 58) + Math.floor(dist / (kind ? 15 : 18));
  boss = { kind, x: player.x + 470, y: -168, hp, maxHp: hp, t: 0, fireCd: 1.6, enter: 1, hitFx: 0, minionCd: 2.4 };
  shake = 18;
  banner = kind
    ? { text: 'THE WHALE', line: 'It is selling into your optimism.', t: 3 }
    : { text: 'THE ALGORITHM', line: 'It has come to personalise you.', t: 3 };
  addRing(player.x, player.y, 20, 420, kind ? '#6fb7ff' : '#ff5d73', 12);
  tone(110, 0.5, 'sawtooth', 0.07); tone(165, 0.4, 'square', 0.05, 0.15);
}
function updateBoss(dt) {
  const b = boss;
  if (!b) return;
  b.t += dt;
  b.enter = Math.max(0, b.enter - dt * 1.6);
  b.hitFx = Math.max(0, b.hitFx - dt);
  const hold = clamp(W * 0.70 / SC, 360, 620);
  b.x += (player.x + hold - b.x) * (1 - Math.pow(0.004, dt));
  b.y = -168 + Math.sin(b.t * 1.15) * 22;
  b.fireCd -= dt;
  if (b.fireCd <= 0 && b.enter <= 0) {
    b.fireCd = clamp(1.5 - dist / 7000, 0.5, 1.5);
    const ox = b.x - 44, oy = b.y + 16;
    const dx = player.x - ox, dy = player.y - oy, len = Math.max(1, Math.hypot(dx, dy));
    const sp = 430 + clamp(dist / 40, 0, 180);
    const shots = b.kind === 1 ? 2 : 1;
    for (let s = 0; s < shots; s++) {
      const aa = Math.atan2(dy, dx) + (s - (shots - 1) / 2) * 0.22;
      eBullets.push({ x: ox, y: oy, vx: Math.cos(aa) * sp, vy: Math.sin(aa) * sp, life: 4.2, seed: rnd(TAU),
        kind: b.kind === 1 ? pick(['rekt', 'rekt', 'down']) : pick(['down', 'mid', 'heart']) });
    }
    tone(300, 0.09, 'square', 0.035);
  }
  b.minionCd -= dt;
  if (b.minionCd <= 0 && b.enter <= 0) {
    b.minionCd = rnd(2.2, 3.4);
    addFallingEnemy(b.x + rnd(-70, 40), b.kind === 1 ? pick(DEGEN_MEMES) : pick(MEMES));
  }
}
function hitBoss(b, dmg) {
  b.hp -= dmg;
  b.hitFx = 0.12;
  burst(b.x + rnd(-40, 40), b.y + rnd(-60, 60), 8, { cols: ['#ff5d73', '#ffd166', '#fff'], kind: 'star', s1: 8, sp1: 240 });
  addText(b.x + rnd(-55, 25), b.y - 30 - rnd(0, 90), pick(['DEBUZZED', 'UNFOLLOW', 'MUTED', '0 LIVES', 'CANCELLED', 'NO RIZZ']), '#fff', 18 + rnd(0, 8));
  tone(640, 0.07, 'square', 0.04);
  if (b.hp <= 0) bossDie();
}
function bossDie() {
  const b = boss;
  boss = null;
  nextBossDist += MODES[mode].bossEvery;
  aura += 40; bag += 40;
  pnlMarket = clamp(pnlMarket + 120, -70, 400);
  shake = 26;
  hitStop = 0.14;
  burst(b.x, b.y, 60, { cols: ['#ff5d73', '#ffd166', '#7fd3a8', '#fff', '#c9a8e8'], s1: 14, sp1: 520 });
  addRing(b.x, b.y, 20, 460, '#fff', 14);
  addText(b.x, b.y - 40, 'DEFRAGGED', '#ffe27a', 40);
  banner = { text: 'ALGORITHM DEFRAGGED', line: '+400 aura. The feed is briefly honest.', t: 3 };
  for (let i = enemies.length - 1; i >= 0; i--) deleteEnemy(i, false);
  eBullets.length = 0;
  toast('You beat the algorithm. It will be back with a rebrand.');
  tone(120, 0.5, 'sawtooth', 0.07); tone(880, 0.4, 'triangle', 0.05, 0.1); tone(1320, 0.4, 'sine', 0.04, 0.22);
}

function step(dt) {
  const M = MODES[mode];
  const speed = (BASE_SPEED + Math.min(200, player.x * 0.014 + kills * 0.8)) * M.speed * evSpeed;
  player.x += (speed + wind) * dt;
  if (leverT > 0) { leverT -= dt; if (leverT <= 0) { leverT = 0; toast('Leverage expired. The exchange thanks you for your participation.'); } }
  if (invulnT > 0) invulnT = Math.max(0, ev ? 1 : 0);
  if (coinRain > 0 && Math.random() < dt * coinRain * 2.4) {
    addPickup(player.x + rnd(W * 0.4 / SC, W * 0.9 / SC), rnd(-200, -60), Math.random() < 0.22 ? 'bag' : 'aura');
  }
  dist = player.x / 60;
  runPhase += dt * speed * 0.055;
  camX = player.x - W * 0.30 / SC;

  // input
  if (jumpBuf > 0) {
    if (player.grounded || coyote > 0) {
      player.vy = -JUMPV * gravDir;
      player.grounded = false;
      coyote = 0;
      jumpBuf = 0;
      player.squash = -0.32;
      burst(player.x, gravDir > 0 ? 0 : CEIL, 8, { cols: ['#fff', '#ffd9e8'], kind: 'dot', s0: 2, s1: 6, sp1: 140, g: 300, a: gravDir > 0 ? -Math.PI / 2 : Math.PI / 2 });
      tone(430, 0.09, 'triangle', 0.04);
    }
    jumpBuf -= dt;
  }
  const gy = GRAV * gravMul * gravDir * (M.grav || 1);
  player.vy += gy * dt;
  if (!player.grounded && player.vy * gravDir > 0) player.vy += gy * 0.42 * dt;
  player.y += player.vy * dt;
  player.y = clamp(player.y, -520, 400);
  const landed = gravDir > 0 ? (player.y >= -R && player.vy > 0) : (player.y <= CEIL + R && player.vy < 0);
  if (landed) {
    if (!player.grounded) {
      player.squash = 0.34;
      burst(player.x, gravDir > 0 ? 0 : CEIL, 10, { cols: ['#fff', '#ffd9e8', '#c6f5d6'], kind: 'dot', s0: 2, s1: 7, sp1: 190, g: 400 });
      tone(300, 0.07, 'sine', 0.03);
      shake = Math.min(8, shake + 2.5);
    }
    player.y = gravDir > 0 ? -R : CEIL + R; player.vy = 0; player.grounded = true; coyote = 0.11;
  } else coyote = Math.max(0, coyote - dt);
  player.squash *= Math.pow(0.0025, dt);
  if (player.grounded) player.aim *= Math.pow(0.02, dt);

  if (shootHeld) {
    shootCd -= dt;
    if (shootCd <= 0) {
      fire();
      shootCd = WEAPONS[wpn].rate * (ev && ev.id === 'frenzy' ? 0.42 : 1);
    }
  } else shootCd = Math.min(shootCd, 0.05);

  muzzle = Math.max(0, muzzle - dt);
  recoil = Math.max(0, recoil - dt * 7);
  invuln = Math.max(0, invuln - dt);
  if (comboT > 0) { comboT -= dt; if (comboT <= 0) { combo = 0; document.getElementById('combo').classList.remove('on'); } }

  updateEvents(dt);
  updateBoss(dt);
  updateHoles(dt);
  updateEBullets(dt);
  if (banner) { banner.t -= dt; if (banner.t <= 0) banner = null; }
  if (!boss && dist >= nextBossDist) spawnBoss();
  if (ev && ev.id === 'rain' && Math.random() < dt * 2.6) addFallingEnemy(player.x + rnd(W * 0.4 / SC, W * 0.9 / SC), pick(MEMES));

  ensureSpawns();

  // enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.spawn = Math.max(0, e.spawn - dt * 4);
    if (e.fall) {
      e.vy += 1500 * dt;
      e.y += e.vy * dt;
      e.x -= 20 * dt;
      if (e.y >= e.baseY) { e.y = e.baseY; e.fall = false; e.vy = 0; burst(e.x, e.y + e.r, 6, { cols: ['#fff', '#ffd9e8'], s1: 6, sp1: 140 }); }
    } else if (e.fly) {
      e.x += e.vx * dt;
      e.y = e.baseY + Math.sin(bgT * 2 + e.ph) * 12;
    } else {
      e.x -= 26 * dt;
    }
    if (e.m.shoots) {
      e.cd = (e.cd === undefined ? rnd(0.7, 1.8) : e.cd) - dt;
      if (e.cd <= 0 && e.x > player.x + 130 && e.x < player.x + 760) {
        e.cd = rnd(1.7, 3);
        const dx = player.x - e.x, dy = player.y - e.y, len = Math.max(1, Math.hypot(dx, dy));
        eBullets.push({ x: e.x, y: e.y, vx: dx / len * 380, vy: dy / len * 380, kind: pick(['down', 'mid']), life: 4, seed: rnd(TAU) });
        tone(430, 0.06, 'square', 0.03);
      }
    }
    e.hit = Math.max(0, e.hit - dt);
    const dx = player.x - e.x, dy = player.y - e.y;
    if (invuln <= 0 && dx * dx + dy * dy < (R + e.r - 6) * (R + e.r - 6)) {
      enemies.splice(i, 1);
      hurt('A ' + e.m.label + ' stole your aura.');
      continue;
    }
  }

  // blocks
  for (const b of blocks) {
    if (player.x + R * 0.8 > b.x && player.x - R * 0.8 < b.x + b.w && player.y + R > -b.h + 4) {
      hurt('You ran into ' + (b.kind === 'saw' ? 'a spinning saw' : 'a ' + b.kind) + '.');
      break;
    }
  }

  // pickups
  for (let i = pickups.length - 1; i >= 0; i--) {
    const p = pickups[i];
    const dx = player.x - p.x, dy = player.y - p.y;
    const rr2 = R + 20;
    if (dx * dx + dy * dy < rr2 * rr2) {
      pickups.splice(i, 1);
      if (p.kind === 'aura') {
        aura++; bag++;
        burst(p.x, p.y, 9, { cols: ['#ffe27a', '#fff', '#ffd166'], kind: 'star', s0: 2, s1: 6, sp1: 180 });
        addText(p.x, p.y - 12, '+$1', '#ffe27a', 17);
        tone(680 + Math.min(600, aura * 8), 0.08, 'sine', 0.035);
      } else if (p.kind === 'weapon') {
        setWeapon(p.wpn || 'blaster');
        burst(p.x, p.y, 22, { cols: ['#ffe27a', '#fff', '#ff9dbd', '#8fd6ff'], kind: 'star', s1: 10, sp1: 300 });
        addRing(p.x, p.y, 10, 130, '#ffe27a', 7);
        shake = Math.min(12, shake + 5);
      } else if (p.kind === 'gem') {
        aura += 5;
        burst(p.x, p.y, 20, { cols: ['#ff9dbd', '#fff', '#ffd166'], kind: 'star', s1: 9, sp1: 260 });
        addRing(p.x, p.y, 8, 110, '#ff9dbd', 6);
        addText(p.x, p.y - 14, 'RIZZ +5', '#ff9dbd', 26);
        shake = Math.min(12, shake + 5);
        toast('Maximum rizz achieved.');
        tone(760, 0.1, 'sine', 0.05); tone(1140, 0.14, 'sine', 0.04, 0.06);
      } else if (p.kind === 'bag') {
        bag += 12; aura += 3;
        burst(p.x, p.y, 22, { cols: ['#ffe27a', '#ffd166', '#fff'], kind: 'star', s1: 10, sp1: 300 });
        addRing(p.x, p.y, 10, 120, '#ffd166', 7);
        addText(p.x, p.y - 16, 'BAG +12', '#ffe27a', 26);
        toast('You pocketed a bag. Do not spend it on JPEGs.');
        tone(620, 0.1, 'sine', 0.05); tone(930, 0.12, 'triangle', 0.04, 0.06);
      } else if (p.kind === 'diamond') {
        shield = 1;
        burst(p.x, p.y, 22, { cols: ['#bfe9ff', '#fff', '#8fd6ff'], kind: 'star', s1: 11, sp1: 320 });
        addRing(p.x, p.y, 12, 150, '#8fd6ff', 8);
        addText(p.x, p.y - 16, 'DIAMOND HANDS', '#bfe9ff', 24);
        toast('Diamond hands equipped. It will not be comfortable.');
        tone(700, 0.12, 'triangle', 0.05); tone(1400, 0.16, 'sine', 0.04, 0.08);
      } else if (p.kind === 'advisory') {
        addText(p.x, p.y - 20, 'FINANCIAL ADVICE', '#ffe27a', 24);
        banner = { text: 'FINANCIAL ADVICE', line: 'Everyone on screen is liquidated. Include you. Especially you.', t: 2.2 };
        for (let j = enemies.length - 1; j >= 0; j--) deleteEnemy(j, false);
        shake = Math.min(20, shake + 12); hitStop = 0.1;
        burst(p.x, p.y, 40, { cols: ['#ffe27a', '#fff', '#ff9dbd'], s1: 13, sp1: 460 });
        tone(180, 0.4, 'sawtooth', 0.07); tone(1200, 0.3, 'square', 0.05, 0.1);
      } else if (p.kind === 'lever') {
        leverT = 16;
        addText(p.x, p.y - 16, '100x LEVERAGE', '#ff5d73', 26);
        addRing(p.x, p.y, 12, 170, '#ff5d73', 9);
        shake = Math.min(16, shake + 8);
        toast('Leveraged. Everything you do is now double. Including mistakes.');
        tone(200, 0.3, 'sawtooth', 0.06); tone(900, 0.16, 'square', 0.04, 0.1);
      } else {
        if (brains < 5) { brains++; updateHearts(); }
        burst(p.x, p.y, 16, { cols: ['#ff5d73', '#ffb3c8', '#fff'], kind: 'heart', s1: 9, sp1: 240 });
        addText(p.x, p.y - 14, '+1 BRAIN', '#ff9dbd', 24);
        tone(520, 0.12, 'sine', 0.05); tone(780, 0.16, 'sine', 0.04, 0.07);
      }
    }
  }

  // bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    if (b.homing) {
      let tgt = null, bt = 1e9;
      for (const e of enemies) {
        const dx = e.x - b.x;
        if (dx < -20 || dx > 620) continue;
        const d = Math.abs(e.y - b.y) * 1.6 + dx;
        if (d < bt) { bt = d; tgt = e; }
      }
      if (boss && !tgt) tgt = boss;
      if (tgt) {
        const dx = tgt.x - b.x, dy = tgt.y - b.y, len = Math.max(1, Math.hypot(dx, dy));
        const sp = Math.hypot(b.vx, b.vy);
        b.vx += ((dx / len) * sp - b.vx) * Math.min(1, dt * 7);
        b.vy += ((dy / len) * sp - b.vy) * Math.min(1, dt * 7);
      }
    }
    if (b.lift) b.vy -= 1100 * dt;                       // moonshot climbs
    if (b.grow) b.dmg = 3 + Math.round((1.3 - b.life) * 2);
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.kind === 'orb') glowTrail(b);
    if (b.kind === 'rocket' && Math.random() < 0.5) burst(b.x - 14, b.y, 1, { cols: ['#ffd166', '#ff9040'], kind: 'dot', s0: 2, s1: 5, sp1: 40, g: 0 });
    let hitSomething = false;
    for (let j = 0; j < enemies.length; j++) {
      const e = enemies[j];
      if (b.hits && b.hits.indexOf(e) >= 0) continue;
      const dx = b.x - e.x, dy = b.y - e.y;
      if (dx * dx + dy * dy < (e.r + 7) * (e.r + 7)) {
        e.hit = 0.12;
        if (b.pierce) (b.hits || (b.hits = [])).push(e);
        e.hp = (e.hp || 1) - b.dmg;
        if (e.hp <= 0) deleteEnemy(j, true);
        else {
          burst(e.x, e.y, 5, { cols: ['#fff', '#8fd6ff'], s1: 6, sp1: 190 });
          addText(e.x, e.y - e.r - 12, 'HODL', '#bfe9ff', 16);
          tone(320, 0.06, 'square', 0.03);
        }
        if (b.blast) blastHit(b.x, b.y, b.blast, b);
        hitSomething = true;
        break;
      }
    }
    if (!hitSomething && boss && !(b.hits && b.hits.indexOf(boss) >= 0)) {
      const dx = b.x - boss.x, dy = b.y - boss.y;
      if (dx * dx + dy * dy < 74 * 74) {
        if (b.pierce) { (b.hits || (b.hits = [])).push(boss); hitBoss(boss, b.dmg); }
        else { hitBoss(boss, b.dmg); hitSomething = true; }
      }
    }
    if (!hitSomething && b.bh && (b.life <= 0 || b.x > player.x + W * 0.85 / SC)) {
      spawnHole(b.x, b.y); bullets.splice(i, 1); continue;
    }
    if (hitSomething) {
      if (b.bh) spawnHole(b.x, b.y);
      bullets.splice(i, 1); continue;
    }
    let blocked = false;
    if (!b.pierce) {
      for (const bk of blocks) {
        if (b.x > bk.x && b.x < bk.x + bk.w && b.y > -bk.h - 4 && b.y < 6) { blocked = true; break; }
      }
    }
    if (blocked || b.life <= 0 || b.x > player.x + W * 0.9 / SC) {
      if (b.bh) spawnHole(b.x, b.y);
      burst(b.x, b.y, 4, { cols: ['#fff', '#c6f5d6'], kind: 'dot', s0: 2, s1: 4, sp1: 120 });
      bullets.splice(i, 1);
    }
  }

  // cull
  const behind = camX - 220;
  if (enemies.length && enemies[0].x < behind) enemies = enemies.filter(e => e.x > behind);
  if (blocks.length && blocks[0].x + blocks[0].w < behind) blocks = blocks.filter(b => b.x + b.w > behind);
  if (pickups.length && pickups[0].x < behind) pickups = pickups.filter(p => p.x > behind);

  updateFx(dt);
  score = Math.floor(player.x / 40) + kills * 15 + aura * 10 + bestCombo * 5;
  pnl = Math.round(score * (leverT > 0 ? 2 : 1) * (MODES[mode].mult || 1));
  if (pnl > pnlPeak) pnlPeak = pnl;
  hud();
}
function blastHit(x, y, r, b) {
  for (let j = enemies.length - 1; j >= 0; j--) {
    const e = enemies[j];
    const dx = e.x - x, dy = e.y - y;
    if (dx * dx + dy * dy < r * r) {
      if (b.hits && b.hits.indexOf(e) >= 0) continue;
      e.hp = (e.hp || 1) - 1;
      if (e.hp <= 0) deleteEnemy(j, true);
      else burst(e.x, e.y, 4, { cols: ['#ff9dbd', '#fff'], s1: 6, sp1: 200 });
    }
  }
  burst(x, y, 18, { cols: ['#ff9dbd', '#fff', '#ffd166'], kind: 'star', s1: 11, sp1: 340 });
  addRing(x, y, 10, r * 1.4, '#ff9dbd', 8);
  shake = Math.min(14, shake + 5);
}
function glowTrail(b) {
  if (Math.random() < 0.4) burst(b.x, b.y, 1, { cols: ['#c9a8e8', '#8fd6ff'], kind: 'dot', s0: 2, s1: 5, sp1: 40, g: 0 });
}
