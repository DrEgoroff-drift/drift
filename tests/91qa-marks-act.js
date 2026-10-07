/* ══════════════ ориентиры как места действия (M627b) ══════════════ */
/* Машина остова корабля через чистый переход plnActDo: люк, развилка отсеков (одно из двух),
   самописец один раз, маяк туда-обратно и переживает сохранение; кредитов нет нигде; память
   после каждого шага — та же форма, и got — строка; старая единица поднимается до st:0 и
   второй раз не платит; первый акт платит то, что платил осмотр 20b, и только раз. */
const MA_Q=(seed,k)=>({k:k||"wreck",ru:"ОСТОВ КОРАБЛЯ",x:6000,y:0,h:150,sc:1,seed:seed>>>0});
function maLive(q){
  const K=PLN_ACT.kinds[q.k],m=plnActMemo(q,true),D=plnActDims(q);
  return K.spots.filter(s=>plnActLive(K,s,m,D)&&plnActVerb(s,m,D)).map(s=>s.id).sort().join(",");
}
function maShape(m,what){
  ok(m&&typeof m==="object","память — объект: "+what);
  eq(typeof m.got,"string","got — строка: "+what);
  ok(m.got.length>0,"got не пуст: "+what);
  ok(typeof m.st==="number","st — число: "+what);
  ok(m.n&&typeof m.n==="object","n — объект: "+what);
  for(const f of ["k","t","way","t0","day","dep"])ok(f in m,"поле "+f+": "+what);
}
TEST_SUITES.push(()=>suite("ориентиры: остов корабля как место действия",()=>{
  resetWorld();
  const ctx={d:.3,p:{res:TRADE_KEYS.slice(0,3)}};
  const cr=G.credits;
  /* ── память заводится на подходе, и старый осмотр больше не срабатывает ── */
  const q=MA_Q(0xA11CE);
  const m=plnActMemo(q,true);
  maShape(m,"нетронутый");
  eq(m.st,0,"нетронутый — st 0");
  eq(m.got,"не вскрыт","got нетронутого");
  eq(poiInspect(q),false,"старый осмотр 20b не срабатывает поверх памяти");
  eq(maLive(q),"beacon,hatch,log","до люка: люк, рубка, маяк — отсеков нет");
  eq(plnActDo(q,"part",ctx),null,"двигательный отсек до люка не режется");
  eq(plnActDo(q,"cargo",ctx),null,"грузовой отсек до люка не вскрывается");

  /* ── люк: первый акт платит базу 20b, и только раз ── */
  const base=8+Math.floor(ctx.d*10),d0=G.data;
  const r1=plnActDo(q,"hatch",ctx);
  ok(r1,"люк вскрыт");
  eq(r1.paid,base,"первый акт платит базу осмотра: "+base);
  ok(G.data>=d0+base,"данные выросли на базу: "+d0+" → "+G.data);
  eq(m.st,1,"после люка — st 1");
  eq(m.got,"люк вскрыт","got после люка");
  eq(m.n.paid,1,"оплата помечена");
  maShape(m,"люк");
  eq(maLive(q),"beacon,cargo,log,part","после люка: оба отсека, рубка, маяк");
  eq(plnActDo(q,"hatch",ctx),null,"люк дважды не вскрывается");

  /* ── развилка: двигательный — часть, грузового больше нет ── */
  const inv=G.inv.length,d1=G.data;
  const r2=plnActDo(q,"part",ctx);
  ok(r2,"двигательный отсек срезан");
  eq(r2.paid,0,"второй акт не платит базу");
  eq(G.data,d1,"данные после второго акта не растут");
  eq(G.inv.length,inv+1,"в инвентаре новая часть");
  eq(m.st,2,"st 2");eq(m.way,"part","way part");
  eq(m.got,"снята часть, груз сгорел","got после части");
  maShape(m,"часть");
  eq(maLive(q),"beacon,log","после части грузового места нет");
  eq(plnActDo(q,"cargo",ctx),null,"грузовой после части не вскрывается");

  /* ── самописец — один раз ── */
  const r3=plnActDo(q,"log",ctx);
  ok(r3&&r3.msg.length>0,"самописец сказал: "+(r3&&r3.msg));
  eq(m.n.log,1,"запись снята помечена");
  eq(plnActDo(q,"log",ctx),null,"второй раз запись не снимается");
  maShape(m,"самописец");

  /* ── маяк: туда и обратно, и переживает сохранение ── */
  ok(plnActDo(q,"beacon",ctx),"маяк выключен");
  eq(m.n.beacon,0,"маяк погашен в памяти");
  const snap=JSON.parse(JSON.stringify(snapshot()));
  G.poiSeen={};applySave(snap);
  const m2=plnActMemo(q,false);
  ok(m2,"память остова пережила сохранение");
  eq(m2&&m2.n.beacon,0,"погашенный маяк помнится после загрузки");
  eq(m2&&m2.way,"part","развилка помнится после загрузки");
  ok(plnActDo(q,"beacon",ctx),"маяк включён снова");
  eq(plnActMemo(q,false).n.beacon,1,"маяк горит снова");
  eq(plnActMemo(q,false).st,2,"переключение маяка не трогает состояние");

  /* ── развилка наоборот: грузовой — ящики, корма уходит, двигательного нет ── */
  const qb=MA_Q(0xB0B);
  plnActDo(qb,"hatch",ctx);
  for(const k of RES_KEYS)G.cargo[k]=0;
  const inv2=G.inv.length;
  const r4=plnActDo(qb,"cargo",ctx);
  ok(r4,"грузовой отсек вскрыт");
  const mb=plnActMemo(qb,false);
  eq(mb.way,"cargo","way cargo");eq(mb.st,2,"st 2");
  eq(mb.got,"взят груз, отсек ушёл","got после груза");
  eq(G.cargo.techcomp,2,"техкомпоненты ×2");
  let goods=0;for(const k of TRADE_KEYS)goods+=G.cargo[k]|0;
  ok(goods>=6,"два товара мира, по три и больше: "+goods);
  eq(G.inv.length,inv2,"части из грузового нет");
  eq(maLive(qb),"beacon,log","после груза двигательного места нет");
  eq(plnActDo(qb,"part",ctx),null,"двигательный после груза не режется");
  maShape(mb,"груз");

  /* ── полный трюм: ящики остаются, развилка не тратится ── */
  const qc=MA_Q(0xC0C);
  plnActDo(qc,"hatch",ctx);
  G.cargo[TRADE_KEYS[0]]=stat().cargoMax*4;
  const r5=plnActDo(qc,"cargo",ctx);
  ok(r5&&r5.keep,"с полным трюмом отсек не вскрыт");
  eq(plnActMemo(qc,false).st,1,"st не сдвинулся");
  G.cargo[TRADE_KEYS[0]]=0;

  /* ── старое сохранение: единица и {k,got,t} поднимаются и второй раз не платят ── */
  const qo=MA_Q(0x01D);
  G.poiSeen[qo.seed]=1;
  const mo=plnActMemo(qo,true);
  maShape(mo,"старая единица");
  eq(mo.st,0,"старая единица — st 0");
  eq(mo.n.paid,1,"старая единица уже заплатила");
  const d2=G.data,r6=plnActDo(qo,"hatch",ctx);
  eq(r6.paid,0,"старый памятник базу второй раз не платит");
  eq(G.data,d2,"данные не выросли");
  const qo2=MA_Q(0x02D);
  G.poiSeen[qo2.seed]={k:"wreck",got:"часть с обломков",t:5};
  const mo2=plnActMemo(qo2,true);
  eq(mo2.st,0,"старая запись 20b — st 0");
  eq(mo2.n.old,"часть с обломков","что дал старый осмотр — сохранено");
  eq(mo2.got,"не вскрыт","got читает состояние");
  G.poiSeen=[];
  ok(plnActMemo(MA_Q(0x03D),true),"память из облака массивом чинится на ходу");
  ok(!Array.isArray(G.poiSeen),"poiSeen — снова объект");

  /* ── кредитов нет нигде ── */
  eq(G.credits,cr,"ни один акт не дал кредитов");

  /* ── броски по (семя, соль, n) и подарок раз в день ── */
  eq(plnActRoll(77,5,3)(),plnActRoll(77,5,3)(),"бросок повторяется по своим числам");
  ok(plnActRoll(77,5,3)()!==plnActRoll(77,5,4)(),"другой n — другой бросок");
  const md={day:null};
  ok(plnActDaily(md),"подарок дня берётся");
  ok(!plnActDaily(md),"второй раз в тот же день — нет");
  G.t+=CEL_DAY;
  ok(plnActDaily(md),"на следующий день — снова");

  /* ── подсказка и охват ── */
  const tr={poi:[q]},D=plnActDims(q);
  const S={x:q.x+D.L*-.44*PLN_M,y:0,on:true,walkAmp:0,tr};
  eq(poiNear(S,tr),q,"мачта маяка — в охвате памятника");
  eq(poiNear({x:q.x+(plnActSpan(q)+1)*PLN_M},tr),null,"за дальним местом памятник не рядом");
  const qn=MA_Q(0xD0D),mn=plnActMemo(qn,true),Sn={x:qn.x-D.L*.2*PLN_M,y:0,on:true,walkAmp:0,tr:{poi:[qn]}};
  const R=plnActReach(qn,Sn,mn);
  eq(R.at&&R.at.s.id,"hatch","у люка под рукой люк");
  const pr=plnActPrompt(qn,mn,R,1.5);
  ok(pr.split("\n").length<=2,"подсказка — не больше двух строк");
  const mm=/(?:УДЕРЖИВАЙТЕ\s+)?ДЕЙСТВИЕ\s*—\s*([^·\n]+)/.exec(pr);
  eq(mm&&mm[1].trim(),"ВСКРЫТЬ ЛЮК","кнопка телефона читает глагол первым");
  ok(pr.indexOf("━━━━╌╌╌╌")>0,"полоса удержания наполовину: "+pr.split("\n")[0]);
  Sn.walkAmp=.6;
  ok(!plnActReach(qn,Sn,mn).at,"на бегу место не под рукой");
}));
