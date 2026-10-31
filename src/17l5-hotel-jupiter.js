/* ══════════════ «ЮПИТЕР» — КОММУНА (km, M461) ══════════════
   Конструктивизм: красные консоли, стеклянный цилиндр, «Ю» мертва в неоне.
   Проба site/kimi-hotel-jupiter.html. */
const HJ_CX=150,HJ_W=260,HJ_H=200;
const HJ_WALL=[176,170,158],HJ_RED=[170,42,34],HJ_STEEL=[90,88,84],HJ_GLASS=["#0c1218","#101820","#0a1016"];
const HJ_DARK=["#10141c","#131722","#0e1219","#151a24"];
const HJ_HALO=[.55,.8];
let HJ_WINS=null;
function hjWins(){
  if(HJ_WINS)return HJ_WINS;
  const W=[],CX=HJ_CX;
  for(let j=0;j<8;j++)for(let i=0;i<10;i++){ /* цилиндр */
    const a=(-.9+i/9*1.8),x=CX+Math.sin(a)*28,y=40+j*12;
    W.push([x-2.2,y+2,x+2.2,y+8,j*64+i]);}
  for(let j=0;j<4;j++)for(let i=0;i<3;i++){ /* боковые корпуса */
    W.push([CX-70+i*8,70+j*14,CX-64+i*8,78+j*14,500+j*16+i]);
    W.push([CX+46+i*8,70+j*14,CX+52+i*8,78+j*14,600+j*16+i]);}
  return HJ_WINS=W;
}
function* hjPaint(c,e,sd,lit,Lt){
  if(lit){hotelWindows(c,e,hjWins(),sd,true,null,HJ_HALO);return;}
  Lt=Lt||{lx:-.86,ly:-.51,K:[1,.88,.54],F:HOTEL_FILL};
  const r=rng((sd^0x5A1A)>>>0),sg=Lt.lx>=0?1:-1;
  const C=(base,s,warm)=>rgba(hotelLit(Lt,base,s,warm),1);
  const sF=hotelN(0,Lt),sL=hotelN(-Math.PI/2,Lt),sR=hotelN(Math.PI/2,Lt),sU=hotelUp(Lt);
  const sh=a=>"rgba(4,4,14,"+a.toFixed(2)+")",CX=HJ_CX;
  const cyl=hotelArc(CX,100,32,70,0,2*Math.PI,40);
  const left=[CX-78,60,CX-42,60,CX-42,140,CX-78,140],right=[CX+42,60,CX+78,60,CX+78,140,CX+42,140];
  hotelRim(c,[cyl,left,right],1.25);
  yield;
  /* консоль / опоры */
  for(const s of[-1,1]){c.fillStyle=C(HJ_RED,sF*.85);
    c.fillRect(CX+s*38,130,s*28,8);c.fillRect(CX+s*55,100,8,40);
    c.fillStyle=C(HJ_STEEL,sF*.5);for(let i=0;i<4;i++)c.fillRect(CX+s*40+s*i*6,132,3,4);}
  yield;
  /* стеклянный цилиндр */
  {const g=c.createLinearGradient(sg>0?CX-32:CX+32,0,sg>0?CX+32:CX-32,0);
   g.addColorStop(0,C(HJ_WALL,sF+.15));g.addColorStop(.45,"rgba(20,28,36,.92)");g.addColorStop(1,C(HJ_WALL,(sg>0?sL:sR)*.4));
   c.fillStyle=g;hotelPoly(c,cyl);c.fill();
   c.strokeStyle=C(HJ_RED,sF*.7);c.lineWidth=1.2;
   for(let y=45;y<155;y+=14){c.beginPath();c.ellipse(CX,y,30,4,0,0,TAU);c.stroke();}}
  yield;
  /* корпуса */
  for(const p of[left,right]){const g=c.createLinearGradient(p[0],0,p[2],0);
    g.addColorStop(0,C(HJ_WALL,sF+.1));g.addColorStop(1,C(HJ_WALL,sF*.5));
    c.fillStyle=g;hotelPoly(c,p);c.fill();
    c.fillStyle=C(HJ_RED,sF*.8);c.fillRect(Math.min(p[0],p[2]),p[1],Math.abs(p[2]-p[0]),2.2);}
  yield;
  hotelWindows(c,e,hjWins(),sd,false,HJ_DARK,HJ_HALO);
  yield;
  /* вывеска Юпитер (Ю мертва — HOTEL_SIGN) */
  {c.fillStyle=C([210,200,180],sF+.1);c.fillRect(CX-40,22,80,12);
   c.fillStyle=C(HJ_RED,sF*.8);c.fillRect(CX-40,22,80,1.2);}
  yield;
  /* крыша / карниз */
  {c.fillStyle=C(HJ_STEEL,sU+.3);c.beginPath();c.ellipse(CX,36,34,6,0,0,TAU);c.fill();
   for(const x of[CX-20,CX,CX+20])hotelLamp(c,e,x,32,.4,[255,90,60],.7);}
  yield;
  /* вход / причал */
  {c.fillStyle=C(HJ_WALL,sF);c.fillRect(CX-10,145,20,14);
   c.fillStyle=HJ_DARK[1];c.fillRect(CX-4,148,8,9);
   hotelDock(c,e,CX-48,152,68,168,sd,Lt);}
  yield;
  /* швы заклёпки + стойки цилиндра (с пробы) */
  {for(let i=0;i<16;i++){const a=i/16*TAU;c.fillStyle=C(HJ_STEEL,sF*.45);
    c.fillRect(CX+Math.cos(a)*31-.4,100+Math.sin(a)*68-.4,.8,.8);}
   for(let y=50;y<150;y+=18){c.fillStyle=C(HJ_RED,sF*.6);c.fillRect(CX-34,y,4,3);c.fillRect(CX+30,y,4,3);}
   c.fillStyle=C(HJ_STEEL,sU+.2);c.beginPath();c.ellipse(CX,38,18,4,0,0,TAU);c.fill();
   for(const s of[-1,1]){c.strokeStyle=C(HJ_STEEL,sF*.4);c.lineWidth=.6;
     c.beginPath();c.moveTo(CX+s*32,140);c.lineTo(CX+s*70,155);c.stroke();}}
}
HOTEL_T.km={W:HJ_W,H:HJ_H,PX:2,ax:HJ_CX,ay:HJ_H/2,sign:[HJ_CX,26,12],sheen:[HJ_CX,26,28],halo:HJ_HALO,wins:hjWins,paint:hjPaint};
