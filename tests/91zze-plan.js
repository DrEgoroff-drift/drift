/* ══════════════ план: комбинат без наряда, изделие, которое принимает только база ══════════════ */
TEST_SUITES.push(()=>suite("план: комбинат не останавливается, изделие берётся и довозится до базы",()=>{
  resetWorld();
  const at=regionOfTheme("plan");ok(!!at,"область расставлена");
  const R=regionAt(at.rx*REGION_SPAN,at.ry*REGION_SPAN);
  eq(R.needle,"radio","прибор — приёмник");
  let hit=0;for(let i=0;i<40;i++){const r=rng(hashi(i,1,2));G.sx=0;G.sy=0;if(planEtherLine(r))hit++;}
  eq(hit,0,"дома накладных в эфире нет");
  G.sx=R.core.sx;G.sy=R.core.sy;G.sys=getSystem(G.sx,G.sy);G.mode="system";G.running=true;
  hit=0;for(let i=0;i<40;i++){const r=rng(hashi(i,1,2));if(planEtherLine(r))hit++;}
  ok(hit>10,"в ядре эфир набит накладными ("+hit+"/40)");
  const pc=planCorePlanet(G.sys);
  if(!pc){ok(true,"у ядра нет планеты под комбинат — проверяем только эфир");return;}
  ok(tinCanLive(pc),"комбинат стоит на планете ядра");
  const T=tinMake(pc);
  /* Часы настоящие: tinTick списывает смену по РЕАЛЬНОМУ времени с прошлого
     захода, а между tinMake и этой строкой на загруженной машине проходит
     секунда-другая — и «бесконечная» смена успевала сгореть ниже пятидесяти.
     Набор падал раз в несколько прогонов дома и уронил выкладку 0.361.0 на
     раннере. Ставим отсчёт на сейчас: проверяем правило, а не скорость машины. */
  eq(T.run,0,"наряда нет");T.last=Date.now();tinTick(T);ok(T.run>=50,"а смена идёт — комбинат не останавливается");
  T.bin=8;T.last=Date.now();
  const A=tinAskOf(T.seed);G.cargo[A.made]=0;
  const got=tinTakeOut(T);ok(got>0,"изделие взяли ("+got+")");eq(G.plan.took,got,"и это сосчитано");
  /* база принимает */
  G.sx=0;G.sy=0;G.sys=getSystem(0,0);
  const p0=G.sys.planets.find(p=>p.type!=="gas");
  G.bases[baseKey(0,0,p0.idx)]={sx:0,sy:0,idx:p0.idx,name:p0.name,type:p0.type,res:[],cells:[],pool:{},tMs:Date.now(),built:Date.now()};
  const B=baseAt(0,0,p0.idx);ok(!!B,"база есть");
  G.log=[];const n=planDeliver(B);eq(n,got,"изделие ушло в запас базы");
  eq(B.pool[A.made],got,"и лежит там");eq(G.plan.hauled,got,"двести лет — не зря");
  ok(G.log.some(e=>/не зря/.test(e.s)),"строка об этом");
  eq(planDeliver(B),0,"второй раз нечего");
  const s=snapshot();applySave(s);eq(G.plan.hauled,got,"счёт переживает сейв");
}));
