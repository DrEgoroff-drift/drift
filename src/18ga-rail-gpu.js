/* ══════════════ поездка: свет видеокартой (G12) ══════════════
   Что в поездке светится, рисует видеокарта; остановки, имена, вагон и строка
   сверху остаются кистью 2D. Порядок кадра (drawRail, 18g):
   1. фон — прямоугольник в проходе сцены, ПОД всем 2D. Прежде 2D заливал #c
      непрозрачным, и мировая галактика, уехав на видеокарту (G10), оказалась
      бы под этой заливкой;
   2. галактика, звёзды и прочие линии — как на карте (17z1, 18e);
   3. gpuOver: над галактикой своя линия СВЕТОМ (ореол сложением, полотно,
      осевая), ток бежит по линии, ореол гуще у вагона;
   4. 2D: засечки остановок, имена, вагон;
   5. второй gpuOver: конус фары, вспышка гипера и росчерки перегона полем
      railFx — свет ложится ПОВЕРХ вагона, как у прежней 2D-вспышки;
   6. 2D: строка сверху.
   Что стало лучше: линия не черта, а рельс под током — ореол гуще у вагона и
   бежит вперёд по ходу; на перегоне звёзды вокруг вытягиваются в росчерки по
   ходу (поезд прыгает — теперь это видно всё время, а не только вспышкой);
   конус фары — мягкий свет со спадом, а не залитый клин; вспышка — свет с
   лучом, у которого есть ядро, а не квадрат градиента. */
const RAIL_FX_WGSL=`
fn rfH(p:vec2f)->f32{var q=fract(vec3f(p.xyx)*.1031);q=q+dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
fn field(p:vec2f,uv:vec2f)->vec4f{
  let T=fu.v[0];let F=fu.v[1];let C=fu.v[2].xyz;
  let d=p-T.xy;let ca=cos(T.z);let sa=sin(T.z);
  let x=d.x*ca+d.y*sa;let y=-d.x*sa+d.y*ca;
  var col=vec3f(0.);
  /* конус фары: от носа вперёд, мягкие края, спад с дальностью */
  let z=T.w;
  if(x>8.*z){
    let L=78.*z;let u=(x-8.*z)/L;
    let hw=2.5*z+u*17.*z;
    let e=1.-smoothstep(hw*.55,hw,abs(y));
    col=col+vec3f(1.,.957,.824)*e*(1.-smoothstep(0.,1.,u))*.42*fu.v[3].x;
  }
  /* вспышка гипера: ядро, ореол и луч вдоль линии; гаснет квадратом */
  let fa=F.x;
  if(fa>0.){
    let r=length(d);let R=90.*F.y;
    /* белое ядро невелико, ореол бирюзовый — тот же тон, что у 2D-вспышки */
    let core=exp(-r*r/(R*R*.03));let halo=exp(-r/(R*.42));
    let bl=F.z;
    let beam=exp(-y*y/(F.w*F.w+.3))*(1.-smoothstep(bl*.4,bl,abs(x)));
    col=col+(vec3f(1.)*core*.9+vec3f(.47,.86,1.)*halo*.45+vec3f(.78,.96,1.)*beam*.7)*fa;
  }
  /* росчерки перегона: полосы вдоль хода, текут назад, гуще у вагона */
  let sk=fu.v[3].y;
  if(sk>0.){
    let lane=floor(y/4.);let h=rfH(vec2f(lane,7.));let h2=rfH(vec2f(lane,13.));
    let ph=fract(x/(90.+h*160.)+fu.v[3].z*(1.2+h*1.6)+h2);
    let seg=smoothstep(0.,.06,ph)*(1.-smoothstep(.06,.4,ph));
    let yc=(lane+.5)*4.;let line=1.-smoothstep(.15,.9,abs(y-yc));
    /* вокруг вагона, а не дождём по всему кадру: спад вдоль и поперёк хода */
    let near=exp(-abs(y)/(fu.res.w*.10))*exp(-abs(x)/(fu.res.w*.30))*smoothstep(14.,40.,length(d));
    col=col+mix(vec3f(.8,.93,1.),C,.35)*seg*line*near*step(.82,h2)*sk*.8;
  }
  return vec4f(col,0.);}`;
const RAIL_FX_U=new Float32Array(16);
/* поле света поездки: вагон (x,y,угол), вспышка, росчерки. age — кадров со вспышки */
function railFx(pass,tx,ty,ang,age,sp,c){
  if(!pass)return;
  const U=RAIL_FX_U,u=clamp(1-age/36,0,1),a=u*u;
  U[0]=tx;U[1]=ty;U[2]=ang;U[3]=1;
  U[4]=a;U[5]=1.2-u*.6;U[6]=60+140*(1-u);U[7]=1+2*u;
  U[8]=c[0]/255;U[9]=c[1]/255;U[10]=c[2]/255;
  U[12]=1;U[13]=sp;U[14]=G.t/60;
  gpuField(pass,"rail.fx",RAIL_FX_WGSL,U,null,{blend:"add"});
}
/* своя линия светом: ореол сложением (гуще у вагона и впереди него), полотно
   и осевая поверх; у маршрутки — янтарный пунктир. Точки — экранные [x,y] */
const RAIL_SH_A=[],RAIL_SH_O=[];
function railLineGpu(pass,P,c,bus,tx,ty,cell,t){
  if(!pass||P.length<2)return;
  const A=RAIL_SH_A,O=RAIL_SH_O;A.length=0;O.length=0;
  const hot=mixc(c,[255,255,255],.35);
  let run=0;
  for(let i=1;i<P.length;i++){
    const x0=P[i-1][0],y0=P[i-1][1],x1=P[i][0],y1=P[i][1];
    const L=Math.hypot(x1-x0,y1-y0);
    const mx=(x0+x1)/2,my=(y0+y1)/2,dn=Math.hypot(mx-tx,my-ty)/(cell*3);
    /* ток: волна бежит по линии, ореол гуще рядом с вагоном */
    const pulse=.5+.5*Math.sin(run/(cell*1.3)-t*4);
    A.push([2,x0,y0,x1,y1,2.5,9,hot[0],hot[1],hot[2],(.06+.18*Math.exp(-dn*dn))*(.75+.5*pulse)]);
    run+=L;
    if(bus)continue;
    O.push([2,x0,y0,x1,y1,4,.8,3,4,10,.8]);
  }
  if(bus){
    /* пунктир 10/7 по всей ломаной, как у 2D setLineDash */
    let acc=0,on=true,left=10;
    for(let i=1;i<P.length;i++){
      let x0=P[i-1][0],y0=P[i-1][1];const x1=P[i][0],y1=P[i][1];
      let L=Math.hypot(x1-x0,y1-y0);const ux=(x1-x0)/(L||1),uy=(y1-y0)/(L||1);
      while(L>0){
        const s=Math.min(L,left),xa=x0+ux*s,ya=y0+uy*s;
        if(on)O.push([2,x0,y0,xa,ya,1.5,.7,242,178,92,.85]);
        x0=xa;y0=ya;L-=s;left-=s;acc+=s;
        if(left<=1e-6){on=!on;left=on?10:7;}
      }
    }
  }else{
    for(let i=1;i<P.length;i++)O.push([2,P[i-1][0],P[i-1][1],P[i][0],P[i][1],2,.8,c[0],c[1],c[2],.85]);
    const w=mixc(c,[255,255,255],.6);
    for(let i=1;i<P.length;i++)O.push([2,P[i-1][0],P[i-1][1],P[i][0],P[i][1],.5,.6,w[0],w[1],w[2],.5]);
  }
  gpuShapes(pass,A,{blend:"add"});
  gpuShapes(pass,O,{blend:"over"});
}
