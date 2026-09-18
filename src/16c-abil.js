/* ══════════════ особая система корпуса (M484, DESIGN-shipyard) ══════════════
   Одно действие на класс корпуса, с перезарядкой. Места на пульте не
   занимает: это ДОЛГОЕ нажатие ДЕЙСТВИЯ (≥ .6 с), когда ДЕЙСТВИЕ ничего не
   предлагает; перезарядка рисуется ободом кнопки (PLAN «M484's place on the
   pad»). На клавиатуре — клавиша V.
     разведчик  ФОРСАЖ    — тяга ×1.6 на 3 с;
     курьер     СБРОС     — клетка трюма за борт приманкой: ближние пираты
                            теряют вас на 4 с;
     рудовоз    БАЛЛАСТ   — поворот ×1.5 на 4 с ценой 1 % груза;
     буровик    РЕЗАК     — бур коротким лучом: ближайшему чужому в носу 30;
     фрегат     ЗАЛП      — все стволы разом, какая бы группа ни стояла;
     яхта       СИРЕНА    — позывной, на который отвечает каждый корабль;
     исследователь ПРОЖЕКТОР — показывает залежи системы на 10 с.
   Состояние — эфемерное (ABIL), в сейв не идёт. */
const ABIL={
  scout:  {ru:"ФОРСАЖ",   cd:20,dur:3},
  courier:{ru:"СБРОС",    cd:25,dur:4},
  hauler: {ru:"БАЛЛАСТ",  cd:18,dur:4},
  miner:  {ru:"РЕЗАК",    cd:12,dur:.4},
  warship:{ru:"ЗАЛП",     cd:8, dur:.3},
  yacht:  {ru:"СИРЕНА",   cd:30,dur:2},
  survey: {ru:"ПРОЖЕКТОР",cd:30,dur:10}
};
const ABIL_HOLD=600;
let ABIL_ST={k:null,on:0,cd:0,armed:false,fired:false,text:""};
function abilKind(){const S=shipData(G.shipId);return S?hullClassOf(G.shipId,S):"scout";}
function abilOf(){return ABIL[abilKind()]||ABIL.scout;}
function abilOn(k){return ABIL_ST.k===k&&G.t<ABIL_ST.on;}
/* доля перезарядки 0..1 — для обода кнопки */
function abilReady01(){
  const A=abilOf();if(G.t>=ABIL_ST.cd)return 1;
  return clamp(1-(ABIL_ST.cd-G.t)/(A.cd*60),0,1);
}
/* множители для stat(): вне действия — ровно 1 */
function abilMul(what){
  if(what==="thr"&&abilOn("scout"))return 1.6;
  if(what==="turn"&&abilOn("hauler"))return 1.5;
  return 1;
}
function abilFire(){
  if(G.mode!=="system"||G.t<ABIL_ST.cd)return false;
  const k=abilKind(),A=ABIL[k]||ABIL.scout,sh=G.ship;
  let line="";
  if(k==="courier"){
    const K=RES_KEYS.filter(x=>(G.cargo[x]|0)>0&&!(RES[x].pax)&&x!=="folk").sort((a,b)=>G.cargo[b]-G.cargo[a]);
    if(!K.length){say("СБРОС · трюм пуст — нечем приманить",80);return false;}
    const n=Math.max(1,Math.min(G.cargo[K[0]],Math.round(stat().cargoMax/10)));
    G.cargo[K[0]]-=n;
    for(const p of G.pirates||[])if(Math.hypot(p.x-sh.x,p.y-sh.y)<700)p.jamT=Math.max(p.jamT||0,A.dur);
    line="СБРОС · "+RES[K[0]].ru.toLowerCase()+" ×"+n+" за борт — приманка";
    ABIL_ST.crate={x:sh.x-Math.cos(sh.a)*40,y:sh.y-Math.sin(sh.a)*40,a:sh.a};
  }else if(k==="hauler"){
    for(const x of RES_KEYS){if(RES[x].pax||x==="folk")continue;const c=G.cargo[x]|0;if(c>0)G.cargo[x]=c-Math.max(0,Math.round(c*.01));}
    line="БАЛЛАСТ · корма облегчена — разворот живее";
  }else if(k==="miner"){
    let best=null,bd=160;
    for(const p of G.pirates||[]){const d=Math.hypot(p.x-sh.x,p.y-sh.y);
      if(d<bd&&Math.abs(angDiff(Math.atan2(p.y-sh.y,p.x-sh.x),sh.a))<.5){bd=d;best=p;}}
    if(best){best.hull-=30;if(typeof sfx==="function")sfx("hit",{v:.4});}
    ABIL_ST.beam=best?{x:best.x,y:best.y}:{x:sh.x+Math.cos(sh.a)*160,y:sh.y+Math.sin(sh.a)*160};
    line="РЕЗАК"+(best?" · по корпусу":" · в пустоту");
  }else if(k==="warship"){
    const st=stat(),all=(st.guns&&st.guns.length)?st.guns:[{slot:0,g:st.gun,m:null}];
    const mk=(G.marks&&G.marks[0])||null,live=(mk&&mk.hull>0&&!mk.iff)?mk:null;
    if(!st.armed){say("ЗАЛП · стволов нет",80);return false;}
    for(const a of all){gunFireOnce(a.g,sh,live,live?Math.atan2(live.y-sh.y,live.x-sh.x):sh.a);G.energy=Math.max(0,G.energy-EN_SHOT*(a.g.en||1));}
    G.engaged=true;
    line="ЗАЛП · все стволы разом";
  }else if(k==="yacht"){
    const who=["«Слышим, борт. Красиво идёте.»","«Принято. Кто это такой нарядный?»","«Ответили. Музыку убавьте.»"];
    if(typeof etherLine==="function")for(let i=0;i<3;i++)etherLine(who[i],["лоцман","буксир","соседний борт"][i]);
    line="СИРЕНА · вам ответили все";
  }else if(k==="survey"){
    const L=(typeof farDeposits==="function")?farDeposits(G.sx,G.sy):[];
    const r=(typeof farReadLine==="function")?farReadLine(L):"";
    line="ПРОЖЕКТОР · "+(r||"дальнего нет — только обычная руда");
    logAdd("tech",line);
  }else line="ФОРСАЖ · тяга ×1.6";
  ABIL_ST.k=k;ABIL_ST.on=G.t+A.dur*60;ABIL_ST.cd=G.t+A.cd*60;ABIL_ST.text=line;
  say(line,Math.min(240,A.dur*60+60));
  return true;
}
/* долгое нажатие: зовёт петля системы после предложений ДЕЙСТВИЯ */
let ABIL_KEY=false;
function abilTick(){
  if(keys.abil&&!ABIL_KEY)abilFire();ABIL_KEY=!!keys.abil;   /* клавиша V */
  abilPadRim();
  if(actEdge)ABIL_ST.armed=!(typeof cueLvl==="function"&&cueLvl()===CUE_ACT),ABIL_ST.fired=false;
  if(!keys.act){ABIL_ST.armed=false;return;}
  if(ABIL_ST.armed&&!ABIL_ST.fired&&typeof actPressT==="number"&&now()-actPressT>=ABIL_HOLD){
    ABIL_ST.fired=true;abilFire();
  }
}
/* обод кнопки ДЕЙСТВИЕ: перезарядка — дуга, готово — ровный круг */
let ABIL_BTN;
function abilPadRim(){
  /* кнопку ищем один раз: кадр не читает DOM (15d-domread) */
  if(ABIL_BTN===undefined)ABIL_BTN=(typeof document!=="undefined"&&document.querySelector)?document.querySelector('.pads button[data-k="act"]'):null;
  const b=ABIL_BTN;
  if(!b)return;
  const f=abilReady01(),deg=Math.round(f*360);
  /* D21: кольцо толще и с яркой головкой у конца дуги; готово — имя над кнопкой */
  const v=f>=1?"":"conic-gradient(rgba(242,178,92,.75) "+Math.max(0,deg-8)+"deg, #ffd9a0 "+deg+"deg, transparent 0)";
  if(b.dataset.rim!==v){b.dataset.rim=v;b.style.setProperty("--abil",v||"none");b.classList.toggle("abil-cd",f<1);
    const ok=f>=1&&G.mode==="system";b.classList.toggle("abil-ok",ok);if(ok)b.dataset.abil="ДОЛГОЕ · "+abilOf().ru;}
}
function drawAbil(zx,zy){
  /* D21: у каждой системы своё видимое (ФОРСАЖ — факел в trailStep) */
  if(abilOn("yacht")){   /* СИРЕНА: два расходящихся кольца */
    const x=zx(G.ship.x),y=zy(G.ship.y),u=1-(ABIL_ST.on-G.t)/(ABIL.yacht.dur*60);
    ctx.save();ctx.globalCompositeOperation="lighter";
    for(const k of [0,.5]){const uu=(u+k)%1;ctx.strokeStyle="rgba(255,190,110,"+(.6*(1-uu)).toFixed(2)+")";ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(x,y,20+uu*260,0,TAU);ctx.stroke();}
    ctx.restore();
  }
  if(abilOn("courier")&&ABIL_ST.crate){   /* СБРОС: ящик остаётся там, где выброшен */
    const x=zx(ABIL_ST.crate.x),y=zy(ABIL_ST.crate.y),s=shipZ(G.zoom);
    ctx.save();ctx.translate(x,y);ctx.rotate(ABIL_ST.crate.a+G.t*.01);ctx.scale(s,s);
    ctx.fillStyle="#6a5a3c";ctx.fillRect(-6,-5,12,10);ctx.strokeStyle="rgba(0,0,0,.5)";ctx.lineWidth=1;ctx.strokeRect(-6,-5,12,10);
    ctx.strokeStyle="rgba(255,214,150,.7)";ctx.beginPath();ctx.moveTo(-6,0);ctx.lineTo(6,0);ctx.moveTo(0,-5);ctx.lineTo(0,5);ctx.stroke();
    ctx.restore();
  }
  if(ABIL_ST.k==="miner"&&abilOn("miner")&&ABIL_ST.beam){
    ctx.save();ctx.globalCompositeOperation="lighter";ctx.strokeStyle="rgba(255,190,110,.85)";ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(zx(G.ship.x),zy(G.ship.y));ctx.lineTo(zx(ABIL_ST.beam.x),zy(ABIL_ST.beam.y));ctx.stroke();ctx.restore();
  }
  if(abilOn("survey")){
    const a=G.ship.a,x=zx(G.ship.x),y=zy(G.ship.y),L=Math.max(W,H);
    const g=ctx.createRadialGradient(x,y,0,x,y,L*.6);g.addColorStop(0,"rgba(200,230,255,.10)");g.addColorStop(1,"rgba(200,230,255,0)");
    ctx.save();ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x,y);ctx.arc(x,y,L*.6,a-.35,a+.35);ctx.closePath();ctx.fill();ctx.restore();
  }
}
