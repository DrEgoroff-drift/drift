/* ══════════════ планета: бур в руках — инструмент, луч, крошка у забоя (M624) ══════════════
   Добыча в старом кадре была ниточкой от человека к залежи и полоской над ней. Здесь это
   работа: человек встаёт в стойку (поза drill, 21pha), в руках у него бур — тело на кости
   предплечья, без работы сжатое в перчатку, как факел без тяги; от коронки к забою идёт
   луч — тело из света; у забоя летит крошка цвета руды и горит тёплая лампа, так что залежь
   и земля под ней освещены самой работой. Полоса добычи остаётся подписью (21pj): она
   прибор, а не вещь. */
const PLN_DRILL={len:.50,                 /* от перчатки до острия коронки, м */
  chips:16,                               /* крошек у забоя */
  geo:null,inst:null,a:new Float32Array(16),m:null,gen:-1,
  tip:[0,0,0],on:0};                      /* остриё в мире и доля работы на этот кадр */
/* бур в системе предплечья: рукоять в перчатке (y −.30), ствол с кольцом цвета перчаток,
   короб привода сбоку, нос, коронка, огонёк острия. Строится один раз частью рига (21pha),
   по кадру переписывается plnDrillWrite */
function plnDrillTool(m,P){
  const M=PLN_MAT.man,dark=plnHex("#3a3d42"),steel=plnHex("#9aa3ad"),acc=P.gloves.acc,y0=-.30,L=PLN_DRILL.len;
  plnTube(m,{path:[[0,y0+.02,0],[0,y0-.07,0]],rad:.045,sides:10,col:dark,mat:M,x:.3,cap:true});
  plnTube(m,{path:[[0,y0-.08,0],[0,y0-.26,0],[0,y0-.30,0]],rad:t=>t<.9?.072:.05,sides:10,col:t=>t>.45&&t<.6?acc:dark,mat:M,x:.35,cap:true});
  plnTube(m,{path:[[0,y0-.30,0],[0,y0-.38,0]],rad:t=>lerp(.05,.028,t),sides:8,col:steel,mat:M,x:.5,cap:true});
  plnTube(m,{path:[[0,y0-.38,0],[0,y0-L+.02,0]],rad:t=>.017*(1-t*.5),sides:6,col:steel,mat:M,x:.6});
  plnBlob(m,{c:[.07,y0-.14,.05],r:[.03,.045,.03],sub:1,col:dark,mat:M,x:.2});
  plnBlob(m,{c:[0,y0-L+.01,0],r:[.022,.03,.022],sub:1,col:[1,.9,.75],mat:PLN_MAT.glow,glow:0});
}
/* по кадру: вершины бура в буфер рига, сжатые к перчатке долей k (без работы — в точку);
   огонёк острия горит по работе. w — кость предплечья в мире, off — смещение части, src — её сетка */
function plnDrillWrite(st,V,off,w,src){
  const k=PLN_MAN.k.drill,v=src.v,n=src.nv,c=w.c,s=w.s,py0=-.30,Gm=PLN_MAT.glow;
  let o=off*PLN_VS;
  for(let i=0;i<n;i++){
    const q=i*PLN_VS,px=v[q]*k,py=py0+(v[q+1]-py0)*k,pz=v[q+2]*k,nx=v[q+3],ny=v[q+4];
    V[o]=c*px-s*py+w.x;V[o+1]=s*px+c*py+w.y;V[o+2]=pz+w.z;
    V[o+3]=c*nx-s*ny;V[o+4]=s*nx+c*ny;V[o+5]=v[q+5];
    V[o+6]=v[q+6];V[o+7]=v[q+7];V[o+8]=v[q+8];V[o+9]=v[q+9];V[o+10]=0;
    V[o+11]=v[q+9]===Gm?2.5*PLN_DRILL.on:0;V[o+12]=v[q+12];
    o+=PLN_VS;
  }
}
/* луч и крошка по кадру: от острия к забою залежи, которую бурит игра (S.mining). Своя сетка
   постоянной топологии — трубка луча и крошки, — переписываются только вершины */
function plnDrillFrame(F,S,L){
  const Q=PLN_DRILL,d=S.mining;
  if(!d||!(d.left>0)||!Q.on)return;
  const k=clamp(.45+Math.min(1,(d.left||1)/9)*.55,0,1),dx=d.x/PLN_M,dz=plnThingDepZ(d),gy=plnLandRibAt(L,dx,dz);
  const tip=Q.tip,toMan=plnNorm([tip[0]-dx,0,tip[2]-dz]);
  const bite=[dx+toMan[0]*.6*k,gy+.17+.36*k,dz+toMan[2]*.6*k];
  const ore=plnHex((RES[d.res]||RES.iron).col),hot=plnMix3(ore,[1,1,1],.7),t=G.t||0;
  if(Q.gen!==PLN_GPU.gen||!Q.m){Q.m=plnMesh(512);Q.gen=PLN_GPU.gen;Q.geo=null;}
  const m=Q.m;m.nv=0;m.ni=0;
  /* луч: трубка с лёгким провисом, радиус дышит */
  const mid=[(tip[0]+bite[0])/2,(tip[1]+bite[1])/2-.02,(tip[2]+bite[2])/2],pul=.036+.012*Math.sin(t*.9);
  plnTube(m,{path:[tip,mid,bite],rad:u=>pul*(1.1-.3*u),sides:6,col:u=>plnMix3(hot,ore,u*.4),mat:PLN_MAT.glow,glow:5});
  /* вспышка у забоя */
  plnBlob(m,{c:bite,r:[.09,.07,.09],sub:0,col:hot,mat:PLN_MAT.glow,glow:5+Math.sin(t*1.7)});
  /* крошка: летит от забоя к человеку и вверх, по возрасту гаснет; у каждой свой круг */
  for(let i=0;i<Q.chips;i++){
    const h=hashi(i,7,0xC4),u=(t*.03+i*.137+(h&255)/255)%1,a=-1.1+((h>>>8)&255)/255*2.2,sp=.35+((h>>>16)&255)/255*.4;
    const ca=Math.cos(a),sa=Math.sin(a),dir=[toMan[0]*ca+toMan[2]*sa,0,toMan[2]*ca-toMan[0]*sa];
    const p=[bite[0]+dir[0]*sp*u*1.5,bite[1]+(1.3*u-1.5*u*u)*sp*2.4,bite[2]+dir[2]*sp*u*1.5],r=.035+.03*(1-u);
    plnBlob(m,{c:p,r:[r,r*.8,r],sub:0,col:plnMix3(hot,ore,u*.7),mat:PLN_MAT.glow,glow:5.5*(1-u*.7)});
  }
  if(!Q.geo){Q.geo=plnGeo(m);Q.inst=plnInst(Q.a,0,1);}
  else GPU.dev.queue.writeBuffer(Q.geo.vb,0,m.v,0,m.nv*PLN_VS);
  plnRec(Q.a,0,[0,0,0],1,0,1,1);plnInstSet(Q.inst,Q.a,1);
  F.batches.push({geo:Q.geo,inst:Q.inst,kind:PLN_KIND.body,to:PLN_TO.lit});
  F.lamps.push({p:[bite[0],bite[1]+.15,bite[2]],r:3.4,c:[hot[0],hot[1],hot[2]],k:2+.4*Math.sin(t*1.3)});
}
