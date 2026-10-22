/* ДРЕЙФ — 2D-перо карты войны на сайте (M817).
 *
 * Перо игры (src/17z4-map-pen.js) пишет только в очереди видеокарты: 2D-ветки и
 * mp2d из игры ушли. Страница войны — 2D-страница, и эмблемам держав
 * (powerEmblem, 12al) ей нужно то же перо тем же договором — отрезок, ломаная,
 * окружность, круг — на текущий ctx. build.ps1 (War) кладёт этот модуль в
 * site/war.js на место 17z4. Каждый вызов ставит свои кисти и возвращает
 * прежние (save/restore): зовущий не теряет своих стилей.
 */
function mpLine(x0,y0,x1,y1,w,col){
  ctx.save();ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();ctx.restore();
}
/* ломаная pts=[x,y,x,y…] */
function mpPath(pts,w,col,closed){
  ctx.save();ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(pts[0],pts[1]);
  for(let i=2;i<pts.length;i+=2)ctx.lineTo(pts[i],pts[i+1]);if(closed)ctx.closePath();ctx.stroke();ctx.restore();
}
/* окружность (обвод) */
function mpCircle(x,y,r,w,col){
  ctx.save();ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();ctx.restore();
}
/* круг (заливка) */
function mpDisc(x,y,r,col){
  ctx.save();ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.restore();
}
