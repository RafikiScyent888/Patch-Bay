# Patch Bay — two changes

One file to edit: `index.html`. Nothing else moves.

---

## 1. Add the drills under the Subnet Calculator

Open `patchbay-ipv6-drills-section.html`. Copy the whole thing — it opens with
`<!-- PATCH BAY — IPv6 & EUI-64 Drills -->` and ends with `<!-- end IPv6 & EUI-64 Drills -->`.

In `index.html`, find the `</div>` that closes `<div class="grid-two">` — the row holding the Subnet
Calculator and the OSI Model Lab. Paste the block on the line right after it, above the VLSM module.

That's the whole install. The block carries its own `<style>`, its own `<script>`, and its own PIN
modal, so it does not touch a single line of what you already have.

**What it does on its own:**

- Renders as `<section class="module" data-circuit="blue">` — it takes the blue circuit fill.
- Every color comes from `currentColor` and your existing tokens, so light mode, dark mode, and the
  manual theme toggle all work with no extra wiring.
- Right and wrong are carried by **glyph, weight, and strike-through** — ✓ bold, ✗ struck out — not by
  color. Inside a circuit tile every accent routes to `--text`, so color was never available.
- Instructor mode is on the same PIN, **3693**, and reveals the full walkthrough for the current
  problem. Revealed problems are not scored.
- Its IDs are all `v6d*` plus `ipv6DrillInstructorToggle` / `ipv6DrillInstructorMsg`. Nothing collides
  with `ipv6Container`, `ipv6NewBtn`, or the shared `#pinModal`.

Verified: 101 assertions against the math, no console errors, clean at 390px, prints without the chrome.

---

## 2. Remove Threat Logs

Search `index.html` for **`threatlog`**, case-insensitive. Every hit belongs to this module. In order:

1. **The markup** — the whole `<section class="module module--threatlog" data-circuit="crimson"> … </section>`.
2. **The scenario bank** — `const THREATLOG_SCENARIOS = [ … ];`
3. **The state** — the `threatlogHandles` array and the `threatlogInstructorMode` flag.
4. **The renderer** — `function renderThreatlogProblems() { … }`
5. **The wiring** — the `#threatlogNewBtn` click listener, the `wireInstructorToggle(...)` call that
   passes the threatlog handles, and the initial `renderThreatlogProblems();` call.
6. **The legend** — the crimson chip in the header legend.

Then two optional sweeps, since crimson had no other tenant:

- `.module--threatlog { … }` and any `[data-circuit="crimson"] { … }` rules in the stylesheet.
- Any embedded image that only Threat Logs used. Those are base64 in the page, so pulling them out is
  the only edit here that meaningfully shrinks the file.

Leaving the CSS in breaks nothing. Leaving any of items 1–6 in throws a console error on load, because
the wiring will look for elements that are gone.

---

## 3. One thing left to decide

Your existing blue **IPv6** module drills address compression. So does **Compress** in the new one — the
new version generates its addresses instead of drawing from a list, and it names the specific miss
("right address, but not fully compressed"), and its reference panel already carries the address-range
cheat sheet.

So the old module is now a subset of the new one. My recommendation: retire it the same way you're
retiring Threat Logs — search `ipv6Container`, `ipv6NewBtn`, `ipv6InstructorToggle`, `ipv6InstructorMsg`,
`renderIpv6Problems`, and the IPv6 helper block (`randomIPv6Groups` / `expandIPv6` / `compressIPv6` /
`parseIPv6` / `groupsEqual`), and pull the lot.

Your call. Two modules named IPv6 will confuse a student before it helps one, but nothing breaks if you
keep both.
