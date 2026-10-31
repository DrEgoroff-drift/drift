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
/* оборот вокруг своей оси (как planetSpin): цилиндр быстрее — O'Neill, дом/док медленнее */
const GIANT_SPIN={moon:220000,house:280000,cyl:90000,customs:260000,dock:300000,town:240000,garden:200000};
function giantPeriod(g){return (GIANT_SPIN[g.k]||240000)*(.85+((g.seed>>>5)&15)/15*.3);}
function giantSpin(g){
  const per=giantPeriod(g),dir=((g.seed>>>3)&1)?1:-1;
  const t=(typeof G!=="undefined"&&typeof G.t==="number")?G.t*16.7:now();
  return t/per*TAU*dir;
}
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
  return bodyMesh("gi:"+g.k+":"+g.seed+":c119",7,()=>{
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
      /* шар — gplBody как у планет (bodyGiant); здесь только жерло, вышка, огни */
      const R=520,N=28,darkR=C([26,22,18]),rimC=C([168,140,102]),soot=C([12,10,9]);
      const mkAt=(cx,cy,rr,z,rev)=>{const P=[];for(let i=0;i<=N;i++){const a=(rev?N-i:i)/N*TAU;P.push([cx+Math.cos(a)*rr,cy+Math.sin(a)*rr,z]);}return P;};
      const mx=R*.2,my=-R*.15,mr=R*.4,zSurf=Math.sqrt(Math.max(1,R*R-mx*mx-my*my));
      const bowl=[];
      for(let i=0;i<=14;i++){const t=i/14;bowl.push(mkAt(mx,my,Math.max(4,mr*(1-t*.93)),zSurf-t*R*1.1,1));}
      K.loft(bowl,darkR,3,.08,0);
      K.loft([mkAt(mx,my,mr,zSurf,0),mkAt(mx,my,mr+16,zSurf+10,0),mkAt(mx,my,mr-6,zSurf-4,0)],rimC,3,.4,0);
      for(let k=1;k<=6;k++){
        const t=k/7,rr=mr*(1-t*.9)*.88,zz=zSurf-t*R*1.0,nL=8+k*4;
        for(let i=0;i<nL;i++){const a=i/nL*TAU+k*.29,lx=mx+Math.cos(a)*rr,ly=my+Math.sin(a)*rr;
          disc(lx,ly,2.6,zz+2,warm,1.35,6);L.push({x:lx,y:ly,c:warm,r:3,k:0,ph:i+k});}
      }
      disc(mx,my,mr*.18,zSurf-R*1.0,soot,.2,16);
      const tx=mx+mr*.88,ty=my;
      K.tube([[tx,ty,zSurf],[tx,ty,zSurf+100]],4.5,C(iron),3,.5,8);
      for(let k=1;k<4;k++)K.tube([[tx-14,ty,zSurf+k*22],[tx+14,ty,zSurf+k*22]],1.3,C(steel),3,.45,5);
      K.lathe(tx,ty,zSurf+100,[[0,1],[5,8],[10,10]],C(steel),3,.7,0,10,null,null);
      for(const a of[0,TAU/3,2*TAU/3])
        K.tube([[tx,ty,zSurf+70],[tx+Math.cos(a)*48,ty+Math.sin(a)*48,zSurf+10]],1.5,C(iron),3,.4,5);
      K.box(tx-10,tx+10,ty-10,ty+10,zSurf,zSurf+8,2,C(steel),3,.5);
      for(let i=0;i<8;i++)rect(tx+12+i*7,ty-4,3,3,zSurf+5,warm,1.4);
      pulse={x:tx,y:ty,r:9,c:warm};
      st=[[mr+30,zSurf+20],[-mr-30,zSurf+20]];
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
      /* мачта и лотки на крыше — craft G15 */
      K.tube([[420,0,82],[420,0,160]],3.5,C(iron),3,.5,8);
      K.lathe(420,0,160,[[0,1],[4,6],[8,9]],C(steel),3,.7,0,12,null,null);
      for(const s of[-1,1])K.tube([[-400,s*40,72],[400,s*40,72]],1.2,C([28,26,24]),3,.4,5);
      for(let i=0;i<6;i++){const x=-360+i*140; /* люки на крыше */
        K.box(x-8,x+8,-40,40,82,86,1.5,C(iron),3,.5);
        for(const s of[-1,1])K.box(x+s*6-.3,x+s*6+.3,-30,30,85,87.5,.4,C(steel),3,.6);}
      for(let i=0;i<5;i++){const x=-300+i*150; /* вентиляторы на крыше */
        K.lathe(x,120,88,[[0,2],[3,6],[6,7]],C(steel),3,.6,0,10,null,null);
        K.box(x-4,x+4,116,124,82,86,1,C(iron),3,.5);}
      for(let i=0;i<8;i++){const x=-400+i*100; /* водостоки */
        K.tube([[x,-180,82],[x,-210,40]],1.2,C([28,26,24]),3,.4,5);}
      K.box(-30,30,-30,30,82,90,2,C(steel),3,.55); /* машинное отделение на крыше */
      for(let i=0;i<4;i++){const x=-200+i*140; /* дымоходы */
        K.tube([[x,50,90],[x,50,130]],3,C(iron),3,.5,8);}
      /* нижний ряд мотельных кабин (kimi house buildLowerMotelCabins) */
      for(let i=0;i<14;i++){
        const x=-420+i*64,y=-194;
        K.box(x-27,x+27,y-24,y+24,-55,-12,4,C(i%4===0?[70,64,56]:[36,32,28]),3,.45);
        K.box(x-29,x+29,y-26,y+26,-12,-7,2,C(i%5===0?iron:steel),3,.5);
        rect(x-8,y-22,16,18,-11,i%3===0?[160,48,36]:steel,.4);
        rect(x+6,y-10,14,12,-11,i%6===0?cold:warm,i%6===0?0:.5);
      }
      /* баки и отдушины на крыше (kimi house buildRoofTanksAndVents) */
      for(const [tx,ty,rr,hh] of [[-300,80,14,32],[-180,-60,12,28],[40,90,16,36],[220,-70,13,30],[380,50,11,26]]){
        K.box(tx-rr*1.3,tx+rr*1.3,ty-rr*1.3,ty+rr*1.3,82,88,2,C([36,32,28]),3,.5);
        K.lathe(tx,ty,88,[[0,rr],[hh*.4,rr],[hh*.85,rr*.95],[hh,rr*.4]],C(steel),3,.55,0,14,null,null);
        K.box(tx-rr-2,tx+rr+2,ty-rr-2,ty+rr+2,88+hh,88+hh+4,1.5,C([36,32,28]),3,.5);
        K.tube([[tx,ty,88+hh+4],[tx,ty,88+hh+14]],.8,C(iron),3,.5,6);
        rect(tx-2,ty-2,4,3,88+hh+15,[160,48,36],.7);
      }
      /* пожарные лестницы на длинных фасадах (kimi house buildFireEscapes) */
      for(const s of[-1,1]){
        const y=s*208;
        for(let bay=0;bay<4;bay++){
          const x=-300+bay*200;
          for(let fl=0;fl<4;fl++){
            const z=10+fl*16;
            K.box(x-16,x+16,y-1.5,y+1.5,z,z+2,1,C(steel),3,.55);
            for(const dx of[-14,14])K.tube([[x+dx,y,z],[x+dx,y,z+14]],.5,C(iron),3,.5,5);
            if(fl<3){
              const dir=fl%2?1:-1;
              K.tube([[x-dir*12,y,z+2],[x+dir*12,y,z+16]],1.1,C([36,32,28]),3,.45,5);
            }
          }
        }
      }
      /* пандус для фур + табло «МЕСТ НЕТ» (kimi-giant-house craft) */
      for(let i=0;i<10;i++){
        const t=i/10,y0=212+t*68,y1=212+(i+1)/10*68,z0=-18+t*38,z1=-18+(i+1)/10*38;
        K.box(-500,500,y0,y1,z0,z1,3.5,C(i%5===0?[36,32,28]:[48,44,40]),3,.5);
      }
      for(const s of[-1,1])for(let i=0;i<11;i++){
        const t=i/10,y=212+t*68,z=-14+t*38;
        K.box(s*492-1.5,s*492+1.5,y-1.5,y+1.5,z,z+16,.7,C(i%3===0?[140,48,40]:iron),3,.55);
      }
      for(let i=0;i<6;i++){const x=-420+i*140;rect(x,278,10,2.5,22,[220,70,45],1.15);}
      K.box(-48,48,236,244,48,78,2.2,C([24,20,18]),3,.5);
      rect(-36,238,72,10,79,[255,64,48],1.35);
      for(const s of[-1,1])K.box(s*46-2,s*46+2,238,242,50,76,.8,C(steel),3,.55);
      st=[[490,290],[-450,230]];
    }else if(g.k==="cyl"){
      K.lathe(0,0,0,[[-700,.01],[-690,48],[-650,105],[-610,130],[610,130],[650,105],[690,48],[700,.01]],C([190,195,204]),3,.85,0,40);
      for(let x=-580;x<600;x+=120)hoopX(x,132,0,[72,76,84],2.2);
      for(let i=0;i<70;i++)rect(-620+i*18,90,6,5,132,warm,1.1);
      K.box(-40,40,130,180,-15,32,6,C([58,61,67]),3,.6);rect(-6,178,12,6,33,[127,230,216],1.4);
      /* панели и люки на цилиндре — craft G15 */
      for(let i=0;i<8;i++){const x=-480+i*120;
        K.box(x-18,x+18,100,128,133,136,1.2,C([48,52,58]),3,.5);
        for(const s of[-1,1])K.box(x+s*14-.4,x+s*14+.4,105,123,135.5,137.5,.3,C(iron),3,.6);}
      K.tube([[-650,0,135],[650,0,135]],1.5,C([28,26,24]),3,.4,5);
      for(let i=0;i<10;i++){const x=-540+i*120; /* заклёпки обручей */
        K.box(x-.5,x+.5,128,136,133,137,.4,C(iron),3,.55);}
      K.box(-30,30,175,195,20,40,3,C(steel),3,.55); /* рубка цилиндра */
      for(const s of[-1,1])K.box(s*25-4,s*25+4,170,200,15,25,1.5,C(iron),3,.5); /* упоры рубки */
      for(let i=0;i<5;i++){const x=-500+i*250; /* люки цилиндра */
        K.box(x-12,x+12,115,125,130,134,1,C(iron),3,.5);}
      for(const s of[-1,1])K.tube([[s*40,130,30],[s*40,175,35]],2,C(steel),3,.5,6); /* стойки рубки */
      /* полоса КОМПАНИЯ™ + торцевые шлюзы (kimi-giant-cyl craft) */
      K.box(-520,520,128,138,133,142,3,C([140,52,40]),3,.55);
      for(let i=0;i<9;i++){const x=-480+i*110;
        K.box(x-18,x+18,130,136,141,148,1.8,C([210,70,48]),3,.6);
        rect(x-12,131,24,4,149,[255,210,160],1.2);}
      for(const s of[-1,1]){
        K.box(s*680-28,s*680+28,-90,90,-40,40,5,C([48,52,58]),3,.55);
        K.lathe(s*710,0,0,[[0,8],[18,28],[36,30]],C(steel),3,.65,0,14,null,null);
        for(let i=0;i<6;i++){const a=i/6*TAU;
          K.tube([[s*680,Math.cos(a)*50,Math.sin(a)*50],[s*740,Math.cos(a)*28,Math.sin(a)*28]],1.6,C(iron),3,.5,5);}
        for(let i=0;i<4;i++)rect(s*695-6,-20+i*12,12,6,42,warm,1.15);}
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
      for(const x of [-145,145])L.push({x,y:55,c:warm,r:4,k:0,ph:0});
      /* мачта связи и лотки — craft G15 */
      K.tube([[0,0,72],[0,0,140]],4,C(steel),3,.5,8);
      K.lathe(0,0,140,[[0,1],[5,8],[10,11]],C([214,220,228]),3,.75,0,12,null,null);
      for(const s of[-1,1])K.tube([[-200,s*200,0],[200,s*200,0]],1.4,C([28,26,24]),3,.4,5);
      for(let i=0;i<6;i++){const a=i/6*TAU; /* растяжки мачты */
        K.tube([[0,0,100],[Math.cos(a)*80,Math.sin(a)*80,20]],1.1,C(iron),3,.4,5);}
      K.box(-20,20,-20,20,140,148,2,C(steel),3,.55); /* площадка мачты */
      /* ворота контроля + номерные таблички (kimi-giant-customs) */
      for(const s of[-1,1]){
        const gx=s*580;
        K.box(gx-35,gx+35,-70,70,-8,20,4,C([36,34,30]),3,.45);
        for(const z of[-55,55]){
          K.box(gx-18,gx+18,z-14,z+14,20,95,5,C([200,196,180]),3,.4);
          K.box(gx-22,gx+22,z-18,z+18,95,108,2,C([160,48,36]),3,.55);
          rect(gx-10,z-8,20,12,109,warm,1.2);
        }
        K.box(gx-20,gx+20,-55,55,108,125,3,C([42,40,36]),3,.5);
        K.box(gx+s*18-4,gx+s*18+4,-50,50,112,122,1.5,C([160,48,36]),3,.55);
        for(let i=0;i<4;i++){const z=-40+i*26;K.box(gx+s*22-2,gx+s*22+2,z-8,z+8,118,128,.8,C([230,220,200]),3,.4);}
        for(const z of[-40,40]){
          K.tube([[gx,z,25],[gx,z,85]],4,C(steel),3,.55,8);
          K.box(gx-12,gx+12,z-6,z+6,85,95,2,C([140,52,40]),3,.55);
        }
      }
      for(let i=0;i<12;i++){ /* инспекционные рамки у ворот */
        const s=i<6?-1:1,x=s*(420+((i%6)*22)),z=((i%2)?1:-1)*28;
        K.box(x-6,x+6,z-8,z+8,20,70,2,C([36,34,30]),3,.5);
        K.box(x-8,x+8,z-10,z+10,70,78,1.5,C([160,48,36]),3,.55);
        rect(x-4,z-4,8,5,79,warm,.9);
      }
      for(let i=0;i<24;i++){ /* номерные таблички на фасадах блоков */
        const bx=Math.round((r()-.5)*1000/170)*170-40,by=Math.round((r()-.5)*560/110)*110-20;
        const ox=35+(r()*25|0),ht=35+r()*35;
        K.box(bx+ox,bx+ox+14,by+6,by+18,ht+.2,ht+12,.6,C([28,26,22]),3,.45);
        rect(bx+ox+2,by+8,10,8,ht+13,[220,210,190],.7);
      }
      /* башни штампов + ограждения очереди (kimi customs densify) */
      for(const [tx,ty] of [[-420,0],[420,0],[0,-420],[0,420]]){
        K.box(tx-20,tx+20,ty-20,ty+20,-8,12,4,C([60,56,50]),3,.4);
        for(let y=12;y<100;y+=14)K.box(tx-14,tx+14,ty-14,ty+14,y,y+10,3,(y/14|0)%2?C([80,76,68]):C(steel),3,.45);
        K.box(tx-18,tx+18,ty-18,ty+18,100,108,2,C([160,48,36]),3,.55);
        K.tube([[tx,ty,108],[tx,ty,130]],1.5,C(steel),3,.55,6);
        rect(tx-6,ty-6,12,8,131,warm,1);
      }
      for(const s of[-1,1])for(let lane=0;lane<3;lane++){
        const z=s*(50+lane*26);
        for(let i=0;i<10;i++){
          const x=-180+i*36;
          K.box(x-3,x+3,z-3,z+3,8,22,1,C([36,34,30]),3,.5);
          K.box(x-7,x+7,z-7,z+7,22,26,1,C(steel),3,.55);
        }
      }
      /* весовые платформы у ворот (kimi customs buildWeighbridges) */
      for(const s of[-1,1])for(let i=0;i<3;i++){
        const x=s*(200+i*120),y=s*40;
        K.box(x-45,x+45,y-18,y+18,-5,1,3,C(steel),3,.55);
        K.box(x-40,x+40,y-14,y+14,1,3,2,C([28,26,24]),3,.45);
        for(const dx of[-35,35]){
          K.tube([[x+dx,y-14,3],[x+dx,y+14,3]],1.2,C(iron),3,.5,6);
          K.box(x+dx-5,x+dx+5,y-5,y+5,3,11,1.5,C([180,140,60]),3,.5);
        }
        K.box(x+s*50-10,x+s*50+10,y-12,y+12,-5,25,3,C([184,178,162]),3,.4);
        rect(x+s*50-6,y-5,12,10,26,warm,.8);
      }
      /* маяки периметра (kimi customs buildBorderBeacons) */
      for(let i=0;i<16;i++){
        const a=i/16*TAU,x=Math.cos(a)*620,y=Math.sin(a)*620;
        K.box(x-9,x+9,y-9,y+9,-8,0,2,C([36,34,30]),3,.5);
        K.tube([[x,y,0],[x,y,70]],2,C(steel),3,.55,8);
        K.box(x-7,x+7,y-7,y+7,70,80,2,C([160,48,36]),3,.55);
        rect(x-4,y-4,8,6,81,i%2?warm:[200,40,40],.9);
        for(let k=0;k<3;k++){
          const aa=a+k*2.1;
          K.tube([[x,y,40],[x+Math.cos(aa)*20,y+Math.sin(aa)*20,30]],.6,C(iron),3,.4,5);
        }
      }
      /* лотки для бланков на фасадах (kimi customs buildDocumentChutes) */
      for(let i=0;i<6;i++){
        const x=-400+i*160,y=200;
        for(let k=0;k<4;k++){
          const xx=x-48+k*32;
          K.box(xx-5,xx+5,y-3,y+3,28,68,2,C([36,32,28]),3,.5);
          K.box(xx-3,xx+3,y+2,y+5,32,64,1,C([220,210,190]),3,.35);
          for(let s=0;s<4;s++)K.box(xx-4,xx+4,y+4,y+6,36+s*8,38+s*8,.4,C([160,48,36]),3,.55);
        }
      }
      /* архивные стеллажи (kimi customs buildArchiveStacks) */
      for(let i=0;i<8;i++){
        const x=-420+i*110;
        for(let row=0;row<2;row++){
          const y=-80+row*100;
          K.box(x-32,x+32,y-22,y+22,-5,6,3,C([70,64,56]),3,.4);
          for(let shelf=0;shelf<4;shelf++){
            const z=10+shelf*14;
            K.box(x-28,x+28,y-18,y+18,z,z+2,1,C(steel),3,.55);
            for(let b=0;b<5;b++)K.box(x-24+b*10,x-16+b*10,y-8,y+8,z+2,z+10,1.2,C(b%2?[220,210,190]:[36,32,28]),3,.4);
          }
        }
      }
      st=[[650,400],[-650,400]];
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
      for(let i=0;i<40;i++){const em=.3+.5*r(),x=-630+r()*1260;rect(x,176,3,3,13,warm,em*1.8);}
      /* портальный кран над палубой */
      K.box(-40,40,-250,-210,80,88,4,C(steel),3,.55);
      K.tube([[0,-230,88],[0,-230,160]],5,C(iron),3,.5,8);
      K.box(-55,55,-245,-215,155,168,3,C(steel),3,.5);
      K.tube([[0,-230,160],[80,-180,40]],1.6,C([28,26,24]),3,.4,5);
      K.tube([[-40,-230,88],[40,-230,88]],2,C(steel),3,.45,5);
      for(const s of[-1,1])K.box(s*50-3,s*50+3,-235,-225,80,95,2,C(iron),3,.5);
      K.box(-60,60,-240,-220,88,92,2,C(steel),3,.5);
      for(let i=0;i<8;i++){const x=-560+i*160;
        K.lathe(x,185,12,[[0,2],[3,5],[5,4]],C(steel),3,.55,0,8,null,null);
        K.box(x-6,x+6,178,182,8,14,1,C(iron),3,.5);}
      for(let i=0;i<4;i++){const x=-500+i*300;K.box(x-3,x+3,-190,-170,-5,40,1.5,C(steel),3,.5);}
      for(let i=0;i<6;i++){const x=-550+i*220;K.tube([[x,160,5],[x,160,25]],2,C(iron),3,.5,6);}
      for(let i=0;i<4;i++){const x=-450+i*300;K.box(x-20,x+20,140,175,5,18,3,C(steel),3,.5);}
      for(let i=0;i<5;i++){const x=-520+i*260;K.box(x-15,x+15,-150,-130,-3,6,1.5,C(iron),3,.5);}
      /* нос недостроен + леса / подмости (kimi dock craft) */
      for(let i=0;i<8;i++){const a=i/8*TAU,rr=70;
        K.tube([[420,Math.cos(a)*rr*.3,20+Math.sin(a)*rr*.3],[520,Math.cos(a)*rr,20+Math.sin(a)*rr]],2.2,C([90,84,72]),3,.45,5);}
      for(let i=0;i<5;i++){
        const x=430+i*28;
        K.box(x-2,x+2,-90,90,-5,55,1.2,C([120,110,95]),3,.5);
        K.box(x-20,x+20,-2,2,48,52,1,C(steel),3,.55);
        for(const s of[-1,1])K.box(x-1,x+1,s*70-2,s*70+2,0,50,.8,C(iron),3,.5);
      }
      K.box(500,540,-40,40,10,70,3,C([50,46,40]),3,.4);
      for(let i=0;i<6;i++)rect(508,-30+i*12,24,8,71,warm,.6+r()*.5);
      /* второй портальный кран у кормы остова */
      K.box(-420,-340,-250,-210,70,78,3,C(steel),3,.55);
      K.tube([[-380,-230,78],[-380,-230,140]],4,C(iron),3,.5,8);
      K.box(-400,-360,-245,-215,135,148,2,C(steel),3,.5);
      K.tube([[-380,-230,140],[-300,-180,30]],1.4,C([28,26,24]),3,.4,5);
      /* сараи верфи у борта (kimi dock craft) */
      for(let i=0;i<5;i++){
        const x=-500+i*200;
        K.box(x-50,x+50,200,260,-5,45,4,C([70,64,56]),3,.4);
        K.box(x-55,x+55,195,265,45,55,2,C(iron),3,.5);
        for(let w=0;w<3;w++)rect(x-35+w*28,248,18,14,46,warm,.5+r()*.4);
      }
      /* леса вдоль борта (kimi dock buildScaffoldFrames) */
      for(let bay=0;bay<8;bay++){
        const x=-450+bay*100;
        for(const s of[-1,1]){
          const y=s*140;
          K.tube([[x,y,-5],[x,y,110]],2.5,C(steel),3,.5,6);
          K.tube([[x+36,y,-5],[x+36,y,110]],2.5,C(steel),3,.5,6);
          for(let z=0;z<=110;z+=28){
            K.tube([[x,y,z],[x+36,y,z]],1.4,C(iron),3,.45,5);
            K.tube([[x,y,z],[x,y+s*35,z]],1.1,C(iron),3,.4,5);
          }
          for(let z=0;z<110;z+=28){
            K.tube([[x,y,z],[x+36,y,z+28]],.9,C([36,32,28]),3,.4,5);
            K.tube([[x+36,y,z],[x,y,z+28]],.9,C([36,32,28]),3,.4,5);
          }
        }
        K.tube([[x, -140,100],[x,140,100]],2.2,C(steel),3,.5,5);
      }
      /* кильблоки под остовом (kimi dock buildKeelBlocks) */
      for(let i=0;i<10;i++){
        const x=-450+i*90;
        K.box(x-20,x+20,-40,40,-35,-22,3,C([70,64,56]),3,.4);
        K.box(x-15,x+15,-30,30,-22,-12,2,C(steel),3,.5);
        for(const s of[-1,1])K.tube([[x+s*12,s*28,-20],[x+s*12,s*36,15]],1.1,C(iron),3,.45,5);
      }
      /* штабеля листов у борта (kimi dock buildPlateStacks) */
      for(let i=0;i<6;i++){
        const x=-480+i*140,y=230;
        for(let k=0;k<5;k++)K.box(x-35,x+35,y-20,y+20,-8+k*7,-2+k*7,2,C(k%2?steel:iron),3,.5);
      }
      /* кнехты на причале (kimi dock buildBollardsAndCleats) */
      for(let i=0;i<12;i++){
        const x=-580+i*100;
        for(const s of[-1,1]){
          const y=s*185;
          K.lathe(x,y,-5,[[0,3],[6,5],[10,4]],C(steel),3,.55,0,8,null,null);
          K.box(x-7,x+7,y-7,y+7,-12,-5,1.5,C([36,32,28]),3,.5);
        }
      }
      st=[[650,230],[-650,230]];
    }else if(g.k==="town"){
      for(let i=0;i<26;i++){const bx=(r()-.5)*1100,by=(r()-.5)*700,br=40+r()*110,n=6+(r()*4|0),RR=[];
        for(let k=0;k<n;k++)RR.push(br*(.75+r()*.35));
        const R=[[.72,-.28],[1,0],[.64,.34]].map(([sc,z])=>{const P=[];for(let k=0;k<=n;k++){const j=k%n,a=j/n*TAU;P.push([bx+Math.cos(a)*RR[j]*sc,by+Math.sin(a)*RR[j]*sc,br*z]);}return P;});
        K.loft(R,C([82,72,60]),3,.18,0);K.face(R[2].slice(0,n),[bx,by,0],C([82,72,60]),3,.18,0);K.face(R[0].slice(0,n),[bx,by,0],C([42,37,32]),3,.18,0);
        for(let l=0;l<5;l++)if(r()<.7)rect(bx+(r()-.5)*br*.9,by+(r()-.5)*br*.9,5,4,br*.34+1,warm,1.25);}
      const Road=[];for(let i=0;i<=24;i++){const t=i/24,x=(1-t)*(1-t)*-520+2*(1-t)*t*-100+t*t*420,y=(1-t)*(1-t)*120+2*(1-t)*t*-160+t*t*60;Road.push([x,y,48]);}
      K.tube(Road,3,C([122,105,76]),3,.25,6);
      for(let i=0;i<14;i++){const t=i/13,x=(1-t)*(1-t)*-520+2*(1-t)*t*-100+t*t*420,y=(1-t)*(1-t)*120+2*(1-t)*t*-160+t*t*60;L.push({x,y:y-6,c:[255,240,200],r:3,k:0,ph:0});}
      K.tube([[200,40,0],[200,40,90]],5,C(iron),3,.5,8);
      K.lathe(200,40,90,[[0,2],[8,14],[18,16],[22,4]],C(steel),3,.55,0,12,null,null);
      for(const a of[0,TAU/3,2*TAU/3])K.tube([[200,40,70],[200+Math.cos(a)*30,40+Math.sin(a)*30,20]],1.2,C(iron),3,.4,5);
      /* мосты + дымоходы */
      for(let i=0;i<5;i++){
        const x=-400+i*180,y=-80+((i%3)-1)*60;
        K.box(x-60,x+60,y-8,y+8,20,28,2,C([70,62,52]),3,.35);
        K.box(x-4,x+4,y-6,y+6,0,22,1.5,C(iron),3,.5);
        K.box(x-55,x+55,y-3,y+3,26,30,1,C(steel),3,.45);
      }
      for(let i=0;i<8;i++){
        const bx=(r()-.5)*900,by=(r()-.5)*500;
        K.tube([[bx,by,40],[bx,by,90+r()*40]],3+r()*2,C([60,54,46]),3,.45,6);
        L.push({x:bx,y:by,c:[180,120,80],r:3,k:0,ph:i*.2});
      }
      /* антенны на крышах + опоры мостков */
      for(let i=0;i<6;i++){const bx=(r()-.5)*800,by=(r()-.5)*450;
        K.tube([[bx,by,50],[bx,by,70]],1.5,C(steel),3,.55,6);
        K.lathe(bx,by,70,[[0,.5],[4,6],[8,1]],C([180,186,194]),3,.6,0,10,null,null);}
      for(let i=0;i<4;i++){const x=-350+i*220;
        K.box(x-2,x+2,-120,40,0,18,1,C(iron),3,.45);}
      /* лебёдки у мостов + ящики у дорог */
      for(let i=0;i<5;i++){
        const x=-400+i*180,y=-80+((i%3)-1)*60;
        K.lathe(x,y+20,32,[[0,2],[6,8],[10,4]],C(steel),3,.55,0,10,null,null);
        K.tube([[x,y+20,32],[x,y+20,48]],1.4,C(iron),3,.5,6);
      }
      for(let i=0;i<8;i++){
        const bx=(r()-.5)*900,by=(r()-.5)*500;
        K.box(bx-12,bx+12,by-10,by+10,0,14,2,C([70,62,52]),3,.4);
      }
      /* шахты лифтов между домами (kimi town buildUtilityElevators) */
      for(const [tx,ty,hh] of [[-400,160,110],[-120,-180,150],[280,140,180],[460,-100,130]]){
        for(const s of[-1,1]){
          K.tube([[tx+s*10,ty,0],[tx+s*10,ty,hh]],1.4,C([36,32,28]),3,.5,6);
          for(let z=8;z<hh;z+=18)K.box(tx+s*10-2.5,tx+s*10+2.5,ty-6,ty+6,z,z+3,1,C(steel),3,.55);
        }
        for(let z=0;z<hh;z+=22)K.tube([[tx-10,ty,z],[tx+10,ty,z]],.8,C(iron),3,.45,5);
        const cz=hh*.42;
        K.box(tx-12,tx+12,ty+4,ty+22,cz-14,cz+14,3,C([160,48,36]),3,.5);
        K.box(tx-14,tx+14,ty+2,ty+24,cz+14,cz+18,1.5,C([36,32,28]),3,.5);
        rect(tx-6,ty+20,12,10,cz+3,warm,.7);
        K.box(tx-16,tx+16,ty-10,ty+14,hh,hh+10,2,C([36,32,28]),3,.5);
        K.lathe(tx,ty,hh+10,[[0,2],[4,6],[7,4]],C(steel),3,.55,0,10,null,null);
      }
      /* фонари швартовки у кромки пояса (kimi town buildMooringLightPosts) */
      for(const [tx,ty] of [[-480,-280],[-480,-120],[480,-280],[480,-120],[-620,220],[620,220]]){
        K.box(tx-7,tx+7,ty-7,ty+7,0,6,1.5,C([36,32,28]),3,.5);
        K.lathe(tx,ty,6,[[0,2],[4,4],[6,3]],C([160,48,36]),3,.55,0,8,null,null);
        K.tube([[tx,ty,10],[tx,ty,42]],1.2,C(steel),3,.5,6);
        for(const s of[-1,1]){
          K.box(tx+s*8-2,tx+s*8+2,ty-2,ty+2,36,42,1,C([36,32,28]),3,.5);
          rect(tx+s*8-1.5,ty-1,3,2,43,warm,.8);
        }
      }
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
      K.box(-60,60,-30,30,0,35,5,C([74,82,96]),3,.6);rect(-50,-20,100,8,36,cold,1.25);
      /* сервисный кран и лоток */
      K.tube([[80,0,8],[80,0,90]],3.5,C(steel),3,.5,8);
      K.box(60,100,-20,20,85,95,2,C(iron),3,.55);
      K.tube([[-500,0,4],[500,0,4]],1.2,C([28,26,24]),3,.4,5);
      K.tube([[80,0,90],[40,-40,40]],1.4,C([28,26,24]),3,.4,5);
      for(const s of[-1,1])K.box(s*70-4,s*70+4,-8,8,0,6,1,C(steel),3,.5);
      for(let i=0;i<6;i++){const x=-450+i*180;K.box(x-10,x+10,-15,15,0,3,1.2,C(iron),3,.5);}
      for(let i=0;i<4;i++){const x=-360+i*240;K.box(x-15,x+15,-25,25,0,8,2,C([58,65,72]),3,.5);}
      /* параболические тарелки ретрансляторов (kimi garden craft) */
      for(let i=0;i<12;i++){
        const bx=(r()-.5)*1000,by=(r()-.5)*640,hh=30+r()*50,rr=18+r()*28;
        K.tube([[bx,by,0],[bx,by,hh]],2.2,C(steel),3,.55,6);
        K.lathe(bx,by,hh,[[0,2],[rr*.4,rr*.55],[rr*.85,rr],[rr,rr*.35]],C([168,178,192]),3,.65,0,14,null,null);
        K.tube([[bx,by,hh],[bx+(r()-.5)*12,by+(r()-.5)*12,hh+rr*.6]],1.1,C(iron),3,.5,5);
        L.push({x:bx,y:by,c:cold,r:4,k:TAU/40,ph:i*.29*TAU});
      }
      /* крупные тарелки у края площадки */
      for(const [bx,by,rr] of [[-420,220,55],[-280,-260,48],[360,180,60],[440,-200,42]]){
        K.tube([[bx,by,0],[bx,by,45]],4,C(iron),3,.5,8);
        K.box(bx-12,bx+12,by-12,by+12,0,8,2,C([58,65,72]),3,.5);
        K.lathe(bx,by,48,[[0,3],[rr*.35,rr*.5],[rr*.8,rr],[rr,rr*.3]],C([190,200,214]),3,.7,0,16,null,null);
        K.tube([[bx,by,48],[bx+rr*.15,by-rr*.1,48+rr*.7]],1.6,C(steel),3,.55,6);
        L.push({x:bx,y:by,c:cold,r:6,k:TAU/50,ph:bx*.01});
      }
      /* кабельные лотки между крупными тарелками */
      const dishPts=[[-420,220],[-280,-260],[360,180],[440,-200]];
      for(let i=0;i<dishPts.length-1;i++){
        const a=dishPts[i],b=dishPts[i+1];
        K.tube([[a[0],a[1],8],[b[0],b[1],8]],2.2,C([40,44,52]),3,.45,6);
        for(let t=1;t<4;t++){const u=t/4,x=a[0]+(b[0]-a[0])*u,y=a[1]+(b[1]-a[1])*u;
          K.box(x-4,x+4,y-4,y+4,6,12,1,C(steel),3,.55);}
      }
      st=[[600,380],[-600,380]];
    }
    const m=h3dPack(K.V,g.k==="moon"?560:760,{st,ne:g.k==="moon"?2.5:2.2,kh:g.k==="moon"?.78:.6,gl:g.k==="moon"?.2:.35});m.L=L;m.len=1300;m.pulse=pulse;m.run=run;return m;
  });
}
function bodyGiant(g,x,y,S){
  if(!bodyGpu())return false;
  const P=giantPos(g),m=h3dGiantMesh(g);if(m.len*S<BODY.LOD){bodyDot(x,y,[100,92,78],P.x,P.y,1);return true;}
  const pass=gpuScene(),a=giantSpin(g),ca=Math.cos(a),sa=Math.sin(a);
  /* «Гнездо»: шар тем же путём, что планеты (терминатор, лимб), поверх — жерло h3d */
  if(g.k==="moon"&&pass&&typeof gplBody==="function"){
    const [lx,ly]=sysLightDir(P.x,P.y),rr=520*S;
    const pal=[[48,42,36],[78,70,58],[108,96,80],[138,122,100],[158,142,118]];
    gplBody(pass,"gim"+g.seed,x,y,rr,null,{sx:lx||.6,sy:ly||-.3,rimK:.22,rim:[150,138,120],
      base:pal[2],sun:(typeof gplSun==="function")?gplSun():[1,.95,.85],seed:g.seed%97,kind:1,
      hi:pal[3],lo:pal[0],wet:0,pal,cloud:0,lights:0,turn:a/TAU});
  }
  if(!bodyRun(m,x,y,a,S,P.x,P.y,g.k==="moon"?.05:.15))return g.k==="moon";
  bodyLights(m,x,y,a,S,1);if(!pass)return true;
  if(m.pulse){const q=m.pulse,on=.3+.6*(.5+.5*Math.sin(G.t/60*1.3));
    const px=x+(q.x*ca-q.y*sa)*S,py=y+(q.x*sa+q.y*ca)*S,rr=Math.max(1.5,q.r*S);
    gpuShapes(pass,[[1,px,py,rr,0,0,0,q.c[0],q.c[1],q.c[2],on]]);gpuShapes(pass,[[1,px,py,rr*1.8,0,0,rr,q.c[0],q.c[1],q.c[2],on*.35]],{blend:"add"});}
  if(m.run){const q=m.run,u=(G.t/60*.15)%1,rx=q.x0+q.w*u,ry=q.y;
    const px=x+(rx*ca-ry*sa)*S,py=y+(rx*sa+ry*ca)*S;
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
const GIANT_DOCK=760,GIANT_ORBIT=1180,GIANT_NIGHT=150;
const GIANT_RAD={moon:520,house:450,cyl:400,customs:380,dock:420,town:400,garden:380};
/* устойчивое тело для орбиты и автопилота (как планета): x/y с места, radius по виду */
function giantBody(g){
  if(g._body)return g._body;
  const P=giantPos(g);
  return g._body={x:P.x,y:P.y,vx:0,vy:0,radius:GIANT_RAD[g.k]||400,name:g.ru,giant:g};
}
function giantOrbit(g){
  if(g&&g.giant)g=g.giant;
  const p=giantBody(g),sh=G.ship;
  const rx=sh.x-p.x,ry=sh.y-p.y;
  const rMin=p.radius+46;
  const r=Math.max(Math.hypot(rx,ry)||rMin,rMin);
  const ang0=Math.atan2(ry,rx)||0;
  sh.x=p.x+Math.cos(ang0)*r;sh.y=p.y+Math.sin(ang0)*r;
  const dirCcw=(rx*sh.vy-ry*sh.vx)>=0?1:-1;
  const cruise=6.4+stat().thr*1.6;
  const w=dirCcw*clamp(Math.min(.6/Math.sqrt(r),cruise*.28/Math.max(r,1)),.0006,.006);
  G.orbit={p,r,ang:ang0,w};G.orbit.sys=G.sx+","+G.sy;G.ap=null;
  say("Захват орбиты\n"+p.name+"\nДЕЙСТВИЕ — ПРИЧАЛИТЬ");
}
function giantInteract(sh){
  const g=giantAt(G.sx,G.sy);if(!g)return false;
  const B=giantBody(g),d=Math.hypot(sh.x-B.x,sh.y-B.y);
  const orbiting=!!(G.orbit&&G.orbit.p&&G.orbit.p.giant===g);
  if(d>GIANT_ORBIT){if(document.getElementById("giantWin"))giantClose();return false;}
  if(orbiting||d<=GIANT_DOCK){
    const sub=g.k==="moon"?" · ШАХТЁРСКИЙ ПОСЁЛОК":"";
    if(cue(g.ru.toUpperCase()+sub+"\nДЕЙСТВИЕ — ПРИЧАЛИТЬ",CUE_ACT)&&actEdge){G.orbit=null;giantOpen(g);}
    return true;
  }
  if(cue(g.ru.toUpperCase()+"\nДЕЙСТВИЕ — ЗАХВАТ ОРБИТЫ",CUE_ACT)&&actEdge)giantOrbit(g);
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
