/* ══════════════ QSL: стена карточек ══════════════
   M203, из списка «радостей». Переделано под правило «без имён»: на том конце
   не живые игроки, а ЛЮДИ ЭТОЙ ИГРЫ — зимовщики, экспедиция, дальние посёлки,
   маяк, обсерватория. Затея целиком офлайновая, сервер тут не при чём.

   КАК ЭТО РАБОТАЕТ У РАДИОЛЮБИТЕЛЕЙ, ТАК И ЗДЕСЬ. Поймал дальнего на слух —
   записал позывной. Послал ему карточку. Через недели пришла ответная, и её
   вешают на стену. Никакого счёта, никакой награды: смысл в том, что стена
   заполняется, и по ней потом видно, где ты был слышен.

   ВРЕМЯ НАСТОЯЩЕЕ И ЛЕНИВОЕ, как у вымпела (M196): у карточки есть срок в
   `Date.now()`, и пока он не вышел — её нет нигде, кроме строки в сохранении.
   Игра, закрытая на месяц, ничего не проспит и ничего не смоделирует.

   ПОЧЕМУ ПОЙМАТЬ — ЭТО ПРОСТО УСЛЫШАТЬ. Кнопки «записать» нет: у радиста
   позывной остаётся в голове от того, что он его услышал. Ручка приёмника и
   есть весь механизм; кто крутит — тот и собирает.

   ПРАВИЛА ФАЙЛА:
   1. Хранится G.qsl: кого слышал, кому послал, от кого пришло. Ничего больше.
   2. Ни одного живого человека на том конце. Никогда. */
const QSL_WAIT=9*86400000;         /* сколько идёт ответ: недели */
const QSL_SPREAD=11*86400000;
const QSL_OPS=[
  {id:"z1", call:"РЗ-14", ru:"зимовка «Четырнадцатая»",  line:"…четырнадцатая на связи. Слушаю кого угодно, отвечаю всем."},
  {id:"z2", call:"РЗ-31", ru:"зимовка «Тридцать первая»",line:"…тридцать первая. У меня тут метель третьи сутки, а в эфире хорошо."},
  {id:"e1", call:"ЭК-1",  ru:"экспедиция, головной борт", line:"…головной. Идём. Про нас потом напишут неправду, вы не верьте."},
  {id:"e2", call:"ЭК-7",  ru:"экспедиция, седьмой",       line:"…седьмой. Я тут самый младший, поэтому и на вахте."},
  {id:"m1", call:"МК-2",  ru:"маяк на Каменной гряде",    line:"…маяк. Горю. Больше сказать нечего, и это хорошая новость."},
  {id:"o1", call:"ОБС-9", ru:"обсерватория института",    line:"…обсерватория. Небо чистое, начальство спит, работаем."},
  {id:"p1", call:"ПС-Тиун",ru:"посёлок Тиун",             line:"…мы тут. Говорим плохо, слышим хорошо."},
  {id:"p2", call:"ПС-Луун",ru:"посёлок Луун",             line:"…луун. Приезжайте, у нас теперь есть печь."},
  {id:"b1", call:"БР-«Стойкая»",ru:"баржа «Стойкая»",     line:"…стойкая, в грузу. Идём медленно, зато дойдём."},
  {id:"b2", call:"БР-«Крапива»",ru:"баржа «Крапива»",     line:"…крапива. Кто на подходе к узлу — не толпитесь, всем места хватит."},
  {id:"s1", call:"СН-Прибой",ru:"санаторий «Прибой»",     line:"…прибой. У нас тихий час, я вообще-то не должен."},
  {id:"h1", call:"ХОЗ-6", ru:"дом на шестом",             line:"…шестой. Домашняя станция, мощность два ватта, слышно до края."},
  {id:"g1", call:"ГР-Остров",ru:"Остров",                 line:"…остров. Мы не отвечаем на вопросы, но карточку пришлём."},
  {id:"t1", call:"ТР-12", ru:"тральщик двенадцатый",      line:"…двенадцатый, на промысле. Руки заняты, говорю ногой."},
  {id:"k1", call:"КР-Дальний",ru:"кордон «Дальний»",      line:"…дальний кордон. Тут даже эфир приходит с опозданием."},
  {id:"n1", call:"НБ-3",  ru:"наблюдательный пункт три",  line:"…третий. Считаю то, что мимо летит. Насчитал много."},
  {id:"v1", call:"ВЫШ-1", ru:"вышка на Гриве",            line:"…вышка. Ветер. Всегда ветер. Привыкаешь."},
  {id:"d1", call:"ДЕТ-1", ru:"детский кружок при станции",line:"…это кружок! Нам разрешили! Мы недолго!"},
  {id:"f1", call:"ФК-Сар",ru:"фактор Сарурорна",          line:"…фактор. Беру всё, отдаю по совести. Совесть у меня средняя."},
  {id:"q1", call:"КВ-0",  ru:"неизвестный корреспондент", line:"…ноль. Позывной свой не назову, а карточку пришлю."}
];
const QSL_BY={};QSL_OPS.forEach(o=>QSL_BY[o.id]=o);
function qslAll(){
  if(!G.qsl||typeof G.qsl!=="object")G.qsl={heard:{},sent:{},got:{}};
  for(const k of ["heard","sent","got"])
    if(!G.qsl[k]||typeof G.qsl[k]!=="object")G.qsl[k]={};
  return G.qsl;
}
function qslHeard(id){return !!qslAll().heard[id];}
function qslSent(id){return !!qslAll().sent[id];}
function qslGot(id){return !!qslAll().got[id];}
function qslWall(){return QSL_OPS.filter(o=>qslGot(o.id));}
/* ── поймать ──
   Услышал — значит записал. Кнопки нет: у радиста позывной остаётся в голове
   от самого факта, что он его услышал. */
function qslHear(id){
  const o=QSL_BY[id];if(!o)return "";
  const Q=qslAll();
  const isNew=!Q.heard[id];
  Q.heard[id]=Date.now();
  if(isNew){
    logAdd("ether",o.call+" · "+o.ru+" · позывной записан");
    tell("good","Дальний: "+o.call,"ДАЛЬНИЙ\n"+o.call+"\n"+o.ru+"\nкарточку можно послать со стола");
  }
  return o.call+": "+o.line;
}
/* строка дальнего для приёмника: возвращает текст или пусто */
function qslEtherLine(){
  const r=rng(hashi(Math.floor(Date.now()/40000),(G.sx|0)*31+(G.sy|0),0x0951));
  if(r()>0.22)return "";
  const o=QSL_OPS[Math.floor(r()*QSL_OPS.length)];
  return qslHear(o.id);
}
/* ── послать карточку ── */
function qslSend(id){
  const o=QSL_BY[id];const Q=qslAll();
  if(!o||!Q.heard[id]||Q.sent[id])return false;
  const r=rng(hashi(id.length*17,Date.now()&0x7fffffff,0x0952));
  Q.sent[id]={t:Date.now(),due:Date.now()+QSL_WAIT+Math.floor(r()*QSL_SPREAD)};
  logAdd("tech","Карточка послана: "+o.call+" · ответ идёт неделями");
  tell("good","Карточка послана: "+o.call,"КАРТОЧКА ПОСЛАНА\n"+o.call+"\nответ придёт не скоро");
  return true;
}
/* ── ответ ──
   Считается лениво, при взгляде на стену или на стыковке. Ничего не тикает. */
function qslTick(){
  const Q=qslAll();
  const now=Date.now();
  let n=0;
  for(const id in Q.sent){
    const s=Q.sent[id];
    if(!s||Q.got[id])continue;
    if(now<(s.due||0))continue;
    Q.got[id]=now;
    n++;
    const o=QSL_BY[id];
    if(o)thingAdd("letter","Ответная карточка · "+o.call,
      o.ru+" · подтверждают приём · на стену",{qsl:id});
  }
  if(n){
    logAdd("good","Ответных карточек: "+n+" · на стену");
    tell("good","Пришла ответная карточка"+(n>1?" ×"+n:""),
      "ОТВЕТНАЯ КАРТОЧКА"+(n>1?" ×"+n:"")+"\nстена дома");
    if(qslWall().length===QSL_OPS.length&&typeof recordAdd==="function")
      recordAdd("стена","вся стена в карточках · отвечали все");
  }
  return n;
}
/* ── карточка ──
   Печатная, как настоящая QSL: крупный позывной, место мелко, угловой штамп.
   Рисуется одинаково и на стене дома, и на столе. */
function qslDraw(c,x,y,w,h,o,seed){
  c.save();
  c.translate(x+w/2,y+h/2);
  c.rotate(((hashi(seed|0,7,3)%100)/100-0.5)*0.10);
  c.translate(-w/2,-h/2);
  c.fillStyle="rgba(0,0,0,.30)";
  c.fillRect(2,3,w,h);
  c.fillStyle="rgb(232,224,204)";
  c.fillRect(0,0,w,h);
  c.fillStyle="rgba(120,106,80,.35)";
  c.fillRect(0,0,w,Math.max(1,h*0.035));
  c.fillRect(0,h*0.62,w,Math.max(1,h*0.020));
  /* позывной крупно */
  c.fillStyle="rgba(52,44,32,.92)";
  c.font=Math.max(7,Math.round(h*0.26))+"px ui-monospace,monospace";
  c.textAlign="center";
  c.fillText((o&&o.call)||"—",w/2,h*0.44);
  /* место мелко */
  c.fillStyle="rgba(120,106,80,.85)";
  c.font=Math.max(5,Math.round(h*0.13))+"px ui-monospace,monospace";
  const nm=(o&&o.ru)||"";
  c.fillText(nm.length>22?nm.slice(0,21)+"…":nm,w/2,h*0.80);
  /* угловой штамп */
  c.strokeStyle="rgba(150,90,70,.55)";
  c.lineWidth=Math.max(1,h*0.03);
  c.beginPath();c.arc(w*0.84,h*0.20,h*0.13,0,TAU);c.stroke();
  c.textAlign="left";
  c.restore();
}
/* стена дома: карточки в ряд, с нахлёстом, приколоты кнопками */
function qslDrawWall(x,y,w,h){
  const L=qslWall();
  if(!L.length)return;
  const cw=Math.min(w/4.2,h*0.62), ch=cw*0.62;
  const per=Math.max(1,Math.floor(w/(cw*0.86)));
  L.slice(0,per*3).forEach((o,i)=>{
    const cx=x+(i%per)*cw*0.86, cy=y+Math.floor(i/per)*ch*0.88;
    qslDraw(ctx,cx,cy,cw,ch,o,hashi(i,o.id.length,5));
    ctx.fillStyle="rgba(190,80,60,.85)";
    ctx.beginPath();ctx.arc(cx+cw*0.5,cy+ch*0.06,Math.max(1.4,ch*0.05),0,TAU);ctx.fill();
  });
}
/* ── стол ──
   Кого слышал, кому послал, от кого пришло. Одна закладка на всё. */
function renderQsl(box){
  box.innerHTML="";
  qslTick();
  const Q=qslAll();
  const heard=QSL_OPS.filter(o=>qslHeard(o.id));
  if(!heard.length){
    tableRow(box,"dim","","позывных пока нет: дальних ловят приёмником на пульте, на диапазоне ЭФИР");
    return;
  }
  tableRow(box,"dim","","на стене "+qslWall().length+" из "+QSL_OPS.length);
  const wrap=document.createElement("div");wrap.className="album mail";
  for(const o of heard){
    const pack=document.createElement("div");
    pack.className="pack open"+(qslGot(o.id)?"":" mute");
    const hd=document.createElement("div");hd.className="ph";
    hd.innerHTML="<b>"+o.call+"</b><s>"+o.ru+" · "+
      (qslGot(o.id)?"ответили · на стене":(qslSent(o.id)?"карточка в пути":"позывной записан"))+"</s>";
    pack.appendChild(hd);
    const row=document.createElement("div");row.className="row";
    const cv=document.createElement("canvas");
    cv.width=228*2;cv.height=142*2;cv.style.width="228px";cv.style.height="142px";
    const cc=cv.getContext("2d");cc.scale(2,2);
    if(qslGot(o.id))qslDraw(cc,10,8,208,124,o,hashi(o.id.length,3,5));
    else{
      cc.fillStyle="rgba(255,255,255,.04)";cc.fillRect(10,8,208,124);
      cc.strokeStyle="rgba(201,181,142,.22)";cc.setLineDash([6,5]);
      cc.strokeRect(10.5,8.5,207,123);
    }
    row.appendChild(cv);
    pack.appendChild(row);
    if(!qslSent(o.id)){
      const acts=document.createElement("div");acts.className="acts";
      const b=document.createElement("button");
      b.className="act sm gold";b.textContent="ПОСЛАТЬ КАРТОЧКУ";
      b.onclick=e=>{e.stopPropagation();qslSend(o.id);tableRender();};
      acts.appendChild(b);
      pack.appendChild(acts);
    }
    wrap.appendChild(pack);
  }
  box.appendChild(wrap);
}
