/* ══════════════ мировая галактика: небо карты стоит в мире (M447–M448, docs/DESIGN-galaxy.md) ══════════════
   Автор 11.09: «полоса двигается вместе… звёзды приклеены к экрану» — и выбор:
   «мировая галактика, у нас в игре должно быть всё круто». Закон карты: слой
   либо В МИРЕ (едет с листом 1:1 и растёт с зумом), либо БУМАГА (не движется и
   не несёт узнаваемого). Параллакса на карте нет — это взгляд сверху на лист.

   Ядро галактики — в 0:0 (роза «К ЯДРУ», круг заселения CHRON_R, sysDanger к
   r=40 — всё уже так говорит). Спираль с перемычкой: диск exp(-r/22), тёплый
   балдж с короткой перемычкой, два логарифмических рукава с шагом ~14° и два
   слабых отрога, пыль на внутренней кромке рукава, розовые узлы там, где рукав
   густ. Чистая функция координат и постоянных солей: одна галактика на всех
   игроков и навсегда (открытки, страница войны), ничего не хранится, ни одна
   система не двигается — это картинка и имена.

   Рисование — поле на видеокарте (17z3-map-gpu, G10): та же формула на каждый
   пиксель, хэш бит в бит с 01-core. Тайлы, печь с бюджетом и проявление ушли
   вместе с процессорным циклом. */
const GAL_VER=1;                        /* поднять, если галактику перенастроят после выхода (как PART_GEN) */
const GAL_RD=22;                        /* масштаб диска, секторов */
const GAL_BAR_A=.62,GAL_BAR_L=7,GAL_BAR_Q=.55;   /* перемычка: угол, длина, сжатие */
const GAL_PITCH=Math.tan(14*Math.PI/180),GAL_R0=3.2;
const GAL_BULGE_CAP=.5;                 /* потолок балджа: дом (0:0, зум 1) — самый людный экран игры (§6) */
const GAL_GLOW_CAP=.42;                 /* потолок свечения в кадре: адреса поверх него обязаны читаться */
/* угловое расстояние от рукава: + снаружи (по ходу вращения), − к центру */
function galArmD(r,th,ph,pitch){
  const s=th-Math.log(Math.max(r,GAL_R0)/GAL_R0)/pitch-ph;
  let d=((s%Math.PI)+Math.PI*1.5)%Math.PI-Math.PI/2;   /* два рукава — период π */
  return d*r;
}
function galaxyAt(x,y){
  const r=Math.hypot(x,y),th=Math.atan2(y,x);
  const disk=Math.exp(-r/GAL_RD);
  /* балдж и перемычка — тёплое ядро, у которого есть ось */
  const ca=Math.cos(GAL_BAR_A),sa=Math.sin(GAL_BAR_A),u=x*ca+y*sa,v=-x*sa+y*ca;
  const bar=Math.exp(-((u/GAL_BAR_L)**2+(v/(GAL_BAR_L*GAL_BAR_Q*.45))**2));
  const core=Math.exp(-((r/3)**2));
  const bulge=Math.min(GAL_BULGE_CAP,.55*core+.35*bar);
  /* рукава: ширина растёт наружу; плотность рвётся на комья доменным шумом */
  const w=2.2+.06*r;
  const d1=galArmD(r,th,GAL_BAR_A,GAL_PITCH);
  const d2=galArmD(r,th,GAL_BAR_A+Math.PI/2+.4,Math.tan(19*Math.PI/180));
  const wx=x*.11+fbm2(x*.05,y*.05,0x6A1,3)*2.4,wy=y*.11+fbm2(x*.05+9,y*.05,0x6A2,3)*2.4;
  const clump=.45+.9*fbm2(wx,wy,0x6A3,4);
  const onArm=Math.exp(-((d1/w)**2)),spur=.3*Math.exp(-((d2/(w*.8))**2));
  const ramp=clamp((r-GAL_BAR_L*.6)/4,0,1);            /* рукава растут из концов перемычки */
  const arm=ramp*Math.min(1,(onArm+spur)*clump);
  /* пыль — на внутренней (отстающей) кромке рукава, два шага значения: гребень и полоса */
  const lane=ramp*Math.exp(-(((d1+.38*w)/(.3*w))**2))*(.5+.8*fbm2(x*.3,y*.3,0x6A4,3));
  const dust=clamp(lane*.85,0,.85);
  /* узлы — розовые HII там, где рукав густ и прошёл хэш */
  const kn=fbm2(x*.45+3,y*.45,0x6A5,3);
  const knot=clamp((onArm*clump-.55)*2.2,0,1)*clamp((kn-.58)*6,0,1);
  const glow=clamp((bulge+disk*(.16+.62*arm))*(1-dust),0,1);
  /* цвет по кругу (закон богатой палитры): янтарный балдж, голубые рукава,
     фиолетово-серое межрукавье, розовые узлы */
  const bw=bulge/(bulge+disk*(.16+.62*arm)+1e-6);
  let col=mixc(mixc([128,116,168],[176,196,255],clamp(arm*1.4,0,1)),[255,204,142],clamp(bw*1.3,0,1));
  col=mixc(col,[255,128,176],knot*.8);
  return {glow,dust,knot,col,arm,bulge};
}
/* нарисовать галактику под листом: V — центр окна в секторах, cell — пикселей на сектор.
   Поле на видеокарте, на каждый пиксель (17z3-map-gpu): ни тайлов, ни бюджета
   печи, ни проявления — вблизи рукав резок, на отъезде — тот же без щелчка */
function drawGalaxy(V,cell){
  const pass=mapGpuPass(true);
  if(pass)galaxyGpu(pass,V,cell);
}
/* значение на сектор — для звёзд: их цикл обходит до пяти тысяч секторов за
   кадр, и galaxyAt с четырьмя fbm на каждый съел бы кадр. Галактика вечна —
   память просто чистится целиком, когда разрастётся */
const GAL_CELL=new Map();
function galaxyCell(sx,sy){
  const k=sx*100003+sy;
  let g=GAL_CELL.get(k);
  if(!g){if(GAL_CELL.size>40000)GAL_CELL.clear();g=galaxyAt(sx+.5,sy+.5);GAL_CELL.set(k,g);}
  return g;
}
/* ── звёзды галактики (M448): точки в мире, плотность на экране постоянна ──
   Не системы: меньше самого малого знака адреса, без креста и ореола, не
   мерцают — на карте они предметы мира. Сколько рисовать — по зуму так, чтобы
   на кадре 1600×900 было ~1500 точек при любом зуме; порог переходят плавно. */
const GAL_STAR_SCREEN=1500/(1600*900);
const GAL_STAR_CAND=10;
const GAL_STAR_COL=[[255,214,170],[255,236,210],[236,240,255],[200,216,255],[176,196,255],[255,190,210]];
const GAL_STAR_BUF=GAL_STAR_COL.map(()=>[]).concat([[]]);   /* последняя корзина — звёзды за пылью (17z3) */
function drawGalaxyStars(V,cell){
  const per=GAL_STAR_SCREEN*cell*cell;          /* ожидаемое число на сектор при плотности 1 */
  const hw=W/2/cell+1,hh=H/2/cell+1;
  const sx0=Math.floor(V.x-hw),sx1=Math.ceil(V.x+hw),sy0=Math.floor(V.y-hh),sy1=Math.ceil(V.y+hh);
  for(const b of GAL_STAR_BUF)b.length=0;
  const sz=Math.max(1,Math.min(1.6,cell/30));
  for(let sy=sy0;sy<=sy1;sy++)for(let sx=sx0;sx<=sx1;sx++){
    const g=galaxyCell(sx,sy);
    const want=per*(.25+2.2*g.glow)*(1-g.dust*.7);
    const n=Math.min(GAL_STAR_CAND,Math.ceil(want));
    for(let i=0;i<n;i++){
      /* звезда либо есть, либо нет — по хэшу против ожидания; у самого порога
         проявляется, а не щёлкает. Альфа от ожидания давала каждой клетке по
         полупрозрачной точке, и на отъезде их становилось в десять раз больше */
      const m=want-i,hz=h01(sx,sy,0x5A70+i*7);
      if(hz>=m)continue;
      const a=clamp((m-hz)*6,0,1);
      const hx=h01(sx,sy,0x5A71+i*7),hy=h01(sx,sy,0x5A72+i*7),hm=h01(sx,sy,0x5A73+i*7);
      const x=W/2+(sx+hx-V.x)*cell,y=H/2+(sy+hy-V.y)*cell;
      if(x<-2||x>W+2||y<-2||y>H+2)continue;
      /* цвет — теплее в балдже, голубее в рукаве, краснее за пылью */
      const c=g.bulge>.12?(hm<.6?0:1):(g.arm>.3?(hm<.5?3:4):(hm<.7?2:3));
      /* блеск — степенной закон: много тусклых, редкие яркие (L1.7) */
      const hb=h01(sx,sy,0x5A74+i*7),k=(.3+.5*hm*hm+1.9*Math.pow(hb,14))*(1-g.dust*.45);
      GAL_STAR_BUF[g.knot>.3&&hm>.8?5:(g.dust>.35&&hb<.7?6:c)].push(x,y,a*k);
    }
  }
  const pass=mapGpuPass();
  if(pass)galStarsGpu(pass,sz);
}
