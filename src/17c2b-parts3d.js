/* ══════════════ части на подвесах — в объёме (M722) ══════════════
   Автор, 06.10: «кучу деталей смоделировать и чтобы ставить на подвесы на корабли … не жалей там деталей
   отрисовки, прям жирным слоем». До этого прохода сборка читалась плоскими стволами поверх объёмного
   корпуса (05c shipGearGpu), а щит, реактор, обшивка, утилиты и пусковая не читались вовсе.

   Здесь каждая часть — геометрия в той же сетке, что корпус (17c2a h3dMesh): одна звезда, тень тела
   падает на часть, у посадки часть темнее (законы — docs/DESIGN-space.md «Parts on the mounts»).
   Камера смотрит сверху, поэтому всё стоит на палубе, крыле, рубке или таре, а не под ними.
     род      — силуэт: стволы, соты пусковой, излучатель поля, купол реактора, плиты, кольцо сопла, мачта;
     семейство ствола — голова (17c2c): спарка, рельсы, линза, рупор, барабан, катушки…;
     размер   — калибр и длина (L/M/H); тир — подробность (тормоз, рубашка, датчик, кабели, отделка);
     завод    — грамматика: ГЛАВТРАССА — гранёный кожух и красная полоса, Компания — белый купол и ходовая
                строка, Орднунг — клин и гребни, Коммуна — латунь и скругления, Рассвет — сварка и латки,
                Хай-Фронт — веретено и светящаяся строка.
   Вершина части: доля своего цвета w = 3 + погон + металл×.9 (шейдер 17c2a читает погон и металл), блик ≥ 0
   (часть, не тело), огонь > 1 — своё свечение. Турель и башня стоят на своём погоне: угол наводки идёт
   в униформу и поворачивает их видеокарта, сетка при этом не перестраивается. */
const P3={gear:null,stock:new Map()};
/* оболочка, тёмный металл, отделка, свет изготовителя (он же — свет его двигателей, 03a eng.col), кожух турели */
const P3_MK={
  gt:{sh:[178,174,156],dk:[74,76,72],tr:[184,54,40],gl:[255,168,86],met:.35,house:"oct"},
  co:{sh:[236,238,242],dk:[88,94,104],tr:[150,205,255],gl:[150,205,255],met:.15,house:"dome"},
  or:{sh:[118,124,132],dk:[60,62,68],tr:[214,218,224],gl:[240,248,255],met:.5,house:"wedge"},
  km:{sh:[170,196,224],dk:[74,82,104],tr:[206,168,96],gl:[190,150,255],met:.3,house:"fillet"},
  ra:{sh:[186,138,70],dk:[54,48,42],tr:[146,62,40],gl:[255,214,120],met:.2,house:"weld"},
  hf:{sh:[214,222,230],dk:[78,86,98],tr:[130,255,236],gl:[130,255,236],met:.45,house:"drop"}
};
/* свет головы ствола — цвет его выстрела (13a-guns): рельса бело-голубая, лазер раскалённый, сифон — цвет поля */
const P3_GL={rail:[180,220,255],laser:[255,120,80],siphon:[159,216,255],pulse:[210,190,255],drill:[255,220,140],
  arc:[170,200,255],plasma:[150,255,200],jam:[255,80,80],needle:[190,160,255],shove:[160,220,255],aimed:[255,90,70],
  heat:[255,140,70],flak:[140,255,160]};
const P3_K=[1,1.3,1.65];   /* калибр по размеру L/M/H */
const P3_SHIELD=[150,215,255],P3_WAR=[206,58,40],P3_BRASS=[204,166,92],P3_CU=[164,88,54],P3_GM=[80,82,88];
/* огонёк рода на пустом подвесе — цвет рода из таблицы частей (05-parts), чтобы ангар и корабль говорили одно */
function p3KindCol(kind){const s=(PART_KINDS[kind]||PART_KINDS.gun).col;return [1,3,5].map(i=>parseInt(s.slice(i,i+2),16));}
function p3In(P,x,y){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];
  if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1]+1e-12)+a[0])c=!c;}return c;}
/* верх конструкции под точкой — те же объёмы, что строит h3dMesh: палуба, крыло, бокс, гондола, рубка, тара,
   навеска; hit — есть ли под точкой корабль вообще (иначе часть висит на пилоне) */
function p3Top(h,deck,x,y){
  let z=deck(x,y),hit=z>.01;
  const dM=(x0,x1,y0,y1)=>{let m=0;for(let i=0;i<=4;i++)for(let j=0;j<=4;j++)m=Math.max(m,deck(x0+(x1-x0)*i/4,y0+(y1-y0)*j/4));return m;};
  const inR=(x0,x1,y0,y1)=>x>=x0&&x<=x1&&y>=y0&&y<=y1;
  h.wings.forEach((W,wi)=>{if(!p3In(W,x,y)&&!p3In(W,x,-y))return;
    const ymin=Math.min(...W.map(p=>Math.abs(p[1]))),dh=h.form==="xwing"?(wi%2?-.16:.16):0;
    z=Math.max(z,(Math.abs(y)-ymin)*dh+.35);hit=true;});
  for(const p of h.pods)for(const s of (p[4]?[p[4]]:[1,-1])){const y0=s>0?p[1]:-p[1]-p[3];
    if(inR(p[0],p[0]+p[2],y0,y0+p[3])){z=Math.max(z,p[3]*.42);hit=true;}}
  for(const n of h.nacs)for(const s of [1,-1]){const dy=y-n.y*s;
    if(Math.abs(x-n.x)<=n.l/2&&Math.abs(dy)<n.r){z=Math.max(z,Math.sqrt(n.r*n.r-dy*dy));hit=true;}}
  /* бочки сопел (как в h3dMesh): часть на кормовом подвесе встаёт на бочку, а не тонет в ней */
  if(!h.yac)for(const e of h.eng){const bl=Math.max(3,e.r*2.4),br=e.r*1.05,x0=e.x-bl*.1,dy=y-e.y;
    if(x>=x0-e.r*.5&&x<=x0+bl+.6&&Math.abs(dy)<br){z=Math.max(z,Math.sqrt(br*br-dy*dy));hit=true;}}
  const M=h.mark||{};
  if(M.bridge){const B=M.bridge,x0=B.x-B.l/2,x1=B.x+B.l/2;
    if(inR(x0,x1,-B.w/2,B.w/2)){z=Math.max(z,dM(x0,x1,-B.w/2,B.w/2)+Math.max(1.3,B.w*.3));hit=true;}}
  if(M.cont)for(const c of M.cont)for(const s of [1,-1]){const yy=c[2]*s,gy=s>0?yy-c[2]*.55:yy-c[2]*.45;
    if(inR(c[0],c[0]+c[1],gy,gy+c[2])){z=Math.max(z,dM(c[0],c[0]+c[1],gy,gy+c[2])+clamp(Math.min(c[1],c[2])*.42,.8,3));hit=true;}}
  for(const g of h.greeb||[]){const x0=g[4]?g[0]-g[2]*.5:g[0],y0=g[4]?g[1]-g[2]*.5:g[1],x1=x0+g[2],y1=g[4]?y0+g[2]:y0+g[3];
    if(inR(x0,x1,y0,y1)){const zt=dM(x0,x1,y0,y1);if(zt>0)z=Math.max(z,zt+.25+.12*Math.min(x1-x0,y1-y0));}}
  return {z,hit};
}

/* ── инструменты сетки части ── K — инструменты корпуса (17c2a h3dKit). Части строятся в местных осях подвеса:
   O — точка посадки, S — зеркало борта (левый борт — отражение правого: короб ленты всегда снаружи),
   seat — высота посадки (к ней вершина темнеет), rig — номер погона (0 — неподвижна), Rb — куда дотянется
   повёрнутая турель */
function p3Tools(K){
  const vx=K.vx,T={rig:0,seat:0,O:[0,0,0],S:1,Rb:0,rigs:[],zt:0};
  const cr=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const nz=v=>{const l=Math.hypot(v[0],v[1],v[2]);return l>1e-9?[v[0]/l,v[1]/l,v[2]/l]:[0,0,1];};
  const L=(x,y,z)=>[T.O[0]+x,T.O[1]+y*T.S,T.O[2]+z],Ln=(x,y,z)=>[x,y*T.S,z];
  const mt=(c,met,sp,gl)=>({c:[c[0]/255,c[1]/255,c[2]/255],met:met||0,sp:sp==null?.6:sp,gl:gl||0});
  const glo=(c,g)=>mt(c,0,0,g);
  /* вершина: к посадке темнее — контакт части с палубой без теней между частями */
  const put=(p,n,M)=>{let c=M.c;
    if(!M.gl){const a=clamp(.58+(p[2]-T.seat)*.6,.58,1);c=[c[0]*a,c[1]*a,c[2]*a];}
    vx(p,n,c,3+T.rig+Math.min(M.met,1)*.9,M.sp,M.gl?1+M.gl:0);if(p[2]>T.zt)T.zt=p[2];
    if(T.rig){const O=T.O;T.Rb=Math.max(T.Rb,Math.hypot(Math.hypot(O[0],O[1])+Math.hypot(p[0]-O[0],p[1]-O[1]),p[2]));}};
  const quad=(a,b,c,d,n,M)=>{put(a,n,M);put(b,n,M);put(c,n,M);put(a,n,M);put(c,n,M);put(d,n,M);};
  /* тело вращения: ось из местной точки o по единичной оси ax, профиль [[d,r,M?]] — M красит пролёт от этой
     точки; нормаль из профиля (гладко через излом меньше 40°), вокруг оси гладко, при N ≤ 8 — гранями */
  const rev=(o,ax,P,N,M,ph)=>{
    const up=Math.abs(ax[2])<.9?[0,0,1]:[1,0,0],u=nz(cr(ax,up)),v=cr(ax,u);ph=ph||0;
    const sn=[];for(let j=0;j+1<P.length;j++){const dd=P[j+1][0]-P[j][0],dr=P[j+1][1]-P[j][1],l=Math.hypot(dd,dr);sn.push(l>1e-9?[-dr/l,dd/l]:null);}
    const nAt=(j,vt)=>{const s=sn[j],o2=sn[vt===j?j-1:j+1];
      if(o2&&s[0]*o2[0]+s[1]*o2[1]>.77){const a=s[0]+o2[0],b=s[1]+o2[1],l=Math.hypot(a,b);return [a/l,b/l];}return s;};
    const at=(d,r,t)=>{const c=Math.cos(t)*r,s=Math.sin(t)*r;
      return L(o[0]+ax[0]*d+u[0]*c+v[0]*s,o[1]+ax[1]*d+u[1]*c+v[1]*s,o[2]+ax[2]*d+u[2]*c+v[2]*s);};
    const an=(n,t)=>{const c=Math.cos(t),s=Math.sin(t);
      return Ln(ax[0]*n[0]+(u[0]*c+v[0]*s)*n[1],ax[1]*n[0]+(u[1]*c+v[1]*s)*n[1],ax[2]*n[0]+(u[2]*c+v[2]*s)*n[1]);};
    const fac=N<=8;
    for(let j=0;j+1<P.length;j++){if(!sn[j])continue;const A=P[j],B=P[j+1],m=A[2]||M,na=nAt(j,j),nb=nAt(j,j+1);
      for(let i=0;i<N;i++){const t0=ph+i/N*TAU,t1=ph+(i+1)/N*TAU,tm=(t0+t1)/2;
        const a0=at(A[0],A[1],t0),a1=at(A[0],A[1],t1),b0=at(B[0],B[1],t0),b1=at(B[0],B[1],t1);
        const n00=an(na,fac?tm:t0),n01=an(na,fac?tm:t1),n10=an(nb,fac?tm:t0),n11=an(nb,fac?tm:t1);
        if(B[1]>1e-6){put(a0,n00,m);put(b0,n10,m);put(b1,n11,m);}
        if(A[1]>1e-6){put(a0,n00,m);put(b1,n11,m);put(a1,n01,m);}}}
  };
  /* ящик: середина c, полуразмеры, скос верхних кромок b; ex — местное «вперёд», ey — «вбок», верх — ex×ey
     (низ не строится: снизу на корабль не смотрят) */
  const bx=(c,hx,hy,hz,b,M,ex,ey)=>{ex=ex||[1,0,0];ey=ey||[0,1,0];const ez=cr(ex,ey);
    b=Math.max(0,Math.min(b||0,hx*.45,hy*.45,hz*.9));
    const P=(x,y,z)=>L(c[0]+ex[0]*x+ey[0]*y+ez[0]*z,c[1]+ex[1]*x+ey[1]*y+ez[1]*z,c[2]+ex[2]*x+ey[2]*y+ez[2]*z);
    const D=(x,y,z)=>Ln(ex[0]*x+ey[0]*y+ez[0]*z,ex[1]*x+ey[1]*y+ez[1]*z,ex[2]*x+ey[2]*y+ez[2]*z);
    const Tq=[[-hx+b,-hy+b],[hx-b,-hy+b],[hx-b,hy-b],[-hx+b,hy-b]],Q=[[-hx,-hy],[hx,-hy],[hx,hy],[-hx,hy]],SN=[[0,-1],[1,0],[0,1],[-1,0]],zm=hz-b;
    quad(P(Tq[0][0],Tq[0][1],hz),P(Tq[1][0],Tq[1][1],hz),P(Tq[2][0],Tq[2][1],hz),P(Tq[3][0],Tq[3][1],hz),D(0,0,1),M);
    for(let i=0;i<4;i++){const j=(i+1)%4,n=SN[i];
      quad(P(Q[i][0],Q[i][1],-hz),P(Q[j][0],Q[j][1],-hz),P(Q[j][0],Q[j][1],zm),P(Q[i][0],Q[i][1],zm),D(n[0],n[1],0),M);
      if(b>0)quad(P(Q[i][0],Q[i][1],zm),P(Q[j][0],Q[j][1],zm),P(Tq[j][0],Tq[j][1],hz),P(Tq[i][0],Tq[i][1],hz),D(n[0]*.7071,n[1]*.7071,.7071),M);}
  };
  /* брусок от точки a до точки b (рычаг, стойка) */
  const seg=(a,b,w,hh,M)=>{const ex=nz([b[0]-a[0],b[1]-a[1],b[2]-a[2]]),ey=nz(cr([0,0,1],ex)),l=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]);
    bx([(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2],l/2,w,hh,Math.min(w,hh)*.3,M,ex,ey);};
  /* плита по профилю: выпуклый многоугольник [[x,z]] в плоскости xz, вытянут по y от y0 до y1 */
  const ext=(P,y0,y1,M)=>{let cx=0,cz=0;for(const q of P){cx+=q[0]/P.length;cz+=q[1]/P.length;}
    for(const [yy,ny] of [[y0,-1],[y1,1]])for(let i=1;i+1<P.length;i++){const n=Ln(0,ny,0);
      put(L(P[0][0],yy,P[0][1]),n,M);put(L(P[i][0],yy,P[i][1]),n,M);put(L(P[i+1][0],yy,P[i+1][1]),n,M);}
    for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length];let ex=b[1]-a[1],ez=-(b[0]-a[0]);const l=Math.hypot(ex,ez)||1;ex/=l;ez/=l;
      if(ex*((a[0]+b[0])/2-cx)+ez*((a[1]+b[1])/2-cz)<0){ex=-ex;ez=-ez;}
      quad(L(a[0],y0,a[1]),L(b[0],y0,b[1]),L(b[0],y1,b[1]),L(a[0],y1,a[1]),Ln(ex,0,ez),M);}
  };
  /* труба по ломаной: кабель, трубопровод, лента подачи */
  const pipe=(P,r,M,N)=>{N=N||6;const R=[];
    for(let k=0;k<P.length;k++){const a=P[Math.max(0,k-1)],b=P[Math.min(P.length-1,k+1)];
      const t=nz([b[0]-a[0],b[1]-a[1],b[2]-a[2]]),up=Math.abs(t[2])<.9?[0,0,1]:[0,1,0],u=nz(cr(t,up)),v=cr(t,u),q=[];
      for(let i=0;i<=N;i++){const f=i/N*TAU,c=Math.cos(f),s=Math.sin(f),n=[u[0]*c+v[0]*s,u[1]*c+v[1]*s,u[2]*c+v[2]*s];
        q.push([L(P[k][0]+n[0]*r,P[k][1]+n[1]*r,P[k][2]+n[2]*r),Ln(n[0],n[1],n[2])]);}R.push(q);}
    for(let k=0;k+1<R.length;k++){const A=R[k],B=R[k+1];for(let i=0;i<N;i++){
      put(A[i][0],A[i][1],M);put(B[i][0],B[i][1],M);put(B[i+1][0],B[i+1][1],M);
      put(A[i][0],A[i][1],M);put(B[i+1][0],B[i+1][1],M);put(A[i+1][0],A[i+1][1],M);}}
  };
  const sph=(c,r,M,N)=>{const P=[];for(let i=0;i<=8;i++){const f=-Math.PI/2+i/8*Math.PI;P.push([r*Math.sin(f),r*Math.cos(f)]);}rev(c,[0,0,1],P,N||12,M);};
  /* тор вокруг оси: d — сдвиг по оси, R — радиус кольца, rt — толщина */
  const torus=(o,ax,d,R,rt,M,N,n)=>{n=n||6;const P=[];for(let i=0;i<=n;i++){const f=Math.PI-i/n*TAU;P.push([d+rt*Math.cos(f),R+rt*Math.sin(f)]);}rev(o,ax,P,N||16,M);};
  /* хомут на стволе вдоль x */
  const collar=(x,y,z,r,w,M)=>rev([x,y,z],[1,0,0],[[0,r*.78],[0,r],[w,r],[w,r*.78]],12,M);
  /* тарелка: чаша вокруг оси ax, раскрыв R, глубина dp, внутри — Mi */
  const dish=(c,ax,R,dp,M,Mi)=>rev(c,ax,[[0,0],[dp*.25,R*.5],[dp,R],[dp*.92,R*.97,Mi],[dp*.25,R*.45,Mi],[dp*.08,0]],16,M);
  /* ствол вдоль x: казна толще, дуло — срез с тёмным каналом; brake — дульный тормоз этим материалом */
  const barrel=(x0,l,y,z,r,M,brake,Bk,N)=>{
    const P=[[0,r*1.32],[l*.12,r*1.32],[l*.14,r],[l*.62,r*.94]];
    if(brake)P.push([l*.84,r*.88,brake],[l*.84,r*1.3,brake],[l,r*1.3,brake]);else P.push([l,r*.88]);
    P.push([l,r*.5,Bk],[l,0]);rev([x0,y,z],[1,0,0],P,N||12,M);};
  /* рубашка охлаждения: цилиндр с прорезями сверху */
  const jacket=(x0,l,y,z,r,M,Bk)=>{rev([x0,y,z],[1,0,0],[[0,r*.7],[0,r],[l,r],[l,r*.7]],10,M);
    for(let i=0;i<4;i++)bx([x0+l*(.16+i*.22),y,z+r*.96],l*.06,r*.4,.015,0,Bk);};
  /* датчик: коробка с линзой вперёд */
  const sensor=(x,y,z,s,M,gc)=>{bx([x,y,z],s*1.2,s*.9,s*.62,s*.18,M);
    rev([x+s*1.15,y,z+s*.1],[1,0,0],[[0,s*.46],[s*.18,s*.46],[s*.18,s*.3,glo(gc,1.1)],[s*.3,s*.16,glo(gc,1.1)],[s*.33,0,glo(gc,1.1)]],10,M);};
  const bolts=(R,z,n,s,M,ph)=>{for(let i=0;i<n;i++){const a=(i+.5)/n*TAU+(ph||0);bx([Math.cos(a)*R,Math.sin(a)*R,z+s*.5],s*.5,s*.5,s*.5,s*.2,M);}};
  return Object.assign(T,{cr,nz,L,Ln,mt,glo,put,quad,rev,bx,seg,ext,pipe,sph,torus,collar,dish,barrel,jacket,sensor,bolts});
}

/* ── сборка частей в сетку корпуса ── K — инструменты 17c2a (h3dKit), gear — {list:[{slot,kind,mount,size,x,y,p}]},
   deck(x,y) — высота палубы корпуса. Возвращает погоны {slot,x,y,spin} (номер в сетке = индекс+1) и радиус,
   до которого дотягивается повёрнутая турель */
function h3dParts(K,h,gear,deck){
  const T=p3Tools(K),{cr,nz,mt,glo,quad,rev,bx,seg,ext,pipe,sph,torus,dish,bolts}=T,gun=p3Guns(T);
  const at=(x,y,z,s,seat)=>{T.O=[x,y,z];T.S=s;T.seat=seat;};
  /* излучатель поля: плинт, светящийся кристалл, жала с огнями, гало */
  const shield=(t,M,k,by)=>{const gS=glo(P3_SHIELD,.6),gT=glo(P3_SHIELD,1.25),zt=.44*k;
    if(by==="or")bx([0,0,.12*k],1.15*k,1.15*k,.32*k,.12*k,M.S);
    else rev([0,0,-.8],[0,0,1],[[0,1.25*k],[.8+.32*k,1.25*k],[.8+.44*k,1.06*k],[.8+.44*k,0]],by==="co"||by==="hf"?24:8,M.S,Math.PI/8);
    const P=[];for(let i=0;i<=6;i++){const f=i/6*Math.PI/2;P.push([Math.sin(f)*.5*k,Math.cos(f)*.5*k]);}
    rev([0,0,zt],[0,0,1],P,16,gS);
    const n=4+(t>=3?2:0)+(t>=5?2:0);
    for(let i=0;i<n;i++){const a=i/n*TAU+.4,c=Math.cos(a),s=Math.sin(a);
      pipe([[c*1.0*k,s*1.0*k,zt],[c*.94*k,s*.94*k,zt+.5*k],[c*.62*k,s*.62*k,zt+.95*k]],.07*k,M.D,6);
      sph([c*.6*k,s*.6*k,zt+1.0*k],.1*k,gT,8);}
    if(t>=2)torus([0,0,zt+.62*k],[0,0,1],0,.86*k,.05*k,M.T,24,6);
    if(t>=4)torus([0,0,zt+.02*k],[0,0,1],0,1.12*k,.05*k,glo(P3_SHIELD,.45),24,5);
    bolts(1.12*k,zt-.01*k,8,.09*k,M.D,.2);
    if(by==="hf")pipe([[0,0,zt+.4*k],[0,0,zt+1.9*k]],.03*k,M.D,4);
  };
  /* реактор: плинт, обечайка и купол с горящим поясом, на макушке горящая кнопка в тёмном венце;
     теплообменники с жалюзи по бокам; два магистральных короба по палубе к кормовым соплам, в хомутах */
  const core=(t,M,MK,k,by,x,y)=>{const gC=glo(MK.gl,1.2),fc=by==="or"||by==="ra",N=fc?8:28;
    rev([0,0,-.8],[0,0,1],[[0,1.55*k],[.8+.14*k,1.55*k],[.8+.2*k,1.46*k],[.8+.2*k,0]],fc?8:24,M.D,Math.PI/8);
    rev([0,0,.18*k],[0,0,1],[[0,1.24*k],[.3*k,1.24*k],[.42*k,1.18*k],[.62*k,1.0*k],[.74*k,.8*k],[.74*k,.78*k,gC],[.8*k,.6*k],[.8*k,.56*k],[.9*k,.36*k],[.95*k,0]],N,M.S,Math.PI/8);
    rev([0,0,1.04*k],[0,0,1],[[0,.3*k,M.D],[.08*k,.3*k,M.D],[.08*k,.2*k],[.11*k,.1*k],[.12*k,0]],16,gC);
    const nr=t>=3?4:2,a0=nr===2?Math.PI/2:Math.PI/4;
    for(let i=0;i<nr;i++){const a=a0+i/nr*TAU,c=Math.cos(a),s=Math.sin(a),R0=1.62*k,E=[c,s,0],Y=[-s,c,0];
      bx([c*R0,s*R0,.2*k],.4*k,.34*k,.36*k,.07*k,M.D,E,Y);
      for(let j=0;j<4;j++){const r=R0-.27*k+j*.18*k;bx([c*r,s*r,.57*k],.035*k,.28*k,.014*k,0,M.B,E,Y);}}
    if(t>=4)torus([0,0,.08*k],[0,0,1],0,1.56*k,.05*k,M.Br,24,5);
    if(h.yac||!h.eng.length)return;
    /* магистрали только к кормовым соплам: сопло впереди реактора или вплотную — коробов нет */
    const xe=Math.max(...h.eng.map(e=>e.x+e.r*1.7)),x0=x-1.4*k;if(x0-xe<3)return;
    at(0,0,0,1,-9);
    for(const s of [-1,1]){const yy=y+s*.75*k,P=[];
      for(let i=0;i<=10;i++){const px=lerp(x0,xe,i/10);P.push([px,yy,deck(px,yy)+.2*k]);}
      pipe(P,.15*k,M.D,8);
      for(let i=1;i<10;i+=2){const p=P[i];bx([p[0],p[1],p[2]],.09*k,.24*k,.2*k,.04*k,M.S);}
      bx([xe,yy,deck(xe,yy)+.2*k],.26*k,.27*k,.25*k,.06*k,M.D);}
  };
  /* двигательный блок: ошейник на ближнем сопле со светящимся поясом и рёбрами; без сопла — ускоритель на пилоне */
  const engine=(t,M,MK,k,ax,ay)=>{const gE=glo(MK.gl,.95);
    let e0=null,n0=null,ns=1,bd=1e9;
    if(!h.yac)for(const e of h.eng){const d=Math.hypot(e.x+e.r*.5-ax,e.y-ay);if(d<bd){bd=d;e0=e;n0=null;}}
    for(const n of h.nacs)for(const s of [1,-1]){const d=Math.hypot(n.x-ax,n.y*s-ay);if(d<bd){bd=d;n0=n;ns=s;e0=null;}}
    if(e0&&bd<e0.r*3+3){const e=e0,bl=Math.max(3,e.r*2.4),br=e.r*1.05,x0=e.x-bl*.1-e.r*.42;at(0,0,0,1,-br);
      /* горячий пояс — сверху на кромке, не на торце: торец камера сверху не видит */
      rev([x0,e.y,0],[1,0,0],[[0,br*1.06,M.D],[0,br*1.3,gE],[e.r*.12,br*1.33],[e.r*.25,br*1.36],[e.r*.7,br*1.34],[e.r*.95,br*1.2],[e.r*.95,br*1.06]],20,M.S);
      const nf=6+(t>=3?2:0);
      for(let i=0;i<nf;i++){const a=(i+.5)/nf*TAU,c=Math.cos(a),s=Math.sin(a);if(s<-.35)continue;
        bx([x0+e.r*.48,e.y+c*br*1.48,s*br*1.48],e.r*.4,.05*k,br*.16,0,M.D,[1,0,0],[0,s,-c]);}
      if(t>=2)torus([x0,e.y,0],[1,0,0],e.r*.55,br*1.36,.06*k,M.T,20,5);
      const zd=(xx,yy)=>Math.max(deck(xx,yy),br*.9);
      if(t>=3)for(const s of [-1,1]){const a=[x0+e.r*.5,e.y+s*br*.55,br*1.25],b=[x0+e.r*1.6,e.y+s*br*.65,zd(x0+e.r*1.6,e.y+s*br*.65)+.12*k],
        c=[x0+e.r*3,e.y+s*br*.5,zd(x0+e.r*3,e.y+s*br*.5)+.12*k];pipe([a,b,c],.08*k,M.T,6);}
      if(t>=4){const px=x0+e.r*2.3;bx([px,e.y,zd(px,e.y)+.28*k],.5*k,.4*k,.3*k,.06*k,M.D);sph([px+.3*k,e.y,zd(px,e.y)+.6*k],.06*k,gE,6);}
      return;}
    if(n0){const ys=n0.y*ns,r=n0.r;at(0,0,0,1,-r);
      for(const f of [-.12,.16])torus([n0.x+f*n0.l,ys,0],[1,0,0],0,r*1.03,.1*k+r*.06,M.S,20,6);
      torus([n0.x-n0.l/2+.45,ys,0],[1,0,0],0,r*.98,.07*k,gE,20,5);
      for(let i=0;i<3;i++){const a=Math.PI/2+(i-1)*.7,c=Math.cos(a),s=Math.sin(a);
        bx([n0.x-n0.l*.1,ys+c*r*1.05,s*r*1.05],n0.l*.18,.045*k,r*.14,0,M.D,[1,0,0],[0,s,-c]);}
      return;}
    const Tp=p3Top(h,deck,ax,ay);at(ax,ay,Tp.z,ay<-.05?-1:1,Tp.z);
    rev([-1.4*k,0,.55*k],[1,0,0],[[0,.45*k,gE],[0,.62*k],[.4*k,.66*k],[2.0*k,.6*k],[2.6*k,.3*k],[2.7*k,0]],16,M.S);
    bx([0,0,.2*k],.8*k,.18*k,.25*k,.04*k,M.D);
  };
  /* обшивка: плита по палубе (повторяет её изгиб), болты по кромке; с третьего тира — второй слой */
  const plate=(x0,x1,y0,y1,s,th,M,Me)=>{const nx=6,ny=4,Gr=[];
    for(let i=0;i<=nx;i++){const r=[];for(let j=0;j<=ny;j++){const x=lerp(x0,x1,i/nx),y=s*lerp(y0,y1,j/ny);r.push([x,y,deck(x,y)+th]);}Gr.push(r);}
    for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){const a=Gr[i][j],b=Gr[i+1][j],c=Gr[i+1][j+1],d=Gr[i][j+1];
      let n=nz(cr([c[0]-a[0],c[1]-a[1],c[2]-a[2]],[d[0]-b[0],d[1]-b[1],d[2]-b[2]]));if(n[2]<0)n=[-n[0],-n[1],-n[2]];quad(a,b,c,d,n,M);}
    const E=[];for(let i=0;i<=nx;i++)E.push(Gr[i][0]);for(let j=1;j<=ny;j++)E.push(Gr[nx][j]);
    for(let i=nx-1;i>=0;i--)E.push(Gr[i][ny]);for(let j=ny-1;j>=1;j--)E.push(Gr[0][j]);
    const cx=(x0+x1)/2,cy=s*(y0+y1)/2;
    for(let i=0;i<E.length;i++){const a=E[i],b=E[(i+1)%E.length];let n=nz([b[1]-a[1],-(b[0]-a[0]),0]);
      if(n[0]*((a[0]+b[0])/2-cx)+n[1]*((a[1]+b[1])/2-cy)<0)n=[-n[0],-n[1],0];
      quad(a,b,[b[0],b[1],b[2]-th-.12],[a[0],a[1],a[2]-th-.12],n,Me);}
  };
  const armour=(t,M,k,by,ax,ay)=>{at(0,0,0,1,-9);
    const w=profW(h.prof,ax),hl=clamp(h.len*.075,1.8,4.5),mid=Math.abs(ay)<w*.18,s=mid||ay>=0?1:-1;
    /* гнездо на хребте — плита через ось, на борту — от гнезда к кромке */
    const y0=mid?-w*.55:Math.max(w*.06,Math.abs(ay)-w*.3),y1=mid?w*.55:Math.min(Math.abs(ay)+w*.22,w*.95);if(y1-y0<.8)return;
    const ML=by==="ra"?M.P:M.S;
    plate(ax-hl,ax+hl,y0,y1,s,.24,ML,M.D);
    if(t>=3)plate(ax-hl*.55,ax+hl*.45,y0+(y1-y0)*.2,y1-(y1-y0)*.25,s,.46,M.S,M.D);
    const zb=(x,y)=>deck(x,y)+.27;
    for(const f of [.1,.5,.9])for(const g of [.14,.86]){const x=lerp(ax-hl,ax+hl,f),y=s*lerp(y0,y1,g);bx([x,y,zb(x,y)],.09*k,.09*k,.035,.02,by==="km"?M.Br:M.D);}
    if(by==="or")for(const f of [.3,.7]){const x=lerp(ax-hl,ax+hl,f),ym=s*(y0+y1)/2;bx([x,ym,zb(x,ym)+.02],.04,(y1-y0)*.38,.04,0,M.D);}
    if(by==="co"||by==="hf"){const ye=s*(y1-.12);bx([ax,ye,zb(ax,ye)],hl*.8,.025,.012,0,M.W);}
    if(by==="gt"||t>=4){const x=ax+hl-.35;for(let i=0;i<6;i++){const y=s*lerp(y0+.2,y1-.2,i/5);bx([x,y,zb(x,y)],.16,(y1-y0)*.07,.012,0,i%2?M.T:M.B);}}
  };
  /* утилита по своему главному свойству: стеллаж с тарой, локатор, буровое плечо, баки; иначе — блок с жалюзи */
  const util=(g,t,M,k,lead)=>{
    if(lead==="cargoMul"){bx([0,0,.06*k],1.5*k,1.0*k,.08*k,.02*k,M.D);
      const n=2+(t>=3?1:0)+(t>=5?1:0);
      for(let i=0;i<n;i++){const cc=H3D_CARGO[(i+t)%H3D_CARGO.length],x=-1.1*k+(i+.5)*(2.2*k/n);
        bx([x,0,.52*k],1.1*k/n-.06*k,.85*k,.4*k,.06*k,mt(mixc(cc,[0,0,0],.12),.25,.5));
        bx([x,0,.93*k],.05*k,.88*k,.015*k,0,M.D);}
      for(const s of [-1,1])bx([0,s*.98*k,.45*k],1.45*k,.04*k,.06*k,0,M.T);
      return;}
    if(lead==="scanAdd"){bx([0,0,.15*k],.5*k,.5*k,.18*k,.05*k,M.D);
      rev([0,0,.3*k],[0,0,1],[[0,.1*k],[1.0*k,.08*k],[1.0*k,0]],8,M.D);
      sph([.32*k,.3*k,.38*k],.06*k,glo([120,255,140],1.2),6);
      if(T.rigs.length<7){T.rigs.push({slot:g.slot,x:g.x,y:g.y,spin:.03});T.rig=T.rigs.length;}
      bx([0,0,1.32*k],.14*k,1.15*k,.1*k,.03*k,M.S);
      for(let i=0;i<7;i++)bx([.15*k,(i-3)*.32*k,1.32*k],.012*k,.1*k,.07*k,0,M.D);
      bx([-.12*k,0,1.2*k],.2*k,.2*k,.12*k,.04*k,M.D);
      if(t>=3)dish([0,0,1.55*k],nz([.3,0,.95]),.32*k,.1*k,M.S,M.D);
      T.rig=0;return;}
    if(lead==="drillMul"){rev([0,0,-.6],[0,0,1],[[0,.6*k],[.6+.25*k,.6*k],[.6+.3*k,.5*k],[.6+.3*k,0]],12,M.D);
      const a0=[0,0,.4*k],a1=[1.1*k,.15*k,.78*k],a2=[2.2*k,.1*k,.42*k];
      seg(a0,a1,.18*k,.16*k,M.S);seg(a1,a2,.14*k,.13*k,M.S);sph(a1,.2*k,M.D,10);
      rev(a2,nz([1,0,-.25]),[[0,.32*k],[.2*k,.34*k,M.Br],[.32*k,.26*k],[.5*k,.28*k,M.Br],[.62*k,.18*k],[1.0*k,0]],12,M.G);
      pipe([[.1*k,.2*k,.6*k],[1.0*k,.32*k,.95*k],[1.9*k,.26*k,.62*k]],.05*k,M.T,5);
      if(t>=3)bx([-.3*k,-.5*k,.3*k],.35*k,.25*k,.22*k,.05*k,M.S);
      return;}
    if(lead==="fuelAdd"){const n=t>=4?3:2;
      for(let i=0;i<n;i++){const x=(i-(n-1)/2)*1.1*k;bx([x,0,.12*k],.3*k,.5*k,.12*k,.03*k,M.D);
        sph([x,0,.6*k],.55*k,M.S,14);torus([x,0,.6*k],[0,0,1],0,.555*k,.04*k,M.T,16,5);}
      pipe([[-(n-1)/2*1.1*k,0,1.12*k],[(n-1)/2*1.1*k,0,1.12*k]],.06*k,M.D,6);
      return;}
    bx([0,0,.35*k],.9*k,.65*k,.4*k,.08*k,M.S);
    for(let i=0;i<5;i++)bx([-.5*k+i*.25*k,0,.76*k],.06*k,.45*k,.008*k,0,M.B);
    sph([.7*k,.45*k,.78*k],.06*k,glo([120,255,140],1.1),6);
  };
  /* пусковая: бронекороб со скошенными лбом и кормой, сверху соты в рамках — у заряженной красные носы ракет,
     у сухой откинутые крышки и красная лампа (сухость видна без панели, как у 2D-пусковой 05c) */
  const missile=(t,M,k,dry)=>{const c=2+(t>=3?1:0)+(t>=5?1:0),r=2+(t>=4?1:0),p=.66*k,hx=c*p/2+.3*k,hy=r*p/2+.26*k,mW=mt(P3_WAR,.3,.7),zt=.72*k;
    ext([[-hx,-.6*k],[hx,-.6*k],[hx+.3*k,zt-.25*k],[hx,zt],[-hx,zt],[-hx-.2*k,zt-.3*k]],-hy,hy,M.S);
    for(let i=0;i<c;i++)for(let j=0;j<r;j++){const x=(i-(c-1)/2)*p,y=(j-(r-1)/2)*p;
      bx([x,y,zt+.012*k],p*.42,p*.42,.012*k,.006*k,M.D);
      bx([x,y,zt+.026*k],p*.31,p*.31,.004*k,0,M.B);
      if(!dry)rev([x,y,zt-.1*k],[0,0,1],[[0,.2*k],[.12*k,.2*k],[.24*k,.14*k],[.3*k,.06*k],[.32*k,0]],12,mW);
      else bx([x-p*.42-.2*p,y,zt+.348*p],.4*p,.4*p,.02*k,0,M.S,[-.5,0,.87],[0,-1,0]);}
    for(const s of [-1,1])bx([0,s*(hy+.05*k),.25*k],hx*.9,.05*k,.1*k,0,M.D);
    sph([hx-.14*k,hy-.14*k,zt+.06*k],.08*k,dry?glo([255,60,50],1.4):mt([90,40,30],.2,.5),8);
    if(t>=4)bx([-hx+.12*k,0,zt+.01*k],.04*k,hy*.8,.008*k,0,M.T);
  };
  /* пустой подвес: плита с гнездом, полосатый обод и огонёк рода — видно, что сюда что-то ставят */
  const empty=(k,M,kc)=>{rev([0,0,-.8],[0,0,1],[[0,1.0*k],[.8+.12*k,1.0*k],[.8+.2*k,.88*k],[.8+.2*k,0]],8,M.D,Math.PI/8);
    rev([0,0,.2*k],[0,0,1],[[0,.42*k],[.04*k,.42*k],[.04*k,0,M.B]],16,M.D);
    for(let i=0;i<8;i++){const a=i/8*TAU+Math.PI/8;bx([Math.cos(a)*.7*k,Math.sin(a)*.7*k,.215*k],.09*k,.09*k,.012*k,0,i%2?M.T:M.B);}
    sph([.55*k,0,.24*k],.07*k,glo(kc,.5),8);
  };

  /* спонсоны фрегата (03a mark.guns): на краске — площадка за бортом на консоли, тумба и ствол вперёд; в объёме
     их не было, и краска висела призраком на плоскости обвода. Здесь они — часть корпуса в цветах краски:
     консоль и площадка стоят сквозь плоскость краски (накрывают её при любом крене), каземат над казёнником,
     ствол с конусом и дульным блоком — шире нарисованного на запас крена */
  const SP=(h.mark&&h.mark.guns)||[];
  if(SP.length){const Hc=mt(h.col,.3,.6),Hb=mt(mixc(h.body,h.col,.45),.35,.55),Hi=mt(h.iron,.6,.7),Hs=mt(h.steel,.8,.85),
      Hm=mt(mixc(h.steel,[0,0,0],.42),.8,.8),Hk=mt(h.dark,.1,.1),gW=glo(h.lite,.5);
    for(const g of SP)for(const s of [1,-1]){const x=g[0],y=g[1]*s,Lg=g[2],yb=Math.min(h.bw*.5,profW(h.prof,x-1)*.8)*s;
      const rT=.86-.28*(Lg-5.85)/Math.max(.5,Lg-4.7);
      at(0,0,0,1,-1);
      bx([x-1,(y+yb)/2,-.05],1.0,Math.abs(y-yb)/2,.4,.12,Hc);
      bx([x,y,0],4.85,2.55,.55,.3,Hb);
      at(x,y,.55,s,.55);
      /* фальшборт по наружной кромке и лбу, шов настила, подъёмник снарядов и кнехты на свободной корме площадки */
      bx([0,2.38,.12],4.7,.12,.14,.04,Hc);bx([4.62,0,.12],.12,2.3,.14,.04,Hc);
      for(const xx of [-3.4,-1.2])bx([xx,0,.01],.03,2.3,.012,0,Hk);
      bx([-2.4,.75,.3],.85,.7,.3,.1,Hi);bx([-2.4,.75,.61],.55,.42,.012,0,Hk);
      for(const xx of [-4.1,-3.2])rev([xx,1.85,0],[0,0,1],[[0,.2],[.28,.2],[.32,.27],[.38,.27],[.38,0]],8,Hi);
      rev([2.1,0,-.2],[0,0,1],[[0,1.6],[.3,1.6],[.4,1.45],[.4,0]],14,Hc);
      ext([[.1,0],[3.6,0],[4.2,.55],[3.8,1.15],[.5,1.2],[.1,.9]],-1.45,1.45,Hb);
      bx([1.6,.5,1.2],.55,.38,.05,.03,Hi);
      bx([1.0,-.62,1.24],.24,.17,.1,.04,Hi);
      bx([1.24,-.62,1.27],.02,.12,.04,0,gW);
      for(const yy of [-1.42,1.42])bx([2.15,yy,.6],1.6,.04,.08,0,Hi);
      rev([3.4,0,.5],[1,0,0],[[0,0],[0,.98],[1.1,.98],[1.1,.88],[Lg-5.1,rT],[Lg-5.1,.95,Hm],[Lg-3.15,.95,Hm],[Lg-3.15,.5],[Lg-2.7,.5],[Lg-2.7,.28,Hk],[Lg-2.75,0,Hk]],14,Hs);
      for(let i=0;i<3;i++)bx([Lg-1.3+i*.5,0,1.43],.08,.3,.03,0,Hk);}}

  const kh=clamp(.9+h.bw*.07,1,1.8),kH=clamp(.8+h.bw*.12,1,2.6),tops=[];
  /* верх каждой части — точка для маркера ангара (M723): по ней студия ставит метку и выноску */
  for(const g of gear.list){T.zt=0;build(g);tops.push({slot:g.slot,x:g.x,y:g.y,z:T.zt});}
  return {rigs:T.rigs,R:T.Rb,tops};
  function build(g){
    const p=g.p,by=(p&&p.by)||h.by||"gt",MK=P3_MK[by]||P3_MK.gt,t=p?clamp(p.tier|0,1,5):1;
    const M={S:mt(MK.sh,MK.met,.55),D:mt(MK.dk,.55,.7),G:mt(P3_GM,.8,.9),T:mt(MK.tr,.3,.5),B:mt([18,19,21],.1,.12),
      Br:mt(P3_BRASS,.9,.9),Cu:mt(P3_CU,.7,.6),W:glo(MK.gl,.85),P:mt(mixc(MK.sh,[112,108,100],.45),MK.met,.4)};
    const Tp=p3Top(h,deck,g.x,g.y);T.rig=0;at(g.x,g.y,Tp.z,g.y<-.05?-1:1,Tp.z);
    const kb=g.kind==="gun"?P3_K[sizeIdx(g.size)]*kh:kH;
    /* точка в пустоте (вынос за обвод) — пилон к борту */
    if(!Tp.hit&&Math.abs(g.y)>.5){const ye=profW(h.prof,g.x)*.82,d=Math.abs(g.y)-ye;
      if(d>.2)bx([0,-d/2,-.05],.42*kb,d/2+.3,.2,.05,M.D);}
    if(!p){empty(g.kind==="gun"?kb:kH*.8,M,p3KindCol(g.kind));return;}
    if(g.kind==="gun")gun(g,p,t,M,MK,kh);
    else if(g.kind==="shield")shield(t,M,kH,by);
    else if(g.kind==="core")core(t,M,MK,kH,by,g.x,g.y);
    else if(g.kind==="engine")engine(t,M,MK,kH,g.x,g.y);
    else if(g.kind==="hull")armour(t,M,kH,by,g.x,g.y);
    else if(g.kind==="util")util(g,t,M,kH,p.lead);
    else if(g.kind==="missile")missile(t,M,kH,gear.dry);
    T.rig=0;
  }
}

/* ── что висит на корпусе ── свой корабль: настоящая оснастка (ключ — слоты и номера частей, плюс сухая
   пусковая); прочие корпуса — штатный набор по своим слотам, чтобы любой корпус читался вооружённым */
function p3PartOf(p){
  return p&&{seed:p.seed,tier:p.tier,kind:p.kind,by:p.by||"gt",fam:p.fam||null,
    lead:p.aff&&p.aff[0]?p.aff[0].k:null,sz:p.kind==="gun"?sizeIdx(partSize(p)):0};
}
function shipGear3d(){
  const id=G.shipId,f=(G.fit&&G.fit[id])||{},ms=mountsOf(id);
  /* сухость пусковой меняет сетку — только когда пусковая стоит, иначе трюм с ракетами пересобирал бы корпус зря */
  const dry=ms.some(m=>m.kind==="missile"&&f[m.i]!=null)&&(!G.cargo||(G.cargo.missile|0)<=0);
  let k=id+(dry?"|d":"|w");for(const s in f)k+="|"+s+":"+f[s];
  if(P3.gear&&P3.gear.k===k)return P3.gear;
  const list=ms.map(m0=>{const m=mountAt(id,m0.i)||m0;
    return {slot:m0.i,kind:m0.kind,mount:m.mount,size:m.size,x:m.x,y:m.y,p:f[m0.i]!=null?p3PartOf(partById(f[m0.i])):null};});
  return P3.gear={k,sig:"p|"+k,list,dry,drawn:-1,
    yaw:(slot,a)=>{const v=G.aim&&G.aim[slot];return isFinite(v)?angWrap(v-a):0;}};
}
const P3_TURR=["auto","laser","shot","needle","flak","arc","pulse","aimed","heat","siphon"],P3_FIX=["heavy","rail","plasma","cluster","harpoon","drill"];
const P3_UT=["cargoMul","scanAdd","drillMul","fuelAdd"];
function h3dStockGear(id){
  let g=P3.stock.get(id);if(g)return g;
  const h=hullOf(id),S=shipData(id),seed=(S&&S.seed)||h.seed||1,mass=S?(S.hull>=180?2:(S.hull>=120?1:0)):1;
  const list=mountsOf(id).map(m=>{const r=hashi(seed,m.i,0x7A1)>>>0,F=m.mount==="fix"?P3_FIX:P3_TURR;
    return {slot:m.i,kind:m.kind,mount:m.mount,size:m.size,x:m.x,y:m.y,
      p:{seed:r,tier:1+mass+((r>>>8)&1),kind:m.kind,by:h.by||"gt",fam:m.kind==="gun"?F[r%F.length]:null,
        lead:m.kind==="util"?P3_UT[(r>>>4)%P3_UT.length]:null,sz:sizeIdx(m.size)}};});
  g={k:"s|"+id,sig:"s|"+id,list,dry:false,drawn:-1,yaw:null};
  P3.stock.set(id,g);return g;
}
