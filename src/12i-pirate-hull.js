/* ══════════════ пиратский корпус ══════════════
   Пират не покупает корабль — он варит его из трёх чужих, и это его язык формы.
   Раньше он рисовался тем же `drawHull`, что и ваш кораблик: полтора десятка
   полигонов, аккуратная симметрия, чистые панели. Главный противник игры
   выглядел как вы в чужой шапке.

   Здесь корпус собирается из кусков (нос, хребет, боковые модули, клетки под
   добычу, движки) — шесть-восемь десятков полигонов, асимметрия правилом, а не
   шумом: слева пилон, справа бак, и они разной эпохи. Поверх — навесное:
   заплаты внахлёст, шипы, крюки, турели на растяжках, ржавые потёки от каждого
   шва.

   Сто полигонов на восемь кораблей в кадре стоили бы дороже всего остального
   мира, поэтому каждый пират ОДИН РАЗ выпекается в свою офскрин-канву по seed и
   дальше рисуется картинкой с поворотом — тот же приём, что кэш неба у гиганта
   и тайл материала. */
const PIR_SS=3;                        // выпекаем крупнее и рисуем мельче
const PIR_ART={};
/* четыре класса опознаются с одного взгляда — это и есть смысл затеи */
const PIR_CLASS={
  fast:{ru:"перехватчик",len:46,bw:.15,eng:2,engL:1.5,cage:0,plate:0,spike:3,ram:0},
  raid:{ru:"налётчик",   len:54,bw:.24,eng:2,engL:1,   cage:3,plate:0,spike:2,ram:0},
  heavy:{ru:"тяжёлый",   len:62,bw:.30,eng:3,engL:.8,  cage:1,plate:6,spike:6,ram:1},
  flag:{ru:"флагман",    len:66,bw:.26,eng:4,engL:1.1, cage:2,plate:4,spike:5,ram:1}
};
function pirateClass(seed,rogue){
  if(rogue)return "flag";
  const r=rng(hashi(seed,0x9A17,3));
  const v=r();
  return v<.36?"fast":v<.74?"raid":"heavy";
}
/* ── сборка: список полигонов и навески в местных единицах корпуса ── */
function pirateBuild(seed,cls){
  const K=PIR_CLASS[cls],r=rng(hashi(seed,0x51D3,11));
  const L=K.len*(.9+r()*.25), hw=L*K.bw;
  const nose=L*.55, tail=-L*.45;
  const polys=[],lines=[],rust=[],eng=[],turrets=[];
  const add=(pts,c,e)=>polys.push({p:pts,c,e:e||0});
  /* ── тело: одна тёмная масса под всей сваркой ──
     Первый проход обошёлся без неё, и корабль рассыпался в конфетти: полсотни
     равноправных кусков без общего силуэта. Силуэт первым, детали потом —
     то же правило, что и в помещениях. */
  const bodyN=7, body=[];
  for(let i=0;i<=bodyN;i++){
    const t=i/bodyN, x=lerp(tail,nose*.92,t);
    body.push([x,-hw*(.9-t*.4+Math.sin(t*2.6)*.16)]);
  }
  for(let i=bodyN;i>=0;i--){
    const t=i/bodyN, x=lerp(tail,nose*.92,t);
    body.push([x,hw*(.95-t*.45+Math.sin(t*2.2+1.1)*.18)]);
  }
  const bodyTop=body.slice(0,bodyN+1);
  add(body,0);
  /* ── хребет: шесть-девять плит внахлёст, каждая своей ширины и с перекосом.
     Ровный профиль читается как штампованный корпус, а он сварен ── */
  const segN=6+Math.floor(r()*4);
  let px=tail;
  for(let i=0;i<segN;i++){
    const t=i/segN, t1=(i+1)/segN;
    const x0=lerp(tail,nose*.86,t), x1=lerp(tail,nose*.86,t1)+L*.02;
    /* профиль сходит на конус к носу: без этого сваренный ком не показывает,
       куда он летит, и в бою читается кляксой */
    const tap=q=>1-q*.45;
    const w0=hw*tap(t)*(.7+r()*.3), w1=hw*tap(t1)*(.7+r()*.3);
    const sk=(r()-.5)*hw*.18;           // перекос: плита села не ровно
    add([[x0,-w0+sk],[x1,-w1+sk],[x1,w1*(.8+r()*.5)+sk],[x0,w0*(.8+r()*.5)+sk]],i%2?3:1);
    /* шов между плитами — от него потом потечёт ржавчина */
    lines.push([x1,-w1+sk,x1,w1+sk,.5]);
    rust.push([x1,(r()-.5)*w1+sk,L*(.05+r()*.09)]);
    px=x1;
  }
  /* ── нос: клин или таран, но всегда несимметричный ── */
  if(K.ram){
    add([[nose+L*.20,0],[nose*.6,-hw*.55],[nose*.55,hw*.46]],3);
    add([[nose+L*.04,-hw*.12],[nose*.5,-hw*.62],[nose*.5,-hw*.1]],2);
    for(let i=0;i<3;i++)                 // зубья тарана
      add([[nose+L*.10-i*L*.05,hw*.1+i*hw*.16],[nose*.62-i*L*.04,hw*.05+i*hw*.16],
        [nose*.66-i*L*.04,hw*.3+i*hw*.16]],3);
  }else{
    add([[nose,-hw*.1],[nose*.62,-hw*.55],[nose*.6,hw*.3],[nose*.9,hw*.2]],2);
    add([[nose*.96,hw*.05],[nose*.55,hw*.2],[nose*.6,hw*.62]],1);
  }
  /* ── боковые модули: слева пилон, справа бак, и они разной эпохи ── */
  const pyx=lerp(tail*.5,nose*.3,r());
  add([[pyx-L*.12,-hw*1.12],[pyx+L*.16,-hw*1.2],[pyx+L*.13,-hw*.66],[pyx-L*.1,-hw*.6]],3);
  add([[pyx+L*.16,-hw*1.2],[pyx+L*.24,-hw*1.05],[pyx+L*.18,-hw*.78]],2);
  lines.push([pyx-L*.02,-hw*.6,pyx-L*.02,-hw*1.1,.8]);
  const tkx=lerp(tail*.7,nose*.1,r()), tkr=hw*(.18+r()*.12);
  for(let i=0;i<3;i++){                  // бак — гранёный цилиндр из трёх плит
    const a=i/3;
    add([[tkx-L*.13,hw*.62+tkr*a*1.6],[tkx+L*.15,hw*.6+tkr*a*1.6],
      [tkx+L*.15,hw*.62+tkr*(a+.34)*1.6],[tkx-L*.13,hw*.64+tkr*(a+.34)*1.6]],i?1:2);
  }
  rust.push([tkx+L*.1,hw*.9,L*.12]);
  /* ── клетки под добычу: у налётчика это половина силуэта ── */
  for(let i=0;i<K.cage;i++){
    const cx=lerp(tail*.85,nose*.2,(i+.4)/Math.max(1,K.cage)), cw=L*.13, ch=hw*(.5+r()*.4);
    const sg=i%2?1:-1;
    add([[cx-cw,sg*(hw*.7)],[cx+cw,sg*(hw*.7)],[cx+cw*.86,sg*(hw*.7+ch)],
      [cx-cw*.86,sg*(hw*.7+ch)]],0);
    /* прутья светлые и частые: тёмными клетка сливалась с бортом, и
       налётчик ничем не отличался от перехватчика */
    for(let b=0;b<6;b++){
      const bx=cx-cw+b*cw*.4;
      lines.push([bx,sg*hw*.7,bx,sg*(hw*.7+ch),.7,1]);
    }
    lines.push([cx-cw*.9,sg*(hw*.7+ch),cx+cw*.9,sg*(hw*.7+ch),1.1,1]);
  }
  /* ── движки: несинхронные, разной длины, у каждого своя фаза чада ── */
  for(let i=0;i<K.eng;i++){
    const ey=(i-(K.eng-1)/2)*hw*.9+(r()-.5)*hw*.3;
    const el=L*(.14+r()*.12)*K.engL, ew=hw*(.16+r()*.14);
    add([[tail+el,ey-ew],[tail-el*.2,ey-ew*1.3],[tail-el*.2,ey+ew*1.3],[tail+el,ey+ew]],3);
    add([[tail-el*.2,ey-ew*1.3],[tail-el*.5,ey-ew*.8],[tail-el*.5,ey+ew*.8],
      [tail-el*.2,ey+ew*1.3]],0);
    /* один движок всегда чадит заметно сильнее прочих: несинхронность видно
       по дыму раньше, чем по факелу */
    eng.push({x:tail-el*.45,y:ey,r:ew,ph:r()*TAU,dirty:i===0?2:(r()<.45?1:0)});
  }
  /* всё, что ниже, — навесное: в бою оно и отрывается первым. Граница нужна
     выпечке «побитого» силуэта (см. `pirateArtOf`) */
  const coreN=polys.length;
  /* ── навесное: заплаты внахлёст поверх швов ── */
  const patchN=8+Math.floor(r()*8);
  for(let i=0;i<patchN;i++){
    const x=lerp(tail*.9,nose*.7,r()), w=L*(.035+r()*.045), hh=hw*(.14+r()*.24);
    /* заплата ложится НА борт: вылезая за обвод, она читалась мусором,
       летящим рядом с кораблём */
    const y=(r()*2-1)*hw*.42;
    add([[x,y],[x+w,y-hh*.25],[x+w*.9,y+hh],[x-w*.1,y+hh*.8]],1,1);
    rust.push([x+w*.5,y+hh*.6,L*(.04+r()*.06)]);
  }
  /* ── шипы и крюки: пират цепляет, а не стреляет вежливо ── */
  for(let i=0;i<K.spike;i++){
    const x=lerp(tail*.6,nose*.8,r()), sg=r()<.5?-1:1, sw=L*.03, sl=hw*(.4+r()*.6);
    add([[x,sg*hw*.7],[x+sw,sg*hw*.7],[x+sw*.4,sg*(hw*.7+sl)]],3);
  }
  const hookN=2+Math.floor(r()*3);
  for(let i=0;i<hookN;i++){
    const x=lerp(tail*.4,nose*.5,r()), sg=r()<.5?-1:1;
    add([[x,sg*hw*.62],[x+L*.05,sg*hw*.66],[x+L*.04,sg*hw*.95],[x-L*.01,sg*hw*.86]],2);
  }
  /* ── турели на растяжках и антенны-удочки ── */
  const turN=2+Math.floor(r()*2);
  for(let i=0;i<turN;i++){
    const x=lerp(tail*.3,nose*.6,r()), sg=i%2?1:-1, ty=sg*hw*(1.2+r()*.6);
    turrets.push({x,y:ty,r:hw*(.16+r()*.1),a:(r()-.5)*.9});
    lines.push([x,sg*hw*.6,x,ty,.9]);
    lines.push([x-L*.05,sg*hw*.6,x,ty,.6]);
  }
  for(let i=0;i<2+Math.floor(r()*3);i++){
    const x=lerp(tail*.8,nose*.4,r()), sg=r()<.5?-1:1;
    lines.push([x,sg*hw*.5,x-L*(.04+r()*.08),sg*hw*(1.3+r()*.9),.5]);
  }
  /* ── плиты брони поверх всего: тяжёлый узнаётся по ним ── */
  for(let i=0;i<K.plate;i++){
    const x=lerp(tail*.5,nose*.7,i/Math.max(1,K.plate-1)+(r()-.5)*.1);
    const w=L*.09, hh=hw*(.5+r()*.3);
    add([[x,-hh*.4],[x+w,-hh*.5],[x+w*.94,hh*.6],[x-w*.06,hh*.5]],2,1);
    lines.push([x+w*.5,-hh*.4,x+w*.5,hh*.5,.4]);
  }
  /* ── мелочь по бортам: короба, вентили, трубы, обрезки чужой обшивки.
     Без неё корпус остаётся крупноблочным и снова читается штампованным: как
     раз на этой мелочи и держится «сварен из трёх чужих» ── */
  const greebN=30+Math.floor(r()*14);
  /* мелочь садится не поровну: у сваренного корабля один борт всегда обжитее
     другого. Равномерный разброс возвращал симметрию через чёрный ход — тот
     самый случайный шум вместо правила */
  const busy=r()<.5?-1:1;
  /* приваренная чужая секция — целый кусок другого корабля на одном борту.
     Она и делает асимметрию правилом: без неё разброс мелочи иногда сходился
     почти в зеркало, и пират снова выглядел штампованным */
  const wx=lerp(tail*.6,nose*.2,r()), wl=L*(.16+r()*.14), wh=hw*(.32+r()*.22);
  add([[wx,busy*hw*.6],[wx+wl,busy*hw*.75],[wx+wl*.86,busy*(hw*.6+wh)],
    [wx-wl*.08,busy*(hw*.6+wh*.82)]],2,1);
  add([[wx+wl*.1,busy*(hw*.6+wh*.5)],[wx+wl*.7,busy*(hw*.6+wh*.62)],
    [wx+wl*.66,busy*(hw*.6+wh*1.25)],[wx+wl*.16,busy*(hw*.6+wh*1.1)]],3);
  add([[wx-wl*.08,busy*(hw*.6+wh*.82)],[wx-wl*.3,busy*(hw*.6+wh*.6)],
    [wx-wl*.26,busy*(hw*.6+wh*.2)]],0);
  lines.push([wx,busy*hw*.6,wx+wl,busy*hw*.75,.9]);
  rust.push([wx+wl*.4,busy*(hw*.6+wh*.4),L*.12]);
  for(let i=0;i<greebN;i++){
    const x=lerp(tail*.95,nose*.75,r());
    /* мелочь садится НА корпус, а не вокруг него: в первом проходе она
       разбредалась за обвод и съедала силуэт целиком — вышло конфетти */
    const y=(r()<.72?busy:-busy)*Math.abs(r()*2-1)*hw*.55;
    const w=L*(.012+r()*.025), hh=hw*(.05+r()*.10);
    add([[x,y],[x+w,y-hh*.2],[x+w,y+hh],[x,y+hh*.9]],r()<.4?0:3);
    if(r()<.3)lines.push([x,y+hh*.5,x+w*(1.6+r()*2),y+hh*(.4+r()),.5]);
  }
  /* метки сбитых: короткие насечки на носовой плите, число — по seed */
  const kills=Math.floor(r()*7);
  for(let i=0;i<kills;i++)lines.push([nose*.45-i*L*.03,-hw*.35,nose*.45-i*L*.03,-hw*.12,1]);
  return {L,hw,nose,tail,polys,lines,rust,eng,turrets,cls,kills,top:bodyTop,coreN};
}
/* ── выпечка: один раз на seed, дальше — картинка с поворотом ── */
function pirateArtOf(id,rogue,hurt){
  /* побитый корабль — вторая выпечка, а не пятна поверх целой: пока силуэт
     оставался прежним, разбитый пират выглядел просто испачканным */
  const key=id+(rogue?"!r":"")+(hurt?"!h":"");
  if(PIR_ART[key])return PIR_ART[key];
  /* `shipData` знает все три источника корпусов: у ренегата это ВАШ корабль */
  const S=shipData(id)||{seed:hashi(1,2,3),col:"#d95a3c"};
  const cls=pirateClass(S.seed,rogue);
  const B=pirateBuild(S.seed,cls);
  const col=hex2rgb(S.col);
  /* палитра сварного корпуса: куски разной эпохи не совпадают по цвету, и
     именно это делает корабль сваренным, а не покрашенным */
  /* палитра идёт от тёмного: полный цвет — это акцент на нескольких кусках, а
     не заливка всего корабля. В первом проходе все полсотни деталей были одной
     светлоты, и силуэт исчезал вместе с ними */
  const C=[mixc(col,[8,10,14],.80),mixc(col,[12,14,20],.50),
    mixc(col,[255,240,220],.28),mixc(col,[30,34,42],.62)];
  const rad=B.L*.9;
  const cn=document.createElement("canvas");
  cn.width=cn.height=Math.ceil(rad*2*PIR_SS);
  const g=cn.getContext("2d");
  const prev=ctx;ctx=g;
  g.setTransform(PIR_SS,0,0,PIR_SS,rad*PIR_SS,rad*PIR_SS);
  /* флагман ренегата — это ВАШ корпус, обвешанный чужим: настоящий полётный
     силуэт ложится под сварку, и корабль узнаётся раньше, чем подпись */
  if(rogue){
    const h=hullOf(id), k=B.L/h.len;
    ctx.save();ctx.scale(k,k);
    tracePoly(h.poly);
    ctx.fillStyle=rgba(C[1],1);ctx.fill();
    ctx.strokeStyle="rgba(0,0,0,.5)";ctx.lineWidth=1/k;ctx.stroke();
    ctx.restore();
  }
  /* у побитого отрывает навесное и часть кормы: силуэт становится рваным,
     и подбитого видно по форме, а не только по полоске */
  const hr=rng(hashi(S.seed,0x8B17,7));
  const drop=[];
  if(hurt)for(let i=0;i<B.polys.length;i++)drop.push(i>=B.coreN?hr()<.55:false);
  for(let qi=0;qi<B.polys.length;qi++){
    const q=B.polys[qi];
    if(hurt&&drop[qi])continue;
    ctx.beginPath();ctx.moveTo(q.p[0][0],q.p[0][1]);
    for(let i=1;i<q.p.length;i++)ctx.lineTo(q.p[i][0],q.p[i][1]);
    ctx.closePath();
    ctx.fillStyle=rgba(C[q.c],1);ctx.fill();
    /* обводка каждой детали: без неё сварка сливается в одно пятно */
    ctx.strokeStyle="rgba(0,0,0,"+(q.e?.5:.22)+")";ctx.lineWidth=q.e?.8:.4;ctx.stroke();
  }
  /* ржавые потёки от швов: короткий градиент вниз по борту */
  for(const R of B.rust){
    const rg=ctx.createLinearGradient(R[0],R[1],R[0],R[1]+R[2]);
    rg.addColorStop(0,"rgba(120,62,32,.55)");rg.addColorStop(1,"rgba(120,62,32,0)");
    ctx.fillStyle=rg;ctx.fillRect(R[0]-R[2]*.16,R[1],R[2]*.32,R[2]);
  }
  for(const l of B.lines){
    ctx.strokeStyle=l[5]?"rgba(240,222,200,.5)":"rgba(0,0,0,"+(l[4]*.6).toFixed(2)+")";
    ctx.lineWidth=l[4];
    ctx.beginPath();ctx.moveTo(l[0],l[1]);ctx.lineTo(l[2],l[3]);ctx.stroke();
  }
  for(const t of B.turrets){
    ctx.fillStyle=rgba(C[0],1);ctx.strokeStyle="rgba(0,0,0,.5)";ctx.lineWidth=.6;
    ctx.beginPath();ctx.arc(t.x,t.y,t.r,0,TAU);ctx.fill();ctx.stroke();
    ctx.strokeStyle=rgba(C[2],.9);ctx.lineWidth=t.r*.5;
    ctx.beginPath();ctx.moveTo(t.x,t.y);
    ctx.lineTo(t.x+Math.cos(t.a)*t.r*2.6,t.y+Math.sin(t.a)*t.r*2.6);ctx.stroke();
  }
  /* у побитого выгрызаем куски самого корпуса: рваный силуэт узнаётся
     раньше, чем копоть на нём */
  if(hurt){
    ctx.globalCompositeOperation="destination-out";
    for(let i=0;i<3;i++){
      const bx=lerp(B.tail,B.nose*.4,hr()), by=(hr()<.5?-1:1)*B.hw*(.5+hr()*.6);
      /* пробоина из трёх наложенных кругов: один ровный круг читается дыркой
         дырокола, а не вырванным металлом */
      for(let j=0;j<3;j++){
        ctx.beginPath();
        ctx.arc(bx+(hr()-.5)*B.hw*.7,by+(hr()-.5)*B.hw*.7,
          B.hw*(.16+hr()*.3),0,TAU);
        ctx.fill();
      }
      /* рваная кромка: несколько треугольных выкусов по краю пробоины, иначе
         дыра остаётся ровной окружностью дырокола */
      for(let j=0;j<5;j++){
        const a=hr()*TAU, rr=B.hw*(.3+hr()*.3);
        ctx.beginPath();
        ctx.moveTo(bx+Math.cos(a)*rr,by+Math.sin(a)*rr);
        ctx.lineTo(bx+Math.cos(a+.5)*rr*1.5,by+Math.sin(a+.5)*rr*1.5);
        ctx.lineTo(bx+Math.cos(a-.3)*rr*1.3,by+Math.sin(a-.3)*rr*1.3);
        ctx.closePath();ctx.fill();
      }
    }
    ctx.globalCompositeOperation="source-atop";
    ctx.fillStyle="rgba(18,14,12,.3)";
    ctx.fillRect(-rad,-rad,rad*2,rad*2);
    ctx.globalCompositeOperation="source-over";
  }
  /* ── один свет на весь корабль ──
     Пока каждая деталь заливалась своим ровным цветом, корабль оставался кучей
     равноправных пятен: у сварки не было ни верха, ни низа. Свет кладётся
     последним по всей выпечке разом (`source-atop` — только по нарисованному),
     и куски сразу становятся одним телом, освещённым сверху. */
  ctx.globalCompositeOperation="source-atop";
  const lg=ctx.createLinearGradient(0,-B.hw*1.5,0,B.hw*1.6);
  lg.addColorStop(0,"rgba(255,238,214,.34)");
  lg.addColorStop(.42,"rgba(255,220,190,0)");
  lg.addColorStop(1,"rgba(0,0,0,.5)");
  ctx.fillStyle=lg;ctx.fillRect(-rad,-rad,rad*2,rad*2);
  ctx.globalCompositeOperation="source-over";
  const bodyTop=B.top;
  /* верхняя кромка ловит свет — по ней и читается силуэт на тёмном космосе */
  ctx.strokeStyle="rgba(255,236,214,.5)";ctx.lineWidth=.7;
  ctx.beginPath();
  for(let i=0;i<=bodyTop.length-1;i++){
    const p=bodyTop[i];i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);
  }
  ctx.stroke();
  ctx=prev;
  const art={cn,rad,B,cls,cols:C,ru:PIR_CLASS[cls].ru};
  PIR_ART[key]=art;return art;
}
/* ── рисование: картинка плюс живой слой, который печь нельзя ──
   Повреждения копятся вместе с hp, выхлоп грязный и несинхронный — и то и
   другое меняется каждый кадр, поэтому идёт поверх выпечки. */
function drawPirate(p){
  const hp=clamp((p.hull||0)/(p.hullMax||1),0,1);
  /* ниже половины берём вторую выпечку — рваный корпус, а не тот же силуэт
     в пятнах. Обе картинки живут в кэше и считаются по одному разу */
  /* охотник (12o) печётся флагманской выпечкой, как ренегат: его силуэт должен
     опознаваться в бою с одного взгляда */
  const art=pirateArtOf(p.shipId,p.rogue||p.hunter,hp<.5);
  const B=art.B;
  /* выхлоп: чад из закопчённых сопел, у каждого своя фаза — один обязательно
     чадит сильнее прочих */
  for(const e of B.eng){
    if(p.thrust)drawFlame(e.x,e.y,e.r*.9,.8+Math.sin(G.t*.2+e.ph)*.2);
    if(e.dirty||hp<.6){
      const puffs=(e.dirty===2?5:3);
      for(let i=0;i<puffs;i++){
        const t=((G.t*.03+i*.7+e.ph)%3);
        ctx.fillStyle="rgba(60,54,50,"+((e.dirty===2?.38:.28)-t*.09).toFixed(2)+")";
        ctx.beginPath();ctx.arc(e.x-t*7,e.y+Math.sin(t*2+e.ph)*2,1.6+t*2.4,0,TAU);ctx.fill();
      }
    }
  }
  ctx.drawImage(art.cn,-art.rad,-art.rad,art.rad*2,art.rad*2);
  /* ── повреждения: раньше урон читался только полоской над кораблём ── */
  if(hp<.85){
    const r=rng(hashi(p.seed||1,0x0D06,5));
    /* пятен поверх меньше, когда силуэт уже рваный: иначе копоть удваивается */
    const n=Math.round((1-hp)*(hp<.5?3:7));
    for(let i=0;i<n;i++){
      const x=lerp(B.tail,B.nose*.8,r()), y=(r()*2-1)*B.hw*.7, s=B.hw*(.1+r()*.18);
      ctx.fillStyle="rgba(18,14,12,.85)";
      ctx.beginPath();ctx.arc(x,y,s,0,TAU);ctx.fill();
      ctx.strokeStyle="rgba(255,120,60,.35)";ctx.lineWidth=.7;ctx.stroke();
    }
    /* из пробоины бьёт факел: сама пробоина уже вырезана в выпечке */
    if(hp<.5){
      const bx=B.tail+B.L*.35, by=B.hw*.55;
      const f=B.hw*(.32+Math.sin(G.t*.31)*.1);
      const fg=ctx.createRadialGradient(bx,by,0,bx,by,f*2.2);
      fg.addColorStop(0,"rgba(255,220,150,.6)");fg.addColorStop(.4,"rgba(255,130,60,.3)");
      fg.addColorStop(1,"rgba(255,80,40,0)");
      ctx.fillStyle=fg;ctx.beginPath();ctx.arc(bx,by,f*1.5,0,TAU);ctx.fill();
    }
    if(hp<.3){          // дым тянется за подбитым и виден издалека
      for(let i=0;i<4;i++){
        const t=((G.t*.02+i*.8)%4);
        ctx.fillStyle="rgba(40,36,34,"+(.34-t*.08).toFixed(2)+")";
        ctx.beginPath();ctx.arc(B.tail-t*9,B.hw*.3+Math.sin(t*1.7+i)*4,2+t*3.4,0,TAU);ctx.fill();
      }
    }
  }
}
