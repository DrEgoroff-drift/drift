/* ══════════════ пещера: горизонтальная полость под поверхностью ══════════════ */
/* не шахта — тут не бурят, а идут по уже готовой пустоте; свод и пол волнистые
   по шуму, зазор никогда не схлопывается, так что застрять нельзя. Светящаяся
   флора, кусачая фауна (как в шахте) и одна находка в дальнем конце. */
const CAVE_W=2200;
function caveFloor(C,x){return fbm1(x*C.freq+11,C.seed,4)*C.amp;}
function caveCeil(C,x){return caveFloor(C,x)-92-fbm1(x*C.freq*1.4+5,C.seed+91,3)*46;}
function enterCave(){
  const S=G.surf,p=S.p,r=rng(p.seed^0xCA5E);
  const plants=[],fauna=[];
  const seed=hashi(p.seed,7,0xCA5E);
  const C={seed,freq:.0026,amp:34,x:60,y:0,face:1,found:false,
    plants,fauna,walkAmp:0,walkPhase:0,walkTarget:null};
  const n=8+Math.floor(r()*6);
  for(let i=0;i<n;i++){
    const x=200+r()*(CAVE_W-400);
    const pl=genPlant(r,p,x,caveFloor(C,x));
    pl.glow=true;pl.bloom=r()<.5;
    plants.push(pl);
  }
  const nb=2+Math.floor(r()*3);
  for(let i=0;i<nb;i++){
    const x=300+r()*(CAVE_W-600);
    const b=genBeast(r,p,x,caveFloor(C,x));
    b.hostile=true;b.stun=0;b.bite=0;b.flee=0;
    fauna.push(b);
  }
  C.findX=CAVE_W-140;
  G.cave=C;G.mode="cave";
  say("Пещера\nищите проход · ДЕЙСТВИЕ у выхода — назад на поверхность");
}
function exitCave(){
  G.cave=null;G.mode="surface";
  say("Выход из пещеры\nв трюме: "+held());
}
function updateCave(dt){
  const C=G.cave,S=G.surf,st=stat();
  document.getElementById("dronebtn").style.display="none";
  const mv=.62*dt;
  if(keys.left||keys.right)C.walkTarget=null;
  if(keys.left){C.x-=mv;C.face=-1;}
  if(keys.right){C.x+=mv;C.face=1;}
  else if(C.walkTarget!=null){
    const d=C.walkTarget-C.x;
    if(Math.abs(d)<mv){C.x=C.walkTarget;C.walkTarget=null;}
    else{C.x+=Math.sign(d)*mv;C.face=Math.sign(d);}
  }
  C.x=clamp(C.x,30,CAVE_W-30);
  C.y=caveFloor(C,C.x);
  const walking=keys.left||keys.right||C.walkTarget!=null;
  C.walkAmp=clamp(C.walkAmp+(walking?1:-1)*.12*dt,0,1);
  if(walking)C.walkPhase+=dt*.22;
  /* фауна — тот же оглушить/собрать цикл, что и в шахте */
  if(keys.fire&&(C.zap||0)<=0){
    C.zap=90;C.zapT=16;sfx("ui",{f:1500,to:180,d:.22,v:.4});let n=0;
    for(const b of C.fauna)if(Math.hypot(b.x-C.x,b.y-C.y)<80){b.stun=420;b.flee=0;n++;}
    say(n?"Импульс · оглушено: "+n:"Импульс · мимо");
  }
  if(C.zap>0)C.zap-=dt;if(C.zapT>0)C.zapT-=dt;
  for(let i=C.fauna.length-1;i>=0;i--){
    const b=C.fauna[i];
    if(b.stun>0){b.stun-=dt;if(b.stun<=0)b.flee=300;continue;}
    const dx=C.x-b.x,d=Math.hypot(dx,C.y-b.y)||1;
    if(b.flee>0){b.flee-=dt;b.x-=dx/d*.9*dt;b.face=dx>0?-1:1;
      if(b.flee<=0){C.fauna.splice(i,1);}continue;}
    if(d>10){b.x+=dx/d*.5*dt;b.face=dx>0?1:-1;}
    b.y=caveFloor(C,b.x);
    if(b.bite>0)b.bite-=dt;
    if(d<20&&b.bite<=0){b.bite=100;suitHit(3,"Укус");if(G.mode!=="cave")return;}
  }
  const nearBug=C.fauna.find(b=>b.stun>0&&Math.hypot(b.x-C.x,b.y-C.y)<46);
  C.sample=nearBug||null;
  if(nearBug){   /* образец берётся сам, как и в шахте */
    const r=rng(hashi(Math.round(nearBug.x),Math.round(nearBug.y),0x5A99));
    const c=addRes("carbon",2+Math.floor(r()*4));
    const x2=r()<.4?addRes("xeno",1+Math.floor(r()*2)):0;
    C.fauna.splice(C.fauna.indexOf(nearBug),1);
    G.species.add(nearBug.name);G.data+=6;G.bio=(G.bio|0)+1;
    tell("tech","Образец: "+nearBug.name+" · углерод ×"+c+(x2?" · ксенобиом ×"+x2:""),
      "Образец взят\nуглерод ×"+c+(x2?"\nксенобиом ×"+x2:"")+"\n+6 данных");
  }
  let plant=null;
  for(const pl of C.plants)if(!pl.scanned&&Math.abs(pl.x-C.x)<30)plant=pl;
  S.suit=Math.max(0,S.suit-.001*st.suitWear*dt);
  if(S.suit<=0){G.cave=null;G.mode="surface";S.suit=0;
    say("СКАФАНДР РАЗРУШЕН\nаварийный возврат к кораблю");
    S.x=S.shipX;S.y=groundAt(S.tr,S.shipX)-10;S.vy=0;return;}
  if(C.x<70){
    G.prompt="ДЕЙСТВИЕ — НАЗАД НА ПОВЕРХНОСТЬ";
    if(actEdge){exitCave();return;}
  }else if(!C.found&&C.x>C.findX-40){
    G.prompt="ДЕЙСТВИЕ — ОСМОТРЕТЬ НАХОДКУ";
    if(actEdge){
      C.found=true;G.data+=20;
      tell("tech","Находка в пещере · +20 данных","Находка в пещере\n+20 данных");
    }
  }else if(plant){
    G.prompt="ДЕЙСТВИЕ — СКАНИРОВАТЬ ОРГАНИЗМ";
    if(actEdge){
      plant.scanned=true;G.species.add(plant.name);G.data+=9;G.bio=(G.bio|0)+1;
      tell("","Новый вид: "+plant.name+" · +9 данных","Новый вид\n"+plant.name+"\n+9 данных");
    }
  }else if(C.fauna.some(b=>b.stun<=0&&b.flee<=0)){
    G.prompt="КУСАЧИЕ РЯДОМ · ОГОНЬ (F) — ИМПУЛЬС\nОГЛУШЁННОГО ЗАБРАТЬ — ПОДОЙТИ ВПЛОТНУЮ";
  }else G.prompt="A D — ИДТИ · В ДАЛЬНЕМ КОНЦЕ НАХОДКА · У ВХОДА ДЕЙСТВИЕ — НАРУЖУ";
}
function drawCave(){
  const C=G.cave;
  const camx=C.x-W/2;
  ctx.fillStyle="#03040a";ctx.fillRect(0,0,W,H);
  /* свод и пол — сплошная порода, между ними тёмный проход */
  ctx.fillStyle="#0c1016";
  ctx.beginPath();ctx.moveTo(0,0);
  for(let sx=0;sx<=W;sx+=16){const wx=camx+sx;ctx.lineTo(sx,caveCeil(C,wx)-C.y+H*.56);}
  ctx.lineTo(W,0);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(0,H);
  for(let sx=0;sx<=W;sx+=16){const wx=camx+sx;ctx.lineTo(sx,caveFloor(C,wx)-C.y+H*.56);}
  ctx.lineTo(W,H);ctx.closePath();ctx.fill();
  for(const pl of C.plants){
    const x=pl.x-camx;if(x<-70||x>W+70)continue;
    drawPlant(pl,x,pl.y-C.y+H*.56);
  }
  for(const b of C.fauna){
    const x=b.x-camx;if(x<-50||x>W+50)continue;
    drawBeast(b,x,b.y-C.y+H*.56+b.r*.9,true,b.stun);
  }
  if(!C.found){
    const x=C.findX-camx;
    if(x>-40&&x<W+40){
      ctx.fillStyle=Math.sin(G.t*.08)>0?"rgba(255,225,140,.9)":"rgba(255,225,140,.4)";
      ctx.beginPath();ctx.arc(x,caveFloor(C,C.findX)-C.y+H*.56-6,4,0,TAU);ctx.fill();
    }
  }
  const px=W/2,py=H*.56;
  ctx.save();ctx.translate(px,py);
  drawAstronaut({face:C.face,amp:C.walkAmp,phase:C.walkPhase,air:false,
    mining:false,suitLow:G.surf.suit<25,lamp:true});
  ctx.restore();
  ctx.fillStyle="rgba(127,230,216,.85)";ctx.font="10px ui-monospace,monospace";ctx.textAlign="left";
  ctx.fillText("ПЕЩЕРА · "+Math.round(C.x)+"/"+CAVE_W,12,H-30);
  ctx.fillStyle=G.surf.suit>25?"rgba(93,115,130,.9)":"#ff6b57";
  ctx.fillText("СКАФАНДР "+Math.round(G.surf.suit)+"%",12,H-16);
}
