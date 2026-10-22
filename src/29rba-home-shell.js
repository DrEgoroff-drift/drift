/* ══════════════ дом снаружи: тело людской грамматики и двор (M850b, стенд M602 — docs/look/nt-home.js) ══════════════
   Разрез остаётся разрезом, но то, что вокруг комнат, — тело со стенда: кремовые панели со швами, оранжевый пояс,
   серый свод крыши (передняя половина снята — видно разрез арки в торцах), дом на ногах над землёй с полозьями.
   Двор — три плана (DESIGN-planet §3.6): тёмная кулиса кочек перед срезом, двор с забором и мачтой, дальний план
   окна. Фонарь крыльца у двери во двор — ключ двора ночью. Логика дома не трогается: только тела. */
const HOME3_GY=-.72;
function K3n(v){const l=Math.hypot(v[0],v[1],v[2])||1;return [v[0]/l,v[1]/l,v[2]/l];}   /* земля двора: дом стоит на ногах, пол — 0 */
const HOME3_C={panel:[221,214,194],panelB:[205,198,176],seam:[85,83,76],belt:[232,112,42],roof:[143,149,158],roofB:[100,106,115],
  leg:[75,78,84],timber:[110,84,58],grass:[92,108,62],grassB:[70,88,56],stone:[96,98,102]};
/* арка свода: от (−hw, y0) через конёк (0, y0+rise) к (hw, y0) — точки [z, y] вокруг середины zc (как ntArc) */
function home3Arc(zc,hw,y0,rise,n){const R=(hw*hw+rise*rise)/(2*rise),cy=y0+rise-R,f=Math.atan2(hw,R-rise),out=[];
  for(let k=0;k<=n;k++){const a=-f+2*f*k/n;out.push([zc+R*Math.sin(a),cy+R*Math.cos(a),a]);}return {pts:out,R,cy};}
/* свод над x0…x1: задняя половина — серая кровля снаружи, кремовая подшивка внутри с рёбрами; торцы — сечение арки */
function home3Vault(K,x0,x1,y0,gables){
  const B=HOME3_B,F=HOME3_F,zc=(B+F)/2,hw=(F-B)/2+.12,rise=.78,n=12,A=home3Arc(zc,hw,y0,rise,n),P=A.pts,th=.07;
  const Mo=K.mt(HOME3_C.roof,.35,8,R3P.brushed),Mi=K.mt(HOME3_C.panel,.15,4,0),Mr=K.mt(HOME3_C.roofB,.3,7,R3P.brushed);
  const Mg=K.mt(HOME3_C.panelB,.12,4,0),Ms=K.mt(HOME3_C.seam,.2,4,0);
  const inner=p=>[p[0]-Math.sin(p[2])*th,p[1]-Math.cos(p[2])*th];
  const half=n/2;   /* задняя половина: от задней стены до конька */
  for(let k=0;k<half;k++){const a=P[k],b=P[k+1],ia=inner(a),ib=inner(b),nm=[0,Math.cos((a[2]+b[2])/2),Math.sin((a[2]+b[2])/2)];
    K.quad([x0,a[1],a[0]],[x0,b[1],b[0]],[x1,b[1],b[0]],[x1,a[1],a[0]],Mo,nm);
    K.quad([x1,ia[1],ia[0]],[x1,ib[1],ib[0]],[x0,ib[1],ib[0]],[x0,ia[1],ia[0]],Mi,[0,-nm[1],-nm[2]]);}
  /* рёбра подшивки и швы кровли — поперёк, через 1.25 м: панели читаются панелями */
  const ribs=Math.max(1,Math.round((x1-x0)/1.25));
  for(let j=1;j<ribs;j++){const x=x0+(x1-x0)*j/ribs;
    K.tube(P.slice(0,half+1).map(p=>{const q=inner(p);return [x,q[1]-.012,q[0]-.0];}),.022,Ms,5);}
  /* кромка свода по срезу у конька — тёмный торец кровли, видно, что половина снята */
  const cz=P[half];K.box([(x0+x1)/2,cz[1]-th/2,cz[0]],[(x1-x0)/2,th/2+.01,.03],Mr,.005);
  /* торцы: сечение арки над стеной — фронтон из панели и серый обвод кровли */
  for(const g of gables||[]){const x=g[0],s=g[1];
    for(let k=0;k<n;k++){const a=P[k],b=P[k+1];
      K.quad([x,y0,a[0]],[x,y0,b[0]],[x,b[1],b[0]],[x,a[1],a[0]],Mg,[s,0,0]);
      K.quad([x-s*.2,y0,b[0]],[x-s*.2,y0,a[0]],[x-s*.2,a[1],a[0]],[x-s*.2,b[1],b[0]],Mg,[-s,0,0]);}
    K.tube(P.map(p=>[x-s*.1,p[1]+.02,p[0]]),.075,Mr,6);}
}
/* наружная обшивка торца x (s=+1 — левый, смотрит в −x наружу): панели со швами, пояс; дверь — проём */
function home3Skin(K,x,s,y0,h,door){
  const B=HOME3_B,F=HOME3_F,o=x-s*.205,Mp=K.mt(HOME3_C.panel,.15,4,0),Ms=K.mt(HOME3_C.seam,.2,4,0),Mb=K.mt(HOME3_C.belt,.3,7,0);
  const pieces=door?[[B-.02,-.3,0,h],[.8,F+.02,0,h],[-.3,.8,2.1,h]]:[[B-.02,F+.02,0,h]];
  for(const p of pieces)K.box([o,y0+(p[2]+p[3])/2,(p[0]+p[1])/2],[.012,(p[3]-p[2])/2,(p[1]-p[0])/2],Mp,.004);
  for(let z=B+1.2;z<F-.1;z+=1.2){if(door&&z>-.32&&z<.82){K.box([o-s*.014,y0+(2.1+h)/2,z],[.006,(h-2.1)/2,.012],Ms,0);continue;}
    K.box([o-s*.014,y0+h/2,z],[.006,h/2,.012],Ms,0);}
  const belt=[[B-.02,door?-.3:F+.02],door?[.8,F+.02]:null].filter(Boolean);
  for(const b of belt)K.box([o-s*.02,y0+.98,(b[0]+b[1])/2],[.012,.07,(b[1]-b[0])/2],Mb,.004);
}
/* ноги, полозья, плита со срезом и поясом, ступени крыльца */
function home3Under(K,X1){
  const B=HOME3_B,F=HOME3_F,GY=HOME3_GY,Ml=K.mt(HOME3_C.leg,.45,9,R3P.brushed),Mp=K.mt(HOME3_C.panel,.15,4,0);
  const Mb=K.mt(HOME3_C.belt,.3,7,0),Md=K.mt([40,42,46],.3,5,0);
  /* плита: передний срез кремовый с оранжевым поясом — по поясу видно, что это тело, а не ящик */
  /* верх плиты на 2 см ниже пола: в одной плоскости с полом крем и доска дрались полосами */
  K.box([X1/2,-.17,(B+F)/2],[X1/2+.25,.15,(F-B)/2+.04],Mp,.012);
  K.box([X1/2,-.13,F+.05],[X1/2+.25,.055,.012],Mb,.004);
  K.box([X1/2,-.33,(B+F)/2],[X1/2+.18,.02,(F-B)/2-.05],Md,0);
  for(const z of [B+.35,F-.35]){
    for(let x=.5;x<X1;x+=Math.max(1.5,(X1-1)/Math.max(1,Math.round((X1-1)/1.8)))){K.box([x,(GY+-.34)/2,z],[.07,(-.34-GY)/2,.07],Ml,.015);}
    K.box([X1-.5,(GY+-.34)/2,z],[.07,(-.34-GY)/2,.07],Ml,.015);
    K.box([X1/2,GY+.08,z],[X1/2+.6,.08,.11],Ml,.03);   /* полоз */
    for(const s of [-1,1]){K.push([X1/2+s*(X1/2+.75),GY+.2,z],0,0,s*.5);K.box([0,0,0],[.25,.06,.11],Ml,.02);K.pop();}}
  /* крыльцо у двери во двор: площадка и три ступени вниз */
  K.box([-.75,-.08,.25],[.55,.08,.75],K.mt(HOME3_C.timber,.3,7,R3P.wood),.01);
  for(let i=0;i<3;i++)K.box([-1.42-i*.24,-.08-(i+1)*.2,.25],[.12,.04,.7],K.mt(HOME3_C.timber,.3,7,R3P.wood),.01);
  for(const z of [-.48,.98])K.box([-.75,(GY-.16)/2,z],[.05,(-.16-GY)/2,.05],Ml,.01);
}
/* двор: кочки и камни кулисы, забор с двумя проволоками, мачта с маяком, фонарь крыльца */
function home3Yard(K,X1,seed){
  const B=HOME3_B,F=HOME3_F,GY=HOME3_GY,R=(i)=>((hashi(i,seed|0,0x5a17)>>>0)%10000)/10000;
  const Mg=K.mt(HOME3_C.grass,.08,3,R3P.plant),Mg2=K.mt(HOME3_C.grassB,.08,3,R3P.plant),Ms=K.mt(HOME3_C.stone,.15,4,0);
  const Mt=K.mt(HOME3_C.timber,.25,6,R3P.wood),Mw=K.mt([60,62,66],.6,12,R3P.brushed),Ml=K.mt(HOME3_C.leg,.45,9,R3P.brushed);
  /* земля: передняя полоса — трава кулисы, двор вокруг — та же, по бокам светлее (вытоптано к крыльцу) */
  K.quad([-40,GY,F+.04],[X1+40,GY,F+.04],[X1+40,GY,F+18],[-40,GY,F+18],K.mt(HOME3_C.grassB,.04,2,0,0,true),[0,1,0]);
  K.quad([-40,GY,B-9],[-.25,GY,B-9],[-.25,GY,F+.04],[-40,GY,F+.04],K.mt(HOME3_C.grass,.04,2,0,0,true),[0,1,0]);
  K.quad([X1+.25,GY,B-9],[X1+40,GY,B-9],[X1+40,GY,F+.04],[X1+.25,GY,F+.04],K.mt(HOME3_C.grass,.04,2,0,0,true),[0,1,0]);
  K.quad([-.25,GY,B-9],[X1+.25,GY,B-9],[X1+.25,GY,B-.02],[-.25,GY,B-.02],K.mt(HOME3_C.grass,.04,2,0,0,true),[0,1,0]);
  /* тропа от крыльца влево — земля, не трава */
  K.quad([-6,GY+.006,-.4],[-1.4,GY+.006,-.3],[-1.4,GY+.006,.9],[-6,GY+.006,1.3],K.mt([92,74,56],.05,2,0,0,true),[0,1,0]);
  /* кулиса: кочки в передней полосе — низкие (ниже пола), тёмные, кучками; по краям кадра выше */
  for(let i=0;i<70;i++){const x=-6+R(i)*(X1+12),z=F+.35+Math.pow(R(i+100),1.6)*2.3,edge=Math.min(1,Math.abs(x-X1/2)/(X1/2+3));
    /* СР · Визуал 22.10: кочка — лепёшка, не шар: вдвое шире высоты, по z короче, низко врыта в землю */
    const h=.07+.1*R(i+200)+.14*edge*edge,w=.3+.4*R(i+300);
    K.ell([x,GY+h*.3,z],[w,h,w*.7],R(i+400)<.5?Mg:Mg2,6,5);
    if(R(i+500)<.5)K.ell([x+w*.8,GY+h*.2,z+.12],[w*.7,h*.6,w*.5],Mg2,5,4);}
  for(let i=0;i<9;i++){const x=-5+R(i+900)*(X1+10),z=F+.6+R(i+950)*1.8,s=.15+.22*R(i+990);
    K.ell([x,GY+s*.35,z],[s*1.3,s*.7,s],Ms,5,6);}
  /* кочки у стен дома и под полом — дом стоит в траве, а не на столе */
  for(let i=0;i<26;i++){const side=R(i+1200)<.5,x=side?-.6-R(i+1300)*4.5:X1+.6+R(i+1300)*4.5,z=B-5+R(i+1400)*(F-B+5);
    const h=.08+.14*R(i+1500);K.ell([x,GY+h*.3,z],[.42,h,.32],R(i+1600)<.5?Mg:Mg2,6,4);}
  /* забор: столбы 1.1 м через 2.5 м, две проволоки; позади и по бокам, спереди открыт */
  const XL=-7,XR=X1+7,ZB=B-5.5,ZF=F+2.2,posts=[];
  for(let x=XL;x<=XR+.01;x+=2.5)posts.push([x,ZB]);
  for(let z=ZB+2.5;z<=ZF;z+=2.5){posts.push([XL,z]);posts.push([XR,z]);}
  for(const p of posts)K.box([p[0],GY+.55,p[1]],[.045,.55,.045],Mt,.01);
  for(const y of [.45,.92]){K.tube([[XL,GY+y,ZF],[XL,GY+y,ZB],[XR,GY+y,ZB],[XR,GY+y,ZF]],.007,Mw,4);}
  /* мачта: решётка 9 м, полосы белая/ржавь, огонь на верху — свой свет, не мигает */
  const mx=X1+3.2,mz=B-2.6,Hm=9;
  for(let a=0;a<3;a++){const t=a/3*TAU+.4;K.tube([[mx+Math.cos(t)*.32,GY,mz+Math.sin(t)*.32],[mx+Math.cos(t)*.08,GY+Hm,mz+Math.sin(t)*.08]],.022,Ml,5);}
  for(let j=0;j<6;j++){const y=GY+.8+j*1.4,r=.3-.24*(j*1.4+.8)/Hm;
    K.push([mx,0,mz]);K.lathe([[y,r+.03],[y+.5,r+.025]],10,K.mt(j%2?[200,196,186]:[170,74,40],.3,6,0));K.pop();}
  K.ell([mx,GY+Hm+.12,mz],[.12,.12,.12],K.mt([255,90,50],.2,8,0,3.2,true),8,10);
  /* фонарь крыльца: столб 2.6 м у ступеней, тёплый колпак */
  const lx=-2.4,lz=1.15;HOME3.lantern=[lx+.28,GY+2.42,lz];
  K.tube([[lx,GY,lz],[lx,GY+2.6,lz]],.04,Ml,6);K.box([lx+.16,GY+2.58,lz],[.18,.02,.02],Ml,.005);
  K.push([lx+.28,0,lz]);K.lathe([[GY+2.36,.11],[GY+2.5,.06],[GY+2.53,0]],10,Ml);K.pop();
  K.ell([lx+.28,GY+2.4,lz],[.07,.08,.07],K.mt([255,206,140],.2,8,0,4,true),8,10);
}
