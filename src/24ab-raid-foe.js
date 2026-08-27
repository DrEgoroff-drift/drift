/* ══════════════ рейд: тело противника ══════════════
   Отрезано от 24aa-raid-draw на разборе 0.194.0: отсек и тот, кто в нём
   стоит, — разные вещи, и шов между ними был единственным чистым в файле.
   `drawFoeBody` и так была отдельной функцией верхнего уровня; всё остальное
   в 24aa замкнуто на `proj`, `quad` и `polys` внутри `drawRaid`, и рвать его
   значило бы вытаскивать наружу половину проекции.

   Зовётся из `drawRaid`, уже в её системе координат: масштаб и поворот
   выставлены снаружи, отсюда рисуется фигура от собственного нуля. */
function drawFoeBody(f,K){
  const col=hex2rgb(K.col),r=K.r;
  const body=rgba(col,.95),dark=rgba(mixc(col,[8,12,18],.6),.96);
  const sc=f.baron?1.35:1;
  ctx.scale(sc,sc);
  /* поза покоя (хвост G4): пока тревоги нет, каждый второй привалился к
     стене — фигура скошена; оружие у всех опущено (ниже, у ствола) */
  if(!f.aware&&(f.seed&1))ctx.transform(1,0,.16,1,0,0);
  const bob=Math.sin((f.bob||0)+G.t*.05)*.8;
  ctx.fillStyle="rgba(0,0,0,.45)";                 // тень под ногами
  ctx.beginPath();ctx.ellipse(0,r*1.5,r*1.1,r*.3,0,0,TAU);ctx.fill();
  if(f.baron){
    /* Плащ — трапеция с изломом по низу, а не эллипс: округлый «мешок» съедал
       силуэт и делал барона снеговиком. Рисуется ДО ног, поэтому ноги видны. */
    ctx.fillStyle=rgba(mixc(col,[18,10,14],.55),.92);
    ctx.beginPath();
    // плащ узкий и с вырезом: широкий закрывал ноги, и барон читался конусом
    ctx.moveTo(-r*.62,-r*.85);ctx.lineTo(-r*1.05,r*1.2);ctx.lineTo(-r*.62,r*1.05);
    ctx.lineTo(-r*.5,r*.2);ctx.lineTo(r*.5,r*.2);ctx.lineTo(r*.62,r*1.05);
    ctx.lineTo(r*1.05,r*1.2);ctx.lineTo(r*.62,-r*.85);ctx.closePath();ctx.fill();
    ctx.strokeStyle=rgba(mixc(col,[255,220,190],.4),.35);ctx.lineWidth=r*.07;
    ctx.stroke();
  }
  /* ── ноги (второй проход, хвост M180) ──
     Были два одинаковых прямоугольника от бедра до пола и по плашке подошвы:
     фигура читалась не человеком, а СТОЛБИКОМ, разрезанным пополам. Тремя
     вещами человек отличается от бруска — нога СУЖАЕТСЯ к щиколотке, у неё
     есть ботинок (шире голени и темнее), и ноги стоят не параллельно. Стойку
     берём из зерна: у всех одинаковый разнос — тот же брусок, только шире. */
  const st=((f.seed>>3)&3)/3;                      /* 0…1 — разнос ног */
  const leg=(x0,x1,shade,fwd)=>{
    const y0=r*.42, y1=r*1.66;
    ctx.fillStyle=shade;
    ctx.beginPath();
    ctx.moveTo(x0,y0);ctx.lineTo(x1,y0);
    ctx.lineTo(x1-r*.05+fwd,y1);ctx.lineTo(x0+r*.07+fwd,y1);
    ctx.closePath();ctx.fill();
    /* ботинок: шире голени, темнее, с мыском вперёд */
    ctx.fillStyle="rgba(0,0,0,.42)";
    ctx.beginPath();
    ctx.moveTo(x0+r*.02+fwd,y1-r*.05);ctx.lineTo(x1-r*.02+fwd,y1-r*.05);
    ctx.lineTo(x1+r*.13+fwd,r*1.84);ctx.lineTo(x0-r*.06+fwd,r*1.84);
    ctx.closePath();ctx.fill();
  };
  leg(r*.10,r*.50,dark,r*.06*st);                                  /* дальняя */
  leg(-r*.52,-r*.12,rgba(mixc(col,[8,12,18],.3),.96),-r*.10*st);   /* ближняя */
  ctx.fillStyle=body;                              // торс трапецией
  ctx.beginPath();
  ctx.moveTo(-r*.62,-r*.75+bob);ctx.lineTo(r*.62,-r*.75+bob);
  ctx.lineTo(r*.82,-r*.15+bob);ctx.lineTo(r*.56,r*.55);ctx.lineTo(-r*.56,r*.55);
  ctx.lineTo(-r*.82,-r*.15+bob);ctx.closePath();ctx.fill();
  const sg=ctx.createLinearGradient(-r,0,r,0);     // объём
  sg.addColorStop(0,"rgba(255,255,255,.12)");sg.addColorStop(1,"rgba(0,0,0,.3)");
  ctx.fillStyle=sg;ctx.fill();
  /* оплечье: тёмная кокетка по верху торса. Без неё трапеция остаётся
     плашкой — плечи это первое, по чему глаз узнаёт фигуру со спины */
  ctx.fillStyle="rgba(0,0,0,.22)";
  ctx.beginPath();
  ctx.moveTo(-r*.62,-r*.75+bob);ctx.lineTo(r*.62,-r*.75+bob);
  ctx.lineTo(r*.70,-r*.46+bob);ctx.lineTo(-r*.70,-r*.46+bob);
  ctx.closePath();ctx.fill();
  /* ремень идёт ПО ФИГУРЕ, а не поперёк неё: прямоугольник во всю ширину
     торса торчал за его края и читался полкой */
  ctx.fillStyle="rgba(0,0,0,.34)";
  ctx.beginPath();
  ctx.moveTo(-r*.66,r*.10);ctx.lineTo(r*.66,r*.10);
  ctx.lineTo(r*.60,r*.30);ctx.lineTo(-r*.60,r*.30);
  ctx.closePath();ctx.fill();
  ctx.fillStyle=rgba(mixc(col,[255,230,190],.5),.55);   /* пряжка */
  ctx.fillRect(-r*.09,r*.12,r*.18,r*.16);
  /* оружие: у тяжёлого и барона — ствол на сошке, у прочих короткий автомат.
     В покое — стволом вниз, поворотом всего блока рук вокруг плеча */
  ctx.save();
  if(!f.aware)ctx.rotate(.62);
  ctx.strokeStyle=dark;ctx.lineWidth=r*.28;ctx.lineCap="round";
  // обе руки: одна на рукояти, вторая на цевье — раньше ствол торчал из плеча
  ctx.beginPath();ctx.moveTo(r*.6,-r*.5+bob);ctx.lineTo(r*.85,r*.05);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-r*.55,-r*.45+bob);ctx.lineTo(r*.1,r*.1);
  ctx.lineTo(r*1.15,-r*.02);ctx.stroke();
  ctx.lineCap="butt";
  ctx.fillStyle="rgba(40,46,56,.98)";
  const gl=f.baron||f.kind==="heavy"?r*1.5:r*.95;
  ctx.fillRect(r*.75,-r*.1,gl,r*.22);
  if(f.baron||f.kind==="heavy"){                   // сошка под стволом
    ctx.strokeStyle="rgba(40,46,56,.9)";ctx.lineWidth=r*.1;
    ctx.beginPath();ctx.moveTo(r*1.6,r*.1);ctx.lineTo(r*1.4,r*.6);
    ctx.moveTo(r*1.6,r*.1);ctx.lineTo(r*1.9,r*.6);ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle=dark;                              // шея
  ctx.fillRect(-r*.16,-r*.95+bob,r*.32,r*.22);
  ctx.fillStyle="#1b2229";                         // шлем: голова была втрое велика
  ctx.beginPath();ctx.arc(0,-r*1.18+bob,r*.5,0,TAU);ctx.fill();
  if(f.baron){                                     // гребень: узкий и с завалом назад
    ctx.fillStyle=rgba(mixc(col,[255,220,180],.55),.95);
    ctx.beginPath();
    ctx.moveTo(r*.05,-r*1.72+bob);ctx.lineTo(r*.14,-r*1.62+bob);
    ctx.lineTo(r*.12,-r*1.35+bob);ctx.lineTo(-r*.26,-r*1.45+bob);ctx.closePath();ctx.fill();
    // наплечники: ранг виден плечами, а не размером
    ctx.fillStyle=rgba(mixc(col,[255,225,190],.35),.95);
    ctx.beginPath();ctx.ellipse(-r*.7,-r*.6+bob,r*.26,r*.16,-.4,0,TAU);ctx.fill();
    ctx.beginPath();ctx.ellipse(r*.7,-r*.6+bob,r*.26,r*.16,.4,0,TAU);ctx.fill();
  }
  ctx.fillStyle=f.aware?"rgba(255,90,70,.95)":"rgba(255,200,120,.7)";
  ctx.fillRect(-r*.34,-r*1.28+bob,r*.68,r*.18);    // забрало-полоса, а не глаз-точка
  /* ── обвод по свету (правило «много кусков — одно тело») ──
     Фигура была собрана из семи заливок и НИ ОДНОЙ подсветки: на тёмном полу
     отсека она распадалась на пятна, и первое, что о ней говорили, — «блочные».
     Свет в отсеке идёт от ламп сверху, значит светится верхняя кромка: шлем,
     плечо, ствол. Один обвод сшивает семь кусков в одно тело — тот же приём,
     что у попугая и у построек. */
  ctx.strokeStyle="rgba(255,232,196,.30)";
  ctx.lineWidth=Math.max(.8,r*.075);
  ctx.lineJoin="round";
  ctx.beginPath();
  ctx.arc(0,-r*1.18+bob,r*.5,Math.PI*1.06,Math.PI*1.94);          /* макушка */
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-r*.62,-r*.73+bob);ctx.lineTo(r*.62,-r*.73+bob);     /* плечи */
  ctx.stroke();
}
