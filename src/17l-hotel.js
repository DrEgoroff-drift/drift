/* ══════════════ гостиницы (M461, DESIGN-life §3.3) ══════════════
   Шесть типов советской архитектуры — по одному на хозяина полосы (автор 25.09):
   gt «Космос» — полумесяц со статуей; co «Аэлита™» — высотка на скале; or «Дом приезжих
   № 4» — хрущёвки на ферме; km «Юпитер» — конструктивизм; ra турбаза «Дружба» — кольцо на
   астероиде; hf «Буран» — модернизм с «тарелкой». Тип — свой файл 17l1…17l6: он кладёт в
   HOTEL_T кисть и мерки, ядро здесь — жизнь окон, выпечка по шагам, вывеска, общая
   причальная труба с челноком, стойка. Гостиница — дверь для тихих вещей, что уже есть:
   кино (27da), слухи кантины, номер. Доброта: корпус ниже трети — ночь даром, «потом заплатите».

   Стоит у людной станции (жизнь ≥ .45) по другую сторону полосы от щита. */
/* вывеска: имя — что горит (пробел — мёртвая буква), полное — стекло трубок целиком */
const HOTEL_SIGN={gt:"ГОС ИНИЦА «КОСМОС»",co:" ЭЛИТА™",or:"ДОМ ПРИЕЗЖИХ № 4",km:" ПИТЕР",ra:"ТУРБАЗА «ДРУЖБА»",hf:" УРАН"};
const HOTEL_SIGN_FULL={gt:"ГОСТИНИЦА «КОСМОС»",co:"АЭЛИТА™",or:"ДОМ ПРИЕЗЖИХ № 4",km:"ЮПИТЕР",ra:"ТУРБАЗА «ДРУЖБА»",hf:"БУРАН"};
const HOTEL_NIGHT=12;
const HOTEL_T={};   /* тип по хозяину: {W,H,PX,ax,ay,sign:[x,база,кегль]|null,sheen:[x,y,r],wins(sd),paint(c,e,sd,lit,Lt)} */
function hotelHere(){
  const sys=G.sys;if(!sys||!sys.station||typeof sysLane!=="function")return null;
  const P=sysLane(sys);if(!P||P.life<.45)return null;
  const d=LANE_DOCK+LANE_GAP*.4,sg=HOTEL_SIGN[P.by]||HOTEL_SIGN.gt;
  return {x:P.st.x+P.ux*d+P.uy*280*P.side,y:P.st.y+P.uy*d-P.ux*280*P.side,by:P.by,sign:sg,name:sg.trim()};
}
const hotelType=by=>HOTEL_T[by]||HOTEL_T.gt;
/* доля горящих окон по часу: вечером почти все, к ночи гаснут по одному, к утру редкие */
function hotelLitFrac(by,hr){
  if(by==="co")return .95;
  if(by==="or"&&(hr>=22||hr<6))return .04;
  const T=[.12,.08,.06,.05,.06,.15,.34,.40,.3,.18,.12,.12,.14,.14,.14,.16,.24,.34,.40,.42,.40,.36,.28,.20];   /* вечером горит треть: стена с окнами, не поле точек */
  return T[hr|0];
}
/* окно — часть комнаты (W[n][4]): у комнаты одно зерно-порог, её окна горят вместе; комната
   ≥9000 — зал на весь этаж (ресторан, холл): горит, пока в доме вечер. Раз в шесть секунд
   одна-две комнаты передумывают */
function hotelWinLit(W,sd,lit,flick){
  let m="";
  for(let n=0;n<W.length;n++){
    const q=W[n][4]!=null?W[n][4]:n;
    let on=q>=9000?lit>.3:((hashi(q,sd,0x407E)>>>0)%1000)/1000<lit;
    if(q<9000&&((hashi(q,flick,0xF11C)>>>0)%89)===0)on=!on;
    m+=on?"1":"0";
  }
  return m;
}
/* лампы окон: накаливание 2700–3000 K, последняя — холодная (телевизор, дневная лампа) */
const HOTEL_LAMP=[[255,166,84],[255,192,126],[170,196,240]];   /* два тёплых и редкий голубой — не конфетти */
const hotelLampOf=h=>h%23===0?2:(h>>>5)&1;
const HOTEL_CURT=["#e8b86a","#f0d49a","#d98d5a","#f4c2a8","#b8c8e8","#e0a0a0"];
const HOTEL_EM=1,HOTEL_NEON=1.2,HOTEL_SHEEN=.3;   /* отсвет — тронуть камень, не выбелить его */
/* мастер берётся на уровень крупнее (не мельче экрана): окна и рамы резкие */
const HOTEL_LOD=.5;
const HOTEL_GLOW="rgba(255,176,96,.7)";
/* ── выпечка: пять слоёв GPU-холста одного размера ──
   cv — дом, все окна погашены, и огни, что горят всегда; cl — только горящие окна (прозрачно
   вокруг): кадр кладёт поверх cv рамки тех окон, что горят сейчас, — смена часа и окно, что
   передумало, не печёт ничего; em, el — их свет (ореол — одна тень со всего слоя, пиксель в
   пиксель); sh — отсвет вывески: дом, умноженный на её цвет, круг от вывески гаснет к краю.
   Всё — шагами планировщика (17a0): кисть по кускам, потом по одной выпечке за шаг */
let HOTEL_BAKE=null;   /* {key,k0,a,cv,cl,em,el,sh,win,w,h} */
function hotelDrop(B){if(B)for(const q of [B.cv,B.cl,B.em,B.el,B.sh])gpuBakeDrop(q);}
/* ── свет дома: один ключ — звезда системы (стоит в (0,0)), направление к ней с экрана;
   заполняющий — холод неба. Кисть типа получает Lt = {lx,ly — к звезде; K — цвет звезды 0..1;
   F — цвет тени}. Направление в выпечке — ступенями по 30°: дом ходит по орбите со станцией,
   ступень сменяется раз в десятки минут; новая печётся по шагам за кадром, кадр до готовности
   кладёт старую (допекать целиком — только когда дома нет вовсе). Гистерезис: ступень держится,
   пока звезда не ушла от её середины дальше HOTEL_LTOL (шире полуступени: у кромки не дрожит) ── */
const HOTEL_FILL=[.30,.35,.54],HOTEL_KEY=.38,HOTEL_AMB=.5,HOTEL_LSTEP=TAU/12,HOTEL_LTOL=.36;
function hotelLight(Ht){
  let lx=-Ht.x,ly=-Ht.y;const n=Math.hypot(lx,ly);
  if(n<1e-6){lx=-.86;ly=-.51;}else{lx/=n;ly/=n;}
  const a0=Math.atan2(ly,lx),q=Math.round(a0/HOTEL_LSTEP),a=q*HOTEL_LSTEP;
  const c=hex2rgb((G.sys&&G.sys.cls&&G.sys.cls.col)||"#ffe08a"),m=Math.max(1,c[0],c[1],c[2]);
  return {lx:Math.cos(a),ly:Math.sin(a),a,a0,q:((q%12)+12)%12,K:[c[0]/m,c[1]/m,c[2]/m],F:HOTEL_FILL};
}
/* цвет грани: альбедо base (0..255) под ключом звезды с освещённостью s (0..1) и холодным
   заполняющим; warm — прибавка снизу (фонари площадки), 0..255 */
function hotelLit(Lt,base,s,warm){s=Math.max(0,s);
  return base.map((v,i)=>Math.min(255,v*(Lt.K[i]*HOTEL_KEY*s+Lt.F[i]*HOTEL_AMB)+(warm?warm[i]:0)));}
/* освещённость грани (общая для типов): нормаль в плане отклонена от зрителя на f (рад, + вправо);
   звезда стоит над плоскостью экрана на HOTEL_EL, поэтому фронт не чернеет и с тыла, а тень
   остаётся тенью. hotelUp/hotelDn — верхние и нижние грани (крыши, днища) */
const HOTEL_EL=.62,HOTEL_CE=Math.cos(HOTEL_EL),HOTEL_SE=Math.sin(HOTEL_EL);
const hotelN=(f,Lt)=>Math.max(0,Math.sin(f)*Lt.lx*HOTEL_CE+Math.cos(f)*HOTEL_SE);
const hotelUp=Lt=>Math.max(.12,-Lt.ly*HOTEL_CE+.25),hotelDn=Lt=>Math.max(.06,Lt.ly*HOTEL_CE+.1);
const hotelAngD=(a,b)=>{const d=(a-b)%TAU;return Math.abs(d>Math.PI?d-TAU:d<-Math.PI?d+TAU:d);};
function* hotelJob(T,sd,col,key,Lt){
  const w=Math.ceil(T.W*T.PX),h=Math.ceil(T.H*T.PX),B={key,k0:key.slice(0,key.lastIndexOf("|")),a:Lt.a,w,h},ok=[false];
  const rec=()=>{const g=new GcCtx(w,h,2),E=new GcCtx(w,h,2);g.scale(T.PX,T.PX);E.scale(T.PX,T.PX);return [g,E];};
  const glow=ops=>{const e0=gpuBake(w,h,g=>{g._ops.push(...ops);},{ss:2,mips:false});
    const r=gpuBake(w,h,g=>{g.shadowColor=HOTEL_GLOW;g.shadowBlur=1.2;g.drawImage(e0,0,0);},{ss:1});gpuBakeDrop(e0);return r;};
  try{
    const [g0,E0]=rec();yield* T.paint(g0,E0,sd,false,Lt);
    const [g1,E1]=rec();yield* T.paint(g1,E1,sd,true,Lt);
    B.cv=gpuBake(w,h,g=>{g._ops.push(...g0._ops);},{ss:2});yield;
    B.cl=gpuBake(w,h,g=>{g._ops.push(...g1._ops);},{ss:2});yield;
    B.em=glow(E0._ops);yield;
    B.el=glow(E1._ops);yield;
    /* multiply 2D на полупрозрачном прибавляет цвет градиента с весом 1−α дома, у GPU-холста
       этой части нет: дом на белом даёт её точно — s·(d+1−α); destination-in домом — тот же α.
       Пиксель в пиксель (ss 1): при ss 2 drawImage дома сводится — мыло */
    const [qx,qy,qr]=T.sheen.map(v=>v*T.PX),cv=B.cv;
    B.sh=gpuBake(w,h,g=>{g.fillStyle="#fff";g.fillRect(0,0,w,h);g.drawImage(cv,0,0);g.globalCompositeOperation="multiply";
      const gs=g.createRadialGradient(qx,qy,0,qx,qy,qr);gs.addColorStop(0,rgba(col,1));gs.addColorStop(.45,rgba(col.map(v=>v*.35),1));gs.addColorStop(1,"#000");
      g.fillStyle=gs;g.fillRect(0,0,w,h);g.globalCompositeOperation="destination-in";g.drawImage(cv,0,0);},{ss:1});
    /* рамки окон — в целых пикселях мастера (округление монотонно: соседние не наезжают) */
    B.win=T.wins(sd).map(b=>[...b.slice(0,4).map(v=>Math.round(v*T.PX)),b[4]]);
    ok[0]=true;return B;
  }finally{if(!ok[0])hotelDrop(B);}
}
/* готовые слои или null; пока не готовы — шаг планировщика (за краем экрана — заранее; sync — целиком) */
function hotelGet(T,by,sd,col,sync){
  const Ht=hotelHere();if(!Ht)return null;
  const Lt=hotelLight(Ht),k0=by+"|"+sd+"|"+col.join(),B0=HOTEL_BAKE,same=!!(B0&&B0.k0===k0&&B0.cv.dev===GPU.dev);
  if(same&&hotelAngD(Lt.a0,B0.a)<HOTEL_LTOL)return B0;
  const key=k0+"|"+Lt.q;
  const B=prebake("hotel|"+key,()=>hotelJob(T,sd,col,key,Lt),sync&&!same);   /* свет ушёл — печём новую ступень за кадром, старую кладём */
  if(B){hotelDrop(B0);HOTEL_BAKE=B;return B;}
  return same?B0:null;
}
/* горящие окна: маска и рамки — раз на смену часа и «передумавшее» окно, не каждый кадр */
let HOTEL_LIT=null;
function hotelLitRects(B,by,sd){
  const hr=((G.t%CEL_DAY)/CEL_DAY)*24,f=hotelLitFrac(by,hr),fl=Math.floor(G.t/60/6),key=B.key+"|"+f+"|"+fl;
  if(HOTEL_LIT&&HOTEL_LIT.key===key&&HOTEL_LIT.B===B)return HOTEL_LIT.R;
  const m=hotelWinLit(B.win,sd,f,fl),R=[],L=[],T=hotelType(by),hx=T.halo[0]*T.PX,hy=T.halo[1]*T.PX;
  for(let n=0;n<m.length;n++)if(m[n]==="1"){const w=B.win[n];R.push(w);
    L.push([Math.max(0,w[0]-hx),Math.max(0,w[1]-hy),Math.min(B.w,w[2]+hx),Math.min(B.h,w[3]+hy)]);}   /* свет окна с отсветом на стену */
  HOTEL_LIT={key,B,R:{R,L}};return HOTEL_LIT.R;
}
/* ── вывеска: неон 17k0 в мировом кегле (растёт с зумом). Печь — ступенями кегля через √2,
   между ступенями — масштаб ≤ √2: печей мало, буква не мылится ── */
function hotelNeon(Ht,T,k,col){
  if(!T.sign)return null;
  const F=T.sign[2]*k;if(F<3)return null;
  const Fb=Math.max(3,Math.round(Math.pow(2,Math.round(Math.log2(F)*4)/4)*2)/2);
  const N=neonBake("hotel",Ht.sign,HOTEL_SIGN_FULL[Ht.by]||Ht.sign,Fb,col,"alphabetic",{core:true});
  return N?{N,s:F/Fb}:null;
}
function hotelNeonDraw(pass,S,x,y,al,gain){
  const N=S.N,d=DPR,s=S.s,w=N.w*s,h=N.h*s,l=x-N.ax/d*s,t=y-N.ay/d*s,R=a=>[{x:l+w/2,y:t+h/2,w,h,a}];
  gpuImage(pass,N.al,R(al));gpuImage(pass,N.em,R(gain),{blend:"add"});
}
function drawHotel(zx,zy,Z){
  const Ht=hotelHere();if(!Ht)return;
  const T=hotelType(Ht.by);if(!T)return;
  const k=Math.max(.08,Z*.42),   /* мировой размер: растёт с зумом (втрое меньше первой пробы, автор 19.09) */
    ox=zx(Ht.x)-T.ax*k,oy=zy(Ht.y)-T.ay*k,w=T.W*k,h=T.H*k;
  const sd=G.sx*31+G.sy,col=(typeof laneLampCol==="function")?laneLampCol(Ht.by):[255,190,110];
  if(!pbOnScreen(ox,oy,w,h,1))return;
  const fa=clamp((Z-.3)/.2,0,1);
  /* за краем, но в экране от него — печём заранее по шагу за кадр: на глаза дом выходит готовым */
  if(!pbOnScreen(ox,oy,w,h,0)){const B0=HOTEL_BAKE,B=hotelGet(T,Ht.by,sd,col);
    if(B&&B===B0&&fa>0)hotelNeon(Ht,T,k,col);   /* вывеска — кадром позже дома, не в одном с ним */
    return;}
  const pass=gpuScene();if(!pass)return;
  const B=hotelGet(T,Ht.by,sd,col,true);if(!B)return;   /* на экране, а не готов — допекаем сразу (PB_SYNC), не проявляем из пустоты */
  const S=fa>0?hotelNeon(Ht,T,k,col):null;
  const {R:lit,L:lith}=hotelLitRects(B,Ht.by,sd),sx=w/B.w,sy=h/B.h;
  /* кусок мастера [x0,y0,x1,y1] (px) → прямоугольник на экране той же долей дома */
  const R=(Q,a)=>Q.map(q=>({x:ox+(q[0]+q[2])/2*sx,y:oy+(q[1]+q[3])/2*sy,w:(q[2]-q[0])*sx,h:(q[3]-q[1])*sy,a,
    u0:q[0]/B.w,v0:q[1]/B.h,u1:q[2]/B.w,v1:q[3]/B.h})),all=[[0,0,B.w,B.h]];
  const o={lod:HOTEL_LOD},ad={blend:"add",lod:HOTEL_LOD};
  gpuImage(pass,B.cv,R(all,1),o);
  if(S)gpuImage(pass,B.sh,R(all,HOTEL_SHEEN*fa),ad);
  /* горящие окна — поверх: стекло непрозрачно, замена точная (отсвет вывески на них не нужен — светят сами) */
  if(lit.length){gpuImage(pass,B.cl,R(lit,1),o);}
  gpuImage(pass,B.em,R(all,HOTEL_EM),ad);
  if(lith.length)gpuImage(pass,B.el,R(lith,HOTEL_EM),ad);
  if(S)hotelNeonDraw(pass,S,ox+T.sign[0]*k,oy+T.sign[1]*k,fa,HOTEL_NEON*fa);
}
/* ── общие куски кисти ── */
/* многоугольник по точкам [x,y,…] */
function hotelPoly(c,p){c.beginPath();c.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)c.lineTo(p[i],p[i+1]);c.closePath();}
/* дуга эллипса точками (a0→a1, n отрезков) — для обводов и заливок одной кистью */
function hotelArc(cx,cy,rx,ry,a0,a1,n){const P=[];for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n;P.push(cx+Math.cos(a)*rx,cy+Math.sin(a)*ry);}return P;}
/* обвод «много кусков — одно тело»: все массы тёмным с толстой линией, потом цвет поверх —
   остаётся один контур по краю объединения, швы внутри тела закрывает краска */
const HOTEL_RIM="rgba(22,18,16,.92)";
function hotelRim(c,polys,lw){c.fillStyle=HOTEL_RIM;c.strokeStyle=HOTEL_RIM;c.lineWidth=lw||1.2;c.lineJoin="round";
  for(const p of polys){hotelPoly(c,p);c.fill();c.stroke();}}
/* лампа: тело в краске, пятно света в слое свечения */
function hotelLamp(c,e,x,y,r,rgb,a){
  c.fillStyle=rgba(rgb.map(v=>Math.min(255,v+40)),1);c.beginPath();c.arc(x,y,r,0,TAU);c.fill();
  const g=e.createRadialGradient(x,y,0,x,y,r*3.2);g.addColorStop(0,rgba(rgb,a||.9));g.addColorStop(.35,rgba(rgb,(a||.9)*.35));g.addColorStop(1,rgba(rgb,0));
  e.fillStyle=g;e.fillRect(x-r*3.2,y-r*3.2,r*6.4,r*6.4);
}
/* окна: рамки [x0,y0,x1,y1]; lit — все горят (половина cl) или все погашены (cv).
   Одна заливка на цвет: сотни окон — десяток команд записи */
function hotelWindows(c,e,wins,sd,lit,dark,halo){
  halo=halo||[0,0];
  const G0={};const add=(k,f)=>{(G0[k]=G0[k]||[]).push(f);};
  wins.forEach((b,n)=>{const hh=hashi(n,sd,0x407E)>>>0,hr=hashi(b[4]!=null?b[4]:n,sd,0x407E)>>>0,[x0,y0,x1,y1]=b,w=x1-x0,h=y1-y0;
    if(lit){const L=hotelLampOf(hr);add("l"+L,[x0,y0,w,h]);add("h",[x0-halo[0],y0-halo[1],w+2*halo[0],h+2*halo[1]]);
      if(hh%3===0)add("c"+(hh>>>7)%HOTEL_CURT.length,[x0,y0,w*.32,h]);
      if(hh%11===0)add("s",[x0+w*.45,y0+h*.35,w*.3,h*.65]);}   /* силуэт жильца */
    else add("d"+(hh>>>9)%dark.length,[x0,y0,w,h]);});
  for(const k in G0){const R=G0[k];c.beginPath();for(const r of R)c.rect(r[0],r[1],r[2],r[3]);
    if(k[0]==="l"){const lc=HOTEL_LAMP[+k.slice(1)];c.fillStyle=rgba([lc[0]*.8,lc[1]*.58,lc[2]*.34],1);c.fill();   /* янтарь, не сливки: свет — в слое свечения */
      e.beginPath();for(const r of R)e.rect(r[0],r[1],r[2],r[3]);e.fillStyle=rgba(lc,.22);e.fill();}
    else if(k==="h"){e.beginPath();for(const r of R)e.rect(r[0],r[1],r[2],r[3]);e.fillStyle="rgba(255,170,90,.07)";e.fill();}
    else if(k[0]==="c"){c.fillStyle=HOTEL_CURT[+k.slice(1)];c.globalAlpha=.75;c.fill();c.globalAlpha=1;}
    else if(k==="s"){c.fillStyle="rgba(50,34,26,.6)";c.fill();}
    else{c.fillStyle=dark[+k.slice(1)];c.fill();}}
}
/* ── причальная труба с челноком: общая у всех типов. Труба от борта (x1,y1) к челноку
   (x0,y0), челнок носом в трубу, хвостом прочь. Свет — от звезды (Lt), как у дома: бок трубы
   и верх челнока к ней светлые ── */
function hotelDock(c,e,x1,y1,x0,y0,sd,Lt){
  Lt=Lt||{lx:-.86,ly:-.51,K:[1,.88,.54],F:HOTEL_FILL};
  const dx=x0-x1,dy=y0-y1,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,nx=-uy,ny=ux,r=3.6,ls=(nx*Lt.lx+ny*Lt.ly)>=0?1:-1;
  const at=(t,s)=>[x1+ux*t+nx*s,y1+uy*t+ny*s];
  const q=(t0,t1,s0,s1)=>{const a=at(t0,s0),b=at(t1,s0),cc=at(t1,s1),d=at(t0,s1);return [a[0],a[1],b[0],b[1],cc[0],cc[1],d[0],d[1]];};
  /* челнок: фюзеляж вдоль оси, крыло-треугольник вниз, киль вверх со звездой, три сопла */
  const sx=x0,sy=y0,B=40,sh=[   /* корпус */
    sx,sy-3.2, sx-4,sy-4.4, sx-B+4,sy-4.6, sx-B,sy-3.6, sx-B-1.2,sy+2, sx-B+2,sy+4.2, sx-6,sy+4, sx-1,sy+2.4],
    wing=[sx-12,sy+2.6, sx-B+6,sy+2.8, sx-B-3,sy+9.5, sx-B+9,sy+9.6],
    fin=[sx-B+9,sy-4.5, sx-B+2,sy-4.5, sx-B-3,sy-16, sx-B+.5,sy-16];
  hotelRim(c,[q(-2,L,-r,r),sh,wing,fin],1.2);
  /* труба: тело, кольца, лента иллюминаторов (горят всегда) */
  const tg=c.createLinearGradient(...at(0,r*ls),...at(0,-r*ls)),TB=[214,206,192];
  tg.addColorStop(0,rgba(hotelLit(Lt,TB,1),1));tg.addColorStop(.45,rgba(hotelLit(Lt,TB,.55),1));tg.addColorStop(1,rgba(hotelLit(Lt,TB,.05),1));
  c.fillStyle=tg;hotelPoly(c,q(-2,L,-r,r));c.fill();
  c.fillStyle="rgba(30,26,22,.55)";c.beginPath();
  for(let t=4;t<L-2;t+=7){const p=q(t,t+1.2,-r,r);c.moveTo(p[0],p[1]);for(let i=2;i<8;i+=2)c.lineTo(p[i],p[i+1]);c.closePath();}
  c.fill();
  c.fillStyle="rgba(235,228,212,.5)";c.beginPath();
  for(let t=4;t<L-2;t+=7){const p=q(t+1.2,t+1.7,-r,r*.2);c.moveTo(p[0],p[1]);for(let i=2;i<8;i+=2)c.lineTo(p[i],p[i+1]);c.closePath();}
  c.fill();
  c.beginPath();e.beginPath();
  for(let t=6;t<L-4;t+=7){const p=q(t,t+3.6,-.9,.7);for(const g of [c,e]){g.moveTo(p[0],p[1]);for(let i=2;i<8;i+=2)g.lineTo(p[i],p[i+1]);g.closePath();}}
  c.fillStyle="#f2c27a";c.fill();e.fillStyle="rgba(255,190,110,.55)";e.fill();
  c.fillStyle="#6a655e";hotelPoly(c,q(-2,2.5,-r-1.6,r+1.6));c.fill();   /* воротник у борта */
  c.fillStyle="#a39c90";hotelPoly(c,q(-2,2.5,-r-1.6,-r+.2));c.fill();
  /* челнок */
  const bg=Lt.ly>0?c.createLinearGradient(0,sy+4.2,0,sy-4.6):c.createLinearGradient(0,sy-4.6,0,sy+4.2),SB=[236,230,220];
  bg.addColorStop(0,rgba(hotelLit(Lt,SB,1),1));bg.addColorStop(.55,rgba(hotelLit(Lt,SB,.6),1));bg.addColorStop(1,rgba(hotelLit(Lt,SB,.1),1));
  c.fillStyle="#57534d";hotelPoly(c,wing);c.fill();
  c.fillStyle="#8e887e";hotelPoly(c,[sx-12,sy+2.6,sx-B+6,sy+2.8,sx-B+2,sy+5,sx-14,sy+3.6]);c.fill();
  c.fillStyle=bg;hotelPoly(c,sh);c.fill();
  c.fillStyle="#d8d2c6";hotelPoly(c,fin);c.fill();
  c.fillStyle="#a8322a";hotelPoly(c,[sx-3,sy-.4,sx-B+1,sy-.2,sx-B,sy+1.1,sx-3,sy+.9]);c.fill();   /* красная полоса */
  c.fillStyle="#a8322a";hotelPoly(c,[sx-B+4,sy-9,sx-B+1.2,sy-9,sx-B-1.6,sy-15.6,sx-B+.6,sy-15.6]);c.fill();
  hotelStar(c,sx-B+.4,sy-11.8,1.6,"#e7c56a");
  c.fillStyle="#2a3038";hotelPoly(c,[sx-4.5,sy-3.9,sx-9,sy-4.3,sx-9.4,sy-2.6,sx-5,sy-2.4]);c.fill();   /* остекление кабины */
  c.fillStyle="rgba(200,220,240,.5)";c.fillRect(sx-8.6,sy-4,1.6,.6);
  c.fillStyle="#3a3632";c.fillRect(sx-B-2.6,sy-2.8,1.8,5.8);   /* сопла: три раструба и жар */
  for(const oy of [-1.6,0,1.6]){hotelLamp(c,e,sx-B-3.2,sy+oy+.2,.7,[255,200,140],.95);}
  c.strokeStyle="rgba(40,36,32,.5)";c.lineWidth=.3;c.beginPath();
  for(const t of [10,20,30]){c.moveTo(sx-t,sy-4.4);c.lineTo(sx-t,sy+3.8);}c.stroke();   /* швы обшивки */
  hotelLamp(c,e,sx-B+.2,sy-16.4,.45,[255,60,50],.9);   /* красный огонь на киле */
}
/* пятиконечная звезда */
function hotelStar(c,x,y,r,fill){c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,q=i%2?r*.42:r;
  if(i)c.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q);else c.moveTo(x+Math.cos(a)*q,y+Math.sin(a)*q);}c.closePath();c.fillStyle=fill;c.fill();}
/* ── стойка ── */
function hotelInteract(sh){
  const Ht=hotelHere();if(!Ht)return false;
  if(Math.hypot(sh.x-Ht.x,sh.y-Ht.y)>150)return false;
  const board=Ht.by==="gt"?" · МЕСТ НЕТ":"";
  const shown=cue(Ht.name+board+"\nДЕЙСТВИЕ — К СТОЙКЕ",CUE_ACT);
  if(shown&&actEdge)hotelDesk(Ht);
  return true;
}
function hotelDesk(Ht){
  const hm=stat().hullMax,low=G.hull<hm/3;
  const free=low;                                   /* доброта: ниже трети — даром */
  if(!free&&G.credits<HOTEL_NIGHT){say((Ht.by==="gt"?"«Мест нет.»":"«Номер — "+HOTEL_NIGHT+" кр.»")+"\nне хватает",110);return;}
  if(!free)G.credits-=HOTEL_NIGHT;
  const heal=Math.round(hm*.1);G.hull=Math.min(hm,G.hull+heal);
  const greet=Ht.by==="gt"?"«Мест нет. …Для вас найдём.»":Ht.by==="co"?"«Номер категории Партнёр™. Завтрак — отдельно.»":
    Ht.by==="or"?"«Отбой в 22:00. Подъём в 6:00.»":Ht.by==="km"?"«Ключ под ковриком, мы на собрании.»":
    Ht.by==="ra"?"«Ложись где свободно, брат.»":"«Ваш номер рассчитан.»";
  logAdd("good",Ht.name+": ночь в номере"+(free?" — даром, «потом заплатите»":" · −"+HOTEL_NIGHT+" кр")+" · корпус +"+heal+" за ночь стоянки");
  say(greet+(free?"\n«…потом заплатите»":""),150);
  if(typeof kinoHere==="function"&&kinoHere())peopleLine("в холле афиша: сегодня кино. Идите, пока не началось.","портье",false);
}
