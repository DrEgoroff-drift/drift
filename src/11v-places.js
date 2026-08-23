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
function placeDraw(tr,camx,camy,p){
  const q=placeHere(p);if(!q)return;
  const x0=placeX(tr,p),sx=x0-camx;
  if(sx<-W||sx>W*2)return;
  const y=groundAt(tr,x0)-camy;
  const col="rgb("+p.T.pal[2].map(v=>Math.round(v*.4+30)).join(",")+")";
  ctx.fillStyle=col;ctx.strokeStyle="rgba(226,236,240,.3)";ctx.lineWidth=1;
  if(q.k==="tower"){
    ctx.fillRect(sx-4,y-520,8,520);ctx.strokeRect(sx-4.5,y-520.5,9,521);
    ctx.beginPath();ctx.arc(sx,y-540,26,0,TAU);ctx.stroke();ctx.beginPath();ctx.arc(sx,y-540,22,0,TAU);ctx.stroke();
  }else if(q.k==="bowl"){
    ctx.beginPath();ctx.ellipse(sx,y+6,720,30,0,0,Math.PI);ctx.fill();ctx.stroke();
    ctx.fillStyle="rgba(0,0,0,.35)";ctx.beginPath();ctx.ellipse(sx,y+6,700,22,0,0,Math.PI);ctx.fill();
  }else{
    for(let i=0;i<9;i++){ctx.fillRect(sx+i*14,y-2+i*9,140-i*14,9);ctx.strokeRect(sx+i*14+.5,y-1.5+i*9,140-i*14-1,9);}
  }
}
