/* ══════════════ один астронавт везде: риг в карточке (M801) ══════════════ */
/* Карточка 21phc рисуется для каждой позы книги рига и не вылезает из своей рамки; шаг
   квантуется на восемь ступеней; тот же спрос — та же карточка без перерисовки; живых карточек
   никогда больше потолка. Абордаж кладёт карточку, пока RIG_CARD.on, и не кладёт, когда
   переключатель снят (база и пещера рисуют риг телом движка, 2D-кистей под ними нет). Настоящий G, настоящий кадр. */
function rcRaid(){
  for(let x=-12;x<12;x++)for(let y=-12;y<12;y++){
    if(!starAt(x,y))continue;
    const s=getSystem(x,y),b=pirateBaseOf(s);
    if(b){G.sys=s;G.sx=x;G.sy=y;enterRaid(b);updateRaid(1);return G.mode==="raid"&&!!G.raid;}
  }
  return false;
}
TEST_SUITES.push(()=>suite("риг карточкой: позы, потолок кэша, абордаж",{tier:"browser"},()=>{
  resetWorld();
  if(!ok(GPU.ok&&!!GPU.dev,"видеокарта поднялась"))return;
  const R=RIG_CARD,on0=R.on,cap0=R.cap;
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
    eq(rigCard({pose:"sit",ppm:40}).pose,"sit","сидеть риг умеет (M632a) — своя карточка");
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
    /* ── абордаж: кладёт карточку при on и не кладёт при off ── */
    const takers=[["raid",rcRaid]];
    for(const [m,go] of takers){
      resetWorld();R.on=true;
      if(!ok(go(),"режим «"+m+"» поднят"))continue;
      const b0=R.by[m];drawWorld();
      ok(R.by[m]>b0,"«"+m+"»: при RIG_CARD.on кладёт карточку рига");
      R.on=false;const b1=R.by[m];drawWorld();
      eq(R.by[m],b1,"«"+m+"»: при RIG_CARD.off карточки нет — старая кисть");
    }
  }finally{R.on=on0;R.cap=cap0;}
}));
