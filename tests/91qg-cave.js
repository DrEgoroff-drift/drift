/* ══════════════ пещера на движке (M630a) ══════════════ */
/* Порода нового вида построена из сетки игры, а не нарисована рядом с ней: камень на разрезе
   там, где caveSolidAt говорит «камень», и пустота там, где игра даёт ходить. Объектив держит
   человека не мельче доли кадра, фонарь светит на свою досягаемость, ?cave=0 оставляет старую
   рисовалку. Настоящий G, настоящая пещера. */
TEST_SUITES.push(()=>suite("пещера на движке: порода по сетке, объектив, фонарь, переключатель",()=>{
  resetWorld();
  landOnTestPlanet();enterCave();
  const C=G.cave;
  if(!ok(G.mode==="cave"&&!!C&&!!C.g,"пещера поднята"))return;
  const F=cave3Field(C),cell=CAVE_CS/CAVE_PPM;
  /* купол (M630b проходы 4–5): свод может уйти выше потолка сетки до трёх метров — камень сетки под таким
     сводом картинке не указ; всё остальное (пол, стены, толща) — по сетке */
  const vaultAt=(x,y)=>{const A=cave3VaultLift(F,x/CAVE_PPM,0);if(A<=0)return false;
    for(let d=.2;d<=A+cell;d+=.2)if(!caveSolidAt(C,x,y+d*CAVE_PPM))return true;return false;};
  /* ── плотность на разрезе и на линии ходьбы: знак — тот же, что у сетки, где до грани больше клетки ── */
  for(const Z of [0,CAVE3_Z]){
    let n=0,bad=0,rocks=0;const why=[];
    for(let k=0;n<400&&k<40000;k++){
      const cx=2+((k*7919)%(CAVE_NX-4)),cy=1+((k*104729)%(CAVE_NY-2)),i=cy*CAVE_NX+cx;
      if(Math.abs(F.raw[i])<cell)continue;
      const x=(cx+.5)*CAVE_CS,y=CAVE_Y0+(cy+.5)*CAVE_CS,solid=caveSolidAt(C,x,y);
      if(solid&&vaultAt(x,y))continue;
      if(solid)rocks++;
      const d=cave3Den(F,x/CAVE_PPM,-y/CAVE_PPM,Z);
      if((d>0)!==solid){bad++;if(why.length<4)why.push([x|0,y|0,solid,+d.toFixed(2)]);}
      n++;
    }
    eq(n,400,"z "+Z+": четыреста клеток дальше клетки от грани");
    ok(rocks>40&&rocks<n-40,"z "+Z+": среди них и камень, и пустота: камня "+rocks);
    ok(bad<=4,"z "+Z+": плотность согласна с caveSolidAt: расходятся "+bad+" из "+n+" "+JSON.stringify(why));
  }
  /* ── линия ходьбы: пол картинки — пол сетки; свод — не ниже потолка сетки и не выше трёх метров над ним ── */
  let fb=0,fn=0,high=0,up=0,low=0;
  for(let cx=4;cx<CAVE_NX-4;cx+=3){
    const x=(cx+.5)*CAVE_CS,X=x/CAVE_PPM,c=caveCeil(C,x),f=caveFloor(C,x);
    if(!(f-c>3*CAVE_CS))continue;
    const Yf=-f/CAVE_PPM,Yc=-c/CAVE_PPM;
    if(caveSolidAt(C,x,f+.3*CAVE_PPM)&&caveSolidAt(C,x,f+.6*CAVE_PPM)){
      fn++;if(!(cave3Den(F,X,Yf-.3,CAVE3_Z)>0&&cave3Den(F,X,Yf+.3,CAVE3_Z)<0))fb++;
    }
    for(const Z of [0,CAVE3_Z,2,3.5]){
      const A=cave3VaultLift(F,X,Z),Yt=Yc+A+1.6;
      if(caveSolidAt(C,x,-Yt*CAVE_PPM)&&caveSolidAt(C,x,-(Yt+1)*CAVE_PPM)&&-Yt*CAVE_PPM>CAVE_Y0+2*CAVE_PPM&&cave3Den(F,X,Yt,Z)<=0)high++;
      if(A>1&&cave3Den(F,X,Yc+A*.5,Z)<0)up++;
      for(const dy of [-.3,.4,A*.5,A+.3]){
        const d1=cave3Den(F,X,Yc+dy,Z),V0=F.vault;
        F.vault=null;
        try{if(d1>cave3Den(F,X,Yc+dy,Z)+1e-6)low++;}finally{F.vault=V0;}
      }
    }
  }
  ok(fn>20&&fb<=fn*.03,"на линии ходьбы пол картинки — пол сетки: расходятся "+fb+" из "+fn);
  ok(high===0,"свод не выше потолка сетки плюс купол: дыр выше "+high);
  ok(up>0,"купол есть: точек под поднятым сводом "+up);
  ok(low===0,"купол не опускает свод и не кладёт камня: "+low);
  /* ── купола у мест (проход 5): у каждого зала и у устья свой; на любом окне линии ходьбы в 12 м свод
     поднимается хоть на полтора метра — там, где над ходом есть толща под купол ── */
  const hasDome=X=>F.vault.some(d=>Math.abs(d.x-X)<4);
  ok(hasDome(F.mouthX)&&caveZones(C).every(z=>hasDome((z.x0+z.x1)/2/CAVE_PPM)),"купол у устья и у середины каждого зала: "+F.vault.length);
  const rise=[];
  for(let X=1;X<CAVE_W/CAVE_PPM-1;X+=.5){
    const x=X*CAVE_PPM,c=caveCeil(C,x),f=caveFloor(C,x),Yc=-c/CAVE_PPM;
    let room=f-c>3*CAVE_CS;
    for(let d=.25;room&&d<=4;d+=.25)if(!caveSolidAt(C,x,c-d*CAVE_PPM)||c-d*CAVE_PPM<CAVE_Y0+1.7*CAVE_PPM)room=false;
    if(!room){rise.push(null);continue;}
    let t=Yc-.6;while(t<Yc+3.5&&cave3Den(F,X,t+.1,CAVE3_Z)<0)t+=.1;
    rise.push(t-Yc);
  }
  let win=0,flat=0,worst=9;
  for(let i=0;i+24<=rise.length;i+=2){
    const w=rise.slice(i,i+24);if(w.some(v=>v==null))continue;
    win++;const m=Math.max(...w);worst=Math.min(worst,m);if(m<1.5)flat++;
  }
  ok(win>20&&flat===0,"в каждом окне 12 м свод поднят на 1,5 м: окон "+win+", плоских "+flat+", худшее "+worst.toFixed(2));
  /* ── дальний объектив (проход 5): в кадре 72 м хоть два световых события — устье, арка, озеро, кристаллы;
     иначе он отходит к ближайшему месту, где они есть, и человек остаётся в кадре ── */
  {
    const hw=CAVE3_LENS.fH*16/9/2,Ev=cave3Events(C,F),seen=c=>cave3FarSeen(Ev,c,hw);
    let n=0,bad=0,sparse=0;const why=[];
    for(let X=10;X<CAVE_W/CAVE_PPM-10;X+=7){
      const s=cave3FarShift(C,F,X,hw);n++;
      let can=false;for(let t=-hw*.6;t<=hw*.6&&!can;t+=1)can=seen(X+t)>=2;
      if(!can){sparse++;continue;}
      if(seen(X+s)<2||Math.abs(s)>hw*.6+1e-6){bad++;if(why.length<3)why.push([X,s,seen(X+s)]);}
    }
    ok(Ev.length>=3&&n>15&&bad===0&&sparse<n/3,"дальний кадр держит два световых события, где они достижимы: событий "+Ev.length+", мест "+n+", без двух "+bad+", пролётов без огней "+sparse+" "+JSON.stringify(why));
  }
  /* ── дальний объектив без неба (M630d): верх кадра даже на задней стене (15 м за линией ходьбы) не выше
     поверхности — над пещерой камень, небо только в устье; человек в кадре ── */
  {
    const L=CAVE3_LENS;let n=0,sky=0,lost=0;const why=[];
    for(let X=6;X<CAVE_W/CAVE_PPM-6;X+=9){
      const fy=-caveFloor(C,X*CAVE_PPM)/CAVE_PPM,Ls=cave3Lens(16/9,X,fy,0,0,0,1,F.surfY),ey=fy+L.eye;
      const back=ey+(Ls.t-ey)*(1+L.fBack/Ls.D);n++;
      if(back>F.surfY+1e-6){sky++;if(why.length<3)why.push([X,+back.toFixed(2),+F.surfY.toFixed(2)]);}
      if(!(Ls.b<fy&&fy+1.8<Ls.t))lost++;
    }
    ok(n>10&&sky===0&&lost===0,"дальний кадр не видит неба над пещерой: мест "+n+", с небом "+sky+", человек вне кадра "+lost+" "+JSON.stringify(why));
  }
  /* ── жила (M631): на разрезе — валик-тело светлой полосы, не рыжий штрих (штрих без тела читался царапиной) ── */
  {
    const its=cave3DressItems(C,F).filter(q=>q.k==="vein");let n=0,orange=0;
    for(const q of its){const b=cave3VeinBody(C,F,plnMesh(1<<12),q.t,rng(1));n+=b.n;if(b.col[0]-b.col[2]>.2)orange++;}
    ok(C.deco.veins.length>0&&its.length===C.deco.veins.length&&n>0&&orange===0,"жила — валик на разрезе: жил "+its.length+", швов "+n+", рыжих "+orange);
  }
  /* ── световые события (M630c): на любых 30 м линии ходьбы что-то светит; пролёт получает тело по породе,
     и оно встаёт в каждой породе: светляки, продух, окно во льду, мокрая стена ── */
  {
    const Ev=cave3Events(C,F),E=CAVE_W/CAVE_PPM,K=CAVE3_GAP;
    let dark=0;const why=[];
    for(let X=0;X+K.win<=E;X+=1)if(!Ev.some(e=>e[1]>X&&e[0]<X+K.win)){dark++;if(why.length<3)why.push(X);}
    ok(C.ev3.gaps.length>0&&dark===0,"на любых 30 м есть световое событие: событий в пролётах "+C.ev3.gaps.length+", тёмных окон "+dark+" "+JSON.stringify(why));
    const items=cave3GapItems(C,F),p=G.surf.p,t0=p.type,res=[];
    try{
      for(const t of ["terran","volcanic","ice","rocky"]){
        p.type=t;let made=0,bodies=0;
        for(const q of items){
          const B={F,m:plnMesh(1<<14),r:rng(q.seed^0x5EED),D:cave3DripSty(F)},L=[],Gl=[];
          cave3GapBuild(B,q,L,Gl);
          if(L.length&&Gl.length)made++;
          if(B.m.ni>=60)bodies++;
        }
        res.push(t+" "+made+"/"+bodies+"/"+items.length);
        ok(items.length>0&&made===items.length&&bodies===items.length,"событие в пролёте встаёт телом и светит: "+t+" "+made+"/"+bodies+" из "+items.length);
      }
    }finally{p.type=t0;}
  }
  /* ── жизнь телами (M630c): растение стоит на полу картинки рядом с полом игры, в мерке карты; ближний
     объектив смотрит на середину между человеком и вещью; кистей поверх кадра для жизни больше нет ── */
  {
    const P=CAVE_PPM,K=CAVE3_LIFE;let n=0,on=0,far=0;const why=[];
    for(const q of C.plants){
      n++;
      const X=q.x/P,Y=-q.y/P,ft=cave3LifeFoot(F,X,Y,[K.plantZ[0]+.4,K.plantZ[0],CAVE3_Z+.25]);
      if(!ft)continue;on++;
      if(Math.abs(ft[0]-Y)>.8||ft[1]<CAVE3_Z){far++;if(why.length<3)why.push([q.x|0,q.y|0,+ft[0].toFixed(2),+Y.toFixed(2),ft[1]]);}
    }
    ok(n>5&&on>=n*.8&&far===0,"растения встают на пол картинки за линией ходьбы: растений "+n+", встали "+on+", далеко от пола игры "+far+" "+JSON.stringify(why));
    const q=C.plants[0],x0=C.x,y0=C.y,sc=q.scanned;
    try{
      q.scanned=false;C.x=q.x-20;C.y=q.y;
      const s=cave3NearShift(C);
      ok(Math.abs(s-10/P)<1e-6,"ближний объектив — на середину между человеком и растением: сдвиг "+s.toFixed(3)+" м");
    }finally{C.x=x0;C.y=y0;q.scanned=sc;}
    ok(!/drawPlant|drawBeast|lifePlantGpu|lifeBeastGpu/.test(String(cave3Over)),"растения и звери не рисуются кистью поверх кадра");
  }
  /* ── сетка куска: лист разреза лежит на камне сетки, порода — у её граней ── */
  const ci=Math.floor(F.mouthX/CAVE3_CH.s)+1,cj=Math.floor((-caveGalY(C,(ci+.5)*CAVE3_CH.s*CAVE_PPM)/CAVE_PPM)/CAVE3_CH.s);
  const m=cave3Chunk(F,ci,cj),V=m.v;
  ok(m.nRock>0&&m.ni>m.nRock,"у куска галереи есть и порода, и лист разреза: "+m.nRock+"/"+(m.ni-m.nRock));
  let cut=0,off=0;
  const at=(x,y)=>F.raw[clamp(Math.floor((y-CAVE_Y0)/CAVE_CS),0,CAVE_NY-1)*CAVE_NX+clamp(Math.floor(x/CAVE_CS),0,CAVE_NX-1)];
  for(let k=m.nRock;k<m.ni;k++){
    const o=m.i[k]*PLN_VS,x=V[o]*CAVE_PPM,y=-V[o+1]*CAVE_PPM;
    cut++;if(at(x,y)<-1.5*cell)off++;
  }
  ok(off<=cut*.02,"лист разреза не заходит в пустоту сетки: мимо "+off+" из "+cut);
  let far=0,rv=0;
  for(let k=0;k<m.nRock;k+=3){
    const o=m.i[k]*PLN_VS;if(V[o+2]>.5)continue;
    if(vaultAt(V[o]*CAVE_PPM,-V[o+1]*CAVE_PPM))continue;
    rv++;if(Math.abs(at(V[o]*CAVE_PPM,-V[o+1]*CAVE_PPM))>3*cell)far++;
  }
  ok(rv>0&&far<=rv*.03,"порода у разреза стоит на гранях сетки: дальше трёх клеток "+far+" из "+rv);
  /* ── объектив: человек не мельче доли кадра; окно на линии ходьбы — мерка игры ── */
  ok(cave3ManShare(1920/1080)>=.11,"широкий кадр: человек "+cave3ManShare(1920/1080).toFixed(3)+" высоты");
  ok(cave3ManShare(390/844)>=.11,"высокий кадр: человек "+cave3ManShare(390/844).toFixed(3)+" высоты");
  const Ls=cave3Lens(1.6,10,2,0),p=[10,2,CAVE3_Z,1],v=Ls.vp,cy=(v[1]*p[0]+v[5]*p[1]+v[9]*p[2]+v[13])/(v[3]*p[0]+v[7]*p[1]+v[11]*p[2]+v[15]);
  ok(Math.abs(cy-(-1+2*Ls.f))<1e-3,"ноги стоят на линии ходьбы кадра: "+cy.toFixed(4));
  /* ── нырок к озеру (M631): ближе 3 м к урезу объектив ныряет; пол кадра — вода без метра, но человек
     в кадре; как вода выглядит в нырнувшем кадре, меряет docs/look/game/cavewater.py ── */
  eq(cave3DiveW({d:2.9,y:0},.5),1,"у уреза (2.9 м) объектив ныряет");
  eq(cave3DiveW({d:3.7,y:0},.5),0,"дальше 3.6 м от уреза — нет");
  eq(cave3DiveW({d:0,y:0},-1.5),0,"под водой глубже метра — нет: там тело воды в разрезе");
  eq(cave3DiveW(null,0),0,"озера в окне нет — нет");
  ok(Math.abs(cave3DiveFloor(.4,-.4,1)+1.4)<1e-9,"пол кадра — уровень воды без метра");
  ok(Math.abs(cave3DiveFloor(5,-.4,1)-1.5)<1e-9,"с высокого уступа пол кадра не ниже 3.5 м под человеком");
  eq(cave3DiveFloor(.4,-.4,0),.4,"без нырка пол кадра — пол человека");
  for(const [fy,wy] of [[.4,-.4],[2.4,0],[5,-.4]]){
    const L2=cave3Lens(16/9,0,cave3DiveFloor(fy,wy,1),0,1,1,0);
    ok(L2.b<wy&&wy<L2.t&&fy+1.9<L2.t,"нырок с пола "+fy+" к воде "+wy+": гладь и человек в кадре ["+L2.b.toFixed(2)+", "+L2.t.toFixed(2)+"]");
  }
  /* ── фонарь: досягаемость по снаряжению в пределах ── */
  eq(cave3Reach(1),18,"фонарь I класса — 18 м");
  ok(cave3Reach(.2)>=12&&cave3Reach(5)<=27,"досягаемость фонаря в 12–27 м");
  /* ── переключатель: снят — старая рисовалка, её мерка ── */
  const on0=CAVE3.on;
  try{
    CAVE3.on=false;drawCave();
    ok(!CAVE3.live,"снятый переключатель: новый вид не рисует");
    eq(G.viewK,surfScale(),"снятый переключатель: мерка старой рисовалки");
  }finally{CAVE3.on=on0;}
}));
