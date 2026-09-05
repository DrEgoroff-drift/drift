/* ══════════════ «Сорока»: странствующий парусник (M342) ══════════════
   Один корабль на всю галактику, который нельзя купить и нельзя вызвать: парусник
   с золотыми горами на крестовом рее, стоит три реальных дня у освещённого края
   планеты, сутки идёт дальше. Пока стоит — торгует за спички (12uc; лавка —
   M343). Найти его можно тремя каналами, и ни один не маркер
   (docs/DESIGN-wanderer.md §3): слух в кантине («паруса у планеты, которые не
   гаснут ночью»), небесная вахта из соседней системы («яркая точка без номера в
   каталоге») и артефакт «Карта чужой руки» (12h): первая строка — стоянка на
   карте, вторая, с «чтением», — и следующая.

   ВРЕМЯ — функция часов, ничего не считается вне кадра (модель tickDrones):
   эпоха = floor((now − WANDER_T0) / 4 сут), стоянка = первые трое суток эпохи,
   переход — четвёртые. Петля из 24 стоянок считается один раз из мирового
   устройства (звёзды у всех одни): обходит ядро эллипсом, радиус 6…20 секторов —
   дважды за круг проходит через родные места, каждая четвёртая стоянка — тёмная
   система без станции («идёт на промысел», §5). Шаг 3–5 секторов.

   ПРАВИЛА ФАЙЛА:
   1. Хранится только G.wander={got,gave,chit} — что купили, что отдали, письмо.
      Положение, петля, товар — из часов и семени, никогда из сейва.
   2. Рисунок по кодексу: тёмное тело киля с рёбрами и тюками, обвод, ОДИН тёплый
      свет — лампа в гондоле; паруса — золотая фольга с жёсткими считанными
      бликами, поворачиваются за минуты, не мигают. Крыльцо под килем — кольцо
      ровных огней.
   3. Подход — как к станции (17-mode-system): подсказка, сброс скорости,
      ДЕЙСТВИЕ. Сам трап — режим wanderer (24c, M343). */
const WANDER_T0=Date.UTC(2026,8,1);                 /* нуль петли: 1 сентября 2026 */
const WANDER_STOP=3*86400e3, WANDER_HOP=86400e3, WANDER_PERIOD=WANDER_STOP+WANDER_HOP;
const WANDER_N=24;
let WANDER_LOOP=null;
function wanderRec(){
  const w=G.wander;
  if(!w||typeof w!=="object"||!Array.isArray(w.got)||!Array.isArray(w.gave))G.wander={got:[],gave:[],chit:0};
  return G.wander;
}
/* стоянка годится: обитаемая — со станцией, тёмная — без неё */
function wanderOk(sx,sy,dark){
  if(!starAt(sx,sy))return false;
  const s=getSystem(sx,sy);
  return dark?!s.station:!!s.station;
}
/* петля: эллипс вокруг ядра, радиус 13−7·cos2θ (6 у дома, 20 вдали), точки
   прижимаются к ближайшей подходящей звезде в квадрате ±3 */
function wanderLoop(){
  if(WANDER_LOOP)return WANDER_LOOP;
  const out=[];
  const r=rng(0x50A0CA);
  const tilt=r()*TAU;
  for(let k=0;k<WANDER_N;k++){
    const th=k/WANDER_N*TAU, rad=13-7*Math.cos(2*th);
    const wx=Math.cos(th+tilt)*rad, wy=Math.sin(th+tilt)*rad*.85;
    const cx=Math.round(wx),cy=Math.round(wy),dark=(k%4===3);
    let best=null,bd=1e9,any=null,ad=1e9;
    for(let dx=-3;dx<=3;dx++)for(let dy=-3;dy<=3;dy++){
      const sx=cx+dx,sy=cy+dy,d=Math.hypot(sx-wx,sy-wy);
      if(!starAt(sx,sy))continue;
      if(d<ad){ad=d;any=[sx,sy];}
      if(d<bd&&wanderOk(sx,sy,dark)){bd=d;best=[sx,sy];}
    }
    const p=best||any||[cx,cy];
    /* одна звезда дважды подряд — не стоянка, а простой */
    if(out.length&&out[out.length-1].sx===p[0]&&out[out.length-1].sy===p[1]&&any&&(any[0]!==p[0]||any[1]!==p[1])){p[0]=any[0];p[1]=any[1];}
    out.push({sx:p[0],sy:p[1],dark});
  }
  return WANDER_LOOP=out;
}
/* где «Сорока» в момент now: стоянка k, планета, фаза и остаток фазы */
function wanderAt(now){
  now=now===undefined?Date.now():now;
  const L=wanderLoop();
  const e=Math.floor((now-WANDER_T0)/WANDER_PERIOD);
  const t=now-WANDER_T0-e*WANDER_PERIOD;
  const k=((e%WANDER_N)+WANDER_N)%WANDER_N, kn=(k+1)%WANDER_N, kp=(k+WANDER_N-1)%WANDER_N;
  const st=L[k],nx=L[kn],pv=L[kp];
  const stop=t<WANDER_STOP;
  return {epoch:e,k,sx:st.sx,sy:st.sy,dark:st.dark,phase:stop?"stop":"hop",
          tLeft:stop?WANDER_STOP-t:WANDER_PERIOD-t,tIn:t,
          next:{sx:nx.sx,sy:nx.sy},prev:{sx:pv.sx,sy:pv.sy},
          planetIx:wanderPlanetIx(st.sx,st.sy,e)};
}
/* планета стоянки: первое негазовое тело по семени эпохи; без планет — −1 */
function wanderPlanetIx(sx,sy,e){
  if(!starAt(sx,sy))return -1;
  const P=getSystem(sx,sy).planets||[];
  const ok=[];P.forEach((p,i)=>{if(p.type!=="gas")ok.push(i);});
  if(!ok.length)return P.length?0:-1;
  const r=rng(hashi(e|0,sx*31+sy,0x5A11));
  return ok[Math.floor(r()*ok.length)];
}
function wanderHere(sys,now){
  const w=wanderAt(now);
  return !!sys&&w.phase==="stop"&&sys.sx===w.sx&&sys.sy===w.sy;
}
/* длина киля: 8–10 длин корпуса игрока */
function wanderLen(){return hullOf(G.shipId).len*9;}
/* место в системе: у освещённого края планеты, носом к звезде */
function wanderWorldPos(sys,ix){
  const L=wanderLen();
  const p=(ix>=0&&sys.planets)?sys.planets[ix]:null;
  if(!p||(!p.x&&!p.y)){const R=(sys.radius||200)*2.4;return {x:R,y:0,dx:-1,dy:0,L};}
  const d=Math.hypot(p.x,p.y)||1,dx=-p.x/d,dy=-p.y/d;
  return {x:p.x+dx*(p.radius+L*.62),y:p.y+dy*(p.radius+L*.62),dx,dy,L};
}
/* курс ухода: к следующей стоянке, в секторных осях */
function wanderHeading(w){return Math.atan2(w.next.sy-w.sy,w.next.sx-w.sx);}
/* угол корпуса сейчас: носом к звезде, в последний час стоянки — на курс ухода */
function wanderAngle(pos,w){
  const a0=Math.atan2(pos.dy,pos.dx);
  const k=clamp(1-w.tLeft/3600e3,0,1);
  if(k<=0)return a0;
  let a1=wanderHeading(w),d=a1-a0;
  while(d>Math.PI)d-=TAU;while(d<-Math.PI)d+=TAU;
  return a0+d*k*k*(3-2*k);
}
/* ── подход (17-mode-system): близко ли крыльцо ── */
function wanderNear(sh){
  const sys=G.sys;if(!sys||!wanderHere(sys))return null;
  const w=wanderAt(),pos=wanderWorldPos(sys,w.planetIx);
  const ds=Math.hypot(sh.x-pos.x,sh.y-pos.y);
  if(ds>pos.L*.5+320)return null;
  return {ds:Math.max(0,ds-pos.L*.28),close:ds<pos.L*.28+110};
}
function wanderDock(){
  if(typeof openWanderer==="function")return openWanderer();
  say("«Сорока»: трап ещё не спущен\nкричат сверху — подождите");
  return false;
}
/* ── три канала ── */
/* слух: пока борт стоит и стоянка в ~6 прыжках (18 секторов); разброс 2–3, 15 % вранья */
function wanderRumour(r){
  const w=wanderAt();
  if(w.phase!=="stop"||!G.sys)return null;
  if(Math.max(Math.abs(w.sx-G.sx),Math.abs(w.sy-G.sy))>18)return null;
  const wrong=r()<.15,rad=2+Math.floor(r()*2);
  let cx=w.sx+Math.round((r()-.5)*2),cy=w.sy+Math.round((r()-.5)*2);
  if(wrong){cx=Math.round((r()-.5)*60);cy=Math.round((r()-.5)*60);}
  const S=pick(RUMOUR_SRC,r);
  const det=pick(RUMOUR_DETAIL.any.concat(S.f?RUMOUR_DETAIL.f:RUMOUR_DETAIL.m),r);
  const q={id:"wander",sx:cx,sy:cy,rad,wrong,img:RUMOUR_IMG.wander,src:S.ru,det};
  q.where=rumourWhere(q);
  q.text=capRu(S.ru)+" рассказывал про место: "+q.img+". "+capRu(q.where)+". "+capRu(det)+".";
  q.lines=[capRu(q.img),capRu(q.where),"со слов: "+S.ru+" — "+det];
  q.short=q.img+" — где-то у сектора "+cx+":"+cy;
  return q;
}
/* небесная вахта: из соседней системы — яркая точка без номера, с направлением */
function wanderSkyLine(){
  const w=wanderAt();
  if(w.phase!=="stop"||!G.sys)return null;
  const dx=w.sx-G.sys.sx,dy=w.sy-G.sys.sy;
  if((!dx&&!dy)||Math.max(Math.abs(dx),Math.abs(dy))>1)return null;
  const side=(dy<0?"к северу":dy>0?"к югу":"")+(dx&&dy?"-":"")+(dx>0?"востоку":dx<0?"западу":"");
  const dir=side.replace("к северу-востоку","к северо-востоку").replace("к северу-западу","к северо-западу")
    .replace("к югу-востоку","к юго-востоку").replace("к югу-западу","к юго-западу")
    .replace(/^востоку$/,"к востоку").replace(/^западу$/,"к западу");
  return {ru:"яркая точка без номера в каталоге",note:"в соседнем секторе, "+dir+" · не звезда: ночью не гаснет и не мерцает"};
}
/* карта чужой руки (12h): стоянка — при первой строке, следующая — при «чтении» */
function drawWanderMap(vis,cell){
  if(typeof relicOn!=="function"||!relicOn("chart"))return;
  const w=wanderAt();
  const glyph=(sx,sy,a)=>{
    const v=vis.find(q=>q.gx===sx&&q.gy===sy);if(!v)return;
    ctx.save();ctx.globalAlpha=a;ctx.translate(v.x+9,v.y-10);
    ctx.fillStyle="#c9922e";ctx.strokeStyle="rgba(255,230,168,.9)";ctx.lineWidth=.8;
    ctx.beginPath();ctx.moveTo(-4,4);ctx.lineTo(-1,-5);ctx.lineTo(-1,4);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(1,4);ctx.lineTo(4,-3);ctx.lineTo(1,4);ctx.lineTo(1,-2);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle="rgba(236,232,220,.8)";ctx.fillRect(-5,4,10,1);
    ctx.restore();
  };
  if(w.phase==="stop")glyph(w.sx,w.sy,1);
  if(typeof relicDeep==="function"&&relicDeep("chart"))glyph(w.next.sx,w.next.sy,.55);
}
/* ── рисунок в системе ── */
function drawWanderer(zx,zy,Z){
  const sys=G.sys;if(!sys)return;
  const w=wanderAt(),now=Date.now();
  /* уходит: первые шесть часов перехода из покинутой системы виден блик, который уменьшается по прямой */
  if(w.phase==="hop"&&sys.sx===w.prev.sx&&sys.sy===w.prev.sy){
    const th=w.tIn-WANDER_STOP;if(th>6*3600e3)return;
    const ix=wanderPlanetIx(sys.sx,sys.sy,w.epoch-1),pos=wanderWorldPos(sys,ix);
    const pw={sx:w.prev.sx,sy:w.prev.sy,next:{sx:w.sx,sy:w.sy}};
    const a=wanderHeading(pw),u=th/(6*3600e3);
    const x=zx(pos.x+Math.cos(a)*u*9000),y=zy(pos.y+Math.sin(a)*u*9000);
    if(x<-20||x>W+20||y<-20||y>H+20)return;
    const rr=Math.max(1.2,(1-u)*4*clamp(Z,.4,1.5));
    const g=ctx.createRadialGradient(x,y,0,x,y,rr*3);
    g.addColorStop(0,"rgba(255,226,160,"+(.9*(1-u*.6)).toFixed(2)+")");g.addColorStop(1,"rgba(255,180,90,0)");
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,rr*3,0,TAU);ctx.fill();
    return;
  }
  if(!wanderHere(sys))return;
  const pos=wanderWorldPos(sys,w.planetIx);
  const x=zx(pos.x),y=zy(pos.y),L=pos.L*Z;
  if(x<-L*2.2||x>W+L*2.2||y<-L*2.2||y>H+L*2.2)return;   /* полотнища почти в два киля от ступицы */
  const ang=wanderAngle(pos,w);
  ctx.save();ctx.translate(x,y);ctx.rotate(ang);
  if(L<9){
    /* издали — только паруса: тёплая точка, которая не мерцает */
    const g=ctx.createRadialGradient(0,0,0,0,0,5);
    g.addColorStop(0,"rgba(255,226,160,.95)");g.addColorStop(1,"rgba(255,180,90,0)");
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,5,0,TAU);ctx.fill();
    ctx.restore();return;
  }
  const s=L/100;                                     /* киль = 100 единиц */
  ctx.scale(s,s);
  const r=rng((sys.seed^0x5A1A)>>>0);
  /* 0. паруса — ПОЗАДИ киля (автор, третий набросок 2026-09-05: четыре ОТДЕЛЬНЫХ
     длинных треугольника из одной точки у носа, крестом под 45° к килю, между ними
     пусто; «а чё золотой не можешь… мультик какой-то»). Значит — металл, не заливка:
     фольга собрана из полос, поперёк полотнища идёт бронза → золото → почти белый →
     золото → бронза, по полотну морщины укладки короткими штрихами, от звезды один
     мягкий зеркальный блик, кромка к звезде светится ниткой. Ни одного плоского тона. */
  {
    const HX=26;                                             /* ступица — ближе к носу, где гондола */
    const la=Math.atan2(-pos.y,-pos.x)-ang;                  /* направление на звезду в координатах борта */
    const LB=168, HW=46, base=Math.PI/4;              /* полотнище шире: основание около половины длины, как на наброске */
    const rr=rng((sys.seed^0x5A11)>>>0);
    const crinkles=[];for(let k=0;k<26;k++)crinkles.push([rr(),rr()*2-1,rr()*.12+.03,(rr()-.5)*.5,rr()]);
    for(let i=0;i<4;i++){
      const th=base+i*Math.PI/2, flut=1+Math.sin(now/37000+i*2.1)*.006;
      const dx=Math.cos(th),dy=Math.sin(th),nx=-dy,ny=dx;
      const lit=.55+.6*Math.max(0,Math.cos(th-la))+.15*Math.max(0,Math.cos(th-la+Math.PI/2));
      const pt=(u,v)=>[HX+dx*LB*u*flut+nx*HW*u*v,dy*LB*u*flut+ny*HW*u*v];
      const P0=pt(.04,0),P1=pt(1,1),P2=pt(1,-1),Pm=pt(.97,1),Pn=pt(.97,-1);
      const path=()=>{ctx.beginPath();ctx.moveTo(P0[0],P0[1]);ctx.lineTo(Pm[0],Pm[1]);ctx.lineTo(P1[0]-nx*HW*.15,P1[1]-ny*HW*.15);ctx.lineTo(P2[0]+nx*HW*.15,P2[1]+ny*HW*.15);ctx.lineTo(Pn[0],Pn[1]);ctx.closePath();};
      /* 1. металл поперёк: бронза — золото — свет — золото — бронза */
      const q1=pt(.6,-1),q2=pt(.6,1);
      const g=ctx.createLinearGradient(q1[0],q1[1],q2[0],q2[1]);
      const C=(r,g2,b)=>"rgb("+Math.min(255,Math.round(r*lit))+","+Math.min(255,Math.round(g2*lit))+","+Math.min(255,Math.round(b*lit))+")";
      g.addColorStop(0,C(112,70,18));g.addColorStop(.22,C(198,146,44));g.addColorStop(.48,C(246,214,128));g.addColorStop(.62,C(214,164,56));g.addColorStop(.85,C(168,116,32));g.addColorStop(1,C(96,58,14));
      ctx.fillStyle=g;path();ctx.fill();
      ctx.save();path();ctx.clip();
      /* 2. полосы фольги вдоль полотнища — чуть разного тона */
      for(let k=0;k<7;k++){const v0=-1+k*2/7,v1=v0+2/7;const a0=pt(0,v0),a1=pt(1,v0),b1=pt(1,v1),b0=pt(0,v1);
        ctx.fillStyle=(k%2)?"rgba(255,235,190,.07)":"rgba(40,20,0,.09)";ctx.beginPath();ctx.moveTo(a0[0],a0[1]);ctx.lineTo(a1[0],a1[1]);ctx.lineTo(b1[0],b1[1]);ctx.lineTo(b0[0],b0[1]);ctx.closePath();ctx.fill();}
      /* 3. морщины укладки: короткие штрихи вдоль, светлый рядом с тёмным */
      for(const c of crinkles){const u=.15+c[0]*.8,v=c[1]*.85,len=c[2],sl=c[3];
        const s0=pt(u,v),s1=pt(u+len,v+sl*len*3);const s2=pt(u,v+.06),s3=pt(u+len,v+.06+sl*len*3);
        ctx.strokeStyle="rgba(255,244,214,"+(.28*lit).toFixed(2)+")";ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(s0[0],s0[1]);ctx.lineTo(s1[0],s1[1]);ctx.stroke();
        ctx.strokeStyle="rgba(50,26,4,.30)";ctx.beginPath();ctx.moveTo(s2[0],s2[1]);ctx.lineTo(s3[0],s3[1]);ctx.stroke();}
      /* 4. зеркальный блик от звезды — одно мягкое пятно на полотнищах к звезде */
      const face=Math.max(0,Math.cos(th-la));
      if(face>.15){const c0=pt(.5+face*.15,(Math.sin(la-th)>0?1:-1)*.25);
        const sg=ctx.createRadialGradient(c0[0],c0[1],0,c0[0],c0[1],LB*.32);
        sg.addColorStop(0,"rgba(255,250,232,"+(.55*face).toFixed(2)+")");sg.addColorStop(.5,"rgba(255,240,200,"+(.16*face).toFixed(2)+")");sg.addColorStop(1,"rgba(255,240,200,0)");
        ctx.fillStyle=sg;ctx.beginPath();ctx.arc(c0[0],c0[1],LB*.32,0,TAU);ctx.fill();}
      /* 5. тень киля на полотне */
      ctx.fillStyle="rgba(0,0,0,.32)";ctx.fillRect(-52,-3.4,104,6.8);
      ctx.restore();
      /* 6. кромки: тёмная тонкая по контуру, светлая нить по стороне к звезде; лонжерон по оси */
      ctx.strokeStyle="rgba(46,26,4,.7)";ctx.lineWidth=.55;path();ctx.stroke();
      const sideLit=Math.sin(la-th)>0?1:-1;const e0=pt(.04,sideLit),e1=pt(.97,sideLit);
      ctx.strokeStyle="rgba(255,242,200,"+(.35+.45*face).toFixed(2)+")";ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(e0[0],e0[1]);ctx.lineTo(e1[0],e1[1]);ctx.stroke();
      const m0=pt(0,0),m1=pt(1,0);
      ctx.strokeStyle="rgba(20,16,10,.55)";ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(m0[0],m0[1]);ctx.lineTo(m1[0],m1[1]);ctx.stroke();
      /* грузик на конце с ровным огоньком */
      ctx.fillStyle="#1c2026";ctx.fillRect(m1[0]-1.8,m1[1]-1.8,3.6,3.6);ctx.fillStyle="rgba(255,226,160,.9)";ctx.beginPath();ctx.arc(m1[0],m1[1],.7,0,TAU);ctx.fill();
      /* ванты: от конца полотнища к концам киля */
      ctx.strokeStyle="rgba(200,190,160,.28)";ctx.lineWidth=.4;ctx.beginPath();ctx.moveTo(m1[0],m1[1]);ctx.lineTo(dx>0?50:-50,0);ctx.stroke();
    }
    /* ступица у носа: кольцо, из которого выходят четыре лонжерона */
    ctx.fillStyle="#15181d";ctx.beginPath();ctx.arc(HX,0,4.6,0,TAU);ctx.fill();
    ctx.strokeStyle="rgba(200,210,220,.4)";ctx.lineWidth=.7;ctx.beginPath();ctx.arc(HX,0,4.6,0,TAU);ctx.stroke();
    ctx.strokeStyle="rgba(227,176,74,.5)";ctx.lineWidth=.5;ctx.beginPath();ctx.arc(HX,0,2.6,0,TAU);ctx.stroke();
  }
  /* 1. тень парусов на киле и тюках — тёмное основание, потом тело */
  ctx.lineCap="round";
  /* киль: тёмная балка с фаской */
  ctx.strokeStyle="#0f1114";ctx.lineWidth=4.2;ctx.beginPath();ctx.moveTo(-50,0);ctx.lineTo(50,0);ctx.stroke();
  ctx.strokeStyle="#242830";ctx.lineWidth=2.6;ctx.beginPath();ctx.moveTo(-50,0);ctx.lineTo(50,0);ctx.stroke();
  /* рёбра-кольца каждые семь единиц, между ними тюки и ящики, через один сверху/снизу */
  for(let i=-6;i<=6;i++){
    const fx=i*7;
    ctx.strokeStyle="#33383f";ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(fx,-4.6);ctx.lineTo(fx,4.6);ctx.stroke();
    if(i<6&&i!==0&&i!==-1){
      const side=(i&1)?-1:1,wdt=4+r()*2.4,hgt=2.6+r()*2.2,bx=fx+3.5-wdt/2,by=side<0?-1.4-hgt:1.4;
      ctx.fillStyle=r()<.5?"#2a2622":"#25282e";ctx.fillRect(bx,by,wdt,hgt);
      ctx.fillStyle="rgba(255,235,200,.14)";ctx.fillRect(bx,side<0?by:by+hgt-.7,wdt,.7);   /* свет сверху: одна кромка */
      ctx.strokeStyle="rgba(0,0,0,.55)";ctx.lineWidth=.5;ctx.strokeRect(bx,by,wdt,hgt);
      /* верёвка крест-накрест */
      ctx.strokeStyle="rgba(200,190,160,.28)";ctx.lineWidth=.4;
      ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx+wdt,by+hgt);ctx.moveTo(bx+wdt,by);ctx.lineTo(bx,by+hgt);ctx.stroke();
    }
  }
  /* киль ловит золото парусов: тёплая кромка сверху */
  ctx.strokeStyle="rgba(227,176,74,.35)";ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(-50,-2.1);ctx.lineTo(50,-2.1);ctx.stroke();
  /* ряды заклёпок вдоль киля */
  ctx.fillStyle="rgba(255,255,255,.13)";
  for(let q=-48;q<=48;q+=3)ctx.fillRect(q,-1.6,.6,.6);
  /* корма: два тёмных сопла, холодные, без огня — стоит */
  ctx.fillStyle="#1a1d22";ctx.fillRect(-53,-3.2,4,2.2);ctx.fillRect(-53,1,4,2.2);
  /* крыльцо под килем позади рея: кольцо ровных огней и трап */
  ctx.strokeStyle="#2b2f36";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-15,2);ctx.lineTo(-15,7.5);ctx.stroke();
  for(let i=0;i<6;i++){const a=i/6*TAU;ctx.fillStyle="rgba(200,236,255,.85)";
    ctx.beginPath();ctx.arc(-15+Math.cos(a)*3.2,8.5+Math.sin(a)*1.6,.55,0,TAU);ctx.fill();}
  ctx.strokeStyle="rgba(180,190,200,.5)";ctx.lineWidth=.5;
  for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-16.2,3+i*1.2);ctx.lineTo(-13.8,3+i*1.2);ctx.stroke();}
  /* 2. рей — крест посреди, тёмный, с фаской света */
  ctx.strokeStyle="#0f1114";ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(0,-30);ctx.lineTo(0,30);ctx.stroke();
  ctx.strokeStyle="#3a3630";ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(0,-30);ctx.lineTo(0,30);ctx.stroke();
  /* 4. гондола на носу: стекло, и внутри — единственный тёплый свет */
  ctx.fillStyle="#1c2026";ctx.beginPath();ctx.ellipse(50,0,4.6,3.2,0,0,TAU);ctx.fill();
  ctx.strokeStyle="rgba(150,180,200,.55)";ctx.lineWidth=.6;ctx.stroke();
  const lg=ctx.createRadialGradient(51,0,0,51,0,9);
  lg.addColorStop(0,"rgba(255,214,150,.95)");lg.addColorStop(.3,"rgba(255,190,110,.55)");lg.addColorStop(1,"rgba(255,160,80,0)");
  ctx.fillStyle=lg;ctx.beginPath();ctx.arc(51,0,9,0,TAU);ctx.fill();
  ctx.fillStyle="#fff1d0";ctx.beginPath();ctx.arc(51.4,-.4,1,0,TAU);ctx.fill();
  /* 5. один обвод всему телу — тонкий, холодный сверху */
  ctx.strokeStyle="rgba(190,205,220,.22)";ctx.lineWidth=.5;
  ctx.beginPath();ctx.moveTo(-50,-2.2);ctx.lineTo(50,-2.2);ctx.stroke();
  ctx.restore();
  /* челнок станции к «Сороке» — местные тоже торгуют (17f) */
  if(sys.station&&typeof drawShuttleArc==="function"){
    const st=sys.station;
    drawShuttleArc({ax:st.x,ay:st.y,bx:pos.x,by:pos.y,br:pos.L*.3,bow:.22,spd:.00011,ph:.37,k:1,blink:1.1},zx,zy,Z);
  }
}
