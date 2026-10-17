/* =====================================================================
   One builder per connector in the Cabling gallery, keyed by the id the
   page uses. Each returns a THREE.Group in millimetres, mating face +Z.
   ===================================================================== */
import * as THREE from "three";
import { C, mat, rbox, box, cyl, at, nickel, steel, goldM, plastic, holeM, rr, poly, circle, chamfered, dShape, grow,
  prism, sleeve, face, platePierced, pinZ, socketHole, rectHole, overmold, cableTail, panel, cavity, thumbscrew } from "./kit.js";
import { rj45Plug } from "./e4/cables.js";

/* ---------- shared shapes for the shelled plugs ---------- */
/* a plug nose: a metal shell of outline `out` from z = 0 to z = len, the
   insert inside it filling to `inset` mm behind the lip, and whatever the
   caller puts in the insert */
function shellNose(out, len, wall, o = {}) {
  const g = new THREE.Group(), inner = grow(out, -wall);
  g.add(sleeve(out, inner, 0, len, o.shellMat || nickel()));
  if (o.insert !== false) g.add(prism(inner, 0, len - (o.inset == null ? 0.6 : o.inset), plastic(o.insertColor == null ? C.black : o.insertColor, 0.55)));
  return g;
}

/* ---------- HDMI Type A plug ----------
   13.9 x 4.45 mm shell, the two lower corners cut so it only goes in one
   way up; inside, the plastic carrier with the slot the port's tongue
   slides into, 10 contacts above the slot and 9 below */
function hdmiA() {
  const g = new THREE.Group();
  const out = chamfered(13.9, 4.45, [0, 0, [1.75, 1.3], [1.75, 1.3]]);
  g.add(shellNose(out, 11, 0.3, { inset: 1.6 }));
  /* the slot in the carrier, and the contacts on its top and bottom walls */
  g.add(at(box(10.8, 1.55, 6, holeM()), 0, 0.35, 11 - 1.6 - 3 + 0.02));
  for (let k = 0; k < 10; k++) g.add(at(box(0.32, 0.12, 4.5, goldM()), (k - 4.5) * 1.0, 0.35 + 0.72, 11 - 1.6 - 2.4));
  for (let k = 0; k < 9; k++) g.add(at(box(0.32, 0.12, 4.5, goldM()), (k - 4) * 1.0, 0.35 - 0.72, 11 - 1.6 - 2.4));
  /* the spring tabs pressed into the shell */
  [-3.6, 3.6].forEach(function (x) { g.add(at(box(1.6, 0.25, 2.6, nickel()), x, 2.3, 6.5)); g.add(at(box(1.6, 0.25, 2.6, nickel()), x, -2.3, 6.5)); });
  g.add(overmold(20, 10.5, 24, C.black, { taper: 0.18, grip: 4, cableR: 3.6, relief: 10 }));
  return g;
}

/* ---------- DE-9 (DB9) male, on a cable with a moulded backshell ----------
   the D-shell 16.9 mm across the top, nine pins in two rows (5 over 4) at
   2.77 mm pitch, the 30.8 mm flange, and the two thumbscrews that hold it */
function de9Male() {
  const g = new THREE.Group();
  const out = dShape(16.9, 8.0, 1.1), inner = grow(out, -0.35);
  g.add(sleeve(out, inner, 0, 6.0, nickel()));
  g.add(prism(inner, 0, 2.6, plastic(C.black, 0.6)));                 /* the insulator the pins stand out of */
  for (let k = 0; k < 9; k++) { const top = k < 5, x = top ? (2 - k) * 2.77 : (7.5 - k) * 2.77 - 2.77 * 4; g.add(pinZ(top ? (k - 2) * 2.77 : (k - 6.5) * 2.77, top ? 1.42 : -1.42, 0.5, 2.6, 6.0, goldM())); void x; }
  /* the flange, with the screw holes */
  const fl = rr(30.8, 12.5, 1.2); fl.holes = [grow(out, 0.05)].map(function (s) { const p = new THREE.Path(); p.curves = s.curves; return p; });
  g.add(prism(fl, -0.6, 0, nickel()));
  /* the backshell: grey moulding, wider than the flange, tapering to the cable */
  g.add(at(overmold(33, 15.5, 26, 0x8f959c, { taper: 0.32, cableR: 3.4, relief: 9, cable: 0x80868d, r: 2.2 }), 0, 0, -0.6));
  [-12.5, 12.5].forEach(function (x) { g.add(thumbscrew(x, -0.6, 0x8f959c)); });
  return g;
}

/* ---------- NEMA 5-15P, the US three-prong plug ----------
   two flat blades 12.7 mm apart (the neutral 7.9 mm wide, the hot 6.35),
   the round ground pin 4.8 mm across, below them in this view */
function nema515P() {
  const g = new THREE.Group(), body = plastic(C.black, 0.5);
  g.add(at(rbox(30, 28, 10, 3, body), 0, 0, -5));
  g.add(face(rr(27, 25, 2.5), 0.01, plastic(0x222327, 0.6)));
  const bm = mat(0xc9a35a, { metal: 0.9, rough: 0.28 });
  [[-6.35, 6.35], [6.35, 7.9]].forEach(function (b) {
    const s = rr(b[1], 1.5, 0.3), hole = circle(1.6, 0, 0); void hole;
    const blade = prism(s, 0, 15.9, bm); blade.rotation.z = Math.PI / 2; blade.position.set(b[0], 3.2, 0); g.add(blade);
    g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 1.6, 16), holeM()), b[0], 3.2, 12.2, 0, 0, Math.PI / 2));
  });
  g.add(pinZ(0, -8.7, 2.4, 0, 18.8, bm));
  g.add(at(overmold(26, 22, 14, C.black, { taper: 0.25, cableR: 3.7, relief: 12 }), 0, 0, -10));
  return g;
}

/* ---------- RJ45, from the E4 lab's plug ---------- */
function rj45() { const g = new THREE.Group(), p = rj45Plug({ jacketLen: 30 }); p.position.z = -10.75; g.add(p); return g; }

export const MODELS = { "hdmi-a": hdmiA, "de9-m": de9Male, "nema-5-15p": nema515P, "rj45": rj45 };
