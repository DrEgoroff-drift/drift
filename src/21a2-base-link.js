/* ══════════════ СВЯЗЬ и мачта (M394, DESIGN-base §38, §45) ══════════════
   Автор: «можно посмотреть, из любого места, давай в дело». Экрана не будет —
   будет КАНАЛ НА ПРИЁМНИКЕ, тот же, на котором ловятся чужие мачты (11ap).

   Разница между «посмотреть» и «услышать» здесь и есть весь смысл вехи. Панель
   показала бы всё и всегда — и обесценила бы расстояние, радиста и мачту одним
   махом. Приёмник показывает СТОЛЬКО, СКОЛЬКО СЛЫШНО:

     рядом                 — цифры по всем шкалам и последние строки журнала;
     несколько секторов    — по слову на шкалу и одна строка;
     далеко или без мачты  — одно слово обо всей базе, и то сквозь треск;
     совсем далеко         — ничего. И это тоже сведение.

   Отсюда три вещи, которые веха даёт даром. Первая: по этому каналу СУДЯТ
   управляющего (§34) — сводка говорит одно, шкала другое, и разницу слышно.
   Вторая: база зовёт сама — встала, ушёл человек, был налёт, — и это решение
   в полёте, а не строка в панели. Третья: один приказ за сеанс связи, и качество
   сигнала решает, дотянется ли он.

   Мачта (§45) — модуль верхнего ряда: с ней база слышна по всему кругу, без неё
   — на три сектора. Ничего за ней не заперто: без мачты слышно плохо, а не
   никак. Это разница между «слышать» и «знать», и вся игра про неё же. */
const LINK_NEAR=3;           /* без мачты слышно на столько секторов */
const LINK_REACH=44;         /* с мачтой — практически по всему кругу */
const LINK_NUM=.75;          /* выше этого дают цифры */
const LINK_WORD=.45;         /* выше этого — по слову на шкалу */
const LINK_ANY=.2;           /* ниже этого — только треск */
function baseHasMast(B){
  if(!B||!B.cells)return false;
  for(const cell of B.cells)if(cell&&cell.hp>0&&cell.k==="mast")return true;
  return false;
}
/* позывной: две буквы и три цифры от адреса — тот же вид, что у чужих мачт,
   потому что это и есть мачта, только своя */
function baseCall(B){
  if(!B)return "БЗ-000";
  const h=hashi(B.sx*911+B.sy,(B.idx|0)*37+7,0x0BA5E)>>>0;
  return "БЗ-"+(100+h%900);
}
/* сила сигнала: расстояние, мачта, радист и то, жива ли база вообще */
function baseSignal(B,sx,sy){
  if(!B)return 0;
  sx=(sx===undefined)?G.sx:sx;sy=(sy===undefined)?G.sy:sy;
  const d=Math.hypot((B.sx|0)-sx,(B.sy|0)-sy);
  if(d<.5)return 1;
  const reach=baseHasMast(B)?LINK_REACH:LINK_NEAR;
  let q=clamp(1-d/(reach+1),0,1);
  /* радист (§8) вытягивает разборчивость — роль приходит с людьми в комнате,
     и до тех пор эта прибавка честно равна нулю */
  if(typeof baseRoleForce==="function")q+=clamp(baseRoleForce(B,"radist")*.25,0,.25);
  /* ретранслятор рядом со СЛУШАЮЩИМ чистит эфир и здесь (11ap) */
  if(typeof relayEar==="function")q+=relayEar(sx,sy);
  /* обесточенная база едва слышна: передатчик тоже висит на общей шине */
  const P=(typeof basePower==="function")?basePower(B):{eff:1};
  if(P.eff<=0)q*=.35;
  else if(P.eff<.5)q*=.7;
  return clamp(q,0,1);
}
function baseHear(B,sx,sy){
  const q=baseSignal(B,sx,sy);
  return q>=LINK_NUM?3:(q>=LINK_WORD?2:(q>=LINK_ANY?1:0));
}
/* ── по слову на шкалу ── */
function linkWord(v,warn,bad){return v<=bad?"нет":(v<=warn?"впритык":"есть");}
function baseWordLine(B){
  const L=baseLife(B),n=Math.max(1,baseCrewN(B));
  const out=["воздух — "+linkWord(L.air,n*LIFE_AIR*6,0),
             "вода — "+linkWord(L.water,n*LIFE_WATER*6,0),
             "харч — "+linkWord(L.food|0,n*LIFE_FOOD*6,0)];
  const b=baseHeatBand(B);
  if(b)out.push(b>0?"жарко":"холодно");
  if(baseCrewN(B))out.push("дух — "+linkWord(baseSpirit(B),40,20));
  return out.join(" · ");
}
/* ── одно слово обо всей базе ── */
function baseOneWord(B){
  if(baseParked(B))return "встали";
  if(baseCrewN(B)&&baseSpirit(B)<SPIRIT_LOW)return "плохо";
  const L=baseLife(B);
  if((L.food|0)<=0||L.air<=0||L.water<=0)return "плохо";
  if(baseHeatBand(B))return "терпимо";
  return "порядок";
}
/* ── что слышно ──
   Возвращает готовые строки: панель их показывает, а эфир произносит. */
function baseReport(B,sx,sy){
  const lvl=baseHear(B,sx,sy);
  if(lvl<=0)return {lvl,head:"…шшш",lines:[]};
  const call=baseCall(B);
  if(lvl===1)return {lvl,head:call+" · …"+baseOneWord(B),lines:[]};
  if(lvl===2)return {lvl,head:call+" · "+baseWordLine(B),
    lines:baseLogList(B,1).map(x=>x.t)};
  const L=baseLife(B),h=baseHeat(B);
  return {lvl,head:call+" · воздух "+L.air+" · вода "+L.water+" · харч "+(L.food|0)+
    " · тепло "+(h>0?"+":"")+(h/10).toFixed(1)+
    (baseCrewN(B)?" · дух "+baseSpirit(B)+"%":" · людей нет")+
    " · смена "+(baseT0(B)%1000),
    lines:baseLogList(B,2).map(x=>"смена "+((x.n|0)%1000)+" · "+x.t)};
}
/* ── один приказ за сеанс (§38) ──
   Дотягивается он не всегда: далёкой базой и правда труднее управлять, и это
   ровно та цена, которую снимает настоящий управляющий (§34). */
function baseLinkCan(B,sx,sy){return baseHear(B,sx,sy)>=2;}
function baseLinkPark(B){
  if(!baseLinkCan(B)){say("Сигнал слабый\nприказ не дошёл");return false;}
  const n=(typeof baseShift==="function")?baseShift():0;
  const was=baseParked(B);
  if(was)baseWake(B,n,"hand");else basePark(B,"hand",n);
  etherLine(baseCall(B)+": "+(was?"поняли, поднимаемся":"поняли, встаём на консервацию"),
    "связь");
  return true;
}
/* ── база зовёт сама ──
   Это и есть вторая треть §38: не панель докладывает, а люди говорят, и по
   тому, как плохо слышно, уже понятно, стоит ли поворачивать. */
const LINK_CALL={park:1,leave:1,raid_hit:1,wear:1,hungry:1};
function baseCallOut(B,line){
  if(!line||!LINK_CALL[line.k])return false;
  if((B.sx|0)===(G.sx|0)&&(B.sy|0)===(G.sy|0))return false;   /* мы и так тут */
  const lvl=baseHear(B);
  if(lvl<=0)return false;
  etherLine(baseCall(B)+": "+(lvl>=2?line.t:"…"+baseOneWord(B)+"…"),"связь");
  return true;
}
/* ── панель приёмников: свои мачты первыми ── */
function renderBaseLink(box){
  const L=(typeof baseList==="function")?baseList():[];
  if(!L.length)return;
  tableRow(box,"head","","СВЯЗЬ С БАЗАМИ · СЛЫШНО РОВНО СТОЛЬКО, СКОЛЬКО СЛЫШНО");
  for(const B of L){
    const R=baseReport(B),d=Math.hypot((B.sx|0)-G.sx,(B.sy|0)-G.sy);
    const row=document.createElement("div");row.className="li";
    const em=document.createElement("em");em.textContent=(B.sx|0)+":"+(B.sy|0);
    const sp=document.createElement("span");
    sp.innerHTML="<b>"+baseCall(B)+" «"+B.name+"»</b> · "+
      (d<.5?"вы здесь":Math.round(d)+" сект.")+
      " · "+(baseHasMast(B)?"мачта стоит":"<i style=\"color:#8b7d61\">мачты нет</i>")+
      "<br>"+R.head+(R.lines.length?"<br>"+R.lines.join("<br>"):"");
    row.appendChild(em);row.appendChild(sp);
    box.appendChild(row);
    /* один приказ за сеанс — и только если дотянулись */
    if(baseLinkCan(B)){
      const b=document.createElement("button");
      b.className="act";
      b.textContent=baseParked(B)?"ПОДНЯТЬ":"НА КОНСЕРВАЦИЮ";
      b.onclick=(e)=>{e.stopPropagation();baseLinkPark(B);renderRelays(box);};
      row.appendChild(b);
    }
  }
}
