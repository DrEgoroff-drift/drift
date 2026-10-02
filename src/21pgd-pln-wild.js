/* ══════════════ планета: дикие куртины видов планеты (M622) ══════════════
   Геном мира — в ковре. Виды планеты (floraOf) у игры растут только там, где она их
   посадила (S.plants — вдоль линии ходьбы, 21pia). Здесь те же виды растут сами: за линией
   куртинами — эллипс из нескольких тел одного вида, до трёх на кусок, по свободной земле,
   не по тропе, не по воде и не по площадке; на дальнем берегу — рослые виды кулисой у
   гребней, в полтора роста: на ста метрах иначе не прочесть. Тела — plnHerbMesh в тоне
   мира, по виду и возрасту (взрослое, старое), сетка строится по первой нужде и живёт с
   посадкой (plnWildDrop). Породы деревьев тоже выбирает мир: веса PLN_WILD.trees правят
   кости plnTreeKind (21pgb) — пустыня стоит в сушинах и вилках, джунгли в зонтах и ярусах. */
const PLN_WILD={
  z:[3.5,8],                            /* куртина за линией: глубина, м */
  per:15,                               /* метров куска на одну куртину при полной пышности */
  far:[125,175],                        /* полоса дальних куртин, м */
  farK:1.5,                             /* рослые виды вдали — в полтора роста */
  /* множители весов пород (PLN_TREES.w) по типу мира; нет типа — как есть */
  trees:{terran:{umb:1.2,col:.8,pag:.7,orb:1.1,fork:1,snag:.5},
    jungle:{umb:1.4,col:1.2,pag:1.3,orb:.9,fork:.6,snag:.2},
    ocean:{umb:.9,col:1.4,pag:.6,orb:.8,fork:.8,snag:.5},
    desert:{umb:.5,col:1.3,pag:.3,orb:.6,fork:1.3,snag:1.6},
    rocky:{umb:.4,col:.6,pag:.5,orb:.5,fork:1.4,snag:1.8},
    ice:{umb:.3,col:1.5,pag:.8,orb:.3,fork:.9,snag:1.3},
    volcanic:{umb:.3,col:.5,pag:.2,orb:.3,fork:1.3,snag:2.2},
    toxic:{umb:.8,col:.7,pag:1.5,orb:1.3,fork:.9,snag:.8},
    crystal:{umb:.4,col:1.3,pag:1.4,orb:.9,fork:.5,snag:.6},
    metal:{umb:.5,col:1,pag:.4,orb:.5,fork:1.5,snag:1.5},
    ruin:{umb:.9,col:.6,pag:.6,orb:1,fork:1.2,snag:1.4}}};
/* виды этой посадки: доля, рост в метрах, тон мира; сетки — по виду и возрасту, по нужде */
function plnWildKit(L){
  const F=L.flora;
  if(F.wild)return F.wild;
  const sps=F.p?floraOf(F.p):[],list=[];
  let sum=0;
  sps.forEach((sp,si)=>{sum+=sp.share;list.push({sp,si,share:sp.share,h:sp.h/PLN_M,T:plnHerbTone(PLN_TINTS[PLN_HERB.tints[si%3]],sp.leaf),geo:[null,null]});});
  return F.wild={list,sum};
}
function plnWildGeo(it,ac){return it.geo[ac]||(it.geo[ac]=plnGeo(plnHerbMesh(it.sp,it.si,ac+1,it.T)));}
function plnWildPick(W,u){let a=u*W.sum;for(const it of W.list){a-=it.share;if(a<0)return it;}return W.list[W.list.length-1];}
function plnWildDrop(F){if(F.wild)for(const it of F.wild.list)for(const g of it.geo)plnGeoFree(g);F.wild=null;}
/* вёдра на вид и возраст, заводятся по первой записи */
function plnWildBuckets(){
  const by={};
  return {get(it,ac,to){const k=it.si*2+ac;return by[k]||(by[k]=plnPlantBucket(plnWildGeo(it,ac),to));},all(){return Object.values(by);}};
}
/* куртины куска за линией по свободной земле; o — помощники куска (21pga): at, free, clear, blots, wetAt, padK.
   Возвращает вёдра для группы тел куска */
function plnWildBodies(L,J,o){
  const F=L.flora,W=plnWildKit(L),TO=PLN_TO,xa=J.xa,xb=J.xb,wd=xb-xa,lush=F.lush,Bk=plnWildBuckets();
  if(!W.list.length||lush<=0)return [];
  const r=rng(plnPlantSeed(L,J.c,5)),n=Math.min(3,Math.round(wd/PLN_WILD.per*lush*(.3+r()*1.1)));
  for(let d=0;d<n;d++){
    const it=plnWildPick(W,r()),cx=xa+2+r()*(wd-4),cz=lerp(PLN_WILD.z[0],PLN_WILD.z[1],r()),rx=2.5+r()*2,rz=1.2+r(),m=it.h>2.5?1+(r()*3|0):3+(r()*7|0);   /* рослые — по одному-трое */
    for(let i=0;i<m;i++){
      const a=r()*TAU,u=Math.sqrt(r()),x=cx+Math.cos(a)*rx*u,z=cz+Math.sin(a)*rz*u,q=o.at(x,z),g=q[0],flat=q[4];
      const old=r()<.28,h=it.h*(.65+r()*.7)*(old?1.1:1),jt=.9+r()*.2,yaw=r()*TAU;
      if(x<xa||x>=xb||flat<.72||o.padK(x)||o.wetAt(x,z,g)||plnLandPath(L,x,z)>.3||!o.free(x,z,.5))continue;
      plnPlantPut(Bk.get(it,old?1:0,it.h>1.5?TO.all:TO.near),[x,g-.03,z],h,yaw,1,plnMul(it.T.under,jt),2,plnMul(it.T.top,jt),0);
      o.clear.push([x,z,.45,.45,0]);
      if(h>1.2)o.blots.push([x,z,clamp(h*.45,.6,3.5),.4]);
    }
  }
  return Bk.all();
}
/* дальний берег: рослые виды кулисой у гребня клетки, в полтора роста; мимо просвета лифта */
function plnWildFar(L,fc,xa){
  const F=L.flora,W=plnWildKit(L),TO=PLN_TO,C=PLN_PLANT,wy=PLN_LAND.wRel,lush=F.lush,Bk=plnWildBuckets();
  const tall=W.list.filter(it=>it.h>=2.5);
  if(!tall.length||lush<=0)return [];
  const r=rng(plnPlantSeed(L,fc,15)),cast=TO.main|TO.mirror|TO.sh1;
  if(r()<.7*lush){
    const it=tall[(r()*tall.length)|0],c=plnPlantCrest(L,xa+r()*C.farW,PLN_WILD.far[0],PLN_WILD.far[1],5),m=3+(r()*4|0);
    for(let i=0;i<m;i++){
      const x=c[0]+(r()-.5)*12,z=c[2]+(r()-.5)*8,y=plnLandFarH(L,x,z),az=Math.atan2(x-L.cx0,z+50);
      const h=it.h*PLN_WILD.farK*(.7+r()*.6),jt=.9+r()*.2,yaw=r()*TAU,old=r()<.3;
      if(y<wy+.5||Math.exp(-Math.pow((az-PLN_AZ_ELEV)/.075,2))>.25)continue;
      plnPlantPut(Bk.get(it,old?1:0,cast),[x,y-.2,z],h,yaw,1,plnMul(it.T.under,jt),2,plnMul(it.T.top,jt),1);
    }
  }
  return Bk.all();
}
/* порода дерева — по миру: множитель веса породы k на посадке L */
function plnTreeWorldW(L,k){const t=L.flora&&L.flora.type,T=PLN_WILD.trees[t];return T&&T[k]!=null?T[k]:1;}
