/* ══════════════ планета: человек — риг (M620) ══════════════
   Замысел (docs/DESIGN-planet.md §2 «Moves», §8.6): человек — мерило кадра и его
   герой. Издали он — оранжевое пятно людей с белым шлемом и белым ранцем; вблизи
   на нём читаются шесть гнёзд комплекта (12x-suit): шлем, корпус, перчатки,
   ботинки, ранец, фонарь. Силуэт — полужёсткий скафандр «Орлан»: шлем-пузырь,
   вросший в бочку корпуса (шеи нет), короткие плотные ноги, большие ботинки,
   ранец-дверь за спиной. Из трёх силуэтов (тонкая фигура Ланы, водолаз с куполом,
   «Орлан») взят третий: только он читается скафандром в 38 px и носит гнёзда.

   Цвет: тело — оранжевый людей, всегда (§8.6, решено 02.10); цвета комплекта
   (семейство и износ, kitColOf) красят МЕТКИ гнёзд, а не тело: скорлупу и ободок
   шлема, нагрудник и пояс, перчатки, ботинки, баллоны ранца, корпус фонаря.
   Косметика «Сороки» приходит той же палитрой.

   Риг: плоский скелет в плоскости кадра (вид сбоку: x вперёд, y вверх, z вглубь),
   шарниры вращаются вокруг z. Части собраны раз в системах своих костей, а поза
   собирается каждый кадр на процессоре (≈2.5 тыс. вершин) и льётся в один буфер:
   походка, прыжок, факел и круг не стоят ни пайплайна, ни записи сверх одной.
   В другую сторону его поворачивает запись (yaw π). Состояния — из G.surf как
   есть: walkPhase/walkAmp — шаг, on/vy — воздух, jetOn — факел ранца, swim — в
   круге; фонарь — по lampK кадра (21pz). Сетки лежат в начале координат, ноги на
   нуле; в мир человека ставит запись. */
const PLN_MAN={gen:-1,geo:null,inst:null,a:new Float32Array(16),
  parts:null,V:null,nv:0,ni:0,ib:null,
  key:"",                              /* палитра и заряд, под которые собраны части */
  k:{air:0,jet:0,fall:0,drill:0},      /* сглаженные доли поз: воздух, факел, падение, бур в руках */
  W:[],                                /* кости в мире на этот кадр */
  lamp:[0,0,0],jet:[0,0,0]};           /* где фонарь и сопло ранца в мире (для ламп кадра) */
/* кости: родитель и место в системе родителя (м). 0 таз, 1 корпус, 2 голова,
   3–5 ближняя нога (бедро, голень, стопа), 6–8 дальняя, 9–10 ближняя рука
   (плечо, предплечье), 11–12 дальняя */
const PLN_MAN_BONES=[
  {p:-1,o:[0,.87,0]},{p:0,o:[0,0,0]},{p:1,o:[0,.50,0]},
  {p:0,o:[0,-.02,-.11]},{p:3,o:[0,-.40,0]},{p:4,o:[0,-.36,0]},
  {p:0,o:[0,-.02,.11]},{p:6,o:[0,-.40,0]},{p:7,o:[0,-.36,0]},
  {p:1,o:[0,.40,-.30]},{p:9,o:[0,-.28,0]},
  {p:1,o:[0,.40,.30]},{p:11,o:[0,-.28,0]}];
/* позы без шага: углы по костям (рад, вперёд — плюс) */
const PLN_MAN_POSE={
  air: [0,-.10,.06, .45,-.95,.25, -.15,-.60,.15, .9,.5, .4,.4],
  jet: [0,.12,.10, -.20,-.80,.10, -.35,-.80,.10, .55,.4, .35,.35],
  fall:[0,-.15,-.15, .35,-.50,.10, -.30,-.30,.05, 1.6,.3, 1.3,.3],
  swim:[0,-.05,-.06, .60,-1.1,.20, .40,-.90,.20, .6,.9, .5,.8],
  /* бурение (M624): стойка — ноги врозь, корпус вперёд, обе руки держат бур перед собой */
  drill:[0,.20,.26, -.28,.22,.05, .30,-.30,0, 1.10,-.20, 1.00,-.28]};
const PLN_MAN_FLAME={rings:7,sides:8};

/* цвет комплекта: «#rrggbb» или «rgb(r,g,b)» (mixHex) → линейный */
function plnManCss(s){
  if(!s)return [.5,.5,.5];
  if(s[0]==="#")return plnHex(s);
  const m=/(\d+)\D+(\d+)\D+(\d+)/.exec(s);
  if(!m)return [.5,.5,.5];
  const f=v=>Math.pow(+v/255,2.2);
  return [f(m[1]),f(m[2]),f(m[3])];
}
/* палитра шести гнёзд: из комплекта, если он есть, иначе выдача (семейство I) */
function plnManPalette(){
  let P=null;
  try{if(typeof kitPalette==="function")P=kitPalette();}catch(e){P=null;}
  const out={},df={main:"#b9c2c9",dark:"#7d8793",acc:"#f2b25c"};
  for(const p of ["helmet","torso","gloves","boots","pack","lamp"]){
    const s=(P&&P[p])||df;
    out[p]={main:plnManCss(s.main),dark:plnManCss(s.dark),acc:plnManCss(s.acc)};
  }
  let vis=null;
  try{if(typeof cosmVisor==="function")vis=cosmVisor();}catch(e){vis=null;}
  out.visor=vis?[Math.pow(vis[0]/255,2.2),Math.pow(vis[1]/255,2.2),Math.pow(vis[2]/255,2.2)]:null;
  return out;
}

/* части рига: сетка в системе своей кости. dyn — что переписать в вершинах по состоянию
   кадра: материал и свечение (линза фонаря горит только ночью, факел — только с тягой) */
function plnManBuild(P,low){
  const M=PLN_MAT.man,parts=[],white=plnHex("#efe9dc");
  const suit=plnHex("#ee7326"),suitD=plnHex("#c4581c"),joint=plnHex("#8a8f96"),glass=plnHex("#0e1a22"),dark=plnHex("#3a3d42");
  const lit=c=>plnMix3(c,white,.45);
  const part=(bone,fn,dyn)=>{const m=plnMesh(1024);fn(m);parts.push({bone,m:plnMeshDone(m),dyn:dyn||null});};
  const ring=(m,y0,y1,r,col,x,c)=>plnTube(m,{path:[[c?c[0]:0,y0,c?c[1]:0],[c?c[0]:0,y1,c?c[1]:0]],rad:r,sides:10,col,mat:M,x:x||.2,cap:true});
  const belt=(m,y,r,rt,col,x)=>{const path=[];for(let k=0;k<=24;k++){const a=k/24*TAU;path.push([Math.cos(a)*r,y,Math.sin(a)*r*.86]);}
    plnTube(m,{path,rad:rt,sides:8,up:[0,1,0],col,mat:M,x:x||.25});};
  /* таз: низ скафандра, пояс с пряжкой (корпус) */
  part(0,m=>{
    plnBlob(m,{c:[0,0,0],r:[.20,.14,.17],box:.7,sub:2,col:u=>u[1]<-.5?suitD:suit,mat:M,x:.12});
    belt(m,.06,.21,.026,P.torso.dark,.3);
    plnBlob(m,{c:[.20,.06,0],r:[.032,.032,.024],sub:1,box:.5,col:P.torso.acc,mat:M,x:.5});
  });
  /* корпус: жёсткая бочка, воротник, нагрудник (корпус), ранец с баллонами и вентилем (ранец),
     лямки, антенна */
  part(1,m=>{
    plnBlob(m,{c:[0,.30,0],r:[.24,.29,.21],box:.5,sub:2,col:u=>u[1]<-.6?suitD:suit,mat:M,x:.3});
    belt(m,.55,.16,.035,joint,.35);
    plnBlob(m,{c:[.22,.32,0],r:[.05,.09,.08],box:.4,sub:2,col:P.torso.main,mat:M,x:.35});
    plnBlob(m,{c:[-.31,.28,0],r:[.14,.26,.19],box:.45,sub:2,col:u=>u[0]<-.6?P.pack.dark:lit(P.pack.main),mat:M,x:.25});
    for(const z of [-.09,.09])plnTube(m,{path:[[-.46,.04,z],[-.46,.52,z]],rad:.062,sides:10,col:P.pack.dark,mat:M,x:.45,cap:true});
    plnBlob(m,{c:[-.46,.57,0],r:[.034,.028,.034],sub:1,col:P.pack.acc,mat:M,x:.5});
    for(const z of [-.17,.17])plnTube(m,{path:[[-.26,.50,z],[0,.56,z*1.1],[.21,.42,z*.9]],rad:.018,sides:6,col:dark,mat:M,x:.15});
    plnTube(m,{path:[[-.39,.54,.11],[-.405,.90,.11]],rad:.008,sides:5,col:dark,mat:M,x:.3});
  });
  /* огонёк антенны дышит (закон 6) */
  part(1,m=>plnBlob(m,{c:[-.405,.915,.11],r:[.014,.014,.014],sub:1,col:[.5,.9,.85],mat:PLN_MAT.glow,glow:1}),
    st=>({glow:.35+.35*Math.sin(st.t*.03)}));
  /* индикатор нагрудника: бирюза, красный при малом заряде */
  part(1,m=>plnBlob(m,{c:[.272,.35,0],r:[.008,.014,.014],sub:1,col:low?[1,.25,.18]:[.45,.9,.85],mat:PLN_MAT.glow,glow:1.4}));
  /* голова: шлем (шлем) с забралом и ободком, наушники, фонарь (фонарь) с линзой */
  part(2,m=>{
    const shell=lit(P.helmet.main),band=P.helmet.acc,vis=u=>u[0]>.14&&u[1]<.46&&u[1]>-.50,rim=u=>u[0]>.05&&u[1]<.54&&u[1]>-.58;
    plnBlob(m,{c:[0,.19,0],r:[.235,.235,.235],sub:3,col:u=>vis(u)?glass:(rim(u)?band:shell),mat:M,x:u=>vis(u)?1:(rim(u)?.4:.35)});
    for(const z of [-.225,.225])plnBlob(m,{c:[-.03,.16,z],r:[.06,.06,.032],sub:1,col:P.helmet.dark,mat:M,x:.35});
    plnTube(m,{path:[[-.02,.37,0],[.21,.40,0]],rad:.056,sides:10,col:P.lamp.dark,mat:M,x:.45,cap:true});
    plnTube(m,{path:[[.04,.445,0],[.16,.455,0]],rad:.016,sides:5,col:P.lamp.acc,mat:M,x:.3});
    /* блик забрала: одна жёсткая дуга по верхней кромке стекла (M232) */
    plnBlob(m,{c:[.165,.32,-.075],r:[.03,.016,.012],sub:1,lean:-.5,col:[1,1,1],mat:PLN_MAT.glow,glow:1.1});
  });
  part(2,m=>plnBlob(m,{c:[.222,.40,0],r:[.016,.046,.046],sub:1,col:[1,.86,.62],mat:PLN_MAT.glow,glow:1}),
    st=>({mat:st.lamp>.02?PLN_MAT.glow:PLN_MAT.man,glow:6*st.lamp,x:1}));
  /* ноги: бедро, колено-гофра, голень, ботинок с подошвой и манжетой (ботинки) */
  for(const [th,sh,ft] of [[3,4,5],[6,7,8]]){
    part(th,m=>plnTube(m,{path:[[0,.02,0],[0,-.20,0],[0,-.40,0]],rad:t=>lerp(.13,.105,t),sides:10,col:suit,mat:M,x:.12,cap:true}));
    part(sh,m=>{
      ring(m,.05,-.05,.115,joint,.3);
      plnTube(m,{path:[[0,-.04,0],[0,-.36,0]],rad:t=>lerp(.105,.088,t),sides:10,col:suit,mat:M,x:.12,cap:true});
    });
    part(ft,m=>{
      ring(m,.035,-.035,.10,P.boots.dark,.3);
      plnBlob(m,{c:[.07,-.05,0],r:[.17,.07,.09],box:.5,sub:2,col:P.boots.main,mat:M,x:.3});
      plnBlob(m,{c:[.075,-.092,0],r:[.18,.025,.095],box:.35,sub:1,col:P.boots.dark,mat:M,x:.15});
    });
  }
  /* руки: плечо, локоть-гофра, предплечье, манжета и перчатка (перчатки) */
  for(const [up,fo] of [[9,10],[11,12]]){
    part(up,m=>{
      plnBlob(m,{c:[0,.01,0],r:[.115,.10,.10],box:.8,sub:1,col:suit,mat:M,x:.2});
      plnTube(m,{path:[[0,0,0],[0,-.28,0]],rad:t=>lerp(.095,.078,t),sides:9,col:suit,mat:M,x:.12,cap:true});
    });
    part(fo,m=>{
      ring(m,.04,-.04,.088,joint,.3);
      plnTube(m,{path:[[0,-.03,0],[0,-.26,0]],rad:t=>lerp(.078,.064,t),sides:9,col:suit,mat:M,x:.12,cap:true});
      ring(m,-.23,-.275,.08,P.gloves.acc,.3);
      plnBlob(m,{c:[.01,-.315,0],r:[.07,.085,.06],sub:1,lean:.25,col:P.gloves.main,mat:M,x:.2});
    });
  }
  /* бур в ближней руке (21pic): без работы сжат в перчатку, пишется по кадру */
  part(10,m=>plnDrillTool(m,P),"tool");
  /* факел ранца: кольца конуса пишутся по кадру (plnManFlame); без тяги он сжат в точку */
  part(1,m=>{
    const R=PLN_MAN_FLAME.rings,S=PLN_MAN_FLAME.sides,ids=[];
    for(let k=0;k<=R;k++)for(let s=0;s<S;s++)ids.push(plnVert(m,[-.31,.0,0],[0,-1,0],[1,.6,.2],PLN_MAT.glow,0,0,0));
    for(let k=0;k<R;k++)for(let s=0;s<S;s++){const s2=(s+1)%S;plnQuad(m,ids[k*S+s],ids[k*S+s2],ids[(k+1)*S+s2],ids[(k+1)*S+s]);}
  },"flame");
  /* один буфер: вершины подряд, указатели со смещением */
  let nv=0,ni=0;
  for(const q of parts){q.off=nv;nv+=q.m.nv;ni+=q.m.ni;}
  const V=new Float32Array(nv*PLN_VS),I=new Uint32Array(ni);
  let o=0;
  for(const q of parts){V.set(q.m.v,q.off*PLN_VS);for(let k=0;k<q.m.ni;k++)I[o++]=q.m.i[k]+q.off;}
  return {parts,V,nv,ni,I};
}

/* поза: углы костей по состоянию, затем кости в мире (c, s, x, y, z, a) */
function plnManPose(st){
  const Q=PLN_MAN,K=Q.k,PS=PLN_MAN_POSE;
  K.air+=((st.on?0:1)-K.air)*.2;
  K.jet+=((st.jet?1:0)-K.jet)*.25;
  K.fall+=(((!st.on&&!st.jet&&st.vy>.4)?1:0)-K.fall)*.15;
  K.drill+=((st.drill?1:0)-K.drill)*.2;
  const sw=st.swim,a=st.amp*(1-K.air)*(1-sw),ph=st.phase,t=st.t,sN=Math.sin(ph),sF=-sN,breath=Math.sin(t*.026);
  const kneeW=p=>Math.pow(Math.max(0,Math.sin(p+1.77)),1.2),toe=p=>Math.max(0,-Math.sin(p+.3)),heel=p=>Math.max(0,Math.sin(p-.3));
  const A=[0,a*.10+.015*breath,-.04+a*.04*Math.cos(2*ph)+.01*breath,
    a*.52*sN+.07*(1-a),-(.10+a*kneeW(ph)),0, a*.52*sF-.07*(1-a),-(.10+a*kneeW(ph+Math.PI)),0,
    .16-a*.50*sN,.45+a*.25*Math.max(0,-sN), .12+a*.50*sN,.40+a*.25*Math.max(0,sN)];
  A[5]=-(A[3]+A[4])*.75-a*.7*toe(ph)+a*.2*heel(ph);
  A[8]=-(A[6]+A[7])*.75-a*.7*toe(ph+Math.PI)+a*.2*heel(ph+Math.PI);
  for(let i=0;i<13;i++){
    let v=lerp(A[i],PS.air[i],K.air);
    v=lerp(v,PS.jet[i],K.jet);v=lerp(v,PS.fall[i],K.fall);v=lerp(v,PS.swim[i],sw);v=lerp(v,PS.drill[i],K.drill*(1-K.air));
    A[i]=v;
  }
  /* бур в руках дрожит: плечи и чуть корпус (M624) */
  if(K.drill>.02){const vb=K.drill*.022*Math.sin(t*2.7);A[9]+=vb;A[11]+=vb*.9;A[1]+=vb*.25;}
  const bob=a*.028*Math.cos(2*ph)+(1-a)*.006*breath,W=Q.W;
  for(let k=0;k<13;k++){
    const B=PLN_MAN_BONES[k],o=B.o,P=B.p<0?null:W[B.p],w=W[k]||(W[k]={c:1,s:0,x:0,y:0,z:0,a:0});
    if(P){w.a=P.a+A[k];w.x=P.x+P.c*o[0]-P.s*o[1];w.y=P.y+P.s*o[0]+P.c*o[1];w.z=P.z+o[2];}
    else{w.a=A[k];w.x=o[0];w.y=o[1]+bob;w.z=o[2];}
    w.c=Math.cos(w.a);w.s=Math.sin(w.a);
  }
  return W;
}
/* факел: конус колец под ранцем, по тяге; пишет место, нормаль, цвет и свечение — в системе
   корпуса, w ставит их в мир рига */
function plnManFlame(st,V,off,w){
  const R=PLN_MAN_FLAME.rings,S=PLN_MAN_FLAME.sides,k=PLN_MAN.k.jet,t=st.t;
  const fl=1+.18*Math.sin(t*1.7)+.1*Math.sin(t*2.9+1),len=.95*k*fl;
  let o=off*PLN_VS;
  for(let r=0;r<=R;r++){
    const u=r/R,rad=.13*Math.pow(1-u,.6)*Math.min(1,u*8+.15)*k*(1+.1*Math.sin(t*3.3+r)),y=.0-u*len,x=-.31-u*.14*k;
    const warm=u<.3?[1,.95,.72]:(u<.65?[1,.62,.22]:[1,.32,.12]),g=k*(u<.3?7:(u<.65?3.5:1.2))*(1-u*.7);
    for(let s=0;s<S;s++){
      const an=s/S*TAU,cx=Math.cos(an),sz=Math.sin(an),lx=x+cx*rad,ly=y;
      V[o]=w.c*lx-w.s*ly+w.x;V[o+1]=w.s*lx+w.c*ly+w.y;V[o+2]=sz*rad+w.z;V[o+3]=cx*.7;V[o+4]=-.5;V[o+5]=sz*.7;
      V[o+6]=warm[0];V[o+7]=warm[1];V[o+8]=warm[2];V[o+9]=PLN_MAT.glow;V[o+11]=g;V[o+12]=0;
      o+=PLN_VS;
    }
  }
}
/* сетка и запись этого поколения устройства; части собираются заново, когда сменились
   вещи комплекта или заряд */
function plnMan(st){
  const Q=PLN_MAN,P=plnManPalette(),low=!!st.low;
  const key=JSON.stringify(P)+(low?"L":"");
  if(key!==Q.key||!Q.parts){
    const b=plnManBuild(P,low);
    Q.parts=b.parts;Q.V=b.V;Q.nv=b.nv;Q.ni=b.ni;Q.ib=b.I;Q.key=key;
    if(Q.gen===PLN_GPU.gen){plnGeoFree(Q.geo);Q.geo=plnGeo({v:Q.V,i:Q.ib,nv:Q.nv,ni:Q.ni});}
  }
  if(Q.gen!==PLN_GPU.gen){
    Q.gen=PLN_GPU.gen;
    Q.geo=plnGeo({v:Q.V,i:Q.ib,nv:Q.nv,ni:Q.ni});Q.inst=plnInst(Q.a,0,1);
  }
  return Q;
}
function plnManState(S,lampK,swim){
  return {phase:S?S.walkPhase||0:0,amp:S?clamp(S.walkAmp||0,0,1):0,on:S?S.on!==false:true,jet:!!(S&&S.jetOn),
    vy:S?S.vy||0:0,swim:clamp(swim||0,0,1),t:G.t||0,lamp:lampK||0,drill:!!(S&&S.mining),low:!!(S&&S.suit!=null&&S.suit<25)};
}
/* Ставит человека в кадр: поза по состоянию, вершины в буфер, запись, лампы фонаря и факела.
   pos — место ног в метрах, face — куда смотрит, swim — насколько он в круге, o — {S, lamp} */
function plnManFrame(F,pos,face,swim,o){
  const st=plnManState(o&&o.S,o&&o.lamp,swim),Q=plnMan(st),W=plnManPose(st),V=Q.V;
  PLN_DRILL.on=st.drill?1:0;
  for(const q of Q.parts){
    const w=W[q.bone],c=w.c,s=w.s,src=q.m.v,n=q.m.nv;
    if(q.dyn==="flame"){plnManFlame(st,V,q.off,w);}
    else if(q.dyn==="tool"){plnDrillWrite(st,V,q.off,w,q.m);}
    else{
      let d=q.dyn?q.dyn(st):null,o2=q.off*PLN_VS;
      for(let k=0;k<n;k++){
        const i=k*PLN_VS,px=src[i],py=src[i+1],nx=src[i+3],ny=src[i+4];
        V[o2]=c*px-s*py+w.x;V[o2+1]=s*px+c*py+w.y;V[o2+2]=src[i+2]+w.z;
        V[o2+3]=c*nx-s*ny;V[o2+4]=s*nx+c*ny;
        if(d){if(d.mat!=null)V[o2+9]=d.mat;if(d.glow!=null)V[o2+11]=d.glow;if(d.x!=null)V[o2+12]=d.x;}
        o2+=PLN_VS;
      }
    }
  }
  /* в поле факела и фонарь, и сопло — в мире, с учётом стороны взгляда */
  const fx=face<0?-1:1,at=(w,lx,ly,lz)=>[pos[0]+fx*(w.c*lx-w.s*ly+w.x),pos[1]+(w.s*lx+w.c*ly+w.y),pos[2]+fx*(lz+w.z)];
  Q.lamp=at(W[2],.222,.40,0);Q.jet=at(W[1],-.31,.0,0);
  PLN_DRILL.tip=at(W[10],0,-.30-PLN_DRILL.len*Q.k.drill,0);   /* остриё коронки — для луча (21pic) */
  GPU.dev.queue.writeBuffer(Q.geo.vb,0,V,0,Q.nv*PLN_VS);
  plnRec(Q.a,0,pos,1,fx<0?Math.PI:0,1,1);
  plnInstSet(Q.inst,Q.a,1);
  F.batches.push({geo:Q.geo,inst:Q.inst,kind:PLN_KIND.body,to:PLN_TO.all});
  /* налобник светит вперёд по взгляду на землю перед человеком (ночью и в тени затмения) */
  if(st.lamp>.02)F.lamps.push({p:[Q.lamp[0]+fx*1.0,Q.lamp[1]-.35,Q.lamp[2]-.3],r:8,c:[1,.86,.62],k:2.4*st.lamp});
  /* факел ранца освещает землю под ним */
  if(Q.k.jet>.03)F.lamps.push({p:[Q.jet[0],Q.jet[1]-.35,Q.jet[2]],r:5.5,c:[1,.58,.26],k:2.2*Q.k.jet});
}
