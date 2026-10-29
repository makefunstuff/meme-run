/* ============================================================
   7. HUD (DOM), flow, audio, input
   ============================================================ */
const $ = id => document.getElementById(id);

function updateWpnHud() {
  const w = WEAPONS[wpn] || WEAPONS.blaster;
  const s = w.label + (ammo === Infinity ? '' : ' ×' + ammo);
  if (s !== hudWpn) { $('wpn').textContent = s; hudWpn = s; }
}
function updateHearts() {
  const el = $('hearts');
  const total = Math.max(3, brains);
  let s = '';
  for (let i = 0; i < total; i++) s += '<i class="' + (i < brains ? '' : 'off') + '"></i>';
  el.innerHTML = s;
  hudBrains = brains;
}
function hud() {
  if (pnl !== hudScore) {
    $('score').textContent = money(pnl);
    const chip = $('plChip');
    const up = pnl >= hudScore;
    chip.classList.toggle('up', up);
    chip.classList.toggle('down', !up);
    /* the arrow says which way the number just moved, and ticks once */
    const d = $('plDelta');
    if (d) {
      d.textContent = up ? '▲' : '▼';
      d.className = 'delta ' + (up ? 'up' : 'dn');
      d.classList.remove('flash');
      void d.offsetWidth;
      d.classList.add('flash');
    }
    hudScore = pnl;
  }
  const d = Math.floor(dist);
  if (d !== hudDist) { $('dist').textContent = d; hudDist = d; }
  if (bag !== hudBag) { $('bag').textContent = bag; hudBag = bag; }
  if (brains !== hudBrains) updateHearts();
  const lv = $('lever');
  lv.classList.toggle('on', leverT > 0);
  if (leverT > 0) lv.textContent = '×2 P&L · ' + Math.ceil(leverT) + 's';
}

/* ---------------- DOM overlays ---------------- */
function syncBanner() {
  const el = $('banner');
  if (banner) {
    $('bannerT').textContent = banner.text;
    $('bannerL').textContent = banner.line;
    el.classList.add('on');
  } else el.classList.remove('on');
}
function syncToast() {
  const el = $('toast');
  if (performance.now() < toastUntil) { el.textContent = toastMsg; el.classList.add('on'); }
  else el.classList.remove('on');
}
function syncBossBar() {
  const el = $('bossbar');
  if (boss) {
    $('bossName').textContent = boss.kind === 1 ? 'THE WHALE' : 'THE ALGORITHM';
    $('bossfill').style.width = (clamp(boss.hp / boss.maxHp, 0, 1) * 100).toFixed(1) + '%';
    el.classList.add('on');
  } else el.classList.remove('on');
}
let tapeT = 0;
function syncTape(dt) {
  tapeT -= dt;
  if (tapeT <= 0) { tapeT = 5; $('tape').innerHTML = tapeHTML(); }
}

/* ---------------- flow ---------------- */
function loadBest() {
  try { return parseInt(localStorage.getItem('memerun.best') || '0', 10) || 0; } catch (e) { return 0; }
}
function saveBest(v) {
  try { localStorage.setItem('memerun.best', String(v)); } catch (e) { /* private mode */ }
}
function showBest() {
  const el = $('best');
  if (el) el.innerHTML = 'ALL-TIME HIGH <b>$' + best.toLocaleString() + '</b>';
}

const TAG = {
  classic: 'CLASSIC RUN · NOT FINANCIAL ADVICE',
  degen: 'DEGEN RUN · THE MARKET IS OPEN',
  chaos: 'CHAOS RUN · SEND IT',
  ohio: 'OHIO RUN · PHYSICS IS A LIE',
  zen: 'ZEN RUN · NO THOUGHTS'
};
const MODE_DESC = {
  classic: 'Classic. The standard doomscroll.',
  degen: 'Degen. The market is open, the memes are leveraged and everything is a coin.',
  chaos: 'Chaos. Everything is too much, including this.',
  ohio: 'Ohio. Physics is a suggestion here.',
  zen: 'Zen. No thoughts, no death, no score recorded.'
};

function startGame() {
  initAudio();
  resetWorld();
  state = 'play';
  pnl = 0; pnlPeak = 0; bag = 0; shield = 0; leverT = 0; pnlMarket = 0;
  banner = { text: MODES[mode].name + ' MODE', line: pick(['open the position', 'no thoughts', 'certified brainrot', 'the algorithm is watching', 'buy the dip', 'touch grass later']), t: 2 };
  $('menu').classList.add('hidden');
  $('over').classList.add('hidden');
  $('pad').classList.add('on');
  $('combo').classList.remove('on');
  $('newRecord').style.display = 'none';
  $('tagline').textContent = TAG[mode] || TAG.classic;
  $('score').textContent = '$0'; hudScore = 0;
  toast(mode === 'zen' ? 'Zen mode. The void cannot hurt you today. Neither can the market.'
    : mode === 'degen' ? 'Degen mode. P&L is doubled. So is the pain.' : 'Doomscroll responsibly.');
}
function showOver() {
  state = 'over';
  const record = mode !== 'zen' && pnl > best;
  if (record) { best = pnl; saveBest(best); }
  const win = pnlPeak > 0 && pnl > pnlPeak * 0.75;
  $('overTitle').innerHTML = win ? 'WAGMI<span> BAG</span>' : mode === 'zen' ? 'NO<span> THOUGHTS</span>' : 'GET<span>REKT</span>';
  $('overBadge').textContent = win ? 'bag secured' : mode === 'zen' ? 'achieved nothing, peacefully' : 'position liquidated';
  const fs = $('finalScore');
  fs.textContent = money(pnl);
  fs.classList.toggle('dn', pnl < pnlPeak * 0.75 && mode !== 'zen');
  $('rDist').textContent = Math.floor(dist);
  $('rKills').textContent = kills;
  $('rCombo').textContent = bestCombo;
  $('rBag').textContent = bag;
  $('deathMsg').textContent = mode === 'zen' ? 'You achieved nothing, peacefully.' : pick(DEATHS);
  $('newRecord').style.display = record ? 'block' : 'none';
  showBest();
  $('over').classList.remove('hidden');
  $('pad').classList.remove('on');
  tone(180, 0.3, 'sawtooth', 0.05);
}

/* ---------------- audio ---------------- */
let AC = null;
function initAudio() {
  if (AC) return;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (Ctor) { try { AC = new Ctor(); } catch (e) { AC = null; } }
}
function tone(freq, dur, type, vol, delay) {
  if (!AC) return;
  if (AC.state === 'suspended') AC.resume();
  const t0 = AC.currentTime + (delay || 0);
  const o = AC.createOscillator(), gn = AC.createGain();
  o.type = type || 'sine';
  o.frequency.setValueAtTime(freq, t0);
  gn.gain.setValueAtTime(vol || 0.04, t0);
  gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(gn); gn.connect(AC.destination);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

/* ---------------- input ---------------- */
const jumpBtn = $('jumpBtn');
const shootBtn = $('shootBtn');
function doJump() {
  if (state === 'play') jumpBuf = 0.14;
  else if (state === 'menu') startGame();
  else if (state === 'over') startGame();
}
function setJumpVisual(on) { jumpBtn.classList.toggle('down', on); }
function setShootVisual(on) { shootBtn.classList.toggle('down', on); }

jumpBtn.addEventListener('pointerdown', e => { e.preventDefault(); jumpBtn.setPointerCapture(e.pointerId); setJumpVisual(true); doJump(); });
jumpBtn.addEventListener('pointerup', () => setJumpVisual(false));
jumpBtn.addEventListener('pointercancel', () => setJumpVisual(false));
shootBtn.addEventListener('pointerdown', e => {
  e.preventDefault(); shootBtn.setPointerCapture(e.pointerId);
  initAudio(); setShootVisual(true); shootHeld = true; shootCd = 0;
});
const relShoot = () => { setShootVisual(false); shootHeld = false; };
shootBtn.addEventListener('pointerup', relShoot);
shootBtn.addEventListener('pointercancel', relShoot);
shootBtn.addEventListener('lostpointercapture', relShoot);

cv.addEventListener('pointerdown', e => {
  e.preventDefault();
  initAudio();
  if (state !== 'play') return;
  if (e.pointerType === 'touch' && e.clientX > W * 0.55) {
    shootHeld = true; shootCd = 0; setShootVisual(true);
    cv._shootId = e.pointerId;
  } else {
    doJump();
  }
});
cv.addEventListener('pointerup', e => { if (cv._shootId === e.pointerId) { cv._shootId = null; relShoot(); } });
cv.addEventListener('pointercancel', e => { if (cv._shootId === e.pointerId) { cv._shootId = null; relShoot(); } });

window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === ' ' || k === 'arrowup' || k === 'w') {
    e.preventDefault();
    if (state === 'play') jumpBuf = 0.14;
    else if (state === 'menu' || state === 'over') startGame();
  } else if (k === 'enter') {
    if (state !== 'play') startGame();
  } else if (k === 'f' || k === 'j') {
    initAudio();
    if (!shootHeld) { shootHeld = true; shootCd = 0; setShootVisual(true); }
  } else if (k === 'v') {
    $('fps').classList.toggle('on');
  } else if (k === 'q') {
    qualityPref = qualityPref === 'auto' ? 'high' : qualityPref === 'high' ? 'low' : 'auto';
    applyQuality(qualityPref === 'auto' ? 'high' : qualityPref);
    toast('GPU quality: ' + qualityPref.toUpperCase() + '.');
  }
});
window.addEventListener('keyup', e => {
  const k = e.key.toLowerCase();
  if (k === 'f' || k === 'j') { shootHeld = false; setShootVisual(false); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) { shootHeld = false; setShootVisual(false); } });
$('playBtn').addEventListener('click', startGame);
$('againBtn').addEventListener('click', startGame);
document.querySelectorAll('#modes button').forEach(btn => {
  btn.addEventListener('click', () => {
    initAudio();
    document.querySelectorAll('#modes button').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    mode = btn.dataset.mode;
    tone(360, 0.06, 'triangle', 0.03);
    toast(MODE_DESC[mode]);
    $('tagline').textContent = TAG[mode] || TAG.classic;
  });
});
document.querySelectorAll('#qual button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#qual button').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    qualityPref = btn.dataset.q;
    applyQuality(qualityPref === 'auto' ? 'high' : qualityPref);
    toast('Rendering at ' + (qualityPref === 'auto' ? 'auto' : qualityPref.toUpperCase()) + '. GPU will do what it can.');
  });
});
best = loadBest();
showBest();
