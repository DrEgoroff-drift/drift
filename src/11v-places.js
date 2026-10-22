/* ══════════════ и что это, собственно, было ══════════════
   M151. Единичные места вне всяких областей, поставленные рукой — по одному
   на большую веху, никогда партией. УНИКАЛЬНЫ НА ВСЮ ИГРУ: не редкий тип
   генерации, а конкретное место с координатами. Встретить второе такое —
   значит задним числом обесценить первое, и этого не вернуть.
   Ничего не объясняется, не награждается, не пишется в журнал. Единственный
   след — имя, которое даст игрок (11u), и то, что его начнут повторять.

   ПРАВИЛА ФАЙЛА:
   1. Таблица конечна, адреса заданы рукой; звезда — ближайшая к адресу.
   2. Ни строки в журнале, ни подсказки на навигаторе. Видно — и всё. */

const PLACES=[
  {k:"tower",sx:23,sy:-31},    /* башня: тонкий столб с кольцом наверху, выше любой постройки */
  {k:"bowl", sx:-29,sy:27},    /* чаша: плоский диск в грунте, шире экрана */
  {k:"stair",sx:31,sy:33}      /* лестница: ступени вниз, которые ни во что не ведут */
];
let PLACES_AT=null;
function placesAll(){
  if(PLACES_AT)return PLACES_AT;
  PLACES_AT=[];
  for(const P of PLACES){
    let best=null,bd=1e9;
    for(let dx=-3;dx<=3;dx++)for(let dy=-3;dy<=3;dy++){
      const x=P.sx+dx,y=P.sy+dy;if(!starAt(x,y))continue;
      const d=dx*dx+dy*dy;if(d<bd){bd=d;best={k:P.k,sx:x,sy:y};}
    }
    if(best)PLACES_AT.push(best);
  }
  return PLACES_AT;
}
function placeAt(sx,sy){return placesAll().find(q=>q.sx===sx&&q.sy===sy)||null;}
function placeHere(p){
  const q=placeAt(G.sx,G.sy);if(!q||!p||!G.sys)return null;
  const first=(G.sys.planets||[]).find(x=>x.type!=="gas");
  return (first&&first.idx===p.idx)?q:null;
}
function placeX(tr,p){const r=rng(hashi(p.seed|0,0x9A,0x11));return clamp(tr.W*(.35+r()*.3),400,tr.W-400);}
/* вид — тела движка (21piig): башня с кольцом, чаша в грунте, лестница в яму */
