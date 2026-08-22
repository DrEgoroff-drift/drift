/* ДРЕЙФ — фон сайта. Не заставка, а тот же мир: canvas 2D и та же палитра.
 *
 * Четыре слоя с разной скоростью — глубина читается параллаксом, а не размытием.
 * Дорогое печётся один раз в отдельные канвы, в кадре не создаётся ни одного
 * градиента: на телефоне это стоит десятые доли миллисекунды.
 *
 * Планета вращается по-настоящему. Тело, полосы облаков и тень пекутся порознь;
 * в кадре полосы едут внутри круглой маски, поэтому оборот виден, а платим мы
 * за него пятью drawImage вместо перерисовки текстуры.
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
    for(let i=0;i<16;i++){
      const x=rnd(-.1,1.1)*c.width, y=rnd(-.1,1.1)*c.height,
            r=rnd(.18,.5)*Math.max(c.width,c.height), col=hues[i%hues.length], a=rnd(.035,.08);
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

  /* ── планета: три отдельные печати ──
     body   — диск с базовым цветом (неподвижен относительно планеты)
     bands  — бесшовная лента облаков шириной вдвое, она и едет
     shade  — терминатор, ободок атмосферы и кольца, рисуется поверх всего */
  function bakePlanet(r,col,ring){
    const p=Math.ceil(r*(ring?2.1:1.35)), size=p*2, cx=p, cy=p;

    const body=document.createElement("canvas"); body.width=body.height=size;
    {
      const g=body.getContext("2d");
      g.save(); g.beginPath(); g.arc(cx,cy,r,0,7); g.clip();
      const lg=g.createLinearGradient(cx-r,cy-r,cx+r,cy+r);
      lg.addColorStop(0,col[0]); lg.addColorStop(1,col[1]);
      g.fillStyle=lg; g.fillRect(cx-r,cy-r,r*2,r*2);
      g.restore();
    }

    /* Лента вдвое шире диска и склеена сама с собой: сдвигая её на её же
       ширину, получаем бесконечное вращение без шва. */
    const bw=Math.ceil(r*2), bh=Math.ceil(r*2);
    const bands=document.createElement("canvas"); bands.width=bw*2; bands.height=bh;
    {
      const g=bands.getContext("2d");
      const rows=[];
      for(let i=0;i<11;i++)rows.push({y:(i+rnd(-.3,.3))*(bh/11),h:bh*rnd(.012,.045),
        a:rnd(.02,.075),w:rnd(.3,1)});
      for(const q of rows)for(let k=0;k<2;k++){
        g.fillStyle="rgba(255,255,255,"+q.a+")";
        const x0=k*bw;
        g.fillRect(x0,q.y,bw*q.w,q.h);
        if(q.w<1)g.fillRect(x0+bw*q.w+bw*.08,q.y,bw*(1-q.w)*.7,q.h);
      }
      /* пятна — чтобы вращение читалось даже на ровных полосах */
      for(let i=0;i<7;i++){
        const x=rnd(0,bw),y=rnd(0,bh),rr=rnd(bh*.03,bh*.09),a=rnd(.02,.06);
        for(let k=0;k<2;k++){
          g.fillStyle="rgba(255,255,255,"+a+")";
          g.beginPath(); g.ellipse(x+k*bw,y,rr*1.9,rr,0,0,7); g.fill();
        }
      }
    }

    const shade=document.createElement("canvas"); shade.width=shade.height=size;
    {
      const g=shade.getContext("2d");
      if(ring){                       // задняя дуга колец уходит за диск
        g.save(); g.translate(cx,cy); g.scale(1,.26); g.rotate(-.2);
        g.strokeStyle="rgba(200,190,215,.14)"; g.lineWidth=r*.30;
        g.beginPath(); g.arc(0,0,r*1.55,Math.PI,2*Math.PI); g.stroke(); g.restore();
      }
      g.save(); g.beginPath(); g.arc(cx,cy,r,0,7); g.clip();
      const term=g.createRadialGradient(cx-r*.4,cy-r*.4,r*.08,cx,cy,r*1.42);
      term.addColorStop(0,"rgba(255,255,255,.09)");
      term.addColorStop(.4,"rgba(0,0,0,0)");
      term.addColorStop(1,"rgba(2,4,8,.93)");     // ночная сторона, край мягкий
      g.fillStyle=term; g.fillRect(cx-r,cy-r,r*2,r*2);
      g.restore();
      g.strokeStyle=col[2]; g.lineWidth=Math.max(1,r*.022);
      g.shadowColor=col[2]; g.shadowBlur=r*.32;   // ободок атмосферы
      g.beginPath(); g.arc(cx,cy,r-g.lineWidth/2,0,7); g.stroke();
      g.shadowBlur=0;
      if(ring){
        g.save(); g.translate(cx,cy); g.scale(1,.26); g.rotate(-.2);
        g.strokeStyle="rgba(215,205,230,.28)"; g.lineWidth=r*.30;
        g.beginPath(); g.arc(0,0,r*1.55,0,Math.PI); g.stroke(); g.restore();
      }
    }
    return {body,bands,shade,r,size,bw,bh};
  }

  function drawPlanet(P,x,y){
    const s=P.spr, h=s.size/2;
    ctx.save();
    ctx.translate(x,y);
    ctx.drawImage(s.body,-h,-h);
    ctx.save();                                  // полосы едут только внутри диска
    ctx.beginPath(); ctx.arc(0,0,s.r,0,7); ctx.clip();
    let off=P.spin%s.bw; if(off<0)off+=s.bw;
    ctx.drawImage(s.bands,-s.bw/2-off,-s.bh/2);
    ctx.drawImage(s.bands,-s.bw/2-off+s.bw,-s.bh/2);
    ctx.restore();
    ctx.drawImage(s.shade,-h,-h);
    ctx.restore();
  }

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
    /* Скорости и направления вращения намеренно разные и не кратные друг другу:
       две планеты, крутящиеся в такт, читаются как один механизм. */
    planets=[
      {spr:bakePlanet(big*(mob?.44:.36),["#2b4a63","#101d2c","rgba(140,205,225,.5)"],false),
       x:W*.82,y:H*1.06,vx:-.0032,vy:-.0014,spin:0,ss:.055,depth:.35},
      {spr:bakePlanet(big*(mob?.14:.12),["#5a3b52","#20141f","rgba(197,138,224,.45)"],true),
       x:W*.17,y:H*.28,vx:.0052,vy:.0019,spin:0,ss:-.14,depth:.7}
    ];
    if(!mob)planets.push(
      {spr:bakePlanet(big*.055,["#4d5a3a","#191d13","rgba(143,208,138,.4)"],false),
       x:W*.55,y:H*.13,vx:.0085,vy:.0035,spin:0,ss:.31,depth:1});
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

    for(const s of stars){                        // мерцание размером, не яркостью
      s.x-=s.v*W*dt*.96;
      if(s.x<-2)s.x=W+2;
      const tw=1+Math.sin(t*1.6+s.f)*.2;
      const y=((s.y-scroll*s.v*9)%H+H)%H;
      ctx.globalAlpha=s.a*(1-dim*.8);
      ctx.fillStyle="#dfeef5";
      ctx.fillRect(s.x+px*(4+s.d*7),y+py*(3+s.d*5),s.s*tw,s.s*tw);
    }

    ctx.globalAlpha=1-dim;
    for(const P of planets){
      P.x+=P.vx*dt*60; P.y+=P.vy*dt*60; P.spin+=P.ss*dt*60;
      const w=P.spr.size;
      if(P.x<-w)P.x=W+w; if(P.x>W+w)P.x=-w;
      if(P.y<-w)P.y=H+w; if(P.y>H+w)P.y=-w;
      drawPlanet(P,P.x+px*(10+P.depth*26),P.y-scroll*(.04+P.depth*.05)+py*(8+P.depth*20));
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
    for(const P of planets)drawPlanet(P,P.x,P.y);
  }

  addEventListener("resize",()=>{clearTimeout(window._rt);
    window._rt=setTimeout(resize,180)},{passive:true});
  addEventListener("scroll",()=>{scroll=scrollY||0},{passive:true});
  addEventListener("mousemove",e=>{                // −1…1 от центра
    mx=(e.clientX/innerWidth-.5)*2; my=(e.clientY/innerHeight-.5)*2;
  },{passive:true});

  resize();
  requestAnimationFrame(slow?still:frame);
})();
