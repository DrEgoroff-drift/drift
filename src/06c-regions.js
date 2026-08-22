/* ══════════════ таблица областей: пятнадцать тем на одной решётке ══════════════
   M132. 06b даёт область каждой клетке решётки: имя, прибор, склон. Здесь поверх
   решётки кладётся ЗАКРЫТАЯ таблица — пятнадцать областей, у которых есть тема,
   свой прибор и своё ядро, и которые строятся по одной (M133–M146). Остальные
   области остаются процедурными: у них есть склон, но нет истории.

   ПРАВИЛА ФАЙЛА:
   1. Таблица конечна и одна на всю игру, как NODES: расстановка считается от
      посева и кэшируется, ничего не хранится в сейве.
   2. Тематическая область не рисует маркер и не подписана: отличие — только в
      имени (для журнала), приборе и том, что в ней построят потом.
   3. Два ядра не ближе двух прыжков на стоковом корабле. Иначе области
      наслаиваются и склон одной ломает склон другой.
   4. У каждой области есть обычное место: система с станцией, где просто
      торгуют. Область без такого — это загадка без быта, её не прочесть.
   5. Почтовый круг (post) — единственная область, где приборы МОЛЧАТ: amp=0.
      Это должно быть заметно именно потому, что везде они хоть чуть-чуть врут. */

const REGION_TABLE=[
  {id:"post",   ru:"Почтовый круг",      needle:null,     ring:1},
  {id:"mirror", ru:"Зеркало",            needle:"radio",  ring:2},
  {id:"lights", ru:"Три света",          needle:"actino", ring:2},
  {id:"hours",  ru:"Расхождение времён", needle:"chrono", ring:3},
  {id:"glow",   ru:"Свет, который помнит",needle:"actino",ring:2},
  {id:"grove",  ru:"Роща",               needle:"mass",   ring:3},
  {id:"keepers",ru:"Линия смотрителей",  needle:"course", ring:1},
  {id:"county", ru:"Большой уезд",       needle:"mass",   ring:1},
  {id:"charts", ru:"Несогласие карт",    needle:"course", ring:3},
  {id:"quiet",  ru:"Тихий уезд",         needle:"radio",  ring:2},
  {id:"slow",   ru:"Медленный",          needle:"chrono", ring:4},
  {id:"pass",   ru:"Перевал",            needle:"course", ring:4},
  {id:"grown",  ru:"Другое взросление",  needle:"mass",   ring:3},
  {id:"plan",   ru:"План",               needle:"radio",  ring:4},
  {id:"tin",    ru:"Жестяной край",      needle:"radio",  ring:4}
];
const REGION_GAP=2;            // минимум областей между двумя тематическими (Чебышёв)
const REGION_SALT2=0x2E611;

/* ── расстановка ──
   Кольцо в единицах области (1 — соседи начала, 4 — окраина, где опасность
   около половины). По кольцу идём с посеянного угла и берём первую область,
   чьё ядро — система со станцией и которая не ближе REGION_GAP к уже занятым. */
let REGION_PLACE=null;
function regionPlace(){
  if(REGION_PLACE)return REGION_PLACE;
  const byKey={},byId={},used=[];
  for(let i=0;i<REGION_TABLE.length;i++){
    const T=REGION_TABLE[i];
    const r=rng(hashi(i*31+5,REGION_SALT2,T.ring));
    const a0=r()*TAU;
    let found=null;
    for(let ring=T.ring;ring<=T.ring+2&&!found;ring++){
      /* клетки кольца в порядке обхода от посеянного угла */
      const cells=[];
      for(let x=-ring;x<=ring;x++)for(let y=-ring;y<=ring;y++)
        if(Math.max(Math.abs(x),Math.abs(y))===ring)cells.push({x,y,a:Math.atan2(y,x)});
      cells.sort((p,q)=>((p.a-a0+TAU*2)%TAU)-((q.a-a0+TAU*2)%TAU));
      for(const c of cells){
        if(byKey[c.x+","+c.y])continue;
        let near=false;
        for(const u of used)if(Math.max(Math.abs(u.x-c.x),Math.abs(u.y-c.y))<REGION_GAP){near=true;break;}
        if(near)continue;
        const core=regionCore(c.x,c.y,rng(hashi(c.x,c.y,REGION_SALT)));
        const S=getSystem(core.sx,core.sy);
        if(!S||!S.station)continue;
        /* правило 4: обычное место на окраине области */
        if(!regionPlainSys(c.x,c.y,core))continue;
        found={rx:c.x,ry:c.y};
      }
    }
    /* не нашлось — область остаётся без места; набор это поймает */
    if(found){byKey[found.rx+","+found.ry]=T;byId[T.id]=found;used.push({x:found.rx,y:found.ry});}
  }
  return REGION_PLACE={byKey,byId};
}
/* система области, где просто торгуют: станция, не ядро, опасность невысока */
function regionPlainSys(rx,ry,core){
  const bx=rx*REGION_SPAN,by=ry*REGION_SPAN;
  for(let x=bx;x<bx+REGION_SPAN;x++)for(let y=by;y<by+REGION_SPAN;y++){
    if(x===core.sx&&y===core.sy)continue;
    if(!starAt(x,y)||sysDanger(x,y)>.6)continue;
    const S=getSystem(x,y);
    if(S&&S.station)return {sx:x,sy:y};
  }
  return null;
}
/* тема области по её ключу решётки — или null для процедурной */
function regionThemeAt(rx,ry){return regionPlace().byKey[rx+","+ry]||null;}
/* где стоит тематическая область: {rx,ry} или null */
function regionOfTheme(id){return regionPlace().byId[id]||null;}
