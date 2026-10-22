/* ══════════════ бар собран (M853) ══════════════ */
/* Сидящие у стойки кладут руки НА столешницу, а не в воздух перед ней; рука не входит в стойку;
   поз у сидящих четыре и больше; руки новых поз той же длины, что у прежних; лампа героя
   держит лицо ярче торса (день и ночь); у бара один герой — завсегдатаи за столиками и за его
   спиной тише его лица. Свет — зеркало шейдера 27f2 (затухание, конус, нормаль, рассеянный)
   без теней: числа сцены, не растр. Настоящий G, видеокарта не нужна. */
TEST_SUITES.push(()=>suite("бар собран",()=>{
  resetWorld();
  const X=(P,v)=>{const c=Math.cos(P.yaw),s=Math.sin(P.yaw);return [P.x+c*v[0]+s*v[2],v[1],P.z-s*v[0]+c*v[2]];};
  const N=(P,v)=>{const c=Math.cos(P.yaw),s=Math.sin(P.yaw);return [c*v[0]+s*v[2],v[1],-s*v[0]+c*v[2]];};
  /* столешница бара (27f4 c3Counter): верх C3_TOP, от задней кромки -.66 до передней +.04, плита толщиной .08; тело стойки до -.04 */
  const TOP=C3_TOP,Z0=-.66,Z1=.04,X0=HALL_XB+C3_CL,X1=HALL_XB+C3_CR,RW=.035;
  const wrist=(w,hold)=>{
    if(hold)return "кружка";
    const onX=w[0]>X0&&w[0]<X1,gap=w[1]-RW-TOP;
    if(onX&&w[2]>Z0&&w[2]<Z1&&gap>=-.005&&gap<=.02)return "на стойке";
    /* тело стойки — до -.04, плита столешницы (1.0…TOP) — до +.04: под свесом плиты колено и кисть свободны */
    if(onX&&((w[2]-RW<-.04&&w[1]-RW<TOP)||(w[2]-RW<Z1&&w[1]+RW>1.0&&w[1]-RW<TOP-.005)))return "в стойке";
    if(onX&&w[2]>=Z1&&w[2]<Z1+.3&&w[1]>TOP-.08&&w[1]<TOP+.15)return "в воздухе перед стойкой";
    return "у себя";};
  /* все места у стойки, оба поворота и все позы табурета — у кого рука висит или в стойке */
  const L=hallLayout("trade"),poses=new Set(["stool0","stool1","stool2","stool3"].map(p=>HALL_BAR_POSE[p]||p));
  let onTop=0;
  for(const ps of poses)for(const x of L.seats)for(const sg of [-1,1]){
    const P={x:HALL_XB+x,z:.36,yaw:Math.PI+sg*(/^bar/.test(ps)?.25:.5)},J=cpPose(ps);
    for(let k=0;k<2;k++){const w=X(P,J.wr[k]),v=wrist(w,J.hold===(k?-1:1));
      ok(v!=="в воздухе перед стойкой"&&v!=="в стойке","поза «"+ps+"», место "+x.toFixed(2)+", "+(k?"правая":"левая")+": "+v+" ("+w.map(q=>q.toFixed(2)).join(", ")+")");
      if(v==="на стойке")onTop++;}}
  ok(onTop>=8,"руки на столешнице есть у поз бара: "+onTop);
  /* настоящая раскладка: у сидящих лицом к стойке нет прежних поз с руками в воздухе */
  for(const P of L.people)if(P.kind==="cand")ok(P.pose!=="stool1"&&P.pose!=="stool2","у стойки поза «"+P.pose+"», не stool1/stool2");
  /* поз у сидящих: табурет (кружка), руки на стойке, рука и кружка, стул прямо, стул откинувшись */
  const seated=new Set([...poses,"table","chair"]);
  ok(seated.size>=4,"сидячих поз в баре "+seated.size+" ≥ 4");
  {const sp=new Set();for(let s=1;s<40;s++)sp.add(hallTablePose(s*7919,0));ok(sp.has("chair")&&sp.has("table"),"за столиком и прямо, и откинувшись");}
  /* руки новых поз: плечо (27f3: таз + наклон · [.205·wB-.02, .458·TL, -.005]) → локоть → запястье — в полосе прежних поз */
  {const g=cpGene({seed:12345}),wB=.86+(g.build-.7)*.36,TL=g.hs;
    const len=(J,k)=>{const s=k?-1:1,c=Math.cos(J.lean),sn=Math.sin(J.lean),p=[s*(.205*wB-.02),.458*TL,-.005],
      S=[p[0],J.pel+p[1]*c-p[2]*sn,p[1]*sn+p[2]*c],E=J.elb[k],W=J.wr[k];
      return [Math.hypot(E[0]-S[0],E[1]-S[1],E[2]-S[2]),Math.hypot(W[0]-E[0],W[1]-E[1],W[2]-E[2])];};
    let u0=9,u1=0,f0=9,f1=0;for(const p of ["stand","bar","elbow","stool0","stool2","table"])for(let k=0;k<2;k++){const [u,f]=len(cpPose(p),k);u0=Math.min(u0,u);u1=Math.max(u1,u);f0=Math.min(f0,f);f1=Math.max(f1,f);}
    for(const p of ["barc","barm"])for(let k=0;k<2;k++){const [u,f]=len(cpPose(p),k);
      ok(u>u0*.92&&u<u1*1.08,"«"+p+"» плечо "+u.toFixed(3)+" в полосе прежних "+u0.toFixed(3)+"–"+u1.toFixed(3));
      ok(f>f0*.92&&f<f1*1.08,"«"+p+"» предплечье "+f.toFixed(3)+" в полосе прежних "+f0.toFixed(3)+"–"+f1.toFixed(3));}}
  /* свет: зеркало 27f2 (att = clamp(1-d⁴/r⁴)/(d²+.2), конус smoothstep(cosO,cosI), max(n·l,0); рассеянный sky/gnd) */
  const lum=c=>.3*c[0]+.59*c[1]+.11*c[2];
  const lit=(S,p,n)=>{let e=0;for(const l of S.lights){const v=[l.p[0]-p[0],l.p[1]-p[1],l.p[2]-p[2]],d2=v[0]*v[0]+v[1]*v[1]+v[2]*v[2],d=Math.sqrt(d2),u=v.map(q=>q/d);
      let a=clamp(1-d2*d2/Math.pow(l.range,4),0,1)/(d2+.2);
      if(l.spot){const c=-(u[0]*l.d[0]+u[1]*l.d[1]+u[2]*l.d[2]),t=clamp((c-l.cosO)/(l.cosI-l.cosO),0,1);a*=t*t*(3-2*t);}
      e+=lum(l.c)*a*Math.max(0,n[0]*u[0]+n[1]*u[1]+n[2]*u[2]);}
    const h=n[1]*.5+.5;return e+S.sky[3]*lum([0,1,2].map(i=>S.gnd[i]+(S.sky[i]-S.gnd[i])*h));};
  const keep={place:HALL.place,night:HALL.night};
  try{
    L.room=hallRoomMesh(L);HALL.place="folk";
    const H=HALL_PILOT_AT.folk,hero={x:H[0],z:H[1],yaw:H[2]};
    for(const nt of [0,1]){HALL.night=nt;const tag=nt?"ночью":"днём";
      const S=hallScene(L,hallCam(HALL_CAMS.folk||HALL_CAMS.trade,1280,720,true),1.5);
      const face=lit(S,X(hero,[0,1.47,.1]),N(hero,[0,.15,.99])),torso=lit(S,X(hero,[0,1.12,.13]),N(hero,[0,0,1]));
      ok(face>=1.3*torso,tag+": лицо героя ярче торса в "+(face/torso).toFixed(2)+" ≥ 1.3");
      /* у бара один герой: лица за столиками (передний план) и за его спиной (зал за стойкой) тише его лица */
      for(const P of L.people){if(P.kind==="keep"||P.x<HALL_XB-3)continue;const fn=N(P,[0,0,1]);
        if(P.kind==="cand")continue;
        const f=lit(S,X(P,[0,/table|chair/.test(P.pose)?1.15:1.55,.1]),fn);
        ok(face>=1.5*f,tag+": «"+P.pose+"» ("+P.x.toFixed(1)+", "+P.z.toFixed(1)+") тише героя: "+(f/face).toFixed(2)+" ≤ 0.67");}
      ok(S.fog[3]>0,tag+": дымка зала есть — дальнее уходит в неё ("+S.fog[3].toFixed(3)+")");}
  }finally{HALL.place=keep.place;HALL.night=keep.night;}
}));
