/* ══════════════ СТАПЕЛЬ — заказ корпуса у державы (M481, DESIGN-shipyard §5) ══════════════
   Только на верфи державы в её земле: класс (семь HULL_CLASS) × размер
   (лёгкий / средний / тяжёлый) × два ползунка внутри грамматики изготовителя
   (длина, ширина). Генератор рисует корпус вживую, цена — на кнопке. Заказ
   готов через смену; строка «ПОЧТА» сообщает; забирают на той же верфи.
   В СЕЙВЕ — ТОЛЬКО ЗАКАЗ {by,cls,size,l,w,seed}: корпус и его числа каждый раз
   выводятся заново (stapelShip), в uniqueShips он не пишется (stapelStrip).
   Так характер держав доходит до игрока: хотите корпус Хай-Фронта — летите
   к Хай-Фронту. G.stapel = {o: заказ в работе | null, n, done: [заказы]}. */
const STAPEL_SIZE={
  light: {ru:"лёгкий", k:.18,len:.88,price:.78},
  medium:{ru:"средний",k:.50,len:1.00,price:1.00},
  heavy: {ru:"тяжёлый",k:.86,len:1.14,price:1.38}
};
const STAPEL_SIZES=["light","medium","heavy"],STAPEL_L=[.85,1.15],STAPEL_MARKUP=1.25;
function stapelAll(){
  const S=G.stapel||(G.stapel={});
  if(!Array.isArray(S.done))S.done=[];
  if(S.o===undefined)S.o=null;
  S.n=S.n|0;return S;
}
/* верфь здесь строит? — держава хозяйка земли, а станция — верфь */
function stapelYardBy(){
  if(!G.st||G.st.stype!=="yard")return null;
  const by=(typeof stampOwnerAt==="function")?stampOwnerAt(G.sx,G.sy):null;
  return (by&&HULL_MAKER[by])?by:null;
}
/* числа корпуса — из заказа, детерминированно: размер двигает всё вверх, но
   ход вниз; длина — ход и бак за счёт поворота; ширина — трюм и корпус за
   счёт поворота. Внутри коридора класса (FLEET_PROFILE), не выше его */
function stapelStats(o){
  const P=FLEET_PROFILE[o.cls]||FLEET_PROFILE.scout,Z=STAPEL_SIZE[o.size]||STAPEL_SIZE.medium;
  const sp=(a,k)=>a[0]+(a[1]-a[0])*clamp(k,0,1);
  const kl=(o.l-1)/(STAPEL_L[1]-STAPEL_L[0]),kw=(o.w-1)/(STAPEL_L[1]-STAPEL_L[0]),kz=Z.k;
  const thr=+sp(P.thr,.5-(kz-.5)*.8+kl*.5-kw*.2).toFixed(2);
  const turn=+sp(P.turn,.5-(kz-.5)*.8-kl*.4-kw*.4).toFixed(2);
  const fuel=Math.round(sp(P.fuel,kz+kl*.4));
  const cargo=Math.round(sp(P.cargo,kz+kw*.5));
  const hull=Math.round(sp(P.hull,kz+kw*.2));
  const power=(thr+turn)*.5+fuel/240+cargo/280+hull/250;
  const price=Math.round(clamp(power*7000*Z.price*STAPEL_MARKUP-4000,1500,260000)/50)*50;
  return {thr,turn,fuel,cargo,hull,price};
}
/* запись корабля из заказа — выводится, не хранится */
function stapelShip(o){
  const Z=STAPEL_SIZE[o.size]||STAPEL_SIZE.medium,N=stapelStats(o),r=rng(o.seed>>>0);
  const K=HULL_CLASS[o.cls]||HULL_CLASS.scout;
  return {ru:genName(r),cls:K.ru+" · "+Z.ru+" · заказ",hcls:o.cls,seed:o.seed>>>0,by:o.by,
    hl:o.l*Z.len,hw:o.w*(1+(Z.len-1)*.7),
    thr:N.thr,turn:N.turn,fuel:N.fuel,cargo:N.cargo,hull:N.hull,price:N.price,
    col:"#e8d6a8",unique:1,ordered:1,
    note:"сошёл со стапеля "+makerRu(o.by)+" по вашему заказу — «"+(o.st||"верфь")+"»"};
}
function stapelId(o){return "sp"+(o.no|0);}
/* сейв: заказанные корпуса в uniqueShips не пишем — они выводятся */
function stapelStrip(U){
  const out={};
  for(const k in U||{})if(!(U[k]&&U[k].ordered))out[k]=U[k];
  return out;
}
function stapelRestore(){
  const S=stapelAll();
  for(const o of S.done){const id=stapelId(o);G.uniqueShips[id]=stapelShip(o);}
}
/* заказ */
function stapelOrder(o){
  const S=stapelAll(),by=stapelYardBy();
  if(!by||S.o)return false;
  const N=stapelStats(o);
  if(G.credits<N.price){say("НЕ ХВАТАЕТ КРЕДИТОВ",60);return false;}
  G.credits-=N.price;
  S.n++;
  S.o={by,cls:o.cls,size:o.size,l:+o.l.toFixed(2),w:+o.w.toFixed(2),
    seed:hashi(G.sx,G.sy,(S.n*7919)^0x57A9)>>>0,no:S.n,
    sx:G.sx,sy:G.sy,st:G.st.name,ready:now()+HOLD_SHIFT,told:0};
  logAdd("money","Стапель "+makerRu(by)+": заказан "+HULL_CLASS[o.cls].ru+" · "+STAPEL_SIZE[o.size].ru+
    " за "+N.price.toLocaleString("ru")+" кр · готов через смену");
  return true;
}
function stapelReady(){const o=stapelAll().o;return !!(o&&now()>=o.ready);}
/* раз в минуту: готово — строка в почте, один раз */
function stapelTick(){
  const o=stapelAll().o;
  if(!o||o.told||now()<o.ready)return;
  o.told=1;
  logAdd("good","ПОЧТА · стапель «"+o.st+"» ("+o.sx+":"+o.sy+"): ваш корпус готов, заберите на верфи");
}
/* забрать на той же верфи */
function stapelCollect(){
  const S=stapelAll(),o=S.o;
  if(!o||!stapelReady()||G.sx!==o.sx||G.sy!==o.sy||!G.st||G.st.stype!=="yard")return null;
  S.done.push(o);S.o=null;
  const id=stapelId(o),sh=stapelShip(o);
  G.uniqueShips[id]=sh;G.owned[id]=true;
  logAdd("good","Со стапеля сошёл «"+sh.ru+"» — "+sh.cls+" · в ангаре");
  return id;
}
/* ── живой чертёж: временная запись, кэш корпуса сбрасываем на каждый сдвиг ── */
const STAPEL_PV="spPreview";
function stapelPreview(o,w,h){
  const S=stapelShip(Object.assign({seed:0x57A9,no:0},o));
  NPC_SHIPS[STAPEL_PV]=S;
  delete HULL_CACHE[STAPEL_PV+"!"+o.by];
  return shipThumb(STAPEL_PV,w,h);
}
let STAPEL_UI={cls:"scout",size:"medium",l:1,w:1};
function stapelBlock(){
  const by=stapelYardBy(),S=stapelAll();
  const box=document.createElement("div");box.className="stapel";
  if(!by&&!S.o)return null;
  box.appendChild(el("div","sec","СТАПЕЛЬ"+(by?" · "+makerRu(by).toUpperCase()+" · КОРПУС ПО ЗАКАЗУ":"")));
  /* заказ в работе */
  if(S.o){
    const o=S.o,here=G.sx===o.sx&&G.sy===o.sy;
    const r=el("div","row");
    if(stapelReady()&&here){
      r.appendChild(el("div","nm","<b>Заказ готов</b><s>"+HULL_CLASS[o.cls].ru+" · "+STAPEL_SIZE[o.size].ru+" · стапель "+makerRu(o.by)+"</s>"));
      const b=el("button","act gold","ЗАБРАТЬ");
      b.onclick=()=>{const id=stapelCollect();if(id){say("Корпус ваш\n«"+shipData(id).ru+"»",160);renderTab();saveGame(true);}};
      r.appendChild(b);
    }else{
      const left=Math.max(0,Math.ceil((o.ready-now())/60000));
      r.appendChild(el("div","nm","<b>На стапеле: "+HULL_CLASS[o.cls].ru+" · "+STAPEL_SIZE[o.size].ru+"</b><s>"+
        (stapelReady()?"готов · забрать на «"+o.st+"», сектор "+o.sx+":"+o.sy:"ещё "+left+" мин · «"+o.st+"»")+
        " · второй заказ — после этого</s>"));
    }
    box.appendChild(r);
    return box;
  }
  const U=STAPEL_UI,o=()=>({by,cls:U.cls,size:U.size,l:U.l,w:U.w});
  const pv=el("div","stp-pv"),nums=el("div","stp-n"),buy=el("button","act gold","");
  const redraw=()=>{
    pv.innerHTML="";pv.appendChild(stapelPreview(o(),280,120));
    const N=stapelStats(o());
    nums.innerHTML="тяга "+N.thr.toFixed(2)+" · поворот "+N.turn.toFixed(2)+" · трюм "+N.cargo+" · бак "+N.fuel+" · корпус "+N.hull;
    buy.textContent="ЗАКАЗАТЬ · "+N.price.toLocaleString("ru")+" КР";
    buy.disabled=G.credits<N.price;
  };
  const chips=(keys,ru,cur,set)=>{
    const d=el("div","stp-ch");
    for(const k of keys){const b=el("button","chip"+(cur()===k?" on":""),ru(k));
      b.onclick=()=>{set(k);d.querySelectorAll(".chip").forEach(x=>x.classList.remove("on"));b.classList.add("on");redraw();};
      d.appendChild(b);}
    return d;
  };
  box.appendChild(chips(Object.keys(HULL_CLASS),k=>HULL_CLASS[k].ru,()=>U.cls,k=>U.cls=k));
  box.appendChild(chips(STAPEL_SIZES,k=>STAPEL_SIZE[k].ru,()=>U.size,k=>U.size=k));
  box.appendChild(pv);
  const slider=(ru,key)=>{
    const d=el("label","stp-sl","<span>"+ru+"</span>");
    const i=document.createElement("input");i.type="range";i.min=STAPEL_L[0];i.max=STAPEL_L[1];i.step=.01;i.value=U[key];
    i.oninput=()=>{U[key]=+i.value;redraw();};
    d.appendChild(i);return d;
  };
  box.appendChild(slider("длина","l"));
  box.appendChild(slider("ширина","w"));
  box.appendChild(nums);
  buy.onclick=()=>{if(stapelOrder(o())){say("Заказ принят\nготов через смену",140);renderTab();saveGame(true);}};
  box.appendChild(buy);
  redraw();
  return box;
}
