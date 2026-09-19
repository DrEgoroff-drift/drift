/* ══════════════ рекламные щиты на подъезде (M460, DESIGN-life §3.2, review §4.2) ══════════════
   Неон — свет с источником: ферма, панель, надпись в три штриха (свечение,
   тело, добела раскалённая середина) и ОДНА бегущая строка. Строка полезна:
   это настоящая цена у соседей — «ТИТАН 41 У ПАРТНЁРА В 2 ПРЫЖКАХ — ВЫГОДНО
   КАК НИКОГДА», — сказанная голосом хозяина земли. У ГЛАВТРАССЫ одна буква
   всегда мертва, и раз в минуту вывеска гудит (провал на 200 мс) — это
   единственное разрешённое мигание в кадре.

   Щит есть у людной станции (жизнь ≥ .45), сбоку полосы у второй пары бакенов.
   Строка пересчитывается раз в десять секунд игры. */
const BB_TITLE={gt:"ТРАССА — ДЕЛО КАЖДОГО",co:"ЗОНА ПАРТНЁРА™",or:"ОРДНУНГ · ПОРЯДОК",km:"LA COMMUNE",ra:"РАССВЕТ · СВОИ",hf:"HIGH-FRONT"};
const BB_CACHE={key:"",line:""};
function bbHere(){
  const sys=G.sys;if(!sys||!sys.station||typeof sysLane!=="function")return null;
  const P=sysLane(sys);if(!P||P.life<.45)return null;
  const d=LANE_DOCK+LANE_GAP*1.8;
  return {x:P.st.x+P.ux*d+P.uy*200*P.side,y:P.st.y+P.uy*d-P.ux*200*P.side,a:Math.atan2(P.uy,P.ux),by:P.by,P};
}
/* лучшая цена у соседей: товар, станция, сколько секторов */
function bbDeal(){
  let best=null;
  for(let dx=-3;dx<=3;dx++)for(let dy=-3;dy<=3;dy++){
    if(!dx&&!dy)continue;const sx=G.sx+dx,sy=G.sy+dy;
    if(!starAt(sx,sy))continue;const s=getSystem(sx,sy);if(!s.station)continue;
    /* база станции, а не marketFor: тот заводит запись рынка — щит не должен трогать мир */
    const M=s.station.prices||{};
    for(const k of TRADE_KEYS){if(!M[k])continue;const v=M[k]/Math.max(1,RES[k].price);if(!best||v>best.v)best={v,k,p:M[k],st:s.station.name,d:Math.max(Math.abs(dx),Math.abs(dy))};}
  }
  return best;
}
function bbLine(by){
  const key=G.sx+","+G.sy+","+Math.floor(G.t/600);
  if(BB_CACHE.key===key)return BB_CACHE.line;
  const D=bbDeal();let L;
  /* ГЛАВТРАССА через раз вешает план (M503) */
  const gp=(by==="gt"&&(Math.floor(G.t/600)&1)&&typeof gosBbLine==="function")?gosBbLine():null;
  if(gp)L=gp;
  else if(!D)L="СВОБОДНОЕ МЕСТО ДЛЯ ВАШЕЙ РЕКЛАМЫ";
  else{
    const g=RES[D.k].ru.toUpperCase(),n=D.d+" "+pl3(D.d,"ПРЫЖОК","ПРЫЖКА","ПРЫЖКОВ");
    L=by==="co"?g+" "+D.p+" У ПАРТНЁРА В "+D.d+" "+pl3(D.d,"ПРЫЖКЕ","ПРЫЖКАХ","ПРЫЖКАХ")+" — ВЫГОДНО КАК НИКОГДА™ · ДО КОНЦА АКЦИИ 00:00:03":
      by==="or"?"ЦЕНА НА "+g+": "+D.p+" КР · «"+D.st.toUpperCase()+"» · "+n+" · ПРОВЕРЕНО":
      by==="km"?g+" — "+D.p+", НО ДЕЛО НЕ В ЦЕНЕ · «"+D.st.toUpperCase()+"» · ОБЕД С 13 ДО 14":
      by==="ra"?"БРАТ! "+g+" ПО "+D.p+" НА «"+D.st.toUpperCase()+"» — ЗАХОДИ":
      by==="hf"?g+":"+D.p+" @"+D.st.toUpperCase()+" Δ"+D.d+" // РЕКОМЕНДОВАНО":
      "ТОВАРИЩ! "+g+" — "+D.p+" КР НА «"+D.st.toUpperCase()+"» · "+n;
  }
  BB_CACHE.key=key;BB_CACHE.line=L;
  return L;
}
function drawBillboard(zx,zy,Z){
  const B=bbHere();if(!B)return;
  /* щит читают: мельче мерки борта не сжимается (кегль × UIK, как всё, что читает игрок) */
  const x=zx(B.x),y=zy(B.y),s=Math.max(1,clamp(Z,.6,1.5))*UIK;
  if(x<-160*s||x>W+160*s||y<-120*s||y>H+120*s)return;
  const col=(typeof laneLampCol==="function")?laneLampCol(B.by):[255,190,110];
  /* издали щит — табличка по масштабу мира, без букв: читаемый кегль на ×0.16 ложится
     поверх очереди полосы и отеля кашей (снимок автора 19.09). Буквы проявляются к ×0.5 */
  const rd=clamp((Z-.3)/.2,0,1);
  if(rd<=0){
    const w=Math.max(6,120*Z),h=Math.max(2,40*Z);
    ctx.fillStyle="#0e1217";ctx.fillRect(x-w/2,y-h/2,w,h);
    ctx.fillStyle=rgba(col,.55);ctx.fillRect(x-w/2+1,y-h*.25,w-2,Math.max(1,h*.2));
    return;
  }
  ctx.save();ctx.globalAlpha*=rd;
  const pw=120*s,ph=40*s;
  /* ферма и панель */
  ctx.strokeStyle="rgba(150,164,180,.6)";ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(x-pw*.3,y+ph*.5);ctx.lineTo(x-pw*.3,y+ph*1.1);ctx.moveTo(x+pw*.3,y+ph*.5);ctx.lineTo(x+pw*.3,y+ph*1.1);ctx.stroke();
  ctx.fillStyle="#0e1217";ctx.fillRect(x-pw/2,y-ph/2,pw,ph);
  ctx.strokeStyle="rgba(40,48,58,.9)";ctx.strokeRect(x-pw/2,y-ph/2,pw,ph);
  /* гудение ГЛАВТРАССЫ: раз в минуту провал на 200 мс */
  const buzz=B.by==="gt"&&((G.t/60)%60)<.2?.35:1;
  /* заголовок — неон в три штриха; у ГЛАВТРАССЫ одна буква мертва */
  let T=BB_TITLE[B.by]||BB_TITLE.gt;
  if(B.by==="gt"){const i=2+hashi(G.sx,G.sy,0xDEAD)%(T.length-3);if(T[i]!==" ")T=T.slice(0,i)+" "+T.slice(i+1);}
  ctx.font="bold "+Math.round(11*s)+"px ui-monospace,monospace";ctx.textAlign="center";ctx.textBaseline="middle";
  ctx.save();ctx.globalCompositeOperation="lighter";
  ctx.strokeStyle=rgba(col,.22*buzz);ctx.lineWidth=5*s;ctx.strokeText(T,x,y-ph*.18);
  ctx.fillStyle=rgba(col,.9*buzz);ctx.fillText(T,x,y-ph*.18);
  ctx.fillStyle=rgba([255,255,255],.35*buzz);ctx.fillText(T,x,y-ph*.18);
  ctx.restore();
  /* бегущая строка — единственное, что движется */
  const L=bbLine(B.by)+"   ·   ";
  ctx.font=Math.round(8*s)+"px ui-monospace,monospace";ctx.textAlign="left";
  const tw=ctx.measureText(L).width,off=((G.t*.6*s)%tw);
  ctx.save();ctx.beginPath();ctx.rect(x-pw/2+4,y+ph*.05,pw-8,ph*.4);ctx.clip();
  ctx.fillStyle=rgba(mixc(col,[255,255,255],.3),.85);
  for(let k=-1;k<3;k++)ctx.fillText(L,x-pw/2+4-off+k*tw,y+ph*.25);
  ctx.restore();
  ctx.restore();
}
