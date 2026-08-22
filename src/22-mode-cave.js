/* ══════════════ пещера: горизонтальная полость под поверхностью ══════════════ */
/* не шахта — тут не бурят, а идут по уже готовой пустоте; свод и пол волнистые
   по шуму, зазор никогда не схлопывается, так что застрять нельзя. Светящаяся
   флора, кусачая фауна (как в шахте) и одна находка в дальнем конце. */
const CAVE_W=2200;
function caveFloor(C,x){return fbm1(x*C.freq+11,C.seed,4)*C.amp;}
/* свод: базовый зазор плюс подъём зала. caveVault только поднимает — зазор
   от него может стать шире, но не уже, поэтому схлопнуться ход не может */
function caveCeil(C,x){return caveFloor(C,x)-92-fbm1(x*C.freq*1.4+5,C.seed+91,3)*46-caveVault(C,x);}
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
  /* дозор посёлка (12t): в его биоме кусачих просто меньше — не потому, что
     игроку сделали поблажку, а потому, что здесь их гоняют каждый день */
  const watch=(typeof settleWatch==="function")?settleWatch(p):0;
  C.watch=watch;
  const nb=Math.max(1,Math.round((2+Math.floor(r()*3))*(1-watch*.5)));
  for(let i=0;i<nb;i++){
    const x=300+r()*(CAVE_W-600);
    const b=genBeast(r,p,x,caveFloor(C,x));
    b.hostile=true;b.stun=0;b.bite=0;b.flee=0;
    fauna.push(b);
  }
  C.findX=CAVE_W-140;
  caveZones(C);caveDeco(C,p);
  G.cave=C;G.mode="cave";
  const cl=(typeof storyGroundLine==="function")?storyGroundLine("cave"):null;
  if(cl)logAdd("dim",cl);
  say("Пещера\nищите проход · ДЕЙСТВИЕ у выхода — назад на поверхность"+
    (watch>0?"\nздесь ходят дозорные посёлка":"")+(cl?"\n"+cl:""),cl?320:150);
}
function exitCave(){
  G.cave=null;G.mode="surface";
  say("Выход из пещеры\nв трюме: "+held());
}
function updateCave(dt){
  const C=G.cave,S=G.surf,st=stat();
  document.getElementById("dronebtn").style.display="none";
  /* по колено в воде идут медленнее — это единственное, чем озеро вмешивается
     в механику, и этого хватает, чтобы оно не было картинкой */
  const wet=caveWet(C,C.x);
  const mv=.62*dt*(wet?.66:1);
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
  if(walking)C.walkPhase+=dt*(wet?.16:.22);
  updateCaveDeco(C,dt);
  /* смена зала — единственное событие на длинном ходу, и назвать его стоит:
     иначе игрок проходит грот и не замечает, что грот был */
  const zk=caveZoneAt(C,C.x).kind;
  if(C.zone&&C.zone!==zk)say(caveZoneAt(C,C.x).Z.ru);
  C.zone=zk;
  /* шаг по воде даёт свой всплеск: звук важнее ряби, по нему понятно, что
     под ногами не камень */
  if(walking&&wet){
    C.splashT=(C.splashT||0)-dt;
    if(C.splashT<=0){C.splashT=34;
      C.deco.splash={x:C.x,y:caveFloor(C,C.x),t:26};
      sfx("ui",{f:520,to:190,d:.16,v:.10});}
  }
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
    /* под дозором тварь всё равно идёт на человека, но до черты: дальше её не
       пускают те, кто здесь живёт, и укусить она не может вовсе */
    const keep=(C.watch||0)>0?24+46*C.watch:10;
    if(d>keep){b.x+=dx/d*.5*dt;b.face=dx>0?1:-1;}
    else if(keep>10&&d<keep-6){b.x-=dx/d*.35*dt;b.face=dx>0?-1:1;}
    b.y=caveFloor(C,b.x);
    if(b.bite>0)b.bite-=dt;
    if(d<20&&b.bite<=0&&!(C.watch>0)){b.bite=100;suitHit(3,"Укус");if(G.mode!=="cave")return;}
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
      /* в глубине пещеры лежит не только запись данных (05a-nodes) */
      nodeDrop("в пещере",.5+sysDanger(G.sx,G.sy)*.5,hashi(C.findX|0,0xCA7,3));
      /* редкость на адресе пещеры (12m-rare): ключ стабилен по системе и забою */
      if(typeof rareTake==="function")rareTake("cave",hashi(G.sx,G.sy,(C.findX|0)^0xCA7E));
    }
  }else if(plant){
    G.prompt="ДЕЙСТВИЕ — СКАНИРОВАТЬ ОРГАНИЗМ";
    if(actEdge){
      plant.scanned=true;G.species.add(plant.name);G.data+=9;G.bio=(G.bio|0)+1;
      tell("","Новый вид: "+plant.name+" · +9 данных","Новый вид\n"+plant.name+"\n+9 данных");
    }
  }else if(C.fauna.some(b=>b.stun<=0&&b.flee<=0)){
    G.prompt=(C.watch>0?"КУСАЧИЕ ДЕРЖАТСЯ ПООДАЛЬ · ЗДЕСЬ ИХ ГОНЯЮТ\n":"КУСАЧИЕ РЯДОМ · ")+
      "ОГОНЬ (F) — ИМПУЛЬС\nОГЛУШЁННОГО ЗАБРАТЬ — ПОДОЙТИ ВПЛОТНУЮ";
  }else G.prompt="A D — ИДТИ · В ДАЛЬНЕМ КОНЦЕ НАХОДКА · У ВХОДА ДЕЙСТВИЕ — НАРУЖУ";
}
/* порода пещеры в один ломоть: свод и пол, материал планеты, темнота,
   градиент к краям и влажный блик. wx0/wy0 — мировое начало ломтя */
function drawCaveRock(C,cp,camx,camy){
  ctx.fillStyle="#0c1016";
  const CP=new Path2D();
  CP.moveTo(-20,-20);
  for(let sx=-16;sx<=W+16;sx+=16){const wx=camx+sx;CP.lineTo(sx,caveCeil(C,wx)-camy);}
  CP.lineTo(W+20,-20);CP.closePath();
  const FP=new Path2D();
  FP.moveTo(-20,H+20);
  for(let sx=-16;sx<=W+16;sx+=16){const wx=camx+sx;FP.lineTo(sx,caveFloor(C,wx)-camy);}
  FP.lineTo(W+20,H+20);FP.closePath();
  ctx.fill(CP);ctx.fill(FP);
  /* порода той же планеты и на своде, и на полу: без неё пещера — два чёрных
     силуэта, и по ним не понять, в чьих недрах игрок находится */
  if(cp){
    const mat=planetMat(cp);
    fillMaterial(mat,camx,camy,.30,.18,CP);
    fillMaterial(mat,camx,camy,.30,.18,FP);
    /* и сразу гасим: тайл рассчитан на освещённую поверхность, под землёй он
       светит как днём и убивает единственное, что есть у пещеры — темноту */
    ctx.fillStyle="rgba(2,4,9,.44)";
    ctx.fill(CP);ctx.fill(FP);
    /* и уводим в черноту к краям кадра: у самой кромки порода ещё читается
       зерном, в глубине массива её нет вовсе. Плоской заливки не остаётся
       нигде — то, что кажется чёрным, на деле градиент по зерну */
    const dg=ctx.createLinearGradient(0,0,0,H);
    dg.addColorStop(0,"rgba(0,1,5,.72)");
    dg.addColorStop(.42,"rgba(0,1,5,0)");
    dg.addColorStop(.62,"rgba(0,1,5,0)");
    dg.addColorStop(1,"rgba(0,1,5,.80)");
    ctx.fillStyle=dg;ctx.fill(CP);ctx.fill(FP);
    /* влажный блик по кромке свода — единственный источник формы в темноте */
    ctx.strokeStyle="rgba(150,200,230,.14)";ctx.lineWidth=1.6;
    ctx.stroke(CP);ctx.stroke(FP);
  }
}
function drawCave(){
  const C=G.cave;
  const camx=C.x-W/2;
  ctx.fillStyle="#03040a";ctx.fillRect(0,0,W,H);
  /* свод и пол — сплошная порода, между ними тёмный проход. Порода с
     материалом, затемнением и бликом кромки — самое дорогое в кадре (20 мс
     из 28 по замеру 0.87) и при этом неподвижное: рисуется ломтями (18c),
     в кадре остаётся drawImage. Ломоть хранится при пещере. */
  const cp=G.surf&&G.surf.p;
  C.chunks=chunkStore(C.chunks,C.seed+"|"+(cp?cp.seed:0)+"|"+H+"|"+DPR,C.y-H*.56,H);
  drawChunks(C.chunks,camx,C.y-H*.56,(g,wx0,wy0)=>drawCaveRock(C,cp,wx0,wy0));
  /* убранство: строение раньше материала — натёки уже вылеплены породой выше,
     тут только их силуэт и вода, а свет пойдёт после темноты */
  const camy=C.y-H*.56;
  drawCaveBack(C,camx,camy);
  drawCaveSolid(C,camx,camy);
  drawCaveWater(C,camx,camy);
  drawCaveDark(C,W/2,H*.56);
  drawCaveGlow(C,camx,camy,W/2,H*.56);
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
  ctx.fillText(caveZoneAt(C,C.x).Z.ru.toUpperCase()+" · "+Math.round(C.x)+"/"+CAVE_W,12,H-30);
  ctx.fillStyle=G.surf.suit>25?"rgba(93,115,130,.9)":"#ff6b57";
  ctx.fillText("СКАФАНДР "+Math.round(G.surf.suit)+"%",12,H-16);
}
