/* =====================================================================
   The kit every connector model is built from, in real millimetres.

   Convention (the same as the E4 parts this borrows): the mating face
   points +Z, up is +Y, width is X. A plug's metal or plastic nose runs
   from z = 0 forward; its overmold and cable run back down -Z. A port
   sits in a small panel whose face is the z = 0 plane.

   Dimensions come from the connector standards (TIA-568, IEC 60320,
   NEMA WD 6, the USB, HDMI, DisplayPort and DVI specifications, the
   D-subminiature and mini-DIN drawings). No brand names or logos on any
   model: the owner's ruling.
   ===================================================================== */
import * as THREE from "three";
import { mat, rbox, box, cyl, at } from "./e4/parts.js";
export { mat, rbox, box, cyl, at };

export const C = {
  black: 0x1b1c1f, charcoal: 0x2a2c30, grey: 0x6b7077, lightGrey: 0xb9bdc2, white: 0xeeede8, beige: 0xd8ccb0,
  ivory: 0xe9e2cc, nickel: 0xc9cdd2, gold: 0xd9ad48, copper: 0xc97a3d, hole: 0x050506, insul: 0x232427,
  usb3: 0x1f5fd6, purple: 0x6a3d9a, green: 0x2a9a3d, yellow: 0xf0c419, red: 0xc8302b, blue: 0x2557d6,
  orange: 0xe8741a, pink: 0xe58fb4, aqua: 0x2fb7c4, apc: 0x1f9e46, smBlue: 0x2c5fd0
};

/* finishes */
export const nickel = () => { const m = mat(0x9ea4ab, { metal: 0.85, rough: 0.36 }); m.envMapIntensity = 0.55; return m; };
export const steel = () => mat(0xaeb3b9, { metal: 0.8, rough: 0.36 });
export const brass = () => mat(0xc9a35a, { metal: 0.85, rough: 0.3 });
export const goldM = () => mat(C.gold, { metal: 0.7, rough: 0.28 });
export const plastic = (c, rough) => mat(c, { rough: rough == null ? 0.5 : rough, grain: 0.06 });
export const holeM = () => mat(C.hole, { rough: 1, grain: false });

/* ---------- 2D outlines, centred on 0,0 ---------- */
export function rr(w, h, r) {
  const p = new THREE.Shape(), x = -w / 2, y = -h / 2; r = Math.max(0, Math.min(r || 0, w / 2 - 0.001, h / 2 - 0.001));
  p.moveTo(x + r, y); p.lineTo(x + w - r, y); if (r) p.quadraticCurveTo(x + w, y, x + w, y + r);
  p.lineTo(x + w, y + h - r); if (r) p.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  p.lineTo(x + r, y + h); if (r) p.quadraticCurveTo(x, y + h, x, y + h - r);
  p.lineTo(x, y + r); if (r) p.quadraticCurveTo(x, y, x + r, y);
  return p;
}
export function poly(pts) { const p = new THREE.Shape(); pts.forEach(function (q, i) { if (i) p.lineTo(q[0], q[1]); else p.moveTo(q[0], q[1]); }); p.closePath(); return p; }
export function circle(r, cx, cy) { const p = new THREE.Shape(); p.absarc(cx || 0, cy || 0, r, 0, Math.PI * 2, false); return p; }
/* a rectangle with its corners cut: c = [top-left, top-right, bottom-right, bottom-left] as [dx, dy] or a number */
export function chamfered(w, h, c) {
  const k = (c || []).map(function (v) { return v == null ? [0, 0] : (typeof v === "number" ? [v, v] : v); });
  while (k.length < 4) k.push([0, 0]);
  const x = w / 2, y = h / 2, pts = [];
  pts.push([-x + k[0][0], y]); pts.push([x - k[1][0], y]); if (k[1][0] || k[1][1]) pts.push([x, y - k[1][1]]);
  pts.push([x, -y + k[2][1]]); if (k[2][0] || k[2][1]) pts.push([x - k[2][0], -y]);
  pts.push([-x + k[3][0], -y]); if (k[3][0] || k[3][1]) pts.push([-x, -y + k[3][1]]);
  pts.push([-x, y - k[0][1]]);
  const out = []; pts.forEach(function (q) { const l = out[out.length - 1]; if (!l || Math.abs(l[0] - q[0]) > 1e-6 || Math.abs(l[1] - q[1]) > 1e-6) out.push(q); });
  return poly(out);
}
/* the D of a D-subminiature shell: wider at the top, sides sloping 10 degrees, corners rounded */
export function dShape(wTop, h, r) {
  const t = Math.tan(10 * Math.PI / 180), wb = wTop - 2 * h * t, s = new THREE.Shape(), y = h / 2;
  r = r == null ? 1 : r;
  const P = [[-wTop / 2, y], [wTop / 2, y], [wb / 2, -y], [-wb / 2, -y]];
  /* rounded corners: walk each corner with a quadratic through the vertex */
  const n = P.length;
  for (let i = 0; i < n; i++) {
    const a = P[(i + n - 1) % n], b = P[i], c = P[(i + 1) % n];
    const da = Math.hypot(a[0] - b[0], a[1] - b[1]), dc = Math.hypot(c[0] - b[0], c[1] - b[1]);
    const p0 = [b[0] + (a[0] - b[0]) * r / da, b[1] + (a[1] - b[1]) * r / da], p1 = [b[0] + (c[0] - b[0]) * r / dc, b[1] + (c[1] - b[1]) * r / dc];
    if (i === 0) s.moveTo(p0[0], p0[1]); else s.lineTo(p0[0], p0[1]);
    s.quadraticCurveTo(b[0], b[1], p1[0], p1[1]);
  }
  s.closePath(); return s;
}
export function asHole(shape) { const p = new THREE.Path(); p.curves = shape.curves.slice(); p.currentPoint = shape.currentPoint; return p; }
export function scaleShape(shape, k, dx, dy) {
  const pts = shape.getPoints(24).map(function (v) { return [v.x * k + (dx || 0), v.y * k + (dy || 0)]; });
  return poly(pts);
}
/* offset an outline outward (d > 0) or inward (d < 0), for a shell's wall */
export function grow(shape, d) {
  const pts = shape.getPoints(32), n = pts.length - (pts[0].equals(pts[pts.length - 1]) ? 1 : 0), out = [];
  let area = 0; for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; area += a.x * b.y - b.x * a.y; }
  const sgn = area > 0 ? 1 : -1;
  for (let i = 0; i < n; i++) {
    const a = pts[(i + n - 1) % n], b = pts[i], c = pts[(i + 1) % n];
    const n1 = new THREE.Vector2(b.y - a.y, a.x - b.x).normalize().multiplyScalar(sgn), n2 = new THREE.Vector2(c.y - b.y, b.x - c.x).normalize().multiplyScalar(sgn);
    const m = n1.clone().add(n2); const len = m.length();
    if (len < 1e-6) { out.push([b.x + n1.x * d, b.y + n1.y * d]); continue; }
    m.divideScalar(len); const cos = Math.max(0.35, m.dot(n1));
    out.push([b.x + m.x * d / cos, b.y + m.y * d / cos]);
  }
  return poly(out);
}

/* ---------- solids ---------- */
/* extrude an outline from z0 forward to z1 */
export function prism(shape, z0, z1, m, o = {}) {
  const geo = new THREE.ExtrudeGeometry(shape, { depth: z1 - z0, bevelEnabled: !!o.bevel, bevelSize: o.bevel || 0, bevelThickness: o.bevel || 0, bevelSegments: 2, curveSegments: o.seg || 16 });
  const me = new THREE.Mesh(geo, m); me.position.z = z0; return me;
}
/* a hollow sleeve: outline `outer` with `inner` cut out, from z0 to z1 */
export function sleeve(outer, inner, z0, z1, m, o = {}) {
  const s = outer.clone ? outer.clone() : outer; s.holes = [asHole(inner)];
  return prism(s, z0, z1, m, o);
}
/* a flat face, facing +Z, at z */
export function face(shape, z, m) { const me = new THREE.Mesh(new THREE.ShapeGeometry(shape, 16), m); me.position.z = z; return me; }
/* a plate with holes cut in it, d thick, its front at z */
export function platePierced(outer, holes, z, d, m) {
  const s = outer.clone ? outer.clone() : outer; s.holes = holes.map(asHole);
  return prism(s, z - d, z, m);
}
/* a round pin along Z, from z0 to z1, with a rounded tip */
export function pinZ(x, y, r, z0, z1, m) {
  const g = new THREE.Group();
  g.add(at(cyl(r, z1 - z0 - r * 0.6, m, 16), x, y, (z0 + z1 - r * 0.6) / 2, Math.PI / 2));
  g.add(at(new THREE.Mesh(new THREE.SphereGeometry(r, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), m), x, y, z1 - r * 0.6, Math.PI / 2));
  return g;
}
/* a round hole drawn on a face: a dark disc with a lighter rim */
export function socketHole(x, y, r, z, rimColor) {
  const g = new THREE.Group();
  g.add(at(new THREE.Mesh(new THREE.CircleGeometry(r, 20), holeM()), x, y, z + 0.02));
  if (rimColor != null) g.add(at(new THREE.Mesh(new THREE.RingGeometry(r, r + 0.18, 20), mat(rimColor, { metal: 0.8, rough: 0.3 })), x, y, z + 0.03));
  return g;
}
export function rectHole(x, y, w, h, z) { return at(new THREE.Mesh(new THREE.PlaneGeometry(w, h), holeM()), x, y, z + 0.02); }

/* ---------- the back of a plug ----------
   An overmold: a rounded block from z = 0 back to z = -len, w x h, then a
   strain relief tapering to the cable, then a short length of cable.
   o.taper: how much narrower the back end is (0..0.4); o.grip: ridges;
   o.cableR: cable radius; o.cable: cable colour; o.relief: relief length. */
export function overmold(w, h, len, color, o = {}) {
  const g = new THREE.Group(), m = plastic(color, o.rough);
  const tp = o.taper || 0;
  if (tp) {
    const s = rr(w, h, o.r == null ? Math.min(w, h) * 0.22 : o.r), b = rr(w * (1 - tp), h * (1 - tp * 0.5), (o.r == null ? Math.min(w, h) * 0.22 : o.r) * (1 - tp));
    const geo = loft(s, b, len, 24);
    const me = new THREE.Mesh(geo, m); me.position.z = -len; g.add(me);
  } else g.add(at(rbox(w, h, len, o.r == null ? Math.min(w, h) * 0.22 : o.r, m), 0, 0, -len / 2));
  if (o.grip) for (let k = 0; k < o.grip; k++) [-1, 1].forEach(function (sd) { g.add(at(rbox(0.8, h * 0.62, 1.1, 0.3, m), sd * (w / 2 * (1 - tp * (0.25 + k / o.grip * 0.5))), 0, -len * 0.3 - k * 2.2)); });
  const cr = o.cableR || 2.6, rl = o.relief == null ? 12 : o.relief, rs = Math.min(w * (1 - tp), h) * 0.42;
  if (rl > 0) {
    const pts = []; for (let k = 0; k <= 12; k++) { const t = k / 12; pts.push(new THREE.Vector2(THREE.MathUtils.lerp(rs, cr * 1.15, Math.pow(t, 0.8)), -t * rl)); }
    const relief = new THREE.Mesh(new THREE.LatheGeometry(pts, 32), m); relief.rotation.x = -Math.PI / 2; relief.position.z = -len; g.add(relief);
    for (let k = 1; k < 5; k++) { const t = k / 5; g.add(at(new THREE.Mesh(new THREE.TorusGeometry(THREE.MathUtils.lerp(rs, cr * 1.15, Math.pow(t, 0.8)) * 0.98, 0.25, 6, 32), m), 0, 0, -len - t * rl)); }
  }
  g.add(cableTail(cr, -len - rl, o.cableLen == null ? 18 : o.cableLen, o.cable == null ? color : o.cable));
  return g;
}
/* a loft between two outlines with the same point count, from z = 0 (a) to z = len (b) */
export function loft(a, b, len, n) {
  const pa = a.getSpacedPoints(n * 4), pb = b.getSpacedPoints(n * 4), N = pa.length, pos = [], idx = [];
  for (let i = 0; i < N; i++) { pos.push(pb[i].x, pb[i].y, 0); pos.push(pa[i].x, pa[i].y, len); }
  for (let i = 0; i < N - 1; i++) { const q = i * 2; idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
  /* caps */
  const capA = new THREE.ShapeGeometry(a, 16), capB = new THREE.ShapeGeometry(b, 16);
  capA.translate(0, 0, len);   /* the front cap faces +Z as made; the back one is turned to face -Z */
  const merged = mergeGeos([geo, capA, flipFaces(capB)]); merged.computeVertexNormals(); return merged;
}
function flipFaces(g) { const ix = g.index.array; for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; } return g; }
export function mergeGeos(list) {
  const pos = [], idx = []; let off = 0;
  list.forEach(function (g) { g = g.index ? g : g.toNonIndexed(); const p = g.attributes.position.array; for (let i = 0; i < p.length; i++) pos.push(p[i]); const n = p.length / 3; if (g.index) { const ia = g.index.array; for (let i = 0; i < ia.length; i++) idx.push(ia[i] + off); } else for (let i = 0; i < n; i++) idx.push(i + off); off += n; });
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); return geo;
}
/* a straight length of round cable from z0 back by len, with a clean cut end */
export function cableTail(r, z0, len, color) {
  const g = new THREE.Group(), m = mat(color, { rough: 0.62, grain: 0.05 });
  g.add(at(cyl(r, len, m, 32), 0, 0, z0 - len / 2, Math.PI / 2));
  return g;
}
/* a flat panel for a port to sit in: w x h, t thick, its face at z = 0, with an opening shaped `hole` */
export function panel(w, h, hole, color, o = {}) {
  const g = new THREE.Group(), m = o.metal ? mat(color, { metal: 0.7, rough: 0.42 }) : plastic(color, 0.55);
  const s = rr(w, h, o.r == null ? 2 : o.r); if (hole) s.holes = [asHole(hole)];
  g.add(prism(s, -(o.t || 2), 0, m));
  return g;
}
/* the dark cavity behind an opening, depth d */
export function cavity(hole, d) {
  const g = new THREE.Group();
  g.add(sleeve(grow(hole, 0.4), hole, -d, 0, mat(0x0d0e10, { rough: 0.9, grain: false })));
  g.add(face(hole, -d, holeM()));
  return g;
}
/* a cable-mount D-sub thumbscrew: knurled head behind, threaded shank forward */
export function thumbscrew(x, zFlange, color) {
  const g = new THREE.Group(), m = color != null ? plastic(color) : steel();
  g.add(at(cyl(1.6, 9, steel(), 12), x, 0, zFlange + 1.5, Math.PI / 2));
  for (let k = 0; k < 6; k++) g.add(at(new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.16, 4, 16), steel()), x, 0, zFlange + 0.6 + k * 1.1));
  g.add(at(cyl(3.6, 6, m, 18), x, 0, zFlange - 6, Math.PI / 2));
  for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2; g.add(at(box(0.35, 0.35, 5.6, m), x + Math.cos(a) * 3.6, Math.sin(a) * 3.6, zFlange - 6)); }
  return g;
}
