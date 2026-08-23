/* ══════════════ реактивный ранец ══════════════ */
/* Прыжок был единственным способом оторваться от земли: пик рельефа или
   уступ в пещере становились стеной. Ранец — стандартная механика: держишь
   тягу — летишь вверх, запас горит за две с половиной секунды, на земле
   набирается за полторы, в воздухе еле-еле. Запас один на выход (лежит на
   G.surf рядом со скафандром), телом может быть и астронавт на поверхности,
   и он же в пещере: функция получает объект со скоростью и тяготение. */
const JET_BURN=1/150, JET_REGEN_GROUND=1/90, JET_REGEN_AIR=1/1100, JET_VMAX=-2.1;
function jetFuel(){const S=G.surf;if(!S)return 1;if(S.jet==null)S.jet=1;return S.jet;}
function jetCanLift(){return jetFuel()>.05;}
/* air — тело в воздухе: тогда тяга жжёт запас и толкает тело; на земле запас
   копится. Возвращает true, пока ранец горит — по этому рисуется факел */
function jetTick(body,g,dt,air){
  const S=G.surf;if(!S)return false;
  if(S.jet==null)S.jet=1;
  let fire=false;
  const KS=(typeof kitStat==="function")?kitStat():null;   /* ранец комплекта (M152): запас, восстановление, тяга, вес */
  const burn=JET_BURN*(KS?KS.jetBurn/KS.jetFuel:1),regenMul=KS?KS.jetRegen:1,vmax=JET_VMAX*(KS?KS.jetThrust:1);
  if(air&&keys.thrust&&S.jet>0){
    S.jet=Math.max(0,S.jet-burn*dt);
    /* тяга — вдвое с лишним сильнее тяготения планеты, иначе на тяжёлом
       мире ранец только замедляет падение */
    body.vy=Math.max(vmax,body.vy-g*2.3*dt);
    fire=true;
    S.jetSfx=(S.jetSfx||0)-dt;
    if(S.jetSfx<=0){S.jetSfx=9;sfx("ui",{f:140+Math.random()*40,to:90,d:.16,v:.05});}
  }else S.jet=Math.min(1,S.jet+(air?JET_REGEN_AIR:JET_REGEN_GROUND)*regenMul*dt);
  body.jetOn=fire;
  return fire;
}
/* полоска запаса: на поверхности и в пещере одна и та же, слева внизу */
function drawJetBar(x,y){
  const f=jetFuel(),w=74;
  ctx.font="9px ui-monospace,monospace";ctx.textAlign="left";
  ctx.fillStyle="rgba(93,115,130,.9)";ctx.fillText("РАНЕЦ",x,y);
  ctx.fillStyle="rgba(0,0,0,.5)";ctx.fillRect(x+40,y-7,w,5);
  ctx.fillStyle=f<.2?"#ff6b57":(G.surf&&G.surf.jetOn?"#ffd27a":"#7fe6d8");
  ctx.fillRect(x+40,y-7,w*f,5);
}
