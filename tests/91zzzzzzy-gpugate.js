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
    for(let i=0;i<4;i++)frameBody(wallMs());   /* дом испечён и загружен */
    B=HOTEL_BAKE;
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
  ok(B&&HOTEL_BAKE===B,"дом не перепечён");
  resetWorld();
}));
