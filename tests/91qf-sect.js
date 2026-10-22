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

    /* телефон в стволе: окно едет за клетью по высоте плавно, без скачков по рядам (M632c) */
    const cyAt=fy=>{S.y=BASE_OY-fy/M.ch*BCELL_H;return sectWith(390,844,()=>{SECT.ent=0;SECT.far=0;
      let q;for(let i=0;i<80;i++)q=sectLensAt(390,844,S,B,false);return q;});};
    S.cur=-1;S.x=BASE_OX+sectRoomX(-1)/M.cw*BCELL_W;
    const myA=sectFloor(1)+2.4,LA=cyAt(myA+M.ch/2);
    ok(LA.b<myA&&LA.t>myA+1.8,"телефон в стволе: человек в клети целиком в окне ("+LA.b.toFixed(1)+".."+LA.t.toFixed(1)+" при поле "+myA.toFixed(1)+")");
    const c0=LA.cy;S.y-=.3/M.ch*BCELL_H;
    const c1=sectWith(390,844,()=>sectLensAt(390,844,S,B,false)).cy;
    ok(Math.abs(c1-c0)<.1,"телефон в стволе: шаг клети — шаг окна, без скачка ("+(c1-c0).toFixed(3)+")");
    S.cur=1;S.x=cellX(1);S.y=cellY(0);

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

/* меню стройки лентой на слое (M632, DESIGN-base-scene §9): 2D-холст не трогает; ячейка на вид, выбранная
   целиком в кадре; ячейки и стрелки ≥ 44 px; тап ставит S.pick; телефон лёжа — лента не на человеке */
TEST_SUITES.push(()=>suite("база в разрезе: меню стройки — лента на слое, цели пальца, тап, человек открыт (M632)",{tier:"browser"},()=>{
  const Q=SECT_MENU,keep={dom:Q.dom,hudK:Q.hudK,x:Q.x,t:Q.t,hit:Q.hit,top:Q.top,lay:Q.lay},m0=G.mode,b0=G.base,live0=SECT.live;
  const C2=["fill","stroke","fillRect","strokeRect","drawImage","fillText","strokeText","putImageData"],own={};
  let n2=0;
  for(const k of C2){own[k]=Object.prototype.hasOwnProperty.call(ctx,k)?ctx[k]:undefined;const o=ctx[k];ctx[k]=function(){n2++;return o.apply(this,arguments);};}
  try{
    const {B}=sectBaseFix(4),S={B,cur:1,row:1,x:cellX(1),y:cellY(1),menu:true,pmenu:false,walkPhase:0,pick:8};
    /* окно: низ пультов, низ шапки, правый борт — как публикует вёрстка; человек — где скажет pj */
    const run=(w,h,dom,ym)=>sectWith(w,h,()=>{
      Q.hudK=sectMenuKey();Q.dom=dom;Q.x=null;Q.t=0;
      const mx=sectX(S.x),my=sectY(S.y)-SECT_M.ch/2,pj=v=>[W/2+(v[0]-mx)*30,ym-(v[1]-my)*30];
      const T={uq:[],ur:[],gd:[]};ovInto(T,1,()=>sectOvMenu(S,B,pj));
      return {h:Q.hit,top:Q.top,man:[ym-63,ym+3],q:T.uq.length};
    });
    const fits=(R,w,tag)=>{
      ok(R.q>0,tag+": лента легла на слой");
      eq(R.h.cells.length,R.h.nv,tag+": ячейка на каждый показанный род ("+R.h.nv+")");
      const on=R.h.cells.find(c=>c.i===S.pick);
      ok(on&&on.x0>=0&&on.x1<=w,tag+": выбранная целиком в кадре");
      ok(R.h.cw>=44&&R.h.ch>=44&&R.h.aw>=44,tag+": ячейка "+R.h.cw.toFixed(0)+"×"+R.h.ch.toFixed(0)+", стрелка "+R.h.aw.toFixed(0)+" — цели ≥ 44");
    };
    const pc=run(1920,1080,{floor:1000,top:120,rail:{l:1830,r:1900,t:660,b:800}},560);
    fits(pc,1920,"ПК 1920");
    eq(pc.h.nv,9,"ПК 1920: девять ячеек");
    ok(!pc.top,"ПК: лента над пультами");
    const ph=run(390,844,{floor:1640/2,top:170,rail:{l:300,r:380,t:720,b:780}},680);
    fits(ph,390,"телефон 390");
    ok(ph.h.cells.every(c=>c.x1<=300-12+.5),"телефон 390: лента обходит правый борт");
    const ls=run(568,320,{floor:220,top:60,rail:{l:430,r:560,t:70,b:130}},215);
    fits(ls,568,"телефон лёжа 568×320");
    ok(ls.top,"телефон лёжа: человек на месте ленты — лента под шапкой");
    ok(ls.h.y1+6<=ls.man[0]||ls.h.y0-6>=ls.man[1],"телефон лёжа: лента не на человеке ("+ls.h.y0.toFixed(0)+".."+ls.h.y1.toFixed(0)+" при человеке "+ls.man.map(v=>v.toFixed(0)).join("..")+")");
    eq(n2,0,"меню не рисует на 2D-холсте");

    /* имена: строки в ширину ячейки, переносом — без обрезки */
    const L=Q.lay,wide=[];
    for(const k of BUILD_KEYS)for(const s of L.lines[k])if(L.wid(s,+/(\d+)px/.exec(L.font)[1])>L.lim+.5)wide.push(s);
    eq(wide.join(","),"","имена родов влезают в ячейку");

    /* тап: по ячейке — выбор, по стрелке — страница */
    G.mode="base";G.base=S;SECT.live=true;
    sectWith(390,844,()=>{
      Q.hudK=sectMenuKey();Q.dom={floor:820,top:170,rail:null};Q.x=null;
      const mx=sectX(S.x),my=sectY(S.y)-SECT_M.ch/2;
      ovInto({uq:[],ur:[],gd:[]},1,()=>sectOvMenu(S,B,v=>[W/2+(v[0]-mx)*30,300-(v[1]-my)*30]));
      const c=cvsRect(),cx=x=>c.left+x*c.width/W,cy=y=>c.top+y*c.height/H,h=Q.hit,y=(h.y0+h.y1)/2;
      const t=h.cells.find(q=>q.i!==S.pick);
      tap(cx((t.x0+t.x1)/2),cy(y));
      eq(S.pick,t.i,"тап по ячейке ставит S.pick");
      const p0=S.pick;
      if(h.next){tap(cx((h.next[0]+h.next[1])/2),cy(y));eq(S.pick,Math.min(h.n-1,p0+h.nv),"тап по ▶ листает страницу");}
    });
  }finally{
    for(const k of C2){if(own[k]===undefined)delete ctx[k];else ctx[k]=own[k];}
    Object.assign(Q,keep);G.mode=m0;G.base=b0;SECT.live=live0;
  }
}));
