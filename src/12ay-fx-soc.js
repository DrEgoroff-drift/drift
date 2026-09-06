/* ══════════════ семья механик: ОБЩЕСТВО (M383, §15.1) ══════════════
   Люди в этой игре и так есть — наёмники, клерки, хранители, соседи. Здесь они
   начинают ЗАМЕЧАТЬ войну: после захвата снимаются с места, на станции бывает
   забастовка, в занятой системе бывает бунт, у державы бывает праздник, а
   раз в квартал секта уводит станцию в тихий уезд.

   Правило семьи то же: последствие вычисляется из летописи и держится ровно
   свой срок. Ни одно из них не отнимает у игрока вещей — они меняют ЦЕНУ ТРУДА,
   ОТКРЫТОСТЬ СЛУЖБ и ТИШИНУ, то есть условия работы, а не её результат. */
const SOC_REFUGEE=16;      /* четверо суток переселения */
const SOC_STRIKE=4;        /* сутки забастовки */
const SOC_HOLIDAY=4;       /* сутки праздника */
const SOC_CULT=28;         /* неделя тихого уезда */
const SOC_REVOLT=12;       /* трое суток, пока бунт может кончиться сменой флага */
function socInc(kind,span){
  return (typeof chronIncOf==="function")?chronIncOf(kind,span):null;
}
function socOwnerIs(sx,sy,p){
  if(typeof chronOwner!=="function")return false;
  return chronOwner(sx===undefined?G.sx:sx,sy===undefined?G.sy:sy)===p;
}
/* ── переселение ──
   «После оккупации люди уезжают в соседние системы; постоялые дворы растут,
   труд дешевеет». Труд — это наёмники: у соседа их берут дешевле, потому что
   их там много и они не выбирают. */
function socRefugeeNear(sx,sy){
  const inc=socInc("refugee",SOC_REFUGEE);
  if(!inc||typeof chronOwner!=="function")return false;
  sx=(sx===undefined)?G.sx:sx;sy=(sy===undefined)?G.sy:sy;
  if(socOwnerIs(sx,sy,inc.p))return false;         /* оттуда уехали, а не туда */
  for(const d of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]])
    if(socOwnerIs(sx+d[0],sy+d[1],inc.p))return true;
  return false;
}
function socWageMul(){return socRefugeeNear()?.75:1;}
/* ── забастовка ──
   Станция стоит: док и лаборатория закрыты, заправка работает. Это тот же
   список служб, что у оккупации, и это не совпадение — закрывают всегда одно
   и то же. */
function socStrikeHere(){
  const inc=socInc("strike",SOC_STRIKE);
  return !!(inc&&socOwnerIs(G.sx,G.sy,inc.p));
}
function socService(kind){
  if(!socStrikeHere())return true;
  return kind==="fuel";
}
/* ── праздник ──
   Парад в строю, скидка на прилавке и волна, которая поёт. Скидка небольшая:
   праздник — это про то, что сегодня иначе, а не про то, что сегодня выгодно. */
function socHolidayHere(){
  const inc=socInc("holiday",SOC_HOLIDAY);
  return !!(inc&&socOwnerIs(G.sx,G.sy,inc.p));
}
/* ── тихий уезд секты ──
   Готовая механика (11n `quietNoPirates`) получает второй повод: раз в квартал
   станция уходит в тишину, и в этой системе никто не грабит. */
function socCultHere(sx,sy){
  const inc=socInc("cult",SOC_CULT);
  return !!(inc&&socOwnerIs(sx,sy,inc.p));
}
/* ── бунт ──
   В свежезанятой системе бунт кончается сменой флага, ЕСЛИ толпа его поддержала:
   счётчик обороны в ведомости этой системы. Никакого «нажми, чтобы восстать» —
   поддержка выражается тем же, чем всегда: делом. */
function socRevoltReady(sx,sy){
  const inc=socInc("revolt",SOC_REVOLT);
  if(!inc)return false;
  sx=(sx===undefined)?G.sx:sx;sy=(sy===undefined)?G.sy:sy;
  if(typeof occPowerAt!=="function"||!occPowerAt(sx,sy))return false;
  if(typeof warLedger!=="function")return false;
  const N=(typeof chronNow==="function")?chronNow():0;
  const key=(sx|0)+","+(sy|0);
  let q=0;
  for(let n=N-SOC_REVOLT;n<=N;n++){
    const L=warLedger(n);
    if(!L||!L[key]||!L[key].def)continue;
    q+=L[key].def.q|0;
  }
  return q>=60;
}
/* ── один множитель для прилавка и один для пиратов ── */
function socPriceMul(sx,sy){
  let m=1;
  const inc=socInc("holiday",SOC_HOLIDAY);
  if(inc&&socOwnerIs(sx,sy,inc.p))m*=.9;
  const st=socInc("strike",SOC_STRIKE);
  if(st&&socOwnerIs(sx,sy,st.p))m*=1.1;            /* стоит станция — дороже всё */
  return m;
}
function socPirateMul(sx,sy){
  return socCultHere(sx===undefined?G.sx:sx,sy===undefined?G.sy:sy)?0:1;
}
/* строка для доски */
function socLine(){
  const out=[];
  if(socStrikeHere())out.push("ЗАБАСТОВКА · РАБОТАЕТ ТОЛЬКО ЗАПРАВКА");
  if(socHolidayHere())out.push("ПРАЗДНИК · ПАРАД И СКИДКА");
  if(socCultHere(G.sx,G.sy))out.push("ТИХИЙ УЕЗД · ЗДЕСЬ НЕ ГРАБЯТ");
  if(socRefugeeNear())out.push("ПЕРЕСЕЛЕНЦЫ · НАЁМНИКИ ДЕШЕВЛЕ");
  if(socRevoltReady())out.push("БУНТ · ТОЛПА ПОДДЕРЖАЛА");
  return out.join(" · ");
}
