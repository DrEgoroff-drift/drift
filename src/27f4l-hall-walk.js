/* ══════════════ M816 станция пешком (docs/DESIGN-station-walk.md) ══════════════
   Стыковка ставит пилота у шлюза длинного зала, снятого сбоку во весь экран: ближняя стена срезана, как у дома.
   Игрок ведёт его влево-вправо (A/D, ← →, тап по полу) мимо мест станции на одной линии: шлюз, стойка, доска,
   окно на верфь, верстак, контора, бар. У места его вещь названа табличкой, кнопка говорит глагол; «действие»
   входит в место: объектив плывёт к ближнему виду места (прежние станции камеры), а таблица места приходит
   карточкой сбоку (ПК, ≤ 36 % ширины) или снизу (телефон, ≤ 55 % высоты) — только строки этого места.
   «Назад» закрывает карточку, он идёт дальше. ?hall=0 — прежний стол, ?walk=0 — прежний зал с плитой.

   ПРАВИЛА ФАЙЛА:
   1. Места — порядок постоянный (ноги игрока его выучивают); места без вкладок на этой станции нет, линия смыкается.
   2. Мерило — человек: идя, он ≈ .28 высоты кадра на ПК и ≈ .25 на телефоне; зал от среза пола до потолка — почти весь кадр,
      срез — у z 3,8 (HALL_FCUT): между линией хода и срезом 2,3 м пола, не пять.
   3. Над залом при ходьбе — только угловой чип станции, полоса мест и две кнопки (глагол, выход).
   4. Ход — по настоящим часам (интерфейс, как наезд камеры): в паузе игры и на стенде он идёт так же. */
const HALL_WZ=1.5;            /* линия хода: перед стойкой бара и прилавками, за ней — столики бара */
const HALL_WALK_V=2.6,HALL_JOG_V=4.5;   /* шаг и бег, м/с: дверь → бар (17 м) шагом ≤ 7 с */
const HALL_WALK_D={pc:7.1,ph:8.4,fy:.8,ey:1.5,ty:1.45};   /* разрез: зал во весь кадр, пол до среза — не пустыня */   /* объектив хода: от линии, поле, высота глаза и цели */
/* места: id, x на линии, вкладки карточки, глагол, имя в полосе, куда смотрит стоя (yaw), табличка (точка, имя, строка) */
const HALL_PLACES=[
  {id:"lock", x:-6.9, tabs:[],verb:"ЗАПРАВКА",ru:"ШЛЮЗ",yaw:-Math.PI/2,tag:[-7.15,2.3,HALL_WZ],tn:"ШЛЮЗ",ts:"борт у причала"},
  {id:"trade",x:-4.45,tabs:["market","barter","flea","scrip"],verb:"ТОРГОВАТЬ",ru:"СТОЙКА",yaw:-Math.PI/2-.35,tag:[-5.3,1.9,-1.4],tn:"СТОЙКА",ts:""},
  {id:"board",x:-2.85,tabs:["board"],verb:"ДОСКА",ru:"ДОСКА",yaw:Math.PI,tag:[-3.35,2.5,HALL_B+.05],tn:"ДОСКА",ts:"объявления станции"},
  {id:"ship", x:-.15, tabs:["yard","mods","fuse","site"],verb:"ВЕРФЬ",ru:"ВЕРФЬ",yaw:Math.PI+.25,tag:[.6,2.6,HALL_B],tn:"ОКНО",ts:"верфь и стройка"},
  {id:"know", x:1.95, tabs:["lab","instr"],verb:"ПРИБОРЫ",ru:"ВЕРСТАК",yaw:Math.PI-.2,tag:[1.0,1.12,-2.25],tn:"ВЕРСТАК",ts:"наука и приборы"},
  {id:"hold", x:4.75, tabs:["bases"],verb:"ВЛАДЕНИЯ",ru:"КОНТОРА",yaw:Math.PI-.15,tag:[4.9,1.0,-1.7],tn:"КОНТОРА",ts:"владения"},
  {id:"folk", x:HALL_XB+.9,tabs:["crew","cantina"],verb:"ЛЮДИ",ru:"БАР",yaw:Math.PI,tag:[HALL_XB+.4,1.25,-.2],tn:"БАР",ts:"люди станции"}];
/* шлюз — ближний вид: дверь в левой стене и пилот у неё */
HALL_CAMS.lock={eye:[-3.2,1.6,5.4],tgt:[-6.4,1.25,1.3],fy:1.05};
/* ?walk=0 — прежний зал: адрес читается один раз, ход спрашивает его по нескольку раз за кадр */
const HALL_WALK_Q=typeof location!=="undefined"&&/[?&]walk=0\b/.test(location.search);
function hallWalkOn(){return HALL.on&&HALL.walkOn!==false&&!HALL_WALK_Q;}
/* бар — место, если у станции есть стойка бара или наём; и хоть одна его вкладка здесь */
function hallHasFolk(st,has){
  const bar=hallHasBar(st)||has.indexOf("crew")>=0;
  return bar&&HALL_PLACES[HALL_PLACES.length-1].tabs.some(t=>has.indexOf(t)>=0);
}
/* места этой станции: у места должна быть хоть одна вкладка здесь (шлюз — всегда) */
function hallPlacesHere(){
  const has=G.st?stTabsHere():[],st=(G.st&&G.st.stype)||"trade";
  return HALL_PLACES.filter(p=>p.id==="lock"||(p.id==="folk"?hallHasFolk(st,has):p.tabs.some(t=>has.indexOf(t)>=0)));
}
/* осадить ход: пилот встаёт в цель (или в ближнее место), скорость 0, объектив — на нём. Для зрения (90b2 geoSettle):
   окно снимается при DPR 1 и 3 порознь, и человек на полпути дал бы «не на месте» */
function hallWalkSettle(){
  const W=HALL.walk;if(!W)return;
  if(W.goal!=null){W.x=W.goal;W.goal=null;const g=W.go;W.go=null;if(g)hallWalkEngage(g);}
  else{const p=hallWalkNear(W);if(p&&!W.eng)W.x=p.x;}
  W.v=0;W.ph=0;W.cx=W.x;W.fk=W.eng?1:0;W.tl=0;W.ts=0;const n=hallWalkNear(W);if(n)W.at=n.id;
  if(HALL.to)HALL.from=null;   /* и наезд камеры — сразу в конце: hallGlideAt отдаёт цель */
  hallWalkUi(true);
}
/* ход: x на линии, лицо (±1), фаза шага, скорость, цель (x) и место, в которое войти по приходу */
function hallWalkInit(){
  const W=HALL.walk,same=W&&W.vk===((G.sys&&G.sys.key)||"");
  HALL.walk={x:same?W.x:HALL_PLACES[0].x+.35,face:1,ph:0,v:0,goal:null,go:null,eng:null,at:"lock",vk:(G.sys&&G.sys.key)||"",
    t0:wallMs(),cx:null,fk:0,bf:null,bg0:0,in0:same?0:wallMs(),act:false};
  hallWalkDom();
}
function hallWalkNear(W){const P=hallPlacesHere();let b=null,d=1e9;for(const p of P){const e=Math.abs(p.x-W.x);if(e<d){d=e;b=p;}}return b&&d<1.25?b:null;}
/* шаг: клавиши ведут, цель (тап, полоса, 1–7) — тоже; у цели — встать и, если просили, войти */
function hallWalkStep(dt){
  const W=HALL.walk;if(!W||W.eng)return false;
  const P=hallPlacesHere(),x0=P.length?P[0].x-.2:-6.6,x1=P.length?P[P.length-1].x+.6:HALL_XB+1.5;
  const kl=!!(keys.left),kr=!!(keys.right);let dir=0,vmax=HALL_WALK_V;
  if(kl||kr){W.goal=null;W.go=null;dir=(kr?1:0)-(kl?1:0);}
  else if(W.goal!=null){const d=W.goal-W.x;if(Math.abs(d)<.04){W.x=W.goal;W.goal=null;const g=W.go;W.go=null;if(g)hallWalkEngage(g);}
    else{dir=Math.sign(d);if(W.jog)vmax=HALL_JOG_V;}}
  const want=dir*vmax;W.v+=(want-W.v)*(1-Math.exp(-dt*9));if(!dir&&Math.abs(W.v)<.02)W.v=0;
  if(dir)W.face=dir;
  let nx=W.x+W.v*dt;if(W.goal!=null&&dir&&Math.sign(W.goal-nx)!==dir)nx=W.goal;
  W.x=clamp(nx,x0,x1);if(W.x===x0||W.x===x1)W.v=dir&&Math.sign(W.v)===dir?0:W.v;
  W.ph+=Math.abs(W.v)*dt*(Math.PI/.72);
  const n=hallWalkNear(W);W.at=n?n.id:null;
  return Math.abs(W.v)>.01;
}
/* идти к месту (полоса, 1–7): далеко — бегом, по приходу — войти */
function hallWalkTo(id,engage){
  const W=HALL.walk,p=hallPlacesHere().find(q=>q.id===id);if(!W||!p)return;
  if(W.eng)hallWalkBack(true);
  if(Math.abs(p.x-W.x)<.05){if(engage)hallWalkEngage(id);return;}
  W.goal=p.x;W.go=engage?id:null;W.jog=Math.abs(p.x-W.x)>6||engage;
}
/* позы рига на ходу: углы костей от фазы шага (таз, корпус, голова, ближняя нога ×3, дальняя ×3, руки ×2 ×2) */
function hallWalkPose(W){
  const v=Math.abs(W.v),a=clamp(v/HALL_WALK_V,0,1.35),p=W.ph,s=Math.sin(p),s2=Math.sin(p+Math.PI);
  const st=HALL_RIG_POSE.stand,m=Math.min(1,a);
  const leg=(q)=>[.48*a*Math.sin(q),-.1-.7*a*Math.max(0,Math.sin(q+1.9)),.06+.18*a*Math.sin(q-.6)];
  const n=leg(p),f=leg(p+Math.PI),A=[0,.05*a,-.04, ...n, ...f, .16-.42*a*s,.45+.18*a, .12-.42*a*s2,.40+.18*a];
  return A.map((v2,i)=>st[i]+(v2-st[i])*m);
}
/* пилот на линии: x, z, разворот, поза (массив углов или имя) */
/* в месте пилот подходит к вещи: прежние точки станции (HALL_PILOT_AT — под них сняты ближние виды), у доски,
   конторы и шлюза — свои. Подход идёт вместе с наездом (W.fk): с линии к точке, поза точки — в конце */
const HALL_WALK_SPOT={lock:[-6.75,HALL_WZ,-Math.PI/2,"stand"],board:[-3.05,-1.75,Math.PI,"stand"],hold:[4.3,-1.0,Math.PI-.4,"stand"]};
const HALL_WALK_POV={board:1,hold:1};
function hallWalkSpot(id){return id?HALL_WALK_SPOT[id]||HALL_PILOT_AT[id==="ship"&&tab==="site"?"site":id]||null:null;}
function hallWalkPilot(){
  const W=HALL.walk;if(!W||!hallWalkOn()||HALL.pilot===false)return null;
  const mv=Math.abs(W.v)>.05,p=hallPlacesHere().find(q=>q.id===(W.eng||W.at));
  const sp=W.fk>0?hallWalkSpot(W.eng||W.at):null,k=sp?hallEase(W.fk):0;
  /* идёт — боком на три четверти к объективу; стоит у места — к вещи; просто стоит — к объективу вполоборота */
  const yaw=k>.5?sp[2]:mv?W.face*(Math.PI/2-.42):p?p.yaw:W.face*(Math.PI/2-.9);
  W.yaw=W.yaw==null||W.fk>=1?yaw:W.yaw+Math.atan2(Math.sin(yaw-W.yaw),Math.cos(yaw-W.yaw))*.22;
  /* доска и контора: ближний вид — глаза самого пилота (M814), на подходе он уходит в объектив */
  if(sp&&k>.6&&HALL_WALK_POV[W.eng||W.at])return null;
  if(sp)return [W.x+(sp[0]-W.x)*k,HALL_WZ+(sp[1]-HALL_WZ)*k,W.yaw,k>.85?sp[3]:"stand"];
  return [W.x,HALL_WZ,W.yaw,mv||Math.abs(W.v)>.001?hallWalkPose(W):"stand"];
}
/* объектив хода: следом за пилотом с задержкой τ .45 с, в пределах зала (кромка кадра не уходит за торцы) */
function hallWalkLens(L,sz,dt){
  const W=HALL.walk,ph=!sz.wide,D=ph?HALL_WALK_D.ph:HALL_WALK_D.pc,fy=HALL_WALK_D.fy;
  const half=D*Math.tan(fy/2)*sz.cw/Math.max(1,sz.ch),X0=HALL_L-.6,X1=L.R+.6;
  const want=X1-X0<2*half?(X0+X1)/2:clamp(W.x,X0+half,X1-half);
  if(W.cx==null||dt>=1)W.cx=want;else W.cx+=(want-W.cx)*(1-Math.exp(-dt/.45));
  return {eye:[W.cx+.35,HALL_WALK_D.ey,HALL_WZ+D],tgt:[W.cx,HALL_WALK_D.ty,HALL_WZ],fy};
}
/* камера кадра с рамкой: cx, cy — где на экране стоит цель (сдвиг оптики) */
function hallCamFr(c,w,h,cx,cy){
  const asp=w/Math.max(1,h),P=r3Persp(c.fy,asp,.1,90);P[8]=-(2*cx-1);P[9]=2*cy-1;
  return {eye:c.eye,tgt:c.tgt,fy:c.fy,asp,vp:r3Mul(P,r3Look(c.eye,c.tgt,[0,1,0]))};
}
/* ближний вид места на телефоне: лист снизу, место — в верхних 45 %. Цель — между вещью (табличкой) и пилотом,
   пилот уже у вещи (hallWalkSpot), цель между ними; глаз спереди за 4,6 м и чуть выше; поле — чтобы от пола до 2,7 м легло в полосу (h 2,8 м на полосу .45) */
function hallWalkPhCam(p,asp){
  const sp=HALL_WALK_POV[p.id]?[p.tag[0],p.tag[2]]:hallWalkSpot(p.id)||[p.x,HALL_WZ];   /* без пилота — цель на вещи */
  const tx=Math.max(HALL_L+1.1,(p.tag[0]+sp[0])/2),tz=Math.min(HALL_WZ,(p.tag[2]+sp[1])/2),D=4.6;
  const fy=2*Math.atan(1.45/D/.45);
  return {eye:[tx+.4,1.85,tz+D],tgt:[tx,1.25,tz],fy};
}
/* камера кадра: ход — объектив хода; в месте — станция места; переход — плавно (вход .45 с, выход .7 с) */
function hallWalkCam(L,sz,c0){
  const W=HALL.walk,tm=wallMs(),dt=W.tl?Math.min(.1,(tm-W.tl)/1000):1;W.tl=tm;
  const wl=hallWalkLens(L,sz,dt),ph=!sz.wide,asp=sz.cw/Math.max(1,sz.ch);
  const fk=W.eng?1:0;W.fk+=(fk-W.fk)*(1-Math.exp(-dt/(W.eng?.16:.24)));if(Math.abs(W.fk-fk)<.002)W.fk=fk;
  const k=hallEase(W.fk);
  /* место: станция камеры (её наезд и линза строк — прежние); на телефоне поле шире под узкий кадр */
  /* телефон: станции камер сняты под ПК (полкадра потолка) — у места свой ближний вид, hallWalkPhCam */
  const pl=ph&&c0&&W.eng?HALL_PLACES.find(q=>q.id===W.eng):null;
  const pc=pl?hallWalkPhCam(pl,asp):c0?{eye:c0.eye,tgt:c0.tgt,fy:c0.fy}:wl;
  const m=(a,b)=>a.map((v,i)=>v+(b[i]-v)*k);
  const c={eye:m(wl.eye,pc.eye),tgt:m(wl.tgt,pc.tgt),fy:wl.fy+(pc.fy-wl.fy)*k};
  const cx=.5+((ph?.5:.32)-.5)*k,c0y=ph?.6:.5,cy=c0y+((ph?.225:.5)-c0y)*k;   /* телефон на ходу: цель ниже середины — сцена под полосой мест, а не над пустым срезом */
  const cam=hallCamFr(c,sz.cw,sz.ch,cx,cy);cam.c=c;return cam;
}
function hallWalkMoving(){const W=HALL.walk;return !!W&&(Math.abs(W.v)>.01||W.goal!=null||(W.fk>0&&W.fk<1)||(W.cx!=null&&Math.abs(W.cx-W.x)>.02&&Math.abs(W.v)>0));}
/* войти в место: вкладка — первая из его здесь, камера — к месту, карточка — сбоку */
function hallWalkEngage(id){
  const W=HALL.walk;if(!W)return;
  const p=hallPlacesHere().find(q=>q.id===id);if(!p)return;
  W.goal=null;W.go=null;W.v=0;W.x=p.x;W.at=id;W.eng=id;
  if(id!=="lock"){const has=stTabsHere(),t=p.tabs.filter(x=>has.indexOf(x)>=0);if(t.length&&t.indexOf(tab)<0){tab=t[0];syncTabs();}}
  hallGo(id==="lock"?"lock":hallPlaceOf(tab)==="site"&&id==="ship"?"site":id,false);HALL.gd=450;
  hallWalkCls();renderTab();
}
function hallWalkBack(quiet){
  const W=HALL.walk;if(!W||!W.eng)return;
  W.eng=null;hallWalkCls();if(!quiet&&HALL.tags){HALL.tags.__key="";}
}
/* место камеры при открытой карточке: прежнее место раздела, но верстак держит и ПРИБОРЫ, окно — СТРОЙКУ */
function hallWalkPlaceCam(){
  const W=HALL.walk;if(!W||!W.eng)return null;
  if(W.eng==="lock")return "lock";
  if(W.eng==="ship")return tab==="site"?"site":"ship";
  return W.eng;
}
/* вкладки карточки: только вкладки места, имена разделов спрятаны */
function hallWalkTabs(){
  const W=HALL.walk;if(!W||!W.eng||typeof document==="undefined")return;
  const p=HALL_PLACES.find(q=>q.id===W.eng),has=stTabsHere();let n=0;
  document.querySelectorAll("#stTabs button").forEach(b=>{const ok=!!p&&p.tabs.indexOf(b.dataset.tab)>=0&&has.indexOf(b.dataset.tab)>=0;
    b.style.display=ok?"":"none";if(ok)n++;b.classList.toggle("on",b.dataset.tab===tab);});
  const $t=document.getElementById("stTabs");if($t)$t.classList.toggle("solo",n<2);
}
function hallWalkCls(){
  if(typeof $st==="undefined"||!$st)return;
  const W=HALL.walk,on=!!W&&hallWalkOn()&&HALL.open;
  $st.classList.toggle("walk",on);$st.classList.toggle("eng",on&&!!W.eng);$st.classList.toggle("lock",on&&W.eng==="lock");
  const d=document.getElementById("stWalk");if(d)d.hidden=!on;
  hallWalkUi();
}
/* полоса мест сверху, глагол у места, выход — справа; назад — в карточке */
function hallWalkDom(){
  if(typeof document==="undefined"||!$st)return;
  let d=document.getElementById("stWalk");
  /* узлы — createElement, не innerHTML: под заглушкой DOM ядра (Node) innerHTML детей не рождает */
  const mk=(tag,id,cls,txt,fn)=>{const e=document.createElement(tag);e.id=id;if(cls)e.className=cls;if(txt)e.textContent=txt;if(fn)e.addEventListener("click",fn);d.appendChild(e);return e;};
  if(!d){d=document.createElement("div");d.id="stWalk";
    mk("nav","stWalkStrip","wstrip");
    mk("button","stWalkAct","act gold","",()=>{const W=HALL.walk;if(W&&W.at&&!W.eng)hallWalkEngage(W.at);});
    mk("button","stWalkOut","act","ОТСТЫКОВАТЬСЯ",()=>closeStation());
    mk("button","stWalkBack","act","НАЗАД",()=>hallWalkBack());
    $st.appendChild(d);
    /* тап по полу: идти туда (только мимо кнопок и карточки) */
    $st.addEventListener("pointerdown",e=>{const W=HALL.walk;if(!W||!hallWalkOn()||!HALL.open||W.eng||!HALL.vp)return;
      if(e.target!==$st&&e.target.id!=="stHall"&&e.target.id!=="stWalk")return;
      const r=$st.getBoundingClientRect(),ui=(typeof UIK==="number"&&UIK>0)?UIK:1,sx=(e.clientX-r.left)*ui,w=r.width*ui;
      const L=HALL.L;if(!L)return;const c=hallWalkLens(L,{cw:w,ch:r.height*ui,wide:hallWide()},0);
      const half=(hallWide()?HALL_WALK_D.pc:HALL_WALK_D.ph)*Math.tan(HALL_WALK_D.fy/2)*w/Math.max(1,r.height*ui);
      W.goal=c.tgt[0]+(sx/w-.5)*2*half;W.go=null;W.jog=Math.abs(W.goal-W.x)>6;});}
  const s=document.getElementById("stWalkStrip");if(!s)return;s.textContent="";
  hallPlacesHere().forEach((p,i)=>{const b=document.createElement("button");b.dataset.place=p.id;b.id="stWalk-"+p.id;
    const k=document.createElement("i");k.textContent=String(i+1);b.appendChild(k);b.appendChild(document.createTextNode(p.ru));
    b.addEventListener("click",()=>hallWalkTo(p.id,true));s.appendChild(b);});
}
/* подписи: полоса подсвечивает место под ногами, глагол — только у места */
function hallWalkUi(force){
  const W=HALL.walk;if(!W||typeof document==="undefined")return;
  const key=(W.at||"")+"|"+(W.eng||"");if(!force&&W.uik===key)return;W.uik=key;
  const p=W.at&&HALL_PLACES.find(q=>q.id===W.at),a=document.getElementById("stWalkAct");
  if(a){a.textContent=p?p.verb:"";a.hidden=!p||!!W.eng;}
  document.querySelectorAll("#stWalkStrip button").forEach(b=>b.classList.toggle("on",b.dataset.place===(W.eng||W.at)));
}
/* таблички у вещей: место под ногами и два соседа; в месте — прежние таблички места */
function hallWalkTagList(){
  const W=HALL.walk,P=hallPlacesHere();let i=P.findIndex(p=>p.id===W.at);
  if(i<0){let d=1e9;P.forEach((p,j)=>{const e=Math.abs(p.x-W.x);if(e<d){d=e;i=j;}});}
  return P.slice(Math.max(0,i-1),i+2).map(p=>({p:p.tag,t:p.tn,s:p.id==="trade"?hallTradeLine():p.ts,dn:0}));
}
/* вторая строка стойки — что здесь дёшево (три товара ниже всего к базе), а не тип станции: он уже в шапке */
function hallTradeLine(){
  const sys=G.sys;if(!sys||!sys.station)return "";
  const r=TRADE_KEYS.map(k=>({k,q:buyPriceFor(sys,k)/RES[k].price})).sort((a,b)=>a.q-b.q).slice(0,3);
  return "дёшево: "+r.map(x=>RES[x.k].ru.toLowerCase()).join(", ");
}
/* клавиши: действие входит, назад выходит, 1–7 — к месту по полосе */
if(typeof addEventListener==="function")addEventListener("keydown",e=>{
  const W=HALL.walk;if(!W||!HALL.open||!hallWalkOn()||typeof $st==="undefined"||!$st.classList.contains("open"))return;
  if(e.target&&/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))return;
  if(W.eng){if(e.code==="Escape"||e.code==="Backspace"||(e.code==="KeyS"&&!e.ctrlKey)){hallWalkBack();e.preventDefault();e.stopPropagation();}return;}
  if((e.code==="KeyE"||e.code==="Enter"||e.code==="Space")&&W.at){hallWalkEngage(W.at);e.preventDefault();return;}
  const m=/^Digit([1-7])$/.exec(e.code);if(m){const p=hallPlacesHere()[+m[1]-1];if(p){hallWalkTo(p.id,true);e.preventDefault();}}
},{capture:true});
