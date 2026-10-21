/* Кадр 100 мс (10 кадров/с) — мир проходит 100 мс, а не 50; остаток переносится, а не обнуляется. */
TEST_SUITES.push(()=>suite("кванты мира: остаток не теряется",()=>{
  const r=quantSplit(100);
  ok(r.steps*QUANT_MS>=95,"кадр 100 мс: мир прошёл ≥ 95 мс, было "+(r.steps*QUANT_MS).toFixed(1));
  let t=0,real=0,acc=0;
  for(let i=0;i<50;i++){acc+=100;real+=100;const q=quantSplit(acc);acc=q.acc;t+=q.steps*QUANT_MS;}
  ok(t/real>.95,"10 кадров/с: мир идёт в реальном времени (доля "+(t/real).toFixed(2)+")");
  const big=quantSplit(250);
  ok(big.steps===QUANT_MAX&&big.acc<=QUANT_MS*QUANT_MAX+1e-9,"провал в 250 мс: шаг ограничен, накопление с потолком");
  const norm=quantSplit(1000/60);
  ok(norm.steps===24,"60 Гц: 24 кванта, было "+norm.steps);
}));

/* Полка на живом экране (15.10, автор: «на 144 Гц шаг 14 и 21 мс — поправь; учти динамическую развёртку»).
   rAF с дрожанием ±0.15 мс на 60…240 Гц и смена развёртки на ходу (VRR, телефон 120 → 60, другой монитор):
   после короткой притирки кадры идут ровно (каждый n-й такт), их не меньше шестидесяти, и каждый кадр
   несёт одно и то же время мира — иначе ровные кадры с неровным движением. */
TEST_SUITES.push(()=>suite("полка: ровный шаг под любую развёртку",()=>{
  const save={capIv,capRingN,capDue,capPrev},ring=CAP_RING.slice();
  try{
    capIv=16.667;capRingN=0;capDue=0;capPrev=0;
    let tb=1000,t=0,last=0,acc=0,prev=0,seed=7;
    const jit=()=>{seed=(seed*1103515245+12345)>>>0;return(seed/4294967296-.5)*.3;};
    const run=(hz,n)=>{
      const D=[];
      for(let i=0;i<n;i++){
        tb+=1000/hz;t=tb+jit();   /* метка дрожит вокруг ровной сетки развёртки, а не блуждает */
        if(capPrev){const d=t-capPrev;if(d>1&&d<250)capSample(d);}
        capPrev=t;
        if(!capGate(t,0))continue;
        if(last){acc+=t-last;const q=quantSplit(acc,prev);acc=q.acc;prev=q.steps;D.push({t,iv:t-last,steps:q.steps});}
        last=t;
      }
      return D.slice(Math.floor(D.length*.4));   /* притирка: медиана набирается за 12–24 такта */
    };
    const want={60:60,90:90,120:60,144:72,165:82.5,240:60};
    for(const hz of [60,144,60,120,165,240,90,144]){
      const D=run(hz,hz*2),iv=D.map(d=>d.iv),fps=1000*D.length/(D[D.length-1].t-D[0].t+iv[0]);
      const mn=Math.min(...iv),mx=Math.max(...iv);
      const st={};for(const d of D)st[d.steps]=(st[d.steps]|0)+1;
      const top=Math.max(...Object.values(st));
      ok(Math.abs(fps-want[hz])<want[hz]*.03,hz+" Гц: кадров "+fps.toFixed(1)+" в секунду, ждём "+want[hz]);
      ok(mx-mn<1,hz+" Гц: шаг кадра ровный, "+mn.toFixed(2)+"…"+mx.toFixed(2)+" мс");
      ok(top>=.9*D.length||hz===165,hz+" Гц: время мира на кадр одно — кванты "+JSON.stringify(st));
      ok(Object.keys(st).length<=2,hz+" Гц: разброс квантов не больше одного — "+JSON.stringify(st));
    }
  }finally{capIv=save.capIv;capRingN=save.capRingN;capDue=save.capDue;capPrev=save.capPrev;CAP_RING.set(ring);}
}));
