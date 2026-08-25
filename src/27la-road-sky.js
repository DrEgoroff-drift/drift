/* ══════════════ дорожный спутник: небо ══════════════
   Задник дорожного экрана, отделён от 27l-road-draw на M168k: файл перешёл
   сорок килобайт, а шов тут естественный — небо не знает ни о корпусе, ни о
   шлейфе, ни о числах, и берёт снаружи только меры кадра.

   Три слоя от дальнего к ближнему: туманности настроения, звёздный поток,
   попутчики по сектору. Плюс то, что рождает музыка: искры на битах и белые
   импульсы касания. Всё живёт на RD и на шкале хода `fast`. */
function roadSky(c,W,H,t,dt,spd,tier,fast,hue,en){
  const ease=tau=>1-Math.exp(-dt/tau);
  /* небо */
  const g=c.createLinearGradient(0,0,0,H);
  g.addColorStop(0,"#04060c");g.addColorStop(.65,"#080d18");g.addColorStop(1,"#060a12");
  c.fillStyle=g;c.fillRect(0,0,W,H);
  /* туманности: три мягких пятна, дышат энергией, цвет — настроение музыки.
     Складываются светом (lighter) и сидят некрупно в верхних двух третях —
     ровная заливка на весь экран убивала космос (проход самокритики M168b).
     Подняты (M168g): на прежних .07 кадр был пустой чернотой, особенно на стоянке */
  c.save();c.globalCompositeOperation="lighter";
  for(let i=0;i<3;i++){
    const bx=W*(.16+.34*i)+Math.sin(t*.05+i*2.1)*W*.06;
    const by=H*(.16+.14*Math.sin(t*.04+i*1.7))+i*H*.12;
    const rad=(H*.16+H*.06*Math.sin(t*.09+i))*(1+en*.9);
    const ng=c.createRadialGradient(bx,by,0,bx,by,rad);
    const a=(.13+en*.36)*(1-i*.16);
    /* тона разведены по кругу, а не сдвинуты на 42°: три соседних оттенка
       одного семейства складывались в одну заливку, и небо получалось
       одноцветным даже при верном тоне (автор: «хочется богатую палитру») */
    const nh=(hue+ROAD_SKY_H[i]+360)%360,ns=ROAD_SKY_S[i];
    ng.addColorStop(0,"hsla("+nh+","+ns+"%,"+(40+RD.bright*20)+"%,"+a.toFixed(3)+")");
    ng.addColorStop(.6,"hsla("+nh+","+ns+"%,34%,"+(a*.4).toFixed(3)+")");
    ng.addColorStop(1,"hsla("+nh+","+ns+"%,30%,0)");
    c.fillStyle=ng;c.fillRect(bx-rad,by-rad,rad*2,rad*2);
  }
  c.restore();
  /* корабль летит ВВЕРХ (портретный экран — дорога впереди): звёзды текут
     вниз; на экспрессе тянутся вдвое, бит рождает новые.
     У каждой звезды СВОИ размер, длина и яркость (M168g): прежде все были
     одинаковы — поток читался ровным дождём. Мелких много, жирных единицы
     (куб от ровного), одна из восьми — тёплая или в цвет настроения. */
  const r=rng(0x50AD);
  const streak=tier===2?2.2:tier===3?4:1;
  const nst=tier===3?190:tier===2?150:110;
  /* Ход, а не мигание (M168k, слова автора). Мерцание — приём для СТОЯНКИ: на
     ходу скорость берётся из вытянутости следа и из потока, а синус по альфе
     поверх этого читается гирляндой. Амплитуда гаснет к половине шкалы хода,
     росчерк и поток подняты — городские 35 км/ч давали три пикселя. */
  const tw=.18*clamp(1-fast*2,0,1);
  const glint=clamp((.30-fast)/.14,0,1);   /* крестик-блик гаснет плавно: жёсткий порог мигал на каждом светофоре */
  for(let i=0;i<nst;i++){
    const depth=.25+r()*.75,x=r()*W;
    const q=r(),sz=.7+q*q*q*2.2;
    const own=.5+r()*1.3;
    const warm=r()<.125;
    const y=(r()*H+t*(28+Math.min(spd,300)*7)*depth)%H;
    const bri=clamp((.30+depth*.62)*(.62+sz*.30)*(1-tw+tw*Math.sin(t*2.3+i*1.7)),0,1);
    c.globalAlpha=bri;
    c.fillStyle=warm?"hsla("+hue+",60%,86%,1)":depth>.8?"#eef7fc":"#a8bccb";
    /* крупная звезда получает крестик-блик: без него и яркая точка тонет */
    if(sz>2.3&&depth>.7&&glint>0){
      c.globalAlpha=bri*glint;
      const yv=((y%H)+H)%H;c.fillRect(x-sz,yv+sz*.5-.5,sz*3,1);
      c.globalAlpha=bri;
    }
    c.fillRect(x,((y%H)+H)%H,sz,sz+fast*30*depth*streak*own);
  }
  /* дальняя пыль: почти неподвижна — от неё берётся глубина, а не скорость */
  for(let i=0;i<60;i++){
    const depth=.05+r()*.15,x=r()*W;
    const y=(r()*H+t*(6+Math.min(spd,300)*1.2)*depth)%H;
    c.globalAlpha=.10+depth*.5;
    c.fillStyle="#5c6b7a";
    c.fillRect(x,((y%H)+H)%H,1,1);
  }
  c.globalAlpha=1;
  /* гипердрайв (самолёт): звёздный тоннель — росчерки сходятся в точку по
     курсу (над кораблём), и корпус идёт в световом коконе */
  if(tier===3){
    const vx=W*.5,vy=H*.2;
    c.save();c.globalCompositeOperation="lighter";
    const wr=rng(0x3A9F);
    for(let i=0;i<46;i++){
      const a2=wr()*TAU,rr0=(60+wr()*Math.max(W,H))*(1+((t*1.6+wr())%1));
      const x0=vx+Math.cos(a2)*rr0*.8,y0=vy+Math.sin(a2)*rr0;
      const k2=.72;
      c.strokeStyle="hsla("+hue+",70%,80%,"+(.05+fast*.12).toFixed(3)+")";
      c.lineWidth=1+wr()*1.4;
      c.beginPath();c.moveTo(x0,y0);c.lineTo(vx+(x0-vx)*k2,vy+(y0-vy)*k2);c.stroke();
    }
    c.restore();
  }
  /* пилоты рядом (M168f): кто сейчас едет по этому же сектору — далёкие
     попутные корабли: искра с выхлопом, своя глубина и свой дрейф. Рисунок
     детерминирован сектором, у всех в клетке одна картина; появляются и
     тают плавно, чтобы смена счёта не мигала. */
  RD.matesShow=(RD.matesShow||0)+(Math.min(RD.mates||0,5)-(RD.matesShow||0))*ease(.83);
  if(RD.matesShow>.05&&RD.sys){
    c.save();c.globalCompositeOperation="lighter";
    const pr=rng(hashi(RD.sys.cx,RD.sys.cy,0x9110));
    const n=Math.ceil(RD.matesShow);
    for(let i=0;i<n;i++){
      const depth=.35+pr()*.45,bx=W*(.1+pr()*.8),ph=pr()*TAU,spdK=.004+pr()*.006;
      const fr=(ph/TAU+t*spdK*(1.2-depth))%1;
      const x=bx+Math.sin(t*.13+ph)*W*.05*depth;
      const y=H*(.12+.6*fr);
      const vis=Math.sin(Math.PI*fr)*clamp(RD.matesShow-i,0,1);
      if(vis<=0)continue;
      const s=.9+depth*1.4;
      c.globalAlpha=vis*.85;
      c.fillStyle="hsla("+hue+",60%,88%,1)";
      c.fillRect(x-1.1*s,y-2.6*s,2.2*s,5.2*s);
      const tg=c.createLinearGradient(x,y+2*s,x,y+2*s+16*s);
      tg.addColorStop(0,"hsla("+hue+",80%,70%,.5)");tg.addColorStop(1,"hsla("+hue+",80%,70%,0)");
      c.fillStyle=tg;c.fillRect(x-.8*s,y+2*s,1.6*s,16*s);
    }
    c.globalAlpha=1;c.restore();
  }
  if(RD.beat>.6&&RD.sparks.length<24)
    RD.sparks.push({x:W*(.1+Math.random()*.8),y:-20,v:2+Math.random()*3+fast*6,life:1,big:Math.random()<.2});
  for(let i=RD.sparks.length-1;i>=0;i--){
    const s=RD.sparks[i];
    s.y+=s.v*(H/700)*60*dt;s.life-=.24*dt;
    if(s.y>H+30||s.life<=0){RD.sparks.splice(i,1);continue;}
    c.globalAlpha=s.life*.9;
    c.fillStyle="hsla("+hue+",80%,80%,1)";
    if(s.big){
      c.save();c.translate(s.x,s.y);
      for(let k=0;k<4;k++){c.rotate(Math.PI/4);c.fillRect(-5,-.8,10,1.6);}
      c.restore();
    }else c.fillRect(s.x,s.y,1.4,4+s.v);
  }
  c.globalAlpha=1;
  /* касание — вспышка, как у «Волны»: местное свечение в тон настроения,
     затухающее по экспоненте, и тонкое кольцо по фронту. Прежде было одно
     кольцо: чертёж, а не свет (M168k) */
  c.save();c.globalCompositeOperation="lighter";
  for(let i=RD.pulses.length-1;i>=0;i--){
    const p=RD.pulses[i];p.r+=W*.012*60*dt;p.a*=Math.exp(-dt/.27);
    if(p.a<.02){RD.pulses.splice(i,1);continue;}
    const R=p.r+W*.10;
    const fg2=c.createRadialGradient(p.x,p.y,0,p.x,p.y,R);
    fg2.addColorStop(0,"hsla("+hue+",90%,72%,"+(p.a*.85).toFixed(3)+")");
    fg2.addColorStop(.45,"hsla("+hue+",92%,58%,"+(p.a*.30).toFixed(3)+")");
    fg2.addColorStop(1,"hsla("+hue+",90%,52%,0)");
    c.fillStyle=fg2;c.fillRect(p.x-R,p.y-R,R*2,R*2);
    c.strokeStyle="rgba(255,255,255,"+(p.a*.45).toFixed(3)+")";c.lineWidth=1.5;
    c.beginPath();c.arc(p.x,p.y,p.r,0,TAU);c.stroke();
  }
  c.restore();
}
