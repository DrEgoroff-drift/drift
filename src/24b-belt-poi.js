/* ══════════════ ориентиры в поясе ══════════════ */
/* Пояс был однородным полем камней: сотня астероидов, отличающихся только
   размером. Летать в нём некуда — куда ни повернись, одно и то же.

   Теперь на пояс приходится две-четыре крупные вещи, детерминированные от его
   seed: остов корабля, добычной комплекс, обломок станции, друза кристаллов,
   гигантский астероид с чёрным устьем. Они видны с большого расстояния и
   работают как ориентиры — по ним пояс запоминается.

   Рисуются они плоскими силуэтами, но попадают в тот же буфер, что и грани
   скал, и сортируются вместе с ними по глубине. Иначе конструкция всплывала бы
   поверх камня, за которым на самом деле стоит. */
const BELT_POI=[
  {k:"wreck", ru:"ОСТОВ",       w:1.2, s:[150,320]},
  {k:"rig",   ru:"КОМПЛЕКС",    w:1.0, s:[130,260]},
  {k:"ring",  ru:"ОБЛОМОК СТАНЦИИ",w:.8,s:[180,380]},
  {k:"drusa", ru:"ДРУЗА",       w:1.0, s:[110,240]},
  {k:"maw",   ru:"УСТЬЕ",       w:.9,  s:[240,460]}
];
function genBeltPOI(B,ast){
  const r=rng((B.seed^0x8E17)>>>0);
  const out=[];
  const n=2+Math.floor(r()*3);
  for(let i=0;i<n;i++){
    let tot=0;for(const q of BELT_POI)tot+=q.w;
    let pick=r()*tot,K=BELT_POI[0];
    for(const q of BELT_POI){pick-=q.w;if(pick<=0){K=q;break;}}
    const size=K.s[0]+r()*(K.s[1]-K.s[0]);
    /* ставим подальше от старта и друг от друга: две достопримечательности
       в одной точке гасят друг друга */
    let x=0,y=0,z=0;
    for(let t=0;t<30;t++){
      x=(r()-.5)*1.7*BELT_HALF;y=(r()-.5)*620;z=(r()-.5)*1.7*BELT_HALF;
      if(Math.hypot(x,y,z)<AST_MIN*2.2)continue;
      if(out.some(q=>Math.hypot(q.x-x,q.y-y,q.z-z)<1400))continue;
      break;
    }
    out.push({k:K.k,ru:K.ru,x,y,z,size,seed:(r()*1e9)|0,
      spin:(r()-.5)*.004, ph:r()*TAU});
    /* расчищаем место: камни внутри конструкции торчали бы сквозь неё */
    for(let j=ast.length-1;j>=0;j--){
      const a=ast[j];
      if(Math.hypot(a.x-x,a.y-y,a.z-z)<size*1.5)ast.splice(j,1);
    }
  }
  return out;
}
/* силуэт ориентира. Масштаб приходит из проекции, поэтому одна и та же функция
   работает и в километре, и в упор. */
function drawBeltPOISprite(q,px,py,sc,fog){
  const S=q.size*sc;
  if(S<3)return;
  const r=rng(q.seed);
  const ang=q.ph+G.t*q.spin;
  const dim=(k)=>{
    const v=Math.round(k*fog*255);
    return "rgb("+v+","+Math.round(v*1.03)+","+Math.round(v*1.12)+")";
  };
  ctx.save();
  ctx.translate(px,py);
  ctx.rotate(ang);
  if(q.k==="wreck"){
    /* корпус переломлен: две части под углом, между ними разрыв со шпангоутами */
    const L=S*1.9,bw=S*.34;
    for(const part of [-1,1]){
      ctx.save();
      ctx.translate(part*L*.28,0);ctx.rotate(part*.16);
      ctx.beginPath();
      ctx.moveTo(-L*.28,-bw*.5);ctx.lineTo(L*.26,-bw*.42);
      ctx.lineTo(L*.3,bw*.3);ctx.lineTo(-L*.3,bw*.44);
      ctx.closePath();
      ctx.fillStyle=dim(.34);ctx.fill();
      ctx.strokeStyle=dim(.13);ctx.lineWidth=1;ctx.stroke();
      /* ряд иллюминаторов: часть ещё горит, и это единственный тёплый свет */
      for(let i=0;i<7;i++){
        const on=((q.seed>>>(i%13))&7)===0;
        ctx.fillStyle=on?"rgba(255,206,140,"+(.85*fog).toFixed(2)+")":dim(.10);
        ctx.fillRect(-L*.22+i*L*.075,-bw*.18,Math.max(1,S*.022),Math.max(1,S*.016));
      }
      ctx.restore();
    }
    ctx.strokeStyle=dim(.2);ctx.lineWidth=Math.max(1,S*.02);
    for(let i=0;i<4;i++){
      const xx=(i-1.5)*S*.1;
      ctx.beginPath();ctx.moveTo(xx,-bw*.34);ctx.lineTo(xx,bw*.3);ctx.stroke();
    }
  }else if(q.k==="rig"){
    /* добычной комплекс: ферма с бункерами и работающим буром */
    ctx.strokeStyle=dim(.3);ctx.lineWidth=Math.max(1,S*.035);
    ctx.beginPath();ctx.moveTo(-S,0);ctx.lineTo(S,0);ctx.stroke();
    ctx.lineWidth=Math.max(1,S*.018);
    for(let i=-3;i<=3;i++){
      ctx.beginPath();ctx.moveTo(i*S*.3,-S*.2);ctx.lineTo(i*S*.3+S*.12,S*.2);ctx.stroke();
    }
    for(let i=0;i<3;i++){
      const bx=(i-1)*S*.55, br=S*(.16+((i*29)%4)/4*.1);
      ctx.fillStyle=dim(.28);
      ctx.beginPath();ctx.ellipse(bx,-S*.28,br,br*.8,0,0,TAU);ctx.fill();
      ctx.strokeStyle=dim(.12);ctx.lineWidth=1;ctx.stroke();
    }
    /* бур вращается — по нему видно, что комплекс жив */
    ctx.save();ctx.translate(S*.75,S*.1);ctx.rotate(G.t*.06);
    ctx.fillStyle=dim(.4);
    for(let i=0;i<3;i++){
      const a=i/3*TAU;
      ctx.beginPath();
      ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*S*.24,Math.sin(a)*S*.24);
      ctx.lineTo(Math.cos(a+.5)*S*.16,Math.sin(a+.5)*S*.16);
      ctx.closePath();ctx.fill();
    }
    ctx.restore();
    /* проблесковый огонь */
    const bl=Math.pow(Math.max(0,Math.sin(G.t*.05+q.ph)),8);
    if(bl>.03){
      ctx.fillStyle="rgba(120,230,255,"+(.9*bl*fog).toFixed(2)+")";
      ctx.beginPath();ctx.arc(-S*.9,-S*.1,Math.max(1.4,S*.03),0,TAU);ctx.fill();
    }
  }else if(q.k==="ring"){
    /* разорванное кольцо станции: две трети дуги и торчащие спицы */
    ctx.strokeStyle=dim(.3);ctx.lineWidth=Math.max(1.5,S*.11);
    ctx.beginPath();ctx.arc(0,0,S*.82,.5,.5+Math.PI*1.35);ctx.stroke();
    ctx.strokeStyle=dim(.16);ctx.lineWidth=Math.max(1,S*.03);
    for(let i=0;i<6;i++){
      const a=.6+i*.42;
      ctx.beginPath();ctx.moveTo(Math.cos(a)*S*.24,Math.sin(a)*S*.24);
      ctx.lineTo(Math.cos(a)*S*.78,Math.sin(a)*S*.78);ctx.stroke();
    }
    ctx.fillStyle=dim(.36);
    ctx.beginPath();ctx.arc(0,0,S*.2,0,TAU);ctx.fill();
    /* обрыв: обломки по концам дуги */
    for(let i=0;i<5;i++){
      const a=.5-i*.12, rr=S*(.82+((i*31)%4)/4*.12);
      ctx.fillStyle=dim(.22);
      ctx.beginPath();
      ctx.arc(Math.cos(a)*rr,Math.sin(a)*rr,Math.max(1,S*(.02+((i*17)%3)/3*.03)),0,TAU);
      ctx.fill();
    }
  }else if(q.k==="drusa"){
    /* друза: острые призмы из одной точки, светятся изнутри */
    const n=6+Math.floor(r()*5);
    for(let i=0;i<n;i++){
      const a=i/n*TAU+r()*.3, len=S*(.5+r()*.6), w=S*(.07+r()*.08);
      const tw=.55+.45*Math.pow(Math.max(0,Math.sin(G.t*.02+i*1.7)),4);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a-.4)*w,Math.sin(a-.4)*w);
      ctx.lineTo(Math.cos(a)*len,Math.sin(a)*len);
      ctx.lineTo(Math.cos(a+.4)*w,Math.sin(a+.4)*w);
      ctx.closePath();
      const g=ctx.createLinearGradient(0,0,Math.cos(a)*len,Math.sin(a)*len);
      g.addColorStop(0,"rgba(120,190,220,"+(.5*fog).toFixed(2)+")");
      g.addColorStop(1,"rgba(220,245,255,"+(.75*tw*fog).toFixed(2)+")");
      ctx.fillStyle=g;ctx.fill();
    }
  }else{
    /* устье: гигантский камень с чёрным входом — единственное, что читается
       как «сюда можно войти» */
    ctx.fillStyle=dim(.26);
    ctx.beginPath();
    const nv=11;
    for(let i=0;i<nv;i++){
      const a=i/nv*TAU;
      const rr=S*(.72+((q.seed>>>(i%9))&7)/7*.34);
      if(i===0)ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);
      else ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);
    }
    ctx.closePath();ctx.fill();
    ctx.strokeStyle=dim(.10);ctx.lineWidth=1;ctx.stroke();
    const mg=ctx.createRadialGradient(0,0,0,0,0,S*.42);
    mg.addColorStop(0,"rgba(0,0,0,.98)");
    mg.addColorStop(.7,"rgba(0,0,0,.86)");
    mg.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=mg;
    ctx.beginPath();ctx.ellipse(0,0,S*.42,S*.3,.3,0,TAU);ctx.fill();
    /* огни разметки по кромке устья: кто-то тут уже был */
    for(let i=0;i<5;i++){
      const a=i/5*TAU+.4;
      const bl=.4+.6*Math.pow(Math.max(0,Math.sin(G.t*.03+i)),4);
      ctx.fillStyle="rgba(255,170,110,"+(.7*bl*fog).toFixed(2)+")";
      ctx.beginPath();
      ctx.arc(Math.cos(a)*S*.44,Math.sin(a)*S*.31,Math.max(1,S*.022),0,TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}
