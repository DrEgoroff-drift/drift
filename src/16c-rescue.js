/* ══════════════ пустой бак: хода нет, но выход есть всегда (11.09) ══════════════
   Автор, плейтест 11.09.2026: «топливо кончилось — всё, начинай сначала, если
   станции нет… где кнопка буксир?.. у меня полтора ляма, я должен быть король».
   Буксир и маяк домой в игре были, но буксир жил строкой подсказки, которую
   перебивала любая другая, а маяк — кнопкой на вкладке дома, то есть только на
   станции. Для игрока это был тупик.

   Как решил автор: «ты жмёшь ускорение, а тебе окно. У вас нет ничего, и
   варианты с кнопками. Домой — сумму считать динамически; буксир — реально
   прилетает баржа и ты пять минут летишь до станции; сброс — теряешь корпус,
   тебе выдают Стриж». Так и сделано:
     ДОМОЙ  — сразу, за деньги: цена растёт от прыжков (rescueHomeCost, ниже);
     БУКСИР — даром, но временем: баржа идёт к вам HAUL_COME, тащит HAUL_TIME;
     СБРОС  — корпус, всё, что на нём стоит, и груз потеряны; «Стриж» у станции.
   Правило дрифта: игра берёт плату — деньгами, временем или кораблём, — но
   выхода «начинай сначала» больше нет.

   Против абуза: ДОМОЙ платный и дорожает от каждого прыжка; БУКСИР
   бесплатный, но пять минут без руля и с RESCUE_FUEL в баке — как такси он
   хуже своего хода; СБРОС только отнимает. В меню ДОМОЙ есть в любом полёте
   (маяк раньше был только на станции), буксир и сброс — только на пустом баке. */
const RESCUE_FUEL=40;       /* бак после буксира и прыжка: хватает дойти до причала */
const HAUL_COME=20*60;       /* кадров, пока баржа подходит */
const HAUL_TIME=300*60;      /* кадров буксировки: пять минут, как сказал автор */
const RESCUE_ASK_GAP=90;    /* кадров после закрытия окна, пока газ не открывает его снова */

function rescueEmpty(){
  if(G.tech.has("synth")&&G.cargo.ice>0)return false;   /* синтез изо льда — свой выход */
  return G.mode==="surface"?G.fuel<8:G.fuel<=0;          /* с грунта взлёт стоит 8 */
}
/* куда прыгать «домой»: свой дом, а без него — система старта */
function rescueHomeAt(){
  return (typeof homeCanRevive==="function"&&homeCanRevive())?{sx:G.home.sx,sy:G.home.sy,ru:"к своему дому"}
    :{sx:0,sy:0,ru:"в систему старта"};
}
/* ── цена прыжка растёт от каждого прыжка (автор, 11.09) ──
   «сначала, когда у тебя нихрена нет — о, это абуз, а потом — что за хрень».
   Цена 10·2ⁿ, n — счётчик прыжков: шесть первых почти даром, десятый 5 120,
   восемнадцатый 1,3 млн. Счётчик остывает только от ИГРЫ, не от календаря:
   зашёл раз в неделю — халявы нет. Игроку правило не называется, он видит
   только цену; дрессировка (тоже без слов): прыжок с топливом в баке — это
   такси, +2 вместо +1; честный причал своим ходом в чужой системе и
   терпеливый буксир остужают сверх минут. */
const HOME_JUMP_BASE=10;            /* цена первого прыжка */
const HOME_COOL_MS=45*60000;        /* активной игры на −1 к счётчику */
const HOME_TAXI=2, HOME_EMPTY=1;    /* прибавка за прыжок с топливом и без */
const HOME_DOCK_COOL=.25, HOME_TOW_COOL=.5;
function rescueHomeCost(){
  const n=Math.max(0,G.homeJumps||0);
  return Math.max(HOME_JUMP_BASE,Math.round(HOME_JUMP_BASE*Math.pow(2,n)/10)*10);
}
function homeJumpCount(){G.homeJumps=(G.homeJumps||0)+(G.fuel>0?HOME_TAXI:HOME_EMPTY);}
function homeCool(k){G.homeJumps=Math.max(0,(G.homeJumps||0)-k);}
/* активная минута: вкладка на экране и за последнюю минуту был ввод. Считаем
   реальным временем (wallMs) — игровое стоит на паузе и в фоне */
let rescueInputT=-1e12,rescueBeatT=-1;
function rescueActivityBeat(){
  const t=wallMs();
  if(rescueBeatT<0){rescueBeatT=t;return;}
  const d=Math.min(60000,t-rescueBeatT);rescueBeatT=t;
  if(!G.running||document.hidden||t-rescueInputT>60000)return;
  G.homeActMs=(G.homeActMs||0)+d;
  while(G.homeActMs>=HOME_COOL_MS){G.homeActMs-=HOME_COOL_MS;homeCool(1);}
}
function rescueOffers(){
  const out=[],H=rescueHomeAt();
  const atHome=G.sx===H.sx&&G.sy===H.sy;
  if(!atHome)out.push({id:"home",ru:"ДОМОЙ",cost:rescueHomeCost(),
    sub:"прыжок "+H.ru+" · сразу · в баке будет "+RESCUE_FUEL});
  if(rescueEmpty()){
    const dest=nearestStation(G.sx,G.sy);
    out.push({id:"tow",ru:"БУКСИР",cost:0,
      sub:"баржа придёт и дотащит до станции ("+dest.name+") · около 5 минут без руля"});
    out.push({id:"reset",ru:"СБРОС",cost:0,
      sub:"корабль, всё, что на нём стоит, и груз потеряны · «Стриж» у станции"});
  }
  return out;
}
/* поставить корабль у станции системы (как буксир M331) */
function rescuePark(dest){
  G.sx=dest.sx;G.sy=dest.sy;G.sys=dest;
  G.ship.x=dest.station?dest.station.orbit+120:900;G.ship.y=0;
  G.ship.vx=0;G.ship.vy=0;
  G.mode="system";G.ap=null;G.orbit=null;G.land=null;G.surf=null;G.pirates=[];G.shots=[];
}
function rescueTake(id){
  const o=rescueOffers().find(x=>x.id===id);
  if(!o)return false;
  if(o.cost>G.credits){say("Не хватает\nнужно "+o.cost.toLocaleString("ru")+" кр",120);return false;}
  const from=evacFrom();
  if(id==="home"){
    const H=rescueHomeAt();
    G.credits-=o.cost;homeJumpCount();
    rescuePark(getSystem(H.sx,H.sy));
    G.fuel=Math.max(G.fuel,Math.min(stat().fuelMax,RESCUE_FUEL));
    logAdd("warn","Прыжок домой из "+from+" · −"+o.cost.toLocaleString("ru")+" кр");
    say("Прыжок домой\n−"+o.cost.toLocaleString("ru")+" кр",150);
  }else if(id==="tow"){
    /* с грунта баржа сперва поднимает на орбиту — туда же, куда ставит взлёт */
    if(G.mode==="surface"&&G.surf){
      const p=G.surf.p;
      G.ship.x=p.x+Math.cos(p.ang)*(p.radius+150);G.ship.y=p.y+Math.sin(p.ang)*(p.radius+150);
      G.ship.vx=0;G.ship.vy=0;G.mode="system";G.surf=null;G.land=null;
    }
    haulStart();
  }else if(id==="reset"){
    const was=(shipData(G.shipId)||{}).ru||"корабль";
    if(G.shipId!=="strizh")delete G.owned[G.shipId];
    G.shipId="strizh";G.owned.strizh=true;
    /* уходит то, что НА корабле: поставленные ступени модулей (mods) и части
       (fit). Купленное, но не поставленное (modsOwned сверх mods) остаётся */
    for(const k in G.mods){G.modsOwned[k]=Math.max(0,(G.modsOwned[k]|0)-(G.mods[k]|0));G.mods[k]=0;}
    G.fit={};invalidateParts();
    for(const k of RES_KEYS)G.cargo[k]=0;
    rescuePark(nearestStation(G.sx,G.sy));
    const st0=stat();G.fuel=st0.fuelMax;G.hull=st0.hullMax;
    logAdd("warn","Сброс у "+from+": «"+was+"» потерян с грузом · выдан «Стриж»");
    say("Сброс\n«"+was+"» потерян · вы на «Стриже»",180);
  }
  if(typeof saveGame==="function")saveGame(true);
  return true;
}

/* ── буксир: баржа настоящая, путь настоящий ── */
function haulStart(){
  const sh=G.ship,dest=nearestStation(G.sx,G.sy);
  const a=rnd()*TAU;
  G.haul={ph:"come",t:0,seed:hashi(G.sx*977+G.sy,clockNow()|0,31)>>>0,
    bx:sh.x+Math.cos(a)*1600,by:sh.y+Math.sin(a)*1600,ba:a+Math.PI,
    x0:0,y0:0,dsx:dest.sx,dsy:dest.sy,dname:dest.name};
  G.ap=null;G.orbit=null;G.pirates=[];G.shots=[];
  logAdd("warn","Буксир вызван к "+evacFrom()+" · баржа идёт");
  say("Буксир вызван\nбаржа идёт к вам",150);
}
/* буксир переживает перезагрузку (ревью 11.09): закрыл вкладку на третьей
   минуте — открыл, и баржа тащит дальше. Форма проверяется строго: битый
   объект в сейве не должен заморозить корабль */
function haulRestore(h){
  if(!h||typeof h!=="object"||(h.ph!=="come"&&h.ph!=="haul"))return null;
  const num=k=>isFinite(+h[k]);
  if(!["t","bx","by","ba","x0","y0","dsx","dsy","seed"].every(num))return null;
  return {ph:h.ph,t:+h.t,seed:(+h.seed)>>>0,bx:+h.bx,by:+h.by,ba:+h.ba,x0:+h.x0,y0:+h.y0,
    dsx:h.dsx|0,dsy:h.dsy|0,dname:String(h.dname||"")};
}
function haulLeft(){
  const T=G.haul;if(!T)return 0;
  return Math.ceil(((T.ph==="come"?HAUL_COME-T.t+HAUL_TIME:HAUL_TIME-T.t))/60);
}
/* кадр буксира: true — корабль ведёт баржа, штурвал и физика молчат */
function haulTick(dt,sh){
  const T=G.haul;if(!T)return false;
  T.t+=dt;
  sh.vx=0;sh.vy=0;sh.av=0;
  /* баржа ГЛАВТРАССЫ под охраной: пока тащат, чужие не подходят. Спавн пиратов
     глушится в spawnPirates, а пришедших из других мест (охотник, новость,
     отступник) снимаем здесь — корабль без руля не должен быть мишенью */
  if(G.pirates.length)G.pirates=G.pirates.filter(p=>p.iff);
  if(G.shots.length)G.shots=[];
  if(T.ph==="come"){
    const k=clamp(T.t/HAUL_COME,0,1),e=1-(1-k)*(1-k);
    const tx=sh.x-Math.cos(T.ba)*70,ty=sh.y-Math.sin(T.ba)*70;
    T.bx+=(tx-T.bx)*Math.min(1,e*.08*dt+.002*dt);T.by+=(ty-T.by)*Math.min(1,e*.08*dt+.002*dt);
    T.ba=Math.atan2(sh.y-T.by,sh.x-T.bx);
    if(T.t>=HAUL_COME){T.ph="haul";T.t=0;T.x0=sh.x;T.y0=sh.y;}
  }else{
    /* своя система со станцией — тащит к ней по-настоящему; чужая — уводит
       от звезды к краю, и в конце прыжок, как у любой баржи */
    const same=T.dsx===G.sx&&T.dsy===G.sy&&G.sys.station;
    const S=same?G.sys.station:null;
    const tx=S?S.x+Math.cos(S.ang)*120:T.x0+Math.cos(Math.atan2(T.y0,T.x0))*3000;
    const ty=S?S.y+Math.sin(S.ang)*120:T.y0+Math.sin(Math.atan2(T.y0,T.x0))*3000;
    const k=clamp(T.t/HAUL_TIME,0,1),e=k;   /* ровно: плавный разгон стоял на месте первые полминуты */
    const nx=T.x0+(tx-T.x0)*e,ny=T.y0+(ty-T.y0)*e;
    const hd=Math.atan2(ny-sh.y,nx-sh.x);
    if(Math.hypot(nx-sh.x,ny-sh.y)>.01){T.ba=hd;sh.a=hd;}
    sh.x=nx;sh.y=ny;
    T.bx=sh.x+Math.cos(T.ba)*70;T.by=sh.y+Math.sin(T.ba)*70;
    if(T.t>=HAUL_TIME){
      const dest=getSystem(T.dsx,T.dsy);
      G.haul=null;homeCool(HOME_TOW_COOL);
      if(!same)rescuePark(dest);
      G.fuel=Math.max(G.fuel,Math.min(stat().fuelMax,RESCUE_FUEL));
      logAdd("warn","Буксир дотащил до станции · система "+dest.name);
      say("Буксир дотащил\nстанция рядом · в баке "+Math.floor(G.fuel),180);
      if(typeof saveGame==="function")saveGame(true);
      return true;
    }
  }
  const s=haulLeft();
  G.prompt="БУКСИР · "+(T.ph==="come"?"баржа подходит":"тащит к станции ("+T.dname+")")+
    " · "+Math.floor(s/60)+":"+String(s%60).padStart(2,"0");
  return true;
}
function drawHaul(zx,zy,Z){
  const T=G.haul;if(!T||typeof drawBarge!=="function")return;
  const x=zx(T.bx),y=zy(T.by),sx=zx(G.ship.x),sy=zy(G.ship.y);
  if(T.ph==="haul"){
    ctx.strokeStyle="rgba(210,200,170,.55)";ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(x,y);ctx.stroke();
  }
  ctx.save();ctx.translate(x,y);ctx.rotate(T.ba);
  const s=clamp(Z,.5,1.5)*.8;ctx.scale(s,s);
  drawBarge({seed:T.seed,by:"gt"});
  ctx.restore();
}

/* взлёт с грунта без топлива: отказ называет причину (порог 91zzzzzl) и
   сразу даёт выходы — а не молча зовёт буксир, как было */
function rescueNoLaunch(){
  say("Взлёт не выйдет\nв баке "+Math.max(0,Math.floor(G.fuel))+", а нужно 8",150);
  toggleSos(true);
}
/* ── окно ── газ на пустом баке открывает его; тот же язык, что у меню */
const $sos=document.getElementById("sos");
let rescueShutT=-1e9;
function rescueAsk(){
  if(!$sos||$sos.classList.contains("open")||G.haul)return;
  if(G.mode!=="system"&&G.mode!=="surface")return;
  if(G.t-rescueShutT<RESCUE_ASK_GAP)return;
  toggleSos(true);
}
function rescueRender(){
  const box=document.getElementById("sosList");if(!box)return;
  box.textContent="";
  const empty=rescueEmpty();
  const ttl=document.getElementById("sosTtl");
  if(ttl)ttl.textContent=empty?"ХОДА НЕТ · БАК ПУСТ":"ДОМОЙ";
  const head=document.getElementById("sosHead");
  if(head)head.textContent=(empty?"Топлива ноль. ":"")+"На счету "+
    Math.floor(G.credits).toLocaleString("ru")+" кр · корабль «"+((shipData(G.shipId)||{}).ru||"—")+"»";
  const offers=rescueOffers();
  if(!offers.length){
    const s=document.createElement("div");s.className="sosnone";
    s.textContent="Вы и так дома.";
    box.appendChild(s);return;
  }
  for(const o of offers){
    const b=document.createElement("button");
    const poor=o.cost>G.credits;
    b.disabled=poor;
    b.innerHTML='<span class="tx"><em></em><s></s></span>';
    b.querySelector("em").textContent=o.ru+(o.cost?" · "+o.cost.toLocaleString("ru")+" КР":(o.id==="tow"?" · ДАРОМ":""));
    b.querySelector("s").textContent=poor?"не хватает "+(o.cost-G.credits).toLocaleString("ru")+" кр":o.sub;
    b.dataset.id=o.id;
    if(o.id==="reset")b.className="lose";
    b.addEventListener("click",()=>{
      /* СБРОС отнимает корабль — одним касанием его не отдают (ревью 11.09):
         первый тычок взводит кнопку и говорит, что пропадёт, второй в течение
         четырёх секунд — делает. Телефон промахивается, это мы уже знаем */
      if(o.id==="reset"&&!(b.dataset.armed&&wallMs()-(+b.dataset.armed)<4000)){
        b.dataset.armed=String(wallMs());
        b.querySelector("em").textContent="ТОЧНО? ТКНИТЕ ЕЩЁ РАЗ";
        b.querySelector("s").textContent="«"+((shipData(G.shipId)||{}).ru||"корабль")+"», всё, что на нём стоит, и груз пропадут";
        return;
      }
      if(rescueTake(o.id))toggleSos(false);else rescueRender();
    });
    box.appendChild(b);
  }
}
function toggleSos(on){
  if(!$sos)return;
  const open=on===undefined?!$sos.classList.contains("open"):on;
  if(open){if(typeof toggleMenu==="function")toggleMenu(false);rescueRender();}
  else if($sos.classList.contains("open"))rescueShutT=G.t;
  $sos.classList.toggle("open",open);
  document.body.classList.toggle("sosopen",open);
}
if($sos){
  document.getElementById("sosclose").addEventListener("click",()=>toggleSos(false));
  document.getElementById("callbtn").addEventListener("click",()=>toggleSos(true));
}
addEventListener("pointerdown",()=>{rescueInputT=wallMs();},true);
addEventListener("keydown",e=>{
  rescueInputT=wallMs();
  /* короткий тап газа проходил между кадрами и окна не открывал: газ и тормоз
     на пустом баке открывают его прямо по нажатию */
  if(/^(KeyW|KeyS|ArrowUp|ArrowDown|Space)$/.test(e.code||"")&&(G.mode==="system")&&rescueEmpty())rescueAsk();
},true);
/* такт активности зовёт кадр (28-loop, раз в 600 кадров): у скрытой вкладки rAF
   стоит — и её время не засчитывается само собой */
