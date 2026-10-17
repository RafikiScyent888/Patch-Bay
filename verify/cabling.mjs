/* The Cabling module, checked in a real browser:
   - the catalog in index.html is the copy in tools/connectors/catalog.js,
     every entry is well formed, every near miss is a real connector, and
     the "On your objectives" tags are exactly the connectors the owner's
     doc names (read 17 Oct 2026)
   - every connector has both of its views embedded, and every view really
     shows a model (not a blank sweep) with its outline
   - the gallery's filters show the right cards, every picture loads
   - the drill, through the whole deck: six options, one of them the answer;
     a wrong pick goes red and stays red, marked three ways (red ground,
     inset rule, the words "Ruled out"); nothing at misses 1-2, hint 1 at
     3, hint 2 at 4, and from 5 the field narrowed to two with a reason on
     every option struck; no message or hint carries the answer's name;
     clearing keeps the hints; the answer stays pickable however many
     misses; solving marks it and counts it
   - Instructor Mode reveals behind the PIN and hides again
   - Easier reading switches on and is remembered across a reload
   - AAA (7:1, 4.5:1 large) on painted pixels across the new parts, both themes
   node verify/cabling.mjs            exit 1 on any failure
   node verify/cabling.mjs --plant    plants each defect in a copy; every one must be caught
   Needs Playwright. Not needed to run the site. */
import fs from "node:fs"; import path from "node:path"; import http from "node:http"; import os from "node:os"; import vm from "node:vm";
import { fileURLToPath } from "node:url";
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = fs.readFileSync(path.join(ROOT, "tools/connectors/catalog.js"), "utf8").replace(/\s+$/, "");
const pw = await import("/opt/node22/lib/node_modules/playwright/index.mjs"); const { chromium } = pw.default || pw;
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--headless=new", "--no-sandbox"] });

/* the connectors the doc names: Network+ fiber/coax/DAC and the eight connectors; Core 1 HDMI, USB, loopback plugs */
const OBJ = ["rj45", "rj45-jack", "rj11", "rj11-jack", "rj45-loop", "lc", "sc", "st", "mpo", "sfp", "f-plug", "f-port", "bnc", "dac",
  "usb-a", "usb-a-port", "usb3-a", "usb3-a-port", "usb-b", "usb-b-port", "usb3-b", "mini-b", "micro-b", "usb3-micro-b", "usb-c", "usb-c-port",
  "hdmi-a", "hdmi-port", "mini-hdmi", "micro-hdmi"];

function between(html, name) {
  const a = "/* " + name + ":BEGIN */", z = "/* " + name + ":END */", i = html.indexOf(a), j = html.indexOf(z);
  return i < 0 || j < i ? null : html.slice(i + a.length, j).trim();
}

async function check(html) {
  const bad = [];
  const fail = (name, what) => { if (!bad.some((b) => b.name === name && b.what === what)) bad.push({ name, what }); };

  /* ---- the data ---- */
  const cat = between(html, "CABLING-CATALOG");
  if (cat == null) { fail("catalog copy", "markers missing"); return bad; }
  if (cat !== SOURCE.trim()) fail("catalog copy", "index.html's catalog is not tools/connectors/catalog.js (run embed.mjs)");
  const ctx = {}; vm.createContext(ctx);
  try { vm.runInContext(cat, ctx); } catch (e) { fail("catalog data", "does not parse: " + e.message); return bad; }
  const CAT = ctx.CABLING_CATALOG, SC = ctx.CABLING_SCENARIOS, BY = {};
  CAT.forEach((c) => { if (BY[c.id]) fail("catalog data", "duplicate id " + c.id); BY[c.id] = c; });
  const fams = new Set(ctx.CABLING_FAMILIES.map((f) => f[0]));
  CAT.forEach((c) => {
    ["name", "kind", "fam", "use", "trait", "tell"].forEach((k) => { if (!c[k]) fail("catalog data", c.id + " has no " + k); });
    if (!fams.has(c.fam) || !ctx.CABLING_FAMILY_HINTS[c.fam] || ctx.CABLING_FAMILY_HINTS[c.fam].length !== 2) fail("catalog data", c.id + ": family " + c.fam + " has no two hints");
    if (!Array.isArray(c.near) || c.near.length !== 5 || new Set(c.near).size !== 5) fail("catalog data", c.id + " needs five different near misses");
    (c.near || []).forEach((n) => { if (!BY[n]) fail("catalog data", c.id + " near miss " + n + " is not a connector"); if (n === c.id) fail("catalog data", c.id + " lists itself"); });
  });
  if (SC.length !== 5) fail("catalog data", "there should be five extra scenarios, not " + SC.length);
  SC.forEach((s) => {
    if (!BY[s.answer]) fail("catalog data", s.id + ": answer " + s.answer + " is not a connector");
    if (s.img && !BY[s.img]) fail("catalog data", s.id + ": picture " + s.img + " is not a connector");
    if (s.near.length !== 5 || new Set(s.near).size !== 5 || s.near.indexOf(s.answer) >= 0) fail("catalog data", s.id + " needs five near misses, none of them the answer");
    s.near.forEach((n) => { if (!BY[n]) fail("catalog data", s.id + " near miss " + n + " is not a connector"); });
    ["ask", "h1", "h2", "why"].forEach((k) => { if (!s[k]) fail("catalog data", s.id + " has no " + k); });
  });
  const tagged = CAT.filter((c) => c.obj).map((c) => c.id).sort().join(","), want = OBJ.slice().sort().join(",");
  if (tagged !== want) fail("objectives tags", "tagged " + tagged.split(",").length + ", the doc names " + OBJ.length + ": " + CAT.filter((c) => !!c.obj !== OBJ.includes(c.id)).map((c) => c.id).join(", "));

  /* ---- the views ---- */
  const imgBlock = between(html, "CABLING-IMAGES") || "", IMG = {}, SRC = {};
  for (const m of imgBlock.matchAll(/"([a-z0-9-]+--(?:end|top|angle))": "(data:image\/webp;base64,[^"]+)"/g)) { IMG[m[1]] = m[2]; SRC[m[2]] = m[1].split("--")[0]; }
  const views = (c) => (c.kind === "port" ? ["end", "angle"] : ["end", "top"]).map((v) => c.id + "--" + v);
  CAT.forEach((c) => views(c).forEach((k) => { if (!IMG[k]) fail("views", k + " is not embedded"); }));
  Object.keys(IMG).forEach((k) => { if (!BY[k.split("--")[0]]) fail("views", k + " belongs to no connector"); });

  /* ---- the page ---- */
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pb-cab-")); fs.writeFileSync(path.join(dir, "index.html"), html);
  const srv = http.createServer((q, r) => { const f = path.join(dir, decodeURIComponent(q.url.split("?")[0]).slice(1) || "index.html"); fs.readFile(f, (e, b) => { r.writeHead(e ? 404 : 200, { "content-type": "text/html" }); r.end(e ? "" : b); }); }).listen(0);
  const U = "http://127.0.0.1:" + srv.address().port + "/index.html";
  const ctxB = await browser.newContext({ viewport: { width: 1100, height: 900 }, reducedMotion: "reduce" });
  const page = await ctxB.newPage(); page.setDefaultTimeout(8000);
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  try {
    await page.goto(U); await page.evaluate(() => { try { localStorage.clear(); } catch (e) { } }); await page.reload();

    /* every view shows a model: enough pixels off the background, and the dark outline round it */
    const blank = await page.evaluate(async (IMG) => {
      const out = [], c = document.createElement("canvas"); c.width = 480; c.height = 360; const g = c.getContext("2d", { willReadFrequently: true });
      for (const k of Object.keys(IMG)) {
        const im = new Image(); im.src = IMG[k];
        try { await im.decode(); } catch (e) { out.push(k + " does not decode"); continue; }
        if (im.naturalWidth !== 480 || im.naturalHeight !== 360) { out.push(k + " is " + im.naturalWidth + "x" + im.naturalHeight); continue; }
        g.drawImage(im, 0, 0); const d = g.getImageData(0, 0, 480, 360).data;
        let model = 0, line = 0;
        for (let i = 0; i < d.length; i += 4) {
          const y = (i / 4 / 480) | 0, t = y / 359, br = 0xe9 + (0xc4 - 0xe9) * t, bgg = 0xed + (0xcc - 0xed) * t, bb = 0xf1 + (0xd4 - 0xf1) * t;
          if (Math.abs(d[i] - br) + Math.abs(d[i + 1] - bgg) + Math.abs(d[i + 2] - bb) > 45) model++;
          if (Math.abs(d[i] - 0x26) < 14 && Math.abs(d[i + 1] - 0x2d) < 14 && Math.abs(d[i + 2] - 0x38) < 14) line++;
        }
        if (model < 480 * 360 * 0.02) out.push(k + " is nearly blank (" + model + " model pixels)");
        else if (line < 300) out.push(k + " has no outline (" + line + " outline pixels)");
      }
      return out;
    }, IMG);
    blank.forEach((w) => fail("blank render", w));

    /* the gallery */
    const nObj = CAT.filter((c) => c.obj).length;
    const shown = () => page.$$eval("#cabGallery .cab-card", (cs) => cs.length);
    if ((await shown()) !== nObj) fail("gallery", "the default filter shows " + (await shown()) + " cards, not the " + nObj + " on the objectives");
    await page.click('[data-cab-tag="rec"]');
    if ((await shown()) !== CAT.length - nObj) fail("gallery", "Good to recognize shows " + (await shown()) + ", not " + (CAT.length - nObj));
    await page.click('[data-cab-tag="all"]');
    if ((await shown()) !== CAT.length) fail("gallery", "All shows " + (await shown()) + ", not " + CAT.length);
    await page.selectOption("#cabFamily", "power");
    if ((await shown()) !== CAT.filter((c) => c.fam === "power").length) fail("gallery", "the Power family shows the wrong cards");
    await page.selectOption("#cabFamily", "all");
    const loaded = await page.evaluate(async () => {
      const imgs = Array.from(document.querySelectorAll("#cabGallery img"));
      await Promise.all(imgs.map((i) => i.decode().catch(() => null)));
      return { n: imgs.length, ok: imgs.filter((i) => i.naturalWidth === 480).length };
    });
    if (loaded.n !== CAT.length * 2 || loaded.ok !== loaded.n) fail("gallery", loaded.ok + " of " + loaded.n + " gallery pictures loaded (want " + CAT.length * 2 + ")");

    /* the drill: the whole deck of every connector plus the scenarios */
    await page.selectOption("#cabPool", "all");
    const answerOf = async () => {
      const src = await page.$eval("#cablingContainer .cab-drill", (d) => { const i = d.querySelector(".cab-views img"); return i ? i.getAttribute("src") : null; });
      const ask = await page.$eval("#cablingContainer .cab-drill__ask", (e) => e.textContent);
      const sc = SC.find((s) => s.ask === ask);
      return sc ? { id: sc.answer, sc } : { id: SRC[src], sc: null };
    };
    const state = () => page.evaluate(() => {
      const card = document.querySelector("#cablingContainer .cab-drill");
      const opts = Array.from(card.querySelectorAll("[data-cab-opt]")).map((b) => {
        const cs = getComputedStyle(b), st = b.querySelector(".cab-opt__state"), why = b.querySelector(".cab-opt__why");
        return { id: b.getAttribute("data-cab-opt"), out: b.classList.contains("is-out"), right: b.classList.contains("is-right"), shown: b.classList.contains("is-shown"), disabled: b.disabled,
          bg: cs.backgroundColor, shadow: cs.boxShadow, state: getComputedStyle(st).display !== "none" ? st.textContent : "", why: getComputedStyle(why).display !== "none" ? why.textContent : "" };
      });
      const hints = Array.from(card.querySelectorAll(".cab-hint")).map((h) => (h.hidden ? null : h.textContent));
      const ex = card.querySelector(".cab-explain");
      return { opts, hints, msg: card.querySelector(".cab-msg").textContent, explain: ex.hidden ? null : ex.textContent, solved: card.querySelector(".cab-drill__meta span:last-child").textContent };
    });
    const seen = new Set(), deck = CAT.length + SC.length;
    for (let q = 0; q < deck; q++) {
      const a = await answerOf(), s0 = await state(), key = a.sc ? a.sc.id : a.id;
      if (!a.id) { fail("drill six", "question " + (q + 1) + ": cannot tell its answer"); break; }
      seen.add(key);
      const ids = s0.opts.map((o) => o.id);
      if (ids.length !== 6 || new Set(ids).size !== 6 || ids.filter((i) => i === a.id).length !== 1) fail("drill six", key + ": options " + ids.join(","));
      const wrong = ids.filter((i) => i !== a.id), name = BY[a.id].name;
      const closest = (a.sc ? a.sc.near : BY[a.id].near)[0];
      /* the full rule walk on a sample of questions, a quick solve on the rest */
      const deep = q % 6 === 0;
      if (deep) {
        /* Patch Bay's reduced-motion rule gives every element a 0.01 ms transition, so let a frame pass before reading styles */
        const pick = async (id) => { await page.click('#cablingContainer [data-cab-opt="' + id + '"]'); await page.waitForTimeout(40); };
        const order = wrong.filter((i) => i !== closest).concat([closest]);   /* leave the closest one till last */
        for (let k = 0; k < 4; k++) {
          await pick(order[k]); const s = await state(), n = k + 1;
          for (let j = 0; j <= k; j++) {
            const o = s.opts.find((x) => x.id === order[j]);
            if (!o.out) fail("stays red", key + ": " + order[j] + " is no longer marked after miss " + n);
            else {
              if (!/^rgb\(2[0-9]{2}, (1[89][0-9]|2[0-2][0-9]), (1[89][0-9]|2[0-2][0-9])\)$/.test(o.bg)) fail("three marks", key + ": a ruled-out option's ground is " + o.bg + ", not red");
              if (!/inset/.test(o.shadow) || !/rgb\(142, 27, 27\)/.test(o.shadow)) fail("three marks", key + ": a ruled-out option has no red inset rule");
              if (o.state !== "Ruled out") fail("three marks", key + ": a ruled-out option does not say Ruled out");
            }
          }
          if (s.hints[0] != null && n < 3) fail("hint 1 at miss 3", key + ": a hint showed at miss " + n);
          if (n >= 3 && s.hints[0] == null) fail("hint 1 at miss 3", key + ": no hint 1 at miss " + n);
          if (n < 4 && s.hints[1] != null) fail("hint 2 at miss 4", key + ": hint 2 showed at miss " + n);
          if (n >= 4 && s.hints[1] == null) fail("hint 2 at miss 4", key + ": no hint 2 at miss " + n);
          if (s.hints[2] != null) fail("two left", key + ": rung 3 showed at miss " + n);
          if (n <= 2 && s.opts.some((o) => o.why)) fail("hint 1 at miss 3", key + ": a reason was given at miss " + n);
        }
        /* clear: the board empties, the hints stay */
        await page.click("#cablingContainer .cab-btn--ghost:has-text('Clear my red marks')"); await page.waitForTimeout(40);
        let s = await state();
        if (s.opts.some((o) => o.out)) fail("clear keeps hints", key + ": clearing left red marks");
        if (s.hints[0] == null || s.hints[1] == null) fail("clear keeps hints", key + ": clearing took the hints away");
        /* miss 5: down to two, a reason on every option struck */
        await pick(order[0]); s = await state();
        const alive = s.opts.filter((o) => !o.out).map((o) => o.id);
        if (alive.length !== 2 || alive.indexOf(a.id) < 0) fail("two left", key + ": after miss 5, alive: " + alive.join(","));
        if (s.hints[2] == null) fail("two left", key + ": no rung 3 text at miss 5");
        s.opts.filter((o) => o.out).forEach((o) => { if (!o.why || o.why.length < 12) fail("reasons", key + ": " + o.id + " was struck without a reason"); });
        /* never the answer, however many misses: the messages, hint 1, hint 3 and every reason
           never carry its name; hint 2 is the family's rule, the same words for every connector in
           the family (never tailored to this one), and a scenario's hint 2 does not name its answer */
        const help = [s.msg, s.hints[0], s.hints[2]].concat(s.opts.map((o) => o.why)).join(" | ");
        if (help.indexOf(name) >= 0) fail("never names", key + ": the help names the answer (" + name + ")");
        const h2 = (s.hints[1] || "").replace(/^Hint 2 — what decides it/, "");
        if (a.sc ? h2.indexOf(name) >= 0 : h2 !== ctx.CABLING_FAMILY_HINTS[BY[a.id].fam][1]) fail("never names", key + ": hint 2 is tailored to the answer");
        await pick(alive.find((i) => i !== a.id)); s = await state();
        const ans = s.opts.find((o) => o.id === a.id);
        if (ans.disabled || ans.out) fail("unlimited", key + ": the answer was locked or struck after six misses");
        if (s.hints[2] == null || s.hints[0] == null) fail("two left", key + ": the hints went away after miss 6");
      }
      const before = await page.$eval("#cablingContainer .cab-drill__meta span:last-child", (e) => +e.textContent.replace(/\D/g, ""));
      await page.click('#cablingContainer [data-cab-opt="' + a.id + '"]'); await page.waitForTimeout(40);
      const sv = await state(), ans = sv.opts.find((o) => o.id === a.id);
      if (!ans.right || ans.state !== "Correct") fail("solved", key + ": the right answer is not marked Correct");
      if (!sv.explain || sv.explain.indexOf(name) < 0) fail("solved", key + ": no explanation naming it after solving");
      if (sv.opts.some((o) => !o.disabled)) fail("solved", key + ": options still live after solving");
      if (+sv.solved.replace(/\D/g, "") !== before + 1) fail("solved", key + ": the solved count did not go up");
      await page.click("#cablingContainer .cab-btn:has-text('Next connector')");
    }
    if (seen.size !== deck) fail("drill six", "one pass of the deck asked " + seen.size + " different questions, not " + deck);

    /* Instructor Mode: behind the PIN, reveal, then hide */
    const pin = (html.match(/var INSTRUCTOR_PIN = "(\d+)"/) || [])[1];
    await page.click("label.instructor-toggle:has(#cablingInstructorToggle)");
    await page.fill("#pinModalInput", "0000"); await page.click("#pinModalSubmit"); await page.waitForTimeout(150);
    if ((await state()).opts.some((o) => o.shown)) fail("instructor", "a wrong PIN revealed the answer");
    await page.fill("#pinModalInput", pin || ""); await page.click("#pinModalSubmit"); await page.waitForTimeout(300);
    let si = await state();
    const shownOpt = si.opts.find((o) => o.shown);
    if (!shownOpt || shownOpt.state !== "Shown by instructor") fail("instructor", "the PIN did not reveal the answer");
    else if (shownOpt.id !== (await answerOf()).id) fail("instructor", "Instructor Mode marked the wrong option");
    await page.click("label.instructor-toggle:has(#cablingInstructorToggle)"); await page.waitForTimeout(200);
    si = await state();
    if (si.opts.some((o) => o.shown || o.disabled)) fail("instructor", "switching Instructor Mode off did not hand the question back");

    /* Easier reading, remembered */
    await page.click("#dysBtn");
    if (!(await page.evaluate(() => document.documentElement.classList.contains("dys")))) fail("remembered", "Easier reading did not switch on");
    await page.reload();
    if (!(await page.evaluate(() => document.documentElement.classList.contains("dys")))) fail("remembered", "Easier reading was not remembered after a reload");
    if ((await page.textContent("#dysBtn")) !== "Easier reading: on") fail("remembered", "the button does not say it is on after a reload");
    const ff = await page.$eval(".cab-drill__ask", (e) => getComputedStyle(e).fontFamily);
    if (!/Atkinson|Verdana/.test(ff)) fail("remembered", "Easier reading did not change the face (" + ff + ")");
    await page.click("#dysBtn"); await page.reload();
    if (await page.evaluate(() => document.documentElement.classList.contains("dys"))) fail("remembered", "Easier reading did not stay off");

    /* AAA on painted pixels over the new parts, light and dark, with the drill in each state */
    for (const theme of ["light", "dark"]) {
      await page.evaluate((t) => { localStorage.setItem("patchbay-theme", t); }, theme); await page.reload();
      await page.selectOption("#cabPool", "all");
      await sweep(page, "#dysBtn", theme + " header", fail);
      await page.click('[data-cab-tag="all"]');
      await sweep(page, ".module--cabling .cab-section:first-of-type", theme + " gallery", fail);
      const a = await answerOf(), ids = (await state()).opts.map((o) => o.id).filter((i) => i !== a.id);
      await sweep(page, "#cablingContainer", theme + " drill fresh", fail);
      for (const id of ids) await page.click('#cablingContainer [data-cab-opt="' + id + '"]');
      await sweep(page, "#cablingContainer", theme + " drill narrowed", fail);
      await page.click('#cablingContainer [data-cab-opt="' + a.id + '"]');
      await sweep(page, "#cablingContainer", theme + " drill solved", fail);
      await sweep(page, ".module--cabling .module__body > .module__intro, .module--cabling .practice-header", theme + " headers", fail);
    }
  } catch (e) { fail("drive", String(e.message).split("\n")[0]); }
  errs.forEach((e) => fail("page errors", e));
  await ctxB.close(); srv.close(); fs.rmSync(dir, { recursive: true, force: true });
  return bad;
}

/* the painted-pixel sweep: text hidden, the page photographed, each run of text against the pixels behind it */
const lum = (c) => { const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
async function sweep(page, sel, label, fail) {
  await page.mouse.move(0, 0); await page.waitForTimeout(150);
  const runs = await page.evaluate((sel) => {
    const out = [];
    document.querySelectorAll(sel).forEach((root) => {
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
      while ((n = w.nextNode())) {
        if (!n.textContent.trim()) continue;
        const el = n.parentElement; const cs = getComputedStyle(el);
        if (el.closest("[hidden]") || cs.visibility === "hidden" || cs.display === "none") continue;
        let op = 1; for (let a = el; a; a = a.parentElement) op *= parseFloat(getComputedStyle(a).opacity);
        const rg = document.createRange(); rg.selectNodeContents(n);
        for (const r of rg.getClientRects()) if (r.width > 4 && r.height > 6)
          out.push({ t: n.textContent.trim().slice(0, 40), c: cs.color, op, s: parseFloat(cs.fontSize), b: parseInt(cs.fontWeight) >= 700, x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height, el: el.className || el.tagName });
      }
    });
    return out;
  }, sel);
  if (!runs.length) { fail("contrast", label + ": no text found under " + sel); return; }
  const tag = await page.addStyleTag({ content: "*{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important}" });
  const png = await page.screenshot({ fullPage: true });
  await tag.evaluate((t) => t.remove());
  const bgs = await page.evaluate(async ({ b64, runs }) => {
    const img = new Image(); img.src = "data:image/png;base64," + b64; await img.decode();
    const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; const x = c.getContext("2d"); x.drawImage(img, 0, 0);
    return runs.map((r) => { const w = Math.max(1, Math.round(r.w - 4)), h = Math.max(1, Math.round(r.h - 4));
      const d = x.getImageData(Math.round(r.x + 2), Math.round(r.y + 2), w, h).data, cnt = {}; let tot = 0;
      for (let i = 0; i < d.length; i += 4) { const k = d[i] + "," + d[i + 1] + "," + d[i + 2]; cnt[k] = (cnt[k] || 0) + 1; tot++; }
      return Object.entries(cnt).filter(([, v]) => v / tot >= 0.08).map(([k]) => k.split(",").map(Number)); });
  }, { b64: png.toString("base64"), runs });
  runs.forEach((r, i) => {
    const m = r.c.match(/[\d.]+/g).map(Number), a = (m[3] ?? 1) * r.op, need = r.s >= 24 || (r.s >= 18.66 && r.b) ? 4.5 : 7;
    for (const bg of bgs[i]) { const fg = [0, 1, 2].map((k) => m[k] * a + bg[k] * (1 - a)), q = ratio(fg, bg);
      if (q < need) { fail("contrast", label + ": \"" + r.t + "\" (" + r.el + ") " + q.toFixed(2) + ":1 on rgb(" + bg + ")"); break; } }
  });
}

/* ---- run, or plant ---- */
const REAL = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const sub = (a, b) => (h) => { if (h.indexOf(a) < 0) throw new Error("plant anchor missing: " + a.slice(0, 60)); return h.replace(a, b); };
const PLANTS = [
  ["catalog copy", "the page's catalog edited by hand", sub('name: "RJ45 (8P8C)"', 'name: "RJ-45"')],
  ["catalog data", "a near miss that is not a connector", sub('near: ["rj11", "rj45-loop", "dac", "lc", "usb-a"]', 'near: ["rj11", "rj45-loop", "dac", "lc", "usb-x"]')],
  ["objectives tags", "LC untagged", (h) => sub('{ id: "lc", name: "LC duplex (single-mode)", kind: "plug", fam: "fiber", obj: true,', '{ id: "lc", name: "LC duplex (single-mode)", kind: "plug", fam: "fiber", obj: false,')(h)],
  ["views", "a view missing", (h) => h.replace(/\n    "bnc--top": "data:image\/webp;base64,[^"]+",/, "")],
  ["blank render", "a view replaced by a blank sweep", (h) => h.replace(/("st--end": ")data:image\/webp;base64,[^"]+/, "$1" + BLANK)],
  ["hint 1 at miss 3", "the first hint a miss early", sub("h1.hidden = wrongs < 3;", "h1.hidden = wrongs < 2;")],
  ["hint 2 at miss 4", "the second hint never comes", sub("h2.hidden = wrongs < 4;", "h2.hidden = true;")],
  ["two left", "rung 3 strikes everything but the answer", sub("if (n === keep) return;", "if (false) return;")],
  ["reasons", "options struck without a reason", sub('setState(n, "is-out", "Ruled out", strikeReason(n));', 'setState(n, "is-out", "Ruled out", "");')],
  ["never names", "rung 3 says the answer", sub('h3.hidden = wrongs < 5;', 'h3.hidden = wrongs < 5; if (wrongs >= 5) msg.textContent = "It is the " + CAB_BY_ID[q.answer].name + ".";')],
  ["never names", "hint 2 tailored to name the answer", sub("h1: c.h1 || fh[0], h2: c.h2 || fh[1],", "h1: c.h1 || fh[0], h2: (c.h2 || fh[1]) + \" Here: \" + c.name + \".\",")],
  ["stays red", "a new miss clears the old red", sub("out[id] = true;\n      wrongs++;", "Object.keys(out).forEach(function (k) { setState(k, null); }); out = {}; out[id] = true;\n      wrongs++;")],
  ["three marks", "red by colour alone", sub('setState(id, "is-out", "Ruled out", wrongs >= 5 ? strikeReason(id) : "");', 'setState(id, "is-out", "", wrongs >= 5 ? strikeReason(id) : "");')],
  ["unlimited", "the answer locked after six misses", sub("if (wrongs >= 5) narrow();\n    }", "if (wrongs >= 5) narrow();\n      if (wrongs >= 6) buttons[q.answer].disabled = true;\n    }")],
  ["clear keeps hints", "clearing wipes the hints", sub('msg.textContent = wrongs ? "Red marks cleared. Your hints stay." : "";', 'wrongs = 0; h1.hidden = h2.hidden = h3.hidden = true; msg.textContent = "";')],
  ["instructor", "Instructor Mode reveals nothing", sub("        revealed = true;\n        finish(true);", "        revealed = true;")],
  ["remembered", "Easier reading forgotten", sub('try { localStorage.setItem(KEY, on ? "1" : "0"); } catch (e) { /* storage unavailable */ }', "")],
  ["contrast", "ruled-out options on a mid red", sub(".cab-opt.is-out { background: #f8d3d3;", ".cab-opt.is-out { background: #d04848;")]
];
const BLANK = await (async () => { const p = await browser.newPage(); const u = await p.evaluate(() => { const c = document.createElement("canvas"); c.width = 480; c.height = 360; const g = c.getContext("2d"); const gr = g.createLinearGradient(0, 0, 0, 360); gr.addColorStop(0, "#e9edf1"); gr.addColorStop(1, "#c4ccd4"); g.fillStyle = gr; g.fillRect(0, 0, 480, 360); return c.toDataURL("image/webp", 0.82); }); await p.close(); return u; })();

let code = 0;
if (process.argv.includes("--plant")) {
  for (const [name, what, apply] of PLANTS) {
    let h; try { h = apply(REAL); } catch (e) { console.log("PLANT BROKEN  " + what + ": " + e.message); code = 1; continue; }
    if (h === REAL) { console.log("PLANT BROKEN  " + what + ": changed nothing"); code = 1; continue; }
    const got = await check(h), hit = got.filter((b) => b.name === name);
    console.log((hit.length ? "caught  " : "MISSED  ") + what + (hit.length ? "  (" + hit[0].what + ")" : "  — got: " + (got.map((b) => b.name).join(", ") || "nothing")));
    if (!hit.length) code = 1;
  }
  console.log(code ? "A plant got through." : PLANTS.length + " plants, every one caught.");
} else {
  const got = await check(REAL);
  got.forEach((b) => console.log("FAIL  " + b.name + ": " + b.what));
  console.log(got.length ? got.length + " failures" : "PASS: catalog, " + 168 + " views, gallery, the whole drill deck, instructor, easier reading, AAA in both themes");
  code = got.length ? 1 : 0;
}
await browser.close();
process.exit(code);
