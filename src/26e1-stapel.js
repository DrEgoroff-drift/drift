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
/* ── характер шести верфей (M480, shipyard §4) — только на заказанных корпусах:
   каталог и старые сейвы не трогаются. Встроенное / ограничение / привычка. */
const STAPEL_YARD={
  gt:{hull:1.25,thr:.93,note:"бронепояс +25 % корпуса, тяжелее на 8 % · по борту «ПЛАН — ЗАКОН», не смывается"},
  co:{price:.85,note:"на 15 % дешевле · по вашему борту бежит строка рекламы, клетка оплачена"},
  or:{hull:1.08,turn:.96,note:"носовая броня даром · чертёж по норме: ни одна клетка не повёрнута"},
  km:{cargo:.85,turn:1.06,lunch:1,note:"поворот мягче, клеток на 15 % меньше · «так красивее» — изгиб, которого вы не заказывали"},
  ra:{cargo:1.1,note:"приварят лишний отсек (+10 % трюма) · корпус держит бой: «на соплях, но держит»"},
  hf:{hull:.85,fuel:1.08,note:"прибор даром, корпус на 15 % тоньше · прошивка обновляется сама"}
};
function stapelYard(by){return STAPEL_YARD[by]||{};}
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
  const Y=stapelYard(o.by),m=k=>Y[k]||1;
  const price=Math.round(clamp(power*7000*Z.price*STAPEL_MARKUP*m("price")-4000,1500,260000)/50)*50;
  /* характер верфи — поверх коридора: ради него и летят к державе */
  return {thr:+(thr*m("thr")).toFixed(2),turn:+(turn*m("turn")).toFixed(2),fuel:Math.round(fuel*m("fuel")),
    cargo:Math.round(cargo*m("cargo")),hull:Math.round(hull*m("hull")),price};
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
  const why=stapelClosedWhy(by);if(why){say(why,120);return false;}
  const N=stapelStats(Object.assign({},o,{by}));
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
/* Коммуна: стапель стоит в обед и в забастовку */
function stapelClosedWhy(by){
  if(!stapelYard(by).lunch)return null;
  if(typeof socStrikeHere==="function"&&socStrikeHere())return "ЗАБАСТОВКА · СТАПЕЛЬ СТОИТ";
  if(typeof lawLunch==="function"&&lawLunch())return "ОБЕД · СТАПЕЛЬ С 14:00";
  return null;
}
function stapelReady(){const o=stapelAll().o;return !!(o&&now()>=o.ready);}
/* раз в минуту: готово — строка в почте, один раз */
function stapelTick(){
  const o=stapelAll().o;
  if(!o||o.told||now()<o.ready)return;
  o.told=1;
  logAdd("good","ПОЧТА · извещение: корпус со стапеля «"+o.st+"» ("+o.sx+":"+o.sy+") — получить в окне Космопочты на любой станции или на самом стапеле · хранится "+(typeof KP_KEEP==="number"?KP_KEEP:30)+" сут.");
}
/* забрать на той же верфи */
function stapelCollect(viaPost){
  const S=stapelAll(),o=S.o;
  if(!o||!stapelReady()||!G.st)return null;
  /* с почты (M492) — в любом окне; без неё — на той же верфи */
  if(!viaPost&&(G.sx!==o.sx||G.sy!==o.sy||G.st.stype!=="yard"))return null;
  S.done.push(o);S.o=null;
  const id=stapelId(o),sh=stapelShip(o);
  G.uniqueShips[id]=sh;G.owned[id]=true;
  if(typeof regBought==="function")regBought(id,o.by);   /* чужой стапель — транзитные номера (M513) */
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
function stapelSheetW(){return Math.max(260,Math.min(520,((typeof $body!=="undefined"&&$body&&$body.clientWidth)||420)-28));}
function stapelBlock(){
  const by=stapelYardBy(),S=stapelAll();
  const box=document.createElement("div");box.className="stapel";
  if(!by&&!S.o)return null;
  box.appendChild(el("div","sec","СТАПЕЛЬ"+(by?" · "+makerRu(by).toUpperCase()+" · КОРПУС ПО ЗАКАЗУ":"")));
  const sw=stapelSheetW(),sh=Math.round(sw*.46);
  /* заказ в работе: на листе он обшит на долю смены, готовый — под штампом */
  if(S.o){
    const o=S.o,here=G.sx===o.sx&&G.sy===o.sy,rd=stapelReady();
    const pv=el("div","stp-pv");
    pv.appendChild(stapelSheet(o,sw,sh,{prog:rd?1:1-(o.ready-now())/HOLD_SHIFT,ready:rd}));
    box.appendChild(pv);
    const r=el("div","row");
    if(rd&&here){
      r.appendChild(el("div","nm","<b>Заказ готов</b><s>"+HULL_CLASS[o.cls].ru+" · "+STAPEL_SIZE[o.size].ru+" · стапель "+makerRu(o.by)+"</s>"));
      const b=el("button","act gold","ЗАБРАТЬ");
      b.onclick=()=>{const id=stapelCollect();if(id){stapelFx(o.by,shipData(id).ru);renderTab();saveGame(true);}};
      r.appendChild(b);
    }else{
      const left=Math.max(0,Math.ceil((o.ready-now())/60000));
      r.appendChild(el("div","nm","<b>На стапеле: "+HULL_CLASS[o.cls].ru+" · "+STAPEL_SIZE[o.size].ru+"</b><s>"+
        (rd?"готов · забрать на «"+o.st+"», сектор "+o.sx+":"+o.sy:"обшивка "+Math.round(100*(1-(o.ready-now())/HOLD_SHIFT))+" % · ещё "+left+" мин · «"+o.st+"»")+
        " · второй заказ — после этого</s>"));
    }
    box.appendChild(r);
    return box;
  }
  const U=STAPEL_UI,o=()=>({by,cls:U.cls,size:U.size,l:U.l,w:U.w});
  const pv=el("div","stp-pv"),nums=el("div","stp-nums"),buy=el("button","act gold stp-buy","");
  const val={};
  const redraw=()=>{
    pv.innerHTML="";pv.appendChild(stapelSheet(o(),sw,sh));
    const m=stapelSheet.last||{};
    if(val.l)val.l.textContent=m.l+" м";
    if(val.w)val.w.textContent=m.b+" м";
    const N=stapelStats(o());
    nums.innerHTML="";nums.appendChild(stapelDelta(N,U.cls));
    buy.textContent="ЗАКАЗАТЬ · "+N.price.toLocaleString("ru")+" КР";
    buy.disabled=G.credits<N.price;
  };
  const chips=(keys,ru,cur,set,cls)=>{
    const d=el("div","stp-ch"+(cls?" "+cls:""));
    for(const k of keys){const b=el("button","chip"+(cur()===k?" on":""),ru(k));
      b.onclick=()=>{set(k);d.querySelectorAll(".chip").forEach(x=>x.classList.remove("on"));b.classList.add("on");redraw();};
      d.appendChild(b);}
    return d;
  };
  box.appendChild(el("div","stp-n",stapelYard(by).note||""));
  const shut=stapelClosedWhy(by);
  if(shut){box.appendChild(el("div","stp-n",shut+" · приходите позже"));return box;}
  box.appendChild(chips(Object.keys(HULL_CLASS),k=>HULL_CLASS[k].ru,()=>U.cls,k=>U.cls=k));
  box.appendChild(chips(STAPEL_SIZES,k=>STAPEL_SIZE[k].ru,()=>U.size,k=>U.size=k,"stp-seg"));
  box.appendChild(pv);
  /* ползунки — масштабные линейки: самшит, риски, визир с красной нитью */
  const slider=(ru,key)=>{
    const d=el("label","stp-sl","<span>"+ru+"</span>");
    const i=document.createElement("input");i.type="range";i.min=STAPEL_L[0];i.max=STAPEL_L[1];i.step=.01;i.value=U[key];
    i.oninput=()=>{U[key]=+i.value;redraw();};
    d.appendChild(i);val[key]=el("b","","");d.appendChild(val[key]);return d;
  };
  box.appendChild(slider("длина","l"));
  box.appendChild(slider("ширина","w"));
  box.appendChild(nums);
  buy.onclick=()=>{if(stapelOrder(o())){say("Заказ принят\nготов через смену",140);renderTab();saveGame(true);}};
  box.appendChild(buy);
  redraw();
  return box;
}
