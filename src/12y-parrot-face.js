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
let parWin=false,parRAF=0,parT0=0;
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
/* ── бусина ── холодный огонёк на конце пера: ядро, ореол, блик */
function parBead(c,x,y,r,k){
  const g=c.createRadialGradient(x,y,0,x,y,r*3.4);
  g.addColorStop(0,"rgba(190,252,255,"+(.85*k)+")");
  g.addColorStop(.24,"rgba(111,240,255,"+(.34*k)+")");
  g.addColorStop(1,"rgba(111,240,255,0)");
  c.fillStyle=g;c.beginPath();c.arc(x,y,r*3.4,0,7);c.fill();
  c.fillStyle="rgba(228,255,255,"+(.95*k)+")";
  c.beginPath();c.arc(x,y,r,0,7);c.fill();
}
/* ряд перьев по дуге: ax,ay — центр, r1/r2 — радиусы, a0..a1 — сектор */
function parRow(c,ax,ay,r1,r2,a0,a1,n,len,wid,ph,amp,cTip,cBase,spread){
  for(let i=0;i<n;i++){
    const k=n>1?i/(n-1):.5, a=a0+(a1-a0)*k;
    const x=ax+Math.cos(a)*r1, y=ay+Math.sin(a)*r2;
    const w=Math.sin(PAR.t*2.1+ph+i*.55)*amp;
    const t=1-Math.abs(k-.5)*(1-spread)*2*.55;
    c.save();c.translate(x,y);c.rotate(a+w);
    parQuill(c,len*t,wid*t,.3,cTip,cBase);
    c.restore();
  }
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
/* ── оперение корпуса ──
   Черепица внутри обвода: грудь кремовая, спина кобальтовая, на плече янтарь.
   Ряды плотнее собственной длины пера — щель между перьями видна сильнее,
   чем само перо, и именно из-за неё корпус шёл полосами. */
function parCoat(g,T){
  g.save();parBodyPath(g);g.clip();
  const bg=g.createLinearGradient(-40,0,42,0);
  bg.addColorStop(0,PAR_C.blueD);
  bg.addColorStop(.52,"#42566c");bg.addColorStop(1,PAR_C.creamD);
  g.fillStyle=bg;g.fillRect(-60,-190,120,170);
  /* грудь — не перья остриём вниз, а мягкая чешуя: округлые пластинки внахлёст
     снизу вверх. Остроконечные перья в лоб дали плетёнку-вафлю: две встречные
     штриховки на одном пятне читаются тканью, а не птицей. */
  for(let r=0;r<22;r++){
    const y=-32-r*6;
    for(let i=0;i<6;i++){
      /* сетка без сбоя читается сотами: размер и место каждой пластинки
         сдвинуты своим числом, а не общим шагом */
      const j=Math.sin(r*12.9898+i*78.233)*43758.5453;
      const jx=(j-Math.floor(j)-.5)*3.4, jy=(Math.sin(j)*.5)*2.2;
      const x=-6+i*10+((r&1)?5:0)+jx;
      const w=Math.sin(T*1.7+r*.6+i*.5)*.9;
      parScale(g,x+w,y+jy,11.5+jx*.5,9.5+jy*.4,PAR_C.cream,PAR_C.creamD);
    }
  }
  /* грудь не плоская: слева на неё падает тень от крыла, справа по кромке
     идёт свет. Без этого чешуя лежит ковриком, как бы мелко её ни клали. */
  /* холодная кромка по спине: единственная линия, которая привязывает птицу
     к свету кабины. Она внутри обвода, поэтому не превращается в контур. */
  g.strokeStyle="rgba(150,225,255,.34)";g.lineWidth=3.2;
  g.beginPath();
  g.moveTo(-30,-52);g.bezierCurveTo(-36,-104,-34,-146,-12,-170);g.stroke();

  const cg=g.createLinearGradient(-14,0,42,0);
  cg.addColorStop(0,"rgba(20,34,60,.55)");
  cg.addColorStop(.45,"rgba(20,34,60,0)");
  cg.addColorStop(1,"rgba(255,240,210,.28)");
  g.fillStyle=cg;g.fillRect(-14,-190,60,170);
  /* спина — крупное синее перо остриём вниз, крупнее груди: два разных
     оперения на одном теле, а не один узор на всю птицу */
  for(let r=0;r<9;r++){
    const y=-48-r*13;
    for(let i=0;i<3;i++){
      const x=-46+i*14+((r&1)?7:0);
      const w=Math.sin(T*2.0+r*.7+i*.55)*.05;
      const near=x>-22;
      g.save();g.translate(x,y);g.rotate(1.34+w);
      parQuill(g,30,15,.26,near?PAR_C.blueL:PAR_C.blue,near?PAR_C.blue:PAR_C.blueD);
      g.restore();
    }
  }
  /* янтарь на плече: единственное тёплое пятно на корпусе, оно же метка
     породы. Без него синее с кремовым — форменная рубашка, а не животное. */
  for(let i=0;i<5;i++){
    g.save();g.translate(-27+i*5,-140+i*6);g.rotate(1.25);
    parQuill(g,22,12,.26,PAR_C.amber,PAR_C.amberD);
    g.restore();
  }
  g.restore();
}
/* ── лапа ── чешуйчатая цевка и три пальца в обхват: птица стоит, а не висит */
function parFoot(c,x,dir,grip,up){
  /* Поджатая лапа — не спрятанная: птица подтягивает её к брюху и остаётся
     стоять на второй. Прятать её насовсем нельзя, иначе на поджатии тело
     теряет опору и повисает. */
  const U=up||0, Sc=up?(PAR.scratch||0):0;
  /* чесание: лапа идёт вдоль бока вверх, к щеке; верх цевки прячется под
     корпусом, как бедро под пером, — видны только пальцы у головы */
  c.save();c.translate(x-U*6+Sc*6,-U*26-Sc*84);c.scale(dir,1);c.rotate(-U*.5-Sc*2.3);
  c.lineCap="round";
  c.strokeStyle=PAR_C.footD;c.lineWidth=6.4;
  /* при чесании цевка длиннее: видна вся нога от бока до щеки, корень уходит под крыло */
  const tl=38+Sc*26;
  c.beginPath();c.moveTo(1,-tl);c.quadraticCurveTo(0,-20,0,-4);c.stroke();
  c.strokeStyle=PAR_C.foot;c.lineWidth=4.4;
  c.beginPath();c.moveTo(1,2-tl);c.quadraticCurveTo(0,-20,0,-5);c.stroke();
  /* чешуя цевки: восемь колечек. Гладкая палка выдаёт рисунок сразу — у птицы
     нога покрыта щитками, и это видно даже в четверть размера */
  c.strokeStyle="rgba(70,42,18,.45)";c.lineWidth=1;
  for(let i=0;i<7+Sc*6;i++){
    const y=-33-Sc*26+i*4.4;
    c.beginPath();c.moveTo(-2.4,y);c.quadraticCurveTo(0,y+1.6,2.4,y);c.stroke();
  }
  for(let i=0;i<3;i++){
    const a=(-.85+i*.72)+grip*.14;
    c.strokeStyle=PAR_C.foot;c.lineWidth=4.6;
    c.beginPath();c.moveTo(0,-5);
    c.quadraticCurveTo(Math.cos(a)*10,-3,Math.cos(a)*15,4+Math.sin(a)*2);
    c.stroke();
    c.strokeStyle=PAR_C.footD;c.lineWidth=1.8;
    c.beginPath();c.moveTo(Math.cos(a)*15,4+Math.sin(a)*2);
    c.lineTo(Math.cos(a)*18,7+Math.sin(a)*2);c.stroke();
  }
  c.strokeStyle=PAR_C.footD;c.lineWidth=4;
  c.beginPath();c.moveTo(0,-5);c.quadraticCurveTo(-9,-3,-12,4);c.stroke();
  c.restore();
}
/* ══ сама птица ══ (0,0) — жёрдочка под лапами */
function parrotDraw(c,W,H){
  if(!(W>0&&H>0))return;   /* канва нулевого размера (окно скрыто) — drawImage падает */
  const T=PAR.t;
  const breathe=Math.sin(T*1.35)*1.6, sway=Math.sin(T*.62)*2.0;
  const flap=PAR.flap, lift=PAR.hop;
  c.save();
  c.translate(W/2+4,H-16-PAR.hang*150);
  const s=Math.min(W/230,H/304);
  c.scale(s,s);

  /* ── жёрдочка и тень ── без опоры и тени птица висит в пустоте */
  c.fillStyle="rgba(0,0,0,.45)";
  c.beginPath();c.ellipse(-2,1,44-lift*.18,6-lift*.03,0,0,7);c.fill();
  /* жёрдочка — не труба из каталога, а обрезок ветки: два сучка, волокно
     вдоль и светлая верхняя кромка. Ровный цилиндр под живой птицей сразу
     выдаёт, что это интерфейс, а не место, где она живёт. */
  const pg=c.createLinearGradient(0,-4,0,10);
  pg.addColorStop(0,"#6b5334");pg.addColorStop(.42,"#3d2e1c");pg.addColorStop(1,"#1c1510");
  c.fillStyle=pg;
  c.beginPath();c.roundRect(-92,-3,184,11,5);c.fill();
  c.strokeStyle="rgba(140,110,70,.35)";c.lineWidth=.8;
  for(let i=0;i<5;i++){
    const y=-1+i*1.9;
    c.beginPath();c.moveTo(-88,y);
    c.bezierCurveTo(-30,y+(i&1?.9:-.7),30,y+(i&1?-.8:.8),88,y);c.stroke();
  }
  for(const kx of [-46,28]){
    c.fillStyle="rgba(28,20,12,.55)";
    c.beginPath();c.ellipse(kx,2.6,5,2.6,.2,0,7);c.fill();
  }
  c.strokeStyle="rgba(190,240,235,.22)";c.lineWidth=1;
  c.beginPath();c.moveTo(-90,-2.4);c.lineTo(90,-2.4);c.stroke();

  c.save();

  c.translate(sway+PAR.lean*10+PAR.step,-lift);
  /* вис вниз головой: птица перехватывается лапами и разворачивается вокруг
     самой жёрдочки. Единственная повадка, которая трогает общий поворот, —
     потому и редкая: если её видно часто, она перестаёт быть трюком. */
  /* поворот идёт вокруг ТОЧКИ ХВАТА (низ корпуса, куда входят цевки), а не
     вокруг жёрдочки: иначе тело уезжает от собственных лап и висит рядом
     с ними, а не на них */
  if(PAR.hang>.001){c.translate(0,-44);c.rotate(PAR.hang*2.85);c.translate(0,44);}
  c.rotate(PAR.lean*.05+PAR.bow*.20+Math.sin(T*.62+1)*.012);
  /* лапы держат жёрдочку и НЕ разворачиваются вместе с телом */
  c.save();c.translate(0,-44);c.rotate(-PAR.hang*2.85);c.translate(0,44);
  parFoot(c,-15,-1,lift*.06,0);
  /* чешущая лапа идёт к щеке ПОВЕРХ оперения — её рисуем после слоя */
  if(!(PAR.scratch>.02))parFoot(c,15,1,lift*.06,PAR.footUp);
  c.restore();
  /* разворот боком: тело сжимается по ширине и проходит через ребро. Настоящий
     поворот кругом стоил бы второго набора рисунков; сжатие даёт то же самое
     за одну строку и читается верно, потому что хвост и клюв меняют сторону. */
  /* Ширина в развороте не падает ниже трети: птица, сжатая в ноль, не
     «стоит боком», а исчезает. Настоящий вид со спины стоил бы второго
     набора рисунков, а треть ширины читается разворотом и стоит строки. */
  /* плотность растра слоя — по фактическому масштабу канвы: иначе оперение
     считается в одну точку на единицу и в большом окне расплывается в мыло */
  const mt=c.getTransform();
  const kpx=Math.min(6,Math.max(1,Math.hypot(mt.a,mt.b)));
  const tc=Math.cos((PAR.turn||0)*Math.PI);
  c.scale(tc<0?-Math.max(.34,-tc):Math.max(.34,tc),1);

  /* оперение — на своей канве: один свет кладётся на всё разом */
  /* слой — по коробке птицы (230×304 единиц вокруг жёрдочки), а не по канве
     окна: в маленьком окне (M151a: 138×104) слой резал голову и крылья, и
     птица выходила «обрезанной» (плейтест 02.09) */
  const L=parLayer(230,304,kpx);
  const g=L.g;
  const beads=[];                      /* огни собираем и зажигаем после света */
  g.save();g.translate(L.ox,L.oy);
  g.scale(1,1+breathe*.006);

  /* 1. ХВОСТ — первым, он за телом: длинные слоёные перья вниз-назад.
     Он длиннее корпуса: это половина силуэта и главный признак направления. */
  g.save();g.translate(-24,-98);g.rotate(Math.sin(T*.7)*.05+flap*.24);
  for(let i=0;i<7;i++){
    const k=i/6;
    const a=1.82+k*(.52+PAR.fan*.72);          /* вниз-назад, узким веером */
    const len=(152-k*54)*(1+flap*.06);
    /* каждое перо со своей фазой и своим запаздыванием — хвост качается
       волной от корня к концам, а не доской */
    const w=Math.sin(T*1.15+i*.62)*.045;
    const amb=i===2||i===5;
    g.save();g.rotate(w);
    const P=parPlume(g,len,a,.34,9-k*3.4,
      amb?PAR_C.amber:(i&1?PAR_C.blueL:PAR_C.blue),
      amb?PAR_C.amberD:PAR_C.blueD,5,1.7);
    g.restore();
    /* огни на двух крайних перьях — тот же язык, что в хохле, и не чаще:
       фонарь на каждом пере превращает птицу в гирлянду */
    if(i===0||i===4){
      const ca=Math.cos(w),sa=Math.sin(w);
      beads.push([-24+P[0]*ca-P[1]*sa,-98+P[0]*sa+P[1]*ca,2.4,.62]);
    }
  }
  g.restore();

  /* подхвостье: короткие кремовые перья у корня хвоста — стык корпуса с
     хвостом, без которого хвост выглядит вставленным в тело */
  parRow(g,-18,-70,10,10,1.55,2.30,5,34,13,2.2,.05,PAR_C.cream,PAR_C.creamD,.8);

  /* 2. корпус: масса и черепица одним куском, внутри обвода */
  parCoat(g,T);

  /* 3. КРЫЛО: три ряда на одном шарнире у плеча — машет плечо, а не перо.
     Ось у крыла своя, поэтому оно не сливается с хвостом в общую метёлку. */
  g.save();g.translate(-20,-150);
  g.rotate(-flap*1.35-PAR.stretch*.62+Math.sin(T*.9)*.03);
  /* потягивание: крыло не машет, а вытягивается — длина перьев растёт, взмаха
     нет. Это разные движения, и путать их нельзя */
  if(PAR.stretch>.001)g.scale(1+PAR.stretch*.34,1+PAR.stretch*.16);
  /* тёмная подложка крыла: без неё ряды тонут в спине и крыла не видно */
  g.fillStyle="rgba(10,26,58,.85)";
  g.beginPath();g.moveTo(4,6);g.quadraticCurveTo(-16,34,-6,86);
  g.quadraticCurveTo(14,44,18,2);g.closePath();g.fill();
  /* маховые: длинные гнутые перья вдоль бока, как в референсе, — не веер
     лопаток, а слоёная кисть с укорочением к плечу */
  for(let i=0;i<6;i++){
    const k=i/5;
    const a=1.42+k*.46;
    const w=Math.sin(T*1.25+i*.7)*.04;
    g.save();g.rotate(w);
    parPlume(g,104-k*38,a,.30,11-k*3.6,i&1?PAR_C.blue:PAR_C.blueL,PAR_C.blueD,5,1.5);
    g.restore();
  }
  /* кроющие второго порядка: мелкое синее перо поверх голых оснований маховых.
     Без них у крыла видно, где перья «воткнуты», и вся кисть теряет корень. */
  parRow(g,2,-6,9,10,1.30,1.94,7,30,12,1.4,.05,PAR_C.blueL,PAR_C.blueD,.9);
  /* кроющие плеча: короткие янтарные, они же стык крыла с телом */
  parRow(g,4,-10,8,9,1.30,1.90,5,28,11,3.6,.05,PAR_C.amber,PAR_C.amberD,.9);
  g.restore();

  const pr=PAR.preen, sc=PAR.scratch||0;
  const hx=12-pr*16-PAR.tuck*5+sc*4, hy=-168+pr*26+PAR.tuck*13+sc*20;
  /* воротничок: мелкое перо там, где голова садится на грудь. Идёт за
     головой на две трети: осталась бы на месте — при втянутой голове торчал
     бы над ней брыжами. Стык двух
     оперений — самое заметное место сборки, и он должен быть заткан. */
  const rf2=Math.abs(PAR.ruff)+PAR.tuck*.85;
  parRow(g,10+(hx-12)*.85,-150+(hy+168)*.9,16,13,-2.5,.45,11,16+rf2*6,10,1.2,.10+rf2*.12,
    PAR_C.cream,PAR_C.blue,.92);

  /* 4. ГОЛОВА со всем, что на ней: качается на шее одним куском.
     Чистка перьев (`preen`) — единственное, что птица делает сама: голова
     ныряет к плечу и возвращается. Без такого «дела» она просто качается. */
  /* шея: пятно в цвет головы между корпусом и черепом, идёт за головой на
     полпути. Голова — не диск, положенный на грудь; при наклоне и чистке
     между ними иначе открывается тёмный зазор */
  g.save();g.translate(12+(hx-12)*.5,-158+(hy+168)*.5);
  const ng=g.createLinearGradient(-18,0,18,0);
  ng.addColorStop(0,PAR_C.blue);ng.addColorStop(.5,"#a9c4de");ng.addColorStop(1,PAR_C.cream);
  g.fillStyle=ng;g.beginPath();g.ellipse(-6,0,24,17,-.15,0,7);g.fill();
  g.restore();
  g.save();
  /* втягивание в плечи (`tuck`) — не сдвиг головы вниз, а посадка её на тело:
     вместе с ней поднимается воротник, иначе видно голую шею. */
  g.translate(hx,hy);
  const hr=PAR.look*.12+Math.sin(T*.5)*.022+PAR.mad*.05+pr*1.05
    +PAR.roll*.62+PAR.bow*.5+sc*.4;
  g.rotate(hr);

  /* 4а. хохол: восемь перьев назад-вверх, у каждого своя фаза и бусина.
     Бусина отстаёт от пера — оттого хохол читается инерцией, а не веером. */
  const cr=PAR.crest;
  for(let i=0;i<9;i++){
    const k=i/8;
    const a=-2.62+k*1.22-cr*.34;
    const len=(46+Math.sin(k*3.1)*30+Math.sin(i*2.3)*5)*(1+cr*.30);
    const w=Math.sin(T*1.6+i*.8)*.075;
    const col=i%3===0?PAR_C.amber:(i%3===1?PAR_C.blue:PAR_C.viol);
    const colD=i%3===0?PAR_C.amberD:(i%3===1?PAR_C.blueD:"#4a2f9c");
    g.save();g.rotate(w);
    const P=parPlume(g,len,a,.86,6.2-k*1.6,col,colD,4,1.1);
    /* голый стебель за опушкой: бусина висит НА нём, а не приклеена к перу —
       это и даёт антенну, а не блёстку на кончике */
    const st=6+Math.sin(i*1.7)*2;
    const sx=P[0]+Math.cos(a+.30)*st, sy=P[1]+Math.sin(a+.30)*st;
    g.strokeStyle="rgba(150,200,235,.6)";g.lineWidth=1.6;
    g.beginPath();g.moveTo(P[0],P[1]);g.lineTo(sx,sy);g.stroke();
    P[0]=sx;P[1]=sy;
    g.restore();
    /* положение бусины считаем в координатах головы и отдаём наружу вместе
       с поворотом: огни рисуются последними, поверх света */
    const ca=Math.cos(hr),sa=Math.sin(hr);
    const bx=P[0]*ca-P[1]*sa, by=P[0]*sa+P[1]*ca;
    const lag=Math.sin(T*1.6+i*.8-.9)*3.5;
    beads.push([hx+bx+lag*.6,hy+by+lag,1.8+k*.4,
      .72+.28*Math.sin(T*2.2+i*1.1)]);
  }
  /* 4б. череп: кремовая маска, синий затылок */
  const sg=g.createLinearGradient(-20,0,22,0);
  sg.addColorStop(0,PAR_C.blue);sg.addColorStop(.42,"#a9c4de");sg.addColorStop(.7,PAR_C.cream);
  g.fillStyle=sg;
  g.beginPath();g.ellipse(0,0,22,20,-.08,0,7);g.fill();
  /* мелкое перо на щеке: голова не должна быть гладким яйцом */
  for(let i=0;i<7;i++){
    const a=-1.5+i*.42;
    g.save();g.translate(Math.cos(a)*13,Math.sin(a)*11);g.rotate(a+1.4);
    parQuill(g,9,6,.2,i<3?PAR_C.blueL:PAR_C.cream,i<3?PAR_C.blue:PAR_C.creamD);
    g.restore();
  }
  /* 4в. клюв: крупный, загнутый, с раскрывом — половина характера здесь */
  g.save();g.translate(15,-1);g.rotate(PAR.peck*.16);g.scale(1.34,1.34);
  const bg2=g.createLinearGradient(0,-12,0,14);
  bg2.addColorStop(0,PAR_C.beak);bg2.addColorStop(1,PAR_C.beakD);
  g.fillStyle=bg2;
  /* Клюв попугая — не клин, а высокая горбатая надклювная дуга, круто
     заворачивающая вниз и НАЗАД, под себя. Прежний вариант был длинным и
     острым: у птицы получался вороний клюв, а порода в референсе тупая и
     мясистая, и держится она именно на этом изгибе. */
  g.beginPath();
  g.moveTo(-9,-13);                        /* восковица у самого лба */
  g.bezierCurveTo(6,-15,18,-10,22,-2);     /* горб надклювья */
  g.bezierCurveTo(25,4,23,11,20,15);       /* спуск к острию */
  g.lineTo(17,17);                         /* само остриё — тупое, но остриё */
  g.bezierCurveTo(15,12,12,9,9,7);         /* крючок подобран назад, с подрезом */
  g.bezierCurveTo(4,5,-2,4.5,-9,4.5);
  g.closePath();g.fill();
  /* подрез под крючком: тонкая тень, от которой остриё читается остриём,
     а не округлым наплывом. Без неё клюв превращается в шишку. */
  g.strokeStyle="rgba(90,54,16,.45)";g.lineWidth=1.1;
  g.beginPath();g.moveTo(19,14.5);
  g.bezierCurveTo(15,11,12,8.5,9,7);g.stroke();
  /* блик по горбу: без него клюв — плоское пятно, а он гладкий и твёрдый */
  g.fillStyle="rgba(255,246,226,.5)";
  g.beginPath();g.moveTo(-4,-10);
  g.quadraticCurveTo(8,-11,15,-3);
  g.quadraticCurveTo(7,-6,-4,-6);g.closePath();g.fill();
  /* подклювье: короткая широкая чаша, отъезжает, когда птица говорит */
  /* раскрытый клюв — это не «нижняя половина отъехала», а видимый зев: без
     тёмного проёма между створками зевок читается сломанной челюстью */
  if(PAR.yawn>.02||PAR.beak>.3){
    g.fillStyle="rgba(58,20,26,.92)";
    g.beginPath();g.moveTo(-6,2);
    g.quadraticCurveTo(9,3,17,7+PAR.yawn*10);
    g.quadraticCurveTo(4,10+PAR.yawn*16,-6,9+PAR.yawn*12);
    g.closePath();g.fill();
  }
  g.save();g.translate(0,PAR.beak*5+PAR.yawn*17);g.rotate(PAR.yawn*.42);
  const lg2=g.createLinearGradient(0,4,0,15);
  lg2.addColorStop(0,PAR_C.beakD);lg2.addColorStop(1,"#a06a2e");
  g.fillStyle=lg2;
  g.beginPath();g.moveTo(-9,4);
  g.bezierCurveTo(2,5,9,7,10,11);
  g.bezierCurveTo(6,14,-3,14,-9,13);
  g.closePath();g.fill();
  g.restore();
  g.fillStyle="rgba(60,30,10,.55)";
  g.beginPath();g.arc(-2,-8,1.6,0,7);g.fill();   /* ноздря */
  g.restore();
  /* 4г. глаз: крупный, круглый, с двумя бликами — от него всё обаяние */
  const bl=1-PAR.blink;
  g.save();g.translate(4,-4);
  /* перьевое кольцо вокруг глаза: тёмная кайма, из-за которой глаз сидит в
     голове, а не лежит на ней наклейкой */
  /* кольцо смыкается вместе с глазом: при закрытом глазе полное кольцо
     оставляло на морде тёмное пятно во весь глаз */
  g.fillStyle="rgba(28,44,74,.42)";
  g.beginPath();g.ellipse(0,0,11.2,10.8*Math.max(.24,bl),0,0,7);g.fill();
  g.fillStyle="#e9dcc6";
  g.beginPath();g.ellipse(0,0,9.5,9.5*Math.max(.08,bl),0,0,7);g.fill();
  if(bl>.2){
    g.fillStyle=PAR_C.eye;
    g.beginPath();g.ellipse(.6,0,7.4,7.4*bl,0,0,7);g.fill();
    g.fillStyle="rgba(120,190,240,.5)";
    g.beginPath();g.ellipse(.6,1.6,5.6,5.6*bl,0,0,7);g.fill();
    g.fillStyle="rgba(255,255,255,.95)";
    g.beginPath();g.ellipse(2.6,-3,2.5,2.5*bl,0,0,7);g.fill();
    g.beginPath();g.ellipse(-2.6,2.4,1.2,1.2*bl,0,0,7);g.fill();
  }
  g.strokeStyle="rgba(20,14,26,.75)";g.lineWidth=1.6;
  g.beginPath();g.ellipse(0,0,9.5,9.5*Math.max(.08,bl),0,0,7);g.stroke();
  /* сомкнутое веко — кремовая дуга в цвет щеки, а не щель */
  if(bl<.3){
    g.strokeStyle="rgba(210,190,158,"+(1-bl/.3)+")";g.lineWidth=2.2;
    g.beginPath();g.moveTo(-9,0);g.quadraticCurveTo(0,2.4,9,0);g.stroke();
  }
  g.restore();
  g.restore();

  /* 5. ОДИН СВЕТ на всю выпечку */
  g.globalCompositeOperation="source-atop";
  const lg=g.createLinearGradient(0,L.oy-230,0,L.oy+10);
  lg.addColorStop(0,"rgba(255,236,196,.26)");   /* лампа над жёрдочкой */
  lg.addColorStop(.45,"rgba(255,255,255,0)");
  lg.addColorStop(1,"rgba(4,10,16,.55)");       /* низ уходит в тень */
  g.fillStyle=lg;g.fillRect(0,0,L.w,L.h);
  const kg=g.createLinearGradient(L.ox-80,0,L.ox+60,0);
  kg.addColorStop(0,"rgba(127,230,216,.22)");   /* холодный подбой от приборов */
  kg.addColorStop(.5,"rgba(127,230,216,0)");
  kg.addColorStop(1,"rgba(255,206,140,.14)");
  g.fillStyle=kg;g.fillRect(0,0,L.w,L.h);
  g.globalCompositeOperation="source-over";
  g.restore();

  /* 6. огни — ПОСЛЕ света и аддитивно: свет не имеет права их гасить */
  g.save();g.translate(L.ox,L.oy);g.globalCompositeOperation="lighter";
  for(const b of beads)parBead(g,b[0],b[1],b[2],b[3]);
  g.restore();

  c.drawImage(L.cv,-L.ox,-L.oy,L.w,L.h);
  if(PAR.scratch>.02){
    c.save();c.translate(0,-44);c.rotate(-PAR.hang*2.85);c.translate(0,44);
    parFoot(c,15,1,lift*.06,PAR.footUp);
    c.restore();
  }
  c.restore();
  c.restore();
}
/* канва оперения кэшируется на модуле: дорогое считается один раз */
let PAR_L=null;
function parLayer(W,H,k){
  k=k||1;
  if(!PAR_L||PAR_L.w!==W||PAR_L.h!==H||PAR_L.k!==k){
    const cv=document.createElement("canvas");
    cv.width=Math.ceil(W*k);cv.height=Math.ceil(H*k);
    PAR_L={cv,g:cv.getContext("2d"),w:W,h:H,k,ox:W*.5,oy:H*.94};
  }
  PAR_L.g.setTransform(k,0,0,k,0,0);
  PAR_L.g.clearRect(0,0,PAR_L.w,PAR_L.h);
  return PAR_L;
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
  }else if(Math.random()<dt*.06&&PAR.flap<.05){PAR.preenT=PAR.t;}
  PAR.beak*=Math.pow(.90,dt*60);
  PAR.look*=Math.pow(.985,dt*60);
  /* злость держится секунд восемь, а не одну: птицу задели — она успевает
     рассердиться хотя бы на одну повадку. При прежнем затухании взвинченный
     набор не выпадал ни разу за час наблюдения */
  PAR.mad*=Math.pow(.9975,dt*60);
  /* подскок идёт от крыла: птица машет всем телом, а не одним крылом */
  if(PAR.flapV>0)PAR.hopV+=PAR.flapV*.10*dt*60;
  if(PAR.blink>0)PAR.blink=Math.max(0,PAR.blink-dt*7);
  if(PAR.t>PAR.blinkAt){PAR.blink=1;PAR.blinkAt=PAR.t+1.6+Math.random()*4.2;}

  /* мелкая рябь: она идёт ВСЕГДА, поверх любой повадки, и это разные вещи.
     Повадка — то, что птица делает; рябь — то, что с ней происходит. */
  if(Math.random()<dt*.14){PAR.ruffV+=(Math.random()-.5)*5;}
  if(Math.random()<dt*.10){PAR.look=(Math.random()-.5)*2;}
  /* дрожь: частая мелкая тряска поверх воротника, живёт только по команде */
  if(PAR.shiver>.001)PAR.ruff+=Math.sin(PAR.t*47)*PAR.shiver*.32;
  /* степени свободы повадки сами оседают в ноль: пока повадка идёт, она
     переписывает их каждый кадр, а кончилась — птица возвращается в покой,
     и для этого не нужно ни одного кадра «выхода» */
  const k=Math.pow(.90,dt*60);
  PAR.roll*=k;PAR.tuck*=k;PAR.stretch*=k;PAR.footUp*=k;PAR.scratch*=k;PAR.fan*=k;
  PAR.yawn*=k;PAR.shiver*=k;PAR.bow*=k;PAR.hang*=k;
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
  if(pool.length&&Math.random()<(zone==="beak"?.9:.62)){
    const h=pool[Math.floor(Math.random()*pool.length)];
    if(h.kind==="yours")return "«"+h.note+"»";
    return heardWordsRu(h).join(" ");
  }
  if(L.length&&Math.random()<.3){
    const h=L[Math.floor(Math.random()*L.length)];
    if(h.kind==="price")return "цены "+(h.note||"станции");
  }
  return pick(PAR_IDLE,Math.random);
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
function parrotFrame(ts){
  if(!parWin)return;
  const dt=Math.min(.05,(ts-parT0)/1000||.016);parT0=ts;
  parStep(dt);
  const cv=document.getElementById("parrotcv");
  if(cv){
    const c=cv.getContext("2d");
    c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,cv.width,cv.height);
    c.setTransform(PAR_DPR,0,0,PAR_DPR,0,0);
    parrotDraw(c,cv.width/PAR_DPR,cv.height/PAR_DPR);
  }
  parRAF=requestAnimationFrame(parrotFrame);
}
function toggleParrotWin(open){
  parWin=open===undefined?!parWin:open;
  const w=document.getElementById("parrotwin");if(!w)return;
  w.classList.toggle("open",parWin);
  if(parWin){
    const t=document.getElementById("parrotname");
    if(t&&G.parrot)t.textContent="ТРЕПЛО «"+G.parrot.name.toUpperCase()+"»";
    const cv=document.getElementById("parrotcv");
    if(cv){cv.width=cv.clientWidth*PAR_DPR;cv.height=cv.clientHeight*PAR_DPR;PAR_L=null;
      /* окно спрятано правилом экрана (body.screen) — размера нет, открывать нечего */
      if(!cv.width||!cv.height){parWin=false;w.classList.remove("open");return;}}
    const el=document.getElementById("parrotsay");
    if(el)el.textContent=G.parrot?("из вещей "+G.parrot.who):"";
    parT0=performance.now();parRAF=requestAnimationFrame(parrotFrame);
  }else if(parRAF){cancelAnimationFrame(parRAF);parRAF=0;}
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
