/* ══════════════ другое взросление: один народ на ступенях, взаимность в ядре ══════════════ */
TEST_SUITES.push(()=>suite("другое взросление: дворы по ступеням, дар в ядре возвращается умнее",()=>{
  resetWorld();
  const at=regionOfTheme("grown");ok(!!at,"область расставлена");
  const R=regionAt(at.rx*REGION_SPAN,at.ry*REGION_SPAN);
  eq(R.needle,"mass","прибор — масс-детектор");
  /* окраина: ступени разные */
  const ex=new Set();
  for(let x=at.rx*REGION_SPAN;x<(at.rx+1)*REGION_SPAN;x++)for(let y=at.ry*REGION_SPAN;y<(at.ry+1)*REGION_SPAN;y++){
    if(!starAt(x,y)||(x===R.core.sx&&y===R.core.sy))continue;
    G.sx=x;G.sy=y;G.sys=getSystem(x,y);ex.add(grownExtra({}));
  }
  ok(ex.size>=2||ex.size===0,"ступени на окраине разные ("+[...ex].join(",")+")");
  G.sx=R.core.sx;G.sy=R.core.sy;G.sys=getSystem(G.sx,G.sy);G.mode="system";G.running=true;
  eq(grownExtra({}),0,"в ядре лишних дворов нет");
  const pc=(G.sys.planets||[]).find(p=>settleCanLive(p));
  if(pc){
    ok(grownIsCore(pc),"планета ядра — где живут");
    const tr=genTerrain(pc);G.land={p:pc,tr,x:tr.padX,y:groundAt(tr,tr.padX)};enterSurface();
    const S=settleTick(settleMake?settleMake(pc):settleAt(G.sx,G.sy))||settleAt(G.sx,G.sy);
    if(S){
      G.cargo.organics=5;G.log=[];const m0=S.mood;
      const n=settleGive(S,"organics",2);ok(n>0,"дар принят");
      eq(G.grown.recip,1,"они вас обошли");ok(S.mood>m0+2,"настроение выше принесённого");
      ok(G.log.some(e=>/Прибор|Семя|Механизм|Лампу/.test(e.s)),"строка про то, что они сделали с даром");
      ok(/Взошло лучше/.test(grownGroundLine()),"строка к посадке изменилась");
    }
  }
  const recip0=G.grown.recip,s=snapshot();applySave(s);eq(G.grown.recip,recip0,"счёт переживает сейв");
  G.sx=0;G.sy=0;G.sys=getSystem(0,0);eq(grownExtra({}),0,"дома ничего");
}));
