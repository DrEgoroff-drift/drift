/* ══════════════ пещера на движке: убранство залов (M630b) ══════════════
   Натёки, колонны, завесы, кристаллы и жилы — там, где их кладёт игра (caveDeco, 22a): тот же x,
   та же галерея, тот же характер зала. Глубину за разрезом и форму даёт стенд (docs/look/cv-scene.js),
   перенесённый на кит движка: шапки стопкой с пола, колокола со свода, колонна там, где они сошлись,
   с шейкой; край шапки фестонами (лопасть не короче семи граней кольца); со свода — кустами, один
   длинный, вокруг короче, между кустами голый свод. У задней стены — натёчные наплывы: стене тело,
   фонарю рёбра. Жилы руды лежат в плоскости разреза, тёмный шов и рыжие зёрна в десятую-четыре
   десятых силы. Строится лениво полосами по 16 м, ближние к человеку первыми, и лежит на пещере
   (C.dr3), пока жива видеокарта; ничего не сохраняется — всё от C.seed. */
const CAVE3_DR={s:16,ms:5,first:300,keep:14};
const CAVE3_DC={cream:plnHex("#e6dfcf"),creamD:plnHex("#aaa090"),rust:plnHex("#b4703c"),
  mauve:[plnHex("#6a3a9a"),plnHex("#e2a0e6")]};
const CAVE3_DOME=[0,.1,.25,.42,.6,.78,.92,1];
/* отделка стены по залу (шейдер 22dbw): 0 рёбра, 1 друза, 2 шов, 3 гладь */
const CAVE3_ZK={gallery:0,dripstone:0,crystal:1,vein:2,water:3};
Object.assign(CAVE3_MAT,{veil:15});
/* натёк — камень своего мира: светлый тон, тёмный, окисел потёками; мокрость; материал
   (лёд — плёнка, свет сквозь). Альбедо держится у тона породы: в тени натёк темнее стены */
const CAVE3_DRIP={
  sed:{a:"#a89d86",d:"#6f6555",ox:"#7e5634",wet:.16,mat:11,mix:.25},
  volc:{a:"#4a3b31",d:"#1f1915",ox:"#8a4322",wet:.95,mat:11,mix:.15},
  rock:{a:"#948e82",d:"#5e5a52",ox:"#7a5236",wet:.2,mat:11,mix:.25},
  ice:{a:"#9cc4dc",d:"#5f8fb0",ox:"#cfe6f2",wet:.75,mat:15,mix:.1},
  sand:{a:"#ad9472",d:"#77604a",ox:"#97542c",wet:.14,mat:11,mix:.25}};
let CAVE3_DS=null;
function cave3DripSty(F){
  const k=cave3StyKind(G.surf&&G.surf.p&&G.surf.p.type),t=CAVE3_DRIP[k];
  return {k,a:plnHex(t.a),d:plnHex(t.d),ox:plnHex(t.ox),wet:t.wet,mat:t.mat,mix:t.mix};
}

/* свод над точкой воздуха (м) — зеркало cave3Down */
function cave3Up(F,X,Y,Z){
  let a=Y;
  for(let n=0;n<70&&cave3Den(F,X,a+.2,Z)<=0;n++)a+=.2;
  let lo=a,hi=a+.2;
  for(let n=0;n<10;n++){const m=(lo+hi)/2;if(cave3Den(F,X,m,Z)>0)hi=m;else lo=m;}
  return (lo+hi)/2;
}
/* куда смотрит камень в точке: от плотности наружу */
function cave3Nrm(F,X,Y,Z){
  const e=.25;
  return plnNorm([cave3Den(F,X-e,Y,Z)-cave3Den(F,X+e,Y,Z),cave3Den(F,X,Y-e,Z)-cave3Den(F,X,Y+e,Z),cave3Den(F,X,Y,Z-e)-cave3Den(F,X,Y,Z+e)]);
}
/* глубина хода за разрезом (м) в точке px игры — та же, что у плотности */
function cave3Zd(F,x,y){
  const hl=cave3Samp(F.hl,x,Math.max(y,CAVE_Y0));
  return Math.min(CAVE3_CH.zcap-4,hl*lerp(2.4,4,plnSmooth(3,6,hl))+.6);
}

/* натёк: тон своего мира, кольца, где стояла вода, потёки окисла сверху вниз; берёт тон породы */
function cave3Cream(B,a,p){
  const n=cave3N3(p[0]*1.1,p[1]*.5,p[2]*1.1,61),D=B.D;
  let c=plnMix3(D.d,D.a,clamp(.55+.35*n+.12*Math.cos(a*3+p[1]*2),0,1));
  const st=cave3N3(p[0]*6+Math.cos(a)*.6,p[1]*.35,p[2]*6+Math.sin(a)*.6,63);
  c=plnMix3(c,D.ox,plnSmooth(.25,.8,st)*.45);
  c=plnMix3(c,D.d,plnSmooth(-.3,-.75,st)*.4);
  return plnMix3(c,B.F.col.a,D.mix);
}
/* пояс тела вращения. o: c (y)→[x,z] ось, rings [[y,r,u]…], sides, mod (a,u)→множитель радиуса,
   dy (a,u)→насколько ниже, nup — куда смотрит ровная грань пояса, col (u,a,p), x (u,a,p)|число, mat, glow */
function cave3Band(m,o){
  const R=o.rings,n=R.length,S=o.sides,P=new Array(n*S),base=m.nv;
  for(let k=0;k<n;k++){
    const y=R[k][0],r=R[k][1],u=R[k][2],c=o.c(y);
    for(let s=0;s<S;s++){
      const a=s/S*TAU,rr=r*(o.mod?o.mod(a,u):1);
      P[k*S+s]=[c[0]+Math.cos(a)*rr,y+(o.dy?o.dy(a,u):0),c[1]+Math.sin(a)*rr];
    }
  }
  for(let k=0;k<n;k++){
    const u=R[k][2];
    for(let s=0;s<S;s++){
      const a=s/S*TAU,p=P[k*S+s];
      const up=P[Math.min(k+1,n-1)*S+s],dn=P[Math.max(k-1,0)*S+s],rt=P[k*S+(s+1)%S],lf=P[k*S+(s+S-1)%S];
      let nr=plnCross(plnSub(up,dn),plnSub(rt,lf));
      const l=Math.hypot(nr[0],nr[1],nr[2]),ref=[Math.cos(a),o.nup||0,Math.sin(a)];
      nr=l<1e-9?plnNorm(ref):plnMul(nr,1/l);
      if(plnDot(nr,ref)<0)nr=plnMul(nr,-1);
      plnVert(m,p,nr,o.col(u,a,p),o.mat==null?CAVE3_DS.mat:o.mat,0,(o.glow||0)*CAVE3_DS.wet/.6,typeof o.x==="function"?o.x(u,a,p):(o.x==null?1:o.x));
    }
  }
  for(let k=0;k+1<n;k++)for(let s=0;s<S;s++){
    const s2=(s+1)%S;
    plnQuad(m,base+k*S+s,base+k*S+s2,base+(k+1)*S+s2,base+(k+1)*S+s);
  }
}
/* сколько лопастей у края шапки: лопасть кругла, когда на ней семь граней кольца и больше */
const cave3Lobes=(sides,r)=>Math.max(3,Math.round(sides/7)-1+(r()*3|0));
/* Стопка шапок с пола. Каждая шапка — купол с исподом, что нависает над нижней и держит её в тени;
   края фестонами, где сбегала вода. o: x, z, foot, tiers [[h,R]…] снизу вверх, tipR, sides, bend */
function cave3Caps(B,o){
  const m=B.m,r=B.r,ph=r()*TAU,bend=o.bend||0,H=o.tiers.reduce((a,t)=>a+t[0],0),S=o.sides;
  const c=y=>{const t=clamp((y-o.foot)/H,0,1);return [o.x+bend*Math.sin(t*2.2+ph),o.z+bend*.6*Math.sin(t*1.7+ph*2)];};
  let y=o.foot-.35,prevTop=0;
  o.tiers.forEach(([h,R],i)=>{
    const next=o.tiers[i+1],rTop=next?next[1]*.58:(o.tipR==null?.02:o.tipR);
    const nf=cave3Lobes(S,r),fp=r()*TAU,amp=.05+r()*.06,droop=i?h*.16:0,tone=.9+r()*.2,lip=h*.1;
    const sc=a=>Math.abs(Math.sin(a*nf*.5+fp));
    const mod=(a,f)=>1+amp*Math.pow(1-f,1.5)*(sc(a)-.6);
    const dy=(a,f)=>i&&f<.3?-lip*(1-f/.3)*Math.max(0,sc(a)-.4)/.6:0;
    if(i)cave3Band(m,{c,sides:S,nup:-1,glow:.5,rings:[[y+h*.05,prevTop,1],[y-droop*.5,(prevTop+R)*.55,.5],[y-droop,R*.985,0]],
      mod:(a,f)=>f<.25?mod(a,0):1,dy,col:(f,a,p)=>plnMul(cave3Cream(B,a,p),.55*tone),x:f=>lerp(.45,.2,f)});
    const rings=[];
    for(const f of CAVE3_DOME)rings.push([y-droop+(h+droop)*f,rTop+(R-rTop)*Math.sqrt(1-f*f),f]);
    cave3Band(m,{c,sides:S,nup:.7,glow:.6,rings,mod,dy,
      col:(f,a,p)=>plnMul(cave3Cream(B,a,p),tone*lerp(.9,1.05,f)),
      x:f=>(next||o.tipR!=null?lerp(1,.3,plnSmooth(.62,1,f)):1)*(i?1:lerp(.3,1,plnSmooth(0,.4,f)))});
    y+=h;prevTop=rTop;
  });
  return y;
}
/* Со свода — те же шапки: колокола один под другим, каждый меньше верхнего; последний кончается
   остриём или шейкой колонны. o: x, z, top, tiers [[h,R]…] сверху вниз, sides, drip, join {y,r} */
function cave3Bells(B,o){
  const m=B.m,r=B.r,S=o.sides||20,c=()=>[o.x,o.z],T=o.tiers,ph=r()*TAU,R0=T[0][1];
  /* корень расходится в свод */
  cave3Band(m,{c,sides:S,nup:-.5,glow:.6,rings:[[o.top+.5,R0*1.7,0],[o.top+.05,R0*1.22,.5],[o.top-.25,R0*.95,1]],
    col:(u,a,p)=>plnMul(cave3Cream(B,a,p),.8),x:u=>lerp(.3,.6,u)});
  let yT=o.top-.25,yR=yT;
  T.forEach(([h,R],i)=>{
    const neck=i?R*.55:R*.95,nf=cave3Lobes(S,r),fp=r()*TAU,amp=.06+r()*.06,tone=.9+r()*.2,lip=h*.14;
    const sc=a=>Math.abs(Math.sin(a*nf*.5+fp));
    const dy=(a,f)=>f<.3?-lip*(1-f/.3)*Math.max(0,sc(a)-.4)/.6:0;
    yR=yT-h;
    const rings=[];
    for(const f of CAVE3_DOME)rings.push([yR+h*f,neck+(R-neck)*Math.sqrt(1-f*f),f]);
    cave3Band(m,{c,sides:S,nup:.4,glow:.6,rings,mod:(a,f)=>1+amp*Math.pow(1-f,1.5)*(sc(a)-.6),dy,
      col:(f,a,p)=>plnMul(cave3Cream(B,a,p),tone*lerp(.9,1.05,f)),x:f=>lerp(1,.3,plnSmooth(.6,1,f))});
    const nx=T[i+1],inR=nx?nx[1]*.55:(o.join?o.join.r:R*.42),tuck=nx?nx[0]*.12:.04;
    cave3Band(m,{c,sides:S,nup:-1,glow:.5,rings:[[yR,R*.985,0],[yR+tuck*.5,(R+inR)*.5,.5],[yR+tuck,inR,1]],
      mod:(a,f)=>f<.25?1+amp*(sc(a)-.6):1,dy,col:(f,a,p)=>plnMul(cave3Cream(B,a,p),.55*tone),x:f=>lerp(.45,.22,f)});
    yT=yR+tuck;
  });
  const last=T[T.length-1];
  if(o.join){
    const rj=o.join.r,rings=[];
    for(let k=0;k<=8;k++){const t=k/8;rings.push([lerp(yT,o.join.y,t),rj*(1-.1*Math.sin(Math.PI*t)),t]);}
    cave3Band(m,{c,sides:S,nup:0,glow:.7,rings,mod:a=>1+.09*(Math.abs(Math.sin(a*3.5+ph))-.6),
      col:(t,a,p)=>cave3Cream(B,a,p),x:t=>lerp(.4,1,plnSmooth(0,.22,Math.min(t,1-t)))});
  }else{
    const rr=last[1]*.42,len=o.drip||last[0]*1.6;
    cave3Band(m,{c,sides:S,nup:-.3,glow:.7,rings:[[yT,rr,0],[yT-len*.3,rr*.66,.3],[yT-len*.68,rr*.32,.68],[yT-len,.004,1]],
      col:(t,a,p)=>plnMul(cave3Cream(B,a,p),lerp(1,.85,t)),x:t=>lerp(.4,1,plnSmooth(0,.25,t))});
  }
  return yR;
}
/* зуб свода: конус, раструбом в камень. o: x, z, top, len, r, flare, sides, rings */
function cave3Flute(B,o){
  const r=B.r,n=o.rings||8,ph=r()*TAU,dx=(r()-.5)*.1*o.len,dz=(r()-.5)*.1*o.len;
  const y0=o.top+.35,y1=o.top-o.len;
  const c=y=>{const t=clamp((y0-y)/(y0-y1),0,1);return [o.x+dx*t*t,o.z+dz*t*t];};
  const rings=[],wave=5+o.len*3;
  for(let k=0;k<=n;k++){
    const t=k/n;
    rings.push([lerp(y0,y1,t),o.r*(.1+.9*Math.pow(1-t,1.25))*(1+(o.flare==null?.7:o.flare)*Math.pow(1-t,5))*(1+.05*Math.sin(t*wave+ph)),t]);
  }
  rings.push([y1-o.r*.35,.002,1]);
  cave3Band(B.m,{c,sides:o.sides||8,nup:-.3,glow:.7,rings,
    col:(t,a,p)=>plnMul(cave3Cream(B,a,p),lerp(1,.8,t)),x:t=>lerp(.3,1,plnSmooth(.05,.4,t))});
}
/* что висит со свода: короткое — зуб, длинное — колокола с остриём */
function cave3Hang(B,x,z,top,len){
  const r=B.r;
  if(len<1.3){cave3Flute(B,{x,z,top,len,r:.07+len*.08});return;}
  const N=len>3?4:len>2?3:2,R0=.2+len*.115,tiers=[],w=[],hb=len*.55;
  let sum=0;
  for(let i=0;i<N;i++){w.push(1.3-.5*i/N+r()*.25);sum+=w[i];}
  for(let i=0;i<N;i++)tiers.push([hb*w[i]/sum,R0*Math.pow(.72,i)*(.92+r()*.16)]);
  cave3Bells(B,{x,z,top,tiers,sides:21,drip:len*.45});
}
/* стопка на полу */
function cave3Mite(B,x,z,bot,h,rad){
  const r=B.r,N=clamp(Math.round(h/.42),2,6),tiers=[],w=[];
  let sum=0;
  for(let i=0;i<N;i++){w.push(1.2-.4*i/N+r()*.3);sum+=w[i];}
  for(let i=0;i<N;i++)tiers.push([h*w[i]/sum,rad*lerp(1,.34,Math.pow(i/Math.max(1,N-1),.8))*(.9+r()*.2)]);
  cave3Caps(B,{x,z,foot:bot,tiers,sides:21,bend:.04*h});
}
/* колонна: стопка, что выросла с пола, колокола, что сошли со свода, и шейка между */
function cave3Column(B,x,z,bot,top,rad){
  const r=B.r,H=top-bot,hs=H*(.38+r()*.1),hb=H*(.34+r()*.08);
  const N=5+(r()*2|0),M=4+(r()*2|0),tiers=[],bells=[],w=[],v=[];
  let sum=0;
  for(let i=0;i<N;i++){w.push(1.25-.5*i/N+r()*.3);sum+=w[i];}
  for(let i=0;i<N;i++)tiers.push([hs*w[i]/sum,rad*lerp(3,1.3,Math.pow(i/(N-1),.75))*(.92+r()*.16)]);
  const yTop=cave3Caps(B,{x,z,foot:bot,tiers,tipR:rad,sides:35});
  sum=0;
  for(let i=0;i<M;i++){v.push(1.3-.5*i/M+r()*.3);sum+=v[i];}
  for(let i=0;i<M;i++)bells.push([hb*v[i]/sum,rad*lerp(2.5,1.25,Math.pow(i/(M-1),.75))*(.92+r()*.16)]);
  cave3Bells(B,{x,z,top,tiers:bells,sides:35,join:{y:yTop-.15,r:rad}});
}
/* завеса: тонкий лист камня по трещине свода, складками, полосатый; свет идёт сквозь него.
   От (ax,az) до (bx,bz); probe — высота в воздухе под сводом */
function cave3Veil(B,ax,az,bx,bz,probe,drop){
  const F=B.F,r=B.r,n=30,rows=7,ph=r()*TAU,wav=2+r()*2,px=-(bz-az),pz=bx-ax,pl=Math.hypot(px,pz)||1,P=[],U=[];
  for(let i=0;i<=n;i++){
    const u=i/n,x0=lerp(ax,bx,u),z0=lerp(az,bz,u);
    if(cave3Den(F,x0,probe,z0)>-.4)return false;
    const top=cave3Up(F,x0,probe,z0)+.25,w=Math.sin(u*TAU*wav+ph)*.17+Math.sin(u*TAU*wav*2.3+ph*2)*.06;
    const len=Math.min(drop*(.3+.7*Math.pow(Math.sin(Math.PI*u),.6))*(.82+.18*Math.sin(u*TAU*wav+ph+1)),(top-probe)*1.4);
    for(let j=0;j<=rows;j++){
      const v=j/rows,sw=w*(.25+.75*v);
      P.push([x0+px/pl*sw,top-len*v,z0+pz/pl*sw]);U.push([u,v,len]);
    }
  }
  const m=B.m,base=m.nv,Wn=rows+1,D=B.D,pale=plnMix3(plnMix3(D.a,D.d,.2),F.col.a,D.mix);
  for(let i=0;i<=n;i++)for(let j=0;j<=rows;j++){
    const k=i*Wn+j,p=P[k],a=P[Math.min(i+1,n)*Wn+j],b=P[Math.max(i-1,0)*Wn+j],c=P[i*Wn+Math.min(j+1,rows)],d=P[i*Wn+Math.max(j-1,0)];
    let nr=plnNorm(plnCross(plnSub(a,b),plnSub(c,d)));
    if(nr[2]>0)nr=plnMul(nr,-1);
    const [u,v,len]=U[k],band=.5+.5*Math.sin((1-v)*len*7+u*2.5+ph);
    plnVert(m,p,nr,plnMix3(pale,D.ox,plnSmooth(.5,.95,band)*.6),CAVE3_MAT.veil,0,.6*D.wet/.6+.2,lerp(.35,1,plnSmooth(0,.3,v)));
  }
  for(let i=0;i<n;i++)for(let j=0;j<rows;j++)plnQuad(m,base+i*Wn+j,base+(i+1)*Wn+j,base+(i+1)*Wn+j+1,base+i*Wn+j+1);
  return true;
}
/* кристалл: шестигранная призма с остриём; куст — веер их около одной оси */
function cave3Crystal(m,base,dir,len,rad,tint,glow){
  const b0=plnAdd(base,plnMul(dir,-.15*len)),sh=plnAdd(base,plnMul(dir,len*.78)),tip=plnAdd(base,plnMul(dir,len));
  plnTube(m,{path:[b0,sh,tip],sides:6,mat:CAVE3_MAT.crystal,glow,rad:t=>t<.25?rad*.8:t<.75?rad:.004,col:t=>plnMix3(tint[0],tint[1],t),x:1});
}
function cave3Cluster(B,c,up,n,size,glow){
  const r=B.r,a1=plnNorm(plnCross(up,Math.abs(up[1])>.9?[1,0,0]:[0,1,0])),a2=plnCross(up,a1);
  for(let k=0;k<n;k++){
    const a=r()*TAU,s=k?Math.sqrt(r())*.8:0,len=size*(k?.4+r()*.6:1)*(1-s*.35),ca=Math.cos(a)*s,sa=Math.sin(a)*s;
    const dir=plnNorm([up[0]+a1[0]*ca+a2[0]*sa,up[1]+a1[1]*ca+a2[1]*sa,up[2]+a1[2]*ca+a2[2]*sa]);
    const o=[c[0]+(r()-.5)*size*.3,c[1]+(r()-.5)*size*.1,c[2]+(r()-.5)*size*.3];
    cave3Crystal(B.m,o,dir,len,len*(.10+r()*.05),CAVE3_DC.mauve,glow*(.7+r()*.6));
  }
}

/* ── что где лежит: записи игры в метрах, по полосам ── */
function cave3DressItems(C,F){
  const D=caveDeco(C,G.surf&&G.surf.p),out=[],P=CAVE_PPM;
  const gal=(x,low)=>{const c=caveCeilOf(C,x,low),f=caveFloorOf(C,x,low);return {c,f,ym:-(c+f)/2/P,gap:(f-c)/P,zd:cave3Zd(F,x,(c+f)/2)};};
  for(const t of D.tips)out.push({k:t.col?"col":t.up?"hang":"mite",X:t.x/P,t,g:gal(t.x,t.low),seed:t.seed});
  for(const c of D.curtains)out.push({k:"veil",X:(c.x0+c.w/2)/P,t:c,g:gal(c.x0+c.w/2,false),seed:c.seed});
  D.crystals.forEach((c,i)=>out.push({k:"cryst",X:c.x/P,t:c,g:gal(c.x,c.low),seed:hashi(i,C.seed,0xC1A5),zone:caveZoneAt(C,c.x).kind}));
  /* что лежит в камне разреза (22df) */
  for(const q of cave3InkItems(C,F))out.push(q);
  /* световые события в пролётах (22dh) */
  for(const q of cave3GapItems(C,F))out.push(q);
  /* наплывы у задней стены: шаг по обеим галереям, зал решает густоту */
  for(let x=30;x<2*CAVE_W-30;x+=26){
    const low=x>=CAVE_W;
    if(low&&(x-CAVE_W<360||x-CAVE_W>CAVE_W-200))continue;
    const wx=low?x-CAVE_W:x,z=caveZoneAt(C,wx),h=hashi(Math.round(wx),C.seed,low?0x3A11:0x3A17);
    if((h&1023)/1023>.25+z.Z.drip*.6)continue;
    out.push({k:"wall",X:wx/P,g:gal(wx,low),seed:h});
  }
  for(const q of out)q.b=Math.floor(q.X/CAVE3_DR.s);
  return out;
}

/* одна полоса: тело убранства, чернила разреза, огни кристаллов */
function cave3DressBin(C,F,items){
  const m=plnMesh(1<<14),ink=plnMesh(1<<10),B={F,m,r:null,D:CAVE3_DS=cave3DripSty(F)},lights=[],glows=[],P=CAVE_PPM;
  const air=(X,Y,Z,e)=>cave3Den(F,X,Y,Z)<-(e==null?.4:e);
  /* место в глубине за линией ходьбы; не нашлось — ближе к разрезу */
  const deep=(q,X,u)=>{
    const z1=Math.max(1.7,q.g.zd-1.1);
    for(const z of [lerp(1.5,z1,u),lerp(1.5,z1,u*.5),1.5])if(air(X,q.g.ym,z))return z;
    return -1;
  };
  for(const q of items){
    const r=B.r=rng(q.seed^0x5EED),g=q.g;
    if(q.k==="ink"){cave3InkBuild(F,ink,q,r);continue;}
    if(q.k==="veil"){
      const c=q.t,ax=c.x0/P,bx=(c.x0+c.w)/P,z1=Math.max(2,g.zd-1.2);
      cave3Veil(B,ax,lerp(1.6,z1,r()),bx,lerp(1.6,z1,r()),g.ym+g.gap*.2,Math.min(c.d/P*1.3,g.gap*.55));
      continue;
    }
    if(q.k==="cryst"){cave3DressCryst(B,q,lights,glows);continue;}
    if(q.k==="gap"){cave3GapBuild(B,q,lights,glows);continue;}
    const X=q.X,u=r();
    if(q.k==="wall"){
      /* у задней стены: наплыв с пола или кустик зубьев со свода */
      const z=Math.max(1.6,g.zd*lerp(.55,.8,r()));
      if(!air(X,g.ym,z,.3))continue;
      if(r()<.55){
        const bot=cave3Down(F,X,g.ym,z),top=cave3Up(F,X,g.ym,z),h=Math.min(.5+Math.pow(r(),1.4)*1.5,(top-bot)*.4);
        if(h>.45)cave3Mite(B,X,z,bot,h,.22+h*.26);
      }else{
        const top=cave3Up(F,X,g.ym,z);
        if(top-g.ym>g.gap*1.2+2)continue;
        for(let k=0,n=2+(r()*3|0);k<n;k++){
          const x=X+(r()-.5)*1.6,zz=z+(r()-.5)*.6;
          if(!air(x,g.ym,zz,.3))continue;
          const tp=cave3Up(F,x,g.ym,zz);cave3Flute(B,{x,z:zz,top:tp,len:.3+r()*.9,r:.1+r()*.08});
        }
      }
      continue;
    }
    const z=deep(q,X,u);
    if(z<0)continue;
    const top=cave3Up(F,X,g.ym,z),bot=cave3Down(F,X,g.ym,z),room=top-bot;
    if(room<1.2||top-g.ym>g.gap*1.2+2)continue;
    const L=q.t.L/P;
    if(q.k==="col"){
      if(room>10)continue;
      cave3Column(B,X,z,bot,top,clamp(.16+q.t.w/P*.45,.18,.5));
    }else if(q.k==="mite"){
      const h=Math.min(L*.9,room*.38);
      if(h>.3)cave3Mite(B,X,z,bot,h,.2+h*.2);
    }else{
      /* куст со свода: один длинный, вокруг короче — тем короче, чем дальше */
      const len=Math.min(L*1.15,room*.42),n=2+(r()*5|0),sp=.8+len*.3;
      if(len>.3)cave3Hang(B,X,z,top,len);
      for(let k=1;k<=n;k++){
        const a=r()*TAU,d=Math.sqrt(r())*sp,x=X+Math.cos(a)*d*1.4,zz=clamp(z+Math.sin(a)*d,1.3,Math.max(1.4,g.zd-.5));
        if(!air(x,g.ym,zz,.6))continue;
        const tp=cave3Up(F,x,g.ym,zz),l=Math.min(len*(.2+.5*r())*(1-.5*d/sp),(tp-g.ym)*.8);
        if(l>.2&&tp-g.ym<g.gap*1.2+2)cave3Hang(B,x,zz,tp,l);
      }
    }
  }
  return {m:m.ni?plnGeo(m):null,ink:ink.ni?plnGeo(ink):null,lights,glows,tris:(m.ni+ink.ni)/3};
}
/* куст кристаллов: из пола или со свода, нормаль — от камня; большой светит сам */
function cave3DressCryst(B,q,lights,glows){
  const F=B.F,r=B.r,c=q.t,g=q.g,X=q.X,grot=q.zone==="crystal";
  const hmax=c.spikes.reduce((a,s)=>Math.max(a,s.h),0)/CAVE_PPM;
  const n=grot?3:1;
  for(let k=0;k<n;k++){
    const x=X+(k?(r()-.5)*4:0),z=lerp(1.5,Math.max(1.8,g.zd-1),k?r():.25+r()*.5);
    if(cave3Den(F,x,g.ym,z)>-.3)continue;
    const roof=k?r()<.3:!c.up,py=roof?cave3Up(F,x,g.ym,z):cave3Down(F,x,g.ym,z);
    if(roof&&py-g.ym>g.gap*1.2+2)continue;
    const nrm=cave3Nrm(F,x,py,z),size=Math.min(hmax*(k?.5+r()*.4:1.15),Math.max(.6,g.gap*.35));
    const nn=(k?3:c.spikes.length*2)+4+(r()*4|0),glow=2.6+r()*.8;
    cave3Cluster(B,[x-nrm[0]*.1,py-nrm[1]*.1,z-nrm[2]*.1],nrm,nn,size,glow);
    if(size>.9){
      /* кристалл — акцент, ключ остаётся фонарю: фиолетовый отсвет ложится на камень в 2–3 м, ореол узкий */
      const p=plnAdd([x,py,z],plnMul(nrm,size*.35)),kk=clamp(size/3.2,.35,1)*.9;
      lights.push({p,r:clamp(2.6+size*.4,3,3.8),c:[2.3*kk,1.05*kk,3.1*kk]});
      if(!k)glows.push({p,c:[.62,.30,.85],k:.55*kk,s:.8+size*.25});
    }
  }
}
/* ── кадр: полосы, что видны, строятся по бюджету; огни ближних кристаллов — в кадр ── */
function cave3DressFrame(C,F,Fd,x0,x1,cx,first,cy){
  const Q=C.dr3||(C.dr3={m:new Map(),gen:-1,t:0,items:null,by:null});
  if(Q.gen!==PLN_GPU.gen){for(const b of Q.m.values()){plnGeoFree(b.m);plnGeoFree(b.ink);}Q.m.clear();Q.gen=PLN_GPU.gen;}
  if(!Q.items){
    Q.items=cave3DressItems(C,Fd);Q.by=new Map();
    for(const q of Q.items){let a=Q.by.get(q.b);if(!a)Q.by.set(q.b,a=[]);a.push(q);}
  }
  Q.t++;
  const s=CAVE3_DR.s,b0=Math.floor(x0/s),b1=Math.floor(x1/s),want=[],vis=[];
  for(let b=b0;b<=b1;b++){
    const k=Q.m.get(b);
    if(k){k.t=Q.t;vis.push(k);}else if(Q.by.has(b))want.push([b,Math.abs((b+.5)*s-cx)]);
  }
  want.sort((a,b)=>a[1]-b[1]);
  const t0=wallMs(),lim=first?CAVE3_DR.first:CAVE3_DR.ms;
  let built=0;
  for(const [b] of want){
    if(built&&wallMs()-t0>lim)break;
    const k=cave3DressBin(C,Fd,Q.by.get(b));k.t=Q.t;Q.m.set(b,k);vis.push(k);built++;
  }
  if(Q.m.size>CAVE3_DR.keep){
    const old=[...Q.m.entries()].filter(e=>e[1].t!==Q.t).sort((a,b)=>a[1].t-b[1].t);
    for(const [b,k] of old.slice(0,Q.m.size-CAVE3_DR.keep)){plnGeoFree(k.m);plnGeoFree(k.ink);Q.m.delete(b);}
  }
  let tris=0;
  const L=[],Gl=[];
  for(const k of vis){
    if(k.m)F.draw.push({geo:k.m,lamp:true,sun:true,refl:true});
    if(k.ink)F.draw.push({geo:k.ink,lamp:false,sun:false});
    tris+=k.tris;L.push(...k.lights);Gl.push(...k.glows);
  }
  /* огней в кадре двенадцать: убранству — до пяти ближних (кадр потом отберёт по силе), свечений — до трёх */
  /* ближние — по x и по y: куст галереей ниже светит не в этот кадр */
  const dd=q=>Math.hypot(q.p[0]-cx,cy==null?0:q.p[1]-cy);
  L.sort((a,b)=>dd(a)-dd(b));
  Gl.sort((a,b)=>dd(a)-dd(b));
  F.lights.push(...L.slice(0,5));
  F.glows.push(...Gl.slice(0,Math.max(0,Math.min(3,6-F.glows.length))));
  /* залы в кадре — шейдеру: стена галереи и натёчного зала в рёбрах, грота — друзой, у озера гладкая */
  F.zones=caveZones(C).filter(z=>z.x1/CAVE_PPM>x0-4&&z.x0/CAVE_PPM<x1+4).slice(0,4)
    .map(z=>[z.x0/CAVE_PPM,z.x1/CAVE_PPM,CAVE3_ZK[z.kind]==null?0:CAVE3_ZK[z.kind]]);
  CAVE3.stat.dress=Q.m.size;CAVE3.stat.dtris=Math.round(tris);
  return tris;
}
