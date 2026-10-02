/* ══════════════ планета: одежда земли — тропа, берег, галька (M623) ══════════════
   Тропа — не мазок кисти: натоптанная середина темнее и плотнее, края светлее и пыльнее, кромка
   рвана маской plnLandPath. У уреза пруда — отмель: дно у берега светлее ила на глубине, а полоса
   сырой земли у воды темнее тропы. Галька — тела, не зерно: кучками по краю тропы и у трапа, где
   человек сходит на землю, — деталь там, где актёр. Цвета — рабочий лист мира (PLN_PAL). */
const PLN_DRESS={
  core:.45,                /* натоптанная середина тропы — доля её полуширины */
  heaps:[3,5],             /* кучек гальки на кусок: от и до */
  per:[5,10],              /* камешков в кучке */
  r:[.06,.2]};             /* радиус камешка, м */
/* краска тропы на ленте: c — цвет земли до тропы, slope — крутизна (1 − n.y), v1 — крупное зерно куска */
function plnDressPath(L,x,z,c,slope,v1){
  const w=plnLandPath(L,x,z);
  if(w<=0)return c;
  const PAL=PLN_PAL,k=1-plnSmooth(.55,.75,slope),core=plnLandPath(L,x,z,PLN_DRESS.core);
  const edge=plnMix3(plnMix3(PAL.soil,PAL.dry,.3),PAL.soilDark,v1*.35);   /* пыльный край */
  const mid=plnMix3(PAL.soilDark,PAL.soil,.25+.3*v1);                       /* натоптанная середина */
  c=plnMix3(c,edge,plnSmooth(0,.6,w)*.8*k);
  return plnMix3(c,mid,plnSmooth(.3,1,core)*.85*k);
}
/* берег пруда: полоса сырой земли у воды, отмель у уреза светлее, ил на глубине */
function plnDressShore(L,x,z,h,c){
  const PAL=PLN_PAL,lv=L.lake.level;
  c=plnMix3(c,plnMix3(PAL.soilDark,PAL.mud,.6),plnLandBare(L,x,z)*plnSmooth(.6,2.5,Math.abs(z))*.7);
  c=plnMix3(c,plnMix3(PAL.soil,PAL.mud,.45),plnSmooth(lv+.12,lv-.2,h)*.9);
  return plnMix3(c,PAL.mud,plnSmooth(lv-.2,lv-.9,h)*.85);
}
/* галька куска: кучками по краю тропы (не по самой середине) и у трапа корабля; o — помощники куска
   (21pga): free, rock. Пятен тени галька не даёт: их в кадре шесть десятков, и они нужны деревьям */
function plnDressBodies(L,J,o){
  const D=PLN_DRESS,xa=J.xa,xb=J.xb,wd=xb-xa,r=rng(plnPlantSeed(L,J.c,6)),spots=[];
  const n=D.heaps[0]+((r()*(D.heaps[1]-D.heaps[0]+1))|0);
  for(let d=0;d<n;d++)spots.push([xa+1+r()*(wd-2),-.15+(r()<.5?-1:1)*(1.1+r()*.7)]);
  if(L.rampX>xa&&L.rampX<xb)spots.push([L.rampX+1.8,L.rampZ*.55]);
  for(const s of spots){
    const m=D.per[0]+((r()*(D.per[1]-D.per[0]+1))|0),rx=.5+r()*.5,rz=.35+r()*.3;
    for(let i=0;i<m;i++){
      const a=r()*TAU,u=Math.sqrt(r()),x=s[0]+Math.cos(a)*rx*u,z=s[1]+Math.sin(a)*rz*u,rr=lerp(D.r[0],D.r[1],r()*r());
      if(x<xa||x>=xb||plnLandPath(L,x,z)>.7||!o.free(x,z,0))continue;
      o.rock(x,z,rr,.35+r()*.4,.9+r()*.2,true);
    }
  }
}
