/* probe --pin N, injected before the page's own scripts: the page lives on a virtual clock so two builds reach the
   snippet from the same state. performance.now and Date.now read a clock that moves only with frames; rAF runs
   exactly N frames of 16.667 ms, then holds its callbacks; setInterval, setTimeout of 16 ms and more, and
   requestIdleCallback fire by that clock inside the frame tick, never by the real one (shorter timeouts stay real —
   the boot chains on them); Math.random is seeded. Wall budgets see no time pass, so clock-paced work finishes
   whole — that is the price, both builds pay it the same */
(()=>{
  const MAX=__PIN_MAX__,RAF=window.requestAnimationFrame.bind(window),ST=window.setTimeout.bind(window),
    CT=window.clearTimeout.bind(window);let vt=1e4,id=0,tid=1e6,seed=7;
  performance.now=()=>vt;const D0=1.7e12;Date.now=()=>D0+vt;
  Math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const Q=new Map(),T=new Map(),I=[];let armed=false;
  const arm=()=>{if(!armed){armed=true;RAF(tick);}};
  const tick=()=>{armed=false;if(window.__PIN.n>=MAX)return;
    const C=[...Q.values()];Q.clear();vt+=16.667;window.__PIN.n++;
    for(const f of C)try{f(vt);}catch(e){ST(()=>{throw e;});}
    /* timers due by now, in due order (ties by id) */
    for(;;){let k=null,b=null;for(const [i,t] of T)if(t.due<=vt&&(!b||t.due<b.due||t.due===b.due&&i<k)){k=i;b=t;}
      if(!b)break;if(b.every)b.due+=b.every;else T.delete(k);try{b.f(...b.a);}catch(e){ST(()=>{throw e;});}}
    for(const f of I.splice(0))try{f({didTimeout:false,timeRemaining:()=>8});}catch(e){ST(()=>{throw e;});}
    if(Q.size||T.size||I.length)arm();};
  window.__PIN={n:0,max:MAX};
  window.requestAnimationFrame=cb=>{Q.set(++id,cb);arm();return id;};
  window.cancelAnimationFrame=i=>{Q.delete(i);};
  window.setTimeout=(f,ms,...a)=>{if(typeof f!=="function"||!(ms>=16))return ST(f,ms,...a);const i=++tid;T.set(i,{f,a,due:vt+ms});arm();return i;};
  window.setInterval=(f,ms,...a)=>{const i=++tid;T.set(i,{f,a,due:vt+Math.max(16,ms|0),every:Math.max(16,ms|0)});arm();return i;};
  window.clearTimeout=window.clearInterval=i=>{if(T.has(i))T.delete(i);else CT(i);};
  window.requestIdleCallback=f=>{I.push(f);arm();return ++tid;};window.cancelIdleCallback=()=>{};
})();
