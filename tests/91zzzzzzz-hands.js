/* ══════════════ руки игрока: судья — кадр ══════════════

   Автор, 09.09: «карта не увеличивается… у тебя там тестов на 4 минуты,
   зачем они нужны если все равно такие баги».

   Разбор, почему восемьсот наборов пропустили мёртвый «плюс» на карте, —
   три дыры, и все три структурные, а не «забыли написать набор»:

   1. КНОПКИ ИЩУТСЯ ПО НАДПИСИ. Все обходы (`prSweep`, «тычок в каждую кнопку
      стола и станции») собирают элементы с текстом и сверяют его с глаголом.
      У «+» текста нет вовсе — значок и aria-label. Кнопка без слова не
      попадала ни в один список: её не «плохо проверяли», её не существовало
      для тестов.

   2. СУДИЛИ СОСТОЯНИЕ, А НЕ КАРТИНКУ. `prDelta` сравнивает поля `G`. «Плюс»
      на карте честно менял поле — `G.zoom`, полётный масштаб, которого на
      карте не видно. Проверка вида «мир двинулся» такую кнопку пропускает по
      определению: мир двинулся, игрок этого не увидел.

   3. ПРОВЕРЯЛИ ЭКРАНЫ, А НЕ БОРТ. Всё, что умеет обход, — открыть `.scr` и
      походить по вкладкам. Правый борт (`.rail`) живёт ПОВЕРХ мира, ни в один
      экран не входит и не проверялся никогда — при том что это единственные
      кнопки, которые видны почти всегда.

   Отсюда договор этого файла: **вопрос задаётся кадру**. Кнопка видима и
   нажимаема — значит на тычок обязан ответить экран: измениться картинке,
   прозвучать отказу, открыться окну или смениться режиму. Изменение поля в
   `G` ответом НЕ считается: игрок полей не видит.

   Список сцен — общий с прибором кадра (`lookScenes`, 28y-look): одна таблица
   режимов на прибор, на фуззер и на эти наборы, иначе они разъедутся. */

/* подпись кадра: каждая восьмая проба яркости с настоящего холста */
function hFrame(){
  const cx=cvs.getContext("2d"),w=cvs.width,h=cvs.height;
  const d=cx.getImageData(0,0,w,h).data,out=[];
  for(let y=0;y<h;y+=8)for(let x=0;x<w;x+=8){
    const i=(y*w+x)*4;out.push((d[i]+d[i+1]+d[i+2])/3);
  }
  return out;
}
/* доля проб, которые сдвинулись заметно для глаза */
function hDiff(a,b){
  if(!a||!b||a.length!==b.length)return 1;
  let n=0;for(let i=0;i<a.length;i++)if(Math.abs(a[i]-b[i])>6)n++;
  return n/(a.length||1);
}
function hDraw(){G.t++;stepWorld(1);drawWorld();return hFrame();}
/* ответ вёрстки: окно, меню, строка события — всё, что игрок тоже видит */
function hDom(){
  const m=document.getElementById("msg"),p=document.getElementById("prompt"),mn=document.getElementById("menu");
  return [document.body.className,
          document.querySelectorAll(".scr.open").length,
          document.querySelectorAll(".askbox").length,
          mn?getComputedStyle(mn).display:"",
          m?m.textContent:"",p?p.textContent:""].join("|");
}
/* видимые и нажимаемые кнопки правого борта */
function hRail(){
  const out=[];
  for(const el of document.querySelectorAll(".rail button")){
    if(el.disabled)continue;
    const cs=getComputedStyle(el);
    if(cs.display==="none"||cs.visibility==="hidden"||cs.pointerEvents==="none"||(+cs.opacity||1)<.2)continue;
    const r=el.getBoundingClientRect();if(r.width<8||r.height<8)continue;
    const lbl=String(el.textContent||"").replace(/\s+/g," ").trim()||el.getAttribute("aria-label")||el.id;
    out.push({el,id:el.id||"",lbl});
  }
  return out;
}
/* закрыть всё, что тычок мог открыть — ЕЁ ЖЕ дверью, а не руками по вёрстке.
   Первый заход снимал класс с `body` и гасил `#menu` стилем: игра при этом
   считала меню открытым, следующий тычок в МЕНЮ его ЗАКРЫВАЛ, и набор
   объявлял живую кнопку мёртвой. Прибирать за собой чужими руками — то же
   самое, что мокать: проверяется уже не игра. */
function hCalm(){
  if(typeof toggleMenu==="function")toggleMenu(false);
  for(const e of document.querySelectorAll(".scr.open"))e.classList.remove("open");
  for(const e of document.querySelectorAll(".askbox"))e.remove();
  document.body.classList.remove("screen","table");
}
function hSpoke(fn){return (typeof prSpoke==="function")?prSpoke(fn):(fn(),false);}

/* ── молчаливые по праву: у каждой причина, а не «ну она такая» ── */
const H_SILENT={
  camBtn:"снимок уходит файлом, кадр остаётся прежним"
};

TEST_SUITES.push(() => suite("руки: кнопка над миром отвечает кадром, а не молчанием", () => {
  resetWorld();
  const snap=JSON.parse(JSON.stringify(snapshot()));
  const dead=[],seen={};let tried=0;
  for(const sc of lookScenes()){
    let up=true;try{up=sc.set()!==false;}catch(e){up=false;}
    if(!up)continue;
    let mode0=G.mode;
    try{hud();}catch(e){}
    let prev=hDraw();
    const churn=hDiff(prev,prev=hDraw());          /* сколько мир шевелится сам */
    for(const c of hRail()){
      if(H_SILENT[c.id])continue;
      const dom0=hDom();
      let threw="";
      const spoke=hSpoke(()=>{try{c.el.click();}catch(e){threw=e.message;}});
      if(threw){dead.push(sc.id+" · «"+c.lbl+"» бросила: "+threw);continue;}
      let cur;
      try{cur=hDraw();}catch(e){dead.push(sc.id+" · «"+c.lbl+"» уронила кадр: "+e.message);cur=prev;}
      const d=hDiff(prev,cur);prev=cur;
      tried++;seen[c.id||c.lbl]=1;
      const answered=d>Math.max(churn*2,.004)||spoke||hDom()!==dom0||G.mode!==mode0;
      if(!answered)dead.push(sc.id+" · «"+c.lbl+"» ("+(c.id||"?")+"): кадр не дрогнул ("+
        (d*100).toFixed(1)+"% при собственном шевелении "+(churn*100).toFixed(1)+"%), и никто ничего не сказал");
      if(G.mode!==mode0){                           /* тычок увёл из сцены — вернуть */
        hCalm();
        let back=true;try{back=sc.set()!==false;}catch(e){back=false;}
        if(!back)break;
        mode0=G.mode;try{hud();}catch(e){}
        prev=hDraw();
      }else hCalm();
    }
  }
  try{applySave(snap);}catch(e){}
  G.mode="system";G.land=null;G.surf=null;G.dig=null;G.cave=null;G.base=null;G.hin=null;
  resetWorld();
  ok(tried>=20,"кнопок борта опрошено: "+tried+" штук в "+Object.keys(seen).length+" видах");
  eq(dead.slice(0,6).join(" ;; "),"","на каждый тычок отвечает экран"+(dead.length?" (всего "+dead.length+")":""));
}));

TEST_SUITES.push(() => suite("масштаб: плюс и минус двигают тот масштаб, который сейчас на экране", () => {
  resetWorld();
  /* в системе — камера */
  G.mode="system";const z0=G.zoom;
  document.getElementById("zin").click();
  ok(G.zoom>z0,"в системе плюс приближает камеру: "+z0.toFixed(2)+" → "+G.zoom.toFixed(2));
  /* на карте — ячейка сетки, и только она. Ячейка меряется тем же способом,
     каким её рисует кадр: mapCell() и есть видимый масштаб. */
  G.mode="map";G.mapZoom=1;
  const c0=mapCell(),g0=G.zoom;
  document.getElementById("zin").click();
  ok(mapCell()>c0+.5,"на карте плюс укрупняет сектор: "+c0.toFixed(1)+" → "+mapCell().toFixed(1)+" px");
  eq(G.zoom,g0,"и не крутит за спиной камеру системы");
  const c1=mapCell();
  document.getElementById("zout").click();
  ok(mapCell()<c1-.5,"минус мельчит: "+c1.toFixed(1)+" → "+mapCell().toFixed(1)+" px");
  /* колесо и кнопка ведут в одну сторону: две руки, один смысл */
  G.mapZoom=1;const c2=mapCell();
  cvs.dispatchEvent(new WheelEvent("wheel",{deltaY:-120,bubbles:true,cancelable:true}));
  ok(mapCell()>c2,"колесо вверх — тоже крупнее ("+c2.toFixed(1)+" → "+mapCell().toFixed(1)+" px)");
  /* где масштаба нет — коробки нет на экране. Сам список — договор, и он
     сверяется отдельно от вёрстки: приборы (`hud`) без поставленной сцены
     законно падают на полпути, и тогда борт остаётся от прошлого режима. */
  const MODES=["system","map","surface","cave","dig","belt","base"];
  eq(MODES.filter(zoomModeHas).join(","),"system,map","масштаб есть в системе и на карте, больше нигде");
  const box=document.querySelector(".rail .zoom");
  const shown=[],hidden=[],broke=[];
  for(const m of MODES){
    G.mode=m;
    try{hud();}catch(e){broke.push(m);continue;}          /* сцена не поставлена — не судим */
    (getComputedStyle(box).display==="none"?hidden:shown).push(m);
  }
  eq(shown.join(","),"system,map","коробка «+ −» стоит на борту там, где масштаб есть");
  ok(hidden.length+broke.length===5,"и уходит с экрана там, где его нет: "+
    hidden.join(", ")+(broke.length?" (без сцены не спрошены: "+broke.join(", ")+")":""));
  G.mode="system";resetWorld();
}));

TEST_SUITES.push(() => suite("мерка: подписи карты растут вместе с бортом, и ничто не наезжает", () => {
  /* Сторож «канва против вёрстки» (91f-ui) меряет карту в окне прогона, а там
     `UIK` почти единица — то есть режим увеличенного интерфейса, ради которого
     мерка и заведена, не проверялся ни разу. Именно в нём и жил провал: борт
     рос в полтора раза, подписи карты стояли на месте (M437).

     Мерку нельзя крутить отдельно от кадра: `uiScale` выводит её ИЗ размеров
     окна, и «×1.75 в окне 800» — конфигурация, которой в жизни нет (для ×1.75
     нужно 1330 px высоты). Поэтому подменяется КАДР целиком, а мерка берётся
     из него тем же способом, что в игре. Вёрстка при этом остаётся от
     настоящего окна, поэтому её здесь не судим — это дело 91f-ui на своём
     размере; здесь карта судится по собственной раме. */
  resetWorld();
  for(const e of document.querySelectorAll(".scr.open"))e.classList.remove("open");
  G.running=true;G.mode="map";G.sel={x:G.sx+2,y:G.sy-1};G.mapMore=true;
  const W0=W,H0=H,U0=UIK,box=(nm)=>MAP_BOX.find(b=>b.s===nm);
  const head={},bad=[],off=[],lap=[];
  const hit=(a,b)=>!(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y);
  for(const f of [[1280,800],[1920,1080],[2560,1440]]){
    W=f[0];H=f[1];UIK=uiScale(W,H);
    const tag="кадр "+W+"×"+H+" (мерка ×"+UIK.toFixed(2)+")";
    try{drawMap();}catch(e){bad.push(tag+": "+e.message);continue;}
    const h=box("шапка карты");if(h)head[f[0]]=h.h;
    for(const c of MAP_BOX)if(c.x<-1||c.y<-1||c.x+c.w>W+1||c.y+c.h>H+1)off.push(tag+": "+c.s);
    /* подвал, карточка и роза стоят в одном углу — на крупной мерке они
       первыми лезут друг на друга */
    const F=["подвал слева","карточка системы","роза","шапка карты","линейка Y"].map(box).filter(Boolean);
    for(let i=0;i<F.length;i++)for(let j=i+1;j<F.length;j++)
      if(hit(F[i],F[j]))lap.push(tag+": "+F[i].s+"×"+F[j].s);
  }
  W=W0;H=H0;UIK=U0;
  eq(bad.slice(0,4).join(" ;; "),"","карта рисуется на любом кадре"+(bad.length?" (всего "+bad.length+")":""));
  eq(off.slice(0,4).join(" ;; "),"","и ничего не уехало за край кадра");
  eq(lap.slice(0,4).join(" ;; "),"","её собственные плашки не лезут друг на друга");
  ok(head[1280]>0&&head[2560]>head[1280]*1.4,
    "шапка карты растёт вместе с бортом: ×1 → "+head[1280]+" px, ×1.75 → "+head[2560]+" px");
  G.mode="system";G.mapMore=false;resetWorld();
}));

TEST_SUITES.push(() => suite("разрешение кадра: холст равен окну, а сниженное само возвращается", () => {
  /* Мыло — это не вкус, это число: сколько у холста своих пикселей против
     тех, что показывает экран. Растянутый холст видно по подписям первым. */
  eq(cvs.width,Math.round(W*DPR),"холст шире окна ровно во столько, во сколько плотнее экран");
  eq(cvs.height,Math.round(H*DPR),"и выше — так же");
  const A=RES_AUTO,D=DPR,opt=G.opts.gfx.res,run=G.running,md=G.mode;
  G.opts.gfx.res=0;G.running=true;RES_AUTO=2;
  resEma=16;resBad=0;resGood=0;resUps=0;resMode="";resFresh=0;
  /* 1. три тяжёлые секунды на входе в сцену разрешение не роняют: смена
        режима один раз печёт растр, и это не повод портить весь вечер */
  G.mode="system";resMode="";
  for(let i=0;i<70;i++)resAuto(40);
  eq(RES_AUTO,2,"печь новой сцены не считается просадкой");
  /* 2. а если тяжело и дальше — спускается */
  for(let i=0;i<400;i++)resAuto(40);
  ok(RES_AUTO<2,"на долгом тяжёлом кадре разрешение снижается (стало ×"+RES_AUTO+")");
  const low=RES_AUTO;
  /* 3. и возвращается, когда кадр давно и уверенно лёгкий */
  for(let i=0;i<4000;i++)resAuto(8);
  ok(RES_AUTO>low,"на долгом лёгком кадре возвращается (×"+low+" → ×"+RES_AUTO+")");
  /* 4. но не дребезжит: между порогами (13 и 24 мс) живёт обычный кадр,
        и ровные 18 мс не двигают разрешение ни вверх, ни вниз */
  const st=RES_AUTO;resBad=0;resGood=0;
  for(let i=0;i<3000;i++)resAuto(18);
  eq(RES_AUTO,st,"обычный кадр между порогами не дребезжит");
  RES_AUTO=A;G.opts.gfx.res=opt;G.running=run;G.mode=md;resize();
  eq(DPR,D,"прогон вернул разрешение как было");
}));
