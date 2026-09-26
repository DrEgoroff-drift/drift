/* ══════════════ штурвал: рисунок (M422) ══════════════
   Отделено от `15a-helm` в M422, когда модуль перевалил за 40 КБ: ввод и
   физика штурвала — одно ремесло, а скобки захвата, лента под пальцем, точка
   покоя, подъём подсказки и увод камеры — другое. Шов ровно по нему: ниже нет
   ни одного канала `G.ctl`, только чтение того, что уже посчитано. Всё, что
   здесь нужно из чисел, объявлено в `15a-helm` — он идёт раньше по байтам. */
/* ── рисунок: скобки захвата в мире, стики в пикселях экрана ── */
function helmDrawMarks(zx,zy,Z){
  if(!G.marks||!G.marks.length)return;
  /* с видеокарты уголки — отрезками в проходе сцены (ступень 1: #c в бою пуст) */
  const pass=gpuScene(),SH=[];
  G.marks.forEach((p,i)=>{
    const x=zx(p.x),y=zy(p.y);
    if(x<-40||x>W+40||y<-40||y>H+40)return;
    const r=clamp(Z,.55,1.6)*(i?16:20),g=r*.45;
    if(pass){const c=i?[255,157,122,.5]:[255,107,87,.92],hw=(i?1:1.4)/2;
      for(const k of [[-1,-1],[1,-1],[1,1],[-1,1]]){const cx=x+k[0]*r,cy=y+k[1]*r;
        SH.push([2,cx,y+k[1]*(r-g),cx,cy,hw,0,c[0],c[1],c[2],c[3]],[2,cx,cy,x+k[0]*(r-g),cy,hw,0,c[0],c[1],c[2],c[3]]);}
      return;}
    ctx.strokeStyle=i?"rgba(255,157,122,.5)":"rgba(255,107,87,.92)";ctx.lineWidth=i?1:1.4;
    ctx.beginPath();
    for(const c of [[-1,-1],[1,-1],[1,1],[-1,1]]){
      ctx.moveTo(x+c[0]*r,y+c[1]*(r-g));ctx.lineTo(x+c[0]*r,y+c[1]*r);ctx.lineTo(x+c[0]*(r-g),y+c[1]*r);
    }
    ctx.stroke();
  });
  if(SH.length)gpuShapes(pass,SH);
}
/* ── след стика (M360a) ──
   M360 рисовал два кольца в 82 px с шапкой в 11: на телефоне левое ложилось на
   фишки компаса, МАСШТАБ и приёмник, правое — на подсказку, и кадр читался как
   два прибора поверх мира. Стик не прибор. Он говорит одно — куда и насколько
   я тяну, — и говорит это дугой под большим пальцем: угол дуги это направление,
   её радиус это сила, точка это сам палец. Всё бледное (.2….3): рука и так
   знает, где она, глаз в это место не зовут. */
function helmStickShape(s){
  const dx=s.x-s.x0,dy=s.y-s.y0,m=Math.hypot(dx,dy);
  const k=clamp((m-HELM_DEAD)/HELM_REACH,0,1);
  /* r — докуда доходит ТЕЛО ленты: до пальца минус просвет под подушечкой */
  const r=Math.max(14,m-HELM_GAP),c=m>1e-3?Math.min(m,r)/m:0;
  return {x0:s.x0,y0:s.y0,live:m>HELM_DEAD,ang:Math.atan2(dy,dx),r,k,dx:dx*c,dy:dy*c};
}
/* след живых стиков в пикселях экрана: его читают приборная мелочь на канве
   (drawSysHud), подсказка в DOM (helmLift) и набор 91zzx-mobile */
function helmStickFoot(){
  const s=HELM.S;
  if(!s)return [];
  const dx=s.x-s.x0,dy=s.y-s.y0,m=Math.hypot(dx,dy);
  const n=Math.max(1,Math.ceil(m/(HELM_FOOT*.8)));
  const out=[];
  for(let i=0;i<=n;i++)out.push({side:"L",x:s.x0+dx*i/n,y:s.y0+dy*i/n,r:HELM_FOOT});
  return out;
}
/* ── точка покоя (M410) ──
   Стик — вещь, и у вещи есть место: там, где палец был в последний раз, а до
   первого раза — внизу слева, где в других режимах стоят ◀ ▶ (в системе их
   нет, и угол пуст). Меряем DOM, а не считаем CSS: ряд пэдов сам говорит,
   где он стоит. Телефону только: мышь этой точки не видит. */
function helmHome(){
  if(HELM.home)return HELM.home;
  let x=64,y=H-60;
  const pads=(typeof padsRect==="function")?padsRect():null;   /* кэш, не чтение в кадре (0.3) */
  if(pads){
    const r=pads,rc=cvsRect();
    if(r.height>0&&rc.height>0){
      const kx=W/rc.width,ky=H/rc.height;
      x=(r.left-rc.left+14+28)*kx;
      y=(r.top-rc.top+r.height*.5)*ky;
    }
  }
  return {x:clamp(x,HELM_FOOT+4,W/2-HELM_FOOT),y:clamp(y,HELM_FOOT+4,H-HELM_FOOT-4)};
}
/* подсказка уходит выше пальца, а не гаснет под ним: пока стик накрывает её
   строку, #prompt поднимается ровно на высоту следа. Меряем DOM, а не считаем
   CSS (правило 27z); пишем в стиль только на изменение. */
function helmLift(){
  /* Свой getElementById+getBoundingClientRect был вторым, необрезанным чтением
     вёрстки в кадре, и как раз тем, что срабатывает ИМЕННО под пальцем (только
     когда стик живой) — ровно та надбавка, которую тестировщик увидел поверх
     фонового чтения (18.09). 08-state уже держит этот прямоугольник в кэше. */
  const el=promptEl();
  let lift=0;
  const foot=helmStickFoot();
  if(el&&el.textContent&&foot.length){
    const r=promptRect();
    if(r&&r.height>0){
      /* мерим ОТ НЕПОДНЯТОГО места: подсказка уже поднята на прошлый lift, и
         без этой поправки следующий кадр увидел бы её чистой и уронил обратно —
         строка бы дрожала под пальцем. Поправка идёт НЕ от нынешнего lift, а от
         того, что стоял в момент ЗАМЕРА: прямоугольник подсказки лежит в кэше
         (08-state), а --helmlift пишется в стиль <body>, за которым наблюдателя
         нет, — значит замер может быть и старше нынешнего подъёма. Кэш отдаёт
         один и тот же объект, пока не пересчитан, по нему и узнаём, свежий ли
         он: сменился объект — сменилась и база. Без этого второй вызов подряд
         складывал подъём дважды, не находил пальца над строкой и ронял её
         обратно — то самое дрожание, которое поправка и должна была убрать. */
      if(HELM.liftRect!==r){HELM.liftRect=r;HELM.liftBase=Math.max(0,HELM.lift);}
      const base=HELM.liftBase||0,top=r.top+base,bot=r.bottom+base;
      for(const f of foot)
        if(f.x+f.r>r.left&&f.x-f.r<r.right&&f.y-f.r<bot&&f.y+f.r>top)
          lift=Math.max(lift,bot-(f.y-f.r)+8);
      /* потолок: подсказка поднимается ровно настолько, чтобы разойтись с
         пальцем, и никогда не уезжает на середину экрана */
      lift=Math.min(lift,Math.round(innerHeight*.22));
      /* округляем ДО сравнения (Контроль, 18.09): без этого суб-пиксельное
         дрожание следа пальца писало бы в стиль на каждый кадр движения —
         теперь запись идёт только когда целое число реально сменилось */
      lift=Math.round(lift);
    }
  }
  if(lift!==HELM.lift){
    HELM.lift=lift;
    if(document.body&&document.body.style&&document.body.style.setProperty){
      document.body.style.setProperty("--helmlift",lift+"px");
      document.body.classList.toggle("helmstick",foot.length>0);
    }
  }else if(document.body&&document.body.classList&&
           document.body.classList.contains("helmstick")!==(foot.length>0)){
    document.body.classList.toggle("helmstick",foot.length>0);
  }
}
/* сколько места занимает скобка захвата над корпусом: полоску корпуса ставят
   ВЫШЕ неё, иначе верхняя грань скобки ложится ровно на полоску (M360a) */
function helmMarkTop(p,Z){
  if(!G.marks)return 0;
  const i=G.marks.indexOf(p);
  if(i<0)return 0;
  return clamp(Z,.55,1.6)*(i?16:20)+8;
}
/* ── увод корабля из-под пальца (M422) ──
   Корабль стоит в середине кадра, и палец, легший там же, накрывает ровно то,
   чем правят. Камера смещается К пальцу — значит корабль уезжает ОТ него, — и
   тем сильнее, чем ближе палец лёг. Возврат плавный (~0.4 с), иначе кадр
   дёргается на каждое касание. Мировые единицы: пиксели делим на масштаб. */
function helmCamOff(Z){
  const c=HELM.cam,s=HELM.S;
  let wx=0,wy=0;
  if(s&&Z>0){
    const dx=s.x-W/2,dy=s.y-H/2,d=Math.hypot(dx,dy);
    if(d<HELM_NUDGE_R){
      const k=(1-d/HELM_NUDGE_R)*HELM_NUDGE/Z;
      if(d>8){c.dx=dx/d;c.dy=dy/d;}     /* палец ровно в центре — держим прежнюю сторону */
      wx=c.dx*k;wy=c.dy*k;
    }
  }
  c.x+=(wx-c.x)*.07;c.y+=(wy-c.y)*.07;
  return c;
}
/* лента: четырёхугольник от центра стика к голове, с расширением; прозрачность — от g0 у центра к g1 у головы */
function helmBand(x0,y0,x1,y1,w0,w1,col,al,g0,g1){
  const dx=x1-x0,dy=y1-y0,d=Math.hypot(dx,dy)||1,nx=-dy/d,ny=dx/d;
  ovQuad(x0+nx*w0*.5,y0+ny*w0*.5,x1+nx*w1*.5,y1+ny*w1*.5,x1-nx*w1*.5,y1-ny*w1*.5,x0-nx*w0*.5,y0-ny*w0*.5,col,al,g0,g1);
}
/* пустой бак (R2): стик гаснет и говорит почему — руль без топлива не работает */
function helmDry(){return G.mode==="system"&&typeof rescueEmpty==="function"&&rescueEmpty();}
function helmDryLabel(x,y,a){
  ovText(OVL.uq,x,y-HELM_ARC0-8,"БАК ПУСТ","10px ui-monospace,monospace","rgb(255,178,122)","center","alphabetic",.9*a,1);
}
/* стики — на слое #ovl (08bi) каждый кадр, без 2D: лента — четырёхугольник с градиентом, края,
   шеврон и след — капсулы, «СТОП» — кольцо и дуга, слова — маски атласа. Круглые концы и стыки —
   как lineCap/lineJoin round прежнего пути */
function helmDrawSticks(){
  const dry=helmDry(),Q=OVL.uq;
  /* окно выходов открыто — оно и есть ответ; подпись под ним лишняя */
  const sosUp=typeof document!=="undefined"&&!!document.body&&!!document.body.classList&&document.body.classList.contains("sosopen");
  const one=(s,fade)=>{
    const q=helmStickShape(s),a=(fade?s.f:1)*(dry?.35:1),c=G.ctl;
    const slow=!!(c&&c.slow)&&!fade;
    /* бирюза приборов на ходу, янтарь на торможении — те же два тона, что у
       фишек компаса и у скобок захвата: лента не заводит третьего цвета */
    const col=slow?"rgb(255,178,122)":"rgb(127,230,216)";
    if(q.live){
      const L=q.r;
      const hx=q.x0+Math.cos(q.ang)*L,hy=q.y0+Math.sin(q.ang)*L;
      const w1=HELM_BAND0+HELM_BAND*q.k;
      /* тело — ЗАДАННЫЙ ход: заливка не больше 15 % и тает к голове, край — линией.
         Две заливки (заданный .18–.30 и фактический .32) складывались в сплошной клин,
         на телефоне он закрывал курс перед носом (Контроль, 24.09) */
      helmBand(q.x0,q.y0,hx,hy,HELM_BAND0,w1,col,a,.15,.03);
      /* края: тёмный кант под цветной линией — лента не тонет в светлой туманности */
      const dx=Math.cos(q.ang),dy=Math.sin(q.ang),nx=-dy,ny=dx;
      const edges=(t,al,lw)=>{
        const ex=q.x0+(hx-q.x0)*t,ey=q.y0+(hy-q.y0)*t,we=(HELM_BAND0+(w1-HELM_BAND0)*t)*.5,w0=HELM_BAND0*.5;
        for(const sg of [-1,1])ovCap(q.x0+nx*w0*sg,q.y0+ny*w0*sg,ex+nx*we*sg,ey+ny*we*sg,lw+1.4,"rgba(6,10,14,.9)",al*.5*a);
        for(const sg of [-1,1])ovCap(q.x0+nx*w0*sg,q.y0+ny*w0*sg,ex+nx*we*sg,ey+ny*we*sg,lw,col,al*a);};
      edges(1,.4,1.1);
      /* ФАКТИЧЕСКИЙ ход — край ярче и толще докуда корабль уже разогнался вдоль ленты */
      const f=c?clamp(c.vp/Math.max(q.k,.08),0,1):0;
      if(f>.02)edges(f,.8,1.6);
      /* голова — шеврон, а не кружок под подушечкой: одна ломаная, стык не двоится */
      const tx=hx+Math.cos(q.ang)*6,ty=hy+Math.sin(q.ang)*6,A=q.ang-.7,B=q.ang+.7,o=w1*.5+5;
      ovCap3(hx+Math.cos(A)*o,hy+Math.sin(A)*o,tx,ty,hx+Math.cos(B)*o,hy+Math.sin(B)*o,1.8,col,.62*a);
    }else{
      /* мёртвая зона — «СТОП»: кольцо и слово, и кольцо тает вместе с ходом */
      ovEll(q.x0,q.y0,HELM_ARC0,HELM_ARC0,1.4,"rgb(255,178,122)",.26*a);
      const vk=G.ctl?clamp(G.ctl.vk,0,1):0;
      if(vk>.02){
        if(vk<1)ovArc(q.x0,q.y0,HELM_ARC0,-Math.PI/2,TAU*vk,1.4,"rgb(255,178,122)",.4*a);
        else ovEll(q.x0,q.y0,HELM_ARC0,HELM_ARC0,1.4,"rgb(255,178,122)",.4*a);
      }
      if(!dry)ovText(Q,q.x0,q.y0-HELM_ARC0-6,"СТОП","9px ui-monospace,monospace","rgb(255,178,122)","center","alphabetic",.5*a,1);
    }
    /* тот же вектор — у самого корабля (M422): связь «палец → корабль» должна
       быть видна там, куда игрок смотрит, а не только под большим пальцем */
    if(q.live&&c&&G.viewCX!==undefined&&G.mode==="system"){
      const sx=W/2+(G.ship.x-G.viewCX)*G.zoom,sy=H/2+(G.ship.y-G.viewCY)*G.zoom;
      const L2=18+30*q.k,am=Math.hypot(c.ax,c.ay)||1;
      ovCap(sx,sy,sx+c.ax/am*L2,sy+c.ay/am*L2,1.4,col,.22*a);
    }
    /* хвост за пальцем: полоска не появляется из ниоткуда, она пришла оттуда */
    if(!fade)helmTrailAge(HELM.trail);  /* палец замер — след догоняет его и гаснет */
    const T=HELM.trail;
    if(!fade&&T.length>1)
      for(let i=1;i<T.length;i++)ovCap(T[i-1].x,T[i-1].y,T[i].x,T[i].y,1+3*(i/T.length),col,.05+.10*(i/T.length)*a);
    ovEll(q.x0,q.y0,1.8,1.8,0,col,.13*a);
    ovEll(s.x,s.y,3.2,3.2,0,col,.28*a);
    if(dry&&!sosUp)helmDryLabel(q.x0,q.y0,fade?s.f:1);
  };
  const live=HELM.S,fade=HELM.fade;
  if(live)one(live,false);
  else if(fade){one(fade,true);fade.f-=.08;if(fade.f<=0)HELM.fade=null;}
  else if(typeof document!=="undefined"&&document.body&&document.body.classList&&
          document.body.classList.contains("mobile")){
    /* точка покоя: бледное кольцо мёртвой зоны и точка. Сказать «стик здесь»
       и не спорить с миром за глаз — те же .1…2, что у самого следа */
    const h=helmHome();
    ovEll(h.x,h.y,HELM_ARC0,HELM_ARC0,1,"#cfe6ea",.16);
    ovEll(h.x,h.y,2.2,2.2,0,"#cfe6ea",.3);
    if(dry&&!sosUp)helmDryLabel(h.x,h.y,1);
  }
}
