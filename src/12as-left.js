/* ══════════════ оставленное (M377, §11.3) ══════════════
   Death Stranding на условиях открытки: **ни имён, ни текста, в одну сторону,
   без ответа**. Вы не дарите — вы ОСТАВЛЯЕТЕ. Кто нашёл, тот нашёл.

   Из этого следует всё остальное. Нет адресата — нет обмена, нет рынка, нет
   попрошаек и нет «продай мне за реал». Взятое приходит СТЁРТЫМ на тир и без
   одного аффикса: отдать хорошее — потеря настоящая, найти хорошее — подарок
   настоящий, а размножить нельзя. Единственный обратный канал — благодарность,
   и это ЧИСЛО в чужой трудовой книжке, а не слово.

   Призраки живут в тех же строках: там, где кто-то не дошёл, висит полупрозрачный
   след корпуса. Никакой live-многопользовательности при этом нет — только
   строки на сервере и семя, из которого корпус рисуется тем же генератором.

   Числа §11.5: пять записей на систему, три на борт в сутки, две находки в
   сводку, десять сводок жизни. Считает их сервер (`site/war.php`), клиент их
   только показывает — иначе они были бы пожеланием, а не правилом. */
const LEFT_RU={gun:"ствол",ammo:"кассета",fuel:"канистра",sign:"знак",tow:"трос",ghost:"след"};
const LEFT_SIGNS=["здесь пираты","здесь безопасно","здесь дерелик"];
let LEFT_CACHE=null,LEFT_BUSY=0;
function leftKey(){return (G.sx|0)+","+(G.sy|0);}
function leftCall(a,body){
  if(typeof warCall!=="function")return Promise.resolve(null);
  return warCall(a,body).catch(()=>null);
}
/* ── что лежит здесь ──
   Спрашиваем раз на систему и на сводку: строки живут десять сводок, чаще
   спрашивать незачем, а лишний запрос на каждом кадре — это уже не игра. */
function leftHere(force){
  const k=leftKey(),N=(typeof chronNow==="function")?chronNow():0;
  if(!force&&LEFT_CACHE&&LEFT_CACHE.k===k&&LEFT_CACHE.N===N)return Promise.resolve(LEFT_CACHE.rows);
  if(LEFT_BUSY)return Promise.resolve((LEFT_CACHE&&LEFT_CACHE.rows)||[]);
  LEFT_BUSY=1;
  return leftCall("here",{sys:k}).then(r=>{
    LEFT_BUSY=0;
    const rows=(r&&r.ok&&Array.isArray(r.rows))?r.rows:[];
    LEFT_CACHE={k,N,rows};
    return rows;
  });
}
function leftRows(){return (LEFT_CACHE&&LEFT_CACHE.k===leftKey())?LEFT_CACHE.rows:[];}
/* где именно лежит запись: место считается от её же семени, значит у всех
   одинаково и не хранится нигде */
function leftPos(row,i){
  const r=rng(hashi(row.s|0,i*977+3,0x1EF7));
  const a=r()*TAU,rad=900+r()*1400;
  return {x:Math.cos(a)*rad,y:Math.sin(a)*rad};
}
/* ── оставить ──
   Вещь уходит из трюма насовсем. Ответ сервера говорит, сколько ещё можно
   оставить сегодня; отказ — это не ошибка игры, а правило §11.3. */
function leftLeave(kind,part){
  const k=leftKey();
  const seed=part?(part.seed>>>0):(hashi(G.sx|0,G.sy|0,Date.now()&1023));
  const tier=part?(part.tier|0):1;
  return leftCall("left",{sys:k,kind,seed,tier}).then(r=>{
    if(!r||!r.ok){say((r&&r.error)?r.error.toUpperCase():"ОСТАВИТЬ НЕ ВЫШЛО",120);return false;}
    if(part&&Array.isArray(G.inv)){
      const i=G.inv.indexOf(part);
      if(i>=0)G.inv.splice(i,1);
      if(typeof invalidateParts==="function")invalidateParts();
    }
    LEFT_CACHE=null;
    say("ОСТАВЛЕНО · "+(LEFT_RU[kind]||kind).toUpperCase(),140);
    logAdd("tech","Оставлено в секторе "+k+": "+(LEFT_RU[kind]||kind)+
      " · кто найдёт, тот найдёт");
    return true;
  });
}
/* ── взять копию ──
   Копия, а не вещь: строка остаётся лежать до своего срока. Стирание считает
   клиент — тир вниз и один аффикс долой. */
function leftWorn(row){
  if(!row||row.k!=="gun")return null;
  const t=Math.max(1,(row.t|0)-1);
  const p=genPart(row.s>>>0,t,"gun");
  if(p&&p.aff&&p.aff.length>1){
    p.aff.pop();
    p.bonus={};
    for(const x of p.aff)p.bonus[x.k]=(p.bonus[x.k]||0)+x.v;
    p.bonus.gun=1;
  }
  if(p)p.worn=1;
  return p;
}
function leftTake(i){
  const k=leftKey();
  return leftCall("take",{sys:k,i}).then(r=>{
    if(!r||!r.ok){say((r&&r.error)?r.error.toUpperCase():"ВЗЯТЬ НЕ ВЫШЛО",120);return false;}
    const row=r.row||{};
    if(row.k==="gun"){
      const p=leftWorn(row);
      if(p&&typeof addPart==="function"){
        addPart(p);
        tell("kill","Найдено оставленное: "+p.name,"НАЙДЕНО\n"+p.name+"\nкопия стёрта на тир");
      }
    }else if(row.k==="ammo"){
      G.cargo.missile=(G.cargo.missile|0)+2;
      say("НАЙДЕНА КАССЕТА · +2",140);
    }else if(row.k==="fuel"){
      const st=stat();
      G.fuel=Math.min(st.fuelMax,G.fuel+st.fuelMax*.25);
      say("НАЙДЕНА КАНИСТРА",140);
    }else{
      say("ЗНАК ПРОЧИТАН",120);
    }
    LEFT_CACHE=null;
    return true;
  });
}
/* благодарность: одна кнопка, и она не пишет ни слова */
function leftThank(i){
  return leftCall("thank",{sys:leftKey(),i}).then(r=>{
    if(r&&r.ok){say("ОБЪЯВЛЕНА БЛАГОДАРНОСТЬ",120);LEFT_CACHE=null;return true;}
    return false;
  });
}
function leftThanksMine(){
  return leftCall("thanks",{}).then(r=>(r&&r.ok)?(r.n|0):0);
}
/* ── призрак ──
   Там, где кто-то не дошёл, остаётся след его корпуса. Оставляется он один раз
   и не игроком, а его гибелью — поэтому и читается иначе, чем канистра. */
function leftGhost(){
  if(typeof warTok!=="function"||!warTok())return;
  const S=shipData(G.shipId);
  leftCall("left",{sys:leftKey(),kind:"ghost",seed:(S&&S.seed)|0,tier:1});
}
/* ── что видно в системе ── */
function leftDraw(zx,zy,Z){
  const rows=leftRows();
  if(!rows.length)return;
  rows.forEach((row,i)=>{
    const p=leftPos(row,i);
    const x=zx(p.x),y=zy(p.y);
    if(x<-60||x>W+60||y<-60||y>H+60)return;
    if(row.k==="ghost"){
      /* след: тот же генератор корпусов, только полупрозрачный и без огней */
      ctx.save();
      ctx.globalAlpha=.22;
      ctx.translate(x,y);
      const z=clamp(Z,.4,1.6)*.8;
      ctx.scale(z,z);ctx.rotate(row.s%628/100);
      const id="gh"+row.s;
      if(!NPC_SHIPS[id])NPC_SHIPS[id]={name:id,seed:row.s>>>0,hcls:"scout",col:"#9fd8ff",
        hull:100,cargo:40,fuel:100,thr:1,cls:"след"};
      try{drawHull(id,false,false,0,0);}catch(e){}
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.strokeStyle="rgba(190,220,255,.75)";ctx.lineWidth=1;
    ctx.beginPath();ctx.rect(x-4*Z,y-4*Z,8*Z,8*Z);ctx.stroke();
    ctx.fillStyle="rgba(30,44,60,.85)";ctx.fill();
    ctx.fillStyle="rgba(190,220,255,.65)";
    ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
    ctx.fillText((LEFT_RU[row.k]||row.k).toUpperCase()+(row.ty?" · "+row.ty:""),x,y-8*Z);
    ctx.restore();
  });
}
/* ── подойти и взять ──
   ДЕЙСТВИЕ берёт копию, ЦЕЛЬ объявляет благодарность. Ни того, ни другого нельзя
   сделать чаще, чем позволяет §11.3, и говорит об этом сервер. */
function leftNear(sh){
  const rows=leftRows();
  let best=-1,bd=260;
  rows.forEach((row,i)=>{
    const p=leftPos(row,i);
    const d=Math.hypot(sh.x-p.x,sh.y-p.y);
    if(d<bd){bd=d;best=i;}
  });
  return best;
}
function leftInteract(sh,actEdge){
  if(G.mode!=="system")return false;
  leftHere();
  const i=leftNear(sh);
  if(i<0)return false;
  const row=leftRows()[i];
  if(row.k==="ghost"){
    G.prompt="СЛЕД ЧУЖОГО КОРПУСА\nЗДЕСЬ КТО-ТО НЕ ДОШЁЛ";
    return true;
  }
  G.prompt="ОСТАВЛЕНО: "+(LEFT_RU[row.k]||row.k).toUpperCase()+
    (row.ty?" · БЛАГОДАРНОСТЕЙ "+row.ty:"")+
    "\nДЕЙСТВИЕ — ВЗЯТЬ КОПИЮ · ЦЕЛЬ — БЛАГОДАРНОСТЬ";
  if(actEdge)leftTake(i);
  return true;
}
function leftThankNear(){
  const i=leftNear(G.ship);
  if(i<0)return false;
  const row=leftRows()[i];
  if(!row||row.k==="ghost")return false;
  leftThank(i);
  return true;
}
