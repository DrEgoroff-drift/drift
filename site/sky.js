/* ДРЕЙФ — фон сайта. Не заставка, а тот же мир: canvas 2D и та же палитра.
 *
 * Четыре слоя с разной скоростью — глубина читается параллаксом, а не размытием.
 * Дорогое печётся один раз в отдельные канвы, в кадре не создаётся ни одного
 * градиента: на телефоне это стоит десятые доли миллисекунды.
 *
 * Планеты — настоящие: их печёт planets.js тем же генератором, что и игра,
 * сферическим отображением фрактального шума. Вращение непрерывное: развёртка
 * поверхности печётся один раз и разворачивается на шар прямо в кадре.
 *
 * Правило, которое держит всё: одновременно движется мало. Один гость в кадре,
 * две-три планеты, звёзды почти незаметно. Двадцать движущихся штук — это
 * дешёвый sci-fi шаблон, а нам нужна пустота, в которой что-то живёт.
 */
(function(){
  const cv=document.getElementById("sky");
  if(!cv)return;
  const ctx=cv.getContext("2d",{alpha:false});
  const slow=matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rnd=(a,b)=>a+Math.random()*(b-a);

  let W=0,H=0,DPR=1,neb=null,stars=[],planets=[],guest=null,guestAt=7,t=0,
      scroll=0,mx=0,my=0,px=0,py=0;

  /* ── туманность ──
     Крупные мягкие пятна, наложенные «lighter», плюс тёмные провалы: без них
     края слишком ровные и сразу видно, что это градиенты, а не облако. */
  function bakeNebula(w,h){
    const c=document.createElement("canvas"),s=.5;   // печём вполовину — всё равно размыто
    c.width=Math.max(2,w*s|0); c.height=Math.max(2,h*s|0);
    const g=c.getContext("2d");
    g.fillStyle="#05070c"; g.fillRect(0,0,c.width,c.height);
    g.globalCompositeOperation="lighter";
    const hues=[[70,150,190],[120,90,180],[60,190,170],[150,80,130]];
    for(let i=0;i<20;i++){
      const x=rnd(-.1,1.1)*c.width, y=rnd(-.1,1.1)*c.height,
            r=rnd(.16,.52)*Math.max(c.width,c.height), col=hues[i%hues.length], a=rnd(.06,.15);
      const rg=g.createRadialGradient(x,y,0,x,y,r);
      rg.addColorStop(0,"rgba("+col[0]+","+col[1]+","+col[2]+","+a+")");
      rg.addColorStop(.55,"rgba("+col[0]+","+col[1]+","+col[2]+","+(a*.35)+")");
      rg.addColorStop(1,"rgba(0,0,0,0)");
      g.fillStyle=rg; g.beginPath(); g.arc(x,y,r,0,7); g.fill();
    }
    g.globalCompositeOperation="source-over";
    for(let i=0;i<8;i++){
      const x=rnd(0,1)*c.width, y=rnd(0,1)*c.height, r=rnd(.06,.2)*c.width;
      const rg=g.createRadialGradient(x,y,0,x,y,r);
      rg.addColorStop(0,"rgba(5,7,12,.5)"); rg.addColorStop(1,"rgba(5,7,12,0)");
      g.fillStyle=rg; g.beginPath(); g.arc(x,y,r,0,7); g.fill();
    }
    return c;
  }

  /* ── планета ──
     Тело берётся у игры (planets.js — тот же генератор, что в src/07-planet.js),
     поэтому на сайте висят настоящие миры, а не «что-то круглое с полосками».
     Здесь остаётся только атмосферный ободок поверх диска: в игре его рисует
     система, а не текстура. */
  function bakeGlow(size,col){
    const c=document.createElement("canvas"), S=Math.ceil(size*1.5);
    c.width=c.height=S;
    const g=c.getContext("2d"), r=size/2;
    const rg=g.createRadialGradient(S/2,S/2,r*.92,S/2,S/2,r*1.34);
    rg.addColorStop(0,"rgba(0,0,0,0)");
    rg.addColorStop(.25,col);
    rg.addColorStop(1,"rgba(0,0,0,0)");
    g.fillStyle=rg; g.beginPath(); g.arc(S/2,S/2,r*1.34,0,7); g.fill();
    return c;
  }

  /* Три планеты, и все разные по глубине, скорости и направлению вращения:
     две крутящиеся в такт читаются как один механизм, а не как два тела. */
  function build(){
    const mob=innerWidth<760;
    neb=bakeNebula(W,H);
    stars=[];
    const n=mob?240:500;
    for(let i=0;i<n;i++){
      const d=i%3;                               // три пласта: 1 : 2 : 4 по скорости
      stars.push({x:Math.random()*W,y:Math.random()*H,
        s:[.7,1,1.5][d]*(Math.random()<.06?2.1:1),
        v:[.0016,.0045,.012][d], d:d,
        a:[.28,.52,.82][d]*rnd(.7,1), f:Math.random()*7});
    }
    const big=Math.min(W,H);
    /* Размеры считаем от меньшей стороны: иначе на широком экране планета
       вылезает из кадра, а на телефоне превращается в горошину. */
    const spec=[
      {type:"terran", size:big*(mob?.72:.62), x:W*.84,y:H*1.12, vx:-.0030,vy:-.0013,
       spin:.0055, seed:20260822, ring:false, depth:.35, alpha:.34, glow:"rgba(140,205,225,.13)"},
      {type:"crystal",size:big*(mob?.26:.24), x:W*.16,y:H*.30,  vx:.0050, vy:.0018,
       spin:-.013, seed:77713, ring:true, depth:.7, alpha:.52, glow:"rgba(197,138,224,.12)"}
    ];
    if(!mob)spec.push(
      {type:"desert", size:big*.11, x:W*.56,y:H*.14, vx:.0082,vy:.0033,
       spin:.03, seed:4410, ring:false, depth:1, alpha:.66, glow:"rgba(226,178,120,.1)"});

    planets=spec.map(s=>({
      body:makePlanet({type:s.type,size:s.size,seed:s.seed,ring:s.ring}),
      glow:bakeGlow(s.size,s.glow),
      x:s.x,y:s.y,vx:s.vx,vy:s.vy,ss:s.spin,turn:Math.random(),
      size:s.size,depth:s.depth,alpha:s.alpha
    }));
  }

  function resize(){
    DPR=Math.min(devicePixelRatio||1,2);
    W=innerWidth; H=innerHeight;
    /* Вкладка может открыться скрытой — тогда размеры нулевые и печь нечего.
       Ждём по таймеру, а не по кадру: в скрытой вкладке кадры не идут вовсе. */
    if(W<2||H<2){setTimeout(resize,120);return;}
    cv.width=W*DPR|0; cv.height=H*DPR|0;
    cv.style.width=W+"px"; cv.style.height=H+"px";
    ctx.setTransform(DPR,0,0,DPR,0,0);
    build();
  }

  /* ── гость ──
     Раз в 18–34 секунды поперёк кадра проходит один силуэт. Именно один:
     двое одновременно — это парад, а нам нужна пустота. */
  function newGuest(){
    const kind=Math.random()<.45?"barge":"scout", dir=Math.random()<.5?1:-1;
    return{kind,dir,x:dir>0?-90:W+90,y:rnd(H*.14,H*.78),
      v:dir*(kind==="barge"?rnd(13,20):rnd(44,68)),
      sc:kind==="barge"?rnd(1,1.5):rnd(.6,.9),trail:[]};
  }
  function drawGuest(g,dt){
    g.x+=g.v*dt;
    g.trail.push(g.x,g.y);
    if(g.trail.length>34)g.trail.splice(0,2);
    const s=g.sc;
    if(g.kind==="scout"){
      for(let i=0;i<g.trail.length-2;i+=2){       // след двигателя гаснет градиентом
        ctx.fillStyle="rgba(242,178,92,"+((i/g.trail.length)*.26)+")";
        ctx.fillRect(g.trail[i],g.trail[i+1]-.5,2,1.3*s);
      }
    }
    ctx.save(); ctx.translate(g.x,g.y); ctx.scale(g.dir*s,s);
    if(g.kind==="scout"){
      ctx.fillStyle="rgba(190,215,225,.6)";
      ctx.beginPath(); ctx.moveTo(9,0); ctx.lineTo(-5,3.4); ctx.lineTo(-3,0);
      ctx.lineTo(-5,-3.4); ctx.closePath(); ctx.fill();
      ctx.fillStyle="rgba(242,178,92,.85)"; ctx.fillRect(-6,-.7,2.4,1.4);
    }else{
      ctx.fillStyle="rgba(120,140,155,.42)";     // баржа: длинный тупой корпус
      ctx.fillRect(-13,-3,26,6);
      ctx.fillStyle="rgba(150,170,185,.48)"; ctx.fillRect(9,-4.4,5,8.8);
      ctx.fillStyle="rgba(127,230,216,.7)";  ctx.fillRect(-2,-4.6,1.6,1.6);
      ctx.fillStyle="rgba(255,120,90,.65)";  ctx.fillRect(-13.5,-1,1.6,2);
    }
    ctx.restore();
    return g.x>-140&&g.x<W+140;
  }

  let last=0,slowFrames=0,dead=false;
  function frame(now){
    if(dead)return;
    if(!neb){requestAnimationFrame(frame);return;}
    const dt=Math.min(.05,(now-last)/1000)||0; last=now; t+=dt;

    /* Сторож производительности: если машина не тянет две секунды подряд,
       движение выключается. Статичный красивый кадр честнее дёргающегося. */
    if(dt>.055)slowFrames++; else slowFrames=Math.max(0,slowFrames-1);
    if(slowFrames>110){dead=true;}

    px+=(mx-px)*.045; py+=(my-py)*.045;          // параллакс от мыши, с инерцией
    const dim=Math.min(.5,scroll/(H*1.3)*.5);

    ctx.setTransform(DPR,0,0,DPR,0,0);
    ctx.fillStyle="#05070c"; ctx.fillRect(0,0,W,H);

    ctx.globalAlpha=(.86+Math.sin(t*.29)*.08)*(1-dim);
    ctx.drawImage(neb,px*6,-scroll*.02+py*5,W,H);
    ctx.globalAlpha=1;

    /* Цвет у всех звёзд один и тот же, а присваивался он пятьсот раз за кадр:
       холст на каждое присваивание разбирает строку CSS-цвета заново. Выносим
       наружу — внутри остаётся только прозрачность, а это число. */
    ctx.fillStyle="#dfeef5";
    const dimK=1-dim*.8;
    for(const s of stars){                        // мерцание размером, не яркостью
      s.x-=s.v*W*dt*.96;
      if(s.x<-2)s.x=W+2;
      const tw=1+Math.sin(t*1.6+s.f)*.2;
      const y=((s.y-scroll*s.v*9)%H+H)%H;
      ctx.globalAlpha=s.a*dimK;
      ctx.fillRect(s.x+px*(4+s.d*7),y+py*(3+s.d*5),s.s*tw,s.s*tw);
    }

    ctx.globalAlpha=1-dim;
    for(const P of planets){
      P.x+=P.vx*dt*60; P.y+=P.vy*dt*60; P.turn+=P.ss*dt;
      const w=P.size;
      if(P.x<-w)P.x=W+w; if(P.x>W+w)P.x=-w;
      if(P.y<-w)P.y=H+w; if(P.y>H+w)P.y=-w;
      const dx=P.x+px*(10+P.depth*26), dy=P.y-scroll*(.04+P.depth*.05)+py*(8+P.depth*20);
      /* Фон обязан оставаться фоном: планета красивая, но текст важнее,
         поэтому каждая гасится по своей глубине, а не только виньеткой. */
      const al=ctx.globalAlpha;
      ctx.globalAlpha=al*P.alpha;
      ctx.drawImage(P.glow,dx-P.glow.width/2,dy-P.glow.height/2);
      P.body.draw(ctx,dx,dy,P.turn);
      ctx.globalAlpha=al;
    }

    guestAt-=dt;
    if(!guest&&guestAt<=0)guest=newGuest();
    if(guest&&!drawGuest(guest,dt)){guest=null;guestAt=rnd(18,34)}
    ctx.globalAlpha=1;

    requestAnimationFrame(frame);
  }

  /* «меньше движения» — один кадр и тишина */
  function still(){
    if(!neb){requestAnimationFrame(still);return;}
    ctx.fillStyle="#05070c"; ctx.fillRect(0,0,W,H);
    ctx.drawImage(neb,0,0,W,H);
    for(const s of stars){ctx.globalAlpha=s.a;ctx.fillStyle="#dfeef5";
      ctx.fillRect(s.x,s.y,s.s,s.s)}
    ctx.globalAlpha=1;
    for(const P of planets){ctx.globalAlpha=P.alpha;
      ctx.drawImage(P.glow,P.x-P.glow.width/2,P.y-P.glow.height/2);
      P.body.draw(ctx,P.x,P.y,P.turn);ctx.globalAlpha=1;}
  }

  addEventListener("resize",()=>{clearTimeout(window._rt);
    window._rt=setTimeout(resize,180)},{passive:true});
  addEventListener("scroll",()=>{scroll=scrollY||0},{passive:true});
  addEventListener("mousemove",e=>{                // −1…1 от центра
    mx=(e.clientX/innerWidth-.5)*2; my=(e.clientY/innerHeight-.5)*2;
  },{passive:true});

  /* Отладочный крючок: только на локальном стенде. Нужен, чтобы фон можно было
     снять и посмотреть — в скрытой вкладке кадры не идут, и проверить глазами
     иначе нечем. На сайте его нет. */
  if(location.hostname==="localhost")window._sky={frame,still,planets:()=>planets};

  resize();
  requestAnimationFrame(slow?still:frame);
})();
