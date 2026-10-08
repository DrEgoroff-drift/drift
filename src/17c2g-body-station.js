/* ══ станция телом (M820 §5) ══
   Самое большое тело системы. Кости у всех одни: хребет вдоль оси, на ближнем конце мачта причала
   с четырьмя тёплыми фонарями (туда смотрит причал 17e: баржа стоит в st+(96,58), отсюда и разворот
   BODY_ST_A). Ядро — по типу станции, модули вдоль хребта — по сборке завода (makerAssembly),
   окна — тёплые панели на крышах: единственный тёплый свет людей в темноте. Холодные трубки ламп —
   только у комбината и научной. 2–4 точки gpuLight (мачта, ангар) светят пришвартованным.
   Мерка — та же, что у выпечки 17c: 160 единиц на сторону, масштаб s, на зуме 1 — 272 px */
const BODY_ST_KEEP=4,BODY_ST_A=Math.atan2(34,56);
const BODY_WARM=[255,194,118],BODY_COLD=[170,214,255];
/* ядро по типу: строит в K, отдаёт {x0,x1,w} — пролёт ядра по хребту и полуширину для поля тени */
const BODY_ST_CORE={
  trade:(B)=>bodyStRing(B,false),
  bazaar:(B)=>bodyStRing(B,true),
  indust:(B)=>{const {K,C,cx,base,dark,L,P}=B;
    K.box(cx-22,cx+22,-19,19,-5,6,1.2,C(mixc(base,[0,0,0],.12)),3,-.5);
    for(let i=-2;i<=2;i++)K.box(cx+i*8-.6,cx+i*8+.6,-19.3,19.3,5,6.6,.1,C(dark),3,.5);   /* рёбра крыши */
    for(const s of [-1,1]){B.cyl(cx+10,s*9,6,19,3.4,[64,58,54],.5,[30,26,24],0);   /* трубы: жерло в копоти, жар — малым кругом в глубине */
      const Q=[];for(let i=0;i<10;i++){const t=i/10*TAU;Q.push([cx+10+Math.cos(t)*1.3,s*9+Math.sin(t)*1.3,19.05]);}
      K.face(Q,[cx+10,s*9,18],C([196,84,36]),3,-.1,1.35);
      B.cold(cx-20,cx-4,s*17.6,6.7);}
    K.face([[cx-13,-4,6.7],[cx-5,-4,6.7],[cx-5,4,6.7],[cx-13,4,6.7]],[cx-9,0,5],C([132,62,34]),3,-.1,1.25);   /* продух — тлеет под решёткой */
    for(let i=0;i<4;i++)K.box(cx-12.6+i*2.2,cx-11.8+i*2.2,-4.3,4.3,6.6,7.1,.05,C(dark),3,.4);
    B.wins(cx+14,cx+21,-17,17,6.7,3);P.push([cx,0,.8]);return {x0:cx-22,x1:cx+22,w:19};},
  yard:(B)=>{const {K,C,cx,steel,dark,L,P}=B;
    for(const s of [-1,1])K.box(cx-32,cx+32,s*24-1.6,s*24+1.6,-2,4,.4,C(steel),3,.5);   /* рельсы стапеля */
    /* одна рама: два рельса и две торцевые балки; внутри — только корпус, будка — на углу снаружи */
    for(const x of [cx-33,cx+31])K.box(x,x+2,-25.6,25.6,-2,4,.3,C(steel),3,.5);
    K.box(cx+24,cx+31,26,32,-1,7,.6,C(B.base),3,.5);B.wins(cx+25,cx+30,27,31,7.1,1);
    for(const s of [-1,1]){L.push({x:cx-30,y:s*24,c:BODY_WARM,r:.9,k:0,ph:0});P.push([cx-26,s*18,1]);}
    B.slip={x:cx,y:0};return {x0:cx-33,x1:cx+33,w:6};},
  sci:(B)=>{const {K,C,cx,base,steel,L,P}=B,Sp=[];
    for(let k=0;k<=10;k++){const ph=-Math.PI/2+Math.PI*k/10;Sp.push([15*Math.sin(ph),Math.max(15*Math.cos(ph),.01)]);}
    K.lathe(cx,0,0,Sp,C(mixc(base,[230,236,244],.35)),3,-.7,0,20,null,null);
    for(let k=0;k<6;k++){const t=k/6*TAU+.3;B.win1(cx+Math.cos(t)*9,Math.sin(t)*9,13.5);}
    K.tube([[cx-4,8,8],[cx-6,24,10]],1,C(steel),3,.5,6);
    K.lathe(cx-12,26,10,[[0,.8],[3,5],[5,9]],C([214,220,228]),3,.9,0,18,null,null);   /* тарелка */
    B.cold(cx-30,cx-18,-5.2,3.8);B.cold(cx+18,cx+30,5.2,3.8);P.push([cx,0,.7]);return {x0:cx-15,x1:cx+15,w:15};},
  outpost:(B)=>{const {K,C,cx,dark,steel,L,P}=B,Sp=[];
    K.box(cx-10,cx+10,-10,10,-3,4,1,C(B.base),3,-.5);
    for(let k=0;k<=6;k++){const ph=-Math.PI/2+Math.PI*k/6;Sp.push([5.5*Math.sin(ph),Math.max(5.5*Math.cos(ph),.01)]);}
    K.lathe(cx,0,8,Sp,C(dark),3,.7,0,12,null,null);   /* башня орудия */
    K.tube([[cx+2,-2,9],[cx+8,-17,9]],1.1,C(steel),3,.6,6);K.tube([[cx-2,-2,9],[cx+3,-17,9]],1.1,C(steel),3,.6,6);
    L.push({x:cx-8,y:8,c:[255,96,80],r:1,k:.06,ph:0});B.wins(cx-8,cx-2,4,9,4.1,1);P.push([cx,0,.6]);return {x0:cx-10,x1:cx+10,w:10};},
  fuel:(B)=>{const {K,C,cx,steel,L,P}=B,tk=[[0,1],[2,5.6],[5,7],[25,7],[28,5.6],[30,1]];
    for(const y of [-11,11,-26,26])K.lathe(cx-15,y,0,tk,C(mixc(B.base,[200,206,214],.62)),3,.8,0,16,null,null);
    for(const y of [-18.5,18.5])K.box(cx-12,cx+12,y-.8,y+.8,-1,1.5,.2,C(steel),3,.5);
    K.tube([[cx+10,26,7],[cx+16,36,8],[cx+26,40,6]],1,C([160,120,60]),3,.5,6);   /* рукав заправки */
    L.push({x:cx+26,y:40,c:BODY_WARM,r:.9,k:.05,ph:.4});P.push([cx+14,30,.7]);return {x0:cx-15,x1:cx+15,w:28};},
};
/* кольцо торгового узла (и базара — с тканью трёх цветов и двойными фонарями) */
function bodyStRing(B,cloth){
  const {K,C,cx,base,steel,dark,L,P}=B,R=34,N=40,Q=[];
  for(let i=0;i<=N;i++){const t=i/N*TAU;Q.push([cx+Math.cos(t)*R,Math.sin(t)*R,0]);}
  K.tube(Q,4.6,C(mixc(base,[220,222,226],.18)),3,.6,12);
  /* палуба — второе кольцо внутри, ниже и темнее: обод читается обжитым, а не обручем */
  K.tube(Q.map(q=>[cx+(q[0]-cx)*.84,q[1]*.84,-1.2]),2.4,C(dark),3,.4,8);
  /* две спицы поперёк хребта: вдоль него спицей служит сам хребет, четверти свободны под модули */
  for(const s of [-1,1])K.tube([[cx,s*5,0],[cx,s*(R-3),0]],1.4,C(steel),3,.5,6);
  K.box(cx-7,cx+7,-7,7,-4,5,1,C(dark),3,-.5);
  /* окна полосой по верху кольца: часть погашена — люди спят */
  const r=rng(hashi(B.seed,0x71D,1));
  for(let i=0;i<N;i++){if(r()<.35)continue;const t=(i+.5)/N*TAU,c=Math.cos(t),s=Math.sin(t),a=.55,b=.8;
    B.win4([[cx+c*(R-a)-s*b,s*(R-a)+c*b],[cx+c*(R+a)-s*b,s*(R+a)+c*b],[cx+c*(R+a)+s*b,s*(R+a)-c*b],[cx+c*(R-a)+s*b,s*(R-a)-c*b]],4.65,r()*.8);}
  /* ткань одного ряда: акцент завода, приглушённый, в три тона — полотно, а не пластик */
  if(cloth){const a=mixc(B.acc,[150,120,90],.3),CL=[mixc(a,[196,182,156],.55),a,mixc(a,[26,22,20],.5)],q=rng(hashi(B.seed,0xC10F,2));
    /* навесы рядов: шаг и длина неровные (ряды ставили разные люди), тон — полотно, акцент, тень */
    let t=q()*TAU;for(let i=0;i<10;i++){t+=TAU/10*(.6+q()*.8);const c=Math.cos(t),s=Math.sin(t),col=C(CL[q()<.45?0:q()<.6?1:2]),w=1.8+q()*1.6,o=R+8+q()*6;
      K.face([[cx+c*(R+4)-s*w,s*(R+4)+c*w,1],[cx+c*o-s*w*1.2,s*o+c*w*1.2,.6],[cx+c*o+s*w*1.2,s*o-c*w*1.2,.6],[cx+c*(R+4)+s*w,s*(R+4)-c*w,1]],
        [cx+c*(R+8),s*(R+8),-3],col,3,.15,0);}
    for(let i=0;i<8;i++){const t=i/8*TAU;L.push({x:cx+Math.cos(t)*(R+4.6),y:Math.sin(t)*(R+4.6),c:BODY_WARM,r:.8,k:0,ph:0});}}
  else for(let i=0;i<4;i++){const t=i/4*TAU;L.push({x:cx+Math.cos(t)*(R+4.6),y:Math.sin(t)*(R+4.6),c:BODY_WARM,r:.8,k:0,ph:0});}
  P.push([cx,0,.9]);
  return {x0:cx-8,x1:cx+8,w:0};   /* модулям закрыта только ступица */
}
/* модули вдоль хребта по сборке завода: стойка и барабан, блок, ряд, кольцевые барабаны, лоскут, игла */
function bodyStModules(B,cr,xa,xb){
  const {K,C,base,dark,acc,steel,seed}=B,asm=makerAssembly(B.by),r=rng(hashi(seed,0x40D,7));
  const n=asm==="block"?4:asm==="stack"?8:4+Math.floor(r()*6),same=asm==="stack",free=[];
  /* места: по обе стороны хребта, вне ядра; ряд — одинаковым шагом */
  for(let x=xa+4;x<xb-6;x+=same?11:9+r()*6)if(x+10<cr.x0-2||x>cr.x1+2)free.push(x);
  let k=0;
  for(const x of free)for(const s of [-1,1]){
    if(k>=n*2||(!same&&r()<.15))continue;k++;
    const len=same?9:asm==="block"?14+r()*4:asm==="spine"?12+r()*6:9+r()*7,wd=same?9:asm==="block"?13:asm==="spine"?4+r()*2:7+r()*9,ht=same?6:5+r()*5;
    const y0=s<0?-5-wd:5,y1=s<0?-5:5+wd,col=asm==="patch"?mixc(base,[[196,150,74],[150,82,52],[120,126,96]][(r()*3)|0],.45):(r()<.2?acc:base);
    if(asm==="rack"&&k%2||asm==="ring"){   /* барабан вдоль оси */
      const rr=wd/2,yc=(y0+y1)/2;K.lathe(x,yc,0,[[0,rr*.7],[1,rr],[len-1,rr],[len,rr*.7]],C(col),3,.55,0,14,[C(dark),.3,0],[C(dark),.3,0]);
      B.win1(x+len/2,yc,rr+.05);continue;}
    K.box(x,x+len,y0,y1,-ht*.6,ht,Math.min(1.2,ht*.2),C(col),3,asm==="block"?.9:.45);
    if(asm!=="block")for(let i=1;i<3;i++){const xx=x+len*i/3;K.box(xx-.35,xx+.35,y0-.2,y1+.2,ht-.4,ht+.5,.1,C(dark),3,.4);}
    const nw=asm==="block"?3:1+((r()*3)|0);B.wins(x+1.2,x+len-1.2,Math.min(y0,y1)+1.2,Math.max(y0,y1)-1.2,ht+.06,nw);
    if(asm==="spine"&&r()<.5)K.tube([[x+len/2,s*(wd+5),ht],[x+len/2,s*(wd+15),ht]],.4,C(steel),3,.5,5);   /* мачта иглы */
    if(asm==="block"&&r()<.6){const Sp=[];for(let j=0;j<=5;j++){const ph=-Math.PI/2+Math.PI*j/5;Sp.push([3*Math.sin(ph),Math.max(3*Math.cos(ph),.01)]);}
      K.lathe(x+len/2,s*(wd+8.5),0,Sp,C([236,238,242]),3,1,0,10,null,null);}   /* под Компании */
  }
}
function h3dStationMesh(S,ty,by,seed){
  return bodyMesh("st:"+seed+ty+by,BODY_ST_KEEP,()=>{
    const K=h3dKit(),C=K.C,MR=makerRow(by),gnd=makerGround(by),r=rng(hashi(seed,0x57A7,3));
    /* основа тёмная: в темноте читаются освещённые грани и окна, а не ровная заливка */
    const base=mixc([42,46,54],gnd,.26),dark=mixc(base,[10,12,16],.5),iron=[48,52,60],steel=[118,122,128];
    const acc=MR.stripe?mixc(makerLightCol(by),[40,34,30],.58):mixc(gnd,[255,255,255],.1),L=[],P=[];
    const B={K,C,seed,by,base,dark,iron,steel,acc,L,P,cx:-6};
    /* окно — панель своей краски с огнём сверх 1: светит само, в тени тоже */
    B.win4=(Q,z,k)=>K.face(Q.map(q=>[q[0],q[1],z]),[Q[0][0],Q[0][1],z-2],C(BODY_WARM),3,-.1,1.2+k*.55);
    B.win1=(x,y,z)=>B.win4([[x-.9,y-.9],[x+.9,y-.9],[x+.9,y+.9],[x-.9,y+.9]],z,.6);
    B.wins=(x0,x1,y0,y1,z,n)=>{for(let i=0;i<n;i++){const x=x0+(x1-x0)*(r()*.8+.1),y=y0+(y1-y0)*(r()*.8+.1),w=.45+r()*.5,h=.4+r()*.3;
      if(r()<.25)continue;B.win4([[x-w,y-h],[x+w,y-h],[x+w,y+h],[x-w,y+h]],z,r()*.9);}};
    B.cold=(x0,x1,y,z)=>K.face([[x0,y-.45,z],[x1,y-.45,z],[x1,y+.45,z],[x0,y+.45,z]],[(x0+x1)/2,y,z-2],C(BODY_COLD),3,-.1,1.7);
    B.cyl=(x,y,z0,z1,rr,col,sp,cap,em)=>{K.tube([[x,y,z0],[x,y,z1]],rr,C(col),3,sp,12);const Q=[];
      for(let i=0;i<12;i++){const t=i/12*TAU;Q.push([x+Math.cos(t)*rr,y+Math.sin(t)*rr,z1]);}K.face(Q,[x,y,z1-1],C(cap||col),3,sp,em||0);};
    /* хребет и мачта причала */
    const xa=ty==="outpost"?-34:-60,xb=ty==="outpost"?34:50;
    const SG=ty==="yard"?[[xa,B.cx-33],[B.cx+33,xb]]:[[xa,xb]];   /* у верфи хребет упирается в раму, а не идёт сквозь корпус */
    for(const [a0,a1] of SG)K.lathe(a0,0,0,[[0,4.6],[a1-a0,4.6]],C(mixc(base,iron,.45)),3,-.5,0,14,[C(iron),-.3,0],[C(iron),-.3,0]);
    for(let x=xa+8;x<xb;x+=12)if(ty!=="yard"||x<B.cx-34||x>B.cx+34)K.box(x-.5,x+.5,-5.2,5.2,-4.6,5.1,.1,C(dark),3,.4);   /* обручи хребта */
    K.box(xb,xb+16,-1.3,1.3,-1.3,1.8,.3,C(steel),3,.5);
    for(const [mx,my] of [[xb+5,-3.4],[xb+5,3.4],[xb+14,-3.4],[xb+14,3.4]]){
      K.box(mx-.9,mx+.9,my-.9,my+.9,-.5,2.8,.2,C(iron),3,.5);L.push({x:mx,y:my,c:BODY_WARM,r:.95,k:0,ph:0});}
    P.push([xb+12,0,.8]);
    const cr=(BODY_ST_CORE[ty]||BODY_ST_CORE.trade)(B);
    bodyStModules(B,cr,xa,xb);
    /* поле тени: хребет, ядро — своей полушириной */
    const st=[[xb+16,1.3],[xb,4.6]];
    if(cr.w>5){st.push([cr.x1+.1,4.6],[cr.x1,cr.w],[cr.x0,cr.w],[cr.x0-.1,4.6]);}
    st.push([xa,4.6]);
    const m=h3dPack(K.V,80,{st,ne:2.2,kh:.45,gl:.4});
    m.L=L;m.P=P;m.slip=B.slip||null;return m;});
}
/* станция на месте выпечки 17c: тело, фонари, точки света; стапель верфи — корпус флота поверх */
function bodyStation(S,x,y,s,ty){
  if(!bodyGpu())return false;
  const by=S.by||"gt",seed=hashi((G.sys&&G.sys.seed)|0,0x57B0,ty.length),m=h3dStationMesh(S,ty,by,seed),a=BODY_ST_A;
  const c=Math.cos(a),n=Math.sin(a),T=(u,v)=>[x+(u*c-v*n)*s,y+(u*n+v*c)*s];
  for(const p of m.P){const [px,py]=T(p[0],p[1]);gpuLight(px,py,px,py,1,.8,.55,40*s,p[2]);}
  if(!bodyRun(m,x,y,a,s,S.x||0,S.y||0,0))return false;
  bodyLights(m,x,y,a,s,1);
  if(m.slip){const id="f"+(seed%92),h=hullOf(id),[hx,hy]=T(m.slip.x,m.slip.y),[lx,ly]=sysLightDir(S.x||0,S.y||0);
    hullGpuDraw(id,hx,hy,a,s*Math.min(.9,50/Math.max(1,h.nose-h.tail)),false,false,0,0,lx,ly);}
  return true;
}
