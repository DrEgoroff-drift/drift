/* ══ M114: срок — это выбор, а не проигрыш ══
   Сторож замысла: срок приходит только к посёлку, который игрок поднял; вывоз
   идёт трюмом и рейсами, а не кнопкой; никто не помогает сам; не вывезти —
   разрешённый исход; спасённые начинают заново и хуже, но это те же люди. */
TEST_SUITES.push(()=>suite("срок: вывозят трюмом, а не кнопкой",()=>{
  resetWorld();
  ok(!doomGet(),"в новом мире срока нет");
  /* посёлок первой ступени срока не получает: терять нечего */
  const p=G.sys.planets.find(x=>settleCanLive(x));
  ok(!!p,"в стартовой системе есть живая земля");
  const S=settleMake(p);
  eq(S.stage,1,"посёлок начинается с первой ступени");
  ok(!doomArm(S),"первой ступени срок не назначается");
  /* поднимаем до второй — вот теперь есть что терять */
  S.built=["hut","hut","hut"];S.stage=2;
  const D=doomArm(S);
  ok(!!D,"со второй ступени срок назначен");
  ok(!doomArm(S),"и он один на прохождение");
  ok(D.at>Date.now(),"час назначен в будущем");
  ok(doomStanding()>0,"на земле стоят люди");

  /* узнают о сроке под тем самым небом, а не из меню */
  ok(!D.known,"пока не прилетели — не знают");
  doomLearn();
  ok(D.known,"в своей системе срок назван");

  /* подъём: место в трюме и есть вся механика */
  G.cargo.folk=0;
  for(const k of TRADE_KEYS)G.cargo[k]=0;
  G.cargo.iron=stat().cargoMax;                   // трюм забит рудой
  eq(doomLift(),0,"в полный трюм людей не поднять");
  G.cargo.iron=0;
  const took=doomLift();
  ok(took>0,"с пустым трюмом подняли");
  eq(G.cargo.folk|0,took,"люди заняли место в трюме");
  ok(held()>=took,"и считаются в трюме наравне с рудой");
  ok(TRADE_KEYS.indexOf("folk")<0,"продать людей нельзя: это не товар");
  eq(doomStanding(),D.folk-took,"на земле осталось меньше ровно на поднятых");

  /* высадка: только в другой системе и только на живой земле */
  ok(!doomCanLand(p),"обратно на срок не высаживают");
  G.sx=D.sx+3;G.sy=D.sy+1;G.sys=getSystem(G.sx,G.sy);
  const q=G.sys.planets.find(x=>settleCanLive(x));
  if(q){
    ok(doomCanLand(q),"на чужую живую землю — можно");
    const n=doomLand(q);
    eq(n,took,"высажены все, кто был в трюме");
    eq(G.cargo.folk|0,0,"трюм пуст");
    const N=settleAt(G.sx,G.sy);
    ok(!!N,"на новом месте появился посёлок");
    eq(N.seed,S.seed,"это те же люди: seed сохранён, а значит и словарь");
    ok(N.built.length<S.built.length,"но начинают хуже: половина построек осталась там");
    ok(N.moved===1,"посёлок помечен как перенесённый");
  }

  /* час вышел: старое место пустеет, наказания нет */
  D.at=Date.now()-1;
  doomTick();
  ok(D.over,"срок вышел");
  ok(!settleAt(D.sx,D.sy),"на старом месте больше никого");
  ok(!!G.doomDead[D.key],"система помечена опустевшей");
  const cr=G.credits;
  doomTick();
  eq(G.credits,cr,"второй раз час не срабатывает и ничего не отнимает");

  /* сохранение переносит срок целиком */
  const snap=snapshot();
  applySave(snap);
  ok(!!G.doom&&G.doom.over,"срок пережил перезапись");
  ok(!!G.doomDead[D.key],"и опустевшая система тоже");
}));

/* ── никто не помогает сам ── */
TEST_SUITES.push(()=>suite("срок: помогают только те, кого послали",()=>{
  resetWorld();
  const p=G.sys.planets.find(x=>settleCanLive(x));
  const S=settleMake(p);S.built=["hut","hut","hut"];S.stage=2;
  doomArm(S);
  eq(doomHelp(),0,"без посланных наёмников помощи нет");
  /* наёмник, работающий в ДРУГОМ секторе, не считается */
  const c=Object.assign({},genMerc(31,["haul"]),
    {cargo:{},order:{kind:"haul",sx:G.sx+5,sy:G.sy+5},tMs:Date.now(),paidMs:Date.now()});
  c.shipId="strizh";
  G.crew.push(c);
  eq(doomHelp(),0,"чужой сектор — не помощь");
  c.order={kind:"haul",sx:G.sx,sy:G.sy};
  ok(doomHelp()>0,"посланный в этот сектор берёт часть людей своим бортом");
  c.order={kind:"home",sx:G.sx,sy:G.sy};
  eq(doomHelp(),0,"сидящий дома не считается, даже если дом — этот сектор");
}));
