/* ══════════════ имена мест галактики (M449, DESIGN-galaxy §M449) ══════════════
   Два рукава и десять туманностей названы голосом игры — как их зовут
   водители, а не астрономы: «Долгий рукав», а не «рукав A». На карте — тихие
   подписи только на отъезде (клетка меньше 24 px): имя рукава лежит вдоль
   самого рукава, туманность — точка и слово. В карточке системы — одно слово:
   «Долгий рукав», «межрукавье», «туманность «Печка»». Место — геометрия
   модели 17z1: угол рукава на радиусе r — из той же логарифмической спирали. */
const GAL_ARMS=[
  {ru:"Долгий рукав",ph:GAL_BAR_A,pitch:GAL_PITCH,k:0},
  {ru:"Рыжий рукав", ph:GAL_BAR_A+Math.PI/2+.4,pitch:Math.tan(19*Math.PI/180),k:0}
];
/* угол рукава на радиусе r (k — какая из двух ветвей с периодом π) */
function galArmTh(A,r,k){return A.ph+Math.log(Math.max(r,GAL_R0)/GAL_R0)/A.pitch+(k||0)*Math.PI;}
function galArmPt(A,r,k,off){const th=galArmTh(A,r,k);const d=(off||0);return {x:Math.cos(th)*r-Math.sin(th)*d,y:Math.sin(th)*r+Math.cos(th)*d};}
/* туманности: на рукавах, по одной на радиус, имена — из кабины */
const GAL_NEBULAE=[
  {ru:"Печка",       a:0,r:8, k:0,off:.6},
  {ru:"Молоко",      a:0,r:12,k:1,off:-.8},
  {ru:"Сивая",       a:0,r:16,k:0,off:.9},
  {ru:"Двойня",      a:0,r:20,k:1,off:.3},
  {ru:"Ржавая",      a:0,r:25,k:0,off:-.7},
  {ru:"Тёплый угол", a:1,r:9, k:0,off:.5},
  {ru:"Комариная",   a:1,r:13,k:1,off:.4},
  {ru:"Синяя вдова", a:1,r:18,k:0,off:-.6},
  {ru:"Пустая",      a:1,r:23,k:1,off:.8},
  {ru:"Гнилой угол", a:1,r:28,k:0,off:-.4}
].map(n=>Object.assign(n,galArmPt(GAL_ARMS[n.a],n.r,n.k,n.off)));
/* где стоит сектор: рукав (по модели, arm>.45), туманность (в 2.2 секторах), межрукавье */
function galPlaceName(sx,sy){
  for(const n of GAL_NEBULAE)if(Math.hypot(n.x-sx,n.y-sy)<2.2)return "туманность «"+n.ru+"»";
  const r=Math.hypot(sx,sy);
  if(r<GAL_BAR_L*.7)return "ядро";
  let best=null,bd=1e9;
  for(const A of GAL_ARMS){const d=Math.abs(galArmD(r,Math.atan2(sy,sx),A.ph,A.pitch));if(d<bd){bd=d;best=A;}}
  return (best&&bd<2.2+.06*r)?best.ru:"межрукавье";
}
/* карта: подписи на отъезде. Рукав — вдоль дуги в трёх точках, туманности — точкой и словом */
function drawGalaxyNames(V,cell){
  if(cell>=24)return;
  const k=clamp((24-cell)/10,0,1);          /* проявляются по мере отъезда */
  const X=x=>W/2+(x-V.x)*cell,Y=y=>H/2+(y-V.y)*cell;
  ctx.save();ctx.textAlign="center";ctx.textBaseline="middle";
  for(const A of GAL_ARMS)for(const [r,kk] of [[14,0],[24,1]]){
    const p=galArmPt(A,r,kk,0),q=galArmPt(A,r+.5,kk,0),x=X(p.x),y=Y(p.y);
    if(x<-80||x>W+80||y<-40||y>H+40)continue;
    let a=Math.atan2(Y(q.y)-y,X(q.x)-x);if(Math.cos(a)<0)a+=Math.PI;   /* читается слева направо */
    ctx.save();ctx.translate(x,y);ctx.rotate(a);
    ctx.font=(11*mapU()).toFixed(1)+"px ui-monospace,monospace";
    ctx.fillStyle="rgba(200,214,255,"+(.42*k).toFixed(2)+")";
    const t=A.ru.toUpperCase().split("").join(" ");   /* разрядка: слово лежит на рукаве, а не стоит поверх */
    ctx.fillText(t,0,0);ctx.restore();
  }
  ctx.font=(9*mapU()).toFixed(1)+"px ui-monospace,monospace";
  for(const n of GAL_NEBULAE){
    const x=X(n.x),y=Y(n.y);
    if(x<-60||x>W+60||y<-30||y>H+30)continue;
    ctx.fillStyle="rgba(255,190,220,"+(.55*k).toFixed(2)+")";
    ctx.beginPath();ctx.arc(x,y,1.6,0,TAU);ctx.fill();
    ctx.fillStyle="rgba(230,214,236,"+(.5*k).toFixed(2)+")";
    ctx.fillText(n.ru.toLowerCase(),x,y+10);
  }
  ctx.restore();
}
