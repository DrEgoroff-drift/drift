/* Залежь не ложится под стену посёлка, его место и точку осмотра (0.493.5): иначе
   цепочка подсказок грунта берёт их ветку раньше залежи, и залежь не бурится никогда,
   а стена без подписи вдобавок молчит (проба · экономика, M903). */
TEST_SUITES.push(()=>suite("грунт: залежь отодвинута от стены и ориентира, стена не молчит",()=>{
  resetWorld();
  G.opts.autoDock=false;
  const P=(G.sys.planets||[]).find(q=>q.parentIdx==null&&q.type!=="gas"&&((q.res&&q.res.length)||(PROFILE[q.type]||[]).length));
  ok(!!P,"в стартовой системе есть планета с залежами");
  let r=T.bot("planet",P);ok(r.ok,"к планете: "+r.why);
  r=T.bot("land");
  for(let k=0;k<3&&!r.ok&&G.mode==="system";k++){
    const sh=G.ship;G.ap=null;G.orbit=null;
    for(let i=0;i<240;i++){
      const dx=P.x-sh.x,dy=P.y-sh.y,d=Math.hypot(dx,dy)-(P.radius||0);
      if(d<60)break;
      sh.vx=(P.vx||0)+dx/Math.hypot(dx,dy)*Math.min(2.5,d/30);sh.vy=(P.vy||0)+dy/Math.hypot(dx,dy)*Math.min(2.5,d/30);
      stepWorld(1);G.t+=1;
    }
    sh.vx=P.vx||0;sh.vy=P.vy||0;
    r=T.bot("land");
  }
  ok(G.mode==="surface","сели: "+(r.ok?"да":r.why));
  const S=G.surf;
  /* ни одна залежь после посадки не стоит в радиусе стены, места посёлка или POI */
  const B=depRoomBlockers(S);
  const bad=(S.deposits||[]).filter(d=>B.some(b=>Math.abs(d.x-b.x)<b.r-1e-9));
  ok(bad.length===0,"залежей под стеной/посёлком/ориентиром: "+bad.length+" (глушителей "+B.length+")");
  /* синтетика: ориентир кладётся прямо на залежь — depRoom сдвигает её за радиус */
  const d0=(S.deposits||[])[0];ok(!!d0,"есть залежь для пробы");
  S.tr.poi=S.tr.poi||[];const q={k:"t",ru:"ПРОБА",x:d0.x,y:0,h:100,sc:1,seed:1};S.tr.poi.push(q);
  const n=depRoom(S);
  ok(n>=1&&Math.abs(d0.x-q.x)>=36+DEP_ROOM_PAD,"залежь ушла от ориентира: сдвинуто "+n+", зазор "+Math.abs(d0.x-q.x).toFixed(0));
  S.tr.poi.pop();
  /* молчащая цепочка: кадр у «стены» без подписи получает строку, а не прошлую подсказку */
  S._wallX=S.x;G.prompt="ДЕЙСТВИЕ — ЗАЛОЖИТЬ ШАХТУ · ВГЛУБЬ ПОРОДА БОГАЧЕ";
  const saveCan=wallCanSign;
  try{
    wallCanSign=()=>false;
    updateSurface(1);
    const canLive=settleCanLive(S.p);   /* без посёлка ветки стены нет — тогда достаточно, что строка есть */
    ok(G.prompt!==""&&(!canLive||!/ЗАЛОЖИТЬ ШАХТУ/.test(String(G.prompt))),"у стены подсказка своя, не прошлая (посёлок "+(canLive?"есть":"нет")+"): «"+String(G.prompt).split("\n")[0]+"»");
  }finally{wallCanSign=saveCan;S._wallX=undefined;}
}));
