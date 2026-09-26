/* ══════════════ трепло: жёрдочка ══════════════
   M116 отдал птице память, но не отдал тела: она была строчкой на доске
   отчёта, и «единственная вещь, которая становится лучше, пока лежит», за всю
   игру ни разу не показывалась на глаза. Здесь у неё появляется жёрдочка —
   окно, которое открывается из меню, висит поверх мира, закрывается крестиком
   и никуда не девается: птица не событие, она имущество.

   ПОРОДА. Кобальт с янтарём, кремовая грудь, длинный слоёный хвост и главное —
   хохол из отведённых назад пёрышек, каждое с холодной светящейся бусиной на
   конце. Бусины и есть примета: они живут своей пружиной, отстают от головы на
   полкадра и тихо пульсируют, поэтому птица читается живой даже в покое. Ушей
   у неё нет и не было.

   ПРАВИЛА РИСОВАНИЯ (те же три, что у любой сборки из мелких кусков):

   1. **Тело первым.** Под всеми перьями лежит одна тёмная масса силуэта. Без
      неё полторы сотни перьев дают конфетти, а не птицу.
   2. **Всё навесное — внутрь обвода.** Оперение корпуса кладётся черепицей и
      режется контуром тела: щель между перьями заметнее самого пера, и первая
      версия из-за неё пошла зеброй. Наружу выходят только хохол, крыло и
      хвост — у каждого своя ось, иначе они сливаются в одну метёлку.
   3. **Один свет последним слоем.** `source-atop` + вертикальный градиент по
      всей птице + тёплый ключ сверху и холодный подбой слева от приборов.
      Свечение бусин кладётся ПОСЛЕ света, аддитивно: свет не должен его гасить.

   ЖИВОЕ. Ничего статичного: дыхание, моргание вразнобой, качка на лапах, рябь
   по рядам (у каждого пера своя фаза), хохол на пружине, хвост маятником.
   Взмах — движение всего тела: присед, подскок, осадка.

   ТЫКАНИЕ. Пять зон, и на каждую свой ответ, потому что «реакция на клик» без
   разницы, куда кликнули, — это кнопка, а не животное. И говорит птица только
   то, что слышала (12x): непонятое — глифами. Выдумывать ей нельзя. */

/* ── палитра ──
   Кобальт спины, кремовая грудь, янтарь на плече и в хохле, холодный бирюзовый
   огонь бусин — он же единственное место, где птица совпадает с приборами. */
const PAR_C={
  body:"#101a2e",        /* масса под всем */
  blue:"#2f6fd6", blueD:"#17417f", blueL:"#7cbdf5",
  cream:"#fdf7e9", creamD:"#ddcbab",
  amber:"#f2a03c", amberD:"#bc6a1c",
  viol:"#7a5ad2",
  beak:"#f7cd94", beakD:"#c8853f",
  foot:"#b4763f", footD:"#6f431f",
  glow:"#6ff0ff",
  eye:"#120b16"
};
let parWin=false,parT0=0;
/* состояние живёт между кадрами: пружины, а не «текущий кадр анимации» */
const PAR={t:0,flap:0,flapV:0,crest:0,crestV:0,ruff:0,ruffV:0,lean:0,leanV:0,
  hop:0,hopV:0,blink:0,blinkAt:2,say:"",sayT:-9,peck:0,look:0,mad:0,beak:0,
  preen:0,preenT:-9,
  /* степени свободы, которыми распоряжается повадка (12z): пока она идёт,
     значения выставляются каждый кадр, а без неё сами оседают в ноль */
  roll:0,tuck:0,step:0,turn:0,stretch:0,footUp:0,scratch:0,fan:0,yawn:0,shiver:0,
  bow:0,hang:0,act:null,actT:0,actDur:0,actNext:1.5,st:null};

/* ── перо ──
   Один примитив на всё: остроконечный лист с рёбрышком и лёгким загибом.
   Кончик и основание разного цвета — иначе ряд читается штриховкой. */
function parQuill(c,len,wid,curl,cTip,cBase){
  const g=c.createLinearGradient(0,0,len,0);
  g.addColorStop(0,cBase);g.addColorStop(.6,cTip);g.addColorStop(1,cTip);
  c.fillStyle=g;
  c.beginPath();c.moveTo(0,0);
  c.quadraticCurveTo(len*.45,-wid,len,-wid*.14+curl*len*.14);
  c.quadraticCurveTo(len*.5,wid*.12+curl*len*.12,0,wid*.36);
  c.closePath();c.fill();
  c.strokeStyle="rgba(10,20,40,.26)";c.lineWidth=Math.max(.6,wid*.08);
  c.beginPath();c.moveTo(len*.06,wid*.1);
  c.quadraticCurveTo(len*.5,-wid*.26,len*.94,-wid*.08+curl*len*.13);
  c.stroke();
}
/* ── перо хохла ── длинное, гнутое, с тонким стеблем и бусиной на конце.
   Рисуется как дуга: стебель — кривая, опушка — вдоль неё. */
function parPlume(c,len,ang,bend,wid,c1,c2,fr,fw){
  const x1=Math.cos(ang)*len, y1=Math.sin(ang)*len;
  const cx=Math.cos(ang-bend)*len*.55, cy=Math.sin(ang-bend)*len*.55;
  /* опахало строится по стеблю: перпендикулярное смещение с профилем ширины
     (у корня и у острия — ноль, посередине — полная). Версия «стебель плюс
     поперечные мазки» читалась рыбьим скелетом: у пера должно быть тело, а
     не расчёска. */
  const N=14, W=fw===undefined?1:fw;
  const A=[],B=[];
  for(let i=0;i<=N;i++){
    const t=i/N;
    const px=2*(1-t)*t*cx+t*t*x1, py=2*(1-t)*t*cy+t*t*y1;
    const dx=2*(1-t)*cx+2*t*(x1-cx), dy=2*(1-t)*cy+2*t*(y1-cy);
    const L=Math.hypot(dx,dy)||1, nx=-dy/L, ny=dx/L;
    const w=Math.sin(Math.pow(t,.62)*Math.PI)*wid*W;
    A.push([px+nx*w,py+ny*w]);B.push([px-nx*w*.6,py-ny*w*.6]);
  }
  c.beginPath();c.moveTo(A[0][0],A[0][1]);
  for(const p of A)c.lineTo(p[0],p[1]);
  for(let i=B.length-1;i>=0;i--)c.lineTo(B[i][0],B[i][1]);
  c.closePath();
  const g=c.createLinearGradient(0,0,x1,y1);
  g.addColorStop(0,c2);g.addColorStop(.55,c1);g.addColorStop(1,c1);
  c.fillStyle=g;c.fill();
  /* рахис — волосок по стеблю, он же собирает опахало в одно перо */
  c.strokeStyle="rgba(10,20,40,.26)";c.lineWidth=Math.max(.7,wid*.17);
  c.lineCap="round";
  c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(cx,cy,x1,y1);c.stroke();
  return [x1,y1];
}
/* ── чешуйка ── округлая пластинка оперения груди: мягкий верх, тень снизу */
function parScale(c,x,y,w,h,c1,c2){
  /* Пластинка почти не отличается по цвету от соседней: перо на груди видно
     не краской, а мягкой тенью под нижней кромкой. Контурная версия читалась
     булыжной мостовой — обводка и сильный градиент делают из пера камень. */
  c.save();
  c.beginPath();
  c.moveTo(x-w*.5,y-h*.35);
  c.quadraticCurveTo(x-w*.5,y+h*.5,x,y+h*.5);
  c.quadraticCurveTo(x+w*.5,y+h*.5,x+w*.5,y-h*.35);
  c.quadraticCurveTo(x,y-h*.62,x-w*.5,y-h*.35);
  c.closePath();
  const g=c.createLinearGradient(x,y-h*.6,x,y+h*.5);
  g.addColorStop(0,c1);g.addColorStop(.62,c1);g.addColorStop(1,c2);
  c.fillStyle=g;c.fill();
  /* тень ложится только по нижней дуге и только внутрь пластинки */
  c.clip();
  c.strokeStyle="rgba(96,76,48,.26)";c.lineWidth=2.4;
  c.beginPath();
  c.moveTo(x-w*.52,y+h*.06);
  c.quadraticCurveTo(x,y+h*.62,x+w*.52,y+h*.06);
  c.stroke();
  c.restore();
}
/* ── тело одной массой ──
   Вытянутая вертикальная фигура: птица должна быть явно выше, чем шире, иначе
   читается кляксой без направления. Первая версия была шаром — и была шаром. */
function parBodyPath(c){
  c.beginPath();
  c.moveTo(-8,-30);                                 /* низ: широкое брюхо над лапами, бедро внутри */
  c.bezierCurveTo(-28,-32,-36,-70,-35,-106);        /* спина от хвоста */
  c.bezierCurveTo(-36,-142,-18,-168,4,-175);        /* к затылку */
  c.bezierCurveTo(22,-180,37,-168,37,-150);         /* шея спереди */
  c.bezierCurveTo(37,-130,30,-118,29,-102);         /* горло */
  c.bezierCurveTo(28,-80,32,-48,18,-33);           /* брюхо */
  c.bezierCurveTo(10,-28,0,-28,-8,-30);
  c.closePath();
}
/* ── пружины ──
   Всё движение — затухающие пружины к нулю: реакция на тычок сама переходит
   в покой и никогда не застревает «на кадре». */
function parSpring(v,vel,k,d,dt){
  vel+=-v*k*dt; vel*=Math.pow(d,dt*60); v+=vel*dt;
  return [v,vel];
}
function parStep(dt){
  PAR.t+=dt;
  [PAR.flap,PAR.flapV]=parSpring(PAR.flap,PAR.flapV,150,.86,dt);
  [PAR.crest,PAR.crestV]=parSpring(PAR.crest,PAR.crestV,60,.90,dt);
  [PAR.ruff,PAR.ruffV]=parSpring(PAR.ruff,PAR.ruffV,90,.87,dt);
  [PAR.lean,PAR.leanV]=parSpring(PAR.lean,PAR.leanV,70,.88,dt);
  [PAR.hop,PAR.hopV]=parSpring(PAR.hop,PAR.hopV,110,.87,dt);
  PAR.peck*=Math.pow(.85,dt*60);
  /* чистка перьев: заход на пару секунд, вход и выход по косинусу, и никогда
     во время взмаха — птица не делает два дела разом */
  if(PAR.preenT>0){
    const p=(PAR.t-PAR.preenT)/2.2;
    PAR.preen=p>=1?(PAR.preenT=-9,0):(1-Math.cos(p*6.283))*.5;
  }else if(rndFx()<dt*.06&&PAR.flap<.05){PAR.preenT=PAR.t;}
  PAR.beak*=Math.pow(.90,dt*60);
  PAR.look*=Math.pow(.985,dt*60);
  /* злость держится секунд восемь, а не одну: птицу задели — она успевает
     рассердиться хотя бы на одну повадку. При прежнем затухании взвинченный
     набор не выпадал ни разу за час наблюдения */
  PAR.mad*=Math.pow(.9975,dt*60);
  /* подскок идёт от крыла: птица машет всем телом, а не одним крылом */
  if(PAR.flapV>0)PAR.hopV+=PAR.flapV*.10*dt*60;
  if(PAR.blink>0)PAR.blink=Math.max(0,PAR.blink-dt*7);
  if(PAR.t>PAR.blinkAt){PAR.blink=1;PAR.blinkAt=PAR.t+1.6+rndFx()*4.2;}

  /* мелкая рябь: она идёт ВСЕГДА, поверх любой повадки, и это разные вещи.
     Повадка — то, что птица делает; рябь — то, что с ней происходит. */
  if(rndFx()<dt*.14){PAR.ruffV+=(rndFx()-.5)*5;}
  if(rndFx()<dt*.10){PAR.look=(rndFx()-.5)*2;}
  /* дрожь: частая мелкая тряска поверх воротника, живёт только по команде */
  if(PAR.shiver>.001)PAR.ruff+=Math.sin(PAR.t*47)*PAR.shiver*.32;
  /* степени свободы повадки сами оседают в ноль: пока повадка идёт, она
     переписывает их каждый кадр, а кончилась — птица возвращается в покой,
     и для этого не нужно ни одного кадра «выхода» */
  const k=Math.pow(.90,dt*60);
  PAR.roll*=k;PAR.tuck*=k;PAR.stretch*=k;PAR.footUp*=k;PAR.scratch*=k;PAR.fan*=k;
  PAR.yawn*=k;PAR.shiver*=k;PAR.bow*=k;PAR.hang*=k;
  /* ── и разворот тоже (0.417.0) ──
     `turn` в этом списке не было: его гасили сами повадки — «поворот» ставит
     ноль по концу, «оглядка» и «разворот» кончаются нулём колокола. Пока
     повадка доходит до конца, это работает; но повадку можно и оборвать
     (закрыли окно, сбросили мир, сняли `act`), и тогда птица оставалась
     повёрнутой НАВСЕГДА. Поймано набором «трепло: репертуар» на телефонном
     ярусе: 0.55 вместо нуля. Затухание стоит ДО `parActs`, поэтому идущей
     повадке оно не мешает — она переписывает значение следом. */
  PAR.turn*=k;
  PAR.step*=Math.pow(.995,dt*60);
  if(typeof parActs==="function")parActs(dt);
}

/* ══ что оно говорит ══
   Птица НЕ ВЫДУМЫВАЕТ (правило 1 из 12x). На тычок она достаёт строку из
   собственной памяти: понятую — словами, непонятую — глифами. Пустая память
   даёт не выдумку, а честный шорох. */
const PAR_IDLE=["…","кхх-кхх","чшшш","тк-тк-тк","кхе"];
function parrotLine(zone){
  const L=(typeof heardAll==="function")?heardAll():[];
  const pool=L.filter(h=>h.kind==="pidgin"||h.kind==="yours");
  if(pool.length&&rndFx()<(zone==="beak"?.9:.62)){
    const h=pool[Math.floor(rndFx()*pool.length)];
    if(h.kind==="yours")return "«"+h.note+"»";
    return heardWordsRu(h).join(" ");
  }
  if(L.length&&rndFx()<.3){
    const h=L[Math.floor(rndFx()*L.length)];
    if(h.kind==="price")return "цены "+(h.note||"станции");
  }
  return pick(PAR_IDLE,rndFx);
}
/* пять зон — пять разных ответов: одинаковая реакция на любой клик
   превращает животное в кнопку */
function parrotPoke(x,y){
  if(!parrotHas())return;
  let zone="body";
  if(y<-186)zone="crest";
  else if(y<-160&&x>18)zone="beak";
  else if(y<-152)zone="ruff";
  else if(x<-18&&y>-104)zone="tail";
  if(zone==="crest"){PAR.crestV+=26;PAR.ruffV+=6;PAR.mad=Math.min(1,PAR.mad+.5);PAR.blink=1;}
  else if(zone==="ruff"){PAR.ruffV+=22;PAR.look=(x<12?-1:1);PAR.crestV+=6;}
  else if(zone==="beak"){PAR.peck=1;PAR.flapV+=5;PAR.mad=Math.min(1,PAR.mad+.35);}
  else if(zone==="tail"){PAR.flapV+=26;PAR.hopV+=9;PAR.crestV+=16;PAR.lean=.35;}
  else {PAR.flapV+=15;PAR.crestV+=9;PAR.hopV+=4;}
  const say=parrotLine(zone);
  PAR.say=say;PAR.sayT=PAR.t;PAR.beak=1;
  const el=document.getElementById("parrotsay");
  if(el){el.textContent=say;el.classList.remove("on");void el.offsetWidth;el.classList.add("on");}
  if(typeof sfx==="function")try{sfx("ui");}catch(e){}
}

/* ══ окно ══ */
function parrotBtnTick(){
  /* кнопки в меню нет (M151a): птица сидит на жёрдочке пульта (27j). Окно
     закрывается само, если птицы не стало */
  const has=typeof parrotHas==="function"&&parrotHas();
  if(!has&&parWin)toggleParrotWin(false);
}
const PAR_DPR=Math.min(2,window.devicePixelRatio||1);
function toggleParrotWin(open){
  parWin=open===undefined?!parWin:open;
  const w=document.getElementById("parrotwin");if(!w)return;
  w.classList.toggle("open",parWin);
  if(parWin){
    const t=document.getElementById("parrotname");
    if(t&&G.parrot)t.textContent="ТРЕПЛО «"+G.parrot.name.toUpperCase()+"»";
    const cv=document.getElementById("parrotcv");
    if(cv){cv.width=cv.clientWidth*PAR_DPR;cv.height=cv.clientHeight*PAR_DPR;
      /* окно спрятано правилом экрана (body.screen) — размера нет, открывать нечего */
      if(!cv.width||!cv.height){parWin=false;w.classList.remove("open");return;}}
    const el=document.getElementById("parrotsay");
    if(el)el.textContent=G.parrot?("из вещей "+G.parrot.who):"";
    /* шаг и кадр окна — в кадре игры (parrotGpuTick, 12y1): своего rAF у птицы больше нет */
    parT0=wallMs();
  }
}
(function parrotWire(){
  const b=document.getElementById("parrotbtn"),
        x=document.getElementById("parrotclose"),
        cv=document.getElementById("parrotcv");
  if(b)b.addEventListener("click",()=>toggleParrotWin(true));
  if(x)x.addEventListener("click",()=>toggleParrotWin(false));
  if(cv)cv.addEventListener("pointerdown",e=>{
    const R=cv.getBoundingClientRect();
    /* экранное → в координаты птицы: тот же перенос и масштаб, что в отрисовке */
    const W=R.width,H=R.height,s=Math.min(W/230,H/304);
    parrotPoke((e.clientX-R.left-W/2-4)/s,(e.clientY-R.top-(H-16-PAR.hang*150))/s);
  });
})();
