/* ══════════════ гостиница «Аэлита™» — КОМПАНИЯ (co, M461) ══════════════
   Сталинская высотка на скале: ступенчатый ствол (подиум → нижний → средний → верхний →
   фронтон), сурик на поясах, тёплые окна этажами, вывеска на карнизе (первая «А» мертва —
   HOTEL_SIGN), вход с причальной трубой. Силуэт и зоны — с пробы site/kimi-hotel-aelita.html
   (Kimi WebGPU → Cursor). Свет — звезда системы (Lt): фасад к ней светлее, скала сверху
   hotelUp, днище hotelDn. Мерило — человек: этаж ≈6 ед., человек 3. */
const HA_CX=150,HA_TOP=28,HA_BOT=168,HA_W=260,HA_H=200;
const HA_WALL=[186,176,158],HA_RED=[168,48,36],HA_ROCK=[148,138,124],HA_STEEL=[92,88,82],HA_CREAM=[210,200,180];
const HA_DARK=["#10141c","#131722","#0e1219","#151a24"];
const HA_HALO=[.55,.75];
/* ступени ствола: [y0,y1, halfW] — сверху вниз, px мастера */
const HA_STEPS=[[28,42,22],[42,72,30],[72,108,38],[108,140,46],[140,158,56]];
let HA_WINS=null;
function haWins(){
  if(HA_WINS)return HA_WINS;
  const W=[];
  for(const [y0,y1,hw] of HA_STEPS){
    const fl=Math.max(1,Math.round((y1-y0)/6)),fh=(y1-y0)/fl,cols=Math.max(3,Math.round(hw/5));
    for(let j=0;j<fl;j++)for(let i=0;i<cols;i++){
      if(j===0&&y0<=42&&i>=cols/2-1&&i<=cols/2)continue;   /* вывеска / фронтон */
      const x0=HA_CX-hw+4+(2*hw-8)*(i+.18)/cols,x1=HA_CX-hw+4+(2*hw-8)*(i+.82)/cols;
      const yt=y0+fh*(j+.28),yb=y0+fh*(j+.72);
      const room=y0<=42&&j===0?9001:j*64+i+(y0|0);
      W.push([x0,yt,x1,yb,room]);
    }
  }
  /* окна в скале-цоколе — редкие щели */
  for(let i=0;i<5;i++)W.push([HA_CX-40+i*18,158.5,HA_CX-34+i*18,162.5,9100+i]);
  return HA_WINS=W;
}
function* haPaint(c,e,sd,lit,Lt){
  if(lit){hotelWindows(c,e,haWins(),sd,true,null,HA_HALO);return;}
  Lt=Lt||{lx:-.86,ly:-.51,K:[1,.88,.54],F:HOTEL_FILL};
  const r=rng((sd^0xAE11)>>>0),lx=Lt.lx,sg=lx>=0?1:-1;
  const C=(base,s,warm)=>rgba(hotelLit(Lt,base,s,warm),1);
  const sF=hotelN(0,Lt),sR=hotelN(Math.PI/2,Lt),sL=hotelN(-Math.PI/2,Lt),sU=hotelUp(Lt),sD=hotelDn(Lt);
  const sh=a=>"rgba(4,4,14,"+a.toFixed(2)+")",CX=HA_CX;
  /* скала: рваный эллипс под стволом */
  const rock=[];
  for(let i=0;i<40;i++){const t=i/40*2*Math.PI,n=fbm1(i*.41,sd^0xAE12,3),q=1+.35*(n-.5)*2-(Math.sin(t)>0?0:.08);
    rock.push(CX+Math.cos(t)*78*q,172+Math.sin(t)*22*q+(Math.sin(t)>0?(n-.5)*8:0));}
  /* силуэты ступеней + карниз + входной портик */
  const masses=[];
  for(const [y0,y1,hw] of HA_STEPS)masses.push([CX-hw,y0,CX+hw,y0,CX+hw,y1,CX-hw,y1]);
  const cornice=[CX-28,24,CX+28,24,CX+28,28,CX-28,28];
  const portico=[CX-18,150,CX+18,150,CX+18,158,CX-18,158];
  hotelRim(c,[rock,...masses,cornice,portico],1.25);
  yield;
  /* ── скала основание ── */
  {const g=c.createLinearGradient(0,150,0,190);g.addColorStop(0,C(HA_ROCK,sU+.7));g.addColorStop(.45,C(HA_ROCK,sF*.5));g.addColorStop(1,C([64,60,56],.08));
   c.fillStyle=g;hotelPoly(c,rock);c.fill();
   const kg=c.createLinearGradient(sg>0?CX+80:CX-80,0,sg>0?CX-80:CX+80,0);kg.addColorStop(0,sh(0));kg.addColorStop(1,sh(.32));
   c.fillStyle=kg;hotelPoly(c,rock);c.fill();
   c.save();hotelPoly(c,rock);c.clip();
   for(let i=0;i<9;i++){const x=CX-70+r()*140,y=160+r()*24,w=3+r()*7;c.fillStyle=sh(.3);c.beginPath();c.ellipse(x,y,w,w*.4,0,0,TAU);c.fill();}
   for(let i=0;i<90;i++){const x=CX-78+r()*156,y=152+r()*36;c.fillStyle=r()<.5?sh(.25):C([210,200,186],sU+.15);c.fillRect(x,y,.8+r(),.6);}
   c.restore();
   /* уступы скалы к стволу */
   for(let k=0;k<4;k++){const y=158+k*3.2,hw=62-k*6;
     c.fillStyle=C(HA_ROCK,sU+.25-k*.05);c.fillRect(CX-hw,y,hw*2,2.2);
     c.fillStyle=sh(.2);c.fillRect(CX-hw,y+1.6,hw*2,.6);}}
  yield;
  /* ── ствол высотки ── */
  for(let si=0;si<HA_STEPS.length;si++){
    const [y0,y1,hw]=HA_STEPS[si],h=y1-y0;
    const g=c.createLinearGradient(sg>0?CX-hw:CX+hw,0,sg>0?CX+hw:CX-hw,0);
    g.addColorStop(0,C(HA_WALL,sF+.25));g.addColorStop(.55,C(HA_WALL,sF));g.addColorStop(1,C(HA_WALL,(sg>0?sL:sR)*.55));
    c.fillStyle=g;c.fillRect(CX-hw,y0,hw*2,h);
    /* суриковый пояс */
    c.fillStyle=C(HA_RED,sF*.85);c.fillRect(CX-hw,y1-2.2,hw*2,2.2);
    c.fillStyle=C(HA_RED,sU+.1);c.fillRect(CX-hw,y0,hw*2,1.4);
    /* пилястры */
    const n=Math.max(2,Math.round(hw/9));
    for(let i=0;i<=n;i++){const x=CX-hw+2+(2*hw-4)*i/n;
      c.fillStyle=C(i%3===0?HA_RED:HA_STEEL,sF*.7);c.fillRect(x-.7,y0+1.5,1.4,h-3.5);
      c.fillStyle=C(HA_CREAM,sU+.15);c.fillRect(x-.9,y0+1.2,1.8,1.1);}
    /* тень от уступа выше */
    if(si>0){const ph=HA_STEPS[si-1][2];c.fillStyle=sh(.28);c.fillRect(CX-hw,y0,hw-ph,3.5);c.fillRect(CX+ph,y0,hw-ph,3.5);}
  }
  yield;
  /* ── окна этажей (тёмные ниши; lit — отдельный проход) ── */
  hotelWindows(c,e,haWins(),sd,false,HA_DARK,HA_HALO);
  yield;
  /* ── карниз / крыша + вывеска Аэлита ── */
  {c.fillStyle=C(HA_WALL,sU+.35);c.fillRect(CX-30,22,60,6.5);
   c.fillStyle=C(HA_STEEL,sF*.6);c.fillRect(CX-32,27.5,64,2);
   for(let i=0;i<9;i++){const x=CX-26+i*6.5;c.fillStyle=C(HA_STEEL,sU+.2);c.fillRect(x-.4,20,0.8,3);
     hotelLamp(c,e,x,20.2,.35,[255,210,140],.55);}
   /* антенны / мачты */
   c.strokeStyle=C(HA_STEEL,sF*.5);c.lineWidth=.7;
   for(const [x,h] of [[CX-18,14],[CX+8,18],[CX+22,11]]){c.beginPath();c.moveTo(x,22);c.lineTo(x,22-h);c.stroke();hotelLamp(c,e,x,22-h,.4,[255,70,50],.8);}
   c.fillStyle=C(HA_STEEL,sU+.1);c.beginPath();c.ellipse(CX+20,16,5,2.6,-.4,0,TAU);c.fill();   /* тарелка */
   c.fillStyle=sh(.3);c.beginPath();c.ellipse(CX+19.4,16.4,3.4,1.7,-.4,0,TAU);c.fill();}
  yield;
  /* ── вход / причал ── */
  {const g=c.createLinearGradient(0,148,0,160);g.addColorStop(0,C(HA_WALL,sF+.1));g.addColorStop(1,C(HA_WALL,sD+.2));
   c.fillStyle=g;hotelPoly(c,portico);c.fill();
   c.fillStyle=C(HA_RED,sF*.8);c.fillRect(CX-18,150,36,1.2);
   c.fillStyle=HA_DARK[1];c.fillRect(CX-5,151.5,10,6);   /* дверь */
   c.fillStyle=C(HA_STEEL,sF*.7);c.fillRect(CX+3.2,153.5,.7,1.4);   /* ручка */
   for(const s of[-1,1]){c.fillStyle=C(HA_STEEL,sF*.55);c.fillRect(CX+s*14-.6,149,1.2,9);   /* колонны */
     c.fillStyle=C(HA_CREAM,sU+.2);c.fillRect(CX+s*14-1.2,148.2,2.4,1.4);}
   hotelDock(c,e,CX-56,154,72,168,sd,Lt);}
  yield;
  /* ── швы заклёпки / износ ── */
  {c.fillStyle=sh(.18);
   for(let i=0;i<14;i++){const [y0,y1,hw]=HA_STEPS[i%HA_STEPS.length];
     c.fillRect(CX-hw+2+r()*(2*hw-6),y0+2+r()*(y1-y0-4),1.2+r()*2.5,.6);}
   for(const [y0,,hw] of HA_STEPS)for(let i=0;i<6;i++){
     const x=CX-hw+6+i*((2*hw-12)/5);c.fillStyle=C(HA_STEEL,sF*.4);c.fillRect(x-.35,y0+3.2,.7,.7);}
   /* ремонтные пластины на скале и стволе */
   for(let i=0;i<6;i++){const x=CX-50+r()*100,y=155+r()*18;
     c.fillStyle=C(i%2?HA_STEEL:HA_ROCK,sF*.35);c.fillRect(x,y,4+r()*5,2+r()*2);
     c.fillStyle=C(HA_STEEL,sF*.5);for(const d of[-1.4,1.4])c.fillRect(x+2+d*.3,y+.6,.5,.5);}
   for(let i=0;i<5;i++){const [y0,y1,hw]=HA_STEPS[1+i%4];
     const x=CX+(r()<.5?-1:1)*(hw-8-r()*6),y=y0+4+r()*(y1-y0-8);
     c.fillStyle=C(HA_STEEL,sF*.45);c.fillRect(x-3,y,6,3.2);
     c.fillStyle=sh(.2);c.fillRect(x-2.6,y+.4,5.2,.5);}}
}
HOTEL_T.co={W:HA_W,H:HA_H,PX:2,ax:HA_CX,ay:HA_H/2,sign:[HA_CX,18,12],sheen:[HA_CX,18,28],halo:HA_HALO,wins:haWins,paint:haPaint};
