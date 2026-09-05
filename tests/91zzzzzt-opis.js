/* ══════════════ опись: вещь не двоится и не пропадает (M357) ══════════════
   ОПИСЬ (M341) — одно полотно с четырьмя зонами, и вещь по нему ездит: снял с
   корпуса, положил в кучу, поставил обратно, отдал в ящик, выбросил за борт.
   Ровно в таких перекладываниях и живут две самые дорогие ошибки инвентаря:
   вещь ДВОИТСЯ (осталась в списке и встала в слот) или ПРОПАДАЕТ (ушла из
   слота, но в опись не вернулась). Ни одного набора про это нет: экраны
   проверяются на отрисовку и на тычки, а сохранность вещей — ничем.

   Закон один и проверяется перебором: сколько бы раз вещь ни ездила туда-сюда,
   её ровно одна, и она либо в описи, либо в слоте, либо честно израсходована.
   Отдельно — «за борт»: выбросить можно только то, что есть, и ровно столько,
   сколько сказано, а людей за борт не выбрасывают вовсе. */

/* перепись всего, что можно потерять: части по id и общий вес трюма */
function opCensus(){
  const ids=(G.inv||[]).map(p=>p.id).sort();
  const fit=[];
  for(const s in (G.fit||{})){const f=G.fit[s];for(const k in f)fit.push(f[k]);}
  let cargo=0;for(const k of RES_KEYS)cargo+=G.cargo[k]|0;
  return {ids,fit:fit.sort(),cargo,n:ids.length};
}

TEST_SUITES.push(() => suite("опись: часть ездит в слот и обратно, оставаясь одной", () => {
  resetWorld();
  G.credits=50000;
  /* четыре части разных родов, через addPart — он раздаёт id */
  for(let i=0;i<6;i++){const q=genPart(hashi(4242,i*7717,0x0B1),3);if(q)addPart(q);}
  ok(G.inv.length>=4,"частей в описи: "+G.inv.length);
  const slots=slotsOf(G.shipId);
  const bad=[];
  const before=opCensus();
  /* каждую часть — в свой слот и обратно, десять кругов */
  for(let round=0;round<10;round++){
    for(const p of (G.inv||[]).slice()){
      const t=opisTarget(p);
      if(t<0)continue;
      if(slots[t]!==p.kind)continue;
      const okFit=opisFit(p,t);
      if(okFit){
        if(!isFitted(p.id))bad.push("часть встала в слот, но не считается надетой: "+p.id);
        /* дубля быть не должно: в описи она по-прежнему ровно одна */
        if((G.inv||[]).filter(q=>q.id===p.id).length!==1)bad.push("часть раздвоилась в описи: "+p.id);
        opisUnfit(t);
        if(isFitted(p.id))bad.push("часть снята, а слот её держит: "+p.id);
      }
      if(bad.length>3)break;
    }
    if(bad.length>3)break;
  }
  const after=opCensus();
  eq(after.ids.join(","),before.ids.join(","),"после десяти кругов состав описи тот же");
  eq(after.cargo,before.cargo,"и трюм не изменился");
  eq(bad.slice(0,3).join(" ;; "),"","часть не двоится и не теряется при перекладывании");
  resetWorld();
}));

TEST_SUITES.push(() => suite("опись: разобранная часть уходит один раз и платит один раз", () => {
  resetWorld();
  G.credits=1000;
  for(let i=0;i<3;i++){const q=genPart(hashi(99,i*7717,0x0C1),2);if(q)addPart(q);}
  const p=G.inv[0];
  ok(!!p,"часть для разбора есть");
  if(!p)return;
  /* ставим в слот: разбор обязан сперва снять её оттуда */
  const t=opisTarget(p);
  if(t>=0)opisFit(p,t);
  const wasFit=isFitted(p.id);
  const n0=G.inv.length,c0=G.credits;
  let cargo0=0;for(const k of RES_KEYS)cargo0+=G.cargo[k]|0;
  opisScrap(p);
  /* тир 2 разбирается сразу, без подтверждения; тир ≥3 просит второго нажатия */
  const gone=(G.inv||[]).every(q=>q.id!==p.id);
  ok(gone,"часть ушла из описи");
  ok(!isFitted(p.id),"и из слота тоже"+(wasFit?" (была надета)":""));
  eq(G.inv.length,n0-1,"ушла ровно одна часть");
  let cargo1=0;for(const k of RES_KEYS)cargo1+=G.cargo[k]|0;
  ok(cargo1>=cargo0,"материал за неё пришёл в трюм: "+cargo0+" → "+cargo1);
  /* повтор по той же вещи ничего не даёт: её уже нет */
  const n1=G.inv.length,c1=G.credits;
  let threw="";
  try{ opisScrap(p); }catch(e){ threw=e.message; }
  eq(threw,"","повторный разбор не бросает");
  eq(G.inv.length,n1,"и не снимает вторую часть");
  eq(G.credits,c1,"и не платит второй раз");
  void c0;
  resetWorld();
}));

TEST_SUITES.push(() => suite("опись: за борт уходит ровно то и столько, сколько сказано", () => {
  resetWorld();
  const k=RES_KEYS.find(x=>opisCanDump(x));
  ok(!!k,"есть что выбрасывать: "+k);
  if(!k)return;
  G.cargo[k]=20;
  const bad=[];
  /* обычный случай */
  opisDump(k,7);
  if((G.cargo[k]|0)!==13)bad.push("выброшено не семь: осталось "+G.cargo[k]);
  /* больше, чем есть, — уходит только то, что есть, и в минус не уводит */
  opisDump(k,999);
  if((G.cargo[k]|0)!==0)bad.push("после «выбросить всё» осталось "+G.cargo[k]);
  /* ноль и минус ничего не делают */
  G.cargo[k]=5;
  opisDump(k,0);opisDump(k,-3);
  if((G.cargo[k]|0)!==5)bad.push("ноль и минус тронули кучу: "+G.cargo[k]);
  /* людей за борт не выбрасывают (правило игры) */
  const pax=RES_KEYS.find(x=>RES[x]&&(RES[x].pax||x==="folk"));
  if(pax){
    G.cargo[pax]=4;G.msg="";
    /* путь игрока — тычок по куче: он открывает вопрос «сколько». Отказ живёт
       там, а `opisDump` — уже исполнитель, и его молчание игроку не видно. */
    opisAsk(pax);
    if(!String(G.msg||"").trim())bad.push("на тычок по людям экран промолчал");
    if(OPIS.ask)bad.push("и всё-таки спросил, сколько человек выбросить");
    const did=opisDump(pax,4);
    if(did||((G.cargo[pax]|0)!==4))bad.push("людей выбросили за борт: осталось "+G.cargo[pax]);
  }
  eq(bad.slice(0,3).join(" ;; "),"","за борт уходит ровно сказанное, и только то, что можно");
  resetWorld();
}));
