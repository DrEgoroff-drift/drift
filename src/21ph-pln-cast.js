/* ══════════════ планета: человек и корабль — заготовки (M610) ══════════════
   Тела со стенда docs/look (M600), как были: человек 1.8 м в цвете людей и
   корабль на шасси, около пяти его ростов. Это заготовки первого этапа: свой
   проход по семьям тел — этап 2 (M620…), там же походка и корпус по hullOf.

   Сетки лежат в начале координат, ноги на нуле; в мир их ставит запись
   расстановки, так что шаг человека не стоит ни одной вершины. */
const PLN_CAST={gen:-1,man:null,ship:null,ring:null,manI:null,shipI:null,ringI:null,
  ma:new Float32Array(16),sa:new Float32Array(16),ra:new Float32Array(16),
  sink:.6,                              /* на сколько тело в воде сидит ниже, чем его держит игра, м */
  belt:1.0};                            /* высота круга над подошвой, м */

/* станции корпуса, сглаженные: Катмулл — Ром через заданные */
function plnCastResample(st,n){
  const out=[],keys=["x","ry","rz","y"];
  for(let i=0;i<n;i++){
    const u=i/(n-1)*(st.length-1),k=Math.min(Math.floor(u),st.length-2),t=u-k;
    const a=st[Math.max(k-1,0)],b=st[k],c=st[k+1],d=st[Math.min(k+2,st.length-1)],o={};
    for(const q of keys)o[q]=.5*((2*b[q])+(-a[q]+c[q])*t+(2*a[q]-5*b[q]+4*c[q]-d[q])*t*t+(-a[q]+3*b[q]-3*c[q]+d[q])*t*t*t);
    out.push(o);
  }
  return out;
}
/* корабль: полоса ливреи — того же цвета, что носит человек */
function plnCastShipMesh(){
  const m=plnMesh(16384),M=PLN_MAT.man;
  const hull=plnHex("#d9d5c8"),belly=plnHex("#34373e"),accent=plnHex("#ee7326"),glass=plnHex("#0d1820"),
    metal=plnHex("#7d828a"),dark=plnHex("#25272c");
  const st=plnCastResample([
    {x:-4.5,ry:.62,rz:.85,y:2.30},{x:-3.9,ry:.98,rz:1.25,y:2.25},{x:-2.0,ry:1.22,rz:1.55,y:2.20},{x:0,ry:1.28,rz:1.62,y:2.15},
    {x:1.9,ry:1.16,rz:1.48,y:2.12},{x:3.2,ry:.90,rz:1.15,y:2.16},{x:4.05,ry:.56,rz:.72,y:2.24},{x:4.5,ry:.16,rz:.22,y:2.30}],56);
  const zone=(t,s,p)=>{
    const x=p[0];
    if(s<-.42)return 0;
    if(x>2.3&&x<3.7&&s>.30&&s<.88)return 1;
    if(s>.02&&s<.2&&x>-3.9&&x<2.9)return 2;
    return 3;
  };
  plnLoft(m,{st,sides:64,mat:M,
    col:(t,s,p)=>{
      const z=zone(t,s,p);
      if(z===0)return belly;
      if(z===1)return glass;
      if(z===2)return accent;
      return plnMul(hull,Math.abs(((p[0]+9)%1.15)-.575)>.54?.78:1-.06*plnSmooth(.2,-.4,s));
    },
    x:(t,s,p)=>[.1,1,.3,.3][zone(t,s,p)]});
  for(const z of [-.62,.62])plnTube(m,{path:[[-4.2,2.26,z],[-4.8,2.26,z],[-5.35,2.26,z]],rad:t=>lerp(.36,.56,t),sides:14,
    col:t=>plnMix3(metal,dark,t),mat:M,x:.5});
  plnBlob(m,{c:[-3.1,3.72,0],r:[1.05,.8,.07],box:.5,sub:2,lean:-.38,col:u=>u[1]>.55?accent:hull,mat:M,x:.3});
  for(const z of [-1.95,1.95])plnBlob(m,{c:[-2.3,2.0,z],r:[1.15,.06,.75],box:.6,sub:2,yaw:z>0?.25:-.25,col:hull,mat:M,x:.3});
  const leg=(hip,foot)=>{
    const knee=[lerp(hip[0],foot[0],.45),lerp(hip[1],foot[1],.4)+.05,lerp(hip[2],foot[2],.7)];
    plnTube(m,{path:[hip,knee,foot],rad:t=>lerp(.11,.075,t),sides:8,col:metal,mat:M,x:.5});
    plnTube(m,{path:[[hip[0]-.7,hip[1]+.1,hip[2]*.8],knee],rad:.05,sides:6,col:dark,mat:M,x:.4});
    plnBlob(m,{c:[foot[0],foot[1]-.04,foot[2]],r:[.36,.07,.36],sub:1,col:dark,mat:M,x:.2});
  };
  leg([2.7,1.3,0],[3.2,.12,0]);leg([-2.3,1.4,-1.2],[-2.9,.12,-2.1]);leg([-2.3,1.4,1.2],[-2.9,.12,2.1]);
  /* люк на стороне, что смотрит на нас: воротник, тёмная рама, освещённый проём (к полу теплее и
     ярче, как в комнате) и трап */
  plnBlob(m,{c:[.75,2.0,-1.28],r:[.82,.92,.42],box:.35,sub:2,col:plnMul(hull,.8),mat:M,x:.3});
  plnCard(m,[.24,1.26,-1.712],[1.26,1.26,-1.712],[1.26,2.76,-1.712],[.24,2.76,-1.712],[0,0,-1],dark,M,null,0,.2);
  {
    const NX=6,NY=10,ids=[];
    for(let j=0;j<=NY;j++)for(let i=0;i<=NX;i++){
      const u=i/NX,v=j/NY,jamb=.62+.38*Math.sin(u*Math.PI),room=lerp(3.1,.95,Math.pow(v,.8));
      ids.push(plnVert(m,[lerp(.36,1.14,u),lerp(1.34,2.68,v),-1.722],[0,0,-1],[1,lerp(.54,.40,v),lerp(.22,.12,v)],PLN_MAT.glow,0,room*jamb,0));
    }
    for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){
      const a=j*(NX+1)+i;
      plnQuad(m,ids[a],ids[a+1],ids[a+NX+2],ids[a+NX+1]);
    }
  }
  plnBlob(m,{c:[.75,.68,-2.95],r:[.56,.05,1.45],box:.35,sub:2,pitch:-.45,col:metal,mat:M,x:.3});
  plnBlob(m,{c:[-3.55,4.5,0],r:[.07,.07,.07],sub:1,col:[1,.12,.08],mat:PLN_MAT.glow,glow:5});
  plnBlob(m,{c:[.9,3.5,0],r:[.5,.1,.5],sub:1,col:hull,mat:M,x:.3});
  plnTube(m,{path:[[.9,3.4,0],[.9,4.3,0]],rad:.025,sides:5,col:dark,mat:M});
  return m;
}
/* человек: скафандр в цвете людей, белые шлем и ранец, тёмное забрало, ноги в шаге.
   Оранжевый держится и на свету, и в тени — на траве, на воде и на небе */
function plnCastManMesh(){
  const m=plnMesh(8192),M=PLN_MAT.man;
  const suit=plnHex("#ee7326"),white=plnHex("#efe9dc"),joint=plnHex("#8a8f96"),glass=plnHex("#0e1a22"),dark=plnHex("#3a3d42");
  const limb=(path,r0,r1,col)=>plnTube(m,{path,rad:t=>lerp(r0,r1,t),sides:10,col,mat:M,x:.15,cap:true});
  const legCol=t=>t>.42&&t<.56?white:suit;
  limb([[0,.94,.1],[.17,.52,.1],[.30,.13,.1]],.115,.085,legCol);
  limb([[0,.94,-.1],[-.07,.50,-.1],[-.32,.17,-.1]],.115,.085,legCol);
  plnBlob(m,{c:[.35,.07,.1],r:[.16,.075,.095],sub:1,col:white,mat:M,x:.2});
  plnBlob(m,{c:[-.33,.12,-.1],r:[.16,.075,.095],sub:1,lean:-.5,col:white,mat:M,x:.2});
  plnBlob(m,{c:[.02,1.2,0],r:[.2,.33,.25],sub:2,lean:-.08,col:u=>u[1]<-.55?dark:suit,mat:M,x:.15});
  plnBlob(m,{c:[-.26,1.24,0],r:[.13,.29,.2],box:.45,sub:2,col:u=>u[1]>.25&&u[1]<.5?joint:white,mat:M,x:.25});
  plnTube(m,{path:[[-.3,1.5,.12],[-.31,1.95,.12]],rad:.012,sides:5,col:dark,mat:M});
  const vis=u=>u[0]>.25&&u[1]<.55&&u[1]>-.45;
  plnBlob(m,{c:[.04,1.64,0],r:[.175,.175,.175],sub:2,col:u=>vis(u)?glass:white,mat:M,x:u=>vis(u)?1:.3});
  plnBlob(m,{c:[.12,1.74,-.17],r:[.04,.04,.04],sub:1,col:joint,mat:M,x:.4});
  const armCol=t=>t>.5&&t<.62?white:suit;
  limb([[0,1.44,-.27],[-.12,1.16,-.3],[-.22,.93,-.27]],.082,.065,armCol);
  limb([[0,1.44,.27],[.14,1.17,.3],[.30,.98,.27]],.082,.065,armCol);
  plnBlob(m,{c:[-.24,.88,-.27],r:[.07,.075,.06],sub:1,col:white,mat:M,x:.2});
  plnBlob(m,{c:[.33,.94,.27],r:[.07,.075,.06],sub:1,col:white,mat:M,x:.2});
  return m;
}
/* спасательный круг: тор в цвете людей с белыми перехватами. Скафандр надувает его в воде,
   человек сидит в нём по пояс */
function plnCastRingMesh(){
  const m=plnMesh(1024),suit=plnHex("#ee7326"),white=plnHex("#efe9dc"),path=[],n=32;
  for(let k=0;k<=n;k++){const a=k/n*TAU;path.push([Math.cos(a)*.46,0,Math.sin(a)*.46]);}
  plnTube(m,{path,rad:.15,sides:10,up:[0,1,0],col:t=>((t*4+.11)%1)<.22?white:suit,mat:PLN_MAT.man,x:.2});
  return m;
}
/* сетки и записи этого поколения устройства */
function plnCast(){
  const Q=PLN_CAST;
  if(Q.gen===PLN_GPU.gen)return Q;
  Q.gen=PLN_GPU.gen;
  Q.man=plnGeo(plnCastManMesh());Q.ship=plnGeo(plnCastShipMesh());Q.ring=plnGeo(plnCastRingMesh());
  Q.manI=plnInst(Q.ma,0,1);Q.shipI=plnInst(Q.sa,0,1);Q.ringI=plnInst(Q.ra,0,1);
  return Q;
}
/* Ставит человека и корабль в кадр: тела, лампу люка и пятна тени под ними.
   man и ship — места в метрах, face — куда человек смотрит, swim — насколько надут круг (0…1) */
function plnCastFrame(F,man,face,ship,yaw,swim){
  const Q=plnCast(),B=PLN_KIND.body,c=Math.cos(yaw),s=Math.sin(yaw),lp=[.75,1.9,-2.4];
  plnRec(Q.ma,0,man,1,face<0?Math.PI:0,1,1);
  plnInstSet(Q.manI,Q.ma,1);
  plnRec(Q.sa,0,ship,1,yaw,1,2);
  plnInstSet(Q.shipI,Q.sa,1);
  F.batches.push({geo:Q.ship,inst:Q.shipI,kind:B,to:PLN_TO.all},{geo:Q.man,inst:Q.manI,kind:B,to:PLN_TO.all});
  if(swim>0){
    plnRec(Q.ra,0,[man[0],man[1]+Q.belt,man[2]],.3+.7*swim,0,1,3);
    plnInstSet(Q.ringI,Q.ra,1);
    F.batches.push({geo:Q.ring,inst:Q.ringI,kind:B,to:PLN_TO.all});
  }
  F.lamps.push({p:[ship[0]+lp[0]*c+lp[2]*s,ship[1]+lp[1],ship[2]-lp[0]*s+lp[2]*c],r:7.5,c:[1,.6,.28],k:2.6});
  const b=F.blobs;
  let n=b[0]|0;
  for(const q of [[ship[0],ship[2],5.2,.55],[man[0],man[2],.55,.5]])if(n<64){b.set(q,4+n*4);n++;}
  b[0]=n;
}
