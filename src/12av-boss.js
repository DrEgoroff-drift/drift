/* ══════════════ «РЕВИЗИЯ» (M380, §11.2, D13) ══════════════
   Не держава и не пират. Флагман времён «Долгого Хода», автоматический,
   исполняющий приказ, который никто не отменил: «восстановить план». Он и есть
   антагонист саги (§8), и он приходит туда, где карта изменилась сильнее всего.

   Зачем он нужен. Толпа может перекроить четверть галактики за неделю (§11.1) —
   и на этом упирается в потолок. «Ревизия» — это потолок с лицом: пока она
   стоит в области, вклад толпы там делится на четыре, а сбитая — ЗАКРЕПЛЯЕТ
   изменения области в летописи. Единственная строка, которую не переврёт ни
   одна волна.

   Почему один не может, а толпа может — без всякого live-мультиплеера:

   · щит восстанавливается быстрее, чем стреляет лучший одиночка (2.5×);
   · урон складывается на СЕРВЕРЕ по минутам и по учётным записям, а корпус
     там не восстанавливается вовсе;
   · значит трое сильных или восемь средних В ОДНУ СВОДКУ пробивают щит, и это
     видно каждому из них как ведомость «в бою бортов: 7» и как призраки чужих
     корпусов рядом;
   · и всё-таки один может: щит импульсный и раз в десять минут сам падает на
     двадцать секунд. Сто таких окон — семнадцать часов. Возможно. Очень тяжело.

   Никто никого не видит в реальном времени. Всё, что связывает бортов, — это
   счётчики сводки и семя, из которого рисуется корпус. */
const BOSS_HULL=720000;          /* тридцать минут огня толпы из восьми */
const BOSS_SHIELD=90000;         /* поле, которое надо продавить за сводку */
const BOSS_REGEN=7500;           /* восстановление поля за минуту: 2.5× лучшего одиночки */
const BOSS_WIN=20;               /* секунд окна, когда поле само падает */
const BOSS_EVERY=600;            /* и раз в столько секунд оно падает */
const BOSS_TRIG=25;              /* процентов области, изменившихся за трое суток */
const BOSS_SPAN=12;              /* сводок в «трёх сутках» */
const BOSS_LIFE=40;              /* сводок стоит, если не сбить */
/* ── где он ──
   Область — это дом державы и полоса вокруг него (CHRON_HOME). Считаем, где за
   последние двенадцать сводок сменилось больше четверти систем, и туда он и
   идёт. Считается это из летописи, значит одинаково у всех и не хранится. */
function bossArea(st,N){
  st=st||chronState();
  N=(N===undefined)?st.N:N;
  let best=-1,bestPct=BOSS_TRIG;
  for(let i=0;i<6;i++){
    let tot=0,ch=0;
    for(const k of chronKeys()){
      const p=k.split(","),x=p[0]|0,y=p[1]|0;
      const dx=x-CHRON_HOME[i][0],dy=y-CHRON_HOME[i][1];
      if(dx*dx+dy*dy>36)continue;                 /* дом и полоса вокруг него */
      tot++;
      const S=st.systems[k];
      if(S&&N-S.since<=BOSS_SPAN)ch++;
    }
    if(!tot)continue;
    const pct=Math.round(ch*100/tot);
    if(pct>bestPct){bestPct=pct;best=i;}
  }
  return best<0?null:{i:best,pct:bestPct,x:CHRON_HOME[best][0],y:CHRON_HOME[best][1]};
}
function bossHere(){
  const A=bossActive();
  if(!A)return false;
  const dx=(G.sx|0)-A.x,dy=(G.sy|0)-A.y;
  return dx*dx+dy*dy<=36;
}
/* ── сколько по нему уже отстреляли ──
   Сумма по ведомостям с той сводки, когда он пришёл. Корпус на сервере не
   восстанавливается — значит и здесь не восстанавливается. */
function bossDamage(t0){
  if(typeof warLed!=="function")return {q:0,a:0};
  const L=warLed(),N=(typeof chronNow==="function")?chronNow():0;
  let q=0,a=0;
  for(const n in L){
    if((n|0)<t0||(n|0)>N)continue;
    for(const sys in L[n]){
      if(sys==="__votes")continue;
      const cell=L[n][sys].boss;
      if(!cell)continue;
      q+=cell.q|0;
      a=Math.max(a,(cell.a&&cell.a.length)|0);
    }
  }
  return {q,a};
}
/* ── он здесь или его нет ── */
function bossActive(){
  const st=chronState();
  const A=bossArea(st,st.N);
  if(!A)return null;
  const t0=st.N-((st.N-1)%BOSS_LIFE);            /* окно, в котором он стоит */
  const d=bossDamage(t0);
  const hull=Math.max(0,BOSS_HULL-d.q);
  return {i:A.i,x:A.x,y:A.y,pct:A.pct,t0,hull,dmg:d.q,ships:d.a,
    dead:hull<=0,pinned:hull<=0};
}
/* окно щита: раз в десять минут поле само падает на двадцать секунд. Часы те
   же, что у сводки, значит окно у всех одно и то же */
function bossWindow(){
  const t=Math.floor((Date.now()+(CHRON.off|0))/1000);
  return (t%BOSS_EVERY)<BOSS_WIN;
}
/* щит: пробит, если за прошлую сводку по нему били быстрее, чем он растёт */
function bossShieldDown(A){
  if(!A)return false;
  if(bossWindow())return true;
  const per=A.dmg/Math.max(1,(chronNow()-A.t0+1)*360);   /* урона в минуту */
  return per>BOSS_REGEN;
}
/* ── его корпус в системе ──
   Рисуется тем же генератором, что все: флагманская выпечка ренегата (12i) и
   вдвое крупнее. Отдельного арта у него нет и не нужно. */
function bossShip(){
  const A=bossActive();
  if(!A||A.dead)return null;
  const id="revizia";
  if(!NPC_SHIPS[id])NPC_SHIPS[id]={name:id,seed:0x0E7151,hcls:"warship",col:"#c9c9d4",
    hull:BOSS_HULL,cargo:0,fuel:999,thr:.8,cls:"«Ревизия»",by:"gt"};
  return {id,A};
}
let BOSS_ACC=0,BOSS_SENT=0;
/* урон копится на клиенте и уходит на сервер раз в минуту: по минутам его и
   складывают (§11.2), а каждый выстрел слать — это не игра, а флуд */
function bossHit(dmg){
  const A=bossActive();
  if(!A||A.dead)return;
  BOSS_ACC+=Math.max(0,dmg|0);
  const now=Date.now();
  if(now-BOSS_SENT<60000||BOSS_ACC<=0)return;
  BOSS_SENT=now;
  const q=Math.min(60000,BOSS_ACC|0);
  BOSS_ACC=0;
  if(typeof warPut==="function")warPut("boss",q,A.x+","+A.y);
}
/* ── строка для игрока ──
   Ни чата, ни списка: ведомость и призраки. Сколько бортов бьётся — единственное,
   что он знает о других, и этого достаточно, чтобы не чувствовать себя одному. */
function bossLine(){
  const A=bossActive();
  if(!A)return "";
  if(A.dead)return "«РЕВИЗИЯ» СБИТА · ИЗМЕНЕНИЯ ЗАКРЕПЛЕНЫ";
  const pc=Math.round(A.hull*100/BOSS_HULL);
  return "«РЕВИЗИЯ» · КОРПУС "+pc+" % · В БОЮ БОРТОВ: "+Math.max(1,A.ships)+
    (bossShieldDown(A)?" · ПОЛЕ ПРОБИТО":" · ПОЛЕ ДЕРЖИТ");
}
/* пока он стоит, вклад толпы в этой области делится на четыре (§11.2) */
function bossPressMul(sx,sy,area){
  const A=area||bossActive();
  if(!A||A.dead)return 1;
  const dx=(sx|0)-A.x,dy=(sy|0)-A.y;
  return (dx*dx+dy*dy<=36)?.25:1;
}
