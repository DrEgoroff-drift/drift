/* ══════════════ пещера на движке: что лежит в камне разреза (M630b, проход 4) ══════════════
   Стенд cvInk: там, где разрез проходит сквозь камень, видно, что в нём лежит, — плоско, тоном
   чуть в стороне от листа, без света и без спроса на внимание. По роду камня мира: в осадочном —
   кости пловца того моря, что положило пласты, и раковины; в песчанике — раковины и редкая кость;
   в изверженном — пузыри газа гроздьями; во льду — цепочки пузырьков; в коренном — желваки.
   Корни сверху — где на поверхности что-то растёт: спускаются и кончаются там, где камень
   открывается. Жил руды на разрезе нет (M630d: штрих без тела читался царапиной). Всё строится полосами убранства (22dc), по
   записи на штуку; место штуки подбирается так, чтобы она целиком лежала в камне */
const CAVE3_INKS={z:-.03,bone:plnHex("#333d4b"),dim:plnHex("#222a35"),bark:plnHex("#2f2a25"),barkD:plnHex("#1d1a18"),
  gas:plnHex("#11141a"),gasRim:plnHex("#2b333e"),ice:plnHex("#3c4c5c"),fl:.2};

function cave3InkSolid(F,x,y){return cave3Den(F,x,y,.1)>.3;}

/* записи: где что лежит, в метрах; X — для полосы убранства */
function cave3InkItems(C,F){
  const P=CAVE_PPM,p=G.surf&&G.surf.p,kind=cave3StyKind(p&&p.type),r=rng((C.seed^0x1A4C)>>>0),xs=CAVE_W/P,out=[];
  const life=!!(p&&floraOf(p).length)&&kind!=="ice";
  const inRock=(pts,m)=>pts.every(q=>cave3InkSolid(F,q[0],q[1])&&cave3InkSolid(F,q[0],q[1]+m)&&cave3InkSolid(F,q[0],q[1]-m));
  /* глубина под полом одной из галерей или над сводом верхней — там, куда смотрит объектив */
  const spot=(X,lo,hi)=>{
    const u=r(),low=u<.3,up=u>.8;
    if(up){const c=-caveCeil(C,X*P)/P;return Math.min(c+lo+r()*(hi-lo),F.surfY-1.5);}
    return -caveFloorOf(C,X*P,low)/P-(lo+r()*(hi-lo));
  };
  const put=(n,tries,make)=>{for(let i=0,t=0;i<n&&t<tries;t++){const q=make(i);if(q){q.k="ink";q.seed=hashi(out.length,C.seed,0x1C4);out.push(q);i++;}}};
  if(kind==="sed"||kind==="sand"){
    /* пловец: позвоночник, рёбра, ласты, череп с длинными челюстями */
    put(kind==="sed"?6:3,160,()=>{
      const L=5+r()*3.5,dir=r()<.5?-1:1,X=3+r()*(xs-6-L),Y=spot(X+L/2,1.9,4.2);
      const box=[];for(let t=0;t<=1;t+=.125)box.push([X+L*t,Y],[X+L*t,Y-L*.16]);
      box.push([dir>0?X+L+L*.3:X-L*.3,Y]);
      return inRock(box,.7)?{ink:"swim",X,Y,L,dir}:null;
    });
    /* раковины */
    put(kind==="sed"?16:9,160,()=>{
      const X=2+r()*(xs-4),R=.4+r()*.45,Y=spot(X,1.1,4.5);
      return inRock([[X,Y],[X+R,Y],[X-R,Y],[X,Y+R],[X,Y-R]],.15)?{ink:"shell",X,Y,R,a:r()*TAU}:null;
    });
  }
  if(kind==="volc")put(24,160,()=>{
    const X=2+r()*(xs-4),Y=spot(X,1,4.5),R=.6+r()*1.1;
    return inRock([[X,Y],[X+R,Y],[X-R,Y]],R*.5)?{ink:"gas",X,Y,R}:null;
  });
  if(kind==="ice")put(18,160,()=>{
    const X=2+r()*(xs-4),Y=spot(X,1,4.5),L=1.2+r()*2.4;
    return inRock([[X,Y],[X,Y-L]],.1)?{ink:"bead",X,Y,L}:null;
  });
  if(kind==="rock")put(14,160,()=>{
    const X=2+r()*(xs-4),Y=spot(X,1.1,4.5),R=.3+r()*.4;
    return inRock([[X,Y],[X+R*1.5,Y],[X-R*1.5,Y]],R)?{ink:"node",X,Y,R}:null;
  });
  /* корни: шаг вдоль поверхности над верхней галереей */
  if(life)for(let X=3+r()*4;X<xs-3;X+=4+r()*8){
    const y0=F.surfY-.2-r()*1.1;
    if(cave3InkSolid(F,X,y0-.4))out.push({k:"ink",ink:"root",X,Y:y0,big:r(),seed:hashi(Math.round(X*8),C.seed,0x2007)});
  }
  return out;
}

/* одна запись в меш чернил полосы */
function cave3InkBuild(F,m,q,r){
  const K=CAVE3_INKS,z=K.z,solid=(x,y)=>cave3InkSolid(F,x,y);
  const ink=pp=>plnMix3(K.dim,K.bone,clamp(.6+.5*cave3N3(pp[0]*1.3,pp[1]*1.3,7,81),0,1));
  /* кость лежит плашмя в плоскости разреза: широкая ось сечения — в листе, поперёк хода */
  const tube=(path,rad,col,up)=>{
    const d=plnSub(path[path.length-1],path[0]),l=Math.hypot(d[0],d[1]);
    plnTube(m,{path,rad,sides:8,flat:K.fl,up:up||(l>1e-6?[-d[1]/l,d[0]/l,0]:[0,1,0]),col:col||((t,a,p)=>ink(p)),mat:PLN_MAT.glow,glow:1,cap:true});
  };
  if(q.ink==="swim"){
    const L=q.L,k=L/9.4,dir=q.dir,X=q.X,Y=q.Y;
    const sp=t=>[dir>0?X+L*t:X+L*(1-t),Y+.06*L*t*dir*.5+.42*k*Math.sin(t*3.4+.4)-.9*k*Math.pow(Math.max(0,.2-t)/.2,2),z];
    const body=t=>.25+.75*Math.pow(Math.sin(Math.PI*clamp((t-.05)/1.05,0,1)),.7);
    const spine=[];for(let i=0;i<=150;i++)spine.push(sp(i/150));
    tube(spine,t=>k*(.035+.075*body(t))*(.62+.38*Math.pow(Math.abs(Math.sin(t*Math.PI*47)),.6)));
    for(let t=.44;t<.83;t+=.021){
      if(r()<.12)continue;
      const p=sp(t),Lr=k*(.55+1.5*Math.pow(Math.sin(Math.PI*(t-.44)/.39),.6))*(r()<.15?.45+r()*.3:1);
      tube(plnBez([p[0],p[1]-.06*k,z],[p[0]-.55*Lr*dir,p[1]-.42*Lr,z],[p[0]-(.38*Lr+(r()-.5)*.1)*dir,p[1]-Lr,z],10),u=>k*.03*(1-u*.6));
    }
    for(const [t,s0] of [[.8,1],[.36,.62]]){
      const p=sp(t),s=s0*k;
      for(let f=0;f<5;f++){
        const a=lerp(-2.25,-1.25,f/4)+(r()-.5)*.08,Lf=s*(1.05+.5*Math.sin(Math.PI*(f+.5)/5)),o=[p[0]+(f-2)*.07*s*dir,p[1]-.25*s,z];
        tube(plnBez(o,[o[0]+(Math.cos(a)*Lf*.5-.1*s)*dir,o[1]+Math.sin(a)*Lf*.5,z],[o[0]+(Math.cos(a)*Lf-.3*s)*dir,o[1]+Math.sin(a)*Lf,z],24),
          u=>s*.05*(1-u*.5)*(.45+.55*Math.pow(Math.abs(Math.sin(u*Math.PI*7)),.5)));
      }
    }
    const h=sp(1),hx=v=>h[0]+v*k*dir;
    plnBlob(m,{c:[hx(.45),h[1]+.1*k,z],r:[.62*k,.4*k,.06],sub:2,col:(u,p)=>ink(p),mat:PLN_MAT.glow,glow:1});
    tube(plnBez([hx(.7),h[1]+.16*k,z],[hx(1.7),h[1]+.1*k,z],[hx(2.75),h[1]-.2*k,z],14),u=>k*lerp(.2,.03,Math.pow(u,.8)));
    tube(plnBez([hx(.45),h[1]-.26*k,z],[hx(1.5),h[1]-.42*k,z],[hx(2.6),h[1]-.42*k,z],14),u=>k*lerp(.11,.025,u));
    plnBlob(m,{c:[hx(.42),h[1]+.12*k,z-.08],r:[.2*k,.2*k,.02],sub:2,col:plnMul(K.bone,1.5),mat:PLN_MAT.glow,glow:1});
    plnBlob(m,{c:[hx(.42),h[1]+.12*k,z-.11],r:[.13*k,.13*k,.02],sub:2,col:CAVE3_CUT.lo,mat:PLN_MAT.glow,glow:1});
    return;
  }
  if(q.ink==="shell"){
    /* завиток с рёбрами */
    const r0=.07*q.R/.8,turns=2.6,n=110,path=[],grow=Math.log(q.R/r0)/(turns*TAU);
    for(let i=0;i<=n;i++){const th=i/n*turns*TAU,rr=r0*Math.exp(grow*th);path.push([q.X+rr*Math.cos(th+q.a),q.Y+rr*Math.sin(th+q.a),z]);}
    tube(path,t=>r0*Math.exp(grow*t*turns*TAU)*.2*(.6+.4*Math.pow(Math.abs(Math.sin(t*t*90)),.5)),null,[Math.cos(q.a),Math.sin(q.a),0]);
    return;
  }
  if(q.ink==="root"){
    const root=(p,ang,len,rad,depth)=>{
      const n=12,path=[p];let a=ang,c=p;
      for(let i=0;i<n;i++){
        a=lerp(a+(r()-.5)*.7,-Math.PI/2,.1);
        c=[c[0]+Math.cos(a)*len/n,c[1]+Math.sin(a)*len/n,z];
        if(!solid(c[0],c[1]))break;
        path.push(c);
      }
      if(path.length<3)return;
      tube(path,t=>rad*(1-.6*t),(t,a2,pp)=>plnMix3(K.barkD,K.bark,clamp(.5+.6*cave3N3(pp[0]*2,pp[1]*2,3,83),0,1)));
      if(depth>0)for(let b=0;b<2+(r()<.4?1:0);b++){
        const j=2+(r()*(path.length-3)|0);
        root(path[j],a+(r()-.5)*2,len*(.5+r()*.3),rad*(1-.6*j/(path.length-1))*.7,depth-1);
      }
    };
    root([q.X,q.Y,z],-Math.PI/2+(r()-.5)*.8,2.6+q.big*4,.06+q.big*.07,2);
    return;
  }
  if(q.ink==="gas"){
    /* пузыри застывшего газа: тёмная дырка в светлом ободке, гуще к середине грозди */
    const n=6+(r()*9|0);
    for(let i=0;i<n;i++){
      const a=r()*TAU,d=Math.sqrt(r())*q.R,x=q.X+Math.cos(a)*d,y=q.Y+Math.sin(a)*d*.55,s=.04+Math.pow(r(),2)*.14*(1-d/q.R*.5);
      if(!solid(x,y))continue;
      plnBlob(m,{c:[x,y,z],r:[s*1.15,s,.02],sub:1,col:K.gasRim,mat:PLN_MAT.glow,glow:1});
      plnBlob(m,{c:[x,y,z-.02],r:[s*.85,s*.72,.02],sub:1,col:K.gas,mat:PLN_MAT.glow,glow:1});
    }
    return;
  }
  if(q.ink==="bead"){
    /* цепочка пузырьков во льду: снизу мельче, вверх крупнее */
    for(let t=0;t<=1;t+=.06+r()*.05){
      const x=q.X+Math.sin(t*5+q.L)*.12,y=q.Y-q.L*(1-t),s=.015+.035*t*(.5+r()*.5);
      if(solid(x,y))plnBlob(m,{c:[x,y,z],r:[s,s,.02],sub:1,col:K.ice,mat:PLN_MAT.glow,glow:1});
    }
    return;
  }
  if(q.ink==="node"){
    /* желвак: тёмный овал в светлом кольце */
    plnBlob(m,{c:[q.X,q.Y,z],r:[q.R*1.5,q.R,.02],sub:2,col:(u,p)=>ink(p),mat:PLN_MAT.glow,glow:1});
    plnBlob(m,{c:[q.X,q.Y,z-.02],r:[q.R*1.2,q.R*.72,.02],sub:2,col:K.dim,mat:PLN_MAT.glow,glow:1});
  }
}
