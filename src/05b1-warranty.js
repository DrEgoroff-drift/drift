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
function warrantyOn(u){return !!(u&&u.wr&&!u.tp&&now()<u.wr);}
function warrantyGive(u){if(u&&WARRANTY_WORKS[u.w])u.wr=now()+WARRANTY_SHIFTS*warrantyShift();}
function instrBroken(u){return !!(u&&(u.wear||0)>=.85);}
/* звонок в поддержку */
function supportCall(id){
  const u=instrUnit(id);if(!instrBroken(u)||!warrantyOn(u)||u.ts)return false;
  const until=now()+(1+Math.floor(rnd()*3))*warrantyShift();
  u.ts={q:37,t0:now(),until};
  etherLine("Ваш звонок очень важен для нас. Вы — тридцать седьмой в очереди. ♪ ♪ ♪","Техподдержка");
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
  for(const id in K){const u=K[id];
    if(u.ts&&now()>=u.ts.until){
      u.ts=null;u.wear=0;
      etherLine("Ваша заявка решена. Прибор «"+(INSTR_BY_ID[id]?INSTR_BY_ID[id].ru:id)+"» восстановлен. Оцените нашу работу от одного до одного.","Техподдержка");
    }
  }
}
/* изолента на прибор: сейчас, до половины, гарантии конец */
function instrTape(id){
  const u=instrUnit(id);
  if(!instrBroken(u)||typeof tapeRolls!=="function"||tapeRolls()<=0)return false;
  G.tapeRoll=tapeRolls()-1;u.wear=.5;
  const had=warrantyOn(u);u.tp=1;u.ts=null;
  logAdd("tech","«"+(INSTR_BY_ID[id]?INSTR_BY_ID[id].ru:id)+"» замотан изолентой · работает вполсилы"+(had?" · гарантия аннулирована: обнаружены следы изоленты":""));
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
    const st=u.ts?"в очереди поддержки · № "+supportQueue(u):warrantyOn(u)?"на гарантии":u.tp?"гарантия аннулирована":"без гарантии";
    row.innerHTML="<b>"+nm+"</b><s>"+st+"</s>";
    if(warrantyOn(u)&&!u.ts){const b=document.createElement("button");b.className="act";b.textContent="ТЕХПОДДЕРЖКА · ДАРОМ, ЖДАТЬ";
      b.onclick=()=>{supportCall(id);if(typeof opisRerender==="function")opisRerender();};row.appendChild(b);}
    if(typeof tapeRolls==="function"&&tapeRolls()>0){const b=document.createElement("button");b.className="act";b.textContent="ИЗОЛЕНТА · СЕЙЧАС, ВПОЛСИЛЫ";
      b.onclick=()=>{instrTape(id);if(typeof opisRerender==="function")opisRerender();};row.appendChild(b);}
    box.appendChild(row);
  }
  return box;
}
