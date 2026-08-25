/* ══════════════ посёлок: промыслы ══════════════
   Отрезано от `12tb-settle-draw` 25.08.2026: файл дорос до 57 КБ, а внутри у
   него был готовый шов. Здесь шесть производств, каждое — самостоятельное тело
   со своим ремеслом: поле, запруда, обжиг, пилка, кузня, перегонка. Рисуются
   из `sdYard` (12tb) по ключу двора; кисти, палитра и мерка человека — оттуда
   же, это одна семья функций, просто в двух файлах.

   ПРАВИЛА ТЕ ЖЕ, что у 12tb: мерило — рост жителя (SD_MAN), сначала тело и
   обвод, потом материал, свет один на всю улицу. */
function sdField(x,y,w,h,pal,seed,wind){
  const r=rng(hashi(seed,3,0x1E1D));
  /* Гряды в два пикселя высотой терялись на улице (самокритика M169): поле
     теперь выше человека по ботве, с бортиками, шпалерой и своей межой. */
  ctx.fillStyle=sdRGB(sdMix(pal.earth,[0,0,0],.26));
  ctx.fillRect(x-w*.55,y-4,w*1.1,4);
  for(let i=0;i<4;i++){
    const yy=y-i*3.4, ww=w*(1.05-i*.07);
    ctx.fillStyle=sdRGB(sdMix(pal.earth,[0,0,0],.14+i*.06));
    ctx.fillRect(x-ww/2,yy-3.4,ww,3.4);
    ctx.fillStyle=sdRGB(sdMix(pal.earth,[214,198,152],.34));
    ctx.fillRect(x-ww/2,yy-3.4,ww,1);
    const green="rgba("+(96+i*10)+","+(158+i*8)+","+(78+i*6)+",.8)";
    ctx.strokeStyle=green;ctx.lineWidth=1.2;
    for(let k=0;k<10;k++){
      const px=x-ww/2+ww*(k+.5)/10, hh=h*(.5+r()*.5);
      ctx.beginPath();ctx.moveTo(px,yy-3.4);
      ctx.quadraticCurveTo(px+wind*2,yy-hh*.6,px+wind*4.5,yy-hh);ctx.stroke();
      if(r()<.35){                                   /* завязь: поле не только ботва */
        ctx.fillStyle="rgba(214,182,86,.75)";
        ctx.beginPath();ctx.arc(px+wind*3.4,yy-hh*.72,1.5,0,TAU);ctx.fill();
      }
    }
  }
  /* жерди с подвязкой и пугало: силуэт, который виден издали */
  ctx.strokeStyle=sdRGB(sdMix(pal.wood,[0,0,0],.25));ctx.lineWidth=1.4;
  for(let i=0;i<3;i++){
    const px=x-w*.35+w*.35*i;
    ctx.beginPath();ctx.moveTo(px,y);ctx.lineTo(px+wind,y-h*.9);ctx.stroke();
  }
  const sx2=x+w*.38;
  ctx.beginPath();ctx.moveTo(sx2,y);ctx.lineTo(sx2,y-h*1.5);ctx.stroke();
  ctx.beginPath();ctx.moveTo(sx2-5,y-h*1.15);ctx.lineTo(sx2+5,y-h*1.15);ctx.stroke();
  ctx.fillStyle=sdRGB(sdMix(pal.wall,[0,0,0],.15));
  ctx.beginPath();ctx.arc(sx2,y-h*1.55,3,0,TAU);ctx.fill();
  ctx.fillStyle="rgba(0,0,0,.3)";
  ctx.beginPath();ctx.moveTo(sx2-4.5,y-h*1.62);ctx.lineTo(sx2+4.5,y-h*1.62);
  ctx.lineTo(sx2,y-h*1.78);ctx.closePath();ctx.fill();
}
function sdWeir(x,y,w,h,pal,seed){
  /* Запруда — не голубая коробка (первый проход давал именно её), а ПЛОТИНА:
     каменная гряда поперёк ручья, вода стоит за ней и переливается через
     гребень, ниже — сток и мокрые камни. Узнаётся по воде и по струе. */
  const r=rng(hashi(seed,9,0x3E11));
  sdShadow(x,y,w,h);
  /* пруд за гребнем: тёмная вода с бликами, уходит вверх по склону */
  const pond=ctx.createLinearGradient(0,y-h-14,0,y-h+2);
  pond.addColorStop(0,"rgba(40,74,86,.9)");
  pond.addColorStop(.7,"rgba(64,110,120,.85)");
  pond.addColorStop(1,"rgba(120,168,170,.8)");
  ctx.fillStyle=pond;
  ctx.beginPath();
  ctx.moveTo(x-w*.55,y-h+1);ctx.lineTo(x-w*.62,y-h-13);
  ctx.lineTo(x+w*.30,y-h-13);ctx.lineTo(x+w*.34,y-h+1);ctx.closePath();ctx.fill();
  ctx.fillStyle="rgba(226,248,255,.30)";                    /* рябь: короткие блики */
  for(let i=0;i<7;i++){
    const t=((G.t*.3+i*23)%90)/90;
    ctx.fillRect(x-w*.5+t*w*.8,y-h-11+i*1.6,5+r()*4,1);
  }
  /* тело плотины */
  sdBody(()=>{
    ctx.moveTo(x-w/2,y);ctx.lineTo(x-w*.30,y-h);
    ctx.lineTo(x+w*.24,y-h);ctx.lineTo(x+w*.44,y);ctx.closePath();
  },sdRGB(pal.stone),null,.26);
  ctx.save();ctx.beginPath();
  ctx.moveTo(x-w/2,y);ctx.lineTo(x-w*.30,y-h);ctx.lineTo(x+w*.24,y-h);ctx.lineTo(x+w*.44,y);
  ctx.closePath();ctx.clip();
  for(let yy=y-2;yy>y-h;yy-=4.5)for(let xx=x-w/2;xx<x+w/2;xx+=6+r()*3){
    ctx.fillStyle=sdRGB(sdMix(pal.stone,[0,0,0],.14+r()*.22));
    ctx.fillRect(xx,yy-4,5+r()*3,4);
    ctx.fillStyle="rgba(255,246,220,.12)";ctx.fillRect(xx,yy-4,5+r()*3,1);
  }
  const lg=ctx.createLinearGradient(x-w/2,0,x+w/2,0);
  lg.addColorStop(0,"rgba(0,0,0,.34)");lg.addColorStop(1,"rgba(255,240,210,.16)");
  ctx.fillStyle=lg;ctx.fillRect(x-w/2,y-h,w,h);
  ctx.restore();
  /* перелив через гребень и струя вниз: главное, что делает плотину плотиной */
  ctx.fillStyle="rgba(206,238,246,.75)";
  ctx.fillRect(x-w*.04,y-h-1,w*.16,2.4);
  const jet=ctx.createLinearGradient(0,y-h,0,y);
  jet.addColorStop(0,"rgba(214,242,248,.75)");jet.addColorStop(1,"rgba(180,220,232,.25)");
  ctx.fillStyle=jet;
  ctx.beginPath();
  ctx.moveTo(x-w*.03,y-h);ctx.lineTo(x+w*.13,y-h);
  ctx.lineTo(x+w*.19,y);ctx.lineTo(x-w*.09,y);ctx.closePath();ctx.fill();
  /* брызги у подножия */
  ctx.fillStyle="rgba(226,246,252,.35)";
  for(let i=0;i<5;i++){
    const t=((G.t*.8+i*17)%30)/30;
    ctx.beginPath();ctx.arc(x+w*.05+(r()-.5)*10,y-t*5,1.6+t*2.4,0,TAU);ctx.fill();
  }
  /* мостки и вёдра: к воде ходят */
  ctx.strokeStyle=sdRGB(sdMix(pal.wood,[0,0,0],.3));ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(x-w*.42,y-h*.42);ctx.lineTo(x+w*.02,y-h*.42);ctx.stroke();
  ctx.fillStyle=sdRGB(sdMix(pal.wood,[0,0,0],.15));
  ctx.fillRect(x-w*.36,y-h*.42-4,4,4);
}
function sdKiln(x,y,w,h,pal,seed,warm){
  sdShadow(x,y,w,h);
  /* купол с аркой топки — узнаётся силуэтом */
  sdBody(()=>{
    ctx.moveTo(x-w/2,y);
    ctx.quadraticCurveTo(x-w/2,y-h*1.25,x,y-h*1.25);
    ctx.quadraticCurveTo(x+w/2,y-h*1.25,x+w/2,y);
    ctx.closePath();
  },sdRGB(sdMix(pal.stone,[110,86,64],.4)),null,.26);
  const g=ctx.createLinearGradient(x-w/2,0,x+w/2,0);
  g.addColorStop(0,"rgba(0,0,0,.34)");g.addColorStop(1,"rgba(255,236,200,.20)");
  ctx.save();ctx.beginPath();
  ctx.moveTo(x-w/2,y);ctx.quadraticCurveTo(x-w/2,y-h*1.25,x,y-h*1.25);
  ctx.quadraticCurveTo(x+w/2,y-h*1.25,x+w/2,y);ctx.closePath();ctx.clip();
  ctx.fillStyle=g;ctx.fillRect(x-w/2,y-h*1.3,w,h*1.3);
  ctx.strokeStyle="rgba(0,0,0,.18)";ctx.lineWidth=1;
  for(let yy=y-3;yy>y-h*1.2;yy-=4){ctx.beginPath();ctx.moveTo(x-w/2,yy);ctx.lineTo(x+w/2,yy);ctx.stroke();}
  ctx.restore();
  /* топка: арка, а в ней жар */
  const fw=w*.34,fh=h*.44;
  ctx.fillStyle="rgba(12,10,10,.9)";
  ctx.beginPath();
  ctx.moveTo(x-fw/2,y);ctx.lineTo(x-fw/2,y-fh*.6);
  ctx.quadraticCurveTo(x,y-fh*1.25,x+fw/2,y-fh*.6);ctx.lineTo(x+fw/2,y);ctx.closePath();ctx.fill();
  if(warm){
    const fg=ctx.createRadialGradient(x,y-fh*.4,0,x,y-fh*.4,fw);
    const pulse=.7+.3*Math.sin(G.t*.06+seed);
    fg.addColorStop(0,"rgba(255,190,90,"+(.85*pulse).toFixed(2)+")");
    fg.addColorStop(1,"rgba(255,120,40,0)");
    ctx.fillStyle=fg;ctx.beginPath();ctx.arc(x,y-fh*.4,fw,0,TAU);ctx.fill();
  }
  /* поленница и зола рядом — печь работает, а не стоит памятником */
  ctx.fillStyle=sdRGB(sdMix(pal.wood,[0,0,0],.25));
  ctx.fillRect(x+w*.55,y-h*.5,w*.3,h*.5);
  ctx.fillStyle="rgba(160,150,140,.35)";
  ctx.beginPath();ctx.ellipse(x-w*.62,y-1,w*.24,2.4,0,0,TAU);ctx.fill();
}
function sdCut(x,y,w,h,pal,seed){
  const r=rng(hashi(seed,13,0x0C17));
  sdShadow(x,y,w,h);
  /* штабель плит: главный силуэт камнерезки */
  let sy=y;
  for(let i=0;i<4;i++){
    const sw=w*(.62-i*.07),sh=h*.17;
    ctx.fillStyle=sdRGB(sdMix(pal.stone,[0,0,0],.10+i*.04));
    ctx.fillRect(x-sw/2+(r()-.5)*3,sy-sh,sw,sh);
    ctx.fillStyle="rgba(255,246,226,.16)";
    ctx.fillRect(x-sw/2+(r()-.5)*3,sy-sh,sw,1);
    sy-=sh;
  }
  /* козлы с плитой на распиле и рама пилы */
  const gx=x+w*.5,gy=y;
  ctx.strokeStyle=sdRGB(sdMix(pal.wood,[0,0,0],.3));ctx.lineWidth=1.6;
  for(const s of [-1,1]){
    ctx.beginPath();ctx.moveTo(gx+s*5,gy);ctx.lineTo(gx+s*1.5,gy-h*.44);ctx.stroke();
  }
  ctx.fillStyle=sdRGB(sdMix(pal.stone,[220,220,214],.3));
  ctx.fillRect(gx-w*.2,gy-h*.5,w*.4,h*.08);
  ctx.strokeStyle="rgba(226,236,240,.4)";ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(gx-w*.18,gy-h*.56);ctx.lineTo(gx+w*.18,gy-h*.56);ctx.stroke();
  /* каменная пыль под козлами */
  ctx.fillStyle="rgba(226,222,210,.22)";
  ctx.beginPath();ctx.ellipse(gx,gy-1,w*.24,2.2,0,0,TAU);ctx.fill();
}
function sdForge(x,y,w,h,pal,seed,warm){
  /* Кузня — не телега под навесом (так вышло в первом проходе): открытый
     сруб в три четверти стены, высокий горн с вытяжкой, наковальня в рост
     колена и кузнец, если работает. Её узнают по свету изнутри. */
  sdShadow(x,y,w,h);
  const ph=h*.80,pw=2.6;
  /* задняя стена — сначала, чтобы столбы и горн встали перед ней */
  ctx.fillStyle=sdRGB(sdMix(pal.wall,[0,0,0],.42));
  ctx.fillRect(x-w*.44,y-ph*.92,w*.88,ph*.92);
  sdWallTex(x-w*.44,y-ph*.92,w*.88,ph*.92,"plank",seed,pal.wall);
  ctx.fillStyle="rgba(0,0,0,.28)";ctx.fillRect(x-w*.44,y-ph*.92,w*.88,ph*.92);
  ctx.fillStyle=sdRGB(sdMix(pal.wood,[0,0,0],.34));
  ctx.fillRect(x-w/2,y-ph,pw,ph);ctx.fillRect(x+w/2-pw,y-ph,pw,ph);
  sdRoof(x-w/2-3,y-ph,w+6,h-ph,"plank",pal,seed);
  /* горн: кладка от земли, устье с жаром, над ним вытяжной колпак и труба */
  const hx=x+w*.14,hh=h*.46;
  ctx.fillStyle=sdRGB(sdMix(pal.stone,[92,72,56],.5));
  ctx.fillRect(hx-w*.18,y-hh,w*.36,hh);
  ctx.fillStyle="rgba(255,246,220,.12)";ctx.fillRect(hx-w*.18,y-hh,w*.36,1.4);
  ctx.fillStyle=sdRGB(sdMix(pal.stone,[40,40,44],.5));
  ctx.beginPath();
  ctx.moveTo(hx-w*.22,y-hh-1);ctx.lineTo(hx+w*.22,y-hh-1);
  ctx.lineTo(hx+w*.09,y-hh-h*.16);ctx.lineTo(hx-w*.09,y-hh-h*.16);ctx.closePath();ctx.fill();
  ctx.fillRect(hx-w*.05,y-hh-h*.34,w*.1,h*.19);
  if(warm){
    const pulse=.65+.35*Math.sin(G.t*.09+seed);
    ctx.fillStyle="rgba(255,180,80,"+(.9*pulse).toFixed(2)+")";
    ctx.fillRect(hx-w*.12,y-hh*.86,w*.24,hh*.3);
    const fg=ctx.createRadialGradient(hx,y-hh*.7,0,hx,y-hh*.7,w*.55);
    fg.addColorStop(0,"rgba(255,196,110,"+(.55*pulse).toFixed(2)+")");
    fg.addColorStop(1,"rgba(255,110,30,0)");
    ctx.save();ctx.globalCompositeOperation="lighter";
    ctx.fillStyle=fg;ctx.beginPath();ctx.arc(hx,y-hh*.7,w*.55,0,TAU);ctx.fill();
    ctx.restore();
    for(let i=0;i<6;i++){                                /* искры от наковальни */
      const t=((G.t*1.6+i*37)%60)/60;
      ctx.fillStyle="rgba(255,214,140,"+((1-t)*.75).toFixed(2)+")";
      ctx.fillRect(x-w*.2+Math.sin(i*2.1+G.t*.05)*7*t,y-h*.3-t*20,1.4,1.4);
    }
  }
  /* наковальня на колоде */
  const ax=x-w*.22;
  ctx.fillStyle=sdRGB(sdMix(pal.wood,[0,0,0],.4));
  ctx.fillRect(ax-4,y-h*.16,8,h*.16);
  ctx.fillStyle=sdRGB(sdMix(pal.stone,[38,42,48],.62));
  ctx.fillRect(ax-3,y-h*.22,6,h*.06);
  ctx.beginPath();
  ctx.moveTo(ax-7,y-h*.28);ctx.lineTo(ax+6,y-h*.28);ctx.lineTo(ax+4,y-h*.22);
  ctx.lineTo(ax-4,y-h*.22);ctx.closePath();ctx.fill();
  ctx.fillStyle="rgba(226,236,240,.28)";ctx.fillRect(ax-7,y-h*.28,13,1);
  /* бочка с водой для закалки и клещи на стене */
  ctx.fillStyle=sdRGB(sdMix(pal.wood,[0,0,0],.28));
  ctx.fillRect(x-w*.44,y-h*.2,w*.14,h*.2);
  ctx.fillStyle="rgba(150,196,206,.5)";ctx.fillRect(x-w*.44+1,y-h*.2+1,w*.14-2,2);
}
function sdStill(x,y,w,h,pal,seed,warm){
  sdShadow(x,y,w,h);
  /* бак с медным отливом */
  sdBody(()=>{
    ctx.moveTo(x-w*.32,y);ctx.lineTo(x-w*.26,y-h*.78);
    ctx.quadraticCurveTo(x,y-h*1.02,x+w*.26,y-h*.78);
    ctx.lineTo(x+w*.32,y);ctx.closePath();
  },sdRGB(sdMix(pal.stone,[168,116,72],.62)),null,.26);
  ctx.save();ctx.beginPath();
  ctx.moveTo(x-w*.32,y);ctx.lineTo(x-w*.26,y-h*.78);
  ctx.quadraticCurveTo(x,y-h*1.02,x+w*.26,y-h*.78);ctx.lineTo(x+w*.32,y);ctx.closePath();ctx.clip();
  const g=ctx.createLinearGradient(x-w*.32,0,x+w*.32,0);
  g.addColorStop(0,"rgba(0,0,0,.35)");g.addColorStop(.62,"rgba(255,226,180,.22)");
  g.addColorStop(1,"rgba(0,0,0,.15)");
  ctx.fillStyle=g;ctx.fillRect(x-w*.4,y-h*1.1,w*.8,h*1.1);
  ctx.strokeStyle="rgba(0,0,0,.25)";ctx.lineWidth=1;
  for(const t of [.3,.6]){ctx.beginPath();ctx.moveTo(x-w*.3,y-h*t);ctx.lineTo(x+w*.3,y-h*t);ctx.stroke();}
  ctx.restore();
  /* змеевик: три витка вниз, к бочке */
  ctx.strokeStyle=sdRGB(sdMix(pal.stone,[190,140,90],.7));ctx.lineWidth=1.6;
  ctx.beginPath();
  ctx.moveTo(x+w*.12,y-h*.95);
  for(let i=0;i<3;i++){
    ctx.quadraticCurveTo(x+w*.55,y-h*(.85-i*.22),x+w*.34,y-h*(.72-i*.22));
    ctx.quadraticCurveTo(x+w*.16,y-h*(.66-i*.22),x+w*.34,y-h*(.58-i*.22));
  }
  ctx.stroke();
  /* бочки: две, одна на боку */
  const bx=x+w*.5;
  ctx.fillStyle=sdRGB(sdMix(pal.wood,[0,0,0],.2));
  ctx.fillRect(bx,y-h*.34,w*.22,h*.34);
  ctx.strokeStyle="rgba(0,0,0,.3)";ctx.lineWidth=1;
  for(const t of [.25,.75]){ctx.beginPath();ctx.moveTo(bx,y-h*.34*t-h*.02);ctx.lineTo(bx+w*.22,y-h*.34*t-h*.02);ctx.stroke();}
  if(warm){                                                 /* капель в подставленную посуду */
    const t=((G.t*.9)%40)/40;
    ctx.fillStyle="rgba(220,236,240,.6)";
    ctx.fillRect(x+w*.34,y-h*.3+t*h*.26,1.2,2.4);
  }
}
/* ── быт между дворами ──
   Верёвка с бельём, бочка, корзины, жерди — то, чего нельзя вывести из
   механики, но без чего посёлок остаётся макетом. */
