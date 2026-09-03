/* ══════════════ посёлок с земли ══════════════
   M169. До этого прохода посёлок был рядом одинаковых коробок: дом ростом с
   человека, шаг двадцать шесть пикселей, одно окно, и печь, кузня и запруда
   выглядели совершенно одинаково. Механика решала, что поднять, а на глаз
   ничего не менялось — та же ложь, что перк без кода.

   ПРАВИЛА ЭТОГО ФАЙЛА (нарушение любого видно сразу):

   1. МЕРИЛО — ЧЕЛОВЕК. Житель 17 пикселей (11h). Изба — два с половиной
      человека, сарай — три, печь — полтора. Коробка в рост человека читается
      ящиком, а не жильём.
   2. МЕСТО РОВНОЕ. Люди не строят на склоне — они срезают полку. Отсюда
      терраса: подпорная стенка снизу, срезанный борт сверху, улица между.
      Раньше дворы ступеньками сползали по холму, и это читалось как осыпь.
   3. У КАЖДОГО РЕМЕСЛА СВОЁ ТЕЛО. Печь — купол с аркой топки; кузня — навес,
      горн и наковальня; перегонка — бак со змеевиком и бочки; камнерезка —
      козлы и штабель плит; запруда — насыпь с водой; поле — гряды и пугало.
      Узнать ремесло надо силуэтом, а не подписью.
   4. ДВА ПЛАНА. Задний ряд мельче, темнее и выше по склону — глубина делается
      перекрытием и тоном, никогда размытием.
   5. ОДИН СВЕТ. Всё освещено по SUN_DIR (19c): освещённый скат, теневая
      стена, тень на землю в одну сторону. Разнобой света убивает посёлок
      быстрее, чем бедность форм.
   6. БЫТ ВАЖНЕЕ АРХИТЕКТУРЫ. Поленница, бочка, верёвка с бельём, корзины,
      натоптанная тропа — по ним читается, что здесь живут. Пустые правильные
      домики читаются как макет.

   Наружу: `settlePlan(S,tr,p)` (кому нужны дворы — 11h берёт отсюда окна) и
   `settleDrawBody(S,tr,camx,camy,p)`, который зовёт `settleDraw` из 12t. */

const SD_MAN=17;                                  /* рост жителя: всё меряется им */
/* сколько человек в высоту: изба, сарай, мастерская, печь */
const SD_KIND={
  dwell:{h:2.4,w:2.6},  barn:{h:2.9,w:3.1},
  field:{h:1.1,w:3.4},  weir:{h:1.2,w:3.2},  kiln:{h:1.7,w:1.9},
  cut:  {h:1.5,w:2.6},  forge:{h:2.1,w:2.7}, still:{h:1.8,w:2.2}
};
/* материал стен и кровли по миру: солома на льду и плитка в джунглях читаются
   как чужие декорации, поэтому набор берётся от типа планеты */
function sdMat(p){
  const t=p&&p.type;
  if(t==="ice")     return {wall:"stone",roof:"plank",warm:.86};
  if(t==="rocky"||t==="volcanic")return {wall:"stone",roof:"tile",warm:.95};   /* камень кроют черепицей (было: солома на скале) */
  if(t==="desert")  return {wall:"adobe",roof:"tile", warm:1.08};
  if(t==="toxic")   return {wall:"plate",roof:"plate",warm:.9};
  if(t==="jungle")  return {wall:"log",  roof:"thatch",warm:1};
  if(t==="ocean")   return {wall:"plank",roof:"thatch",warm:1};
  return {wall:"log",roof:"thatch",warm:1};
}
function sdRGB(c){return "rgb("+(c[0]|0)+","+(c[1]|0)+","+(c[2]|0)+")";}
function sdMix(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];}
/* цвета посёлка: от палитры мира, но сдвинуты в тёплое — жильё обязано
   отличаться от грунта, иначе двор тонет в склоне */
/* ── план дома: один на всё жильё (M322) ──
   Дом игрока (21f, M307) и избы посёлка (sdDwell) сеяли план каждый по-своему,
   с разными правилами кровли: у дома скала крылась черепицей, у посёлка на той
   же скале — соломой. Теперь план один: ширина и высота стен, скат, материал
   стен и кровли по миру (sdMat), вариант плана (0 изба, 1 крыльцо, 2 сенцы,
   3 второе и чердачное окно), зеркало, сдвиг окна, сторона поленницы, возраст
   сруба и оттенки. Один seed — один дом, при каждом приходе тот же. */
function housePlan(seed,p,opt){
  opt=opt||{};
  const r=rng(hashi(seed,17,0xD0E1)),M=sdMat(p),barn=!!opt.barn;
  const variant=Math.floor(r()*4),flip=r()>.5;
  return {seed,variant,flip,barn,
    w:3.1+r()*.8,wallH:barn?.68+r()*.08:.54+r()*.16,roofH:.8+r()*.4,
    roofKind:M.roof,wallKind:M.wall,
    win:.04+r()*.14,doorSide:flip?1:-1,pile:r()<.5?-1:1,
    age:r()*.18,roofTint:(r()-.5)*.26,wallTint:(r()-.5)*.20};
}
function sdPal(p){
  const pal=p.T.pal, M=sdMat(p);
  const base=pal[Math.min(pal.length-1,2)];
  /* Стена держится МЕСТНОГО тона и лишь подогревается: общий бежевый на .52
     делал посёлок чужим набором, наклеенным на зелёный мир (самокритика M169).
     Камень же, наоборот, нейтрально-серый: подмешанный из палитры мира он
     уходил в небесно-голубой, и камнерезка читалась бассейном. */
  const wall=sdMix(base,[168,142,108],.34).map(v=>v*M.warm);
  const roof=sdMix(pal[1],[86,68,52],.42);
  return {
    wall, wallLit:sdMix(wall,[255,236,196],.30), wallDark:sdMix(wall,[16,20,28],.42),
    roof, roofLit:sdMix(roof,[236,214,170],.34), roofDark:sdMix(roof,[12,16,24],.40),
    wood:sdMix(base,[112,84,56],.58),
    stone:sdMix([128,126,120],base,.18),
    earth:sdMix(pal[Math.min(pal.length-1,3)],[92,74,52],.38)
  };
}
/* воздушная перспектива: дальний ряд не затемняется, а СВОДИТСЯ К НЕБУ —
   так работает воздух. Затемнение дало бы силуэт в тени, а не даль */
function sdFarPal(pal,p){
  const sky=(p.T&&p.T.sky&&p.T.sky[1])||[120,140,160];
  const k=.34,out={};
  for(const key in pal)out[key]=sdMix(pal[key],sky,k);
  return out;
}
/* ── планировка ──
   Считается один раз на состав посёлка: где полка, где улица, что где стоит.
   Дворы чередуются по рядам, ремёсла уходят на края (дым от жилья), жильё
   держится середины. Разброс — из зерна посёлка, поэтому два посёлка не
   похожи, но один и тот же не перестраивается на глазах. */
function settlePlan(S,tr,p){
  const bx=settleSpotX(p,tr);if(bx==null)return null;
  const built=(S&&S.built)||[];
  const extra=(typeof grownExtra==="function")?grownExtra(p):0;
  const hk=(typeof countyHouseK==="function")?countyHouseK(p):1;
  const key=built.join("|")+"/"+extra+"/"+Math.round(hk*20)+"/"+Math.round(bx);
  if(S&&S._plan&&S._plan.key===key)return S._plan;
  const r=rng(hashi((S&&S.seed)|0,built.length*37+extra,0x5E7D));
  const yards=[];
  /* жильё: два двора всегда плюс один на каждые две постройки — посёлок растёт
     людьми, а не только цехами */
  const homes=2+Math.floor((built.length+extra)/2);
  for(let i=0;i<homes;i++)yards.push({kind:i===1?"barn":"dwell",r:r()});
  for(const k of built)yards.push({kind:k,r:r()});
  for(let i=0;i<extra;i++)yards.push({kind:"dwell",r:r()});
  /* порядок вдоль улицы: жильё в середину, ремесло по краям — так посёлок
     читается как поселение, а не как промзона */
  const rank=y=>(y.kind==="dwell"||y.kind==="barn")?0:1;
  yards.sort((a,b)=>rank(a)-rank(b)||a.r-b.r);
  const mid=yards.length/2;
  yards.forEach((y,i)=>{y.ord=(i%2?1:-1)*Math.ceil((i+1)/2);});
  yards.sort((a,b)=>a.ord-b.ord);
  /* размеры и ряды */
  let x=0;
  for(let i=0;i<yards.length;i++){
    const y=yards[i],K=SD_KIND[y.kind]||SD_KIND.dwell;
    y.back=(i%3===1);                                   /* каждый третий — дальний план */
    y.k=(y.back?.74:1)*hk*(.92+y.r*.18);
    y.w=SD_MAN*K.w*y.k;y.h=SD_MAN*K.h*y.k;
    y.gap=(y.back?10:16)+y.r*10;
    y.x=x+y.w/2;x+=y.w+y.gap;
    y.lift=y.back?SD_MAN*(.5+y.r*.35):0;                /* задний ряд выше по склону */
    y.flip=y.r>.55;
  }
  const span=Math.max(120,x-((yards[yards.length-1]||{}).gap||0));
  const x0=bx-span/2;
  yards.forEach(y=>{y.wx=x0+y.x;});
  /* полка: за уровень берём землю под серединой, чуть занижая — так посёлок
     садится в склон, а не стоит на нём */
  const baseY=groundAt(tr,bx)+2;
  const plan={key,bx,x0,x1:x0+span,span,baseY,yards,
    seed:(S&&S.seed)|0,homes};
  /* улица под рукой (M198) — прямая линия ровным шагом: план, а не уклад */
  if(typeof settleMine==="function"&&settleMine(S)&&typeof settleHandPlan==="function")
    settleHandPlan(plan);
  if(S)S._plan=plan;
  return plan;
}
/* ── земля под посёлком ──
   Подпорная стенка снизу, срезанный борт сверху, улица между. Рисуется по
   настоящему профилю: где склон ниже полки — насыпь, где выше — врез. */
function sdTerrace(P,tr,camx,camy,pal,p){
  const y0=P.baseY-camy, pad=SD_MAN*1.6;
  const xa=P.x0-pad, xb=P.x1+pad;
  const rr=rng(hashi(P.seed,7,0x5A11));
  ctx.save();
  /* Кромка полки НЕРОВНАЯ: ровная линия во всю ширину читалась дощатым
     настилом, а не срезанной землёй (самокритика M169). Гуляем по краю
     мелким шумом и оставляем сходы на концах. */
  const edge=wx=>y0+Math.sin((wx-P.x0)*.055)*1.6+Math.sin((wx-P.x0)*.19+P.seed%7)*.9;
  ctx.beginPath();
  ctx.moveTo(xa-camx,edge(P.x0-pad));
  for(let wx=P.x0-pad;wx<=P.x1+pad;wx+=6)ctx.lineTo(wx-camx,Math.max(edge(wx),groundAt(tr,wx)-camy+1));
  ctx.lineTo(xb-camx,edge(P.x1+pad));
  ctx.closePath();
  ctx.fillStyle=sdRGB(sdMix(pal.earth,[10,12,16],.22));
  ctx.fill();
  /* подпорная стенка: камни вразбежку по всей высоте насыпи, а не столбами */
  for(let wx=P.x0-pad;wx<P.x1+pad;wx+=7+rr()*4){
    const gy=groundAt(tr,wx)-camy, top=edge(wx);
    if(gy<=top+4)continue;
    for(let yy=top+2;yy<gy-1;yy+=4+rr()*2){
      const w=6+rr()*5,h=3+rr()*2.2, ox=(rr()-.5)*3;
      ctx.fillStyle=sdRGB(sdMix(pal.stone,[0,0,0],.22+rr()*.2));
      ctx.fillRect(wx-camx+ox,yy,w,h);
      ctx.fillStyle="rgba(255,246,220,.16)";
      ctx.fillRect(wx-camx+ox,yy,w,1);
    }
  }
  /* срезанный борт сверху */
  ctx.beginPath();
  ctx.moveTo(xa-camx,y0);
  for(let wx=P.x0-pad;wx<=P.x1+pad;wx+=6)ctx.lineTo(wx-camx,Math.min(edge(wx),groundAt(tr,wx)-camy));
  ctx.lineTo(xb-camx,y0);
  ctx.closePath();
  ctx.fillStyle="rgba(0,0,0,.20)";ctx.fill();
  /* улица: не полоса ровного цвета, а натоптанная земля с пятнами и колеями */
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(P.x0-pad-camx,y0-2.5);
  for(let wx=P.x0-pad;wx<=P.x1+pad;wx+=6)ctx.lineTo(wx-camx,edge(wx)-2.5);
  for(let wx=P.x1+pad;wx>=P.x0-pad;wx-=6)ctx.lineTo(wx-camx,edge(wx)+5);
  ctx.closePath();ctx.clip();
  ctx.fillStyle=sdRGB(sdMix(pal.earth,[196,178,142],.34));
  ctx.fillRect(P.x0-pad-camx,y0-8,P.span+pad*2,20);
  ctx.fillStyle="rgba(0,0,0,.12)";
  for(let i=0;i<26;i++)ctx.fillRect(P.x0-camx+rr()*P.span,y0-3+rr()*7,3+rr()*7,1.4);
  ctx.fillStyle="rgba(255,246,224,.10)";
  for(let i=0;i<14;i++)ctx.fillRect(P.x0-camx+rr()*P.span,y0-3+rr()*6,2+rr()*5,1);
  /* камешки и выбоины: ровная светлая полоса читалась насыпанным песком, а не
     землёй, по которой ходят (крупный план M169) */
  for(let i=0;i<18;i++){
    const px=P.x0-camx+rr()*P.span, py=y0-2+rr()*6, s=1+rr()*2.2;
    ctx.fillStyle="rgba(0,0,0,.20)";
    ctx.beginPath();ctx.ellipse(px,py+.8,s*1.1,s*.55,0,0,TAU);ctx.fill();
    ctx.fillStyle=sdRGB(sdMix(pal.stone,[0,0,0],.1+rr()*.3));
    ctx.beginPath();ctx.ellipse(px,py,s,s*.62,0,0,TAU);ctx.fill();
    ctx.fillStyle="rgba(255,248,228,.22)";
    ctx.beginPath();ctx.ellipse(px-s*.2,py-s*.2,s*.42,s*.24,0,0,TAU);ctx.fill();
  }
  ctx.restore();
  /* трава по кромке полки: без неё срез выглядит свежим разрезом торта */
  ctx.strokeStyle="rgba(120,150,90,.42)";ctx.lineWidth=1;
  for(let wx=P.x0-pad;wx<P.x1+pad;wx+=3+rr()*3){
    const yy=edge(wx)+4+rr()*2;
    ctx.beginPath();ctx.moveTo(wx-camx,yy);
    ctx.lineTo(wx-camx+(rr()-.5)*3,yy-2.5-rr()*2.5);ctx.stroke();
  }
  ctx.restore();
}
/* ── тело и обвод ──
   Общий приём для всех построек: сначала силуэт одной заливкой, потом свет
   одним градиентом, потом один обвод. Детали кладутся внутрь. */
function sdBody(path,fill,lit,alpha){
  ctx.save();
  ctx.beginPath();path();
  ctx.fillStyle=fill;ctx.fill();
  if(lit){ctx.clip();ctx.fillStyle=lit;ctx.fill();}
  ctx.restore();
  ctx.save();
  ctx.beginPath();path();
  ctx.strokeStyle="rgba(232,240,244,"+(alpha||.22)+")";ctx.lineWidth=1;ctx.stroke();
  ctx.restore();
}
/* тень на землю: одна, в сторону от света, мягкая */
/* тень постройки: смещение и длина — от того же SUN_DIR, что и свет (M243).
   Было жёстко «чуть влево» независимо от часа: на закате дом стоял на пятне,
   а не отбрасывал тень. */
function sdShadow(x,y,w,h){
  const sx=(typeof SUN_DIR==="object")?SUN_DIR.x:.55;
  const sy=(typeof SUN_DIR==="object")?SUN_DIR.y:-.83;
  const low=clamp(1-Math.abs(sy),0,1);
  ctx.save();
  ctx.fillStyle="rgba(0,0,0,"+(.30*(1-low*.35)).toFixed(3)+")";
  ctx.beginPath();
  ctx.ellipse(x-sx*w*(.18+low*.75),y-1,w*(.62+low*.5),Math.max(2.5,h*.09),0,0,TAU);
  ctx.fill();
  ctx.restore();
}
/* доски, брёвна, камень — микрорельеф стены; без него дом остаётся плашкой */
function sdWallTex(x,y,w,h,kind,seed,col){
  const r=rng(hashi(seed,11,0x117));
  ctx.save();
  ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
  ctx.strokeStyle="rgba(0,0,0,.16)";ctx.lineWidth=1;
  if(kind==="log"||kind==="plank"){
    const step=Math.max(3.5,h/6);
    for(let yy=y+step;yy<y+h;yy+=step){
      ctx.beginPath();ctx.moveTo(x,yy);ctx.lineTo(x+w,yy);ctx.stroke();
    }
    ctx.strokeStyle="rgba(255,244,220,.10)";
    for(let yy=y+step;yy<y+h;yy+=step){
      ctx.beginPath();ctx.moveTo(x,yy-1);ctx.lineTo(x+w,yy-1);ctx.stroke();
    }
  }else if(kind==="stone"){
    for(let yy=y+3;yy<y+h;yy+=5){
      const off=r()*6;
      for(let xx=x+off%6;xx<x+w;xx+=6+r()*4){
        ctx.strokeRect(xx,yy,4+r()*3,3.4);
      }
    }
  }else if(kind==="plate"){
    for(let xx=x+5;xx<x+w;xx+=7){ctx.beginPath();ctx.moveTo(xx,y);ctx.lineTo(xx,y+h);ctx.stroke();}
    ctx.fillStyle="rgba(255,246,226,.12)";
    for(let xx=x+5;xx<x+w;xx+=7)for(let yy=y+3;yy<y+h;yy+=6)ctx.fillRect(xx-1.4,yy,1,1);
  }else{                                                   /* саман: пятна, не швы */
    ctx.fillStyle="rgba(0,0,0,.10)";
    for(let i=0;i<10;i++)ctx.fillRect(x+r()*w,y+r()*h,2+r()*5,1.5+r()*2);
  }
  /* потёки у земли — то, что делает стену стоявшей, а не поставленной */
  const g=ctx.createLinearGradient(0,y+h-h*.3,0,y+h);
  g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,"rgba(0,0,0,.22)");
  ctx.fillStyle=g;ctx.fillRect(x,y+h-h*.3,w,h*.3);
  ctx.restore();
}
/* кровля: солома, доска, плитка — три разных силуэта, а не один треугольник */
function sdRoof(x,y,w,h,kind,pal,seed){
  const lit=sdRGB(pal.roofLit),dark=sdRGB(pal.roofDark),mid=sdRGB(pal.roof);
  const eave=w*.14;
  if(kind==="thatch"){
    /* соломенная: провисающий конёк и лохматый край */
    sdBody(()=>{
      ctx.moveTo(x-eave,y);
      ctx.quadraticCurveTo(x+w*.5,y-h*1.28,x+w+eave,y);
      ctx.closePath();
    },mid,null,.20);
    const g=ctx.createLinearGradient(x,y-h,x+w,y);
    g.addColorStop(0,dark);g.addColorStop(.55,mid);g.addColorStop(1,lit);
    ctx.save();ctx.beginPath();
    ctx.moveTo(x-eave,y);ctx.quadraticCurveTo(x+w*.5,y-h*1.28,x+w+eave,y);ctx.closePath();
    ctx.clip();ctx.fillStyle=g;ctx.fillRect(x-eave,y-h*1.4,w+eave*2,h*1.5);
    const r=rng(hashi(seed,5,0x7A11));
    ctx.strokeStyle="rgba(0,0,0,.16)";ctx.lineWidth=1;
    for(let i=0;i<9;i++){
      const xx=x+w*(i+.5)/9;
      ctx.beginPath();ctx.moveTo(xx,y);ctx.lineTo(x+w*.5+(xx-x-w*.5)*.3,y-h*1.1);ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle=dark;                                    /* лохматый свес */
    for(let xx=x-eave;xx<x+w+eave;xx+=3)ctx.fillRect(xx,y-1,2,2+Math.random()*1.5);
  }else if(kind==="tile"){
    sdBody(()=>{
      ctx.moveTo(x-eave,y);ctx.lineTo(x+w*.5,y-h);ctx.lineTo(x+w+eave,y);ctx.closePath();
    },mid,null,.22);
    ctx.save();ctx.beginPath();
    ctx.moveTo(x-eave,y);ctx.lineTo(x+w*.5,y-h);ctx.lineTo(x+w+eave,y);ctx.closePath();ctx.clip();
    ctx.fillStyle=lit;ctx.fillRect(x+w*.5,y-h,w*.5+eave,h);
    ctx.strokeStyle="rgba(0,0,0,.18)";ctx.lineWidth=1;
    for(let yy=y-2;yy>y-h;yy-=3.5){ctx.beginPath();ctx.moveTo(x-eave,yy);ctx.lineTo(x+w+eave,yy);ctx.stroke();}
    ctx.restore();
  }else{                                                   /* дощатая */
    sdBody(()=>{
      ctx.moveTo(x-eave,y);ctx.lineTo(x+w*.5,y-h);ctx.lineTo(x+w+eave,y);ctx.closePath();
    },mid,null,.22);
    ctx.save();ctx.beginPath();
    ctx.moveTo(x-eave,y);ctx.lineTo(x+w*.5,y-h);ctx.lineTo(x+w+eave,y);ctx.closePath();ctx.clip();
    /* Два ската — два ТОНА, а не один: плоская крыша одного цвета делала дом
       картонкой (крупный план M169). Правый освещён, левый в тени, к коньку
       оба светлеют — так ложится свет на две плоскости. */
    const rg=ctx.createLinearGradient(x-eave,0,x+w+eave,0);
    rg.addColorStop(0,dark);rg.addColorStop(.48,mid);
    rg.addColorStop(.52,sdRGB(sdMix(pal.roof,[255,240,210],.16)));rg.addColorStop(1,lit);
    ctx.fillStyle=rg;ctx.fillRect(x-eave,y-h,w+eave*2,h);
    ctx.strokeStyle="rgba(0,0,0,.2)";ctx.lineWidth=1;
    for(let i=1;i<7;i++){
      const t=i/7;
      ctx.beginPath();ctx.moveTo(x+w*t,y);ctx.lineTo(x+w*.5+(w*t-w*.5)*.12,y-h*.94);ctx.stroke();
    }
    ctx.restore();
  }
  /* конёк и свес — две вещи, без которых крыша не читается крышей */
  ctx.fillStyle=dark;
  ctx.fillRect(x+w*.5-1.6,y-h-1.4,3.2,2.6);
  ctx.fillStyle="rgba(255,246,220,.20)";
  ctx.fillRect(x+w*.5-1.6,y-h-1.4,3.2,1);
  ctx.fillStyle=sdRGB(sdMix(pal.roofDark,[0,0,0],.2));
  ctx.beginPath();
  ctx.moveTo(x-eave,y);ctx.lineTo(x+w+eave,y);
  ctx.lineTo(x+w+eave*.75,y+1.8);ctx.lineTo(x-eave*.75,y+1.8);ctx.closePath();ctx.fill();
}
/* окно: рама, стекло, ночью свет и тень живущего за ним */
function sdWindow(x,y,w,h,pal,nite,seed){
  /* Окно из двух прямоугольников читалось наклейкой (крупный план M169).
     Настоящее окно — это ПРОЁМ (тень в толщину стены), стекло с косым бликом,
     переплёт и подоконник со своей тенью на стене. */
  ctx.fillStyle="rgba(0,0,0,.42)";
  ctx.fillRect(x-1,y-1,w+2,h+2);
  const lit=nite>.12;
  if(lit){
    ctx.fillStyle="rgba(255,204,134,"+(.55+nite*.6).toFixed(2)+")";
    ctx.fillRect(x,y,w,h);
  }else{
    const g=ctx.createLinearGradient(x,y,x+w,y+h);
    g.addColorStop(0,"rgba(96,120,132,.85)");
    g.addColorStop(.45,"rgba(48,62,72,.9)");
    g.addColorStop(1,"rgba(28,36,44,.95)");
    ctx.fillStyle=g;ctx.fillRect(x,y,w,h);
    ctx.fillStyle="rgba(214,236,244,.22)";                 /* косой блик неба */
    ctx.beginPath();
    ctx.moveTo(x,y+h*.75);ctx.lineTo(x+w*.7,y);ctx.lineTo(x+w,y);
    ctx.lineTo(x,y+h);ctx.closePath();ctx.fill();
  }
  if(lit&&Math.sin(G.t*.01+seed)>.35){                     /* кто-то прошёл мимо окна */
    ctx.fillStyle="rgba(28,22,16,.75)";
    ctx.fillRect(x+w*.32,y,w*.32,h);
  }
  /* переплёт: крестовина в толщину волоса и рама */
  ctx.strokeStyle="rgba(232,240,244,.34)";ctx.lineWidth=1;
  ctx.strokeRect(x+.5,y+.5,w-1,h-1);
  ctx.strokeStyle="rgba(232,240,244,.24)";
  ctx.beginPath();ctx.moveTo(x+w/2,y);ctx.lineTo(x+w/2,y+h);
  ctx.moveTo(x,y+h*.45);ctx.lineTo(x+w,y+h*.45);ctx.stroke();
  /* подоконник с тенью — то, что делает окно врезанным, а не нарисованным */
  ctx.fillStyle=sdRGB(sdMix(pal.wall,[236,222,190],.4));
  ctx.fillRect(x-1.5,y+h,w+3,1.6);
  ctx.fillStyle="rgba(0,0,0,.28)";
  ctx.fillRect(x-1.5,y+h+1.6,w+3,1.4);
}
/* дверь: косяк, полотно с доской, петли и порог */
function sdDoor(x,y,w,h,wood,flip){
  ctx.fillStyle="rgba(0,0,0,.4)";ctx.fillRect(x-1,y-h-1,w+2,h+1);
  const g=ctx.createLinearGradient(x,0,x+w,0);
  g.addColorStop(0,sdRGB(sdMix(wood,[0,0,0],.45)));
  g.addColorStop(1,sdRGB(sdMix(wood,[0,0,0],.22)));
  ctx.fillStyle=g;ctx.fillRect(x,y-h,w,h);
  ctx.strokeStyle="rgba(0,0,0,.3)";ctx.lineWidth=1;
  for(let i=1;i<3;i++){
    ctx.beginPath();ctx.moveTo(x+w*i/3,y-h);ctx.lineTo(x+w*i/3,y);ctx.stroke();
  }
  ctx.fillStyle="rgba(232,240,244,.22)";                   /* петли */
  const hx=flip?x+w-2:x;
  ctx.fillRect(hx,y-h*.82,2,1.4);ctx.fillRect(hx,y-h*.26,2,1.4);
  ctx.fillStyle="rgba(255,232,190,.55)";                   /* ручка */
  ctx.fillRect(flip?x+1.4:x+w-2.6,y-h*.52,1.4,1.4);
  ctx.fillStyle=sdRGB(sdMix(wood,[214,196,160],.4));       /* порог */
  ctx.fillRect(x-1.5,y-1.4,w+3,1.4);
}
/* поленница: торцы брёвен кружками, а не решётка из квадратов */
function sdWoodpile(x,y,w,h,wood,seed){
  const r=rng(hashi(seed,23,0x10CD));
  ctx.fillStyle="rgba(0,0,0,.26)";
  ctx.fillRect(x,y-h,w,h);
  for(let yy=y-2.2;yy>y-h;yy-=3.4){
    for(let xx=x+1.6;xx<x+w-.6;xx+=3.4){
      const t=r();
      ctx.fillStyle=sdRGB(sdMix(wood,[226,206,168],.3+t*.4));
      ctx.beginPath();ctx.arc(xx+(r()-.5),yy,1.5,0,TAU);ctx.fill();
      ctx.fillStyle="rgba(0,0,0,.28)";
      ctx.beginPath();ctx.arc(xx+(r()-.5),yy,.6,0,TAU);ctx.fill();
    }
  }
  ctx.strokeStyle=sdRGB(sdMix(wood,[0,0,0],.4));ctx.lineWidth=1.2;   /* колья по краям */
  ctx.beginPath();ctx.moveTo(x+.5,y);ctx.lineTo(x+.5,y-h-2);
  ctx.moveTo(x+w-.5,y);ctx.lineTo(x+w-.5,y-h-2);ctx.stroke();
}
/* постройки, жители и settleDrawBody — в 12tb-settle-draw2 (распил 0.209.0) */
