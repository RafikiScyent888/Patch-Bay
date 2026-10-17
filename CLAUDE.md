# Patch Bay — project context

Read with `/root/.claude/CLAUDE.md`, which sets the rules and wins over this
file: push to GitHub after each verified change, AAA contrast on painted
pixels, objectives from the owner's Google Doc, previews before building.

## What this is

`index.html` is the whole site: one self-contained page (fonts and every
image embedded, works offline). GitHub Pages serves `main`. Modules sit in
coloured "circuit" tiles; inside a tile everything reads `--text` on a pale
ground.

## Cabling (built 17 October 2026)

- **Source:** the owner's three connector charts. Every connector on them,
  plus the ports students meet as sockets, plus DAC, an SFP+ transceiver
  and the RJ45 loopback plug (named in the owner's doc, not on the charts).
  84 entries in 11 families, and the standing five extra scenarios.
- **Tags:** "On your objectives" is exactly the connectors the owner's doc
  names (read 17 Oct 2026): Network+ fiber, coax, DAC, SC, LC, ST, MPO,
  RJ11, RJ45, F-type, BNC; Core 1 HDMI, USB, loopback plugs. Everything
  else is "Good to recognize". `verify/cabling.mjs` holds the list.
- **Chart corrections:** the chart's "Mini-A"/"Micro-A" are drawn as Mini-B
  and Micro-B; C13 (cord socket) and C14 (inlet) are separate entries, as
  are C19 and C20. The charts are third-party photos: nothing is copied.
- **Pictures:** three.js models in `tools/connectors/models.js` (kit in
  `kit.js`, some parts copied from the E4 labs into `tools/connectors/e4/`).
  Plugs get an end view and a top view (nose pointing right); ports get
  face-on and angled. A 2 px dark outline runs round every model so pale
  plastic and metal don't melt into the light background. Object colours
  are the real ones (beige SC, aqua MPO, PC audio colours); the page stays
  in the royal palette. No brand names or logos on any model.
- **Pipeline:** `node tools/connectors/render.mjs [id ...]` writes
  `tools/connectors/out/*.webp`; `node tools/connectors/embed.mjs` copies
  `catalog.js` and the renders into `index.html` between the
  `CABLING-CATALOG` and `CABLING-IMAGES` markers. Edit the catalog in
  `catalog.js`, never in the page.
- **Drill rules:** six options (one right, five near misses, the closest
  first in `near`); a wrong pick goes red and stays red, marked three ways
  (red ground, inset rule, the words "Ruled out"); nothing at misses 1-2,
  hint 1 (where to look) at 3, hint 2 (the family's rule) at 4, and from 5
  the field narrowed to two with a reason on every option struck, for
  ever. "Clear my red marks" keeps the hints. Nothing names the answer.
- The old nine-photo practice cards were replaced by the drill.

## Easier reading

A header button (`#dysBtn`) switches the whole page to a dyslexia-friendly
face with wider spacing; remembered in localStorage (`patchbay-dyslexia`).

## Checks (need Playwright; not needed to run the site)

- `node verify/cabling.mjs` — catalog, every view, gallery, the whole drill
  deck, the hint ladder, Instructor Mode, Easier reading, AAA on painted
  pixels in both themes. About a minute.
- `node verify/cabling.mjs --plant` — 18 planted defects; each must be caught.
- Patch Bay's reduced-motion rule gives every element a 0.01 ms transition:
  let a frame pass before reading computed styles after a click.

## Known, not yet fixed

- The instructor PIN is in the page source in plain text (it was before
  the Cabling build). Waiting on the owner: offer the hashed check the E4
  labs use.
- The README says the rest of the page clears AA; only Cabling is checked
  at AAA so far.
