/* ══════════════ стоящее на поверхности — двойники видеокарты (G15) ══════════════
   То, что 21e1 ещё клало на #c, а 21e2 снимало снимком ради падающих теней: залежи,
   корабль, пыль. Каждое печётся один раз кистью 2D на GPU-холсте (lifeBaked) и ложится
   освещённым спрайтом (lifeSprite) в проход грунта ПОСЛЕ падающей тени — там же, где
   кусты. Когда на #c не останется ничего, снимок не нужен (surfCastGpu: cState 0 —
   ложь, не null), и ночью кусты и ходок тоже идут двойниками.
   Ложь из двойника — видеокарты нет или выпечка не вышла: рисует 2D, как прежде. */

/* залежь: тело выпечкой по (сырьё, остаток, место, палитра); блик «можно копать» —
   живой, от расстояния до игрока, — дугой из капсул. x,y — комель в кадре 2D */
function surfDepositGpu(pass,d,x,y,near,pal){
  if(!pass||!GPU.dev)return false;
  const ss=3,BW=84,BH=60,OX=42,OY=50;
  const key="dep|"+d.res+"|"+(d.left|0)+"|"+(d.x|0)+"|"+(pal?pal.join(","):"");
  const B=lifeBaked(key,BW*ss,BH*ss,g=>{g.translate(OX*ss,OY*ss);g.scale(ss,ss);
    drawDeposit(0,0,d.res,d.left,0,d.x,pal);});
  if(!B)return false;
  const h=lifeHere(x,y),s=h.s,L=lifeLight();
  /* гнездо у залежи нарисовано в выпечке; падающая тень от звезды — силуэтом, как у куста
     (прежде её давал снимок #c) */
  const ok=lifeSprite(pass,B,{x:h.x+(BW/2-OX)*s,y:h.y+(BH/2-OY)*s,w:BW*s,h:BH*s,base:OY/BH,lod:1.5,
    dim:lifeDim(d.x),shadow:.7,ao:BW*.16*s},Object.assign({},L,{k:(L.k==null?.8:L.k)*.6,rim:(L.rim==null?1:L.rim)*.4}));
  if(!ok)return false;
  if(near>0){
    /* размер тела — тем же потоком, что у drawDeposit (21b): первое число r() */
    const r=rng(hashi(d.x|0,d.left|0,0xDEB0)),k=clamp(.45+Math.min(1,(d.left||1)/9)*.55,0,1);
    const S=(14+r()*7)*k*s,cx=h.x,cy=h.y-S*.45,a=.16*near,A=[];
    const pt=t=>{const an=Math.PI*(1.15+.8*t);return [cx+Math.cos(an)*S*1.15,cy+Math.sin(an)*S*.85];};
    let q=pt(0);
    for(let i=1;i<=10;i++){const n=pt(i/10);A.push([2,q[0],q[1],n[0],n[1],.7*s,0,255,255,255,a]);q=n;}
    gpuShapes(pass,A,{blend:"over"});
  }
  return true;
}

/* трава на кромке (19 drawGroundGrass) капсулами фигур: те же места, формы и ветер; дуга кустика —
   двумя звеньями. Белый блик, в падающей тени гребня — втрое тусклее (M434) */
function groundGrassGpu(pass,tr,camx,camy){
  if(!pass||!GPU.dev)return false;
  const i0=clamp(Math.floor((camx-40)/tr.step),0,tr.N-1),i1=clamp(Math.ceil((camx+W+40)/tr.step),0,tr.N-1);
  const dstep=Math.max(1,Math.round(14/tr.step)),live=(typeof castLive==="function");
  const o=lifeHere(0,0),s=o.s,hw=.5*s,A=[];
  let a=.14;
  const seg=(x0,y0,x1,y1)=>A.push([2,o.x+x0*s,o.y+y0*s,o.x+x1*s,o.y+y1*s,hw,.9,255,255,255,a]);
  const quad=(x0,y0,cx,cy,x1,y1)=>{const mx=.25*x0+.5*cx+.25*x1,my=.25*y0+.5*cy+.25*y1;seg(x0,y0,mx,my);seg(mx,my,x1,y1);};
  for(let i=i0;i<i1;i+=dstep){
    const wx=i*tr.step,x=wx-camx;if(x<-6||x>W+6)continue;
    const hh=hashi(Math.floor(wx/14),tr.sseed,0x6E55);
    if((hh&7)===0||(hh&3)===0)continue;
    const y=tr.h[i]-camy,th=2+((hh>>>4)&3);
    const sw=WIND*(1.6+th*.5)*(.7+.3*Math.sin(G.t*.045+wx*.07));
    const form=(hh>>>8)&3;
    a=(live&&castLive(tr,wx)>.5)?.05:.14;
    if(form===1){for(let b=-1;b<=1;b++)seg(x+b*.8,y,x+b*2.2+sw*1.2,y-th+Math.abs(b));}
    else if(form===2){
      quad(x-2.2,y,x-1.2+sw*.4,y-th*.9,x+sw*.6,y-th*.7);
      quad(x+2.2,y,x+1.2+sw*.4,y-th*.9,x+sw*.6,y-th*.7);
    }else seg(x,y,x+((hh>>>2)&1?1.4:-1.4)+sw,y-th);
  }
  if(A.length)gpuShapes(pass,A,{blend:"over"});
  return true;
}
/* пыль/пыльца в воздухе (19 drawDustMotes) кружками фигур; тот же поток чисел, тот же
   ветер. x,y — в осях мира 2D, кадр — через lifeHere */
function dustMotesGpu(pass,camx,camy,p){
  if(!pass||!GPU.dev)return false;
  if(p.T.atm==="отсутствует")return true;
  const o=lifeHere(0,0),s=o.s,A=[];
  for(let i=0;i<26;i++){
    const r=rng(hashi(Math.floor(p.seed),i,0xD05));
    const wx=(r()*3000+G.t*(6+r()*10)*(1+WIND*1.6))%3000;
    const x=((wx-camx*.6)%(W+60)+W+60)%(W+60)-30;
    const y=(r()*H*.8+Math.sin(G.t*.03+i)*14+WIND*Math.sin(G.t*.02+i*2)*8);
    const a=+(.05+r()*.12).toFixed(2),rad=.8+r()*1.2;
    A.push([1,o.x+x*s,o.y+y*s,rad*s,0,0,0,255,255,255,a]);
  }
  gpuShapes(pass,A,{blend:"over"});
  return true;
}

/* ── подписи поверхности: строка на тёмной плашке ──
   С видеокартой — в #ovl (08bi: domLabel и ovRect под ней), над миром, без #c; без неё — 2D,
   как было. x,y — якорь строки (центр, базовая линия) в мерке мира 2D; pa — плотность
   плашки, 0 — без плашки; k — ключ подписи */
const SURF_TAG_FONT="8px ui-monospace,monospace";
function surfTag(k,x,y,text,col,pa){
  ctx.font=SURF_TAG_FONT;ctx.textAlign="center";
  if(!GPU.ok||!GPU.on){
    if(pa>0){const tw=ctx.measureText(text).width;
      ctx.fillStyle="rgba(5,7,12,"+pa+")";ctx.fillRect(x-tw/2-5,y-10,tw+10,14);}
    ctx.fillStyle=col;ctx.fillText(text,x,y);return;
  }
  const h=lifeHere(x,y),s=h.s;
  domLabel(k,h.x,h.y,text,+(8*s).toFixed(2)+"px ui-monospace,monospace",col,"center",1);
  const e=OVL.lab.get(k);
  if(pa>0&&e)ovRect(e.x0-5*s,h.y-10*s,e.x1+5*s,h.y+4*s,"rgba(5,7,12,"+pa+")",1);
}
/* полоска хода работы над вещью (бурение): x0,y — левый верх, w — ширина, f — доля */
function surfBar(x0,y,w,f,col){
  if(!GPU.ok||!GPU.on){
    ctx.fillStyle="rgba(0,0,0,.5)";ctx.fillRect(x0,y,w,4);
    ctx.fillStyle=col;ctx.fillRect(x0,y,w*f,4);return;
  }
  const a=lifeHere(x0,y),s=a.s;
  ovRect(a.x,a.y,a.x+w*s,a.y+4*s,"rgba(0,0,0,.5)",1);
  ovRect(a.x,a.y,a.x+w*f*s,a.y+4*s,col,1);
}

/* ── передний план не в фокусе (21b fgEach) ──
   Был на #c и уходил снимком с размытием по диску (21e2 surfNearGpu) — снимок на кадр.
   Валун неподвижен: печётся раз на (слот, размер, небо) в разрешении ниже кадра, и
   растяжка выпечки даёт ту же мягкость. Трава гнётся ветром каждый кадр — мягкими
   капсулами по своей кривой. Смешение — корпусом (hull), как у снимка: последний проход
   знает, что здесь тело */
const FG_BK=new Map();
function foregroundGpu(pass,tr,camx,camy,p){
  if(!pass||!GPU.dev)return false;
  const o=lifeHere(0,0),s=o.s,DP=DPR||1;
  /* небо ступенями: выпечка валуна не перепекается на каждом кадре сумерек */
  const amb=ambRGB(p).map(v=>Math.round(v/6)*6),C=fgColors(p,amb);
  const ca=[amb[0]*.42,amb[1]*.44,amb[2]*.50],ra=[amb[0]*1.15+30,amb[1]*1.15+34,amb[2]*1.2+40].map(v=>Math.min(255,v));
  const q=Math.max(.25,Math.round(s*DP*.42*20)/20),SH=[],IM=[];
  let bad=false;
  fgEach(tr,camx,camy,p,(slot,h,sx,y,r,grass)=>{
    if(!grass){
      const EX=r*1.42+3,EY=r*.95+3;
      const B=gpuBaked(FG_BK,"fg|"+slot+"|"+r+"|"+amb.join(",")+"|"+q,EX*2*q,EY*2*q,g=>{
        g.setTransform(q,0,0,q,EX*q,EY*q);fgBoulder(slot,0,0,r,C);},{mips:false,keep:12});
      if(!B){bad=true;return;}
      IM.push([B,{x:o.x+sx*s,y:o.y+y*s,w:EX*2*s,h:EY*2*s}]);
      return;
    }
    /* кривая лезвия почти прямая (изгиб — доли пикселя), и одна капсула не даёт бусин на
       стыках полупрозрачных кусков; плотность — как у снимка после размытия: тонкое
       лезвие под диском теряло больше трети */
    fgBlades(slot,h,sx,y,(bx,y0,cx,cy,tx,ty,lw,ux,uy)=>{
      SH.push([2,o.x+bx*s,o.y+y0*s,o.x+tx*s,o.y+ty*s,lw*.5*s,1.8,ca[0],ca[1],ca[2],.58],
        [2,o.x+ux*s,o.y+uy*s,o.x+tx*s,o.y+ty*s,.55*s,1.2,ra[0],ra[1],ra[2],.15]);
    });
  });
  if(bad)return false;
  for(const [B,R] of IM)gpuImage(pass,B,[R],{blend:"hull"});
  gpuShapes(pass,SH,{blend:"hull"});
  return true;
}

/* ── корабль на стоянке ──
   2D — как было до видеокарты (телефон без снимка, Node): тень, корпус, ночью окно и
   тёплое пятно под брюхом (M243) */
function surfLander2D(S,camx,camy,p){
  groundShadow(S.shipX-camx,S.shipY-camy+12,landerLen(G.shipId)*.46,8);
  ctx.save();ctx.translate(S.shipX-camx,S.shipY-camy);
  /* стоим: шасси выпущено, трап спущен, сопла ещё остывают после посадки */
  drawLander(false,false,{gear:1,sq:0,landed:true,tr:S.tr,gx:S.shipX,hot:surfLanderHot(S)});
  ctx.restore();
  /* ночью корабль живой, а не белое пятно: окно кабины и тёплое пятно под брюхом —
     «внутри кто-то есть», вторая, тёплая температура в холодном кадре */
  const k=surfLanderNite(p);
  if(k>0){
    const lx=S.shipX-camx, ly=S.shipY-camy;
    const gp=ctx.createRadialGradient(lx,ly+13,0,lx,ly+13,52);
    gp.addColorStop(0,"rgba(255,206,138,"+(.20*k).toFixed(3)+")");
    gp.addColorStop(1,"rgba(255,206,138,0)");
    ctx.fillStyle=gp;ctx.beginPath();ctx.ellipse(lx,ly+13,52,15,0,0,TAU);ctx.fill();
    ctx.fillStyle="rgba(255,224,170,"+(.62*k).toFixed(3)+")";
    ctx.fillRect(lx-4,ly-6,9,5);
    const gw=ctx.createRadialGradient(lx,ly-4,0,lx,ly-4,26);
    gw.addColorStop(0,"rgba(255,214,150,"+(.26*k).toFixed(3)+")");
    gw.addColorStop(1,"rgba(255,214,150,0)");
    ctx.fillStyle=gw;ctx.beginPath();ctx.arc(lx,ly-4,26,0,TAU);ctx.fill();
  }
}
/* groundShadow (19) фигурами: овал от звезды — три мягкие капсулы вложенной длины
   вместо радиального градиента, середина темнее краёв */
function surfShadowShapes(A,x,y,rx,ry,k){
  const sx=SUN_DIR.x,sy=SUN_DIR.y,low=clamp(1-Math.abs(sy),0,1);
  const cx=x-sx*rx*(.35+low*1.6),R=rx*(1+low*1.2),a=.32*(1-low*.40)*(k==null?1:k);
  for(const f of [.75,.45,.15]){const l=Math.max(0,R*f-ry*.3);
    A.push([2,cx-l,y,cx+l,y,0,ry*(1.35-f*.5),0,0,0,a*.42]);}
}
function surfLanderHot(S){return Math.max(0,1-(G.t-(S.t0||0))/700);}
function surfLanderNite(p){const n=(typeof surfNight==="function")?surfNight(p):0;return n>.18?clamp((n-.18)/.35,0,1):0;}
/* двойник: тело — выпечкой корабля посадки (19g, lgLanderBake) под светом мира, как ходок
   и кусты (20fa): поле посадки красило белый корпус под оранжевой звездой в лосося и мылило
   швы. Падающая тень — силуэтом той же выпечки (снимок #c её больше не даёт) и пятнами
   касания, как у 2D; огни — маяк, тлеющие сопла, свет люка, ночное окно — мягкими фигурами */
const SURF_LND={x:0,y:0,a:0,gear:1,sq:0,over:1,ok:true,thrOn:false,hot:0};
function surfLanderGpu(pass,S,camx,camy,p){
  if(!pass||!GPU.dev||typeof lgLanderBake!=="function")return false;
  const L=SURF_LND,h=lifeHere(S.shipX-camx,S.shipY-camy),s=h.s;
  L.x=S.shipX;L.y=S.shipY;
  const len=landerLen(G.shipId),half=len*.5,bodyH=len*.30,bY=LAND_GY-19,tY=bY-bodyH;
  const B=lgLanderBake(L,S.tr,GPU.bw/W*s);if(!B)return false;
  if(!B.lid)B.lid=++LG_ID;
  /* местные оси корабля с кивком носа −0.05 (19f) → кадр */
  const cr=Math.cos(-.05),sr=Math.sin(-.05);
  const at=(lx,ly)=>[h.x+(lx*cr-ly*sr)*s,h.y+(lx*sr+ly*cr)*s];
  const SH=[];
  /* пятно касания: силуэт от звезды лежит за корпусом и его почти не видно, а корабль
     без пятна висит над грунтом */
  surfShadowShapes(SH,h.x,h.y+12*s,len*.46*s,8*s,1);
  surfShadowShapes(SH,h.x+half*.05*s,h.y+(LAND_GY+2)*s,half*1.05*s,Math.max(3.5,len*.055)*s,.85);
  /* и тень каждой пяты (drawLandGear): стойка стоит на своей точке грунта */
  const g0=groundAt(S.tr,S.shipX);
  for(const [lx,la] of [[-half*.42,1],[-half*.10,.62],[half*.42,1]]){
    const f=at(lx,LAND_GY+clamp(groundAt(S.tr,S.shipX+lx)-g0,-9,9)+1);
    SH.push([2,f[0]-7*s,f[1],f[0]+7*s,f[1],0,2.6*s,0,0,0,.28*la]);
  }
  gpuShapes(pass,SH,{blend:"over"});
  const E=LG_E*2*s;
  if(!lifeSprite(pass,B,{x:h.x,y:h.y+LG_OY*s,w:E,h:E,base:(LAND_GY-LG_OY+LG_E)/(2*LG_E),lod:2.5,
    ao:half*.95*s,dim:lifeDim(S.shipX)},lifeLight()))return false;
  const A=[];
  /* свет люка на грунте у пяты трапа */
  const hp=at(-half*.06+len*.46-6,LAND_GY+1),hl=len*.28*s,hh=len*.07*s;
  A.push([2,hp[0]-hl*.55,hp[1],hp[0]+hl*.55,hp[1],0,hh*1.4,255,190,115,.16],
    [2,hp[0]-hl*.25,hp[1],hp[0]+hl*.25,hp[1],0,hh,255,200,130,.14]);
  /* сопла ещё остывают после посадки */
  const hot=surfLanderHot(S),ex=-half*.80,ey=bY+bodyH*.02,er=bodyH*.24;
  if(hot>.02)for(const d of [0,er*1.7]){const q=at(ex+d,ey+er*.6);
    A.push([1,q[0],q[1],0,0,0,er*2.2*s,255,140,70,hot*.45]);}
  /* маяк — плавный огонь, а не щелчок (закон «движение, не мигание») */
  const bk=clamp((Math.sin(G.t*.07)-.05)/.5,0,1),bs=bk*bk*(3-2*bk);
  if(bs>.01){const q=at(half*.1,tY-1.5);
    A.push([1,q[0],q[1],2.2*s,0,0,.8*s,255,120,90,.9*bs],[1,q[0],q[1],0,0,0,8*s,255,110,80,.3*bs]);}
  const k=surfLanderNite(p);
  if(k>0){
    const y1=h.y+13*s,y2=h.y-4*s;
    A.push([2,h.x-36*s,y1,h.x+36*s,y1,0,15*s,255,206,138,.17*k],
      [1,h.x,y2,0,0,0,26*s,255,214,150,.22*k],
      [0,h.x-4*s,h.y-6*s,h.x+5*s,h.y-1*s,0,0,255,224,170,.62*k]);
  }
  gpuShapes(pass,A,{blend:"add"});
  return true;
}
