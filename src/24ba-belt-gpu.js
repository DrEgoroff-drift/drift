/* ══════════════ пояс на видеокарте (GPU, ступени 2 и G8) ══════════════
   Кадр пояса целиком в проходе сцены: небо со звёздами одним полем (фон, пятна
   туманности, светило или его зарево, полоса пояса, звёзды по направлению луча),
   дальние камни — фигурами, камни и обломки — настоящим 3D с глубиной и светом по
   пикселю (24be), пыль у стекла — там же, за камнями она прячется; ориентиры (24bb)
   — фигурами между камнями: каждый режет список камней по глубине.
   Кабина и стекло — на слое приборов #hud (24bc).

   Что стало лучше, а не только перенесено:
   · полоса пояса — прямая (кольцо вокруг камеры в её плоскости проецируется в
     прямую), и семь ступеней ширины кладутся с мягкими краями: лесенки нет;
   · звёзды — не 340 одинаковых точек, а сфера из клеток: у каждой своя яркость и
     цвет (от голубых до тёплых), мелких много, ярких мало; ни одна не мерцает;
   · камень — масса: освещённая сторона к светилу, мягкий терминатор, тень в отсвете
     туманности, зерно и жилы по пикселю вместо 2D-штрихов по граням. */

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
  let Rr=fu.v[11];let Uu=fu.v[12];let Ff=fu.v[13];
  if(Rr.w>0.){
    let dr=normalize(Ff.xyz+(Rr.xyz*(p.x-fu.res.z*.5)-Uu.xyz*(p.y-fu.res.w*.5))/Rr.w);
    c+=bStars(dr,96.,u32(Uu.w)*7u+1u,.030,Rr.w,.75)+bStars(dr,34.,u32(Uu.w)*7u+2u,.040,Rr.w,1.9);
  }
  return vec4f(c,1.);
}
fn bHash(i:u32,s:u32)->f32{var h=(i*374761393u)^(s*668265263u);h=(h^(h>>13u))*1274126177u;h=h^(h>>16u);h=h*2246822519u;return f32(h^(h>>13u))/4294967296.;}
/* звёзды: куб граней-клеток с равным углом (atan), в клетке не больше одной, всегда внутри
   своей клетки — соседей смотреть не нужно. dens — доля занятых клеток, big — предел размера */
fn bStars(d:vec3f,N:f32,s:u32,dens:f32,F:f32,big:f32)->vec3f{
  let a=abs(d);var f=0u;var uv=vec2f(0.);
  if(a.x>=a.y&&a.x>=a.z){f=select(1u,0u,d.x>0.);uv=d.yz/a.x;}
  else if(a.y>=a.z){f=select(3u,2u,d.y>0.);uv=d.xz/a.y;}
  else{f=select(5u,4u,d.z>0.);uv=d.xy/a.z;}
  let g=(atan(uv)*1.2732395*.5+.5)*N;let cl=floor(g);
  let id=u32(cl.x)+u32(cl.y)*1024u+f*1048576u;
  if(bHash(id,s)>dens){return vec3f(0.);}
  let sp=(cl+.28+.44*vec2f(bHash(id,s+11u),bHash(id,s+23u)))/N*2.-1.;
  let w=tan(sp*.7853982);let sg=select(-1.,1.,f%2u==0u);
  var ds=vec3f(sg,w.x,w.y);if(f>=4u){ds=vec3f(w.x,w.y,sg);}else if(f>=2u){ds=vec3f(w.x,sg,w.y);}
  ds=normalize(ds);
  let px=length(cross(d,ds))*F;
  let m=pow(bHash(id,s+37u),5.);let t=bHash(id,s+51u);
  let sig=.5+big*.5*m;
  let k=(.22+2.1*m)*exp(-px*px/(sig*sig))*min(1.,.8/sig);
  let tc=mix(vec3f(.70,.80,1.),vec3f(1.,.84,.64),t*t);
  return mix(tc,vec3f(1.),m*.5)*k;
}`;
const BGPU_U=new Float32Array(60);
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
  /* ── небо со звёздами — один проход ── */
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
  /* базис камеры — звёздам: направление луча пикселя считает поле */
  U[44]=right[0];U[45]=right[1];U[46]=right[2];U[47]=F;
  U[48]=up[0];U[49]=up[1];U[50]=up[2];U[51]=(G.sys.seed>>>0)%65521;
  U[52]=fwd[0];U[53]=fwd[1];U[54]=fwd[2];
  gpuField(pass,"belt.sky",BGPU_SKY,U);
  /* ── дальний план: камни за рабочей зоной — точки, лицом к светилу светлее ── */
  const SH=[],on=(p,m)=>p&&p.x>-m&&p.y>-m&&p.x<W+m&&p.y<H+m;
  for(const f of b.far||[]){
    const p=proj(f.x,f.y,f.z);
    if(!p||p.z<2400||!on(p,4))continue;
    const sz=clamp(f.s*2600/p.z,.8,3);
    SH.push([0,p.x,p.y,p.x+sz,p.y+sz,0,0,150,158,170,+clamp(1-p.z/11000,.08,.5).toFixed(2)]);
  }
  gpuShapes(pass,SH);
  /* ── камни (3D) и ориентиры: ориентир рвёт список камней по глубине ── */
  brockReset(b);
  const ub=brockCam(b,bas,F,scol,neb0,neb1),B=BROCK,ms=brockMs();
  const lim=3000*G.opts.gfx.draw,tx=W/(2*F),ty=H/(2*F),vis=BROCK_VIS;vis.length=0;
  const see=(x,y,z,r)=>{const vx=x-cam[0],vy=y-cam[1],vz=z-cam[2],zc=vx*fwd[0]+vy*fwd[1]+vz*fwd[2];
    if(zc<-r)return null;const rr=r*1.6,xc=vx*right[0]+vy*right[1]+vz*right[2],yc=vx*up[0]+vy*up[1]+vz*up[2];
    if(Math.abs(xc)>Math.max(zc,0)*tx+rr||Math.abs(yc)>Math.max(zc,0)*ty+rr)return null;return zc;};
  for(const a of b.ast){
    if(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)>lim)continue;
    const d=see(a.x,a.y,a.z,a.r);if(d===null)continue;
    vis.push({o:a,d,c:0});
  }
  for(const c of b.chunks){
    if(Math.hypot(c.x-b.x,c.y-b.y,c.z-b.z)>1800*G.opts.gfx.draw)continue;
    const d=see(c.x,c.y,c.z,c.r);if(d===null)continue;
    vis.push({o:c,d,c:1});
  }
  for(const q of b.poi||[]){
    if(q.k==="maw"){const d=see(q.x,q.y,q.z,q.size);if(d!==null)vis.push({o:beltMaw(q),d,c:2});continue;}
    const p=proj(q.x,q.y,q.z);
    if(!p)continue;
    const sc=F/p.z;
    if(q.size*sc<2)continue;
    vis.push({spr:q,px:p.x,py:p.y,sc,d:p.z});
  }
  vis.sort((p,q)=>q.d-p.d);
  /* свет на ориентирах (24bb): направление на звезду в осях камеры, z — к зрителю */
  {const L=BPOI_L;L.x=sdx;L.y=sdy;L.z=-(SUN[0]*fwd[0]+SUN[1]*fwd[1]+SUN[2]*fwd[2]);L.r=scol[0];L.g=scol[1];L.b=scol[2];}
  let g0=0;
  const flush=(g1,last)=>{
    B.ni=0;let nf=0;
    for(let i=g0;i<g1;i++){const v=vis[i];if(v.spr||v.c===1)continue;const a=v.o;
      if(v.c===2){const R=a.size*.8;brockPut(b,a.mesh,a.x,a.y,a.z,R,R,a.ph,a.ph*1.7+G.t*a.spin,1,a.mesh.rock,a.mesh.rock,false,a.mouth);continue;}
      brockPut(b,a.mesh,a.x,a.y,a.z,a.r,a.r,a.rx,a.ry,1,a.mesh.rock,a.oreCol,a===b.lock);}
    for(let i=g0;i<g1;i++){const v=vis[i];if(!v.c)continue;const c=v.o,al=clamp(c.life*1.7,0,1);
      if(al>=1)brockPut(b,c.mesh,c.x,c.y,c.z,c.r,c.pr,c.rx,c.ry,1,c.mesh.rock,c.ore,false);}
    const n1=B.ni;
    for(let i=g0;i<g1;i++){const v=vis[i];if(!v.c)continue;const c=v.o,al=clamp(c.life*1.7,0,1);
      if(al<1&&al>0){brockPut(b,c.mesh,c.x,c.y,c.z,c.r,c.pr,c.rx,c.ry,al,c.mesh.rock,c.ore,false);nf++;}}
    if(!B.ni&&!last)return;
    const p3=brockBegin(ms);
    brockDraw(p3,ub,0,n1,false,ms);
    brockDraw(p3,ub,n1,nf,true,ms);
    if(last)bdustDraw(p3,ub,beltDust(b,SUN,scol),ms);
    brockEnd(ms);
  };
  for(let i=0;i<vis.length;i++){
    const p=vis[i];if(!p.spr)continue;
    flush(i,false);g0=i+1;
    const pass=gpuScene();
    beltPoiGpu(pass,p.spr,p.px,p.py,p.sc,clamp(1-p.d/3400,.12,1));
  }
  flush(vis.length,true);
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
  const p2=gpuScene();
  if(AD.length)gpuShapes(p2,AD,{blend:"add"});
  gpuShapes(p2,OV);
  /* стекло и кабина — интерфейс: мастер и очередь слоя #ovl (24bc) */
  beltHudPush(b,proj,fwd,st,bas);
  return true;
}
const BROCK_VIS=[];
/* пыль у стекла в свете звезды: против светила пылинка светится (рассеяние вперёд,
   Хеньи — Гринстейн, g .4), по свету — тускнеет и остывает. Пишет в BROCK.D, отдаёт число */
function beltDust(b,SUN,scol){
  const bas=beltBasis(b),f=bas.fwd,spd=Math.hypot(b.vx,b.vy,b.vz),g=.4,p0=(1-g*g)/Math.pow(1+g*g,1.5);
  let D=BROCK.D,n=0;
  for(const d of b.dust){
    const x=d.x-b.x,y=d.y-b.y,z=d.z-b.z,zc=x*f[0]+y*f[1]+z*f[2];
    if(zc<2)continue;
    const k=clamp(1-zc/DUST_HALF,0,1);let al=k*.5;
    if(al<.03)continue;
    const l=Math.hypot(x,y,z)||1,cs=(x*SUN[0]+y*SUN[1]+z*SUN[2])/l;
    const ph=(1-g*g)/Math.pow(1+g*g-2*g*cs,1.5)/p0,m=clamp(.3+.7*ph,.3,3.2),w=clamp((ph-1)*.16,0,.55);
    const sz=1+k*k*2.2,streak=k>.5&&spd>.6;
    if((n+1)*12>D.length){const E=new Float32Array(D.length*2);E.set(D);BROCK.D=D=E;}
    const o=n*12;
    D[o]=x;D[o+1]=y;D[o+2]=z;D[o+3]=Math.min(.9,al*(streak?.7:1)*Math.min(m,2));
    D[o+4]=streak?b.vx*3:0;D[o+5]=streak?b.vy*3:0;D[o+6]=streak?b.vz*3:0;D[o+7]=streak?sz*.4:sz*.5;
    const c=Math.min(1.25,m);
    D[o+8]=Math.min(1,(200*(1-w)+scol[0]*w)/255*c);
    D[o+9]=Math.min(1,(215*(1-w)+scol[1]*w)/255*c);
    D[o+10]=Math.min(1,(230*(1-w)+scol[2]*w)/255*c);
    n++;
  }
  return n;
}
