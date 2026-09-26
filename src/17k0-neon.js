/* ══════════════ неон: буква — трубка (16/n, DESIGN-gpu §L.S «Glow») ══════════════
   Вывеска печётся в пикселях устройства под кегль на экране и кладётся один к одному,
   на целые пиксели. Альбедо — всё имя тёмным стеклом (мёртвые буквы видны трубкой без
   газа). Эмиссия — живые буквы цветом трубки, насыщеннее лампы (плечо тона белит
   яркое), с ореолом уже просвета между буквами; бледное ядро — средняя треть штриха
   и только на штрихе шире ~2.4 px, иначе трубка светится своим цветом целиком.
   Узкий ореол принадлежит букве; в свечение кадра уходит мало. */
const NEON=new Map();   // ключ печи (имя, кегль, цвет, плотность) → печь; bakeKeep держит 12
/* выпечки на GPU-холсте (v2: текст и тень, 25.09): стекло, свет с ореолом (shadowBlur),
   бледное ядро — своей выпечкой (destination-out по свету стёр бы ореол) и кладётся в свет */
const neonKey=(name,full,F,col,bl,opt)=>name+"|"+full+"|"+F+"|"+col.join()+"|"+DPR+"|"+bl+(opt&&opt.core?"|c":"");
function neonBake(slot,name,full,F,col,bl,opt){
  if(!GPU.dev)return null;
  const it=neonJob(name,full,F,col,bl,opt);let r;while(!(r=it.next()).done);return r.value;
}
/* заранее, пока вывеска за краем: по выпечке на шаг печи — три в одном кадре были бы тремя submit */
function neonAhead(name,full,F,col,bl,opt){
  if(GPU.dev&&!NEON.has(neonKey(name,full,F,col,bl,opt)))prebake("neon|"+neonKey(name,full,F,col,bl,opt),()=>neonJob(name,full,F,col,bl,opt),false);
}
function* neonJob(name,full,F,col,bl,opt){
  const core=!!(opt&&opt.core),d=DPR,key=neonKey(name,full,F,col,bl,opt);
  if(NEON.has(key))return bakeKeep(NEON,key,12,null);
  let co=null,al=null,ok=false;
  try{
  const Fd=F*d,fb="bold "+Fd+"px ui-monospace,monospace";
  const tw=Math.ceil(gcMeasure(fb,full).width),pad=Math.ceil(3*d);
  const mid=bl==="middle",base=pad+Math.ceil(Fd*(mid?.62:.82)),Hd=base+Math.ceil(Fd*(mid?.62:.28))+pad,Wd=tw+pad*2;
  const txt=(g,f)=>{g.font=fb;g.textAlign="left";g.textBaseline=bl;f(g);},O={mips:false};
  const tube=col.map(v=>Math.max(0,255-(255-v)*1.6)),sw=Fd*.16;
  co=sw>=2.4?gpuBake(Wd,Hd,g=>txt(g,g=>{g.fillStyle=rgba(tube.map(v=>v+(255-v)*.6),1);g.fillText(name,pad,base);
      g.globalCompositeOperation="destination-out";g.lineWidth=sw*2/3;g.lineJoin="round";g.strokeStyle="#000";g.strokeText(name,pad,base);}),O):null;
  if(co)yield;
  al=gpuBake(Wd,Hd,g=>txt(g,g=>{g.fillStyle="rgba(78,64,62,.9)";g.fillText(full,pad,base);}),O);
  yield;
  /* opt.core (вывески гостиниц, 25.09): на мелком кегле, где средней трети штриха нет, буква целиком чуть бледнее
     трубки — ядро читается и после свечения кадра, а не расплывается пятном своего цвета */
  const lit=core&&!co?tube.map(v=>v+(255-v)*.45):tube;
  const em=gpuBake(Wd,Hd,g=>{txt(g,g=>{g.shadowColor=rgba(tube,.85);g.shadowBlur=Math.max(1,Fd*.14);g.fillStyle=rgba(lit,1);g.fillText(name,pad,base);});
    if(co){g.shadowBlur=0;g.drawImage(co,0,0);}},O);
  const v={key,al,em,co,ax:pad+tw/2,ay:base,w:Wd/d,h:Hd/d,drop(){gpuBakeDrop(al);gpuBakeDrop(em);gpuBakeDrop(co);}};
  if(NEON.has(key))v.drop();   /* пока пеклась шагами, её допекли сразу (neonBake) */
  ok=true;return bakeKeep(NEON,key,12,()=>v);
  }finally{if(!ok){gpuBakeDrop(co);gpuBakeDrop(al);}}
}
/* вывеска: середина строки по x, базовая линия (bl печи) по y — в пикселях CSS экрана;
   al — плотность стекла, gain — усиление света. Без видеокарты вывески нет (2D-пути нет) */
function neonDraw(pass,N,x,y,al,gain){
  const d=DPR,l=Math.round((x-N.ax/d)*d)/d,t=Math.round((y-N.ay/d)*d)/d,R=a=>[{x:l+N.w/2,y:t+N.h/2,w:N.w,h:N.h,a}];
  if(!pass||!N)return;
  gpuImage(pass,N.al,R(al));gpuImage(pass,N.em,R(gain),{blend:"add"});
}
