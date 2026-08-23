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
  if(typeof thingAdd==="function")thingAdd("kit",ru[0].toUpperCase()+ru.slice(1),(why||"")+" · лежит на полке · надеть — экран КОРАБЛЬ → СКАФАНДР");
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
/* ── рисунок: фигура в скафандре с шестью местами, по классам и слоям ── */
function drawKitFigure(c,W,H,hit){
  const K=kitAll();
  c.save();c.clearRect(0,0,W,H);
  const s=Math.min(W/120,H/200);
  c.translate(W/2,H/2);c.scale(s,s);
  const cls=p=>K[p].cls,wearCol=p=>["#d9dde3","#aeb4ba","#c9b59a","#8a7f9a"][K[p].wear];
  /* тень и опора */
  c.fillStyle="rgba(0,0,0,.4)";c.beginPath();c.ellipse(0,92,34,6,0,0,7);c.fill();
  /* ботинки */
  c.fillStyle=wearCol("boots");
  c.beginPath();c.roundRect(-24,72,20,18+cls("boots")*2,4);c.fill();
  c.beginPath();c.roundRect(4,72,20,18+cls("boots")*2,4);c.fill();
  /* ноги */
  c.fillStyle="#7d8793";c.fillRect(-20,30,14,44);c.fillRect(6,30,14,44);
  /* корпус: класс — толщина и пластины */
  c.fillStyle=wearCol("torso");
  c.beginPath();c.roundRect(-26-cls("torso")*2,-26,52+cls("torso")*4,60,10);c.fill();
  c.fillStyle="rgba(0,0,0,.18)";
  for(let i=0;i<cls("torso");i++){c.fillRect(-20,-20+i*14,40,3);}
  /* ранец: за спиной, ширина по классу */
  c.fillStyle="#5e6670";c.beginPath();c.roundRect(-34-cls("pack")*3,-22,12+cls("pack")*3,46,4);c.fill();
  /* руки и перчатки */
  c.fillStyle="#7d8793";c.fillRect(-40,-18,12,44);c.fillRect(28,-18,12,44);
  c.fillStyle=wearCol("gloves");
  c.beginPath();c.roundRect(-42,24,16,12+cls("gloves")*2,4);c.fill();
  c.beginPath();c.roundRect(26,24,16,12+cls("gloves")*2,4);c.fill();
  /* шлем: класс — стекло шире */
  c.fillStyle=wearCol("helmet");c.beginPath();c.arc(0,-48,22+cls("helmet")*1.5,0,7);c.fill();
  c.fillStyle="#1d2a36";c.beginPath();c.ellipse(2,-48,12+cls("helmet")*2,13,0,0,7);c.fill();
  c.fillStyle="rgba(255,255,255,.25)";c.beginPath();c.ellipse(-3,-53,5,3,-.5,0,7);c.fill();
  /* фонарь на шлеме: пятно света по классу */
  const L=cls("lamp");
  const g=c.createRadialGradient(20,-52,0,20,-52,18+L*10);
  g.addColorStop(0,"rgba(255,240,200,.7)");g.addColorStop(1,"rgba(255,240,200,0)");
  c.fillStyle=g;c.beginPath();c.arc(20,-52,18+L*10,0,7);c.fill();
  c.fillStyle="#e8e0c0";c.beginPath();c.arc(16,-56,3,0,7);c.fill();
  c.restore();
  /* места для клика: в экранных координатах */
  if(hit){
    hit.length=0;
    const k=s,cx=W/2,cy=H/2;
    hit.push({p:"helmet",x:cx-24*k,y:cy-72*k,w:48*k,h:48*k});
    hit.push({p:"torso",x:cx-28*k,y:cy-26*k,w:56*k,h:60*k});
    hit.push({p:"gloves",x:cx-44*k,y:cy+22*k,w:30*k,h:20*k});
    hit.push({p:"boots",x:cx-26*k,y:cy+70*k,w:52*k,h:26*k});
    hit.push({p:"pack",x:cx-48*k,y:cy-24*k,w:16*k,h:50*k});
    hit.push({p:"lamp",x:cx+8*k,y:cy-66*k,w:26*k,h:24*k});
  }
}
/* расход заряда на льду: подогрев держит; в остальных мирах — единица */
function kitHeatMul(){
  const p=G.surf&&G.surf.p;
  if(!p||p.type!=="ice")return 1;
  return kitStat().heat;
}
/* ── экран: фигура с шестью местами, строка паспорта, полка ──
   Живёт в экране КОРАБЛЬ (снять/надеть — где угодно); чинить и латать —
   дома, в мастерской (kitShopBlock). */
let kitSel=null;
function kitBlock(body){
  const K=kitAll();
  body.appendChild(el("div","sec","СКАФАНДР · "+kitLine()));
  const r=el("div","row");r.style.alignItems="flex-start";
  const cv=document.createElement("canvas");cv.width=150;cv.height=240;cv.style.cssText="width:150px;height:240px;flex:0 0 auto;cursor:pointer";
  const hit=[];drawKitFigure(cv.getContext("2d"),150,240,hit);
  cv.addEventListener("click",e=>{
    const rc=cv.getBoundingClientRect(),mx=e.clientX-rc.left,my=e.clientY-rc.top;
    const h=hit.find(h=>mx>=h.x&&mx<=h.x+h.w&&my>=h.y&&my<=h.y+h.h);
    kitSel=h?h.p:null;
    if(typeof svRender==="function"&&document.getElementById("shipview").classList.contains("open"))svRender();
    else if(typeof renderTab==="function")renderTab();
  });
  r.appendChild(cv);
  const list=el("div","nm");
  let html="";
  for(const p of KIT_PLACES){
    const x=K[p];
    html+="<b"+(kitSel===p?" style='color:var(--phos)'":"")+">"+KIT_RU[p]+" · «"+kitName(x)+"» "+kitRoman(x.cls)+" класса</b><s>"+
      KIT_WEAR[x.wear]+(x.mods.length?" · "+x.mods.map(id=>KIT_MODS[id].ru).join(", "):"")+"</s>";
  }
  list.innerHTML=html;
  r.appendChild(list);body.appendChild(r);
  /* полка: надеть — сразу, это не магазин */
  const shelf=kitShelf();
  if(shelf.length){
    body.appendChild(el("div","sec","ПОЛКА · НАДЕТЬ — ПРЕЖНЯЯ ВЕЩЬ ЛЯЖЕТ НА ПОЛКУ"));
    shelf.forEach((x,i)=>{
      const rr=el("div","row","<div class='nm'><b>"+KIT_RU[x.p]+" · «"+kitName(x)+"» "+kitRoman(x.cls)+" класса</b><s>"+KIT_WEAR[x.wear]+
        (x.mods.length?" · "+x.mods.map(id=>KIT_MODS[id].ru).join(", "):"")+(x.wear===3?" · заплат не берёт":"")+"</s></div>");
      const b=el("button","act sm","НАДЕТЬ");
      b.onclick=()=>{kitWearPiece(i);if(typeof svRender==="function"&&document.getElementById("shipview").classList.contains("open"))svRender();else if(typeof renderTab==="function")renderTab();};
      rr.appendChild(b);body.appendChild(rr);
    });
  }else body.appendChild(el("div","row","<div class='nm'><s>полка пуста: вещи выдаёт склад института (ДОСКА научной или промышленной станции), отдаёт хулк, чинит и латает мастерская дома</s></div>"));
}
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
