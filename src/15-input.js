/* ══════════════ экранные кнопки: авто-скрытие и размер ══════════════ */
/* в режиме «авто» клавиатура/мышь гасят пэды сразу, а касание любого пэда
   возвращает их — на компьютере экран остаётся чистым, на телефоне всё как раньше */
const $padsEl=document.querySelector(".pads");
function applyPadSize(){document.documentElement.style.setProperty("--padscale",G.opts.padSize);}
function applyPadMode(){
  if(G.opts.pads==="hide"){$padsEl.classList.add("faded");return;}
  if(G.opts.pads==="always"){$padsEl.classList.remove("faded");return;}
  $padsEl.classList.remove("faded");
}
function padsFadeOut(){if(G.opts.pads==="auto")$padsEl.classList.add("faded");}
function padsFadeIn(){if(G.opts.pads==="auto")$padsEl.classList.remove("faded");}
addEventListener("keydown",padsFadeOut,{capture:true});
/* первый же ввод любого рода снимает блокировку автоплея — раньше нельзя */
for(const ev of ["pointerdown","keydown","touchstart"])
  addEventListener(ev,unlockAudio,{capture:true});
addEventListener("mousemove",padsFadeOut);
/* ══════════════ ввод ══════════════ */
document.querySelectorAll("[data-k]").forEach(b=>{
  const k=b.dataset.k;
  const on=e=>{e.preventDefault();keys[k]=true;b.classList.add("on");padsFadeIn();
    if(k!=="act"&&k!=="fire")G.ap=null;};
  const off=e=>{e.preventDefault();keys[k]=false;b.classList.remove("on");};
  b.addEventListener("pointerdown",on);b.addEventListener("pointerup",off);
  b.addEventListener("pointercancel",off);b.addEventListener("pointerleave",off);
  b.addEventListener("contextmenu",e=>e.preventDefault());
});
const KMAP={KeyA:"left",ArrowLeft:"left",KeyD:"right",ArrowRight:"right",KeyW:"thrust",
  ArrowUp:"thrust",KeyS:"brake",ArrowDown:"brake",Space:"act",Enter:"act",KeyF:"fire"};
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
  act:"действие",fire:"огонь / импульс",launch:"взлёт / эвакуация",
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
  if(k){keys[k]=true;if(k!=="act"&&k!=="fire")G.ap=null;e.preventDefault();}
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

document.getElementById("logbtn").addEventListener("click",()=>toggleLog());
document.getElementById("logclose").addEventListener("click",()=>toggleLog(false));
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
  if(G.mode==="system"){G.mode="map";G.sel.x=G.sx;G.sel.y=G.sy;}
  else if(G.mode==="map")G.mode="system";
  else say("Навигация недоступна\nвне свободного полёта");
}
document.getElementById("zin").addEventListener("click",()=>setZoom(G.zoom*1.35));
document.getElementById("zout").addEventListener("click",()=>setZoom(G.zoom/1.35));
document.getElementById("dronebtn").addEventListener("click",deployDrone);
document.getElementById("beaconbtn").addEventListener("click",useBeacon);
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
    const camx=G.surf.x-W/2;
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
  /* в режиме наблюдения камера стоит на наёмнике — тычок должен считаться от
     неё же, иначе автопилот получал бы цель со смещением на пол-экрана */
  const Z=G.zoom,sh=G.ship,wA=G.watch?allyOf(G.watch):null;
  const cx0=wA?wA.x:sh.x, cy0=wA?wA.y:sh.y;
  const wx=cx0+(sxp-W/2)/Z, wy=cy0+(syp-H/2)/Z;
  let best=null,bd=1e9;
  for(const p of G.sys.planets){
    const d=Math.hypot(wx-p.x,wy-p.y);
    if(d<p.radius+40/Z&&d<bd){bd=d;best={kind:"planet",p};}
    for(const m of p.moons){
      const dm=Math.hypot(wx-m.x,wy-m.y);
      if(dm<m.radius+26/Z&&dm<bd){bd=dm;best={kind:"planet",p:m};}
    }
  }
  const S=G.sys.station;
  if(S){
    const d=Math.hypot(wx-S.x,wy-S.y);
    if(d<50/Z+30&&d<bd){bd=d;best={kind:"station"};}
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
  }else{G.ap=null;}
}

/* версия проставляется из кода, а не руками в разметке — иначе заставка и
   патчноуты рано или поздно разойдутся */
document.getElementById("ver").textContent="ВЕРСИЯ "+VER;
document.getElementById("startEasy").addEventListener("click",()=>start(true));
document.getElementById("startHard").addEventListener("click",()=>start(false));
(function(){
  const b=document.getElementById("startCont");
  if(hasSave()){
    b.style.display="";
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
