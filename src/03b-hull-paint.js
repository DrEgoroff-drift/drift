function tracePoly(pts,sy){
  ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]*(sy||1));
  for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]*(sy||1));
  ctx.closePath();
}
/* факел: мягкое зарево + перо + добела раскалённое ядро.
   `cool` — люксовая тяга: вдвое короче, бело-голубая и почти без зарева.
   Оранжевый костёр на корме читается работой и топливом; дорогая вещь
   уходит тихо, и это видно раньше, чем читается название класса. */
function drawFlame(x,y,rad,pow,cool){
  const f=rad*(cool?1.5+Math.random()*.8:2.4+Math.random()*1.7)*pow;
  const gl=ctx.createRadialGradient(x-f*.25,y,0,x-f*.25,y,f*1.15);
  if(cool){gl.addColorStop(0,"rgba(150,205,255,.2)");gl.addColorStop(1,"rgba(110,170,255,0)");}
  else{gl.addColorStop(0,"rgba(255,180,110,.34)");gl.addColorStop(1,"rgba(255,120,60,0)");}
  ctx.fillStyle=gl;ctx.beginPath();ctx.arc(x-f*.25,y,f*1.15,0,TAU);ctx.fill();
  const g=ctx.createLinearGradient(x,y,x-f,y);
  if(cool){
    g.addColorStop(0,"rgba(255,255,255,.95)");g.addColorStop(.24,"rgba(198,232,255,.8)");
    g.addColorStop(.62,"rgba(126,178,255,.34)");g.addColorStop(1,"rgba(90,140,240,0)");
  }else{
  g.addColorStop(0,"rgba(255,246,220,.95)");g.addColorStop(.2,"rgba(255,194,112,.86)");
  g.addColorStop(.58,"rgba(255,116,62,.42)");g.addColorStop(1,"rgba(255,70,40,0)");}
  ctx.fillStyle=g;ctx.beginPath();
  ctx.moveTo(x,y-rad);
  ctx.quadraticCurveTo(x-f*.45,y-rad*.55,x-f,y);
  ctx.quadraticCurveTo(x-f*.45,y+rad*.55,x,y+rad);
  ctx.closePath();ctx.fill();
  /* ядро. Раскалённая сердцевина треугольником вблизи читается стрелкой —
     на венце из четырёх сопел получался ряд белых указателей. У холодной
     тяги ядро мягкое: вытянутая капля вдвое уже пера */
  if(cool){
    const cg=ctx.createLinearGradient(x,y,x-f*.5,y);
    cg.addColorStop(0,"rgba(255,255,255,.85)");
    cg.addColorStop(1,"rgba(210,235,255,0)");
    ctx.fillStyle=cg;
    ctx.beginPath();
    ctx.moveTo(x,y-rad*.3);
    ctx.quadraticCurveTo(x-f*.3,y-rad*.12,x-f*.5,y);
    ctx.quadraticCurveTo(x-f*.3,y+rad*.12,x,y+rad*.3);
    ctx.closePath();ctx.fill();
  }else{
  ctx.fillStyle="rgba(255,255,242,.8)";
  ctx.beginPath();ctx.moveTo(x,y-rad*.46);ctx.lineTo(x-f*.4,y);ctx.lineTo(x,y+rad*.46);
  ctx.closePath();ctx.fill();}
}
/* крен в виде сверху: скос + сжатие по размаху — ровно так кренящийся
   корпус и проецируется на плоскость экрана */
function bankTransform(bank){
  if(!bank)return false;
  ctx.save();
  /* сжатие по Y вместо скоса — так силуэт по-настоящему сужается, будто корпус
     поворачивается вокруг продольной оси, а не просто едет "плашмя" вбок */
  ctx.transform(1,0,0,Math.cos(bank),0,0);
  return true;
}
/* ── отделка по тиру ──
   Тир — не строчка в карточке, а то, как корпус выглядит. Рабочая лошадка ходит
   в заплатах и потёках, редкий носит акцентную окантовку, легендарный — двойной
   кант и эмблему на скуле, люкс — ленту окон и глянцевую блик-полосу, опытный
   показывает открытые узлы и кабели, которые на серийном закрыли бы кожухом.
   Рисуется ПОД навеской класса: это шкура корпуса, а не то, что на него навесили. */
function drawTierTrim(h){
  const t=h.tier;if(!t||t==="line")return;
  const P=h.prof,r=rng(hashi(h.seed||1,0x71E4,3));
  if(t==="work"){
    /* заплаты: куски обшивки другого тона и потёки под ними */
    const n=3+((r()*3)|0);
    for(let i=0;i<n;i++){
      const x=lerp(h.nose*.7,h.tail*.85,r()),w=profW(P,x);
      const px=x,py=(r()*2-1)*w*.55,pw=2.2+r()*4,ph=1.6+r()*2.6;
      ctx.fillStyle="rgba(0,0,0,.34)";ctx.fillRect(px-pw/2,py-ph/2,pw,ph);
      ctx.strokeStyle=rgba(h.lite,.34);ctx.lineWidth=.7;
      ctx.strokeRect(px-pw/2,py-ph/2,pw,ph);
      ctx.fillStyle="rgba(0,0,0,.14)";                 // потёк вниз по потоку
      ctx.fillRect(px-pw*.2,py+ph/2,pw*.4,1.4+r()*2.6);
    }
  }else if(t==="rare"){
    /* На костяном борту светлый кант пропал вовсе: белым по белому тир не
       читался, то есть игрок не видел, что корабль редкий. Метка редкого —
       ДВЕ нити краски по борту, тёмная и в цвет акцента: так метят технику
       ограниченной серии, и это видно на любом фоне. */
    for(const s of [1,-1]){
      ctx.strokeStyle="rgba(24,28,34,.55)";ctx.lineWidth=.9;
      ctx.beginPath();
      for(let i=1;i<P.length-1;i++)ctx.lineTo(P[i][0],P[i][1]*.86*s);
      ctx.stroke();
      ctx.strokeStyle=rgba(h.accent,.9);ctx.lineWidth=.5;
      ctx.beginPath();
      for(let i=1;i<P.length-1;i++)ctx.lineTo(P[i][0],P[i][1]*.86*s-.7*s);
      ctx.stroke();
    }
  }else if(t==="legend"){
    /* легенда — тот же приём, но в два пояса и с клеймом: у машины, которую
       знают по имени, метка крупнее и стоит на скуле, где её видно первой */
    for(const s of [1,-1])for(const f of [.9,.66]){
      ctx.strokeStyle="rgba(20,24,30,.6)";ctx.lineWidth=1.2;
      ctx.beginPath();
      for(let i=1;i<P.length-1;i++)ctx.lineTo(P[i][0],P[i][1]*f*s);
      ctx.stroke();
      ctx.strokeStyle=rgba(mixc(h.accent,[255,220,150],.35),.95);ctx.lineWidth=.55;
      ctx.beginPath();
      for(let i=1;i<P.length-1;i++)ctx.lineTo(P[i][0],P[i][1]*f*s-.6*s);
      ctx.stroke();
    }
    const ex=h.nose*.42,ew=Math.max(1.6,profW(P,ex)*.34);  // клеймо на скуле
    for(const s of [1,-1]){
      ctx.fillStyle=rgba(mixc(h.accent,[255,224,160],.4),.95);
      ctx.beginPath();ctx.moveTo(ex+ew,ew*.2*s);ctx.lineTo(ex,ew*1.2*s);
      ctx.lineTo(ex-ew,ew*.2*s);ctx.closePath();ctx.fill();
      ctx.strokeStyle="rgba(20,24,30,.6)";ctx.lineWidth=.35;ctx.stroke();
    }
  }else if(t==="luxe"){
    /* у люксовой ЯХТЫ вся отделка своя (drawLuxeSkin/drawLuxeDeck): лента
       автобусных окон по борту была первым, что выдавало в ней курьера */
    if(h.lux)return;
    /* лента окон по борту и глянец: яхту опознают по свету изнутри */
    for(const s of [1,-1]){
      const y0=h.nose*.42,y1=h.tail*.5;
      // окна крупнее и с тёплым свечением: на листе флота лента в полтора
      // пикселя пропадала, и яхта читалась курьером
      for(let x=y1;x<y0;x+=3.2){
        const w=profW(P,x);if(w<1.2)continue;
        ctx.fillStyle="rgba(255,236,190,.85)";
        ctx.fillRect(x,w*.72*s-.9,2.2,1.9);
        ctx.fillStyle="rgba(255,214,150,.22)";
        ctx.fillRect(x-.8,w*.72*s-1.7,3.8,3.5);
      }
      ctx.strokeStyle="rgba(255,255,255,.35)";ctx.lineWidth=.7;
      ctx.beginPath();
      for(let i=1;i<P.length-1;i++)ctx.lineTo(P[i][0],P[i][1]*.34*s);
      ctx.stroke();
    }
    const gg=ctx.createLinearGradient(h.nose,0,h.tail,0);  // продольный глянец
    gg.addColorStop(0,"rgba(255,255,255,.18)");
    gg.addColorStop(.45,"rgba(255,255,255,.02)");
    gg.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=gg;
    ctx.beginPath();
    for(let i=1;i<P.length-1;i++)ctx.lineTo(P[i][0],-P[i][1]*.55);
    for(let i=P.length-2;i>0;i--)ctx.lineTo(P[i][0],-P[i][1]*.12);
    ctx.closePath();ctx.fill();
  }else if(t==="proto"){
    /* открытые узлы: рама наружу, кабельная коса вдоль борта */
    ctx.strokeStyle="rgba(255,157,122,.5)";ctx.lineWidth=.7;
    for(const s of [1,-1]){
      ctx.beginPath();
      for(let i=2;i<P.length-2;i++)ctx.lineTo(P[i][0],P[i][1]*(.5+(i%2)*.28)*s);
      ctx.stroke();
    }
    for(let i=3;i<P.length-2;i+=2){                    // поперечины рамы
      ctx.strokeStyle="rgba(0,0,0,.35)";
      ctx.beginPath();ctx.moveTo(P[i][0],-P[i][1]*.8);ctx.lineTo(P[i][0],P[i][1]*.8);ctx.stroke();
    }
  }
}
/* приметы класса рисуются поверх корпуса, но под фонарём и огнями: это
   навеска, а не корпус, и она обязана читаться отдельным слоем */
/* ── тени навески на корпус ──
   Главное, чего кораблю не хватало: всё лежало в одной плоскости, и гондола
   ничем не отличалась от нарисованного на борту прямоугольника. Свет в кадре
   один и тот же для всех корпусов (сверху-слева, как на поверхности планеты),
   поэтому тень падает вниз-вправо, а её длина — это и есть высота детали.
   Тень клипуется по корпусу: за борт она уходить не должна, там пустота. */
const SH_DX=1.7, SH_DY=1.25;
function hullShade(h,hgt,fn){
  ctx.save();
  tracePoly(h.poly);ctx.clip();
  ctx.translate(SH_DX*hgt,SH_DY*hgt);
  ctx.fillStyle="rgba(0,0,0,.38)";
  fn();
  ctx.restore();
}
function drawHullMarks(h){
  const M=h.mark;if(!M)return;
  /* ── контактная тень ──
     Навеска отбрасывала тень только по своим габаритам, и в месте, где она
     СТОИТ на обшивке, стыка не было — деталь выглядела наклеенной. На листах
     под каждым агрегатом лежит короткая плотная тень у самого основания,
     помимо длинной по высоте. Это дешевле любой светотени и решает всё. */
  hullShade(h,.35,()=>{
    ctx.fillStyle="rgba(0,0,0,.5)";
    for(const n of h.nacs)for(const s of [1,-1])
      ctx.fillRect(n.x-n.l*.55,n.y*s-n.r*1.12,n.l*1.1,n.r*2.24);
    if(M.cont)for(const c of M.cont)for(const s of [1,-1]){
      const y=c[2]*s;
      ctx.fillRect(c[0]-.6,(s>0?y-c[2]*.55:y-c[2]*.45)-.6,c[1]+1.2,c[2]+1.2);
    }
    if(M.bridge)ctx.fillRect(M.bridge.x-M.bridge.l*.55,-M.bridge.w*.55,
                             M.bridge.l*1.1,M.bridge.w*1.1);
  });
  /* один проход теней на всю навеску: высота у каждой семьи своя */
  hullShade(h,1,()=>{
    for(const n of h.nacs)for(const s of [1,-1]){
      const y=n.y*s;
      ctx.fillRect(n.x-n.l*.5,y-n.r,n.l,n.r*2);
    }
    for(const p of h.pods)for(const s of (p[4]?[p[4]]:[1,-1]))
      ctx.fillRect(p[0],p[1]*s-(s>0?0:p[3]),p[2],p[3]);
    if(M.cont)for(const c of M.cont)for(const s of [1,-1]){
      const y=c[2]*s;
      ctx.fillRect(c[0],s>0?y-c[2]*.55:y-c[2]*.45,c[1],c[2]);
    }
    if(M.guns)for(const g of M.guns)for(const s of [1,-1])
      ctx.fillRect(g[0]-4.5,g[1]*s-2.2,9,4.4);
  });
  /* рубка выше всего остального, поэтому её тень длиннее */
  if(M.bridge)hullShade(h,1.9,()=>{
    ctx.fillRect(M.bridge.x-M.bridge.l*.5,-M.bridge.w*.5,M.bridge.l,M.bridge.w);
  });
  if(M.cont)M.cont.forEach((c,ci)=>{for(const s of [1,-1]){
    const y=c[2]*s;
    /* контейнер — чужая тара, а не часть корабля: он из голого металла и
       цвета владельца не имеет. Один этот сдвиг материала снимает половину
       «пластиковости»: корабль перестаёт быть выкрашенным целиком */
    const gy=s>0?y-c[2]*.55:y-c[2]*.45;
    /* ── тара разного хозяина ──
       Контейнеры были одного стального тона, и палуба читалась одной деталью
       с насечками. На листах это главное украшение грузовика: ящики РАЗНЫЕ —
       синий, ржавый, оливковый, выгоревший серый, каждый со своей историей.
       Тон берётся от индекса и семени, поэтому у корабля он постоянен. */
    const CARGO=[[62,86,116],[128,72,44],[86,92,64],[112,116,120],[54,60,70]];
    const cc=CARGO[hashi(ci,h.seed,0x3F1)%CARGO.length];
    const g=ctx.createLinearGradient(0,gy,0,gy+c[2]);
    g.addColorStop(0,rgba(mixc(cc,[255,255,255],.26),1));
    g.addColorStop(1,rgba(mixc(cc,[0,0,0],.5),1));
    ctx.fillStyle=g;ctx.strokeStyle=rgba(mixc(h.steel,[0,0,0],.7),1);ctx.lineWidth=.45;
    ctx.beginPath();ctx.rect(c[0],gy,c[1],c[2]);
    ctx.fill();ctx.stroke();
    /* стяжки контейнера: без них ящик читается пустым прямоугольником */
    ctx.strokeStyle="rgba(0,0,0,.42)";ctx.lineWidth=.7;
    ctx.beginPath();
    ctx.moveTo(c[0]+c[1]*.5,s>0?y-c[2]*.55:y-c[2]*.45);
    ctx.lineTo(c[0]+c[1]*.5,(s>0?y-c[2]*.55:y-c[2]*.45)+c[2]);
    ctx.stroke();
  }});
  if(M.drill){
    const d=M.drill;
    ctx.fillStyle=rgba(h.lite,.85);
    ctx.beginPath();
    ctx.moveTo(d.x+d.l,0);ctx.lineTo(d.x,-d.r);ctx.lineTo(d.x,d.r);ctx.closePath();
    ctx.fill();
    ctx.strokeStyle=rgba(h.dark,1);ctx.lineWidth=.45;
    for(let i=1;i<4;i++){
      const t=i/4;
      ctx.beginPath();
      ctx.moveTo(d.x+d.l*t,-d.r*(1-t));ctx.lineTo(d.x+d.l*t,d.r*(1-t));ctx.stroke();
    }
  }
  /* Спонсон: площадка за бортом на короткой консоли, на ней тумба и ствол
     вперёд. Раньше ствол лежал вдоль скулы внутри контура — на силуэте его
     не было вовсе, и фрегат читался разведчиком. */
  if(M.guns)for(const g of M.guns)for(const s of [1,-1]){
    const y=g[1]*s;
    ctx.strokeStyle=rgba(h.col,.75);ctx.lineWidth=.55;
    ctx.beginPath();ctx.moveTo(g[0]-1,h.bw*.5*s);ctx.lineTo(g[0]-1,y);ctx.stroke();
    ctx.fillStyle=rgba(h.body,1);
    ctx.strokeStyle=rgba(h.lite,.5);ctx.lineWidth=.45;
    ctx.beginPath();ctx.rect(g[0]-4.5,y-2.2*s-(s>0?0:0),9,4.4*s);
    ctx.fill();ctx.stroke();
    /* Ствол был линией с шариком на конце — на листе это читалось грибом
       на ножке. У ствола есть казённик (толстый, у самой тумбы), тело,
       сходящее на конус, и дульный срез — короткое утолщение, а не шар. */
    ctx.fillStyle=rgba(h.steel,1);
    ctx.fillRect(g[0]+.5,y-1.05,3.2,2.1);
    ctx.beginPath();
    ctx.moveTo(g[0]+3.4,y-.8);ctx.lineTo(g[0]+g[2]-1.4,y-.45);
    ctx.lineTo(g[0]+g[2]-1.4,y+.45);ctx.lineTo(g[0]+3.4,y+.8);
    ctx.closePath();ctx.fill();
    ctx.fillStyle=rgba(mixc(h.steel,[0,0,0],.42),1);
    ctx.fillRect(g[0]+g[2]-1.6,y-.8,1.7,1.6);
    ctx.fillStyle=rgba(h.dark,1);
    ctx.fillRect(g[0]+g[2]-.45,y-.3,.6,.6);
  }
  if(M.armor){
    /* скула: утолщённая носовая плита, из-за неё фрегат выглядит тупоносым */
    ctx.fillStyle=rgba(h.lite,.28);
    ctx.beginPath();
    ctx.moveTo(h.nose,0);
    ctx.lineTo(M.armor,-profW(h.prof,M.armor)*.92);
    ctx.lineTo(M.armor,profW(h.prof,M.armor)*.92);
    ctx.closePath();ctx.fill();
    ctx.strokeStyle=rgba(h.col,.6);ctx.lineWidth=.5;ctx.stroke();
  }
  /* Панели раскрыты поперёк корпуса на кронштейнах и разбиты на секции: это
     плоскость, а не полоска у борта. Прямые углы против стреловидного крыла —
     единственное, что надёжно отличает исследователя от разведчика. */
  if(M.panel)for(const s of [1,-1]){
    const p=M.panel, y0=p.w*s, th=3.4;
    ctx.strokeStyle=rgba(h.col,.6);ctx.lineWidth=.5;
    ctx.beginPath();
    ctx.moveTo(p.x-p.l*.22,h.bw*.5*s);ctx.lineTo(p.x-p.l*.16,y0);
    ctx.moveTo(p.x+p.l*.22,h.bw*.5*s);ctx.lineTo(p.x+p.l*.16,y0);
    ctx.stroke();
    ctx.fillStyle="rgba(34,58,96,.9)";
    ctx.strokeStyle=rgba(h.lite,.55);ctx.lineWidth=.5;
    const py=y0-(s>0?0:th);
    ctx.beginPath();ctx.rect(p.x-p.l*.5,py,p.l,th);ctx.fill();ctx.stroke();
    ctx.strokeStyle="rgba(150,190,230,.30)";ctx.lineWidth=.7;
    for(let k=1;k<4;k++){
      const gx=p.x-p.l*.5+p.l*k/4;
      ctx.beginPath();ctx.moveTo(gx,py);ctx.lineTo(gx,py+th);ctx.stroke();
    }
  }
  if(M.dish){
    const d=M.dish, dy=-h.bw-d.boom;
    ctx.strokeStyle=rgba(h.col,.6);ctx.lineWidth=.5;
    ctx.beginPath();ctx.moveTo(d.x,0);ctx.lineTo(d.x-d.boom*.4,dy);ctx.stroke();
    ctx.fillStyle="rgba(200,230,245,.22)";
    ctx.strokeStyle=rgba(h.lite,.7);ctx.lineWidth=.5;
    ctx.beginPath();
    ctx.ellipse(d.x-d.boom*.4,dy,d.r,d.r*.55,-.5,0,TAU);
    ctx.fill();ctx.stroke();
    /* облучатель на трёх ногах: без него тарелка читается блином */
    if(d.r>2.6){
      ctx.strokeStyle=rgba(h.lite,.5);ctx.lineWidth=.7;
      ctx.beginPath();
      ctx.moveTo(d.x-d.boom*.4-d.r*.7,dy);ctx.lineTo(d.x-d.boom*.4+d.r*.15,dy-d.r*.8);
      ctx.lineTo(d.x-d.boom*.4+d.r*.7,dy);ctx.stroke();
    }
  }
  /* ── рубка ── стоит НАД палубой: тёмный цоколь по нижней кромке, светлый
     верх, ряд окон по фронту. Ярусность и есть тот объём, которого нет у
     плоского вида сверху: у детали появляется низ и верх, а не только пятно */
  if(M.bridge){
    const B=M.bridge, x0=B.x-B.l*.5, y0=-B.w*.5;
    const g=ctx.createLinearGradient(0,y0,0,y0+B.w);
    g.addColorStop(0,rgba(mixc(h.body,[255,255,255],.24),1));
    g.addColorStop(.55,rgba(h.body,1));
    g.addColorStop(1,rgba(h.dark,1));
    ctx.fillStyle=g;ctx.fillRect(x0,y0,B.l,B.w);
    ctx.fillStyle="rgba(0,0,0,.5)";ctx.fillRect(x0,y0+B.w-.7,B.l,.7);  // цоколь
    ctx.fillStyle=rgba(h.lite,.55);ctx.fillRect(x0,y0,B.l,.5);         // верхняя грань
    ctx.strokeStyle=rgba(h.dark,1);ctx.lineWidth=.45;
    ctx.strokeRect(x0+.22,y0+.22,B.l-.44,B.w-.44);
    /* окна рубки по фронту — вперёд смотрят люди, а не пушки */
    ctx.fillStyle="rgba(186,232,250,.62)";
    const wn=Math.max(2,Math.round(B.w/2.2));
    for(let i=0;i<wn;i++)
      ctx.fillRect(x0+B.l-1.5,y0+1+i*(B.w-2)/wn,1,Math.max(.8,(B.w-2)/wn-.7));
  }
  /* ── причальный узел ──
     Хвост, записанный в план ещё после яхты: кольцо было тремя серыми
     окружностями — шайба, приклеенная к борту, самая дешёвая деталь на
     корпусе, где всё остальное уже доведено. Настоящий узел — это ВОРОТНИК:
     утопленная площадка с тёмным жерлом, кольцевой фланец с крепежом по
     кругу, три захвата и белая наводочная метка, по которой к нему целятся.
     Здесь не нужен ни один новый приём — только те, что уже работают на
     обшивке: тон, тень, крепёж, краска. */
  if(M.dock){
    const D2=M.dock, y=profW(h.prof,D2.x)*.86*D2.s, R=D2.r*1.15;
    const met=h.yac?h.steel:h.iron;
    ctx.fillStyle="rgba(0,0,0,.4)";                       // тень воротника
    ctx.beginPath();ctx.arc(D2.x+.5,y+.5,R*1.12,0,TAU);ctx.fill();
    const g=ctx.createRadialGradient(D2.x-R*.4,y-R*.4,R*.1,D2.x,y,R*1.1);
    g.addColorStop(0,rgba(mixc(met,[255,255,255],.42),1));
    g.addColorStop(1,rgba(mixc(met,[0,0,0],.2),1));
    ctx.fillStyle=g;
    ctx.beginPath();ctx.arc(D2.x,y,R*1.1,0,TAU);ctx.fill();
    ctx.strokeStyle=rgba(mixc(met,[0,0,0],.7),1);ctx.lineWidth=.45;ctx.stroke();
    ctx.fillStyle="rgba(6,8,12,.95)";                     // жерло
    ctx.beginPath();ctx.arc(D2.x,y,R*.5,0,TAU);ctx.fill();
    ctx.strokeStyle=rgba(mixc(met,[255,255,255],.3),.9);ctx.lineWidth=.35;ctx.stroke();
    ctx.fillStyle=rgba(mixc(met,[0,0,0],.55),1);          // крепёж по фланцу
    for(let i=0;i<8;i++){
      const a=i*TAU/8+.2;
      ctx.beginPath();ctx.arc(D2.x+Math.cos(a)*R*.82,y+Math.sin(a)*R*.82,.28,0,TAU);ctx.fill();
    }
    ctx.strokeStyle=rgba(mixc(met,[255,255,255],.25),1);ctx.lineWidth=.5;
    for(let i=0;i<3;i++){                                 // захваты
      const a=i*TAU/3+.4;
      ctx.beginPath();
      ctx.moveTo(D2.x+Math.cos(a)*R*.52,y+Math.sin(a)*R*.52);
      ctx.lineTo(D2.x+Math.cos(a)*R*1.02,y+Math.sin(a)*R*1.02);ctx.stroke();
    }
    if(!h.yac){                                           // наводочная метка
      ctx.strokeStyle="rgba(236,236,228,.75)";ctx.lineWidth=.4;
      ctx.beginPath();
      ctx.moveTo(D2.x-R*1.5,y);ctx.lineTo(D2.x-R*1.15,y);
      ctx.moveTo(D2.x+R*1.15,y);ctx.lineTo(D2.x+R*1.5,y);ctx.stroke();
    }
  }
  /* ── шлюз ── с одного борта, с поручнем: место, куда выходит человек.
     Масштаб задаётся им же — по люку видно, какого корабль размера */
  if(M.lock&&M.lock.r>1){
    const L=M.lock, y=profW(h.prof,L.x)*.72*L.s;
    const met=h.yac?h.steel:h.iron;
    /* второй хвост из плана: люк был кружком в кружке. Люк, из которого
       выходит человек, устроен иначе — он ОБРАМЛЁН: утопленная рама, створка
       со скруглением, ручка-штурвал посередине, поручень рядом и жёлтая
       окантовка проёма. По нему же читается размер всего корабля. */
    ctx.fillStyle="rgba(0,0,0,.38)";
    ctx.fillRect(L.x-L.r*1.15+.4,y-L.r*1.05+.4,L.r*2.3,L.r*2.1);
    ctx.fillStyle=rgba(mixc(met,[0,0,0],.35),1);
    ctx.fillRect(L.x-L.r*1.15,y-L.r*1.05,L.r*2.3,L.r*2.1);
    ctx.strokeStyle="rgba(196,142,52,.4)";ctx.lineWidth=.35;  // окантовка проёма
    ctx.strokeRect(L.x-L.r*1.15,y-L.r*1.05,L.r*2.3,L.r*2.1);
    const g=ctx.createLinearGradient(0,y-L.r,0,y+L.r);
    g.addColorStop(0,rgba(mixc(met,[255,255,255],.34),1));
    g.addColorStop(1,rgba(mixc(met,[0,0,0],.5),1));
    ctx.fillStyle=g;
    ctx.beginPath();ctx.arc(L.x,y,L.r*.82,0,TAU);ctx.fill();
    ctx.strokeStyle="rgba(0,0,0,.55)";ctx.lineWidth=.4;ctx.stroke();
    ctx.strokeStyle=rgba(mixc(met,[255,255,255],.4),1);ctx.lineWidth=.4;
    for(let i=0;i<4;i++){                                     // штурвал
      const a=i*TAU/4+.3;
      ctx.beginPath();
      ctx.moveTo(L.x+Math.cos(a)*L.r*.18,y+Math.sin(a)*L.r*.18);
      ctx.lineTo(L.x+Math.cos(a)*L.r*.6,y+Math.sin(a)*L.r*.6);ctx.stroke();
    }
    ctx.beginPath();ctx.arc(L.x,y,L.r*.2,0,TAU);ctx.stroke();
    ctx.strokeStyle=rgba(mixc(met,[255,255,255],.2),1);ctx.lineWidth=.4;  // поручень
    ctx.beginPath();
    ctx.moveTo(L.x-L.r*1.5,y+L.r*1.35*L.s);ctx.lineTo(L.x+L.r*1.5,y+L.r*1.35*L.s);
    ctx.moveTo(L.x-L.r*1.5,y+L.r*1.35*L.s);ctx.lineTo(L.x-L.r*1.4,y+L.r*1.05*L.s);
    ctx.moveTo(L.x+L.r*1.5,y+L.r*1.35*L.s);ctx.lineTo(L.x+L.r*1.4,y+L.r*1.05*L.s);
    ctx.stroke();
  }
  /* ── манипулятор ── одна штука, с одного борта, сложен вдоль корпуса */
  if(M.arm){
    const A=M.arm, y=profW(h.prof,A.x)*.85*A.s;
    ctx.strokeStyle=rgba(h.steel,1);ctx.lineWidth=1;
    ctx.beginPath();
    ctx.moveTo(A.x,y);ctx.lineTo(A.x+A.a1,y+A.a1*.35*A.s);
    ctx.lineTo(A.x+A.a1-A.a2*.7,y+(A.a1*.35+A.a2)*A.s);ctx.stroke();
    ctx.fillStyle=rgba(h.steel,1);
    ctx.beginPath();ctx.arc(A.x,y,1.1,0,TAU);ctx.fill();
    ctx.beginPath();ctx.arc(A.x+A.a1,y+A.a1*.35*A.s,.9,0,TAU);ctx.fill();
    ctx.strokeStyle=rgba(h.lite,.55);ctx.lineWidth=.4;   // схват
    const gx=A.x+A.a1-A.a2*.7, gy=y+(A.a1*.35+A.a2)*A.s;
    ctx.beginPath();ctx.moveTo(gx-1.4,gy);ctx.lineTo(gx,gy+1.6*A.s);
    ctx.lineTo(gx+1.4,gy);ctx.stroke();
  }
  /* ── бортовой номер ── трафаретом, вдоль борта, всегда мельче всего
     остального: его не читают, его замечают */
  if(M.num&&h.bw>2.6){
    ctx.save();
    /* номер лежит на СВОЁМ поле: светлая плашка с тёмной рамкой. Без неё
       буквы плавали поверх швов и разнотона и читались водяным знаком */
    if(!h.yac){
      ctx.save();
      ctx.translate(lerp(h.nose*.35,h.tail*.5,.5),-h.bw*.52);
      ctx.rotate(Math.PI/2);
      const tw=M.num.length*1.7;
      ctx.fillStyle="rgba(228,228,220,.85)";ctx.fillRect(-tw/2-.6,-1.7,tw+1.2,3.4);
      ctx.strokeStyle="rgba(20,24,30,.5)";ctx.lineWidth=.35;
      ctx.strokeRect(-tw/2-.6,-1.7,tw+1.2,3.4);
      ctx.restore();
    }
    ctx.fillStyle=h.yac?"rgba(232,238,245,.42)":"rgba(24,28,34,.9)";
    ctx.font="2.6px ui-monospace,monospace";
    ctx.textAlign="center";ctx.textBaseline="middle";
    /* Читается по ходу корабля, а не вверх ногами: корпус рисуется уже
       повёрнутым носом вперёд, поэтому надпись доворачивается в другую
       сторону — на зуме перевёрнутый номер был первым, что бросалось в глаза */
    ctx.translate(lerp(h.nose*.35,h.tail*.5,.5),-h.bw*.52);
    ctx.rotate(Math.PI/2);
    ctx.fillText(M.num,0,0);
    ctx.restore();
  }
  /* штанга приборов вперёд: у разведчика нос продолжается за габарит */
  if(M.boom){
    const b=M.boom;
    ctx.strokeStyle=rgba(h.lite,.55);ctx.lineWidth=b.r*.9;
    ctx.beginPath();ctx.moveTo(h.nose,0);ctx.lineTo(h.nose+b.l,0);ctx.stroke();
    ctx.fillStyle=rgba(h.lite,.6);
    ctx.beginPath();ctx.arc(h.nose+b.l,0,b.r*1.5,0,TAU);ctx.fill();
    for(const s of [1,-1]){
      ctx.strokeStyle=rgba(h.col,.55);ctx.lineWidth=.7;
      ctx.beginPath();
      ctx.moveTo(h.nose+b.l*.62,0);ctx.lineTo(h.nose+b.l*.5,s*b.r*3.6);ctx.stroke();
    }
  }
  if(M.win&&!h.lux){
    /* лента окон — единственное, что отличает яхту от курьера на расстоянии */
    ctx.fillStyle="rgba(190,240,255,.55)";
    const y=h.bw*.28;
    for(let x=M.win[0];x>M.win[1];x-=3.2)ctx.fillRect(x,-y-.6,1.7,1.2);
  }
  if(M.lux)drawLuxeDeck(h,M.lux);
}
