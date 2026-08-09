/* ══════════════ карта ══════════════ */
function wrapCenter(text,x,y,maxW,lh){
  const words=text.split(" ");let line="",ly=y;
  for(const w of words){
    const t=line?line+" "+w:w;
    if(ctx.measureText(t).width>maxW&&line){ctx.fillText(line,x,ly);line=w;ly+=lh;}
    else line=t;
  }
  if(line)ctx.fillText(line,x,ly);
}
const PAD_SAFE=104;   // полоса экранных кнопок снизу: туда ничего не пишем
function wrapLeft(text,x,y,maxW,lh){
  const words=text.split(" ");let line="",ly=y;
  for(const w of words){
    const t=line?line+" "+w:w;
    if(ctx.measureText(t).width>maxW&&line){ctx.fillText(line,x,ly);line=w;ly+=lh;}
    else line=t;
  }
  if(line)ctx.fillText(line,x,ly);
}
/* ══════════════ карта: ночное небо, а не схема молекулы ══════════════ */
/* Прежняя карта рисовала шесть десятков одинаковых кружков одного размера,
   соединённых паутиной линий к двум ближайшим соседям. Ни иерархии, ни глубины,
   ни ощущения расстояния: сетка связей читалась как структурная формула.

   Здесь три правила. Первое: звезда — источник света, а не точка. Размер и
   свечение идут от класса, у ярких есть дифракционные лучи. Второе: глубина
   даётся тьмой — чем дальше сектор от игрока, тем он тусклее, и на краю
   радиуса прыжка мир буквально гаснет. Третье: линия проводится только там,
   где она что-то значит — между достижимыми системами и до выбранной цели. */
const MAPBG={tex:null};
function mapNebula(){
  if(MAPBG.tex)return MAPBG.tex;
  const S=160,cn=document.createElement("canvas");cn.width=cn.height=S;
  const c=cn.getContext("2d"),img=c.createImageData(S,S),d=img.data;
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){
    const o=(y*S+x)*4,u=x/S*2.6,v=y/S*2.6;
    /* два поля: холодное «молоко» рукава и тёплые угли древних вспышек */
    const a=clamp((fbm2(u,v,7717,5)-.46)*2.6,0,1);
    const b=clamp((fbm2(u+3.7,v-1.9,4243,4)-.52)*2.9,0,1);
    /* пылевая полоса вычитается: без тёмных прожилок туманность — просто клякса */
    const dust=clamp((fbm2(u*1.7-2.2,v*1.7+4.4,913,3)-.44)*3.2,0,1);
    const al=clamp((Math.pow(a,1.9)*.46+Math.pow(b,2.2)*.34)*(1-dust*.8),0,1);
    d[o]  =28+b*150+a*24;
    d[o+1]=22+a*54+b*44;
    d[o+2]=58+a*140+b*30;
    d[o+3]=al*255;
  }
  c.putImageData(img,0,0);MAPBG.tex=cn;return cn;
}
function drawMap(){
  const st=stat();
  ctx.fillStyle="#03040a";ctx.fillRect(0,0,W,H);
  /* туманность едет вместе с сектором — карта перестаёт быть неподвижным листом */
  const N=mapNebula(),ex=W*.35,ey=H*.35;
  ctx.globalAlpha=.55;
  ctx.drawImage(N,-ex/2-((G.sx*11)%ex),-ey/2-((G.sy*11)%ey),W+ex,H+ey);
  ctx.globalAlpha=1;
  drawStars(G.sx*140,G.sy*140,.35);
  const cell=Math.min(W,H)/9.2,R=5;
  const jr=(st.jump+.02)*cell;
  /* круг прыжка: не окружность-волосок, а освещённая область — сразу видно,
     докуда рука дотягивается */
  const jg=ctx.createRadialGradient(W/2,H/2,jr*.55,W/2,H/2,jr);
  jg.addColorStop(0,"rgba(127,230,216,0)");
  jg.addColorStop(1,"rgba(127,230,216,.055)");
  ctx.fillStyle=jg;ctx.beginPath();ctx.arc(W/2,H/2,jr,0,TAU);ctx.fill();
  ctx.strokeStyle="rgba(127,230,216,.22)";ctx.lineWidth=1;
  ctx.beginPath();ctx.arc(W/2,H/2,jr,0,TAU);ctx.stroke();
  const dsel=Math.hypot(G.sel.x-G.sx,G.sel.y-G.sy);
  const vis=[];
  for(let gy=G.sy-R;gy<=G.sy+R;gy++)for(let gx=G.sx-R;gx<=G.sx+R;gx++){
    if(!starAt(gx,gy))continue;
    const [jx,jy]=sysJitter(gx,gy);
    const d=Math.hypot(gx-G.sx+jx,gy-G.sy+jy);
    vis.push({gx,gy,s:getSystem(gx,gy),x:W/2+(gx-G.sx+jx)*cell,y:H/2+(gy-G.sy+jy)*cell,
      d, near:d<=st.jump+.02});
  }
  /* связи только между достижимыми: паутина «каждый к двум соседям» тянулась
     через весь экран и складывалась в решётку, которой в мире нет */
  ctx.strokeStyle="rgba(127,230,216,.13)";ctx.lineWidth=1;
  const drawnLane=new Set();
  for(const a of vis){
    if(!a.near)continue;
    for(const b of vis){
      if(b===a||!b.near)continue;
      if(Math.hypot(a.x-b.x,a.y-b.y)>cell*1.45)continue;
      const key=a.gx<b.gx||(a.gx===b.gx&&a.gy<b.gy)?a.gx+","+a.gy+">"+b.gx+","+b.gy:b.gx+","+b.gy+">"+a.gx+","+a.gy;
      if(drawnLane.has(key))continue;drawnLane.add(key);
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    }
  }
  /* засечки «Долгого Хода» (12q-lore) — поверх линий, но под звёздами: адрес,
     до которого сегодня не дотянуться, обязан читаться и за краем листа */
  if(typeof drawLoreMarks==="function")drawLoreMarks(cell);
  let sel=null,cur=null;
  for(const v of vis){
    const{gx,gy,s,x,y}=v;
    const here=gx===G.sx&&gy===G.sy;
    /* глубина тьмой: дальний сектор тусклее, недостижимый — вполовину */
    const fade=clamp(1-v.d/(R*1.15),.18,1)*(v.near?1:.5);
    const rr=1.8+s.cls.t*2.2;
    const col=hex2rgb(s.cls.col);
    ctx.save();
    ctx.globalCompositeOperation="lighter";
    /* ореол: звезда светит, а не лежит кружком на фоне */
    const gl=ctx.createRadialGradient(x,y,0,x,y,rr*7);
    gl.addColorStop(0,rgba(col,(.5*fade).toFixed(3)));
    gl.addColorStop(.35,rgba(col,(.13*fade).toFixed(3)));
    gl.addColorStop(1,rgba(col,0));
    ctx.fillStyle=gl;ctx.beginPath();ctx.arc(x,y,rr*7,0,TAU);ctx.fill();
    /* лучи — только у ярких: они и держат иерархию кадра */
    if(s.cls.t>=1.3){
      ctx.strokeStyle=rgba(col,(.22*fade).toFixed(3));ctx.lineWidth=1;
      const L=rr*(4.4+s.cls.t);
      ctx.beginPath();ctx.moveTo(x-L,y);ctx.lineTo(x+L,y);
      ctx.moveTo(x,y-L);ctx.lineTo(x,y+L);ctx.stroke();
    }
    ctx.fillStyle=rgba(mixc(col,[255,255,255],.55),(.95*fade).toFixed(3));
    ctx.beginPath();ctx.arc(x,y,rr,0,TAU);ctx.fill();
    ctx.restore();
    ctx.globalAlpha=fade;
    /* ── занятая пиратами система ──
       Кольцо из штрихов вместо ровного круга: занятость должна читаться как
       оцепление, а не как ещё одна метка станции. Чем выше уровень, тем гуще
       штрихи и тем краснее — фронт виден одним взглядом на карту. */
    const ol=occLvl(gx,gy);
    if(ol){
      /* Оцепление читается зубцами наружу, а не тонким кольцом: на карте, где
         у станции уже есть свой кружок, ещё одна окружность терялась среди них. */
      const orr=10+ol*3,n=5+ol*3;
      const oc=[255,96-ol*14,72-ol*12];
      /* Оцепление НЕ тускнеет с расстоянием, в отличие от звёзд: фронт — это то,
         ради чего на карту и смотрят, и он обязан читаться на краю радиуса
         так же, как под носом. Глубина остаётся у звёзд, а не у меток. */
      const of=Math.max(.75,fade);
      ctx.strokeStyle=rgba(oc,(.85+ol*.05)*of);ctx.lineWidth=2.2+ol*.6;
      for(let i=0;i<n;i++){
        const a=i/n*TAU+G.t*.02*(ol%2?1:-1);
        ctx.beginPath();
        ctx.arc(x,y,orr,a,a+TAU/n*.46);
        ctx.stroke();
        // зубец наружу на конце каждого штриха
        const ae=a+TAU/n*.46;
        ctx.beginPath();
        ctx.moveTo(x+Math.cos(ae)*orr,y+Math.sin(ae)*orr);
        ctx.lineTo(x+Math.cos(ae)*(orr+2.5+ol*.6),y+Math.sin(ae)*(orr+2.5+ol*.6));
        ctx.stroke();
      }
      if(ol>=2){
        ctx.fillStyle=rgba(oc,.95*of);ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
        ctx.fillText(ol>=OCC_MAX?"ПОД ПИРАТАМИ":"БЛОКАДА",x,y+orr+11);
      }
      if(ol>=OCC_MAX){                       // под пиратами: заливка изнутри
        const og=ctx.createRadialGradient(x,y,0,x,y,orr);
        og.addColorStop(0,rgba(oc,.22*of));og.addColorStop(1,rgba(oc,0));
        ctx.fillStyle=og;ctx.beginPath();ctx.arc(x,y,orr,0,TAU);ctx.fill();
      }
    }
    if(s.station){ctx.strokeStyle="rgba(242,178,92,.55)";ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(x,y,rr+6,0,TAU);ctx.stroke();}
    if(s.belt){ctx.strokeStyle="rgba(180,190,200,.3)";ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(x,y,rr+10,-.9,2.4);ctx.stroke();}
    ctx.globalAlpha=1;
    if(here){
      ctx.strokeStyle="rgba(127,230,216,"+(.5+.25*Math.sin(G.t*.06)).toFixed(2)+")";
      ctx.lineWidth=1.2;
      ctx.beginPath();ctx.arc(x,y,rr+14,0,TAU);ctx.stroke();
    }
    if(gx===G.sx&&gy===G.sy){ctx.strokeStyle="#7fe6d8";ctx.lineWidth=1.2;
      ctx.beginPath();ctx.arc(x,y,rr+13,0,TAU);ctx.stroke();}
    /* ушедший управляющий и разошедшееся ядро — единственные метки на карте,
       которые поставил не мир, а сам игрок. Без них до них не долететь. */
    if((G.rogues||[]).some(R=>R.sx===gx&&R.sy===gy)){
      ctx.strokeStyle="#c58ae0";ctx.lineWidth=1.4;
      ctx.beginPath();ctx.arc(x,y,rr+17,0,TAU);ctx.stroke();
      ctx.fillStyle="rgba(197,138,224,.9)";ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
      ctx.fillText("РЕНЕГАТ",x,y-rr-21);
    }
    if(G.aiRift&&G.aiRift.sx===gx&&G.aiRift.sy===gy){
      ctx.strokeStyle="#7fb0e6";ctx.lineWidth=1.2;
      ctx.beginPath();ctx.arc(x,y,rr+21,0,TAU);ctx.stroke();
      ctx.fillStyle="rgba(127,176,230,.9)";ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
      ctx.fillText("РАСХОЖДЕНИЕ",x,y+rr+21);
    }
    /* «Охота» командира: пиратские базы соседних секторов помечены заранее.
       Без перка их находят только прилетев — перк и продаёт именно это знание. */
    if(mgrPerkOf("cmd","hunt")&&Math.max(Math.abs(gx-G.sx),Math.abs(gy-G.sy))<=4&&
       pirateBaseOf(s)){
      ctx.strokeStyle="rgba(255,107,87,.75)";ctx.lineWidth=1;
      ctx.beginPath();
      for(let i=0;i<5;i++){
        const a=i*TAU/5-Math.PI/2,rr2=rr+13;
        i?ctx.lineTo(x+Math.cos(a)*rr2,y+Math.sin(a)*rr2)
         :ctx.moveTo(x+Math.cos(a)*rr2,y+Math.sin(a)*rr2);
      }
      ctx.closePath();ctx.stroke();
    }
    /* метка знания (12p): слух — это адрес, и он ложится слоем на карту.
       Закрывает хвост M92: знать что-то и не видеть этого на карте — то же, что
       не знать. */
    const NM=typeof newsMarkAt==="function"?newsMarkAt(gx,gy):null;
    if(NM){
      ctx.strokeStyle=NM.col;ctx.globalAlpha=.75;ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(x,y,rr+9,-.6,.6);ctx.stroke();
      ctx.beginPath();ctx.arc(x,y,rr+9,Math.PI-.6,Math.PI+.6);ctx.stroke();
      ctx.fillStyle=NM.col;ctx.font="7px ui-monospace,monospace";ctx.textAlign="center";
      ctx.fillText(NM.what.toUpperCase(),x,y+rr+13);
      ctx.globalAlpha=1;
    }
    /* след артефакта: сектор, который вычитал исследователь с «происхождением» */
    if(G.relicHint&&G.relicHint.sx===gx&&G.relicHint.sy===gy){
      ctx.strokeStyle="#c58ae0";ctx.lineWidth=1;ctx.setLineDash([3,3]);
      ctx.beginPath();ctx.arc(x,y,rr+25,0,TAU);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle="rgba(197,138,224,.85)";ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
      ctx.fillText("СЛЕД АРТЕФАКТА",x,y-rr-29);
    }
    if(gx===G.sel.x&&gy===G.sel.y)sel=v;
    if(here)cur=v;
  }
  /* маршрут домена — под курсом игрока: мир под намерением, а не наоборот */
  drawFactRoute(vis);
  if(typeof drawBargesMap==="function")drawBargesMap(vis);
  const cost=Math.round(9+dsel*13);
  const bad=dsel>st.jump+.02||cost>G.fuel||dsel===0;
  /* ── курс прыжка ──
     Раньше отсюда к карточке шёл волосок «вот о какой звезде речь». Он не
     сообщал ничего, чего не сказали бы кольцо и уголки прицела, зато на дальней
     цели превращался в диагональ через полкарты. Вместо него линия, которая
     отвечает на настоящий вопрос: откуда, куда и чем это обойдётся. Цена стоит
     прямо на курсе — там, куда и так смотрит глаз, а не в строке внизу экрана.
     Пунктир, потому что сплошными нарисованы связи между системами: курс — это
     намерение игрока, а не устройство мира, и путать их нельзя. */
  if(cur&&sel&&dsel>0){
    const x0=cur.x,y0=cur.y,x1=sel.x,y1=sel.y;
    const far=dsel>st.jump+.02, poor=!far&&cost>G.fuel;
    const col=far?"rgba(255,107,87,.5)":poor?"rgba(255,107,87,.75)":"rgba(242,178,92,.8)";
    ctx.save();
    ctx.setLineDash(far?[2,6]:[7,5]);
    ctx.strokeStyle=col;ctx.lineWidth=far?1:1.4;
    ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();
    ctx.setLineDash([]);
    /* подпись на середине курса, на своей подложке — поверх звёзд и туманности
       голый текст не читается */
    const mx=(x0+x1)/2,my=(y0+y1)/2;
    const label=far?"ВНЕ РАДИУСА":(cost+" ТОПЛИВА"+(poor?" · НЕ ХВАТАЕТ":""));
    ctx.font="10px ui-monospace,monospace";ctx.textAlign="center";ctx.textBaseline="middle";
    const tw=ctx.measureText(label).width;
    ctx.fillStyle="rgba(6,10,16,.82)";
    ctx.fillRect(mx-tw/2-7,my-9,tw+14,18);
    ctx.strokeStyle=col;ctx.lineWidth=1;
    ctx.strokeRect(mx-tw/2-6.5,my-8.5,tw+13,17);
    ctx.fillStyle=far||poor?"rgba(255,150,135,.95)":"#f2b25c";
    ctx.fillText(label,mx,my+.5);
    /* сколько останется в баке — вторая строка, мельче: это уже подробность */
    if(!far&&!poor){
      ctx.font="8px ui-monospace,monospace";
      ctx.fillStyle="rgba(160,182,192,.7)";
      ctx.fillText("останется "+Math.round(G.fuel-cost),mx,my+18);
    }
    ctx.restore();
    ctx.textBaseline="alphabetic";
  }
  /* ── карточка выбранной системы ──
     Раньше подпись висела прямо под звездой и на нижнем ряду секторов уезжала
     под экранные кнопки. Теперь это карточка в углу: место у неё постоянное,
     а со звездой её связывает волосок. */
  if(sel){
    const{s,x,y}=sel,rr=1.8+s.cls.t*2.2;
    ctx.strokeStyle="#f2b25c";ctx.lineWidth=1.2;
    ctx.beginPath();ctx.arc(x,y,rr+11,0,TAU);ctx.stroke();
    ctx.beginPath();
    for(let i=0;i<4;i++){                       // уголки прицела, а не рамка
      const a=Math.PI/4+i*Math.PI/2, r0=rr+13, r1=rr+20;
      ctx.moveTo(x+Math.cos(a)*r0,y+Math.sin(a)*r0);
      ctx.lineTo(x+Math.cos(a)*r1,y+Math.sin(a)*r1);
    }
    ctx.stroke();
    const cw=Math.min(300,W-32), cx=16, cy=H-PAD_SAFE-158;   // выше строк прыжка: они налезали на карточку
    ctx.fillStyle="rgba(6,10,16,.62)";ctx.fillRect(cx,cy,cw,104);
    ctx.strokeStyle="rgba(127,230,216,.18)";ctx.strokeRect(cx+.5,cy+.5,cw,104);
    ctx.textAlign="left";
    ctx.fillStyle="#f2b25c";ctx.font="13px ui-monospace,monospace";
    ctx.fillText(s.name.toUpperCase(),cx+12,cy+22);
    ctx.fillStyle="rgba(127,230,216,.65)";ctx.font="9px ui-monospace,monospace";
    ctx.fillText(s.cls.ru+" · "+s.planets.length+" планет"+(s.station?" · СТАНЦИЯ":"")+(s.belt?" · ПОЯС":""),cx+12,cy+38);
    ctx.fillStyle="rgba(160,182,192,.62)";
    wrapLeft(s.desc,cx+12,cy+54,cw-24,11);
  }
  /* строка прыжка — над карточкой и над кнопками; PAD_SAFE держит её выше
     экранных пэдов, на которые она налезала в нижних углах */
  ctx.textAlign="left";ctx.font="10px ui-monospace,monospace";
  ctx.fillStyle="rgba(127,230,216,.55)";
  ctx.fillText("СЕКТОР "+G.sel.x+":"+G.sel.y+"   ·   "+dsel.toFixed(2)+" из "+st.jump.toFixed(2)+" пк",
    16,H-PAD_SAFE-30);
  ctx.fillStyle=bad?"rgba(255,107,87,.85)":"#f2b25c";
  ctx.fillText(dsel===0?"ТЕКУЩАЯ СИСТЕМА":
    (dsel>st.jump+.02?"ВНЕ РАДИУСА — НУЖЕН ГИПЕРДРАЙВ":
     "ПРЫЖОК: "+cost+" топлива"+(cost>G.fuel?" — НЕ ХВАТАЕТ":"")),16,H-PAD_SAFE-14);
  ctx.fillStyle="rgba(93,115,130,.85)";ctx.textAlign="right";
  ctx.fillText("ТЕЛ "+G.found.size+" · ВИДОВ "+G.species.size+" · "+
    Math.round(G.credits).toLocaleString("ru")+" кр",W-16,H-PAD_SAFE-14);
  /* фронт одной строкой: цель игры должна быть видна там, где на неё смотрят,
     то есть на карте, а не в меню */
  const occN=G.occ?Object.keys(G.occ).length:0;
  if(occN||(G.freed|0)){
    ctx.fillStyle=occN?"rgba(255,107,87,.75)":"rgba(143,208,138,.75)";
    ctx.fillText(occSummary(),W-16,H-PAD_SAFE-30);
  }
  G.prompt="ТАП ПО ЗВЕЗДЕ — ВЫБОР · ДЕЙСТВИЕ — ПРЫЖОК";
  if(actEdge){
    if(!bad)jump(cost);
    else if(dsel>0)say("Прыжок невозможен");
  }
}
function jump(cost){
  G.fuel-=cost;G.sx=G.sel.x;G.sy=G.sel.y;G.sys=getSystem(G.sx,G.sy);G.ap=null;
  const a=Math.random()*TAU,r=1500;
  G.ship.x=Math.cos(a)*r;G.ship.y=Math.sin(a)*r;
  G.ship.vx=-Math.cos(a)*.7;G.ship.vy=-Math.sin(a)*.7;G.ship.a=a+Math.PI;
  G.mode="system";
  spawnPirates();spawnAllies();
  sfx("jump");
  saveGame(true);
  logAdd("dim","Прыжок в "+G.sys.name+" ("+G.sx+":"+G.sy+") · −"+cost+" топлива"+
    (G.pirates.length?" · чужих сигнатур: "+G.pirates.length:""));
  say("Прибытие: "+G.sys.name+"\n"+G.sys.cls.ru+
    (G.sys.station?"\nстанция":"")+(G.sys.belt?"\nпояс астероидов":"")+
    (G.pirates.length?"\nчужие сигнатуры: "+G.pirates.length:""));
}
