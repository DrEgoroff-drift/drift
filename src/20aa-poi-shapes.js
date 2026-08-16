/* ══════════════ фигуры находок: одна функция на вид ══════════════
   Отрезано от `20a-poi` по шву: там остались таблица видов, кисти
   (`poiPoly`/`poiSkin`/`poiDrift`) и кадр `drawPOI`, сюда ушли сами постройки.
   Файл перешёл 40 КБ на мёртвой батарее (M111) — и это плата по долгу, а не
   новая базовая отметка в `build.ps1`. Добавить вид — значит дописать функцию
   сюда и одну строку в развилку `drawPOI`. */
/* ── разбившийся мегакорабль: корпус вошёл в грунт под углом, хребет переломлен ── */
function drawWreck(q,r,dark,lite,pal){
  const L=q.h*2.6, tilt=(-.24-r()*.22);

  poiDrift(L*.36,pal);
  ctx.save();ctx.rotate(tilt);
  const bw=q.h*.34;
  poiPoly([[-L*.5,0],[-L*.36,-bw*.9],[L*.28,-bw],[L*.5,-bw*.42],[L*.46,bw*.2],[-L*.44,bw*.3]],
    poiBody(bw,dark,lite),"rgba(0,0,0,.5)");
  /* шпангоуты в проломе — по ним и читается размер */
  ctx.strokeStyle="rgba(0,0,0,.45)";ctx.lineWidth=2;
  for(let i=0;i<7;i++){
    const t=-.3+i*.11, px=L*t;
    ctx.beginPath();ctx.moveTo(px,-bw*.95);ctx.lineTo(px,bw*.25);ctx.stroke();
  }
  /* ряд иллюминаторов: часть ещё горит */
  for(let i=0;i<18;i++){
    const px=-L*.34+i*L*.042, py=-bw*.52;
    const on=((q.seed>>>(i%16))&3)===0;
    ctx.fillStyle=on?"rgba(255,214,150,.85)":"rgba(0,0,0,.55)";
    ctx.fillRect(px,py,3.2,2.2);
  }
  ctx.restore();
  /* оторванная секция чуть в стороне и обломки — след падения */
  ctx.save();ctx.translate(L*.62,-6);ctx.rotate(.5+r()*.4);
  poiPoly([[-q.h*.3,0],[-q.h*.2,-q.h*.24],[q.h*.24,-q.h*.2],[q.h*.3,0]],
    poiBody(q.h*.24,dark,lite),"rgba(0,0,0,.5)");
  ctx.restore();
  for(let i=0;i<9;i++){
    const px=(r()-.5)*L*1.5, s=2+r()*7;
    ctx.fillStyle="rgba(0,0,0,.4)";
    ctx.beginPath();ctx.ellipse(px,-s*.3,s,s*.4,0,0,TAU);ctx.fill();
  }
  /* аварийный маяк ещё бьёт — на нём глаз и останавливается */
  const bl=Math.pow(Math.max(0,Math.sin(G.t*.06)),8);
  if(bl>.02){
    const bx=-L*.42*Math.cos(tilt), by=-q.h*.42;
    poiGlow(bx,by,60,"255,90,70",.5*bl);
    ctx.fillStyle="rgba(255,190,170,"+(.9*bl).toFixed(2)+")";
    ctx.beginPath();ctx.arc(bx,by,2.2,0,TAU);ctx.fill();
  }
}
/* ── древний храм: ступенчатая пирамида, вход светится ── */
function drawTemple(q,r,dark,lite,pal){
  const w=q.h*1.5, steps=5+Math.floor(r()*3);

  /* верхние ступени осыпались неровно, и одна съехала вбок: целая пирамида
     выглядит построенной вчера */
  const broke=1+Math.floor(r()*2);
  for(let i=0;i<steps;i++){
    const t=i/steps, th=q.h/steps;
    let tw=w*(1-t*.72)*.5;
    const y0=-i*th;
    const top=i>=steps-broke;
    if(top)tw*=.55+r()*.3;
    const sh=(i===steps-broke-1)?(r()-.5)*w*.06:0;   // съехавший блок
    poiPoly([[-tw+sh,y0],[tw+sh,y0],[tw*.94+sh,y0-th*(top?.6:1)],[-tw*.94+sh,y0-th*(top?.8:1)]],
      poiBody(th,dark,lite),"rgba(0,0,0,.35)",3.2);
  }
  poiDrift(w*.55,pal);
  /* обелиски по бокам — вертикали, задающие ритм */
  for(const s of [-1,1]){
    ctx.save();ctx.translate(s*w*.62,0);
    poiPoly([[-5,0],[5,0],[3.5,-q.h*.6],[-3.5,-q.h*.6]],poiBody(q.h*.6,dark,lite),"rgba(0,0,0,.4)");
    ctx.restore();
  }
  /* вход: сначала тёмная глубина проёма, потом свет изнутри и только он мягкий.
     Резкий светлый прямоугольник с обводкой был самой плоской вещью в кадре —
     проём должен читаться дырой в толстой стене, а не наклейкой на ней. */
  const gw=w*.105, gh=q.h*.32;
  const jamb=poiPath([[-gw*1.5,0],[gw*1.5,0],[gw*1.25,-gh*1.06],[0,-gh*1.18],[-gw*1.25,-gh*1.06]],2.4);
  ctx.fillStyle="rgba(4,6,9,.94)";ctx.fill(jamb);
  ctx.save();ctx.clip(jamb);
  const g=ctx.createRadialGradient(0,-gh*.42,0,0,-gh*.42,gh*.9);
  g.addColorStop(0,"rgba(190,245,255,.62)");
  g.addColorStop(.45,"rgba(90,180,225,.24)");
  g.addColorStop(1,"rgba(10,20,34,0)");
  ctx.fillStyle=g;ctx.fillRect(-gw*2,-gh*1.3,gw*4,gh*1.4);
  ctx.restore();
  poiGlow(0,-gh*.45,gh*2.4,"120,220,255",.22);
  /* порог, вытертый до блеска — единственная светлая линия у входа */
  ctx.fillStyle="rgba(200,240,255,.16)";ctx.fillRect(-gw*1.4,-2.4,gw*2.8,2.4);
}
/* ── космический лифт: лента уходит выше кромки экрана ── */
function drawElevator(q,r,dark,lite){
  const bw=q.h*.06;

  poiPoly([[-bw*2.4,0],[bw*2.4,0],[bw*.9,-q.h*.16],[-bw*.9,-q.h*.16]],
    poiBody(q.h*.16,dark,lite),"rgba(0,0,0,.45)");
  /* сама лента: сужается кверху и тает в дымке — так читается высота */
  const g=ctx.createLinearGradient(0,0,0,-q.h);
  g.addColorStop(0,"rgba(190,215,230,.55)");
  g.addColorStop(.55,"rgba(190,215,230,.28)");
  g.addColorStop(1,"rgba(190,215,230,.04)");
  ctx.fillStyle=g;
  poiPoly([[-bw*.8,-q.h*.14],[bw*.8,-q.h*.14],[bw*.16,-q.h],[-bw*.16,-q.h]],g,null,0);
  /* кабина ползёт вверх — единственное, что здесь движется */
  const t=(G.t*.0016+((q.seed&255)/255))%1;
  const cy=-q.h*(.16+t*.8), cw=bw*.5*(1-t*.7);
  ctx.fillStyle="rgba(235,240,245,.7)";ctx.fillRect(-cw,cy,cw*2,cw*1.6);
  poiGlow(0,cy,bw*2.4,"200,230,255",.18);
  /* растяжки к грунту */
  ctx.strokeStyle="rgba(0,0,0,.22)";ctx.lineWidth=1.4;
  for(const s of [-1,1]){
    ctx.beginPath();ctx.moveTo(s*bw*.7,-q.h*.15);ctx.lineTo(s*bw*3.2,0);ctx.stroke();
  }
}
/* ── кристаллический лес: призмы разной высоты, мерцают вразнобой ── */
function drawCrystalForest(q,r,pal){
  const n=7+Math.floor(r()*7);
  const hue=pal[Math.min(4,pal.length-1)];
  const col=hue[0]+","+hue[1]+","+hue[2];
  const shards=[];
  for(let i=0;i<n;i++)shards.push({x:(r()-.5)*q.h*1.9,h:q.h*(.3+r()*.85),w:q.h*(.035+r()*.07),
    lean:(r()-.5)*.3,ph:r()*TAU});
  shards.sort((a,b)=>a.h-b.h);
  for(const s of shards){
    ctx.save();ctx.translate(s.x,0);ctx.rotate(s.lean);
    groundShadow(0,2,s.w*2.4,4);
    const g=ctx.createLinearGradient(0,0,0,-s.h);
    g.addColorStop(0,"rgba("+col+",.30)");
    g.addColorStop(.6,"rgba("+col+",.62)");
    g.addColorStop(1,"rgba(255,255,255,.85)");
    /* кристалл — единственное, у чего грань обязана остаться острой: скол
       по кромке превращает его в обычный камень */
    poiPoly([[-s.w,0],[s.w,0],[s.w*.35,-s.h*.82],[0,-s.h],[-s.w*.42,-s.h*.8]],g,"rgba(255,255,255,.28)",.35);
    /* блик: узкая грань, которая «загорается» на своей фазе */
    const tw=.35+.65*Math.pow(Math.max(0,Math.sin(G.t*.02+s.ph)),6);
    ctx.fillStyle="rgba(255,255,255,"+(.30*tw).toFixed(3)+")";
    poiPoly([[-s.w*.3,-s.h*.12],[0,-s.h*.1],[0,-s.h*.9],[-s.w*.18,-s.h*.86]],
      "rgba(255,255,255,"+(.30*tw).toFixed(3)+")",null);
    if(tw>.75)poiGlow(0,-s.h*.7,s.h*.5,col,.10*tw);
    ctx.restore();
  }
}
/* ── кольцевой ускоритель: дуга, наполовину ушедшая в грунт, по ней бежит импульс ── */
function drawAccel(q,r,dark,lite){
  const R=q.h*1.05;
  ctx.save();
  ctx.strokeStyle=dark;ctx.lineWidth=R*.1;
  ctx.beginPath();ctx.arc(0,-R*.34,R,0,TAU);ctx.stroke();
  ctx.strokeStyle="rgba(255,255,255,.10)";ctx.lineWidth=R*.045;
  ctx.beginPath();ctx.arc(0,-R*.34,R*1.02,Math.PI*1.15,Math.PI*1.9);ctx.stroke();
  /* опоры */
  for(const s of [-1,1]){
    poiPoly([[s*R*.62,0],[s*R*.95,0],[s*R*.86,-R*.5],[s*R*.7,-R*.5]],poiBody(R*.5,dark,lite),null);
  }
  /* сгусток по кольцу — движение, ради которого всё и стоит */
  const a=G.t*.012+((q.seed&63)/63)*TAU;
  const px=Math.cos(a)*R, py=-R*.34+Math.sin(a)*R;
  if(py<4){
    poiGlow(px,py,R*.34,"150,220,255",.5);
    ctx.fillStyle="rgba(230,248,255,.9)";
    ctx.beginPath();ctx.arc(px,py,R*.035,0,TAU);ctx.fill();
    /* хвост */
    ctx.strokeStyle="rgba(150,220,255,.35)";ctx.lineWidth=R*.05;
    ctx.beginPath();ctx.arc(0,-R*.34,R,a-.5,a);ctx.stroke();
  }
  ctx.restore();
}
/* ── гравитационная аномалия: тёмное ядро, вокруг висят обломки ── */
function drawAnomaly(q,r,pal){
  const R=q.h*.5, cy=-q.h*.62;
  /* линза: небо вокруг ядра гасится и слегка светлеет по кромке — дёшево,
     а читается именно как искривление, а не как чёрный кружок */
  const g=ctx.createRadialGradient(0,cy,R*.2,0,cy,R*1.9);
  g.addColorStop(0,"rgba(0,0,0,.92)");
  g.addColorStop(.42,"rgba(10,6,20,.55)");
  g.addColorStop(.72,"rgba(150,120,255,.14)");
  g.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,cy,R*1.9,0,TAU);ctx.fill();
  ctx.strokeStyle="rgba(190,170,255,.22)";ctx.lineWidth=1.2;
  ctx.beginPath();ctx.ellipse(0,cy,R*1.25,R*.34,.35,0,TAU);ctx.stroke();
  const c0=pal[1];
  for(let i=0;i<11;i++){
    const a=G.t*(.004+ (i%4)*.0016)+i*1.9;
    const rr=R*(.75+ (i%5)*.26);
    const px=Math.cos(a)*rr, py=cy+Math.sin(a)*rr*.42;
    const s=2+ (i%4)*2.4;
    ctx.save();ctx.translate(px,py);ctx.rotate(a*1.7);
    ctx.fillStyle="rgb("+c0.map(v=>Math.round(v*.9+18)).join(",")+")";
    poiPoly([[-s,0],[-s*.3,-s*.8],[s*.9,-s*.2],[s*.4,s*.7]],ctx.fillStyle,"rgba(0,0,0,.4)");
    ctx.restore();
  }
}
/* ── монолит: ничего, кроме пропорции и кромочного света ── */
function drawMonolith(q,r,dark,lite,pal){
  const w=q.h*.19;

  /* у монолита кромка почти идеальна — в этом весь его характер: рядом с
     выветренным камнем безупречная грань и читается как чужая работа */
  poiPoly([[-w,0],[w,0],[w*.93,-q.h],[-w*.93,-q.h]],"rgba(6,6,10,.96)","rgba(0,0,0,.6)",.7);
  poiDrift(w*1.5,pal);
  /* тонкая световая кромка со стороны солнца (солнце в drawSkyLayer справа) */
  ctx.strokeStyle="rgba(210,235,255,.4)";ctx.lineWidth=1.6;
  ctx.beginPath();ctx.moveTo(w,0);ctx.lineTo(w*.93,-q.h);ctx.stroke();
  /* насечки на грани — оживают только вблизи */
  ctx.fillStyle="rgba(120,200,230,"+(.14+.10*Math.sin(G.t*.01)).toFixed(3)+")";
  for(let i=0;i<9;i++){
    const yy=-q.h*(.15+i*.085);
    ctx.fillRect(-w*.35,yy,w*.7*(.3+((q.seed>>>i)&3)/3*.7),1.6);
  }
  poiGlow(0,-q.h*.55,q.h*.7,"90,170,220",.06);
}
/* ── зарубка: межевой знак «Долгого Хода» ──
   Рядом с монолитом она обязана читаться СВОЕЙ: монолит — безупречная чужая
   грань, зарубка — камень, поставленный руками и в спешке. Отсюда наклон,
   грубый скол вершины и ряды засечек, врезанных не по линейке: это отчёт, а
   не памятник. Всё, что светится, — тонкая полоса на срезе, поймавшая солнце. */
/* ── мёртвая батарея: казённая вещь, которую бросили заряженной ──
   Строение читается порядком, а не деталью: земляной бруствер, в нём утопленное
   основание, на основании погон, из погона — ствол, задранный в небо и сломанный
   у дульного среза. Всё остальное (кабельная канава, стеллаж, короб подачи) —
   мелочь, объясняющая, что это работало, а не стояло. Свет справа, как везде. */
function drawDeadBattery(q,r,dark,lite,pal){
  const H0=q.h, R=H0*.62;
  const s1=(q.seed>>>5)&7, s2=(q.seed>>>9)&7;
  const tilt=-.55-s1*.06;                       // ствол задран: его так и оставили
  poiDrift(R*1.5,pal);
  /* бруствер: насыпь вокруг гнезда, из-за неё основание сидит в земле */
  ctx.fillStyle="rgba("+pal[1].map(v=>Math.round(v*.72)).join(",")+",.9)";
  ctx.beginPath();ctx.moveTo(-R*1.5,4);
  ctx.quadraticCurveTo(-R*1.05,-H0*.22,-R*.62,2);
  ctx.lineTo(R*.62,2);
  ctx.quadraticCurveTo(R*1.05,-H0*.20,R*1.5,4);
  ctx.closePath();ctx.fill();
  /* основание и погон */
  poiPoly([[-R*.58,2],[R*.58,2],[R*.44,-H0*.26],[-R*.44,-H0*.26]],
          poiBody(H0*.26,dark,lite),"rgba(0,0,0,.5)",1.6);
  poiPoly([[-R*.40,-H0*.24],[R*.40,-H0*.24],[R*.30,-H0*.40],[-R*.30,-H0*.40]],
          poiBody(H0*.4,dark,lite),"rgba(0,0,0,.5)",1.2);
  /* ствол: длинная труба от погона вверх, срез разорван «лепестками» */
  ctx.save();
  ctx.translate(0,-H0*.38);ctx.rotate(tilt);
  const L=H0*1.05, w=H0*.085;
  poiPoly([[-w*1.5,w*1.3],[L,w*.62],[L,-w*.62],[-w*1.5,-w*1.3]],
          poiBody(w*2,dark,lite),"rgba(0,0,0,.5)",1);
  /* бандажи по стволу — то, чем труба отличается от палки */
  for(let i=1;i<=3;i++){
    const u=i/4.2;
    ctx.fillStyle="rgba(0,0,0,.34)";
    ctx.fillRect(L*u,-w*.9,Math.max(2,w*.22),w*1.75);
  }
  ctx.strokeStyle="rgba(238,228,200,.30)";ctx.lineWidth=1.1;   // блик сверху, солнце справа
  ctx.beginPath();ctx.moveTo(-w,-w*1.1);ctx.lineTo(L*.98,-w*.6);ctx.stroke();
  /* разрыв у среза: три лепестка наружу — ствол разорвало, а не отпилило */
  for(let i=0;i<3;i++){
    const a=(i-1)*.42+(s2-3.5)*.03;
    ctx.save();ctx.translate(L,0);ctx.rotate(a);
    poiPoly([[0,-w*.5],[w*1.5,-w*.9],[w*1.2,w*.2],[0,w*.5]],dark,"rgba(0,0,0,.5)",1.2);
    ctx.restore();
  }
  ctx.restore();
  /* короб подачи сбоку и вывалившийся стеллаж: видно, что её кормили */
  poiPoly([[R*.46,2],[R*.92,2],[R*.86,-H0*.20],[R*.5,-H0*.24]],
          poiBody(H0*.2,dark,lite),"rgba(0,0,0,.45)",1.4);
  for(let i=0;i<4;i++){
    const bx=-R*(.7+i*.22), by=2-h01(i,53,POI_SEED)*4;
    ctx.save();ctx.translate(bx,by);ctx.rotate((h01(i,59,POI_SEED)-.5)*1.5);
    ctx.fillStyle=dark;ctx.fillRect(-H0*.05,-H0*.03,H0*.1,H0*.06);
    ctx.strokeStyle="rgba(0,0,0,.5)";ctx.lineWidth=1;
    ctx.strokeRect(-H0*.05,-H0*.03,H0*.1,H0*.06);
    ctx.restore();
  }
  /* кабельная канава к гнезду: питание шло откуда-то ещё, и это читается */
  ctx.strokeStyle="rgba(0,0,0,.42)";ctx.lineWidth=Math.max(1.4,H0*.018);
  ctx.beginPath();ctx.moveTo(-R*1.5,3);
  ctx.quadraticCurveTo(-R*.9,-2,-R*.5,1);ctx.stroke();
}
function drawObelisk(q,r,dark,lite,pal){
  /* Разброс силуэта — не украшение, а смысл: зарубки резали в разное время
     разные руки и в спешке. Первый заход дал три камня по трём семенам,
     неотличимых глазом: наклон был ±0.04, ширина постоянной. Теперь от семени
     идут ширина (±35%), наклон, угол скола и то, куда камень заваливается. */
  const s1=(q.seed>>>3)&7, s2=(q.seed>>>7)&7, s3=(q.seed>>>11)&7;
  const w=q.h*(.13+s1*.011), tilt=(s2-3.5)*.030;
  ctx.save();
  ctx.rotate(tilt);
  poiDrift(w*2.2,pal);
  /* тело: книзу шире, вершина сколота наискось — целая плита читается плитой.
     Заливка — камень (`dark`), а не чернота: первый заход дал силуэт-дыру,
     который рядом с рельефом читался вырезанным отверстием, а не породой. */
  const cut=q.h*(.04+s3*.022);                       // скол вершины: от лёгкого до косого
  const lean=(s3%2?1:-1)*w*.10;                      // куда заваливается верх
  const P=poiPoly([[-w,0],[w,0],[w*.72+lean,-q.h+cut],[-w*.62+lean,-q.h]],
                  dark,"rgba(0,0,0,.55)",.7);
  /* объём: солнце справа (см. drawSkyLayer), поэтому правая треть светлее,
     левая уходит в тень. Без этого плита остаётся плоской заливкой. */
  ctx.save();ctx.clip(P);
  const g=ctx.createLinearGradient(-w,0,w,0);
  g.addColorStop(0,"rgba(0,0,0,.42)");
  g.addColorStop(.55,"rgba(0,0,0,0)");
  g.addColorStop(1,"rgba(255,244,214,.16)");
  ctx.fillStyle=g;ctx.fillRect(-w*1.2,-q.h-4,w*2.4,q.h+8);
  ctx.restore();
  /* Световая кромка со стороны солнца. Была в 1.6 px и .5 — на стенде читалась
     неоновой трубкой, приклеенной к камню. Кромка — это блик на сколе, она
     тоньше линии контура и не ярче песка под ногами. */
  ctx.strokeStyle="rgba(238,228,200,.34)";ctx.lineWidth=1.1;
  ctx.beginPath();ctx.moveTo(w,0);ctx.lineTo(w*.72,-q.h+cut);ctx.stroke();
  /* засечки: это счёт, а не орнамент. Первый заход дал ровные ряды ровной
     штриховки — обои, и это было записано в план как невыправленный изъян.
     Счёт выглядит иначе: палочки сбиты в пятёрки (четыре и перечёркивающая),
     ряды идут сверху вниз и книзу редеют — снизу резать неудобно, туда лезли
     реже, — часть рядов перечёркнута целиком (срок закрыт), а последняя
     группа недобрана: считать перестали посреди пятёрки.
     Врез — тёмная канавка со светлой нижней кромкой, иначе на расстоянии
     его нет. Ничего не «зажигаем»: камень не работает. */
  let sd=((q.seed^0x9E3779B9)>>>0)||1;
  const nr=()=>((sd=(sd*1664525+1013904223)>>>0)/4294967296);
  const cut1=(x0,y0,x1,y1,a)=>{
    ctx.strokeStyle="rgba(0,0,0,"+a.toFixed(2)+")";
    ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();
    ctx.strokeStyle="rgba(236,226,200,"+(a*.55).toFixed(2)+")";
    ctx.beginPath();ctx.moveTo(x0,y0+1.2);ctx.lineTo(x1,y1+1.2);ctx.stroke();
  };
  ctx.lineWidth=1.1;
  const rows=5+((q.seed>>>2)%4);
  const tick=w*.30;                                  // высота палочки
  let yy=-q.h*.80;                                   // счёт начинали сверху
  for(let i=0;i<rows;i++){
    const t=i/Math.max(1,rows-1);                    // 0 сверху → 1 внизу
    /* книзу групп меньше: три наверху, одна у земли */
    const groups=Math.max(1,Math.round(3-t*2+(nr()<.25?1:0)-(nr()<.2?1:0)));
    const last=(i===rows-1);
    /* Грань сужается кверху и заваливается — значит поле счёта на каждой
       высоте своё. Первый вариант резал по постоянной ширине, и у узких
       камней верхние ряды вылезали за грань в воздух. */
    const u=Math.min(1,-yy/q.h);
    const eR=lerp(w,w*.72+lean,u)*.80, eL=lerp(-w,-w*.62+lean,u)*.80;
    let x=eL+nr()*w*.08;
    const x0row=x;
    for(let g=0;g<groups;g++){
      /* последняя группа последнего ряда недобрана — счёт оборвался */
      const full=!(last&&g===groups-1)||nr()<.25;
      const n=full?4:1+Math.floor(nr()*3);
      const step=w*(.085+nr()*.02);
      for(let j=0;j<n;j++){
        const xx=x+j*step, jt=(nr()-.5)*tick*.22;    // рука дрожит
        cut1(xx,yy+jt,xx+(nr()-.5)*w*.05,yy-tick+jt,.52);
      }
      /* пятая, перечёркивающая — только у добранной группы */
      if(full&&n===4)
        cut1(x-w*.03,yy-tick*.18,x+step*3+w*.04,yy-tick*.82,.5);
      x+=step*(n-1)+w*(.10+nr()*.03);
      if(x>eR-w*.10)break;
    }
    /* закрытый срок: ряд перечёркнут одной длинной чертой поверх всего */
    if(nr()<.22)cut1(x0row-w*.06,yy-tick*.5+(nr()-.5)*3,x+w*.03,yy-tick*.5,.46);
    yy+=q.h*(.085+nr()*.055);                        // шаг неровный
    if(yy>-q.h*.10)break;
  }
  /* Тень у подножия. Первый заход дал круглое чёрное пятно — камень выглядел
     вырезанным из бумаги и наклеенным. У плиты, стоящей в пыли, тень уходит
     от солнца (оно справа, см. `drawSkyLayer`), она вытянута, мягкая по краю
     и никогда не чёрная: пыль подсвечена. Плюс юбка наносов у самого камня —
     то, что нанесло ветром за годы. */
  const shx=-w*.55, shw=w*2.9, shh=w*.46;
  ctx.save();ctx.translate(shx,0);ctx.scale(1,shh/shw);
  const sg=ctx.createRadialGradient(0,0,w*.15,0,0,shw);
  sg.addColorStop(0,"rgba(14,10,6,.34)");
  sg.addColorStop(.55,"rgba(18,13,8,.16)");
  sg.addColorStop(1,"rgba(20,15,9,0)");
  ctx.fillStyle=sg;
  ctx.beginPath();ctx.arc(0,0,shw,0,TAU);ctx.fill();ctx.restore();
  /* наносы: светлее породы, шире с наветренной стороны */
  ctx.fillStyle="rgba(236,226,200,.07)";
  ctx.beginPath();ctx.ellipse(w*.18,-w*.03,w*1.5,w*.20,0,0,TAU);ctx.fill();
  ctx.restore();
}
/* ── заброшенный завод: башни, трубы, баки; из одной трубы ещё идёт дым ── */
function drawFactory(q,r,dark,lite,pal){
  const w=q.h*1.4;

  poiDrift(w*.7,pal);
  /* ржавчина: завод стоял тут долго, и это единственное, что отличает его
     цвет от свежей постройки */
  const rust="rgba("+(90+Math.floor(r()*40))+",48,26,";
  /* башни: у каждой свой венец, рёбра и лестница — плоская плита читается
     ровно как плита, сколько её ни выветривай */
  const towers=4+Math.floor(r()*3);
  for(let i=0;i<towers;i++){
    const tx=-w*.5+(i+.5)/towers*w+(r()-.5)*w*.06;
    const th=q.h*(.4+r()*.6), tw=w*.05*(.7+r()*.9);
    const lean=(r()-.5)*.05;
    ctx.save();ctx.translate(tx,0);ctx.rotate(lean);
    poiPoly([[-tw,0],[tw,0],[tw*.82,-th],[-tw*.82,-th]],poiBody(th,dark,lite),"rgba(0,0,0,.45)",2.6);
    /* венец трубы шире тела — по нему силуэт и опознаётся как труба */
    poiPoly([[-tw*1.15,-th],[tw*1.15,-th],[tw*1.05,-th-tw*.5],[-tw*1.05,-th-tw*.5]],
      poiBody(tw*.5,dark,lite),"rgba(0,0,0,.5)",1.8);
    /* стяжные обручи */
    for(let k=1;k<5;k++){
      ctx.fillStyle="rgba(0,0,0,.30)";
      ctx.fillRect(-tw*.95,-th*k/5,tw*1.9,2.2);
      ctx.fillStyle=rust+".18)";
      ctx.fillRect(-tw*.95,-th*k/5+2.2,tw*1.9,1.4);
    }
    /* лестница на теневой стороне */
    if(tw>w*.045){
      ctx.strokeStyle="rgba(0,0,0,.4)";ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(-tw*.5,-2);ctx.lineTo(-tw*.5,-th*.92);
      ctx.moveTo(-tw*.28,-2);ctx.lineTo(-tw*.28,-th*.92);ctx.stroke();
      for(let k=0;k<Math.floor(th/9);k++){
        ctx.beginPath();ctx.moveTo(-tw*.5,-6-k*9);ctx.lineTo(-tw*.28,-6-k*9);ctx.stroke();
      }
    }
    ctx.restore();
    if(i===1){   // единственная живая труба
      const sm=(G.t*.5)%400;
      for(let s=0;s<8;s++){
        const t=((sm+s*50)%400)/400;
        ctx.fillStyle="rgba(184,188,196,"+(.13*(1-t)).toFixed(3)+")";
        ctx.beginPath();ctx.arc(tx+Math.sin(t*4+q.seed)*t*30,-th-tw*.5-t*q.h*1.1,5+t*26,0,TAU);ctx.fill();
      }
    }
  }
  /* баки: цилиндр, а не круг. Идеальная окружность — самая заметная фигура
     в кадре, поэтому корпус собирается многоугольником с обручами и тенью. */
  for(let i=0;i<3;i++){
    const bx=-w*.40+r()*w*.8, br=q.h*(.09+r()*.07), bh=br*(1.1+r()*.7);
    ctx.save();ctx.translate(bx,0);
    const pts=[];
    const seg=14;
    for(let k=0;k<=seg;k++){const a=Math.PI+k/seg*Math.PI;pts.push([Math.cos(a)*br,-bh+Math.sin(a)*br*.34]);}
    pts.push([br,0]);pts.push([-br,0]);
    poiPoly(pts,poiBody(bh+br,dark,lite),"rgba(0,0,0,.45)",1.6);
    /* верхняя крышка отдельным эллипсом — она и даёт объём */
    ctx.fillStyle="rgba(255,255,255,.06)";
    ctx.beginPath();ctx.ellipse(0,-bh,br*.98,br*.32,0,0,TAU);ctx.fill();
    ctx.strokeStyle="rgba(0,0,0,.35)";ctx.lineWidth=1;ctx.stroke();
    for(let k=1;k<3;k++){
      ctx.fillStyle="rgba(0,0,0,.24)";ctx.fillRect(-br*.99,-bh*k/3,br*1.98,2);
    }
    /* потёк ржавчины из-под шва */
    ctx.fillStyle=rust+".22)";
    ctx.fillRect(-br*.35,-bh*.66,3.4,bh*.6);
    ctx.restore();
  }
  /* эстакада: сегменты на опорах с провисом, а не одна прямая через кадр */
  const py0=-q.h*.28;
  let px=-w*.52;
  ctx.strokeStyle=dark;
  while(px<w*.5){
    const seg=w*(.12+r()*.1), sag=4+r()*7;
    ctx.lineWidth=q.h*.02;
    ctx.beginPath();ctx.moveTo(px,py0+(r()-.5)*8);
    ctx.quadraticCurveTo(px+seg*.5,py0+sag,px+seg,py0+(r()-.5)*8);ctx.stroke();
    ctx.strokeStyle="rgba(0,0,0,.4)";ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(px+seg,py0);ctx.lineTo(px+seg+(r()-.5)*6,0);ctx.stroke();
    ctx.strokeStyle=dark;
    px+=seg;
  }
  /* аварийный огонь на дальней башне: точка внимания в мёртвом объекте */
  const fl=.5+.5*Math.sin(G.t*.035);
  poiGlow(w*.28,-q.h*.7,26,"255,120,60",.22*fl);
}
/* ── врата: стоящее кольцо, внутри — не этот мир ── */
function drawPortal(q,r,pal){
  const R=q.h*.42, cy=-q.h*.52;
  poiDrift(R*.9,pal);
  poiGlow(0,cy,R*2.6,"170,120,255",.22);
  /* внутренность: концентрические кольца, медленно вращающиеся */
  ctx.save();
  ctx.beginPath();ctx.arc(0,cy,R*.9,0,TAU);ctx.clip();
  const g=ctx.createRadialGradient(0,cy,0,0,cy,R);
  g.addColorStop(0,"rgba(240,225,255,.85)");
  g.addColorStop(.5,"rgba(140,90,220,.5)");
  g.addColorStop(1,"rgba(20,8,40,.85)");
  ctx.fillStyle=g;ctx.fillRect(-R,cy-R,R*2,R*2);
  ctx.strokeStyle="rgba(255,255,255,.16)";ctx.lineWidth=1.4;
  for(let i=0;i<5;i++){
    const rr=R*(.16+i*.19), a=G.t*.006*(i%2?1:-1);
    ctx.beginPath();ctx.ellipse(0,cy,rr,rr*.9,a,0,TAU);ctx.stroke();
  }
  ctx.restore();
  /* сама рама: два незамкнутых полукольца, между ними разрыв */
  ctx.strokeStyle="rgba(28,24,36,.95)";ctx.lineWidth=R*.16;
  ctx.beginPath();ctx.arc(0,cy,R,-.35,Math.PI-.35);ctx.stroke();
  ctx.beginPath();ctx.arc(0,cy,R,Math.PI+.1,TAU-.1);ctx.stroke();
  ctx.strokeStyle="rgba(200,170,255,.35)";ctx.lineWidth=1.4;
  ctx.beginPath();ctx.arc(0,cy,R*1.08,0,TAU);ctx.stroke();

}
/* ── обсерватория: купол с прорезью и тарелка, которая медленно ведёт по небу ── */
function drawObserv(q,r,dark,lite,pal){
  const R=q.h*.55;

  poiDrift(R*1.3,pal);
  poiPoly([[-R*1.05,0],[R*1.05,0],[R*.9,-q.h*.32],[-R*.9,-q.h*.32]],poiBody(q.h*.32,dark,lite),"rgba(0,0,0,.4)");
  ctx.fillStyle=poiBody(R,dark,lite);
  ctx.beginPath();ctx.arc(0,-q.h*.32,R*.9,Math.PI,TAU);ctx.fill();
  ctx.strokeStyle="rgba(0,0,0,.45)";ctx.lineWidth=1;ctx.stroke();
  /* прорезь — тёмная щель, из неё бьёт слабый свет */
  ctx.fillStyle="rgba(8,10,16,.9)";
  ctx.fillRect(-R*.12,-q.h*.32-R*.9,R*.24,R*.9);
  poiGlow(0,-q.h*.32-R*.5,R*.9,"140,220,255",.14);
  /* тарелка на отдельной опоре ведёт цель */
  ctx.save();
  ctx.translate(R*1.5,0);
  poiPoly([[-4,0],[4,0],[2.5,-q.h*.4],[-2.5,-q.h*.4]],dark,null);
  ctx.translate(0,-q.h*.4);
  ctx.rotate(-1.1+Math.sin(G.t*.0026+(q.seed&31))*.5);
  ctx.beginPath();ctx.ellipse(0,0,R*.5,R*.2,0,0,TAU);
  ctx.fillStyle="rgba(180,195,205,.55)";ctx.fill();
  ctx.strokeStyle="rgba(0,0,0,.4)";ctx.stroke();
  ctx.restore();
}
/* ближайшая точка интереса — для навигатора сверху */
