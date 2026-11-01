/* Импортированные персонажи не должны отдать кадру NaN, потерять сустав
   или выкинуть рабочий инструмент при смене внешности игрока. */
suite("персонажи: импорт, позы и оснащение",()=>{
  resetWorld();
  const oldK=Object.assign({},PLN_MAN.k);
  for(let id=1;id<=100;id++){
    const q=npcArtRead(id);
    eq(q.b.length,13,"житель "+id+": суставы");
    ok(q.ix.every(i=>i<q.n),"житель "+id+": индексы");
    ok(q.p.every(Number.isFinite),"житель "+id+": координаты");
    let normals=true;for(let k=0;k<q.no.length;k+=3)if(Math.hypot(q.no[k],q.no[k+1],q.no[k+2])<.8)normals=false;
    ok(normals,"житель "+id+": нормали не нулевые");
    let lo=1e9,hi=-1e9;for(let k=1;k<q.p.length;k+=3){lo=Math.min(lo,q.p[k]);hi=Math.max(hi,q.p[k]);}
    ok(hi-lo>.15&&hi-lo<.8,"житель "+id+": голова целая, тело строится игровым ригом");
    let good=true;for(let i=0;i<q.n;i++){let sum=0;for(let k=0;k<4;k++)sum+=q.w[i*4+k];if(Math.abs(sum-1)>.005)good=false;}
    ok(good,"житель "+id+": веса нормализованы");
  }
  for(const id of [1,2,50,100])for(const pose of ["stand","chair","frame","walk0"]){
    const m=cpBody({npc:id,seed:id,role:"",loy:50,traits:[]},0,pose);
    ok(m.n>1000&&m.v.every(Number.isFinite),"житель "+id+": "+pose);
    ok(m.at.head[1]>m.at.neck[1]&&m.at.neck[1]>m.at.pel[1],"голова над тазом: "+pose);
  }
  const P=plnManPalette(),m=mechManBuild(P,false),bare=mechManBuild(P,false,{dress:"bare"});
  ok(m.parts.some(q=>q.dyn==="tool"),"бур сохранён");
  ok(m.parts.some(q=>q.dyn==="flame"),"факел сохранён");
  ok(m.parts.some(q=>q.bone===2)&&m.parts.some(q=>q.bone===10),"шлем и перчатки на риге");
  ok(!bare.parts.some(q=>q.dyn==="flame"),"в жилом отсеке нет факела");
  const Q=mechManData();
  for(const key of ["air","jet","fall","drill","sit"]){
    const st=plnManState(null,0,0);st.on=key!=="air"&&key!=="fall";st.jet=key==="jet";st.drill=key==="drill";st.sit=key==="sit";
    const W=plnManPose(st);for(const q of m.parts)if(q.dyn==="mechskin")mechManSkin(q.m.v,0,q,W);
    ok(m.parts.every(q=>q.m.v.every(Number.isFinite)),"механик: "+key);
  }
  ok(Q.n<20000,"сетка механика укладывается в бюджет");
  const bird=govorunMesh();
  let birdNormals=true;
  for(let k=0;k<bird.v.length;k+=12)if(Math.hypot(bird.v[k+3],bird.v[k+4],bird.v[k+5])<.8)birdNormals=false;
  ok(birdNormals,"Говорун: нормали лап не дают NaN в освещении");
  ok(bird.v.every(Number.isFinite),"Говорун: конечные координаты");
  ok(bird.n<1000000,"Говорун: бюджет сетки");
  eq(bird.source,"bird/","Говорун: геометрия существующей 3D-птицы сайта");
  ok(bird.feathers>1000,"Говорун: отдельные перья сохранены");
  const scene=govorunScene(1);
  ok(scene.M.every(Number.isFinite),"Говорун: матрицы живой позы");
  let eyes=0;for(let i=11;i<bird.v.length;i+=12)if((Math.round(bird.v[i])>>4&63)===R3P.birdEye)eyes++;
  ok(eyes>0,"Говорун: глаза не потерялись при переносе");
  const oldPAR={flap:PAR.flap,fan:PAR.fan,hang:PAR.hang,crest:PAR.crest};
  for(const aspect of [.55,1,2]){
    PAR.flap=.9;PAR.fan=.8;PAR.crest=1;
    const S=govorunScene(aspect);let outside=0;
    for(let i=0;i<bird.n;i+=137){const a=i*12,f=Math.round(bird.v[a+11]),b=(f&15)*16,c=(f>>11&15)*16,w=(f>>15&255)/255;
      const p=Array.from(bird.v.subarray(a,a+3)),v=r3Pt(S.M.subarray(b,b+16),p),v2=r3Pt(S.M.subarray(c,c+16),p);
      const pt=v.map((x,k)=>x*(1-w)+v2[k]*w),screen=r3Proj(S.vp,pt,1,1);
      if(!screen||screen[0]<-.02||screen[0]>1.02||screen[1]<-.02||screen[1]>1.02)outside++;
    }
    eq(outside,0,"Говорун: крылья и хвост помещаются, окно "+aspect);
  }
  Object.assign(PAR,oldPAR);
  let sole=1e9;for(let k=1;k<Q.p.length;k+=3)sole=Math.min(sole,Q.p[k]);
  ok(sole>-.04,"механик: подошва у поверхности, не под грунтом");
  Object.assign(PLN_MAN.k,oldK);
});
