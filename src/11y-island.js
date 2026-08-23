/* ══════════════ Остров Забвения: пираты как ушедшие ══════════════
   M160. У Ефремова те, кто не хочет общей работы, уходят на Остров Забвения —
   их не бьют, их жалеют. Пиратские базы (M35) и ушедшие управляющие (12g)
   получают второе чтение: пиратский сектор — это МЕСТО, КУДА УШЛИ. Бывший
   наёмник, соперник без дома, сестра тётки Усти.

   ВТОРАЯ ДВЕРЬ. Абордаж остаётся. Но если на столе лежит письмо на Остров,
   подойти к базе БЕЗ ОРУЖИЯ (или не доставая его) — значит сесть с письмом:
   без боя, без добычи. Человек, кому оно, через неделю появляется на табло
   прибытий. Три письма — три имени.

   ПРАВИЛА ФАЙЛА:
   1. Ничего не отнимает у боевого контура: письмо — другой вход, не обход.
   2. Хранится G.island: {letters:{id:{taken,done,day}}}. Тексты — здесь. */
const ISLAND_LETTERS=[
  {id:"i1",who:"бывший наёмник Гриша",from:"командир звена",
   text:"Гриш. Никто тебя не судит. Звено помнит, что ты снял с «Обода» в тот раз. Долг списан. Возвращайся — место есть, оклад тот же. Или не возвращайся, но знай."},
  {id:"i2",who:"Тихий Ефим",from:"Пекарь",
   text:"Ефим. Табуретка твоя стоит. Никто не сел. Совеня говорит — сходится, а я говорю — без тебя не сходится. Прилетай. Дверцу я сдал, мне больше ничего не надо."},
  {id:"i3",who:"сестра тётки Усти",from:"тётка Устя",
   text:"Нюра. Я у него живу, у пилота, ты знаешь. Там теперь Вега — хорошая, хоть и с приветом. Я к тебе поеду, если ты ко мне не поедешь. Но лучше ты. У нас свет не гасят."}
];
function islandAll(){if(!G.island||typeof G.island!=="object")G.island={letters:{}};return G.island;}
function islandState(id){const I=islandAll();return I.letters[id]||(I.letters[id]={taken:0,done:0,day:0});}
/* письмо на Остров предлагают у стойки после ухода экспедиции (или в сборе) */
function islandOfferHere(){
  const E=G.exp;if(!E||!E.phase||!G.sys||!G.sys.station)return null;
  const r=rng(hashi(G.sys.sx,G.sys.sy,0x15A+Math.floor(celDay()/3)));
  const L=ISLAND_LETTERS.filter(l=>!islandState(l.id).taken);
  if(!L.length||r()>.5)return null;
  return L[Math.floor(r()*L.length)];
}
function islandTake(l){
  const S=islandState(l.id);if(S.taken)return false;
  S.taken=1;
  thingAdd("letter","Письмо на Остров · "+l.from+" → "+l.who,"конверт · туда, куда ушли · подойти к базе без оружия — сесть с письмом",{island:l.id});
  peopleLine("это туда. К ним. Вы поняли. Без оружия подойдёте — примут.",G.st?G.st.name:"Стойка",true);
  return true;
}
function islandHeld(){return ISLAND_LETTERS.filter(l=>islandState(l.id).taken&&!islandState(l.id).done);}
/* подход к базе с письмом: не абордаж */
function islandLand(PB){
  const held=islandHeld();if(!held.length)return false;
  const l=held[0],S=islandState(l.id);
  S.done=1;S.day=celDay();
  const th=thingsAll().find(t=>t.island===l.id);
  if(th){th.ru="Письмо на Остров · "+l.from+" → "+l.who+" · отдано";th.note=l.text;th.k="paper";}
  peopleLine(l.text,l.who,true);
  peopleLine("прочитал. Неделю подумаю. Летите, вас не тронут.",l.who);
  logAdd("good","Сели на «"+PB.name+"» с письмом. "+l.who+" прочитал. Через неделю — табло.");
  if(typeof repAdd==="function")repAdd(1,G.sys);
  if(typeof recordAdd==="function")recordAdd(l.who,"доставлено письмо на Остров");
  sfx("ok",{v:.5});
  return true;
}
/* табло: вернувшиеся с Острова — через неделю после письма */
function islandReturned(){
  return ISLAND_LETTERS.filter(l=>{const S=islandState(l.id);return S.done&&celDay()-S.day>=7;}).map(l=>l.who);
}
function islandBlock(){
  const O=islandOfferHere();if(!O)return;
  $body.appendChild(el("div","sec","ПИСЬМО НА ОСТРОВ · ТУДА, КУДА УШЛИ"));
  const r=el("div","row","<div class='nm'><b>"+O.from+" → "+O.who+"</b><s>отдать — у пиратской базы, подойдя без оружия · через неделю он на табло</s></div>");
  const b=el("button","act sm","ВЗЯТЬ");b.onclick=()=>{islandTake(O);renderTab();};
  r.appendChild(b);$body.appendChild(r);
}
