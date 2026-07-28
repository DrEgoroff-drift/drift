/* ══════════════ кабина: процедурная, статика в offscreen ══════════════ */
/* Раскладка кабины детерминирована от seed корабля: у «Иглы» узкий переплёт
   и низкий потолок, у «Мамонта» — широкий. Неподвижная часть (рама, потолочные
   блоки, окантовки экранов, кнопочные поля) рисуется один раз в отдельный
   канвас с прозрачным остеклением и потом просто накладывается поверх сцены. */
const CKPT={key:"",plan:null,tex:null};
function cockpitPlan(id){
  const S=shipData(id),hl=hullOf(id),r=rng((S.seed^0xC0C4)>>>0);
  const dashH=clamp(H*.30,132,252), dashY=H-dashH;
  const pw=clamp(W*.045+hl.bw*2.2,26,104);         // боковая стойка
  const brow=clamp(H*.115+hl.nose*1.1,56,152);     // низ потолочного блока
  const sh=brow+H*.08;                              // излом стойки
  const dip=clamp(hl.bw*1.9+14,18,58);              // нос корпуса снизу
  const glass=[[pw,dashY],[pw*1.03,sh],[pw*1.85,brow],
    [W-pw*1.85,brow],[W-pw*1.03,sh],[W-pw,dashY],
    [W/2+dip*2.3,dashY],[W/2,dashY-dip],[W/2-dip*2.3,dashY]];
  const nStrut=2+Math.floor(r()*3), strut=[];
  for(let i=1;i<=nStrut;i++){
    const t=i/(nStrut+1);
    strut.push({xt:lerp(pw*1.85,W-pw*1.85,t),xb:lerp(pw,W-pw,t),w:2+r()*2.8});
  }
  const nPod=2+Math.floor(r()*3), pods=[];
  for(let i=0;i<nPod;i++)
    pods.push({dx:W*(.14+i*.125), y:brow*(.30+r()*.16), r:brow*(.14+r()*.09)});
  const mfd={w:clamp(W*.155,92,214), h:clamp(brow*.86,44,112),
    y:brow*.12, tilt:.045+r()*.05, rows:3+Math.floor(r()*3)};
  const ohc={w:clamp(W*.185,104,250), y0:brow*.08, y1:brow*1.02,
    bars:9+Math.floor(r()*7)};
  const BW=Math.min(W-24,1060), x0=(W-BW)/2;
  const stack={x:x0+BW*.355, w:BW*.29, lift:clamp(dashH*.15,14,32)};
  /* нижняя полоса доски уходит под экранные пэды — приборы туда не ставим */
  const UH=Math.max(120,dashH-64);
  const grid=[];
  for(let side=0;side<2;side++){
    const cols=4+Math.floor(r()*3), rows=2;
    const cw=BW*.026, ch=UH*.10;
    grid.push({x:side?x0+BW-8-cols*(cw+4):x0+8, y:dashY+UH+4,
      cols,rows,cw,ch, lit:Array.from({length:cols*rows},()=>r()<.32)});
  }
  const vents=[];
  for(let i=0;i<3+Math.floor(r()*3);i++)
    vents.push({x:lerp(x0+BW*.1,x0+BW*.9,r()), y:dashY+dashH*(.82+r()*.1), w:BW*(.03+r()*.05)});
  const scr=[];
  for(let i=0;i<10+Math.floor(r()*10);i++)
    scr.push([r()*W, r()*brow, 6+r()*22, r()*.8-.4]);
  return {S,hl,acc:S.col,dashH,dashY,UH,pw,brow,sh,dip,glass,strut,pods,mfd,ohc,
    BW,x0,stack,grid,vents,scr,seed:S.seed};
}
/* addPath не сбрасывает текущий путь — нужно для дырки по evenodd */
function addPath(c,pts){
  c.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);
  c.closePath();
}
function tracePath(c,pts){c.beginPath();addPath(c,pts);}
function plate(c,x,y,w,h,a,b2){
  const g=c.createLinearGradient(0,y,0,y+h);
  g.addColorStop(0,a);g.addColorStop(1,b2);
  c.fillStyle=g;c.fillRect(x,y,w,h);
}
function cockpitTex(id){
  const key=id+"|"+Math.round(W)+"x"+Math.round(H)+"|"+DPR.toFixed(2);
  if(CKPT.key===key)return CKPT;
  const P=cockpitPlan(id);
  const cn=document.createElement("canvas");
  cn.width=Math.max(1,Math.round(W*DPR));cn.height=Math.max(1,Math.round(H*DPR));
  const c=cn.getContext("2d");
  c.setTransform(DPR,0,0,DPR,0,0);
  const A=hex2rgb(P.acc);

  /* корпус кабины: всё, кроме остекления */
  c.save();
  c.beginPath();c.rect(0,0,W,H);
  addPath(c,P.glass);
  const hullG=c.createLinearGradient(0,0,0,H);
  hullG.addColorStop(0,"#161d27");
  hullG.addColorStop(.42,"#0d131b");
  hullG.addColorStop(1,"#070a10");
  c.fillStyle=hullG;c.fill("evenodd");
  c.restore();

  /* потолок: обшивка и заклёпочные швы */
  c.save();
  c.beginPath();c.rect(0,0,W,P.brow*1.06);c.clip();
  plate(c,0,0,W,P.brow*1.06,"#1b232e","#0b1017");
  c.strokeStyle="rgba(0,0,0,.45)";c.lineWidth=1;
  for(let i=1;i<5;i++){
    const y=P.brow*i/5;
    c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke();
  }
  c.strokeStyle="rgba(255,255,255,.05)";
  for(let i=1;i<5;i++){
    const y=P.brow*i/5+1;
    c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke();
  }
  /* потёртости */
  c.strokeStyle="rgba(255,255,255,.055)";c.lineWidth=1;
  for(const s of P.scr){
    c.beginPath();c.moveTo(s[0],s[1]);
    c.lineTo(s[0]+Math.cos(s[3])*s[2],s[1]+Math.sin(s[3])*s[2]);c.stroke();
  }
  c.restore();

  /* потолочные блоки маневровых — концентрические кольца, как раструбы сопел */
  for(const p of P.pods)for(const s of [-1,1]){
    const x=W/2+p.dx*s, y=p.y, rr=p.r;
    const g=c.createRadialGradient(x-rr*.3,y-rr*.35,rr*.1,x,y,rr);
    g.addColorStop(0,"#2b3542");g.addColorStop(.55,"#141b25");g.addColorStop(1,"#070a10");
    c.fillStyle=g;c.beginPath();c.arc(x,y,rr,0,TAU);c.fill();
    c.strokeStyle="rgba(0,0,0,.6)";c.lineWidth=1.6;c.stroke();
    for(let k=1;k<=3;k++){
      c.strokeStyle="rgba(190,215,235,"+(.06+k*.03).toFixed(2)+")";c.lineWidth=1;
      c.beginPath();c.arc(x,y,rr*(1-k*.22),0,TAU);c.stroke();
    }
    c.fillStyle="#05080d";c.beginPath();c.arc(x,y,rr*.2,0,TAU);c.fill();
  }

  /* центральный потолочный блок */
  const O=P.ohc, ox=W/2-O.w/2;
  plate(c,ox,O.y0,O.w,O.y1-O.y0,"#222c38","#0a0f16");
  c.strokeStyle="rgba(0,0,0,.6)";c.lineWidth=1.6;c.strokeRect(ox,O.y0,O.w,O.y1-O.y0);
  c.fillStyle="#05080c";
  c.fillRect(ox+7,O.y0+7,O.w-14,O.y1-O.y0-14);
  c.strokeStyle=rgba(A,.35);c.lineWidth=1;
  c.strokeRect(ox+7,O.y0+7,O.w-14,O.y1-O.y0-14);

  /* окантовки боковых экранов */
  const M=P.mfd;
  for(const s of [-1,1]){
    c.save();
    const bx=s<0?10:W-10-M.w;
    c.translate(bx+M.w/2,M.y+M.h/2);c.rotate(M.tilt*s);
    plate(c,-M.w/2,-M.h/2,M.w,M.h,"#28323f","#0c1119");
    c.strokeStyle="rgba(0,0,0,.65)";c.lineWidth=2;
    c.strokeRect(-M.w/2,-M.h/2,M.w,M.h);
    c.strokeStyle=rgba(A,.4);c.lineWidth=1;
    c.strokeRect(-M.w/2+3,-M.h/2+3,M.w-6,M.h-6);
    c.fillStyle="#04070b";c.fillRect(-M.w/2+6,-M.h/2+6,M.w-12,M.h-12);
    /* кнопки по нижней кромке */
    c.fillStyle=rgba(A,.22);
    for(let i=0;i<5;i++)c.fillRect(-M.w/2+9+i*((M.w-18)/5),M.h/2-5.5,(M.w-18)/5-3,3);
    c.restore();
  }

  /* переплёт остекления */
  c.save();
  tracePath(c,P.glass);c.clip();
  for(const s of P.strut){
    const g=c.createLinearGradient(s.xt-s.w,0,s.xt+s.w,0);
    g.addColorStop(0,"#05080d");g.addColorStop(.5,"#18202b");g.addColorStop(1,"#05080d");
    c.fillStyle=g;
    c.beginPath();
    c.moveTo(s.xt-s.w,P.brow-2);c.lineTo(s.xt+s.w,P.brow-2);
    c.lineTo(s.xb+s.w*1.5,P.dashY+2);c.lineTo(s.xb-s.w*1.5,P.dashY+2);
    c.closePath();c.fill();
    c.strokeStyle=rgba(A,.18);c.lineWidth=1;c.stroke();
  }
  c.restore();

  /* кант остекления */
  c.strokeStyle=rgba(A,.55);c.lineWidth=2;
  tracePath(c,P.glass);c.stroke();
  c.strokeStyle="rgba(255,255,255,.07)";c.lineWidth=1;
  tracePath(c,P.glass.map(p=>[p[0],p[1]]));c.stroke();

  /* приборная доска */
  const D=P.dashY,DH=P.dashH,x0=P.x0,BW=P.BW;
  plate(c,0,D,W,DH,"#131a24","#05080d");
  c.strokeStyle=rgba(A,.3);c.lineWidth=1.4;
  c.beginPath();c.moveTo(0,D+.5);c.lineTo(W,D+.5);c.stroke();
  /* приподнятая центральная стойка */
  const S2=P.stack;
  c.beginPath();
  c.moveTo(S2.x,D+2);
  c.lineTo(S2.x+S2.w*.1,D-S2.lift);
  c.lineTo(S2.x+S2.w*.9,D-S2.lift);
  c.lineTo(S2.x+S2.w,D+2);
  c.closePath();
  const sg=c.createLinearGradient(0,D-S2.lift,0,D+2);
  sg.addColorStop(0,"#1d2733");sg.addColorStop(1,"#0a1017");
  c.fillStyle=sg;c.fill();
  c.strokeStyle=rgba(A,.35);c.lineWidth=1.2;c.stroke();
  /* боковые «крылья» доски */
  for(const s of [-1,1]){
    const bx=s<0?x0:x0+BW;
    c.beginPath();
    c.moveTo(bx,D+4);
    c.lineTo(bx+s*BW*.16,D-S2.lift*.45);
    c.lineTo(bx+s*BW*.30,D+4);
    c.closePath();
    c.fillStyle="rgba(30,40,52,.85)";c.fill();
    c.strokeStyle=rgba(A,.16);c.lineWidth=1;c.stroke();
  }
  /* кнопочные поля */
  for(const g of P.grid){
    for(let rw=0;rw<g.rows;rw++)for(let cl=0;cl<g.cols;cl++){
      const x=g.x+cl*(g.cw+4), y=g.y+rw*(g.ch+4);
      const on=g.lit[rw*g.cols+cl];
      c.fillStyle=on?rgba(A,.5):"rgba(255,255,255,.06)";
      c.fillRect(x,y,g.cw,g.ch);
      c.strokeStyle="rgba(0,0,0,.55)";c.lineWidth=1;c.strokeRect(x+.5,y+.5,g.cw,g.ch);
      c.fillStyle="rgba(255,255,255,.05)";c.fillRect(x,y,g.cw,1.4);
    }
  }
  /* вентиляционные решётки */
  c.strokeStyle="rgba(0,0,0,.5)";c.lineWidth=1.4;
  for(const v of P.vents)for(let i=0;i<5;i++){
    c.beginPath();c.moveTo(v.x,v.y+i*3.4);c.lineTo(v.x+v.w,v.y+i*3.4);c.stroke();
  }
  /* нос корпуса под остеклением */
  c.beginPath();
  c.moveTo(W/2-P.dip*2.3,D);
  c.lineTo(W/2,D-P.dip);
  c.lineTo(W/2+P.dip*2.3,D);
  c.closePath();
  c.fillStyle="#0a1017";c.fill();
  c.strokeStyle=rgba(A,.4);c.lineWidth=1.2;c.stroke();

  CKPT.key=key;CKPT.plan=P;CKPT.tex=cn;
  return CKPT;
}
function drawCockpit(b,st){
  const C=cockpitTex(G.shipId), P=C.plan, A=hex2rgb(P.acc);
  const D=P.dashY, DH=P.dashH, UH=P.UH, x0=P.x0, BW=P.BW;

  /* блик по остеклению — ползёт вместе с креном, даёт ощущение стекла */
  ctx.save();
  tracePath(ctx,P.glass);ctx.clip();
  const gx=W/2+Math.sin(b.roll)*W*.4, gy=H*.3-Math.sin(b.pitch)*H*.2;
  const gl=ctx.createLinearGradient(gx-W*.3,gy-H*.2,gx+W*.25,gy+H*.25);
  gl.addColorStop(0,"rgba(255,255,255,0)");
  gl.addColorStop(.5,"rgba(190,225,255,.045)");
  gl.addColorStop(1,"rgba(255,255,255,0)");
  ctx.fillStyle=gl;ctx.fillRect(0,0,W,H);
  ctx.restore();

  ctx.drawImage(C.tex,0,0,W,H);

  /* ── боковые экраны ── */
  const M=P.mfd, spd=Math.hypot(b.vx,b.vy,b.vz);
  for(const s of [-1,1]){
    ctx.save();
    const bx=s<0?10:W-10-M.w;
    ctx.translate(bx+M.w/2,M.y+M.h/2);ctx.rotate(M.tilt*s);
    ctx.beginPath();ctx.rect(-M.w/2+6,-M.h/2+6,M.w-12,M.h-12);ctx.clip();
    const iw=M.w-12, ih=M.h-12, ix=-M.w/2+6, iy=-M.h/2+6;
    ctx.strokeStyle=rgba(A,.1);ctx.lineWidth=1;
    for(let i=1;i<5;i++){
      ctx.beginPath();ctx.moveTo(ix,iy+ih*i/5);ctx.lineTo(ix+iw,iy+ih*i/5);ctx.stroke();
    }
    if(s<0){
      /* слева — обстановка вокруг: точки камней по дальности */
      ctx.fillStyle=rgba(A,.85);ctx.font="7px ui-monospace,monospace";ctx.textAlign="left";
      ctx.fillText("ОБСТАНОВКА",ix+4,iy+9);
      for(const a of b.ast){
        const dd=Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
        if(dd>2000)continue;
        const px=ix+4+((a.x-b.x)/2000*.5+.5)*(iw-8);
        const py=iy+13+(1-dd/2000)*(ih-20);
        ctx.fillStyle=a===b.lock?"#f2b25c":RES[a.res].col;
        ctx.globalAlpha=a===b.lock?1:.55;
        ctx.fillRect(px,py,2.2,2.2);
      }
      ctx.globalAlpha=1;
      ctx.fillStyle=rgba(A,.6);ctx.font="7px ui-monospace,monospace";
      ctx.fillText("КАМНЕЙ "+b.ast.length,ix+4,iy+ih-4);
    }else{
      /* справа — состояние систем в столбиках */
      ctx.fillStyle=rgba(A,.85);ctx.font="7px ui-monospace,monospace";ctx.textAlign="left";
      ctx.fillText("СИСТЕМЫ",ix+4,iy+9);
      const rowsv=[["ТОПЛ",G.fuel/st.fuelMax,"#7fe6d8"],["КОРП",G.hull/st.hullMax,"#f2b25c"],
        ["ТРЮМ",held()/st.cargoMax,"#c58ae0"],["РЕЗАК",b.beam?1:0,"#ff9d7a"]];
      rowsv.forEach((rv,i)=>{
        const y=iy+16+i*((ih-22)/rowsv.length);
        ctx.fillStyle="rgba(140,170,190,.7)";ctx.fillText(rv[0],ix+4,y+5);
        ctx.fillStyle="rgba(255,255,255,.08)";ctx.fillRect(ix+30,y,iw-36,4);
        ctx.fillStyle=rv[2];ctx.fillRect(ix+30,y,(iw-36)*clamp(rv[1],0,1),4);
      });
    }
    ctx.restore();
  }

  /* ── центральный потолочный экран: столбики тяги ── */
  const O=P.ohc, ox=W/2-O.w/2;
  const iw2=O.w-14, ih2=O.y1-O.y0-14, ix2=ox+7, iy2=O.y0+7;
  const bw2=iw2/O.bars;
  for(let i=0;i<O.bars;i++){
    const ph=Math.sin(G.t*.07+i*.7)*.5+.5;
    const lvl=clamp((keys.thrust?.55:.2)+ph*.45,0,1);
    ctx.fillStyle=rgba(A,.16+lvl*.5);
    ctx.fillRect(ix2+i*bw2+1,iy2+ih2*(1-lvl),bw2-2,ih2*lvl);
  }
  ctx.strokeStyle=rgba(A,.25);ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(ix2,iy2+ih2*.5);ctx.lineTo(ix2+iw2,iy2+ih2*.5);ctx.stroke();

  /* ── левый блок доски: полёт ── */
  const pad=D+13;
  ctx.font="8px ui-monospace,monospace";ctx.textAlign="left";
  vbar(x0+6,pad,10,UH-28,G.fuel/st.fuelMax,"#7fe6d8","ТОПЛ");
  vbar(x0+34,pad,10,UH-28,G.hull/st.hullMax,"#f2b25c","КОРП");
  const lx=x0+62;
  ctx.fillStyle="rgba(93,115,130,.9)";ctx.fillText("СКОРОСТЬ",lx,pad+8);
  ctx.fillStyle="#7fe6d8";ctx.font="17px ui-monospace,monospace";
  ctx.fillText(spd.toFixed(1),lx,pad+28);
  ctx.font="8px ui-monospace,monospace";ctx.fillStyle="rgba(93,115,130,.9)";
  ctx.fillText("ТЯГА",lx,pad+46);
  ctx.fillStyle="rgba(255,255,255,.08)";ctx.fillRect(lx,pad+50,86,5);
  ctx.fillStyle=keys.thrust?"#f2b25c":"rgba(242,178,92,.3)";
  ctx.fillRect(lx,pad+50,86*(keys.thrust?1:(keys.brake?.15:0)),5);
  ctx.fillStyle="rgba(93,115,130,.9)";
  ctx.fillText("ПЛОСКОСТЬ ПОЯСА "+(b.y>=0?"+":"")+Math.round(b.y),lx,pad+70);
  ctx.fillText("ТАНГАЖ "+(b.pitch*57.3).toFixed(0)+"°  КРЕН "+(b.roll*57.3).toFixed(0)+"°",lx,pad+84);

  /* ── радар на центральной стойке ── */
  const rr=Math.min(UH*.40,56), rcx=x0+BW*.5, rcy=D+UH*.46;
  ctx.strokeStyle="rgba(120,190,210,.3)";ctx.lineWidth=1;
  ctx.beginPath();ctx.arc(rcx,rcy,rr,0,TAU);ctx.stroke();
  ctx.beginPath();ctx.arc(rcx,rcy,rr*.55,0,TAU);ctx.stroke();
  ctx.strokeStyle="rgba(120,190,210,.14)";
  ctx.beginPath();ctx.moveTo(rcx-rr,rcy);ctx.lineTo(rcx+rr,rcy);
  ctx.moveTo(rcx,rcy-rr);ctx.lineTo(rcx,rcy+rr);ctx.stroke();
  ctx.fillStyle="rgba(127,230,216,.12)";
  ctx.beginPath();ctx.moveTo(rcx,rcy);
  ctx.arc(rcx,rcy,rr,-Math.PI/2-.42,-Math.PI/2+.42);ctx.closePath();ctx.fill();
  const RANGE=2000;
  const fx=Math.sin(b.yaw), fz=Math.cos(b.yaw), rx=Math.cos(b.yaw), rz=-Math.sin(b.yaw);
  for(const a of b.ast){
    const dx=a.x-b.x,dz=a.z-b.z,dy=a.y-b.y;
    const dd=Math.hypot(dx,dy,dz);
    if(dd>RANGE)continue;
    const px=(dx*rx+dz*rz)/RANGE*rr, py=(dx*fx+dz*fz)/RANGE*rr;
    const s=a===b.lock?3.4:clamp(a.r/34,1.2,2.6);
    ctx.fillStyle=a===b.lock?"#f2b25c":RES[a.res].col;
    ctx.globalAlpha=a===b.lock?1:clamp(1-Math.abs(dy)/700,.22,1);
    ctx.beginPath();ctx.arc(rcx+px,rcy-py,s,0,TAU);ctx.fill();
    ctx.globalAlpha=1;
  }
  ctx.fillStyle="#e8f4f2";
  ctx.beginPath();ctx.moveTo(rcx,rcy-4);ctx.lineTo(rcx-3,rcy+3);ctx.lineTo(rcx+3,rcy+3);
  ctx.closePath();ctx.fill();
  ctx.fillStyle="rgba(93,115,130,.85)";ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
  ctx.fillText("ОБЗОР 2000",rcx,rcy+rr+12);

  /* ── правый блок: цель и трюм ── */
  const tx=x0+BW*.60;
  ctx.textAlign="left";
  ctx.fillStyle="rgba(93,115,130,.9)";ctx.font="8px ui-monospace,monospace";
  ctx.fillText("ЦЕЛЬ",tx,pad+8);
  if(b.lock){
    const dd=Math.hypot(b.lock.x-b.x,b.lock.y-b.y,b.lock.z-b.z)-b.lock.r;
    ctx.fillStyle=RES[b.lock.res].col;ctx.font="12px ui-monospace,monospace";
    ctx.fillText(RES[b.lock.res].ru.toUpperCase(),tx,pad+24);
    ctx.font="8px ui-monospace,monospace";
    ctx.fillStyle=dd>CUT_RANGE?"rgba(255,107,87,.9)":"rgba(93,115,130,.9)";
    ctx.fillText("×"+b.lock.left+"   "+Math.round(dd)+" М"+
      (dd>CUT_RANGE?"   ДАЛЕКО":""),tx,pad+38);
    ctx.fillStyle="rgba(255,255,255,.08)";ctx.fillRect(tx,pad+44,110,5);
    ctx.fillStyle="#f2b25c";ctx.fillRect(tx,pad+44,110*clamp(b.prog,0,1),5);
  }else{
    ctx.fillStyle="rgba(93,115,130,.5)";ctx.font="11px ui-monospace,monospace";
    ctx.fillText("— НЕТ ЗАХВАТА —",tx,pad+24);
    ctx.font="8px ui-monospace,monospace";
  }
  ctx.fillStyle="rgba(93,115,130,.9)";
  ctx.fillText("ТРЮМ "+held()+" / "+st.cargoMax,tx,pad+66);
  let cxp=tx;
  const cw=Math.min(130,BW*.22);
  ctx.fillStyle="rgba(255,255,255,.07)";ctx.fillRect(tx,pad+70,cw,7);
  for(const k of RES_KEYS){
    const q=G.cargo[k];if(!q)continue;
    const w=cw*q/st.cargoMax;
    ctx.fillStyle=RES[k].col;ctx.fillRect(cxp,pad+70,w,7);cxp+=w;
  }

  /* ── лампы ── */
  const lamps=[
    ["СБЛИЖЕНИЕ",b.near<130,"#ff6b57"],
    ["ТРЮМ ПОЛОН",held()>=st.cargoMax,"#c58ae0"],
    ["ТОПЛИВО",G.fuel/st.fuelMax<.2,"#ff6b57"],
    ["РЕЗАК",!!b.beam,"#f2b25c"],
    ["ОРУДИЕ",st.armed&&b.cool<=0,"#7fe6d8"]
  ];
  let lx2=x0+BW-8;
  ctx.textAlign="right";ctx.font="8px ui-monospace,monospace";
  lamps.forEach((L,i)=>{
    const y=pad+6+i*16;
    const on=L[1]&&(L[0]!=="СБЛИЖЕНИЕ"||Math.sin(G.t*.25)>-.2);
    ctx.fillStyle=on?L[2]:"rgba(255,255,255,.05)";
    ctx.fillRect(lx2-7,y-6,7,7);
    ctx.fillStyle=on?L[2]:"rgba(93,115,130,.45)";
    ctx.fillText(L[0],lx2-13,y);
  });

  /* ── рукоятки и рычаг тяги ──
     просвет между экранными пэдами считаем по той же геометрии, что задаёт CSS
     режима пояса: слева 4 кнопки по 44, справа три по 44 и одна 56 */
  const gL=12+4*44+3*5, gR=W-(12+3*44+56+3*5), gW=gR-gL;
  if(gW>=86){
    const gC=(gL+gR)/2, k=clamp(gW/230,.55,1);
    const yy=H-8, gh=clamp(DH*.26,26,52)*k;
    const tilt=clamp(b.avYaw*8,-.5,.5), lean=clamp(-b.avPitch*7,-.45,.45);
    for(const s of [-1,1]){
      ctx.save();
      ctx.translate(gC+s*gW*.19,yy);
      ctx.fillStyle="rgba(16,22,30,.95)";
      ctx.beginPath();ctx.ellipse(0,0,14*k,6*k,0,0,TAU);ctx.fill();
      ctx.strokeStyle=rgba(A,.3);ctx.lineWidth=1;ctx.stroke();
      ctx.rotate(tilt*.55);
      ctx.strokeStyle="rgba(150,180,200,.6)";ctx.lineWidth=5*k;ctx.lineCap="round";
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(lean*20*k,-gh);ctx.stroke();
      ctx.strokeStyle="rgba(22,30,40,.98)";ctx.lineWidth=10*k;
      ctx.beginPath();ctx.moveTo(lean*15*k,-gh*.68);ctx.lineTo(lean*20*k,-gh);ctx.stroke();
      ctx.fillStyle=(s<0?keys.act:keys.fire)?"#f2b25c":"rgba(242,178,92,.3)";
      ctx.beginPath();ctx.arc(lean*20*k,-gh-1,2.6*k,0,TAU);ctx.fill();
      ctx.lineCap="butt";
      ctx.restore();
    }
    const thx=gC-gW*.40, trk=clamp(DH*.28,28,54)*k, hw=8*k;
    ctx.fillStyle="rgba(10,15,21,.95)";ctx.fillRect(thx-hw,yy-trk-6,hw*2,trk+10);
    ctx.strokeStyle=rgba(A,.28);ctx.lineWidth=1;ctx.strokeRect(thx-hw,yy-trk-6,hw*2,trk+10);
    const tp=keys.thrust?1:(keys.brake?0:.32), th=yy-6-trk*tp;
    ctx.fillStyle="rgba(255,255,255,.06)";ctx.fillRect(thx-2,yy-trk-2,4,trk);
    ctx.fillStyle=keys.thrust?"#f2b25c":"rgba(180,205,222,.65)";
    ctx.fillRect(thx-hw-1,th-4*k,hw*2+2,8*k);
    ctx.fillStyle="rgba(0,0,0,.45)";ctx.fillRect(thx-hw-1,th-1,hw*2+2,2);
  }

  function vbar(x,y,w,h,frac,col,label){
    ctx.fillStyle="rgba(255,255,255,.07)";ctx.fillRect(x,y,w,h);
    const f=clamp(frac,0,1);
    ctx.fillStyle=f<.22?"#ff6b57":col;
    ctx.fillRect(x,y+h*(1-f),w,h*f);
    ctx.strokeStyle="rgba(0,0,0,.5)";ctx.lineWidth=1;
    for(let i=1;i<5;i++){
      ctx.beginPath();ctx.moveTo(x,y+h*i/5);ctx.lineTo(x+w,y+h*i/5);ctx.stroke();
    }
    ctx.fillStyle="rgba(93,115,130,.9)";ctx.font="8px ui-monospace,monospace";ctx.textAlign="left";
    ctx.fillText(label,x-1,y+h+11);
  }
}