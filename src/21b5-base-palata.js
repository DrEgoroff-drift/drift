/* ══════════════ ПАЛАТА (M408, DESIGN-base §28–§32, §40) ══════════════
   Автор снял закон невозмутимости (§40): шутка играется в полную силу и до
   конца. Взамен — ремесленное правило, потому что громкая комедия ломается
   быстрее тихой, а этой шутке идти всю игру:

     АБСУРД — ЭТО ВСЕГДА КАНЦЕЛЯРСКАЯ ЛОГИКА, ДОВЕДЁННАЯ ДО КОНЦА ВСЕРЬЁЗ.
     Никогда — шутка извне мира. Ни мемов, ни анахронизмов, ни персонажа,
     который знает, что он смешной. ПАЛАТА смешна тем, что она ПОСЛЕДОВАТЕЛЬНА,
     и игрок смеётся над учреждением, которое искренне старается.

   Восемь инструментов §28, каждый мал, вместе — смертельны. Здесь заведены
   шесть: реестр, участковый сбор, доля с оборота, сводка с пенёй, проверка и
   снятие с учёта. Клеймо и счётчик отгрузки ждут своей вехи — им нужен путь
   груза, а не путь базы.

   И главное следствие §30: БРОСИТЬ БАЗУ — НЕ ЗНАЧИТ ЕЁ ЗАКРЫТЬ. Развалина
   остаётся в реестре и продолжает начислять, пока её не снимут с учёта или
   пока ПАЛАТА не заберёт участок за долги. Это самая жестокая строка всего
   замысла, и она же — самая смешная бумага в игре. */
const PAL_PERIOD=90;         /* смен в отчётном периоде */
const PAL_FEE=420;           /* участковый сбор за период, с участка */
const PAL_SHARE=.01;         /* доля с оборота сверх порога */
const PAL_FLOOR=4000;        /* порог, выше которого доля считается */
const PAL_SVOD=40;           /* смен между сводками */
const PAL_PENY=180;          /* пеня за несданную сводку */
const PAL_CLOSE=800;         /* снятие с учёта */
const PAL_SEIZE=9000;        /* долг, за который участок забирают */
const PAL_MODES={
  simple:{ru:"Простой",fee:90,  share:0, svod:0,
    note:"без наёмных, один бур, отдача с потолком — зато никаких сводок",
    cap:1},
  patent:{ru:"Патент", fee:1400,share:0, svod:200,
    note:"дорого и заранее известно; чем лучше идут дела, тем больше экономит",
    cap:0},
  common:{ru:"Общий",  fee:PAL_FEE,share:PAL_SHARE,svod:PAL_SVOD,
    note:"всё как у всех: сбор, доля с оборота и сводка каждые сорок смен",
    cap:0}
};
const PAL_MODE_KEYS=Object.keys(PAL_MODES);
const PAL_SWITCH=200;        /* реже раза в двести смен режим не меняют */
/* ── бумаги, которые она присылает ──
   Числа настоящие, названия — нет. Каждая строка честно описывает саму себя. */
const PAL_FORMS=[
  "Форма 4-БУР-2, приложение Ж: сведения о намерении сведений не подавать",
  "Форма 12-УЧ: уведомление об уведомлении",
  "Форма 1-ПРИЛ, лист 3 из 2: перечень листов",
  "Форма 9-СВД: сводка о своевременности сводок",
  "Форма 3-ЗАТВ: акт о наличии затвора и о его надлежащем закрытии"
];
const PAL_FEES_RU=[
  "Сбор за право пользования правом на участок",
  "Пеня за своевременность (поступление ранее срока нарушает очередь)",
  "Сбор за рассмотрение сбора",
  "Плата за бесплатное уведомление"
];
/* инспектор — человек с именем и биографией, и он вежлив */
function palInspector(){
  const r=rng(hashi(0x1E5,0x0C10,7));
  const nm=(typeof genName==="function")?genName(r):"Инспектор";
  const rank=["младший инспектор","инспектор","старший инспектор",
    "ведущий инспектор участка"];
  const grew=Math.min(rank.length-1,Math.floor(((typeof baseShift==="function")?baseShift():0)/900));
  return {name:nm,rank:rank[grew],grew};
}
/* ── участок в реестре ── */
function palOf(B){
  if(!B.pal||typeof B.pal!=="object")
    B.pal={mode:"common",since:(typeof baseShift==="function")?baseShift():0,
      paid:(typeof baseShift==="function")?baseShift():0,svod:(typeof baseShift==="function")?baseShift():0,
      debt:0,closed:0,switched:0};
  return B.pal;
}
function palMode(B){return PAL_MODES[palOf(B).mode]||PAL_MODES.common;}
function palRegistered(B){return !palOf(B).closed;}
/* ── снятая с учёта база (разбор 0.409.1) ──
   Было: 800 кр один раз — и никаких бумаг навсегда, при этом база работает как
   прежде. Доминирующая стратегия и конец всей шутке на первом же игроке,
   который это нажмёт.

   На деле участок вне реестра — это участок, с которого прилавок не берёт
   товар: возить с него можно, продать нельзя. Добыча идёт вполсилы (в дело
   годится только то, что нужно самой базе), площадка не принимает чужие борта,
   и опорным пунктом такая база не бывает. Тишина стоит темпа. */
const PAL_OFF=.55;           /* столько остаётся от выработки вне реестра */
/* «простой» и правда ограничивает: один бур и никаких наёмных */
function palCapWork(B){
  const M=palMode(B);
  if(!palRegistered(B))return PAL_OFF;
  if(!M.cap)return 1;
  const drills=(typeof basePower==="function")?basePower(B).drills:1;
  let m=drills>1?1/drills:1;                       /* больше одного бура не в счёт */
  if(typeof baseCrewN==="function"&&baseCrewN(B)>0)m*=.75;
  return m;
}
/* ── что начисляется за смену ──
   Сбор — за нахождение В РЕЕСТРЕ, а не за работу: он идёт и на консервации, и
   под завалом, и в развалине. Доля — с того, что база и правда заработала. */
function palStep(B,n){
  const P=palOf(B);
  if(P.closed)return 0;
  const M=palMode(B);
  let said=0;
  if(n-(P.paid|0)>=PAL_PERIOD){
    P.paid=n;
    P.debt=(P.debt|0)+M.fee;
    baseLog(B,"palfee",n,{q:M.fee,ru:PAL_FEES_RU[0]});
    said=1;
  }
  if(M.share&&(B._turn|0)>PAL_FLOOR){
    const cut=Math.round(((B._turn|0)-PAL_FLOOR)*M.share);
    B._turn=0;
    if(cut>0){P.debt=(P.debt|0)+cut;baseLog(B,"palshare",n,{q:cut});said=1;}
  }
  if(M.svod&&n-(P.svod|0)>=M.svod){
    /* сводку подаёт радист или управляющий; иначе набегает пеня — тихо и там,
       куда игрок не смотрит */
    const filed=(typeof baseRoleForce==="function"&&baseRoleForce(B,"radist")>0)||
      (typeof bmgrOfBase==="function"&&bmgrOfBase(B)&&!(typeof bmgrSilent==="function"&&bmgrSilent(B)));
    P.svod=n;
    if(filed)baseLog(B,"palsvod",n,{});
    else{P.debt=(P.debt|0)+PAL_PENY;baseLog(B,"palpeny",n,{q:PAL_PENY});}
    said=1;
  }
  /* ── проверка приходит С ПРОГНОЗОМ (разбор 0.409.1) ──
     «Плановая объявляется за смену» было написано в комментарии и нигде в
     коде: штраф прилетал молча. За четыре смены до неё журнал пишет строку —
     ту самую, которую игрок может успеть прочесть по СВЯЗИ. */
  if((n%PAL_PERIOD)===Math.floor(PAL_PERIOD/2)-4){
    const I=palInspector();
    baseLog(B,"palsoon",n,{who:I.name,rank:I.rank});
    said=1;
  }
  if((n%PAL_PERIOD)===Math.floor(PAL_PERIOD/2)){
    const I=palInspector();
    const fine=120+((hashi(B.sx,B.sy,n)%9)*40);
    P.debt=(P.debt|0)+fine;
    baseLog(B,"palcheck",n,{who:I.name,rank:I.rank,q:fine,
      form:PAL_FORMS[hashi(n,B.idx|0,3)%PAL_FORMS.length]});
    said=1;
  }
  /* и изъятие: долг, который никто не платит, кончается участком */
  if((P.debt|0)>=PAL_SEIZE&&!(typeof baseIsRuin==="function"&&baseIsRuin(B))){
    B.ruin={n,who:"pal"};
    for(const cell of (B.cells||[]))if(cell)cell.hp=0;
    baseLog(B,"palseize",n,{q:P.debt|0});
    logAdd("warn","ПАЛАТА изъяла участок базы «"+B.name+"» за долг "+(P.debt|0)+" кр");
    said=1;
  }
  return said;
}
/* ── что игрок с этим делает ── */
function palPay(B){
  const P=palOf(B);
  const d=P.debt|0;
  if(d<=0){say("Задолженности нет");return 0;}
  if(G.credits<d){say("К уплате "+d.toLocaleString("ru")+" кр\nна счету не хватает");return 0;}
  G.credits-=d;P.debt=0;
  tell("money","ПАЛАТА: уплачено "+d.toLocaleString("ru")+" кр",
    "УПЛАЧЕНО\n"+d.toLocaleString("ru")+" кр\n"+PAL_FORMS[1]);
  return d;
}
function palSetMode(B,k){
  const P=palOf(B),n=(typeof baseShift==="function")?baseShift():0;
  if(!PAL_MODES[k]||P.mode===k)return false;
  if(n-(P.switched|0)<PAL_SWITCH&&P.switched){
    say("Режим меняют не чаще раза в "+PAL_SWITCH+" смен\nосталось "+
      (PAL_SWITCH-(n-(P.switched|0)))+" смен");
    return false;
  }
  P.mode=k;P.switched=n;P.paid=n;
  tell("tech","Режим участка: "+PAL_MODES[k].ru,
    "РЕЖИМ УЧАСТКА\n"+PAL_MODES[k].ru+"\n"+PAL_MODES[k].note+
    "\nсбор "+PAL_MODES[k].fee+" кр за период");
  return true;
}
function palClose(B){
  const P=palOf(B);
  if(P.closed){say("Участок уже снят с учёта");return false;}
  const d=(P.debt|0)+PAL_CLOSE;
  if(G.credits<d){
    say("Снятие с учёта: "+PAL_CLOSE+" кр и погашение долга "+(P.debt|0)+" кр\n"+
      "итого "+d.toLocaleString("ru")+" кр");
    return false;
  }
  G.credits-=d;P.debt=0;P.closed=1;
  tell("tech","Участок снят с учёта","СНЯТИЕ С УЧЁТА\n−"+d.toLocaleString("ru")+" кр\n"+
    "и четыре смены бумаги, которые ПАЛАТА проведёт без вас");
  return true;
}
/* строка для стола: чем этот участок обязан и по какому режиму */
function palLine(B){
  const P=palOf(B),M=palMode(B);
  if(P.closed)return "участок снят с учёта · ПАЛАТА больше ничего не начисляет";
  const d=P.debt|0;
  return "режим: "+M.ru.toLowerCase()+" · сбор "+M.fee+" кр за период"+
    (d?" · к уплате "+d.toLocaleString("ru")+" кр":" · задолженности нет");
}
