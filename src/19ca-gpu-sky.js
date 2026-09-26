/* ══════════════ небо на движке (переписано 27.09.2026, слово автора) ══════════════
   «Небо полностью перепридумай на новый движок, добавь генератор случайных чисел,
   чтобы небо было всегда разным. 2д мы все теперь убираем». Старое небо было
   слоями 2D поверх градиента: спрайты облаков, звёзды прямоугольниками, тела
   градиентами. Новое — поля на видеокарте, и в каждой посадке своё.

   ЛИЦО планеты — из её данных: цвет звезды, воздух, час, климат, палитра, какие
   тела стоят в её небе. СОСТАВ неба — от зерна посадки: рисунок звёзд, куда легла
   полоса Галактики, есть ли туманность и где, где встали тела и какой фазой
   повёрнуты, какие сегодня облака, какая дымка, какие метеоры. Сели ещё раз —
   небо другое, а планету узнаёшь.

   Зерно берётся из потока картинки rndFx() при входе в посадку (skyReroll):
   игровой rnd() не тратится, повтор и stateHash не сдвигаются. Оно живёт вне G
   (G не зависит от картинки), посадка и поверхность делят одно зерно. Стенды и
   пары прибивают его skyPin(n).

   Слои (все под 2D, в проходе сцены; до гряд на холсте 2D не остаётся ничего,
   поэтому копии холста до грунта не нужны — ночь на телефоне):
   1. воздух (здесь): зенит → горизонт, закат с тёплой стороны и пояс Венеры с
      тенью планеты с холодной, ночь, свечение воздуха, звёзды трёх глубин,
      полоса Галактики с пылевыми прожилками, туманность, метеоры, рассеяние,
      диск, затмение, три света;
   2. тела (19cb): гигант с кольцами, соседний мир, луны с фазой от звезды,
      галактика, дыра, сияние, туманность, комета, пульсар, рой; парад и комета
      календаря;
   3. облака и дымка (19cc): кучевые трёх эшелонов, перья, полог, дымка у
      горизонта; дальняя погода.
   Законы: звезда — самое светлое в небе; туманность и облака мягкие, без
   контура; тон мешается по кругу, не в зелень; звёзды тянутся на ходу, а не
   мигают. */
let SKY_PIN=null,SKY_N=0,SKY_ROLL=null;
/* прибить зерно неба (стенды, пары кадров, тесты); null — снова случай */
function skyPin(s){SKY_PIN=(s===null||s===undefined)?null:(s>>>0);SKY_ROLL=null;}
/* новая посадка — новое небо */
function skyReroll(p){
  const ps=(p&&p.seed)|0;
  const s=SKY_PIN!==null?SKY_PIN:hashi(++SKY_N,(rndFx()*4294967296)>>>0,ps);
  SKY_ROLL={ps,s:s>>>0,R:null};
  return SKY_ROLL;
}
/* рецепт неба этой посадки: всё, что решает зерно, одним броском */
function skyRoll(p){
  let Q=SKY_ROLL;
  if(!Q||Q.ps!==((p.seed)|0))Q=skyReroll(p);
  if(Q.R)return Q.R;
  const r=rng(Q.s^0x5CA1AB1E);
  const R={seed:Q.s};
  /* звёзды: свой рисунок, своя густота, свой уклон в тёплое или холодное */
  R.sd=r()*900+37;R.dens=.55+r()*.45;R.warm=(r()-.5)*.36;
  /* полоса Галактики: наклон, где пересекает небо, ширина, яркость; иногда её
     почти нет — над частью посадок небо просто звёздное */
  const ang=(r()-.5)*2.3;R.band=[Math.cos(ang),Math.sin(ang),(r()-.5)*.7,.07+r()*.10,r()<.2?.18:.55+r()*.45];
  /* туманность — не каждую ночь */
  R.neb=r()<.5?[.12+r()*.76,.06+r()*.30,.16+r()*.20,.45+r()*.55,r()*700]:null;
  /* метеоры: у одной посадки их поток, у другой ни одного за ночь */
  R.met=r()<.35?0:.3+r()*.7;R.metSd=(r()*1e6)|0;
  /* облака: густота, перья, полог и высота эшелонов гуляют вокруг климата */
  R.cl={sd:r()*500+11,cover:.62+r()*.8,cir:.35+r()*1.3,deck:(r()-.5)*.5,sc:.82+r()*.42,lift:(r()-.5)*.08,wx:r()*400};
  /* дымка: плотнее или прозрачнее, и её рисунок */
  R.haze=[.72+r()*.62,r()*300];
  /* тела планеты стоят каждый раз в другом месте и другой фазой; какие тела —
     решает сама планета (skyScene) */
  R.bodies=skyScene(p).map(e=>{
    const loud=!!e.loud;
    return Object.assign({},e,{x:loud?.14+r()*.62:.06+r()*.88,y:loud?.20+r()*.20:.06+r()*.34,ph:r()*TAU,spin:r()*TAU,tex:null});
  });
  Q.R=R;return R;
}
/* ── шумы неба: общие для всех полей 19ca/19cb/19cc ── */
const SKY_NOISE_WGSL=`
fn kh(p:vec2f)->f32{var q=fract(vec3f(p.xyx)*.1031);q=q+dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
fn kh2(p:vec2f)->vec2f{var q=fract(vec3f(p.xyx)*vec3f(.1031,.1030,.0973));q=q+dot(q,q.yzx+33.33);return fract((q.xx+q.yz)*q.zy);}
fn vn(p:vec2f)->f32{let i=floor(p);let f=fract(p);let u=f*f*(3.-2.*f);
  return mix(mix(kh(i),kh(i+vec2f(1.,0.)),u.x),mix(kh(i+vec2f(0.,1.)),kh(i+vec2f(1.,1.)),u.x),u.y);}
fn fbm(p0:vec2f,n:i32)->f32{var p=p0;var a=.5;var s=0.;var w=0.;
  for(var i=0;i<n;i=i+1){s=s+a*vn(p);w=w+a;p=mat2x2f(1.6,1.2,-1.2,1.6)*p+vec2f(17.1,9.3);a=a*.5;}
  return s/w;}
fn bil(p:vec2f)->f32{return 1.-abs(2.*vn(p)-1.);}
fn lum3(c:vec3f)->f32{return dot(c,vec3f(.299,.587,.114));}
fn segD(p:vec2f,a:vec2f,b:vec2f)->f32{let pa=p-a;let ba=b-a;let h=clamp(dot(pa,ba)/max(dot(ba,ba),1e-4),0.,1.);return length(pa-ba*h);}
fn bump(x:f32,c:f32,w:f32)->f32{let d=(x-c)/w;return exp(-d*d);}
`;
const GSK=new Float32Array(60);
const GSK_WGSL=SKY_NOISE_WGSL+`
/* звезда в своей клетке: место, блеск и тон — от хэша клетки; на ходу тянется
   штрихом той же энергии, а не мигает */
fn starCell(p:vec2f,cell:f32,sd:f32,dens:f32,z:f32,strk:vec2f,warm:f32)->vec3f{
  let id=floor(p/cell);
  if(kh(id+vec2f(sd,sd*.71))>dens){return vec3f(0.);}
  let sp=(id+vec2f(.2)+.6*kh2(id+vec2f(sd*1.3,5.1)))*cell;
  let m=kh(id+vec2f(7.7,sd));
  let br=.07+.30*z*m+1.25*z*pow(m,7.);
  let rad=.5+.85*z*pow(m,3.);
  let st=strk*z;let ln=length(st);
  let d=segD(p,sp,sp+st);
  let cov=clamp(rad+.5-d,0.,1.)*rad/(rad+ln*.6);
  let glow=exp(-d*d/(rad*rad*7.))*pow(m,8.)*.55*z/(1.+ln*.3);
  let t=clamp(kh(id+vec2f(3.3,sd*.3))+warm,0.,1.);
  let cool=mix(vec3f(.66,.78,1.),vec3f(1.,.98,.94),smoothstep(0.,.45,t));
  let col=mix(cool,vec3f(1.,.78,.55),smoothstep(.72,1.,t));
  return col*(br*cov+glow);
}
fn field(p0:vec2f,uv:vec2f)->vec4f{
  let H=fu.res.w;let Wd=fu.res.z;let p=p0;
  let top=fu.v[0].rgb;let bot=fu.v[1].rgb;let dlow=fu.v[0].w;let disc=fu.v[1].w;let sc=fu.v[2].rgb;let air=fu.v[2].w;
  let sun=fu.v[3].xy;let sr=fu.v[3].z;let up=fu.v[3].w;
  let day=fu.v[4].x;let low=fu.v[4].y;let nite=fu.v[4].z;let az=fu.v[4].w;
  let sv=fu.v[5].x;let sd=fu.v[5].y;let dens=fu.v[5].z;let warm=fu.v[5].w;
  let par=fu.v[6].xy;let strk=fu.v[6].zw;
  let bdir=fu.v[7].xy;let boff=fu.v[7].z;let bw=fu.v[7].w;
  let n1=fu.v[8].rgb;let bamt=fu.v[8].w;let n2=fu.v[9].rgb;let namt=fu.v[9].w;
  let npos=fu.v[10].xy;let nsz=fu.v[10].z;let nsd=fu.v[10].w;
  let ecl=fu.v[11];let lt=fu.v[12];let tw=fu.v[13];let met=fu.v[14];
  let hv=lt.w/H;
  let v=clamp(p.y/H,0.,1.);
  /* зенит → горизонт: у горизонта воздух светлеет быстрее (толще слой) */
  let k=mix(.55*smoothstep(0.,.62,v),.55+.45*smoothstep(.62,1.,v),step(.62,v));
  var c=mix(top,bot,k);
  if(air>.5){
    c=c*mix(.84,1.,smoothstep(0.,.45,v));
    c=mix(c,min(bot*1.18+vec3f(.05),vec3f(1.)),pow(smoothstep(.45,1.,v),3.)*.45*(1.-nite));
    /* заря с тёплой стороны: у горизонта медь, выше роза, ещё выше лиловый —
       тон идёт по кругу, а не тянется в одну краску */
    let side=exp(-pow((p.x-(Wd*(.5-az*.42)))/(Wd*.62),2.));
    let hh=clamp((hv-v)/max(hv,.1),0.,1.);
    let ramp=mix(mix(vec3f(1.,.56,.26),vec3f(.93,.50,.58),smoothstep(.04,.30,hh)),vec3f(.52,.44,.74),smoothstep(.28,.62,hh));
    let dawn=low*(.25+.75*side)*(1.-smoothstep(.0,.75,hh))*(1.-nite*.7);
    c=mix(c,mix(ramp,sc,.25),clamp(dawn*.55,0.,1.));
    c=mix(c,sc,smoothstep(.54,.74,v)*.14*day);
    /* пояс Венеры: на холодной стороне над горизонтом розовая полоса, под ней
       сизая тень самой планеты — видно только в сумерки */
    let anti=exp(-pow((p.x-(Wd*(.5+az*.42)))/(Wd*.7),2.));
    let pink=mix(vec3f(.93,.64,.72),sc,.2);
    c=mix(c,pink,tw.y*anti*bump(v,hv-.13,.07)*.34);
    c=mix(c,c*vec3f(.58,.63,.80),tw.y*anti*bump(v,hv-.035,.035)*.55);
  }
  /* рассеяние вокруг звезды */
  let d=length(p-sun)/H;
  if(up>0.){
    let sg=select(.38*exp(-d*16.),.26*exp(-d*4.6)+.2*exp(-d*14.),air>.5);
    c=mix(c,sc,clamp(sg*up,0.,1.))+sc*sg*up*.25;
  }
  /* затмение гасит небо (половину берёт небо, остальное — весь кадр) */
  c=mix(c,vec3f(8.,12.,26.)/255.,.34*lt.z);
  /* ночь садится на всё небо; ночной тон — из зенита мира, а не общий синий */
  let night=mix(vec3f(4.,6.,14.)/255.,top*.10,.45);
  c=mix(c,night,nite*.9);
  /* свечение воздуха: ночью у горизонта еле заметная полоса в тон туманности */
  c=c+n2*.030*nite*air*bump(v,hv-.11,.05);
  /* ── ночное небо: видно только то, что светлее неба ── */
  let skyL=lum3(c);
  var vis=sv*(1.-smoothstep(.05,.28,skyL));
  vis=vis*select(1.,1.-smoothstep(hv-.22,hv+.01,v),air>.5)*step(v,hv+.02);
  if(vis>.002){
    let q=p-vec2f(Wd*.5,H*.32)+par*.5;
    let al=dot(q,bdir);let ac=dot(q,vec2f(-bdir.y,bdir.x))-boff*H;let B=bw*(Wd+H);
    let core=exp(-(ac/B)*(ac/B)*1.3);
    var lane=0.;var glow=0.;var bcol=n1;
    if(core>.01){
      let cl=fbm(vec2f(al/B*.9,ac/B*1.7)+vec2f(sd*.013,3.1),4);
      lane=smoothstep(.50,.70,fbm(vec2f(al/B*1.7+4.1,ac/B*3.6)+vec2f(sd*.021,0.),4))*exp(-(ac/(B*.5))*(ac/(B*.5)));
      glow=core*(.30+cl*1.2)*(1.-lane*.85)*bamt;
      /* по краю полосы — розовый переход, к ядру тёплое молоко */
      bcol=mix(mix(n2,n1,smoothstep(.3,.7,cl)),vec3f(1.,.93,.84),core*core*.35);
    }
    c=c+bcol*glow*.15*vis;
    if(namt>0.){
      let nd=(p+par*.4-npos)/(nsz*H);
      let wq=fbm(nd*1.8+vec2f(nsd,1.7),3);
      let f=fbm(nd*2.4+vec2f(wq*1.9)+vec2f(nsd*.7,0.),4);
      let neb=smoothstep(.40,.80,f)*exp(-dot(nd,nd)*2.2);
      let ncol=mix(n2,mix(n1,vec3f(.95,.62,.74),.35),smoothstep(.5,.78,f));
      c=c+ncol*neb*namt*.20*vis;
    }
    let dm=clamp(dens*(1.+core*1.8*(1.-lane)*bamt),0.,1.);
    var s=starCell(p+par*.3,9.,sd,dm*.42,.3,strk,warm);
    s=s+starCell(p+par*.62,23.,sd+41.,dm*.55,.66,strk,warm);
    s=s+starCell(p+par,57.,sd+83.,dm*.7,1.,strk,warm);
    c=c+s*vis*(1.-lane*.8);
    /* метеор: короткий штрих, голова ярче хвоста */
    if(met.z>0.){
      let ma=met.xy;let mb=met.zw;
      let ba=mb-ma;let hh2=clamp(dot(p-ma,ba)/max(dot(ba,ba),1e-3),0.,1.);
      let md=length(p-ma-ba*hh2);
      c=c+vec3f(.92,.96,1.)*exp(-md*md*.9)*hh2*hh2*tw.w*vis;
    }
  }
  /* диск: сплюснут у горизонта, лимб темнее, низ съеден дымкой */
  if(disc>.5){
    let q=vec2f(p.x-sun.x,(p.y-sun.y)/(1.-.2*dlow));let r=length(q)/sr;
    let edge=select(.5/sr,.14,air>.5);
    let cov=1.-smoothstep(1.-edge,1.,r);
    if(cov>0.){
      let mu=sqrt(max(1.-r*r,0.));
      let red=mix(sc,vec3f(225.,88.,38.)/255.,min(dlow*1.3,1.));
      let limb=1.-.3*(1.-mu);
      let dc=min(mix(min(red*1.4,vec3f(1.)),vec3f(1.,.99,.94),(1.-smoothstep(0.,.75,r))*(.95-dlow*.85))*limb,vec3f(1.));
      let ext=1.-.62*dlow*smoothstep(.1,1.,q.y/sr);
      c=mix(c,min(dc+c*.3,vec3f(1.)),cov*ext);
    }
  }
  /* затмение: диск спутника наезжает на звезду, корона — за ним */
  if(ecl.z>0.){
    let ec=sun+ecl.xy;let er=ecl.z;
    let cov=clamp(er-length(p-ec)+.5,0.,1.);
    let dd=length(p-sun)/sr;
    let cor=select(0.,.30*ecl.w*exp(-(dd-1.)*1.6),dd>1.&&ecl.w>.7);
    c=mix(c,vec3f(5.,7.,12.)/255.,cov)+vec3f(1.,.93,.80)*cor*(1.-cov);
  }
  /* три света: спутники главной звезды сходятся к соединению */
  if(lt.x>0.){
    for(var i=0;i<2;i=i+1){
      if(f32(i)>=lt.x){break;}
      let fi=f32(i);let sg=select(1.,-1.,i>0);
      let lp=sun+vec2f(sg*Wd*(.11+fi*.05)*(1.-lt.y),H*(.05+fi*.03)*(1.-lt.y));
      let lr=sr*(.55-fi*.12+lt.y*.3);
      let lc=select(vec3f(226.,236.,255.),vec3f(255.,214.,170.),i>0)/255.;
      let ld=length(p-lp)/lr;
      c=c+lc*.22*exp(-max(ld-.8,0.)*1.1)*step(.8,ld)*select(.5,1.,ld<3.4);
      let lcov=clamp((1.-ld)*lr+.5,0.,1.);
      let mu=sqrt(max(1.-ld*ld,0.));
      let body=mix(mix(lc,vec3f(120.,90.,70.)/255.,.25),mix(vec3f(1.,1.,.97),mix(lc,vec3f(1.),.45),smoothstep(.1,.55,ld)),mu);
      c=mix(c,body,lcov*.92);
    }
    if(lt.y>0.){let gd=length(p-sun)/sr;c=c+vec3f(1.,.98,.93)*.34*lt.y*clamp((3.2-gd)/2.2,0.,1.)*step(1.,gd);}
  }
  /* дизеринг против бэндинга восьмибитного градиента */
  c=c+(kh(p0*1.37)-.5)/255.;
  return vec4f(c,1.);
}`;
/* цвет туманности и полосы: палитра мира, уведённая по кругу к звезде и дальше —
   две разные краски, а не одна зелень */
function skyNebCols(p,sc){
  const a=hueToward(skyTint(p,4),sc,.45),b=hueToward(skyTint(p,2),[236,120,170],.55);
  const lift=c=>{const m=Math.max(c[0],c[1],c[2],1);return c.map(v=>clamp(v/m*230,40,255));};
  return [lift(a),lift(b)];
}
/* метеор этой минуты: окно раз в период, место и путь — от зерна посадки */
function skyMeteor(R){
  if(!R.met)return null;
  const per=Math.round(900-R.met*600),n=Math.floor(G.t/per),t=(G.t%per)/42;
  if(t>1)return null;
  const h=hashi(n,R.metSd,0x3E7);
  if((h&7)>R.met*7)return null;
  const x0=W*(.1+((h>>>3)&255)/255*.8),y0=H*(.05+((h>>>11)&127)/127*.28);
  const a=((h>>>18)&1?1:-1)*(.35+((h>>>19)&63)/63*.7),L=Math.min(W,H)*(.10+((h>>>25)&31)/31*.14);
  const dx=Math.cos(a)*L*(a<0?-1:1),dy=Math.abs(Math.sin(a))*L;
  const e=Math.min(1,t*1.25),s=Math.max(0,e-.35);
  return {ax:x0+dx*s,ay:y0+dy*s,bx:x0+dx*e,by:y0+dy*e,k:Math.sin(Math.PI*t)};
}
/* небо целиком (воздух, ночь, звёзды, полоса, туманность, метеоры, рассеяние,
   диск, затмение, три света); false — кадра видеокарты нет, небо молчит */
function gpuSky(p,cx,cy,hor){
  const pass=gpuScene();if(!pass)return false;
  const R=skyRoll(p);
  const D=skyDay(p),sc=hex2rgb((G.sys&&G.sys.cls&&G.sys.cls.col)||"#ffe08a"),air=p.T.atm!=="отсутствует";
  const sun=celSun(p),SS=sunSpot(p),nite=surfNight(p);
  const U=GSK;U.fill(0);
  U[0]=D.top[0]/255;U[1]=D.top[1]/255;U[2]=D.top[2]/255;
  U[4]=D.bot[0]/255;U[5]=D.bot[1]/255;U[6]=D.bot[2]/255;
  U[8]=sc[0]/255;U[9]=sc[1]/255;U[10]=sc[2]/255;U[11]=air?1:0;
  const under=clamp((SS.alt+.42)/.5,0,1);
  U[3]=air?clamp(1-SS.alt*2.2,0,1):0;U[7]=SS.up?1:0;
  U[12]=SS.x;U[13]=SS.y;U[14]=H*.045;U[15]=SS.up?1:under*.7;
  const day=clamp(1+sun.alt*2.2,0,1);
  U[16]=day;U[17]=air?clamp(1-Math.abs(sun.alt)*1.4,0,1)*day:0;U[18]=nite;U[19]=sun.az;
  /* звёзды: в пустоте всегда, в воздухе — сколько пропустит небо (решает
     шейдер по светлоте), в непогоду гаснут */
  const wp=(air&&typeof weatherPower==="function")?weatherPower(p):0;
  U[20]=1-wp*.92;U[21]=R.sd;U[22]=R.dens;U[23]=R.warm;
  const M=starMove(cx*.1,cy*.02,1),kx=W/1600;
  U[24]=cx*.1*kx;U[25]=cy*.02*kx;U[26]=M.mov>.04?M.dx*M.kx:0;U[27]=M.mov>.04?M.dy*M.ky:0;
  U[28]=R.band[0];U[29]=R.band[1];U[30]=R.band[2];U[31]=R.band[3];
  const NC=skyNebCols(p,sc);
  U[32]=NC[0][0]/255;U[33]=NC[0][1]/255;U[34]=NC[0][2]/255;U[35]=R.band[4]*(air?.7:1);
  U[36]=NC[1][0]/255;U[37]=NC[1][1]/255;U[38]=NC[1][2]/255;
  if(R.neb){U[39]=R.neb[3]*(air?.6:1);U[40]=R.neb[0]*W;U[41]=R.neb[1]*H;U[42]=R.neb[2];U[43]=R.neb[4];}
  /* затмение и три света — из календаря (06a, 11g) */
  const C=(typeof celNow==="function")?celNow():{};
  if(C.ecl&&SS.up){const sr=H*.045,off=C.ecl.ph*sr*2.1;U[44]=off;U[45]=-off*.22;U[46]=sr*(.86+C.ecl.k*.3);U[47]=C.ecl.k;}
  const ld=(typeof lightsDepthHere==="function")?lightsDepthHere():0;
  if(ld){U[48]=ld===2?2:1;U[49]=lightsConj().k;}
  U[50]=(typeof celDark==="function")?celDark():0;
  U[51]=hor||H*SURF_HOR;
  /* сумерки: пояс Венеры виден, когда звезда у самого горизонта */
  U[53]=air?clamp(1-Math.abs(sun.alt+.04)*6,0,1):0;
  const MT=skyMeteor(R);
  if(MT){U[56]=MT.ax;U[57]=MT.ay;U[58]=MT.bx;U[59]=MT.by;U[55]=MT.k*(1-wp);}
  gpuField(pass,"gsky2",GSK_WGSL,U,[]);
  return true;
}
