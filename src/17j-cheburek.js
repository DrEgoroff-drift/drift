/* ══════════════ «Чебуречная» — лодка на подъезде (M462, DESIGN-life §3.4) ══════════════
   Утлая баржа ходит вдоль полосы подъезда туда-обратно и окликает всех
   подряд, в любой час: «Чебуреки! Горячие!». Продаёт то, что едят в этой
   земле (POWERS[хозяин].food), — и к еде прилагается слух: за столом люди
   говорят. Полезная выдача — слух и строка в тетради; никто не обязан брать.

   Лодка есть не в каждой системе: только у людной станции и по зерну через
   одну. Положение — функция времени, ничего не хранится. */
const CHEB_PRICE=4,CHEB_R=200;
function chebHere(){
  const sys=G.sys;if(!sys||!sys.station||typeof sysLane!=="function")return null;
  const P=sysLane(sys);if(!P||P.life<.35||(hashi(sys.sx,sys.sy,0xC4EB)&1))return null;
  /* ходит по оси полосы между первой парой бакенов и входом, медленно */
  const u=.5-.5*Math.cos(G.t/60*TAU/70+P.ph*TAU),d=180+(P.L-420)*u;
  const dir=Math.sin(G.t/60*TAU/70+P.ph*TAU)>=0?1:-1;
  return {x:P.st.x+P.ux*d+P.uy*38,y:P.st.y+P.uy*d-P.ux*38,a:Math.atan2(P.uy,P.ux)+(dir>0?0:Math.PI),by:P.by};
}
/* лодка (дизайн-проход 23.09): тело, обвод, один свет. Ржавая кайма и заплата
   на заклёпках — «утлая»; окно раздачи — ровный тёплый свет, дышит плавно (не
   мигает); пар из трубы тянется назад — единственное, что движется; гирлянда
   по борту; вывеска — доска на двух верёвках, красным по крему, от руки */
/* 16/n: лодка печётся раз, два слоя. cv — краска без света (окно — тёмное тёплое стекло
   выключенной лампы); em — свет лампы за стеклом и лампочек гирлянды, ореол узкий, в
   долю окна, — он принадлежит лампе. Дыхание — усилением в кадре, не перепечкой.
   Прежний 2D-ореол (радиальный «lighter» на 12 единиц) и emit() по цвету давали окну
   ~18× белого и светили дважды — ушли */
const CHEB_PX=4,CHEB_X0=-20,CHEB_Y0=-10,CHEB_BW=38,CHEB_BH=20,CHEB_LAMP=1.6;
const CHEB_ART=new Map();   /* выпечки GPU-холста: "cv" лодка, "em" её свет */
const CHEB_LOD=.5;   /* мастер берётся на уровень крупнее, как прежний gpuCvLevel (см. HOTEL_LOD) */
function chebHullPath(c){c.beginPath();c.moveTo(16,0);c.lineTo(10,-8);c.lineTo(-14,-8);c.lineTo(-16,0);c.lineTo(-14,8);c.lineTo(10,8);c.closePath();}
function chebBake(){
  const mk=(k,paint)=>gpuBaked(CHEB_ART,k,CHEB_BW*CHEB_PX,CHEB_BH*CHEB_PX,g=>{
    g.setTransform(CHEB_PX,0,0,CHEB_PX,-CHEB_X0*CHEB_PX,-CHEB_Y0*CHEB_PX);paint(g);});
  const cv=mk("cv",chebPaint),em=mk("em",chebPaintEm);
  return cv&&em?{cv,em}:null;
}
function chebPaint(c){
  c.fillStyle="#4a3a2e";c.strokeStyle="rgba(0,0,0,.7)";c.lineWidth=.9;chebHullPath(c);c.fill();c.stroke();
  c.save();c.clip();
  c.strokeStyle="rgba(150,64,40,.85)";c.lineWidth=2.4;c.stroke();                 /* ржавая кайма */
  c.fillStyle="#5d4a38";c.fillRect(-12,2.5,6,3.6);                                  /* заплата */
  c.fillStyle="rgba(220,200,170,.55)";for(const [px,py] of [[-11.4,3],[-6.6,3],[-11.4,5.6],[-6.6,5.6]]){c.beginPath();c.arc(px,py,.35,0,TAU);c.fill();}
  c.restore();
  c.fillStyle="rgba(255,255,255,.08)";c.fillRect(-13,-7.4,22,1);                   /* кант к свету */
  c.fillStyle="#6b5645";c.fillRect(-9,-5,13,10);                                    /* будка */
  c.fillStyle="rgba(255,255,255,.1)";c.fillRect(-9,-5,13,1.2);
  c.fillStyle="#3b2c20";c.fillRect(-7,-3.2,7,6.4);                                  /* стекло раздачи */
  c.fillStyle="rgba(60,40,24,.6)";c.fillRect(-7,-.4,7,.8);
  c.fillStyle="#2a221c";c.beginPath();c.arc(7,-4,1.7,0,TAU);c.fill();              /* труба */
  c.fillStyle="#8a7458";for(let i=0;i<5;i++){c.beginPath();c.arc(-12+i*5,7,.8,0,TAU);c.fill();}   /* гирлянда */
  c.strokeStyle="rgba(40,30,20,.6)";c.lineWidth=.3;c.beginPath();for(let i=0;i<5;i++){const qx=-12+i*5;i?c.quadraticCurveTo(qx-2.5,7.9,qx,7):c.moveTo(qx,7);}c.stroke();
}
function chebPaintEm(e){
  e.shadowColor="rgba(255,180,100,.8)";e.shadowBlur=1.4*CHEB_PX;                  /* ореол ~.7 единицы: окно — 7 */
  e.fillStyle="rgb(255,210,140)";e.fillRect(-7,-3.2,7,6.4);
  e.shadowBlur=.8*CHEB_PX;e.fillStyle="rgba(255,214,150,.9)";for(let i=0;i<5;i++){e.beginPath();e.arc(-12+i*5,7,.8,0,TAU);e.fill();}
  e.shadowBlur=0;e.globalCompositeOperation="destination-out";e.fillStyle="rgba(0,0,0,.8)";e.fillRect(-7,-.4,7,.8);   /* переплёт не светит */
}
/* доска «ЧЕБУРЕКИ» — в пикселях устройства под размер шрифта, с тенью */
const CHEB_SIGN=new Map();
function chebSignBake(F,k){
  const d=DPR,key=F+"|"+k+"|"+d;
  let v=bakeKeep(CHEB_SIGN,key,6,()=>chebSignMake(F,k,d));
  if(!v.B||v.B.dev!==GPU.dev){v.drop();v=chebSignMake(F,k,d);CHEB_SIGN.set(key,v);}   /* устройство поднято заново */
  return v;
}
function chebSignMake(F,k,d){
  const font="bold "+F+"px ui-monospace,monospace";
  const tw=gcMeasure(font,"ЧЕБУРЕКИ").width+12*k,bh=15*k,w=Math.ceil((tw+1.5)*d)+1,h=Math.ceil((bh+1.5)*d)+1;
  const B=gpuBake(w,h,g=>{
    g.setTransform(d,0,0,d,0,0);
    g.fillStyle="rgba(0,0,0,.45)";g.fillRect(1.5,1.5,tw,bh);
    g.fillStyle="#efe3c6";g.fillRect(0,0,tw,bh);
    g.font=font;g.textAlign="center";g.textBaseline="middle";g.fillStyle="#b8322a";g.fillText("ЧЕБУРЕКИ",tw/2,bh/2+.5);
  },{mips:false});
  return {B,w,h,tw,bh,drop(){gpuBakeDrop(B);}};
}
function drawCheburek(zx,zy,Z){
  const C=chebHere();if(!C)return;
  const x=zx(C.x),y=zy(C.y);
  if(x<-80||x>W+80||y<-80||y>H+80){if(GPU.dev&&pbOnScreen(x-80,y-80,160,160,.6))chebAhead(Z);return;}
  const pass=gpuScene();if(!pass)return;
  const s=clamp(Z,.6,1.5),br=.86+.1*Math.sin(G.t*.045),A=chebBake(),ca=Math.cos(C.a),sa=Math.sin(C.a);
  if(!A)return;
  const P=(px,py)=>[x+(px*ca-py*sa)*s,y+(px*sa+py*ca)*s];   /* точка лодки → экран */
  /* пар — назад и в сторону; у окна подсвечен снизу тёплым (низ клуба ближе к лампе) */
  const steam=[],warm=[];
  for(let i=0;i<4;i++){
    const u=((G.t*.6+i*25)%100)/100,px=7-u*24,py=-4-u*7+Math.sin(u*6+i)*1.2,r=1.4+u*5,[sx,sy]=P(px,py);
    steam.push([1,sx,sy,r*.8*s,0,0,r*.5*s,230,226,218,.32*(1-u)]);
    const near=clamp(1-Math.abs(px+3.5)/9,0,1)*(1-u);
    if(near>0){const [wx,wy]=P(px,py+r*.4);warm.push([1,wx,wy,r*.55*s,0,0,r*.45*s,255,186,112,.22*near*br]);}
  }
  const fl=.6+.4*Math.sin(G.t*.2),[nx,ny]=P(-17,0);
  const noz=[1,nx,ny,(1.2+fl*.5)*s,0,0,.8*s,255,150,70,.55+.3*fl];   /* сопло */
  const k=Math.max(1,s)*(typeof UIK==="number"?UIK:1),by=y-20*s-8*k,S=chebSignBake(Math.round(8*k),Math.round(8*k)/8);
  const d=DPR,sl=Math.round((x-S.tw/2)*d)/d,st=Math.round((by-7.5*k)*d)/d,sw=S.w/d,sh=S.h/d;
  {
    const [cx,cy]=P(CHEB_X0+CHEB_BW/2,CHEB_Y0+CHEB_BH/2),bw=CHEB_BW*s,bh=CHEB_BH*s;
    gpuImage(pass,A.cv,[{x:cx,y:cy,w:bw,h:bh,rot:C.a}],{lod:CHEB_LOD});
    gpuImage(pass,A.em,[{x:cx,y:cy,w:bw,h:bh,rot:C.a,a:CHEB_LAMP*br}],{blend:"add",lod:CHEB_LOD});
    gpuShapes(pass,steam);
    gpuShapes(pass,warm.concat([noz]),{blend:"add"});
    /* вывеска — в экранных координатах, чтобы читалась при любом курсе лодки; без
       поворота: детекторы и глаз читают доску там, где она стоит */
    gpuShapes(pass,[[2,x-S.tw*.3,by+7.5*k,x-4*s,y-6*s,.4,0,200,190,170,.45],[2,x+S.tw*.3,by+7.5*k,x+4*s,y-6*s,.4,0,200,190,170,.45]]);
    if(S.B)gpuImage(pass,S.B,[{x:sl+sw/2,y:st+sh/2,w:sw,h:sh}]);
  }
}
/* лодка на подлёте (за краем, в экране от края): лодку, её свет и доску печём заранее, в
   бюджете prebake (17a0) — на глаза выходит готовой, в кадре ни одной новой цели */
function chebAhead(Z){
  const s=clamp(Z,.6,1.5),F=Math.round(8*Math.max(1,s)*(typeof UIK==="number"?UIK:1)),d=DPR;
  const ok=B=>B&&B.dev===GPU.dev,Sg=CHEB_SIGN.get(F+"|"+F/8+"|"+d);
  if(ok(CHEB_ART.get("cv"))&&ok(CHEB_ART.get("em"))&&Sg&&ok(Sg.B))return;
  prebake("cheb|"+F+"|"+d,function*(){chebBake();yield;chebSignBake(F,F/8);},false);
}
function chebInteract(sh){
  const C=chebHere();if(!C)return false;
  if(Math.hypot(sh.x-C.x,sh.y-C.y)>CHEB_R)return false;
  const shown=cue("«ЧЕБУРЕЧНАЯ» · ЧЕБУРЕКИ! ГОРЯЧИЕ!\nДЕЙСТВИЕ — ВЗЯТЬ · "+CHEB_PRICE+" КР",CUE_ACT);
  if(shown&&actEdge){
    if(G.credits<CHEB_PRICE){say("«В долг не кормим. Хотя… ладно, держи.»",110);}
    else G.credits-=CHEB_PRICE;
    const P=(typeof POWERS!=="undefined"&&POWERS[C.by])||null;
    const L=(typeof rumoursHere==="function")?rumoursHere():[];
    const rum=L.length?"говорят, есть "+L[Math.floor(rnd()*L.length)].short:"сегодня ничего не говорят, жуют молча";
    logAdd("good","«Чебуречная»: "+(P?P.food:"чебурек, горячий")+" · за столом: "+rum);
    peopleLine(rum,"за столом у «Чебуречной»",true);
  }
  return true;
}
