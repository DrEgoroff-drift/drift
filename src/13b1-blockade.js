/* ══════════════ голос блокады (M498, PLAN) ══════════════
   Блокада есть (occLvl ≥ 2: дроны не летают, баржи стоят, батарея H1 её
   снимает) — не было голоса. Теперь волна оккупанта в эфире говорит, что
   полки полны, а страдают другие; прилавок пуст и платит вдвое за еду, воду
   и топливо (органика, лёд, изотопы). Возить в блокаду нейтралу законно.
   «Буханка» (именная машина базы) — дальше. */
const BLOCK_GOODS={organics:1,ice:1,isotopes:1},BLOCK_MUL=2;
const BLOCK_LINES=["Полки полны. Снабжение бесперебойно. Страдают другие.","Цены стабильны. Очередей нет. Слухам не верьте.",
  "Жизнь налажена. Вывоз продовольствия — по разрешению.","Ситуация под контролем. Под нашим."];
function blockHere(sys){sys=sys||G.sys;return !!(sys&&typeof occLvl==="function"&&occLvl(sys.sx!=null?sys.sx:G.sx,sys.sy!=null?sys.sy:G.sy)>=2);}
function blockMul(sys,k){return (BLOCK_GOODS[k]&&blockHere(sys))?BLOCK_MUL:1;}
/* прилёт в блокаду: волна оккупанта, раз в сутки мира на систему */
function blockArrive(){
  if(!blockHere())return false;
  const key=G.sx+","+G.sy,d=celDay();
  G.blockHeard=G.blockHeard||{};
  if(G.blockHeard[key]===d)return false;
  G.blockHeard[key]=d;
  const line=BLOCK_LINES[hashi(G.sx,G.sy,d)%BLOCK_LINES.length];
  if(typeof etherLine==="function")etherLine(line,"волна администрации");
  logAdd("dim","Блокада: прилавок пуст — еду, воду и топливо берут вдвое. Возить сюда нейтралу законно.");
  return true;
}
