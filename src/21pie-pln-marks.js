/* ══════════════ планета: ориентиры — двенадцать памятников игры (M627) ══════════════
   Достопримечательности игры (tr.poi, 20a-poi) встают в новый кадр телами. Место —
   x игры на линии хода, в глубину — своя полоса за линией (PLN_MARK.kinds.z): памятник
   стоит за тропой, на ленте земли, и человек подходит к нему по линии хода, как ходил.
   Рост — высота игры к её человеку (17 единиц), переведённая в метры сцены.

   Три грамматики (DESIGN-planet §2): природа — гранёная, матовая, в палитре мира
   (кристаллы); люди — гладкие промышленные формы, оранжевый пояс, единственный тёплый
   свет (остов, лифт, завод, обсерватория, зарубка, батарея); древние — совершенная
   геометрия, тёмный камень и свой свет цвета, которого у мира нет (храм, кольцо,
   аномалия, монолит, врата).

   Тело памятника — одна сетка в своих метрах, строится раз на посадку; у каждого до
   трёх записей: тело, свет и то, что движется. Свет — отдельная сетка материала
   свечения: запись красит его пульсом (древние) или ночью (люди); движение — поворот
   или подъём записи по часам кадра (осколки аномалии кружат, вагон лифта ползёт по
   тросу). Тени — настоящие, по картам; под подножием — пятно (F.blobs); под ногами —
   осыпь в камне мира, чтобы подошва не висела над лентой. Цветы и травы обходят
   площадку (plnMarkPad → 21pga). Старая наклейка (drawPOI, 21pj) гаснет за PLN_MARK.on. */
const PLN_MARK={on:true,
  k:.8,                                 /* рост: единицы игры → метры сцены, сверх 1/PLN_M: старый кадр клал памятник наклейкой за всем,
                                           в сцене он стоит в 66–86 м от ближнего объектива, где кадр — 28–36 м в высоту */
  /* свой цвет древних — тот, которого в палитре мира нет: напротив её тона по кругу */
  old:{terran:"#d06cff",ocean:"#ffb45a",desert:"#5ae0ff",rocky:"#5affd2",ice:"#ff7a50",volcanic:"#6cd8ff",
    toxic:"#c070ff",crystal:"#ff6ab4",jungle:"#ff62b6",metal:"#ffc24e",ruin:"#5affc8"},
  /* где стоит каждый: глубина за линией хода, м; поворот к объективу; ширина площадки долей роста; своя мерка роста
     (высота игры — одна на всех, а тела разные: обсерватория с куполом в 8 м — макет); кто строил;
     zH — глубина растёт с ростом: ближний борт остова стоит у линии хода, в 3 м (M627b) */
  kinds:{wreck:{z:3,zH:.31,fz:.4,yaw:.06,w:2.6,s:.7,who:1,hMin:7},temple:{z:30,yaw:.3,w:1.7,s:1.3,who:2},elevator:{z:34,yaw:.2,w:.4,s:.8,who:1},
    crystals:{z:15,yaw:0,w:1.9,s:.55,who:0},ring:{z:36,yaw:.5,w:1.1,s:.85,who:2},anomaly:{z:22,yaw:0,w:1.0,s:1.3,who:2},
    monolith:{z:8,yaw:0,w:.5,s:1.2,who:2},factory:{z:34,yaw:.25,w:2.3,s:.8,who:1},portal:{z:28,yaw:.2,w:1.3,s:1,who:2},
    observ:{z:30,yaw:.3,w:1.6,s:1.6,who:1},obelisk:{z:5,yaw:0,w:.5,s:.7,who:1,hMax:11},battery:{z:22,yaw:.35,w:1.1,s:1.2,who:1}}};
const PLN_MARK_COL={steel:plnHex("#7c8594"),steelDk:plnHex("#3c434d"),steelLt:plnHex("#aab2bd"),orange:plnHex("#e07a2c"),
  rust:plnHex("#6a3e26"),concrete:plnHex("#8d897f"),soot:plnHex("#24252a"),old:plnHex("#2a3040"),oldLt:plnHex("#4e566c"),
  warm:[1,.72,.42],red:[1,.16,.08],white:[1,.96,.9]};

/* рост памятника в метрах сцены */
/* hMin — нижняя мерка: остов ниже семи метров читался игрушкой рядом с человеком (M627b);
   hMax — верхняя: клин зарубки должен висеть в девяти метрах, на высоте ранца */
function plnMarkH(q){const K=PLN_MARK.kinds[q.k];return Math.min((K&&K.hMax)||1e9,Math.max((K&&K.hMin)||0,q.h*(q.sc||1)/PLN_M*PLN_MARK.k*(K?K.s:1)));}
/* глубина памятника за линией хода, м */
function plnMarkZ(K,H){return K.z+H*(K.zH||0);}
/* площадка памятника для расчистки трав (21pga): [x м, z, rx, rz, рост] */
function plnMarkPad(q){
  const K=PLN_MARK.kinds[q.k];
  if(!K)return null;
  const H=plnMarkH(q),w=H*K.w;
  return [q.x/PLN_M,plnMarkZ(K,H),w*.6+2,Math.max(w*.4,4)+2,H];
}

/* ── сетки ──
   Строятся в местных метрах: подошва в нуле, y вверх, объектив со стороны −z. gy(lx,lz) —
   земля ленты под местной точкой относительно подошвы (осыпь садится на рельеф).
   Возвращает {body, light, move, moveAt(t)→{y,yaw}, pulse(t,nk)→k, lamp, blots, parts, hands, lampAt}.
   Части (M627b) — свои сетки вокруг своей оси pv (местные метры); их двигает привод вида из 21pif:
   сдвиг, поворот, крен, яркость. hands — где у места работает рука (искры резака), lampAt — где
   встают лампы привода. o — {yaw, z}: поставить вещь у линии хода по смещению вдоль неё (hand) */
function plnMarkMesh(kind,H,sd,gy,P,oldCol,W,mound,o){
  const C=PLN_MARK_COL,r=rng(sd),MAN=PLN_MAT.man,ROCK=PLN_MAT.rock,GLOW=PLN_MAT.glow;
  const m=plnMesh(1<<13),lm=plnMesh(1<<9),mv=plnMesh(1<<9);
  const out={body:m,light:null,move:null,moveAt:null,pulse:null,lamp:null,blots:[],parts:[],hands:{},lampAt:{}};
  /* часть: своя сетка, ось pv; glow — светится и тени не бросает */
  const part=(id,pv,op)=>{const pm=plnMesh(1<<10);out.parts.push(Object.assign({id,pv,m:pm},op||{}));return pm;};
  /* мир → местное: смещение dx вдоль линии хода и мировая глубина zw */
  const oy=(o&&o.yaw)||0,oz=(o&&o.z)||0,cy0=Math.cos(oy),sy0=Math.sin(oy);
  const hand=(dx,zw)=>[dx*cy0-(zw-oz)*sy0,dx*sy0+(zw-oz)*cy0];
  const noise=(p,k,s)=>.5+.5*plnNoise(p[0]*k+sd*.13,p[1]*k+p[2]*k*.6,sd+s);
  /* цвет зовут по-разному: blob — (u,p,n), tube — (t,угол,p), loft — (t,s,p,c): точка — p, нормаль — только у blob */
  const P3=(a,b,c)=>Array.isArray(b)?b:c,N3=(a,b,c)=>Array.isArray(b)?c:[0,.4,0];
  /* кожа людей: сталь в пятнах ржавчины и копоти, где rust велик; древние — тёмный камень, светлее кверху */
  const steel=(base,rust)=>(a,b,c)=>{const p=P3(a,b,c),v=noise(p,.45,1),w=noise(p,1.6,2);
    return plnMix3(plnMix3(base,C.steelDk,.25*v),C.rust,rust*plnSmooth(.55,.85,w)*(.5+.5*v));};
  const stone=(a,b,c)=>{const n=N3(a,b,c);return plnMix3(C.old,C.oldLt,.3+.5*Math.max(0,n[1]));};
  const ground=(a,b,c)=>plnMix3(P.rockWarm,P.rockCool,.5+.3*noise(P3(a,b,c),.3,9));
  const box=(c,rr,col,o)=>plnBlob(m,Object.assign({c,r:rr,sub:2,box:.3,col,mat:MAN},o||{}));
  const rod=(a,b,rad,col,o)=>plnTube(m,Object.assign({path:[a,b],rad,sides:10,col,mat:MAN,cap:true},o||{}));
  const post=(x,z,h,rad,col,o)=>rod([x,0,z],[x,h,z],rad,col,o);
  /* осыпь у подошвы: камень мира, плоские глыбы по кругу, садятся на землю */
  const skirt=(R,n,k)=>{
    for(let i=0;i<n;i++){
      const a=i/n*TAU+r()*.5,d=R*(.75+r()*.35),lx=Math.cos(a)*d,lz=Math.sin(a)*d*.8,s=R*(.12+r()*.1)*(k||1);
      plnBlob(m,{c:[lx,gy(lx,lz)-s*.25,lz],r:[s*1.6,s*.6,s*1.2],sub:1,bump:.35,seed:sd+i,yaw:r()*TAU,lean:(r()-.5)*.3,
        col:plnMix3(P.rockWarm,P.rockCool,r()),mat:ROCK});
    }
  };
  /* свет: своя сетка */
  const lamp=(c,rr,col,g,sub)=>plnBlob(lm,{c,r:rr,sub:sub==null?1:sub,col,mat:GLOW,glow:g||2.2,x:1});
  const seam=(path,rad,col,g)=>plnTube(lm,{path,rad,sides:6,col,mat:GLOW,glow:g||2.2,x:1,cap:true});
  const pane=(c,w,h,col,g)=>plnCard(lm,[c[0]-w,c[1]-h,c[2]],[c[0]-w,c[1]+h,c[2]],[c[0]+w,c[1]+h,c[2]],[c[0]+w,c[1]-h,c[2]],[0,0,-1],col,GLOW,null,g||2,1);
  const night=(t,nk)=>nk;
  const pulse=(t,nk)=>.72+.28*Math.sin(t*.9+sd);
  const old=oldCol;
  /* подошва выше земли за гребнем: холм камня мира от подошвы до земли */
  if(mound>.6)plnBlob(m,{c:[0,-mound*.5-.4,0],r:[W*.6,mound*.5+.7,W*.5],sub:2,bump:.22,box:.6,seed:sd+7,col:ground,mat:ROCK});

  /* набор рук для тел в своих модулях: остов (21piea), тихая пятёрка (21pieb) */
  const T={C,r,MAN,ROCK,GLOW,m,lm,mv,out,part,hand,noise,P3,N3,steel,stone,ground,box,rod,post,skirt,lamp,seam,pane,night,pulse,old,H,sd,gy,P,W,oz,kind};
  if(kind==="wreck")plnMarkWreck(T);
  else if(plnMarkStone(kind,T)){}
  else if(kind==="elevator"){
    /* станция, конус, трос в небо с хомутами и красными огнями; вагон ползёт вверх */
    const Rb=H*.06,hb=H*.035;
    plnTube(m,{path:[[0,0,0],[0,hb,0]],rad:Rb,sides:18,col:steel(C.concrete,.2),mat:MAN,cap:true});
    plnTube(m,{path:[[0,hb,0],[0,hb+H*.14,0]],rad:t=>lerp(Rb*.7,Rb*.2,t),sides:14,col:(t,a,p)=>steel(t>.3&&t<.4?C.orange:C.steel,.2)([0,0,0],p,[0,0,0]),mat:MAN});
    plnTube(m,{path:[[0,hb+H*.12,0],[0,H*4,0]],rad:H*.004,sides:6,col:C.steelDk,mat:MAN});
    for(let i=1;i<=8;i++){const y=hb+H*.12+i*H*.1;
      plnTube(m,{path:[[0,y-.6,0],[0,y+.6,0]],rad:H*.011,sides:8,col:steel(C.steelLt,.1),mat:MAN,cap:true});
      lamp([0,y+.9,0],[.35,.35,.35],C.red,2.6);}
    for(let i=0;i<3;i++){const a=i/3*TAU+.5,d=Rb*2.6;
      rod([0,hb+H*.11,0],[Math.cos(a)*d,gy(Math.cos(a)*d,Math.sin(a)*d),Math.sin(a)*d],H*.002,C.steelDk,{sides:5});}
    box([Rb*1.8,H*.03,-Rb*.4],[Rb*1.1,H*.03,Rb*.8],steel(C.steel,.2),{box:.25});
    box([-Rb*1.9,H*.02,Rb*.3],[Rb*.8,H*.02,Rb*.6],steel(C.steel,.3),{box:.25});
    pane([Rb*1.8,H*.035,-Rb*1.22],Rb*.5,H*.005,C.warm,1.6);
    plnBlob(mv,{c:[0,0,0],r:[H*.014,H*.03,H*.014],sub:2,box:.3,col:steel(C.steelLt,.1),mat:MAN});
    plnBlob(mv,{c:[0,-H*.02,-H*.012],r:[H*.004,H*.004,H*.004],sub:1,col:C.warm,mat:GLOW,glow:2.4,x:1});
    out.move=mv;out.moveAt=t=>({y:hb+H*.15+H*.9*(.5-.5*Math.cos(((t*.012+sd*.01)%1)*TAU)),yaw:0});
    out.light=lm;out.pulse=night;
    out.lamp={p:[Rb*1.8,H*.05,-Rb*1.3],r:H*.22,c:[1,.62,.3],k:3};
    skirt(Rb*2.6,6,.9);out.blots.push([0,0,Rb*2.2,.55]);
  }
  else if(kind==="crystals"){
    /* лес призм: грани делит свет (камень), цвет — акцент мира со снегом по верху; слабо светятся изнутри */
    const W=H*1.9,base=plnMix3(P.heather,P.clover,.4),N=15;
    for(let i=0;i<N;i++){
      const a=r()*TAU,d=W*.5*Math.sqrt(r()),lx=Math.cos(a)*d,lz=Math.sin(a)*d*.7,hh=H*(i<3?.7+r()*.3:.2+r()*.4),w=hh*(.14+r()*.1),y0=gy(lx,lz);
      const col=(u,p,n)=>plnMix3(plnMix3(P.crag,base,plnSmooth(-.2,.6,(p[1]-y0)/hh)),P.snow,.35*Math.max(0,n[1])*plnSmooth(.3,1,(p[1]-y0)/hh));
      plnBlob(m,{c:[lx,y0+hh*.75,lz],r:[w,hh,w*.8],sub:2,box:.42,seed:sd+i,yaw:r()*TAU,lean:(r()-.5)*.5,pitch:(r()-.5)*.4,col,mat:ROCK,glow:.3});
    }
    for(let i=0;i<10;i++){const a=r()*TAU,d=W*(.3+.3*r()),lx=Math.cos(a)*d,lz=Math.sin(a)*d*.7,hh=H*(.06+r()*.1);
      plnBlob(m,{c:[lx,gy(lx,lz)+hh*.5,lz],r:[hh*.3,hh,hh*.25],sub:1,box:.45,seed:sd+40+i,yaw:r()*TAU,lean:(r()-.5)*.9,col:plnMix3(P.crag,base,.6),mat:ROCK,glow:.3});}
    skirt(W*.45,8,.6);out.blots.push([0,0,W*.4,.5]);
  }
  else if(kind==="ring"){
    /* кольцо на ребре, нижняя четверть в земле; восемь узлов света; труба подачи уходит вдоль */
    const R=H*.5,rad=R*.085,yc=R*.72,pts=[];
    for(let k=0;k<=48;k++){const a=k/48*TAU;pts.push([R*Math.cos(a),yc+R*Math.sin(a),0]);}
    plnTube(m,{path:pts,rad,sides:12,col:stone,mat:ROCK});
    for(let k=0;k<8;k++){const a=k/8*TAU+Math.PI/8,x=R*Math.cos(a),y=yc+R*Math.sin(a);if(y<rad)continue;
      plnBlob(m,{c:[x,y,0],r:[rad*1.45,rad*1.45,rad*1.45],sub:1,box:.5,yaw:a,col:stone,mat:ROCK});}
    const band=[];
    for(let k=0;k<=48;k++){const a=k/48*TAU,Ri=R-rad*.9;band.push([Ri*Math.cos(a),yc+Ri*Math.sin(a),-rad*.35]);}
    seam(band,rad*.22,old,2.4);
    for(const sx of [-1,1])box([sx*R*.86,gy(sx*R*.86,0)+R*.06,0],[R*.12,R*.1,R*.14],stone,{box:.25,mat:ROCK});
    plnTube(m,{path:[[-R*1.9,gy(-R*1.9,R*.3)+rad*.9,R*.3],[R*.1,gy(R*.1,R*.3)+rad*.9,R*.3]],rad:rad*.75,sides:10,col:stone,mat:ROCK,cap:true});
    skirt(R*1.1,6,.5);out.light=lm;out.pulse=(t,nk)=>.6+.4*Math.pow(.5+.5*Math.sin(t*2.1+sd),3);
    out.lamp={p:[0,yc,-rad],r:R*1.3,c:old,k:1.4,always:true};
    out.blots.push([0,0,R*.9,.5]);
  }
  else if(kind==="anomaly"){
    /* чёрный шар висит на высоте, вокруг — кольцо света и кружащие осколки камня мира */
    const yc=H*.62,Rv=H*.21,Ro=H*.42;
    plnBlob(m,{c:[0,yc,0],r:[Rv,Rv,Rv],sub:3,col:[0,0,0],mat:GLOW,glow:0,x:1});
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
  }
  else if(kind==="factory"){
    /* длинный цех с зубчатой крышей, две трубы с поясом, бак и трубопроводы; окна тёплые ночью */
    const W=H*2.3,hh=H*.3;
    box([0,hh*.5,0],[W*.5,hh*.5,W*.26],steel(C.concrete,.35),{box:.2});
    for(let i=0;i<4;i++){const x=(i-1.5)/1.5*W*.33;
      plnBlob(m,{c:[x,hh+H*.07,0],r:[W*.11,H*.09,W*.25],sub:2,box:.25,lean:.5,col:steel(C.steel,.3),mat:MAN});}
    for(const x of [W*.3,W*.42]){
      plnTube(m,{path:[[x,0,W*.12],[x,H,W*.12]],rad:H*.045,sides:12,col:(t,a,p)=>steel(t>.62&&t<.7?C.orange:(t>.93?C.soot:C.steel),.4)([0,0,0],p,[0,0,0]),mat:MAN,cap:true});
      plnTube(m,{path:[[x,H*.4,W*.12],[x,H*.44,W*.12]],rad:H*.055,sides:12,col:steel(C.steelDk,.3),mat:MAN,cap:true});}
    plnTube(m,{path:[[-W*.58,H*.14,-W*.05],[-W*.36,H*.14,-W*.05]],rad:H*.12,sides:14,col:steel(C.steel,.45),mat:MAN,cap:true});
    for(let i=0;i<3;i++)rod([-W*.4,H*.2+i*H*.03,-W*.05+i*W*.03],[-W*.5+i*W*.04,hh*.9,-W*.26+i*W*.02],H*.014,steel(C.steelDk,.4));
    rod([W*.3,H*.5,W*.12],[W*.42,H*.5,W*.12],H*.02,steel(C.steelDk,.3));
    for(let j=0;j<2;j++)for(let i=0;i<9;i++)pane([(i-4)/4*W*.42,hh*(.38+.3*j),-W*.26-.05],W*.016,hh*.055,C.warm,1.6);
    pane([-W*.42,hh*.3,-W*.26-.05],W*.04,hh*.3,C.warm,1.8);
    out.light=lm;out.pulse=night;
    out.lamp={p:[-W*.42,hh*.62,-W*.26-1.5],r:H*.9,c:[1,.62,.3],k:3};
    skirt(W*.42,8,.7);out.blots.push([0,0,W*.45,.6]);
  }
  else if(kind==="battery"){
    /* шесть ячеек в раме, шины поверху, одна ячейка вывалилась; одна ещё мигает изредка */
    const cw=H*.15,ch=H*.3,cd=H*.14;
    for(let i=0;i<2;i++)for(let j=0;j<3;j++){const x=(j-1)*cw*2.3,z=(i-.5)*cd*2.4,fall=i===0&&j===2;
      box([x+(fall?cw*.5:0),H*.1+ch*(fall?.6:1),z+(fall?-cd*.6:0)],[cw,ch,cd],steel(C.steelDk,.6),{box:.2,lean:fall?.45:0,pitch:fall?.2:0});
      if(!fall)rod([x,H*.1+ch*2+H*.02,z],[x,H*.1+ch*2+H*.1,z],H*.02,steel(C.rust,.7));}
    for(const z of [-cd*1.2,cd*1.2])rod([-cw*2.6,H*.1+ch*2+H*.1,z],[cw*2.6,H*.1+ch*2+H*.1,z],H*.025,steel(C.rust,.6));
    for(const x of [-cw*2.6,cw*2.6])for(const z of [-cd*1.6,cd*1.6])post(x,z,H*.1+ch*2+H*.1,H*.02,steel(C.steelDk,.5));
    box([0,H*.05,0],[cw*3,H*.05,cd*2],steel(C.concrete,.3),{box:.2});
    for(let i=0;i<6;i++){const lx=(r()-.5)*H*1.2,lz=(r()-.5)*H*.9;
      plnBlob(m,{c:[lx,gy(lx,lz)+H*.015,lz],r:[H*.03,H*.015,H*.03],sub:1,col:steel(C.steelLt,.5),mat:MAN});}
    pane([-cw*2.3,H*.1+ch,-cd*1.2-cd-.05],cw*.5,ch*.25,[.45,.9,.6],1.6);
    out.light=lm;out.pulse=(t,nk)=>Math.max(0,Math.sin(t*.7+sd)*Math.sin(t*2.3)-.55)*2.2;
    skirt(H*.6,6,.6);out.blots.push([0,0,H*.6,.55]);
  }
  if(out.light&&!lm.nv)out.light=null;
  return out;
}

/* ── памятники этой посадки ── */
function plnMarks(L,S){
  let Q=L.marks;
  const tr=L.tr,list=(tr&&tr.poi)||[];
  if(Q&&Q.gen!==PLN_GPU.gen){plnMarksDrop(L);Q=null;}
  if(Q&&Q.n===list.length)return Q;
  if(Q)plnMarksDrop(L);
  const t0=wallMs(),P=PLN_PAL,M=PLN_M,type=(S&&S.p&&S.p.type)||"terran",oldCol=plnHex(PLN_MARK.old[type]||"#c0a0ff");
  Q=L.marks={gen:PLN_GPU.gen,n:list.length,items:[],ms:0};
  for(const q of list){
    const K=PLN_MARK.kinds[q.k];
    if(!K||Q.items.length>=PLN_MARK.cap)continue;
    const H=plnMarkH(q),x=q.x/M,z=plnMarkZ(K,H),yaw=K.yaw,cy=Math.cos(yaw),sy=Math.sin(yaw),w=H*K.w;
    const at=(lx,lz)=>plnLandRibAt(L,x+lx*cy+lz*sy,z+lz*cy-lx*sy);
    /* линия хода — гребень, за ним земля падает: подошва не ниже гребня между объективом и памятником
       (минус немного), иначе за гребнем видна одна макушка; разницу до земли берёт холм */
    /* fz — полуглубина подошвы в долях высоты: длинное тело у линии хода (остов) мерит землю под собой,
       а не на ширину вглубь — иначе земля за гребнем роняет подошву и борт уходит в грунт */
    let lo=1e9,crest=-1e9;const fz=K.fz?H*K.fz:w*.35;
    for(const [lx,lz] of [[0,0],[w*.5,0],[-w*.5,0],[0,fz],[0,-fz],[w*.35,fz*.7],[-w*.35,-fz*.7]])lo=Math.min(lo,at(lx,lz));
    for(let zz=0;zz<=z;zz+=2)crest=Math.max(crest,plnLandRibAt(L,x,zz),plnLandRibAt(L,x-w*.3,zz),plnLandRibAt(L,x+w*.3,zz));
    const y=Math.max(lo-.4,crest-2.5),mound=y-lo;
    const gy=(lx,lz)=>at(lx,lz)-y;
    const sd=(q.seed|0)>>>0||hashi(Math.round(q.x),7,0xA17);
    const B=plnMarkMesh(q.k,H,sd,gy,P,oldCol,w,mound,{yaw,z});
    const parts=[];
    for(const pt of B.parts){if(!pt.m.nv)continue;parts.push({id:pt.id,pv:pt.pv,yaw0:pt.yaw0||0,glow:!!pt.glow,to:pt.to||null,geo:plnGeo(plnMeshDone(pt.m)),on:false});}
    const it={q,kind:q.k,H,x,y,z,yaw,w,mound:+mound.toFixed(1),geo:plnGeo(plnMeshDone(B.body)),light:B.light?plnGeo(plnMeshDone(B.light)):null,
      move:B.move?plnGeo(plnMeshDone(B.move)):null,moveAt:B.moveAt,pulse:B.pulse,lamp:B.lamp,blots:B.blots,
      parts,hands:B.hands,lampAt:B.lampAt,a:new Float32Array((4+parts.length)*16),inst:null};
    plnRec(it.a,0,[x,y,z],1,yaw,1,sd%97);
    plnRec(it.a,1,[x,y,z],1,yaw,1,sd%97,[1,1,1]);
    plnRec(it.a,2,[x,y,z],1,yaw,1,sd%97);
    plnRec(it.a,3,[x,y,z],1,yaw,1,0,[0,0,0]);
    for(let i=0;i<parts.length;i++)plnRec(it.a,4+i,plnMarkWorld(it,parts[i].pv[0],parts[i].pv[1],parts[i].pv[2]),1,yaw+parts[i].yaw0,1,0);
    it.inst=plnInst(it.a,4+parts.length,4+parts.length);
    Q.items.push(it);
  }
  Q.ms=wallMs()-t0;
  PLN.stat.marks={n:Q.items.length,kinds:Q.items.map(i=>i.kind+":"+Math.round(i.H)+"m"+(i.mound?"+"+i.mound:"")),ms:Math.round(Q.ms)};
  return Q;
}
/* местная точка памятника → мир */
function plnMarkWorld(it,lx,ly,lz){
  const c=Math.cos(it.yaw),s=Math.sin(it.yaw);
  return [it.x+lx*c+lz*s,it.y+ly,it.z+lz*c-lx*s];
}
/* искры резака (M627b): одна сетка на все памятники, своя на каждое поколение устройства */
function plnMarkSpark(){
  const Z=PLN_MARK;
  if(Z.spk&&Z.spk.gen===PLN_GPU.gen)return Z.spk.geo;
  const m=plnMesh(256),r=rng(0x5A9C);
  plnBlob(m,{c:[0,0,0],r:[.07,.07,.07],sub:1,col:[1,.95,.8],mat:PLN_MAT.glow,glow:6,x:1});
  for(let i=0;i<9;i++){const a=r()*TAU,u=.08+r()*.3,h=(r()-.3)*.3,s=.012+r()*.02;
    plnBlob(m,{c:[Math.cos(a)*u,h,Math.sin(a)*u*.5-.05],r:[s,s,s],sub:0,col:plnMix3([1,.85,.5],[1,.45,.12],r()),mat:PLN_MAT.glow,glow:5,x:1});}
  Z.spk={gen:PLN_GPU.gen,geo:plnGeo(plnMeshDone(m))};
  return Z.spk.geo;
}
/* Ставит памятники в кадр: тела, свет по пульсу или по ночи, подвижные части по часам, лампы людей
   и пятна под подножием. ex — где стоит объектив, V — {hw, D}, nk — ночь (0…1).
   С M627b свет, части и лампы ведёт привод вида (21pif, plnActFrame) по памяти памятника; тот же
   вызов у памятника, где стоит человек, читает ДЕЙСТВИЕ и пишет подсказку — кадр рисунка идёт
   после шага мира и до hud(), так что строка, которую видит игрок, — эта */
function plnMarksFrame(L,F,S,p,ex,V,nk){
  if(!PLN_MARK.on||!S||!S.tr||!S.tr.poi||!S.tr.poi.length)return;
  const Q=plnMarks(L,S),B=PLN_KIND.body,TO=PLN_TO.all,b=F.blobs,t=F.t;
  const sees=(x,z,m)=>Math.abs(x-ex)<V.hw*(1+z/V.D)+m;
  const act=typeof plnActFrame==="function"&&plnActOn();
  if(act)plnActInput();
  /* у кадра четыре лампы на всех (21pe): приводу памятников — не больше двух */
  let n=b[0]|0,ln=0;
  for(const it of Q.items){
    const A=act?plnActFrame(it,S,p,nk,t):null,dr=(A&&A.drive)||null;
    if(A&&A.prompt){G.prompt=A.prompt;PLN_ACT.wrote=A.prompt;}
    if(!sees(it.x,it.z,it.w*.6+it.H*.3))continue;
    const pos=[it.x,it.y,it.z];
    const lk=it.light?(dr&&dr.light!=null?dr.light:(it.pulse?it.pulse(t,nk):1)):0;
    plnRec(it.a,1,pos,1,it.yaw,1,0,[lk,lk,lk]);
    if(it.move){
      const mv=it.moveAt?it.moveAt(t):{y:0,yaw:0};
      plnRec(it.a,2,[it.x,it.y+mv.y,it.z],1,it.yaw+mv.yaw,1,0);
    }
    let sk=0;
    const sp=dr&&dr.spark&&it.hands&&it.hands[dr.spark.id];
    if(sp){
      sk=dr.spark.k;const w=plnMarkWorld(it,sp[0],sp[1],sp[2]);
      plnRec(it.a,3,w,.8+.5*sk,t*2.3,1,0,[sk,sk,sk]);
      F.lamps.push({p:w,r:2.8,c:[1,.72,.4],k:2.4*sk});ln++;
    }
    const P=it.parts||[];
    for(let i=0;i<P.length;i++){
      const pt=P[i],d=(dr&&dr.parts&&dr.parts[pt.id])||{},s=d.s||1,k=d.k==null?1:d.k;
      /* to — где часть ложится (меряно по земле при сборке), go — доля пути туда от привода */
      const o2=pt.to,g=o2?clamp(d.go||0,0,1):0,ro=(d.roll||0)+(o2?(o2.roll||0)*g:0);
      const w=plnMarkWorld(it,pt.pv[0]+(d.x||0)+(o2?(o2.x||0)*g:0),pt.pv[1]+(d.y||0)+(o2?(o2.y||0)*g:0),pt.pv[2]+(d.z||0)+(o2?(o2.z||0)*g:0));
      plnRec(it.a,4+i,w,ro?-s:s,it.yaw+pt.yaw0+(d.yaw||0)+(o2?(o2.yaw||0)*g:0),d.hk==null?1:d.hk,ro,[k,k,k]);
      pt.on=!d.hide&&!(pt.glow&&k<.01);
    }
    plnInstSet(it.inst,it.a,4+P.length);
    F.batches.push({geo:it.geo,inst:it.inst,first:0,count:1,kind:B,to:TO});
    if(it.light&&lk>.01)F.batches.push({geo:it.light,inst:it.inst,first:1,count:1,kind:B,to:TO});
    if(it.move)F.batches.push({geo:it.move,inst:it.inst,first:2,count:1,kind:B,to:TO});
    if(sk>.01)F.batches.push({geo:plnMarkSpark(),inst:it.inst,first:3,count:1,kind:B,to:PLN_TO.lit});
    for(let i=0;i<P.length;i++)if(P[i].on)F.batches.push({geo:P[i].geo,inst:it.inst,first:4+i,count:1,kind:B,to:P[i].glow?PLN_TO.lit:TO});
    /* lampK привода: погасший памятник гасит и свою лампу (0), разбуженный — ярче */
    const lK=dr&&dr.lampK!=null?dr.lampK:1;
    if(it.lamp&&lK>.01&&(it.lamp.always||nk>.02)){const w=plnMarkWorld(it,it.lamp.p[0],it.lamp.p[1],it.lamp.p[2]);
      F.lamps.push({p:w,r:it.lamp.r,c:it.lamp.c,k:it.lamp.k*lK*(it.lamp.always?1:nk)});}
    for(const l of (dr&&dr.lamps)||[]){const at=it.lampAt&&it.lampAt[l.id];if(!at||!(l.k>.01)||ln>=2)continue;ln++;
      F.lamps.push({p:plnMarkWorld(it,at[0],at[1],at[2]),r:l.r,c:l.c||(it.lamp&&it.lamp.c)||[1,1,1],k:l.k});}
    for(const q of it.blots){if(n>=64)break;const w=plnMarkWorld(it,q[0],0,q[1]);b.set([w[0],w[2],q[2],q[3]],4+n*4);n++;}
  }
  b[0]=n;
}
function plnMarksDrop(L){
  const Q=L.marks;
  if(!Q)return;
  for(const it of Q.items){plnGeoFree(it.geo);if(it.light)plnGeoFree(it.light);if(it.move)plnGeoFree(it.move);
    for(const pt of it.parts||[])plnGeoFree(pt.geo);plnInstFree(it.inst);}
  L.marks=null;
}
