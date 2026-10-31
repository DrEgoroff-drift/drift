/* ══════════════ «ДОМ ПРИЕЗЖИХ № 4» — ОРДНУНГ (or, M461) ══════════════
   Хрущёвки на ферме: два-три корпуса на решётке, живые балконы, все буквы вывески горят;
   в ядре свет гаснет после 22:00 (hotelLitFrac). Проба site/kimi-hotel-dom.html. */
const HO_CX=150,HO_W=270,HO_H=190;
const HO_WALL=[192,184,168],HO_RED=[160,52,40],HO_STEEL=[88,86,82],HO_CREAM=[214,206,188];
const HO_DARK=["#10141c","#131722","#0e1219","#151a24"];
const HO_HALO=[.5,.7];
/* корпуса: [x0,y0,x1,y1] */
const HO_BLOCKS=[[78,48,128,148],[132,42,188,148],[192,55,238,148]];
let HO_WINS=null;
function hoWins(){
  if(HO_WINS)return HO_WINS;
  const W=[];
  for(let bi=0;bi<HO_BLOCKS.length;bi++){const [x0,y0,x1,y1]=HO_BLOCKS[bi],fl=5,cols=4,fh=(y1-y0-8)/fl,cw=(x1-x0-6)/cols;
    for(let j=0;j<fl;j++)for(let i=0;i<cols;i++){
      const wx=x0+3+i*cw,wy=y0+4+j*fh;
      W.push([wx+.4,wy+.5,wx+cw*.55,wy+fh*.55,j*64+i+bi*200]);
    }}
  return HO_WINS=W;
}
function* hoPaint(c,e,sd,lit,Lt){
  if(lit){hotelWindows(c,e,hoWins(),sd,true,null,HO_HALO);return;}
  Lt=Lt||{lx:-.86,ly:-.51,K:[1,.88,.54],F:HOTEL_FILL};
  const r=rng((sd^0x0D04)>>>0),sg=Lt.lx>=0?1:-1;
  const C=(base,s,warm)=>rgba(hotelLit(Lt,base,s,warm),1);
  const sF=hotelN(0,Lt),sL=hotelN(-Math.PI/2,Lt),sR=hotelN(Math.PI/2,Lt),sU=hotelUp(Lt),sD=hotelDn(Lt);
  const sh=a=>"rgba(4,4,14,"+a.toFixed(2)+")",CX=HO_CX;
  /* ферма основание */
  const truss=[];
  for(let i=0;i<24;i++){const t=i/24*2*Math.PI;truss.push(CX+Math.cos(t)*95,162+Math.sin(t)*16*(.7+Math.abs(Math.cos(t))*.3));}
  hotelRim(c,[truss,...HO_BLOCKS.map(([a,b,d,e])=>[a,b,d,b,d,e,a,e])],1.2);
  yield;
  {const g=c.createLinearGradient(0,148,0,180);g.addColorStop(0,C(HO_STEEL,sU+.4));g.addColorStop(1,C([50,48,46],.1));
   c.fillStyle=g;hotelPoly(c,truss);c.fill();
   c.strokeStyle=C(HO_STEEL,sF*.5);c.lineWidth=.7;
   for(let x=70;x<240;x+=18){c.beginPath();c.moveTo(x,158);c.lineTo(x+10,148);c.lineTo(x+20,158);c.stroke();}
   for(let x=80;x<230;x+=28){c.fillStyle=C(HO_STEEL,sF*.6);c.fillRect(x-2,148,4,12);}}
  yield;
  /* корпуса хрущёвок */
  for(const [x0,y0,x1,y1] of HO_BLOCKS){
    const g=c.createLinearGradient(sg>0?x0:x1,0,sg>0?x1:x0,0);
    g.addColorStop(0,C(HO_WALL,sF+.2));g.addColorStop(1,C(HO_WALL,(sg>0?sL:sR)*.55));
    c.fillStyle=g;c.fillRect(x0,y0,x1-x0,y1-y0);
    c.fillStyle=C(HO_RED,sF*.8);c.fillRect(x0,y1-2.5,x1-x0,2.5);
    c.fillStyle=C(HO_CREAM,sU+.15);c.fillRect(x0,y0,x1-x0,2);
  }
  yield;
  /* балконы */
  for(const [x0,y0,x1,y1] of HO_BLOCKS){const fl=5,fh=(y1-y0-8)/fl;
    for(let j=0;j<fl;j++)for(const side of[-1,1]){
      const x=side<0?x0-5:x1,y=y0+4+j*fh+fh*.2;
      if(r()<.25)continue;
      c.fillStyle=C(HO_CREAM,sF*.7);c.fillRect(x,y,5,fh*.45);
      c.strokeStyle=C(HO_STEEL,sF*.5);c.lineWidth=.4;c.strokeRect(x+.2,y+.2,4.6,fh*.4);
    }}
  yield;
  hotelWindows(c,e,hoWins(),sd,false,HO_DARK,HO_HALO);
  yield;
  /* вывеска — все буквы (sign neon) */
  {c.fillStyle=C(HO_CREAM,sF+.15);c.fillRect(CX-70,28,140,14);
   c.fillStyle=C(HO_RED,sF*.85);c.fillRect(CX-70,28,140,1.4);c.fillRect(CX-70,40.6,140,1.4);}
  yield;
  /* крыша / карниз */
  for(const [x0,y0,x1] of HO_BLOCKS){c.fillStyle=C(HO_STEEL,sU+.25);c.fillRect(x0-2,y0-4,x1-x0+4,4);
    for(let i=0;i<3;i++)hotelLamp(c,e,x0+8+i*((x1-x0-16)/2),y0-5,.35,[255,200,120],.5);}
  yield;
  /* вход / причал */
  {c.fillStyle=C(HO_WALL,sF);c.fillRect(CX-12,148,24,12);
   c.fillStyle=HO_DARK[0];c.fillRect(CX-4,150,8,8);
   hotelDock(c,e,CX-50,155,70,168,sd,Lt);}
  yield;
  /* швы заклёпки + лестничные клетки (с пробы) */
  {for(const [x0,y0,x1,y1] of HO_BLOCKS){
    for(let i=0;i<8;i++){c.fillStyle=C(HO_STEEL,sF*.4);c.fillRect(x0+4+r()*(x1-x0-8),y0+6+r()*(y1-y0-12),1.5,.6);}
    const sx=(x0+x1)/2-3;c.fillStyle=C(HO_WALL,sF*.7);c.fillRect(sx,y0,6,y1-y0);
    c.fillStyle=HO_DARK[1];for(let j=0;j<5;j++)c.fillRect(sx+1.2,y0+6+j*((y1-y0-12)/5),3.6,2.2);}
   /* бельё на балконах — редкие пятна */
   for(let i=0;i<10;i++){const [x0,y0,x1,y1]=HO_BLOCKS[i%3],fl=5,fh=(y1-y0-8)/fl,j=(i*3)%fl;
     const x=(i%2?x0-4:x1+1),y=y0+4+j*fh+fh*.25;
     c.fillStyle=C([[210,200,190],[180,60,50],[70,90,140]][i%3],sF*.5);c.fillRect(x+.5,y+1,3.5,1.2);}}
}
HOTEL_T.or={W:HO_W,H:HO_H,PX:2,ax:HO_CX,ay:HO_H/2,sign:[HO_CX,34,11],sheen:[HO_CX,34,26],halo:HO_HALO,wins:hoWins,paint:hoPaint};
