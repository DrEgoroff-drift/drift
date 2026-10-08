/* ══════════════ зал за экранами (M810, docs/DESIGN-hall.md) ══════════════
   Стыковка открывает не стол, а зал. Зал — одна сцена движка комнат (27f2 r3Frame) на станцию,
   на холсте #stHall во весь экран станции позади всего; разделы станции — места в зале: доска на стене,
   стойка, окно на верфь, верстак, бар, конторский стол. Выбор раздела ведёт камеру к месту
   (плавно, 600 мс, без склейки); то, что игрок читает и нажимает, — плита справа на 60 % ширины,
   левые 40 % всегда показывают зал, а через его окно — мир станции и её планету.

   ПРАВИЛА ФАЙЛА:
   1. Кости одни на все семь типов (пол, задняя стена с окном, стойка слева, доска сзади-слева,
      конторский стол справа-сзади, бар в дальнем правом конце, дверь в док — за камерой, её не видно),
      поэтому места камеры одни и те же. Тип станции меняет высоту, свет и одежду зала (27f4b).
   2. Бар — кантина 27f4 целиком в правом конце зала: её стойка, полка, вывеска и её люди (c3Layout),
      сдвинутые на HALL_XB по x. Камера раздела ЛЮДИ — прежняя камера кантины, сдвинутая так же.
   3. Один ключ: лампа над стойкой (тёплая, единственный тёплый свет людей); заливка — окно (холодное
      или горячее по типу); остальное — отсвет. Пределы движка: 32 экземпляра, 16 частей, 12 ламп,
      6 с тенью — их проверяет тест 91qc-hall.
   4. Герой кадра — место раздела: на ПК объектив сдвинут (сдвиг оптики, а не поворот камеры), так что
      цель стоит посередине левых 40 %; на телефоне зал — полоса сверху, цель посередине.
   5. Рисуется, только пока экран открыт: на ходу камеры — каждый кадр, в покое — 12 кадров в секунду
      (люди дышат). Исключение в кадре гасит цикл зала и пишется в консоль один раз, игру не роняет.
   6. ?hall=0 — прежний стол: ни холста, ни класса, DOM как был (до M890). */
const HALL={on:typeof location==="undefined"||!/[?&]hall=0\b/.test(location.search),
  cn:null,open:false,raf:0,last:0,room:null,rkey:"",L:null,lkey:"",
  night:(typeof location!=="undefined"&&/[?&]hallnight=([01])\b/.test(location.search))?+RegExp.$1:null,
  pilot:typeof location==="undefined"||!/[?&]hallpilot=0\b/.test(location.search),meas:null,tags:null,
  from:null,to:null,g0:0,gd:600,place:"",orb:null,orbTex:null,orbKey:"",orbTry:0,err:0,frames:0,stat:null};
const HALL_XB=10;          /* бар: кантина 27f4, сдвинутая вправо на столько метров */
const HALL_B=-2.8;         /* задняя стена (та же, что у кантины, C3_BACK) */
const HALL_L=-7.2;         /* левая стена */
const HALL_F=6.5;          /* передняя стена — за камерой, с дверью в док */
const HALL_HERO=.4;        /* доля ширины кадра под зал на ПК: остальное — плита */
const HALL_STRIP=.36;      /* телефон: доля высоты под полосу зала */
/* пилот — сам игрок у места раздела, первым планом спиной на три четверти: мерило человека в кадре.
   Риг планеты (21pha) живёт в своём движке, в зале — человек 27f3 в лётной куртке, один на всех */
const HALL_PILOT_M={seed:0x9117D,role:"cmd",loy:70,xp:0,traits:[],jac:[238,115,38]};
const HALL_PILOT_AT={board:[-2.9,-1.2,Math.PI-.35,"stand"],trade:[-4.62,-.2,-Math.PI/2,"bar"],
  ship:[2.15,-.95,Math.PI+.3,"stand"],site:[2.15,-.95,Math.PI+.3,"stand"],know:[1.75,-1.25,Math.PI+.5,"stand"],hold:[4.0,-1.35,Math.PI*.78,"stand"]};
/* смена станции: сутки — 24 мин игрового часа; ночью окно гаснет до звёзд, держат лампы людей */
const HALL_DAY_MS=24*60e3;
const HALL_KEYX=-5.72;
const HALL_SCONCE=[-7.0,2.2,-.9];   /* бра на левой стене над полкой */      /* лампа-ключ: x над стойкой со стороны хозяина */
/* типы: высота потолка, вид в окно (S.win2.y: 0 док, 1 литейка, 2 стапель, 3 звёзды науки, 5 звёзды и
   патруль, 6 резервуары), заливка окна (цвет, сила), тон ключа, стены, сколько ламп над баром */
const HALL_TYPES={
  trade:  {hc:3.2, win:0, fill:[255,186,118],fp:1.25,key:[255,214,160],wall:[66,64,70],bar:3},
  indust: {hc:5.6, win:1, fill:[255,128,52], fp:2.1, key:[255,200,140],wall:[74,68,60],bar:2,tube:[196,218,255]},
  yard:   {hc:4.6, win:2, fill:[214,232,255],fp:1.5, key:[255,220,170],wall:[62,70,74],bar:3,weld:1},
  sci:    {hc:3.6, win:3, fill:[188,214,255],fp:1.45,key:[255,226,190],wall:[70,80,96],bar:3,big:1},
  outpost:{hc:2.8, win:5, fill:[120,140,205],fp:.55, key:[255,182,120],wall:[54,57,66],bar:1,dark:1},
  fuel:   {hc:2.9, win:6, fill:[255,170,64], fp:1.35,key:[255,200,120],wall:[80,72,58],bar:0},
  bazaar: {hc:4.0, win:0, fill:[255,196,140],fp:1.1, key:[255,206,150],wall:[82,64,54],bar:3,stalls:1}
};
/* места камеры: глаз, цель, поле зрения по вертикали на ПК (рад). Мерило «Сцены»: человек в 6–7 м
   от глаза — .18–.22 высоты кадра; глаз — у передней стены, место — общим планом, не портретом.
   Ключи — разделы ST_GROUPS и «site» */
const HALL_CAMS={
  board:{eye:[-1.9,1.6,5.4],   tgt:[-3.2,1.45,HALL_B],fy:1.1},
  trade:{eye:[-1.0,1.65,5.6],  tgt:[-5.3,1.3,.3],     fy:1.1},
  ship: {eye:[.6,1.55,5.8],    tgt:[1.3,1.95,HALL_B], fy:1.1},
  know: {eye:[-.2,1.6,4.6],    tgt:[1.2,1.0,-2.2],    fy:1.2},
  folk: {eye:[HALL_XB-.4,1.55,6.0],tgt:[HALL_XB-.2,1.2,-.6],fy:1.3},
  hold: {eye:[1.6,1.65,5.0],   tgt:[4.7,1.0,-1.6],    fy:1.05},
  site: {eye:[1.6,1.55,5.8],   tgt:[3.0,1.95,HALL_B], fy:1.1}
};
/* телефон: полоса шире, чем высока, — поле уже, ширина та же, что у героя на ПК (человек ~.33 полосы) */
const HALL_PH_FY=.62;
function hallMix3(a,b,k){return a.map((v,i)=>v+(b[i]-v)*k);}
function hallSm(a,b,x){x=clamp((x-a)/(b-a),0,1);return x*x*(3-2*x);}
/* ночь смены 0..1: HALL.night задаёт стенд и ?hallnight=0|1, иначе — часы станции */
function hallNight(){
  if(HALL.night!=null)return HALL.night;
  const s=(now()/HALL_DAY_MS+(((G.sys&&G.sys.seed)||0)%97)/97)%1;
  return hallSm(.6,.68,s)*(1-hallSm(.94,1,s));
}
/* пилот виден, если место раздела его знает и он не выключен (?hallpilot=0) */
function hallPilotAt(place){return HALL.pilot===false?null:(HALL_PILOT_AT[place]||null);}
/* доля высоты кадра под человеком (1.78 м) в точке x,z — мерило «Сцены» (.18–.22 на ПК) */
function hallManK(cam,x,z,ch){const a=r3Proj(cam.vp,[x,0,z],1,ch),b=r3Proj(cam.vp,[x,1.78,z],1,ch);return a&&b?(a[1]-b[1])/ch:0;}
/* высота лампы-ключа: чуть выше головы хозяина, в низком зале — под потолком */
function hallKeyY(T){return Math.min(T.hc-.62,2.36);}
function hallT(st){return HALL_TYPES[st]||HALL_TYPES.trade;}
function hallHasBar(st){const T=stTypeOf(st);return !!(T&&T.tabs&&T.tabs.indexOf("cantina")>=0);}
/* правая стена: с баром — за кантиной, без бара (заправка) — киоск короче */
function hallR(st){return hallHasBar(st)?HALL_XB+5.4:7.4;}
/* место раздела: СТРОЙКА — своё (окно, повёрнутое вправо), заправка без вкладок — стойка */
function hallPlaceOf(t){if(t==="site")return "site";if(t==="none"||!t)return "trade";return stGroupOf(t);}
/* доля зала на ПК — то же правило, что у вёрстки (style.css, M810): 40 %, но справа не меньше 880 px вёрстки */
function hallHero(w){const ui=(typeof UIK==="number"&&UIK>0)?UIK:1;return clamp((w-880*ui)/Math.max(1,w),.3,HALL_HERO);}
function hallWide(){return (typeof innerWidth==="number"?innerWidth:1280)>=900;}

/* ── камера: место → матрица; сдвиг оптики ставит цель посередине зоны героя ── */
function hallCam(c,w,h,wide){
  /* поле по вертикали одно на любой ширине ПК — доля человека не зависит от окна; сдвиг оптики
     ставит цель посередине зоны героя */
  const hh=hallHero(w),asp=w/Math.max(1,h),cx=wide?hh/2:.5,fy=c.fy*(wide?1:HALL_PH_FY);
  const P=r3Persp(fy,asp,.1,80);P[8]=-(2*cx-1);
  return {eye:c.eye,tgt:c.tgt,fy,asp,vp:r3Mul(P,r3Look(c.eye,c.tgt,[0,1,0]))};
}
/* дверь: первое открытие — наезд из глубины (от двери к месту), 900 мс */
function hallDoor(c){
  /* глаз и так у передней стены: вход — с высоты шага и с узкого поля, зал раскрывается */
  return {eye:[c.eye[0],c.eye[1]+.25,c.eye[2]],tgt:c.tgt.slice(),fy:c.fy*.8};
}
function hallEase(x){x=clamp(x,0,1);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;}
/* где камера в момент tm (мс настоящих часов: наезд — интерфейс, в паузе и на стенде игровые часы стоят): чистая функция — её меряет тест */
function hallGlideAt(tm){
  const A=HALL.from,B=HALL.to;if(!B)return null;if(!A)return B;
  const k=hallEase((tm-HALL.g0)/Math.max(1,HALL.gd)),m=(a,b)=>a.map((v,i)=>v+(b[i]-v)*k);
  return {eye:m(A.eye,B.eye),tgt:m(A.tgt,B.tgt),fy:A.fy+(B.fy-A.fy)*k,k};
}
function hallMoving(){return !!(HALL.to&&HALL.from&&wallMs()-HALL.g0<HALL.gd+40);}
/* вести камеру к месту; первое — от двери */
function hallGo(place,first){
  const c=HALL_CAMS[place]||HALL_CAMS.trade;
  const cur=first?hallDoor(c):(hallGlideAt(wallMs())||c);
  HALL.from={eye:cur.eye.slice(),tgt:cur.tgt.slice(),fy:cur.fy};HALL.to=c;HALL.g0=wallMs();HALL.gd=first?900:600;HALL.place=place;
}

/* ── раскладка: кто где стоит (чистый JS, без видеокарты) ── */
function hallLayout(st){
  const T=hallT(st),seed=((G.sys&&G.sys.seed)^0x4A11)>>>0,CS=CANT_STYLE[st]||CANT_STYLE.trade;
  const acc=hex2rgb(CS.acc),bar=hallHasBar(st),R=rng(seed^0x77);
  const L={st,T,seed,acc,bar,people:[],seats:[],bx:0,S:CS,stories:[],R:hallR(st)};
  /* хозяин стойки: в комбинезоне смотрителя, стоит за стойкой лицом в зал */
  const keep={seed:hashi(seed,0xC0E,1)>>>0,role:"keep",loy:64,xp:0,traits:[]};
  L.people.push({id:"hallkeep",m:keep,pose:"bar",x:-5.86,z:.62,yaw:Math.PI/2-.12,lod:1,kind:"keep"});
  /* бар: люди кантины на своих местах, сдвинутые в конец зала; кино и столики дел — забота M814 */
  if(bar&&typeof c3Layout==="function"){
    const cl=(G.cantina&&G.cantina.key===G.sys.key)?G.cantina.list:stationMgrs(G.sys);
    const free=cl.filter(m=>!G.mgrs.some(x=>x.seed===m.seed));
    const folk=(typeof folkShown==="function")?folkShown():null;
    const CL=c3Layout(1280,400,free,[],folk);
    L.seats=CL.seats;L.bx=CL.bx;L.stories=CL.stories;
    for(const P of CL.people){if(P.kind==="kino"||P.z<HALL_B+.35)continue;
      L.people.push(Object.assign({},P,{x:P.x+HALL_XB,id:P.id&&("bar:"+P.id)}));}
  }
  /* блошинец: у прилавков покупатели, дальняя толпа (LOD 0) */
  if(T.stalls){const n=3+((seed>>>3)%3);
    for(let i=0;i<n;i++){const s=HALL_STALLS[i%HALL_STALLS.length],side=i<HALL_STALLS.length?1:-1;
      L.people.push({id:null,m:{seed:hashi(seed,i,0xBA2)>>>0,loy:45+i*7,traits:[]},pose:i%2?"mug":"stand",
        x:s[0]+(R()-.5)*.5,z:s[1]+side*.95,yaw:side>0?Math.PI+(R()-.5)*.6:(R()-.5)*.6,lod:0,kind:"crowd"});}}
  L.people=L.people.slice(0,R3_MAXI-2);   /* последний экземпляр — пилот */
  for(const P of L.people)if(!P.mesh)P.mesh=cpMesh(P.m,P.pose,P.lod);
  L.rkey=st+"|"+seed+"|"+L.seats.length+"|"+L.bx.toFixed(2)+"|"+L.stories.map(s=>(s.props||[]).join(",")+":"+s.seat).join(";");
  return L;
}
/* прилавки блошинца: x, z (перед окном — низкие, навес выше луча к окну) */
const HALL_STALLS=[[-1.25,.55],[1.15,.55],[3.45,.55],[4.6,2.0],[6.5,2.0]];

/* ── свет и матрицы кадра ── */
const HALL_M=new Float32Array(R3_MAXI*R3_PART*16),HALL_OT=new Float32Array(R3_MAXI*R3_PART*4);
function hallLamps(L){   /* лампы над баром — x по стойке кантины, сдвинутые */
  const n=Math.min(3,L.T.bar),xs=[];for(let i=0;i<n;i++)xs.push(HALL_XB+C3_CL+.3+(C3_CR-C3_CL-.6)*(i+.5)/n);return xs;}
function hallScene(L,cam,t){
  const T=L.T,M=HALL_M,OT=HALL_OT,I=r3Xf([0,0,0]),acc=L.acc,hc=T.hc;
  for(let i=0;i<R3_MAXI*R3_PART;i++)M.set(I,i*16);OT.fill(0);
  /* зал: экземпляр 0; часть 1 — крюк крана или цепь стапеля, качается медленно */
  const hx=T.weld?3.6:2.4,hz=T.weld?-.6:.4;
  M.set(r3Pivot(I,[hx,hc,hz],0,.035*Math.sin(t*.37),.05*Math.sin(t*.29)),16);
  const draws=[[L.room,0,1]];let ii=1;
  for(const P of L.people){if(ii>=R3_MAXI)break;
    const ph=(P.m.seed%1000)*.0063,br=1+.006*Math.sin(t*1.6+ph),A=r3Xf([P.x,0,P.z],P.yaw);
    const B=r3Mul(A,[1,0,0,0, 0,br,0,0, 0,0,1,0, 0,0,0,1]),at=P.mesh.at;
    let hy,hp;
    if(P.kind==="keep"&&P.id==="hallkeep"){   /* хозяин поворачивает голову к камере, не дальше ±20° */
      const a=Math.atan2(cam.eye[0]-P.x,cam.eye[2]-P.z)-P.yaw,w=Math.atan2(Math.sin(a),Math.cos(a));
      hy=clamp(w,-.35,.35)+.04*Math.sin(t*.23+ph);hp=.03*Math.sin(t*.17+ph);}
    else{hy=.28*Math.sin(t*.21+ph*3)*Math.max(0,Math.sin(t*.09+ph));hp=.05*Math.sin(t*.17+ph);}
    M.set(B,(ii*R3_PART)*16);
    const Mh=r3Pivot(B,at.neck,hy,hp,0);M.set(Mh,(ii*R3_PART+1)*16);
    cpRig(M,ii*R3_PART,Mh,P.mesh,cpFace(P.m,null));
    for(let k=0;k<2;k++){let rA=B;if(P.kind==="keep"&&k===1)rA=r3Pivot(B,at.sh[1],.05*Math.sin(t*.7+ph),0,.02*Math.sin(t*1.3));
      M.set(rA,(ii*R3_PART+2+k)*16);}
    for(let p=0;p<R3_PART;p++)OT[(ii*R3_PART+p)*4+1]=P.dim||0;
    draws.push([P.mesh,ii,1]);P.ii=ii;ii++;}
  /* пилот: у места раздела, стоит, дышит; голова — к вещи места, не к камере */
  const pa=hallPilotAt(HALL.place);
  if(pa&&ii<R3_MAXI){const pm=cpMesh(HALL_PILOT_M,pa[3],1),A=r3Xf([pa[0],0,pa[1]],pa[2]),br=1+.006*Math.sin(t*1.5);
    const B=r3Mul(A,[1,0,0,0, 0,br,0,0, 0,0,1,0, 0,0,0,1]),Mh=r3Pivot(B,pm.at.neck,.06*Math.sin(t*.19),-.06+.03*Math.sin(t*.13),0);
    M.set(B,(ii*R3_PART)*16);M.set(Mh,(ii*R3_PART+1)*16);cpRig(M,ii*R3_PART,Mh,pm,cpFace(HALL_PILOT_M,null));
    for(let k=0;k<2;k++)M.set(B,(ii*R3_PART+2+k)*16);
    draws.push([pm,ii,1]);ii++;}
  /* свет: ключ над стойкой, заливка окна, (тени — у них), потом отсвет и своё у типа;
     ночью смены окно гаснет до звёзд, рассеянный падает, бра и ключ — люди работают — держат зал */
  const nk=hallNight(),day=1-nk;
  const lights=[],bulbs=[],key=r3Lin(T.key),fill=r3Lin(T.fill),dk=T.dark?1:0;
  const ky=hallKeyY(T);
  /* ключ: над краем стойки со стороны хозяина — лицо и столешница в одном луче */
  lights.push({p:[HALL_KEYX,ky,.62],range:6.5,c:r3Sc(key,dk?9:7.5),spot:1,d:[0,-1,0],cosO:Math.cos(.62),cosI:Math.cos(.3),shadow:1,vol:dk?.45:.22});
  bulbs.push([HALL_KEYX,ky,.62,dk?1.1:.9]);
  const wy=hallWinY(T),wc=[(HALL_WIN[0]+HALL_WIN[1])/2,(wy[0]+wy[1])/2+.25,HALL_B-.7];
  lights.push({p:wc,range:T.big?10:9,c:r3Sc(hallMix3(fill,[.35,.45,.9],nk),T.fp*2.2*(.04+.96*day)),spot:1,d:[0,-.8,.6],cosO:Math.cos(.52),cosI:Math.cos(.22),shadow:1,vol:T.win===1?.45*day:0});
  /* бар: лампы кантины, тень у двух ближних */
  if(L.bar){const LT=CANT_LIGHT[L.st]||CANT_LIGHT.trade,tone=r3Lin(mixc(LT.tone,acc,.25));
    hallLamps(L).forEach((x,i)=>{lights.push({p:[x,2.03+C3_LH,.12],range:5,c:r3Sc(tone,(L.st==="sci"?4.6:7.5)*LT.pow),spot:1,d:[0,-.97,.24],
      cosO:Math.cos(Math.min(1.35,.8*LT.cone)),cosI:Math.cos(Math.min(1.2,.42*LT.cone)),shadow:i<3?1:0,vol:L.st==="sci"?.25:.9});
      bulbs.push([x,2.03+C3_LH,.12,LT.pow*(L.st==="sci"?.4:1)]);});
    const fl=(Math.sin(t*.31+L.seed%7)>-.92)?1:.35;
    lights.push({p:[HALL_XB-1.55,2.26,HALL_B+.35],range:2.6,c:r3Sc(r3Lin(acc),1.5*fl),vol:.2});}
  /* доска — холодная полоса над ней; контора — настольная лампа (тёплая, малая) */
  lights.push({p:[-3.4,Math.min(hc-.3,2.85),HALL_B+.75],range:3.6,c:r3Sc(r3Lin(dk?[200,190,170]:[214,224,240]),(dk?.7:1.5)*(1-.45*nk)),spot:1,d:[0,-.8,-.6],cosO:Math.cos(1.05),cosI:Math.cos(.6),vol:0});
  /* бра над полкой за хозяином: второй слой — стена и товар за спиной, иначе хозяин висит в черноте.
     Стоит так, что в стекле окна его не видно ни с одного места камеры */
  if(!dk){lights.push({p:HALL_SCONCE,range:3.4+.8*nk,c:r3Sc(r3Lin(mixc(T.key,[255,190,120],.4)),1.5+1.1*nk),vol:0});bulbs.push([...HALL_SCONCE,.3+.2*nk]);}
  lights.push({p:[5.45,1.22,-1.95],range:2.4,c:r3Sc(key,dk?.8:1.15),vol:.15});bulbs.push([5.45,1.22,-1.95,.35]);
  /* отсвета от двери нет: лампа за спиной камеры зеркалилась в стекле окна «луной», а лицо выходило
     плоским, спереди. Стены держит небо (рассеянный свет), лица — один ключ сверху */
  /* своё у типа: трубчатые лампы комбината, сварка верфи (идёт по шву — движение, не мигание), лампы рядов */
  if(T.tube)for(const x of [-2.5,4.5])lights.push({p:[x,hc-.7,.9],range:8,c:r3Sc(r3Lin(T.tube),2.4),vol:.5});
  if(T.weld){const s=(t*.06)%1,x=2.8+1.6*s;lights.push({p:[x,1.75,.05],range:3.2,spot:1,d:[0,-.97,-.24],cosO:Math.cos(1.0),cosI:Math.cos(.5),
    c:r3Sc(r3Lin([170,205,255]),.75*(.85+.15*Math.sin(t*9.3))),vol:0});bulbs.push([x,1.31,-.27,.08]);}
  if(T.stalls)HALL_STALLS.slice(0,3).forEach((s,i)=>{const c=[[255,170,90],[120,220,190],[255,120,150]][i];
    lights.push({p:[s[0],2.25,s[1]],range:3,c:r3Sc(r3Lin(c),1.6),vol:.3});bulbs.push([s[0],2.25,s[1],.3]);});
  /* смыв задней стены: общий план — люди силуэтом на светлом, не в черноте; без тени, последним —
     если ламп у типа много, уходит он, а не ключ. Ночью гаснет вместе с окном */
  {const wt=r3Lin(mixc(T.key,[205,212,228],.55)),wp=(dk?1.25:2.4)*(.1+.9*day);
    for(const x of [-4.6,-2.2,5.0])lights.push({p:[x,hc-.25,HALL_B+1.5],range:6.5,c:r3Sc(wt,wp),spot:1,d:[0,-.5,-.87],
      cosO:Math.cos(1.25),cosI:Math.cos(.35),vol:0});}
  const fog=r3Lin(mixc(mixc(T.wall,T.key,.25),[40,48,70],.5*nk)),amb=(dk?.32:(T.win===1?.55:.62))*(1-.78*nk);
  const pl=HALL.orb&&HALL.orbTex?HALL.orb:null;
  return {draws,vp:cam.vp,cam:cam.eye,t,lights:lights.slice(0,R3_MAXL),bulbs,
    sky:[...r3Lin(mixc(T.wall,mixc([150,172,214],[80,100,170],nk),.55)),.8*amb],gnd:[...r3Lin(mixc(T.wall,[150,105,70],.45)),.08*(1-.6*nk)],
    fog:[...r3Sc(fog,.25),T.win===1?.055:dk?.04:.03],acc:[...r3Lin(acc),1],
    win:[HALL_WIN[0],wy[0],HALL_WIN[1],wy[1]],win2:[HALL_B,T.win,L.seed%47,T.win===1?1.15:1],
    sgn:[HALL_XB-2.6,2.1,HALL_XB-.5,2.42],sgn2:[HALL_B,1,0,0],
    flm:pl?pl.flm:[0,0,1,0],flm2:[HALL_B,0,pl?1:0,0],tsg:L.bar?C3.sign:null,tfl:pl?{view:HALL.orbTex.view}:null,M,ot:OT};
}
/* окно: проём по x и высоте (подоконник 1.2 м — мерило человека) */
const HALL_WIN=[-1.4,3.6];
function hallWinY(T){return [1.2,Math.min(T.hc-.38,3.25)];}
/* пределы движка для сцены: экземпляры, части, лампы, тени — для теста */
function hallLimits(S){
  let parts=0;for(const [m] of S.draws){if(!m||!m.v)continue;for(let i=11;i<m.v.length;i+=12)parts=Math.max(parts,(m.v[i]|0)&15);}
  return {inst:S.draws.length,parts:parts+1,lamps:S.lights.length,shadow:S.lights.filter(l=>l.shadow).length};
}

/* ── слова у вещей: табличка места на её вещи (доска, стойка, планета, верстак, контора) ──
   DOM над холстом зала, в герое; пока камера едет — таблички нет. Только подписи, без свободного текста */
function hallTagList(L,place){
  const out=[];
  if(place==="board")out.push({p:[-3.4,2.5,HALL_B+.05],t:"ДОСКА",s:"объявления станции"});
  if(place==="trade"){const ty=ST_TYPES.find(x=>x.id===L.st);out.push({p:[-4.9,1.02,2.2],t:"СТОЙКА",s:ty?ty.ru:"Блошиный ряд",dn:1});}
  if((place==="ship"||place==="site")&&HALL.orb&&HALL.orb.p){const f=HALL.orb.flm;
    out.push({p:[f[0]+f[2]*.62,f[1]+f[2]*.62,HALL_B-40],t:HALL.orb.p.name||"Планета",s:"за окном"});}
  if(place==="know")out.push({p:[1.0,1.12,-2.25],t:"ВЕРСТАК",s:"приборы"});
  if(place==="hold")out.push({p:[4.9,1.0,-1.7],t:"КОНТОРА",s:"владения"});
  return out;
}
function hallTagsDraw(L,cam,sz){
  const box=HALL.tags;if(!box)return;
  const ui=(typeof UIK==="number"&&UIK>0)?UIK:1,mv=hallMoving();
  /* поле табличек: на ПК — герой без запаса под ширину таблички, на телефоне — верх полосы над наездом плиты */
  const xr=sz.wide?hallHero(sz.cw)*sz.cw-200*ui:sz.cw-170,yr=sz.wide?sz.ch-60*ui:sz.ch*(24/36)-8;
  const list=mv?[]:hallTagList(L,HALL.place),key=list.map(x=>x.t+"/"+x.s).join("|");
  if(box.__key!==key){box.__key=key;box.textContent="";
    for(const g of list){const e=document.createElement("i"),b=document.createElement("b");e.className="ht";b.textContent=g.t;e.appendChild(b);
      if(g.s){const s=document.createElement("s");s.textContent=g.s;e.appendChild(s);}if(g.dn)e.classList.add("dn");box.appendChild(e);}}
  list.forEach((g,i)=>{const e=box.children[i],q=r3Proj(cam.vp,g.p,sz.cw,sz.ch);
    const ok=!!q&&q[0]>16*ui&&q[0]<xr&&(g.dn?q[1]>40*ui&&q[1]<yr-70*ui:q[1]>110*ui&&q[1]<yr);
    e.style.visibility=ok?"":"hidden";
    if(ok)e.style.transform="translate("+(q[0]/ui).toFixed(1)+"px,"+(q[1]/ui).toFixed(1)+"px) "+(g.dn?"translate(-1px,28px)":"translate(-1px,calc(-100% - 28px))");});
}

/* ── холст и цикл ── */
function hallCanvas(){
  let cn=document.getElementById("stHall");
  if(!cn){cn=document.createElement("canvas");cn.id="stHall";cn.setAttribute("aria-hidden","true");$st.insertBefore(cn,$st.firstChild);}
  let tg=document.getElementById("stHallTags");
  if(!tg){tg=document.createElement("div");tg.id="stHallTags";tg.setAttribute("aria-hidden","true");cn.after(tg);}
  HALL.cn=cn;HALL.tags=tg;return cn;
}
/* размер: на ПК — весь экран, на телефоне — полоса; плотность — не выше 1.25 на ПК (зал за плитой) */
function hallSize(cn){
  const wide=hallWide(),vw=innerWidth,vh=innerHeight,ui=(typeof UIK==="number"&&UIK>0)?UIK:1;
  const cw=vw,ch=wide?vh:Math.round(vh*HALL_STRIP);
  let dpr=Math.min(window.devicePixelRatio||1,wide?1.25:2);dpr=Math.min(dpr,Math.sqrt(2.6e6/Math.max(1,cw*ch)));
  const pw=Math.max(2,Math.round(cw*dpr)),ph=Math.max(2,Math.round(ch*dpr));
  if(cn.width!==pw||cn.height!==ph){cn.width=pw;cn.height=ph;}
  cn.__dpr=pw/cw;cn.style.width=(cw/ui)+"px";cn.style.height=(ch/ui)+"px";
  return {cw,ch,wide};
}
function hallOpen(){
  if(!HALL.on||typeof document==="undefined"||!$st)return;
  const cn=hallCanvas();$st.classList.add("hall");$st.classList.remove("up");
  HALL.open=true;HALL.L=null;HALL.orbKey="";HALL.orbTry=0;HALL.err=0;
  $body.querySelectorAll(".cant-stage").forEach(n=>n.remove());
  if(!$body.__hallScroll){$body.__hallScroll=1;
    $body.addEventListener("scroll",()=>{if(HALL.open)$st.classList.toggle("up",$body.scrollTop>8);},{passive:true});}
  hallGo(hallPlaceOf(tab),true);hallSize(cn);
  if(!HALL.raf&&typeof requestAnimationFrame==="function")HALL.raf=requestAnimationFrame(hallLoop);
}
function hallClose(){
  HALL.open=false;if(HALL.raf&&typeof cancelAnimationFrame==="function")cancelAnimationFrame(HALL.raf);HALL.raf=0;
  if(typeof document==="undefined"||!$st)return;
  $st.classList.remove("hall","up");
  if(HALL.tags){HALL.tags.textContent="";HALL.tags.__key="";}
  if(HALL.cn){r3Free(HALL.cn);}r3Drop(HALL.room);HALL.room=null;HALL.rkey="";
  if(HALL.orbTex&&HALL.orbTex.dev===GPU.dev)GPU.trash.push(HALL.orbTex.tex);HALL.orbTex=null;HALL.orb=null;
}
/* вкладка сменилась: камера — к месту раздела; полоса кантины не нужна — бар рисует зал */
function hallTab(){
  if(!HALL.open)return;
  $body.querySelectorAll(".cant-stage").forEach(n=>n.remove());
  const p=hallPlaceOf(tab);if(p!==HALL.place)hallGo(p,false);
  if(HALL.L&&HALL.L.st!==((G.st&&G.st.stype)||"trade"))HALL.L=null;
}
function hallLoop(){
  HALL.raf=0;
  if(!HALL.open||!HALL.cn||!HALL.cn.isConnected)return;
  const tw=wallMs();
  if(hallMoving()||tw-HALL.last>=1000/12-2){HALL.last=tw;
    try{hallFrame();}catch(e){HALL.err++;HALL.open=false;console.error("зал станции: кадр упал",e);return;}}
  HALL.raf=requestAnimationFrame(hallLoop);
}
/* кадр: раскладка по станции, сетка по ключу, свет и движение каждый кадр */
function hallFrame(){
  const cn=HALL.cn,st=(G.st&&G.st.stype)||"trade",sz=hallSize(cn);
  if(!HALL.L||HALL.L.st!==st)HALL.L=hallLayout(st);
  const L=HALL.L,R=rpgGet(cn);if(!R)return false;
  R.dpr=cn.__dpr;
  if(!HALL.room||HALL.rkey!==L.rkey){r3Drop(HALL.room);HALL.room=hallRoomMesh(L);HALL.rkey=L.rkey;}
  L.room=HALL.room;
  if(L.bar)c3SignTex(L.S);
  hallOrbUp(L);
  const c=hallGlideAt(wallMs())||HALL_CAMS.trade,cam=hallCam(c,sz.cw,sz.ch,sz.wide),t=wallMs()/1000;
  const S=hallScene(L,cam,t);
  const lab=rpgBake(R,"r3lab","hall|"+cn.width+"x"+cn.height,cn.width,cn.height,()=>{});
  const U=new Float32Array(60);
  S.bulbs.slice(0,6).forEach((b,i)=>{const q=r3Proj(cam.vp,b,sz.cw,sz.ch),q2=r3Proj(cam.vp,[b[0]+.05,b[1],b[2]],sz.cw,sz.ch);
    if(q&&q2&&q[2]>0)U.set([q[0],q[1]+2,Math.max(2,Math.abs(q2[0]-q[0])),b[3]],i*4);});
  const tl=r3Lin(L.T.key);U.set([tl[0],tl[1],tl[2],1.0],24);
  U[43]=t;U[44]=1;U[47]=1;
  HALL.frames++;HALL.stat=hallLimits(S);
  const k0=L.people[0],pa=hallPilotAt(HALL.place),f=sz.wide?sz.ch:sz.ch;
  HALL.meas={keep:k0?+hallManK(cam,k0.x,k0.z,f).toFixed(3):0,pilot:pa?+hallManK(cam,pa[0],pa[1],f).toFixed(3):0,night:+hallNight().toFixed(2)};
  hallTagsDraw(L,cam,sz);
  return r3Frame(cn,S,(pl,Sv,Vv,Bv)=>rpgField(R,pl,"r3post",R3_POST_WGSL,U,[Sv,lab,Vv,Bv]));
}
