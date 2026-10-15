/* ══════════════ рудник на движке: убранство выработки (M631) ══════════════
   То, по чему шахту узнают: рельсы и шпалы по горизонтам, крепь рамами (задняя стойка, ближняя
   стойка, верхняк поперёк штрека), лампы через четыре клетки, лестницы в выработке по руде,
   проводники и расстрелы ствола, порог площадки на горизонте; клеть с человеком и канат до шкива.
   Всё — тела людской грамматики: серая сталь, ржавчина, тёмный брус, одно оранжевое пятно на клети.
   Статичное собирается одной сеткой и пересобирается, когда выработка изменилась (D.maskV);
   клеть — одна запись экземпляра, канат — два кольца в своём буфере, их пишут каждый кадр. */
const DIG3_DR={wood:[.105,.066,.036],woodD:[.062,.04,.022],steel:[.075,.078,.085],rail:[.15,.15,.16],
  rust:[.13,.065,.03],band:[.62,.2,.03],lamp:[1,.72,.4],set:1.6,rails:[.82,1.42],lampStep:4};

/* выкопан ли пол под клеткой: штрек стоит на полу, над пустотой — лестница */
function dig3Floor(F,c,r){return !dig3Dug(F,c,r+1);}
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
  return {geo:plnGeo(plnMeshDone(m)),lamps,gen:PLN_GPU.gen,v:F.v,D:F.D};
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
  /* канат: с обода шкива к серьге (копра ещё нет — прямо вверх на его высоту) */
  const tp=M.hf&&M.hf.rope?M.hf.rope:[cx,dig3Ground(Fd,cx)+6,zc];
  dig3RopeSet(M.rp,cx,cy+M.cg.top,tp[0],tp[1],zc);
  F.draw.push({geo:M.rp.geo,lamp:true,sun:true,refl:false});
  return tris+M.cg.geo.n/3;
}
