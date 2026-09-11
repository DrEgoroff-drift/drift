/* ══════════════ «ЧТО ПОЛУЧИЛ» — добыча боя карточкой (п. 5 плейтеста 11.09) ══════════════
   Автор: «прилетел на планету, где боссы… все убил всех — и что? дали какие-то
   бонусы, опять смотреть инвентарь». Часть с боя уходила в опись молча, одним
   тостом с именем, и чтобы её надеть, надо было идти на стол и искать.

   Теперь добыча боя (контейнер со сбитого, мешок абордажа) встаёт в очередь, и
   когда бой кончился — никто не гонится, экраны закрыты, буксир не тащит, —
   всплывает карточка: что это, что она изменит на корабле (те же строки и
   единицы, что ПРИБОРЫ описи) и кнопка НАДЕТЬ прямо здесь. Ставит та же ручка,
   что в описи (opisFit), — отказ называет причину. Очередь живёт мимо сейва:
   не показанное остаётся в описи, как и было. */
const GOT={q:[],el:null};
function gotAdd(p){if(p&&p.id&&GOT.q.indexOf(p.id)<0)GOT.q.push(p.id);}
/* карточка не всплывает под огнём и поверх чужого окна */
function gotCalm(){
  if(G.mode!=="system"||G.haul)return false;
  const b=document.body;
  if(b.classList.contains("screen")||b.classList.contains("sosopen")||b.classList.contains("table"))return false;
  return !(G.pirates||[]).some(p=>p.aware&&!p.iff);
}
function gotEl(){
  if(GOT.el)return GOT.el;
  const e=document.createElement("div");e.id="gotwin";
  document.body.appendChild(e);
  return (GOT.el=e);
}
function gotClose(){if(GOT.el)GOT.el.classList.remove("open");}
function gotNext(){GOT.q.shift();gotRender();}
function gotRender(){
  /* снятые, разобранные и вытесненные из описи молча выпадают из очереди */
  while(GOT.q.length&&(!partById(GOT.q[0])||isFitted(GOT.q[0])))GOT.q.shift();
  const e=gotEl();
  if(!GOT.q.length){e.classList.remove("open");return;}
  const p=partById(GOT.q[0]),more=GOT.q.length-1;
  const t=opisTarget(p),fm=G.fit[G.shipId]||{};
  let diff="",where="";
  if(t<0)where="на «"+stat().S.ru+"» нет подвеса под такую часть";
  else{
    diff=modDiffHtml(stat(),statPreview(t,p.id));
    where=fm[t]!=null?"встанет вместо «"+partById(fm[t]).name+"» · слот "+(t+1):"встанет в свободный слот "+(t+1);
  }
  e.innerHTML="<b><em>С БОЯ"+(more?" · ЕЩЁ "+more:"")+"</em><span>×</span></b>"+
    "<div class='gp' style='border-top:3px solid "+PART_KINDS[p.kind].col+"'>"+opisPartHtml(p)+"</div>"+
    "<div class='gf'>"+(diff||"")+"<s>"+where+"</s></div><div class='ga'></div>";
  e.querySelector("b span").onclick=()=>{GOT.q=[];gotClose();};
  const acts=e.querySelector(".ga");
  const on=el("button","act gold","НАДЕТЬ");
  on.disabled=t<0;
  on.onclick=()=>{if(opisFit(p)){sfx("ui");say("Поставлено: "+p.name);gotNext();}};
  acts.appendChild(on);
  const keep=el("button","act",more?"ДАЛЬШЕ":"В ОПИСИ");
  keep.onclick=()=>gotNext();
  acts.appendChild(keep);
  e.classList.add("open");
}
function gotTick(){
  if(!GOT.q.length){if(GOT.el&&GOT.el.classList.contains("open"))gotClose();return;}
  if(!gotCalm()){gotClose();return;}
  if(!GOT.el||!GOT.el.classList.contains("open"))gotRender();
}
