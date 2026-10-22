/* every new Float32Array over 60 s of the hall's background prep in the system, by the line that made it: count and
   MB. Float32Array is swapped for a counting Proxy (code says `new Float32Array(...)`, a global lookup, so all of
   src/ goes through it); the caller is the first stack frame outside this snippet. Catches the body buffer's
   doubling in r3Build's vx3c (27f2 «VN+12>V.length»), sgArr's slots and anything else. Large typed arrays keep
   their bytes off the V8 heap — the sampling heap profiler does not see these, this does */
new Promise(res=>{
  const F=globalThis.Float32Array,R=new Map(),S=60;let n=0,b=0;
  const lim=Error.stackTraceLimit;Error.stackTraceLimit=4;
  globalThis.Float32Array=new Proxy(F,{construct(t,args,nt){
    const a=Reflect.construct(t,args,nt===globalThis.Float32Array?t:nt);
    const st=(new Error().stack||"").split("\n")[2]||"?";
    const m=st.match(/at (\S+).*?:(\d+):\d+\)?$/),k=m?m[1]+" @"+m[2]:st.trim().slice(0,80);
    const e=R.get(k)||{n:0,b:0,max:0};e.n++;e.b+=a.byteLength;e.max=Math.max(e.max,a.byteLength);R.set(k,e);n++;b+=a.byteLength;
    return a;}});
  const t0=performance.now();
  const iv=setInterval(()=>{const s=(performance.now()-t0)/1000,ph=Math.floor(s/8)%2;keys.right=!ph;keys.left=!!ph;
    if(s>=S){clearInterval(iv);keys.right=keys.left=false;globalThis.Float32Array=F;Error.stackTraceLimit=lim;
      const top=[...R.entries()].sort((x,y)=>y[1].b-x[1].b).slice(0,12).map(([k,e])=>k+" · "+e.n+" шт · "+(e.b/1048576).toFixed(1)+" МБ · max "+(e.max/1048576).toFixed(2)+" МБ");
      res({mode:G.mode,n,MB:+(b/1048576).toFixed(1),top});}},100);
})
