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
/* ── вид (G6) ──
   Три вещи стояли плоской заливкой с белым контуром — схемой, а не вещью.
   Теперь они под тем же солнцем, что грунт (placeShade, 11va): у башни бок к
   звезде и бок в тени, кольцо — литое, с толщиной, и тень столба ложится по
   грунту на полэкрана; у чаши внутренняя стенка затенена, дальняя кромка
   ловит свет, в чаше лежит небо; у лестницы проступь светлее подступёнка.
   Ни надписи, ни знака (PASSPORTS: на чужом — тишина вместо орнамента). */
function placeDraw(tr,camx,camy,p){
  const q=placeHere(p);if(!q)return;
  const x0=placeX(tr,p),sx=x0-camx;
  if(sx<-W||sx>W*2)return;
  const y=groundAt(tr,x0)-camy;
  const base=p.T.pal[2].map(v=>Math.round(v*.4+30));
  const L=placeSun(p);
  if(q.k==="tower"){
    /* тень столба: низкое солнце кладёт её далеко, полуденное — под ноги */
    const lean=clamp(1-Math.abs((typeof SUN_DIR==="object")?SUN_DIR.y:-.8),0,1);
    const sl=-L.sx*(40+lean*420);
    ctx.fillStyle="rgba(0,0,0,"+(.26*L.k).toFixed(3)+")";
    ctx.beginPath();ctx.moveTo(sx-4,y);ctx.lineTo(sx+4,y);ctx.lineTo(sx+sl+2,y+3);ctx.lineTo(sx+sl-2,y+3);ctx.closePath();ctx.fill();
    placeShade(()=>{ctx.moveTo(sx-5,y+2);ctx.lineTo(sx-3.4,y-520);ctx.lineTo(sx+3.4,y-520);ctx.lineTo(sx+5,y+2);ctx.closePath();},
      sx-5,y-520,sx+5,y+2,base,p,0x9A70,{ao:.2});
    /* кольцо: тор, у которого верх светлее низа, а бок к звезде теплее */
    const cy=y-540;
    for(const [r,wd] of [[24,4.2]]){
      ctx.lineWidth=wd;ctx.strokeStyle=sdRGB(sdMix(base,[0,0,0],.25));
      ctx.beginPath();ctx.arc(sx,cy,r,0,TAU);ctx.stroke();
      ctx.lineWidth=1.2;ctx.strokeStyle=rgba(p.T.sky[0],.35);
      ctx.beginPath();ctx.arc(sx,cy,r+wd*.3,Math.PI*1.05,Math.PI*1.95);ctx.stroke();
      if(L.k>.02){
        const a0=L.sx>0?-Math.PI*.45:Math.PI*.55;
        ctx.strokeStyle=rgba(sdMix(L.col,[255,255,255],.35),.6*L.k);
        ctx.beginPath();ctx.arc(sx,cy,r+wd*.25,a0,a0+Math.PI*.9);ctx.stroke();
      }
    }
  }else if(q.k==="bowl"){
    /* губа чаши над грунтом, внутренняя стенка уходит в тень, на дне — отсвет неба */
    placeShade(()=>{ctx.ellipse(sx,y+6,720,30,0,0,Math.PI);},sx-720,y+6,sx+720,y+36,base,p,0x9A71,{ao:.1});
    const gi=ctx.createLinearGradient(0,y+6,0,y+28);
    gi.addColorStop(0,"rgba(4,5,8,.62)");gi.addColorStop(.7,"rgba(4,5,8,.30)");gi.addColorStop(1,rgba(p.T.sky[0],.16));
    ctx.fillStyle=gi;ctx.beginPath();ctx.ellipse(sx,y+6,700,22,0,0,Math.PI);ctx.fill();
    ctx.strokeStyle=rgba(sdMix(L.col,p.T.sky[0],.5),.18+.3*L.k);ctx.lineWidth=1.3;
    ctx.beginPath();ctx.ellipse(sx,y+6,700,22,0,Math.PI*.04,Math.PI*.96);ctx.stroke();
  }else{
    /* ступени вниз: подступёнок в тени, проступь светлая — каждая ловит небо */
    for(let i=0;i<9;i++){
      const x=sx+i*14,yy=y-2+i*9,w=140-i*14;
      placeShade(()=>{ctx.rect(x,yy,w,9);},x,yy,x+w,yy+9,sdMix(base,[0,0,0],i*.05),p,0x9A72+i,{ao:.45});
      ctx.fillStyle=rgba(sdMix(p.T.sky[0],L.col,L.k*.5),.22+.2*L.k);ctx.fillRect(x+1,yy,w-1,1.4);
    }
  }
}
