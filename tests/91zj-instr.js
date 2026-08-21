/* ══ M122: пять стрелок и невязка ══
   Сторож замысла: невязка растёт к ядру монотонно и без скачков, у области
   ровно один врущий прибор, и ни один прибор ничего не объявляет — ни звуком,
   ни сообщением, ни цветом. Прибор, который сам показывает пальцем, — детектор,
   а детектора в игре нет. */
TEST_SUITES.push(()=>suite("Стрелки: невязка — это склон, а не порог",()=>{
  resetWorld();
  eq(INSTR.length,5,"приборов пять");
  ok(INSTR.every(I=>I.ru&&typeof I.base==="function"),"у каждого есть имя и рабочая база");
  ok(!INSTR.some(I=>I.col||I.alarm||I.sound),"ни у одного нет тревожного цвета или звука");

  /* ── у области один прибор, и он из этих пяти ── */
  const seen={};
  let regions=0;
  for(let x=-12;x<=12;x+=REGION_SPAN)for(let y=-12;y<=12;y+=REGION_SPAN){
    const R=regionAt(x,y);
    regions++;
    ok(INSTR_KEYS.indexOf(R.needle)>=0,"прибор области известен: "+R.needle);
    seen[R.needle]=(seen[R.needle]|0)+1;
    /* ядро — живая система, а не пустота: склон должен вести куда-то */
    let anyStar=false;
    for(let ax=0;ax<REGION_SPAN&&!anyStar;ax++)for(let ay=0;ay<REGION_SPAN&&!anyStar;ay++)
      if(starAt(R.rx*REGION_SPAN+ax,R.ry*REGION_SPAN+ay))anyStar=true;
    ok(!anyStar||!!starAt(R.core.sx,R.core.sy),"ядро области "+R.key+" — звезда");
    /* та же область для любого сектора внутри неё */
    eq(regionAt(x+1,y+1).key,R.key,"соседний сектор — та же область");
    eq(regionAt(x+1,y+1).needle,R.needle,"и тот же единственный прибор");
  }
  ok(regions>=25,"областей проверено: "+regions);
  ok(Object.keys(seen).length>=3,"врут разные приборы, а не один на всю галактику");

  /* ── монотонность: ближе к ядру — больше, всегда ── */
  let bad=0,jump=0,maxStep=0;
  for(let x=-12;x<=12;x+=REGION_SPAN)for(let y=-12;y<=12;y+=REGION_SPAN){
    const R=regionAt(x,y);
    const pts=[];
    for(let dx=0;dx<REGION_SPAN;dx++)for(let dy=0;dy<REGION_SPAN;dy++){
      const px=R.rx*REGION_SPAN+dx,py=R.ry*REGION_SPAN+dy;
      pts.push({d:Math.hypot(px-R.core.sx,py-R.core.sy),m:misclose(px,py)});
    }
    pts.sort((a,b)=>a.d-b.d);
    for(let i=1;i<pts.length;i++)if(pts[i].m>pts[i-1].m+1e-9)bad++;
    /* и без порогов — в том числе НА ГРАНИЦЕ области, где порог и прячется:
       шагаем сплошняком по всей полосе, границы не пропуская */
    for(let dx=0;dx<REGION_SPAN;dx++)for(let dy=0;dy<REGION_SPAN;dy++){
      const px=R.rx*REGION_SPAN+dx,py=R.ry*REGION_SPAN+dy;
      for(const st of [Math.abs(misclose(px+1,py)-misclose(px,py)),
                       Math.abs(misclose(px,py+1)-misclose(px,py))]){
        maxStep=Math.max(maxStep,st);
        if(st>.35)jump++;
      }
    }
  }
  eq(bad,0,"ближе к ядру невязка нигде не падает");
  eq(jump,0,"скачков между соседними секторами нет (макс шаг "+maxStep.toFixed(3)+")");
  ok(misclose(0,0)>=0,"невязка неотрицательна");

  /* ── в ядре она заметна, у края области почти нет ── */
  const R0=regionAt(0,0);
  ok(misclose(R0.core.sx,R0.core.sy)>misclose(R0.core.sx+5,R0.core.sy+5)+.1,
     "в ядре ощутимо больше, чем за краем области");
}));

/* ══ приборы ничего не объявляют ══ */
TEST_SUITES.push(()=>suite("Стрелки: прибор показывает, а не сообщает",()=>{
  resetWorld();
  /* ловим все двери наружу разом: сообщение, журнал, окно, звук */
  const spy={say:0,tell:0,log:0,sfx:0};
  const s0=say,t0=tell,l0=logAdd,f0=sfx;
  say=function(){spy.say++;return s0.apply(null,arguments);};
  tell=function(){spy.tell++;return t0.apply(null,arguments);};
  logAdd=function(){spy.log++;return l0.apply(null,arguments);};
  sfx=function(){spy.sfx++;return f0.apply(null,arguments);};
  let reads=0;
  for(let x=-8;x<=8;x+=2)for(let y=-8;y<=8;y+=2){
    const R=instrRead(x,y);
    instrMisclose(x,y);
    reads+=R.length;
  }
  say=s0;tell=t0;logAdd=l0;sfx=f0;
  ok(reads>=200&&reads%5===0,"снято показаний, по пять на сектор: "+reads);
  eq(spy.say+spy.tell+spy.log+spy.sfx,0,
     "ни одного сообщения, записи в журнал или звука со стороны приборов");

  /* ── правило 3: отклонение достаётся ровно одному прибору ── */
  for(let x=-6;x<=6;x+=3)for(let y=-6;y<=6;y+=3){
    const R=instrRead(x,y),off=R.filter(r=>r.dev>0);
    ok(off.length<=1,"врёт не больше одного прибора в секторе "+x+":"+y);
    if(off.length)eq(off[0].id,regionAt(x,y).needle,"и это прибор области");
  }
  /* ── правило 2: у показания есть рабочая база, не только отклонение ── */
  const here=instrRead(0,0);
  ok(here.every(r=>isFinite(r.val)&&isFinite(r.base)),"все показания — числа");
  ok(here.every(r=>!r.col),"у показания нет цвета: цветом прибор не говорит");
}));
