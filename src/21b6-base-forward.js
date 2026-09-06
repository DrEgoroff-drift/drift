/* ══════════════ опорный пункт экспедиции (M409, DESIGN-base §44) ══════════════
   `11x-expedition` уже стоит: во втором действии, когда Кольцо услышано и лента
   сдана, по эфиру уходит циркуляр, и весь мир шестьдесят дней работает на
   экспедицию. В её собственной шапке написана честная жестокость этого замысла:
   «Игрок не герой экспедиции. Он — один из тысячи рук.»

   База — единственное, что это меняет, и это тот финал, который просил автор.

   Экспедицию за край нельзя снарядить с одних станций: ей нужен ОПОРНЫЙ ПУНКТ
   по дороге туда — площадка, мачта, люди, закрытое жизнеобеспечение, и стоящий
   в правильном коридоре. У мира есть свои кандидаты, все посредственные. Если у
   игрока есть подходящий — циркуляр называет ЕГО.

   И платят за это не кредитами, а тем, чем только и можно заплатить:

   · трафик мира сворачивает на вашу площадку — баржи садятся, смены едят;
   · ваш позывной шестьдесят дней говорят все, на канале, за который вы не
     платили;
   · доступ, а не деньги: запасы экспедиции, человек, который остался, чертёж,
     который никто не продаёт, право быть в списке. */
const FWD_NEED={pad:1,mast:1,habitat:1,lyse:1,melter:1};
const FWD_CREW=2;            /* столько людей должно на нём жить */
const FWD_PAY_EVERY=6;       /* раз в столько смен садится борт */
const FWD_PAY=520;           /* и оставляет столько за приём и заправку */
/* ── годится ли база ──
   Требования — не список покупок, а описание места, куда можно сесть, где
   дышат и откуда слышно. Всё это база или умеет, или нет. */
function fwdFits(B){
  if(!B||(typeof baseIsRuin==="function"&&baseIsRuin(B)))return false;
  if(typeof baseParked==="function"&&baseParked(B))return false;
  for(const k in FWD_NEED){
    let n=0;
    for(const c of (B.cells||[]))if(c&&c.hp>0&&c.k===k)n++;
    if(n<FWD_NEED[k])return false;
  }
  if(((typeof baseCrewN==="function")?baseCrewN(B):0)<FWD_CREW)return false;
  const L=(typeof baseLife==="function")?baseLife(B):null;
  if(!L||L.air<=0||L.water<=0||(L.food|0)<=0)return false;
  return true;
}
/* чего не хватает — словами, потому что «не годится» без причины бесполезно */
function fwdMissing(B){
  const out=[];
  for(const k in FWD_NEED){
    let n=0;
    for(const c of (B.cells||[]))if(c&&c.hp>0&&c.k===k)n++;
    if(n<FWD_NEED[k])out.push(BUILD[k].ru.toLowerCase());
  }
  if(((typeof baseCrewN==="function")?baseCrewN(B):0)<FWD_CREW)out.push("людей хотя бы двое");
  if(typeof baseParked==="function"&&baseParked(B))out.push("база стоит на консервации");
  return out;
}
/* ── та ли это дорога ──
   Экспедиция идёт за край: годится пункт, который стоит ДАЛЬШЕ середины пути,
   а не в обжитом углу. Коридор считается от центра круга. */
const FWD_FAR=9;
function fwdCorridor(B){return Math.hypot(B.sx|0,B.sy|0)>=FWD_FAR;}
/* ── выбранный пункт ──
   Один на экспедицию: тот из годных, который дальше всех. Ничего не хранится —
   считается из того, что есть сейчас. */
function fwdBase(){
  if(typeof expOn!=="function"||!expOn())return null;
  const L=(typeof baseList==="function")?baseList():[];
  let best=null,bd=0;
  for(const B of L){
    if(!fwdFits(B)||!fwdCorridor(B))continue;
    const d=Math.hypot(B.sx|0,B.sy|0);
    if(d>bd){bd=d;best=B;}
  }
  return best;
}
function fwdIs(B){const F=fwdBase();return !!(F&&B&&F.sx===B.sx&&F.sy===B.sy&&F.idx===B.idx);}
/* ── циркуляр называет его ──
   Строка уходит в эфир той же дорогой, что и всё остальное: позывной базы, её
   адрес и одна фраза, ради которой всё и делалось. */
function fwdLine(B){
  B=B||fwdBase();
  if(!B)return "";
  const call=(typeof baseCall==="function")?baseCall(B):"БЗ";
  return "…опорный пункт экспедиции — участок «"+B.name+"», "+call+
    ", система "+(B.sx|0)+":"+(B.sy|0)+". Всем бортам: приём и заправка там.";
}
function fwdAnnounce(B,n){
  if(!B)return 0;
  if(B.fwdSaid)return 0;
  B.fwdSaid=1;
  const s=fwdLine(B);
  if(typeof etherLine==="function")etherLine(s);
  if(typeof baseLog==="function")baseLog(B,"fwd",n,{});
  if(typeof thingAdd==="function")
    thingAdd("paper","Циркуляр · опорный пункт",s+" · шестьдесят дней");
  logAdd("good","Экспедиция назвала опорным пунктом базу «"+B.name+"»");
  return 1;
}
/* ── что там происходит ──
   Не награда, которую забирают, а место, которое вдруг занято. Борта садятся,
   платят за приём и заправку, едят харч и берут воду: трафик мира — это тоже
   расход, и в этом вся честность. */
function fwdStep(B,n){
  if(!fwdIs(B))return 0;
  let said=fwdAnnounce(B,n);
  if((n%FWD_PAY_EVERY))return said;
  const L=baseLife(B);
  const crew=Math.max(1,(typeof baseCrewN==="function")?baseCrewN(B):1);
  /* сел борт: заплатил, поел, залил баки нашей водой */
  if((L.food|0)<=2||L.water<=2)return said;
  L.food=Math.max(0,(L.food|0)-2);
  L.water=Math.max(0,L.water-2);
  if(typeof earn==="function")earn(FWD_PAY,"base");
  B._turn=(B._turn|0)+FWD_PAY;
  baseLog(B,"fwdpay",n,{q:FWD_PAY});
  /* и позывной звучит: канал, за который вы не платили */
  if((n%(FWD_PAY_EVERY*4))===0&&typeof etherLine==="function")
    etherLine("…борт сел на «"+B.name+"». Приняли, заправили, отпустили. Спасибо им.");
  return 1;
}
/* строка для стола */
function fwdLineOf(B){
  if(fwdIs(B))return "ОПОРНЫЙ ПУНКТ ЭКСПЕДИЦИИ · СЮДА САДЯТСЯ И ЗДЕСЬ ЕДЯТ";
  if(typeof expOn!=="function"||!expOn())return "";
  const miss=fwdMissing(B);
  if(!fwdCorridor(B))return "для опорного пункта — слишком близко к центру";
  return miss.length?"до опорного пункта не хватает: "+miss.join(", "):"";
}
