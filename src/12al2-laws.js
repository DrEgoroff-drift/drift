/* ══════════════ закон земли — по одному, только озвученные (M456, review §1.5) ══════════════
   У каждой державы одно правило, и оно звучит, когда касается вас:
   • ГЛАВТРАССА — НОРМА: первые двадцать единиц топлива за стыковку — по
     кредиту, «по норме»; дальше — по обычной цене;
   • Компания — ПОШЛИНА: стыковка 40 кр («сбор за оформление»), с попутчиком-
     спонсором на борту — бесплатно;
   • Орднунг — СКОРОСТНОЙ РЕЖИМ в нумерованном кольце у станции: быстрее
     метки ближе шестисот — штраф с номером параграфа, раз за подход;
   • Коммуна — ОБЕД: час по игровым суткам станция не продаёт и не берёт
     части; топливо продают всегда («топливо — не обед»);
   • Рассвет — «сделаем из ваших» и Хай-Фронт — рейтинг доверия: пока без
     правила (рейтинг вырезан ревью).
   Хозяин — земли под кораблём сейчас (stampOwnerAt). */
const LAW_NORM=20,LAW_FEE=40,LAW_RING=600,LAW_SPEED=4.5,LAW_FINE=15;
let LAW_NORM_LEFT=0,LAW_RING_KEY="";
function lawOwner(){return (typeof stampOwnerAt==="function")?stampOwnerAt(G.sx,G.sy):null;}
/* стыковка: норма заново, пошлина у Компании */
function lawDock(){
  const by=lawOwner();
  LAW_NORM_LEFT=by==="gt"?LAW_NORM:0;
  if(by==="co"){
    const sponsor=!!(typeof expAll==="function"&&expAll().pax);   /* попутчик экспедиции (11x) — спонсор */
    if(sponsor){logAdd("money","Компания: пошлина за стыковку — 0 кр (спонсор на борту™)");return;}
    const fee=Math.min(LAW_FEE,G.credits|0);
    G.credits-=fee;
    logAdd("money","Компания: сбор за оформление стыковки — "+fee+" кр · спасибо за выбор");
  }
}
/* заправка по норме: сколько единиц из need идут по кредиту */
function lawNormTake(need){
  if(lawOwner()!=="gt"||LAW_NORM_LEFT<=0)return 0;
  const n=Math.min(need,LAW_NORM_LEFT);LAW_NORM_LEFT-=n;
  if(n>0)logAdd("money","ГЛАВТРАССА: "+n+" ед. топлива по норме — по 1 кр");
  return n;
}
/* обед Коммуны: час в игровых сутках (13:00–14:00) */
function lawLunch(){
  if(lawOwner()!=="km")return false;
  const h=Math.floor(((G.t%CEL_DAY)/CEL_DAY)*24);
  return h===13;
}
/* скоростной режим Орднунга: в кольце у станции — метка скорости */
function lawRingTick(sh){
  if(lawOwner()!=="or"||!G.sys||!G.sys.station)return;
  const S=G.sys.station,d=Math.hypot(sh.x-S.x,sh.y-S.y),v=Math.hypot(sh.vx,sh.vy);
  const key=G.sx+","+G.sy+","+Math.floor(G.t/3600);
  if(d>LAW_RING){return;}
  if(v>LAW_SPEED&&LAW_RING_KEY!==key){
    LAW_RING_KEY=key;
    const par="§ "+(10+(hashi(G.sx,G.sy,0x0D12)%30))+"."+(1+(G.t|0)%9);
    const fine=Math.min(LAW_FINE,G.credits|0);G.credits-=fine;
    logAdd("warn","Орднунг: превышение в кольце станции ("+v.toFixed(1)+" при норме "+LAW_SPEED+") · "+par+" · штраф "+fine+" кр · экз. 1 из 3");
    say("ШТРАФ · "+par+"\nскоростной режим в кольце станции",120);
  }
}

/* кольцо Орднунга видно (дизайн-проход): закон, который штрафует, обязан быть
   нарисован. Пунктир на шестистах и восемь нумерованных столбов со знаком
   «4.5» — белый круг в красном ободе. Превышение внутри кольца зажигает
   ближний знак ровным светом — поведение у света, не мигание */
function drawLawRing(zx,zy,Z){
  if(lawOwner()!=="or"||!G.sys||!G.sys.station)return;
  const S=G.sys.station,cx=zx(S.x),cy=zy(S.y),R=LAW_RING*Z;
  if(R<24||cx+R<-40||cx-R>W+40||cy+R<-40||cy-R>H+40)return;
  const sh=G.ship,inR=Math.hypot(sh.x-S.x,sh.y-S.y)<LAW_RING,over=inR&&Math.hypot(sh.vx,sh.vy)>LAW_SPEED;
  const k=Math.max(.9,clamp(Z,.4,1.6))*(typeof UIK==="number"?UIK:1);   /* знак читают: мельче порога не сжимается */
  ctx.save();
  ctx.setLineDash([6*k,9*k]);ctx.strokeStyle="rgba(232,228,220,"+(inR?.28:.16)+")";ctx.lineWidth=1.2;
  ctx.beginPath();ctx.arc(cx,cy,R,0,TAU);ctx.stroke();ctx.setLineDash([]);
  const sa=Math.atan2(sh.y-S.y,sh.x-S.x);
  for(let i=0;i<8;i++){
    const a=i/8*TAU+.2,x=cx+Math.cos(a)*R,y=cy+Math.sin(a)*R;
    if(x<-30||x>W+30||y<-30||y>H+30)continue;
    const r=5.5*k,lit=over&&Math.abs(Math.atan2(Math.sin(a-sa),Math.cos(a-sa)))<Math.PI/8;
    ctx.fillStyle="rgba(0,0,0,.45)";ctx.fillRect(x-.6*k+1,y+r,1.2*k,r*1.1);
    ctx.fillStyle="#8a9098";ctx.fillRect(x-.6*k,y+r*.9,1.2*k,r*1.1);
    if(lit){const g=ctx.createRadialGradient(x,y,0,x,y,r*3.2);g.addColorStop(0,"rgba(255,90,70,.45)");g.addColorStop(1,"rgba(255,90,70,0)");
      ctx.globalCompositeOperation="lighter";ctx.fillStyle=g;ctx.fillRect(x-r*3.2,y-r*3.2,r*6.4,r*6.4);ctx.globalCompositeOperation="source-over";}
    ctx.fillStyle="#f4f1ea";ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();
    ctx.strokeStyle=lit?"#ff4a3a":"#c8322a";ctx.lineWidth=r*.26;ctx.beginPath();ctx.arc(x,y,r*.84,0,TAU);ctx.stroke();
    if(r>=4){ctx.fillStyle="#1a1a1a";ctx.font="bold "+(r*.78).toFixed(1)+"px ui-monospace,monospace";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("4.5",x,y+.3);
      ctx.fillStyle="rgba(232,228,220,.6)";ctx.font=(r*.62).toFixed(1)+"px ui-monospace,monospace";ctx.fillText("№"+(i+1),x,y+r*2.6);}
  }
  ctx.restore();
}
