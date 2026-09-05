/* ══════════════ одна клавиша, зажатая надолго (M354) ══════════════
   Фуззер (91zzzz) жмёт клавиши пачками и вразнобой — он ищет исключение.
   Здесь ищут другое, и другим способом: КАЖДУЮ клавишу поодиночке и подолгу,
   в каждой сцене. Так проверяются три вещи, которых случайные руки не видят:

   1. Режим и его состояние обязаны совпадать. `stepWorld` разбирает режим
      парами: `G.mode==="dig" && G.dig`. Если режим стал «шахта», а `G.dig`
      пуст — кадр не падает, он ПЕРЕСТАЁТ ДЕЛАТЬ ЧТО-ЛИБО: ни обновления, ни
      отрисовки, ни отклика на клавиши. Ровно так выглядит зависание, которое
      автор ловит вечерами (PLAN, «Systems»), и ни один набор до сих пор не
      проверял эту пару вовсе.
   2. Долгое удержание — не то же, что короткое. Тяга, зажатая на тысячу
      кадров, уводит корабль туда, где числа перестают быть числами.
   3. Числа, попадающие игроку на глаза, обязаны быть человеческими: «12.3456»,
      «-0» и «1e+21» — это не значения, это протечка формул в текст.

   Здесь же и третий закон: после любого удержания мир обязан оставаться
   пригодным к сохранению. */

const KEY_MODES={system:1,dock:1,barge:1,map:1,landing:1,surface:1,dig:1,cave:1,belt:1,
  scoop:1,base:1,raid:1,homein:1,winter:1,spa:1,wanderer:1,none:1};
/* пара «режим — его состояние»: пустое состояние при живом режиме = тихое зависание */
function keyStateOK(){
  const need={surface:"surf",landing:"land",dig:"dig",cave:"cave",belt:"belt",scoop:"scoop",
    base:"base",raid:"raid",homein:"hin",winter:"win",spa:"spa",wanderer:"wan"}[G.mode];
  if(!KEY_MODES[G.mode])return "неизвестный режим "+G.mode;
  if(need&&!G[need])return "режим "+G.mode+" без состояния G."+need;
  return "";
}
const KEY_ALL=["left","right","thrust","brake","act","fire","up","down"];

TEST_SUITES.push(() => suite("клавиши: каждая поодиночке и подолгу — в каждой сцене", () => {
  const bad=[],seen=[];
  for(const sc of lookScenes()){
    let set=true;
    try{ resetWorld(); set=sc.set()!==false; }catch(e){ bad.push(sc.id+" · сцена: "+e.message); continue; }
    if(!set||G.mode==="none")continue;
    const mode0=G.mode;
    seen.push(sc.id);
    for(const k of KEY_ALL){
      for(const kk in keys)keys[kk]=false;
      if(!(k in keys))continue;
      keys[k]=true;
      let died="";
      for(let i=0;i<70;i++){
        actEdge=(k==="act"&&i%17===0);
        try{ stepWorld(1); }catch(e){ died=e.message+" | "+String(e.stack||"").split("\n")[1]; break; }
        G.t+=1;
      }
      actEdge=false;
      if(died){ bad.push(sc.id+" · "+k+": "+died); break; }
      const sick=keyStateOK();
      if(sick){ bad.push(sc.id+"("+mode0+") · "+k+" → "+sick); break; }
      if(!Number.isFinite(G.ship.x)||!Number.isFinite(G.ship.y)||!Number.isFinite(G.fuel))
        { bad.push(sc.id+" · "+k+": число уплыло x="+G.ship.x+" y="+G.ship.y+" бак="+G.fuel); break; }
    }
    for(const kk in keys)keys[kk]=false;
  }
  resetWorld();
  ok(seen.length>=10,"сцен под клавишами: "+seen.length);
  eq(bad.slice(0,5).join(" ;; "),"","ни одна зажатая клавиша не уводит режим в пустоту"+
    (bad.length?" (всего "+bad.length+")":""));
}));

TEST_SUITES.push(() => suite("клавиши: тяга, зажатая на тысячу кадров, не уносит числа", () => {
  resetWorld();
  G.mode="system";G.fuel=100;
  for(const kk in keys)keys[kk]=false;
  keys.thrust=true;
  for(let i=0;i<1200;i++){ stepWorld(1); G.t+=1; }
  keys.thrust=false;
  const sp=Math.hypot(G.ship.vx,G.ship.vy),d=Math.hypot(G.ship.x,G.ship.y);
  ok(Number.isFinite(sp)&&Number.isFinite(d),"скорость и удаление — числа: "+sp+" / "+d);
  ok(sp<200,"скорость упирается в потолок, а не растёт вечно: "+sp.toFixed(2));
  ok(d<4e6,"корабль не улетел за пределы чисел: "+Math.round(d));
  ok(G.fuel>=0,"бак не ушёл в минус: "+G.fuel);
  eq(keyStateOK(),"","режим и состояние согласны после тысячи кадров тяги");
  /* и мир после этого ещё сохраняется */
  let js="";try{ js=JSON.stringify(snapshot()); }catch(e){ ok(false,"снимок после тяги: "+e.message); }
  ok(js.length>500,"снимок после тысячи кадров пишется");
  /* и назад: тормоз гасит, а не разгоняет в другую сторону навсегда */
  keys.brake=true;
  for(let i=0;i<600;i++){ stepWorld(1); G.t+=1; }
  keys.brake=false;
  const sp2=Math.hypot(G.ship.vx,G.ship.vy);
  ok(sp2<=sp+.01,"тормоз гасит скорость: "+sp.toFixed(2)+" → "+sp2.toFixed(2));
  resetWorld();
}));

TEST_SUITES.push(() => suite("числа на глазах: ни хвостов после точки, ни «-0», ни степеней", () => {
  /* «12.3456» — это формула, вылезшая в текст; «-0» — знак у нуля;
     «1e+21» — число, переставшее быть числом для человека */
  const DIRT=/-0(?![.,\d])|\d\.\d{3,}|\d+e[+-]?\d+/i;
  const bad=[];
  const look=(where,s)=>{
    s=String(s||"");
    const m=DIRT.exec(s);
    if(m)bad.push(where+": …"+s.slice(Math.max(0,m.index-28),m.index+28).replace(/\s+/g," "));
  };
  for(const sc of lookScenes()){
    let set=true;
    try{ resetWorld(); set=sc.set()!==false; }catch(e){ continue; }
    if(!set||G.mode==="none")continue;
    try{ e2eHands(sc.id.length+11,60,()=>stepWorld(1)); }catch(e){ continue; }
    look(sc.id+" · подсказка",G.prompt);
    look(sc.id+" · сообщение",G.msg);
    for(const row of G.log)look(sc.id+" · тетрадь",row.s);
  }
  /* и экраны прожитого мира: там чисел больше всего */
  resetWorld(); fuzzRich();
  for(const t of [...document.querySelectorAll("#tableTabs button")].map(b=>b.dataset.tab)){
    try{ tableTab=t; tableRender(); }catch(e){ continue; }
    const box=document.getElementById("tableBody");
    look("стол/"+t,box&&box.textContent);
  }
  tableTab="ether";
  if(G.sys.station){
    G.st=G.sys.station;G.mode="dock";
    for(const t of [...document.querySelectorAll("#stTabs button")].map(b=>b.dataset.tab)){
      try{ tab=t; renderTab(); }catch(e){ continue; }
      const box=document.getElementById("stBody");
      look("станция/"+t,box&&box.textContent);
    }
    tab="market";G.mode="system";G.st=null;
  }
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  resetWorld();
  eq(bad.slice(0,4).join(" ;; "),"","числа в тексте человеческие"+(bad.length?" (всего "+bad.length+")":""));
}));
