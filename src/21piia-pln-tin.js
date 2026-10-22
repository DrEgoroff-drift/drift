/* ══════════════ планета: Жестянка телами (plnOverOld, пункт 1, 22.10) ══════════════
   Жестянка (12ta) была наклейкой поверх кадра (tinDraw). Теперь это железо на земле движка, и правила
   tinDraw те же:

   1. Не дом и не корабль: приёмная воронка, лежачий барабан, труба, наклонная лента и бункер выдачи.
      Печатник ленты стоит в стороне — память машины не та же вещь, что машина.
   2. Всё на ОДНОЙ отметке: бетонная плита, врезанная в склон (срез земли — plnOwnFlat 21pig).
   3. Видно, что внутри: уровень наряда в воронке, выданное — за окном бункера (чистая функция T,
      сетка пересобирается по восьмым долям).
   4. Работает — барабан крутится (рёбра в четырёх фазах), из трубы идёт дым; встала — ничего не движется.
   5. Лампа мигает всегда: её никто не выключал, и это единственное, что здесь происходит само.

   Мерило — человек (1.75 м): воронка по плечо поднятой руки (4.3 м), барабан — полтора роста в поперечнике,
   бункер — два роста. Место — tinSpotX (12ta): проход и подсказки игры читают ту же точку. */
const TIN_V={z:4.5,hx:8.2,hz:3.6,hop:-5.2,drum:-.3,bin:5.8,print:8.6};
const TINB={it:null,gen:-1,L:null,at:null};

/* место: середина площадки; отметка — земля линии хода у её середины, как у наклейки (groundAt): к воронке
   подходят пешком, и плита выше тропы на склоне ставила машину на макушку холма, над головой у игрока.
   Склон за плитой срезается и подсыпается до отметки (plnOwnFlat) */
function plnTinAt(L,tr,p){
  if(!OWN.on||!p||typeof tinCanLive!=="function"||!tinCanLive(p))return null;
  const bx=tinSpotX(p,tr);if(bx==null)return null;
  if(TINB.at&&TINB.at.bx===bx&&TINB.at.L===L)return TINB.at;
  const x=bx/PLN_M,z=TIN_V.z,hw=TIN_V.hx+1.5;
  let y=0,lo=1e9;const f0=L.flat;L.flat=null;
  try{
    y=plnLandRibAt(L,x,0);
    for(let dx=-hw;dx<=hw+.01;dx+=hw/5)for(const dz of [-3,0,3])lo=Math.min(lo,plnLandRibAt(L,x+dx,z+dz));
  }finally{L.flat=f0;}
  return (TINB.at={L,bx,x,y:y+.05,z,lo});
}
/* срез под плитой и площадка расчистки трав: зовут plnOwnFlat и plnOwnPads (21pig) */
function plnTinFlat(L){
  const tr=L&&L.tr,p=tr&&tr.p,A=tr&&p?plnTinAt(L,tr,p):null;
  return A?[[A.x+.9,A.z+.4,TIN_V.hx+3.2,TIN_V.hz+2.2,A.y-.06]]:null;
}
function plnTinPad(tr,p){
  if(!OWN.on||typeof tinCanLive!=="function"||!tinCanLive(p))return null;
  const bx=tinSpotX(p,tr);if(bx==null)return null;
  return [bx/PLN_M+.9,TIN_V.z+.6,TIN_V.hx+3,TIN_V.hz+2,9];
}
/* то, от чего зависит вид: идёт ли смена, сколько в воронке и в бункере (по восьмым) */
function plnTinState(T){
  const run=!!(T&&T.run>0),A=T?tinAskOf(T.seed):null;
  const fq=T&&T.fed>0&&A?Math.max(1,Math.round(clamp(T.fed/A.need,0,1)*8)):0;
  const bq=T&&T.bin>0?Math.max(1,Math.round(clamp(T.bin/TIN_BIN,0,1)*8)):0;
  return {run,fq,bq,A,key:[run,fq,bq,A?A.k+A.made:"-"].join(",")};
}

/* краски: хозяйская рыжая краска, выцветшая и в ржавчине, по ней — сталь. Доли наклейки (pal·.44+30)
   в движке давали чёрный силуэт: свет честный, и тёмное железо против неба уходило в сажу */
function plnTinPal(p){
  const pal=p.T.pal,MK=PLN_MARK_COL,f=(c,k,b)=>plnRgb(c.map(v=>v*k+b));
  return {iron:plnMix3(plnMix3(MK.orange,MK.concrete,.42),f(pal[2],.6,40),.15),dark:plnMix3(MK.steelDk,f(pal[3],.4,20),.3),
    lite:plnMix3(MK.steelLt,f(pal[1],.6,60),.3),steel:plnMix3(MK.steel,f(pal[2],.6,40),.2)};
}
function plnTinMesh(A,st,p,sd){
  const C=plnTinPal(p),V=TIN_V,MK=PLN_MARK_COL,m=plnMesh(1<<14),lm=plnMesh(1<<9),pm=plnMesh(1<<8),K=plnOwnKit(m,lm),MAN=PLN_MAT.man;
  const iron=plnOwnSteel(C.iron,.45,sd),steel=plnOwnSteel(C.steel,.25,sd+7),dark=plnOwnSteel(C.dark,.2,sd+3),haz=plnMix3(MK.orange,[.9,.6,.2],.3);
  const conc=plnSetMott(plnMix3(C.dark,[.34,.33,.31],.55),.18,.9,sd+1);
  const tv=hashi(p.seed,0x71A,2),dw=(64+((tv>>>3)&3)*12)/PLN_M,ch=(34+((tv>>>1)&3)*9)/PLN_M,nh=3+((tv>>>5)&3);
  /* ── плита: бетон в землю, по переднему краю — полосы опасности ── */
  K.box([0,-.42,0],[V.hx,.6,V.hz],conc,{box:.12,bump:.02,seed:sd});
  for(let x=-V.hx+.5,i=0;x<V.hx-.4;x+=.9,i++)
    plnCard(m,[x,.08,-V.hz-.01],[x,.17,-V.hz-.01],[x+.45,.17,-V.hz-.01],[x+.45,.08,-V.hz-.01],[0,0,-1],i%2?C.dark:haz,MAN,null,0,0);
  /* ── приёмная воронка: четыре ноги, раструб квадратом, тёмный зев, уровень наряда ── */
  {const hx=V.hop,hz=-.6,y0=2,y1=4.3,r0=.72,r1=1.75;
   for(const sx of [-1,1])for(const sz of [-1,1])K.rod([hx+sx*1.05,0,hz+sz*.95],[hx+sx*r0*.75,y0+.05,hz+sz*r0*.75],.08,dark,{sides:6});
   K.rod([hx-1.05,.9,hz-.95],[hx+1.05,.9,hz-.95],.05,dark,{sides:5});
   plnTube(m,{path:[[hx,y0,hz],[hx,y1,hz]],rad:t=>(r0+(r1-r0)*t)*Math.SQRT2,sides:4,up:[1,0,1],col:iron,mat:MAN,cap:false});
   plnTube(m,{path:[[hx,y0-.35,hz],[hx,y0+.02,hz]],rad:.32,sides:8,col:dark,mat:MAN,cap:true});
   K.box([hx,y1-.12,hz],[r1-.08,.04,r1-.08],[.012,.012,.012],{box:.1,sub:1});
   if(st.fq&&st.A){const f=st.fq/8,yl=y0+(y1-y0-.2)*f,rl=r0+(r1-r0)*(yl-y0)/(y1-y0)-.06;
     K.box([hx,yl,hz],[rl,.08,rl],plnSetMott(plnHex(RES[st.A.k].col),.25,3,sd+4),{box:.3,bump:.2,seed:sd+4});}
   /* кромка — светлая; полосы по переднему скату: единственное место, куда человек лезет руками */
   for(const s of [-1,1]){K.rod([hx-r1,y1+.03,hz+s*r1],[hx+r1,y1+.03,hz+s*r1],.06,C.lite,{sides:5});
     K.rod([hx+s*r1,y1+.03,hz-r1],[hx+s*r1,y1+.03,hz+r1],.06,C.lite,{sides:5});}
   const k=(r1-r0)/(y1-y0);
   for(let i=0;i<4;i++){const xa=hx-1.45+i*.8,yA=y1-.55,yB=y1-.25;
     plnCard(m,[xa,yA,hz-(r0+k*(yA-y0))-.03],[xa,yB,hz-(r0+k*(yB-y0))-.03],[xa+.38,yB,hz-(r0+k*(yB-y0))-.03],[xa+.38,yA,hz-(r0+k*(yA-y0))-.03],[0,.42,-1],haz,MAN,null,0,0);}}
  /* ── барабан на станине; рёбра крутятся отдельной сеткой ── */
  const dx=V.drum,dy=3.45,dr=1.28;
  K.box([dx,.62,0],[dw/2+.5,.62,1.05],dark,{box:.15});
  for(const s of [-1,1])K.box([dx+s*(dw/2-.4),1.75,0],[.18,.6,.95],dark,{box:.2});
  plnTube(m,{path:[[dx-dw/2,dy,0],[dx+dw/2,dy,0]],rad:dr,sides:20,col:iron,mat:MAN,cap:true});
  for(let i=0;i<nh;i++){const hxx=dx-dw/2+.25+(dw-.5)*i/(nh-1),pth=[];
    for(let k=0;k<=20;k++){const a=k/20*TAU;pth.push([hxx,dy+Math.cos(a)*(dr+.06),Math.sin(a)*(dr+.06)]);}
    plnTube(m,{path:pth,rad:.07,sides:5,col:plnMul(C.dark,.8),mat:MAN});}
  K.rod([dx-dw/2-.35,dy,0],[dx+dw/2+.35,dy,0],.22,dark,{sides:8});
  /* ── труба за барабаном: дым только когда идёт смена (остывшая ничего не выдаёт) ── */
  const cx=dx+28/PLN_M,cz=1.25,ctop=4.6+ch;
  K.rod([cx,1.2,cz],[cx,ctop,cz],.42,steel,{sides:10});
  K.rod([cx,ctop-.1,cz],[cx,ctop+.25,cz],.56,dark,{sides:10});
  for(let y=2.6;y<ctop-.5;y+=1.6)K.rod([cx,y,cz],[cx,y+.1,cz],.47,dark,{sides:10,cap:false});
  plnTube(m,{path:[[cx,ctop+.2,cz],[cx,ctop+.27,cz]],rad:.36,sides:10,col:[.01,.01,.01],mat:MAN,cap:true});
  /* ── лента: короб от барабана к бункеру на двух стойках ── */
  {const a0=[dx+dw/2+.1,3.05],a1=[V.bin-1.25,4.15],L2=Math.hypot(a1[0]-a0[0],a1[1]-a0[1]),ang=Math.atan2(a1[1]-a0[1],a1[0]-a0[0]);
   K.box([(a0[0]+a1[0])/2,(a0[1]+a1[1])/2,0],[L2/2+.3,.16,.55],dark,{box:.15,lean:ang});
   for(const s of [-1,1])K.rod([a0[0],a0[1]+.2,s*.58],[a1[0],a1[1]+.2,s*.58],.05,iron,{sides:5});
   for(const t of [.3,.75]){const x=a0[0]+(a1[0]-a0[0])*t,y=a0[1]+(a1[1]-a0[1])*t;
     for(const s of [-1,1])K.rod([x,0,s*.45],[x,y-.15,s*.45],.07,dark,{sides:6});}}
  /* ── бункер выдачи: короб с окном, за окном — выданное ── */
  {const bx=V.bin,bw=1.5,bh=4,bd=1.35;
   K.box([bx,bh/2,0],[bw,bh/2,bd],steel,{box:.12});
   K.box([bx,bh+.06,0],[bw+.1,.08,bd+.1],C.lite,{box:.12,sub:1});
   K.box([bx,bh/2+.35,-bd-.02],[1.15,1.55,.04],[.006,.007,.008],{box:.1,sub:1});
   if(st.bq&&st.A){const h=3.0*st.bq/8;
     K.box([bx,.4+.35+h/2,-bd-.05],[1.1,h/2,.03],plnSetMott(plnHex(RES[st.A.made].col),.25,4,sd+5),{box:.15,sub:1});}
   K.box([bx,.3,-bd-.5],[1.75,.12,.6],dark,{box:.15,sub:1,pitch:-.12});
   for(const s of [-1,1])K.box([bx+s*bw*.6,-.1,0],[.25,.35,bd*.8],dark,{box:.2,sub:1});
   /* плафон над окном: горит, пока идёт смена — ночью по нему машину и видно */
   K.box([bx,bh-.12,-bd-.28],[.34,.1,.26],dark,{box:.2,sub:1});
   plnBlob(pm,{c:[bx,bh-.24,-bd-.3],r:[.26,.05,.18],sub:1,col:[1,.86,.6],mat:PLN_MAT.glow,glow:2.4,x:1});}
  /* ── лампа на барабане ── */
  const lp=[dx-34/PLN_M,dy+dr+.65,-.2];
  K.rod([lp[0],dy+dr-.05,lp[2]],[lp[0],lp[1]-.1,lp[2]],.05,dark,{sides:5});
  K.lamp(null,lp,[.13,.13,.13],[1,.72,.3],2.4);
  /* ── печатник: столб с козырьком, лента бумаги до земли (качается ветром) ── */
  {const px=V.print,pz=-.4;
   K.box([px,-.2,pz],[.75,.35,.6],conc,{box:.2});
   K.box([px,1.7,pz],[.36,1.7,.3],steel,{box:.15});
   K.box([px,3.55,pz-.08],[.55,.18,.45],dark,{box:.15,pitch:.12});
   K.box([px,2.6,pz-.31],[.18,.06,.03],[.01,.01,.01],{box:.1,sub:1});
   const pa=[.88,.9,.88],zf=pz-.34;
   plnCard(m,[px-.13,.25,zf-.05],[px-.13,2.58,zf],[px+.13,2.58,zf],[px+.13,.25,zf-.05],[0,0,-1],pa,PLN_MAT.leaf,[.6,0,0,.6],0,0);
   plnCard(m,[px+.13,.25,zf-.04],[px+.13,2.58,zf+.01],[px-.13,2.58,zf+.01],[px-.13,.25,zf-.04],[0,0,1],pa,PLN_MAT.leaf,[.6,0,0,.6],0,0);}
  /* рёбра барабана: четыре фазы по пятнадцать градусов — шесть рёбер повторяют себя через шестьдесят */
  const ribs=[];
  for(let j=0;j<4;j++){const rm=plnMesh(1<<10);
    for(let k=0;k<6;k++){const a=(k/6+j/24)*TAU,yy=dy+Math.cos(a)*(dr+.03),zz=Math.sin(a)*(dr+.03);
      plnTube(rm,{path:[[dx-dw/2+.05,yy,zz],[dx+dw/2-.05,yy,zz]],rad:.06,sides:4,col:plnMul(C.dark,.7),mat:MAN,cap:false});
      if(Math.cos(a)>-.2)plnBlob(rm,{c:[dx-dw/2+.25,dy+Math.cos(a)*(dr+.13),Math.sin(a)*(dr+.13)],r:[.07,.07,.07],sub:1,col:C.lite,mat:MAN});}
    ribs.push(rm);}
  return {body:m,light:lm,plaf:pm,plafAt:[V.bin,3.7,-1.9],ribs,smoke:[[cx,ctop+.4,cz,.85,10]],lamp:lp,blots:[[0,0,V.hx+.6,.4],[V.print,-.4,.8,.3]]};
}
function plnTinFree(){
  const it=TINB.it;if(!it)return;
  for(const g of [it.geo,it.light,it.plaf].concat(it.ribs))if(g)plnGeoFree(g);
  if(it.inst)plnInstFree(it.inst);if(it.sinst)plnInstFree(it.sinst);
  TINB.it=null;
}
function plnTinStep(L,S){
  if(TINB.gen!==PLN_GPU.gen||TINB.L!==L){plnTinFree();TINB.gen=PLN_GPU.gen;TINB.L=L;TINB.at=null;}
  const A=plnTinAt(L,S.tr,S.p);
  if(!A){plnTinFree();return true;}
  const T=tinAt(G.sx,G.sy),st=plnTinState(T);
  if(TINB.it&&TINB.it.key===st.key){TINB.it.A=A;return true;}
  plnTinFree();
  const sd=hashi(G.sx,G.sy,(S.p.idx|0)+0x71DB),M=plnTinMesh(A,st,S.p,sd),g=x=>x&&x.nv?plnGeo(plnMeshDone(x)):null;
  const it={A,key:st.key,st,geo:g(M.body),light:g(M.light),plaf:g(M.plaf),plafAt:M.plafAt,ribs:M.ribs.map(g),smoke:M.smoke,lamp:M.lamp,blots:M.blots,
    a:new Float32Array(16*4),sa:new Float32Array(16*64),inst:null,sinst:null};
  for(let i=0;i<4;i++)plnRec(it.a,i,[A.x,A.y,A.z],1,0,1,sd%97,i===1||i===3?[1,1,1]:null);
  it.inst=plnInst(it.a,4,4);it.sinst=plnInst(null,0,64);
  TINB.it=it;return true;
}
/* в кадр: тело, мигалка, рёбра в фазе хода, дым смены; ночью — лампа-мигалка в общий выбор своих ламп */
function plnTinFrame(F,S,ex,V,nk,want){
  const it=TINB.it;if(!it)return;
  const A=it.A,pos=[A.x,A.y,A.z];
  if(Math.abs(A.x-ex)>V.hw*(1+A.z/V.D)+TIN_V.hx+14)return;
  const t=F.t,Bk=PLN_KIND.body,TO=PLN_TO.all,LIT=PLN_TO.lit,blink=(t%2.33)<1.17,lk=blink?1.25:.12;
  const run=it.st.run,pk=run?.25+.85*nk:.04;
  plnRec(it.a,1,pos,1,0,1,0,[lk,lk,lk]);
  plnRec(it.a,3,pos,1,0,1,0,[pk,pk,pk]);
  plnInstSet(it.inst,it.a,4);
  if(it.geo)F.batches.push({geo:it.geo,inst:it.inst,first:0,count:1,kind:Bk,to:TO});
  if(it.light)F.batches.push({geo:it.light,inst:it.inst,first:1,count:1,kind:Bk,to:LIT});
  if(it.plaf)F.batches.push({geo:it.plaf,inst:it.inst,first:3,count:1,kind:Bk,to:LIT});
  const ph=it.st.run?Math.floor(t*4)%4:0,rg=it.ribs[ph];
  if(rg)F.batches.push({geo:rg,inst:it.inst,first:2,count:1,kind:Bk,to:TO});
  if(it.st.run)plnSetSmoke(F,it.sa,it.sinst,it.smoke,pos,t,nk);
  if(nk>.05&&run){const l=it.plafAt;want.push({o:2.4,l:{p:[A.x+l[0],A.y+l[1],A.z+l[2]],r:9,c:[1,.84,.6],k:2*nk}});}
  if(nk>.05&&blink){const l=it.lamp;want.push({o:2.5,l:{p:[A.x+l[0],A.y+l[1],A.z+l[2]],r:5,c:[1,.7,.32],k:1.4*nk}});}
  const b=F.blobs;let n=b[0]|0;
  for(const q of it.blots){if(n>=64)break;b.set([A.x+q[0],A.z+q[1],q[2],q[3]],4+n*4);n++;}
  b[0]=n;
}
