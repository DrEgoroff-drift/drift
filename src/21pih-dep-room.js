/* ══════════════ залежи не под стеной и не под ориентиром (0.493.5) ══════════════
   Проба экономики (M903) нашла: цепочка подсказок грунта (21-mode-surface) ставит
   стену посёлка, место посёлка и точку осмотра РАНЬШЕ залежи. Залежь в их радиусе
   не бурится никогда — а стена без подписи и без чужих рук вдобавок молчит: не
   пишет ничего, и на экране висит прошлая подсказка («ЗАЛОЖИТЬ ШАХТУ» в 13 м от
   кремния). Цепочку не трогаем — залежи отодвигаются при посадке, как уже
   отодвигаются от устья пещеры и от двора дома (clearNear/clearHome в enterSurface),
   только не выбрасываются, а сдвигаются: номер залежи (i) и остаток (G.mined) при
   этом свои. Молчащая стена получает строку. */
const DEP_ROOM_PAD=26;   /* радиус, с которого залежь ловит подсказку (21-mode-surface) */
function depRoomBlockers(S){
  const tr=S.tr,p=S.p,out=[];
  const wx=settleWallHereX(p,tr);if(wx!=null)out.push({x:wx,r:30+DEP_ROOM_PAD});
  const sx=settleSpotX(p,tr);if(sx!=null)out.push({x:sx,r:44+DEP_ROOM_PAD});
  for(const q of (tr&&tr.poi)||[])out.push({x:q.x,r:Math.max(36,q.h*.22*(q.sc||1))+DEP_ROOM_PAD});
  return out;
}
/* глушители сливаются в отрезки: стена и место посёлка стоят рядом и перекрываются,
   и залежь, отодвинутая от одного, ложилась в другой — и так по кругу */
function depRoomSpans(B){
  const s=B.map(b=>[b.x-b.r,b.x+b.r]).sort((a,b)=>a[0]-b[0]),out=[];
  for(const q of s){const l=out[out.length-1];if(l&&q[0]<=l[1])l[1]=Math.max(l[1],q[1]);else out.push([q[0],q[1]]);}
  return out;
}
function depRoom(S){
  if(!S||!S.deposits||!S.tr)return 0;
  const SP=depRoomSpans(depRoomBlockers(S));let moved=0;
  for(const d of S.deposits){
    const sp=SP.find(q=>d.x>q[0]&&d.x<q[1]);if(!sp)continue;
    d.x=clamp((d.x-sp[0]<sp[1]-d.x)?sp[0]:sp[1],120,S.tr.W-120);
    d.y=groundAt(S.tr,d.x)-6;moved++;
  }
  return moved;
}
const DEP_ROOM_OLD_ENTER=enterSurface;
enterSurface=function(){
  const r=DEP_ROOM_OLD_ENTER.apply(this,arguments);
  if(G.mode==="surface")depRoom(G.surf);
  return r;
};
/* молчащая ветка: кадр начинается с пустой подсказки, и если цепочка не написала
   ничего, строка ставится здесь — у стены своя, в остальном общая */
const DEP_ROOM_OLD_UPD=updateSurface;
updateSurface=function(dt){
  G.prompt="";
  const r=DEP_ROOM_OLD_UPD(dt);
  if(G.prompt===""&&G.mode==="surface"&&G.surf){
    const S=G.surf,wx=S._wallX;
    G.prompt=(wx!=null&&Math.abs(S.x-wx)<30)?"СТЕНА ПОСЁЛКА · ПУСТА":"▲ — ПРЫЖОК · ИЩИТЕ ЗАЛЕЖИ";
  }
  return r;
};
