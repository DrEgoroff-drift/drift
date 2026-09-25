/* ══════════════ неон: буква — трубка (16/n, DESIGN-gpu §L.S «Glow») ══════════════
   Вывеска печётся в пикселях устройства под кегль на экране и кладётся один к одному,
   на целые пиксели. Альбедо — всё имя тёмным стеклом (мёртвые буквы видны трубкой без
   газа). Эмиссия — живые буквы цветом трубки, насыщеннее лампы (плечо тона белит
   яркое), с ореолом уже просвета между буквами; бледное ядро — средняя треть штриха
   и только на штрихе шире ~2.4 px, иначе трубка светится своим цветом целиком.
   Узкий ореол принадлежит букве; в свечение кадра уходит мало. */
const NEON=new Map();   // место (гостиница, щит) → последняя печь
function neonBake(slot,name,full,F,col,bl){
  const d=DPR,key=name+"|"+full+"|"+F+"|"+col.join()+"|"+d+"|"+bl;
  let N=NEON.get(slot);if(N&&N.key===key)return N;
  const mk=k=>(N&&N[k])||document.createElement("canvas"),al=mk("al"),em=mk("em"),co=mk("co");
  const Fd=F*d,fb="bold "+Fd+"px ui-monospace,monospace";
  let a=al.getContext("2d");a.font=fb;
  const tw=Math.ceil(a.measureText(full).width),pad=Math.ceil(3*d);
  const mid=bl==="middle",base=pad+Math.ceil(Fd*(mid?.62:.82)),Hd=base+Math.ceil(Fd*(mid?.62:.28))+pad;
  for(const q of [al,em,co]){q.width=tw+pad*2;q.height=Hd;}
  const txt=(g,f)=>{g.font=fb;g.textAlign="left";g.textBaseline=bl;f(g);};
  a=al.getContext("2d");txt(a,g=>{g.fillStyle="rgba(78,64,62,.9)";g.fillText(full,pad,base);});
  const tube=col.map(v=>Math.max(0,255-(255-v)*1.6));
  const e=em.getContext("2d");
  txt(e,g=>{g.shadowColor=rgba(tube,.85);g.shadowBlur=Math.max(1,Fd*.14);g.fillStyle=rgba(tube,1);g.fillText(name,pad,base);});
  const sw=Fd*.16;
  if(sw>=2.4){
    const k=co.getContext("2d");
    txt(k,g=>{g.fillStyle=rgba(tube.map(v=>v+(255-v)*.6),1);g.fillText(name,pad,base);
      g.globalCompositeOperation="destination-out";g.lineWidth=sw*2/3;g.lineJoin="round";g.strokeStyle="#000";g.strokeText(name,pad,base);});
    e.shadowBlur=0;e.drawImage(co,0,0);
  }
  N={key,al,em,co,ax:pad+tw/2,ay:base,w:(tw+pad*2)/d,h:Hd/d};NEON.set(slot,N);return N;
}
/* вывеска: середина строки по x, базовая линия (bl печи) по y — в пикселях CSS экрана;
   al — плотность стекла, gain — усиление света. Без видеокарты — тем же на ctx */
function neonDraw(pass,N,x,y,al,gain){
  const d=DPR,l=Math.round((x-N.ax/d)*d)/d,t=Math.round((y-N.ay/d)*d)/d,R=a=>[{x:l+N.w/2,y:t+N.h/2,w:N.w,h:N.h,a}];
  if(pass){gpuImage(pass,N.al,R(al),{ver:N.key});gpuImage(pass,N.em,R(gain),{blend:"add",ver:N.key});return;}
  ctx.save();ctx.globalAlpha=al;ctx.drawImage(N.al,l,t,N.w,N.h);
  ctx.globalCompositeOperation="lighter";ctx.globalAlpha=Math.min(1,gain);ctx.drawImage(N.em,l,t,N.w,N.h);ctx.restore();
}
