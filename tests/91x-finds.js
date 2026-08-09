/* ══════════════ автотесты: находки в пустоте ══════════════ */
/* Система, в которой находки вообще есть: их бывает ноль, и это правильно */
function findTestSys(){
  for(let dx=-9;dx<=9;dx++)for(let dy=-9;dy<=9;dy++){
    if(!starAt(dx,dy))continue;
    const s=getSystem(dx,dy);
    if(findsIn(s).length)return s;
  }
  return null;
}
TEST_SUITES.push(()=>suite("находки: пустота перестала быть пустой",()=>{
  resetWorld();
  const s=findTestSys();
  ok(!!s,"нашлась система с находкой");
  /* один и тот же вход даёт то же самое: пустота не барабан */
  const a=JSON.stringify(findsIn(s)),b=JSON.stringify(findsIn(s));
  ok(a===b,"перезаход в систему не крутит барабан");
  /* пусто бывает, и это норма: иначе находка перестаёт быть находкой */
  let empty=0,tot=0;
  for(let dx=-9;dx<=9;dx++)for(let dy=-9;dy<=9;dy++){
    if(!starAt(dx,dy))continue;
    tot++;if(!findsIn(getSystem(dx,dy)).length)empty++;
  }
  ok(empty>0,"пустые системы есть ("+empty+" из "+tot+")");
  ok(empty<tot,"не все системы пусты");
  for(const f of findsIn(s)){
    ok(!!FIND_KINDS[f.k],"вид находки известен: "+f.k);
    const r=Math.hypot(f.x,f.y);
    ok(r>600&&r<3000,"находка лежит между звездой и краем ("+Math.round(r)+")");
    ok(!findSeen(f),"новая находка не осмотрена");
  }
}));

/* ── взятое не возвращается, и спутник платит не тем, чем остальные ── */
TEST_SUITES.push(()=>suite("находки: взятое помнится, спутник несёт отчёт",()=>{
  resetWorld();
  const s=findTestSys();
  if(!s){ok(true,"находок в мире не нашлось — проверять нечего");return;}
  G.sx=s.sx;G.sy=s.sy;G.sys=s;
  const f=findsIn(s)[0];
  const credits=G.credits;
  findTake(f);
  ok(findSeen(f),"осмотренная находка помечена");
  ok(G.credits===credits,"находка не платит кредитами: она даёт вещи, а не деньги");
  /* память переживает запись */
  applySave(JSON.parse(JSON.stringify(snapshot())));
  ok(findSeen(f),"осмотр пережил snapshot/applySave");
  /* спутник — единственный, кто несёт кусок отчёта */
  resetWorld();
  let sat=null,sys=null;
  for(let dx=-9;dx<=9&&!sat;dx++)for(let dy=-9;dy<=9&&!sat;dy++){
    if(!starAt(dx,dy))continue;
    const q=getSystem(dx,dy);
    const hit=findsIn(q).find(x=>x.k==="sat");
    if(hit){sat=hit;sys=q;}
  }
  if(sat){
    G.sx=sys.sx;G.sy=sys.sy;G.sys=sys;
    const before=loreCount(),marks=loreMarks().length;
    findTake(sat);
    ok(loreCount()===before+1,"спутник отдал кусок отчёта ("+before+" → "+loreCount()+")");
    ok(loreMarks().length>marks,"спутник передал пеленг: на карте появилась метка");
  }else ok(true,"спутников в округе не нашлось — редкая находка, так и задумано");
}));
