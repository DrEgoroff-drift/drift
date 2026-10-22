/* ══ кольцо станции рельса телом (M806 · кадр системы) ══
   Остановка рельса в системе (18f) — тело под звездой, как станция 17c2g и мачта 11apa: сетка набора
   h3dKit, свет и сторона звезды — от движка, огни — точками сцены, подпись — оверлеем (domLabel).
   Одна сетка на род: кольцо в начале координат, вестибюль (или платформа полустанка) — сбоку, на +y
   в осях полосы; кладётся курсом полосы. Сверху, без крена — как станция, у которой стоит.
   Кольцо — порог: тяжёлый тор, под ним тёмный пояс, четыре захвата наискось от оси, двенадцать фонарей
   цвета хозяина полосы. Вестибюль — блок с напуском крыши и световыми окнами, причальный рукав к кольцу;
   у метро на крыше красный огонь. Полустанок — дощатая платформа, скамья и фонарь на столбе: фонарь
   светит на доски по-настоящему (gpuLight), больше вокруг ничего не горит.
   Ниже порога тела (17c2e) остаются огни: глиссада бежит внутрь, вихрь в кольце — свет, а не вещь */
const RRING_R=44,RRING_KEEP=6,RRING_VY=70;
const RRING_STEEL=[112,120,132],RRING_DARK=[34,38,46],RRING_WALL=[66,62,58],RRING_ROOF=[96,92,86];
const RRING_WOOD=[112,94,72],RRING_WARM=[255,214,160];

/* сетка рода: "st" — вестибюль, "metro" — вестибюль с огнём метро, "halt" — полустанок */
function railRingMesh(kind){
  return bodyMesh("rr:"+kind,RRING_KEEP,()=>{
    const K=h3dKit(),C=K.C,L=[],P=[],SP=.5,steel=C(RRING_STEEL),dark=C(RRING_DARK),vy=RRING_VY;
    const circ=(r,z,n)=>{const Q=[];for(let i=0;i<=n;i++){const t=i/n*TAU;Q.push([Math.cos(t)*r,Math.sin(t)*r,z]);}return Q;};
    /* обод: тор, снаружи и ниже — тонкий тёмный пояс: обод читается толщиной, а не линией */
    K.tube(circ(RRING_R,0,48),2.8,steel,3,.35,10);
    K.tube(circ(RRING_R+3,-1.4,48),.9,dark,3,.3,6);
    /* захваты: башмаки поперёк обода наискось от оси полосы (на оси — вход и рукав вестибюля) */
    for(let i=0;i<4;i++){const t=(i+.5)/4*TAU,c=Math.cos(t),s=Math.sin(t);
      K.prism([[-4.2,-2.6],[4.2,-2.6],[4.2,2.6],[-4.2,2.6]].map(([u,v])=>[(RRING_R+u)*c-v*s,(RRING_R+u)*s+v*c]),-2,4.4,C(mixc(RRING_STEEL,RRING_DARK,.45)),3,.4);}
    /* фонари полосы по верху обода: колпак, огонь — цвета хозяина полосы (railRingLights) */
    for(let i=0;i<12;i++){const t=i/12*TAU,x=Math.cos(t)*RRING_R,y=Math.sin(t)*RRING_R;
      K.box(x-1,x+1,y-1,y+1,2.2,3.4,.2,dark,3,.4);L.push({x,y,lane:1,i,r:.9});}
    if(kind==="halt"){
      /* платформа: три доски с щелями, кромка к полосе темнее, скамья, столб и фонарь */
      const wood=C(RRING_WOOD),wd=C(mixc(RRING_WOOD,[0,0,0],.3));
      for(let k=0;k<3;k++)K.box(-22,22,vy-4+k*2.75,vy-1.6+k*2.75,0,1.4,.2,k===1?wd:wood,3,SP);
      K.box(-22.5,22.5,vy-4.6,vy-4,-.4,1.6,.1,dark,3,.4);
      /* мостки к ободу: две доски на поперечинах — платформа не висит отдельно от кольца */
      for(const x of [-2.2,.4])K.box(x,x+1.8,RRING_R+2.4,vy-4.6,.2,1,.1,wood,3,SP);
      for(let y=RRING_R+5;y<vy-5;y+=5)K.box(-3,3,y,y+.8,-.4,.2,.1,wd,3,SP);
      K.box(-6,4,vy+.4,vy+2.4,1.4,2.6,.2,C([96,82,64]),3,SP);
      for(const x of [-5,3])K.box(x-.4,x+.4,vy+.6,vy+2.2,1.4,1.4,0,wd,3,SP);
      K.tube([[13.6,vy-2,1.4],[13.6,vy-2,12]],.5,C([60,62,68]),3,SP,6);
      K.box(12.4,14.8,vy-3.2,vy-.8,12,13,.2,dark,3,.4);
      L.push({x:13.6,y:vy-2,c:RRING_WARM,r:1.3});
      P.push([13.6,vy-2,30,[1,.82,.58],.9]);
    }else{
      /* вестибюль: блок, крыша с напуском (её кромка и тень дают объём), четыре световых окна поверх */
      /* цоколь темнее и шире: блок стоит, а не лежит картонкой */
      K.box(-17.5,17.5,vy-10.5,vy+10.5,-1.5,0,.2,dark,3,.4);
      K.box(-16,16,vy-9,vy+9,0,5,.4,C(RRING_WALL),3,SP);
      K.box(-17,17,vy-10,vy+10,5,6.2,.3,C(RRING_ROOF),3,SP);
      /* конёк вдоль крыши, две вентиляции у торца; окна — световые, полосой у края, с тёплым ореолом */
      K.box(-15,15,vy+1.2,vy+2.6,6.2,7,.2,C(mixc(RRING_ROOF,[0,0,0],.25)),3,SP);
      for(const x of [-13,-8.5])K.box(x-1.6,x+1.6,vy+4.4,vy+7.6,6.2,8.2,.3,C(mixc(RRING_ROOF,RRING_STEEL,.5)),3,SP);
      for(let i=0;i<4;i++){const x0=-12+i*7,x1=x0+4;
        K.face([[x0,vy-6,6.25],[x1,vy-6,6.25],[x1,vy-3,6.25],[x0,vy-3,6.25]],[(x0+x1)/2,vy-4.5,3],C(RRING_WARM),3,-.1,1.3);
        L.push({x:(x0+x1)/2,y:vy-4.5,c:RRING_WARM,r:.5,g:1});}
      /* причальный рукав к кольцу и обжимка на конце */
      K.tube([[0,vy-10,2.6],[0,RRING_R+5,2.6]],2.2,C(mixc(RRING_STEEL,[0,0,0],.25)),3,SP,8);
      K.box(-3.4,3.4,RRING_R+3.6,RRING_R+5.4,-.6,5.6,.3,dark,3,.4);
      /* антенна с огнём; у метро — красный огонь на крыше */
      K.tube([[12,vy+6,6.2],[12,vy+6,12]],.35,steel,3,SP,5);
      L.push({x:12,y:vy+6,c:[255,90,70],r:.8,k:.8,ph:.7});
      if(kind==="metro"){K.box(-15,-10,vy+4,vy+8,6.2,7.2,.2,C([150,40,36]),3,SP);L.push({x:-12.5,y:vy+6,c:[255,70,56],r:1.4});}
      P.push([0,vy,26,[1,.84,.62],.5]);
    }
    const m=h3dPack(K.V,96,{st:[[22,.3],[-22,.3]],ne:2.2,kh:.5,gl:.4});
    m.L=L;m.P=P;return m;});
}
/* тело кольца на экран: x,y — центр кольца, s — мерка кадра системы, свет — от звезды к точке мира */
function railRingBody(pass,R,x,y,s,col,ts,fast){
  if(!pass||!bodyGpu())return false;
  const T=bodyT0();if(!T)return false;
  const m=railRingMesh(R.S.halt?"halt":R.S.metro?"metro":"st"),a=Math.atan2(R.uy,R.ux),[lx,ly]=sysLightDir(R.x,R.y);
  const c=Math.cos(a),n=Math.sin(a),TP=(u,v)=>[x+(u*c-v*n)*s,y+(u*n+v*c)*s];
  for(const p of m.P){const [px,py]=TP(p[0],p[1]);gpuLight(px,py,px,py,p[3][0],p[3][1],p[3][2],p[2]*s,p[4]);}
  if(!h3dRun(m,T,x,y,a,s,0,lx,ly,null,0))return false;
  railRingLights(pass,m,TP,s,col,ts,fast);
  return true;
}
/* огни сетки: фонари полосы бегут по ободу (медленно всегда, быстро — когда поезд вот-вот), прочие горят
   или мигают своим k */
function railRingLights(pass,m,TP,s,col,ts,fast){
  const D=[],A=[],amp=fast>1?.4:.15,sp=fast>1?1.5:.25;
  for(const q of m.L){
    if(q.k&&Math.sin(G.t/60*q.k*TAU+(q.ph||0)*TAU)<=.2)continue;
    const [px,py]=TP(q.x,q.y),r=Math.max(.7,q.r*s);let cc=q.c,on=.9;
    if(q.lane){cc=col;on=.55+amp*Math.max(0,Math.cos((ts*sp-q.i/12)*TAU));}
    D.push([1,px,py,r,0,0,0,cc[0],cc[1],cc[2],on]);
    A.push([1,px,py,r*.5,0,0,r*2.2,cc[0],cc[1],cc[2],.4*on]);
  }
  gpuShapes(pass,D);gpuShapes(pass,A,{blend:"add"});
}
