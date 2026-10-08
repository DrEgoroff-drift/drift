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
  /* ── плотность на разрезе: знак — тот же, что у сетки, где до грани больше клетки ── */
  let n=0,bad=0,seen=0,rocks=0;const why=[];
  for(let k=0;n<400&&k<40000;k++){
    const cx=2+((k*7919)%(CAVE_NX-4)),cy=1+((k*104729)%(CAVE_NY-2)),i=cy*CAVE_NX+cx;
    if(Math.abs(F.raw[i])<cell)continue;
    seen++;
    const x=(cx+.5)*CAVE_CS,y=CAVE_Y0+(cy+.5)*CAVE_CS,solid=caveSolidAt(C,x,y);
    if(solid)rocks++;
    const d=cave3Den(F,x/CAVE_PPM,-y/CAVE_PPM,0);
    if((d>0)!==solid){bad++;if(why.length<4)why.push([x|0,y|0,solid,+d.toFixed(2)]);}
    n++;
  }
  eq(n,400,"четыреста клеток дальше клетки от грани");
  ok(rocks>40&&rocks<n-40,"среди них и камень, и пустота: камня "+rocks);
  ok(bad<=4,"плотность на разрезе согласна с caveSolidAt: расходятся "+bad+" из "+n+" "+JSON.stringify(why));
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
    rv++;if(Math.abs(at(V[o]*CAVE_PPM,-V[o+1]*CAVE_PPM))>3*cell)far++;
  }
  ok(rv>0&&far<=rv*.03,"порода у разреза стоит на гранях сетки: дальше трёх клеток "+far+" из "+rv);
  /* ── объектив: человек не мельче доли кадра; окно на линии ходьбы — мерка игры ── */
  ok(cave3ManShare(1920/1080)>=.11,"широкий кадр: человек "+cave3ManShare(1920/1080).toFixed(3)+" высоты");
  ok(cave3ManShare(390/844)>=.11,"высокий кадр: человек "+cave3ManShare(390/844).toFixed(3)+" высоты");
  const Ls=cave3Lens(1.6,10,2,0),p=[10,2,CAVE3_Z,1],v=Ls.vp,cy=(v[1]*p[0]+v[5]*p[1]+v[9]*p[2]+v[13])/(v[3]*p[0]+v[7]*p[1]+v[11]*p[2]+v[15]);
  ok(Math.abs(cy-(-1+2*Ls.f))<1e-3,"ноги стоят на линии ходьбы кадра: "+cy.toFixed(4));
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
