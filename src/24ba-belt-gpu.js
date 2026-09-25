/* ══════════════ пояс на видеокарте (GPU, ступень 2) ══════════════
   Тот же кадр, что drawBelt (24) рисует на #c, — в проход сцены: небо одним полем
   (фон, пятна туманности, светило или его зарево, полоса пояса), звёзды, дальние
   камни и пыль — фигурами, грани скал — треугольниками в том же порядке по глубине,
   ориентиры — фигурами между ними (24bb).
   Кабина и стекло (drawGlassHUD, drawCockpit) пока остаются на #c: граница с
   приборами — отдельный шаг. Без прохода сцены drawBelt рисует по-старому.

   Что стало лучше, а не только перенесено:
   · полоса пояса — прямая (кольцо вокруг камеры в её плоскости проецируется в
     прямую), и семь ступеней ширины кладутся с мягкими краями: лесенки нет;
   · общие рёбра соседних граней жёсткие (маска кит-треугольника): пиксель
     достаётся ровно одной грани, светлых швов по сетке камня больше нет. */

/* шум для лепки камня (makeRock, 24) — переехал сюда, чтобы 24 не рос за 40 КБ */
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

/* небо пояса одним проходом: всё, что 2D клал градиентами на весь кадр */
const BGPU_SKY=`
fn field(p:vec2f,uv:vec2f)->vec4f{
  let H=fu.res.w;let d=fu.res.x/fu.res.z;let t=p.y/H;
  var c=select(mix(vec3f(3.,5.,10.),vec3f(5.,7.,15.),(t-.55)/.45),mix(vec3f(4.,6.,12.),vec3f(3.,5.,10.),t/.55),t<.55)/255.;
  for(var i=0;i<4;i++){let B=fu.v[i];if(B.z>0.){
    let a=.13*max(1.-length(p-B.xy)/B.z,0.);c=mix(c,select(fu.v[5].rgb,fu.v[4].rgb,B.w<.5),a);}}
  let S=fu.v[6];let sc=fu.v[7].rgb;
  if(S.w>.5&&S.w<1.5){
    let q=length(p-S.xy)/(S.z*7.);var a=.16*max(1.-(q-.14)/.86,0.);if(q<.14){a=mix(.55,.16,q/.14);}
    c=mix(c,sc,a);
    c=mix(c,vec3f(255.,250.,236.)/255.,covDisc(p*d,S.xy*d,S.z*d)*.92);
  }else if(S.w>1.5){c+=sc*.30*pow(1.-min(length(p-S.xy)/S.z,1.),2.4);}
  let L=fu.v[8];
  if(L.w>.5){
    let dl=abs(dot(L.xy,p)+L.z);let G=fu.v[9];let e=G.zw-G.xy;
    let tt=clamp(dot(p-G.xy,e)/max(dot(e,e),1e-4),0.,1.);
    var K=mix(fu.v[4].rgb*.6,sc*1.15,tt);if(fu.v[10].x>.5){K=(fu.v[4].rgb+sc)*.5*.85;}
    var BW=array(.30,.25,.20,.155,.115,.08,.05);var BA=array(.05,.055,.06,.065,.07,.075,.08);
    let s=H*.01;var sum=0.;
    for(var j=0;j<7;j++){let w=H*BW[j]*.5;sum+=BA[j]*(1.-smoothstep(w-s,w+s,dl));}
    c+=K*sum;
  }
  return vec4f(c,1.);
}`;
const BGPU_U=new Float32Array(60);
/* соседи граней: по три на грань (ребро 0-1, 1-2, 2-0), -1 — нет. Наборы граней общие
   на все камни (ICO_F, SPHERE, SPHERE2) — считается трижды за игру */
const BGPU_ADJ=new WeakMap();
function beltGpuAdj(F){
  let A=BGPU_ADJ.get(F);if(A)return A;
  A=new Int32Array(F.length*3).fill(-1);const E=new Map();
  for(let fi=0;fi<F.length;fi++)for(let e=0;e<3;e++){
    const a=F[fi][e],b=F[fi][(e+1)%3],k=a<b?a+","+b:b+","+a,o=E.get(k);
    if(o===undefined)E.set(k,fi*3+e);else{A[fi*3+e]=(o/3)|0;A[o]=fi;}
  }
  BGPU_ADJ.set(F,A);return A;
}
function beltGpuDraw(){
  const pass=gpuScene();if(!pass)return false;
  const b=G.belt,st=stat();
  const bas=beltBasis(b),fwd=bas.fwd,right=bas.right,up=bas.up;
  const cam=[b.x,b.y,b.z],F=Math.min(W,H)*.95;
  function proj(px,py,pz){
    const vx=px-cam[0],vy=py-cam[1],vz=pz-cam[2];
    const zc=vx*fwd[0]+vy*fwd[1]+vz*fwd[2];
    if(zc<2)return null;
    const xc=vx*right[0]+vy*right[1]+vz*right[2];
    const yc=vx*up[0]+vy*up[1]+vz*up[2];
    return {x:W/2+xc*F/zc, y:H/2-yc*F/zc, z:zc};
  }
  const stl=sysStyle(G.sys),scol=hex2rgb(G.sys.cls.col),neb0=stl.neb[0],neb1=stl.neb[1];
  const sunP=proj(0,0,0),dsun=Math.hypot(b.x,b.y,b.z)||1;
  const SUN=[-b.x/dsun,-b.y/dsun,-b.z/dsun];
  /* ── небо ── */
  const U=BGPU_U;U.fill(0);
  for(let i=0;i<4;i++){
    const h=hashi(G.sys.seed,i,0x4EB0);
    const th=(h&1023)/1023*TAU, ph=((h>>>10)&511)/511*1.8-.9;
    const p=proj(b.x+Math.cos(ph)*Math.sin(th)*9000,b.y+Math.sin(ph)*9000,b.z+Math.cos(ph)*Math.cos(th)*9000);
    if(!p)continue;
    U[i*4]=p.x;U[i*4+1]=p.y;U[i*4+2]=W*(.5+((h>>>19)&7)/7*.6);U[i*4+3]=i&1;
  }
  U[16]=neb0[0]/255;U[17]=neb0[1]/255;U[18]=neb0[2]/255;U[20]=neb1[0]/255;U[21]=neb1[1]/255;U[22]=neb1[2]/255;
  U[28]=scol[0]/255;U[29]=scol[1]/255;U[30]=scol[2]/255;
  const sdx=SUN[0]*right[0]+SUN[1]*right[1]+SUN[2]*right[2];
  const sdy=-(SUN[0]*up[0]+SUN[1]*up[1]+SUN[2]*up[2]);
  if(sunP){U[24]=sunP.x;U[25]=sunP.y;U[26]=Math.max(6,W*.06*(2400/Math.max(600,dsun)));U[27]=1;}
  else{const dl=Math.hypot(sdx,sdy);
    if(dl>.05){U[24]=W/2+sdx/dl*W*.62;U[25]=H/2+sdy/dl*H*.62;U[26]=Math.max(W,H)*.7;U[27]=2;}}
  /* полоса: плоскость y=b.y через камеру; её экранная прямая a·x+b·y+c=0 */
  {const la=right[1]/F,lb=-up[1]/F,ll=Math.hypot(la,lb);
    if(ll>1e-7){U[32]=la/ll;U[33]=lb/ll;U[34]=(fwd[1]-la*W/2-lb*H/2)/ll;U[35]=1;}
    const sl=Math.hypot(sdx,sdy)||1,gx=W/2+sdx/sl*W*.7,gy=H/2+sdy/sl*H*.7;
    U[36]=W-gx;U[37]=H-gy;U[38]=gx;U[39]=gy;U[40]=Math.hypot(gx*2-W,gy*2-H)<90?1:0;}
  gpuField(pass,"belt.sky",BGPU_SKY,U);
  /* ── звёзды, дальний план, пыль ── */
  const SH=[],on=(p,m)=>p&&p.x>-m&&p.y>-m&&p.x<W+m&&p.y<H+m;
  for(const s of BG){
    const th=s.x*TAU, ph=(s.y-.5)*2.4;
    const p=proj(b.x+Math.cos(ph)*Math.sin(th)*9000,b.y+Math.sin(ph)*9000,b.z+Math.cos(ph)*Math.cos(th)*9000);
    if(on(p,2))SH.push([0,p.x,p.y,p.x+1.3,p.y+1.3,0,0,185,212,235,.5]);
  }
  for(const f of b.far||[]){
    const p=proj(f.x,f.y,f.z);
    if(!p||p.z<2400||!on(p,4))continue;
    const sz=clamp(f.s*2600/p.z,.8,3);
    SH.push([0,p.x,p.y,p.x+sz,p.y+sz,0,0,150,158,170,+clamp(1-p.z/11000,.08,.5).toFixed(2)]);
  }
  const spd=Math.hypot(b.vx,b.vy,b.vz);
  for(const d of b.dust){
    const p=proj(d.x,d.y,d.z);
    if(!p)continue;
    const k=clamp(1-p.z/DUST_HALF,0,1),al=+(k*.5).toFixed(2);
    if(al<.03)continue;
    const sz=1+k*k*2.2;
    if(k>.5&&spd>.6){
      const q=proj(d.x-b.vx*3,d.y-b.vy*3,d.z-b.vz*3);
      if(q){const l=Math.hypot(q.x-p.x,q.y-p.y)/2;
        if(l>.01)SH.push([4,(p.x+q.x)/2,(p.y+q.y)/2,l,sz*.4,Math.atan2(q.y-p.y,q.x-p.x),0,200,215,230,+(al*.7).toFixed(2)]);continue;}
    }
    SH.push([0,p.x,p.y,p.x+sz,p.y+sz,0,0,200,215,230,al]);
  }
  gpuShapes(pass,SH);
  /* ── грани скал и ориентиры, по глубине вместе ── */
  const polys=[];
  function meshPolys(o,ox,oy,oz,rad,lod,alpha,oreCol,rock,locked){
    const L=o.mesh.lods[lod],nV=L.nv,sc=rad/o.r0,Fc=L.faces,adj=beltGpuAdj(Fc);
    const c1=Math.cos(o.rx),s1=Math.sin(o.rx),c2=Math.cos(o.ry),s2=Math.sin(o.ry);
    const wv=new Array(nV),pv=new Array(nV);
    for(let i=0;i<nV;i++){
      const v=o.mesh.verts[i];
      let y=v[1]*c1-v[2]*s1, z=v[1]*s1+v[2]*c1;
      let x=v[0]*c2+z*s2; z=-v[0]*s2+z*c2;
      wv[i]=[ox+x*sc,oy+y*sc,oz+z*sc];
      pv[i]=proj(wv[i][0],wv[i][1],wv[i][2]);
    }
    const vis=new Uint8Array(Fc.length);
    for(let fi=0;fi<Fc.length;fi++){
      const f=Fc[fi],A=pv[f[0]],B2=pv[f[1]],C=pv[f[2]];
      if(A&&B2&&C&&(B2.x-A.x)*(C.y-A.y)-(B2.y-A.y)*(C.x-A.x)>0)vis[fi]=1;
    }
    for(let fi=0;fi<Fc.length;fi++){
      if(!vis[fi])continue;
      const f=Fc[fi],A=pv[f[0]],B2=pv[f[1]],C=pv[f[2]];
      const wa=wv[f[0]],wb=wv[f[1]],wc=wv[f[2]];
      const ux=wb[0]-wa[0],uy=wb[1]-wa[1],uz=wb[2]-wa[2];
      const vx2=wc[0]-wa[0],vy2=wc[1]-wa[1],vz2=wc[2]-wa[2];
      let nx=uy*vz2-uz*vy2, ny=uz*vx2-ux*vz2, nz=ux*vy2-uy*vx2;
      const nl=Math.hypot(nx,ny,nz)||1;nx/=nl;ny/=nl;nz/=nl;
      const li=clamp(nx*SUN[0]+ny*SUN[1]+nz*SUN[2],0,1)*L.tint[fi];
      const vw=(wa[0]+wb[0]+wc[0])/3-cam[0],vw2=(wa[1]+wb[1]+wc[1])/3-cam[1],vw3=(wa[2]+wb[2]+wc[2])/3-cam[2];
      const vl=Math.hypot(vw,vw2,vw3)||1;
      const rim=Math.pow(1-Math.abs(nx*vw/vl+ny*vw2/vl+nz*vw3/vl),3.2);
      /* ребро к видимой соседке — жёсткое: шва между гранями нет */
      const m=(vis[adj[fi*3]]&&adj[fi*3]>=0?1:0)|(adj[fi*3+1]>=0&&vis[adj[fi*3+1]]?2:0)|(adj[fi*3+2]>=0&&vis[adj[fi*3+2]]?4:0);
      polys.push({A,B:B2,C,d:(A.z+B2.z+C.z)/3,li,rim,ore:L.ore[fi],oreCol,rock,locked,alpha,edge:lod===2,fi,m});
    }
  }
  for(const a of b.ast){
    const d=Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
    if(d>3000*G.opts.gfx.draw)continue;
    const lod=d<a.r*3.4*G.opts.gfx.detail?2:(d<a.r*11*G.opts.gfx.detail?1:0);
    meshPolys({mesh:a.mesh,rx:a.rx,ry:a.ry,r0:a.r},a.x,a.y,a.z,a.r,lod,1,a.oreCol,a.mesh.rock,a===b.lock);
  }
  for(const c of b.chunks){
    const d=Math.hypot(c.x-b.x,c.y-b.y,c.z-b.z);
    if(d>1800*G.opts.gfx.draw)continue;
    meshPolys({mesh:c.mesh,rx:c.rx,ry:c.ry,r0:c.pr},c.x,c.y,c.z,c.r,d<220?1:0,clamp(c.life*1.7,0,1),c.ore,c.mesh.rock,false);
  }
  for(const q of b.poi||[]){
    const p=proj(q.x,q.y,q.z);
    if(!p)continue;
    const sc=F/p.z;
    if(q.size*sc<2)continue;
    polys.push({spr:q,px:p.x,py:p.y,sc,d:p.z});
  }
  polys.sort((p,q)=>q.d-p.d);
  BELT_STROKES=0;
  let T=[];
  const c255=v=>v<0?0:v>255?255:v|0;
  for(const p of polys){
    if(p.spr){gpuShapes(pass,T);T=[];beltPoiGpu(pass,p.spr,p.px,p.py,p.sc,clamp(1-p.d/3400,.12,1));continue;}
    const vein=p.ore>.57,base=vein?p.oreCol:p.rock;
    const k=.15+Math.pow(p.li,1.3)*(vein?1.42:1.10);
    const fog=clamp(1-p.d/2600,.1,1);
    const wl=p.li*p.li*(vein?.16:.11);
    let r=(base[0]*k*(scol[0]/230)+neb0[0]*.22+p.rim*52+scol[0]*wl)*fog,
        g=(base[1]*k*(scol[1]/230)+neb0[1]*.22+p.rim*55+scol[1]*wl*.82)*fog,
        bl=(base[2]*k*(scol[2]/230)+neb0[2]*.28+p.rim*62+scol[2]*wl*.55)*fog;
    if(p.locked){r=r*.82+26;g=g*.82+52;bl=bl*.82+50;}
    const al=p.alpha;
    T.push([5,p.A.x,p.A.y,p.B.x,p.B.y,p.C.x,p.C.y,c255(r),c255(g),c255(bl),al,p.m]);
    if(p.edge&&vein){
      const bc=[base[0]|0,base[1]|0,base[2]|0],ea=.4*al;
      T.push([2,p.A.x,p.A.y,p.B.x,p.B.y,.5,0,bc[0],bc[1],bc[2],ea],[2,p.B.x,p.B.y,p.C.x,p.C.y,.5,0,bc[0],bc[1],bc[2],ea],
        [2,p.C.x,p.C.y,p.A.x,p.A.y,.5,0,bc[0],bc[1],bc[2],ea]);
    }
    if(p.edge&&BELT_STROKES<140){
      const abx=p.B.x-p.A.x,aby=p.B.y-p.A.y,acx=p.C.x-p.A.x,acy=p.C.y-p.A.y;
      const area=Math.abs(abx*acy-aby*acx)*.5;
      if(area>150&&p.li>.34){
        const cx3=(p.A.x+p.B.x+p.C.x)/3, cy3=(p.A.y+p.B.y+p.C.y)/3;
        const e1=abx*abx+aby*aby, e2=acx*acx+acy*acy, bcx=p.C.x-p.B.x,bcy=p.C.y-p.B.y, e3=bcx*bcx+bcy*bcy;
        let dx=abx,dy=aby;if(e2>e1&&e2>=e3){dx=acx;dy=acy;}else if(e3>e1){dx=bcx;dy=bcy;}
        const el=Math.hypot(dx,dy)||1;dx/=el;dy/=el;
        const hh=hashi(p.fi,(p.d*7)|0,0xB317),ln=clamp(el*.22,3,13),sa=(p.li>.7?.20:.13)*al;
        for(let s2=0;s2<2;s2++){
          const ox2=((hh>>>(s2*5))&15)/15-.5, oy2=((hh>>>(s2*5+8))&15)/15-.5;
          T.push([2,cx3+ox2*el*.3-dx*ln*.5,cy3+oy2*el*.22-dy*ln*.5,cx3+ox2*el*.3+dx*ln*.5,cy3+oy2*el*.22+dy*ln*.5,.5,0,0,0,0,sa]);
          BELT_STROKES++;
        }
        if(p.li>.84){T.push([2,cx3-dx*3.5,cy3-dy*3.5,cx3+dx*3.5,cy3+dy*3.5,.7,0,255,250,236,.42*al]);BELT_STROKES++;}
      }
    }
  }
  gpuShapes(pass,T);
  /* ── живое: роща, трассеры, выстрелы, вспышка, резак ── */
  const AD=[],OV=[];
  /* штрих 2D (lineCap butt) — повёрнутый прямоугольник: без круглых концов */
  const seg=(x0,y0,x1,y1,hw,r,g,bb,a)=>{const l=Math.hypot(x1-x0,y1-y0)/2;
    if(l>.01)OV.push([4,(x0+x1)/2,(y0+y1)/2,l,hw,Math.atan2(y1-y0,x1-x0),0,r,g,bb,a]);};
  for(const a of b.grove||[]){
    const p=proj(a.x,a.y,a.z);if(!p)continue;
    const sc=F/p.z,rr=Math.max(3,a.r*sc*1.35),al=(.22+.4*(a.gl||0))*clamp(1-p.z/2600,.1,1);
    AD.push([1,p.x,p.y,rr*.3,0,0,rr*.7,150,235,180,al]);
  }
  for(const m of b.msl||[]){
    const p=proj(m.x,m.y,m.z),q=proj(m.x-m.vx*4,m.y-m.vy*4,m.z-m.vz*4);
    if(!p||!q)continue;
    const hw=clamp(420/p.z,1.2,5)/2;
    /* градиент хвоста — четыре куска от головы к хвосту */
    for(let i=0;i<4;i++){const t0=i/4,t1=(i+1)/4,tm=(t0+t1)/2;
      seg(lerp(p.x,q.x,t0),lerp(p.y,q.y,t0),lerp(p.x,q.x,t1),lerp(p.y,q.y,t1),hw,255,lerp(214,120,tm)|0,lerp(150,60,tm)|0,.95*(1-tm));}
    OV.push([1,p.x,p.y,clamp(300/p.z,1,3.2),0,0,0,232,236,242,1]);
  }
  for(const s of b.shots){
    const p=proj(s.x,s.y,s.z),q=proj(s.x-s.vx*2.2,s.y-s.vy*2.2,s.z-s.vz*2.2);
    if(!p||!q)continue;
    seg(p.x,p.y,q.x,q.y,clamp(260/p.z,1,3.4)/2,190,250,240,.9);
  }
  if(b.flash>0){const a=b.flash/6;
    for(const off of [-1,1])OV.push([1,W/2+off*W*.13,H*.8,0,0,0,60,200,255,245,+(a*.5).toFixed(2)]);}
  if(b.lock&&b.beam){
    const t=proj(b.lock.x,b.lock.y,b.lock.z);
    if(t){const gx=W/2,gy=H*.86;
      for(const off of [-16,16])seg(gx+off,gy,t.x,t.y,1.1,242,178,92,+(.45+rndFx()*.5).toFixed(2));
      for(let i=0;i<5;i++){const u=rndFx(),x=lerp(t.x,gx,u),y=lerp(t.y,gy,u);OV.push([0,x,y,x+2,y+2,0,0,255,220,150,.85]);}}
  }
  if(AD.length)gpuShapes(pass,AD,{blend:"add"});
  gpuShapes(pass,OV);
  drawGlassHUD(b,proj,fwd,st);
  drawCockpit(b,st);
  return true;
}
