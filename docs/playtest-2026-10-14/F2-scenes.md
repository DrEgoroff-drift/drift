# F2 - submit/s and long frames by scene (tests.html, T.go; lead's own CDP script, real clock, 3 s per scene)

Method: headless Chrome 153 for Testing on the real GPU (`--enable-unsafe-webgpu`), `GPUQueue.submit` wrapped and counted by call stack, rAF deltas; scene put directly by `T.go`, loop restarted (`LOOP_OFF=false`, `requestAnimationFrame(frame)`). Headless rAF runs at ~240 Hz, so read the per-frame column, not the per-second one: at a 60 Hz display multiply per-frame by 60. Long = rAF delta over 16 ms. The 60 shelf of `frame()` did not hold under tests.html (frames were drawn at the rAF rate), so absolute per-second numbers are inflated about 4x against F-speed.md (system there: 3 per frame, 180/s); compare scenes by the per-frame column only. Script: scratchpad `qa-scenes.mjs`. PLN.rush and stand shortcuts of `T.go` make landing/surface frames heavier than in play; judge those by cost.py (F-speed.md: GPU 1.57 ms, CPU 0.58 ms).

| scene | mode | rAF/s | submit/s | submit per frame | long >16 ms | max ms | top stacks |
|---|---|---|---|---|---|---|---|
| система | system | 240 | 1003.0 | 4.18 | 0 of 720 | 4.3 | h3dRun<h3dDraw<hullGpuDraw 523/s ; h3dRun<bodyRun<bodyStation 240/s |
| карта | map | 240 | 239.7 | 1.00 | 0 of 719 | 8.4 | gpuPresent<frameBody<frame 240/s |
| заход | landing | 121 | 121.3 | 1.00 | 46 of 364 | 20.9 | gpuPresent<frameBody<frame 121/s |
| грунт день | surface | 117 | 117.0 | 1.00 | 46 of 351 | 37.4 | gpuPresent<frameBody<frame 117/s |
| грунт ночь | surface | 119 | 119.0 | 1.00 | 43 of 357 | 41.7 | gpuPresent<frameBody<frame 119/s |
| шахта | dig | 241 | 481.3 | 2.00 | 0 of 722 | 4.3 | gpuOver<drawDigLight<drawDigWorld 241/s ; gpuPresent<frameBody<frame 241/s |
| пещера | cave | 240 | 240.0 | 1.00 | 0 of 720 | 4.3 | gpuPresent<frameBody<frame 240/s |
| пояс | belt | 241 | 241.0 | 1.00 | 0 of 723 | 4.3 | gpuPresent<frameBody<frame 241/s |
| сорока | wanderer | 240 | 240.3 | 1.00 | 0 of 721 | 4.3 | gpuPresent<frameBody<frame 240/s |
| рейд | raid | 240 | 240.3 | 1.00 | 0 of 721 | 4.3 | gpuPresent<frameBody<frame 240/s |
| база | base | 241 | 1203.3 | 5.00 | 0 of 722 | 4.3 | gpuOver<gpuNext<rigCardFlush 241/s ; gpuOver<baseGpuOver<drawBase 241/s |
| дом | homein | 240 | 960.0 | 4.00 | 0 of 720 | 4.3 | drawHomeIn<drawWorldIn<drawWorld 480/s ; gpuOver<drawHomeIn<drawWorldIn 240/s |
| система +give  rich    board  near | dock | 241 | 734.3 | 3.05 | 0 of 722 | 4.3 | h3dRun<bodyRun<bodyStation 241/s ; h3dRun<h3dDraw<hullGpuDraw 241/s |
| система +give  rich    board  near    tap  КАНТИНА | dock | 240 | 735.3 | 3.06 | 0 of 721 | 4.3 | h3dRun<bodyRun<bodyStation 240/s ; h3dRun<h3dDraw<hullGpuDraw 240/s |
| система +give  rich    board  near    tap  ВЕРФЬ | dock | 241 | 736.7 | 3.06 | 0 of 722 | 4.3 | h3dRun<bodyRun<bodyStation 241/s ; h3dRun<h3dDraw<hullGpuDraw 241/s |

Reading: map, cave, belt, wanderer, raid, landing, surface cost 1 submit per frame; mine 2; dock/cantina/yard 3; system 4.2; home-in 4; **base 5** (the heaviest by count, ~300/s at 60 Hz). No before/after: nothing was changed in speed code. Long frames only in landing/surface (13 % of frames, max 42 ms) - stand rush, see note above; not seen in the other scenes.

## After the base fix (50fd1046)

| scene | submit/s before | after | long >16 ms |
|---|---|---|---|
| база (base) | 1203 (5/frame) | 720 (3/frame) | 0 -> 1 of 720 (16.7 ms, a single frame) |
| дом (homein) | 960 (4/frame) | 962 (unchanged) | 0 |
| зимовка (winter) | 241 (1/frame) | - | 0 |
| санаторий (spa) | 240 (1/frame) | - | 0 |
| черпак (scoop) | 662 | - | 2 of 631 (max 312 ms: the first gas-giant bake) |
