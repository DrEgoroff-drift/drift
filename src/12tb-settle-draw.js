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
function sdShadow(x,y,w,h){
  ctx.save();
  ctx.fillStyle="rgba(0,0,0,.30)";
  ctx.beginPath();
  ctx.ellipse(x-w*.18,y-1,w*.62,Math.max(2.5,h*.09),0,0,TAU);
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
/* ── постройки ──
   Каждая рисуется от земли (y — линия улицы), шириной w и высотой h. Все
   вызовы уже освещены одинаково: свет справа сверху. */
function sdDwell(x,y,w,h,pal,M,nite,seed,barn){
  /* Четыре плана избы вместо одной коробки: четыре одинаковых дома в ряд
     читались как склад ящиков (самокритика M169). План решает, где дверь, есть
     ли крыльцо, пристройка и чердачное окно; зеркало добавляет ещё вдвое. */
  const r=rng(hashi(seed,17,0xD0E1));
  const plan=Math.floor(r()*4), flip=r()>.5, fx=flip?-1:1;
  /* высота стены решает КРУТИЗНУ ската: при одинаковой доле все крыши выходили
     под одним углом и ряд читался копией одного дома (самокритика M169) */
  const wallH=h*(barn?.68+r()*.08:.54+r()*.16);
  const wood=sdMix(pal.wood,[0,0,0],r()*.18);          /* каждый сруб своего возраста */
  /* свой оттенок и кровли, и стены: ряд одинаково-оливковых домов читался
     копиями одного (самокритика M169). Разброс мал — посёлок остаётся одним
     посёлком, но два соседних двора уже не близнецы */
  pal=Object.assign({},pal);
  const rt=(r()-.5)*.26;
  pal.roof=sdMix(pal.roof,rt>0?[150,132,96]:[46,54,58],Math.abs(rt));
  pal.roofLit=sdMix(pal.roof,[236,214,170],.34);
  pal.roofDark=sdMix(pal.roof,[12,16,24],.40);
  const wt=(r()-.5)*.20;
  pal.wall=sdMix(pal.wall,wt>0?[206,184,146]:[74,72,66],Math.abs(wt));
  pal.wallLit=sdMix(pal.wall,[255,236,196],.30);
  pal.wallDark=sdMix(pal.wall,[16,20,28],.42);
  sdShadow(x,y,w,h);
  /* пристройка-сенцы: ставится первой, чтобы уйти под скат главного тела */
  if(!barn&&plan===2){
    const aw=w*.36,ah=wallH*.62,ax=x+fx*(w*.5+aw*.42);
    sdBody(()=>ctx.rect(ax-aw/2,y-ah,aw,ah),sdRGB(sdMix(pal.wall,[0,0,0],.14)),null,.20);
    sdWallTex(ax-aw/2,y-ah,aw,ah,M.wall,seed+3,pal.wall);
    sdRoof(ax-aw/2,y-ah,aw,h*.16,M.roof,pal,seed+3);
  }
  /* цоколь из камня: без него стена обрывалась о землю ровной чертой, и дом
     читался приставленным, а не стоящим (крупный план M169) */
  const fh=Math.max(2.5,h*.07);
  const fr=rng(hashi(seed,29,0xF007));
  ctx.fillStyle=sdRGB(sdMix(pal.stone,[0,0,0],.32));
  ctx.fillRect(x-w/2-1.5,y-fh,w+3,fh);
  for(let xx=x-w/2-1;xx<x+w/2+1;xx+=4+fr()*3){
    ctx.fillStyle=sdRGB(sdMix(pal.stone,[0,0,0],.16+fr()*.24));
    ctx.fillRect(xx,y-fh+fr()*1.2,3+fr()*2.4,fh-1);
  }
  ctx.fillStyle="rgba(255,246,220,.12)";
  ctx.fillRect(x-w/2-1.5,y-fh,w+3,1);
  sdBody(()=>ctx.rect(x-w/2,y-wallH,w,wallH-fh*.4),sdRGB(pal.wall),null,.24);
  /* освещённая правая треть и теневая левая — одним градиентом на теле */
  const g=ctx.createLinearGradient(x-w/2,0,x+w/2,0);
  g.addColorStop(0,"rgba(0,0,0,.34)");g.addColorStop(.55,"rgba(0,0,0,0)");
  g.addColorStop(1,"rgba(255,240,214,.16)");
  ctx.fillStyle=g;ctx.fillRect(x-w/2,y-wallH,w,wallH);
  sdWallTex(x-w/2,y-wallH,w,wallH,M.wall,seed,pal.wall);
  sdRoof(x-w/2,y-wallH,w,h-wallH,M.roof,pal,seed);
  /* тень от свеса на стену: без неё крыша лежит на доме наклейкой */
  const eg=ctx.createLinearGradient(0,y-wallH,0,y-wallH+h*.14);
  eg.addColorStop(0,"rgba(0,0,0,.34)");eg.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=eg;ctx.fillRect(x-w/2,y-wallH,w,h*.14);
  /* дверь: сторона от плана */
  const dw=w*.22,dh=wallH*.54;
  const dX=(flip?x+w*.30-dw:x-w*.30);
  sdDoor(dX,y,dw,dh,wood,flip);
  if(plan===1&&!barn){                                  /* крыльцо со ступенью и навесом */
    ctx.fillStyle=sdRGB(sdMix(wood,[0,0,0],.2));
    ctx.fillRect(dX-2.5,y-3,dw+5,3);
    ctx.fillRect(dX-4,y-1.5,dw+8,1.5);
    ctx.strokeStyle=sdRGB(sdMix(wood,[0,0,0],.3));ctx.lineWidth=1.4;
    ctx.beginPath();ctx.moveTo(dX-2,y-3);ctx.lineTo(dX-2,y-dh-4);
    ctx.lineTo(dX+dw+2,y-dh-4);ctx.lineTo(dX+dw+2,y-3);ctx.stroke();
  }
  if(barn){
    /* сарай: широкие ворота и помост, окон нет */
    ctx.fillStyle=sdRGB(sdMix(wood,[0,0,0],.28));
    ctx.fillRect(x-w*.16,y-wallH*.74,w*.42,wallH*.74);
    ctx.strokeStyle="rgba(0,0,0,.3)";
    ctx.beginPath();ctx.moveTo(x+w*.05,y-wallH*.74);ctx.lineTo(x+w*.05,y);ctx.stroke();
    ctx.strokeStyle="rgba(226,236,240,.18)";
    ctx.strokeRect(x-w*.16+.5,y-wallH*.74+.5,w*.42-1,wallH*.74-1);
    /* сено из-под ворот и вилы у стены — сарай, в который заходят */
    ctx.fillStyle="rgba(196,178,110,.5)";
    for(let i=0;i<7;i++)ctx.fillRect(x-w*.16+i*3,y-2-r()*2,2,2+r()*2);
  }else{
    const wy=y-wallH*.70, ww2=w*.24, wh2=wallH*.30;
    sdWindow(flip?x-w*.30-ww2*0:x+w*.06,wy,ww2,wh2,pal,nite,seed);
    if(plan===3){                                       /* второе окно и чердачное */
      sdWindow(flip?x+w*.08:x-w*.06-ww2,wy,ww2*.8,wh2*.9,pal,nite,seed+5);
      sdWindow(x-w*.07,y-wallH-h*.10,w*.14,h*.09,pal,nite,seed+9);
    }
    /* поленница у стены: быт, по которому дом читается жилым */
    sdWoodpile(flip?x-w*.62:x+w*.42,y,w*.2,wallH*.34,wood,seed);
  }
  /* труба — у жилья всегда: дом без печи в этих мирах не зимует */
  const cx2=x+fx*w*.22;
  ctx.fillStyle=sdRGB(pal.stone);
  ctx.fillRect(cx2,y-h-h*.12,w*.10,h*.24);
  ctx.fillStyle="rgba(255,246,220,.18)";ctx.fillRect(cx2,y-h-h*.12,w*.05,h*.24);
  ctx.fillStyle=sdRGB(sdMix(pal.stone,[0,0,0],.4));
  ctx.fillRect(cx2-.8,y-h-h*.14,w*.12,h*.03);
  return {chim:{x:cx2+w*.05,y:y-h-h*.14}};
}
function sdProps(P,camx,camy,pal,wind,r){
  const y=P.baseY-camy;
  const yards=P.yards.filter(v=>!v.back);
  for(let i=0;i<yards.length-1;i++){
    const a=yards[i],b=yards[i+1];
    const x1=a.wx+a.w*.45-camx, x2=b.wx-b.w*.45-camx;
    if(x2-x1<14)continue;
    /* над общим очагом ничего не вешают: верёвка с бельём шла прямо через
       костёр и его дым (крупный план M169) */
    const mid=(a.wx+b.wx)/2;
    /* под рукой (M198) общего очага в середине улицы нет: собираться незачем,
       и это единственный способ, каким кадр об этом говорит */
    const handed=(typeof settleMine==="function")&&settleMine(settleAt(G.sx,G.sy));
    const kind=(Math.abs(mid-P.bx)<34&&!handed)?1:Math.floor(r()*3);
    if(kind===0){                                           /* верёвка с бельём */
      /* Светлая нитка через весь кадр читалась царапиной на стекле, а бельё —
         полупрозрачными бумажками (крупный план M169). Верёвка тёмная и
         провисает сильнее, ткань плотная, со складкой и своей тенью. */
      const sag=7+r()*4, y1=y-a.h*.62, y2=y-b.h*.62;
      ctx.strokeStyle="rgba(40,42,44,.5)";ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x1,y1);
      ctx.quadraticCurveTo((x1+x2)/2,y1+sag*1.6,x2,y2);ctx.stroke();
      for(let k=1;k<4;k++){
        const t=k/4,cx2=x1+(x2-x1)*t;
        const cy2=y1+(y2-y1)*t+sag*(1-Math.abs(t-.5)*2)*1.5;
        const ww=4+r()*2,hh=6+r()*4;
        ctx.save();ctx.translate(cx2,cy2);ctx.rotate(wind*.10);
        ctx.fillStyle=k%2?"rgba(188,194,196,.82)":"rgba(166,140,110,.85)";
        ctx.beginPath();
        ctx.moveTo(-ww/2,0);ctx.lineTo(ww/2,0);
        ctx.lineTo(ww/2+wind*.6,hh);ctx.lineTo(-ww/2+wind*.6,hh*.92);ctx.closePath();ctx.fill();
        ctx.fillStyle="rgba(0,0,0,.18)";                    /* складка */
        ctx.fillRect(-ww*.1,0,ww*.22,hh*.9);
        ctx.restore();
      }
    }else if(kind===1){                                     /* бочка и корзины */
      const bx=(x1+x2)/2;
      ctx.fillStyle=sdRGB(sdMix(pal.wood,[0,0,0],.24));
      ctx.fillRect(bx-4,y-9,8,9);
      ctx.strokeStyle="rgba(0,0,0,.3)";ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(bx-4,y-6.5);ctx.lineTo(bx+4,y-6.5);ctx.stroke();
      ctx.fillStyle=sdRGB(sdMix(pal.wood,[190,160,110],.5));
      ctx.beginPath();ctx.ellipse(bx+8,y-2,4,2.6,0,0,TAU);ctx.fill();
    }else{                                                  /* жерди и сохнущая трава */
      const bx=(x1+x2)/2;
      ctx.strokeStyle=sdRGB(sdMix(pal.wood,[0,0,0],.3));ctx.lineWidth=1.4;
      for(const s of [-4,4]){ctx.beginPath();ctx.moveTo(bx+s,y);ctx.lineTo(bx+s+wind,y-13);ctx.stroke();}
      ctx.beginPath();ctx.moveTo(bx-4+wind,y-13);ctx.lineTo(bx+4+wind,y-13);ctx.stroke();
      ctx.strokeStyle="rgba(180,170,110,.5)";ctx.lineWidth=1;
      for(let k=0;k<5;k++){
        const px=bx-3+k*1.6+wind;
        ctx.beginPath();ctx.moveTo(px,y-13);ctx.lineTo(px+wind*.6,y-6-r()*3);ctx.stroke();
      }
    }
  }
}
/* ограда: жерди в два прогона по краям улицы и ворота со стороны, откуда
   приходят. Ставится редко и низко — это межа, а не крепость */
function sdFence(P,tr,camx,camy,pal,wind){
  /* Жерди СТОЯТ НА ЗЕМЛЕ, а не на уровне улицы: за кромкой полки склон уходит
     вниз, и ограда, привязанная к baseY, висела в воздухе (самокритика M169) */
  const col=sdRGB(sdMix(pal.wood,[0,0,0],.34));
  const foot=wx=>Math.max(P.baseY,groundAt(tr,wx))-camy;
  ctx.save();
  ctx.strokeStyle=col;
  for(const run of [[P.x0-28,P.x0-8],[P.x1+8,P.x1+28]]){
    const a=run[0],b=run[1];
    ctx.lineWidth=1.6;
    for(let wx=a;wx<=b;wx+=9){
      const fy=foot(wx);
      ctx.beginPath();ctx.moveTo(wx-camx,fy+1);ctx.lineTo(wx-camx+wind*.5,fy-13);ctx.stroke();
    }
    ctx.lineWidth=1.2;
    for(const hgt of [5,10]){
      ctx.beginPath();ctx.moveTo(a-camx,foot(a)-hgt);ctx.lineTo(b-camx,foot(b)-hgt-1);ctx.stroke();
    }
  }
  /* ворота: две стойки повыше и перекладина, тоже по земле */
  const g0=P.x1+30,g1=P.x1+46;
  const y0=foot(g0),y1=foot(g1);
  ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(g0-camx,y0+1);ctx.lineTo(g0-camx,y0-20);ctx.stroke();
  ctx.beginPath();ctx.moveTo(g1-camx,y1+1);ctx.lineTo(g1-camx,y1-20);ctx.stroke();
  ctx.beginPath();ctx.moveTo(g0-2-camx,y0-20);ctx.lineTo(g1+2-camx,y1-21);ctx.stroke();
  ctx.restore();
}
/* ── житель ──
   Палка с кружком (так было в 11h и в первом проходе M169) читается вешалкой.
   Человек — это плечи, руки при деле и ноги в шаге: три вещи, каждая в пару
   пикселей, но без них посёлок населён не людьми, а столбиками.
   pose: 0 стоит, 1 идёт, 2 работает внаклон, 3 несёт. */
function sdPerson(x,y,k,pose,phase,col){
  const h=SD_MAN*k, c=col||"rgba(26,30,36,.94)";
  const lean=pose===2?.5:0;
  ctx.save();
  ctx.translate(x,y);
  ctx.fillStyle=c;ctx.strokeStyle=c;
  ctx.lineWidth=Math.max(1,1.5*k);
  const hipY=-h*.46, shY=-h*.78;
  /* ноги */
  const step=pose===1?Math.sin(phase||0)*h*.16:0;
  ctx.beginPath();ctx.moveTo(0,hipY);ctx.lineTo(step,0);ctx.stroke();
  ctx.beginPath();ctx.moveTo(0,hipY);ctx.lineTo(-step,0);ctx.stroke();
  /* корпус с наклоном у работающего */
  ctx.beginPath();ctx.moveTo(0,hipY);ctx.lineTo(lean*h*.2,shY);ctx.stroke();
  /* плечи и руки */
  const ax=lean*h*.2;
  ctx.lineWidth=Math.max(1,1.2*k);
  if(pose===2){                                        /* внаклон, руки к земле */
    ctx.beginPath();ctx.moveTo(ax,shY);ctx.lineTo(ax+h*.16,shY+h*.3);ctx.stroke();
    ctx.beginPath();ctx.moveTo(ax,shY);ctx.lineTo(ax+h*.22,shY+h*.24);ctx.stroke();
  }else if(pose===3){                                  /* несёт: руки вперёд и ящик */
    ctx.beginPath();ctx.moveTo(ax,shY+h*.06);ctx.lineTo(ax+h*.2,shY+h*.16);ctx.stroke();
    ctx.fillRect(ax+h*.14,shY+h*.10,h*.18,h*.14);
  }else{
    const sw=pose===1?Math.sin((phase||0)+Math.PI)*h*.12:h*.04;
    ctx.beginPath();ctx.moveTo(ax,shY+h*.04);ctx.lineTo(ax+sw,shY+h*.30);ctx.stroke();
    ctx.beginPath();ctx.moveTo(ax,shY+h*.04);ctx.lineTo(ax-sw,shY+h*.30);ctx.stroke();
  }
  ctx.fillRect(ax-1.6*k,shY,3.2*k,h*.34);              /* торс потолще линии */
  ctx.beginPath();ctx.arc(ax+lean*h*.06,shY-h*.10,2.5*k,0,TAU);ctx.fill();
  ctx.restore();
}
/* ── дым ──
   Кружочки по прямой читались пузырями. Настоящий столб: клуб растёт, редеет,
   уходит по ветру и рассеивается — и всё это одним слоем, без наложений. */
function sdSmoke(x,y,wind,strength,seed,n){
  /* Крупные редкие овалы читались мыльными пузырями в небе (самокритика M169).
     Дым — это МНОГО мелких клубов, плотных у самой трубы и быстро тающих:
     начинается в полтора пикселя, растёт втрое, живёт короткую дугу. */
  const N=n||10;
  ctx.save();
  for(let i=0;i<N;i++){
    /* у каждого клуба свой размер, свой снос и своя скорость: ровные одинаковые
       кольца через равный шаг читались позвоночником, а не дымом (M169) */
    const j=h01(i*13+1,seed|0,0x5A0C), j2=h01(i*7+3,seed|0,0x5A0D);
    const t=((G.t*(.5+j*.28)+i*(100/N)+seed*7)%100)/100;
    const rr=(1.4+t*6.5*(.7+j2*.7))*strength;
    const a=(1-t)*(1-t)*(1-t)*.34*strength*(.7+j*.6);
    if(a<=.004)continue;
    ctx.fillStyle="rgba(210,216,224,"+a.toFixed(3)+")";
    ctx.beginPath();
    ctx.ellipse(x+wind*t*t*22+Math.sin(t*6+i*1.7)*(2+j*4)*t+(j-.5)*3,
      y-t*40*strength*(.8+j2*.5),rr*1.2,rr*.9,t*.5,0,TAU);
    ctx.fill();
  }
  ctx.restore();
}
/* длинная тень от тела: свет справа сверху (SUN_DIR), значит тень уходит влево
   и ложится на улицу. Без неё дома стоят на земле переводными картинками */
function sdCast(x,y,w,h,k){
  const len=h*.62*(k||1), sk=len*.9;
  ctx.save();
  ctx.fillStyle="rgba(0,0,0,.20)";
  ctx.beginPath();
  ctx.moveTo(x-w*.5,y);ctx.lineTo(x+w*.5,y);
  ctx.lineTo(x+w*.5-sk,y+len*.16);ctx.lineTo(x-w*.5-sk,y+len*.16);
  ctx.closePath();ctx.fill();
  ctx.restore();
}
/* ── сам посёлок ── */
function settleDrawBody(S,tr,camx,camy,p){
  const P=settlePlan(S,tr,p);if(!P)return;
  if(P.x1-camx<-160||P.x0-camx>W+160)return;
  const pal=sdPal(p),M=sdMat(p);
  const warm=(S.mood>=34);
  const nite=(typeof surfNight==="function")?surfNight(p):0;
  const wind=(typeof WIND==="number")?WIND*2:0;
  const r=rng(hashi(P.seed,3,0x5EED));
  sdTerrace(P,tr,camx,camy,pal,p);
  /* чужие руки на подпорной стенке (M210). Кладутся сразу после камня и до
     всего остального: знак ВРЕЗАН в стену, а не висит перед посёлком */
  if(typeof wallStone==="function"&&wallCount(WALL_S)>0){
    const wxw=settleWallX(P), sxw=wxw-camx;
    if(sxw>-160&&sxw<W+160)
      wallStone(sxw,groundAt(tr,wxw)-camy+1,
                [pal.earth,pal.stone,pal.stone,sdMix(pal.stone,[255,246,224],.35)],WALL_S);
  }
  const y=P.baseY-camy;
  /* задний ряд: выше, мельче, темнее — глубина тоном и перекрытием */
  /* дальний план — своей палитрой, подмешанной к небу, и вполсилы. Раньше
     поверх него клался полупрозрачный прямоугольник: на экране это читалось
     стеклянной панелью, а не воздухом (проход самокритики M169) */
  const far=sdFarPal(pal,p);
  for(const v of P.yards){
    if(!v.back)continue;
    const x=v.wx-camx, yy=y-v.lift;
    /* земля под задним рядом: он стоит выше улицы, и без своей полки дом
       висел в воздухе на подпорках из ничего (самокритика M169) */
    ctx.fillStyle=sdRGB(sdMix(sdMix(pal.earth,[10,12,16],.24),
      (p.T&&p.T.sky&&p.T.sky[1])||[120,140,160],.3));
    ctx.beginPath();
    ctx.moveTo(x-v.w*.85,yy+v.lift+1);ctx.lineTo(x-v.w*.72,yy+1);
    ctx.lineTo(x+v.w*.72,yy+1);ctx.lineTo(x+v.w*.85,yy+v.lift+1);
    ctx.closePath();ctx.fill();
    ctx.save();ctx.globalAlpha=.82;
    sdYard(v,x,yy,far,M,nite,warm,wind,P.seed);
    ctx.restore();
  }
  sdProps(P,camx,camy,pal,wind,r);
  /* ограда по краям посёлка и ворота на въезде: без границы дворы читаются
     как случайно стоящие рядом дома, а не как одно поселение */
  sdFence(P,tr,camx,camy,pal,wind);
  /* тени сначала, все разом: иначе тень одного дома ложится на соседа */
  if(nite<.5)for(const v of P.yards){
    if(v.back||v.kind==="field"||v.kind==="weir")continue;
    sdCast(v.wx-camx,y,v.w,v.h,1-nite);
  }
  for(const v of P.yards){
    if(v.back)continue;
    const res=sdYard(v,v.wx-camx,y,pal,M,nite,warm,wind,P.seed);
    if(res&&res.chim&&warm)sdSmoke(res.chim.x,res.chim.y,wind,.55,v.wx|0,4);
  }
  /* общий очаг посреди улицы: круг камней, угли, котёл на треноге. Столб дыма
     посёлка идёт ОТСЮДА — раньше он начинался в пустоте над крышами (M169) */
  {
    const hx=P.bx-camx;
    ctx.fillStyle=sdRGB(sdMix(pal.stone,[0,0,0],.3));
    for(let i=0;i<7;i++){
      const a=Math.PI*(i/6);
      ctx.beginPath();
      ctx.ellipse(hx+Math.cos(a)*10,y+1-Math.sin(a)*2.2,2.6,1.8,0,0,TAU);ctx.fill();
    }
    ctx.fillStyle=warm?"rgba(60,44,34,.9)":"rgba(52,52,54,.85)";
    ctx.beginPath();ctx.ellipse(hx,y,7.5,2.6,0,0,TAU);ctx.fill();
    if(warm){
      const pulse=.6+.4*Math.sin(G.t*.11);
      const fg=ctx.createRadialGradient(hx,y-2,0,hx,y-2,13);
      fg.addColorStop(0,"rgba(255,186,92,"+(.7*pulse).toFixed(2)+")");
      fg.addColorStop(1,"rgba(255,120,40,0)");
      ctx.save();ctx.globalCompositeOperation="lighter";
      ctx.fillStyle=fg;ctx.beginPath();ctx.arc(hx,y-2,13,0,TAU);ctx.fill();ctx.restore();
      /* Ни треноги, ни котла: человек тут семнадцать пикселей, значит тренога —
         двадцать, а её жерди и дужка котла — по пикселю, и всё это слипается в
         чёрную кляксу (два прохода самокритики M169). На этом размере честно
         читаются только полешки и языки пламени — их и рисуем. */
      ctx.strokeStyle="rgba(48,38,30,.95)";ctx.lineWidth=2.2;
      for(const s of [-1,1]){
        ctx.beginPath();ctx.moveTo(hx+s*7,y+1);ctx.lineTo(hx-s*3.5,y-6);ctx.stroke();
      }
      ctx.lineWidth=1.8;
      ctx.beginPath();ctx.moveTo(hx-6,y-2.5);ctx.lineTo(hx+6,y-3.5);ctx.stroke();
      for(let i=0;i<4;i++){                                /* языки: узкие, разной длины */
        const t=((G.t*.12+i*.9)%1);
        const hgt=6+t*7+i*1.6, sway=Math.sin(G.t*.13+i*2.1)*2.2;
        ctx.fillStyle=i%2?"rgba(255,198,96,.75)":"rgba(255,150,62,.65)";
        ctx.beginPath();
        ctx.moveTo(hx-3+i*2,y-2);
        ctx.quadraticCurveTo(hx-4.5+i*2+sway,y-hgt*.6,hx-2+i*2+sway*.6,y-hgt);
        ctx.quadraticCurveTo(hx-.5+i*2+sway,y-hgt*.55,hx-1+i*2,y-2);
        ctx.closePath();ctx.fill();
      }
      ctx.fillStyle="rgba(255,236,190,.55)";
      ctx.beginPath();ctx.ellipse(hx,y-2,4.2,1.8,0,0,TAU);ctx.fill();
    }
  }
  /* дым ремесла — гуще жилого: печь и кузня видны с горизонта именно им */
  if(warm)for(const v of P.yards){
    if(v.kind==="kiln")sdSmoke(v.wx-camx,y-v.h*1.3,wind,1,v.wx|0,7);
    if(v.kind==="forge")sdSmoke(v.wx-camx+v.w*.19,y-v.h*.92,wind,.8,v.wx|0,6);
    if(v.kind==="still")sdSmoke(v.wx-camx-v.w*.2,y-v.h*.5,wind,.4,v.wx|0,4);
  }
  /* ночь: свет из окон ложится на улицу пятнами — без этого посёлок ночью
     превращается в чёрные силуэты с жёлтыми точками */
  if(nite>.2){
    ctx.save();ctx.globalCompositeOperation="lighter";
    for(const v of P.yards){
      if(v.kind!=="dwell"&&v.kind!=="barn")continue;
      const x=v.wx-camx, yy=y-v.lift;
      /* пятно ЛЕЖИТ НА ЗЕМЛЕ у окна, а не окружает дом: ореолы вокруг домов
         складывались в одно белое зарево на полэкрана (самокритика M169) */
      const g=ctx.createRadialGradient(x+v.w*.2,yy+2,0,x+v.w*.2,yy+2,v.w*.6);
      const a=clamp((nite-.2)*2,0,1)*(v.back?.06:.13);
      g.addColorStop(0,"rgba(255,206,138,"+a.toFixed(3)+")");
      g.addColorStop(1,"rgba(255,180,110,0)");
      ctx.fillStyle=g;
      ctx.beginPath();ctx.ellipse(x+v.w*.2,yy+2,v.w*.6,v.h*.14,0,0,TAU);ctx.fill();
    }
    ctx.restore();
  }
  /* жители: кузнец у горна, кто-то внаклон у поля, носильщик на улице */
  const nobody=(typeof hoursNobody==="function")&&hoursNobody(p);
  if(!nobody&&nite<.45){
    for(const v of P.yards){
      if(v.back)continue;
      if(v.kind==="forge")sdPerson(v.wx-camx-v.w*.22,y,1,2,0);
      else if(v.kind==="field")sdPerson(v.wx-camx+v.w*.2,y,.95,2,0);
      else if(v.kind==="cut")sdPerson(v.wx-camx+v.w*.5,y,.95,0,0);
    }
    const span=Math.max(60,P.span);
    const ph=(G.t*.24+P.seed%97)%(span*2);
    const wx=ph<span?P.x0+ph:P.x1-(ph-span);
    sdPerson(wx-camx,y,1,ph<span?1:3,G.t*.12);
  }
}
/* один двор: тело по виду ремесла */
function sdYard(v,x,y,pal,M,nite,warm,wind,seed){
  const sd=seed+Math.round(v.wx);
  switch(v.kind){
    case "barn":  return sdDwell(x,y,v.w,v.h,pal,M,nite,sd,true);
    case "field": sdField(x,y,v.w,v.h,pal,sd,wind);return null;
    case "weir":  sdWeir(x,y,v.w,v.h,pal,sd);return null;
    case "kiln":  sdKiln(x,y,v.w,v.h,pal,sd,warm);return null;
    case "cut":   sdCut(x,y,v.w,v.h,pal,sd);return null;
    case "forge": sdForge(x,y,v.w,v.h,pal,sd,warm);return null;
    case "still": sdStill(x,y,v.w,v.h,pal,sd,warm);return null;
    default:      return sdDwell(x,y,v.w,v.h,pal,M,nite,sd,false);
  }
}
