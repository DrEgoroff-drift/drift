/* ══════════════ стройка земли по рядам (M630f) ══════════════ */
/* Сетка куска — генератор (21pfb, 21pw): стройка ведёт его по часам кадра и доводит в следующих.
   Ловит две беды: общий кэш куска портится, пока сетка стоит недостроенной, и стройка теряет начатый
   кусок (L.left не доходит до нуля, вершины не сходятся с постройкой разом). Цену кадра меряет
   стенд: docs/look/game, пробник perf_probe (FRAME_JS на настоящих часах) */
function bq630Same(a,b){
  if(a.nv!==b.nv||a.ni!==b.ni)return false;
  for(let k=0;k<a.nv*PLN_VS;k++)if(a.v[k]!==b.v[k])return false;
  for(let k=0;k<a.ni;k++)if(a.i[k]!==b.i[k])return false;
  return true;
}
TEST_SUITES.push(()=>suite("земля: стройка по рядам даёт ту же сетку и доходит до конца (M630f)",()=>{
  const L=wq634World("terran");
  ok(L.wet,"у земного мира есть вода — набор видит и её сетки");
  const pick=t=>L.jobs.find(J=>J.t===t);
  /* ── сетка по рядам, а между рядами — чужая сетка целиком: та же, что разом ── */
  const types=["rib","far","water"].concat(L.lake?["pond"]:[]);
  for(const t of types){
    const J=pick(t),other=L.jobs.find(K=>K!==J&&K.t===(t==="far"?"rib":"far"));
    const whole=plnDrain(plnLandGen(L,J));
    const g=plnLandGen(L,J);
    let r=g.next(),n=0;
    while(!r.done){if(n===1&&other)plnDrain(plnLandGen(L,other));r=g.next();n++;}
    ok(n>=2,t+": сетка уступает по рядам: "+n);
    ok(r.value.ni>0&&bq630Same(whole,r.value),t+": по рядам — та же сетка, что разом ("+whole.nv+" вершин)");
  }
  /* ── стройка по фальшивым часам: каждый вызов часов — четверть мс; куски начинаются в одном кадре
     и доводятся в следующих, и вся земля встаёт с теми же вершинами, что и разом ── */
  const L2=wq634World("terran"),w0=wallMs,g0=plnGeo,r0=PLN.rush,v0=PLN.stat.verts;
  let t=0,calls=0,carried=0;
  try{
    wallMs=()=>(t+=.25);
    plnGeo=m=>({n:m.ni,nv:m.nv,m});
    PLN.rush=false;PLN.stat.verts=0;
    for(;L2.left>0&&calls<20000;calls++){
      plnLandStep(L2,L2.cx0,{hw:12,D:30},null,3);
      if(L2.gj)carried++;
    }
  }finally{wallMs=w0;plnGeo=g0;PLN.rush=r0;}
  const nv=PLN.stat.verts;PLN.stat.verts=v0;
  eq(L2.left,0,"стройка доходит до конца");
  ok(L2.jobs.every(J=>J.done),"все куски построены");
  ok(carried>0,"куски переходят на следующий кадр недостроенными: "+carried+" из "+calls);
  let same=0,tot=0,nw=0;
  for(const J of L2.jobs){
    const m=plnDrain(plnLandGen(L2,J));nw+=m.nv;tot++;
    if(m.ni?(J.geo&&bq630Same(m,J.geo.m)):!J.geo)same++;
  }
  eq(same,tot,"каждый кусок — тот же, что разом");
  eq(nv,nw,"вершин столько же, сколько разом: "+nv);
}));
