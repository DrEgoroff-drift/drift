/* ══════════════ развалина и возврат (M402, DESIGN-base §22.1, §39) ══════════════
   Потерять базу можно, и это должно быть по-настоящему больно. Но потерять её
   НАВСЕГДА нельзя ни из какого состояния — это правило §39, и оно сильнее
   всякой драмы: из аккаунта ничего не удаляется, и нет положения, из которого
   базу нельзя было бы поднять.

   Что происходит, когда база брошена по-настоящему — не «встала» (это M391 и
   консервация), а осталась без людей и без запаса на целые сутки:

     · она становится РАЗВАЛИНОЙ: построенное стоит разбитым (`hp:0`);
     · через несколько смен в неё кто-то въезжает — поселенец или пиратская
       застава, то есть цель для военного слоя, сложенная из ваших же стен;
     · вернуться можно ВСЕГДА: выкупить, вычистить или просто прийти в пустую,
       а потом чинить от нуля за долю постройки.

   Что теряется на самом деле — время, деньги, ушедшие люди и та история, что о
   вас теперь рассказывают. Этого достаточно. */
const RUIN_AFTER=24;         /* сутки без людей и без запаса — и это развалина */
const RUIN_TENANT=12;        /* через столько смен в неё кто-то въезжает */
const RUIN_SQUAT=2200;       /* выкуп у поселенца */
const RUIN_PIRATE=6500;      /* и у заставы, если не хочется драться */
const RUIN_FIX=.25;          /* починка от нуля — четверть постройки */
function baseIsRuin(B){return !!(B&&B.ruin);}
/* ── как база доходит до развалины ──
   Только через полное запустение: ни одного человека, пустой запас и сутки в
   таком виде. Игрок, который просто улетел на неделю, к этому не придёт —
   у него база стоит на консервации и ждёт (§13). */
function baseRuinCheck(B,n){
  if(B.ruin)return 0;
  const crew=(typeof baseCrewN==="function")?baseCrewN(B):0;
  const L=(typeof baseLife==="function")?baseLife(B):{air:1,water:1,food:1};
  const empty=(L.air|0)<=0&&(L.water|0)<=0;
  if(crew>0||!empty){B.dead=0;return 0;}
  B.dead=(B.dead|0)+1;
  if(B.dead<RUIN_AFTER)return 0;
  B.ruin={n:n|0,who:null};
  for(const cell of (B.cells||[]))if(cell)cell.hp=0;
  B.fire=null;B.guest=null;
  baseLog(B,"ruin",n,{});
  logAdd("warn","База «"+B.name+"» брошена: людей нет, запаса нет");
  return 1;
}
/* ── кто въехал ──
   Считается от номера смены, как всё остальное: поселенец или застава. */
function baseTenant(B,n){
  if(!B.ruin)return null;
  if(B.ruin.who==="pal")return "pal";        /* въехала ПАЛАТА — это не жильцы */
  if(n===undefined)n=(typeof baseShift==="function")?baseShift():0;
  if(n-(B.ruin.n|0)<RUIN_TENANT)return null;
  if(B.ruin.who)return B.ruin.who;
  const d=(typeof sysDanger==="function")?sysDanger(B.sx,B.sy):.3;
  const r=rng(hashi(B.sx*211+B.sy,(B.idx|0)*41+3,B.ruin.n|0));
  B.ruin.who=(r()<clamp(.25+d*.5,0,.85))?"pirate":"squat";
  baseLog(B,"tenant",n,{who:B.ruin.who==="pirate"?"пиратская застава":"поселенцы"});
  return B.ruin.who;
}
function baseRuinPrice(B){
  const who=baseTenant(B);
  /* участок, изъятый за долг (M408), выкупается у ПАЛАТЫ — и стоит он ровно
     того долга плюс сбор за само изъятие. Разбор 0.409.1: он возвращался даром,
     потому что `21b0` знал только поселенцев и заставу */
  if(who==="pal"||(B.ruin&&B.ruin.who==="pal"))
    return ((typeof palOf==="function")?(palOf(B).debt|0):0)+PAL_CLOSE;
  return who==="pirate"?RUIN_PIRATE:(who==="squat"?RUIN_SQUAT:0);
}
/* заставу можно и вычистить: прилететь и снять всех, кто в системе. Это не
   отдельная сцена — это та же война, которая в игре уже есть */
function baseRuinClearable(B){
  if(baseTenant(B)!=="pirate")return false;
  if((G.sx|0)!==(B.sx|0)||(G.sy|0)!==(B.sy|0))return false;
  return !(G.pirates||[]).some(p=>p.hull>0&&!p.pw);
}
/* ── вернуться ── */
function baseRuinTake(B){
  if(!B.ruin)return false;
  const who=baseTenant(B);
  const n=(typeof baseShift==="function")?baseShift():0;
  if(who==="pal"){
    const d=baseRuinPrice(B);
    if(G.credits<d){
      say("Выкуп участка у ПАЛАТЫ: "+d.toLocaleString("ru")+" кр\n(долг и сбор за изъятие)");
      return false;
    }
    G.credits-=d;
    if(typeof palOf==="function")palOf(B).debt=0;
  }else if(who==="pirate"&&!baseRuinClearable(B)){
    if(G.credits<RUIN_PIRATE){
      say("Застава уйдёт за "+RUIN_PIRATE.toLocaleString("ru")+" кр\nили за то, что вы её снимете");
      return false;
    }
    G.credits-=RUIN_PIRATE;
  }else if(who==="squat"){
    if(G.credits<RUIN_SQUAT){
      say("Поселенцы съедут за "+RUIN_SQUAT.toLocaleString("ru")+" кр");
      return false;
    }
    G.credits-=RUIN_SQUAT;
  }
  B.ruin=null;B.dead=0;
  const L=baseLife(B);
  L.air=Math.max(L.air,LIFE_START/2);L.water=Math.max(L.water,LIFE_START/2);
  L.food=Math.max(L.food|0,LIFE_START/2);
  B.t0=n;
  baseLog(B,"back",n,{});
  tell("good","База «"+B.name+"» снова ваша","БАЗА ВЕРНУЛАСЬ\nотсеки стоят разбитыми — чинить от нуля");
  return true;
}
/* починка отсека от нуля: четверть постройки, и ни один не потерян навсегда */
function baseFixCost(B,k){
  const c=baseCost(k,B);
  return {credits:Math.max(50,Math.round(c.credits*RUIN_FIX/10)*10),
          alloy:Math.max(1,Math.round((c.alloy||0)*RUIN_FIX))};
}
function baseFixCell(B,c,r){
  const cell=baseCell(B,c,r);
  if(!cell||cell.hp>0)return false;
  if(baseIsRuin(B)){say("Сперва вернуть базу себе");return false;}
  const cost=baseFixCost(B,cell.k);
  if(!canPay(cost)){
    say("На починку нужно "+cost.credits+" кр"+(cost.alloy?" и "+cost.alloy+" сплавов":""));
    return false;
  }
  payCost(cost);
  cell.hp=1;
  tell("money","Отсек восстановлен: "+BUILD[cell.k].ru,
    "ВОССТАНОВЛЕНО\n"+BUILD[cell.k].ru+"\n−"+cost.credits+" кр");
  return true;
}
/* строка для стола */
function baseRuinLine(B){
  if(!B.ruin)return "";
  const who=baseTenant(B);
  return "РАЗВАЛИНА"+(who==="pirate"?" · пиратская застава":
    (who==="squat"?" · въехали поселенцы":(who==="pal"?" · участок у ПАЛАТЫ":" · пока пусто")))+
    (baseRuinClearable(B)?" · снять её можно прямо сейчас":
      (baseRuinPrice(B)?" · выкуп "+baseRuinPrice(B).toLocaleString("ru")+" кр":""));
}
