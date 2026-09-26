/* ══════════════ гарантия / техподдержка / изолента (M495, DESIGN-birchpunk §4.1) ══════════════
   У фирменного прибора («Сирин», «Веха» — тонкая работа за большие деньги)
   есть гарантия: двенадцать смен со дня покупки. Разбило гнездо — три дороги:
     ТЕХПОДДЕРЖКА — звонок в эфир: «ваш звонок очень важен для нас», номер в
       очереди тает по игровому времени (37 → … и однажды обратно к 41), через
       одну-три смены прибор как новый, даром; пока ждёте — слепы по каналу;
     ИЗОЛЕНТА — сейчас, до половины, и «гарантия аннулирована: обнаружены
       следы изоленты»;
     ВЕРФЬ — как положено, за деньги (instrFix, 05b).
   На приборе: u.wr — конец гарантии (now, мс), u.tp — след изоленты,
   u.ts — заявка в поддержку {q, t0, until}. */
const WARRANTY_SHIFTS=12,WARRANTY_WORKS={sirin:1,vekha:1};
function warrantyShift(){return (typeof HOLD_SHIFT==="number")?HOLD_SHIFT:1200000;}
function warrantyOn(u){return !!(u&&u.wr&&!u.tp&&now()<u.wr)&&!warrantyRegVoid();}
/* утильсбор (M513): пока корпус на транзитных номерах, чужая гарантия аннулирована */
function warrantyRegVoid(){return typeof regPending==="function"&&regPending(G.shipId);}
function warrantyGive(u){if(u&&WARRANTY_WORKS[u.w])u.wr=now()+WARRANTY_SHIFTS*warrantyShift();}
function instrBroken(u){return !!(u&&(u.wear||0)>=.85);}
/* звонок в поддержку */
function supportCall(id){
  const u=instrUnit(id);if(!instrBroken(u)||!warrantyOn(u)||u.ts)return false;
  const until=now()+(1+Math.floor(rnd()*3))*warrantyShift();
  u.ts={q:37,t0:now(),until};
  etherLine("Ваш звонок очень важен для нас. Вы — тридцать седьмой в очереди. ♪ ♪ ♪","Техподдержка");
  holdBar();
  return true;
}
/* номер в очереди: тает с временем, а один раз посередине — назад к 41 */
function supportQueue(u){
  if(!u||!u.ts)return 0;
  const f=clamp((now()-u.ts.t0)/Math.max(1,u.ts.until-u.ts.t0),0,1);
  if(f>.45&&f<.52)return 41;
  return Math.max(1,Math.round(37*(1-f)));
}
function supportTick(){
  const K=instrKit();
  failTick(K);
  for(const id in K){const u=K[id];
    if(u.ts&&now()>=u.ts.until){
      u.ts=null;u.wear=0;
      etherLine("Ваша заявка решена. Прибор «"+(INSTR_BY_ID[id]?INSTR_BY_ID[id].ru:id)+"» восстановлен. Оцените нашу работу от одного до одного.","Техподдержка");
    }
  }
}
/* изолента на прибор: сейчас, до половины, гарантии конец */
/* кулибин (M486) мотает даром и так, что не видно: гарантия цела */
function instrTapeCan(){return typeof tapeRolls==="function"&&(tapeRolls()>0||(typeof tapeFree==="function"&&tapeFree()));}
function instrTape(id){
  const u=instrUnit(id);
  if(!instrBroken(u)||!instrTapeCan())return false;
  const K=(typeof kulibAny==="function")?kulibAny():null;
  if(!K)G.tapeRoll=tapeRolls()-1;
  u.wear=.5;u.ts=null;
  const had=warrantyOn(u);if(!K)u.tp=1;
  G.tapes=G.tapes||{};G.tapes[G.shipId]=Math.min(TAPE_MAX,tapesOf()+1);   /* полоса видна на корпусе */
  logAdd("tech","«"+(INSTR_BY_ID[id]?INSTR_BY_ID[id].ru:id)+"» замотан изолентой · работает вполсилы"+
    (K?" · кулибин "+K.name+": «так замотаю, что не видно»"+(had?" · гарантия цела":""):had?" · гарантия аннулирована: обнаружены следы изоленты":""));
  return true;
}
/* строки для ОПИСИ: разбитые приборы и их три дороги */
function warrantyBlock(){
  const K=instrKit(),box=document.createElement("div");
  const broken=Object.keys(K).filter(id=>instrBroken(K[id]));
  if(!broken.length)return null;
  box.className="op-tape";
  box.innerHTML="<h4>РАЗБИТЫЕ ПРИБОРЫ<s>"+broken.length+"</s></h4>";
  for(const id of broken){
    const u=K[id],nm=INSTR_BY_ID[id]?INSTR_BY_ID[id].ru:id;
    const row=document.createElement("div");row.className="op-wr";
    const st=u.ts?"в очереди поддержки · № "+supportQueue(u):warrantyOn(u)?"на гарантии":u.tp?"гарантия аннулирована":warrantyRegVoid()&&u.wr&&now()<u.wr?"гарантия аннулирована: корпус не на учёте":"без гарантии";
    row.innerHTML="<b>"+nm+"</b><s>"+st+"</s>";
    if(warrantyOn(u)&&!u.ts){const b=document.createElement("button");b.className="act";b.textContent="ТЕХПОДДЕРЖКА · ДАРОМ, ЖДАТЬ";
      b.onclick=()=>{supportCall(id);if(typeof opisRerender==="function")opisRerender();};row.appendChild(b);}
    if(instrTapeCan()){const b=document.createElement("button");b.className="act";b.textContent="ИЗОЛЕНТА · СЕЙЧАС, ВПОЛСИЛЫ";
      b.onclick=()=>{instrTape(id);if(typeof opisRerender==="function")opisRerender();};row.appendChild(b);}
    box.appendChild(row);
  }
  return box;
}
/* ── такт музыки ожидания: восемь квадратных нот, бодрых и чуть фальшивых — одна
   фраза на звонок, по шине музыки, чтобы ползунок громкости её тоже слушал ── */
const HOLD_BAR=[0,4,7,4,5,2,-1,0];   /* полутоны от до; последняя — на четверть тона ниже */
function holdBar(){
  if(typeof SND==="undefined"||!SND.ready||!SND.ctx||(typeof audioOn==="function"&&!audioOn()))return false;
  const c=SND.ctx,t0=c.currentTime+.05;
  HOLD_BAR.forEach((n,i)=>{
    const o=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter();
    o.type="square";o.frequency.value=261.6*Math.pow(2,(n-(i===7?.25:0))/12);
    f.type="lowpass";f.frequency.value=1400;   /* телефонная трубка */
    const w=t0+i*.22;
    g.gain.setValueAtTime(.0001,w);g.gain.exponentialRampToValueAtTime(.06,w+.02);
    g.gain.exponentialRampToValueAtTime(.0001,w+.2);
    o.connect(f);f.connect(g);g.connect(SND.music||SND.master);o.start(w);o.stop(w+.22);
  });
  return true;
}
/* ── отказ фирменных частей (M495): тонкая работа ломается сама. Раз в смену
   каждый фирменный прибор тянет жребий от своего зерна и номера смены — на
   гарантии редко (8 %), а в две смены после её конца часто (35 %): «гарантия
   кончилась вчера, прибор — сегодня». u.fk — последняя разыгранная смена ── */
const FAIL_IN=8,FAIL_AFTER=35,FAIL_AFTER_SHIFTS=2;
function failShift(){return Math.floor(now()/warrantyShift());}
function failRoll(u,k){return (hashi(u.s|0,k,0xFA11)>>>0)%100;}
function failTick(K){
  const k=failShift();
  for(const id in K){const u=K[id];
    if(!WARRANTY_WORKS[u.w]||!u.wr||u.fk===k)continue;
    u.fk=k;
    if(instrBroken(u)||u.ts)continue;
    const after=now()>=u.wr,late=after&&now()<u.wr+FAIL_AFTER_SHIFTS*warrantyShift();
    if(after&&!late)continue;
    if(failRoll(u,k)>=(late?FAIL_AFTER:FAIL_IN))continue;
    u.wear=1;
    const nm=INSTR_BY_ID[id]?INSTR_BY_ID[id].ru:id;
    if(late)logAdd("warn","«"+nm+"» отказал · гарантия кончилась вчера, прибор — сегодня");
    else logAdd("warn","«"+nm+"» отказал · на гарантии ещё "+Math.ceil((u.wr-now())/warrantyShift())+" смен · ТЕХПОДДЕРЖКА в ОПИСИ");
    if(typeof say==="function")say(nm+"\nотказал",120);
  }
}
/* ── шов старого мастера (M495): на станциях Рассвета и Коммуны кое-где сидит
   старый мастер. Замотанный прибор он перешивает даром — «изоленту вашу я
   оставлю, она тут уже несущая». Гарантию это не вернёт; раз в смену на прибор ── */
function oldMasterHere(){
  if(G.mode!=="dock"||typeof stampOwnerAt!=="function")return false;
  const by=stampOwnerAt(G.sx,G.sy);
  if(by!=="ra"&&by!=="km")return false;
  const sys=getSystem(G.sx,G.sy);
  return !!sys&&(hashi(sys.seed|0,0x01D,5)%3)===0;
}
function oldMasterCan(u){return oldMasterHere()&&!!u&&!!u.tp&&(u.wear||0)>.2&&u.om!==failShift();}
function oldMasterSeam(id){
  const u=instrUnit(id);if(!oldMasterCan(u))return false;
  u.wear=.15;u.om=failShift();
  logAdd("tech","Старый мастер перешил «"+(INSTR_BY_ID[id]?INSTR_BY_ID[id].ru:id)+"» · даром · «изоленту вашу я оставлю, она тут уже несущая»");
  return true;
}
