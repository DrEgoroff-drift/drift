/* ══════════════ комнаты игрока на движке (M850, docs/DESIGN-rooms.md) ══════════════
   Штаб, дом, зимовка, санаторий — сцены рендера интерьеров (27f2 r3Frame), во весь экран под плитой, как зал станции
   (27f4a): холст под экраном, плита справа на ПК и снизу на телефоне, камера со станциями, дыхание и наезд.
   Здесь — общие кости (холст, цикл, камера, щелчок по человеку) и первая комната — ШТАБ (M850a).

   ПРАВИЛА ФАЙЛА:
   1. Мерило — человек 1.75 м (генератор 27f3): пульт по пояс (.93 м), экран на высоте глаз, потолок 3.1 м.
   2. Одна лампа-ключ с тенью на комнату, герой под ней; заливка — второй свет места, вдвое тише.
   3. Палитра: один тон (холодная сталь штаба), один акцент — тёплые лампы занятых доменов; оранжевое людей — только
      на людях. Свет говорит о состоянии: пустой домен — тёмный пульт без лампы, выбранный — ярче всех.
   4. 2D-рубки нет (22.10, автор: «2D не должно быть»): drawHqRoom удалён вместе с ?room=0; без видеокарты
      рубки нет — плашка «нет WebGPU» (08b2), как во всей игре. */
const ROOM3={open:null,host:null,cn:null,raf:0,last:0,from:null,to:null,g0:0,gd:600,place:"all",
  L:null,mesh:null,rkey:"",err:0,frames:0,stat:null,vp:null,sz:null,night:null};
const ROOM3_M=new Float32Array(R3_MAXI*R3_PART*16),ROOM3_OT=new Float32Array(R3_MAXI*R3_PART*4);

/* ── ШТАБ: рубка за конторой (DESIGN-rooms §4) ── */
const HQ3={L:-5,R:5,B:-3,F:6,hc:3.1,win:[-1.7,1.7,1.95,2.72]};
const HQ3_X=[-3.6,-1.2,1.2,3.6];   /* пульты доменов по HQ_ORDER: звено, дроны и базы, маршрут, лаборатория */
/* цвет экрана домена — тот же, что у его строки в 2D рубке, только светом */
const HQ3_SCR={cmd:[255,170,90],keep:[120,220,170],fact:[255,206,120],sci:[130,190,255]};
/* станции камеры: обзор — голо-стол и ближние пульты; домен — человек у пульта в зоне героя */
const HQ3_CAMS={all:{eye:[.2,1.55,5.4],tgt:[-.3,1.2,-1.3],fy:1.1}};
/* домен: глаз со стороны середины комнаты, на три четверти — человек в середине зоны героя, его пульт и лампа за ним */
HQ3_X.forEach((x,i)=>{const s=Math.sign(x);HQ3_CAMS["d"+i]={eye:[x-s*3.3,1.48,3.6],tgt:[x-s*.75,1.3,HQ3.B+1.15],fy:1.0};});
/* где стоит и сидит человек домена: выбранный стоит у пульта лицом в комнату, остальные сидят на развёрнутых креслах */
function hq3Chair(i){const x=HQ3_X[i],cx=x+Math.sign(x)*.3;return {x:cx,z:HQ3.B+1.35,yaw:Math.atan2(-cx,.2-(HQ3.B+1.35))};}
function hq3Stand(i){const x=HQ3_X[i],sx=x-Math.sign(x)*.55,C=HQ3_CAMS["d"+i];return {x:sx,z:HQ3.B+1.15,yaw:Math.atan2(C.eye[0]-sx,C.eye[2]-(HQ3.B+1.15))+Math.sign(x)*.35};}
function hq3Layout(){
  const L={people:[],occ:[],sel:-1,st:(G.st&&G.st.stype)||null};
  for(let i=0;i<4;i++){const m=hqMgrAt(i);L.occ.push(m?1:0);
    if(!m)continue;const on=m.id===hqSel;if(on)L.sel=i;
    const at=on?hq3Stand(i):hq3Chair(i);
    L.people.push({m,i,pose:on?"hips":"chair",x:at.x,z:at.z,yaw:at.yaw,on});}
  for(const P of L.people)P.mesh=cpMesh(P.m,P.pose,1);
  L.rkey="hq|"+L.occ.join("")+"|"+L.sel+"|"+(L.st||"-");
  return L;
}
/* сетка рубки: кости, четыре пульта с креслами, голо-стол, окно в док, дверь, карта на стене */
function hq3Mesh(L){
  const K=r3Kit(),P=R3P,{L:X0,R:X1,B,F,hc}=HQ3,W=HQ3.win;
  const wall=[96,104,118];
  const Mw=K.mt(wall,.25,6,P.wall),Mw2=K.mt(mixc(wall,[10,12,16],.4),.3,6,P.wall);
  const Mf=K.mt([96,98,102],.18,5,P.floor),Mst=K.mt([44,48,56],.45,9,P.brushed),Mdk=K.mt([30,33,38],.5,9,P.brushed);
  const Fr=K.mt([112,122,136],.7,11,P.brushed),Mtr=K.mt(mixc(wall,[24,26,30],.5),.4,8,P.brushed);
  K.part=0;
  K.quad([X0,0,B],[X1,0,B],[X1,0,F],[X0,0,F],Mf,[0,1,0]);
  hallWall(K,X0,X1,0,1.0,B,[],Mw2);hallWall(K,X0,X1,1.0,hc,B,[[W[0],W[1],W[2],W[3]]],Mw);
  K.quad([X0,0,F],[X0,0,B],[X0,hc,B],[X0,hc,F],Mw,[1,0,0]);
  K.quad([X1,0,B],[X1,0,F],[X1,hc,F],[X1,hc,B],Mw,[-1,0,0]);
  K.quad([X1,0,F],[X0,0,F],[X0,hc,F],[X1,hc,F],Mw,[0,0,-1]);
  K.quad([X0,hc,B],[X1,hc,B],[X1,hc,F],[X0,hc,F],K.mt([86,92,100],.2,4,P.ceil),[0,-1,0]);
  for(let x=X0+.9;x<X1;x+=1.8)K.box([x,hc-.08,(B+F)/2],[.06,.08,(F-B)/2],Mst,.01);
  K.box([(X0+X1)/2,1.0,B+.02],[(X1-X0)/2,.025,.02],Mtr,.008);K.box([(X0+X1)/2,.05,B+.015],[(X1-X0)/2,.05,.015],Mtr,.006);
  /* короб кабелей под потолком вдоль задней стены — от пульта к пульту */
  K.box([(X0+X1)/2,hc-.32,B+.16],[(X1-X0)/2,.07,.12],Mdk,.012);
  /* окно в док: проём узора window, рама и переплёт на три части */
  {const z=B,fw=.012;K.quad([W[0],W[2],z+.01],[W[1],W[2],z+.01],[W[1],W[3],z+.01],[W[0],W[3],z+.01],K.mt([3,3,3],.2,70,P.window,0,true),[0,0,1]);
    K.box([(W[0]+W[1])/2,W[2]-.03,z+.08],[(W[1]-W[0])/2+.06,.03,.09],Fr,.01);
    for(let i=0;i<=3;i++){const x=W[0]+(W[1]-W[0])*i/3;K.box([x,(W[2]+W[3])/2,z+.05],[fw,(W[3]-W[2])/2+fw,.05],Fr,.004);}}
  /* пульты: тумба, наклонная столешница с клавишами, экран на высоте глаз; занятый — экран в цвет домена */
  HQ3_X.forEach((x,i)=>{const role=HQ_ORDER[i],on=L.occ[i],sel=L.sel===i,sc=HQ3_SCR[role]||[200,200,200];
    K.box([x,.42,B+.42],[.92,.42,.34],Mst,.02);
    K.box([x,.86,B+.42],[.94,.025,.36],Mdk,.01);
    K.push([x,.9,B+.62],0,-.32);K.box([0,0,0],[.86,.02,.2],K.mt([38,42,48],.5,9,P.brushed),.008);
    for(let k=0;k<12;k++)K.box([-.6+k*.11,.024,.02],[.04,.006,.03],K.mt(on?mixc(sc,[30,30,30],.5):[40,44,50],.3,6,0,on?.25:0),.002);K.pop();
    K.box([x,1.48,B+.16],[.82,.36,.05],Mdk,.012);
    const Ms=K.mt(on?mixc(sc,[10,14,20],.8):[10,12,16],.2,40,P.screen,on?(sel?.55:.35):.04,true);
    K.quad([x-.76,1.16,B+.215],[x+.76,1.16,B+.215],[x+.76,1.8,B+.215],[x-.76,1.8,B+.215],Ms,[0,0,1]);
    /* развёртка на экране: столбики дела домена — ровные, пустой экран без них */
    if(on)for(let k=0;k<7;k++){const h=.08+.32*((((i*7+k)*2654435761)>>>0)%100)/100;
      K.box([x-.6+k*.2,1.2+h/2,B+.222],[.035,h/2,.004],K.mt(mixc(sc,[40,40,40],.25),.2,4,0,sel?.8:.5,true),0);}
    /* плашка домена над экраном: тёмная, у занятого — тонкая полоса акцента */
    hallShade(K,on&&L.sel===i?x-Math.sign(x)*.35:x,hc-.3,B+1.25,on?[255,206,150]:[40,40,44],hc,!on);
    K.box([x,1.92,B+.18],[.36,.05,.012],Mdk,.006);
    if(on)K.box([x,1.92,B+.193],[.3,.008,.001],K.mt(sc,.3,6,0,.6,true),0);
    /* кресло: колонна, крестовина, сиденье, спинка — развёрнуто к голо-столу */
    const C=hq3Chair(i);K.push([C.x,0,C.z],C.yaw);
    K.lathe([[.05,.035],[.38,.025],[.4,0]],10,K.mt([60,62,66],.7,11,P.brushed));
    for(let a=0;a<5;a++){const t=a/5*TAU;K.box([Math.cos(t)*.2,.05,Math.sin(t)*.2],[.12,.02,.025],Mdk,.006);}
    K.box([0,.45,-.02],[.24,.045,.23],K.mt([46,50,58],.15,4,P.leather),.03);
    K.push([0,.75,-.25],0,-.12);K.box([0,0,0],[.22,.26,.035],K.mt([46,50,58],.15,4,P.leather),.03);K.pop();
    K.pop();});
  /* голо-стол: тумба, тёмная столешница с кольцом света; над ней — планета сектора кольцами (свечение, без тени) */
  {const cz=.2;K.push([0,0,cz]);
    K.lathe([[0,.42],[.08,.38],[.7,.3],[.86,.6],[.9,.92],[.94,0]],28,Mst);
    K.lathe([[.9,.93],[.93,.935]],40,K.mt([30,34,40],.6,12,P.brushed));
    K.lathe([[.936,.82],[.94,.78]],40,K.mt([120,200,255],.2,4,0,1.3,true));
    const Mh=K.mt([120,200,255],.1,3,0,.9,true);
    for(let k=0;k<3;k++){const r=.36,ps=[];for(let a=0;a<=32;a++){const t=a/32*TAU;ps.push(k===0?[Math.cos(t)*r,1.36,Math.sin(t)*r]:
      k===1?[Math.cos(t)*r,1.36+Math.sin(t)*r,0]:[0,1.36+Math.sin(t)*r,Math.cos(t)*r]);}K.tube(ps,.004,Mh,4);}
    K.ell([0,1.36,0],[.1,.1,.1],K.mt([150,215,255],.1,3,0,1.6,true),6,10);
    const ps=[];for(let a=0;a<=40;a++){const t=a/40*TAU;ps.push([Math.cos(t)*.6,1.36,Math.sin(t)*.6*.35]);}K.tube(ps,.003,Mh,4);
    K.pop();}
  /* левая стена: карта сектора — тёмное поле, точки систем; правая — дверь в контору с лампой над ней */
  K.box([X0+.03,1.6,-.4],[.03,.7,1.4],Mdk,.01);
  for(let k=0;k<22;k++){const r=((k*2654435761)>>>0)/4294967296,r2=((k*40503+7)*2654435761>>>0)/4294967296;
    K.box([X0+.065,1.05+r*1.1,-1.65+r2*2.5],[.002,.012,.012],K.mt([255,200,140],.1,3,0,k%5?.6:1.6,true),0);}
  K.box([X1-.04,1.05,2.2],[.04,1.05,.55],Mst,.02);K.box([X1-.06,1.05,2.2],[.03,.98,.48],Mdk,.01);
  K.box([X1-.07,2.25,2.2],[.03,.04,.16],K.mt([255,190,120],.2,4,0,1.4,true),.01);
  return K.pack();
}
/* свет рубки: ключ — холод голо-стола снизу (тени людей на задней стене); лампа над каждым занятым пультом,
   над выбранным — ярче всех и с тенью; экраны — малая заливка цветом домена; окно — холод дока сверху */
function hq3Scene(L,cam,t){
  const M=ROOM3_M,OT=ROOM3_OT,I=r3Xf([0,0,0]);
  for(let i=0;i<R3_MAXI*R3_PART;i++)M.set(I,i*16);OT.fill(0);
  const draws=[[ROOM3.mesh,0,1]];let ii=1;
  for(const P of L.people){if(ii>=R3_MAXI)break;
    const ph=(P.m.seed%1000)*.0063,br=1+.006*Math.sin(t*1.6+ph),A=r3Xf([P.x,0,P.z],P.yaw);
    const B=r3Mul(A,[1,0,0,0, 0,br,0,0, 0,0,1,0, 0,0,0,1]),at=P.mesh.at;
    /* выбранный смотрит в объектив (не дальше ±20°), сидящие — на голо-стол и друг на друга */
    let hy;if(P.on){const a=Math.atan2(cam.eye[0]-P.x,cam.eye[2]-P.z)-P.yaw,w=Math.atan2(Math.sin(a),Math.cos(a));hy=clamp(w,-.35,.35)+.04*Math.sin(t*.23+ph);}
    else hy=.24*Math.sin(t*.19+ph*3)*Math.max(0,Math.sin(t*.08+ph));
    M.set(B,(ii*R3_PART)*16);
    const Mh=r3Pivot(B,at.neck,hy,.04*Math.sin(t*.17+ph),0);M.set(Mh,(ii*R3_PART+1)*16);
    cpRig(M,ii*R3_PART,Mh,P.mesh,cpFace(P.m,null));
    for(let k=0;k<2;k++)M.set(B,(ii*R3_PART+2+k)*16);
    const dm=L.sel>=0&&!P.on?.18:0;for(let p=0;p<R3_PART;p++)OT[(ii*R3_PART+p)*4+1]=dm;
    OT.set([P.x,P.z,P.on?.34:.3,(P.on?1.15:.6)],(ii*R3_PART+R3_PART-1)*4);
    draws.push([P.mesh,ii,1]);P.ii=ii;ii++;}
  const lights=[],bulbs=[],B=HQ3.B,hc=HQ3.hc,cold=r3Lin([130,196,255]),warm=r3Lin([255,200,140]);
  /* смена: днём окно дока — вторая заливка сверху, ночью окно гаснет до звёзд, комнату держат лампы доменов и голо-стол */
  const nk=room3Night(),day=1-nk;
  lights.push({p:[0,1.15,.75],range:7.5,c:r3Sc(cold,3.4*(1+.2*nk)),spot:1,d:[0,.12,-.99],cosO:Math.cos(1.05),cosI:Math.cos(.45),shadow:1,vol:.12,key:1});
  HQ3_X.forEach((x,i)=>{if(!L.occ[i])return;const sel=L.sel===i;
    const lx=sel?x-Math.sign(x)*.35:x;lights.push({p:[lx,hc-.3,B+1.25],range:4.6,c:r3Sc(warm,(sel?7.5:2.4)*(1+.3*nk)),spot:1,d:sel?[0,-.96,.28]:[0,-1,-.12],cosO:Math.cos(.66),cosI:Math.cos(.3),shadow:sel?1:0,vol:sel?.1:.04});
    bulbs.push([x,hc-.3,B+1.05,sel?.9:.4]);});
  HQ3_X.forEach((x,i)=>{if(!L.occ[i])return;lights.push({p:[x,1.0,B+1.0],range:2.8,c:r3Sc(r3Lin(mixc(HQ3_SCR[HQ_ORDER[i]],[255,190,130],.4)),L.sel===i?1.1:.7),vol:0});});
  /* голо-стол светит и вниз: пятно холода на полу вокруг тумбы — передний план держит форму */
  lights.push({p:[0,1.3,.2],range:4.2,c:r3Sc(cold,1.6),vol:0});
  const W=HQ3.win;lights.push({p:[0,W[3]-.1,B+.3],range:7+3*nk,c:r3Sc(r3Lin(mixc([170,192,226],[60,84,150],nk)),4.2*day+.45*nk),spot:1,
    d:[0,-.8+.4*nk,.6+.3*nk],cosO:Math.cos(.8+.5*nk),cosI:Math.cos(.35+.4*nk),vol:.06*day});
  lights.push({p:[HQ3.R-.3,2.2,2.2],range:2.6,c:r3Sc(warm,.9),vol:0});
  /* рассеянный ночью не падает в черноту: синее небо дока, value стен ≥ .08 */
  const sky=r3Lin(mixc([60,70,88],[40,52,86],nk)),gnd=r3Lin(mixc([70,64,58],[52,56,70],nk)),fog=r3Lin(mixc([34,42,58],[22,30,52],nk));
  const kind=L.st&&typeof hallT==="function"?hallT(L.st).win:5;
  return {draws,vp:cam.vp,cam:cam.eye,t,lights:lights.slice(0,R3_MAXL),bulbs,
    sky:[...sky,2.0-1.25*nk],gnd:[...gnd,.075-.03*nk],fog:[...r3Sc(fog,.25),.04],acc:[...r3Lin([255,170,90]),1],
    win:[W[0],W[2],W[1],W[3]],win2:[B,kind,7,.7*(.38+.62*day)],sgn:[0,0,0,0],sgn2:[B,0,0,0],
    flm:[0,0,1,0],flm2:[B,0,0,0],tsg:null,tfl:null,M,ot:OT};
}

/* ── кости комнат: холст, размер, камера, цикл ── */
function room3Canvas(host){
  let cn=document.getElementById("room3d");
  if(!cn){cn=document.createElement("canvas");cn.id="room3d";cn.setAttribute("aria-hidden","true");}
  if(cn.parentNode!==host)host.insertBefore(cn,host.firstChild);
  let tg=document.getElementById("room3Tags");
  if(!tg){tg=document.createElement("div");tg.id="room3Tags";tg.setAttribute("aria-hidden","true");}
  if(tg.previousSibling!==cn)cn.after(tg);
  ROOM3.cn=cn;ROOM3.tags=tg;return cn;
}
function room3Size(cn){
  const wide=hallWide(),vw=innerWidth,vh=innerHeight,ui=(typeof UIK==="number"&&UIK>0)?UIK:1;
  const cw=vw,ch=wide?vh:Math.round(vh*HALL_STRIP),rw=hallDrawW(cw,wide),dpr=hallDpr(rw,ch,window.devicePixelRatio);
  const pw=Math.max(2,Math.round(rw*dpr)),ph=Math.max(2,Math.round(ch*dpr));
  if(cn.width!==pw||cn.height!==ph){cn.width=pw;cn.height=ph;}
  cn.__dpr=pw/rw;cn.style.width=(rw/ui)+"px";cn.style.height=(ch/ui)+"px";
  return {cw,ch,wide,rw};
}
function room3Cams(){return ROOM3.open==="hq"?HQ3_CAMS:{};}
function room3GlideAt(tm){
  const A=ROOM3.from,B=ROOM3.to;if(!B)return null;if(!A)return B;
  const k=hallEase((tm-ROOM3.g0)/Math.max(1,ROOM3.gd)),m=(a,b)=>a.map((v,i)=>v+(b[i]-v)*k);
  return {eye:m(A.eye,B.eye),tgt:m(A.tgt,B.tgt),fy:A.fy+(B.fy-A.fy)*k,k};
}
function room3Moving(){return !!(ROOM3.to&&ROOM3.from&&wallMs()-ROOM3.g0<ROOM3.gd+40);}
/* к станции; первое открытие — наезд от двери: глаз выше, поле уже, 900 мс */
function room3Go(place,first){
  const C=room3Cams(),c=C[place]||C.all;if(!c)return;
  const cur=first?{eye:[c.eye[0],c.eye[1]+.25,c.eye[2]+.6],tgt:c.tgt.slice(),fy:c.fy*.8}:(room3GlideAt(wallMs())||c);
  ROOM3.from={eye:cur.eye.slice(),tgt:cur.tgt.slice(),fy:cur.fy};ROOM3.to=c;ROOM3.g0=wallMs();ROOM3.gd=first?900:600;ROOM3.place=place;
}
/* дыхание камеры: 2 см в секунду по кругу — комната живая, когда никто не двигается */
function room3Breath(c,t){return {eye:[c.eye[0]+.02*Math.sin(t*.31),c.eye[1]+.012*Math.sin(t*.23),c.eye[2]],tgt:c.tgt,fy:c.fy};}
function room3Night(){return ROOM3.night!=null?ROOM3.night:hallNight();}
function room3Ok(){return typeof document!=="undefined"&&!!(GPU&&GPU.dev)&&!(typeof HALL!=="undefined"&&HALL.err);}
function room3Open(id,host){
  const first=ROOM3.open!==id;
  ROOM3.open=id;ROOM3.host=host;host.classList.add("room3");room3Canvas(host);
  if(first){ROOM3.err=0;ROOM3.L=null;room3Go(room3Place(),true);}
  else{const p=room3Place();if(p!==ROOM3.place)room3Go(p,false);}
  ROOM3.L=null;
  if(!ROOM3.raf&&typeof requestAnimationFrame==="function")ROOM3.raf=requestAnimationFrame(room3Loop);
}
function room3Place(){if(ROOM3.open==="hq"){const i=HQ_ORDER.findIndex((r,k)=>{const m=hqMgrAt(k);return m&&m.id===hqSel;});return i>=0?"d"+i:"all";}return "all";}
function room3Close(){
  if(ROOM3.raf&&typeof cancelAnimationFrame==="function")cancelAnimationFrame(ROOM3.raf);ROOM3.raf=0;
  if(ROOM3.host)ROOM3.host.classList.remove("room3");
  if(ROOM3.cn){r3Free(ROOM3.cn);ROOM3.cn.remove();}
  if(ROOM3.tags){ROOM3.tags.remove();ROOM3.tags.__key="";ROOM3.tags=null;}
  r3Drop(ROOM3.mesh);ROOM3.mesh=null;ROOM3.rkey="";ROOM3.L=null;ROOM3.open=null;ROOM3.host=null;ROOM3.cn=null;
}
function room3Loop(){
  ROOM3.raf=0;
  if(!ROOM3.open||!ROOM3.host||!ROOM3.host.classList.contains("open")){room3Close();return;}
  const tw=wallMs();
  if(room3Moving()||tw-ROOM3.last>=1000/12-2){ROOM3.last=tw;
    try{room3Frame();}catch(e){ROOM3.err++;console.error("комната: кадр упал",e);room3Close();return;}}
  ROOM3.raf=requestAnimationFrame(room3Loop);
}
function room3Frame(){
  const cn=ROOM3.cn,sz=room3Size(cn),R=rpgGet(cn);if(!R)return false;
  R.dpr=cn.__dpr;
  if(!ROOM3.L)ROOM3.L=hq3Layout();
  const L=ROOM3.L;
  if(!ROOM3.mesh||ROOM3.rkey!==L.rkey){r3Drop(ROOM3.mesh);ROOM3.mesh=hq3Mesh(L);ROOM3.rkey=L.rkey;}
  const t=wallMs()/1000,c0=room3GlideAt(wallMs())||HQ3_CAMS.all,cam=hallCam(room3Breath(c0,t),sz.cw,sz.ch,sz.wide);
  const S=hq3Scene(L,cam,t);S.vp=hallCrop(cam.vp,sz.rw/sz.cw);
  const lab=r3Dev()?R3.blank:null;   /* подписей поверх кадра нет: пустой вид движка, а не выпечка 2D (как зал, M816c) */
  const U=new Float32Array(60);
  S.bulbs.slice(0,6).forEach((b,i)=>{const q=r3Proj(cam.vp,b,sz.cw,sz.ch),q2=r3Proj(cam.vp,[b[0]+.05,b[1],b[2]],sz.cw,sz.ch);
    if(q&&q2&&q[2]>0)U.set([q[0],q[1]+2,Math.max(2,Math.abs(q2[0]-q[0])),b[3]],i*4);});
  U.set([...r3Lin([255,200,140]),1.0],24);
  U[43]=t;U[44]=1;U[47]=1;
  const oq=r3Proj(cam.vp,c0.tgt,sz.cw,sz.ch);U.set([oq?oq[0]/sz.cw:.5,oq?oq[1]/sz.ch:.5,HALL_CA,1],48);
  U.set([sz.rw/sz.cw,sz.ch/sz.cw,HALL_SHARP,1],52);
  ROOM3.frames++;ROOM3.stat=hallLimits(S);ROOM3.vp=cam.vp;ROOM3.sz=sz;
  room3TagsDraw(hq3Tags(L,c0.tgt[0]),cam,sz);
  return r3Frame(cn,S,(pl,Sv,Vv,Bv)=>rpgField(R,pl,"r3post",R3_POST_WGSL,U,[Sv,lab,Vv,Bv]));
}
/* слова на вещах (L5): пустой пульт — тусклая надпись в углу его тёмного экрана (не табличка, не заглавные по центру);
   подсказка — одна, на пустом кресле ближе к цели объектива; занятый пульт говорит плитой.
   Надпись прижата к дальнему от голо-стола углу экрана (правые — вправо), а если голограмма всё равно
   встаёт поверх неё (обзор) — надписи нет: яркое кольцо поперёк слова не читается (av — что обходить) */
function hq3Tags(L,tx){const out=[];let hi=-1;
  out.av=[[[-.6,1.0,.56],[.6,1.72,.56]]];   /* голограмма: кольца ±.6 и ±.36 вокруг 1.36, ближняя грань */
  HQ3_X.forEach((x,i)=>{if(L.occ[i])return;const R=MGR_ROLES[HQ_ORDER[i]],r=x>0;
    out.push({p:[r?x+.7:x-.7,1.22,HQ3.B+.22],t:"ДОМЕН СВОБОДЕН",s:R?R.dom:"",c:"sg",al:r?"r":""});
    if(hi<0||Math.abs(x-tx)<Math.abs(HQ3_X[hi]-tx))hi=i;});
  if(hi>=0&&L.sel<0){const C=hq3Chair(hi);out.push({p:[C.x,.42,C.z],t:"ПУСТОЕ КРЕСЛО",s:"управляющих нанимают в кантине станции",c:"dn"});}
  return out;}
/* таблички — DOM над холстом, в зоне героя; пока камера едет, их нет (как в зале, hallTagsDraw) */
/* box, mv, sz.xr/yr — для чужой комнаты (дом 29rb): свой слой табличек, своя граница поля */
function room3TagsDraw(list,cam,sz,box,mv){
  box=box||ROOM3.tags;if(!box)return;
  const ui=(typeof UIK==="number"&&UIK>0)?UIK:1;if(mv==null?room3Moving():mv)list=[];
  const xr=sz.xr!=null?sz.xr:sz.wide?hallHero(sz.cw)*sz.cw-12*ui:sz.cw-12,yr=sz.yr!=null?sz.yr:sz.wide?sz.ch-60*ui:sz.ch*(24/36)-8,key=list.map(x=>x.t+"/"+x.s+"/"+x.c).join("|");
  if(box.__key!==key){box.__key=key;box.textContent="";
    for(const g of list){const e=document.createElement("i"),b=document.createElement("b");e.className=g.c?"ht "+g.c:"ht";b.textContent=g.t;e.appendChild(b);
      if(g.s){const s=document.createElement("s");s.textContent=g.s;e.appendChild(s);}box.appendChild(e);}}
  list.forEach((g,i)=>{const e=box.children[i],q=r3Proj(cam.vp,g.p,sz.cw,sz.ch),sg=g.c==="sg";
    const w=(sg?Math.max(g.t.length*9,(g.s||"").length*6.2):Math.max(g.t.length*11+24,(g.s||"").length*7+24))*ui;
    const lf=!sg&&!!q&&q[0]+w>xr&&q[0]-w>16*ui,ar=sg&&g.al==="r";
    const dn=g.c==="dn";let ok=!!q&&(lf||ar?q[0]-w>16*ui&&q[0]<xr:q[0]>16*ui&&q[0]+w<xr)&&q[1]>110*ui&&q[1]+(dn?96*ui:0)<yr;
    if(ok&&sg&&list.av)ok=!room3Over(list.av,cam,sz,ar?q[0]-w:q[0],q[1]-30*ui,ar?q[0]:q[0]+w,q[1]);
    e.style.visibility=ok?"":"hidden";e.classList.toggle("lf",lf);e.classList.toggle("r",ar);
    if(ok)e.style.transform="translate("+(q[0]/ui).toFixed(1)+"px,"+(q[1]/ui).toFixed(1)+"px) "+(sg?(ar?"translate(-100%,-100%)":"translate(0,-100%)"):(lf?"translate(calc(1px - 100%),":"translate(-1px,")+(dn?"28px)":"calc(-100% - 28px))"));});
}
/* перекрывает ли надпись (x0..x1, y0..y1, px холста) хоть один мировой прямоугольник из av (две угловые точки) */
function room3Over(av,cam,sz,x0,y0,x1,y1){
  return av.some(b=>{const a=r3Proj(cam.vp,b[0],sz.cw,sz.ch),c=r3Proj(cam.vp,b[1],sz.cw,sz.ch);if(!a||!c)return false;
    return Math.max(x0,Math.min(a[0],c[0]))<Math.min(x1,Math.max(a[0],c[0]))&&Math.max(y0,Math.min(a[1],c[1]))<Math.min(y1,Math.max(a[1],c[1]));});
}
/* цена кадра комнаты — тем же замером, что зал (27f4k): кадры подряд, GPU меткой времени, CPU часами */
room3Frame=hallCostWrap(room3Frame);
function room3Cost(sec){return ROOM3.open?hallCost(sec,()=>room3Frame(),ROOM3.cn):Promise.resolve(null);}
/* по человеку тыкают: точка его головы на экране — ближайшая в 70 px из зоны героя (холст пальцев не ловит,
   щелчок приходит на поле экрана под плитой) */
function room3PickHq(x,y){
  const L=ROOM3.L,sz=ROOM3.sz,vp=ROOM3.vp;if(!L||!sz||!vp)return null;
  let best=null,bd=70*((typeof UIK==="number"&&UIK>0)?UIK:1);
  for(const P of L.people){const q=r3Proj(vp,[P.x,P.pose==="chair"?1.15:1.5,P.z],sz.cw,sz.ch);if(!q)continue;
    if(q[0]>sz.rw)continue;const d=Math.hypot(q[0]-x,q[1]-y);if(d<bd){bd=d;best=P.m.id;}}
  return best;
}

/* ── рубка штаба (27c зовёт hqScene): только движок; щелчок по полю экрана — выбор человека ── */
function hqScene(){if(room3Ok())room3Open("hq",$hq);else if(ROOM3.open)room3Close();}
if(typeof document!=="undefined"&&typeof $hq!=="undefined"&&$hq)$hq.addEventListener("click",ev=>{
  if(ROOM3.open!=="hq"||ev.target!==$hq)return;
  const id=room3PickHq(ev.clientX,ev.clientY);
  if(!id||id===hqSel)return;hqSel=id;if(typeof sfx==="function")sfx("ui");hqRender();});
