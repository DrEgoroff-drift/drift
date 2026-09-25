/* ══════════════ ворота ступени 2: пояс без #c (docs/DESIGN-gpu.md, Stage 2) ══════════════
   Шестьдесят настоящих кадров (frameBody) в поясе: камни рядом и вдали, пыль на ходу и все
   пять ориентиров перед носом. Мир пояса рисуется в проходе сцены (24ba, 24bb): #c
   мира не видит ни одного вызова, отправка в очередь одна на кадр, печёные холсты не
   грузятся (зев устья печётся и грузится раз, на прогреве). Кабина и стекло
   (drawGlassHUD, drawCockpit) — граница с приборами, следующий шаг: пока они единственные,
   кто рисует на #c, и копия #c не больше одной на кадр. Кто из мира рисует на #c —
   называется по стеку */
const BGATE_WARM=30,BGATE_N=60,BGATE_HUD=/drawGlassHUD|drawCockpit/;
function bgateStand(){
  for(let r=0;r<=10;r++)for(let x=-r;x<=r;x++)for(let y=-r;y<=r;y++){
    const s=getSystem(x,y);if(!s.belt)continue;
    G.sx=x;G.sy=y;G.sys=s;G.ap=null;G.orbit=null;G.mode="system";enterBelt();return true;
  }
  return false;
}
/* все пять видов ориентиров перед камерой: 3 сверху, 2 снизу */
function bgatePoi(){
  const b=G.belt,B=beltBasis(b),K=["wreck","rig","ring","drusa","maw"],S=[230,200,280,180,340];
  const O=[[-480,300],[0,300],[480,300],[-260,-280],[260,-280]];
  b.poi=K.map((k,i)=>{const d=1400,u=O[i],P=j=>[b.x,b.y,b.z][j]+B.fwd[j]*d+B.right[j]*u[0]+B.up[j]*u[1];
    return {k,ru:k,size:S[i],seed:1234567+i*7919,spin:.001,ph:i*.7,x:P(0),y:P(1),z:P(2)};});
}
TEST_SUITES.push(()=>suite("ворота ступени 2: пояс — мир не рисует на #c, одна отправка на кадр, выгрузок нет",{tier:"browser"},()=>{
  if(!ok(GPU.ok,"видеокарта есть — без неё ворота не меряются"))return;
  resetWorld();
  if(!ok(bgateStand(),"нашлась система с поясом"))return;
  if(!ok(G.mode==="belt"&&G.belt,"вошли в пояс"))return;
  bgatePoi();
  const b=G.belt,Q=GPUQueue.prototype,q0={c:Q.copyExternalImageToTexture,s:Q.submit},run0=G.running,loop0=LOOP_OFF,C=MAIN_CTX,cm={};
  const K={on:false,front:0,sub:0,up:{},bad:0,world:{},hud:0,poiDrawn:0};
  const pd=beltPoiGpu;
  let i=0;
  try{
    beltPoiGpu=function(){K.poiDrawn++;return pd.apply(this,arguments);};
    Q.copyExternalImageToTexture=function(src,dst){
      if(K.on){if(dst.texture===GPU.T.front)K.front++;else{const w=gateWho();K.bad++;K.up[w]=(K.up[w]||0)+1;}}
      return q0.c.apply(this,arguments);};
    Q.submit=function(){if(K.on)K.sub++;return q0.s.apply(this,arguments);};
    gpuFrontHook();   /* крючок 08c ставит свои обёртки один раз — наши поверх него */
    for(const k of ["fill","stroke","fillRect","strokeRect","drawImage","fillText","strokeText","putImageData"]){
      const o=C[k];cm[k]=o;
      C[k]=function(){if(K.on){const s=new Error().stack;if(BGATE_HUD.test(s))K.hud++;else{const w=k+":"+gateWho();K.world[w]=(K.world[w]||0)+1;}}return o.apply(this,arguments);};}
    G.running=true;LOOP_OFF=false;
    for(i=0;i<BGATE_WARM+BGATE_N;i++){
      if(i===BGATE_WARM)K.on=true;
      /* на малом ходу: пыль тянется штрихом, камера почти на месте */
      if(G.belt){G.belt.vx=0;G.belt.vy=0;G.belt.vz=.9;}
      frameBody(wallMs());
      if(G.mode!=="belt")break;
    }
  }catch(e){ok(false,"кадр "+i+" упал: "+e.message);}
  finally{
    K.on=false;beltPoiGpu=pd;
    Q.copyExternalImageToTexture=q0.c;Q.submit=q0.s;
    for(const k in cm)C[k]=cm[k];
    G.running=run0;LOOP_OFF=loop0;
  }
  const top=o=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k,v])=>v+"× "+k).join("; ");
  eq(G.mode,"belt","все кадры прошли в поясе");
  ok(K.poiDrawn>=BGATE_N*5,"ориентиры в кадре: "+K.poiDrawn+" отрисовок за "+BGATE_N+" кадров (≥ пяти на кадр)");
  eq(Object.keys(K.world).length,0,"мир пояса не рисует на #c"+(Object.keys(K.world).length?": "+top(K.world):""));
  ok(K.hud>0,"кабина и стекло пока на #c — граница с приборами, следующий шаг: вызовов "+K.hud);
  ok(K.front<=BGATE_N,"копий #c не больше одной на кадр (кабина): "+K.front+" за "+BGATE_N);
  eq(K.sub,BGATE_N,"отправок в очередь ровно по одной на кадр");
  eq(K.bad,0,"холсты не грузятся"+(K.bad?": "+top(K.up):""));
  resetWorld();
}));
