/* ══════════════ лицо и голова в объёме (M725, M729) ══════════════
   Голова человека из 27f3: основа черепа (cpHeadFn), лепка лица поверх неё (cpSculpt — веки, нос, губы, складки),
   кожа одной густой сеткой, уши, глаза, зубы, волосы прядями, борода; голова ядра ИИ; оснастка лица (cpRig).

   ПРАВИЛА ФАЙЛА:
   1. Система головы: центр головы, лицо к +z, метры; глаз — (±ex, ey), рот — my. cpBody ставит её K.push'ем.
   2. Лицо — одна кожа, а не детали поверх: веки, брови и губы — места кожи с весом второй части (27f2: смесь двух
      матриц), моргание и мимика тянут кожу, а не двигают тела. Части — CPR (правило 2 файла 27f3).
   3. Всё, что сидит на коже (ресницы, зубы, усы, борода), берёт высоту из той же лепки (cpSkinZ, cpSkin) —
      иначе при правке лица они отстают от кожи.
   4. Лепка — гладкая: никаких жёстких max/коробок без спада к нулю; острый край в поле высоты — шов на лице
      под скользящим светом (нос в коробке, плато века у виска, ребро челюсти — уже были).
   5. Сетка кожи гуще на лице (cpWarpTh/Ph): клетка у глаз и губ на портрете ~1,3 мм. */
/* голова: точка поверхности по углам (θ — по кругу, 0 — лицо; φ — от низа к макушке) */
const CP_HLO=1.07,CP_HUP=1.04;   /* свод — от глаз столько же, сколько до подбородка: лоб не обрублен шапкой волос */
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
    /* гладкий максимум: острый max(cp, jw) давал ребро по кругу на уровне рта — контровой свет резал по нему полосу */
    if(dy<0){const jw=(.92-.92*Math.pow(sm(.7,1.02,t),1.15))*(1-jt*.6),h=clamp(.5+.5*(cp-jw)/.08,0,1),mx=jw+(cp-jw)*h+.08*h*(1-h);
      const cx=cp+(mx-cp)*sm(-.45,.35,dz);x=a*Math.sin(th)*cx;}
    else x*=1+.05*dy;
    if(dy<0&&dz<0)z*=1-.3*t*(-dz);
    const fr=r3Step(.1,.8,dz);
    z=z*(1-.1*fr);
    /* лицо — плоскость до подбородка: у эллипсоида низ лица уходит назад, и рот садится на подбородок */
    if(dz>0&&dy<.16){const pf=c*(.9-.1*sm(.5,.84,t)-.42*sm(.87,1,t)),w=Math.exp(-Math.pow(dx/.37,2))*sm(0,.35,dz)*sm(-.16,.06,-dy);if(pf>z)z+=(pf-z)*w;}
    /* подбородок вперёд, челюсть — угол */
    z+=c*.07*ch*Math.exp(-Math.pow((dy+.84)/.14,2))*Math.max(dz,0)*Math.max(dz,0);
    /* глазницы, надбровье, скулы, рот */
    let sock=0;for(const s of [-1,1])sock+=G(x-s*ex,y-.004,.021,.015);
    z-=.011*sock*fr;
    z+=.0045*fh*G(x*.6,y-.024-fh*.004,.05,.008)*fr;
    /* скула — бугор под наружным углом глаза, под ней впадина щеки к углу челюсти; лоб — два мягких бугра */
    for(const s of [-1,1]){const k=G(x-s*.6*a,y+.015,.019,.011),h=G(x-s*.56*a,y+.047,.016,.014);
      z+=(.0046*k-.0026*h+.0018*G(x-s*.32*a,y-.05,.022,.02))*fr;x+=s*(.0035*k-.0016*h);}
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
/* части лица (правило 2): 12 — верхние зубы (стоят с головой: губа, поднимаясь в улыбке, их открывает) */
const CPR={lidU:4,lidL:5,eye:6,brow:8,lipU:10,lipL:11,teeth:12};
/* сетка головы гуще на лице: u → угол по плотности dens (лицо — 1, затылок и темя реже). Клетка у глаз и губ на
   портрете ~1,3 мм — разрез глаза и щель рта сеткой не ступенятся */
const CP_WARP={};
function cpWarp(key,lo,hi,dens){
  let W=CP_WARP[key];if(W)return W;
  const N=1024,c=new Float64Array(N+1);for(let i=1;i<=N;i++)c[i]=c[i-1]+dens(lo+(hi-lo)*(i-.5)/N);
  W=u=>{const t=clamp(u,0,1)*c[N];let k=0,h=N;while(h-k>1){const m=(k+h)>>1;if(c[m]<=t)k=m;else h=m;}
    return lo+(hi-lo)*(k+(t-c[k])/((c[k+1]-c[k])||1))/N;};
  return CP_WARP[key]=W;
}
function cpWarpTh(){return cpWarp("th",-Math.PI,Math.PI,a=>.2+.8*r3Step(1.3,.85,Math.abs(a)));}
function cpWarpPh(){return cpWarp("ph",-Math.PI/2,Math.PI/2,a=>.22+.78*r3Step(-1.3,-1.02,a)*r3Step(.62,.36,a));}
/* точки лица из гена — в системе головы: глаз (центр яблока, радиус, разрез), нос, рот */
function cpFaceRig(H,g){
  const ex=H.ex,ey=.004,er=.0114*(.92+.16*(g.eyeR-.8)/.5),Ez=cpFaceAt(H,ex,ey)[2]+.0035-er;
  const nl=.9+.25*g.nose,yt=.008-.044*nl;
  return {ex,ey,er,Ez,rs:er+.0011,aw:er*1.3,hu:.0054+.0016*(g.eyeR-.8),hl:.0039,
    np:.85+.35*(1-g.nose),yn:ey+.005,yt,ysn:yt-.0085,aX:.0112+.0025*(1-g.nose),
    lf:.85+.35*g.lip,my:-.061*(H.b/.106),mw:.0212+.004*g.lip,age:g.age||0,fem:g.fem||0};
}
/* кожа лица поверх основы (cpHeadFn): веки — оболочки над яблоками с разрезом, нос, губы со щелью внутрь, складки.
   На входе точка основы (x, y, z) и fr — насколько она спереди; на выходе z, маски краски и вторая часть с весом
   (кожа тянется за мимикой: веко — до складки, бровь — лоб, нижняя губа — подбородок) */
function cpSculpt(F,x,y,z,fr){
  const o={z,brow:0,lip:0,slit:0,lash:0,wet:0,ap:0,crease:0,lid:0,nos:0,alar:0,fold:0,car:0,sk:null};
  if(fr<=0)return o;
  const G=(a,b)=>Math.exp(-a*a-b*b),sm=(a,b,k)=>{const h=clamp(.5+.5*(a-b)/k,0,1);return b+(a-b)*h+k*h*(1-h);};
  let zz=z,wb=0,pb=0;
  const put=(p,w)=>{if(w>wb){wb=w;pb=p;}};
  /* ── глаз своей стороны: tn — по разрезу (внутренний угол −1, наружный +1) ── */
  const s=x>=0?1:-1,dx=x-s*F.ex,dy=y-F.ey,tn=s*dx/F.aw,r2=dx*dx+dy*dy,q=Math.max(0,1-tn*tn);
  const yC=-.0008+.0012*tn,yU=yC+F.hu*Math.pow(q,.65)*(1-.12*tn),yL=yC-F.hl*Math.pow(q,.85)*(1+.1*tn),yCr=yU+.0036+.0016*q;
  if(r2<.0011){
    /* веко — оболочка над яблоком, мягко сливается с глазницей. Только над самим яблоком: за его краем оболочки нет
       (иначе плато на высоте центра глаза вылезало стеной сбоку, у виска) */
    if(r2<F.rs*F.rs)zz=sm(zz,F.Ez+Math.sqrt(F.rs*F.rs-r2),.0024);
    zz+=.0009*G((dy-yCr-.0024)/.0022,0)*Math.min(1,q*2)+.0005*(1+1.5*F.age)*G((dy-yL+.0034)/.0022,dx/.012);   /* нависание над складкой, мешок */
    o.crease=G((dy-yCr)/.0011,0)*Math.min(1,q*2);
    const inn=Math.min(yU-dy,dy-yL),lat=r3Step(1.06,.96,Math.abs(tn));
    if(inn>-.0006&&lat>0){const pl=r3Step(-.0005,.0012,inn)*lat;zz+=(F.Ez+F.er*.2-zz)*pl;o.ap=pl;
      if(dy>(yU+yL)/2)o.lash=pl*(1-r3Step(.0003,.0014,yU-dy));else o.wet=pl*(1-r3Step(.0003,.0014,dy-yL));
      o.car=pl*r3Step(-.6,-.95,tn);}
    /* вес век: верхнее — от кромки до складки, нижнее — до щеки; бровь — выше складки (на шве у обоих ноль) */
    const la=r3Step(1.45,1.05,Math.abs(tn));
    if(dy>=(yU+yL)/2){const w=la*r3Step(yCr+.003,yCr-.0004,dy);put(CPR.lidU,w);o.lid=w*r3Step(yU-.0004,yU+.001,dy);}
    else put(CPR.lidL,la*r3Step(yL-.0078,yL-.0006,dy));
  }
  /* ── бровь: густая у переносья, хвост тоньше и выше дуги ── */
  {const t=(tn+1.15)/2.55,tc=clamp(t,0,1),yB=.0128+.0036*Math.sin(Math.PI*tc*.92)-.0012*tc-.0012*F.fem,hb=.0034*(1-.58*tc)*(1-.25*F.fem);
    const lat=r3Step(-1.32,-1.08,tn)*r3Step(1.52,1.3,tn);
    o.brow=lat*Math.exp(-Math.pow(Math.abs(dy-yB)/hb,3));
    zz+=.0007*o.brow;
    put(CPR.brow+(s>0?0:1),r3Step(yCr+.003,yB-.0015,dy)*r3Step(yB+.034,yB+.007,dy)*r3Step(-1.9,-1.3,tn)*r3Step(2.2,1.6,tn));}
  /* ── нос: спинка от переносицы к кончику, кончик, крылья, ноздри снизу, бороздка вокруг крыла ── */
  {const tN=(F.yn-y)/(F.yn-F.yt);
    if(tN>-.5&&y>F.ysn-.016&&Math.abs(x)<.04){
      const tc=clamp(tN,0,1),Pn=.003+.0165*F.np*Math.pow(tc,1.3),w=.0056+.0052*Math.pow(tc,1.5),Pt=.0046+.0165*F.np;
      let n=Pn*Math.exp(-Math.pow(x/w,2))*r3Step(-.45,.05,tN)*(y>=F.yt?1:r3Step(F.yt-.0065,F.yt,y));
      /* слияние — по норме (a³+b³)^⅓: где обоих нет, нет и прибавки (гладкий максимум с k давал ступень на краю) */
      const un=(a,b)=>Math.cbrt(a*a*a+b*b*b);
      n=un(n,Pt*G(x/.0086,(y-F.yt+.0008)/.0074));
      for(const ss of [-1,1])n=un(n,Pt*.52*G((x-ss*F.aX)/.0062,(y-F.yt-.0006)/.0058));
      let ns=0,al=0;
      for(const ss of [-1,1]){ns+=G((x-ss*.0054)/.0034,(y-F.yt+.0062)/.0019);
        const d=Math.hypot((x-ss*F.aX)/.0068,(y-F.yt-.0006)/.0062);al+=Math.exp(-Math.pow((d-1)/.17,2))*r3Step(F.yt+.008,F.yt,y);}
      n-=.0024*ns+.0006*al;o.nos=Math.min(1,ns*1.3);o.alar=Math.min(1,al);
      zz+=n;}}
  /* ── рот: бугор мышцы, верхняя губа с луком Купидона, нижняя полнее, щель уходит внутрь (раскрываясь, она и есть
     тёмный рот), ямки в уголках, носогубная складка, фильтр, подбородок ── */
  {const md=y-F.my,ax=Math.abs(x),tw=x/F.mw,qm=Math.max(0,1-tw*tw);
    zz+=.0034*G(x/.03,(md-.002)/.02);
    const yS=.0007*qm,hU=.0058*F.lf*Math.pow(qm,.55)+.0011*G((ax-.0058)/.003,0)-.0006*G(x/.0028,0),hL=.0084*F.lf*Math.pow(qm,.5);
    const lq=Math.pow(qm,.4);
    if(md>=yS){const u=(md-yS)/Math.max(hU,1e-4);
      zz+=lq*(.0036*F.lf*(u<.7?Math.pow(Math.sin(u/.7*Math.PI/2),.7):Math.exp(-Math.pow((u-.7)/1.1,2)))+.0005*G((u-1)/.1,0));
      o.lip=lq*r3Step(1.07,.93,u);}
    else{const v=(yS-md)/Math.max(hL,1e-4);
      zz+=lq*(.0052*F.lf*(v<.45?Math.pow(Math.sin(v/.45*Math.PI/2),.6):Math.exp(-Math.pow((v-.45)/.65,2))))-.0014*G((v-1.5)/.3,x/.02);
      o.lip=lq*r3Step(1.09,.92,v);}
    const dS=md-yS,pq=Math.pow(qm,.35)*r3Step(1.03,.9,Math.abs(tw));
    /* щель внутрь; темнота — по глубине: стенка губы изнутри видна, когда рот открыт, и она — уже рот, не губа */
    const pl=.0075*Math.exp(-Math.pow(dS/.001,2))*pq;zz-=pl;o.slit=Math.pow(clamp(pl/.0045,0,1),.75);
    zz-=.0011*G((ax-F.mw)/.0028,md/.0035);
    /* фильтр: два валика от носа к луку */
    const ph=r3Step(yS+hU*.9,yS+hU*1.3,md)*r3Step(F.ysn-F.my,F.ysn-F.my-.003,md);
    zz+=ph*(.0006*G((ax-.0052)/.0017,0)-.0003*G(x/.0024,0));
    /* носогубная: от крыла к уголку рта, щека снаружи полнее */
    {const A=[F.aX+.006,F.yt+.001-F.my],B=[F.mw+.0075,-.004],vx=B[0]-A[0],vy=B[1]-A[1],t=clamp(((ax-A[0])*vx+(md-A[1])*vy)/(vx*vx+vy*vy),0,1);
      const cx=ax-A[0]-vx*t,cy=md-A[1]-vy*t,d=Math.hypot(cx,cy),side=r3Step(.0012,-.0012,(cx*vy-cy*vx)/Math.hypot(vx,vy)),fe=Math.sin(Math.PI*t);
      zz+=(.0012+.0012*F.age)*side*Math.exp(-Math.pow(d/.005,2))*fe;o.fold=Math.exp(-Math.pow(d/.0024,2))*fe*(.3+.7*F.age);}
    zz+=.0016*G(x/.016,(md+.031)/.011);
    /* вес губ: верхняя тянет кожу до носа, нижняя — подбородок (челюсть); сбоку сходит к щеке */
    /* у щели вес уже — уголки держатся, рот раскрывается овалом; ниже — челюсть во всю ширину */
    const hw=r3Step(0,.012,Math.abs(md-yS));
    if(md>=yS-.0002)put(CPR.lipU,r3Step(F.ysn-F.my+.001,yS+hU,md)*r3Step(F.mw*(1.05+.6*hw)+.004+.012*hw,F.mw*(.3+.55*hw),ax));
    else put(CPR.lipL,r3Step(-.047,yS-hL,md)*r3Step(F.mw*(1.05+.6*hw)+.004+.016*hw,F.mw*(.35+.5*hw),ax));
  }
  o.z=z+(zz-z)*fr;
  if(wb*fr>.004)o.sk=[pb,wb*fr];
  return o;
}
/* кожа головы в (θ, φ): основа + лепка лица; та же функция кладёт бороду на губы и подбородок */
function cpSkin(H,F,th,ph){
  const p=H.at(th,ph),dz=Math.cos(ph)*Math.cos(th),o=cpSculpt(F,p[0],p[1],p[2],r3Step(.05,.4,dz));
  o.p=[p[0],p[1],o.z];o.sock=p[3];o.dz=dz;o.dy=Math.sin(ph);return o;
}
/* высота кожи лица в точке (x, y) — где сидят ресницы, зубы, усы */
function cpSkinZ(H,F,x,y){const p=cpFaceAt(H,x,y);return cpSculpt(F,x,y,p[2],1).z;}
/* зубной ряд — дуга радиуса R (полудлина w) от yTop до yBot, лицевая сторона на глубине zf; зубы разделены тёмными
   щелями по ширине (резцы, клыки, премоляры), у десны — розовее, у края — прозрачнее */
function cpTeeth(K,yTop,yBot,zf,R,w,lod,up,age){
  const n=lod>1?30:12,A=w/R,hy=(yTop-yBot)/2,yc=(yTop+yBot)/2,th=.0022;
  const base=r3Lin(age>.6?[198,186,160]:up?[224,216,200]:[212,204,188]),gum=r3Lin([184,98,96]),edge=r3Lin([168,176,184]),gap=r3Lin([70,48,40]);
  const B=up?[0,.0043,.0076,.0114,.0152,.0195]:[0,.0028,.0056,.0088,.0122,.016];
  K.surf(n,8,(u,v)=>{const a=(u-.5)*2*A,b=v*TAU,sx=Math.abs(a*R),y=yc+hy*Math.sin(b),fr=Math.max(0,Math.cos(b));
    let dg=1;for(const q of B)dg=Math.min(dg,Math.abs(sx-q)/.0005);
    const tq=(y-yBot)/(yTop-yBot),tip=up?tq:1-tq;
    let col=r3Mix(base,edge,r3Step(.2,0,tip)*.35);
    col=r3Mix(col,gum,r3Step(.82,1,tip));
    col=r3Mix(gap,col,clamp(dg,0,1));
    col=r3Sc(col,(1-.45*Math.abs(a)/A)*(.55+.45*fr));
    return [[R*Math.sin(a),y,zf-th+th*Math.cos(b)-R*(1-Math.cos(a))],col];},K.mt([255,255,255],.55,10,0),{wrap:0});
}
/* голова целиком (в своей системе: центр головы, лицо к +z). Возвращает точки оснастки лица для cpRig */
function cpHead(K,g,lod,cl,seed){
  if(g.ai){cpHeadAI(K,g,lod);return null;}
  const P=R3P,H=cpHeadFn(g),F=cpFaceRig(H,g),TH=cpWarpTh(),PH=cpWarpPh();
  const NU=lod>1?168:lod?92:30,NV=lod>1?150:lod?84:24,NUh=lod>1?56:lod?32:14,NVh=lod>1?36:lod?20:10;
  const skin=r3Lin(g.skin),hairC=r3Lin(g.hair);
  const Msk=K.mt(g.skin,.2,6,P.skin);
  const scars=g.marks.filter(q=>q.k==="scar"),tat=g.marks.some(q=>q.k==="tat"),brand=g.marks.some(q=>q.k==="brand");
  const red=r3Lin([196,90,80]),ink=r3Lin([40,90,110]),brd=r3Lin([150,48,36]),cool=r3Lin([90,80,110]);
  const lipC=r3Lin(mixc(g.skin,F.fem?[176,60,72]:[170,74,72],F.fem?.42:.32)),browC=r3Lin(mixc(g.hair,[24,18,14],.3)),mouthC=r3Lin([52,20,20]);
  const wetC=r3Lin([206,128,118]),lashC=r3Lin([20,15,13]),carC=r3Lin([200,120,118]),nosC=r3Lin([40,18,15]);
  const stub=!F.fem&&!g.beard&&(seed>>>3)%3===0?r3Mix(skin,r3Lin([70,76,90]),.3):null;
  const dseg=(px,py,ax,ay,bx,by)=>{const vx=bx-ax,vy=by-ay,t=clamp(((px-ax)*vx+(py-ay)*vy)/(vx*vx+vy*vy||1),0,1);return Math.hypot(px-ax-vx*t,py-ay-vy*t);};
  /* кожа: окклюзия глазниц и под челюстью, зоны тона, губы, брови, кромки век, ноздри, складки, метки */
  K.surf(NU,NV,(u,v)=>{
    const o=cpSkin(H,F,TH(u),PH(v)),p=o.p,dy=o.dy,dz=o.dz;
    let col=skin.slice();
    const ao=1-.42*clamp(o.sock,0,1)-.3*r3Step(-.55,-.95,dy)*r3Step(-.3,.5,dz);
    const blush=Math.exp(-Math.pow((Math.abs(p[0])-.6*H.a)/.018,2)-Math.pow((p[1]+.026)/.018,2))*r3Step(0,.6,dz);
    col=r3Mix(col,r3Mix(col,red,.5),blush*(.35+.2*F.fem));
    const fz=r3Step(0,.5,dz),nose=Math.exp(-Math.pow(p[0]/.016,2)-Math.pow((p[1]+.018)/.028,2))*fz;
    let und=0;for(const s of [-1,1])und+=Math.exp(-Math.pow((p[0]-s*H.ex)/.018,2)-Math.pow((p[1]+.013)/.008,2));und*=fz;
    col=r3Mix(col,r3Mix(col,red,.55),nose*.3);
    col=r3Sc(r3Mix(col,cool,und*(.14+.1*F.age)),1-und*.1);
    col=r3Mix(col,r3Sc(col,1.08),r3Step(.2,.55,dy)*fz*.6);
    if(stub){const md=p[1]-F.my,sz=(r3Step(-.25,-.55,dy)+r3Step(.004,.007,md)*r3Step(.017,.013,md)*r3Step(.026,.018,Math.abs(p[0])))*fz*(1-o.lip);
      col=r3Mix(col,stub,Math.min(1,sz)*.75);}   /* щетина: челюсть, подбородок, над губой */
    col=r3Sc(r3Mix(col,cool,o.lid*.1),1-o.lid*.06);
    col=r3Mix(col,lipC,o.lip*.92);
    col=r3Mix(col,mouthC,o.slit*.9);
    if(o.brow>.01){const n=(hashi((u*NU*2.3)|0,(v*NV*.7)|0,0xB40)%1000)/1000;col=r3Mix(col,r3Sc(browC,.72+.56*n),o.brow*.9);}
    col=r3Sc(col,1-.2*o.crease-.14*o.alar-.07*o.fold);
    col=r3Mix(col,lashC,o.lash*.92);col=r3Mix(col,wetC,o.wet*.75);col=r3Mix(col,carC,o.car*.7);
    col=r3Mix(col,mouthC,o.ap*(1-o.lash)*(1-o.wet)*.7);
    col=r3Mix(col,nosC,o.nos*.85);
    for(const q of scars){const sx=q.x*H.a*1.2,sy=-q.y*H.b,d=dseg(p[0],p[1],sx,sy,sx+q.dx*H.a*.5,sy-H.b*.25);
      if(dz>.2)col=r3Mix(col,r3Mix(skin,red,.6),Math.exp(-d*d/(.0018*.0018))*.85);}
    if(tat&&dz>.1){const d=Math.hypot(p[0]+.6*H.a,p[1]-.012);col=r3Mix(col,ink,(1-r3Step(.008,.014,d))*.5*(.6+.4*Math.sin(Math.atan2(p[1]-.012,p[0]+.6*H.a)*6)));}
    if(brand&&dz>.2){const bx=Math.abs(p[0]-.38*H.a),by=Math.abs(p[1]-.4*H.b);col=r3Mix(col,brd,(bx<.009&&by<.008)?.55:0);}
    return [p,r3Sc(col,ao),o.sk];
  },Msk,{wrap:1});
  /* уши: раковина, завиток по краю, тёмная чаша */
  const er=.85+.3*g.ear;
  for(const s of [-1,1]){K.push([s*H.a*.95,-.012,-.012],-s*.36,0,s*.1);   /* перед уха к щеке, зад отходит от черепа */
    const Me=K.mt(mixc(g.skin,[150,70,60],.12),.25,5,P.skin);
    K.ell([0,0,0],[.006*er,.027*er,.017*er],Me,lod?6:4,lod?10:6);
    if(lod){const rim=[];for(let i=0;i<=14;i++){const a=-1.2+i/14*3.6;rim.push([s*.0035,Math.sin(a)*.024*er,Math.cos(a)*.0145*er-.001]);}
      K.tube(rim,[.002,.0028,.0034,.0036,.0036,.0034,.0032,.003,.0028,.0026,.0024,.0024,.0026,.003,.0034],Me,5);
      K.ell([s*.003,-.002,.002],[.004,.014*er,.009*er],K.mt(mixc(g.skin,[60,30,25],.35),.1,4,P.skin),4,8);
      K.ell([s*.002,-.021*er,.002],[.0055,.0065*er,.007*er],Me,4,8);}   /* мочка */
    K.pop();}
  /* глаза: яблоко — сфера с полюсом по взгляду (зрачок и радужка — кольцами, ровно), роговица чуть выпуклая;
     ресницы — тёмная лента по кромке верхнего века. Смотрит прямо — взгляд двигает cpRig */
  const iris=r3Lin(g.eye),scl=r3Lin([206,196,184]),pink=r3Lin([206,150,140]),pup=r3Lin([6,6,8]);
  const rig={er:F.er,ex:F.ex,ey:F.ey,ez:F.Ez,brow:[F.ex,F.ey+.014,cpSkinZ(H,F,F.ex,F.ey+.014)],mouth:null};
  for(const s of [-1,1]){
    const E=[s*F.ex,F.ey,F.Ez],er0=F.er,machine=g.impl===2||(g.impl===1&&s>0);
    K.part=CPR.eye+(s>0?0:1);
    if(machine){
      K.ell(E,[er0,er0,er0],K.mt([24,28,34],.8,12,0),lod?8:5,lod?12:8);
      K.ell([E[0],E[1],E[2]+er0*.9],[er0*.5,er0*.5,er0*.18],K.mt([255,157,90],.4,8,0,3.2,true),5,10);
      if(lod){const rg=[];for(let i=0;i<=16;i++){const t=i/16*TAU;rg.push([E[0]+Math.cos(t)*er0*1.32,E[1]+Math.sin(t)*er0*1.32,E[2]+er0*.62]);}
        K.tube(rg,.0018,K.mt([150,154,160],.8,11,P.brushed),5);}
    }else{
      const pr=.15+.03*((seed>>>5)%3),nu=lod>1?40:lod?20:10,nv=lod>1?30:lod?14:6;
      K.surf(nu,nv,(u,v)=>{const az=u*TAU,al=Math.PI*Math.pow(v,1.45),r=er0+.0007*r3Step(.5,.26,al),sa=Math.sin(al);
        const d=[sa*Math.cos(az),sa*Math.sin(az),Math.cos(al)];
        let col;
        if(al<pr)col=pup;
        else if(al<.42){const k=(al-pr)/(.42-pr),st=.5+.5*(.55*Math.sin(az*23+s)+.3*Math.sin(az*41+1.3)+.15*Math.sin(az*67+2.1));
          col=r3Sc(iris,(.5+.75*st)*(1.15-.3*k+.25*Math.exp(-Math.pow((k-.22)/.08,2)))*(k>.84?.4:1));}
        else col=r3Mix(scl,pink,r3Step(1.05,1.6,al)*(.4+.6*Math.abs(Math.cos(az))));
        col=r3Sc(col,1-.38*r3Step(-.15,.75,d[1])-.12*r3Step(.3,.9,Math.abs(d[0])));   /* тень века сверху, углы глубже */
        return [[E[0]+d[0]*r,E[1]+d[1]*r,E[2]+d[2]*r],col];},K.mt([255,255,255],.85,13,P.eye),{wrap:1});
    }
    if(lod){   /* ресницы: от кромки наружу, вперёд и чуть вверх; у наружного угла длиннее */
      K.part=CPR.lidU;const n=lod>1?18:8,LP=[];
      for(let i=0;i<=n;i++){const tn=-.94+1.88*i/n,q=1-tn*tn,yC=-.0008+.0012*tn,yU=yC+F.hu*Math.pow(q,.65)*(1-.12*tn),dx=s*tn*F.aw;
        const x=s*F.ex+dx,y=F.ey+yU,z=F.Ez+Math.sqrt(Math.max(0,F.rs*F.rs-dx*dx-yU*yU))-.0002;
        const nr=K.nz([x-E[0],y-E[1],z-E[2]]),L=(.0024+.0012*r3Step(-.2,.8,tn))*(1+.3*F.fem)*Math.pow(q,.3);
        LP.push([[x,y,z],[x+(nr[0]*.55)*L,y+(nr[1]*.4+.55)*L,z+(nr[2]*.6+.35)*L]]);}
      K.surf(n,2,(u,v)=>{const i=Math.round(u*n),a=LP[i][0],b=LP[i][1],c=v*v*(3-2*v);return [[a[0]+(b[0]-a[0])*v,a[1]+(b[1]-a[1])*c,a[2]+(b[2]-a[2])*v],lashC];},K.mt([20,15,13],.2,4,P.hair));
    }
    K.part=1;
  }
  /* зубы за губами: верхние стоят с головой (улыбка поднимает губу над ними), нижние ходят с нижней губой */
  if(lod){const zf=cpSkinZ(H,F,0,F.my)+.0016;
    K.part=CPR.teeth;cpTeeth(K,F.my+.0105,F.my-.0004,zf,.026,.0195,lod,1,F.age);
    K.part=CPR.lipL;cpTeeth(K,F.my-.0018,F.my-.0095,zf-.0024,.023,.0135,lod,0,F.age);   /* уже и глубже: края не пробивают кожу под губой */
    K.part=1;}
  rig.mouth=[0,F.my,cpSkinZ(H,F,0,F.my)];
  /* волосы и голова сверху — своя, редкая сетка */
  cpHair(K,g,H,lod,cl,NUh,NVh,skin,hairC,seed);
  /* борода — по коже лица (лежит на губах и подбородке, ходит за ними) */
  if(g.beard)cpBeard(K,g,H,F,lod);
  return rig;
}
/* линия роста волос: на лбу высоко, у ушей ниже, на затылке — до шеи (в долях b, по sin φ) */
function cpHairline(th,style){
  const at=Math.abs(th);
  if(style===2){if(at<.8)return .3;if(at<1.3)return .3-(at-.8)*1.6;return -.55;}
  if(at<1.1)return .6-.28*Math.pow(at/1.1,2);   /* лоб — ровная дуга, не мысок */
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
  const T=[.0035,.05,.09,.04,0,0,.03][st]*(.85+.3*R()),shaved=st===0,TH=cpWarpTh();
  const HL=th=>{if(st!==2||!lod)return cpHairline(th,st);const at=Math.abs(th);return at<.8?.5:at<1.3?.5-(at-.8)*2.1:-.55;};
  const col=shaved?r3Mix(skin,hairC,.55):hairC;
  const M=K.mt(g.hair,shaved?.08:.22,shaved?3:7,shaved?0:P.hair);
  /* θ — по той же густоте, что кожа (у лица чаще): редкая сетка хордой срезала глазницу, и шапка проступала у виска.
     Ниже линии роста шапка уходит под кожу глубже — на ширину хорды с запасом */
  K.surf(NU,NV,(u,v)=>{const th=TH(u),ph=-Math.PI/2+v*Math.PI,p=H.at(th,ph),dy=Math.sin(ph),yh=HL(th);
    let k=1-.012-.05*r3Step(yh-.04,yh-.14,dy)+(.02+T*(st===2?(.7+.6*r3Step(.3,-.5,dy)):(.6+.4*dy)))*r3Step(yh-.03,yh+.2,dy);
    if(st===2&&!lod&&Math.abs(th)<.8&&dy<.55&&dy>.25)k+=.02;   /* чёлка каре издали; вблизи её кладут пряди */
    /* тон — прядями: колонка сетки (вдоль θ) держит свой тон от лба к затылку, вдоль пряди он плывёт медленно */
    const ci=Math.round(u*NU),n=(.62*(hashi(ci,0,7)%1000)+.38*(hashi(ci,(v*7)|0,8)%1000))/1000;
    const fd=.35+.65*r3Step(yh,yh+(st===0||st===6?.16:.08),dy);   /* у корней редеет: сквозь волосы видна кожа */
    return [[p[0]*k,p[1]*k+(st===2?.002:0),p[2]*k],r3Mix(r3Sc(skin,.85),r3Sc(col,.82+.3*n),fd)];},M,
    {wrap:1,keep:(u,v)=>{const th=TH(u),ph=-Math.PI/2+v*Math.PI;return Math.sin(ph)>HL(th)-.2;}});
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
/* борода — по коже лица (cpSkin): лежит на губах и подбородке и ходит за ними тем же весом; усы — с верхней губой */
function cpBeard(K,g,H,F,lod){
  const M=K.mt(g.hair,.25,5,R3P.hair),hc=r3Lin(g.hair),my=F.my;
  if(g.beard===3){
    K.part=CPR.lipU;const P=[];
    for(let i=0;i<=6;i++){const t=i/6*2-1,x=t*.026,y=my+.0105-.006*t*t*t*t;P.push([x,y,cpSkinZ(H,F,x,y)+.0026]);}
    K.tube(P,[.002,.0042,.005,.0055,.005,.0042,.002],M,lod?6:4);K.part=1;return;
  }
  const full=g.beard===1,TH=cpWarpTh(),PH=cpWarpPh(),NU=lod>1?96:lod?48:18,NV=lod>1?84:lod?40:14;
  const at=(u,v)=>cpSkin(H,F,TH(u),PH(v));
  K.surf(NU,NV,(u,v)=>{const o=at(u,v),p=o.p,k=1.012+(full?.07:.06)*r3Step(-.15,-.55,o.dy);
    return [[p[0]*k,p[1]*k-(full?.006*r3Step(-.6,-1,o.dy):0),p[2]*k],hc,o.sk];},M,
    {wrap:1,keep:(u,v)=>{const o=at(u,v),p=o.p;
      if(Math.abs(p[0])<.026&&p[1]<my+.012&&p[1]>my-.01)return false;
      if(full)return o.dy<-.15&&o.dz>-.35&&p[1]<my+.016;
      return Math.abs(p[0])<.03&&p[1]<my-.006&&o.dz>.3;}});
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
/* оснастка лица: матрицы частей 4–12 экземпляра (F — матрицы кадра, base — его первая часть) из матрицы головы Mh
   и выражения X (27f6 cpFace). Части построены в системе головы: P — та же матрица, что K.push головы в cpBody;
   движение части L — между P и P⁻¹. Без выражения или у ядра ИИ лицо просто едет с головой */
function cpRig(F,base,Mh,M,X){
  for(let k=4;k<=12;k++)F.set(Mh,(base+k)*16);   /* 12 — верхние зубы: стоят с головой */
  const R=M.rig;if(!R||!X)return;
  const hc=M.at.hp[0],rx=M.at.hp[1],hs=M.at.hp[2];
  const P=r3Mul(Mh,r3Xf(hc,0,rx,0,hs)),Pi=r3Mul(r3Xf([0,0,0],0,-rx,0,1/hs),r3Xf([-hc[0],-hc[1],-hc[2]]));
  const put=(k,L,b)=>{const A=r3Mul(P,r3Mul(L,Pi));if(b){A[3]=b[0];A[7]=b[1];A[11]=b[2];}F.set(A,(base+k)*16);};
  const piv=(c,ry,rr,rz)=>r3Mul(r3Xf(c,ry,rr,rz,1),r3Xf([-c[0],-c[1],-c[2]]));
  const scl=(c,sx,sy,t)=>[sx,0,0,0, 0,sy,0,0, 0,0,1,0, c[0]*(1-sx)+(t?t[0]:0),c[1]*(1-sy)+(t?t[1]:0),(t?t[2]:0),1];
  /* веки: верхнее — прищур и моргание (+ вниз), следует за взглядом вниз; нижнее поднимают щёки */
  const ax=[0,R.ey,R.ez],up=X.lu+(.84-X.lu)*X.bl-X.gz[1]*.5;
  put(CPR.lidU,piv(ax,0,up,0));
  put(CPR.lidL,piv(ax,0,-X.ll*.24+X.bl*.06,0));
  /* глаза — каждый вокруг своего центра, чуть внутрь (к собеседнику) */
  for(const s of [1,-1])put(CPR.eye+(s>0?0:1),piv([s*R.ex,R.ey,R.ez],X.gz[0]-s*.03,-X.gz[1],0));
  /* брови: подъём и излом (внутренний конец вверх — горе и удивление, вниз — гнев) */
  for(const s of [1,-1]){const i=s>0?0:1,c=[s*R.brow[0],R.brow[1],R.brow[2]],b=X.br[i];
    put(CPR.brow+i,r3Mul(r3Xf([0,b*.0045+X.bi[i]*.0012,-Math.abs(b)*.0008]),piv(c,0,0,-s*X.bi[i]*.16)));}
  /* губы: изгиб в шейдере (y += a·x² + b·x·|x|, уголки назад), шире в улыбке; нижняя губа с зубами — вниз, рот
     изнутри тянется за ней. Изгиб — в осях сетки: x сетки = hs·x головы */
  const m=R.mouth,a=X.sm*7.5/hs,b=X.sk*6/hs,zb=Math.max(0,X.sm)*3/hs,sx=1+.06*X.sm-.05*X.mo,d=X.mo*.009;
  put(CPR.lipU,scl(m,sx,1,[0,X.mo*.0007+Math.max(0,X.sm)*.0016,0]),[a,b,zb]);
  put(CPR.lipL,scl(m,sx,1,[0,-d,-d*.25]),[a,b,zb]);
}
