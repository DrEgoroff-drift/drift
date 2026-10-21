/* ══════════════ рудник на движке: убранство выработки (M631) ══════════════
   То, по чему шахту узнают: рельсы и шпалы по горизонтам, крепь рамами (задняя стойка, ближняя
   стойка, верхняк поперёк штрека), лампы через четыре клетки, лестницы в выработке по руде,
   проводники и расстрелы ствола, порог площадки на горизонте; клеть с человеком и канат до шкива.
   Всё — тела людской грамматики: серая сталь, ржавчина, тёмный брус, одно оранжевое пятно на клети.
   Статичное собирается одной сеткой и пересобирается, когда выработка изменилась (D.maskV);
   клеть — одна запись экземпляра, канат — два кольца в своём буфере, их пишут каждый кадр. */
const DIG3_DR={wood:[.105,.066,.036],woodD:[.062,.04,.022],steel:[.075,.078,.085],rail:[.15,.15,.16],
  rust:[.13,.065,.03],band:[.62,.2,.03],paint:[.78,.74,.62],steelD:[.038,.04,.044],bolt:[.2,.19,.17],wheel:[.03,.03,.03],lamp:[1,.72,.4],set:1.6,rails:[.82,1.42],lampStep:4};

/* выкопан ли пол под клеткой: штрек стоит на полу, над пустотой — лестница */
function dig3Floor(F,c,r){return !dig3Dug(F,c,r+1);}
/* доска с цифрами краской: семь брусков на знак (a верх, b c правые, d низ, e f левые, g середина);
   середина доски — (x, y), лицо — к разрезу на глубине z */
/* семёрка с крючком (f), как на счётах: с одной верхней чертой она на телефоне читалась единицей («−27» как «−21») */
const DIG3_SEG={"0":"abcdef","1":"bc","2":"abdeg","3":"abcdg","4":"bcfg","5":"acdfg","6":"acdefg","7":"abcf","8":"abcdefg","9":"abcdfg","-":"g"};
function dig3DepthBoard(box,x,y,z,txt,K){
  const h=.34,w=.2,t=.06,gap=.08,W=txt.length*w+(txt.length-1)*gap;
  box(x-W/2-.14,x+W/2+.14,y-h/2-.12,y+h/2+.12,z-.04,z+.02,K.woodD);
  box(x-W/2-.16,x+W/2+.16,y-h/2-.14,y-h/2-.1,z-.06,z+.02,K.steel);
  const zf=z-.06,zb=z-.04;
  for(let i=0;i<txt.length;i++){
    const s=DIG3_SEG[txt[i]]||"",x0=x-W/2+i*(w+gap),x1=x0+w,y0=y-h/2,y1=y+h/2,ym=y;
    for(const g of s){
      if(g==="a")box(x0,x1,y1-t,y1,zf,zb,K.paint);
      if(g==="d")box(x0,x1,y0,y0+t,zf,zb,K.paint);
      if(g==="g")box(x0,x1,ym-t/2,ym+t/2,zf,zb,K.paint);
      if(g==="b")box(x1-t,x1,ym,y1,zf,zb,K.paint);
      if(g==="c")box(x1-t,x1,y0,ym,zf,zb,K.paint);
      if(g==="f")box(x0,x0+t,ym,y1,zf,zb,K.paint);
      if(g==="e")box(x0,x0+t,y0,ym,zf,zb,K.paint);
    }
  }
}
function dig3DressMesh(F){
  const m=plnMesh(1<<14),K=DIG3_DR,CM=DIG3_CM,M=PLN_MAT,R=DIG3_ROOM,zd=R.zd,lamps=[];
  const box=(x0,x1,y0,y1,z0,z1,col)=>{
    /* брус: шесть граней, нормали наружу */
    const P=[[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]];
    const F6=[[0,3,2,1,[0,0,-1]],[4,5,6,7,[0,0,1]],[0,4,7,3,[-1,0,0]],[1,2,6,5,[1,0,0]],[3,7,6,2,[0,1,0]],[0,1,5,4,[0,-1,0]]];
    for(const f of F6){const n=f[4],a=plnVert(m,P[f[0]],n,col,M.bark),b=plnVert(m,P[f[1]],n,col,M.bark),c=plnVert(m,P[f[2]],n,col,M.bark),d=plnVert(m,P[f[3]],n,col,M.bark);plnQuad(m,a,b,c,d);}
  };
  const NC=F.NC,H=MINE_HALF;
  for(let r=0;r<F.NR;r++)for(let c=-H;c<=H;c++){
    if(!dig3Dug(F,c,r))continue;
    const x0=c*CM,x1=x0+CM,fy=-(r+1)*CM,h=dig3Hash(c,r);
    if(c===0){
      /* ствол: проводники у задней стены, расстрел через клетку; на горизонте — порог и стойки ворот */
      const xc=CM*.5;
      /* обшивка: доски по стенам ствола от разреза до задней стены — где сбоку нет штрека */
      for(const s of [-1,1])if(!dig3Dug(F,s,r))box(s<0?-.06:CM-.04,s<0?.04:CM+.06,fy,fy+CM,0,zd-.05,K.woodD);
      for(const s of [-1,1])box(xc+s*.78-.07,xc+s*.78+.07,fy,fy+CM,zd-.42,zd-.26,K.woodD);
      box(xc-1.02,xc+1.02,fy+CM*.5-.07,fy+CM*.5+.07,zd-.5,zd-.36,K.steel);
      if(r>0&&mineIsLevel(r)){
        /* доска горизонта у ворот, на задней стене штрека: «−72» — метры от устья, как в настоящем руднике
           (глубину на горизонте говорит мир, а не только надпись подсказки) */
        const sd=dig3Dug(F,1,r)?1:dig3Dug(F,-1,r)?-1:0;
        if(sd)dig3DepthBoard(box,sd>0?CM+.62:-.62,fy+1.62,zd-.12,"-"+r*3,K);
        box(xc-1.15,xc+1.15,fy-.12,fy+.02,.15,zd-.2,K.steel);
        for(const s of [-1,1]){box(xc+s*1.1-.06,xc+s*1.1+.06,fy,fy+2.05,.2,.32,K.steel);box(xc+s*1.1-.06,xc+s*1.1+.06,fy+1.0,fy+1.08,.2,.9,K.band);}
      }
      continue;
    }
    const lv=mineIsLevel(r)&&dig3Floor(F,c,r);
    /* рельсы и шпалы: горизонт — откаточный, по нему возят */
    if(lv){
      for(let k=0;k<3;k++){const sx=x0+(k+.5)*CM/3;box(sx-.09,sx+.09,fy,fy+.07,.6,1.68,K.woodD);}
      for(const z of K.rails)box(x0-.01,x1+.01,fy+.07,fy+.15,z-.025,z+.025,K.rail);
    }
    /* крепь: рама на клетку — стойка у задней стены и верхняк поперёк штрека; ближней стойки нет:
       разрез её срезал, а в кадре она легла бы на человека */
    if(lv){
      const sx=x0+CM*.5+(h-.5)*.25,top=fy+CM-.34,lean=(dig3Hash(c+1,r)-.5)*.06;
      box(sx-.1+lean,sx+.1+lean,fy,top,zd-.5,zd-.3,K.wood);
      box(sx-.12,sx+.12,top,top+.21,.02,zd-.22,K.wood);
      /* лампа: через четыре клетки, на задней стойке под верхняком */
      if(((c%K.lampStep)+K.lampStep)%K.lampStep===2){
        const lx=x0+CM*.25,ly=fy+CM-.62,lz=zd-.62;
        box(lx-.07,lx+.07,ly,ly+.16,lz-.07,lz+.07,K.steel);
        plnBlob(m,{c:[lx,ly-.06,lz],r:[.09,.1,.09],sub:1,col:K.lamp,mat:M.glow,glow:3});
        lamps.push([lx,ly-.1,lz-.3]);
      }
    }
    /* лестница: выработка уходит вверх или вниз — по стене тетивы и ступени */
    if(dig3Dug(F,c,r+1)){
      const lx=x0+CM*.5+(h<.5?-.55:.55),y0=fy-CM,y1=fy+.9;
      for(const s of [-1,1])box(lx+s*.22-.04,lx+s*.22+.04,y0,y1,zd-.62,zd-.52,K.wood);
      for(let y=y0+.25;y<y1-.05;y+=.3)box(lx-.22,lx+.22,y,y+.04,zd-.6,zd-.54,K.woodD);
    }
  }
  DIG3.stat.ore=dig3OreBodies(m,F);
  return {geo:plnGeo(plnMeshDone(m)),lamps,gen:PLN_GPU.gen,v:F.v,D:F.D};
}
/* рудное тело — россыпь гранёных самородков цвета руды по всей линзе, гуще и крупнее к сердцу: на листе
   разреза и на задней стене выработки, которую тело пересекает. Мерило — штрек: тело видно с его расстояния
   как пятно зерна, не как туман (жилы-трубки вблизи читались палками, 22.10). Тон — руда на три четверти,
   полоса пещеры на четверть: железо не лёд. Строится только у выработок (near клеток от выкопанного, под
   забоем ствола — дальше): дальше игрок тела не видит. Возвращает число самородков (для замера) */
const DIG3_ORE={near:7,sink:.45,dens:3.2,cap:340,wall:.7};
function dig3OreBodies(m,F){
  const D=F.D,CM=DIG3_CM,Z=DIG3_ORE,want=new Set();
  if(!D||!F.g)return 0;
  /* какие узлы руды рядом с выработкой: каждая выкопанная клетка отмечает узлы в радиусе near */
  for(let r=0;r<F.NR;r++)for(let c=-MINE_HALF;c<=MINE_HALF;c++){
    if(!dig3Dug(F,c,r))continue;
    const bottom=c===0&&!dig3Dug(F,0,r+1),dn=bottom?Z.near+5:Z.near;
    for(let nr=Math.floor(Math.max(0,r-Z.near)/ORE_NODE_H);nr<=Math.floor((r+dn)/ORE_NODE_H);nr++)
      for(let nc=Math.floor((c-Z.near)/ORE_NODE_W);nc<=Math.floor((c+Z.near)/ORE_NODE_W);nc++)want.add(nc+","+nr);
  }
  const dugAt=(x,y)=>dig3Dug(F,Math.floor(x/CM),Math.floor(-y/CM));
  /* камень ли под точкой: в пустоте и в полуметре от её края на листе зерна нет (лист там — кромка) */
  const rock=(x,y)=>!dugAt(x,y)&&!dugAt(x+.45,y)&&!dugAt(x-.45,y)&&!dugAt(x,y+.45)&&!dugAt(x,y-.45);
  /* задняя стена выработки за точкой: первая порода по лучу вглубь; в метре от пола и кровли — не ищем */
  const wallZ=(x,y)=>{
    const c=Math.floor(x/CM),rw=Math.floor(-y/CM),fy=-y/CM-rw;
    if(!dig3Dug(F,c,rw)||fy<.12||fy>.88)return null;
    for(let z=.6;z<DIG3_ROOM.hall+1.5;z+=.12)if(dig3Den(F,x,y,z)>0)return z;
    return null;
  };
  const band=typeof CAVE3_DC!=="undefined"&&CAVE3_DC.band?CAVE3_DC.band:[.42,.4,.36];
  let n=0;
  for(const key of want){
    const [nc,nr]=key.split(",").map(Number),q=oreNode(D,nc,nr);
    if(!q||!RES[q.res])continue;
    const r=rng(hashi(nc*131+7,nr*977+3,0x5EA3)),R=q.rad*CM,cx=(q.cx+.5)*CM,cy=-(q.cy+.5)*CM;
    const a=R/.8,b=R/1.25,th=(r()-.5)*.7,ux=Math.cos(th),uy=Math.sin(th);
    const col=plnMix3(band,plnHex(RES[q.res].col),.75);
    const k=Math.min(Z.cap,Math.round(Math.PI*a*b*Z.dens));
    for(let j=0;j<k;j++){
      /* к сердцу гуще и крупнее; край линзы — редкое мелкое зерно */
      const u=Math.pow(r(),.7),an=r()*TAU,lx=Math.cos(an)*u*a,ly=Math.sin(an)*u*b,x=cx+lx*ux-ly*uy,y=cy+lx*uy+ly*ux;
      const sz=(.05+r()*.08)*(1.35-u*.7)*(r()<.08?1.7:1),tone=plnMul(col,.8+r()*.45);
      let z=null;
      if(rock(x,y))z=sz*Z.sink;   /* утоплен в лист: наружу шапка, зерно в породе, не гравий перед ней */
      else if(r()<Z.wall){const w=wallZ(x,y);if(w!=null)z=w+sz*.25;}
      if(z==null)continue;
      plnBlob(m,{c:[x,y,z],r:[sz*(1+r()*.5),sz*(.7+r()*.4),sz*.8],sub:0,bump:.35,yaw:r()*6.3,pitch:r()-.5,lean:r()*3,seed:j*13+nc,
        col:tone,mat:CAVE3_MAT.vein,glow:.9,x:1});
      n++;
    }
  }
  return n;
}

/* вагонетка в клети: короб x ±w, по высоте y0..y1 над полом клети, вглубь z0..z1 (за человеком, z 1.1) */
const DIG3_TUB={w:.62,wb:.5,y0:.27,y1:.72,z0:1.38,z1:1.9,wr:.1,wx:.34,rail:.05};
/* шестигранник по восьми углам в порядке dig3Box (низ z0: 0 1, верх z0: 3 2; z1 — 4..7); нормали — от граней */
function dig3Hex(m,P,col,mat){
  const F6=[[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]],M=mat==null?PLN_MAT.bark:mat;
  for(const f of F6){
    const n=plnNorm(plnCross(plnSub(P[f[1]],P[f[0]]),plnSub(P[f[3]],P[f[0]])));
    const q=f.map(i=>plnVert(m,P[i],n,col,M));plnQuad(m,q[0],q[1],q[2],q[3]);
  }
}
/* вагонетка (как в штреке 23a): корыто шире кверху, отбортовка с заклёпками, ребро жёсткости,
   два колеса на рельсе клети; всё в метрах клети, p — её угол */
function dig3TubBody(m,p,K){
  const T=DIG3_TUB,M=PLN_MAT,t=.045,X=x=>x+p[0],Y=y=>y+p[1],Z=z=>z+p[2];
  const box=(x0,x1,y0,y1,za,zb,col)=>dig3Box(m,X(x0),X(x1),Y(y0),Y(y1),Z(za),Z(zb),col);
  /* полстенки по x на высоте y: корыто раскрывается от wb у дна до w у борта */
  const hx=y=>T.wb+(T.w-T.wb)*(y-T.y0)/(T.y1-T.y0);
  const slab=(sx,za,zb)=>{   /* боковая стенка: наклонная плита от дна до борта */
    const a=sx*T.wb,b=sx*T.w,ai=a-sx*t,bi=b-sx*t;
    const P=sx<0?[[a,T.y0,za],[ai,T.y0,za],[bi,T.y1,za],[b,T.y1,za],[a,T.y0,zb],[ai,T.y0,zb],[bi,T.y1,zb],[b,T.y1,zb]]
                :[[ai,T.y0,za],[a,T.y0,za],[b,T.y1,za],[bi,T.y1,za],[ai,T.y0,zb],[a,T.y0,zb],[b,T.y1,zb],[bi,T.y1,zb]];
    dig3Hex(m,P.map(q=>[X(q[0]),Y(q[1]),Z(q[2])]),K.rust,M.bark);
  };
  const face=(za,zb)=>{       /* торец: трапеция */
    const P=[[-T.wb,T.y0,za],[T.wb,T.y0,za],[T.w,T.y1,za],[-T.w,T.y1,za],[-T.wb,T.y0,zb],[T.wb,T.y0,zb],[T.w,T.y1,zb],[-T.w,T.y1,zb]];
    dig3Hex(m,P.map(q=>[X(q[0]),Y(q[1]),Z(q[2])]),K.rust,M.bark);
  };
  box(-T.wb,T.wb,T.y0,T.y0+.05,T.z0,T.z1,K.rust);
  face(T.z0,T.z0+t);face(T.z1-t,T.z1);slab(-1,T.z0,T.z1);slab(1,T.z0,T.z1);
  /* отбортовка: стальной пояс поверх борта, чуть шире корыта */
  const rw=T.w+.035,ry0=T.y1-.035,ry1=T.y1+.03;
  box(-rw,rw,ry0,ry1,T.z0-.03,T.z0+.02,K.steel);box(-rw,rw,ry0,ry1,T.z1-.02,T.z1+.03,K.steel);
  box(-rw,-T.w+.01,ry0,ry1,T.z0-.03,T.z1+.03,K.steel);box(T.w-.01,rw,ry0,ry1,T.z0-.03,T.z1+.03,K.steel);
  /* ребро жёсткости поперёк торца и угловые накладки — тёмный металл по ржавчине */
  const ym=(T.y0+T.y1)*.5-.02,xm=hx(ym);
  box(-xm,xm,ym-.025,ym+.025,T.z0-.018,T.z0+.005,K.steelD);
  for(const sx of [-1,1]){
    const x0=sx*hx(T.y0+.06),x1=sx*hx(T.y1-.04);
    plnTube(m,{path:[[X(x0-sx*.03),Y(T.y0+.06),Z(T.z0-.012)],[X(x1-sx*.03),Y(T.y1-.04),Z(T.z0-.012)]],rad:.024,sides:4,col:K.steelD,mat:M.bark});
  }
  /* заклёпки: по отбортовке и по ребру, шаг ~.13 м — точки света на торце */
  const rv=(x,y)=>box(x-.017,x+.017,y-.017,y+.017,T.z0-.05,T.z0-.025,K.bolt);
  for(let x=-T.w+.06;x<=T.w-.05;x+=.13)rv(x,(ry0+ry1)/2);
  for(let x=-xm+.07;x<=xm-.06;x+=.16)rv(x,ym);
  /* рама и буксы над колёсами */
  box(-T.wb-.03,T.wb+.03,T.y0-.06,T.y0,T.z0-.01,T.z1+.01,K.steelD);
  /* рельс клети: головка на шейке, по оси колёс, перед и зад */
  for(const zr of [T.z0+.02,T.z1-.02]){
    box(-.86,.86,0,.018,zr-.035,zr+.035,K.steelD);
    box(-.86,.86,.018,T.rail-.016,zr-.008,zr+.008,K.steelD);
    box(-.86,.86,T.rail-.016,T.rail,zr-.022,zr+.022,K.rail);
  }
  /* колёса: диск с ребордой и ступицей, стоит на головке рельса */
  const wy=T.rail+T.wr;
  for(const sx of [-1,1])for(const zw of [T.z0-.035,T.z1-.005]){
    const x=sx*T.wx,za=zw,zb=zw+.04;
    plnTube(m,{path:[[X(x),Y(wy),Z(za)],[X(x),Y(wy),Z(zb)]],rad:T.wr,sides:12,col:K.wheel,mat:M.bark,cap:true});
    plnTube(m,{path:[[X(x),Y(wy),Z(zb-.005)],[X(x),Y(wy),Z(zb+.012)]],rad:T.wr+.018,sides:12,col:K.wheel,mat:M.bark,cap:true});
    plnTube(m,{path:[[X(x),Y(wy),Z(za-.03)],[X(x),Y(wy),Z(za)]],rad:.032,sides:6,col:K.steel,mat:M.bark,cap:true});
    box(x-.07,x+.07,wy+.02,T.y0-.06,za+.005,zb,K.steelD);
  }
}

/* куча руды в вагонетке: камни горкой, верх горки — y1+.22 при полной клети; цвет — от руды (экземпляр) */
function dig3HeapMesh(){
  const m=plnMesh(1<<14),T=DIG3_TUB,r=rng(0x4EA9),zm=(T.z0+T.z1)/2,zw=(T.z1-T.z0)/2-.16;
  /* горка: камни мельче к краям, вершина посередине чуть выше борта; каждый свой тон — порода и руда вперемешку */
  for(let i=0;i<70;i++){
    const u=(r()*2-1),v=(r()*2-1),d=Math.min(1,Math.hypot(u,v*.8));
    const cx=u*(T.w-.16),cz=zm+v*zw,s=.05+r()*.04+(1-d)*.03,top=T.y1+.3-d*d*.3;
    const g=.14+r()*.26,ore=r()<.65;
    plnBlob(m,{c:[cx,top-s*.6,cz],r:[s*(1+r()*.4),s*(.7+r()*.3),s*(.8+r()*.2)],sub:0,bump:.3,yaw:r()*6.3,pitch:r()-.5,seed:i*7+1,
      col:ore?[g,g,g]:[g*.55,g*.52,g*.5],mat:PLN_MAT.bark});
  }
  return {geo:plnGeo(plnMeshDone(m)),inst:plnInst(new Float32Array(16),0,1),a:new Float32Array(16),gen:PLN_GPU.gen};
}
/* цвет кучи: руда, что больше всех весит в клети; тон приглушён — камень в свете лампы */
function dig3HeapTint(L){
  let k=null,b=0;for(const q in L||{}){const w=(L[q]|0)*resW(q);if(w>b){b=w;k=q;}}
  const h=k&&RES[k]&&RES[k].col;if(!h||h[0]!=="#")return [.5,.48,.46];
  const n=parseInt(h.slice(1),16),c=[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255];
  return c.map(x=>.12+x*.88);
}
/* клеть: рама из уголка, крыша, сетка на задней стенке, оранжевый пояс; низ — в нуле (пол клети) */
function dig3CageMesh(){
  const m=plnMesh(1<<12),top=dig3CageBody(m,[0,0,0]);
  return {geo:plnGeo(plnMeshDone(m)),inst:plnInst(new Float32Array(16),0,1),a:new Float32Array(16),gen:PLN_GPU.gen,top};
}
/* клеть в меш m, пол клети в точке p (копёр поверхности ставит её у устья — 23c); отдаёт высоту серьги */
function dig3CageBody(m,p){
  const K=DIG3_DR,M=PLN_MAT,w=.9,h=2.45,z0=.3,z1=1.95;
  const box=(x0,x1,y0,y1,za,zb,col)=>dig3Box(m,x0+p[0],x1+p[0],y0+p[1],y1+p[1],za+p[2],zb+p[2],col);
  /* пол и крыша */
  box(-w,w,-.1,0,z0,z1,K.steel);box(-w,w,h,h+.08,z0,z1,K.steel);
  /* стойки по углам */
  for(const x of [-w,w-.08])for(const z of [z0,z1-.08])box(x,x+.08,0,h,z,z+.08,K.steel);
  /* пояса: оранжевый на высоте пояса, серые — у пола и под крышей */
  for(const z of [z0,z1-.05]){box(-w,w,1.05,1.12,z,z+.05,K.band);box(-w,w,.3,.35,z,z+.05,K.steel);box(-w,w,h-.3,h-.25,z,z+.05,K.steel);}
  /* сетка задней стенки и боков — частые прутья */
  for(let x=-w+.15;x<w-.1;x+=.16)box(x,x+.02,0,h,z1-.04,z1-.02,K.steel);
  for(const x of [-w,w-.03])for(let z=z0+.15;z<z1-.1;z+=.16)box(x,x+.03,1.12,h,z,z+.02,K.steel);
  /* вагонетка у задней сетки: в ней руда едет наверх (груз клети, 23cc) */
  dig3TubBody(m,p,K);
  /* подвеска: дуга над крышей и серьга каната */
  const zc=(z0+z1)/2+p[2];
  plnTube(m,{path:[[p[0]-w*.7,p[1]+h+.08,zc],[p[0],p[1]+h+.55,zc],[p[0]+w*.7,p[1]+h+.08,zc]],rad:.04,sides:4,col:K.steel,mat:M.bark});
  return h+.55;
}
/* канат: от серьги клети до шкива копра — два кольца по четыре вершины, верх и низ пишутся каждый кадр */
function dig3RopeMesh(){
  const m=plnMesh(64);
  plnTube(m,{path:[[0,0,0],[0,1,0]],rad:.022,sides:4,col:[.03,.03,.032],mat:PLN_MAT.bark});
  const d=plnMeshDone(m);
  return {geo:plnGeo(d),V:d.v,gen:PLN_GPU.gen,y0:null,y1:null};
}
function dig3RopeSet(Q,xb,yb,xt,yt,z){
  if(Q.y0===yb&&Q.y1===yt&&Q.x0===xb&&Q.x1===xt)return;
  /* кольца по 4 вершины: первое — у серьги, второе — у шкива */
  const V=Q.V,n=Math.min(8,V.length/PLN_VS);
  for(let k=0;k<n;k++){const o=k*PLN_VS,a=k%4/4*TAU;V[o]=(k<4?xb:xt)+Math.cos(a)*.022;V[o+1]=k<4?yb:yt;V[o+2]=z+Math.sin(a)*.022;}
  GPU.dev.queue.writeBuffer(Q.geo.vb,0,V);
  Q.y0=yb;Q.y1=yt;Q.x0=xb;Q.x1=xt;
}

/* кадр: убранство, клеть, канат и огни ламп в окне */
function dig3DressFrame(F,Fd,D,Mm,x0,x1,y0,y1,Lt){
  const M=DIG3;
  if(!M.dr||M.dr.gen!==PLN_GPU.gen||M.dr.v!==Fd.v||M.dr.D!==D){if(M.dr)plnGeoFree(M.dr.geo);M.dr=dig3DressMesh(Fd);}
  F.draw.push({geo:M.dr.geo,lamp:true,sun:true,refl:false});
  let tris=M.dr.geo.n/3;
  for(const q of M.dr.lamps){
    if(q[0]<x0||q[0]>x1||q[1]<y0||q[1]>y1)continue;
    Lt(q,7.5,[.42,.28,.13]);
  }
  /* клеть: где она стоит (Mm.cy — пол клети в px мира, Mm.gy — в метры, как у человека) */
  if(!M.cg||M.cg.gen!==PLN_GPU.gen){M.cg=dig3CageMesh();M.rp=dig3RopeMesh();}
  const cy=Mm.gy(Mm.cy),cx=DIG3_CM*.5,zc=(.3+1.95)/2;
  plnRec(M.cg.a,0,[cx,cy,0],1,0,1,0);plnInstSet(M.cg.inst,M.cg.a,1);
  F.draw.push({geo:M.cg.geo,inst:M.cg.inst,lamp:true,sun:true,refl:false});
  /* руда в вагонетке: горка поднимается над бортом по мере груза, пустая клеть — горки нет */
  const fill=typeof mineCageW==="function"?clamp(mineCageW(D)/MINE_CAGE_CAP,0,1):0;
  let ht=0;
  if(fill>0){
    if(!M.hp||M.hp.gen!==PLN_GPU.gen)M.hp=dig3HeapMesh();
    plnRec(M.hp.a,0,[cx,cy-(1-Math.sqrt(fill))*.3,0],1,0,1,0,dig3HeapTint(D.cage));plnInstSet(M.hp.inst,M.hp.a,1);
    F.draw.push({geo:M.hp.geo,inst:M.hp.inst,lamp:true,sun:true,refl:false});ht=M.hp.geo.n/3;
  }
  /* канат: с обода шкива к серьге (копра ещё нет — прямо вверх на его высоту) */
  const tp=M.hf&&M.hf.rope?M.hf.rope:[cx,dig3Ground(Fd,cx)+6,zc];
  dig3RopeSet(M.rp,cx,cy+M.cg.top,tp[0],tp[1],zc);
  F.draw.push({geo:M.rp.geo,lamp:true,sun:true,refl:false});
  return tris+M.cg.geo.n/3+ht;
}
