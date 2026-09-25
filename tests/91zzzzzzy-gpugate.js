/* ══════════════ ворота ступени 1: ровный полёт без #c (docs/DESIGN-gpu.md, Stage 1) ══════════════
   Шестьдесят настоящих кадров (frameBody) в системе с гостиницей и Чебуреком, на
   тяге, с креном, бегущей строкой и пятью коронами: слой #c не грузится ни разу,
   отправка в очередь ровно одна на кадр, печёные холсты не грузятся (всё печётся
   на прогреве и живёт мастером). Кто пачкает пустой #c — называется по стеку:
   иначе следующий шаг тихо вернёт 2D на #c, и ворота закроются молча.
   Исключений нет: станция с 17c3 — мастер с мипами, живое поверх фигурами. */
const GATE_WARM=40,GATE_N=60,GATE_OK=[];
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
function gatePlace(){
  const H=hotelHere(),C=chebHere();if(!H||!C)return;
  G.ship.x=C.x+(H.x-C.x)*.35;G.ship.y=C.y+(H.y-C.y)*.35;G.ship.vx=0;G.ship.vy=0;G.ship.a=-2.2;G.ap=null;
  G.zoom=2.2;G.zoomT=null;
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
  const K={on:false,front:0,sub:0,up:{},bad:0,known:0,dirt:{}};
  const cm={};
  let i=0;
  try{
    hullGpuDraw=function(id,x,y,a,sc,t,b,l,bk,lx,ly){return hg(id,x,y,a,sc,t||id===G.shipId,b,l,id===G.shipId?.35:bk,lx,ly);};
    Q.copyExternalImageToTexture=function(src,dst){
      if(K.on){if(dst.texture===GPU.T.front)K.front++;
        else{const w=gateWho();if(GATE_OK.some(n=>w.includes(n)))K.known++;else{K.bad++;K.up[w]=(K.up[w]||0)+1;}}}
      return q0.c.apply(this,arguments);};
    Q.submit=function(){if(K.on)K.sub++;return q0.s.apply(this,arguments);};
    G.running=true;LOOP_OFF=false;
    for(i=0;i<GATE_WARM+GATE_N;i++){
      if(i===GATE_WARM){
        K.on=true;
        /* поверх обёрток 08c: кто рисует на #c, пока он пуст */
        gpuFrontHook();
        for(const k of ["fill","stroke","fillRect","strokeRect","drawImage","fillText","strokeText","putImageData"]){
          const o=C[k];cm[k]=o;
          C[k]=function(){if(K.on&&GPU.cState===0){const w=k+":"+gateWho();K.dirt[w]=(K.dirt[w]||0)+1;}return o.apply(this,arguments);};}
      }
      gatePlace();
      frameBody(wallMs());
    }
  }catch(e){ok(false,"кадр "+i+" упал: "+e.message);}
  finally{
    K.on=false;
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
  resetWorld();
}));
