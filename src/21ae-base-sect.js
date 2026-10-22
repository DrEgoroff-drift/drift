/* ══════════════ база в разрезе на движке (M632a) ══════════════
   Замысел — docs/DESIGN-base-scene.md §3–§5. Сетка игры та же (BASE_COLS × baseRows, ствол в
   колонке −1); меняется мерка: клетка 9 × 5.2 м (4 м комнаты под 1.2 м перекрытия: человек — меньше половины высоты, комната мелкая, как в
   референсе автора 15.10), ствол 3 м,
   ход 2.4 м. Порода — лист разреза пещеры (материал 10: пласты, кромка, что берёт свет пустоты),
   в нём дыры построенных отсеков; пустая клетка — камень, не рамка. За дырой — коробка комнаты:
   пол, задняя стена, потолок, светильник. Рисуют проходы пещеры (22db): тот же кадр F, те же
   шейдеры; свет — ключ с тенью в комнате человека (свой фонарь, если в ней света нет), по огню
   на каждый живой отсек, день — столбом ствола.
   Два объектива: дальний — вся база и полоса неба (меню постройки, ствол, первая секунда после
   входа), ближний — 2.3 клетки, комната человека посередине. Между ними — скольжение 0.6 с.
   Вход без среза: первый кадр — объектив хода по грунту (его высота окна), потом дальний, потом
   ближний. Игра не меняется: updateBase, клетки, меню — те же; кадр только смотрит на них.
   Старая рисовалка (21ac/21ad) не тронута: ?sect=0, сбой кадра — идёт она, после трёх подряд
   новый вид снимает себя сам. */
const SECT={on:true,bad:0,err:"",live:false,b:null,t:0,t0:0,far:1,ent:0,cx:0,face:1,idle:0,
  lens:null,lens0:null,geo:null,key:"",gen:-1,cage:null,cageY:null,farPin:null,sitPin:null,
  stat:{cpu:0,tris:0,lights:0,share:0,key:""}};
try{if(typeof location!=="undefined"&&/[?&]sect=0\b/.test(location.search))SECT.on=false;}catch(e){}
/* мерка (м): клетка, комната, глубина, линия ходьбы, ход, ствол, поверхность; объективы */
const SECT_M={cw:9,ch:5.2,room:4,deep:3.6,z:1.6,door:2.4,sh0:-6,sh1:-3,surf:.8,
  farX:[-15,46.5],sky:.18,near:2.3,nearMin:9,nearMax:16,phone:10,phoneMax:22,glide:.6,hold:1.4,eye:.12};
const SECT_SIT={habitat:1,lab:1,med:1,shop:1};
/* огонь отсека по роду: холодный у машин, тёплый у жилого */
const SECT_COLD={reactor:1,lab:1,med:1,cryo:1,radiator:1,battery:1,lyse:1,seal:1};
/* краски комнаты по семье: жилое — кремовые стены и синий пол, машины — сталь, грядки — зелень и земля */
const SECT_LIVE={habitat:1,med:1,shop:1,lab:1};
/* материал стен отсека: земля шейдера 22dbw плюс свечение из вершины (запечённый свет подвесов) */
const SECT_MAT_WALL=18;
function sectPal(k,kind){
  if(kind==="shaft")return {wall:[.10,.11,.12],floor:[.06,.06,.07],ceil:[.08,.08,.09],trim:[.2,.2,.2],lamp:[.85,.92,1]};
  if(kind==="hall")return {wall:[.22,.21,.19],floor:[.09,.09,.10],ceil:[.14,.14,.14],trim:[.2,.2,.2],lamp:[1,.86,.62]};
  const cold=!!SECT_COLD[k],lamp=cold?[.85,.93,1]:[1,.84,.6];
  if(k==="garden"||k==="vat")return {wall:[.36,.40,.26],floor:[.15,.10,.06],ceil:[.24,.25,.20],trim:[.22,.2,.12],lamp};
  if(SECT_LIVE[k])return {wall:[.52,.42,.29],floor:[.09,.13,.21],ceil:[.40,.34,.25],trim:[.30,.19,.10],lamp};
  return {wall:[.40,.41,.42],floor:[.12,.12,.13],ceil:[.30,.31,.32],trim:[.16,.17,.18],lamp};
}
function sectX(px){return (px-BASE_OX)/BCELL_W*SECT_M.cw;}
function sectY(py){return -(py-BASE_OY)/BCELL_H*SECT_M.ch;}
function sectFloor(r){return -SECT_M.ch*(r+1);}
function sectRoomX(c){return c<0?(SECT_M.sh0+SECT_M.sh1)/2:c*SECT_M.cw+SECT_M.cw/2;}

/* ── объектив: окно на линии ходьбы, глаз чуть выше середины ── */
function sectLens(asp,cx,cy,Hf){
  const w=Hf*asp,D=Hf*3,ey=cy+Hf*SECT_M.eye,ez=SECT_M.z-D;
  const vp=plnM4mul(plnM4lens(cx-w/2-cx,cx+w/2-cx,cy-Hf/2-ey,cy+Hf/2-ey,D,2,900),plnM4move(-cx,-ey,-ez));
  return {Hf,w,D,cx,cy,l:cx-w/2,r:cx+w/2,b:cy-Hf/2,t:cy+Hf/2,vp,eye:[cx,ey,ez]};
}
/* дальний: вся база с воротами и стволом, сверху полоса неба (SECT_M.sky окна) */
function sectFarWin(B,asp){
  const M=SECT_M,x0=M.farX[0],x1=M.farX[1],bot=sectFloor(baseRows(B)-1)-1.2;
  const need=(M.surf-bot)/(1-M.sky),Hf=Math.max((x1-x0)/asp,need),t=M.surf+M.sky*Hf+(Hf-need)*(1-M.sky)*.45;
  return {cx:(x0+x1)/2,cy:t-Hf/2,Hf};
}
/* ближний: 2.3 клетки, комната человека посередине; на телефоне — клетка с запасом, вслед за человеком;
   в стволе окно едет за клетью по высоте (my — пол под ногами), иначе стоит на ряду */
function sectNearWin(S,asp,mx,my){
  const M=SECT_M,ph=W<=760;
  const Hf=ph?clamp(M.phone/asp,M.nearMin,M.phoneMax):clamp(M.near*M.cw/asp,M.nearMin,M.nearMax);
  const r=Math.max(0,Math.round((S.y-BASE_OY)/BCELL_H-.5));
  return {cx:ph?mx:sectRoomX(S.cur|0),cy:((S.cur|0)<0&&my!=null?my:sectFloor(r))+1.9,Hf};
}
/* доля роста человека в высоте окна (для ворот) */
function sectShare(L){return L?1.8/L.Hf:0;}

/* ── сетка: лист разреза с дырами, коробки комнат, ствол, ход, то, что на поверхности ── */
function sectQuad(m,a,b,c,d,n,col,mat,glow,x){
  const i=plnVert(m,a,n,col,mat,0,glow||0,x==null?1:x);plnVert(m,b,n,col,mat,0,glow||0,x==null?1:x);
  plnVert(m,c,n,col,mat,0,glow||0,x==null?1:x);plnVert(m,d,n,col,mat,0,glow||0,x==null?1:x);
  plnQuad(m,i,i+1,i+2,i+3);
}
/* брус наружу (in — внутрь: стенки комнаты); skip — какие грани не нужны: строка из «xXyYzZ» */
function sectBox(m,x0,x1,y0,y1,z0,z1,col,mat,o){
  o=o||{};const s=o.in?-1:1,sk=o.skip||"",gf=typeof o.glow==="function"?o.glow:()=>o.glow||0,ex=o.x;
  const C=typeof col==="function"?col:()=>col;
  if(sk.indexOf("x")<0)sectQuad(m,[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],[-s,0,0],C("x"),mat,gf("x"),ex);
  if(sk.indexOf("X")<0)sectQuad(m,[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1],[s,0,0],C("X"),mat,gf("X"),ex);
  if(sk.indexOf("y")<0)sectQuad(m,[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[0,-s,0],C("y"),mat,gf("y"),ex);
  if(sk.indexOf("Y")<0)sectQuad(m,[x0,y1,z0],[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[0,s,0],C("Y"),mat,gf("Y"),ex);
  if(sk.indexOf("z")<0)sectQuad(m,[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],[x1,y0,z0],[0,0,-s],C("z"),mat,gf("z"),ex);
  if(sk.indexOf("Z")<0)sectQuad(m,[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],[0,0,s],C("Z"),mat,gf("Z"),ex);
}
/* пустоты разреза в этой базе: [x0,x1,y0,y1,род] — отсеки, ходы по ярусам, ствол до поверхности */
function sectVoids(B){
  const M=SECT_M,R=baseRows(B),V=[];
  for(let r=0;r<R;r++){
    /* ход — только в просветах между отсеками (дверные проёмы и пустые клетки), сквозь комнату его не видно */
    let last=-1,run=M.sh1;const f=sectFloor(r),H=[];
    for(let c=0;c<BASE_COLS;c++){
      const cell=baseCell(B,c,r);if(!cell)continue;
      last=c;V.push([c*M.cw+.5,c*M.cw+M.cw-.5,f,f+M.room,"room",c,r]);
      H.push([run,c*M.cw+.5]);run=c*M.cw+M.cw-.5;
    }
    if(last>=0)for(const [a,b] of H)if(b-a>.05)V.push([a,b,f,f+M.door,"hall",-1,r]);
  }
  V.push([M.sh0,M.sh1,sectFloor(R-1),M.surf,"shaft",-1,-1]);
  return V;
}
function sectSty(B){
  const pl=G.sys&&G.sys.planets&&G.sys.planets[B.idx],k=cave3StyKind((pl&&pl.type)||B.type);
  return CAVE3_STY[k]||CAVE3_STY.sed;
}
function sectBuild(B,eff){
  const M=SECT_M,R=baseRows(B),V=sectVoids(B),m=plnMesh(1<<15),sty=sectSty(B);
  const X0=-30,X1=60,DX=.5,DY=.4,Y1=M.surf,Y0=Math.floor((sectFloor(R-1)-10)/DY)*DY;
  const nx=Math.round((X1-X0)/DX),ny=Math.round((Y1-Y0)/DY);
  const inV=(x,y)=>{for(const v of V)if(x>v[0]&&x<v[1]&&y>v[2]&&y<v[3])return true;return false;};
  /* лист: вершины сеткой, в нормали путь к ближней пустоте, в запасе — далеко ли она */
  const foot=[M.sh0-.5,Math.max(...V.filter(v=>v[4]==="room").map(v=>v[1]),M.sh1)+.5];
  const id=new Int32Array((nx+1)*(ny+1)).fill(-1);
  const vert=(i,j)=>{
    const k=j*(nx+1)+i;if(id[k]>=0)return id[k];
    const x=X0+i*DX,y=Y0+j*DY;
    let bd=1e9,dx=0,dy=1;
    for(const v of V){
      const qx=clamp(x,v[0],v[1]),qy=clamp(y,v[2],v[3]),d=Math.hypot(qx-x,qy-y);
      if(d<bd){bd=d;if(d>1e-4){dx=(qx-x)/d;dy=(qy-y)/d;}else{const cx=(v[0]+v[1])/2-x,cy=(v[2]+v[3])/2-y,l=Math.hypot(cx,cy)||1;dx=cx/l;dy=cy/l;}}
    }
    const big=cave3N3(x*.13,y*.13,3,31),kb=Math.floor((y-.06*x+.25*Math.sin(x*.09))/sty.bed);
    let cc=plnMix3(CAVE3_CUT.mid,CAVE3_CUT.hi,plnSmooth(.3,1,(hashi(kb+64,7,43)>>>0)%1000/1000)*(.75+.25*big));
    if((hashi(kb+64,11,47)>>>0)%100<16)cc=CAVE3_CUT.lo;
    /* в теле базы — перекрытия и переборки: темнее камня, чтобы комнаты горели в тёмной раме
       (референс автора 15.10: «Fallout Shelter, только в нашем 3д») */
    const inB=x>=foot[0]&&x<=foot[1]&&y>=sectFloor(R-1)-.8&&y<=0;
    if(inB)cc=plnMul([.024,.023,.022],.85+.3*big);
    const cm=1+.18*big;
    return id[k]=plnVert(m,[x,y,0],[dx,dy,0],[cc[0]*cm,cc[1]*cm,cc[2]*cm],CAVE3_MAT.cut,0,0,inB?4:clamp(bd,0,4));
  };
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
    const x=X0+(i+.5)*DX,y=Y0+(j+.5)*DY;
    if(inV(x,y))continue;
    plnQuad(m,vert(i,j),vert(i+1,j),vert(i+1,j+1),vert(i,j+1));
  }
  /* коробки пустот: пол, задняя стена, потолок, торцы — внутрь; стены по семье отсека */
  for(const v of V){
    const [x0,x1,y0,y1,k,c,r]=v,cell=k==="room"?baseCell(B,c,r):null,dead=cell&&cell.hp<=0;
    const pal=sectPal(cell&&cell.k,k),dp=k==="room"?M.deep:k==="hall"?3.2:4.2,mul=dead?.3:1;
    const col=f=>plnMul(f==="y"?pal.floor:f==="Y"?pal.ceil:pal.wall,mul*(f==="x"||f==="X"?.86:1));
    /* запечённый свет: живой отсек горит весь (стены ровно, пол чуть тише, потолок в полутени над подвесами) */
    const on=k==="room"?!dead&&eff>0:eff>0,fk=k==="room"?1:k==="hall"?.3:.25;
    const fill=f=>on?fk*(f==="Y"?.2:f==="y"?.3:.36):0,MW=SECT_MAT_WALL;
    sectBox(m,x0,x1,y0,y1,0,dp,col,MW,{in:true,skip:k==="shaft"?"zY":"zxX",glow:fill});
    if(k==="room"){
      /* торцы с дверью на линии хода: проём 1.2 × 2.4 м там, где идёт человек */
      const d0=M.z-.6,d1=M.z+.6,dy=y0+M.door,wc=col("x"),wg=fill("x");
      for(const [x,n] of [[x0,1],[x1,-1]]){
        const q=(za,zb,ya,yb)=>n>0?sectQuad(m,[x,ya,za],[x,ya,zb],[x,yb,zb],[x,yb,za],[1,0,0],wc,MW,wg)
                                  :sectQuad(m,[x,ya,za],[x,yb,za],[x,yb,zb],[x,ya,zb],[-1,0,0],wc,MW,wg);
        q(0,d0,y0,y1);q(d1,dp,y0,y1);q(d0,d1,dy,y1);
        /* наличник проёма */
        sectBox(m,x-.06,x+.06,dy,dy+.12,d0-.08,d1+.08,plnMul(pal.trim,mul),PLN_MAT.man);
      }
    }
    if(k==="hall"){
      /* ход: полоса огней по потолку через три метра */
      for(let x=x0+1.5;x<x1-.5;x+=3)sectBox(m,x-.4,x+.4,y1-.06,y1,1.4,1.7,[1,.86,.62],PLN_MAT.glow,{glow:eff>0?1.6:0,skip:"Y"});
    }
    if(k!=="room")continue;
    /* скосы под потолком у торцов (свод выработки), плинтус, труба по задней стене, рёбра */
    const ch=.75;
    sectQuad(m,[x0,y1-ch,0],[x0,y1-ch,dp],[x0+ch,y1,dp],[x0+ch,y1,0],plnNorm([1,-1,0]),plnMul(pal.ceil,mul*1.1),MW,fill("Y"));
    sectQuad(m,[x1,y1-ch,0],[x1-ch,y1,0],[x1-ch,y1,dp],[x1,y1-ch,dp],plnNorm([-1,-1,0]),plnMul(pal.ceil,mul*1.1),MW,fill("Y"));
    sectBox(m,x0,x1,y0,y0+.16,dp-.1,dp,plnMul(pal.trim,mul),PLN_MAT.man,{skip:"Zy"});
    sectBox(m,x0+ch,x1-ch,y1-.42,y1-.3,dp-.3,dp-.18,plnMul(pal.trim,mul*1.2),PLN_MAT.man);
    for(let x=x0+1.6;x<x1-1;x+=2.4)sectBox(m,x-.06,x+.06,y0+.16,y1-.42,dp-.08,dp,plnMul(pal.wall,.7*mul),PLN_MAT.man,{skip:"Z"});
    /* два подвеса: шнур, абажур, лампа */
    const lx=(x0+x1)/2;
    for(const px of [lx-2.2,lx+2.2]){
      sectBox(m,px-.02,px+.02,y1-.55,y1,1.78,1.82,[.05,.05,.05],PLN_MAT.man);
      sectBox(m,px-.32,px+.32,y1-.72,y1-.55,1.5,2.1,[.13,.13,.12],PLN_MAT.man,{skip:"y"});
      sectBox(m,px-.2,px+.2,y1-.78,y1-.72,1.62,1.98,pal.lamp,PLN_MAT.glow,{glow:on?3.2:0});
    }
    /* сиденье там, где человек садится (жилой, лаборатория, медпункт, лавка) */
    if(SECT_SIT[cell.k])sectBox(m,lx-.75,lx+.55,y0,y0+PLN_MAN_SIT,M.z+.25,M.z+.85,[.20,.15,.11],PLN_MAT.man,{skip:"y"});
    /* убранство рода (21aea, M632b) */
    sectKit(m,cell.k,x0,x1,y0,y1,dp,!dead&&eff>0,mul,r*BASE_COLS+c);
  }
  /* ствол: два рельса на задней стене, огни ярусов */
  for(const rx of [M.sh0+.55,M.sh1-.55])sectBox(m,rx-.07,rx+.07,sectFloor(R-1),M.surf+5.6,3.9,4.1,[.42,.43,.45],PLN_MAT.man);
  for(let r=0;r<R;r++){const f=sectFloor(r);sectBox(m,M.sh1-.35,M.sh1-.05,f+2.7,f+2.85,1.2,1.5,[.6,.85,1],PLN_MAT.glow,{glow:eff>0?3:0});}
  /* на поверхности: копёр над стволом, будка ворот с дверью, рамы солнечных панелей */
  const S0=M.surf,steel=[.28,.27,.26];
  for(const [a,b] of [[M.sh0-.3,M.sh0],[M.sh1,M.sh1+.3]])sectBox(m,a,b,S0,S0+6.2,.4,.7,steel,PLN_MAT.man),sectBox(m,a,b,S0,S0+6.2,3.6,3.9,steel,PLN_MAT.man);
  sectBox(m,M.sh0-.4,M.sh1+.4,S0+6.2,S0+6.6,.3,4,steel,PLN_MAT.man);
  sectBox(m,(M.sh0+M.sh1)/2-.18,(M.sh0+M.sh1)/2+.18,S0+6.6,S0+6.95,1.9,2.3,[1,.12,.06],PLN_MAT.glow,{glow:2.5});
  sectBox(m,-14,-7.6,S0,S0+3,.5,6,[.24,.22,.2],PLN_MAT.man);
  sectBox(m,-14.3,-7.3,S0+3,S0+3.25,.3,6.2,[.17,.16,.15],PLN_MAT.man);
  sectQuad(m,[-11.5,S0,.49],[-10,S0,.49],[-10,S0+2.2,.49],[-11.5,S0+2.2,.49],[0,0,-1],[1,.72,.42],PLN_MAT.glow,.9);
  sectBox(m,-10.95,-10.55,S0+2.45,S0+2.65,.3,.5,[1,.8,.5],PLN_MAT.glow,{glow:3});
  for(let c=0;c<BASE_COLS;c++){
    const cell=baseCell(B,c,0);if(!cell||cell.k!=="solar")continue;
    for(let q=0;q<3;q++){
      const x0=c*M.cw+.8+q*2.6,x1=x0+2.2;
      sectBox(m,x0+1,x0+1.15,S0,S0+.9,2,2.15,steel,PLN_MAT.man);
      sectQuad(m,[x0,S0+.7,1.2],[x1,S0+.7,1.2],[x1,S0+1.6,3.2],[x0,S0+1.6,3.2],plnNorm([0,.9,-.45]),[.05,.08,.16],PLN_MAT.man);
    }
  }
  return plnMeshDone(m);
}
/* клеть: пол, решётчатые бока, крыша, лампа; ставится записью */
function sectCageMesh(){
  const m=plnMesh(1<<10),st=[.36,.35,.33],o=[.75,.36,.12];
  sectBox(m,-1.3,1.3,0,.14,.5,3.4,o,PLN_MAT.man);
  sectBox(m,-1.3,1.3,2.55,2.7,.5,3.4,st,PLN_MAT.man);
  for(const x of [-1.3,1.18])for(const z of [.5,3.28])sectBox(m,x,x+.12,.14,2.55,z,z+.12,st,PLN_MAT.man);
  for(const y of [1.05,1.9])sectBox(m,-1.3,1.3,y,y+.07,3.28,3.4,st,PLN_MAT.man);
  sectBox(m,-.25,.25,2.45,2.55,1.7,2.2,[.85,.95,1],PLN_MAT.glow,{glow:2.6});
  sectBox(m,-.03,.03,2.7,40,1.9,1.96,[.2,.2,.2],PLN_MAT.man);   /* трос до копра */
  return plnMeshDone(m);
}
function sectGeo(B,eff){
  const key=B.cells.map(c=>c?c.k+(c.hp>0?1:0):"-").join(",")+"|"+baseRows(B)+"|"+(eff>0?1:0);
  if(SECT.geo&&SECT.gen===PLN_GPU.gen&&SECT.key===key)return SECT.geo;
  if(SECT.geo&&SECT.gen===PLN_GPU.gen)plnGeoFree(SECT.geo);
  SECT.geo=plnGeo(sectBuild(B,eff));SECT.key=key;SECT.gen=PLN_GPU.gen;SECT.stat.key=key;
  return SECT.geo;
}

/* ── кадр ── */
/* объектив кадра: вход из окна хода по грунту, дальний на меню/стволе/первые секунды, иначе ближний */
function sectLensStep(S,B,asp,mx,my,t,dt,first){
  const M=SECT_M;
  if(first){
    SECT.b=S;SECT.t0=t;SECT.far=W>760?1:0;SECT.ent=1;SECT.cx=null;SECT.cy=null;SECT.idle=0;SECT.cageY=null;
    /* вход без среза: окно хода по грунту — его высота и место человека в нём */
    const hs=typeof PLN==="object"&&PLN.cam&&PLN.cam.hs?PLN.cam.hs/PLN_M:null,Hf0=hs&&isFinite(hs)?hs:sectNearWin(S,asp,mx).Hf;
    SECT.lens0={cx:mx,cy:my+Hf0*.2,Hf:Hf0};
  }
  if(SECT.farPin!=null)SECT.ent=0;   /* стенд держит объектив (sect.py far=) */
  /* дальний: меню, ствол, первая секунда после входа; телефон — только ближний */
  const fw=SECT.farPin!=null?SECT.farPin:W<=760?0:(S.menu||(S.cur|0)<0||t-SECT.t0<M.hold*1000)?1:0;
  SECT.far=SECT.farPin!=null?fw:SECT.far+clamp(fw-SECT.far,-dt/M.glide,dt/M.glide);
  SECT.ent=Math.max(0,SECT.ent-dt/M.glide);
  const Fw=sectFarWin(B,asp),Nw=sectNearWin(S,asp,mx,my),ek=1-Math.exp(-dt/.35),pin=SECT.farPin!=null;
  SECT.cx=SECT.cx==null||pin?Nw.cx:SECT.cx+(Nw.cx-SECT.cx)*ek;
  SECT.cy=SECT.cy==null||pin?Nw.cy:SECT.cy+(Nw.cy-SECT.cy)*ek;
  Nw.cx=SECT.cx;Nw.cy=SECT.cy;
  const k=plnSmooth(0,1,SECT.far),e=plnSmooth(0,1,SECT.ent),L0=SECT.lens0;
  let Hf=Math.exp(lerp(Math.log(Nw.Hf),Math.log(Fw.Hf),k)),cx=lerp(Nw.cx,Fw.cx,k),cy=lerp(Nw.cy,Fw.cy,k);
  if(e>0){Hf=Math.exp(lerp(Math.log(Hf),Math.log(L0.Hf),e));cx=lerp(cx,L0.cx,e);cy=lerp(cy,L0.cy,e);}
  const Ls=sectLens(asp,cx,cy,Hf);
  SECT.lens=Ls;SECT.stat.share=+sectShare(Ls).toFixed(4);
  return Ls;
}
function sectFrame(){
  const t0=wallMs(),S=G.base,B=S.B,M=SECT_M,P=basePower(B),eff=P.eff||0,lit=.55+.45*eff;
  const first=SECT.b!==S,t=wallMs(),dt=first?0:Math.min(.1,Math.max(0,(t-SECT.t)/1000));
  SECT.t=t;
  const asp=W/H,mx=sectX(S.x),my=sectY(S.y)-M.ch/2;
  const Ls=sectLensStep(S,B,asp,mx,my,t,dt,first),cx=Ls.cx,cy=Ls.cy;
  /* куда смотрит человек и давно ли стоит */
  const dx=cellX(S.cur)-S.x,moving=Math.abs(dx)>2||Math.abs(cellY(S.row)-S.y)>2;
  if(Math.abs(dx)>2)SECT.face=dx>0?1:-1;
  SECT.idle=moving||S.menu||S.pmenu?0:SECT.idle+dt;
  const F={batches:[],lamps:[],draw:[],lights:[],glows:[]};
  /* человек: в стволе стоит в клети; в жилом, лаборатории, медпункте, лавке — садится, постояв */
  const room=(S.cur|0)>=0?baseCell(B,S.cur,S.row):null,sit=!!room&&room.hp>0&&!!SECT_SIT[room.k]&&SECT.idle>2.5&&!moving;
  const st={walkPhase:S.walkPhase,walkAmp:moving?1:0,on:true,jetOn:false,vy:0,mining:false,suit:G.surf?G.surf.suit:100,
    sit:sit||SECT.sitPin>0,sitPin:SECT.sitPin};
  const face=sit?-1:SECT.face;
  plnManFrame(F,[mx,my,M.z],face,0,{S:st,lamp:0});
  /* клеть: за человеком в стволе, иначе на своём ярусе */
  const cgT=(S.cur|0)<0||mx<M.sh1+.5?my:SECT.cageY==null?sectFloor(0):SECT.cageY;
  SECT.cageY=SECT.cageY==null?cgT:SECT.cageY+(cgT-SECT.cageY)*(1-Math.exp(-dt/.25));
  if(!SECT.cage||SECT.cage.geo.gen!==PLN_GPU.gen){
    const a=new Float32Array(16);
    SECT.cage={geo:plnGeo(sectCageMesh()),inst:plnInst(a,0,1),a};
  }
  plnRec(SECT.cage.a,0,[(M.sh0+M.sh1)/2,SECT.cageY,0],1,0,1,1);
  plnInstSet(SECT.cage.inst,SECT.cage.a,1);
  /* ключ: светильник комнаты человека, с тенью; в тёмной или разбитой — его налобник */
  const keyRoom=!!room&&room.hp>0&&eff>0&&!moving;
  let lp,ld,lk;
  if(keyRoom){const rx=sectRoomX(S.cur),f=sectFloor(S.row);lp=[rx,f+M.room-.2,2.3];ld=plnNorm([0,-1,-.1]);lk=lit*.55;}
  else{lp=[mx+.2*face,my+1.71,M.z-.17];ld=plnNorm([face,CAVE3_LAMP.tilt,.34]);lk=1;}
  const lampVP=plnM4mul(cave3Persp(CAVE3_K.fov,1,.12,140),plnM4look(lp,[lp[0]+ld[0],lp[1]+ld[1],lp[2]+ld[2]],keyRoom?[0,0,1]:[0,1,0]));
  /* день — столбом ствола; час мира — последний кадр поверхности */
  const Hr=typeof PLN==="object"?PLN.sun:null,night=Hr?clamp(Hr.night||0,0,1):0,dayK=1-plnSmooth(.2,.9,night);
  const sx=Hr&&Hr.dir&&Hr.dir[0]>0?1:-1,sun=plnNorm([.12*sx,1,.1]),lean=[-sun[0]/sun[1],sun[2]/sun[1]];
  const hx=(M.sh0+M.sh1)/2,mouth=[hx,2.1,1.6,2.2];
  const day=cave3DayBox(sun,[hx-6,hx+6,sectFloor(baseRows(B)-1),M.surf+7,-1,6]);
  const lk2=Hr&&Hr.look,skyLo=lk2?lk2.skyHor:[.62,.78,.95],skyHi=lk2?lk2.skyZen:[.13,.33,.78];
  const Lt=(p,r,c,core)=>F.lights.push({p,r,c,core});
  /* по огню на живой отсек; в комнате человека — мягкий отскок от пола вместо второго огня */
  for(let r=0;r<baseRows(B);r++)for(let c=0;c<BASE_COLS;c++){
    const cell=baseCell(B,c,r);if(!cell||cell.hp<=0||eff<=0)continue;
    const cc=SECT_COLD[cell.k]?[.62,.72,.85]:[.95,.70,.44],f=sectFloor(r),rx=sectRoomX(c),me=keyRoom&&c===S.cur&&r===S.row;
    /* два подвеса — два огня; комната человека держит их первыми (core), чужие — по близости к кадру */
    for(const px of [rx-2.2,rx+2.2])Lt([px,f+M.room-.95,2.0],7,plnMul(cc,.75*lit),me?1:0);
  }
  /* разлив налобника, когда ключ — он (как в пещере, но тише) */
  if(!keyRoom){Lt(lp,9,[.16,.17,.2],1);Lt([mx+2.4*face,my+.3,M.z+.6],3.6,CAVE3_LAMP.pool,1);}
  /* клеть и копёр */
  Lt([hx,SECT.cageY+2.3,1.8],5.5,[.32,.38,.46],1);
  if(dayK>.01)Lt([hx,M.surf-1.5,2],10,[.34*dayK,.42*dayK,.5*dayK]);
  Lt([-10.75,M.surf+2.2,-.6],6,[.5*(1-dayK*.6),.34*(1-dayK*.6),.16*(1-dayK*.6)]);
  /* аврал: в отсеке беды мигает огонь его цвета (21a6) */
  const A=S.avr;
  if(A){const p=.5+.5*Math.sin(G.t*.25),ac=A.k==="fire"?[1,.45,.15]:A.k==="vent"?[.5,.8,1]:A.k==="grib"?[.85,.6,.25]:[.35,.6,1];
    Lt([sectRoomX(A.c),sectFloor(A.r)+1.6,1.5],8,plnMul(ac,.5+.6*p),1);}
  if(F.lights.length>12){
    const w=q=>Math.max(q.c[0],q.c[1],q.c[2])*q.r/(1+Math.hypot(q.p[0]-cx,q.p[1]-cy)/6);
    const core=F.lights.filter(q=>q.core),rest=F.lights.filter(q=>!q.core).sort((a,b)=>w(b)-w(a));
    F.lights=core.concat(rest.slice(0,12-core.length));
  }
  F.glows.push({p:[hx,SECT.cageY+2.5,1.95],c:[.8,.9,1],k:.5,s:.5});
  F.glows.push({p:[hx,M.surf+6.8,2.1],c:[1,.15,.08],k:night>.3?.9:.3,s:.5});
  F.glows.push({p:[-10.75,M.surf+2.55,.4],c:[1,.75,.45],k:.6*(1-dayK*.7),s:.45});
  if(keyRoom)F.glows.push({p:[lp[0],lp[1]+.05,2.3],c:SECT_COLD[room.k]?[.8,.9,1]:[1,.82,.58],k:.45*lit,s:.6});
  else F.glows.push({p:lp,c:[1,.74,.42],k:.9,s:.42});
  const geo=sectGeo(B,eff);
  F.draw.push({geo,lamp:true,sun:true});
  F.draw.push({geo:SECT.cage.geo,inst:SECT.cage.inst,lamp:true,sun:true});
  for(const b of F.batches)F.draw.push({geo:b.geo,inst:b.inst,lamp:keyRoom,sun:true});
  Object.assign(F,{vp:Ls.vp,eye:Ls.eye,t:(G.t/60)%7200,lamp:{p:lp,d:ld,k:lk},lampVP,reach:18,near:9,
    sun,sunVP:day.m,sunRange:day.range,dayK,mouth,lean,surfY:M.surf,skyLo,skyHi,expo:1,cutZ:0,bed:sectSty(B).bed});
  SECT.stat.tris=Math.round(geo.n/3);SECT.stat.lights=F.lights.length;SECT.stat.key=keyRoom?"room":"helmet";SECT.stat.sit=sit;
  SECT.stat.cpu=+(wallMs()-t0).toFixed(2);
  return cave3GpuFrame(F);
}

/* ── поверх кадра (2D): то, что интерфейс, — в мерке объектива ── */
/* точка мира (м) → пиксели окна */
function sectPj(){
  const m=SECT.lens.vp;
  return v=>{const cw=m[3]*v[0]+m[7]*v[1]+m[11]*v[2]+m[15];if(!(cw>0))return null;
    return [((m[0]*v[0]+m[4]*v[1]+m[8]*v[2]+m[12])/cw*.5+.5)*W,(.5-(m[1]*v[0]+m[5]*v[1]+m[9]*v[2]+m[13])/cw*.5)*H];};
}
/* M632c: всё, что рисуется каждый кадр, — в слой #ovl (08bi): 2D-холст пуст, и его копия в видеокарту
   (front2, 1.2 мс на ПК, 3.4 на телефоне — дороже всего разреза) не нужна. Меню стройки — по-прежнему 2D:
   оно открыто редко. Кистей 21ac здесь больше нет: разрез без видеокарты не рисуется вовсе */
const SECT_MONO="ui-monospace,monospace";
/* обвод прямоугольника в 1 px CSS и штрих — как strokeRect/setLineDash у 2D */
function sectOvFrame(x0,y0,x1,y1,w,col,al){ovRect(x0,y0,x1,y0+w,col,al);ovRect(x0,y1-w,x1,y1,col,al);ovRect(x0,y0+w,x0+w,y1-w,col,al);ovRect(x1-w,y0+w,x1,y1-w,col,al);}
function sectOvDash(x0,y0,x1,y1,w,on,off,col,al){
  const L=Math.hypot(x1-x0,y1-y0);if(!(L>0))return;const ux=(x1-x0)/L,uy=(y1-y0)/L;
  for(let s=0;s<L;s+=on+off){const e=Math.min(L,s+on);ovCap(x0+ux*s,y0+uy*s,x0+ux*e,y0+uy*e,w,col,al);}
}
function sectOver(){
  const S=G.base,B=S.B,M=SECT_M,P=basePower(B),lit=.55+(P.eff||0)*.45,pj=sectPj();
  sectOvAdj(B,pj,lit);
  /* номера ярусов в стволе */
  for(let r=0;r<baseRows(B);r++){
    const q=pj([M.sh1-.2,sectFloor(r)+3,0]);if(!q)continue;
    const col="rgba(190,214,232,"+((r===(S.row|0)?.62:.3)+lit*.16).toFixed(2)+")";
    ovText(OVL.uq,q[0],q[1],String(r+1),uiFont(8),col,"center","alphabetic",1,1);
  }
  if(!SHOT_CLEAN&&(S.cur|0)>=0)sectCursor(S,B,pj);
  sectAvr(S,pj);
  if(S.menu)sectOvMenu(S,B,pj);else{SECT_MENU.hit=null;SECT_MENU.top=false;}
  /* лента под шапкой (телефон лёжа) стоит на месте доски */
  if(!(S.menu&&SECT_MENU.top))sectOvBoard(B,lit);
  sectOvNote(S);
}
/* патрубки соседства (21ac baseDrawAdj) — капсулами слоя. В 2D-базе клетка была мелкой, и труба от
   середины к середине читалась связью; в разрезе отсек — комната в 9 м, и та же труба шла через всю
   комнату и через человека (лист M632b, 22.10). Здесь связь — короткий патрубок сквозь общую стену под
   потолком или сквозь перекрытие в двух метрах от левой стены (не встык со стенным); несколько связей одной стены — рядом, со ступенью */
function sectOvAdj(B,pj,lit){
  if(typeof baseAdjPairs!=="function")return;
  const COL={wire:[242,178,92],green:[140,220,150],care:[150,220,255],feed:[130,200,255],vent:[190,210,230],
    store:[210,190,140],fix:[200,200,210],noise:[255,120,90],gun:[255,120,90]},ga=.78+lit*.2;
  const M=SECT_M,z=M.z,n={},seen={};
  for(const P2 of baseAdjPairs(B)){
    const side=P2.ar===P2.br,key=side?"h"+Math.max(P2.ac,P2.bc)+":"+P2.ar:"v"+P2.ac+":"+Math.min(P2.ar,P2.br);
    if(seen[key+P2.k])continue;seen[key+P2.k]=1;
    const i=n[key]=(n[key]|0)+1,s=i-1;
    let a,b;
    if(side){const wx=Math.max(P2.ac,P2.bc)*M.cw,y=sectFloor(P2.ar)+M.room-.45-s*.4;a=pj([wx-1.1,y,z]);b=pj([wx+1.1,y,z]);}
    else{const r=Math.min(P2.ar,P2.br),x=P2.ac*M.cw+2+s*.45,f=sectFloor(r);a=pj([x,f+.55,z]);b=pj([x,f-(M.ch-M.room)-.55,z]);}
    if(!a||!b||Math.max(a[0],b[0])<-40||Math.min(a[0],b[0])>W+40)continue;
    const mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,c="rgb("+(COL[P2.k]||[200,200,200]).join(",")+")";
    if(P2.k==="noise"||P2.k==="gun"){sectOvDash(mx-9,my-9,mx+9,my+9,2,4,4,c,.75*ga);continue;}
    ovCap(a[0],a[1],b[0],b[1],7,"rgb(8,11,16)",.8*ga);ovCap(a[0],a[1],b[0],b[1],4.5,c,.85*ga);
    ovCap(a[0],a[1]-1.4,b[0],b[1]-1.4,1.2,"#fff",(.12+lit*.16)*ga);
    ovCap(mx,my,mx,my,8.8,"rgb(8,11,16)",.85*ga);ovCap(mx,my,mx,my,6,c,.95*ga);
  }
}
/* ── меню постройки — лентой на слое (DESIGN-base-scene §9) ──
   Ячейка на вид: имя, цена по смете этой базы, причина запрета одним словом в той же плашке.
   Выбранная — посередине, лента едет за S.pick (0.15 с); стрелки по краям листают страницу.
   Всё — цели пальца ≥ 44 px. Низ ленты — на 12 px над пультами; если там она легла бы на
   человека (телефон лёжа), лента встаёт под шапку и занимает место доски. Правый борт
   (карта, меню) лента обходит. Тап по ячейке ставит S.pick (то же поле, что ◀ ▶), строит
   по-прежнему кнопка ДЕЙСТВИЯ: 21a не правится */
const SECT_MENU={x:null,t:0,hit:null,top:false,lay:null,hudB:null,hudK:"",
  pc:{w:84,h:60},ph:{w:56,h:56},gap:4,arr:44,pad:12,side:16,maxN:9,minF:9};
function sectMenuWhy(S,B,k){
  const M=BUILD[k];
  if(M.needTech&&typeof techLv==="function"&&techLv(M.needTech)<=0)return "НАУКА";
  if(M.firm&&!M.firm(B))return "ФИРМА";
  if(M.surfaceOnly&&(S.row|0)>0)return "СВЕРХУ";
  return "";
}
/* прямоугольник вёрстки в единицах кадра (CSS px от верха холста) */
function sectMenuRect(r){
  if(!r||!(r.width>0)||!(r.height>0))return null;
  const c=(typeof cvsRect==="function")?cvsRect():null,ox=c?c.left:0,oy=c?c.top:0;
  return {l:r.left-ox,r:r.right-ox,t:r.top-oy,b:r.bottom-oy};
}
/* вёрстку читаем раз на окно и на перекладку */
function sectMenuKey(){return W+"x"+H+(typeof LAYOUT_DIRTY!=="undefined"&&LAYOUT_DIRTY?"d":"");}
function sectMenuDom(){
  const Q=SECT_MENU,key=sectMenuKey();
  if(Q.hudK===key&&Q.dom)return Q.dom;
  const d={floor:H,top:8,rail:null};
  try{
    for(const r of [typeof padsRect==="function"?padsRect():null,typeof consoleRect==="function"?consoleRect():null]){
      const q=sectMenuRect(r);if(q&&q.t>H*.4)d.floor=Math.min(d.floor,q.t);
    }
    const hud=typeof document!=="undefined"&&document.querySelector?document.querySelector(".hud"):null;
    const h=sectMenuRect(hud&&hud.getBoundingClientRect?hud.getBoundingClientRect():null);if(h&&h.b<H*.5)d.top=Math.max(d.top,h.b);
    d.rail=sectMenuRect(typeof railRect==="function"?railRect():null);
  }catch(_){}
  Q.hudK=key;Q.dom=d;
  return d;
}
/* имена в ячейке: слова по строкам; слово, что не лезет и мелким кеглем, — переносом после гласной.
   Кегль один на всю ленту — по самому длинному имени */
function sectMenuLay(cw,sc){
  const Q=SECT_MENU,key=cw+"/"+sc;
  if(Q.lay&&Q.lay.key===key)return Q.lay;
  const st=Object.assign({},GC_DEF),lim=cw/sc-8,fnt=f=>HANG_FONT.replace(/\d+px/,f+"px");
  const wid=(s,f)=>{st.font=fnt(f);return GC_GLYPHS.measure(st,s).width;};
  const V=/[АЕЁИОУЫЭЮЯ]/,lines={};
  /* перенос у середины слова: гласная | согласная с гласной (ПЛО-ЩАДКА), гласная | согласная (ЛЕДО-ПЛАВКА), меж двух согласных */
  const hyph=w=>{const m=Math.ceil(w.length/2),C=i=>i>1&&i<w.length-1;
    const tries=[i=>V.test(w[i-1])&&!V.test(w[i])&&V.test(w[i+1]),i=>V.test(w[i-1])&&!V.test(w[i]),i=>!V.test(w[i-1])&&!V.test(w[i])];
    for(const ok of tries)for(let d=0;d<=2;d++)for(const i of [m-d,m+d])if(C(i)&&ok(i))return [w.slice(0,i)+"-",w.slice(i)];
    return [w.slice(0,m)+"-",w.slice(m)];};
  /* куски (слова и половины переноса) — жадно по строкам; строк не больше трёх */
  for(const k of BUILD_KEYS){const out=[];
    for(const w of BUILD[k].ru.toUpperCase().split(" "))for(const q of wid(w,Q.minF)<=lim?[w]:hyph(w)){
      const j=out.length-1,t=j>=0?out[j]+(/-$/.test(out[j])?"":" ")+q:q;
      if(j>=0&&!/-$/.test(out[j])&&wid(t,Q.minF)<=lim)out[j]=t;else out.push(q);}
    lines[k]=out.length>3?[out[0],out[1],out.slice(2).join(" ")]:out;}
  /* одна высота ленты на все роды: три строки хоть у одного — ячейки выше на строку */
  const rows=Math.max(...BUILD_KEYS.map(k=>lines[k].length));
  let fN=Q.minF;
  for(let f=rows>2?10:11;f>Q.minF;f--)if(BUILD_KEYS.every(k=>lines[k].every(s=>wid(s,f)<=lim))){fN=f;break;}
  Q.lay={key,lines,rows,font:fnt(fN),fnt,wid,lim,y:rows>2?13:14,dy:rows>2?11:12};
  return Q.lay;
}
function sectOvMenu(S,B,pj){
  const Q=SECT_MENU,U=uiK(),phone=W<=760,C=phone?Q.ph:Q.pc,n=BUILD_KEYS.length,D=sectMenuDom();
  const sc=phone?1:U,cw=C.w*sc,Ly=sectMenuLay(cw,sc),ch=(C.h+(Ly.rows>2?10:0))*sc,gp=Q.gap*sc,aw=Q.arr*sc,step=cw+gp,pd=6*sc;
  /* человек на экране — лента его не закрывает */
  const mx=sectX(S.x),my=sectY(S.y)-SECT_M.ch/2,h0=pj([mx-.5,my+2.1,SECT_M.z]),h1=pj([mx+.5,my-.1,SECT_M.z]);
  const man=h0&&h1?[Math.min(h0[1],h1[1]),Math.max(h0[1],h1[1])]:null;
  const band=y0=>{const y1=y0+ch;let L=Q.side,R=W-Q.side;
    const r=D.rail;if(r&&r.t<y1+pd&&r.b>y0-pd&&r.l>W/2)R=Math.min(R,r.l-Q.pad);
    const nv=clamp(Math.floor((R-L-2*(aw+gp)+gp)/step),1,Math.min(n,Q.maxN));
    return {y0,y1,nv,L,R,hitMan:!!(man&&y0-pd<man[1]&&y1+pd>man[0])};};
  let P=band(D.floor-Q.pad-ch);Q.top=false;
  if(P.hitMan){const T=band(D.top+Q.pad);if(!T.hitMan||T.nv>=P.nv){P=T;Q.top=true;}}
  const {y0,y1,nv}=P,sw=nv*step-gp,x0=Math.round(clamp(W/2-sw/2,P.L+aw+gp,P.R-aw-gp-sw));
  /* лента едет к выбранной: она посередине, пока есть куда; в покое ячейки целые */
  const want=clamp(Math.floor((S.pick|0)-(nv-1)/2),0,Math.max(0,n-nv)),t=wallMs(),dt=Q.t?Math.min(.1,(t-Q.t)/1000):1;
  Q.t=t;Q.x=Q.x==null?want:Q.x+(want-Q.x)*(1-Math.exp(-dt/.05));
  if(Math.abs(Q.x-want)<.002)Q.x=want;
  const R=(a,b,w,h,c,al)=>ovRect(a,b,a+w,b+h,c,al);
  const bx0=x0-aw-gp-pd,bx1=x0+sw+gp+aw+pd;
  R(bx0,y0-pd,bx1-bx0,ch+2*pd,"rgb(11,13,16)",.86);
  sectOvFrame(bx0,y0-pd,bx1,y1+pd,1,"rgb(150,178,198)",.22);
  const cells=[];
  for(let i=Math.max(0,Math.floor(Q.x));i<=Math.ceil(Q.x+nv-1)&&i<n;i++){
    const cx=x0+(i-Q.x)*step,o=Math.min(cx+cw,x0+sw)-Math.max(cx,x0),al=clamp(o/cw,0,1);
    if(al>.02)cells.push({i,cx,al});
  }
  /* цена — один кегль на всю ленту кадра: по самой длинной из видимых */
  const price=c=>{const bc=baseCost(BUILD_KEYS[c.i],B);return bc.credits+" кр"+(bc.alloy?" · "+bc.alloy+" спл":"");};
  for(const c of cells){c.p=price(c);c.why=sectMenuWhy(S,B,BUILD_KEYS[c.i]);}
  let fP=Q.minF-1;
  for(let f=10;f>=7;f--){fP=f;if(cells.every(c=>Ly.wid(c.p,f)<=cw/sc-6))break;}
  const fp=Ly.fnt(fP),hit={cells:[],prev:null,next:null};
  for(const c of cells){
    const {i,cx,al}=c,on=i===(S.pick|0),a=al*(c.why?.45:1);
    R(cx,y0,cw,ch,on?HANG_ACC:"#fff",(on?.16:.05)*al);
    if(on)sectOvFrame(cx,y0,cx+cw,y1,2,HANG_ACC,.95*al);
    const ln=Ly.lines[BUILD_KEYS[i]];
    ln.forEach((q,j)=>ovText(OVL.uq,cx+cw/2,y0+(Ly.y+j*Ly.dy)*sc,q,Ly.font,on?"#fff3df":HANG_INK,"center","alphabetic",a,sc));
    ovText(OVL.uq,cx+cw/2,y1-(c.why?17:8)*sc,c.p,fp,"rgba(190,210,224,.8)","center","alphabetic",a,sc);
    if(c.why)ovText(OVL.uq,cx+cw/2,y1-6*sc,c.why,fp,HANG_ACC,"center","alphabetic",al,sc);
    if(al>.5)hit.cells.push({i,x0:cx,x1:cx+cw});
  }
  /* стрелки: страница влево и вправо, пока там есть ячейки */
  const arrow=(x,g,on)=>{R(x,y0,aw,ch,"#fff",on?.06:.02);ovText(OVL.uq,x+aw/2,(y0+y1)/2+5*sc,g,HANG_FONT,HANG_INK,"center","alphabetic",on?.9:.25,sc);};
  const lo=Q.x>.01,hi=Q.x<n-nv-.01;
  arrow(x0-aw-gp,"◀",lo);arrow(x0+sw+gp,"▶",hi);
  hit.prev=lo?[x0-aw-gp,x0-gp]:null;hit.next=hi?[x0+sw+gp,x0+sw+gp+aw]:null;
  Object.assign(hit,{y0,y1,nv,n,cw,ch,aw,x0,sw});
  Q.hit=hit;
  const k=ovNd()||1;
  if(typeof hangBlock==="function")hangBlock(bx0*k,(y0-pd)*k,bx1*k,(y1+pd)*k);
}
/* тап по ленте: ячейка — выбор, стрелка — страница. Мимо ленты — прежний тап */
const SECT_OLD_TAP=tap;
tap=function(sxp,syp){
  const S=G.base,h=SECT_MENU.hit;
  if(G.mode==="base"&&S&&S.menu&&h&&SECT.live){
    const c=(typeof cvsRect==="function")?cvsRect():null,x=c?(sxp-c.left)*W/c.width:sxp,y=c?(syp-c.top)*H/c.height:syp;
    if(y>=h.y0&&y<=h.y1){
      for(const q of h.cells)if(x>=q.x0&&x<=q.x1){S.pick=q.i;return;}
      if(h.prev&&x>=h.prev[0]&&x<=h.prev[1]){S.pick=Math.max(0,(S.pick|0)-h.nv);return;}
      if(h.next&&x>=h.next[0]&&x<=h.next[1]){S.pick=Math.min(h.n-1,(S.pick|0)+h.nv);return;}
    }
  }
  return SECT_OLD_TAP.apply(this,arguments);
};
/* приборная доска в мерке uiK */
function sectOvBoard(B,lit){
  if(typeof baseLife!=="function"||typeof baseSharp!=="function")return;
  const k=uiK(),hr=(typeof hudRect==="function")?hudRect():null,U=(typeof UIK==="number"&&UIK>0)?UIK:1;
  const L=baseLife(B),bx=14,by=Math.max(64,(hr&&hr.height>0)?Math.ceil(hr.bottom/U)+10:0);
  const rows=[["ВОЗДУХ",L.air,LIFE_CAP,[150,220,255]],["ВОДА",L.water,LIFE_CAP,[120,190,255]],
    ["ХАРЧ",L.food|0,LIFE_CAP,[190,220,140]],["ДУХ",(typeof baseSpirit==="function")?baseSpirit(B):100,100,[242,178,92]]];
  const P4=(typeof basePower==="function")?basePower(B):{prod:0,cons:0,eff:1,store:0};
  const warn=(typeof baseWarnLine==="function")?baseWarnLine(B):"";
  const foot=["ЭНЕРГИЯ "+P4.prod+" / "+P4.cons+" · ОТДАЧА "+Math.round(P4.eff*100)+"%",
    "СКЛАД "+((typeof basePoolHeld==="function")?basePoolHeld(B):0)+" / "+P4.store];
  if(warn)foot.push(warn.toUpperCase());
  const bw=176,bh=rows.length*12+foot.length*11+16,R=(x0,y0,w,h,c,a)=>ovRect(x0*k,y0*k,(x0+w)*k,(y0+h)*k,c,a);
  const T=(s,x,y,c)=>ovText(OVL.uq,x*k,y*k,s,"8px "+SECT_MONO,c,"left","alphabetic",1,k);
  R(bx-6,by-6,bw,bh,"rgb(10,13,18)",.82);
  sectOvFrame((bx-6)*k,(by-6)*k,(bx-6+bw)*k,(by-6+bh)*k,k,"rgb(150,178,198)",.18+lit*.18);
  rows.forEach((q,i)=>{const y=by+i*12,w=88,f=clamp(q[1]/q[2],0,1);
    T(q[0],bx,y+7,"rgba(190,210,224,.75)");R(bx+52,y+2,w,5,"#fff",.10);R(bx+52,y+2,w*f,5,"rgb("+q[3].join(",")+")",.85);});
  const fy=by+rows.length*12+2;
  R(bx,fy,bw-14,1,"rgb(150,178,198)",.16);
  foot.forEach((s,i)=>T(s.length>30?s.slice(0,30):s,bx,fy+11+i*11,i===2?"rgba(242,178,92,.72)":"rgba(178,198,214,.72)"));
}
/* карточка «пока вас не было» (21ac baseDrawNote) */
function sectOvNote(S){
  if(!(S.note&&S.note.t>0&&W>=BASE_NOTE_W))return;
  const k=uiK(),N=S.note,a=clamp(N.t/60,0,1),f9="9px "+SECT_MONO,st=Object.assign({},GC_DEF,{font:f9});
  let cw=150;for(const s of N.lines)cw=Math.max(cw,GC_GLYPHS.measure(st,s).width+22);
  cw=Math.min(cw,Math.max(190,W*.34),W-214);
  const cx=W-cw-18,cy=78,chh=N.lines.length*13+26,R=(x0,y0,w,h,c,al)=>ovRect(x0*k,y0*k,(x0+w)*k,(y0+h)*k,c,al*a);
  R(cx,cy,cw,chh,"rgb(10,13,18)",.84);
  sectOvFrame(cx*k,cy*k,(cx+cw)*k,(cy+chh)*k,k,"rgb(150,178,198)",.22*a);
  R(cx,cy,3,chh,"rgb(242,178,92)",.5);
  ovText(OVL.uq,(cx+12)*k,(cy+14)*k,"ПОКА ВАС НЕ БЫЛО","8px "+SECT_MONO,"rgba(150,178,198,.6)","left","alphabetic",a,k);
  N.lines.forEach((s,i)=>ovText(OVL.uq,(cx+12)*k,(cy+29+i*13)*k,s,f9,"rgba(198,216,228,.86)","left","alphabetic",a,k));
}
/* курсор: уголки на дыре построенного отсека и имя над ней; под застройку — пунктир по камню */
function sectCursor(S,B,pj){
  const M=SECT_M,c=S.cur|0,r=S.row|0,f=sectFloor(r),x0=c*M.cw+.5,x1=x0+M.cw-1;
  const a=pj([x0,f+M.room,0]),b=pj([x1,f,0]);if(!a||!b)return;
  const on=Math.sin(G.t*.12)>0,cell=baseCell(B,c,r);
  const col="rgb(127,230,216)",al=on?.95:.4,u=Math.min(14,(b[0]-a[0])*.12);
  if(cell){
    ovCap3(a[0],a[1]+u,a[0],a[1],a[0]+u,a[1],2,col,al);ovCap3(b[0]-u,a[1],b[0],a[1],b[0],a[1]+u,2,col,al);
    ovCap3(b[0],b[1]-u,b[0],b[1],b[0]-u,b[1],2,col,al);ovCap3(a[0]+u,b[1],a[0],b[1],a[0],b[1]-u,2,col,al);
  }else{
    const p0=a[0]+4,q0=a[1]+4,p1=b[0]-4,q1=b[1]-4;
    sectOvDash(p0,q0,p1,q0,2,7,7,col,al);sectOvDash(p1,q0,p1,q1,2,7,7,col,al);
    sectOvDash(p1,q1,p0,q1,2,7,7,col,al);sectOvDash(p0,q1,p0,q0,2,7,7,col,al);
  }
}
function sectAvr(S,pj){
  const A=S&&S.avr;if(!A)return;
  const M=SECT_M,f=sectFloor(A.r),x0=A.c*M.cw+.5,a=pj([x0,f+M.room,0]),b=pj([x0+M.cw-1,f,0]);if(!a||!b)return;
  const p=.5+.5*Math.sin(G.t*.25),col=A.k==="fire"?[255,140,60]:(A.k==="vent"?[150,220,255]:(A.k==="grib"?[220,170,80]:[110,180,255]));
  const c="rgb("+col.join(",")+")",kind=AVR_KINDS.find(q=>q.k===A.k)||AVR_KINDS[0];
  sectOvFrame(a[0]+2.5,a[1]+2.5,b[0]-2.5,b[1]-2.5,2,c,.5+.4*p);
  ovText(OVL.uq,(a[0]+b[0])/2,a[1]+16*uiK(),kind.ru,uiFont(10),c,"center","alphabetic",.95,1);
  if(A.hold>0)ovRect(a[0]+12,b[1]-16,a[0]+12+(b[0]-a[0]-24)*clamp(A.hold/AVR_HOLD,0,1),b[1]-12,"rgb(127,230,216)",.85);
}

/* ── переключатель ──
   2D-базы под разрезом больше нет: кадр не собрался — в нём одни приборы */
function drawBase(){
  let ok=false;
  if(SECT.on&&SECT.bad<3&&G.base&&G.base.B){
    try{
      plnQualAuto();
      ok=cave3GpuReady()&&sectFrame();
      if(ok)SECT.bad=0;
    }catch(e){
      SECT.bad++;SECT.err=String((e&&e.stack)||e).slice(0,600);plnLog("база: "+SECT.err);
      if(GPU.on&&GPU.dev){GPU.enc=GPU.dev.createCommandEncoder();GPU.scenePass=null;GPU.sceneOn=false;GPU.scene3D=false;}
    }
  }
  BLOOM_K.base=0;
  SECT.live=ok;
  if(!ok){SECT.b=null;SECT.lens=null;return;}
  sectOver();
};
/* выход без среза: поверхность начинает с ближнего и уходит в свой (21pz plnGlide) */
const SECT_OLD_EXIT=exitBase;
exitBase=function(){
  const live=SECT.live;
  SECT_OLD_EXIT.apply(this,arguments);
  SECT.b=null;SECT.live=false;SECT.lens=null;
  if(live&&typeof PLN==="object"){PLN.glide=1;PLN.glideT=wallMs();}
};

/* ── слова на вещах: строка отсека — табличкой на его комнате ──
   Глагол ДЕЙСТВИЯ говорит кнопка; табличка несёт остальное, по куску на строку. #prompt под
   слоем (body.basewords), как в пещере */
const SECT_W={on:false,hush:false};
function sectWordsOn(){return G.mode==="base"&&SECT.live&&!!SECT.lens&&!!G.base&&hangOk();}
function sectPlate(pr){
  const out=[];
  for(const ln of String(pr||"").split("\n")){
    if(/^◀ ▶ — /.test(ln)){out.push(ln);continue;}
    for(const s of ln.split(" · "))if(s&&!/^ДЕЙСТВИЕ — /.test(s))out.push(s);
  }
  return out.slice(0,4);
}
const SECT_OLD_HSURF=hangSurface;
hangSurface=function(){
  SECT_OLD_HSURF();
  if(!sectWordsOn()||!hangIn())return;
  const S=G.base,pr=String(G.prompt||""),ln=sectPlate(pr);
  if(!ln.length)return;
  const pj=sectPj(),c=S.cur|0,f=sectFloor(S.row|0),x=sectRoomX(c),a=pj([x,f+SECT_M.room,0]),b=pj([x,f+SECT_M.room/2,0]);
  if(!a||!b)return;
  /* человек — не место для таблички */
  const n=ovNd(),mx=sectX(S.x),my=sectY(S.y)-SECT_M.ch/2,h0=pj([mx-.5,my+2.1,SECT_M.z]),h1=pj([mx+.5,my-.1,SECT_M.z]);
  if(h0&&h1)hangBlock(Math.min(h0[0],h1[0])*n,Math.min(h0[1],h1[1])*n,Math.max(h0[0],h1[0])*n,Math.max(h0[1],h1[1])*n);
  ovHang("base.act",ln,a[0],a[1],{r:Math.max(8,Math.abs(a[1]-b[1])),up:true});
};
const SECT_OLD_HUD=hud;
hud=function(){
  SECT_OLD_HUD.apply(this,arguments);
  if(typeof document==="undefined"||!document.body||!document.body.classList)return;
  const on=sectWordsOn();
  if(on!==SECT_W.on){SECT_W.on=on;document.body.classList.toggle("basewords",on);}
  /* лента стройки под шапкой (телефон лёжа) стоит там, где #msg: он молчит, строка остаётся в ЭФИРЕ */
  const hush=on&&!!G.base.menu&&SECT_MENU.top;
  if(hush!==SECT_W.hush){SECT_W.hush=hush;document.body.classList.toggle("basehush",hush);}
};
