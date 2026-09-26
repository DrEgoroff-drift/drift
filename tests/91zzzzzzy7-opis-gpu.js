/* ══════════════ ОПИСЬ на движке (G15): корабль без 2D-холста ══════════════
   Силуэт корабля в ОПИСИ (27j) рисует кадр: корпус — студия 17c2 (hullStudio, тот же hullGpuDraw
   своим проходом), тень, якоря и плюсы — примитивы ov* на своём контексте webgpu холста .op-hull.
   Сорок кадров над полётом с открытой ОПИСЬЮ: пустой #c никто не пачкает и не грузит, отправка
   одна на кадр, у холста силуэта 2D-контекста нет (getContext("2d") у холста webgpu — null),
   проход силуэта — только когда сменилась подпись (выбор слота), тёплые выпечки полёта целы.
   Кто пачкает #c — называется по стеку (gateWho, 91zzzzzzy) */
TEST_SUITES.push(()=>suite("ОПИСЬ на движке: силуэт корабля без 2D, #c пуст",{tier:"browser"},()=>{
  if(!ok(GPU.ok,"видеокарта есть — без неё силуэт не меряется"))return;
  resetWorld();
  G.mode="system";G.ap=null;G.orbit=null;G.pirates=[];G.shots=[];G.msl=[];G.loot=[];
  const sh=G.ship,X=sh.x,Y=sh.y,WARM=12,N=40;
  const Q=GPUQueue.prototype,q0={c:Q.copyExternalImageToTexture,s:Q.submit},run0=G.running,loop0=LOOP_OFF,Cx=MAIN_CTX,cm={};
  const K={on:false,front:0,sub:0,dirt:{}};
  const who=()=>new Error().stack.split("\n").slice(3,8).map(l=>{const m=/at (?:new )?([\w$.]+)/.exec(l);return m?m[1]:"?";}).join("<");
  let i=0,n0=0,n1=0,n2=0,lru0=null,cv=null;
  const step=()=>{sh.x=X;sh.y=Y;sh.vx=0;sh.vy=0;frameBody(wallMs());};
  try{
    Q.copyExternalImageToTexture=function(src,dst){if(K.on&&dst.texture===GPU.T.front)K.front++;return q0.c.apply(this,arguments);};
    Q.submit=function(){if(K.on)K.sub++;return q0.s.apply(this,arguments);};
    G.running=true;LOOP_OFF=false;
    tableToggle(true,"hold");
    cv=OPIS.box&&OPIS.box.querySelector("canvas.op-hull");
    if(!ok(cv,"холст силуэта есть"))return;
    for(i=0;i<WARM;i++)step();
    n0=OPIS_G.n;lru0=new Set(HG_LRU.keys());
    K.on=true;gpuFrontHook();
    for(const k of ["fill","stroke","fillRect","strokeRect","drawImage","fillText","strokeText","putImageData"]){
      const o=Cx[k];cm[k]=o;
      Cx[k]=function(){if(K.on&&GPU.cState===0){const w=k+":"+who();K.dirt[w]=(K.dirt[w]||0)+1;}return o.apply(this,arguments);};}
    for(i=0;i<N;i++)step();
    n1=OPIS_G.n;
    /* выбор слота — новая подпись: ровно один проход */
    const a=OPIS.hit[0];if(a){OPIS.sel={t:"slot",i:a.i};opisHullRedraw();}
    for(i=0;i<4;i++)step();
    n2=OPIS_G.n;
  }catch(e){ok(false,"кадр "+i+" упал: "+e.message);}
  finally{
    K.on=false;Q.copyExternalImageToTexture=q0.c;Q.submit=q0.s;
    for(const k in cm)Cx[k]=cm[k];
    G.running=run0;LOOP_OFF=loop0;
  }
  const top=o=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k,v])=>v+"× "+k).join("; ");
  ok(n0>=1,"силуэт нарисован на прогреве ("+n0+" проходов)");
  ok(OPIS_G.cv===cv&&cv.getContext("2d")===null,"у холста силуэта контекст webgpu, 2D нет");
  ok(OPIS_G.S.tex&&OPIS_G.S.bk&&OPIS_G.S.bk.B,"студия: своя текстура и своя выпечка корпуса");
  eq(n1,n0,"без перемен силуэт не перерисовывается");
  eq(n2,n1+1,"выбор слота — один проход");
  ok(lru0&&HG_LRU.size===lru0.size&&[...lru0].every(k=>HG_LRU.has(k)),"тёплые выпечки корпусов полёта не тронуты");
  eq(K.front,0,"#c за "+N+" кадров не грузился"+(K.front?" — пачкают: "+top(K.dirt):""));
  eq(Object.keys(K.dirt).length,0,"пустой #c никто не пачкает"+(Object.keys(K.dirt).length?": "+top(K.dirt):""));
  eq(K.sub,N+4,"отправок в очередь ровно по одной на кадр");
  try{tableToggle(false);}catch(e){}
  OPIS.sel=null;
  resetWorld();
}));
