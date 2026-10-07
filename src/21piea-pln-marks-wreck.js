/* ══════════════ планета: остов корабля — тело (M627b, проход 2) ══════════════
   Корпус переломлен надвое: нос (+x) задран, корма (−x) лежит; между ними — голые шпангоуты.
   Обшивка — своя сетка, не лофт: у неё есть рельеф. Сечение то же, что у лофта (суперэллипс,
   брюхо поджато), поэтому швы и окна ложатся точно на борт. Швы листов — тёмные кольца через
   1,2 м и две продольные линии; две-три вмятины давят борт внутрь на светлой стороне; торцы
   разлома рваные — каждая образующая кончается своей длиной, за кромкой тёмное нутро, наружу
   отогнуты листы; копоть у разлома и у двигательного отсека; пыль на верхней трети — цветом
   земли. Рубка — светлая полоса остекления с тремя тёмными окнами. Свет один: лампы только у мест.
   У линии хода — то, чего касается рука: люк в корме, грузовой отсек в носу (толстая рама,
   тёмный проём, ящики по 0,9 м), самописец под носом, мачта маяка у кормы. Места — смещения
   из 21pif, одна правда на двоих. T — набор рук plnMarkMesh (21pie). */
function plnMarkWreck(T){
  const {C,r,MAN,ROCK,GLOW,m,out,part,hand,noise,steel,box,rod,lamp,H,sd,gy,P,oz}=T;
  const L=H*2.6,R=H*.34,rust=.55,sH=Math.max(.75,Math.min(1,R/2.2));
  const dx=id=>plnActSpotDx("wreck",id,H);
  /* половина корпуса: xa — торец, xb — разлом; профиль общий, кусок [u0,u1] — доля половины */
  /* профиль почти цилиндр: сильное сужение к торцам читалось дирижаблем */
  const half=(xa,xb,ya,yb)=>({xa,xb,at:u=>({x:lerp(xa,xb,u),ry:R*(.74+.26*Math.sin(Math.PI*(.15+.7*u))),y:lerp(ya,yb,u)}),
    u:x=>clamp((x-xa)/(xb-xa),0,1)});
  const tail=half(-L*.5,-L*.12,R*.4,R*.55),nose=half(L*.08,L*.5,R*.6,R*1.25);
  /* сечение лофта: суперэллипс sq .15, брюхо .85, бок .92 */
  const E=2/(2+2*.15),sp=v=>Math.sign(v)*Math.pow(Math.abs(v),E);
  /* вмятины на светлой стороне: x, угол сечения (π — ближний бок, π/2 — верх), радиус, глубина, м */
  const dents=[[L*.27,Math.PI*.7,R*.42,R*.14],[L*.42,Math.PI*.86,R*.3,R*.11],[L*.2,Math.PI*.55,R*.32,R*.1],[-L*.34,Math.PI*.7,R*.36,R*.12]];
  const dent=(x,a,ry)=>{let k=0;for(const d of dents){let da=Math.abs(a-d[1]);da=Math.min(da,TAU-da);
    const q=((x-d[0])**2+(da*ry)**2)/(d[2]*d[2]);if(q<5)k+=d[3]*Math.exp(-q)/ry;}return k;};
  /* точка обшивки: доля половины u, угол a, f — над бортом (1 — сам борт) */
  const pt=(h,u,a,f)=>{const q=h.at(u),sa=Math.sin(a),k=(f||1)*(1-dent(q.x,a,q.ry));
    return [q.x,q.y+q.ry*sp(sa)*(sa<0?.85:1)*k,q.ry*.92*sp(Math.cos(a))*k];};
  /* нормаль обшивки разностью: вдоль и поперёк, наружу от оси */
  const nrm=(h,u,a)=>{const e=.002,p=pt(h,u,a),q=h.at(u);
    let n=plnNorm(plnCross(plnSub(pt(h,u+e,a),pt(h,u-e,a)),plnSub(pt(h,u,a+e*4),pt(h,u,a-e*4))));
    if(plnDot(n,[0,p[1]-q.y,p[2]])<0)n=plnMul(n,-1);return n;};
  /* ближний борт на высоте y: z обшивки (точно по сечению, без вмятин) */
  const flank=(h,x,y)=>{const q=h.at(h.u(x)),dy=clamp((y-q.y)/(q.ry*(y<q.y?.85:1)),-1,1),sa=Math.pow(Math.abs(dy),1/E);
    return -q.ry*.92*Math.pow(Math.sqrt(Math.max(0,1-sa*sa)),E);};
  /* кожа: сталь в ржавчине; копоть (темнее и теплее) у разлома и у сопел; пыль цветом земли сверху */
  const SOOT=[.15,.1,.075],DUST=plnMix3(P.rockWarm,P.rockCool,.3),brk=[tail.xb,nose.xa];
  const hullCol=(p,n)=>{
    let c=steel(C.steel,rust*.7)(0,p,0);
    const nb=noise(p,.9,5),near=Math.min(Math.abs(p[0]-brk[0]),Math.abs(p[0]-brk[1]));
    const sc=Math.max(plnSmooth(2.4,.2,near),.9*plnSmooth(-L*.36,-L*.48,p[0]))*(.5+.5*nb);
    c=plnMix3(c,SOOT,.85*sc);
    return plnMix3(c,DUST,.6*plnSmooth(.35,.85,n[1])*(.45+.55*noise(p,.35,6)));};
  /* рваный край: у каждой образующей своя длина, м; каждый третий зуб длиннее */
  const jag=s=>.1+.7*Math.pow(.5+.5*Math.sin(s*2.9+sd*.31)*Math.cos(s*1.37+sd*.7),1.6)+(s%3===0?.28:0);
  const DEEP=[.035,.03,.032];
  /* обшивка половины h на [u0,u1]; end — где разлом (1 — у u1, 0 — у u0, null — нет), pv — ось части */
  const hull=(mesh,h,u0,u1,end,pv)=>{
    const len=Math.abs(h.xb-h.xa),N=Math.max(6,Math.ceil(len*(u1-u0)/.4)),S=32,ox=pv?pv[0]:0,oy=pv?pv[1]:0;
    const U=(k,s)=>{const f=k/N;return end===1?lerp(u0,u1-jag(s)/len,f):end===0?lerp(u0+jag(s)/len,u1,f):lerp(u0,u1,f);};
    const id=[],ps=[];
    for(let k=0;k<=N;k++){const row=[],pr=[];
      for(let s=0;s<S;s++){const u=U(k,s),a=s/S*TAU,p=pt(h,u,a),n=nrm(h,u,a);pr.push(p);
        row.push(plnVert(mesh,[p[0]-ox,p[1]-oy,p[2]],n,hullCol(p,n),MAN,0,0,0));}
      id.push(row);ps.push(pr);}
    for(let k=0;k<N;k++)for(let s=0;s<S;s++){const s2=(s+1)%S;plnQuad(mesh,id[k][s],id[k][s2],id[k+1][s2],id[k+1][s]);}
    /* целые торцы — крышкой; торец разлома — кромка, тёмное нутро на 1,3 м и тёмное дно */
    for(const k of [0,N]){
      const isBrk=(end===1&&k===N)||(end===0&&k===0),q=h.at(U(k,0)),dir=k?1:-1;
      if(!isBrk){const c=plnVert(mesh,[q.x-ox,q.y-oy,0],[dir,0,0],plnMix3(C.steelDk,SOOT,.5),MAN,0,0,0);
        for(let s=0;s<S;s++)plnTri(mesh,c,id[k][s],id[k][(s+1)%S]);continue;}
      const inn=[],dp=[],back=-dir*1.3/len;
      for(let s=0;s<S;s++){const u=U(k,s),a=s/S*TAU,pi=pt(h,u,a,.9),pd=pt(h,clamp(u+back,0,1),a,.86),qq=h.at(u);
        const ni=plnNorm([0,qq.y-pi[1],-pi[2]]);
        inn.push(plnVert(mesh,[pi[0]-ox,pi[1]-oy,pi[2]],ni,plnMix3(SOOT,C.soot,.4),MAN,0,0,0));
        dp.push(plnVert(mesh,[pd[0]-ox,pd[1]-oy,pd[2]],ni,DEEP,MAN,0,0,0));}
      for(let s=0;s<S;s++){const s2=(s+1)%S;plnQuad(mesh,id[k][s],id[k][s2],inn[s2],inn[s]);plnQuad(mesh,inn[s],inn[s2],dp[s2],dp[s]);}
      const qd=h.at(clamp(U(k,0)+back,0,1)),c=plnVert(mesh,[qd.x-ox,qd.y-oy,0],[dir,0,0],DEEP,MAN,0,0,0);
      for(let s=0;s<S;s++)plnTri(mesh,c,dp[s],dp[(s+1)%S]);
      /* листы, отогнутые наружу: прямой отрезок вдоль корпуса и загиб; по две образующие шириной */
      const nP=4+(sd&1);
      for(let i=0;i<nP;i++){
        const s=Math.round((.42+i*.21+r()*.05)*S/2)%S,s2=(s+2)%S,A=ps[k][s],B=ps[k][s2];
        const mid=plnMul(plnAdd(A,B),.5),rad=plnNorm([0,mid[1]-q.y,mid[2]]),ax=[dir,0,0];
        const l1=.2+r()*.2,l2=.35+r()*.55,be=.45+r()*.75;
        const d2=plnNorm([dir*Math.cos(be),rad[1]*Math.sin(be),rad[2]*Math.sin(be)]);
        const A1=plnAdd(A,plnMul(ax,l1)),B1=plnAdd(B,plnMul(ax,l1*(.6+r()*.6))),A2=plnAdd(A1,plnMul(d2,l2)),B2=plnAdd(B1,plnMul(d2,l2*(.5+r()*.4)));
        const col=hullCol(mid,rad),o=[ox,oy,0],w=v=>plnSub(v,o);
        plnCard(mesh,w(A),w(B),w(B1),w(A1),rad,col,MAN,null,0,0);
        plnCard(mesh,w(A1),w(B1),w(B2),w(A2),plnNorm(plnCross(plnSub(B1,A1),d2)),plnMix3(col,SOOT,.4),MAN,null,0,0);}
    }
  };
  /* шов по сечению на x и продольная линия по углу a; полоса — приподнятый кусок обшивки */
  const SEAM=[.17,.18,.2];
  const ring=(mesh,h,x,pv)=>{const u=h.u(x),ox=pv?pv[0]:0,oy=pv?pv[1]:0,pts=[];
    for(let k=0;k<=32;k++){const p=pt(h,u,k/32*TAU,1.006);pts.push([p[0]-ox,p[1]-oy,p[2]]);}
    plnTube(mesh,{path:pts,rad:.024,sides:4,col:SEAM,mat:MAN});};
  const line=(mesh,h,x0,x1,a,pv)=>{const ox=pv?pv[0]:0,oy=pv?pv[1]:0,pts=[];
    for(let k=0;k<=12;k++){const p=pt(h,h.u(lerp(x0,x1,k/12)),a,1.006);pts.push([p[0]-ox,p[1]-oy,p[2]]);}
    plnTube(mesh,{path:pts,rad:.02,sides:4,col:SEAM,mat:MAN});};
  const seams=(mesh,h,x0,x1,pv)=>{for(let x=x0;x<=x1;x+=1.2)ring(mesh,h,x,pv);
    for(const a of [Math.PI*.6,Math.PI*1.2])line(mesh,h,x0-.4,x1+.4,a,pv);};
  const patch=(mesh,h,x0,x1,a0,a1,f,col,nx,na,sh)=>{const id=[];
    for(let i=0;i<=nx;i++){const row=[];for(let j=0;j<=na;j++){const u=h.u(lerp(x0,x1,i/nx)),a=lerp(a0,a1,j/na),p=pt(h,u,a,f),n=nrm(h,u,a);
      row.push(plnVert(mesh,p,n,typeof col==="function"?col(p,n):col,MAN,0,0,sh||0));}id.push(row);}
    for(let i=0;i<nx;i++)for(let j=0;j<na;j++)plnQuad(mesh,id[i][j],id[i][j+1],id[i+1][j+1],id[i+1][j]);};

  hull(m,tail,.6,1,1);hull(m,nose,0,1,0);
  seams(m,tail,tail.at(.6).x+.7,tail.xb-1.3);seams(m,nose,nose.xa+1.3,nose.xb-.5);
  /* пояс — одна оранжевая полоса по обводу носа, за грузовым отсеком */
  patch(m,nose,L*.355,L*.375,0,TAU,1.009,(p,n)=>plnMix3(steel(C.orange,.3)(0,p,0),DUST,.5*plnSmooth(.35,.85,n[1])),1,32);
  /* нос — обтекатель на торце; рубка — светлая полоса и три тёмных окна по ней */
  {const q=nose.at(1);
    /* обтекатель короткий, гранёный и смятый ударом, чуть клюнул вниз — гладкий эллипсоид был воздушным шаром */
    plnBlob(m,{c:[nose.xb-R*.05,q.y,0],r:[R*.72,q.ry*.97,q.ry*.9],sub:3,box:.72,bump:.09,bumpF:2.6,seed:sd+11,lean:-.1,
      col:(u,p,n)=>plnMix3(hullCol(p,n),SOOT,.35*plnSmooth(.2,.9,u[0])),mat:MAN});
    ring(m,nose,nose.xb-.15);
    const x0=L*.405,x1=L*.497;
    patch(m,nose,x0,x1,Math.PI*.5,Math.PI*.92,1.008,steel(C.steelLt,.2),4,8);
    for(let i=0;i<3;i++){const a=lerp(x0,x1,.06+i*.31),b=a+(x1-x0)*.26;
      patch(m,nose,a,b,Math.PI*.58,Math.PI*.84,1.016,[.05,.065,.09],2,4,.8);}}
  /* шпангоуты между половинами и киль */
  for(let i=0;i<4;i++){
    const x=lerp(L*.06,-L*.1,i/3),R2=R*(.85-.06*i),pts=[];
    for(let k=0;k<=16;k++){const a=k/16*TAU;pts.push([x,R*.5+R2*Math.sin(a)*.9,R2*Math.cos(a)]);}
    plnTube(m,{path:pts,rad:R*.045,sides:6,col:steel(SOOT,.3),mat:MAN});
  }
  rod([L*.1,R*.5,0],[-L*.12,R*.4,0],R*.08,steel(SOOT,.3));
  box([L*.22,R*1.1,R*1.0],[L*.1,R*.05,R*1.0],steel(C.steel,.4),{lean:-.1,box:.4,yaw:-.3});

  /* люк: тёмная рама в борту, над ней оранжевая планка; внутренняя крышка — часть на петле */
  {const hx=dx("hatch"),dw=1.0*sH,dh=1.75*sH,hq=tail.at(tail.u(hx));
    const g0=Math.max(0,gy(hx,-hq.ry)),hy=Math.max(g0+dh*.5+.12,Math.min(hq.y,dh*.5+.45)),hz=flank(tail,hx,hy);
    box([hx,hy,hz+.04],[dw*.5+.14,dh*.5+.14,.16],steel(C.soot,.15),{box:.25});
    box([hx,hy+dh*.5+.26,hz-.02],[dw*.5+.22,.06,.12],C.orange,{box:.3});
    const fx=hx-.25,fz=hz-dh*.55-.35;
    box([fx,gy(fx,fz)+.05,fz],[dw*.55,.045,dh*.5],steel(C.steel,.5),{yaw:.35,lean:.06,pitch:.05,box:.35});
    const hp=part("hatch",[hx+dw*.5,hy,hz-.15]);
    plnBlob(hp,{c:[-dw*.5,0,0],r:[dw*.5,dh*.5,.05],sub:2,box:.25,col:steel(C.steelLt,.35),mat:MAN});
    const rg=[];for(let k=0;k<=12;k++){const a=k/12*TAU;rg.push([-dw*.5+Math.cos(a)*.16*sH,Math.sin(a)*.16*sH,-.08]);}
    plnTube(hp,{path:rg,rad:.025,sides:5,col:C.steelDk,mat:MAN});
    const ip=part("inside",[hx,hy,hz-.13],{glow:true});
    plnCard(ip,[-dw*.5,-dh*.5,0],[-dw*.5,dh*.5,0],[dw*.5,dh*.5,0],[dw*.5,-dh*.5,0],[0,0,-1],C.warm,GLOW,null,2,1);
    out.hands.hatch=[hx-dw*.5,hy,hz-.25];out.lampAt.inside=[hx,hy,hz-.7];}

  /* грузовой отсек: короб на борту носа — толстая рама, тёмный проём, три ящика по 0,9 м;
     дверь на петлях снизу. Ящики знают, где лягут: земля померена под каждым (to) */
  {const cx=dx("cargo"),cw=3.0,ch=1.45,dep=1.15,fr=.2,cs=.45;
    const cb=gy(cx,-R)+.12,cz=flank(nose,cx,cb+ch*.5)+.25,fz=cz-dep,DK=[.05,.05,.055],FR=steel(C.steel,.4);
    box([cx,cb+ch*.5,cz],[cw*.5,ch*.5,.08],DK,{box:.2});
    box([cx,cb-.03,cz-dep*.5],[cw*.5,.04,dep*.5],DK,{box:.2});
    box([cx,cb+ch+.03,cz-dep*.5],[cw*.5,.04,dep*.5],DK,{box:.2});
    for(const sx of [-1,1])box([cx+sx*(cw*.5+.03),cb+ch*.5,cz-dep*.5],[.04,ch*.5,dep*.5],DK,{box:.2});
    /* короб снаружи: стенки толщиной в раму, перед — рама с оранжевыми косяками */
    box([cx,cb+ch+.07+fr*.5,cz-dep*.5],[cw*.5+fr+.07,fr*.5,dep*.5],FR,{box:.25});
    box([cx,cb-.07-fr*.5,cz-dep*.5],[cw*.5+fr+.07,fr*.5,dep*.5],steel(C.steelDk,.4),{box:.25});
    for(const sx of [-1,1]){box([cx+sx*(cw*.5+.07+fr*.5),cb+ch*.5,cz-dep*.5],[fr*.5,ch*.5+.07,dep*.5],FR,{box:.25});
      box([cx+sx*(cw*.5+.07+fr*.5),cb+ch*.5,fz-.03],[fr*.5+.03,ch*.5+.1,.06],C.orange,{box:.3});}
    box([cx,cb+ch+.07+fr*.5,fz-.03],[cw*.5+fr+.1,fr*.5+.03,.06],steel(C.steelLt,.3),{box:.3});
    const dp=part("door",[cx,cb-.04,fz-.07],{yaw0:Math.PI/2});
    /* полотно светлее рамы, рёбра и защёлка — закрытая дверь читается дверью, а не столом */
    plnBlob(dp,{c:[0,ch*.5,0],r:[.06,ch*.5,cw*.5],sub:2,box:.25,col:steel(C.steelLt,.4),mat:MAN});
    for(let i=0;i<3;i++)plnBlob(dp,{c:[.07,ch*(.25+.25*i),0],r:[.03,.035,cw*.45],sub:1,box:.3,col:C.steelDk,mat:MAN});
    plnBlob(dp,{c:[.1,ch*.62,0],r:[.05,.2,.09],sub:1,box:.3,col:C.orange,mat:MAN});
    /* ящики: бледно-серо-зелёные с оранжевой полосой; падают к линии хода, третий — набок */
    const CR=[.6,.66,.58],zl=Math.max(fz-1.6,.9-oz);
    for(let i=1;i<=3;i++){const px=cx+(i-2)*.98,py=cb+cs,pz=cz-dep*.5;
      const xf=cx+(i-2)*1.35+(i===3?.25:0),zf=zl-(i===2?.55:0),tip=i===3;
      const yf=Math.max(gy(xf,zf),cb+.03)+(tip?.6:cs)-.04;
      const pm=part("crate"+i,[px,py,pz],{to:{x:xf-px,y:yf-py,z:zf-pz,yaw:(i-2)*.35,roll:tip?.62:0}});
      plnBlob(pm,{c:[0,0,0],r:[cs,cs,cs],sub:2,box:.18,col:steel(CR,.25),mat:MAN});
      plnBlob(pm,{c:[0,0,0],r:[cs+.012,.07,cs+.012],sub:1,box:.2,col:C.orange,mat:MAN});
      plnBlob(pm,{c:[0,cs-.02,0],r:[cs*.7,.03,cs*.7],sub:1,box:.3,col:steel(plnMix3(CR,C.steelDk,.3),.2),mat:MAN});}
    const vp=part("vapour",[cx,cb+ch*.5,fz-.2],{glow:true});
    /* пар — столб клубов, что лезут из проёма вверх и в стороны: прямоугольником проёма он читался экраном */
    for(let i=0;i<6;i++){const u=i/5,sx=(i%2?1:-1)*(.12+.3*u);
      plnBlob(vp,{c:[sx*cw,-ch*.25+ch*1.1*u,-.25-.2*i],r:[cw*(.16+.1*u),ch*(.22+.18*u),.3+.15*u],sub:1,bump:.6,seed:sd+3+i,col:[1,.88-.1*u,.7-.12*u],mat:GLOW,glow:3-u,x:1});}
    out.hands.cargo=[cx+cw*.5,cb+ch*.5,fz-.12];out.lampAt.vapour=[cx,cb+ch*.6,fz-1];}

  /* двигательный отсек — корма с соплами и рулями: часть, ось у подошвы посреди отсека */
  {const bq=tail.at(.3),pv=[bq.x,0,0],bm=part("bay",pv);
    hull(bm,tail,0,.6,null,pv);
    seams(bm,tail,tail.xa+.6,tail.at(.6).x-.3,pv);
    for(let i=0;i<3;i++){const a=i/3*TAU+.5,z=Math.cos(a)*R*.5,y=R*.4+Math.sin(a)*R*.5;
      plnTube(bm,{path:[[-L*.48-pv[0],y,z],[-L*.56-pv[0],y,z]],rad:R*.22,sides:10,col:steel(SOOT,.2),mat:MAN,cap:true});
      plnTube(bm,{path:[[-L*.555-pv[0],y,z],[-L*.565-pv[0],y,z]],rad:R*.16,sides:10,col:[.03,.03,.03],mat:MAN,cap:true});}
    for(const sz of [-1,1])plnBlob(bm,{c:[-L*.4-pv[0],R*.7,sz*R*1.1],r:[L*.07,R*.05,R*.7],sub:2,box:.4,col:steel(C.steel,.4),mat:MAN,lean:-sz*.7,pitch:sz*.3});
    const px=dx("part"),pq=tail.at(tail.u(px));out.hands.part=[px,pq.y,flank(tail,px,pq.y)-.1];}

  /* самописец: оранжевый ящик у линии под носом, кабель тянется в рубку; огонёк мигает, пока не снят */
  {const [bx,bz]=hand(dx("log"),1.7),by=gy(bx,bz),nq=nose.at(nose.u(L*.4));
    box([bx,by+.2,bz],[.34,.2,.24],steel(C.orange,.25),{box:.25,yaw:.4});
    box([bx,by+.42,bz],[.3,.03,.2],C.steelDk,{box:.3,yaw:.4});
    plnTube(m,{path:[[bx+.1,by+.3,bz+.1],[lerp(bx,L*.4,.5),by+.12,lerp(bz,-nq.ry*.4,.5)],[L*.4,nq.y-nq.ry*.6,-nq.ry*.4]],rad:.035,sides:6,col:C.soot,mat:MAN});
    const bl=part("boxLamp",[bx,by+.46,bz-.1],{glow:true});
    plnBlob(bl,{c:[0,0,0],r:[.05,.03,.05],sub:1,col:[1,.62,.2],mat:GLOW,glow:3,x:1});
    out.hands.log=[bx,by+.4,bz];}
  for(let i=0;i<5;i++){const lx=L*(.34+r()*.14),lz=-R*(.9+r()*.6);
    box([lx,gy(lx,lz)+.02,lz],[.12+r()*.15,.012,.08+r()*.1],[.42,.5,.56],{yaw:r()*TAU,lean:(r()-.5)*.3,box:.5});}
  /* мачта маяка: шест на растяжках, щиток с рычагом у ног; красный огонь — запись света */
  {const [mx,mz]=hand(dx("beacon"),2.3),my=gy(mx,mz),hm=2.6;
    rod([mx,my-.1,mz],[mx,my+hm,mz],.05,steel(C.steelLt,.3),{sides:8});
    for(let i=0;i<3;i++){const a=i/3*TAU+.4,ex=mx+Math.cos(a)*.9,ez=mz+Math.sin(a)*.9;
      rod([mx,my+hm*.55,mz],[ex,gy(ex,ez),ez],.018,C.steelDk,{sides:5});}
    box([mx+.28,my+.24,mz-.16],[.17,.22,.12],steel(C.orange,.3),{box:.3});
    rod([mx+.28,my+.3,mz-.3],[mx+.36,my+.44,mz-.36],.02,C.steelDk,{sides:5});
    box([mx,my+hm+.04,mz],[.1,.05,.1],C.steelDk,{box:.4});
    lamp([mx,my+hm+.17,mz],[.11,.13,.11],C.red,3,2);
    out.lampAt.beacon=[mx,my+hm+.17,mz];out.hands.beacon=[mx+.28,my+.4,mz-.2];}
  /* листы обшивки: три — у ног, остальные — за корпусом; осыпь — только за ним */
  for(let i=0;i<7;i++){const front=i<3,lx=(r()-.5)*L*1.1,lz=front?Math.max(.6-oz,-R*1.1-r()*1.6):R*(.9+r()*1.4);
    box([lx,gy(lx,lz)+H*.01,lz],[H*.04+r()*H*.05,H*.005,H*.03+r()*H*.04],steel(r()<.3?C.orange:C.steel,.6),{yaw:r()*TAU,lean:(r()-.5)*.4,box:.4});}
  for(let i=0;i<7;i++){const lx=(r()-.5)*L*1.05,lz=R*(.5+r()*.8),s2=R*(.14+r()*.12);
    plnBlob(m,{c:[lx,gy(lx,lz)-s2*.25,lz],r:[s2*1.6,s2*.6,s2*1.2],sub:1,bump:.35,seed:sd+i,yaw:r()*TAU,lean:(r()-.5)*.3,
      col:plnMix3(P.rockWarm,P.rockCool,r()),mat:ROCK});}
  out.light=T.lm;out.pulse=(t,nk)=>(Math.sin(t*1.4+sd)>.55?1:.08);
  out.blots.push([0,R*.2,L*.33,.55]);
}
