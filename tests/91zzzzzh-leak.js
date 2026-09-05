/* ══════════════ что растёт за вечер (M354) ══════════════
   Автор ловит зависание по вечерам, и сквозной набор ищет его в состоянии:
   растущие списки и пухнущий сейв (91zzzzz). Но кадр может дорожать и с
   другой стороны — со стороны страницы. Отрисовщик, который дописывает в
   доску вместо того, чтобы её очистить, за вечер наберёт тысячи узлов: игра
   при этом работает, ничего не падает, просто каждая перерисовка всё дороже,
   а под конец окно ощутимо думает.

   Проверяется прямо: перерисовать одно и то же тридцать раз и сравнить
   число узлов. Разница — это и есть протечка. Плюс тот же вопрос к сценам:
   вход в режим двадцать раз подряд не должен ни растить страницу, ни
   заводить новых полей у мира. */

function lkNodes(sel){const e=document.querySelector(sel);return e?e.querySelectorAll("*").length:-1;}

TEST_SUITES.push(() => suite("утечки: тридцать перерисовок доски не растят страницу", () => {
  resetWorld();
  if(typeof e2eLate==="function")e2eLate();else fuzzRich();
  const bad=[];let checked=0;
  const grow=(tabsSel,bodySel,setTab,render,ru)=>{
    for(const t of [...document.querySelectorAll(tabsSel)].map(b=>b.dataset.tab)){
      try{ setTab(t); render(); }catch(e){ continue; }
      const n0=lkNodes(bodySel);
      if(n0<0)continue;
      for(let i=0;i<30;i++){ try{ setTab(t); render(); }catch(e){ bad.push(ru+"/"+t+" · "+i+": "+e.message); break; } }
      const n1=lkNodes(bodySel);
      checked++;
      if(n1>n0+2)bad.push(ru+"/"+t+": узлов "+n0+" → "+n1+" за тридцать перерисовок");
    }
  };
  grow("#tableTabs button","#tableBody",t=>{tableTab=t;},()=>tableRender(),"стол");
  tableTab="ether";
  if(G.sys.station){
    G.st=G.sys.station;G.mode="dock";
    grow("#stTabs button","#stBody",t=>{tab=t;},()=>renderTab(),"станция");
    tab="market";G.mode="system";G.st=null;
  }
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  ok(checked>20,"досок промерено: "+checked);
  eq(bad.slice(0,5).join(" ;; "),"","ни одна доска не дописывает вместо очистки"+
    (bad.length?" (всего "+bad.length+")":""));
  resetWorld();
}));

TEST_SUITES.push(() => suite("утечки: двадцать входов в режим не растят ни страницу, ни мир", () => {
  const bad=[];
  const scenes=lookScenes();
  /* прогрев: первый вход в сцену честно заводит узлы и поля — меряем со второго */
  for(const sc of scenes.slice(0,8)){
    try{ resetWorld(); if(sc.set()===false)continue; }catch(e){ continue; }
    try{ hud(); }catch(e){ }
    const n0=document.querySelectorAll("*").length, k0=Object.keys(G).length;
    let died="";
    for(let i=0;i<20;i++){
      try{ resetWorld(); if(sc.set()===false)break; hud(); }
      catch(e){ died=e.message; break; }
    }
    if(died){ bad.push(sc.id+" · "+died); continue; }
    const n1=document.querySelectorAll("*").length, k1=Object.keys(G).length;
    if(n1>n0+6)bad.push(sc.id+": узлов на странице "+n0+" → "+n1);
    if(k1>k0)bad.push(sc.id+": полей у мира "+k0+" → "+k1);
  }
  resetWorld(); hud();
  eq(bad.slice(0,4).join(" ;; "),"","вход в режим не оставляет за собой мусора");
}));

TEST_SUITES.push(() => suite("утечки: полсотни открытий каждого экрана не растят страницу", () => {
  resetWorld();
  if(typeof e2eLate==="function")e2eLate();else fuzzRich();
  const scrs=[...document.querySelectorAll(".scr")].map(e=>e.id).filter(Boolean);
  ok(scrs.length>=8,"экранов на странице: "+scrs.length);
  const n0=document.querySelectorAll("*").length;
  for(let i=0;i<50;i++)for(const id of scrs){
    const e=document.getElementById(id);
    if(!e)continue;
    e.classList.add("open");e.classList.remove("open");
  }
  const n1=document.querySelectorAll("*").length;
  eq(n1,n0,"открыть и закрыть каждый экран полсотни раз — узлов столько же ("+n0+")");
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  resetWorld();
}));

TEST_SUITES.push(() => suite("утечки: страница не остаётся в чужом режиме после сброса мира", () => {
  /* Сторож ровно того случая, что стоил этой правки: тычок в «В ДОРОГУ»
     переводил страницу в дорожный спутник (`body.road` прячет всё, кроме
     его окна), и все следующие наборы мерили невидимую страницу — молча,
     возвращая ноль вместо провала. Классы режимов на теле после resetWorld
     жить не должны. */
  resetWorld();
  const cls=[...document.body.classList];
  const bad=cls.filter(c=>c==="road"||c==="screen"||c==="table");
  eq(bad.join(","),"","на теле нет чужих режимов после сброса (классы: "+cls.join(" ")+")");
  eq(document.querySelectorAll(".scr.open").length,0,"и ни один экран не остался открытым");
  /* и сам выход отрабатывает: войти в дорогу и сбросить мир */
  if(typeof roadOpen==="function"){
    try{ roadOpen(); }catch(e){ ok(false,"дорога не открылась: "+e.message); }
    ok(document.body.classList.contains("road"),"дорога открыта");
    resetWorld();
    ok(!document.body.classList.contains("road"),"и сброс мира из неё выводит");
  }
  resetWorld();
}));
