/* ══════════════ ГЛАВТРАССА: флот, который нельзя купить (M310, DESIGN-holding §18) ══════════════ */
/* Баржа торгует. Флот возит и служит. Тринадцать классов с реальных
   доноров (§18.3), окраска одна на всех (§18.5): серо-белый корпус, красная
   полоса во всю длину, чёрный номер в треть высоты, жжёная медь у сопел, имя
   крупно по борту, под ним мелко — ведомство, номер, трасса. Износ
   обязателен и лежит ПОД бликами (§1 свода).

   Имена — свои, не МКС (развилка 4 критики, решена автором 03.09.2026):
   корабли зовутся вещными словами в ряду Тук/Барма; модули узловой станции —
   Короб, Кубрик, Воротник, Тамбур, Погреб; узловая по позывному «УЗ-1»;
   дерелик без имени — чёрный корпус и есть его голос.

   Движение — как у барж (§18.9): положение = f(линия, семя, Date.now()),
   хранятся только последствия (G.fleetLog: когда в этой системе заправили
   по норме). Кого встречаешь — по лестнице (§18.8): с Буя (5) проходит
   почтовик, со Стыковочного узла (16) — танкер, с Причальной фермы (19) —
   буксир. Остальные классы в таблице с голосами, но без рисунка: их не
   спавним, пока они не нарисованы — силуэт без обвода хуже отсутствия. */

const FLEET_CLASSES={
  post:  {ru:"почтовик",     donor:"Союз",     mark:"рожок", rung:5,  art:1,
          say:["…борт, слышу. Почта на «Узел» идёт, ваш сектор в пути. Конец связи.",
               "…почтовик. Карточек не жду — вы не станция. Держитесь трассы, борт."]},
  tanker:{ru:"танкер",       donor:"Протон",   mark:"капля", rung:16, art:1,
          say:["…танкер ГЛАВТРАССЫ. Норму даём раз в смену, без расписок. Подходите к горловинам.",
               "…танкер. Баки полны? Тогда счастливо. Пустой — подходите."]},
  tug:   {ru:"буксир",       donor:"ядерный буксир", mark:"якорь", rung:19, art:1,
          say:["…буксир. Реактор в носу, к нам ближе ста метров не ходят. Тянем на верфь — если тянуть есть что.",
               "…буксир слышит. Корпус ваш цел, значит, не по нашей части. Конец."]},
  fridge:{ru:"рефрижератор", donor:"Прогресс", mark:"капля", rung:27, art:1, say:["…рефрижератор. Груз холодный, разговор короткий."]},
  ore:   {ru:"рудовоз",      donor:"Энергия",  mark:"кайло",  rung:27, art:1, say:["…рудовоз. Четыре пакета на борту, идём тяжело."]},
  lighter:{ru:"лихтеровоз",  donor:"семёрка",  mark:"кольцо", rung:27, art:1, say:["…лихтеровоз. Чужие баржи на крестовине, своей нет."]},
  ferry: {ru:"паром",        donor:"Буран",    mark:"ладонь", rung:21, art:1, say:["…паром. Людей вниз, людей вверх. Груз не берём."]},
  patrol:{ru:"сторожевик",   donor:"Спираль",  mark:"щит",    rung:21, art:1, say:["…сторожевик. Ваш борт в списках чист. Пока."]},
  rescue:{ru:"спасатель",    donor:"Луна-9",   mark:"ладонь", rung:21, art:1, say:["…спасатель. Лепестки закрыты, идём на чужой сигнал."]},
  hosp:  {ru:"госпитальное", donor:"ТКС",      mark:"крест",  rung:21, art:1, say:["…госпитальное. Раненых нет? Тогда не отвлекайте."]},
  school:{ru:"учебное",      donor:"Восток",   mark:"книга",  rung:21, art:1, say:["…учебное. Шесть капсул, шесть голосов, все ваши вопросы уже задавали."]},
  exped: {ru:"экспедиционное",donor:"Салют",   mark:"циркуль",rung:25, art:1, say:["…экспедиционное. Тарелки на вас не смотрим, не тот сектор."]},
  base:  {ru:"плавбаза",     donor:"Мир",      mark:"кольцо", rung:19, art:1, say:["…плавбаза. Пока стоим здесь — мы вам станция."]}
};
const FLEET_NAMES=["ЗАРНИЦА","ОКОЁМ","СТРЕМЯ","ЛАДЬЯ","КРЕМЕНЬ","ПОЛЫНЬ","ЗАСТАВА","КОСОГОР",
  "ТИХОХОД","СЕВЕРЯНКА","ПРОСВЕТ","ОПОКА","ОТМЕЛЬ","ПОДКОВА","ВЕРСТА","ЛУЧИНА"];
/* места (развилка 4): модули узловой станции — свои слова */
const FLEET_PLACES={node:"УЗ-1",mods:["Короб","Кубрик","Воротник","Тамбур","Погреб"]};
const FLEET_PERIOD=600000;               /* один проход через систему — десять минут */
const FLEET_NORM_SHIFTS=1;               /* норма топлива: раз в смену на систему */

function fleetRung(sys){return (typeof rungOf==="function")?rungOf(sys.sx,sys.sy):0;}
/* кто идёт через систему в этом окне: чисто от семени и часов, ничего не хранится */
function fleetHere(sys){
  sys=sys||G.sys;if(!sys)return [];
  const bucket=Math.floor(Date.now()/FLEET_PERIOD);
  if(sys.fleetCache&&sys.fleetCache.b===bucket)return sys.fleetCache.list;
  const rung=fleetRung(sys), out=[];
  /* ── чёрный дерелик (§18.4, M313): в дальних секторах без станции ──
     Без имени, без огней, без ответа. Один на четыре опасные системы, стоит
     где встал; его голос — чёрный корпус. */
  if(!sys.station){
    const dz=(typeof sysDanger==="function")?sysDanger(sys.sx,sys.sy):0;
    const hd=hashi(sys.sx|0,sys.sy|0,0xDE4E);
    if(dz>=.6&&(hd&3)===0){
      const rr=rng(hd);const a=rr()*TAU,rad=1400+rr()*1400;
      out.push({k:"derelict",seed:hd,name:"",num:"",line:0,x0:Math.cos(a)*rad,y0:Math.sin(a)*rad,x1:Math.cos(a)*rad,y1:Math.sin(a)*rad,bow:0,ph:0,still:1});
    }
    sys.fleetCache={b:bucket,list:out};return out;
  }
  /* ── узловая станция трасс «УЗ-1» (§18.4, M313): с рунга 25, напротив станции ── */
  if(rung>=25){
    const st=sys.station,nx=-(st.x||0)*.85,ny=-(st.y||0)*.85;
    out.push({k:"node",seed:hashi(sys.seed,25,0x0E1),name:FLEET_PLACES.node,num:"",line:0,x0:nx,y0:ny,x1:nx,y1:ny,bow:0,ph:0,still:1});
  }
  const r=rng(hashi(sys.sx*31+sys.sy*17,bucket*613+0xF1E7,0x7A55));
  for(const k in FLEET_CLASSES){
    const C=FLEET_CLASSES[k];
    if(!C.art||rung<C.rung)continue;
    if(r()>.55)continue;                 /* не в каждом окне: линия — расписание, не конвейер */
    const seed=hashi(sys.seed,bucket*97+out.length,0xF1E7);
    const rr=rng(seed);
    const a=rr()*TAU, rad=3300;
    out.push({k,seed,name:FLEET_NAMES[Math.floor(rr()*FLEET_NAMES.length)],
      num:"Л-"+(1000+Math.floor(rr()*9000)),line:1+Math.floor(rr()*9),
      x0:Math.cos(a)*rad,y0:Math.sin(a)*rad,x1:-Math.cos(a)*rad*(.9+rr()*.2),y1:-Math.sin(a)*rad*(.9+rr()*.2),
      bow:(rr()-.5)*900,ph:rr()});
  }
  sys.fleetCache={b:bucket,list:out};
  return out;
}
/* положение на линии сейчас: доля окна, дуга с прогибом */
function fleetPos(f){
  if(f.still)return {x:f.x0,y:f.y0,a:0,u:0};
  const u=((Date.now()/FLEET_PERIOD)+f.ph)%1;
  const dx=f.x1-f.x0,dy=f.y1-f.y0,L=Math.hypot(dx,dy)||1;
  const nx=-dy/L,ny=dx/L,bw=Math.sin(u*Math.PI)*f.bow;
  const x=f.x0+dx*u+nx*bw,y=f.y0+dy*u+ny*bw;
  const u2=Math.min(1,u+.003),bw2=Math.sin(u2*Math.PI)*f.bow;
  const a=Math.atan2(dy*.003+ny*(bw2-bw),dx*.003+nx*(bw2-bw));
  return {x,y,a,u};
}

/* окраска флота — отдельным слоем (12ai1, M415) */

/* масштаб спрайта в системе (§8, альманах III): упирался в 1.5, пока setZoom
   идёт до 2.4 — последняя треть зума растила мир, а флот нет, и на сближении
   почтовик оказывался меньше баржи. Спрайт печётся в ×3: до потолка зума
   разрешение уже оплачено. */
function fleetScale(Z){return clamp(Z,.5,2.4)*.85;}
/* строка подсказки — живой DOM, меряем его (27z); null, когда её нет */
function fleetPromptRect(){
  const pe=document.getElementById("prompt");if(!pe||!pe.textContent)return null;
  const r=pe.getBoundingClientRect();return r.height>0?r:null;
}
/* подпись под кораблём (§3): не по константе (+30/+40 ложились на корпус
   высоких классов и на фишки планет), а от видимой полувысоты тела под текущим
   углом; если снизу фишка или строка подсказки — уходит наверх. Фишки — SYS_CHIPS
   предыдущего кадра, в тех же пикселях холста. Возвращает базовую линию первой
   строки; вторая идёт на +10. */
function fleetLabelY(x,y,hh,tw,rows){
  const bh=8+rows*10,pr=fleetPromptRect();
  const hit=ly=>{
    const x0=x-tw/2,x1=x+tw/2,y0=ly-8,y1=ly-8+bh;
    if(y1>H-40)return true;
    if(pr&&!(x1<pr.left||pr.right<x0||y1<pr.top-4||pr.bottom+4<y0))return true;
    if(typeof SYS_CHIPS!=="undefined")for(const c of SYS_CHIPS)if(!(x1<c.x||c.x+c.w<x0||y1<c.y||c.y+c.h<y0))return true;
    return false;};
  const below=y+hh+12,above=y-hh-4-bh+8;
  return (hit(below)&&!hit(above))?above:below;
}
function drawFleet(zx,zy,Z){
  const F=fleetHere(G.sys);if(!F.length)return;
  for(const f of F){
    const p=fleetPos(f),x=zx(p.x),y=zy(p.y);
    if(x<-260||x>W+260||y<-260||y>H+260)continue;
    const s=fleetScale(Z),art=fleetArtOf(f);
    ctx.save();ctx.translate(x,y);ctx.rotate(p.a);ctx.scale(s,s);
    drawFleetShip(f);
    ctx.restore();
    if(f.k==="derelict")continue;
    const C=FLEET_CLASSES[f.k];
    const hh=(Math.abs(art.bx*Math.sin(p.a))+Math.abs(art.by*Math.cos(p.a)))*s;
    ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
    const l1=f.k==="node"?"«"+f.name+"» · УЗЕЛ ТРАСС · ГЛАВТРАССА":"«"+f.name+"» · ГЛАВТРАССА · "+f.num+" · ТРАССА "+f.line;
    const rows=f.k==="node"?1:2,ly=fleetLabelY(x,y,hh,ctx.measureText(l1).width,rows);
    ctx.fillStyle="rgba(226,214,200,.8)";ctx.fillText(l1,x,ly);
    if(rows>1){ctx.fillStyle="rgba(226,214,200,.5)";ctx.fillText(C.ru.toUpperCase(),x,ly+10);}
    ctx.textAlign="left";
  }
}
/* ── позывной и заправка по норме (§18.7 п.1, п.3) ── */
function fleetLogKey(){return G.sx+","+G.sy;}
/* праздник по календарю (11am): норма флота двойная в этот день (M349) */
function fleetNormTwice(){return !!(typeof holNow==="function"&&holNow());}
function fleetNormKey(){return Math.floor(Date.now()/((typeof HOLD_SHIFT==="number")?HOLD_SHIFT:1800000))+(fleetNormTwice()?"h":"");}
/* ── Кольцо (рунг 30): окликают первыми (§18.8, M315) ──
   До сих пор эфир отвечал только на ваш позывной. На последней ступени лестницы
   флот узнаёт борт сам: первый корабль линии, подошедший на семьсот, называет вас
   раньше, чем вы его. Раз в окно на систему; хранится одно число (`fleetLog`). */
function fleetHailFirst(sh,F){
  if(fleetRung(G.sys)<30)return;
  const bucket=Math.floor(Date.now()/FLEET_PERIOD),key="hail|"+fleetLogKey();
  G.fleetLog=G.fleetLog||{};
  if(G.fleetLog[key]===bucket)return;
  for(const f of F){
    if(f.k==="derelict"||f.k==="node")continue;
    const p=fleetPos(f);if(Math.hypot(sh.x-p.x,sh.y-p.y)>700)continue;
    const C=FLEET_CLASSES[f.k],who=(G.name&&G.name.trim())?G.name.trim():"борт";
    G.fleetLog[key]=bucket;
    /* ── чужой корпус под своим флагом (M369b, §19.3, D09) ──
       Летать можно на чём угодно, флаг от этого не меняется — но замполит
       обязательно отметит, на чём вы прилетели. Это и есть вся разница. */
    const hby=(typeof makerOf==="function")?makerOf(G.shipId):"gt";
    const hp=(hby!=="gt"&&typeof powerOf==="function")?powerOf(hby):null;
    etherLine("«"+f.name+"» — "+who+"у: …видим вас."+
      (hp?" На "+hp.ru+"ском корпусе, а флаг наш? Записываю.":"")+
      " Кольцо ваше, идём рядом, если надо. Конец связи.",C.ru);
    return;
  }
}
function fleetInteract(sh){
  const F=fleetHere(G.sys);if(!F.length)return false;
  fleetHailFirst(sh,F);
  let near=null,nd=1e9,np=null;
  for(const f of F){const p=fleetPos(f),d=Math.hypot(sh.x-p.x,sh.y-p.y);if(d<nd){nd=d;near=f;np=p;}}
  if(!near||nd>260)return false;
  if(near.k==="derelict"){
    /* ── взять на буксир (M369b, §19.3 «tow») ──
       Чёрный корпус — не декорация: его можно утащить в док и там
       восстановить. Это единственный способ получить чужой корпус, пока
       эпизодов не существует, и он честный: тащить долго, платить дорого. */
    const towed=!!G.tow;
    const dby=(typeof makerBySeed==="function")?makerBySeed(near.seed):"gt";
    G.prompt=towed
      ?"ЧЁРНЫЙ КОРПУС · У ВАС УЖЕ ЕСТЬ БУКСИР\nДЕЙСТВИЕ — ПОЗЫВНОЙ"
      :"ЧЁРНЫЙ КОРПУС · БЕЗ ИМЕНИ\nДЕЙСТВИЕ — ВЗЯТЬ НА БУКСИР";
    if(actEdge&&!towed){
      G.tow={seed:near.seed>>>0,by:dby,sx:G.sx,sy:G.sy};
      G.fleetLog=G.fleetLog||{};
      G.fleetLog["towed|"+fleetLogKey()]=1;
      say("КОРПУС НА ТРОСЕ · В ДОК",120);
      logAdd("tech","Чёрный корпус взят на буксир · сектор "+G.sx+":"+G.sy+
        " · восстановление в доке");
      if(typeof recordAdd==="function")recordAdd("эфир","взял на буксир чёрный корпус в секторе "+G.sx+":"+G.sy);
      return true;
    }
    if(actEdge){
      etherLine("…тишина. Ни позывного, ни огня. Только корпус, и он чёрный.","эфир");
      G.fleetLog=G.fleetLog||{};
      if(!G.fleetLog["derelict|"+fleetLogKey()]){G.fleetLog["derelict|"+fleetLogKey()]=1;
        if(typeof recordAdd==="function")recordAdd("эфир","чёрный корпус в секторе "+G.sx+":"+G.sy+" · не ответил");}
    }
    return true;
  }
  if(near.k==="node"){
    G.prompt="УЗЛОВАЯ «"+near.name+"» · УЗЕЛ ТРАСС\nДЕЙСТВИЕ — ПОЗЫВНОЙ";
    if(actEdge)etherLine("«"+near.name+"»: …узел трасс. Стоянка есть, торга нет: Короб полон, Кубрик спит, Воротник открыт. Держитесь линии.","узловая");
    return true;
  }
  const C=FLEET_CLASSES[near.k];
  /* караван (§18.7 п.6): идти рядом — пираты не подходят, ход медленнее */
  const canCaravan=!(G.caravan&&G.caravan.until>G.t);
  /* спасатель (п.11): идёт на чужой сигнал и зовёт с собой — если в системе есть баржа в беде */
  const dist=(near.k==="rescue"&&G.barges)?G.barges.find(b=>b.distress&&!b.done):null;
  const st=stat(), low=G.fuel<st.fuelMax*.6;
  const shift=Math.floor(Date.now()/((typeof HOLD_SHIFT==="number")?HOLD_SHIFT:1800000));
  G.fleetLog=G.fleetLog||{};
  /* норма — одна на смену; в праздник (11am, маяк объявляет) — две (M349) */
  const fe=G.fleetLog[fleetLogKey()],feS=(fe&&typeof fe==="object")?fe.s:(fe|0),feN=(fe&&typeof fe==="object")?fe.n|0:(fe?1:0);
  const gave=feS>=shift-(FLEET_NORM_SHIFTS-1)&&feN>=(fleetNormTwice()?2:1);
  const canFuel=near.k==="tanker"&&low&&!gave;
  /* буксир: корпус, который не дотянет, тянут на верфь — подлатан до 40 %, чтобы дошёл (§18.7 п.4) */
  const hurt=G.hull<st.hullMax*.3;
  const tugKey=fleetLogKey()+"|tug", baseKey=fleetLogKey()+"|base";
  const canTow=near.k==="tug"&&hurt&&(G.fleetLog[tugKey]||0)<shift;
  /* плавбаза: пока стоит здесь — она вам станция: ремонт по норме раз в смену (п.7) */
  const canFix=near.k==="base"&&G.hull<st.hullMax*.9&&(G.fleetLog[baseKey]||0)<shift;
  /* сторожевик: с доброй репутацией проводит, с худой досматривает (п.10) */
  const rep=(typeof repAt==="function")?repAt():0;
  const canEscort=near.k==="patrol"&&rep>=2&&!(G.fleetEscort>G.t);
  /* почтовик: карточки в руки — он привозит ваши (п.5); только в сети */
  const canMail=near.k==="post"&&typeof mailOn==="function"&&mailOn()&&typeof mailDock==="function";
  /* госпитальное: выкуп заложника вдвое дешевле (п.8) */
  const hostage=(G.crew||[]).find(c=>c.state==="hostage"&&c.ransom>0);
  const canRansom=near.k==="hosp"&&!!hostage;
  /* учебное: берёт свободного наёмника на рейс и возвращает грамотнее (п.9), раз в смену */
  const pupil=(G.crew||[]).find(c=>!c.state&&(!c.order||c.order.kind==="home"));
  const schoolKey=fleetLogKey()+"|school";
  const canSchool=near.k==="school"&&!!pupil&&(G.fleetLog[schoolKey]||0)<shift;
  const verb=canFuel?"ЗАПРАВКА ПО НОРМЕ":canTow?"БУКСИР НА ВЕРФЬ":canFix?"РЕМОНТ ПО НОРМЕ":canEscort?"ПРОСИТЬ КОНВОЙ":
    canMail?"СДАТЬ ПОЧТУ":canRansom?"ВЫКУП ЧЕРЕЗ ГОСПИТАЛЬ · "+Math.round(hostage.ransom*.5).toLocaleString("ru")+" КР":canSchool?"ОТДАТЬ В УЧЁБУ · "+pupil.name.toUpperCase():dist?"ИДТИ НА СИГНАЛ · «"+dist.capName.toUpperCase()+"»":canCaravan?"ИДТИ КАРАВАНОМ":"ПОЗЫВНОЙ";
  G.prompt=C.ru.toUpperCase()+" ГЛАВТРАССЫ «"+near.name+"»"+
    "\nДЕЙСТВИЕ — "+verb;
  if(actEdge){
    if(dist){
      const ang=Math.atan2(dist.y-sh.y,dist.x-sh.x),deg=Math.round(((ang/TAU)*360+360)%360);
      const dd=Math.round(Math.hypot(dist.x-sh.x,dist.y-sh.y));
      etherLine("«"+near.name+"»: …спасатель. Сигнал с баржи «"+dist.capName+"», курс "+deg+"°, "+dd+". Идём. Кто с нами — за нами.","спасатель");
      if(typeof say==="function")say("СПАСАТЕЛЬ ИДЁТ НА «"+dist.capName.toUpperCase()+"»\nкурс "+deg+"° · "+dd);
    }else if(!canFuel&&!canTow&&!canFix&&!canEscort&&!canMail&&!canRansom&&!canSchool&&canCaravan){
      G.caravan={until:G.t+1200,name:near.name};
      etherLine("«"+near.name+"»: …идите рядом, борт. Ход наш, пираты к каравану не суются. Отстанете — сами по себе.",C.ru);
    }else if(canMail){
      mailDock();
      etherLine("«"+near.name+"»: …почтовик. Стопку приняли, ваши — на борту, смотрите стол.","почтовик");
    }else if(canRansom){
      hostage.ransom=Math.round(hostage.ransom*.5);
      if(typeof ransomPay==="function"&&ransomPay(hostage))
        etherLine("«"+near.name+"»: …госпитальное. Человека забрали с той стороны, по нашей таксе. Живой.","госпитальное");
      else hostage.ransom*=2;
    }else if(canSchool){
      pupil.xp=(pupil.xp||0)+35;G.fleetLog[schoolKey]=shift;
      if(typeof crewHistory==="function")crewHistory(pupil,{cat:"good",id:"school"},"учился на «"+near.name+"»");
      etherLine("«"+near.name+"»: …учебное. "+pupil.name+" на борту, рейс — и вернём грамотнее.","учебное");
      if(typeof recordAdd==="function")recordAdd("ГЛАВТРАССА","учёба · "+pupil.name+" · «"+near.name+"»");
    }else if(canTow){
      G.hull=Math.max(G.hull,Math.round(st.hullMax*.4));G.fleetLog[tugKey]=shift;
      etherLine("«"+near.name+"»: …взяли на буксир. До верфи дотянете сами, дальше — их работа.","буксир");
      if(typeof recordAdd==="function")recordAdd("ГЛАВТРАССА","буксир «"+near.name+"» · "+near.num);
    }else if(canFix){
      G.hull=st.hullMax;G.fleetLog[baseKey]=shift;
      etherLine("«"+near.name+"»: …плавбаза. Пока стоим здесь — мы вам станция. Корпус закрыли.","плавбаза");
      if(typeof recordAdd==="function")recordAdd("ГЛАВТРАССА","ремонт на плавбазе «"+near.name+"»");
    }else if(canEscort){
      G.fleetEscort=G.t+900;
      etherLine("«"+near.name+"»: …сторожевик. Ваш борт в списках чист — идём рядом. Пятнадцать минут по трассе.","сторожевик");
    }else if(near.k==="patrol"&&rep<=-2){
      etherLine("«"+near.name+"»: …сторожевик. Ваш борт в списках. Досмотр: трюм открыть. Чисто. На этот раз.","сторожевик");
    }else if(canFuel){
      G.fuel=st.fuelMax;G.fleetLog[fleetLogKey()]=(feS===shift)?{s:shift,n:feN+1}:{s:shift,n:1};
      etherLine("«"+near.name+"»: …по норме, до полного. Расписок не пишем — трасса помнит сама.","танкер");
      if(typeof recordAdd==="function")recordAdd("ГЛАВТРАССА","заправка по норме · «"+near.name+"» · "+near.num);
      if(typeof sfx==="function")sfx("ui",{f:520,to:880,d:.3,v:.12});
    }else{
      const r=rng(hashi(near.seed,G.t|0,0xCA11));
      let line=C.say[Math.floor(r()*C.say.length)];
      if(near.k==="tanker"&&!low)line=C.say[1];
      if(near.k==="tanker"&&low&&gave)line="…танкер. Норму в этом секторе вы уже брали. Следующая — со сменой.";
      etherLine("«"+near.name+"»: "+line,C.ru);
    }
  }
  return true;
}

/* конвой сторожевика: пока действует, пираты вас не видят (§18.7 п.6/п.10) */
function fleetEscortActive(){return G.mode==="system"&&((G.fleetEscort||0)>G.t||fleetCaravanActive());}
/* караван действует, пока срок не вышел и рядом (до 520) идёт корабль флота */
function fleetCaravanActive(){
  if(G.mode!=="system"||!G.caravan||G.caravan.until<=G.t)return false;
  const sh=G.ship;let ok=false;
  for(const f of fleetHere(G.sys)){if(f.still)continue;const p=fleetPos(f);if(Math.hypot(sh.x-p.x,sh.y-p.y)<520){ok=true;break;}}
  if(!ok)G.caravan=null;
  return ok;
}

/* ── трассы на карте (§14: линия заработана управляемостью) ──
   Между соседними системами, где ходит флот (станция и рунг ≥ 5), пунктир
   красно-белого цвета флота — по нему можно идти, это и есть трасса. Узловая
   (рунг ≥ 25) — квадратная засечка у звезды. Рисуется поверх связей, под
   звёздами; ничего не хранится. */
let FLEET_MAP_LEGS=0;   /* сколько плеч нарисовано за кадр — читает набор M318 */
function drawFleetMap(vis,cell){
  const on=v=>!!(v.s&&v.s.station&&fleetRung(v.s)>=5);
  const L=vis.filter(on);
  FLEET_MAP_LEGS=0;
  if(!L.length)return;
  ctx.save();ctx.lineWidth=1;
  const seen=new Set();
  /* линия — цепочка, не сетка (§14, альманах III 0.314.0): у каждой станции
     плечо только к двум ближайшим соседям с флотом; иначе кучка из пяти
     станций давала десять пунктиров, и трасса переставала быть направлением */
  for(const a of L){
    const nb=L.filter(b=>b!==a&&Math.hypot(a.x-b.x,a.y-b.y)<=cell*1.6)
      .sort((p,q)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(a.x-q.x,a.y-q.y)).slice(0,2);
    for(const b of nb){
    const key=a.gx<b.gx||(a.gx===b.gx&&a.gy<b.gy)?a.gx+","+a.gy+">"+b.gx+","+b.gy:b.gx+","+b.gy+">"+a.gx+","+a.gy;
    if(seen.has(key))continue;seen.add(key);FLEET_MAP_LEGS++;
    /* тонкая двойная линия с засечками-верстами (M348): трасса — дорога на карте, не пунктир */
    const dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||1,nx=-dy/L*1.3,ny=dx/L*1.3;
    /* закон темноты (M348): за кромкой прыжка трасса не горит в полную силу —
       на постановочном кадре со всеми станциями пятой ступени дальние плечи
       читались ярче ближних дорог; здесь они уходят в треть */
    const k=(a.near||b.near)?1:.35;
    ctx.strokeStyle="rgba(236,232,220,"+(.42*k).toFixed(3)+")";
    ctx.beginPath();ctx.moveTo(a.x+nx,a.y+ny);ctx.lineTo(b.x+nx,b.y+ny);ctx.stroke();
    ctx.beginPath();ctx.moveTo(a.x-nx,a.y-ny);ctx.lineTo(b.x-nx,b.y-ny);ctx.stroke();
    ctx.strokeStyle="rgba(226,120,100,"+(.6*k).toFixed(3)+")";
    for(let t=.25;t<.99;t+=.25){const tx=a.x+dx*t,ty=a.y+dy*t;ctx.beginPath();ctx.moveTo(tx+nx*2.6,ty+ny*2.6);ctx.lineTo(tx-nx*2.6,ty-ny*2.6);ctx.stroke();}
  }}
  for(const v of L){
    if(fleetRung(v.s)<25)continue;
    ctx.strokeStyle="rgba(236,232,220,.7)";ctx.lineWidth=1;
    ctx.strokeRect(v.x+7,v.y-11,6,6);
    ctx.fillStyle="rgba(226,120,100,.9)";ctx.fillRect(v.x+8,v.y-10,4,1.5);
  }
  ctx.restore();
}
