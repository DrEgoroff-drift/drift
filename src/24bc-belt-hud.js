/* ══════════════ кабина пояса на слое приборов #hud (ступень 2, п.2; docs/DESIGN-gpu.md) ══════════════
   Кабина и символика стекла — интерфейс: их место на #hud поверх #g, как у приборов полёта
   (08bh). Браузер кладёт слой сам, копии #c в Dawn нет, и холст — на родном DPR устройства.
   Растр — только когда картинка другая. Как это узнать, не перечисляя руками всё, что
   рисуют drawGlassHUD, drawCockpit, панель, лента и держатель узла: рисунок каждый кадр
   идёт в протокол — подставной ctx записывает вызовы и свойства (координаты с шагом 1/16 px,
   углы 1/4096 рад), и слой перерисовывается, только если протокол не тот, что в прошлый раз.
   Упустить состояние нельзя: чего нет в вызовах, того нет и на картинке. Стрелки, ползущие
   меньше шестнадцатой пикселя, перерисовки не зовут (как 1/256 шкалы у колодки 25c).
   Рисунок чист: ни rnd, ни записи в G — второй прогон на настоящем холсте даёт то же */
const BHUD={log:[],ids:new WeakMap(),n:0,meas:null,kind:new Map(),redraw:0};
function bhudId(o){let i=BHUD.ids.get(o);if(!i){i=++BHUD.n;BHUD.ids.set(o,i);}return i;}
/* что это у CanvasRenderingContext2D: метод, свойство или ничего */
function bhudKind(k){
  let t=BHUD.kind.get(k);if(t)return t;
  const d=typeof k==="string"&&Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype,k);
  t=!d?"x":("value" in d)?(typeof d.value==="function"?"m":"p"):"p";
  BHUD.kind.set(k,t);return t;
}
/* подставной ctx: пишет вызовы в BHUD.log. Мерить текст — настоящим холстом (подписи ламп и
   шкал выбирают слово по ширине); свойства читаются назад, save/restore ведут их стопкой */
function bhudRecorder(){
  const L=BHUD.log,S={font:"10px sans-serif"},stack=[];let gn=0;
  const M=BHUD.meas||(BHUD.meas=document.createElement("canvas").getContext("2d"));
  const q=(v,f)=>typeof v==="number"?Math.round(v*f):typeof v==="string"?v:v&&typeof v==="object"?"#"+(v.__g||bhudId(v)):String(v);
  return new Proxy({},{
    get(_,k){
      if(k==="measureText")return t=>{M.font=S.font;return M.measureText(t);};
      if(k==="save")return ()=>{stack.push(Object.assign({},S));L.push("s");};
      if(k==="restore")return ()=>{const o=stack.pop();if(o){for(const j in S)delete S[j];Object.assign(S,o);}L.push("r");};
      if(k==="createLinearGradient"||k==="createRadialGradient")return (...a)=>{
        const g={__g:"g"+(++gn)};L.push(g.__g+k[6]+a.map(x=>q(x,16)).join());
        g.addColorStop=(o,c)=>{L.push(g.__g+":"+o+","+c);};return g;};
      const t=bhudKind(k);
      if(t==="m")return (...a)=>{L.push(k+"("+a.map((x,i)=>q(x,k==="rotate"||(k==="arc"&&i>2)||(k==="ellipse"&&i>3)?4096:16)).join()+")");};
      if(t==="p")return k in S?S[k]:M[k];
      return undefined;
    },
    set(_,k,v){S[k]=v;L.push(k+"="+q(v,1024));return true;}
  });
}
/* лампы на стойках моргают сами по себе — это не повод перерисовывать всю кабину. На слое
   приборов остаётся погашенная лампа, горящая — свой маленький холст над ним (подписи мира
   08bh: LABDOM прячет его в кадре, где лампа не горит, и кладёт в снимок кадра). Дробь места
   печётся внутрь холста, чтобы круг лёг туда же, куда 2D */
function bhudLedDom(){return GPU.on&&!!GPU.uctx&&!!BHUD.rec;}
function bhudLed(k,x,y,r,col){
  const box=chipDomBox();if(!box)return;
  const key="bhud:"+k,nd=gpuHudDpr(),R=r*3.4,s=Math.ceil((2*R+2)*nd)/nd;
  const x0=Math.floor((x-s/2)*nd)/nd,y0=Math.floor((y-s/2)*nd)/nd,fx=x-x0,fy=y-y0;
  let e=LABDOM.m.get(key);
  if(!e){
    const cv=document.createElement("canvas");cv.style.cssText="position:absolute;left:0;top:0;transform-origin:0 0";
    box.appendChild(cv);e={cv,sig:"",pos:"",on:false};LABDOM.m.set(key,e);
  }
  e.used=true;
  const sig=r+"|"+col+"|"+nd+"|"+Math.round(fx*64)+","+Math.round(fy*64);
  if(sig!==e.sig){
    e.sig=sig;const cv=e.cv,g=cv.getContext("2d");
    cv.width=cv.height=Math.max(1,Math.round((s+1/nd)*nd));cv.style.width=cv.style.height=cv.width/nd+"px";
    g.setTransform(nd,0,0,nd,0,0);g.fillStyle=col;
    g.beginPath();g.arc(fx,fy,r,0,TAU);g.fill();
    g.globalAlpha=.22;g.beginPath();g.arc(fx,fy,R,0,TAU);g.fill();g.globalAlpha=1;
    e.w=e.h=cv.width/nd;
  }
  e.x=x0;e.y=y0;e.A=1;
  const pos="translate("+x0.toFixed(3)+"px,"+y0.toFixed(3)+"px)";
  if(pos!==e.pos){e.pos=pos;e.cv.style.transform=pos;}
  if(e.op!=="1"){e.op="1";e.cv.style.opacity="1";}
  if(!e.on){e.on=true;e.cv.style.display="";}
}
/* стекло и кабина пояса: с видеокартой — на слой приборов по изменению, без неё — на #c */
function beltHudPush(b,proj,fwd,st){
  const fn=()=>{drawGlassHUD(b,proj,fwd,st);drawCockpit(b,st);};
  if(!GPU.on||!GPU.uctx){fn();return;}
  const fl=()=>{BHUD.rec=true;try{fn();}finally{BHUD.rec=false;}};
  const c0=ctx;BHUD.log.length=0;
  try{ctx=bhudRecorder();fl();}finally{ctx=c0;}
  gpuHud("belt|"+W+"x"+H+"|"+BHUD.log.join(";"),()=>{BHUD.redraw++;fl();});
}
