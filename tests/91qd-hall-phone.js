/* M815 зал на телефоне: ряд разделов подводит видимую выбранную кнопку; замер цены кадра зала */
TEST_SUITES.push(()=>suite("зал на телефоне: ряд разделов ведёт к видимой кнопке",{tier:"browser"},()=>{
  resetWorld();
  const real=document.getElementById("stGroups");if(real)real.id="stGroups__real";
  const g=document.createElement("div");g.id="stGroups";
  g.style.cssText="position:fixed;left:0;top:0;width:200px;height:48px;overflow-x:auto;white-space:nowrap;display:block";
  const mk=(t,c)=>{const b=document.createElement("button");b.textContent=t;b.className=c||"";b.style.cssText="display:inline-block;width:120px;height:44px";return b;};
  const tabs=document.createElement("div");tabs.id="stTabs";tabs.style.display="none";tabs.appendChild(mk("скрытая","on"));
  g.appendChild(mk("ТОРГ"));g.appendChild(mk("ВЕРФЬ"));g.appendChild(mk("КАНТИНА"));const own=mk("ВЛАДЕНИЯ","on");g.appendChild(own);g.appendChild(tabs);
  document.body.appendChild(g);
  try{
    ok(hallNavOn(g)===own,"спрятанная вкладка одиночного раздела не считается — берётся кнопка раздела");
    hallNavSync();
    const r=own.getBoundingClientRect(),s=g.getBoundingClientRect();
    ok(g.scrollLeft>0&&r.left>=s.left-1&&r.right<=s.right+1,"выбранный раздел подведён под глаз: "+Math.round(r.left)+"…"+Math.round(r.right)+" в "+Math.round(s.left)+"…"+Math.round(s.right));
    tabs.style.display="block";const t=tabs.firstChild;
    ok(hallNavOn(g)===t,"открытая вторая ступень — меряется её вкладка");
  }finally{g.remove();if(real)real.id="stGroups";}
}));

TEST_SUITES.push(()=>suite("зал: замер цены кадра спит без зала",()=>{
  resetWorld();const wo=HALL.open;HALL.open=false;
  const p=hallCost(1);
  ok(p instanceof Promise,"замер — обещание");
  eq(HALL_COST.on,false,"закрытый зал — замер не включается");
  eq(HALL_COST.qs,null,"без замера набор меток не создаётся");
  HALL.open=wo;
}));
