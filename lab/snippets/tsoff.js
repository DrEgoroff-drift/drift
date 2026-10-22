/* does the GPU timestamp probe itself stall a frame? (jank's stop of 400–600 ms "no JS, no GPU" sat at 9.3–9.6 s
   in every scene: g11GpuMs, which jank starts at 2 s for 7 s, turns timestamps off at 9.0 s). Frames over 50 ms
   over 8 s with timestamps on at 1 s and off at 4 s, then a second round on at 5 s and off at 7 s */
new Promise(res=>{const F=[],t0=performance.now();let last=t0,ev=[];
(function f(t){if(t-last>50)F.push([Math.round(last-t0),Math.round(t-last)]);last=t;if(t-t0<8000)requestAnimationFrame(f);
  else res({mode:G.mode,tsOk:!!GPU.tsOk,events:ev,long:F});})(t0);
const on=s=>setTimeout(()=>{GPU.tsAcc={};GPU.tsOn=true;ev.push("on "+s);},s*1000),off=s=>setTimeout(()=>{GPU.tsOn=false;ev.push("off "+s);},s*1000);
on(1);off(4);on(5);off(7);
if(typeof keys!=="undefined")keys.right=true;setTimeout(()=>{if(typeof keys!=="undefined")keys.right=false;},7900);})
