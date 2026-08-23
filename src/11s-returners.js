/* ══════════════ возвращение: люди моложе своих внуков ══════════════
   M147-returners. Край дальних рейсов (06c, слот `tin`, игла хронометра): верфи,
   пересадочные станции, конторы, пишущие «длинные» контракты. На окраине —
   разговоры о кораблях, которых ждут; семьи, ждущие третьим поколением;
   комнаты, которые держат готовыми.

   ЯДРО — СТАНЦИЯ ВЕРНУВШИХСЯ: люди моложе собственных внуков. Мира, из которого
   они улетали, нет, и они это знают. НИКАКОЙ ТРАГЕДИИ В КАМЕРУ: играют в
   домино, работают, жалуются на снабжение.
   Табло прибытий, где половина строк просрочена на годы, и никто его не чистит.
   ИГЛА — ХРОНОМЕТР, тот же, что в уезде часов, и ведёт себя иначе: он должен
   обмануть игрока ровно один раз. До первой стыковки в ядре он уходит, как
   в уезде часов; после — стоит, и больше никогда.

   ПРАВИЛА ФАЙЛА:
   1. Ни одной строки про потерю. Быт, домино, снабжение.
   2. Хранится G.ret={seen}: была ли первая стыковка. */

const RET_ETHER=[
  "…«Сажень» ждём с четверга. Какого — не уточняли.",
  "…комнату не сдавайте, он вернётся. Дед так говорил. Не сдавайте.",
  "…контракт длинный, на три смены. Внуки встретят."
];
const RET_BOARD=[["«Сажень»",38],["«Окоём»",0],["«Верста»",61],["«Лихва»",0],["«Поволока»",112],["«Ряд»",0]];
function retAll(){return (G.ret||(G.ret={seen:0}));}
function retDepthAt(sx,sy){
  if(typeof regionAt!=="function")return 0;
  const R=regionAt(sx,sy);
  if(R.theme!=="tin")return 0;
  return (R.core.sx===sx&&R.core.sy===sy)?2:1;
}
function retDepthHere(){return retDepthAt(G.sx,G.sy);}
function retEtherLine(r){
  if(retDepthHere()!==1||r()>.3)return null;
  return pick(RET_ETHER,r);
}
function retGroundLine(){
  return retDepthHere()===1?"Комната прибрана. Кровать застелена. Ждут.":null;
}
/* обман ровно один раз: до первой стыковки в ядре хронометр уходит на час */
function retDrift(){
  return (retDepthHere()===2&&!retAll().seen)?.72:0;
}
function retDock(){
  if(retDepthHere()!==2)return null;
  const R=retAll();
  const first=!R.seen;R.seen=1;
  const line=first?"Домино? Садитесь. Снабжение опять задержали, третий месяц.":"А, это вы. Садитесь, партия как раз.";
  logAdd("dim","Вернувшиеся: "+line);
  return {line,first};
}
/* табло прибытий в кантине: половина строк просрочена, и никто его не чистит */
function retBlock(){
  if(retDepthHere()!==2)return;
  $body.appendChild(el("div","sec","ТАБЛО ПРИБЫТИЙ"));
  let rows=RET_BOARD.map(([nm,late])=>"<s"+(late?" style='color:#c9a45a'":"")+">"+nm+" · "+(late?"задерживается · "+late+" лет":"прибыл")+"</s>").join("<br>");
  if(typeof expDeparted==="function"&&expDeparted()&&G.exp.said)rows+="<br><s style='color:#6f7b86'> — · ушли · не ждут</s>";   /* строка без имени (M159) */
  if(typeof islandReturned==="function")for(const w of islandReturned())rows+="<br><s style='color:#8fd08a'>"+w+" · вернулся с Острова</s>";   /* M160 */
  if(typeof sixthGone==="function"&&sixthGone())rows+="<br><s style='color:#8a94a0'>Варламова З. · убыла · не ждут</s>";   /* шестая (M157) */
  $body.appendChild(el("div","row","<div class='nm'>"+rows+"</div>"));
}
