/* ══════════════ свет и воздух ══════════════ */
/* До этого свет на грунте был зашит константами: «склон вправо-вверх светлее».
   Он не знал ни цвета звезды, ни цвета неба, поэтому все планеты освещались
   одинаково — а именно освещение, а не форма, отвечает за то, верит ли игрок
   в место.

   Три вещи, которые дают почти весь эффект:
   направленный свет звезды своего цвета;
   цветной подсвет от неба в тенях (главный приём — без него тень мёртвая);
   воздушная перспектива: далёкое уводится к цвету неба, а не просто гасится. */
const SUN_DIR={x:.55,y:-.83};                 // солнце в drawSkyLayer справа сверху
/* ветер живёт в общей переменной: его читают трава в drawGround, пыль и
   растения, и все они должны качаться в одну сторону — рассинхрон читается
   как брак быстрее, чем полное отсутствие движения */
let WIND=0;
function windOf(p){
  const base=(h01((p.seed|0),3,0x117A)-.5)*2;
  const air=p.T.atm==="отсутствует"?.06:(p.T.atm.indexOf("разреженная")>=0?.5:1);
  /* порывами, а не ровным потоком: ровный ветер глаз не замечает вообще */
  const gust=.62+.38*Math.sin(G.t*.0037+p.seed%7)*Math.sin(G.t*.0011+2);
  return base*air*gust;
}
function starRGB(){
  const sc=(G.sys&&G.sys.cls&&G.sys.cls.col)||"#ffe08a";
  const c=hex2rgb(sc);
  /* затмение гасит НАПРАВЛЕННЫЙ свет и только его: заполняющий от неба остаётся,
     поэтому мир не чернеет, а становится плоским и синим — так это и выглядит
     на самом деле (06a-celest) */
  const d=typeof celDark==="function"?celDark():0;
  if(d<=0)return c;
  const k=1-d;
  return [c[0]*k|0,c[1]*k|0,c[2]*k|0];
}
/* небо как источник заполняющего света: у токсичного мира тени зелёные,
   у ледяного — синие, и это читается сразу */
function ambRGB(p){return p.T.sky[1];}
/* сколько света вообще: у безвоздушного мира тень почти чёрная (нечему
   рассеивать), у плотной атмосферы — мягкая */
function ambK(p){
  const a=p.T.atm;
  if(a==="отсутствует")return .13;
  if(a.indexOf("разреженная")>=0)return .26;
  return .40;
}
/* освещённость склона: ламберт по нормали профиля плюс заполнение от неба */
function litRGB(base,slope,p,sun,amb,k){
  const nl=Math.hypot(slope,1);
  const nx=-slope/nl, ny=-1/nl;
  const d=clamp(nx*SUN_DIR.x+ny*SUN_DIR.y,0,1);
  /* мягкий переход у терминатора: жёсткий ламберт даёт «пластик» */
  const I=Math.pow(d,.72)*.78;
  const r=base[0]*(k*amb[0]/255+I*sun[0]/255);
  const g=base[1]*(k*amb[1]/255+I*sun[1]/255);
  const b=base[2]*(k*amb[2]/255+I*sun[2]/255);
  return [clamp(r,0,255)|0,clamp(g,0,255)|0,clamp(b,0,255)|0];
}
/* ── камера ──
   Камера, жёстко привязанная к персонажу, читается как «экран едет», а не как
   «оператор идёт рядом». Нужны три вещи: инерция, взгляд вперёд по ходу
   движения и дыхание. Плюс тряска от удара — единственное, что даёт миру вес.
   Состояние живёт в S, поэтому переход между режимами его не ломает. */
function camStep(S,dt,walking){
  if(!S.cam)S.cam={x:S.x,y:S.y};
  /* взгляд вперёд: на ходу камера уводится в сторону движения, на месте
     возвращается. Иначе игрок всегда смотрит ровно в центр и не видит, куда идёт. */
  const look=(walking?S.face*54:0);
  S.camLook=lerp(S.camLook||0,look,Math.min(1,.045*dt));
  const tx=S.x+S.camLook;
  /* по вертикали камера мягче: рельеф под ногами дёргается на каждой кочке,
     и жёсткое следование превращает ходьбу в тряску */
  S.cam.x+=(tx-S.cam.x)*Math.min(1,.11*dt);
  S.cam.y+=(S.y-S.cam.y)*Math.min(1,(S.on?.055:.10)*dt);
  S.shake=Math.max(0,(S.shake||0)-.55*dt);
}
/* смещение камеры на кадр: дыхание плюс затухающая тряска */
function camOffset(S){
  const sh=S.shake||0;
  const b=Math.sin(G.t*.0062)*1.7;                        // дыхание оператора
  if(sh<=0)return {x:0,y:b};
  /* тряска не синусоида, а рваная: синус читается как качели */
  return {x:(h01((G.t*3)|0,1,0x5A)-.5)*sh*1.8,
          y:b+(h01((G.t*3)|0,2,0x5A)-.5)*sh*1.8};
}
/* ── воздушная перспектива ──
   далёкий хребет не «полупрозрачный», а выцветший в цвет неба: именно этим
   глаз мерит расстояние. Отдельная функция, потому что дальний слой рисуется
   тем же drawGround, что и близкий. */
function hazeFar(p,k){
  const s=p.T.sky[0],a=p.T.sky[1];
  const c=[lerp(s[0],a[0],.5),lerp(s[1],a[1],.5),lerp(s[2],a[2],.5)];
  const pal=p.T.pal[1];
  /* ── дальний план обязан быть виден ──
     Хребет выцветал точно в цвет неба, и на мирах, где грунт и воздух одного
     тона (вулканический, токсичный, джунглевый), он исчезал вовсе: у половины
     планет за спиной была пустая заливка вместо горизонта. Дальнее не только
     бледнеет — оно ещё и ТЕМНЕЕ неба на просвет, потому что смотришь на
     затенённый склон. Небольшой сдвиг в тень и возвращает горизонт всем. */
  const v=[0,1,2].map(i=>lerp(pal[i]*.8,c[i],k)*(1-.13*(1-k)));
  return "rgb("+v.map(Math.round).join(",")+")";
}
/* дымка в низинах и у горизонта: одна полоса градиента, но она делает
   глубину сильнее, чем любой дополнительный слой рельефа */
function hazeBand(p,y0,h){
  const c=p.T.sky[1];
  const g=ctx.createLinearGradient(0,y0-h,0,y0+h*.35);
  g.addColorStop(0,"rgba("+c.join(",")+",0)");
  g.addColorStop(.55,"rgba("+c.join(",")+","+(p.T.atm==="отсутствует"?.10:.34)+")");
  g.addColorStop(1,"rgba("+c.join(",")+",0)");
  ctx.fillStyle=g;ctx.fillRect(0,y0-h,W,h*1.35);
}
/* ── лучи от звезды ──
   объёмного света в canvas 2D нет, но есть то, ради чего его хотят: несколько
   мягких клиньев от солнца, медленно дышащих. Только там, где есть чему
   светиться — в вакууме лучей не бывает. */
function lightShafts(p){
  if(p.T.atm==="отсутствует")return;
  const sx=W*.78,sy=H*.16;
  const sun=starRGB();
  /* один и тот же веер из пяти лучей под одним углом стоял на каждом мире
     штампом (G1): число, раскрытие и наклон — от планеты */
  const hs=hashi(p.seed,0x5AF7,1), nS=2+(hs&3), a0=.92+((hs>>>4)&15)/15*.4, spr=.12+((hs>>>8)&7)/7*.14;
  ctx.save();
  ctx.globalCompositeOperation="lighter";
  for(let i=0;i<nS;i++){
    const a=a0+i*spr+Math.sin(G.t*.0016+i)*.035;
    const wdt=.030+((i*7)%3)*.012;
    const len=H*1.25;
    const al=(.020+((i*5)%3)*.010)*(1+Math.sin(G.t*.0021+i*2)*.35);
    const g=ctx.createLinearGradient(sx,sy,sx+Math.cos(a)*len,sy+Math.sin(a)*len);
    g.addColorStop(0,"rgba("+sun.join(",")+","+al.toFixed(3)+")");
    g.addColorStop(1,"rgba("+sun.join(",")+",0)");
    ctx.fillStyle=g;
    ctx.beginPath();ctx.moveTo(sx,sy);
    ctx.lineTo(sx+Math.cos(a-wdt)*len,sy+Math.sin(a-wdt)*len);
    ctx.lineTo(sx+Math.cos(a+wdt)*len,sy+Math.sin(a+wdt)*len);
    ctx.closePath();ctx.fill();
  }
  ctx.restore();
}
/* ── финальная свёртка кадра ──
   виньетка и лёгкий цветовой сдвиг: две заливки, которые сводят разнородные
   слои в одну картинку. Всё, что тут делается, стоит два fillRect. */
function gradePass(p){
  /* ── затмение сводится здесь, а не в небе ──
     Первый проход гасил только небо: сверху темнело, а грунт, флора и
     скафандр оставались дневными, и кадр разваливался на две картинки.
     Затмение — это свет, а свет в кадре сводится последней свёрткой: одна
     холодная заливка на всё сразу, и мир садится целиком (06a-celest). */
  const DK=typeof celDark==="function"?celDark():0;
  if(DK>.02){
    ctx.fillStyle="rgba(10,16,34,"+(.52*DK).toFixed(3)+")";
    ctx.fillRect(0,0,W,H);
    /* и цвет уходит: в сумерках глаз теряет насыщенность раньше яркости */
    ctx.save();ctx.globalCompositeOperation="saturation";
    ctx.fillStyle="rgba(128,128,128,"+(.5*DK).toFixed(3)+")";
    ctx.fillRect(0,0,W,H);ctx.restore();
  }
  /* ── виньетка и тон — один слой ──
     Два полноэкранных градиента на кадр стоили ~25 мс на ×2 (G0, 0.94):
     в canvas 2D единица цены — полноэкранный проход, а градиент дороже
     заливки в пять раз. Картинка при этом не меняется от кадра к кадру —
     печётся один раз на планету и размер и кладётся одним drawImage (18c). */
  const sun=starRGB(),amb=ambRGB(p);
  ctx.drawImage(screenLayer("grade|"+sun.join(",")+"|"+amb.join(","),()=>{
    const g=ctx.createRadialGradient(W*.5,H*.46,Math.min(W,H)*.30,W*.5,H*.46,Math.max(W,H)*.78);
    g.addColorStop(0,"rgba(0,0,0,0)");
    g.addColorStop(1,"rgba(0,0,0,.34)");
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    /* холодная тень внизу, тёплый свет сверху — сдвиг маленький, но именно он
       не даёт кадру рассыпаться на «фон + фигуры». Раньше шёл в lighter;
       при альфе .06 обычное наложение неотличимо, а в слое оно честнее. */
    const t=ctx.createLinearGradient(0,0,0,H);
    t.addColorStop(0,"rgba("+sun.join(",")+",.07)");
    t.addColorStop(.5,"rgba(0,0,0,0)");
    t.addColorStop(1,"rgba("+amb.join(",")+",.09)");
    ctx.fillStyle=t;ctx.fillRect(0,0,W,H);
  }),0,0,W,H);
}
/* небо-подложка: вертикальный градиент на весь экран, один раз на планету */
function drawSkyBase(p){
  const s=p.T.sky, sc=(G.sys&&G.sys.cls&&G.sys.cls.col)||"#ffe08a", hasAir=p.T.atm!=="отсутствует";
  /* час суток (06a): слой печётся на 48 делений дня — небо темнеет к ночи, а
     зарево гнётся за звездой: сидит на горизонте с её стороны и тем ярче,
     чем она ниже (хвост G7). Ночью зарева нет — нечему рассеиваться */
  const sun=celSun(p), hb=Math.round(sun.ph*48)%48, nite=surfNight(p);
  ctx.drawImage(screenLayer("skybg|"+s[0].join(",")+"|"+s[1].join(",")+"|"+sc+"|"+hasAir+"|"+hb,()=>{
    ctx.fillStyle=skyGrad(p);ctx.fillRect(0,0,W,H);
    if(hasAir){
      const c=hex2rgb(sc), day=clamp(1+sun.alt*2.2,0,1);
      const g=ctx.createLinearGradient(0,H*.42,0,H*.78);
      g.addColorStop(0,"rgba("+c.join(",")+",0)");
      g.addColorStop(.7,"rgba("+c.join(",")+","+(.10*day).toFixed(3)+")");
      g.addColorStop(1,"rgba("+c.join(",")+","+(.16*day).toFixed(3)+")");
      ctx.fillStyle=g;ctx.fillRect(0,H*.42,W,H*.36);
      /* наклонное зарево: пятно у горизонта там, где звезда, сильнее всего
         на восходе и закате — это и есть «гнётся по высоте» */
      const low=clamp(1-Math.abs(sun.alt)*1.4,0,1)*day;
      if(low>.02){
        const gx=W*(.5+sun.az*.42), gy=H*.74;
        const rg=ctx.createRadialGradient(gx,gy,8,gx,gy,W*.55);
        rg.addColorStop(0,"rgba("+c.join(",")+","+(.30*low).toFixed(3)+")");
        rg.addColorStop(.5,"rgba("+c.join(",")+","+(.10*low).toFixed(3)+")");
        rg.addColorStop(1,"rgba("+c.join(",")+",0)");
        ctx.fillStyle=rg;ctx.fillRect(0,0,W,H);
      }
    }
    if(nite>0){ctx.fillStyle="rgba(4,6,14,"+(nite*.9).toFixed(3)+")";ctx.fillRect(0,0,W,H);}
  }),0,0,W,H);
}
