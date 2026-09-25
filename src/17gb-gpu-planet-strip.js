/* ══════════════ развёртка планеты — шейдером на видеокарте (GPU-3, DESIGN-gpu §G, 25.09) ══════════════
   Развёртка (07: долгота поперёк, синус широты вдоль) считалась на процессоре точка за
   точкой — fbm2 по две микросекунды, сотня тысяч точек, — резалась по кадрам с бюджетом
   и ложилась в 2D-холст putImageData, а город (17ga) читал её обратно getImageData.
   Теперь её рисует один проход шейдера — та же формула, тот же хэш (hashi на u32),
   сразу нужного уровня; 2D-холста у планеты нет вовсе.

   Формула на процессоре остаётся одна — planetStripPx: по ней суша городов (gplLandAt,
   лениво по клеткам) и проба «шейдер = формула». Правишь формулу — правь обе. */
const GPS_BLEND=.14;
/* параметры уровня: всё, что в 07 держала работа пекарни, кроме самой работы */
function planetStripParams(p,lvl){
  const R=PLANET_RES[lvl],pal=p.T.pal,gas=p.type==="gas",life=!gas&&planetHasLife(p);
  const bi=life?planetBiome(p):null,hb=bi?bi.hueBias:0;
  return {p,lvl,SW:R*2,SH:R,pal,gas,life,np:pal.length-1,sd:p.seed,rough:p.rough,
    lf0:40+hb*90,lf1:96+hb*70,lf2:46+hb*60};
}
/* одна точка развёртки, как её считала пекарня 07 (цвет 0…255, дробный) */
function planetStripPx(J,x,y,out){
  const SW=J.SW,pal=J.pal,np=J.np,sd=J.sd;
  const sv=(y+.5)/J.SH*2-1,lat=Math.asin(clamp(sv,-1,1));
  const polar=Math.pow(Math.abs(lat)/1.5708,3.2)*.55;
  const f=(x+.5)/SW,blend=f>1-GPS_BLEND,w=blend?(f-(1-GPS_BLEND))/GPS_BLEND:0,s=blend?w*w*(3-2*w):0;
  let cr=0,cg=0,cb=0;
  for(let pass=0;pass<(blend?2:1);pass++){
    const lon=(f-pass)*TAU;let v;
    if(J.gas){
      v=fbm2(lon*.7+9,lat*7+3,sd,4);
      v=clamp(v*.6+.5*(.5+.5*Math.sin(lat*9+fbm2(lon*1.6,lat*3,sd+5,3)*4)),0,1);
    }else{
      v=fbm2(lon*2.4+11,lat*2.4+11,sd,5);
      v=clamp((v-.5)*(1+J.rough*.9)+.5,0,1);
      v=clamp(v+polar,0,1);
    }
    const t=clamp(v,0,.9999)*np,i=t|0,ft=t-i,a=pal[i],b=pal[i<np?i+1:np];
    let r=a[0]+(b[0]-a[0])*ft,g=a[1]+(b[1]-a[1])*ft,bl=a[2]+(b[2]-a[2])*ft;
    if(J.life){
      const wet=planetWetAt(J.p,lon,lat);
      const lush=clamp((wet-.42)*2.4,0,1)*clamp(1-(v-.55)*2.6,0,1);
      if(lush>.01){const k=lush*.72;r+=(J.lf0-r)*k;g+=(J.lf1-g)*k;bl+=(J.lf2-bl)*k;}
    }
    if(pass===0){cr=r;cg=g;cb=bl;}else{cr+=(r-cr)*s;cg+=(g-cg)*s;cb+=(bl-cb)*s;}
  }
  out[0]=cr;out[1]=cg;out[2]=cb;return out;
}
/* шейдер: точка текстуры = точка развёртки; хэш — hashi (01) на u32, lerp — как в 01, не mix */
const GPS_WGSL=`
struct U{a:vec4f,b:vec4f,l:vec4f,c:vec4u,pal:array<vec4f,8>};
@group(0) @binding(0) var<uniform> u:U;
@vertex fn vs(@builtin(vertex_index) i:u32)->@builtin(position) vec4f{
  let p=array(vec2f(-1.,-1.),vec2f(3.,-1.),vec2f(-1.,3.));return vec4f(p[i],0.,1.);}
fn hashi(x:i32,y:i32,s:u32)->u32{
  var h=(bitcast<u32>(x)*374761393u)^(bitcast<u32>(y)*668265263u)^(s*1442695041u);
  h=(h^(h>>13u))*1274126177u;return h^(h>>16u);}
fn h01(x:i32,y:i32,s:u32)->f32{return f32(hashi(x,y,s))/4294967296.;}
fn lrp(a:f32,b:f32,t:f32)->f32{return a+(b-a)*t;}
fn noise2(x:f32,y:f32,s:u32)->f32{
  let xi=floor(x);let yi=floor(y);let xf=x-xi;let yf=y-yi;
  let uu=xf*xf*(3.-2.*xf);let vv=yf*yf*(3.-2.*yf);let X=i32(xi);let Y=i32(yi);
  return lrp(lrp(h01(X,Y,s),h01(X+1,Y,s),uu),lrp(h01(X,Y+1,s),h01(X+1,Y+1,s),uu),vv);}
fn fbm2(x:f32,y:f32,s:u32,oct:i32)->f32{
  var v=0.;var a=.5;var f=1.;var n=0.;
  for(var i=0;i<oct;i++){v+=a*noise2(x*f,y*f,s+u32(i)*97u);n+=a;a*=.5;f*=2.;}
  return v/n;}
@fragment fn fs(@builtin(position) q:vec4f)->@location(0) vec4f{
  let SW=u.a.x;let SH=u.a.y;let np=u.a.z;let gas=u.a.w>.5;let life=u.b.x>.5;let rough=u.b.y;
  let sd=u.c.x;let wsd=u.c.y;let lf=u.l.xyz;
  let x=floor(q.x);let y=floor(q.y);
  let lat=asin(clamp((y+.5)/SH*2.-1.,-1.,1.));
  let al=max(abs(lat)/1.5708,1e-9);let polar=pow(al,3.2)*.55;
  let f=(x+.5)/SW;let blend=f>1.-${GPS_BLEND};let w=select(0.,(f-(1.-${GPS_BLEND}))/${GPS_BLEND},blend);
  let s=select(0.,w*w*(3.-2.*w),blend);
  var c=vec3f(0.);
  let nk=select(1,2,blend);
  for(var k=0;k<nk;k++){
    let lon=(f-f32(k))*6.283185307179586;var v:f32;
    if(gas){
      v=fbm2(lon*.7+9.,lat*7.+3.,sd,4);
      v=clamp(v*.6+.5*(.5+.5*sin(lat*9.+fbm2(lon*1.6,lat*3.,sd+5u,3)*4.)),0.,1.);
    }else{
      v=fbm2(lon*2.4+11.,lat*2.4+11.,sd,5);
      v=clamp((v-.5)*(1.+rough*.9)+.5,0.,1.);
      v=clamp(v+polar,0.,1.);
    }
    let t=clamp(v,0.,.9999)*np;let i=i32(floor(t));let ft=t-f32(i);
    let A=u.pal[i].xyz;let B=u.pal[min(i+1,i32(np))].xyz;
    var col=A+(B-A)*ft;
    if(life){
      let wet=clamp(fbm2(lon*1.7+41.,lat*1.7+41.,wsd,4)*1.15-pow(al,1.6)*.45,0.,1.);
      let lush=clamp((wet-.42)*2.4,0.,1.)*clamp(1.-(v-.55)*2.6,0.,1.);
      if(lush>.01){let e=lush*.72;col=col+(lf-col)*e;}
    }
    if(k==0){c=col;}else{c=c+(col-c)*s;}
  }
  return vec4f(c/255.,1.);
}`;
const GPS={pipe:null,dev:null,U:new ArrayBuffer(192)};
function gpsPipe(){
  const d=GPU.dev;if(GPS.pipe&&GPS.dev===d)return GPS.pipe;
  GPS.pipe=gpuPipeline("gps",()=>{const m=gpuShader(GPS_WGSL);return {layout:"auto",vertex:{module:m,entryPoint:"vs"},
    fragment:{module:m,entryPoint:"fs",targets:[{format:"rgba8unorm"}]},primitive:{topology:"triangle-list"}};});
  GPS.dev=d;return GPS.pipe;
}
/* выпечка уровня: один проход, своя отправка (как gpuBake 08ca) — уровень готов к кадру */
function gpsBake(p,lvl){
  if(!GPU.dev)return null;
  const t0=wallMs(),J=planetStripParams(p,lvl),d=GPU.dev,U=GPUTextureUsage;
  const tex=d.createTexture({size:[J.SW,J.SH],format:"rgba8unorm",usage:U.TEXTURE_BINDING|U.RENDER_ATTACHMENT|U.COPY_SRC});
  const F=new Float32Array(GPS.U),I=new Uint32Array(GPS.U);
  F[0]=J.SW;F[1]=J.SH;F[2]=J.np;F[3]=J.gas?1:0;F[4]=J.life?1:0;F[5]=J.rough;F[6]=F[7]=0;
  F[8]=J.lf0;F[9]=J.lf1;F[10]=J.lf2;F[11]=0;
  I[12]=J.sd>>>0;I[13]=(J.sd^0x5EA1)>>>0;I[14]=I[15]=0;
  for(let i=0;i<8;i++){const c=J.pal[Math.min(i,J.np)];F[16+i*4]=c[0];F[17+i*4]=c[1];F[18+i*4]=c[2];F[19+i*4]=0;}
  const ub=d.createBuffer({size:192,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});d.queue.writeBuffer(ub,0,GPS.U);
  const P=gpsPipe(),enc=d.createCommandEncoder();
  const ps=enc.beginRenderPass({colorAttachments:[{view:tex.createView(),loadOp:"clear",clearValue:{r:0,g:0,b:0,a:1},storeOp:"store"}]});
  ps.setPipeline(P);ps.setBindGroup(0,d.createBindGroup({layout:P.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:ub}}]}));
  ps.draw(3);ps.end();d.queue.submit([enc.finish()]);GPU.trash.push(ub);
  GPU.bakeN=(GPU.bakeN||0)+1;GPU.bakeMs=(GPU.bakeMs||0)+(wallMs()-t0);
  return {tex,view:tex.createView(),w:J.SW,h:J.SH,lvl,p,dev:d};
}
function planetStripDrop(p){
  const S=p.strip;if(S&&S.tex&&S.dev===GPU.dev)GPU.trash.push(S.tex);
  p.strip=null;p.stripLvl=-1;
}
