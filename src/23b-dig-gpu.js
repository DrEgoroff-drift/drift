/* ══════════════ шахта на видеокарте: свет, день в стволе, руда, пыль (G7) ══════════════
   Та же модель, что в пещере (22c), и та же общая часть поля: всё, что шахта
   нарисовала до этого места, — альбедо, свет его умножает. Было: виньетка
   multiply вокруг человека, тёплое пятно, конус и пыль, клипованные по
   выработке, круги ламп площадок поверх темноты. Стало:
   · фонарь шлема — конус с тенями от породы (маска — выработка и небо);
   · лампы площадок, камер и ниш — источники с тенями, а не круги;
   · резак у забоя — тёплый живой источник: работа освещает забой;
   · день приходит СВЕРХУ: столб от неба вниз по стволу, по маске — чем больше
     породы над точкой, тем меньше дня; у кромки земли разрез виден, как днём,
     в глубине остаётся только то, до чего достал свет;
   · руда светит сама: слабое зарево тела и блики зёрен выше единицы у фонаря —
     они и вспыхивают в лестнице свечения, когда человек подходит;
   · пыль висит в луче и плывёт, искры из-под резака — выше единицы.
   Небо над устьем не освещается — оно само свет. */
const DIG_MSK=5;                                  /* мира на тексель маски */
/* места шахты: окружающий свет от фонаря, день сверху.
   Окружающий — как у main (M55): виньетка от фонаря 1 → .59 на .55 → .29 у R0=.62·max(W,H),
   ровная, без сдвига тона, и темнота .28 → .72 по кругу .52·max(W,H), пока камера под землёй
   (fu.v[14].z). Синий окружающий уводил грунт в синий, у main он оливковый (Контроль 26.09).
   fu.v[5] — общий уровень: порода флота светлее, чем в кадре main. День у кромки — свой */
const DIG_OWN_WGSL=`
fn vigA(w:vec2f)->vec3f{
  let R0=max(fu.res.z,fu.res.w)*.62;
  let s=clamp((length(w-fu.v[2].xy)-R0*.16)/(R0*.84),0.,1.);
  let m=vec3f(.588,.596,.627);
  return select(mix(m,vec3f(.290,.298,.337),(s-.55)/.45),mix(vec3f(1.),m,s/.55),s<.55);}
fn darkM(w:vec2f)->f32{
  let R=max(fu.res.z,fu.res.w)*.52;
  let s=clamp((length(w-fu.v[2].xy)-30.)/max(R-30.,1.),0.,1.);
  return 1.-fu.v[14].z*select(.28+.44*(s-.45)/.55,.28*s/.45,s<.45);}
fn ambAt(w:vec2f)->vec3f{
  let dep=w.y-fu.v[14].x;let day=fu.v[14].y;
  return vigA(w)*darkM(w)*fu.v[5].rgb+vec3f(.62,.63,.64)*day*(1.-smoothstep(20.,320.,dep));}
fn skyAt(w:vec2f)->f32{return smoothstep(.3,.7,maskAt(w,0.).g);}
fn airAt(w:vec2f)->f32{let m=maskAt(w,0.);return (1.-smoothstep(.3,.7,m.r))*(1.-smoothstep(.3,.7,m.g));}
fn waterAt(w:vec2f,t:f32,K:f32)->vec3f{return vec3f(0.);}
fn dayAt(w:vec2f)->vec3f{
  let day=fu.v[14].y;if(day<.01){return vec3f(0.);}
  var s=0.;var hit=0.;
  for(var i=1;i<=14;i++){
    let h=f32(i)*22.;let m=maskAt(w-vec2f(0.,h),clamp(log2(1.+h*.02),0.,3.));
    if(m.g>.5){hit=1.-f32(i)/16.;break;}
    s+=m.r;
  }
  return vec3f(.78,.86,1.)*day*hit*exp(-s*22.*SIG)*1.1;}
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
function digLights(D,camx,camy){
  const L=DIG_LIT_C;L.length=0;
  const vw=W,vh=H,cx=camx+vw/2,cy=camy+vh/2;
  const put=(x,y,r,col,I,pri)=>{
    if(x+r<camx||x-r>camx+vw||y+r<camy||y-r>camy+vh)return;
    L.push({x,y,r,c:col,I,k:Math.hypot(x-cx,y-cy)-r-(pri||0)});
  };
  if(D._lamps)for(const [lx,ly] of D._lamps)put(lx+camx,ly+camy,120,[1,.78,.52],1.25);
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
/* свет на всё нарисованное; lamp — фонарь шлема {x,y,f} в мире */
function drawDigLight(D,p,camx,camy,lamp){
  const pass=gpuOver();
  if(!pass){if(D._lamps)D._lamps.length=0;return;}
  const U=CAVE_LIT_U,K=G.viewK||1,lk=kitStat().lamp,M=digMask(D,p);
  U.fill(0);
  U[0]=camx;U[1]=camy;U[2]=K;U[3]=G.t;
  U[4]=M.x0;U[5]=M.y0;U[6]=1/M.w;U[7]=1/M.h;
  const a=.12;
  U[8]=lamp.x;U[9]=lamp.y;U[10]=lamp.f*Math.cos(a);U[11]=Math.sin(a);
  /* луч — как у main: холодный (190,215,235) и слабый; тёплое у налобника — зарево ниже */
  U[12]=250*lk;U[13]=Math.cos(.55);U[14]=Math.cos(.18);U[15]=.6;
  U[16]=.745;U[17]=.843;U[18]=.922;
  U[20]=.78;U[21]=.78;U[22]=.78;U[23]=.6;
  const L=digLights(D,camx,camy);
  U[19]=L.length;
  for(let i=0;i<L.length;i++){const s=L[i],o=24+i*4;
    U[o]=s.x;U[o+1]=s.y;U[o+2]=s.r;U[o+3]=caveLitPack(s.c[0],s.c[1],s.c[2],s.I);}
  const nite=(typeof surfNight==="function")?surfNight(p):0;
  U[56]=digSurfY(p,camx+W/2);U[57]=clamp(1-nite,0,1);
  U[58]=camy>-H*.3?1:0;                        /* темнота main — пока камера под землёй */
  const mt={view:gpuMipTex(M.cv).view},sm=gpuMipSmp();
  gpuField(pass,"dig.mul",CAVE_MUL_WGSL+DIG_OWN_WGSL,U,[mt],{blend:"mul",smp:sm});
  gpuField(pass,"dig.add",CAVE_ADD_WGSL+DIG_OWN_WGSL,U,[mt],{blend:"add",smp:sm});
  /* тёплое зарево у налобника — сложением, как «digwarm» у main (.20·(1−t)^2.2 на .34
     от max(W,H)·.62): тёплый акцент против холодной породы. Множитель поля его не давал —
     на тёмном камне тёплое пятно исчезало (Контроль 26.09) */
  const Rw=Math.max(W,H)*.62*.34*K;
  warmGlow(pass,(lamp.x-camx)*K,(lamp.y-camy)*K,Rw,Rw,[1,.776,.502],.20,0);
  digEmit(D,camx,camy,pass,K);
  if(D._lamps)D._lamps.length=0;
}
/* руда и огни выше единицы: зарево тела, блики зёрен у фонаря, стёкла ламп, искры */
const DIG_EMIT=[];
function digEmit(D,camx,camy,pass,K){
  const S=DIG_EMIT;S.length=0;
  const scanAll=G.tech.has("survey");
  const r0=Math.max(0,Math.floor(camy/DIG_CELL)-1), r1=Math.ceil((camy+H)/DIG_CELL)+1;
  for(let row=r0;row<=r1;row++)for(let col=-DIG_HALF;col<=DIG_HALF;col++){
    const cell=D.cells[col+","+row];
    if(!cell||cell.dug||!cell.res)continue;
    const dist=Math.hypot(col-D.col,row-D.row);
    if(!scanAll&&dist>7)continue;
    const c=digHexRgb(RES[cell.res].col);
    const vis=clamp((scanAll?1:1.15-dist/8),0,1);
    const x=col*DIG_CELL-camx, y=row*DIG_CELL-camy;
    /* тело светит само — слабо: жила видна и там, куда фонарь не достал */
    S.push([1,(x+DIG_CELL/2)*K,(y+DIG_CELL/2)*K,DIG_CELL*.35*K,0,0,DIG_CELL*.6*K,c[0],c[1],c[2],.26*vis]);
    /* блики: те же зёрна, что рисует 23a, — там, где на них лёг фонарь */
    const lampK=clamp(1.25-dist/3.5,0,1);
    if(lampK<=0)continue;
    const n=3+Math.min(5,cell.amount);
    for(let i=0;i<n;i++){
      const hh=hashi(col*137+i*31,row*211+i,0x0E2E);
      const ox=(hh&31)/31*DIG_CELL, oy=((hh>>>5)&31)/31*DIG_CELL;
      const rr=1.1+((hh>>>10)&3)*.55, an=.35+((hh>>>16)&7)/7*.5;
      const lx=-rr*.3, ly=-rr*.35, cs=Math.cos(an), sn=Math.sin(an);
      const gx=x+ox+lx*cs-ly*sn, gy=y+oy+lx*sn+ly*cs;
      /* блеск идёт волной от шага человека, а не мигает: фаза — от места зерна */
      const tw=.75+.25*Math.sin(G.t*.02+(hh>>>22)*.9+D.col*1.7+D.row*2.3);
      const I=lampK*vis*tw*(.8+((hh>>>22)&3)/3*.9);
      S.push([1,gx*K,gy*K,rr*.45*K,0,0,1.1*K,(255+c[0])*1.2,(244+c[1])*1.2,(220+c[2])*1.2,I]);   /* блеск — цвета зерна, добела у ядра */
    }
  }
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
/* "#rrggbb" → [r,g,b] (цвет ресурса в таблице — строкой) */
function digHexRgb(s){
  if(typeof s!=="string"||s[0]!=="#")return [200,200,200];
  const v=s.length===4?s.slice(1).split("").map(h=>parseInt(h+h,16)):[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
  return v;
}
