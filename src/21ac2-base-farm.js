/* ══════════════ ферма — одомашнивание (M496, PLAN st. 7, DESIGN-birchpunk §4.3) ══════════════
   Автор: «зверь планеты, успокоенный импульсом, живёт на базе с фермой,
   получает имя и клеймо ПАЛАТЫ, и медленно даёт своё — только пока с ним
   кто-то говорит».

   Как это работает. Импульс в шахте или пещере оглушает зверя; подойти к
   оглушённому — раньше всегда «образец» (углерод, ксенобиом). Теперь, если у
   игрока где-то есть база с ЖИВОЙ ФЕРМОЙ без зверя и клетка на корабле пуста,
   зверя берут живым (`G.beast`): вид, семя, откуда. Первый вход на базу с
   пустой фермой — зверь въезжает: имя из таблицы (Зорька, Пеструшка…), клеймо
   ПАЛАТЫ № Ф-xxxx, строка в журнале. Раз в смену ферма даёт единицу своего:
   органику (мягкие миры), углерод (камень), ксенобиом (чужие архетипы); зверь
   с дальнего мира (≥25 секторов от ядра) каждую третью смену — «Жемчуг
   пустоты» (у него в таблице verb:"fauna"), с дальнего джунглевого/земного —
   каждую вторую «Звёздный чернозём». Но ТОЛЬКО пока с ним говорят: садовод на
   ферме (JOB_ROLE) или сам игрок на этой базе. Никто не говорит — раз в
   двенадцать смен строка «скучает». Ферму выбило — зверь не пропадает
   («никогда не теряется»): ждёт в породе, а когда ферму отстроят — тоскует по
   старому месту FARM_HOME смен и даёт вполовину. Зверь — не множитель и не
   цифра: у него имя, и журнал зовёт его по имени. */
const FARM_NAMES=["Зорька","Пеструшка","Бурка","Марта","Ночка","Малыш","Шустрик","Дымка","Тихон","Ряба","Борька","Фрося","Кузя","Мотя"];
const FARM_HOME=12,FARM_FAR=25,FARM_LONELY=12,FARM_SAY=6;
const FARM_SOFT={terran:1,ocean:1,jungle:1,toxic:1};
BUILD.farm={ru:"Ферма",cost:{credits:1500,alloy:4},power:-4,
  note:"зверь с планеты живёт тут и даёт своё — пока с ним кто-то говорит"};
JOB_ROLE.farm="gardener";
BUILD_KEYS.push("farm");
Object.assign(BLOG,{
  farm_in:    (B,a)=>(a.who||"зверь")+" въехал"+(a.far?" — издалека, "+a.far+" секторов":"")+" · клеймо ПАЛАТЫ № Ф-"+(a.no||"0000")+" · «ласковый, только не кормите с руки»",
  farm_got:   (B,a)=>(a.who||"зверь")+" дал "+(a.q|0)+" ед · "+(a.what||"своё")+(a.home?" · тоскует, даёт вполовину":""),
  farm_lonely:(B,a)=>(a.who||"зверь")+" скучает: никто не заходит поговорить — и не даёт ничего",
  farm_wait:  (B,a)=>"ферма выбита · "+(a.who||"зверь")+" ждёт в породе, живой",
  farm_back:  (B,a)=>"ферма отстроена · "+(a.who||"зверь")+" вернулся и первое время тоскует"
});
function farmCell(B){
  for(const cell of (B&&B.cells)||[])if(cell&&cell.k==="farm"&&cell.hp>0)return cell;
  return null;
}
/* есть куда везти: где-то ждёт живая ферма без зверя */
function farmWanted(){
  for(const k in G.bases){const B=G.bases[k];if(!B.farm&&farmCell(B))return B;}
  return null;
}
/* взять живым — зовут шахта и пещера перед «образцом»; true — образец не берётся */
function beastTake(b,p){
  if(!b||!p||G.beast||!farmWanted())return false;
  G.beast={sx:G.sx,sy:G.sy,idx:p.idx|0,sp:b.name,seed:hashi(Math.round(b.x),Math.round(b.y),0xFA12)>>>0};
  const d=(typeof bioMark==="function")?bioMark(b.name,6):0;G.data+=d;
  tell("good","В клетку: "+b.name+" · живой, на ферму","В КЛЕТКУ\n"+b.name+"\nживой · везём на ферму"+(d?"\n+"+d+" данных":""));
  return true;
}
function farmOf(B){return (B&&B.farm)||null;}
/* сам зверь — заново из семени; кэш не в записи */
function farmBeast(F){
  if(!F)return null;
  if(F._b)return F._b;
  const sys=getSystem(F.sx,F.sy),p=sys&&sys.planets[F.idx|0];
  if(!p)return null;
  const list=faunaOf(p),sp=list.find(s=>s.name===F.sp)||list[0];
  if(!sp)return null;
  const b=specimenBeast(rng(F.seed>>>0),sp,0,0);b.face=1;b.stun=0;b.flee=0;
  if(b.hover)b.hover=Math.min(b.hover,7);          /* под потолком загона летун висит низко */
  F._b=b;return b;
}
function farmName(F){return F?F.name:"";}
/* что даёт зверь в эту смену: свой товар мира, дальний — жемчуг/чернозём */
function farmGood(F,n){
  const sys=getSystem(F.sx,F.sy),p=sys&&sys.planets[F.idx|0],type=p?p.type:"rocky";
  const r=Math.hypot(F.sx,F.sy),b=farmBeast(F);
  if(r>=FARM_FAR&&(n%3)===0)return "pearl";
  if(r>=FARM_FAR&&(type==="jungle"||type==="terran")&&(n%2)===1)return "chernozem";
  if(b&&b.alien)return "xeno";
  return FARM_SOFT[type]?"organics":"carbon";
}
function farmTalk(B,cell){
  if(typeof baseCellStaff==="function"&&baseCellStaff(B,cell).length>0)return true;
  return !!(G.mode==="base"&&G.base&&G.base.B===B);
}
/* въезд: зовёт enterBase */
function farmEnter(B){
  if(!G.beast||B.farm||!farmCell(B))return 0;
  const n=(typeof baseShift==="function")?baseShift():0;
  const r=rng(hashi(G.beast.seed,B.sx*31+B.sy,n));
  const F=Object.assign({},G.beast,{name:pick(FARM_NAMES,r),since:n,moved:0,wait:0,lonely:n,got:0,acc:0,no:1000+Math.floor(r()*9000)});
  delete F._b;
  B.farm=F;G.beast=null;
  const far=Math.round(Math.hypot(F.sx,F.sy));
  baseLog(B,"farm_in",n,{who:F.name,no:F.no,far:far>=FARM_FAR?far:0});
  tell("good","Ферма «"+B.name+"»: "+F.name+" въехал · клеймо № Ф-"+F.no,"ФЕРМА\n"+F.name+" въехал\nклеймо ПАЛАТЫ № Ф-"+F.no);
  return 1;
}
/* смена: зовёт baseShiftRun */
function farmStep(B,n){
  const F=farmOf(B);if(!F)return 0;
  const cell=farmCell(B);
  if(!cell){
    if(!F.wait){F.wait=n;baseLog(B,"farm_wait",n,{who:F.name});return 1;}
    return 0;
  }
  if(F.wait){F.wait=0;F.moved=n;baseLog(B,"farm_back",n,{who:F.name});return 1;}
  if(!farmTalk(B,cell)){
    if((n-(F.lonely|0))>=FARM_LONELY){F.lonely=n;baseLog(B,"farm_lonely",n,{who:F.name});return 1;}
    return 0;
  }
  F.lonely=n;
  const home=F.moved&&(n-F.moved)<FARM_HOME;
  if(home&&(n&1))return 0;                       /* тоскует: через смену */
  const k=farmGood(F,n);
  B.pool[k]=(B.pool[k]|0)+1;F.got=(F.got|0)+1;F.acc=(F.acc|0)+1;
  if((n%FARM_SAY)===0&&F.acc>0){
    baseLog(B,"farm_got",n,{who:F.name,q:F.acc,what:RES[k].ru.toLowerCase(),home:home?1:0});
    F.acc=0;return 1;
  }
  return 0;
}
