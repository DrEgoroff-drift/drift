/* ── M815 зал на телефоне: перекладка плиты под полосой зала ──
   Ряд разделов подводит под глаз видимую выбранную кнопку. tabsSync (15-input) берёт первую «.on» в ряду,
   а ею бывает вкладка одиночного раздела, спрятанная вместе с #stTabs.solo: её рамка нулевая, и ряд не
   двигался — на 390 «ВЛАДЕНИЯ» стояли срезанными у правого края. Обёртка после syncTabs меряет то, что видно:
   вкладку, если вторая ступень открыта, иначе кнопку раздела. */
function hallNavOn(g){
  const v=b=>b.offsetWidth>0&&b.offsetHeight>0;
  return [...g.querySelectorAll("#stTabs button.on")].find(v)||[...g.children].find(b=>b.tagName==="BUTTON"&&(b.classList.contains("on")||b.classList.contains("open"))&&v(b))||null;
}
function hallNavSync(){
  const g=document.getElementById("stGroups"),on=g&&hallNavOn(g);if(!on)return;
  const r=on.getBoundingClientRect(),s=g.getBoundingClientRect();
  if(r.left<s.left+8)g.scrollLeft+=r.left-s.left-16;
  else if(r.right>s.right-8)g.scrollLeft+=r.right-s.right+16;
  g.classList.toggle("tail",g.scrollLeft>=g.scrollWidth-g.clientWidth-2);
}
{const sync0=syncTabs;syncTabs=function(){sync0();hallNavSync();};}

/* ── цена кадра зала (ворота P1: ≤ 4 мс видеокарты на S23 при плотности панели) ──
   Зал пишет своим кодировщиком, мимо меток пробы ?g11 (28z gpuTs). На время замера кадр зала обёрнут
   двумя пустыми вычислительными проходами с меткой, каждый своей отправкой (как gpuTsAround): начало
   второго минус конец первого — вся работа видеокарты над залом. CPU — часами вокруг hallFrame.
   Кадры зала подряд, без паузы 12 к/с: меряется цена кадра, а не частота. Под съёмкой (docs/shot.py) часы
   страницы шагают руками — CPU тогда по настоящим часам съёмщика (__STEP.real). Без замера ничего не создаётся */
function hallClk(){return (typeof window!=="undefined"&&window.__STEP&&window.__STEP.real)?window.__STEP.real():wallMs();}
const HALL_COST={on:false,qs:null,res:null,rb:[],acc:null};
async function hallCost(sec){
  const d=GPU.dev;if(!d||!GPU.tsOk||!HALL.open)return null;
  const C=HALL_COST;
  if(!C.qs){C.qs=d.createQuerySet({type:"timestamp",count:3});C.res=d.createBuffer({size:24,usage:GPUBufferUsage.QUERY_RESOLVE|GPUBufferUsage.COPY_SRC});}
  C.acc={gpu:[],cpu:[]};C.on=true;
  try{for(let i=Math.round(sec*60);i>0;i--){await new Promise(r=>requestAnimationFrame(r));hallFrame();}}
  finally{C.on=false;}
  await new Promise(r=>setTimeout(r,300));
  const q=a=>{const s=a.slice().sort((x,y)=>x-y);return s.length?{med:+s[s.length>>1].toFixed(2),p90:+s[Math.floor(s.length*.9)].toFixed(2),n:s.length}:null;};
  return {gpu:q(C.acc.gpu),cpu:q(C.acc.cpu),px:HALL.cn?[HALL.cn.width,HALL.cn.height]:null};
}
{const f0=hallFrame;hallFrame=function(){
  const C=HALL_COST;if(!C.on)return f0();
  const d=GPU.dev,qu=d.queue,sub=w=>{const e=d.createCommandEncoder();e.beginComputePass({timestampWrites:w}).end();
    if(w.endOfPassWriteIndex===2){const rb=C.rb.find(b=>b.mapState==="unmapped")||(C.rb.length<6?(C.rb.push(d.createBuffer({size:24,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST})),C.rb[C.rb.length-1]):null);
      if(rb){e.resolveQuerySet(C.qs,0,3,C.res,0);e.copyBufferToBuffer(C.res,0,rb,0,24);qu.submit([e.finish()]);
        rb.mapAsync(GPUMapMode.READ).then(()=>{const a=new BigInt64Array(rb.getMappedRange(0,24));if(a[0]&&a[1]>a[0])C.acc.gpu.push(Number(a[1]-a[0])/1e6);rb.unmap();}).catch(()=>{});return;}}
    qu.submit([e.finish()]);};
  sub({querySet:C.qs,endOfPassWriteIndex:0});
  const t0=hallClk();const r=f0();C.acc.cpu.push(hallClk()-t0);
  sub({querySet:C.qs,beginningOfPassWriteIndex:1,endOfPassWriteIndex:2});
  return r;};}
