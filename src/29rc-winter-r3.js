/* ══════════════ зимовка на движке (M850c, docs/DESIGN-rooms.md §4) ══════════════
   Та же комната, что в 29g, — сценой рендера интерьеров 27f2 во весь экран под приборами. Логика не правится:
   рычаги, поломки, стена, дневник, смена — 29f/29g; здесь только как это выглядит и куда попадает палец.

   ПРАВИЛА ФАЙЛА:
   1. Мерило — человек 1.75 м. Каюта 7.2 × 3.6 м, потолок 2.6 — низкая, жилая; снята прямо, разрезом спереди.
   2. Свет — это приборы. Лампа над столом — СВЕТ: её сила = рычаг, тень от неё. Печь — ТЕПЛО: тёплая заливка
      с дрожью огня (вторая тень). Окно — метель, холод, не выключается. Полоса реактора — четвёртый, малый.
      Убавил лампу — комнату видно хуже по-настоящему: баланс видно глазами, не цифрой.
   3. Смена сдана — свет гаснет, зимовщик на койке, объектив едет к нему; свет снова (WIN3_SLEEP).
   4. Слова — на вещах: «СДАТЬ СМЕНУ» — табличка на койке, «ТРОНЬТЕ» — на лампочке поломки, сутки — тусклая надпись
      над календарём; обратного отсчёта нет и здесь (правило 29f).
   5. Попадание пальцем — из тех же вещей: их рамки проецируются в кадр (winHit за швом); старый художник
      drawWinter живёт за ROOM3.on (?room=0). */
const WIN3={cn:null,tags:null,mesh:null,mkey:"",t0:0,err:0,frames:0,stat:null,vp:null,sz:null,meas:null,hit:[],sl:0,storm:null};
const WIN3_L=-3.6,WIN3_R=3.6,WIN3_B=-1.8,WIN3_F=1.8,WIN3_H=2.6;
const WIN3_M=new Float32Array(R3_MAXI*R3_PART*16),WIN3_OT=new Float32Array(R3_MAXI*R3_PART*4);
/* где что стоит: панель на задней стене слева, печь у левой стены, трубы, календарь, стол с лампой, койка под окном */
const WIN3_PX=-2.05,WIN3_PY=1.38,WIN3_TX=.45,WIN3_TZ=-1.05,WIN3_BX=2.45,WIN3_BZ=-1.38,WIN3_WIN=[1.75,3.15,1.05,2.0];
const WIN3_SLEEP=2600;   /* мс: свет гаснет, хозяин на койке, свет снова */
const WIN3_PARKA=[168,86,46];   /* парка — вещь человека, значит оранжевое (палитра «Сцены») */

function win3LeverX(i){return WIN3_PX-.65+.1625+i*.325;}
function win3Val(W,k){return clamp(W.pw[k]|0,0,3);}
/* сила метели за окном: от суток, не из сохранения */
function win3Storm(W){return .3+.65*rng(hashi(W.day|0,(W.sx|0)*31+(W.sy|0),0x5E0))();}

/* ── сетка каюты (меняется только рычагом, поломкой или сутками) ── */
function win3Mesh(W){
  const K=r3Kit(),P=R3P,L=WIN3_L,R=WIN3_R,B=WIN3_B,F=WIN3_F,H=WIN3_H;
  const li=win3Val(W,"light"),he=win3Val(W,"heat"),cap=winCap(W),dr=winDraw_(W),over=dr>cap;
  const Mw=K.mt([88,98,102],.25,6,P.wall),Mcut=K.mt([22,24,26],.2,4,0),Mfl=K.mt([78,70,60],.3,7,P.floor),Mce=K.mt([70,76,80],.2,5,P.ceil);
  const Mst=K.mt([84,92,98],.55,10,P.brushed),Mdk=K.mt([24,27,30],.4,8,P.brushed),Mir=K.mt([34,32,30],.5,8,P.brushed);
  const Mwd=K.mt([104,76,52],.3,7,P.wood),Mpa=K.mt([214,204,182],.1,3,0);
  K.part=0;
  /* коробка: задняя стена с окном, боковые, пол и потолок — плитами, их срез спереди тёмный (видно, что это разрез) */
  hallWall(K,L,R,0,H,B,[[WIN3_WIN[0],WIN3_WIN[1],WIN3_WIN[2],WIN3_WIN[3]]],Mw);
  K.quad([L,0,F],[L,0,B],[L,H,B],[L,H,F],Mw,[1,0,0]);
  K.quad([R,0,B],[R,0,F],[R,H,F],[R,H,B],Mw,[-1,0,0]);
  K.quad([L,0,F],[R,0,F],[R,0,B],[L,0,B],Mfl,[0,1,0]);
  K.quad([L,H,B],[R,H,B],[R,H,F],[L,H,F],Mce,[0,-1,0]);
  K.box([0,-.15,F+.01],[R+.2,.15,.012],Mcut,0);K.box([0,H+.15,F+.01],[R+.2,.15,.012],Mcut,0);
  for(const s of [-1,1])K.box([s*(R+.1),H/2,F+.01],[.1,H/2+.3,.012],Mcut,0);
  /* рёбра потолка и плинтус: каюта собрана из панелей, а не отлита */
  for(let x=-2.4;x<=2.41;x+=1.2)K.box([x,H-.06,(B+F)/2],[.05,.06,(F-B)/2],Mst,.01);
  K.box([0,.05,B+.02],[R,.05,.02],Mdk,.005);
  /* окно: проём узора window (метель), рама, подоконник с намётом */
  {const [x0,x1,y0,y1]=WIN3_WIN,z=B,fw=.016;
    K.quad([x0,y0,z+.01],[x1,y0,z+.01],[x1,y1,z+.01],[x0,y1,z+.01],K.mt([3,3,3],.2,70,P.window,0,true),[0,0,1]);
    K.box([(x0+x1)/2,y0-.03,z+.1],[(x1-x0)/2+.08,.03,.11],Mst,.01);
    K.box([(x0+x1)/2,y0+.012,z+.05],[(x1-x0)/2-.02,.012,.03],K.mt([210,220,232],.2,4,0),.008);
    K.box([(x0+x1)/2,y1+.04,z+.05],[(x1-x0)/2+.06,.04,.06],Mst,.008);
    for(let i=0;i<=2;i++){const x=x0+(x1-x0)*i/2;K.box([x,(y0+y1)/2,z+.05],[fw*(i%2?1:2.2),(y1-y0)/2,.05],Mst,.004);}
    K.box([(x0+x1)/2,(y0+y1)/2,z+.04],[(x1-x0)/2,fw*.8,.04],Mst,.003);}
  /* трубы: три стояка по стене и магистраль поверху — станция вокруг есть, её просто не видно */
  for(const [x,r] of [[-1.12,.05],[-.98,.035],[-.87,.035]]){K.tube([[x,0,B+.12],[x,H,B+.12]],r,Mst,10);
    for(const y of [.4,1.3,2.2])K.box([x,y,B+.06],[r+.015,.02,.06],Mdk,.004);}
  K.tube([[-1.12,H-.28,B+.12],[R,H-.28,B+.12]],.05,Mst,10);
  /* панель: плита, полоса реактора (делений ровно cap, горят по нагрузке), четыре циферблата и рычага */
  const zf=B+.15;
  K.box([WIN3_PX,WIN3_PY,B+.08],[.65,.6,.07],K.mt([46,54,58],.4,8,P.brushed),.02);
  K.box([WIN3_PX,WIN3_PY+.5,zf+.004],[.56,.04,.006],Mdk,0);
  for(let i=0;i<cap;i++){const w=1.08/cap,x=WIN3_PX-.54+w*(i+.5),on=i<dr;
    K.box([x,WIN3_PY+.5,zf+.012],[w/2-.008,.028,.006],on?K.mt(over?[255,96,70]:[255,196,120],.2,4,0,over?3.2:2.4,true):K.mt([60,70,76],.2,4,0),0);}
  WIN3_LEV.forEach((k,i)=>{const cx=win3LeverX(i),v=win3Val(W,k),low=v<WIN_MIN[k];
    /* циферблат: стрелка от −135° до +135° по значению; ниже нормы — красная */
    K.push([cx,WIN3_PY+.24,zf+.008]);K.ell([0,0,0],[.092,.092,.012],Mdk,4,16);
    K.ell([0,0,.006],[.078,.078,.01],K.mt([30,34,36],.3,6,0),4,16);
    const th=(-.75+v/3*1.5)*Math.PI;K.push([0,0,.018],0,0,-th);K.box([0,.035,0],[.0055,.042,.003],K.mt(low?[255,110,90]:[255,214,160],.2,4,0,2.2,true),0);K.pop();K.pop();
    /* рычаг: шарнир внизу, наклон — значение */
    const a=(v/3-.5)*1.15,px=cx,py=WIN3_PY-.42,hx=px+Math.sin(a)*.26,hy=py+Math.cos(a)*.26;
    K.box([px,py,zf+.012],[.11,.018,.012],Mdk,.004);
    K.tube([[px,py,zf+.03],[hx,hy,zf+.05]],.011,K.mt([96,112,124],.6,12,P.brushed),8);
    K.ell([hx,hy,zf+.05],[.028,.028,.028],low?K.mt([206,84,64],.4,9,0,.4):K.mt([150,160,166],.5,10,0),6,10);});
  /* лампочки поломок справа от панели: горят, пока не починены (их свет — в сцене) */
  (W.faults||[]).forEach((f,i)=>{const x=WIN3_PX+.8+i*.14,y=WIN3_PY+.36;
    K.ell([x,y,B+.06],[.05,.05,.03],Mdk,5,12);K.ell([x,y,B+.09],[.034,.034,.03],K.mt([255,70,50],.3,8,0,4.5,true),5,12);});
  /* печь у левой стены: тело, ножки, дверца с огнём (сила — ТЕПЛО), плита, чайник, дымоход в стену */
  {const x=-3.05,z=-.55,fire=he/3;
    K.box([x,.52,z],[.3,.4,.3],Mir,.03);for(const sx of [-1,1])for(const sz of [-1,1])K.box([x+sx*.24,.06,z+sz*.24],[.03,.06,.03],Mir,.006);
    K.box([x,.94,z],[.33,.02,.33],Mdk,.006);
    K.box([x,.46,z+.305],[.15,.12,.008],K.mt([255,140,60],.2,4,0,.4+3.2*fire,true),0);
    K.box([x,.46,z+.31],[.17,.14,.006],Mdk,0);K.box([x,.62,z+.31],[.17,.008,.01],Mst,0);
    K.push([x+.08,.96,z-.04]);K.lathe([[0,.07],[.1,.085],[.16,.06],[.19,.02]],12,K.mt([78,90,96],.6,11,P.brushed));K.pop();
    K.tube([[x-.08,.96,z-.1],[x-.08,2.2,z-.1],[x-.08,2.2,B+.1]],.065,Mir,10);}
  /* календарь: тридцать клеток, прожитые зачёркнуты крестом (рука — каждый крест чуть другой), сегодня — кружок */
  {const cx=-.42,cy=1.55,z=B+.012;
    K.box([cx,cy,z],[.18,.24,.004],Mpa,0);K.box([cx,cy+.17,z+.005],[.17,.004,.002],K.mt([150,136,110],.1,3,0),0);
    K.ell([cx,cy+.26,z+.01],[.01,.01,.01],Mst,4,8);
    const Mx=K.mt([70,62,52],.1,3,0);
    for(let i=0;i<30;i++){const x=cx-.15+(i%6)*.06+.03,y=cy+.12-Math.floor(i/6)*.065-.03;
      if(i<W.day-1){const j=(hashi(i,W.sx|0,0x0C11)>>>0)/4294967296;
        for(const s of [-1,1]){K.push([x,y,z+.006],0,0,s*(.75+j*.2));K.box([0,0,0],[.026,.0025,.001],Mx,0);K.pop();}}
      else if(i===W.day-1)K.ell([x,y,z+.006],[.014,.014,.002],K.mt([196,84,58],.2,3,0),3,10);}}
  /* стол, лампа над ним (СВЕТ: выключена — колба тёмная), дневник раскрытый, кружка, табурет */
  {const x=WIN3_TX,z=WIN3_TZ;
    K.box([x,.76,z],[.62,.025,.36],Mwd,.008);for(const sx of [-1,1])for(const sz of [-1,1])K.box([x+sx*.56,.37,z+sz*.3],[.025,.37,.025],Mwd,.004);
    hallShade(K,x,2.0,z+.05,li>0?mixc([255,214,160],[255,236,200],li/3):[40,36,32],H,li===0);
    for(const s of [-1,1]){K.push([x-.12+s*.105,.792,z+.06],-.08);K.box([0,0,0],[.1,.007,.14],Mpa,.002);K.pop();}
    K.box([x-.12,.787,z+.06],[.21,.004,.145],K.mt([86,52,40],.3,5,P.leather),0);
    K.push([x+.32,.785,z-.1]);K.lathe([[0,.04],[.1,.042],[.105,.038]],12,K.mt([176,182,186],.4,9,0));K.pop();
    K.tube([[x+.36,.81,z-.1],[x+.39,.835,z-.1],[x+.36,.86,z-.1]],.007,K.mt([176,182,186],.4,9,0),5);
    K.push([x+.15,0,z+.62]);K.lathe([[.46,0],[.46,.17],[.5,.17],[.51,0]],14,Mwd);K.pop();
    for(let a=0;a<3;a++){const t=a/3*TAU+.5;K.tube([[x+.15+Math.cos(t)*.15,0,z+.62+Math.sin(t)*.15],[x+.15+Math.cos(t)*.11,.46,z+.62+Math.sin(t)*.11]],.018,Mwd,5);}}
  /* койка под окном: рама, матрас, одеяло (вещь человека — тёплое), подушка у окна */
  {const x=WIN3_BX,z=WIN3_BZ;
    K.box([x,.32,z],[.98,.05,.4],Mst,.01);for(const sx of [-1,1])K.box([x+sx*.95,.36,z+.36],[.03,.36,.03],Mst,.005);
    K.box([x,.43,z],[.95,.065,.38],K.mt([150,146,132],.1,3,P.cloth),.03);
    K.box([x-.18,.505,z+.02],[.72,.025,.39],K.mt([132,62,42],.1,3,P.cloth),.02);
    K.ell([x+.72,.54,z-.02],[.2,.06,.15],K.mt([200,196,184],.1,3,P.cloth),6,12);}
  return K.pack();
}
const WIN3_LEV=WIN_USE;

/* ── человек: стоит у панели, рука к рычагу; спит — на боку, лицом в комнату ── */
function win3Pilot(W){const m=Object.assign({},home3PilotM(),{jac:WIN3_PARKA});
  m.mood=(W.faults||[]).length?"angry":win3Val(W,"heat")<WIN_MIN.heat?"sad":null;return m;}
function win3Man(M,ii,m,mesh,A,t,look){
  const ph=(m.seed%1000)*.0063,br=1+.006*Math.sin(t*1.6+ph);
  const Bm=r3Mul(A,[1,0,0,0, 0,br,0,0, 0,0,1,0, 0,0,0,1]),at=mesh.at;
  let hy=.18*Math.sin(t*.19+ph*3)*Math.max(0,Math.sin(t*.08+ph));
  if(look){const p=r3Pt(A,[0,0,0]),yaw=Math.atan2(A[8],A[10]),a=Math.atan2(look[0]-p[0],look[2]-p[2])-yaw;hy=clamp(Math.atan2(Math.sin(a),Math.cos(a)),-.6,.6);}
  M.set(Bm,(ii*R3_PART)*16);
  const Mh=r3Pivot(Bm,at.neck,hy,.04*Math.sin(t*.17+ph),0);M.set(Mh,(ii*R3_PART+1)*16);
  cpRig(M,ii*R3_PART,Mh,mesh,cpFace(m,null));
  for(let k=0;k<2;k++)M.set(Bm,(ii*R3_PART+2+k)*16);
}
/* фаза сна 0..1 (0 — не спит) и свет комнаты в ней: гаснет к середине, возвращается */
function win3SleepPh(){if(!WIN3.sl)return 0;const p=(wallMs()-WIN3.sl)/WIN3_SLEEP;if(p>=1){WIN3.sl=0;return 0;}return Math.max(0,p);}
function win3Fade(p){return p<=0?1:1-.86*Math.sin(Math.PI*p);}

function win3Scene(cam,t){
  const W=winAll(),M=WIN3_M,OT=WIN3_OT,I=r3Xf([0,0,0]),B=WIN3_B;
  for(let i=0;i<R3_MAXI*R3_PART;i++)M.set(I,i*16);OT.fill(0);
  const draws=[[WIN3.mesh,0,1]],sp=win3SleepPh(),f=win3Fade(sp),m=win3Pilot(W);
  if(sp>0){const mesh=cpMesh(m,"stand",1);win3Man(M,1,m,mesh,r3Xf([WIN3_BX-.9,.74,WIN3_BZ+.04],0,0,-Math.PI/2),t,null);draws.push([mesh,1,1]);WIN3.man=[WIN3_BX,WIN3_BZ];}
  else{const mesh=cpMesh(m,"frame",1),x=-1.5,z=-.72;
    win3Man(M,1,m,mesh,r3Xf([x,0,z],-1.95),t,cam.eye);draws.push([mesh,1,1]);WIN3.man=[x,z];}
  const li=win3Val(W,"light"),he=win3Val(W,"heat"),over=winOver(W),lights=[],bulbs=[];
  /* ключ — лампа над столом (СВЕТ), с тенью; выключена — её нет */
  if(li>0){lights.push({p:[WIN3_TX,1.97,WIN3_TZ+.05],range:5.5+li*.6,c:r3Sc(r3Lin([255,206,150]),(1.6+2.2*li)*f),spot:1,d:[0,-1,.12],
    cosO:Math.cos(1.15),cosI:Math.cos(.5),shadow:1,vol:.06+.02*li,key:1});bulbs.push([WIN3_TX,1.96,WIN3_TZ+.05,.35+.2*li]);}
  /* печь — ТЕПЛО: тёплая заливка у пола, огонь дрожит (движение, а не мигание) */
  if(he>0){const fl=1+.07*Math.sin(t*7.3)+.05*Math.sin(t*12.7+1.3)+.04*Math.sin(t*3.1);
    lights.push({p:[-2.82,.5,-.1],range:3.2+he*.7,c:r3Sc(r3Lin([255,138,62]),(.7+1.1*he)*fl*f),shadow:li>0?0:1,vol:.03,key:li>0?0:1});
    bulbs.push([-3.05,.46,-.23,.25+.2*he]);}
  /* окно — холод метели: конусом в комнату, на пол у койки; не выключается */
  lights.push({p:[2.45,1.7,B+.3],range:6.5,c:r3Sc(r3Lin([140,170,214]),2.0*f),spot:1,d:[-.25,-.55,.8],cosO:Math.cos(1.0),cosI:Math.cos(.4),vol:.05});
  /* реактор — полоса светит на плиту панели; перегрузка красная */
  lights.push({p:[WIN3_PX,WIN3_PY+.5,B+.45],range:1.3,c:r3Sc(r3Lin(over?[255,80,60]:[255,190,120]),.5*f),vol:0});
  (W.faults||[]).forEach((q,i)=>{lights.push({p:[WIN3_PX+.8+i*.14,WIN3_PY+.36,B+.3],range:1.1,c:r3Sc(r3Lin([255,60,40]),.5*f),vol:0});bulbs.push([WIN3_PX+.8+i*.14,WIN3_PY+.36,B+.12,.5]);});
  /* слабая заливка от разреза: человек не чёрная вырезка, даже когда игрок погасил всё */
  lights.push({p:[0,2.2,WIN3_F+2.6],range:9,c:r3Sc(r3Lin([150,166,190]),.55*f),spot:1,d:[0,-.25,-.97],cosO:Math.cos(.8),cosI:Math.cos(.3),vol:0});
  const st=WIN3.storm!=null?WIN3.storm:win3Storm(W),sky=r3Lin([70,82,96]),gnd=r3Lin([70,58,46]),fog=r3Lin([40,46,56]);
  return {draws,vp:cam.vp,cam:cam.eye,t,lights:lights.slice(0,R3_MAXL),bulbs,
    sky:[...sky,(.35+.12*li)*f],gnd:[...gnd,.05],fog:[...r3Sc(fog,.2),.04],acc:[...r3Lin([255,170,90]),1],
    win:[WIN3_WIN[0],WIN3_WIN[2],WIN3_WIN[1],WIN3_WIN[3]],win2:[B,8,Math.min(.999,st),.9*(.3+.7*f)],sgn:[0,0,0,0],sgn2:[B,0,0,0],
    flm:[0,0,1,0],flm2:[B,0,0,0],tsg:null,tfl:null,M,ot:OT};
}

/* ── холст, камера, кадр ── */
function win3Canvas(){
  let cn=WIN3.cn;
  if(!cn||!cn.isConnected){cn=document.getElementById("win3d")||document.createElement("canvas");cn.id="win3d";cn.setAttribute("aria-hidden","true");
    cn.style.cssText="position:fixed;left:0;top:0;pointer-events:none";(GPU.cv||document.body.firstChild).after(cn);WIN3.cn=cn;}
  let tg=WIN3.tags;
  if(!tg||!tg.isConnected){tg=document.getElementById("win3Tags")||document.createElement("div");tg.id="win3Tags";tg.setAttribute("aria-hidden","true");cn.after(tg);WIN3.tags=tg;}
  cn.style.display="";tg.style.display="";return cn;
}
/* станции: каюта прямо (на телефоне — дальше и выше, панель—стол в кадре); сон — объектив к койке */
const WIN3_CAMS={pc:{eye:[.1,1.65,4.7],tgt:[-.1,1.15,-1.6],fy:.74},ph:{eye:[-.7,2.1,5.9],tgt:[-.7,1.0,-1.4],fy:1.15},
  pcS:{eye:[1.9,1.55,2.6],tgt:[2.45,.62,-1.4],fy:.74},phS:{eye:[2.1,2.0,4.2],tgt:[2.3,.62,-1.4],fy:1.1}};
function win3Cam(sz,t){
  const ph=!sz.wide,A=WIN3_CAMS[ph?"ph":"pc"],S=WIN3_CAMS[ph?"phS":"pcS"],p=win3SleepPh();
  const k=p<=0?0:p<.3?r3Step(0,.3,p):p<.7?1:1-r3Step(.7,1,p);
  const L=(a,b)=>a.map((v,i)=>v+(b[i]-v)*k);
  const c={eye:L(A.eye,S.eye),tgt:L(A.tgt,S.tgt),fy:A.fy+(S.fy-A.fy)*k};
  const e=[c.eye[0]+.02*Math.sin(t*.31),c.eye[1]+.012*Math.sin(t*.23),c.eye[2]];
  const P=r3Persp(c.fy,sz.cw/Math.max(1,sz.ch),.1,90);
  return {eye:e,tgt:c.tgt,fy:c.fy,vp:r3Mul(P,r3Look(e,c.tgt,[0,1,0]))};
}
function win3Ok(){return ROOM3.on&&typeof document!=="undefined"&&!!(GPU&&GPU.dev&&GPU.ok)&&!WIN3.err;}
function win3Frame(){
  const W=winAll(),cn=win3Canvas(),sz=home3Size(cn),R=rpgGet(cn);if(!R)return false;
  R.dpr=cn.__dpr;
  const mk=WIN_USE.map(k=>win3Val(W,k)).join("")+"|"+W.day+"|"+(W.faults||[]).map(f=>f.k).join(",")+"|"+winCap(W);
  if(!WIN3.mesh||WIN3.mkey!==mk){r3Drop(WIN3.mesh);WIN3.mesh=win3Mesh(W);WIN3.mkey=mk;}
  const t=wallMs()/1000,cam=win3Cam(sz,t),S=win3Scene(cam,t);
  const lab=rpgBake(R,"r3lab","win3|"+cn.width+"x"+cn.height,cn.width,cn.height,()=>{});
  const U=new Float32Array(60);
  S.bulbs.slice(0,6).forEach((b,i)=>{const q=r3Proj(cam.vp,b,sz.cw,sz.ch),q2=r3Proj(cam.vp,[b[0]+.05,b[1],b[2]],sz.cw,sz.ch);
    if(q&&q2&&q[2]>0)U.set([q[0],q[1]+2,Math.max(2,Math.abs(q2[0]-q[0])),b[3]],i*4);});
  U.set([...r3Lin([255,200,140]),1.0],24);
  U[43]=t;U[44]=1;U[47]=1;
  const oq=r3Proj(cam.vp,cam.tgt,sz.cw,sz.ch);U.set([oq?oq[0]/sz.cw:.5,oq?oq[1]/sz.ch:.5,HALL_CA,1],48);
  U.set([1,sz.ch/sz.cw,HALL_SHARP,1],52);
  WIN3.frames++;WIN3.stat=hallLimits(S);WIN3.vp=cam.vp;WIN3.sz=sz;
  const m=WIN3.man;WIN3.meas={man:m?+hallManK(cam,m[0],m[1],sz.ch).toFixed(3):0,light:win3Val(W,"light"),heat:win3Val(W,"heat"),sleep:+win3SleepPh().toFixed(2)};
  WIN3.hit=win3Hits(W,cam,sz);
  room3TagsDraw(win3Tags(W,sz),cam,{cw:sz.cw,ch:sz.ch,wide:sz.wide,xr:sz.cw-12,yr:sz.ch-(sz.wide?150:230)},WIN3.tags,win3SleepPh()>0);
  return r3Frame(cn,S,(pl,Sv,Vv,Bv)=>rpgField(R,pl,"r3post",R3_POST_WGSL,U,[Sv,lab,Vv,Bv]));
}
/* слова на вещах (правило 4) */
function win3Tags(W,sz){const B=WIN3_B,out=[],F=W.faults||[];
  out.push({p:[-.6,2.02,B+.02],t:"СУТКИ "+W.day+" ИЗ "+W.days,s:(W.pname||"").toUpperCase(),c:"sg"});
  if(sz.wide)WIN3_LEV.forEach((k,i)=>out.push({p:[win3LeverX(i)-.14,WIN3_PY-.5,B+.16],t:WIN_RU[k],s:"",c:"sg"}));
  if(F.length){const f=WIN_FAULT_BY[F[0].k];out.push({p:[WIN3_PX+.8,WIN3_PY+.42,B+.1],t:"ТРОНЬТЕ",s:f?f.ru:"",c:""});}
  out.push({p:[WIN3_BX-.3,.6,WIN3_BZ+.3],t:"СДАТЬ СМЕНУ",s:"",c:F.length?"sg":""});
  return out;}
/* куда попадает палец: рамки вещей, спроецированные в кадр (CSS px); порядок — как в winHit */
function win3Box(cam,sz,c,h){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9,ok=0;
  for(const sx of [-1,1])for(const sy of [-1,1])for(const sz2 of [-1,1]){const q=r3Proj(cam.vp,[c[0]+sx*h[0],c[1]+sy*h[1],c[2]+sz2*h[2]],sz.cw,sz.ch);
    if(!q)continue;ok++;x0=Math.min(x0,q[0]);y0=Math.min(y0,q[1]);x1=Math.max(x1,q[0]);y1=Math.max(y1,q[1]);}
  return ok?{x0,y0,x1,y1}:null;}
function win3Hits(W,cam,sz){const B=WIN3_B,out=[],add=(k,id,c,h,pad)=>{const b=win3Box(cam,sz,c,h);if(b){const p=pad||0;out.push({k,id,x0:b.x0-p,y0:b.y0-p,x1:b.x1+p,y1:b.y1+p});}};
  (W.faults||[]).forEach((f,i)=>add("fix",f.k,[WIN3_PX+.8+i*.14,WIN3_PY+.36,B+.08],[.06,.06,.04],10));
  WIN3_LEV.forEach((k,i)=>add("lever",k,[win3LeverX(i),WIN3_PY-.05,B+.15],[.155,.5,.05]));
  add("panel",null,[WIN3_PX,WIN3_PY,B+.1],[.65,.6,.08]);
  add("wall",null,[-.75,1.3,B+.1],[.5,1.3,.1]);
  add("diary",null,[WIN3_TX,.55,WIN3_TZ],[.62,.4,.36]);
  add("bunk",null,[WIN3_BX,.4,WIN3_BZ],[.98,.3,.4]);
  return out;}
function win3Hit(mx,my){const k=innerWidth/Math.max(1,W),x=mx*k,y=my*k;
  for(const h of WIN3.hit)if(x>=h.x0&&x<=h.x1&&y>=h.y0&&y<=h.y1)return h.id!=null?{k:h.k,id:h.id}:{k:h.k};
  return null;}
function win3Hide(){
  if(WIN3.cn&&WIN3.cn.style.display!=="none"){WIN3.cn.style.display="none";r3Free(WIN3.cn);}
  if(WIN3.tags&&WIN3.tags.style.display!=="none"){WIN3.tags.style.display="none";WIN3.tags.textContent="";WIN3.tags.__key="";}
  if(WIN3.mesh){r3Drop(WIN3.mesh);WIN3.mesh=null;WIN3.mkey="";}
  WIN3.hit=[];WIN3.sl=0;
}
win3Frame=hallCostWrap(win3Frame);
function win3Cost(sec){return WIN3.cn&&WIN3.cn.style.display!=="none"?hallCost(sec,()=>win3Frame(),WIN3.cn):Promise.resolve(null);}
function win3On(){return !!(WIN3.cn&&WIN3.cn.style.display!=="none"&&WIN3.hit.length);}

/* ── швы: кадр (28), попадание (15 → winTap → winHit), смена (сон) ── */
{const f0=drawWinter;drawWinter=function(){
  if(!win3Ok()||!G.win)return f0();
  try{win3Frame();}catch(e){WIN3.err++;console.error("зимовка: кадр упал",e);win3Hide();return f0();}};}
{const f0=drawWorldIn;drawWorldIn=function(){f0();if(WIN3.cn&&!(G.mode==="winter"&&G.win&&win3Ok()))win3Hide();};}
{const f0=winHit;winHit=function(mx,my){return win3On()?win3Hit(mx,my):f0(mx,my);};}
{const f0=winShift;winShift=function(){const r=f0();if(r&&win3On())WIN3.sl=wallMs();return r;};}
