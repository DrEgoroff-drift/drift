/* ══════════════ перевал: корабль, к которому ходят на поклон ══════════════
   M144-pass. Глухой уезд, куда почти никто не летает: дорого и незачем (06c,
   `pass`, игла курсографа). На окраине — посёлки со странными привычками;
   потом прибор, который держат за святыню и «кормят»; потом язык, где
   руководство по эксплуатации стало литургией, а список экипажа — именами
   святых.

   ЯДРО — САМ КОРАБЛЬ, к которому ходят паломники. Внутри всё цело и целиком
   понятно ВАМ — и целиком непонятно им, хотя они из него вышли.
   Свет можно включить. Это будет самое большое, что здесь случилось за век.
   РАЗВИЛКА БЕЗ ПРАВИЛЬНОГО ОТВЕТА: объяснить — отнять у них единственное, что
   держало их вместе; не объяснить — оставить как есть. Игра не подсказывает
   и не награждает.

   ПРАВИЛА ФАЙЛА:
   1. Ни награды, ни подсказки. Ни за свет, ни за объяснение, ни за молчание.
   2. Хранится G.pass={lit,told}. */

function passAll(){return (G.pass||(G.pass={lit:0,told:0}));}
function passDepthAt(sx,sy){
  if(typeof regionAt!=="function")return 0;
  const R=regionAt(sx,sy);
  if(R.theme!=="pass")return 0;
  return (R.core.sx===sx&&R.core.sy===sy)?2:1;
}
function passDepthHere(){return passDepthAt(G.sx,G.sy);}
function passCorePlanet(sys){
  if(!sys||passDepthAt(sys.sx,sys.sy)!==2)return null;
  const ps=sys.planets||[];
  return ps.find(p=>typeof settleCanLive==="function"&&settleCanLive(p))||ps.find(p=>p.type!=="gas")||null;
}
function passIsCore(p){const c=passCorePlanet(G.sys);return !!(c&&p&&c.idx===p.idx);}
/* корабль стоит за посёлком, на четыреста шагов дальше по ходу */
function passShipX(tr,p){
  const sx=(typeof settleSpotX==="function"&&settleCanLive(p))?settleSpotX(p,tr):tr.W*.5;
  return clamp(sx+420,300,tr.W-300);
}
function passGroundLine(){
  const d=passDepthHere();
  if(!d)return null;
  const P=passAll();
  if(d===1)return "Прибор на площади кормят. Руководство по эксплуатации поют.";
  if(P.told)return "Руководство больше не поют. По домам разошлись молча.";
  if(P.lit)return "В корабле горит свет. Они стоят и смотрят. Сто лет так не стояли.";
  return "Корабль. Они из него вышли и не знают, что это.";
}
function passAtShip(S){return !!(S&&passIsCore(S.p)&&Math.abs(S.x-passShipX(S.tr,S.p))<44);}
function passAtVillage(S){return !!(S&&passIsCore(S.p)&&settleCanLive(S.p)&&Math.abs(S.x-settleSpotX(S.p,S.tr))<44);}
function passLight(){
  const P=passAll();if(P.lit)return false;
  P.lit=1;
  logAdd("dim","Свет зажёгся. Самое большое, что здесь случилось за век.");
  return true;
}
function passTell(){
  const P=passAll();if(!P.lit||P.told)return false;
  P.told=1;
  logAdd("dim","Объяснили. Они слушали. Потом пошли по домам. Литургии больше нет.");
  return true;
}
/* ── вид ──
   Корпус в грунте: длинное тело, киль, ряд иллюминаторов. Свет — когда включён.
   Паломники — три фигуры у трапа, пока не объяснили.
   G6: корабль стоит под тем же солнцем, что грунт (placeShade, 11va): бок к
   звезде тёплый, от неё — в тени, низ ушёл в землю и затенён. У вещи четыре
   слоя: завод (обшивка листами, заклёпочные швы), служба (потёки ржавчины
   из-под иллюминаторов), ремонт (лист чужого цвета на борту) — и за век
   стоянки грунт намело к днищу. Иллюминаторы — стекло в латунном кольце:
   днём в нём небо, со светом — тёплое окно, и оно СВЕТИТ на грунт и на людей
   у трапа (placeLamp). */
function passDraw(tr,camx,camy,p){
  if(!passIsCore(p))return;
  const P=passAll(),x0=passShipX(tr,p),sx=x0-camx;
  if(sx<-260||sx>W+260)return;
  const y=groundAt(tr,x0)-camy;
  const L=190,Hh=46;
  const base=p.T.pal[2].map(v=>Math.round(v*.55+34));
  const hull=()=>{ctx.moveTo(sx-L/2,y-8);ctx.lineTo(sx-L/2+30,y-Hh);ctx.lineTo(sx+L/2-40,y-Hh-6);ctx.lineTo(sx+L/2,y-Hh*.5);ctx.lineTo(sx+L/2-10,y-6);ctx.closePath();};
  if(typeof sdShadow==="function")sdShadow(sx,y,L*.9,Hh);
  /* киль — за корпусом: он дальше от нас */
  const kx=sx+L/2-70;
  placeShade(()=>{ctx.moveTo(kx,y-Hh-2);ctx.lineTo(kx+3,y-Hh-34);ctx.lineTo(kx+14,y-Hh-30);ctx.lineTo(kx+16,y-Hh-4);ctx.closePath();},
    kx,y-Hh-34,kx+16,y-Hh,sdMix(base,[40,44,50],.5),p,0x9A51,{ao:.2});
  placeShade(hull,sx-L/2,y-Hh-6,sx+L/2,y,base,p,0x9A50);
  ctx.save();ctx.beginPath();hull();ctx.clip();
  /* листы обшивки: шов тёмный, под ним волосок света — толщина листа */
  for(let i=1;i<9;i++){
    const xx=sx-L/2+i*L/9;
    ctx.fillStyle="rgba(0,0,0,.20)";ctx.fillRect(xx,y-Hh-8,1,Hh+8);
    ctx.fillStyle="rgba(255,244,220,.07)";ctx.fillRect(xx+1,y-Hh-8,1,Hh+8);
  }
  ctx.fillStyle="rgba(0,0,0,.18)";ctx.fillRect(sx-L/2,y-Hh*.42,L,1);
  /* ремонт: лист чужого цвета — кто-то когда-то чинил, чем было */
  ctx.fillStyle=sdRGB(sdMix(base,[150,120,84],.45));
  ctx.fillRect(sx-L/2+L*5/9+2,y-Hh*.40,L/9-3,Hh*.28);
  ctx.fillStyle="rgba(0,0,0,.25)";
  for(let j=0;j<4;j++)ctx.fillRect(sx-L/2+L*5/9+4+j*((L/9-7)/3),y-Hh*.38,1,1);
  /* век стоянки: грунт намело к днищу */
  const gd=ctx.createLinearGradient(0,y-16,0,y);
  const soil=(p.T.pal[3]||p.T.pal[2]);
  gd.addColorStop(0,rgba(soil,0));gd.addColorStop(1,rgba(soil,.85));
  ctx.fillStyle=gd;ctx.fillRect(sx-L/2,y-16,L,16);
  ctx.restore();
  for(let i=0;i<6;i++){
    const wx=sx-L/2+44+i*22,wy=y-Hh*.66;
    /* служба: потёк из-под рамы */
    const sg=ctx.createLinearGradient(0,wy+3,0,wy+20);
    sg.addColorStop(0,"rgba(120,64,34,.30)");sg.addColorStop(1,"rgba(120,64,34,0)");
    ctx.fillStyle=sg;ctx.fillRect(wx-1.5,wy+3,2.5+(i%3),17);
    /* латунное кольцо */
    ctx.fillStyle="rgba(150,122,70,.95)";ctx.beginPath();ctx.arc(wx,wy,4.4,0,TAU);ctx.fill();
    ctx.fillStyle="rgba(40,30,18,.8)";ctx.beginPath();ctx.arc(wx+.4,wy+.4,3.4,0,TAU);ctx.fill();
    if(P.lit){
      ctx.fillStyle="rgba(255,226,160,.95)";ctx.beginPath();ctx.arc(wx,wy,3.2,0,TAU);ctx.fill();
      ctx.fillStyle="rgba(255,250,232,.9)";ctx.beginPath();ctx.arc(wx-.8,wy-.8,1.2,0,TAU);ctx.fill();
      placeLamp(wx,wy,86,[1,.84,.58],.7,-12);
    }else{
      /* тёмное стекло, в нём — небо */
      ctx.fillStyle="rgba(10,12,16,.92)";ctx.beginPath();ctx.arc(wx,wy,3.2,0,TAU);ctx.fill();
      ctx.fillStyle=rgba(p.T.sky[0],.45);ctx.beginPath();ctx.arc(wx-1,wy-1,1.3,0,TAU);ctx.fill();
    }
  }
  /* трап: сходня со стойками; при свете из люка на неё падает тёплое */
  const tx=sx-L/2+10;
  ctx.strokeStyle="rgba(34,38,44,.95)";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(tx+26,y-22);ctx.lineTo(tx-8,y);ctx.stroke();
  ctx.lineWidth=1;ctx.strokeStyle="rgba(180,170,150,.45)";
  ctx.beginPath();ctx.moveTo(tx+26,y-30);ctx.lineTo(tx-8,y-8);ctx.stroke();
  for(let j=0;j<4;j++){const t=j/3;ctx.beginPath();ctx.moveTo(tx+26-34*t,y-22+22*t);ctx.lineTo(tx+26-34*t,y-30+22*t);ctx.stroke();}
  ctx.fillStyle=P.lit?"rgba(255,214,150,.85)":"rgba(12,14,18,.95)";ctx.fillRect(tx+22,y-30,9,10);   /* люк */
  if(P.lit)placeLamp(tx+26,y-24,150,[1,.8,.52],1,20);
  if(!P.told)for(let i=0;i<3;i++){
    const wx=x0-L/2-14-i*12,ox=wx-camx,oy=groundAt(tr,wx)-camy;
    placeFigure(ox,oy,14.5-(i===1?1.2:0),p);
  }
}
