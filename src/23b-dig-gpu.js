/* ══════════════ шахта на видеокарте: свет, день в стволе, руда, пыль (G7) ══════════════
   Та же модель, что в пещере (22c), и та же общая часть поля: всё, что шахта
   нарисовала до этого места, — альбедо, свет его умножает. Было: виньетка
   multiply вокруг человека, тёплое пятно, конус и пыль, клипованные по
   выработке, круги ламп площадок поверх темноты. Стало:
   · окружающий и фонари умножают ПОРОДУ — сразу после выкладки тайлов (digShade),
     как виньетка main: руда, зерно, пол и крепь кладутся поверх своей яркостью;
     одно поле по всему кадру гасило их на 5–17 % и сплющивало σ (Контроль 26.09);
     темнота — поверх всего, в конце кадра;
   · фонарь шлема — конус с тенями от породы (маска — выработка и небо);
   · лампы площадок, камер и ниш — источники с тенями, а не круги;
   · резак у забоя — тёплый живой источник: работа освещает забой;
   · дня под кромкой нет, как у main: столб дня по стволу и дневной окружающий
     у кромки белили шахту на 0 м (Контроль 26.09);
   · руда — кистью main в 2D (23a): блик на зерне и слабое зарево тела;
   · пыль висит в луче и плывёт, искры из-под резака — выше единицы.
   Небо над устьем не освещается — оно само свет. */
const DIG_MSK=5;                                  /* мира на тексель маски */
/* места шахты: окружающий свет от фонаря, дня нет.
   Окружающий — как у main (M55): виньетка от фонаря 1 → .59 на .55 → .29 у R0=.62·max(W,H),
   ровная, без сдвига тона, и темнота .28 → .72 по кругу .52·max(W,H), пока камера под землёй
   (fu.v[14].z). Синий окружающий уводил грунт в синий, у main он оливковый (Контроль 26.09).
   Центр — человек (fu.v[14].xy), как у main; фонарь шлема на ладонь выше.
   fu.v[5] — общий уровень, 1 как у main: порода из печи того же цвета, что в кадре main */
const DIG_OWN_WGSL=`
fn vigA(w:vec2f)->vec3f{
  let R0=max(fu.res.z,fu.res.w)*.62;
  let s=clamp((length(w-fu.v[14].xy)-R0*.16)/(R0*.84),0.,1.);
  let m=vec3f(.588,.596,.627);
  return select(mix(m,vec3f(.290,.298,.337),(s-.55)/.45),mix(vec3f(1.),m,s/.55),s<.55);}
fn darkM(w:vec2f)->f32{
  let R=max(fu.res.z,fu.res.w)*.52;
  let s=clamp((length(w-fu.v[14].xy)-30.)/max(R-30.,1.),0.,1.);
  return 1.-fu.v[14].z*select(.28+.44*(s-.45)/.55,.28*s/.45,s<.45);}
fn ambAt(w:vec2f)->vec3f{return vigA(w)*darkM(w)*fu.v[5].rgb;}
fn skyAt(w:vec2f)->f32{return smoothstep(.3,.7,maskAt(w,0.).g);}
fn airAt(w:vec2f)->f32{let m=maskAt(w,0.);return (1.-smoothstep(.3,.7,m.r))*(1.-smoothstep(.3,.7,m.g));}
fn waterAt(w:vec2f,t:f32,K:f32)->vec3f{return vec3f(0.);}
fn dayAt(w:vec2f)->vec3f{return vec3f(0.);}
/* своё сложением — свет в выработке. Тёплое у налобника («digwarm» main) ложится раньше —
   на породу до заливки хода и до неба (digShade), как у main: поверх заливки оно высветляло
   ход на четверть против main (Контроль 26.09) */
fn ownAdd(w:vec2f)->vec3f{return voidLit(w)*airAt(w);}
/* свет в выработке — как у main, сложением и только в воздухе хода (main клипует его по
   выработке): конус налобника .13 на 170 px, пятно на полу — эллипс 130×42 (.20, .07 на
   середине, ноль), окружающий у человека .10 на 84 px и ореолы ламп крепи .55/.18 на 64 px.
   Без них ход под человеком был на четверть темнее main (Контроль 26.09) */
fn voidLit(w:vec2f)->vec3f{
  let d=w-fu.v[14].xy;let f=select(-1.,1.,fu.v[2].z>=0.);
  var o=vec3f(0.);
  let u=d.x*f;
  if(u>0.&&u<190.&&d.y>-12.-52.*u/190.&&d.y<-12.+64.*u/190.){
    o+=vec3f(.745,.843,.922)*(.13*max(0.,1.-u/170.));}
  let e=d-vec2f(f*26.,16.);
  if(e.x*e.x/16900.+e.y*e.y/1764.<1.){
    let t=clamp((length(e)-4.)/126.,0.,1.);
    o+=select(vec3f(.0494,.0494,.0439)*(2.-2.*t),mix(vec3f(.1678,.1616,.1396),vec3f(.0494,.0494,.0439),t*2.),t<.5);}
  o+=vec3f(.0588,.0667,.0745)*(1.-clamp((length(d)-2.)/82.,0.,1.));
  let n=i32(fu.v[4].w);
  for(var k=0;k<${CAVE_LIT_MAX};k++){
    if(k>=n){break;}
    let P=fu.v[6+k];if(abs(P.z-120.)>.5){continue;}        /* лампы крепи — радиус 120 (digLights) */
    let t=length(w-P.xy)/64.;
    if(t<1.){o+=select(vec3f(.18,.1412,.0918)*(1.-t)/.75,mix(vec3f(.55,.4616,.3235),vec3f(.18,.1412,.0918),t*4.),t<.25);}
  }
  return o;}
`;
/* маска: красный — порода, зелёный — небо; пересобирается, когда копнули (D.maskV) */
function digMask(D,p){
  const key=(D.maskV|0)+"|"+((p&&p.seed)|0);
  if(D.mask&&D.mask.key===key)return D.mask;
  let maxRow=0;
  for(const k in D.cells){const c=D.cells[k];if(c&&c.dug){const r=+k.slice(k.indexOf(",")+1);if(r>maxRow)maxRow=r;}}
  const x0=-(DIG_HALF+3)*DIG_CELL,x1=(DIG_HALF+4)*DIG_CELL,y0=-360,y1=(maxRow+8)*DIG_CELL;
  const S=DIG_MSK,cw=Math.ceil((x1-x0)/S),ch=Math.ceil((y1-y0)/S);
  const cv=document.createElement("canvas");cv.width=cw;cv.height=ch;
  const c=cv.getContext("2d");
  c.setTransform(1/S,0,0,1/S,-x0/S,-y0/S);
  c.fillStyle="rgb(255,0,0)";c.fillRect(x0,y0,x1-x0,y1-y0);
  c.fillStyle="rgb(0,0,0)";c.fill(digVoidPath(D,0,0,0,maxRow+1));
  c.fillStyle="rgb(0,255,0)";
  c.beginPath();c.moveTo(x0,y0);
  for(let x=x0;x<=x1+6;x+=6)c.lineTo(x,digSurfY(p,x));
  c.lineTo(x1+6,y0);c.closePath();c.fill();
  if(D.mask&&typeof gpuMipDrop==="function"&&GPU.dev)gpuMipDrop(D.mask.cv);
  return D.mask={key,cv,x0,y0,w:cw*S,h:ch*S};
}
const DIG_LIT_C=[];
/* источники в кадре (мир): лампы, собранные крепью за этот кадр, и резак */
function digLights(D,camx,camy,early){
  const L=DIG_LIT_C;L.length=0;
  const vw=W,vh=H,cx=camx+vw/2,cy=camy+vh/2;
  const put=(x,y,r,col,I,pri)=>{
    if(x+r<camx||x-r>camx+vw||y+r<camy||y-r>camy+vh)return;
    L.push({x,y,r,c:col,I,k:Math.hypot(x-cx,y-cy)-r-(pri||0)});
  };
  /* порода светится до крепи — ей лампы прошлого кадра, уже в мире (digLampsKeep) */
  if(early){const P=D._lampsW;if(P)for(let i=0;i<P.length;i+=2)put(P[i],P[i+1],120,[1,.78,.52],1.25);}
  else if(D._lamps)for(const [lx,ly] of D._lamps)put(lx+camx,ly+camy,120,[1,.78,.52],1.25);
  if(D.target){
    for(const k in D.cells)if(D.cells[k]===D.target){
      const i=k.indexOf(","),col=+k.slice(0,i),row=+k.slice(i+1);
      /* дыхание резака — плавное, не вспышками: работа, а не стробоскоп */
      const f=.85+.15*Math.sin(G.t*.37)*Math.sin(G.t*.23+1.3);
      put(col*DIG_CELL+DIG_CELL/2,row*DIG_CELL+DIG_CELL/2,95,[1,.72,.42],1.3*f,800);
      break;
    }
  }
  L.sort((a,b)=>a.k-b.k);
  if(L.length>CAVE_LIT_MAX)L.length=CAVE_LIT_MAX;   /* v[14] — числа шахты */
  return L;
}
/* числа поля: камера, маска, фонарь шлема {x,y,f} в мире, источники */
function digLitU(D,p,camx,camy,lamp,early){
  const U=CAVE_LIT_U,lk=kitStat().lamp,M=digMask(D,p);
  U.fill(0);
  U[0]=camx;U[1]=camy;U[2]=G.viewK||1;U[3]=G.t;
  U[4]=M.x0;U[5]=M.y0;U[6]=1/M.w;U[7]=1/M.h;
  const a=.12;
  U[8]=lamp.x;U[9]=lamp.y;U[10]=lamp.f*Math.cos(a);U[11]=Math.sin(a);
  /* луч — как у main: холодный (190,215,235) и слабый; тёплое у налобника — зарево ниже */
  U[12]=250*lk;U[13]=Math.cos(.55);U[14]=Math.cos(.18);U[15]=.6;
  U[16]=.745;U[17]=.843;U[18]=.922;
  U[20]=1;U[21]=1;U[22]=1;U[23]=.6;
  const L=digLights(D,camx,camy,early);
  U[19]=L.length;
  for(let i=0;i<L.length;i++){const s=L[i],o=24+i*4;
    U[o]=s.x;U[o+1]=s.y;U[o+2]=s.r;U[o+3]=caveLitPack(s.c[0],s.c[1],s.c[2],s.I);}
  U[56]=lamp.x;U[57]=lamp.y+12;                 /* человек: виньетка, темнота, тёплое, свет хода */
  U[58]=camy>-H*.3?1:0;                        /* темнота main — пока камера под землёй */
  return M;
}
/* порода под светом: сразу после тайлов, до 2D — как виньетка main, которая умножала
   только породу. Темноты тут нет: она ложится поверх всего в конце кадра */
function digShade(D,p,camx,camy,lamp){
  const pass=gpuScene();if(!pass)return;
  const M=digLitU(D,p,camx,camy,lamp,true);
  CAVE_LIT_U[58]=0;
  gpuField(pass,"dig.mul",CAVE_MUL_WGSL+DIG_OWN_WGSL,CAVE_LIT_U,[{view:gpuMipTex(M.cv).view}],{blend:"mul",smp:gpuMipSmp()});
  /* тёплое у налобника — «digwarm» main: .20·(1−t)^2.2 на .34·R0 у человека, сложением по породе;
     заливка хода и небо (2D) ложатся поверх и его закрывают, как у main */
  const K=G.viewK||1,R=Math.max(W,H)*.62*.34;
  warmGlow(pass,(lamp.x-camx)*K,(lamp.y+12-camy)*K,R*K,R*K,[1,.776,.502],.20,0);
}
/* темнота main поверх всего нарисованного, небо не трогает */
const DIG_DARK_WGSL=CAVE_LIT_WGSL+`
fn field(p:vec2f,uv:vec2f)->vec4f{
  let w=p/fu.v[0].z+fu.v[0].xy;
  return vec4f(vec3f(mix(darkM(w),1.,skyAt(w))),1.);}
`;
/* конец кадра: темнота, воздух в луче, тёплое у налобника, огни */
function drawDigLight(D,p,camx,camy,lamp){
  const pass=gpuOver();
  if(!pass){digLampsKeep(D,camx,camy);return;}
  const M=digLitU(D,p,camx,camy,lamp,false);
  const mt={view:gpuMipTex(M.cv).view},sm=gpuMipSmp();
  if(CAVE_LIT_U[58])gpuField(pass,"dig.dark",DIG_DARK_WGSL+DIG_OWN_WGSL,CAVE_LIT_U,[mt],{blend:"mul",smp:sm});
  /* в поле сложения — свет хода main (voidLit): конус налобника, пятно на полу, ореолы ламп.
     Рассеяния луча в воздухе у main нет — у фонаря здесь нет силы, иначе конус вдвое */
  CAVE_LIT_U[15]=0;
  gpuField(pass,"dig.add",CAVE_ADD_WGSL+DIG_OWN_WGSL,CAVE_LIT_U,[mt],{blend:"add",smp:sm});
  digEmit(D,camx,camy,pass,G.viewK||1);
  digLampsKeep(D,camx,camy);
}
/* лампы крепи этого кадра — в мир, породе следующего (digShade); список кадра — пустой */
function digLampsKeep(D,camx,camy){
  const P=D._lampsW||(D._lampsW=[]);P.length=0;
  if(D._lamps){for(const [lx,ly] of D._lamps)P.push(lx+camx,ly+camy);D._lamps.length=0;}
}
/* огни выше единицы: стёкла ламп и искры. Руда — в 2D кистью main (23a): зерно, белый блик
   и слабое зарево тела; блики выше единицы давали ореол, которого у main нет (Контроль 26.09) */
const DIG_EMIT=[];
function digEmit(D,camx,camy,pass,K){
  const S=DIG_EMIT;S.length=0;
  /* стёкла ламп площадок: ядро выше единицы — узкий ореол */
  if(D._lamps)for(const [lx,ly] of D._lamps)S.push([1,lx*K,ly*K,1.3*K,0,0,1.6*K,255*2.2,228*2.2,170*2.2,1]);
  /* искры из-под резака: HDR-точки, разлетаются и гаснут */
  if(D.target){
    for(const k in D.cells)if(D.cells[k]===D.target){
      const i0=k.indexOf(","),col=+k.slice(0,i0),row=+k.slice(i0+1);
      const x=col*DIG_CELL-camx+DIG_CELL/2, y=row*DIG_CELL-camy+DIG_CELL/2;
      for(let i=0;i<7;i++){
        const ph=(G.t*.6+i*23)%18, a=1-ph/18;
        const ex=x+Math.cos(i*2.3)*ph*1.2, ey=y+Math.sin(i*2.3)*ph*.9+ph*ph*.02;
        const tx=ex-Math.cos(i*2.3)*2.2, ty=ey-Math.sin(i*2.3)*1.6;
        S.push([2,tx*K,ty*K,ex*K,ey*K,.45*K,.8*K,255*3,206*3,140*3,a*a]);
      }
      break;
    }
  }
  gpuShapes(pass,S,{blend:"add"});
}
