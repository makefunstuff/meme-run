/* =========================================================================
   14-cast.js — the whole cast as primitive kits.
   Local space: x right, y up, z toward the camera. Sizes are world units, the
   same box the baked sprites used (~80x86 for a meme). Order matters: parts
   listed first are painted first, so put the body down before the face.
   Art direction: one silhouette idea per character, readable at 40px; faces
   share the eyePair/mouth helpers so the cast looks like one toy line, not a
   pile of shapes. Face features use `ink: 0` (no outline) to stay crisp.
   ========================================================================= */

const SKIN = '#f2cda6', SKIN2 = '#e0b088', DARK = '#22131f', WHITE6 = '#f7f9ff', GREY = '#93a6c0';
const CREAM = '#fdfaf4', SHDW = '#7d8aa0', STEEL = '#c6cede', STEEL2 = '#8e9bb0';

/* ---- shared face furniture ---------------------------------- */
/* r = eye radius; dx = distance of each eye from x. Everything after the
   whites is pupil then a single glint, the same three beats for every face. */
function eyePair(x, y, z, r, o) {
  o = o || {};
  const dx = o.dx === undefined ? r * 1.6 : o.dx;
  const p = o.pupilC || DARK, w = o.white || CREAM, look = o.look || 0.28;
  const ps = o.ps === undefined ? 0.56 : o.ps;
  const out = [];
  for (const s of [-1, 1]) {
    const ex = x + s * dx;
    out.push(S(ex, y, z, r * 2, w, { ink: 0.8, k: 1.05 }));
    out.push(S(ex + look * r, y - r * 0.08, z + r * 1.3, r * 2 * ps, p, { ink: 0 }));
    out.push(S(ex - r * 0.34, y + r * 0.46, z + r * 1.85, r * 0.9, '#ffffff', { ink: 0, k: 1.6 }));
  }
  return out;
}
const oneEye = (x, y, z, r, o) => {
  o = o || {};
  return [
    S(x, y, z, r * 2, o.white || CREAM, { ink: 0.9, k: 1.05 }),
    S(x + r * 0.3, y, z + r * 1.4, r * 1.1, o.pupilC || DARK, { ink: 0 }),
    S(x - r * 0.4, y + r * 0.5, z + r * 1.9, r * 0.8, '#ffffff', { ink: 0, k: 1.6 })
  ];
};
const mouth = (x, y, z, w, h, c, o) => E(x, y, z, w, h, c || '#8a3a52', Object.assign({ ink: 0.6 }, o || {}));
const blush = (x, y, z, s, c) => [
  E(x - s * 1.9, y, z, s * 2.2, s, c || '#ff9dbd', { ink: 0, k: 0.98 }),
  E(x + s * 1.9, y, z, s * 2.2, s, c || '#ff9dbd', { ink: 0, k: 0.98 })
];
/* stubby feet so every ground unit sits in the world */
const feet = (y, dx, w, c) => [
  B(-dx, y, 3, w, w * 0.62, w * 1.15, c), B(dx, y, 3, w, w * 0.62, w * 1.15, c)
];
const ears = (y, dx, r, h, c) => [CN(-dx, y, 1, r, h, c, { rz: 0.26 }), CN(dx, y, 1, r, h, c, { rz: -0.26 })];

function castMemes() {
  const out = {};

  /* --- the feed ------------------------------------------------ */
  const crew = (c, c2) => [
    B(-17, -4, -14, 15, 26, 16, c2),                        // oxygen tank
    CP(-10, -34, 2, 13, 13, c), CP(10, -34, 2, 13, 13, c),   // legs
    CP(0, -2, 0, 44, 34, c),                                 // body, one pill
    BX(7, 6, 15, 30, 18, 12, '#bfe9ff', { k: 1.06 }),        // visor
    BX(10, 8, 21, 12, 6, 4, '#ffffff', { ink: 0, k: 1.3 })   // visor glint
  ];
  out.m_sus0 = crew('#e2544f', '#a53b39');
  out.m_sus1 = crew('#3f8fd6', '#2b6ba8');
  out.m_sus2 = crew('#4fc38a', '#329464');

  out.m_npc = [
    B(0, 22, 0, 34, 34, 26, GREY),                  // the face of the void
    ...feet(-17, 11, 13, '#6d7f98'),
    B(-10, 27, 15, 8, 6, 5, DARK, { ink: 0 }), B(10, 27, 15, 8, 6, 5, DARK, { ink: 0 }),
    B(0, 17, 15, 14, 3.4, 5, DARK, { ink: 0 }),      // the flat line
    B(0, 0, 0, 30, 22, 22, '#7f92aa'),               // body
    B(-9, -14, 14, 12, 3, 4, '#5c6d84', { ink: 0 }), B(9, -14, 14, 12, 3, 4, '#5c6d84', { ink: 0 })
  ];

  out.m_toilet = [
    B(0, -28, -4, 38, 18, 26, '#dfe7f2'),            // pedestal
    CY(0, -12, 0, 27, 15, '#eef3fa'),                // bowl
    B(0, 2, -12, 44, 24, 24, '#e6ecf5'),             // the tank, behind
    S(0, 20, 4, 31, SKIN),                           // the head, out of the bowl
    B(0, 33, 2, 30, 10, 24, '#3b2a34', { rz: 0.06 }),// the hair
    ...eyePair(0, 22, 16, 5.4, { dx: 9, look: 0.42 }),
    mouth(0, 9, 18, 22, 11, '#7a2f3c')
  ];

  const doge = (c, snout) => [
    ...ears(22, 19, 10, 20, c),
    B(0, 4, 0, 46, 42, 34, c),
    B(13, -12, 16, 24, 17, 18, snout),
    ...eyePair(0, 12, 17, 5.2, { dx: 11, look: 0.34 }),
    S(22, -4, 22, 9, '#3b2530', { ink: 0.7 }),
    mouth(14, -20, 20, 18, 6, '#7a3540'),
    ...blush(-2, 2, 18, 4.4)
  ];
  out.m_doge = doge('#eaa94b', '#f8dfae');
  out.m_shib = doge('#d99a55', '#f6e3c0');

  out.m_bonk = [
    ...doge('#eaa94b', '#f8dfae'),
    BX(24, 20, -8, 13, 46, 13, '#c08a4a', { rz: 0.5 }),
    BX(34, 42, -8, 20, 15, 15, '#8f5a2c', { rz: 0.5 })
  ];

  out.m_wif = [
    ...ears(14, 18, 9, 14, '#f4f6fa'),
    B(0, 2, 0, 46, 42, 34, '#f4f6fa'),
    B(13, -14, 16, 24, 17, 18, '#e6ebf3'),
    CY(0, 27, 0, 18, 8, '#e05a52'),                  // the beanie, worn not swallowed
    CY(0, 20, 0, 22, 5, '#c94b45'),
    S(0, 34, 0, 8, '#e05a52'),
    ...eyePair(0, 10, 17, 5.2, { dx: 11, look: 0.3 }),
    S(22, -6, 22, 9, '#3b2530', { ink: 0.7 }),
    mouth(14, -22, 20, 18, 6, '#7a3540')
  ];

  out.m_pepe = [
    B(0, 2, 0, 48, 44, 32, '#5ec95f'),
    B(-10, -30, 0, 13, 16, 13, '#4aa84e'), B(10, -30, 0, 13, 16, 13, '#4aa84e'),
    E(0, -14, 16, 36, 15, '#d1605c', { ink: 1.4 }),   // the lips
    E(0, -12, 20, 26, 8, '#a8424a', { ink: 0 }),
    S(-13, 20, 14, 16, '#7ddb7e', { ink: 0.9 }), S(13, 20, 14, 16, '#7ddb7e', { ink: 0.9 }),
    ...eyePair(0, 21, 21, 5.2, { dx: 13, look: 0.36 }),
    S(-5, 4, 24, 3.6, '#2f6e33', { ink: 0 }), S(5, 4, 24, 3.6, '#2f6e33', { ink: 0 })
  ];

  out.m_brain = [
    BA(0, 2, 0, 50, '#ff92b6'),
    BA(-15, 22, 6, 20, '#ff7fa8'), BA(3, 28, 4, 20, '#ffa8c6'), BA(17, 20, 8, 18, '#ff7fa8'),
    BA(-4, -18, 8, 18, '#ffadc8'),
    E(-16, 4, 6, 14, 26, '#d96a92', { ink: 0 }),       // the folds
    E(14, 8, 6, 12, 22, '#d96a92', { ink: 0 }),
    ...eyePair(0, 0, 20, 5.6, { dx: 10, look: 0.4 }),
    mouth(0, -16, 22, 20, 8, '#8a2f4c')
  ];

  out.m_crown = [
    B(0, -6, 0, 42, 40, 30, SKIN),
    ...feet(-30, 11, 13, '#c98a5c'),
    OC(0, 22, 0, 26, 13, '#ffd166'),
    CN(-17, 33, 0, 8, 18, '#ffd166'), CN(0, 35, 0, 8, 22, '#ffd166'), CN(17, 33, 0, 8, 18, '#ffd166'),
    S(0, 24, 18, 9, '#ff5d73', { ink: 0.8, k: 1.1 }),
    ...eyePair(0, 0, 17, 5.2, { dx: 11, look: 0.3 }),
    mouth(0, -18, 18, 16, 6, '#8a4a58'),
    ...blush(0, -8, 18, 4.4)
  ];

  out.m_ohio = [
    OC(0, 0, 0, 36, 20, '#3b2252', { rx: UP }),
    RG(0, 0, 0, 34, '#ff2e88', { rx: UP, k: 1.15 }),
    OC(0, 0, 0, 22, 24, '#1b0f2a', { rx: UP, k: 0.8 }),
    ...eyePair(0, 2, 12, 5.4, { dx: 9, look: 0.5, pupilC: '#ffe27a', white: '#ffe27a' }),
    B(-22, -24, 4, 11, 24, 11, '#6b3d7a', { rz: 0.5 }), B(22, -24, 4, 11, 24, 11, '#6b3d7a', { rz: -0.5 }),
    CN(0, 30, 0, 8, 16, '#ff2e88', { k: 1.2 })
  ];

  out.m_grass = [
    BA(0, -10, 0, 52, '#4f9e5c'),
    PR(-16, 12, 0, 9, 24, '#7fd48a'), PR(-4, 18, 4, 9, 30, '#8fe3a0'),
    PR(9, 14, -4, 9, 26, '#7fd48a'), PR(20, 8, 2, 8, 20, '#6fc07a'),
    ...eyePair(0, -8, 18, 5.2, { dx: 10, look: 0.42 }),
    mouth(0, -22, 20, 16, 6, '#2f6e33'),
    ...blush(0, -16, 19, 4.6, '#c9f5b8')
  ];

  out.m_ratio = [
    B(0, 10, 0, 56, 44, 26, WHITE6),
    PR(0, -18, 0, 14, 18, WHITE6, { rx: Math.PI }),        // the arrow tail
    BX(-13, 16, 15, 10, 22, 7, DARK, { ink: 0.5 }),        // the eyes of contempt
    BX(3, 16, 15, 10, 22, 7, DARK, { ink: 0.5 }),
    PR(21, 12, 14, 9, 18, '#ff5d73', { rx: Math.PI, k: 1.1 }),
    E(0, -4, 16, 22, 5, '#c9cede', { ink: 0 })
  ];

  out.m_fries = [
    B(-11, 28, 0, 8, 34, 13, '#f6e7a8'), B(-4, 32, 4, 8, 38, 13, '#f6e7a8'),
    B(4, 32, -4, 8, 40, 13, '#f6e7a8'), B(11, 28, 2, 8, 34, 13, '#f6e7a8'),
    PR(0, -2, 0, 28, 42, '#ff5d73', { rx: Math.PI }),      // the carton
    B(0, 10, 18, 32, 9, 8, '#c23f3c', { ink: 0.8 }),
    ...eyePair(0, 2, 20, 5.2, { dx: 9, look: 0.4 }),
    mouth(0, -12, 22, 16, 6, '#8a2f3c')
  ];

  out.m_coat = [
    CP(0, -8, 0, 42, 30, '#3d3d4f'),                       // the trench
    B(-19, -22, 4, 12, 26, 14, '#2a2a38'), B(19, -22, 4, 12, 26, 14, '#2a2a38'),
    ...feet(-36, 12, 13, '#241f2c'),
    S(0, 22, 0, 34, SKIN),
    B(0, 36, 0, 38, 13, 26, '#2f2a22'),                     // the hair
    BX(-8, 24, 15, 12, 9, 7, '#151020', { ink: 0.5, k: 1.5 }),
    BX(8, 24, 15, 12, 9, 7, '#151020', { ink: 0.5, k: 1.5 }),
    B(0, 24, 16, 6, 3, 5, '#151020', { ink: 0 }),
    S(-4, 26, 19, 3.4, '#8fd6ff', { ink: 0, k: 1.5 }),      // the glint of never giving up
    mouth(0, 10, 17, 14, 5, '#8a4a58')
  ];

  out.m_jaw = [
    B(0, 14, 0, 44, 40, 30, SKIN),
    B(0, -14, 12, 36, 22, 26, SKIN2),                        // the jaw
    B(0, -22, 22, 24, 6, 8, '#8a4a58', { ink: 0.7 }),
    BX(-14, 22, 17, 12, 5, 6, '#3b2a34', { ink: 0 }),        // the brow
    BX(14, 22, 17, 12, 5, 6, '#3b2a34', { ink: 0 }),
    ...eyePair(0, 16, 18, 4.6, { dx: 12, look: 0.2 })
  ];

  out.m_mega = [
    B(-14, 0, 0, 26, 26, 26, STEEL),
    CN(14, 0, 0, 28, 36, '#ff8a4c', { rz: -UP, k: 1.06 }),
    CN(34, 0, 0, 15, 8, '#c9541f', { rz: -UP, k: 0.9 }),
    B(-8, -26, 0, 13, 22, 15, STEEL2),
    RG(30, 0, 0, 13, '#ffe27a', { k: 1.1 }),
    ...oneEye(-16, 8, 15, 5.4, { look: 0 })
  ];

  out.m_fine = [
    /* the house is on fire behind him and he is unbothered */
    CN(-19, -22, -6, 11, 30, '#ff9040', { k: 1.2 }), CN(0, -30, -8, 10, 36, '#ffd166', { k: 1.2 }),
    CN(19, -22, -6, 10, 28, '#ff5d73', { k: 1.1 }),
    ...ears(20, 17, 9, 16, '#c98a55'),
    B(0, -2, 0, 42, 40, 30, '#d9a06a'),
    B(12, -14, 16, 22, 15, 17, '#eab07f'),
    RG(26, -2, 6, 11, '#b5773a', { ry: UP }),               // the mug, in the flames
    ...eyePair(0, 6, 18, 4.8, { dx: 10, look: 0.12 }),
    mouth(13, -22, 20, 16, 5, '#7a3540'),
    S(22, -8, 22, 8, '#3b2530', { ink: 0.7 })
  ];

  out.m_bird = [
    PR(0, -12, 0, 26, 34, '#efe8d6', { rx: Math.PI }),        // the body
    S(0, 14, 6, 34, '#a97c50'),
    PR(17, 12, 14, 10, 14, '#ffb648', { rz: -UP }),           // birb
    PR(-4, 36, 0, 8, 16, '#f6f2e6'),
    ...eyePair(0, 18, 19, 4.8, { dx: 9, look: 0.42 }),
    B(-14, -22, 6, 8, 14, 8, '#8a6a45'), B(10, -22, 6, 8, 14, 8, '#8a6a45')
  ];

  out.m_chad = [
    B(0, -22, 0, 54, 32, 28, '#3f4257'),                      // the blazer
    B(0, 12, 0, 44, 46, 30, '#e6e0f0'),
    B(0, -8, 10, 38, 20, 26, '#dcd4e8'),                       // the chin
    B(0, 34, 0, 46, 13, 28, '#3f3a4a'),                        // the hair
    BX(-12, 20, 18, 12, 6, 6, DARK, { ink: 0 }), BX(12, 20, 18, 12, 6, 6, DARK, { ink: 0 }),
    B(0, 2, 20, 16, 4, 5, '#b8aecc', { ink: 0 })
  ];

  out.m_bot = [
    B(0, -6, 0, 44, 46, 28, '#33213d'),
    BX(0, 2, 15, 32, 26, 8, '#120c1a', { ink: 0.5, k: 1.2 }),  // the screen
    PR(0, 4, 21, 11, 15, '#ff5d73', { rx: Math.PI, k: 1.2 }),  // the notification
    CY(0, 32, 0, 5, 20, STEEL2), S(0, 46, 0, 12, '#ff5d73', { k: 1.1 }),
    ...feet(-32, 13, 14, '#241a2c')
  ];

  /* --- degen content ------------------------------------------ */
  out.m_whale = [
    E(0, 2, 0, 66, 44, '#5b8fd6'),
    E(-30, 8, 0, 24, 28, '#4c7fc4'),
    B(36, 4, 0, 24, 13, 18, '#4c7fc4', { rz: 0.5 }), B(36, -6, 0, 24, 13, 18, '#4c7fc4', { rz: -0.5 }),
    CN(-40, 26, 0, 8, 20, '#8fd6ff'), CN(-30, 30, 4, 7, 16, '#8fd6ff'),
    ...oneEye(-22, 10, 18, 6.6, { look: 0.4 }),
    E(-44, 4, 8, 18, 6, '#3f6fae', { ink: 0.6 })
  ];

  out.m_rocket = [
    CY(0, -4, 0, 17, 42, '#eef2f8'),
    CN(0, 28, 0, 17, 24, '#ff5d73'),
    PR(-19, -24, 0, 13, 22, STEEL, { rz: 0.4 }), PR(19, -24, 0, 13, 22, STEEL, { rz: -0.4 }),
    CN(0, -38, 0, 13, 24, '#ff9040', { rx: Math.PI, k: 1.2 }),
    CY(0, -2, 18, 8, 8, '#8fd6ff', { rx: UP, k: 1.1 }),
    S(0, 8, 16, 14, '#8fd6ff', { ink: 0.7 })
  ];

  out.m_candle = [
    B(0, -10, 0, 28, 48, 28, '#ff5d73'),
    B(0, 18, 0, 5, 12, 5, DARK, { ink: 0.5 }),
    CN(0, 34, 0, 10, 22, '#ffd166', { k: 1.2 }),
    B(-25, -30, 0, 13, 5, 13, '#7ff0a8', { ink: 0.6 }), B(25, 14, 0, 13, 5, 13, '#ff2e88', { ink: 0.6 }),
    ...eyePair(0, -4, 16, 5, { dx: 8, look: 0.4 }),
    mouth(0, -22, 18, 14, 5, '#8a2f3c')
  ];

  out.m_diamondm = [
    OC(0, 10, 0, 32, 24, '#bfe9ff', { k: 1.1 }),
    OC(0, -14, 0, 24, 28, '#8fd6ff', { rx: Math.PI, k: 0.95 }),
    S(0, 14, 22, 12, '#ffffff', { ink: 0, k: 1.45 }),
    B(-30, -14, 4, 18, 18, 18, SKIN), B(30, -14, 4, 18, 18, 18, SKIN)
  ];

  out.m_rug = [
    B(0, -14, 0, 60, 18, 24, '#b2546f'),
    B(-16, -2, 0, 22, 14, 22, '#8f3f5a'), B(16, -2, 0, 22, 14, 22, '#d4708a'),
    CY(-32, -14, 0, 11, 22, '#c25f7a', { rz: UP }),          // the rolled end
    B(22, -28, 0, 28, 7, 15, '#e8c878', { ink: 0.7 }),        // the fringe
    ...oneEye(-6, -22, 14, 5, { look: 0.5 })
  ];

  out.m_printer = [
    B(0, -12, 0, 52, 38, 32, '#8fe3a0'),
    B(0, 10, 8, 44, 10, 26, '#4f9c52'),
    B(-20, 26, 10, 20, 24, 13, '#f4f8ff', { rz: 0.32 }), B(6, 32, -4, 20, 24, 13, '#f4f8ff', { rz: -0.26 }),
    BX(0, -14, 18, 30, 13, 8, '#151020', { ink: 0.6, k: 1.3 }),
    ...eyePair(0, 2, 20, 5.2, { dx: 12, look: 0.35 })
  ];

  out.m_moon = [
    BA(0, 0, 0, 34, '#ffe27a'),
    BA(-14, 12, 22, 12, '#f6d3a0'), BA(12, -8, 24, 15, '#f6d3a0'), BA(4, 18, 20, 8, '#f6d3a0'),
    ...eyePair(0, 4, 26, 5.4, { dx: 11, look: 0.34 }),
    mouth(0, -14, 26, 20, 9, '#8a4a58')
  ];
  return out;
}

function castPlayer() {
  /* parts are pushed separately so the run cycle is real motion, not frames */
  return {
    pl_body: [
      B(0, 4, -12, 24, 24, 12, '#d94f6c'),                    // backpack
      B(0, 2, 0, 34, 34, 26, '#ff5d73'),                       // the hoodie
      B(0, -14, 2, 30, 10, 24, '#e0476a', { ink: 0.8 }),       // hem
      B(-11, 6, 12, 7, 16, 5, '#ffe27a', { ink: 0.5 }),        // the drawstrings
      B(11, 6, 12, 7, 16, 5, '#ffe27a', { ink: 0.5 })
    ],
    pl_head: [
      B(0, 1, -16, 24, 16, 13, '#8a4a56'),                     // the hood, behind
      S(0, 0, 0, 31, SKIN),
      B(0, 12, 5, 27, 7, 21, '#743d4a', { rz: -0.05 }),        // the fringe, thin enough to keep the face
      B(-13, 2, 12, 6, 7, 5, '#c98a5c', { ink: 0 }),           // ears
      B(13, 2, 12, 6, 7, 5, '#c98a5c', { ink: 0 }),
      ...eyePair(0, 3, 14, 4.8, { dx: 6.5, look: 0.55 }),
      ...blush(0, -3, 13, 3.8),
      mouth(0, -8, 15, 11, 5, '#8a3a4c')
    ],
    pl_arm: [CP(0, 0, 0, 13, 12, '#ff5d73'), S(0, -16, 0, 13, SKIN, { ink: 0.9 })],
    pl_leg: [B(0, 0, 0, 14, 22, 15, '#3f4a6b'), B(0, -14, 4, 19, 10, 20, '#ffd166')],
    pl_gun: [B(0, 0, 0, 30, 12, 12, STEEL2)]
  };
}

function castGuns() {
  return {
    g_blaster: [B(0, 0, 0, 36, 14, 14, '#5b6076'), B(20, 2, 0, 15, 10, 10, '#8fd6ff', { k: 1.3 }),
      B(-15, -7, 0, 12, 16, 12, '#2f2a3a')],
    g_bread: [B(0, 0, 0, 32, 24, 22, '#e8b072'), B(0, 13, 0, 26, 7, 18, '#c98b4a'), B(17, 0, 0, 11, 17, 15, '#f6d3a0')],
    g_prism: [B(0, 0, 0, 42, 12, 12, '#8fd6ff'), CN(26, 0, 0, 9, 18, '#ff9dbd', { rz: -UP, k: 1.15 }),
      B(-17, -5, 0, 13, 17, 13, '#4a6f8a')],
    g_voidgun: [B(0, 0, 0, 32, 19, 17, '#4a2f5e'), CY(21, 0, 0, 10, 15, '#a05ae0', { rz: UP, k: 1.2 }),
      RG(29, 0, 0, 9, '#c9a8e8', { k: 1.15 })],
    g_susgun: [B(0, 0, 0, 30, 21, 19, '#3f8fd6'), B(13, 6, 9, 15, 11, 11, '#bfe6ff', { k: 1.1 }),
      B(-15, -7, 0, 11, 15, 11, '#2f5f8a')],
    g_moonshot: [CN(15, 0, 0, 10, 22, '#ff5d73', { rz: -UP }), CY(-5, 0, 0, 9, 19, '#eef2f8', { rz: UP }),
      PR(-17, 9, 0, 8, 13, '#ff9040', { rz: 0.6 }), PR(-17, -9, 0, 8, 13, '#ff9040', { rz: -0.6 })],
    g_pump: [B(0, 0, 0, 28, 24, 22, '#ff9dbd'), CN(17, 0, 0, 11, 15, '#ff5d73', { rz: -UP }),
      B(-15, -5, 0, 11, 15, 13, '#c23f3c')],
    g_leverage: [B(0, 0, 0, 34, 15, 15, '#f4f8ff'), B(0, 0, 9, 28, 6, 6, '#ff5d73', { ink: 0.6, k: 1.2 }),
      B(19, 0, 0, 9, 13, 13, '#ffd166')],
    g_airdrop: [B(0, 0, 0, 30, 23, 21, '#ffd166'), CY(17, 0, 0, 9, 9, '#ffe98a', { rz: UP, k: 1.1 }),
      B(-15, -5, 0, 11, 15, 13, '#c98b4a')]
  };
}

function castBullets() {
  return {
    bl_bolt: [B(0, 0, 0, 22, 9, 9, '#8fd6ff', { k: 1.15 }), CN(15, 0, 0, 6, 13, '#ffffff', { rz: -UP, ink: 0, k: 1.4 })],
    bl_laser: [B(0, 0, 0, 32, 6, 6, '#ff5d73', { k: 1.2 }), B(0, 0, 7, 36, 3, 3, '#ffffff', { ink: 0, k: 1.5 })],
    bl_bread: [B(0, 0, 0, 19, 15, 13, '#e8b072'), B(0, 8, 0, 15, 4, 11, '#c98b4a', { ink: 0.6 })],
    bl_coin: [CY(0, 0, 0, 12, 6, '#ffd166', { rx: UP, k: 1.1 }), OC(0, 0, 3, 6, 7, '#ffe98a', { rx: UP, ink: 0.6, k: 1.2 })],
    bl_rocket: [CN(0, 0, 0, 10, 20, '#ff5d73', { rz: -UP }), CY(-13, 0, 0, 9, 17, '#eef2f8', { rz: UP }),
      CN(-26, 0, 0, 8, 15, '#ff9040', { rz: UP, k: 1.2 })],
    bl_pump: [BA(0, 0, 0, 18, '#ff9dbd', { k: 1.1 }), CN(15, 0, 0, 8, 13, '#ffffff', { rz: -UP, ink: 0, k: 1.3 })],
    bl_lever: [B(0, 0, 0, 28, 13, 11, '#f4f8ff'), B(0, 0, 7, 24, 5, 5, '#ff5d73', { ink: 0.5, k: 1.2 }),
      CN(17, 0, 0, 8, 13, '#ffd166', { rz: -UP })],
    bl_crew: [CP(0, 0, 0, 17, 12, '#3f8fd6'), B(5, 4, 8, 11, 8, 6, '#bfe6ff', { ink: 0.5, k: 1.2 })],
    bl_orb: [BA(0, 0, 0, 15, '#a05ae0', { k: 1.15 }), RG(0, 0, 0, 15, '#c9a8e8', { k: 1.2 })],
    bl_down: [PR(0, 0, 0, 14, 15, '#ff5d73', { rx: Math.PI, k: 1.1 }), B(0, 7, 0, 11, 9, 11, '#c23f3c')],
    bl_mid: [B(0, 0, 0, 24, 17, 13, '#3f8fd6'), B(0, 0, 9, 15, 9, 5, '#f4f8ff', { ink: 0.5, k: 1.2 })],
    bl_heart: [S(-6, 3, 0, 12, '#ff5d73', { k: 1.1 }), S(6, 3, 0, 12, '#ff5d73', { k: 1.1 }),
      PR(0, -9, 0, 13, 13, '#ff5d73', { rx: Math.PI })],
    bl_rekt: [B(0, 0, 0, 22, 22, 13, '#ff2e88', { k: 1.1 }), B(0, 0, 9, 13, 5, 5, '#ffffff', { ink: 0, k: 1.4 })]
  };
}

function castPickups() {
  return {
    pk_coin: [CY(0, 0, 0, 15, 8, '#e0a83a', { rx: UP }), CY(0, 0, 3, 12, 6, '#ffd166', { rx: UP, k: 1.15 }),
      OC(0, 0, 6, 5, 6, '#ffe98a', { rx: UP, ink: 0.5, k: 1.3 }),
      S(-4, 5, 7, 5, '#fff8d8', { ink: 0, k: 1.5 })],
    pk_gem: [OC(0, 5, 0, 16, 15, '#ff9dbd', { k: 1.1 }), OC(0, -9, 0, 12, 15, '#ff7fa8', { rx: Math.PI }),
      S(3, 8, 14, 6, '#ffffff', { ink: 0, k: 1.5 })],
    pk_heart: [S(-6, 5, 0, 13, '#ff5d73', { k: 1.15 }), S(6, 5, 0, 13, '#ff5d73', { k: 1.15 }),
      PR(0, -9, 0, 15, 15, '#ff5d73', { rx: Math.PI }), S(-4, 8, 8, 4, '#ffffff', { ink: 0, k: 1.5 })],
    pk_bag: [B(0, -4, 0, 32, 28, 22, '#ffd166'), RG(0, 15, 0, 10, '#c98b4a', { rx: UP }),
      B(0, 0, 15, 13, 13, 7, '#8a6a2a', { ink: 0.7 })],
    pk_diamond: [OC(0, 6, 0, 17, 14, '#bfe9ff', { k: 1.12 }), OC(0, -9, 0, 13, 15, '#8fd6ff', { rx: Math.PI }),
      S(4, 9, 15, 6, '#ffffff', { ink: 0, k: 1.5 })],
    pk_advisory: [B(0, 0, 0, 28, 34, 9, '#f4f8ff'), B(-7, 9, 7, 15, 3.4, 3, '#8f86a8', { ink: 0.4 }),
      B(-2, 0, 7, 19, 3.4, 3, '#8f86a8', { ink: 0.4 }), B(0, -9, 7, 13, 3.4, 3, '#8f86a8', { ink: 0.4 })],
    pk_lever: [B(0, 0, 0, 30, 22, 13, '#ff5d73', { k: 1.1 }), B(0, 0, 9, 21, 7, 5, '#f4f8ff', { ink: 0.5, k: 1.2 })],
    cr_blaster: [B(0, 0, 0, 36, 28, 24, '#4a4a5e'), B(15, 2, 0, 13, 9, 9, '#8fd6ff', { k: 1.2 })],
    cr_bread: [B(0, 0, 0, 36, 28, 24, '#e8b072'), B(0, 11, 0, 28, 7, 20, '#c98b4a', { ink: 0.7 })],
    cr_prism: [B(0, 0, 0, 36, 28, 24, '#8fd6ff'), B(15, 0, 0, 13, 9, 9, '#ff9dbd', { k: 1.2 })],
    cr_voidgun: [B(0, 0, 0, 36, 28, 24, '#4a2f5e'), RG(0, 0, 13, 11, '#a05ae0', { k: 1.25 })],
    cr_susgun: [B(0, 0, 0, 36, 28, 24, '#3f8fd6'), B(11, 5, 11, 13, 10, 9, '#bfe6ff', { k: 1.2 })],
    cr_moonshot: [B(0, 0, 0, 36, 28, 24, '#ff5d73'), CN(0, 9, 13, 9, 18, '#eef2f8')],
    cr_pump: [B(0, 0, 0, 36, 28, 24, '#ff9dbd'), CN(0, 11, 13, 10, 16, '#ffffff', { rx: Math.PI, k: 1.2 })],
    cr_leverage: [B(0, 0, 0, 36, 28, 24, '#f4f8ff'), B(0, 9, 13, 21, 7, 7, '#ff5d73', { k: 1.15 })],
    cr_airdrop: [B(0, 0, 0, 36, 28, 24, '#ffd166'), CY(0, 9, 13, 9, 7, '#ffe98a', { rx: UP, k: 1.15 })]
  };
}

function castBlocks() {
  return {
    b_spike: [B(0, 2, 0, 48, 44, 36, '#8f5a2c'),
      B(0, 24, 0, 42, 8, 32, '#6b4420', { ink: 0.8 }),
      PR(-14, 34, 0, 8, 20, STEEL), PR(0, 36, 0, 9, 22, STEEL), PR(14, 34, 0, 8, 20, STEEL)],
    b_saw: [CY(0, 0, 0, 23, 12, STEEL2, { rx: UP, k: 1.04 }),
      CN(30, 0, 2, 7, 15, STEEL, { rz: -UP + 0.5, ink: 0.8 }), CN(-30, 0, 2, 7, 15, STEEL, { rz: UP - 0.5, ink: 0.8 }),
      CN(0, 30, 2, 7, 15, STEEL, { ink: 0.8 }), CN(0, -30, 2, 7, 15, STEEL, { rx: Math.PI, ink: 0.8 }),
      CN(22, 22, 2, 7, 15, STEEL, { rz: 0.78, ink: 0.8 }), CN(-22, 22, 2, 7, 15, STEEL, { rz: -0.78, ink: 0.8 }),
      CN(22, -22, 2, 7, 15, STEEL, { rz: -0.78, ink: 0.8 }), CN(-22, -22, 2, 7, 15, STEEL, { rz: 0.78, ink: 0.8 }),
      CY(0, 0, 6, 10, 10, '#ff5d73', { rx: UP, k: 1.2 }),
      S(0, 0, 12, 6, '#ffd166', { ink: 0, k: 1.3 })],
    b_mount: [B(0, 0, 0, 32, 24, 28, '#6b5a78'), B(0, 15, 0, 24, 11, 22, STEEL2)],
    b_cone: [CN(0, 16, 0, 15, 36, '#ff8a4c'), B(0, -14, 0, 42, 15, 36, '#e8ecf2'),
      B(0, 6, 0, 24, 7, 22, '#f4f8ff', { ink: 0.7 })],
    b_monitor: [B(0, 6, 0, 54, 42, 28, '#3a3a4a'), BX(0, 8, 15, 44, 32, 7, '#120c1a', { ink: 0.6, k: 1.3 }),
      B(-11, 10, 19, 9, 15, 4, '#7ff0a8', { ink: 0.3, k: 1.3 }), B(0, 10, 19, 9, 15, 4, '#ff5d73', { ink: 0.3, k: 1.3 }),
      B(11, 10, 19, 9, 15, 4, '#ffe27a', { ink: 0.3, k: 1.3 }),
      B(0, -24, 0, 22, 11, 22, '#4a4a5e')],
    b_nft: [B(0, 0, 0, 48, 54, 15, '#ffd166'), B(0, 0, 9, 36, 42, 9, '#6b3d7a'),
      GM(0, 4, 15, 20, 24, 14, '#ff9dbd', { k: 1.2 })],
    b_rug: [B(0, 0, 0, 62, 22, 28, '#b2546f'), B(0, 14, 0, 54, 9, 24, '#8f3f5a', { ink: 0.8 }),
      B(26, -13, 0, 22, 7, 17, '#e8c878', { ink: 0.7 })],
    b_engine: [B(0, -6, 0, 54, 46, 36, '#ff5d73'), CY(-19, 22, 0, 10, 22, STEEL), CY(19, 22, 0, 10, 22, STEEL),
      BX(0, -4, 19, 36, 12, 7, '#151020', { ink: 0.6, k: 1.3 }),
      B(-28, -26, 0, 13, 16, 22, STEEL2), B(28, -26, 0, 13, 16, 22, STEEL2)],
    b_candle: [B(0, -6, 0, 32, 52, 32, '#ff5d73'), B(0, 26, 0, 6, 13, 6, DARK, { ink: 0.5 }),
      CN(0, 40, 0, 11, 22, '#ffd166', { k: 1.2 }),
      B(-18, -28, 0, 13, 6, 13, '#7ff0a8', { ink: 0.6 }), B(18, 20, 0, 13, 6, 13, '#ff2e88', { ink: 0.6 })],
    b_atm: [B(0, 0, 0, 48, 58, 32, '#7fd48a'), BX(0, 13, 17, 34, 23, 7, '#120c1a', { ink: 0.6, k: 1.3 }),
      B(0, -11, 19, 28, 9, 7, '#f4f8ff', { ink: 0.7 }),
      B(-14, -24, 17, 9, 7, 5, '#ffd166', { ink: 0.4 }), B(-4, -24, 17, 9, 7, 5, '#ffd166', { ink: 0.4 }),
      B(6, -24, 17, 9, 7, 5, '#ffd166', { ink: 0.4 })]
  };
}

function castBoss() {
  return {
    boss0: [B(0, 0, 0, 80, 110, 32, '#2c1c3e'), BX(0, 4, 15, 72, 100, 8, '#1d1130', { ink: 1.6 }),
      BX(0, 4, 19, 66, 92, 7, '#472a6b', { ink: 0.6, k: 1.35 }),
      B(0, 48, 22, 44, 11, 7, '#ff5d73', { ink: 0.6, k: 1.25 }), B(0, -50, 22, 56, 9, 7, '#7ff0a8', { ink: 0.6, k: 1.25 }),
      S(0, 60, 22, 8, '#8fd6ff', { ink: 0.5, k: 1.2 }),
      CN(-17, 64, 0, 10, 22, '#ffd166'), CN(0, 68, 0, 10, 26, '#ffd166'), CN(17, 64, 0, 10, 22, '#ffd166'),
      OC(0, 57, 0, 23, 9, '#ffd166')],
    boss1: [B(0, 0, 0, 86, 98, 36, '#1b2942'), BX(0, 2, 17, 78, 88, 8, '#0f1a2c', { ink: 1.6 }),
      BX(0, 2, 21, 72, 80, 7, '#2e5688', { ink: 0.6, k: 1.3 }),
      B(0, 44, 23, 48, 11, 7, '#8fd6ff', { ink: 0.6, k: 1.25 }), B(0, -44, 22, 48, 9, 7, '#7ff0a8', { ink: 0.6, k: 1.25 }),
      CN(-19, 58, 0, 10, 24, '#8fd6ff'), CN(0, 62, 0, 10, 28, '#8fd6ff'), CN(19, 58, 0, 10, 24, '#8fd6ff')],
    boss_eye: [BA(0, 0, 0, 30, CREAM), S(0, 0, 17, 15, '#3f8fd6', { ink: 0.6 }), S(0, 0, 23, 8, DARK, { ink: 0 }),
      S(-8, 8, 21, 8, '#ffffff', { ink: 0, k: 1.35 })],
    boss_badge0: [BA(0, 0, 0, 17, '#ff5d73', { k: 1.1 }), B(0, 0, 11, 15, 5, 4, '#ffffff', { ink: 0, k: 1.3 })],
    boss_badge1: [BA(0, 0, 0, 17, '#3f8fd6', { k: 1.1 }), B(-5, 0, 11, 7, 13, 4, '#ffffff', { rz: 0.6, ink: 0, k: 1.3 }),
      B(4, -4, 11, 13, 5, 4, '#ffffff', { rz: -0.4, ink: 0, k: 1.3 })],
    boss_badge2: [BA(0, 0, 0, 17, '#ffd166', { k: 1.1 }), PR(0, 0, 11, 9, 11, '#22131f', { rx: Math.PI, ink: 0.5 })],
    boss_badge3: [BA(0, 0, 0, 17, '#7ff0a8', { k: 1.1 }), B(0, 4, 11, 15, 4.4, 4, '#22131f', { ink: 0.4 }),
      B(0, -4, 11, 15, 4.4, 4, '#22131f', { ink: 0.4 })],
    boss_badge4: [BA(0, 0, 0, 17, '#c9a8e8', { k: 1.1 }), S(-5, 3, 13, 8, '#22131f', { ink: 0 }), S(5, 3, 13, 8, '#22131f', { ink: 0 })],
    hole: [BA(0, 0, 0, 26, '#0d0812'), RG(0, 0, 7, 26, '#a05ae0', { k: 1.3 })],
    holering: [RG(0, 0, 0, 28, '#a05ae0', { rx: UP, k: 1.25 }), RG(0, 0, 0, 22, '#c9a8e8', { rx: UP, k: 1.3 })]
  };
}

/* kit instance budgets: how many of one type can be on screen at once */
const KIT_MAX = { enemy: 46, bullet: 70, pickup: 30, block: 26, part: 10 };
function makeKits() {
  const cast = Object.assign({}, castMemes(), castBullets(), castPickups(), castBlocks(), castBoss(), castPlayer(), castGuns());
  const stats = { kits: 0, tris: 0 };
  for (const name in cast) {
    const parts = cast[name];
    let max = 3;
    if (/^m_/.test(name)) max = KIT_MAX.enemy;
    else if (/^bl_/.test(name)) max = KIT_MAX.bullet;
    else if (/^pk_|^cr_/.test(name)) max = KIT_MAX.pickup;
    else if (/^b_/.test(name)) max = KIT_MAX.block;
    else if (/^pl_|^g_|^boss/.test(name)) max = KIT_MAX.part;
    new Kit(name, parts, max);
    stats.kits++;
  }
  return stats;
}
