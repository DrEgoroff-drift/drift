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
  if(drops.length<12&&rnd()<.03*dt){
    const cand=[];
    for(const t of D.tips)if(t.up&&!t.col&&Math.abs(t.x-C.x)<W*.6)cand.push(t);
    if(cand.length){
      const t=cand[Math.floor(rnd()*cand.length)];
      drops.push({x:t.x+t.lean*t.L,y:t.y0+t.L,vy:.02,fy:caveFloorOf(C,t.x,t.low)});
    }
  }
}

/* ── рисование ── */

/* ══════════════ свой свет пещеры (M248) ══════════════
   У пещеры не было ни одного источника, кроме фонаря на шлеме: отсюда и
   «0% пары», и ощущение, что мир кончается за кругом света. Теперь у неё есть
   собственная жизнь и собственный свет — холодный мох по стенам и чужой
   фонарь, оставленный тем, кто был здесь раньше. Второе — ещё и след человека:
   пещеру кто-то проходил до тебя.
   Всё сеяно от C.seed и ничего не сохраняется: место одно и то же при каждом
   спуске, но в сейве его нет. */
function caveLampSpot(C){
  if(C.lamp!==undefined)return C.lamp;
  const r=rng(C.seed^0x1A77);
  const x=CAVE_W*(.35+r()*.4);
  return C.lamp={x,y:caveFloor(C,x),ph:r()*TAU};
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
