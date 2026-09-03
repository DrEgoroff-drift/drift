/* ══════════════ журнал дел ══════════════ */
/* Игра говорила о взятых обещаниях всплывающей строкой и записью в ленте:
   «принял» было видно секунду, а потом приходилось помнить самому — что взял,
   у кого, куда лететь и сколько осталось. Здесь дела живут списком, у каждого
   есть адрес, и по адресу можно ткнуть: курс ляжет на карту сам.

   ПРАВИЛА:
   1. Дело заводится ТОЛЬКО там, где игрок что-то принял или потерял, — иначе
      журнал превращается в список того, что игра хочет от игрока.
   2. У дела всегда есть адрес или его честное отсутствие. «Лететь неизвестно
      куда» — это тоже ответ, но он должен быть написан.
   3. Дело закрывается кодом, который его выполняет, а не таймером: `questDone`
      зовёт тот, кто действительно засчитал результат.
   4. Хранится компактно и персистентно: это обещание игрока, а не состояние мира. */
const QUEST_MAX=40;
function questInit(){return [];}
function questAll(){return (G.quests||(G.quests=questInit()));}
function questOpen(){return questAll().filter(q=>q.state==="active");}
/* ── завести дело ──
   `key` — чтобы одно и то же поручение не заводилось дважды: перезаход в кантину
   или повторный тик домена не должны плодить строки. */
function questAdd(key,o){
  const list=questAll();
  const has=list.find(q=>q.key===key&&q.state==="active");
  if(has)return has;
  const q={key,ru:o.ru,note:o.note||"",from:o.from||"",kind:o.kind||"job",
    sx:(o.sx===undefined?null:o.sx),sy:(o.sy===undefined?null:o.sy),
    place:o.place||"",state:"active",t:Date.now(),until:o.until||0,
    reward:o.reward||""};
  list.push(q);
  if(list.length>QUEST_MAX)list.splice(0,list.length-QUEST_MAX);
  logAdd("","Записано в журнал: "+q.ru);
  return q;
}
function questFind(key){return questAll().find(q=>q.key===key&&q.state==="active")||null;}
function questClose(key,state,note){
  const q=questFind(key);if(!q)return null;
  q.state=state;q.doneT=Date.now();
  if(note)q.note=note;
  logAdd(state==="done"?"good":"warn",
    (state==="done"?"Дело закрыто: ":"Дело сорвано: ")+q.ru);
  return q;
}
function questDone(key,note){
  if(typeof placeNote==="function")placeNote("care",3);   // привёз, сделал — место помнит (11d)
  return questClose(key,"done",note);
}
function questFail(key,note){return questClose(key,"failed",note);}
/* ── курс по делу ──
   Ткнули по строке — карта открылась с выбранной системой. Это единственная
   кнопка журнала, и она делает ровно то, чего от журнала хотят: «отвези меня
   туда, где это надо делать». */
/* ── курс по бумаге ──
   Общий ход для всего, у чего на столе есть адрес. Вынесен из `questGoto`,
   когда выяснилось, что дел он касается меньше всего.

   ЗАЧЕМ (внешний плейтест, пункт 5): «зачем лететь» живёт внутри станции —
   доска с нуждами и ценами и есть мотор игры, но заводится он только после
   посадки, стыковки и переключения вкладки. При этом стол ПОМНИТ цены и
   нужды всех станций, где вы были, — и до сих пор это была бумага, с которой
   нельзя ничего сделать: адрес приходилось запоминать глазами и набирать на
   карте руками.

   Почему это не квестовый маркер, которого плейтест как раз просил избежать:
   над миром ничего не появляется, стрелок нет, игра ни к чему не зовёт. Есть
   бумага с адресом и штурман, который по ней прокладывает курс, — ровно тот
   жест, который уже был у дел (единственная кнопка журнала). */
function gotoSector(sx,sy,what){
  if(sx===null||sx===undefined||sy===null||sy===undefined){
    say("У этой записи нет адреса");return false;
  }
  G.sel={x:sx,y:sy};
  /* курс — состояние, а не мгновение (M321, §9 шаг 6): в полёте его называет
     кнопка «К ЦЕЛИ», карта помнит круг поиска и после НАЗАД; гаснет по прибытии */
  G.course=(sx===G.sx&&sy===G.sy)?null:{sx:sx,sy:sy,what:what||"",rad:(G.mapSearch&&G.mapSearch.sx===sx&&G.mapSearch.sy===sy)?G.mapSearch.rad:null};
  /* далёкий сектор — окно так, чтобы в кадре были и вы, и он (M299): раньше
     окно уезжало к сектору, а игрок оставался за краем и не видел, откуда лететь */
  if(typeof mapFit==="function")mapFit(sx,sy);
  else G.mapView=(Math.max(Math.abs(sx-G.sx),Math.abs(sy-G.sy))>4)?{x:sx,y:sy}:null;
  G.mapMore=false;
  /* со станции — подглядом: экран станции прячется, НАЗАД возвращает (M299) */
  if(!(typeof mapPeek==="function"&&mapPeek()))G.mode="map";
  toggleLog(false);
  if(typeof tableToggle==="function")tableToggle(false);
  const nm=getSystem(sx,sy).name||("сектор "+sx+":"+sy);
  say("Курс на «"+nm+"»"+(what?"\n"+what:""));
  return true;
}
function questGoto(q){
  if(q.sx===null||q.sy===null){say("У этого дела нет адреса");return false;}
  return gotoSector(q.sx,q.sy,null);
}
/* сколько осталось по сроку, словами: точное число секунд игроку не нужно */
function questLeft(q){
  if(!q.until)return "";
  const left=(q.until-Date.now())/60000;
  if(left<=0)return "срок вышел";
  return left<1?"меньше минуты":(Math.ceil(left)+" мин");
}
/* ── дела, которые заводит сам мир ──
   Пленный наёмник и занятая система — не «квесты из таблицы», а следствие того,
   что уже случилось. Поэтому они появляются и исчезают сами, вместе с причиной. */
function questSync(){
  const list=questAll();
  /* пленные: за каждого своё дело с адресом сектора, где его держат */
  for(const c of (G.crew||[])){
    const key="hostage:"+c.id;
    if(c.hostage){
      questAdd(key,{ru:"Выкупить или отбить: "+c.name,
        kind:"crew",from:"звено",
        note:"его держат пираты. Выкуп растёт, пока тянете; штурм базы в том же "+
             "секторе освобождает даром",
        sx:c.hsx===undefined?null:c.hsx,sy:c.hsy===undefined?null:c.hsy,
        reward:"человек вернётся в звено"});
    }else if(questFind(key))questDone(key,"он снова в звене");
  }
  /* Сначала закрываем дела на системы, которых уже нет во фронте: пройти по
     `G.occ` для этого нельзя — освобождённая система из него УДАЛЯЕТСЯ, и
     дело осталось бы висеть навсегда. */
  for(const q of list){
    if(q.state!=="active"||q.kind!=="occ")continue;
    if(!occLvl(q.sx,q.sy))questDone(q.key,"система свободна");
  }
  /* занятые системы: дело заводится только на те, где вы уже были, — журнал не
     раздаёт задания по всей галактике, он помнит ваши */
  for(const k in (G.occ||{})){
    const [sx,sy]=k.split(",").map(Number);
    const key="occ:"+k;
    const lvl=occLvl(sx,sy);
    if(!lvl)continue;
    if(!questFind(key)&&G.market&&G.market[sx+","+sy]){
      const sys=getSystem(sx,sy);
      questAdd(key,{ru:"Отбить «"+(sys.name||k)+"»",kind:"occ",from:"фронт",
        note:occInfo(lvl).note+". Считаются сбитые в этой системе",
        sx,sy,reward:"станция снова заработает, призовые за освобождение"});
    }
  }
  return list;
}
