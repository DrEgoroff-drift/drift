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
    bx:sh.x+Math.cos(a)*2200,by:sh.y+Math.sin(a)*2200,ba:a+Math.PI,
    x0:0,y0:0,dsx:dest.sx,dsy:dest.sy,dname:dest.name};
  G.ap=null;G.orbit=null;G.pirates=[];G.shots=[];HAUL_FX=[];
  logAdd("warn","Буксир вызван к "+evacFrom()+" · баржа идёт");
  /* тоста нет: подсказка и так говорит «баржа подходит» (дизайн-ревью 11.09) */
  haulSay("вижу вас, идём. стойте где стоите — всё равно больше негде");
}

/* ── сцена буксира (автор 11.09: «выглядит как говно, не большой, нет огня;
   пусть на тросе болтается, что-то отваливается — развлекать пять минут») ──
   Баржа — грузовая махина в три корпуса, у неё горят маршевые. Корабль висит
   на тросе и качается: рывок на старте, затухание, новый толчок, когда от него
   что-то отваливается. Раз в 40–60 с отламывается кусок (обшивка, антенна,
   бочка) — искры, кусок уплывает назад и гаснет; состояние корабля не трогаем,
   это шутка, а не урон. Экипаж переговаривается в эфире. Всё, что не игра, —
   в HAUL_FX и в полях с подчёркиванием, мимо сейва. Размеры — от масштаба
   корабля (shipScaleAt), а не от зума мира: иначе на дальнем отъезде трос
   короче баржи. */
const HAUL_BARGE_K=1.35;              /* баржа против масштаба корабля */
const HAUL_ROPE=95;                   /* трос, px масштаба корабля */
const HAUL_SHIP_HALF=22;              /* от центра корабля до носа, px масштаба */
const HAUL_BIT_GAP=[40*60,60*60];     /* кадров между отвалившимися кусками */
const HAUL_TALK_GAP=[30*60,40*60];    /* кадров между репликами экипажа */
const HAUL_NAMES=["Бурлак","Упрямый","Тягач-7","Старый Ёж","Трудяга"];
const HAUL_TALK=["держись, не дёргай","на тросе не курить","трос новый, не бойся. почти новый",
  "это не мы трясём, это ты болтаешься","бак пустой — голова пустая, говорил мне отец",
  "за буксир денег не берём. за разговоры тоже","видишь станцию? и я не вижу. скоро",
  "руль не трогай, он у тебя сейчас для красоты","у нас тут чай. тебе не передать, извини"];
let HAUL_FX=[];
const haulRim={cv:null};              /* холст-маска кромки: один на сцену, не в G */
/* масштаб корабля в drawSystem — один на двоих с буксиром. На тросе пол .7:
   пять минут игрок смотрит на СВОЙ корабль, а в .35 он был серым пятном в 12 px
   (дизайн-ревью 11.09, закон «себя находят с одного взгляда») */
function shipScaleAt(Z){return clamp(Z,G.haul?.7:.35,1.6);}
function haulBarge(){const T=G.haul;return T._b||(T._b={seed:T.seed,by:"gt"});}
function haulName(){return "буксир «"+HAUL_NAMES[((G.haul?G.haul.seed:0)>>>0)%HAUL_NAMES.length]+"»";}
function haulSay(t){if(typeof etherLine==="function")etherLine(t,haulName());}
/* от центра корабля до центра баржи, px масштаба корабля */
function haulReach(){return HAUL_SHIP_HALF+HAUL_ROPE+bargeArtOf(haulBarge()).L*.48*HAUL_BARGE_K;}
function haulGap(g){return g[0]+rndFx()*(g[1]-g[0]);}
/* планета для облёта: ближняя к отрезку пути и не дальше 2500 от него —
   чтобы крюк был по дороге, а не экспедицией. -1 — лететь прямо */
function haulPickWaypoint(x0,y0,tx,ty){
  const dx=tx-x0,dy=ty-y0,L2=dx*dx+dy*dy||1;let best=-1,bd=2500;
  (G.sys.planets||[]).forEach((p,i)=>{
    const u=clamp(((p.x-x0)*dx+(p.y-y0)*dy)/L2,.15,.85);
    const d=Math.hypot(x0+dx*u-p.x,y0+dy*u-p.y);
    if(d<bd){bd=d;best=i;}
  });
  return best;
}
/* кусок отвалился: косметика, мир не трогаем */
function haulBit(){
  const sh=G.ship,T=G.haul,hd=T.ba,px=-Math.sin(hd),py=Math.cos(hd),side=rndFx()<.5?-1:1;
  const kind=["plate","antenna","barrel"][Math.floor(rndFx()*3)];
  const x=sh.x+px*side*8,y=sh.y+py*side*8;
  HAUL_FX.push({k:kind,x,y,vx:-Math.cos(hd)*(.5+rndFx()*.5)+px*side*(.3+rndFx()*.4),
    vy:-Math.sin(hd)*(.5+rndFx()*.5)+py*side*(.3+rndFx()*.4),a:rndFx()*TAU,va:(rndFx()-.5)*.2,life:1,dec:1/(8*60)});
  for(let i=0;i<14;i++){const a=rndFx()*TAU,v=1+rndFx()*2.5;
    HAUL_FX.push({k:"spark",x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:1,dec:1/(18+rndFx()*20)});}
  T._sv=(T._sv||0)+side*.012;          /* толчок на тросе */
  if(rndFx()<.7)haulSay(["у тебя там что-то отвалилось","ого. это было важное?",
    "не страшно, на станции приварят","считай, облегчились"][Math.floor(rndFx()*4)]);
}
function haulFxTick(dt){
  for(const f of HAUL_FX){f.x+=f.vx*dt;f.y+=f.vy*dt;if(f.va)f.a+=f.va*dt;
    if(f.k==="spark"){f.vx*=.94;f.vy*=.94;}f.life-=f.dec*dt;}
  if(HAUL_FX.length)HAUL_FX=HAUL_FX.filter(f=>f.life>0);
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
  haulFxTick(dt);
  /* камера отъезжает, пока баржа, трос и корабль не влезут в кадр; ниже .35
     корабль уже не мельчает (shipScaleAt), и отъезжать дальше незачем */
  {
    const need=haulReach()+bargeArtOf(haulBarge()).L*.52*HAUL_BARGE_K;
    const fit=Math.max(.7,.46*Math.min(W,H)/need);   /* камера с упреждением (drawSystem): сцене хватает почти всего кадра */
    if(G.zoom>fit)G.zoom=Math.max(fit,G.zoom-(G.zoom-fit)*Math.min(1,.03*dt));
  }
  /* трос — мировая константа (ревью 11.09: от зума баржа ползла, пока едет
     камера). Между полом и 1.6 корабль и баржа рисуются ровно в масштабе мира
     (shipScaleAt=Z), и мировой трос там же постоянен на экране; ниже пола они
     перестают мельчать, и трос вышел бы короче полубаржи — поэтому на время
     буксира ниже пола (.7) не отъезжаем */
  if(G.zoom<.7)G.zoom=.7;   /* пол масштаба корабля на тросе (shipScaleAt) — трос и спрайты в одном масштабе */
  const reachW=haulReach();
  /* своя система со станцией — тащит к ней по-настоящему; чужая — уводит
     от звезды к краю, и в конце прыжок, как у любой баржи */
  const same=T.dsx===G.sx&&T.dsy===G.sy&&G.sys.station;
  const S=same?G.sys.station:null;
  const ox=T.ph==="haul"?T.x0:sh.x,oy=T.ph==="haul"?T.y0:sh.y;
  const tx=S?S.x+Math.cos(S.ang)*120:ox+Math.cos(Math.atan2(oy,ox))*3000;
  const ty=S?S.y+Math.sin(S.ang)*120:oy+Math.sin(Math.atan2(oy,ox))*3000;
  if(T.ph==="come"){
    /* баржа идёт со стороны станции, гасит ход носовыми, разворачивается на
       месте маневровыми и подаёт корму под трос */
    const k=clamp(T.t/HAUL_COME,0,1),hd0=Math.atan2(ty-sh.y,tx-sh.x);
    const ax=sh.x+Math.cos(hd0)*reachW,ay=sh.y+Math.sin(hd0)*reachW;
    T._fire=k<.5?1:0;T._retro=k>=.5&&k<.72;T._turn=k>=.72;
    if(k<.72){
      T.bx+=(ax-T.bx)*Math.min(1,(.003+.03*k*k)*dt);T.by+=(ay-T.by)*Math.min(1,(.003+.03*k*k)*dt);
      T.ba=Math.atan2(sh.y-T.by,sh.x-T.bx);
    }else{
      T.bx=ax;T.by=ay;
      const face=Math.atan2(sh.y-ay,sh.x-ax),q=(k-.72)/.28,e=q*q*(3-2*q);
      T.ba=face+angDiff(hd0,face)*e;
    }
    sh.a=Math.atan2(T.by-sh.y,T.bx-sh.x);
    if(T.t>=HAUL_COME){
      T.ph="haul";T.t=0;T.x0=sh.x;T.y0=sh.y;T._sw=0;T._sv=.02;   /* рывок: трос взяли */
      T._nb=25*60;T._nt=12*60;
      haulSay("трос взяли, пошли. держись");
    }
  }else{
    const k=clamp(T.t/HAUL_TIME,0,1),e=k;   /* ровно: плавный разгон стоял на месте первые полминуты */
    /* путь — ломаная через видимое (дизайн-ревью 11.09: «кадр стоит пять минут»):
       сперва мимо ближней к трассе планеты на 1.3 её радиуса, потом к станции.
       Точка облёта считается от планеты каждый кадр — она на орбите, а путь
       остаётся непрерывным. Выбор планеты — однажды, мимо сейва (_wp) */
    if(T._wp==null)T._wp=haulPickWaypoint(T.x0,T.y0,tx,ty);
    let nx,ny;
    const P=T._wp>=0?G.sys.planets[T._wp]:null;
    if(P){
      const sx0=T.x0,sy0=T.y0,dx=tx-sx0,dy=ty-sy0,L2=dx*dx+dy*dy||1;
      const u=clamp(((P.x-sx0)*dx+(P.y-sy0)*dy)/L2,0,1),qx=sx0+dx*u,qy=sy0+dy*u;
      let ox=qx-P.x,oy=qy-P.y;const ol=Math.hypot(ox,oy)||1;ox/=ol;oy/=ol;
      /* крюк считается от корабля, а баржа впереди на длину троса: без этого
         запаса она ложилась поверх планеты и закрывала её (кадр 2:31) */
      const R=P.radius*1.3+haulReach()*1.2,wx=P.x+ox*R,wy=P.y+oy*R;
      if(e<.5){nx=sx0+(wx-sx0)*e*2;ny=sy0+(wy-sy0)*e*2;}
      else{nx=wx+(tx-wx)*(e-.5)*2;ny=wy+(ty-wy)*(e-.5)*2;}
    }else{nx=T.x0+(tx-T.x0)*e;ny=T.y0+(ty-T.y0)*e;}
    const mv=Math.hypot(nx-sh.x,ny-sh.y);
    const hd=mv>.01?T.ba+angDiff(Math.atan2(ny-sh.y,nx-sh.x),T.ba)*Math.min(1,.04*dt):T.ba;
    T.ba=hd;sh.x=nx;sh.y=ny;
    /* качание на тросе: пружина с затуханием и мелкий ветер */
    T._sw=(T._sw||0)+(T._sv||0)*dt;
    T._sv=(T._sv||0)+(-.0022*T._sw-.012*(T._sv||0))*dt+(rndFx()-.5)*.00035*dt;
    T._sw=clamp(T._sw,-.3,.3);
    sh.a=hd+T._sw;
    T.bx=sh.x+Math.cos(hd+T._sw)*reachW;T.by=sh.y+Math.sin(hd+T._sw)*reachW;
    T._fire=1;T._retro=false;T._turn=false;
    if(T._nb==null)T._nb=haulGap(HAUL_BIT_GAP);
    if(T._nt==null)T._nt=haulGap(HAUL_TALK_GAP);
    T._nb-=dt;if(T._nb<=0){haulBit();T._nb=haulGap(HAUL_BIT_GAP);}
    T._nt-=dt;if(T._nt<=0){
      const m=Math.ceil(haulLeft()/60);
      haulSay(rndFx()<.3&&m>1?"до причала ещё "+m+" "+pl3(m,"минута","минуты","минут"):HAUL_TALK[Math.floor(rndFx()*HAUL_TALK.length)]);
      T._nt=haulGap(HAUL_TALK_GAP);
    }
    if(T.t>=HAUL_TIME){
      haulSay("приехали. отцепляем. бак не забудь");
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
  const b=haulBarge(),art=bargeArtOf(b);
  const sS=shipScaleAt(Z),sB=sS*HAUL_BARGE_K;
  const x=zx(T.bx),y=zy(T.by),sx=zx(G.ship.x),sy=zy(G.ship.y);
  /* отвалившееся и искры — под баржей и тросом */
  for(const f of HAUL_FX){
    const fx=zx(f.x),fy=zy(f.y),a=clamp(f.life,0,1);
    if(f.k==="spark"){
      ctx.fillStyle="rgba(255,"+(170+Math.round(80*a))+",90,"+a.toFixed(2)+")";
      ctx.fillRect(fx-1,fy-1,2,2);continue;
    }
    ctx.save();ctx.translate(fx,fy);ctx.rotate(f.a);ctx.scale(sS,sS);ctx.globalAlpha=a;
    ctx.fillStyle="#6d7480";ctx.strokeStyle="#20242b";ctx.lineWidth=1;
    if(f.k==="plate"){ctx.fillRect(-7,-4,14,8);ctx.strokeRect(-7,-4,14,8);}
    else if(f.k==="antenna"){ctx.strokeStyle="#9aa3ad";ctx.beginPath();ctx.moveTo(-9,0);ctx.lineTo(9,0);ctx.stroke();
      ctx.fillStyle="#ff6b57";ctx.fillRect(8,-1.5,3,3);}
    else{ctx.fillStyle="#b0703a";ctx.fillRect(-4,-6,8,12);ctx.strokeRect(-4,-6,8,12);}
    ctx.restore();ctx.globalAlpha=1;
  }
  /* трос: от носа корабля к корме баржи, с провисом; рывок выбирает провис */
  if(T.ph==="haul"){
    const na=G.ship.a,nx=sx+Math.cos(na)*HAUL_SHIP_HALF*sS,ny=sy+Math.sin(na)*HAUL_SHIP_HALF*sS;
    const bx=x-Math.cos(T.ba)*art.L*.48*sB,by=y-Math.sin(T.ba)*art.L*.48*sB;
    const tens=clamp(Math.abs(T._sv||0)*70,0,1);
    const sag=(1-tens)*(10+3*Math.sin(G.t*.03))*sS;
    const mx=(nx+bx)/2,my=(ny+by)/2,dl=Math.hypot(bx-nx,by-ny)||1;
    const cx=mx-(by-ny)/dl*sag,cy=my+(bx-nx)/dl*sag;
    ctx.strokeStyle="rgba(40,36,30,.9)";ctx.lineWidth=Math.max(1.5,2.6*sS);
    ctx.beginPath();ctx.moveTo(nx,ny);ctx.quadraticCurveTo(cx,cy,bx,by);ctx.stroke();
    ctx.strokeStyle="rgba(214,200,168,.75)";ctx.lineWidth=Math.max(.8,1.2*sS);
    ctx.beginPath();ctx.moveTo(nx,ny);ctx.quadraticCurveTo(cx,cy,bx,by);ctx.stroke();
  }
  ctx.save();ctx.translate(x,y);ctx.rotate(T.ba);ctx.scale(sB,sB);
  /* маршевые: факел из каждого сопла, дышит; на гашении хода и развороте — молчат */
  if(T._fire){
    ctx.globalCompositeOperation="lighter";
    /* на тросе сопла разведены в стороны: факел в корабль на тросе читался
       как «баржа толкает», а центральное сопло и вовсе било по тросу — глушим */
    const haul=T.ph==="haul";
    for(const li of art.lights){
      if(li.c!=="eng")continue;
      if(haul&&Math.abs(li.y)<art.hw*.25)continue;
      const fl=.8+.2*Math.sin(G.t*.5+li.y)+.1*rndFx(),len=(26+li.r*3)*fl*(haul?.8:1),w=li.r*1.1;
      ctx.save();ctx.translate(li.x,li.y);if(haul)ctx.rotate(-Math.sign(li.y)*.5);
      const g=ctx.createLinearGradient(0,0,-len,0);
      g.addColorStop(0,"rgba(255,236,190,.95)");g.addColorStop(.25,"rgba(255,170,90,.7)");
      g.addColorStop(1,"rgba(255,90,40,0)");
      ctx.fillStyle=g;ctx.beginPath();
      ctx.moveTo(-1,-w);ctx.quadraticCurveTo(-len*.45,-w*1.2,-len,0);
      ctx.quadraticCurveTo(-len*.45,w*1.2,-1,w);ctx.closePath();ctx.fill();
      ctx.restore();
    }
    ctx.globalCompositeOperation="source-over";
  }
  drawBarge(b);
  /* свет (дизайн-ревью 11.09, §13 «тело-обвод-один свет»): у источника есть
     освещённое. Звезда кладёт тёплую кромку на свою сторону корпуса, факелы —
     ореол на кормовые плиты. Один объект, считается на кадр */
  {
    /* кромка по самому силуэту: рисунок баржи как маска, тёплый градиент со
       стороны звезды только по корпусу (обводка эллипсом читалась кольцом) */
    const sa=Math.atan2(-T.by,-T.bx)-T.ba,cx=Math.cos(sa),cy=Math.sin(sa);
    const sz=Math.ceil(art.rad*2);
    const off=haulRim.cv||(haulRim.cv=document.createElement("canvas"));
    if(off.width!==sz){off.width=sz;off.height=sz;}
    /* экспозиция (дизайн-ревью 11.09, замер): кромка через «lighter» выжигала
       кремовые модули в 255 — отражённое ярче факела, и корпус 66 рядом с белыми
       ящиками читался двумя предметами. Теперь: тело целиком ×.82 умножением
       (модули уходят с ~220 к ~180), кромка — «screen», он поднимает тёмное
       сильнее светлого (корпус со стороны звезды ~120–130, модули ≤ ~205),
       а ядро факела ниже — белое, самое светлое в кадре */
    const o=off.getContext("2d");
    const mask=fill=>{o.globalCompositeOperation="source-over";o.clearRect(0,0,sz,sz);
      o.drawImage(art.cn,0,0,sz,sz);o.globalCompositeOperation="source-in";o.fillStyle=fill;o.fillRect(0,0,sz,sz);};
    /* второй замер: ×.82 + screen .36 дали серую трубу (медиана 71, p90 116).
       Цель: солнечная сторона — плиты 150–200, корпус 100–140; теневая — 50–70;
       ядро факела ≥250. Тон сжат (×.78), тень глушится ещё градиентом, солнце
       поднимается широким screen — плиты, а не проволока по ребру */
    const draw=()=>ctx.drawImage(off,-art.rad,-art.rad,art.rad*2,art.rad*2);
    const ax=sz/2-cx*sz*.4,ay=sz/2-cy*sz*.4,bx2=sz/2+cx*sz*.4,by2=sz/2+cy*sz*.4;
    mask("rgb(214,212,206)");ctx.globalCompositeOperation="multiply";draw();
    const sg=o.createLinearGradient(ax,ay,bx2,by2);
    sg.addColorStop(0,"rgb(170,170,182)");sg.addColorStop(.5,"rgb(255,255,255)");sg.addColorStop(1,"rgb(255,255,255)");
    mask(sg);draw();
    const rg=o.createLinearGradient(ax,ay,bx2,by2);
    rg.addColorStop(0,"rgba(255,205,150,0)");rg.addColorStop(.34,"rgba(255,205,150,0)");
    rg.addColorStop(1,"rgba(255,208,156,.6)");
    mask(rg);ctx.globalCompositeOperation="screen";draw();
    ctx.globalCompositeOperation="lighter";
    /* бело-горячее ядро у зева каждого сопла — поверх корпуса, иначе его закрывала корма */
    if(T._fire)for(const li of art.lights){
      if(li.c!=="eng"||(T.ph==="haul"&&Math.abs(li.y)<art.hw*.25))continue;
      const cg=ctx.createRadialGradient(li.x-li.r*.5,li.y,0,li.x-li.r*.5,li.y,li.r*.95);
      cg.addColorStop(0,"rgba(255,252,240,1)");cg.addColorStop(.55,"rgba(255,236,200,.85)");cg.addColorStop(1,"rgba(255,200,140,0)");
      ctx.fillStyle=cg;ctx.beginPath();ctx.arc(li.x-li.r*.5,li.y,li.r*.95,0,TAU);ctx.fill();
    }
    if(T._fire){
      const tx=-art.L*.48,gr=ctx.createRadialGradient(tx,0,0,tx,0,art.hw*1.6);
      gr.addColorStop(0,"rgba(255,170,90,.45)");gr.addColorStop(1,"rgba(255,120,60,0)");
      ctx.fillStyle=gr;ctx.beginPath();ctx.arc(tx,0,art.hw*1.6,0,TAU);ctx.fill();
    }
    ctx.globalCompositeOperation="source-over";
  }
  /* носовые (гасят ход) и маневровые (разворот): короткие белые выхлопы */
  if(T._retro||T._turn){
    ctx.globalCompositeOperation="lighter";
    const nose=art.L*.52,hw=art.hw;
    const puff=(px,py,dx,dy)=>{
      const n=.6+.4*rndFx(),g=ctx.createRadialGradient(px,py,0,px+dx*8*n,py+dy*8*n,10*n);
      g.addColorStop(0,"rgba(230,240,255,.85)");g.addColorStop(1,"rgba(200,220,255,0)");
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(px+dx*6*n,py+dy*6*n,10*n,0,TAU);ctx.fill();
    };
    if(T._retro){puff(nose,-hw*.5,1,0);puff(nose,hw*.5,1,0);}
    if(T._turn&&Math.floor(G.t/6)%2===0){puff(nose*.8,-hw,0,-1);puff(-nose*.8,hw,0,1);}
    ctx.globalCompositeOperation="source-over";
  }
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
    /* иерархия (дизайн-ревью 11.09): разумный выход — главная кнопка, как
       ОТСТЫКОВКА на станции; по карману ДОМОЙ — он, иначе буксир. СБРОС отделён */
    const main="tow";   /* всегда буксир: игра подталкивает к бесплатному и остужающему, ДОМОЙ платный и копит счётчик (дизайн-ревью) */
    if(o.id===main)b.className="main";
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
