/* ══════════════ планета: мат свидетеля — телами (plnOverOld, 22.10) ══════════════
   Мат «подглядывания» (20c, peepDrawMat) — луг на линии ходьбы, где в затмение проходит память места.
   Правила 20c те же, только телом на земле движка:

   1. Пластинки лежат внахлёст в три яруса (ковру нужна толщина), к краям мата луг редеет.
      Цвет — трава, замешанная на породе планеты (pal[2]), кромка светлее.
   2. Стебли растут пучками по 2–4, а не поштучно: одиночные торчали булавками.
   3. В темноте (затмение, dk > .22) мат отдаёт холодный свет памяти (PEEP_LIT) целиком — светятся сами
      пластинки и бусины, а не воздух над лугом: второй слой тех же пластинок свечением поверх.
   Части по ~4 м вдоль хода, у каждой свой якорь — движок отбирает записи по месту. */
const PEEP3={it:null,gen:-1,L:null,key:""};
const PEEP3_SEG=4;   /* длина части, м */

function plnPeepMesh(L,P,p){
  const M=PLN_M,cx=P.x/M,R=P.r/M,r=rng(hashi(Math.round(P.x),0x11A7,5)),pal=p.T.pal,
    base=plnMul(plnRgb(mixc([104,120,108],pal[2],.4)),.72),lip=plnRgb(mixc([188,204,186],pal[1],.25)),
    bead=plnRgb(mixc(mixc([104,120,108],pal[2],.4),PEEP_LIT,.2)),lit=plnRgb(PEEP_LIT),MAN=PLN_MAT.man,parts=[];
  const n=Math.ceil(2*R/PEEP3_SEG);
  for(let s=0;s<n;s++){
    const x0=cx-R+s*PEEP3_SEG,x1=Math.min(cx+R,x0+PEEP3_SEG),xm=(x0+x1)/2,o=[xm,plnLandRibAt(L,xm,.6),.6],
      m=plnMesh(1<<14),gm=plnMesh(1<<14);
    const gy=(x,z)=>plnLandRibAt(L,x,z)-o[1];
    /* пластинка: трапеция почти плашмя, задний край приподнят; свечение — та же пластинка на 6 мм выше */
    const plate=(x,z,w,h,y0,col,yaw)=>{
      const c=Math.cos(yaw),sn=Math.sin(yaw),q=(u,v,up)=>[x-o[0]+u*c+v*sn,y0+up,z-o[2]+v*c-u*sn];
      const A=q(-w,-h*.5,0),B=q(w,-h*.5,0),C2=q(w*.55,h*.5,h*.45),D=q(-w*.55,h*.5,h*.45);
      plnCard(m,A,B,C2,D,[0,1,0],col,MAN,null,0,0);
      const e=.006;plnCard(gm,[A[0],A[1]+e,A[2]],[B[0],B[1]+e,B[2]],[C2[0],C2[1]+e,C2[2]],[D[0],D[1]+e,D[2]],[0,1,0],plnMix3(lit,col,.5),PLN_MAT.glow,null,1.1,0);
    };
    for(let x=x0;x<x1;x+=.09){
      const t=(x-cx)/R,d=1-t*t;
      if(r()>d*.95)continue;
      for(let zz=-1.4;zz<2.8;zz+=.36+r()*.24){
        const z=zz+(r()-.5)*.3,tier=1+Math.floor(r()*3),g0=gy(x,z);
        for(let k=0;k<tier;k++){
          const w=.06+r()*.08,h=.08+r()*.09,col=plnMix3(base,lip,k*.07+r()*.06);
          plate(x+(r()-.5)*.2,z+(r()-.5)*.2,w,h,g0+.02+k*.045+r()*.02,col,(r()-.5)*.9);
        }
      }
      /* пучок стеблей с бусинами */
      if(r()<.05){
        const k=2+Math.floor(r()*3),z=(r()-.3)*2,g0=gy(x,z);
        for(let j=0;j<k;j++){
          const sx=x+(j-k/2)*.09+(r()-.5)*.08,sz=z+(r()-.5)*.12,hh=.25+r()*.3,lean=(r()-.5)*.25,top=[sx-o[0]+lean*hh,g0+hh,sz-o[2]];
          plnTube(m,{path:[[sx-o[0],g0,sz-o[2]],top],rad:.012,sides:4,col:plnMix3(base,lip,.4),mat:MAN});
          plnBlob(m,{c:top,r:[.035,.055,.035],sub:1,col:bead,mat:MAN});
          plnBlob(gm,{c:top,r:[.04,.06,.04],sub:1,col:lit,mat:PLN_MAT.glow,glow:1.8,x:1});
        }
      }
    }
    const hw=(x1-x0)/2+.5;
    if(m.nv)parts.push({k:"mat",o,hw,m});
    if(gm.nv)parts.push({k:"lit",o,hw,m:gm});
  }
  return parts;
}
function plnPeepFree(){
  const it=PEEP3.it;if(!it)return;
  for(const q of it.parts)if(q.geo)plnGeoFree(q.geo);
  if(it.inst)plnInstFree(it.inst);
  PEEP3.it=null;
}
function plnPeepStep(L,S){
  if(PEEP3.gen!==PLN_GPU.gen||PEEP3.L!==L){plnPeepFree();PEEP3.gen=PLN_GPU.gen;PEEP3.L=L;}
  const P=S.peep;
  if(!P){plnPeepFree();return;}
  const key=[Math.round(P.x),P.r,S.p.seed].join("|");
  if(PEEP3.it&&PEEP3.it.key===key)return;
  plnPeepFree();
  const parts=[];
  for(const q of plnPeepMesh(L,P,S.p))parts.push({k:q.k,o:q.o,hw:q.hw,geo:plnGeo(plnMeshDone(q.m))});
  const it={key,parts,a:new Float32Array(16*Math.max(1,parts.length)),inst:null};
  parts.forEach((q,i)=>plnRec(it.a,i,q.o,1,0,1,0,q.k==="mat"?null:[1,1,1]));
  it.inst=plnInst(it.a,parts.length,Math.max(1,parts.length));
  PEEP3.it=it;
}
/* в кадр: пластинки — всегда; свечение — в затмение, сила по темноте (порог 20c: .22) */
function plnPeepFrame(F,ex,V,dk){
  const it=PEEP3.it;if(!it||!it.parts.length)return;
  const gk=dk>.22?.2+.55*clamp((dk-.22)/.6,0,1):0;
  it.parts.forEach((q,i)=>{if(q.k==="lit")plnRec(it.a,i,q.o,1,0,1,0,[gk,gk,gk]);});
  plnInstSet(it.inst,it.a,it.parts.length);
  it.parts.forEach((q,i)=>{
    if(q.k==="lit"&&gk<=0)return;
    if(Math.abs(q.o[0]-ex)>V.hw*(1+q.o[2]/V.D)+q.hw)return;
    F.batches.push({geo:q.geo,inst:it.inst,first:i,count:1,kind:PLN_KIND.body,to:q.k==="mat"?PLN_TO.all:PLN_TO.lit});
  });
}
