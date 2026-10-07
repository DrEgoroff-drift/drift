/* ══════════════ планета: тихая пятёрка — тела и места под рукой (M627b, проход 2) ══════════════
   Храм, монолит, врата, обсерватория, зарубка. У каждого у линии хода (z 1.5–3 м) стоит то, чего
   касается рука (DESIGN-marks §2.1): алтарь храма, лицо монолита, порог врат с дорогой из плит,
   пульт и ворот обсерватории, засечка на клинке зарубки. Монолит и зарубка тонкие — сами стоят у
   линии (21pie, kinds.z). Подвижное и светящееся — части (21pie, part): их ведёт привод вида из
   21pifa по памяти памятника. Места — смещения оттуда же, одна правда на двоих.
   T — набор рук plnMarkMesh (21pie). Возвращает true, если вид свой. */
function plnMarkStone(kind,T){
  const {C,r,MAN,ROCK,GLOW,m,lm,out,part,hand,steel,stone,box,rod,post,skirt,lamp,seam,pane,night,pulse,old,H,sd,gy,P}=T;
  const dx=id=>plnActSpotDx(kind,id,H);
  /* светящаяся карточка в части: лицом к объективу (−z) */
  const card=(pm,c,w,h,col,g)=>plnCard(pm,[c[0]-w,c[1]-h,c[2]],[c[0]-w,c[1]+h,c[2]],[c[0]+w,c[1]+h,c[2]],[c[0]+w,c[1]-h,c[2]],[0,0,-1],col,GLOW,null,g||2,1);
  /* октаэдр древних: куб на углу */
  const octa=(mesh,c,s,col,mat)=>plnBlob(mesh,{c,r:[s,s,s],sub:1,box:.55,yaw:Math.PI/4,pitch:Math.PI/4,col,mat});
  /* дорожка плит по земле от a до b (местные x,z): каждая плита садится на свою землю */
  const walk=(a,b,w,col)=>{const ddx=b[0]-a[0],ddz=b[1]-a[1],len=Math.hypot(ddx,ddz),n=Math.max(1,Math.ceil(len/2.3)),yaw=Math.atan2(ddx,ddz);
    for(let i=0;i<n;i++){const u=(i+.5)/n,x=a[0]+ddx*u,z=a[1]+ddz*u;
      box([x,gy(x,z)+.05,z],[w*(.94+r()*.1),.16,len/n*.5-.12],col,{box:.25,mat:ROCK,yaw:yaw+(r()-.5)*.06,lean:(r()-.5)*.03});}};

  if(kind==="temple"){
    /* три ступени, две колоннады, перемычка висит над ними на щели света, над всем — грань с огнём
       внутри (часть: опускается на дар, падает при взятии). У линии — алтарь: каменный стол 0,9 м,
       на нём две плиты с резьбой; резьба светится цветом древних ночью */
    const W=H*1.7;
    for(let i=0;i<3;i++)box([0,H*.035*(2*i+1),0],[W*(.5-.07*i),H*.035,W*(.38-.05*i)],stone,{box:.22,mat:ROCK});
    const top=H*.21,ch=H*.36;
    for(const z of [-W*.22,W*.22])for(let i=0;i<6;i++){const x=(i-2.5)/2.5*W*.36;
      plnTube(m,{path:[[x,top,z],[x,top+ch,z]],rad:H*.04,sides:8,col:stone,mat:ROCK,cap:true});}
    box([0,top+ch+H*.09,0],[W*.42,H*.035,W*.3],stone,{box:.22,mat:ROCK});
    plnBlob(lm,{c:[0,top+ch+H*.02,0],r:[W*.4,H*.012,W*.28],sub:1,box:.25,col:old,mat:GLOW,glow:2.4,x:1});
    octa(part("octa",[0,H*.86,0]),[0,0,0],H*.13,stone,ROCK);
    plnBlob(part("core",[0,H*.86,0],{glow:true}),{c:[0,0,0],r:[H*.075,H*.075,H*.075],sub:2,col:old,mat:GLOW,glow:2.6,x:1});
    skirt(W*.5,7,.6);
    out.light=lm;out.pulse=pulse;out.blots.push([0,0,W*.5,.65]);
    out.lamp={p:[0,top+ch,0],r:W*.7,c:old,k:1.8,always:true};
    const [ax,az]=hand(.15,2.4),ay=gy(ax,az)-.05,AY=.9;
    box([ax,ay+.4,az],[.6,.42,.34],stone,{box:.2,mat:ROCK});
    box([ax,ay+AY-.07,az],[.88,.07,.5],stone,{box:.18,mat:ROCK});
    box([ax,ay+.06,az],[.8,.08,.46],stone,{box:.3,mat:ROCK});
    box([ax-.42,ay+AY+.02,az],[.34,.025,.3],C.old,{box:.3,mat:ROCK});
    const pp=part("plates",[ax+.42,ay+AY,az]);
    plnBlob(pp,{c:[0,.02,0],r:[.34,.025,.3],sub:1,box:.3,col:C.old,mat:ROCK});
    const gp=part("grooves",[ax,ay+AY+.05,az],{glow:true});
    for(const sx of [-.42,.42])for(let i=0;i<3;i++)
      plnTube(gp,{path:[[sx-.24,0,-.17+i*.17],[sx+(i===1?.1:.24),0,-.17+i*.17]],rad:.014,sides:4,col:old,mat:GLOW,glow:2.4,x:1});
    out.hands.sample=[ax-.75,ay+AY+.06,az-.1];out.lampAt.altar=[ax,ay+1.7,az-.6];
    return true;
  }
  if(kind==="monolith"){
    /* одна плита у самой линии, лицом к человеку; две половины — части (расходятся, когда сказаны
       оба слова); шов света по лицу; два глифа в ряд на высоте глаз; за половинами — свет нутра */
    const w=H*.17,d=H*.055;
    for(const sx of [-1,1])plnBlob(part(sx<0?"l":"r",[sx*w*.5,0,0]),{c:[0,H*.5,0],r:[w*.5,H*.52,d],sub:3,box:.2,col:stone,mat:ROCK});
    seam([[0,H*.08,-d-.08],[0,H*.92,-d-.08]],H*.006,old,2.6);
    for(let i=0;i<2;i++){const g=part("g"+(i+1),[(i?.42:-.42),2.35,-d-.06],{glow:true});
      card(g,[0,0,0],.15,.21,old,2.4);}
    card(part("inner",[0,0,.1],{glow:true}),[0,H*.5,0],.62,H*.46,plnMix3(old,[1,1,1],.35),3);
    skirt(w*2.2,6,.4);out.light=lm;out.pulse=pulse;out.blots.push([0,0,w*1.6,.6]);
    out.lamp={p:[0,H*.5,-d-H*.08],r:H*.7,c:old,k:1.6,always:true};
    out.hands.sample=[w*.98,1.35,-d-.05];out.lampAt.face=[0,2.3,-d-1.4];
    return true;
  }
  if(kind==="portal"){
    /* два шестигранных пилона и перемычка; по внутреннему краю — шов света; над пилонами два ключа
       (части, кружат, пока врата открыты). От пола врат к линии — дорога плит; у линии — порог с
       подошвой шва (часть), между пилонами — тёмное зеркало (часть, сорок секунд после пробуждения) */
    const gx=H*.42;
    for(const sx of [-1,1])plnTube(m,{path:[[sx*gx,0,0],[sx*gx,H*.9,0]],rad:t=>lerp(H*.11,H*.075,t),sides:6,col:stone,mat:ROCK,cap:true});
    box([0,H*.95,0],[H*.6,H*.055,H*.1],stone,{box:.2,mat:ROCK});
    box([0,H*.02,0],[H*.7,H*.02,H*.3],stone,{box:.2,mat:ROCK});
    seam([[-gx+H*.1,H*.1,-H*.02],[-gx+H*.08,H*.86,-H*.02],[gx-H*.08,H*.86,-H*.02],[gx-H*.1,H*.1,-H*.02]],H*.007,old,2.6);
    for(const sx of [-1,1]){octa(part(sx<0?"keyL":"keyR",[sx*gx,H*1.06,0]),[0,0,0],H*.05,stone,ROCK);
      lamp([sx*gx,H*1.06,0],[H*.03,H*.03,H*.03],old,2.4);}
    /* зеркало — не плашка: к середине бледнеет и светит сильнее, к раме уходит в тёмный тон кольца,
       по нему идёт медленная рябь; ровный лиловый прямоугольник читался экраном */
    {const mp=part("mirror",[0,0,-H*.015],{glow:true}),NX=10,NY=14,hw=gx-H*.1,hh=H*.38,cy=H*.48,ids=[];
      for(let j=0;j<=NY;j++)for(let i=0;i<=NX;i++){const u=i/NX*2-1,v=j/NY*2-1,c=Math.max(0,1-(u*u*.75+v*v*.45)),
        rip=.86+.14*Math.sin(v*11+u*u*4);
        ids.push(plnVert(mp,[u*hw,cy+v*hh,0],[0,0,-1],plnMix3(plnMix3(old,[.08,.06,.12],.45*(1-c)),[.86,.9,1],.5*c*c),GLOW,0,(.25+1.35*c)*rip,0));}
      for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){const a=j*(NX+1)+i;plnQuad(mp,ids[a],ids[a+1],ids[a+NX+2],ids[a+NX+1]);}}
    const th=hand(0,2.1),[tx,tz]=th;
    walk([0,-H*.3],[tx,tz+1.4],1.25,stone);
    box([tx,gy(tx,tz)+.07,tz],[2.2,.18,.75],stone,{box:.2,mat:ROCK});
    for(const sx of [-1,1])box([tx+sx*2.05,gy(tx+sx*2.05,tz)+.45,tz+.1],[.22,.5,.3],stone,{box:.3,mat:ROCK});
    const fp=part("foot",[tx,gy(tx,tz)+.27,tz-.2],{glow:true});
    plnTube(fp,{path:[[-1.9,0,0],[1.9,0,0]],rad:.035,sides:5,col:old,mat:GLOW,glow:2.6,x:1});
    for(const sx of [-1,1])plnTube(fp,{path:[[sx*1.9,0,0],[sx*1.9,.6,.02]],rad:.035,sides:5,col:old,mat:GLOW,glow:2.6,x:1});
    skirt(H*.75,6,.5);out.light=lm;out.pulse=pulse;out.blots.push([0,0,H*.7,.55]);
    out.lamp={p:[0,H*.5,-H*.1],r:H*.9,c:old,k:1.5,always:true};
    out.hands.drain=[tx-1.2,gy(tx,tz)+.3,tz-.3];out.lampAt.foot=[tx,gy(tx,tz)+1.2,tz-.8];
    return true;
  }
  if(kind==="observ"){
    /* башня с куполом и щелью, пристройка, тарелка на мачте. Купол со щелью — часть (поворачивается к
       небу), створка — часть (уходит вбок), свет щели — часть; тарелка — часть. У линии — пульт с
       экраном (батарея, купол) и ворот на столбе (антенна); к башне от них тянутся кабели */
    const R=H*.3,hd=H*.58;
    plnTube(m,{path:[[0,0,0],[0,hd,0]],rad:R,sides:20,col:steel(C.concrete,.25),mat:MAN,cap:true});
    const dm=part("dome",[0,hd,0]);
    plnBlob(dm,{c:[0,0,0],r:[R*1.08,R*1.08,R*1.08],sub:3,cut:0,col:steel(C.steelLt,.15),mat:MAN});
    plnBlob(dm,{c:[0,H*.22,-R*.86],r:[R*.11,R*.5,R*.12],sub:2,box:.3,pitch:-.5,col:steel(C.soot,.1),mat:MAN});
    card(part("slit",[0,hd,0],{glow:true}),[0,H*.22,-R*1.14],R*.09,R*.42,C.warm,1.8);
    /* открытый купол светит из щели на себя и на землю: ночью иначе башня пропадает в небе */
    out.lampAt.slit=[0,hd+H*.2,-R*1.7];
    plnBlob(part("shutter",[0,hd,0]),{c:[0,H*.2,-R*.98],r:[R*.17,R*.56,R*.05],sub:2,box:.35,pitch:-.5,col:steel(C.steel,.3),mat:MAN});
    box([R*1.8,H*.12,R*.3],[R*1.15,H*.12,R*.75],steel(C.concrete,.3),{box:.22});
    pane([R*1.8,H*.11,-R*.8],R*.5,H*.03,C.warm,1.8);
    post(R*2.5,-R*.2,H*.75,H*.012,steel(C.steelDk,.3));
    const ds=part("dish",[R*2.5,H*.8,-R*.3]);
    /* тарелка — чаша, не знак: тёмная спина, светлое зеркало, обод и штанга с облучателем; поворот виден по штанге */
    {const pt=-1.0,n=plnRotX([0,1,0],pt),at=k=>plnMul(n,k);
      plnBlob(ds,{c:at(-R*.04),r:[R*.5,R*.09,R*.5],sub:2,pitch:pt,col:steel(C.steelDk,.2),mat:MAN});
      plnBlob(ds,{c:at(R*.03),r:[R*.45,R*.035,R*.45],sub:2,pitch:pt,col:steel(C.steelLt,.05),mat:MAN});
      const rim=[];for(let k=0;k<=20;k++){const a=k/20*TAU;rim.push(plnAdd(plnRotX([Math.cos(a)*R*.49,0,Math.sin(a)*R*.49],pt),at(R*.04)));}
      plnTube(ds,{path:rim,rad:R*.025,sides:5,col:C.steelDk,mat:MAN});
      for(const a of [0,TAU/3,TAU*2/3])plnTube(ds,{path:[plnAdd(plnRotX([Math.cos(a)*R*.44,0,Math.sin(a)*R*.44],pt),at(R*.04)),at(R*.42)],rad:R*.012,sides:4,col:C.steelDk,mat:MAN});
      plnBlob(ds,{c:at(R*.45),r:[R*.06,R*.06,R*.06],sub:1,box:.4,col:C.orange,mat:MAN});}
    out.light=lm;out.pulse=night;
    out.lamp={p:[R*1.8,H*.2,-R*1.3],r:H*.8,c:[1,.62,.3],k:3};
    skirt(R*2.4,7,.6);out.blots.push([0,0,R*2,.6]);
    /* пульт: тумба, наклонная крышка с экраном; кабель по земле к башне */
    {const [cx,cz]=hand(dx("dome"),2.2),cy=gy(cx,cz);
      box([cx,cy+.5,cz],[.32,.52,.24],steel(C.steel,.35),{box:.25});
      box([cx,cy+1.06,cz-.05],[.36,.05,.28],steel(C.steelDk,.3),{box:.3,pitch:.45});
      box([cx,cy+.75,cz-.25],[.33,.04,.02],C.orange,{box:.3});
      const sc=part("screen",[cx,cy+1.1,cz-.12],{glow:true});
      plnCard(sc,[-.26,-.1,-.05],[-.26,.08,.06],[.26,.08,.06],[.26,-.1,-.05],[0,.6,-.8],[.5,1,.7],GLOW,null,2,1);
      const pts=[];for(let i=0;i<=8;i++){const x=lerp(cx,-R*.7,i/8),z=lerp(cz+.2,-R*.72,i/8);pts.push([x,gy(x,z)+.05,z]);}
      plnTube(m,{path:pts,rad:.04,sides:5,col:C.soot,mat:MAN});
      out.lampAt.console=[cx,cy+1.6,cz-.7];}
    /* ворот: столб с колесом и рукоятью; колесо — часть (крутится, пока человек работает) */
    {const [kx,kz]=hand(dx("dish"),2.2),ky=gy(kx,kz);
      rod([kx,ky-.1,kz],[kx,ky+1.15,kz],.07,steel(C.steelDk,.35),{sides:8});
      box([kx,ky+1.12,kz],[.12,.12,.12],steel(C.orange,.3),{box:.3});
      const wh=part("crank",[kx,ky+1.12,kz-.16]),rg=[];
      for(let k=0;k<=20;k++){const a=k/20*TAU;rg.push([Math.cos(a)*.3,Math.sin(a)*.3,0]);}
      plnTube(wh,{path:rg,rad:.03,sides:5,col:steel(C.steelLt,.3),mat:MAN});
      for(let i=0;i<3;i++){const a=i/3*TAU;plnTube(wh,{path:[[0,0,0],[Math.cos(a)*.3,Math.sin(a)*.3,0]],rad:.018,sides:4,col:C.steelDk,mat:MAN});}
      plnTube(wh,{path:[[.3,0,0],[.3,0,-.18]],rad:.025,sides:5,col:C.orange,mat:MAN,cap:true});
      const pts=[];for(let i=0;i<=8;i++){const x=lerp(kx,R*2.5,i/8),z=lerp(kz+.2,-R*.2,i/8);pts.push([x,gy(x,z)+.05,z]);}
      plnTube(m,{path:pts,rad:.04,sides:5,col:C.soot,mat:MAN});}
    return true;
  }
  if(kind==="obelisk"){
    /* стальной клинок у самой линии: бетонная пята, оранжевый пояс, засечка на высоте руки (резана
       рукой — тёмные риски; прочитанная светится), клин ржавчины у вершины и наклонённый верх —
       части: клин снимают с ранца, верх падает к линии; своя засечка — светлая царапина (часть) */
    const w=H*.07,d=H*.03,tp=[H*.06,H*.93,0],wp=[-H*.02,H*.845,0];
    box([0,H*.04,0],[H*.2,H*.04,H*.15],steel(C.concrete,.2),{box:.2});
    plnBlob(m,{c:[0,H*.42,0],r:[w,H*.4,d],sub:2,box:.2,col:(u,p,n)=>steel(Math.abs(p[1]-H*.5)<H*.035?C.orange:C.steel,.3)(u,p,n),mat:MAN});
    for(let i=0;i<5;i++)box([-.12+(i%2)*.06,1.25+i*.11,-d-.01],[.18-(i===2?.06:0),.012,.012],C.soot,{box:.3});
    for(let i=0;i<3;i++)box([.06,1.3+i*.17,-d-.01],[.012,.07,.012],C.soot,{box:.3,lean:.25});
    const ln=part("lines",[0,1.47,-d-.03],{glow:true});
    for(let i=0;i<5;i++)card(ln,[-.12+(i%2)*.06,-.22+i*.11,0],.17-(i===2?.06:0),.01,C.warm,2.2);
    const tz=Math.min(-1.9,-T.oz+1.1),tx=1.6,ty=gy(tx,tz)+w*.75-.05;
    const tpm=part("top",tp,{to:{x:tx-tp[0],y:ty-tp[1],z:tz,yaw:.5,roll:1.42}});
    plnBlob(tpm,{c:[0,0,0],r:[w*.7,H*.08,d],sub:2,box:.2,lean:-.3,col:steel(C.steel,.3),mat:MAN});
    const wx=-.7,wz=tz+.4,wy=gy(wx,wz)+.1;
    plnBlob(part("wedge",wp,{to:{x:wx-wp[0],y:wy-wp[1],z:wz,yaw:-.8,roll:2.2}}),{c:[0,0,0],r:[w*.45,H*.025,d*.9],sub:1,box:.3,lean:.6,col:steel(C.rust,.8),mat:MAN});
    card(part("scratch",[w*.72,1.5,-d-.02],{glow:true}),[0,0,0],.16,.022,[1,.92,.8],2.6);
    lamp([H*.025,H*1.01,0],[H*.016,H*.016,H*.016],C.white,2.4);
    out.light=lm;out.pulse=(t,nk)=>nk*(Math.sin(t*2.6+sd)>.8?1:.5);
    skirt(H*.25,5,.5);out.blots.push([0,0,H*.22,.5]);
    out.hands.carve=[w*.72,1.5,-d-.08];out.lampAt.carve=[w*.6,1.6,-d-.8];out.lampAt.notch=[0,1.6,-d-1.1];
    return true;
  }
  return false;
}
