/* =========================================================================
   3D KIT LAYER
   The cast is built from primitives (boxes, icosahedra, capsules, cylinders,
   cones) rendered through the same orthographic camera: a part seen face-on is
   a flat shape — circle, square, triangle — while the extruded sides read as
   volume. Shading is baked into vertex colours as three flat cel bands, and
   every part carries an inflated ink-coloured shell, so silhouettes get a solid
   cartoon outline.
   No depth buffer: each kit is one merged geometry with triangles ordered
   shell-first, body-after, which is a painter's algorithm for a sticker.
   One kit type = one InstancedMesh = one draw call.
   ========================================================================= */

const BAND = [1.34, 1.0, 0.62];             // lit / base / shade
const INKHEX = '#22131f';
const ZAXIS = new THREE.Vector3(0, 0, 1);
const WHITE3 = [1, 1, 1];
/* Fixed world tilt, baked in at build time so the top and one side of every
   volume are visible. The game only ever rotates kits in screen Z. */
const TILT = new THREE.Matrix4().makeRotationX(-0.30).multiply(new THREE.Matrix4().makeRotationY(0.40));
const LIGHT = new THREE.Vector3(-0.30, 0.78, 0.78).normalize();
const INKC = new THREE.Color(INKHEX);

function col(hex, k) { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; }
function bandOf(nx, ny, nz) {
  const l = nx * LIGHT.x + ny * LIGHT.y + nz * LIGHT.z;
  return l > 0.72 ? BAND[0] : l > 0.30 ? BAND[1] : BAND[2];
}

/* Low-poly primitives, faceted on purpose. */
const PRIM = {
  box: () => new THREE.BoxGeometry(1, 1, 1),
  sph: () => new THREE.IcosahedronGeometry(0.5, 1),
  sphLo: () => new THREE.IcosahedronGeometry(0.5, 0),      // shells and small parts
  cap: () => new THREE.CapsuleGeometry(0.5, 1, 3, 7),
  cyl: () => new THREE.CylinderGeometry(0.5, 0.5, 1, 9, 1, false),
  cone: () => new THREE.ConeGeometry(0.5, 1, 9),
  pri: () => new THREE.CylinderGeometry(0.5, 0.5, 1, 3, 1, false),
  oct: () => new THREE.CylinderGeometry(0.5, 0.5, 1, 8, 1, false),
  hex: () => new THREE.CylinderGeometry(0.5, 0.5, 1, 6, 1, false),
  ring: () => new THREE.TorusGeometry(0.4, 0.11, 4, 9),
  quad: () => new THREE.PlaneGeometry(1, 1)
};

/* part helpers so the cast tables stay readable */
const P = (p, x, y, z, w, h, d, c, o) => Object.assign({ p, x, y, z, w, h, d: d === undefined ? w : d, c }, o || {});
const B = (x, y, z, w, h, d, c, o) => P('box', x, y, z, w, h, d, c, o);
const S = (x, y, z, r, c, o) => P('sph', x, y, z, r, r, r, c, o);
const E = (x, y, z, w, h, c, o) => P('sph', x, y, z, w, h, w * 0.7, c, o);
const CP = (x, y, z, w, h, c, o) => P('cap', x, y, z, w, h, w, c, o);
const CY = (x, y, z, r, h, c, o) => P('cyl', x, y, z, r * 2, h, r * 2, c, o);
const CN = (x, y, z, r, h, c, o) => P('cone', x, y, z, r * 2, h, r * 2, c, o);
const RG = (x, y, z, r, c, o) => P('ring', x, y, z, r, r, r, c, o);
const OC = (x, y, z, r, h, c, o) => P('oct', x, y, z, r * 2, h, r * 2, c, o);
const HX = (x, y, z, r, h, c, o) => P('hex', x, y, z, r * 2, h, r * 2, c, o);
const PR = (x, y, z, r, h, c, o) => P('pri', x, y, z, r * 2, h, r * 2, c, o);
const UP = Math.PI / 2;   // lay a cylinder/cone on its side (points along Z)

/* one part -> [shell, body] non-indexed, vertex-coloured */
function partGeo(pt, ink, pad) {
  /* Shells are pure silhouette, so they get the cheapest primitive; a tiny part
     does not need a faceted sphere either.
     Careful: polyhedra (icosahedron, capsule) ship non-indexed and
     toNonIndexed() then returns the SAME object — cloning keeps shell and body
     as separate geometries, each transformed exactly once. */
  const big = Math.max(pt.w, pt.h, pt.d) >= 16;
  const srcOf = kind => {
    const g0 = PRIM[kind]();
    const ni = g0.index ? g0.toNonIndexed() : g0.clone();
    g0.dispose();
    return ni;
  };
  const bodyKey = (pt.p === 'sph' && !big) ? 'sphLo' : pt.p;
  const shellKey = pt.p === 'sph' ? 'sphLo' : pt.p;   /* shells keep the part's shape */
  const size = new THREE.Matrix4().makeScale(pt.w, pt.h, pt.d);
  const rot = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(pt.rx || 0, pt.ry || 0, pt.rz || 0));
  const M = size.premultiply(rot).premultiply(TILT);
  const body = srcOf(bodyKey);
  body.applyMatrix4(M);
  body.translate(pt.x, pt.y, pt.z);

  const base = col(pt.c, 1), bc = new Float32Array(body.attributes.position.count * 3), na = body.attributes.normal.array;
  for (let i = 0; i < body.attributes.position.count; i++) {
    const k = bandOf(na[i * 3], na[i * 3 + 1], na[i * 3 + 2]) * (pt.k === undefined ? 1 : pt.k);
    bc[i * 3] = base[0] * k; bc[i * 3 + 1] = base[1] * k; bc[i * 3 + 2] = base[2] * k;
  }
  body.setAttribute('color', new THREE.BufferAttribute(bc, 3));

  const shell = srcOf(shellKey);
  shell.applyMatrix4(new THREE.Matrix4().makeScale(
    (pt.w + pad * 2) / Math.max(pt.w, 0.01), (pt.h + pad * 2) / Math.max(pt.h, 0.01),
    (pt.d + pad * 2) / Math.max(pt.d, 0.01)).premultiply(M));
  shell.translate(pt.x, pt.y, pt.z);
  const ic = col(pt.ink || ink, 1), sc = new Float32Array(shell.attributes.position.count * 3);
  for (let i = 0; i < shell.attributes.position.count; i++) { sc[i * 3] = ic[0]; sc[i * 3 + 1] = ic[1]; sc[i * 3 + 2] = ic[2]; }
  shell.setAttribute('color', new THREE.BufferAttribute(sc, 3));
  return [shell, body];
}

/* concat shell/body pairs in part order = painter's algorithm */
function mergeGeos(list) {
  let nv = 0;
  for (const g of list) nv += g.attributes.position.count;
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), cr = new Float32Array(nv * 3), idx = new Uint32Array(nv);
  let v = 0;
  for (const g of list) {
    const c = g.attributes.position.count;
    pos.set(g.attributes.position.array, v * 3);
    nor.set(g.attributes.normal.array, v * 3);
    cr.set(g.attributes.color.array, v * 3);
    for (let i = 0; i < c; i++) idx[v + i] = v + i;
    v += c;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.BufferAttribute(cr, 3));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  for (const g of list) g.dispose();
  return out;
}

function buildKitGeo(parts, opts) {
  const ink = (opts && opts.ink) || INKHEX;
  const pad = opts && opts.pad !== undefined ? opts.pad : 2.4;
  const out = [];
  for (const pt of parts) { const g = partGeo(pt, ink, pad); out.push(g[0], g[1]); }
  return mergeGeos(out);
}

/* One InstancedMesh per kit type: tint per instance (hit flash), opacity per
   kit (invulnerability flicker). */
class Kit {
  constructor(name, parts, max, opts) {
    this.name = name; this.max = max; this.n = 0;
    this.geo = buildKitGeo(parts, opts);
    this.mat = new THREE.MeshBasicMaterial({
      vertexColors: true, transparent: true, opacity: 1, side: THREE.DoubleSide,
      depthTest: false, depthWrite: false, toneMapped: false
    });
    this.mesh = new THREE.InstancedMesh(this.geo, this.mat, max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3);
    this.mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    this.icol = this.mesh.instanceColor.array;
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = (opts && opts.order) || 15;
    this.drop = 0;
    this.mesh.count = 0;
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion();
    this._p = new THREE.Vector3(); this._s = new THREE.Vector3();
    scene.add(this.mesh);
    const bb = this.geo.boundingBox = (this.geo.computeBoundingBox(), this.geo.boundingBox);
    this.w = bb.max.x - bb.min.x; this.h = bb.max.y - bb.min.y;
    KITS[name] = this;
  }
  begin() { this.n = 0; }
  /* cx/cy screen px, sx/sy scale (1 = authored size), rot = screen Z spin.
     tint multiplies the baked colours; boost > 1 blows it out for hit flashes. */
  push(cx, cy, sx, sy, rot, tint, boost) {
    const n = this.n;
    if (n >= this.max) { this.drop++; return; }
    this._q.setFromAxisAngle(ZAXIS, rot || 0);
    this._p.set(cx, cy, 0);
    this._s.set(sx === undefined ? 1 : sx, sy === undefined ? sx : sy, Math.min(sx || 1, sy === undefined ? sx : sy));
    this.mesh.setMatrixAt(n, this._m.compose(this._p, this._q, this._s));
    const c = tint ? col(tint, 1) : WHITE3;
    const k = boost === undefined ? 1 : boost;
    this.icol[n * 3] = c[0] * k; this.icol[n * 3 + 1] = c[1] * k; this.icol[n * 3 + 2] = c[2] * k;
    this.n++;
  }
  end() {
    this.mesh.count = this.n;
    if (this.n) { this.mesh.instanceMatrix.needsUpdate = true; this.mesh.instanceColor.needsUpdate = true; }
  }
}
const KITS = Object.create(null);
function kitBeginAll() { for (const k in KITS) KITS[k].begin(); }
function kitEndAll() { for (const k in KITS) KITS[k].end(); }
