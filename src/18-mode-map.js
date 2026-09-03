/* ══════════════ карта ══════════════ */
const PAD_SAFE=104;   // полоса экранных кнопок снизу: запасной ответ, см. mapDeck
/* ══════════════ где у карты пол и где правый борт ══════════════
   Карта рисует карточку системы и строки прыжка на канве, а подсказка,
   эфирная строка, пульт и правый борт — это DOM со своей вёрсткой. Пока карта
   считала своё место константой (`PAD_SAFE`), два счёта одного и того же
   расходились: на телефоне 393×830 подсказка легла поперёк описания системы,
   эфирная строка накрыла «ТЕЛ · ВИДОВ · кр», а угол карточки уехал под кнопки
   КАРТА и МЕНЮ. Автор прислал этот кадр 30.08.2026 словами «всё сбилось и
   наезжает» — и был прав: константа врала, потому что вёрстка меняется, а она
   нет. HUD_FLOOR и HUD_RAIL мерятся по самому DOM раз в кадр (27z-telemetry);
   константа осталась запасным ответом на первый кадр и на стенды без пульта. */
function mapDeck(){
  const fl=(typeof HUD_FLOOR==="number"&&HUD_FLOOR>40)?HUD_FLOOR:(H-PAD_SAFE);
  return Math.round(clamp(fl-12,H*.4,H-14));
}
function mapRail(){
  const rl=(typeof HUD_RAIL==="number"&&HUD_RAIL>60)?HUD_RAIL:(W-16);
  return Math.round(clamp(rl-8,180,W-16));
}
/* ── что карта нарисовала как интерфейс ──
   Канва и DOM — две разные вёрстки, и наезжают они ровно там, куда не смотрит
   ни один сторож: тест 91f-ui умеет сравнивать DOM с DOM, а карточку системы
   он не видит вовсе, потому что её нет в разметке. Поэтому карта СООБЩАЕТ свои
   прямоугольники — одна запись в кадр, — и тест сравнивает их с вёрсткой так
   же, как сравнивает панели между собой. */
let MAP_BOX=[];
function mapBox(name,x,y,w,h){MAP_BOX.push({s:name,x,y,w,h});}
function wrapLeft(text,x,y,maxW,lh){
  const words=text.split(" ");let line="",ly=y,n=1;
  for(const w of words){
    const t=line?line+" "+w:w;
    if(ctx.measureText(t).width>maxW&&line){ctx.fillText(line,x,ly);line=w;ly+=lh;n++;}
    else line=t;
  }
  if(line)ctx.fillText(line,x,ly);
  return n;                       /* сколько строк вышло: карточка растёт по ним */
}
/* ── сколько строк займёт, если ещё не рисовать ──
   Карточка системы должна знать свою высоту ДО того, как её обвели рамкой:
   иначе описание в четыре строки вылезает из плашки, посчитанной под три. */
function wrapCount(text,maxW){
  const words=String(text||"").split(" ");let line="",n=1;
  for(const w of words){
    const t=line?line+" "+w:w;
    if(ctx.measureText(t).width>maxW&&line){line=w;n++;}
    else line=t;
  }
  return n;
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
/* окно карты (M298): обычно вокруг вас; по слуху — вокруг названного сектора */
function mapViewC(){return G.mapView||{x:G.sx,y:G.sy};}
/* ── масштаб и клетка карты (M299) ──
   Один счёт клетки на всех: рисование, тап и протяжка считали её каждый сам,
   и любое расхождение уводило тап мимо звезды. Зум карты — отдельный от зума
   системы: 1 — как раньше, больше — дальше видно, меньше — крупнее. */
function mapZoomK(){return clamp(G.mapZoom||1,.6,5);}
function mapCell(){return Math.min(W,H)/9.2/mapZoomK();}
function mapRange(){return Math.ceil(5*mapZoomK())+1;}
function mapZoomSet(z){G.mapZoom=clamp(z,.6,5);}
/* окно так, чтобы в кадре были И вы, И названный сектор: по слуху карта
   раньше уезжала к сектору, а игрок оставался за краем и не понимал, откуда лететь */
function mapFit(sx,sy){
  const dx=sx-G.sx,dy=sy-G.sy,d=Math.max(Math.abs(dx),Math.abs(dy));
  if(d<=4){G.mapView=null;G.mapZoom=1;return;}
  G.mapView={x:G.sx+dx/2,y:G.sy+dy/2};
  G.mapZoom=clamp((d/2+1.5)/4.2,1,5);
}
/* ── подгляд со станции (M299) ──
   «НА КАРТУ» с доски открывало карту ПОД экраном станции: режим менялся, а
   оверлей оставался, и игрок тыкал в кнопку, которая «ничего не делает».
   Теперь станция прячется, карта видна, НАЗАД возвращает на ту же вкладку;
   стыковка не рвётся, прыжок отсюда невозможен. */
function mapPeek(){
  if(G.mode!=="dock")return false;
  G.mapPeek={tab:(typeof tab!=="undefined")?tab:null};
  if(typeof $st!=="undefined"&&$st)$st.classList.remove("open");
  G.mode="map";
  return true;
}
function mapBack(){
  if(!G.mapPeek)return false;
  const pk=G.mapPeek;G.mapPeek=null;
  mapReset();
  G.mode="dock";
  if(pk.tab&&typeof tab!=="undefined")tab=pk.tab;
  if(typeof $st!=="undefined"&&$st)$st.classList.add("open");
  /* полоса разделов идёт за вкладкой (ловушка из PLAN: tab без syncTabs) */
  if(typeof syncTabs==="function")syncTabs();
  if(typeof renderTab==="function")renderTab();
  return true;
}
function mapReset(){G.mapView=null;G.mapZoom=1;G.mapMore=false;G.mapClean=false;G.mapSearch=null;
  if(typeof document!=="undefined"&&document.body)document.body.classList.remove("mapclean");}
function mapCleanSet(on){G.mapClean=!!on;if(typeof document!=="undefined"&&document.body)document.body.classList.toggle("mapclean",G.mapClean);}
function drawMap(){
  const st=stat();
  ctx.fillStyle="#03040a";ctx.fillRect(0,0,W,H);
  /* туманность едет вместе с сектором — карта перестаёт быть неподвижным листом */
  const N=mapNebula(),ex=W*.35,ey=H*.35;
  ctx.globalAlpha=.55;
  ctx.drawImage(N,-ex/2-((G.sx*11)%ex),-ey/2-((G.sy*11)%ey),W+ex,H+ey);
  ctx.globalAlpha=1;
  /* ── полоса Галактики (леджер кадров: карта mass 0%, contrast .07) ──
     Точки на тьме не собирались ни в одну массу: смотреть было не на что.
     Карта звёзд обязана показывать, ЧАСТЬЮ ЧЕГО они являются — молочная
     полоса галактической плоскости наискось через лист. Печётся один раз
     на размер экрана, кадру — один drawImage. */
  ctx.drawImage(screenLayer("mapband|"+W+"|"+H,()=>{
    ctx.save();
    ctx.translate(W/2,H/2);ctx.rotate(-.34);
    const L=Math.hypot(W,H);
    ctx.globalCompositeOperation="lighter";
    const BW=[.46,.34,.22,.12],BA=[.05,.06,.08,.10];
    for(let i=0;i<BW.length;i++){
      const g=ctx.createLinearGradient(0,-H*BW[i]/2,0,H*BW[i]/2);
      g.addColorStop(0,"rgba(150,180,220,0)");
      g.addColorStop(.5,"rgba(178,200,228,"+BA[i]+")");
      g.addColorStop(1,"rgba(150,180,220,0)");
      ctx.fillStyle=g;ctx.fillRect(-L/2,-H*BW[i]/2,L,H*BW[i]);
    }
    /* ── вторая ступень значения (M308, §16) ──
       Полоса была одним плавным значением; масса на карте мерилась в 2%.
       У настоящей полосы есть яркое узкое ядро и тёмная пылевая лента,
       которая его режет, — две ступени вместо одной, и по ним полоса
       читается телом, а не подсветкой. Плюс звёздная крошка в ядре. */
    {
      const cg2=ctx.createLinearGradient(0,-H*.075,0,H*.075);
      cg2.addColorStop(0,"rgba(200,214,236,0)");cg2.addColorStop(.5,"rgba(214,224,240,.13)");cg2.addColorStop(1,"rgba(200,214,236,0)");
      ctx.fillStyle=cg2;ctx.fillRect(-L/2,-H*.075,L,H*.15);
      const rs=rng(0x3A11);
      ctx.fillStyle="rgba(230,236,248,.5)";
      for(let i=0;i<260;i++){const x=(rs()-.5)*L,y=(rs()-.5)*H*.16*(.4+rs()*.6);ctx.fillRect(x,y,rs()<.2?1.2:.8,.8);}
      ctx.globalCompositeOperation="source-over";
      const dl=ctx.createLinearGradient(0,-H*.03,0,H*.03);
      dl.addColorStop(0,"rgba(6,8,14,0)");dl.addColorStop(.5,"rgba(6,8,14,.38)");dl.addColorStop(1,"rgba(6,8,14,0)");
      ctx.fillStyle=dl;
      ctx.beginPath();
      for(let x=-L/2;x<=L/2;x+=40){const y=Math.sin(x*.004)*H*.02+Math.sin(x*.011+1)*H*.01;if(x===-L/2)ctx.moveTo(x,y-H*.03);else ctx.lineTo(x,y-H*.03);}
      for(let x=L/2;x>=-L/2;x-=40){const y=Math.sin(x*.004)*H*.02+Math.sin(x*.011+1)*H*.01;ctx.lineTo(x,y+H*.03);}
      ctx.closePath();ctx.fill();
      ctx.globalCompositeOperation="lighter";
    }
    /* тёплое ядро полосы — вторая температура листа */
    const cg=ctx.createRadialGradient(-W*.18,0,0,-W*.18,0,W*.34);
    cg.addColorStop(0,"rgba(236,206,160,.10)");
    cg.addColorStop(1,"rgba(236,206,160,0)");
    ctx.fillStyle=cg;ctx.fillRect(-L/2,-H/2,L,H);
    ctx.restore();
  }),0,0,W,H);
  /* ── сеть пеленгов (экспедиция-2, свод §14: портуланы) ──
     На морской карте каждая линия — пеленг, по которому можно идти; красота
     заработана управляемостью. Шестнадцать румбов из ТЕКУЩЕЙ системы (она в
     центре листа) — курс читается направлением с одного взгляда. Главные
     четыре чуть громче. Печётся раз на размер экрана. */
  ctx.drawImage(screenLayer("maprhumb|"+W+"|"+H,()=>{
    const L=Math.hypot(W,H);
    ctx.save();ctx.translate(W/2,H/2);
    for(let i=0;i<16;i++){
      const a=i/16*TAU;
      ctx.strokeStyle="rgba(150,182,212,"+((i%4===0)?.075:.04)+")";
      ctx.lineWidth=(i%4===0)?1:.7;
      ctx.beginPath();ctx.moveTo(0,0);
      ctx.lineTo(Math.cos(a)*L,Math.sin(a)*L);ctx.stroke();
    }
    /* скрытая окружность построения — как процарапанная на пергаменте */
    ctx.strokeStyle="rgba(150,182,212,.05)";ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(0,0,Math.min(W,H)*.42,0,TAU);ctx.stroke();
    ctx.restore();
  }),0,0,W,H);
  drawStars(G.sx*140,G.sy*140,.35);
  const cell=mapCell(),R=mapRange();
  const V=mapViewC(),vx=V.x,vy=V.y;              /* окно карты: обычно вы, по слуху — названный сектор (M298) */
  const px=W/2+(G.sx-vx)*cell,py=H/2+(G.sy-vy)*cell;
  const jr=(st.jump+.02)*cell;
  /* круг прыжка: не окружность-волосок, а освещённая область — сразу видно,
     докуда рука дотягивается */
  const jg=ctx.createRadialGradient(px,py,jr*.55,px,py,jr);
  jg.addColorStop(0,"rgba(127,230,216,0)");
  jg.addColorStop(1,"rgba(127,230,216,.055)");
  ctx.fillStyle=jg;ctx.beginPath();ctx.arc(px,py,jr,0,TAU);ctx.fill();
  ctx.strokeStyle="rgba(127,230,216,.22)";ctx.lineWidth=1;
  ctx.beginPath();ctx.arc(px,py,jr,0,TAU);ctx.stroke();
  /* круг поиска по слуху: где смотреть, а не что нашли */
  if(G.mapSearch){
    const S=G.mapSearch,sxp=W/2+(S.sx-vx)*cell,syp=H/2+(S.sy-vy)*cell;
    ctx.strokeStyle="rgba(207,227,234,.45)";ctx.lineWidth=1;ctx.setLineDash([4,5]);
    ctx.beginPath();ctx.arc(sxp,syp,Math.max(6,S.rad*cell),0,TAU);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle="rgba(207,227,234,.7)";ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
    ctx.fillText("ИСКАТЬ ЗДЕСЬ · "+S.rad+" "+pl3(S.rad,"СЕКТОР","СЕКТОРА","СЕКТОРОВ").toUpperCase(),sxp,syp-S.rad*cell-6);
  }
  const dsel=Math.hypot(G.sel.x-G.sx,G.sel.y-G.sy);
  const vis=[];
  const vx0=Math.round(vx),vy0=Math.round(vy);   /* окно дробное после протяжки, сектора целые */
  for(let gy=vy0-R;gy<=vy0+R;gy++)for(let gx=vx0-R;gx<=vx0+R;gx++){
    if(!starAt(gx,gy))continue;
    if(typeof chartsHidden==="function"&&chartsHidden(gx,gy))continue;   /* несогласие карт (11m) */
    let [jx,jy]=sysJitter(gx,gy);
    if(typeof chartsJitter==="function"){const cj=chartsJitter(gx,gy);jx+=cj[0];jy+=cj[1];}
    const d=Math.hypot(gx-G.sx+jx,gy-G.sy+jy);
    vis.push({gx,gy,s:getSystem(gx,gy),x:W/2+(gx-vx+jx)*cell,y:H/2+(gy-vy+jy)*cell,
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
  /* съёмка «Долгого Хода» (12w, M115): их значки поверх вашего листа — ровно
     столько точек, сколько кусков отчёта заработано, и ни одной авансом */
  if(typeof drawSurvey==="function")drawSurvey(cell);
  /* трассы ГЛАВТРАССЫ (12ai, M314): пунктир между системами, где ходит флот */
  if(typeof drawFleetMap==="function")drawFleetMap(vis,cell);
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
    /* кольцо освоения (M292): с ★5, по сегменту на пятилетку, столбик огней по постройкам */
    if(typeof drawRungRing==="function")drawRungRing(x,y,rr,gx,gy);
    /* Дозор (H2): очаг пиратов, который ещё не разгорелся, — красная зарубка */
    if(typeof lookoutSees==="function"&&lookoutSees(gx,gy)){ctx.strokeStyle="rgba(255,107,87,.8)";ctx.lineWidth=1.2;
      ctx.beginPath();ctx.moveTo(x+rr+4,y-rr-4);ctx.lineTo(x+rr+9,y-rr-9);ctx.stroke();}
    ctx.globalAlpha=1;
    /* «вы» — одна метка, и не того цвета, что выбор (M299): два бирюзовых
       кольца в пиксель друг от друга читались одним, и на карте не было «где я» */
    if(here){
      ctx.strokeStyle="rgba(127,230,216,"+(.6+.3*Math.sin(G.t*.06)).toFixed(2)+")";
      ctx.lineWidth=1.4;
      ctx.beginPath();ctx.arc(x,y,rr+14,0,TAU);ctx.stroke();
      ctx.fillStyle="#7fe6d8";
      ctx.beginPath();ctx.moveTo(x,y-rr-24);ctx.lineTo(x-4,y-rr-17);ctx.lineTo(x+4,y-rr-17);ctx.closePath();ctx.fill();
      ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
      ctx.fillText("ВЫ · "+((typeof nameOf==="function")?nameOf(s):s.name).toUpperCase(),x,y-rr-28);
    }
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
  /* вы за краем листа (M299): стрелка у кромки говорит, откуда лететь, пока
     окно уехало к слуху или протянуто пальцем; курс считается от вас всегда */
  if(!cur){
    cur={x:px,y:py,s:G.sys,edge:true};
    const cx=W/2,cyy=H/2,ddx=px-cx,ddy=py-cyy,m=Math.max(Math.abs(ddx)/(W/2-26),Math.abs(ddy)/(H/2-26),1e-6);
    const ex=cx+ddx/m,ey=cyy+ddy/m,an=Math.atan2(ddy,ddx);
    ctx.save();ctx.translate(ex,ey);ctx.rotate(an);
    ctx.fillStyle="#7fe6d8";ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(-6,-6);ctx.lineTo(-6,6);ctx.closePath();ctx.fill();
    ctx.restore();
    ctx.fillStyle="#7fe6d8";ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
    ctx.fillText("ВЫ",ex-Math.cos(an)*16,ey-Math.sin(an)*16+3);
  }
  /* маршрут домена — под курсом игрока: мир под намерением, а не наоборот */
  drawFactRoute(vis);
  /* свой маршрут — поверх маршрута домена: это намерение игрока, и оно главнее */
  if(typeof drawRouteMap==="function")drawRouteMap(vis);
  if(typeof drawBargesMap==="function")drawBargesMap(vis);
  /* сколько машин работает на тебя в этой системе (M237) */
  if(typeof drawDronesMap==="function")drawDronesMap(vis);
  /* погасший рукав смотрителей (11k): прокладка стоит больше топлива */
  const cost=Math.round((9+dsel*13)*((typeof keepersJumpK==="function")?keepersJumpK():1));
  const bad=dsel>st.jump+.02||cost>G.fuel||dsel===0;
  /* ── подвал карты: сначала расклад, потом рисование ──
     Слева — про прыжок (цена, расстояние, маршрут), справа — итоги (тела,
     виды, деньги, фронт). На широком экране это две колонки в одну строку;
     на телефоне они не помещаются рядом и раньше просто наезжали друг на
     друга посередине («СЕКТОР 1:0 · 0.00 из 3.00 пкзанято систем: 8»), а
     правая вдобавок уходила под кнопки правого борта. Здесь решается, влезут
     они рядом или встанут столбиком, — и только потом что-то рисуется. */
  MAP_BOX=[];
  const foot=(()=>{
    const RX=mapRail();
    const L=[],Rr=[];
    /* выбрана станция следующего плеча — прыжок так и называется (M289, R2) */
    const NX=(typeof routeNext==="function"&&routeOf().legs.length>=2)?routeNext():null;
    const onRoute=NX&&NX.sys.sx===G.sel.x&&NX.sys.sy===G.sel.y;
    L.push([bad?"rgba(255,107,87,.85)":"#f2b25c",
      dsel===0?"ТЕКУЩАЯ СИСТЕМА":
      (dsel>st.jump+.02?"ВНЕ РАДИУСА · примерно "+Math.ceil(dsel/Math.max(.5,st.jump))+" "+pl3(Math.ceil(dsel/Math.max(.5,st.jump)),"прыжок","прыжка","прыжков"):
       (onRoute?"ПРЫЖОК ПО МАРШРУТУ: ":"ПРЫЖОК: ")+cost+" топлива"+(cost>G.fuel?" — НЕ ХВАТАЕТ":""))]);
    /* карточка стала строкой (M298): первый вопрос — «что это и дотянусь ли» — отвечается тут;
       описание — вторым тапом по той же звезде. На телефоне 31.7% экрана было интерфейсом */
    const ss=sel?sel.s:null;
    L.push(["rgba(127,230,216,.55)",
      (ss?((typeof nameOf==="function")?nameOf(ss):ss.name).toUpperCase()+" · "+ss.cls.ru+" · "+ss.planets.length+" "+pl3(ss.planets.length,"планета","планеты","планет")+
          (ss.station?" · станция":"")+(ss.belt?" · пояс":"")+" · ":"СЕКТОР "+G.sel.x+":"+G.sel.y+"   ·   ")+
      dsel.toFixed(2)+" из "+st.jump.toFixed(2)+" пк"+
      ((typeof rungFootTxt==="function")?rungFootTxt(G.sel.x,G.sel.y):"")]);   /* пятилетка римской цифрой (M292) */
    if(typeof routeOf==="function"&&routeOf().legs.length>=1)
      L.push(["rgba(127,230,216,.75)",routeLine()]);
    Rr.push(["rgba(93,115,130,.85)","ТЕЛ "+G.found.size+" · ВИДОВ "+G.species.size+" · "+
      Math.round(G.credits).toLocaleString("ru")+" кр"]);
    const occN=G.occ?Object.keys(G.occ).length:0;
    if(occN||(G.freed|0))
      Rr.push([occN?"rgba(255,107,87,.75)":"rgba(143,208,138,.75)",occSummary()]);
    /* влезут ли рядом: меряем самые длинные из обеих колонок */
    ctx.font="10px ui-monospace,monospace";
    /* строка длиннее борта делится по « · » (M300): на телефоне описание
       системы уходило под кнопки КАРТА и МЕНЮ и обрывалось на «10.82 из 3.0» */
    const avail=RX-32;
    for(let i=0;i<L.length;i++){
      if(ctx.measureText(L[i][1]).width<=avail)continue;
      const segs=L[i][1].split(" · "),rows=[];let cur0="";
      for(const sg of segs){const t=cur0?cur0+" · "+sg:sg;if(cur0&&ctx.measureText(t).width>avail){rows.push(cur0);cur0=sg;}else cur0=t;}
      if(cur0)rows.push(cur0);
      L.splice(i,1,...rows.map(t=>[L[i][0],t]));i+=rows.length-1;
    }
    const wid=a=>a.reduce((m,r)=>Math.max(m,ctx.measureText(r[1]).width),0);
    const side=wid(L)+wid(Rr)+24<=RX-16-16;
    const rows=[];
    if(side)for(let i=0;i<Math.max(L.length,Rr.length);i++)rows.push([L[i]||null,Rr[i]||null]);
    else{for(const r of L)rows.push([r,null]);for(const r of Rr)rows.push([r,null]);}
    return {rows,side,RX};
  })();
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
    /* точки прыжков по курсу (M299): сколько раз придётся прыгать — видно по
       линии, а не по цифре в подвале */
    if(far&&st.jump>.5){
      const n=Math.floor(dsel/st.jump);
      for(let i=1;i<=n;i++){
        const t=i*st.jump/dsel,hx=x0+(x1-x0)*t,hy=y0+(y1-y0)*t;
        ctx.fillStyle="rgba(242,178,92,.85)";ctx.beginPath();ctx.arc(hx,hy,2.6,0,TAU);ctx.fill();
      }
    }
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
  if(sel&&!G.mapClean){
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
    /* ширину карточка берёт до правого борта, а не до края экрана: кнопки
       КАРТА и МЕНЮ стоят там всегда, и угол карточки уезжал под них */
    if(!G.mapMore){ctx.stroke();}   /* карточка — только по второму тапу (M298) */
    if(G.mapMore){
    const cw=Math.min(300,mapRail()-32), cx=16;
    ctx.font="9px ui-monospace,monospace";
    /* высота — по числу строк описания, а не константой 104: у длинного
       описания четвёртая строка вылезала за плашку */
    const dn=wrapCount(s.desc,cw-24), ch=54+dn*11+8;
    const cy=Math.round(mapDeck()-16*(foot.rows.length-1)-12-ch);
    ctx.fillStyle="rgba(6,10,16,.62)";ctx.fillRect(cx,cy,cw,ch);
    ctx.strokeStyle="rgba(127,230,216,.18)";ctx.strokeRect(cx+.5,cy+.5,cw,ch);
    mapBox("карточка системы",cx,cy,cw,ch);
    ctx.textAlign="left";
    ctx.fillStyle="#f2b25c";ctx.font="13px ui-monospace,monospace";
    ctx.fillText(((typeof nameOf==="function")?nameOf(s):s.name).toUpperCase(),cx+12,cy+22);   /* ваше имя (11u) */
    ctx.fillStyle="rgba(127,230,216,.65)";ctx.font="9px ui-monospace,monospace";
    ctx.fillText(s.cls.ru+" · "+s.planets.length+" планет"+(s.station?" · СТАНЦИЯ":"")+(s.belt?" · ПОЯС":""),cx+12,cy+38);
    ctx.fillStyle="rgba(160,182,192,.62)";
    wrapLeft(s.desc,cx+12,cy+54,cw-24,11);
    }
  }
  /* ── подвал: одним циклом, снизу вверх ── */
  if(!G.mapClean){const deck=mapDeck();
   ctx.font="10px ui-monospace,monospace";
   foot.rows.forEach((row,i)=>{
     const y=deck-i*16;
     if(row[0]){ctx.textAlign="left";ctx.fillStyle=row[0][0];ctx.fillText(row[0][1],16,y);
       mapBox("подвал слева",16,y-9,ctx.measureText(row[0][1]).width,12);}
     if(row[1]){ctx.textAlign="right";ctx.fillStyle=row[1][0];ctx.fillText(row[1][1],foot.RX,y);
       const w=ctx.measureText(row[1][1]).width;mapBox("подвал справа",foot.RX-w,y-9,w,12);}
   });
   ctx.textAlign="right";}
  G.prompt=G.mapClean?"":(G.mapPeek?"ТАП — ВЫБОР · НАЗАД — НА СТАНЦИЮ":"ТАП — ВЫБОР · ЕЩЁ РАЗ — ПОДРОБНЕЕ · ДЕЙСТВИЕ — ПРЫЖОК");
  if(actEdge){
    if(G.mapPeek)say("Сначала отстыкуйтесь");
    else if(!bad)jump(cost);
    else if(dsel>0)say("Прыжок невозможен");
  }
}
function jump(cost){
  /* уходя, платит не только топливо: тех, кто сел вам на хвост, вы оставляете
     над головами живущих внизу (M110, 12t-settle) */
  if(typeof settleLeftBehind==="function")settleLeftBehind();
  if(typeof quietLeave==="function")quietLeave();   /* тихий уезд (11n): прошло больше, чем прожито */
  G.fuel-=cost;G.sx=G.sel.x;G.sy=G.sel.y;G.sys=getSystem(G.sx,G.sy);G.ap=null;
  if(typeof odoAdd==="function")odoAdd("jumps");   // путь, по которому зреет память (11d)
  if(typeof vegaJump==="function")vegaJump();        // укачивает (M153)
  if(typeof ringJump==="function")ringJump();        // Кольцо считает прыжки (M154)
  if(typeof expPaxJump==="function")expPaxJump();    // попутчик говорит по фразе за прыжок (M156)
  if(typeof traineeJump==="function")traineeJump();  // стажёр растёт по прыжкам (M163)
  const a=Math.random()*TAU,r=1500;
  G.ship.x=Math.cos(a)*r;G.ship.y=Math.sin(a)*r;
  G.ship.vx=-Math.cos(a)*.7;G.ship.vy=-Math.sin(a)*.7;G.ship.a=a+Math.PI;
  G.mode="system";
  spawnPirates();spawnAllies();
  sfx("jump");
  /* Жестянка (12z) слышна с порога: она передаёт свою просьбу в пустоту и не
     знает, что её некому исполнить. Работающая смена молчит */
  if(typeof tinSignal==="function")tinSignal();
  /* мачта в этом секторе (M218): пришёл сам — увидел её своими глазами, и
     если там кто-то живёт, ему есть чем отблагодарить за привезённые новости */
  if(typeof relayArrive==="function")relayArrive();
  /* «Тихоня» (11at, M231): если ей время — её застают у родного причала */
  if(typeof giftArrive==="function")giftArrive();
  saveGame(true);
  logAdd("dim","Прыжок в "+G.sys.name+" ("+G.sx+":"+G.sy+") · −"+cost+" топлива"+
    (G.pirates.length?" · чужих сигнатур: "+G.pirates.length:""));
  say("Прибытие: "+G.sys.name+"\n"+G.sys.cls.ru+
    (G.sys.station?"\nстанция":"")+(G.sys.belt?"\nпояс астероидов":"")+
    (G.pirates.length?"\nчужие сигнатуры: "+G.pirates.length:""));
}
