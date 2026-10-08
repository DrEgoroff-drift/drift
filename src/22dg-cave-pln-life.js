/* ── жизнь пещеры телами (M630c): растения и звери — в сцене 22d, не кистью поверх ──
   Тела те же, что у поверхности (21pia — растение, 21pib — зверь с книжкой поз), мерка — карта
   пещеры: растение в q.h пикселей карты стоит в q.h/CAVE_PPM метров, зверь — в b.r/CAVE_PPM.
   Стоят за линией ходьбы, на полу картинки; свет фонаря и дня ложится на них, как на камень.
   У каждой книжки свой буфер записей: кадр пещеры рисует запись с нуля (22db). */
const CAVE3_LIFE={plantZ:[1.25,.8],beastZ:[.35,.9],rMin:.28,cap:24};

function cave3LifeDrop(Q){
  for(const k in Q.geo)plnGeoFree(Q.geo[k]);
  for(const k in Q.inst)plnInstFree(Q.inst[k]);
  Q.geo={};Q.inst={};
}
/* пол картинки под точкой на глубине z: где воздух — на нём, иначе ближе к разрезу */
function cave3LifeFoot(F,X,Y,zs){
  for(const z of zs)if(cave3Den(F,X,Y+.5,z)<-.15)return [cave3Down(F,X,Y+.5,z),z];
  return null;
}
function cave3LifeFrame(C,F,Fd,x0,x1){
  const Q=C.life3||(C.life3={gen:-1,geo:{},inst:{},a:{},foot:new Map()});
  if(Q.gen!==PLN_GPU.gen){cave3LifeDrop(Q);Q.gen=PLN_GPU.gen;}
  if(Q.F!==Fd){Q.foot.clear();Q.F=Fd;}
  const P=CAVE_PPM,K=CAVE3_LIFE,p=G.surf&&G.surf.p,by={};
  let tris=0,n=0;
  /* растения: вид — по списку пещерных (caveFloraOf), возраст — в книжку; тон — краска мира, как наверху */
  const sps=p?caveFloraOf(p):[],T=plnRgb(PLN_HERB.teal);
  for(const q of C.plants||[]){
    if(!q||!q.sp||!isFinite(q.x))continue;
    const X=q.x/P;if(X<x0-3||X>x1+3)continue;
    const hh=hashi(Math.round(q.x),Math.round(q.h||0),0x9E11);
    let ft=Q.foot.get(q);
    if(ft===undefined){
      const u=((hh>>>5)&255)/255,z=K.plantZ[0]+u*K.plantZ[1];
      ft=cave3LifeFoot(Fd,X,-q.y/P,[z,z*.75,CAVE3_Z+.25]);Q.foot.set(q,ft);
    }
    if(!ft)continue;
    const si=Math.max(0,sps.indexOf(q.sp)),key="p"+si+"."+(q.age<.3?0:(q.age>.82?2:1));
    (by[key]=by[key]||{plant:q,si,list:[]}).list.push({q,ft,hh});
  }
  /* звери: кадр книжки — как наверху: оглушён, злой, идёт, стоит, а стоя пасётся в свой час */
  const N=PLN_BEAST.N;
  for(const b of C.fauna||[]){
    if(!b||!isFinite(b.x)||b.caught)continue;
    const X=b.x/P;if(X<x0-3||X>x1+3)continue;
    const t=G.t*(b.spd||0)+(b.phase||0),air=b.alien==="jelly"||b.alien==="manta",go=air||Math.abs(b.vx||0)>.02;
    const w=b.alien?PLN_BEAST.w[b.alien]||2:2,kw=Math.floor((((t*w/TAU)%1)+1)%1*N)%N;
    const k=(b.stun>0||b.stunT>0)?N+3:(b.hostile?N+2:(go?kw:(Math.sin(t*.37+(b.phase||0)*3)>.35?N+1:N)));
    const flip=b.face<0,key="b"+plnBeastSpId(b.sp)+"."+(b.tail?1:0)+(b.crest?1:0)+Math.round((b.headSize||0)*100)+(b.alien==="manta"&&flip?"f":"")+"."+k;
    (by[key]=by[key]||{beast:b,k,flip,list:[]}).list.push({b,t,go,air,k});
  }
  for(const key in by){
    const g=by[key];
    if(!Q.geo[key]){
      Q.geo[key]=plnGeo(g.plant?plnHerbMesh(g.plant.sp,g.si,+key.slice(-1)):plnBeastMesh(g.beast,g.k,g.flip));
    }
    const a=Q.a[key]||(Q.a[key]=new Float32Array(16*K.cap));
    let m=0;
    for(const e of g.list){
      if(m>=K.cap)break;
      if(g.plant){
        const q=e.q,h=Math.max(4,q.h||20)/P,jt=1+(((e.hh>>>9)&255)/255-.5)*.24;
        const Tn=plnHerbTone(PLN_TINTS[PLN_HERB.tints[g.si%3]],q.leaf||q.sp.leaf);
        let top=plnMul(Tn.top,jt),under=plnMul(Tn.under,jt);
        if(q.scanned){top=plnMix3(top,T,.5);under=plnMix3(under,plnMul(T,.3),.5);}
        const pos=[q.x/P,e.ft[0]-.03,e.ft[1]],yaw=((e.hh>>>3)&255)/255*TAU;
        if(q.sp.kind===4)plnRec(a,m++,pos,h,yaw,1,m,q.scanned?[.6,1.1,1.05]:[jt,jt,jt],0);
        else plnRec(a,m++,pos,h,yaw,1,m,under,2,top);
      }else{
        const b=e.b,X=b.x/P,R=Math.max(K.rMin,b.r/P),z=CAVE3_Z+(b.r<7?K.beastZ[0]:K.beastZ[1]);
        /* y зверя у игры — пол под ним; летун висит на hover пикселей карты выше, пасясь — ниже, оглушённый лёг */
        const fk=Math.round(X*4)+"|"+Math.round(-b.y/P*2);
        let f=Q.foot.get(fk);
        if(f===undefined){const v=cave3LifeFoot(Fd,X,-b.y/P,[z,CAVE3_Z+.2]);f=v?v[0]:-b.y/P;Q.foot.set(fk,f);}
        const k=e.k,up=b.alien?(b.hover&&k!==N+3?b.hover*(k===N+1?.35:1)*(1+.16*Math.sin(e.t*.6))/P:0)
          :(e.go?(b.hop?Math.abs(Math.sin(e.t))*R*.35:Math.sin(e.t)*R*.08+R*.08):0);
        const y=f+up;
        const yaw=b.alien==="manta"?PLN_BEAST.mantaYaw:PLN_BEAST.yaw;
        plnRec(a,m++,[X,y,z],R,b.face<0?Math.PI-yaw:yaw,1,m,b.scanned?[.72,1.08,1.04]:null,0);
      }
    }
    let I=Q.inst[key];
    if(!I)I=Q.inst[key]=plnInst(a,m,K.cap);else plnInstSet(I,a,m);
    if(!m)continue;
    F.draw.push({geo:Q.geo[key],inst:I,lamp:true,sun:true,refl:true});
    tris+=Q.geo[key].n/3*m;n+=m;
  }
  /* книжек не больше сорока: старые уходят вместе с буферами */
  const ks=Object.keys(Q.geo);
  if(ks.length>40)for(const k of ks)if(!by[k]){plnGeoFree(Q.geo[k]);plnInstFree(Q.inst[k]);delete Q.geo[k];delete Q.inst[k];delete Q.a[k];}
  if(Q.foot.size>600)Q.foot.clear();
  CAVE3.stat.life=n;
  return tris;
}

/* у вещи объектив смотрит на середину между человеком и ею (м, сдвиг от человека; 0 — вещи нет):
   то, что зовёт ДЕЙСТВИЕ, — растение для скана, оглушённый зверь, находка, янтарь */
function cave3NearShift(C){
  const P=CAVE_PPM,near=(x,y,dx,dy)=>Math.abs(x-C.x)<dx&&Math.abs(y-C.y)<dy;
  let best=null,bd=1e9;
  const take=x=>{const d=Math.abs(x-C.x);if(d<bd){bd=d;best=x;}};
  for(const q of C.plants||[])if(!q.scanned&&near(q.x,q.y,30,40))take(q.x);
  for(const b of C.fauna||[])if(!b.caught&&(b.stun>0||b.stunT>0)&&near(b.x,b.y,30,40))take(b.x);
  if(!C.found&&C.findX!=null&&near(C.findX,C.findY,30,40))take(C.findX);
  for(const q of caveProps(C))if(q.k==="amber"&&!q.took&&near(q.x,q.y,40,50))take(q.x);
  return best==null?0:(best-C.x)/2/P;
}
