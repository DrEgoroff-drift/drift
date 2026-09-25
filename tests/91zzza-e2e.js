/* ══════════════ сквозной прогон: сцены, кнопки, факел и дым (M326) ══════════════
   Автор (03.09.2026): «тесты статично что-то показывают, а баги всё равно
   каждый раз, как захожу». Наборы до этого проверяли данные и формулы; здесь
   проверяется то, что видит игрок: каждая сцена рисуется НЕ ПУСТОЙ, каждая
   кнопка в кадре нажимается без исключения, а картинка, на которую жаловались
   (мачта знака дома торчит из факела, дыма нет), судится числами — так же, как
   look() судит кадр. Правило: новая жалоба на картинку → новая проверка сюда,
   чтобы второй раз её не ловить глазами. */

/* ── каждая сцена: не пустая, кнопки в кадре живые ── */
TEST_SUITES.push(()=>suite("сквозной: каждая сцена рисуется не пустой, кнопки в кадре нажимаются",{tier:"heavy"},()=>{
  const bad=[],blank=[];let clicks=0,scenes=0;
  for(const sc of lookScenes()){
    resetWorld();
    let set=true;
    try{set=sc.set()!==false;}catch(e){bad.push(sc.id+" · постановка: "+e.message);continue;}
    if(!set||G.mode==="none")continue;
    scenes++;
    try{drawWorld();}catch(e){bad.push(sc.id+" · кадр: "+e.message);continue;}
    const m=lookFrame(),mode0=G.mode;
    if(m.empty>97)blank.push(sc.id+" ("+m.empty+"% пусто)");
    /* кнопки, которые видны в этой сцене: пэды, панель, открытые экраны */
    const list=[...document.querySelectorAll("button")]
      .filter(b=>b.offsetParent!==null&&!b.disabled).slice(0,40);
    for(const b of list){
      const label=(b.textContent||b.title||b.className||"?").trim().slice(0,18);
      try{b.click();clicks++;}
      catch(e){bad.push(sc.id+" · «"+label+"»: "+e.message+" | "+String(e.stack||"").split("\n")[1]);}
      /* кнопка могла увести в другой режим — вернуть сцену, чтобы
         следующая кнопка нажималась там же, где её увидел игрок */
      try{document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
          if(G.mode!==mode0){resetWorld();sc.set();}}catch(e){}
    }
  }
  resetWorld();
  ok(scenes>=8,"сцен прогнано: "+scenes);
  ok(clicks>=20,"кнопок нажато: "+clicks);
  eq(blank.join(", "),"","ни одна сцена не пустая");
  eq(bad.slice(0,4).join(" ;; "),"","ни одна постановка, кадр или кнопка не бросили исключение");
}));

/* ── станция: в столбе факела нет холодных пикселей ни у одного дома ──
   Видео автора: у «Вестового» мачта знака стояла на оси факельной трубы
   промышленной станции и читалась дымом из сопла. Рисуем станцию каждого
   дома в закадровый холст и считаем пиксели над трубой: там могут быть только
   пламя (тёплое) и дым (серый), холодных (B > R) быть не должно. */
TEST_SUITES.push(()=>suite("станция: знак дома не стоит в факеле, дым живой",{tier:"browser"},()=>{
  resetWorld();
  const st=G.sys&&G.sys.station;
  ok(!!st,"у стартовой системы есть станция");
  if(!ok(st,"нашлось: st"))return;
  const keepType=st.stype,keepHouse=houseOf,keepCtx=ctx,keepT=G.t,keepShapes=gpuShapes;
  /* станция рисуется только видеокартой: тело — запись GPU-холста мастера (вершины в px мастера),
     огни и факел — фигуры в единицах станции. Столб факела — x −5…5, y −58…−28: над устьем трубы (−27), сама труба не в счёт */
  const inCol=(x,y)=>x>=-5&&x<=5&&y>=-58&&y<-28,coldC=(r,g,b)=>b>r+30,sb=2,sd=Math.ceil(160*sb);
  const cold=[];
  try{
    st.stype="indust";
    for(let hi=0;hi<HOUSES.length;hi++){
      const H=HOUSES[hi];
      houseOf=function(){return H;};
      G.t=keepT+hi*40;
      const g=new GcCtx(sd,sd,1),rec={L:[],z:0,split(){},inv:null};
      ctx=g;g.setTransform(sb,0,0,sb,sd/2,sd/2);rec.inv=DOMMatrix.fromMatrix(g.getTransform()).inverse();ST_REC=rec;
      try{drawStationBody(stationViz(st),st,"indust");}finally{ST_REC=null;ctx=keepCtx;}
      let n=0;
      for(const o of g._ops){const c=o.p&&o.p.k===0?o.p.c:null;if(!c||c[3]<.16||!coldC(c[0]/c[3]*255,c[1]/c[3]*255,c[2]/c[3]*255))continue;
        if(o.t!=="f"&&o.t!=="s")continue;
        for(let i=0;i<o.v.length;i+=2)if(inCol((o.v[i]-sd/2)/sb,(o.v[i+1]-sd/2)/sb)){n++;break;}}
      for(const r of rec.L){ST_EM={L:[],A:[],S:[],x:0,y:0,s:1,m:r.m};try{r.fn();}finally{}
        for(const e of ST_EM.L)if(e[10]>=.16&&coldC(e[7],e[8],e[9])&&inCol(e[1],e[2]))n++;ST_EM=null;}
      if(n>0)cold.push(H.id+": "+n+" холодных");
      if(hi===0){let warm=0;
        gpuShapes=function(pass,L){for(const e of L)if(e[7]>e[9]+40&&inCol(e[1],e[2]))warm++;};
        try{gpuStationFlare({},0,0,1,0,6.2,0,stationViz(st));}finally{gpuShapes=keepShapes;}
        ok(warm>2,"пламя в столбе есть: "+warm+" тёплых фигур");}
    }
  }finally{
    ctx=keepCtx;houseOf=keepHouse;st.stype=keepType;G.t=keepT;gpuShapes=keepShapes;ST_EM=null;ST_REC=null;
  }
  eq(cold.join(", "),"","в столбе факела нет пикселей цвета дома");
  /* дым: поднимается, сносится в одну сторону, растёт, редеет */
  const q=stackSmoke(1234.5,.7,3).sort((a,b)=>a.age-b.age);
  ok(q.length>=4,"клубов в кадре: "+q.length);
  let up=true,side=true,grow=true,fade=true;
  for(let i=1;i<q.length;i++){
    if(!(q[i].y<q[i-1].y))up=false;
    if(!(q[i].x<q[i-1].x+.7))side=false;              /* качание ±.6 не считается сменой стороны */
    if(!(q[i].r>q[i-1].r))grow=false;
    if(!(q[i].a<q[i-1].a))fade=false;
  }
  ok(up,"дым поднимается");ok(side,"дым сносит в одну сторону");
  ok(grow,"клубы растут");ok(fade,"клубы редеют");
  ok(q.every(c=>c.a<=.25&&c.a>0),"дым полупрозрачный, не пятно");
  ok(q[0].y<-36,"дым начинается над устьем, не в трубе");
  resetWorld();
}));
