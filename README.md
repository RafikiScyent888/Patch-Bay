# Patch Bay

A hands-on practice toolkit for CompTIA certification prep — built to be **Universal** across A+,
Network+, and Security+. It patches whatever gap comes up across the certs, hence the name.

**Live site:** https://rafikiscyent888.github.io/Patch-Bay/

## What's inside

| Module | Focus | 
|---|---|
| Command Tester | Two simulated shells, Windows and Linux, each with its own file system and history. Sits above a live network diagram: run `ping`, `tracert`/`traceroute`, or `pathping` and watch the packet travel hop by hop. Sixteen troubleshooting scenarios break one device on the path — find it, then repair it with `netsh` or `ifconfig` |
| Subnet Calculator | IPv4 subnetting — enter an address + CIDR, get the full breakdown |
| Practice Mode | Targeted subnetting drills across Class A, B, and C |
| OSI Model Lab | Interactive encapsulation-journey diagram, OSI layer reference, and a searchable port/protocol lookup table |
| IPv6 & EUI-64 Drills | Sixteen generated drills — hex/binary, compression, prefixes and subnet counts, address types, solicited-node multicast, and MAC-to-interface-ID conversion. No question bank; every problem is built fresh. [Also available on its own page.](https://rafikiscyent888.github.io/IPv6-Drills/) |
| VLSM | Variable Length Subnet Masking — carving one network into differently-sized blocks |
| IPv6 Reference & Compression | The format-and-compression rules, the address-range table, and straight compression practice — the reference half, where the drills above are the workout |
| Binary/Hex | Decimal, binary, and hex byte conversion drills |
| Cabling | Connector identification — real photos of RJ45, RJ11, LC, SC, ST, F-connector, BNC, USB-C, and DB-9 |

## Instructor Mode

Every practice module has an instructor toggle, PIN-protected, that reveals the correct answers for
classroom walkthroughs.

## How it's built

Patch Bay is a single self-contained HTML file — fonts and every image are embedded directly in the page
(no external requests), so it works offline, loads instantly, and prints cleanly. It follows the system's
light/dark theme automatically, with an in-page override.

Each module takes a colored circuit fill. Inside a filled tile there is no room for a red-means-wrong,
green-means-right convention to survive — the fill eats the contrast — so state is carried by glyph and
weight instead (✓ bold, ✗ struck through), and every accent routes back to the tile's own text color.
Text throughout clears WCAG AA (4.5:1) in both themes.

## Usage

Just open `index.html` in a browser, or use the GitHub Pages link above. No build step, no server
required.
