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
/* Хрущёвка (автор 19.09: «гостиница всратая … перерисуй хрущевку, покрупнее, чтобы окна
   гасли»). Пять этажей панели с тёмными швами, вальмовая крыша с трубами и антеннами на
   проволоке, застеклённые балконы вразнобой — у каждого свой цвет, лавка у подъезда.
   Окна живут по суткам: у каждого свой порог по зерну, вечером горит почти всё, к ночи
   гаснет по одному, к утру — редкие; раз в несколько секунд одно окно передумывает.
   Размер — мировой (растёт с зумом), издали — плита без мелочей. */
const HR_COLS=12,HR_ROWS=5;
function hotelLitFrac(by,hr){
  if(by==="co")return .95;
  if(by==="or"&&(hr>=22||hr<6))return .04;
  const T=[.12,.08,.06,.05,.06,.15,.45,.55,.35,.18,.12,.12,.14,.14,.14,.16,.25,.5,.8,.9,.88,.75,.55,.3];
  return T[hr|0];
}
function drawHotel(zx,zy,Z){
  const Ht=hotelHere();if(!Ht)return;
  const x=zx(Ht.x),y=zy(Ht.y),k=Math.max(.22,Z*1.25);
  const w=160*k,h=84*k;
  if(x<-w||x>W+w||y<-h*1.6||y>H+h)return;
  const L=x-w/2,T=y-h/2,sd=G.sx*31+G.sy;
  const hr=((G.t%CEL_DAY)/CEL_DAY)*24,lit=hotelLitFrac(Ht.by,hr),flick=Math.floor(G.t/60/7);
  /* цоколь и тень */
  ctx.fillStyle="#1b1d20";ctx.fillRect(L-3*k,T+h,w+6*k,4*k);
  /* тело панели */
  ctx.fillStyle="#b9a680";ctx.fillRect(L,T,w,h);
  ctx.fillStyle="rgba(0,0,0,.22)";ctx.fillRect(L+w*.86,T,w*.14,h);   /* торец в тени */
  const cw=w/HR_COLS,rh=h/HR_ROWS;
  if(k>.35){
    ctx.strokeStyle="rgba(52,56,54,.75)";ctx.lineWidth=Math.max(.6,.8*k);ctx.beginPath();
    for(let i=1;i<HR_COLS;i++){ctx.moveTo(L+i*cw,T);ctx.lineTo(L+i*cw,T+h);}
    for(let j=1;j<HR_ROWS;j++){ctx.moveTo(L,T+j*rh);ctx.lineTo(L+w,T+j*rh);}
    ctx.stroke();
  }
  /* окна */
  const BAL=["#3f8f86","#9b2f33","#7c8a96","#4f7fb0","#6b4a32","#c8c0a0"];
  for(let j=0;j<HR_ROWS;j++)for(let i=0;i<HR_COLS;i++){
    const hsh=hashi(i+j*17,sd,0x407E)>>>0;
    let on=((hsh%1000)/1000)<lit;
    if(((hashi(i+j*17,flick,0xF11C)>>>0)%97)===0)on=!on;
    const wx=L+i*cw+cw*.24,wy=T+j*rh+rh*.22,ww=cw*.52,wh=rh*.56;
    ctx.fillStyle=on?(hsh&1?"#ffd68a":"#ffe7b5"):"#2a3036";ctx.fillRect(wx,wy,ww,wh);
    if(k>.5){ctx.fillStyle="rgba(240,236,220,.85)";ctx.fillRect(wx+ww*.45,wy,Math.max(.6,ww*.1),wh);ctx.fillRect(wx,wy+wh*.35,ww,Math.max(.6,wh*.08));}
    /* балкон — не у всех, свой цвет */
    if(j<HR_ROWS-1&&k>.3&&(hsh>>>7)%5===0){
      ctx.fillStyle=BAL[(hsh>>>11)%BAL.length];ctx.fillRect(L+i*cw+cw*.08,T+j*rh+rh*.62,cw*.84,rh*.34);
      ctx.fillStyle="rgba(255,255,255,.35)";ctx.fillRect(L+i*cw+cw*.12,T+j*rh+rh*.66,cw*.76,rh*.08);
    }
  }
  /* подъезды, козырьки, лавки */
  for(const u of [.22,.56]){
    const dx=L+w*u;
    ctx.fillStyle="#4a3526";ctx.fillRect(dx,T+h-rh*.7,cw*.6,rh*.7);
    ctx.fillStyle="#5d6166";ctx.fillRect(dx-cw*.2,T+h-rh*.78,cw,rh*.1);
    if(k>.4){ctx.fillStyle="#2f8a3a";ctx.fillRect(dx+cw*.9,T+h-rh*.18,cw*.9,rh*.14);}
  }
  /* вальмовая крыша */
  const rH=h*.26;
  ctx.fillStyle="#3b3a3a";ctx.beginPath();ctx.moveTo(L-4*k,T);ctx.lineTo(L+w*.1,T-rH);ctx.lineTo(L+w*.9,T-rH);ctx.lineTo(L+w+4*k,T);ctx.closePath();ctx.fill();
  ctx.fillStyle="#4a2e22";ctx.fillRect(L-4*k,T-1.5*k,w+8*k,2.5*k);
  if(k>.3){
    ctx.fillStyle="#5a3428";
    for(const u of [.18,.23,.47,.52,.8])ctx.fillRect(L+w*u,T-rH-6*k,5*k,10*k);
    /* антенны на проволоке */
    ctx.strokeStyle="rgba(30,30,32,.95)";ctx.lineWidth=Math.max(.6,.9*k);ctx.beginPath();
    const ax=[.15,.35,.62,.86];
    for(const u of ax){const bx=L+w*u,by=T-rH;ctx.moveTo(bx,by);ctx.lineTo(bx,by-18*k);ctx.moveTo(bx-6*k,by-14*k);ctx.lineTo(bx+6*k,by-15*k);ctx.moveTo(bx-4*k,by-10*k);ctx.lineTo(bx+4*k,by-11*k);}
    for(let a=0;a<ax.length-1;a++){const x0=L+w*ax[a],x1=L+w*ax[a+1],yy=T-rH-14*k;ctx.moveTo(x0,yy);ctx.quadraticCurveTo((x0+x1)/2,yy+8*k,x1,yy);}
    ctx.stroke();
  }
  /* вывеска на крыше — издали нет */
  const col=(typeof laneLampCol==="function")?laneLampCol(Ht.by):[255,190,110];
  const fa=clamp((Z-.3)/.2,0,1);
  if(fa>0){ctx.save();ctx.globalCompositeOperation="lighter";ctx.font="bold "+Math.round(8*Math.max(1,k)*UIK)+"px ui-monospace,monospace";ctx.textAlign="center";
    ctx.fillStyle=rgba(col,.9*fa);ctx.fillText(Ht.name,x,T-rH-24*k);ctx.restore();}
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
