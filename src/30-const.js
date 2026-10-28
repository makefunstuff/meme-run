/* ============================================================
   1. content: modes, skies, weapons, events, tickers
   ============================================================ */
const R = 21;
const GRAV = 1900, JUMPV = 660, BASE_SPEED = 268;
const CEIL = -232;
const BOSS_EVERY = 1150;

const MODES = {
  classic: { name: 'CLASSIC', speed: 1.00, density: 1.00, dmg: 1, eventEvery: 20, bossEvery: BOSS_EVERY, sky: 0, coin: 1.0 },
  degen:   { name: 'DEGEN',   speed: 1.12, density: 1.30, dmg: 1, eventEvery: 11, bossEvery: BOSS_EVERY * 0.8, sky: 4, coin: 2.0, market: true, mult: 2 },
  chaos:   { name: 'CHAOS',   speed: 1.22, density: 1.75, dmg: 1, eventEvery: 9,  bossEvery: BOSS_EVERY * 0.75, sky: 1, coin: 0.8 },
  ohio:    { name: 'OHIO',    speed: 1.08, density: 1.25, dmg: 1, eventEvery: 6,  bossEvery: BOSS_EVERY * 0.85, sky: 2, grav: 1.2, coin: 0.9 },
  zen:     { name: 'ZEN',     speed: 0.82, density: 0.70, dmg: 0, eventEvery: 26, bossEvery: BOSS_EVERY * 1.6, sky: 3, coin: 1.2 }
};
const SKIES = [
  [['#4aa8e8', 0], ['#8fd0ff', .22], ['#cdeaff', .46], ['#ffe0ee', .66], ['#ffc0da', .84], ['#ffb0cf', 1]],
  [['#7b2d6b', 0], ['#c9366f', .24], ['#ff6f61', .5], ['#ffb36b', .72], ['#ffd166', .88], ['#ffe9a8', 1]],
  [['#1b0f3a', 0], ['#3a1d63', .24], ['#6b2f9c', .46], ['#c9366f', .68], ['#ff5d73', .86], ['#ff9dbd', 1]],
  [['#9fd6e8', 0], ['#cfe9f5', .24], ['#e8f3f0', .48], ['#ffeef5', .7], ['#ffe0ee', .88], ['#fff5fa', 1]],
  [['#05130c', 0], ['#0b2a17', .22], ['#114527', .44], ['#16a34a', .68], ['#7ff0a8', .86], ['#d8ffe6', 1]]
];

const WEAPONS = {
  blaster:  { label: 'BLASTER',  rate: 0.15,  dmg: 1, kind: 'bolt',  ammo: Infinity, speed: 980 },
  bread:    { label: 'BREAD',    rate: 0.34,  dmg: 1, kind: 'bread', ammo: 22, speed: 760, pellets: 4, spread: 0.3 },
  prism:    { label: 'PRISM',    rate: 0.085, dmg: 1, kind: 'laser', ammo: 40, speed: 1400, pierce: true },
  voidgun:  { label: 'VOID',     rate: 0.5,   dmg: 2, kind: 'orb',   ammo: 8, speed: 620, blackhole: true },
  susgun:   { label: 'SUS',      rate: 0.22,  dmg: 2, kind: 'crew',  ammo: 16, speed: 820, homing: true },
  moonshot: { label: 'MOONSHOT', rate: 0.62,  dmg: 4, kind: 'rocket',ammo: 10, speed: 700, lift: true },
  pump:     { label: 'PUMP',     rate: 0.44,  dmg: 3, kind: 'pump',  ammo: 14, speed: 520, grow: true, blast: 90 },
  leverage: { label: 'LEVERAGE', rate: 0.30,  dmg: 5, kind: 'lever', ammo: 12, speed: 1250, kick: true, pierce: true },
  airdrop:  { label: 'AIRDROP',  rate: 0.26,  dmg: 1, kind: 'coin',  ammo: 40, speed: 700, pellets: 5, spread: 0.42, coins: true }
};

const EVENTS = [
  { id: 'moon', label: 'MOON GRAVITY', line: 'Gravity has been nerfed.', tint: 'rgba(150,190,255,0.10)' },
  { id: 'heavy', label: 'HEAVY DAY', line: 'The floor is demanding.', tint: 'rgba(120,60,40,0.12)' },
  { id: 'flip', label: 'GRAVITY FLIP', line: 'Ohio has entered the chat.', tint: 'rgba(190,90,255,0.12)' },
  { id: 'rain', label: 'MEME RAIN', line: 'It is raining NPCs.', tint: 'rgba(255,180,90,0.10)' },
  { id: 'slow', label: 'BULLET TIME', line: 'You are the main character.', tint: 'rgba(90,220,255,0.10)' },
  { id: 'frenzy', label: 'FANUM FRENZY', line: 'Nobody steals your fire rate.', tint: 'rgba(255,90,120,0.12)' },
  { id: 'grass', label: 'TOUCH GRASS', line: 'Everyone must touch grass.', tint: 'rgba(90,220,140,0.13)' },
  { id: 'glitch', label: 'OHIO LEAK', line: 'The renderer is unhappy.', tint: 'rgba(255,0,140,0.10)' },
  /* degen market events */
  { id: 'rug', label: 'RUG PULL', line: 'The liquidity is gone. So is the floor.', tint: 'rgba(255,40,90,0.16)', market: 1 },
  { id: 'crash', label: 'MARKET CRASH', line: 'Everything is going sideways and down.', tint: 'rgba(255,20,60,0.15)', market: 1 },
  { id: 'moonshot', label: 'TO THE MOON', line: 'Send it. Do not look down.', tint: 'rgba(120,255,180,0.12)', market: 1 },
  { id: 'pump', label: 'PUMP & DUMP', line: 'You are the exit liquidity.', tint: 'rgba(255,210,90,0.14)', market: 1 },
  { id: 'airdrop', label: 'AIRDROP', line: 'Free money. Free money. Free money.', tint: 'rgba(255,225,120,0.12)', market: 1 },
  { id: 'whale', label: 'WHALE DUMP', line: 'Someone very large is selling.', tint: 'rgba(70,140,255,0.15)', market: 1 },
  { id: 'bull', label: 'BULL RUN', line: 'Green candles. Invincibility. Vibes.', tint: 'rgba(60,255,140,0.13)', market: 1 }
];
const MARKET_EVENTS = EVENTS.filter(e => e.market);

/* ---------------- fake market tickers ---------------- */
const COINS = [
  ['MOON', 420.6], ['SUS', -69.0], ['PEPE', 88.4], ['SHIB', 12.9], ['WIF', -33.1],
  ['BONK', 250.0], ['OHIO', -99.9], ['RIZZ', 6.9], ['NPC', -0.4], ['GYATT', 71.7],
  ['FANUM', 33.3], ['DOGE', 4.2], ['BRAIN', -12.0], ['CHAD', 100.0], ['RUG', -100.0],
  ['SKIBIDI', 42.0], ['DIAMOND', 9.9], ['rekt', -96.3]
];
function tapeHTML() {
  let s = '';
  for (let k = 0; k < 2; k++) {
    for (const [c, v] of COINS) {
      const d = c === 'MOON' ? pnlMarket : 0;
      const val = clamp(v + d + rnd(-9, 9), -99.9, 4000);
      const cls = val > 4 ? 'up' : val < -4 ? 'dn' : 'mu';
      s += '<i class="' + cls + '">$' + c + ' ' + (val >= 0 ? '+' : '') + val.toFixed(1) + '%</i>';
      s += '<i class="mu">·</i>';
    }
  }
  return s;
}
let pnlMarket = 0;   // moves with events, purely cosmetic

/* ---------------- wall text ---------------- */
const QUIPS = [
  'The algorithm says you are mid.', 'You have been ratio’d.', 'Touch grass. It is cheaper than therapy.',
  'Your aura is depreciating.', 'Capitalism has entered the chat.', 'This is fine.',
  'NFTs are just JPEGs with anxiety.', 'The void has a premium subscription.', 'No cap, that hurt.',
  'Brainrot is a growth industry.', 'You are the NPC now.', 'Doomscroll responsibly.',
  'Someone clip that.', 'Skill issue.', 'L + ratio + no aura.', 'Certified brainrot moment.',
  'Your stop loss was the moon.', 'The whale used you as exit liquidity.', 'Support broke. You broke.',
  'That was not financial advice.', 'Gas fees ate your gains.', 'You are the liquidity now.',
  'Diamond hands, paper portfolio.', 'The chart was a joke.', 'Sir, this is a Wendy’s.',
  'Your bag has been liquidated.', 'Insiders sold into that bounce.', 'You bought the top. Classic.'
];
const DEATHS = [
  'Your brainrot has been fully monetized.', 'The algorithm won. You are an NPC now.',
  'Your aura has been liquidated for parts.', 'Ratio’d into the void at 3am.',
  'The economy ate your last brain cell.', 'That run was a vibe. A bad one.',
  'You have been archived. Unsubscribed from life.',
  'Position closed by the exchange. Fees: everything.', 'The rug was pulled with you on it.',
  'Liquidated at 100x. Skill issue.', 'Your bag is now the community’s bag.'
];
const HIT_LINES = [
  'The economy is a vibe.', 'Your rizz took that personally.', 'Emotionally damaging.',
  'That was unpatched.', 'The void billed you.', 'Your portfolio felt that.', 'Down bad.'
];
