/* ============================================================
   2. POST — the frame is drawn into an offscreen target and resolved
   through a short chain before it reaches the canvas.

   Why this exists: the world is drawn straight to the screen otherwise, so
   every light source is just a flat sprite, every silhouette edge is one hard
   pixel, and the palette is whatever each artist-tuned asset happened to be.
   That is what reads as "clunky". The chain fixes all three at once:

     scene -> HDR target (supersampled, MSAA)
           -> bright pass  -> 1/2 blur -> 1/4 blur   (bloom)
           -> composite    -> canvas                (grade, vignette, grain)

   Colour management is switched off for the whole game (see boot): the atlas
   art is authored in display space and the kits' vertex colours round-trip
   through it unchanged, so the pipeline stays in display space end to end and
   the target and the canvas agree on what a pixel means.
   ============================================================ */

/* per-mode grade. lift pulls the shadows toward the sky, gain pushes the
   highlights toward the sun — the classic two-light grade, which is what ties
   a scene of separately-drawn assets into one lit place. */
const GRADE = {
  classic: { lift: [0.014, 0.026, 0.055], gain: [1.060, 1.015, 0.945], sat: 1.20, con: 0.24, exp: 0.985, bloom: 0.34, vig: 0.46 },
  degen:   { lift: [0.008, 0.040, 0.022], gain: [0.980, 1.050, 0.980], sat: 1.22, con: 0.28, exp: 0.985, bloom: 0.42, vig: 0.46 },
  chaos:   { lift: [0.042, 0.018, 0.028], gain: [1.075, 0.990, 1.000], sat: 1.24, con: 0.30, exp: 0.990, bloom: 0.42, vig: 0.48 },
  ohio:    { lift: [0.040, 0.012, 0.052], gain: [1.065, 0.985, 1.080], sat: 1.24, con: 0.30, exp: 0.985, bloom: 0.44, vig: 0.50 },
  zen:     { lift: [0.022, 0.028, 0.036], gain: [1.020, 1.020, 1.035], sat: 1.02, con: 0.14, exp: 1.000, bloom: 0.30, vig: 0.34 }
};
const _grade = { lift: [0, 0, 0], gain: [1, 1, 1], sat: 1, con: 0.3, exp: 1, bloom: 0.6, vig: 0.35 };

const POST = {
  on: false, ready: false,
  rt: null, b: [], quad: null, cam: null, sc: null,
  pBright: null, pBlur: [], pComp: null,
  w: 0, h: 0, bloomW: 0, bloomH: 0,
  fail: 0
};

const FS_VERT = `
varying vec2 vUv;
void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

/* keep only what is genuinely bright, with a soft knee so lights turn on
   gradually instead of popping at a threshold */
const BRIGHT_FRAG = `
uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uThresh, uKnee;
varying vec2 vUv;
void main() {
  vec3 c = vec3(0.0);
  /* 4-tap box on the way down: cheaper and stops a single hot pixel aliasing */
  c += texture2D(tSrc, vUv + uTexel * vec2(-0.5, -0.5)).rgb;
  c += texture2D(tSrc, vUv + uTexel * vec2( 0.5, -0.5)).rgb;
  c += texture2D(tSrc, vUv + uTexel * vec2(-0.5,  0.5)).rgb;
  c += texture2D(tSrc, vUv + uTexel * vec2( 0.5,  0.5)).rgb;
  c *= 0.25;
  float br = max(c.r, max(c.g, c.b));
  float w = clamp((br - uThresh) / max(uKnee, 1e-4), 0.0, 1.0);
  gl_FragColor = vec4(c * w * w, 1.0);
}`;

/* separable gaussian, 5 taps using linear filtering between them */
const BLUR_FRAG = `
uniform sampler2D tSrc; uniform vec2 uDir;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(tSrc, vUv).rgb * 0.2270270270;
  c += (texture2D(tSrc, vUv + uDir * 1.3846153846).rgb + texture2D(tSrc, vUv - uDir * 1.3846153846).rgb) * 0.3162162162;
  c += (texture2D(tSrc, vUv + uDir * 3.2307692308).rgb + texture2D(tSrc, vUv - uDir * 3.2307692308).rgb) * 0.0702702703;
  gl_FragColor = vec4(c, 1.0);
}`;

const COMP_FRAG = `
uniform sampler2D tScene, tB1, tB2;
uniform vec2 uRes;
uniform float uBloom, uGrain, uVig, uVigCol, uCA, uSat, uCon, uExp, uTime, uFlash, uAber;
uniform vec3 uLift, uGain, uVigTint;
varying vec2 vUv;

/* the grade runs in display space, so every curve here is shaped to leave the
   mids alone: only the highlights roll off and only the shadows get tinted. */
void main() {
  vec2 p = vUv - 0.5;
  float r2 = dot(p, p);

  /* lateral chromatic aberration: the lens bends the edges, not the centre.
     Kept tiny — you should feel it, not see rainbow fringes. */
  float ca = (uCA + uAber) * r2;
  vec2 dir = p * ca;
  vec3 c;
  c.r = texture2D(tScene, vUv + dir).r;
  c.g = texture2D(tScene, vUv).g;
  c.b = texture2D(tScene, vUv - dir).b;

  /* bloom: two radii mixed so near-glow stays tight and far-glow washes wide */
  vec3 bl = texture2D(tB1, vUv).rgb * 0.66 + texture2D(tB2, vUv).rgb * 0.52;
  c += bl * uBloom;

  c *= uExp;

  /* soft shoulder: additive light stacks past 1 in the HDR target, and this
     rolls it to white instead of a flat clipped disc */
  vec3 hi = max(vec3(0.0), c - 0.72);
  c -= hi * hi * 0.62;

  /* gentle S-curve about the mid — contrast where it reads, no crushed blacks */
  c = mix(c, c * c * (3.0 - 2.0 * c), uCon);

  /* two-light grade */
  c = c * uGain + uLift;

  /* vibrance rather than saturation: already-saturated pixels are protected so
     the coins and the sun do not turn to laser paint */
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b));
  c = mix(vec3(l), c, clamp(uSat * (1.0 - 0.42 * (mx - mn)), 0.0, 2.0));

  /* vignette, slightly coloured so the corners read as depth and not as dirt */
  float v = smoothstep(0.16, 0.62, r2 * 1.9);
  c = mix(c, c * uVigTint, v * uVig);

  /* film grain — also the dither that keeps an 8-bit sky from banding */
  float n = fract(sin(dot(gl_FragCoord.xy + vec2(uTime * 37.0, uTime * 17.0),
                vec2(12.9898, 78.233))) * 43758.5453);
  c += (n - 0.5) * uGrain;

  c += uFlash;
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;

function rt(w, h, opt) {
  return new THREE.WebGLRenderTarget(Math.max(2, w | 0), Math.max(2, h | 0),
    Object.assign({ minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat, depthBuffer: false, stencilBuffer: false,
      generateMipmaps: false }, opt || {}));
}
function pass(frag, uniforms) {
  const m = new THREE.ShaderMaterial({
    uniforms, vertexShader: FS_VERT, fragmentShader: frag,
    depthTest: false, depthWrite: false, transparent: false, toneMapped: false
  });
  const mesh = new THREE.Mesh(POST.quad, m);
  mesh.frustumCulled = false;
  return mesh;
}
function target(m) { return m.material.uniforms; }

function initPost() {
  POST.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  POST.sc = new THREE.Scene();
  POST.quad = new THREE.PlaneGeometry(2, 2);
  POST.hdr = (() => {
    /* half-float so stacked additive light is real headroom and the shoulder
       has something to roll off; fall back to 8-bit if the driver says no */
    try { const p = rt(8, 8, { type: THREE.HalfFloatType }); p.dispose(); return THREE.HalfFloatType; }
    catch (e) { return THREE.UnsignedByteType; }
  })();

  POST.pBright = pass(BRIGHT_FRAG, {
    tSrc: { value: null }, uTexel: { value: new THREE.Vector2() },
    uThresh: { value: 0.86 }, uKnee: { value: 0.22 }
  });
  for (let i = 0; i < 2; i++) {
    POST.pBlur.push(pass(BLUR_FRAG, { tSrc: { value: null }, uDir: { value: new THREE.Vector2(1, 0) } }));
  }
  POST.pComp = pass(COMP_FRAG, {
    tScene: { value: null }, tB1: { value: null }, tB2: { value: null },
    uRes: { value: new THREE.Vector2(1, 1) },
    uBloom: { value: 0.6 }, uGrain: { value: 0.016 }, uVig: { value: 0.34 },
    uVigCol: { value: 0 }, uCA: { value: 0.0026 }, uSat: { value: 1.12 },
    uCon: { value: 0.3 }, uExp: { value: 1.03 }, uTime: { value: 0 },
    uFlash: { value: 0 }, uAber: { value: 0 },
    uLift: { value: new THREE.Vector3() }, uGain: { value: new THREE.Vector3(1, 1, 1) },
    uVigTint: { value: new THREE.Vector3(0.62, 0.55, 0.72) }
  });
  POST.ready = true;
  sizePost();
}

/* (Re)allocate the chain for the current canvas size and quality level. */
function sizePost() {
  if (!POST.ready) return;
  POST.on = !!QUAL.post;
  /* internal render scale, relative to CSS px: supersample over the display's
     own ratio, but never past 2x or the fill cost outweighs the softness */
  const rs = Math.min(Math.max(DPR * (QUAL.ss || 1), DPR), 2);
  const w = Math.round(W * rs), h = Math.round(H * rs);
  if (!POST.on) {
    if (POST.rt) { POST.rt.dispose(); POST.rt = null; POST.b.forEach(t => t.dispose()); POST.b = []; POST.w = 0; }
    return;
  }
  if (POST.w === w && POST.h === h && POST.samples === (QUAL.msaa || 0)) return;
  if (POST.rt) { POST.rt.dispose(); POST.b.forEach(t => t.dispose()); }
  POST.rt = rt(w, h, { type: POST.hdr, samples: QUAL.msaa || 0 });
  POST.rt.texture.colorSpace = THREE.NoColorSpace;
  /* two bloom levels: half and quarter of the *frame*, so the cost is ~5% of
     the main pass no matter how big the screen is */
  const bw1 = w >> 1, bh1 = h >> 1, bw2 = w >> 2, bh2 = h >> 2;
  POST.b = [rt(bw1, bh1), rt(bw1, bh1), rt(bw2, bh2), rt(bw2, bh2)];
  POST.w = w; POST.h = h; POST.samples = QUAL.msaa || 0;
  target(POST.pComp).uRes.value.set(w, h);
}

/* ease the grade toward the current mode so switching modes cross-fades
   instead of snapping the whole frame's colour */
function stepGrade(dt) {
  const g = GRADE[mode] || GRADE.classic;
  const k = clamp(dt * 3.2, 0, 1);
  for (let i = 0; i < 3; i++) {
    _grade.lift[i] += (g.lift[i] - _grade.lift[i]) * k;
    _grade.gain[i] += (g.gain[i] - _grade.gain[i]) * k;
  }
  _grade.sat += (g.sat - _grade.sat) * k;
  _grade.con += (g.con - _grade.con) * k;
  _grade.exp += (g.exp - _grade.exp) * k;
  _grade.bloom += (g.bloom - _grade.bloom) * k;
  _grade.vig += (g.vig - _grade.vig) * k;
}

const blit = (mesh, to) => {
  POST.sc.children.length = 0; POST.sc.add(mesh);
  renderer.setRenderTarget(to); renderer.render(POST.sc, POST.cam);
};

/* The whole frame: world into the HDR target, bloom, then the graded resolve.
   With post off this is exactly the old single draw to the canvas. */
function renderFrame(t) {
  if (!POST.on || !POST.rt) { renderer.setRenderTarget(null); renderer.render(scene, camera); return; }
  renderer.setRenderTarget(POST.rt);
  renderer.render(scene, camera);

  const u = target(POST.pComp);
  /* --- bloom --- */
  const hw = POST.w >> 1, hh = POST.h >> 1;
  target(POST.pBright).tSrc.value = POST.rt.texture;
  target(POST.pBright).uTexel.value.set(1 / POST.w, 1 / POST.h);
  const hot = (boss && boss.hitFx > 0) ? 0.35 : 0;
  target(POST.pBright).uThresh.value = 0.86 - hot * 0.14;

  blit(POST.pBright, POST.b[0]);
  const b1 = target(POST.pBlur[0]), b2 = target(POST.pBlur[1]);
  b1.tSrc.value = POST.b[0].texture; b1.uDir.value.set(1.35 / hw, 0);
  blit(POST.pBlur[0], POST.b[1]);
  b1.tSrc.value = POST.b[1].texture; b1.uDir.value.set(0, 1.35 / hh);
  blit(POST.pBlur[0], POST.b[0]);
  b2.tSrc.value = POST.b[0].texture; b2.uDir.value.set(1.6 / (hw >> 1), 0);
  blit(POST.pBlur[1], POST.b[2]);
  b2.tSrc.value = POST.b[2].texture; b2.uDir.value.set(0, 1.6 / (hh >> 1));
  blit(POST.pBlur[1], POST.b[3]);

  /* --- composite --- */
  u.tScene.value = POST.rt.texture;
  u.tB1.value = POST.b[0].texture;
  u.tB2.value = POST.b[3].texture;
  u.uLift.value.set(_grade.lift[0], _grade.lift[1], _grade.lift[2]);
  u.uGain.value.set(_grade.gain[0], _grade.gain[1], _grade.gain[2]);
  u.uSat.value = _grade.sat;
  u.uCon.value = _grade.con;
  u.uExp.value = _grade.exp;
  u.uBloom.value = _grade.bloom * (QUAL.bloom === false ? 0 : 1);
  u.uVig.value = QUAL.vig ? _grade.vig : 0;
  u.uTime.value = (t * 60) % 3600;
  /* shake and damage push the lens: the hit you can feel in your teeth */
  u.uAber.value = clamp(shake * 0.00042 + hurtFx * 0.010 + glitch * 0.006, 0, 0.02);
  u.uCA.value = 0.0022 + clamp(player.x * 0.0000002, 0, 0.0016);
  u.uGrain.value = QUAL.grain === false ? 0 : 0.015 + (mode === 'zen' ? -0.004 : 0) + glitch * 0.02;
  u.uFlash.value = 0;

  blit(POST.pComp, null);
}
