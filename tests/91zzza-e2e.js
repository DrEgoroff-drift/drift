/* ══════════════ сквозной прогон: сцены, кнопки, факел и дым (M326) ══════════════
   Автор (03.09.2026): «тесты статично что-то показывают, а баги всё равно
   каждый раз, как захожу». Наборы до этого проверяли данные и формулы; здесь
   проверяется то, что видит игрок: каждая сцена рисуется НЕ ПУСТОЙ, каждая
   кнопка в кадре нажимается без исключения, а картинка, на которую жаловались
   (мачта знака дома торчит из факела, дыма нет), судится числами — так же, как
   look() судит кадр. Правило: новая жалоба на картинку → новая проверка сюда,
   чтобы второй раз её не ловить глазами. */

/* ── каждая сцена: не пустая, кнопки в кадре живые ── */
TEST_SUITES.push(()=>suite("сквозной: каждая сцена рисуется не пустой, кнопки в кадре нажимаются",()=>{
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
TEST_SUITES.push(()=>suite("станция: знак дома не стоит в факеле, дым живой",()=>{
  resetWorld();
  const st=G.sys&&G.sys.station;
  ok(!!st,"у стартовой системы есть станция");
  if(!ok(st,"нашлось: st"))return;
  const keepType=st.stype,keepHouse=houseOf,keepCtx=ctx,keepT=G.t;
  const off=document.createElement("canvas");off.width=160;off.height=200;
  const cold=[];
  try{
    st.stype="indust";
    for(let hi=0;hi<HOUSES.length;hi++){
      const H=HOUSES[hi];
      houseOf=function(){return H;};
      G.t=keepT+hi*40;                                  /* ключ кэша спрайта — по времени */
      ctx=off.getContext("2d");ctx.clearRect(0,0,160,200);
      drawStation(80,120,1);
      const s=1.7,x0=Math.round(80-5*s),x1=Math.round(80+5*s),y0=Math.round(120-58*s),y1=Math.round(120-27*s);
      const d=ctx.getImageData(x0,y0,x1-x0,y1-y0).data;
      let n=0,warm=0;
      for(let i=0;i<d.length;i+=4){
        if(d[i+3]<40)continue;
        if(d[i+2]>d[i]+30)n++;                            /* синее сильнее красного — холодный */
        if(d[i]>d[i+2]+40)warm++;
      }
      if(n>0)cold.push(H.id+": "+n+" холодных");
      if(hi===0)ok(warm>20,"пламя в столбе есть: "+warm+" тёплых пикселей");
    }
  }finally{
    ctx=keepCtx;houseOf=keepHouse;st.stype=keepType;G.t=keepT;
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
