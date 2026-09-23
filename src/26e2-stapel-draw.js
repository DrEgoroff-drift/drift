/* ══════════════ СТАПЕЛЬ — лист (D16, дизайн-проход) ══════════════
   Заказ рисуется не голым силуэтом в пустоте, а на стапеле: бетонные плиты в
   грунте державы, рельсы со шпалами, подпоры, кран, два человека для мерила,
   размерные линии белой тушью и эмблема хозяйки земли. Свет один — фонарь в
   левом верхнем углу, всё стоящее отбрасывает тень туда же. Пока заказ в
   работе, корпус обшит на долю смены от кормы; необшитое — набор в сурике.
   Рисуется раз на сдвиг ползунка, в кадре игры не участвует. */
function stapelSheet(o,cw,ch,st){
  st=st||{};
  const prog=clamp(st.prog==null?1:st.prog,0,1),by=o.by;
  const dpr=Math.min(2,window.devicePixelRatio||1)*(typeof UIK==="number"?UIK:1);
  const cn=document.createElement("canvas");
  cn.width=Math.round(cw*dpr);cn.height=Math.round(ch*dpr);
  cn.style.width=cw+"px";cn.style.height=ch+"px";cn.className="stp-sheet";
  const c=cn.getContext("2d");c.scale(dpr,dpr);
  const g=makerGround(by)||[170,170,170],P=powerOf(by);
  const r=rng((hashi(o.no|0,by.charCodeAt(0),0x57A9)>>>0)||1);
  const base=[13,16,21],mix=k=>base.map((v,i)=>Math.round(v+(g[i]-v)*k));
  const rgba=(a,al)=>"rgba("+a[0]+","+a[1]+","+a[2]+","+al+")";
  /* пол: тёмный грунт, свет только добавляется */
  c.fillStyle=rgba(mix(.09),1);c.fillRect(0,0,cw,ch);
  /* плиты (крупный масштаб): тон на плиту, шов тёмный, кромка светлая к фонарю */
  const sw=Math.max(34,ch/3.2);
  for(let y=0;y<ch;y+=sw)for(let x=-(r()*sw|0);x<cw;x+=sw*1.6){
    c.fillStyle=rgba(g,(.015+r()*.035).toFixed(3));c.fillRect(x,y,sw*1.6,sw);
  }
  c.lineWidth=1;c.strokeStyle="rgba(0,0,0,.5)";c.beginPath();
  for(let y=sw,row=1;y<ch+sw;y+=sw,row++){c.moveTo(0,y+.5);c.lineTo(cw,y+.5);
    for(let x=(row&1)*sw*.8;x<cw;x+=sw*1.6){c.moveTo(x+.5,y-sw);c.lineTo(x+.5,y);}}
  c.stroke();
  c.strokeStyle=rgba(g,.07);c.beginPath();
  for(let y=sw,row=1;y<ch+sw;y+=sw,row++){c.moveTo(0,y+1.5);c.lineTo(cw,y+1.5);
    for(let x=(row&1)*sw*.8;x<cw;x+=sw*1.6){c.moveTo(x+1.5,y-sw);c.lineTo(x+1.5,y);}}
  c.stroke();
  /* пятна масла (средний) и зерно (мелкий) */
  for(let i=0;i<5;i++){
    const x=r()*cw,y=r()*ch,rr=6+r()*16,gr=c.createRadialGradient(x,y,0,x,y,rr);
    gr.addColorStop(0,"rgba(0,0,0,.22)");gr.addColorStop(1,"rgba(0,0,0,0)");
    c.fillStyle=gr;c.fillRect(x-rr,y-rr,rr*2,rr*2);
  }
  for(let i=0;i<cw*ch/90;i++){
    c.fillStyle=i&1?rgba(g,.07):"rgba(0,0,0,.18)";
    c.fillRect((i*0.618034*cw+r()*9)%cw,r()*ch,1,1);
  }
  /* корпус: та же временная запись, что у превью */
  NPC_SHIPS[STAPEL_PV]=stapelShip(Object.assign({seed:0x57A9,no:0},o));
  delete HULL_CACHE[STAPEL_PV+"!"+by];
  const hl=hullOf(STAPEL_PV);
  /* границы корпуса — по пикселям, не по halfW: остриё носа и гондолы выходят
     за числа генератора, а лист обязан их вместить и мерить честно */
  const b=stapelHullBox(hl),Lw=b.x1-b.x0,Lh=b.y1-b.y0;
  const sc=Math.min((cw-96)/Lw,(ch-92)/Lh);
  stapelSheet.last={l:Math.round(Lw),b:Math.round(Lh)};
  const cx0=cw*.5-4,cy0=ch*.5+2,X0=cx0-(b.x0+b.x1)*.5*sc,Y0=cy0-(b.y0+b.y1)*.5*sc;
  const xn=X0+b.x1*sc,xt=X0+b.x0*sc,hw=Lh*.5*sc,xf=xt+(xn-xt)*prog;
  const ry=[cy0-hw-11,cy0+hw+11];
  /* рельсы со шпалами */
  c.strokeStyle="rgba(0,0,0,.45)";c.lineWidth=3;c.beginPath();
  for(let x=10;x<cw-10;x+=8)for(const y of ry){c.moveTo(x,y-5);c.lineTo(x,y+5);}
  c.stroke();
  for(const y of ry){
    c.fillStyle="rgba(0,0,0,.5)";c.fillRect(6,y-2,cw-12,5);
    c.fillStyle="rgba(196,202,210,.5)";c.fillRect(6,y-2,cw-12,1.5);
    c.fillStyle="rgba(196,202,210,.22)";c.fillRect(6,y+1,cw-12,1);
  }
  /* кильблоки по оси — видны за носом и кормой; подпоры от рельса к борту */
  c.fillStyle="rgba(150,108,58,.9)";
  for(let x=xt-14;x<xn+14;x+=Math.max(9,sc*5))c.fillRect(x-2,cy0-3,4,6);
  /* подпоры — наклонные брусья: пятка на рельсе, голова под бортом */
  const shores=Math.max(2,Math.round((xn-xt)/60));
  for(let i=0;i<shores;i++){
    const x=xt+(xn-xt)*(i+.5)/shores;
    for(const k of [-1,1]){
      const y0=ry[k>0?1:0],y1=cy0+k*hw*.45,x0=x-(y0-y1)*k*.55;
      c.strokeStyle="rgba(0,0,0,.45)";c.lineWidth=3.5;c.beginPath();c.moveTo(x0+3,y0+3);c.lineTo(x+3,y1+3);c.stroke();
      c.strokeStyle="rgba(122,90,52,.95)";c.lineWidth=2.2;c.beginPath();c.moveTo(x0,y0);c.lineTo(x,y1);c.stroke();
      c.strokeStyle="rgba(214,170,110,.35)";c.lineWidth=.8;c.beginPath();c.moveTo(x0-.6,y0-.6);c.lineTo(x-.6,y1-.6);c.stroke();
      c.fillStyle="rgba(60,44,26,.95)";c.fillRect(x0-3,y0-2,6,4);
    }
  }
  /* корпус — в свой холст, обшивка и набор там же, тень одним вызовом */
  const off=document.createElement("canvas");off.width=cn.width;off.height=cn.height;
  const oc=off.getContext("2d");oc.scale(dpr,dpr);
  oc.save();oc.translate(X0,Y0);oc.scale(sc,sc);
  const old=ctx;ctx=oc;try{drawHull(STAPEL_PV,false,false,0);}finally{ctx=old;}
  oc.restore();
  if(prog<1){
    oc.save();oc.beginPath();oc.rect(xf,0,cw-xf,ch);oc.clip();
    oc.globalCompositeOperation="source-atop";
    oc.fillStyle="rgba(24,22,21,.9)";oc.fillRect(xf,0,cw-xf,ch);
    oc.strokeStyle="rgba(176,86,52,.85)";oc.lineWidth=1.2;oc.beginPath();          /* шпангоуты в сурике */
    for(let x=xf+3;x<cw;x+=Math.max(3.5,sc*2.2)){oc.moveTo(x,cy0-hw-2);oc.lineTo(x,cy0+hw+2);}
    oc.stroke();
    oc.strokeStyle="rgba(176,86,52,.6)";oc.lineWidth=1;oc.beginPath();          /* стрингеры */
    for(const k of [-.62,-.28,0,.28,.62]){oc.moveTo(xf,cy0+k*hw);oc.lineTo(cw,cy0+k*hw);}
    oc.stroke();
    oc.restore();
  }
  c.save();c.shadowColor="rgba(0,0,0,.6)";c.shadowBlur=7;c.shadowOffsetX=5;c.shadowOffsetY=6;
  c.drawImage(off,0,0,cw,ch);c.restore();
  if(prog<1&&prog>0){                                                         /* сварка на кромке обшивки */
    const gy=cy0+(r()-.5)*hw,gr=c.createRadialGradient(xf,gy,0,xf,gy,10);
    gr.addColorStop(0,"rgba(255,244,210,.95)");gr.addColorStop(.25,"rgba(150,200,255,.45)");gr.addColorStop(1,"rgba(150,200,255,0)");
    c.globalCompositeOperation="lighter";c.fillStyle=gr;c.fillRect(xf-10,gy-10,20,20);c.globalCompositeOperation="source-over";
  }
  /* козловой кран: над кромкой обшивки, а готовому — отогнан за корму */
  const kx=prog<1?xf:Math.max(30,xt-20);
  c.save();c.shadowColor="rgba(0,0,0,.55)";c.shadowBlur=4;c.shadowOffsetX=6;c.shadowOffsetY=8;
  c.fillStyle="#caa23e";c.fillRect(kx-3,ry[0]-7,6,ry[1]-ry[0]+14);
  c.restore();
  c.fillStyle="rgba(20,18,14,.85)";
  for(let y=ry[0]-7;y<ry[0]+1;y+=4)c.fillRect(kx-3,y,6,2);
  for(let y=ry[1]-1;y<ry[1]+7;y+=4)c.fillRect(kx-3,y,6,2);
  c.fillStyle="#2a2723";c.fillRect(kx-5,cy0-5,10,9);
  c.fillStyle="rgba(255,236,190,.35)";c.fillRect(kx-5,cy0-5,10,1.5);
  /* мерило — два человека у рельса: каска и плечи, тень */
  for(const [px,py] of [[xt-8,ry[1]+9],[xt+(xn-xt)*.62,ry[0]-9]]){
    c.fillStyle="rgba(0,0,0,.45)";c.beginPath();c.ellipse(px+1.6,py+2,2.6,1.7,0,0,TAU);c.fill();
    c.fillStyle="#2f3a44";c.beginPath();c.ellipse(px,py,2.6,1.7,0,0,TAU);c.fill();
    c.fillStyle="#f0c24a";c.beginPath();c.arc(px,py-.4,1.4,0,TAU);c.fill();
  }
  /* фонарь в углу — источник у света, и пятно света от него */
  const lx=12,ly=12,gl=c.createRadialGradient(lx,ly,0,lx,ly,cw*.75);
  gl.addColorStop(0,"rgba(255,214,150,.16)");gl.addColorStop(.4,"rgba(255,214,150,.05)");gl.addColorStop(1,"rgba(255,214,150,0)");
  c.globalCompositeOperation="lighter";c.fillStyle=gl;c.fillRect(0,0,cw,ch);
  const gh=c.createRadialGradient(lx,ly,0,lx,ly,9);
  gh.addColorStop(0,"rgba(255,236,196,.9)");gh.addColorStop(1,"rgba(255,214,150,0)");
  c.fillStyle=gh;c.fillRect(lx-9,ly-9,18,18);c.globalCompositeOperation="source-over";
  c.fillStyle="rgba(0,0,0,.7)";c.beginPath();c.arc(lx+3,ly+4,3,0,TAU);c.fill();
  c.fillStyle="#fff2d6";c.beginPath();c.arc(lx,ly,1.8,0,TAU);c.fill();
  /* размерные линии белой тушью */
  const ink="rgba(226,234,244,.72)";
  c.font="10px ui-monospace,monospace";c.textBaseline="middle";c.textAlign="center";
  const dy=ch-10;
  c.strokeStyle="rgba(226,234,244,.25)";c.lineWidth=1;c.setLineDash([2,3]);c.beginPath();
  c.moveTo(xt+.5,cy0+hw*.4);c.lineTo(xt+.5,dy+4);c.moveTo(xn+.5,cy0);c.lineTo(xn+.5,dy+4);c.stroke();c.setLineDash([]);
  c.strokeStyle=ink;c.beginPath();c.moveTo(xt,dy+.5);c.lineTo(xn,dy+.5);
  c.moveTo(xt-3,dy+3.5);c.lineTo(xt+3,dy-2.5);c.moveTo(xn-3,dy+3.5);c.lineTo(xn+3,dy-2.5);c.stroke();
  const tl=Math.round(Lw)+" м",tw=c.measureText(tl).width+8;
  c.fillStyle=rgba(mix(.09),1);c.fillRect((xt+xn)/2-tw/2,dy-6,tw,12);
  c.fillStyle=ink;c.fillText(tl,(xt+xn)/2,dy+.5);
  const dx=cw-12;
  c.beginPath();c.moveTo(dx+.5,cy0-hw);c.lineTo(dx+.5,cy0+hw);
  c.moveTo(dx-3,cy0-hw+3);c.lineTo(dx+3,cy0-hw-3);c.moveTo(dx-3,cy0+hw+3);c.lineTo(dx+3,cy0+hw-3);c.stroke();
  c.save();c.translate(dx,cy0);c.rotate(-Math.PI/2);
  const bl=Math.round(Lh)+" м",bw=c.measureText(bl).width+8;
  c.fillStyle=rgba(mix(.09),1);c.fillRect(-bw/2,-6,bw,12);c.fillStyle=ink;c.fillText(bl,0,.5);c.restore();
  /* эмблема хозяйки и номер стапеля */
  const oldc=ctx;ctx=c;try{powerEmblem(by,cw-22,19,10);}finally{ctx=oldc;}
  c.textAlign="right";c.fillStyle=P.col||ink;c.font="10px ui-monospace,monospace";
  c.fillText(makerRu(by).toUpperCase(),cw-38,15);
  c.fillStyle="rgba(226,234,244,.5)";c.fillText("стапель № "+(1+((hashi(G.sx|0,G.sy|0,0x57A9)>>>0)%9)),cw-38,27);
  /* ГОТОВ — красный двойной штамп, как «СОГЛАСОВАНО» на синьке */
  if(st.ready){
    c.save();c.translate(cx0+(xn-cx0)*.35,cy0-2);c.rotate(-.16);
    c.strokeStyle="rgba(214,62,52,.9)";c.lineWidth=2;c.strokeRect(-46,-15,92,30);c.lineWidth=1;c.strokeRect(-42,-11,84,22);
    c.fillStyle="rgba(214,62,52,.92)";c.font="bold 17px ui-monospace,monospace";c.textAlign="center";c.fillText("ГОТОВ",0,1);
    c.restore();
  }
  return cn;
}
/* рамка корпуса в единицах мира: рисуем в 2 px на единицу и ищем непустые
   пиксели. Один раз на сдвиг ползунка — не в кадре игры */
function stapelHullBox(hl){
  const k=2,pad=hl.len*.4+20,W=Math.ceil((hl.len+pad*2)*k),H=Math.ceil((hl.halfW*2+pad*2)*k);
  const cn=document.createElement("canvas");cn.width=W;cn.height=H;
  const c=cn.getContext("2d"),ox=pad-hl.tail,oy=hl.halfW+pad;
  c.translate(ox*k,oy*k);c.scale(k,k);
  const old=ctx;ctx=c;try{drawHull(STAPEL_PV,false,false,0);}finally{ctx=old;}
  const d=c.getImageData(0,0,W,H).data;
  let x0=W,x1=-1,y0=H,y1=-1;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(d[(y*W+x)*4+3]>24){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
  if(x1<0)return {x0:hl.tail,x1:hl.nose,y0:-hl.halfW,y1:hl.halfW};
  return {x0:x0/k-ox,x1:(x1+1)/k-ox,y0:y0/k-oy,y1:(y1+1)/k-oy};
}
/* числа заказа полосой: значение, разница с тем, на чём летите, и место в
   коридоре класса — видно, что даёт ползунок, а не только сколько стоит */
const STAPEL_KEYS=[["thr","тяга",2],["turn","поворот",2],["cargo","трюм",0],["fuel","бак",0],["hull","корпус",0]];
function stapelDelta(N,cls){
  const d=el("div","stp-dl"),cur=shipData(G.shipId)||{},P=FLEET_PROFILE[cls]||FLEET_PROFILE.scout;
  for(const [k,ru,f] of STAPEL_KEYS){
    const v=N[k],dv=+(v-(cur[k]||0)).toFixed(f),q=clamp((v-P[k][0])/((P[k][1]-P[k][0])||1),0,1);
    const cell=el("div","stp-dc"+(dv>0?" up":dv<0?" dn":""),
      "<i>"+ru+"</i><b>"+v.toFixed(f)+"</b><em>"+(dv>0?"+":dv<0?"−":"=")+(dv?Math.abs(dv).toFixed(f):"")+"</em>"+
      "<u style='--q:"+q.toFixed(2)+"'></u>");
    d.appendChild(cell);
  }
  return d;
}
/* ГОТОВ у окна выдачи — штамп через экран, тем же ходом, что отметка о проезде */
function stapelFx(by,name){
  if(typeof document==="undefined"||!document.body)return;
  const old=document.getElementById("stampFx");if(old)old.remove();
  const d=document.createElement("div");d.id="stampFx";d.className="stp-fx stp-done stp-"+by;
  d.style.setProperty("--tilt","-6deg");
  d.innerHTML="<div class='l0'>ГОТОВ</div><div class='l1'>«"+name+"»</div><div class='l2'>сошёл со стапеля "+makerRu(by)+"</div>";
  document.body.appendChild(d);
  setTimeout(()=>{if(d.parentNode)d.remove();},1300);
}
