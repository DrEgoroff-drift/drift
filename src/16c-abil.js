/* ══════════════ особая система корпуса (M484, DESIGN-shipyard) ══════════════
   Одно действие на класс корпуса, с перезарядкой. Места на пульте не
   занимает: это ДОЛГОЕ нажатие ДЕЙСТВИЯ (≥ .6 с), когда ДЕЙСТВИЕ ничего не
   предлагает; перезарядка рисуется ободом кнопки (PLAN «M484's place on the
   pad»). На клавиатуре — клавиша V.
     разведчик  ФОРСАЖ    — тяга ×1.6 на 3 с;
     курьер     СБРОС     — клетка трюма за борт приманкой: ближние пираты
                            теряют вас на 4 с;
     рудовоз    БАЛЛАСТ   — поворот ×1.5 на 4 с ценой 1 % груза;
     буровик    РЕЗАК     — бур коротким лучом: ближайшему чужому в носу 30;
     фрегат     ЗАЛП      — все стволы разом, какая бы группа ни стояла;
     яхта       СИРЕНА    — позывной, на который отвечает каждый корабль;
     исследователь ПРОЖЕКТОР — показывает залежи системы на 10 с.
   Состояние — эфемерное (ABIL), в сейв не идёт. */
const ABIL={
  scout:  {ru:"ФОРСАЖ",   cd:20,dur:3},
  courier:{ru:"СБРОС",    cd:25,dur:4},
  hauler: {ru:"БАЛЛАСТ",  cd:18,dur:4},
  miner:  {ru:"РЕЗАК",    cd:12,dur:.4},
  warship:{ru:"ЗАЛП",     cd:8, dur:.3},
  yacht:  {ru:"СИРЕНА",   cd:30,dur:2},
  survey: {ru:"ПРОЖЕКТОР",cd:30,dur:10}
};
const ABIL_HOLD=600;
let ABIL_ST={k:null,on:0,cd:0,armed:false,fired:false,text:""};
function abilKind(){const S=shipData(G.shipId);return S?hullClassOf(G.shipId,S):"scout";}
function abilOf(){return ABIL[abilKind()]||ABIL.scout;}
function abilOn(k){return ABIL_ST.k===k&&G.t<ABIL_ST.on;}
/* доля перезарядки 0..1 — для обода кнопки */
function abilReady01(){
  const A=abilOf();if(G.t>=ABIL_ST.cd)return 1;
  return clamp(1-(ABIL_ST.cd-G.t)/(A.cd*60),0,1);
}
/* множители для stat(): вне действия — ровно 1 */
function abilMul(what){
  if(what==="thr"&&abilOn("scout"))return 1.6;
  if(what==="turn"&&abilOn("hauler"))return 1.5;
  return 1;
}
function abilFire(){
  abilStale();
  if(G.mode!=="system"||G.t<ABIL_ST.cd)return false;
  const k=abilKind(),A=ABIL[k]||ABIL.scout,sh=G.ship;
  let line="";
  if(k==="courier"){
    const K=RES_KEYS.filter(x=>(G.cargo[x]|0)>0&&!(RES[x].pax)&&x!=="folk").sort((a,b)=>G.cargo[b]-G.cargo[a]);
    if(!K.length){say("СБРОС · трюм пуст — нечем приманить",80);return false;}
    const n=Math.max(1,Math.min(G.cargo[K[0]],Math.round(stat().cargoMax/10)));
    G.cargo[K[0]]-=n;
    for(const p of G.pirates||[])if(Math.hypot(p.x-sh.x,p.y-sh.y)<700)p.jamT=Math.max(p.jamT||0,A.dur);
    line="СБРОС · "+RES[K[0]].ru.toLowerCase()+" ×"+n+" за борт — приманка";
    ABIL_ST.crate={x:sh.x-Math.cos(sh.a)*40,y:sh.y-Math.sin(sh.a)*40,a:sh.a};
  }else if(k==="hauler"){
    for(const x of RES_KEYS){if(RES[x].pax||x==="folk")continue;const c=G.cargo[x]|0;if(c>0)G.cargo[x]=c-Math.max(0,Math.round(c*.01));}
    line="БАЛЛАСТ · корма облегчена — разворот живее";
  }else if(k==="miner"){
    let best=null,bd=160;
    for(const p of G.pirates||[]){const d=Math.hypot(p.x-sh.x,p.y-sh.y);
      if(d<bd&&Math.abs(angDiff(Math.atan2(p.y-sh.y,p.x-sh.x),sh.a))<.5){bd=d;best=p;}}
    if(best){best.hull-=30;if(typeof sfx==="function")sfx("hit",{v:.4});}
    ABIL_ST.beam=best?{x:best.x,y:best.y}:{x:sh.x+Math.cos(sh.a)*160,y:sh.y+Math.sin(sh.a)*160};
    line="РЕЗАК"+(best?" · по корпусу":" · в пустоту");
  }else if(k==="warship"){
    const st=stat(),all=(st.guns&&st.guns.length)?st.guns:[{slot:0,g:st.gun,m:null}];
    const mk=(G.marks&&G.marks[0])||null,live=(mk&&mk.hull>0&&!mk.iff)?mk:null;
    if(!st.armed){say("ЗАЛП · стволов нет",80);return false;}
    for(const a of all){gunFireOnce(a.g,sh,live,live?Math.atan2(live.y-sh.y,live.x-sh.x):sh.a);G.energy=Math.max(0,G.energy-EN_SHOT*(a.g.en||1));}
    G.engaged=true;
    line="ЗАЛП · все стволы разом";
  }else if(k==="yacht"){
    const who=["«Слышим, борт. Красиво идёте.»","«Принято. Кто это такой нарядный?»","«Ответили. Музыку убавьте.»"];
    if(typeof etherLine==="function")for(let i=0;i<3;i++)etherLine(who[i],["лоцман","буксир","соседний борт"][i]);
    line="СИРЕНА · вам ответили все";
  }else if(k==="survey"){
    const L=(typeof farDeposits==="function")?farDeposits(G.sx,G.sy):[];
    const r=(typeof farReadLine==="function")?farReadLine(L):"";
    line="ПРОЖЕКТОР · "+(r||"дальнего нет — только обычная руда");
    logAdd("tech",line);
  }else line="ФОРСАЖ · тяга ×1.6";
  ABIL_ST.k=k;ABIL_ST.on=G.t+A.dur*60;ABIL_ST.cd=G.t+A.cd*60;ABIL_ST.text=line;
  say(line,Math.min(240,A.dur*60+60));
  return true;
}
/* ── время мира пошло заново (0.450.0) ──
   ABIL_ST держит метки `on` и `cd` в игровых часах G.t, но живёт на модуле и
   переживает новую игру и загрузку сейва: после сброса мира G.t=0, а метка
   осталась от прежней жизни — и особая система молча стоит на перезарядке
   двадцать секунд, которых игрок не тратил. Тест хэша (91zzzzzbb, сцена
   «система») нашёл это как расхождение двух прогонов: первый жал ФОРСАЖ,
   второй — уже нет. Часы мира вспять — значит мир новый: чистим метки. */
function abilStale(){
  if(G.t<(ABIL_ST.lastT||0)){
    ABIL_ST.k=null;ABIL_ST.on=0;ABIL_ST.cd=0;ABIL_ST.text="";
    ABIL_ST.crate=null;ABIL_ST.beam=null;ABIL_ST.armed=false;ABIL_ST.fired=false;
  }
  ABIL_ST.lastT=G.t;
}
/* долгое нажатие: зовёт петля системы после предложений ДЕЙСТВИЯ */
let ABIL_KEY=false;
function abilTick(){
  abilStale();
  if(keys.abil&&!ABIL_KEY)abilFire();ABIL_KEY=!!keys.abil;   /* клавиша V */
  abilPadRim();
  if(actEdge)ABIL_ST.armed=!(typeof cueLvl==="function"&&cueLvl()===CUE_ACT),ABIL_ST.fired=false;
  if(!keys.act){ABIL_ST.armed=false;return;}
  if(ABIL_ST.armed&&!ABIL_ST.fired&&typeof actPressT==="number"&&now()-actPressT>=ABIL_HOLD){
    ABIL_ST.fired=true;abilFire();
  }
}
/* обод кнопки ДЕЙСТВИЕ: перезарядка — дуга, готово — ровный круг */
let ABIL_BTN;
function abilPadRim(){
  /* кнопку ищем один раз: кадр не читает DOM (15d-domread) */
  if(ABIL_BTN===undefined)ABIL_BTN=(typeof document!=="undefined"&&document.querySelector)?document.querySelector('.pads button[data-k="act"]'):null;
  const b=ABIL_BTN;
  if(!b)return;
  const f=abilReady01(),deg=Math.round(f*360);
  /* D21: кольцо толще и с яркой головкой у конца дуги; готово — имя над кнопкой */
  const v=f>=1?"":"conic-gradient(rgba(242,178,92,.75) "+Math.max(0,deg-8)+"deg, #ffd9a0 "+deg+"deg, transparent 0)";
  const ok=f>=1&&G.mode==="system",vk=v+(ok?"|ok":"");
  if(b.dataset.rim!==vk){b.dataset.rim=vk;b.style.setProperty("--abil",v||"none");b.classList.toggle("abil-cd",f<1);
    b.classList.toggle("abil-ok",ok);if(ok)b.dataset.abil="Долгое · "+abilOf().ru.toLowerCase();}   /* режим входит в ключ: в вагоне подписи нет */
}
/* клин прожектора: радиальный градиент в секторе ±.35, вершина на корабле, ось — курс. Поле, а не
   выпечка: клин на экран шириной 1.2·max(W,H) печь MSAA ×4 вдвое крупнее DPR — на телефоне это
   великан пула и десятки МБ ради градиента (ревью 25.09 п. 5c). Кромка — пиксель устройства
   сглаживания по расстоянию до стороны клина; альфа .102 (.10 в 2D, проход сцены сводит на 2 % темнее) */
const ABIL_CONE=new Float32Array(4);
const ABIL_CONE_WGSL=`
fn field(p:vec2f,uv:vec2f)->vec4f{
  let d=p-fu.v[0].xy;let R=fu.v[0].w;let r=length(d);
  if(r>=R){return vec4f(0.);}
  let ax=vec2f(cos(fu.v[0].z),sin(fu.v[0].z));
  let x=dot(d,ax);let y=abs(d.x*ax.y-d.y*ax.x);
  let e=y*.93937271-x*.34289781;   /* расстояние до стороны клина (угол .35), позади вершины — вне */
  let m=clamp(.5-e*fu.res.x/fu.res.z,0.,1.);
  let al=.102*(1.-r/R)*m;
  return vec4f(vec3f(200.,230.,255.)/255.*al,al);
}`;
function drawAbil(zx,zy){
  /* D21: у каждой системы своё видимое (ФОРСАЖ — факел в trailStep).
     На видеокарте (25.09): фигуры прохода сцены и выпечка клина, 2D-пути нет */
  const pass=gpuScene();if(!pass)return;
  if(abilOn("yacht")){   /* СИРЕНА: два расходящихся кольца (штрих 2 px, сложение) */
    const x=zx(G.ship.x),y=zy(G.ship.y),u=1-(ABIL_ST.on-G.t)/(ABIL.yacht.dur*60),R=[];
    for(const k of [0,.5]){const uu=(u+k)%1;R.push([3,x,y,20+uu*260,0,1,0,255,190,110,.6*(1-uu)]);}
    gpuShapes(pass,R,{blend:"add"});
  }
  if(abilOn("courier")&&ABIL_ST.crate){   /* СБРОС: ящик остаётся там, где выброшен */
    const x=zx(ABIL_ST.crate.x),y=zy(ABIL_ST.crate.y),s=shipZ(G.zoom),an=ABIL_ST.crate.a+G.t*.01,c=Math.cos(an),n=Math.sin(an);
    /* прямоугольник в осях ящика: центр (ox,oy), полуразмеры (hx,hy) — в масштабе s */
    const q=(ox,oy,hx,hy,C)=>[4,x+(ox*c-oy*n)*s,y+(ox*n+oy*c)*s,hx*s,hy*s,an,0,C[0],C[1],C[2],C[3]];
    const O=[0,0,0,.5],X=[255,214,150,.7];
    gpuShapes(pass,[q(0,0,6,5,[106,90,60,1]),
      /* обвод 1 px по кромке — четыре полосы без нахлёста (у штриха пути углы не двоятся) */
      q(0,-5,6.5,.5,O),q(0,5,6.5,.5,O),q(-6,0,.5,4.5,O),q(6,0,.5,4.5,O),
      /* крест: вертикаль в два куска — в центре не двоится, как у одного пути */
      q(0,0,6,.5,X),q(0,-2.75,.5,2.25,X),q(0,2.75,.5,2.25,X)]);
  }
  if(ABIL_ST.k==="miner"&&abilOn("miner")&&ABIL_ST.beam){   /* луч резака: 3 px, срез прямой, сложение */
    const x0=zx(G.ship.x),y0=zy(G.ship.y),x1=zx(ABIL_ST.beam.x),y1=zy(ABIL_ST.beam.y);
    gpuShapes(pass,[[4,(x0+x1)/2,(y0+y1)/2,Math.hypot(x1-x0,y1-y0)/2,1.5,Math.atan2(y1-y0,x1-x0),0,255,190,110,.85]],{blend:"add"});
  }
  if(abilOn("survey")){   /* прожектор: клин полем, вершина — на корабле */
    const U=ABIL_CONE;U[0]=zx(G.ship.x);U[1]=zy(G.ship.y);U[2]=G.ship.a;U[3]=Math.max(W,H)*.6;
    gpuField(pass,"abil.cone",ABIL_CONE_WGSL,U);
  }
}
