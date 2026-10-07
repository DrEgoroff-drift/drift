/* ══════════════ ориентиры пояса на видеокарте (GPU, ступень 2) ══════════════
   Силуэт ориентира (2D-художника больше нет, 24b — только расстановка) фигурами набора: многоугольники —
   веером от центра с жёсткими внутренними рёбрами, линии — повёрнутыми
   прямоугольниками (концы срезаны, как у 2D), дуга кольца — лентой четырёхугольников,
   огни — дисками. Устья здесь нет: оно камень и рисуется сеткой с глубиной (24be, beltMaw).
   Ничего не печётся и не грузится, не мылится вблизи: фигуры считаются в пикселях.
   Свет (G8): силуэт — тело. Каждая фигура тонируется по своему месту в силуэте, как точка
   шара под светилом: нормаль (u, √(1−u²)) против направления на звезду в осях камеры
   (BPOI_L, ставит 24ba). Звезда за спиной — ориентир освещён в лицо, впереди — горит
   только край к ней, остальное в тени и в холодном отсвете. Огни, окна и кристаллы
   друзы светят сами — их свет не трогает (флаг e) */
const BPOI_L={x:0,y:0,z:1,r:255,g:255,b:255};
function bpoiLit(SH,px,py,S){
  const L=BPOI_L,R=S*1.1;
  for(let i=0;i<SH.length;i++){const t=SH[i];if(t.e)continue;
    let cx,cy;
    if(t[0]===5){cx=(t[1]+t[3]+t[5])/3;cy=(t[2]+t[4]+t[6])/3;}
    else if(t[0]===2){cx=(t[1]+t[3])/2;cy=(t[2]+t[4])/2;}
    else{cx=t[1];cy=t[2];}
    let ux=(cx-px)/R,uy=(cy-py)/R;const l=Math.hypot(ux,uy);if(l>.98){ux*=.98/l;uy*=.98/l;}
    const lam=Math.max(0,ux*L.x+uy*L.y+Math.sqrt(Math.max(0,1-ux*ux-uy*uy))*L.z),f=.6+1.0*lam;
    t[7]=Math.min(255,t[7]*f+L.r*.1*lam)|0;t[8]=Math.min(255,t[8]*f+L.g*.1*lam)|0;t[9]=Math.min(255,t[9]*f+L.b*.1*lam)|0;
  }
}
function beltPoiGpu(pass,q,px,py,sc,fog){
  const S=q.size*sc;
  if(S<3)return;
  const r=rng(q.seed),ang=q.ph+G.t*q.spin,SH=[];
  const dim=k=>{const v=Math.round(k*fog*255);return [v,Math.round(v*1.03),Math.round(v*1.12),1];};
  /* своя матрица: поворот и сдвиг, как ctx.translate/rotate у 2D */
  let M=[Math.cos(ang),Math.sin(ang),px,py,ang];
  const at=(tx,ty,rot)=>{const [c,s,x,y,a]=M;return [Math.cos(a+rot),Math.sin(a+rot),x+c*tx-s*ty,y+s*tx+c*ty,a+rot];};
  const P=(u,v)=>[M[2]+M[0]*u-M[1]*v,M[3]+M[1]*u+M[0]*v];
  const col=(C,a)=>[C[0],C[1],C[2],a==null?C[3]:a];
  /* многоугольник веером от (cu,cv): звёздный относительно центра — как у всех здесь */
  const poly=(pts,C,cu,cv)=>{const o=P(cu||0,cv||0),n=pts.length;
    for(let i=0;i<n;i++){const a=P(pts[i][0],pts[i][1]),b=P(pts[(i+1)%n][0],pts[(i+1)%n][1]);
      SH.push([5,o[0],o[1],a[0],a[1],b[0],b[1],C[0],C[1],C[2],C[3],5]);}};
  const ring=(pts,lw,C)=>{const n=pts.length;
    for(let i=0;i<n;i++){const a=P(pts[i][0],pts[i][1]),b=P(pts[(i+1)%n][0],pts[(i+1)%n][1]);
      SH.push([2,a[0],a[1],b[0],b[1],lw/2,0,C[0],C[1],C[2],C[3]]);}};
  const line=(u0,v0,u1,v1,lw,C)=>{const a=P(u0,v0),b=P(u1,v1),l=Math.hypot(b[0]-a[0],b[1]-a[1])/2;
    if(l>.01)SH.push([4,(a[0]+b[0])/2,(a[1]+b[1])/2,l,lw/2,Math.atan2(b[1]-a[1],b[0]-a[0]),0,C[0],C[1],C[2],C[3]]);};
  const rect=(u,v,w,h,C)=>{const c=P(u+w/2,v+h/2);SH.push([4,c[0],c[1],w/2,h/2,M[4],0,C[0],C[1],C[2],C[3]]);};
  const disc=(u,v,rr,C)=>{const c=P(u,v);SH.push([1,c[0],c[1],rr,0,0,0,C[0],C[1],C[2],C[3]]);};
  const ell=(u,v,ra,rb)=>{const o=[];for(let i=0;i<28;i++){const a=i/28*TAU;o.push([u+Math.cos(a)*ra,v+Math.sin(a)*rb]);}return o;};
  if(q.k==="wreck"){
    const L=S*1.9,bw=S*.34,M0=M;
    for(const part of [-1,1]){
      M=at(part*L*.28,0,part*.16);
      const Q=[[-L*.28,-bw*.5],[L*.26,-bw*.42],[L*.3,bw*.3],[-L*.3,bw*.44]];
      poly(Q,dim(.34));ring(Q,1,dim(.13));
      for(let i=0;i<7;i++){
        const on=((q.seed>>>(i%13))&7)===0;
        rect(-L*.22+i*L*.075,-bw*.18,Math.max(1,S*.022),Math.max(1,S*.016),on?[255,206,140,+(.85*fog).toFixed(2)]:dim(.10));
        if(on)SH[SH.length-1].e=1;
      }
      M=M0;
    }
    for(let i=0;i<4;i++){const xx=(i-1.5)*S*.1;line(xx,-bw*.34,xx,bw*.3,Math.max(1,S*.02),dim(.2));}
  }else if(q.k==="rig"){
    line(-S,0,S,0,Math.max(1,S*.035),dim(.3));
    for(let i=-3;i<=3;i++)line(i*S*.3,-S*.2,i*S*.3+S*.12,S*.2,Math.max(1,S*.018),dim(.3));
    for(let i=0;i<3;i++){
      const bx=(i-1)*S*.55,br=S*(.16+((i*29)%4)/4*.1),E=ell(bx,-S*.28,br,br*.8);
      poly(E,dim(.28),bx,-S*.28);ring(E,1,dim(.12));
    }
    const M0=M;M=at(S*.75,S*.1,G.t*.06);
    for(let i=0;i<3;i++){const a=i/3*TAU,o=P(0,0),b=P(Math.cos(a)*S*.24,Math.sin(a)*S*.24),c=P(Math.cos(a+.5)*S*.16,Math.sin(a+.5)*S*.16),C=dim(.4);
      SH.push([5,o[0],o[1],b[0],b[1],c[0],c[1],C[0],C[1],C[2],1,0]);}
    M=M0;
    const bl=Math.pow(Math.max(0,Math.sin(G.t*.05+q.ph)),8);
    if(bl>.03){disc(-S*.9,-S*.1,Math.max(1.4,S*.03),[120,230,255,+(.9*bl*fog).toFixed(2)]);SH[SH.length-1].e=1;}
  }else if(q.k==="ring"){
    /* дуга: лента четырёхугольников, общие стороны жёсткие; концы срезаны, как butt */
    const R=S*.82,hw=Math.max(1.5,S*.11)/2,a0=.5,a1=.5+Math.PI*1.35,N=48,C=dim(.3);
    for(let i=0;i<N;i++){const t0=a0+(a1-a0)*i/N,t1=a0+(a1-a0)*(i+1)/N;
      gpuQuad(SH,P(Math.cos(t0)*(R+hw),Math.sin(t0)*(R+hw)),P(Math.cos(t1)*(R+hw),Math.sin(t1)*(R+hw)),
        P(Math.cos(t1)*(R-hw),Math.sin(t1)*(R-hw)),P(Math.cos(t0)*(R-hw),Math.sin(t0)*(R-hw)),C,(i<N-1?2:0)|(i>0?8:0));}
    for(let i=0;i<6;i++){const a=.6+i*.42;line(Math.cos(a)*S*.24,Math.sin(a)*S*.24,Math.cos(a)*S*.78,Math.sin(a)*S*.78,Math.max(1,S*.03),dim(.16));}
    disc(0,0,S*.2,dim(.36));
    for(let i=0;i<5;i++){const a=.5-i*.12,rr=S*(.82+((i*31)%4)/4*.12);
      disc(Math.cos(a)*rr,Math.sin(a)*rr,Math.max(1,S*(.02+((i*17)%3)/3*.03)),dim(.22));}
  }else if(q.k==="drusa"){
    /* призма — градиент от устья к острию: ломтики поперёк оси, у каждого свой тон */
    const n=6+Math.floor(r()*5),K=8,e0=SH.length;
    for(let i=0;i<n;i++){
      const a=i/n*TAU+r()*.3,len=S*(.5+r()*.6),w=S*(.07+r()*.08);
      const tw=.55+.45*Math.pow(Math.max(0,Math.sin(G.t*.02+i*1.7)),4);
      const ca=Math.cos(a),sa=Math.sin(a),s0=w*Math.cos(.4),h0=w*Math.sin(.4),a1=.75*tw*fog,a0=.5*fog;
      const gc=s=>{const t=s/len;return [lerp(120,220,t)|0,lerp(190,245,t)|0,lerp(220,255,t)|0,lerp(a0,a1,t)];};
      const pt=(s,h)=>P(ca*s-sa*h,sa*s+ca*h),hw=s=>h0*(len-s)/Math.max(len-s0,1e-6);
      for(let k=0;k<K;k++){const s1=s0+(len-s0)*k/K,s2=s0+(len-s0)*(k+1)/K,C=gc((s1+s2)/2);
        if(k<K-1)gpuQuad(SH,pt(s1,-hw(s1)),pt(s2,-hw(s2)),pt(s2,hw(s2)),pt(s1,hw(s1)),C,2|(k>0?8:0));
        else{const A=pt(s1,-hw(s1)),B=pt(len,0),Cc=pt(s1,hw(s1));SH.push([5,A[0],A[1],B[0],B[1],Cc[0],Cc[1],C[0],C[1],C[2],C[3],4]);}}
    }
    for(let i=e0;i<SH.length;i++)SH[i].e=1;
  }
  bpoiLit(SH,px,py,S);
  gpuShapes(pass,SH);
}
