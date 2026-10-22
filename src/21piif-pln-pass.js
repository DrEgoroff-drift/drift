/* ══════════════ планета: корабль перевала — тело (plnOverOld, 22.10) ══════════════
   Перевал (11p, M144): за посёлком в грунте лежит корабль, к которому ходят на поклон. Свет можно
   включить, объяснить — можно. Тело держит четыре слоя старой вещи (11p, G6):
   1. Завод — длинный корпус сечением «кирпич со скруглением», корма тупая, нос сходит вниз; швы листов —
      тёмные кольца через 1,6 м, привальный брус по борту; киль-плавник над кормовой третью.
   2. Служба — рыжие потёки из-под каждого иллюминатора.
   3. Ремонт — лист чужого цвета на заклёпках внизу борта.
   4. Век стоянки — низ ушёл в землю, к днищу намело валы грунта цветом земли.
   Иллюминаторы — стекло в латунном кольце: днём тёмное, в нём небо; со светом — тёплое окно, и оно светит
   на грунт и на людей у трапа (две лампы движка: ряд окон и люк — ламп в кадре всего четыре).
   Трап сходит из люка к объективу, паломники — три фигуры у его подножия, пока не объяснили.
   Состояние (11p): G.pass={lit,told}; тело пересобирается, когда меняется одно из двух. */
const PASS3={it:null,gen:-1,L:null};
const PASS_V={z:6.5,len:14.5,rz:2.3,bot:-1.4,win:2.3,hatch:-4.75};

function plnPassMesh(L,tr,p){
  const P=passAll(),V=PASS_V,x=passShipX(tr,p)/PLN_M,o=[x,plnLandRibAt(L,x,V.z-V.rz),V.z],
    m=plnMesh(1<<15),lm=plnMesh(1<<10),K=plnOwnKit(m,lm),MAN=PLN_MAT.man,C=plnSetPal(p),
    gy=(xx,zz)=>plnLandRibAt(L,o[0]+xx,zz)-o[1];
  const base=plnMix3(plnRgb(p.T.pal[2].map(v=>v*.55+34)),plnHex("#948a78"),.55),
    soil=plnMix3(C.earth,PLN_PAL.soil,.3),brass=plnHex("#96784a"),rust=plnHex("#78402a"),
    sky=plnRgb(p.T.sky[0]),glass=plnMix3(plnHex("#0a0c10"),sky,.22),warm=[1,.8,.45];
  const hl=V.len/2,sq=.45,pw=2+2*sq;
  /* профиль: верх по длине (u 0 — корма, 1 — нос), низ в земле */
  const top=u=>u<.16?lerp(1.2,3.5,plnSmooth(0,.16,u)):u<.79?lerp(3.5,3.9,(u-.16)/.63):lerp(3.9,1.75,plnSmooth(.79,1,u)),
    rzAt=u=>V.rz*(.55+.45*Math.min(plnSmooth(0,.14,u),plnSmooth(1,.7,u)));
  const sec=xx=>{const u=clamp((xx+hl)/V.len,0,1),t=top(u);return {u,y:(t+V.bot)/2,ry:(t-V.bot)/2,rz:rzAt(u)};};
  /* точка борта к объективу (−z) на высоте yy и её нормаль */
  const side=(xx,yy)=>{const S=sec(xx),yq=clamp((yy-S.y)/S.ry,-.98,.98),zq=Math.pow(1-Math.pow(Math.abs(yq),pw),1/pw);
    const n=plnNorm([0,Math.sign(yq)*Math.pow(Math.abs(yq),pw-1)/S.ry,-Math.pow(zq,pw-1)/S.rz]);
    return {p:[xx,yy,-S.rz*zq],n};};
  /* лоскут по борту: полосы по высоте, каждая лежит на борту — плоская карточка на выпуклом борту тонула */
  const patch=(mm,xa,xb,ya,yb,col,mat,g,lift)=>{const n=Math.max(1,Math.ceil(Math.abs(yb-ya)/.2));
    for(let j=0;j<n;j++){const y0=lerp(ya,yb,j/n),y1=lerp(ya,yb,(j+1)/n),
      q=[side(xa,y0),side(xa,y1),side(xb,y1),side(xb,y0)].map(v=>plnAdd(v.p,plnMul(v.n,lift)));
      if(y1<y0)q.reverse();
      plnCard(mm,q[0],q[1],q[2],q[3],side((xa+xb)/2,(y0+y1)/2).n,col,mat,null,g||0,g?1:0);}};
  /* станции: ровный шаг и по паре у каждого шва — шов ложится тёмным кольцом в 8 см */
  const seam=V.len/9,xs=[];
  for(let i=0;i<=36;i++)xs.push(-hl+V.len*i/36);
  for(let i=1;i<9;i++){const c=-hl+i*seam;xs.push(c-.05,c,c+.05);}
  xs.sort((a,b)=>a-b);
  const st=xs.filter((v,i)=>!i||v-xs[i-1]>.01).map(xx=>{const S=sec(xx);return {x:xx,y:S.y,ry:S.ry,rz:S.rz};});
  plnLoft(m,{st,sides:32,sq,belly:1,mat:MAN,col:(t,s,q)=>{
    const k=Math.round((q[0]+hl)/seam),dk=Math.abs(q[0]+hl-k*seam)<.02&&k>0&&k<9?.72:1;
    const c=plnMul(base,dk*(.94+.06*Math.sin(k*2.3)));
    return plnMix3(c,soil,.8*(1-plnSmooth(.1,1.3,q[1])));}});
  /* привальный брус: по борту на 1.5 м, от кормы до носа там, где борт полный */
  {const path=[];for(let i=0;i<=20;i++){const xx=lerp(-hl+1.6,hl-2.4,i/20),q=side(xx,1.5);path.push(plnAdd(q.p,plnMul(q.n,.03)));}
   plnTube(m,{path,rad:.045,sides:5,col:plnMul(base,.7),mat:MAN});}
  /* киль: плавник над кормовой третью, дальше от нас — темнее */
  {const kx=hl-5.3,ta=sec(kx-1.1),tb=sec(kx+1.1),fc=plnMix3(base,plnHex("#3a3e44"),.2),
     a=[kx-1.1,ta.y+ta.ry-.1],b=[kx+1.1,tb.y+tb.ry-.1],c=[kx+1.0,b[1]+1.15],d=[kx+.45,b[1]+1.15];
   for(const z of [-.07,.07]){const P4=[a,d,c,b].map(q=>[q[0],q[1],z]);
     plnCard(m,...(z<0?P4:P4.slice().reverse()),[0,0,Math.sign(z)],z<0?fc:plnMul(fc,.8),MAN);}
   plnTube(m,{path:[[a[0],a[1],0],[d[0],d[1],0],[c[0],c[1],0],[b[0],b[1],0]],rad:.075,sides:5,col:fc,mat:MAN});}
  /* ремонт: лист чужого цвета на заклёпках, внизу пятого листа */
  {const xa=-hl+5*seam+.15,xb=xa+seam-.25,ya=.45,yb=1.4,c=plnMix3(base,plnRgb([150,120,84]),.45);
   patch(m,xa,xb,ya,yb,c,MAN,0,.02);
   for(let j=0;j<4;j++){const v=side(lerp(xa+.1,xb-.1,j/3),yb-.1);plnBlob(m,{c:plnAdd(v.p,plnMul(v.n,.03)),r:[.025,.025,.025],sub:1,col:plnMul(base,.4),mat:MAN});}}
  /* иллюминаторы: латунное кольцо, стекло; под каждым — потёк */
  const wins=[];
  for(let i=0;i<6;i++){
    const wx=-hl+3.36+i*1.68,v=side(wx,V.win);wins.push(v.p);
    plnTube(m,{path:[plnAdd(v.p,plnMul(v.n,-.04)),plnAdd(v.p,plnMul(v.n,.07))],rad:.34,sides:14,col:brass,mat:MAN,cap:true});
    const g=plnAdd(v.p,plnMul(v.n,.09));
    if(P.lit)plnBlob(lm,{c:g,r:[.25,.25,.03],sub:1,col:warm,mat:PLN_MAT.glow,glow:1.4,x:1});
    else{plnBlob(m,{c:g,r:[.26,.26,.03],sub:1,col:glass,mat:MAN});
      plnBlob(m,{c:plnAdd(g,[-.08,.08,-.02]),r:[.07,.07,.01],sub:1,col:plnMix3(glass,sky,.6),mat:MAN});}
    for(const [ya,yb,w,a] of [[V.win-.38,V.win-.95,.07+.02*(i%3),.55],[V.win-.95,V.win-1.6,.05+.02*(i%3),.25]]){
      patch(m,wx-w,wx+w,yb,ya,plnMix3(base,rust,a),MAN,0,.012);}
  }
  /* люк и трап: проём в борту, сходня к объективу со стойками и поручнем */
  const hx=V.hatch,hv=side(hx,1.05),hb=plnAdd(hv.p,plnMul(hv.n,.05));
  {const w=.48,h=1.6,n=hv.n;
   if(P.lit){patch(lm,hx-w,hx+w,1.0,1.0+h*.55,[1,.74,.4],PLN_MAT.glow,1.0,.05);patch(lm,hx-w,hx+w,1.0+h*.55,1.0+h,[.9,.72,.5],PLN_MAT.glow,.55,.05);}
   else patch(m,hx-w,hx+w,1.0,1.0+h,plnHex("#0c0e12"),MAN,0,.05);
   for(const d of [-1,1])K.rod(plnAdd(side(hx+d*(w+.06),.95).p,plnMul(n,.04)),plnAdd(side(hx+d*(w+.06),1.0+h+.06).p,plnMul(n,.04)),.05,plnMul(base,.6));}
  const fz=2.0-o[2],foot=[hx-.2,gy(hx-.2,o[2]+fz)+.02,fz];
  {const a=[hx,hb[1]-.05,hb[2]-.05],w=.5,dk=plnHex("#22262c");
   for(const d of [-1,1])K.rod([a[0]+d*w,a[1],a[2]],[foot[0]+d*w,foot[1],foot[2]],.06,dk,{sides:5});
   for(let j=0;j<=5;j++){const t=j/5,c=plnMix3(a,foot,t);K.box([c[0],c[1]+.02,c[2]],[w,.035,.13],plnMul(dk,1.4),{box:.6});}
   for(const d of [-1,1]){const r0=[a[0]+d*w,a[1]+.95,a[2]],r1=[foot[0]+d*w,foot[1]+.95,foot[2]];
     K.rod(r0,r1,.025,plnHex("#9a9080"),{sides:4});
     for(let j=0;j<4;j++){const t=j/3,b=plnMix3([a[0]+d*w,a[1],a[2]],[foot[0]+d*w,foot[1],foot[2]],t);K.rod(b,[b[0],b[1]+.95,b[2]],.02,plnHex("#9a9080"),{sides:4});}}}
  /* век стоянки: валы грунта к днищу по борту к объективу */
  {const r=rng(0x9A52+(p.idx|0));
   for(let xx=-hl+.4;xx<hl-.3;xx+=.9+r()*.5){
     const S=sec(xx),zq=-S.rz*.92,yb=gy(xx,o[2]+zq);
     plnBlob(m,{c:[xx,yb+.05,zq-.15],r:[.75+r()*.4,.28+r()*.22,.55],sub:1,bump:.3,seed:Math.round(xx*31),col:plnMul(soil,.92+r()*.16),mat:MAN});}}
  /* паломники у подножия трапа, лицом к кораблю */
  if(!P.told){const cl=[plnHex("#6a5a48"),plnHex("#584e46"),plnHex("#74624a")];
    for(let i=0;i<3;i++){const fx=foot[0]-1.1-i*.75,fz2=foot[2]+[.2,-.5,.35][i];
      plnSetFig(K,m,[fx,gy(fx,o[2]+fz2),fz2],cl[i],"stand",0x9A60+i);}}
  return {o,m,lm,lit:P.lit?{win:plnMix3(wins[2],wins[3],.5),hatch:foot}:null};
}
function plnPassFree(){
  const it=PASS3.it;if(!it)return;
  for(const g of it.geo)plnGeoFree(g);
  if(it.inst)plnInstFree(it.inst);
  PASS3.it=null;
}
function plnPassStep(L,S){
  if(PASS3.gen!==PLN_GPU.gen||PASS3.L!==L){plnPassFree();PASS3.gen=PLN_GPU.gen;PASS3.L=L;}
  if(typeof passIsCore!=="function"||!passIsCore(S.p)){plnPassFree();return;}
  const P=passAll(),key=[S.p.idx,P.lit|0,P.told|0].join("|");
  if(PASS3.it&&PASS3.it.key===key)return;
  plnPassFree();
  const M=plnPassMesh(L,S.tr,S.p),geo=[plnGeo(plnMeshDone(M.m))];
  if(M.lit)geo.push(plnGeo(plnMeshDone(M.lm)));
  const it={key,o:M.o,geo,lit:M.lit,a:new Float32Array(32),inst:null};
  plnRec(it.a,0,it.o,1,0,1,0,null);
  plnRec(it.a,1,it.o,1,0,1,0,[1,1,1]);
  it.inst=plnInst(it.a,2,2);
  PASS3.it=it;
}
function plnPassFrame(F,ex,V){
  const it=PASS3.it;if(!it)return;
  if(Math.abs(it.o[0]-ex)>V.hw*(1+it.o[2]/V.D)+10)return;
  F.batches.push({geo:it.geo[0],inst:it.inst,first:0,count:1,kind:PLN_KIND.body,to:PLN_TO.all});
  if(it.geo[1])F.batches.push({geo:it.geo[1],inst:it.inst,first:1,count:1,kind:PLN_KIND.body,to:PLN_TO.lit});
  if(it.lit){const w=(q,dy)=>[it.o[0]+q[0],it.o[1]+q[1]+dy,it.o[2]+q[2]];
    if(F.lamps.length<4)F.lamps.push({p:w(it.lit.win,-.6),r:7,c:[1,.84,.58],k:1.1});
    if(F.lamps.length<4)F.lamps.push({p:w(it.lit.hatch,1.2),r:6,c:[1,.8,.52],k:1.3});}
}
