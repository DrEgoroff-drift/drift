/* ══════════════ проба · шесть верфей: калибровка M480/M481 ══════════════
   Два вопроса к характеру верфей (DESIGN-shipyard §4), оба — числами.
   МИРЫ: заказной рудовоз каждой верфи — против лучшей сделки в один прыжок:
   сколько рейсов окупают корпус.
   СТРЕЛЬБИЩЕ: заказной боевой · шесть спаррингов с капитаном (ранг 2, spar):
   нос к цели скоростью корпуса; сдача под четвертью (как дуэль). Мерится:
   сколько сдач, средний срок, сколько корпуса снял пират. «—» — без характера. */
function ydPrbStations(rad){
  const out=[];
  for(let x=-rad;x<=rad;x++)for(let y=-rad;y<=rad;y++){
    if(!starAt(x,y))continue;const S=getSystem(x,y);
    if(S&&S.station&&S.station.prices)out.push(S);
  }
  return out;
}
function ydPrbLeg(list,hold){
  const legs=[];
  for(const A of list)for(const B of list){
    if(A===B)continue;
    if(typeof needOf==="function"&&(needOf(A)||needOf(B)))continue;
    const PB=marketFor(B),d=Math.max(Math.abs(A.sx-B.sx),Math.abs(A.sy-B.sy));
    for(const k of TRADE_KEYS){
      const ask=buyPriceFor(A,k);if(!ask||!PB[k])continue;
      const h=hold;if(h<=0)continue;
      const profit=(PB[k]-ask)*h,fuel=(d*6+4)*8;
      legs.push({net:profit-fuel});
    }
  }
  legs.sort((a,b)=>b.net-a.net);return legs;
}
function ydFly(by,cls,size,w){
  const S=stapelAll(),o={by,cls,size,l:1,w:w||1,seed:0x5EED,no:900+S.done.length,st:"проба"};
  S.done.push(o);const id=stapelId(o);
  G.uniqueShips[id]=stapelShip(o);G.owned[id]=true;G.shipId=id;
  if(typeof invalidateParts==="function")invalidateParts();
  return id;
}
function ydWorld(){
  resetWorld();
  if(document.querySelectorAll)document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  G.mode="system";G.ship.x=0;G.ship.y=0;G.ship.vx=0;G.ship.vy=0;G.ship.a=0;
  G.ap=null;G.orbit=null;G.pirates=[];G.shots=[];G.marks=[];G.allies=[];
  G.fuel=100;G.engaged=false;
  for(const k in keys)keys[k]=false;
  if(typeof HELM!=="undefined"){HELM.key={};HELM.S=null;HELM.fade=null;}
  if(typeof ctlReset==="function")ctlReset();
}
function ydDuel(by){
  /* шесть спаррингов: капитан с флагом spar (полоса 420–620) и тонким щитом дуэли */
  let kills=0,t=0,lost=0,hm=0;
  for(let n=0;n<6;n++){
    ydWorld();rndSeed(0xD0E1+n);ydFly(by,"warship","medium");
    G.mods.weapon=2;G.modsOwned.weapon=2;
    if(typeof invalidateParts==="function")invalidateParts();
    G.energy=999;G.hull=hm=stat().hullMax;G.shield=stat().shieldMax||0;
    const R=PIRATE_RANKS[2],hp=(26+.5*70)*R.hull,sh=hp*R.shield*.62;
    const a=n*1.05,seed=hashi(0xD0E1,2,n)>>>0;
    const p={x:Math.cos(a)*520,y:Math.sin(a)*520,vx:0,vy:0,a:a+Math.PI,
      hull:hp,hullMax:hp,name:"Проба-"+n,rank:2,seed,shipId:pirateShipId(seed),
      cool:0,aware:true,thrust:false,shield:sh,shieldMax:sh,shieldHit:0,
      shieldType:(PIRATE_LOADOUT[2].shield||"solid"),deserter:0,spar:1};
    G.pirates.push(p);G.marks=[p];
    if(typeof keys==="object")keys.fire=true;
    let i=0;
    for(;i<60*60&&p.hull/p.hullMax>=.25&&G.hull>0;i++){
      const want=Math.atan2(p.y-G.ship.y,p.x-G.ship.x),d=angWrap(want-G.ship.a);
      const turnR=.038*stat().turn;
      G.ship.a=angWrap(G.ship.a+clamp(d,-turnR,turnR));
      G.t+=1;updateCombat(1);
    }
    if(typeof keys==="object")keys.fire=false;
    if(p.hull/p.hullMax<.25)kills++;
    t+=i;lost+=hm-Math.max(0,G.hull);
  }
  return {down:kills,sec:+(t/60/6).toFixed(1),lost:Math.round(lost/6),hm};
}
suite("проба · верфи: рудовоз против лучшей сделки и бой на стрельбище",{tier:"probe"},()=>{
  const yards=["_"].concat(Object.keys(STAPEL_YARD));
  resetWorld();
  const list=ydPrbStations(7),row=[];
  for(const by of yards){
    const N=stapelStats({by:by==="_"?undefined:by,cls:"hauler",size:"heavy",l:1,w:1.15});
    const legs=ydPrbLeg(list,N.cargo).slice(0,5);
    const net=legs.length?legs.reduce((s,L)=>s+L.net,0)/legs.length:0;
    row.push((by==="_"?"—":by)+": трюм "+N.cargo+", корпус "+N.hull+", "+N.price+" кр, рейсов "+(net>0?Math.ceil(N.price/net):"∞"));
  }
  note("миры · рудовоз тяжёлый широкий · "+row.join(" · "));
  const B=[];
  for(const by of yards){
    const N=stapelStats({by:by==="_"?undefined:by,cls:"warship",size:"medium",l:1,w:1});
    const D=ydDuel(by==="_"?undefined:by);
    B.push((by==="_"?"—":by)+": "+N.price+" кр, корпус "+D.hm+", поворот "+N.turn+" · сдал "+D.down+"/6, ср. "+D.sec+" с, пират снял "+D.lost+" ("+Math.round(D.lost/Math.max(1,D.hm)*100)+" %)");
  }
  note("стрельбище · боевой средний · капитан spar · шесть спаррингов · "+B.join(" · "));
  /* в консоль — иначе проба молчит в -Probe/only (note только в TEST.lines) */
  console.log("миры · "+row.join(" · "));
  console.log("стрельбище · "+B.join(" · "));
  ok(B.length===yards.length,"все верфи посчитаны");
  const downs=B.map(s=>+(s.match(/сдал (\d+)/)||[])[1]||0);
  ok(downs.some(n=>n>0),"после правки spar хотя бы одна верфь добивает сдачу: "+downs.join(","));
  G.shipId="strizh";
});
