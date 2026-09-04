/* ══════════════ скафандр как комплект ══════════════
   M152. Скафандр был одним числом — зарядом `S.suit`. Теперь это КОМПЛЕКТ ИЗ
   ШЕСТИ МЕСТ: шлем, корпус, перчатки, ботинки, ранец, фонарь. У каждой вещи
   модель (вымышленная, в советском ключе), класс I–III, износ в четырёх слоях
   по docs/PASSPORTS.md (новый / ношеный / латаный / чужой) и два гнезда под
   заплаты. Ни одна вещь — не «+1»: всё, что даёт, чего-то стоит, и общая
   валюта — ВЕС: он замедляет ход и кормит ранец.

   Все влияния идут через уже существующие ручки игры (kitStat → st.suitWear,
   S.armor, JET_*, ход, фонарь, дальность сканирования, пугливость зверей) —
   в боевой математике ничего нового не выдумано.

   Откуда берётся — не магазин: комплект I класса выдан всем; склад
   института выдаёт по обороту (ДОСКА научной и промышленной станции);
   хулк отдаёт чужую вещь; дома в мастерской вещь чинят и ставят заплаты.

   ПРАВИЛА ФАЙЛА:
   1. Хранится только G.kit (шесть мест) и G.kitShelf (полка): вещь — это
      {p,cls,model,wear,mods}. Модели по индексу, а не по имени.
   2. Характеристики считаются в kitStat() и нигде не кэшируются. */
const KIT_PLACES=["helmet","torso","gloves","boots","pack","lamp"];
const KIT_RU={helmet:"шлем",torso:"корпус",gloves:"перчатки",boots:"ботинки",pack:"ранец",lamp:"фонарь"};
/* модели по классу: I — выдача, II — институтская, III — редкая */
const KIT_MODELS={
  helmet:["Стриж-2","Ястреб-Т","Сокол-Р"],
  torso: ["Кречет-3","Беркут-М","Орлан-Д"],
  gloves:["Ласточка","Ласточка-У","Кедр"],
  boots: ["Гагара-М","Гагара-Л","Тундра"],
  pack:  ["Буревестник","Буревестник-2","Альбатрос"],
  lamp:  ["Светлячок","Маяк-1","Прожектор-К"]
};
const KIT_WEAR=["новый","ношеный","латаный","чужой"];   /* четыре слоя (M150) */
/* заплаты: гнездо — одна заплата, две на вещь. Чужая вещь заплат не берёт */
const KIT_MODS={
  heat:  {ru:"подогрев",        note:"заряд на льду уходит на 15% медленнее", places:["torso","boots"], cost:{credits:260}},
  seam:  {ru:"усиленный шов",   note:"броня +5%",                           places:["torso","helmet"],cost:{credits:320,alloy:1}},
  cart:  {ru:"дыхательный картридж",note:"заряд +20",                       places:["torso","pack"],  cost:{credits:380}},
  glass: {ru:"запасное стекло", note:"обзор и сканирование +10%",           places:["helmet"],        cost:{credits:240}},
  knee:  {ru:"прошитое колено", note:"ход +5%",                             places:["boots"],         cost:{credits:200}},
  refl:  {ru:"отражатель",      note:"свет фонаря +20%, расход тот же",     places:["lamp"],          cost:{credits:180}},
  strap: {ru:"ремень",          note:"ранец легче: расход −10%",            places:["pack"],          cost:{credits:220}}
};
function kitPiece(p,cls,wear,seed){
  cls=clamp(cls|0,1,3);
  return {p,cls,model:cls-1,wear:clamp(wear|0,0,3),mods:[],seed:seed|0};
}
function kitAll(){
  if(!G.kit||typeof G.kit!=="object"){
    G.kit={};for(const p of KIT_PLACES)G.kit[p]=kitPiece(p,1,0,0);
  }
  return G.kit;
}
function kitShelf(){return (G.kitShelf||(G.kitShelf=[]));}
function kitName(x){return KIT_MODELS[x.p][x.model]||KIT_MODELS[x.p][0];}
function kitRoman(c){return ["","I","II","III"][c]||"I";}
/* множитель слоя износа: ношеный −10%, латаный −5% (починен), чужой — без заплат */
function kitWearMul(x){return x.wear===1?.9:(x.wear===2?.95:1);}
function kitHasMod(x,id){return !!(x&&x.mods&&x.mods.indexOf(id)>=0);}
function kitStat(){
  const K=kitAll();
  const H=K.helmet,T=K.torso,Gl=K.gloves,B=K.boots,P=K.pack,L=K.lamp;
  const b=x=>(x.cls-1)*kitWearMul(x);          /* «сверх I класса», с износом */
  const weight=T.cls*1+H.cls*.5+P.cls*.6+B.cls*.3-(kitHasMod(P,"strap")?.4:0);
  const charge=Math.round(100+b(T)*40+(kitHasMod(T,"cart")||kitHasMod(P,"cart")?20:0));
  const armor=clamp(b(T)*.12+b(H)*.04+(kitHasMod(T,"seam")||kitHasMod(H,"seam")?.05:0),0,.4);
  const walk=clamp(1+b(B)*.1-weight*.04+(kitHasMod(B,"knee")?.05:0),.6,1.4);
  const jetFuel=1+b(P)*.35, jetRegen=1+b(P)*.3, jetThrust=1+b(P)*.1;
  const jetBurn=(1+weight*.06)*(kitHasMod(P,"strap")?.9:1);
  const wear=1/(1+b(T)*.25);                    /* расход заряда: корпус держит */
  const heat=(kitHasMod(T,"heat")||kitHasMod(B,"heat"))?.85:1;
  const drill=1+b(Gl)*.2, precision=1-b(Gl)*.08;
  const lamp=1+b(L)*.35+(kitHasMod(L,"refl")?.2:0), lampDrain=1+b(L)*.2;
  const scan=1+b(H)*.25+(kitHasMod(H,"glass")?.1:0);
  const noise=1+b(B)*.3;                        /* звери шарахаются раньше */
  return {weight:+weight.toFixed(2),charge,armor:+armor.toFixed(3),walk:+walk.toFixed(3),
          jetFuel,jetRegen,jetThrust,jetBurn,wear,heat,drill,precision,lamp,lampDrain,scan,noise};
}
function suitMax(){return (typeof kitStat==="function")?kitStat().charge:100;}
/* строка характеристик в стиле паспорта, не RPG-таблица */
function kitLine(){
  const s=kitStat();
  const noise=s.noise<1.05?"тихий":(s.noise<1.4?"обычный":"шумный");
  return "заряд "+s.charge+" · ход "+s.walk.toFixed(2)+" · броня "+kitRoman(1+Math.round(s.armor/.12))+
         " · ранец "+s.jetFuel.toFixed(2)+" · свет "+s.lamp.toFixed(2)+" · вес "+s.weight.toFixed(1)+" · шум "+noise;
}
/* ── выдача и находки ── */
function kitGive(x,why){
  kitShelf().push(x);
  while(kitShelf().length>12)kitShelf().shift();
  const ru=KIT_RU[x.p]+" «"+kitName(x)+"» "+kitRoman(x.cls)+" класса · "+KIT_WEAR[x.wear];
  logAdd("tech","Снаряжение: "+ru+(why?" · "+why:""));
  if(typeof thingAdd==="function")thingAdd("kit",ru[0].toUpperCase()+ru.slice(1),(why||"")+" · лежит на полке · надеть — ОПИСЬ, запас комплекта");
  return x;
}
/* склад института: раз в окно (четыре дня) научная или промышленная станция
   выдаёт одну вещь по обороту дома: II класс с прихожей (9 000), III — с гаража (70 000) */
function kitDepotOf(sys){
  if(!sys||!sys.station)return null;
  const t=sys.station.stype;
  if(t!=="sci"&&t!=="indust")return null;
  const H=G.home;if(!H||!H.turn)return null;
  const cls=H.turn>=70000?3:(H.turn>=9000?2:0);
  if(!cls)return null;
  const win=Math.floor(celDay()/4);
  const taken=G.kitDepot||{};
  if(taken[sys.key]===win)return null;
  const r=rng(hashi(sys.sx,sys.sy,0x5417+win));
  const p=KIT_PLACES[Math.floor(r()*KIT_PLACES.length)];
  return {p,cls,win};
}
function kitDepotTake(sys){
  const D=kitDepotOf(sys);if(!D)return null;
  G.kitDepot=G.kitDepot||{};G.kitDepot[sys.key]=D.win;
  const x=kitPiece(D.p,D.cls,0,hashi(sys.sx,sys.sy,D.win));
  return kitGive(x,"выдано со склада «"+sys.station.name+"»");
}
/* хулк: чужая вещь — класс II–III, слой «чужой», заплат не берёт */
function kitFromHulk(seed){
  const r=rng(hashi(seed,0x4B17,3));
  if(r()>.35)return null;
  const p=KIT_PLACES[Math.floor(r()*KIT_PLACES.length)];
  const x=kitPiece(p,2+(r()<.3?1:0),3,seed);
  return kitGive(x,"снята с хулка");
}
/* ── носить, чинить, латать ── */
function kitWearPiece(i){
  const x=kitShelf()[i];if(!x)return false;
  const K=kitAll(),old=K[x.p];
  K[x.p]=x;kitShelf().splice(i,1);kitShelf().push(old);
  logAdd("tech","Надет "+KIT_RU[x.p]+" «"+kitName(x)+"» "+kitRoman(x.cls)+" класса");
  return true;
}
function kitRepairCost(x){return x.wear===1?180*x.cls:0;}
function kitRepair(x){
  if(x.wear!==1)return false;
  const c=kitRepairCost(x);if(G.credits<c)return false;
  G.credits-=c;x.wear=2;
  logAdd("tech","Починено: "+KIT_RU[x.p]+" «"+kitName(x)+"» · теперь латаный");
  return true;
}
function kitCanMod(x,id){
  const M=KIT_MODS[id];if(!M||!x)return false;
  if(x.wear===3)return false;                       /* чужое не латают */
  if(M.places.indexOf(x.p)<0)return false;
  if(x.mods.length>=2||x.mods.indexOf(id)>=0)return false;
  return true;
}
function kitAddMod(x,id){
  if(!kitCanMod(x,id))return false;
  const c=KIT_MODS[id].cost;
  if(G.credits<(c.credits||0)||(c.alloy&&(G.cargo.alloy|0)<c.alloy))return false;
  G.credits-=c.credits||0;if(c.alloy)G.cargo.alloy-=c.alloy;
  x.mods.push(id);
  logAdd("tech","Заплата: "+KIT_MODS[id].ru+" на "+KIT_RU[x.p]+" «"+kitName(x)+"»");
  return true;
}
/* ── палитры семейств: три семейства на место, по модели ──
   I — выдача: брезент, серо-голубой; II — институт: белый с цианом;
   III — редкая: олива с латунью. Чужая вещь уводится в лиловый серый,
   ношеная — глушится. Кукла и ходок на поверхности собираются из ЭТИХ
   цветов: «Стриж-2» на «Кречете-3» виден смесью, а не подписью. */
const KIT_FAM=[
  {main:"#b9c2c9",dark:"#7d8793",acc:"#f2b25c"},
  {main:"#dde4ea",dark:"#9fb0bb",acc:"#7fe6d8"},
  {main:"#b7ae8f",dark:"#7e775e",acc:"#e0885a"}
];
function kitColOf(x){
  const F=KIT_FAM[clamp(x.model|0,0,2)];
  let main=F.main,dark=F.dark;
  if(x.wear===1){main=mixHex(main,"#6f6f6f",.35);dark=mixHex(dark,"#4a4a4a",.35);}
  if(x.wear===3){main=mixHex(main,"#a89ab8",.45);dark=mixHex(dark,"#6a5f7a",.45);}
  return {main,dark,acc:F.acc};
}
function mixHex(a,b,k){
  const pa=hex2rgb(a),pb=hex2rgb(b);
  return "rgb("+pa.map((v,i)=>Math.round(v+(pb[i]-v)*k)).join(",")+")";
}
function kitPalette(){
  const K=kitAll(),out={};
  for(const p of KIT_PLACES)out[p]=kitColOf(K[p]);
  return out;
}
/* ── кукла: RPG-манекен, собранный из надетых вещей ──
   Правило процедурных сборок: слои (ранец → ботинки → корпус → перчатки →
   шлем → фонарь), ОДИН обвод по всему телу, ОДИН свет. Износ читается на
   кукле: потёртости штрихами, мутное забрало. Кукла дышит (t), фонарь чуть
   качается. Рисует и экран, и — теми же цветами — ходока на поверхности. */
function drawKitFigure(c,W,H,hit,t){
  const K=kitAll(),P=kitPalette();
  t=t===undefined?G.t*.03:t;
  const br=Math.sin(t)*1.4;                       /* дыхание */
  const off=drawKitFigure._off||(drawKitFigure._off=document.createElement("canvas"));
  off.width=120;off.height=200;
  const d=off.getContext("2d");
  d.clearRect(0,0,120,200);
  d.save();d.translate(60,104+br*.3);
  const cls=p=>K[p].cls;
  /* слой 1: ранец за спиной — ширина по классу, лямки */
  d.fillStyle=P.pack.dark;
  d.beginPath();d.roundRect(-40-cls("pack")*4,-34+br,18+cls("pack")*4,58,6);d.fill();
  d.fillStyle=P.pack.main;
  d.beginPath();d.roundRect(-37-cls("pack")*4,-30+br,12+cls("pack")*3,20,4);d.fill();
  /* слой 2: ноги и ботинки */
  d.strokeStyle=P.torso.dark;d.lineWidth=13;d.lineCap="round";
  d.beginPath();d.moveTo(-11,26);d.lineTo(-13,66);d.stroke();
  d.beginPath();d.moveTo(11,26);d.lineTo(13,66);d.stroke();
  d.fillStyle=P.boots.main;
  d.beginPath();d.roundRect(-22,64,18,14+cls("boots")*2.5,4);d.fill();
  d.beginPath();d.roundRect(4,64,18,14+cls("boots")*2.5,4);d.fill();
  d.fillStyle=P.boots.dark;d.fillRect(-22,74+cls("boots")*2.5,18,4);d.fillRect(4,74+cls("boots")*2.5,18,4);
  /* слой 3: корпус — трапеция, пластины по классу, поясной кант, нагрудный блок */
  const tb=P.torso;
  const g=d.createLinearGradient(-24,-30,24,30);
  g.addColorStop(0,tb.main);g.addColorStop(1,tb.dark);
  d.fillStyle=g;
  d.beginPath();
  d.moveTo(-24-cls("torso")*2,-30+br);d.lineTo(24+cls("torso")*2,-30+br);
  d.lineTo(20,30);d.lineTo(-20,30);d.closePath();d.fill();
  d.fillStyle="rgba(0,0,0,.16)";
  for(let i=0;i<cls("torso");i++)d.fillRect(-16,-20+br+i*13,32,3);
  d.fillStyle=tb.acc;d.fillRect(-20,8,40,5);                                  /* кант */
  d.fillStyle="#1b2735";d.fillRect(6,-22+br,14,11);                           /* нагрудный блок */
  d.fillStyle=P.lamp.acc;d.fillRect(9,-19+br,5,4);
  /* слой 4: руки и перчатки */
  d.strokeStyle=tb.main;d.lineWidth=11;
  d.beginPath();d.moveTo(-22,-22+br);d.lineTo(-32,4);d.stroke();
  d.beginPath();d.moveTo(22,-22+br);d.lineTo(32,4);d.stroke();
  d.fillStyle=P.gloves.main;
  d.beginPath();d.roundRect(-40,2,15,12+cls("gloves")*2,4);d.fill();
  d.beginPath();d.roundRect(25,2,15,12+cls("gloves")*2,4);d.fill();
  /* слой 5: шлем — купол, забрало (мутное у ношеного), блик */
  const hy=-46+br;
  d.fillStyle=P.helmet.main;
  d.beginPath();d.arc(0,hy,19+cls("helmet")*1.5,0,TAU);d.fill();
  d.fillStyle="#0a1a26";
  d.beginPath();d.ellipse(2,hy,11+cls("helmet")*2,11,-.08,0,TAU);d.fill();
  const dull=K.helmet.wear===1?.3:1;
  const vg=d.createLinearGradient(-8,hy-12,10,hy+4);
  vg.addColorStop(0,"rgba(160,235,255,"+(.6*dull).toFixed(2)+")");vg.addColorStop(1,"rgba(120,200,230,0)");
  d.fillStyle=vg;
  d.beginPath();d.ellipse(2,hy,11+cls("helmet")*2,11,-.08,0,TAU);d.fill();
  /* слой 6: фонарь на шлеме, качается */
  const sw=Math.sin(t*.7)*1.2;
  d.fillStyle=P.lamp.dark;d.fillRect(13+sw*.3,hy-14,6,5);
  d.fillStyle=P.lamp.acc;d.beginPath();d.arc(16+sw*.3,hy-11,2.2,0,TAU);d.fill();
  const lg=d.createRadialGradient(16+sw,hy-11,1,16+sw,hy-11,16+cls("lamp")*7);
  lg.addColorStop(0,"rgba(255,240,200,.5)");lg.addColorStop(1,"rgba(255,240,200,0)");
  d.fillStyle=lg;d.beginPath();d.arc(16+sw,hy-11,16+cls("lamp")*7,0,TAU);d.fill();
  /* износ: потёртости штрихами на местах со слоем «ношеный» и «латаный» */
  d.strokeStyle="rgba(30,30,30,.28)";d.lineWidth=1;
  const scuff=(x0,y0)=>{for(let i=0;i<4;i++){d.beginPath();d.moveTo(x0+i*3,y0+i);d.lineTo(x0+i*3+4,y0+i+3);d.stroke();}};
  if(K.torso.wear===1||K.torso.wear===2)scuff(-14,14);
  if(K.boots.wear===1||K.boots.wear===2)scuff(-18,68);
  if(K.pack.wear===1||K.pack.wear===2)scuff(-36,-6);
  d.restore();
  /* один свет на всю сборку */
  d.globalCompositeOperation="source-atop";
  const light=d.createLinearGradient(0,0,120,200);
  light.addColorStop(0,"rgba(255,255,255,.16)");light.addColorStop(.5,"rgba(255,255,255,0)");light.addColorStop(1,"rgba(0,10,20,.22)");
  d.fillStyle=light;d.fillRect(0,0,120,200);
  d.globalCompositeOperation="source-over";
  /* один обвод: силуэт тёмным, четыре сдвига под куклой */
  const sil=drawKitFigure._sil||(drawKitFigure._sil=document.createElement("canvas"));
  sil.width=120;sil.height=200;
  const s2=sil.getContext("2d");
  s2.clearRect(0,0,120,200);s2.drawImage(off,0,0);
  s2.globalCompositeOperation="source-in";s2.fillStyle="#10161e";s2.fillRect(0,0,120,200);
  s2.globalCompositeOperation="source-over";
  /* на целевой канве */
  c.clearRect(0,0,W,H);
  const k=Math.min(W/132,H/212),ox=(W-120*k)/2,oy=(H-200*k)/2;
  c.save();c.translate(ox,oy);c.scale(k,k);
  for(const [dx,dy] of [[-1.5,0],[1.5,0],[0,-1.5],[0,1.5]])c.drawImage(sil,dx,dy);
  c.drawImage(off,0,0);
  /* тень-опора */
  c.fillStyle="rgba(0,0,0,.35)";c.beginPath();c.ellipse(60,196,34,5,0,0,TAU);c.fill();
  c.restore();
  if(hit){
    hit.length=0;
    const zone=(p,x,y,w,h)=>hit.push({p,x:ox+x*k,y:oy+y*k,w:Math.max(44,w*k),h:Math.max(44,h*k)});
    zone("helmet",36,34,48,44);zone("torso",34,72,52,60);zone("gloves",16,102,26,26);
    zone("boots",36,164,48,28);zone("pack",8,66,26,56);zone("lamp",72,36,26,24);
  }
}
/* расход заряда на льду: подогрев держит; в остальных мирах — единица */
function kitHeatMul(){
  const p=G.surf&&G.surf.p;
  if(!p||p.type!=="ice")return 1;
  return kitStat().heat;
}
/* ── кукла живёт на столе ОПИСЬ (M341): места нажатия отдаёт drawKitFigure;
   надеть — там же (27j-ui-opis), чинить и латать — дома (kitShopBlock) ── */
let kitDollHit=[];
/* мастерская дома: починка ношеного и заплаты — по два гнезда на вещь */
function kitShopBlock(){
  const K=kitAll();
  $body.appendChild(el("div","sec","МАСТЕРСКАЯ · СКАФАНДР: ПОЧИНКА И ЗАПЛАТЫ · ДВА ГНЕЗДА НА ВЕЩЬ"));
  for(const p of KIT_PLACES){
    const x=K[p];
    const rr=el("div","row","<div class='nm'><b>"+KIT_RU[p]+" · «"+kitName(x)+"» "+kitRoman(x.cls)+" класса</b><s>"+KIT_WEAR[x.wear]+
      (x.mods.length?" · "+x.mods.map(id=>KIT_MODS[id].ru).join(", "):"")+(x.wear===3?" · чужая вещь: заплат не берёт":"")+"</s></div>");
    if(x.wear===1){
      const b=el("button","act sm","ПОЧИНИТЬ · "+kitRepairCost(x)+" кр");b.disabled=G.credits<kitRepairCost(x);
      b.onclick=()=>{kitRepair(x);renderTab();};rr.appendChild(b);
    }
    for(const id in KIT_MODS){
      if(!kitCanMod(x,id))continue;
      const c=KIT_MODS[id].cost;
      const b=el("button","act sm",KIT_MODS[id].ru.toUpperCase()+" · "+(c.credits||0)+" кр"+(c.alloy?" + сплав":""));
      b.title=KIT_MODS[id].note;
      b.disabled=G.credits<(c.credits||0)||(c.alloy&&(G.cargo.alloy|0)<c.alloy);
      b.onclick=()=>{kitAddMod(x,id);renderTab();};
      rr.appendChild(b);
    }
    $body.appendChild(rr);
  }
}
/* склад института на доске */
function kitDepotBlock(){
  const D=(typeof kitDepotOf==="function")?kitDepotOf(G.sys):null;
  if(!D)return;
  $body.appendChild(el("div","sec","СКЛАД ИНСТИТУТА · ВЫДАЧА ПО ОБОРОТУ"));
  const r=el("div","row","<div class='nm'><b>"+KIT_RU[D.p]+" · «"+KIT_MODELS[D.p][D.cls-1]+"» "+kitRoman(D.cls)+" класса</b><s>новый · одна вещь в четыре дня на станцию</s></div>");
  const b=el("button","act sm gold","ПОЛУЧИТЬ");
  b.onclick=()=>{kitDepotTake(G.sys);renderTab();};
  r.appendChild(b);$body.appendChild(r);
}
