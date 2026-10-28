/* ============================================================
   5. spawning — patterns, meme pools, obstacle types
   ============================================================ */
const BLOCKTYPES = {
  spike: { w: 52, h: 44 }, saw: { w: 52, h: 52 }, cone: { w: 64, h: 48 },
  monitor: { w: 60, h: 52 }, nft: { w: 50, h: 56 },
  rug: { w: 76, h: 44 }, candle: { w: 40, h: 62 }, engine: { w: 70, h: 54 }, atm: { w: 56, h: 58 }
};
const CLASSIC_BLOCKS = ['spike', 'saw', 'cone', 'monitor', 'nft'];
const DEGEN_BLOCKS = ['rug', 'candle', 'engine', 'atm', 'saw', 'spike'];

function addEnemy(x, m, yOff, fly) {
  enemies.push({
    x, y: -26 - (yOff || 0), r: m.r, m, ph: rnd(TAU), hit: 0, spawn: 1, fly: !!fly,
    baseY: -26 - (yOff || 0), vx: fly ? rnd(-30, -10) : 0, hp: m.hp || 1
  });
}
function addFallingEnemy(x, m) {
  const baseY = -26 - Math.random() * 46;
  enemies.push({
    x, y: -460, r: m.r, m, ph: rnd(TAU), hit: 0, spawn: 0, fly: false,
    baseY, vx: 0, fall: true, vy: 0, hp: m.hp || 1
  });
}
function addBlock(x, kind) {
  const T = BLOCKTYPES[kind] || BLOCKTYPES.spike;
  blocks.push({ x, w: T.w, h: T.h, kind });
}
function addPickup(x, y, kind, wpnKind) {
  pickups.push({ x, y, kind, wpn: wpnKind, ph: rnd(TAU) });
}
const BOT_MEME = MEMES.find(m => m.tag === 'bot');
function memePool() {
  if (mode === 'degen') return MEMES;                 // degen pool is the whole feed
  return MEMES.filter(m => !m.degen || Math.random() < 0.25);
}
function pickMeme() {
  const p = memePool();
  if (mode === 'degen' && Math.random() < 0.55) return pick(DEGEN_MEMES);
  return pick(p);
}
function blockPool() { return mode === 'degen' ? DEGEN_BLOCKS : CLASSIC_BLOCKS; }

function ensureSpawns() {
  if (boss) { nextX = Math.max(nextX, player.x + 900); return; }
  const M = MODES[mode];
  const lim = camX + W / SC + 420;
  while (nextX < lim) {
    const d = clamp((player.x - 900) / 9000, 0, 1);   // difficulty
    const roll = Math.random();
    const deg = M.market;
    let w;
    if (roll < 0.09) w = patCalm(nextX);
    else if (roll < 0.22) w = patRow(nextX, d);
    else if (roll < 0.33) w = patArc(nextX, d);
    else if (roll < 0.44) w = patStack(nextX, d);
    else if (roll < 0.53) w = patSaws(nextX, d);
    else if (roll < 0.60) w = patGem(nextX, d);
    else if (roll < 0.68) w = patFort(nextX, d);
    else if (roll < 0.74) w = patHeart(nextX, d);
    else if (roll < 0.80) w = patCrate(nextX, d);
    else if (roll < 0.85) w = patBots(nextX, d);
    else if (roll < 0.89) w = patBag(nextX, d);
    else if (roll < 0.92) w = patVault(nextX, d);
    else if (roll < 0.95 && deg) w = patCave(nextX, d);
    else if (roll < 0.975 && deg) w = patRugRun(nextX, d);
    else if (roll < 0.99) w = patChoir(nextX, d);
    else w = patWhale(nextX, d);
    const dense = (ev && (ev.id === 'frenzy' || ev.id === 'rain' || ev.id === 'crash' || ev.id === 'rug')) ? 1.7 : 1;
    nextX += (w + rnd(120, 260 - d * 90)) / (M.density * dense);
  }
}
function patCalm(x) {
  const n = rint(3, 5);
  const coin = MODES[mode].coin;
  for (let i = 0; i < n; i++) addPickup(x + i * 42, -50 - Math.sin((i / (n - 1)) * Math.PI) * 40, 'aura');
  if (coin > 1.5 && Math.random() < 0.5) addPickup(x + n * 21, -110, 'bag');
  return n * 42 + 60;
}
function patRow(x, d) {
  const n = rint(2, 3);
  for (let i = 0; i < n; i++) addEnemy(x + i * 58, pickMeme(), 0, Math.random() < 0.25 * d);
  return n * 58 + 40;
}
function patArc(x, d) {
  addBlock(x + 30, pick(blockPool()));
  for (let i = 0; i < 5; i++) addPickup(x + i * 34, -46 - Math.sin((i / 4) * Math.PI) * 76, 'aura');
  return 150;
}
function patStack(x, d) {
  addEnemy(x, pickMeme(), 0, false);
  addEnemy(x + 70, pickMeme(), 90 + d * 40, true);
  addPickup(x + 34, -120, 'aura');
  return 170;
}
function patSaws(x, d) {
  addBlock(x, 'saw');
  addEnemy(x + 110, pickMeme(), 0, false);
  addPickup(x + 23, -100, 'aura');
  return 190;
}
function patGem(x, d) {
  addPickup(x + 40, -160 - d * 30, 'gem');
  addEnemy(x + 10, pickMeme(), 0, false);
  addEnemy(x + 96, pickMeme(), 0, false);
  return 170;
}
function patFort(x, d) {
  addBlock(x, 'monitor');
  addBlock(x + 78, 'nft');
  addEnemy(x + 150, pickMeme(), 0, false);
  addPickup(x + 60, -140, 'aura');
  return 230;
}
function patHeart(x, d) {
  addBlock(x + 20, 'spike');
  addPickup(x + 55, -120, 'heart');
  addEnemy(x + 140, pickMeme(), 60, true);
  return 210;
}
function patChoir(x, d) {
  const n = rint(3, 4);
  const m = pickMeme();
  for (let i = 0; i < n; i++) addEnemy(x + i * 46, m, Math.sin(i) * 20, false);
  addPickup(x + n * 24, -150, 'aura');
  return n * 46 + 60;
}
function patCrate(x, d) {
  addPickup(x + 46, -78, 'weapon', pick(['bread', 'prism', 'voidgun', 'susgun', 'moonshot', 'pump', 'leverage', 'airdrop']));
  addEnemy(x - 6, pickMeme(), 0, false);
  addEnemy(x + 104, pickMeme(), 46, true);
  return 220;
}
function patBots(x, d) {
  addEnemy(x, BOT_MEME, 96, true);
  addEnemy(x + 130, BOT_MEME, 128, true);
  addPickup(x + 64, -46, 'aura');
  addPickup(x + 100, -46, 'aura');
  return 250;
}
/* degen patterns */
function patBag(x, d) {                       // a coin streak, sometimes with a guard
  const n = rint(4, 7);
  for (let i = 0; i < n; i++) addPickup(x + i * 38, -44 - Math.sin((i / n) * Math.PI) * 60, 'aura');
  addPickup(x + n * 19, -140, Math.random() < 0.18 ? 'lever' : 'bag');
  if (Math.random() < 0.6) addEnemy(x + n * 19, pick(DEGEN_MEMES), 60, true);
  return n * 38 + 70;
}
function patVault(x, d) {                     // diamond hands guarded by tanky memes
  addPickup(x + 60, -150, 'diamond');
  const tanky = MEMES.filter(m => (m.hp || 1) > 1);
  addEnemy(x, tanky.length ? pick(tanky) : pickMeme(), 0, false);
  addEnemy(x + 120, pickMeme(), 40, true);
  addBlock(x + 44, 'atm');
  if (Math.random() < 0.4) addPickup(x + 100, -170, 'advisory');
  return 230;
}
function patCave(x, d) {                      // candles falling on you
  addBlock(x, 'candle');
  for (let i = 0; i < 3; i++) addFallingEnemy(x + 90 + i * 60, MEMES.find(m => m.tag === 'candle'));
  addPickup(x + 30, -110, 'aura');
  return 240;
}
function patRugRun(x, d) {                    // rug + printer, the classic scam
  addBlock(x + 10, 'rug');
  addEnemy(x + 120, MEMES.find(m => m.tag === 'printer'), 40, true);
  addPickup(x + 40, -60, 'aura');
  addPickup(x + 74, -60, 'aura');
  addPickup(x + 108, -100, 'bag');
  return 240;
}
function patWhale(x, d) {
  addEnemy(x + 40, MEMES.find(m => m.tag === 'whale'), 70, true);
  addPickup(x + 30, -50, 'bag');
  addEnemy(x + 170, pickMeme(), 0, false);
  return 260;
}
