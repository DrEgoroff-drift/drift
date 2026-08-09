/* ══════════════ отчёт «Долгого Хода»: сто кусков ══════════════ */
/* Зарубки на планетах оставила не чужая рука. Их резала экспедиция, которая шла
   здесь до вас — с той же работой, теми же баржами и теми же долгами. Игрок
   собирает её отчёт не из вежливости, а из жадности: каждый кусок платит на
   месте — адресом, ценами, словом чужого языка, — и только потом выясняется,
   что сотня окупившихся находок была одним рассказом.

   ПРАВИЛА ФАЙЛА:
   1. Таблица ЗАКРЫТА и ровно на сто записей, детерминирована от постоянного
      зерна (как NODES и RARE) и зафиксирована навсегда: id уже полученного
      куска не меняется от правки генератора.
   2. Куска-«лора» не существует. У каждого есть полезная выдача (`gives`),
      которая работает сама по себе, до того как игрок поймёт, о чём речь.
      Кусок, который можно удалить, и ни одна механика не заметит, — ложь.
   3. Место — детерминированная функция ключа места, а не бросок, как у
      редкостей (12m-rare). Но пул здесь ОДИН на все сто: зарубки — пока
      единственный свидетель, и ни один кусок не должен быть недостижим,
      пока не построены остальные (трепло, Жестянка, подглядка — M116-M118).
   4. Восемь глав. Глава читается с двух третей своих кусков: недостающая треть
      повторяет соседей с другой точки обзора. Сотня обязательных кусков сделала
      бы финал заложником одного неудачного адреса.
   5. Адрес всегда ВНЕ радиуса прыжка. Зарубка, открывающая соседа, — украшение.

   ЧЕМ ЭТО НЕ ЯВЛЯЕТСЯ. Рядом уже лежит сотня редкостей (12m-rare), и две сотни
   читаются одной повинностью, если не различаются по роду. Различаются:
   редкость БЕРУТ с места — один адрес, и дело закрыто. Кусок СЛЫШАТ от
   свидетеля — он может прийти дважды с разных сторон и расшифроваться позже,
   чем найден (M116). Редкости — коллекция, куски — показания. */

/* восемь глав: имя и то, о чём она вообще */
const LORE_CHAP=[
  {id:"podryad", ru:"Подряд",  note:"кто их сюда послал и на каких условиях"},
  {id:"plecho",  ru:"Плечо",   note:"как держали снабжение и кто его вёл"},
  {id:"sosedi",  ru:"Соседи",  note:"первые встречи с местными и общий язык"},
  {id:"schet",   ru:"Счёт",    note:"накладные, которые не сошлись"},
  {id:"priboy",  ru:"Прибой",  note:"что они мерили и почему торопились"},
  {id:"raskol",  ru:"Раскол",  note:"когда экипаж перестал быть одним"},
  {id:"tishina", ru:"Тишина",  note:"последние сутки связи"},
  {id:"tihonya", ru:"Тихоня",  note:"тот, кто вышел"}
];
const LORE_CHAP_IX={};LORE_CHAP.forEach((c,i)=>LORE_CHAP_IX[c.id]=i);
/* строка отчёта собирается из трёх банок: кто — что сделал — при чём тут это.
   Банки нарочно сухие: это судовой журнал, а не проза. Жуть берётся из того,
   что запись обрывается на накладной, а не из эпитетов. */
const LORE_WHO=["первый борт","второй борт","третий борт","штурман","связист",
  "старший копач","врач","снабженец","капитан","инженер","досмотр","младший борт"];
const LORE_ACT=["не вернулся","молчит вторые сутки","отдал груз","сменил курс",
  "закрыл журнал","ушёл на тихой тяге","считает дни","не подписал накладную",
  "остался прикрывать","просит воды","списан на берег","идёт без огней"];
const LORE_TAIL=["с дальнего плеча","за поясом","у третьей от звезды",
  "по счёту «Ласкового»","на чужой частоте","до прибоя восемь","без груза",
  "и это последняя запись","второй раз за декаду","по старой зарубке"];
/* словарь: тридцать слов пиджина на сотню кусков. Если бы слово несла каждая
   запись, язык прочитался бы раньше истории, и расшифровка задним числом
   (трепло, M116) сработала бы разом вместо волн. */
const LORE_WORDS=["вода","долг","звезда","уйти","прийти","считать","друг","чужой",
  "камень","огонь","дом","берег","волна","много","мало","бояться","помнить",
  "забыть","дать","взять","говорить","молчать","третий","дальше","ближе",
  "корабль","человек","земля","небо","конец"];
/* что кусок отдаёт СЕЙЧАС. Ни один не даёт кредитов — правило памятника. */
const LORE_GIVE=[
  {k:"addr", ru:"адрес"},   // открывает систему вне радиуса прыжка
  {k:"price",ru:"цены"},    // открывает рынок станции, как обсерватория
  {k:"word", ru:"слово"},   // запись в словарь (читается в M109/M116)
  {k:"data", ru:"замеры"}   // данные: самый скромный, но не пустой
];
const LORE=[];
const LORE_BY_ID={};
const LORE_BY_CHAP={};
const LORE_SALT=0x10DE;
(function buildLore(){
  for(let i=0;i<100;i++){
    const seed=hashi(LORE_SALT,i*137+11,0x10B1E), r=rng(seed);
    /* главы раскладываем циклом, а не броском: ни одна не остаётся пустой,
       и в каждой ровно по дюжине с небольшим */
    const C=LORE_CHAP[i%LORE_CHAP.length];
    /* слово несёт каждый третий с небольшим — тридцать штук на сотню */
    const wi=(i%10<3)?((i*7+3)%LORE_WORDS.length):-1;
    const g=wi>=0?LORE_GIVE[2]:LORE_GIVE[(seed>>>5)%3===0?0:((seed>>>7)%2?1:3)];
    const ru=pick(LORE_WHO,r)+" "+pick(LORE_ACT,r)+" "+pick(LORE_TAIL,r);
    const rec={id:"L"+i,idx:i,chap:C.id,chapRu:C.ru,ru,
      give:g.k,word:wi>=0?LORE_WORDS[wi]:null,seed};
    LORE.push(rec);LORE_BY_ID[rec.id]=rec;
    (LORE_BY_CHAP[C.id]||(LORE_BY_CHAP[C.id]=[])).push(rec);
  }
})();
/* ── собранное ── */
function loreList(){return (G.loreFound||(G.loreFound=[]));}
function loreHas(id){return loreList().indexOf(id)>=0;}
function loreCount(){return loreList().length;}
function loreMarks(){return (G.loreMarks||(G.loreMarks=[]));}
/* словарь: только те слова, что уже пришли с кусками */
function loreVocab(){
  const out=[];
  for(const id of loreList()){const R=LORE_BY_ID[id];if(R&&R.word&&out.indexOf(R.word)<0)out.push(R.word);}
  return out;
}
/* глава читается с двух третей: недостающее повторяет соседей с другой стороны */
function loreChapter(cid){
  const all=LORE_BY_CHAP[cid]||[];
  let have=0;for(const R of all)if(loreHas(R.id))have++;
  return {id:cid,total:all.length,have,need:Math.ceil(all.length*2/3),
          read:have>=Math.ceil(all.length*2/3)};
}
function loreChaptersRead(){let n=0;for(const c of LORE_CHAP)if(loreChapter(c.id).read)n++;return n;}
/* ── что лежит в этом месте ── ключ места детерминированно указывает на кусок.
   Пул один на все сто (правило 3), поэтому у каждого куска бесконечно много
   ключей: недостижимых нет. */
function loreAtPlace(key){
  const h=hashi((key>>>0)||1,LORE_SALT,7);
  return LORE[(h%100+100)%100];
}
/* ── адрес вне радиуса прыжка ──
   Ищем звезду в кольце «дальше, чем дотягивается рука, но в пределах листа
   карты»: адрес обязан быть недостижим сегодня и виден как метка. */
function loreAddr(seed){
  const st=(typeof stat==="function")?stat():{jump:3};
  const lo=st.jump+.6, hi=Math.max(lo+1.2,5.4);
  const r=rng(hashi(seed,0xADD,5));
  for(let i=0;i<160;i++){
    const a=r()*TAU, d=lo+r()*(hi-lo);
    const sx=G.sx+Math.round(Math.cos(a)*d), sy=G.sy+Math.round(Math.sin(a)*d);
    const dd=Math.hypot(sx-G.sx,sy-G.sy);
    if(dd<lo||dd>hi)continue;
    if(!starAt(sx,sy))continue;
    const s=getSystem(sx,sy);
    /* пустой адрес — обман: в системе должно быть куда идти */
    if(!s.station&&!(s.planets&&s.planets.length))continue;
    return {sx,sy,s};
  }
  return null;
}
/* ── взять кусок ── возвращает запись либо null, если это место уже отдало своё */
function loreTake(key){
  const R=loreAtPlace(key);
  if(!R||loreHas(R.id))return null;
  loreList().push(R.id);
  let got="";
  if(R.give==="addr"){
    const A=loreAddr(R.seed);
    if(A){
      loreMarks().push({sx:A.sx,sy:A.sy,id:R.id});
      got="адрес: сектор "+A.sx+":"+A.sy+(A.s.station?" · станция «"+A.s.station.name+"»":"");
    }else{got="направление стёрлось";G.data+=10;}
  }else if(R.give==="price"){
    let done=false;
    for(let i=0;i<40&&!done;i++){
      const rr=rng(hashi(R.seed,i,0x9C1));
      const sx=G.sx+Math.round((rr()*2-1)*4), sy=G.sy+Math.round((rr()*2-1)*4);
      if(!starAt(sx,sy))continue;
      const s=getSystem(sx,sy);
      if(!s.station||(G.market&&G.market[s.key]))continue;
      if(!G.market)G.market={};
      G.market[s.key]={pressure:{},t:G.t};
      got="цены станции «"+s.station.name+"» ("+sx+":"+sy+")";done=true;
    }
    if(!done){G.data+=12;got="сводка цен, которые вы и так знаете · +12 данных";}
  }else if(R.give==="word"){
    got="слово чужого языка: «"+R.word+"» · словарь "+loreVocab().length+"/30";
  }else{
    const n=14+((R.seed>>>4)%12);G.data+=n;got="замеры с плит · +"+n+" данных";
  }
  /* ── второй ответ ──
     Зарубки «Долгого Хода» датированы небом, а не координатами: плита отвечает
     дважды, если читать её тогда, когда небо в том же положении, в каком её
     резали. Это единственное право календаря вмешиваться в механику (M107):
     не прибавка, а второй адрес — куда идти дальше по этой же главе. */
  let second="";
  if(typeof celEventNow==="function"&&celEventNow()){
    const mine=loreList();
    const next=LORE.find(x=>x.chap===R.chap&&mine.indexOf(x.id)<0&&x.give==="addr");
    const A=next?loreAddr(next.seed):null;
    if(A){
      loreMarks().push({sx:A.sx,sy:A.sy,id:next.id});
      second="\n\nвторой ответ (плиту читали под тем же небом):\nсектор "+A.sx+":"+A.sy+
             (A.s.station?" · станция «"+A.s.station.name+"»":"")+" — там следующая";
      logAdd("tech","Второй ответ зарубки: сектор "+A.sx+":"+A.sy+" · небо совпало");
    }
  }
  const c=loreCount(), ch=loreChapter(R.chap);
  tell("tech","Кусок отчёта · "+c+"/100 · "+got,
       "«"+R.ru+"»\n\nглава: "+R.chapRu+" ("+ch.have+" из "+ch.total+")\n"+got+
       "\n\nсобрано кусков: "+c+" из 100"+second);
  logAdd("tech","Зарубка: "+R.ru+" · "+R.chapRu+" · "+c+"/100");
  /* глава дочитана — это событие само по себе: игрок не ждёт сотни из ста */
  if(ch.read&&ch.have===ch.need){
    tell("tech","Глава сложилась: "+R.chapRu,
         "Глава «"+R.chapRu+"» сложилась.\n"+
         (LORE_CHAP[LORE_CHAP_IX[R.chap]].note)+"\n\nглав прочитано: "+loreChaptersRead()+" из 8");
    logAdd("tech","Сложилась глава «"+R.chapRu+"» · "+loreChaptersRead()+"/8");
  }
  if(typeof saveGame==="function")saveGame(true);
  return R;
}
/* ── метки на карте ──
   Зарубка называет адрес, до которого сегодня не дотянуться, поэтому метка
   обязана читаться и за краем листа: не точка в пустоте, а направление. */
function drawLoreMarks(cell){
  const list=loreMarks();if(!list.length)return;
  const cx=W/2, cy=H/2;
  ctx.save();
  for(const m of list){
    const here=(m.sx===G.sx&&m.sy===G.sy);
    const x=cx+(m.sx-G.sx)*cell, y=cy+(m.sy-G.sy)*cell;
    const inside=x>18&&x<W-18&&y>18&&y<H-18;
    ctx.strokeStyle=here?"rgba(255,214,120,.85)":"rgba(255,196,92,.55)";
    ctx.lineWidth=1.2;
    if(inside){
      /* кольцо-засечка: не звезда и не станция, чтобы не спорить с картой */
      ctx.beginPath();ctx.arc(x,y,9,0,TAU);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x,y-13);ctx.lineTo(x,y-9);ctx.stroke();
      if(here){
        ctx.fillStyle="rgba(255,214,120,.9)";
        ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
        ctx.fillText("ЗАРУБКА",x,y+22);
      }
    }else{
      /* за краем — стрелка на кромке: адрес есть, руки не хватает */
      const a=Math.atan2(y-cy,x-cx);
      const ex=cx+Math.cos(a)*(Math.min(W,H)/2-16), ey=cy+Math.sin(a)*(Math.min(W,H)/2-16);
      ctx.beginPath();
      ctx.moveTo(ex+Math.cos(a)*7,ey+Math.sin(a)*7);
      ctx.lineTo(ex+Math.cos(a+2.5)*7,ey+Math.sin(a+2.5)*7);
      ctx.lineTo(ex+Math.cos(a-2.5)*7,ey+Math.sin(a-2.5)*7);
      ctx.closePath();ctx.stroke();
    }
  }
  ctx.restore();
}
