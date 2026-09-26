/* ══════════════ СТАПЕЛЬ — лист (D16, дизайн-проход) ══════════════
   Заказ рисуется не голым силуэтом в пустоте, а на стапеле: бетонные плиты в
   грунте державы, рельсы со шпалами, подпоры, кран, два человека для мерила,
   размерные линии белой тушью и эмблема хозяйки земли. Свет один — фонарь в
   левом верхнем углу, всё стоящее отбрасывает тень туда же. Пока заказ в
   работе, корпус обшит на долю смены от кормы; необшитое — набор в сурике.
   Рисуется раз на сдвиг ползунка: кисти те же, холст — GPU (08ca), печёт и кладёт
   его один кадр (stapelHullTick); 2D-холста и 2D-корпуса у листа нет (26.09).
   st.draft — черновик протяжки (stapelDraft): те же рамка и масштаб, без выпечки;
   st.cv — прежний холст листа: того же размера он и остаётся, вёрстка не дёргается */
function stapelSheet(o,cw,ch,st){
  st=st||{};
  const prog=clamp(st.prog==null?1:st.prog,0,1),by=o.by;
  const dpr=Math.min(2,window.devicePixelRatio||1)*(typeof UIK==="number"?UIK:1);
  const Wd=Math.round(cw*dpr),Hd=Math.round(ch*dpr);
  let cv=st.cv;
  if(!cv||cv.tagName!=="CANVAS"||cv.width!==Wd||cv.height!==Hd){cv=document.createElement("canvas");
    cv.width=Wd;cv.height=Hd;cv.style.width=cw+"px";cv.style.height=ch+"px";cv.className="stp-sheet";}
  /* корпус: та же временная запись, что у превью */
  NPC_SHIPS[STAPEL_PV]=stapelShip(Object.assign({seed:0x57A9,no:0},o));
  delete HULL_CACHE[STAPEL_PV+"!"+by];
  const hl=hullOf(STAPEL_PV);
  /* границы корпуса — по нарисованному, не по halfW: остриё носа и гондолы выходят
     за числа генератора, а лист обязан их вместить и мерить честно */
  const b=stapelHullBox(hl,!!st.draft),Lw=b.x1-b.x0,Lh=b.y1-b.y0;
  const sc=Math.min((cw-96)/Lw,(ch-92)/Lh);
  stapelSheet.last={l:Math.round(Lw),b:Math.round(Lh)};
  const cx0=cw*.5-4,cy0=ch*.5+2,X0=cx0-(b.x0+b.x1)*.5*sc,Y0=cy0-(b.y0+b.y1)*.5*sc;
  const xn=X0+b.x1*sc,xt=X0+b.x0*sc,hw=Lh*.5*sc,xf=xt+(xn-xt)*prog;
  const ry=[cy0-hw-11,cy0+hw+11];
  /* корпус — своей выпечкой (кадр печёт её первой): обшивка и набор в сурике там же, source-atop */
  const hull=oc=>{
    oc.save();oc.translate(X0,Y0);oc.scale(sc,sc);
    hullPart1(hl,STAPEL_PV,0,false);hullPart2(hl);hullPart3(hl,STAPEL_PV);   /* тело — кисти выпечки корпуса (17c2) */
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
  };
  /* рисунок — кистями 2D в GPU-холст: кадр печёт его раз на лист (stapelHullTick) */
  const g=makerGround(by)||[170,170,170],P=powerOf(by),seed=(hashi(o.no|0,by.charCodeAt(0),0x57A9)>>>0)||1;
  const base=[13,16,21],mix=k=>base.map((v,i)=>Math.round(v+(g[i]-v)*k));
  const rgba=(a,al)=>"rgba("+a[0]+","+a[1]+","+a[2]+","+al+")";
  const ink=STP_INK;
  /* пол, фонарь и эмблема от корпуса не зависят — их же печёт чистый лист черновика (clean) */
  const ground=(c,r)=>{
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
  };
  const lamp=c=>{
    /* фонарь в углу — источник у света, и пятно света от него */
    const lx=12,ly=12,gl=c.createRadialGradient(lx,ly,0,lx,ly,cw*.75);
    gl.addColorStop(0,"rgba(255,214,150,.16)");gl.addColorStop(.4,"rgba(255,214,150,.05)");gl.addColorStop(1,"rgba(255,214,150,0)");
    c.globalCompositeOperation="lighter";c.fillStyle=gl;c.fillRect(0,0,cw,ch);
    const gh=c.createRadialGradient(lx,ly,0,lx,ly,9);
    gh.addColorStop(0,"rgba(255,236,196,.9)");gh.addColorStop(1,"rgba(255,214,150,0)");
    c.fillStyle=gh;c.fillRect(lx-9,ly-9,18,18);c.globalCompositeOperation="source-over";
    c.fillStyle="rgba(0,0,0,.7)";c.beginPath();c.arc(lx+3,ly+4,3,0,TAU);c.fill();
    c.fillStyle="#fff2d6";c.beginPath();c.arc(lx,ly,1.8,0,TAU);c.fill();
  };
  const marks=c=>{
    /* эмблема хозяйки и номер стапеля */
    const oldc=ctx;ctx=c;try{powerEmblem(by,cw-22,19,10);}finally{ctx=oldc;}
    c.textAlign="right";c.textBaseline="middle";c.fillStyle=P.col||ink;c.font="10px ui-monospace,monospace";
    c.fillText(makerRu(by).toUpperCase(),cw-38,15);
    c.fillStyle="rgba(226,234,244,.5)";c.fillText("стапель № "+(1+((hashi(G.sx|0,G.sy|0,0x57A9)>>>0)%9)),cw-38,27);
  };
  const paint=(c,HB)=>{
    const r=rng(seed);
    ground(c,r);
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
    /* корпус на пол — одним вызовом с тенью */
    c.save();c.shadowColor="rgba(0,0,0,.6)";c.shadowBlur=7;c.shadowOffsetX=5;c.shadowOffsetY=6;
    c.drawImage(HB,0,0,cw,ch);c.restore();
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
    lamp(c);
    /* размерные линии белой тушью */
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
    marks(c);
    /* ГОТОВ — красный двойной штамп, как «СОГЛАСОВАНО» на синьке */
    if(st.ready){
      c.save();c.translate(cx0+(xn-cx0)*.35,cy0-2);c.rotate(-.16);
      c.strokeStyle="rgba(214,62,52,.9)";c.lineWidth=2;c.strokeRect(-46,-15,92,30);c.lineWidth=1;c.strokeRect(-42,-11,84,22);
      c.fillStyle="rgba(214,62,52,.92)";c.font="bold 17px ui-monospace,monospace";c.textAlign="center";c.fillText("ГОТОВ",0,1);
      c.restore();
    }
  };
  stapelSheet.gd={cv,cw,ch,nd:dpr,ship:NPC_SHIPS[STAPEL_PV],by,hull,paint,sig:++STP_G.k,draft:!!st.draft,
    clean:c=>{ground(c,rng(seed));lamp(c);marks(c);},ck:[by,cw,ch,dpr,seed,G.sx|0,G.sy|0].join(),floor:rgba(mix(.09),1),
    geo:{hl,X0,Y0,sc,xn,xt,hw,cx0,cy0,ry,Lw,Lh,ink:b.ink}};
  return cv;
}
const STP_INK="rgba(226,234,244,.72)";
/* черновик протяжки — задуманный чертёж, а не заглушка: чистый лист (пол, фонарь, эмблема — одна выпечка
   на открытие листа) и поверх него примитивами ov в кадре, без выпечки: рельсы, осевая штрихпунктиром,
   корпус тушью по путям его же кистей, размерные линии с метрами — той же рамки и масштаба, что у
   полного листа: отпустили — лист ложится на то же место */
function stapelDraft(D,C){
  const cw=D.cw,ch=D.ch,q=D.geo,h=q.hl,ink=STP_INK,k=q.sc;
  if(C)ovImage(C,cw/2,ch/2,cw,ch,0,0,0,1,1,1);else ovRect(0,0,cw,ch,D.floor);
  const X=x=>q.X0+x*k,Y=y=>q.Y0+y*k;
  const loop=(pts,sy,w,al)=>{for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];
    ovCap(X(a[0]),Y(a[1]*sy),X(b[0]),Y(b[1]*sy),w,ink,al);}};
  const dash=(x0,y0,x1,y1,pat,w,al)=>{const L=Math.hypot(x1-x0,y1-y0),ux=(x1-x0)/L,uy=(y1-y0)/L;
    for(let t=0,i=0;t<L;t+=pat[i%pat.length]+pat[(i+1)%pat.length],i+=2){const e=Math.min(L,t+pat[i%pat.length]);
      ovCap(x0+ux*t,y0+uy*t,x0+ux*e,y0+uy*e,w,ink,al);}};
  /* рельсы со шпалами — как у листа: они идут за шириной корпуса */
  for(let x=10;x<cw-10;x+=8)for(const y of q.ry)ovRect(x-1.5,y-5,x+1.5,y+5,"rgba(0,0,0,.45)");
  for(const y of q.ry){ovRect(6,y-2,cw-6,y+3,"rgba(0,0,0,.5)");ovRect(6,y-2,cw-6,y-.5,"rgba(196,202,210,.5)");ovRect(6,y+1,cw-6,y+2,"rgba(196,202,210,.22)");}
  /* осевая — штрихпунктир чертежа */
  dash(q.xt-14,q.cy0,q.xn+14,q.cy0,[9,2.5,1.5,2.5],.8,.4);
  /* корпус — контуры его же кистей (stapelHullBox) тонкой тушью, поверх — обвод тела и крыльев
     толстой: у чертежа главная линия — силуэт */
  for(const c of q.ink){const P=c.p,n=P.length;
    for(let i=2;i<n;i+=2)ovCap(X(P[i-2]),Y(P[i-1]),X(P[i]),Y(P[i+1]),.7,ink,.5);
    if(c.c)ovCap(X(P[n-2]),Y(P[n-1]),X(P[0]),Y(P[1]),.7,ink,.5);}
  for(const w of h.wings)for(const s of [1,-1])loop(w,s,1.1,.85);
  loop(h.poly,1,1.3,.95);
  /* размерные линии — как у листа: выносные пунктиром, стрелки-засечки, метры на плашке грунта */
  const dy=ch-10,xt=q.xt,xn=q.xn,cy0=q.cy0,hw=q.hw,F="10px ui-monospace,monospace";
  dash(xt+.5,cy0+hw*.4,xt+.5,dy+4,[2,3],1,.35);dash(xn+.5,cy0,xn+.5,dy+4,[2,3],1,.35);
  ovCap(xt,dy+.5,xn,dy+.5,1,ink);ovCap(xt-3,dy+3.5,xt+3,dy-2.5,1,ink);ovCap(xn-3,dy+3.5,xn+3,dy-2.5,1,ink);
  const label=(x,y,t,vert)=>{const Q=[],r=ovText(Q,x,y,t,F,ink,"center","middle",1,1,vert);
    if(vert)ovRect(x-6.5,r.y0-4,x+5.5,r.y1+4,D.floor);else ovRect(r.x0-4,y-6.5,r.x1+4,y+5.5,D.floor);
    for(const v of Q)OVL.uq.push(v);};
  label((xt+xn)/2,dy+.5,Math.round(q.Lw)+" м");
  const dx=cw-12;
  ovCap(dx+.5,cy0-hw,dx+.5,cy0+hw,1,ink);ovCap(dx-3,cy0-hw+3,dx+3,cy0-hw-3,1,ink);ovCap(dx-3,cy0+hw+3,dx+3,cy0+hw-3,1,ink);
  label(dx+.5,cy0,Math.round(q.Lh)+" м",true);
}
/* рамка корпуса в единицах мира — по вершинам GPU-холста (08ca: GcCtx режет пути на треугольники
   процессором), без растра и чтения пикселей. Кисти — те же, что у выпечки студии (hullPart1..3), в
   масштабе 8: волоски холст расширяет до пикселя, и на ×1 они торчали бы на полединицы. Клип сужает
   рамку команды; краска прозрачнее 24/255 не в счёт — порог прежней пробы по пикселям. Против самой
   выпечки на видеокарте (84 корпуса, 26.09) — худшее 0.42 % длины.
   Рамка — раз на кадр протяжки, поэтому дёшево: заливку и штрих, чья граница заведомо внутри набранной
   рамки (точки пути; у штриха — плюс полширины с запасом на митру), холст не режет вовсе — рамку они не
   раздвинут; режет только то, что может вылезти. Итог тот же, что у полной записи.
   ink — ещё и контуры для черновика (stapelDraft): пути плотных заливок и штрихов, как их записал холст,
   в единицах мира; мелочь (заклёпки, огоньки) и повторы — прочь */
function stapelHullBox(hl,ink){
  const K=8,g=new GcCtx(1,1,1),prev=ctx,U=[1e9,1e9,-1e9,-1e9],L=[],seen=new Set();
  g._dry=true;   /* текст — размером, без растра маски: на протяжке каждая мерка новая (08cb) */
  const bb=(v,s)=>{let a=1e9,b=1e9,c=-1e9,d=-1e9;
    for(let i=0;i<v.length;i+=s){const x=v[i],y=v[i+1];if(x<a)a=x;if(x>c)c=x;if(y<b)b=y;if(y>d)d=y;}return [a,b,c,d];};
  /* граница точек пути: у заливки — только подпути от трёх точек (как веер 08ca) */
  const spb=(sp,n)=>{let a=1e9,b=1e9,c=-1e9,d=-1e9;
    for(const q of sp){const P=q.p;if(P.length<n*2)continue;
      for(let i=0;i<P.length;i+=2){const x=P[i],y=P[i+1];if(x<a)a=x;if(x>c)c=x;if(y<b)b=y;if(y>d)d=y;}}
    return c<a?null:[a,b,c,d];};
  const inside=(a,b,c,d)=>a>=U[0]&&b>=U[1]&&c<=U[2]&&d<=U[3];
  const inkAdd=(sp,cl)=>{
    for(const sb of sp){const P=sb.p;if(P.length<4)continue;
      const key=(P[0]|0)+","+(P[1]|0)+","+P.length+","+(P[P.length-2]|0);if(seen.has(key))continue;seen.add(key);
      const o=[P[0]/K,P[1]/K];let px=P[0],py=P[1];
      for(let i=2;i<P.length;i+=2)if(Math.abs(P[i]-px)+Math.abs(P[i+1]-py)>K*.45||i===P.length-2){px=P[i];py=P[i+1];o.push(px/K,py/K);}
      if(o.length>=4)L.push({c:sb.c||cl,p:o});}};
  const inkOk=(al,clip,op,r)=>ink&&al>=.45&&!(clip&&clip.length)&&op==="source-over"&&Math.max(r[2]-r[0],r[3]-r[1])>=K*1.2;
  const alOf=q=>q.t==="i"?q.a:q.p?(q.p.k===0?q.p.c[3]:q.p.a):0;
  /* записанная команда → в рамку (и в тушь) */
  const take=(q,sp)=>{
    if(q.op.startsWith("destination"))return;
    const al=alOf(q);if(!(al>.094))return;
    let [a,b,c,d]=bb(q.v,q.t==="i"||q.t==="x"?4:2);
    for(const k of q.clip||[]){const m=k.bb||(k.bb=bb(k.v,2));a=Math.max(a,m[0]);b=Math.max(b,m[1]);c=Math.min(c,m[2]);d=Math.min(d,m[3]);}
    if(c<a||d<b)return;
    U[0]=Math.min(U[0],a);U[1]=Math.min(U[1],b);U[2]=Math.max(U[2],c);U[3]=Math.max(U[3],d);
    if(sp&&inkOk(al,q.clip,q.op,[a,b,c,d]))inkAdd(sp,q.t==="f");};
  const f0=g._fill,s0=g._stroke;
  g._fill=function(sp,eo,st,op,am){
    const r=spb(sp,3);if(!r)return;
    if(inside(...r)){if(am>=0)this._chk(op);
      if(ink&&inkOk(1,this._clip,op,r)&&!op.startsWith("destination")){const p=this._paint(st,am);if(p&&inkOk(p.k===0?p.c[3]:p.a,null,op,r))inkAdd(sp,true);}
      return;}
    const n=this._ops.length;f0.call(this,sp,eo,st,op,am);const q=this._ops[n];if(q){this._ops.length=n;take(q,sp);}};
  g._stroke=function(sp){
    const r=spb(sp,1);if(!r)return;
    const m=this._m,dw=this._lw*Math.sqrt(Math.abs(m[0]*m[3]-m[1]*m[2])),R=Math.max(dw,1)/2*Math.max(this._ml||10,1.5)+2;
    if(inside(r[0]-R,r[1]-R,r[2]+R,r[3]+R)){const op=this.globalCompositeOperation;this._chk(op);
      if(ink&&inkOk(1,this._clip,op,r)){const p=this._paint(this.strokeStyle,dw<1?dw:1);if(p&&inkOk(p.k===0?p.c[3]:p.a,null,op,r))inkAdd(sp,false);}
      return;}
    const n=this._ops.length;s0.call(this,sp);const q=this._ops[n];if(q){this._ops.length=n;take(q,sp);}};
  g.setTransform(K,0,0,K,0,0);ctx=g;
  /* без холста (Node) текст кистей не меряется — тогда рамка по числам генератора */
  let bad=false;
  try{hullPart1(hl,STAPEL_PV,0,false);hullPart2(hl);hullPart3(hl,STAPEL_PV);}catch(e){bad=true;}finally{ctx=prev;}
  if(!bad)for(const q of g._ops)take(q,null);   /* текст и картинки */
  if(bad||U[2]<U[0])return {x0:hl.tail,x1:hl.nose,y0:-hl.halfW,y1:hl.halfW,ink:[]};
  return {x0:U[0]/K,x1:U[2]/K,y0:U[1]/K,y1:U[3]/K,ink:L};
}
/* лист на движке: кадр печёт две выпечки GPU-холста (корпус с набором, потом весь лист с ним) и кладёт
   лист в свой холст webgpu — раз на лист, устройство или холст (как силуэт ОПИСИ, 27j). Только при открытой
   станции: набор, что построил её и не закрыл, не должен печь в кадрах чужих сцен. STP_G.n — сколько раз */
const STP_G={cv:null,cx:null,dev:null,T:null,bk:[],sig:0,k:0,n:0,pend:null,C:null,ck:"",nc:0,dr:false,f0:-1};
const STP_FADE=120;   /* мс: черновик уступает листу, отпустили ползунок */
/* протяжка ползунка: лист (рамка по вершинам ×8, выпечка) — не чаще раза в кадр, последнее значение
   побеждает. Половина плотности на протяжке не помогает (26.09, ×4 CPU: медиана 57 → 82 мс): выпечка
   упирается в разбор кистей на процессоре, а мелкий лист уходит в ss 2 — поэтому на протяжке черновик
   (stapelDraft), а лист печётся раз, по отпусканию. Без видеокарты — сразу */
function stapelLater(f){if(!GPU.ok||!GPU.dev){f();return;}STP_G.pend=f;}
function stapelHullTick(){
  if(STP_G.pend){const f=STP_G.pend;STP_G.pend=null;f();}
  const D=stapelSheet.gd,cv=D&&D.cv,g=STP_G;
  if(!cv||!cv.isConnected||typeof $st==="undefined"||!$st||!$st.classList.contains("open")||!GPU.on||!GPU.enc||!GPU.dev)return;
  if(g.cv!==cv||g.dev!==GPU.dev){
    const cx=cv.getContext("webgpu");if(!cx)return;
    cx.configure({device:GPU.dev,format:GPU.fmt,alphaMode:"premultiplied"});
    if(g.dev!==GPU.dev){g.C=null;g.ck="";}
    g.cv=cv;g.cx=cx;g.dev=GPU.dev;g.T=ovTarget();g.sig=0;}
  if(g.sig===D.sig&&g.f0<0)return;
  const W=cv.width,H=cv.height,nd=D.nd,now=wallMs();
  if(g.sig!==D.sig){
    /* черновик — ни одной выпечки: чистый лист уже есть с прошлого полного */
    if(!D.draft){
      /* временная запись заказа могла смениться другим листом или сбросом мира — возвращаем свою */
      if(NPC_SHIPS[STAPEL_PV]!==D.ship){NPC_SHIPS[STAPEL_PV]=D.ship;delete HULL_CACHE[STAPEL_PV+"!"+D.by];}
      for(const b of g.bk)gpuBakeDrop(b);g.bk=[];
      const HB=gpuBake(W,H,oc=>{oc.scale(nd,nd);D.hull(oc);},{mips:false,once:true});
      const B=HB&&gpuBake(W,H,c=>{c.scale(nd,nd);D.paint(c,HB);},{mips:false,once:true});
      if(!B)return;
      g.bk=[HB,B];g.n++;
      if(g.ck!==D.ck){if(g.C)gpuBakeDrop(g.C);
        g.C=gpuBake(W,H,c=>{c.scale(nd,nd);D.clean(c);},{mips:false,once:true});g.ck=g.C?D.ck:"";g.nc++;}
      g.f0=g.dr?now:-1;   /* после черновика — короткая смена, не щелчок */
    }
    g.sig=D.sig;g.dr=D.draft;
  }
  const t=g.f0<0?1:Math.min(1,(now-g.f0)/STP_FADE);
  ovInto(g.T,nd,()=>{
    if(D.draft||t<1)stapelDraft(D,g.C);
    if(!D.draft)ovImage(g.bk[1],D.cw/2,D.ch/2,D.cw,D.ch,0,0,0,1,1,t);
  });
  ovPass(g.T,g.cx.getCurrentTexture().createView(),W,H,[g.T.uq],"stapel");
  if(t>=1)g.f0=-1;
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
