/* ══════════════ люди в комнате (M395, DESIGN-base §8) ══════════════
   До сих пор людей на базу назначали из меню на станции — то есть из другого
   места и другого экрана. Человек при этом был числом в списке: «персонал 2/4».
   А на базе в это время был нарисован рабочий, который никого не изображал.

   Здесь эти двое становятся одним. Нарисованный рабочий — это тот самый
   человек, у него есть имя над головой, и назначают его ТАМ, ГДЕ ОН СТОИТ:
   подошли к отсеку, нажали ЦЕЛЬ, выбрали, кто здесь работает. Меню на станции
   остаётся — оно про флот; база штатится там, где её видно.

   И роли растут с четырёх до семи (§8). Три новых — ровно под те три шкалы,
   которые появились в M391–M393, и под мачту из M394:

     жизнеобеспеченец — воздух и вода идут на треть щедрее;
     садовод          — харча на две пятых больше, и он никогда не скверный;
     радист           — база слышна дальше и зовёт даже сквозь плохой сигнал.

   Приходят люди сами: у маяка раз в тридцать смен кто-то просится остаться и
   ждёт у затвора. Взять его — решение игрока, а не строка в журнале: у гостя
   есть жалованье, как у всех. */
const JOB_ROLE={
  drill:"driller",
  lyse:"life",melter:"life",cryo:"life",radiator:"life",
  garden:"gardener",vat:"gardener",
  mast:"radist",beacon:"radist",
  battery:"guard",
  refinery:"engineer",storage:"logist",habitat:"engineer",lab:"engineer",
  reactor:"engineer",solar:"engineer",pad:"logist"
};
const GUEST_EVERY=30;        /* раз в столько смен у маяка кто-то просится */
function baseHasBeacon(B){
  for(const cell of (B.cells||[]))if(cell&&cell.hp>0&&cell.k==="beacon")return true;
  return false;
}
/* ── что дают три новые роли ── */
function baseLifeBoost(B){
  return 1+((typeof baseRoleForce==="function")?clamp(baseRoleForce(B,"life")*.3,0,.9):0);
}
function baseFoodBoost(B){
  return 1+((typeof baseRoleForce==="function")?clamp(baseRoleForce(B,"gardener")*.4,0,1.2):0);
}
function baseFoodKeepsGood(B){
  return (typeof baseRoleForce==="function")&&baseRoleForce(B,"gardener")>0;
}
/* ── кто работает в этой ячейке ──
   Роль ячейки — это её работа; человек, стоящий на этой работе, и есть тот,
   кого рисуют в отсеке. Двое на одной работе — рисуется первый, а список знает
   обоих. */
function baseCellRole(cell){return cell?JOB_ROLE[cell.k]||null:null;}
function baseCellStaff(B,cell){
  const role=baseCellRole(cell);
  if(!role||typeof baseStaff!=="function")return [];
  return baseStaff(B).filter(c=>c.role===role);
}
/* ── назначить прямо здесь ──
   Свободный человек — тот, кто не занят другим приказом. Мест не хватает —
   говорим об этом словами, а не молчим. */
function baseFreeCrew(){
  return (G.crew||[]).filter(c=>!c.order||c.order.kind==="home");
}
function baseAssignHere(B,cell,c){
  const role=baseCellRole(cell);
  if(!role||!c)return false;
  if(typeof assignToBase!=="function")return false;
  return assignToBase(c,B,role);
}
/* ── гость у затвора (§8) ──
   Маяк зовёт, и раз в тридцать смен кто-то приходит. Чем выше дух, тем охотнее
   идут: место, где людям хорошо, слышно дальше всякой мачты. */
function baseGuestRoll(B,n){
  if(B.guest||!baseHasBeacon(B))return 0;
  if((n%GUEST_EVERY)!==0)return 0;
  const sp=(typeof baseSpirit==="function")?baseSpirit(B,n):100;
  const r=rng(hashi(B.sx*331+B.sy,B.idx*23+11,hashi(n,0x6E57,0x9)));
  /* открытая дверь (M399): к такой базе идут вдвое охотнее */
  const door=(typeof charterGuestMul==="function")?charterGuestMul(B):1;
  if(r()>clamp(sp/140*door,.1,.92))return 0;
  const seed=hashi(B.sx,B.sy,n)>>>0;
  const rr=rng(seed);
  const roles=(typeof ROLE_KEYS!=="undefined")?ROLE_KEYS:["driller"];
  B.guest={name:(typeof genName==="function")?genName(rr):"Человек",
    role:pick(roles,rr),seed,n};
  /* и один из шести приходит не тот — это цена открытой двери, а не характер
     человека: дверь открыта всем, значит однажды войдёт и такой */
  if(typeof charterBadGuest==="function"&&charterBadGuest(B,seed))B.guest.bad=1;
  baseLog(B,"guest",n,{who:B.guest.name});
  return 1;
}
/* взять гостя: он становится обычным наёмником — с жалованьем и с местом */
function baseGuestTake(B){
  const g=B.guest;
  if(!g)return false;
  if(typeof baseSlots==="function"&&typeof baseStaff==="function"&&
     baseStaff(B).length>=baseSlots(B)){
    say("На базе нет жилых мест\nстройте жилой отсек");
    return false;
  }
  /* он такой же наёмник, как все: тот же генератор, тот же потолок звена,
     то же жалованье. Даром приходит человек, а не работник без цены */
  if(typeof crewCap==="function"&&G.crew.length>=crewCap()){
    say("Человек пришёл, а места в звене нет\nнужна лицензия на флот");
    return false;
  }
  const m=(typeof genMerc==="function")?genMerc(g.seed,null):{name:g.name,spec:"mine"};
  m.name=g.name;m.fee=0;m.role=g.role;
  const p=Object.assign(m,{cargo:{},order:{kind:"base",sx:B.sx,sy:B.sy,idx:B.idx},
    tMs:Date.now(),paidMs:Date.now()});
  G.crew.push(p);
  /* если это был тот самый один из шести — через двое суток на складе недосчёт */
  if(g.bad)B.thief=((typeof baseShift==="function")?baseShift():0)+8;
  B.guest=null;
  tell("good",p.name+" остался на базе «"+B.name+"»",
    "ОСТАЛСЯ\n"+p.name+" · "+((typeof BASE_ROLES!=="undefined"&&BASE_ROLES[p.role])?BASE_ROLES[p.role].ru:p.role)+
    "\nжалованье идёт как у всех");
  return true;
}
function baseGuestDrop(B){
  if(!B.guest)return false;
  const n=(typeof baseShift==="function")?baseShift():0;
  baseLog(B,"guestno",n,{who:B.guest.name});
  B.guest=null;
  return true;
}
/* ── меню людей в сцене ──
   Строится не списком на экране, а той же лентой, что и меню постройки: ◀ ▶
   выбирают, ДЕЙСТВИЕ ставит, НАЗАД закрывает. */
/* Список — это все, кого можно поставить на эту работу: кто уже здесь, кто
   свободен и КТО УЖЕ НА БАЗЕ, но на другой работе (разбор 0.409.1: переставить
   человека внутри базы было нельзя — только через станцию). */
function basePeopleList(B,cell){
  const here=baseCellStaff(B,cell);
  const mine=((typeof baseStaff==="function")?baseStaff(B):[]).filter(c=>here.indexOf(c)<0);
  const free=baseFreeCrew().filter(c=>here.indexOf(c)<0&&mine.indexOf(c)<0);
  return here.concat(mine,free);
}
function basePeopleLine(B,cell,i){
  const L=basePeopleList(B,cell),role=baseCellRole(cell);
  const R=(typeof BASE_ROLES!=="undefined")?BASE_ROLES[role]:null;
  const head=(R?R.ru.toUpperCase():"РАБОТА")+" · "+(R?R.note:"");
  if(!L.length)return head+"\nсвободных людей нет — нанимают на станции";
  const c=L[i%L.length];
  const here=baseCellStaff(B,cell).indexOf(c)>=0;
  return head+"\n"+c.name+" · "+((typeof crewSkill==="function")?("опыт "+Math.round(crewSkill(c)*100)+"%"):"")+
    (c.spec===(R?R.spec:"")?" · по специальности":" · не по профилю")+
    "\n"+(here?"уже здесь":"ДЕЙСТВИЕ — поставить сюда")+" · ◀ ▶ — кто · НАЗАД — закрыть";
}
