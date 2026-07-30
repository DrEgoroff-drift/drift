/* ══════════════ ПОЯС АСТЕРОИДОВ · ВИД ИЗ КАБИНЫ ══════════════ */
function hashi3(x,y,z,s){
  let h=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(z|0,1274126177)^Math.imul(s|0,1442695041);
  h=Math.imul(h^(h>>>13),1274126177);
  return ((h^(h>>>16))>>>0)/4294967296;
}
function noise3(x,y,z,s){
  const xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z);
  const xf=x-xi,yf=y-yi,zf=z-zi;
  const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf),w=zf*zf*(3-2*zf);
  const c=(a,b,d)=>hashi3(xi+a,yi+b,zi+d,s);
  const x00=lerp(c(0,0,0),c(1,0,0),u), x10=lerp(c(0,1,0),c(1,1,0),u);
  const x01=lerp(c(0,0,1),c(1,0,1),u), x11=lerp(c(0,1,1),c(1,1,1),u);
  return lerp(lerp(x00,x10,v),lerp(x01,x11,v),w);
}
function fbm3(x,y,z,s,oct){
  let val=0,a=.5,f=1,n=0;oct=oct||4;
  for(let i=0;i<oct;i++){val+=a*noise3(x*f,y*f,z*f,s+i*167);n+=a;a*=.5;f*=2;}
  return val/n;
}

const ICO_V=(function(){
  const t=(1+Math.sqrt(5))/2;
  const v=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],
           [0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]];
  return v.map(p=>{const l=Math.hypot(p[0],p[1],p[2]);return [p[0]/l,p[1]/l,p[2]/l];});
})();
const ICO_F=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],
  [10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],
  [8,6,7],[9,8,1]];
/* разбиение икосферы. Новые вершины дописываются в конец, поэтому вершины
   грубого уровня — префикс списка, и все три набора граней живут на одном
   массиве вершин: 12→20 граней, 42→80, 162→320 */
function subdivide(verts,faces){
  const nv=verts.map(v=>v.slice()), nf=[], mid=new Map();
  function mp(a,b){
    const k=a<b?a+"_"+b:b+"_"+a;
    if(mid.has(k))return mid.get(k);
    const p=[(verts[a][0]+verts[b][0])/2,(verts[a][1]+verts[b][1])/2,(verts[a][2]+verts[b][2])/2];
    const l=Math.hypot(p[0],p[1],p[2]);
    nv.push([p[0]/l,p[1]/l,p[2]/l]);
    const i=nv.length-1;mid.set(k,i);return i;
  }
  for(const f of faces){
    const a=mp(f[0],f[1]),b=mp(f[1],f[2]),c=mp(f[2],f[0]);
    nf.push([f[0],a,c],[f[1],b,a],[f[2],c,b],[a,b,c]);
  }
  return {verts:nv,faces:nf};
}
const SPHERE=subdivide(ICO_V,ICO_F);
const SPHERE2=subdivide(SPHERE.verts,SPHERE.faces);

function makeRock(seed,rad){
  const r=rng(seed);
  const o1=[r()*40,r()*40,r()*40], o2=[r()*40,r()*40,r()*40];
  const V=SPHERE2.verts,n=V.length;
  const verts=new Array(n),ore=new Float32Array(n);
  for(let i=0;i<n;i++){
    const v=V[i];
    const lump=fbm3(v[0]*.85+o1[0],v[1]*.85+o1[1],v[2]*.85+o1[2],seed,3);
    const crag=fbm3(v[0]*3.4+o1[0],v[1]*3.4+o1[1],v[2]*3.4+o1[2],seed+91,4);
    /* третья октава видна только на ближнем уровне — она и даёт «камень» */
    const grit=fbm3(v[0]*8.2+o2[0],v[1]*8.2+o2[1],v[2]*8.2+o2[2],seed+733,3);
    const k=rad*(.56+lump*.64+crag*.26+grit*.1);
    verts[i]=[v[0]*k,v[1]*k,v[2]*k];
    ore[i]=fbm3(v[0]*2.6+o2[0],v[1]*2.6+o2[1],v[2]*2.6+o2[2],seed+404,3);
  }
  const faceOre=F=>F.map(f=>(ore[f[0]]+ore[f[1]]+ore[f[2]])/3);
  /* лёгкий разброс тона по граням — иначе камень выглядит пластмассовым */
  const faceTint=F=>Float32Array.from(F,(_,i)=>.86+((hashi(seed,i,17)&255)/255)*.28);
  const g=78+r()*72;
  const rock=[g*(.86+r()*.2),g*(.82+r()*.16),g*(.76+r()*.16)];
  return {verts,rock,
    lods:[
      {faces:ICO_F,        nv:12, ore:faceOre(ICO_F),        tint:faceTint(ICO_F)},
      {faces:SPHERE.faces, nv:42, ore:faceOre(SPHERE.faces), tint:faceTint(SPHERE.faces)},
      {faces:SPHERE2.faces,nv:162,ore:faceOre(SPHERE2.faces),tint:faceTint(SPHERE2.faces)}
    ]};
}
function hexRGB(h){
  return [parseInt(h.substr(1,2),16),parseInt(h.substr(3,2),16),parseInt(h.substr(5,2),16)];
}

const BELT_HALF=2000, DUST_HALF=340;
const AST_N=112, AST_MIN=560;   // ближе AST_MIN не спавним — до руды надо долететь
const BELT_AVLIM=.042;   // предел скорости поворота — на полном отклонении ~140°/с
function beltIcy(B){return B.orbit>1500;}
function enterBelt(){
  const sys=G.sys,B=sys.belt,r=rng(B.seed);
  const ast=[];
  for(let i=0;i<AST_N;i++){
    const rad=26+r()*78;
    let res=B.res[Math.floor(r()*B.res.length)];
    /* кристаллы льда намерзают только на дальних, холодных кольцах — и тянутся
       из отдельного потока, чтобы состав уже существующих поясов не поехал */
    if(beltIcy(B)&&rng(hashi(B.seed,i*977,0x1CEC))()<.22)res="icecrys";
    let x=0,y=0,z=0;
    for(let t=0;t<24;t++){
      x=(r()-.5)*2*BELT_HALF;y=(r()-.5)*780;z=(r()-.5)*2*BELT_HALF;
      if(Math.hypot(x,y,z)>AST_MIN)break;
    }
    const sd=hashi(B.seed,i*131,7);
    ast.push({x,y,z,r:rad,seed:sd,mesh:makeRock(sd,rad),
      res,oreCol:hexRGB(RES[res].col),
      left:8+Math.floor(r()*16),
      rx:r()*TAU,ry:r()*TAU,sx:(r()-.5)*.011,sy:(r()-.5)*.011});
  }
  const dust=[];
  for(let i=0;i<240;i++)
    dust.push({x:(r()-.5)*2*DUST_HALF,y:(r()-.5)*2*DUST_HALF,z:(r()-.5)*2*DUST_HALF});
  /* ориентиры (24b-belt-poi) считаются до старта: они расчищают под собой
     камни, иначе скала торчит сквозь конструкцию */
  const poi=genBeltPOI(B,ast);
  G.belt={B,ast,dust,poi,chunks:[],shots:[],x:0,y:0,z:0,vx:0,vy:0,vz:0,
    yaw:0,pitch:0,roll:0,avYaw:0,avPitch:0,avRoll:0,prevYaw:0,
    lock:null,prog:0,hit:0,near:9999,beam:0,cool:0,flash:0};
  G.mode="belt";G.ap=null;
  for(const k in keys)keys[k]=false;
  document.querySelectorAll(".pads button").forEach(bb=>bb.classList.remove("on"));
  say("Вход в "+B.name+"\nруда: "+B.res.map(k=>RES[k].ru).join(", ")+
    (beltIcy(B)?"\nкольцо дальнее — попадаются кристаллы льда":"")+
    "\n◀ ▶ курс · ▲ ▼ тангаж · Q E крен\nПРОБЕЛ тяга · тяните по стеклу — обзор");
}
/* обломки: разлетаются, тают и ничего не задевают */
function shatter(b,a,n,power,px,py,pz){
  const r=rng(hashi(a.seed,b.chunks.length*7+n,0x5A17));
  for(let i=0;i<n;i++){
    const dx=r()*2-1,dy=r()*2-1,dz=r()*2-1;
    const l=Math.hypot(dx,dy,dz)||1,sp=(.5+r()*1.7)*power;
    b.chunks.push({
      x:px===undefined?a.x:px, y:py===undefined?a.y:py, z:pz===undefined?a.z:pz,
      vx:b.vx*.15+dx/l*sp, vy:b.vy*.15+dy/l*sp, vz:b.vz*.15+dz/l*sp,
      r:a.r*(.13+r()*.24), pr:a.r, mesh:a.mesh, ore:a.oreCol,
      rx:r()*TAU,ry:r()*TAU,sx:(r()-.5)*.09,sy:(r()-.5)*.09,
      life:1
    });
  }
  if(b.chunks.length>150)b.chunks.splice(0,b.chunks.length-150);
}
function killRock(b,a,power){
  shatter(b,a,9+Math.floor(Math.random()*6),power);
  const i=b.ast.indexOf(a);
  if(i>=0)b.ast.splice(i,1);       // выработанный камень не должен остаться невидимым препятствием
  if(b.lock===a){b.lock=null;b.prog=0;}
}
function beltFwd(b){
  const cp=Math.cos(b.pitch),sp=Math.sin(b.pitch);
  return [Math.sin(b.yaw)*cp, sp, Math.cos(b.yaw)*cp];
}
/* полный базис камеры с креном — из-за него горизонт заваливается в поворот */
function beltBasis(b){
  const fwd=beltFwd(b);
  const r0=[Math.cos(b.yaw),0,-Math.sin(b.yaw)];
  const u0=[r0[1]*fwd[2]-r0[2]*fwd[1],
            r0[2]*fwd[0]-r0[0]*fwd[2],
            r0[0]*fwd[1]-r0[1]*fwd[0]];
  const cr=Math.cos(b.roll),sr=Math.sin(b.roll);
  return {fwd,
    right:[r0[0]*cr+u0[0]*sr, r0[1]*cr+u0[1]*sr, r0[2]*cr+u0[2]*sr],
    up:   [u0[0]*cr-r0[0]*sr, u0[1]*cr-r0[1]*sr, u0[2]*cr-r0[2]*sr]};
}
function exitBelt(){
  const B=G.sys.belt;
  const a=Math.atan2(G.ship.y,G.ship.x);
  G.ship.x=Math.cos(a)*(B.orbit+150);G.ship.y=Math.sin(a)*(B.orbit+150);
  G.ship.vx=0;G.ship.vy=0;
  G.belt=null;G.mode="system";
  saveGame(true);
  say("Выход из пояса\nв трюме: "+held());
}
const CUT_RANGE=340;   // резак достаёт только вблизи, захват — издалека
function updateBelt(dt){
  const b=G.belt,st=stat();
  const yd=G.opts.invYaw?-1:1;

  /* ── ориентация: рули дают угловое ускорение, не мгновенный поворот ── */
  const acc=.0026*st.turn*dt, lim=BELT_AVLIM*st.turn;
  if(keys.left) b.avYaw-=acc*yd;
  if(keys.right)b.avYaw+=acc*yd;
  if(keys.pup)  b.avPitch+=acc;
  if(keys.pdown)b.avPitch-=acc;
  if(keys.rollL)b.avRoll-=acc*1.6;
  if(keys.rollR)b.avRoll+=acc*1.6;
  const damp=Math.pow(.9,dt);
  if(!keys.left&&!keys.right)b.avYaw*=damp;
  if(!keys.pup&&!keys.pdown)b.avPitch*=damp;
  if(!keys.rollL&&!keys.rollR)b.avRoll*=damp;
  b.avYaw=clamp(b.avYaw,-lim,lim);
  b.avPitch=clamp(b.avPitch,-lim,lim);
  b.avRoll=clamp(b.avRoll,-lim*1.4,lim*1.4);
  b.yaw+=b.avYaw*dt;
  b.pitch=clamp(b.pitch+b.avPitch*dt,-1.35,1.35);
  b.roll=((b.roll+b.avRoll*dt+Math.PI)%TAU+TAU)%TAU-Math.PI;
  /* крен подтягивается к скорости разворота — считаем по факту, поэтому
     работает и от клавиш, и от протяжки по стеклу */
  if(!keys.rollL&&!keys.rollR){
    const rate=angDiff(b.yaw,b.prevYaw)/Math.max(dt,.0001);
    b.roll+=angDiff(clamp(rate*11,-.8,.8),b.roll)*Math.min(1,.05*dt);
  }
  b.prevYaw=b.yaw;

  /* ── тяга ── */
  const fwd=beltFwd(b);
  if(keys.thrust&&G.fuel>0){
    const a=.085*st.thr*dt;
    b.vx+=fwd[0]*a;b.vy+=fwd[1]*a;b.vz+=fwd[2]*a;
    G.fuel=Math.max(0,G.fuel-.02*dt);
  }
  if(keys.brake&&G.fuel>0){
    const k=Math.pow(.93,dt);b.vx*=k;b.vy*=k;b.vz*=k;
    G.fuel=Math.max(0,G.fuel-.015*dt);
  }
  const sp2=Math.hypot(b.vx,b.vy,b.vz),vlim=7+st.thr*3;
  if(sp2>vlim){b.vx*=vlim/sp2;b.vy*=vlim/sp2;b.vz*=vlim/sp2;}
  b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;

  /* ── камни: перенос вокруг камеры и столкновения ── */
  b.near=9999;
  for(let i=b.ast.length-1;i>=0;i--){
    const a=b.ast[i];
    a.rx+=a.sx*dt;a.ry+=a.sy*dt;
    if(a.x-b.x>BELT_HALF)a.x-=2*BELT_HALF; else if(a.x-b.x<-BELT_HALF)a.x+=2*BELT_HALF;
    if(a.z-b.z>BELT_HALF)a.z-=2*BELT_HALF; else if(a.z-b.z<-BELT_HALF)a.z+=2*BELT_HALF;
    const dx=a.x-b.x,dy=a.y-b.y,dz=a.z-b.z,d=Math.hypot(dx,dy,dz);
    const clear=d-a.r;
    if(clear<b.near)b.near=clear;
    if(d<a.r+12&&d>0){
      const dmg=Math.min(26,sp2*5+2);
      G.hull=Math.max(0,G.hull-dmg*dt*.5);
      b.vx-=dx/d*.6;b.vy-=dy/d*.6;b.vz-=dz/d*.6;
      b.hit=14;
      if(G.hull<=0){wreck();G.belt=null;return;}
    }
  }
  for(const p of b.dust){
    if(p.x-b.x>DUST_HALF)p.x-=2*DUST_HALF; else if(p.x-b.x<-DUST_HALF)p.x+=2*DUST_HALF;
    if(p.y-b.y>DUST_HALF)p.y-=2*DUST_HALF; else if(p.y-b.y<-DUST_HALF)p.y+=2*DUST_HALF;
    if(p.z-b.z>DUST_HALF)p.z-=2*DUST_HALF; else if(p.z-b.z<-DUST_HALF)p.z+=2*DUST_HALF;
  }
  if(b.hit>0)b.hit-=dt;
  if(b.flash>0)b.flash-=dt;

  /* ── обломки: летят, крутятся, тают, ни с чем не сталкиваются ── */
  for(let i=b.chunks.length-1;i>=0;i--){
    const c=b.chunks[i];
    c.x+=c.vx*dt;c.y+=c.vy*dt;c.z+=c.vz*dt;
    c.rx+=c.sx*dt;c.ry+=c.sy*dt;
    c.life-=.0075*dt;
    if(c.life<=0)b.chunks.splice(i,1);
  }

  /* ── бортовое орудие ── */
  if(b.cool>0)b.cool-=dt;
  if(keys.fire&&st.armed&&b.cool<=0){
    b.shots.push({x:b.x+fwd[0]*10,y:b.y+fwd[1]*10,z:b.z+fwd[2]*10,
      vx:b.vx+fwd[0]*24,vy:b.vy+fwd[1]*24,vz:b.vz+fwd[2]*24,life:90});
    b.cool=st.cool;b.flash=6;
  }
  for(let i=b.shots.length-1;i>=0;i--){
    const s=b.shots[i];
    s.x+=s.vx*dt;s.y+=s.vy*dt;s.z+=s.vz*dt;s.life-=dt;
    let gone=s.life<=0;
    if(!gone)for(const a of b.ast){
      if(Math.hypot(s.x-a.x,s.y-a.y,s.z-a.z)>a.r)continue;
      gone=true;
      /* снаряд скалывает породу: летят куски, руда при этом теряется */
      a.left-=3;
      if(a.left<=0)killRock(b,a,1.5);
      else shatter(b,a,3,1.1,s.x,s.y,s.z);
      break;
    }
    if(gone)b.shots.splice(i,1);
  }

  /* ── захват цели ── */
  let best=null,bs=-1;
  for(const a of b.ast){
    const dx=a.x-b.x,dy=a.y-b.y,dz=a.z-b.z,d=Math.hypot(dx,dy,dz);
    if(d>1300)continue;
    const dot=(dx*fwd[0]+dy*fwd[1]+dz*fwd[2])/d;
    if(dot>.94&&dot>bs){bs=dot;best=a;}
  }
  if(best!==b.lock)b.prog=0;
  b.lock=best;b.beam=0;
  const dbtn=document.getElementById("dronebtn");
  /* дрон живёт продажами, поэтому на редкое сырьё его не посадить */
  if(best&&G.droneInventory>0&&RARE_RES.indexOf(best.res)<0){droneTarget=best.res;dbtn.style.display="";dbtn.textContent="ДРОН → "+RES[best.res].ru.toUpperCase();}
  else{droneTarget=null;dbtn.style.display="none";}

  if(!best){G.prompt="НАВЕДИТЕ ПРИЦЕЛ НА АСТЕРОИД";return;}
  const td=Math.hypot(best.x-b.x,best.y-b.y,best.z-b.z)-best.r;
  if(td>CUT_RANGE){
    G.prompt=keys.act?"РЕЗАК НЕ ДОСТАЁТ · "+Math.round(td)+" М — ПОДОЙДИТЕ БЛИЖЕ":"";
    return;
  }
  G.prompt="";
  if(keys.act){
    if(held()>=st.cargoMax)G.prompt="ТРЮМ ПОЛОН";
    else{
      b.beam=1;
      b.prog+=.03*st.drill*dt;
      while(b.prog>=1&&best.left>0&&held()<st.cargoMax){
        b.prog-=1;best.left--;minedUnit(best.res);
        if(best.left%4===0)shatter(b,best,1,.8);
      }
      if(best.left<=0){
        say("Астероид выработан\n"+RES[best.res].ru);
        killRock(b,best,1.2);
      }
    }
  }
}
function drawBelt(){
  const b=G.belt,st=stat();
  ctx.fillStyle="#03050a";ctx.fillRect(0,0,W,H);
  const bas=beltBasis(b),fwd=bas.fwd,right=bas.right,up=bas.up;
  const cam=[b.x,b.y,b.z];
  const F=Math.min(W,H)*.95;
  function proj(px,py,pz){
    const vx=px-cam[0],vy=py-cam[1],vz=pz-cam[2];
    const zc=vx*fwd[0]+vy*fwd[1]+vz*fwd[2];
    if(zc<2)return null;
    const xc=vx*right[0]+vy*right[1]+vz*right[2];
    const yc=vx*up[0]+vy*up[1]+vz*up[2];
    return {x:W/2+xc*F/zc, y:H/2-yc*F/zc, z:zc};
  }
  /* звёздная сфера */
  ctx.fillStyle="rgba(185,212,235,.5)";
  for(const s of BG){
    const th=s.x*TAU, ph=(s.y-.5)*2.4;
    const p=proj(b.x+Math.cos(ph)*Math.sin(th)*9000, b.y+Math.sin(ph)*9000,
                 b.z+Math.cos(ph)*Math.cos(th)*9000);
    if(p)ctx.fillRect(p.x,p.y,1.3,1.3);
  }
  /* пыль — даёт ощущение скорости */
  for(const d of b.dust){
    const p=proj(d.x,d.y,d.z);
    if(!p)continue;
    const al=clamp(1-p.z/DUST_HALF,0,1)*.5;
    if(al<.03)continue;
    ctx.fillStyle="rgba(200,215,230,"+al.toFixed(2)+")";
    ctx.fillRect(p.x,p.y,1.2,1.2);
  }
  /* астероиды и обломки — общий буфер граней, чтобы сортировать по глубине вместе */
  const polys=[];
  function meshPolys(o,ox,oy,oz,rad,lod,alpha,oreCol,rock,locked){
    const L=o.mesh.lods[lod], nV=L.nv, sc=rad/o.r0;
    const c1=Math.cos(o.rx),s1=Math.sin(o.rx),c2=Math.cos(o.ry),s2=Math.sin(o.ry);
    const wv=new Array(nV),pv=new Array(nV);
    for(let i=0;i<nV;i++){
      const v=o.mesh.verts[i];
      let y=v[1]*c1-v[2]*s1, z=v[1]*s1+v[2]*c1;
      let x=v[0]*c2+z*s2; z=-v[0]*s2+z*c2;
      wv[i]=[ox+x*sc,oy+y*sc,oz+z*sc];
      pv[i]=proj(wv[i][0],wv[i][1],wv[i][2]);
    }
    const F=L.faces;
    for(let fi=0;fi<F.length;fi++){
      const f=F[fi],A=pv[f[0]],B2=pv[f[1]],C=pv[f[2]];
      if(!A||!B2||!C)continue;
      if((B2.x-A.x)*(C.y-A.y)-(B2.y-A.y)*(C.x-A.x)<=0)continue;
      const wa=wv[f[0]],wb=wv[f[1]],wc=wv[f[2]];
      const ux=wb[0]-wa[0],uy=wb[1]-wa[1],uz=wb[2]-wa[2];
      const vx2=wc[0]-wa[0],vy2=wc[1]-wa[1],vz2=wc[2]-wa[2];
      let nx=uy*vz2-uz*vy2, ny=uz*vx2-ux*vz2, nz=ux*vy2-uy*vx2;
      const nl=Math.hypot(nx,ny,nz)||1;nx/=nl;ny/=nl;nz/=nl;
      const li=clamp(nx*.46+ny*.74+nz*.24,0,1)*L.tint[fi];
      polys.push({A,B:B2,C,d:(A.z+B2.z+C.z)/3,li,ore:L.ore[fi],
        oreCol,rock,locked,alpha,edge:lod===2});
    }
  }
  for(const a of b.ast){
    const d=Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
    if(d>3000*G.opts.gfx.draw)continue;
    /* меш построен в масштабе a.r, поэтому r0 — это он же; детализация раздвигает
       дистанцию, на которой ещё используется самый подробный LOD */
    const lod=d<a.r*3.4*G.opts.gfx.detail?2:(d<a.r*11*G.opts.gfx.detail?1:0);
    meshPolys({mesh:a.mesh,rx:a.rx,ry:a.ry,r0:a.r},a.x,a.y,a.z,a.r,lod,
      1,a.oreCol,a.mesh.rock,a===b.lock);
  }
  for(const c of b.chunks){
    const d=Math.hypot(c.x-b.x,c.y-b.y,c.z-b.z);
    if(d>1800*G.opts.gfx.draw)continue;
    meshPolys({mesh:c.mesh,rx:c.rx,ry:c.ry,r0:c.pr},c.x,c.y,c.z,c.r,
      d<220?1:0,clamp(c.life*1.7,0,1),c.ore,c.mesh.rock,false);
  }
  /* ориентиры кладём в тот же буфер: иначе конструкция всплывает поверх скалы,
     за которой на самом деле стоит */
  for(const q of b.poi||[]){
    const p=proj(q.x,q.y,q.z);
    if(!p)continue;
    const F2=Math.min(W,H)*.95;
    const sc=F2/p.z;
    if(q.size*sc<2)continue;
    polys.push({spr:q,px:p.x,py:p.y,sc,d:p.z});
  }
  polys.sort((p,q)=>q.d-p.d);
  for(const p of polys){
    if(p.spr){
      drawBeltPOISprite(p.spr,p.px,p.py,p.sc,clamp(1-p.d/3400,.12,1));
      continue;
    }
    const vein=p.ore>.57;
    const base=vein?p.oreCol:p.rock;
    const k=.13+p.li*(vein?1.25:.92);
    const fog=clamp(1-p.d/2600,.1,1);
    let r=base[0]*k*fog,g=base[1]*k*fog,bl=base[2]*k*fog;
    if(p.locked){r=r*.82+26;g=g*.82+52;bl=bl*.82+50;}   // подсветка цели, но камень остаётся камнем
    if(p.alpha<1)ctx.globalAlpha=p.alpha;
    ctx.fillStyle="rgb("+(r|0)+","+(g|0)+","+(bl|0)+")";
    ctx.beginPath();ctx.moveTo(p.A.x,p.A.y);ctx.lineTo(p.B.x,p.B.y);ctx.lineTo(p.C.x,p.C.y);
    ctx.closePath();ctx.fill();
    if(p.edge&&vein){
      ctx.strokeStyle="rgba("+(base[0]|0)+","+(base[1]|0)+","+(base[2]|0)+",.4)";
      ctx.lineWidth=1;ctx.stroke();
    }
    if(p.alpha<1)ctx.globalAlpha=1;
  }
  /* трассеры */
  for(const s of b.shots){
    const p=proj(s.x,s.y,s.z), q=proj(s.x-s.vx*2.2,s.y-s.vy*2.2,s.z-s.vz*2.2);
    if(!p||!q)continue;
    ctx.strokeStyle="rgba(190,250,240,.9)";ctx.lineWidth=clamp(260/p.z,1,3.4);
    ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();
  }
  if(b.flash>0){
    const a=b.flash/6;
    for(const off of [-1,1]){
      const g2=ctx.createRadialGradient(W/2+off*W*.13,H*.8,0,W/2+off*W*.13,H*.8,60);
      g2.addColorStop(0,"rgba(200,255,245,"+(a*.5).toFixed(2)+")");
      g2.addColorStop(1,"rgba(120,220,210,0)");
      ctx.fillStyle=g2;ctx.beginPath();ctx.arc(W/2+off*W*.13,H*.8,60,0,TAU);ctx.fill();
    }
  }
  /* резак */
  if(b.lock&&b.beam){
    const t=proj(b.lock.x,b.lock.y,b.lock.z);
    if(t){
      const gx=W/2,gy=H*.86;
      for(const off of [-16,16]){
        ctx.strokeStyle="rgba(242,178,92,"+(.45+Math.random()*.5).toFixed(2)+")";
        ctx.lineWidth=2.2;
        ctx.beginPath();ctx.moveTo(gx+off,gy);ctx.lineTo(t.x,t.y);ctx.stroke();
      }
      ctx.fillStyle="rgba(255,220,150,.85)";
      for(let i=0;i<5;i++){
        const u=Math.random();
        ctx.fillRect(lerp(t.x,gx,u),lerp(t.y,gy,u),2,2);
      }
    }
  }
  drawGlassHUD(b,proj,fwd,st);
  drawCockpit(b,st);
}
/* ── символика на остеклении ── */
function drawGlassHUD(b,proj,fwd,st){
  const D=6000;
  /* шкала тангажа: вторая точка по курсу задаёт наклон черты, поэтому
     лесенка кренится вместе с горизонтом */
  ctx.lineWidth=1;
  for(let deg=-60;deg<=60;deg+=10){
    const th=deg*Math.PI/180, ct=Math.cos(th), st2=Math.sin(th);
    const p=proj(b.x+Math.sin(b.yaw)*ct*D, b.y+st2*D, b.z+Math.cos(b.yaw)*ct*D);
    const q=proj(b.x+Math.sin(b.yaw+.14)*ct*D, b.y+st2*D, b.z+Math.cos(b.yaw+.14)*ct*D);
    if(!p||!q)continue;
    if(p.x<-W||p.x>W*2||p.y<-H||p.y>H*2)continue;
    const zero=deg===0, w=zero?96:(deg%20===0?58:34);
    const ang=Math.atan2(q.y-p.y,q.x-p.x);
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(ang);
    ctx.strokeStyle=zero?"rgba(127,230,216,.55)":"rgba(127,230,216,.25)";
    ctx.beginPath();
    ctx.moveTo(-w,0);ctx.lineTo(-14,0);ctx.moveTo(14,0);ctx.lineTo(w,0);
    if(!zero){ctx.moveTo(-w,0);ctx.lineTo(-w,deg>0?5:-5);
              ctx.moveTo(w,0);ctx.lineTo(w,deg>0?5:-5);}
    ctx.stroke();
    if(deg%20===0&&!zero){
      ctx.fillStyle="rgba(127,230,216,.4)";ctx.font="8px ui-monospace,monospace";
      ctx.textAlign="right";ctx.fillText(deg>0?"+"+deg:deg,-w-4,3);
    }
    ctx.restore();
  }
  /* маркер вектора скорости */
  const sp=Math.hypot(b.vx,b.vy,b.vz);
  if(sp>.12){
    const p=proj(b.x+b.vx/sp*D,b.y+b.vy/sp*D,b.z+b.vz/sp*D);
    if(p){
      ctx.strokeStyle="rgba(150,240,180,.8)";ctx.lineWidth=1.4;
      ctx.beginPath();ctx.arc(p.x,p.y,7,0,TAU);ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(p.x-13,p.y);ctx.lineTo(p.x-7,p.y);
      ctx.moveTo(p.x+7,p.y);ctx.lineTo(p.x+13,p.y);
      ctx.moveTo(p.x,p.y-13);ctx.lineTo(p.x,p.y-7);
      ctx.stroke();
    }
  }
  /* рамка цели */
  if(b.lock){
    const t=proj(b.lock.x,b.lock.y,b.lock.z);
    if(t){
      const s=clamp(b.lock.r*Math.min(W,H)*.95/t.z,16,190);
      ctx.strokeStyle="rgba(242,178,92,.9)";ctx.lineWidth=1.4;
      const c=s*.42;
      for(const [ox,oy] of [[-1,-1],[1,-1],[-1,1],[1,1]]){
        ctx.beginPath();
        ctx.moveTo(t.x+ox*s-ox*c,t.y+oy*s);ctx.lineTo(t.x+ox*s,t.y+oy*s);
        ctx.lineTo(t.x+ox*s,t.y+oy*s-oy*c);ctx.stroke();
      }
      ctx.fillStyle="rgba(242,178,92,.9)";ctx.font="9px ui-monospace,monospace";
      ctx.textAlign="center";
      ctx.fillText(RES[b.lock.res].ru.toUpperCase()+" ×"+b.lock.left+
        "   "+Math.round(t.z)+" М",t.x,t.y-s-7);
    }
  }
  /* прицел */
  ctx.strokeStyle=b.lock?"rgba(242,178,92,.95)":"rgba(127,230,216,.6)";ctx.lineWidth=1.3;
  ctx.beginPath();ctx.arc(W/2,H/2,10,0,TAU);ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(W/2-22,H/2);ctx.lineTo(W/2-13,H/2);ctx.moveTo(W/2+13,H/2);ctx.lineTo(W/2+22,H/2);
  ctx.moveTo(W/2,H/2-22);ctx.lineTo(W/2,H/2-13);ctx.moveTo(W/2,H/2+13);ctx.lineTo(W/2,H/2+22);
  ctx.stroke();
  /* курсовая лента */
  const hd=((b.yaw*57.3)%360+360)%360;
  ctx.fillStyle="rgba(127,230,216,.55)";ctx.font="9px ui-monospace,monospace";ctx.textAlign="center";
  for(let i=-3;i<=3;i++){
    const v=Math.round(hd/10)*10+i*10;
    const x=W/2+(v-hd)*3.4;
    if(Math.abs(x-W/2)>W*.22)continue;
    const vv=((v%360)+360)%360;
    ctx.fillText(String(vv).padStart(3,"0"),x,H*.155);
    ctx.fillRect(x,H*.163,1,4);
  }
  ctx.strokeStyle="rgba(242,178,92,.8)";ctx.lineWidth=1.2;
  ctx.beginPath();ctx.moveTo(W/2,H*.176);ctx.lineTo(W/2-4,H*.184);
  ctx.lineTo(W/2+4,H*.184);ctx.closePath();ctx.stroke();
  if(b.hit>0){
    ctx.fillStyle="rgba(255,80,60,"+(b.hit/14*.22).toFixed(2)+")";
    ctx.fillRect(0,0,W,H);
  }
}