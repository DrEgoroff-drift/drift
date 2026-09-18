/* ══════════════ волокита — бумаги на животное (M511, PLAN st. 7) ══════════════
   Автор, 14.09: «надо прям заебать игрока бюрократией». Любое животное на
   борту — зверь в клетке (M496) или трепло (12x) — едет поездом и пересекает
   границу только с бумагами. ПАЛАТЕ нужно N документов, N бросается 2–10 по
   семени животного и НЕ сообщается: стол показывает стопку и «ещё документов:
   неизвестно». Документы идут по одному: стол называет следующий и чей он —
   чиновник другой державы на станции другого типа (по семени). Орднунг хочет
   форму в трёх экземплярах (три прихода в разные смены), Коммуна на обеде
   (зайдите в следующую смену). После двух бумаг клерк шепчет «можно ускорить»:
   варенье инспектору за 60 кр — и в стопку ложится «ПРИНЯТО К СВЕДЕНИЮ», и
   ничего не меняется. Петля честная (§22): стол не врёт, он просто не знает.
   Доброта: последний чиновник подписывает не глядя — «ну сколько ж можно,
   летай уже» — на любой станции, и только у этой подписи есть имя.
   Без бумаг: проводник не пускает в вагон; пикет на границе штрафует (первый
   раз — машет рукой). G.vol = {a:{key:{need,docs:[{by,st,cp,lunch,fast}],hint,fast,fine,done,wave}}}. */
const VOL_DOCS=[
  {ru:"справка о прививках",             off:"ветеринар при станции"},
  {ru:"акт о некусаемости",              off:"комиссия по некусаемости"},
  {ru:"выписка из реестра фауны",        off:"регистратор фауны"},
  {ru:"согласие соседей по ангару",      off:"домком ангара"},
  {ru:"форма 7-ЗВ «о намерении перевозить»",off:"окно 7"},
  {ru:"заключение о совместимости с грузом",off:"товаровед"},
  {ru:"характеристика от участкового",   off:"участковый"},
  {ru:"копия копии",                     off:"архив"}
];
const VOL_FAST=60,VOL_FINE=40,VOL_MIN=2,VOL_MAX=10;
const VOL_BY=["gt","co","or","km","ra","hf"];
function volAll(){const V=G.vol||(G.vol={});V.a=V.a||{};return V;}
/* животные на борту: ключ, имя, семя */
function volAnimals(){
  const out=[];
  if(typeof parrotHas==="function"&&parrotHas())out.push({key:"parrot",ru:"трепло «"+G.parrot.name+"»",seed:G.parrot.seed>>>0});
  if(G.beast)out.push({key:"beast:"+(G.beast.seed>>>0),ru:G.beast.sp+" (в клетке)",seed:G.beast.seed>>>0});
  return out;
}
function volOf(a){
  const V=volAll();
  if(!V.a[a.key]){
    const r=rng(hashi(a.seed,0xB0B,0x511));
    V.a[a.key]={need:VOL_MIN+Math.floor(r()*(VOL_MAX-VOL_MIN+1)),docs:[],hint:0,fast:0,fine:0,done:0,wave:0};
  }
  return V.a[a.key];
}
function volOk(a){return !!volOf(a).done;}
/* следующий документ: какой и чей. Последний — доброта, подписывают везде */
function volNext(a){
  const P=volOf(a),i=P.docs.length;
  if(P.done)return null;
  const last=i===P.need-1;
  const D=VOL_DOCS[i%VOL_DOCS.length],r=rng(hashi(a.seed,i*7+1,0x0D0C));
  const by=VOL_BY[Math.floor(r()*VOL_BY.length)],st=ST_TYPES[Math.floor(r()*ST_TYPES.length)].id;
  return {i,ru:i>=VOL_DOCS.length?D.ru+" копии":D.ru,off:D.off,by,st,last};
}
function volHere(){
  if(G.mode!=="dock"||!G.st)return null;
  return {by:(typeof stampOwnerAt==="function"?stampOwnerAt(G.sx,G.sy):null)||G.st.by||"gt",st:G.st.stype};
}
/* можно ли подписать здесь: строка-ответ клерка или null (значит — можно) */
function volWhy(a){
  const N=volNext(a),H=volHere();
  if(!N||!H)return "не здесь";
  if(N.last)return null;
  if(N.by!==H.by||N.st!==H.st)return "не здесь: "+N.off+" — "+powerRu(N.by)+", "+stTypeOf(N.st).ru.toLowerCase();
  const P=volOf(a),d=P.pend||(P.pend={}),sh=holdShift();
  if(N.by==="or"){const cp=d.cp|0,at=d.at|0;if(cp<3&&(cp===0||at!==sh))return null;if(cp<3)return "«в трёх экземплярах» · принесено "+cp+" · следующий — в другую смену";}
  if(N.by==="km"&&d.lunch===undefined)return null;
  if(N.by==="km"&&d.lunch===sh)return "на обеде · «зайдите в следующую смену»";
  return null;
}
function volSign(a){
  const N=volNext(a);if(!N)return false;
  const P=volOf(a),sh=holdShift(),d=P.pend||(P.pend={});
  if(!N.last){
    const H=volHere();if(!H||N.by!==H.by||N.st!==H.st){say("Не здесь",80);return false;}
    if(N.by==="or"){
      if((d.cp|0)<3){if((d.cp|0)>0&&(d.at|0)===sh){say("«В другую смену»",80);return false;}
        d.cp=(d.cp|0)+1;d.at=sh;
        if(d.cp<3){logAdd("dim","Орднунг: «"+N.ru+" — в трёх экземплярах». Принят экземпляр "+d.cp+" из 3");say("Экземпляр "+d.cp+" из 3\n«приходите ещё»",100);return false;}}
    }
    if(N.by==="km"){
      if(d.lunch===undefined){d.lunch=sh;logAdd("dim","Коммуна: "+N.off+" на обеде · «зайдите в следующую смену»");say("На обеде\n«зайдите в следующую смену»",100);return false;}
      if(d.lunch===sh){say("Всё ещё обед",80);return false;}
    }
  }
  const doc={by:N.by,st:N.st,ru:N.ru,sh};
  if(N.last){doc.name=genName(rng(hashi(a.seed,0x5A1D,7)));doc.by=(volHere()||{}).by||N.by;}
  P.docs.push(doc);P.pend={};
  if(N.last){
    P.done=1;
    logAdd("good",doc.name+" подписал не глядя: «ну сколько ж можно, летай уже». Бумаги на "+a.ru+" в порядке");
    if(typeof thingAdd==="function")thingAdd("paper","Ветпаспорт · "+a.ru,"подписей: "+P.docs.length+" · последняя — "+doc.name+", не читая");
    say("«Ну сколько ж можно.\nЛетай уже.»\n— "+doc.name,160);
  }else{
    logAdd("dim","Подписано: "+N.ru+" · "+N.off+" · «вам ещё документа не хватает»");
    say("Подписано\n«вам ещё документа не хватает»",110);
    if(P.docs.length>=2&&!P.hint){P.hint=1;logAdd("dim","Клерк, тише: «можно ускорить». Варенье инспектору — "+VOL_FAST+" кр");}
  }
  return true;
}
/* ускорить: варенье инспектору. Штамп ложится, ничего не меняется */
function volFast(a){
  const P=volOf(a);
  if(!P.hint||P.done)return false;
  if(G.credits<VOL_FAST){say("Варенье — "+VOL_FAST+" кр",80);return false;}
  G.credits-=VOL_FAST;P.fast=(P.fast|0)+1;
  logAdd("dim","Варенье передано · штамп «ПРИНЯТО К СВЕДЕНИЮ» · документов не хватает столько же, сколько и было");
  say("ПРИНЯТО К СВЕДЕНИЮ\n(ничего не изменилось)",120);
  return true;
}
/* ── ворота ── */
function volBlocked(){
  for(const a of volAnimals())if(!volOk(a))return a;
  return null;
}
/* проводник: зовёт railBuy */
function volRail(){
  const a=volBlocked();if(!a)return true;
  const P=volOf(a);
  say("Проводник: «с животным без бумаг — нельзя»\n"+a.ru+" · собрано "+P.docs.length+" · ещё — неизвестно",150);
  logAdd("warn","В вагон не пустили: на "+a.ru+" нет бумаг · собрано "+P.docs.length+" · сколько ещё — ПАЛАТА не говорит");
  return false;
}
/* граница: зовёт stampArrive после отметки */
function volBorder(by){
  const a=volBlocked();if(!a||!by)return 0;
  const P=volOf(a);
  if(!P.wave){P.wave=1;logAdd("dim","Пикет "+powerRu(by)+": на "+a.ru+" бумаг нет. Инспектор посмотрел в клетку и махнул рукой");return 1;}
  if(G.credits>=VOL_FINE)G.credits-=VOL_FINE;P.fine=(P.fine|0)+1;
  logAdd("bad","Пикет "+powerRu(by)+": животное без бумаг · штраф "+VOL_FINE+" кр · «в следующий раз с документами»");
  say("Пикет: животное без бумаг\nштраф "+VOL_FINE+" кр",120);
  return 1;
}
/* ── стол: стопка на странице КНИЖКИ ── */
function volPage(box){
  const A=volAnimals();if(!A.length)return;
  tableRow(box,"head","","ВОЛОКИТА · ЖИВОТНЫЕ И БУМАГИ");
  for(const a of A){
    const P=volOf(a),N=volNext(a);
    const row=document.createElement("div");row.className="li vol";
    const em=document.createElement("em");em.textContent=P.done?"ок":"—";
    const sp=document.createElement("span");
    let h="<b>"+a.ru+"</b><div class='vol-pile'>";
    for(const d of P.docs)h+="<i class='vol-doc vol-"+d.by+"'"+(d.name?" data-nm='"+d.name+"'":"")+"><s>"+d.ru+"</s></i>";
    for(let i=0;i<(P.fast|0);i++)h+="<i class='vol-doc vol-fast'><s>принято к сведению</s></i>";
    h+="</div>";
    if(P.done)h+="<i>бумаги в порядке · подписей "+P.docs.length+"</i>";
    else{
      h+="<i>собрано "+P.docs.length+" · ещё документов: неизвестно</i>";
      if(N)h+="<br><i>нужна: "+N.ru+(N.last?"":" · "+N.off+" · "+powerRu(N.by)+", "+stTypeOf(N.st).ru.toLowerCase())+"</i>";
    }
    sp.innerHTML=h;
    if(!P.done){
      const why=volWhy(a),soft=!!why&&(/экземпляр/i.test(why)||/обед/i.test(why));
      if(soft){const w=document.createElement("i");w.textContent=why;sp.appendChild(document.createElement("br"));sp.appendChild(w);}
      const b=document.createElement("button");b.className="act sm";
      b.textContent=why?(soft?"ПОДПИСАТЬ · ЕЩЁ РАЗ":"ПОДПИСАТЬ"):"ПОДПИСАТЬ ЗДЕСЬ";
      b.disabled=!!why&&!soft;
      b.onclick=e=>{e.stopPropagation();volSign(a);tableRender();};
      sp.appendChild(document.createElement("br"));sp.appendChild(b);
      if(P.hint){
        const f=document.createElement("button");f.className="act sm";f.textContent="УСКОРИТЬ · "+VOL_FAST+" КР";
        f.onclick=e=>{e.stopPropagation();volFast(a);tableRender();};
        sp.appendChild(f);
      }
    }
    row.appendChild(em);row.appendChild(sp);box.appendChild(row);
  }
}
