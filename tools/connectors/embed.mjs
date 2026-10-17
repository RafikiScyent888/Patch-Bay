/* Copies the catalog (catalog.js) and the rendered views (out/*.webp)
   into index.html, between the CABLING-CATALOG and CABLING-IMAGES
   markers, so the page stays one self-contained file that works offline.
   node tools/connectors/embed.mjs        (after render.mjs) */
import fs from "node:fs"; import path from "node:path"; import url from "node:url"; import vm from "node:vm";
const HERE = path.dirname(url.fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, "../.."), PAGE = path.join(ROOT, "index.html");
const catalog = fs.readFileSync(path.join(HERE, "catalog.js"), "utf8").replace(/\s+$/, "");
const ctx = {}; vm.createContext(ctx); vm.runInContext(catalog, ctx);
const want = [];
for (const c of ctx.CABLING_CATALOG) for (const v of c.kind === "port" ? ["end", "angle"] : ["end", "top"]) want.push(c.id + "--" + v);
const lines = [], missing = [];
let bytes = 0;
for (const k of want) {
  const f = path.join(HERE, "out", k + ".webp");
  if (!fs.existsSync(f)) { missing.push(k); continue; }
  const b = fs.readFileSync(f); bytes += b.length;
  lines.push('    "' + k + '": "data:image/webp;base64,' + b.toString("base64") + '"');
}
const imgs = "  var CABLING_IMG = {\n" + lines.join(",\n") + "\n  };";
let html = fs.readFileSync(PAGE, "utf8");
function put(name, body) {
  const a = "/* " + name + ":BEGIN */", z = "/* " + name + ":END */", i = html.indexOf(a), j = html.indexOf(z);
  if (i < 0 || j < i) throw new Error("markers missing: " + name);
  html = html.slice(0, i + a.length) + "\n" + body + "\n  " + html.slice(j);
}
put("CABLING-CATALOG", catalog);
put("CABLING-IMAGES", imgs);
fs.writeFileSync(PAGE, html);
console.log(lines.length + " views embedded (" + Math.round(bytes / 1024) + " KB of WebP); page now " + Math.round(html.length / 1024) + " KB");
if (missing.length) console.log(missing.length + " views not rendered yet (those connectors stay out of the gallery and drill): " + missing.slice(0, 12).join(", ") + (missing.length > 12 ? " ..." : ""));
