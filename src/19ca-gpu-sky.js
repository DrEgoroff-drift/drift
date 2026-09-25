/* ══════════════ небо грунта на видеокарте (G5, docs/DESIGN-gpu.md) ══════════════
   Те же цвета (skyDay: зенит и горизонт по часу), то же зарево в цвет звезды и
   тот же диск на том же месте (sunSpot); лучше, чем запечённые градиенты со
   стопами и два спрайта:
   · небо — гладкая кривая зенит → горизонт с дизерингом: ни ступеней, ни колец;
   · рассеяние вокруг звезды — два экспоненциальных хвоста (воздух — широкий
     мягкий, вакуум — тесная корона), без кусочно-линейной альфы;
   · диск — лимб по закону потемнения (1−u(1−μ)), у горизонта краснеет, сплюснут
     и снизу съеден дымкой; кромка в воздухе мягкая, в вакууме — в полпикселя;
   · зарево у горизонта гнётся за звездой и растёт к закату, ночь садится
     на всё небо разом. Один полноэкранный проход вместо слоя и трёх drawImage. */
const GSK=new Float32Array(40);
const GSK_WGSL=`
fn kh(p:vec2f)->f32{var q=fract(vec3f(p.xyx)*.1031);q=q+dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
fn field(p0:vec2f,uv:vec2f)->vec4f{
  /* поле зовут внутри withScale: и p, и res.zw — уже в виртуальных W,H */
  let H=fu.res.w;let Wd=fu.res.z;let p=p0;
  let top=fu.v[0].rgb;let bot=fu.v[1].rgb;let dlow=fu.v[0].w;let disc=fu.v[1].w;let sc=fu.v[2].rgb;let air=fu.v[2].w;
  let sun=fu.v[3].xy;let sr=fu.v[3].z;let up=fu.v[3].w;
  let day=fu.v[4].x;let low=fu.v[4].y;let nite=fu.v[4].z;let az=fu.v[4].w;
  let v=clamp(p.y/H,0.,1.);
  /* зенит → горизонт: у горизонта воздух светлеет быстрее (плотнее слой) */
  let k=mix(.55*smoothstep(0.,.62,v),.55+.45*smoothstep(.62,1.,v),step(.62,v));
  var c=mix(top,bot,k);
  if(air>.5){
    /* глубина: зенит плотнее цветом, у горизонта — молочная полоса толстого слоя воздуха */
    c=c*mix(.84,1.,smoothstep(0.,.45,v));
    c=mix(c,min(bot*1.18+vec3f(.05),vec3f(1.)),pow(smoothstep(.45,1.,v),3.)*.45*(1.-nite));
  }
  if(air>.5){
    /* полоса зарева у горизонта и пятно со стороны звезды */
    c=mix(c,sc,smoothstep(.54,.74,v)*.16*day);
    let gp=vec2f(Wd*(.5-az*.42),H*.74);let gd=length(p-gp)/(Wd*.55);
    c=mix(c,sc,clamp((exp(-gd*gd*2.6)*.32+exp(-gd*1.8)*.08)*low,0.,1.));
  }
  /* рассеяние вокруг звезды */
  let d=length(p-sun)/H;
  if(up>0.){
    let sg=select(.38*exp(-d*16.),.26*exp(-d*4.6)+.2*exp(-d*14.),air>.5);
    c=mix(c,sc,clamp(sg*up,0.,1.))+sc*sg*up*.25;
  }
  c=mix(c,vec3f(4.,6.,14.)/255.,nite*.9);
  /* диск: сплюснут у горизонта, лимб темнее, низ съеден дымкой */
  if(disc>.5){
    let q=vec2f(p.x-sun.x,(p.y-sun.y)/(1.-.2*dlow));let r=length(q)/sr;
    let edge=select(.5/sr,.14,air>.5);
    let cov=1.-smoothstep(1.-edge,1.,r);
    if(cov>0.){
      let mu=sqrt(max(1.-r*r,0.));
      let red=mix(sc,vec3f(225.,88.,38.)/255.,min(dlow*1.3,1.));
      let limb=1.-.3*(1.-mu);
      var dc=min(mix(min(red*1.4,vec3f(1.)),vec3f(1.,.99,.94),smoothstep(.75,0.,r)*(.95-dlow*.85))*limb,vec3f(1.));
      let ext=1.-.62*dlow*smoothstep(.1,1.,q.y/sr);
      /* диск светит сам: небо за ним прибавляется, а не берётся по каналам через max —
         max брал синий канал неба, и низкое солнце выходило розовым, а не красным */
      c=mix(c,min(dc+c*.3,vec3f(1.)),cov*ext);
    }
  }
  /* дизеринг против бэндинга восьмибитного градиента */
  c=c+(kh(p0*1.37)-.5)/255.;
  return vec4f(c,1.);
}`;
/* небо целиком (фон, зарево, рассеяние, диск); false — видеокарты нет, рисует 2D.
   SKY_GPU — кадр, в котором небо уже положено: drawSkyLayer тогда не кладёт зарево и диск */
let SKY_GPU=-1;
function gpuSky(p){
  const pass=gpuScene();if(!pass)return false;
  const D=skyDay(p),sc=hex2rgb((G.sys&&G.sys.cls&&G.sys.cls.col)||"#ffe08a"),air=p.T.atm!=="отсутствует";
  const sun=celSun(p),SS=sunSpot(p),nite=surfNight(p);
  const U=GSK;
  U[0]=D.top[0]/255;U[1]=D.top[1]/255;U[2]=D.top[2]/255;
  U[4]=D.bot[0]/255;U[5]=D.bot[1]/255;U[6]=D.bot[2]/255;
  U[8]=sc[0]/255;U[9]=sc[1]/255;U[10]=sc[2]/255;U[11]=air?1:0;
  const under=clamp((SS.alt+.42)/.5,0,1);
  U[3]=air?clamp(1-SS.alt*2.2,0,1):0;U[7]=SS.up?1:0;
  U[12]=SS.x;U[13]=SS.y;U[14]=H*.045;U[15]=SS.up?1:under*.7;
  const day=clamp(1+sun.alt*2.2,0,1);
  U[16]=day;U[17]=air?clamp(1-Math.abs(sun.alt)*1.4,0,1)*day:0;U[18]=nite;U[19]=sun.az;
  gpuField(pass,"gsky",GSK_WGSL,U,[]);
  SKY_GPU=GPU.frameNo;
  return true;
}
