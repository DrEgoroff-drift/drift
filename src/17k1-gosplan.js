/* ══════════════ госзаказ на билборде (M503, PLAN «new mechanics», st. 5) ══════════════
   У людной станции ГЛАВТРАССЫ щит через раз вместо цены соседа пишет ПЛАН:
   «ПЛАН: 40 ЕД. ОСМИЯ ДО СВОДКИ 118». Цена твёрдая, кто сдал — тот и молодец:
   сдать можно на самой станции (строка ГОСЗАКАЗ во вкладке торговли), в
   КНИЖКЕ — отметка «УДАРНИК», в журнале — «план выполнен на 103 %».
   План — из места и сводки (три смены), выполненный помнится (G.gosDone). */
const GOS_SHIFTS=3;
function gosBucket(){return Math.floor(now()/(HOLD_SHIFT*GOS_SHIFTS));}
function gosPlan(){
  const sys=G.sys;if(!sys||!sys.station)return null;
  const B=(typeof bbHere==="function")?bbHere():null;if(!B||B.by!=="gt")return null;
  const b=gosBucket(),h=hashi(G.sx,G.sy,b^0x6059);
  const pool=TRADE_KEYS.filter(k=>RES[k]&&!RES[k].pax&&k!=="folk").concat(typeof FAR_KEYS!=="undefined"?FAR_KEYS:[]);
  const k=pool[h%pool.length],far=!!(RES[k].far);
  const n=far?5+(h>>4)%16:20+(h>>4)%31;
  const price=Math.round(RES[k].price*(far?1.2:1.3));
  const key=G.sx+","+G.sy+","+b;
  return {k,n,price,key,svodka:100+b%900,done:!!(G.gosDone&&G.gosDone[key])};
}
function gosBbLine(){
  const P=gosPlan();if(!P||P.done)return null;
  return "ПЛАН: "+P.n+" ЕД. "+RES[P.k].ru.toUpperCase()+" ДО СВОДКИ "+P.svodka+" · ПО "+P.price+" КР · СДАВАТЬ ЗДЕСЬ";
}
function gosDeliver(){
  const P=gosPlan();if(!P||P.done)return false;
  if((G.cargo[P.k]|0)<P.n){say("Не хватает до плана\nнужно "+P.n+" ед.",90);return false;}
  G.cargo[P.k]-=P.n;
  earn(P.n*P.price,"plan");
  if(!G.gosDone)G.gosDone={};G.gosDone[P.key]=1;
  const R=(typeof recordAll==="function")?recordAll():null;if(R)R.udar=(R.udar|0)+1;
  const pct=101+hashi(G.sx,G.sy,gosBucket())%7;
  logAdd("good","Госзаказ сдан: "+RES[P.k].ru.toLowerCase()+" ×"+P.n+" · +"+(P.n*P.price).toLocaleString("ru")+" кр · КНИЖКА: «УДАРНИК»");
  logAdd("dim","Сводка "+P.svodka+": план по станции «"+G.st.name+"» выполнен на "+pct+" %");
  return true;
}
/* строка во вкладке торговли */
function gosRow(){
  const P=gosPlan();if(!P)return null;
  const r=el("div","row");
  r.appendChild(el("div","nm","<b>ГОСЗАКАЗ · "+RES[P.k].ru+" ×"+P.n+"</b><s>"+(P.done?"план по этой сводке выполнен — спасибо, товарищ":
    "цена твёрдая: "+P.price+" кр за ед. · до сводки "+P.svodka+" · в трюме "+(G.cargo[P.k]|0))+"</s>"));
  if(!P.done){const b=el("button","act gold","СДАТЬ · "+(P.n*P.price).toLocaleString("ru")+" КР");
    b.disabled=(G.cargo[P.k]|0)<P.n;b.onclick=()=>{if(gosDeliver())renderTab();};r.appendChild(b);}
  return r;
}
