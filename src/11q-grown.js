/* ══════════════ другое взросление: один народ на разных ступенях ══════════════
   M145-grown. Охраняемый уезд с правилом невмешательства, которое все понемногу
   нарушают (06c, `grown`, игла масс-детектора). На окраине — посёлки одного
   народа на разных ступенях; что это один народ, можно понять, только побывав
   в нескольких.

   ЯДРО — ступень, к которой они вот-вот подойдут, и в ней можно поучаствовать:
   привезти прибор, семя, починить старый механизм — тот же дающий круг M109,
   без изменений.
   ВЗАИМНОСТЬ ОБЯЗАТЕЛЬНА. Прибор используют не по назначению, и выходит умнее;
   семя сажают «неправильно», и оно всходит лучше. Без этого вышла бы история
   «космонавт просвещает туземцев», то есть ровно обратное замыслу.

   ПРАВИЛА ФАЙЛА:
   1. Игрок не учитель. Каждый дар возвращается не благодарностью, а тем,
      что они сделали с ним лучше, чем он умел.
   2. Хранится G.grown={recip}: сколько раз они вас обошли. */

function grownAll(){return (G.grown||(G.grown={recip:0}));}
function grownDepthAt(sx,sy){
  if(typeof regionAt!=="function")return 0;
  const R=regionAt(sx,sy);
  if(R.theme!=="grown")return 0;
  return (R.core.sx===sx&&R.core.sy===sy)?2:1;
}
function grownDepthHere(){return grownDepthAt(G.sx,G.sy);}
function grownIsCore(p){
  if(grownDepthHere()!==2||!p)return false;
  const ps=G.sys.planets||[];
  const c=ps.find(q=>typeof settleCanLive==="function"&&settleCanLive(q));
  return !!(c&&c.idx===p.idx);
}
/* ступень по системе: лишние дворы на окраине — от нуля до четырёх, чтобы
   посёлки одного народа читались разными только рядом */
function grownExtra(p){
  if(grownDepthHere()!==1||!p)return 0;
  return hashi(G.sx,G.sy,0x6A0)%5;
}
function grownGroundLine(){
  const d=grownDepthHere();
  if(!d)return null;
  if(d===1){const e=grownExtra(G.surf&&G.surf.p);return e>=3?"Те же дворы, что у соседей, только больше. Один народ.":"Дворы как у соседей, только меньше. Те же знаки на столбах.";}
  return grownAll().recip?"Семя посеяли не так, как вы показали. Взошло лучше.":"Они стоят у черты. Вам можно за неё — привезите что-нибудь.";
}
/* ── взаимность ──
   Зовётся из settleGive, когда дар принят в ядре: настроение выше, чем
   принесённое стоит, и строка про то, что они сделали с ним. */
const GROWN_LINES=[
  "Прибор повесили на столб вверх ногами. Он стал показывать погоду. Точнее вашего.",
  "Семя посеяли в камень, не в землю. Взошло вдвое выше.",
  "Механизм починили не так, как было. Теперь он не ломается.",
  "Лампу закопали. Ночью светится вся улица."
];
function grownOnGive(S,k,n,p){
  if(!grownIsCore(p)||n<=0)return;
  const Gn=grownAll();
  const line=GROWN_LINES[(Gn.recip|0)%GROWN_LINES.length];
  Gn.recip=(Gn.recip|0)+1;
  S.mood=clamp(S.mood+6,0,100);
  logAdd("good",line);
  if(typeof heardAdd==="function")heardAdd("ground",{sx:G.sx,sy:G.sy,note:"обошли"},null);
}
