/* ══════════════ туманность: кэш полей дальнего сведения (24.10, телефон) ══════════════
   GNB_FARC (16gay) — прожилки пыли, гребни, пряди кромки — зависит только от точки мира
   X = p + cam·.09 (пиксели CSS): ни газа, ни звезды в этих полях нет. Значит, их можно посчитать
   один раз и возить вместе с камерой. Кэш — тор размером кадр + 4 px по каждой оси, тексель —
   пиксель CSS; мировой тексель k лежит в ячейке k mod S, лишний столбец и строка (S) повторяют
   нулевые — билинейная выборка через шов не рвётся. За кадр дорисовываются только новые столбцы
   и строки (на ходу — один-два), целиком — при смене системы, размера кадра, устройства и
   прыжке камеры дальше кадра.
   В кэше поля ДО изгибов: расстояние до нулевой линии (fp, hp, пиксели CSS, обрезано ±64 —
   формы прожилок нулевые уже за ±16), сырой шум гребней (R1 rl, R2 rf, R3 rr), гладкие маски
   (M1, M4, rc). Изгибы (1−|2x−1|, степени, ступени) — в сведении после выборки: прожилка у
   звезды остаётся резкой. Было ~45 выборок шума на пиксель газа, стало 2 выборки и 3 шума
   (S23 на ×2, без FARC — −4.5 мс из 11.5 сведения). */
const GNB_FARC_BAKE=GNB_TILE+`
struct KU{a:vec4f,b:vec4f};
@group(0) @binding(0) var<uniform> ku:KU;
@group(0) @binding(1) var smp:sampler;
@group(0) @binding(2) var t1:texture_2d<f32>;
struct KO{@location(0) a:vec4f,@location(1) b:vec4f};
@vertex fn vs(@builtin(vertex_index) i:u32)->@builtin(position) vec4f{
  var P=array(vec2f(-1.,-1.),vec2f(3.,-1.),vec2f(-1.,3.));return vec4f(P[i],0.,1.);}
@fragment fn fs(@builtin(position) q:vec4f)->KO{
  /* ячейка тора → мировой тексель окна [k0, k0+S): столбец S — копия нулевого */
  let S=ku.b.zw;let k0=ku.b.xy;
  let tq=floor(q.xy);let tm=tq-S*floor(tq/S);let r=tm-k0;
  let X=k0+r-S*floor(r/S)+.5;
  let H=ku.a.y;
  let qd=(X-ku.a.xy*.5)/H*3.6+ku.a.z+vec2f(2.,13.);
  let wv=vec2f(gnt(qd*.5),gnt(qd*.5+vec2f(7.,3.)))*1.8;
  let R1=fbt(qd*1.7+wv,3);let R2=fbt(qd*2.3+wv*1.4+vec2f(5.,1.),3);
  /* прожилки: вторая октава с другим периодом ломает ровную извилину; шаг поля — 1 px разностью */
  let qa=qd*1.9+wv*1.2+vec2f(3.,8.);let e1=1.9*3.6/H;let qc=qa*2.63+vec2f(1.7,6.1);let e3=e1*2.63;
  let f0=fbt(qa,3)-.5+.38*(fbt(qc,2)-.5);
  let gx=fbt(qa+vec2f(e1,0.),3)-.5+.38*(fbt(qc+vec2f(e3,0.),2)-.5)-f0;
  let gy=fbt(qa+vec2f(0.,e1),3)-.5+.38*(fbt(qc+vec2f(0.,e3),2)-.5)-f0;
  let fp=clamp(f0/max(length(vec2f(gx,gy)),1e-5),-64.,64.);
  let M1=smoothstep(.44,.58,gnt(qd*2.4+vec2f(6.,3.)))*(.45+.55*gnt(qd*5.1+vec2f(1.,9.)));
  let qb=qd*3.3+wv*1.6+vec2f(9.,1.);let e2=3.3*3.6/H;
  let h0=fbt(qb,3)-.5;let hx=fbt(qb+vec2f(e2,0.),3)-.5-h0;let hy=fbt(qb+vec2f(0.,e2),3)-.5-h0;
  let hp=clamp(h0/max(length(vec2f(hx,hy)),1e-5),-64.,64.);
  let M4=smoothstep(.46,.6,gnt(qd*3.9+vec2f(13.,2.)))*(.45+.55*gnt(qd*7.3+vec2f(4.,6.)));
  let q0=qd*6.+wv*3.;let w2=vec2f(gnt(q0*.4+vec2f(1.,5.)),gnt(q0*.4+vec2f(8.,2.)))*4.;let qs=q0+w2+vec2f(9.,2.);
  let R3=fbt(qs,3)*.62+fbt(qs*2.37+w2*.6+vec2f(4.,1.),2)*.38;
  let rc=smoothstep(.34,.6,gnt(q0*.33+w2*.2+vec2f(3.,12.)));
  var o:KO;o.a=vec4f(fp,hp,R1,R2);o.b=vec4f(R3,rc,M1,M4);return o;}`;
function gnbFarcDesc(){const m=gpuShader(GNB_FARC_BAKE);return {layout:"auto",vertex:{module:m,entryPoint:"vs"},
    fragment:{module:m,entryPoint:"fs",targets:[{format:"rgba16float"},{format:"rgba16float"}]},primitive:{topology:"triangle-list"}};}
/* дорисовать кэш под камеру этого кадра (GNB.C уже заполнен). Отдельный проход — до прохода сцены */
function gnbFarc(){
  const d=GPU.dev,F=GNB.F||(GNB.F={dev:null});
  const Sx=Math.ceil(W)+4,Sy=Math.ceil(H)+4,seed=GNB.C[3];
  /* окно — как в шейдере: камера в униформе f32 */
  const kx=Math.floor(Math.fround(GNB.C[0])*.09-.5)-1,ky=Math.floor(Math.fround(GNB.C[1])*.09-.5)-1;
  let full=false;
  if(F.dev!==d||F.Sx!==Sx||F.Sy!==Sy){
    if(F.dev===d){GPU.trash.push(F.ta);GPU.trash.push(F.tb);}
    const U=GPUTextureUsage,mk=()=>d.createTexture({size:[Sx+1,Sy+1],format:"rgba16float",usage:U.TEXTURE_BINDING|U.RENDER_ATTACHMENT});
    F.ta=mk();F.tb=mk();F.va=F.ta.createView();F.vb=F.tb.createView();F.dev=d;F.Sx=Sx;F.Sy=Sy;full=true;
  }
  if(F.W!==W||F.H!==H||F.seed!==seed)full=true;
  const dx=kx-F.kx,dy=ky-F.ky;
  if(!full&&dx===0&&dy===0)return;
  if(!(Math.abs(dx)<Sx&&Math.abs(dy)<Sy))full=true;
  /* мировые столбцы [a,b) → прямоугольники тора; задет нулевой — и копия в столбце S */
  const R=[],md=(a,n)=>((a%n)+n)%n;
  const span=(a,b,n,put)=>{const s=md(a,n),m=b-a;
    if(s+m<=n)put(s,m);else{put(s,n-s);put(0,s+m-n);}
    if(s===0||s+m>n)put(n,1);};
  if(full)R.push([0,0,Sx+1,Sy+1]);
  else{
    if(dx>0)span(F.kx+Sx,kx+Sx,Sx,(s,m)=>R.push([s,0,m,Sy+1]));
    if(dx<0)span(kx,F.kx,Sx,(s,m)=>R.push([s,0,m,Sy+1]));
    if(dy>0)span(F.ky+Sy,ky+Sy,Sy,(s,m)=>R.push([0,s,Sx+1,m]));
    if(dy<0)span(ky,F.ky,Sy,(s,m)=>R.push([0,s,Sx+1,m]));
  }
  const u=F.u||(F.u=new Float32Array(8));u[0]=W;u[1]=H;u[2]=seed;u[3]=0;u[4]=kx;u[5]=ky;u[6]=Sx;u[7]=Sy;
  const ub=gpuBuf("gnb.farc.u",32,GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST);d.queue.writeBuffer(ub,0,u);
  const P=GPU.lay["gnb.farc"]||(GPU.lay["gnb.farc"]=gpuPipeline("gnb.farc",gnbFarcDesc));
  const p=GPU.enc.beginRenderPass({colorAttachments:[{view:F.va,loadOp:"load",storeOp:"store"},{view:F.vb,loadOp:"load",storeOp:"store"}],
    timestampWrites:gpuTs("nebFarc")});
  p.setPipeline(P);p.setBindGroup(0,gpuBind("gnb.farc",P,[ub,GPU.S.lin,gnbNoiseTile()]));
  for(const r of R){p.setScissorRect(r[0],r[1],r[2],r[3]);p.draw(3);}
  p.end();
  F.kx=kx;F.ky=ky;F.W=W;F.H=H;F.seed=seed;F.n=(F.n|0)+1;
}
