/* ══════════════ грядка у дома ══════════════
   M204, из списка «радостей». Семена описанных видов (биологический реестр,
   20e) высеваются в грядку у дома и растут НАСТОЯЩИМИ СУТКАМИ. Вега поливает.
   Связывает три вещи, которые до сих пор не встречались: биологию, дом и её.

   РАСТЁТ ПО НАСТОЯЩЕМУ ВРЕМЕНИ И ЛЕНИВО, как вымпел и как ответная карточка:
   у грядки есть `Date.now()` посева, и всё. Никакой симуляции; заглянул через
   неделю — увидел неделю роста. Игра, закрытая на месяц, ничего не проспит.

   ФОРМА — ВИДОВАЯ, а не «кустик вообще». Вид восстанавливается из ИМЕНИ:
   у «Дрейфа» имя вида и есть его паспорт (`speciesPlant` строит вид из потока
   случайных чисел, а имя — из вида), поэтому одно и то же имя всегда даёт одну
   и ту же форму, цвет и повадку. Полного совпадения с кустом на дальней
   планете не будет — там в форму входит ещё и место, — но своё лицо у каждой
   грядки есть, и два одинаковых имени вырастут одинаковыми.

   ЧЕГО ЗДЕСЬ НЕТ. Урожая, продажи, ускорителей роста, «удобрить за 200 кр».
   Грядка ничего не даёт и ничего не просит. Она растёт.

   ПРАВИЛА ФАЙЛА:
   1. Хранится G.green: до четырёх грядок, в каждой имя вида и время посева.
   2. Ни одного числа игроку, кроме «посеяно» и «поливает Вега». */
const GREEN_BEDS=4;
const GREEN_FULL=6*86400000;       /* до взрослого — шесть настоящих суток */
const GREEN_VEGA=1.7;              /* во столько раз быстрее, когда есть кому поливать */
function greenAll(){
  if(!G.green||typeof G.green!=="object")G.green={beds:[]};
  if(!Array.isArray(G.green.beds))G.green.beds=[];
  return G.green;
}
/* поливает ли кто-нибудь: Вега на борту или дома. Больше поливать некому */
function greenWatered(){
  return !!(G.vega&&(G.vega.aboard||(G.vega.stage|0)>=3));
}
/* сколько выросло: 0 — только посеяно, 1 — взрослое */
function greenGrow(b){
  if(!b||!b.t)return 0;
  const k=greenWatered()?GREEN_VEGA:1;
  return clamp((Date.now()-b.t)*k/GREEN_FULL,0,1);
}
/* какие виды ещё не посеяны: реестр помнит порядок открытия, и сеется тот,
   что описан позже прочих — то есть тот, который ещё в руках */
function greenNext(){
  const known=(G.species&&G.species.size)?[...G.species]:[];
  const sown=greenAll().beds.map(b=>b.name);
  for(let i=known.length-1;i>=0;i--)
    if(sown.indexOf(known[i])<0)return known[i];
  return null;
}
function greenCanSow(){
  return !!(greenAll().beds.length<GREEN_BEDS&&(G.bio|0)>0&&greenNext());
}
function greenSow(){
  if(!greenCanSow())return null;
  const name=greenNext();
  G.bio=(G.bio|0)-1;                       /* уходит образец, как у управляющего */
  const b={name,t:Date.now()};
  greenAll().beds.push(b);
  logAdd("good","Посеяно у дома: "+name);
  tell("good","Посеяно: "+name,"ПОСЕЯНО\n"+name.toUpperCase()+
       (greenWatered()?"\nВега польёт":"\nполивать некому"));
  if(typeof recordAdd==="function"&&greenAll().beds.length===GREEN_BEDS)
    recordAdd("грядка","засеяна вся · четыре вида");
  return b;
}
/* вид из имени: тот же генератор, что и в реестре, только поток случайных
   чисел заведён от имени. Одно имя — одна форма, всегда */
const GREEN_SP=new Map();
function greenSpecies(name,p){
  const key=name+"|"+((p&&p.type)||"terran");
  let sp=GREEN_SP.get(key);
  if(sp)return sp;
  let h=2166136261>>>0;
  for(let i=0;i<name.length;i++){h^=name.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}
  const r=rng(h>>>0);
  const bi={hueBias:r(),giantChance:0.05,scale:1};
  const kind=Math.floor(r()*6);
  const pp=p||{T:TYPES.terran,type:"terran"};
  sp=greenSpeciesFields(rng(h>>>0),pp,bi,kind);
  sp.name=name;
  GREEN_SP.set(key,sp);
  return sp;
}
/* поля вида: те же формулы, что в 20e, но без имени и без места. Дублировать
   тут таблицу было бы ошибкой; дублируется ровно то, что нужно для формы */
function greenSpeciesFields(r,p,bi,kind){
  const pal=p.T.pal;
  const base=pal[Math.min(pal.length-1,2+Math.floor(r()*2))];
  const hue=(r()*.5+bi.hueBias*.5)%1;
  const raw=[clamp(base[0]*.5+hue*150,20,255),clamp(base[1]*.6+120+hue*55,30,255),
             clamp(base[2]*.5+40+hue*90,20,255)];
  const gr=pal[Math.min(pal.length-1,3)];
  const leaf=[lerp(raw[0],gr[0],.28),lerp(raw[1],gr[1],.22),lerp(raw[2],gr[2],.28)];
  const stem=[leaf[0]*.5+20,leaf[1]*.45+26,leaf[2]*.45+22];
  return {kind,leaf,stem,
    nb:kind===1?3+Math.floor(r()*4):(kind===2?5+Math.floor(r()*4):
       (kind===0?1+Math.floor(r()*2):(kind===3?2+Math.floor(r()*3):0))),
    cap:.55+r()*.6, curl:(r()-.5)*.7, segs:3+Math.floor(r()*4),
    bloom:r()<.42, glow:r()<.30, spiny:r()<.3, branchLen:.16+r()*.30};
}
/* ── грядка в кадре ──
   Рисуется у дома снаружи (21f). Земля, колышек с ярлыком и растение той
   высоты, до которой доросло. Ярлык подписан не для интерфейса: так и
   подписывают грядки. */
function greenDrawBed(x,gy,w,b,p){
  const sp=greenSpecies(b.name,p);
  const t=greenGrow(b);
  /* земля */
  ctx.fillStyle="rgba(48,38,28,.92)";
  ctx.beginPath();
  ctx.moveTo(x-w*.5,gy);ctx.lineTo(x+w*.5,gy);
  ctx.lineTo(x+w*.42,gy-w*.10);ctx.lineTo(x-w*.42,gy-w*.10);
  ctx.closePath();ctx.fill();
  ctx.fillStyle="rgba(0,0,0,.30)";
  ctx.fillRect(x-w*.5,gy-1,w,2);
  /* растение: высота от возраста, форма от вида */
  const hh=w*(0.25+t*1.15);
  const sc=`rgb(${sp.stem[0]|0},${sp.stem[1]|0},${sp.stem[2]|0})`;
  const lc=`rgb(${sp.leaf[0]|0},${sp.leaf[1]|0},${sp.leaf[2]|0})`;
  if(t>0.02){
    ctx.strokeStyle=sc;
    ctx.lineWidth=Math.max(1.2,hh*.06);
    ctx.lineCap="round";
    ctx.beginPath();
    ctx.moveTo(x,gy-w*.06);
    ctx.quadraticCurveTo(x+sp.curl*hh*.3,gy-hh*.6,x+sp.curl*hh*.5,gy-hh);
    ctx.stroke();
    const tipx=x+sp.curl*hh*.5, tipy=gy-hh;
    if(sp.kind===0||sp.kind===5){                    /* зонтик */
      ctx.fillStyle=lc;
      ctx.beginPath();
      ctx.ellipse(tipx,tipy,hh*sp.cap*.42,hh*sp.cap*.16,0,Math.PI,TAU);ctx.fill();
    }else if(sp.kind===1||sp.kind===3){              /* ветви с листьями */
      ctx.strokeStyle=lc;ctx.lineWidth=Math.max(1,hh*.045);
      for(let i=0;i<sp.nb;i++){
        const q=(i+1)/(sp.nb+1), by=gy-hh*q, side=i%2?1:-1;
        ctx.beginPath();
        ctx.moveTo(x+sp.curl*hh*q*.5,by);
        ctx.lineTo(x+sp.curl*hh*q*.5+side*hh*sp.branchLen*1.6,by-hh*.10);
        ctx.stroke();
      }
    }else if(sp.kind===2){                           /* метёлка */
      ctx.fillStyle=lc;
      for(let i=0;i<sp.nb;i++){
        const a=-Math.PI/2+(i-(sp.nb-1)/2)*.30;
        ctx.beginPath();
        ctx.ellipse(tipx+Math.cos(a)*hh*.16,tipy+Math.sin(a)*hh*.16,
          hh*.055,hh*.11,a+Math.PI/2,0,TAU);ctx.fill();
      }
    }else{                                            /* шар */
      ctx.fillStyle=lc;
      ctx.beginPath();ctx.arc(tipx,tipy,hh*.20,0,TAU);ctx.fill();
    }
    if(sp.bloom&&t>0.7){
      ctx.fillStyle="rgba(240,220,160,.85)";
      ctx.beginPath();ctx.arc(tipx,tipy-hh*.06,Math.max(1.4,hh*.045),0,TAU);ctx.fill();
    }
    ctx.lineCap="butt";
  }else{
    /* только посеяно: два семядольных листка, и всё */
    ctx.fillStyle=lc;
    for(const s2 of [-1,1]){
      ctx.beginPath();
      ctx.ellipse(x+s2*w*.05,gy-w*.10,w*.05,w*.025,s2*0.5,0,TAU);ctx.fill();
    }
  }
  /* колышек с ярлыком */
  ctx.fillStyle="rgba(120,98,72,.9)";
  ctx.fillRect(x+w*.34,gy-w*.34,Math.max(1.4,w*.024),w*.28);
  ctx.fillStyle="rgba(226,218,196,.92)";
  ctx.fillRect(x+w*.28,gy-w*.40,w*.18,w*.10);
  ctx.fillStyle="rgba(90,78,58,.7)";
  ctx.fillRect(x+w*.30,gy-w*.375,w*.13,Math.max(1,w*.012));
  ctx.fillRect(x+w*.30,gy-w*.345,w*.09,Math.max(1,w*.012));
}
/* все грядки: ряд у стены дома */
function greenDraw(x0,gy,w,p){
  const B=greenAll().beds;
  if(!B.length)return;
  const bw=Math.min(w/GREEN_BEDS,w*0.26);
  B.forEach((b,i)=>greenDrawBed(x0+bw*(i+0.5),gy,bw*0.92,b,p));
}
/* подсказка у дома: одна строка, и та про действие */
function greenPrompt(){
  const B=greenAll().beds;
  if(!B.length&&!greenCanSow())return "";
  const grown=B.filter(b=>greenGrow(b)>=1).length;
  return (greenCanSow()?"ДЕЙСТВИЕ — ПОСЕЯТЬ У ДОМА":"ГРЯДКА · ПОСЕЯНО "+B.length)+
    (grown?" · ВЫРОСЛО "+grown:"")+(greenWatered()?"":" · ПОЛИВАТЬ НЕКОМУ");
}
