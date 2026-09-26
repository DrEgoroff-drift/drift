/* ══════════════ ворота прыжков фишек (долг §0) ══════════════
   Фишка у кромки едет к своему месту не быстрее CHIP_SPEED (P4); смена кромки — не
   ход, а угасание на старом месте и загорание на новом (CHIP_FADE). Значит, между
   двумя кадрами видимая фишка смещается не больше чем на CHIP_SPEED·dt + 1 px, а
   всё, что больше, — прыжок, который на телефоне читается дёрганьем. Порядок, в
   котором фишки кладутся (кто поверх кого и кто кого отодвигает), — по ключу, а не
   по случайной дальности кадра: иначе соседки меняются местами. Корабль облетает
   звезду по кругу — фишки ползут вдоль кромок, огибают углы и проходят друг сквозь
   друга; кадр идёт через frameBody, dt фишек — их собственные часы (CHIP_T). */
TEST_SUITES.push(()=>suite("ворота фишек: без прыжков, порядок по ключу",{tier:"browser"},()=>{
  if(!ok(GPU.ok,"видеокарта есть — фишки рисуются только над её кадром"))return;
  resetWorld();
  G.mode="system";G.ap=null;G.orbit=null;G.pirates=[];G.shots=[];G.msl=[];G.loot=[];G.npcWrecks=[];
  const sh=G.ship,R=9000,N=240,run0=G.running,loop0=LOOP_OFF,cd0=chipDom;
  G.zoom=1;G.zoomT=null;
  /* цель автопилота — точка по ту сторону звезды: пятая фишка, которая идёт навстречу остальным */
  G.ap={kind:"wreck",ax:-R*.6,ay:R*.3,phase:"hold"};
  const F=[];let rec=null;
  chipDom=function(k,rx,ry,cw,ch,A){if(rec)rec.push({k,x:rx,y:ry,A});return cd0.apply(this,arguments);};
  let jumps=[],order=[],maxR=0,moved=0;
  try{
    G.running=true;LOOP_OFF=false;
    for(let i=0;i<N;i++){
      const a=i/N*TAU*1.25;
      sh.x=Math.cos(a)*R;sh.y=Math.sin(a)*R;sh.vx=0;sh.vy=0;sh.a=a+Math.PI/2;
      G.ap.phase="hold";
      /* часы фишек — кадр в 1/60 с: без этого шаг меряется миллисекундами прогона */
      rec=[];CHIP_T=wallNow()-17;const t0=CHIP_T;
      frameBody(wallMs());
      F.push({dt:t0?(CHIP_T-t0)/1000:0,c:rec});rec=null;
    }
  }catch(e){ok(false,"кадр упал: "+e.message);}
  finally{chipDom=cd0;G.running=run0;LOOP_OFF=loop0;G.ap=null;}
  for(let i=1;i<F.length;i++){
    const P=new Map(F[i-1].c.map(c=>[c.k,c])),lim=CHIP_SPEED*Math.min(.2,F[i].dt)+1;
    for(const c of F[i].c){
      const p=P.get(c.k);if(!p)continue;
      const d=Math.hypot(c.x-p.x,c.y-p.y);
      if(d>.01)moved++;
      /* угасшая фишка (смена кромки) переставляется, пока её не видно */
      if(Math.min(c.A,p.A)<.5)continue;
      if(d/lim>maxR)maxR=d/lim;
      if(d>lim)jumps.push("кадр "+i+" «"+c.k+"» "+d.toFixed(1)+" px > "+lim.toFixed(1));
    }
    const ks=F[i].c.map(c=>c.k),srt=ks.slice().sort();
    if(ks.join("|")!==srt.join("|"))order.push("кадр "+i+": "+ks.join(", "));
  }
  ok(F.length===N&&F.every(f=>f.c.length>=3),"в каждом кадре не меньше трёх фишек");
  ok(moved>N,"фишки в пути двигались ("+moved+" шагов) — ворота не пустые");
  eq(jumps.length,0,"ни одного прыжка (худший шаг "+maxR.toFixed(2)+" предела)"+(jumps.length?": "+jumps.slice(0,4).join("; "):""));
  eq(order.length,0,"фишки кладутся по ключу"+(order.length?": "+order.slice(0,3).join("; "):""));
  resetWorld();
}));
