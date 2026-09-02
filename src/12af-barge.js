/* ══════════════ холдинг · своя баржа ══════════════
   M294, шаг 6 (DESIGN-holding §12). Автор: «собрать баржу, нанять туда пилота
   и сделать какой-нибудь маршрут». Баржа собрана из того, что в игре уже есть:
   пилот — обычный наёмник (12a) с новым приказом `barge`; корпус — грузовой
   (hcls "hauler": Вьюк по разнарядке или купленный на верфи); маршрут — ваш
   собственный, прохоженный (12r).

   БАРЖА КОРМИТ, А НЕ ТОРГУЕТ (F05). Единственный её выход — пай: раз в смену
   она подходит к следующему плечу и ссыпает то, что везёт, в бункеры ваших
   цехов (bldFeed). Денег она не приносит — оклад пилота идёт минусом в его
   строке, как у любого наёмника; выигрыш — в пае, который растёт без вас.
   Грузит её игрок сам, у стойки: «ПОГРУЗИТЬ» берёт из трюма то, что едят цеха
   на её плечах. Трюм баржи — трюм корпуса (crewCargoMax).

   Никакой симуляции: как у фактора (12c mgrWorkFact) — прошедшие смены на входе,
   единицы в бункерах на выходе, положение не хранится. Под блокадой (occLvl≥2)
   плечо пропускается с одной строкой. Хранится на наёмнике: c.barge =
   {legs, cursor, t0, fed, name} — в белом списке 14-save. */
ORDERS.barge={ru:"баржа",spec:null,note:"кормит ваши цеха по вашему маршруту — денег не приносит, пай растёт без вас"};
const BARGE_NAMES=["Тюк","Куль","Кладь","Волокуша","Шаланда","Плашкоут","Дощаник"];
function bargeHullOk(c){
  const S=c&&c.shipId?shipData(c.shipId):null;
  return !!(S&&S.hcls==="hauler");
}
function bargeName(c){return (c.barge&&c.barge.name)||BARGE_NAMES[Math.abs(c.seed|0)%BARGE_NAMES.length];}
/* что едят ваши цеха на плечах баржи */
function bargeWants(c){
  const out={};
  if(!c.barge)return out;
  for(const key of c.barge.legs){
    const H=G.hold&&G.hold[key];if(!H||!H.bld)continue;
    for(const id in H.bld){const d=BLD[id];if(d)for(const k in d.eats)out[k]=1;}
  }
  return out;
}
/* приказ: проверка и запись. Возвращает причину отказа или "" */
function bargeStart(c){
  if(!bargeHullOk(c))return"Барже нужен грузовой корпус — «Вьюк» или другой тягач";
  const R=routeOf();
  if(R.legs.length<2)return"Сначала проложите маршрут из двух и более плеч";
  if(R.loops<1)return"Баржа идёт по прохоженной дороге — пройдите круг сами";
  const legs=R.legs.filter(key=>{const H=G.hold&&G.hold[key];return H&&H.bld&&Object.keys(H.bld).length;});
  if(!legs.length)return"На маршруте нет ваших цехов — барже некого кормить";
  c.barge={legs:R.legs.slice(),cursor:0,t0:Date.now(),fed:0,name:bargeName(c)};
  c.cargo=c.cargo||{};
  return"";
}
/* смены прошли — баржа прошла плечи и ссыпала, что везла */
function bargeTick(c,now){
  const B=c.barge;if(!B||!Array.isArray(B.legs)||!B.legs.length)return 0;
  now=now||Date.now();
  let s=Math.floor((now-(B.t0||now))/HOLD_SHIFT);
  if(s<=0)return 0;
  s=Math.min(s,72);
  c.cargo=c.cargo||{};
  let fed=0;
  for(let i=0;i<s;i++){
    const key=B.legs[B.cursor%B.legs.length];
    const[sx,sy]=key.split(",").map(Number);
    const sys=getSystem(sx,sy);
    B.cursor++;
    if(!sys||!sys.station)continue;
    if(typeof occLvl==="function"&&occLvl(sx,sy)>=2){
      if(!B.stopped){B.stopped=1;logAdd("warn","Баржа «"+bargeName(c)+"» обошла «"+sys.station.name+"»: система под пиратами");}
      continue;
    }
    B.stopped=0;
    if(typeof bargeAutoLoad==="function")bargeAutoLoad(c,sys);   /* Причал (E4): грузится сама с промыслов */
    for(const k in c.cargo){
      const q=c.cargo[k]|0;if(q<=0)continue;
      const n=bldFeed(sys,k,q);
      if(n>0){c.cargo[k]=q-n;fed+=n;}
    }
  }
  B.t0=(B.t0||now)+s*HOLD_SHIFT;
  B.fed=(B.fed|0)+fed;
  if(fed>0)logAdd("money","Баржа «"+bargeName(c)+"» ссыпала "+fed+" ед в бункеры · пай растёт");
  const hold=crewHold(c);
  if(hold<=0&&!B.empty){B.empty=1;logAdd("warn","Баржа «"+bargeName(c)+"» идёт пустой — погрузите её у стойки");}
  if(hold>0)B.empty=0;
  return fed;
}
/* погрузить у стойки: из трюма игрока — то, что едят цеха на плечах, сколько влезет */
function bargeLoad(c){
  if(!c.barge)return 0;
  c.cargo=c.cargo||{};
  const W=bargeWants(c);
  let room=Math.max(0,crewCargoMax(c)-crewHold(c)),moved=0;
  for(const k in W){
    if(room<=0)break;
    const q=Math.min(G.cargo[k]|0,room);
    if(q<=0)continue;
    G.cargo[k]-=q;c.cargo[k]=(c.cargo[k]|0)+q;room-=q;moved+=q;
  }
  if(moved)c.barge.empty=0;
  return moved;
}
/* выгрузить обратно в свой трюм, сколько влезет */
function bargeUnload(c){
  if(!c.cargo)return 0;
  let moved=0;
  for(const k in c.cargo){
    const q=c.cargo[k]|0;if(q<=0)continue;
    const t=addRes(k,q);c.cargo[k]=q-t;moved+=t;
  }
  return moved;
}
function bargeNextName(c){
  const B=c.barge;if(!B||!B.legs.length)return"";
  const key=B.legs[B.cursor%B.legs.length];
  const[sx,sy]=key.split(",").map(Number);
  const s=getSystem(sx,sy);
  return s&&s.station?s.station.name:key;
}
function bargeLine(c){
  const B=c.barge;if(!B)return"";
  const hold=crewHold(c);
  return"«"+bargeName(c)+"» · на борту "+hold+"/"+crewCargoMax(c)+" · следующее плечо «"+bargeNextName(c)+"» · скормлено "+(B.fed|0);
}
/* строки для ДЕЛО — рядом с постройками, а не с наёмниками: это часть холдинга */
function bargeDealList(){
  const out=[];
  for(const c of (G.crew||[])){
    if(!c.order||c.order.kind!=="barge"||!c.barge)continue;
    bargeTick(c);
    const hold=crewHold(c);
    const key=c.barge.legs[c.barge.cursor%c.barge.legs.length]||"";
    const[sx,sy]=key.split(",").map(Number);
    out.push({nm:"Баржа «"+bargeName(c)+"» · "+c.name,
      state:(hold?"везёт "+hold+" ед · ":"идёт пустой · ")+"к «"+bargeNextName(c)+"» · скормлено "+(c.barge.fed|0)+" · оклад минусом, пай растёт",
      sx,sy});
  }
  return out;
}
/* ряд в ЭКИПАЖЕ у стойки: погрузить / выгрузить */
function bargeCrewRow(c){
  if(!c.order||c.order.kind!=="barge"||!c.barge||!G.sys||!G.sys.station)return;
  bargeTick(c);
  const W=Object.keys(bargeWants(c)),have=W.filter(k=>(G.cargo[k]|0)>0);
  const r=el("div","row");
  r.appendChild(el("div","nm","<b>Баржа "+bargeLine(c)+"</b><s>"+
    (W.length?"цеха на плечах едят: "+W.map(k=>RES[k].ru.toLowerCase()).join(", "):"на плечах нет ваших цехов")+
    (have.length?" · в трюме есть: "+have.map(k=>RES[k].ru.toLowerCase()+" "+G.cargo[k]).join(", "):"")+"</s>"));
  const room=Math.max(0,crewCargoMax(c)-crewHold(c));
  const b=el("button","act"+(have.length&&room?" gold":""),"ПОГРУЗИТЬ");
  b.disabled=!(have.length&&room);
  b.onclick=()=>{const n=bargeLoad(c);
    if(n)tell("tech","На баржу «"+bargeName(c)+"» погружено "+n+" ед","Баржа «"+bargeName(c)+"»\n+"+n+" ед на борт");
    renderTab();};
  r.appendChild(b);
  if(crewHold(c)>0){
    const u=el("button","act sm","ВЫГРУЗИТЬ");
    u.onclick=()=>{const n=bargeUnload(c);if(n)say("С баржи снято "+n+" ед");renderTab();};
    r.appendChild(u);
  }
  $body.appendChild(r);
}
