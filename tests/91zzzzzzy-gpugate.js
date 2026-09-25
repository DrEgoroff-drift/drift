/* ══════════════ ворота ступени 1: ровный полёт без #c (docs/DESIGN-gpu.md, Stage 1) ══════════════
   Шестьдесят настоящих кадров (frameBody) в системе с гостиницей и Чебуреком, на
   тяге, с креном, бегущей строкой и пятью коронами: слой #c не грузится ни разу,
   отправка в очередь ровно одна на кадр, печёные холсты не грузятся (всё печётся
   на прогреве и живёт мастером). Кто пачкает пустой #c — называется по стеку:
   иначе следующий шаг тихо вернёт 2D на #c, и ворота закроются молча.
   Исключений нет: станция с 17c3 — мастер с мипами, живое поверх фигурами. */
const GATE_WARM=40,GATE_N=60,GATE_SW=40,GATE_OK=[];
/* печки за зумом (гостиница, щит, неон, Чебурек): проезд зума туда и обратно — ни один
   холст печки не грузится дважды: каждый размер печётся и грузится один раз (зум в игре
   сглажен, туда и обратно он проходит разные точки — новый кегль на обратном законен).
   Дом, перепечённый за проезд сменой окон (час суток), — не зум: его выгрузки не судим */
const GATE_ZB=/drawCheburek|drawBillboard|drawHotel/;
/* текстовые печи (кегль в пикселях): холстов за проезд — не больше, чем кеглей на всём
   ходе масштаба (доска 8…12; неон щита 11…17 и дома 8…15 — по два слоя; панель и строка щита) */
const GATE_ZCAP={neonDraw:30,bbDrawGpu:12,drawCheburek:6};
function gateZOwner(w){if(!/gpuCanvasTex/.test(w))return null;for(const k in GATE_ZCAP)if(w.includes(k))return k;return null;}
function gateZoom(j){const t=j<GATE_SW?j/GATE_SW:(2*GATE_SW-1-j)/GATE_SW;return ZOOM_MIN*Math.pow(ZOOM_MAX/ZOOM_MIN,t);}
function gateWho(){
  return new Error().stack.split("\n").slice(3,8).map(l=>{const m=/at (?:new )?([\w$.]+)/.exec(l);return m?m[1]:"?";}).join("<");
}
function gateStand(){
  for(let r=0;r<=14;r++)for(let x=-r;x<=r;x++)for(let y=-r;y<=r;y++){
    if(Math.max(Math.abs(x),Math.abs(y))!==r)continue;
    const s=getSystem(x,y);if(!s.station)continue;
    G.sx=x;G.sy=y;G.sys=s;G.ap=null;G.orbit=null;
    if(hotelHere()&&chebHere())return true;
  }
  return false;
}
function gatePlace(z){
  const H=hotelHere(),C=chebHere();if(!H||!C)return;
  G.ship.x=C.x+(H.x-C.x)*.35;G.ship.y=C.y+(H.y-C.y)*.35;G.ship.vx=0;G.ship.vy=0;G.ship.a=-2.2;G.ap=null;
  G.zoom=z||2.2;G.zoomT=null;
}
TEST_SUITES.push(()=>suite("ворота ступени 1: ровный полёт — #c не грузится, одна отправка на кадр, холсты не грузятся",{tier:"browser"},()=>{
  if(!ok(GPU.ok,"видеокарта есть — без неё ворота не меряются"))return;
  resetWorld();
  G.mode="system";
  if(!ok(gateStand(),"нашлась система с гостиницей и Чебуреком"))return;
  gatePlace();
  const h=hullOf(G.shipId),outs=h.outs||(h.outs=[]),had=outs.some(o=>o.k==="runline");
  if(!had)outs.push({k:"runline",x:h.nose*.55,y:h.bw*1.02,l:(h.nose-h.tail)*.62,w:h.bw*.12});
  G.crowns={};NODE_FAMS.slice(0,5).forEach(f=>G.crowns[f.id]=1);
  const Q=GPUQueue.prototype,q0={c:Q.copyExternalImageToTexture,s:Q.submit};
  const hg=hullGpuDraw,run0=G.running,loop0=LOOP_OFF,C=MAIN_CTX;
  const K={on:false,front:0,sub:0,up:{},bad:0,known:0,dirt:{},zb:false,zup:{},zn:0,zt:0,zc:{},zs:new Set()};
  const cm={};
  let i=0;
  try{
    hullGpuDraw=function(id,x,y,a,sc,t,b,l,bk,lx,ly){return hg(id,x,y,a,sc,t||id===G.shipId,b,l,id===G.shipId?.35:bk,lx,ly);};
    Q.copyExternalImageToTexture=function(src,dst){
      if(K.zb&&dst.texture!==GPU.T.front){const w=gateWho();
        if(GATE_ZB.test(w)){K.zt++;const zo=gateZOwner(w);if(zo)K.zc[zo]=(K.zc[zo]||0)+1;if(K.zs.has(src.source)){K.zn++;K.zup[w]=(K.zup[w]||0)+1;}K.zs.add(src.source);}}
      if(K.on){if(dst.texture===GPU.T.front)K.front++;
        else{const w=gateWho();if(GATE_OK.some(n=>w.includes(n)))K.known++;else{K.bad++;K.up[w]=(K.up[w]||0)+1;}}}
      return q0.c.apply(this,arguments);};
    Q.submit=function(){if(K.on)K.sub++;return q0.s.apply(this,arguments);};
    G.running=true;LOOP_OFF=false;
    for(i=0;i<GATE_WARM+GATE_N+2*GATE_SW;i++){
      if(i===GATE_WARM){
        K.on=true;
        /* поверх обёрток 08c: кто рисует на #c, пока он пуст */
        gpuFrontHook();
        for(const k of ["fill","stroke","fillRect","strokeRect","drawImage","fillText","strokeText","putImageData"]){
          const o=C[k];cm[k]=o;
          C[k]=function(){if(K.on&&GPU.cState===0){const w=k+":"+gateWho();K.dirt[w]=(K.dirt[w]||0)+1;}return o.apply(this,arguments);};}
      }
      const j=i-GATE_WARM-GATE_N;
      if(j===0){K.on=false;for(const k in cm)C[k]=cm[k];}
      if(j===0)K.zb=true;
      gatePlace(j<0?0:gateZoom(j));
      frameBody(wallMs());
    }
  }catch(e){ok(false,"кадр "+i+" упал: "+e.message);}
  finally{
    K.on=false;K.zb=false;
    Q.copyExternalImageToTexture=q0.c;Q.submit=q0.s;hullGpuDraw=hg;
    for(const k in cm)C[k]=cm[k];
    G.running=run0;LOOP_OFF=loop0;
    if(!had){const j=outs.findIndex(o=>o.k==="runline");if(j>=0)outs.splice(j,1);}
  }
  const top=o=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k,v])=>v+"× "+k).join("; ");
  eq(K.front,0,"#c за "+GATE_N+" кадров не грузился"+(K.front?" — пачкают: "+top(K.dirt):""));
  eq(Object.keys(K.dirt).length,0,"пустой #c никто не пачкает"+(Object.keys(K.dirt).length?": "+top(K.dirt):""));
  eq(K.sub,GATE_N,"отправок в очередь ровно по одной на кадр");
  eq(K.bad,0,"печёные холсты не грузятся"+(K.bad?": "+top(K.up):"")+" (станция — известное исключение, её выгрузок "+K.known+")");
  for(const k in GATE_ZCAP)ok((K.zc[k]||0)<=GATE_ZCAP[k],"проезд зума: печей "+k+" "+(K.zc[k]||0)+" ≤ "+GATE_ZCAP[k]+" — кегль, а не каждый кадр");
  eq(K.zn,0,"проезд зума туда и обратно: ни один холст печки не грузится дважды (выгрузок "+K.zt+")"+(K.zn?": "+top(K.zup):""));
  resetWorld();
}));
/* окна гостиницы (ступень 1): дом печётся раз на систему и цвет вывески двумя мастерами
   (всё погашено, всё горит); какие окна горят — решает кадр кусками атласа. Сутки по три
   часа и окна, что передумали: набор горящих окон меняется, выгрузок дома — ноль */
TEST_SUITES.push(()=>suite("ворота ступени 1: окна гостиницы гаснут и загораются без выгрузок",{tier:"browser"},()=>{
  if(!ok(GPU.ok,"видеокарта есть — без неё ворота не меряются"))return;
  resetWorld();
  G.mode="system";
  if(!ok(gateStand(),"нашлась система с гостиницей"))return;
  gatePlace();
  const Q=GPUQueue.prototype,c0=Q.copyExternalImageToTexture,run0=G.running,loop0=LOOP_OFF,Ht=hotelHere(),sd=G.sx*31+G.sy;
  let up=0,B=null;const masks=new Set();
  try{
    G.running=true;LOOP_OFF=false;
    HOTEL_BAKE=null;   /* дом испечён и загружен здесь же, а не чужим набором */
    for(let i=0;i<60&&!(HOTEL_BAKE&&GPU_MIP.has(HOTEL_BAKE.cv));i++){gatePlace();frameBody(wallMs());}
    B=HOTEL_BAKE;frameBody(wallMs());
    Q.copyExternalImageToTexture=function(){if(/drawHotel/.test(gateWho()))up++;return c0.apply(this,arguments);};
    const d0=Math.floor(G.t/CEL_DAY)*CEL_DAY;
    for(let h=0;h<24;h+=3)for(let f=0;f<3;f++){
      G.t=d0+CEL_DAY*h/24+f*360;gatePlace();
      masks.add(hotelWinLit(sd,hotelLitFrac(Ht.by,((G.t%CEL_DAY)/CEL_DAY)*24),Math.floor(G.t/60/6)));
      frameBody(wallMs());
    }
  }finally{Q.copyExternalImageToTexture=c0;G.running=run0;LOOP_OFF=loop0;}
  ok(masks.size>=8,"наборов горящих окон за сутки: "+masks.size+" ≥ 8");
  eq(up,0,"выгрузок дома при смене окон");
  if(ok(B,"дом нарисован и загружен"))ok(HOTEL_BAKE===B,"дом не перепечён");
  resetWorld();
}));
/* бой (ступень 1): три пирата вокруг корабля, болты в обе стороны, ракеты в обе стороны,
   разрыв, гибель с контейнером, скобки захвата, точка радара у кромки. Всё, что было на
   #c (корпуса ракет, живой слой пиратов — факелы, чад, пробоины, дым, — полосы, скобки,
   коробки трофеев, точки у кромки), рисуется в проходе сцены: #c пуст, отправка одна на
   кадр, выгрузок нет — пираты, трофей и коробка испечены на прогреве */
TEST_SUITES.push(()=>suite("ворота ступени 1: бой — #c не грузится, одна отправка на кадр, выгрузок нет",{tier:"browser"},()=>{
  if(!ok(GPU.ok,"видеокарта есть — без неё ворота не меряются"))return;
  resetWorld();
  G.mode="system";
  if(!ok(gateStand(),"нашлась система со станцией"))return;
  gatePlace(1.6);
  const sh=G.ship,X=sh.x,Y=sh.y,WARM=40,N=60;
  G.pirates=[];G.shots=[];G.msl=[];G.mslFx=[];G.loot=[];G.tech.add("radar");
  const foe=(dx,dy,rank,seed,hp,hull)=>{const p={x:X+dx,y:Y+dy,vx:0,vy:0,a:0,hull,hullMax:hp,name:"Ц"+(G.pirates.length+1),
    rank,seed,shipId:pirateShipId(seed),cool:0,aware:true,thrust:true,bx:X+dx,by:Y+dy,bh:hull};G.pirates.push(p);return p;};
  /* подбитый (дым и огонь из пробоины), с пятнами, целый обречённый и дальний — точкой радара */
  const A=foe(90,-40,3,11,400,110),B=foe(60,70,1,18,400,300),C=foe(-70,60,0,25,60,60);foe(2400,0,0,32,60,60);
  G.marks=[A,B];
  const Q=GPUQueue.prototype,q0={c:Q.copyExternalImageToTexture,s:Q.submit},run0=G.running,loop0=LOOP_OFF,Cx=MAIN_CTX,cm={};
  const K={on:false,front:0,sub:0,up:{},bad:0,dirt:{}};
  let i=0,kind=new Set();
  try{
    Q.copyExternalImageToTexture=function(src,dst){
      if(K.on){if(dst.texture===GPU.T.front)K.front++;else{const w=gateWho();K.bad++;K.up[w]=(K.up[w]||0)+1;}}
      return q0.c.apply(this,arguments);};
    Q.submit=function(){if(K.on)K.sub++;return q0.s.apply(this,arguments);};
    G.running=true;LOOP_OFF=false;
    for(i=0;i<WARM+N;i++){
      if(i===WARM){
        K.on=true;gpuFrontHook();
        for(const k of ["fill","stroke","fillRect","strokeRect","drawImage","fillText","strokeText","putImageData"]){
          const o=Cx[k];cm[k]=o;
          Cx[k]=function(){if(K.on&&GPU.cState===0){const w=k+":"+gateWho();K.dirt[w]=(K.dirt[w]||0)+1;}return o.apply(this,arguments);};}
      }
      /* сцена держится: корабль и пираты на местах (их корпуса не перепекаются), корпус свой цел */
      sh.x=X;sh.y=Y;sh.vx=0;sh.vy=0;G.hull=stat().hullMax;G.shield=stat().shieldMax;G.zoom=1.6;G.zoomT=null;
      for(const p of G.pirates){p.x=p.bx+Math.cos(i*.02+p.seed)*6;p.y=p.by+Math.sin(i*.02+p.seed)*6;p.vx=0;p.vy=0;
        p.a=Math.atan2(sh.y-p.y,sh.x-p.x);p.thrust=true;if(p!==C)p.hull=p.bh;}
      if(i%8===0)for(const p of G.pirates)fireShot(p.x,p.y,Math.atan2(sh.y-p.y,sh.x-p.x),7,1,false);
      if(i%6===0){const t=G.pirates[(i/6|0)%G.pirates.length];fireShot(sh.x,sh.y,Math.atan2(t.y-sh.y,t.x-sh.x),9,1,true);}
      if(i%25===0&&G.pirates.includes(A))mslFoeFire(A);
      if(i%30===5){const a=Math.atan2(A.y-sh.y,A.x-sh.x);
        G.msl.push({x:sh.x+Math.cos(a)*14,y:sh.y+Math.sin(a)*14,vx:Math.cos(a)*MSL_SPEED,vy:Math.sin(a)*MSL_SPEED,
          a,tgt:A,dmg:MSL_DMG,turn:MSL_TURN,life:MSL_LIFE,age:0,puff:0,kind:"plain"});}
      /* гибель с контейнером — на прогреве: коробка трофея печётся раз на цвет */
      if(i===10){C.hull=0;killPirate(C);G.pirates=G.pirates.filter(q=>q.hull>0);
        G.loot.push({x:X-40,y:Y+50,vx:0,vy:0,spin:.4,life:600,part:{kind:"gun"}},{x:X-9000,y:Y,vx:0,vy:0,spin:0,life:5400,part:{kind:"shield"}});}
      if(i===WARM+10)mslBoom({x:X+40,y:Y-50},null);
      for(const L of G.loot){L.vx=0;L.vy=0;}
      frameBody(wallMs());
      if(K.on){if(G.shots.length)kind.add("болты");if((G.msl||[]).some(m=>m.foe))kind.add("чужая ракета");
        if((G.msl||[]).some(m=>!m.foe))kind.add("своя ракета");if(G.loot.length)kind.add("трофей");}
    }
  }catch(e){ok(false,"кадр "+i+" упал: "+e.message);}
  finally{
    K.on=false;Q.copyExternalImageToTexture=q0.c;Q.submit=q0.s;
    for(const k in cm)Cx[k]=cm[k];
    G.running=run0;LOOP_OFF=loop0;
  }
  const top=o=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k,v])=>v+"× "+k).join("; ");
  eq([...kind].sort().join(", "),"болты, своя ракета, трофей, чужая ракета","в окне был бой целиком");
  eq(K.front,0,"#c за "+N+" кадров боя не грузился"+(K.front?" — пачкают: "+top(K.dirt):""));
  eq(Object.keys(K.dirt).length,0,"пустой #c в бою никто не пачкает"+(Object.keys(K.dirt).length?": "+top(K.dirt):""));
  eq(K.sub,N,"отправок в очередь ровно по одной на кадр");
  eq(K.bad,0,"выгрузок в бою нет"+(K.bad?": "+top(K.up):""));
  resetWorld();
}));
/* после боя (ступень 1): обломки NPC лежат после каждой драки, оставленное (след корпуса,
   метка с подписью) — в своей системе; и то и другое — в проходе сцены, подписи DOM:
   #c пуст, отправка одна на кадр, выгрузок нет (след испечён на прогреве) */
TEST_SUITES.push(()=>suite("ворота ступени 1: после боя — обломки и оставленное не грузят #c",{tier:"browser"},()=>{
  if(!ok(GPU.ok,"видеокарта есть — без неё ворота не меряются"))return;
  resetWorld();
  G.mode="system";G.ap=null;G.orbit=null;G.pirates=[];G.shots=[];G.msl=[];G.loot=[];
  const r0={k:"ghost",s:4242},P0=leftPos(r0,0);let r1=null,P1=null;
  for(let s=1;s<20000&&!r1;s++){const r={k:"gun",s,ty:"II"},P=leftPos(r,1);if(Math.hypot(P.x-P0.x,P.y-P0.y)<150){r1=r;P1=P;}}
  if(!ok(r1,"нашлась метка рядом со следом"))return;
  const lc0=LEFT_CACHE,sh=G.ship,X=(P0.x+P1.x)/2,Y=(P0.y+P1.y)/2,WARM=20,N=40;
  G.npcWrecks=[{x:X-60,y:Y+50,seed:77,by:"gt",crew:1},{x:X+50,y:Y+70,seed:78,by:"gt",crew:0}];
  const Q=GPUQueue.prototype,q0={c:Q.copyExternalImageToTexture,s:Q.submit},run0=G.running,loop0=LOOP_OFF,Cx=MAIN_CTX,cm={};
  const K={on:false,front:0,sub:0,up:{},bad:0,dirt:{}};
  let i=0;
  try{
    Q.copyExternalImageToTexture=function(src,dst){
      if(K.on){if(dst.texture===GPU.T.front)K.front++;else{const w=gateWho();K.bad++;K.up[w]=(K.up[w]||0)+1;}}
      return q0.c.apply(this,arguments);};
    Q.submit=function(){if(K.on)K.sub++;return q0.s.apply(this,arguments);};
    G.running=true;LOOP_OFF=false;
    for(i=0;i<WARM+N;i++){
      if(i===WARM){
        K.on=true;gpuFrontHook();
        for(const k of ["fill","stroke","fillRect","strokeRect","drawImage","fillText","strokeText","putImageData"]){
          const o=Cx[k];cm[k]=o;
          Cx[k]=function(){if(K.on&&GPU.cState===0){const w=k+":"+gateWho();K.dirt[w]=(K.dirt[w]||0)+1;}return o.apply(this,arguments);};}
      }
      LEFT_CACHE={k:leftKey(),N:(typeof chronNow==="function")?chronNow():0,rows:[r0,r1]};
      sh.x=X;sh.y=Y;sh.vx=0;sh.vy=0;G.zoom=2;G.zoomT=null;
      frameBody(wallMs());
    }
  }catch(e){ok(false,"кадр "+i+" упал: "+e.message);}
  finally{
    K.on=false;Q.copyExternalImageToTexture=q0.c;Q.submit=q0.s;
    for(const k in cm)Cx[k]=cm[k];
    G.running=run0;LOOP_OFF=loop0;LEFT_CACHE=lc0;
  }
  const top=o=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k,v])=>v+"× "+k).join("; ");
  eq((G.npcWrecks||[]).length,2,"обломки лежат весь замер");
  eq(K.front,0,"#c за "+N+" кадров не грузился"+(K.front?" — пачкают: "+top(K.dirt):""));
  eq(Object.keys(K.dirt).length,0,"пустой #c никто не пачкает"+(Object.keys(K.dirt).length?": "+top(K.dirt):""));
  eq(K.sub,N,"отправок в очередь ровно по одной на кадр");
  eq(K.bad,0,"выгрузок нет"+(K.bad?": "+top(K.up):""));
  resetWorld();
}));
