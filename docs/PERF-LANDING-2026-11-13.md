# Landing preparation, 0.499.111

The delay was CPU construction, not a network download. A sampling profile of
the original construction path attributed 1,546 ms to `plnNoise`: repeated
trigonometry at identical lattice nodes dominated the recording. A bounded
gradient cache keeps the original double values. The regression compares
100,000 samples, including eviction and negative coordinates, bit for bit.
Unused colour-noise samples are no longer evaluated.

Other avoidable work: the background lens divided world coordinates by
`PLN_M` twice; moons and the explicit autopilot target were ignored; changing
approach longitude repeatedly discarded construction; the queue stopped after
two chunks even when its time allowance remained. These paths now share the
same target, coordinates, terrain and completed mesh at handover. The chosen
autopilot site is retained through orbital capture; moving around the orbit
past the existing angular tolerance permits another site. No mesh density,
shader, shadow, material, vegetation or quality setting was reduced.

Real GPU / wall-clock measurements on the local NVIDIA Blackwell machine:

- Original cold moon entry after four seconds in the system: 3,966 ms to first
  3D descent frame; synchronous `startLanding`: 1.1 ms.
- Gradient cache and queue repairs, same cold-entry probe: 1,149 ms, including
  458 ms spent in the construction steps.
- Final ordinary autopilot approach from 600 units outside the moon: 5,052 ms
  of flight, scene already ready at orbit capture, 23 ms from landing command
  to the first 3D descent frame; no foreground construction steps.
- Limitation: a deliberately short approach immediately after startup with
  CDP CPU throttling at 6x still waits roughly 6–8 seconds. This is not a
  guarantee of instantaneous cold construction on weak hardware. The previous
  timeout that falsely declared incomplete geometry ready has been removed.

Reproduce with `python docs/probe-landing.py --approach`, or omit `--approach`
for cold entry; `--slow 6` enables CPU throttling. Do not run other browser
tests during measurements. These are transition latencies, not FPS verdicts.

Validation: full browser corpus 3,984 assertions; geometry vision, 17 windows,
zero defects. The test harness now clears planet preparation and lazy seam
state between worlds and lets the descent finish preparation before judging
its controls. Generated assets contain no additional binary artwork.
