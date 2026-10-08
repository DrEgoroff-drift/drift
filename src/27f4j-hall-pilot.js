/* ── M814 пилот зала — риг планеты (21pha) ──
   Пилот — сам игрок, и в зале он тот же человек, что на планете: скафандр «Орлан» рига 21pha с цветами комплекта
   (plnManPalette), а не человек 27f3 в куртке. Хозяин и толпа остаются людьми 27f3 — с лицами и без скафандров:
   так игрок узнаётся в любом месте зала с первого взгляда.
   Части рига собраны 21pha раз (plnManBuild) и переложены в сетку зала: кость — часть движка зала (13 ≤ R3_PART),
   оси рига (x вперёд, y вверх, z вбок) — в оси человека зала (вперёд — +z). Поза — свои углы по месту (риг плоский:
   шарниры только вперёд-назад), кости в мире — той же цепочкой, что у рига, матрицами частей; сетка не пересобирается.
   Факел ранца и бур в зале не нужны — их части пропущены. */
const HALL_RIG={mesh:null,key:""};
/* углы костей по месту (рад, вперёд — плюс): таз, корпус, голова, ближняя нога ×3, дальняя ×3, ближняя рука ×2, дальняя ×2 */
const HALL_RIG_POSE={
  stand: [0,.0,-.04, .07,-.10,.03, -.07,-.10,.07, .16,.45, .12,.40],
  hips:  [0,.02,-.02, .09,-.10,.02, -.09,-.10,.08, -.28,1.35, -.25,1.3],    /* руки за спиной: в плоском риге руки в боки не поставить */
  frame: [0,.03,.08, .05,-.08,.03, -.12,-.14,.09, 1.38,.3, .18,.5],         /* ближняя ладонь на раме окна, голова к стеклу */
  elbow: [0,.06,-.03, .12,-.12,.03, -.05,-.08,.05, .62,1.2, .25,.55],        /* предплечье на стойке */
  stool1:[0,-.12,.04, 1.42,-1.42,.02, 1.36,-1.32,0, -.6,.95, -.55,.9]};      /* на табурете спиной к стойке, локти на ней */
const HALL_RIG_SEAT={stool0:.8,stool1:.8,stool2:.8,stool3:.8};   /* таз на сиденье (27f3: pel .80) */

/* сетка рига в осях зала: собирается заново, только когда сменились вещи комплекта */
function hallRigMesh(){
  const P=plnManPalette(),key=JSON.stringify(P);
  if(HALL_RIG.mesh&&HALL_RIG.key===key)return HALL_RIG.mesh;
  r3Drop(HALL_RIG.mesh);
  const b=plnManBuild(P,false),K=r3Kit(),mats={};
  /* материал рига → материал зала: глянец по «запасу» вершины, свечение — своё, фонарь шлема тлеет вполсилы */
  const mt=(mat,g,x)=>{const k=mat+"|"+g.toFixed(2)+"|"+x.toFixed(2);
    return mats[k]||(mats[k]={c:[1,1,1],s:mat===PLN_MAT.glow?0:Math.min(.85,.15+x*.6),g:6+8*x,p:0,e:Math.min(g,.8),ns:false});};
  for(const q of b.parts){if(q.dyn==="flame"||q.dyn==="tool")continue;
    K.part=q.bone;const v=q.m.v,I=q.m.i;
    for(let k=0;k<q.m.ni;k++){const o=I[k]*PLN_VS;
      K.vx([-v[o+2],v[o+1],v[o]],[-v[o+5],v[o+4],v[o+3]],mt(v[o+9],v[o+11],v[o+12]),[v[o+6],v[o+7],v[o+8]]);}}
  K.part=0;HALL_RIG.mesh=K.pack();HALL_RIG.mesh.rig=1;HALL_RIG.key=key;
  return HALL_RIG.mesh;
}
/* кости в мире: B — место человека в зале; матрица кости — поворот вокруг оси x зала (оси z рига) и сдвиг */
function hallRigPose(M,base,B,kind,t){
  const A=(HALL_RIG_POSE[kind]||HALL_RIG_POSE.stand).slice(),br=Math.sin(t*1.5),seat=HALL_RIG_SEAT[kind],W=[];
  A[1]+=.012*br;A[2]+=.03*Math.sin(t*.19);
  for(let k=0;k<13;k++){const Bn=PLN_MAN_BONES[k],o=Bn.o,P=Bn.p<0?null:W[Bn.p],w={};
    if(P){w.a=P.a+A[k];w.x=P.x+P.c*o[0]-P.s*o[1];w.y=P.y+P.s*o[0]+P.c*o[1];w.z=P.z+o[2];}
    else{w.a=A[k];w.x=o[0];w.y=seat!=null?seat:o[1]+.004*br;w.z=o[2];}
    w.c=Math.cos(w.a);w.s=Math.sin(w.a);W[k]=w;
    M.set(r3Mul(B,[1,0,0,0, 0,w.c,-w.s,0, 0,w.s,w.c,0, -w.z,w.y,w.x,1]),(base+k)*16);}
  return W;
}
function hallRigDrop(){r3Drop(HALL_RIG.mesh);HALL_RIG.mesh=null;HALL_RIG.key="";}
