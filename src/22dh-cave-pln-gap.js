/* ── световые события в пролётах (M630c): на любых 30 м линии ходьбы что-то светит ──
   22d знает огни, что горят сами: устье, арка, озеро, кристаллы, янтарь. Где между ними
   пролёт длиннее, сюда, в его середину, встаёт тело по породе мира: в осадочной — нити
   светляков со свода, в вулканической — тёплая трещина продуха в задней стене, во льду —
   окно дня сквозь тонкий лёд свода, в прочих — мокрая стена, что ловит фонарь (тише всех).
   Событие — тело, подписи ему не нужно. */
const CAVE3_GAP={win:30,step:28,w:4,
  worm:{thread:[.05,.11,.10],bead:[.30,1.0,.84],light:[.15,.45,.40],floor:[.35,1.1,.95],glow:[.25,.85,.72]},
  vent:{core:[1.0,.97,.55],hot:[1.0,.40,.10],rim:[.5,.07,.02],ember:[.9,.28,.06],spark:[1.0,.62,.22],lip:[7,2.6,.6],light:[1.4,.55,.15],glow:[.95,.40,.10]},
  ice:{win:[.70,.87,1.0],mid:[.40,.55,.70],lip:[1.8,2.3,2.8],light:[.6,.8,1.0],glow:[.52,.70,.90]},
  wet:{run:[.50,.52,.53],light:[1.1,1.2,1.35],glow:[.30,.36,.42]}};

/* куда встают события: середины пролётов между огнями (и краями хода), каждое ±2 м;
   на месте без воздуха сдвигается до 3 м к залу, где свод выше */
function cave3GapPlan(C,base){
  const P=CAVE_PPM,K=CAVE3_GAP,E=CAVE_W/P,L=base.map(e=>[e[0],e[1]]).sort((a,b)=>a[0]-b[0]),ed=[[-1e9,0]];
  for(const e of L){const t=ed[ed.length-1];if(e[0]<=t[1])t[1]=Math.max(t[1],e[1]);else ed.push(e);}
  ed.push([E,1e9]);
  const out=[],room=X=>{const x=clamp(X,1,E-1)*P;return caveFloorOf(C,x,false)-caveCeilOf(C,x,false);};
  for(let i=0;i+1<ed.length;i++){
    const a=Math.max(0,ed[i][1]),b=Math.min(E,ed[i+1][0]),len=b-a;
    if(len<K.step)continue;
    const n=Math.ceil(len/(K.step-2))-1;
    for(let k=1;k<=n;k++){
      const m=a+len*k/(n+1);
      let best=m,bv=room(m);
      for(let d=-3;d<=3;d+=.5){const v=room(m+d);if(v>bv*1.15+P*.3){bv=v;best=m+d;}}
      out.push(clamp(best,1,E-1));
    }
  }
  return out;
}
/* те же события как записи убранства (22dc) */
function cave3GapItems(C,F){
  cave3Events(C,F);
  const P=CAVE_PPM,out=[];
  for(const X of C.ev3.gaps){
    const x=X*P,c=caveCeilOf(C,x,false),f=caveFloorOf(C,x,false);
    out.push({k:"gap",X,g:{c,f,ym:-(c+f)/2/P,gap:(f-c)/P,zd:cave3Zd(F,x,(c+f)/2)},seed:hashi(Math.round(X*10),C.seed,0x6A9)});
  }
  return out;
}
/* задняя стена на высоте Y: от z0 вглубь до камня */
function cave3WallZ(F,X,Y,z0){
  let a=z0;
  for(let n=0;n<60&&cave3Den(F,X,Y,a+.15)<=0;n++)a+=.15;
  let lo=a,hi=a+.15;
  for(let n=0;n<8;n++){const m=(lo+hi)/2;if(cave3Den(F,X,Y,m)>0)hi=m;else lo=m;}
  return (lo+hi)/2;
}
/* тело события по породе; ничего не встало — мокрая стена, она встанет почти везде */
function cave3GapBuild(B,q,lights,glows){
  const k=cave3StyKind(G.surf&&G.surf.p&&G.surf.p.type);
  const f=k==="sed"?cave3GapWorm:k==="volc"?cave3GapVent:k==="ice"?cave3GapIce:null;
  if(f&&f(B,q,lights,glows))return true;
  return cave3GapWet(B,q,lights,glows);
}
/* место в глубине за линией ходьбы, где есть воздух */
function cave3GapDeep(B,q,u){
  const F=B.F,g=q.g,z1=Math.max(1.9,g.zd-1);
  for(const z of [lerp(1.6,z1,u),lerp(1.6,z1,u*.5),1.6])if(cave3Den(F,q.X,g.ym,z)<-.4)return z;
  return -1;
}
/* светляки: колония нитей со свода, на каждой бусины; бусины горят бирюзой, нити едва видны */
function cave3GapWorm(B,q,lights,glows){
  const F=B.F,r=B.r,g=q.g,K=CAVE3_GAP.worm,z0=cave3GapDeep(B,q,.55);
  if(z0<0)return false;
  const t0=cave3Up(F,q.X,g.ym,z0);
  if(t0-g.ym>g.gap*1.2+2)return false;
  let n=0,lg=0;const nl=3+(r()*3|0);
  for(let i=0;i<40;i++){
    /* первые — длинные нити в 2–4 м, по ним колонию видно издали; вокруг — короткая бахрома */
    const long=lg<nl,x=q.X+(r()-.5)*(long?2.2:(r()<.7?2.6:4.4)),z=clamp(z0+(r()-.5)*(long?1:1.6),1.3,Math.max(1.5,g.zd-.4));
    if(cave3Den(F,x,g.ym,z)>-.3)continue;
    const tp=cave3Up(F,x,g.ym,z);
    if(tp-g.ym>g.gap*1.2+2)continue;
    const bot=cave3Down(F,x,g.ym,z),sw=(r()-.5)*(long?.14:.06);
    const l=long?Math.min(2+r()*2,(tp-bot)*.75):Math.min(.12+Math.pow(r(),1.7)*1.1,(tp-bot)*.45);
    if(l<(long?1.2:.08))continue;
    if(long)lg++;
    const top=[x,tp+.03,z],end=[x+sw,tp-l,z+sw*.5];
    plnTube(B.m,{path:[top,end],rad:long?.007:.005,sides:3,col:K.thread,mat:PLN_MAT.glow,glow:1});
    const nb=1+(l/(long?.16:.22)|0);
    for(let b=0;b<nb;b++){
      const t=b===nb-1?1:(b+.5+r()*.4)/nb,p=[lerp(top[0],end[0],t),lerp(top[1],end[1],t),lerp(top[2],end[2],t)],s=(b===nb-1?.022:.013)*(.8+r()*.5);
      plnBlob(B.m,{c:p,r:[s,s*1.3,s],sub:0,col:K.bead,mat:PLN_MAT.glow,glow:(b===nb-1?2.4:1.4)*(.7+r()*.5)});
    }
    n++;
  }
  if(n<8)return false;
  const p=[q.X,t0-.7,z0],fl=cave3Down(F,q.X,g.ym,z0);
  lights.push({p,r:5.5,c:K.light});
  /* свет колонии ложится на камень под ней: пол под нитями бирюзовый */
  if(t0-fl>2)lights.push({p:[q.X,fl+.9,z0-.4],r:3.2,c:K.floor});
  glows.push({p:[q.X,t0-.35,z0],c:K.glow,k:.42,s:1.7});
  return true;
}
/* продух: трещина в задней стене от пола вверх, ломаная, с отростками; дышит тёплым */
function cave3GapVent(B,q,lights,glows){
  const F=B.F,r=B.r,g=q.g,K=CAVE3_GAP.vent,z0=cave3GapDeep(B,q,.8);
  if(z0<0)return false;
  const bot=cave3Down(F,q.X,g.ym,z0),top=cave3Up(F,q.X,g.ym,z0),h=Math.min(1.4+r()*1.4,(top-bot)*.7);
  if(h<.9)return false;
  const crack=(x0,y0,len,dx,rad)=>{
    const pts=[];let x=x0;
    for(let y=y0;y<=y0+len;y+=.14){
      x+=dx*.14+(r()-.5)*.12;
      const zw=cave3WallZ(F,x,y,Math.max(1.3,z0-1));
      if(zw-z0>6)break;
      pts.push([x,y,zw-.015]);
    }
    if(pts.length>=3){
      /* жар в щели; тлеющий камень вокруг — это свет вплотную к стене, не лента: лента читается вырезкой.
         Щель в три слоя (M631): тёмно-красная кайма, оранжевое тело, бело-жёлтое ядро; ядро то горит,
         то тлеет по длине — ровной яркости во всю щель нет */
      const w=t=>(1-.75*t)*(.75+.25*Math.sin(t*19+x0)),heat=t=>clamp(.25+.75*Math.sin(t*9.3+x0*3.1)*Math.sin(t*4.1+x0+1.3)+.35,0,1);
      const at=dz=>pts.map(p=>[p[0],p[1],p[2]-dz]);
      plnTube(B.m,{path:pts,rad:t=>rad*1.55*w(t),sides:5,flat:.5,up:[1,0,0],col:K.rim,mat:PLN_MAT.glow,glow:.35,cap:true});
      plnTube(B.m,{path:at(.008),rad:t=>rad*.85*w(t),sides:5,flat:.5,up:[1,0,0],col:t=>plnMul(K.hot,.7+.3*heat(t)),mat:PLN_MAT.glow,glow:1.8,cap:true});
      /* ядро выведено вперёд тела на его радиус — иначе тело его прячет */
      plnTube(B.m,{path:at(.02+.6*rad),rad:t=>Math.max(.002,rad*.55*w(t)*(.3+.7*plnSmooth(.2,.7,heat(t)))),sides:5,flat:.5,up:[1,0,0],col:t=>{const e=heat(t);return plnMul(plnMix3(K.hot,K.core,plnSmooth(.1,.55,e)),.22+.78*e*e*e);},mat:PLN_MAT.glow,glow:6,cap:true});
    }
    return pts;
  };
  const main=crack(q.X,bot+.05,h,(r()-.5)*.2,.13+r()*.05);
  if(main.length<4)return false;
  for(let k=0,n=2+(r()*2|0);k<n;k++){
    const p=main[1+(r()*(main.length-2)|0)];
    crack(p[0],p[1],.4+r()*.6,(r()<.5?-1:1)*(.6+r()*.5),.05);
  }
  const ft=main[0];
  for(let k=0;k<7;k++){
    const s=.03+r()*.04,x=ft[0]+(r()-.5)*.8,zz=ft[2]-.15-r()*.5,y=cave3Down(F,x,ft[1]+.4,zz);
    plnBlob(B.m,{c:[x,y+s*.3,zz],r:[s*1.4,s*.6,s],sub:0,col:K.ember,mat:PLN_MAT.glow,glow:1+r()*1.2});
  }
  /* искры: от щели вверх, реже и мельче к высоте */
  const tp=main[main.length-1];
  for(let k=0;k<14;k++){
    const u=Math.pow(r(),1.6),p=main[r()*main.length|0],y=p[1]+.15+u*1.6,s=.012+(1-u)*.014;
    plnBlob(B.m,{c:[p[0]+(r()-.5)*(.2+u*.8),Math.min(y,tp[1]+1.4),p[2]-.12-r()*.5],r:[s,s*1.8,s],sub:0,col:K.spark,mat:PLN_MAT.glow,glow:2+r()*1.5});
  }
  const mid=main[main.length>>1],lo=main[main.length>>2];
  /* жар на камне в 2 м вокруг: свет вплотную к стене, грани берут его рыжим */
  lights.push({p:[lo[0],lo[1],lo[2]-.3],r:2.8,c:K.lip});
  lights.push({p:[mid[0],mid[1],mid[2]-.9],r:5.5,c:K.light});
  /* ореол — не шире полутора щелей: жар держит камень, а не воздух */
  glows.push({p:[mid[0],mid[1]-.2,mid[2]-.25],c:K.glow,k:.4,s:.5});
  return true;
}
/* окно дня: высоко в задней стене лёд истончён и светится холодным пятном с неровной каймой;
   пятно лежит в стене и смотрит на нас, под ним — холодный свет на полу */
function cave3GapIce(B,q,lights,glows){
  const F=B.F,r=B.r,g=q.g,K=CAVE3_GAP.ice,z0=cave3GapDeep(B,q,.7);
  if(z0<0)return false;
  const bot=cave3Down(F,q.X,g.ym,z0),top=cave3Up(F,q.X,g.ym,z0),h=top-bot;
  if(h<1.6)return false;
  const cy=bot+h*.72;
  /* стекло — внахлёст: по краю тусклее, к середине светлее, ни одной щели; кайму даёт свет на камне */
  let n=0,zs=0;
  const pane=(m,rx,ry,s0,s1,col,gl)=>{
    for(let i=0;i<m;i++){
      const a=r()*TAU,d=Math.sqrt(r()),x=q.X+Math.cos(a)*d*rx,y=cy+Math.sin(a)*d*ry;
      const zw=cave3WallZ(F,x,y,Math.max(1.3,z0-1));
      if(zw-z0>5)continue;
      const s=lerp(s0,s1,d)*(.85+r()*.3);
      plnBlob(B.m,{c:[x,y,zw-.01-(gl>1.2?.01:0)],r:[s,s*.8,.04],sub:1,lean:r()*TAU,col,mat:PLN_MAT.glow,glow:gl});
      n++;zs+=zw;
    }
  };
  const ry=Math.min(.75,h*.2);
  pane(12,.85,ry*.85,.4,.26,K.mid,1.2);
  pane(10,.5,ry*.5,.36,.24,K.win,1.8);
  if(n<10)return false;
  const zw=zs/n;
  lights.push({p:[q.X,cy,zw-.35],r:2.6,c:K.lip});
  lights.push({p:[q.X,cy-.4,zw-1.3],r:7,c:K.light});
  glows.push({p:[q.X,cy,zw-.3],c:K.glow,k:.5,s:1.3});
  return true;
}
/* мокрая стена: ленты натёка, по которым бежит вода — мокрые до блеска, фонарь ловит их издали */
function cave3GapWet(B,q,lights,glows){
  const F=B.F,r=B.r,g=q.g,K=CAVE3_GAP.wet,z0=cave3GapDeep(B,q,.85);
  if(z0<0)return false;
  const bot=cave3Down(F,q.X,g.ym,z0),top=cave3Up(F,q.X,g.ym,z0),h=Math.min(top-bot,4);
  if(h<1)return false;
  let n=0;
  for(let k=0;k<9;k++){
    const pts=[];let x=q.X+(r()-.5)*3;
    const y1=bot+h*(.55+r()*.4),y0=bot+h*r()*.25;
    for(let y=y1;y>=y0;y-=.18){
      x+=(r()-.5)*.05;
      const zw=cave3WallZ(F,x,y,Math.max(1.3,z0-1));
      if(zw-z0>6)break;
      pts.push([x,y,zw-.02]);
    }
    if(pts.length<4)continue;
    plnTube(B.m,{path:pts,rad:t=>.11+.06*Math.sin(t*7+k),sides:6,flat:.35,up:[1,0,0],col:K.run,mat:PLN_MAT.rock,glow:1});
    n++;
  }
  if(!n)return false;
  lights.push({p:[q.X,bot+h*.5,z0-1],r:4,c:K.light});
  glows.push({p:[q.X,bot+h*.5,z0],c:K.glow,k:.3,s:1.6});
  return true;
}
