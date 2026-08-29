/* ══════════════ убранство пещеры: залы, натёки, жилы, вода, кристаллы ══════════════ */
/* До этого пещера была двумя силуэтами и темнотой: шли две тысячи пикселей по
   одинаковому коридору, и единственным событием была находка в конце. Теперь
   ход разбит на залы, и зал виден раньше, чем в него входишь — по своду, который
   уходит вверх, и по свету, который оттуда падает.

   Правила те же, что и везде в проекте:
   — дорогое считается один раз при входе и лежит на объекте пещеры (`C.deco`),
     в кадре только отбор по видимости и рисование;
   — строение раньше материала: сначала форма свода и натёков, порода поверх;
   — зазор между сводом и полом только расширяется. `caveVault` умеет
     поднимать свод и не умеет опускать, поэтому застрять по-прежнему нельзя;
   — бюджет громкости: светится немногое, иначе темнота перестаёт быть темнотой,
     а она тут единственный материал, из которого делается страх. */

/* характер зала. vault — насколько выше свод, glow — сколько света зал даёт сам */
const CAVE_ZONE={
  gallery: {ru:"галерея",        vault:0,   drip:.55, vein:.25, cryst:0,   water:0,  glow:.0},
  dripstone:{ru:"натёчный зал",  vault:64,  drip:1,   vein:.15, cryst:0,   water:.3, glow:.05},
  crystal: {ru:"кристальный грот",vault:104,drip:.25, vein:.5,  cryst:1,   water:0,  glow:.5},
  water:   {ru:"подземное озеро",vault:78,  drip:.5,  vein:.2,  cryst:.15, water:1,  glow:.12},
  vein:    {ru:"рудный ход",     vault:22,  drip:.35, vein:1,   cryst:.2,  water:.15,glow:.28}
};
/* порядок не случайный: галерея идёт первой всегда — вход должен быть скучным,
   иначе зал в глубине нечем оттенить */
const CAVE_ZONE_MIX=["dripstone","vein","water","gallery"];

function caveZones(C){
  if(C.zones)return C.zones;
  const r=rng(hashi(C.seed,3,0x2A17));
  const n=5+Math.floor(r()*2);
  /* середину набираем перемешиванием списка, а не броском на каждый зал:
     от броска через раз выпадало три галереи подряд, и ход снова становился
     коридором. Перемешивание гарантирует, что каждый характер встретится */
  const mid=CAVE_ZONE_MIX.slice();
  for(let i=mid.length-1;i>0;i--){const j=Math.floor(r()*(i+1));const t=mid[i];mid[i]=mid[j];mid[j]=t;}
  const need=Math.max(1,n-2);
  /* озеро в пещере обязано быть: это её единственная вода и единственное место,
     где ход меняет темп. От чистого перемешивания оно выпадало через раз */
  const wi=mid.indexOf("water");
  if(wi>=need){const j=Math.floor(r()*need);mid[wi]=mid[j];mid[j]="water";}
  while(mid.length<need)mid.push(CAVE_ZONE_MIX[Math.floor(r()*3)]);
  const out=[];
  let x=0;
  for(let i=0;i<n;i++){
    const last=i===n-1;
    const w=last?CAVE_W-x:Math.round(CAVE_W/n*(.72+r()*.6));
    const kind=i===0?"gallery":(last?"crystal":mid[i-1]);
    out.push({kind,Z:CAVE_ZONE[kind],x0:x,x1:Math.min(CAVE_W,x+w),seed:hashi(C.seed,i,0x77C1)});
    x+=w;
    if(x>=CAVE_W)break;
  }
  out[out.length-1].x1=CAVE_W;
  C.zones=out;
  return out;
}
function caveZoneAt(C,x){
  const Z=caveZones(C);
  for(let i=0;i<Z.length;i++)if(x<Z[i].x1)return Z[i];
  return Z[Z.length-1];
}
/* подъём свода в зале, со сглаженными краями: без сглаживания зал начинается
   вертикальной стеной, и переход читается как ошибка отрисовки */
function caveVault(C,x){
  const z=caveZoneAt(C,x);
  if(!z.Z.vault)return 0;
  const d=Math.min(x-z.x0,z.x1-x);
  const k=clamp(d/150,0,1), s=k*k*(3-2*k);
  return z.Z.vault*s;
}

/* ── уровень воды в зале ── */
/* Вода не наливается «до отметки»: берём средний уровень пола по залу и опускаем
   чуть ниже. Тогда затоплены впадины, а гребни остаются сушей — озеро повторяет
   рельеф, а не режет его прямой. */
function cavePool(C,z){
  if(!z.Z.water)return null;
  if(z.pool!==undefined)return z.pool;
  let s=0,n=0,mn=1e9;
  for(let x=z.x0+30;x<z.x1-30;x+=24){const f=caveFloor(C,x);s+=f;n++;if(f<mn)mn=f;}
  if(!n){z.pool=null;return null;}
  const avg=s/n;
  const lvl=lerp(mn,avg,.75)+(z.Z.water>=1?6:-2);
  z.pool=lvl>mn+1?{y:lvl,x0:z.x0,x1:z.x1}:null;
  return z.pool;
}
/* игрок в воде — этим пользуется и ход, и всплески */
function caveWet(C,x){
  const z=caveZoneAt(C,x), p=cavePool(C,z);
  return p&&caveFloor(C,x)>p.y?p:null;
}

/* ── разовая генерация убранства ── */
function caveDeco(C,p){
  if(C.deco)return C.deco;
  const pal=(p&&p.T&&p.T.pal)||[[90,90,100],[70,70,80],[50,50,60]];
  const base=pal[Math.min(pal.length-1,2)];
  const rockCol=[0,1,2].map(j=>Math.round(base[j]*.55+14));
  const wetCol=[0,1,2].map(j=>Math.round(base[j]*.70+40));
  const D={rock:"rgb("+rockCol.join(",")+")",wet:"rgba("+wetCol.join(",")+",.55)",
    tips:[],curtains:[],veins:[],crystals:[],drops:[]};
  const Z=caveZones(C);
  /* натёки: шаг по всей длине, зал решает густоту. Сталактит и сталагмит растут
     навстречу и изредка смыкаются колонной — колонна и есть то, ради чего
     натёчный зал вообще нужен */
  /* обе галереи: нижняя была голым ходом, и весь страх кончался на лестнице
     вниз (хвост M136). Сольность та же, зал — по x, соль семени своя */
  for(let x=44;x<2*CAVE_W-44;x+=11){
    const low=x>=CAVE_W;
    if(low&&(x-CAVE_W<360||x-CAVE_W>CAVE_W-200))continue;
    const wx=low?x-CAVE_W:x;
    const z=caveZoneAt(C,wx), h=hashi(Math.round(wx),C.seed,low?0x10A0:0x51AC);
    const roll=(h&1023)/1023;
    if(roll>z.Z.drip*.62)continue;
    const ceil=caveCeilOf(C,wx,low), flo=caveFloorOf(C,wx,low), gap=flo-ceil;
    if(flo>=CAVE_Y1-10||gap<12)continue;
    const up=((h>>>10)&1)===0;
    const len=(9+((h>>>11)&31)*1.5)*(up?1:.72)*(z.Z.drip>.8?1.4:1);
    const w=2.4+((h>>>16)&7)*.7;
    const L=Math.min(len,gap*(up?.5:.34));
    if(L<5)continue;
    const col=up&&((h>>>19)&7)===0&&L>gap*.46;
    D.tips.push({x:wx,up,L:col?gap:L,w:w*(col?1.15:1),col,y0:up?ceil:flo,low,
      lean:(((h>>>20)&15)/15-.5)*.9,seed:h});
  }
  /* натёчные завесы: широкая складка вдоль свода, только в натёчных залах */
  for(const z of Z){
    if(z.Z.drip<.9)continue;
    const r=rng(z.seed);
    const n=2+Math.floor(r()*3);
    for(let i=0;i<n;i++){
      const x0=z.x0+40+r()*Math.max(20,(z.x1-z.x0-140));
      D.curtains.push({x0,w:70+r()*110,d:16+r()*26,seed:(r()*1e9)|0});
    }
  }
  /* ── лишайник: ВЫРАЩЕН, а не задан формулой (M262, DESIGN-craft §10) ──
     Вся органика игры параметрическая: форма — формула, качается синусом.
     Лишайник параметрически не рисуется, а выращивается легко: замкнутый
     контур растёт — длинное ребро делится, соседи расталкиваются, точки
     тянутся наружу — и сам сминается в лопасти, как растёт настоящий.
     Это стадия 点 из свода: точки-наросты ПОВЕРХ готовой фактуры камня.
     Считается при входе (десять штук, ~80 тыс. пар на контур), рисуется
     контуром — кадру дёшево. */
  D.lichens=[];
  {
    const rl=rng(C.seed^0x11C4);
    for(let i=0;i<10;i++){
      const low=rl()<.35;
      const x=low?360+rl()*(CAVE_W-620):140+rl()*(CAVE_W-280);
      const up=rl()<.7;
      const y=(up?caveCeilOf(C,x,low):caveFloorOf(C,x,low))+(up?2:-2);
      const R=7+rl()*10;
      D.lichens.push({x,y,up,R,pts:growLichen(rl,R,34),
        col:rl()<.5?[116,138,112]:[104,124,128]});
    }
  }
  /* светящиеся жилы: ломаная вдоль породы, цвет минерала зала. Пульсируют
     медленно и врозь — синхронная пульсация читается как мигание интерфейса */
  for(const z of Z){
    const r=rng(z.seed^0x9E3);
    const mn=MINERAL[(z.seed>>>5)%MINERAL.length];
    const n=Math.round((z.x1-z.x0)/300*(1+z.Z.vein*3));
    for(let i=0;i<n;i++){
      const up=r()<.6, low=i%3===2&&z.x0>380;       // каждая третья жила — в нижней галерее
      let x=z.x0+r()*(z.x1-z.x0-120);
      const pts=[],seg=6+Math.floor(r()*7);
      /* жила идёт в породе, а не по воздуху: у свода она выше кромки, у пола —
         ниже. Свет из камня и есть то, ради чего она рисуется поверх темноты */
      let off=(6+r()*30)*(up?-1:1);
      for(let k=0;k<seg;k++){
        pts.push([x,off]);
        x+=13+r()*19;
        off+=(r()-.5)*22;
        off=clamp(off,up?-52:4,up?-4:52);
      }
      D.veins.push({up,low,pts,col:mn,w:.8+r()*1.2,ph:r()*TAU,
        a:(.10+r()*.16)*(.4+z.Z.vein)});
    }
  }
  /* кристаллы: куст гранёных игл из пола или со свода, один источник света
     на куст. Свет держим на кусте, а не на игле — иначе грот выцветает */
  for(const z of Z){
    if(!z.Z.cryst)continue;
    const r=rng(z.seed^0x4C71);
    const mn=MINERAL[(z.seed>>>9)%MINERAL.length];
    const n=Math.round((z.x1-z.x0)/210*z.Z.cryst)+1;
    for(let i=0;i<n;i++){
      const x=z.x0+30+r()*Math.max(20,(z.x1-z.x0-60));
      const up=r()<.75, low=i%2===1&&x>380&&x<CAVE_W-200;   // половина кустов — внизу
      const spikes=[];
      const k=3+Math.floor(r()*4);
      for(let j=0;j<k;j++)
        spikes.push({dx:(j-(k-1)/2)*(5+r()*7),h:(14+r()*34)*(up?1:.8),
          w:2.4+r()*3.4,lean:(r()-.5)*.7});
      D.crystals.push({x,up,low,spikes,col:mn,ph:r()*TAU,rad:46+r()*44});
    }
  }
  C.deco=D;
  return D;
}

/* ── капли ── */
/* Капля не украшение: она единственное, что в пещере движется само по себе,
   и по ней слышно, что зал живой. Больше двенадцати за раз не держим. */
function updateCaveDeco(C,dt){
  const D=C.deco;if(!D)return;
  const drops=D.drops;
  for(let i=drops.length-1;i>=0;i--){
    const d=drops[i];
    d.vy+=.0016*dt;d.y+=d.vy*dt;
    if(d.y>=d.fy){
      drops.splice(i,1);
      const near=Math.abs(d.x-C.x);
      if(near<420)sfx("ui",{f:1200-((d.x|0)%400),to:380,d:.14,
        v:.10*(1-near/420)});
      D.splash={x:d.x,y:d.fy,t:26};
    }
  }
  if(D.splash&&(D.splash.t-=dt)<=0)D.splash=null;
  if(drops.length<12&&Math.random()<.03*dt){
    const cand=[];
    for(const t of D.tips)if(t.up&&!t.col&&Math.abs(t.x-C.x)<W*.6)cand.push(t);
    if(cand.length){
      const t=cand[Math.floor(Math.random()*cand.length)];
      drops.push({x:t.x+t.lean*t.L,y:t.y0+t.L,vy:.02,fy:caveFloorOf(C,t.x,t.low)});
    }
  }
}

/* ── рисование ── */
/* Порядок жёсткий: тело породы → натёки → вода → темнота → свет. Свет после
   темноты, иначе фонарь гасит сам себя, а грот в глубине не видно вовсе. */
function caveTip(t,sx,sy){
  ctx.beginPath();
  const dir=t.up?1:-1, lean=t.lean*t.L;
  ctx.moveTo(sx-t.w,sy);
  ctx.quadraticCurveTo(sx-t.w*.35+lean*.5,sy+t.L*.6*dir,sx+lean,sy+t.L*dir);
  ctx.quadraticCurveTo(sx+t.w*.35+lean*.5,sy+t.L*.6*dir,sx+t.w,sy);
  ctx.closePath();
}
function drawCaveSolid(C,camx,camy){
  const D=C.deco;if(!D)return;
  ctx.save();
  for(const t of D.tips){
    const sx=t.x-camx;if(sx<-40||sx>W+40)continue;
    const sy=t.y0-camy;
    ctx.fillStyle=D.rock;
    if(t.col){
      /* колонна: две встречные иглы, сросшиеся посередине */
      const mid=sy+t.L*.5;
      ctx.beginPath();
      ctx.moveTo(sx-t.w,sy);
      ctx.quadraticCurveTo(sx-t.w*.3,mid,sx-t.w*.75,sy+t.L);
      ctx.lineTo(sx+t.w*.75,sy+t.L);
      ctx.quadraticCurveTo(sx+t.w*.3,mid,sx+t.w,sy);
      ctx.closePath();ctx.fill();
      ctx.strokeStyle=D.wet;ctx.lineWidth=1;ctx.stroke();
      continue;
    }
    caveTip(t,sx,sy);
    ctx.fill();
    /* мокрая грань с одной стороны — по ней натёк и читается объёмом */
    ctx.strokeStyle=D.wet;ctx.lineWidth=1;ctx.stroke();
  }
  for(const c of D.curtains){
    const sx=c.x0-camx;if(sx<-c.w-40||sx>W+40)continue;
    ctx.fillStyle=D.rock;
    ctx.beginPath();
    const y0=caveCeil(C,c.x0)-camy;
    ctx.moveTo(sx,y0-2);
    for(let u=0;u<=1.0001;u+=.125){
      const wx=c.x0+c.w*u;
      const yy=caveCeil(C,wx)-camy+c.d*(.35+.65*fbm1(wx*.03,c.seed,2));
      ctx.lineTo(wx-camx,yy);
    }
    for(let u=1;u>=0;u-=.25)ctx.lineTo(c.x0+c.w*u-camx,caveCeil(C,c.x0+c.w*u)-camy-2);
    ctx.closePath();ctx.fill();
    ctx.strokeStyle=D.wet;ctx.lineWidth=1;ctx.stroke();
  }
  /* лишайник (M262): выращенный контур, прижатый к поверхности. Тело блёклое,
     кайма чуть ярче, сердцевина — тот же контур, сжатый: три прохода дают
     лопастную розетку, а не пятно */
  for(const l of D.lichens||[]){
    const sx=l.x-camx;if(sx<-30||sx>W+30)continue;
    const sy=l.y-camy;if(sy<-30||sy>H+30)continue;
    const P=l.pts;
    const trace=()=>{ctx.beginPath();ctx.moveTo(P[0][0],P[0][1]);
      for(let i=1;i<P.length;i++)ctx.lineTo(P[i][0],P[i][1]);ctx.closePath();};
    ctx.save();ctx.translate(sx,sy);ctx.scale(1,l.up?.55:.45);
    trace();
    ctx.fillStyle="rgba("+l.col.join(",")+",.28)";ctx.fill();
    ctx.strokeStyle="rgba("+l.col.join(",")+",.45)";ctx.lineWidth=.9;ctx.stroke();
    ctx.scale(.55,.55);
    trace();
    ctx.fillStyle="rgba("+l.col.join(",")+",.20)";ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
function drawCaveWater(C,camx,camy){
  const Z=caveZones(C);
  for(const z of Z){
    const p=cavePool(C,z);if(!p)continue;
    const x0=Math.max(z.x0,camx-20),x1=Math.min(z.x1,camx+W+20);
    if(x1<=x0)continue;
    const sy=p.y-camy;
    if(sy<-20||sy>H+40)continue;
    const P=new Path2D();
    P.moveTo(x0-camx,sy);
    for(let x=x0;x<=x1;x+=14)P.lineTo(x-camx,sy+Math.sin(x*.06+G.t*.02)*.9);
    P.lineTo(x1-camx,sy);
    for(let x=x1;x>=x0;x-=14)P.lineTo(x-camx,Math.max(sy,caveFloor(C,x)-camy));
    P.closePath();
    ctx.fillStyle="rgba(30,90,120,.42)";ctx.fill(P);
    /* отражённая полоса по самой кромке: вода без блика читается как провал */
    ctx.strokeStyle="rgba(150,220,240,.22)";ctx.lineWidth=1.2;
    ctx.beginPath();
    for(let x=x0;x<=x1;x+=14){
      const yy=sy+Math.sin(x*.06+G.t*.02)*.9;
      if(x===x0)ctx.moveTo(x-camx,yy);else ctx.lineTo(x-camx,yy);
    }
    ctx.stroke();
  }
}
/* темнота: всё, что дальше фонаря, гаснет. Это и есть главный эффект пещеры —
   до него порода читалась как декорация, после него как стены */
function drawCaveDark(C,px,py){
  /* темнота — спрайт, а не градиент на кадр: полноэкранный радиальный
     градиент стоил ~15 мс на ×2 (G0). Круг света кладётся одним drawImage,
     углы за ним добираются четырьмя плоскими заливками. */
  const R=Math.max(W,H)*.52*kitStat().lamp,cx=px,cy=py-14;   /* фонарь комплекта (M152) */
  /* ── темнота тоже из чего-то сделана (M233) ──
     Гасили холодным (1,4,10) на всё: дальняя порода уходила в мёртвый синий
     чёрный, и материал, ради которого её пекли, пропадал вместе со светом.
     Тон темноты берётся от САМОЙ породы, уведённой почти в ноль: за кругом
     фонаря по-прежнему темно, но темнота этой пещеры, а не любой. */
  /* планета берётся у поверхности: пещера — её пещера, своего поля `p` у C нет */
  const cpl=(G.surf&&G.surf.p)||null;
  const pcv=(cpl&&cpl.T&&cpl.T.pal)?cpl.T.pal[Math.min(cpl.T.pal.length-1,1)]:[26,30,42];
  /* тьма стала чуть прозрачнее (M246): при .76 и потолке в 14 она хоронила
     всё, что за кругом фонаря, — дальняя стена, колонны и материал просто не
     доживали до экрана, и прибор честно мерил 86% пустоты. Пещера обязана
     быть тёмной, но не пустой: за светом должно угадываться то, куда идёшь. */
  const dk=[0,1,2].map(i=>Math.round(Math.min(22,pcv[i]*.16+3)));
  const dkey=dk.join(",");
  const SP=glowSprite("cavedark|"+dkey,()=>{
    const g=ctx.createRadialGradient(0,0,R>0?Math.min(.5,40/R):.06,0,0,1);   // при W=0 (стенд) R=0 — не делить
    g.addColorStop(0,"rgba(0,0,0,0)");
    g.addColorStop(.45,"rgba("+dkey+",.26)");
    g.addColorStop(1,"rgba("+dkey+",.66)");
    ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);
  });
  glowBlit(SP,cx,cy,R);
  /* ── тёплый воздух у фонаря (прибор 30.08: пещера pair 0%, mass 2%) ──
     Кадр пещеры не имел ни второй температуры, ни второй ступени света:
     круг фонаря был нейтральной дырой в темноте. Слабое тёплое зарево внутри
     круга даёт обе разом — тёплый акцент против холодной флоры и среднюю
     ступень масс вокруг человека. Спрайт, кадру один drawImage. */
  {
    const WP=glowSprite("cavewarm",()=>{
      const g=ctx.createRadialGradient(0,0,0,0,0,1);
      for(let i=0;i<=8;i++){const t=i/8;
        g.addColorStop(t,"rgba(255,200,132,"+(.26*Math.pow(1-t,2.2)).toFixed(3)+")");}
      ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);
    });
    ctx.save();ctx.globalCompositeOperation="lighter";
    glowBlit(WP,cx,cy,R*.72);
    ctx.restore();
  }
  ctx.fillStyle="rgba("+dkey+",.66)";
  const x0=cx-R,x1=cx+R,y0=cy-R,y1=cy+R;
  if(x0>0)ctx.fillRect(0,0,x0,H);
  if(x1<W)ctx.fillRect(x1,0,W-x1,H);
  if(y0>0)ctx.fillRect(Math.max(0,x0),0,Math.min(W,x1)-Math.max(0,x0),y0);
  if(y1<H)ctx.fillRect(Math.max(0,x0),y1,Math.min(W,x1)-Math.max(0,x0),H-y1);
}
function drawCaveGlow(C,camx,camy,px,py){
  const D=C.deco;if(!D)return;
  ctx.save();
  ctx.globalCompositeOperation="lighter";
  for(const c of D.crystals){
    const sx=c.x-camx;if(sx<-c.rad||sx>W+c.rad)continue;
    const sy=(c.up?caveFloorOf(C,c.x,c.low):caveCeilOf(C,c.x,c.low))-camy;
    if(c.low&&sy+camy>=CAVE_Y1-10)continue;
    const puls=.55+.45*Math.sin(G.t*.014+c.ph);
    /* тело: две грани на иглу, светлая и тёмная, и ребро между ними. Одной
       заливкой игла читается соломиной; гранью — камнем, который ловит свет.
       Свет один на куст — так грот светится, а не мерцает по каждой игле */
    const col=c.col.join(",");
    for(const s of c.spikes){
      const bx=sx+s.dx, dir=c.up?-1:1;
      const tx=bx+s.lean*s.h, ty=sy+s.h*dir;
      ctx.fillStyle="rgba("+col+","+(.10+puls*.07).toFixed(3)+")";
      ctx.beginPath();
      ctx.moveTo(bx-s.w,sy);ctx.lineTo(tx,ty);ctx.lineTo(bx,sy-dir*s.w*.5);
      ctx.closePath();ctx.fill();
      ctx.fillStyle="rgba("+col+","+(.22+puls*.16).toFixed(3)+")";
      ctx.beginPath();
      ctx.moveTo(bx,sy-dir*s.w*.5);ctx.lineTo(tx,ty);ctx.lineTo(bx+s.w,sy);
      ctx.closePath();ctx.fill();
      ctx.strokeStyle="rgba(255,255,255,"+(.10+puls*.16).toFixed(3)+")";
      ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(bx,sy-dir*s.w*.4);ctx.lineTo(tx,ty);ctx.stroke();
    }
    poiGlow(sx,sy+(c.up?-18:18),c.rad*1.9,col,.19*puls+.07);
  }
  for(const v of D.veins){
    const x0=v.pts[0][0]-camx, xn=v.pts[v.pts.length-1][0]-camx;
    if(xn<-30||x0>W+30)continue;
    const puls=.6+.4*Math.sin(G.t*.009+v.ph);
    /* два прохода одной ломаной: широкий тусклый — это свет вокруг жилы,
       узкий яркий — сама жила. Одним проходом получается царапина по камню */
    ctx.beginPath();
    for(let i=0;i<v.pts.length;i++){
      const wx=v.pts[i][0];
      const y=(v.up?caveCeilOf(C,wx,v.low)+v.pts[i][1]:caveFloorOf(C,wx,v.low)+v.pts[i][1])-camy;
      if(i)ctx.lineTo(wx-camx,y);else ctx.moveTo(wx-camx,y);
    }
    ctx.lineCap="round";
    ctx.strokeStyle="rgba("+v.col.join(",")+","+(v.a*puls*.22).toFixed(3)+")";
    ctx.lineWidth=v.w*5;ctx.stroke();
    ctx.strokeStyle="rgba("+v.col.join(",")+","+(v.a*puls).toFixed(3)+")";
    ctx.lineWidth=v.w;ctx.stroke();
  }
  /* пыль в воздухе: единственное, что показывает, что фонарь светит сквозь
     среду, а не по пустоте. Считается от координаты и времени, ничего не
     хранится, поэтому и не копится */
  const t=G.t;
  for(let i=0;i<46;i++){
    const wx=(camx*.85+i*97.3+Math.sin(t*.004+i)*22)%(CAVE_W+400)-200;
    const sx=wx-camx*.85;
    if(sx<-10||sx>W+10)continue;
    const sy=(i*173.7+t*.09+Math.sin(t*.006+i*2.1)*14)%(H*.9)+H*.06;
    const d=Math.hypot(sx-px,sy-py);
    const a=clamp(1-d/240,0,1)*.30;
    if(a<=.01)continue;
    ctx.fillStyle="rgba(190,220,240,"+a.toFixed(3)+")";
    ctx.fillRect(sx,sy,1.2,1.2);
  }
  /* фонарь скафандра: конус по направлению взгляда, собранный из трёх слоёв —
     один слой даёт жёсткую грань, и свет читается как нарисованный треугольник */
  const f=C.face;
  for(let i=0;i<3;i++){
    const k=1-i*.3, sp=1+i*.55;
    const lg=ctx.createLinearGradient(px,py,px+f*230*k*kitStat().lamp,py-20);
    lg.addColorStop(0,"rgba(190,215,235,"+(.07*k).toFixed(3)+")");
    lg.addColorStop(.55,"rgba(170,200,225,"+(.03*k).toFixed(3)+")");
    lg.addColorStop(1,"rgba(150,190,220,0)");
    ctx.fillStyle=lg;
    ctx.beginPath();
    ctx.moveTo(px,py-16);
    ctx.lineTo(px+f*250*k,py-70*sp);
    ctx.lineTo(px+f*250*k,py+56*sp);
    ctx.closePath();ctx.fill();
  }
  /* и пятно под ногами: без него астронавт висит в темноте */
  poiGlow(px,py+6,90,"170,205,230",.10);
  /* капли и всплеск */
  for(const d of D.drops){
    const sx=d.x-camx;if(sx<-10||sx>W+10)continue;
    ctx.fillStyle="rgba(170,215,235,.5)";
    ctx.fillRect(sx-.6,d.y-camy-3,1.2,4.5);
  }
  if(D.splash){
    const s=D.splash, sx=s.x-camx;
    const k=1-s.t/26;
    ctx.strokeStyle="rgba(170,215,235,"+(.34*(1-k)).toFixed(3)+")";
    ctx.lineWidth=1;
    ctx.beginPath();ctx.ellipse(sx,s.y-camy,2+k*9,1+k*3,0,0,TAU);ctx.stroke();
  }
  ctx.restore();
}

/* ══════════════ свой свет пещеры (M248) ══════════════
   У пещеры не было ни одного источника, кроме фонаря на шлеме: отсюда и
   «0% пары», и ощущение, что мир кончается за кругом света. Теперь у неё есть
   собственная жизнь и собственный свет — холодный мох по стенам и чужой
   фонарь, оставленный тем, кто был здесь раньше. Второе — ещё и след человека:
   пещеру кто-то проходил до тебя.
   Всё сеяно от C.seed и ничего не сохраняется: место одно и то же при каждом
   спуске, но в сейве его нет. */
function caveMossSpots(C){
  if(C.moss)return C.moss;
  const r=rng(C.seed^0x3055), out=[];
  for(let i=0;i<16;i++){
    const low=r()<.4;
    const x=low?340+r()*(CAVE_W-560):160+r()*(CAVE_W-320);
    const y=low?caveLowY(C,x):caveGalY(C,x);
    /* мох садится на СВОД и на стены, а не на пол: ему нужна сырость сверху */
    out.push({x,y:y-(6+r()*22),n:3+Math.floor(r()*5),ph:r()*TAU,
              rr:10+r()*16,col:r()<.5?[120,200,180]:[150,190,230]});
  }
  return C.moss=out;
}
function caveLampSpot(C){
  if(C.lamp!==undefined)return C.lamp;
  const r=rng(C.seed^0x1A77);
  const x=CAVE_W*(.35+r()*.4);
  return C.lamp={x,y:caveFloor(C,x),ph:r()*TAU};
}
function drawCaveOwnLight(C,camx,camy){
  /* мох: холодное пятно, медленно дышит — движение, а не мигание */
  ctx.save();ctx.globalCompositeOperation="lighter";
  for(const m of caveMossSpots(C)){
    const x=m.x-camx, y=m.y-camy;
    if(x<-60||x>W+60||y<-60||y>H+60)continue;
    const pu=.62+.38*Math.sin(G.t*.006+m.ph);
    const g=ctx.createRadialGradient(x,y,0,x,y,m.rr*2.2);
    g.addColorStop(0,"rgba("+m.col.join(",")+","+(.16*pu).toFixed(3)+")");
    g.addColorStop(1,"rgba("+m.col.join(",")+",0)");
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,m.rr*2.2,0,TAU);ctx.fill();
    /* сами пятна: несколько мелких, разной величины — не одна клякса */
    for(let i=0;i<m.n;i++){
      const a=m.ph+i*2.1, rx=Math.cos(a)*m.rr*.6, ry=Math.sin(a)*m.rr*.35;
      ctx.fillStyle="rgba("+m.col.join(",")+","+(.20+.14*pu).toFixed(3)+")";
      ctx.beginPath();ctx.ellipse(x+rx,y+ry,2.2+i*.7,1.4+i*.4,a,0,TAU);ctx.fill();
    }
  }
  ctx.restore();
  /* чужой фонарь: он тёплый, и он тут не сам по себе — кто-то его поставил */
  const L=caveLampSpot(C);
  const lx=L.x-camx, ly=L.y-camy;
  if(lx>-80&&lx<W+80&&ly>-80&&ly<H+80){
    const pu=.78+.22*Math.sin(G.t*.011+L.ph);
    /* ── свет не проходит сквозь камень (M258, DESIGN-craft §4) ──
       Зарево было кругом поверх всего: сквозь колонну, сквозь стену — по ту
       сторону породы светилось так же. Маска: тот же градиент, из которого
       destination-out выедает тени — четырёхугольники, спроецированные от
       лампы за каждое ребро марширующих квадратов в радиусе. O(рёбра), и
       лампа с породой неподвижны, значит маска печётся ОДИН РАЗ на пещеру;
       дыхание света — глобальной прозрачностью при кладке. Фонарь игрока
       остаётся без теней сознательно: он движется каждый кадр, и его маска
       стоила бы кадру то, чего тени не стоят. */
    ctx.save();ctx.globalCompositeOperation="lighter";
    ctx.globalAlpha=pu;
    ctx.drawImage(caveLampMask(C),L.x-90-camx,L.y-5-90-camy);
    ctx.globalAlpha=1;
    ctx.restore();
    /* сама вещь: корпус, дужка и стекло — вещь, а не пятно */
    ctx.fillStyle="rgba(46,52,60,.95)";
    ctx.fillRect(lx-3.4,ly-9,6.8,7.5);
    ctx.strokeStyle="rgba(70,78,88,.95)";ctx.lineWidth=1.2;
    ctx.beginPath();ctx.arc(lx,ly-9.5,3.2,Math.PI,TAU);ctx.stroke();
    ctx.fillStyle="rgba(255,226,170,"+(.75*pu).toFixed(2)+")";
    ctx.fillRect(lx-2.2,ly-7.6,4.4,4.4);
    groundShadow(lx,ly+1,7,2.2);
  }
}
/* ── маска света лампы (M258): зарево минус тени от рёбер породы ──
   Печётся один раз на пещеру (C.lampMask): и лампа, и порода статичны.
   Рёбра — те же случаи марширующих квадратов, что в caveContour; каждое
   даёт четырёхугольник «ребро + его проекция от лампы за край маски». */
function caveLampMask(C){
  if(C.lampMask)return C.lampMask;
  const L=caveLampSpot(C),R=90,S=R*2;
  const cv=document.createElement("canvas");cv.width=cv.height=S;
  const c=cv.getContext("2d");
  const lxw=L.x, lyw=L.y-5;                       /* центр света — чуть над полом */
  const g=c.createRadialGradient(R,R,0,R,R,86);
  g.addColorStop(0,"rgba(255,206,138,.24)");
  g.addColorStop(.5,"rgba(255,190,120,.08)");
  g.addColorStop(1,"rgba(255,190,120,0)");
  c.fillStyle=g;c.beginPath();c.arc(R,R,86,0,TAU);c.fill();
  const CS=CAVE_CS,NX=CAVE_NX,NY=CAVE_NY,gr=C.g;
  const at=(cx,cy)=>(cx<0||cx>=NX||cy<0||cy>=NY)?1:gr[cy*NX+cx];
  c.globalCompositeOperation="destination-out";
  c.fillStyle="#000";
  const shade=(a,b)=>{
    const k=4;                                    /* проекция заведомо за край */
    c.beginPath();
    c.moveTo(a[0]-lxw+R,a[1]-lyw+R);
    c.lineTo(b[0]-lxw+R,b[1]-lyw+R);
    c.lineTo(b[0]+(b[0]-lxw)*k-lxw+R,b[1]+(b[1]-lyw)*k-lyw+R);
    c.lineTo(a[0]+(a[0]-lxw)*k-lxw+R,a[1]+(a[1]-lyw)*k-lyw+R);
    c.closePath();c.fill();
  };
  const cx0=Math.floor((lxw-R)/CS)-1,cx1=Math.floor((lxw+R)/CS)+1;
  const cy0=Math.floor((lyw-R-CAVE_Y0)/CS)-1,cy1=Math.floor((lyw+R-CAVE_Y0)/CS)+1;
  for(let cy=cy0;cy<=cy1;cy++)for(let cx=cx0;cx<=cx1;cx++){
    const k=(at(cx,cy)<<3)|(at(cx+1,cy)<<2)|(at(cx+1,cy+1)<<1)|at(cx,cy+1);
    if(k===0||k===15)continue;
    const X=(cx+.5)*CS,Y=(cy+.5)*CS+CAVE_Y0,h=CS*.5;
    const T=[X+h,Y],Rr=[X+CS,Y+h],B=[X+h,Y+CS],Lt=[X,Y+h];
    switch(k){
      case 1:case 14:shade(Lt,B);break;
      case 2:case 13:shade(B,Rr);break;
      case 3:case 12:shade(Lt,Rr);break;
      case 4:case 11:shade(T,Rr);break;
      case 5:shade(T,Lt);shade(B,Rr);break;
      case 6:case 9:shade(T,B);break;
      case 7:case 8:shade(T,Lt);break;
      case 10:shade(T,Rr);shade(Lt,B);break;
    }
  }
  return C.lampMask=cv;
}
/* ── дифференциальный рост (M262): inconvergent, differential mesh ──
   Контур из восьми точек; на каждом шаге длинные рёбра делятся, близкие
   точки расталкиваются, каждая тянется чуть наружу и прижимается к кругу R.
   Складки не задаёт никто — они выходят сами из трёх правил. Детерминирован
   переданным генератором: пещера обязана выглядеть одинаково от входа к входу. */
function growLichen(r,R,iters){
  let pts=[];const n0=8;
  for(let i=0;i<n0;i++){const a=i/n0*TAU;
    pts.push([Math.cos(a)*R*.4,Math.sin(a)*R*.4]);}
  for(let it=0;it<iters;it++){
    const np=[];
    for(let i=0;i<pts.length;i++){
      const a=pts[i],b=pts[(i+1)%pts.length];
      np.push(a);
      if(pts.length<64&&Math.hypot(b[0]-a[0],b[1]-a[1])>R*.16)
        np.push([(a[0]+b[0])/2+(r()-.5)*1.2,(a[1]+b[1])/2+(r()-.5)*1.2]);
    }
    pts=np;
    const f=pts.map(()=>[0,0]);
    for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){
      const dx=pts[j][0]-pts[i][0],dy=pts[j][1]-pts[i][1];
      const d2=dx*dx+dy*dy;if(d2>R*R*.09)continue;
      const d=Math.sqrt(d2)||.001,push=(R*.3-d)/d*.05;
      if(push>0){f[i][0]-=dx*push;f[i][1]-=dy*push;f[j][0]+=dx*push;f[j][1]+=dy*push;}
    }
    for(let i=0;i<pts.length;i++){
      const a=pts[(i-1+pts.length)%pts.length],b=pts[(i+1)%pts.length];
      f[i][0]+=((a[0]+b[0])/2-pts[i][0])*.25;
      f[i][1]+=((a[1]+b[1])/2-pts[i][1])*.25;
      const L=Math.hypot(pts[i][0],pts[i][1])||.001;
      f[i][0]+=pts[i][0]/L*.5;f[i][1]+=pts[i][1]/L*.5;
      pts[i][0]+=f[i][0];pts[i][1]+=f[i][1];
      const L2=Math.hypot(pts[i][0],pts[i][1]);
      if(L2>R){pts[i][0]*=R/L2;pts[i][1]*=R/L2;}
    }
  }
  return pts;
}
