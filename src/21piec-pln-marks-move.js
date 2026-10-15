/* ══════════════ планета: подвижная пятёрка — тела и места под рукой (M627b, проход 4) ══════════════
   Друза, кольцо ускорителя, аномалия, завод, батарея. У каждого у линии хода стоит то, чего касается
   рука: ключи-призмы подножия друзы, вентиль и рычаги кольца, колышек замерщика у аномалии, щит и
   рампа завода, затвор и маховик пушки. Подвижное и светящееся — части (21pie, part); их ведёт привод
   вида из 21pifb, места — оттуда же. Батарея пересобрана: это пушка Долгого марша — башня на плите,
   длинный ствол задран в небо и раскрыт лепестками у среза, затвор сзади, стеллажи снарядов.
   T — набор рук plnMarkMesh (21pie). Возвращает true, если вид свой. */
function plnMarkMove(kind,T){
  const {C,r,MAN,ROCK,GLOW,m,lm,mv,out,part,hand,steel,stone,box,rod,post,skirt,lamp,seam,pane,night,pulse,old,H,sd,gy,P}=T;
  const dx=id=>plnActSpotDx(kind,id,H);
  /* место у линии: местные x,z и земля под ним */
  const at=(d,zw)=>{const [x,z]=hand(d,zw);return [x,gy(x,z),z];};
  /* труба по земле от a до b (местные x,z), на высоте h над грунтом */
  const ground=(a,b,h,rad,col,n)=>{const pts=[];n=n||10;
    for(let i=0;i<=n;i++){const x=lerp(a[0],b[0],i/n),z=lerp(a[1],b[1],i/n);pts.push([x,gy(x,z)+h,z]);}
    plnTube(m,{path:pts,rad,sides:6,col,mat:MAN});return pts;};

  if(kind==="crystals"){
    /* лес призм за линией; большая призма посередине — две половины (расходятся в резонанс). Подножие
       тянется к линии мелкими призмами; у линии — три ключа (части, вспыхивают от удара) и пять призм
       края (части, ломаются под буром) */
    const W=H*1.9,base=plnMix3(P.heather,P.clover,.4);
    const pcol=(y0,hh)=>(u,p,n)=>plnMix3(plnMix3(P.crag,base,plnSmooth(-.2,.6,(p[1]-y0)/hh)),P.snow,.35*Math.max(0,n[1])*plnSmooth(.3,1,(p[1]-y0)/hh));
    const prism=(mesh,c,hh,w,seed,o)=>plnBlob(mesh,Object.assign({c:[c[0],c[1]+hh*.6,c[2]],r:[w,hh*.75,w*.8],sub:2,box:.42,seed,col:pcol(c[1],hh*1.35),mat:ROCK,glow:.3},o||{}));
    const hb=H*.95,wb=hb*.15,yb=gy(0,0);
    for(const sx of [-1,1]){
      const pm=part(sx<0?"topL":"topR",[sx*wb*.3,yb,0]);
      prism(pm,[sx*wb*.25,-hb*.15,0],hb,wb*.55,sd+(sx>0?1:2),{lean:sx*.04});
    }
    /* шов света между половинами и по сердцевинам высоких призм — свет друзы */
    seam([[0,yb+hb*.1,-wb*.42],[0,yb+hb*1.0,-wb*.3]],wb*.035,plnMix3(base,[1,1,1],.3),2.4);
    for(let i=0;i<14;i++){
      const a=r()*TAU,d=W*(.18+.32*Math.sqrt(r())),lx=Math.cos(a)*d,lz=Math.sin(a)*d*.7,hh=H*(i<3?.55+r()*.3:.2+r()*.4),w=hh*(.14+r()*.1),y0=gy(lx,lz);
      prism(m,[lx,y0,lz],hh,w,sd+i+3,{yaw:r()*TAU,lean:(r()-.5)*.5,pitch:(r()-.5)*.4});
      if(i<3)seam([[lx,y0+hh*.15,lz-w*.85],[lx,y0+hh*1.1,lz-w*.7]],w*.07,plnMix3(base,[1,1,1],.5),2.2);
    }
    /* подножие: мелкие призмы от друзы к линии */
    for(let i=0;i<14;i++){const d=lerp(-7,8,r()),zw=lerp(4.5,12,r()),[x,y,z]=at(d,zw),hh=lerp(.3,.9,r());
      prism(m,[x,y-.05,z],hh,hh*.2,sd+40+i,{yaw:r()*TAU,lean:(r()-.5)*.9,pitch:(r()-.5)*.5});}
    /* ключи: три призмы у линии по мерилу человека — до груди; шов спереди светится от удара */
    for(let i=0;i<3;i++){const [x,y,z]=at(dx("k"+i),2.7),hh=1.15+.18*i,w=.24;
      prism(part("k"+i,[x,y-.05,z]),[0,0,0],hh,w,sd+60+i,{yaw:(i-1)*.25});
      plnTube(part("k"+i+"L",[x,y-.05,z],{glow:true}),{path:[[0,hh*.1,-w*.86],[0,hh*1.22,-w*.6]],rad:.035,sides:5,col:plnMix3(base,[1,1,1],.6),mat:GLOW,glow:2.8,x:1,cap:true});
      plnBlob(m,{c:[x,y-.02,z],r:[.45,.08,.38],sub:1,bump:.3,seed:sd+70+i,col:plnMix3(P.rockWarm,P.rockCool,.5),mat:ROCK});}
    /* край друзы: пять призм, бур ломает их по одной */
    const edge=[[-5.6,3.9],[-1.6,3.5],[1.6,3.7],[4.6,3.9],[7,3.3]];
    for(let i=0;i<5;i++){const [x,y,z]=at(edge[i][0],edge[i][1]),hh=lerp(.9,1.7,r());
      prism(part("p"+(i+1),[x,y-.05,z]),[0,0,0],hh,hh*.19,sd+80+i,{yaw:r()*TAU,lean:(r()-.5)*.35});}
    {const [x,y,z]=at(0,2.7);out.lampAt.foot=[x,y+1.6,z-1];}
    skirt(W*.45,8,.6);out.blots.push([0,0,W*.4,.5]);
    out.light=lm;out.pulse=(t,nk)=>.15+.25*nk;
    return true;
  }
  if(kind==="ring"){
    /* кольцо на ребре, нижняя четверть в земле; полоса света по внутреннему краю; узлы — камень, на
       каждом своё окно огня (части, бегут по кругу на ходу). Три верхних узла — части: падают при
       разрыве. Труба подачи идёт от кольца по земле к вентилю у линии; у вентиля тормоз и рычаг */
    const R=H*.5,rad=R*.085,yc=R*.72,pts=[];
    for(let k=0;k<=48;k++){const a=k/48*TAU;pts.push([R*Math.cos(a),yc+R*Math.sin(a),0]);}
    plnTube(m,{path:pts,rad,sides:12,col:stone,mat:ROCK});
    for(let k=0;k<8;k++){const a=k/8*TAU+Math.PI/8,x=R*Math.cos(a),y=yc+R*Math.sin(a);if(y<rad)continue;
      const f=k>=1&&k<=3?k-1:-1,nb=f>=0?part("f"+f,[x,y,0],{to:{x:(f-1)*R*.35-x,y:gy((f-1)*R*.35,-R*.3)+rad*.9-y,z:-R*.3,yaw:.6*f}}):m;
      plnBlob(nb,{c:f>=0?[0,0,0]:[x,y,0],r:[rad*1.45,rad*1.45,rad*1.45],sub:1,box:.5,yaw:a,col:stone,mat:ROCK});
      plnBlob(part("n"+k,[x,y,-rad*1.3],{glow:true}),{c:[0,0,0],r:[rad*.55,rad*.55,rad*.3],sub:1,col:old,mat:GLOW,glow:2.8,x:1});}
    const band=[];
    for(let k=0;k<=48;k++){const a=k/48*TAU,Ri=R-rad*.9;band.push([Ri*Math.cos(a),yc+Ri*Math.sin(a),-rad*.35]);}
    seam(band,rad*.22,old,2.4);
    for(const sx of [-1,1])box([sx*R*.86,gy(sx*R*.86,0)+R*.06,0],[R*.12,R*.1,R*.14],stone,{box:.25,mat:ROCK});
    plnTube(m,{path:[[-R*1.9,gy(-R*1.9,R*.3)+rad*.9,R*.3],[R*.1,gy(R*.1,R*.3)+rad*.9,R*.3]],rad:rad*.75,sides:10,col:stone,mat:ROCK,cap:true});
    /* вентиль у линии: тумба, стояк, маховик (часть) лицом к объективу */
    const [vx,vy,vz]=at(dx("valve"),2.6);
    ground([-R*1.9,R*.3],[vx,vz+.4],.25,rad*.35,stone,14);
    box([vx,vy+.3,vz],[.42,.32,.36],stone,{box:.25,mat:ROCK});
    rod([vx,vy+.5,vz],[vx,vy+1.1,vz],.07,C.oldLt,{sides:8,mat:ROCK});
    {const wh=part("wheel",[vx,vy+1.12,vz-.12]),rg=[];
      for(let k=0;k<=24;k++){const a=k/24*TAU;rg.push([Math.cos(a)*.34,Math.sin(a)*.34,0]);}
      plnTube(wh,{path:rg,rad:.035,sides:6,col:C.oldLt,mat:ROCK});
      for(let i=0;i<4;i++){const a=i/4*TAU+.4;plnTube(wh,{path:[[0,0,0],[Math.cos(a)*.34,Math.sin(a)*.34,0]],rad:.022,sides:4,col:stone,mat:ROCK});}
      plnBlob(lm,{c:[vx,vy+1.12,vz-.18],r:[.06,.06,.03],sub:1,col:old,mat:GLOW,glow:2.4,x:1});out.lampAt.valve=[vx,vy+1.7,vz-.9];}
    /* тормоз (слева) — колодка с упором; рычаг разгона (справа) — часть */
    {const [bx,by,bz]=at(dx("stop"),2.4);
      box([bx,by+.45,bz],[.22,.45,.22],stone,{box:.3,mat:ROCK});
      box([bx,by+.95,bz-.05],[.3,.06,.12],plnMix3(old,C.oldLt,.3),{box:.3,mat:ROCK});}
    {const [lx,ly,lz]=at(dx("limit"),2.4);
      box([lx,ly+.4,lz],[.26,.4,.26],stone,{box:.3,mat:ROCK});
      const lv=part("lever",[lx,ly+.8,lz-.05]);
      plnTube(lv,{path:[[0,0,0],[0,.62,0]],rad:.04,sides:6,col:C.oldLt,mat:ROCK,cap:true});
      plnBlob(lv,{c:[0,.66,0],r:[.08,.08,.08],sub:1,col:old,mat:GLOW,glow:2,x:1});}
    /* слиток: из кольца по касательной к залежи у линии, справа */
    {const [tx,ty,tz]=at(12,3),p0=[R*.2,yc+R*.9,0];
      plnBlob(part("slug",p0,{glow:true,to:{x:tx-p0[0],y:ty+.3-p0[1],z:tz-p0[2],roll:1.2}}),{c:[0,0,0],r:[.42,.16,.2],sub:1,box:.3,col:plnHex(RES.iridium.col),mat:GLOW,glow:2.6,x:1});}
    skirt(R*1.1,6,.5);out.light=lm;out.pulse=(t,nk)=>.6+.4*Math.pow(.5+.5*Math.sin(t*2.1+sd),3);
    out.lamp={p:[0,yc,-rad],r:R*1.3,c:old,k:1.4,always:true};
    out.lampAt.core=[0,yc,-rad*3];
    out.blots.push([0,0,R*.9,.5]);
    return true;
  }
  if(kind==="anomaly"){
    /* чёрный шар (часть: сжимается в ничто при осушении) на высоте, кольцо света, кружащие осколки
       камня мира. У линии — колышек замерщика с биркой; бросок летит от колышка в шар, обмен падает к
       колышку (части, цвет — груз) */
    const yc=H*.62,Rv=H*.21,Ro=H*.42;
    plnBlob(part("core",[0,yc,0]),{c:[0,0,0],r:[Rv,Rv,Rv],sub:3,col:[0,0,0],mat:GLOW,glow:0,x:1});
    const halo=[];
    for(let k=0;k<=40;k++){const a=k/40*TAU;halo.push([Ro*.78*Math.cos(a),yc+Ro*.2*Math.sin(a)*.5,Ro*.78*Math.sin(a)]);}
    seam(halo,H*.016,old,2.4);
    for(let i=0;i<10;i++){const a=i/10*TAU+r()*.4,d=Ro*(.8+r()*.4),s=H*(.04+r()*.06);
      plnBlob(mv,{c:[Math.cos(a)*d,yc+(r()-.5)*H*.5,Math.sin(a)*d],r:[s*1.3,s,s*.8],sub:1,box:.5,seed:sd+i,yaw:r()*TAU,lean:r()*2,pitch:r()*2,
        col:plnMix3(P.rockCool,P.crag,r()),mat:ROCK});}
    for(let i=0;i<8;i++){const a=i/8*TAU+r()*.5,d=Ro*(.5+r()*.6),s=H*(.02+r()*.03),lx=Math.cos(a)*d,lz=Math.sin(a)*d*.8;
      plnBlob(m,{c:[lx,gy(lx,lz)+s*.4,lz],r:[s*1.4,s*.5,s],sub:1,bump:.3,seed:sd+30+i,yaw:r()*TAU,col:plnMix3(P.rockCool,P.crag,.5),mat:ROCK});}
    out.move=mv;out.moveAt=t=>({y:0,yaw:t*.11+sd});
    out.light=lm;out.pulse=pulse;out.blots.push([0,0,Ro*.9,.4]);
    out.lamp={p:[0,yc,0],r:Ro*2.2,c:old,k:1.6,always:true};
    out.lampAt.core=[0,yc,-Rv*1.6];
    /* колышек: наклонный столбик в рост по пояс, оранжевая бирка, у подножия — ящик прибора */
    const [sx,sy,sz]=at(0,2.2);
    rod([sx,sy-.2,sz],[sx+.18,sy+1.35,sz-.05],.045,steel(C.steel,.3),{sides:6});
    plnCard(m,[sx+.07,sy+1.0,sz-.1],[sx+.07,sy+1.2,sz-.1],[sx+.32,sy+1.2,sz-.12],[sx+.32,sy+1.0,sz-.12],[0,0,-1],C.orange,MAN,null,0,0);
    box([sx-.45,sy+.14,sz+.1],[.24,.14,.18],steel(C.steelDk,.3),{box:.3});
    plnBlob(lm,{c:[sx-.45,sy+.3,sz-.1],r:[.05,.03,.02],sub:1,col:[.5,1,.7],mat:GLOW,glow:2,x:1});
    const unit=pm=>plnBlob(pm,{c:[0,0,0],r:[.17,.17,.17],sub:1,box:.35,col:[.85,.85,.85],mat:MAN});
    const b0=[sx+.2,sy+1.45,sz-.05];
    unit(part("bit",b0,{to:{x:-b0[0],y:yc-b0[1],z:-b0[2],yaw:2}}));
    const [ox,oy,oz]=at(.8,1.9);
    unit(part("out",[0,yc,0],{to:{x:ox,y:oy+.17-yc,z:oz,yaw:1.3}}));
    return true;
  }
  if(kind==="factory"){
    /* длинный цех с зубчатой крышей, две трубы с поясом, бак и трубопроводы. Окна загораются, когда
       линию запитали (свет вида); при переналадке зал красный (часть). Ворота (часть) поднимаются; от
       ворот к линии — рампа на роликах, по ней скатывается ящик (часть). У линии — щит с рычагом и
       лампой (части); из трубы на ходу — дым (три клуба, части) */
    const W=H*2.3,hh=H*.3;
    box([0,hh*.5,0],[W*.5,hh*.5,W*.26],steel(C.concrete,.35),{box:.2});
    for(let i=0;i<4;i++){const x=(i-1.5)/1.5*W*.33;
      plnBlob(m,{c:[x,hh+H*.07,0],r:[W*.11,H*.09,W*.25],sub:2,box:.25,lean:.5,col:steel(C.steel,.3),mat:MAN});}
    for(const x of [W*.3,W*.42]){
      plnTube(m,{path:[[x,0,W*.12],[x,H,W*.12]],rad:H*.045,sides:12,col:(t,a,p)=>steel(t>.62&&t<.7?C.orange:(t>.93?C.soot:C.steel),.4)([0,0,0],p,[0,0,0]),mat:MAN,cap:true});
      plnTube(m,{path:[[x,H*.4,W*.12],[x,H*.44,W*.12]],rad:H*.055,sides:12,col:steel(C.steelDk,.3),mat:MAN,cap:true});}
    {const bl=part("belt",[W*.3,H*.66,W*.12],{glow:true}),rg=[];
      for(let k=0;k<=20;k++){const a=k/20*TAU;rg.push([Math.cos(a)*H*.047,0,Math.sin(a)*H*.047]);}
      plnTube(bl,{path:rg,rad:H*.012,sides:5,col:C.orange,mat:GLOW,glow:2.2,x:1});}
    plnTube(m,{path:[[-W*.58,H*.14,-W*.05],[-W*.36,H*.14,-W*.05]],rad:H*.12,sides:14,col:steel(C.steel,.45),mat:MAN,cap:true});
    for(let i=0;i<3;i++)rod([-W*.4,H*.2+i*H*.03,-W*.05+i*W*.03],[-W*.5+i*W*.04,hh*.9,-W*.26+i*W*.02],H*.014,steel(C.steelDk,.4));
    rod([W*.3,H*.5,W*.12],[W*.42,H*.5,W*.12],H*.02,steel(C.steelDk,.3));
    const red=part("red",[0,0,-W*.26-.09],{glow:true});
    for(let j=0;j<2;j++)for(let i=0;i<9;i++){const c=[(i-4)/4*W*.42,hh*(.38+.3*j),-W*.26-.05];
      if(Math.abs(c[0]-W*.1)<W*.07&&j===0)continue;
      for(const o of [-1,1])pane([c[0]+o*W*.0085,c[1],c[2]],W*.0072,hh*.055,C.warm,1.6);
      plnCard(red,[c[0]-W*.016,c[1]-hh*.055,0],[c[0]-W*.016,c[1]+hh*.055,0],[c[0]+W*.016,c[1]+hh*.055,0],[c[0]+W*.016,c[1]-hh*.055,0],[0,0,-1],[1,.16,.08],GLOW,null,2.2,1);}
    pane([-W*.42,hh*.2,-W*.26-.05],W*.018,hh*.2,C.warm,1.1);
    /* ворота: тёмный проём и створка (часть) */
    const gx=W*.1,gw=Math.max(1.6,W*.045),gh=Math.min(hh*.42,3.2);
    box([gx,gh,-W*.26+.05],[gw,gh,.12],plnMix3(C.soot,[0,0,0],.5),{box:.2});
    box([gx,gh*.5,-W*.26-.25],[gw*.98,gh*.5,.07],steel(C.steel,.4),{box:.15});
    pane([gx,gh*.9,-W*.26-.3],gw*.6,gh*.04,C.warm,1.4);
    out.light=lm;out.pulse=night;
    out.lamp={p:[-W*.42,hh*.62,-W*.26-1.5],r:H*.9,c:[1,.62,.3],k:3};
    out.lampAt.gate=[gx,gh,-W*.26-2.5];
    /* рампа: от ворот к линии на стойках, два рельса и ролики; ящик скатывается по ней */
    const [ex,ey,ez]=at(dx("crate"),3.4),a0=[gx,-W*.26-.6],n=16,rails=[[],[]];
    const yaw=Math.atan2(ex-a0[0],ez-a0[1]),cx=Math.cos(yaw),sx=Math.sin(yaw);
    for(let i=0;i<=n;i++){const u=i/n,x=lerp(a0[0],ex,u),z=lerp(a0[1],ez,u),y=Math.max(gy(x,z),lerp(gy(a0[0],a0[1]),ey,u))+.75;
      for(const s of [0,1]){const o=(s?.6:-.6);rails[s].push([x+o*cx,y,z-o*sx]);}
      if(i%2===0){rod([x-.6*cx,y,z+.6*sx],[x+.6*cx,y,z-.6*sx],.06,steel(C.steelDk,.4),{sides:6});
        if(i%4===0)for(const o of [-.55,.55])rod([x+o*cx,gy(x+o*cx,z-o*sx)-.1,z-o*sx],[x+o*cx,y,z-o*sx],.05,steel(C.steelDk,.5),{sides:5});}}
    for(const R of rails)plnTube(m,{path:R,rad:.05,sides:5,col:steel(C.steel,.4),mat:MAN});
    {const p0=[a0[0],Math.max(gy(a0[0],a0[1]),gy(a0[0],a0[1]))+1.15,a0[1]-.2],cr=part("crate",p0,{to:{x:ex-p0[0],y:ey+1.15-p0[1],z:ez-p0[2]}});
      plnBlob(cr,{c:[0,0,0],r:[.42,.36,.42],sub:1,box:.25,yaw,col:steel(plnMix3(C.orange,C.rust,.3),.25),mat:MAN});
      for(const o of [-.2,.2])plnBlob(cr,{c:[0,o,0],r:[.44,.03,.44],sub:1,box:.3,yaw,col:C.steelDk,mat:MAN});}
    /* щит у линии: шкаф, рычаг (часть), лампа на крыше (часть); кабель в цех */
    const [bx,by,bz]=at(dx("power"),2.4);
    box([bx,by+.9,bz],[.42,.9,.28],steel(C.steel,.4),{box:.2});
    box([bx,by+1.12,bz-.3],[.3,.32,.02],steel(C.steelDk,.3),{box:.3});
    box([bx,by+1.62,bz-.29],[.43,.05,.02],C.orange,{box:.3});
    {const lv=part("lever",[bx+.46,by+1.05,bz-.05]);
      plnTube(lv,{path:[[0,0,0],[0,.5,0]],rad:.035,sides:6,col:steel(C.steelLt,.3),mat:MAN,cap:true});
      plnBlob(lv,{c:[0,.52,0],r:[.07,.07,.07],sub:1,col:[.9,.15,.08],mat:MAN});}
    plnBlob(part("blamp",[bx,by+1.88,bz-.05],{glow:true}),{c:[0,0,0],r:[.09,.09,.09],sub:1,col:[.5,1,.6],mat:GLOW,glow:3,x:1});
    ground([bx,bz+.25],[-W*.3,-W*.26+.1],.04,.045,C.soot,12);
    out.lampAt.board=[bx,by+2.1,bz-.9];
    /* дым: клубы с макушки дальней трубы, сносит ветром */
    for(let i=0;i<3;i++)plnBlob(part("s"+i,[W*.42,H*1.03,W*.12],{glow:true,to:{x:H*.18,y:H*.55,z:H*.05}}),{c:[0,0,0],r:[H*.05,H*.04,H*.05],sub:2,bump:.22,seed:sd+90+i,col:plnMix3(plnMix3(C.soot,C.concrete,.7),C.warm,.15),mat:GLOW,glow:.35,x:1});
    skirt(W*.42,8,.7);out.blots.push([0,0,W*.45,.6]);
    return true;
  }
  if(kind==="battery"){
    /* пушка Долгого марша: плита, мешки по кругу (с проходом к затвору), башня (часть) с щитом и
       оранжевым поясом, ствол (часть) задран на 60° и раскрыт лепестками у среза, белая метка у
       среза; затвор (часть) сзади ствола; два стеллажа снарядов, один пуст; маховик наводки на столбе
       у линии (часть); копоть под стволом */
    const G0=PLN_GUN,u=H/7,ty=G0.ty*u,len=G0.len*u;
    const rust=steel(C.steel,.55),dark=steel(C.steelDk,.45);
    box([0,gy(0,0)+.1*u,0],[3.6*u,.22*u,2.8*u],steel(C.concrete,.3),{box:.2});
    for(let i=0;i<11;i++){const a=i/11*TAU+.2,d=3.3*u;if(Math.abs(((a-Math.PI*1.5)%TAU+TAU)%TAU-Math.PI)>Math.PI-.55)continue;
      const lx=Math.cos(a)*d,lz=Math.sin(a)*d*.85;
      plnBlob(m,{c:[lx,gy(lx,lz)+.22*u,lz],r:[.62*u,.24*u,.34*u],sub:2,box:.6,bump:.15,seed:sd+i,yaw:-a,col:plnMix3(P.rockWarm,[.55,.5,.4],.5),mat:ROCK});}
    /* башня: барабан, станины цапф, щит с поясом */
    const tu=part("turret",[0,.32*u,0],{yaw0:-Math.PI/2});
    plnTube(tu,{path:[[0,0,0],[0,.75*u,0]],rad:1.65*u,sides:20,col:rust,mat:MAN,cap:true});
    plnTube(tu,{path:[[0,.75*u,0],[0,.9*u,0]],rad:1.3*u,sides:20,col:dark,mat:MAN,cap:true});
    for(const s of [-1,1])plnBlob(tu,{c:[0,(ty-.32*u+.9*u)/2,s*.62*u],r:[.7*u,(ty-.32*u-.9*u)/2+.25*u,.12*u],sub:1,box:.25,col:rust,mat:MAN});
    {const sc=(a,b,c)=>{const p=Array.isArray(b)?b:c;return Math.abs(p[1]-(ty-.32*u-.75*u))<.13*u?C.orange:rust(a,b,c);};
      /* щит низкий, под цапфой: опущенный на наводку ствол проходит над ним */
      plnBlob(tu,{c:[1.35*u,ty-.32*u-1.15*u,0],r:[.1*u,.7*u,1.3*u],sub:2,box:.2,col:sc,mat:MAN});}
    /* ствол вдоль своей +x, цапфа в нуле: кожух у казны толще, лепестки у среза, белая метка */
    const br=part("barrel",[0,ty,0],{yaw0:-Math.PI/2});
    plnTube(br,{path:[[-.6*u,0,0],[len*.95,0,0]],rad:t=>lerp(.3*u,.21*u,t),sides:14,col:rust,mat:MAN,cap:true});
    plnTube(br,{path:[[-.6*u,0,0],[2.6*u,0,0]],rad:.4*u,sides:14,col:dark,mat:MAN,cap:true});
    plnTube(br,{path:[[len*.86,0,0],[len*.88,0,0]],rad:.24*u,sides:14,col:[.85,.86,.84],mat:MAN,cap:true});
    for(let i=0;i<5;i++){const a=i/5*TAU+.3,ca=Math.cos(a),sa=Math.sin(a);
      plnTube(br,{path:[[len*.94,ca*.17*u,sa*.17*u],[len*1.0,ca*.25*u,sa*.25*u],[len*1.06,ca*.42*u,sa*.42*u]],rad:t=>lerp(.07*u,.025*u,t),sides:5,col:rust,mat:MAN,cap:true});}
    const bk=part("breech",[0,ty,0],{yaw0:-Math.PI/2});
    plnBlob(bk,{c:[-1.2*u,0,0],r:[.62*u,.42*u,.42*u],sub:1,box:.3,col:dark,mat:MAN});
    plnTube(bk,{path:[[-1.5*u,-.42*u,.2*u],[-1.5*u,-.75*u,.32*u]],rad:.06*u,sides:5,col:C.orange,mat:MAN,cap:true});
    /* стеллажи у правого бока: рама и снаряды; второй пуст */
    for(let k=0;k<2;k++){const cx0=2.5*u,cz0=(k?.9:-.9)*u,yb=gy(cx0,cz0);
      for(const s of [-1,1])rod([cx0+s*.5*u,yb,cz0],[cx0+s*.5*u,yb+1.1*u,cz0],.05*u,dark,{sides:5});
      for(const y of [.35,.75])rod([cx0-.55*u,yb+y*u,cz0],[cx0+.55*u,yb+y*u,cz0],.04*u,dark,{sides:5});
      if(!k)for(let i=0;i<4;i++){const x=cx0+(i-1.5)*.25*u;
        plnTube(m,{path:[[x,yb+.38*u,cz0],[x,yb+1.05*u,cz0]],rad:t=>t>.8?lerp(.1*u,.03*u,(t-.8)/.2):.1*u,sides:8,col:(t,a,p)=>t>.8?C.steelLt:plnMix3(C.orange,C.rust,.5),mat:MAN,cap:true});}}
    /* маховик наводки: столб у линии и колесо лицом к объективу (часть) */
    const [hx,hy,hz]=at(dx("lay"),2.6);
    rod([hx,hy-.1,hz],[hx,hy+1.1,hz],.07,dark,{sides:8});
    box([hx,hy+1.1,hz],[.14,.14,.14],steel(C.orange,.3),{box:.3});
    {const wh=part("hwheel",[hx,hy+1.1,hz-.18]),rg=[];
      for(let k=0;k<=20;k++){const a=k/20*TAU;rg.push([Math.cos(a)*.32,Math.sin(a)*.32,0]);}
      plnTube(wh,{path:rg,rad:.03,sides:5,col:steel(C.steelLt,.3),mat:MAN});
      for(let i=0;i<3;i++){const a=i/3*TAU;plnTube(wh,{path:[[0,0,0],[Math.cos(a)*.32,Math.sin(a)*.32,0]],rad:.018,sides:4,col:C.steelDk,mat:MAN});}}
    /* тяга к башне по земле */
    ground([hx,hz+.2],[1.2*u,-1.2*u],.05,.05,C.soot,8);
    /* снаряд и ракета — от среза наведённого ствола; дым разрыва — с башни */
    const mz=G0.muzzle(u,G0.down,G0.yaw(PLN_MARK.kinds.battery.yaw)-Math.PI/2),p0=[mz[0],ty+mz[1],mz[2]];
    plnBlob(part("shell",p0,{glow:true}),{c:[0,0,0],r:[.22,.22,.22],sub:1,col:[1,.85,.6],mat:GLOW,glow:4,x:1});
    plnBlob(part("flare",p0,{glow:true}),{c:[0,0,0],r:[.5,.5,.5],sub:2,col:[1,.97,.9],mat:GLOW,glow:6,x:1});
    for(let i=0;i<3;i++)plnBlob(part("s"+i,[0,ty,0],{glow:true,to:{x:.6*u,y:H*.9,z:.3*u}}),{c:[0,0,0],r:[.55*u,.45*u,.55*u],sub:2,bump:.22,seed:sd+90+i,col:plnMix3(plnMix3(C.soot,C.concrete,.65),C.warm,.12),mat:GLOW,glow:.3,x:1});
    out.lampAt.breechL=[0,ty,-1.6*u];
    skirt(3.8*u,6,.5);out.blots.push([0,0,3.6*u,.6]);out.blots.push([1.2*u,1.8*u,1.6*u,.8]);
    return true;
  }
  return false;
}
