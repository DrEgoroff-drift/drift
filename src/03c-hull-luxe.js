/* ══════════════ люксовая яхта ══════════════
   Единственный корпус, который покупают не за работу, а за вид, — и до сих пор
   он был иглой курьера с лентой окон. Проход первый: ФОРМА. Высоту в виде
   сверху даёт только ярус и тень, поэтому надстройка строится снизу вверх:
   цоколь темнее палубы, верхняя грань светлее, тень длиннее у того яруса,
   который выше. Всё остальное (материал, свет, роскошь) — следующими
   проходами: сначала тело, потом уже отделка. */
/* ── проход второй: ФАКТУРА ──
   Первый проход дал яхте тело, но шкура на ней осталась общефлотская: листы
   разного тона, швы, заклёпки. Клёпаный лист — это про ремонт в поле, а не про
   деньги. У люкса три фактуры, и ни одной из них нет больше ни у кого:
   лак (глубокий тон + металлик зерном + одна протяжная блик-полоса),
   тик открытой палубы (тёплые доски с тёмным швом) и латунь в канте.
   Рисуется внутри обрезки по корпусу, вместо листов обшивки. */
/* палитра отделки: три школы, и они не смешиваются */
function luxPal(h){
  const st=h.mark.lux&&h.mark.lux.style;
  /* рядовая яхта той же формы, но без денег: крашеный борт, стальная навеска
     и настил из того же металла. Форма — класс, отделка — тир */
  if(!h.lux)return{lac:h.body,trim:h.steel,trimHi:h.lite,deck:mixc(h.steel,[0,0,0],.3)};
  if(st==="pearl")return{lac:mixc(h.col,[255,255,255],.62),
    trim:[206,212,218],trimHi:[252,254,255],deck:[186,182,172]};
  if(st==="noir")return{lac:mixc(h.col,[0,0,0],.86),
    trim:[226,186,102],trimHi:[255,242,206],deck:[86,64,42]};
  return{lac:h.lac,trim:h.gold,trimHi:[255,246,220],deck:h.teak};
}
function drawLuxeSkin(h){
  const P=h.prof,PAL=luxPal(h);
  /* лак: тон глубже корпусного, к борту уходит в почти чёрное */
  const lg=ctx.createLinearGradient(0,-h.bw*1.15,0,h.bw*1.15);
  lg.addColorStop(0,rgba(mixc(PAL.lac,[255,255,255],.30),1));
  lg.addColorStop(.34,rgba(PAL.lac,1));
  lg.addColorStop(1,rgba(mixc(PAL.lac,[0,0,0],.55),1));
  ctx.fillStyle=lg;ctx.fillRect(h.tail-2,-h.bw*1.35,h.len+6,h.bw*2.7);
  /* металлик: зерно из светлых точек. Оно не читается как точки — оно даёт
     лаку глубину, которой не даёт ни один градиент */
  /* зерно мельче и слабее вдвое: на первом заходе точки читались пылью
     на носу, а не глубиной лака */
  for(let i=0;i<220;i++){
    const hh=hashi(i,h.seed,0x9E37);
    const x=lerp(h.nose,h.tail,((hh>>>3)&255)/255);
    const w=profW(P,x), y=(((hh>>>11)&255)/255-.5)*w*1.9;
    ctx.fillStyle="rgba(255,252,240,"+(.025+((hh>>>19)&7)*.006).toFixed(3)+")";
    ctx.fillRect(x,y,.4,.4);
  }
  /* протяжный блик по лаку: одна широкая мягкая полоса вдоль скулы — так
     выглядит полированная поверхность, и только так */
  const sg=ctx.createLinearGradient(0,-h.bw*.95,0,-h.bw*.05);
  sg.addColorStop(0,"rgba(255,255,255,0)");
  sg.addColorStop(.55,"rgba(255,255,255,.16)");
  sg.addColorStop(1,"rgba(255,255,255,0)");
  ctx.fillStyle=sg;ctx.fillRect(h.tail,-h.bw,h.len,h.bw);
  /* тик: НЕ по всему корпусу.
     Первый вариант мостил доской всё от носа до кормы, и яхта читалась плотом:
     дерево там, где под ним салон, — это не роскошь, а паркет. Тик кладётся
     ровно туда, где ходит человек: бак, ют вокруг площадки и две прогулочные
     полосы вдоль борта. Всё остальное — лак. */
  const L=h.mark.lux;
  const zones=[];
  if(L){
    const d0=L.deck[0];
    zones.push([d0.x1,h.nose*.62,-h.bw*1.3,h.bw*1.3]);          // бак
    zones.push([h.tail*.98,d0.x0,-h.bw*1.3,h.bw*1.3]);          // ют
    zones.push([d0.x0,d0.x1,d0.w*.5,h.bw*1.3]);                 // борт правый
    zones.push([d0.x0,d0.x1,-h.bw*1.3,-d0.w*.5]);               // борт левый
  }else zones.push([h.tail*.92,h.nose*.72,-h.bw*1.3,h.bw*1.3]);
  ctx.save();
  ctx.beginPath();
  for(let i=1;i<P.length-1;i++)ctx.lineTo(P[i][0],-P[i][1]*.9);
  for(let i=P.length-2;i>0;i--)ctx.lineTo(P[i][0],P[i][1]*.9);
  ctx.closePath();ctx.clip();
  for(const z of zones){
    const zx=Math.min(z[0],z[1]),zw=Math.abs(z[1]-z[0]),zy=z[2],zh=z[3]-z[2];
    ctx.fillStyle=rgba(mixc(PAL.deck,[20,16,12],.30),1);
    ctx.fillRect(zx,zy,zw,zh);
    ctx.strokeStyle="rgba(28,20,14,.5)";ctx.lineWidth=.3;      // швы между досок
    for(let y=zy;y<zy+zh;y+=1.05){
      ctx.beginPath();ctx.moveTo(zx,y);ctx.lineTo(zx+zw,y);ctx.stroke();
    }
    /* тёмная окантовка настила: у палубы есть край, и он всегда виден */
    ctx.strokeStyle="rgba(24,17,11,.6)";ctx.lineWidth=.5;
    ctx.strokeRect(zx,zy,zw,zh);
    ctx.fillStyle="rgba(255,236,190,.07)";ctx.fillRect(zx,zy,zw,zh); // лак по тику
  }
  /* поперечные стыки досок — вразбежку, иначе палуба читается решёткой */
  ctx.strokeStyle="rgba(28,20,14,.3)";ctx.lineWidth=.3;
  for(let i=0;i<26;i++){
    const hh=hashi(i,h.seed,0x77A1);
    const x=lerp(h.nose*.8,h.tail*.9,((hh>>>4)&63)/63), y=(((hh>>>12)&31)/31-.5)*h.bw*2.2;
    ctx.beginPath();ctx.moveTo(x,y-.55);ctx.lineTo(x,y+.55);ctx.stroke();
  }
  ctx.restore();
  /* латунный кант по борту: две нити, широкая тусклая и узкая яркая —
     полированный металл всегда пара «тело + блик», одной линией он не бывает */
  /* кант идёт от носа только до миделя: на узком длинном корпусе две нити во
     всю длину съедали половину ширины, и тело читалось полосатой рейкой */
  const kEnd=Math.max(2,Math.floor(P.length*.55));
  for(const s of [1,-1]){
    ctx.strokeStyle=rgba(mixc(PAL.trim,[40,26,8],.42),1);ctx.lineWidth=.7;
    ctx.beginPath();
    for(let i=1;i<kEnd;i++)ctx.lineTo(P[i][0],P[i][1]*.86*s);
    ctx.stroke();
    ctx.strokeStyle=rgba(mixc(PAL.trim,[255,240,200],.42),.8);ctx.lineWidth=.3;
    ctx.beginPath();
    for(let i=1;i<kEnd;i++)ctx.lineTo(P[i][0],P[i][1]*.86*s-.45);
    ctx.stroke();
  }
}
function drawLuxeDeck(h,L){
  const PAL=luxPal(h);
  /* тени ярусов: длина тени и есть высота. Один свет на весь корабль */
  for(const d of L.deck)hullShade(h,d.h,()=>{
    ctx.fillRect(d.x0,-d.w*.5,d.x1-d.x0,d.w);
  });
  hullShade(h,.5,()=>{
    ctx.beginPath();ctx.arc(L.pad.x,0,L.pad.r,0,TAU);ctx.fill();
  });
  /* площадка на юте: круг разметки на пустой корме */
  ctx.strokeStyle=rgba(h.lite,.5);ctx.lineWidth=.5;
  ctx.beginPath();ctx.arc(L.pad.x,0,L.pad.r,0,TAU);ctx.stroke();
  ctx.strokeStyle=rgba(h.lite,.22);
  ctx.beginPath();ctx.arc(L.pad.x,0,L.pad.r*.62,0,TAU);ctx.stroke();
  /* прогулочная палуба вдоль борта: ограждение стойками, а не линией —
     по нему и читается, что по борту ходит человек */
  /* ── ограждение ──
     Нитка в .45 со стойками пропадала на любом масштабе мельче трёх: игрок
     видел голый борт там, где должна читаться прогулочная палуба. Ограждение
     работает не линией, а КОНТРАСТОМ: тёмная тень настила под ним и светлый
     поручень над — пара, которая на мелком масштабе сливается в одну заметную
     кромку, а на крупном распадается обратно на стойки и перила. */
  for(const s of [1,-1]){
    const x0=L.rail[0],x1=L.rail[1];
    ctx.strokeStyle="rgba(10,14,20,.5)";ctx.lineWidth=1.1;
    ctx.beginPath();
    for(let x=x0;x>x1;x-=1.2)ctx.lineTo(x,profW(h.prof,x)*.9*s+.5*s);
    ctx.stroke();
    ctx.strokeStyle=rgba(mixc(h.lite,[255,255,255],.5),.85);ctx.lineWidth=.6;
    ctx.beginPath();
    for(let x=x0;x>x1;x-=1.2)ctx.lineTo(x,profW(h.prof,x)*.9*s);
    ctx.stroke();
    ctx.strokeStyle=rgba(h.lite,.3);ctx.lineWidth=.4;
    for(let x=x0;x>x1;x-=2.6){
      const y=profW(h.prof,x)*.9*s;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-1.1*s);ctx.stroke();
    }
  }
  /* тёплый разлив света от салона на палубу: свет, который ничего не освещает,
     — это плёнка поверх кадра, а не свет. Ложится ДО ярусов, чтобы уйти под
     надстройку, а не лечь на неё */
  {
    const d=L.deck[0],dl=d.x1-d.x0;
    for(const s of [1,-1]){
      const y=d.w*.5*s;
      const g=ctx.createLinearGradient(0,y,0,y+1.8*s);
      g.addColorStop(0,"rgba(255,214,150,.16)");
      g.addColorStop(1,"rgba(255,190,120,0)");
      ctx.fillStyle=g;
      ctx.fillRect(d.x0+dl*.08,Math.min(y,y+1.8*s),dl*.84,1.8);
    }
  }
  /* ярусы снизу вверх.
     Надстройка — ЖЕМЧУГ, а не цвет корпуса: белая надстройка на тёмном лаке
     и есть тот контраст, по которому яхту опознают за километр. Ярус выше —
     светлее, и на каждом лежит карбон: тонкая косая сетка, четвёртая фактура
     кадра и единственная в игре. */
  for(let i=0;i<L.deck.length;i++){
    const d=L.deck[i],y0=-d.w*.5,dl=d.x1-d.x0;
    const base=mixc(h.pearl,h.col,.16-i*.05);
    const g=ctx.createLinearGradient(0,y0,0,y0+d.w);
    g.addColorStop(0,rgba(mixc(base,[255,255,255],.22),1));
    g.addColorStop(.45,rgba(base,1));
    g.addColorStop(1,rgba(mixc(base,[24,30,40],.52),1));
    ctx.fillStyle=g;ctx.fillRect(d.x0,y0,dl,d.w);
    /* Косая сетка «карбона» вблизи читалась шашечкой из прозрачных клеток —
       единственное место кадра, где вылезал пиксель. Фактура надстройки теперь
       ПРОДОЛЬНАЯ: две-три тонкие нити вдоль, как стык панелей обтекателя.
       Правило простое: на детали в три пикселя шириной сетка не живёт. */
    ctx.save();
    ctx.beginPath();ctx.rect(d.x0,y0,dl,d.w);ctx.clip();
    ctx.strokeStyle="rgba(20,26,34,.10)";ctx.lineWidth=.3;
    for(let k=1;k<3;k++){
      const ly=y0+d.w*k/3;
      ctx.beginPath();ctx.moveTo(d.x0+dl*.06,ly);ctx.lineTo(d.x0+dl*.94,ly);ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle="rgba(0,0,0,.5)";ctx.fillRect(d.x0,y0+d.w-.6,dl,.6);   // цоколь
    ctx.fillStyle="rgba(255,255,255,.62)";ctx.fillRect(d.x0,y0,dl,.45);  // верхняя грань
    /* латунная окантовка яруса — тот же материал, что и кант по борту */
    ctx.strokeStyle=rgba(mixc(PAL.trim,[40,26,8],.3),.9);ctx.lineWidth=.4;
    ctx.strokeRect(d.x0+.2,y0+.2,dl-.4,d.w-.4);
    /* ── панорама ──
       Двадцать одинаковых окошек по борту — это автобус. У салона стекло
       СПЛОШНОЕ: тёмная полоса от борта до борта яруса, тёплый свет изнутри
       и один косой блик по стеклу. Ярус выше — полоса короче. */
    if(i<2){
      const gy=d.w*(i?.30:.34), gh=Math.max(.9,d.w*.16);
      for(const s of [1,-1]){
        const wy=gy*s-(s>0?0:gh);
        const wg=ctx.createLinearGradient(d.x0,0,d.x1,0);
        wg.addColorStop(0,"rgba(12,20,30,.95)");
        wg.addColorStop(.45,"rgba(255,224,168,.85)");
        wg.addColorStop(.75,"rgba(255,206,140,.55)");
        wg.addColorStop(1,"rgba(12,20,30,.95)");
        ctx.fillStyle=wg;ctx.fillRect(d.x0+dl*.08,wy,dl*.84,gh);
        ctx.strokeStyle=rgba(mixc(PAL.trim,[60,40,14],.25),.9);ctx.lineWidth=.35;
        ctx.strokeRect(d.x0+dl*.08,wy,dl*.84,gh);
        ctx.fillStyle="rgba(255,255,255,.35)";                 // косой блик
        ctx.fillRect(d.x0+dl*.5,wy,dl*.1,gh*.5);
      }
    }else{
      /* ── купол рубки ──
         Верхний ярус с карбоновой сеткой читался куском марли в шашечку.
         На самом верху яхты стоит стеклянный колпак: тёмное стекло, тёплый
         свет из-под него и один блик — половина овала, а не сетка */
      const cx=(d.x0+d.x1)*.5,rx=dl*.42,ry=d.w*.42;
      const dg=ctx.createRadialGradient(cx+rx*.3,-ry*.3,ry*.1,cx,0,rx);
      dg.addColorStop(0,"rgba(255,236,196,.85)");
      dg.addColorStop(.55,"rgba(120,150,175,.5)");
      dg.addColorStop(1,"rgba(14,22,32,.95)");
      ctx.fillStyle=dg;
      ctx.beginPath();ctx.ellipse(cx,0,rx,ry,0,0,TAU);ctx.fill();
      ctx.strokeStyle=rgba(mixc(PAL.trim,[255,244,214],.3),.9);ctx.lineWidth=.4;ctx.stroke();
      ctx.fillStyle="rgba(255,255,255,.4)";
      ctx.beginPath();ctx.ellipse(cx+rx*.28,-ry*.34,rx*.3,ry*.22,-.5,0,TAU);ctx.fill();
    }
  }
  /* ── волнорез ── латунная накладка по обводу носа: нос был тёмным капотом
     с зерном металлика и читался пятном грязи. Металл на носу — то, обо что
     свет бьётся первым, и он обязан быть самым ярким местом корпуса */
  for(const s of [1,-1]){
    ctx.strokeStyle=rgba(mixc(PAL.trim,[255,244,214],.35),.9);ctx.lineWidth=.8;
    ctx.beginPath();
    for(let i=0;i<4;i++)ctx.lineTo(h.prof[i][0],h.prof[i][1]*.92*s);
    ctx.stroke();
  }
  /* ── тендерный гараж ── лацпорт в борту с откинутым трапом: единственная
     поперечная деталь на корпусе, который весь вытянут вдоль */
  if(L.tender){
    const T=L.tender, y=profW(h.prof,T.x)*.92*T.s;
    ctx.fillStyle="rgba(8,12,18,.92)";
    ctx.fillRect(T.x-2.6,Math.min(y,y-1.5*T.s),5.2,1.5);
    ctx.strokeStyle=rgba(mixc(PAL.trim,[40,26,8],.3),.9);ctx.lineWidth=.4;
    ctx.strokeRect(T.x-2.6,Math.min(y,y-1.5*T.s),5.2,1.5);
    /* трап: узкая сходня с поручнем, а не лесенка в четыре ступени. Ступени
       крупнее самой сходни читались приставной стремянкой из хозблока */
    ctx.fillStyle=rgba(mixc(PAL.deck,[255,236,190],.24),.95);
    ctx.fillRect(T.x-.7,y,1.4,2.8*T.s);
    ctx.strokeStyle=rgba(mixc(PAL.trim,[255,244,214],.3),.7);ctx.lineWidth=.3;
    ctx.beginPath();
    ctx.moveTo(T.x-.9,y+.4*T.s);ctx.lineTo(T.x-.9,y+2.8*T.s);
    ctx.moveTo(T.x+.9,y+.4*T.s);ctx.lineTo(T.x+.9,y+2.8*T.s);
    ctx.stroke();
  }
  /* ── имя ── Первый заход ставил его крупно и поперёк палубы, и оно читалось
     подписью к картинке, а не надписью на борту: буквы были одного размера с
     рубкой и лежали поверх настила. Имя живёт НА СКУЛЕ, у самого обвода, на
     баке (там, где нет надстройки), мелко и вполсилы — его замечают, а не
     читают. С одного борта, как всё остальное на этом корпусе. */
  if(L.name&&h.bw>2.2){
    const nx=lerp(h.nose*.74,h.nose*.44,.5), ny=profW(h.prof,nx)*.62;
    ctx.save();
    ctx.translate(nx,-ny);
    ctx.rotate(Math.PI/2);
    ctx.fillStyle=rgba(mixc(PAL.trim,[255,246,220],.25),.6);
    ctx.font="1.5px ui-monospace,monospace";
    ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillText(L.name,0,0);
    ctx.restore();
  }
  /* ── огни палубы ── тёплые точки вдоль ограждения: их не видно днём и
     они и есть вечерний вид яхты */
  ctx.fillStyle="rgba(255,222,170,.75)";
  for(const s of [1,-1])for(let x=L.rail[0];x>L.rail[1];x-=4.5)
    ctx.fillRect(x,profW(h.prof,x)*.9*s-.3,.6,.6);
}
/* ── трафареты и мелочь на борту ──
   То, чем настоящая техника отличается от модели: инвентарные надписи, номера
   у люков, решётки забора, «зебра» у опасных мест, кокарда. Ни одна из этих
   вещей не важна по отдельности — важно, что их МНОГО и они разного размера.
   Рисуется внутри обрезки по корпусу, последним слоем поверх обшивки. */
