/* ============================================================
   0. utils + bake pipeline + three.js quad renderer
   ============================================================ */
const TAU = Math.PI * 2;
const rnd = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[(Math.random() * a.length) | 0];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp2 = (a, b, t) => a + (b - a) * t;
function hash(n) {
  n = (n | 0) + 0x9e3779b9 | 0;
  n = Math.imul(n ^ n >>> 15, 1 | n);
  n = Math.imul(n ^ n >>> 7, 61 | n) ^ n;
  return ((n ^ n >>> 14) >>> 0) / 4294967296;
}
function rgba(hex, a) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
}
/* shade() lives with the art (it is only used while baking) */
const money = v => '$' + (Math.round(v)).toLocaleString('en-US');

const INK = '#3a2340';
const C = {
  white: '#fffaf9', cream: '#fff3e2', pink: '#ff9dbd', pinkD: '#e8618c', pinkL: '#ffd3e2',
  mint: '#7fd3a8', mintD: '#43a86c', gold: '#ffd166', goldD: '#d9982f',
  lilac: '#c9a8e8', lilacD: '#8f63bd', blue: '#6fb7ff', blueL: '#bfe9ff',
  red: '#ff5d73', teal: '#8fe3d0', brown: '#c98c5a', degen: '#7ff0a8', degenD: '#16a34a'
};

/* The art below is canvas-2d code. It is never run per frame: it runs once at
   load into offscreen cells of a texture atlas. `ctx` points at the bake sheet. */
let ctx = null;
let GC = new Map();

function rrPath(x, y, w, h, r) {
  r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function circ(x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, TAU); }
function ell(x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU); }
function poly(pts) { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); }
function sticker(fill, o) {
  o = o || {};
  const pad = o.pad === undefined ? 5 : o.pad;
  const lw = o.lw === undefined ? 2.3 : o.lw;
  const ink = o.ink || INK;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (pad > 0) { ctx.strokeStyle = o.halo || '#fff'; ctx.lineWidth = pad * 2; ctx.stroke(); }
  if (fill !== null) { ctx.fillStyle = fill; ctx.fill(); }
  if (lw > 0) { ctx.strokeStyle = ink; ctx.lineWidth = lw; ctx.stroke(); }
}
function fillc(fill) { ctx.fillStyle = fill; ctx.fill(); }
function line(w, col) { ctx.lineWidth = w; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); }
function grad(key, build) {
  let v = GC.get(key);
  if (!v) { v = build(ctx); GC.set(key, v); }
  return v;
}
function glow(x, y, r, hex, a) {
  if (a === undefined) a = 1;
  const gr = grad('gl' + hex, c => {
    const q = c.createRadialGradient(0, 0, 0, 0, 0, 1);
    q.addColorStop(0, rgba(hex, 1)); q.addColorStop(0.4, rgba(hex, 0.42)); q.addColorStop(1, rgba(hex, 0));
    return q;
  });
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = a;
  ctx.translate(x, y); ctx.scale(r, r);
  ctx.fillStyle = gr;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}
function txt(s, x, y, o) {
  o = o || {};
  const size = o.size || 20, weight = o.weight || 700;
  ctx.font = weight + ' ' + size + 'px ' + (o.font || 'Fredoka') + ', Fredoka, ui-rounded, system-ui, sans-serif';
  ctx.textAlign = o.align || 'center';
  ctx.textBaseline = 'middle';
  if (o.stroke !== false) {
    ctx.lineJoin = 'round'; ctx.lineWidth = o.lw || size * 0.28;
    ctx.strokeStyle = o.stroke || INK;
    ctx.strokeText(s, x, y);
  }
  ctx.fillStyle = o.color || '#fff';
  ctx.fillText(s, x, y);
}

/* ---------------- texture atlas baker ----------------
   Every visual in the game is one textured quad. The vector art is rasterised
   once at load into shelf-packed cells; the GPU draws 600+ quads in ~6 calls. */
const BAKE = 2;                       // supersample factor of the bake sheets
const SPR = Object.create(null);      // name -> { u,v,uw,vh, ox,oy, w,h }
class Atlas {
  constructor(size, h, page) {
    this.size = size; this.h = h || size; this.page = page;
    this.cv = document.createElement('canvas');
    this.cv.width = size; this.cv.height = this.h;
    this.c = this.cv.getContext('2d');
    this.x = 1; this.y = 1; this.rowH = 0;
    this.n = 0;
  }
  /* box = [x0,y0,w,h] in the art's local coordinates; art is drawn around its own
     origin, which becomes the sprite's anchor (ox,oy). */
  add(name, box, draw, opt) {
    opt = (typeof opt === 'number') ? { pad: opt } : (opt || {});
    const pad = (opt.pad === undefined ? 10 : opt.pad), bk = (opt.s === undefined ? BAKE : opt.s);
    const w = Math.ceil(box[2] * bk) + pad * 2, h = Math.ceil(box[3] * bk) + pad * 2;
    const cw = w, ch = h;
    if (this.x + cw + 2 > this.size) { this.y += this.rowH + 2; this.x = 1; this.rowH = 0; }
    if (this.y + ch + 2 > this.h) { console.warn('atlas overflow at ' + name); return null; }
    const x = this.x, y = this.y;
    const c = this.c;
    c.save();
    /* setTransform, never scale(): a bake callback that forgets to restore() must
       not leak its transform into the next sprite's bake */
    c.setTransform(bk, 0, 0, bk, x + 1 + pad - box[0] * bk, y + 1 + pad - box[1] * bk);
    ctx = c; GC.clear();
    draw();
    ctx = null; GC.clear();
    c.restore();
    const uw_ = this.size, vh_ = this.h, bw = Math.ceil(box[2] * bk), bh = Math.ceil(box[3] * bk);
    SPR[name] = {
      u: (x + 1 + pad) / uw_, v: (y + 1 + pad) / vh_, uw: bw / uw_, vh: bh / vh_,
      ox: box[0] + box[2] / 2, oy: box[1] + box[3] / 2,
      w: box[2], h: box[3], page: this.page
    };
    this.x += cw + 2; if (ch > this.rowH) this.rowH = ch;
    this.n++;
    return SPR[name];
  }
  texture() {
    const t = new THREE.CanvasTexture(this.cv);
    t.flipY = false;
    t.colorSpace = THREE.SRGBColorSpace;
    t.premultiplyAlpha = false;
    t.generateMipmaps = false;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    t.needsUpdate = true;
    return t;
  }
}

/* ---------------- quad batches ---------------- */
const VERT = `
attribute vec3 iPos; attribute vec2 iScale; attribute vec4 iUv; attribute vec3 iColor; attribute float iAlpha; attribute vec2 iRot;
uniform vec2 iCount;
varying vec2 vUv; varying vec3 vColor; varying float vAlpha;
void main() {
  vec2 loc = (vec2(position.x, position.y) - 0.5) * iScale;
  vec2 p = vec2(loc.x * iRot.x - loc.y * iRot.y, loc.x * iRot.y + loc.y * iRot.x);
  vUv = iUv.xy + vec2(position.x, 1.0 - position.y) * iUv.zw;
  vColor = iColor; vAlpha = iAlpha;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p.x + iPos.x, p.y + iPos.y, iPos.z, 1.0);
}`;
const FRAG = `
uniform sampler2D map;
varying vec2 vUv; varying vec3 vColor; varying float vAlpha;
void main() {
  vec4 t = texture2D(map, vUv);
  float a = t.a * vAlpha;
  if (a <= 0.002) discard;
  gl_FragColor = vec4(t.rgb * vColor, a);
}`;

class Quads {
  constructor(tex, max, additive) {
    this.max = max; this.n = 0;
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(
      [0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0], 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    const at = (L, size) => {
      const a = new THREE.InstancedBufferAttribute(new Float32Array(max * size), size);
      a.setUsage(THREE.DynamicDrawUsage);
      g.setAttribute(L, a);
      return a;
    };
    this.aPos = at('iPos', 3); this.aScale = at('iScale', 2); this.aUv = at('iUv', 4);
    this.aCol = at('iColor', 3); this.aAlpha = at('iAlpha', 1); this.aRot = at('iRot', 2);
    g.instanceCount = 0;
    this.geo = g;
    this.mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: tex }, iCount: { value: new THREE.Vector2(0, 0) } },
      vertexShader: VERT, fragmentShader: FRAG,
      transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending
    });
    this.mesh = new THREE.Mesh(g, this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = additive ? 20 : 10;
  }
  begin() { this.n = 0; }
  push(sp, cx, cy, sw, sh, rot, col, alpha) {
    let n = this.n;
    if (n >= this.max) return;
    const cs = rot ? Math.cos(rot) : 1, sn = rot ? Math.sin(rot) : 0;
    this.aPos.array[n * 3] = cx; this.aPos.array[n * 3 + 1] = cy; this.aPos.array[n * 3 + 2] = 0;
    this.aScale.array[n * 2] = sw; this.aScale.array[n * 2 + 1] = sh;
    this.aUv.array[n * 4] = sp.u; this.aUv.array[n * 4 + 1] = sp.v;
    this.aUv.array[n * 4 + 2] = sp.uw; this.aUv.array[n * 4 + 3] = sp.vh;
    this.aCol.array[n * 3] = col[0]; this.aCol.array[n * 3 + 1] = col[1]; this.aCol.array[n * 3 + 2] = col[2];
    this.aAlpha.array[n] = alpha;
    this.aRot.array[n * 2] = cs; this.aRot.array[n * 2 + 1] = sn;
    this.n++;
  }
  end() {
    this.geo.instanceCount = this.n;
    const set = a => {
      if (a.addUpdateRange) { a.clearUpdateRanges(); a.addUpdateRange(0, a.count * a.itemSize); }
      a.needsUpdate = true;
    };
    if (this.n) { set(this.aPos); set(this.aScale); set(this.aUv); set(this.aCol); set(this.aAlpha); set(this.aRot); }
  }
}

/* ---------------- renderer / camera ---------------- */
/* Display space end to end. The atlas art is authored in sRGB and the kit
   vertex colours are authored against it; with colour management on, the kits
   would round-trip linear while the quads never convert, and the two would
   only agree on the canvas. Off makes the offscreen target and the canvas mean
   the same thing, which is what the post chain needs. */
THREE.ColorManagement.enabled = false;
const cv = document.getElementById('game');
/* antialias is not optional here: the cast is geometry, and a hard pixel edge
   on every primitive silhouette is the difference between toys and clipping. */
const renderer = new THREE.WebGLRenderer({ canvas: cv,
  alpha: false, antialias: true, powerPreference: 'high-performance', stencil: false, depth: false
});
renderer.autoClear = true;
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.setClearColor(new THREE.Color('#10203a'), 1);
renderer.shadowMap.enabled = false;
const scene = new THREE.Scene();
let W = 0, H = 0, DPR = 1, SC = 1, GROUND = 0;
const camera = new THREE.OrthographicCamera(0, 1, 0, -1, -2000, 2000);
camera.position.set(0, 0, 10);

function camSetup() {
  camera.left = 0; camera.right = W; camera.top = 0; camera.bottom = -H;
  camera.updateProjectionMatrix();
}
