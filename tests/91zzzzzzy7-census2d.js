/* ══════════════ проба · перепись 2D по сценам (G15, 05.10) ══════════════
   G15: ни одного 2D-холста. Мерило — что сцена за кадр рисует в 2D: на #c (его
   потом грузят в текстуру — «загрузка #c») и на прочих холстах (выпечки, панели).
   Запись — как у стража 91zzzzzzy6: на #c собственные методы MAIN_CTX (хук 08c
   прячет прототип), на остальных — прототип. Числа на кадр, после прогрева;
   по вызывающим — четыре самых частых. Ничего не утверждает: стенд для очереди G15 */
const CS_KS=["fill","stroke","fillRect","strokeRect","drawImage","fillText","strokeText","putImageData"];
TEST_SUITES.push(()=>suite("проба · перепись 2D по сценам",{tier:"probe"},()=>{
  if(!ok(GPU.ok,"видеокарта есть"))return;
  const WARM=8,N=10,Cx=MAIN_CTX,cm={},pm={},P2=CanvasRenderingContext2D.prototype,Q=GPUQueue.prototype,c0=Q.copyExternalImageToTexture,run0=G.running,loop0=LOOP_OFF;
  const K={on:false,c:0,o:0,up:0,byC:{},byO:{}};
  const who=()=>{const s=new Error().stack.split("\n").slice(3,7);for(const l of s){const m=/at (?:new )?([\w$.]+)/.exec(l);if(m&&!/^(Object|Array|Function)\./.test(m[1]))return m[1];}return "?";};
  const top=(o,n)=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k,v])=>(v/n).toFixed(0)+" "+k).join(", ");
  let t=wallMs();
  const fb=()=>frameBody(t+=16.7);
  const run=(name,set,frame)=>{
    resetWorld();G.running=true;LOOP_OFF=false;
    try{set();}catch(e){note(name+": сцена не встала: "+e.message);return;}
    K.c=K.o=K.up=0;K.byC={};K.byO={};
    try{for(let i=0;i<WARM+N;i++){K.on=i>=WARM;frame(i);}}catch(e){note(name+": кадр упал: "+e.message);}
    K.on=false;
    note(name+" · #c "+(K.c/N).toFixed(0)+"/кадр, загрузок #c "+(K.up/N).toFixed(1)+" · прочие 2D "+(K.o/N).toFixed(0)+"/кадр"+
      (K.c?" · #c: "+top(K.byC,N):"")+(K.o?" · прочие: "+top(K.byO,N):""));
    rows.push([name,K.c/N,K.up/N,K.o/N]);
  };
  const rows=[];
  try{
    gpuFrontHook();
    for(const k of CS_KS){
      const o=Cx[k];cm[k]=o;
      Cx[k]=function(){if(K.on){K.c++;const w=who();K.byC[w]=(K.byC[w]||0)+1;}return o.apply(this,arguments);};
      const p=P2[k];pm[k]=p;
      P2[k]=function(){if(K.on&&this!==Cx){K.o++;const w=who();K.byO[w]=(K.byO[w]||0)+1;}return p.apply(this,arguments);};
    }
    Q.copyExternalImageToTexture=function(src){if(K.on&&src&&src.source===cvs)K.up++;return c0.apply(this,arguments);};
    for(const S of lookScenes())run(S.id,()=>S.set(),fb);
    run("дорога",()=>{document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
      G.road=null;roadOpen();RD.kmh=90;RD.accT=.8;},i=>drawRoad(1000+i*32));
    document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));G.road=null;
  }finally{
    K.on=false;Q.copyExternalImageToTexture=c0;
    for(const k in cm)Cx[k]=cm[k];
    for(const k in pm)P2[k]=pm[k];
    G.running=run0;LOOP_OFF=loop0;
  }
  const z=rows.filter(r=>!r[1]&&!r[2]&&!r[3]).map(r=>r[0]);
  note("итого: чистых сцен "+z.length+" из "+rows.length+(z.length?" ("+z.join(", ")+")":""));
  ok(rows.length>0,"перепись прошла по сценам ("+rows.length+")");
  resetWorld();
}));
