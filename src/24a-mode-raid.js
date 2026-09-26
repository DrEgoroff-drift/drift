/* ══════════════ рейд на пиратскую базу: полигональный интерьер ══════════════ */
/* Карта — обычная 2D-сетка: генерация, коллизии, ИИ и пути на ней тривиальны и
   детерминированы. Рисуется она полигонами, проекцией и painter'ом из пояса
   астероидов (24-mode-belt) — это переиспользование, а не второй движок.
   Z-буфера нет, поэтому порядок жёсткий: пол → стены → объекты → эффекты. */
const RAID_N=26, RCELL=90, RAID_H=110;
const RAID_ROOMS={
  hangar: {ru:"ангар",       col:[46,58,74]},
  living: {ru:"жилой отсек", col:[58,50,44]},
  reactor:{ru:"реакторный",  col:[36,62,66]},
  store:  {ru:"склад",       col:[52,46,60]},
  bridge: {ru:"мостик",      col:[66,44,44]}
};
function raidIdx(c,r){return r*RAID_N+c;}
/* Типы врагов — те же поля, разные числа: этого хватает, чтобы бой читался
   по-разному, и не заводит второй ИИ. */
const FOE_KINDS={
  grunt:{ru:"пират",   hp:26,dmg:5, speed:1.5,range:700,cool:46,col:"#c4694f",r:9},
  rusher:{ru:"налётчик",hp:20,dmg:8, speed:3.1,range:150,cool:30,col:"#e08a5a",r:8},
  heavy:{ru:"тяжёлый", hp:60,dmg:9, speed:.9, range:620,cool:64,col:"#b85a6a",r:12},
  boss: {ru:"главарь", hp:120,dmg:12,speed:1.7,range:760,cool:24,col:"#ff6b57",r:14}
};
/* Пикапы — весь «расходный» слой сцены: лечение, броня, патроны. */
const PICKUPS={
  medkit:{ru:"аптечка",   col:"#7fe6d8"},
  armor: {ru:"пластина",  col:"#9fd8ff"},
  ammo:  {ru:"боезапас",  col:"#f2b25c"}
};
/* ══════════════ генерация: комнаты и коридоры со связностью ══════════════ */
function genRaid(seed,level){
  const r=rng(seed);
  const cells=new Uint8Array(RAID_N*RAID_N);      // 0 — порода, 1 — пол
  const kind=new Array(RAID_N*RAID_N).fill(null);
  const rooms=[];
  const want=5+Math.floor(r()*3)+Math.min(2,level);
  const KINDS=["hangar","living","reactor","store","bridge"];
  for(let i=0;i<want*6&&rooms.length<want;i++){
    const w=4+Math.floor(r()*4),h=4+Math.floor(r()*4);
    const c0=2+Math.floor(r()*(RAID_N-w-4)),r0=2+Math.floor(r()*(RAID_N-h-4));
    if(rooms.some(o=>c0<o.c1+2&&c0+w>o.c0-2&&r0<o.r1+2&&r0+h>o.r0-2))continue;
    const k=rooms.length===0?"hangar":KINDS[1+Math.floor(r()*3)];
    rooms.push({c0,r0,c1:c0+w,r1:r0+h,k,cx:c0+(w>>1),cy:r0+(h>>1)});
  }
  /* мостик — всегда последняя фактически размещённая комната: часть попыток
     отбрасывается наложением, и назначать роль заранее было бы неверно */
  if(rooms.length>1)rooms[rooms.length-1].k="bridge";
  for(const rm of rooms)
    for(let c=rm.c0;c<rm.c1;c++)for(let rr=rm.r0;rr<rm.r1;rr++){
      cells[raidIdx(c,rr)]=1;kind[raidIdx(c,rr)]=rm.k;
    }
  /* коридоры: соединяем каждую комнату со следующей — связность гарантирована
     построением, никаких проверок обходом графа не нужно */
  for(let i=1;i<rooms.length;i++){
    const a=rooms[i-1],b=rooms[i];
    let c=a.cx,rr=a.cy;
    while(c!==b.cx){c+=c<b.cx?1:-1;cells[raidIdx(c,rr)]=1;if(!kind[raidIdx(c,rr)])kind[raidIdx(c,rr)]="corr";}
    while(rr!==b.cy){rr+=rr<b.cy?1:-1;cells[raidIdx(c,rr)]=1;if(!kind[raidIdx(c,rr)])kind[raidIdx(c,rr)]="corr";}
  }
  /* антресоли и пандусы — то, ради чего вообще выбран полигональный рендер:
     часть комнат получает второй ярус, к нему ведёт наклонный въезд */
  const hi=new Float32Array(RAID_N*RAID_N);
  for(const rm of rooms){
    if(rm.k==="hangar"||rm.c1-rm.c0<5||rm.r1-rm.r0<5||r()<.45)continue;
    const w=2+Math.floor(r()*2);
    for(let c=rm.c0;c<rm.c0+w;c++)for(let rr=rm.r0;rr<rm.r1;rr++)hi[raidIdx(c,rr)]=52;
    /* пандус: одна колонка со ступенчатым подъёмом, чтобы наверх можно было выйти */
    const rampR=rm.r0+Math.floor((rm.r1-rm.r0)/2);
    hi[raidIdx(rm.c0+w,rampR)]=26;
    rm.loft=true;
  }
  return {seed,level,cells,kind,rooms,hi};
}
function raidFloorH(R,c,rr){
  if(c<0||rr<0||c>=RAID_N||rr>=RAID_N)return 0;
  return R.hi?R.hi[raidIdx(c,rr)]:0;
}
function raidFloorAt(R,x,z){return raidFloorH(R,Math.floor(x/RCELL),Math.floor(z/RCELL));}
function raidSolid(R,c,rr){
  if(c<0||rr<0||c>=RAID_N||rr>=RAID_N)return true;
  return R.cells[raidIdx(c,rr)]===0;
}
function raidSolidAt(R,x,z){return raidSolid(R,Math.floor(x/RCELL),Math.floor(z/RCELL));}
function cellCenter(c,rr){return [c*RCELL+RCELL/2,rr*RCELL+RCELL/2];}
/* ══════════════ вход, выход, наполнение ══════════════ */
/* Пиратская база есть только там, где сектор действительно опасен —
   она и объясняет, откуда берутся техкомпоненты (M39). */
function pirateBaseOf(sys){
  const d=sysDanger(sys.sx,sys.sy);
  if(d<.35)return null;
  const r=rng(hashi(sys.seed,0xBA5E,3));
  if(r()>.25+d*.6)return null;
  const orbit=(sys.belt?sys.belt.orbit:2000)*(.7+r()*.5);
  const ang=r()*TAU;
  return {orbit,ang,x:Math.cos(ang)*orbit,y:Math.sin(ang)*orbit,
    seed:hashi(sys.seed,0x21D,7),level:Math.round(d*3),name:"база "+genName(r)};
}
/* база кэшируется в самой системе: она эфемерна, как орбиты и пояс */
function sysPirateBase(){
  const sys=G.sys;
  if(sys.pbase===undefined)sys.pbase=pirateBaseOf(sys);
  return sys.pbase;
}
/* база в проходе сцены (G4d, тело — L-база 26.09): пятиугольник — план постройки, а не обводка.
   Станция — невысокая пятигранная призма в наклоне (эллипс 22×16 = наклон ~43°), вертится в своей
   плоскости: стены, что к нам, крыша-пирамида пятью скатами, мачта с проблесковым огнём, четыре
   стыковочные фермы с капсулами. Каждая грань — своя нормаль в объёме и свой свет звезды
   (звезда — в начале координат системы), тень не в ноль — отсвет. Огни — только эмиссией,
   сложением поверх: угловые маяки бегут по кругу, окна тлеют, ядро мигает. Нить цвета звезды —
   по силуэту, на рёбрах к звезде. Вершины скользят (вращение), поэтому фигуры, не спрайт */
const PB_K=16/22,PB_M=Math.sqrt(1-PB_K*PB_K);
function pirateBaseGpu(pass,PB,x,y,s){
  const HL=typeof huntLairAt==="function"?huntLairAt(G.sx,G.sy):null;
  /* корпус — вороной металл, красное только огнями; у логова металл с лиловым отливом */
  const alb=HL?[.25,.22,.29]:[.23,.24,.235],lamp=HL?[197,138,224]:[255,70,52];
  const sc0=(typeof starRGB==="function")?starRGB():[255,244,214],sm=Math.max(1,sc0[0],sc0[1],sc0[2]),sc=[sc0[0]/sm,sc0[1]/sm,sc0[2]/sm];
  const ln=Math.hypot(PB.x,PB.y)||1,L0=[-PB.x/ln*.9,-PB.y/ln*.9,.42],Ll=Math.hypot(L0[0],L0[1],L0[2]),L=[L0[0]/Ll,L0[1]/Ll,L0[2]/Ll];
  /* план (u,v,z) → экран: наклон вокруг оси x; z — вверх от плоскости базы */
  const P=(u,v,z)=>[x+u*s,y+(v*PB_K-z*PB_M)*s];
  const N=(nu,nv,nz)=>{const a=[nu,nv*PB_K-nz*PB_M,nv*PB_M+nz*PB_K],l=Math.hypot(a[0],a[1],a[2])||1;return [a[0]/l,a[1]/l,a[2]/l];};
  /* отсвет сверху-спереди, холодный: в тени скаты всё равно различимы; блик металла — цвета звезды */
  const Hh=[L[0],L[1],L[2]+1],Hl=Math.hypot(Hh[0],Hh[1],Hh[2]),sg=(sc[0]+sc[1]+sc[2])/3,sw=sc.map(c=>.2*c+.8*sg);
  const lit=(n,k)=>{const d=Math.max(0,n[0]*L[0]+n[1]*L[1]+n[2]*L[2]),f=Math.max(0,-n[1]*.6+n[2]*.8),m=k||1,
    sp=Math.pow(Math.max(0,(n[0]*Hh[0]+n[1]*Hh[1]+n[2]*Hh[2])/Hl),16)*.3;
    return [0,1,2].map(i=>Math.min(255,255*(alb[i]*m*(sw[i]*d*1.7+[.22,.24,.29][i]+f*[.27,.31,.42][i])+sw[i]*sp*m)));};
  const R=22,HW=5,HC=7,ph=G.t*.002,V=[];
  for(let i=0;i<5;i++){const a=i*TAU/5+ph;V.push([Math.cos(a)*R,Math.sin(a)*R]);}
  const SH=[],E=[],BK=[],FR=[];
  /* фермы: от стены наружу, капсула на конце; задние — до тела, передние — после */
  for(let i=0;i<4;i++){const a=i*TAU/4-G.t*.004,cu=Math.cos(a),sv=Math.sin(a),to=sv>0?FR:BK;
    const A=P(cu*19,sv*19,-1.5),B=P(cu*33,sv*33,-1.5),nr=N(cu*.3,sv*.3,1),c=lit(nr,.8);
    to.push([2,A[0],A[1],B[0],B[1],.9*s,0,c[0],c[1],c[2],1]);
    const cc=lit(N(cu,sv,.6),.9);to.push([1,B[0],B[1],1.15*s,0,0,0,cc[0],cc[1],cc[2],1]);
    /* один малый огонь на макушке капсулы */
    const w=P(cu*33,sv*33,-.5);E.push([1,w[0],w[1],.3*s,0,0,.8*s,lamp[0],lamp[1],lamp[2],(Math.sin(G.t*.09+i*1.7)>.3)?.9:.25]);}
  SH.push(...BK);
  const sil=[];
  for(let i=0;i<5;i++){const a=V[i],b=V[(i+1)%5],mu=(a[0]+b[0])/2,mv=(a[1]+b[1])/2,ml=Math.hypot(mu,mv);
    const n=N(mu/ml,mv/ml,0);
    if(n[2]>0){   /* стена к нам */
      const c=lit(n,.85);
      gpuQuad(SH,P(a[0],a[1],0),P(b[0],b[1],0),P(b[0],b[1],-HW),P(a[0],a[1],-HW),[c[0],c[1],c[2],1],0);
      /* окна: шаг сбит, часть тёмные — жилой ряд, а не схема; по карнизу — красная полоса и ходовые огни */
      for(let k=0,t=.06;k<7;k++){const h=hashi(PB.seed>>>0,i*8+k,0x3B1);t+=.07+.16*((h&255)/255);if(t>.94)break;
        if(((h>>8)&255)<90)continue;
        const w=P(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,-HW*(.35+.3*(((h>>16)&255)/255)));
        E.push([1,w[0],w[1],.4*s,0,0,.9*s,255,190,120,((h>>24)&255)<60?.3:.7]);}
      const e0=P(a[0],a[1],-.35),e1=P(b[0],b[1],-.35);
      E.push([2,e0[0],e0[1],e1[0],e1[1],.14*s,.4*s,lamp[0],lamp[1],lamp[2],.3]);
      for(let k=1;k<5;k++){const t=(k+.5)/6,u=a[0]+(b[0]-a[0])*t,v=a[1]+(b[1]-a[1])*t,q0=P(u,v,-.5),q1=P(u,v,-HW+.3);
        SH.push([2,q0[0],q0[1],q1[0],q1[1],.22*s,0,c[0]*.55,c[1]*.55,c[2]*.55,.9]);}
      for(let k=0;k<3;k++){const t=(k+.5)/3,w=P(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,-.4);
        E.push([1,w[0],w[1],.3*s,0,0,1.1*s,lamp[0],lamp[1],lamp[2],.4]);}
      sil.push([P(a[0],a[1],-HW),P(b[0],b[1],-HW),n]);
    }else sil.push([P(a[0],a[1],0),P(b[0],b[1],0),N(mu/ml,mv/ml,.8)]);
  }
  /* крыша: пять скатов к макушке */
  const C=P(0,0,HC),RC=[];
  for(let i=0;i<5;i++){const a=V[i],b=V[(i+1)%5];
    const e1=[a[0],a[1],-HC],e2=[b[0],b[1],-HC],nu=e1[1]*e2[2]-e1[2]*e2[1],nv=e1[2]*e2[0]-e1[0]*e2[2],nz=e1[0]*e2[1]-e1[1]*e2[0];
    const n=N(nu*Math.sign(nz),nv*Math.sign(nz),Math.abs(nz)),c=lit(n);RC.push(c);
    const A=P(a[0],a[1],0),B=P(b[0],b[1],0);SH.push([5,C[0],C[1],A[0],A[1],B[0],B[1],c[0],c[1],c[2],1,5]);}
  /* рёбра скатов — фаска ловит свет ярче обоих соседних скатов; по кромке крыши — тёмный шов карниза */
  for(let i=0;i<5;i++){const A=P(V[i][0],V[i][1],0),c0=RC[i],c1=RC[(i+4)%5],m=Math.max(c0[0]+c0[1],c1[0]+c1[1])===c0[0]+c0[1]?c0:c1;
    SH.push([2,C[0],C[1],A[0],A[1],.3*s,0,Math.min(255,m[0]*1.5+26),Math.min(255,m[1]*1.5+26),Math.min(255,m[2]*1.5+30),.9]);
    const B=P(V[(i+1)%5][0],V[(i+1)%5][1],0);SH.push([2,A[0],A[1],B[0],B[1],.3*s,0,11,12,16,.7]);
    /* шов панелей поперёк ската, на середине высоты */
    const a=V[i],b=V[(i+1)%5],h0=P(a[0]*.55,a[1]*.55,HC*.45),h1=P(b[0]*.55,b[1]*.55,HC*.45);
    SH.push([2,h0[0],h0[1],h1[0],h1[1],.24*s,0,RC[i][0]*.36,RC[i][1]*.36,RC[i][2]*.36,.95]);
    /* люки на скате — от нуля до трёх, где попало, часть едва тлеет */
    for(let j=0,nj=hashi(PB.seed>>>0,i,0x7A8)%4;j<nj;j++){const h=hashi(PB.seed>>>0,i*4+j,0x7A7),t=.12+.76*((h&255)/255),rr=.25+.5*(((h>>8)&255)/255),w=P((a[0]+(b[0]-a[0])*t)*rr,(a[1]+(b[1]-a[1])*t)*rr,HC*(1-rr));
      E.push([1,w[0],w[1],.35*s,0,0,.8*s,255,200,140,((h>>16)&255)<80?.2:.6]);}}
  SH.push(...FR);
  /* мачта и ядро на ней */
  const M=P(0,0,HC+6),mc=lit(N(1,0,.2),.8);SH.push([2,C[0],C[1],M[0],M[1],.55*s,0,mc[0],mc[1],mc[2],1]);
  const on=Math.sin(G.t*.18)>0;
  E.push([1,M[0],M[1],1.1*s,0,0,(on?5:2)*s,lamp[0],lamp[1],lamp[2],on?.95:.15]);
  /* угловые маяки бегут по кругу */
  for(let i=0;i<5;i++){const w=P(V[i][0],V[i][1],0),q=((G.t*.05-i)%5+5)%5;
    E.push([1,w[0],w[1],.5*s,0,0,1.8*s,lamp[0],lamp[1],lamp[2],q<1?.3+.65*(1-q):.3]);}
  /* нить звезды по силуэту: ребро, чья нормаль смотрит на звезду */
  for(const [A,B,n] of sil){const f=(n[0]*L[0]+n[1]*L[1])/Math.max(.2,Math.hypot(L[0],L[1]));if(f<=.05)continue;
    SH.push([2,A[0],A[1],B[0],B[1],.6*s,0,255*sc[0],255*sc[1],255*sc[2],+(.7*Math.pow(Math.min(f,1),1.5)).toFixed(3)]);}
  gpuShapes(pass,SH);gpuShapes(pass,E,{blend:"add"});
  domLabel("pbase",x,y+30*s+6,((HL?huntLairName(G.sx,G.sy):PB.name)||PB.name).toUpperCase(),"9px ui-monospace,monospace",
    HL?"rgba(197,138,224,.8)":"rgba(192,101,87,.65)","center");
}
function drawPirateBase(zx,zy,Z){
  const PB=sysPirateBase();if(!PB)return;
  const x=zx(PB.x),y=zy(PB.y),s=clamp(Z,.3,1.4);
  if(x<-60||x>W+60||y<-60||y>H+60)return;
  const pass=gpuScene();if(pass){pirateBaseGpu(pass,PB,x,y,s);return;}
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  /* угловатая, тёмная, с красными огнями — читается как чужая с первого взгляда */
  /* у базы с хозяином (12o) свой обвод и своё имя: логово наконец отличается
     снаружи, а не только изнутри */
  const HL=typeof huntLairAt==="function"?huntLairAt(G.sx,G.sy):null;
  ctx.fillStyle=HL?"#1b0f16":"#171013";
  ctx.strokeStyle=HL?"rgba(197,138,224,.9)":"rgba(220,90,70,.85)";ctx.lineWidth=2;
  ctx.beginPath();
  for(let i=0;i<5;i++){
    const a=i*TAU/5+G.t*.002;
    const px=Math.cos(a)*22,py=Math.sin(a)*16;
    i?ctx.lineTo(px,py):ctx.moveTo(px,py);
  }
  ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle="rgba(220,90,70,.5)";ctx.lineWidth=1.4;
  for(let i=0;i<4;i++){
    const a=i*TAU/4-G.t*.004;
    ctx.beginPath();ctx.moveTo(Math.cos(a)*20,Math.sin(a)*14);
    ctx.lineTo(Math.cos(a)*33,Math.sin(a)*24);ctx.stroke();
  }
  ctx.fillStyle=(Math.sin(G.t*.18)>0)?"rgba(255,60,50,.95)":"rgba(255,60,50,.15)";
  ctx.beginPath();ctx.arc(0,0,4,0,TAU);ctx.fill();
  ctx.restore();
  ctx.fillStyle=HL?"rgba(197,138,224,.8)":"rgba(220,90,70,.65)";
  ctx.font="9px ui-monospace,monospace";ctx.textAlign="center";
  ctx.fillText(((HL?huntLairName(G.sx,G.sy):PB.name)||PB.name).toUpperCase(),x,y+34);
}
function enterRaid(PB){
  if(typeof vegaOffend==="function"&&vegaAboard())vegaOffend("рейд, а она просила не лезть");   /* M153 */
  /* В занятой системе база — логово: уровень выше на занятость, поэтому и
     отсеки крупнее, и охраны больше. Отдельный режим под «данж» не нужен —
     абордаж уже умеет всё, чего это требует. */
  const lair=occLairLevel(G.sx,G.sy);
  if(lair){PB=Object.assign({},PB,{level:PB.level+lair,
    name:(occLairName(G.sx,G.sy)||PB.name)});}
  /* у логова появился хозяин (12o): в секторе вашего охотника база носит его
     имя и держит охрану на ступень выше — сюда летят за ним, а не за «ещё
     одной базой» */
  const HL=typeof huntLairAt==="function"?huntLairAt(G.sx,G.sy):null;
  if(HL)PB=Object.assign({},PB,{level:PB.level+1,name:huntLairName(G.sx,G.sy)});
  const R=genRaid(PB.seed,PB.level);
  const st=stat();
  const start=R.rooms[0];
  const [sx0,sz0]=cellCenter(start.cx,start.cy);
  const foes=[],loot=[],picks=[];
  const r=rng(hashi(PB.seed,77,0x0E));
  for(const rm of R.rooms){
    if(rm.k==="hangar")continue;
    const n=Math.max(1,(rm.k==="bridge"?2:1)+Math.floor(r()*(1+PB.level))-((typeof holdRaidThin==="function")?holdRaidThin():0));   /* Дружина (H3) */
    for(let i=0;i<n;i++){
      const c=rm.c0+Math.floor(r()*(rm.c1-rm.c0)),rr=rm.r0+Math.floor(r()*(rm.r1-rm.r0));
      const [x,z]=cellCenter(c,rr);
      /* мини-босс сторожит мостик; в остальном тип берётся от отсека —
         в жилом чаще налётчики, в реакторном тяжёлые */
      const kind=(rm.k==="bridge"&&i===0)?"boss":
        (rm.k==="living"?(r()<.6?"rusher":"grunt"):
         rm.k==="reactor"?(r()<.5?"heavy":"grunt"):
         (r()<.25?"heavy":(r()<.5?"rusher":"grunt")));
      const K=FOE_KINDS[kind],hp=K.hp+PB.level*12;
      /* барон сидит на мостике логова: он не «ещё один босс», а тот, ради кого
         сюда и летят, — втрое живучее обычного мини-босса */
      const baron=lair>=OCC_MAX&&rm.k==="bridge"&&i===0;
      foes.push({x,z,a:r()*TAU,kind,hp:baron?hp*3:hp,hpMax:baron?hp*3:hp,
        boss:kind==="boss",baron,
        cool:0,aware:false,seed:hashi(PB.seed,foes.length*131,9),bob:r()*TAU});
    }
    const [lx,lz]=cellCenter(rm.cx,rm.cy);
    loot.push({x:lx,z:lz,kind:rm.k==="bridge"?"part":(rm.k==="store"?"tech":"data"),taken:false,
      seed:hashi(PB.seed,loot.length*613,4)});
    /* расходники лежат по отсекам: жилой лечит, склад даёт патроны, прочее — броню */
    const pk=rm.k==="living"?"medkit":(rm.k==="store"?"ammo":(r()<.5?"armor":"medkit"));
    const pc=rm.c0+Math.floor(r()*(rm.c1-rm.c0)),pr=rm.r0+Math.floor(r()*(rm.r1-rm.r0));
    const [px,pz]=cellCenter(pc,pr);
    picks.push({x:px,z:pz,kind:pk,taken:false});
  }
  G.raid={PB,R,foes,loot,picks,x:sx0,z:sz0,y:0,a:0,vx:0,vz:0,suit:suitMax(),cool:0,
    ammo:60,armor:(typeof kitStat==="function"?kitStat().armor:0),bag:{parts:[],tech:0,data:0},
    walkPhase:0,hurt:0,flash:0,shots:[],exit:[sx0,sz0],level:PB.level};
  G.mode="raid";G.ap=null;
  for(const k in keys)keys[k]=false;
  /* имя базы и счёт живых стоят в сводке места — здесь только управление */
  say("◀ ▶ — поворот · ▲ ▼ — ход\nОГОНЬ — стрельба · вернитесь в ангар и ДЕЙСТВИЕ — уход");
}
function raidLeave(msg,lostShare){
  const S=G.raid;if(!S)return;
  const bag=S.bag;
  /* смерть отнимает часть добытого, а не прогресс: лут — единственная ставка */
  if(lostShare>0){
    bag.tech=Math.floor(bag.tech*(1-lostShare));
    bag.data=Math.floor(bag.data*(1-lostShare));
    bag.parts=bag.parts.slice(0,Math.max(0,Math.floor(bag.parts.length*(1-lostShare))));
  }
  if(bag.tech>0)addRes("techcomp",bag.tech);
  if(bag.data>0)G.data+=bag.data;
  for(const p of bag.parts){addPart(p);gotAdd(p);}   /* мешок абордажа — карточкой (27jb) */
  G.raid=null;G.mode="system";
  G.hull=Math.max(1,G.hull);
  /* если в этом секторе пираты держат ваших людей — штурм освобождает их даром.
     Выкуп остаётся вариантом для тех, кому лень лететь; это и есть выбор */
  if(lostShare<=0)crewFreeHostagesAt(G.sx,G.sy);
  /* разбитая база гасит очаг: наступление вокруг замирает на сутки */
  if(lostShare<=0)occSuppress(G.sx,G.sy);
  saveGame(true);
  tell(lostShare>0?"warn":"kill",msg+" · техкомпонентов "+bag.tech+", данных "+bag.data+
    (bag.parts.length?", частей "+bag.parts.length:""),
    msg+"\nтехкомпоненты "+bag.tech+"\nданные "+bag.data);
}
/* ══════════════ обновление ══════════════ */
function updateRaid(dt){
  const S=G.raid,R=S.R,st=stat();
  /* поворот и ход по сетке: коллизия — проверка клетки, ничего сложнее не нужно */
  if(keys.left)S.a-=.045*dt;
  if(keys.right)S.a+=.045*dt;
  const spd=(keys.thrust?1:0)-(keys.brake?.6:0);
  const nx=S.x+Math.sin(S.a)*spd*3.1*dt, nz=S.z+Math.cos(S.a)*spd*3.1*dt;
  if(!raidSolidAt(R,nx,S.z))S.x=nx;
  if(!raidSolidAt(R,S.x,nz))S.z=nz;
  /* высота пола: пандус поднимает плавно, поэтому переход на антресоль виден */
  const wantY=raidFloorAt(R,S.x,S.z);
  S.y+=clamp(wantY-S.y,-4*dt,4*dt);
  S.walkPhase+=Math.abs(spd)*.2*dt;
  if(S.cool>0)S.cool-=dt;
  if(S.hurt>0)S.hurt-=dt;
  if(S.flash>0)S.flash-=dt;
  /* оружие берётся из установленной части: собранный корабль решает, чем воюешь */
  if(keys.fire&&S.cool<=0&&st.armed&&S.ammo>0){
    S.cool=Math.max(7,st.cool*.5);S.flash=6;S.ammo--;
    S.shots.push({x:S.x,z:S.z,vx:Math.sin(S.a)*9,vz:Math.cos(S.a)*9,life:60,dmg:st.dmg,mine:true});
    sfx("shot",{f:520,v:.4});
  }
  for(let i=S.shots.length-1;i>=0;i--){
    const sh=S.shots[i];
    sh.x+=sh.vx*dt;sh.z+=sh.vz*dt;sh.life-=dt;
    if(sh.life<=0||raidSolidAt(R,sh.x,sh.z))S.shots.splice(i,1);
  }
  /* враги: идут на шум, стреляют с дистанции, за стеной не видят */
  for(const f of S.foes){
    if(f.hp<=0)continue;
    const K=FOE_KINDS[f.kind]||FOE_KINDS.grunt;
    const dx=S.x-f.x,dz=S.z-f.z,d=Math.hypot(dx,dz)||1;
    const see=d<760&&raidLineOfSight(R,f.x,f.z,S.x,S.z);
    if(see)f.aware=true;
    if(f.aware){
      f.a=Math.atan2(dx,dz);
      /* налётчик прёт вплотную, тяжёлый держит дистанцию — разница видна в бою */
      const keep=f.kind==="rusher"?40:190;
      if(d>keep&&see){
        const nfx=f.x+dx/d*K.speed*dt, nfz=f.z+dz/d*K.speed*dt;
        if(!raidSolidAt(R,nfx,f.z))f.x=nfx;
        if(!raidSolidAt(R,f.x,nfz))f.z=nfz;
      }
      if(f.cool>0)f.cool-=dt;
      if(see&&d<K.range&&f.cool<=0){
        f.cool=K.cool;
        S.shots.push({x:f.x,z:f.z,vx:dx/d*7,vz:dz/d*7,life:70,dmg:K.dmg+S.level*2,mine:false});
        sfx("shot",{f:f.kind==="heavy"?200:280,v:.28});
      }
    }
    f.bob+=.05*dt;
  }
  /* расходники подбираются проходом насквозь — останавливаться незачем */
  for(const P of S.picks){
    if(P.taken||Math.hypot(P.x-S.x,P.z-S.z)>52)continue;
    P.taken=true;sfx("ui",{f:640,to:960,d:.14,v:.3});
    if(P.kind==="medkit"){S.suit=Math.min(suitMax(),S.suit+34);say("Аптечка\nскафандр "+Math.round(S.suit)+"%");}
    else if(P.kind==="armor"){S.armor=Math.min(.5,S.armor+.18);say("Бронепластина\nурон −"+Math.round(S.armor*100)+"%");}
    else{S.ammo+=30;say("Боезапас +30\nвсего "+S.ammo);}
  }
  /* попадания: пуля против круга — этого достаточно на таких скоростях */
  for(let i=S.shots.length-1;i>=0;i--){
    const sh=S.shots[i];
    if(sh.mine){
      for(const f of S.foes){
        if(f.hp<=0)continue;
        if(Math.hypot(f.x-sh.x,f.z-sh.z)<34){
          f.hp-=sh.dmg;S.shots.splice(i,1);
          if(f.hp<=0){
            logAdd("kill","На абордаже: "+(FOE_KINDS[f.kind]||FOE_KINDS.grunt).ru+" уничтожен");
            S.bag.data+=f.boss?12:3;
            nodeDrop("в рейде на базу",sysDanger(G.sx,G.sy)+(f.baron?.5:0),
              hashi(f.seed,0x9D,now()&0xffff),f.baron?1:0);
            /* редкость логова (12m-rare): только на бароне, ключ — сама система,
               так что у логова каждого сектора своя, стабильная */
            if(f.baron&&typeof rareTake==="function")rareTake("lair",hashi(G.sx,G.sy,0x1A18));
            sfx("boom",{v:.4});
          }else sfx("hit",{v:.3});
          break;
        }
      }
    }else if(Math.hypot(S.x-sh.x,S.z-sh.z)<30){
      S.shots.splice(i,1);
      /* здоровье — скафандр, ровно как в шахте */
      S.suit-=sh.dmg*st.suitWear*(1-S.armor);S.hurt=10;sfx("hit",{v:.45});
      if(S.suit<=0){raidLeave("Скафандр пробит · аварийная эвакуация",.5);return;}
    }
  }
  /* лут и выход */
  let near=null;
  for(const L of S.loot){
    if(L.taken)continue;
    if(Math.hypot(L.x-S.x,L.z-S.z)<60){near=L;break;}
  }
  const atExit=Math.hypot(S.exit[0]-S.x,S.exit[1]-S.z)<70;
  const alive=S.foes.filter(f=>f.hp>0).length;
  if(near){
    /* Скафандр отсюда убран: он стоит шкалой наверху, крупно и с цветом
       тревоги. Правило разделения — наверху то, что держит в живых; у рук
       то, что тратит текущее действие (заряды, броня, сумка). */
    G.prompt="ДЕЙСТВИЕ — ВСКРЫТЬ КОНТЕЙНЕР";
    if(actEdge){
      near.taken=true;
      if(near.kind==="part"){
        const p=genPart(near.seed,1+Math.min(2,S.level));
        S.bag.parts.push(p);
        tell("","Найдена часть: "+p.name,"Найдено\n"+p.name);
      }else if(near.kind==="tech"){
        const n=2+Math.floor(rng(near.seed)()*4)+S.level;
        S.bag.tech+=n;
        tell("","Найдены техкомпоненты ×"+n,"Техкомпоненты ×"+n);
      }else{
        const n=8+Math.floor(rng(near.seed)()*14);
        S.bag.data+=n;
        tell("","Данные с терминала +"+n,"Данные +"+n);
      }
    }
  }else if(atExit){
    G.prompt="АНГАР · ДЕЙСТВИЕ — УХОД С ДОБЫЧЕЙ"+
      "\nв сумке: техкомпонентов "+S.bag.tech+", данных "+S.bag.data+
      (S.bag.parts.length?", частей "+S.bag.parts.length:"")+
      (alive?"\nна базе ещё "+alive+" стволов":"\nбаза зачищена");
    if(actEdge){raidLeave(alive?"Уход с базы":"База зачищена",0);return;}
  }else{
    G.prompt="ЗАРЯДОВ "+S.ammo+
      (S.armor>0?" · БРОНЯ −"+Math.round(S.armor*100)+"%":"")+" · ЖИВЫХ "+alive+
      "\nтехкомпонентов "+S.bag.tech+" · данных "+S.bag.data+
      (!st.armed?"\nОРУЖИЯ НЕТ — ПОСТАВЬТЕ ПУШКУ НА КОРАБЛЬ":
        (S.ammo<=0?"\nЗАРЯДЫ КОНЧИЛИСЬ — ИЩИТЕ БОЕЗАПАС НА СКЛАДЕ":""));
  }
}
/* видимость по сетке: шаг вдоль луча, дёшево и предсказуемо */
function raidLineOfSight(R,x0,z0,x1,z1){
  const d=Math.hypot(x1-x0,z1-z0)||1,n=Math.ceil(d/40);
  for(let i=1;i<n;i++){
    const t=i/n;
    if(raidSolidAt(R,x0+(x1-x0)*t,z0+(z1-z0)*t))return false;
  }
  return true;
}
