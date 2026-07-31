/* ══════════════ текстуры планет ══════════════ */
function ramp(pal,t){
  t=clamp(t,0,.9999);
  const s=t*(pal.length-1),i=Math.floor(s),f=s-i;
  const a=pal[i],b=pal[Math.min(pal.length-1,i+1)];
  return [lerp(a[0],b[0],f),lerp(a[1],b[1],f),lerp(a[2],b[2],f)];
}
function planetTex(p){
  if(p.tex)return p.tex;
  const S=clamp(Math.round(p.radius*2.6),72,208);
  const cn=document.createElement("canvas");cn.width=cn.height=S;
  const cx=cn.getContext("2d"),img=cx.createImageData(S,S),d=img.data;
  const pal=p.T.pal,gas=p.type==="gas";
  for(let py=0;py<S;py++)for(let px=0;px<S;px++){
    const o=(py*S+px)*4;
    const nx=(px+.5)/S*2-1,ny=(py+.5)/S*2-1,r2=nx*nx+ny*ny;
    if(r2>1){d[o+3]=0;continue;}
    const nz=Math.sqrt(1-r2);
    const lon=Math.atan2(nx,nz),lat=Math.asin(clamp(ny,-1,1));
    let v;
    if(gas){
      v=fbm2(lon*.7+9,lat*7+3,p.seed,4);
      v=clamp(v*.6+.5*(.5+.5*Math.sin(lat*9+fbm2(lon*1.6,lat*3,p.seed+5,3)*4)),0,1);
    }else{
      v=fbm2(lon*2.4+11,lat*2.4+11,p.seed,5);
      v=clamp((v-.5)*(1+p.rough*.9)+.5,0,1);
      v=clamp(v+Math.pow(Math.abs(lat)/1.5708,3.2)*.55,0,1);
    }
    const c=ramp(pal,v);
    const light=clamp(nx*-.52+ny*-.42+nz*.74,0,1);
    const sh=.16+1.02*Math.pow(light,.85), rim=Math.pow(1-nz,4)*(gas?.5:.34);
    d[o]=clamp(c[0]*sh+rim*130,0,255);
    d[o+1]=clamp(c[1]*sh+rim*180,0,255);
    d[o+2]=clamp(c[2]*sh+rim*210,0,255);
    d[o+3]=255;
  }
  cx.putImageData(img,0,0);p.tex=cn;return cn;
}

/* ══════════════ рельеф ══════════════ */
/* ══════════════ рельеф ══════════════ */
/* профиль собирается из нескольких независимых форм: пологие холмы, острые
   хребты, столовые плато, дюны, кратеры с валом и врезанные каньоны. Вес
   каждой формы — от типа планеты и её seed, поэтому две пустынные планеты
   выглядят по-разному, но обе остаются пустынными. */
const RELIEF_MIX={
  terran:  {hill:1,  ridge:.55, mesa:.15, dune:0,   crater:.2,  canyon:.4},
  ocean:   {hill:1,  ridge:.15, mesa:.05, dune:.2,  crater:.1,  canyon:.15},
  desert:  {hill:.7, ridge:.3,  mesa:.85, dune:1,   crater:.35, canyon:.7},
  rocky:   {hill:.8, ridge:1,   mesa:.5,  dune:0,   crater:1,   canyon:.5},
  ice:     {hill:.9, ridge:.7,  mesa:.35, dune:.35, crater:.45, canyon:.6},
  volcanic:{hill:.8, ridge:1,   mesa:.25, dune:0,   crater:.9,  canyon:.85},
  toxic:   {hill:1,  ridge:.45, mesa:.4,  dune:.25, crater:.3,  canyon:.55},
  /* кристаллический — частокол острых гряд почти без пологого; джунгли —
     мягкие валы с врезанными руслами; металлический — битый кратерами шар
     без осадочных плато; руинный — ступени плато, как разрушенные террасы */
  crystal: {hill:.35,ridge:1.2, mesa:.6,  dune:0,   crater:.5,  canyon:.4},
  jungle:  {hill:1.1,ridge:.4,  mesa:.2,  dune:0,   crater:.1,  canyon:.9},
  metal:   {hill:.6, ridge:.8,  mesa:.3,  dune:0,   crater:1.3, canyon:.35},
  /* mesa 1.1 давало ровное плато во весь кадр — руинный мир выходил столом.
     Ступени остались, но теперь между ними есть подъёмы и врезы */
  ruin:    {hill:1.0,ridge:.35, mesa:.7,  dune:.4,  crater:.5,  canyon:.85},
  gas:     {hill:1,  ridge:0,   mesa:0,   dune:0,   crater:0,   canyon:0}
};
function genTerrain(p){
  const N=1500,step=6,base=900,h=new Float32Array(N);
  const r=rng(p.seed^0x5f3b);
  const M=wtab(p).relief||RELIEF_MIX[p.type]||RELIEF_MIX.terran;
  const amp=60+p.rough*300;
  /* каждой форме — свой множитель, чтобы планеты одного типа не повторялись */
  const w={
    hill:M.hill*(.6+r()*.7), ridge:M.ridge*(.4+r()*1.1),
    mesa:M.mesa*(.4+r()*1.2), dune:M.dune*(.5+r()*1.0)
  };
  const mesaStep=amp*(.22+r()*.3), duneLen=.055+r()*.07, duneAmp=amp*.16*w.dune;
  for(let i=0;i<N;i++){
    let y=base;
    y-=fbm1(i*.0055,p.seed,5)*amp*w.hill;
    y-=fbm1(i*.05,p.seed+7,3)*amp*.22*w.hill;
    if(w.ridge>.02){
      const n=fbm1(i*.013,p.seed+31,4);
      y-=Math.pow(1-Math.abs(1-2*n),2.1)*amp*.95*w.ridge;
    }
    if(w.mesa>.02){
      const t=fbm1(i*.0042,p.seed+57,3);
      y-=Math.round(t*3.4)/3.4*amp*.8*w.mesa;
    }
    if(duneAmp>.5){
      const ph=fbm1(i*.006,p.seed+83,2)*7;
      const s=Math.sin(i*duneLen+ph);
      y-=(Math.pow(Math.abs(s),.55)*Math.sign(s)*.5+.5)*duneAmp;
    }
    h[i]=y;
  }
  /* кратеры: чаша плюс приподнятый вал по кромке */
  const craters=[];
  const nCr=Math.floor(M.crater*(1+r()*5));
  for(let c=0;c<nCr;c++){
    const ci=Math.floor(r()*N), rad=18+r()*72, depth=amp*(.12+r()*.34);
    craters.push({i:ci,rad});
    for(let i=Math.max(0,ci-rad*1.5|0);i<Math.min(N,ci+rad*1.5|0);i++){
      const u=(i-ci)/rad;
      if(Math.abs(u)>1.45)continue;
      if(Math.abs(u)<=1)h[i]+=depth*Math.cos(u*Math.PI/2)*.9;          // чаша вниз
      const rim=Math.exp(-Math.pow((Math.abs(u)-1)/.3,2));
      h[i]-=depth*.42*rim;                                              // вал вверх
    }
  }
  /* каньоны: узкие глубокие врезы с почти отвесными бортами */
  const nCn=Math.floor(M.canyon*(1+r()*2.4));
  for(let c=0;c<nCn;c++){
    const ci=Math.floor(60+r()*(N-120)), half=7+r()*16, depth=amp*(.5+r()*.8);
    for(let i=Math.max(0,ci-half*3|0);i<Math.min(N,ci+half*3|0);i++){
      const u=Math.abs(i-ci)/half;
      if(u>2.4)continue;
      h[i]+=depth*(1/(1+Math.pow(u,7)));
    }
  }
  /* площадка под посадку — ровная и подальше от кратеров */
  let pi=90+Math.floor(r()*(N-190));
  for(let t=0;t<40;t++){
    const cand=90+Math.floor(r()*(N-190));
    const near=craters.some(c=>Math.abs(cand-c.i)<c.rad*1.6);
    if(!near){pi=cand;break;}
  }
  const pw=18,py=h[pi];
  for(let i=pi-pw;i<=pi+pw;i++){
    const t=clamp((Math.abs(i-pi)-pw*.5)/(pw*.5),0,1);
    h[i]=lerp(py,h[i],t*t);
  }
  /* валуны и осыпь: детерминированы, лежат прямо на профиле */
  const rocks=[];
  const nRk=Math.floor(24+r()*40);
  for(let i=0;i<nRk;i++){
    const x=r()*N*step, rad=3+r()*r()*22, n=6+Math.floor(r()*6), poly=[];
    for(let k=0;k<n;k++){
      const a=k/n*TAU, q=rad*(.6+r()*.6);
      poly.push([Math.cos(a)*q,Math.sin(a)*q*.72]);
    }
    rocks.push({x,rad,poly,tint:r(),flip:r()<.5});
  }
  return {h,N,step,W:N*step,padI:pi,padX:pi*step,padY:h[pi],rocks,
    strata:2+Math.floor(r()*4), sseed:p.seed};
}
function groundAt(tr,x){
  const fx=clamp(x/tr.step,0,tr.N-1.001),i=Math.floor(fx),f=fx-i;
  return lerp(tr.h[i],tr.h[i+1],f);
}
