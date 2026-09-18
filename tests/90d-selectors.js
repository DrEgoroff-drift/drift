/* ══════════════ селекторы: заглушка DOM отвечает, как браузер ══════════════ */
/* Node-ярус гоняет игру на заглушке документа (test-node.js), и 18.09 она дважды
   врала молча: ".scr.open" сверялся по первому классу, а ".pads button",
   "#fbar i", "[data-k=thrust]" и closest/matches не разбирались вовсе. Набор
   идёт в ОБОИХ ярусах: в браузере он проверяет, что спрашивание устроено так,
   как мы думаем, под Node — что заглушка отвечает то же самое. Селекторы — те,
   что игра реально задаёт (аудит src/ 18.09). */
TEST_SUITES.push(()=>suite("селекторы: заглушка DOM отвечает, как браузер",()=>{
  const mk=(tag,cls,attrs)=>{const e=document.createElement(tag);if(cls)for(const c of cls.split(" "))e.classList.add(c);
    for(const k in (attrs||{}))e.setAttribute(k,attrs[k]);return e;};
  const root=mk("div","qsT");
  const pads=mk("div","pads");const b1=mk("button","",{"data-k":"thrust"});const b2=mk("button","on",{"data-k":"brake"});
  pads.appendChild(b1);pads.appendChild(b2);
  const bar=mk("div","",{id:"qsTbar"});const fill=mk("i");bar.appendChild(fill);
  const scr=mk("div","scr");const body=mk("div","body");scr.appendChild(body);
  const deep=mk("section");const inner=mk("button","");deep.appendChild(inner);scr.appendChild(deep);
  root.appendChild(pads);root.appendChild(bar);root.appendChild(scr);document.body.appendChild(root);
  try{
    const all=s=>Array.from(root.querySelectorAll(s));
    eq(all(".pads button").length,2,"потомок: «.pads button» — две кнопки, а не сама панель");
    ok(all(".pads button").every(e=>e.tagName==="BUTTON"),"потомок отдаёт кнопки");
    eq(root.querySelector("#qsTbar i"),fill,"«#id i» — заливка внутри полосы, а не полоса");
    eq(root.querySelector("[data-k=brake]"),b2,"атрибут со значением — ровно тот узел");
    eq(all("[data-k]").length,2,"атрибут без значения — только у кого он есть, а не весь документ");
    eq(all("[data-k].on").length,1,"атрибут и класс вместе");
    eq(all(".scr.open").length,0,"составной класс: закрытый экран не открыт");
    scr.classList.add("open");
    eq(all(".scr.open").length,1,"составной класс: открытый — открыт");
    scr.classList.remove("open");
    eq(all(".scr.open").length,0,"и снова закрыт после remove — без залипания");
    eq(all(".scr > button").length,0,"дочерний: кнопка во вложенной секции — не дочь экрана");
    eq(all(".scr button").length,1,"потомок видит её на любой глубине");
    eq(all(".scr .body,.pads [data-k=thrust]").length,2,"запятая собирает обе группы");
    eq(all("button:not(.on)").length,2,":not отсекает включённую");
    eq(inner.closest(".scr"),scr,"closest поднимается к предку");
    eq(inner.closest(".pads"),null,"closest без такого предка — null");
    ok(b2.matches("[data-k].on")&&!b1.matches("[data-k].on"),"matches отвечает по существу");
  }finally{root.remove();}
}));
