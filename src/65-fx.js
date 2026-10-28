/* ============================================================
   6b. death sequence + particle integration
   ============================================================ */
function stepDeath(dt) {
  deathT += dt;
  const sdt = dt * 0.35;
  player.vy += GRAV * sdt;
  player.y += player.vy * sdt;
  player.x += 70 * sdt;
  deathSpin += sdt * 14;
  if (player.y > -R) { player.y = -R; player.vy *= -0.42; }
  camX = player.x - W * 0.30 / SC;
  if (deathT < 0.7 && Math.random() < 0.6) {
    burst(player.x + rnd(-14, 14), player.y + rnd(-14, 14), 1, { cols: ['#ff5d73', '#ff9dbd', '#ffd166'], kind: 'heart', s0: 4, s1: 9, sp1: 130, g: 120, up: 90 });
  }
  updateFx(sdt);
  if (deathT > 0.95) showOver();
}

function updateFx(dt) {
  const cap = QUAL.parts;
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life += dt;
    if (p.life >= p.max) { parts.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.vx *= 0.99; p.rot += p.vr * dt;
    if (p.y > 0 && p.g > 0) { p.y = 0; p.vy *= -0.34; p.vx *= 0.6; }
  }
  if (parts.length > cap) parts.splice(0, parts.length - cap);
  for (let i = texts.length - 1; i >= 0; i--) {
    const f = texts[i];
    f.life += dt; f.y += f.vy * dt; f.vy *= 0.94;
    if (f.life >= 0.9) texts.splice(i, 1);
  }
  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i];
    r.life += dt;
    if (r.life >= 0.45) rings.splice(i, 1);
  }
  shake *= Math.pow(0.0015, dt);
  if (shake < 0.05) shake = 0;
  hurtFx = Math.max(0, hurtFx - dt * 1.8);
}
