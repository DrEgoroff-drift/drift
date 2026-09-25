/* ══════════════ мирный флот в полёте (M455, DESIGN-borders §2.4, war §7.3) ══════════════
   Каждая держава в мирный день делает своё, и это видно из кабины:
     ГЛАВТРАССА — субботник: два буксира толкают обломки пояса;
     Компания   — рекламный борт с экраном и наёмный «подрядчик» рядом;
     Орднунг    — пара досмотра держит торговца у станции;
     Коммуна    — флот стоит ровной линией; в день забастовки огни приглушены;
     Рассвет    — ремонтный буксир подходит к любому битому борту, и к вашему:
                  стоит рядом — корпус тянется к 60 %, даром;
     Хай-Фронт  — линия дронов перезагружается по очереди: огни гаснут бегущей волной.
   Всё — функция времени и зерна системы; ничего не хранится. Сцена есть только в
   земле державы и только у станции. */
function peaceHere(){
  const sys=G.sys;if(!sys||!sys.station||typeof sysLane!=="function")return null;
  const by=(typeof stampOwnerAt==="function")?stampOwnerAt(G.sx,G.sy):null;if(!by)return null;
  const P=sysLane(sys);if(!P)return null;
  /* сцена стоит за станцией, по другую сторону от полосы подъезда */
  const cx=P.st.x-P.uy*560*P.side,cy=P.st.y+P.ux*560*P.side;
  return {by,P,cx,cy,seed:hashi(G.sx,G.sy,0x9EA5)>>>0};
}
function peaceShip(k,seed,by,x,y,a,Z,al){
  if(x<-200||x>W+200||y<-200||y>H+200)return;
  const s=fleetScale(Z)*.55;
  ctx.save();if(al!=null)ctx.globalAlpha=al;ctx.translate(x,y);ctx.rotate(a);ctx.scale(s,s);
  drawFleetShip({k,seed,by});ctx.restore();
}
/* красный флаг Коммуны: полотнище — 14 полос, каждая сдвинута волной и затенена
   по наклону; звезда у древка. Ветра в пустоте нет — его делает поток станции */
function peaceFlag(x,y,Z,t,limp,SH){
  const k=Math.max(.3,Z*1.2);if(x<-150*k||x>W+150*k||y<-200*k||y>H+60*k)return;
  const poleH=130*k,fw=78*k,fh=46*k,N=14,top=y-poleH;
  if(SH){
    /* с видеокарты: те же полосы четырёхугольниками (08c gpuQuad), звезда — веером */
    SH.push([0,x-1.2*k,top-4*k,x+1.2*k,top+poleH,0,0,141,148,155,1],[1,x,top-5*k,2.6*k,0,0,0,201,166,74,1]);
    const amp=limp?1.5*k:6*k,sp=limp?.6:3.2;
    for(let i=0;i<N;i++){
      const u0=i/N,u1=(i+1)/N,ph=t*sp-u0*6;
      const dy0=Math.sin(ph)*amp*u0,dy1=Math.sin(ph-6/N)*amp*u1;
      const sag=limp?u0*u0*fh*.9:0,sag1=limp?u1*u1*fh*.9:0;
      const x0=x+fw*u0*(limp?.55:1),x1=x+fw*u1*(limp?.55:1)+.6;
      const sh=Math.cos(ph)*(limp?.1:.28);
      gpuQuad(SH,[x0,top+dy0+sag],[x1,top+dy1+sag1],[x1,top+fh+dy1+sag1*.6],[x0,top+fh+dy0+sag*.6],
        [Math.round(clamp(178+sh*120,90,230)),Math.round(clamp(34+sh*25,10,70)),40],(i>0?8:0)|(i<N-1?2:0));
    }
    if(k>.4){
      const sx=x+fw*.18,sy=top+fh*.3+Math.sin(t*sp-1)*amp*.18,R=6*k,P=[];
      for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i&1?R*.42:R;P.push([sx+Math.cos(a)*rr,sy+Math.sin(a)*rr]);}
      for(let i=0;i<10;i+=2){const a=P[i],b=P[(i+1)%10],c=P[(i+9)%10];SH.push([5,a[0],a[1],b[0],b[1],c[0],c[1],242,201,76,1],[2,b[0],b[1],c[0],c[1],.5,0,242,201,76,1]);}
      for(let i=1;i<10;i+=2)SH.push([5,sx,sy,P[i][0],P[i][1],P[(i+2)%10][0],P[(i+2)%10][1],242,201,76,1]);
      SH.push([1,sx,sy,R*.42*.81,0,0,0,242,201,76,1]);
    }
    return;
  }
  ctx.fillStyle="#8d949b";ctx.fillRect(x-1.2*k,top-4*k,2.4*k,poleH+4*k);
  ctx.fillStyle="#c9a64a";ctx.beginPath();ctx.arc(x,top-5*k,2.6*k,0,TAU);ctx.fill();
  const amp=limp?1.5*k:6*k,sp=limp?.6:3.2;
  for(let i=0;i<N;i++){
    const u0=i/N,u1=(i+1)/N,ph=t*sp-u0*6;
    const dy0=Math.sin(ph)*amp*u0,dy1=Math.sin(ph-6/N)*amp*u1;
    const sag=limp?u0*u0*fh*.9:0,sag1=limp?u1*u1*fh*.9:0;
    const x0=x+fw*u0*(limp?.55:1),x1=x+fw*u1*(limp?.55:1)+.6;
    const sh=Math.cos(ph)*(limp?.1:.28);
    const r=Math.round(clamp(178+sh*120,90,230)),g=Math.round(clamp(34+sh*25,10,70));
    ctx.fillStyle="rgb("+r+","+g+",40)";
    ctx.beginPath();ctx.moveTo(x0,top+dy0+sag);ctx.lineTo(x1,top+dy1+sag1);ctx.lineTo(x1,top+fh+dy1+sag1*.6);ctx.lineTo(x0,top+fh+dy0+sag*.6);ctx.closePath();ctx.fill();
  }
  if(k>.4){
    const sx=x+fw*.18,sy=top+fh*.3+Math.sin(t*sp-1)*amp*.18,R=6*k;
    ctx.fillStyle="#f2c94c";ctx.beginPath();
    for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i&1?R*.42:R;ctx.lineTo(sx+Math.cos(a)*rr,sy+Math.sin(a)*rr);}
    ctx.closePath();ctx.fill();
  }
}
function drawPeaceFleet(zx,zy,Z){
  const S=peaceHere();if(!S||typeof drawFleetShip!=="function")return;
  const t=G.t/60,{by,cx,cy,seed}=S;
  /* с видеокарты (ступень 1): табло, флаг, дроны и камень — фигурами в проходе сцены,
     подписи — слоем подписей (DOM); корабли флота уже там (12ai1 fleetShipGpu) */
  const pass=gpuScene(),SH=pass?[]:null,lab=(k,text,x,y,col)=>{if(pass)domLabel("pf"+k,x,y,text,uiFont(8),col,"center");
    else{ctx.fillStyle=col;ctx.font=uiFont(8);ctx.textAlign="center";ctx.fillText(text,x,y);}};
  if(by==="gt"&&G.sys.belt){
    /* субботник: буксиры медленно ведут камни по дуге пояса */
    const R=G.sys.belt.orbit*.98;
    for(let i=0;i<2;i++){
      const a=t*.012+i*.5+seed%7,x=Math.cos(a)*R,y=Math.sin(a)*R;
      const rx=Math.cos(a+.035)*R,ry=Math.sin(a+.035)*R;
      if(SH)SH.push([1,zx(rx),zy(ry),Math.max(2,6*Z),0,0,0,58,52,46,1]);
      else{ctx.fillStyle="#3a342e";ctx.beginPath();ctx.arc(zx(rx),zy(ry),Math.max(2,6*Z),0,TAU);ctx.fill();}
      peaceShip("tug",seed+i,"gt",zx(x),zy(y),a+Math.PI/2,Z);
    }
  }else if(by==="co"){
    const x=cx+Math.cos(t*.05)*160,y=cy+Math.sin(t*.05)*60,a=Math.atan2(Math.cos(t*.05)*60,-Math.sin(t*.05)*160);
    peaceShip("ferry",seed,"co",zx(x),zy(y),a,Z);
    /* экран на рекламном борту (дизайн 18.09): бегущие цветные полосы, как у
       дрона-встречающего, — «партнёр» виден и без подписи */
    {const k=clamp(Z,.6,1.5),sx=zx(x),sy=zy(y)-12*k,off=(G.t*.6)%40;
      if(SH){const R=(x0,y0,w,h,c)=>{const a=Math.max(x0,-14),b=Math.min(x0+w,14);
          if(b>a)SH.push([0,sx+a*k,sy+y0*k,sx+b*k,sy+(y0+h)*k,0,0,c[0],c[1],c[2],c[3]]);};
        SH.push([0,sx-16*k,sy-6*k,sx+16*k,sy+4*k,0,0,32,38,46,1],[0,sx-14*k,sy-4.5*k,sx+14*k,sy+2.5*k,0,0,11,16,22,1]);
        for(let i=-1;i<3;i++){const bx=-14+i*20-off*.5+20;
          R(bx,-3,9,2,[255,90,170,.95]);R(bx+11,-3,6,2,[90,230,255,.9]);R(bx+2,.5,12,1.6,[255,230,120,.9]);}}
      else{ctx.save();ctx.translate(sx,sy);ctx.scale(k,k);
      ctx.fillStyle="#20262e";ctx.fillRect(-16,-6,32,10);ctx.fillStyle="#0b1016";ctx.fillRect(-14,-4.5,28,7);
      ctx.beginPath();ctx.rect(-14,-4.5,28,7);ctx.clip();
      for(let i=-1;i<3;i++){const bx=-14+i*20-off*.5+20;
        ctx.fillStyle="rgba(255,90,170,.95)";ctx.fillRect(bx,-3,9,2);ctx.fillStyle="rgba(90,230,255,.9)";ctx.fillRect(bx+11,-3,6,2);
        ctx.fillStyle="rgba(255,230,120,.9)";ctx.fillRect(bx+2,.5,12,1.6);}
      ctx.restore();}}
    lab(1,"РЕКЛАМА · ПАРТНЁР™",zx(x),zy(y)-24*clamp(Z,.6,1.5),"rgba(255,70,160,.8)");
    peaceShip("patrol",seed+1,"co",zx(x-60),zy(y+40),a,Z);
  }else if(by==="or"){
    /* досмотр: торговец стоит, двое по бокам, белые огни ровно */
    peaceShip("fridge",seed,"co",zx(cx),zy(cy),0,Z);
    peaceShip("patrol",seed+1,"or",zx(cx),zy(cy-70),0,Z);
    peaceShip("patrol",seed+2,"or",zx(cx),zy(cy+70),0,Z);
    lab(2,"ДОСМОТР · ЭКЗ. 1 ИЗ 3",zx(cx),zy(cy)-26*clamp(Z,.6,1.5),"rgba(240,248,255,.9)");
  }else if(by==="km"){
    const strike=(typeof socStrikeHere==="function")&&socStrikeHere();
    /* один флаг вместо четырёх паромов строем (автор 19.09: «флаги пиздец, давай 1 и
       развевается»). Мачта, полотнище полосами с волной; в забастовку — обвис */
    peaceFlag(zx(cx),zy(cy),Z,t,strike,SH);
    if(strike)lab(3,"ЗАБАСТОВКА · ФЛОТ СТОИТ",zx(cx),zy(cy)-26*clamp(Z,.6,1.5),"rgba(176,204,234,.8)");
  }else if(by==="ra"){
    const R=peaceRepairPos(S);peaceShip("tug",seed,"ra",zx(R.x),zy(R.y),R.a,Z);
  }else if(by==="hf"){
    /* линия перезагрузки: огни гаснут волной, дрон за дроном */
    for(let i=0;i<6;i++){
      const x=cx+(i-2.5)*40,y=cy,off=((t*1.2-i*.35)%4+4)%4<.5,k=clamp(Z,.6,1.5);
      /* дрон-камера Хай-Фронта, как у встречающего (17h): диск, крест лопастей,
         глаз — а не точка (дизайн 18.09); при перезагрузке глаз гаснет */
      if(SH){const X=zx(x),Y=zy(y);
        SH.push([2,X-7*k,Y-5*k,X+7*k,Y+5*k,.4*k,0,130,255,236,.45],[2,X-7*k,Y+5*k,X+7*k,Y-5*k,.4*k,0,130,255,236,.45],
          [1,X,Y,4.2*k,0,0,0,216,224,232,1],[1,X,Y+1.4*k,2*k,0,0,0,16,22,28,1],
          off?[1,X,Y+1.8*k,.8*k,0,0,0,60,60,60,.9]:[1,X,Y+1.8*k,.8*k,0,0,0,255,70,70,.95]);continue;}
      ctx.save();ctx.translate(zx(x),zy(y));ctx.scale(k,k);
      ctx.strokeStyle="rgba(130,255,236,.45)";ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(-7,-5);ctx.lineTo(7,5);ctx.moveTo(-7,5);ctx.lineTo(7,-5);ctx.stroke();
      ctx.fillStyle="#d8e0e8";ctx.beginPath();ctx.arc(0,0,4.2,0,TAU);ctx.fill();
      ctx.fillStyle="#10161c";ctx.beginPath();ctx.arc(0,1.4,2,0,TAU);ctx.fill();
      ctx.fillStyle=off?"rgba(60,60,60,.9)":"rgba(255,70,70,.95)";ctx.beginPath();ctx.arc(0,1.8,.8,0,TAU);ctx.fill();
      ctx.restore();
    }
    lab(4,"ОБНОВЛЕНИЕ УСТАНАВЛИВАЕТСЯ",zx(cx),zy(cy)-18*clamp(Z,.6,1.5),"rgba(130,255,236,.7)");
  }
  if(SH&&SH.length)gpuShapes(pass,SH);
}
/* ── ремонтный буксир Рассвета: идёт к вам, если корпус битый ── */
let PEACE_TUG=null;
function peaceRepairPos(S){
  const T=PEACE_TUG&&PEACE_TUG.key===G.sx+","+G.sy?PEACE_TUG:(PEACE_TUG={key:G.sx+","+G.sy,x:S.cx,y:S.cy,a:0,said:false});
  return T;
}
function peaceTick(sh,dt){
  const S=peaceHere();if(!S||S.by!=="ra")return;
  const T=peaceRepairPos(S),hm=stat().hullMax,need=G.hull<hm*.6;
  const tx=need?sh.x-Math.cos(sh.a)*60:S.cx,ty=need?sh.y-Math.sin(sh.a)*60:S.cy;
  const dx=tx-T.x,dy=ty-T.y,d=Math.hypot(dx,dy);
  if(d>2){const v=Math.min(d,2.2*dt);T.x+=dx/d*v;T.y+=dy/d*v;T.a=Math.atan2(dy,dx);}
  if(need&&Math.hypot(sh.x-T.x,sh.y-T.y)<90){
    if(!T.said){T.said=true;etherLine("…буксир. Стой ровно, брат, подварим.","Рассвет");}
    G.hull=Math.min(hm*.6,G.hull+.03*dt);
  }else if(!need)T.said=false;
}
