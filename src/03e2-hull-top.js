/* ── корпус в виде сверху, куски 2 и 3 (вынесены из 03e-hull-draw 22.10): зовут запекание 03e1 и экраны ── */
/* кусок 2: метки изготовителя и пиратская шкура — поверх строки, под венцами */
function hullPart2(h){
  if(typeof makerMarks==="function")makerMarks(h);
  if(h.pirate)drawPirateSkin(h);
}
/* кусок 3: боксы, антенны, фонарь, свет сверху; киль — отсюда же: он у кормы
   по оси, огни на законцовках, друг друга они не касаются */
function hullPart3(h,id){
  /* ── боксы по бортам ──
     Были голым прямоугольником с полупрозрачной обводкой в .9: вдали сходило,
     вблизи (а игрок приближает часто — иначе корабль мелкий) читалось мыльной
     двойной линией вокруг пустоты. Правило, по которому теперь живёт вся
     навеска: обводка вдвое тоньше и НЕПРОЗРАЧНАЯ, а объём даёт не она, а
     светлая кромка со стороны света, тёмная с теневой и одно ребро внутри. */
  for(const p of h.pods)for(const s of (p[4]?[p[4]]:[1,-1])){
    const y=p[1]*s-(s>0?0:p[3]), w=p[2], hgt=p[3];
    const g=ctx.createLinearGradient(0,y,0,y+hgt);
    g.addColorStop(0,rgba(mixc(h.iron,[255,255,255],.18),1));
    g.addColorStop(1,rgba(mixc(h.iron,[0,0,0],.5),1));
    ctx.fillStyle=g;ctx.fillRect(p[0],y,w,hgt);
    ctx.fillStyle=rgba(mixc(h.iron,[255,255,255],.55),1);
    ctx.fillRect(p[0],y,w,.45);                                        // кромка света
    ctx.fillStyle="rgba(0,0,0,.55)";ctx.fillRect(p[0],y+hgt-.45,w,.45); // теневая
    ctx.strokeStyle=rgba(mixc(h.col,[6,10,17],.45),1);ctx.lineWidth=.45;
    ctx.strokeRect(p[0]+.22,y+.22,w-.44,hgt-.44);
    ctx.fillStyle="rgba(0,0,0,.32)";ctx.fillRect(p[0]+w*.62,y+.6,.5,hgt-1.2);
  }
  /* ── антенны ── */
  /* антенна тоже не обязана быть парной: половина мачт стоит с одного борта —
     последний кусок зеркальности, из-за которого корпус читался гербом */
  ctx.strokeStyle=rgba(h.col,.5);ctx.lineWidth=.5;
  for(const a of h.ants)for(const s of (a[4]?[a[4]]:[1,-1])){
    ctx.beginPath();ctx.moveTo(a[0],a[1]*s);
    ctx.lineTo(a[0]-a[2]*Math.sin(a[3]),(a[1]-a[2])*s);ctx.stroke();
  }
  /* ── фонарь кабины ── у кого есть рубка, фонаря нет: колпак истребителя на
     рудовозе был самой нелепой деталью листа */
  const cp=h.canopy;
  if(!h.mark.bridge){
  ctx.fillStyle="rgba(10,26,38,.95)";
  ctx.beginPath();ctx.ellipse(cp.x,0,cp.rx,cp.ry,0,0,TAU);ctx.fill();
  ctx.strokeStyle=rgba(h.lite,.6);ctx.lineWidth=.5;ctx.stroke();
  const cg=ctx.createLinearGradient(cp.x+cp.rx,0,cp.x-cp.rx,0);
  cg.addColorStop(0,"rgba(180,240,255,.55)");cg.addColorStop(1,"rgba(120,200,230,0)");
  ctx.fillStyle=cg;
  ctx.beginPath();ctx.ellipse(cp.x,0,cp.rx*.86,cp.ry*.72,0,0,TAU);ctx.fill();
  /* ── переплёт фонаря ──
     Голубой овал читался глазом, приклеенным к носу. У кабины есть переплёт:
     две-три поперечные рамы и продольный гребень. Стекло от этого перестаёт
     быть каплей краски и становится остеклением, за которым сидят. */
  if(!h.yac){
    ctx.strokeStyle="rgba(12,20,28,.85)";ctx.lineWidth=.45;
    for(let k=1;k<3;k++){
      const x=cp.x-cp.rx+cp.rx*2*k/3;
      const yr=cp.ry*Math.sqrt(Math.max(0,1-Math.pow((x-cp.x)/cp.rx,2)));
      ctx.beginPath();ctx.moveTo(x,-yr);ctx.lineTo(x,yr);ctx.stroke();
    }
    ctx.beginPath();ctx.moveTo(cp.x-cp.rx,0);ctx.lineTo(cp.x+cp.rx,0);ctx.stroke();
    ctx.strokeStyle="rgba(255,255,255,.22)";ctx.lineWidth=.35;
    ctx.beginPath();ctx.moveTo(cp.x-cp.rx*.5,-cp.ry*.5);ctx.lineTo(cp.x+cp.rx*.6,-cp.ry*.2);
    ctx.stroke();
  }
  }
  /* ── свет сверху и не-зеркальность (хвост M55, корабли) ──
     Корпус был симметричен и плоско освещён. Поверх обвода — градиент
     (свет слева-сверху, тень к правому борту) клипом по силуэту; и одна
     деталь по одному борту — штанга датчика с головкой, от семени, чтобы
     левый борт не был копией правого */
  {
    ctx.save();tracePoly(h.poly);ctx.clip();
    const lg=ctx.createLinearGradient(0,-h.bw,0,h.bw);
    lg.addColorStop(0,"rgba(255,248,230,.10)");lg.addColorStop(.5,"rgba(255,255,255,0)");lg.addColorStop(1,"rgba(0,0,10,.16)");
    ctx.fillStyle=lg;ctx.fillRect(h.tail-4,-h.bw-4,h.nose-h.tail+8,h.bw*2+8);
    ctx.restore();
    const hs=hashi(typeof id==="string"?id.length*31+id.charCodeAt(0):(id|0),0xA5,3), side=(hs&1)?1:-1;
    const bx=h.tail+(h.nose-h.tail)*(.35+((hs>>>1)&3)*.1), by=profW(h.prof,bx)*.9*side;
    ctx.strokeStyle=rgba(h.dark,.9);ctx.lineWidth=.7;
    ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx-2,by+side*3.2);ctx.stroke();
    ctx.fillStyle=rgba(h.lite,.8);ctx.beginPath();ctx.arc(bx-2,by+side*3.2,.7,0,TAU);ctx.fill();
  }
  if(h.fin){
    ctx.strokeStyle=rgba(h.lite,.45);ctx.lineWidth=.5;
    ctx.beginPath();ctx.moveTo(h.tail*.65,0);ctx.lineTo(h.tail-3.5,0);ctx.stroke();
  }
}