/* ══════════════ штурвал: рисунок (M422) ══════════════
   Отделено от `15a-helm` в M422, когда модуль перевалил за 40 КБ: ввод и
   физика штурвала — одно ремесло, а скобки захвата, лента под пальцем, точка
   покоя, подъём подсказки и увод камеры — другое. Шов ровно по нему: ниже нет
   ни одного канала `G.ctl`, только чтение того, что уже посчитано. Всё, что
   здесь нужно из чисел, объявлено в `15a-helm` — он идёт раньше по байтам. */
/* ── рисунок: скобки захвата в мире, стики в пикселях экрана ── */
function helmDrawMarks(zx,zy,Z){
  if(!G.marks||!G.marks.length)return;
  G.marks.forEach((p,i)=>{
    const x=zx(p.x),y=zy(p.y);
    if(x<-40||x>W+40||y<-40||y>H+40)return;
    const r=clamp(Z,.55,1.6)*(i?16:20),g=r*.45;
    ctx.strokeStyle=i?"rgba(255,157,122,.5)":"rgba(255,107,87,.92)";ctx.lineWidth=i?1:1.4;
    ctx.beginPath();
    for(const c of [[-1,-1],[1,-1],[1,1],[-1,1]]){
      ctx.moveTo(x+c[0]*r,y+c[1]*(r-g));ctx.lineTo(x+c[0]*r,y+c[1]*r);ctx.lineTo(x+c[0]*(r-g),y+c[1]*r);
    }
    ctx.stroke();
  });
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
  const pads=(typeof document!=="undefined")&&document.querySelector&&document.querySelector(".pads");
  if(pads&&pads.getBoundingClientRect){
    const r=pads.getBoundingClientRect(),rc=cvs.getBoundingClientRect();
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
  const el=(typeof document!=="undefined")&&document.getElementById&&document.getElementById("prompt");
  let lift=0;
  const foot=helmStickFoot();
  if(el&&el.getBoundingClientRect&&foot.length){
    const r=el.getBoundingClientRect();
    /* мерим ОТ НЕПОДНЯТОГО места: подсказка уже поднята на прошлый lift, и
       без этой поправки следующий кадр увидел бы её чистой и уронил обратно —
       строка бы дрожала под пальцем */
    const base=Math.max(0,HELM.lift),top=r.top+base,bot=r.bottom+base;
    if(r.height>0)for(const f of foot)
      if(f.x+f.r>r.left&&f.x-f.r<r.right&&f.y-f.r<bot&&f.y+f.r>top)
        lift=Math.max(lift,bot-(f.y-f.r)+8);
    /* потолок: подсказка поднимается ровно настолько, чтобы разойтись с
       пальцем, и никогда не уезжает на середину экрана */
    lift=Math.min(lift,Math.round(innerHeight*.22));
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
/* лента: четырёхугольник от центра стика к голове, с расширением */
function helmBandPath(x0,y0,x1,y1,w0,w1){
  const dx=x1-x0,dy=y1-y0,d=Math.hypot(dx,dy)||1,nx=-dy/d,ny=dx/d;
  ctx.beginPath();
  ctx.moveTo(x0+nx*w0*.5,y0+ny*w0*.5);
  ctx.lineTo(x1+nx*w1*.5,y1+ny*w1*.5);
  ctx.lineTo(x1-nx*w1*.5,y1-ny*w1*.5);
  ctx.lineTo(x0-nx*w0*.5,y0-ny*w0*.5);
  ctx.closePath();
}
function helmDrawSticks(){
  const one=(s,fade)=>{
    const q=helmStickShape(s),a=fade?s.f:1,c=G.ctl;
    const slow=!!(c&&c.slow)&&!fade;
    /* бирюза приборов на ходу, янтарь на торможении — те же два тона, что у
       фишек компаса и у скобок захвата: лента не заводит третьего цвета */
    const col=slow?"255,178,122":"127,230,216";
    ctx.save();ctx.lineCap="round";ctx.lineJoin="round";
    if(q.live){
      const L=q.r;
      const hx=q.x0+Math.cos(q.ang)*L,hy=q.y0+Math.sin(q.ang)*L;
      const w1=HELM_BAND0+HELM_BAND*q.k;
      /* тело — ЗАДАННЫЙ ход */
      ctx.globalAlpha=(.18+.12*q.k)*a;ctx.fillStyle="rgb("+col+")";
      helmBandPath(q.x0,q.y0,hx,hy,HELM_BAND0,w1);ctx.fill();
      /* тёмный кант: без него лента тонет в светлой туманности */
      ctx.globalAlpha=.3*a;ctx.strokeStyle="rgba(6,10,14,.9)";ctx.lineWidth=1.2;
      helmBandPath(q.x0,q.y0,hx,hy,HELM_BAND0,w1);ctx.stroke();
      /* заливка — ФАКТИЧЕСКИЙ: докуда корабль уже разогнался вдоль ленты */
      const f=c?clamp(c.vp/Math.max(q.k,.08),0,1):0;
      if(f>.02){
        const fx=q.x0+(hx-q.x0)*f,fy=q.y0+(hy-q.y0)*f;
        ctx.globalAlpha=.44*a;ctx.fillStyle="rgb("+col+")";
        helmBandPath(q.x0,q.y0,fx,fy,HELM_BAND0,HELM_BAND0+(w1-HELM_BAND0)*f);ctx.fill();
      }
      /* голова — шеврон, а не кружок под подушечкой */
      ctx.globalAlpha=.62*a;ctx.strokeStyle="rgb("+col+")";ctx.lineWidth=1.8;
      ctx.beginPath();
      for(const sg of [-1,1]){
        const ax=q.ang+sg*.7;
        ctx.moveTo(hx+Math.cos(ax)*(w1*.5+5),hy+Math.sin(ax)*(w1*.5+5));
        ctx.lineTo(hx+Math.cos(q.ang)*6,hy+Math.sin(q.ang)*6);
      }
      ctx.stroke();
    }else{
      /* мёртвая зона — «СТОП»: кольцо и слово, и кольцо тает вместе с ходом */
      ctx.globalAlpha=.26*a;ctx.strokeStyle="rgb(255,178,122)";ctx.lineWidth=1.4;
      ctx.beginPath();ctx.arc(q.x0,q.y0,HELM_ARC0,0,TAU);ctx.stroke();
      const vk=G.ctl?clamp(G.ctl.vk,0,1):0;
      if(vk>.02){
        ctx.globalAlpha=.4*a;ctx.beginPath();
        ctx.arc(q.x0,q.y0,HELM_ARC0,-Math.PI/2,-Math.PI/2+TAU*vk);ctx.stroke();
      }
      ctx.globalAlpha=.5*a;ctx.fillStyle="rgb(255,178,122)";
      ctx.font="9px ui-monospace,monospace";ctx.textAlign="center";
      ctx.fillText("СТОП",q.x0,q.y0-HELM_ARC0-6);
      ctx.textAlign="left";
    }
    /* тот же вектор — у самого корабля (M422): связь «палец → корабль» должна
       быть видна там, куда игрок смотрит, а не только под большим пальцем */
    if(q.live&&c&&G.viewCX!==undefined&&G.mode==="system"){
      const sx=W/2+(G.ship.x-G.viewCX)*G.zoom,sy=H/2+(G.ship.y-G.viewCY)*G.zoom;
      const L2=18+30*q.k,am=Math.hypot(c.ax,c.ay)||1;
      ctx.globalAlpha=.22*a;ctx.strokeStyle="rgb("+col+")";ctx.lineWidth=1.4;
      ctx.beginPath();ctx.moveTo(sx,sy);
      ctx.lineTo(sx+c.ax/am*L2,sy+c.ay/am*L2);ctx.stroke();
    }
    /* хвост за пальцем: полоска не появляется из ниоткуда, она пришла оттуда */
    if(!fade&&HELM.trail.length>1){
      ctx.strokeStyle="rgb("+col+")";
      for(let i=1;i<HELM.trail.length;i++){
        ctx.globalAlpha=.05+.10*(i/HELM.trail.length)*a;
        ctx.lineWidth=1+3*(i/HELM.trail.length);
        ctx.beginPath();ctx.moveTo(HELM.trail[i-1].x,HELM.trail[i-1].y);
        ctx.lineTo(HELM.trail[i].x,HELM.trail[i].y);ctx.stroke();
      }
    }
    ctx.globalAlpha=.13*a;ctx.fillStyle="rgb("+col+")";
    ctx.beginPath();ctx.arc(q.x0,q.y0,1.8,0,TAU);ctx.fill();
    ctx.globalAlpha=.28*a;
    ctx.beginPath();ctx.arc(s.x,s.y,3.2,0,TAU);ctx.fill();
    ctx.restore();
  };
  const live=HELM.S,fade=HELM.fade;
  if(live)one(live,false);
  else if(fade){one(fade,true);fade.f-=.08;if(fade.f<=0)HELM.fade=null;}
  else if(typeof document!=="undefined"&&document.body&&document.body.classList&&
          document.body.classList.contains("mobile")){
    /* точка покоя: бледное кольцо мёртвой зоны и точка. Сказать «стик здесь»
       и не спорить с миром за глаз — те же .1…2, что у самого следа */
    const h=helmHome();
    ctx.save();ctx.strokeStyle="#cfe6ea";ctx.fillStyle="#cfe6ea";ctx.lineWidth=1;
    ctx.globalAlpha=.16;ctx.beginPath();ctx.arc(h.x,h.y,HELM_ARC0,0,TAU);ctx.stroke();
    ctx.globalAlpha=.3;ctx.beginPath();ctx.arc(h.x,h.y,2.2,0,TAU);ctx.fill();
    ctx.restore();
  }
}
