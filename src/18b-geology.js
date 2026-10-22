/* ══════════════ геология ══════════════ */
/* Пласты раньше были полосами палитры со случайным индексом: они не значили
   ничего и на разных планетах выглядели одинаково. Теперь у планеты есть
   разрез — стопка слоёв от почвы до основания, своя для каждого типа мира и
   своя для каждого seed внутри типа.

   Слои идут по рельефу, а не горизонтально: границы повторяют профиль со своим
   смещением и шумом. Это и читается как «наросло за миллионы лет» — ровные
   горизонтальные линии читаются как разлинованная бумага.

   Тот же разрез используется в шахте, поэтому чем глубже копает игрок, тем
   другая порода вокруг — и это та самая порода, которую он видел в срезе. */
const GEO_KIND={
  soil:   {ru:"почва",       t:[.62,.42,.24], v:0,   x:.5},
  sand:   {ru:"песок",       t:[.86,.72,.46], v:0,   x:.3},
  silt:   {ru:"ил",          t:[.42,.46,.40], v:0,   x:.4},
  ash:    {ru:"пепел",       t:[.28,.26,.28], v:0,   x:.6},
  snow:   {ru:"фирн",        t:[.94,.97,1.0], v:0,   x:.2},
  sed:    {ru:"осадок",      t:[.58,.50,.38], v:.25, x:.7},
  sandst: {ru:"песчаник",    t:[.74,.58,.38], v:.3,  x:.8},
  rock:   {ru:"порода",      t:[.46,.46,.50], v:.5,  x:1},
  basalt: {ru:"базальт",     t:[.20,.19,.22], v:.4,  x:1},
  ice:    {ru:"лёд",         t:[.66,.82,.94], v:.2,  x:.4},
  salt:   {ru:"соль",        t:[.88,.86,.80], v:.15, x:.5},
  crystal:{ru:"кристаллы",   t:[.55,.70,.95], v:1,   x:.6},
  metal:  {ru:"руда",        t:[.50,.54,.60], v:.9,  x:.9},
  magma:  {ru:"расплав",     t:[.75,.28,.12], v:.7,  x:.9},
  bedrock:{ru:"основание",   t:[.26,.26,.30], v:.2,  x:1}
};
/* какой мир из чего сложен: порядок сверху вниз, «|» — выбор по seed */
const GEO_TPL={
  terran:  [["soil"],["sed"],["sandst","sed"],["rock"],["metal","crystal"],["bedrock"]],
  ocean:   [["silt"],["sed"],["salt","sed"],["rock"],["crystal","metal"],["bedrock"]],
  desert:  [["sand"],["sandst"],["sandst","rock"],["salt","metal"],["bedrock"]],
  rocky:   [["ash","soil"],["rock"],["rock","basalt"],["metal"],["crystal","metal"],["bedrock"]],
  ice:     [["snow"],["ice"],["rock"],["crystal"],["bedrock"]],
  volcanic:[["ash"],["basalt"],["basalt","rock"],["metal"],["magma"],["bedrock"]],
  toxic:   [["silt","soil"],["sed"],["crystal","sed"],["metal"],["bedrock"]],
  crystal: [["sand","ash"],["crystal"],["crystal","rock"],["rock"],["crystal","metal"],["bedrock"]],
  jungle:  [["soil"],["soil","silt"],["sed"],["sed","sandst"],["sandst","rock"],["metal","crystal"],["bedrock"]],
  metal:   [["ash"],["metal"],["metal","rock"],["basalt"],["metal","crystal"],["bedrock"]],
  ruin:    [["sand","ash"],["sed"],["rock","sandst"],["metal","rock"],["crystal","metal"],["bedrock"]],
  gas:     [["ash"],["bedrock"]]
};
function geologyOf(p){
  if(p.geo)return p.geo;
  const r=rng((p.seed^0x6E01)>>>0);
  const tpl=wtab(p).geoTpl||GEO_TPL[p.type]||GEO_TPL.terran;
  const pal=p.T.pal;
  const out=[];
  let d=0;
  for(let i=0;i<tpl.length;i++){
    const opts=tpl[i], kind=opts[Math.floor(r()*opts.length)];
    const K=GEO_KIND[kind];
    /* толщина своя у каждой планеты: у одной почвы на полметра, у другой
       двадцать — по одному срезу видно, что это разные миры */
    const last=i===tpl.length-1;
    const th=last?4000:Math.round((i===0?26:70)*(.45+r()*1.5));
    /* цвет слоя — палитра планеты, прокрашенная характером породы: так лёд
       остаётся ледяным, а базальт базальтовым, но оба принадлежат этой планете */
    const base=pal[Math.min(pal.length-1,1+i%3)];
    /* .62 давало почти чистый характер породы, и разрез начинал спорить с небом
       по светлоте — половина хватает, чтобы слой опознавался, но остался
       частью этой планеты */
    const col=[0,1,2].map(j=>clamp(Math.round(lerp(base[j],K.t[j]*255,.5)*.86),0,255));
    out.push({kind,ru:K.ru,col,d0:d,th,vein:K.v,rough:K.x,seed:(r()*1e9)|0});
    d+=th;
  }
  p.geo=out;
  return out;
}
/* слой на заданной глубине — этим же пользуется шахта */
function geoAt(p,depth){
  const G0=geologyOf(p);
  for(let i=0;i<G0.length;i++)if(depth<G0[i].d0+G0[i].th)return G0[i];
  return G0[G0.length-1];
}
/* ── сброс (M169) ──
   Пласты шли ровными параллельными волнами через весь мир: разрез читался
   слоёным пирогом, одинаковым куда ни иди. В настоящей земле блоки разорваны
   сбросами — по трещине один блок опущен относительно соседнего, и вся пачка
   слоёв на нём уезжает вниз или вверх. Это самое читаемое, что вообще есть в
   разрезе, и стоит оно одной функции: смещение блока по его номеру.
   Смещение НЕ накапливается — иначе к краю мира пласты уехали бы за экран. */
const GEO_FAULT=1900;                              /* примерно раз в полтора экрана */
function geoFaultAt(wx,seed){
  const k=Math.floor(wx/GEO_FAULT);
  const h=hashi(k,seed|0,0x7A17);
  if((h&3)===0)return 0;                           /* не каждый блок сдвинут */
  return (((h>>>2)&63)/63-.5)*84;
}
/* граница блока со своим наклоном: у сброса плоскость не вертикальна */
function geoFaultX(k,seed){
  const h=hashi(k,seed|0,0x7A18);
  return k*GEO_FAULT+((h>>>4)&255)-128;
}
/* разрез в срезе грунта — 2D-краска пластов снята (M807): без видеокарты поверхности нет. Зовёт её
   запертый 19-mode-landing-ground — пустая заглушка, ждёт разблокировки автора. geologyOf, geoAt и сбросы —
   логика разреза (шахта, телеметрия), они остаются. */
function drawStrata(){}
