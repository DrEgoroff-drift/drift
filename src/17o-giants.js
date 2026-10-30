/* ══════════════ по великану на рукав (M464, DESIGN-life) ══════════════
   У каждого рукава и у ядра — одно колоссальное сооружение, в 20–50 раз
   больше корабля, названное голосом галактики. Место — география, а не
   война: земли держав ходят по летописи, великан стоит, где стоял. Шесть —
   на настоящих рукавах модели галактики (17z1/17z2): два рукава по две ветви,
   по одному на ветвь на 19–22 секторах, и ещё двое ближе к ядру, на 14–15
   (у звезды, ближайшей к точке рукава); седьмой — полая луна у ядра. На карте —
   ориентир с именем, в системе — само тело, далеко от звезды, и под именем —
   мерило: во сколько ваших корпусов он длиной. К телу причаливают: посещение —
   абзац места, слух его жителей, сувенир с первого раза (G.giantsSeen[k]=2),
   а в Доме водителя — ночлег. Мир не трогается: только starAt, без бросков.
   (Кольцо, M154, — не из их числа.) */
const GIANTS_DEF=[
  {k:"moon",  by:null,ru:"Полая луна «Гнездо»",   note:"в недрах — шахтёрский посёлок, огни кольцами"},
  {k:"house", by:"gt",ru:"Дом водителя",          note:"гостиница ГЛАВТРАССЫ размером со станцию"},
  {k:"cyl",   by:"co",ru:"Цилиндр Компании",      note:"логотип во всю длину, видно с соседних систем"},
  {k:"customs",by:"or",ru:"Таможенный город",     note:"каждое здание — форма"},
  {k:"dock",  by:"km",ru:"Сухой док Коммуны",     note:"один корпус строят триста лет"},
  {k:"town",  by:"ra",ru:"Посёлок в камнях",      note:"город Рассвета врос в пояс"},
  {k:"garden",by:"hf",ru:"Сад ретрансляторов",    note:"лес мачт Хай-Фронта, мигает вразнобой"}
];
let GIANTS=null;
function giantsAll(){
  if(GIANTS)return GIANTS;
  GIANTS=[];
  /* ветви рукавов: [рукав, ветвь] — по кругу; пятый и шестой — ближе к ядру (M464) */
  const BR=[[0,0],[1,0],[0,1],[1,1]];
  /* ближайшая звезда к точке (в квадрате ±4), как и раньше */
  const near=(tx,ty)=>{let best=null,bd=1e9;
    for(let dx=-4;dx<=4;dx++)for(let dy=-4;dy<=4;dy++){
      const sx=tx+dx,sy=ty+dy;if(!starAt(sx,sy))continue;
      const d=dx*dx+dy*dy;if(d<bd){bd=d;best=[sx,sy];}}
    return best;};
  /* два рукава на средних радиусах сходятся: идём по своей ветви от целевого радиуса
     в обе стороны шагом полсектора и берём первую звезду, что по модели лежит в этом
     рукаве (или в туманности этого же рукава) и не ближе 8 секторов к уже поставленным */
  const far=q=>GIANTS.every(o=>o.k==="moon"||Math.hypot(o.sx-q[0],o.sy-q[1])>=8);
  GIANTS_DEF.forEach((D,i)=>{
    if(!i){const q=near(3,0);if(q)GIANTS.push({...D,arm:"ядро",sx:q[0],sy:q[1],seed:hashi(q[0],q[1],0x61A7)>>>0});return;}
    const b=BR[(i-1)%4],A=GAL_ARMS[b[0]],r0=i<=4?18+i:9+i;
    let pick=null,first=null;
    for(let k=0;k<=40&&!pick;k++){
      const r=r0+((k%2)?1:-1)*Math.ceil(k/2)*.5;if(r<10||r>28)continue;
      const P=galArmPt(A,r,b[1],0),q=near(Math.round(P.x),Math.round(P.y));if(!q)continue;
      if(!first)first=q;
      const nb=GAL_NEBULAE.find(n=>Math.hypot(n.x-q[0],n.y-q[1])<2.2);
      if((nb?nb.a===b[0]:galPlaceName(q[0],q[1])===A.ru)&&far(q))pick=q;
    }
    pick=pick||first;
    if(pick)GIANTS.push({...D,arm:A.ru,sx:pick[0],sy:pick[1],seed:hashi(pick[0],pick[1],0x61A7)>>>0});
  });
  return GIANTS;
}
function giantAt(sx,sy){for(const g of giantsAll())if(g.sx===sx&&g.sy===sy)return g;return null;}
/* в системе: далеко от звезды, по зерну */
function giantPos(g){const a=(g.seed%628)/100,R=2600;return {x:Math.cos(a)*R,y:Math.sin(a)*R,a};}
/* ── карта: у каждого великана свой значок (D26) ── */
function giantMapGlyph(k,x,y,r,col){   /* пером карты (17z4), обвод 1.3 */
  const w=1.3;
  if(k==="moon"){mpCircle(x,y,r,w,col);mpCircle(x+r*.15,y-r*.15,r*.35,w,col);}
  else if(k==="house"){mpFrame(x-r*1.3,y-r*.6,r*2.6,r*1.2,w,col);for(let i=-1;i<=1;i++)mpLine(x+i*r*.7,y-r*.2,x+i*r*.7,y+r*.2,w,col);}
  else if(k==="cyl"){const q=r*.45,xl=x-r*1.5+q,xr=x+r*1.5-q;
    mpLine(xl,y-q,xr,y-q,w,col);mpLine(xl,y+q,xr,y+q,w,col);
    mpArc(xr,y,q,-Math.PI/2,Math.PI/2,w,col);mpArc(xl,y,q,Math.PI/2,Math.PI*1.5,w,col);}
  else if(k==="customs"){for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)mpFrame(x+i*r*.8-r*.25,y+j*r*.8-r*.25,r*.5,r*.5,w,col);}
  else if(k==="dock"){mpFrame(x-r*1.4,y-r*.6,r*2.8,r*1.2,w,col);mpArc(x,y,r*.8,0,Math.PI,w,col);}
  else if(k==="town"){for(let i=-1;i<=1;i++)mpPath([x+i*r*.8-r*.4,y+r*.5,x+i*r*.8,y-r*.5+Math.abs(i)*r*.3,x+i*r*.8+r*.4,y+r*.5],w,col);}
  else{for(let i=-1;i<=1;i++){mpLine(x+i*r*.7,y+r*.7,x+i*r*.7,y-r*.7+Math.abs(i)*r*.4,w,col);mpLine(x+i*r*.7-r*.25,y-r*.2,x+i*r*.7+r*.25,y-r*.2,w,col);}}
}
function drawGiantsMap(V,cell){
  const vx=V.x,vy=V.y;
  const MS=mapSave();MPN.textAlign="center";
  for(const g of giantsAll()){
    const x=W/2+(g.sx-vx)*cell,y=H/2+(g.sy-vy)*cell;
    if(x<-60||x>W+60||y<-60||y>H+60)continue;
    const r=Math.max(4,cell*.26);
    giantMapGlyph(g.k,x,y,r,"rgba(240,220,170,.9)");
    if(cell>=10){MPN.fillStyle="rgba(240,220,170,.9)";MPN.font=(typeof uiFont==="function")?uiFont(9):"9px monospace";mapLate(g.ru.toUpperCase(),[[x,y+r*1.9+11],[x,y-r*1.9-5]],4);}   /* под знаком, а занято — над ним (18, mapLate) */
  }
  mapRestore(MS);
}
/* ── система: семь настоящих тел под общей звездой (G15) ──
   Координаты и размеры прежнего рисунка сохранены, но масса, рёбра, мачты и окна —
   сетка h3d, а не Canvas-мастер. Своё зерно строит форму один раз; живые огни идут
   через bodyLights/gpuShapes каждый кадр. Без GPU тела нет, как у станции и баржи. */
function h3dGiantMesh(g){
  return bodyMesh("gi:"+g.k+":"+g.seed,7,()=>{
    const K=h3dKit(),C=K.C,r=rng(g.seed),L=[],warm=[255,214,150],cold=[140,220,255];
    const iron=[48,46,43],steel=[138,142,146],dark=[24,23,22];
    let st=[[700,400],[-700,400]],pulse=null,run=null;
    const rect=(x,y,w,h,z,col,em)=>K.face([[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z]],[x+w/2,y+h/2,z-2],C(col),3,-.1,em||0);
    const disc=(x,y,rr,z,col,em,N)=>{const P=[];N=N||24;for(let i=0;i<N;i++){const a=i/N*TAU;P.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr,z]);}
      K.face(P,[x,y,z-2],C(col),3,-.1,em||0);};
    const ring=(x,y,rr,z,col,em)=>{const N=48;for(let i=0;i<N;i++){const a=i/N*TAU,b=(i+1)/N*TAU,ri=rr-2;
        K.face([[x+Math.cos(a)*ri,y+Math.sin(a)*ri,z],[x+Math.cos(a)*rr,y+Math.sin(a)*rr,z],
          [x+Math.cos(b)*rr,y+Math.sin(b)*rr,z],[x+Math.cos(b)*ri,y+Math.sin(b)*ri,z]],[x,y,z-2],C(col),3,-.1,em||0);}};
    const hoopX=(x,rr,zc,col,th)=>{const P=[];for(let i=0;i<=32;i++){const a=i/32*TAU;P.push([x,Math.cos(a)*rr,zc+Math.sin(a)*rr]);}K.tube(P,th||2,C(col),3,.45,6);};
    if(g.k==="moon"){
      const R=520,Sp=[],mx=R*.2,my=-R*.1,mr=R*.42,mz=R+5;
      for(let i=0;i<=32;i++){const x=-R+2*R*i/32;Sp.push([x,Math.max(.01,Math.sqrt(R*R-x*x))]);}
      K.lathe(0,0,0,Sp,C([78,70,61]),3,.3,0,48);
      for(let i=0;i<26;i++){const a=r()*TAU,d=r()*R*.9,cr=8+r()*50,x=Math.cos(a)*d,y=Math.sin(a)*d;
        if(Math.hypot(x-mx,y-my)<mr+cr)continue;
        const z=Math.sqrt(Math.max(0,R*R-x*x-y*y))+2;disc(x,y,cr,z,[28,25,22],0,20);ring(x,y,cr,z+1,[112,101,85],0);}
      disc(mx,my,mr,mz,[5,6,7],0,48);ring(mx,my,mr,mz+1,[164,132,88],.25);
      for(let k=1;k<=4;k++){const rr=mr*.22*k;ring(mx,my,rr,mz+2,warm,.35+(4-k)*.12);
        for(let i=0;i<10*k;i++){const a=i/(10*k)*TAU+k;disc(mx+Math.cos(a)*rr,my+Math.sin(a)*rr,1.8,mz+3,warm,1.35,6);}}
      for(let i=0;i<12;i++)rect(mx+mr*1.05+i*7,my-mr*.1,3,3,mz+3,warm,1.4);
      pulse={x:mx+mr*1.05,y:my-mr*.1,r:6,c:warm};st=[];for(let i=0;i<=14;i++){const x=R-2*R*i/14;st.push([x,Math.max(.3,Math.sqrt(R*R-x*x))]);}
    }else if(g.k==="house"){
      K.box(-450,450,-210,210,-55,65,16,C([61,56,51]),3,.5);
      K.box(-450,450,-210,-184,65,82,4,C(iron),3,.55);K.box(-450,450,180,210,65,78,4,C(iron),3,.55);
      for(let x=-390;x<450;x+=60)K.box(x-1,x+1,-184,180,65,69,.2,C([38,35,32]),3,.4);
      for(let y=-124;y<180;y+=60)K.box(-450,450,y-1,y+1,65,69,.2,C([38,35,32]),3,.4);
      for(let i=0;i<30;i++)for(let j=0;j<9;j++){const on=r();if(on<.62)rect(-432+i*29.5,-170+j*38,14,22,70,warm,on<.15?.35:1.25);}
      K.box(-490,490,-280,-216,15,102,8,C([31,27,24]),3,.5);
      for(const y of [-280,-218])K.box(-490,490,y,y+2,102,105,.3,C([122,102,72]),3,.4);
      for(const x of [-490,488])K.box(x,x+2,-280,-216,102,105,.3,C([122,102,72]),3,.4);
      for(let i=0;i<40;i++)disc(-480+i*960/39,-282,2.7,104,[255,240,200],1.1+(i%2)*.3,6);
      L.push({x:490,y:-278,c:[255,80,60],r:5,k:TAU/50,ph:0});
      for(let i=0;i<16;i++){const x=-420+i*54;K.box(x,x+22,218,230,-4,9,2,C([106,101,96]),3,.65);rect(x+9,219,3,3,10,[127,230,216],1.2);}
      st=[[490,290],[-450,230]];
    }else if(g.k==="cyl"){
      K.lathe(0,0,0,[[-700,.01],[-690,48],[-650,105],[-610,130],[610,130],[650,105],[690,48],[700,.01]],C([190,195,204]),3,.85,0,40);
      for(let x=-580;x<600;x+=120)hoopX(x,132,0,[72,76,84],2.2);
      for(let i=0;i<70;i++)rect(-620+i*18,90,6,5,132,warm,1.1);
      K.box(-40,40,130,180,-15,32,6,C([58,61,67]),3,.6);rect(-6,178,12,6,33,[127,230,216],1.4);
      run={x0:-700,w:1400,y:-135};st=[[700,.3],[610,130],[-610,130],[-700,.3]];
    }else if(g.k==="customs"){
      K.box(-650,650,-400,400,-38,-12,8,C([39,38,36]),3,.35);
      for(let i=-3;i<=3;i++){K.box(i*170-7,i*170+7,-380,380,-12,-8,1,C([91,84,73]),3,.3);K.box(-620,620,i*110-7,i*110+7,-12,-8,1,C([91,84,73]),3,.3);}
      for(let i=0;i<48;i++){const bx=Math.round((r()-.5)*1100/170)*170-60,by=Math.round((r()-.5)*640/110)*110-40,bw=60+r()*50,bh=40+r()*55,ht=25+(bw+bh)*.32;
        K.box(bx,bx+bw,by,by+bh,-8,ht,4,C([217,212,196]),3,.35);
        for(let l=1;l<5;l++)rect(bx+5,by+bh*l/5,bw-17,1.4,ht+.3,[106,100,88],0);
        rect(bx+bw-22,by+6,10,10,ht+.5,[180,40,40],.5);}
      K.box(-130,130,-50,50,-8,72,6,C([184,178,162]),3,.4);
      for(let i=0;i<9;i++)K.box(-130+i*29,-130+i*29+29,50,60,0,12,1,C(i%2?[232,184,48]:[22,26,32]),3,.35);
      for(const x of [-145,145])L.push({x,y:55,c:warm,r:4,k:0,ph:0});st=[[650,400],[-650,400]];
    }else if(g.k==="dock"){
      K.box(-650,650,-190,190,-35,-5,6,C([42,39,35]),3,.45);
      for(const y of [-190,180])K.box(-650,650,y,y+10,-5,12,2,C(steel),3,.55);
      for(const x of [-650,640])K.box(x,x+10,-190,190,-5,12,2,C(steel),3,.55);
      for(let i=1;i<14;i++){const x=-650+1300*i/14;K.box(x-2,x+2,-190,190,-4,9,.5,C([112,105,92]),3,.5);}
      const hp=[];for(let i=0;i<=16;i++){const x=-559+i*(494/16),rr=84*Math.sqrt(Math.max(0,1-Math.pow((x+65)/494,2)));hp.push([x+559,Math.max(.01,rr)]);}
      K.lathe(-559,0,20,hp,C([82,77,69]),3,.55,0,28);
      for(let i=0;i<14;i++){const x=-65+494*(i/13*2-1)*.92,rr=84*Math.sqrt(Math.max(0,1-Math.pow((x+65)/494,2)));hoopX(x,rr,20,[164,154,134],2);}
      for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5])K.tube([[-65,Math.cos(a)*84,20+Math.sin(a)*84],[429,1,20]],2,C([164,154,134]),3,.5,6);
      for(let i=0;i<6;i++){const x=-570+i*230;K.box(x,x+14,-230,-190,-5,45,2,C([154,144,128]),3,.5);K.box(x-30,x+44,-234,-226,35,45,2,C([154,144,128]),3,.5);L.push({x:x+40,y:-232,c:warm,r:4,k:0,ph:0});}
      for(let i=0;i<40;i++){const em=.3+.5*r(),x=-630+r()*1260;rect(x,176,3,3,13,warm,em*1.8);}st=[[650,230],[-650,230]];
    }else if(g.k==="town"){
      for(let i=0;i<26;i++){const bx=(r()-.5)*1100,by=(r()-.5)*700,br=40+r()*110,n=6+(r()*4|0),RR=[];
        for(let k=0;k<n;k++)RR.push(br*(.75+r()*.35));
        const R=[[.72,-.28],[1,0],[.64,.34]].map(([sc,z])=>{const P=[];for(let k=0;k<=n;k++){const j=k%n,a=j/n*TAU;P.push([bx+Math.cos(a)*RR[j]*sc,by+Math.sin(a)*RR[j]*sc,br*z]);}return P;});
        K.loft(R,C([82,72,60]),3,.18,0);K.face(R[2].slice(0,n),[bx,by,0],C([82,72,60]),3,.18,0);K.face(R[0].slice(0,n),[bx,by,0],C([42,37,32]),3,.18,0);
        for(let l=0;l<5;l++)if(r()<.7)rect(bx+(r()-.5)*br*.9,by+(r()-.5)*br*.9,5,4,br*.34+1,warm,1.25);}
      const Road=[];for(let i=0;i<=24;i++){const t=i/24,x=(1-t)*(1-t)*-520+2*(1-t)*t*-100+t*t*420,y=(1-t)*(1-t)*120+2*(1-t)*t*-160+t*t*60;Road.push([x,y,48]);}
      K.tube(Road,3,C([122,105,76]),3,.25,6);
      for(let i=0;i<14;i++){const t=i/13,x=(1-t)*(1-t)*-520+2*(1-t)*t*-100+t*t*420,y=(1-t)*(1-t)*120+2*(1-t)*t*-160+t*t*60;L.push({x,y:y-6,c:[255,240,200],r:3,k:0,ph:0});}
      st=[[650,400],[-650,400]];
    }else if(g.k==="garden"){
      K.box(-600,600,-380,380,-32,0,8,C([43,48,56]),3,.55);
      for(let x=-480;x<600;x+=120)K.box(x-1,x+1,-380,380,0,2,.2,C([27,31,37]),3,.4);
      for(let y=-260;y<380;y+=120)K.box(-600,600,y-1,y+1,0,2,.2,C([27,31,37]),3,.4);
      for(let x=-540;x<600;x+=120)for(let y=-320;y<380;y+=120)disc(x,y,2,3,[108,114,122],0,6);
      for(let i=0;i<60;i++){const bx=(r()-.5)*1100,by=(r()-.5)*700,hh=80+r()*260,zt=10+hh*.32;
        K.tube([[bx,by,3],[bx,by-hh,zt]],2,C([154,166,180]),3,.65,6);
        for(let k=1;k<4;k++){const u=k/4,y=by-hh*u,z=3+(zt-3)*u;K.tube([[bx-8,y,z],[bx+8,y,z]],1.5,C([154,166,180]),3,.6,5);}
        K.box(bx-6,bx+6,by-4,by+4,0,8,1,C([58,65,72]),3,.5);L.push({x:bx,y:by-hh,c:cold,r:5,k:TAU/30,ph:i*.37*TAU});}
      K.box(-60,60,-30,30,0,35,5,C([74,82,96]),3,.6);rect(-50,-20,100,8,36,cold,1.25);st=[[600,380],[-600,380]];
    }
    const m=h3dPack(K.V,g.k==="moon"?560:760,{st,ne:2.2,kh:.6,gl:.35});m.L=L;m.len=1300;m.pulse=pulse;m.run=run;return m;
  });
}
function bodyGiant(g,x,y,S){
  if(!bodyGpu())return false;
  const P=giantPos(g),m=h3dGiantMesh(g);if(m.len*S<BODY.LOD){bodyDot(x,y,[100,92,78],P.x,P.y,1);return true;}
  if(!bodyRun(m,x,y,0,S,P.x,P.y,.15))return false;
  bodyLights(m,x,y,0,S,1);const pass=gpuScene();if(!pass)return true;
  if(m.pulse){const q=m.pulse,on=.3+.6*(.5+.5*Math.sin(G.t/60*1.3)),px=x+q.x*S,py=y+q.y*S,rr=Math.max(1.5,q.r*S);
    gpuShapes(pass,[[1,px,py,rr,0,0,0,q.c[0],q.c[1],q.c[2],on]]);gpuShapes(pass,[[1,px,py,rr*1.8,0,0,rr,q.c[0],q.c[1],q.c[2],on*.35]],{blend:"add"});}
  if(m.run){const q=m.run,u=(G.t/60*.15)%1,px=x+(q.x0+q.w*u)*S,py=y+q.y*S;
    gpuShapes(pass,[[0,px,py,px+Math.max(2,24*S),py+Math.max(1,4*S),0,0,47,111,208,.85]]);}
  return true;
}
function drawGiant(zx,zy,Z){
  const g=giantAt(G.sx,G.sy);if(!g)return;
  const P=giantPos(g),x=zx(P.x),y=zy(P.y),S=Z,span=900*S;
  if(x<-span||x>W+span||y<-span||y>H+span)return;
  bodyGiant(g,x,y,S);
  /* Вывески — GPU-текст поверх объёма, не часть плоского мастера. */
  if(g.k==="house"&&44*S>=8)domLabel("gih",x,y-238*S,"ДОМ ВОДИТЕЛЯ","bold "+(44*S)+"px ui-monospace,monospace","#f2c98a","center");
  else if(g.k==="cyl"&&150*S>=8)domLabel("gic",x,y+4*S,"КОМПАНИЯ™","bold "+(150*S)+"px sans-serif","#2f6fd0","center");
  else if(g.k==="customs"&&40*S>=8)domLabel("giu",x,y,"ТАМОЖНЯ","bold "+(40*S)+"px ui-monospace,monospace","#3a3630","center");
  /* имя — над телом, в пикселях экрана; под ним мерило (M464): во сколько ваших корпусов */
  const ny=y-Math.min(H*.4,560*S)-10;
  domLabel("gi",x,ny-12,g.ru.toUpperCase(),uiFont(10),"rgba(240,220,170,.85)","center");
  domLabel("gir",x,ny,giantRuler(),uiFont(10),"rgba(240,220,170,.55)","center");
}
/* мерило: длина великана в корпусах того, на чём вы летите */
const GIANT_LEN=1300;
function giantRuler(){
  const h=hullOf(G.shipId),L=Math.max(8,(h&&h.len)||40),n=Math.round(GIANT_LEN/L);
  return "≈ "+n+" "+pl3(n,"ваш корпус","ваших корпуса","ваших корпусов")+" в длину";
}
/* прилёт: первая встреча — строка */
function giantArrive(){
  const g=giantAt(G.sx,G.sy);if(!g)return;
  G.giantsSeen=G.giantsSeen||{};
  if(G.giantsSeen[g.k])return;
  G.giantsSeen[g.k]=1;
  logAdd("good","Великан · "+(g.arm==="ядро"?"у ядра":g.arm)+": "+g.ru+" — "+g.note);
}
/* ── причал и посещение (M464) ──
   Великан — место, а не картинка: у тела причал, внутри — абзац того, как там
   живут, слух от жителей (в тетрадь и на карту, как на станции), сувенир — один
   раз на великана. Дом водителя сверх того пускает на ночь: корпус и бак. */
const GIANT_VISIT={
  moon:   {txt:"Причал в устье. Внутри — посёлок в три яруса, огни кольцами, клеть ходит круглые сутки. Шахтёры смотрят на гостей, как на погоду.",
           src:"шахтёр в столовой",keep:"Жетон шахты «Гнездо»",kn:"медный, с номером клети; сдавать не надо — «это на память, у нас их ведро»"},
  house:  {txt:"Дом водителя: коридоры в полкилометра, табличка «МЕСТ НЕТ» горит третий год. Места есть. В холле пахнет щами и солидолом.",
           src:"водитель у стойки",keep:"Ключ от номера Дома водителя",kn:"с деревянной грушей, номер 1417 · «вернёте в следующий раз»"},
  cyl:    {txt:"Цилиндр Компании изнутри — улица, загнутая вверх. Над головой чужие огороды, логотип виден из любой точки.",
           src:"житель цилиндра",keep:"Буклет «Жизнь в цилиндре™»",kn:"глянец, двенадцать страниц, три из них — условия подписки"},
  customs:{txt:"Таможенный город: каждое здание — форма, и в каждой форме — окно. Посещение тоже оформляется.",
           src:"инспектор на обеде",keep:"Форма 1-ПОС «о посещении»",kn:"заполнена, заверена, в двух экземплярах; второй экземпляр — тоже вам"},
  dock:   {txt:"Сухой док Коммуны: один корпус, леса до звёзд. Строят его триста лет; бригада сменилась одиннадцать раз, чертёж — ни разу.",
           src:"бригадир на лесах",keep:"Заклёпка со стапеля Коммуны",kn:"с того самого корпуса · на ней клеймо позапрошлого века"},
  town:   {txt:"Посёлок врос в камни пояса: дома из корпусов, мостки из обшивки. Здесь всё когда-то было кораблём.",
           src:"старик на мостках",keep:"Камешек из пояса с дыркой",kn:"«смотришь сквозь — видишь дом»"},
  garden: {txt:"Сад ретрансляторов: лес мачт, мигает вразнобой, и в каждом огне — чей-то разговор. Тихо здесь не бывает никогда.",
           src:"связист на мачте",keep:"Схема мачт Хай-Фронта",kn:"синька, мачты подписаны частотами; половина уже снята"}
};
const GIANT_DOCK=760,GIANT_NIGHT=150;
function giantInteract(sh){
  const g=giantAt(G.sx,G.sy);if(!g)return false;
  const P=giantPos(g);
  if(Math.hypot(sh.x-P.x,sh.y-P.y)>GIANT_DOCK){if(document.getElementById("giantWin"))giantClose();return false;}
  if(cue(g.ru.toUpperCase()+"\nДЕЙСТВИЕ — ПРИЧАЛИТЬ",CUE_ACT)&&actEdge)giantOpen(g);
  return true;
}
function giantClose(){const w=document.getElementById("giantWin");if(w)w.remove();}
/* слух жителей: посев великана и трёх суток, рассказчик — из его места */
function giantRumour(g){
  const V=GIANT_VISIT[g.k],q=rumoursHere(hashi(g.seed,Math.floor(celDay()/3),0x61A8))[0];if(!q)return null;
  q.src=V.src;
  q.lines=[capRu(q.img),capRu(q.where),"со слов: "+V.src+" — "+q.det];
  q.text=capRu(V.src)+" рассказывал про место: "+q.img+". "+capRu(q.where)+". "+capRu(q.det)+".";
  return q;
}
function giantNight(){
  if(G.credits<GIANT_NIGHT){say("«Мест нет.»\nне хватает "+GIANT_NIGHT+" кр",110);return false;}
  const st=stat(),heal=Math.round(st.hullMax*.15);
  G.credits-=GIANT_NIGHT;G.hull=Math.min(st.hullMax,G.hull+heal);G.fuel=st.fuelMax;
  logAdd("good","Дом водителя: ночь · −"+GIANT_NIGHT+" кр · корпус +"+heal+", бак полный · «…для вас нашли»");
  say("«Мест нет. …Для вас найдём.»",140);
  return true;
}
function giantOpen(g){
  giantClose();
  const V=GIANT_VISIT[g.k],w=document.createElement("div");w.id="giantWin";
  G.giantsSeen=G.giantsSeen||{};
  const first=(G.giantsSeen[g.k]|0)<2;
  if(first){G.giantsSeen[g.k]=2;thingAdd("find",V.keep,g.ru+" · "+V.kn);}
  const q=giantRumour(g);
  if(q&&G.giantRum!==g.k+"#"+Math.floor(celDay()/3)){
    G.giantRum=g.k+"#"+Math.floor(celDay()/3);peopleLine(q.text,g.ru);rumourRemember(q);}
  let h="<div class='bz-h'>"+g.ru.toUpperCase()+"<s>"+(g.arm==="ядро"?"у ядра":g.arm)+" · "+giantRuler()+"</s></div>"+
    "<div class='gi-txt'>"+V.txt+"</div>";
  if(first)h+="<div class='bz-sec'>НА ПАМЯТЬ</div><div class='bz-rum'><b>"+V.keep+"</b><s>"+V.kn+" · лежит в ВЕЩАХ</s></div>";
  if(g.k==="house")h+="<div class='bz-sec'>СТОЙКА</div><div class='bz-rum'><b>Ночлег</b><s>корпус +15 %, бак полный</s>"+
    "<button class='act sm gi-night'"+(G.credits<GIANT_NIGHT?" disabled":"")+">"+GIANT_NIGHT+" КР</button></div>";
  if(q)h+="<div class='bz-sec'>ГОВОРЯТ</div><div class='bz-rum'><b>"+q.lines[0]+"</b><s>"+q.lines[1]+"<br>"+q.lines[2]+"</s>"+
    "<button class='act sm gi-map'>НА КАРТУ</button></div>";
  h+="<button class='act bz-x'>ОТЧАЛИТЬ</button>";
  w.innerHTML=h;document.body.appendChild(w);
  w.querySelector(".bz-x").onclick=giantClose;
  const bm=w.querySelector(".gi-map");if(bm)bm.onclick=()=>{giantClose();rumourToMap(q);};
  const bn=w.querySelector(".gi-night");if(bn)bn.onclick=()=>{if(giantNight()){giantOpen(g);if(typeof saveGame==="function")saveGame(true);}};
}
