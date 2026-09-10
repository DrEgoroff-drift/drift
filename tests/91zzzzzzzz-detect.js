/* ══════════════ сквозной: каждая сцена × пять жестов под всеми детекторами (M443) ══════════════
   Сценарий здесь самый простой, какой бывает: поставить сцену из общего списка
   (`lookScenes`, 28y-look) и сделать пять жестов — покой, W, A, протяжку и
   колесо с «+». Вся сила — не в сценарии, а в том, что после КАЖДОГО шага
   по нему проходят все детекторы 90b-detect: сбой, застой, закон, картина.
   Новый сценарий (M444) получит их даром — ради этого детекторы и отделены.

   Красное здесь — либо баг игры (чинится в src/, проверкой служит сам
   детектор), либо ложная тревога детектора (чинится в детекторе), либо
   исключение по замыслу — и тогда оно лежит в DET_EXEMPT с именем и причиной.

   Клавиши и события идут тем же путём, что у игрока: `keys` для клавиатуры,
   PointerEvent и WheelEvent на холсте, клик по «+» на борту. Прибирается за
   собой набор дверями игры (hCalm, resetWorld), а не руками по вёрстке. */

const DET_N=14;                 /* кадров на жест: за меньшее корабль не успевает сдвинуться на пиксели */
/* ── молчание по праву: (режим · жест) → причина ──
   Жест, на который режим честно не отвечает ничем, потому что так задумано.
   Колесо не здесь: где масштаба нет, игра сама говорит это своим договором
   `zoomModeHas` (коробки «+ −» нет на борту) — и детектор спрашивает его. */
const DET_MUTE={
  /* карта — лист под рукой: `stepWorld` её не ведёт вовсе (28-loop), клавиш
     полёта у неё нет, двигают её протяжкой и колесом, выход — КАРТА/НАЗАД */
  "map · W":"на карте клавиш полёта нет — лист двигают рукой",
  "map · A":"на карте клавиш полёта нет — лист двигают рукой",
  /* абордаж ведут клавиши и пэды: у холста в рейде нет ни тычка, ни протяжки
     (15-input: tap знает зимовку, санаторий, карту и систему) */
  "raid · протяжка":"абордаж ведут клавиши — холст в рейде рукой не трогают",
  /* борт «Сороки»: коридор ходят ◀ ▶ по шагу за нажатие, берут ДЕЙСТВИЕМ
     (24c-mode-wanderer); газа в коридоре нет, холст не трогают, а сцена
     ставится у левого конца — шаг влево упирается в первую полку */
  "wanderer · W":"в коридоре «Сороки» ходят ◀ ▶ — газа нет",
  "wanderer · A":"сцена стоит у левого конца коридора: шагу влево некуда",
  "wanderer · протяжка":"коридор «Сороки» рукой по холсту не водят — полки выбирают ◀ ▶",
  /* зимовка: «в комнате трогают вещи — рычаг, дневник, трубы, койку» тычком
     (15-input, winTap); клавиш у комнаты нет, протяжка — не тычок */
  "winter · W":"зимовку трогают тычком по вещам — клавиш у комнаты нет",
  "winter · A":"зимовку трогают тычком по вещам — клавиш у комнаты нет",
  "winter · протяжка":"протяжка — не тычок, а вещи зимовки берут тычком",
  /* база: клеть ходит по ярусам W/S, отсеки — A/D (21a-mode-base); сцена
     ставит клеть на верхний ярус, и W там упирается в потолок ствола.
     Холст базы рукой не трогают — у tap() её нет */
  "base · W":"клеть стоит на верхнем ярусе — выше некуда",
  "base · протяжка":"базу ведут клавиши — холст рукой не трогают"
};
/* осадка сцены так, как её делает игра: шаг, рисунок, приборы — каждый кадр.
   `settle` из каркаса рисует без hud(), и первый кадр после приборов честно
   отличался от последнего до них: подписи карты стоят по высоте полосы
   приборов (--hudband), а её меряет hud(). Мигание, которого у игрока нет */
function detSettle(max,floor){
  for(let i=0;i<max;i++){
    G.t++;
    try{stepWorld(1);drawWorld();hud();}catch(e){break;}
    if(i>=floor&&bakeIdle())break;
  }
}
/* кадр большого окна для кегля: 2560×1440 даёт мерку ×1.75 тем же способом,
   что в игре (uiScale), — сама по себе мерка без окна была бы кадром, которого
   в жизни нет (91zzzzzzz-hands, «мерка»). Холст остаётся прежним: судится
   только кегль, пиксели этого кадра никто не читает, и сцену после него
   больше не судят */
function detRuler(S){
  const c={scene:S.id,gesture:"мерка",mode0:G.mode,mode1:G.mode,threw:[]};
  const W0=W,H0=H,U0=UIK;
  W=2560;H=1440;UIK=uiScale(W,H);c.W=W;c.H=H;c.UIK=UIK;
  DET.texts=[];
  try{drawWorld();}catch(e){c.threw.push("drawWorld в большом окне: "+e.message);}
  c.texts=DET.texts;DET.texts=null;
  W=W0;H=H0;UIK=U0;
  return c;
}
/* куда смотрит корабль на экране: та же проекция, что у штурвала (15a-helm) */
function detShipScr(){
  const sh=G.ship,cx=(G.viewCX!==undefined?G.viewCX:sh.x),cy=(G.viewCY!==undefined?G.viewCY:sh.y);
  return [(W/2+(sh.x-cx)*G.zoom)*DPR,(H/2+(sh.y-cy)*G.zoom)*DPR];
}
/* след мира: числа корабля и состояния режима. G.t не входит — он идёт всегда */
function detSig(){
  const sh=G.ship,out=[G.mode,sh.x,sh.y,sh.a,sh.vx,sh.vy,G.zoom,G.mapZoom,JSON.stringify(G.mapView||0)];
  const k=DET_STATE_OF[G.mode],o=k&&G[k];
  if(o)for(const f of Object.keys(o)){const v=o[f];if(typeof v==="number")out.push(f+v.toFixed(2));}
  return out.join("|");
}
/* что открыто поверх мира и чем это закрывается */
function detOverlays(){
  const out=[];
  for(const e of document.querySelectorAll(".scr.open"))out.push({el:e,what:e.id||"экран"});
  for(const e of document.querySelectorAll(".askbox"))out.push({el:e,what:"askbox"});
  const mn=document.getElementById("menu");if(mn&&mn.classList.contains("open"))out.push({el:mn,what:"menu"});
  return out;
}
const DET_CLOSE=/^(ЗАКРЫТЬ|НАЗАД|×|✕|ВЫЙТИ|ВЫХОД|РАЗОЙТИСЬ|ОТСТЫКОВ|ГОТОВО|ОТМЕНА|НЕТ)/i;
function detIsOpen(o){
  if(o.what==="askbox")return document.body.contains(o.el);
  return o.el.classList.contains("open");
}
function detCloseTry(){
  const out=[];
  for(const o of detOverlays()){
    let by="",tried=[];
    const cands=[...o.el.querySelectorAll("button,span,[onclick]")].filter(b=>{
      if(b.disabled)return false;
      const cs=getComputedStyle(b);if(cs.display==="none"||cs.visibility==="hidden")return false;
      if(!b.getClientRects().length)return false;
      const lbl=String(b.textContent||"").replace(/\s+/g," ").trim()||b.getAttribute("aria-label")||"";
      return DET_CLOSE.test(lbl)||/close|back|undock/i.test(b.id||"");
    });
    cands.sort((a,b)=>(b.classList.contains("gold")?1:0)-(a.classList.contains("gold")?1:0));
    for(const b of cands.slice(0,3)){
      tried.push(b.id||String(b.textContent).trim().slice(0,12));
      try{b.click();}catch(e){}
      if(!detIsOpen(o)){by=tried[tried.length-1];break;}
    }
    if(!by&&detIsOpen(o)){
      try{dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",code:"Escape",bubbles:true}));}catch(e){}
      if(!detIsOpen(o))by="Escape";else tried.push("Escape");
    }
    out.push({what:o.what,closed:!!by||!detIsOpen(o),by,tried:tried.join(", ")});
  }
  return out;
}
/* показания и строки приборов, которые видит игрок (DOM) */
function detHudText(){
  const out=[];
  for(const id of ["fnum","hnum","snum","enum","unum","jnum","cnum","purse","place","sub","msg","prompt","mslbtn","wCr","wDt"]){
    const e=document.getElementById(id);if(!e||!e.getClientRects().length)continue;
    const s=String(e.textContent||"").trim();if(s)out.push(s);
  }
  return out;
}
function detCanvases(){
  const out=[];
  for(const k of document.querySelectorAll("canvas")){
    if(k===cvs||k===DET_SM)continue;
    const cs=getComputedStyle(k);if(cs.display==="none"||cs.visibility==="hidden")continue;
    const r=k.getBoundingClientRect();if(r.width<16||r.height<16)continue;
    /* канва за чужим окном или под экраном не видна — её не судим */
    if(r.right<0||r.bottom<0||r.left>innerWidth||r.top>innerHeight)continue;
    out.push({id:k.id||k.className||"canvas",bw:k.width,bh:k.height,cw:r.width,ch:r.height,dpr:window.devicePixelRatio||1});
  }
  return out;
}
/* один кадр так, как его делает игра: мир, рисунок, приборы */
function detFrame(c,texts){
  if(texts){DET.texts=[];DET.astro=[];}
  try{drawWorld();}catch(e){c.threw.push("drawWorld: "+e.message);}
  try{hud();}catch(e){c.threw.push("hud: "+e.message);}
  if(texts){c.texts=DET.texts;c.astro=DET.astro;DET.texts=null;DET.astro=null;}
}
function detTick(c,n){
  for(let i=0;i<n;i++){
    actEdge=false;
    try{stepWorld(1);}catch(e){c.threw.push("stepWorld: "+e.message);break;}
    G.t+=1;
  }
}
/* ── шаг сценария: жест, кадры, наблюдения ── */
const DET_COST={};let DET_INST_N=0;
function detCost(k,t0){DET_COST[k]=(DET_COST[k]||0)+performance.now()-t0;}
function detStep(S,gesture){
  const t0=performance.now();
  const c={scene:S.id,gesture,mode0:G.mode,before:S.frame,churn:S.churn,idleB:S.idleB,UIK,W,H,DPR,threw:[],names:detNames()};
  DET.errs=[];DET.cons=[];DET.on=true;
  const said0=DET.said,crash0=crashN,dom0=hDom();c.dom0=dom0;c.sig0=detSig();
  const g0=JSON.stringify([G.credits,G.fuel,G.zoom,G.mapZoom,G.mapView||0]);
  for(const k in keys)keys[k]=false;
  if(gesture==="покой"){
    detTick(c,1);detFrame(c,true);
    /* показания снимаются с того же кадра, с которого снят текст канвы */
    c.inst=detInstrRead(c.texts);c.hudText=detHudText();
    let t1=performance.now();c.f1=detGrab();
    /* полный кадр — только здесь и один раз: контраст текста */
    try{c.full=cvs.getContext("2d").getImageData(0,0,cvs.width,cvs.height).data;c.fw=cvs.width;c.fh=cvs.height;}catch(e){}
    detCost("глаз",t1);
    detTick(c,1);detFrame(c,false);t1=performance.now();c.f2=detGrab();detCost("глаз",t1);
    detTick(c,DET_N-2);detFrame(c,false);
    t1=performance.now();c.after=detGrab();detCost("глаз",t1);
    c.churn=S.churn=detDiff(c.before,c.after);
    S.idleB=detBlocks(c.before,c.after);
    /* осадки над грунтом: капли — законно новые в каждом кадре */
    try{if(G.surf&&G.surf.p&&typeof weatherOf==="function"&&weatherName(G.surf.p)){const w=weatherOf(G.surf.p);if(w&&w.kind&&w.kind!=="fog")c.precip=w.kind;}}catch(e){}
    c.canv=detCanvases();c.cvsW=cvs.width;
  }else{
    if(G.mode==="system"){c.ship0=detShipScr();c.nose0=G.ship.a;const t1=performance.now();c.p0=detPatch(c.ship0[0],c.ship0[1],gesture==="A"?40:48);detCost("глаз",t1);}
    const rc=cvs.getBoundingClientRect(),kx=cvs.width/Math.max(1,rc.width),ky=cvs.height/Math.max(1,rc.height);
    if(gesture==="W")keys.thrust=true;
    else if(gesture==="A")keys.left=true;
    else if(gesture==="протяжка"){
      const x0=rc.left+rc.width*.5,y0=rc.top+rc.height*.55,DX=160,DY=80;
      const pe=(type,x,y)=>{try{cvs.dispatchEvent(new PointerEvent(type,{pointerId:43,clientX:x,clientY:y,bubbles:true,
        button:0,buttons:type==="pointerup"?0:1,pointerType:"mouse",isPrimary:true}));}catch(e){c.threw.push(type+": "+e.message);}};
      pe("pointerdown",x0,y0);for(let i=1;i<=4;i++)pe("pointermove",x0+DX*i/4,y0+DY*i/4);pe("pointerup",x0+DX,y0+DY);
      c.drag=[DX*kx,DY*ky];
    }else if(gesture==="колесо"){
      c.zc=G.mode==="map"?[cvs.width/2,cvs.height/2]:detShipScr();
      const z=document.getElementById("zin");
      if(z&&z.getClientRects().length&&getComputedStyle(z.closest(".zoom")||z).display!=="none"){try{z.click();}catch(e){c.threw.push("zin: "+e.message);}}
      try{cvs.dispatchEvent(new WheelEvent("wheel",{deltaY:-120,bubbles:true,cancelable:true,clientX:rc.left+rc.width/2,clientY:rc.top+rc.height/2}));}catch(e){c.threw.push("wheel: "+e.message);}
      /* где масштаба нет по договору игры, колесу отвечать нечем */
      if(typeof zoomModeHas==="function"&&!zoomModeHas(c.mode0))c.mute="масштаба в режиме нет (zoomModeHas)";
    }
    detTick(c,DET_N);
    for(const k in keys)keys[k]=false;
    detFrame(c,true);
    const t1=performance.now();
    c.after=detGrab();
    /* W: участок на прежнем месте — видно, куда ушёл корабль; A: на новом —
       видно, как он повернулся */
    if(c.p0){const at=gesture==="A"?detShipScr():c.ship0;c.p1=detPatch(at[0],at[1],gesture==="A"?40:48);}
    detCost("глаз",t1);
    const why=DET_MUTE[c.mode0+" · "+gesture];if(why&&!c.mute)c.mute=why;
  }
  c.mode1=G.mode;c.spoke=DET.said>said0;c.dom1=hDom();c.sig1=detSig();
  c.fieldMoved=JSON.stringify([G.credits,G.fuel,G.zoom,G.mapZoom,G.mapView||0])!==g0||c.sig1!==c.sig0;
  c.crash=crashN-crash0;
  try{c.sick=keyStateOK();}catch(e){c.sick="keyStateOK: "+e.message;}
  if(!c.inst){c.hudText=detHudText();c.inst=detInstrRead(c.texts);}
  DET_INST_N+=c.inst.length;
  c.overlays=detCloseTry();
  let t1=performance.now();
  c.walk=detWalk();c.prevTypes=S.types;S.types=c.walk.types;
  detCost("обход G",t1);
  c.reads=DET.reads;c.writes=DET.writes;DET.reads={};DET.writes={};
  DET.on=false;c.errs=DET.errs;c.cons=DET.cons;
  S.frame=c.after;
  detCost("шаги и кадры",t0);
  return c;
}
/* двери меню: каждая открывается — и закрывается своей кнопкой (ЗАСТОЙ) */
function detDoors(S){
  const c={scene:S.id,gesture:"двери",mode0:G.mode,threw:[],overlays:[]};
  const mb=document.getElementById("menubtn");
  if(!mb||!mb.getClientRects().length)return c;
  DET.errs=[];DET.cons=[];DET.on=true;c.errs=DET.errs;c.cons=DET.cons;
  const crash0=crashN;
  const ids=[...document.querySelectorAll("#menu button")].filter(b=>b.id&&getComputedStyle(b).display!=="none").map(b=>b.id);
  /* само меню — дверь первая */
  try{mb.click();}catch(e){c.threw.push("menubtn: "+e.message);}
  c.overlays.push(...detCloseTry());
  for(const id of ids){
    try{if(typeof toggleMenu==="function")toggleMenu(true);document.getElementById(id).click();}catch(e){c.threw.push(id+": "+e.message);}
    for(const o of detCloseTry())c.overlays.push(Object.assign(o,{what:id+"→"+o.what}));
    if(document.body.classList.contains("road")&&typeof roadClose==="function")
      c.overlays.push({what:id+"→дорога",closed:false,tried:"road"});
    hCalm();
  }
  c.mode1=G.mode;c.crash=crashN-crash0;DET.on=false;
  return c;
}

TEST_SUITES.push(() => suite("сквозной: сцены × пять жестов под детекторами — сбой, застой, закон, картина", () => {
  const T0=performance.now();DET_INST_N=0;
  resetWorld();
  const snap=JSON.parse(JSON.stringify(snapshot()));
  const V=[],run=[],skipped=[],seenV={};let steps=0,scenes=0;const exempted={};
  const judge=c=>{
    for(const D of DETECTORS){
      const t=performance.now();let got=[];
      try{got=D(c);}catch(e){got=[detV(c,"детектор",D.name+" упал: "+e.message)];}
      detCost(D.name,t);
      for(const v of got){
        const why=detExempt(v);if(why){exempted[why]=(exempted[why]||0)+1;continue;}
        const key=v.det+"|"+v.what.replace(/\d+(\.\d+)?/g,"#");
        if(seenV[key]){seenV[key].n++;continue;}
        seenV[key]=v;v.n=1;V.push(v);
      }
    }
    steps++;
  };
  detHook(true);
  /* проверка проверки: ловушка опечаток обязана слышать, иначе закон о полях
     молча зелёный. Имени «детЗонд» в игре нет — его чтение должно лечь в счёт */
  DET.reads={};void G["детЗонд"];
  const heard=!!(DET.reads&&DET.reads["G.детЗонд"]);DET.reads={};
  let doors=0;
  try{
    for(const sc of lookScenes()){
      resetWorld();
      let up=true;try{up=sc.set()!==false;}catch(e){up=false;V.push({det:"сбой",scene:sc.id,gesture:"сцена",what:"сцена не ставится: "+e.message,n:1});}
      if(!up||G.mode==="none"){skipped.push(sc.id);continue;}
      scenes++;
      detHook(true);
      const S={id:sc.id,frame:null,churn:0,types:null};
      detSettle(12,3);
      S.frame=detGrab();
      let rec=null;
      for(const g of ["покой","W","A","протяжка","колесо"]){
        const c=detStep(S,g);
        if(g==="покой")rec={scene:sc.id,mode:c.mode1,astro:c.astro};
        judge(c);
        /* жест увёл из сцены — поставить заново: следующему жесту нужна она же */
        if(G.mode!==c.mode0||detOverlays().length){
          hCalm();resetWorld();
          let back=true;try{back=sc.set()!==false;}catch(e){back=false;}
          if(!back)break;
          detHook(true);
          detSettle(8,2);
          S.frame=detGrab();S.types=null;
        }
        detHook(true);
      }
      if(rec)run.push(rec);
      /* кегль в большом окне — последним: после него сцену больше не судят */
      {const t=performance.now();const r=detRuler(S);detCost("мерка",t);judge(r);}
      if(sc.id==="система"){const d=detDoors(S);doors=d.overlays.length;judge(Object.assign(d,{names:null}));}
    }
    const t=performance.now();
    for(const v of detHuman(run)){const why=detExempt(v);if(why){exempted[why]=(exempted[why]||0)+1;continue;}V.push(Object.assign(v,{n:1}));}
    detCost("detHuman",t);
  }finally{
    detHook(false);DET.on=false;DET.texts=null;DET.astro=null;
    for(const k in keys)keys[k]=false;
    hCalm();
    try{applySave(snap);}catch(e){}
    G.mode="system";G.land=null;G.surf=null;G.dig=null;G.cave=null;G.base=null;G.hin=null;
    resetWorld();
  }
  const cost=Object.keys(DET_COST).map(k=>k+" "+Math.round(DET_COST[k])+" мс").join(" · ");
  for(const k in DET_COST)delete DET_COST[k];
  ok(scenes>=12&&steps>=scenes*5,"сцен "+scenes+", шагов под детекторами "+steps+(skipped.length?" (не встали: "+skipped.join(", ")+")":"")+
    " · "+Math.round(performance.now()-T0)+" мс · цена: "+cost+
    (Object.keys(exempted).length?" · исключено по праву: "+Object.keys(exempted).map(k=>k+" ×"+exempted[k]).join("; "):""));
  eq(Object.getPrototypeOf(G),Object.prototype,"прототип G возвращён: игра после прогона та же, что до");
  ok(heard,"ловушка опечаток слышит: чтение поля, которого нет, легло в счёт");
  ok(DET_INST_N>=40,"приборы сверены с миром: "+DET_INST_N+" показаний");
  ok(doors>=4,"двери меню открыты и закрыты своей кнопкой: "+doors);
  const lines=V.map(v=>v.scene+" · "+v.gesture+" · ["+v.det+"] "+v.what+(v.where?" @"+v.where:"")+(v.n>1?" (×"+v.n+")":""));
  /* весь список — в отчёт страницы: в строке провала помещается дюжина */
  for(const L of lines)TEST.lines.push("    · "+L);
  eq(lines.slice(0,12).join(" ;; "),"","ни один детектор не нашёл нарушения"+(lines.length?" (всего "+lines.length+")":""));
}));
