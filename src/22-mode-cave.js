/* ══════════════ пещера: поле породы в двух измерениях ══════════════ */
/* Была щелью: свод и пол по шуму, между ними две тысячи пикселей хода.
   Теперь пещера — ПОЛЕ: сетка клеток по 5 px, порода или пустота, вырезанная
   шумом, а сквозь неё прорублены ходы, которые гарантируют проход: верхняя
   галерея от устья вправо, две шахты вниз, нижняя галерея обратно влево к
   находке. Карманы и залы вокруг — от шума, часть из них достижима только
   ранцем (20d). Свет, темнота, натёки, озёра и жилы (22a) держатся за
   верхнюю галерею, как и раньше: caveFloor/caveCeil ищут её пол и свод в
   сетке, поэтому убранство не узнало, что пещера стала объёмной.
   Порода красится тайлами (18c): в кадре остаётся drawImage. */
const CAVE_W=2200, CAVE_CS=5, CAVE_Y0=-160, CAVE_Y1=1340;
/* стена расписок (M210): на шаг внутрь от устья, где кончается дневной свет */
const CAVE_WALL_X0=150, CAVE_WALL_X1=248;
const CAVE_NX=Math.ceil(CAVE_W/CAVE_CS), CAVE_NY=Math.ceil((CAVE_Y1-CAVE_Y0)/CAVE_CS);
/* ── 皴法: манера зерна по породе (M263, DESIGN-craft §5) ──
   Живопись гор веками держит таблицу «камень → кисть», и она годится как
   есть: осадочным мирам — длинные мягкие волокна (披麻, «пенька»), вулканиту —
   короткий рубленый штрих с разбросом (斧劈, «топор»), льду — ровная светлая
   лента (折带), песку — точечная крошка (雨点). ln — множитель длины штриха,
   w — толщина, la/da — плотность светлого и тёмного тона, jig — разброс угла
   от поля направлений, dot — крошка вместо штриха. Неизвестный тип — rocky. */
const CUN={
  terran:{ln:1.5,w:1.1,la:.08,da:.22,jig:.12},
  jungle:{ln:1.5,w:1.1,la:.08,da:.22,jig:.12},
  ocean:{ln:1.4,w:1.1,la:.08,da:.20,jig:.12},
  volcanic:{ln:.55,w:1.9,la:.12,da:.30,jig:.6},
  rocky:{ln:.8,w:1.4,la:.10,da:.26,jig:.35},
  ice:{ln:1.9,w:1,la:.13,da:.13,jig:.05},
  desert:{dot:1,la:.13,da:.24},
  sand:{dot:1,la:.13,da:.24},
  toxic:{ln:1,w:1.2,la:.09,da:.24,jig:.25}
};
/* ось верхней галереи: тот же шум, что и прежний пол, так что залы (22a)
   легли туда же, куда ложились */
function caveGalY(C,x){return fbm1(x*C.freq+11,C.seed,4)*C.amp-46-caveVault(C,x)*.3;}
/* ── галерея уже (M248) ──
   Ход был в 44–70 единиц при росте человека в 17: стены никогда не попадали в
   кадр вместе, и пещера читалась картой, а не местом. Сузили до 30–52 — свод
   и пол видно разом, и своды перестали быть краем экрана. */
function caveGalR(C,x){return 30+caveVault(C,x)*.32;}
/* нижняя галерея: глубже на шесть сотен, идёт справа налево */
function caveLowY(C,x){return 640+fbm1(x*.003+5,C.seed+7,3)*160-80;}
function caveSolidAt(C,x,y){
  const cx=(x/CAVE_CS)|0, cy=((y-CAVE_Y0)/CAVE_CS)|0;
  if(cx<0||cx>=CAVE_NX||cy<0||cy>=CAVE_NY)return true;
  return C.g[cy*CAVE_NX+cx]===1;
}
/* первая порода вниз/вверх от точки: верх клетки для пола, низ — для свода */
function caveScanDown(C,x,y){
  const cx=clamp((x/CAVE_CS)|0,0,CAVE_NX-1);
  let cy=clamp(((y-CAVE_Y0)/CAVE_CS)|0,0,CAVE_NY-1);
  for(;cy<CAVE_NY;cy++)if(C.g[cy*CAVE_NX+cx])return cy*CAVE_CS+CAVE_Y0;
  return CAVE_Y1;
}
function caveScanUp(C,x,y){
  const cx=clamp((x/CAVE_CS)|0,0,CAVE_NX-1);
  let cy=clamp(((y-CAVE_Y0)/CAVE_CS)|0,0,CAVE_NY-1);
  for(;cy>=0;cy--)if(C.g[cy*CAVE_NX+cx])return (cy+1)*CAVE_CS+CAVE_Y0;
  return CAVE_Y0;
}
function caveFloor(C,x){
  const cx=clamp((x/CAVE_CS)|0,0,CAVE_NX-1);
  let v=C.flo[cx];
  if(v!==v){v=caveScanDown(C,cx*CAVE_CS+2,caveGalY(C,x));C.flo[cx]=v;}
  return v;
}
function caveCeil(C,x){
  const cx=clamp((x/CAVE_CS)|0,0,CAVE_NX-1);
  let v=C.cei[cx];
  if(v!==v){v=caveScanUp(C,cx*CAVE_CS+2,caveGalY(C,x));C.cei[cx]=v;}
  return v;
}
/* пол и свод НИЖНЕЙ галереи — та же развёртка от её оси. До этого всё
   убранство и все твари знали только верхнюю (хвост M136) */
function caveFloorLow(C,x){
  const cx=clamp((x/CAVE_CS)|0,0,CAVE_NX-1);
  if(!C.floL)C.floL=new Float32Array(CAVE_NX).fill(NaN);
  let v=C.floL[cx];
  if(v!==v){v=caveScanDown(C,cx*CAVE_CS+2,caveLowY(C,x));C.floL[cx]=v;}
  return v;
}
function caveCeilLow(C,x){
  const cx=clamp((x/CAVE_CS)|0,0,CAVE_NX-1);
  if(!C.ceiL)C.ceiL=new Float32Array(CAVE_NX).fill(NaN);
  let v=C.ceiL[cx];
  if(v!==v){v=caveScanUp(C,cx*CAVE_CS+2,caveLowY(C,x));C.ceiL[cx]=v;}
  return v;
}
function caveFloorOf(C,x,low){return low?caveFloorLow(C,x):caveFloor(C,x);}
function caveCeilOf(C,x,low){return low?caveCeilLow(C,x):caveCeil(C,x);}
/* ── генерация поля ── */
function caveStamp(C,x,y,r){
  const g=C.g,CS=CAVE_CS;
  const cx0=Math.max(0,((x-r)/CS)|0),cx1=Math.min(CAVE_NX-1,((x+r)/CS)|0);
  const cy0=Math.max(0,((y-r-CAVE_Y0)/CS)|0),cy1=Math.min(CAVE_NY-1,((y+r-CAVE_Y0)/CS)|0);
  const r2=r*r;
  for(let cy=cy0;cy<=cy1;cy++){
    const dy=cy*CS+CS*.5+CAVE_Y0-y;
    for(let cx=cx0;cx<=cx1;cx++){
      const dx=cx*CS+CS*.5-x;
      if(dx*dx+dy*dy<r2)g[cy*CAVE_NX+cx]=0;
    }
  }
}
function caveBuild(C){
  const NX=CAVE_NX,NY=CAVE_NY,CS=CAVE_CS;
  let g=new Uint8Array(NX*NY);
  /* порода от шума: порог плывёт с глубиной — у поверхности массив плотный,
     в середине рыхлый, у дна снова глухой. Из рыхлого и выходят залы */
  for(let cy=0;cy<NY;cy++){
    const y=cy*CS+CAVE_Y0;
    const depth=clamp((y-40)/1100,0,1);
    /* порог выше — породы больше, залы мельче (M248). Проход при этом не
       зависит от шума: галереи, шахты и устье прорубаются ПОСЛЕ сглаживания */
    const thr=.53+.08*Math.sin(Math.PI*depth);
    for(let cx=0;cx<NX;cx++){
      const x=cx*CS;
      const n=fbm2(x*.0052,y*.0052,C.seed^0xC4,4);
      g[cy*NX+cx]=(n>thr||y<20||y>CAVE_Y1-60)?1:0;
    }
  }
  /* сглаживание большинством: одиночные клетки и щели в одну клетку уходят */
  for(let it=0;it<2;it++){
    const h=new Uint8Array(NX*NY);
    for(let cy=0;cy<NY;cy++)for(let cx=0;cx<NX;cx++){
      let s=0;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const ax=cx+dx,ay=cy+dy;
        s+=(ax<0||ax>=NX||ay<0||ay>=NY)?1:g[ay*NX+ax];
      }
      h[cy*NX+cx]=s>=5?1:0;
    }
    g=h;
  }
  C.g=g;
  /* ходы: верхняя галерея, две шахты, нижняя галерея. Они прорублены после
     сглаживания, поэтому проход гарантирован при любом шуме */
  for(let x=0;x<=CAVE_W;x+=4)caveStamp(C,x,caveGalY(C,x),caveGalR(C,x));
  for(let x=300;x<=CAVE_W-120;x+=4)caveStamp(C,x,caveLowY(C,x),36+fbm1(x*.01,C.seed+3,2)*22);
  C.shafts=[CAVE_W*.42,CAVE_W*.88].map((sx,i)=>{
    const y0=caveGalY(C,sx),y1=caveLowY(C,sx);
    const pts=[];
    for(let y=y0;y<=y1;y+=4){
      const x=sx+(fbm1(y*.01,C.seed+21+i,3)-.5)*90;
      caveStamp(C,x,y,22+fbm1(y*.02,C.seed+9,2)*8);
      pts.push([x,y]);
    }
    return {x:sx,pts};
  });
  /* ответвления: от галерей в стороны, тупиковые — ради них и летают. Куда
     ведёт ход, заранее не видно, это и делает пещеру пещерой */
  const br=rng(C.seed^0xB4A);
  for(let i=0;i<6;i++){
    const fromLow=br()<.4;
    let x=fromLow?400+br()*(CAVE_W-700):200+br()*(CAVE_W-500);
    let y=fromLow?caveLowY(C,x):caveGalY(C,x);
    let a=(br()<.5?1:-1)*(Math.PI/2)+(br()-.5)*1.2;
    const len=160+br()*300;
    for(let t=0;t<len;t+=4){
      a+=(fbm1(t*.02,C.seed+40+i,2)-.5)*.3;
      x+=Math.cos(a)*4;y+=Math.sin(a)*4;
      if(y<30||y>CAVE_Y1-80)break;
      caveStamp(C,x,y,16+fbm1(t*.03,C.seed+50+i,2)*10);
    }
  }
  /* устье: столб пустоты к поверхности, по нему и выходят; стенки гуляют,
     иначе он читается коробом */
  for(let y=CAVE_Y0;y<caveGalY(C,60);y+=4)caveStamp(C,60+(fbm1(y*.015,C.seed+77,2)-.5)*20,y,22+fbm1(y*.02,C.seed+78,2)*10);
  /* край поля — глухая порода: дальше мира нет */
  for(let cy=0;cy<NY;cy++){g[cy*NX]=1;g[cy*NX+1]=1;g[cy*NX+NX-1]=1;g[cy*NX+NX-2]=1;}
  C.flo=new Float32Array(NX).fill(NaN);C.cei=new Float32Array(NX).fill(NaN);
}
function enterCave(){
  const S=G.surf,p=S.p,r=rng(p.seed^0xCA5E);
  const plants=[],fauna=[];
  /* вход под третьим светом (11g): та же пещера с другим зерном, без кусачих */
  const ancient=!!S.ancient;
  const seed=hashi(p.seed,ancient?9:7,0xCA5E);
  const C={seed,freq:.0026,amp:34,x:60,y:0,vy:0,on:false,face:1,found:false,
    plants,fauna,walkAmp:0,walkPhase:0,walkTarget:null,ancient};
  caveZones(C);
  caveBuild(C);
  C.y=caveFloor(C,60);C.cy=C.y;
  /* флора — на полу обеих галерей: нижняя без неё была бы просто тёмной */
  const n=10+Math.floor(r()*6);
  for(let i=0;i<n;i++){
    const low=r()<.45;
    const x=low?340+r()*(CAVE_W-520):200+r()*(CAVE_W-400);
    const y=low?caveScanDown(C,x,caveLowY(C,x)):caveFloor(C,x);
    if(y>=CAVE_Y1)continue;
    /* под землёй сыро и темно: своя флора планеты, светящаяся по виду, а не
       по включённому руками флагу (M174, caveFloraOf) */
    plants.push(specimenPlant(r,pickShare(caveFloraOf(p),r),p,x,y,{wet:.9,hollow:.75}));
  }
  /* дозор посёлка (12t): в его биоме кусачих просто меньше — не потому, что
     игроку сделали поблажку, а потому, что здесь их гоняют каждый день */
  const watch=(typeof settleWatch==="function")?settleWatch(p):0;
  C.watch=watch;
  const nb=ancient?0:Math.max(1,Math.round((2+Math.floor(r()*3))*(1-watch*.5)));
  for(let i=0;i<nb;i++){
    const x=300+r()*(CAVE_W-600);
    const b=genBeast(r,p,x,caveFloor(C,x));
    b.hostile=true;b.stun=0;b.bite=0;b.flee=0;
    fauna.push(b);
  }
  /* и на нижней галерее свои: раньше внизу было безопасно, потому что туда
     никто не спускался, а не потому, что там пусто */
  const nbl=ancient?0:Math.max(0,Math.round((1+Math.floor(r()*2))*(1-watch*.5)));
  for(let i=0;i<nbl;i++){
    const x=420+r()*(CAVE_W-760);
    const y=caveFloorLow(C,x);
    if(y>=CAVE_Y1-10)continue;
    const b=genBeast(r,p,x,y);
    b.hostile=true;b.stun=0;b.bite=0;b.flee=0;b.low=true;
    fauna.push(b);
  }
  /* находка — в дальнем конце НИЖНЕЙ галереи: туда спускаются шахтой, а
     обратно поднимаются ранцем */
  C.findX=340;C.findY=caveScanDown(C,340,caveLowY(C,340));
  caveDeco(C,p);
  G.cave=C;G.mode="cave";
  const cl=(typeof storyGroundLine==="function")?storyGroundLine("cave"):null;
  if(cl)logAdd("dim",cl);
  /* «Пещера» стоит в сводке места, «ДЕЙСТВИЕ — назад на поверхность» — в
     подсказке у пэдов. Одно и то же трижды в одном кадре игрок читает как
     шум. Сообщение оставляет себе только то, чего больше нигде нет: как тут
     ходить и кого можно встретить. */
  say("ищите проход · шахты ведут вниз · W — ранец"+
    (watch>0?"\nздесь ходят дозорные посёлка":"")+(cl?"\n"+cl:""),cl?320:190);
}
function exitCave(){
  G.cave=null;G.mode="surface";
  if(G.surf)G.surf.ancient=false;
  say("Выход из пещеры\nв трюме: "+held());
}
/* ── тело в поле: ящик 8×21 над точкой опоры ── */
function caveBoxFree(C,x,y){
  for(let sy=y-21;sy<=y-1;sy+=5)
    if(caveSolidAt(C,x-4,sy)||caveSolidAt(C,x+4,sy))return false;
  return !(caveSolidAt(C,x-4,y-1)||caveSolidAt(C,x+4,y-1));
}
/* шаг по X с подъёмом на уступ до 14 px: склон проходится без прыжка */
function caveMoveX(C,dx){
  const nx=clamp(C.x+dx,12,CAVE_W-12);
  if(caveBoxFree(C,nx,C.y)){C.x=nx;return true;}
  for(let s=1;s<=14;s++)if(caveBoxFree(C,nx,C.y-s)){C.x=nx;C.y-=s;return true;}
  return false;
}
function updateCave(dt){
  const C=G.cave,S=G.surf,st=stat(),g=S.g;
  document.getElementById("dronebtn").style.display="none";
  /* по колено в воде идут медленнее — это единственное, чем озеро вмешивается
     в механику, и этого хватает, чтобы оно не было картинкой */
  const wet=caveWet(C,C.x);
  const mv=.62*dt*(wet?.66:1);
  if(keys.left||keys.right)C.walkTarget=null;
  let moved=false;
  if(keys.left){moved=caveMoveX(C,-mv)||moved;C.face=-1;}
  if(keys.right){moved=caveMoveX(C,mv)||moved;C.face=1;}
  else if(C.walkTarget!=null){
    const d=C.walkTarget-C.x;
    if(Math.abs(d)<mv){C.walkTarget=null;}
    else{moved=caveMoveX(C,Math.sign(d)*mv);C.face=Math.sign(d);if(!moved)C.walkTarget=null;}
  }
  /* ── вертикаль: тяготение планеты, ранец, опора ── */
  const wasOn=C.on;
  if(C.on){
    C.vy=0;C.jetOn=false;
    jetTick(C,g,dt,false);
    if(keys.thrust&&jetCanLift()&&jetKick()){C.vy=-1.6;C.on=false;C.jetOn=true;}
    else{
      /* под уклон — держимся пола, а не падаем по ступеньке за шаг */
      let s=1;for(;s<=6;s++)if(!caveBoxFree(C,C.x,C.y+s))break;
      C.y+=s-1;
      if(s>6)C.on=false;
    }
  }
  if(!C.on){
    C.vy+=g*dt;
    jetTick(C,g,dt,true);
    C.vy=Math.min(C.vy,3.2);
    let rem=C.vy*dt;
    while(Math.abs(rem)>1e-3){
      const step=clamp(rem,-4,4);
      if(caveBoxFree(C,C.x,C.y+step)){C.y+=step;rem-=step;}
      else{
        if(step>0){if(C.vy>1.1)S.shake=Math.min(11,C.vy*2.6);C.on=true;C.jetOn=false;}
        C.vy=0;rem=0;
        /* подтягиваемся к породе по пикселю, чтобы не висеть в зазоре */
        const sg=Math.sign(step);
        for(let k=0;k<4;k++){if(caveBoxFree(C,C.x,C.y+sg))C.y+=sg;else break;}
      }
    }
  }
  C.y=clamp(C.y,CAVE_Y0+30,CAVE_Y1-10);
  const walking=C.on&&moved;
  C.walkAmp=clamp(C.walkAmp+(walking?1:-1)*.12*dt,0,1);
  if(walking)C.walkPhase+=dt*(wet?.16:.22);
  C.cy=lerp(C.cy==null?C.y:C.cy,C.y,Math.min(1,.16*dt));
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
    /* тварь ходит по верхней галерее: игрока на нижней она слышит, но не
       достаёт — и это правильно, внизу свои опасности */
    const same=Math.abs(C.y-b.y)<120;
    if(d>keep&&same){b.x+=dx/d*.5*dt;b.face=dx>0?1:-1;b.lost=0;}
    else if(keep>10&&d<keep-6){b.x-=dx/d*.35*dt;b.face=dx>0?-1:1;}
    /* тварь спускается (хвост M136): человека на другой галерее она слышит
       и, выждав, срывается к нему со свода — не сразу, чтобы уйти вниз ещё
       можно было, и только если он недалеко по горизонтали */
    const pLow=C.y>caveGalY(C,C.x)+260;
    if(!same&&!b.fall&&Math.abs(dx)<240&&!(C.watch>0)){
      b.lost=(b.lost||0)+dt;
      if(b.lost>260){
        b.lost=0;
        if(caveFloorOf(C,b.x,pLow)<CAVE_Y1-10){b.low=pLow;b.fall=true;b.y=caveCeilOf(C,b.x,pLow)+4;}
      }
    }
    b.x=clamp(b.x,40,CAVE_W-40);
    if(b.fall){
      b.y+=2.6*dt;
      const fl=caveFloorOf(C,b.x,!!b.low);
      if(b.y>=fl){b.y=fl;b.fall=false;if(Math.abs(dx)<W*.5)S.shake=Math.max(S.shake||0,3);}
    }else b.y=caveFloorOf(C,b.x,!!b.low);
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
    const d=bioMark(nearBug.name,6);G.data+=d;
    tell("tech","Образец: "+nearBug.name+" · углерод ×"+c+(x2?" · ксенобиом ×"+x2:""),
      "Образец взят\nуглерод ×"+c+(x2?"\nксенобиом ×"+x2:"")+"\n+"+d+" данных");
  }
  let plant=null;
  for(const pl of C.plants)if(!pl.scanned&&Math.abs(pl.x-C.x)<30&&Math.abs(pl.y-C.y)<40)plant=pl;
  S.suit=Math.max(0,S.suit-.001*st.suitWear*kitHeatMul()*kitStat().lampDrain*dt);   /* фонарь ест заряд, подогрев держит (M152) */
  if(S.suit<=0){G.cave=null;G.mode="surface";S.suit=0;
    say("СКАФАНДР РАЗРУШЕН\nаварийный возврат к кораблю");
    S.x=S.shipX;S.y=groundAt(S.tr,S.shipX)-10;S.vy=0;return;}
  const atMouth=C.x<70&&C.y<caveGalY(C,60)+70;
  if(atMouth){
    G.prompt="ДЕЙСТВИЕ — НАЗАД НА ПОВЕРХНОСТЬ";
    if(actEdge){exitCave();return;}
  }
  /* стена у устья (M210): НЕ в самом устье — там ДЕЙСТВИЕ уже выводит наружу.
     Расписываются на шаг внутрь, где кончается дневной свет: так и в жизни —
     под навесом, а не на сквозняке */
  else if(typeof wallDraw==="function"&&C.x>CAVE_WALL_X0&&C.x<CAVE_WALL_X1&&
          C.y<caveGalY(C,C.x)+90){
    wallAsk(WALL_C);
    const n=wallCount(WALL_C);
    if(wallCanSign(WALL_C)){
      G.prompt="ДЕЙСТВИЕ — ОСТАВИТЬ СВОЙ ЗНАК У УСТЬЯ"+
        (n>0?"\nТУТ УЖЕ "+n+" ЧУЖИХ РУК":(n===0?"\nКАМЕНЬ ЧИСТ":""));
      if(actEdge){wallSign(WALL_C);return;}
    }else if(n>0){
      G.prompt="УСТЬЕ · "+n+" РУК"+(wallHere(WALL_C)&&wallHere(WALL_C).mine?", СРЕДИ НИХ ВАША":"");
    }
  }
  else if(!C.found&&Math.hypot(C.x-C.findX,C.y-C.findY)<44){
    G.prompt="ДЕЙСТВИЕ — ОСМОТРЕТЬ НАХОДКУ";
    if(actEdge){
      C.found=true;
      if(C.ancient&&typeof lightsCaveFind==="function"){lightsCaveFind(C);return;}
      G.data+=20;
      if(typeof heardAdd==="function")heardAdd("ground",{sx:G.sx,sy:G.sy,note:"находка в пещере"},null);
      tell("tech","Находка в пещере · +20 данных","Находка в пещере\n+20 данных");
      /* в глубине пещеры лежит не только запись данных (05a-nodes) */
      nodeDrop("в пещере",.5+sysDanger(G.sx,G.sy)*.5,hashi(C.findX|0,0xCA7,3));
      /* редкость на адресе пещеры (12m-rare): ключ стабилен по системе и забою */
      if(typeof rareTake==="function")rareTake("cave",hashi(G.sx,G.sy,(C.findX|0)^0xCA7E));
    }
  }else if(plant){
    G.prompt="ДЕЙСТВИЕ — СКАНИРОВАТЬ ОРГАНИЗМ";
    if(actEdge){
      const isNew=bioScan(plant,9);
      if(isNew&&typeof heardAdd==="function")heardAdd("ground",{sx:G.sx,sy:G.sy,note:"в пещере: "+plant.name},null);   // птица слышит и на планете (хвост M117)
    }
  }else if(C.fauna.some(b=>b.stun<=0&&b.flee<=0&&Math.abs(b.y-C.y)<120)){
    G.prompt=(C.watch>0?"КУСАЧИЕ ДЕРЖАТСЯ ПООДАЛЬ · ЗДЕСЬ ИХ ГОНЯЮТ\n":"КУСАЧИЕ РЯДОМ · ")+
      "ОГОНЬ (F) — ИМПУЛЬС\nОГЛУШЁННОГО ЗАБРАТЬ — ПОДОЙТИ ВПЛОТНУЮ";
  }else if(jetFuel()<.2&&!C.on)G.prompt="РАНЕЦ НА ИСХОДЕ · СЯДЬТЕ, ЗАПАС НАБЕРЁТСЯ";
  else if(C.y>caveGalY(C,C.x)+260)G.prompt="A D — ИДТИ · W — РАНЕЦ · НАХОДКА В ЛЕВОМ КОНЦЕ НИЖНЕЙ ГАЛЕРЕИ";
  /* «У УСТЬЯ ДЕЙСТВИЕ — НАРУЖУ» здесь было справкой, а не действием, но кнопка
     ДЕЙСТВИЕ теперь ищет глагол по всей подсказке — справка зажигала бы её в
     глубине, где жать нечего. Порядок слов переставлен, чтобы образец не совпал. */
  else G.prompt="A D — ИДТИ · W — РАНЕЦ · ШАХТЫ ВЕДУТ ВНИЗ · НАРУЖУ — ДЕЙСТВИЕ У УСТЬЯ";
}
/* ── порода тайлом: клетки поля в прямоугольники, контур по «марширующим
   квадратам» для скоса углов и мокрого блика, материал планеты, темнота к
   глубине. wx0/wy0 — мировое начало тайла ── */
function caveContour(C,wx0,wy0){
  const CS=CAVE_CS,NX=CAVE_NX,NY=CAVE_NY,g=C.g;
  const P=new Path2D();
  const cx0=Math.floor(wx0/CS)-1,cx1=Math.floor((wx0+TILE)/CS);
  const cy0=Math.floor((wy0-CAVE_Y0)/CS)-1,cy1=Math.floor((wy0+TILE-CAVE_Y0)/CS);
  const at=(cx,cy)=>(cx<0||cx>=NX||cy<0||cy>=NY)?1:g[cy*NX+cx];
  /* попутно собираются кромки по ориентации (M257): пол — порода снизу,
     пустота сверху (k=3), свод — наоборот (k=12). По ним кладутся капли */
  const fl=[],ce=[];
  for(let cy=cy0;cy<=cy1;cy++)for(let cx=cx0;cx<=cx1;cx++){
    const k=(at(cx,cy)<<3)|(at(cx+1,cy)<<2)|(at(cx+1,cy+1)<<1)|at(cx,cy+1);
    if(k===0||k===15)continue;
    if(k===3)fl.push([cx,cy]);else if(k===12)ce.push([cx,cy]);
    const X=(cx+.5)*CS-wx0,Y=(cy+.5)*CS+CAVE_Y0-wy0,h=CS*.5;
    const T=[X+h,Y],R=[X+CS,Y+h],B=[X+h,Y+CS],L=[X,Y+h];
    const seg=(a,b)=>{P.moveTo(a[0],a[1]);P.lineTo(b[0],b[1]);};
    switch(k){
      case 1:case 14:seg(L,B);break;
      case 2:case 13:seg(B,R);break;
      case 3:case 12:seg(L,R);break;
      case 4:case 11:seg(T,R);break;
      case 5:seg(T,L);seg(B,R);break;
      case 6:case 9:seg(T,B);break;
      case 7:case 8:seg(T,L);break;
      case 10:seg(T,R);seg(L,B);break;
    }
  }
  P.fl=fl;P.ce=ce;
  return P;
}
function drawCaveRock(C,cp,wx0,wy0){
  const CS=CAVE_CS,NX=CAVE_NX,NY=CAVE_NY,g=C.g;
  const P=new Path2D();
  const cx0=Math.floor(wx0/CS),cx1=Math.floor((wx0+TILE-1)/CS);
  const cy0=Math.floor((wy0-CAVE_Y0)/CS),cy1=Math.floor((wy0+TILE-1-CAVE_Y0)/CS);
  for(let cy=cy0;cy<=cy1;cy++){
    let run=null;
    for(let cx=cx0;cx<=cx1+1;cx++){
      const s=cx<=cx1&&((cx<0||cx>=NX||cy<0||cy>=NY)?1:g[cy*NX+cx]);
      if(s&&run===null)run=cx;
      if(!s&&run!==null){P.rect(run*CS-wx0,cy*CS+CAVE_Y0-wy0,(cx-run)*CS,CS);run=null;}
    }
  }
  const K=caveContour(C,wx0,wy0);
  ctx.lineJoin="round";ctx.lineCap="round";
  ctx.fillStyle="#0c1016";ctx.fill(P);
  ctx.strokeStyle="#0c1016";ctx.lineWidth=CS;ctx.stroke(K);
  /* порода той же планеты: без неё пещера — чёрные силуэты, и по ним не
     понять, в чьих недрах игрок находится */
  if(cp){
    const mat=planetMat(cp);
    fillMaterial(mat,wx0,wy0,.30,.18,P);
    /* кромка тоже порода (хвост M136): полоса контура шириной в клетку шла
       плоской краской поверх материала, и у каждой стены был нарисованный
       обвод. Тот же тайл кладётся штрихом по контуру, в мировых координатах,
       чтобы не ехал относительно заливки */
    {
      const KW=new Path2D();KW.addPath(K,new DOMMatrix().translate(wx0,wy0));
      ctx.save();ctx.translate(-wx0,-wy0);
      ctx.strokeStyle=mat;ctx.lineWidth=CS;ctx.globalAlpha=.30;ctx.stroke(KW);
      ctx.restore();
    }
    /* и сразу гасим: тайл рассчитан на освещённую поверхность, под землёй он
       светит как днём и убивает единственное, что есть у пещеры — темноту */
    ctx.fillStyle="rgba(2,4,9,.30)";ctx.fill(P);
    ctx.strokeStyle="rgba(2,4,9,.30)";ctx.lineWidth=CS;ctx.stroke(K);
    /* ── зерно по массиву (M253), манера — по породе (M263, 皴法) ──
       У камня была форма и был свет, но не было МАТЕРИАЛА. Штрихи вдоль поля
       направлений (dirAt) дают залегание — а МАНЕРА штриха берётся из
       таблицы CUN: живопись гор веками держит соответствие «камень → кисть»
       (DESIGN-craft §5), и оно годится как есть. Осадочный мир — длинные
       мягкие волокна (披麻, «пенька»); вулканит — короткие рубленые с
       разбросом (斧劈, «топор»); лёд — ровная светлая лента (折带); песок —
       точечная крошка (雨点). Один и тот же массив на разных мирах теперь
       СДЕЛАН ИЗ РАЗНОГО, и это видно без единой подписи.
       Всё от мировых координат и посева — тайлы стыкуются; печётся в тайл. */
    ctx.save();ctx.clip(P);
    const stp=24,sd=(cp.seed|0);
    const M=CUN[cp.type]||CUN.rocky;
    const gx0=Math.floor(wx0/stp)*stp, gy0=Math.floor(wy0/stp)*stp;
    for(let gy=gy0;gy<wy0+TILE+stp;gy+=stp)for(let gx=gx0;gx<wx0+TILE+stp;gx+=stp){
      const hh=hashi(gx/stp,gy/stp,sd^0x5C4E);
      if((hh&7)<3)continue;
      const jx=gx+((hh>>>3)&15)/15*stp-wx0, jy=gy+((hh>>>7)&15)/15*stp-wy0;
      const light=((hh>>>14)&1);
      if(M.dot){                     /* 雨点: крошка, а не штрих */
        ctx.fillStyle=light?"rgba(190,205,215,"+M.la+")":"rgba(0,0,0,"+M.da+")";
        const q=1+((hh>>>11)&1);
        ctx.fillRect(jx,jy,q,q);
        continue;
      }
      const ang=dirAt(gx,gy,sd+0x11,1/300)+(((hh>>>16)&15)/15-.5)*M.jig;
      const ln=(6+((hh>>>11)&7))*M.ln;
      ctx.strokeStyle=light?"rgba(170,190,210,"+M.la+")":"rgba(0,0,0,"+M.da+")";
      ctx.lineWidth=M.w;
      ctx.beginPath();
      ctx.moveTo(jx-Math.cos(ang)*ln,jy-Math.sin(ang)*ln);
      ctx.lineTo(jx+Math.cos(ang)*ln,jy+Math.sin(ang)*ln);
      ctx.stroke();
    }
    ctx.restore();
  }
  /* с глубиной порода уходит в синюю черноту: по ней видно, насколько ты
     ниже устья, без всяких цифр */
  const dg=ctx.createLinearGradient(0,-wy0,0,CAVE_Y1-wy0);
  dg.addColorStop(0,"rgba(0,1,5,0)");dg.addColorStop(.5,"rgba(0,1,5,.26)");
  dg.addColorStop(1,"rgba(0,1,5,.6)");
  ctx.fillStyle=dg;ctx.fill(P);ctx.strokeStyle=dg;ctx.lineWidth=CS;ctx.stroke(K);
  /* влажный блик по кромке — единственный источник формы в темноте */
  ctx.strokeStyle="rgba(150,200,230,.15)";ctx.lineWidth=1.6;ctx.stroke(K);
  /* ── капли ловят свет (M257, движки — DESIGN-craft §1) ──
     Равномерная линия блика — растяжка; последний свет кладётся ПО СЧЁТУ.
     На горизонтальных кромках вода и стоит: на полу — лужицей, на своде —
     висящей каплей. Немного резких точек двойного тона поверх ровного блика,
     от мировых координат: печётся в тайл, при движении не плывёт. */
  {
    const CS2=CAVE_CS;
    const drop=(cells,dy,cap)=>{
      let put=0;
      for(const q of cells){
        if(put>=cap)break;
        const hh=hashi(q[0],q[1],0xD09);
        if((hh&7)<6)continue;                      /* каждая четвёртая кромка */
        const x=(q[0]+.5)*CS2-wx0+((hh>>>4)&7)-3.5;
        const y=(q[1]+.5)*CS2+CAVE_Y0-wy0+dy;
        ctx.fillStyle="rgba(190,225,245,.55)";
        ctx.fillRect(x,y,1.6,1.6);
        ctx.fillStyle="rgba(150,200,230,.18)";
        ctx.fillRect(x-1,y-1,3.6,3.6);
        put++;
      }
    };
    drop(K.fl||[],-1.2,10);                        /* лужицы на полу */
    drop(K.ce||[],CS2*.5+.4,7);                    /* капли под сводом */
  }
}
/* дальняя стена: пустота пещеры не чёрная — за проходом вторая стенка, темнее
   и без блика. Слой на весь экран, пятна от шума */
/* ── дальняя стена ДВИЖЕТСЯ (M246) ──
   Слой был экранным: гроздь пятен, приклеенная к стеклу и не двигавшаяся
   вообще. Из-за этого у пещеры не было ни глубины, ни ощущения хода — идёшь,
   а задник стоит. Теперь это мировой слой в тайлах со своим параллаксом (как
   дальние гряды на поверхности): он ползёт вчетверо медленнее камеры, сложен
   из той же породы, что и стены, и уходит в холод — тёплый фонарь на его фоне
   и даёт кадру вторую температуру. */
function drawCaveFar(C,camx,camy){
  const cp=(G.surf&&G.surf.p)||null;
  C.farT=tileStore(C.farT,"cavefar|"+(C.seed&0xff)+"|"+(cp?cp.seed:0)+"|"+DPR);
  drawTiles(C.farT,camx*.38,camy*.38,(g,wx0,wy0)=>{
    ctx.fillStyle="#070b11";ctx.fillRect(0,0,TILE,TILE);
    const R=rng(hashi(Math.floor(wx0/TILE),Math.floor(wy0/TILE),0xCA7E));
    /* дальние массивы породы: крупные силуэты, а не равномерная сыпь */
    for(let i=0;i<7;i++){
      const x=R()*TILE,y=R()*TILE,r=60+R()*140;
      ctx.fillStyle="rgba(15,21,31,"+(.35+R()*.3).toFixed(2)+")";
      ctx.beginPath();ctx.ellipse(x,y,r,r*(.4+R()*.35),R()*3,0,TAU);ctx.fill();
    }
    /* колонны от пола до свода: по ним и читается, что там ещё пещера */
    for(let i=0;i<3;i++){
      const x=R()*TILE, w2=8+R()*22;
      ctx.fillStyle="rgba(11,16,24,.55)";
      ctx.beginPath();
      ctx.moveTo(x-w2,0);ctx.lineTo(x+w2,0);
      ctx.lineTo(x+w2*.55,TILE);ctx.lineTo(x-w2*.55,TILE);
      ctx.closePath();ctx.fill();
    }
    if(cp&&typeof planetMat==="function"&&typeof fillMaterial==="function")
      fillMaterial(planetMat(cp),wx0,wy0,.10,.10);
  });
}
function drawCaveWorld(){
  const C=G.cave;
  if(C.cy==null)C.cy=C.y;
  const camx=C.x-W/2, camy=C.cy-H*.56;
  drawCaveFar(C,camx,camy);
  const cp=G.surf&&G.surf.p;
  C.chunks=tileStore(C.chunks,C.seed+"|"+(cp?cp.seed:0)+"|"+DPR);
  drawTiles(C.chunks,camx,camy,(g,wx0,wy0)=>drawCaveRock(C,cp,wx0,wy0));
  /* положение астронавта на экране: камера догоняет, поэтому он не в центре */
  const px=C.x-camx, py=C.y-11-camy;
  /* убранство: строение раньше материала — натёки уже вылеплены породой выше,
     тут только их силуэт и вода, а свет пойдёт после темноты */
  drawCaveSolid(C,camx,camy);
  drawCaveWater(C,camx,camy);
  drawCaveDark(C,px,py);
  /* дневной свет в устье: единственный холодный свет сверху, по нему видно,
     где выход, даже отвернувшись */
  const mx=60-camx, my=caveGalY(C,60)-camy;
  if(mx>-200&&mx<W+200&&my>-300&&my<H+100){
    ctx.save();ctx.globalCompositeOperation="lighter";
    const lg=ctx.createLinearGradient(0,my-220,0,my+60);
    lg.addColorStop(0,"rgba(150,190,230,.16)");lg.addColorStop(1,"rgba(150,190,230,0)");
    ctx.fillStyle=lg;
    ctx.beginPath();ctx.moveTo(mx-26,my-240);ctx.lineTo(mx+26,my-240);ctx.lineTo(mx+70,my+60);ctx.lineTo(mx-70,my+60);ctx.closePath();ctx.fill();
    ctx.restore();
  }
  /* чужие руки на камне у устья (M210): до света, чтобы дневной луч из устья
     лёг и на них — знак врезан в породу, а не наклеен поверх сцены */
  if(typeof wallDraw==="function"&&wallCount(WALL_C)>0){
    const wx0=CAVE_WALL_X0-camx, wx1=CAVE_WALL_X1-camx;
    if(wx1>-120&&wx0<W+120){
      const fy=caveFloor(C,(CAVE_WALL_X0+CAVE_WALL_X1)/2)-camy;
      wallDraw(WALL_C,wx0,wx1,fy-50,fy-8,"rgba(236,232,214,.66)");
    }
  }
  /* ── свет фонаря на ПОРОДЕ, а не в воздухе (M244) ──
     Пещера была самым мёртвым кадром игры: прибор мерил 0% пары, контраст
     0.11 и 86% пустоты. Причина простая — единственный источник светил в
     пустоту: клин в воздухе, а пол и стены оставались чёрными. Кладём тёплое
     пятно на пол перед ходоком (видно ОСВЕЩЁННОЕ, а не луч) и редкие пылинки
     в самом луче: они и дают воздуху объём. Кристаллы рядом дают холодную
     половину пары — оба источника оказываются в одном кадре. */
  {
    const f=C.face||1, lk=kitStat().lamp;
    ctx.save();ctx.globalCompositeOperation="lighter";
    const pg=ctx.createRadialGradient(px+f*46,py+8,0,px+f*46,py+8,120*lk);
    pg.addColorStop(0,"rgba(255,214,150,.26)");
    pg.addColorStop(.45,"rgba(255,196,120,.10)");
    pg.addColorStop(1,"rgba(255,190,110,0)");
    ctx.fillStyle=pg;
    ctx.beginPath();ctx.ellipse(px+f*46,py+8,120*lk,44*lk,0,0,TAU);ctx.fill();
    /* пыль в луче: восемь крупинок по кругу — воздух виден только так */
    for(let i=0;i<8;i++){
      const ph=(G.t*.004+i*.79)%1;
      const dx=f*(16+ph*96*lk), dy=-14+Math.sin(i*2.1+G.t*.006)*13+ph*20;
      const a=(1-Math.abs(ph-.5)*2)*.22;
      if(a<=0)continue;
      ctx.fillStyle="rgba(255,232,190,"+a.toFixed(3)+")";
      ctx.beginPath();ctx.arc(px+dx,py+dy,.9+ph*1.4,0,TAU);ctx.fill();
    }
    ctx.restore();
  }
  drawCaveGlow(C,camx,camy,px,py);
  /* свой свет пещеры (M248): мох по своду и чужой фонарь на полу */
  if(typeof drawCaveOwnLight==="function")drawCaveOwnLight(C,camx,camy);
  /* дозорные посёлка у устья (хвост M110): их видно, а не только читается
     в подсказке. Те же силуэты с шестом, что на поверхности, и факел */
  if(C.watch>0)for(let i=0;i<2;i++){
    const wxw=118+i*26, wx=wxw-camx, wy=caveFloor(C,wxw)-camy;
    if(wx<-30||wx>W+30||wy<-40||wy>H+40)continue;
    poiGlow(wx+(i?3:-3),wy-20,28,"255,190,110",.16);
    ctx.fillStyle="rgba(20,24,30,.95)";
    ctx.fillRect(wx-1.6,wy-13,3.2,13);
    ctx.beginPath();ctx.arc(wx,wy-15.5,2.6,0,TAU);ctx.fill();
    ctx.strokeStyle="rgba(20,24,30,.95)";ctx.lineWidth=1.4;
    ctx.beginPath();ctx.moveTo(wx+(i?3:-3),wy-19);ctx.lineTo(wx+(i?3:-3),wy);ctx.stroke();
    ctx.fillStyle="rgba(255,206,130,.9)";ctx.fillRect(wx+(i?2:-4),wy-21,2,2.4);
  }
  for(const pl of C.plants){
    const x=pl.x-camx,y=pl.y-camy;if(x<-70||x>W+70||y<-120||y>H+40)continue;
    drawPlant(pl,x,y);
  }
  for(const b of C.fauna){
    const x=b.x-camx,y=b.y-camy;if(x<-50||x>W+50||y<-60||y>H+60)continue;
    drawBeast(b,x,y+b.r*.9,true,b.stun);
  }
  if(!C.found){
    const x=C.findX-camx,y=C.findY-camy;
    if(x>-40&&x<W+40&&y>-40&&y<H+40){
      ctx.fillStyle=Math.sin(G.t*.08)>0?"rgba(255,225,140,.9)":"rgba(255,225,140,.4)";
      ctx.beginPath();ctx.arc(x,y-6,4,0,TAU);ctx.fill();
    }
  }
  ctx.save();ctx.translate(px,py);
  drawAstronaut({face:C.face,amp:C.walkAmp,phase:C.walkPhase,air:!C.on,jet:!!C.jetOn,
    mining:false,suitLow:G.surf.suit<25,lamp:true});
  ctx.restore();
  /* Показания больше не рисуются на канве в левом нижнем углу: там стоят
     DOM-пэды, и текст просвечивал сквозь кнопки (M178). Скафандр и ранец
     живут в строке состояния, галерея и глубина — в строке места (hud()). */
}

/* пещера меряется тем же, чем поверхность (M217): это тот же человек в том же
   мире, и если наверху он занимает свою долю кадра, а под землёй сжимается до
   пикселя, переход читается как смена игры. Приборов на канве здесь нет вовсе —
   всё в DOM, — поэтому масштабируется кадр целиком. */
function drawCave(){
  /* ── камеру ближе НЕ придвинули, и это осознанно (M248) ──
     Третьим пунктом плана было «ближе камера», и она сразу упёрлась в правило
     M217: мерило мира — человек, и один его рост значит одно и то же в шахте,
     на поверхности и в пещере. Набор это сторожит. Ломать правило ради одной
     сцены дороже, чем оно стоит: тесноты добились иначе — сузили галерею
     (44–70 → 30–52), и стены теперь попадают в кадр вместе со сводом. */
  const K=surfScale();
  G.viewK=K;
  withScale(K,drawCaveWorld);
}
