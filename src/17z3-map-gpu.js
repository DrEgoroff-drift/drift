/* ══════════════ небо карты на видеокарте (G10, docs/DESIGN-gpu.md §5) ══════════════
   Было: галактика пеклась на процессоре тайлами 128² по 4 текселя на сектор
   (galBake, пиксельный цикл с бюджетом), тайлы проявлялись по кадрам, а вблизи
   один тексель ложился на десяток пикселей — рукав был мылом. Теперь та же
   формула galaxyAt считается на каждый пиксель шейдером: хэш и шум — бит в бит
   с 01-core (hashi, noise2, fbm2), поэтому звёзды, имена и дороги, стоящие по
   galaxyCell на процессоре, совпадают с тем, что светит. Сверх модели — только
   то, что видно лишь вблизи: волокна газа в рукаве, рваная кромка пылевой
   ленты, покраснение света за пылью. Модель (galaxyAt) не тронута: ей верят
   звёзды, дороги и тесты.

   Проход: небо — первый слой кадра, под всем 2D (gpuScene). Если зовущий уже
   что-то нарисовал на #c (вагон 18g заливает фон), небо ложится поверх этого
   (gpuOver) — порядок остаётся тем, каким его написали. */
/* lamp — круг прыжка карты на этот кадр (drawMap ставит, drawGalaxy съедает): небо в
   досягаемости светлее, за кромкой гаснет — закон тьмы карты теперь и у неба */
const MAPGPU={lamp:null,U:new Float32Array(12),bk:new Map(),key:""};
/* проход подложки карты (звёзды, дороги): открытый верхний, иначе — сцена под всем 2D.
   sky — само небо: если #c уже не чист, оно ложится поверх нарисованного */
function mapGpuPass(sky){
  if(typeof GPU==="undefined"||!GPU.on||!GPU.enc)return null;
  if(GPU.overPass)return GPU.overPass;
  return sky&&GPU.cState?gpuOver():gpuScene();
}
const GAL_WGSL=`
const GPI=3.14159265;
fn gH(x:i32,y:i32,s:i32)->f32{
  var h=(bitcast<u32>(x)*374761393u)^(bitcast<u32>(y)*668265263u)^(bitcast<u32>(s)*1442695041u);
  h=(h^(h>>13u))*1274126177u;h=h^(h>>16u);
  return f32(h>>8u)*(1./16777216.);}
fn gN(x:f32,y:f32,s:i32)->f32{
  let fx=floor(x);let fy=floor(y);let xi=i32(fx);let yi=i32(fy);let xf=x-fx;let yf=y-fy;
  let u=xf*xf*(3.-2.*xf);let v=yf*yf*(3.-2.*yf);
  return mix(mix(gH(xi,yi,s),gH(xi+1,yi,s),u),mix(gH(xi,yi+1,s),gH(xi+1,yi+1,s),u),v);}
fn gF(x:f32,y:f32,s:i32,oct:i32)->f32{
  var v=0.;var a=.5;var f=1.;var n=0.;
  for(var i=0;i<oct;i++){v+=a*gN(x*f,y*f,s+i*97);n+=a;a*=.5;f*=2.;}
  return v/n;}
fn gArmD(r:f32,th:f32,ph:f32,pitch:f32)->f32{
  let s=th-log(max(r,${GAL_R0.toFixed(4)})/${GAL_R0.toFixed(4)})/pitch-ph;
  return (pmod(s+GPI*.5,GPI)-GPI*.5)*r;}
fn sq(x:f32)->f32{return x*x;}
/* неразрешённые звёзды: по точке на клетку шага sp (в секторах), если прошёл хэш
   против плотности; px — пикселей на сектор. Точка мягкая, блеск — степенной */
fn gMs(w:vec2f,sp:f32,dens:f32,px:f32,sd:i32)->f32{
  let id=floor(w/sp);let ix=i32(id.x);let iy=i32(id.y);
  if(gH(ix,iy,sd)>=dens){return 0.;}
  let q=(id+.2+.6*vec2f(gH(ix,iy,sd+1),gH(ix,iy,sd+2)))*sp;
  let d=length(w-q)*px;let b=gH(ix,iy,sd+3);
  return (.35+2.2*b*b*b*b*b*b)*exp(-d*d*1.6);}
var<private> GNEB:array<vec4f,${GAL_NEBULAE.length}>=array<vec4f,${GAL_NEBULAE.length}>(${GAL_NEBULAE.map((n,i)=>"vec4f("+n.x.toFixed(4)+","+n.y.toFixed(4)+","+(1.3+.5*h01(i,7,0x6C3)).toFixed(3)+","+(i%3)+".)").join(",")});
fn field(p:vec2f,uv:vec2f)->vec4f{
  let V=fu.v[0];let C=fu.v[1];
  let w0=V.xy+(p-C.xy)/V.z;let x=w0.x;let y=w0.y;let fine=V.w;
  let r=length(w0);let th=atan2(y,x);
  let disk=exp(-r/${GAL_RD.toFixed(3)});
  let ca=${Math.cos(GAL_BAR_A).toFixed(6)};let sa=${Math.sin(GAL_BAR_A).toFixed(6)};
  let u=x*ca+y*sa;let v=-x*sa+y*ca;let BL=${GAL_BAR_L.toFixed(3)};
  let bar=exp(-(sq(u/BL)+sq(v/(BL*${(GAL_BAR_Q*.45).toFixed(4)}))));
  let core=exp(-sq(r/3.));
  let bulge=min(${GAL_BULGE_CAP.toFixed(3)},.55*core+.35*bar);
  let w=2.2+.06*r;
  let d1=gArmD(r,th,${GAL_BAR_A.toFixed(6)},${GAL_PITCH.toFixed(6)});
  let d2=gArmD(r,th,${(GAL_BAR_A+Math.PI/2+.4).toFixed(6)},${Math.tan(19*Math.PI/180).toFixed(6)});
  let wx=x*.11+gF(x*.05,y*.05,${0x6A1},3)*2.4;let wy=y*.11+gF(x*.05+9.,y*.05,${0x6A2},3)*2.4;
  let clump=.45+.9*gF(wx,wy,${0x6A3},4);
  let onArm=exp(-sq(d1/w));let spur=.3*exp(-sq(d2/(w*.8)));
  let ramp=clamp((r-BL*.6)/4.,0.,1.);
  let arm=ramp*min(1.,(onArm+spur)*clump);
  /* пылевая лента модели; вблизи кромка рвётся мелким шумом — у настоящей пыли нет ровного края */
  let lane0=ramp*exp(-sq((d1+.38*w)/(.3*w)))*(.5+.8*gF(x*.3,y*.3,${0x6A4},3));
  let rip=gF(x*1.4+5.,y*1.4-3.,${0x6B2},3);
  let lane=lane0*mix(1.,.35+1.3*rip,fine*.8);
  /* пылевые полосы перемычки: две прямые ленты по передним кромкам бара, сдвинутые в
     разные стороны от оси (как у настоящих галактик с баром), — структура видна прямо
     у дома, где рукавов ещё нет */
  let bls=select(-1.,1.,u>0.);
  let blane=exp(-sq((v-bls*(.62+.14*abs(u)))/(.30+.04*abs(u))))*exp(-sq(u/(BL*1.15)))*smoothstep(.5,2.4,abs(u));
  let dust=clamp(lane*.85+blane*.75*(.65+.7*rip),0.,.85);
  let kn=gF(x*.45+3.,y*.45,${0x6A5},3);
  let knot=clamp((onArm*clump-.55)*2.2,0.,1.)*clamp((kn-.58)*6.,0.,1.);
  /* волокна газа вдоль рукава: видны только вблизи, пока клетка крупна */
  let fil=gF(x*.9+y*.35,y*.9-x*.35,${0x6B1},4);
  let armL=disk*(.16+.62*arm)*mix(1.,.55+.9*fil,fine*clamp(arm*1.6,0.,1.));
  let lit=bulge+armL;
  let glow=clamp(lit*(1.-dust),0.,1.);
  let bw=bulge/(lit+1e-6);
  var col=mix(mix(vec3f(128.,116.,168.),vec3f(176.,196.,255.),clamp(arm*1.4,0.,1.)),vec3f(255.,204.,142.),clamp(bw*1.3,0.,1.));
  col=mix(col,vec3f(255.,128.,176.),knot*.8)/255.;
  /* свет за пылью краснеет: синее гасится первым (закон L1.3) */
  col=col*mix(vec3f(1.),vec3f(1.,.74,.52),clamp(dust*1.5,0.,1.));
  var c=col*glow*${GAL_GLOW_CAP.toFixed(3)};
  /* узлы HII светят сами — розовая эмиссия поверх, чуть сверх потолка */
  c+=vec3f(1.,.5,.7)*knot*disk*.10;
  /* ядро светится, а не упирается в потолок: широкий тёплый ореол балджа за пределом модели */
  c+=vec3f(1.,.78,.52)*(.045*exp(-r/5.)+.05*exp(-sq(r/2.2)))*(1.-dust*.8);
  /* гребень перемычки: вытянутое тёплое тело через ядро — у ядра есть ось */
  c+=vec3f(1.,.82,.58)*.085*exp(-(sq(u/(BL*.95))+sq(v/.75)))*(1.-dust);
  /* галактика из звёзд, а не из тумана: неразрешённая звёздная крошка по плотности света,
     в мире (едет с листом), шаг — степень двойки под ~7 px на экране, два уровня вперемешку */
  {let lv=log2(7./V.z);let s0=exp2(floor(lv));let t=fract(lv);
    let dn=clamp(pow(glow,1.25)*3.+.02,0.,.92)*(1.-dust*.9);
    let ms=mix(gMs(w0,s0,dn,V.z,${0x6D1}),gMs(w0,s0*2.,dn,V.z,${0x6D5}),t);
    c+=mix(col,vec3f(1.),.35)*ms*.30;}
  /* туманности по имени (17z2): облака свечения там, где их зовут водители. Одно
     общее поле шума на пиксель, маска — сумма гауссиан; розовое ядро, бирюзовая
     кромка, тёмные глобулы. Место с именем теперь видно, а не только подписано */
  var nm=0.;var ni=0.;
  for(var i=0;i<${GAL_NEBULAE.length};i++){let q=GNEB[i];let d2=dot(w0-q.xy,w0-q.xy);
    if(d2<16.){let g=exp(-d2/(q.z*q.z));nm+=g;ni+=g*q.w;}}
  if(nm>.004){
    let hue=ni/nm;
    let n1=gF(x*.7+y*.2,y*.7-x*.2,${0x6C1},4);let n2=gF(x*1.6,y*1.6,${0x6C2},3);
    let gas=min(nm,1.)*smoothstep(.3,.7,n1+(n2-.5)*.35*fine);
    let glob=smoothstep(.62,.8,n2)*nm*.8;
    let core=mix(vec3f(1.,.42,.66),vec3f(1.,.62,.36),step(1.5,hue));
    let edge=mix(vec3f(.30,.86,.82),vec3f(.52,.62,1.),step(.5,hue)*step(hue,1.5));
    let nc=mix(core,edge,smoothstep(.25,.9,1.-nm+n2*.4));
    c=c*(1.-clamp(glob,0.,.7))+nc*gas*.4*(1.-glob);
  }
  /* круг прыжка: внутри — чуть светлее и бирюзовая подсветка к кромке, снаружи небо гаснет */
  let L=fu.v[2];
  if(L.w>0.){
    let dl=length(p-L.xy);let ins=1.-smoothstep(L.z-1.5,L.z+1.5,dl);
    c*=mix(1.-L.w,1.+L.w*.4,ins);
    let ta=.05*smoothstep(L.z*.72,L.z,dl)*ins;
    c=mix(c,vec3f(127.,230.,216.)/255.,ta);
  }
  /* пустое небо — холодное, не чёрное (#03040a); там, где светит, тень не синит тёплое ядро */
  c+=vec3f(3.,4.,10.)/255.*(1.-clamp(glow*4.,0.,1.));
  /* свет листа собран к середине: мягкая виньетка, края кадра уходят в холодную тень */
  let e=uv-.5;c*=1.-.42*dot(e,e)*2.;
  /* зерно по пикселю вместо ровной заливки */
  c+=(gH(i32(p.x*2.),i32(p.y*2.),${0x6D9})-.5)*.014;
  return vec4f(max(c,vec3f(0.)),1.);}`;
/* небо галактики: V — центр окна в секторах, cell — пикселей на сектор */
function galaxyGpu(pass,V,cell){
  const U=MAPGPU.U;
  U[0]=V.x;U[1]=V.y;U[2]=cell;U[3]=clamp((cell-12)/36,0,1);
  U[4]=W/2;U[5]=H/2;U[6]=0;U[7]=0;
  const L=MAPGPU.lamp;MAPGPU.lamp=null;
  /* гаснет лишь вблизи: на отъезде круг мал, и тёмная галактика не читалась бы спиралью */
  if(L){U[8]=L.x;U[9]=L.y;U[10]=L.r;U[11]=.3*clamp((cell-18)/30,0,1)+.0001;}else U[8]=U[9]=U[10]=U[11]=0;
  /* ── неподвижный лист — выпечка, а не сотня хэшей на пиксель ──
     Во времени поле не живёт: всё, от чего оно зависит, — в U и размере кадра. Считать
     его каждый кадр стоило 5.7 мс видеокарты на 1920×1080 и 1.1 мс на 760 (замер 26.09,
     gpuTs), а карта почти всё время стоит. Ключ тот же второй кадр подряд — поле печётся
     в текстуру один раз (gpuFieldBaked, тот же шейдер и та же rgba16float) и кладётся
     одной выборкой; лист едет — считается вживую, чтобы не печь текстуру на каждый кадр
     пути. Картинка та же: пиксель в пиксель, тексель в центр */
  const key=U.join(",")+"|"+W+"x"+H+"@"+DPR;
  const B=key===MAPGPU.key?gpuFieldBaked(MAPGPU.bk,key,"map.gal",GAL_WGSL,U,null,W,H):null;
  MAPGPU.key=key;
  if(!B){gpuField(pass,"map.gal",GAL_WGSL,U);return;}
  for(const [k,b] of MAPGPU.bk)if(k!==key){gpuBakeDrop(b);MAPGPU.bk.delete(k);}
  gpuImage(pass,B,[{x:W/2,y:H/2,w:W,h:H}]);
}
/* ── звёзды галактики точками со светом ──
   Было шесть заливок по три ступени яркости — квадратики 1–1.6 px. Теперь у
   каждой звезды своя яркость по степенному закону (много тусклых, редкие яркие),
   ядро со сглаживанием, у ярчайших — мягкий ореол; за пылью звезда краснее. */
const GAL_STAR_RED=[255,176,128];
function galStarsGpu(pass,sz){
  const SH=[];
  for(let c=0;c<GAL_STAR_BUF.length;c++){
    const B=GAL_STAR_BUF[c];if(!B.length)continue;
    const C=c<GAL_STAR_COL.length?GAL_STAR_COL[c]:GAL_STAR_RED;
    for(let i=0;i<B.length;i+=3){
      const x=B[i],y=B[i+1],k=B[i+2];
      /* ядро: радиус и яркость растут медленнее блеска — свет уходит в ореол */
      SH.push([1,x,y,sz*(.42+.28*Math.min(k,2)),0,0,.6,C[0],C[1],C[2],Math.min(1,.28+.55*k)]);
      if(k>.9)SH.push([1,x,y,0,0,0,sz*(1.6+2.4*Math.min(k-.9,1.5)),C[0],C[1],C[2],.10+.12*Math.min(k-.9,1)]);
    }
  }
  gpuShapes(pass,SH,{blend:"add"});
}
/* лента по ломаной: четырёхугольники с жёсткими стыками — полупрозрачная линия не
   даёт бусин на изломах (как спираль railGpu). pts — [[x,y]…] в пикселях */
function mapRibbon(SH,pts,hw,C){
  const n=pts.length;if(n<2)return;
  const nr=i=>{const a=pts[Math.max(0,i-1)],b=pts[Math.min(n-1,i+1)];
    const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;return [-dy/l*hw,dx/l*hw];};
  let u=nr(0);
  for(let i=0;i+1<n;i++){const p=pts[i],q=pts[i+1],v=nr(i+1);
    gpuQuad(SH,[p[0]-u[0],p[1]-u[1]],[p[0]+u[0],p[1]+u[1]],[q[0]+v[0],q[1]+v[1]],[q[0]-v[0],q[1]-v[1]],C,(i>0?1:0)|(i+2<n?4:0));
    u=v;}
}
/* слой поверх уже нарисованного 2D (линии, владения, слухи): метки лягут выше */
function mapGpuOver(){
  if(typeof GPU==="undefined"||!GPU.on||!GPU.enc)return null;
  return gpuOver();
}
/* ── звёзды систем (было mapStarPaint на 2D: два стопа градиента, лучи ровной
   палкой) ── Свет сложением в три масштаба: тугое ядро цвета звезды, подмешанного
   к белому, ближний ореол и широкий рассеянный — у ярких классов ещё шире.
   Лучи сужаются к концам: две капсулы, длинная тусклая и короткая яркая.
   vis — записи drawMap с x,y,s,fade,rr; gk — ужатие знака на отъезде */
/* лучи — только у пяти ярчайших в кадре (L1.7): десятки крестов — шум, пять — ориентиры */
const MAP_SPIKE_N=5;
function mapStarsGpu(pass,vis,gk){
  const SH=[],on=[];
  for(const v of vis)if(v.s.cls.t>=1.1&&v.x>0&&v.x<W&&v.y>0&&v.y<H)on.push(v);
  on.sort((a,b)=>b.s.cls.t*b.fade-a.s.cls.t*a.fade);
  const spk=new Set(on.slice(0,MAP_SPIKE_N));
  for(const v of vis){
    const t=v.s.cls.t,col=hex2rgb(v.s.cls.col),f=v.fade*(.4+.6*gk),rr=v.rr,x=v.x,y=v.y;
    if(x<-rr*14||x>W+rr*14||y<-rr*14||y>H+rr*14)continue;
    /* лестница блеска: класс звезды решает и ореол, и лучи; свечение — сложением в три масштаба */
    const br=clamp(t/2,0,1);
    SH.push([1,x,y,0,0,0,rr*(6+5*br),col[0],col[1],col[2],(.10+.10*br)*f],
      [1,x,y,0,0,0,rr*2.6,col[0],col[1],col[2],(.42+.2*br)*f]);
    if(spk.has(v)){
      SH.push([1,x,y,0,0,0,rr*18,col[0],col[1],col[2],.06*f]);
      /* лучи сужаются к концам: длинная тусклая капсула, короткая яркая, белая середина */
      const L=rr*(5+2.2*t);
      for(const [dx,dy] of [[1,0],[0,1]]){
        SH.push([2,x-dx*L,y-dy*L,x+dx*L,y+dy*L,.4,.8,col[0],col[1],col[2],.22*f],
          [2,x-dx*L*.5,y-dy*L*.5,x+dx*L*.5,y+dy*L*.5,.5,.8,col[0],col[1],col[2],.30*f],
          [2,x-dx*L*.2,y-dy*L*.2,x+dx*L*.2,y+dy*L*.2,.6,.6,255,255,255,.35*f]);
      }
    }
    const w=mixc(col,[255,255,255],.4);
    SH.push([1,x,y,rr,0,0,0,w[0],w[1],w[2],.95*f]);
  }
  gpuShapes(pass,SH,{blend:"add"});
}
