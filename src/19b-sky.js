/* ══════════════ небо ══════════════ */
/* Небо занимает половину кадра и до сих пор было градиентом с пятью эллипсами.
   Теперь у каждой планеты своя композиция, детерминированная от её seed.

   Главное правило — бюджет громкости, а не «побольше всего». Галактика во всю
   высоту и чёрная дыра в одном кадре спорят друг с другом и обе проигрывают,
   поэтому громкий объект в сцене один, к нему добавляется два-три тихих.
   Пустое небо тоже результат: без пустоты газовый гигант над горизонтом не
   производит впечатления.

   Плотная атмосфера гасит всё небесное вдвое — значит, самые сильные виды
   достаются безвоздушным миром, где игрок и так чувствует себя одиноко. */
const SKY_LOUD=["giant","world","galaxy","hole","aurora","world"];
const SKY_QUIET=["moon","moon","nebula","comet","pulsar","field","rings","world"];
function skyScene(p){
  if(p.sky2)return p.sky2;
  const r=rng((p.seed^0x5C1E)>>>0);
  const S=[];
  /* один громкий — и только если повезёт: половина планет остаётся с тихим
     небом, иначе «особенное» становится фоном */
  if(r()<.62){
    const k=SKY_LOUD[Math.floor(r()*SKY_LOUD.length)];
    /* громкое тело ставится ниже приборной панели: наверху слева датчики,
       справа сводка и колонка кнопок, и половина диска пропадала под ними */
    S.push({k,x:.14+r()*.62,y:.20+r()*.20,s:.7+r()*.8,seed:(r()*1e9)|0,ph:r()*TAU});
  }
  const nq=1+Math.floor(r()*3);
  for(let i=0;i<nq;i++){
    const k=SKY_QUIET[Math.floor(r()*SKY_QUIET.length)];
    S.push({k,x:.06+r()*.88,y:.06+r()*.34,s:.6+r()*.9,seed:(r()*1e9)|0,ph:r()*TAU});
  }
  p.sky2=S;
  return S;
}
/* цветовая связка: небесное берёт оттенок от звезды системы и от палитры
   планеты, поэтому кадр остаётся одной картинкой, а не набором наклеек */
function skyTint(p,i){
  const c=p.T.pal[clamp(i,0,p.T.pal.length-1)];
  return c;
}
/* туманность: тайл считается один раз на планету, дальше только растягивается */
function skyNebula(p,seed){
  if(p.neb)return p.neb;
  const S=128,cn=document.createElement("canvas");cn.width=cn.height=S;
  const c=cn.getContext("2d"),img=c.createImageData(S,S),d=img.data;
  const t1=skyTint(p,4),t2=skyTint(p,2);
  const sd=(seed^0x9AB)>>>0;
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){
    const o=(y*S+x)*4,u=x/S,v=y/S;
    const a=clamp((tfbm(u,v,3,sd,5)-.44)*2.6,0,1);
    const b=clamp((tfbm(u,v,5,sd+77,4)-.47)*2.4,0,1);
    d[o]  =clamp(t1[0]*a+t2[0]*b*.7,0,255);
    d[o+1]=clamp(t1[1]*a+t2[1]*b*.7,0,255);
    d[o+2]=clamp(t1[2]*a+t2[2]*b*.9+40*b,0,255);
    d[o+3]=clamp((Math.pow(a,1.9)*.66+Math.pow(b,2.2)*.4)*255,0,255);
  }
  c.putImageData(img,0,0);p.neb=cn;return cn;
}
function drawSkyBodies(p,camx,camy){
  const S=skyScene(p);if(!S.length)return;
  const atm=p.T.atm!=="отсутствует";
  const dim=atm?.42:1;                       // воздух гасит небо
  /* параллакс считается от середины мира, а не от нуля: при отсчёте от нуля
     к середине планеты сдвиг доходил до трети экрана и вся композиция уезжала
     за левую кромку. Ход зажат — небо далеко, оно почти не движется. */
  const tw=(G.surf&&G.surf.tr?G.surf.tr.W:(G.land&&G.land.tr?G.land.tr.W:9000));
  const px=clamp(-(camx-tw*.5)*.02,-W*.10,W*.10);
  const py=clamp(-camy*.02,-H*.06,H*.06);
  for(const e of S){
    const x=e.x*W+px, y=e.y*H+py;
    if(e.k==="giant")skyGiant(p,e,x,y,dim);
    else if(e.k==="rings")skyGiant(p,e,x,y,dim,true);
    else if(e.k==="galaxy")skyGalaxy(p,e,x,y,dim);
    else if(e.k==="hole")skyHole(p,e,x,y,dim);
    else if(e.k==="aurora")skyAurora(p,e,x,y,dim);
    else if(e.k==="moon")skyMoon(p,e,x,y,dim);
    else if(e.k==="nebula")skyNeb(p,e,x,y,dim);
    else if(e.k==="comet")skyComet(p,e,x,y,dim);
    else if(e.k==="pulsar")skyPulsar(p,e,x,y,dim);
    else if(e.k==="field")skyField(p,e,x,y,dim);
    else if(e.k==="world")skyWorld(p,e,x,y,dim);
  }
}
/* ── соседний мир ──
   Плоский цветной кружок в небе выдаёт себя мгновенно. Настоящее тело узнаётся
   по четырём вещам: очертания материков, полярные шапки, вихри облаков и
   светящаяся кромка атмосферы. Текстура считается один раз на тело (96×96) и
   дальше только рисуется — как и всё остальное дорогое в этой игре.

   Своё небесное тело у каждого элемента сцены, поэтому кэш живёт на нём. */
const SKY_WORLD_KINDS=[
  {k:"ocean",  sea:[18,52,96], land:[54,96,64],  cap:[228,240,246], cloud:.55},
  {k:"desert", sea:[128,88,48],land:[176,132,80],cap:[226,214,190], cloud:.18},
  {k:"jungle", sea:[16,58,74], land:[40,104,58],  cap:[210,226,222], cloud:.42},
  {k:"toxic",  sea:[54,62,20], land:[104,124,40], cap:[190,200,140], cloud:.5},
  {k:"ice",    sea:[92,124,156],land:[176,206,226],cap:[246,250,252],cloud:.3},
  {k:"lava",   sea:[52,14,10], land:[120,36,18],  cap:[86,40,30],    cloud:.22},
  {k:"metal",  sea:[46,48,54], land:[104,108,118],cap:[168,172,180], cloud:.10}
];
function skyWorldTex(e){
  if(e.tex)return e.tex;
  const S=96,cn=document.createElement("canvas");cn.width=cn.height=S;
  const c=cn.getContext("2d"),img=c.createImageData(S,S),d=img.data;
  const K=SKY_WORLD_KINDS[e.seed%SKY_WORLD_KINDS.length];
  e.kind=K;
  const sd=(e.seed^0x77A9)>>>0;
  /* сколько на этом мире суши: от почти сплошного океана до почти сплошной
     пустыни — по одному взгляду видно, что это другой мир, а не другой цвет */
  const sea=.34+((sd>>>7)&255)/255*.34;
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){
    const o=(y*S+x)*4;
    const nx=(x+.5)/S*2-1, ny=(y+.5)/S*2-1, r2=nx*nx+ny*ny;
    if(r2>1){d[o+3]=0;continue;}
    const nz=Math.sqrt(1-r2);
    /* проекция на шар: у кромки детали сжимаются, из-за этого диск и читается
       как шар, а не как круглая картинка */
    const lon=Math.atan2(nx,nz), lat=Math.asin(clamp(ny,-1,1));
    const h=fbm2(lon*1.9+7,lat*1.9+3,sd,5);
    const land=h>sea;
    let col;
    if(land){
      const t=clamp((h-sea)/(1-sea),0,1);
      col=[lerp(K.sea[0],K.land[0],.35+t*.8),lerp(K.sea[1],K.land[1],.35+t*.8),
           lerp(K.sea[2],K.land[2],.35+t*.8)];
    }else{
      const t=clamp(h/sea,0,1);
      col=[K.sea[0]*(.7+t*.4),K.sea[1]*(.7+t*.4),K.sea[2]*(.7+t*.4)];
    }
    /* полярные шапки: по широте, с рваной кромкой — ровный колпак читается
       наклейкой */
    const capEdge=1.16-fbm2(lon*3,lat*2+11,sd+31,3)*.34;
    const la=Math.abs(lat)/1.5708;
    if(la>capEdge*.78){
      const w=clamp((la-capEdge*.78)/.3,0,1);
      col=[lerp(col[0],K.cap[0],w),lerp(col[1],K.cap[1],w),lerp(col[2],K.cap[2],w)];
    }
    /* облачные вихри: отдельный слой шума, вытянутый по широте */
    const cl=clamp((fbm2(lon*2.6+21,lat*5.2+5,sd+53,4)-.52)*3.4,0,1)*K.cloud;
    col=[lerp(col[0],238,cl),lerp(col[1],242,cl),lerp(col[2],246,cl)];
    d[o]=clamp(col[0],0,255);d[o+1]=clamp(col[1],0,255);d[o+2]=clamp(col[2],0,255);
    d[o+3]=255;
  }
  c.putImageData(img,0,0);
  e.tex=cn;return cn;
}
function skyWorld(p,e,x,y,dim){
  const T=skyWorldTex(e);
  const R=H*(e.k==="world"?.12:.09)*e.s;
  const K=e.kind||SKY_WORLD_KINDS[0];
  ctx.save();
  ctx.globalAlpha=dim*.96;
  /* кромка атмосферы: тонкий светящийся ободок снаружи диска. Он и отличает
     мир с воздухом от камня, и стоит один градиент */
  const ag=ctx.createRadialGradient(x,y,R*.94,x,y,R*1.22);
  ag.addColorStop(0,"rgba("+K.sea.map(v=>Math.round(v*.6+90)).join(",")+",.34)");
  ag.addColorStop(1,"rgba("+K.sea.join(",")+",0)");
  ctx.fillStyle=ag;ctx.beginPath();ctx.arc(x,y,R*1.22,0,TAU);ctx.fill();
  ctx.save();
  ctx.beginPath();ctx.arc(x,y,R,0,TAU);ctx.clip();
  ctx.drawImage(T,x-R,y-R,R*2,R*2);
  /* ночная сторона и мягкий терминатор */
  const tg=ctx.createLinearGradient(x+R*.1,y,x+R*1.02,y);
  tg.addColorStop(0,"rgba(0,0,0,0)");tg.addColorStop(1,"rgba(2,4,10,.88)");
  ctx.fillStyle=tg;ctx.fillRect(x-R,y-R,R*2,R*2);
  /* и подсвет со стороны звезды — без него шар плоский */
  const lg=ctx.createRadialGradient(x-R*.42,y-R*.38,0,x-R*.42,y-R*.38,R*1.5);
  lg.addColorStop(0,"rgba(255,246,226,.20)");
  lg.addColorStop(1,"rgba(255,246,226,0)");
  ctx.fillStyle=lg;ctx.fillRect(x-R,y-R,R*2,R*2);
  ctx.restore();
  ctx.strokeStyle="rgba(255,248,232,"+(.26*dim).toFixed(2)+")";
  ctx.lineWidth=1.4;
  ctx.beginPath();ctx.arc(x,y,R,Math.PI*.58,Math.PI*1.46);ctx.stroke();
  ctx.restore();
}
/* ── газовый гигант: полосы, терминатор, кромочный свет, иногда кольца ── */
function skyGiant(p,e,x,y,dim,ringy){
  const R=H*.17*e.s*(ringy?.8:1);
  const r=rng(e.seed);
  const c1=skyTint(p,3),c2=skyTint(p,1);
  ctx.save();
  ctx.globalAlpha=dim*.95;
  /* кольца за диском */
  const hasRing=ringy||r()<.45;
  const tilt=-.28-r()*.4;
  if(hasRing){
    ctx.save();ctx.translate(x,y);ctx.rotate(tilt);
    ctx.strokeStyle="rgba("+c1.join(",")+",.30)";
    for(let i=0;i<5;i++){
      ctx.lineWidth=R*(.03+i*.012);
      ctx.beginPath();ctx.ellipse(0,0,R*(1.35+i*.16),R*(.30+i*.05),0,Math.PI,TAU);ctx.stroke();
    }
    ctx.restore();
  }
  /* диск с полосами */
  ctx.save();
  ctx.beginPath();ctx.arc(x,y,R,0,TAU);ctx.clip();
  const g=ctx.createLinearGradient(x-R,y-R,x+R*.6,y+R);
  g.addColorStop(0,"rgb("+c1.map(v=>Math.round(v*.95+20)).join(",")+")");
  g.addColorStop(1,"rgb("+c2.map(v=>Math.round(v*.35)).join(",")+")");
  ctx.fillStyle=g;ctx.fillRect(x-R,y-R,R*2,R*2);
  /* полосы: вытянутые эллипсы разной светлоты, чуть смещённые — читается
     как вращающаяся атмосфера, а не как штрихи */
  const nb=5+Math.floor(r()*5);
  for(let i=0;i<nb;i++){
    const by=y-R+ (i+.5)/nb*R*2 + Math.sin(G.t*.0006+i)*R*.02;
    const bh=R*(.06+r()*.14);
    const w=r()<.5?1:-1;
    ctx.fillStyle="rgba("+(w>0?"255,255,255":"0,0,0")+","+(.05+r()*.10).toFixed(3)+")";
    ctx.beginPath();ctx.ellipse(x+Math.sin(i)*R*.1,by,R*1.05,bh,0,0,TAU);ctx.fill();
  }
  /* большое пятно-вихрь — то, из-за чего гигант запоминается */
  if(r()<.6){
    const sx=x+(r()-.5)*R*.9, sy=y+(r()-.5)*R*.9;
    const sg=ctx.createRadialGradient(sx,sy,0,sx,sy,R*.26);
    sg.addColorStop(0,"rgba(255,190,150,.34)");
    sg.addColorStop(1,"rgba(255,190,150,0)");
    ctx.fillStyle=sg;ctx.beginPath();ctx.ellipse(sx,sy,R*.26,R*.15,0,0,TAU);ctx.fill();
  }
  /* терминатор: ночная сторона гасится, а не рисуется отдельной фигурой */
  const tg=ctx.createLinearGradient(x+R*.15,y,x+R*1.05,y);
  tg.addColorStop(0,"rgba(0,0,0,0)");tg.addColorStop(1,"rgba(0,0,0,.86)");
  ctx.fillStyle=tg;ctx.fillRect(x-R,y-R,R*2,R*2);
  ctx.restore();
  /* кромочный свет со стороны звезды */
  ctx.strokeStyle="rgba(255,240,215,"+(.30*dim).toFixed(2)+")";
  ctx.lineWidth=1.6;
  ctx.beginPath();ctx.arc(x,y,R,Math.PI*.62,Math.PI*1.42);ctx.stroke();
  /* кольца перед диском */
  if(hasRing){
    ctx.save();ctx.translate(x,y);ctx.rotate(tilt);
    ctx.strokeStyle="rgba("+c1.join(",")+",.42)";
    for(let i=0;i<5;i++){
      ctx.lineWidth=R*(.03+i*.012);
      ctx.beginPath();ctx.ellipse(0,0,R*(1.35+i*.16),R*(.30+i*.05),0,0,Math.PI);ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}
/* ── галактика: ядро, диск под углом, пылевая полоса ── */
function skyGalaxy(p,e,x,y,dim){
  const R=H*.30*e.s, r=rng(e.seed), tilt=(r()-.5)*1.5;
  ctx.save();ctx.globalAlpha=dim*.8;
  ctx.translate(x,y);ctx.rotate(tilt);
  const t1=skyTint(p,4);
  for(let i=4;i>=0;i--){
    const rr=R*(.35+i*.19);
    const g=ctx.createRadialGradient(0,0,0,0,0,rr);
    g.addColorStop(0,"rgba(255,246,230,"+(.10+.05*i).toFixed(3)+")");
    g.addColorStop(.55,"rgba("+t1.join(",")+","+(.05+.02*i).toFixed(3)+")");
    g.addColorStop(1,"rgba("+t1.join(",")+",0)");
    ctx.fillStyle=g;
    ctx.beginPath();ctx.ellipse(0,0,rr,rr*.24,0,0,TAU);ctx.fill();
  }
  /* пылевая полоса вдоль плоскости — без неё это просто светлое пятно */
  ctx.fillStyle="rgba(20,12,26,.42)";
  ctx.beginPath();ctx.ellipse(0,R*.03,R*1.1,R*.045,0,0,TAU);ctx.fill();
  const cg=ctx.createRadialGradient(0,0,0,0,0,R*.2);
  cg.addColorStop(0,"rgba(255,250,236,.75)");cg.addColorStop(1,"rgba(255,240,200,0)");
  ctx.fillStyle=cg;ctx.beginPath();ctx.arc(0,0,R*.2,0,TAU);ctx.fill();
  ctx.restore();
}
/* ── чёрная дыра: диск, аккреционное кольцо, слабое искривление вокруг ── */
function skyHole(p,e,x,y,dim){
  const R=H*.075*e.s;
  ctx.save();ctx.globalAlpha=dim;
  /* линзирование подделываем двумя дугами и гашением фона — считать настоящее
     отклонение лучей тут незачем, глаз читает именно это */
  const lg=ctx.createRadialGradient(x,y,R*.9,x,y,R*3.4);
  lg.addColorStop(0,"rgba(0,0,0,.9)");
  lg.addColorStop(.28,"rgba(4,2,10,.5)");
  lg.addColorStop(.62,"rgba(150,170,255,.07)");
  lg.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=lg;ctx.beginPath();ctx.arc(x,y,R*3.4,0,TAU);ctx.fill();
  ctx.fillStyle="#000";ctx.beginPath();ctx.arc(x,y,R,0,TAU);ctx.fill();
  /* аккреционный диск: перед и за горизонтом, поэтому две дуги разной яркости */
  ctx.save();ctx.translate(x,y);ctx.rotate(-.22);
  ctx.strokeStyle="rgba(255,214,150,.75)";ctx.lineWidth=R*.16;
  ctx.beginPath();ctx.ellipse(0,0,R*1.9,R*.42,0,0,Math.PI);ctx.stroke();
  ctx.strokeStyle="rgba(255,180,110,.32)";ctx.lineWidth=R*.11;
  ctx.beginPath();ctx.ellipse(0,0,R*1.9,R*.42,0,Math.PI,TAU);ctx.stroke();
  /* верхняя часть диска, поднятая линзой над горизонтом — тот самый silhouette
     из «Интерстеллара», ради которого дыру и ставят */
  ctx.strokeStyle="rgba(255,236,196,.5)";ctx.lineWidth=R*.09;
  ctx.beginPath();ctx.arc(0,0,R*1.18,Math.PI*1.02,Math.PI*1.98);ctx.stroke();
  ctx.restore();
  ctx.restore();
}
/* ── полярное сияние: занавеси, медленно дышащие ── */
function skyAurora(p,e,x,y,dim){
  const r=rng(e.seed);
  const hue=[[120,255,190],[150,220,255],[200,160,255],[255,190,140]][e.seed%4];
  ctx.save();
  ctx.globalCompositeOperation="lighter";
  ctx.globalAlpha=(p.T.atm==="отсутствует"?.35:.55);
  const n=3+Math.floor(r()*3);
  for(let i=0;i<n;i++){
    const bx=x+(i-n/2)*W*.11, top=H*.02+r()*H*.06, hh=H*(.18+r()*.22)*e.s;
    const sw=W*(.03+r()*.05);
    const wob=Math.sin(G.t*.004+i*1.7+e.ph)*W*.02;
    const g=ctx.createLinearGradient(0,top,0,top+hh);
    g.addColorStop(0,"rgba("+hue.join(",")+",0)");
    g.addColorStop(.35,"rgba("+hue.join(",")+",.20)");
    g.addColorStop(1,"rgba("+hue.join(",")+",0)");
    ctx.fillStyle=g;
    ctx.beginPath();
    ctx.moveTo(bx+wob,top);
    ctx.quadraticCurveTo(bx+wob+sw*.6,top+hh*.5,bx+wob+sw*.2,top+hh);
    ctx.lineTo(bx+wob+sw*1.2,top+hh);
    ctx.quadraticCurveTo(bx+wob+sw*1.7,top+hh*.5,bx+wob+sw,top);
    ctx.closePath();ctx.fill();
  }
  ctx.restore();
}
/* ── луна: фаза, кратеры, лёгкое свечение ── */
function skyMoon(p,e,x,y,dim){
  const R=H*.035*e.s, r=rng(e.seed);
  const c=skyTint(p,4);
  ctx.save();ctx.globalAlpha=dim*.95;
  ctx.save();
  ctx.beginPath();ctx.arc(x,y,R,0,TAU);ctx.clip();
  ctx.fillStyle="rgb("+c.map(v=>Math.round(v*.75+30)).join(",")+")";
  ctx.fillRect(x-R,y-R,R*2,R*2);
  for(let i=0;i<7;i++){
    const cx=x+(r()-.5)*R*1.6, cy=y+(r()-.5)*R*1.6, cr=R*(.08+r()*.22);
    ctx.fillStyle="rgba(0,0,0,.16)";
    ctx.beginPath();ctx.arc(cx,cy,cr,0,TAU);ctx.fill();
    ctx.fillStyle="rgba(255,255,255,.07)";
    ctx.beginPath();ctx.arc(cx-cr*.2,cy-cr*.2,cr*.7,0,TAU);ctx.fill();
  }
  const tg=ctx.createLinearGradient(x-R*.4,y,x+R,y);
  tg.addColorStop(0,"rgba(0,0,0,0)");tg.addColorStop(1,"rgba(0,0,0,.78)");
  ctx.fillStyle=tg;ctx.fillRect(x-R,y-R,R*2,R*2);
  ctx.restore();
  ctx.restore();
}
function skyNeb(p,e,x,y,dim){
  const N=skyNebula(p,e.seed);
  const w=W*(.5+e.s*.6), h=H*(.28+e.s*.3);
  ctx.save();
  ctx.globalCompositeOperation="lighter";
  ctx.globalAlpha=(p.T.atm==="отсутствует"?.55:.28);
  ctx.drawImage(N,x-w*.5,y-h*.4,w,h);
  ctx.restore();
}
/* ── комета: идёт по своей дуге, хвост от звезды, а не по движению ── */
function skyComet(p,e,x,y,dim){
  const t=((G.t*.00035+e.ph/TAU)%1);
  const cx=W*(1.15-t*1.3)+0, cy=y+Math.sin(t*Math.PI)*H*.1;
  const len=H*.12*e.s;
  ctx.save();ctx.globalAlpha=dim*.9;
  const g=ctx.createLinearGradient(cx,cy,cx+len,cy-len*.5);
  g.addColorStop(0,"rgba(215,240,255,.55)");
  g.addColorStop(1,"rgba(150,200,255,0)");
  ctx.strokeStyle=g;ctx.lineWidth=2.4;
  ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+len,cy-len*.5);ctx.stroke();
  /* пылевой хвост шире и отстаёт */
  const g2=ctx.createLinearGradient(cx,cy,cx+len*.7,cy-len*.15);
  g2.addColorStop(0,"rgba(255,240,215,.28)");
  g2.addColorStop(1,"rgba(255,240,215,0)");
  ctx.strokeStyle=g2;ctx.lineWidth=6;
  ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+len*.7,cy-len*.15);ctx.stroke();
  ctx.fillStyle="rgba(240,250,255,.9)";
  ctx.beginPath();ctx.arc(cx,cy,1.8,0,TAU);ctx.fill();
  ctx.restore();
}
/* ── пульсар: точка с двумя лучами, вспыхивает по своему периоду ── */
function skyPulsar(p,e,x,y,dim){
  const per=90+ (e.seed%120);
  const ph=(G.t%per)/per;
  const f=Math.pow(Math.max(0,Math.sin(ph*Math.PI)),12);
  ctx.save();ctx.globalAlpha=dim;
  ctx.fillStyle="rgba(200,225,255,.85)";
  ctx.beginPath();ctx.arc(x,y,1.6,0,TAU);ctx.fill();
  if(f>.01){
    const L=H*.2*e.s*f;
    ctx.save();ctx.translate(x,y);ctx.rotate(e.ph);
    const g=ctx.createLinearGradient(0,-L,0,L);
    g.addColorStop(0,"rgba(180,215,255,0)");
    g.addColorStop(.5,"rgba(220,240,255,"+(.5*f).toFixed(3)+")");
    g.addColorStop(1,"rgba(180,215,255,0)");
    ctx.fillStyle=g;ctx.fillRect(-1.6,-L,3.2,L*2);
    ctx.restore();
    ctx.globalAlpha=dim*f;
    poiGlow(x,y,26,"190,220,255",.5);
  }
  ctx.restore();
}
/* ── далёкий пояс: облако точек, медленно текущее ── */
function skyField(p,e,x,y,dim){
  ctx.save();ctx.globalAlpha=dim*.7;
  const n=Math.round(38*e.s);
  for(let i=0;i<n;i++){
    const r=rng(e.seed+i*7919);
    const a=r()*TAU, rr=r()*W*.2*e.s;
    const dx=Math.cos(a+G.t*.0004)*rr, dy=Math.sin(a+G.t*.0004)*rr*.3;
    const s=.7+r()*1.5;
    ctx.fillStyle="rgba(210,205,195,"+(.18+r()*.4).toFixed(2)+")";
    ctx.fillRect(x+dx,y+dy,s,s);
  }
  ctx.restore();
}
