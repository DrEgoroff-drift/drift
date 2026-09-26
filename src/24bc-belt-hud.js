/* ══════════════ кабина пояса на слое #ovl (GPU-3; docs/DESIGN-gpu.md) ══════════════
   Кабина и символика стекла — интерфейс поверх мира, и с видеокартой они без 2D: всё, что не
   движется (рама cockpitPaint, тонировка и отражение в стекле, корытце и дуги панели, бумага
   самописца, подложки полос, круги радара, основания рукояток), — мастер, выпечка GPU-холста
   на родном DPR; всё, что живёт, — очередь интерфейса #ovl (08bi) каждый кадр: стрелки, перья,
   лампы, числа, точки радара, лесенка, рамка цели, блик. Порядок — как у 2D: символика стекла,
   блик, мастер, живая доска. Рама вне проёма непрозрачна, поэтому блик уходит ПОД мастер
   (тонировка над ним — разница меньше 1/255), а символика стекла прячется за рамой, как прежде.
   Мастер печётся полосами — шагами печи 17a0 (кадр входа в пояс не платит полноэкранную
   выпечку разом); последний шаг — кадр вхолостую: глифы живых надписей растрятся там.
   Без видеокарты — прежний 2D-рисунок на #c (drawGlassHUD, drawCockpit) */
/* кегль доски: строка шрифта на размер — одна на всю игру, а не новая на каждый кадр */
const BHUD={font:[],need:new Map()};
function ckptFont(px){const F=BHUD.font;return F[px]||(F[px]=px+"px ui-monospace,monospace");}
/* ширина самой длинной подписи ламп — от шрифта и трёх постоянных слов, не от кадра (2D) */
function ckptLampNeed(lamps){
  const f=ctx.font;let v=BHUD.need.get(f);
  if(v===undefined){v=0;for(let i=0;i<lamps.length;i++)v=Math.max(v,ctx.measureText(lamps[i][0]).width);v+=14;BHUD.need.set(f,v);}
  return v;
}
const CKG_BANDS=4;   /* полосы мастера: полноэкранная выпечка на 390×3 — 3 Мпикс, одним шагом это кадр за 25 мс */
const CKG={pid:null,pw:0,ph:0,P:null,key:"",jk:"",M:null,S:null,lazy:new Map(),st:new Map(),need:new Map(),
  in:{b:null,proj:null,st:null},ys:[],frames:0,fa:1};
/* свежий мастер проявляется за столько кадров: целиком за кадр он «выскакивает» (детектор картины) */
const CKG_FADE=10;
const CKG_LAMPS=[["СБЛИЖЕНИЕ","#ff6b57"],["ТОПЛИВО","#ff6b57"],["ТРЮМ ПОЛОН","#c58ae0"]];
/* план рамы — от корабля и размера окна; cockpitTex (2D-холст) в пути видеокарты не зовётся */
function ckgPlan(){
  if(CKG.pid!==G.shipId||CKG.pw!==W||CKG.ph!==H){CKG.pid=G.shipId;CKG.pw=W;CKG.ph=H;CKG.P=cockpitPlan(G.shipId);}
  return CKG.P;
}
function ckgFS(P){return Math.max(clamp(P.UH/70,1,1.75),uiK());}
/* мерка строки шрифтом f — источник глифов GPU-холста, без 2D кадра */
function ckgSt(f){let s=CKG.st.get(f);if(!s)CKG.st.set(f,s=Object.assign({},GC_DEF,{font:f,textAlign:"left",textBaseline:"alphabetic"}));return s;}
function ckgW(f,t){return GC_GLYPHS.measure(ckgSt(f),t).width;}
function ckT(x,y,t,f,col,al){ovText(OVL.uq,x,y,t,f,col,al||"left","alphabetic",1,1);}
/* черта с плоскими концами (lineCap butt) — капсулой, втянутой на полтолщины */
function ckLine(x0,y0,x1,y1,w,col,al){
  const dx=x1-x0,dy=y1-y0,L=Math.hypot(dx,dy),k=L>w?w/2/L:.5;
  ovCap(x0+dx*k,y0+dy*k,x1-dx*k,y1-dy*k,w,col,al);
}
/* спрайт на своём месте: рамка — целые пиксели устройства, дробь места запечена внутрь,
   рисуется тексель в пиксель */
function ckgSpr(x0,y0,x1,y1,paint,o){
  const nd=ovNd(),X0=Math.floor(x0*nd)-1,Y0=Math.floor(y0*nd)-1,X1=Math.ceil(x1*nd)+1,Y1=Math.ceil(y1*nd)+1;
  const B=gpuBake(X1-X0,Y1-Y0,c=>{c.setTransform(nd,0,0,nd,-X0,-Y0);paint(c);},Object.assign({mips:false},o));
  return B&&{B,x:(X0+X1)/2/nd,y:(Y0+Y1)/2/nd,w:(X1-X0)/nd,h:(Y1-Y0)/nd};
}
function ckgPut(S,mul){if(S)ovImage(S.B,S.x,S.y,S.w,S.h,0,S.u0||0,S.v0||0,S.u1||1,S.v1||1,mul==null?1:mul);}
/* спрайт, который вращается: рамка в своих координатах (опора — начало), вдвое плотнее, с мипами */
function ckgRot(x0,y0,x1,y1,paint){
  const nd=ovNd(),w=Math.ceil((x1-x0)*nd*2),h=Math.ceil((y1-y0)*nd*2),sx=w/(x1-x0),sy=h/(y1-y0);
  const B=gpuBake(w,h,c=>{c.setTransform(sx,0,0,sy,-x0*sx,-y0*sy);paint(c);},{ss:1});
  return B&&{B,cx:(x0+x1)/2,cy:(y0+y1)/2,w:x1-x0,h:y1-y0};
}
function ckgPutRot(S,px,py,a,mul){
  if(!S)return;const c=Math.cos(a),s=Math.sin(a);
  ovImage(S.B,px+S.cx*c-S.cy*s,py+S.cx*s+S.cy*c,S.w,S.h,a,S.u0||0,S.v0||0,S.u1||1,S.v1||1,mul==null?1:mul);
}
/* атлас: спрайты в ряд одной выпечкой (каждая выпечка — свой проход и пул, десяток мелких стоил
   кадру входа 11–15 мс). it — {x0,y0,x1,y1,paint} в пикселях CSS: rot — вращаемые (опора — начало,
   вдвое плотнее, с мипами, щель 4 текселя), иначе — на своём месте тексель в пиксель (щель 1);
   px — кусок в пикселях устройства как есть (блик) */
function ckgAtlas(it,rot){
  const nd=ovNd(),k=rot?2*nd:nd,gap=rot?4:1;let x=0,h=1;
  for(const q of it){
    if(q.px){q.X0=0;q.Y0=0;q.X1=q.px[0];q.Y1=q.px[1];}
    else if(rot){q.X0=0;q.Y0=0;q.X1=Math.ceil((q.x1-q.x0)*k);q.Y1=Math.ceil((q.y1-q.y0)*k);}
    else{q.X0=Math.floor(q.x0*k)-1;q.Y0=Math.floor(q.y0*k)-1;q.X1=Math.ceil(q.x1*k)+1;q.Y1=Math.ceil(q.y1*k)+1;}
    q.ox=x;x+=q.X1-q.X0+gap;h=Math.max(h,q.Y1-q.Y0);
  }
  const AW=Math.max(1,x-gap),B=gpuBake(AW,h,c=>{
    for(const q of it){
      c.save();c.setTransform(1,0,0,1,0,0);c.beginPath();c.rect(q.ox,0,q.X1-q.X0,q.Y1-q.Y0);c.clip();
      if(q.px)c.translate(q.ox,0);
      else if(rot){const sx=(q.X1-q.X0)/(q.x1-q.x0),sy=(q.Y1-q.Y0)/(q.y1-q.y0);c.setTransform(sx,0,0,sy,q.ox-q.x0*sx,-q.y0*sy);}
      else c.setTransform(k,0,0,k,q.ox-q.X0,-q.Y0);
      q.paint(c);c.restore();
    }},rot?{ss:1,once:true}:{mips:false,once:true});
  if(!B)return null;
  const R={B};
  for(const q of it){const w=q.X1-q.X0,hh=q.Y1-q.Y0,S={B,u0:q.ox/AW,v0:0,u1:(q.ox+w)/AW,v1:hh/h};
    if(q.px)Object.assign(S,{u0:(q.ox+.5)/AW,u1:(q.ox+w-.5)/AW,v0:.5/h,v1:.5/h});
    else if(rot)Object.assign(S,{cx:(q.x0+q.x1)/2,cy:(q.y0+q.y1)/2,w:q.x1-q.x0,h:q.y1-q.y0});
    else Object.assign(S,{x:(q.X0+q.X1)/2/k,y:(q.Y0+q.Y1)/2/k,w:w/k,h:hh/k});
    R[q.k]=S;}
  return R;
}
/* ленивые спрайты (узел, его отсвет, венцы): держатся до смены мастера */
function ckgLazy(k,mk){let S=CKG.lazy.get(k);if(S===undefined){S=mk();CKG.lazy.set(k,S);}return S;}
/* выпечка (B), спрайт ({B,…}) или их набор — долой с текстурами */
function ckgFree(S){if(!S)return;if(S.tex!==undefined){gpuBakeDrop(S);return;}if(S.B)gpuBakeDrop(S.B);for(const k in S)if(k!=="B"&&S[k]&&typeof S[k]==="object")ckgFree(S[k]);}
function ckgDrop(){
  prebakeDrop(CKG.jk);
  if(CKG.M)for(const m of CKG.M)gpuBakeDrop(m.B);
  ckgFree(CKG.S);for(const S of CKG.lazy.values())ckgFree(S);
  CKG.lazy.clear();CKG.M=CKG.S=null;CKG.key="";
}
/* ── геометрия доски: одна на мастер и на живой кадр ── */
function ckgGeo(P,FS){
  const D=P.dashY,UH=P.UH,x0=P.x0,BW=P.BW,pad=D+11;
  const rr=Math.min(UH*.44,44*FS),gL=12+4*44+3*5,gR=W-(12+3*44+56+3*5),gW=gR-gL,k=clamp(gW/230,.55,1);
  return {D,UH,x0,BW,pad,bw2:Math.round(8*FS),lx:x0+Math.round(52*FS),rr,rcx:x0+BW*.5,rcy:D+UH*.5,tx:x0+BW*.62,
    cw:Math.min(118,BW*.2),hx:P.pw+16,hy:D-70,gL,gR,gW,gC:(gL+gR)/2,k,yy:H-8,gh:clamp(P.dashH*.26,26,52)*k,
    thx:(gL+gR)/2-gW*.40,trk:clamp(P.dashH*.28,28,54)*k,hw:8*k};
}
/* ── мастер: всё неподвижное, в порядке 2D-рисунка ── */
function ckgPaint(c,P,FS){
  const K=P.K,T=K.tint,A=hex2rgb(P.acc),g=ckgGeo(P,FS),fnt=s=>ckptFont(Math.round(s*FS));
  /* стекло: тонировка и отражение доски в нижней кромке (блик ползёт — он живой, под мастером) */
  c.save();tracePath(c,P.glass);c.clip();
  c.fillStyle="rgba("+T[0]+","+T[1]+","+T[2]+",.035)";c.fillRect(0,0,W,H);
  const rf=c.createLinearGradient(0,P.dashY-H*.12,0,P.dashY);
  rf.addColorStop(0,"rgba(0,0,0,0)");rf.addColorStop(1,rgba(A,(.05*K.glow).toFixed(3)));
  c.fillStyle=rf;c.fillRect(0,P.dashY-H*.12,W,H*.12);
  c.restore();
  cockpitPaint(c,P);
  /* на время выпечки глобальный ctx — этот холст (08ca): панель и лента рисуют свою неподвижную часть */
  instrPanel(P,FS,"base");tapeStrip(P,FS,"base");
  /* погашенные лампы стоек; горящая ложится поверх живой */
  c.fillStyle="rgba(255,255,255,.05)";
  for(let s=-1;s<=1;s+=2)for(const L of P.leds){c.beginPath();c.arc(s<0?P.pw*.42:W-P.pw*.42,L.y,L.r,0,TAU);c.fill();}
  /* подложки полос с подписями, «СКОРОСТЬ» */
  for(const [x,lab] of [[g.x0+6,"ТОПЛ"],[g.x0+30*FS,"КОРП"]]){
    c.fillStyle="rgba(255,255,255,.07)";c.fillRect(x,g.pad,g.bw2,g.UH-22);
    c.fillStyle="rgba(93,115,130,.9)";c.font=fnt(8);c.textAlign="left";c.fillText(lab,x-1,g.pad+g.UH-22+11*FS);
  }
  c.fillStyle="rgba(93,115,130,.8)";c.font=fnt(8);c.fillText("СКОРОСТЬ",g.lx,g.pad+8*FS);
  /* радар: круги и сектор обзора */
  c.strokeStyle="rgba(120,190,210,.28)";c.lineWidth=1;
  c.beginPath();c.arc(g.rcx,g.rcy,g.rr,0,TAU);c.stroke();
  c.strokeStyle="rgba(120,190,210,.12)";
  c.beginPath();c.arc(g.rcx,g.rcy,g.rr*.55,0,TAU);c.stroke();
  c.fillStyle="rgba(127,230,216,.10)";
  c.beginPath();c.moveTo(g.rcx,g.rcy);c.arc(g.rcx,g.rcy,g.rr,-Math.PI/2-.42,-Math.PI/2+.42);c.closePath();c.fill();
  /* подложка трюма */
  c.fillStyle="rgba(255,255,255,.07)";c.fillRect(g.tx,g.pad+50*FS,g.cw,6);
  /* основания рукояток и паз рычага тяги */
  if(g.gW>=86){
    for(let s=-1;s<=1;s+=2){
      c.fillStyle="rgba(16,22,30,.95)";c.beginPath();c.ellipse(g.gC+s*g.gW*.19,g.yy,14*g.k,6*g.k,0,0,TAU);c.fill();
      c.strokeStyle=rgba(A,.3);c.lineWidth=1;c.stroke();
    }
    const {thx,yy,trk,hw}=g;
    c.fillStyle="rgba(10,15,21,.95)";c.fillRect(thx-hw,yy-trk-6,hw*2,trk+10);
    c.strokeStyle=rgba(A,.28);c.lineWidth=1;c.strokeRect(thx-hw,yy-trk-6,hw*2,trk+10);
    c.fillStyle="rgba(255,255,255,.06)";c.fillRect(thx-2,yy-trk-2,4,trk);
  }
}
/* ── спрайты мастера — два атласа: на месте (блик, валик ленты над перьями, курсовой треугольник,
   кронштейн узла) и вращаемые (подписи лесенки ±20…±60 справа от якоря −62u, 3u) ── */
function ckgSprites(P,FS){
  const g=ckgGeo(P,FS),A=hex2rgb(P.acc),u=uiK(),it=[],tb=tapeStripBox(P),{hx,hy}=g;
  /* блик — три текселя: 0, пик, 0; линейная выборка между их центрами — тот же кусочно-линейный градиент */
  it.push({k:"ramp",px:[3,1],paint:c=>{c.fillStyle="rgba(190,225,255,"+(.045*P.K.glow).toFixed(3)+")";c.fillRect(1,0,1,1);}});
  if(tb){const rw=Math.min(7,tb.w*.08);
    it.push({k:"roll",x0:tb.x+tb.w-rw,y0:tb.y,x1:tb.x+tb.w,y1:tb.y+tb.h,paint:c=>tapePaper(c,tb.x,tb.y,tb.w,tb.h,"roll")});}
  it.push({k:"head",x0:W/2-6,y0:H*.176-2,x1:W/2+6,y1:H*.184+2,paint:c=>{
    c.strokeStyle="rgba(242,178,92,.8)";c.lineWidth=1.2;
    c.beginPath();c.moveTo(W/2,H*.176);c.lineTo(W/2-4,H*.184);c.lineTo(W/2+4,H*.184);c.closePath();c.stroke();}});
  it.push({k:"brk",x0:hx-19,y0:hy-5,x1:hx+13,y1:hy+11,paint:c=>{
    c.fillStyle="rgba(14,20,28,.95)";c.fillRect(hx-18,hy-4,30,4.5);
    c.beginPath();c.moveTo(hx-18,hy-4);c.lineTo(hx-18,hy+10);c.lineTo(hx-8,hy+.5);c.closePath();c.fill();
    c.strokeStyle=rgba(A,.35);c.lineWidth=1;c.strokeRect(hx-18.5,hy-4.5,31,5.5);
    c.fillStyle="rgba(255,255,255,.06)";c.fillRect(hx-18,hy-4,30,1.2);}});
  return ckgAtlas(it,false);
}
/* подписи шкал — вторым атласом, своим шагом печи (одна выпечка за кадр, 17a0) */
function ckgLab(S){
  const u=uiK(),f=uiFont(8),ax=-62*u,ay=3*u,m0=GC_GLYPHS.measure(ckgSt(f),"+60"),lt=[];
  const up=m0.actualBoundingBoxAscent+2,dn=m0.actualBoundingBoxDescent+2;
  for(const d of [-60,-40,-20,20,40,60]){const t=d>0?"+"+d:""+d,tw=ckgW(f,t);
    lt.push({k:d,x0:ax-tw-2,y0:ay-up,x1:ax+2,y1:ay+dn,paint:c=>{c.fillStyle="rgba(127,230,216,.4)";c.font=f;c.textAlign="right";c.fillText(t,ax,ay);}});}
  S.lab=ckgAtlas(lt,true);
}
/* задача печи: спрайты, полосы мастера (крупная — одна на кадр, PB_PX), кадр вхолостую. Брошенная
   задача (сменились корабль или окно) отдаёт испечённое */
function* ckgJob(P,FS,nd){
  const M=[];let S=null,done=false;
  try{
    const Wd=Math.round(W*nd),Hd=Math.round(H*nd);
    /* первый рисунок рамы платит разовое (растр строк таблички, подписей шкал и полос: на 390×3 — 12 мс,
       половина — рама, половина — приборы) — двумя шагами в пиксель, чтобы не лечь в кадр с первой полосой */
    for(const f of [c=>cockpitPaint(c,P),c=>ckgPaint(c,P,FS)]){
      gpuBakeDrop(gpuBake(1,1,c=>{c.setTransform(nd,0,0,nd,0,0);f(c);},{mips:false,ss:1,once:true}));
      yield;
    }
    for(let i=0;i<CKG_BANDS;i++){
      const Y0=Math.round(Hd*i/CKG_BANDS),Y1=Math.round(Hd*(i+1)/CKG_BANDS);
      const B=gpuBake(Wd,Y1-Y0,c=>{c.setTransform(nd,0,0,nd,0,-Y0);ckgPaint(c,P,FS);},{mips:false,ss:nd<1.5?2:1,once:true});
      if(!B)return null;
      M.push({B,Y0,Y1});yield;
    }
    S=ckgSprites(P,FS);if(!S)return null;
    yield;
    ckgLab(S);if(!S.lab)return null;
    yield;
    const I=CKG.in;
    /* прогрев — по шагу на кусок кадра (на 390×3 разом это 25 мс глифов); тяжёлые — первыми в своих
       кадрах, лёгкий — последним: печь не цепляет его к тяжёлому в один кадр */
    if(I.b)for(const m of [1,4,8,2]){ckgWarm({M,S},P,FS,I.b,I.proj,I.st,m);yield;}
    done=true;return {M,S};
  }finally{if(!done){for(const m of M)gpuBakeDrop(m.B);ckgFree(S);}}
}
/* кадр вхолостую: очереди #ovl срезаются обратно, остаются растр глифов и ленивые спрайты */
function ckgWarm(T,P,FS,b,proj,st,m){
  const Qs=[OVL.uq,OVL.lq,OVL.cq,OVL.ur,OVL.gd],n=Qs.map(q=>q.length);
  try{ckgFrame(T,P,FS,b,proj,st,m);}finally{Qs.forEach((q,i)=>q.length=n[i]);}
}
/* мастер: готов — CKG, печётся — null */
function ckgTex(P,FS){
  const nd=ovNd(),key=G.shipId+"|"+W+"x"+H+"|"+nd+"|"+FS;
  if(CKG.key===key&&CKG.M&&CKG.M[0].B.dev===GPU.dev)return CKG;
  if(CKG.key!==key||CKG.M)ckgDrop();
  CKG.key=key;CKG.jk="ckpt|"+key;
  /* кадр входа в пояс и так тяжёл (камни, пыль, устье) — печь начинает со следующего */
  const f=GPU.frameNo,cont=CKG.lf===f-1;CKG.lf=f;
  if(!cont&&!PB.has(CKG.jk))return null;
  const r=prebake(CKG.jk,()=>ckgJob(P,FS,nd));
  if(!r)return null;
  CKG.M=r.M;CKG.S=r.S;CKG.fa=0;return CKG;
}
/* ── живой кадр ── */
function ckgGlass(T,b,proj){
  const D=6000,u=uiK(),S=T.S;
  for(let deg=-60;deg<=60;deg+=10){
    const th=deg*Math.PI/180,ct=Math.cos(th),st2=Math.sin(th);
    const p=proj(b.x+Math.sin(b.yaw)*ct*D,b.y+st2*D,b.z+Math.cos(b.yaw)*ct*D);
    const q=proj(b.x+Math.sin(b.yaw+.14)*ct*D,b.y+st2*D,b.z+Math.cos(b.yaw+.14)*ct*D);
    if(!p||!q)continue;
    if(p.x<-W||p.x>W*2||p.y<-H||p.y>H*2)continue;
    const zero=deg===0,w=(zero?96:(deg%20===0?58:34))*u,ang=Math.atan2(q.y-p.y,q.x-p.x),c=Math.cos(ang),s=Math.sin(ang);
    const col=zero?"rgba(127,230,216,.55)":"rgba(127,230,216,.25)",hk=deg>0?5:-5;
    const L=(x0,y0,x1,y1)=>ckLine(p.x+x0*c-y0*s,p.y+x0*s+y0*c,p.x+x1*c-y1*s,p.y+x1*s+y1*c,1,col);
    L(-w,0,-14,0);L(14,0,w,0);
    if(!zero){L(-w,0,-w,hk);L(w,0,w,hk);}
    if(deg%20===0&&!zero){
      /* подпись: почти без крена — строкой атласа (резко, как 2D), иначе повёрнутым спрайтом */
      if(Math.abs(ang)<.01)ckT(p.x+(-w-4*u)*c-3*u*s,p.y+(-w-4*u)*s+3*u*c,deg>0?"+"+deg:""+deg,uiFont(8),"rgba(127,230,216,.4)","right");
      else ckgPutRot(S.lab[deg],p.x,p.y,ang);
    }
  }
  /* маркер вектора скорости */
  const sp=Math.hypot(b.vx,b.vy,b.vz);
  if(sp>.12){
    const p=proj(b.x+b.vx/sp*D,b.y+b.vy/sp*D,b.z+b.vz/sp*D);
    if(p){const col="rgba(150,240,180,.8)";
      ovEll(p.x,p.y,7,7,1.4,col);
      ovRect(p.x-13,p.y-.7,p.x-7,p.y+.7,col);ovRect(p.x+7,p.y-.7,p.x+13,p.y+.7,col);ovRect(p.x-.7,p.y-13,p.x+.7,p.y-7,col);}
  }
  /* рамка цели: уголки — два прямоугольника со срезом по митре, без перекрытия */
  if(b.lock){
    const t=proj(b.lock.x,b.lock.y,b.lock.z);
    if(t){
      const s=clamp(b.lock.r*Math.min(W,H)*.95/t.z,16,190),c=s*.42,col="rgba(242,178,92,.9)",h=.7;
      for(let ox=-1;ox<=1;ox+=2)for(let oy=-1;oy<=1;oy+=2){
        const X=t.x+ox*s,Y=t.y+oy*s,xa=X-ox*c,xb=X+ox*h,ya=Y-oy*h,yb=Y-oy*c;
        ovRect(Math.min(xa,xb),Y-h,Math.max(xa,xb),Y+h,col);
        ovRect(X-h,Math.min(ya,yb),X+h,Math.max(ya,yb),col);
      }
      ckT(t.x,t.y-s-7*u,RES[b.lock.res].ru.toUpperCase()+" ×"+b.lock.left+"   "+Math.round(t.z)+" М",uiFont(9),col,"center");
    }
  }
  /* прицел */
  {const col=b.lock?"rgba(242,178,92,.95)":"rgba(127,230,216,.6)",X=W/2,Y=H/2,h=.65;
   ovEll(X,Y,10,10,1.3,col);
   ovRect(X-22,Y-h,X-13,Y+h,col);ovRect(X+13,Y-h,X+22,Y+h,col);ovRect(X-h,Y-22,X+h,Y-13,col);ovRect(X-h,Y+13,X+h,Y+22,col);}
  /* курсовая лента */
  const hd=((b.yaw*57.3)%360+360)%360,col="rgba(127,230,216,.55)",f=uiFont(9);
  for(let i=-3;i<=3;i++){
    const v=Math.round(hd/10)*10+i*10,x=W/2+(v-hd)*3.4*u;
    if(Math.abs(x-W/2)>W*.22)continue;
    const vv=((v%360)+360)%360;
    ckT(x,H*.155,vv<10?"00"+vv:vv<100?"0"+vv:""+vv,f,col,"center");
    ovRect(x,H*.163,x+1,H*.163+4*u,col);
  }
  ckgPut(S.head);
  if(b.hit>0)ovRect(0,0,W,H,"rgb(255,80,60)",+(b.hit/14*.22).toFixed(2));
}
/* блик на стекле: ползёт с креном и тангажом — полоса из трёх текселей, повёрнутая вдоль градиента */
function ckgGlint(T,b){
  const gx=W/2+Math.sin(b.roll)*W*.4,gy=H*.3-Math.sin(b.pitch)*H*.2,dx=W*.55,dy=H*.45;
  const R=T.S.ramp;
  ovImage(R.B,gx-W*.3+dx/2,gy-H*.2+dy/2,Math.hypot(dx,dy),2*Math.hypot(W,H),Math.atan2(dy,dx),R.u0,R.v0,R.u1,R.v1,1);
}
/* m — что рисовать (прогрев делит кадр): 1 — стекло, 2 — панель и лента, 4 — полосы, скорость и радар,
   8 — цель, трюм, лампы, узел, рукоятки; нет — всё */
function ckgFrame(T,P,FS,b,proj,st,m){
  if(!m){m=15;CKG.frames++;}
  if(m&1){ckgGlass(T,b,proj);ckgGlint(T,b);}
  const nd=ovNd();
  for(const q of T.M)ovImage(q.B,W/2,(q.Y0+q.Y1)/2/nd,q.B.w/nd,(q.Y1-q.Y0)/nd,0,0,0,1,1,1);
  if(m&2)ckgPanel(T,P,FS);
  const K=P.K,g=ckgGeo(P,FS),fnt=s=>ckptFont(Math.round(s*FS));
  if(m&4){
  /* лампы стоек */
  for(let s=-1;s<=1;s+=2)for(const L of P.leds){
    if(!(L.on&&Math.sin(G.t*L.sp+L.ph)>-.35))continue;
    const x=s<0?P.pw*.42:W-P.pw*.42;
    ovEll(x,L.y,L.r,L.r,0,K.led);ovEll(x,L.y,L.r*3.4,L.r*3.4,0,K.led,.22);
  }
  /* полосы топлива и корпуса: столб и деления поверх */
  const vb=(x,f,col)=>{const y=g.pad,w=g.bw2,h=g.UH-22;f=clamp(f,0,1);
    ovRect(x,y+h*(1-f),x+w,y+h,f<.22?"#ff6b57":col);
    for(let i=1;i<5;i++)ovRect(x,y+h*i/5-.5,x+w,y+h*i/5+.5,"rgba(0,0,0,.5)");};
  vb(g.x0+6,G.fuel/st.fuelMax,"#7fe6d8");vb(g.x0+30*FS,G.hull/st.hullMax,"#f2b25c");
  const spd=Math.hypot(b.vx,b.vy,b.vz);
  ckT(g.lx,g.pad+27*FS,spd.toFixed(1),fnt(18),"#7fe6d8");
  /* радар: точки камней, корабль */
  const RANGE=2000,fx=Math.sin(b.yaw),fz=Math.cos(b.yaw),rx=Math.cos(b.yaw),rz=-Math.sin(b.yaw),rr=g.rr;
  for(let ai=0,ast=b.ast;ai<ast.length;ai++){
    const a=ast[ai],dx=a.x-b.x,dz=a.z-b.z,dy=a.y-b.y;
    if(dx*dx+dy*dy+dz*dz>RANGE*RANGE)continue;
    const px=(dx*rx+dz*rz)/RANGE*rr,py=(dx*fx+dz*fz)/RANGE*rr,lk=a===b.lock,s=lk?3.2:clamp(a.r/38,1,2.2);
    ovEll(g.rcx+px,g.rcy-py,s,s,0,lk?"#f2b25c":RES[a.res].col,lk?1:clamp(1-Math.abs(dy)/700,.2,.9));
  }
  {const t=[g.rcx*nd,(g.rcy-4)*nd,(g.rcx-3)*nd,(g.rcy+3)*nd,(g.rcx+3)*nd,(g.rcy+3)*nd];
   ovPush(OVL.uq,t[2],t[1],t[4],t[3],ovPm("#e8f4f2"),2,0,0,0,t);}
  }
  if(!(m&8))return;
  /* цель и трюм */
  const tx=g.tx,pad=g.pad;
  if(b.lock){
    const dd=Math.hypot(b.lock.x-b.x,b.lock.y-b.y,b.lock.z-b.z)-b.lock.r,far=dd>CUT_RANGE;
    ckT(tx,pad+12*FS,RES[b.lock.res].ru.toUpperCase()+" ×"+b.lock.left,fnt(12),RES[b.lock.res].col);
    ckT(tx,pad+24*FS,Math.round(dd)+" М"+(far?"   ДАЛЕКО":""),fnt(8),far?"rgba(255,107,87,.9)":"rgba(93,115,130,.9)");
    ovRect(tx,pad+30*FS,tx+104,pad+30*FS+4,"rgba(255,255,255,.08)");
    ovRect(tx,pad+30*FS,tx+104*clamp(b.prog,0,1),pad+30*FS+4,"#f2b25c");
  }else ckT(tx,pad+12*FS,"— НЕТ ЗАХВАТА —",fnt(11),"rgba(93,115,130,.45)");
  let cxp=tx;const hd=held();
  for(const k of RES_KEYS){const q=G.cargo[k];if(!q)continue;const w=g.cw*q/st.cargoMax;
    ovRect(cxp,pad+50*FS,cxp+w,pad+50*FS+6,RES[k].col);cxp+=w;}
  ckT(tx,pad+46*FS,"ТРЮМ "+hd+" / "+st.cargoMax,fnt(8),"rgba(93,115,130,.8)");
  ckgLamps(g,b,st,hd,fnt(8));
  ckgNode(T,P,g,b);
  /* рукоятки и рычаг тяги */
  if(g.gW>=86){
    const {gC,gW,k,yy,gh}=g,tilt=clamp(b.avYaw*8,-.5,.5),lean=clamp(-b.avPitch*7,-.45,.45),c=Math.cos(tilt*.55),s0=Math.sin(tilt*.55);
    for(let s=-1;s<=1;s+=2){
      const X=gC+s*gW*.19,R=(u,v)=>[X+u*c-v*s0,yy+u*s0+v*c];
      const a=R(0,0),e=R(lean*20*k,-gh),m=R(lean*15*k,-gh*.68),bl=R(lean*20*k,-gh-1);
      ovCap(a[0],a[1],e[0],e[1],5*k,"rgba(150,180,200,.6)");
      ovCap(m[0],m[1],e[0],e[1],10*k,"rgba(22,30,40,.98)");
      ovEll(bl[0],bl[1],2.6*k,2.6*k,0,(s<0?keys.act:keys.fire)?"#f2b25c":"rgba(242,178,92,.3)");
    }
    const {thx,trk,hw}=g,tp=keys.thrust?1:(keys.brake?0:.32),th=yy-6-trk*tp;
    ovRect(thx-hw-1,th-4*k,thx+hw+1,th+4*k,keys.thrust?"#f2b25c":"rgba(180,205,222,.65)");
    ovRect(thx-hw-1,th-1,thx+hw+1,th+1,"rgba(0,0,0,.45)");
  }
}
/* панель на блоке (25a) и лента (25b): стрелки, невязка, перья, валик поверх, перо у края */
function ckgPanel(T,P,FS){
  if(P.brow<26)return;
  const {w,x0,cw,h,y}=instrPanelGeo(P),R=instrRead(),col="rgba(150,176,190,";
  for(let i=0;i<R.length;i++){
    const cx=x0+cw*(i+.5),a=Math.PI*1.12+Math.PI*.76*instrTrack(R[i]),c=Math.cos(a),s=Math.sin(a);
    ckLine(cx+1,y+h*.5+1.6,cx+1+c*h*.76,y+h*.5+1.6+s*h*.76,1.6,"rgba(0,0,0,.42)");
    ckLine(cx,y+h*.5,cx+c*h*.78,y+h*.5+s*h*.78,1.4,col+".85)");
    ovEll(cx,y+h*.5,1.4,1.4,0,col+".85)");
  }
  const mv=instrMisclose(),mt="НЕВЯЗКА "+mv.toFixed(3),f=Math.max(8*uiK(),Math.round(7*FS))+"px ui-monospace,monospace";
  const mw=Math.ceil(ckgW(f,mt))+14,mx=x0+w+14,my=y-h-2,mh=h+8,sc=col+".18)";
  ovRect(mx,my,mx+mw,my+mh,"rgba(6,9,13,.55)");
  ovRect(mx,my,mx+mw,my+1,sc);ovRect(mx,my+mh-1,mx+mw,my+mh,sc);ovRect(mx,my+1,mx+1,my+mh-1,sc);ovRect(mx+mw-1,my+1,mx+mw,my+mh-1,sc);
  ckT(mx+mw/2,my+mh/2,mt,f,col+".55)","center");
  const bw=mw-10,bx=mx+5,by=my+mh-4;
  ovRect(bx,by,bx+bw,by+2,"rgba(0,0,0,.40)");ovRect(bx,by,bx+Math.max(1,bw*clamp(mv,0,1)),by+2,col+".55)");
  const B=tapeStripBox(P);if(!B)return;
  const Tp=tapeInit(),cols=Math.min(Tp.n-1,Math.floor(B.w)),sc2=B.w/Math.max(1,cols),th=B.h/TAPE_PENS;
  if(cols>=1)for(let i=0;i<TAPE_PENS;i++){
    const top=B.y+th*i+1.2,hh=th-2.4,ys=CKG.ys[i]||(CKG.ys[i]=[]);ys.length=cols+1;
    for(let k=0;k<=cols;k++){const idx=(Tp.head-1-Tp.back-(cols-k)+TAPE_N*2)%TAPE_N;ys[k]=top+hh*(1-Tp.col[idx*TAPE_PENS+i]/255);}
    ovGraph(B.x,Math.max(B.y,top-1),B.x+B.w,Math.min(B.y+B.h,top+hh+1),B.x,sc2,ys,1,"rgba(38,44,40,.80)");
  }
  ckgPut(T.S.roll);
  const x1=B.x+B.w;
  if(!Tp.back){const x=x1-1.5+Tp.tick*1.6;ovRect(x-.6,B.y+1,x+.6,B.y+B.h-1,"rgba(24,28,26,.85)");}
  else ovRect(B.x,B.y,x1,B.y+B.h,"rgba(10,14,18,.16)");
}
/* лампы доски: три, и все три — беда; тесно — подпись только у горящей, две горят — чередуются */
function ckgLamps(g,b,st,hd,f){
  const ly=g.pad+g.UH-10,lstep=Math.min(92,(g.rcx-g.rr-g.lx-10)/3);
  let need=CKG.need.get(f);
  if(need===undefined){need=0;for(const L of CKG_LAMPS)need=Math.max(need,ckgW(f,L[0]));need+=14;CKG.need.set(f,need);}
  const tight=lstep<need,step=tight?16:lstep,lit=[b.near<130&&Math.sin(G.t*.25)>-.2,G.fuel/st.fuelMax<.2,hd>=st.cargoMax],nd=ovNd();
  let nl=0,li=-1;
  for(let i=0;i<3;i++){
    const x=g.lx+i*step,on=lit[i],L=CKG_LAMPS[i];
    ovRect(x,ly-6,x+6,ly,on?L[1]:"rgba(255,255,255,.05)");
    if(on){   /* горящая подсвечивает раму вокруг себя — сложением (lighter), альфа 0 в премультипликации */
      const c=gcColor(L[1]),X=(x+3)*nd,Y=(ly-3)*nd,R=8*nd;
      ovPush(OVL.uq,X-R,Y-R,X+R,Y+R,[c[0]*.25,c[1]*.25,c[2]*.25,0],6,0,0,0,[X,Y,R,R,0,1]);
      nl++;
    }
    if(!tight)ckT(x+9,ly,L[0],f,on?L[1]:"rgba(93,115,130,.4)");
  }
  if(tight&&nl){let k=Math.floor(G.t/150)%nl;for(let i=0;i<3;i++)if(lit[i]&&k--===0){li=i;break;}
    ckT(g.lx+3*step+6,ly,CKG_LAMPS[li][0],f,CKG_LAMPS[li][1]);}
}
/* держатель узла под стойкой (M101): кронштейн, узел на тросике качается, отсвет, венцы */
function ckgNode(T,P,g,b){
  if(typeof nodeHolder!=="function")return;
  const N=nodeHolder(),{hx,hy}=g;
  let nc=0;for(const F of NODE_FAMS)if(G.crowns&&G.crowns[F.id])nc++;
  if(!N&&!nc)return;
  ckgPut(T.S.brk);
  if(N){
    const sw=clamp(b.roll*.6+b.avYaw*3,-.5,.5);
    const S=ckgLazy("n|"+N.id+"|"+N.seed,()=>ckgRot(-16,-2,16,37,c=>{
      c.strokeStyle="rgba(180,200,215,.35)";c.lineWidth=1;c.beginPath();c.moveTo(0,0);c.lineTo(0,9);c.stroke();
      c.translate(0,21);drawNodeIcon(c,N,24);}));
    ckgPutRot(S,hx+2,hy+1,Math.sin(G.t*.045)*.05+sw*.5);
    ckgPut(ckgLazy("g|"+N.col,()=>ckgSpr(hx+2-24,hy+22-24,hx+2+24,hy+22+24,c=>{
      const ng=c.createRadialGradient(hx+2,hy+22,2,hx+2,hy+22,24);
      ng.addColorStop(0,rgba(hex2rgb(N.col),.10));ng.addColorStop(1,rgba(hex2rgb(N.col),0));
      c.fillStyle=ng;c.beginPath();c.arc(hx+2,hy+22,24,0,TAU);c.fill();})));
  }
  let i=0;
  for(const F of NODE_FAMS){
    if(!(G.crowns&&G.crowns[F.id]))continue;
    const cx2=hx-15+i*3.4,j=i;
    ckgPut(ckgLazy("c|"+j+"|"+F.col,()=>ckgSpr(cx2-2,hy-2.2,cx2+2,hy+2.2,c=>{
      c.fillStyle=rgba(mixc(hex2rgb(F.col),[255,255,255],.35),.9);
      c.beginPath();c.moveTo(cx2,hy-1.6);c.lineTo(cx2+1.5,hy);c.lineTo(cx2,hy+1.6);c.lineTo(cx2-1.5,hy);c.closePath();c.fill();})),
      .6+.4*Math.sin(G.t*.06+j*1.3));
    i++;
  }
}
/* стойка (25d) и всё, что легло в очередь интерфейса до кабины, — поверх неё: кабину — в начало */
function ckgUnder(i0,r0){
  if(!i0)return;
  const Q=OVL.uq,R=OVL.ur,n0=i0/OVL_N,n1=(Q.length-i0)/OVL_N;
  const A=Q.splice(0,i0);for(let i=0;i<A.length;i++)Q.push(A[i]);
  const Ra=R.splice(0,r0);for(const r of R)r[0]-=n0;for(const r of Ra){r[0]+=n1;R.push(r);}
}
/* стекло и кабина пояса: с видеокартой — мастер и очередь #ovl, без неё — на #c */
function beltHudPush(b,proj,fwd,st,bas){
  if(!GPU.on||!GPU.ok){drawGlassHUD(b,proj,fwd,st);drawCockpit(b,st);return;}
  if(!OVL.cv&&!ovCanvas())return;   /* мерка слоя (ovNd) — от его холста с первого кадра: иначе ключ мастера сменится на втором */
  const P=ckgPlan(),FS=ckgFS(P),I=CKG.in;
  I.b=b;I.proj=proj;I.st=st;
  const T=ckgTex(P,FS);
  if(!T)return;
  const i0=OVL.uq.length,r0=OVL.ur.length;
  ckgFrame(T,P,FS,b,proj,st);
  /* проявление свежего мастера: цвет premultiplied — множитель на все четыре числа (и у картинок) */
  if(T.fa<1){T.fa=Math.min(1,T.fa+1/CKG_FADE);const Q=OVL.uq,a=T.fa*T.fa;
    for(let i=i0;i<Q.length;i+=OVL_N){Q[i+4]*=a;Q[i+5]*=a;Q[i+6]*=a;Q[i+7]*=a;}}
  ckgUnder(i0,r0);
}
