# Lab test research — 15.10.2026

Eleven searches (ten narrow, one broad) for test methods the lab can copy. Kept here: what
each catches, its oracle, the source, and where it lands in Drift. "Have" marks a law that
already exists. Thresholds marked (ours) are not from a source and get calibrated on our runs.

## Queue, by value for Drift

| # | Law | Oracle | Lands in | Source |
|---|---|---|---|---|
| 1 | Pipeline built mid-walk | `createRenderPipeline`/`createShaderModule` count after entry = 0; a frame > 2× median holding one is named | `jank.py` | docs.wavedash.com/publishing/shader-stutter |
| 2 | Long Animation Frames with blame | `long-animation-frame` entries: `blockingDuration`, `scripts[].sourceFunctionName` — the top three in the report | `jank.py` | developer.mozilla.org/…/Long_animation_frame_timing |
| 3 | Market arbitrage loop | Bellman-Ford over −log(price) on the live market graph: any cycle with product > 1 after fees is red | Node suite | ir.cwi.nl/pub/21923 (Micro-Machinations) |
| 4 | Faucets vs sinks | N scripted strategies × T game hours: money in/out per source; p99 wealth ≤ k× median (ours) | Node suite | scitepress.org/Papers/2021/103928 |
| 5 | Save fuzz | truncate / flip bytes / empty / wrong types on a real save: clean refusal, no throw, no NaN in `G`; round-trip `applySave(snapshot())` idempotent | Node suite (check `savenet` first) | bugnet.io/blog/how-to-test-game-saves-for-corruption; forums.factorio.com/viewtopic.php?p=482480 |
| 6 | Old-save corpus | one save per shipped version, loaded and checked by meaning (money, hold, progress), not by «loaded» | Node suite | bugnet.io/blog/how-to-test-save-compatibility-across-versions |
| 7 | Two-way reachability | from the pad every cave, deposit and POI reachable and back by walking rules; «in but not out» is red | `91qm-seeds` | pcgworkshop.com/archive/cooper2025softlocks.pdf |
| 8 | Slow CPU | `Emulation.setCPUThrottlingRate` 4×: same walk, world time keeps pace, p95 within a weak-phone budget | `jank.py` | testplane.io/docs/basic-guides/emulation |
| 9 | Network chaos on the cloud | CDP offline mid-save, 2 s latency, 20 KB/s; 500 and duplicate replies: no throw, save converges, status visible | Chrome suite | lightrun.com/answers/puppeteer-puppeteer-emulate-offline |
| 10 | Flicker / popping | camera still, 30–60 frames, 16×16 tiles: A-B-A-B luminance alternation, or a one-frame jump under a smooth camera | `jank.py` + readback | sciencedirect.com/science/article/pii/S0952197625035286 |
| 11 | Colour-blind HUD | `Emulation.setEmulatedVisionDeficiency` ×4 through the vision walk: paired signals ΔE2000 ≥ 10 (ours), text ≥ 4.5:1 | `test-geom.js` | pptr.dev/api/puppeteer.page.emulatevisiondeficiency |
| 12 | Audio clicks and clipping | render in `OfflineAudioContext`: |x| ≥ 0.999 share ≈ 0; first difference > k·MAD = click | Node/Chrome suite | essentia.upf.edu/tutorial_audioproblems_clickdetector.html |
| 13 | Coverage map for the hunt | visited cells and (screen, action) pairs; the bot prefers the least visited; «never reached» list in the report | hunt | ea.com/seed/news/cog2021-curiosity-driven-rl-agents |
| 14 | Stuck watchdog | no progress (position, screen, money) for N s under the bot = stuck; heatmap of episode ends | hunt | arxiv.org/pdf/2103.13798 |
| 15 | Metamorphic pairs | shift the world by a constant, halve dt, shuffle entity order: same outcome hash | Node suite | eprints.nottingham.ac.uk/51607 |
| 16 | Duel balance | ~2000 Monte-Carlo duels per pairing, win rate 45–55 % with CI | Node probe | arxiv.org/pdf/1603.03795 |
| 17 | Photosensitivity | ≤ 3 flashes per second, red flash threshold separate | `jank.py` frames | w3.org/WAI/WCAG22/Techniques/general/G15.html |
| 18 | Input-to-frame latency | `event.timeStamp` → rAF that applies it → next rAF; p95 ≤ 2 frames | `jank.py` | w3c.github.io/event-timing |
| 19 | Heap leak by three snapshots | baseline → dock/undock ×10 → final; retained growth with retainer chain | `jank.py` via HeapProfiler | memlab |
| 20 | GPU memory | wrapper counts live buffer/texture bytes; after leaving a scene back to base | game hook | sitepoint.com/profiling-webgpu-memory-local-ai |
| 21 | Thermal on S23 | 20 min scene, `dumpsys thermalservice` every 30 s, fps curve: drop after warm-up ≤ 15 % (ours) | phone tools | developer.chrome.com/docs/web-platform/compute-pressure |
| 22 | Energy per minute | `batterystats --reset` / `--checkin`, Chrome UID mAh/min vs base, A/B/A | phone tools | developer.android.com/tools/performance/batterystats-battery-historian |

## Already in the lab

FCAT hitch vs rolling median, regression vs past runs (BugNet: p99 > 10 % worse fails — we use
25 %), long tasks, GPU timestamps, heap floor, camera/hero/zoom jerk, pause catch-up, GPU
errors, seed sweep, vision walk (WCAG target sizes, contrast, overflow — the GLIB/AG3 classes
by numbers instead of a classifier), hunt bot, save/cloud/two-tab suites, `stateHash` same-hash.

## Read but not taken

RL and MCTS testers (Wuji, Ariyurek, Holmgard) — training cost out of scale for us; vision-LLM
glitch judges — 46 % accuracy on subtle cases (arxiv.org/pdf/2604.11082); FLIP/SSIM goldens —
the vision judges by numbers, and goldens are red on this machine already.

## Studio practice worth remembering

Sea of Thieves: many small gameplay tests, framework made so tests are cheap to write
(gdcvault.com/play/1026366). Riot: ~100k cases a day, report within an hour of check-in, bugs
found by automation fixed 8× faster (riotgames.com/en/news/automated-testing-league-legends).
King BAIT: explore screens until no new state appears; missing texture by contour
(infoq.com/articles/candy-crush-QA-AI-saga). The Division: the bot plays through the same input
as a person, never by teleporting state (gdconf.com/news/see-how-ubisoft-tested-division-automated-players-gdc-2019).
