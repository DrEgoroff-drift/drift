/* ══════════════ штурвал (M360) ══════════════
   Четыре канала вместо двух: курс, вектор тяги, захват, огонь. Их пишут три
   ввода — один плавающий стик на телефоне, мышь и стрелки на клавиатуре — и
   читает один системный режим (D08). Ниже слоя ввода никто не знает, чем
   именно вели корабль. Старые `keys.*` (пэды, пояс, посадка, тесты) здесь же
   переводятся в те же каналы: пояс, посадка, черпак и поверхность не тронуты.

   Угловой инерции нет: нос идёт к заданному курсу со скоростью `st.turn`,
   без разгона и без выбега; крен — только рисунок от фактической скорости
   поворота. Тяга — вектор в осях экрана: вдоль носа полная (маршевый), вбок и
   назад — .4 через маневровые. Отпустил — накат; тормоз — жест (M436, ниже).

   ── один палец (M410) ──
   Автор о двух стиках (07.09.2026): «управление получилось не очень… джойстик
   внизу, пусть управляется левой рукой, не надо правой… куда джойстик
   двигаешь, туда и летит, нос сам потом на цель наводится, на мобилке должно
   легче быть». Стик теперь один и под левым большим пальцем, а правая рука
   свободна для тычков — захват, автопилот, фишки, пэды. И говорит стик не
   «жми туда», а «ЛЕТИ туда»: его вектор — это желаемая скорость в осях экрана
   (направление и доля крейсерской), а тягу, чтобы к ней прийти, физика
   (`helmApply`) считает сама — по носу маршевым, вбок маневровыми, как и у
   мыши. Палец в мёртвой зоне — «стой»: тот самый ТОРМОЗ, которого в ряду
   пэдов системы нет. Нос стик не задаёт: с меткой он идёт за меткой (D07 без
   оговорки о руке на курсе — руки на курсе больше не бывает), без метки —
   туда, куда летим. Мышь и стрелки не тронуты: помощь включается только от
   стика (`G.ctl.assist`), и это не режим устройства, а свойство ввода.

   ── палец где угодно (M422) ──
   Автор 07.09.2026: «управление на мобилке говно… из любого места на экране
   пальцем двигаешь и корабль туда летил… тормозить в другую сторону, коротко
   назад он тормозит… за пальцем идёт широкая полоска, чтобы понимать как оно».
   Замысел M410 был верен, беда была в пяти числах и в одной границе:

   1. Стик рождался только на левой половине — правая рука не дотягивалась.
      Теперь он рождается где угодно, а тычок остаётся тычком: палец становится
      стиком, сдвинувшись на HELM_TAKE или пролежав дольше HELM_TAKE_MS, и это
      ровно за окном тапа в 400 мс (15-input), так что одно не отнимает другое.
   2. Центр стика был прибит к точке касания: провёл 250 px — отматывай 250.
      Центр теперь бежит за пальцем (`helmDrag`), и обратный ход всегда стоит
      восемьдесят пикселей, откуда бы ты ни тянул. Отсюда и «коротко назад» —
      отдельного жеста-рывка не нужно, он выпадает из геометрии.
   3. Тяга против носа шла через маневровые в .4: тормозить, потянув назад,
      было вчетверо дольше (4.1 с), чем просто держать палец на месте (2.3 с) —
      наказание за верную догадку. Теперь торможение идёт одной дорогой с
      мёртвой зоной и с кнопкой ТОРМОЗ — ходом HELM_STOP и мимо носа вовсе:
      полная остановка за 1.4 с при разгоне 1.6 с, откуда бы ни смотрел нос.
   4. Нос шёл за пальцем всегда, и на торможении разворачивался на 180°, а на
      полпути физика перескакивала с маневровых на маршевый. Теперь на
      торможении нос стоит по ходу, гасит тормоз; в остальном нос
      по-прежнему смотрит туда, куда тянут (иначе разворот теряет три пятых
      тяги: боковая идёт в .4), а метка перебивает всё.
   5. Следа не было видно (дуга в .16 альфы). Теперь за пальцем идёт лента:
      её длина и ширина — заданный ход, её заливка — фактический, её цвет —
      разгон или торможение. Лента и есть обучение схеме.
   И ещё две поблажки телефону: камера уводит корабль из-под пальца
   (`helmCamOff`), а отпущенный стик всегда оставляет накат.

   ── одна раскладка (M436) ──
   Автор 09.09.2026: «сломал управление… продумай логику, что на WASD, что на
   QE, мож стрелки нахер не нужны, посмотри как сделаны другие игры». Схем
   было две — мышиная (нос за курсором всегда, WASD по осям экрана) и
   стрелочная (всё от носа), и переключались они САМИ: любой сдвиг мыши над
   холстом во весь экран включал первую, и W переставал значить «вперёд» в ту
   же секунду, когда рука задела мышь; A и D переставали рулить вовсе, потому
   что нос уже держал курсор. Так не делает никто: Endless Sky, Starsector,
   Escape Velocity рулят от носа, а мышь берёт нос по явному жесту. Теперь:
   W — газ, S — тормоз, A/D — руль, Q/E — бок, Shift — всё маневровыми;
   стрелки — те же клавиши под другими шапками, а не вторая схема. Мышь ведёт
   нос только при зажатой ПРАВОЙ кнопке (у Starsector это Shift), и пока она
   зажата, A/D — бок: руль занят курсором. Ракета уходит на G. И отпускание у
   всех вводов одно — накат: правило .55 «ниже крейсерской тормозит само» ушло
   вслед за стиком, тормоз — это жест (S, ТОРМОЗ, палец назад или на месте),
   и у всех он ходом HELM_STOP: игрок учит один корабль, а не три. */
const HELM_THR=.4;           /* маневровые против маршевого */
const HELM_ACC=.082;         /* маршевый разгон за кадр (был литералом в helmApply) */
const HELM_STOP=.095;        /* тормоз стика за кадр: сильнее газа (M422) */
const HELM_BRAKE_DOT=-.5;    /* cos120°: заданный ход против нынешнего — это торможение */
const HELM_TAKE=8;           /* px сдвига, после которых палец становится стиком:
                                ровно порог `moved` в 15-input, иначе между 8 и 10 px
                                палец не тычок и не стик (M422) */
const HELM_TAKE_MS=420;      /* …или столько миллисекунд неподвижно (окно тапа — 400) */
const HELM_NUDGE=70;         /* px, на которые камера уводит корабль от пальца */
const HELM_NUDGE_R=120;      /* ближе этого палец считается «поверх корабля» */
const HELM_DEAD=12;          /* мёртвая зона стика, px */
const HELM_REACH=70;         /* px хода стика до полной тяги */
const HELM_ASSIST_BAND=.35;  /* помощь: дальше этой доли крейсерской от цели — полная тяга (M410) */
const HELM_ASSIST_EPS=.02;   /* ближе этой доли — цель достигнута, тяги нет */
const HELM_PICK=44;          /* px до корпуса, чтобы взять его в захват: правило
                                «палец» интерфейса, а не своё число (M422) */
const HELM_MARKS=3;
/* след стика (M360a): дуга под пальцем вместо кольца в 82 px. Радиус дуги —
   это сила тяги, её угол — направление; весь рисунок умещается в HELM_FOOT от
   точки касания, и это число читают и вёрстка, и тесты. */
const HELM_ARC0=20;          /* радиус кольца «СТОП» в мёртвой зоне, px */
/* след стика — не круг, а капсула от центра к пальцу (M422): `helmStickFoot`
   выкладывает вдоль ленты кружки этого радиуса, и приборы уходят из-под них.
   Кольцо в 93 px, на которое жаловался автор в M360, так не возвращается. */
const HELM_FOOT=34;
/* лента (M422): она идёт от центра стика к пальцу и говорит две вещи разом —
   тело ленты это ЗАДАННЫЙ ход (длина и ширина), заливка внутри это
   ФАКТИЧЕСКИЙ (докуда корабль уже разогнался вдоль него). Голова обрывается
   за HELM_GAP до пальца: под подушечкой всё равно ничего не видно. */
const HELM_BAND=26;          /* ширина ленты у пальца на полном ходе, px */
const HELM_BAND0=10;         /* ширина у центра стика: лента, а не клин */
const HELM_GAP=24;           /* лента не доходит до пальца на столько px */
const HELM_TRAIL=7;          /* сколько следов пальца тянется за ним */
const HELM_CONE=.35;         /* ±20° — временный конус автоогня (M362 заменит) */
const HELM_RANGE=760;
const HELM={src:"keys",     /* кто вёл последним: keys | stick */
  mouse:{x:0,y:0,t:-1e9,on:false,down:false,rmb:false},
  S:null,                    /* живой стик: {id,x0,y0,x,y} — один, где угодно на холсте (M422) */
  P:null,                    /* палец, который ещё не решил: тычок или стик (M422) */
  fade:null,                 /* след отпущенного стика: {x0,y0,x,y,f} */
  home:null,                 /* где стик был в последний раз: точка покоя рисунка (M410) */
  trail:[],                  /* последние положения пальца — хвост ленты (M422) */
  cam:{x:0,y:0,dx:0,dy:1},   /* увод камеры из-под пальца, мировые единицы (M422) */
  key:{},lockEdge:false,lockWas:false,lift:-1};
function ctlReset(){
  G.ctl={head:null,headK:1,turn:0,tx:0,ty:0,brake:false,fire:false,msl:false,
    headIdle:true,thrOnly:false,assist:false,ax:0,ay:0,src:HELM.src,slow:false,vk:0,vp:0,
    out:{main:false,thr:false,rate:0,hold:false,slow:false}};
  return G.ctl;
}
/* ── сырые клавиши штурвала ──
   `keys` через KMAP кладёт и A, и ← в одно `left`; штурвалу важно различать:
   под мышью WASD — оси экрана, под стрелками ← → — руль. Поэтому свой слой. */
const HELM_KEYS=new Set(["KeyW","KeyA","KeyS","KeyD","KeyQ","KeyE","ShiftLeft","ShiftRight",
  "ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Tab","Escape","KeyF","KeyG"]);
addEventListener("keydown",e=>{
  if(!HELM_KEYS.has(e.code))return;
  HELM.key[e.code]=true;
  HELM.src="keys";
  if(G.mode==="system"&&!helmScreenOpen()){
    if(e.code==="Tab"){e.preventDefault();HELM.lockEdge=true;}
    if(e.code==="Escape"&&G.marks&&G.marks.length){G.marks.length=0;e.preventDefault();}
  }
});
addEventListener("keyup",e=>{if(HELM_KEYS.has(e.code))HELM.key[e.code]=false;});
addEventListener("blur",()=>{HELM.key={};HELM.S=null;HELM.P=null;HELM.trail=[];HELM.mouse.down=false;HELM.mouse.rmb=false;});
/* ── мышь над холстом ── */
function helmCanvasXY(e){const rc=cvs.getBoundingClientRect();return [(e.clientX-rc.left)*W/rc.width,(e.clientY-rc.top)*H/rc.height];}
cvs.addEventListener("pointermove",e=>{
  if(e.pointerType==="mouse"){
    const [x,y]=helmCanvasXY(e);
    HELM.mouse.x=x;HELM.mouse.y=y;HELM.mouse.t=performance.now();HELM.mouse.on=true;
    return;
  }
  const s=(HELM.S&&HELM.S.id===e.pointerId)?HELM.S:null;
  if(s){const xy=helmCanvasXY(e);s.x=xy[0];s.y=xy[1];helmDrag(s);helmTrail(s);return;}
  /* палец ещё не решил, кто он: сдвинулся дальше HELM_TAKE — значит стик (M422) */
  const p=(HELM.P&&HELM.P.id===e.pointerId)?HELM.P:null;
  if(p){
    const xy=helmCanvasXY(e);p.x=xy[0];p.y=xy[1];
    if(Math.hypot(p.x-p.x0,p.y-p.y0)>HELM_TAKE)helmTake();
  }
});
/* ── бегущий центр (M422) ──
   Центр стика не прибит к точке касания: уехал палец дальше полного хода —
   центр подтягивается за ним и висит в HELM_DEAD+HELM_REACH позади. Тогда
   обратный ход стоит одинаково, откуда бы ты ни тянул, и «коротко назад»
   тормозит одинаково коротко на любом конце экрана. */
function helmDrag(s){
  const dx=s.x-s.x0,dy=s.y-s.y0,m=Math.hypot(dx,dy),lim=HELM_DEAD+HELM_REACH;
  if(m>lim){const k=(m-lim)/m;s.x0+=dx*k;s.y0+=dy*k;}
}
function helmTrail(s){
  const t=HELM.trail;
  const last=t[t.length-1];
  if(last&&Math.hypot(last.x-s.x,last.y-s.y)<3)return;
  t.push({x:s.x,y:s.y});
  while(t.length>HELM_TRAIL)t.shift();
}
/* палец становится стиком: центр там, где он лёг, а не там, где он сейчас —
   иначе первый же кадр отдал бы полный ход */
function helmTake(){
  const p=HELM.P;
  if(!p||HELM.S)return;
  HELM.S={id:p.id,x0:p.x0,y0:p.y0,x:p.x,y:p.y};
  HELM.home={x:p.x0,y:p.y0};
  HELM.trail=[];
  HELM.P=null;HELM.src="stick";
  helmDrag(HELM.S);
}
cvs.addEventListener("pointerleave",e=>{if(e.pointerType==="mouse"){HELM.mouse.on=false;HELM.mouse.down=false;HELM.mouse.rmb=false;}});
cvs.addEventListener("pointerdown",e=>{
  if(G.mode!=="system")return;
  if(e.pointerType==="mouse"){
    if(e.button===0)HELM.mouse.down=performance.now();
    if(e.button===2)HELM.mouse.rmb=true;
    return;
  }
  /* палец: стик один и рождается ГДЕ УГОДНО на холсте (M422). Пока он не
     сдвинулся и не пролежал своё, это ещё тычок — захват, автопилот, фишки;
     второй палец при живом стике тоже тычок, а при ждущем — щипок, и тогда
     ждущий снимается, иначе зум на телефоне достался бы одному стику */
  const xy=helmCanvasXY(e);
  if(HELM.S||HELM.P){HELM.P=null;return;}
  HELM.P={id:e.pointerId,x0:xy[0],y0:xy[1],x:xy[0],y:xy[1],t0:performance.now()};
});
function helmPtrEnd(e){
  if(e.pointerType==="mouse"){if(e.button===0)HELM.mouse.down=false;if(e.button===2)HELM.mouse.rmb=false;return;}
  if(HELM.P&&HELM.P.id===e.pointerId)HELM.P=null;
  const s=HELM.S;
  if(s&&s.id===e.pointerId){HELM.fade={x0:s.x0,y0:s.y0,x:s.x,y:s.y,f:1};HELM.S=null;HELM.trail=[];}
}
cvs.addEventListener("pointerup",helmPtrEnd);
cvs.addEventListener("pointercancel",helmPtrEnd);
cvs.addEventListener("contextmenu",e=>{if(G.mode==="system")e.preventDefault();});
/* открытый экран над холстом: в Node любой селектор «находит» заглушку, поэтому спрашиваем класс */
function helmScreenOpen(){const el=document.querySelector(".scr.open");return !!(el&&el.classList&&el.classList.contains&&el.classList.contains("open"));}
/* щипок в системе (M410): пока живёт стик, второй палец — тап, а не зум;
   без стика два пальца справа — зум, как на карте */
function helmPinchBlocked(){return G.mode==="system"&&!!HELM.S;}

/* ── захват ── */
function helmTargets(){return (G.pirates||[]).filter(p=>p.hull>0&&!p.iff);}
function helmMarksClean(){
  if(!G.marks)G.marks=[];
  /* помеховая капитана (M368, §5): рядом с ним захват не держится вовсе —
     ни ваш палец, ни автозахват стрелявшего его не вернут, пока не отойти */
  if(G.jamT>0){G.marks.length=0;return;}
  const alive=new Set(G.pirates||[]);
  for(let i=G.marks.length-1;i>=0;i--)if(!alive.has(G.marks[i])||G.marks[i].hull<=0||G.marks[i].iff)G.marks.splice(i,1);
  if(G.marks.length>HELM_MARKS)G.marks.length=HELM_MARKS;
}
function helmLock(p){
  if(G.jamT>0){say("ПОМЕХА · ЗАХВАТА НЕТ",70);return;}
  helmMarksClean();
  const i=G.marks.indexOf(p);
  if(i>=0)G.marks.splice(i,1);
  G.marks.unshift(p);
  if(G.marks.length>HELM_MARKS)G.marks.length=HELM_MARKS;
  sfx("ui",{f:880,to:1180,d:.08,v:.22});
}
/* Tab / ЦЕЛЬ: ближайший знающий о вас враг; повтор — следующий по кругу */
function helmLockNext(){
  /* пока висит оклик, ЦЕЛЬ — это второй ответ, а не захват (M373): брать
     пикет в прицел в этот момент означало бы совсем другой разговор */
  if(G.hail&&typeof hailAnswer==="function"){hailAnswer("busy");return false;}
  /* у обломка ЦЕЛЬ снимает экипаж (M375): целиться там не в кого */
  if(typeof npcCrewOff==="function"&&G.mode==="system"&&npcCrewOff(G.ship))return false;
  /* у чужой вещи ЦЕЛЬ объявляет благодарность (M377) — единственный обратный
     канал во всей игре, и он число */
  if(typeof leftThankNear==="function"&&G.mode==="system"&&leftThankNear())return false;
  if(G.jamT>0){say("ПОМЕХА · ЗАХВАТА НЕТ",70);return false;}
  helmMarksClean();
  const sh=G.ship;
  const list=helmTargets().filter(p=>p.aware).sort((a,b)=>Math.hypot(a.x-sh.x,a.y-sh.y)-Math.hypot(b.x-sh.x,b.y-sh.y));
  if(!list.length){say("ЦЕЛЕЙ НЕТ",60);return false;}
  const cur=G.marks[0],i=list.indexOf(cur);
  helmLock(list[(i+1)%list.length]);
  return true;
}
/* тап/клик по корпусу в 40 px экрана — захват. Возвращает true, если попал */
function helmTap(sxp,syp){
  if(G.mode!=="system")return false;
  const Z=G.zoom,sh=G.ship;
  const cx0=(G.viewCX!==undefined?G.viewCX:sh.x),cy0=(G.viewCY!==undefined?G.viewCY:sh.y);
  let best=null,bd=HELM_PICK;
  for(const p of helmTargets()){
    const x=W/2+(p.x-cx0)*Z,y=H/2+(p.y-cy0)*Z;
    const d=Math.hypot(sxp-x,syp-y);
    if(d<bd){bd=d;best=p;}
  }
  if(!best)return false;
  helmLock(best);return true;
}
/* стрелявший берётся в захват сам, если захвата нет: третьего пальца на телефоне не бывает */
function helmShotAt(p){
  helmMarksClean();
  if(!G.marks.length&&p&&p.hull>0&&!p.iff)G.marks.push(p);
}

/* ── чтение трёх вводов в G.ctl: раз в кадр, до физики ── */
function helmTick(dt){
  const c=G.ctl||ctlReset(),sh=G.ship,K=HELM.key,now=performance.now();
  c.head=null;c.headK=1;c.turn=0;c.tx=0;c.ty=0;c.brake=false;c.thrOnly=false;c.fire=false;c.msl=false;
  c.assist=false;c.ax=0;c.ay=0;c.slow=false;
  let headBusy=false,input=false;
  /* палец, пролежавший дольше окна тапа, — это стик, даже если не сдвинулся:
     так «положил и держу» останавливает корабль без единого движения (M422) */
  if(HELM.P&&now-HELM.P.t0>HELM_TAKE_MS)helmTake();
  helmMarksClean();
  /* ЦЕЛЬ на пэде и Tab — по фронту нажатия */
  const lockPad=!!keys.lock;
  /* зонд у планеты (M400) забирает это нажатие себе — иначе на телефоне один
     тычок звал и зонд, и цели разом, а Tab не звал зонд никогда */
  const lockHit=(lockPad&&!HELM.lockWas)||HELM.lockEdge;
  if(lockHit&&!(typeof probeClaim==="function"&&probeClaim()))helmLockNext();
  HELM.lockWas=lockPad;HELM.lockEdge=false;
  /* 1. стик (M410): один, под левым пальцем. Его вектор — КУДА лететь и
     НАСКОЛЬКО быстро, в осях экрана; тягу до этой скорости подбирает
     helmApply. Курс он не держит: нос идёт за меткой, если она есть, иначе —
     по ходу. Палец в мёртвой зоне — «стой»: тормоз без кнопки тормоза */
  if(HELM.S){
    helmDrag(HELM.S);
    const dx=HELM.S.x-HELM.S.x0,dy=HELM.S.y-HELM.S.y0,m=Math.hypot(dx,dy);
    if(m>HELM_DEAD){
      const k=Math.min(1,(m-HELM_DEAD)/HELM_REACH)/m;
      c.assist=true;c.ax=dx*k;c.ay=dy*k;
      /* ── нос (M422) ──
         Обычно он смотрит туда, куда тянут: маршевый бьёт в ту же сторону, и
         разворот выходит дугой на полной тяге. Но когда заданный ход идёт
         ПРОТИВ нынешнего — это торможение, и разворачивать нос на 180° посреди
         него нельзя: полторы секунды корабль летел бы кормой вперёд, а тяга на
         полпути перескакивала бы с маневровых на маршевый. На торможении нос
         стоит по ходу, гасят ретро-сопла. Метка ниже перебьёт и то и другое. */
      const sp=Math.hypot(sh.vx,sh.vy);
      const dot=sp>1e-4?(c.ax*sh.vx+c.ay*sh.vy)/(Math.hypot(c.ax,c.ay)*sp):1;
      c.slow=dot<HELM_BRAKE_DOT;
      c.head=c.slow?Math.atan2(sh.vy,sh.vx):Math.atan2(dy,dx);
    }else c.brake=true;
    input=true;
  }
  /* 2. клавиатура — одна раскладка, всё от носа (M436): W газ, S тормоз,
     A/D руль, Q/E бок, стрелки — тот же WASD (через KMAP, с переназначением).
     Мышь ведёт нос только при зажатой правой кнопке, и тогда A/D — бок:
     руль занят курсором. Ракета — G, огонь — F или зажатая левая */
  const aim=HELM.mouse.rmb&&HELM.mouse.on&&!helmScreenOpen();
  const turn=(keys.right?1:0)-(keys.left?1:0);
  let side=(K.KeyE?1:0)-(K.KeyQ?1:0);
  if(aim){
    const cx0=(G.viewCX!==undefined?G.viewCX:sh.x),cy0=(G.viewCY!==undefined?G.viewCY:sh.y);
    const sx=W/2+(sh.x-cx0)*G.zoom,sy=H/2+(sh.y-cy0)*G.zoom;
    const dx=HELM.mouse.x-sx,dy=HELM.mouse.y-sy,d=Math.hypot(dx,dy);
    if(d>10){c.head=Math.atan2(dy,dx);c.headK=clamp(d/140,.25,1);}
    headBusy=true;input=true;side+=turn;
  }else if(turn){c.turn=turn;headBusy=true;input=true;}
  const along=keys.thrust?1:0;
  if(along||side){
    const ca=Math.cos(sh.a),sa=Math.sin(sh.a);
    c.tx+=ca*along-sa*side;c.ty+=sa*along+ca*side;input=true;
  }
  if(keys.brake){c.brake=true;input=true;}
  c.thrOnly=!!(K.ShiftLeft||K.ShiftRight);
  if(HELM.mouse.down&&now-HELM.mouse.down>180)c.fire=true;
  if(K.KeyF||keys.fire)c.fire=true;
  if(K.KeyG||keys.msl)c.msl=true;
  const m=Math.hypot(c.tx,c.ty);if(m>1){c.tx/=m;c.ty/=m;}
  /* автопилот и орбита сходят с любого руления */
  if(input){G.ap=null;G.orbit=null;}
  /* D07: нос идёт за меткой, только когда рука с курса снята */
  c.headIdle=!headBusy;
  if(c.headIdle&&G.marks.length){
    const p=G.marks[0];c.head=Math.atan2(p.y-sh.y,p.x-sh.x);c.headK=1;
  }
  c.src=HELM.src;
  helmLift();          /* подсказка над пальцем (M360a) */
  return c;
}
/* ── физика штурвала: курс, тяга, правило отпускания. Вызывается системным
   режимом вместо старого блока рулей; пишет sh.a/vx/vy, топливо и c.out ── */
function helmApply(dt,st,sh,maxSp){
  const c=G.ctl||ctlReset(),o=c.out;
  const RATE=.038*st.turn;
  const a0=sh.a;
  /* курс сворачиваем всегда: за долгий полёт он копится оборотами */
  sh.a=angWrap(sh.a);
  if(c.turn)sh.a=angWrap(sh.a+c.turn*RATE*dt);
  else if(c.head!=null){
    const k=c.headK||1;
    sh.a=angWrap(sh.a+clamp(angDiff(c.head,sh.a),-RATE*k*dt,RATE*k*dt));
  }
  sh.av=angDiff(sh.a,a0)/Math.max(dt,1e-4);
  o.rate=sh.av;
  /* ── помощь (M410) ──
     Стик задаёт скорость, а не тягу: считаем, какой скорости не хватает до
     заданной, и даём тягу ровно в ту сторону — полную, пока разница больше
     трети крейсерской, и никакой, когда скорость набрана. Разложение по носу
     ниже общее с мышью и стрелками: вдоль носа маршевый, вбок маневровые.
     Пока стик в руке, ход ДЕРЖИТСЯ (`o.hold`): ни тормоза по отпусканию, ни
     довода вектора к носу (17-mode-system) — иначе с меткой в стороне нос
     тянул бы скорость к себе, а помощь возвращала бы её обратно, и корабль
     дрожал бы между ними. */
  o.hold=!!c.assist;o.slow=false;
  /* доли для ленты (M422): сколько корабль уже идёт вообще и сколько — вдоль
     заданного. Рисунок не считает физику сам, он читает то, что она посчитала */
  {
    const sp=Math.hypot(sh.vx,sh.vy),am=Math.hypot(c.ax,c.ay);
    c.vk=sp/maxSp;
    c.vp=am>1e-6?(sh.vx*c.ax+sh.vy*c.ay)/(am*maxSp):0;
  }
  if(c.assist){
    const ex=c.ax*maxSp-sh.vx,ey=c.ay*maxSp-sh.vy,em=Math.hypot(ex,ey);
    if(em>maxSp*HELM_ASSIST_EPS){
      const k=Math.min(1,em/(maxSp*HELM_ASSIST_BAND))/em;
      c.tx=ex*k;c.ty=ey*k;
    }else{c.tx=0;c.ty=0;}
  }
  /* тяга: вдоль носа — маршевый, остальное — маневровые */
  const ca=Math.cos(sh.a),sa=Math.sin(sh.a);
  const along=c.tx*ca+c.ty*sa,side=-c.tx*sa+c.ty*ca;
  o.main=false;o.thr=false;
  const mag=Math.hypot(c.tx,c.ty);
  /* маневровые пьют из той же шкалы, что выстрел и щит (M362, §4).
     Пустая — не «нельзя», а вполовину: корабль остаётся управляемым. */
  const eLow=(typeof EN_SHOT==="number")&&(G.energy||0)<EN_SHOT;
  const eK=eLow?.5:1;
  /* ── торможение важнее геометрии (M422) ──
     Когда заданный ход идёт против нынешнего, это не «тяга под углом», это
     ТОРМОЗ, и он не должен зависеть от того, куда сейчас смотрит нос. Раньше
     он зависел: против носа тяга шла маневровыми в .4, и «потянул назад»
     тормозило вчетверо дольше (4.1 с), чем «убрал палец в мёртвую зону»
     (2.3 с) — наказание за единственную верную догадку про телефон. Теперь
     торможение идёт одной дорогой с мёртвой зоной и с кнопкой ТОРМОЗ, ходом
     HELM_STOP: полная остановка за 1.4 с при разгоне 1.6 с. Скорость падает до
     нуля, `slow` снимается сам (стоящий корабль не идёт «против»), и помощь
     разгоняет уже в новую сторону. */
  o.slow=!!(c.assist&&c.slow);
  if(mag>0&&G.fuel>0&&!o.slow){
    let fwd=0,tx=0,ty=0;
    if(c.thrOnly||along<0){tx=c.tx*HELM_THR;ty=c.ty*HELM_THR;o.thr=true;}
    else{
      fwd=along;o.main=fwd>.05;
      tx=-sa*side*HELM_THR;ty=ca*side*HELM_THR;
      if(Math.abs(side)>.05)o.thr=true;
    }
    const side2=Math.hypot(tx,ty)/HELM_THR;
    sh.vx+=(ca*fwd+tx*eK)*HELM_ACC*st.thr*dt;
    sh.vy+=(sa*fwd+ty*eK)*HELM_ACC*st.thr*dt;
    G.fuel=Math.max(0,G.fuel-(.021*Math.abs(fwd)+.017*side2)*dt);
    if(typeof EN_THR==="number"&&side2>0)
      G.energy=Math.max(0,(G.energy||0)-EN_THR*side2*dt);
  }
  /* ── один тормоз на всех (M436) ──
     Отпустил — накат, у любого ввода. Правило .55 «ниже крейсерской тормозит
     само» ушло вслед за стиком (M422): один жест с двумя исходами по порогу
     скорости читался как «корабль иногда тормозит сам». Тормоз — это жест:
     S, ТОРМОЗ, палец назад или в мёртвой зоне, и у всех он ходом HELM_STOP,
     мимо носа и без оглядки на энергию. Игрок учит один корабль. */
  const sp0=Math.hypot(sh.vx,sh.vy);
  if((c.brake||o.slow)&&G.fuel>0){
    if(sp0>.03){
      const dec=Math.min(sp0,HELM_STOP*st.thr*dt);
      sh.vx-=sh.vx/sp0*dec;sh.vy-=sh.vy/sp0*dec;
      G.fuel=Math.max(0,G.fuel-.017*dt);o.thr=true;
    }else{sh.vx=0;sh.vy=0;}
  }
  return o;
}
