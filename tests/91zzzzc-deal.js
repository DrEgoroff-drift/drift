/* ══════════════ ДЕЛО: один ответ на «что на меня работает» ══════════════
   Автор, 30.08.2026: «проверь, как работают дроны, как работают наёмники — на
   моём сейве они никуда не летали, непонятно». Механики работали обе; не
   работал ОТВЕТ — он был разложен по четырём экранам. Здесь сторожится, что
   ответ снова один и что он честный: кто стоит, тот назван стоящим. */
TEST_SUITES.push(()=>suite("дело: наёмник, управляющий, дрон и база — одним списком",()=>{
  resetWorld();
  /* наёмник без корпуса: он и есть тот, из-за кого всё началось */
  const m=genMerc(4242,["haul"]);
  G.credits=99999;coopStamp();
  ok(hireMerc(m),"наёмник нанят");
  const c=G.crew[0];
  eq(c.shipId,null,"корпуса ему не выдали");
  /* дрон в рейсе */
  const now=Date.now();
  G.drones=[{id:1,sx:G.sx,sy:G.sy,pi:0,res:"titan",rate:1,pool:100,soldAtMs:now,
             t0:now,lastMs:now,bornMs:now,trips:0,down:0,sold:0,earned:0}];
  openDeal();
  const body=document.getElementById("dlBody");
  const txt=body.textContent;
  ok(txt.indexOf(c.name)>=0,"наёмник в списке");
  ok(/не выдан корабль/.test(txt),"и назван неработающим, а не «на приколе»");
  ok(/МАШИНЫ/.test(txt),"машины в списке");
  eq(dealIdle(),1,"простаивает ровно один");

  /* ни одной погашенной кнопки и ни одной мельче 44 px — И10 и И2 */
  const btns=[...document.getElementById("dealview").querySelectorAll("button")]
    .filter(b=>b.getBoundingClientRect().width>0);
  eq(btns.filter(b=>b.disabled).map(b=>b.textContent.trim()).join(", "),"",
     "на экране нет погашенных кнопок");
  const small=btns.filter(b=>{const r=b.getBoundingClientRect();return r.width<44||r.height<44;});
  eq(small.map(b=>b.textContent.trim()).join(", "),"","и все дотягивают до 44 px");

  /* строка человека ведёт в его карточку, и это карточка ИМЕННО его */
  const row=[...body.querySelectorAll(".row")].find(r=>r.textContent.indexOf(c.name)>=0);
  ok(!!row,"строка человека найдена");
  if(row){
    row.onclick&&row.onclick();
    ok(document.getElementById("crewview").classList.contains("open"),"она открыла карточку");
    eq(crewOne()&&crewOne().name,c.name,"и карточка того самого человека");
    /* и в карточке тоже нет призраков: у него нет ни корабля, ни уровней */
    const cb=[...document.getElementById("crewview").querySelectorAll("button")]
      .filter(b=>b.getBoundingClientRect().width>0);
    eq(cb.filter(b=>b.disabled).map(b=>b.textContent.trim()).join(", "),"",
       "в карточке человека погашенных кнопок нет");
    const cs=cb.filter(b=>{const r=b.getBoundingClientRect();return r.width<44||r.height<44;});
    eq(cs.map(b=>b.textContent.trim()).join(", "),"","и в ней все кнопки дотягивают до 44 px");
    document.getElementById("crewview").classList.remove("open");
  }
  closeDeal();
  G.drones=[];G.crew=[];
}));

/* Кнопка ДЕЛО молчит, пока работать некому, и загорается, когда кто-то встал */
TEST_SUITES.push(()=>suite("дело: кнопка появляется по поводу и метит простой",()=>{
  resetWorld();
  G.crew=[];G.drones=[];G.mgrs=[];G.bases={};
  dealBtnTick();
  const b=document.getElementById("dealbtn");
  eq(b.style.display,"none","пустое хозяйство — двери нет");
  eq(dealCount(),0,"и считать нечего");
  const now=Date.now();
  G.drones=[{id:1,sx:G.sx,sy:G.sy,pi:0,res:"titan",rate:1,pool:100,soldAtMs:now,
             t0:now,lastMs:now,bornMs:now,trips:0,down:0,sold:0,earned:0}];
  G.mode="system";dealBtnTick();
  eq(b.style.display,"","появился первый дрон — появилась и дверь");
  ok(!b.classList.contains("on"),"метки нет: дрон возит");
  G.drones[0].stuck=1;dealBtnTick();
  ok(b.classList.contains("on"),"дрон встал под блокадой — дверь помечена");
  G.drones=[];dealBtnTick();
}));
