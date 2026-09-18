/* ══════════════ по великану на рукав (M464, DESIGN-life) ══════════════
   У каждого рукава и у ядра — одно колоссальное сооружение, в 20–50 раз
   больше корабля, названное голосом галактики. Место — география, а не
   война: земли держав ходят по летописи, великан стоит, где стоял. Шесть —
   по кругу диска на 18–26 секторах (у звезды, ближайшей к расчётной точке),
   седьмой — полая луна у ядра. На карте — ориентир с именем, в системе —
   само тело, далеко от звезды. Мир не трогается: только starAt, без бросков.
   (Кольцо, M154, — не из их числа.) */
const GIANTS_DEF=[
  {k:"moon",  by:null,ru:"Полая луна «Гнездо»",   note:"в недрах — шахтёрский посёлок, огни кольцами"},
  {k:"house", by:"gt",ru:"Дом водителя",          note:"гостиница ГЛАВТРАССЫ размером со станцию"},
  {k:"cyl",   by:"co",ru:"Цилиндр Компании",      note:"логотип во всю длину, видно с соседних систем"},
  {k:"customs",by:"or",ru:"Таможенный город",     note:"каждое здание — форма"},
  {k:"dock",  by:"km",ru:"Сухой док Коммуны",     note:"один корпус строят триста лет"},
  {k:"town",  by:"ra",ru:"Посёлок в камнях",      note:"город Рассвета врос в пояс"},
  {k:"garden",by:"hf",ru:"Сад ретрансляторов",    note:"лес мачт Хай-Фронта, мигает вразнобой"}
];
let GIANTS=null;
function giantsAll(){
  if(GIANTS)return GIANTS;
  GIANTS=[];
  GIANTS_DEF.forEach((D,i)=>{
    const a=i?(i-1)*Math.PI/3+.35:0,R=i?18+((i*37)%9):3;
    const tx=Math.round(Math.cos(a)*R),ty=Math.round(Math.sin(a)*R);
    let best=null,bd=1e9;
    for(let dx=-4;dx<=4;dx++)for(let dy=-4;dy<=4;dy++){
      const sx=tx+dx,sy=ty+dy;if(!starAt(sx,sy))continue;
      const d=dx*dx+dy*dy;if(d<bd){bd=d;best=[sx,sy];}
    }
    if(best)GIANTS.push({...D,sx:best[0],sy:best[1],seed:hashi(best[0],best[1],0x61A7)>>>0});
  });
  return GIANTS;
}
function giantAt(sx,sy){for(const g of giantsAll())if(g.sx===sx&&g.sy===sy)return g;return null;}
/* в системе: далеко от звезды, по зерну */
function giantPos(g){const a=(g.seed%628)/100,R=2600;return {x:Math.cos(a)*R,y:Math.sin(a)*R,a};}
/* ── карта: ориентир ── */
function drawGiantsMap(V,cell){
  const vx=V.x,vy=V.y;
  ctx.save();ctx.textAlign="center";
  for(const g of giantsAll()){
    const x=W/2+(g.sx-vx)*cell,y=H/2+(g.sy-vy)*cell;
    if(x<-60||x>W+60||y<-60||y>H+60)continue;
    const r=Math.max(5,cell*.32);
    ctx.strokeStyle="rgba(240,220,170,.85)";ctx.lineWidth=1.5;
    ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();
    ctx.beginPath();ctx.moveTo(x-r*1.6,y);ctx.lineTo(x-r*1.1,y);ctx.moveTo(x+r*1.1,y);ctx.lineTo(x+r*1.6,y);
    ctx.moveTo(x,y-r*1.6);ctx.lineTo(x,y-r*1.1);ctx.moveTo(x,y+r*1.1);ctx.lineTo(x,y+r*1.6);ctx.stroke();
    if(cell>=10){ctx.fillStyle="rgba(240,220,170,.9)";ctx.font=(typeof uiFont==="function")?uiFont(9):"9px monospace";ctx.fillText(g.ru.toUpperCase(),x,y+r*1.8+11);}   /* под знаком: над ним — имя системы */
  }
  ctx.restore();
}
/* ── система: само тело. Размер — в единицах мира, не экрана ── */
function drawGiant(zx,zy,Z){
  const g=giantAt(G.sx,G.sy);if(!g)return;
  const P=giantPos(g),x=zx(P.x),y=zy(P.y),S=Z;
  const span=900*S;
  if(x<-span||x>W+span||y<-span||y>H+span)return;
  const r=rng(g.seed),t=G.t/60;
  ctx.save();ctx.translate(x,y);
  const lit=(a)=>"rgba(255,214,150,"+a+")";
  if(g.k==="moon"){
    const R=520*S;ctx.fillStyle="#2a2622";ctx.beginPath();ctx.arc(0,0,R,0,TAU);ctx.fill();
    ctx.fillStyle="#0c0b0a";ctx.beginPath();ctx.arc(R*.2,-R*.1,R*.42,0,TAU);ctx.fill();   /* устье полости */
    for(let k=1;k<=4;k++){ctx.strokeStyle=lit(.5-k*.08);ctx.lineWidth=Math.max(1,2*S);ctx.beginPath();ctx.arc(R*.2,-R*.1,R*.1*k,0,TAU);ctx.stroke();}
  }else if(g.k==="house"){
    const w=900*S,h=420*S;ctx.fillStyle="#3a3630";ctx.fillRect(-w/2,-h/2,w,h);
    for(let i=0;i<30;i++)for(let j=0;j<12;j++)if(r()<.6){ctx.fillStyle=lit(.75);ctx.fillRect(-w/2+w*(i+.3)/30,-h/2+h*(j+.3)/12,w/60,h/30);}
    ctx.fillStyle="#d8c9a0";ctx.font="bold "+Math.max(8,40*S)+"px ui-monospace,monospace";ctx.textAlign="center";ctx.fillText("ДОМ ВОДИТЕЛЯ",0,-h/2-14*S);
  }else if(g.k==="cyl"){
    const w=1400*S,h=260*S;ctx.fillStyle="#e8eaee";ctx.beginPath();ctx.ellipse(0,0,w/2,h/2,0,0,TAU);ctx.fill();
    ctx.fillStyle="#2f6fd0";ctx.font="bold "+Math.max(8,120*S)+"px sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("КОМПАНИЯ™",0,0);
  }else if(g.k==="customs"){
    for(let i=0;i<40;i++){const bx=(r()-.5)*1000*S,by=(r()-.5)*600*S,bw=(40+r()*90)*S,bh=(60+r()*120)*S;
      ctx.fillStyle="#d9d4c4";ctx.fillRect(bx,by,bw,bh);ctx.strokeStyle="#6a6458";ctx.lineWidth=Math.max(.5,S);
      for(let l=1;l<5;l++){ctx.beginPath();ctx.moveTo(bx+4*S,by+bh*l/5);ctx.lineTo(bx+bw-4*S,by+bh*l/5);ctx.stroke();}}   /* здания-формы в линейку */
  }else if(g.k==="dock"){
    const w=1300*S,h=380*S;ctx.strokeStyle="#8a8070";ctx.lineWidth=Math.max(1,6*S);ctx.strokeRect(-w/2,-h/2,w,h);
    for(let i=1;i<14;i++){ctx.beginPath();ctx.moveTo(-w/2+w*i/14,-h/2);ctx.lineTo(-w/2+w*i/14,h/2);ctx.stroke();}
    ctx.fillStyle="#4a4640";ctx.beginPath();ctx.ellipse(-w*.05,0,w*.38,h*.22,0,0,TAU);ctx.fill();   /* корпус, которому триста лет */
  }else if(g.k==="town"){
    for(let i=0;i<26;i++){const bx=(r()-.5)*1100*S,by=(r()-.5)*700*S,br=(40+r()*110)*S;
      ctx.fillStyle="#3b342c";ctx.beginPath();ctx.arc(bx,by,br,0,TAU);ctx.fill();
      for(let l=0;l<4;l++)if(r()<.7){ctx.fillStyle=lit(.8);ctx.fillRect(bx+(r()-.5)*br,by+(r()-.5)*br,5*S+1,5*S+1);}}
  }else if(g.k==="garden"){
    for(let i=0;i<60;i++){const bx=(r()-.5)*1100*S,by=(r()-.5)*700*S,hh=(80+r()*260)*S;
      ctx.strokeStyle="#7d8a99";ctx.lineWidth=Math.max(.6,2*S);ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx,by-hh);ctx.stroke();
      const on=((t*2+i*.37)%1)<.5;ctx.fillStyle=on?"rgba(140,220,255,.95)":"rgba(60,90,110,.6)";ctx.beginPath();ctx.arc(bx,by-hh,Math.max(1.5,5*S),0,TAU);ctx.fill();}
  }
  ctx.restore();
  /* имя — над телом, в пикселях экрана */
  ctx.save();ctx.fillStyle="rgba(240,220,170,.85)";ctx.font=(typeof uiFont==="function")?uiFont(10):"10px monospace";ctx.textAlign="center";
  ctx.fillText(g.ru.toUpperCase(),x,y-Math.min(H*.4,560*S)-10);ctx.restore();
}
/* прилёт: первая встреча — строка */
function giantArrive(){
  const g=giantAt(G.sx,G.sy);if(!g)return;
  G.giantsSeen=G.giantsSeen||{};
  if(G.giantsSeen[g.k])return;
  G.giantsSeen[g.k]=1;
  logAdd("good","Великан: "+g.ru+" — "+g.note);
}
