/* ══════════════ экранные кнопки: авто-скрытие и размер ══════════════ */
/* в режиме «авто» клавиатура/мышь гасят пэды сразу, а касание любого пэда
   возвращает их — на компьютере экран остаётся чистым, на телефоне всё как раньше */
const $padsEl=document.querySelector(".pads");
/* переменные ставятся на САМ ряд: `.pads` — их владелец, и его собственное
   объявление перекрывало всё, что писалось в корень (на этом настройка
   «Размер кнопок» молча не работала до 25.08.2026) */
function applyPadSize(){$padsEl.style.setProperty("--padscale",G.opts.padSize);padsFit();}
/* ── ряд подгоняется под экран, а не выпихивает кнопки за кромку ──
   Когда ОГОНЬ и РАКЕТА перестали исчезать (25.08.2026), в ряду стало шесть-семь
   кнопок вместо пяти, и на узком телефоне последняя — ПРЫЖОК — уезжала за
   правый край. Ширина кнопки теперь считается от того, сколько их сейчас
   стоит: базовые 56 px, если помещаются, и до 44 px (правило «палец»), если
   нет. Меньше 44 не бывает: скорее ряд встанет впритык, чем появится кнопка,
   в которую не попасть. */
/* null, а не "": первый же кадр в обычном режиме даёт ключ "", и с пустой
   начальной строкой расчёт не запускался НИ РАЗУ — ряд жил на запасных 56 px
   и на узком телефоне уезжал за кромку */
let PAD_KEY=null;
function padsFit(){
  if(!$padsEl)return;
  const groupEls=[...$padsEl.children];
  const vis=d=>[...d.querySelectorAll("button")].filter(b=>getComputedStyle(b).display!=="none");
  /* ── крестовина в поясе ──
     В поясе живы все восемь кнопок (тангаж, поворот, огонь, тормоз, резак,
     тяга) — в один ряд на телефоне они не встают даже по 44 px. Левая группа
     складывается в квадрат: сверху тангаж, снизу поворот. Большому пальцу так
     даже привычнее — это крестовина, а не строка. */
  const belt=document.body.classList.contains("inbelt")&&innerWidth<=760;
  groupEls[0].classList.toggle("stack",belt);
  const btns=groupEls.flatMap(vis);
  if(!btns.length)return;
  /* ширину ряда задаёт самая широкая колонка каждой группы, а не общее число
     кнопок: сложенная группа занимает вдвое меньше места */
  let units=0,gaps=0;
  for(const d of groupEls){
    const n=vis(d).length;if(!n)continue;
    const cols=d.classList.contains("stack")?Math.ceil(n/2):n;
    const big=vis(d).filter(b=>b.dataset.k==="thrust").length&&!d.classList.contains("stack")?1:0;
    units+=(cols-big)+big*1.25;               /* ПРЫЖОК шире прочих в 1.25 */
    gaps+=cols-1;
  }
  const scale=+(G.opts&&G.opts.padSize||1);
  /* 28 — боковые поля ряда, 16 — минимальный просвет между группами */
  const avail=(innerWidth-28-16)/Math.max(scale,.5);
  let gap=10, w=(avail-gaps*gap)/units;
  if(w<44){gap=6;w=(avail-gaps*gap)/units;}
  w=clamp(w,44,56);
  $padsEl.style.setProperty("--padw",Math.round(w)+"px");
  $padsEl.style.setProperty("--padgap",gap+"px");
}
addEventListener("resize",padsFit);
/* ── на телефоне пэды не гаснут никогда (автор, 25.08.2026) ──
   «Авто» задумано для компьютера: взялся за клавиатуру — экран чистый. Но
   касание холста браузер дублирует совместимым mousemove, поэтому на телефоне
   ЛЮБОЙ тычок в мир гасил весь ряд до .14 — палец жмёт туда, где кнопки уже
   почти нет. На телефоне пэды — единственный способ управлять, гасить их
   нечем и незачем. */
function padsAuto(){return G.opts.pads==="auto"&&!document.body.classList.contains("mobile");}
/* «СКРЫТЬ» — осознанный выбор в настройках, он работает везде; само гаснуть
   на телефоне не должно ничто */
function applyPadMode(){
  if(G.opts.pads==="hide"){$padsEl.classList.add("faded");return;}
  $padsEl.classList.remove("faded");
}
function padsFadeOut(){if(padsAuto())$padsEl.classList.add("faded");}
function padsFadeIn(){if(padsAuto())$padsEl.classList.remove("faded");}
addEventListener("keydown",padsFadeOut,{capture:true});
/* первый же ввод любого рода снимает блокировку автоплея — раньше нельзя */
for(const ev of ["pointerdown","keydown","touchstart"])
  addEventListener(ev,unlockAudio,{capture:true});
addEventListener("mousemove",padsFadeOut);
/* ══════════════ ввод ══════════════ */
document.querySelectorAll("[data-k]").forEach(b=>{
  const k=b.dataset.k;
  const on=e=>{e.preventDefault();keys[k]=true;b.classList.add("on");padsFadeIn();
    if(k!=="act"&&k!=="fire"&&k!=="msl")G.ap=null;};
  const off=e=>{e.preventDefault();keys[k]=false;b.classList.remove("on");};
  b.addEventListener("pointerdown",on);b.addEventListener("pointerup",off);
  b.addEventListener("pointercancel",off);b.addEventListener("pointerleave",off);
  b.addEventListener("contextmenu",e=>e.preventDefault());
});
const KMAP={KeyA:"left",ArrowLeft:"left",KeyD:"right",ArrowRight:"right",KeyW:"thrust",
  ArrowUp:"thrust",KeyS:"brake",ArrowDown:"brake",Space:"act",Enter:"act",KeyF:"fire",
  KeyG:"msl"};
/* в поясе раскладка своя: стрелки — это рули, а не «газ/тормоз» */
const KMAP_BELT={KeyA:"left",ArrowLeft:"left",KeyD:"right",ArrowRight:"right",
  KeyW:"pup",ArrowUp:"pup",KeyS:"pdown",ArrowDown:"pdown",
  KeyQ:"rollL",KeyE:"rollR",
  Space:"thrust",ShiftLeft:"thrust",ShiftRight:"thrust",
  KeyC:"brake",ControlLeft:"brake",
  KeyR:"act",Enter:"act",KeyF:"fire"};
/* переназначенные клавиши (G.opts.keys.main/belt: {действие: код}) накладываются
   поверх дефолтной раскладки — старый код действия снимается, чтобы не залипал дубль */
let _mapDirty=true,_mainMap=null,_beltMap=null;
function invalidateKeyMap(){_mapDirty=true;}
function mergeKeyMap(defaults,overrides){
  const map={};
  for(const code in defaults)map[code]=defaults[code];
  for(const action in overrides){
    const code=overrides[action];
    for(const c in map)if(map[c]===action)delete map[c];
    map[code]=action;
  }
  return map;
}
const keyMap=()=>{
  if(_mapDirty){
    _mainMap=mergeKeyMap(KMAP,G.opts.keys.main);
    _beltMap=mergeKeyMap(KMAP_BELT,G.opts.keys.belt);
    _mapDirty=false;
  }
  return G.mode==="belt"?_beltMap:_mainMap;
};
const ACTION_RU={left:"влево",right:"вправо",thrust:"тяга / вверх",brake:"тормоз",
  act:"действие",fire:"огонь / импульс",msl:"пуск ракеты",launch:"взлёт / эвакуация",
  pup:"тангаж вверх",pdown:"тангаж вниз",rollL:"крен влево",rollR:"крен вправо"};
function keyLabel(code){
  if(!code)return"—";
  if(code==="Space")return"ПРОБЕЛ";
  if(code==="Enter")return"ENTER";
  if(code==="ArrowUp")return"↑";if(code==="ArrowDown")return"↓";
  if(code==="ArrowLeft")return"←";if(code==="ArrowRight")return"→";
  if(code.startsWith("Control"))return"CTRL";
  if(code.startsWith("Shift"))return"SHIFT";
  if(code.startsWith("Key"))return code.slice(3);
  if(code.startsWith("Digit"))return code.slice(5);
  return code;
}
function actionKey(section,action){
  if(_mapDirty)keyMap();
  const m=section==="belt"?_beltMap:_mainMap;
  for(const c in m)if(m[c]===action)return c;
  return null;
}
let rebinding=null;   // {section,action} пока ждём следующую клавишу
addEventListener("keydown",e=>{
  if(rebinding){
    if(e.code!=="Escape"){
      G.opts.keys[rebinding.section][rebinding.action]=e.code;
      invalidateKeyMap();
    }
    rebinding=null;renderOpts();e.preventDefault();return;
  }
  if(e.code==="KeyM"){navAction();e.preventDefault();return;}
  const k=keyMap()[e.code];
  if(k){keys[k]=true;if(k!=="act"&&k!=="fire"&&k!=="msl")G.ap=null;e.preventDefault();}
});
/* отпускаем по обеим раскладкам (дефолт+переопределения), иначе клавиша
   залипнет при смене режима или после ребинда */
addEventListener("keyup",e=>{
  if(rebinding)return;
  keyMap();
  const a=_mainMap[e.code],b=_beltMap[e.code];
  if(a)keys[a]=false;
  if(b)keys[b]=false;
  if(a||b)e.preventDefault();
});
/* ── потеря фокуса отпускает всё ──
   keyup приходит тому окну, которое в фокусе. Стоит переключиться на DevTools,
   другое окно или вкладку с зажатой клавишей — отпускание уходит туда, а у нас
   клавиша остаётся нажатой навсегда. С залипшим тормозом корабль встаёт колом:
   гашение съедает набранное каждый кадр, тяга не успевает победить, и это
   читается как «управление умерло» — при честных шестидесяти кадрах и пустой
   консоли, поэтому по ошибкам такое не ищется. */
let wasBlurred=false;
function releaseAllKeys(){
  for(const k in keys)keys[k]=false;
  document.querySelectorAll("[data-k].on").forEach(b=>b.classList.remove("on"));
}
addEventListener("blur",releaseAllKeys);
addEventListener("pagehide",releaseAllKeys);
document.addEventListener("visibilitychange",()=>{if(document.hidden)releaseAllKeys();});

/* ── ящик бортовых систем ──
   Раньше на правом борту стояло до девяти кнопок по 27 px: половина из них
   нужна раз за полёт, а мажешь по ним всё время. Постоянными остались КАРТА
   и МЕНЮ, остальное — здесь. Любой выбор закрывает ящик: он не панель,
   а список дверей. */
const $menu=document.getElementById("menu");
function toggleMenu(on){
  const open=on===undefined?!$menu.classList.contains("open"):on;
  $menu.classList.toggle("open",open);
  if(open)toggleLog(false);
}
document.getElementById("menubtn").addEventListener("click",()=>toggleMenu());
document.getElementById("menuclose").addEventListener("click",()=>toggleMenu(false));
$menu.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>toggleMenu(false)));
/* тап мимо ящика закрывает его — иначе он оставался висеть поверх полёта */
addEventListener("pointerdown",e=>{
  if($menu.classList.contains("open")&&!$menu.contains(e.target)&&
     e.target.id!=="menubtn")toggleMenu(false);
},true);

/* СТОЛ (M151a) подключён в 27i-ui-table */
/* клавиши на заставке спрятаны за кнопкой: таблица была первым, что видит
   игрок, и первым же, чего он не читает */
(function(){
  const b=document.getElementById("introKeys"),box=document.getElementById("introKeysBox");
  if(b&&box)b.addEventListener("click",()=>{
    const on=box.classList.toggle("open");
    b.textContent=on?"СВЕРНУТЬ":"УПРАВЛЕНИЕ";
  });
})();

document.getElementById("navbtn").addEventListener("click",navAction);
document.getElementById("starbtn").addEventListener("click",()=>{
  if(G.mode!=="system")return;
  G.ap={kind:"star",phase:"fly"};
  say("Автопилот → звезда\n"+G.sys.name,90);
});
function navAction(){
  if(G.mode==="belt"){exitBelt();return;}
  if(G.mode==="scoop"){exitScoop("Уход на орбиту");return;}
  if(G.mode==="base"){if(G.base.menu)G.base.menu=false;else exitBase();return;}
  if(G.mode==="homein"){exitHomeIn();return;}          /* из дома — во двор (M170) */
  if(G.mode==="system"){G.mode="map";G.sel.x=G.sx;G.sel.y=G.sy;}
  else if(G.mode==="map")G.mode="system";
  else say("Навигация недоступна\nвне свободного полёта");
}
document.getElementById("zin").addEventListener("click",()=>setZoom(G.zoom*1.35));
document.getElementById("zout").addEventListener("click",()=>setZoom(G.zoom/1.35));
document.getElementById("dronebtn").addEventListener("click",deployDrone);
document.getElementById("beaconbtn").addEventListener("click",useBeacon);
/* плечо маршрута ставится там же, где выбирается цель прыжка: маршрут — это
   карта, а не пункт меню */
document.getElementById("routebtn").addEventListener("click",()=>{
  if(G.mode!=="map")return;
  say(routeToggle(G.sel.x,G.sel.y));
  sfx("ui",{f:520,to:820,d:.12,v:.28});
});
function setZoom(z){G.zoom=clamp(z,.16,2.4);}
addEventListener("wheel",e=>{if(G.mode==="system")setZoom(G.zoom*(e.deltaY<0?1.12:.89));},{passive:true});

/* указатели: тап, щипок, обзор в поясе */
const ptr=new Map();
let pinch0=0,zoom0=1;
cvs.addEventListener("pointerdown",e=>{
  ptr.set(e.pointerId,{x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY,t0:performance.now(),moved:false});
  if(ptr.size===2){
    const [a,b]=[...ptr.values()];
    pinch0=Math.hypot(a.x-b.x,a.y-b.y)||1;zoom0=G.zoom;
  }
  if(ptr.size===1&&(G.mode==="surface"||G.mode==="dig"||G.mode==="cave"))mouseWalkAt(e.clientX,e.clientY);
});
cvs.addEventListener("pointermove",e=>{
  const p=ptr.get(e.pointerId);if(!p)return;
  const dx=e.clientX-p.x,dy=e.clientY-p.y;
  p.x=e.clientX;p.y=e.clientY;
  if(Math.hypot(e.clientX-p.x0,e.clientY-p.y0)>8)p.moved=true;
  if(ptr.size===2&&(G.mode==="system"||G.mode==="map")){
    const [a,b]=[...ptr.values()];
    const d=Math.hypot(a.x-b.x,a.y-b.y)||1;
    if(G.mode==="system")setZoom(zoom0*d/pinch0);
  }else if(ptr.size===1&&G.mode==="belt"&&G.belt){
    const k=.0036*G.opts.lookSens;
    G.belt.pitch=clamp(G.belt.pitch+(G.opts.invY?dy:-dy)*k,-1.35,1.35);
    G.belt.yaw+=(G.opts.invX?-dx:dx)*k*.92;
  }else if(ptr.size===1&&(G.mode==="surface"||G.mode==="dig"||G.mode==="cave")&&p.moved){
    mouseWalkAt(e.clientX,e.clientY);
  }
});
function endPtr(e){
  const p=ptr.get(e.pointerId);
  if(p&&!p.moved&&performance.now()-p.t0<400)tap(p.x0,p.y0);
  ptr.delete(e.pointerId);
}
cvs.addEventListener("pointerup",endPtr);
cvs.addEventListener("pointercancel",e=>ptr.delete(e.pointerId));
/* клик/протяжка мышью — «тыкнул и идёт», работает вместе с клавишами:
   на поверхности задаёт мировую точку, куда шагает астронавт; в шахте —
   клетку, к которой прокладывается ход (по пути буря непройденное) */
function mouseWalkAt(clientX,clientY){
  const rc=cvs.getBoundingClientRect();
  const sx=(clientX-rc.left)*W/rc.width, sy=(clientY-rc.top)*H/rc.height;
  if(G.mode==="surface"&&G.surf){
    /* камера больше не приклеена к персонажу (инерция, взгляд вперёд, тряска),
       поэтому пересчёт тычка в мир обязан брать ту самую камеру, по которой
       кадр был нарисован — иначе «идти сюда» уводит мимо на десятки единиц.
       drawSurface кладёт её в G.viewX. */
    const camx=(G.viewX!==undefined?G.viewX:G.surf.x-W/2);
    G.surf.walkTarget=camx+sx;
  }else if(G.mode==="dig"&&G.dig){
    const D=G.dig,px=D.col*DIG_CELL,py=D.row*DIG_CELL;
    const camx=px-W/2,camy=py-H*.5;
    D.walkTarget={col:Math.round((sx+camx)/DIG_CELL),row:Math.round((sy+camy)/DIG_CELL)};
  }else if(G.mode==="cave"&&G.cave){
    const camx=G.cave.x-W/2;
    G.cave.walkTarget=camx+sx;
  }
}

function tap(sxp,syp){
  if(G.mode==="map"){
    const cell=Math.min(W,H)/9.2,R=5;
    let best=null,bd=1e9;
    for(let gy=G.sy-R;gy<=G.sy+R;gy++)for(let gx=G.sx-R;gx<=G.sx+R;gx++){
      if(!starAt(gx,gy))continue;
      const[jx,jy]=sysJitter(gx,gy);
      const x=W/2+(gx-G.sx+jx)*cell,y=H/2+(gy-G.sy+jy)*cell;
      const d=Math.hypot(sxp-x,syp-y);
      if(d<bd){bd=d;best={gx,gy};}
    }
    if(best&&bd<cell*.6){G.sel.x=best.gx;G.sel.y=best.gy;}
    return;
  }
  if(G.mode!=="system")return;
  /* ── сперва фишки компаса ──
     Они нарисованы на канве и лежат поверх мира, поэтому и в проверке идут
     первыми: тычок в плашку «ЗВЕЗДА · 3105» — это выбор звезды, а не точки
     пустоты за ней. Тестировщик 26.08.2026: «Метка выглядит как кнопка
     (рамка, стрелка), но не нажимается» — и это был единственный видимый
     объект на экране в первые минуты. */
  if(typeof SYS_CHIPS!=="undefined"){
    for(const ch of SYS_CHIPS){
      if(sxp>=ch.x&&sxp<=ch.x+ch.w&&syp>=ch.y&&syp<=ch.y+ch.h){
        G.ap=Object.assign({},ch.t);G.ap.phase="fly";
        const nm=ch.t.kind==="planet"?ch.t.p.name
              :(ch.t.kind==="station"?(G.sys.station?G.sys.station.name:"станция"):"звезда");
        say("Автопилот → "+nm,90);
        return;
      }
    }
  }
  /* в режиме наблюдения камера стоит на наёмнике — тычок должен считаться от
     неё же, иначе автопилот получал бы цель со смещением на пол-экрана */
  const Z=G.zoom,sh=G.ship,wA=G.watch?allyOf(G.watch):null;
  /* та же камера, по которой нарисован кадр: у неё есть отставание и тряска,
     и без этого автопилот получал цель со смещением */
  const cx0=(G.viewCX!==undefined?G.viewCX:(wA?wA.x:sh.x));
  const cy0=(G.viewCY!==undefined?G.viewCY:(wA?wA.y:sh.y));
  const wx=cx0+(sxp-W/2)/Z, wy=cy0+(syp-H/2)/Z;
  /* ── попадание меряется в пикселях экрана, а не в единицах мира ──
     Было `d < p.radius + 40/Z`: на отдалении сорок единиц мира превращаются в
     считаные пиксели, и по планете, которая на экране размером с горошину,
     попасть нельзя. Тестировщик промахнулся дважды подряд и сделал вывод
     «управление не работает». Порог тот же, что у всех кнопок игры, — 44 px
     под палец: цель считается задетой, если тычок ближе 44 px к её краю. */
  const PICK=44;
  let best=null,bd=1e9;
  const near=(ox,oy,r)=>{
    const d=Math.hypot(wx-ox,wy-oy);
    return (d-r)*Z<PICK ? d : -1;
  };
  for(const p of G.sys.planets){
    const d=near(p.x,p.y,p.radius);
    if(d>=0&&d<bd){bd=d;best={kind:"planet",p};}
    for(const m of p.moons){
      const dm=near(m.x,m.y,m.radius);
      if(dm>=0&&dm<bd){bd=dm;best={kind:"planet",p:m};}
    }
  }
  const S=G.sys.station;
  if(S){
    const d=near(S.x,S.y,50);
    if(d>=0&&d<bd){bd=d;best={kind:"station"};}
  }
  const B=G.sys.belt;
  if(B&&!best){
    const rr=Math.hypot(wx,wy);
    if(Math.abs(rr-B.orbit)<70+30/Z){
      const a=Math.atan2(wy,wx);
      best={kind:"belt",ax:Math.cos(a)*B.orbit,ay:Math.sin(a)*B.orbit};
    }
  }
  if(best){
    G.ap=best;G.ap.phase="fly";
    const nm=best.kind==="planet"?best.p.name:(best.kind==="station"?S.name:B.name);
    say("Автопилот → "+nm,90);
  }
  /* ── промах НЕ отменяет цель ──
     Здесь стояло `else{G.ap=null}`: один мимо-тычок по движущейся планете — и
     игрок терял то, к чему уже летел. Наказание за неточность в игре, где
     цель уезжает сама. Отменить автопилот по-прежнему можно — рукой на тяге
     или тормозе (16-flight), то есть намеренно, а не случайно. */
}

/* версия проставляется из кода, а не руками в разметке — иначе заставка и
   патчноуты рано или поздно разойдутся */
document.getElementById("ver").textContent="ВЕРСИЯ "+VER;
document.getElementById("startEasy").addEventListener("click",()=>start(true));
document.getElementById("startHard").addEventListener("click",()=>start(false));
(function(){
  const b=document.getElementById("startCont");
  /* Кнопка «продолжить» может появиться дважды: сразу — если запись лежит в этом
     браузере, и чуть позже — если облако принесло более свежую с другого устройства.
     Ждать сеть перед показом заставки нельзя: без сети игра обязана открыться сразу. */
  const showCont=()=>{b.style.display="";};
  if(hasSave())showCont();
  cloudBoot(fresh=>{
    if(hasSave())showCont();
    if(fresh)say("Полёт с другого устройства\nзабран из облака");
  });
  {
    b.addEventListener("click",()=>{
      if(loadGame()){
        document.getElementById("intro").style.display="none";
        G.running=true;spawnPirates();spawnAllies();
        say("Полёт восстановлен\n"+G.sys.name+" · сектор "+G.sx+":"+G.sy);
      }else say("Запись повреждена");
    });
  }
})();
function start(easy){
  G.opts.easyLand=easy;
  document.getElementById("intro").style.display="none";
  G.running=true;spawnPirates();spawnAllies();saveGame(true);
  say("Система "+G.sys.name+"\nткните по объекту —\nавтопилот доведёт");
}
