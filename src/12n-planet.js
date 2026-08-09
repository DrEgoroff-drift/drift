/* ══════════════ планета для коллекции ══════════════
   У дома (12j) есть своя воронка — оборот: всё, что вселенная принесла деньгами.
   У сотни редкостей (12m) воронки не было вовсе: сотый предмет клал строчку в
   журнал и на этом заканчивался. Планета — вторая воронка роста, и растит её
   ПОЛНОТА, а не оборот. Две воронки не смешиваются: планету нельзя купить, как
   дом нельзя купить, и частичный набор не даёт ничего — за частичный уже платит
   стена в доме.

   Что она такое по замыслу: не строка дохода, а точка на карте фактора. Она
   родит товар, как станция, и к ней начинают заходить баржи (12l). Награда в
   том, что игрок перестаёт быть клиентом системы и становится её узлом. Кредитов
   планета не платит НИКОГДА — только товаром: увезите сами или дождитесь баржи. */

const PLANET_FULL=100;                   // только полный набор, без раздач по частям
const PLANET_RATE=2.4;                   // единиц в минуту на каждый свой ресурс
const PLANET_CAP=260;                    // потолок склада на ресурс: узел не копит вечно
const PLANET_BARGE=.6;                   // сколько своих запасов баржа берёт на борт

function planetReady(){
  return typeof rareCount==="function"&&rareCount()>=PLANET_FULL;
}
/* ── выдача ──
   Не выбирается из списка и не покупается: узлом становится та планета, где вы
   стояли, когда собрали сотую. Место находки и есть награда. */
function planetGrant(p){
  if(G.pnode)return null;
  if(!planetReady())return null;
  p=p||(G.land&&G.land.p)||(G.sys&&G.sys.planets&&G.sys.planets[0]);
  if(!p||typeof p.key!=="string")return null;
  const sxy=p.key.split(":")[0].split(",");
  const res=(p.res||[]).filter(k=>TRADE_KEYS.indexOf(k)>=0).slice(0,4);
  G.pnode={key:p.key,sx:+sxy[0]|0,sy:+sxy[1]|0,idx:p.idx|0,name:p.name,
    res:res.length?res:["iron"],stock:{},made:Date.now(),last:Date.now(),
    hauled:0,calls:0};
  logAdd("good","Сотня собрана. «"+p.name+"» — ваш узел: она родит товар, к ней пойдут баржи");
  say("УЗЕЛ\n«"+p.name+"» теперь ваша\nне доход, а точка на карте");
  if(typeof sfx==="function")sfx("ok",{v:.6});
  if(typeof saveGame==="function")saveGame(true);
  return G.pnode;
}
/* ── добыча, считаемая лениво ──
   Ни таймера, ни тика в кадре: склад досчитывается в момент, когда на него
   смотрят, — по прошедшему времени, как рейсы наёмников. */
function planetTick(){
  const N=G.pnode;if(!N)return null;
  const now=Date.now();
  const mins=(now-(N.last||now))/60000;
  if(mins>0){
    N.last=now;
    for(const k of N.res)
      N.stock[k]=Math.min(PLANET_CAP,(N.stock[k]||0)+mins*PLANET_RATE);
  }
  return N;
}
function planetStockOf(k){const N=G.pnode;return N?Math.floor(N.stock[k]||0):0;}
function planetStockSum(){
  const N=planetTick();if(!N)return 0;
  let s=0;for(const k of N.res)s+=Math.floor(N.stock[k]||0);
  return s;
}
function planetHere(){
  const N=G.pnode;
  return !!(N&&G.sx===N.sx&&G.sy===N.sy);
}
/* ── увезти самому ──
   Ровно то, что влезает в трюм, и только в своей системе. */
function planetHaul(){
  const N=planetTick();if(!N)return 0;
  if(!planetHere()){say("Узел «"+N.name+"» в другой системе");return 0;}
  const st=stat();
  let room=Math.max(0,st.cargoMax-held()),got=0;
  for(const k of N.res){
    if(room<=0)break;
    const take=Math.min(room,Math.floor(N.stock[k]||0));
    if(take<=0)continue;
    N.stock[k]-=take;G.cargo[k]+=take;room-=take;got+=take;
  }
  if(got){
    N.hauled+=got;
    logAdd("good","С узла «"+N.name+"» взято товара ×"+got);
    say("С узла взято ×"+got+"\nтрюм "+held()+"/"+st.cargoMax);
    if(typeof sfx==="function")sfx("ok",{v:.4});
    if(typeof saveGame==="function")saveGame(true);
  }else say("На узле пока нечего брать");
  return got;
}
/* ── узел глазами фактора ──
   Плечо маршрута требует остановки со станцией: у неё берут цены и имя. У
   планеты станции нет, поэтому узел выдаёт себя за остановку — с честным
   прейскурантом по базовым ценам ресурсов. Никакого арбитража это не создаёт:
   баржа всё равно торгует хуже станции назначения (bargeMarkup). */
function planetStop(){
  const N=G.pnode;if(!N)return null;
  if(!starAt(N.sx,N.sy))return null;
  const sys=getSystem(N.sx,N.sy);
  if(!sys)return null;
  if(sys.station)return sys;             // своя станция есть — узел ей не мешает
  const prices={};
  for(const k of TRADE_KEYS)prices[k]=Math.max(1,RES[k].price);
  return {key:sys.key,sx:sys.sx,sy:sys.sy,planets:sys.planets,name:sys.name,pnode:1,
    station:{name:"узел «"+N.name+"»",stype:"trade",kind:"частный узел",
      orbit:0,ang:0,spd:0,prices,fuelPrice:9,x:0,y:0,vx:0,vy:0}};
}
/* ── баржа, зашедшая за вашим товаром ──
   Это и есть «дождаться баржи»: она не платит кредитами, она увозит ваш груз к
   вам в трюм за один разговор. Берёт часть склада на борт при подлёте, отдаёт —
   когда сблизились. */
function planetBargeLoad(b){
  const N=planetTick();if(!N||!b)return 0;
  const key=N.sx+","+N.sy;
  if(b.from!==key&&b.to!==key)return 0;
  let got=0;const load={};
  for(const k of N.res){
    const t=Math.floor((N.stock[k]||0)*PLANET_BARGE);
    if(t<=0)continue;
    N.stock[k]-=t;load[k]=t;got+=t;
  }
  if(!got)return 0;
  b.pload=load;N.calls++;
  return got;
}
function planetLoadSum(b){
  let s=0;if(b&&b.pload)for(const k in b.pload)s+=b.pload[k]|0;
  return s;
}
function planetTakeLoad(b){
  if(!b||!b.pload)return 0;
  const st=stat();
  let room=Math.max(0,st.cargoMax-held()),got=0;
  for(const k in b.pload){
    if(room<=0)break;
    const t=Math.min(room,b.pload[k]|0);
    if(t<=0)continue;
    b.pload[k]-=t;G.cargo[k]+=t;room-=t;got+=t;
  }
  if(got){
    G.pnode.hauled+=got;
    logAdd("good","Баржа «"+b.capName+"» доставила с вашего узла ×"+got);
    if(typeof sfx==="function")sfx("ok",{v:.4});
    if(typeof saveGame==="function")saveGame(true);
  }else say("Некуда: трюм полон");
  return got;
}
/* строка в окне торга с баржой — только если она пришла с вашего узла */
function planetBargeRow(b){
  const n=planetLoadSum(b);
  if(!n||!G.pnode)return null;
  return bargeElRow("ВАШ ГРУЗ С УЗЛА «"+G.pnode.name+"» ×"+n,
    "узел не платит кредитами — он родит товар; баржа довезла его до вас даром",
    [{txt:"ЗАБРАТЬ",gold:1,dis:false,on:()=>{planetTakeLoad(b);renderBarge();}}]);
}
/* ── доска ──
   Живёт там же, где узлы и редкости: всё это одна коллекция, которую нельзя
   купить. Пока сотня не собрана — здесь только счётчик, без обещаний. */
function planetRender(){
  const N=G.pnode;
  if(!N){
    if(typeof rareCount!=="function")return;
    const c=rareCount();
    $body.appendChild(el("div","sec","ПЛАНЕТА · "+c+" / 100"));
    $body.appendChild(el("div","row","<div class='nm'><s>полный набор из ста "+
      "редкостей делает одну планету вашей: она родит товар и к ней пойдут баржи. "+
      "Частичный набор не даёт ничего — за него платит стена в доме.</s></div>"));
    return;
  }
  planetTick();
  $body.appendChild(el("div","sec","ВАШ УЗЕЛ · «"+N.name.toUpperCase()+"»"));
  const where=planetHere()?"вы в её системе":"сектор "+N.sx+", "+N.sy;
  $body.appendChild(el("div","row","<div class='nm'><b>"+where+"</b><s>увезено "+
    N.hauled+" ед · заходов баржи "+N.calls+" · кредитов узел не платит</s></div>"));
  for(const k of N.res)
    $body.appendChild(el("div","row","<div class='nm'><b>"+RES[k].ru+"</b><s>"+
      planetStockOf(k)+" из "+PLANET_CAP+" на складе</s></div>"));
  const sum=planetStockSum();
  const r=el("div","row");
  r.appendChild(el("div","nm","<b>ЗАБРАТЬ В ТРЮМ</b><s>"+
    (planetHere()?"влезет столько, сколько свободно в трюме":"только в системе узла")+
    "</s>"));
  const b=el("button","act gold","ЗАБРАТЬ ×"+sum);
  b.disabled=!sum||!planetHere();
  b.onclick=()=>{if(planetHaul())renderTab();};
  r.appendChild(b);
  $body.appendChild(r);
}
