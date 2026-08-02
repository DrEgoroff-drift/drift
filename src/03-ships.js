/* ══════════════ корабли: процедурные корпуса ══════════════ */
const SHIPS={
  strizh:{ru:"Стриж", cls:"лёгкий разведчик", hcls:"scout", seed:1101, thr:1,   turn:1,   fuel:100,cargo:40, hull:100,price:0,    col:"#7fe6d8",note:"Стандартный корпус разведзонда. Ничего лишнего."},
  igla:  {ru:"Игла",  cls:"зонд дальнего хода",hcls:"survey", seed:2207, thr:1.12,turn:1.2, fuel:130,cargo:26, hull:74, price:3400, col:"#9fd8ff",note:"Тонкий корпус и большой бак. Ходит далеко, возит мало."},
  vyuk:  {ru:"Вьюк",  cls:"грузовой тягач",   hcls:"hauler", seed:3313, thr:.82, turn:.78, fuel:150,cargo:150,hull:135,price:6200, col:"#f2b25c",note:"Трюм вчетверо больше, разгон вялый. Возит руду мешками."},
  skat:  {ru:"Скат",  cls:"рудный челнок",    hcls:"hauler", seed:4421, thr:.95, turn:1.05,fuel:120,cargo:96, hull:118,price:8100, col:"#8fd08a",note:"Широкая рама с боковыми бункерами. Крепкий середняк."},
  klinok:{ru:"Клинок",cls:"курьер",           hcls:"courier",seed:5527, thr:1.5, turn:1.45,fuel:95, cargo:32, hull:88, price:9800, col:"#ff9d7a",note:"Гоночная рама. Садится точно, но трюм крошечный."},
  obod:  {ru:"Обод",  cls:"кольцевой буровик",hcls:"miner",  seed:6631, thr:.88, turn:.9,  fuel:170,cargo:130,hull:160,price:15000,col:"#c9c9d4",note:"Каркас вокруг буровой шахты. Грызёт астероиды быстрее всех."},
  topor: {ru:"Топор", cls:"броневой тральщик",hcls:"warship",seed:7741, thr:1.05,turn:.82, fuel:140,cargo:88, hull:250,price:19500,col:"#e0d28a",note:"Толстая скула. Переживает то, что убивает остальных."},
  mamont:{ru:"Мамонт",cls:"тяжёлый рудовоз",  hcls:"hauler", seed:8849, thr:.7,  turn:.62, fuel:230,cargo:290,hull:220,price:24000,col:"#c58ae0",note:"Летающий склад с бронёй. Разворачивается как луна."}
};
const SHIP_KEYS=Object.keys(SHIPS);
function shipData(id){return SHIPS[id]||(typeof FLEET!=="undefined"&&FLEET[id])||G.uniqueShips[id]||NPC_SHIPS[id];}
const UNIQUE_COLS=["#7fe6d8","#9fd8ff","#f2b25c","#8fd08a","#ff9d7a","#c9c9d4","#e0d28a","#c58ae0","#ff6b6b","#6bffb8"];
const UNIQUE_TAG=["уникальный корпус","экспериментальный корпус","одиночная сборка","опытный образец","штучная работа"];
function genUniqueShip(seed){
  const r=rng(seed);
  const thr=+(0.75+r()*0.85).toFixed(2);
  const turn=+(0.7+r()*0.85).toFixed(2);
  const fuel=Math.round(90+r()*160);
  const cargo=Math.round(30+r()*270);
  const hull=Math.round(80+r()*180);
  const power=(thr+turn)*.5+fuel/250+cargo/300+hull/260;
  const price=Math.round(clamp(power*7200-6000,4000,30000)/50)*50;
  return {ru:genName(r),cls:pick(UNIQUE_TAG,r),seed,thr,turn,fuel,cargo,hull,price,
    col:pick(UNIQUE_COLS,r),note:"Единственный экземпляр. Больше такого не будет — предложение сменится.",unique:true};
}
/* ══════════════ лаборатория: сплав двух корпусов ══════════════ */
/* Статы смешиваются взвешенно, а не суммируются: сильный родитель тянет сильнее,
   редкое сырьё добавляет процент сверху. Прирост затухает с каждым поколением,
   иначе за час получается корабль, после которого играть не во что. */
function fuseGen(){return Math.max(0,G.fuseGen|0);}
function fuseCost(){
  const g=fuseGen();
  return {credits:Math.round(4000*Math.pow(1.8,g)),
    alloy:6+g*5, volatiles:3+g*3, icecrys:2+g*3};
}
function fuseAffordable(c){
  return G.credits>=c.credits&&G.cargo.alloy>=c.alloy&&
    G.cargo.volatiles>=c.volatiles&&G.cargo.icecrys>=c.icecrys;
}
function fuseShips(idA,idB){
  const A=shipData(idA),B=shipData(idB);
  if(!A||!B||idA===idB)return null;
  const c=fuseCost();
  if(!fuseAffordable(c))return null;
  const g=fuseGen();
  const seed=hashi(hashi(A.seed||1,B.seed||2,0xF05E),Date.now()&0xffff,g);
  const base=genUniqueShip(seed);
  /* доля редкого сырья сверх обязательного минимума и есть «бонус за редкость» */
  const rich=clamp((G.cargo.volatiles+G.cargo.icecrys)/(c.volatiles+c.icecrys+24),0,1);
  const gain=(.06+rich*.09)*Math.pow(.55,g);   // затухание: второе поколение даёт втрое меньше
  const mix=(a,b)=>{
    const w=a>=b?.62:.38;
    return a*w+b*(1-w);
  };
  base.thr=+(mix(A.thr,B.thr)*(1+gain)).toFixed(2);
  base.turn=+(mix(A.turn,B.turn)*(1+gain)).toFixed(2);
  base.fuel=Math.round(mix(A.fuel,B.fuel)*(1+gain));
  base.cargo=Math.round(mix(A.cargo,B.cargo)*(1+gain));
  base.hull=Math.round(mix(A.hull,B.hull)*(1+gain));
  base.cls="лабораторный сплав";
  base.note="Сплав «"+A.ru+"» и «"+B.ru+"». Поколение "+(g+1)+".";
  base.fused=g+1;
  const id="f"+seed;
  G.credits-=c.credits;
  G.cargo.alloy-=c.alloy;G.cargo.volatiles-=c.volatiles;G.cargo.icecrys-=c.icecrys;
  delete G.owned[idA];delete G.owned[idB];
  for(const cw of G.crew)if(cw.shipId===idA||cw.shipId===idB)cw.shipId=null;
  G.uniqueShips[id]=base;G.owned[id]=true;
  G.fuseGen=g+1;
  if(G.shipId===idA||G.shipId===idB)G.shipId=id;
  invalidateParts();
  tell("tech","Сплав корпусов: «"+A.ru+"» + «"+B.ru+"» → «"+base.ru+"»",
       "Сплав готов\n«"+base.ru+"»\nпоколение "+(g+1));
  return id;
}
/* крафт частей — сток для излишков редкого сырья: чем больше вкладываешь,
   тем выше тир, но случайность и слоты остаются генератора */
const CRAFT_TIERS=[
  {tier:1,ru:"рядовая сборка",  cost:{credits:900, alloy:3}},
  {tier:2,ru:"точная сборка",   cost:{credits:2600,alloy:6, volatiles:4}},
  {tier:3,ru:"штучная сборка",  cost:{credits:6400,alloy:12,volatiles:8,icecrys:6}}
];
function craftAffordable(cost){
  if(G.credits<cost.credits)return false;
  for(const k in cost)if(k!=="credits"&&(G.cargo[k]|0)<cost[k])return false;
  return true;
}
function craftPart(spec){
  if(!craftAffordable(spec.cost))return null;
  G.credits-=spec.cost.credits;
  for(const k in spec.cost)if(k!=="credits")G.cargo[k]-=spec.cost[k];
  const part=genPart(hashi(Date.now()&0xffffff,partSeq*7717,0xC7AF),spec.tier);
  addPart(part);
  tell("tech","Собрана часть: "+part.name+" ("+TIER_RU[part.tier]+")",
       "Часть собрана\n"+part.name);
  return part;
}
/* «Обновление» фактора: ассортимент станций перебирается втрое чаще — его связи
   в том и состоят, что он знает о новом раньше. Бакет один на весь ассортимент
   (части, уникальный корпус, кантина), поэтому перк правится здесь, в одном месте. */
function timeBucket(){
  const period=(typeof mgrPerkOf==="function"&&mgrPerkOf("fact","stock"))?57600000:172800000;
  return Math.floor(Date.now()/period);
}
function stationUniqueOffer(sys){
  if(!sys.station)return null;
  const r=rng(hashi(sys.seed,999,timeBucket()));
  const chance=.35+sysDanger(sys.sx,sys.sy)*.35;
  if(r()>chance)return null;
  return genUniqueShip(hashi(sys.seed,4242,timeBucket()));
}
/* части в продаже: как и уникальный корабль — ничего не персистится,
   ассортимент детерминирован seed станции и временным бакетом */
function stationParts(sys){
  if(!sys||!sys.station)return [];
  const bucket=timeBucket(),d=sysDanger(sys.sx,sys.sy);
  const r=rng(hashi(sys.seed,8181,bucket));
  const n=1+Math.floor(r()*3);
  const out=[];
  for(let i=0;i<n;i++){
    const seed=hashi(sys.seed,i*613+17,bucket);
    const part=genPart(seed,tierFromDanger(d,rng(seed)));
    const price=Math.round((320+part.tier*part.tier*460+part.aff.length*180)*(.85+r()*.4)/10)*10;
    out.push({key:sys.key+"|"+bucket+"|"+i,part,price});
  }
  /* «Чёрный список» фактора: его связи открывают то, чего в открытой продаже нет —
     одна часть заведомо высокого класса и дороже рынка. Не «+10% ко всему»,
     а конкретная вещь, за которой имеет смысл прилететь. */
  if(typeof mgrPerkOf==="function"&&mgrPerkOf("fact","black")){
    const seed=hashi(sys.seed,0xB1AC,bucket);
    const part=genPart(seed,Math.min(3,tierFromDanger(d,rng(seed))+1));
    const price=Math.round((320+part.tier*part.tier*460+part.aff.length*180)*1.45/10)*10;
    out.push({key:sys.key+"|"+bucket+"|black",part,price,black:1});
  }
  return out;
}
const HULL_CACHE={};
/* корпуса NPC живут отдельно от G.uniqueShips — те персистятся, эти нет */
const NPC_SHIPS={};
function hex2rgb(h){
  h=h.replace("#","");
  return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];
}
const rgba=(c,a)=>"rgba("+(c[0]|0)+","+(c[1]|0)+","+(c[2]|0)+","+a+")";
const mixc=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
/* полуширина корпуса в произвольной точке оси — по станциям профиля */
function profW(prof,x){
  for(let i=0;i<prof.length-1;i++){
    const a=prof[i],b=prof[i+1];
    if(x<=a[0]&&x>=b[0]){
      const t=(a[0]-x)/((a[0]-b[0])||1);
      return lerp(a[1],b[1],t);
    }
  }
  return x>prof[0][0]?prof[0][1]:prof[prof.length-1][1];
}
/* ══════════════ класс корпуса ══════════════ */
/* Генератор делал «просто корабль»: пропорции гуляли от seed, но силуэт ничего
   не сообщал. В системе летали восемь разных кораблей, и ни по одному нельзя
   было сказать, кто это — рудовоз, курьер или фрегат, пока не подлетишь и не
   прочитаешь подпись.

   Класс — это не новая таблица кораблей, а **уклон генератора**: те же
   станции профиля, но с другими пропорциями, и одна-две узнаваемые детали.
   Рудовоз широк и обвешан контейнерами, у буровика бур в носу, у фрегата
   стволы и скула, у яхты лента окон, у исследователя тарелка и панели.
   Читается силуэтом на любом масштабе, а это единственное, что видно
   в системе. */
const HULL_CLASS={
  /* Пропорции разведены сильнее, чем были: на листе из ста корпусов классы
     сливались в одну «стрелу с крыльями». Курьер теперь вдвое длиннее своей
     ширины, рудовоз — почти ящик, яхта — веретено, и размах крыла тоже свой
     (`wsp`): рудовозу крылья ни к чему, фрегату они и есть силуэт. */
  scout:  {ru:"разведчик",     bw:.85,len:1.00,wing:[1,3],nac:.62,notch:.55,dish:1,wsp:1},
  courier:{ru:"курьер",        bw:.50,len:1.52,wing:[2,3],nac:.80,notch:.30,fin:1,wsp:1.25},
  hauler: {ru:"рудовоз",       bw:1.90,len:1.04,wing:[0,1],nac:.38,notch:.85,cont:1,wsp:.5},
  miner:  {ru:"буровик",       bw:1.52,len:.92,wing:[0,2],nac:.50,notch:.70,cont:1,drill:1,wsp:.62},
  warship:{ru:"фрегат",        bw:1.16,len:1.12,wing:[2,3],nac:.74,notch:.50,guns:1,armor:1,wsp:1.18},
  yacht:  {ru:"яхта",          bw:.74,len:1.34,wing:[1,2],nac:.50,notch:.10,win:1,fin:1,wsp:1.05},
  survey: {ru:"исследователь", bw:.92,len:1.14,wing:[1,2],nac:.52,notch:.40,dish:1,panel:1,wsp:.92}
};
function hullClassOf(id,S){
  if(S.hcls)return S.hcls;
  let k;
  /* у пирата корпус всегда боевой или курьерский: он либо дерётся, либо
     догоняет. Мирного рудовоза среди них быть не должно — силуэт врага
     обязан читаться враждебно ещё до первого выстрела */
  if(id&&id[0]==="p")k=(hashi(S.seed,3,0x9A17)&3)?"warship":"courier";
  else if(S.cls&&/буровик|шахт/.test(S.cls))k="miner";
  else if(S.cargo>=140)k="hauler";
  else if(S.hull>=200)k="warship";
  else if(S.thr>=1.35)k="courier";
  else if(S.fuel>=150&&S.cargo<70)k="survey";
  else if(S.unique||S.fused)k=["scout","yacht","survey","warship"][hashi(S.seed,5,0x77)&3];
  else k="scout";
  S.hcls=k;return k;
}
function hullOf(id){
  if(HULL_CACHE[id])return HULL_CACHE[id];
  const S=shipData(id),r=rng(S.seed);
  const K=HULL_CLASS[hullClassOf(id,S)]||HULL_CLASS.scout;

  /* ── продольный профиль: станции от носа к корме ── */
  const nose=(16+r()*14)*K.len, tail=-(13+r()*13)*K.len, len=nose-tail;
  const bw=(3.8+r()*4.4)*K.bw;
  const segs=9+Math.floor(r()*5);
  /* у рудовоза корма почти равна миделю — корпус-ящик; у курьера сходит
     на конус. Это и есть первое, что читается силуэтом */
  // У иглы-курьера нос сходил в нить: держим минимум, иначе силуэт теряет тело
  const noseW=Math.max(.9,bw*(.10+r()*.16)*(K.cont?1.5:1)), tailW=bw*(.42+r()*.46)*(K.cont?1.3:1);
  const tp=.28+r()*.3;
  const hasNotch=r()<K.notch, notch=.6+r()*.28, notchT=tp+.16+r()*.3;
  const prof=[];
  for(let i=0;i<=segs;i++){
    const t=i/segs, x=lerp(nose,tail,t);
    let w;
    if(t<tp){const u=t/tp;w=lerp(noseW,bw,u*u*(3-2*u));}
    else{const u=(t-tp)/(1-tp);w=lerp(bw,tailW,u*u*(3-2*u));}
    if(hasNotch&&t>notchT)w*=notch;   // уступ обшивки — силуэт перестаёт быть каплей
    w*=.93+r()*.15;                   // станции чуть гуляют
    prof.push([x,Math.max(.7,w)]);
  }
  const tip=[nose+2+r()*4,0];
  const poly=[tip];
  for(const p of prof)poly.push([p[0],-p[1]]);
  for(let i=prof.length-1;i>=0;i--)poly.push([prof[i][0],prof[i][1]]);

  /* ── крылья: многозвенные, со скосом ── */
  const wingN=K.wing[0]+Math.floor(r()*(K.wing[1]-K.wing[0]+1)), wings=[];
  for(let i=0;i<wingN;i++){
    const root=lerp(nose*.1,tail*.82,(i+.3+r()*.4)/wingN);
    const chord=len*(.12+r()*.16), span=(bw*(1.15+r()*1.5)+2.5)*(K.wsp||1);
    const sweep=-chord*(.3+r()*.9), rw=profW(prof,root);
    wings.push([
      [root+chord*.5,-rw*.82],
      [root+chord*.5+sweep*.5,-span*.6],
      [root+chord*.12+sweep,-span],
      [root-chord*.5+sweep,-span*(.86+r()*.12)],
      [root-chord*.7+sweep*.45,-span*.5],
      [root-chord*.55,-rw*.88]
    ]);
  }

  /* ── гондолы двигателей ── */
  const nacs=[];
  if(r()<K.nac){
    const nl=len*(.24+r()*.2), nr=bw*(.18+r()*.2)+1;
    nacs.push({x:tail+nl*(.5+r()*.3), y:bw*(.72+r()*.5)+nr*.8, l:nl, r:nr});
  }

  /* ── сопла: откуда бьёт факел ── */
  const eng=[];
  for(const n of nacs){
    eng.push({x:n.x-n.l*.5,y:-n.y,r:n.r*.92});
    eng.push({x:n.x-n.l*.5,y:n.y,r:n.r*.92});
  }
  if(tailW>bw*.55){eng.push({x:tail,y:-tailW*.46,r:tailW*.44});eng.push({x:tail,y:tailW*.46,r:tailW*.44});}
  else eng.push({x:tail,y:0,r:Math.max(1.6,tailW*.82)});

  /* ── навеска: боксы, антенны, рёбра обшивки ── */
  const pods=[];
  const podN=Math.floor(r()*3);
  for(let i=0;i<podN;i++)pods.push([tail*.5-r()*3, bw+2.2+i*3.4, 4+r()*4, 2.2+r()*1.6]);
  const greeb=[];
  const gn=8+Math.floor(r()*10);
  for(let i=0;i<gn;i++){
    const gx=lerp(nose*.72,tail*.94,r()), gw=profW(prof,gx);
    greeb.push([gx,(r()*2-1)*gw*.62,1.1+r()*3.2,.9+r()*2,r()<.28]);
  }
  const ants=[];
  const an=1+Math.floor(r()*3);
  for(let i=0;i<an;i++){
    const ax=lerp(nose*.55,tail*.5,r()), aw=profW(prof,ax);
    ants.push([ax,-aw*.9,3+r()*6,(r()*.9-.45)]);
  }
  const ribs=[];
  for(let i=2;i<prof.length-1;i++)if(r()<.55)ribs.push(i);

  /* ── приметы класса ──
     По одной-две на корпус, и все на своих местах: контейнеры вдоль хребта,
     бур в носу, стволы вдоль скулы, тарелка на штанге у кормы. Больше не
     нужно: силуэт должен опознаваться, а не описываться. */
  const mark={};
  if(K.cont){
    mark.cont=[];
    const n=3+Math.floor(r()*4);
    const cl=len*.62/n;
    for(let i=0;i<n;i++)
      // контейнеры прижаты к БОРТУ, а не отставлены на ширину корпуса:
      // при широком рудовозе они уезжали в стороны и висели двумя тумбами
      mark.cont.push([tail+len*.14+i*cl, cl*.82, Math.max(1.6,profW(prof,tail+len*.14+i*cl)*.62)]);
  }
  if(K.drill)mark.drill={x:nose+1.5,l:5+r()*5,r:Math.max(2.2,noseW*1.5)};
  if(K.guns){
    mark.guns=[];
    const gn=1+Math.floor(r()*2);
    for(let i=0;i<gn;i++)
      mark.guns.push([lerp(nose*.62,nose*.1,i/Math.max(1,gn)),bw*(.5+i*.3),4+r()*6]);
  }
  if(K.armor)mark.armor=nose*(.42+r()*.2);
  if(K.dish)mark.dish={x:lerp(tail*.6,nose*.1,r()),r:1.8+r()*2.2,boom:2.5+r()*3};
  if(K.panel)mark.panel={x:lerp(tail*.7,tail*.2,r()),l:len*(.16+r()*.12),w:bw*(1.5+r()*1.2)};
  if(K.win)mark.win=[nose*(.2+r()*.2),tail*(.2+r()*.3)];

  const canopy={x:lerp(nose,tail,.12+r()*.12),rx:2+r()*3.4,ry:0};
  canopy.ry=Math.min(profW(prof,canopy.x)*.62,canopy.rx*(.6+r()*.5));
  const stripe={a:.2+r()*.28,b:.58+r()*.34,from:.1+r()*.2,to:.62+r()*.32};
  const fin=r()<.55;

  /* габарит со всей навеской — им пользуется превью на верфи */
  let hw=bw;
  for(const w of wings)for(const p of w)hw=Math.max(hw,Math.abs(p[1]));
  for(const n of nacs)hw=Math.max(hw,n.y+n.r);
  for(const p of pods)hw=Math.max(hw,p[1]+p[3]);

  const col=hex2rgb(S.col);
  const h={poly,prof,wings,pods,nacs,eng,greeb,ants,ribs,canopy,stripe,fin,mark,
    hcls:S.hcls,clsRu:K.ru,tier:S.tier,seed:S.seed,
    nose,bw,tail,len,tailW,halfW:hw,
    col, lite:mixc(col,[255,255,255],.42), dark:mixc(col,[6,10,17],.82),
    body:mixc(col,[8,13,21],.72), edge:mixc(col,[10,16,26],.35)};
  HULL_CACHE[id]=h;return h;
}
function tracePoly(pts,sy){
  ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]*(sy||1));
  for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]*(sy||1));
  ctx.closePath();
}
/* факел: мягкое зарево + перо + добела раскалённое ядро */
function drawFlame(x,y,rad,pow){
  const f=rad*(2.4+Math.random()*1.7)*pow;
  const gl=ctx.createRadialGradient(x-f*.25,y,0,x-f*.25,y,f*1.15);
  gl.addColorStop(0,"rgba(255,180,110,.34)");gl.addColorStop(1,"rgba(255,120,60,0)");
  ctx.fillStyle=gl;ctx.beginPath();ctx.arc(x-f*.25,y,f*1.15,0,TAU);ctx.fill();
  const g=ctx.createLinearGradient(x,y,x-f,y);
  g.addColorStop(0,"rgba(255,246,220,.95)");g.addColorStop(.2,"rgba(255,194,112,.86)");
  g.addColorStop(.58,"rgba(255,116,62,.42)");g.addColorStop(1,"rgba(255,70,40,0)");
  ctx.fillStyle=g;ctx.beginPath();
  ctx.moveTo(x,y-rad);
  ctx.quadraticCurveTo(x-f*.45,y-rad*.55,x-f,y);
  ctx.quadraticCurveTo(x-f*.45,y+rad*.55,x,y+rad);
  ctx.closePath();ctx.fill();
  ctx.fillStyle="rgba(255,255,242,.8)";
  ctx.beginPath();ctx.moveTo(x,y-rad*.46);ctx.lineTo(x-f*.4,y);ctx.lineTo(x,y+rad*.46);
  ctx.closePath();ctx.fill();
}
/* крен в виде сверху: скос + сжатие по размаху — ровно так кренящийся
   корпус и проецируется на плоскость экрана */
function bankTransform(bank){
  if(!bank)return false;
  ctx.save();
  /* сжатие по Y вместо скоса — так силуэт по-настоящему сужается, будто корпус
     поворачивается вокруг продольной оси, а не просто едет "плашмя" вбок */
  ctx.transform(1,0,0,Math.cos(bank),0,0);
  return true;
}
/* ── отделка по тиру ──
   Тир — не строчка в карточке, а то, как корпус выглядит. Рабочая лошадка ходит
   в заплатах и потёках, редкий носит акцентную окантовку, легендарный — двойной
   кант и эмблему на скуле, люкс — ленту окон и глянцевую блик-полосу, опытный
   показывает открытые узлы и кабели, которые на серийном закрыли бы кожухом.
   Рисуется ПОД навеской класса: это шкура корпуса, а не то, что на него навесили. */
function drawTierTrim(h){
  const t=h.tier;if(!t||t==="line")return;
  const P=h.prof,r=rng(hashi(h.seed||1,0x71E4,3));
  if(t==="work"){
    /* заплаты: куски обшивки другого тона и потёки под ними */
    const n=3+((r()*3)|0);
    for(let i=0;i<n;i++){
      const x=lerp(h.nose*.7,h.tail*.85,r()),w=profW(P,x);
      const px=x,py=(r()*2-1)*w*.55,pw=2.2+r()*4,ph=1.6+r()*2.6;
      ctx.fillStyle="rgba(0,0,0,.34)";ctx.fillRect(px-pw/2,py-ph/2,pw,ph);
      ctx.strokeStyle=rgba(h.lite,.34);ctx.lineWidth=.7;
      ctx.strokeRect(px-pw/2,py-ph/2,pw,ph);
      ctx.fillStyle="rgba(0,0,0,.14)";                 // потёк вниз по потоку
      ctx.fillRect(px-pw*.2,py+ph/2,pw*.4,1.4+r()*2.6);
    }
  }else if(t==="rare"){
    ctx.strokeStyle=rgba(h.lite,.5);ctx.lineWidth=.8;  // акцентная окантовка
    for(const s of [1,-1]){
      ctx.beginPath();
      for(let i=1;i<P.length-1;i++)ctx.lineTo(P[i][0],P[i][1]*.86*s);
      ctx.stroke();
    }
  }else if(t==="legend"){
    ctx.strokeStyle=rgba(h.lite,.65);ctx.lineWidth=1.1; // двойной кант
    for(const s of [1,-1])for(const f of [.9,.66]){
      ctx.beginPath();
      for(let i=1;i<P.length-1;i++)ctx.lineTo(P[i][0],P[i][1]*f*s);
      ctx.stroke();
    }
    const ex=h.nose*.42,ew=Math.max(1.6,profW(P,ex)*.34);  // эмблема на скуле
    for(const s of [1,-1]){
      ctx.fillStyle=rgba(h.lite,.75);
      ctx.beginPath();ctx.moveTo(ex+ew,ew*.2*s);ctx.lineTo(ex,ew*1.2*s);
      ctx.lineTo(ex-ew,ew*.2*s);ctx.closePath();ctx.fill();
    }
  }else if(t==="luxe"){
    /* лента окон по борту и глянец: яхту опознают по свету изнутри */
    for(const s of [1,-1]){
      const y0=h.nose*.42,y1=h.tail*.5;
      // окна крупнее и с тёплым свечением: на листе флота лента в полтора
      // пикселя пропадала, и яхта читалась курьером
      for(let x=y1;x<y0;x+=3.2){
        const w=profW(P,x);if(w<1.2)continue;
        ctx.fillStyle="rgba(255,236,190,.85)";
        ctx.fillRect(x,w*.72*s-.9,2.2,1.9);
        ctx.fillStyle="rgba(255,214,150,.22)";
        ctx.fillRect(x-.8,w*.72*s-1.7,3.8,3.5);
      }
      ctx.strokeStyle="rgba(255,255,255,.35)";ctx.lineWidth=.7;
      ctx.beginPath();
      for(let i=1;i<P.length-1;i++)ctx.lineTo(P[i][0],P[i][1]*.34*s);
      ctx.stroke();
    }
    const gg=ctx.createLinearGradient(h.nose,0,h.tail,0);  // продольный глянец
    gg.addColorStop(0,"rgba(255,255,255,.18)");
    gg.addColorStop(.45,"rgba(255,255,255,.02)");
    gg.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=gg;
    ctx.beginPath();
    for(let i=1;i<P.length-1;i++)ctx.lineTo(P[i][0],-P[i][1]*.55);
    for(let i=P.length-2;i>0;i--)ctx.lineTo(P[i][0],-P[i][1]*.12);
    ctx.closePath();ctx.fill();
  }else if(t==="proto"){
    /* открытые узлы: рама наружу, кабельная коса вдоль борта */
    ctx.strokeStyle="rgba(255,157,122,.5)";ctx.lineWidth=.7;
    for(const s of [1,-1]){
      ctx.beginPath();
      for(let i=2;i<P.length-2;i++)ctx.lineTo(P[i][0],P[i][1]*(.5+(i%2)*.28)*s);
      ctx.stroke();
    }
    for(let i=3;i<P.length-2;i+=2){                    // поперечины рамы
      ctx.strokeStyle="rgba(0,0,0,.35)";
      ctx.beginPath();ctx.moveTo(P[i][0],-P[i][1]*.8);ctx.lineTo(P[i][0],P[i][1]*.8);ctx.stroke();
    }
  }
}
/* приметы класса рисуются поверх корпуса, но под фонарём и огнями: это
   навеска, а не корпус, и она обязана читаться отдельным слоем */
function drawHullMarks(h){
  const M=h.mark;if(!M)return;
  if(M.cont)for(const c of M.cont)for(const s of [1,-1]){
    const y=c[2]*s;
    ctx.fillStyle=rgba(h.dark,1);ctx.strokeStyle=rgba(h.col,.7);ctx.lineWidth=.9;
    ctx.beginPath();ctx.rect(c[0],s>0?y-c[2]*.55:y-c[2]*.45,c[1],c[2]);
    ctx.fill();ctx.stroke();
    /* стяжки контейнера: без них ящик читается пустым прямоугольником */
    ctx.strokeStyle="rgba(0,0,0,.42)";ctx.lineWidth=.7;
    ctx.beginPath();
    ctx.moveTo(c[0]+c[1]*.5,s>0?y-c[2]*.55:y-c[2]*.45);
    ctx.lineTo(c[0]+c[1]*.5,(s>0?y-c[2]*.55:y-c[2]*.45)+c[2]);
    ctx.stroke();
  }
  if(M.drill){
    const d=M.drill;
    ctx.fillStyle=rgba(h.lite,.85);
    ctx.beginPath();
    ctx.moveTo(d.x+d.l,0);ctx.lineTo(d.x,-d.r);ctx.lineTo(d.x,d.r);ctx.closePath();
    ctx.fill();
    ctx.strokeStyle=rgba(h.dark,1);ctx.lineWidth=.8;
    for(let i=1;i<4;i++){
      const t=i/4;
      ctx.beginPath();
      ctx.moveTo(d.x+d.l*t,-d.r*(1-t));ctx.lineTo(d.x+d.l*t,d.r*(1-t));ctx.stroke();
    }
  }
  if(M.guns)for(const g of M.guns)for(const s of [1,-1]){
    ctx.strokeStyle=rgba(h.lite,.75);ctx.lineWidth=1.7;
    ctx.beginPath();ctx.moveTo(g[0],g[1]*s);ctx.lineTo(g[0]+g[2],g[1]*s);ctx.stroke();
    ctx.fillStyle=rgba(h.dark,1);
    ctx.fillRect(g[0]-2.5,g[1]*s-1.6,4,3.2);
  }
  if(M.armor){
    /* скула: утолщённая носовая плита, из-за неё фрегат выглядит тупоносым */
    ctx.fillStyle=rgba(h.lite,.28);
    ctx.beginPath();
    ctx.moveTo(h.nose,0);
    ctx.lineTo(M.armor,-profW(h.prof,M.armor)*.92);
    ctx.lineTo(M.armor,profW(h.prof,M.armor)*.92);
    ctx.closePath();ctx.fill();
    ctx.strokeStyle=rgba(h.col,.6);ctx.lineWidth=.9;ctx.stroke();
  }
  if(M.panel)for(const s of [1,-1]){
    const p=M.panel;
    ctx.strokeStyle=rgba(h.col,.6);ctx.lineWidth=.8;
    ctx.beginPath();ctx.moveTo(p.x,h.bw*.6*s);ctx.lineTo(p.x,p.w*s);ctx.stroke();
    ctx.fillStyle="rgba(40,70,110,.85)";
    ctx.strokeStyle=rgba(h.lite,.5);
    ctx.beginPath();ctx.rect(p.x-p.l*.5,p.w*s-(s>0?0:2.6),p.l,2.6);
    ctx.fill();ctx.stroke();
  }
  if(M.dish){
    const d=M.dish;
    ctx.strokeStyle=rgba(h.col,.6);ctx.lineWidth=.8;
    ctx.beginPath();ctx.moveTo(d.x,0);ctx.lineTo(d.x-d.boom*.4,-h.bw-d.boom);ctx.stroke();
    ctx.fillStyle="rgba(200,230,245,.22)";
    ctx.strokeStyle=rgba(h.lite,.7);ctx.lineWidth=.9;
    ctx.beginPath();
    ctx.ellipse(d.x-d.boom*.4,-h.bw-d.boom,d.r,d.r*.55,-.5,0,TAU);
    ctx.fill();ctx.stroke();
  }
  if(M.win){
    /* лента окон — единственное, что отличает яхту от курьера на расстоянии */
    ctx.fillStyle="rgba(190,240,255,.55)";
    const y=h.bw*.28;
    for(let x=M.win[0];x>M.win[1];x-=3.2)ctx.fillRect(x,-y-.6,1.7,1.2);
  }
}
function drawHull(id,thrusting,braking,lvl,bank){
  const h=hullOf(id),blink=Math.sin(G.t*.07);
  lvl=lvl||0;
  const banked=bankTransform(bank||0);
  /* «брюхо» корпуса: смещённый тёмный силуэт проглядывает с той стороны, куда
     кренится корабль — вместе со сжатием по Y это читается как настоящий крен,
     а не плоская фигура, скользящая вбок */
  if(bank){
    ctx.save();ctx.translate(0,Math.sin(bank)*h.bw*.62);
    tracePoly(h.poly);ctx.fillStyle=rgba(h.dark,.85);ctx.fill();
    ctx.restore();
  }
  /* ── факелы ── */
  if(thrusting)for(const e of h.eng)drawFlame(e.x,e.y,e.r,1+lvl*.22);
  else for(const e of h.eng){   // холостой ход — только тлеющее сопло
    ctx.fillStyle="rgba(255,140,70,"+(.2+Math.random()*.12).toFixed(2)+")";
    ctx.beginPath();ctx.arc(e.x+e.r*.1,e.y,e.r*.42,0,TAU);ctx.fill();
  }
  if(braking){
    const f=4+Math.random()*6;
    ctx.fillStyle="rgba(127,230,216,.7)";
    for(const s of [-1,1]){
      const y=h.bw*.5*s;
      ctx.beginPath();ctx.moveTo(h.nose*.5,y-1.8);ctx.lineTo(h.nose*.5+f,y);
      ctx.lineTo(h.nose*.5,y+1.8);ctx.closePath();ctx.fill();
    }
  }
  /* ── крылья ── */
  for(const w of h.wings)for(const s of [1,-1]){
    tracePoly(w,s);
    const g=ctx.createLinearGradient(0,-h.bw*3*s,0,h.bw*s);
    g.addColorStop(0,rgba(h.edge,.95));g.addColorStop(1,rgba(h.dark,1));
    ctx.fillStyle=g;ctx.fill();
    ctx.strokeStyle=rgba(h.col,.55);ctx.lineWidth=.95;ctx.stroke();
    ctx.strokeStyle=rgba(h.col,.22);ctx.lineWidth=.7;
    ctx.beginPath();ctx.moveTo(w[0][0],w[0][1]*s*.55);ctx.lineTo(w[2][0],w[2][1]*s*.8);ctx.stroke();
  }
  /* ── гондолы ── */
  for(const n of h.nacs)for(const s of [1,-1]){
    const y=n.y*s;
    ctx.beginPath();
    ctx.moveTo(n.x+n.l*.5,y-n.r*.45);
    ctx.lineTo(n.x+n.l*.28,y-n.r);ctx.lineTo(n.x-n.l*.5,y-n.r);
    ctx.lineTo(n.x-n.l*.5,y+n.r);ctx.lineTo(n.x+n.l*.28,y+n.r);
    ctx.lineTo(n.x+n.l*.5,y+n.r*.45);ctx.closePath();
    const g=ctx.createLinearGradient(0,y-n.r,0,y+n.r);
    g.addColorStop(0,rgba(h.lite,.5));g.addColorStop(.4,rgba(h.body,1));g.addColorStop(1,rgba(h.dark,1));
    ctx.fillStyle=g;ctx.fill();
    ctx.strokeStyle=rgba(h.col,.9);ctx.lineWidth=1.1;ctx.stroke();
    ctx.strokeStyle=rgba(h.col,.4);ctx.lineWidth=.8;
    ctx.beginPath();ctx.moveTo(n.x+n.l*.16,y-n.r);ctx.lineTo(n.x+n.l*.16,y+n.r);ctx.stroke();
    ctx.strokeStyle="rgba(255,160,90,.55)";
    ctx.beginPath();ctx.moveTo(n.x-n.l*.5,y-n.r);ctx.lineTo(n.x-n.l*.5,y+n.r);ctx.stroke();
  }
  /* ── корпус ── */
  tracePoly(h.poly);
  const bg=ctx.createLinearGradient(0,-h.bw*1.25,0,h.bw*1.25);
  bg.addColorStop(0,rgba(h.lite,.55));
  bg.addColorStop(.26,rgba(h.body,1));
  bg.addColorStop(.62,rgba(h.dark,1));
  bg.addColorStop(1,rgba(h.edge,.9));
  ctx.fillStyle=bg;ctx.fill();
  ctx.save();ctx.clip();
  /* окраска: продольная полоса */
  const P=h.prof,S1=h.stripe;
  const i0=Math.floor(S1.from*(P.length-1)),i1=Math.ceil(S1.to*(P.length-1));
  ctx.beginPath();
  for(let i=i0;i<=i1;i++)ctx.lineTo(P[i][0],-P[i][1]*S1.a);
  for(let i=i1;i>=i0;i--)ctx.lineTo(P[i][0],-P[i][1]*S1.b);
  ctx.closePath();ctx.fillStyle=rgba(h.col,.2);ctx.fill();
  /* панельные рёбра */
  ctx.strokeStyle="rgba(0,0,0,.34)";ctx.lineWidth=.75;
  for(const i of h.ribs){
    ctx.beginPath();ctx.moveTo(P[i][0],-P[i][1]);ctx.lineTo(P[i][0],P[i][1]);ctx.stroke();
  }
  ctx.strokeStyle="rgba(255,255,255,.09)";
  for(const f of [.34,.72]){
    ctx.beginPath();
    for(let i=0;i<P.length;i++)ctx.lineTo(P[i][0],-P[i][1]*f);
    ctx.stroke();
    ctx.beginPath();
    for(let i=0;i<P.length;i++)ctx.lineTo(P[i][0],P[i][1]*f);
    ctx.stroke();
  }
  /* навеска */
  for(const g of h.greeb){
    ctx.fillStyle=g[4]?"rgba(255,255,255,.13)":"rgba(0,0,0,.4)";
    if(g[4]){ctx.beginPath();ctx.arc(g[0],g[1],g[2]*.5,0,TAU);ctx.fill();}
    else ctx.fillRect(g[0],g[1],g[2],g[3]);
  }
  /* блик по хребту — съезжает поперёк корпуса при крене, будто по круглому боку */
  const bo=(bank||0)*h.bw*.9;
  const sp=ctx.createLinearGradient(0,-h.bw*.9+bo,0,-h.bw*.1+bo);
  sp.addColorStop(0,"rgba(255,255,255,0)");sp.addColorStop(1,"rgba(255,255,255,.14)");
  ctx.fillStyle=sp;ctx.fillRect(h.tail,-h.bw,h.len,h.bw*2);
  ctx.restore();
  ctx.strokeStyle=rgba(h.col,.95);ctx.lineWidth=1.25;
  tracePoly(h.poly);ctx.stroke();
  drawTierTrim(h);
  drawHullMarks(h);
  /* ── боксы по бортам ── */
  for(const p of h.pods)for(const s of [1,-1]){
    ctx.fillStyle=rgba(h.dark,1);ctx.strokeStyle=rgba(h.col,.75);ctx.lineWidth=.9;
    ctx.beginPath();ctx.rect(p[0],p[1]*s-(s>0?0:p[3]),p[2],p[3]);ctx.fill();ctx.stroke();
  }
  /* ── антенны ── */
  ctx.strokeStyle=rgba(h.col,.5);ctx.lineWidth=.7;
  for(const a of h.ants)for(const s of [1,-1]){
    ctx.beginPath();ctx.moveTo(a[0],a[1]*s);
    ctx.lineTo(a[0]-a[2]*Math.sin(a[3]),(a[1]-a[2])*s);ctx.stroke();
  }
  /* ── фонарь кабины ── */
  const cp=h.canopy;
  ctx.fillStyle="rgba(10,26,38,.95)";
  ctx.beginPath();ctx.ellipse(cp.x,0,cp.rx,cp.ry,0,0,TAU);ctx.fill();
  ctx.strokeStyle=rgba(h.lite,.6);ctx.lineWidth=.8;ctx.stroke();
  const cg=ctx.createLinearGradient(cp.x+cp.rx,0,cp.x-cp.rx,0);
  cg.addColorStop(0,"rgba(180,240,255,.55)");cg.addColorStop(1,"rgba(120,200,230,0)");
  ctx.fillStyle=cg;
  ctx.beginPath();ctx.ellipse(cp.x,0,cp.rx*.86,cp.ry*.72,0,0,TAU);ctx.fill();
  /* ── бортовые огни ── */
  const on=blink>0;
  for(const [s,c] of [[-1,"255,80,70"],[1,"110,255,150"]]){
    const wy=h.wings.length?h.wings[0][2]:[h.nose*.2,-h.bw*1.6];
    ctx.fillStyle="rgba("+c+","+(on?.95:.25)+")";
    ctx.beginPath();ctx.arc(wy[0],wy[1]*s,1.25,0,TAU);ctx.fill();
  }
  if(h.fin){
    ctx.strokeStyle=rgba(h.lite,.45);ctx.lineWidth=.9;
    ctx.beginPath();ctx.moveTo(h.tail*.65,0);ctx.lineTo(h.tail-3.5,0);ctx.stroke();
  }
  if(lvl>1){
    ctx.strokeStyle="rgba(180,240,255,"+(.16+lvl*.07).toFixed(2)+")";ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(h.tail*.35,-h.bw-lvl*.7);ctx.lineTo(h.tail*.35,h.bw+lvl*.7);ctx.stroke();
  }
  if(banked)ctx.restore();
}
