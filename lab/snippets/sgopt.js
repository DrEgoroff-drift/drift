/* whether surfG (27f2) runs optimized, and how many points it made: 30 s of the hall's background prep in the system,
   sgArr wrapped to count points (k=0 → 3n) and calls; then V8's own word on K.surfG and its neighbours. Needs
   probe --jsflags=--allow-natives-syntax (otherwise the %-calls are a syntax error and the snippet says so) */
new Promise(res=>{
  const o=globalThis.sgArr;if(typeof o!=="function")return res({err:"нет sgArr"});
  const R={calls:0,pts:0,cells:0};
  globalThis.sgArr=function(k,len){if(k===0){R.calls++;R.pts+=len/3;}return o.apply(this,arguments);};
  let st=null;
  try{st=new Function("f","return %GetOptimizationStatus(f)");}catch(e){st=null;}
  const bits=v=>{const n=[];[[16,"opt"],[32,"maglev"],[64,"turbofan"],[128,"interp"],[256,"marked"],[1<<15,"baseline"],[1<<18,"osr"]].forEach(([b,s])=>{if(v&b)n.push(s);});return v+" "+n.join("+");};
  const t0=performance.now();
  const iv=setInterval(()=>{const s=(performance.now()-t0)/1000,ph=Math.floor(s/8)%2;keys.right=!ph;keys.left=!!ph;
    if(s>=30){clearInterval(iv);keys.right=keys.left=false;globalThis.sgArr=o;
      const S=st?{surfG:bits(st(K.surfG)),surf:bits(st(K.surf)),vx3c:typeof vx3c==="function"?bits(st(vx3c)):"-"}:"нет natives";
      res({mode:G.mode,calls:R.calls,ptsK:+(R.pts/1e3).toFixed(1),status:S});}},100);
})
