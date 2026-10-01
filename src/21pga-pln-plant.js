/* ══════════════ планета: что где растёт и лежит (M611) ══════════════
   Расстановка набора тел (21pg) по земле (21pf). Лента засажена кусками — теми
   же, какими построена: кусок отдаёт свою сетку высот и цветов, и трава встаёт
   на неё, не спрашивая рельеф заново. Дальний берег и рощи на холмах засажены
   своими клетками вдоль x и едут по высоте вместе с дальним миром.

   Кости у каждого куска свои (rng от семени земли и номера куска): кусок,
   построенный сегодня и завтра, одинаков, а общий случай игры не тронут.

   Правила — со стенда (M600):
   · трава густа на полке у тропы, реже за линией и на ближнем склоне; на тропе,
     на камне и под водой её нет; метёлки и цветы лежат наносами;
   · камень — «большой со своими малыми», не россыпь; перед линией ходьбы
     только невысокий: человека он не закрывает выше голени;
   · деревья на ленте стоят только ЗА линией ходьбы;
   · вокруг корабля, трапа и вещей игры — поляна;
   · у площадки композиция принятого кадра стоит как была, дальше — по правилам.

   Куски записей одной группы лежат в одном буфере подряд, тело к телу: одна
   заливка на группу, отрисовка — по своему отрезку записей. */
const PLN_PLANT={zN:-44,zF:9.5,         /* где растёт трава: от объектива и до гребня */
  bands:[-20,-6],                       /* границы полос травы по глубине: у каждой свой веер */
  farW:64,                              /* ширина клетки дальнего берега, м */
  thingZ:1.7,                           /* на какой глубине стоят вещи игры: сразу за тропой */
  steep:.9};                            /* круче этого (тангенс) ступень тропы — камень: там встают уступы */
/* композиция у площадки, в метрах от точки композиции (L.cx0): x, z, … */
const PLN_PAD={x0:-34,x1:48,
  /* x, z, рост, порода и номер в ней, поворот, тон кроны, стройность. Справа над площадкой клонится
     зонт, слева ему отвечают три свечи: лежачее против стоячего */
  trees:[[17.2,8,11.5,"hero",0,0,0,1],[-29.4,5.6,13,"col",0,.4,3,1.18],[-27.2,7.0,9.8,"col",1,2.1,3,1.1],[-25.1,5.2,7.2,"col",2,4,0,1.05],
    [41.5,7.6,7.8,"orb",0,1.2,1,1],[44.8,6.2,5.6,"orb",2,3.3,1,1.06]],
  /* x, z, радиус, тон */
  rocks:[[14.2,5.2,1.6,.3],[15.6,4.0,.9,.5],[12.9,6.2,.7,.2],[-7.6,-2.7,.8,.4],[5.6,-3.3,.9,.6],[6.5,-3.9,.5,.3],
    [-9,-9,1.3,.7],[2,-11,1.0,.6],[11,-8.5,1.5,.8],[-17.5,-1.5,.6,.4],[24.4,-2.4,.8,.4],[25.6,-3.0,.4,.3],
    [-21.5,-3.2,.9,.5],[-22.8,-2.5,.45,.4],[-26.5,2.6,.6,.3],[43.5,-1.8,.7,.5],[44.4,-2.6,.35,.4]],
  /* склон лежит в тени и держится тихо: три валуна со своими малыми, у подножия каждого — розетка */
  slope:[[-4.5,-19,1.8],[24,-24,2.2],[-27,-14,1.5]],
  /* x, z, радиус, холодная ли, сколько колосьев */
  ros:[[-19.5,3.5,1.5,0,0],[-6.5,4.2,1.3,0,0],[.5,4.8,1.6,1,3],[7.5,4.0,1.2,0,0],[10.5,5,1.7,0,0],[-4,-7,1.1,1,0],[6,-6.5,.9,0,2],
    [14,-5,1.2,0,0],[-13,-6,1.0,0,0],[22,4.4,1.4,0,0],[26.2,-4.2,1.1,1,2],[35.5,-4.6,1.2,0,0],[44,3.0,1.3,0,0],[-24.5,3.6,1.3,0,0],
    [-29.5,-4.5,1.2,1,0],[20.5,-7.5,1.0,0,0],[40,-7,1.2,0,3],[-31,1.8,1.0,0,2]]};

function plnPlantSeed(L,c,k){return Math.floor(plnHash(c,k,L.sd)*4294967296)>>>0;}
/* ведро записей одного тела */
function plnPlantBucket(geo,to,kind){return {geo,to,kind:kind||PLN_KIND.body,a:new Float32Array(16*32),n:0};}
function plnPlantPut(B,p,scale,yaw,hk,ca,mode,cb,ride){
  if((B.n+1)*16>B.a.length){const b=new Float32Array(B.a.length*2);b.set(B.a);B.a=b;}
  plnRec(B.a,B.n++,p,scale,yaw,hk,B.n,ca,mode,cb,ride);
}
/* группа: то, что видно или не видно разом. z — самая дальняя её глубина, m — запас по ширине */
function plnPlantGroup(xa,xb,z,m,buckets,blots){
  const G0={xa,xb,z,m,inst:null,parts:[],blots:blots||[],n:0};
  let n=0;
  for(const B of buckets)n+=B.n;
  if(!n)return G0;
  const a=new Float32Array(n*16);
  let k=0;
  for(const B of buckets){
    if(!B.n)continue;
    a.set(B.a.subarray(0,B.n*16),k*16);
    G0.parts.push({geo:B.geo,first:k,count:B.n,kind:B.kind,to:B.to});
    k+=B.n;
  }
  G0.inst=plnInst(a,n);G0.n=n;
  return G0;
}
/* земля куска в любой его точке: высота, цвет, наклон и доля камня — из сетки, которой он построен */
function plnPlantGrid(L,J){
  const C=PLN_LAND,i0=J.c*C.chunk,nc=Math.min(i0+C.chunk,L.NT-1)-i0+1,v=J.grid.v,zr=L.zr,R=L.R,xa=L.x0+i0*L.dx,S=PLN_VS,o=new Float32Array(6);
  return function(x,z){
    const u=clamp((x-xa)/L.dx,0,nc-1.001),i=Math.floor(u),tx=u-i,zz=clamp(z,zr[0],zr[R-1]);
    let a=0,b=R-1;
    while(b-a>1){const q=(a+b)>>1;if(zr[q]<=zz)a=q;else b=q;}
    const tz=(zz-zr[a])/((zr[b]-zr[a])||1),p0=(a*nc+i)*S,p1=p0+S,p2=(b*nc+i)*S,p3=p2+S;
    const w0=(1-tx)*(1-tz),w1=tx*(1-tz),w2=(1-tx)*tz,w3=tx*tz;
    o[0]=v[p0+1]*w0+v[p1+1]*w1+v[p2+1]*w2+v[p3+1]*w3;
    o[1]=v[p0+6]*w0+v[p1+6]*w1+v[p2+6]*w2+v[p3+6]*w3;
    o[2]=v[p0+7]*w0+v[p1+7]*w1+v[p2+7]*w2+v[p3+7]*w3;
    o[3]=v[p0+8]*w0+v[p1+8]*w1+v[p2+8]*w2+v[p3+8]*w3;
    o[4]=v[p0+4]*w0+v[p1+4]*w1+v[p2+4]*w2+v[p3+4]*w3;
    o[5]=v[p0+11]*w0+v[p1+11]*w1+v[p2+11]*w2+v[p3+11]*w3;
    return o;
  };
}

/* ── что знает земля о жизни на ней ── */
function plnPlantInit(L,p){
  const ty=p.mix==="jungle"?"jungle":p.type,atm=(p.T&&p.T.atm)||"",wet=L.tr.wet==null?.5:L.tr.wet;
  const flora=atm.indexOf("пригодна")>=0||p.type==="toxic"||p.type==="jungle"||p.mix==="toxic"||p.mix==="jungle";
  const D={jungle:3.4,terran:1.9,toxic:1.5,ocean:1.6,ice:.7,ruin:1.1};
  const g0=G.opts&&G.opts.gfx?G.opts.gfx.plants:1,gp=clamp(g0==null?1:g0,.25,1.5)*(PLN_GPU.plK||1);   /* ярус (21pe) режет густоту */
  return L.flora={lush:flora?clamp((D[ty]||1.2)/1.9*(.25+wet*1.85),.25,1.3)*gp:0,
    things:plnPlantThings(L,p),groups:[],far:{},crags:[],first:false,ms:0,n:0,tufts:0};
}
/* Вещи игры, вокруг которых держится поляна: [x, z, полуоси поляны, насколько близко могут стоять
   высокие тела]. Места — из состояния посадки; вещь, что появится позже, встанет в траву */
function plnPlantThings(L,p){
  const S=G.surf,tr=L.tr,T=[],M=PLN_M;
  const add=(xu,z,rx,rz,tall)=>{if(xu!=null&&isFinite(xu))T.push([xu/M,z,rx,rz,tall]);};
  add(L.shipX*M,7,6.5,4,10);
  T.push([L.rampX,L.rampZ+1.2,1.2,2.2,0]);
  if(!S)return T;
  const TH=PLN_THINGS;
  for(const d of S.deposits||[])add(d.x,plnThingDepZ(d),1.7,1.4,3);
  for(const q of S.plants||[])add(q.x,plnHerbZ(q),.7,.7,1.5);
  if(S.cave)add(S.cave.x,TH.caveZ+3*TH.caveQ,6*TH.caveQ,5*TH.caveQ,8*TH.caveQ);
  add(mineSpotX(p),TH.mineZ,3.3*TH.mineQ,2.6*TH.mineQ,8);
  add(homeSpotX(p,tr),3,12,6,14);
  add(settleSpotX(p,tr),3,16,6,18);
  add(tinSpotX(p,tr),3,14,6,16);
  for(const q of (tr.poi||[]))add(q.x,3,Math.max(3,(q.h||60)*.22*(q.sc||1)/M+2),5,Math.max(5,(q.h||60)*.3/M));
  return T;
}
/* стоит ли здесь высокое тело: не у вещей игры */
function plnPlantFree(L,x){
  for(const t of L.flora.things)if(t[4]>0&&Math.abs(x-t[0])<t[4])return false;
  return true;
}

/* ── кусок ленты ──
   Сначала тела (деревья, камни, розетки, камыш, кулиса) — разом; потом трава, порциями по кадрам */
function plnPlantBodies(L,J){
  const K=plnFloraKit(),P=PLN_PAL,TO=PLN_TO,F=L.flora,lush=F.lush,xa=J.xa,xb=J.xb,wd=xb-xa,c=J.c,at=plnPlantGrid(L,J);
  const r=rng(plnPlantSeed(L,c,1)),clear=[],blots=[],lake=L.lake,H=PLN_FLORA.treeH;
  const bTree=K.tree.map(t=>plnPlantBucket(t.geo,TO.all)),bRock=K.rock.map(g=>plnPlantBucket(g,TO.all)),
    bRos=K.ros.map(g=>plnPlantBucket(g,TO.main|TO.sh0)),bBloom=K.bloom.map(g=>plnPlantBucket(g,TO.main)),
    bReed=K.reed.map(g=>plnPlantBucket(g,TO.main|TO.sh0)),bPad=K.pad.map(g=>plnPlantBucket(g,TO.main)),
    bLedge=K.ledge.map(t=>plnPlantBucket(t.geo,TO.all)),
    bWing=K.wing.map(t=>plnPlantBucket(t.geo,TO.main,PLN_KIND.wing));
  for(const t of F.things)if(t[0]>xa-20&&t[0]<xb+20)clear.push(t);
  const wetAt=(x,z,h)=>!!lake&&x>lake.x0-1.5&&x<lake.x1+1.5&&z>lake.zn-2&&z<lake.zf+2&&h<lake.level+.1;
  const padK=x=>x-L.cx0>PLN_PAD.x0&&x-L.cx0<PLN_PAD.x1;
  /* свободно ли место под тело радиуса rr; поворот и номер тела — от места, не от костей */
  const free=(x,z,rr)=>{for(const q of clear)if(Math.hypot((x-q[0])/(q[2]+rr),(z-q[1])/(q[3]+rr))<1)return false;return true;};
  const hv=(x,z,s)=>plnHash(Math.round(x*8),Math.round(z*8),c*7+s);
  const dice=n=>{const a=[];for(let k=0;k<n;k++)a.push(r());return a;};
  /* h — рост дерева, hk — его стройность: вширь оно во столько раз уже своей мерки */
  const tree=(x,z,h,v,yaw,ti,hk)=>{
    const g=at(x,z)[0],t=PLN_TINTS[ti],s=h/(H*hk),R=K.tree[v].R*s;
    if(wetAt(x,z,g-.3))return;
    plnPlantPut(bTree[v],[x,g,z],s,yaw,hk,t.under,2,t.top,0);
    blots.push([x,z,Math.max(R*.5,.8),.4]);clear.push([x,z,.9,.9,0]);
  };
  const rock=(x,z,rr,tone,shade)=>{
    const g=at(x,z)[0];
    if(wetAt(x,z,g))return;
    plnPlantPut(bRock[(rr>.85?3:0)+((hv(x,z,1)*3)|0)],[x,g,z],rr,hv(x,z,2)*TAU,1,plnMul(plnMix3(P.rockWarm,P.rockCool,tone),shade==null?1:shade),1,plnMul(P.moss,shade==null?1:shade),0);
    blots.push([x,z,rr*1.8,rr>.4?.5:.4]);
    if(rr>.4)clear.push([x,z,rr*1.3,rr*1.3,0]);
  };
  const [root,tipW,tipC]=PLN_FL.ros;
  const ros=(x,z,rr,cool,bloom,shade)=>{
    const g=at(x,z)[0],k=shade==null?1:shade,yaw=hv(x,z,3)*TAU;
    if(lush<=0||wetAt(x,z,g)||plnLandPath(L,x,z)>.3)return;
    plnPlantPut(bRos[(hv(x,z,4)*3)|0],[x,g,z],rr,yaw,1,plnMul(root,k),1,plnMul(cool?tipC:tipW,k),0);
    if(bloom)plnPlantPut(bBloom[bloom>2?1:0],[x,g,z],rr,yaw,1,[k,k,k],0,null,0);
    blots.push([x,z,rr*1.3,.45]);clear.push([x,z,rr*.9,rr*.9,0]);
  };
  /* валун склона со своими малыми и розеткой у подножия; d — двенадцать костей */
  const boulder=(cx,cz,rr,d)=>{
    rock(cx,cz,rr,.6+d[0]*.3,.85);
    rock(cx+rr*1.5+d[1]*.6,cz-.6-d[2],rr*(.4+d[3]*.15),.5+d[4]*.3,.85);
    rock(cx-rr*1.3-d[5]*.5,cz+.5+d[6],rr*(.3+d[7]*.12),.5+d[8]*.3,.85);
    ros(cx-rr*.4+d[9]*1.5,cz-rr*1.4-d[10],1.6+d[11]*.6,d[0]<.4?1:0,0,.9);
  };
  /* у площадки — принятая композиция */
  const px=x=>x+L.cx0,mine=x=>x>=xa&&x<xb;
  if(lush>.45)for(const t of PLN_PAD.trees)if(mine(px(t[0])))tree(px(t[0]),t[1],t[2],K.sp[t[3]][t[4]],t[5],t[6],t[7]);
  for(const q of PLN_PAD.rocks)if(mine(px(q[0])))rock(px(q[0]),q[1],q[2],q[3]);
  for(const q of PLN_PAD.slope)if(mine(px(q[0])))boulder(px(q[0]),q[1],q[2],[.2,.5,.5,.5,.5,.5,.5,.5,.5,.5,.5,.5]);
  for(const q of PLN_PAD.ros)if(mine(px(q[0])))ros(px(q[0]),q[1],q[2],q[3],q[4]);
  /* Крутая ступень тропы — камень: земля круче сорока градусов не держится. Скалы за линией встают
     выше неё, перед линией лежат ниже: человека на ступени они не закрывают. Ступень принадлежит
     куску, в котором началась; кости у неё свои */
  {
    const q=rng(plnPlantSeed(L,c,5)),C=PLN_LAND,T=L.P,dx=L.dx,ST=PLN_PLANT.steep,i0=Math.max(J.c*C.chunk,1),i1=Math.min(J.c*C.chunk+C.chunk,L.NT-2);
    const sl=i=>(T[i+1]-T[i-1])/(2*dx),own=[];
    /* самое низкое место земли под подошвой и линии над ней: тело сидит в склоне, а не висит над ним */
    const low=(x,z,ex,ez)=>Math.min(plnLandRibAt(L,x,z),plnLandRibAt(L,x-ex,z),plnLandRibAt(L,x+ex,z),plnLandRibAt(L,x,z-ez),plnLandRibAt(L,x,z+ez));
    const line=(x,e)=>Math.min(plnLandTab(L,T,x-e),plnLandTab(L,T,x),plnLandTab(L,T,x+e));
    /* место под скалу меряется её подошвой: вещи игры она не накрывает, а стоять рядом может */
    const room=(x,z,ex,ez)=>{for(const t of clear)if(Math.abs(x-t[0])<t[2]+ex&&Math.abs(z-t[1])<t[3]+ez)return false;return true;};
    const put=(v,x,z,y,s,yaw,tone)=>{
      const B=K.ledge[v];
      if(padK(x)||!room(x,z,B.rx*s*.8,B.rz*s)||wetAt(x,z,y)||(lake&&x>lake.x0-2&&x<lake.x1+2))return false;
      plnPlantPut(bLedge[v],[x,y,z],s,yaw,1,plnMix3(P.rockWarm,P.rockCool,tone),1,P.moss,0);
      blots.push([x,z,B.rx*s*1.3,.5]);own.push([x,z,B.rx*s*1.1,B.rz*s*1.1,0]);
      F.crags.push([x,z,y,s,v]);
      return true;
    };
    /* за линией: тело стоит подошвой в склоне и поднимается над землёй у себя посередине на lift;
       занято — встаёт глубже */
    const back=(v,x,zk,s0,lift,yaw,tone)=>{
      const B=K.ledge[v];
      for(let t=0;t<3;t++){
        let s=s0,z=0,g=0;
        for(let k=0;k<3;k++){
          z=B.rz*s+.5+zk+t*1.5;
          g=low(x,z,B.rx*s*.9,B.rz*s*.9);
          s=Math.max(s,(plnLandRibAt(L,x,z)+lift+.1-g)/(B.top+B.low));
        }
        if(s<=3.4&&put(v,x,z,g+B.low*s-.1,s,yaw,tone))return;
      }
    };
    /* перед линией: тело лежит на ближнем склоне и до линии не дотягивается нигде, где его видно
       на её фоне; sk — доля от роста, какой здесь поместится */
    const front=(v,x,z,sm,sk,yaw,tone)=>{
      const B=K.ledge[v];
      let s=Math.min(sm,(-z-.35)/B.rz),g=0;
      for(let k=0;k<4;k++){
        g=low(x,z,B.rx*s*.9,B.rz*s*.9);
        s=Math.min(s,(line(x,B.rx*s*.9-.25*z)-.05-g)/(B.top+B.low));
      }
      s*=sk;
      if(s>=.4)put(v,x,z,g+B.low*s-.1,s,yaw,tone);
    };
    let i=i0;
    /* ступень, что пришла из соседнего куска, — его */
    if(i>1&&Math.abs(sl(i-1))>=ST){const sg=sl(i-1)>0?1:-1;while(i<i1&&sl(i)*sg>=ST)i++;}
    while(i<i1){
      const s0=sl(i);
      if(Math.abs(s0)<ST){i++;continue;}
      const a=i,sg=s0>0?1:-1,d=[];
      while(i<L.NT-2&&sl(i)*sg>=ST)i++;
      for(let k=0;k<44;k++)d.push(q());
      const rise=Math.abs(T[i]-T[a-1]),xlo=L.x0+(sg>0?a-1:i)*dx,xhi=L.x0+(sg>0?i:a-1)*dx;
      if(rise<.9)continue;
      const nb=clamp(Math.round(rise/1.1)+1,2,5),nf=clamp(Math.round(rise/1.2)+1,2,4),nd=clamp(Math.round(rise/1.6),1,3),big=clamp(.45+rise*.2,.65,1.7);
      /* за линией — скалы в рост ступени; у верхнего её конца стоит старшая, высокая */
      for(let j=0;j<nb;j++){
        const o=j*4,top=j===nb-1;
        back(top?(d[o+2]*3)|0:(d[o+2]*6)|0,lerp(xlo,xhi,-.2+(j+d[o])/nb*1.5),d[o+1]*1.8,big*(.75+d[o+3]*.5)*(top?1.15:1),
          .35+d[o+3]*.9*(top?1.6:1),(d[o+2]-.5)*.7,.25+d[o+3]*.6);
      }
      /* перед линией — низкие: ряд под самой тропой и ряд ниже по склону, там камень крупнее */
      for(let j=0;j<nf;j++){
        const o=20+j*3;
        front(3+((d[o+1]*3)|0),lerp(xlo,xhi,(j+d[o])/nf),-(1.2+d[o+1]*1.7),2.2,.72+.28*d[o+2],(d[o]-.5)*.7,.3+d[o+2]*.5);
      }
      for(let j=0;j<nd;j++){
        const o=32+j*3;
        front(3+((d[o+2]*3)|0),lerp(xlo,xhi,-.3+(j+d[o])/nd*1.4),-(3.2+d[o+1]*2.6),.5+rise*.3,.6+.4*d[o+2],(d[o]-.5)*.7,.35+d[o+1]*.5);
      }
    }
    for(const e of own)clear.push(e);
  }
  /* дальше — по правилам. Кости бросаются всегда одним числом: чья-то поляна не сдвигает соседей */
  {
    /* деревья: до двух групп на кусок, каждая в своей половине. Порода — главная для этого места,
       изредка чужая; в группе первое дерево старшее. Тон кроны — породы или места; розовый — редкость */
    const d=dice(1),n=d[0]<.3?0:(d[0]<.78?1:2),main=[0,1,3][(plnHash(Math.floor(xa/96),5,L.sd)*3)|0];
    for(let k=0;k<2;k++){
      const q=dice(4),sp=plnTreeKind(L,xa+wd*.5,q[0],0),T=PLN_TREES[sp],list=K.sp[sp];
      const x0=xa+3+(k+q[1])*.5*(wd-6),z0=4.8+q[2]*3.2,cnt=T.grp[0]+((q[3]*(T.grp[1]-T.grp[0]+1))|0);
      for(let j=0;j<3;j++){
        const e=dice(7),x=clamp(x0+(j?(j===1?-1:1)*T.gap*(.75+e[0]*.5):0),xa+1,xb-1),z=clamp(z0+(j?(e[1]-.5)*2.4:0),4.6,8.5);
        /* розовый — цвет плоских крон; свеча в нём читается стопкой камней */
        const h=lerp(T.h[0],T.h[1],j?e[2]*.55:.45+e[2]*.55),ti=e[5]<.07&&sp!=="col"?2:(e[5]<.62?T.tint:main);
        if(k<n&&j<cnt&&lush>.45&&!padK(x)&&plnPlantFree(L,x)&&!(lake&&x>lake.x0-4&&x<lake.x1+4))
          tree(x,z,h,list[(e[3]*list.length)|0],e[4]*TAU,ti,lerp(T.hk[0],T.hk[1],e[6]));
      }
    }
  }
  {
    /* камень у тропы: большой со своими малыми; за линией крупнее, перед ней ниже */
    const u=r(),n=u<.25?0:(u<.75?1:2);
    for(let k=0;k<2;k++){
      const q=dice(14),back=q[0]<.6,x=xa+2.5+q[1]*(wd-5),z=back?3.4+q[2]*2.8:-(2.4+q[2]*1.5),rr=back?.7+q[3]*.9:.5+q[3]*.4,tone=q[4],sm=1+((q[5]*2)|0);
      if(k>=n||padK(x)||plnLandPath(L,x,z)>.2||!free(x,z,rr)||(!back&&!plnPlantFree(L,x)))continue;
      rock(x,z,rr,tone);
      for(let j=0;j<sm;j++){
        const o=6+j*4,sx=x+(q[o]<.5?-1:1)*(rr*1.15+.3+q[o+1]*.6),sz=z+(back?-1:1)*(.3+q[o+2]*.9);
        if(plnLandPath(L,sx,sz)<.2)rock(sx,sz,rr*(.35+q[o+3]*.2),clamp(tone+(q[o+1]-.5)*.3,0,1));
      }
    }
  }
  {
    const q=dice(16),cx=xa+5+q[12]*(wd-10),cz=-(12+q[13]*12);
    if(q[14]<.55&&!padK(cx))boulder(cx,cz,1.5+q[15]*.7,q);
  }
  /* мелкий камень вдоль тропы */
  for(let k=0;k<8;k++){
    const q=dice(4),x=xa+.4+q[0]*(wd-.8),z=-5+q[1]*6.5,rr=.15+q[2]*.22;
    if(plnLandPath(L,x,z)<=.3&&free(x,z,0))rock(x,z,rr,q[3]);
  }
  /* розетки: за линией у гребня полки и перед линией, где склон уходит вниз */
  for(let k=0;k<4;k++){
    const q=dice(7),x=xa+1.5+q[0]*(wd-3),front=q[1]<.4,z=front?-(4.2+q[2]*3.3):3.4+q[2]*1.6,rr=.9+q[3]*.8;
    if(q[6]<.35+.45*lush&&!padK(x)&&free(x,z,rr))ros(x,z,rr,q[4]<.25?1:0,q[5]<.25?2+((q[5]*8)|0):0);
  }
  /* берег пруда. Камыш — куртинами по дальнему урезу; на ближнем он встал бы между объективом и водой,
     и там он растёт только у концов пруда. Камни лежат на урезе и в воде у берега, листья-блюдца —
     на глубине, стайками: это та же шапка с плоским исподом, только легла на воду */
  if(lake&&xb>lake.x0-2&&xa<lake.x1+2){
    const q=rng(plnPlantSeed(L,c,4)),[rootR,tipR,dryR]=PLN_FL.reed;
    const la=Math.max(xa,lake.x0-2),span=Math.min(xb,lake.x1+2)-la,lx=lake.x1-lake.x0,mid=(lake.x0+lake.x1)/2;
    const dice=n=>{const a=[];for(let k=0;k<n;k++)a.push(q());return a;};
    for(let k=Math.ceil(span/4.5);k>0&&lush>0;k--){
      const d=dice(5),cx=la+d[0]*span,far=d[1]<.7||Math.abs(cx-mid)<.33*lx,n=8+((d[2]*14)|0),hh=1.1+d[3]*.9,wid=1.2+d[4]*2.4;
      for(let j=0;j<n;j++){
        const e=dice(8),u=(e[0]+e[1]+e[2])/3*2-1,x=clamp(cx+u*wid*1.3,xa,xb-.01);
        const z=far?plnLandPondZ(L,x,true)-.9+(e[3]-.5)*1.8:plnLandPondZ(L,x,false)+.5+(e[3]-.5)*1.2,g=at(x,z)[0];
        if(g<lake.level-.4||g>lake.level+.3||x<lake.x0-3||x>lake.x1+3)continue;
        plnPlantPut(bReed[(e[4]*3)|0],[x,Math.max(g,lake.level-.25),z],hh*(1-.5*u*u)*(.7+e[5]*.5)*.8,(e[6]-.5)*.8,1.25,rootR,1,e[7]<.25?dryR:tipR,0);
      }
    }
    for(let k=Math.ceil(span/3);k>0;k--){
      const d=dice(6),x=la+d[0]*span,far=d[1]<.55,rr=.22+d[2]*d[2]*.55,z=plnLandPondZ(L,x,far)+(far?-1:1)*(d[3]*1.6-.2),g=at(x,z)[0];
      if(x<lake.x0+.5||x>lake.x1-.5||Math.abs(z)<2.2||g>lake.level+.35)continue;
      plnPlantPut(bRock[(rr>.55?3:0)+((d[4]*3)|0)],[x,Math.max(g,lake.level-rr*.45),z],rr,d[5]*TAU,1,
        plnMul(plnMix3(P.rockWarm,P.rockCool,.3+d[4]*.5),.8),1,plnMul(P.moss,.8),0);
    }
    for(let k=Math.ceil(span/5.5);k>0&&lush>0;k--){
      const d=dice(4),cx=la+d[0]*span,cz=lerp(plnLandPondZ(L,cx,false),plnLandPondZ(L,cx,true),.12+d[1]*.76),n=4+((d[2]*7)|0),T=PLN_PADS[d[3]<.2?1:0];
      for(let j=0;j<n;j++){
        const e=dice(5),a=e[0]*TAU,dd=.3+2.1*Math.sqrt(e[1]),x=cx+Math.cos(a)*dd*1.5,z=cz+Math.sin(a)*dd;
        if(x<xa||x>=xb||Math.abs(z)<1.6||plnLandPond(L,x,z)>-1.3)continue;
        plnPlantPut(bPad[(e[2]*3)|0],[x,lake.level+.02,z],.32+e[3]*.3,e[4]*TAU,1,T[0],1,T[1],0);
      }
    }
  }
  /* кулиса: тёмная листва у самого объектива, на ближнем краю ленты (тела — 21pgc). Нижний край кадра
     на этой глубине идёт почти по линии ходьбы: тело стоит нулём у линии, в кадр входит его верх —
     на десятую — пятую долю высоты кадра, стебли остаются под краем — и человека оно не закроет.
     Лист стоит лицом к объективу, и запись тело почти не крутит.
     У большого тела бывает малое рядом: другой семьи, пониже и чуть дальше */
  if(lush>.45){
    const Wg=PLN_WING,q=rng(plnPlantSeed(L,c,3)),NW=K.wing.length;
    const put=(v,x,z,lift,s,yaw,tn)=>plnPlantPut(bWing[v],[x,at(x,0)[0]+Math.min(lift,Wg.cap-K.wing[v].top*s),z],s,yaw,1,
      plnMul(PLN_FL.wing[tn][0],Wg.dim),1,plnMul(PLN_FL.wing[tn][1],Wg.dim),0);
    for(let k=0;k<2;k++){
      const d=[];
      for(let j=0;j<12;j++)d.push(q());
      const x=xa+2+(k+d[0])*.5*(wd-4),z=Wg.z[0]+d[1]*Wg.z[1],lift=Wg.lift[0]+d[2]*Wg.lift[1],v=(d[3]*NW)|0,s=Wg.size[0]+d[4]*Wg.size[1];
      const tn=d[5]<.12?3:(d[5]<.3?2:(d[5]<.58?1:0)),yaw=(d[7]-.5)*Wg.turn;
      if(d[6]>=.66)continue;
      put(v,x,z,lift,s,yaw,tn);
      if(d[8]<.6){
        const v2=(((v>>1)+1+((d[9]*3)|0))%4)*2+(d[10]<.5?0:1),x2=clamp(x+(d[11]<.5?-1:1)*(3.5+d[9]*4),xa+.5,xb-.5);
        put(v2,x2,z+1.2,lift-.6-d[10]*1.2,s*.72,-yaw,d[5]>.7?1:tn);
      }
    }
  }
  const bodies=bTree.concat(bRock,bLedge,bRos,bBloom,bReed,bPad);
  F.groups.push(plnPlantGroup(xa-7,xb+7,9,2,bodies,blots));
  F.groups.push(plnPlantGroup(xa-7,xb+7,-47,2,bWing));
  return clear;
}
/* трава куска: порция проб. Возвращает true, когда кусок засажен весь */
function plnPlantGrass(L,J,n){
  const Q=PLN_FLORA,C=PLN_PLANT,P=PLN_PAL,F=L.flora,S=J.pl,at=S.at,r=S.r,clear=S.clear,xa=J.xa,wd=J.xb-J.xa,sd=L.sd,W=Q.wide,lake=L.lake;
  const zN=C.zN,zd=C.zF-C.zN,k1=Math.min(S.K,S.k+n),ca=[0,0,0],cb=[0,0,0],cf=[0,0,0],pos=[0,0,0];
  const [hay,warmA,warmB,coldA,coldB]=PLN_FL.bloom,warm=[warmA,warmB],cold=[coldA,coldB];
  for(let k=S.k;k<k1;k++){
    const x=xa+r()*wd,z=zN+r()*zd,u1=r(),u2=r(),u3=r(),u4=r(),u5=r(),u6=r(),u7=r(),u8=r(),u9=r(),u10=r();
    const pw=plnLandPath(L,x,z);
    if(pw>.3)continue;
    let d=z>2.5?.55:(z>-5?1:lerp(1,.4,plnSmooth(5,18,-z)));
    d*=.45+.55*plnSmooth(.3,.6,plnFbm(x*.12,z*.12,2,sd+61)*.5+.5);
    for(const q of clear){const e=Math.hypot((x-q[0])/q[2],(z-q[1])/q[3]);if(e<1)d*=plnSmooth(.7,1,e);}
    if(u1>d)continue;
    const g=at(x,z),h0=g[0];
    /* на крутом камне и под водой пруда травы нет; на голом берегу у воды она редеет и мельчает */
    let sh=1;
    if(lake&&x>lake.x0-3&&x<lake.x1+3&&z>lake.zn-3&&z<lake.zf+3){
      if(h0<lake.level+.06)continue;
      sh=1-.9*plnLandBare(L,x,z);
      if(u5>.15+.85*sh)continue;
    }
    if(g[5]>.4)continue;
    const head=z>-6&&u2<.14&&plnFbm(x*.16+2,z*.16+9,2,sd+62)>.26;
    let hgt=(z<-6?lerp(.42,.95,plnSmooth(6,20,-z)):lerp(.2,.42,plnSmooth(.1,.3,1-pw*3))*(.8+u3*.5))*(.8+u4*.4)*lerp(.55,1,sh);
    ca[0]=g[1]*.74;ca[1]=g[2]*.74;ca[2]=g[3]*.74;
    if(head){
      hgt*=1.6;
      cb[0]=lerp(P.dry[0],hay[0],u5*.6)*1.2;cb[1]=lerp(P.dry[1],hay[1],u5*.6)*1.2;cb[2]=lerp(P.dry[2],hay[2],u5*.6)*1.2;
    }else{
      cb[0]=lerp(g[1],P.grassLit[0],.3)*1.2;cb[1]=lerp(g[2],P.grassLit[1],.3)*1.2;cb[2]=lerp(g[3],P.grassLit[2],.3)*1.2;
    }
    const sH=lerp(hgt,Q.foot,.5),band=z<C.bands[0]?0:(z<C.bands[1]?1:2);
    pos[0]=x;pos[1]=h0;pos[2]=z;
    plnPlantPut(S.tuft[band][(u6*6)|0],pos,sH,(u7-.5)*.7,hgt/sH,ca,1,cb,0);
    S.n++;
    if(z>-15&&z<2.2){
      const f1=plnFbm(x*.2+3,z*.2+1,2,sd+63),f2=plnFbm(x*.17+8,z*.17+5,2,sd+65);
      const set=f1>.3?warm:(f2>.34?cold:null),deep=set===warm?f1-.3:f2-.34;
      if(set&&u8<(.12+1.6*deep)*(z>-7?1:.5)){
        const pk=plnFbm(x*.05+1,z*.05+7,2,sd+66)>0?0:1,fc=set[u9<.88?pk:1-pk];
        cf[0]=fc[0];cf[1]=fc[1];cf[2]=fc[2];
        pos[0]=x+(u10-.5)*.4;pos[1]=h0+hgt*.7+u5*.12;pos[2]=z+(u4-.5)*.4;
        plnPlantPut(S.flower[band],pos,.058*W,0,1,cf,0,null,0);
      }
    }
  }
  S.k=k1;
  if(k1<S.K)return false;
  const zs=[C.bands[0],C.bands[1],C.zF];
  for(let b=0;b<3;b++)F.groups.push(plnPlantGroup(xa-.8,J.xb+.8,zs[b],1.5,S.tuft[b].concat([S.flower[b]])));
  F.tufts+=S.n;
  J.pl=null;J.grid=null;J.planted=true;
  return true;
}
function plnPlantChunk(L,J,n){
  if(!J.pl){
    const K=plnFloraKit(),F=L.flora,C=PLN_PLANT,TO=PLN_TO,clear=plnPlantBodies(L,J),at=plnPlantGrid(L,J);
    const tuft=[0,1,2].map(()=>K.tuft.map(g=>plnPlantBucket(g,TO.main))),flower=[0,1,2].map(()=>plnPlantBucket(K.flower,TO.main));
    J.pl={at,clear,tuft,flower,r:rng(plnPlantSeed(L,J.c,2)),k:0,n:0,
      K:F.lush>0?Math.round(PLN_FLORA.dens*Math.min(1,F.lush)*(J.xb-J.xa)*(C.zF-C.zN)):0};
  }
  return plnPlantGrass(L,J,n);
}

/* ── дальний берег и рощи: клетка вдоль x ── */
/* где за водой начинается берег: первая глубина, на которой дно выходит из воды */
function plnPlantShore(L,x){
  const wy=PLN_LAND.wRel-.1;
  let z=70;
  for(;z<150;z+=4)if(plnLandFarH(L,x,z)>wy)break;
  if(z>=150)return 0;
  if(z<=70)return 70;
  let a=z-4,b=z;
  for(let k=0;k<4;k++){const m=(a+b)/2;if(plnLandFarH(L,x,m)>wy)b=m;else a=m;}
  return b;
}
/* гребень плана на этом x: самая высокая точка между двумя глубинами */
function plnPlantCrest(L,x,z0,z1,step){
  let bz=z0,by=-1e9;
  for(let z=z0;z<=z1;z+=step){const h=plnLandFarH(L,x,z);if(h>by){by=h;bz=z;}}
  return [x,by,bz];
}
function plnPlantFar(L,fc){
  const K=plnFloraKit(),C=PLN_PLANT,P=PLN_PAL,TO=PLN_TO,F=L.flora,lush=F.lush,xa=fc*C.farW,xb=xa+C.farW,wy=PLN_LAND.wRel,H=PLN_FLORA.treeH;
  const r=rng(plnPlantSeed(L,fc,11)),lit=TO.main|TO.mirror,cast=lit|TO.sh1;
  const bTree=K.far.map(t=>plnPlantBucket(t.geo,cast)),bTree2=K.far.map(t=>plnPlantBucket(t.geo,cast)),bRock=K.rock.map(g=>plnPlantBucket(g,cast)),
    bBush=K.bush.map(g=>plnPlantBucket(g,cast)),bReed=K.reed.map(g=>plnPlantBucket(g,lit));
  /* урез воды по клетке: через два метра, между ними — по прямой */
  const NS=Math.round(C.farW/2)+1,sh=new Float32Array(NS);
  for(let i=0;i<NS;i++)sh[i]=plnPlantShore(L,xa+i*2);
  const shore=x=>{const u=clamp((x-xa)/2,0,NS-1.001),i=Math.floor(u);return sh[i]&&sh[i+1]?lerp(sh[i],sh[i+1],u-i):0;};
  const rock=(x,z,y,rr,tone,big)=>plnPlantPut(bRock[(big?3:0)+((plnHash(x|0,z|0,fc)*3)|0)],[x,y,z],rr,plnHash(z|0,x|0,fc+1)*TAU,1,
    plnMix3(P.rockWarm,P.rockCool,tone),1,P.moss,1);
  /* скалы дальнего берега, камни на отмели перед ними */
  {
    const u=r(),cx=xa+r()*C.farW,dz=14+r()*5,n=2+((r()*3)|0),list=[];
    for(let k=0;k<4;k++)list.push([k?(r()-.5)*9:0,k?(r()-.5)*3:0,k?.7+r()*.8:2+r()*.7,.1+r()*.3]);
    const st=[0,1,2].map(()=>[-(5+r()*7),-(3.5+r()*4.5),.45+r()*.7]);
    if(u<.5){
      list.slice(0,n).forEach(q=>{
        const x=cx+q[0],z0=shore(x);
        if(!z0)return;
        const z=z0+dz+q[1],y=plnLandFarH(L,x,z);
        if(y>wy+.2)rock(x,z,y+q[2]*.05,q[2],q[3],q[2]>.85);
      });
      for(const q of st){const x=cx+q[0],z0=shore(x);if(z0>70)rock(x,z0+q[1],wy-q[2]*.25,q[2],.25,false);}
    }
  }
  if(lush>0){
    /* кусты по берегу: куртинами */
    for(let k=0;k<2;k++){
      const cx=xa+r()*C.farW,dz=17+r()*7,n=3+((r()*3)|0),on=r()<.6;
      for(let j=0;j<5;j++){
        const x=cx+(r()-.5)*13,dd=(r()-.5)*8,rr=1+r()*1.3,ti=r()<.3?1:0,v=(r()*3)|0,yaw=r()*TAU,z0=shore(x);
        if(!on||j>=n||!z0)continue;
        const z=z0+dz+dd,y=plnLandFarH(L,x,z),t=PLN_TINTS_FAR[ti];
        if(y>wy+.3)plnPlantPut(bBush[v],[x,y,z],rr,yaw,1,t.under,1,t.top,1);
      }
    }
    /* камыш у дальнего уреза */
    const [rootR,tipR,dryR]=PLN_FL.reed;
    for(let k=0;k<2;k++){
      const cx=xa+r()*C.farW,wid=2.5+r()*5.5,hgt=1.2+r()*1.5,n=12+((r()*52)|0),on=r()<.7,q=rng(plnPlantSeed(L,fc,12+k));
      if(!on)continue;
      for(let j=0;j<n;j++){
        const u=(q()+q()+q())/3*2-1,x=cx+u*wid*1.3,dz=(q()-.45)*3.2,hh=hgt*(1-.5*u*u)*(.7+q()*.5),dry=q()<.25,v=(q()*3)|0,yaw=(q()-.5)*.8,z0=shore(x);
        if(z0<=70)continue;
        const z=z0+dz;
        plnPlantPut(bReed[v],[x,Math.max(plnLandFarH(L,x,z),wy-.25),z],hh*.8,yaw,1.25,rootR,1,dry?dryR:tipR,1);
      }
    }
  }
  if(lush>.45){
    /* рощи: на гребне дальнего берега, на равнине за ним, на склоне холмов и по их гребню */
    /* роща — одной породы, изредка с чужим деревом; свечи стоят теснее. band — план рощи */
    const grove=(B,cx,cz,n,spread,h0,h1,main,acc,band)=>{
      const gs=plnTreeKind(L,cx,0,band);
      for(let k=0;k<10;k++){
        const e=[r(),r(),r(),r(),r(),r(),r(),r()],sp=e[0]<.78?gs:plnTreeKind(L,cx,.68+(e[0]-.78)/.22*.32,band);
        const T=PLN_TREES[sp],list=K.spFar[sp],a=e[1]*TAU,d=k?spread*Math.sqrt(e[2])*(sp==="col"?.55:1):0,x=cx+Math.cos(a)*d*1.5,z=cz+Math.sin(a)*d;
        const t0=e[4]<.22?acc:(e[4]<.6?T.tint:main),ti=t0===2&&sp==="col"?T.tint:t0;
        const h=lerp(h0,h1,k?.1+e[3]*.6:1)*T.far,hk=lerp(T.hk[0],T.hk[1],e[5]);
        if(k>=n)continue;
        const az=Math.atan2(x-L.cx0,z+50),pass=Math.exp(-Math.pow((az-PLN_AZ_ELEV)/.075,2));
        if(pass>.25)continue;
        const y=plnLandFarH(L,x,z),t=PLN_TINTS[ti];
        if(y<wy+.5)continue;
        plnPlantPut(B[list[(e[6]*list.length)|0]],[x,y-.2,z],h/(H*hk),e[7]*TAU,hk,t.under,2,t.top,1);
      }
    };
    const dice=()=>[r(),r(),r(),r(),r()];
    let q=dice();
    if(q[0]<.45*lush){const c=plnPlantCrest(L,xa+q[1]*C.farW,118,170,4);grove(bTree,c[0],c[2]+4+q[2]*10,4+((q[3]*4)|0),10,8,14,0,1,1);}
    q=dice();
    if(q[0]<.4*lush)grove(bTree2,xa+q[1]*C.farW,200+q[2]*60,5+((q[3]*4)|0),14,9,15,q[4]<.5?3:0,0,2);
    q=dice();
    if(q[0]<.4*lush)grove(bTree2,xa+q[1]*C.farW,290+q[2]*40,5+((q[3]*4)|0),13,8,13,q[4]<.2?2:(q[4]<.6?0:3),2,3);
    q=dice();
    if(q[0]<.85*lush){const c=plnPlantCrest(L,xa+q[1]*C.farW,270,430,10);grove(bTree2,c[0],c[2]-8+q[2]*30,6+((q[3]*5)|0),17,9,15,q[4]<.5?0:3,1,4);}
  }
  F.groups.push(plnPlantGroup(xa-16,xb+16,190,6,bTree.concat(bRock,bBush,bReed)));
  F.groups.push(plnPlantGroup(xa-30,xb+30,470,8,bTree2));
  F.far[fc]=true;
}

/* ── очередь и кадр ── */
function plnPlantSees(G0,ex,V,m){
  const h=V.hw*(1+G0.z/V.D)+G0.m+m;
  return G0.xb>ex-h&&G0.xa<ex+h;
}
/* Сажает, что пора, по бюджету (M614): куски ленты, уже построенные, — видимые и ближние первыми,
   траву порциями (PLN_BUILD.slice проб за кадр, по piece между сверками с часами, не дольше lim мс;
   без lim — числа PLN_BUILD, первому вызову — свои); клетки дальнего берега — по одной. Первый вызов берёт только
   видимое, дальше — всё по кадрам; PLN.rush — разом */
function plnPlantStep(L,p,ex,V,lim){
  const F=L.flora||plnPlantInit(L,p),C=PLN_PLANT,B=PLN_BUILD,t0=wallMs(),all=!!PLN.rush,first=!F.first;
  const ms=lim==null?(first?B.first:B.ms):lim;
  F.first=true;
  let budget=first?B.sliceFirst:B.slice,did=0;
  for(;;){
    let best=null,bp=1e9;
    for(const J of L.jobs){
      if(J.t!=="rib"||!J.done||J.planted||!J.grid)continue;
      const see=plnLandSees(J,ex,V,24),pr=(see?0:1e4)+Math.abs((J.xa+J.xb)/2-ex)-(J.pl?50:0);
      if(pr<bp&&(all||see||!first)){bp=pr;best=J;}
    }
    if(!best)break;
    if(!all&&(budget<=0||wallMs()-t0>=ms||(did&&!best.pl)))break;
    const k0=best.pl?best.pl.k:0;
    plnPlantChunk(L,best,all?1e9:Math.min(budget,B.piece));
    budget-=best.pl?best.pl.k-k0:budget;did++;
  }
  /* дальний берег: клетки, которые видит объектив на глубине холмов */
  const hv=V.hw*(1+470/V.D)+40,f0=Math.floor((ex-hv)/C.farW),f1=Math.floor((ex+hv)/C.farW),lo=Math.floor((L.x0-260)/C.farW),hi=Math.floor((L.x0+L.NT*L.dx+260)/C.farW);
  for(let k=0,fc=Math.round(ex/C.farW);k<=f1-f0+1;k++){
    fc+=(k&1?k:-k);
    if(fc<f0||fc>f1||fc<lo||fc>hi||F.far[fc])continue;
    plnPlantFar(L,fc);
    if(!all&&(!first||wallMs()-t0>=ms))break;
  }
  F.ms+=wallMs()-t0;
  PLN.stat.flora={groups:F.groups.length,tufts:F.tufts,ms:Math.round(F.ms)};
}
/* что из посаженного в кадре; пятна тени — самые большие из тех, что видит объектив */
function plnPlantBatches(L,F0,ex,V){
  const F=L.flora;
  if(!F)return;
  const seen=[];
  let recs=0;
  for(const G0 of F.groups){
    if(!G0.inst||!plnPlantSees(G0,ex,V,0))continue;
    for(const q of G0.parts)F0.batches.push({geo:q.geo,inst:G0.inst,first:q.first,count:q.count,kind:q.kind,to:q.to});
    recs+=G0.n;
    for(const b of G0.blots)if(Math.abs(b[0]-ex)<V.hw*(1+b[1]/V.D)+b[2])seen.push(b);
  }
  const b=F0.blobs;
  let n=b[0]|0;
  if(seen.length>64-n)seen.sort((x,y)=>y[2]*y[3]-x[2]*x[3]);
  for(let k=0;k<seen.length&&n<64;k++,n++)b.set(seen[k],4+n*4);
  b[0]=n;
  PLN.stat.recs=recs;
}
function plnPlantDrop(L){
  const F=L.flora;
  if(!F)return;
  for(const G0 of F.groups)if(G0.inst)plnInstFree(G0.inst);
  L.flora=null;
}
