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

/* ── пустая находка уступает планете ──
   Плейтест 30.08.2026: «поймал сигнал бедствия, мимо пролетает планета — сесть
   нельзя, пишет, что сигнал бедствия уже взят». findInteract возвращал true в
   радиусе 240 единиц ДАЖЕ КОГДА ПРЕДЛОЖИТЬ БЫЛО НЕЧЕГО, а проверка планеты
   стоит ниже по списку и до неё не доходило. */
TEST_SUITES.push(()=>suite("находка не держит ДЕЙСТВИЕ, когда ей нечего дать",()=>{
  resetWorld();
  let sys=null,f=null;
  for(let dx=-9;dx<=9&&!f;dx++)for(let dy=-9;dy<=9&&!f;dy++){
    if(!starAt(dx,dy))continue;
    const q=getSystem(dx,dy);
    const hit=findsIn(q).find(x=>x.k!=="echo");
    if(hit){sys=q;f=hit;}
  }
  ok(!!f,"нашлась хоть одна находка в округе");
  if(!f)return;
  G.sx=sys.sx;G.sy=sys.sy;G.sys=sys;
  const sh={x:f.x,y:f.y};
  G.prompt="";
  ok(findInteract(sh)===true,"нетронутая находка рядом — держит подсказку");
  ok(/ДЕЙСТВИЕ/.test(G.prompt),"и предлагает действие: "+G.prompt);
  findTake(f);
  G.prompt="";
  ok(findInteract(sh)===false,"осмотренная — уступает: проверки ниже по списку доходят");
  ok(G.prompt.indexOf("УЖЕ")>0,"но подписывается, чтобы не пропасть из кадра");
  /* и не затирает чужую подсказку, если та уже стоит */
  G.prompt="ДЕЙСТВИЕ — ПОСАДКА";
  findInteract(sh);
  eq(G.prompt,"ДЕЙСТВИЕ — ПОСАДКА","чужую подсказку осмотренная находка не трогает");
  /* нетронутая тоже уступает планете, у которой уже можно садиться */
  const pl=sys.planets[0];
  if(pl){
    G.findsSeen={};
    const near={x:pl.x+pl.radius+40,y:pl.y};
    ok(findLandingNear(near),"у поверхности планеты посадка уже разрешена");
    const f2=findsIn(sys).find(x=>x.k!=="echo");
    f2.x=near.x+30;f2.y=near.y;
    G.prompt="";
    ok(findInteract(near)===false,"находка у самой планеты пропускает посадку вперёд");
  }
}));
