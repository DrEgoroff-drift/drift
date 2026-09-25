/* ══════════════ ШТАБ: рубка, а не список ══════════════ */
/* Экран ШТАБ был единственным местом в игре, где люди жили строчками с
   портретом-марочкой: плоско, без масштаба и без света. Теперь наверху экрана
   стоит комната — командная рубка, — и в ней у каждого домена свой пульт,
   а у пульта стоит тот, кто домен держит. Пустой домен виден тёмным пультом:
   отсутствие читается местом, а не отсутствием строки.

   ПРАВИЛА, КОТОРЫМ ПОДЧИНЁН ФАЙЛ (те же, что в кантине и отсеках базы):
   1. Мерило — человек: стоящий 66 единиц, пульт ему по пояс, экран над пультом
      на высоте глаз, потолок на высоте двух ростов.
   2. Порядок рисования и есть сцена: стена → потолок и короб → окно → пульты
      с экранами → люди у пультов → голо-стол переднего плана → мелочь на нём →
      подписи → пыль в конусах → виньетка. Люди ЗА столом, а не поверх.
   3. Плоских заливок нет: стена — секции, швы, заклёпки и микрозерно; пол —
      решётка с перспективой; экран — развёртка, сетка и блик.
   4. Свет откуда-то: две лампы под потолком, экраны пультов и голо-стол снизу.
   5. Приборы показывают настоящее состояние домена, а не орнамент. */
const HQ_H=192;                                   // высота комнаты в своих единицах
/* Домены стоят в постоянном порядке: рубка не должна перекладываться от того,
   кого наняли раньше. */
const HQ_ORDER=["cmd","keep","fact","sci"];
/* ── рубка на видеокарте (G11, 27f1) ──
   Комната стоит из частей. Стена с пультами, голограмма и стол печутся GPU-холстом
   и живут текстурой, пока не сменится то, что на них нарисовано (люди, числа на
   экранах, размер панели). Люди — по спрайту на ноги и на корпус: корпус дышит
   сдвигом, без перепечки. Всё, что бежит (развёртка, клавиши, дроны, планеты
   голограммы, огни за окном), — фигуры набора каждый кадр. Последний проход — свет:
   лампы с источником и спадом, конус с пылью, свет экранов цветом домена,
   голо-стол снизу, тёплые дежурные лампы у пола, тени под стоящими. */
function hqLay(W2,H2){
  const fy=H2-16,cy=fy-30;
  return {W2,H2,fy,cy,st:hqStations(W2),seed:0x5748,
    wx:10,wy:24,ww:Math.min(W2*.22,150),wh:52,
    cx:W2*.5,ty:H2-22,rx:Math.min(W2*.32,215),ry:10};
}
function hqMgrAt(i){return G.mgrs.find(x=>x.role===HQ_ORDER[i])||null;}
/* лица управляющих — холсты 2D; номер холста входит в ключ выпечки фигуры */
const HQ_FACE_ID=new WeakMap();let HQ_FACE_N=0;
function hqFaceId(f){if(!f)return 0;let i=HQ_FACE_ID.get(f);if(!i){i=++HQ_FACE_N;HQ_FACE_ID.set(f,i);}return i;}
/* что нарисовано на экране домена — ключ неподвижной части стены */
function hqScreenKey(role,m){
  if(!m)return "-";
  const l=m.ai?100:clamp(m.loy,0,100),lv=m.ai?3:(l>=60?2:(l>=30?1:0));
  let s=m.id+":"+lv+":"+(mgrPoints(m)>0?1:0)+":";
  if(role==="cmd")s+=G.crew.filter(cr=>cr.shipId&&cr.order&&cr.order.kind!=="home").length+"/"+G.crew.length;
  else if(role==="keep")s+=Object.keys(G.bases||{}).length+"/"+(G.drones||[]).length;
  else if(role==="fact")s+=(m.route?m.route.length:0)+"/"+mgrRouteMax(m);
  else s+=(m.gotData||0)+"/"+mgrSamples();
  return s;
}
function drawHqRoom(cn,sel,hover){
  const dpr=cn.__dpr||1,cssW=cn.width/dpr,cssH=cn.height/dpr;
  const k=cssH/HQ_H,W2=cssW/k,L=hqLay(W2,HQ_H);
  /* попадания — в JS, без видеокарты тоже: по человеку тыкают всегда */
  const hits=[];
  HQ_ORDER.forEach((role,i)=>{const m=hqMgrAt(i);
    if(m)hits.push({id:m.id,x:(L.st[i]-20)*k,y:(L.fy-96)*k,w:40*k,h:92*k});});
  const R=rpgGet(cn);if(!R)return hits;
  R.dpr=dpr;
  const pw=cn.width,ph=cn.height,s=k*dpr,sz=pw+"x"+ph;
  const mg=HQ_ORDER.map((r,i)=>hqMgrAt(i));
  const back=rpgBake(R,"back",sz+"|"+HQ_ORDER.map((r,i)=>hqScreenKey(r,mg[i])).join(","),pw,ph,g=>{g.scale(s,s);hqBack(g,L);});
  const holo=rpgBake(R,"holo",sz+"|"+((G.sys&&G.sys.key)||""),pw,ph,g=>{g.scale(s,s);hqHolo(g,L);});
  const table=rpgBake(R,"table",sz+"|"+mg.map(m=>m?1:0).join(""),pw,ph,g=>{g.scale(s,s);hqTable(g,L.W2,L.H2,L.fy,L.seed);});
  const lab=(sel||hover)?rpgBake(R,"lab",sz+"|"+sel+"|"+hover,pw,ph,g=>{g.scale(s,s);hqLabels(g,L,sel,hover);}):null;
  /* фигуры: спрайт ног и спрайт корпуса (корпус печётся без вдоха — вдох даёт сдвиг) */
  const FW=60,FH=114,figs=[];
  mg.forEach((m,i)=>{
    if(!m)return;
    const col=hex2rgb(MGR_ROLES[HQ_ORDER[i]].col),face=mgrFace(m,26),ai=!!m.ai;
    const key=sz+"|"+m.id+"|"+ai+"|"+hqFaceId(face);
    const bake=part=>rpgBake(R,"fig"+i+part,key,FW*s,FH*s,g=>{g.scale(s,s);hqFigure(g,FW/2,FH-6,col,0,face,ai,m,i,part);});
    figs.push({i,m,legs:bake("legs"),top:bake("top")});
  });
  const t=G.t,live=hqLive(L,mg,sel,hover,t);
  const box=(B,dy)=>({x:cssW/2,y:cssH/2+(dy||0),w:cssW,h:cssH});
  rpgFrame(R,ps=>{
    rpgImage(R,ps,back,[box()]);
    rpgShapes(R,ps,live.wall.map(v=>hqPx(v,k)));
    rpgShapes(R,ps,live.halo.map(v=>hqPx(v,k)),"add");
    for(const f of figs){
      const x=L.st[f.i]*k,y=(L.fy-6-FH/2)*k,bob=Math.sin(t*.026+f.i*1.9)*1.0*k;
      rpgImage(R,ps,f.legs,[{x,y,w:FW*k,h:FH*k}]);
      rpgImage(R,ps,f.top,[{x,y:y+bob,w:FW*k,h:FH*k}]);
    }
    rpgShapes(R,ps,live.job.map(v=>hqPx(v,k)));
    rpgImage(R,ps,holo,[box()],"add");
    rpgShapes(R,ps,live.holo.map(v=>hqPx(v,k)),"add");
    rpgImage(R,ps,table,[box()]);
    if(lab)rpgImage(R,ps,lab,[box()]);
  },(pl,S)=>rpgField(R,pl,"hqlit",RPG_WGSL+HQ_LIT_WGSL,hqLitUni(L,mg,k,t),[S]));
  return hits;
}
/* фигура в единицах комнаты → в пиксели CSS панели */
function hqPx(v,k){
  const o=v.slice();
  if(o[0]===5){for(let j=1;j<=6;j++)o[j]*=k;}
  else if(o[0]===1||o[0]===3){o[1]*=k;o[2]*=k;o[3]*=k;o[5]*=k;o[6]*=k;}
  else{o[1]*=k;o[2]*=k;o[3]*=k;o[4]*=k;o[5]*=k;o[6]*=k;}
  return o;
}
/* числа света: лампы, кто на месте, цвет экранов, стол, окно */
const HQ_LIT_U=new Float32Array(60);
function hqLitUni(L,mg,k,t){
  const u=HQ_LIT_U;u.fill(0);
  u.set([k,L.W2,L.fy,t],0);
  for(let i=0;i<4;i++){
    u[4+i]=L.st[i];u[8+i]=mg[i]?1:0;
    const c=hex2rgb(MGR_ROLES[HQ_ORDER[i]].col);
    u.set([c[0]/255,c[1]/255,c[2]/255,mg[i]?1:.12],12+i*4);
  }
  u.set([L.cx,L.ty,L.rx,L.H2],28);
  u.set([L.wx,L.wy,L.ww,L.wh],32);
  const sc=(G.sys&&G.sys.cls&&G.sys.cls.col)?hex2rgb(G.sys.cls.col):[150,205,240];
  u.set([sc[0]/255,sc[1]/255,sc[2]/255,0],36);
  return u;
}
const HQ_LIT_WGSL=`
fn field(p:vec2f,uv:vec2f)->vec4f{
  let k=fu.v[0].x;let W2=fu.v[0].y;let fy=fu.v[0].z;let t=fu.v[0].w;
  let q=p/k;let tb=fu.v[7];let H2=tb.w;
  let base=textureSampleLevel(t0,smp,uv,0.).rgb;
  let cold=vec3f(.80,.89,1.);
  /* рассеянный — холодный и низкий: углы и простенки уходят в сумрак */
  var L=vec3f(.38,.42,.50);
  var beam=vec3f(0.);var cone=0.;
  let haze=rfbm(q*vec2f(.045,.028)+vec2f(t*.010,-t*.018));
  for(var i=0;i<4;i++){
    let lx=fu.v[1][i];let d=q-vec2f(lx,35.);
    /* лампа — точка со спадом, светит вниз: над ней сумрак, под ней пятно */
    let dn=smoothstep(-16.,26.,d.y);
    L+=cold*(1.20*dn*2600./(2600.+d.x*d.x+d.y*d.y*.65));
    if(d.y>0.){
      let hw=10.+50.*d.y/max(fy-35.,1.);
      /* конус с кромкой (как у 2D-трапеции) и ярче у лампы */
      let cn=smoothstep(1.0,.74,abs(d.x)/hw)*(1.1-.75*clamp(d.y/max(fy-35.,1.),0.,1.))*smoothstep(fy+8.,fy-2.,q.y);
      cone+=cn;
      beam+=cold*cn*(.050+.135*haze);
    }
    /* блик самой лампы: полоса светится, воздух у неё — тоже */
    beam+=cold*(.30*exp(-(d.x*d.x/420.+d.y*d.y/30.))+.10*exp(-(d.x*d.x/2400.+d.y*d.y/260.)));
    let fp=q-vec2f(lx,fy+1.);
    L+=cold*.95*exp(-(fp.x*fp.x/2600.+fp.y*fp.y/70.));
  }
  /* экраны: свет цвета домена на нишу, пульт и лицо стоящего */
  for(var i=0;i<4;i++){
    let s=fu.v[3+i];let d=q-vec2f(fu.v[1][i],fy-104.);
    L+=s.rgb*s.w*(.50*2200./(2200.+d.x*d.x*.7+d.y*d.y*1.4));
  }
  /* голо-стол светит снизу вверх, дежурные лампы под кромкой — тёплый акцент у пола */
  let dh=q-vec2f(tb.x,tb.y-24.);
  L+=vec3f(.47,.74,.92)*(.55*1600./(1600.+dh.x*dh.x*.35+dh.y*dh.y));
  let dw=(q-vec2f(tb.x,tb.y+9.))/vec2f(max(tb.z,1.)*1.25,18.);
  L+=vec3f(1.,.68,.34)*.85*exp(-dot(dw,dw));
  /* окно: тусклый холодный свет снаружи на левую стену и пол */
  let wn=fu.v[8];let dwn=q-vec2f(wn.x+wn.z*.5,wn.y+wn.w*.8);
  L+=vec3f(.34,.46,.70)*.30*exp(-dot(dwn,dwn)/4200.);
  /* тени: под стоящими, под тумбами пультов, по стыку стены и пола */
  var sh=1.;
  for(var i=0;i<4;i++){
    let x=fu.v[1][i];
    let a=(q.x-x)/16.;let b=(q.y-(fy-3.))/3.4;
    sh*=1.-.60*fu.v[2][i]*exp(-(a*a+b*b));
    let cb=abs(q.x-x)-57.;let c2=(q.y-(fy-2.))/4.5;
    sh*=1.-.40*smoothstep(7.,-5.,cb)*exp(-c2*c2);
  }
  let jn=(q.y-(fy-4.))/7.;
  sh*=1.-.25*exp(-jn*jn);
  var c=base*L*sh+beam;
  /* голограмма светится в воздухе над столом — цветом вашей звезды */
  let hs=q-vec2f(tb.x,tb.y-26.);
  c+=fu.v[9].rgb*(.20*exp(-dot(hs,hs)/260.)+.06*exp(-dot(hs,hs)/2600.));
  /* пыль: видна в конусе лампы, в сумраке — едва */
  let m=rmotes(q,t,.20,.05)+rmotes(q+vec2f(37.,11.),t*.8,.33,.035)*.7;
  c+=cold*m*(.004+.45*min(cone,1.2));
  /* виньетка: как у старой рубки, но по кривой, а не по прямой */
  let vd=clamp((length(q-vec2f(W2*.5,H2*.5))-H2*.34)/(H2*.71),0.,1.);
  c*=1.-.62*vd*vd*(3.-2.*vd);
  /* зерно по яркости и дизеринг: тёмный градиент без ступенек */
  c=rshoulder(c);
  let px=floor(p*fu.res.x/max(fu.res.z,1.));
  let gr=rh1(px+vec2f(fract(t*.37)*91.,fract(t*.53)*57.))-.5;
  c=c*(1.+.06*gr)+(rh1(px*1.37+vec2f(3.1,7.7))-.5)/255.;
  return vec4f(max(c,vec3f(0.)),1.);}`;
/* подписи над выбранным и рамка его экрана — своя выпечка, меняется по выбору */
function hqLabels(c,L,sel,hover){
  HQ_ORDER.forEach((role,i)=>{
    const m=hqMgrAt(i);
    if(!m)return;
    const on=sel===m.id,hv=hover===m.id;
    if(!on&&!hv)return;
    const x=L.st[i],col=hex2rgb(MGR_ROLES[role].col);
    /* рамка экрана пульта */
    const w=104,h=42,sx=x-w/2,sy=L.cy-100;
    c.strokeStyle=rgba(col,on?.85:.45);c.lineWidth=1.4;c.strokeRect(sx-3.5,sy-3.5,w+7,h+7);
    c.font="9px ui-monospace,monospace";c.textAlign="center";
    const nm=m.name.toUpperCase()+" · "+MGR_ROLES[role].ru.toUpperCase();
    /* подпись идёт НАД экраном пульта: на высоте головы она перечёркивала
       график домена — то самое, ради чего экран и рисуется */
    const tw=c.measureText(nm).width,ty=L.fy-152;
    c.fillStyle="rgba(6,10,16,.88)";c.fillRect(x-tw/2-6,ty,tw+12,14);
    c.strokeStyle=rgba(col,.55);c.lineWidth=1;
    c.strokeRect(x-tw/2-5.5,ty+.5,tw+11,13);
    c.fillStyle=on?"#e8f4f2":"rgba(220,232,240,.75)";c.fillText(nm,x,ty+10);
    c.textAlign="left";
  });
}
/* что бежит каждый кадр — фигуры набора в единицах комнаты:
   wall — на стене (развёртка, клавиши, дроны, борт по маршруту, огни за окном),
   halo — нимб за головой выбранного, job — метка поручения над плечом,
   holo — живое над столом (корона, планеты, звёзды, метка «вы здесь») */
function hqLive(L,mg,sel,hover,t){
  const wall=[],halo=[],job=[],holo=[];
  const rc=(a,x,y,w,h,c,al)=>a.push([0,x,y,x+w,y+h,0,0,c[0],c[1],c[2],al]);
  const {fy,cy,st}=L;
  st.forEach((x,i)=>{
    const m=mg[i],role=HQ_ORDER[i];if(!m)return;
    const col=hex2rgb(MGR_ROLES[role].col);
    const w=104,h=42,sx=x-w/2,sy=cy-100;
    /* строка развёртки ползёт вниз — экран живой, но не мигает */
    const ry=sy+((t*22+x)%h),y0=Math.max(ry,sy+3),y1=Math.min(ry+2,sy+h-3);
    if(y1>y0)wall.push([0,sx+3,y0,sx+w-3,y1,0,0,col[0],col[1],col[2],.10]);
    const px=x-58;
    for(let j=0;j<7;j++)rc(wall,px+12+j*13,cy+3.5,8,4,col,.20+.18*Math.sin(t*1.7+j+x));
    if(mgrPoints(m)>0){const pl=.5+.5*Math.sin(t*3);
      wall.push([1,px+9,cy+6,2.2,0,0,0,242,178,92,.35+.5*pl]);}
    const dx=sx+6,dy=sy+6;
    if(role==="keep"){
      const dr=(G.drones||[]).length;
      for(let j=0;j<Math.min(12,dr);j++){const a=t*.6+j*1.2,rr=6+((j*7)%9);
        rc(wall,dx+22+Math.cos(a)*rr*1.6,dy+18+Math.sin(a)*rr*.5,2,2,col,.8);}
    }else if(role==="fact"&&m.route&&m.route.length>=2){
      const u=(t*.25)%1;rc(wall,dx+4+u*(w-12-8),dy+21,2,2,[255,255,255],.8);
    }
    const on=sel===m.id,hv=hover===m.id;
    if(on||hv)halo.push([1,x,fy-56,2,0,0,44,col[0],col[1],col[2],on?.30:.16]);
    if(m.job){const bob=Math.sin(t*.026+i*1.9)*1.0,al=.5+.4*Math.sin(t*2.4),x0=x+16,y0=fy-4-72+bob;
      job.push([5,x0,y0,x0+6,y0+6,x0,y0+12,242,178,92,al]);}
  });
  /* огни за окном: один бежит по четырём */
  const {wx,wy,ww,wh}=L,on=(t*.9|0)%4;
  rc(wall,wx+ww*.44+on*ww*.11,wy+wh*.48,1.8,1.8,[242,178,92],.9);
  /* голограмма: корона дышит, планеты идут по орбитам, звёзды фона мерцают */
  const {cx,ty,rx}=L,pr=15,py0=ty-26;
  const scol=(G.sys&&G.sys.cls&&G.sys.cls.col)?hex2rgb(G.sys.cls.col):[150,205,240];
  const lc=mixc(scol,[255,255,255],.5);
  holo.push([3,cx,py0,pr*(1+.05*Math.sin(t*1.1)),0,.5,0,lc[0],lc[1],lc[2],.35]);
  const pl=(G.sys&&G.sys.planets)||[],omax=pl.length?pl[pl.length-1].orbit:1;
  pl.forEach(p=>{
    const orr=rx*.20+(p.orbit/omax)*rx*.34,a=p.ang+t*p.spd*160;
    const px=cx+Math.cos(a)*orr,py=py0+6+Math.sin(a)*orr*.26;
    const col=p.T&&p.T.col?hex2rgb(p.T.col):[150,205,240];
    holo.push([1,px,py,1.6+Math.min(2.4,p.radius/26),0,0,0,col[0],col[1],col[2],.85]);
    holo.push([1,px,py,1.5,0,0,2.5+Math.min(3,p.radius/26),col[0],col[1],col[2],.22]);
  });
  const RR=rng(L.seed^0x33);
  for(let i=0;i<14;i++){
    const a=RR()*TAU,rr=.5+RR()*.5;
    const px=cx+Math.cos(a)*rx*.92*rr,py=ty-16-Math.abs(Math.sin(a))*28*rr;
    const tw=.5+.5*Math.sin(t*1.4+i);
    holo.push([1,px,py,.9+RR()*1.1,0,0,0,150,205,240,.08+tw*.14]);
  }
  /* метка «вы здесь»: ромб с пульсацией */
  const mk=.5+.5*Math.sin(t*2.2),mx=cx+rx*.44,my=ty-24,ma=.35+mk*.45;
  holo.push([5,mx,my-4,mx+3.4,my,mx,my+4,242,190,120,ma],[5,mx,my-4,mx,my+4,mx-3.4,my,242,190,120,ma]);
  return {wall,halo,job,holo};
}
/* ── стена, потолок, пол, окно, лампы, простенки и пульты — неподвижное ── */
function hqBack(c,L){
  const {W2,H2,fy,cy,seed}=L,R=rng(seed);
  /* ── стена: три масштаба ── */
  const wg=c.createLinearGradient(0,0,0,fy);
  wg.addColorStop(0,rgba([18,22,30],1));
  wg.addColorStop(.62,rgba([28,33,43],1));
  wg.addColorStop(1,rgba([20,24,32],1));
  c.fillStyle=wg;c.fillRect(0,0,W2,fy);
  for(let i=0;i<Math.ceil(W2/72);i++){              // секции обшивки
    c.fillStyle="rgba(255,255,255,"+(.010+R()*.014).toFixed(3)+")";
    c.fillRect(i*72,14,68,fy-14);
    c.fillStyle="rgba(0,0,0,.24)";c.fillRect(i*72+68,14,2,fy-14);
    c.fillStyle="rgba(200,214,228,.05)";            // заклёпки
    c.fillRect(i*72+9,20,2,2);c.fillRect(i*72+9,fy-24,2,2);
    c.fillRect(i*72+58,20,2,2);c.fillRect(i*72+58,fy-24,2,2);
  }
  for(let i=0;i<70;i++){                            // микрозерно
    c.fillStyle="rgba(0,0,0,"+(.03+R()*.05).toFixed(3)+")";
    c.fillRect(R()*W2,14+R()*(fy-30),1.2,1.2);
  }
  /* ── потолок и кабельный короб ── */
  c.fillStyle="rgba(0,0,0,.45)";c.fillRect(0,0,W2,13);
  c.fillStyle="rgba(52,60,72,.55)";c.fillRect(0,13,W2,2);
  for(let x=8;x<W2;x+=54){                          // подвесы короба
    c.fillStyle="rgba(70,80,94,.4)";c.fillRect(x,4,3,9);
  }
  c.strokeStyle="rgba(60,70,84,.5)";c.lineWidth=1.4; // кабели вдоль потолка
  for(let i=0;i<3;i++){
    c.beginPath();c.moveTo(0,17+i*2.6);
    for(let x=0;x<=W2;x+=40)c.lineTo(x,17+i*2.6+Math.sin(x*.05+i)*1.4);
    c.stroke();
  }
  /* ── пол: решётка с перспективой ── */
  const flg=c.createLinearGradient(0,fy-6,0,H2);
  flg.addColorStop(0,"rgba(30,35,44,1)");flg.addColorStop(1,"rgba(14,17,23,1)");
  c.fillStyle=flg;c.fillRect(0,fy-4,W2,H2-fy+4);
  c.strokeStyle="rgba(120,140,160,.10)";c.lineWidth=1;
  for(let i=0;i<14;i++){                            // сходящиеся к центру швы
    const t=i/13, x0=t*W2, x1=W2*.5+(t-.5)*W2*1.9;
    c.beginPath();c.moveTo(x0,fy-3);c.lineTo(x1,H2);c.stroke();
  }
  c.fillStyle="rgba(255,255,255,.05)";c.fillRect(0,fy-4,W2,1);
  /* ── окно рубки: слева, узкое и высокое ── */
  const {wx,wy,ww,wh}=L;
  c.fillStyle="rgba(5,8,13,.96)";c.fillRect(wx,wy,ww,wh);
  c.save();c.beginPath();c.rect(wx,wy,ww,wh);c.clip();
  hqWindowView(c,wx,wy,ww,wh,seed);
  c.restore();
  c.strokeStyle="rgba(150,170,190,.30)";c.lineWidth=2;c.strokeRect(wx,wy,ww,wh);
  c.fillStyle="rgba(120,140,160,.22)";
  for(let i=1;i<3;i++)c.fillRect(wx+i*ww/3,wy,2,wh);
  c.fillStyle="rgba(140,170,200,.06)";              // блик стекла
  c.beginPath();c.moveTo(wx,wy+wh);c.lineTo(wx+ww*.5,wy);c.lineTo(wx+ww*.8,wy);
  c.lineTo(wx+ww*.3,wy+wh);c.closePath();c.fill();
  /* ── лампы: корпус и светящаяся полоса ──
     Стоят над пультами: иначе свет падал в проходы между людьми, и все стояли
     в тени собственных экранов. Конус, пятно на полу и спад — в проходе света */
  for(const lx of L.st){
    c.strokeStyle="rgba(120,132,148,.45)";c.lineWidth=1;
    c.beginPath();c.moveTo(lx,15);c.lineTo(lx,24);c.stroke();
    c.fillStyle="rgba(38,44,54,.95)";
    c.beginPath();c.moveTo(lx-13,34);c.lineTo(lx-5,24);c.lineTo(lx+5,24);c.lineTo(lx+13,34);
    c.closePath();c.fill();
    c.fillStyle="rgba(206,226,240,.9)";c.fillRect(lx-10,33,20,2.2);
  }
  /* ── что висит между пультами ──
     Не для «побольше объектов», а чтобы простенки перестали быть заливкой:
     труба с вентилем, ящик с инструментом, огнетушитель, схема отсека. */
  hqWallProps(c,W2,fy,cy,seed);
  /* ── пульты доменов ── */
  HQ_ORDER.forEach((role,i)=>hqConsole(c,L.st[i],cy,fy,role,hqMgrAt(i)));
}
/* ── голограмма над столом: неподвижная часть (звезда, зерно, орбиты, столб) ──
   печётся на прозрачном и ложится сложением, как «lighter» у 2D */
function hqHolo(c,L){
  const {cx,ty,rx}=L;
  /* свечение снизу вверх — источник света в кадре */
  const g=c.createRadialGradient(cx,ty,4,cx,ty,120);
  g.addColorStop(0,"rgba(120,190,230,.18)");g.addColorStop(1,"rgba(120,190,230,0)");
  c.fillStyle=g;c.beginPath();c.ellipse(cx,ty-30,rx*1.1,64,0,0,TAU);c.fill();
  /* Проекция — единственная достопримечательность рубки, и она должна быть
     видна, а не угадываться: планета в разрезе орбит, звёзды сектора вокруг
     и метка вашей системы. Бледная проекция превращала стол в серую плиту. */
  c.globalCompositeOperation="lighter";
  const pr=15,py0=ty-26;
  /* в середине — ваша звезда, и цвет у неё её собственный: по одному взгляду
     на стол должно быть понятно, в какой вы системе */
  const scol=(G.sys&&G.sys.cls&&G.sys.cls.col)?hex2rgb(G.sys.cls.col):[150,205,240];
  const pg=c.createRadialGradient(cx-pr*.35,py0-pr*.35,2,cx,py0,pr);
  pg.addColorStop(0,rgba(mixc(scol,[255,255,255],.6),.55));
  pg.addColorStop(.55,rgba(scol,.28));
  pg.addColorStop(1,rgba(scol,.06));
  c.fillStyle=pg;c.beginPath();c.arc(cx,py0,pr,0,TAU);c.fill();
  /* Это ЗВЕЗДА, а не планета: ни параллелей, ни терминатора — они делали из неё
     глобус, вокруг которого нелепо крутились планеты. Только ядро, зерно
     поверхности и дышащая корона (корона — живая, в hqLive). */
  c.save();c.beginPath();c.arc(cx,py0,pr,0,TAU);c.clip();
  const SR=rng(0x57A2);
  for(let i=0;i<26;i++){                                  // зерно поверхности
    const a=SR()*TAU,rr=Math.sqrt(SR())*pr;
    c.fillStyle=rgba(mixc(scol,[255,255,255],.5),(.05+SR()*.10).toFixed(3)*1);
    c.beginPath();c.arc(cx+Math.cos(a)*rr,py0+Math.sin(a)*rr,1+SR()*2.4,0,TAU);c.fill();
  }
  c.restore();
  /* корона звезды вместо кольца: кольцо спорило с орбитами планет */
  const cg2=c.createRadialGradient(cx,py0,pr*.8,cx,py0,pr*2.1);
  cg2.addColorStop(0,rgba(scol,.16));cg2.addColorStop(1,rgba(scol,0));
  c.fillStyle=cg2;c.beginPath();c.arc(cx,py0,pr*2.1,0,TAU);c.fill();
  /* Вокруг шара — НАСТОЯЩИЕ планеты вашей системы на своих орбитах, а не
     россыпь точек: рубка показывает то, где вы сейчас. Сами планеты идут в hqLive */
  const pl=(G.sys&&G.sys.planets)||[];
  const omax=pl.length?pl[pl.length-1].orbit:1;
  c.strokeStyle="rgba(150,205,240,.16)";c.lineWidth=.8;
  pl.forEach(p=>{
    const orr=rx*.20+(p.orbit/omax)*rx*.34;
    c.beginPath();c.ellipse(cx,py0+6,orr,orr*.26,0,0,TAU);c.stroke();
  });
  /* столб проекции от столешницы вверх — свет откуда-то, а не сам по себе */
  const bg=c.createLinearGradient(0,ty,0,ty-58);
  bg.addColorStop(0,"rgba(140,200,240,.16)");bg.addColorStop(1,"rgba(140,200,240,0)");
  c.fillStyle=bg;c.beginPath();
  c.moveTo(cx-rx*.5,ty);c.lineTo(cx+rx*.5,ty);c.lineTo(cx+rx*.22,ty-58);
  c.lineTo(cx-rx*.22,ty-58);c.closePath();c.fill();
  c.globalCompositeOperation="source-over";
}
/* реквизит на простенках: ставится в промежутках между пультами, поэтому
   считается от тех же координат — иначе труба ложится поверх экрана */
function hqWallProps(c,W2,fy,cy,seed){
  const st=hqStations(W2),gaps=[];
  for(let i=0;i<st.length-1;i++)gaps.push((st[i]+st[i+1])/2);
  gaps.push(st[st.length-1]+ (st[1]-st[0])*.62);
  gaps.forEach((gx,i)=>{
    const R=rng(seed+i*613),kind=i%4;
    if(gx<W2*.05||gx>W2-24)return;
    if(kind===0){                                    // труба с вентилем
      c.fillStyle="rgba(56,64,76,.9)";c.fillRect(gx-4,20,8,cy-30);
      c.fillStyle="rgba(255,255,255,.06)";c.fillRect(gx-4,20,2.4,cy-30);
      for(let y=34;y<cy-14;y+=26){                   // фланцы
        c.fillStyle="rgba(74,84,98,.95)";c.fillRect(gx-6.5,y,13,4);
        c.fillStyle="rgba(0,0,0,.25)";c.fillRect(gx-6.5,y+3.4,13,1.2);
      }
      c.strokeStyle="rgba(200,120,80,.55)";c.lineWidth=2;
      c.beginPath();c.arc(gx,cy-40,6,0,TAU);c.stroke();
      c.beginPath();c.moveTo(gx-6,cy-40);c.lineTo(gx+6,cy-40);c.stroke();
    }else if(kind===1){                              // ящик с инструментом
      c.fillStyle="rgba(40,46,58,.95)";c.fillRect(gx-15,cy-36,30,34);
      c.fillStyle="rgba(255,255,255,.05)";c.fillRect(gx-15,cy-36,30,1.6);
      c.fillStyle="rgba(0,0,0,.28)";c.fillRect(gx-15,cy-20,30,1.6);
      c.fillStyle="rgba(120,134,152,.5)";c.fillRect(gx-4,cy-31,8,2.4);
      c.fillRect(gx-4,cy-15,8,2.4);
      c.fillStyle="rgba(242,178,92,.35)";c.fillRect(gx-13,cy-6,26,2); // предупреждающая полоса
    }else if(kind===2){                              // огнетушитель в скобе
      c.fillStyle="rgba(150,60,48,.9)";
      c.beginPath();c.moveTo(gx-5,cy-40);c.lineTo(gx+5,cy-40);c.lineTo(gx+6,cy-14);
      c.lineTo(gx-6,cy-14);c.closePath();c.fill();
      c.fillStyle="rgba(255,255,255,.10)";c.fillRect(gx-5,cy-40,2,26);
      c.fillStyle="rgba(70,78,90,.95)";c.fillRect(gx-2.5,cy-46,5,6);
      c.strokeStyle="rgba(120,134,152,.6)";c.lineWidth=1.6;
      c.beginPath();c.moveTo(gx-7,cy-30);c.lineTo(gx+7,cy-30);c.stroke();
    }else{                                           // схема отсека под стеклом
      c.fillStyle="rgba(18,24,32,.95)";c.fillRect(gx-17,cy-52,34,28);
      c.strokeStyle="rgba(120,150,175,.35)";c.lineWidth=1;c.strokeRect(gx-16.5,cy-51.5,33,27);
      c.strokeStyle="rgba(140,190,220,.30)";
      for(let k=0;k<4;k++){
        const bx=gx-13+ (k%2)*15,by=cy-47+((k/2)|0)*11;
        c.strokeRect(bx,by,11,8);
      }
      c.fillStyle="rgba(143,208,138,.55)";c.fillRect(gx-13+15,cy-47,11,8);
      c.fillStyle="rgba(255,255,255,.05)";                 // блик стекла
      c.beginPath();c.moveTo(gx-17,cy-24);c.lineTo(gx-2,cy-52);c.lineTo(gx+4,cy-52);
      c.lineTo(gx-11,cy-24);c.closePath();c.fill();
    }
  });
}
/* места пультов: разнесены по ширине, но не шире 150 друг от друга — иначе
   рубка распадается на четыре отдельные каморки */
function hqStations(W2){
  const out=[],step=Math.min(150,W2/4.4),c0=W2*.5;
  for(let i=0;i<4;i++)out.push(c0+(i-1.5)*step);
  return out;
}
/* ── пульт домена ──
   Экран показывает настоящее состояние домена, а не орнамент: у командира —
   сколько наёмников в работе, у смотрителя — дроны и базы, у фактора — ломаная
   маршрута, у исследователя — накопленные данные. Пустой домен тёмный. */
function hqConsole(c,x,cy,fy,role,m){
  const col=hex2rgb(MGR_ROLES[role].col),live=!!m;
  /* Экран висит ВЫШЕ головы стоящего (голова на fy-70, макушка ~fy-86).
     Пока экран стоял на уровне лица, портрет вырезался прямо посреди графика,
     и рубка читалась аппликацией из двух слоёв. */
  const w=104,h=42,sx=x-w/2,sy=cy-100;
  /* ниша в стене за пультом: без неё пульт наклеен на обшивку */
  c.fillStyle="rgba(10,13,18,.55)";c.fillRect(sx-8,sy-8,w+16,h+30);
  c.fillStyle="rgba(255,255,255,.03)";c.fillRect(sx-8,sy-8,w+16,1.4);
  /* корпус экрана */
  c.fillStyle="rgba(16,20,27,.98)";c.fillRect(sx,sy,w,h);
  /* выключенный экран БЕСЦВЕТЕН (аудит M232): цвет роли — это питание, и у
     пустого домена его нет. Серое стекло, серый кант, ни искры доменного тона */
  c.strokeStyle=live?rgba(col,.5):"rgba(138,148,162,.13)";
  c.lineWidth=1.4;c.strokeRect(sx+.5,sy+.5,w-1,h-1);
  /* заливка экрана: развёртка сверху вниз, а не ровный цвет */
  const g=c.createLinearGradient(0,sy,0,sy+h);
  if(live){g.addColorStop(0,rgba(col,.20));g.addColorStop(1,rgba(col,.06));}
  else{g.addColorStop(0,"rgba(150,158,170,.04)");g.addColorStop(1,"rgba(150,158,170,.015)");}
  c.fillStyle=g;c.fillRect(sx,sy,w,h);
  c.save();c.beginPath();c.rect(sx+3,sy+3,w-6,h-6);c.clip();
  c.strokeStyle=live?rgba(col,.10):"rgba(150,158,170,.03)";c.lineWidth=1;   // сетка
  for(let gx=sx+8;gx<sx+w;gx+=12){c.beginPath();c.moveTo(gx,sy);c.lineTo(gx,sy+h);c.stroke();}
  for(let gy=sy+8;gy<sy+h;gy+=10){c.beginPath();c.moveTo(sx,gy);c.lineTo(sx+w,gy);c.stroke();}
  if(live)hqScreenData(c,role,m,sx+6,sy+6,w-12,h-12,col);
  else{
    /* Пустой домен — не серый прямоугольник, а обесточенный пульт: экран под
       чехлом, лента крест-накрест, надпись читаемая. Отсутствие человека должно
       быть видно местом, а не тем, что чего-то нет. */
    c.fillStyle="rgba(46,52,62,.55)";
    c.beginPath();c.moveTo(sx-2,sy-2);c.lineTo(sx+w+2,sy-2);c.lineTo(sx+w-2,sy+h*.72);
    c.lineTo(sx+2,sy+h*.72);c.closePath();c.fill();
    c.fillStyle="rgba(255,255,255,.05)";c.fillRect(sx-2,sy-2,w+4,1.6);
    for(let i=0;i<6;i++){                             // складки чехла
      c.fillStyle="rgba(0,0,0,.16)";c.fillRect(sx+6+i*17,sy,1.6,h*.72);
    }
    c.strokeStyle="rgba(122,130,142,.30)";c.lineWidth=2;
    c.beginPath();c.moveTo(sx+6,sy+h-6);c.lineTo(sx+w-6,sy+6);c.stroke();
    c.fillStyle="rgba(150,158,170,.45)";c.font="8px ui-monospace,monospace";c.textAlign="center";
    c.fillText("ДОМЕН СВОБОДЕН",sx+w/2,sy+h-6);c.textAlign="left";
  }
  /* строка развёртки — живая, в hqLive */
  c.restore();
  c.fillStyle="rgba(255,255,255,.06)";               // блик стекла экрана
  c.beginPath();c.moveTo(sx,sy+h);c.lineTo(sx+w*.42,sy);c.lineTo(sx+w*.62,sy);
  c.lineTo(sx+w*.2,sy+h);c.closePath();c.fill();
  /* рамка выбранного — в hqLabels; свет экрана на стену и пульт — в проходе света */
  /* сам пульт: тумба, столешница, скос с клавишами */
  const px=x-58,pw=116;
  c.fillStyle="rgba(22,26,34,.98)";c.fillRect(px,cy,pw,fy-cy-4);
  c.fillStyle="rgba(38,44,55,.98)";                  // скос к игроку
  c.beginPath();c.moveTo(px,cy);c.lineTo(px+pw,cy);c.lineTo(px+pw-6,cy+11);
  c.lineTo(px+6,cy+11);c.closePath();c.fill();
  c.fillStyle="rgba(210,226,240,.14)";c.fillRect(px,cy-1.6,pw,1.6);
  for(let i=0;i<7;i++){                              // клавиши на скосе (живые мигают в hqLive)
    const kx=px+12+i*13;
    c.fillStyle=live?"rgba(0,0,0,.35)":rgba(col,.07);
    c.fillRect(kx,cy+3.5,8,4);
  }
  c.fillStyle="rgba(0,0,0,.3)";c.fillRect(px,cy+11,pw,2);
  for(let i=0;i<3;i++){                              // филёнки тумбы
    c.fillStyle="rgba(255,255,255,.03)";c.fillRect(px+6+i*36,cy+16,30,fy-cy-24);
    c.fillStyle="rgba(0,0,0,.20)";c.fillRect(px+36+i*36,cy+16,2,fy-cy-24);
  }
  /* индикатор состояния человека: настроение видно раньше карточки */
  if(live){
    const l=m.ai?100:clamp(m.loy,0,100);
    const lc=m.ai?[159,216,255]:(l>=60?[143,208,138]:(l>=30?[242,178,92]:[255,107,87]));
    c.fillStyle=rgba(lc,.9);c.beginPath();c.arc(px+pw-9,cy+6,2.2,0,TAU);c.fill();
    c.fillStyle=rgba(lc,.25);c.beginPath();c.arc(px+pw-9,cy+6,5,0,TAU);c.fill();
    /* невыбранное очко перка пульсирует в hqLive */
  }
}
/* что показывает экран домена — настоящие числа игры */
function hqScreenData(c,role,m,x,y,w,h,col){
  c.font="7px ui-monospace,monospace";c.textAlign="left";
  c.fillStyle=rgba(col,.75);
  if(role==="cmd"){
    const busy=G.crew.filter(cr=>cr.shipId&&cr.order&&cr.order.kind!=="home").length;
    const tot=Math.max(1,G.crew.length);
    c.fillText("ЗВЕНО "+busy+"/"+G.crew.length,x,y+7);
    /* метки людей: плечи трапецией, а не столбик — ряд столбиков читался
       полкой с бутылками, а не звеном */
    for(let i=0;i<Math.min(9,G.crew.length);i++){
      const mx=x+i*9.5,busyi=i<busy;
      c.fillStyle=rgba(col,busyi?.85:.20);
      c.beginPath();c.moveTo(mx,y+21);c.lineTo(mx+1,y+14);c.lineTo(mx+5,y+14);
      c.lineTo(mx+6,y+21);c.closePath();c.fill();
      c.beginPath();c.arc(mx+3,y+11.5,2.2,0,TAU);c.fill();
      if(busyi){c.fillStyle=rgba(col,.35);c.fillRect(mx-1,y+22,8,1.2);}
    }
    c.fillStyle=rgba(col,.4);c.fillRect(x,y+h-4,w*(busy/tot),2);
  }else if(role==="keep"){
    const dr=(G.drones||[]).length,bs=Object.keys(G.bases||{}).length;
    c.fillText("ДРОНОВ "+dr+" · БАЗ "+bs,x,y+7);
    /* дроны кружат — в hqLive */
    for(let i=0;i<Math.min(6,bs);i++){                // базы стоят
      c.fillStyle=rgba(col,.55);c.fillRect(x+w-10-i*9,y+20,6,5);
      c.fillRect(x+w-8-i*9,y+16,2,4);
    }
  }else if(role==="fact"){
    const n=m.route?m.route.length:0;
    c.fillText("ПЛЕЧ "+n+"/"+mgrRouteMax(m),x,y+7);
    if(n>=2){                                          // ломаная маршрута
      c.strokeStyle=rgba(col,.6);c.lineWidth=1;c.beginPath();
      for(let i=0;i<n;i++){
        const px=x+4+i*(w-8)/Math.max(1,n-1),py=y+22+Math.sin(i*2.1)*6;
        i?c.lineTo(px,py):c.moveTo(px,py);
      }
      c.stroke();
      for(let i=0;i<n;i++){
        const px=x+4+i*(w-8)/Math.max(1,n-1),py=y+22+Math.sin(i*2.1)*6;
        c.fillStyle=rgba(col,.9);c.beginPath();c.arc(px,py,1.8,0,TAU);c.fill();
      }
      /* борт идёт по маршруту — в hqLive */
    }else{c.fillStyle=rgba(col,.4);c.fillText("маршрут не собран",x,y+20);}
  }else{
    const d=m.gotData||0;
    c.fillText("ДАННЫХ "+d,x,y+7);
    for(let i=0;i<5;i++){                              // столбики разбора
      const hh=3+((d+i*37)%13);
      c.fillStyle=rgba(col,.5+i*.08);c.fillRect(x+i*9,y+h-2-hh,6,hh);
    }
    c.fillStyle=rgba(col,.5);                          // образцы в трюме
    c.fillText("образцов "+mgrSamples(),x+52,y+16);
  }
}
/* ── голо-стол переднего плана ──
   Одна достопримечательность на комнату: стол снизу подсвечивает лица и режет
   кадр по нижней кромке, из-за чего рубка перестаёт быть картонкой в один слой. */
function hqTable(c,W2,H2,fy,seed){
  /* Стол был плитой во всю ширину: он закрывал ноги всем и превращал низ кадра
     в серую полосу. Уже, ниже и с настоящей проекцией — тогда это предмет
     в комнате, а не второй пол. */
  const cx=W2*.5,ty=H2-22,rx=Math.min(W2*.32,215),ry=10;
  /* свечение и голограмма — в hqHolo и hqLive: они ложатся сложением до стола */
  /* столешница */
  c.fillStyle="rgba(20,25,33,.99)";
  c.beginPath();c.ellipse(cx,ty,rx,ry,0,0,TAU);c.fill();
  c.strokeStyle="rgba(150,205,240,.28)";c.lineWidth=1.4;
  c.beginPath();c.ellipse(cx,ty,rx,ry,0,0,TAU);c.stroke();
  const tg=c.createLinearGradient(0,ty-ry,0,ty+ry);
  tg.addColorStop(0,"rgba(140,190,225,.10)");tg.addColorStop(1,"rgba(0,0,0,.35)");
  c.fillStyle=tg;c.beginPath();c.ellipse(cx,ty,rx-2,ry-1.5,0,0,TAU);c.fill();
  /* борт стола и юбка до низа кадра */
  c.fillStyle="rgba(26,31,40,.99)";
  c.beginPath();c.moveTo(cx-rx,ty);c.lineTo(cx-rx,H2);c.lineTo(cx+rx,H2);c.lineTo(cx+rx,ty);
  c.ellipse(cx,ty,rx,ry,0,0,Math.PI,true);c.closePath();c.fill();
  /* кромка: холодная сверху от проекции, тёплая снизу от дежурного света под
     столом — без второго источника юбка сливалась с полом в одну тёмную полосу */
  c.strokeStyle="rgba(210,230,245,.22)";c.lineWidth=1.4;
  c.beginPath();c.ellipse(cx,ty+1,rx,ry,0,0,Math.PI);c.stroke();
  const ug=c.createLinearGradient(0,H2-16,0,H2);
  ug.addColorStop(0,"rgba(242,178,92,0)");ug.addColorStop(1,"rgba(242,178,92,.16)");
  c.fillStyle=ug;c.fillRect(cx-rx,H2-16,rx*2,16);
  for(let i=0;i<3;i++){                               // дежурные лампы под кромкой
    const lx2=cx+(i-1)*rx*.62;
    c.fillStyle="rgba(242,178,92,.5)";c.fillRect(lx2-3,ty+ry-1,6,1.6);
  }
  for(let i=0;i<9;i++){                               // рёбра юбки
    const px=cx-rx+8+i*(rx*2-16)/8;
    c.fillStyle="rgba(0,0,0,.20)";c.fillRect(px,ty+6,2,H2-ty);
  }
  /* Отражения людей и экранов в столешнице: полированный металл возвращает
     цвет домена размытой полосой. Это единственное, что связывает передний
     план с задним, — без отражений стол лежал в кадре отдельной деталью. */
  c.save();
  c.beginPath();c.ellipse(cx,ty,rx-2,ry-1.5,0,0,TAU);c.clip();
  c.globalCompositeOperation="lighter";
  hqStations(W2).forEach((sxx,i)=>{
    const m=G.mgrs.find(x=>x.role===HQ_ORDER[i]);
    if(!m)return;
    const col=hex2rgb(MGR_ROLES[HQ_ORDER[i]].col);
    const rg=c.createLinearGradient(0,ty-ry,0,ty+ry);
    rg.addColorStop(0,rgba(col,.26));rg.addColorStop(1,rgba(col,0));
    c.fillStyle=rg;c.fillRect(sxx-13,ty-ry,26,ry*2);
  });
  c.restore();
  /* мелочь на столе: кружка и планшет — место обжитое */
  c.fillStyle="rgba(90,104,120,.75)";c.fillRect(cx-rx*.62,ty-8,9,8);
  c.strokeStyle="rgba(90,104,120,.75)";c.lineWidth=1.4;
  c.beginPath();c.arc(cx-rx*.62+11,ty-4,3,-1.2,1.2);c.stroke();
  c.save();c.translate(cx+rx*.52,ty-4);c.rotate(-.18);
  c.fillStyle="rgba(30,36,46,.95)";c.fillRect(-11,-6,22,12);
  c.fillStyle="rgba(150,205,240,.25)";c.fillRect(-9.5,-4.5,19,9);
  c.restore();
}
/* ── стоящий у пульта ──
   Тело, а не палки: комбинезон трапецией, плечи шире таза, ранец на спине,
   дальняя нога темнее ближней, одна рука лежит на пульте. Голова — настоящий
   портрет управляющего, тот же, что в карточке. */
function hqFigure(c,x,fy,col,phase,face,ai,m,pose,part){
  /* part — для спрайтов рубки (27f1): "legs" — тень и ноги, "top" — корпус и голова
     без метки поручения (она живая); без part — вся фигура, как рисуют остальные */
  const bob=Math.sin(phase)*1.0,sw=Math.sin(phase*1.3);
  /* Поза у каждого домена своя, иначе рубка — четыре оловянных солдатика в ряд.
     Командир стоит прямо, обе руки на пульте; смотритель развёрнут к экрану;
     фактор опёрся локтем; исследователь держит планшет и смотрит в него.
     Разворот показан сужением корпуса и сдвигом портрета, а не вторым набором
     фигур: половинки и сдвиги дешевле и не расходятся с языком остальных сцен. */
  const P=[{turn:0,lean:0,arm:1},{turn:.5,lean:-.06,arm:2},
           {turn:-.35,lean:.10,arm:3},{turn:.25,lean:.04,arm:4}][pose|0]||
          {turn:0,lean:0,arm:1};
  /* Пропорции: рост 89, голова 26 — три с половиной головы. Меньшая голова
     превращала портрет в пятно, большая — в куклу. Ноги 30, торс 34: пульт
     приходится ровно по пояс, и это делает комнату комнатой. */
  const body=rgba(col,.94),dark=rgba(mixc(col,[8,12,18],.62),.96),
        mid=rgba(mixc(col,[8,12,18],.3),.96),
        lite=rgba(mixc(col,[245,250,255],.35),.95);
  c.save();c.translate(x,fy);
  if(part!=="top"){
  c.fillStyle="rgba(0,0,0,.4)";                       // тень под ногами
  c.beginPath();c.ellipse(0,1,14,3.6,0,0,TAU);c.fill();
  /* ноги врозь, дальняя темнее: без разницы в тоне это одна доска */
  c.fillStyle=dark;
  c.fillRect(2.5,-30,7,29);c.fillRect(1.5,-3,9.5,3);
  c.fillStyle=mid;
  c.fillRect(-9.5,-30,7,29);c.fillRect(-11,-3,9.5,3);
  c.fillStyle="rgba(0,0,0,.28)";c.fillRect(-1,-30,2,29); // зазор между ног
  }
  if(part==="legs"){c.restore();return;}
  /* торс и голова живут в своей системе: наклон от бедра, разворот — сужением */
  c.save();c.translate(0,-30);c.rotate(P.lean);c.scale(1-Math.abs(P.turn)*.3,1);
  c.translate(0,30);
  c.fillStyle=dark;                                    // ранец краем из-за плеча
  c.fillRect(P.turn>0?8.5:-13,-58+bob,4.5,19);
  c.fillStyle="rgba(0,0,0,.25)";c.fillRect(-13,-50+bob,4.5,2);
  /* торс: плечи явным углом, а не дугой — от дуги выходит яйцо */
  const tp=b=>{
    c.beginPath();
    c.moveTo(-9,-64+b);c.lineTo(-4,-67.5+b);c.lineTo(4,-67.5+b);c.lineTo(9,-64+b);
    c.lineTo(14,-58+b);c.lineTo(9.5,-30);c.lineTo(-9.5,-30);c.lineTo(-14,-58+b);
    c.closePath();
  };
  c.fillStyle=body;tp(bob);c.fill();
  c.strokeStyle="rgba(230,240,250,.20)";c.lineWidth=1;tp(bob);c.stroke();
  const sg=c.createLinearGradient(-14,0,14,0);         // свет слева, тень справа
  sg.addColorStop(0,"rgba(255,255,255,.13)");sg.addColorStop(.55,"rgba(255,255,255,0)");
  sg.addColorStop(1,"rgba(0,0,0,.28)");
  c.fillStyle=sg;tp(bob);c.fill();
  c.fillStyle="rgba(0,0,0,.22)";                       // ворот
  c.beginPath();c.moveTo(-5,-66+bob);c.lineTo(0,-59+bob);c.lineTo(5,-66+bob);c.closePath();c.fill();
  c.fillStyle="rgba(0,0,0,.3)";c.fillRect(-9.7,-40+bob*.4,19.4,2.6); // ремень
  c.fillStyle=lite;c.fillRect(-9.7,-40+bob*.4,4,2.6);               // пряжка
  c.fillStyle=rgba(mixc(col,[240,246,255],.5),.85);                 // нашивка домена
  c.fillRect(-12.5,-62+bob,4.5,3.6);
  c.fillStyle="rgba(0,0,0,.18)";c.fillRect(3,-52+bob,6,7);          // нагрудный карман
  /* руки по позе: на пульте, поднятая к экрану, локоть на кромке, планшет */
  c.lineCap="round";
  const hand=(hx,hy)=>{c.fillStyle=lite;c.beginPath();c.arc(hx,hy,2.6,0,TAU);c.fill();};
  c.strokeStyle=body;c.lineWidth=5.4;
  if(P.arm===2){                                        // рука поднята к экрану
    c.beginPath();c.moveTo(10,-60+bob);c.lineTo(17,-64+bob);c.lineTo(23,-70+bob+sw*.8);c.stroke();
    hand(23,-70+bob+sw*.8);
  }else if(P.arm===3){                                  // локоть на кромке пульта
    c.beginPath();c.moveTo(10,-60+bob);c.lineTo(18,-40);c.lineTo(9,-31+sw*.8);c.stroke();
    hand(9,-30+sw*.8);
  }else if(P.arm===4){                                  // держит планшет перед собой
    c.beginPath();c.moveTo(10,-60+bob);c.lineTo(13,-48+bob);c.lineTo(6,-44+bob);c.stroke();
    c.beginPath();c.moveTo(-10,-60+bob);c.lineTo(-13,-48+bob);c.lineTo(-6,-44+bob);c.stroke();
    c.save();c.rotate(-.22);
    c.fillStyle="rgba(24,30,40,.95)";c.fillRect(-9,-50+bob,18,11);
    c.fillStyle=rgba(col,.35);c.fillRect(-7.5,-48.5+bob,15,8);
    c.restore();
  }else{                                                // обе руки на пульте
    c.beginPath();c.moveTo(10,-60+bob);c.lineTo(16,-46+bob*.5);c.lineTo(19,-33+sw*1.2);c.stroke();
    hand(19.5,-32+sw*1.2);
  }
  if(P.arm!==4){                                        // дальняя рука
    c.strokeStyle=dark;c.lineWidth=5;
    c.beginPath();c.moveTo(-10,-60+bob);c.lineTo(-14,-46+bob*.5);c.lineTo(-13,-36+sw*.6);c.stroke();
  }
  c.lineCap="butt";
  c.fillStyle=dark;c.fillRect(-3.5,-70+bob,7,5);        // шея
  if(face){                                             // голова-портрет
    const hx=P.turn*4;                                  // голова доворачивается за корпусом
    c.save();
    c.beginPath();c.arc(hx,-76+bob,13,0,TAU);c.clip();
    c.drawImage(face,hx-13,-89+bob,26,26);
    c.fillStyle="rgba(0,0,0,.18)";                      // щека в тени с дальней стороны
    c.fillRect(P.turn>0?hx-13:hx+4,-89+bob,9,26);
    c.restore();
    c.strokeStyle=rgba(col,.6);c.lineWidth=1.6;
    c.beginPath();c.arc(hx,-76+bob,13,0,TAU);c.stroke();
    c.fillStyle="rgba(0,0,0,.22)";                      // тень от подбородка на грудь
    c.beginPath();c.ellipse(0,-64+bob,7,2.4,0,0,TAU);c.fill();
    if(ai){c.strokeStyle="rgba(159,216,255,.5)";c.lineWidth=1;
      c.beginPath();c.arc(0,-76+bob,16.5,0,TAU);c.stroke();}
  }
  c.restore();                                          // конец системы торса
  /* поручение со сроком висит меткой над плечом: его видно из зала */
  if(m&&m.job&&!part){
    c.fillStyle="rgba(242,178,92,"+(.5+.4*Math.sin(G.t*2.4)).toFixed(2)+")";
    c.beginPath();c.moveTo(16,-72+bob);c.lineTo(22,-66+bob);c.lineTo(16,-60+bob);
    c.closePath();c.fill();
  }
  c.restore();
}
/* за окном рубки: свой док, краны и корабль на приколе */
function hqWindowView(c,x,y,w,h,seed){
  const R=rng(seed^0xA1);
  const g=c.createLinearGradient(0,y,0,y+h);
  g.addColorStop(0,"rgba(10,16,28,1)");g.addColorStop(1,"rgba(5,8,14,1)");
  c.fillStyle=g;c.fillRect(x,y,w,h);
  for(let i=0;i<34;i++){
    c.fillStyle="rgba(220,232,246,"+(.12+R()*.5).toFixed(2)+")";
    c.fillRect(x+R()*w,y+R()*h,1.1,1.1);
  }
  c.fillStyle="rgba(60,90,130,.55)";                  // планета краем
  c.beginPath();c.arc(x+w*.22,y+h*1.05,h*.62,0,TAU);c.fill();
  c.fillStyle="rgba(0,0,0,.4)";
  c.beginPath();c.arc(x+w*.34,y+h*.95,h*.62,0,TAU);c.fill();
  c.strokeStyle="rgba(120,140,160,.35)";c.lineWidth=1.4; // ферма дока
  for(let i=0;i<3;i++){c.beginPath();c.moveTo(x+8+i*w*.32,y);c.lineTo(x+14+i*w*.32,y+h);c.stroke();}
  c.fillStyle="rgba(44,54,68,.95)";c.fillRect(x+w*.42,y+h*.5,w*.44,h*.16);
  c.fillStyle="rgba(58,70,86,.95)";
  c.beginPath();c.moveTo(x+w*.86,y+h*.5);c.lineTo(x+w*.98,y+h*.58);
  c.lineTo(x+w*.86,y+h*.66);c.closePath();c.fill();
  for(let i=0;i<4;i++){                                // проблесковые огни (горящий бежит в hqLive)
    c.fillStyle="rgba(242,178,92,.2)";
    c.fillRect(x+w*.44+i*w*.11,y+h*.48,1.8,1.8);
  }
}
/* ── канва рубки в экране ШТАБ ──
   Своим rAF, пока канва жива и экран открыт: иначе цикл жёг бы кадр после
   закрытия. По человеку тыкают — открывается его карточка ниже. */
function hqScene(){
  const wrap=el("div","");
  wrap.style.cssText="margin:2px 0 10px;line-height:0;position:relative";
  const cn=document.createElement("canvas");
  const cssW=Math.max(360,Math.min(($hqBody.clientWidth||640)-4,980));
  /* ── рубка занимает ту высоту, которая у панели ЕСТЬ (M223) ──
     Потолок в 270 px оставлял под двумя строками текста нижнюю треть панели
     пустой — ровно тот «экран ни о чём», который плейтест назвал поломкой.
     Меряем настоящую высоту тела и оставляем место под строки; правда этого
     экрана — сама рубка, ей и отдаётся всё остальное. Пропорция комнаты при
     этом не врёт: hqRoomBody считает от высоты канвы (HQ_H — её единицы). */
  const bodyH=$hqBody.clientHeight||560;
  const below=G.mgrs.length?300:136;      /* сколько займут строки под комнатой */
  const cssH=Math.round(clamp(Math.max(cssW*.30,bodyH-below),200,520));
  const dpr=Math.min(window.devicePixelRatio||1,2);
  cn.width=Math.round(cssW*dpr);cn.height=Math.round(cssH*dpr);cn.__dpr=dpr;
  cn.style.cssText="width:100%;height:"+cssH+"px;display:block;border-radius:8px;"+
    "border:1px solid rgba(120,150,170,.25);cursor:pointer;touch-action:manipulation";
  wrap.appendChild(cn);
  $hqBody.appendChild(wrap);
  let hits=[];
  const pick=ev=>{
    const r=cn.getBoundingClientRect();
    const px=(ev.clientX-r.left)/r.width*cn.width/dpr;
    const py=(ev.clientY-r.top)/r.height*cn.height/dpr;
    return (hits.find(h=>px>=h.x&&px<=h.x+h.w&&py>=h.y&&py<=h.y+h.h)||{}).id||null;
  };
  cn.onmousemove=ev=>{hqHover=pick(ev);};
  cn.onmouseleave=()=>{hqHover=null;};
  cn.onclick=ev=>{
    const id=pick(ev);
    if(!id||id===hqSel)return;
    hqSel=id;sfx("ui");hqRender();
  };
  const frame=()=>{
    if(!cn.isConnected||!$hq.classList.contains("open"))return;
    hits=drawHqRoom(cn,hqSel,hqHover);
    requestAnimationFrame(frame);
  };
  frame();
}
let hqHover=null;
