/* ══════════════ состояние ══════════════ */
const cvs=document.getElementById("c");
let ctx=cvs.getContext("2d");
const MAIN_CTX=ctx;
let W=0,H=0,DPR=1;
function resize(){
  DPR=Math.min(2,window.devicePixelRatio||1);
  W=window.innerWidth;H=window.innerHeight;
  cvs.width=Math.round(W*DPR);cvs.height=Math.round(H*DPR);
  ctx.setTransform(DPR,0,0,DPR,0,0);
}
addEventListener("resize",resize);resize();

const keys={left:false,right:false,thrust:false,brake:false,act:false,fire:false,
  pup:false,pdown:false,rollL:false,rollR:false,launch:false};
let prevAct=false,actEdge=false;

const G={
  mode:"system",sx:0,sy:0,sys:null,zoom:1,
  shipId:"strizh",owned:{strizh:true},
  ship:{x:0,y:-760,vx:1.1,vy:0,a:0,av:0,bank:0},
  fuel:100,hull:100,
  cargo:{},credits:600,data:0,
  /* mods — установленные уровни, modsOwned — купленные: модуль можно снять и вернуть без потери денег */
  mods:{engine:0,tank:0,hold:0,armor:0,drill:0,hyper:0,weapon:0},
  modsOwned:{engine:0,tank:0,hold:0,armor:0,drill:0,hyper:0,weapon:0},
  inv:[],fit:{},shield:0,loot:[],partsBought:{},
  tech:new Set(),techLvl:{},barter:new Set(),
  found:new Set(),species:new Set(),
  ap:null,          // автопилот
  orbit:null,       // захват круговой орбиты вокруг тела после сближения
  land:null,surf:null,st:null,belt:null,dig:null,cave:null,
  opts:{easyLand:true,autoDock:true,invX:false,invY:false,invYaw:false,lookSens:1,
    keys:{main:{},belt:{}},pads:"auto",padSize:1,
    gfx:{draw:1,detail:1,particles:1,plants:1},
    audio:{on:true,music:.6,sfx:.6,engine:.4}},
  sel:{x:0,y:0},msg:"",msgT:0,prompt:"",running:false,t:0,
  market:{},uniqueShips:{},drones:[],droneInventory:0,
  /* свой торговый маршрут: 2–4 станции, порядок обхода и накатанные круги */
  trade:{legs:[],loops:0,cursor:0,sold:0},
  /* налёт часов по корпусам: ключ — id корабля, значение — кадры в полёте */
  wear:{},
  /* осмотренные находки в пустоте: ключ находки → 1 (17b) */
  findsSeen:{},
  /* фронт пиратов и счёт отбитых систем: цель игры видна числом */
  occ:{},occT:0,freed:0,occCalm:{},mines:{},quests:[],nodes:{},crowns:{},
  /* планета-узел за полный набор редкостей (12n): null, пока сотни нет */
  pnode:null,
  /* посёлки (12t): разрежённо по «sx,sy», пусто, пока никого не кормили */
  settle:{},
  /* личный счёт фракций к вам (12o): пусто, пока не наделали дел */
  hunted:{},
  /* узел, стоящий в держателе рубки (05a-nodes, M101): украшение, не слот */
  nodeShow:null,
  /* пересказ мира (12p): слухи, метки знания на карте и соперники с адресами */
  news:[],newsMarks:{},newsT:0,rivals:{},
  dealsDone:{},dealsWait:[],rep:{},poiSeen:{},
  pirates:[],shots:[],log:[],logNew:0,barges:[],
  /* обломки погибших барж — след, а не эфемерное: решение (спасли/добили/прошли
     мимо) пережило встречу. Разреженный оверлей по "sx,sy". Пассажиры спасённых
     барж ждут в звене отдельным списком. */
  wrecks:{},bargePax:[],
  crew:[],allies:[],  // наёмники персистятся, их корабли в системе — эфемерны
  /* управляющие: четыре места, по одному на домен. Чертежи исследователя —
     1 верный, −1 ошибочный: ошибка живёт, пока её не пересоберут. */
  mgrs:[],blueprints:{},cantina:null,aiRift:null,
  /* ушедшие: ренегат сидит в своём секторе и дерётся, изгнанник ждёт в кантине */
  rogues:[],exiles:[],
  /* артефакты: найденные лежат здесь, надетый — в поле relic у управляющего.
     relicHint — сектор, на который указал исследователь с «происхождением». */
  relics:{},relicHint:null,bio:0,home:null,
  /* счётчики для поручений: живут в сессии, при загрузке отсчёт начинается заново */
  orderStamp:0,kills:0,soldTotal:0,
  /* базы: разреженный оверлей «sx,sy:planetIdx» → решения игрока.
     Геология под базой регенерируется из seed планеты и не сохраняется. */
  bases:{},base:null,
  fuseGen:0           // поколение сплава: каждое следующее дороже и слабее прибавкой
};
for(const k of RES_KEYS)G.cargo[k]=0;
G.sys=getSystem(0,0);

function stat(){
  const S=shipData(G.shipId),m=G.mods,T=G.tech,B=G.barter,P=partBonus();
  const drillBonus=G.shipId==="obod"?1.6:1;
  const mul=k=>Math.max(.25,1+(P[k]||0));   // штрафы не должны обнулять стат
  /* венцы наборов: собранная сотня узлов читается здесь же, где модули и части,
     а не отдельной системой множителей (05a-nodes) */
  const cr=k=>(typeof crownHas==="function"&&crownHas(k));
  /* редкости: малые прибавки от собранных редких вещей, читаются тут же, где
     модули и венцы, а не отдельной системой множителей (12m-rare) */
  const rs=t=>(typeof rareSum==="function"?rareSum(t):0);
  return {
    S,
    /* налёт часов: облезлая машина слушается хуже — единственное, чем износ
       вмешивается в арифметику (12s-wear) */
    thr:S.thr*(1+m.engine*.19)*mul("thrMul")*bpMul("cleanjet",1.1,.93)*(cr("moth")?1.25:1)*(1+rs("thr"))*wearMul(),
    turn:S.turn*(1+m.engine*.07)*mul("turnMul")*(cr("moth")?1.25:1)*(1+rs("turn"))*wearMul(),
    fuelMax:Math.max(20,Math.round(S.fuel*(1+m.tank*.3)+(B.has("icecore")?50:0)+(P.fuelAdd||0)+(cr("well")?60:0)+rs("fuel"))),
    cargoMax:Math.max(8,Math.round(S.cargo*(1+m.hold*.32)*(T.has("pack")?1.4:1)*(B.has("bioseal")?1.2:1)*mul("cargoMul")*bpMul("wide",1.12,.92)*(cr("ark")?1.2:1)*(1+rs("cargo")))),
    hullMax:Math.max(20,Math.round(S.hull*(1+m.armor*.2)+(T.has("cera")?30:0)+(B.has("crystplate")?40:0)+(P.hullAdd||0)+(bpState("hardweld")>0?25:(bpState("hardweld")<0?-15:0))+(cr("ark")?40:0))),
    drill:(cr("cair")?1.3:1)*(1+m.drill*.55)*(T.has("drone")?2:1)*drillBonus*(B.has("iridrill")?1.25:1)*mul("drillMul")*bpMul("coldbore",1.18,.88)*(1+rs("drill")),
    synthRatio:B.has("isosynth")?8:4,
    jump:Math.max(1,3+m.hyper*.5+(T.has("coil")?2:0)+(P.jumpAdd||0)+rs("jump")),
    armed:m.weapon>0||!!P.gun,
    dmg:(5+m.weapon*4.5)*(T.has("gunai")?1.35:1)*mul("dmgMul")*(cr("pyre")?1.35:1)*(1+rs("dmg")),
    cool:Math.max(6,Math.round((34-m.weapon*4)/mul("rateMul")/(cr("pyre")?2:1)/(1+rs("cool")))),
    shieldMax:Math.max(0,Math.round((P.shieldAdd||0)+(cr("veil")?40:0)+rs("shield"))),
    shieldRegen:Math.max(0,P.regenAdd||0),
    see:(((cr("echo")?2:1))*(T.has("cloak")?520:1040)+(P.scanAdd||0)+(bpState("longeye")>0?180:(bpState("longeye")<0?-120:0)))+rs("see"),
    digTier:T.has("deepcore")?2:((T.has("deepdrill")||m.drill>=2)?1:0),
    suitWear:1/(1+techLv("suit")*.55),
    refine:1+techLv("refine")*.18,
    droneRate:(1+techLv("hauler")*.22)*mgrDroneRate()*(cr("loom")?1.33:1)*(1+rs("drone")),
    bountyMul:(1+techLv("bounty")*.3)*(1+rs("bounty"))
  };
}
const held=()=>RES_KEYS.reduce((a,k)=>a+G.cargo[k],0);
function say(s,d){G.msg=s;G.msgT=d||150;}
