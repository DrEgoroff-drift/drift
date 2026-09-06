/* ══════════════ соседство и залы (M396, DESIGN-base §7) ══════════════
   У базы было два правила соседства: реактор рядом с буром экономит передачу,
   реактор рядом с жильём портит людям жизнь. Их и было видно — как два
   исключения в общем коде. Здесь их девять, и они лежат ТАБЛИЦЕЙ: строчка про
   то, кто с кем и что из этого выходит.

   Это тот самый механизм, ради которого сетку вообще рисуют клетками. Пока
   правил два, план базы — это список модулей; когда их девять, план — это
   головоломка, у которой есть хорошие решения и плохие, и обе видны глазами:
   каждое правило рисуется коротким патрубком или полосой между двумя клетками.

   ЗАЛ — вторая половина той же мысли. Три одинаковых модуля подряд в одном
   ряду сливаются в зал: на троих уходит на треть меньше энергии, и склад у
   зала больше. Цена честная и та же, что у Fallout Shelter: беда, пришедшая в
   зал, забирает ЕГО ЦЕЛИКОМ, а не одну клетку. Три реактора в ряд — красиво и
   опасно, и это решение игрока, а не подарок. */
const ADJ=[
  {a:"reactor",b:["drill","lyse","cryo"],   k:"wire",  ru:"передача",  note:"−22% энергии на передачу"},
  {a:"reactor",b:["habitat"],               k:"noise", ru:"шум",       note:"−8 духа жилому"},
  {a:"garden", b:["habitat"],               k:"green", ru:"зелень",    note:"+6 духа и немного воздуха"},
  {a:"med",    b:["habitat"],               k:"care",  ru:"уход",      note:"+4 духа жилому"},
  {a:"melter", b:["lyse"],                  k:"feed",  ru:"подача",    note:"электролизёру нужно меньше льда"},
  {a:"radiator",b:["reactor"],              k:"vent",  ru:"вытяжка",   note:"−3 тепла, если стоят в одной колонке",col:1},
  {a:"storage",b:["drill","refinery"],      k:"store", ru:"склад рядом",note:"+20% к тому, что успевает лечь"},
  {a:"shop",   b:["*"],                     k:"fix",   ru:"мастерская",note:"сосед чинится вдвое быстрее"},
  {a:"battery",b:["habitat"],               k:"gun",   ru:"батарея",   note:"−4 духа: рядом со стволом не спят"}
];
const HALL_N=3;              /* столько одинаковых подряд — и это зал */
const HALL_POWER=.7;         /* на треть меньше энергии на всех троих */
/* ── пары соседей ──
   Считается по клеткам: правило срабатывает, если a и b стоят бок о бок (а для
   вытяжки — друг над другом в одной колонке). Возвращаем и список пар (их
   рисует сцена), и сводку по видам. */
function baseAdjPairs(B){
  const out=[];
  if(!B||!B.cells)return out;
  const cell=(c,r)=>(c<0||c>=BASE_COLS||r<0||r>=baseRows(B))?null:baseCell(B,c,r);
  for(let r=0;r<baseRows(B);r++)for(let c=0;c<BASE_COLS;c++){
    const A=cell(c,r);
    if(!A||A.hp<=0)continue;
    for(const R of ADJ){
      if(R.a!==A.k)continue;
      const dirs=R.col?[[0,1],[0,-1]]:[[1,0],[-1,0],[0,1],[0,-1]];
      for(const d of dirs){
        const Bc=cell(c+d[0],r+d[1]);
        if(!Bc||Bc.hp<=0)continue;
        if(R.b[0]!=="*"&&R.b.indexOf(Bc.k)<0)continue;
        out.push({k:R.k,ru:R.ru,note:R.note,ac:c,ar:r,bc:c+d[0],br:r+d[1],
          a:A.k,b:Bc.k});
      }
    }
  }
  return out;
}
function baseAdjCount(B,kind){
  let n=0;
  for(const p of baseAdjPairs(B))if(p.k===kind)n++;
  return n;
}
/* ── залы ──
   Три одинаковых подряд в одном ряду. Четыре подряд — это зал и ещё один
   модуль: зал ровно на три клетки, иначе ряд из пяти реакторов давал бы
   скидку дважды. */
function baseHalls(B){
  const out=[];
  if(!B||!B.cells)return out;
  for(let r=0;r<baseRows(B);r++){
    let c=0;
    while(c<BASE_COLS-HALL_N+1){
      const A=baseCell(B,c,r);
      if(!A||A.hp<=0){c++;continue;}
      let same=1;
      while(same<HALL_N){
        const N=baseCell(B,c+same,r);
        if(!N||N.hp<=0||N.k!==A.k)break;
        same++;
      }
      if(same>=HALL_N){out.push({k:A.k,r,c0:c,c1:c+HALL_N-1});c+=HALL_N;}
      else c++;
    }
  }
  return out;
}
function baseHallAt(B,c,r){
  for(const H of baseHalls(B))if(H.r===r&&c>=H.c0&&c<=H.c1)return H;
  return null;
}
/* беда, пришедшая в зал, берёт его целиком: тот же удар по всем трём клеткам */
function baseHallHit(B,c,r,dmg){
  const H=baseHallAt(B,c,r);
  if(!H)return 0;
  let n=0;
  for(let x=H.c0;x<=H.c1;x++){
    if(x===c)continue;
    const cell=baseCell(B,x,r);
    if(!cell||cell.hp<=0)continue;
    cell.hp=Math.max(0,cell.hp-dmg);n++;
  }
  return n;
}
/* ── что соседство даёт ── */
function baseAdjSpirit(B){
  return baseAdjCount(B,"green")*6+baseAdjCount(B,"care")*4-baseAdjCount(B,"gun")*4;
}
function baseAdjAir(B){return baseAdjCount(B,"green");}
function baseAdjHeat(B){return -baseAdjCount(B,"vent")*30;}   /* в десятых (§16) */
function baseAdjIce(B){return baseAdjCount(B,"feed");}
function baseAdjMine(B){return 1+clamp(baseAdjCount(B,"store")*.2,0,.6);}
function baseAdjFix(B){return baseAdjCount(B,"fix")?2:1;}
/* строка для сцены и для стола: что здесь с чем соседствует */
function baseAdjLine(B){
  const P=baseAdjPairs(B),seen={},out=[];
  for(const p of P){
    if(seen[p.k])continue;
    seen[p.k]=1;out.push(p.ru);
  }
  const H=baseHalls(B);
  if(H.length)out.push("зал"+(H.length>1?"ов "+H.length:""));
  return out.join(" · ");
}
