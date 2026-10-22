/* ══════════════ законы поверхности: вещи не стоят друг на друге (22.10) ══════════════ */
/* Фазз по зёрнам (tests/91qm-seeds) нашёл три брака, которые живут в генерации, а не в рисовании:
   — залежь под кораблём (7 миров из 20): у корабля ДЕЙСТВИЕ принадлежит кораблю, бурить её нельзя;
   — памятник на устье пещеры (2 мира): genPOI ставит постройку раньше, чем surfGen бросает устье,
     и не знает о нём;
   — площадка в озере (океанский мир): самую глубокую ложбину ищут не под площадкой, но уровень
     разливается дальше и накрывает её.
   Генераторы (20a, 21-mode-surface, 21e) только на чтение, поэтому законы — обёрткой: поток r()
   не сдвигается, миры без брака остаются в точности теми же, исправленные меняются ровно настолько,
   насколько нужно. */
const SURF_LAW={
  zone:110,      /* px: шире самого большого корабля (130·.75) — зона не зависит от того, на чём сел */
  mouth:150,     /* px: от устья до памятника (тест мерит 120) */
  keep:300       /* px: устье от площадки — как у surfGen, не ближе трёх зон */
};
/* ── озеро не доходит до площадки ──
   Уровень поднимается (вода мельчает) до гребня между ложбиной и площадкой, чтобы урез остановился
   на зону раньше корабля. Короче двухсот шагов — это лужа, и озера нет совсем. */
const SURF_LAW_WATER=waterOf;
waterOf=function(tr,p){
  const had=tr.water!==undefined,Wt=SURF_LAW_WATER.apply(this,arguments);
  if(had||!Wt)return Wt;
  const Z=SURF_LAW.zone,px=tr.padX;
  if(!(px>Wt.x0-Z&&px<Wt.x1+Z))return Wt;
  const st=tr.step,i0=Math.round(((Wt.x0+Wt.x1)/2)/st),m=Math.ceil(Z/st)+2;
  /* дно — самая глубокая точка внутри зеркала (от неё разливался уровень) */
  let ib=Math.round(Wt.x0/st),yb=-1e9;
  for(let i=Math.round(Wt.x0/st);i<=Math.round(Wt.x1/st);i++)if(Math.abs(i-tr.padI)>=70&&tr.h[i]>yb){yb=tr.h[i];ib=i;}
  if(yb<-1e8)ib=i0;
  /* гребень на пути от дна к площадке, не доходя зоны: выше его вода не поднимется */
  const toR=tr.padI>ib,stop=toR?tr.padI-m:tr.padI+m;
  let crest=1e9;
  for(let i=ib;toR?i<=stop:i>=stop;i+=toR?1:-1)crest=Math.min(crest,tr.h[i]);
  const level=Math.max(Wt.y,crest+2);
  if(level>=yb){tr.water=null;return null;}
  let a=ib,b=ib;
  while(a>1&&tr.h[a-1]>level)a--;
  while(b<tr.N-2&&tr.h[b+1]>level)b++;
  const x0=a*st,x1=b*st;
  if(x1-x0<WATER_MIN_SPAN||(px>x0-Z&&px<x1+Z)){tr.water=null;return null;}
  Wt.x0=x0;Wt.x1=x1;Wt.y=level;Wt.cx=(x0+x1)/2;
  return Wt;
};
/* ── устье и залежи ── */
const SURF_LAW_GEN=surfGen;
surfGen=function(tr,p){
  const g=SURF_LAW_GEN.apply(this,arguments);
  const K=SURF_LAW,W=tr.W,px=tr.padX,poi=tr.poi||[],Wt=(typeof waterOf==="function")?waterOf(tr,p):null;
  const wet=x=>!!(Wt&&x>Wt.x0&&x<Wt.x1&&groundAt(tr,x)-Wt.y>14);
  const hx=(typeof homeHereP==="function"&&homeHereP(p)&&typeof homeSpotX==="function")?homeSpotX(p,tr):null;
  const clear=(arr,x,rad)=>{if(arr)for(let i=arr.length-1;i>=0;i--)if(Math.abs(arr[i].x-x)<rad)arr.splice(i,1);};
  /* устье: памятник рядом — отходим за него, на ближнюю сторону, где нет ни площадки, ни другой постройки */
  const C=g.cave;
  if(C&&isFinite(C.x)&&poi.some(q=>Math.abs(q.x-C.x)<K.mouth)){
    const fits=x=>x>=150&&x<=W-150&&Math.abs(x-px)>=K.keep&&!poi.some(q=>Math.abs(q.x-x)<K.mouth)&&!wet(x);
    let best=null;
    for(let d=10;d<=1200&&best==null;d+=10)for(const s of [1,-1])if(best==null&&fits(C.x+s*d))best=C.x+s*d;
    if(best!=null){
      C.x=best;
      clear(g.deposits,C.x,70);clear(g.plants,C.x,50);clear(g.fauna,C.x,60);clear(tr.deco,C.x,90);
    }
  }
  /* залежь под кораблём: отражается за край зоны (порядок вдоль полосы сохраняется, кучи у края нет);
     если за краем устье, двор, озеро или конец полосы — её здесь нет, как выбранной до дна */
  const Z=K.zone;
  for(let i=g.deposits.length-1;i>=0;i--){
    const d=g.deposits[i],dx=d.x-px;
    if(Math.abs(dx)>=Z)continue;
    const s=dx<0?-1:1,x=px+s*(2*Z-Math.abs(dx));
    const bad=x<120||x>W-120||(C&&Math.abs(x-C.x)<70)||(hx!=null&&Math.abs(x-hx)<150)||wet(x);
    if(bad){g.deposits.splice(i,1);continue;}
    d.x=x;d.y=groundAt(tr,x)-6;
  }
  return g;
};
