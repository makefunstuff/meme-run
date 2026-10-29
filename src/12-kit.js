/* =========================================================================
   3D KIT LAYER
   The cast is built from primitives rendered through the orthographic camera:
   a part seen face-on is a flat shape — circle, square, pill — while the
   extruded sides read as volume.
   The primitives are *pillow* shapes: a rounded box and a smooth sphere, both
   generated from an icosphere with analytic smooth normals, so parts read as
   injection-moulded plastic toys rather than faceted rocks.
   Shading is baked into vertex colours as four cel bands from a fixed key
   light, with a cool fill on the shadow side, contact darkening toward the
   bottom of every part and a rim highlight on the edge away from the key.
   Every part carries an inflated ink-coloured shell (the cartoon outline);
   tiny face features opt out of it with `ink: 0` so eyes and glints stay crisp.
   No depth buffer: each kit is one merged geometry with triangles ordered
   shell-first, body-after, which is a painter's algorithm for a sticker.
   One kit type = one InstancedMesh = one draw call.
   ========================================================================= */

const ZAXIS = new THREE.Vector3(0, 0, 1);
const WHITE3 = [1, 1, 1];
/* Fixed world tilt, baked in at build time so the top and one side of every
   volume are visible. The game only ever rotates kits in screen Z. */
const TILT = new THREE.Matrix4().makeRotationX(-0.26).multiply(new THREE.Matrix4().makeRotationY(0.34));
const INKHEX = '#1d1120';
const INKC = new THREE.Color(INKHEX);
const LIGHT = new THREE.Vector3(-0.46, 0.70, 0.55).normalize();   // key, upper-left-front
const RIM = new THREE.Vector3(0.78, 0.24, 0.42).normalize();      // rim, lower-right-front

/* per-channel band multipliers: a warm key, a neutral mid, a cool fill so the
   shadow side keeps colour instead of turning to mud, and a deep band for the
   underside. All are >0 multipliers on the part's base colour. */
const B_LIT = [1.40, 1.30, 1.11];
const B_MID = [1.03, 1.01, 1.00];
const B_SH = [0.85, 0.91, 1.10];
const B_DEEP = [0.70, 0.76, 0.98];
const RIM_T = [1.06, 1.12, 1.26];
const RIM_K = 0.40;

function col(hex, k) { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; }

/* cel band + contact darkening + rim, as a per-channel multiplier */
const _mul = [0, 0, 0];
function bandOf(nx, ny, nz, vY) {
  const key = nx * LIGHT.x + ny * LIGHT.y + nz * LIGHT.z;
  const m = key > 0.62 ? B_LIT : key > 0.20 ? B_MID : key > -0.18 ? B_SH : B_DEEP;
  const ao = 1 - 0.16 * (0.5 - (vY || 0));            // vY: part-local -0.5..0.5
  const r = Math.max(0, (nx * RIM.x + ny * RIM.y + nz * RIM.z) - 0.52) / 0.48;
  const s = r * r * RIM_K;
  _mul[0] = m[0] * ao + s * RIM_T[0];
  _mul[1] = m[1] * ao + s * RIM_T[1];
  _mul[2] = m[2] * ao + s * RIM_T[2];
  return _mul;
}

/* ---- primitives -------------------------------------------------------
   Every primitive is generated in unit space (x,y,z in -0.5..0.5 for boxes
   and spheres) with analytic smooth normals, so shading is soft and the
   silhouette is round. detail is chosen from the part's on-screen size. */

/* pillow box: the icosphere direction d maps to the offset surface of the core
   box (half-extent 0.5 - r) inflated by r. n = d, so every face is smooth. */
function pillowGeo(detail, r) {
  const g = new THREE.IcosahedronGeometry(0.5, detail);
  const p = g.attributes.position.array;
  const n = new Float32Array(p.length);
  const k = 0.5 - r;
  for (let i = 0; i < p.length; i += 3) {
    const x = p[i], y = p[i + 1], z = p[i + 2];
    const L = Math.max(Math.abs(x), Math.abs(y), Math.abs(z)) || 1e-6;
    const d = Math.sqrt(x * x + y * y + z * z) || 1e-6;
    const ux = (x / L) * k, uy = (y / L) * k, uz = (z / L) * k;
    const s = r / d;
    p[i] = ux + x * s; p[i + 1] = uy + y * s; p[i + 2] = uz + z * s;
    n[i] = x / d; n[i + 1] = y / d; n[i + 2] = z / d;
  }
  g.setAttribute('normal', new THREE.BufferAttribute(n, 3));
  return g;
}
function ballGeo(detail) {
  const g = new THREE.IcosahedronGeometry(0.5, detail);
  const p = g.attributes.position.array;
  const n = new Float32Array(p.length);
  for (let i = 0; i < p.length; i += 3) {
    const x = p[i], y = p[i + 1], z = p[i + 2];
    const d = Math.sqrt(x * x + y * y + z * z) || 1e-6;
    n[i] = x / d; n[i + 1] = y / d; n[i + 2] = z / d;
  }
  g.setAttribute('normal', new THREE.BufferAttribute(n, 3));
  return g;
}
/* smooth capsule (unit: radius 0.5, cylinder length 1, so y spans -1..1) */
function capsuleGeo(radial, cap) {
  const g = new THREE.CapsuleGeometry(0.5, 1, cap, radial);
  const p = g.attributes.position.array;
  const n = new Float32Array(p.length);
  for (let i = 0; i < p.length; i += 3) {
    const x = p[i], y = p[i + 1], z = p[i + 2];
    const cy = clamp(y, -0.5, 0.5);
    const dx = x, dy = y - cy, dz = z;
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
    n[i] = dx / d; n[i + 1] = dy / d; n[i + 2] = dz / d;
  }
  g.setAttribute('normal', new THREE.BufferAttribute(n, 3));
  return g;
}
/* flat-faceted prism/gem: one normal per triangle */
function flatGeo(g) {
  const ni = g.index ? g.toNonIndexed() : g;
  ni.computeVertexNormals();
  return ni;
}
/* detail ladder: a part of this many world units does not need more faces than
   it has pixels */
const detFor = (size, hi, lo) => (size >= 22 ? hi : size >= 11 ? (hi + lo) >> 1 : lo);

/* kind -> unit geometry. `smooth` parts get their normals from the analytic
   functions above, faceted parts from flat face normals. */
function primGeo(kind, size) {
  const d = detFor(size, 2, 0);
  switch (kind) {
    case 'box': return pillowGeo(detFor(size, 2, 1), 0.17);
    case 'bx': return pillowGeo(detFor(size, 2, 1), 0.05);
    case 'plate': return pillowGeo(detFor(size, 1, 1), 0.10);
    case 'sph': return ballGeo(detFor(size, 2, 0));
    case 'ball': return ballGeo(detFor(size, 3, 1));
    case 'cap': return capsuleGeo(detFor(size, 10, 5), detFor(size, 3, 1));
    case 'cyl': return new THREE.CylinderGeometry(0.5, 0.5, 1, Math.round(clamp(size * 0.9, 8, 18)), 1, false);
    case 'cone': return new THREE.ConeGeometry(0.5, 1, Math.round(clamp(size * 0.9, 8, 18)));
    case 'ring': return new THREE.TorusGeometry(0.4, 0.11, 5, Math.round(clamp(size * 0.7, 8, 16)));
    case 'pri': return flatGeo(new THREE.CylinderGeometry(0.5, 0.5, 1, 3, 1, false));
    case 'hex': return flatGeo(new THREE.CylinderGeometry(0.5, 0.5, 1, 6, 1, false));
    case 'oct': return flatGeo(new THREE.CylinderGeometry(0.5, 0.5, 1, 8, 1, false));
    case 'gem': return flatGeo(new THREE.OctahedronGeometry(0.5, 0));
    case 'quad': return new THREE.PlaneGeometry(1, 1);
    default: return pillowGeo(1, 0.17);
  }
}
const FACETED = { pri: 1, hex: 1, oct: 1, gem: 1, quad: 1 };

/* ---- part helpers so the cast tables stay readable ----
   p = primitive key, x/y/z placement, w/h/d size in world units, c base colour.
   opts: rx/ry/rz rotation, k extra brightness, ink outline pad (0 = no shell),
   sp spherical shells. */
const P = (p, x, y, z, w, h, d, c, o) => Object.assign({ p, x, y, z, w, h, d: d === undefined ? w : d, c }, o || {});
const B = (x, y, z, w, h, d, c, o) => P('box', x, y, z, w, h, d, c, o);
const BX = (x, y, z, w, h, d, c, o) => P('bx', x, y, z, w, h, d, c, o);
const PL = (x, y, z, w, h, d, c, o) => P('plate', x, y, z, w, h, d, c, o);
const S = (x, y, z, r, c, o) => P('sph', x, y, z, r, r, r, c, o);
const BA = (x, y, z, r, c, o) => P('ball', x, y, z, r, r, r, c, o);
const E = (x, y, z, w, h, c, o) => P('sph', x, y, z, w, h, w * 0.7, c, o);
const CP = (x, y, z, w, h, c, o) => P('cap', x, y, z, w, h, w, c, o);
const CY = (x, y, z, r, h, c, o) => P('cyl', x, y, z, r * 2, h, r * 2, c, o);
const CN = (x, y, z, r, h, c, o) => P('cone', x, y, z, r * 2, h, r * 2, c, o);
const RG = (x, y, z, r, c, o) => P('ring', x, y, z, r, r, r, c, o);
const OC = (x, y, z, r, h, c, o) => P('oct', x, y, z, r * 2, h, r * 2, c, o);
const HX = (x, y, z, r, h, c, o) => P('hex', x, y, z, r * 2, h, r * 2, c, o);
const PR = (x, y, z, r, h, c, o) => P('pri', x, y, z, r * 2, h, r * 2, c, o);
const GM = (x, y, z, w, h, d, c, o) => P('gem', x, y, z, w, h, d, c, o);
const UP = Math.PI / 2;   // lay a cylinder/cone on its side (points along Z)

/* one part -> [shell, body] non-indexed, vertex-coloured. Shell first so the
   outline sits behind the body. */
function partGeo(pt, ink, pad) {
  const size = Math.max(pt.w, pt.h, pt.d);
  /* the outline is a line weight, not a fixed plate: scale it with the part so
     a pupil does not get the same ink as a torso */
  const thin = Math.min(pt.w, pt.h, pt.d);
  const pd = pt.ink === 0 ? 0 : pt.ink !== undefined ? pt.ink
    : clamp(thin * 0.11, 0.75, pad === undefined ? 1.9 : pad);

  const rot = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(pt.rx || 0, pt.ry || 0, pt.rz || 0));
  const tiltRot = new THREE.Matrix3().setFromMatrix4(TILT).multiply(new THREE.Matrix3().setFromMatrix4(rot));
  const base = col(pt.c, 1);
  const kk = pt.k === undefined ? 1 : pt.k;

  const body = primGeo(pt.p, size);
  const ni = body.index ? body.toNonIndexed() : body;
  if (body !== ni) body.dispose();
  const bp = ni.attributes.position.array;
  const bn = ni.attributes.normal.array;
  const bc = new Float32Array(bp.length);
  const M = new THREE.Matrix4().makeScale(pt.w, pt.h, pt.d).premultiply(rot).premultiply(TILT);
  const tmp = new THREE.Vector3();
  for (let i = 0; i < bp.length; i += 3) {
    const px = bp[i], py = bp[i + 1], pz = bp[i + 2];
    /* analytic smooth normal in unit space, rotated by tilt*rot (no scale) */
    let nx, ny, nz;
    if (FACETED[pt.p]) { nx = bn[i]; ny = bn[i + 1]; nz = bn[i + 2]; }
    else {
      const d = Math.sqrt(px * px + py * py + pz * pz) || 1e-6;
      nx = px / d; ny = py / d; nz = pz / d;
    }
    tmp.set(nx, ny, nz).applyMatrix3(tiltRot).normalize();
    const m = bandOf(tmp.x, tmp.y, tmp.z, py);
    bc[i] = base[0] * m[0] * kk; bc[i + 1] = base[1] * m[1] * kk; bc[i + 2] = base[2] * m[2] * kk;
    tmp.set(px, py, pz).applyMatrix4(M);
    bp[i] = tmp.x + pt.x; bp[i + 1] = tmp.y + pt.y; bp[i + 2] = tmp.z + pt.z;
  }
  ni.setAttribute('normal', new THREE.BufferAttribute(bn, 3));
  ni.setAttribute('color', new THREE.BufferAttribute(bc, 3));

  if (pd <= 0) return [null, ni];

  /* the shell is pure silhouette: same shape, inflated, coarser than the body,
     one flat ink colour with a soft vertical gradient so the outline is not a
     dead black band */
  const shell = primGeo(pt.p, size * 0.45);
  const si = shell.index ? shell.toNonIndexed() : shell;
  if (shell !== si) shell.dispose();
  const sp = si.attributes.position.array;
  const sc = new Float32Array(sp.length);
  const MS = new THREE.Matrix4().makeScale(
    (pt.w + pd * 2) / Math.max(pt.w, 0.01), (pt.h + pd * 2) / Math.max(pt.h, 0.01),
    (pt.d + pd * 2) / Math.max(pt.d, 0.01)).premultiply(M);
  for (let i = 0; i < sp.length; i += 3) {
    tmp.set(sp[i], sp[i + 1], sp[i + 2]).applyMatrix4(MS);
    sp[i] = tmp.x + pt.x; sp[i + 1] = tmp.y + pt.y; sp[i + 2] = tmp.z + pt.z;
    const g = 0.86 + 0.30 * (sp[i + 1] / Math.max(pt.h, 1) + 0.5);
    sc[i] = INKC.r * g; sc[i + 1] = INKC.g * g; sc[i + 2] = INKC.b * g;
  }
  si.setAttribute('color', new THREE.BufferAttribute(sc, 3));
  return [si, ni];
}

/* concat shell/body pairs in part order = painter's algorithm */
function mergeGeos(list) {
  let nv = 0;
  for (const g of list) if (g) nv += g.attributes.position.count;
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), cr = new Float32Array(nv * 3), idx = new Uint32Array(nv);
  let v = 0;
  for (const g of list) {
    if (!g) continue;
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
  for (const g of list) if (g) g.dispose();
  return out;
}

function buildKitGeo(parts, opts) {
  const ink = (opts && opts.ink) || INKHEX;
  const pad = opts && opts.pad !== undefined ? opts.pad : 1.9;
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
