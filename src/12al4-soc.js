/* ══════════════ общества и льготы (M512, PLAN «new mechanics», st. 5) ══════════════
   Автор, 14.09: «можно примкнуть к гильдии — какие могут быть и какие льготы».
   Вступают ДЕЛОМ, а не взносом; членский билет — в ВЕЩИ; взносы — всегда
   видимой строкой (правило доли управляющего); выйти даром, вернуться — за
   деньги. У каждого одна льгота и одна шутка. Первый проход — пять обществ,
   чьё дело уже можно сосчитать:
     ПРОФСОЮЗ ВОДИТЕЛЕЙ (ГЛАВТРАССА) — 100 прыжков; взнос 2 % с заработка;
       проездной вполцены;
     ТОВАРИЩЕСТВО КУЛИБИНЫХ — 10 раз замотали изолентой; изолента держит 60 %;
     «ЗНАЮЩИЕ» (маршрутчики Рассвета) — 10 поездок; чай в буфете даром — и
       слух к нему;
     КЛУБ ФИЛАТЕЛИСТОВ ОТМЕТОК — 4 отметки; обязанностей нет, собрания в гостинице;
     ПАРТНЁРСКАЯ ПРОГРАММА™ (Компания) — вступить может каждый; «баллы
       конвертируются в баллы», кассир шепчет «не вступайте».
   G.soc = {m:{id:{at,dues}}, left:{id:1}, c:{jumps,tapes,rides}}. */
const SOC_REJOIN=500;
const SOC={
  union:{ru:"Профсоюз водителей",by:"gt",dues:.02,deedRu:"100 прыжков",deed:()=>socC().jumps>=100,
    perk:"проездной вполцены",joke:"«тринадцатая» — в конце года, из общего котла, если котёл будет"},
  kulib:{ru:"Товарищество кулибиных",dues:0,deedRu:"10 раз замотали изолентой",deed:()=>socC().tapes>=10,
    perk:"изолента держит 60 %",joke:"«сделаем из ваших» — и делают"},
  know:{ru:"«Знающие»",by:"ra",dues:0,deedRu:"10 поездок",deed:()=>socC().rides>=10,
    perk:"чай в буфете даром — и слух к нему",joke:"всё знают, говорят только за чаем"},
  phil:{ru:"Клуб филателистов отметок",dues:0,deedRu:"4 отметки в КНИЖКЕ",
    deed:()=>typeof stampBook==="function"&&Object.keys(stampBook().st).length>=4,
    perk:"собрания в гостинице",joke:"пиратская отметка — предмет зависти"},
  partner:{ru:"Партнёрская программа™",by:"co",dues:0,deedRu:"вступить может каждый",deed:()=>true,
    perk:"баллы, которые конвертируются в баллы",joke:"кассир шепчет: «не вступайте»"}
};
function socAll(){const S=G.soc||(G.soc={});S.m=S.m||{};S.left=S.left||{};S.c=S.c||{};return S;}
function socC(){const c=socAll().c;c.jumps=c.jumps|0;c.tapes=c.tapes|0;c.rides=c.rides|0;return c;}
function socCount(k){socC()[k]++;}
function socIn(id){return !!socAll().m[id];}
function socCanJoin(id){const D=SOC[id];return !!(D&&!socIn(id)&&D.deed());}
function socJoin(id){
  if(!socCanJoin(id))return false;
  const S=socAll();
  if(S.left[id]){if(G.credits<SOC_REJOIN){say("Восстановление — "+SOC_REJOIN+" кр",90);return false;}G.credits-=SOC_REJOIN;}
  S.m[id]={at:celDay(),dues:0};
  if(typeof thingAdd==="function")thingAdd("soccard","Членский билет · "+SOC[id].ru,"вступили делом: "+SOC[id].deedRu+" · льгота: "+SOC[id].perk,{soc:id});
  logAdd("good","Вы вступили: "+SOC[id].ru+" · льгота — "+SOC[id].perk+(SOC[id].dues?" · взнос "+Math.round(SOC[id].dues*100)+" % с заработка":""));
  return true;
}
function socLeave(id){
  const S=socAll();if(!S.m[id])return false;
  delete S.m[id];S.left[id]=1;
  logAdd("dim","Вы вышли: "+SOC[id].ru+" · билет сдан · вернуться — "+SOC_REJOIN+" кр");
  return true;
}
/* взносы: зовёт earn — видимая строка на странице КНИЖКИ, вычет сразу */
function socDues(sum){
  let d=0;const S=socAll();
  for(const id in S.m){const D=SOC[id];if(!D||!D.dues)continue;const x=Math.floor(sum*D.dues);if(x>0){S.m[id].dues=(S.m[id].dues|0)+x;d+=x;}}
  return d;
}
/* страница КНИЖКИ: общества — где вы, куда можно, чего не хватает */
function socPage(box){
  const S=socAll();
  tableRow(box,"head","","ОБЩЕСТВА · ВСТУПАЮТ ДЕЛОМ, А НЕ ВЗНОСОМ");
  for(const id in SOC){
    const D=SOC[id],row=document.createElement("div");row.className="li";
    const em=document.createElement("em");em.textContent=socIn(id)?"член":D.deed()?"можно":"—";
    const sp=document.createElement("span");
    sp.innerHTML="<b>"+D.ru+"</b> · "+D.perk+"<br><i>"+(socIn(id)?(D.dues?"взносы "+Math.round(D.dues*100)+" % · уплачено "+(S.m[id].dues|0)+" кр · ":"")+D.joke:"вступить: "+D.deedRu)+"</i>";
    const b=document.createElement("button");b.className="act sm";
    if(socIn(id)){b.textContent="ВЫЙТИ";b.onclick=e=>{e.stopPropagation();socLeave(id);tableRender();};}
    else{b.textContent=S.left[id]?"ВЕРНУТЬСЯ · "+SOC_REJOIN+" КР":"ВСТУПИТЬ";b.disabled=!D.deed();b.onclick=e=>{e.stopPropagation();if(socJoin(id))tableRender();};}
    sp.appendChild(document.createElement("br"));sp.appendChild(b);
    row.appendChild(em);row.appendChild(sp);box.appendChild(row);
  }
}
