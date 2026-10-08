/* ══════════════ один астронавт везде: риг в карточке (M801) ══════════════ */
/* Карточка 21phc рисуется для каждой позы книги рига и не вылезает из своей рамки; шаг
   квантуется на восемь ступеней; тот же спрос — та же карточка без перерисовки; живых карточек
   никогда больше потолка. Три первых режима (база, пещера, абордаж) кладут карточку, пока
   RIG_CARD.on, и не кладут, когда переключатель снят. Настоящий G, настоящий кадр. */
function rcBase(){
  const p=G.sys.planets.find(x=>x.type!=="gas")||G.sys.planets[0],kinds=Object.keys(BUILD),cells=[];
  for(let i=0;i<BASE_COLS*BASE_ROWS;i++)cells.push(((i*7)%11<8)?{k:kinds[i%kinds.length],hp:1}:null);
  G.bases[baseKey(G.sx,G.sy,p.idx)]={sx:G.sx,sy:G.sy,idx:p.idx,name:p.name,type:p.type,res:p.res.slice(0,3),cells,pool:{},tMs:now(),built:now()};
  for(let q=0;q<4;q++){const cw=genMerc(hashi(q*77+13,5,3));cw.order={kind:"base",sx:G.sx,sy:G.sy,idx:p.idx};G.crew.push(cw);}
  enterBase(p);
  return G.mode==="base"&&!!G.base;
}
function rcRaid(){
  for(let x=-12;x<12;x++)for(let y=-12;y<12;y++){
    if(!starAt(x,y))continue;
    const s=getSystem(x,y),b=pirateBaseOf(s);
    if(b){G.sys=s;G.sx=x;G.sy=y;enterRaid(b);updateRaid(1);return G.mode==="raid"&&!!G.raid;}
  }
  return false;
}
TEST_SUITES.push(()=>suite("риг карточкой: позы, потолок кэша, три режима",{tier:"browser"},()=>{
  resetWorld();
  if(!ok(GPU.ok&&!!GPU.dev,"видеокарта поднялась"))return;
  /* пещера на движке (M630a) рисует риг телом: карточку кладёт старая рисовалка, её и проверяем */
  const R=RIG_CARD,on0=R.on,cap0=R.cap,cv0=CAVE3.on;CAVE3.on=false;
  try{
    R.on=true;
    /* ── каждая поза книги: карточка есть, тело в рамке ── */
    ok(RIG_POSES.length>=7,"поз в книге карточки не меньше семи: "+RIG_POSES.join(","));
    for(const k of Object.keys(PLN_MAN_POSE))ok(RIG_POSES.indexOf(k)>=0,"поза рига «"+k+"» есть у карточки");
    for(const pose of RIG_POSES){
      const C=rigCard({pose,phase:1,ppm:40});
      ok(C&&!!C.view&&C.w>0&&C.h>0,"карточка позы «"+pose+"» нарисована");
      const b=rigCardBounds(pose,1,.30,0),B=RIG_BOX;
      ok(b.x0>=B.x0&&b.x1<=B.x1&&b.y0>=B.y0&&b.y1<=B.y1,"поза «"+pose+"» в рамке карточки: "+JSON.stringify(b));
    }
    eq(rigCard({pose:"jump",ppm:40}).pose,"air","прыжок — поза воздуха рига");
    eq(rigCard({pose:"sit",ppm:40}),null,"сидеть риг не умеет — карточки нет, режим рисует сам");
    /* ── шаг — восемь ступеней; тот же спрос — та же карточка ── */
    const keys=new Set();
    for(let i=0;i<32;i++)keys.add(rigCard({pose:"walk",phase:i/32*TAU,ppm:40}).key);
    eq(keys.size,8,"шаг квантуется на восемь ступеней фазы");
    const a=rigCard({pose:"stand",ppm:40}),m0=R.made;
    ok(rigCard({pose:"stand",ppm:40})===a&&R.made===m0,"тот же спрос — та же карточка, без перерисовки");
    /* ── потолок: сто разных мерок, живых — не больше cap ── */
    let top=0;
    for(let i=0;i<100;i++){rigCard({pose:"stand",ppm:8+i*4});top=Math.max(top,R.M.size);}
    eq(top,R.cap,"живых карточек ровно до потолка, не больше");
    ok(R.cap<=24,"потолок не выше 24");
    /* ── три режима: кладут карточку при on и не кладут при off ── */
    const takers=[["base",rcBase],["cave",()=>{landOnTestPlanet();enterCave();return G.mode==="cave"&&!!G.cave;}],["raid",rcRaid]];
    for(const [m,go] of takers){
      resetWorld();R.on=true;
      if(!ok(go(),"режим «"+m+"» поднят"))continue;
      const b0=R.by[m];drawWorld();
      ok(R.by[m]>b0,"«"+m+"»: при RIG_CARD.on кладёт карточку рига");
      if(m==="base")ok(R.by.base-b0>=2,"база: карточкой и игрок, и смена");
      R.on=false;const b1=R.by[m];drawWorld();
      eq(R.by[m],b1,"«"+m+"»: при RIG_CARD.off карточки нет — старая кисть");
    }
  }finally{R.on=on0;R.cap=cap0;CAVE3.on=cv0;}
}));
