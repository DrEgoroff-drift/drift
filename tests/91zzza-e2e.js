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

