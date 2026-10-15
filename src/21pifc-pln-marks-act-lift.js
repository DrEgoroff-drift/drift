/* ══════════════ космический лифт (§4.3, M627b проход 5) ══════════════
   У линии — станция: пульт зовёт клеть сверху (12 с по тросу, 4 с по рельсу), в клети поднимаются.
   Поездка: человек в клети и не рисуется, объектив идёт за клетью вверх, земля уходит вниз; у
   верхнего хомута клеть стоит 6 с — осмотр с высоты (+24 данных, строка «что где»), один раз. Кости:
   с шансом .25+.5·опасность клеть встаёт на трети высоты и гаснет — ручной спуск (удержание, скафандр
   −10) или прыжок ранцем (▲, ранец не меньше .6; человек выпадает из клети, дальше — физика игры);
   так или иначе осмотра нет, половина данных, клеть стоит до завтра. Клеть, отправленная наверх
   пустой, зажигает маяки хомутов — с тех пор башня горит и днём.
   Поездка — производная памяти (n.last и возраст), а не отдельное состояние: S.ride ставит tick
   каждый кадр, пока человек в клети; его читают объектив (21pz), рисунок человека (21ph) и обёртка
   шага поверхности ниже (стоять у станции, ▲ — прыжок из вставшей клети). */
const PLN_LIFT={rail:4,up:12,top:6,down:12,call:12,manual:20,stall:1/3,cam:1,thr:false};
const plnLiftRide=()=>PLN_LIFT.rail*2+PLN_LIFT.up+PLN_LIFT.top+PLN_LIFT.down;
/* где клеть по памяти: top — наверху, moving — идёт вниз на зов, down — у станции, ride — с человеком,
   stall — встала с человеком, stuck — висит пустая до завтра, up — уходит наверх пустой */
function plnLiftWhere(m,age){
  const L=PLN_LIFT,n=m.n||{},last=n.last,a=age;
  if(last==="ride"){
    if(n.stl)return a<L.rail+L.up*L.stall?"ride":"stall";
    return a<plnLiftRide()?"ride":"down";}
  if(last==="manual")return a<L.manual+L.rail?"ride":"down";
  if(last==="jump")return n.stall===celDay()?"stuck":"down";
  if(last==="call")return a<L.call+L.rail?"moving":"down";
  if(last==="empty")return a<L.rail+L.up?"up":"top";
  return (m.st|0)===0?"top":"down";
}
/* поза клети: u — доля рельса от станции к подножию, f — доля высоты троса, lit — окно горит */
function plnLiftPose(m,age){
  const L=PLN_LIFT,E=plnActEase,n=m.n||{},w=plnLiftWhere(m,age),a=age,last=n.last;
  if(w==="top")return {u:1,f:1,lit:0,w};
  if(w==="stuck")return {u:1,f:L.stall,lit:0,w};
  if(w==="down")return {u:0,f:0,lit:last==="call"||last==="ride"?1:0,w};
  if(w==="moving")return a<L.call?{u:1,f:1-E(a/L.call),lit:0,w}:{u:1-E((a-L.call)/L.rail),f:0,lit:0,w};
  if(w==="up")return a<L.rail?{u:E(a/L.rail),f:0,lit:0,w}:{u:1,f:E((a-L.rail)/L.up),lit:0,w};
  if(last==="manual")return a<L.manual?{u:1,f:L.stall*(1-a/L.manual),lit:0,w}:{u:1-E((a-L.manual)/L.rail),f:0,lit:0,w};
  /* поездка: рельс, трос вверх (вставшая — до трети и рывком стоп), верх, вниз, рельс */
  if(a<L.rail)return {u:E(a/L.rail),f:0,lit:1,w};
  const b=a-L.rail;
  if(n.stl)return {u:1,f:Math.min(L.stall,b/L.up),lit:w==="stall"?0:1,w};
  if(b<L.up)return {u:1,f:E(b/L.up),lit:1,w};
  if(b<L.up+L.top)return {u:1,f:1,lit:1,w};
  const c=b-L.up-L.top;
  if(c<L.down)return {u:1,f:1-E(c/L.down),lit:1,w};
  return {u:1-E((c-L.down)/L.rail),f:0,lit:1,w};
}
/* клеть в местных метрах тела: рельс от станции к подножию, у конуса — к тросу, вверх по тросу */
function plnLiftAt(q,D,P){
  const g=PLN_LIFT_GEO[(q&&q.seed|0)>>>0]||{c0:[0,1.85,-30],foot:[0,1.85,-D.Rb*1.25],top:D.top};
  const c0=g.c0,ft=g.foot;
  const x=lerp(c0[0],ft[0],P.u),z0=lerp(c0[2],ft[2],P.u),y0=lerp(c0[1],ft[1],P.u),y=lerp(y0,g.top,P.f);
  /* по тросу клеть идёт по передней грани: плита, скат конуса, потом сам трос; 1.3 — полглубины клети */
  const c1=D.hb+D.H*.14,rr=y<D.hb?D.Rb:y<c1?lerp(D.Rb*.7,D.Rb*.2,(y-D.hb)/(c1-D.hb)):D.H*.004;
  const k=Math.min(1,P.f*8);
  return {p:[lerp(x,0,k),y,lerp(z0,-(rr+1.3),k)],c0,lift:Math.max(0,y-ft[1])};
}
/* осмотр с высоты: пещера, залежи (по ресурсу ближняя), другие памятники — с расстоянием и стороной */
function plnLiftSurvey(q,S){
  const far=x=>{const d=x-q.x,mm=Math.abs(d)/PLN_M;
    return (mm<1000?Math.max(10,Math.round(mm/10)*10)+" м":(mm/1000).toFixed(1)+" км")+(d<0?" к западу":" к востоку");};
  const out=[];
  if(S&&S.cave&&isFinite(S.cave.x))out.push("пещера "+far(S.cave.x));
  const by={};
  for(const d of (S&&S.deposits)||[])if(d.left>0&&RES[d.res]&&(!by[d.res]||Math.abs(d.x-q.x)<Math.abs(by[d.res].x-q.x)))by[d.res]=d;
  Object.values(by).sort((a,b)=>Math.abs(a.x-q.x)-Math.abs(b.x-q.x)).slice(0,2)
    .forEach(d=>out.push(RES[d.res].ru.toLowerCase()+" "+far(d.x)));
  ((S&&S.tr&&S.tr.poi)||[]).filter(z=>z!==q&&z.seed!==q.seed).sort((a,b)=>Math.abs(a.x-q.x)-Math.abs(b.x-q.x)).slice(0,2)
    .forEach(z=>out.push(String(z.ru||(PLN_ACT.kinds[z.k]&&PLN_ACT.kinds[z.k].ru)||z.k).toLowerCase()+" "+far(z.x)));
  return out.length?out.join(" · "):"вокруг пусто до горизонта";
}
const plnLiftStation=4;
PLN_ACT.kinds.elevator={ru:"КОСМИЧЕСКИЙ ЛИФТ",
  dims:H=>({H,Rb:H*.06,hb:H*.035,top:H*.88}),
  got:m=>{const n=m.n||{},w=plnLiftWhere(m,plnActAge(m));
    const s=w==="stall"?"клеть встала":w==="stuck"||n.stall===celDay()?"клеть встала · до завтра":w==="ride"?"клеть идёт":
      w==="top"||w==="up"?"клеть наверху":w==="moving"?"клеть идёт вниз":(m.st|0)===2?"осмотр сделан":"клеть внизу";
    return s+(n.lit?" · маяки горят":"");},
  /* вставшая клеть: вторая строка — прыжок ранцем, первая — ручной спуск */
  line2:m=>plnLiftWhere(m,plnActAge(m))==="stall"?
    (typeof jetFuel==="function"&&jetFuel()>=.6?"ИЛИ ▲ — ПРЫГНУТЬ РАНЦЕМ":"РАНЕЦ НЕ ВЫТЯНЕТ · ТОЛЬКО ВРУЧНУЮ"):null,
  spots:[
    {id:"call",ru:"пульт",dx:()=>plnLiftStation+1.9,r:1.6,verb:"ВЫЗВАТЬ КЛЕТЬ",sfx:"creak",tool:false,
      when:m=>plnLiftWhere(m,plnActAge(m))==="top",
      act:c=>{c.m.st=1;return {short:"клеть пошла вниз"};}},
    {id:"empty",ru:"пульт",dx:()=>plnLiftStation+1.9,r:1.6,verb:"ОТПРАВИТЬ ПУСТОЙ",sfx:"creak",
      when:m=>plnLiftWhere(m,plnActAge(m))==="down"&&((m.st|0)===2||!!m.n.stall)&&!m.n.lit,
      act:c=>{c.m.st=0;c.m.n.lit=1;return {short:"клеть ушла наверх пустой · маяки хомутов загорелись"};}},
    {id:"ride",ru:"клеть",dx:()=>plnLiftStation-.4,r:1.6,sfx:"creak",
      when:m=>{const w=plnLiftWhere(m,plnActAge(m));return w==="down"||w==="moving";},
      verb:m=>plnLiftWhere(m,plnActAge(m))==="down"&&m.n.stall!==celDay()?"ПОДНЯТЬСЯ":null,
      note:m=>m.n.stall===celDay()?"клеть встала · до завтра":"клеть идёт вниз",
      act:c=>{const n=c.m.n;n.rides=(n.rides|0)+1;
        n.stl=plnActRoll(c.q.seed,0xE1E,n.rides)()<.25+.5*c.d?1:0;
        return {short:"клеть пошла вверх"};}},
    {id:"manual",ru:"клеть",dx:()=>plnLiftStation-.4,r:1.6,hold:4,tool:false,hum:"creak",sfx:"creak",
      when:m=>plnLiftWhere(m,plnActAge(m))==="stall",verb:"РУЧНОЙ СПУСК",
      act:c=>{const n=c.m.n;n.stall=celDay();n.stl=0;G.data+=12;
        if(G.surf)G.surf.suit=Math.max(0,(G.surf.suit||0)-10);
        return {short:"ручной спуск · скафандр −10 · +12 данных · клеть стоит до завтра"};}},
    {id:"jump",ru:"клеть",dx:()=>plnLiftStation-.4,r:1.6,sfx:"ui",
      when:m=>plnLiftWhere(m,plnActAge(m))==="stall",
      verb:()=>typeof jetFuel!=="function"||jetFuel()>=.6?"ПРЫГНУТЬ":null,
      note:"ранец не вытянет",
      act:c=>{const n=c.m.n,S=G.surf,D=c.D,P=plnLiftPose(c.m,plnActAge(c.m)),A=plnLiftAt(c.q,D,P);
        n.stall=celDay();n.stl=0;G.data+=12;
        /* человек выпадает из клети: высота клети над землёй у башни, дальше — ранец и падение игры */
        if(S&&S.tr){S.ride=null;S.x=c.q.x;S.y=groundAt(S.tr,S.x)-Math.max(2,A.lift)*PLN_M;S.vy=0;S.on=false;S.jetOn=true;S.walkTarget=null;}
        return {short:"прыжок из клети · +12 данных · клеть висит до завтра"};}}],
  /* человек в клети — S.ride; осмотр — у верхнего хомута, один раз; поездка кончилась — память */
  tick:(q,m,S,D)=>{
    const age=plnActAge(m),P=plnLiftPose(m,age),w=P.w,n=m.n;
    if(w==="ride"||w==="stall"){
      if(S){const A=plnLiftAt(q,D,P),R=S.ride&&S.ride.seed===q.seed?S.ride:(S.ride={seed:q.seed,q,al:0,cy:0});
        R.x=q.x+plnLiftStation*PLN_M-.4*PLN_M;R.lift=A.lift;R.stall=w==="stall";
        if(R.stall&&!R.al){R.al=1;sfx("alarm");say("клеть встала на трети высоты · свет погас");}}
      if(n.last==="ride"&&!n.stl&&!n.survey&&age>=PLN_LIFT.rail+PLN_LIFT.up){
        n.survey=1;G.data+=24;m.st=2;m.way="ride";m.got=PLN_ACT.kinds.elevator.got(m);
        tell("tech","Подъёмник: осмотр с высоты · +24 данных","Подъёмник: осмотр с высоты\n"+plnLiftSurvey(q,S)+"\n+24 данных");}
      else if(n.last==="ride"&&!n.stl&&(m.st|0)<2&&age>=PLN_LIFT.rail+PLN_LIFT.up){m.st=2;m.way="ride";}
    }else if(S&&S.ride&&S.ride.seed===q.seed)S.ride=null;
  },
  drive:(m,age,D,t,nk,q)=>{
    const P=plnLiftPose(m,age),A=plnLiftAt(q,D,P),n=m.n||{},Pp={};
    const off=[A.p[0]-A.c0[0],A.p[1]-A.c0[1],A.p[2]-A.c0[2]];
    /* вставшая клеть чуть качается на тросе */
    const sw=P.w==="stall"||P.w==="stuck"?.04*Math.sin(t*1.7):0;
    Pp.cab={x:off[0],y:off[1],z:off[2],roll:sw};
    Pp.cabL={x:off[0],y:off[1],z:off[2],roll:sw,k:P.lit?1:0,hide:!P.lit};
    /* маяки: по ночи — как были; зажжённые — всегда; вставшая клеть роняет их на мгновение */
    const al=P.w==="stall"&&n.last==="ride"&&age-(PLN_LIFT.rail+PLN_LIFT.up*PLN_LIFT.stall)<1.2?.2:1;
    const light=(n.lit?1.4:Math.max(nk,.08))*al;
    /* окно клети светит перед ней; вставшая — красный аварийный огонь мигает (видно и ночью) */
    const lamps=P.lit&&(P.f>0||P.u>0)?[{p:[A.p[0],A.p[1]+.3,A.p[2]-2],r:7,c:[1,.75,.45],k:1.4}]:
      P.w==="stall"||P.w==="stuck"?[{p:[A.p[0],A.p[1]+1.9,A.p[2]-1.4],r:6,c:[1,.22,.14],k:Math.sin(t*4.2)>0?1.6:.3}]:[];
    return {light,lampK:1,parts:Pp,lamps};
  }};

/* окно объектива в клети: верх окна поднят на долю высоты клети над землёй; плавно — и туда, и обратно.
   null — окно своё (обычное); зовёт plnSurface (21pz) */
function plnLiftWin(S){
  const R=S&&S.ride,goal=R?Math.max(0,R.lift||0)*PLN_M*PLN_LIFT.cam:0;
  S.liftCy=lerp(S.liftCy||0,goal,PLN_ACT.pinAge!=null?1:.08);   /* стенд держит возраст — окно сразу на месте */
  if(!R&&S.liftCy<.5){S.liftCy=0;return null;}
  const dy=S.liftCy;
  return (ws,hs,f)=>({vy:S.cam.y+10-hs*(1-f)+camOffset(S).y-dy});
}

/* шаг поверхности в клети: ходьба и ранец молчат, человек стоит у станции; ▲ в вставшей клети — прыжок */
const PLN_LIFT_OLD_UPD=updateSurface;
updateSurface=function(dt){
  const S=G.surf,R=S&&S.ride;
  if(!R||!plnActOn())return PLN_LIFT_OLD_UPD(dt);
  const k=typeof keys!=="undefined"&&keys?keys:{},kl=k.left,kr=k.right,kt=k.thrust;
  k.left=k.right=k.thrust=false;
  let r;
  try{r=PLN_LIFT_OLD_UPD(dt);}finally{k.left=kl;k.right=kr;k.thrust=kt;}
  if(G.surf===S&&S.ride){
    S.x=R.x;S.walkTarget=null;S.walkAmp=0;
    if(R.stall&&kt&&!PLN_LIFT.thr)plnActDo(R.q,"jump");
  }
  PLN_LIFT.thr=!!kt;
  return r;
};
