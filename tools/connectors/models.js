/* =====================================================================
   One builder per connector in the Cabling gallery, keyed by the id the
   page uses. Each returns a THREE.Group in millimetres, mating face +Z.
   ===================================================================== */
import * as THREE from "three";
import { C, mat, rbox, box, cyl, at, nickel, steel, goldM, plastic, holeM, rr, poly, circle, chamfered, dShape, grow,
  prism, sleeve, face, platePierced, pinZ, socketHole, rectHole, overmold, cableTail, panel, cavity, thumbscrew } from "./kit.js";
import { rj45Plug, rj11Plug, coaxF, iecC13 } from "./e4/cables.js";
import { rj45Jack, rj11Jack, fFemale, usbA as usbAPort, usbB as usbBPort, usbC as usbCPort, hdmi as hdmiPort, displayPort as dpPort, audioJack, iecInlet } from "./e4/parts.js";

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
const M = MODELS;

/* =====================================================================
   Ports: the socket on a small piece of the device it lives on
   ===================================================================== */
function onPanel(port, w, h, color, o = {}) {
  const g = new THREE.Group();
  g.add(prism(rr(w, h, o.r == null ? 1.5 : o.r), -(o.t || 3), 0, o.metal ? mat(color, { metal: 0.6, rough: 0.45 }) : plastic(color, 0.6)));
  if (port) g.add(port);
  return g;
}

/* ---------- twisted pair & phone ---------- */
M["rj45-jack"] = () => onPanel(rj45Jack({ leds: true, on: [true, false] }), 30, 24, 0x3b3f45, { metal: true });
M["rj11"] = () => { const g = new THREE.Group(), p = rj11Plug({}); p.position.z = -7.25; g.add(p); return g; };
M["rj11-jack"] = () => onPanel(rj11Jack({}), 26, 20, 0x3b3f45, { metal: true });
/* the loopback plug: an RJ45 nose with a short moulded cap where the cable would be, and a key ring */
M["rj45-loop"] = () => {
  const g = new THREE.Group(), p = rj45Plug({ jacketLen: 1.5 }); p.position.z = -10.75; g.add(p);
  const cap = plastic(C.yellow, 0.45);
  g.add(at(rbox(13.6, 10.6, 13, 2.2, cap), 0, 0.1, -21.5 + 3.5));
  g.add(at(new THREE.Mesh(new THREE.TorusGeometry(5, 0.9, 10, 32), steel()), 0, 0, -31, 0, Math.PI / 2, 0));
  g.add(at(rbox(4, 4, 6, 1.2, cap), 0, 0, -26));
  return g;
};

/* ---------- fiber ---------- */
const ceramic = () => mat(0xf1eee6, { rough: 0.35, grain: false });
function ferrule(r, z0, z1) {
  const g = new THREE.Group();
  g.add(at(cyl(r, z1 - z0, ceramic(), 24), 0, 0, (z0 + z1) / 2, Math.PI / 2));
  g.add(at(new THREE.Mesh(new THREE.CircleGeometry(0.12, 12), mat(0x7a8a99, { rough: 0.2, grain: false })), 0, 0, z1 + 0.01));
  return g;
}
function zipCord(x0, x1, z0, len, color) {
  const g = new THREE.Group(), m = mat(color, { rough: 0.55, grain: 0.04 });
  [x0, x1].forEach(function (x) { g.add(at(cyl(1.0, len, m, 18), x, 0, z0 - len / 2, Math.PI / 2)); });
  g.add(at(box(Math.abs(x1 - x0), 0.5, len, m), (x0 + x1) / 2, 0, z0 - len / 2));
  return g;
}
function taperBoot(r0, r1, z0, len, color) {
  const pts = []; for (let k = 0; k <= 10; k++) { const t = k / 10; pts.push(new THREE.Vector2(THREE.MathUtils.lerp(r0, r1, Math.pow(t, 0.7)), -t * len)); }
  const me = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), plastic(color, 0.45)); me.rotation.x = Math.PI / 2; me.position.z = z0; return me;
}
/* one LC: 4.5 mm square housing, 1.25 mm ferrule, the latch lever on top */
function lcOne(color, bootColor) {
  const g = new THREE.Group(), m = plastic(color, 0.4);
  g.add(at(rbox(4.5, 4.5, 9.5, 0.5, m), 0, 0, -4.75));
  g.add(ferrule(0.625, -1, 1.2));
  g.add(at(box(2.2, 2.2, 0.3, holeM()), 0, 0, 0.02));
  const lever = new THREE.Group(); lever.add(at(box(3.0, 0.8, 9, m), 0, 0, -4.5)); lever.position.set(0, 2.6, -1.2); lever.rotation.x = -0.16; g.add(lever);
  g.add(at(rbox(5.4, 5.6, 6.5, 0.6, m), 0, -0.2, -12.5));
  g.add(taperBoot(2.6, 1.1, -15.5, 16, bootColor));
  return g;
}
M["lc"] = () => {
  const g = new THREE.Group();
  [-3.125, 3.125].forEach(function (x) { const one = lcOne(C.smBlue, 0xeeeeea); one.position.x = x; g.add(one); });
  /* the duplex clip over both, with its trigger pressing both levers */
  g.add(at(rbox(12.6, 2.6, 7, 0.6, plastic(C.smBlue, 0.4)), 0, 3.4, -11.5));
  g.add(at(rbox(9.5, 1.2, 4.5, 0.4, plastic(C.smBlue, 0.4)), 0, 4.3, -8.6, -0.25));
  g.add(zipCord(-3.125, 3.125, -30, 16, C.yellow));
  return g;
};
/* one SC: the square plug frame round the 2.5 mm ferrule, inside the larger grip housing */
function scOne(color) {
  const g = new THREE.Group(), m = plastic(color, 0.45);
  g.add(prism(rr(6.4, 7.4, 0.5), -6, 0, m));
  g.add(at(box(3.8, 3.8, 0.3, holeM()), 0, 0, 0.02));
  g.add(ferrule(1.25, -3, -0.3));
  g.add(at(rbox(8.6, 8.6, 13, 1, m), 0, 0, -11.5));
  for (let k = 0; k < 6; k++) [-1, 1].forEach(function (sd) { g.add(at(box(0.5, 6.4, 0.8, m), sd * 4.35, 0, -15 + k * 1.6)); });
  g.add(at(box(2.2, 0.9, 9, m), 0, 4.6, -10));
  g.add(taperBoot(3.6, 1.4, -18, 16, color));
  return g;
}
M["sc"] = () => {
  const g = new THREE.Group();
  [-6.35, 6.35].forEach(function (x) { const one = scOne(C.beige); one.position.x = x; g.add(one); });
  g.add(at(rbox(21.5, 3.2, 8, 0.6, plastic(C.beige, 0.45)), 0, -5.6, -11));
  g.add(zipCord(-6.35, 6.35, -34, 18, C.orange));
  return g;
};
/* ST: the knurled bayonet nut with its J-slot, a long 2.5 mm ferrule, the key */
M["st"] = () => {
  const g = new THREE.Group(), n = nickel();
  g.add(sleeve(circle(4.4), circle(3.5), -9, 0, n));
  for (let k = 0; k < 36; k++) { const a = k / 36 * Math.PI * 2; g.add(at(box(0.3, 0.3, 4.5, n), Math.cos(a) * 4.42, Math.sin(a) * 4.42, -6.5)); }
  [0, Math.PI].forEach(function (a) { g.add(at(box(1.3, 0.4, 3.2, holeM()), Math.cos(a + Math.PI / 2) * 4.3 * 0, Math.sin(a + Math.PI / 2) * 4.3, -1.6, 0, 0, 0)); });
  g.add(face(circle(3.5), -6, holeM()));
  g.add(at(cyl(1.7, 7, n, 20), 0, 0, -2.5, Math.PI / 2));
  g.add(at(box(1.0, 1.0, 3, n), 0, 2.0, -1.5));
  g.add(ferrule(1.25, -1, 8.5));
  g.add(at(cyl(3.3, 5, plastic(C.black), 24), 0, 0, -11.5, Math.PI / 2));
  g.add(taperBoot(3.2, 1.5, -14, 18, C.black));
  g.add(cableTail(1.5, -32, 10, C.orange));
  return g;
};
/* MPO: one wide housing, the black MT ferrule with twelve fibers in a row and two guide pins */
M["mpo"] = () => {
  const g = new THREE.Group(), m = plastic(C.aqua, 0.45);
  g.add(sleeve(rr(12.4, 7.6, 0.8), rr(8.4, 4.0, 0.4), -8, 0, m));
  g.add(at(rbox(12.4, 7.6, 14, 0.8, m), 0, 0, -15));
  g.add(at(box(3.0, 1.0, 10, m), 0, 4.2, -6));
  const fer = rr(6.4, 2.5, 0.3); g.add(prism(fer, -6, 0.8, plastic(C.black, 0.35)));
  for (let k = 0; k < 12; k++) g.add(at(new THREE.Mesh(new THREE.CircleGeometry(0.09, 10), mat(0xcfd8de, { rough: 0.2, grain: false })), (k - 5.5) * 0.25, 0, 0.82));
  [-2.3, 2.3].forEach(function (x) { g.add(pinZ(x, 0, 0.35, 0.8, 3.0, steel())); });
  g.add(at(rbox(9, 6, 10, 1.5, plastic(0x2a2c30)), 0, 0, -27));
  g.add(taperBoot(3, 1.6, -32, 14, 0x2a2c30));
  g.add(cableTail(1.6, -46, 8, C.aqua));
  return g;
};
/* SFP+ transceiver: the module's face with its two LC openings, the bail latch */
M["sfp"] = () => {
  const g = new THREE.Group(), body = nickel();
  const f = rr(13.4, 8.6, 0.6); f.holes = [-3.125, 3.125].map(function (x) { const h = new THREE.Path(); h.moveTo(x - 2.3, -2.1); h.lineTo(x + 2.3, -2.1); h.lineTo(x + 2.3, 2.5); h.lineTo(x - 2.3, 2.5); h.closePath(); return h; });
  g.add(prism(f, -1.5, 0, plastic(0x2a2c30)));
  [-3.125, 3.125].forEach(function (x) {
    g.add(at(box(4.6, 4.6, 0.3, holeM()), x, 0.2, -8));
    g.add(at(new THREE.Mesh(new THREE.RingGeometry(0.65, 1.0, 20), ceramic()), x, 0.2, -7.8));
  });
  g.add(sleeve(rr(13.6, 8.8, 0.6), rr(13.0, 8.2, 0.5), -40, -1.5, body));
  g.add(at(box(12.6, 7.8, 0.4, holeM()), 0, 0, -8.2));
  /* the bail: a wire loop across the bottom of the face, flipped down */
  const bail = mat(C.blue, { rough: 0.4 });
  g.add(at(box(14.6, 1.0, 1.0, bail), 0, -4.9, 0.6));
  [-1, 1].forEach(function (sd) { g.add(at(box(1.0, 1.0, 6, bail), sd * 7.3, -4.9, -2.4)); });
  g.add(onPanel(null, 22, 16, 0x3b3f45, { metal: true }).translateZ(-12));
  return g;
};

/* ---------- coax ---------- */
M["f-plug"] = () => { const g = new THREE.Group(), p = coaxF({}); g.add(p); return g; };
M["f-port"] = () => onPanel(fFemale(), 32, 26, 0x26282c);
/* BNC: the bayonet sleeve with its two slanted slots, the white insulator and the centre pin */
M["bnc"] = () => {
  const g = new THREE.Group(), n = nickel();
  g.add(sleeve(circle(5.9), circle(4.95), -3, 9, n));
  [0, Math.PI].forEach(function (a) {
    const slot = new THREE.Group(); slot.add(at(box(1.2, 0.5, 4.5, holeM()), 0, 0, 0)); slot.position.set(Math.cos(a + Math.PI / 2) * 5.92, Math.sin(a + Math.PI / 2) * 5.92, 6); slot.rotation.set(0, 0, a); slot.rotateY(0.6); g.add(slot);
  });
  g.add(sleeve(circle(4.1), circle(3.55), -2, 7, steel()));
  g.add(face(circle(3.55), 4.5, mat(0xf3f1ea, { rough: 0.7 })));
  g.add(pinZ(0, 0, 0.5, 4.5, 7.6, goldM()));
  g.add(at(cyl(4.6, 9, n, 6), 0, 0, -7.5, Math.PI / 2));
  g.add(taperBoot(4.2, 3.0, -12, 14, C.black));
  g.add(cableTail(3.0, -26, 10, C.black));
  return g;
};
/* IEC 169-2 aerial plug: a plain slotted sleeve, a hollow pin, a white body; nothing to screw or twist */
M["rf-iec"] = () => {
  const g = new THREE.Group(), n = nickel(), w = plastic(C.white, 0.5);
  g.add(sleeve(circle(4.75), circle(4.3), 0, 9, n));
  for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + Math.PI / 4; g.add(at(box(0.6, 0.6, 5, holeM()), Math.cos(a) * 4.55, Math.sin(a) * 4.55, 6.5, 0, 0, a)); }
  g.add(face(circle(4.3), 1.0, plastic(0xe9e7df, 0.6)));
  g.add(sleeve(circle(1.15), circle(0.6), 1, 8, n));
  g.add(at(cyl(6.4, 22, w, 32), 0, 0, -11, Math.PI / 2));
  for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; g.add(at(box(0.8, 0.8, 14, w), Math.cos(a) * 6.4, Math.sin(a) * 6.4, -13)); }
  g.add(taperBoot(4.8, 3.2, -22, 8, C.white));
  g.add(cableTail(3.2, -30, 10, C.white));
  return g;
};

/* ---------- direct attach ---------- */
/* DAC: an SFP+ module built onto twinax; its mating end shows the card edge with gold fingers */
M["dac"] = () => {
  const g = new THREE.Group(), body = nickel();
  g.add(sleeve(rr(13.6, 8.8, 0.6), rr(13.0, 8.2, 0.5), -45, 0, body));
  g.add(face(rr(13.0, 8.2, 0.5), -6, holeM()));
  g.add(at(box(11.6, 1.0, 6, mat(0x1f6b3a, { rough: 0.5 })), 0, -1.6, -2.8));
  for (let k = 0; k < 10; k++) { g.add(at(box(0.75, 0.12, 3.5, goldM()), (k - 4.5) * 1.1, -1.05, -1.8)); g.add(at(box(0.75, 0.12, 3.5, goldM()), (k - 4.5) * 1.1, -2.15, -1.8)); }
  g.add(at(rbox(12.8, 8.2, 8, 0.6, plastic(C.black)), 0, 0, -49));
  g.add(at(rbox(6, 1.4, 20, 0.6, plastic(C.blue)), 0, 4.3, -60));
  g.add(taperBoot(3.6, 2.6, -53, 8, C.black));
  g.add(cableTail(2.6, -61, 14, C.black));
  return g;
};

/* ---------- USB & Lightning ---------- */
/* a row of flat gold contacts on a surface facing +Y (up) or -Y (down) */
function contacts(n, pitch, w, len, y, z, dir, x0) {
  const g = new THREE.Group();
  for (let k = 0; k < n; k++) g.add(at(box(w, 0.12, len, goldM()), (x0 || 0) + (k - (n - 1) / 2) * pitch, y + (dir || 1) * 0.06, z));
  return g;
}
/* the two latch windows punched in a shell's top or bottom */
function windows(xs, y, z, w, l) { const g = new THREE.Group(); xs.forEach(function (x) { g.add(at(box(w, 0.32, l, holeM()), x, y, z)); }); return g; }
function usbAPlug(tongue, gen3) {
  const g = new THREE.Group(), L = 12;
  g.add(sleeve(rr(12, 4.5, 0.25), rr(11.4, 3.9, 0.15), 0, L, nickel()));
  /* the insert fills the lower half; the receptacle's tongue slides in above it */
  g.add(at(box(11.4, 1.9, L - 1, plastic(tongue, 0.5)), 0, -1.0, (L - 1) / 2));
  g.add(face(rr(11.4, 3.9, 0.15), 0.5, holeM()));
  g.add(contacts(4, 2.5, 1.0, 6.5, -0.05, L - 4.5, 1, 0));
  if (gen3) g.add(contacts(5, 2.0, 0.6, 2.2, -0.05, L - 9.5, 1, 0));
  g.add(windows([-3, 3], 2.25, L - 4, 2.5, 2.2)); g.add(windows([-3, 3], -2.25, L - 4, 2.5, 2.2));
  g.add(overmold(15.5, 7.6, 18, C.black, { taper: 0.18, cableR: 2.4, relief: 9 }));
  return g;
}
M["usb-a"] = () => usbAPlug(C.white, false);
M["usb3-a"] = () => usbAPlug(C.usb3, true);
M["usb-a-port"] = () => onPanel(usbAPort("USB", false), 26, 16, 0x2f3237, { metal: true });
M["usb3-a-port"] = () => onPanel(usbAPort("USB", true), 26, 16, 0x2f3237, { metal: true });
/* USB-B: near square, the two top corners bevelled; the port's square tongue goes into the plug's middle */
const usbBOutline = () => chamfered(8.45, 7.78, [1.2, 1.2, 0, 0]);
function usbBNose(top) {
  const g = new THREE.Group(), L = 9;
  g.add(sleeve(usbBOutline(), grow(usbBOutline(), -0.3), 0, L, nickel()));
  const ins = grow(usbBOutline(), -0.3); ins.holes = [new THREE.Path().moveTo(-2.7, -1.9).lineTo(2.7, -1.9).lineTo(2.7, 1.5).lineTo(-2.7, 1.5).closePath()];
  g.add(prism(ins, 0, L - 0.8, plastic(C.black, 0.5)));
  g.add(face(rr(5.4, 3.4, 0.1), 1.0, holeM()).translateY(-0.2));
  [-1.2, 1.2].forEach(function (x) { g.add(at(box(0.9, 0.12, 5, goldM()), x, 1.38, L - 3.5)); g.add(at(box(0.9, 0.12, 5, goldM()), x, -1.78, L - 3.5)); });
  if (top) {
    const t = rr(6.2, 3.2, 0.3), ti = rr(5.6, 2.6, 0.2);
    g.add(sleeve(t, ti, 0, L, nickel()).translateY(5.4));
    const tins = rr(5.6, 2.6, 0.2); tins.holes = [new THREE.Path().moveTo(-2.2, -0.45).lineTo(2.2, -0.45).lineTo(2.2, 0.45).lineTo(-2.2, 0.45).closePath()];
    g.add(prism(tins, 0, L - 0.8, plastic(C.usb3, 0.5)).translateY(5.4));
    g.add(face(rr(4.4, 0.9, 0.05), 1, holeM()).translateY(5.4));
  }
  return g;
}
M["usb-b"] = () => { const g = usbBNose(false); g.add(overmold(13, 12, 18, C.black, { taper: 0.15, cableR: 2.4, relief: 9 })); return g; };
M["usb3-b"] = () => { const g = usbBNose(true); g.add(at(overmold(13, 15.5, 18, C.black, { taper: 0.15, cableR: 2.4, relief: 9 }), 0, 1.6, 0)); return g; };
M["usb-b-port"] = () => onPanel(usbBPort("USB-B"), 22, 20, 0xc9cbc6);
/* Mini-B: a 6.8 x 3 shell whose lower sides angle in */
M["mini-b"] = () => {
  const g = new THREE.Group(), L = 9, out = poly([[-3.4, 1.5], [3.4, 1.5], [3.4, 0.2], [2.6, -1.5], [-2.6, -1.5], [-3.4, 0.2]]);
  g.add(sleeve(out, grow(out, -0.25), 0, L, nickel()));
  g.add(face(grow(out, -0.25), 1, holeM()));
  g.add(at(box(5.2, 0.9, L - 1.5, plastic(C.black)), 0, 0.6, (L - 1.5) / 2));
  g.add(contacts(5, 0.8, 0.4, 4, 0.15, L - 3.5, -1));
  g.add(overmold(11, 7, 16, C.black, { taper: 0.18, cableR: 2.0, relief: 8 }));
  return g;
};
/* Micro-B: 6.85 x 1.8, its lower corners cut, two latch hooks underneath */
const microOut = () => poly([[-3.425, 0.9], [3.425, 0.9], [3.425, 0.1], [2.6, -0.9], [-2.6, -0.9], [-3.425, 0.1]]);
function microNose(x0) {
  const g = new THREE.Group(), L = 6.5, out = microOut();
  g.add(sleeve(out, grow(out, -0.2), 0, L, nickel()));
  g.add(face(grow(out, -0.2), 0.8, holeM()));
  g.add(at(box(5.6, 0.45, L - 1, plastic(C.black)), 0, 0.2, (L - 1) / 2));
  g.add(contacts(5, 0.65, 0.3, 3, -0.03, L - 2.5, -1));
  [-1.6, 1.6].forEach(function (x) { g.add(at(box(0.6, 0.35, 1.2, nickel()), x, -0.95, L - 1.8)); });
  g.position.x = x0 || 0; return g;
}
M["micro-b"] = () => { const g = microNose(0); g.add(overmold(10, 6, 14, C.black, { taper: 0.15, cableR: 1.8, relief: 7 })); return g; };
M["usb3-micro-b"] = () => {
  const g = new THREE.Group(); g.add(microNose(-2.6));
  const L = 6.5, out = poly([[0.9, 0.9], [5.9, 0.9], [5.9, 0.1], [5.2, -0.9], [0.9, -0.9]]);
  g.add(sleeve(out, grow(out, -0.2), 0, L, nickel()));
  g.add(face(grow(out, -0.2), 0.8, holeM()));
  g.add(at(box(4.0, 0.45, L - 1, plastic(C.black)), 3.5, 0.2, (L - 1) / 2));
  g.add(contacts(5, 0.65, 0.3, 3, -0.03, L - 2.5, -1, 3.4));
  g.add(at(overmold(15, 6, 14, C.black, { taper: 0.12, cableR: 2.0, relief: 7 }), 0.6, 0, 0));
  return g;
};
/* USB-C: an 8.25 x 2.4 stadium; the port's tongue slides into the plug's slot, contacts on both walls */
M["usb-c"] = () => {
  const g = new THREE.Group(), L = 6.6, out = rr(8.25, 2.4, 1.2);
  g.add(sleeve(out, rr(7.8, 1.95, 0.97), 0, L, nickel()));
  const ins = rr(7.8, 1.95, 0.97); ins.holes = [new THREE.Path().moveTo(-3.35, -0.36).lineTo(3.35, -0.36).lineTo(3.35, 0.36).lineTo(-3.35, 0.36).closePath()];
  g.add(prism(ins, 0, L - 0.4, plastic(C.black, 0.5)));
  g.add(face(rr(6.7, 0.72, 0.1), 1, holeM()));
  g.add(contacts(12, 0.5, 0.25, 3, 0.36, L - 2.2, -1)); g.add(contacts(12, 0.5, 0.25, 3, -0.36, L - 2.2, 1));
  g.add(overmold(11.5, 6.2, 15, C.black, { taper: 0.12, cableR: 2.0, relief: 8 }));
  return g;
};
M["usb-c-port"] = () => onPanel(usbCPort("USB-C"), 22, 12, 0xb9bdc2, { metal: true });
/* Lightning: a bare blade, rounded at the tip, eight contacts a side, no shell */
M["lightning"] = () => {
  const g = new THREE.Group(), L = 7.7, bl = rr(6.7, 1.5, 0.75);
  const blade = prism(bl, 0, L, mat(0xb4b9bf, { metal: 0.85, rough: 0.3, grain: false })); g.add(blade);
  for (let k = 0; k < 8; k++) { const x = (k - 3.5) * 0.65; g.add(at(box(0.42, 0.1, 2.4, goldM()), x, 0.78, L - 2.0)); g.add(at(box(0.42, 0.1, 2.4, goldM()), x, -0.78, L - 2.0)); }
  [-1, 1].forEach(function (sd) { g.add(at(box(0.5, 1.2, 1.4, holeM()), sd * 3.3, 0, L - 2.6)); });
  g.add(at(rbox(6.9, 1.7, 1, 0.5, plastic(C.white, 0.4)), 0, 0, 0.2));
  g.add(overmold(8.2, 5.4, 12.5, C.white, { taper: 0.06, cableR: 1.6, relief: 6, rough: 0.35 }));
  return g;
};

/* =====================================================================
   D-subminiature: one builder for every size. A male (pins) plug on a
   cable has a moulded backshell and thumbscrews; a female (holes) port
   sits in a panel with its hex standoffs. Shell sizes from the D-sub
   drawings: E 16.9, A 25.0, B 38.96 mm across the male shell's top.
   ===================================================================== */
const DSUB = {
  E: { w: 16.9, flange: 30.8, screws: 12.5 },
  A: { w: 25.0, flange: 39.1, screws: 16.66 },
  B: { w: 38.96, flange: 53.0, screws: 23.52 },
  W: { w: 26.0, flange: 37.5, screws: 15.9 }      /* DMS-59 */
};
function rowPins(n, pitch, y, dx) { const out = []; for (let k = 0; k < n; k++) out.push([(k - (n - 1) / 2) * pitch + (dx || 0), y]); return out; }
function dsubPlug(size, pins, o = {}) {
  const g = new THREE.Group(), S = DSUB[size], male = o.male !== false;
  const h = 8.0, outer = male ? dShape(S.w, h, 1.1) : dShape(S.w - 1.6, h - 1.4, 0.9), inner = grow(outer, -0.35);
  g.add(sleeve(outer, inner, 0, 6.0, nickel()));
  const insert = plastic(o.insert == null ? C.black : o.insert, 0.6);
  if (male) {
    g.add(prism(inner, 0, 2.4, insert));
    pins.forEach(function (p) { g.add(pinZ(p[0], p[1], o.pinR || 0.5, 2.4, 5.6, goldM())); });
  } else {
    g.add(prism(inner, 0, 5.8, insert));
    pins.forEach(function (p) { g.add(socketHole(p[0], p[1], (o.pinR || 0.5) + 0.08, 5.8, C.gold)); });
  }
  const fl = rr(S.flange, 12.5, 1.2); fl.holes = [asHoleShape(grow(outer, 0.05))];
  g.add(prism(fl, -0.6, 0, nickel()));
  if (o.port) {
    [-S.screws, S.screws].forEach(function (x) {
      g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 4.5, 6), steel()), x, 0, 2.25, Math.PI / 2));
      g.add(at(new THREE.Mesh(new THREE.CircleGeometry(1.25, 16), holeM()), x, 0, 4.52));
    });
    const panelG = onPanel(null, S.flange + 12, 20, o.panel == null ? 0x2f3237 : o.panel, { metal: true });
    panelG.position.z = -0.6; g.add(panelG);
  } else {
    const bw = S.flange + 2.5, bc = o.back == null ? 0x8f959c : o.back;
    g.add(at(overmold(bw, 15.5, o.backLen || 24, bc, { taper: o.taper == null ? 0.3 : o.taper, cableR: o.cableR || 3.4, relief: 9, cable: o.cable == null ? bc : o.cable, r: 2.2 }), 0, 0, -0.6));
    [-S.screws, S.screws].forEach(function (x) { g.add(thumbscrew(x, -0.6, bc)); });
  }
  return g;
}
function asHoleShape(s) { const p = new THREE.Path(); p.curves = s.curves; return p; }
const DE9 = () => rowPins(5, 2.77, 1.42).concat(rowPins(4, 2.77, -1.42));
const DB25 = () => rowPins(13, 2.77, 1.42).concat(rowPins(12, 2.77, -1.42));
const DA15 = () => rowPins(8, 2.77, 1.42).concat(rowPins(7, 2.77, -1.42));
const HD15 = () => rowPins(5, 2.29, 1.98, 0.57).concat(rowPins(5, 2.29, 0, -0.57)).concat(rowPins(5, 2.29, -1.98, 0));

/* ---------- video ---------- */
M["hdmi-port"] = () => onPanel(hdmiPort("HDMI"), 30, 16, 0x2f3237, { metal: true });
M["dp-port"] = () => onPanel(dpPort("DP"), 32, 16, 0x2f3237, { metal: true });
function slotNose(out, L, slotW, slotH, slotY, nTop, nBot, pitch, o = {}) {
  const g = new THREE.Group();
  g.add(sleeve(out, grow(out, -0.25), 0, L, nickel()));
  const ins = grow(out, -0.25); ins.holes = [new THREE.Path().moveTo(-slotW / 2, slotY - slotH / 2).lineTo(slotW / 2, slotY - slotH / 2).lineTo(slotW / 2, slotY + slotH / 2).lineTo(-slotW / 2, slotY + slotH / 2).closePath()];
  g.add(prism(ins, 0, L - (o.inset || 1.0), plastic(C.black, 0.5)));
  g.add(face(rr(slotW, slotH, 0.05), 1.2, holeM()).translateY(slotY));
  if (nTop) g.add(contacts(nTop, pitch, pitch * 0.55, 3.5, slotY + slotH / 2, L - (o.inset || 1.0) - 2.2, -1));
  if (nBot) g.add(contacts(nBot, pitch, pitch * 0.55, 3.5, slotY - slotH / 2, L - (o.inset || 1.0) - 2.2, 1));
  return g;
}
M["mini-hdmi"] = () => {
  const out = poly([[-5.21, 1.21], [5.21, 1.21], [5.21, 0.1], [4.1, -1.21], [-4.1, -1.21], [-5.21, 0.1]]);
  const g = slotNose(out, 8, 7.4, 0.8, 0.15, 10, 9, 0.7);
  g.add(overmold(15, 7, 18, C.black, { taper: 0.15, grip: 3, cableR: 2.6, relief: 8 }));
  return g;
};
M["micro-hdmi"] = () => {
  const out = poly([[-3.2, 1.4], [3.2, 1.4], [3.2, 0.2], [2.6, -1.4], [-2.6, -1.4], [-3.2, 0.2]]);
  const g = slotNose(out, 6.5, 4.6, 0.7, 0.2, 10, 9, 0.45);
  g.add(overmold(10.5, 6.5, 15, C.black, { taper: 0.12, cableR: 2.2, relief: 7 }));
  return g;
};
/* DisplayPort: one lower corner cut (mirror of the port's), the latch hooks on top */
M["dp"] = () => {
  const out = poly([[-7.95, 2.3], [7.95, 2.3], [7.95, -2.3], [-6.2, -2.3], [-7.95, -0.6]]);
  const g = slotNose(out, 10, 11.2, 1.3, 0.1, 10, 10, 1.0, { inset: 1.4 });
  [-5.2, 5.2].forEach(function (x) { g.add(at(box(1.4, 0.6, 2.2, nickel()), x, 2.5, 7.4)); });
  g.add(overmold(20, 10, 26, C.black, { taper: 0.15, cableR: 3.4, relief: 9 }));
  g.add(at(rbox(7, 1.4, 7, 0.6, plastic(0x3a3d42)), 0, 5.3, -6));
  return g;
};
M["mini-dp"] = () => {
  const out = poly([[-3.7, 2.25], [3.7, 2.25], [3.7, -0.6], [2.1, -2.25], [-2.1, -2.25], [-3.7, -0.6]]);
  const g = slotNose(out, 7.5, 5.0, 1.0, 0.4, 10, 10, 0.5);
  g.add(overmold(11.5, 8, 17, C.black, { taper: 0.12, cableR: 2.5, relief: 8 }));
  return g;
};
M["vga"] = () => dsubPlug("E", HD15(), { pinR: 0.4, back: C.blue, cable: 0x2a2c30 });
M["vga-port"] = () => dsubPlug("E", HD15(), { male: false, port: true, pinR: 0.4, insert: C.blue });
M["dms59"] = () => dsubPlug("W", rowPins(15, 1.27, 2.0).concat(rowPins(15, 1.27, 0.68, 0.635)).concat(rowPins(15, 1.27, -0.68)).concat(rowPins(14, 1.27, -2.0, 0.635)), { pinR: 0.28, back: C.black });
/* DVI: a D-shaped shell, the flat blade at one side, the pin grid (split for single link, full for dual);
   DVI-I adds the four analog pins round the blade */
function dviPlug(dual, analog, o = {}) {
  const g = new THREE.Group(), outer = dShape(o.w || 25.6, 8.2, 1.0), inner = grow(outer, -0.35);
  g.add(sleeve(outer, inner, 0, 7, nickel()));
  g.add(prism(inner, 0, 2.6, plastic(C.black, 0.6)));
  const p = 1.905, gx = 2.6;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) {
    if (!dual && (c === 3 || c === 4)) continue;
    g.add(pinZ(gx + (c - 3.5) * p, (1 - r) * p, 0.36, 2.6, 6.4, goldM()));
  }
  const bx = -8.4;
  const blade = prism(rr(3.6, 0.7, 0.2), 2.6, 6.6, goldM()); blade.position.x = bx; g.add(blade);
  if (analog) [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(function (q) { g.add(pinZ(bx + q[0] * 1.6, q[1] * 1.6, 0.36, 2.6, 6.4, goldM())); });
  if (o.power) [[-12.5, 1.4], [-12.5, -1.4], [12.6, 1.4], [12.6, -1.4]].forEach(function (q) { g.add(pinZ(q[0], q[1], 0.6, 2.6, 6.4, goldM())); });
  if (o.noFlange) {
    g.add(at(overmold((o.w || 25.6) + 8, 14, 26, o.back || C.black, { taper: 0.25, cableR: 3.6, relief: 9 }), 0, 0, 0));
  } else {
    const fl = rr(39.5, 12.5, 1.2); fl.holes = [asHoleShape(grow(outer, 0.05))];
    g.add(prism(fl, -0.6, 0, nickel()));
    g.add(at(overmold(41, 15.5, 26, o.back || C.black, { taper: 0.3, cableR: 3.6, relief: 9 }), 0, 0, -0.6));
    [-16, 16].forEach(function (x) { g.add(thumbscrew(x, -0.6, o.back || C.black)); });
  }
  return g;
}
M["dvi-d-sl"] = () => dviPlug(false, false);
M["dvi-d-dl"] = () => dviPlug(true, false);
M["dvi-i-sl"] = () => dviPlug(false, true);
M["dvi-i-dl"] = () => dviPlug(true, true);
M["adc"] = () => dviPlug(true, true, { w: 32, power: true, noFlange: true, back: 0xc9ccd0 });
/* Mini-DVI: a thin shell, two rows of sixteen fine contacts, a spring clip each side */
M["mini-dvi"] = () => {
  const out = chamfered(11.6, 4.0, [0, 0, [0.8, 0.8], [0.8, 0.8]]);
  const g = slotNose(out, 7.5, 9.6, 1.1, 0.1, 16, 16, 0.55);
  [-1, 1].forEach(function (sd) { g.add(at(box(0.5, 2.2, 3.5, steel()), sd * 6.05, 0, 5)); });
  g.add(overmold(16, 9, 18, 0xd9dcdf, { taper: 0.15, cableR: 2.6, relief: 8 }));
  return g;
};
M["micro-dvi"] = () => {
  const out = rr(7.2, 2.6, 0.5);
  const g = slotNose(out, 6.5, 5.8, 0.7, 0.1, 15, 15, 0.36);
  g.add(overmold(11, 6, 15, 0xd9dcdf, { taper: 0.12, cableR: 2.2, relief: 7 }));
  return g;
};
/* RCA: a split metal ring round a 3.2 mm centre pin, a coloured body */
function rcaPlug(color, band) {
  const g = new THREE.Group(), n = nickel();
  g.add(sleeve(circle(4.5), circle(4.0), 0, 7, n));
  for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + Math.PI / 4; g.add(at(box(0.7, 0.8, 5, holeM()), Math.cos(a) * 4.25, Math.sin(a) * 4.25, 4.6, 0, 0, a)); }
  g.add(face(circle(4.0), 0.5, plastic(C.black)));
  g.add(pinZ(0, 0, 1.6, 0.5, 11, n));
  g.add(at(cyl(5.4, 20, plastic(band ? 0x2a2c30 : color, 0.45), 32), 0, 0, -10, Math.PI / 2));
  if (band) g.add(at(cyl(5.5, 4, plastic(color, 0.45), 32), 0, 0, -3, Math.PI / 2));
  else g.add(at(cyl(5.5, 2.5, plastic(color, 0.4), 32), 0, 0, -1.25, Math.PI / 2));
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; g.add(at(box(0.7, 0.7, 12, plastic(band ? 0x2a2c30 : color, 0.45)), Math.cos(a) * 5.45, Math.sin(a) * 5.45, -12)); }
  g.add(taperBoot(4.2, 2.4, -20, 8, band ? 0x2a2c30 : color));
  g.add(cableTail(2.4, -28, 10, band ? 0x2a2c30 : color));
  return g;
}
M["composite"] = () => rcaPlug(C.yellow);
M["spdif-coax"] = () => rcaPlug(C.orange, true);
M["component"] = () => { const g = new THREE.Group(); [[C.green, -13], [C.blue, 0], [C.red, 13]].forEach(function (q) { const p = rcaPlug(q[0]); p.position.x = q[1]; g.add(p); }); return g; };
/* DIN and mini-DIN: a round shell, pins on the insert face, the key */
function dinPlug(r, pins, key, o = {}) {
  const g = new THREE.Group(), n = nickel();
  g.add(sleeve(circle(r), circle(r - 0.35), 0, o.len || 8, n));
  g.add(prism(circle(r - 0.35), 0, 2.2, plastic(C.black, 0.6)));
  pins.forEach(function (p) { g.add(pinZ(p[0], p[1], o.pinR || 0.45, 2.2, (o.len || 8) - 1.4, nickel())); });
  if (key === "square") g.add(at(box(2.2, 1.7, (o.len || 8) - 1.6, plastic(0x5a5e64, 0.55)), 0, o.keyY == null ? -0.2 : o.keyY, ((o.len || 8) - 1.6) / 2));
  if (key === "notch") g.add(at(box(1.6, 1.0, 1.2, holeM()), 0, -(r - 0.2), (o.len || 8) - 0.5));
  const bc = o.body == null ? C.black : o.body;
  g.add(at(cyl(r + 1.6, 14, plastic(bc, 0.45), 32), 0, 0, -7, Math.PI / 2));
  for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; g.add(at(box(0.8, 0.8, 10, plastic(bc, 0.45)), Math.cos(a) * (r + 1.6), Math.sin(a) * (r + 1.6), -8)); }
  g.add(taperBoot(r + 0.4, 2.6, -14, 9, bc));
  g.add(cableTail(2.6, -23, 10, bc));
  return g;
}
const PS2_PINS = () => [[-1.7, -1.6], [1.7, -1.6], [-3.3, 0.7], [3.3, 0.7], [-1.7, 2.6], [1.7, 2.6]];
M["svideo"] = () => dinPlug(4.75, [[-1.7, -1.5], [1.7, -1.5], [-1.7, 1.9], [1.7, 1.9]], "square");
M["ps2"] = () => dinPlug(4.75, PS2_PINS().map(function (p) { return [p[0], p[1] - 0.3]; }), "square", { body: C.purple, keyY: -2.6 });
M["at-kbd"] = () => dinPlug(6.6, [180, 135, 90, 45, 0].map(function (d) { const a = d * Math.PI / 180; return [Math.cos(a) * 3.5, Math.sin(a) * 3.5 - 0.6]; }), "notch", { pinR: 0.6, len: 10 });
/* a round DIN socket in a panel: coloured ring, holes, key notch */
function dinSocket(r, holes, color, keyAt) {
  const g = new THREE.Group();
  /* the panel is solid, so the socket's floor sits just proud of it, inside its raised ring */
  g.add(sleeve(circle(r + 1.6), circle(r), 0, 2.4, plastic(color, 0.45)));
  g.add(face(circle(r - 0.4), 0.3, plastic(color, 0.55)));
  g.add(sleeve(circle(r), circle(r - 0.4), 0.3, 2.0, steel()));
  holes.forEach(function (h) { g.add(socketHole(h[0], h[1], 0.62, 0.3, C.gold)); });
  g.add(rectHole(0, keyAt, 2.2, 1.7, 0.3));
  return g;
}
M["ps2-port"] = () => {
  const g = onPanel(null, 22, 36, 0x2f3237, { metal: true });
  const a = dinSocket(4.75, PS2_PINS().map(function (p) { return [-p[0], p[1] - 0.3]; }), C.green, -2.6); a.position.y = 8.5; g.add(a);
  const b = dinSocket(4.75, PS2_PINS().map(function (p) { return [-p[0], p[1] - 0.3]; }), C.purple, -2.6); b.position.y = -8.5; g.add(b);
  return g;
};
M["at-port"] = () => {
  const g = onPanel(null, 30, 26, 0x2f3237, { metal: true });
  const s = dinSocket(6.6, [180, 135, 90, 45, 0].map(function (d) { const a = d * Math.PI / 180; return [Math.cos(a) * 3.5, Math.sin(a) * 3.5 - 0.6]; }), 0x2a2c30, -5.9);
  g.add(s); return g;
};

/* ---------- audio ---------- */
M["trs35"] = () => {
  const g = new THREE.Group(), n = mat(0xc9ccd0, { metal: 0.85, rough: 0.28 }), ins = plastic(C.black, 0.4);
  const segs = [[0, 6, n], [6, 7, ins], [7, 9.8, n], [9.8, 10.8, ins], [10.8, 13, n]];   /* from the body forward: sleeve, ring, tip */
  segs.forEach(function (sg) { g.add(at(cyl(1.75, sg[1] - sg[0], sg[2], 28), 0, 0, (sg[0] + sg[1]) / 2, Math.PI / 2)); });
  g.add(at(new THREE.Mesh(new THREE.SphereGeometry(1.75, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), n), 0, 0, 13, Math.PI / 2));
  g.add(at(new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.35, 8, 28), n), 0, 0, 12.0));
  g.add(at(cyl(3.6, 16, plastic(C.black, 0.45), 32), 0, 0, -8, Math.PI / 2));
  for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; g.add(at(box(0.6, 0.6, 9, plastic(C.black)), Math.cos(a) * 3.6, Math.sin(a) * 3.6, -10)); }
  g.add(taperBoot(3.0, 1.6, -16, 9, C.black));
  g.add(cableTail(1.6, -25, 10, C.black));
  return g;
};
M["audio-jacks"] = () => {
  const g = onPanel(null, 34, 26, 0x2f3237, { metal: true });
  [[C.blue, -10, 5.5], [C.green, 0, 5.5], [C.pink, 10, 5.5], [C.orange, -10, -5.5], [C.black, 0, -5.5], [0x8d9299, 10, -5.5]].forEach(function (j) { const a = audioJack("", j[0]); a.position.set(j[1], j[2], 0); g.add(a); });
  return g;
};
/* TOSLINK: a square plug, two corners cut, the plastic-fiber ferrule in the middle */
M["toslink"] = () => {
  const g = new THREE.Group(), out = chamfered(7.0, 6.2, [1.3, 1.3, 0, 0]);
  g.add(prism(out, 0, 6, plastic(C.black, 0.45)));
  g.add(sleeve(circle(1.3), circle(0.5), 6, 8.2, plastic(0xd9d5cc, 0.5)));
  g.add(face(circle(0.5), 8.0, mat(0x9a2a2a, { rough: 0.25, grain: false })));
  g.add(overmold(10.5, 9, 14, C.black, { taper: 0.15, cableR: 2.1, relief: 8 }));
  return g;
};

/* ---------- serial, parallel & game ---------- */
M["de9-f"] = () => dsubPlug("E", DE9(), { male: false });
M["db25-m"] = () => dsubPlug("B", DB25(), {});
M["db25-f"] = () => dsubPlug("B", DB25(), { male: false, port: true, insert: 0x2a2c30 });
M["da15"] = () => dsubPlug("A", DA15(), { male: false, port: true, insert: 0x2a2c30 });
/* Centronics 36: a D-shell round a flat tongue of ribbon contacts; the bail-clip catches at the ends */
function ribbonPlug(o) {
  const g = new THREE.Group(), outer = dShape(o.w, o.h, 1.0);
  g.add(sleeve(outer, grow(outer, -0.35), 0, o.len, nickel()));
  g.add(face(grow(outer, -0.35), 0.8, holeM()));
  g.add(at(box(o.tw, o.th, o.len - 1.2, plastic(o.tongue == null ? 0x6b5a3a : o.tongue, 0.5)), 0, 0, (o.len - 1.2) / 2 + 0.4));
  const n = o.n / 2;
  for (let k = 0; k < n; k++) { const x = (k - (n - 1) / 2) * o.pitch; g.add(at(box(o.pitch * 0.5, 0.15, o.len - 3, goldM()), x, o.th / 2 + 0.07, (o.len - 3) / 2 + 1.2)); g.add(at(box(o.pitch * 0.5, 0.15, o.len - 3, goldM()), x, -o.th / 2 - 0.07, (o.len - 3) / 2 + 1.2)); }
  const fl = rr(o.fw, o.fh, 1.2); fl.holes = [asHoleShape(grow(outer, 0.05))];
  g.add(prism(fl, -0.6, 0, nickel()));
  if (o.bail) [-1, 1].forEach(function (sd) { g.add(at(box(2.4, 5, 3, steel()), sd * (o.fw / 2 - 2.2), 0, 1.2)); g.add(at(box(1.0, 2.2, 0.3, holeM()), sd * (o.fw / 2 - 2.2), 0, 2.75)); });
  if (o.screws) [-1, 1].forEach(function (sd) { g.add(thumbscrew(sd * o.screws, -0.6, o.back)); });
  if (o.clips) [-1, 1].forEach(function (sd) { g.add(at(box(1.2, 4, o.len + 2, steel()), sd * (o.w / 2 + 2.2), 0, o.len / 2 - 2)); });
  g.add(at(overmold(o.fw + 2, o.fh + 3, o.backLen || 26, o.back, { taper: 0.32, cableR: o.cableR || 4, relief: 9, r: 2.2 }), 0, 0, -0.6));
  return g;
}
M["centronics"] = () => ribbonPlug({ w: 43, h: 9.6, len: 9.5, tw: 37.5, th: 2.6, n: 36, pitch: 2.16, fw: 64, fh: 15, bail: true, back: 0x8f959c });

/* ---------- drives & storage ---------- */
M["hd68-m"] = () => ribbonPlug({ w: 47, h: 8.4, len: 8, tw: 43.5, th: 1.8, n: 68, pitch: 1.27, fw: 58, fh: 13, clips: true, back: C.black, tongue: C.black });
M["hd50"] = () => ribbonPlug({ w: 35.5, h: 8.4, len: 8, tw: 32, th: 1.8, n: 50, pitch: 1.27, fw: 46, fh: 13, clips: true, back: C.black, tongue: C.black });
M["scsi-vhdci"] = () => ribbonPlug({ w: 31, h: 5.6, len: 7, tw: 28, th: 1.3, n: 68, pitch: 0.8, fw: 40, fh: 9, screws: 16.5, back: C.black, tongue: C.black, cableR: 3.6 });
M["hd68-f"] = () => {
  const g = new THREE.Group(), outer = dShape(45.5, 7.2, 0.9);
  g.add(sleeve(outer, grow(outer, -0.35), 0, 5, nickel()));
  const ins = grow(outer, -0.35); ins.holes = [new THREE.Path().moveTo(-22, -1.05).lineTo(22, -1.05).lineTo(22, 1.05).lineTo(-22, 1.05).closePath()];
  g.add(prism(ins, 0, 4.6, plastic(C.black, 0.6)));
  g.add(rectHole(0, 0, 44, 2.1, 0.5));
  for (let k = 0; k < 34; k++) { const x = (k - 16.5) * 1.27; g.add(at(box(0.6, 0.15, 3, goldM()), x, 0.95, 2.5)); g.add(at(box(0.6, 0.15, 3, goldM()), x, -0.95, 2.5)); }
  const fl = rr(58, 13, 1.2); fl.holes = [asHoleShape(grow(outer, 0.05))]; g.add(prism(fl, -0.6, 0, nickel()));
  [-1, 1].forEach(function (sd) { g.add(at(new THREE.Mesh(new THREE.CircleGeometry(1.3, 16), holeM()), sd * 26, 0, 0.02)); });
  const p = onPanel(null, 70, 22, 0x2f3237, { metal: true }); p.position.z = -0.6; g.add(p);
  return g;
};
/* an IDC ribbon connector: a long block of holes in two rows, its key bump, the flat grey ribbon with the red stripe */
function idcPlug(n, o = {}) {
  const g = new THREE.Group(), cols = n / 2, pitch = o.pitch || 2.54, W = cols * pitch + 4.6, H = o.h || 9;
  g.add(at(rbox(W, H, 9, 0.4, plastic(C.black, 0.55)), 0, 0, -4.5));
  for (let c = 0; c < cols; c++) for (let r = 0; r < 2; r++) {
    if (o.blocked === c * 2 + r) continue;
    g.add(at(box(pitch * 0.42, pitch * 0.42, 0.3, holeM()), (c - (cols - 1) / 2) * pitch, (r ? -1 : 1) * pitch / 2, 0.02));
  }
  g.add(at(box(4.5, 1.6, 7, plastic(C.black, 0.55)), 0, H / 2 + 0.8, -4));
  /* the ribbon, folded over the top of the block and running back */
  const rw = cols * pitch, rib = mat(0xa9adb3, { rough: 0.7 });
  g.add(at(box(rw, 0.9, 30, rib), 0, 0, -24));
  g.add(at(box(rw / n * 1.0, 0.95, 30, mat(C.red, { rough: 0.6 })), -rw / 2 + rw / n / 2, 0, -24));
  for (let k = 0; k < n; k++) g.add(at(box(0.08, 0.92, 30, mat(0x8d9298, { rough: 0.7 })), -rw / 2 + (k + 1) * rw / n, 0, -24));
  return g;
}
M["ide40"] = () => idcPlug(40, { blocked: 19 });
M["scsi50-int"] = () => idcPlug(50);
M["scsi68-int"] = () => {
  const g = new THREE.Group(), outer = dShape(47, 6.6, 0.8);
  g.add(sleeve(outer, grow(outer, -0.3), 0, 5.5, nickel()));
  g.add(prism(grow(outer, -0.3), 0, 5.3, plastic(C.black, 0.6)));
  for (let k = 0; k < 34; k++) { g.add(socketHole((k - 16.5) * 1.27, 1.0, 0.3, 5.3, null)); g.add(socketHole((k - 16) * 1.27 - 0.635, -1.0, 0.3, 5.3, null)); }
  g.add(at(rbox(50, 9, 8, 0.6, plastic(C.black, 0.55)), 0, 0, -4));
  const rib = mat(0xa9adb3, { rough: 0.7 }); g.add(at(box(43, 0.8, 26, rib), 0, 0, -21));
  g.add(at(box(0.7, 0.85, 26, mat(C.red, { rough: 0.6 })), -21.2, 0, -21));
  for (let k = 0; k < 68; k++) g.add(at(box(0.06, 0.82, 26, mat(0x8d9298, { rough: 0.7 })), -21.5 + (k + 1) * 43 / 68, 0, -21));
  return g;
};
M["ide40-hdr"] = () => {
  const g = onPanel(null, 70, 26, 0x1d6b3e, { r: 0.5 });
  const W = 55.6, out = rr(W, 9, 0.4), inn = rr(W - 3.2, 5.6, 0.2);
  g.add(sleeve(out, inn, 0, 8.8, plastic(C.black, 0.55)));
  g.add(at(box(4.5, 1.7, 8.9, holeM()), 0, -3.7, 4.4));
  g.add(face(inn, 0.02, plastic(0x1b1c1f, 0.7)));
  for (let c = 0; c < 20; c++) for (let r = 0; r < 2; r++) { if (c === 9 && r === 1) continue; g.add(at(box(0.64, 0.64, 6, goldM()), (c - 9.5) * 2.54, (r ? -1 : 1) * 1.27, 3)); }
  return g;
};
/* SATA: a flat plug whose slot is an L; the data cable is flat and red */
function lSlotPlug(W, H, slotW, color, o = {}) {
  const g = new THREE.Group(), body = rr(W, H, 0.6);
  const sx = -slotW / 2, sy = -0.2;
  body.holes = [new THREE.Path().moveTo(sx, sy - 0.65).lineTo(sx + slotW, sy - 0.65).lineTo(sx + slotW, sy + 0.65).lineTo(sx + 1.3, sy + 0.65).lineTo(sx + 1.3, sy + 2.2).lineTo(sx, sy + 2.2).closePath()];
  g.add(prism(body, -o.len || -9, 0, plastic(color, 0.5)));
  g.add(prism(poly([[sx, sy - 0.65], [sx + slotW, sy - 0.65], [sx + slotW, sy + 0.65], [sx + 1.3, sy + 0.65], [sx + 1.3, sy + 2.2], [sx, sy + 2.2]]), -6, -5.9, holeM()));
  const n = o.contacts || 7, span = slotW - 2.2;
  for (let k = 0; k < n; k++) g.add(at(box(span / n * 0.5, 0.12, 4, goldM()), sx + 1.8 + (k + 0.5) * span / n, sy + 0.55, -3.5));
  return g;
}
M["sata"] = () => {
  const g = lSlotPlug(10.8, 5.6, 8.4, C.red, { len: 10, contacts: 7 });
  g.add(at(box(6, 0.4, 6, steel()), 0, 2.95, -4));
  g.add(at(box(8.2, 1.2, 26, mat(C.red, { rough: 0.55 })), 0, 0, -23));
  return g;
};
M["sata-power"] = () => {
  const g = lSlotPlug(23.5, 6.4, 20.5, C.black, { len: 12, contacts: 15 });
  [[C.yellow, -6], [C.black, -2], [C.red, 2], [C.black, 6]].forEach(function (w) { g.add(at(cyl(1.0, 24, mat(w[0], { rough: 0.5 }), 14), w[1], 0, -24, Math.PI / 2)); });
  return g;
};
M["esata"] = () => {
  const g = new THREE.Group(), out = rr(10.2, 4.0, 0.5), L = 9;
  g.add(sleeve(out, grow(out, -0.3), 0, L, nickel()));
  const ins = grow(out, -0.3); ins.holes = [new THREE.Path().moveTo(-3.9, -0.5).lineTo(3.9, -0.5).lineTo(3.9, 0.5).lineTo(-3.9, 0.5).closePath()];
  g.add(prism(ins, 0, L - 0.8, plastic(C.black)));
  g.add(face(rr(7.8, 1.0, 0.05), 1.2, holeM()));
  g.add(contacts(7, 1.0, 0.5, 3.5, 0.5, L - 3, -1));
  [-1, 1].forEach(function (sd) { [-2.6, 2.6].forEach(function (x) { g.add(at(box(1.6, 0.3, 2.4, nickel()), x, sd * 2.1, L - 3.5)); }); });
  g.add(overmold(14, 8, 18, C.black, { taper: 0.15, cableR: 2.6, relief: 8 }));
  return g;
};
/* FireWire: 6-pin (one end rounded), 4-pin (small, notched sides), 9-pin (squarish, keyed) */
M["fw400-6"] = () => {
  const out = new THREE.Shape(); out.moveTo(-5.2, -2.8); out.lineTo(2.4, -2.8); out.absarc(2.4, 0, 2.8, -Math.PI / 2, Math.PI / 2, false); out.lineTo(-5.2, 2.8); out.closePath();
  const g = slotNose(out, 9, 6.2, 1.2, 0, 3, 3, 1.4);
  g.add(overmold(14, 9, 18, 0x8f959c, { taper: 0.15, cableR: 2.6, relief: 8 }));
  return g;
};
M["fw400-4"] = () => {
  const out = poly([[-2.8, 1.5], [2.8, 1.5], [2.8, 0.6], [2.3, 0], [2.8, -0.6], [2.8, -1.5], [-2.8, -1.5], [-2.8, -0.6], [-2.3, 0], [-2.8, 0.6]]);
  const g = slotNose(out, 6.5, 3.4, 0.8, 0, 4, 0, 0.8);
  g.add(overmold(9, 6, 14, 0x8f959c, { taper: 0.12, cableR: 1.9, relief: 7 }));
  return g;
};
M["fw800"] = () => {
  const out = poly([[-4.1, 2.7], [-1.3, 2.7], [-1.3, 1.8], [1.3, 1.8], [1.3, 2.7], [4.1, 2.7], [4.1, -2.7], [-4.1, -2.7]]);
  const g = slotNose(out, 9, 6.0, 1.1, -0.3, 5, 4, 1.1);
  g.add(overmold(13, 10, 18, 0x8f959c, { taper: 0.15, cableR: 2.6, relief: 8 }));
  return g;
};

/* ---------- power ---------- */
M["c13"] = () => { const g = new THREE.Group(), p = iecC13({}); g.add(p); return g; };
M["c14"] = () => onPanel(iecInlet("AC IN"), 44, 34, 0x2f3237, { metal: true });
/* C19 / C20: a rectangular face, the three contacts lying flat (earth at the top) */
const C19_SLOTS = [[0, 4.0], [-6.2, -3.2], [6.2, -3.2]];
M["c19"] = () => {
  const g = new THREE.Group(), m = plastic(C.black, 0.5);
  const f = rr(24.6, 17.6, 2.2); f.holes = C19_SLOTS.map(function (q) { return new THREE.Path().moveTo(q[0] - 4.2, q[1] - 1.1).lineTo(q[0] + 4.2, q[1] - 1.1).lineTo(q[0] + 4.2, q[1] + 1.1).lineTo(q[0] - 4.2, q[1] + 1.1).closePath(); });
  g.add(prism(f, -10, 0, m));
  C19_SLOTS.forEach(function (q) { g.add(rectHole(q[0], q[1], 8.4, 2.2, -6)); });
  g.add(at(rbox(32, 24, 22, 3.5, m), 0, 0, -21));
  g.add(overmold(30, 22, 0.1, C.black, { taper: 0, cableR: 4.6, relief: 18 }).translateZ(-32));
  return g;
};
M["c20"] = () => {
  const g = new THREE.Group();
  const outer = rr(31, 24, 3), recess = rr(24.4, 17.4, 2.2); outer.holes = [asHoleShape(recess)];
  /* the inlet stands 8 mm proud of the solid panel, its recess floor just above the panel face */
  g.add(prism(outer, 0, 8, plastic(C.black, 0.5)));
  g.add(face(recess, 0.3, plastic(0x141517, 0.7)));
  C19_SLOTS.forEach(function (q) { g.add(at(box(7.8, 1.6, 6, mat(0xc9ccd0, { metal: 0.9, rough: 0.25 })), q[0], q[1], 3.3)); });
  const p = onPanel(null, 46, 36, 0x2f3237, { metal: true }); g.add(p);
  return g;
};
/* C5: the three-lobed cloverleaf, three round holes */
M["c5"] = () => {
  const g = new THREE.Group(), m = plastic(C.black, 0.5), lobes = [[0, 3.6], [-4.6, -2.4], [4.6, -2.4]];
  lobes.forEach(function (q) { g.add(at(cyl(4.9, 9, m, 40), q[0], q[1], -4.5, Math.PI / 2)); });
  g.add(at(cyl(3.5, 9, m, 24), 0, -0.4, -4.5, Math.PI / 2));
  lobes.forEach(function (q) { g.add(socketHole(q[0], q[1], 1.5, 0.01, null)); });
  g.add(at(rbox(20, 18, 16, 3, m), 0, 0.4, -16));
  g.add(overmold(18, 16, 0.1, C.black, { taper: 0, cableR: 3.4, relief: 14 }).translateZ(-24));
  return g;
};
/* NEMA 5-15R, ground down: the neutral slot (left, taller), the hot slot, the round ground hole with its flat top */
M["nema-5-15r"] = () => {
  const g = new THREE.Group(), ivory = plastic(C.ivory, 0.45);
  g.add(prism(rr(46, 44, 3), -3, 0, plastic(C.ivory, 0.5)));
  g.add(at(rbox(34, 36, 4, 6, ivory), 0, 0, 2));
  const gh = new THREE.Shape(); gh.moveTo(-2.4, 0.9); gh.lineTo(2.4, 0.9); gh.absarc(0, 0.2, 2.5, 0.28, Math.PI - 0.28, true); gh.closePath();
  g.add(face(rr(1.8, 7.9, 0.3), 4.03, holeM()).translateX(-6.35).translateY(4.5));
  g.add(face(rr(1.8, 6.35, 0.3), 4.03, holeM()).translateX(6.35).translateY(4.5));
  g.add(face(circleFlatTop(2.4), 4.03, holeM()).translateY(-7.5));
  g.add(at(cyl(1.6, 0.6, steel(), 16), 0, 15, 4.3, Math.PI / 2));
  void gh;
  return g;
};
function circleFlatTop(r) { const s = new THREE.Shape(), a = Math.asin(0.6); s.moveTo(-r * Math.cos(a), r * 0.6); s.lineTo(r * Math.cos(a), r * 0.6); s.absarc(0, 0, r, a, Math.PI - a, true); s.closePath(); return s; }
/* Molex 4-pin: the white block, four round sockets in a row, two corners chamfered; yellow, black, black, red */
M["molex"] = () => {
  const g = new THREE.Group(), m = plastic(C.white, 0.45);
  const out = chamfered(21.4, 8.6, [2.2, 2.2, 0, 0]), xs = [-7.62, -2.54, 2.54, 7.62];
  out.holes = xs.map(function (x) { const h = new THREE.Path(); h.absarc(x, -0.3, 1.6, 0, Math.PI * 2, true); return h; });
  g.add(prism(out, -15, 0, m));
  xs.forEach(function (x) { g.add(at(sleeve(circle(1.6), circle(1.0), -8, 0, plastic(0x2a2c30, 0.6)), x, -0.3, 0)); g.add(at(face(circle(1.0), -8, holeM()), x, -0.3, 0)); g.add(at(sleeve(circle(1.0), circle(0.8), -8, -2.5, mat(0xd2a94a, { metal: 0.8, rough: 0.3 })), x, -0.3, 0)); });
  [[C.yellow, -7.62], [C.black, -2.54], [C.black, 2.54], [C.red, 7.62]].forEach(function (w) { g.add(at(cyl(1.1, 22, mat(w[0], { rough: 0.5 }), 14), w[1], 0, -26, Math.PI / 2)); });
  return g;
};
