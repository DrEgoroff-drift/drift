/* ══════════════ планета: спуск в новом виде (M621) ══════════════
   Старая посадка (19-mode-landing) считает всё: тягу, наклон, касание, выпуск опор, просадку.
   Здесь — только кадр: та же сцена, что встретит на поверхности (композиция липнет к площадке —
   tr.plnCx — и переживает касание), корабль по корпусу игры висит на своей высоте с креном
   посадки, опоры выходят у земли, факелы посадочных сопел — по тяге, люк закрыт, объектив — окно
   поверхности: земля под кораблём на своей доле кадра, высоко — корабль на 24 % от верха. Пока летим, земля
   строится по бюджету кадра (21pf, 21pga); с касания корабль переставляется на своё место без
   перестройки земли (plnLandMove), и первый кадр поверхности берёт её из кэша. Старая
   рисовалка — запасной выход, как и у поверхности. */
const PLN_DESC={thr:0,S:null,bloom:BLOOM_K.landing,live:false,sp:null};

/* окно спуска для plnLens; запоминает себя в PLN.hand */
function plnDescLens(L,gyw,g){
  return (ws,hs,f)=>{
    const vx=L.x-ws/2,vy=Math.max(-400,Math.min(gyw-hs*(1-f),L.y-hs*.24));
    PLN.hand={tr:L.tr,cx:vx+ws/2,fy:vy+hs*(1-f),K:W/ws,g:g||0,t0:0,w:1};
    return {vx,vy};
  };
}

function plnDescent(){
  const L=G.land,tr=L.tr,p=L.p;
  if(!tr||!p||!tr.h)return false;
  /* композиция липнет к площадке: спуск и поверхность складывают сцену вокруг одной точки */
  if(tr.plnCx==null)tr.plnCx=tr.padX/PLN_M+12.8;
  const touched=L.over>0,sx=touched?L.x:tr.padX;
  let S=PLN_DESC.S;
  if(!S||S.tr!==tr)S=PLN_DESC.S={tr,p,cam:{x:0,y:0},face:1,swim:0,shake:0};
  S.shipX=sx;S.x=L.x;S.y=L.y;S.cam.x=L.x;S.cam.y=L.y;
  const gyw=groundAt(tr,L.x),alt=Math.max(0,gyw-L.y-LAND_GY)/PLN_M;
  /* тяга набирает и гаснет не рывком: факел растёт за несколько кадров */
  PLN_DESC.thr+=((L.thrOn&&!touched?1:0)-PLN_DESC.thr)*.3;
  const thr=PLN_DESC.thr<.01?0:PLN_DESC.thr;
  /* у земли объектив ближе (как ближний у вещи, M624): с тридцати метров к шести корабль растёт
     в кадре в 1.6 раза; на первом кадре поверхности ближний объектив продолжит с той же доли */
  const near=.6*plnSmooth(30,6,alt);
  PLN.glide=0;
  return plnSurface(S,{
    /* окно: земля под кораблём на той же доле кадра, что и у поверхности (1−f от верха), пока корабль
       не поднялся до 24 % — выше окно идёт за ним; так касание и первый кадр поверхности — одно окно.
       Окно спуска запоминается (PLN.hand, M830): первый кадр поверхности стоит в нём же */
    lens:plnDescLens(L,gyw,near),near,
    /* опоры выходят с четырнадцати метров и стоят к пяти; жар сопел гаснет с отсчётом касания */
    ship:{x:L.x/PLN_M,alt,gear:Math.max(L.gear||0,plnSmooth(14,5,alt)),sq:L.sq||0,thr,
      hot:(L.hot||0)*(touched?clamp(L.over/70,0,1):0),tilt:-(L.a||0),yaw:.2,down:true},
    /* с высоты зенит темнеет: сверху тёмный воздух, снизу светлый пол дымки (как у старого захода) */
    zen:.32*plnSmooth(10,70,alt),
    /* площадка — тело; волна захода по кромке гаснет с касанием */
    extra:(F,Ld,C,sp)=>{
      PLN_DESC.sp=sp;
      /* посадочная фара в сумерках и ночью: свет перед кораблём, к объективу — огни площадки светят
         ему в спину, и без неё у плиты ночью виден только силуэт */
      const dusk=plnSmooth(.1,.6,(PLN.sun&&PLN.sun.night)||0);
      if(dusk>.05&&F.lamps.length<4)F.lamps.push({p:[sp[0],sp[1]+.8,sp[2]-4.5],r:10,c:[.95,.9,.8],k:1.6*dusk});
      /* выхлоп бьёт в землю: пятно света на грунте под соплами — трава и брюхо в его отсвете */
      const wk=thr*plnSmooth(24,2,alt);
      if(wk>.02&&F.lamps.length<4)F.lamps.push({p:[sp[0],sp[1]-alt+.6,sp[2]],r:3+.22*alt,c:[1,.58,.25],k:2.6*wk});
      plnPadFrame(F,Ld,tr,touched?clamp(L.over/70,0,1):1);}});
}

/* ── площадка (M830) ──
   Площадка — тело, как пирс базы (DESIGN-base-scene §3): плита 13 × 8.5 м со скруглённой кромкой,
   верх на тридцать пять сантиметров над выровненным грунтом (над водой — над водой), низ уходит в
   грунт насыпью (на метр дальше корабля: ближняя кромка не ложится на склон линии ходьбы); по кромке — янтарные штрихи разметки, на дальних углах — два огня на стойках
   (1.7 м), за кораблём, чтобы его не закрывать. Тень плиты и стоек — от того же солнца. Корабль
   стоит на плите: и на спуске, и на поверхности его ставят на её верх (plnPadLift). На заходе по
   штрихам от концов к середине бежит волна — «сюда»; касание её гасит, разметка и огни остаются.
   Всё — движение, не мигание: огни дышат вразнобой и не гаснут */
const PLN_LPAD={gen:-1,body:null,dash:null,bulb:null,ib:null,id:null,iu:null,
  a:new Float32Array(16),d:new Float32Array(16*32),u:new Float32Array(16*2),
  hx:6.6,hz:4.2,dz:1,rim:.35,deep:3.2,post:1.7,cyc:2.6,col:[1,.6,.27]};
function plnPadGeo(){
  const Q=PLN_LPAD;
  if(Q.gen===PLN_GPU.gen&&Q.body)return Q;
  Q.gen=PLN_GPU.gen;
  const m=plnMesh(1<<12);
  /* плита: брус со скруглённой кромкой, верх на нуле */
  plnBlob(m,{c:[0,-Q.deep/2,0],r:[Q.hx,Q.deep/2,Q.hz],box:.12,sub:3,bump:.015,seed:7,col:[.17,.17,.18],mat:PLN_MAT.rock,x:.12});
  /* стойки огней и колпаки над ними */
  for(const s of [-1,1]){
    const x=s*(Q.hx-.45),z=Q.hz-.45;
    plnTube(m,{path:[[x,-.05,z],[x,Q.post,z]],rad:.075,sides:8,col:[.11,.11,.12],mat:PLN_MAT.man,x:.3,cap:true});
    plnBlob(m,{c:[x,Q.post+.2,z],r:[.15,.045,.15],sub:1,col:[.09,.09,.1],mat:PLN_MAT.man,x:.3});
  }
  Q.body=plnGeo(plnMeshDone(m));
  const d=plnMesh(256);
  plnBlob(d,{c:[0,0,0],r:[.55,.03,.09],box:.3,sub:1,col:[1,1,1],mat:PLN_MAT.glow,glow:1});
  Q.dash=plnGeo(plnMeshDone(d));
  const g=plnMesh(256);
  plnBlob(g,{c:[0,0,0],r:[1,1,1],sub:1,col:[1,1,1],mat:PLN_MAT.glow,glow:1});
  Q.bulb=plnGeo(plnMeshDone(g));
  Q.ib=plnInst(Q.a,0,1);Q.id=plnInst(Q.d,0,32);Q.iu=plnInst(Q.u,0,2);
  return Q;
}
/* штрихи кромки в плите: [x, z, поворот, фаза волны 0…1 (0 — конец ряда)] */
function plnPadSpots(){
  const Q=PLN_LPAD,o=[],ex=Q.hx-.42,ez=Q.hz-.42;
  for(const z of [-ez,ez])for(let i=0;i<10;i++){const u=(i+.5)/10;o.push([(u*2-1)*ex,z,0,1-Math.abs(u*2-1)]);}
  for(const x of [-ex,ex])for(let j=0;j<6;j++)o.push([x,((j+.5)/6*2-1)*ez,Math.PI/2,0]);
  return o;
}
const PLN_LPAD_SPOTS=plnPadSpots();
/* сила штриха по часам: kw — волна захода 0…1 (касание гасит её); t — секунды */
function plnPadGlow(s,t,kw){
  const ph=((t/PLN_LPAD.cyc)-s[3]*.6)%1,wv=Math.exp(-Math.pow((ph<0?ph+1:ph)*9,2));
  return .45+kw*(.7+2.8*wv);
}
/* огни на стойках: дышат вразнобой, не гаснут */
function plnPadBulb(i,t){return 3+.7*Math.sin(t*1.3+i*2.4);}
/* верх плиты: над грунтом площадки, над водой — над водой */
function plnPadTop(Ld,tr,wy){
  const px=tr.padX/PLN_M,pz=Ld.shipZ+PLN_LPAD.dz;
  return Math.max(plnLandRibAt(Ld,px,pz),wy>-1e4?wy+.05:-1e9)+PLN_LPAD.rim;
}
/* на сколько поднять корабль, чтобы он стоял на плите, а не в ней */
function plnPadLift(Ld,tr,wy,x){
  const px=tr.padX/PLN_M;
  if(Math.abs(x-px)>PLN_LPAD.hx)return 0;
  return Math.max(0,plnPadTop(Ld,tr,wy)-plnLandRibAt(Ld,x,Ld.shipZ));
}
function plnPadFrame(F,Ld,tr,kw){
  if(!Ld)return;
  const Q=plnPadGeo(),px=tr.padX/PLN_M,pz=Ld.shipZ+Q.dz,yaw=Ld.shipYaw||0,cs=Math.cos(yaw),sn=Math.sin(yaw);
  const t=(G.t/60)%7200,c=Q.col,top=plnPadTop(Ld,tr,F.waterY),dusk=plnSmooth(.1,.6,(PLN.sun&&PLN.sun.night)||0);
  /* точка плиты (местная) → мир: тот же поворот, что у записей (21pc) */
  const at=(x,y,z)=>[px+x*cs+z*sn,top+y,pz+z*cs-x*sn];
  plnRec(Q.a,0,[px,top,pz],1,yaw,1,0,null,0);
  plnInstSet(Q.ib,Q.a,1);
  F.batches.push({geo:Q.body,inst:Q.ib,kind:PLN_KIND.body,to:PLN_TO.all});
  let n=0;
  for(const s of PLN_LPAD_SPOTS){
    const g=plnPadGlow(s,t,kw);
    plnRec(Q.d,n++,at(s[0],.012,s[1]),1,yaw+s[2],1,0,[c[0]*g,c[1]*g,c[2]*g],0);
  }
  plnInstSet(Q.id,Q.d,n);
  F.batches.push({geo:Q.dash,inst:Q.id,kind:PLN_KIND.body,to:PLN_TO.main|PLN_TO.mirror});
  for(let i=0;i<2;i++){
    const s=i?1:-1,p=at(s*(Q.hx-.45),Q.post+.1,Q.hz-.45),g=plnPadBulb(i,t);
    plnRec(Q.u,i,p,.15,0,1,0,[c[0]*g,c[1]*g,c[2]*g],0);
    /* светят на плиту в сумерках и ночью; днём их свет тонет в солнце, место лампы — другим */
    if(dusk>.05&&F.lamps.length<4)F.lamps.push({p,r:8,c:[1,.62,.3],k:1.2*dusk});
  }
  plnInstSet(Q.iu,Q.u,2);
  F.batches.push({geo:Q.bulb,inst:Q.iu,kind:PLN_KIND.body,to:PLN_TO.main|PLN_TO.mirror});
}

/* ── показания посадки (M830) ──
   Строка захода шла в единицах игры («ВЫСОТА 549» при корабле в сорока метрах над землёй) и не
   говорила, где площадка. Под новым видом — метры кадра, скорость в метрах в секунду и сторона
   и расстояние до площадки. Счёт, автопилот и управление те же (19-mode-landing).
   Слова — на вещах (L5): показания стоят в ряду пэдов у ТОРМОЗ, а не в кадре; строка захода
   («Заход на … · тяготение») — плашкой у корабля, как подписи вещей поверхности, а не капителью
   посреди неба. На узком экране ряд занят — показания остаются над ним, как подсказка */
function plnLandRead(L){
  const tr=L.tr,alt=Math.max(0,(groundAt(tr,L.x)-L.y-LAND_GY)/PLN_M);
  const dx=(tr.padX-L.x)/PLN_M,ad=Math.abs(dx);
  const pad=ad<1.5?"над площадкой":(dx<0?"◀ ":"")+"площадка "+Math.round(ad)+" м"+(dx>0?" ▶":"");
  const am=(alt<10?decRu(alt,1):String(Math.round(alt)))+" м";
  if(L.auto)return "автопосадка · "+am+"\n"+pad;
  const vy=L.vy*60/PLN_M,vx=Math.abs(L.vx)*60/PLN_M;
  return "высота "+am+" · "+(vy<0?"подъём ":"снижение ")+decRu(Math.abs(vy),1)+" м/с\nснос "+decRu(vx,1)+" м/с · "+pad;
}
/* строка захода плашкой над кораблём: в пикселях окна, как подписи поверхности (21pj) */
function plnDescOver(){
  const C=PLN.cam,sp=PLN_DESC.sp;
  if(!C||!sp||!(G.msgT>0)||!G.msg||msgHeld())return;
  const u=surfScale()/(G.viewK||1)*UIK,ln=String(G.msg).split("\n"),q=plnOverAt(C,[sp[0],sp[1]+3.6,sp[2]]);
  const f0=(9*u).toFixed(2)+"px ui-monospace,monospace",f1=(8*u).toFixed(2)+"px ui-monospace,monospace";
  let tw=0;
  for(let i=0;i<ln.length;i++){ctx.font=i?f1:f0;tw=Math.max(tw,ctx.measureText(ln[i]).width);}
  const lh=13*u,pw=tw+14*u,ph=ln.length*lh+6*u,x=clamp(q[0],pw/2+8*u,C.ws-pw/2-8*u),y0=Math.max(8*u,q[1]-ph);
  ctx.save();ctx.globalAlpha=clamp(G.msgT/40,0,1);ctx.textAlign="center";
  ctx.fillStyle="rgba(5,7,12,.72)";ctx.fillRect(x-pw/2,y0,pw,ph);
  for(let i=0;i<ln.length;i++){ctx.font=i?f1:f0;ctx.fillStyle=i?"rgba(176,196,208,.78)":"rgba(214,226,232,.96)";ctx.fillText(ln[i],x,y0+3*u+lh*(i+.78));}
  ctx.restore();
}
/* пока виден спуск, строка #msg спрятана (её слово — на плашке), а показания (#prompt) встают в ряд
   пэдов перед ТОРМОЗ; уходя со спуска, всё возвращается на места */
const PLN_DUI={on:false,home:null};
function plnLandUi(on){
  const D=PLN_DUI;
  if(on===D.on||typeof document==="undefined"||!document.body||!document.body.classList)return;
  D.on=on;document.body.classList.toggle("plnland",on);
  const pr=document.getElementById("prompt"),bk=document.querySelector(".pads [data-k=brake]");
  if(!pr||!bk||!bk.parentNode||!pr.parentNode)return;
  if(on&&innerWidth>760){D.home=[pr.parentNode,pr.nextSibling];bk.parentNode.insertBefore(pr,bk);pr.classList.add("inrow");}
  else if(!on&&D.home){D.home[0].insertBefore(pr,D.home[1]);D.home=null;pr.classList.remove("inrow");}
}
const PLN_OLD_HUD=hud;
hud=function(){
  PLN_OLD_HUD.apply(this,arguments);
  plnLandUi(!!(PLN.on&&G.mode==="landing"&&PLN_DESC.live));
};
const PLN_OLD_ULAND=updateLanding;
updateLanding=function(){
  PLN_OLD_ULAND.apply(this,arguments);
  const L=G.land;
  if(PLN.on&&G.mode==="landing"&&L&&L.tr&&!(L.over>0))G.prompt=plnLandRead(L);
};

/* ── переключатель ── */
const PLN_OLD_LANDING=drawLanding;
drawLanding=function(){
  let ok=false;
  if(PLN.on&&PLN.bad<3&&G.land&&G.land.tr&&G.land.p){
    try{
      plnQualAuto();
      ok=plnGpuReady()&&plnDescent();
      if(ok)PLN.bad=0;
    }catch(e){
      PLN.bad++;PLN.err=String((e&&e.stack)||e).slice(0,600);plnLog("спуск: "+PLN.err);
      if(GPU.on&&GPU.dev){GPU.enc=GPU.dev.createCommandEncoder();GPU.scenePass=null;GPU.sceneOn=false;GPU.scene3D=false;}
    }
  }
  BLOOM_K.landing=ok?0:PLN_DESC.bloom;
  PLN_DESC.live=ok;
  if(!ok){PLN_OLD_LANDING.apply(this,arguments);return;}
  withScale(G.viewK,plnDescOver);
};
