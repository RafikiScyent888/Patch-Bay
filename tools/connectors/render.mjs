/* Renders every connector model to WebP, two views each, into out/.
   node tools/connectors/render.mjs [id ...]
   The views each id gets come from VIEWS_FOR below: plugs get end + top,
   ports get end + angle. */
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import url from "node:url";
const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "out");
const MIME = { ".html": "text/html", ".js": "text/javascript" };
const srv = http.createServer((q, r) => { const rel = decodeURIComponent(q.url.split("?")[0]).slice(1) || "render.html"; fs.readFile(path.join(HERE, rel), (e, b) => { r.writeHead(e ? 404 : 200, { "content-type": MIME[path.extname(rel)] || "application/octet-stream" }); r.end(e ? "" : b); }); }).listen(0);
const pw = await import(process.env.PLAYWRIGHT || "/opt/node22/lib/node_modules/playwright/index.mjs"); const { chromium } = pw.default || pw;
const B = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--headless=new", "--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await B.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
await p.goto("http://127.0.0.1:" + srv.address().port + "/render.html");
await p.waitForFunction(() => window.ready, null, { timeout: 60000 }).catch(() => {});
if (errs.length) { console.error(errs.join("\n")); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });
const all = await p.evaluate(() => window.ids());
const want = process.argv.slice(2).length ? process.argv.slice(2) : all;
const kinds = await p.evaluate(() => window.kinds ? window.kinds() : {});
let bytes = 0;
for (const id of want) {
  const views = kinds[id] === "port" ? ["end", "angle"] : ["end", "top"];
  for (const v of views) {
    let d;
    try { d = await p.evaluate(([id, v]) => window.shot(id, v), [id, v]); }
    catch (e) { console.error("\n" + id + " " + v + ": " + e.message.split("\n")[0]); process.exitCode = 1; continue; }
    const buf = Buffer.from(d.split(",")[1], "base64"); bytes += buf.length;
    fs.writeFileSync(path.join(OUT, id + "--" + v + ".webp"), buf);
  }
  process.stdout.write(id + " ");
}
console.log("\n" + want.length + " connectors, " + Math.round(bytes / 1024) + " KB");
if (errs.length) { console.error(errs.join("\n")); process.exitCode = 1; }
await B.close(); srv.close();
