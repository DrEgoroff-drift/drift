/* ══════════════ свет без рывков (Зрение 2.0, закон «свет») ══════════════ */
/* Автор, 15.10: «рывками свет, когда на планете солнце двигается». plnHour (21pz) ставил светило
   ступенькой в пятую долю градуса — «тени не ползут каждый кадр»: при сутках 6–9 минут это 4–5
   скачков в секунду, и на низком солнце длинные тени прыгают. Глазом на стенде не видно (кадр
   один), числом — сразу. Закон: сутки планеты кадр за кадром (G.t идёт 60 в секунду) — направление
   света и весь «look» (небо, ключ, зарево, воздух) меняются ровно: шаг кадра не больше пятикратного
   обычного и не больше порога, заметного глазу. Ночь с переходом ключа на луну — тоже без скачка. */
function lightWalk(p,wl,t0,n,step){
  const ang=(a,b)=>Math.acos(clamp(a[0]*b[0]+a[1]*b[1]+a[2]*b[2],-1,1))/PLN_DEG,R=[];
  let prev=null;
  for(let i=0;i<n;i++){
    G.t=t0+i*step;
    const H=plnHour(p,wl),L=H.look,v=[];
    for(const k in L){const x=L[k];if(Array.isArray(x)||x instanceof Float32Array)for(let j=0;j<x.length&&j<4;j++)v.push(+x[j]||0);}
    const cur={dir:H.dir.slice(),v,ph:H.ph};
    if(prev){let dv=0,who=0;for(let j=0;j<v.length&&j<prev.v.length;j++){const d=Math.abs(v[j]-prev.v[j])/(1+Math.abs(prev.v[j]));if(d>dv){dv=d;who=j;}}
      R.push({t:G.t,da:ang(prev.dir,cur.dir),dv,who,ph:H.ph});}
    prev=cur;
  }
  return R;
}
TEST_SUITES.push(()=>suite("свет: солнце и небо идут без рывков",{tier:"node"},()=>{
  resetWorld();
  const p=landOnTestPlanet(),L=plnLandMake(G.surf.tr,p,G.sx),t0=G.t;
  const day=CEL_DAY*(6+((p.seed>>>7)&3));
  /* сутки по кадру — дорого; берём восемь окон по 600 кадров (10 с), они накрывают рассвет, день, закат и ночь */
  let R=[];
  for(let w=0;w<8;w++)R=R.concat(lightWalk(p,L.wl,t0+Math.round(day*w/8),600,1));
  G.t=t0;
  const med=A=>{const s=A.filter(x=>x>0).sort((a,b)=>a-b);return s.length?s[s.length>>1]:0;};
  const ma=med(R.map(r=>r.da)),mv=med(R.map(r=>r.dv));
  /* шаг света: ступенька видна, когда кадр сдвигает свет больше 0.05° сразу, а соседние стоят */
  const jumpA=R.filter(r=>r.da>.05&&r.da>5*ma);
  const jumpV=R.filter(r=>r.dv>.02&&r.dv>5*mv);
  const still=R.filter(r=>r.da===0).length;
  ok(R.length>4000,"кадров пройдено: "+R.length);
  ok(!jumpA.length,"свет прыгает: "+jumpA.length+" скачков направления из "+R.length+" кадров (обычный шаг "+ma.toFixed(4)+"°, скачок до "+
    Math.max(0,...jumpA.map(r=>r.da)).toFixed(3)+"°, кадров без движения "+still+") — тени дёргаются");
  ok(!jumpV.length,"небо/ключ прыгают: "+jumpV.length+" скачков цвета из "+R.length+" (обычный "+mv.toFixed(5)+
    ", худший "+Math.max(0,...jumpV.map(r=>r.dv)).toFixed(3)+" на фазе "+(jumpV[0]?jumpV[0].ph.toFixed(3):"-")+")");
  resetWorld();
}));
