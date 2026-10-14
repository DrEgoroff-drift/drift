# Planet performance playtest — 0.493.3 (2026-10-09)

Target: http://127.0.0.1:8814/drift.html (local copy only). Own tab in the built-in browser pane.

## Verdict on the measurement

The pane cannot give a valid fps verdict. In both `?pln=0` and `?pln=1` the page runs at
1–2 fps in the pane, while the game's own draw cost (`FRAME_JS`) is only 1.5–4 ms (pln=0) and
15–19 ms (pln=1). The gap is GPU/compositor time in this headless WebGPU stand, not game JS
(see `docs/GOTCHAS.md` on `prof()` and readback). The pane also drops `document.hidden` after
every navigation and stops rAF until it is fronted again. So the fps numbers below are
environment-bound and must not be quoted as the game's speed on a player's device.

## Table: scene / draw JS ms / rAF ms / fps / world speed

`drawJs` = `FRAME_JS` mean over drawn frames; `rAF` = mean interval between rAF callbacks;
`ws` = world time advanced per wall second (1.00 = real time).

| Scene | pln | Mode | drawJs ms | rAF ms | fps (drawn) | ws |
|---|---|---|---|---|---|---|
| surface (грунт день) | 1 | surface | 19 (last) / 18.6 | 517–1010 | 1–2 | 0.05–0.08 |
| landing (заход) | 1 | landing | 14.6 | 1010 | 1 | 0.05 |
| surface (грунт день) | 0 | surface | 2.3–2.5 | 259–604 | 1–2 | 0.05–0.07 |
| landing (заход) | 0 | landing | 1.55–1.6 | 504–604 | 1 | 0.05 |
| landing (заход), warm | 0 | landing | 9.8 | 43.8 | 12.4 | 0.24 |

Orbit (system mode) was not measured separately: the «заход» scene opens in `landing`.
Descent and the surface share the same `plnSurface` path (21pz-pln-frame.js:294).

## Findings

1. **World speed falls with fps (real, code-level).** 28-loop.js:484–491: the frame's time is
   added to `quantAcc` (clamped to 250 ms, :484), then stepped in quanta of 1000/120 ms
   (28-loop.js:161), capped at `QUANT_MAX=6` (28-loop.js:163, applied at :490). Each frame
   advances at most 6 × 8.33 ms = 50 ms of world. Below 20 fps (frame gap > 50 ms) the excess
   is discarded (`quantAcc=0`, :490), so the world slows in proportion to the frame drop. The
   measured `ws` of 0.05 at 1 fps matches this. This is the «ускоряется/замедляется» mechanism
   in the rest of the world: `G.t` (28-loop.js:509) drives fauna (21pib-pln-beast.js:164,184,
   192), tracks (21pid-pln-tracks.js:21), drill (21pic-pln-drill.js:46), the ship (21phb:302).

2. **Planet systems use wall-clock time with a different clamp.** Glide: 21pz-pln-frame.js:261
   `dt=min(.1, …wallMs…)` and `tau` .45/.7 s (:263). Weather: 21pk-pln-weather.js:36
   `dt=min(.25, …)`. Because these use wall time and the world uses quantized `G.t`, under a
   frame drop the planet and camera glide keep near-real-time motion while the world (ships,
   fauna) runs at 5–25 %. That mismatch is the likely source of «планета движется быстро».
   Above 10 fps the glide clamp (0.1 s) is not reached, so the mismatch appears only under
   stalls.

3. **No planet rotation or parallax driven by fps.** A grep over `src/21p*.js` and
   `06a-celest.js` finds no spin or parallax term that reads the frame dt. The motion the
   author sees is therefore the world-time mismatch in (1)–(2), not a spin speed.

4. **Per-frame build budgets are wall-clock.** 21pf-pln-land.js:497–508 and
   21pga-pln-plant.js:542–554 build within `wallMs()-t0 >= ms`. On a slow frame less is
   built, so terrain or flora pop in late; this is a visual lag, not a speed change.

5. **Hidden-tab rAF stall (test-only).** The pane's tab is hidden after each navigation and
   rAF stops (`document.hidden=true`). Any stand must front the tab first. Not a game bug.

## Suggestions

- Raise `QUANT_MAX` or stop discarding time: carry the excess (`quantAcc`) to the next frame
  instead of `quantAcc=0` at 28-loop.js:490, or step world time by the real `dt` clamped to
  ~250 ms, so world speed stays near real time through a short stall. Keep the 250 ms clamp
  (:484) as the only limit. Check the `WORLD_SUB`/quantised ship path (28-loop.js:534) before
  changing it.
- Drive the planet glide and weather from the same clock as `G.t` (or both from wall time with
  the same clamp) so they do not diverge under load. Align the clamps: 0.1 s (21pz:261) vs 0.25 s
  (21pk:36).
- Measure on a real device or a GPU-backed Chrome before any fps number is quoted. The pane
  stand is GPU-bound at ~1 fps and cannot rank pln=0 against pln=1 on speed. The draw-JS numbers
  (pln=1 ~15–19 ms vs pln=0 ~2–4 ms) are the only comparable figures.
- If pln=1 costs ~15 ms of JS per frame on the surface, profile the planet draw path
  (21pz-pln-frame.js:294 onward) with `prof()` in a visible tab, and note `docs/GOTCHAS.md`
  caveats on readback.

## Limits

No orbit-only scene was measured; no real-GPU device was available; the 1 fps stall in the pane
was not isolated to a single function. The code findings (1)–(2) are verified by reading the
source; the fps numbers are not a verdict on speed.
