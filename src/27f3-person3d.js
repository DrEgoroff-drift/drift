/* ══════════════ человек в объёме (M725) ══════════════
   Тот же человек, что на портрете mgrFace: ген читается тем же генератором в том же порядке
   (faceRnd 1: сложение, волосы, причёска, кожа, метки, глаза, импланты, цвет глаз, борода; 3 — габарит
   головы; 7 — челюсть, лоб, подбородок). Что у 2D-портрета не было (нос, губы, рост), — свой генератор
   faceRnd 5, он прежних не сдвигает.

   ПРАВИЛА ФАЙЛА:
   1. Метры. Человек стоит лицом к +z, пол — y=0, начало — под тазом. Голова ~0.23 м, плечи ~0.4 м.
   2. Части сетки: 0 — тело и ноги, 1 — голова с шеей (шарнир — основание шеи), 2 — левая рука,
      3 — правая (шарнир — плечо). Сцена двигает их матрицами, сетка строится один раз.
   3. Глубина лица — геометрией, а не краской: глазницы вдавлены, скулы и надбровье выступают,
      нос, губы, веки и уши — свои тела. Затенение глазниц и под челюстью вписано в краску вершин
      (как запечённая окклюзия): свет ламп даёт форму, краска — то, куда свет не доходит.
   4. Подробность по LOD: 0 — толпа (≈5 тыс. вершин), 1 — зал, 2 — портрет. Ген от LOD не зависит.
   5. Цвета сетки — линейные (r3Lin): шейдер считает свет в линейном, тон и гамма — в последнем проходе. */
/* ген: порядок вызовов — как в mgrFace, иначе в зале и на карточке разные люди */
function cpGene(m){
  const r=faceRnd(m,1),g={ai:!!m.ai,role:MGR_ROLES[m.role]||null};
  if(m.ai){g.build=1;g.loy=.6;g.lv=m.xp!=null?mgrLevel(m):1;g.hs=1;return g;}
  g.build=.7+r()*.7;
  g.hair=hex2rgb(FACE_HAIR[Math.floor(r()*FACE_HAIR.length)]);
  g.style=Math.floor(r()*7);
  g.skin=hex2rgb(FACE_SKIN[Math.floor(r()*FACE_SKIN.length)]);
  const n=Math.floor(r()*3);g.marks=[];
  for(let i=0;i<n;i++){const t=r();
    if(t<.4)g.marks.push({k:"scar",x:r()-.5,y:r()-.5,dx:r()-.5});
    else if(t<.75)g.marks.push({k:"tat"});
    else if(m.traits&&mgrHas(m,"pirate"))g.marks.push({k:"brand"});}
  g.eyeR=.8+r()*.5;
  g.impl=r()<.1?2:(r()<.14?1:0);
  g.eye=hex2rgb(FACE_EYE[Math.floor(r()*FACE_EYE.length)]);
  const b=r();g.beard=b<.14?1:b<.24?2:b<.34?3:0;
  const rg=faceRnd(m,3);rg();g.w=.23+rg()*.08;g.h=.3+rg()*.09;
  const rr=faceRnd(m,7);g.jaw=.55+rr()*.45;g.brow=.75+rr()*.3;g.chin=.5+rr()*.6;
  const r5=faceRnd(m,5);g.hs=.95+r5()*.1;g.nose=r5();g.lip=r5();g.ear=r5();g.coat=r5();g.shirt=r5();
  g.loy=clamp((m.loy==null?55:m.loy)/100,0,1);
  g.lv=m.xp!=null?mgrLevel(m):1;
  return g;
}
/* одежда: куртка роли приглушённая, у остальных — из ткацкой палитры зала */
const CP_CLOTH=[[78,84,96],[96,80,64],[64,82,74],[92,70,74],[70,74,90],[104,96,80],[58,62,70]];
function cpCloth(g,seed){
  const R=rng(hashi(seed>>>0,0xC10,3));
  const base=g.role?mixc(hex2rgb(g.role.col),[46,48,56],.42):CP_CLOTH[Math.floor(R()*CP_CLOTH.length)];
  return {jacket:base,shirt:[[196,190,178],[52,56,62],[150,60,52],[70,96,120]][Math.floor((g.shirt==null?R():g.shirt)*4)],
    pants:mixc([34,36,42],base,.15),boot:[38,30,26],belt:[44,34,28],metal:[150,152,158]};
}
/* позы: суставы в метрах (сторона +1 — левая рука человека, x>0). lean — наклон корпуса вперёд */
function cpPose(kind){
  const S=(a,b)=>[a,b];
  const P={
    stand:{pel:.95,lean:.02,knee:[.10,.50,.03],ank:[.11,.085,-.01],elb:S([.25,1.13,-.03],[-.25,1.13,-.03]),wr:S([.27,.88,.02],[-.27,.88,.02])},
    mug:{pel:.95,lean:.03,knee:[.10,.50,.03],ank:[.11,.085,-.01],elb:S([.25,1.13,-.03],[-.22,1.13,.10]),wr:S([.27,.88,.02],[-.11,1.24,.21]),hold:-1},
    bar:{pel:.95,lean:.10,knee:[.10,.50,.04],ank:[.11,.085,-.02],elb:S([.28,1.12,.14],[-.28,1.12,.14]),wr:S([.23,1.09,.36],[-.24,1.09,.35])},
    lean:{pel:.95,lean:-.07,knee:[.10,.50,.05],ank:[.13,.085,.06],elb:S([.25,1.06,-.08],[-.25,1.06,-.08]),wr:S([.19,.90,.07],[-.19,.90,.07])},
    stool0:{pel:.80,seat:1,lean:-.03,knee:[.13,.79,.40],ank:[.13,.36,.36],elb:S([.25,1.02,.10],[-.24,1.03,.12]),wr:S([.15,.86,.30],[-.13,.93,.36]),hold:-1},
    stool1:{pel:.80,seat:1,lean:-.13,knee:[.14,.79,.40],ank:[.15,.36,.36],elb:S([.31,1.11,-.34],[-.31,1.11,-.34]),wr:S([.37,1.13,-.58],[-.37,1.13,-.58])},
    stool2:{pel:.80,seat:1,lean:-.02,knee:[.13,.79,.40],ank:[.12,.36,.36],elb:S([.21,1.01,.12],[-.21,1.01,.12]),wr:S([-.09,1.10,.17],[.09,1.07,.19])},
    stool3:{pel:.80,seat:1,lean:.32,knee:[.15,.79,.40],ank:[.14,.36,.38],elb:S([.15,.92,.33],[-.15,.92,.33]),wr:S([.04,.90,.46],[-.04,.90,.46])},
    chair:{pel:.52,seat:1,lean:.02,knee:[.12,.50,.42],ank:[.13,.08,.46],elb:S([.22,.72,.10],[-.22,.72,.10]),wr:S([.15,.57,.31],[-.15,.57,.31])},
    table:{pel:.52,seat:1,lean:.12,knee:[.12,.50,.42],ank:[.13,.08,.46],elb:S([.23,.80,.24],[-.23,.80,.24]),wr:S([.13,.79,.45],[-.14,.79,.44])}
  };
  return P[kind]||P.stand;
}
/* матрица по базису: z — направление f, y — ближе к up; начало o */
function cpBasis(o,f,up){
  const nz=v=>{const l=Math.hypot(v[0],v[1],v[2])||1;return [v[0]/l,v[1]/l,v[2]/l];};
  const z=nz(f),x=nz([up[1]*z[2]-up[2]*z[1],up[2]*z[0]-up[0]*z[2],up[0]*z[1]-up[1]*z[0]]),y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]];
  return [x[0],x[1],x[2],0, y[0],y[1],y[2],0, z[0],z[1],z[2],0, o[0],o[1],o[2],1];
}
/* голова: точка поверхности по углам (θ — по кругу, 0 — лицо; φ — от низа к макушке) */
const CP_HLO=1.07,CP_HUP=.95;
/* взгляд портрета (подробность 2): голова повёрнута к объективу не до конца — глаза доводят взгляд до него */
const CP_GAZE=[-.3,.04];   /* подобрано по кадру: на −0,5 взгляд уже за объективом, на +0,6 — далеко мимо */   /* низ головы длиннее, свод ниже: глаза — посередине */
function cpHeadFn(g){
  const a=.072*(g.w/.27),b=.106*(g.h/.345),c=b*.9,jt=(1-g.jaw)*.32+.05,ch=g.chin,fh=g.brow;
  const ex=.44*a,G=(x,y,sx,sy)=>Math.exp(-(x*x)/(sx*sx)-(y*y)/(sy*sy)),sm=(e0,e1,x)=>{const t=clamp((x-e0)/(e1-e0),0,1);return t*t*(3-2*t);};
  const at=(th,ph)=>{
    const cp=Math.cos(ph),dx=cp*Math.sin(th),dy=Math.sin(ph),dz=cp*Math.cos(th),t=Math.max(-dy,0);
    /* свод ниже, лицо длиннее: глаза — на середине головы, а не на трети */
    let x=a*dx,y=b*dy*(dy<0?CP_HLO:CP_HUP),z=c*dz;
    if(dz<0)z*=1.12;
    /* челюсть держит ширину до угла и только потом сходит к подбородку: у эллипсоида низ — яйцо,
       и шея кажется растущей от ушей. Спереди — коробка челюсти, сзади — круглый затылок к шее */
    if(dy<0){const jw=(.92-.92*Math.pow(sm(.7,1.02,t),1.15))*(1-jt*.6),cx=cp+(Math.max(cp,jw)-cp)*sm(-.45,.35,dz);x=a*Math.sin(th)*cx;}
    else x*=1+.05*dy;
    if(dy<0&&dz<0)z*=1-.3*t*(-dz);
    const fr=r3Step(.1,.8,dz);
    z=z*(1-.1*fr);
    /* лицо — плоскость до подбородка: у эллипсоида низ лица уходит назад, и рот садится на подбородок */
    if(dz>0&&dy<.16){const pf=c*(.9-.1*sm(.5,.84,t)-.42*sm(.87,1,t)),w=Math.exp(-Math.pow(dx/.46,2))*sm(0,.35,dz)*sm(-.16,.06,-dy);if(pf>z)z+=(pf-z)*w;}
    /* подбородок вперёд, челюсть — угол */
    z+=c*.07*ch*Math.exp(-Math.pow((dy+.84)/.14,2))*Math.max(dz,0)*Math.max(dz,0);
    /* глазницы, надбровье, скулы, рот */
    let sock=0;for(const s of [-1,1])sock+=G(x-s*ex,y-.004,.021,.015);
    z-=.011*sock*fr;
    z+=.0045*fh*G(x*.6,y-.024-fh*.004,.05,.008)*fr;
    for(const s of [-1,1]){const k=G(x-s*.62*a,y+.018,.02,.016);z+=.004*k*fr;x+=s*.002*k;}
    z+=.006*G(x,y+.062,.03,.02)*fr;
    /* виски чуть впалые */
    x*=1-.035*G(Math.abs(dx)-.95,dy-.3,.12,.2);
    return [x,y,z,sock*fr];
  };
  return {at,a,b,c,ex};
}
/* поверхность лица в точке (x, y) — где сидят глаза, брови, губы: φ и θ из x, y, затем at */
function cpFaceAt(H,x,y){const ph=Math.asin(clamp(y/(H.b*(y<0?CP_HLO:CP_HUP)),-1,1)),cp=Math.max(.05,Math.cos(ph));
  const th=Math.asin(clamp(x/(H.a*cp),-1,1));return H.at(th,ph);}
/* голова целиком (в своей системе: центр головы, лицо к +z) */
function cpHead(K,g,lod,cl,seed){
  if(g.ai)return cpHeadAI(K,g,lod);
  const P=R3P,H=cpHeadFn(g),NU=lod>1?36:lod?24:14,NV=lod>1?28:lod?18:10;
  const skin=r3Lin(g.skin),hairC=r3Lin(g.hair);
  const Msk=K.mt(g.skin,.2,6,P.skin);
  const scars=g.marks.filter(q=>q.k==="scar"),tat=g.marks.some(q=>q.k==="tat"),brand=g.marks.some(q=>q.k==="brand");
  const red=r3Lin([196,90,80]),ink=r3Lin([40,90,110]),brd=r3Lin([150,48,36]),cool=r3Lin([90,80,110]);
  const dseg=(px,py,ax,ay,bx,by)=>{const vx=bx-ax,vy=by-ay,t=clamp(((px-ax)*vx+(py-ay)*vy)/(vx*vx+vy*vy||1),0,1);return Math.hypot(px-ax-vx*t,py-ay-vy*t);};
  /* кожа: краска вершин — окклюзия глазниц и под челюстью, румянец, метки */
  K.surf(NU,NV,(u,v)=>{
    const th=-Math.PI+u*TAU,ph=-Math.PI/2+v*Math.PI,p=H.at(th,ph),dy=Math.sin(ph),dz=Math.cos(ph)*Math.cos(th);
    let col=skin.slice();
    const ao=1-.42*clamp(p[3],0,1)-.3*r3Step(-.55,-.95,dy)*r3Step(-.3,.5,dz);
    const blush=Math.exp(-Math.pow((Math.abs(p[0])-.6*H.a)/.018,2)-Math.pow((p[1]+.026)/.018,2))*r3Step(0,.6,dz);
    col=r3Mix(col,r3Mix(col,red,.5),blush*.35);
    /* зоны тона, как у живописца: нос краснее, под глазами темнее и холоднее, лоб светлее */
    const fz=r3Step(0,.5,dz),nose=Math.exp(-Math.pow(p[0]/.016,2)-Math.pow((p[1]+.018)/.028,2))*fz;
    let und=0;for(const s of [-1,1])und+=Math.exp(-Math.pow((p[0]-s*H.ex)/.018,2)-Math.pow((p[1]+.013)/.008,2));und*=fz;
    col=r3Mix(col,r3Mix(col,red,.55),nose*.3);
    col=r3Sc(r3Mix(col,cool,und*.14),1-und*.1);
    col=r3Mix(col,r3Sc(col,1.08),r3Step(.2,.55,dy)*fz*.6);
    for(const q of scars){const sx=q.x*H.a*1.2,sy=-q.y*H.b,d=dseg(p[0],p[1],sx,sy,sx+q.dx*H.a*.5,sy-H.b*.25);
      if(dz>.2)col=r3Mix(col,r3Mix(skin,red,.6),Math.exp(-d*d/(.0018*.0018))*.85);}
    if(tat&&dz>.1){const d=Math.hypot(p[0]+.6*H.a,p[1]-.012);col=r3Mix(col,ink,(1-r3Step(.008,.014,d))*.5*(.6+.4*Math.sin(Math.atan2(p[1]-.012,p[0]+.6*H.a)*6)));}
    if(brand&&dz>.2){const bx=Math.abs(p[0]-.38*H.a),by=Math.abs(p[1]-.4*H.b);col=r3Mix(col,brd,(bx<.009&&by<.008)?.55:0);}
    return [[p[0],p[1],p[2]],r3Sc(col,ao)];
  },Msk,{wrap:1});
  /* уши */
  const er=.85+.3*g.ear;
  for(const s of [-1,1]){K.push([s*H.a*.95,-.012,-.012],s*.2,0,s*.1);
    K.ell([0,0,0],[.007*er,.027*er,.017*er],K.mt(mixc(g.skin,[150,70,60],.12),.25,5,P.skin),lod?6:4,lod?10:6);
    if(lod)K.ell([s*.003,0,.003],[.004,.018*er,.011*er],K.mt(mixc(g.skin,[60,30,25],.35),.1,4,P.skin),4,8);
    K.pop();}
  /* глаза: яблоко с радужкой и зрачком краской вершин, веки, ресничная кромка, брови */
  const er0=.0114*(.92+.16*(g.eyeR-.8)/.5),open=.15+.2*g.loy;
  const iris=r3Lin(g.eye),scl=r3Lin([212,202,192]),pink=r3Lin([206,150,140]),pup=r3Lin([8,8,10]);
  for(const s of [-1,1]){
    const sf=cpFaceAt(H,s*H.ex,.004),E=[s*H.ex,.004,sf[2]+.0035-er0];
    const machine=g.impl===2||(g.impl===1&&s>0);
    if(machine){
      K.ell(E,[er0,er0,er0],K.mt([24,28,34],.8,12,0),lod?8:5,lod?12:8);
      K.ell([E[0],E[1],E[2]+er0*.9],[er0*.5,er0*.5,er0*.18],K.mt([255,157,90],.4,8,0,3.2,true),5,10);
      if(lod){const rg=[];for(let i=0;i<=16;i++){const t=i/16*TAU;rg.push([E[0]+Math.cos(t)*er0*1.32,E[1]+Math.sin(t)*er0*1.32,E[2]+er0*.62]);}
        K.tube(rg,.0018,K.mt([150,154,160],.8,11,P.brushed),5);}
    }else{
      K.surf(lod>1?20:12,lod>1?14:8,(u,v)=>{const th=-Math.PI+u*TAU,ph=-Math.PI/2+v*Math.PI,d=[Math.cos(ph)*Math.sin(th),Math.sin(ph),Math.cos(ph)*Math.cos(th)];
        /* взгляд чуть внутрь — к собеседнику, а не в бесконечность */
        const lk=lod>1?[CP_GAZE[0]-s*.03,CP_GAZE[1],1]:[-s*.06,0,1],ll=Math.hypot(lk[0],lk[1],lk[2]),al=Math.acos(clamp((d[0]*lk[0]+d[1]*lk[1]+d[2]*lk[2])/ll,-1,1));
        let col=al<.2?pup:al<.42?r3Sc(iris,.75+.5*(al-.2)/.22*(al<.38?1:.4)):r3Mix(scl,pink,r3Step(1.,1.5,al));
        return [[E[0]+d[0]*er0,E[1]+d[1]*er0,E[2]+d[2]*er0],col];},K.mt([255,255,255],.85,13,P.eye),{wrap:1});
    }
    if(lod){
      /* веки: верхнее до open, нижнее — от низа; кромка верхнего темнее (ресницы) */
      const lr=er0*1.06,lash=r3Lin([26,20,18]),lid=r3Sc(skin,.9);
      K.surf(lod>1?14:8,lod>1?6:3,(u,v)=>{const th=(u-.5)*2.9,ph=open+v*(1.45-open),cp=Math.cos(ph);
        return [[E[0]+cp*Math.sin(th)*lr,E[1]+Math.sin(ph)*lr,E[2]+cp*Math.cos(th)*lr],v<.2?r3Mix(lid,lash,.75*(1-v/.2)):lid];},Msk);
      K.surf(lod>1?14:8,3,(u,v)=>{const th=(u-.5)*2.7,ph=-1.45+v*(1.45-.5),cp=Math.cos(ph);
        return [[E[0]+cp*Math.sin(th)*lr*.98,E[1]+Math.sin(ph)*lr*.98,E[2]+cp*Math.cos(th)*lr*.98],v>.8?r3Mix(lid,lash,.3):lid];},Msk);
    }
    /* бровь: чем ниже лояльность, тем ниже внутренний конец */
    const bi=.019-(1-g.loy)*.007,bo=.021+(1-g.loy)*.003,BP=[];
    for(let i=0;i<5;i++){const t=i/4,x=s*(H.ex-.017+t*.036),y=bi+(bo-bi)*t+.003*Math.sin(t*Math.PI),f=cpFaceAt(H,x,y);BP.push([x,y,f[2]+.0015]);}
    K.tube(BP,[.0032,.0042,.0042,.0036,.0022],K.mt(mixc(g.hair,[20,16,14],.35),.2,4,P.hair),lod?6:4);
  }
  /* нос: спинка от переносицы к кончику, крылья, кончик */
  const nl=.9+.25*g.nose,np=.85+.35*(1-g.nose);
  const ny=v=>.008-v*.044*nl,nb=v=>cpFaceAt(H,0,ny(v))[2]-.004;
  K.surf(lod>1?10:6,lod>1?10:5,(u,v)=>{const t=(u-.5)*Math.PI,w=.005+.009*Math.pow(v,1.5),p=(.004+.016*Math.pow(v,1.3))*np;
    return [[w*Math.sin(t),ny(v),nb(v)+p*Math.cos(t)]];},Msk);
  const tipZ=nb(1)+.0145*np;
  K.ell([0,ny(1)-.002,tipZ],[.0084,.0076,.0078],Msk,lod?6:4,lod?10:6);
  for(const s of [-1,1])K.ell([s*.0108,ny(1)+.0015,nb(1)+.0045],[.0066,.0054,.0068],Msk,lod?5:3,lod?8:6);
  if(lod)K.ell([0,ny(1)-.008,nb(1)+.009],[.012,.0028,.005],K.mt(mixc(g.skin,[40,20,16],.55),.1,3,0),3,8);   /* ноздри — тень под носом */
  /* губы: уголки вверх, когда человек доволен */
  const sm=(g.loy-.55)*1.5,my=-.061*(H.b/.106),lf=.85+.35*g.lip;
  const LM=K.mt(mixc(g.skin,[168,72,72],.28),.5,9,P.skin),UP=[],LO=[],ru=[],rl=[];
  for(let i=0;i<=8;i++){const t=i/8*2-1,x=t*.023,cu=t*t*(.003*sm);
    const fu=cpFaceAt(H,x,my+.0035),fl=cpFaceAt(H,x,my-.0045);
    UP.push([x,my+.0035-.0025*t*t+cu,fu[2]+.0012]);LO.push([x,my-.0045+.002*t*t+cu,fl[2]+.0010]);
    ru.push((.0031*lf)*Math.sqrt(Math.max(0,1-t*t))+.0007);rl.push((.0042*lf)*Math.sqrt(Math.max(0,1-t*t))+.0007);}
  K.tube(UP,ru,LM,lod>1?7:5);K.tube(LO,rl,LM,lod>1?7:5);
  if(lod){const MP=UP.map((p,i)=>[p[0],(p[1]+LO[i][1])/2,Math.min(p[2],LO[i][2])-.0012]);K.tube(MP,.0012,K.mt([40,18,16],.1,3,0),4);}
  /* волосы и голова сверху */
  cpHair(K,g,H,lod,cl,NU,NV,skin,hairC,seed);
  /* борода */
  if(g.beard)cpBeard(K,g,H,lod,NU,NV,my);
}
/* линия роста волос: на лбу высоко, у ушей ниже, на затылке — до шеи (в долях b, по sin φ) */
function cpHairline(th,style){
  const at=Math.abs(th);
  if(style===2){if(at<.8)return .3;if(at<1.3)return .3-(at-.8)*1.6;return -.55;}
  if(at<1.1)return .52-.2*at/1.1;
  if(at<1.75)return .32-.1*(at-1.1)/.65;
  return .22-.8*(at-1.75)/1.39;
}
function cpHair(K,g,H,lod,cl,NU,NV,skin,hairC,seed){
  const P=R3P,st=g.style,R=rng(hashi(seed>>>0,0xA17,9));
  if(st===4){   /* капюшон: ткань, открыт спереди, ниспадает на плечи */
    const hc=mixc(cl.jacket,[18,22,28],.55),M=K.mt(hc,.18,4,P.cloth);
    K.surf(NU,NV,(u,v)=>{const th=-Math.PI+u*TAU,ph=-Math.PI/2-.35+v*(Math.PI+.35),p=H.at(th,Math.max(ph,-Math.PI/2+.05)),dz=Math.cos(th);
      const k=1.32+.12*(1-r3Step(-.2,.6,Math.sin(ph))),drop=ph<-.9?(-.9-ph)*.1:0;
      return [[p[0]*k*(1+drop*2),p[1]*k-drop*.6,p[2]*k*(1+drop*.5)-(dz>0?0:drop*.3)]];},M,
      {wrap:1,keep:(u,v)=>{const th=-Math.PI+u*TAU,ph=-Math.PI/2-.35+v*(Math.PI+.35);return !(Math.abs(th)<1.05&&ph<.72&&ph>-1.3);}});
    /* подкладка в проёме — темнее, чтобы капюшон читался тканью с толщиной */
    K.surf(NU,4,(u,v)=>{const th=-1.05+u*2.1,ph=-1.3+v*2.02,p=H.at(th,ph);return [[p[0]*1.3,p[1]*1.3,p[2]*1.25]];},K.mt(mixc(hc,[0,0,0],.5),.1,3,P.cloth),
      {flip:1,keep:(u,v)=>u<.06||u>.94||v>.9});
    return;
  }
  if(st===5){   /* шлем-нейролинк: твёрдая оболочка, кольцо свечения цвета роли, модули по бокам */
    const M=K.mt([58,66,76],.75,11,P.brushed),rc=g.role?hex2rgb(g.role.col):[120,200,255];
    K.surf(NU,Math.round(NV*.7),(u,v)=>{const th=-Math.PI+u*TAU,ph=-.25+v*(Math.PI/2+.25),p=H.at(th,ph),k=1.13;return [[p[0]*k,p[1]*k+.004,p[2]*k]];},M,
      {wrap:1,keep:(u,v)=>{const th=-Math.PI+u*TAU,ph=-.25+v*(Math.PI/2+.25);return Math.sin(ph)>(Math.abs(th)<1.2?.42:Math.abs(th)<2?.0:-.25);}});
    const ring=[];for(let i=0;i<=40;i++){const th=-Math.PI+i/40*TAU,ph=Math.asin(Math.abs(th)<1.2?.46:.3),p=H.at(th,ph);ring.push([p[0]*1.15,p[1]*1.15+.004,p[2]*1.15]);}
    K.tube(ring,.0022,K.mt(rc,.3,8,0,2.6,true),5);
    for(const s of [-1,1])K.box([s*H.a*1.12,.01,-.01],[.008,.022,.03],K.mt([44,50,58],.7,10,P.brushed),.004);
    return;
  }
  /* шапка волос: та же голова, раздутая наружу. Ниже линии роста она уходит под кожу — край волос рисует сама встреча
     двух поверхностей (гладко, без ступенек сетки); у корней волосы редеют до кожи */
  const T=[.0035,.05,.09,.04,0,0,.03][st]*(.85+.3*R()),shaved=st===0;
  const HL=th=>{if(st!==2||!lod)return cpHairline(th,st);const at=Math.abs(th);return at<.8?.5:at<1.3?.5-(at-.8)*2.1:-.55;};
  const col=shaved?r3Mix(skin,hairC,.55):hairC;
  const M=K.mt(g.hair,shaved?.08:.22,shaved?3:7,shaved?0:P.hair);
  K.surf(NU,NV,(u,v)=>{const th=-Math.PI+u*TAU,ph=-Math.PI/2+v*Math.PI,p=H.at(th,ph),dy=Math.sin(ph),yh=HL(th);
    let k=1-.012+(.02+T*(st===2?(.7+.6*r3Step(.3,-.5,dy)):(.6+.4*dy)))*r3Step(yh-.03,yh+.2,dy);
    if(st===2&&!lod&&Math.abs(th)<.8&&dy<.55&&dy>.25)k+=.02;   /* чёлка каре издали; вблизи её кладут пряди */
    const n=hashi((u*977)|0,(v*631)|0,7)%1000/1000;
    const fd=.35+.65*r3Step(yh,yh+(st===0||st===6?.16:.08),dy);   /* у корней редеет: сквозь волосы видна кожа */
    return [[p[0]*k,p[1]*k+(st===2?.002:0),p[2]*k],r3Mix(r3Sc(skin,.85),r3Sc(col,.82+.3*n),fd)];},M,
    {wrap:1,keep:(u,v)=>{const th=-Math.PI+u*TAU,ph=-Math.PI/2+v*Math.PI;return Math.sin(ph)>HL(th)-.2;}});
  const HM=K.mt(g.hair,.22,7,P.hair);
  /* пряди поверх шапки: каре — от свода по черепу и вниз до скулы, чёлка — со свода на лоб; дреды — жгуты от свода по черепу
     и дальше вниз по спине. Корень — в шапке (лента выходит из неё с нуля), кончик сходит на нет */
  if(lod&&(st===2||st===3)){
    const bob=st===2,kAt=dy=>1+.008+T*(bob?(.7+.6*r3Step(.3,-.5,dy)):(.6+.4*dy));
    /* ниже линии роста прядь ложится на кожу (чёлка на лоб, дред на висок), выше — на шапку */
    const at=(th,ph,lay)=>{const p=H.at(th,ph),dy=Math.sin(ph),yh=HL(th),k=1.006+(kAt(dy)-1.006)*Math.max(.25,r3Step(yh-.2,yh+.15,dy))+lay;
      return [p[0]*k,p[1]*k+(bob?.002:0),p[2]*k];};
    const path=(th,ph0,ph1,lay,yEnd,fl,back)=>{const P=[];
      for(let i=0;i<=5;i++)P.push(at(th,ph0+(ph1-ph0)*i/5,lay));
      if(yEnd!=null){const E=P[5],o=[Math.sin(th),0,Math.cos(th)];
        for(let i=1;i<=3;i++){const f=i/3,d=fl*Math.sin(f*Math.PI*.8);P.push([E[0]+o[0]*d,E[1]+(yEnd-E[1])*f,E[2]+o[2]*d-back*f]);}}
      return P;};
    const nu=lod>1?6:4,nv=lod>1?14:8;
    const tone=()=>K.mt(r3Sc(g.hair,.84+.3*R()),.22,7,P.hair);
    if(bob){
      for(let lay=0;lay<(lod>1?2:1);lay++){const n=lod>1?44:26;
        for(let i=0;i<n;i++){const th=-Math.PI+(i+.5*lay+.35*R())/n*TAU,ph0=1.05+.18*R(),Mh=tone();
          if(Math.abs(th)<.8){   /* чёлка: со свода на лоб, кончики чуть в сторону пробора */
            const P=path(th,ph0,Math.asin(.27+.06*R()),.003+lay*.004,null,0,0);P[5][0]+=.006;cpClump(K,P,.0085,.003,Mh,nu,nv,0);}
          else{const yE=-.098+.035*r3Step(1.7,3,Math.abs(th))+.008*R();
            cpClump(K,path(th,ph0,-.05,.002+lay*.004,yE,-.004,0),.0085,.003,Mh,nu,nv,0);}}}
    }else{
      const n=lod>1?34:18;
      for(let i=0;i<n;i++){const s=i&1?1:-1,th=s*(1.15+(Math.PI-1.15)*((i>>1)+R()*.6)/(n>>1)),ph0=1.0+.3*R(),L=.11+.1*R();
        const P=path(th,ph0,-.08,.004+.003*(i%3),-.1-L,.012+.01*R(),.02);cpClump(K,P,.0068,.0068,tone(),nu,nv*2,.1);}
    }
  }
  if(st===1){   /* хвост: от затылка вниз, с перехватом */
    const tp=[[0,.02,-H.c*1.18],[0,-.03,-H.c*1.3],[0,-.09,-H.c*1.28],[0,-.15,-H.c*1.18],[0,-.2,-H.c*1.08]];
    K.tube(tp,[.022,.026,.02,.014,.006],HM,lod?8:5,true);
    K.tube([[0,.03,-H.c*1.14],[0,.016,-H.c*1.2]],.02,K.mt([30,30,34],.4,7,0),6);
  }
  if(st===3&&!lod){   /* дреды издали: несколько жгутов от затылка вниз */
    for(let i=0;i<8;i++){const th=Math.PI*(.5+.5*i/7)*(i&1?1:-1),p=H.at(th,-.05),L=.16+.1*R(),o=[p[0]*1.05,p[1]*1.05,p[2]*1.05];
      K.tube([o,[o[0]*1.1,o[1]-L*.5,o[2]*1.1],[o[0]*1.2,o[1]-L,o[2]*1.2]],[.009,.008,.006],HM,4,true);}
  }
}
/* прядь — лента по пути P (Катмулл — Ром); сечение — эллипс: w — полуширина вдоль черепа, t — полутолщина от него.
   У корня выходит из шапки с нуля, к кончику сходит на нет; bump — жгут с перехватами (дреды) */
function cpClump(K,P,w,t,M,nu,nv,bump){
  const n=P.length-1;
  const at=s=>{const f=Math.min(n-1e-6,Math.max(0,s)*n),i=Math.floor(f),a=f-i,p0=P[Math.max(0,i-1)],p1=P[i],p2=P[i+1],p3=P[Math.min(n,i+2)],a2=a*a,a3=a2*a;
    return [0,1,2].map(k=>.5*(2*p1[k]+(p2[k]-p0[k])*a+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*a2+(3*p1[k]-p0[k]-3*p2[k]+p3[k])*a3));};
  K.surf(nu,nv,(u,v)=>{const c=at(v),tg=K.nz(K.sub(at(v+.01),at(v-.01))),sd=K.nz(K.cr(tg,K.nz(c))),o=K.cr(sd,tg);
    const tp=Math.pow(Math.max(0,1-v),.55)*Math.min(1,v/.08+.15),bm=bump?1+bump*Math.sin(v*nv*1.6):1,ww=w*tp*bm,tt=t*Math.sqrt(tp)*bm,a=u*TAU,ca=Math.cos(a)*ww,sa=Math.sin(a)*tt;
    return [[c[0]+sd[0]*ca+o[0]*sa,c[1]+sd[1]*ca+o[1]*sa,c[2]+sd[2]*ca+o[2]*sa]];},M,{wrap:1});
}
function cpBeard(K,g,H,lod,NU,NV,my){
  const M=K.mt(g.hair,.25,5,R3P.hair),hc=r3Lin(g.hair);
  if(g.beard===3){   /* усы */
    const P=[];for(let i=0;i<=6;i++){const t=i/6*2-1,x=t*.026,y=my+.009-.006*t*t*t*t,f=cpFaceAt(H,x,y);P.push([x,y,f[2]+.004]);}
    K.tube(P,[.002,.0045,.0055,.006,.0055,.0045,.002],M,lod?6:4);return;
  }
  const full=g.beard===1;
  K.surf(NU,NV,(u,v)=>{const th=-Math.PI+u*TAU,ph=-Math.PI/2+v*Math.PI,p=H.at(th,ph),dy=Math.sin(ph);
    const k=1.012+(full?.07:.06)*r3Step(-.15,-.55,dy);
    return [[p[0]*k,p[1]*k-(full?.006*r3Step(-.6,-1,dy):0),p[2]*k],hc];},M,
    {wrap:1,keep:(u,v)=>{const th=-Math.PI+u*TAU,ph=-Math.PI/2+v*Math.PI,p=H.at(th,ph),dy=Math.sin(ph),dz=Math.cos(ph)*Math.cos(th);
      const mouth=Math.abs(p[0])<.026&&p[1]<my+.012&&p[1]>my-.01;
      if(mouth)return false;
      if(full)return dy<-.15&&dz>-.35&&p[1]<my+.016;
      return Math.abs(p[0])<.03&&p[1]<my-.006&&dz>.3;}});
}
/* голова ядра ИИ: гранёный корпус, швы и щель глаза своим светом цвета роли */
function cpHeadAI(K,g,lod){
  const rc=g.role?hex2rgb(g.role.col):[140,210,255],M=K.mt([66,74,86],.75,11,R3P.brushed),E=K.mt(rc,.3,8,0,2.8,true);
  const nl=6,nu=10,a=.075,b=.108,c=.095;
  const pt=(i,j)=>{const f=-Math.PI/2+i/nl*Math.PI,t=-Math.PI+j/nu*TAU,cf=Math.cos(f);let x=a*cf*Math.sin(t),y=b*Math.sin(f),z=c*cf*Math.cos(t);
    if(y<0)x*=1-.3*(-y/b);return [x,y,z];};
  for(let i=0;i<nl;i++)for(let j=0;j<nu;j++){const p00=pt(i,j),p01=pt(i,j+1),p10=pt(i+1,j),p11=pt(i+1,j+1);
    if(i>0)K.tri(p00,p11,p01,M);if(i<nl-1)K.tri(p00,p10,p11,M);}
  K.box([0,.01,c*.93],[.042,.0045,.006],E,.002);
  for(const t of [-.9,.9]){const P=[];for(let i=1;i<nl;i++){const p=pt(i,(t+Math.PI)/TAU*nu);P.push([p[0]*1.01,p[1]*1.01,p[2]*1.01]);}K.tube(P,.0015,E,4);}
  const P2=[];for(let j=0;j<=nu;j++){const p=pt(4,j);P2.push([p[0]*1.01,p[1]*1.01,p[2]*1.01]);}K.tube(P2,.0013,E,lod?5:4);
}
/* тело: корпус по кольцам, плечи, руки, ноги, обувь; поза — суставы cpPose */
/* кольца корпуса от паха до основания шеи: [v, y, полуширина, перед, спина]. Трапеция — плечи опускаются от шеи
   к краю (сброс по sin² в cpTorsoAt), иначе силуэт — бутылка с шариками плеч */
const CP_TORSO=[[0,-.07,.10,.07,.07],[.1,0,.168,.105,.11],[.3,.12,.150,.095,.10],[.5,.23,.165,.112,.10],[.66,.32,.185,.122,.105],
  [.78,.40,.2,.112,.10],[.86,.458,.205,.094,.097],[.93,.497,.162,.074,.088],[1,.528,.066,.058,.064]];
/* точка корпуса: θ по кругу (0 — грудь), v снизу вверх; k — раздуть наружу (жилет, пальто поверх) */
function cpTorsoAt(th,v,wB,TL,k){
  /* ряды таблицы — сплайном Катмулла — Рома: косинус между рядами давал площадки на каждом ряду, и кромка выреза шла ступеньками */
  const T=CP_TORSO,L=T.length-1;let i=0;while(i<L-1&&T[i+1][0]<v)i++;
  const t=clamp((v-T[i][0])/(T[i+1][0]-T[i][0]),0,1),t2=t*t,t3=t2*t,P0=T[Math.max(0,i-1)],P2=T[i+1],P3=T[Math.min(L,i+2)];
  const R=T[i].map((a,q)=>.5*(2*a+(P2[q]-P0[q])*t+(2*P0[q]-5*a+4*P2[q]-P3[q])*t2+(3*a-P0[q]-3*P2[q]+P3[q])*t3));
  const sn=Math.sin(th),cs=Math.cos(th),n=2.15+.55*r3Step(.3,.42,v)*(1-r3Step(.8,.9,v)),e=2/n;k=k||1;
  const x=R[2]*wB*Math.sign(sn)*Math.pow(Math.abs(sn),e)*k,z=(cs>0?R[3]:R[4])*(.92+.08*wB)*Math.sign(cs)*Math.pow(Math.abs(cs),e)*k;
  const drop=.032*Math.sin(Math.PI*clamp((v-.8)/.2,0,1))*sn*sn;
  return [x,R[1]*TL-drop+(k-1)*.02,z];
}
/* лента по корпусу (лямка, ремень): путь в (θ, v), сечение — плоский эллипс, лежит на поверхности по её нормали */
function cpBand(K,TA,pts,k,w,t,M,n){
  const S=[];for(let i=0;i<=n;i++){const f=i/n*(pts.length-1),j=Math.min(pts.length-2,Math.floor(f)),a=f-j;
    S.push([pts[j][0]+(pts[j+1][0]-pts[j][0])*a,pts[j][1]+(pts[j+1][1]-pts[j][1])*a]);}
  const nrm=(th,v)=>{const p=TA(th,v,k),a=K.sub(TA(th+.01,v,k),TA(th-.01,v,k)),b=K.sub(TA(th,Math.min(1,v+.01),k),TA(th,Math.max(0,v-.01),k));
    let q=K.nz(K.cr(a,b));if(q[0]*p[0]+q[2]*p[2]<0)q=[-q[0],-q[1],-q[2]];return q;};
  const P=S.map(s=>TA(s[0],s[1],k)),N=S.map(s=>nrm(s[0],s[1]));
  K.surf(6,n,(u,v)=>{const i=Math.round(v*n),tg=K.nz(K.sub(P[Math.min(n,i+1)],P[Math.max(0,i-1)])),sd=K.nz(K.cr(tg,N[i])),a=u*TAU,ca=Math.cos(a)*w,sa=(Math.sin(a)+1)*t;
    return [[P[i][0]+sd[0]*ca+N[i][0]*sa,P[i][1]+sd[1]*ca+N[i][1]*sa,P[i][2]+sd[2]*ca+N[i][2]*sa]];},M,{wrap:1});
}
/* одежда роли — читается раньше лица: командир — жилет с подсумками и наплечник; смотритель — комбинезон
   с лямками, светоотражающими полосами и поясом инструмента; фактор — пальто с лацканами и шарф;
   исследователь — светлый китель со стойкой, карман с ручками и светящийся пропуск */
/* краска — холоднее и глуше, чем кажется: под тёплыми лампами коричневое становится деревом, серо-синее — сукном */
const CP_KIT={cmd:{jac:[50,56,64],mix:.1,coll:1},keep:{jac:[62,78,70],mix:.16,coll:1},fact:{jac:[86,40,46],mix:.1,coll:0},
  sci:{jac:[176,182,190],mix:.12,coll:2}};
function cpBody(m,lod,poseK){
  const g=cpGene(m),cl=cpCloth(g,m.seed),P=R3P,K=r3Kit(),J=cpPose(poseK);
  const wB=.86+(g.build-.7)*.36,hs=g.hs,pel=[0,J.pel,0],ln=J.lean;
  const ai=g.ai,rc=g.role?hex2rgb(g.role.col):[150,160,170],rk=!ai&&m.role&&CP_KIT[m.role]?m.role:"",KT=rk?CP_KIT[rk]:null;
  if(KT)cl.jacket=mixc(KT.jac,rc,KT.mix);
  /* сукно матовое: широкий блик на рукаве делает из ткани лакированное дерево */
  const jac=ai?[44,50,60]:cl.jacket,Mj=K.mt(jac,ai?.7:rk==="sci"?.14:.08,ai?11:3,ai?P.brushed:P.cloth);
  const Mp=K.mt(cl.pants,.07,3,P.cloth),Mb=K.mt(cl.boot,.45,8,P.leather),Mbelt=K.mt(cl.belt,.4,8,P.leather);
  const Mm=K.mt(cl.metal,.8,12,P.brushed),Msk=K.mt(ai?[66,74,86]:mixc(g.skin,[70,36,28],.12),ai?.7:.16,ai?11:4,ai?P.brushed:P.skin);
  const NU=lod>1?36:lod?20:12,NV=lod>1?50:lod?18:10,TN=lod>1?12:lod?9:6;
  if(lod>1)K.q=1.6;
  /* корпус: кольца в системе таза, наклон — вокруг x; швы и кокетка — краской вершин */
  const TL=hs,shirt=r3Lin(cl.shirt),jl=r3Lin(jac),pl=r3Lin(cl.pants),bl=r3Lin(cl.belt),dk=r3Sc(jl,.68),hv=r3Lin([222,212,120]);
  const TA=(th,v,k)=>cpTorsoAt(th,v,wB,TL,k);
  /* вырез куртки — геометрией: ряд начинается у кромки выреза, рубашка — своей вставкой чуть глубже */
  const vh=v=>!ai&&v>.8?2*Math.asin(Math.min(.95,v-.8+.02)):0;
  K.push(pel,0,ln,0);
  K.part=0;
  K.surf(NU,NV,(u,v)=>{const h=vh(v),th=h+u*(TAU-2*h),sn=Math.sin(th);
    let col=jl;
    if(v<.13)col=pl;else if(v<.19)col=bl;
    else{
      if(Math.abs(sn)>.975)col=dk;   /* боковой шов */
      if(Math.abs(v-.74)<.01&&rk!=="sci")col=dk;   /* кокетка: шов поперёк груди и лопаток */
      else if(v>.74&&(rk==="cmd"||rk==="keep"))col=r3Sc(jl,.84);
      if(rk==="keep"&&(Math.abs(v-.47)<.022||Math.abs(v-.57)<.022))col=hv;   /* светоотражающие полосы */
    }
    const ao=1-.25*(Math.abs(sn)>.85&&v>.55&&v<.86?1:0)-.15*r3Step(.25,.0,v);
    return [TA(th,v),r3Sc(col,ao)];},Mj);
  if(!ai){
    const sc=rk==="fact"?[226,220,206]:cl.shirt,Msh=K.mt(sc,.2,4,P.cloth),ed=[[],[]];
    K.surf(8,lod?6:3,(u,w)=>{const v=.79+w*.205,h=vh(v)*1.08;return [TA((u*2-1)*h,v,.968)];},Msh);
    /* кант выреза — по тем же рядам, что и куртка: иначе хорда ряда и кант расходятся ступенькой */
    for(let j=Math.ceil(.8*NV);j<=NV;j++){const v=j/NV,h=vh(v);ed[0].push(TA(h,v,1.004));ed[1].push(TA(-h,v,1.004));}
    for(const e of ed)K.tube(e,.0042,K.mt(mixc(jac,[0,0,0],.16),.2,5,P.cloth),4);
  }
  /* воротник, молния, карманы, снаряжение роли, пряжка, нашивка */
  const zf=v=>TA(0,v)[2],yf=v=>TA(0,v)[1];
  if(!ai){
    if(rk!=="fact"){   /* стойка вокруг основания шеи, спереди ниже; у командира — сомкнутая, у исследователя — высокая */
      const ch=KT&&KT.coll===2?.064:.046,gap=rk==="cmd"?.12:.43,Mc=K.mt(mixc(jac,[0,0,0],.14),.2,5,P.cloth),eg=[];
      const cp=(th,v)=>{const b=TA(th,.985),r=1.2-.08*v,fr=Math.max(0,Math.cos(th));return [b[0]*r,b[1]+v*ch-fr*.016+.004,b[2]*r];};
      K.surf(lod>1?28:14,3,(u,v)=>[cp(gap+u*(TAU-2*gap),v)],Mc);
      if(lod){for(let i=0;i<=20;i++)eg.push(cp(gap+i/20*(TAU-2*gap),1));K.tube(eg,.0042,Mc,4);}
    }
    if(lod&&rk!=="fact"){const zp=[];for(let i=0;i<=8;i++){const v=.2+i/8*.6;zp.push([0,yf(v),zf(v)+.003]);}K.tube(zp,.0028,Mm,4);
      if(rk!=="cmd")for(const s of [-1,1])K.box([s*.075*wB,.33*TL,zf(.66)+.004],[.032,.026,.006],K.mt(mixc(jac,[0,0,0],.18),.2,5,P.cloth),.004);}
    if(rk==="cmd"){   /* жилет поверх куртки: проймы открыты, подсумки на поясе, рация на груди, лямки через плечи */
      const Mv=K.mt(mixc([44,48,42],rc,.1),.25,6,P.cloth),Mpo=K.mt(mixc([36,40,34],rc,.08),.2,5,P.cloth);
      K.surf(NU,Math.max(6,Math.round(NV*.6)),(u,w)=>[TA(u*TAU,.22+w*.6,1.07)],Mv,
        {wrap:1,keep:(u,w)=>!(.22+w*.6>.66&&Math.abs(Math.sin(u*TAU))>.78)&&!(Math.abs(Math.sin(u*TAU/2))<.07&&.22+w*.6>.5)});
      if(lod){
        for(const x of [-.09,0,.09]){const p=TA(x*3.2,.3,1.07);K.box([p[0],p[1],p[2]+.016],[.034,.036,.016],Mpo,.006);
          K.box([p[0],p[1]+.03,p[2]+.031],[.035,.009,.004],Mpo,.003);}
        const rp=TA(-.42,.62,1.07);K.box([rp[0],rp[1],rp[2]+.015],[.028,.046,.014],Mpo,.006);
        K.tube([[rp[0]-.012,rp[1]+.04,rp[2]+.014],[rp[0]-.012,rp[1]+.1,rp[2]+.012]],.0025,K.mt([20,20,22],.3,6,0),4);
        K.box([rp[0],rp[1]-.012,rp[2]+.03],[.008,.004,.002],K.mt(rc,.3,8,0,2.2,true),.001);
        for(const s of [-1,1])cpBand(K,TA,[[s*.45,.56],[s*.75,.86],[s*1.57,.955],[s*2.4,.86],[s*2.7,.56]],1.07,.012,.0028,Mpo,lod>1?24:12);
      }
    }else if(rk==="keep"){   /* комбинезон: лямки, пояс инструмента с подсумками и ключом */
      const Ms=K.mt(mixc(jac,[0,0,0],.3),.2,5,P.cloth),Mt=K.mt([58,44,32],.4,8,P.leather);
      for(const s of [-1,1])cpBand(K,TA,[[s*.38,.5],[s*.7,.86],[s*1.57,.955],[s*2.4,.86],[s*2.75,.5]],1.02,.011,.0025,Ms,lod>1?24:lod?12:6);
      const br=[];for(let i=0;i<=24;i++)br.push(TA(i/24*TAU,.165,1.08));K.tube(br,.017,Mt,5);
      if(lod){for(const th of [1.25,-1.25,2.4]){const p=TA(th,.12,1.12);K.push(p,th,0,0);K.box([0,-.02,.012],[.036,.04,.018],Mt,.006);K.pop();}
        const wp=TA(-1.6,.12,1.14);K.tube([[wp[0]-.01,wp[1]-.09,wp[2]],[wp[0]-.01,wp[1]+.04,wp[2]]],.0065,Mm,5);
        K.box([wp[0]-.01,wp[1]+.05,wp[2]],[.016,.012,.005],Mm,.003);}
    }else if(rk==="fact"){   /* пальто: полы до бедра, лацканы, шарф */
      const yb=J.seat?-.05:-.36,gp=.26,Ml=K.mt(mixc(jac,[0,0,0],.2),.25,6,P.cloth),sc=mixc(rc,[120,96,86],.55),Msc=K.mt(sc,.12,3,P.cloth);
      K.surf(NU,lod?6:3,(u,w)=>{const th=gp+u*(TAU-2*gp),t=TA(th,.12,1.05),fl=1+(J.seat?.32:.2)*w;return [[t[0]*fl,t[1]+(yb-t[1])*w,t[2]*fl]];},Mj);
      for(const s of [-1,1])K.surf(lod?6:3,lod?8:4,(u,w)=>{const v=.96-.34*w,th=s*(.05+(.1+.36*(1-w))*u);return [TA(th,v,1.03+.012*(1-u))];},Ml);
      /* шарф: два витка разной высоты (нижний шире, спереди провисает), конец — плоский, лежит на груди */
      /* витки — вокруг шеи, а не по плечам: ось шеи над верхом корпуса; шов кольца — на спине */
      const nc=TA(0,1)[1];
      for(const [rx,dy,r] of [[.086,0,.021],[.075,.03,.018]]){const nr=[];
        for(let i=0;i<=24;i++){const th=Math.PI+i/24*TAU,sg=Math.max(0,Math.cos(th));nr.push([Math.sin(th)*rx*(.94+.06*wB),nc-.014+dy-.024*sg*sg,-.004+Math.cos(th)*rx+.008*sg]);}
        K.tube(nr,r,Msc,lod?8:5);}
      const e0=TA(.3,.93,1.1);K.push([e0[0],e0[1],e0[2]+.012],0,.12,0,1);
      K.surf(4,lod?8:4,(u,w)=>{const x=(u-.5)*.07*(1-.15*w),y=-w*.2,z=.012*Math.sin(u*Math.PI)+.006*Math.sin(w*5);return [[x+.006*w,y,z]];},Msc);K.pop();
      if(lod)for(let i=0;i<3;i++){const p=TA(-.14,.32+i*.11,1.05);K.ell([p[0],p[1],p[2]+.006],[.008,.008,.004],Mm,4,8);}
    }else if(rk==="sci"){   /* китель: карман с ручками, светящийся пропуск */
      const pk=TA(.42,.6,1.01);K.box([pk[0],pk[1],pk[2]+.006],[.036,.032,.006],K.mt(mixc(jac,[0,0,0],.08),.3,5,P.cloth),.004);
      if(lod)for(const [dx,c] of [[-.012,[30,60,140]],[.006,[20,20,22]]]){K.tube([[pk[0]+dx,pk[1]+.01,pk[2]+.01],[pk[0]+dx,pk[1]+.062,pk[2]+.008]],.0035,K.mt(c,.6,10,0),5);}
      const id=TA(-.45,.6,1.01);K.box([id[0],id[1],id[2]+.006],[.022,.03,.003],K.mt([230,232,236],.4,8,0),.003);
      K.box([id[0],id[1]+.014,id[2]+.0095],[.017,.006,.001],K.mt(rc,.3,8,0,2.6,true),.001);
    }
  }else{
    for(const s of [-1,1]){const sp=[];for(let i=0;i<=8;i++){const v=.2+i/8*.62;sp.push([s*TA(Math.PI/2,v)[0]*.97,yf(v),.0]);}K.tube(sp,.003,K.mt(rc,.3,8,0,2.4,true),4);}
  }
  if(rk!=="fact"&&rk!=="keep")K.box([0,.16*TL,zf(.16)+.008],[.022,.016,.006],Mm,.003);   /* пряжка */
  {const bp=TA(.55,.78,rk==="cmd"?1.08:1.01);K.box([bp[0],bp[1],bp[2]+.004],[.014,.009,.003],K.mt(rc,.3,8,0,g.lv>=6?2.2:.6,true),.002);}   /* нашивка роли; с 6-го уровня светится */
  const shW=.205*wB,shY=.458*TL;
  K.pop();
  /* плечи и шея в мире позы */
  const rot=(p)=>{const c=Math.cos(ln),s=Math.sin(ln);return [pel[0]+p[0],pel[1]+p[1]*c-p[2]*s,pel[2]+p[1]*s+p[2]*c];};
  const sh=[rot([shW-.02,shY,-.005]),rot([-(shW-.02),shY,-.005])],neck=rot([0,.53*TL,0]);
  /* руки: плечо → локоть → запястье, кисть по предплечью */
  const Mcuff=K.mt(mixc(jac,[0,0,0],.25),.2,4,P.cloth),arms=[];
  for(let k=0;k<2;k++){const s=k?-1:1;K.part=2+k;
    const S=sh[k],E=J.elb[k],W=J.wr[k];
    K.ell([S[0],S[1]-.006,S[2]],[.057*wB,.05,.063],Mj,lod?7:5,lod?12:8);   /* дельта — чуть шире руки, не мяч */
    if(rk==="cmd"&&k===0){K.push([S[0]+.006,S[1]+.014,S[2]],0,0,-.4);K.ell([0,0,0],[.06*wB,.02,.062],K.mt(mixc([44,48,42],rc,.1),.35,7,P.cloth),lod?6:4,lod?12:8);K.pop();}   /* наплечник */
    const mid1=[(S[0]+E[0])/2+s*.008,(S[1]+E[1])/2,(S[2]+E[2])/2],mid2=[(E[0]+W[0])/2,(E[1]+W[1])/2,(E[2]+W[2])/2];
    K.tube([S,mid1,E,mid2,W],[.05*wB,.047*wB,.043,.041,.035],Mj,TN);
    /* нашивки уровня на левом плече: сколько — по уровню */
    if(k===0&&!ai&&g.role){const nn=Math.min(4,Math.floor(g.lv/2));
      for(let i=0;i<nn;i++){const t=.3+i*.09,p=[S[0]+(E[0]-S[0])*t+.048*wB,S[1]+(E[1]-S[1])*t,S[2]+(E[2]-S[2])*t];K.box(p,[.003,.005,.014],K.mt(rc,.3,8,0,1.8,true),.001);}}
    const fw=[W[0]-E[0],W[1]-E[1],W[2]-E[2]],fl=Math.hypot(...fw)||1,f=[fw[0]/fl,fw[1]/fl,fw[2]/fl];
    K.tube([[W[0]-f[0]*.03,W[1]-f[1]*.03,W[2]-f[2]*.03],[W[0]+f[0]*.004,W[1]+f[1]*.004,W[2]+f[2]*.004]],.037,Mcuff,TN);
    /* кисть: ладонь, пальцы согнуты, большой палец внутрь */
    K.pushM(cpBasis(W,f,[s*.3,1,0]));
    K.ell([0,0,.045],[.038,.017,.048],Msk,lod?6:4,lod?10:6);
    K.ell([0,-.006,.092],[.036,.015,.03],Msk,lod?5:3,lod?8:6);
    K.ell([-s*.03,.004,.04],[.011,.011,.03],Msk,4,6);
    K.pop();
    arms.push({S,E,W,f});
  }
  /* ноги: таз → колено → лодыжка, ботинок по стопе */
  K.part=0;
  for(let k=0;k<2;k++){const s=k?-1:1,Hh=[s*.095*wB,J.pel-.03,0],Kn=[s*J.knee[0],J.knee[1],J.knee[2]],A=[s*J.ank[0],J.ank[1],J.ank[2]];
    const m1=[(Hh[0]+Kn[0])/2,(Hh[1]+Kn[1])/2+.01,(Hh[2]+Kn[2])/2],m2=[(Kn[0]+A[0])/2,(Kn[1]+A[1])/2,(Kn[2]+A[2])/2-.012];
    K.tube([Hh,m1,Kn,m2,[A[0],A[1]+.08,A[2]]],[.088*wB,.078*wB,.06,.062,.052],Mp,TN);
    K.tube([[A[0],A[1]+.13,A[2]],[A[0],A[1],A[2]]],[.054,.05],Mb,TN);
    K.push([A[0],A[1]-.035,A[2]+.06],s*.12,0,0);
    K.box([0,0,0],[.047,.04,.115],Mb,.03);
    K.box([0,-.036,.004],[.05,.009,.122],K.mt([22,20,20],.2,4,0),.006);
    K.pop();
  }
  /* голова: в своей системе, шарнир — основание шеи */
  K.part=1;
  const hc=[neck[0],neck[1]+.155*hs,neck[2]+.022+Math.sin(ln)*.04];
  K.tube([[neck[0],neck[1]-.02,neck[2]-.005],[neck[0],neck[1]+.05,neck[2]+.004],[hc[0],hc[1]-.06,hc[2]-.012]],[.058,.054,.05],ai?Msk:K.mt(mixc(g.skin,[40,24,20],.2),.3,5,P.skin),TN);   /* шея темнее лица: под челюстью тень */
  K.push(hc,0,-ln*.6,0,hs);
  cpHead(K,g,lod,cl,m.seed);
  K.pop();
  K.part=0;
  const M=K.pack();
  const H=cpHeadFn(g.ai?{w:.27,h:.345,jaw:.8,chin:.8,brow:.9}:g);
  M.at={neck,head:hc,top:[hc[0],hc[1]+H.b*hs+.03,hc[2]],sh,arms,pel,hand:arms.map(a=>[a.W[0]+a.f[0]*.07,a.W[1]+a.f[1]*.07,a.W[2]+a.f[2]*.07]),hold:J.hold||0,seat:!!J.seat};
  M.g=g;
  return M;
}
/* кэш сеток людей: зерно, поза, подробность, лояльность (рот и брови) и уровень (нашивки) */
const CP_MESH=new Map();
function cpMesh(m,pose,lod){
  const key=(m.seed>>>0)+"|"+pose+"|"+lod+"|"+Math.round((m.loy==null?55:m.loy)/12)+"|"+(m.xp!=null?mgrLevel(m):1)+"|"+(m.ai?1:0)+"|"+(m.role||"");
  let M=CP_MESH.get(key);
  if(M){CP_MESH.delete(key);CP_MESH.set(key,M);return M;}
  M=cpBody(m,lod,pose);
  if(CP_MESH.size>=48){const k0=CP_MESH.keys().next().value;r3Drop(CP_MESH.get(k0));CP_MESH.delete(k0);}
  CP_MESH.set(key,M);return M;
}
