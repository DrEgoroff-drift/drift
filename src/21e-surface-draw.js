/* ══════════════ поверхность: подсказка, HUD и кадр ══════════════
   Отрезано от 21-mode-surface на распиле 0.108.x: вход и ход остались там,
   подсказка, навигационные метки и отрисовка кадра — здесь. */
function surfaceHint(){
  const S=G.surf;if(!S)return null;
  const dShip=Math.abs(S.x-S.shipX);
  if(S.suit<35)return "СКАФАНДР НА ИСХОДЕ · К КОРАБЛЮ ИЛИ КНОПКА → КОРАБЛЬ";
  if(dShip<shipZoneR()){
    if(baseAt(G.sx,G.sy,S.p.idx))return "ЗДЕСЬ ВАША БАЗА · ДЕЙСТВИЕ — СПУСТИТЬСЯ ВНИЗ";
    if(S.p.type!=="gas")return "У КОРАБЛЯ МОЖНО ЗАЛОЖИТЬ БАЗУ · ДЕЙСТВИЕ · 2500 КР + 10 СПЛАВОВ";
  }
  if(S.cave&&Math.abs(S.cave.x-S.x)<34)return "ВХОД В ПЕЩЕРУ · ДЕЙСТВИЕ — ВНУТРЬ";
  {const mx=(typeof mineSpotX==="function")?mineSpotX(S.p):null;
   if(mx!=null&&Math.abs(mx-S.x)<MINE_MOUTH_R)return "ВАША ШАХТА · ДЕЙСТВИЕ — ВНИЗ";}
  if(!G.surfTipShown||G.t-G.surfTipShown<900){
    if(!G.surfTipShown)G.surfTipShown=G.t;
    return "ЦВЕТНЫЕ КРИСТАЛЛЫ — ЗАЛЕЖИ · СТРЕЛКИ СВЕРХУ ВЕДУТ К ПЕЩЕРЕ И КОРАБЛЮ";
  }
  return null;
}
function drawSurfaceHud(camx,camy,K){
  K=K||1;
  const S=G.surf;
  ctx.textAlign="center";
  /* строка-подсказка сверху */
  /* Полоса идёт ниже приборов: сверху слева датчики, справа сводка системы,
     справа же колонка кнопок — туда текст залезать не должен.
     Высоту приборов больше не угадываем константой: состав строк меняется по
     экрану (скафандр, ранец, критическое топливо), и 58 px, посчитанные под
     три строки, под пятью оказывались внутри полосы. `HUD_BAND` (28-loop)
     меряет её по DOM, здесь только отступ. */
  /* HUD_BAND измерен по DOM, то есть в настоящих пикселях экрана; здесь мы
     рисуем в UI-мерке, поэтому его надо в неё же и перевести (M221) */
  const U=(typeof UIK==="number"&&UIK>0)?UIK:1;
  const TOP=Math.max(58,(typeof HUD_BAND==="number"?HUD_BAND/U:58)+10), RIGHT_PAD=118;
  const hint=surfaceHint();
  if(hint){
    ctx.font="10px ui-monospace,monospace";
    /* длинная подсказка не вылезает за плашку — ужимается с многоточием (M167) */
    let ht=hint;
    const maxW=W-RIGHT_PAD-34;
    while(ht.length>4&&ctx.measureText(ht).width>maxW)ht=ht.slice(0,-4)+"…";
    const w=Math.min(W-RIGHT_PAD-20,ctx.measureText(ht).width+22);
    const cx=(W-RIGHT_PAD)/2;
    ctx.fillStyle="rgba(5,7,12,.72)";ctx.fillRect(cx-w/2,TOP,w,20);
    ctx.strokeStyle="rgba(127,230,216,.28)";ctx.lineWidth=1;
    ctx.strokeRect(cx-w/2+.5,TOP+.5,w-1,19);
    ctx.fillStyle="rgba(190,235,240,.92)";ctx.fillText(ht,cx,TOP+14);
  }
  /* навигатор: маркеры цели у верхней кромки — корабль и пещера */
  const marks=[];
  marks.push({x:S.shipX,ru:"КОРАБЛЬ",col:"rgba(242,178,92,.9)"});
  if(S.cave)marks.push({x:S.cave.x,ru:"ПЕЩЕРА",col:"rgba(150,225,255,.9)"});
  /* своя шахта ведётся так же, как пещера: до неё идут ногами, значит её надо
     найти. Цвет — рабочего железа, не природы (M234) */
  {const mx=(typeof mineSpotX==="function")?mineSpotX(S.p):null;
   if(mx!=null)marks.push({x:mx,ru:"ШАХТА",col:"rgba(214,198,172,.9)"});}
  if(typeof lightsOpen==="function"&&lightsOpen(S.p))marks.push({x:lightsEntryX(S.tr,S.p),ru:"ВХОД",col:"rgba(255,236,190,.9)"});
  /* дом (M170): до него надо дойти, значит его надо и найти — свой маркер,
     тёплого цвета, чтобы не путать с кораблём */
  if(typeof homeHereP==="function"&&homeHereP(S.p)){
    const hx=homeSpotX(S.p,S.tr);
    if(hx!=null)marks.push({x:hx,ru:"ДОМ",col:"rgba(255,206,138,.95)"});
  }
  /* достопримечательность ведут отдельно от пещеры: до неё далеко, и без
     маркера игрок пройдёт мимо ровно того, ради чего стоило садиться */
  const poi=nearestPOI(S.tr,S.x);
  if(poi)marks.push({x:poi.x,ru:poi.ru,col:"rgba(212,180,255,.9)"});
  /* фишки у кромки (M167): далёкая цель — плашка у левого или правого края,
     по стороне, где она; фишки одной стороны стоят столбиком и не наезжают
     ни друг на друга, ни на солнце в небе. Ближняя цель — засечка на месте. */
  ctx.font="9px ui-monospace,monospace";
  let leftY=(hint?TOP+34:TOP+6),rightY=leftY,rowY=leftY;
  /* два прохода (M352): сперва фишки у кромок, потом засечки на месте — засечка
     у самого края ложилась текстом поперёк второй фишки того же столбика
     («ОСТОВ КОРАБЛЯ» поверх «ПЕЩЕРА 5592 м»), потому что считала ряды сама */
  const far=[],near=[];
  for(const m of marks){const ad=Math.abs(m.x-S.x);(ad*K>W*.45?far:near).push(m);}
  for(const m of far.concat(near)){
    const d=m.x-S.x, ad=Math.abs(d);
    ctx.fillStyle=m.col;
    if(ad*K>W*.45){                       // цель за краем — фишка у своей кромки
      const dir=Math.sign(d);
      const label=m.ru+" "+Math.round(ad)+" м";
      const tw=ctx.measureText(label).width,cw=tw+24,ch=15;
      const rx=dir>0?W-RIGHT_PAD-8-cw:8;
      const ry=dir>0?(rightY+=0,rightY):(leftY+=0,leftY);
      if(dir>0)rightY+=ch+4;else leftY+=ch+4;
      ctx.fillStyle="rgba(5,7,12,.72)";ctx.fillRect(rx,ry,cw,ch);
      ctx.strokeStyle=m.col;ctx.globalAlpha=.5;ctx.lineWidth=1;ctx.strokeRect(rx+.5,ry+.5,cw-1,ch-1);ctx.globalAlpha=1;
      ctx.fillStyle=m.col;
      const ax=dir>0?rx+cw-7:rx+7;
      ctx.beginPath();
      ctx.moveTo(ax+dir*4,ry+ch/2);ctx.lineTo(ax-dir*3,ry+ch/2-4);ctx.lineTo(ax-dir*3,ry+ch/2+4);
      ctx.closePath();ctx.fill();
      const old=ctx.textAlign;ctx.textAlign=dir>0?"right":"left";
      ctx.fillText(label,dir>0?rx+cw-14:rx+14,ry+11);
      ctx.textAlign=old;
    }else{
      const sx=clamp((m.x-camx)*K,64,W-RIGHT_PAD-14);
      if(rowY<Math.max(leftY,rightY)-6)rowY=Math.max(leftY,rightY)-6;   // ниже столбиков фишек
      rowY+=13;
      ctx.fillRect(sx-1,rowY-5,2,10);
      /* у правой кромки подпись уходит влево от засечки, иначе обрезается */
      const old=ctx.textAlign;ctx.textAlign=sx>W-RIGHT_PAD-120?"right":"left";
      ctx.fillText(m.ru,sx,rowY+16);ctx.textAlign=old;
    }
  }
}
/* сам мир поверхности — отдельным слоем (21e1, M415) */


/* ── масштаб мира под размер окна (M217) ──
   Жалоба внешнего плейтеста: «двадцать секунд не мог найти себя на поверхности».
   Дело было не в рисунке ходока, а в мерке: камера шла ровно по пикселю, и
   рост человека мерился монитором, а не кадром — 3.6% высоты в окне 720 и
   1.8% на 1440p. Чем лучше экран, тем мельче человек.

   Мерка — доля кадра. База 560: при ней 26 нарисованных пикселей ходока
   держатся около 4.6% высоты на любом экране. Выше 2.4 не поднимаемся — за
   этим пределом в кадр перестаёт помещаться дорога до цели, и мир становится
   комнатой. Малое окно не ужимаем (k≥1): телефону и так достаётся мало мира.

   Мир идёт через ctx-масштаб (withScale, 18c), приборы и фишки — нет: текст
   обязан остаться того же роста и той же чёткости, чем бы ни был занят мир. */
const SURF_BASE=560, SURF_WIDE=1000, SURF_KMAX=2.4;
/* ── и мерка обязана видеть ОБЕ стороны кадра (M222) ──
   Первый счёт брал одну высоту. У телефона высота как у монитора, а ширина
   втрое меньше: мир увеличивался в полтора раза, и в кадр переставала
   помещаться дорога — оставалась щель шириной в триста единиц мира. Кадр
   двумерен, значит и мерка двумерна: растём настолько, насколько позволяет
   ТЕСНАЯ сторона. 1000 к 560 — это те же 16:9, поэтому на обычном мониторе
   обе стороны говорят одно и то же, а узкий экран получает единицу. */
/* ── вода (M325) ──
   На поверхности не было ни одной воды — камыши из M316 ждали её. Озеро
   ложится в самую глубокую ложбину полосы, если полоса сырая (tr.wet — то же
   поле, что красит зелёные пятна глобуса) и миру есть чем быть мокрым;
   на токсичном мире это кислота своего цвета. Уровень — на два-три роста
   ниже гребней ложбины, зеркало не короче двухсот шагов, иначе это лужа.
   Считается один раз на рельеф (tr.water) — рельеф не меняется.
   Отражение — самокопия кадра: полоса над урезом переворачивается под него,
   режется на ленты со сдвигом по синусу (рябь) и гаснет с глубиной; ветер
   кладёт блики. Камыш по обоим берегам — тот, что ждал воды. */
const WATER_MIN_SPAN=200,WATER_DEPTH=46;
function waterOf(tr,p){
  if(tr.water!==undefined)return tr.water;
  tr.water=null;
  const t=p&&p.type;
  const liquid=(p&&p.T&&p.T.atm!=="отсутствует")&&(t==="terran"||t==="jungle"||t==="ocean"||t==="toxic"||t==="ruin"||t==="rocky");
  if(!liquid||(tr.wet||0)<(t==="ocean"?.15:.32))return null;
  const r=rng((tr.sseed|0)^0x7A7E);
  /* самая глубокая точка полосы, не под площадкой */
  let i0=-1,y0=-1e9;
  for(let i=40;i<tr.N-40;i++){if(Math.abs(i-tr.padI)<70)continue;if(tr.h[i]>y0){y0=tr.h[i];i0=i;}}
  if(i0<0)return null;
  const M=(typeof HOME_MAN==="number")?HOME_MAN:17;
  const level=y0-M*(2.2+r()*1.2);
  let a=i0,b=i0;
  while(a>1&&tr.h[a-1]>level)a--;
  while(b<tr.N-2&&tr.h[b+1]>level)b++;
  const x0=a*tr.step,x1=b*tr.step;
  if(x1-x0<WATER_MIN_SPAN)return null;
  tr.water={x0,x1,y:level,cx:(x0+x1)/2,acid:t==="toxic",seed:tr.sseed|0,reeds:Math.round(4+r()*5)};
  return tr.water;
}
/* ── водоросли (M327): что собирают, плавая ──
   Автор: «надо придумать механику, чтобы плыть… и что-то собирать, водоросли».
   Кусты на дне озера, сеются от озера, снимаются раз за визит — эфемерны, как
   залежи. Дают органику: ресурс уже есть, цена и рынок — тоже. */
function waterAlgae(Wt){
  if(Wt.algae)return Wt.algae;
  const r=rng(Wt.seed^0xA16A),n=3+Math.floor(r()*3),span=Wt.x1-Wt.x0;
  Wt.algae=[];
  for(let i=0;i<n;i++)Wt.algae.push({x:Wt.x0+span*(.15+.7*(i+r()*.6)/n),h:12+r()*12,ph:r()*TAU,taken:false});
  return Wt.algae;
}
function waterAlga(S,tr){
  const Wt=(typeof waterOf==="function")?waterOf(tr,S.p):null;
  if(!Wt)return null;
  return waterAlgae(Wt).find(a=>!a.taken&&Math.abs(a.x-S.x)<22)||null;
}
/* глубоко ли под ногами: плыть, а не идти по дну */
function waterDeepAt(S,tr){
  const Wt=(typeof waterOf==="function")?waterOf(tr,S.p):null;
  if(!Wt||S.x<Wt.x0+6||S.x>Wt.x1-6)return null;
  return (groundAt(tr,S.x)-Wt.y>14)?Wt:null;
}
function drawWater(tr,camx,camy,p){
  const Wt=waterOf(tr,p);
  if(!Wt)return;
  const xa=Wt.x0-camx,xb=Wt.x1-camx;
  if(xb<-40||xa>W+40)return;
  const y=Wt.y-camy;
  if(y<0||y>H+20)return;
  const sky=p.T.sky[1],pal=p.T.pal[Math.min(p.T.pal.length-1,2)];
  const col=Wt.acid?[120,180,60]:[sky[0]*.78+pal[0]*.12,sky[1]*.82+pal[1]*.12,sky[2]*.9+pal[2]*.1];
  const wind=(typeof WIND==="number")?WIND:0;
  /* зеркало: контур — уровень сверху, дно по рельефу */
  ctx.save();
  ctx.beginPath();ctx.moveTo(xa,y);ctx.lineTo(xb,y);
  for(let x=Wt.x1;x>=Wt.x0;x-=tr.step*2)ctx.lineTo(x-camx,groundAt(tr,x)-camy+1);
  ctx.closePath();ctx.clip();
  /* толща: у уреза цвет неба, в глубине — тёмный тон породы */
  const g=ctx.createLinearGradient(0,y,0,y+WATER_DEPTH);
  g.addColorStop(0,"rgb("+col.map(v=>v|0).join(",")+")");
  g.addColorStop(1,"rgb("+col.map(v=>(v*.5)|0).join(",")+")");
  ctx.fillStyle=g;ctx.fillRect(xa,y,xb-xa,WATER_DEPTH+40);
  /* водоросли (M327): кусты со дна, качаются медленнее камыша — вода вязче ветра */
  for(const a of waterAlgae(Wt)){
    if(a.taken)continue;
    const ax=a.x-camx;if(ax<-24||ax>W+24)continue;
    const by=groundAt(tr,a.x)-camy,tp=Math.max(y+5,by-a.h);
    const sw=Math.sin(G.t*.035+a.ph)*3;
    ctx.strokeStyle="rgba(38,92,54,.88)";ctx.lineWidth=1.7;ctx.lineCap="round";
    for(let k=-1;k<=1;k++){
      ctx.beginPath();ctx.moveTo(ax+k*3,by+1);
      ctx.quadraticCurveTo(ax+k*3+sw*.4,(by+tp)/2,ax+k*4.5+sw,tp+Math.abs(k)*4);ctx.stroke();
    }
    ctx.fillStyle="rgba(128,196,96,.75)";                 /* светлые макушки — их и видно с берега */
    for(let k=-1;k<=1;k++){ctx.beginPath();ctx.arc(ax+k*4.5+sw,tp+Math.abs(k)*4,1.6,0,TAU);ctx.fill();}
  }
  /* отражение: полоса над урезом, перевёрнутая, лентами со сдвигом */
  const hh=Math.min(64,y);
  if(hh>6){
    const sx0=Math.max(0,Math.floor(xa)),sw=Math.min(W,Math.ceil(xb))-sx0;
    if(sw>4){
      const n=8,bh=hh/n;
      for(let i=0;i<n;i++){
        const t=(i+.5)/n;
        const dx=Math.sin(G.t*.9+i*1.7+Wt.seed)*(1+2*t)+wind*2*t;
        const syTop=y-hh+i*bh;         /* лента источника, считая от верха полосы */
        const dyTop=y+(hh-(i+1)*bh);   /* в зеркале верхняя лента ложится глубже всего */
        ctx.globalAlpha=.5*(1-t*.6);
        ctx.save();ctx.translate(0,dyTop+bh);ctx.scale(1,-1);
        ctx.drawImage(cvs,sx0*DPR,syTop*DPR,sw*DPR,Math.ceil(bh)*DPR,sx0+dx,0,sw,Math.ceil(bh));
        ctx.restore();
      }
      ctx.globalAlpha=1;
    }
  }
  /* блики по ветру: короткие светлые штрихи у уреза */
  ctx.fillStyle="rgba(255,255,255,.22)";
  const rr=rng(Wt.seed^0x11);
  for(let i=0;i<14;i++){
    const fx=Wt.x0+rr()*(Wt.x1-Wt.x0),ph=rr()*TAU,ln=4+rr()*10,dy=2+rr()*10;
    const a=.5+.5*Math.sin(G.t*.07+ph+wind*3);
    if(a<.4)continue;
    ctx.globalAlpha=(a-.4)*.6;
    ctx.fillRect(fx-camx+Math.sin(G.t*.03+ph)*6,y+dy,ln,1);
  }
  ctx.globalAlpha=1;
  ctx.restore();
  /* урез: тонкая светлая нить */
  ctx.strokeStyle="rgba(255,255,255,.28)";ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(xa,y+.5);ctx.lineTo(xb,y+.5);ctx.stroke();
  /* камыш по берегам */
  const rc=rng(Wt.seed^0x5EED);
  const reed=(x,n,dir)=>{
    for(let i=0;i<n;i++){
      const rx=x+dir*(i*5+rc()*4),ry=groundAt(tr,rx)-camy,h=14+rc()*16;
      const sw=Math.sin(G.t*.05+rx*.1)*(1.5+wind*3);
      ctx.strokeStyle="rgba(34,52,28,.85)";ctx.lineWidth=1.1;
      ctx.beginPath();ctx.moveTo(rx-camx,ry);ctx.quadraticCurveTo(rx-camx+sw*.5,ry-h*.6,rx-camx+sw,ry-h);ctx.stroke();
      ctx.fillStyle="rgba(78,58,34,.9)";
      ctx.beginPath();ctx.ellipse(rx-camx+sw,ry-h+2,1.2,3.2,0,0,TAU);ctx.fill();
    }
  };
  reed(Wt.x0-3,Wt.reeds,-1);reed(Wt.x1+3,Wt.reeds,1);
}
function surfScale(){return clamp(Math.min(H/SURF_BASE,W/SURF_WIDE),1,SURF_KMAX);}
function drawSurface(){
  const K=surfScale();
  /* единственный источник правды о масштабе на кадр: по нему же 15-input
     пересчитывает тычок в мировую координату */
  G.viewK=K;
  withScale(K,drawSurfaceWorld);
  /* ── приборы живут в мерке ИНТЕРФЕЙСА, а не мира (M221) ──
     Фишки целей и строка-подсказка рисуются на канве, а рядом с ними лежит
     DOM, который с M221 растёт вместе с окном (`--ui`). Оставить их в пикселях
     значило бы развести надвое один и тот же интерфейс: половина выросла,
     половина нет. Рисуем их в UI-мерке; мировая координата попадает туда
     делением на неё же — отсюда K/U. */
  const U=(typeof UIK==="number"&&UIK>0)?UIK:1;
  withScale(U,()=>drawSurfaceHud(G.viewX,G.viewY,K/U));
}
