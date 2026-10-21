/* ══ база в разрезе (M632a, 21ae) ══
   Вход начинается с окна хода по грунту; дальний объектив держит все ярусы, ствол и ворота; ближний ставит
   комнату человека посередине; доля человека в кадре не мельче ворот (1920: дальний ≥ .05, ближний ≥ .12;
   телефон 390×844 — только ближний, ≥ .05). Ход по ярусу — только в просветах, сквозь комнату не идёт.
   Без энергии отсек не светит сам: запечённый свет стен и лампы подвесов гаснут, остаётся налобник. */
function sectBaseFix(rows){
  resetWorld();
  const p=G.sys.planets.find(x=>x.type!=="gas")||G.sys.planets[0],R=rows||BASE_ROWS,cells=[];
  for(let i=0;i<BASE_COLS*R;i++)cells.push(null);
  const put=(c,r,k,hp)=>{if(r<R)cells[r*BASE_COLS+c]={k,hp:hp==null?1:hp};};
  put(0,0,"solar");put(1,0,"habitat");put(2,0,"reactor");put(4,0,"solar");
  put(0,1,"lab");put(2,1,"refinery");put(4,1,"med");
  put(1,2,"battery");put(2,2,"garden",0);
  put(3,3,"habitat");if(R>4)put(1,4,"vat");
  return {p,B:{cells,rows:R,pool:{}}};
}
function sectWith(w,h,fn){
  const W0=W,H0=H;
  try{W=w;H=h;return fn();}finally{W=W0;H=H0;}
}
function sectLensAt(w,h,S,B,first,farPin){
  return sectWith(w,h,()=>{
    const f0=SECT.farPin;SECT.farPin=farPin==null?null:farPin;
    try{
      const M=SECT_M,mx=sectX(S.x),my=sectY(S.y)-M.ch/2;
      if(first)SECT.b=null;
      return sectLensStep(S,B,w/h,mx,my,1e6,first?0:.016,first);
    }finally{SECT.farPin=f0;}
  });
}

TEST_SUITES.push(()=>suite("база в разрезе: объективы, доля человека, ход по просветам, без энергии темно (M632a)",()=>{
  const b0=SECT.b,l0=SECT.lens,cam0=PLN.cam;
  try{
    const {B}=sectBaseFix(4),M=SECT_M;
    const S={B,cur:1,row:0,x:cellX(1),y:cellY(0),menu:false,pmenu:false,walkPhase:0};

    /* вход: первый кадр — окно хода по грунту, человек на своём месте */
    PLN.cam=Object.assign({},PLN.cam||{},{hs:PLN_M*14});
    let L=sectLensAt(1920,1080,S,B,true);
    near(L.Hf,14,.01,"первый кадр — высота окна хода по грунту");
    near(L.cx,sectX(S.x),.01,"первый кадр — человек по центру, как на грунте");

    /* дальний: все ярусы, ствол, ворота; полоса неба сверху */
    L=sectLensAt(1920,1080,S,B,false,1);
    ok(L.l<=-14.3&&L.r>=4*M.cw+M.cw-.5,"дальний держит ворота и крайний отсек: "+L.l.toFixed(1)+".."+L.r.toFixed(1));
    ok(L.b<=sectFloor(baseRows(B)-1)&&L.t>=M.surf+1,"дальний держит дно базы и копёр: "+L.b.toFixed(1)+".."+L.t.toFixed(1));
    ok(sectShare(L)>=.05,"дальний на 1920: человек ≥ .05 кадра ("+sectShare(L).toFixed(3)+")");
    const L5=sectLensAt(1920,1080,S,sectBaseFix(5).B,false,1);
    ok(L5.b<=sectFloor(4),"пятый ярус тоже в дальнем");

    /* ближний: комната человека посередине */
    S.cur=3;S.row=3;S.x=cellX(3);S.y=cellY(3);
    L=sectLensAt(1920,1080,S,B,false,0);
    near(L.cx,sectRoomX(3),.01,"ближний — по центру комнаты человека");
    ok(L.b<sectFloor(3)&&L.t>sectFloor(3)+M.room,"ближний держит комнату от пола до потолка");
    ok(sectShare(L)>=.12,"ближний на 1920: человек ≥ .12 кадра ("+sectShare(L).toFixed(3)+")");

    /* телефон: только ближний, даже когда дальний был бы на ПК (меню) */
    S.menu=true;
    L=sectLensAt(390,844,S,B,true);
    L=sectWith(390,844,()=>{SECT.ent=0;SECT.far=0;return sectLensAt(390,844,S,B,false);});
    ok(SECT.far===0,"на телефоне дальнего нет");
    ok(sectShare(L)>=.05,"телефон 390×844: человек ≥ .05 кадра ("+sectShare(L).toFixed(3)+")");
    S.menu=false;

    /* ход по ярусу — только в просветах между отсеками */
    const V=sectVoids(B),rooms=V.filter(v=>v[4]==="room"),halls=V.filter(v=>v[4]==="hall");
    eq(rooms.length,B.cells.filter(Boolean).length,"у каждого отсека — своя пустота");
    let cross=0;
    for(const h of halls)for(const r of rooms)if(h[2]===r[2]&&Math.min(h[1],r[1])-Math.max(h[0],r[0])>1e-6)cross++;
    eq(cross,0,"ход не идёт сквозь комнату");
    ok(V.some(v=>v[4]==="shaft"&&v[3]>=M.surf),"ствол выходит на поверхность");

    /* поза: сидеть есть, таз опускается */
    ok(Array.isArray(PLN_MAN_POSE.sit)&&PLN_MAN_POSE.sit.length===PLN_MAN_POSE.air.length,"у человека есть поза «сидеть»");
    ok(PLN_MAN_SIT>.3&&PLN_MAN_SIT<.6,"таз садится на сиденье ("+PLN_MAN_SIT+")");

    /* без энергии: стены не светят, подвесы погасли */
    const glowOf=(m,mat)=>{let n=0,g=0;for(let i=0;i<m.nv;i++){const o=i*PLN_VS;if(m.v[o+9]===mat&&m.v[o+1]<0){n++;g=Math.max(g,m.v[o+11]);}}return {n,g};};
    const on=sectBuild(B,1),off=sectBuild(B,0);
    ok(glowOf(on,SECT_MAT_WALL).g>.2,"с энергией стены отсеков светят");
    const wo=glowOf(off,SECT_MAT_WALL);
    ok(wo.n>0&&wo.g===0,"без энергии стены отсеков тёмные");
    eq(glowOf(off,PLN_MAT.glow).g,0,"без энергии под землёй ни одна лампа не горит (копёр и ворота — на своей батарее)");

    /* убранство (M632b): у каждого рода своё, и ни одна вещь не стоит на линии хода (z 1.1–2.0 над полом) */
    const F=sectFloor(1),bad=[],none=[];
    for(const k of Object.keys(BUILD)){
      const m=plnMesh(1<<10);sectKit(m,k,.5,8.5,F,F+M.room,M.deep,true,1,7);
      if(m.nv<8)none.push(k);
      for(let i=0;i<m.nv;i++){const o=i*PLN_VS,y=m.v[o+1],z=m.v[o+2];if(y>F+.05&&z>1.1&&z<2.0){bad.push(k+"@"+z.toFixed(2));break;}}
    }
    eq(none.join(","),"","у каждого рода отсека есть вещи");
    eq(bad.join(","),"","вещи не стоят на линии хода");
  }finally{SECT.b=b0;SECT.lens=l0;PLN.cam=cam0;}
}));
