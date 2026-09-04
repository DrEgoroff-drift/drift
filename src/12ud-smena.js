/* ══════════════ «Смена»: роман, который читается, когда прожит (M353) ══════════════
   Книга уже написана (docs/SMENA.md, 72 главы в восьми частях; библия — docs/SAGA.md,
   разбивка и крючки — docs/SAGA-BOOK.md). Восемь частей романа — восемь глав отчёта
   «Долгого Хода» и восемь граф жизни игрока, в том же порядке. Игра этого не говорит.

   МЕХАНИКА. На столе лежит переплетённый том. Глава открывается чернилами, когда игрок
   её ПРОЖИЛ: у каждой главы предикат — то событие, которым она «играется» по SAGA-BOOK.
   Неоткрытая показывает название, часть и одну строку, где это слышно. Порядок чтения —
   игрока; порядок книги — порядок смысла. Рядом с частью — «отчёт: собрано N из M» (второе
   чтение, SAGA-BOOK «Порядок постройки» №5).

   ПРАВИЛА ФАЙЛА:
   1. Текст — только SMENA_TEXT (генерируется из markdown); здесь ни одной строки прозы.
   2. Предикат = событие, после которого игрок это прожил. Там, где у области нет своего
      поля, берётся ближайшее честное: сама область, а не «время». Открытая глава остаётся
      открытой (G.smena — список номеров), даже если предикат потом стал ложным.
   3. Никакого маркера и никакого «куда лететь»: строка «где» называет канал, не адрес. */
const SMENA_PARTS=[
  {n:1,ru:"Подряд", lore:"podryad"},{n:2,ru:"Плечо",  lore:"plecho"},
  {n:3,ru:"Соседи", lore:"sosedi"}, {n:4,ru:"Счёт",   lore:"schet"},
  {n:5,ru:"Прибой", lore:"priboy"}, {n:6,ru:"Раскол", lore:"raskol"},
  {n:7,ru:"Тишина", lore:"tishina"},{n:8,ru:"Тихоня", lore:"tihonya"}
];
function smenaPartOf(ch){return Math.min(8,Math.floor((ch-1)/9)+1);}
const smK=o=>!!o&&typeof o==="object"&&Object.keys(o).length>0;
const smL=id=>(typeof loreChapter==="function")?loreChapter(id).read:false;
const smArr=a=>Array.isArray(a)&&a.length>0;
/* область заводит запись с нулями при первом касании — считаем только по полям прогресса */
const smP=(o,...ks)=>!!o&&typeof o==="object"&&ks.some(k=>{const v=o[k];return Array.isArray(v)?v.length>0:(typeof v==="number"?v>0:!!v);});
/* где это слышно — канал, не адрес */
const SMENA_CH=[
  [1, "док нуля-нуля",                   ()=>true],
  [2, "первая честная продажа и дом",    ()=>!!G.home&&(G.soldTotal|0)>0],
  [3, "свёрток почтового круга",         ()=>smP(G.post,"stage","opened","done")],
  [4, "первая зарубка отчёта",           ()=>(typeof loreCount==="function")&&loreCount()>0],
  [5, "стойка кантины",                  ()=>smK(G.visits)],
  [6, "большой уезд",                    ()=>smP(G.county,"called","answered","saw")],
  [7, "станция смотрителя",              ()=>smP(G.keepers,"fed","given","signed")],
  [8, "рукав, который гаснет",           ()=>smP(G.keepers,"gone")],
  [9, "первая глава отчёта прочитана",   ()=>smL("podryad")],
  [10,"первая машина на точке",          ()=>smArr(G.droneIds)||smArr(G.drones)],
  [11,"первый наёмник",                  ()=>smArr(G.crew)||smK(G.fleetLog)],
  [12,"зеркало эфира",                   ()=>smP(G.mirror,"bearing")],
  [13,"три света",                       ()=>smP(G.lights,"seen")],
  [14,"ставни при третьем свете",        ()=>!!G.lights&&(G.lights.seen|0)>=2],
  [15,"луг, который светится",           ()=>smP(G.grove,"turn","shot","cut")||smP(G.slow,"round")],
  [16,"первая база",                     ()=>smK(G.bases)],
  [17,"«Желание-1»",                     ()=>smK(G.vega)],
  [18,"вторая глава отчёта прочитана",   ()=>smL("plecho")],
  [19,"Жестянка",                        ()=>smK(G.tin)],
  [20,"посёлок",                         ()=>smK(G.settle)],
  [21,"дорожка от посёлка к машине",     ()=>smK(G.settle)&&smP(G.grown,"recip")],
  [22,"другое взросление",               ()=>smP(G.grown,"recip")],
  [23,"роща",                            ()=>smP(G.grove,"turn","shot","cut")],
  [24,"пять слов отчёта",                ()=>(typeof loreVocab==="function")&&loreVocab().length>=5],
  [25,"медленная долина",                ()=>smP(G.slow,"round","fig")],
  [26,"птица с позывным",                ()=>smK(G.parrot)],
  [27,"третья глава отчёта прочитана",   ()=>smL("sosedi")],
  [28,"расхождение времён",              ()=>smP(G.hours,"man")],
  [29,"чужой след",                      ()=>smK(G.trace)],
  [30,"первая лента самописца",          ()=>smArr(G.strips)],
  [31,"чужие карты",                     ()=>!!G.charts&&((G.charts.have|0)>0||(G.charts.lost|0)>=0)],
  [32,"три ленты на столе",              ()=>smArr(G.strips)&&G.strips.length>=3],
  [33,"кольцо",                          ()=>smK(G.ring)],
  [34,"институт",                        ()=>smK(G.inst)],
  [35,"аппетит узла и наряд",            ()=>smK(G.hold)||smK(G.order)],
  [36,"четвёртая глава отчёта прочитана",()=>smL("schet")],
  [37,"срок",                            ()=>smK(G.doom)],
  [38,"люди в трюме",                    ()=>smK(G.doom)&&((G.cargo&&G.cargo.folk>0)||smArr(G.bargePax))],
  [39,"те, кто не поместился",           ()=>smK(G.doom)&&((G.doom.lost|0)>0)],
  [40,"комбинат",                        ()=>smP(G.plan,"took","hauled")],
  [41,"изделие",                         ()=>smP(G.plan,"hauled")],
  [42,"перевал",                         ()=>smP(G.pass,"lit","told")],
  [43,"прибой",                          ()=>smK(G.doom)&&smP(G.pass,"lit","told")],
  [44,"подшито",                         ()=>smK(G.inst)&&smK(G.doom)],
  [45,"пятая глава отчёта прочитана",    ()=>smL("priboy")],
  [46,"ультиматум",                      ()=>smArr(G.mgrs)&&G.mgrs.some(m=>(m.loy|0)<50)||smArr(G.rogues)],
  [47,"свой флагман",                    ()=>smArr(G.rogues)||smArr(G.exiles)],
  [48,"остров",                          ()=>smK(G.island)],
  [49,"письмо вместо оружия",            ()=>smK(G.island)&&smK(G.mailed)],
  [50,"эстафета следов",                 ()=>smK(G.trace)&&smK(G.island)],
  [51,"шестая",                          ()=>smK(G.exp)],
  [52,"раскол",                          ()=>smArr(G.rogues)||smArr(G.exiles)],
  [53,"ты — трест",                      ()=>smArr(G.exiles)||(smArr(G.mgrs)&&G.mgrs.length>=2)],
  [54,"шестая глава отчёта прочитана",   ()=>smL("raskol")],
  [55,"шестьдесят дней",                 ()=>smK(G.exp)],
  [56,"«возьмите меня туда»",            ()=>smK(G.exp)&&!!G.exp.offered],
  [57,"возвращение",                     ()=>smP(G.ret,"seen")],
  [58,"строка без имени",                ()=>smP(G.ret,"seen")],
  [59,"последний рейс",                  ()=>smK(G.letters)],
  [60,"ушли",                            ()=>smK(G.exp)&&!!G.exp.quietUntil],
  [61,"«есть место»",                    ()=>smK(G.exp)&&!!G.exp.offered],
  [62,"тихий уезд",                      ()=>smP(G.quiet,"stay")],
  [63,"седьмая глава отчёта прочитана",  ()=>smL("tishina")],
  [64,"съёмка поверх карты",             ()=>smK(G.ring)&&(typeof loreCount==="function")&&loreCount()>=50],
  [65,"форма",                           ()=>(typeof loreChaptersRead==="function")&&loreChaptersRead()>=4],
  [66,"кольцо — тоже смена",             ()=>smK(G.ring)&&(typeof loreChaptersRead==="function")&&loreChaptersRead()>=6],
  [67,"трудовая книжка",                 ()=>smK(G.record)],
  [68,"ученик",                          ()=>smK(G.trainee)],
  [69,"вымпел",                          ()=>smK(G.penn)||smArr(G.probes)],
  [70,"комиссия",                        ()=>smK(G.late)],
  [71,"сто первая",                      ()=>smK(G.walled)],
  [72,"восьмая глава отчёта прочитана",  ()=>smL("tihonya")]
];
function smenaRec(){if(!Array.isArray(G.smena))G.smena=[];return G.smena;}
function smenaIsOpen(n){return smenaRec().indexOf(n)>=0;}
/* открыть то, что прожито; вызывается при открытии стола — лениво, как всё */
function smenaSync(){
  const S=smenaRec();let fresh=0;
  for(const [n,,f] of SMENA_CH){
    if(S.indexOf(n)>=0)continue;
    let ok=false;try{ok=!!f();}catch(e){ok=false;}
    if(ok){S.push(n);fresh++;}
  }
  if(fresh&&typeof logAdd==="function")logAdd("dim","«Смена»: "+(fresh===1?"открылась глава":"открылись главы")+" — на столе");
  return fresh;
}
function smenaCount(){return smenaRec().length;}
function smenaWhere(n){const r=SMENA_CH[n-1];return r?r[1]:"";}
let smenaOpenCh=0;
function renderSmena(box){
  box.innerHTML="";
  smenaSync();
  tableRow(box,"dim","","«Смена» · роман · открыто "+smenaCount()+" из 72 · глава открывается, когда прожита");
  for(const P of SMENA_PARTS){
    const L=(typeof loreChapter==="function")?loreChapter(P.lore):null;
    tableRow(box,"head","","ЧАСТЬ "+["I","II","III","IV","V","VI","VII","VIII"][P.n-1]+" · "+P.ru.toUpperCase()+
      (L?" · отчёт: собрано "+L.have+" из "+L.total:""));
    for(let n=(P.n-1)*9+1;n<=P.n*9;n++){
      const open=smenaIsOpen(n),t=SMENA_TITLE[String(n)]||"";
      const row=document.createElement("div");row.className="li"+(open?"":" dim");
      const em=document.createElement("em");em.textContent=String(n);
      const sp=document.createElement("span");
      sp.textContent=open?t:(t+" · "+smenaWhere(n));
      row.appendChild(em);row.appendChild(sp);
      if(open){
        row.style.cursor="pointer";
        row.onclick=()=>{smenaOpenCh=(smenaOpenCh===n)?0:n;renderSmena(box);};
        box.appendChild(row);
        if(smenaOpenCh===n){
          const txt=document.createElement("div");txt.className="smena";
          for(const p of (SMENA_TEXT[String(n)]||[])){
            const el2=document.createElement(p==="· · ·"?"hr":"p");
            if(p==="· · ·"){el2.className="scene";}
            else if(p.startsWith("> ")){el2.className="journal";el2.textContent=p.slice(2);}
            else if(p.startsWith("*")&&p.endsWith("*")){el2.className="cap";el2.textContent=p.slice(1,-1);}
            else el2.textContent=p;
            txt.appendChild(el2);
          }
          box.appendChild(txt);
        }
      }else box.appendChild(row);
    }
  }
}
