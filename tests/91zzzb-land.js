/* ══════════════ сквозной: автопосадка на каждый мир, панели не наслаиваются, текст в кнопках ══════════════
   Автор (03.09.2026): «при автопосадке на спутник газового гиганта не смог
   сесть, корабль разбивался»; «кнопки в десктопе и панели наслаиваются»;
   «текст в кнопках выходит за рамки». Три жалобы — три проверки, которые
   гоняются на каждой сборке, а не ждут захода в игру. */

/* ── автопосадка: садится на КАЖДЫЙ тип мира и на каждый радиус ──
   Автопилот детерминирован (случайность только в стартовой точке), поэтому
   прогон честный: startLanding → updateLanding до касания. Разбился — значит
   тяги не хватает против тяготения или заход не сходится; адрес — тип и радиус. */
TEST_SUITES.push(()=>suite("сквозной: автопосадка садится на каждый мир",()=>{
  resetWorld();
  const keep=G.opts.easyLand;G.opts.easyLand=true;
  const bad=[],seen={};let tries=0;
  const systems=[];
  for(let r0=0;r0<6&&systems.length<14;r0++)for(let x=-r0;x<=r0;x++)for(let y=-r0;y<=r0;y++){
    if(Math.max(Math.abs(x),Math.abs(y))!==r0)continue;
    if(typeof starAt==="function"&&!starAt(x,y))continue;
    const s=getSystem(x,y);if(s&&s.planets&&s.planets.length)systems.push({x,y,s});
  }
  for(const {x,y,s} of systems){
    for(const p of s.planets){
      if(p.type==="gas")continue;                          /* на гигант не садятся */
      const key=p.type+(p.radius>60?"·крупный":"·малый");
      if(seen[key]>=2)continue;seen[key]=(seen[key]||0)+1;
      G.sx=x;G.sy=y;G.sys=s;G.fuel=100;G.hull=100;
      /* старт задаётся руками, а не броском rng: иначе прогон то ловит крушение,
         то нет. Два худших захода — с дальнего края и со сносом к площадке */
      for(const [off,vx] of [[-450,1.2],[450,-1.2]]){
        let err=null;
        try{
          startLanding(p);
          const L=G.land;
          L.x=clamp(L.tr.padX+off,60,L.tr.W-60);L.y=landStartY(L.tr,L.x);L.vx=vx;
          let n=0;
          while(G.mode==="landing"&&L.over===0&&n<6000){updateLanding(1);n++;}
          tries++;
          if(n>=6000)err="не коснулся за 6000 кадров";
          else if(!L.ok)err="крушение "+JSON.stringify(L.touch)+" g "+L.g.toFixed(3)+" старт "+off;
        }catch(e){err="исключение: "+e.message;}
        if(err)bad.push(p.type+" r"+Math.round(p.radius)+" ["+x+","+y+"]: "+err);
        G.mode="system";G.land=null;
      }
    }
  }
  G.opts.easyLand=keep;resetWorld();
  ok(tries>=10,"заходов сделано: "+tries+" ("+Object.keys(seen).length+" сочетаний тип·размер)");
  eq(bad.join(" ;; "),"","автопосадка села везде");
}));

/* ── панели не наслаиваются, текст в кнопках не вылезает ──
   На каждой сцене из общего списка: видимые плавающие панели (приборы, подсказка,
   пэды, взлёт, рейка, меню, консоль, попугай) не пересекаются прямоугольниками;
   у каждой видимой кнопки текст помещается (scrollWidth ≤ clientWidth). */
TEST_SUITES.push(()=>suite("сквозной: панели не наслаиваются, текст в кнопках помещается",()=>{
  /* пэды меряются ГРУППАМИ, а не одним ящиком: `.pads` — полоса во всю
     ширину, кнопки в ней стоят по краям, а середина пуста по замыслу — там и
     висит консоль. По ящику выходило пересечение 426×68, при котором ни одна
     кнопка ничем не накрыта (проверено `elementFromPoint`, 91zzzzzg). Телефонный
     набор меряет так же — по `.pads>div`. */
  const SEL=[".hud","#prompt",".pads>div:first-child",".pads>div:last-child","#launchbtn",
             ".rail","#menu","#console","#parrotwin","#dronebtn"];
  const overlaps=[],spill=[];let scenes=0,checked=0;
  const vis=el=>{if(!el)return null;const cs=getComputedStyle(el);
    if(cs.display==="none"||cs.visibility==="hidden"||+cs.opacity<.05)return null;
    const r=el.getBoundingClientRect();return (r.width>2&&r.height>2)?r:null;};
  const hit=(a,b)=>{const ix=Math.min(a.right,b.right)-Math.max(a.left,b.left),iy=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
    return ix>4&&iy>4?Math.round(ix)+"×"+Math.round(iy):null;};
  for(const sc of lookScenes()){
    resetWorld();
    try{if(sc.set()===false||G.mode==="none")continue;drawWorld();if(typeof hud==="function")hud();}catch(e){continue;}
    scenes++;
    const boxes=SEL.map(s=>({s,r:vis(document.querySelector(s))})).filter(b=>b.r);
    for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
      const h=hit(boxes[i].r,boxes[j].r);
      if(h)overlaps.push(sc.id+": "+boxes[i].s+" ∩ "+boxes[j].s+" "+h);
    }
    for(const b of document.querySelectorAll("button")){
      /* кнопки — без порога прозрачности: пэды в покое полупрозрачны, но текст в них виден */
      if(b.offsetParent===null||b.getBoundingClientRect().width<2)continue;checked++;
      if(b.scrollWidth>b.clientWidth+1||b.scrollHeight>b.clientHeight+3)
        spill.push(sc.id+": «"+(b.textContent||"").trim().slice(0,22)+"» "+b.scrollWidth+">"+b.clientWidth);
    }
  }
  resetWorld();
  ok(scenes>=8,"сцен проверено: "+scenes+", кнопок: "+checked);
  eq([...new Set(overlaps)].slice(0,6).join(" ;; "),"","плавающие панели не пересекаются");
  eq([...new Set(spill)].slice(0,6).join(" ;; "),"","текст в кнопках помещается");
}));
