/* ══════════════ ваша база видна с земли ══════════════ */
/* База существовала строчкой в меню: чтобы понять, что она у вас есть, нужно
   было зайти в раздел. Сели на планету, где стоит ваша база, — на горизонте
   ничего. Теперь она стоит там, где стоит: с земли её видно, к ней идут ногами,
   и вход — это подойти, а не найти пункт в списке.

   Дом отсюда ушёл: у него свой модуль (`21f-home-out`), см. `builtHere`.

   ПРАВИЛА:
   1. Строение рисуется тем же слоем, что и POI (`21b-surface-deco`): сначала
      тень на грунте, потом тело с клипом по профилю — иначе оно висит в воздухе
      или врастает в скалу.
   2. Ничего не персистится сверх уже имеющегося: где база — знает `G.bases`.
      Место на поверхности выводится из seed планеты, как и всё остальное в мире.
   3. Масштаб держится человеком: ангар базы вдвое выше астронавта. Постройка,
      которую видно от горизонта, врёт о размере мира. */
function builtKey(sx,sy){return sx+","+sy;}
/* что стоит в этой системе на этой планете */
function builtHere(){
  const S=G.surf;if(!S)return [];
  const out=[];
  /* база привязана к планете (21a: ключ sx,sy:idx) — на чужой планете той же
     системы её нет, иначе она «телепортируется» вслед за игроком */
  const B=(typeof baseAt==="function")?baseAt(G.sx,G.sy,S.p.idx):null;
  if(B)
    out.push({kind:"base",ru:"ВАША БАЗА",lvl:(B.cells?Object.keys(B.cells).length:1)});
  /* ── дома здесь больше нет, и это не потеря ──
     Плейтест 30.08.2026: «дом как говно нарисован… и тут получается в дом не
     зайти… проверь метки: дом рядом, а показывает 2000 метров».
     Все три жалобы — про одно: дом рисовался ДВАЖДЫ и в РАЗНЫХ местах. Здесь,
     на `builtSpot`, стояла коробка со скатом и подписью «ВАШ ДОМ · ступеней N»
     — заготовка тех времён, когда дома снаружи ещё не было; а настоящий дом с
     террасой, двором, гаражом и светом в окне (M170, `21f-home-out`) стоял на
     своём `homeSpotX`, за пару тысяч метров отсюда. Маркер навигатора и дверь
     считаются от НАСТОЯЩЕГО дома — поэтому у коробки не было двери, а стрелка
     звала прочь от неё.
     Это место дома не знает и знать не должно: у него свой модуль. Здесь
     остаётся только база — снаружи её больше никто не рисует. */
  return out;
}
/* место постройки на профиле: детерминировано от seed планеты, поэтому
   возвращаться к своей базе всегда приходится в одно и то же место */
function builtSpot(tr,p,kind){
  const r=rng(hashi(p.seed,kind==="home"?0x40E:0xBA5,11));
  /* Ровное место, а не случайный индекс: база висела над обрывом. Ищем участок
     с наименьшим перепадом на ширине постройки — так строят и в жизни. */
  const half=Math.max(3,Math.round(70/tr.step));
  const from=Math.floor(tr.N*.14),to=Math.floor(tr.N*.86);
  let best=null;
  for(let k=0;k<28;k++){
    const i=clamp(from+Math.floor(r()*(to-from)),half,tr.N-half-1);
    let lo=1e9,hi=-1e9;
    for(let j=i-half;j<=i+half;j++){lo=Math.min(lo,tr.h[j]);hi=Math.max(hi,tr.h[j]);}
    const flat=hi-lo;
    if(!best||flat<best.flat)best={i,flat};
    if(flat<6)break;                    // достаточно ровно — дальше не ищем
  }
  const i=best.i;
  /* ставим на самую высокую точку площадки: лучше пусть подножие уйдёт
     в грунт, чем постройка повиснет над ямой */
  let y=-1e9;
  for(let j=i-half;j<=i+half;j++)y=Math.max(y,tr.h[j]);
  return {x:i*tr.step,y};
}
function drawBuilt(tr,camx,camy,p){
  const list=builtHere();if(!list.length)return;
  for(const b of list){
    const sp=builtSpot(tr,p,b.kind);
    const x=sp.x-camx,y=sp.y-camy;
    if(x<-360||x>W+360)continue;
    const hgt=150;
    ctx.save();ctx.globalAlpha=.7;
    groundShadow(x-60,y+2,140,7);
    ctx.restore();
    /* клип по профилю: постройка стоит НА земле — ниже линии грунта её нет */
    const i0=clamp(Math.floor((camx-40)/tr.step),0,tr.N-1);
    const i1=clamp(Math.ceil((camx+W+40)/tr.step),0,tr.N-1);
    const SKY=new Path2D();
    SKY.moveTo(i0*tr.step-camx,-4000);
    for(let i=i0;i<=i1;i++)SKY.lineTo(i*tr.step-camx,tr.h[i]-camy+8);
    SKY.lineTo(i1*tr.step-camx,-4000);
    SKY.closePath();
    ctx.save();ctx.clip(SKY);
    ctx.translate(x,y);
    drawBaseBuilding(b,hgt);
    ctx.restore();
    /* подпись: постройку видно издалека, но чья она — только по метке */
    /* подпись на подложке и выше конька: голый текст тонул в небе и налезал
       на строку планеты */
    const col="143,208,138";
    ctx.font="9px ui-monospace,monospace";ctx.textAlign="center";
    const lab=b.ru+" · ячеек "+b.lvl;
    const tw=ctx.measureText(lab).width;
    const ly=y-hgt-30;
    ctx.fillStyle="rgba(6,10,16,.8)";ctx.fillRect(x-tw/2-6,ly-10,tw+12,15);
    ctx.strokeStyle="rgba("+col+",.5)";ctx.lineWidth=1;
    ctx.strokeRect(x-tw/2-5.5,ly-9.5,tw+11,14);
    ctx.fillStyle="rgba("+col+",.95)";ctx.fillText(lab,x,ly);
    ctx.strokeStyle="rgba("+col+",.35)";                    // выноска к крыше
    ctx.beginPath();ctx.moveTo(x,ly+5);ctx.lineTo(x,y-hgt-6);ctx.stroke();
  }
}
/* ── ангар базы ──
   Куб на опорах, шлюз, мачта связи и панели: то же, что игрок видит в разрезе
   (`21a-mode-base`), только снаружи и целиком. */
function drawBaseBuilding(b,hgt){
  const w=104,h=hgt;
  const g=ctx.createLinearGradient(0,-h,0,0);
  g.addColorStop(0,"rgba(58,70,84,1)");g.addColorStop(1,"rgba(26,32,42,1)");
  ctx.fillStyle=g;
  ctx.beginPath();
  ctx.moveTo(-w/2,0);ctx.lineTo(-w/2,-h*.62);ctx.lineTo(-w*.3,-h*.82);
  ctx.lineTo(w*.3,-h*.82);ctx.lineTo(w/2,-h*.62);ctx.lineTo(w/2,0);
  ctx.closePath();ctx.fill();
  ctx.strokeStyle="rgba(143,208,138,.35)";ctx.lineWidth=1.4;ctx.stroke();
  /* опоры: без них куб лежит на грунте брюхом */
  ctx.fillStyle="rgba(30,36,46,1)";
  for(const s of [-1,1])ctx.fillRect(s*w*.36-4,-h*.12,8,h*.12);
  /* ряды окон: свет изнутри — единственное, что говорит «тут живут» */
  for(let r=0;r<3;r++)for(let c=0;c<5;c++){
    const on=((r*5+c)%3)!==1;
    ctx.fillStyle=on?"rgba(255,226,180,.75)":"rgba(20,26,34,.9)";
    ctx.fillRect(-w*.36+c*w*.17,-h*.7+r*h*.18,10,7);
  }
  ctx.fillStyle="rgba(18,22,30,1)";                    // шлюз
  ctx.fillRect(-13,-h*.24,26,h*.24);
  ctx.fillStyle="rgba(143,208,138,.5)";ctx.fillRect(-13,-h*.24,26,2);
  ctx.strokeStyle="rgba(120,140,160,.6)";ctx.lineWidth=1.6; // мачта
  ctx.beginPath();ctx.moveTo(w*.4,-h*.62);ctx.lineTo(w*.44,-h*1.15);ctx.stroke();
  ctx.fillStyle=(Math.sin(G.t*.2)>0)?"rgba(255,90,70,.95)":"rgba(255,90,70,.25)";
  ctx.beginPath();ctx.arc(w*.44,-h*1.17,2.6,0,TAU);ctx.fill();
  ctx.strokeStyle="rgba(127,176,230,.5)";ctx.lineWidth=1.2;  // панели
  for(let i=0;i<3;i++){
    ctx.beginPath();
    ctx.moveTo(-w*.5-6-i*11,-h*.3);ctx.lineTo(-w*.5-2-i*11,-h*.52);ctx.stroke();
  }
}
