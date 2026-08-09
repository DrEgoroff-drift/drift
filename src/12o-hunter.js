/* ══════════════ охотник: тень репутации ══════════════
   Репутация (12k) до сих пор умела только помогать: дешевле топливо, больше
   людей за столами. Обратной стороны у неё не было, и потому враждебность
   ничего не стоила — разбитая баржа отнимала три очка в таблице, которую никто
   не читает.

   Здесь у минуса появляется тело. Не абстрактный штраф, а капитан с именем,
   которого наняли за вами: он держится своих мест, растёт с каждым новым делом,
   и в бою его узнают по силуэту. Правила, которые легко сломать:

   1. Охотник приходит ТОЛЬКО за долгом. Нет враждебного поступка — нет
      охотника; он не появляется «для сложности» и не наказывает за бедность.
   2. Убитый не возвращается. Он один, у него одно имя, и второй такой же с тем
      же именем обесценил бы первого.
   3. Награда за него разовая. Контракт закрывается один раз навсегда, даже
      если по фракции снова накопится долг. */

const HUNT_NAMES=["Клык","Сажа","Веретено","Гарпун","Кремень","Сухарь","Тесак","Полынь"];
const HUNT_TIERS=[
  {ru:"наёмник",   hull:1.6,dmg:1.3,pay:1400},
  {ru:"охотник",   hull:2.4,dmg:1.7,pay:2600},
  {ru:"ловчий",    hull:3.6,dmg:2.2,pay:4800}
];
const HUNT_RADIUS=5;                     // сколько секторов вокруг его места он держит

function huntKey(sys){return (sys?sys.sx:G.sx)+","+(sys?sys.sy:G.sy);}
function huntAll(){return (G.hunted||(G.hunted={}));}
function huntTierOf(H){return HUNT_TIERS[clamp(H.tier|0,0,HUNT_TIERS.length-1)];}
/* ── долг записан ──
   Единственный вход. Зовут его поступки, а не числа: разбитая баржа, добитый
   спасатель, всё, за что фракция и так снимает репутацию. */
function huntMark(sys,why){
  const k=huntKey(sys);if(!k||k==="null,null")return null;
  const all=huntAll();
  let H=all[k];
  if(H&&H.dead)return null;              /* убитого не воскрешают ничем */
  if(!H){
    const seed=hashi((sys?sys.sx:G.sx)*131+(sys?sys.sy:G.sy),0x4A17,7);
    const r=rng(seed);
    H=all[k]={cap:pick(HUNT_NAMES,r)+" "+pick(PIRATE_NAMES,r),seed,tier:0,
      made:Date.now(),deeds:0,dead:0,paid:0,seen:0};
    logAdd("warn","За «"+(why||"дело")+"» вами занялись: капитан "+H.cap+
      " ищет вас в секторе "+k);
    say("ЗА ВАМИ ПОШЛИ\nкапитан "+H.cap+"\nсектор "+k);
  }else if(H.tier<HUNT_TIERS.length-1){
    H.tier++;
    logAdd("warn","Капитан "+H.cap+" пришёл за вами всерьёз: "+huntTierOf(H).ru);
  }
  H.deeds++;
  huntQuest(H,k);
  if(typeof saveGame==="function")saveGame(true);
  return H;
}
/* адрес в журнале: у долга должно быть место, куда лететь его закрывать */
function huntQuest(H,k){
  if(typeof questAdd!=="function")return;
  const p=k.split(",");
  questAdd("hunt:"+H.seed,{
    ru:"Капитан "+H.cap,kind:"debt",from:"фракция сектора "+k,
    note:"вы ему должны кровью: "+huntTierOf(H).ru+", ходит вокруг своего сектора. "+
      "Награда за него одна и больше не повторится",
    sx:+p[0]|0,sy:+p[1]|0,reward:huntTierOf(H).pay+" кр разово"});
}
/* ── где он ходит ──
   Вокруг своего сектора, а не по всей галактике: у мести есть география. */
function huntHere(){
  const all=G.hunted;if(!all)return null;
  for(const k in all){
    const H=all[k];if(!H||H.dead)continue;
    const p=k.split(",");
    if(Math.max(Math.abs(G.sx-(+p[0]|0)),Math.abs(G.sy-(+p[1]|0)))<=HUNT_RADIUS)
      return Object.assign({key:k},H);
  }
  return null;
}
/* его логово: свой сектор, и вот у него наконец есть владелец (закрывает хвост
   M87 — логово выглядело обычной базой снаружи) */
function huntLairAt(sx,sy){
  const all=G.hunted;if(!all)return null;
  const k=sx+","+sy,H=all[k];
  return H&&!H.dead?Object.assign({key:k},H):null;
}
function huntLairName(sx,sy){
  const H=huntLairAt(sx,sy);
  return H?"логово капитана "+H.cap:null;
}
/* ── выход в систему ──
   Такая же запись в G.pirates, как ренегат: весь бой уже написан. Корпус
   печётся флагманской выпечкой (12i), поэтому в кадре он опознаётся сразу. */
function huntSpawn(){
  const H=huntHere();if(!H)return;
  const T=huntTierOf(H);
  const r=rng(hashi(H.seed,0x0FF,5));
  const a=r()*TAU,rad=2000+r()*1100;
  const hp=(60+sysDanger(G.sx,G.sy)*90)*T.hull;
  G.pirates.push({x:Math.cos(a)*rad,y:Math.sin(a)*rad,vx:0,vy:0,a:a+Math.PI,
    hull:hp,hullMax:hp,name:"капитан "+H.cap,seed:H.seed,
    shipId:pirateShipId(hashi(H.seed,0xB16,3)),
    dmg:5+T.dmg*3,cool:0,aware:false,thrust:false,hunter:1,huntKey:H.key});
  const rec=huntAll()[H.key];
  if(rec&&!rec.seen){
    rec.seen=1;
    say("КАПИТАН "+H.cap.toUpperCase()+"\n"+T.ru+" · он нашёл вас первым");
  }
}
/* ── разбит ──
   Награда разовая и записана навсегда: второй раз этих денег не получить, и
   второго такого капитана не будет. */
function huntDefeated(p){
  const all=huntAll(),H=all[p.huntKey];
  sfx("boom",{v:1});
  if(!H||H.dead)return;
  H.dead=1;
  const T=huntTierOf(H);
  let pay=0;
  if(!H.paid){H.paid=1;pay=Math.round(T.pay*stat().bountyMul);earn(pay,"bounty");}
  G.kills=(G.kills|0)+1;
  /* с него падает узел: он вёз своё (05a-nodes) */
  if(typeof nodeDrop==="function")nodeDrop("с охотника",1,hashi(H.seed,0x1D0,9));
  if(typeof questDone==="function")questDone("hunt:"+H.seed,"долг закрыт");
  say("Капитан "+H.cap+" разбит"+(pay?"\n+"+pay+" кр · награда разовая":""));
  logAdd("kill","Капитан "+H.cap+" уничтожен"+(pay?" · +"+pay+" кр (разово)":"")+
    " · второй раз он не придёт");
  if(typeof saveGame==="function")saveGame(true);
}
