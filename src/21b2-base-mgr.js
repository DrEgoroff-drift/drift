/* ══════════════ сто управляющих и один (M405, DESIGN-base §34, §35, §48) ══════════════
   Весь слой требует внимания игрока. Купить это внимание обратно можно ровно
   одним способом, и это ЧЕЛОВЕК, а не улучшение.

   Управляющих в галактике около сотни. Все называют себя управляющими, у всех
   есть позывной, послужной список и рекомендации, все нанимаются. По-настоящему
   хорош один. Но и это не список из трёх коробок (§48 отменил их): каждый
   кандидат — БРОСОК, и «плохой · сносный · настоящий» — места на кривой, а не
   разряды. Мера — `pow(r(), 2.6)`: масса у дна, хвост тонкий, потолка не видно.

   Из этого сразу следует три вещи, и все три — замысел, а не побочность:

   · нанять сносного и жить на шести десятых — НОРМАЛЬНАЯ и рабочая стратегия;
   · разница между «сносно» и «по-настоящему» — то, ради чего вся охота;
   · встретить лучшего в галактике можно на первом же собеседовании, и игра
     об этом не узнает и не подыграет.

   Единственная зацепка на собеседовании (§35): НАСТОЯЩИЙ СПРАШИВАЕТ О МЕСТЕ
   РАНЬШЕ, ЧЕМ ОТВЕЧАЕТ О СЕБЕ. Он хочет формуляр, он откажется от безнадёжного
   камня — единственный в галактике, кто вообще отказывается от работы. Поддельные
   льстят и соглашаются на всё; те из них, у кого высокая маскировка, научились
   изображать вопрос-другой, поэтому это сильный признак и никогда не
   доказательство. */
const BMGR_FLAWS=[
  {id:"steal", ru:"тащит",          how:"склад никогда не сходится с буром — на несколько процентов, зато всегда"},
  {id:"wrong", ru:"строит не то",   how:"третий склад там, где нужен был радиатор, — и он построен, и оплачен"},
  {id:"panic", ru:"паникует",       how:"безупречен до первого аврала, а потом изводит полсклада на царапину"},
  {id:"pretty",ru:"пишет красиво",  how:"сводки отличные. База — нет"},
  {id:"mute",  ru:"молчит",         how:"не подаёт вовсе: пеня набегает там, где никто не смотрит"},
  {id:"deep",  ru:"боится глубины", how:"нижний ярус не вскрывается никогда: лучшая порода не тронута"}
];
const BMGR_BY={};for(const F of BMGR_FLAWS)BMGR_BY[F.id]=F;
const BMGR_SEV=6;            /* смен жалованья в выходное пособие */
/* ── бросок (§48.1) ──
   Чистая функция от номера кандидата: ничего не хранится, и один и тот же
   прилавок показывает одного и того же человека каждый раз. */
function bmgrOf(id){
  const r=rng(hashi(id|0,0x0BA5E,0x3E17));
  const q=.12+.78*Math.pow(r(),2.6);
  const greed=.10+.22*r();
  const pay=Math.round(40+90*r());
  const flaw=(r()<.62)?BMGR_FLAWS[Math.floor(r()*BMGR_FLAWS.length)]:null;
  const term=15+Math.floor(105*r());
  const mask=Math.pow(r(),1.6);
  const sense=q*(1-.5*mask);
  const name=(typeof genName==="function")?genName(r):"Управляющий";
  const call=String.fromCharCode(1040+Math.floor(r()*32))+"-"+(100+Math.floor(r()*900));
  return {id:id|0,q,greed,pay,flaw,term,mask,sense,name,call};
}
/* ── кандидаты у прилавка (§35.1) ──
   Они стоят на станциях и рекламируют себя. Настоящий — не стоит: он работает,
   пьёт или сидит в развалине, которую не покинул. Значит тот, кто ходит только
   по прилавкам, встретит лучшего из поддельных — и это ловушка, вокруг которой
   построен весь слой. */
function bmgrAt(sys){
  if(!sys||!sys.station)return [];
  const out=[],r=rng(hashi(sys.seed|0,0x0C4D,0x11));
  const n=2+Math.floor(r()*2);
  for(let i=0;i<n;i++)out.push(bmgrOf(hashi(sys.seed|0,i*977+13,0x0C4D)));
  return out;
}
/* ── собеседование (§35) ──
   Чутьё — единственное, что видно в словах. Оно и есть тот самый признак:
   человек с чутьём спрашивает о МЕСТЕ, а не рассказывает о себе. */
const BMGR_SAY_FLAT=[
  "«Возьмусь за что угодно. Где база — там и работа»",
  "«У меня везде получалось. Получится и тут»",
  "«Условия ваши, сроки ваши. Я человек простой»",
  "«Сделаю как надо. Не спрашивайте как — сделаю»"
];
const BMGR_SAY_ASK=[
  "«Какое там тепло? И порода какая — по формуляру, а не на глаз»",
  "«Лёд есть? Если нет — считайте, что половину смены я вожу воду»",
  "«Устав какой? Двойная смена — я тогда не берусь»",
  "«Глубина сколько рядов? И радиатор стоит или собираетесь ставить?»"
];
function bmgrLine(M){
  const r=rng(hashi(M.id|0,0x5A19,0x7));
  if(M.sense>=.5)return pick(BMGR_SAY_ASK,r);
  /* маскировка: некоторые поддельные научились изображать вопрос */
  if(M.mask>.7&&r()<.5)return pick(BMGR_SAY_ASK,r);
  return pick(BMGR_SAY_FLAT,r);
}
/* откажется ли он от этого камня: единственный в галактике, кто отказывается */
function bmgrRefuses(M,B){
  if(!B||M.sense<.5)return false;
  const D=(typeof baseDialOf==="function")?baseDialOf(B):null;
  if(!D)return false;
  const hard=(Math.abs(D.heat)>=2.2?1:0)+(D.press>=1.6?1:0)+(D.ore<=1?1:0)+(D.ice<=.2?1:0);
  return hard>=3;
}
/* ── у базы есть управляющий ── */
function bmgrOfBase(B){
  if(!B||!B.mgr)return null;
  const M=bmgrOf(B.mgr.id);
  M.since=B.mgr.since|0;
  return M;
}
function bmgrHire(B,M){
  if(!B||!M)return false;
  if(B.mgr){say("У этой базы уже есть управляющий");return false;}
  if(bmgrRefuses(M,B)){
    say(M.name+" отказался:\n«Такое место я не потяну, и врать не буду»");
    return false;
  }
  B.mgr={id:M.id,since:(typeof baseShift==="function")?baseShift():0};
  tell("tech","Управляющий на базе «"+B.name+"»: "+M.name,
    "УПРАВЛЯЮЩИЙ\n"+M.name+" · "+M.call+
    "\nжалованье "+M.pay+" кр в смену, доля "+Math.round(M.greed*100)+"%"+
    "\nчто он на самом деле умеет — покажет база");
  return true;
}
function bmgrFire(B){
  const M=bmgrOfBase(B);
  if(!M)return false;
  const sev=M.pay*BMGR_SEV;
  if(G.credits<sev){say("Расторжение стоит "+sev+" кр выходного пособия");return false;}
  G.credits-=sev;
  B.mgr=null;
  tell("warn","Расторгнут договор с "+M.name,
    "РАСТОРЖЕНИЕ\nвыходное пособие "+sev+" кр\nи ПАЛАТА тоже захочет об этом бумагу");
  return true;
}
/* ── что он делает со сменой ──
   Он вытягивает свою долю потенциала, берёт жалованье и свою долю, а изъян
   всплывает не раньше своего срока — и тем позже, чем лучше маскировка. */
function bmgrWorkMul(B){
  const M=bmgrOfBase(B);
  return M?clamp(M.q+.15,.2,1.15):1;
}
function bmgrFlawOn(B,n){
  const M=bmgrOfBase(B);
  if(!M||!M.flaw)return null;
  if(n===undefined)n=(typeof baseShift==="function")?baseShift():0;
  return (n-(M.since|0))>=M.term?M.flaw:null;
}
function bmgrStep(B,n){
  const M=bmgrOfBase(B);
  if(!M)return 0;
  let said=0;
  /* жалованье и доля — прямой расход, а не «−процент к эффективности» */
  const cost=M.pay+Math.round((B._earned|0)*M.greed);
  B._earned=0;
  if(cost>0){
    if(G.credits>=cost)G.credits-=cost;
    else{
      /* не заплатили — он уходит сам, и это тоже честно */
      B.mgr=null;
      baseLog(B,"mgrgo",n,{who:M.name});
      logAdd("warn",M.name+" ушёл с базы «"+B.name+"»: жалованье не заплачено");
      return 1;
    }
  }
  const F=bmgrFlawOn(B,n);
  if(F&&F.id==="steal"&&(n%4)===0){
    /* тащит: со склада уходит понемногу и всегда */
    let lost=0;
    for(const k in (B.pool||{})){
      const q=B.pool[k]|0;
      if(q<8)continue;
      const t=Math.max(1,Math.round(q*.05));B.pool[k]=q-t;lost+=t;
    }
    if(lost){baseLog(B,"short",n,{q:lost});said=1;}
  }
  return said;
}
/* «пишет красиво» и «молчит» — про то, что игрок ВИДИТ, а не про склад */
function bmgrLies(B){
  const F=bmgrFlawOn(B);
  return !!(F&&F.id==="pretty");
}
function bmgrSilent(B){
  const F=bmgrFlawOn(B);
  return !!(F&&F.id==="mute");
}
/* строка для стола: кто ведёт базу и во что это обходится */
function bmgrLineOf(B){
  const M=bmgrOfBase(B);
  if(!M)return "";
  const F=bmgrFlawOn(B);
  return "ведёт "+M.name+" · "+M.call+" · "+M.pay+" кр/смену и "+
    Math.round(M.greed*100)+"%"+(F?" · и что-то не так: "+F.how:"");
}
