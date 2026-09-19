/* ══════════════ гостиницы (M461, DESIGN-life §3.3) ══════════════
   Одно тело — плита окон — и шесть одевок хозяина: какие окна горят и что на
   вывеске. «ГОС ИНИЦА «КОСМОС»» (две буквы мертвы, на доске «МЕСТ НЕТ», у
   стойки «для вас найдём»), «ДЖЕКПОТ-СИТИ™», «Пансион № 4» (свет гасят в 22),
   «Ля Люн», дверь в скале, соты. Гостиница — дверь для тихих вещей, что уже
   есть: кино (27da), слухи кантины, номер. Доброта: корпус ниже трети —
   ночь даром, «потом заплатите».

   Стоит у людной станции (жизнь ≥ .45) по другую сторону полосы от щита. */
const HOTEL_SIGN={gt:"ГОС ИНИЦА «КОСМОС»",co:"ДЖЕКПОТ-СИТИ™",or:"ПАНСИОН № 4",km:"LA LUNE",ra:"ДВЕРЬ В СКАЛЕ",hf:"HIVE·HOTEL v2"};
const HOTEL_NIGHT=12;
function hotelHere(){
  const sys=G.sys;if(!sys||!sys.station||typeof sysLane!=="function")return null;
  const P=sysLane(sys);if(!P||P.life<.45)return null;
  const d=LANE_DOCK+LANE_GAP*.4;
  return {x:P.st.x+P.ux*d+P.uy*280*P.side,y:P.st.y+P.uy*d-P.ux*280*P.side,by:P.by,name:HOTEL_SIGN[P.by]||HOTEL_SIGN.gt};
}
function drawHotel(zx,zy,Z){
  const Ht=hotelHere();if(!Ht)return;
  const x=zx(Ht.x),y=zy(Ht.y),s=clamp(Z*1.2,.3,1.5);   /* издали — с миром, не поверх очереди */
  if(x<-120||x>W+120||y<-120||y>H+120)return;
  const w=58*s,h=34*s,cols=9,rows=4,hr=Math.floor(((G.t%CEL_DAY)/CEL_DAY)*24);
  ctx.fillStyle="#1a2029";ctx.strokeStyle="rgba(0,0,0,.6)";ctx.lineWidth=1;
  ctx.fillRect(x-w/2,y-h/2,w,h);ctx.strokeRect(x-w/2,y-h/2,w,h);
  /* окна: у Пансиона в 22 гасят, у Компании горят все, у прочих — по зерну */
  for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){
    const on=Ht.by==="co"?1:(Ht.by==="or"&&(hr>=22||hr<6))?0:(hashi(i+j*17,G.sx*31+G.sy,0x407E)%3?1:0);
    ctx.fillStyle=on?"rgba(255,222,160,.85)":"rgba(40,48,58,.9)";
    ctx.fillRect(x-w/2+4*s+i*5.8*s,y-h/2+4*s+j*7.2*s,3.4*s,4.2*s);
  }
  const col=(typeof laneLampCol==="function")?laneLampCol(Ht.by):[255,190,110];
  ctx.save();ctx.globalCompositeOperation="lighter";ctx.font="bold "+Math.round(8*Math.max(1,s)*UIK)+"px ui-monospace,monospace";ctx.textAlign="center";
  /* имя отеля — вблизи; издали его несёт подсказка у стойки, над очередью полосы оно каша */
  ctx.fillStyle=rgba(col,.9*clamp((Z-.3)/.2,0,1));if(Z>.3)ctx.fillText(Ht.name,x,y-h/2-6*s);ctx.restore();
}
function hotelInteract(sh){
  const Ht=hotelHere();if(!Ht)return false;
  if(Math.hypot(sh.x-Ht.x,sh.y-Ht.y)>150)return false;
  const board=Ht.by==="gt"?" · МЕСТ НЕТ":"";
  const shown=cue(Ht.name+board+"\nДЕЙСТВИЕ — К СТОЙКЕ",CUE_ACT);
  if(shown&&actEdge)hotelDesk(Ht);
  return true;
}
function hotelDesk(Ht){
  const hm=stat().hullMax,low=G.hull<hm/3;
  const free=low;                                   /* доброта: ниже трети — даром */
  if(!free&&G.credits<HOTEL_NIGHT){say((Ht.by==="gt"?"«Мест нет.»":"«Номер — "+HOTEL_NIGHT+" кр.»")+"\nне хватает",110);return;}
  if(!free)G.credits-=HOTEL_NIGHT;
  const heal=Math.round(hm*.1);G.hull=Math.min(hm,G.hull+heal);
  const greet=Ht.by==="gt"?"«Мест нет. …Для вас найдём.»":Ht.by==="co"?"«Номер категории Партнёр™. Завтрак — отдельно.»":
    Ht.by==="or"?"«Отбой в 22:00. Подъём в 6:00.»":Ht.by==="km"?"«Ключ под ковриком, мы на собрании.»":
    Ht.by==="ra"?"«Ложись где свободно, брат.»":"«Ваша капсула рассчитана.»";
  logAdd("good",Ht.name+": ночь в номере"+(free?" — даром, «потом заплатите»":" · −"+HOTEL_NIGHT+" кр")+" · корпус +"+heal+" за ночь стоянки");
  say(greet+(free?"\n«…потом заплатите»":""),150);
  if(typeof kinoHere==="function"&&kinoHere())peopleLine("в холле афиша: сегодня кино. Идите, пока не началось.","портье",false);
}
