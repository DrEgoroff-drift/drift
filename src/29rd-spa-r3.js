/* ══════════════ санаторий на движке (M850d, docs/DESIGN-rooms.md §4) ══════════════
   Та же веранда, что в 29i, — сценой рендера интерьеров 27f2 во весь экран под приборами. Логика не правится:
   распорядок, соседи, сон, отъезд — 29h; здесь только как это выглядит и куда попадает палец.

   ПРАВИЛА ФАЙЛА:
   1. Противоположность зимовке: там одна тёмная каюта, здесь открытая веранда над морем, и свет — солнце.
      Мерило — человек 1.75 м; палуба 10 × 8 м, перила 1 м, за ними море до горизонта (окно kind 9).
   2. Свет один — солнце, ключ с тенью. Над задней половиной палубы пергола из реек: полосы света лежат на досках
      и ползут с солнцем. День идёт сам, пока игрок сидит на веранде (SPA3_DAYMS: утро — полдень — вечер,
      дальше вечер стоит); сон возвращает утро. Это только свет: исходов от него нет (правило 1 файла 29h).
      Заливка — небо и блеск моря; тёплый отсвет досок снизу.
   3. Люди генератора: хозяин у перил (lean), лицом к нам, рубашка; сосед полулёжа в шезлонге (recline).
   4. Слова — на вещах: распорядок мелом на грифельном щите у перил (вычеркнутое — чертой), «СПАТЬ» — табличка
      на пустом шезлонге. Строка подсказки молчит: глагол ДЕЙСТВИЯ остаётся кнопке.
   5. Попадание пальцем — из тех же вещей: строки щита, стакан на перилах, шахматы, сосед, перила (прогулка),
      пустой шезлонг (сон); рамки проецируются в кадр.
   6. 2D-веранды нет (22.10, автор: «2D не должно быть»): старый художник 29i удалён вместе с ?room=0 и ?spa3=0.
      Без видеокарты кадра нет — плашка «нет WebGPU» (08b2); сбой кадра называет страж (28-loop). */
/* профиль токарки K.lathe — пары [y, r] */
const SPA3={cn:null,tags:null,mesh:null,mkey:"",err:0,frames:0,stat:null,vp:null,sz:null,meas:null,hit:[],sl:0,day:0,dt0:0,board:null,bkey:""};
const SPA3_L=-4.6,SPA3_R=6,SPA3_B=-2.2,SPA3_F=6.5;
const SPA3_DAYMS=240000;   /* мс на веранде от утра до вечера */
const SPA3_SLEEP=2600;
const SPA3_M=new Float32Array(R3_MAXI*R3_PART*16),SPA3_OT=new Float32Array(R3_MAXI*R3_PART*4);
/* где что стоит */
const SPA3_BD={x:-2.75,z:-1.75,w:1.15,y0:1.02,y1:2.32};   /* грифельный щит на столбе у перил */
const SPA3_MAN=[-1.35,-1.87],SPA3_TB=[-.15,-.35],SPA3_CH1=[1.75,.15],SPA3_CH2=[3.15,.75],SPA3_GL=[-.72,-2.15];
const SPA3_SHIRT=[206,198,178],SPA3_Y1=-1.9,SPA3_Y2=-2.2;   /* шезлонги боком к объективу: сосед в профиль, а не спинкой */

/* фаза дня 0..1: от часов на веранде; S.sun (стенд, тест) — как есть */
function spa3Sun(S){
  if(S&&S.sun!=null)return clamp(+S.sun,0,1);
  const w=wallMs();if(!SPA3.dt0||SPA3.day!==(S?S.day:0)){SPA3.dt0=w;SPA3.day=S?S.day:0;}
  return clamp(.1+.8*(w-SPA3.dt0)/SPA3_DAYMS,0,.9);
}
/* солнце: азимут слева направо над морем, высота — дугой; утром и вечером диск низко в проёме, цвет тёплый у низкого
   (та же формула — в окне kind 9 27f2: диск и дорожка блеска стоят там, откуда светит ключ) */
function spa3SunDir(s){const hs=Math.sin(Math.PI*s),az=(s-.5)*.5,el=.02+.9*hs*hs*hs;
  const ce=Math.cos(el);return [Math.sin(az)*ce,Math.sin(el),-Math.cos(az)*ce];}
function spa3SunCol(s){const k=Math.sin(Math.PI*s);return mixc([255,150,84],[255,244,226],clamp(k*1.6-.45,0,1));}

/* ── сетка веранды (меняется только щитом и сном) ── */
function spa3Mesh(S,sl){
  const K=r3Kit(),P=R3P,L=SPA3_L,R=SPA3_R,B=SPA3_B,F=SPA3_F;
  const Mdeck=K.mt([170,132,92],.08,8,P.wood),Mseam=K.mt([60,44,32],.1,4,0),Mrail=K.mt([226,218,198],.2,6,0);
  const Mwd=K.mt([150,110,72],.15,7,P.wood),Mwall=K.mt([214,206,186],.12,5,P.wall),Mbelt=K.mt([206,98,40],.2,5,0);
  const Mdk=K.mt([40,42,46],.3,7,P.brushed),Mcl1=K.mt([232,226,210],.06,3,P.cloth),Mcl2=K.mt([62,128,138],.06,3,P.cloth);
  K.part=0;
  /* море — одна карта окна за перилами (и справа, где палуба кончается) */
  const Mwin=K.mt([3,3,3],0,1,P.window,0,true);   /* окно моря без блеска: иначе заливка из-за спины отражается в нём вторым солнцем */
  K.quad([-30,-8,B-.6],[40,-8,B-.6],[40,14,B-.6],[-30,14,B-.6],Mwin,[0,0,1]);
  K.quad([R+.7,-8,B-.6],[R+.7,-8,F+4],[R+.7,14,F+4],[R+.7,14,B-.6],Mwin,[-1,0,0]);
  /* палуба: доски к морю, швы; торец над водой */
  K.quad([L,0,F],[R,0,F],[R,0,B],[L,0,B],Mdeck,[0,1,0]);
  for(let x=L+.16;x<R;x+=.16)K.box([x,.0015,(B+F)/2],[.0035,.0015,(F-B)/2],Mseam,0);
  K.box([(L+R)/2,-.12,B+.02],[(R-L)/2,.12,.04],Mwd,.01);
  /* стена корпуса слева: кремовые панели, пояс цвета людей, дверь в корпус и окно с тёплым светом */
  {const x=L;K.quad([x,0,F],[x,0,B],[x,3.4,B],[x,3.4,F],Mwall,[1,0,0]);
    K.box([x+.01,.95,(B+F)/2],[.006,.05,(F-B)/2],Mbelt,0);
    K.box([x+.04,1.05,1.6],[.04,1.05,.5],K.mt([110,84,60],.2,6,P.wood),.01);
    K.box([x+.06,1.0,1.95],[.02,.03,.03],Mdk,.005);
    for(let z=-1.6;z<F;z+=1.2)K.box([x+.008,1.7,z],[.004,1.7,.006],K.mt([150,144,128],.1,4,0),0);}
  /* перила: столбы через 1.2 м, поручень трубой, две жерди; справа — вдоль края палубы */
  for(let x=L+.1;x<=R+.01;x+=1.18){K.box([x,.5,B+.05],[.04,.5,.04],Mrail,.008);}
  for(let z=B+1.2;z<=F;z+=1.2)K.box([R-.05,.5,z],[.04,.5,.04],Mrail,.008);
  K.tube([[L,1.02,B+.05],[R-.05,1.02,B+.05],[R-.05,1.02,F]],.035,Mrail,8);
  for(const y of [.35,.68])K.tube([[L,y,B+.05],[R-.05,y,B+.05],[R-.05,y,F]],.016,Mrail,6);
  /* пергола из реек над задней половиной: столбы, два прогона, рейки вдоль перил — полосы тени на досках */
  {const z0=B+.1,z1=.9,y0=2.62,y1=2.9;
    /* столбы: у перил через пролёт, спереди — только по краям (иначе столб встаёт между объективом и людьми) */
    for(const x of [L+.3,-.6,3.1,R-.3])K.box([x,y0/2,z0],[.06,y0/2,.06],Mwd,.01);
    for(const x of [L+.3,R-.3])K.box([x,y1/2,z1],[.06,y1/2,.06],Mwd,.01);
    for(const x of [L+.3,-.6,3.1,R-.3])K.tube([[x,y0+.06,z0],[x,y1+.06,z1]],.05,Mwd,6);
    for(const z of [z0,z1])K.box([(L+R)/2,(z===z0?y0:y1)+.13,z],[(R-L)/2,.07,.05],Mwd,.01);
    for(let i=0;i<=11;i++){const k=i/11,z=z0+(z1-z0)*k,y=y0+(y1-y0)*k+.23;K.box([(L+R)/2,y,z],[(R-L)/2+.15,.04,.022],Mwd,.004);}}
  /* щит распорядка: столб, рама, грифель (вывеска 27f2: мел — маской текста) */
  {const b=SPA3_BD,cx=b.x,w=b.w/2,h=(b.y1-b.y0)/2,cy=(b.y0+b.y1)/2;
    K.box([cx,b.y0/2,b.z-.04],[.05,b.y0/2,.05],Mwd,.01);
    K.box([cx,cy,b.z-.02],[w+.05,h+.05,.025],Mwd,.01);
    K.quad([cx-w,b.y0,b.z+.008],[cx+w,b.y0,b.z+.008],[cx+w,b.y1,b.z+.008],[cx-w,b.y1,b.z+.008],K.mt([20,22,22],.1,5,P.sign),[0,0,1]);
    K.box([cx,b.y0-.03,b.z+.04],[w,.012,.03],Mwd,.004);}
  /* стакан с кислородной пеной на поручне */
  {const [x,z]=SPA3_GL;K.push([x,1.055,z]);K.lathe([[0,0],[0,.032],[.15,.036],[.16,.038]],12,K.mt([200,216,220],.7,40,P.glass));K.pop();
    K.push([x,1.19,z]);K.lathe([[.035,0],[.0,.034],[.03,.03],[.045,0]],10,K.mt([244,240,228],.05,3,0));K.pop();}
  /* шахматный стол: круглый, доска 8×8, недоигранная партия */
  {const [x,z]=SPA3_TB;K.push([x,0,z]);K.lathe([[.7,.0],[.7,.42],[.67,.42],[.66,.05],[.04,.04],[.02,.24],[0,.24]],16,Mwd);K.pop();
    const c=.04,Mw=K.mt([226,214,190],.2,6,0),Mb=K.mt([70,46,34],.2,6,0);
    for(let i=0;i<8;i++)for(let j=0;j<8;j++)K.box([x-.14+i*c,.705,z-.14+j*c],[c/2,.003,c/2],(i+j)%2?Mb:Mw,0);
    const rp=rng(hashi(S.seed|0,S.day|0,0xC55));
    for(let n=0;n<11;n++){const i=Math.floor(rp()*8),j=Math.floor(rp()*8),wh=n%2,tall=.03+rp()*.04;
      K.push([x-.14+i*c,.708,z-.14+j*c]);K.lathe([[0,0],[0,.013],[tall*.6,.008],[tall,.01],[tall+.008,0]],8,wh?Mw:K.mt([30,26,24],.4,9,0));K.pop();}
    /* две табуретки: круглое сиденье на трёх ножках */
    for(const s of [-1,1]){const cx=x+s*.62,cz=z+.05;K.push([cx,0,cz]);K.lathe([[.43,0],[.43,.17],[.46,.17],[.46,0]],12,Mwd);K.pop();
      for(let a=0;a<3;a++){const t=a/3*TAU+s;K.tube([[cx+Math.cos(t)*.15,0,cz+Math.sin(t)*.15],[cx+Math.cos(t)*.11,.43,cz+Math.sin(t)*.11]],.016,Mwd,5);}}}
  /* шезлонги: рама, полосатое полотно; на пустом — сложенное полотенце */
  for(const [cx,cz,yaw,towel] of [[SPA3_CH1[0],SPA3_CH1[1],SPA3_Y1,0],[SPA3_CH2[0],SPA3_CH2[1],SPA3_Y2,1]]){
    K.push([cx,0,cz],yaw);
    const seg=[[0,.32,.95],[0,.34,.35],[0,.33,-.15],[0,.95,-.62]];
    for(const s of [-1,1]){K.tube(seg.map(p=>[s*.27,p[1]-.02,p[2]]),.016,Mwd,6);
      K.tube([[s*.27,0,.9],[s*.27,.32,.95]],.016,Mwd,5);K.tube([[s*.27,0,-.4],[s*.27,.33,-.15]],.016,Mwd,5);K.tube([[s*.27,0,.1],[s*.27,.66,-.4]],.016,Mwd,5);}
    for(let i=0;i<seg.length-1;i++)for(let k=0;k<5;k++){const a=seg[i],b=seg[i+1],x0=-.25+k*.1,x1=x0+.1;
      K.quad([x0,a[1],a[2]],[x1,a[1],a[2]],[x1,b[1],b[2]],[x0,b[1],b[2]],k%2?Mcl2:Mcl1,null);}
    if(towel&&!sl)K.box([0,.37,.55],[.2,.03,.14],K.mt([214,96,60],.05,3,P.cloth),.02);
    K.pop();}
  return K.pack();
}

/* ── люди ── */
function spa3Pilot(){const b=home3PilotM(),g=cpGene(b),m=Object.assign({},b,{jac:SPA3_SHIRT,mood:"glad"});
  if(g.style===4||g.style===5)m.style=1;   /* у моря без капюшона и без шлема */
  return m;}
function spa3Folk(S){return {seed:(hashi(S.seed|0,7,0x5A3)>>>0),loy:62,traits:[],jac:[104,128,140],mood:"glad"};}

function spa3SleepPh(){if(!SPA3.sl)return 0;const p=(wallMs()-SPA3.sl)/SPA3_SLEEP;if(p>=1){SPA3.sl=0;return 0;}return Math.max(0,p);}
function spa3Fade(p){return p<=0?1:1-.8*Math.sin(Math.PI*p);}

function spa3Scene(cam,t,S){
  const M=SPA3_M,OT=SPA3_OT,I=r3Xf([0,0,0]);
  for(let i=0;i<R3_MAXI*R3_PART;i++)M.set(I,i*16);OT.fill(0);
  const draws=[[SPA3.mesh,0,1]],f=spa3Fade(spa3SleepPh()),s=spa3Sun(S),sd=spa3SunDir(s),sc=spa3SunCol(s),hi=Math.sin(Math.PI*s);
  /* хозяин у перил; спит — в своём шезлонге, веки сомкнуты */
  {const m=spa3Pilot(),zz=spa3SleepPh()>0,mesh=cpMesh(m,zz?"recline":"rail",1);m.zz=zz?1:0;
    win3Man(M,1,m,mesh,zz?r3Xf([SPA3_CH2[0],0,SPA3_CH2[1]],SPA3_Y2):r3Xf([SPA3_MAN[0],0,SPA3_MAN[1]],.12),t,zz?null:cam.eye);draws.push([mesh,1,1]);}
  {const m=spa3Folk(S),mesh=cpMesh(m,"recline",1);win3Man(M,2,m,mesh,r3Xf([SPA3_CH1[0],0,SPA3_CH1[1]],SPA3_Y1),t,null);draws.push([mesh,2,1]);}
  const lights=[],D=26,c0=[-.3,0,-.5];
  /* солнце — ключ с тенью: далёкий прожектор на палубу */
  lights.push({p:[c0[0]+sd[0]*D,c0[1]+sd[1]*D,c0[2]+sd[2]*D],range:D*1.6,c:r3Sc(r3Lin(sc),D*D*(2.7-.9*hi)*f),spot:1,d:[-sd[0],-sd[1],-sd[2]],
    cosO:Math.cos(.3),cosI:Math.cos(.26),shadow:1,vol:0,key:1});
  /* блеск моря — холодная заливка спереди-снизу; отсвет досок — тёплая снизу; корпус за спиной — мягкий свет в лица */
  lights.push({p:[0,-.4,B3()-3],range:16,c:r3Sc(r3Lin([150,186,210]),9*f),spot:1,d:[0,.25,1],cosO:Math.cos(1.1),cosI:Math.cos(.5),vol:0});
  lights.push({p:[0,.25,0],range:9,c:r3Sc(r3Lin(mixc([214,170,120],sc,.3)),1.4*f),vol:0});
  lights.push({p:[.5,2.4,9],range:16,c:r3Sc(r3Lin([210,214,220]),8*f),spot:1,d:[0,-.2,-1],cosO:Math.cos(.7),cosI:Math.cos(.3),vol:0});
  /* ключ на лицо и плечи хозяина: под перголой солнце до него не доходит, и лицо выходило плоским, кукольным.
     Узкий тёплый прожектор сбоку-сверху, без тени: лепит щёку, нос и плечо. Дальность кончается сразу за ним —
     иначе конус ложится на окно моря ореолом вокруг головы */
  if(spa3SleepPh()<=0){const hx=SPA3_MAN[0],hz=SPA3_MAN[1],q=[hx+2.7+sd[0]*.6,2.45,hz+1.0],h=[hx,1.5,hz],
    v=[h[0]-q[0],h[1]-q[1],h[2]-q[2]],L=Math.hypot(...v);
    lights.push({p:q,range:L+.4,c:r3Sc(r3Lin(mixc([255,214,170],sc,.5)),L*L*5*f),spot:1,d:v.map(x=>x/L),cosO:Math.cos(.24),cosI:Math.cos(.1),vol:0});}
  const dw=clamp(hi*1.6-.45,0,1),sky=r3Lin(mixc([206,170,150],[120,170,220],dw)),gnd=r3Lin([150,118,84]);
  return {draws,vp:cam.vp,cam:cam.eye,t,lights,bulbs:[],
    sky:[...sky,(.55+.35*hi)*f],gnd:[...gnd,.012],fog:[...r3Sc(r3Lin([200,214,224]),.6),.02],acc:[...r3Lin([236,232,214]),1],
    win:[-30,-8,40,14],win2:[B3()-.6,9,Math.min(.999,s),.72*(.55+.45*f)],
    sgn:[SPA3_BD.x-SPA3_BD.w/2,SPA3_BD.y0,SPA3_BD.x+SPA3_BD.w/2,SPA3_BD.y1],sgn2:[SPA3_BD.z,.32,0,0],
    flm:[0,0,1,0],flm2:[B3()-.6,0,0,0],tsg:SPA3.board,tfl:null,M,ot:OT};
}
function B3(){return SPA3_B;}

/* щит: мел по грифелю — шапка, день, пять строк; вычеркнутое сегодня — чертой; внизу — правило места */
function spa3Board(S){
  const took=SPA_PLAN.map(P=>spaTookToday(S,P.k)?1:0).join(""),key=S.day+"/"+S.days+"|"+took;
  if(SPA3.board&&SPA3.bkey===key&&SPA3.board.dev===GPU.dev)return SPA3.board;
  if(SPA3.board)gpuBakeDrop(SPA3.board);SPA3.bkey=key;
  const w=560,h=Math.round(560*(SPA3_BD.y1-SPA3_BD.y0)/SPA3_BD.w);
  SPA3.board=gpuBake(w,h,g=>{g.fillStyle="#fff";g.strokeStyle="#fff";g.textBaseline="alphabetic";
    g.font="bold 46px ui-monospace,monospace";g.fillText("РАСПОРЯДОК",30,72);
    g.font="30px ui-monospace,monospace";g.globalAlpha=.75;g.fillText("день "+S.day+" из "+S.days,30,114);g.globalAlpha=1;
    g.lineWidth=2;g.beginPath();g.moveTo(34,132);g.lineTo(w-34,132);g.stroke();
    const p=(h-150-80)/SPA_PLAN.length;
    SPA_PLAN.forEach((P,i)=>{const y=150+p*(i+.62),done=spaTookToday(S,P.k);
      g.globalAlpha=done?.45:1;g.font="bold 31px ui-monospace,monospace";g.fillText(P.ru,30,y);
      g.font="25px ui-monospace,monospace";g.globalAlpha=done?.35:.65;g.fillText(P.at,30,y+31);g.globalAlpha=1;
      if(done){const r=rng(hashi(i,S.day|0,0xC4A1));g.lineWidth=3;g.beginPath();g.moveTo(28,y-9+r()*4);g.lineTo(30+P.ru.length*19+8,y-11+r()*4);g.stroke();}});
    g.font="italic 25px ui-monospace,monospace";g.globalAlpha=.6;g.fillText("остальное можно не делать",30,h-34);},{mips:false});
  return SPA3.board;
}
function spa3BoardGrid(){const b=SPA3_BD,hpx=560*(b.y1-b.y0)/b.w,k=(b.y1-b.y0)/hpx,p=(hpx-150-80)/SPA_PLAN.length;
  return SPA_PLAN.map((P,i)=>{const ytop=150+p*i,ybot=150+p*(i+1);return {k:P.k,y1:b.y1-ytop*k,y0:b.y1-ybot*k};});}

/* ── холст, камера, кадр ── */
function spa3Canvas(){
  let cn=SPA3.cn;
  if(!cn||!cn.isConnected){cn=document.getElementById("spa3d")||document.createElement("canvas");cn.id="spa3d";cn.setAttribute("aria-hidden","true");
    cn.style.cssText="position:fixed;left:0;top:0;pointer-events:none";(GPU.cv||document.body.firstChild).after(cn);SPA3.cn=cn;}
  let tg=SPA3.tags;
  if(!tg||!tg.isConnected){tg=document.getElementById("spa3Tags")||document.createElement("div");tg.id="spa3Tags";tg.setAttribute("aria-hidden","true");cn.after(tg);SPA3.tags=tg;}
  cn.style.display="";tg.style.display="";return cn;
}
/* станции: веранда к морю; телефон — щит, хозяин у перил, стол и сосед; сон — объектив к пустому шезлонгу */
const SPA3_CAMS={pc:{eye:[.5,1.68,6.6],tgt:[.1,1.22,-2],fy:.74},ph:{eye:[-1.75,1.42,4.6],tgt:[-1.75,1.02,-2],fy:1.0},
  pcS:{eye:[2.6,1.5,3.6],tgt:[3.1,.5,.3],fy:.74},phS:{eye:[2.5,1.6,4.0],tgt:[2.7,.55,.6],fy:1.1}};
function spa3Cam(sz,t){
  const ph=!sz.wide,A=SPA3_CAMS[ph?"ph":"pc"],Z=SPA3_CAMS[ph?"phS":"pcS"],p=spa3SleepPh();
  const k=p<=0?0:p<.3?r3Step(0,.3,p):p<.7?1:1-r3Step(.7,1,p);
  const L=(a,b)=>a.map((v,i)=>v+(b[i]-v)*k),c={eye:L(A.eye,Z.eye),tgt:L(A.tgt,Z.tgt),fy:A.fy+(Z.fy-A.fy)*k};
  const e=[c.eye[0]+.02*Math.sin(t*.31),c.eye[1]+.012*Math.sin(t*.23),c.eye[2]];
  const P=r3Persp(c.fy,sz.cw/Math.max(1,sz.ch),.1,140);
  return {eye:e,tgt:c.tgt,fy:c.fy,vp:r3Mul(P,r3Look(e,c.tgt,[0,1,0]))};
}
function spa3Ok(){return typeof document!=="undefined"&&!!(GPU&&GPU.dev&&GPU.ok);}
function spa3Frame(){
  const S=spaAll(),cn=spa3Canvas(),sz=home3Size(cn),R=rpgGet(cn);if(!R)return false;
  R.dpr=cn.__dpr;
  const sl=spa3SleepPh()>0,mk=(S.seed|0)+"|"+S.day+(sl?"|z":"");
  if(!SPA3.mesh||SPA3.mkey!==mk){r3Drop(SPA3.mesh);SPA3.mesh=spa3Mesh(S,sl);SPA3.mkey=mk;}
  spa3Board(S);
  const t=wallMs()/1000,cam=spa3Cam(sz,t),Sc=spa3Scene(cam,t,S);
  const lab=r3Dev()?R3.blank:null;   /* подписей поверх кадра нет: пустой вид движка, а не выпечка 2D (как зал, M816c) */
  const U=new Float32Array(60);
  U.set([...r3Lin([255,236,200]),1.0],24);
  U[43]=t;U[44]=1;U[47]=1;
  const oq=r3Proj(cam.vp,cam.tgt,sz.cw,sz.ch);U.set([oq?oq[0]/sz.cw:.5,oq?oq[1]/sz.ch:.5,HALL_CA,1],48);
  U.set([1,sz.ch/sz.cw,HALL_SHARP,1],52);
  SPA3.frames++;SPA3.stat=hallLimits(Sc);SPA3.vp=cam.vp;SPA3.sz=sz;
  SPA3.meas={man:+hallManK(cam,SPA3_MAN[0],SPA3_MAN[1],sz.ch).toFixed(3),sun:+spa3Sun(S).toFixed(2),day:S.day,sleep:+spa3SleepPh().toFixed(2)};
  SPA3.hit=spa3Hits(S,cam,sz);
  room3TagsDraw(spa3Tags(S),cam,{cw:sz.cw,ch:sz.ch,wide:sz.wide,xr:sz.wide?sz.cw-200*UIK:sz.cw-170,yr:sz.ch-(sz.wide?150:230)},SPA3.tags,spa3SleepPh()>0);
  return r3Frame(cn,Sc,(pl,Sv,Vv,Bv)=>rpgField(R,pl,"r3post",R3_POST_WGSL,U,[Sv,lab,Vv,Bv]));
}
function spa3Tags(S){return [{p:[SPA3_CH2[0]-.2,.62,SPA3_CH2[1]+.2],t:"СПАТЬ",s:"день "+S.day+" из "+S.days,c:""}];}
function spa3Hits(S,cam,sz){const out=[],B=SPA3_B,add=(k,id,c,h,pad)=>{const b=win3Box(cam,sz,c,h);if(b){const p=pad||0;out.push({k,id,x0:b.x0-p,y0:b.y0-p,x1:b.x1+p,y1:b.y1+p});}};
  const b=SPA3_BD;
  for(const r of spa3BoardGrid())add("take",r.k,[b.x,(r.y0+r.y1)/2,b.z],[b.w/2,(r.y1-r.y0)/2,.02]);
  add("board",null,[b.x,(b.y0+b.y1)/2,b.z],[b.w/2,(b.y1-b.y0)/2,.03]);
  add("take","cock",[SPA3_GL[0],1.12,SPA3_GL[1]],[.06,.1,.06],12);
  add("take","chess",[SPA3_TB[0],.5,SPA3_TB[1]],[.45,.25,.45]);
  add("talk",null,[SPA3_CH1[0],.5,SPA3_CH1[1]],[.45,.45,.6]);
  add("sleep",null,[SPA3_CH2[0],.4,SPA3_CH2[1]],[.45,.35,.6]);
  add("take","walk",[(SPA3_L+SPA3_R)/2,.6,B+.05],[(SPA3_R-SPA3_L)/2,.45,.06]);
  return out;}
function spa3Hit(mx,my){const k=innerWidth/Math.max(1,W),x=mx*k,y=my*k;
  for(const h of SPA3.hit)if(x>=h.x0&&x<=h.x1&&y>=h.y0&&y<=h.y1)return h.id!=null?{k:h.k,id:h.id}:{k:h.k};
  return null;}
function spa3Hide(){
  if(SPA3.cn&&SPA3.cn.style.display!=="none"){SPA3.cn.style.display="none";r3Free(SPA3.cn);}
  if(SPA3.tags&&SPA3.tags.style.display!=="none"){SPA3.tags.style.display="none";SPA3.tags.textContent="";SPA3.tags.__key="";}
  if(SPA3.mesh){r3Drop(SPA3.mesh);SPA3.mesh=null;SPA3.mkey="";}
  SPA3.hit=[];SPA3.sl=0;SPA3.dt0=0;
}
spa3Frame=hallCostWrap(spa3Frame);
function spa3Cost(sec){return SPA3.cn&&SPA3.cn.style.display!=="none"?hallCost(sec,()=>spa3Frame(),SPA3.cn):Promise.resolve(null);}
function spa3On(){return !!(SPA3.cn&&SPA3.cn.style.display!=="none"&&SPA3.hit.length);}

/* ── кадр (28), попадание (15 → spaTap → spaHit), сон, подсказка ── */
function drawSpa(){
  if(!G.spa||!spa3Ok()){spa3Hide();return;}
  try{spa3Frame();}catch(e){SPA3.err++;spa3Hide();throw e;}   /* сбой называет страж кадра (28) */
}
function spaTookToday(S,k){return !!(S&&S.took&&S.took[S.day+":"+k]);}
function spaHit(mx,my){return spa3Hit(mx,my);}
function spaTap(mx,my){
  const h=spaHit(mx,my);if(!h)return false;
  if(h.k==="take"){spaTake(h.id);return true;}
  if(h.k==="talk"){spaTalk();return true;}
  if(h.k==="sleep"){spaSleep();return true;}
  return true;
}
function updateSpa(dt){
  const S=spaAll();if(!S){G.mode="surface";return;}
  if(actEdge)spaSleep();
  G.prompt="ДЕЙСТВИЕ — СПАТЬ";
}
{const f0=drawWorldIn;drawWorldIn=function(){f0();if(SPA3.cn&&!(G.mode==="spa"&&G.spa&&spa3Ok()))spa3Hide();};}
{const f0=spaSleep;spaSleep=function(){const r=f0();if(r&&spa3On())SPA3.sl=wallMs();return r;};}
GPU_SNAP_OVER.push(()=>SPA3.cn);
