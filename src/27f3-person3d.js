/* ══════════════ человек в объёме (M725) ══════════════
   Тот же человек, что на портрете mgrFace: ген читается тем же генератором в том же порядке
   (faceRnd 1: сложение, волосы, причёска, кожа, метки, глаза, импланты, цвет глаз, борода; 3 — габарит
   головы; 7 — челюсть, лоб, подбородок). Что у 2D-портрета не было (нос, губы, рост), — свой генератор
   faceRnd 5, он прежних не сдвигает.

   ПРАВИЛА ФАЙЛА:
   1. Метры. Человек стоит лицом к +z, пол — y=0, начало — под тазом. Голова ~0.23 м, плечи ~0.4 м.
   2. Части сетки: 0 — тело и ноги, 1 — голова с шеей (шарнир — основание шеи), 2 — левая рука,
      3 — правая (шарнир — плечо); лицо (M729, CPR) — 4 верхние веки, 5 нижние, 6/7 левый и правый глаз,
      8/9 брови, 10 верхняя губа (кожа до носа), 11 нижняя с подбородком и нижними зубами, 12 верхние зубы.
      Сцена двигает их матрицами (cpRig), сетка строится один раз и от настроения не зависит: моргание,
      взгляд и эмоция — матрицы. Голова и лицо — в 27f3a.
   3. Глубина лица — геометрией, а не краской: глазницы вдавлены, скулы и надбровье выступают, веки, нос
      и губы вылеплены кожей. Затенение глазниц и под челюстью вписано в краску вершин (как запечённая
      окклюзия): свет ламп даёт форму, краска — то, куда свет не доходит.
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
    /* места зала (M810): локоть на стойке; руки на поясе; ладонь на раме окна */
    elbow:{pel:.95,lean:.09,knee:[.11,.50,.05],ank:[.13,.085,-.02],elb:S([.24,1.04,.24],[-.25,1.12,-.02]),wr:S([.10,1.07,.44],[-.27,.87,.04])},
    hips:{pel:.95,lean:-.02,knee:[.12,.50,.03],ank:[.14,.085,-.01],elb:S([.37,1.07,-.10],[-.37,1.07,-.10]),wr:S([.2,.97,-.03],[-.2,.97,-.03])},
    frame:{pel:.95,lean:.05,knee:[.10,.50,.05],ank:[.12,.085,-.03],elb:S([.28,1.27,.20],[-.25,1.12,-.02]),wr:S([.25,1.47,.44],[-.27,.87,.03])},
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
  if(m.jac)cl.jacket=m.jac;   /* свой цвет куртки (пилот зала — цвет людей «Сцены») */
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
  const rig=cpHead(K,g,lod,cl,m.seed);
  K.pop();
  K.part=0;
  const M=K.pack();
  const H=cpHeadFn(g.ai?{w:.27,h:.345,jaw:.8,chin:.8,brow:.9}:g);
  M.at={neck,head:hc,top:[hc[0],hc[1]+H.b*hs+.03,hc[2]],sh,arms,pel,hand:arms.map(a=>[a.W[0]+a.f[0]*.07,a.W[1]+a.f[1]*.07,a.W[2]+a.f[2]*.07]),hold:J.hold||0,seat:!!J.seat};
  M.at.hp=[hc,-ln*.6,hs];M.rig=rig;
  M.g=g;
  return M;
}
/* кэш сеток людей: зерно, поза, подробность, уровень (нашивки), роль и наряд. Настроение в сетку не входит — его
   играет cpRig */
const CP_MESH=new Map();
function cpMesh(m,pose,lod){
  const key=(m.seed>>>0)+"|"+pose+"|"+lod+"|"+(m.xp!=null?mgrLevel(m):1)+"|"+(m.ai?1:0)+"|"+(m.role||"")+"|"+(m.out||"")+"|"+(m.age==null?"":m.age);
  let M=CP_MESH.get(key);
  if(M){CP_MESH.delete(key);CP_MESH.set(key,M);return M;}
  M=cpBody(m,lod,pose);
  if(CP_MESH.size>=48){const k0=CP_MESH.keys().next().value;r3Drop(CP_MESH.get(k0));CP_MESH.delete(k0);}
  CP_MESH.set(key,M);return M;
}
