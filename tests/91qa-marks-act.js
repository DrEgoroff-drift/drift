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
  /* места действуют только в новом кадре (plnActOn смотрит PLN.on) — включаем на время свиты */
  const pOn=PLN.on,pBad=PLN.bad;PLN.on=true;PLN.bad=0;
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
  PLN.on=pOn;PLN.bad=pBad;
}));

/* ══════════════ тихая пятёрка и правила движка (M627b, проход 2) ══════════════
   Каждое место каждого вида достижимо из st 0 — обход переходов с подготовкой мира (груз для алтаря,
   слова монолита выучены, бак пуст) и сменой суток как шагом; развилки — одно из двух; каждый акт
   меняет тело (свет или часть); подарки дня — раз в сутки; кредитов нет; старый осмотр 20b в 2D
   идёт, в новом кадре — нет; залежь у остова берёт верх над памятником; ярлык навигатора прячется
   в охвате мест; риг работает стойкой бура, пока идёт удержание. */
const MA_FIVE=["temple","monolith","obelisk","portal","observ"];
function maPrep(q){
  for(const k of RES_KEYS)G.cargo[k]=0;
  G.cargo.iron=6;G.fuel=0;
  if(q.k==="monolith")for(const w of plnMonoWords(q.seed)){const R=LORE.find(x=>x.word===w);if(R&&!loreHas(R.id))loreList().push(R.id);}
}
/* обход: состояние — путь актов от st 0 («+day» — следующие сутки); живые места и сделанные акты,
   и развилки, где обе стороны доступны разом */
function maExplore(k,seed,depthMax){
  const q=MA_Q(seed,k),K=PLN_ACT.kinds[k],live=new Set(),acted=new Set(),forks=[],t0=G.t;
  const ctx={d:.3,night:false};
  const replay=path=>{delete G.poiSeen[q.seed];G.t=t0;maPrep(q);
    for(const a of path){if(a==="+day")G.t+=CEL_DAY;else plnActDo(q,a,ctx);}};
  const step=(path,depth)=>{
    replay(path);
    const m=plnActMemo(q,true),D=plnActDims(q),cand=[];
    for(const s of K.spots)if(plnActLive(K,s,m,D)){live.add(s.id);if(plnActVerb(s,m,D))cand.push(s);}
    for(const a of cand)for(const b of cand)if(a!==b&&a.fork&&a.fork===b.fork)forks.push({path,a:a.id,b:b.id});
    if(depth>=depthMax)return;
    for(const s of cand){replay(path);const R=plnActDo(q,s.id,ctx);
      if(R&&!R.keep){acted.add(s.id);step(path.concat([s.id]),depth+1);}}
    if(path[path.length-1]!=="+day")step(path.concat(["+day"]),depth+1);
  };
  step([],0);
  G.t=t0;
  return {q,K,live,acted,forks,replay,ctx};
}
TEST_SUITES.push(()=>suite("ориентиры: тихая пятёрка — места, развилки, подарки дня",()=>{
  resetWorld();
  const pOn=PLN.on,pBad=PLN.bad;PLN.on=true;PLN.bad=0;PLN_ACT.pinAge=null;
  const cr=G.credits;
  for(const k of MA_FIVE){
    const X=maExplore(k,hashi(k.length,0x5EED,7),4),ids=X.K.spots.map(s=>s.id);
    for(const id of ids)ok(X.live.has(id),k+": место «"+id+"» достижимо из st 0");
    for(const s of X.K.spots)if(s.verb!=null)ok(X.acted.has(s.id),k+": акт «"+s.id+"» сделан хоть раз");
    /* развилка: сделал одну сторону — другая не делается */
    const seen={};
    for(const f of X.forks){const key=f.a+">"+f.b;if(seen[key])continue;seen[key]=1;
      X.replay(f.path);
      const R=plnActDo(X.q,f.a,X.ctx);
      ok(R&&!R.keep,k+": сторона «"+f.a+"» развилки берётся");
      eq(plnActDo(X.q,f.b,X.ctx),null,k+": после «"+f.a+"» сторона «"+f.b+"» не берётся");}
    ok(Object.keys(seen).length>=2,k+": развилка проверена с обеих сторон ("+Object.keys(seen).join(", ")+")");
    /* каждый акт виден в теле: свет или часть через секунду после него другие, чем до */
    const body=m=>JSON.stringify((({light,lampK,parts})=>({light,lampK,parts}))(X.K.drive(m,1,plnActDims(X.q),0,.5)));
    for(const id of X.acted){
      let path=null;
      const find=(p,d)=>{if(path||d>4)return;X.replay(p);const m=plnActMemo(X.q,true),D=plnActDims(X.q),s=X.K.spots.find(z=>z.id===id);
        if(plnActLive(X.K,s,m,D)&&plnActVerb(s,m,D)){path=p;return;}
        for(const z of X.K.spots){X.replay(p);const mm=plnActMemo(X.q,true);if(plnActLive(X.K,z,mm,D)&&plnActVerb(z,mm,D))find(p.concat([z.id]),d+1);}
        if(!path&&p[p.length-1]!=="+day")find(p.concat(["+day"]),d+1);};
      find([],0);
      ok(path,k+": путь до акта «"+id+"» найден");
      if(!path)continue;
      X.replay(path);
      const m=plnActMemo(X.q,true),before=body(JSON.parse(JSON.stringify(m)));
      ok(plnActDo(X.q,id,X.ctx),k+": акт «"+id+"» по найденному пути");
      ok(body(plnActMemo(X.q,true))!==before,k+": акт «"+id+"» меняет тело (свет или часть)");
    }
    const m=plnActMemo(X.q,true);
    eq(typeof m.got,"string",k+": got — строка");
  }

  /* ── храм: дар принят — убежище наполняет скафандр, пока стоишь у алтаря ── */
  const qt=MA_Q(0x7E3,"temple");maPrep(qt);G.relicHint=null;
  ok(plnActDo(qt,"plates",{d:.3}),"храм: плиты прочитаны");
  const giftK=plnTempleGift();
  ok(giftK,"храм: в трюме есть что положить");
  const n0=G.cargo[giftK];
  ok(plnActDo(qt,"gift",{d:.3}),"храм: дар принят");
  eq(G.cargo[giftK],n0-3,"храм: дар — ровно три единицы");
  const mt=plnActMemo(qt,false);
  /* проход 3: дар — полоса под крышей вдвое ярче нетронутой, от алтаря идут 6–10 мотыльков */
  {const dims=plnActDims(qt),dT=PLN_ACT.kinds.temple.drive(mt,99,dims,3,.5),d0=PLN_ACT.kinds.temple.drive({st:0,way:null,n:{}},99,dims,3,.5);
    ok(dT.light>=2*d0.light-1e-6,"храм: дар — полоса вдвое ярче нетронутой ("+dT.light.toFixed(2)+" против "+d0.light.toFixed(2)+")");
    const mk=Object.keys(dT.parts).filter(k=>/^moth/.test(k)),on=mk.filter(k=>!dT.parts[k].hide&&dT.parts[k].k>.01);
    ok(on.length>=6&&on.length<=10,"храм: мотыльков дара 6–10, видно "+on.length);
    ok(mk.every(k=>d0.parts[k].hide),"храм: без дара мотыльков нет");
    const t2=PLN_ACT.kinds.temple.drive(mt,99,dims,3.5,.5);
    ok(mk.every(k=>Math.abs(t2.parts[k].go-dT.parts[k].go)<.05),"храм: мотыльки идут медленно — за полсекунды меньше двадцатой пути");}
  eq(mt.way,"gift","храм: путь — дар");
  const ref=PLN_ACT.kinds.temple.spots.find(s=>s.id==="refuge"),Sx={suit:10};
  ok(plnActLive(PLN_ACT.kinds.temple,ref,mt,plnActDims(qt)),"храм: убежище живо после дара");
  ref.stand(Sx,60);
  eq(Sx.suit,30,"храм: секунда у алтаря — +20 скафандра");
  ref.stand(Sx,6000);
  eq(Sx.suit,suitMax(),"храм: скафандр полнится до предела, не выше");
  const qt2=MA_Q(0x7E4,"temple");maPrep(qt2);
  const rs=plnActDo(qt2,"sample",{d:.3});
  ok(rs&&/надписи стёрты/.test(rs.msg),"храм: образец до чтения — надписи потеряны: "+(rs&&rs.msg));
  eq(PLN_ACT.kinds.temple.drive(plnActMemo(qt2,false),9,plnActDims(qt2),0,.5).light,0,"храм: после образца свет умер");
  eq(PLN_ACT.kinds.temple.drive(plnActMemo(qt2,false),9,plnActDims(qt2),0,.5).lampK,0,"храм: после образца лампа погашена");

  /* ── монолит: подсказка считает недостающие слова; оба знакомых — глагол «СКАЗАТЬ» первым ── */
  G.loreFound=[];
  const qm=MA_Q(0x3011,"monolith");
  ok(plnActDo(qm,"touch",{d:.3}),"монолит: касание");
  const mm=plnActMemo(qm,false),Wm=mm.n.w;
  eq(Wm&&Wm.length,2,"монолит: два слова на лице");
  ok(Wm[0]!==Wm[1],"монолит: слова разные");
  const Sm={x:qm.x,y:0,on:true,walkAmp:0,tr:{poi:[qm]}};
  let pr=plnActPrompt(qm,mm,plnActReach(qm,Sm,mm),0);
  ok(pr.indexOf("НЕ ХВАТАЕТ СЛОВ: 2")>=0,"монолит: без слов — не хватает двух: "+pr.split("\n")[0]);
  eq(plnActDo(qm,"say",{d:.3}),null,"монолит: без слов сказать нечего");
  loreList().push(LORE.find(x=>x.word===Wm[0]).id);
  pr=plnActPrompt(qm,mm,plnActReach(qm,Sm,mm),0);
  ok(pr.indexOf("НЕ ХВАТАЕТ СЛОВ: 1")>=0,"монолит: одно слово — не хватает одного: "+pr.split("\n")[0]);
  ok(pr.indexOf(Wm[0].toUpperCase())>=0,"монолит: знакомое слово написано словом");
  loreList().push(LORE.find(x=>x.word===Wm[1]).id);
  pr=plnActPrompt(qm,mm,plnActReach(qm,Sm,mm),1);
  const mv=/(?:УДЕРЖИВАЙТЕ\s+)?ДЕЙСТВИЕ\s*—\s*([^·\n]+)/.exec(pr);
  eq(mv&&mv[1].trim(),"СКАЗАТЬ: "+Wm.join(" ").toUpperCase(),"монолит: кнопка телефона читает «сказать» с обоими словами");
  ok(pr.indexOf("ИЛИ КРОМКА")>=0,"монолит: развилка видна — образец с кромки: "+pr.split("\n")[1]);
  /* проход 3: услышанные слова светятся по борозде, неуслышанные — только борозда */
  {const dg=PLN_ACT.kinds.monolith.drive(plnActMemo(qm,false),9,plnActDims(qm),0,.5).parts;
    ok(!dg.g1L.hide&&!dg.g2L.hide&&dg.g1L.k>0&&dg.g2L.k>0,"монолит: оба слова знакомы — обе борозды светятся");
    ok(!dg.g1.hide&&!dg.g2.hide,"монолит: после касания борозды видны");
    const dn=PLN_ACT.kinds.monolith.drive({st:1,way:null,n:{w:["__нет","__нет2"]}},9,plnActDims(qm),0,.5).parts;
    ok(dn.g1L.hide&&dn.g2L.hide&&!dn.g1.hide,"монолит: незнакомые слова — борозда без света");}

  /* ── зарубка: у засечки после чтения подсказка зовёт к клину вверх ── */
  const qo=MA_Q(0x0BE1,"obelisk");
  ok(plnActDo(qo,"read",{d:.3}),"зарубка: прочитана");
  const mo=plnActMemo(qo,false),So={x:qo.x,y:0,on:true,walkAmp:0,tr:{poi:[qo]}};
  const qoBig=Object.assign({},qo,{h:900,sc:2});
  ok(plnActDims(qoBig).wedge<=9.5,"зарубка: клин и на большой зарубке — на высоте ранца ("+plnActDims(qoBig).wedge.toFixed(1)+" м)");
  pr=plnActPrompt(qo,mo,plnActReach(qo,So,mo),0);
  ok(pr.indexOf("СНЯТЬ КЛИН ▲")>=0,"зарубка: клин — стрелкой вверх и ранцем: "+pr.replace("\n"," / "));
  eq(pr.split("\n").length,2,"зарубка: две строки");
  ok(plnActDo(qo,"carve",{d:.3}),"зарубка: своя засечка");
  ok(plnActNotches()>=1,"зарубка: засечка сосчитана по памяти памятников");
  eq(G.notches,undefined,"зарубка: своего поля в мире нет — сейв не растёт");

  /* ── врата: слить — 40 % бака; оставить — 20 % и заряд дня раз в сутки ── */
  const fm=stat().fuelMax,qp=MA_Q(0x90A,"portal");
  G.fuel=0;
  ok(plnActDo(qp,"wake",{d:.3}),"врата: пробуждены");
  eq(plnActDo(qp,"wake",{d:.3}),null,"врата: открытые второй раз не будятся");
  const drn=PLN_ACT.kinds.portal.spots.find(s=>s.id==="drain");
  G.fuel=fm;
  eq(plnActVerb(drn,plnActMemo(qp,false),plnActDims(qp)),null,"врата: полный бак — слить не зовёт");
  {const mp=plnActMemo(qp,false),Sd={x:qp.x+plnActSpotDx("portal","drain",plnMarkH(qp))*PLN_M,y:0,on:true,walkAmp:0,tr:{poi:[qp]}};
    const R=plnActReach(qp,Sd,mp);
    eq(R.at&&R.at.s.id,"drain","врата: человек у слива");
    const pd=plnActPrompt(qp,mp,R,0).split("\n");
    ok(/БАКИ ПОЛНЫ/.test(pd[0]),"врата: слив молчит и говорит почему: "+pd[0]);
    ok(/^ИЛИ ОСТАВИТЬ ОТКРЫТЫМИ ▶/.test(pd[1]||""),"врата: молчащий слив зовёт ко второй стороне развилки: "+pd[1]);}
  G.fuel=0;
  ok(plnActDo(qp,"drain",{d:.3}),"врата: заряд слит");
  eq(G.fuel,Math.round(fm*.4),"врата: слито 40 % бака");
  const qp2=MA_Q(0x90B,"portal");G.fuel=0;
  plnActDo(qp2,"wake",{d:.3});
  G.t+=41*60;
  eq(plnActDo(qp2,"keep",{d:.3}),null,"врата: через 40 с зеркало закрыто — развилки нет");
  ok(plnActDo(qp2,"wake",{d:.3}),"врата: будятся снова");
  const marks0=loreMarks().length;
  ok(plnActDo(qp2,"keep",{d:.3}),"врата: оставлены открытыми");
  eq(G.fuel,Math.round(fm*.2),"врата: сейчас — 20 % бака");
  ok(loreMarks().length>=marks0,"врата: адрес близнеца не теряет метки");
  eq(plnActDo(qp2,"day",{d:.3}),null,"врата: заряд дня в день открытия уже взят");
  G.t+=CEL_DAY;G.fuel=0;
  ok(plnActDo(qp2,"day",{d:.3}),"врата: назавтра — заряд дня");
  eq(G.fuel,Math.round(fm*.2),"врата: заряд дня — 20 % бака");
  {const dk=PLN_ACT.kinds.portal.drive(plnActMemo(qp2,false),99,plnActDims(qp2),0,.5).parts.mirror;
    ok(!dk.hide&&dk.k>.05,"врата: оставленные открытыми держат зеркало и через сутки (k "+dk.k.toFixed(2)+")");}
  eq(plnActDo(qp2,"day",{d:.3}),null,"врата: второй раз за сутки — нет");

  /* ── обсерватория: одна батарея на сутки; ночью — небо и затмение ── */
  const qb=MA_Q(0x0B5E,"observ"),d0=G.data;
  const rn=plnActDo(qb,"dome",{d:.3,night:true});
  ok(rn&&/в пустоте/.test(rn.msg)&&/затмени/.test(rn.msg),"обсерватория ночью: пустота и затмение: "+(rn&&rn.msg));
  ok(G.data>=d0+12,"обсерватория ночью: +12 данных");
  eq(plnActDo(qb,"dish",{d:.3}),null,"обсерватория: батарея съедена куполом — антенна завтра");
  G.t+=CEL_DAY;
  ok(plnActDo(qb,"dish",{d:.3}),"обсерватория: назавтра антенна");
  eq(plnActMemo(qb,false).st,2,"обсерватория: оба — st 2");
  eq(plnActMemo(qb,false).way,"both","обсерватория: путь — оба");
  eq(plnActDo(qb,"dome",{d:.3}),null,"обсерватория: второй акт за сутки — нет");
  /* проход 3: открытая створка уходит вбок дальше своей ширины и к объективу — против поворота купола */
  {const mb=plnActMemo(qb,false),P=PLN_ACT.kinds.observ.drive(Object.assign({},mb,{n:Object.assign({},mb.n,{dome:celDay(),last:"dome"})}),99,plnActDims(qb),0,.8).parts;
    const dd=P.shutter.yaw-P.dome.yaw;
    ok(Math.abs(dd)>=1&&Math.sign(dd)===-Math.sign(P.dome.yaw||1),"обсерватория: створка сдвинута набок к объективу ("+dd.toFixed(2)+")");
    ok(!P.slit.hide&&P.slit.k>1,"обсерватория ночью: нутро щели светит");}

  /* проход 3 — тела по мерилу человека (таз 0,87 м): глифы монолита у груди, друг над другом, каждый
     не уже шестой доли плиты; столешница алтаря на поясе; у обсерватории окно у земли и лампа перед ним */
  {const body=(k,H)=>plnMarkMesh(k,H,0x51A7,()=>0,PLN_PAL,[.4,.9,.8],H*PLN_MARK.kinds[k].w,0,{yaw:0,z:PLN_MARK.kinds[k].z});
    const box=(B,id)=>{const p=B.parts.find(x=>x.id===id),v=p.m.v;let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
      for(let i=0;i<p.m.nv;i++){const o=i*PLN_VS;x0=Math.min(x0,v[o]);x1=Math.max(x1,v[o]);y0=Math.min(y0,v[o+1]);y1=Math.max(y1,v[o+1]);}
      return {w:x1-x0,y0:y0+p.pv[1],y1:y1+p.pv[1],x:p.pv[0]};};
    const Hm=12,Bm=body("monolith",Hm),g1=box(Bm,"g1"),g2=box(Bm,"g2"),pw=2*Hm*.17;
    ok(g1.w>=pw/6&&g2.w>=pw/6,"монолит: глиф не уже шестой доли плиты ("+g1.w.toFixed(2)+" / "+pw.toFixed(2)+")");
    ok(g1.y1<1.45&&g2.y0>1.2&&g2.y0>=g1.y1-.1,"монолит: глифы друг над другом вокруг груди ("+g1.y0.toFixed(2)+"–"+g1.y1.toFixed(2)+", "+g2.y0.toFixed(2)+"–"+g2.y1.toFixed(2)+")");
    ok(Math.abs(g1.x-g2.x)<.01,"монолит: глифы на одной вертикали");
    const Bt=body("temple",9),pl=Bt.parts.find(x=>x.id==="plates");
    ok(pl.pv[1]>=.95&&pl.pv[1]<=1.2,"храм: столешница алтаря на поясе ("+pl.pv[1].toFixed(2)+" м)");
    const Bo=body("observ",14);
    ok(Bo.lamp&&Bo.lamp.p[1]<2.5&&Bo.lamp.p[2]<-14*.3,"обсерватория: лампа окна низко перед башней");
    ok(Bo.light&&Bo.light.nv>0,"обсерватория: у тела есть ночной свет (окно, красная лампа)");}

  eq(G.credits,cr,"тихая пятёрка: ни один акт не дал кредитов");
  PLN.on=pOn;PLN.bad=pBad;
}));

TEST_SUITES.push(()=>suite("ориентиры: 2D, залежь, ярлык, риг",()=>{
  resetWorld();
  const pOn=PLN.on,pBad=PLN.bad;
  /* ── 2D: нетронутая память — не память, старый осмотр 20b идёт ── */
  PLN.on=true;PLN.bad=0;
  const q2=MA_Q(0x2D2D,"temple");
  plnActMemo(q2,true);
  PLN.on=false;
  eq(plnActOn(),false,"движок мест выключен вместе с новым кадром");
  eq(poiMemo(q2.seed),null,"2D: нетронутая память не закрывает осмотр");
  eq(poiInspect(q2),true,"2D: старый осмотр 20b срабатывает");
  ok(poiMemo(q2.seed),"2D: после осмотра память есть");
  eq(poiInspect(q2),false,"2D: второй раз осмотр не идёт");
  PLN.on=true;
  const m2=plnActMemo(q2,true);
  eq(m2.st,0,"осмотренный в 2D в новом кадре — st 0");
  eq(m2.n.paid,1,"осмотренный в 2D второй раз базу не платит");
  const q3=MA_Q(0x3D3D,"temple");
  plnActMemo(q3,true);
  ok(poiMemo(q3.seed),"новый кадр: память закрывает старый осмотр");
  eq(poiInspect(q3),false,"новый кадр: старый осмотр не срабатывает");
  PLN.on=false;
  const q4=MA_Q(0x4D4D,"temple");PLN.on=true;plnActMemo(q4,true).n.read=1;PLN.on=false;
  ok(poiMemo(q4.seed),"2D: тронутая память закрывает осмотр");
  PLN.bad=3;PLN.on=true;
  eq(plnActOn(),false,"сломанный новый кадр (bad 3) — тоже 2D");
  PLN.bad=0;

  /* ── залежь в четырёх метрах от кормы остова — бурится, а не зовёт памятник ── */
  const qw=MA_Q(0xDE90),D=plnActDims(qw),tailX=qw.x-D.L*.5*PLN_M,dx=tailX+4*PLN_M,tr={poi:[qw]};
  const S={x:dx,y:0,on:true,walkAmp:0,tr,deposits:[{x:dx,left:5}],plants:[],fauna:[]};
  ok(Math.abs(dx-qw.x)<plnActSpan(qw)*PLN_M,"залежь — в охвате мест остова");
  eq(poiNear(S,tr),null,"у залежи памятник не зовёт: ветка бурения поверхности");
  S.deposits[0].left=0;
  eq(poiNear(S,tr),qw,"выработанная залежь — памятник снова рядом");
  S.deposits[0]={x:dx+30,left:5};
  eq(poiNear(S,tr),qw,"залежь дальше охвата бура — памятник рядом");
  S.deposits=[];
  /* растение без места под рукой — сканер первым; у места под рукой — памятник */
  const Sp={x:qw.x+4*PLN_M,y:0,on:true,walkAmp:0,tr,deposits:[],fauna:[],plants:[{x:qw.x+4*PLN_M,scanned:false}]};
  ok(!plnActReach(qw,Sp,plnActMemo(qw,true)).at,"в четырёх метрах от середины места под рукой нет");
  eq(poiNear(Sp,tr),null,"растение у остова без места под рукой — сканер первым");
  const hx=qw.x+plnActSpotDx("wreck","hatch",plnMarkH(qw))*PLN_M;
  const Sh={x:hx,y:0,on:true,walkAmp:0,tr,deposits:[],fauna:[],plants:[{x:hx,scanned:false}]};
  eq(poiNear(Sh,tr),qw,"у люка — люк, хоть растение рядом");

  /* ── ярлык навигатора прячется в охвате мест, дальше — на месте ── */
  eq(nearestPOI(tr,qw.x+5*PLN_M),null,"в охвате мест ярлыка нет: имя уже в подсказке");
  eq(nearestPOI(tr,qw.x+(plnActSpan(qw)+5)*PLN_M),qw,"за охватом ярлык ведёт к остову");
  PLN.on=false;
  eq(nearestPOI(tr,qw.x+5*PLN_M),qw,"в 2D ярлык как был");
  PLN.on=true;

  /* ── риг: удержание — стойка бура, S.mining не трогается; слово — без бура ── */
  const Sr={walkPhase:0,walkAmp:0,on:true};
  PLN_ACT.hold={id:"hatch",k:.5,tool:true};
  eq(plnManState(Sr,0,0).drill,true,"удержание у места — стойка бура");
  eq(Sr.mining,undefined,"S.mining не тронут");
  PLN_ACT.hold={id:"say",k:.5,tool:false};
  eq(plnManState(Sr,0,0).drill,false,"слово монолиту — без бура");
  PLN_ACT.hold=null;
  eq(plnManState(Sr,0,0).drill,false,"отпустил — стойки нет");
  plnActInput();
  eq(PLN_ACT.hold,null,"новый кадр ввода сбрасывает удержание");
  PLN.on=pOn;PLN.bad=pBad;
}));
