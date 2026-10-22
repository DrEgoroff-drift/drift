/* ══════════════ система: кольца, пояс и станция в кадре ══════════════
   Отрезано от 17-mode-system на распиле 0.108.x: updateSystem и drawSystem
   остались там; формы пояса и станции — здесь. */
function reticle(x,y,r){
  ctx.strokeStyle="rgba(242,178,92,.9)";ctx.lineWidth=1.3;
  const a=G.t*.03;
  for(let i=0;i<4;i++){
    const t=a+i*Math.PI/2;
    ctx.beginPath();
    ctx.arc(x,y,r,t+.15,t+Math.PI/2-.15);ctx.stroke();
  }
}
/* грунт строителя доходит до ствола и панелей, а не только до плиты (D10, телефон
   18.09: шесть станций отличались одной полоской — «наклейка») */
let ST_BY="gt";
function stGround(base,k){return (typeof makerGround==="function")?rgba(mixc(base,makerGround(ST_BY),k),1):rgba(base,1);}
/* ── станция на видеокарте (G4) ──
   Спрайт (gpuLitSprite: корпуса в запасе 17c2, пираты), но свет на нём — от звезды по рельефу,
   как на корабле (gpuHullLight), а не плоский градиент с обводкой по освещённой
   половине: маска выпечки читается рельефом, кромка горит только там, где борт
   смотрит на звезду, тень идёт перепадом через всё тело, огни и окна светят сами.
   Собственный свет станции — гауссово пятно под корпусом, а не кольца градиента. */
const GPU_LIT_SH=(.6).toFixed(2);
/* флаг 4: среднее не мельче коробки 5.5 текселя (у pirMaster — 7); мип у нуля — 2, пираты теряли до 11 % */
const GPU_LIT_DK=Math.log2(5.5).toFixed(3);
/* корабль в настоящем свете (§L.S): уровней мипа до купола тела, его вес, доля градиента «к звезде»
   по всему корпусу, заливка без газа, доля газа, свет, огни (выше колена — свечение подхватывает) */
const RL_DL="3.",RL_KD="6.",RL_AMB=".46",RL_GAS=".9",RL_LIT="1.2",RL_EM="2.3",RL_GL="1.5",RL_GN="8.",RL_FL="4.",RL_FLM=".1",RL_RIM=".45",RL_GK=".35",RL_SH=".65",RL_TD=".4";
const GST_WGSL=GPU_PL_WGSL+`
fn plOcc(q:vec2f)->f32{let dq=q-fu.v[0].xy;let ro=fu.v[1].zw;
  let uv=(vec2f(dot(dq,ro),dot(dq,vec2f(-ro.y,ro.x)))/fu.v[0].z+1.)*.5;
  if(any(uv<vec2f(0.))||any(uv>vec2f(1.))){return 0.;}
  return textureSampleLevel(t0,smp,uv,0.).a;}
/* fu.v[3].w — флаги: 1 — рельеф по мастеру t2, 2 — нерезкая маска между мипами, 8 — материал t3 (08cd):
   левая половина — рельеф, правая — маски свечения, металла, стекла */
fn relOn()->bool{return (u32(fu.v[3].w+.5)&1u)!=0u;}
/* рельеф — по альфе t0, а у верхнего слоя станции (флаг 1) — по общему мастеру t2:
   край ядра внутри тела — не кромка, свет его не обводит */
fn ra(uv:vec2f,l:f32)->f32{if(relOn()){return textureSampleLevel(t2,smp,uv,l).a;}return textureSampleLevel(t0,smp,uv,l).a;}
fn sa(uv:vec2f,d:vec2f)->vec2f{let l=fu.v[3].z;
  return vec2f(ra(uv+vec2f(d.x,0.),l)-ra(uv-vec2f(d.x,0.),l),ra(uv+vec2f(0.,d.y),l)-ra(uv-vec2f(0.,d.y),l));}
/* fu.v[2].w — прозрачность всего спрайта (борт у дока гаснет): премультиплицированный выход целиком */
fn field(p:vec2f,uv0:vec2f)->vec4f{return fieldL(p,uv0)*fu.v[2].w;}
fn fieldL(p:vec2f,uv0:vec2f)->vec4f{
  let c=fu.v[0].xy;let R=fu.v[0].z;let s=fu.v[0].w;let sd=normalize(fu.v[1].xy);let col=fu.v[2].rgb;let ro=fu.v[1].zw;
  let dp=p-c;let rr=length(dp);
  /* свой свет станции: тёплое гауссово пятно, окна и прожекторы */
  let gl=vec3f(1.,.84,.59)*(exp(-(rr*rr)/(R*R*.12))*.22+exp(-rr/(R*.5))*.07)*max(fu.v[3].x,0.);
  if(rr>R*1.2){return vec4f(gl,0.);}
  /* спрайт повёрнут на ro=(cos,sin): место — в его осях, нормали — обратно в экран */
  /* fu.v[3].y — сжатие крена по поперечной оси (корпус корабля, 17c2); 0 — без крена */
  let lp=vec2f(dot(dp,ro),dot(dp,vec2f(-ro.y,ro.x)))/vec2f(1.,select(1.,fu.v[3].y,fu.v[3].y>0.));let uv=(lp/R+1.)*.5;
  if(any(uv<vec2f(0.))||any(uv>vec2f(1.))){return vec4f(gl,0.);}
  var c4=textureSampleLevel(t0,smp,uv,fu.v[3].z);   /* fu.v[3].z — уровень мипа у мастера (17c2), иначе 0 */
  /* флаг 2 — нерезкая маска (25.09): Y против среднего по покрытию уровнем выше, одним множителем
     на rgb, канал не выше покрытия. Вверх и вниз — на (1−Y)²: светлое свет и так поднимает до ×3;
     флаг 4 — вниз в полную силу, полоса GPU_LIT_DK (правило pirMaster, пираты) */
  if((u32(fu.v[3].w+.5)&2u)!=0u&&c4.a>1e-3){let dk=(u32(fu.v[3].w+.5)&4u)!=0u;
    let a1=textureSampleLevel(t0,smp,uv,select(fu.v[3].z+1.,max(fu.v[3].z+1.,${GPU_LIT_DK}),dk));
    let W3=vec3f(.299,.587,.114);let Y=dot(c4.rgb,W3)/c4.a;
    if(a1.a>1e-4&&Y>.002){let e=${GPU_LIT_SH}*(Y-dot(a1.rgb,W3)/a1.a);let q=1.-min(Y,1.);
      let dn=select(q*q,1.,dk);
      let f=clamp((Y+e*select(dn,q*q,e>0.))/Y,0.,c4.a/max(max(c4.r,c4.g),max(c4.b,1e-4)));
      c4=vec4f(c4.rgb*f,c4.a);}}
  let a=c4.a;
  if(a<.01){return vec4f(gl,0.);}
  let u1=vec2f(.5/R);
  let L=normalize(vec3f(sd,.3));
  /* широкая нормаль и мелкий рельеф (краска, купол стекла) — из материала (раз на корпус, 08cd), иначе по
     альфе здесь; мелкий рельеф ложится и в тонкую нормаль — швы и панели ловят кромку звезды */
  let mo=(u32(fu.v[3].w+.5)&8u)!=0u;var gb0:vec2f;var gg0:vec2f;
  let lm=max(fu.v[3].z-1.,0.);var mk=vec3f(0.);
  var gd0=vec2f(0.);
  if(mo){let m=textureSampleLevel(t3,smp,vec2f(uv.x*.5,uv.y),lm);gb0=m.xy;gg0=m.zw;
    /* купол тела: мип склонов — склон размытой альфы, от хребта к бортам (свет в один терминатор) */
    gd0=textureSampleLevel(t3,smp,vec2f(uv.x*.5,uv.y),lm+${RL_DL}).xy;
    let q=textureSampleLevel(t3,smp,vec2f(.5+uv.x*.5,uv.y),lm);mk=q.xyz/max(q.w,1e-3);}
  else{gb0=-(sa(uv,u1*3.*s)*.5+sa(uv,u1*8.*s)*.5);gg0=glassG(uv,u1*6.);}
  let g0=-sa(uv,u1*1.1)+select(vec2f(0.),gg0,mo);let g=vec2f(g0.x*ro.x-g0.y*ro.y,g0.x*ro.y+g0.y*ro.x);let tl=clamp(length(g),0.,.98);
  let n=vec3f(g/max(length(g),1e-4)*tl,sqrt(1.-tl*tl));
  let gb=vec2f(gb0.x*ro.x-gb0.y*ro.y,gb0.x*ro.y+gb0.y*ro.x);let tb=clamp(length(gb)*1.2,0.,.9);
  let nb=vec3f(gb/max(length(gb),1e-4)*tb,sqrt(1.-tb*tb));
  let side=dot(dp,sd)/R;
  /* верхний слой станции судит «огонь или металл» по общему мастеру: полоса краски на
     .32 поверх корпуса — не лампа, хотя в своём слое она чистый янтарь */
  var cu=c4;if(relOn()){cu=textureSampleLevel(t2,smp,uv,fu.v[3].z);}
  let rgb=cu.rgb/max(cu.a,1e-3);let mx=max(rgb.r,max(rgb.g,rgb.b));let sat=(mx-min(rgb.r,min(rgb.g,rgb.b)))/max(mx,1e-3);
  let own=select(1.-smoothstep(.3,.55,sat*mx),1.-mk.x,mo);
  let rim=pow(max(dot(n,L),0.),3.)*pow(1.-n.z,1.5);
  /* свет — множитель по грунту (почти белый): тёмное остаётся тёмным, синее — синим;
     тёплый цвет звезды — только кромке cos³ */
  let away=max(-dot(nb.xy,sd),0.)*(1.-nb.z);
  let dark=clamp(.45*smoothstep(-.1,.9,-side)+.25*away,0.,.55)*own;
  let lf=smoothstep(-.2,.8,side)*own;
  var shade=(1.+.9*lf+max(dot(nb,L),0.)*(1.-nb.z)*1.2*own)*(1.-dark);
  var lit=col*rim*1.1*own*a;
  /* корпус корабля (glow<0, 17c2): свет как у 2D-корпуса (gpuHullLight) — грунт выпечки
     как есть, тень перепадом, звезда только кромкой и скатом к ней. Множитель станции
     (до ×3 на светлом борту) выбеливал обшивку, а насыщенная краска (красный кант)
     шла в огни ×2.3 и за коленом свечения уходила в розовое */
  let hm=fu.v[3].x<-.5;
  if(hm){shade=1.-clamp(.2*smoothstep(-.4,.6,-side)+.1*away,0.,.3)*own;
    lit=col*(rim*1.1+max(dot(nb,L),0.)*(1.-nb.z)*.3)*own*a;}
  /* L3: заслон звезды — станция тенит баржу у причала (у самой станции, glow>0, — нет);
     огни в тень не падают */
  let sk=mix(1.,select(shAt(p,sd),1.,fu.v[3].x>0.),own);
  /* L3: точечный свет — лучи, разрывы, болты, факелы: ближний борт берёт их цвет */
  let pl=plAt(p,normalize(nb+vec3f(n.xy*.6,0.)),R*.3,R*.22)*own*select(1.,.2,hm);
  /* металл (серое) — жёсткий блик-штрих со стороны звезды; стекло (голубое) — отражает звезду */
  let Hs=normalize(L+vec3f(0.,0.,1.));
  let met=select((1.-smoothstep(.1,.28,sat))*smoothstep(.12,.35,mx),mk.y,mo)*own;
  let gls=select(glassOf(cu),mk.z,mo)*own;
  let gg=vec2f(gg0.x*ro.x-gg0.y*ro.y,gg0.x*ro.y+gg0.y*ro.x);
  let spec=(col*met*(1.-gls)*1.3*pow(max(dot(n,Hs),0.),40.)+mix(col,vec3f(1.),.6)*gls*glassSpec(gg,Hs))*sk*a;
  /* окна и огни светят сами: выше колена — их подхватывает свечение; у корпуса корабля — только
     по маске материала (огонь ярче округи), без неё насыщенный кант шёл в огни */
  let em=select(1.+1.3*(1.-own),1.,hm&&!mo);
  if(hm&&mo){
    /* корабль в настоящем свете (§L.S a–c, e): один свет — звезда, терминатор по куполу тела через весь
       корпус; тень не чёрная — заливка газом у корабля (t2 — туманность 16gb, флаг 16), тёплая в
       рыжем газе, холодная в синем; скала гасит прямой свет (sk), но не заливку; огни живут и в тени */
    let gd=vec2f(gd0.x*ro.x-gd0.y*ro.y,gd0.x*ro.y+gd0.y*ro.x);
    /* a) свет по граням (ревью 26.09, проход 2): грани — как нарисованы, каждая ровная внутри; купол по
       размытой альфе клал муть поперёк граней — его нет. Звезда читается кромками: к ней — обвод (g),
       от неё — тёмная кромка силуэта (tv); по телу лишь едва заметный наклон */
    /* c) глубина тени скалы: shAt в полной тени — .4 (у 2D-корпуса это множитель всего цвета), здесь 0 —
       прямой свет, блик и обвод гаснут целиком, живут заливка, окна и факел */
    let sq=smoothstep(.4,1.,sk);
    let kf=.88+.12*smoothstep(-1.,1.,side);
    let key=kf;
    var fl=vec3f(${RL_AMB});
    if((u32(fu.v[3].w+.5)&16u)!=0u){let rq=fu.res.zw;var gz=vec3f(0.);
      for(var k=0;k<5;k++){let o=select(vec2f(0.),vec2f(cos(f32(k)*1.571),sin(f32(k)*1.571))*R*1.3,k>0);
        gz+=max(textureSampleLevel(t2,smp,(c+o)/rq,0.).rgb,vec3f(0.));}
      gz*=.2;let gm=max(max(gz.r,gz.g),max(gz.b,1e-4));let gc=gz*(1.-exp(-gm*1.25))/(gm*1.25)*1.12;
      /* b) газ красит тень, а не светлит её: оттенок газа той же светлоты, что и заливка */
      let gh=gc/max(dot(gc,vec3f(.299,.587,.114)),1e-3);fl=fl*mix(vec3f(1.),gh,smoothstep(.02,.2,gm)*${RL_GAS});}
    /* c) в тени скалы прямой свет гаснет весь, заливка — на треть (газ в конусе тени темнее, но не вдвое) */
    fl*=${RL_SH}+(1.-${RL_SH})*sq;let lv=mix(fl,vec3f(${RL_LIT}),key*sq);
    let e=1.-own;
    /* маска голого металла для блика на кромке (d) — на мипе ~1/8 длины корпуса: панель металл или нет,
       без крапа по заклёпкам; на барже столько же, сколько на истребителе */
    let td=vec2f(textureDimensions(t3));
    let glv=max(lm+${RL_GL},log2(max(td.x*.5,td.y)/${RL_GN}));
    let mq=textureSampleLevel(t3,smp,vec2f(.5+uv.x*.5,uv.y),glv);let mg=mq.y/max(mq.w,1e-3);
    let sp=mix(col,vec3f(1.),.6)*gls*glassSpec(gg,Hs)*sq*a;
    /* f) огонь светит корму — второй свет, нарушение «одного света», названное: тёплое пятно у сопел,
       спадает к досягаемости; обшивка, скатом к огню, берёт больше; скала его не гасит — огонь свой */
    var fs=vec3f(0.);
    if(fu.v[4].w>0.){let fv=fu.v[4].xy-p;let fd=length(fv);let r0=fu.v[5].w;let rr=fu.v[4].z;
      let fa=smoothstep(-.35,.35,dot(gd,fv/max(fd,1e-3))*${RL_KD});
      let rg=step(r0,fd)*smoothstep(r0,r0+(rr-r0)*.3,fd)*(1.-smoothstep(r0,rr,fd));
      /* огонь бьёт назад и вбок: конус от оси — чем дальше от оси, тем дальше вперёд достаёт; кили по
         бокам языка светятся, фюзеляж перед гнездом (на оси) — нет */
      let ax=dot(-fv,ro);let lat=abs(dot(-fv,vec2f(-ro.y,ro.x)));
      let bk=1.-smoothstep(-r0*.2,r0*.3,ax-lat*.9);
      /* гнездо сопел и его свечение светлы сами — их огонь не трогает вовсе (сам шейдер — байт в байт; ±1 даёт только блум) */
      let yc=dot(c4.rgb/max(a,1e-3),vec3f(.299,.587,.114));
      fs=fu.v[5].rgb*fu.v[4].w*${RL_FL}*rg*bk*(.45+.55*fa)*own*step(yc,.5);}
    /* g) обвод: пиксель устройства по кромке к звезде — сосед на пиксель к ней пуст; тёмная сторона кромки
       не светлеет, на светлом газе тело остаётся тёмным силуэтом; мип мастера — поворот не мерцает */
    let sdu=vec2f(dot(sd,ro),dot(sd,vec2f(-ro.y,ro.x)));
    let an=textureSampleLevel(t0,smp,uv+sdu*u1,fu.v[3].z+1.).a;
    let af=textureSampleLevel(t0,smp,uv-sdu*u1*1.5,fu.v[3].z+1.).a;let tv=1.-${RL_TD}*clamp(a-af,0.,1.)*sq;
    /* d) блик — на кромке к звезде по голому металлу: пиксель обвода белеет (мягкий отлив по грани на
       телефоне читался грязью); едет с поворотом вместе с кромкой */
    let rv=mix(col,vec3f(1.),.5*mg)*clamp(a-an,0.,1.)*key*sq*own*(${RL_RIM}+${RL_GK}*smoothstep(.35,.7,mg));
    return vec4f(c4.rgb*(lv*tv*own*mix(vec3f(1.),col,.08*key)+pl+e*${RL_EM})+min(c4.rgb*fs,fu.v[5].rgb*${RL_FLM})+sp+rv+gl*(1.-a),a);}
  return vec4f(c4.rgb*(shade*sk*em+pl)*mix(vec3f(1.),col,.08)+lit*sk+spec+gl*(1.-a),a);
}`;
/* выпечка cv (полуразмер R в пикселях экрана, поворот rot) со светом звезды по рельефу;
   (lx,ly) — к звезде; glow — доля своего тёплого света (станция 1, баржа 0) */
/* cv — холст или готовый мастер с мипами (gpuMipTex, 17c2): тогда lod — его уровень */
/* rel — мастер рельефа (верхний слой станции, 17c3): свет по нему, цвет и покрытие — по cv */
/* sharp — нерезкая маска между уровнями мастера (только у мастера с мипами): резкость 2D
   без ряби, как gpuImage {sharp}; lod тогда — обычный, не на ступень мельче; "dark" — флаг 4 */
/* al — прозрачность всего спрайта (0…1, по умолчанию 1): гаснущий борт светится тем же светом */
function gpuLitSprite(cv,x,y,R,s,rot,lx,ly,glow,sy,lod,rel,sharp,al,fl){
  /* GPU.rt — студия (17c2): свой проход, ровный свет без ламп и тени (нулевая t1), без газа */
  const RT=GPU.rt,pass=RT?RT.pass:gpuScene();if(!pass)return false;
  const c=RT?RT.col:(typeof starRGB==="function")?starRGB():[255,244,214],m=Math.max(1,c[0],c[1],c[2]);
  const U=new Float32Array(fl?24:16);U[0]=x;U[1]=y;U[2]=R;U[3]=s;U[4]=lx;U[5]=ly;U[6]=Math.cos(rot);U[7]=Math.sin(rot);
  U[8]=c[0]/m;U[9]=c[1]/m;U[10]=c[2]/m;U[11]=al==null?1:clamp(al,0,1);U[12]=glow;U[13]=sy||0;U[14]=lod||0;
  /* fu.v[4..5] — свет пламени у кормы (17c2): место на экране, досягаемость, сила, цвет */
  if(fl){U[16]=fl.x;U[17]=fl.y;U[18]=Math.max(fl.r,1);U[19]=fl.k;U[20]=fl.c[0];U[21]=fl.c[1];U[22]=fl.c[2];U[23]=fl.r0||0;}
  const mip=!!cv.view;if(mip&&cv.draw)gpuBakeLive(cv);   /* материал (08cd) — после возможной перепечки */
  const mt=mip&&!rel&&cv.mat;
  /* заливка газом — корпусу корабля с материалом, пока туманность 16gb этой системы жива */
  const gz=mt&&glow<0&&!RT&&typeof GNB!=="undefined"&&GNB.view&&GNB.dev===GPU.dev&&G.sys&&GNB.sys===G.sys;
  U[15]=(rel?1:0)+(sharp&&mip?2:0)+(sharp==="dark"&&mip?4:0)+(mt?8:0)+(gz?16:0);
  gpuField(pass,"gst",GST_WGSL,U,[mip?cv:gpuCanvasTex(cv),{view:RT?RT.lt:GPU.V.lt},rel||(gz?{view:GNB.view}:null),mt||null],{blend:"hull",smp:mip?gpuMipSmp():null});
  return true;
}
function drawStation(x,y,Z){
  /* ── станция крупнее корабля, потому что корабль в неё заходит (M242) ──
     На увеличении торговый узел с шестью модулями был 170 px, а корабль рядом
     140: внутрь такой станции лендер не влезет, и масштаб мира разваливался.
     Полтора — не «чтобы красивее», а чтобы отношение размеров не врало. */
  const s=clamp(Z,.4,1.5)*1.7,S=G.sys.station,ty=S.stype||"trade";
  /* ── станция светит (M243) ── огни станции — тёплый свет на пришвартованных: борт к станции теплеет;
     круг заслоняет звезду баржам у причала (L3) */
  /* тело (M820, 17c2g): хребет, ядро по типу, модули по заводу, тёплые окна, фонари причала.
     2D-мастер (drawStationBody → выпечка → спрайт) снят 22.10 вместе с ?body=0: кончились слои — станции нет кадр */
  const pass=gpuScene();
  if(pass){const R=Math.max(24,80*s);bodyStation(S,x,y,s,ty);GPU.oc.push([x,y,R*.5]);gpuLight(x,y,x,y,1,.84,.59,R*.9,.7);}
  /* подпись уходит НИЖЕ корпуса: сорок пикселей — это внутри станции, и имя
     читалось поверх её же переборок (M242) */
  /* и растёт вместе с бортом (M443): девять пикселей при раздутом интерфейсе
     читались так же, как подписи карты до M437 */
  domLabel("st",x,y+42*s+12*uiK(),S.name.toUpperCase(),uiFont(9),"rgba(242,178,92,.6)","center");
}
