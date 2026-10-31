/* ══════════════ «БУРАН» — ХАЙ-ФРОНТ (hf, M461) ══════════════
   Модернистская плита-сетка, тарелка на крыше, мозаика космонавта; «Б» мертва.
   Проба site/kimi-hotel-buran.html (Kimi может ещё дописывать densify). */
const HB_CX=150,HB_W=270,HB_H=195;
const HB_WALL=[168,166,160],HB_RED=[158,40,36],HB_STEEL=[86,88,92],HB_TILE=[120,40,36];
const HB_DARK=["#10141c","#131722","#0e1219","#151a24"];
const HB_HALO=[.5,.75];
let HB_WINS=null;
function hbWins(){
  if(HB_WINS)return HB_WINS;
  const W=[],CX=HB_CX;
  for(let j=0;j<7;j++)for(let i=0;i<12;i++){
    if(j>=2&&j<=4&&i>=4&&i<=7)continue;   /* мозаика */
    const x=CX-66+i*11,y=48+j*14;
    W.push([x+1.5,y+2,x+7,y+9,j*64+i]);}
  return HB_WINS=W;
}
function* hbPaint(c,e,sd,lit,Lt){
  if(lit){hotelWindows(c,e,hbWins(),sd,true,null,HB_HALO);return;}
  Lt=Lt||{lx:-.86,ly:-.51,K:[1,.88,.54],F:HOTEL_FILL};
  const r=rng((sd^0xB12A)>>>0),sg=Lt.lx>=0?1:-1;
  const C=(base,s,warm)=>rgba(hotelLit(Lt,base,s,warm),1);
  const sF=hotelN(0,Lt),sL=hotelN(-Math.PI/2,Lt),sR=hotelN(Math.PI/2,Lt),sU=hotelUp(Lt);
  const sh=a=>"rgba(4,4,14,"+a.toFixed(2)+")",CX=HB_CX;
  const slab=[CX-72,42,CX+72,42,CX+72,150,CX-72,150];
  hotelRim(c,[slab],1.2);
  yield;
  /* плита корпус */
  {const g=c.createLinearGradient(sg>0?CX-72:CX+72,0,sg>0?CX+72:CX-72,0);
   g.addColorStop(0,C(HB_WALL,sF+.2));g.addColorStop(1,C(HB_WALL,(sg>0?sL:sR)*.5));
   c.fillStyle=g;hotelPoly(c,slab);c.fill();}
  yield;
  /* сетка фасада */
  {c.strokeStyle=C(HB_STEEL,sF*.45);c.lineWidth=.45;
   for(let x=CX-66;x<=CX+66;x+=11){c.beginPath();c.moveTo(x,44);c.lineTo(x,148);c.stroke();}
   for(let y=48;y<=146;y+=14){c.beginPath();c.moveTo(CX-70,y);c.lineTo(CX+70,y);c.stroke();}}
  yield;
  /* мозаика космонавт */
  {const mx=CX-18,my=78;c.fillStyle=C(HB_TILE,sF*.7);c.fillRect(mx,my,36,48);
   for(let i=0;i<40;i++){c.fillStyle=C(i%3?HB_RED:[200,190,170],sF*.5+r()*.2);
     c.fillRect(mx+2+r()*32,my+2+r()*44,2+r()*3,2+r()*3);}
   c.fillStyle=C([220,210,190],sF*.6);c.beginPath();c.arc(mx+18,my+14,6,0,TAU);c.fill();   /* шлем */
   c.fillStyle=sh(.35);c.fillRect(mx+12,my+22,12,18);}
  yield;
  hotelWindows(c,e,hbWins(),sd,false,HB_DARK,HB_HALO);
  yield;
  /* тарелка крыша */
  {c.fillStyle=C(HB_STEEL,sU+.25);c.fillRect(CX-74,36,148,8);
   c.fillStyle=C(HB_STEEL,sF*.55);c.beginPath();c.ellipse(CX+40,28,16,5,-.3,0,TAU);c.fill();
   c.fillStyle=sh(.25);c.beginPath();c.ellipse(CX+38,29,10,3,-.3,0,TAU);c.fill();
   c.strokeStyle=C(HB_STEEL,sF*.5);c.lineWidth=.8;c.beginPath();c.moveTo(CX+40,36);c.lineTo(CX+40,28);c.stroke();}
  yield;
  /* вывеска Буран */
  {c.fillStyle=C([210,202,188],sF+.1);c.fillRect(CX-36,24,72,10);
   c.fillStyle=C(HB_RED,sF*.8);c.fillRect(CX-36,24,72,1.1);}
  yield;
  /* вход / причал */
  {c.fillStyle=C(HB_WALL,sF);c.fillRect(CX-14,148,28,12);
   c.fillStyle=HB_DARK[0];c.fillRect(CX-5,150,10,8);
   hotelDock(c,e,CX-52,154,72,168,sd,Lt);}
  yield;
  /* швы заклёпки + антенны плиты (с пробы) */
  {for(let i=0;i<18;i++){c.fillStyle=C(HB_STEEL,sF*.4);
    c.fillRect(CX-65+r()*130,50+r()*90,1.4,.5);}
   for(const x of[CX-50,CX-20,CX+10,CX+55]){c.strokeStyle=C(HB_STEEL,sF*.5);c.lineWidth=.7;
     c.beginPath();c.moveTo(x,36);c.lineTo(x,24);c.stroke();hotelLamp(c,e,x,24,.3,[255,70,50],.65);}
   c.fillStyle=C(HB_STEEL,sF*.55);c.fillRect(CX-8,150,16,2); /* порог */
   for(let i=0;i<6;i++){c.fillStyle=C(HB_STEEL,sF*.35);c.fillRect(CX-68,48+i*16,4,2);c.fillRect(CX+64,48+i*16,4,2);}}
}
HOTEL_T.hf={W:HB_W,H:HB_H,PX:2,ax:HB_CX,ay:HB_H/2,sign:[HB_CX,28,11],sheen:[HB_CX,28,26],halo:HB_HALO,wins:hbWins,paint:hbPaint};
