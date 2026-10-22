/* a steady scene for 20 s: frame p50/p95/max and frames over 33 ms. With probe --alloc the heap line gives the
   garbage of those 20 s (MB/s = MB / 20); run it without --alloc for the frame times — the sampler costs frames */
new Promise(res=>{const D=[],t0=performance.now();let last=t0;
  (function f(t){if(t>t0)D.push(t-last);last=t;if(t-t0<20000)requestAnimationFrame(f);
    else{const s=D.slice().sort((a,b)=>a-b),q=k=>+s[Math.min(s.length-1,Math.floor(s.length*k))].toFixed(1);
      res({mode:G.mode,n:D.length,p50:q(.5),p95:q(.95),max:+s[s.length-1].toFixed(1),over33:D.filter(x=>x>33.4).length});}})(t0);})
