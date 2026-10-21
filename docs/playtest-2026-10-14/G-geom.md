# G - interface by numbers (test-geom.js, build 0.494.0)

Run: `node test-geom.js --page=tests.html --json=geom.json` - 17 windows, ~110 screens each, 8.6 s.

| # | where | what | evidence | file:line | severity | tech/design |
|---|---|---|---|---|---|---|
| 1 | all 17 windows (phones 320-421, landscape 568/780, tablets, PC 900-2560, native zoom, DPR 1 vs 3) | zero violations of every law (overflow, clip, edge, overlap, target, contrast, font size, junk, throw, DPR) | "0 брак" in every row, "vision clean", composition notes: none | - | info | - |
| 2 | 2000x1000 (author's PC) | not a window of the vision set; nearest are pc 1920 and pc 2560, both clean | - | tests/90b2-geom.js windows list | low | coverage gap |
