/* ══════════════ M483: ПРОЕКТЫ ×3 и метка новой части ══════════════ */
TEST_SUITES.push(()=>suite("чертёж: проекты M483",()=>{
  resetWorld();
  ok(KB_PR.length===3&&KB_PR[0]==="РЕЙСОВЫЙ","три именованных проекта");
  G.shipId="strizh";G.owned.strizh=true;G.fit.strizh=G.fit.strizh||{};
  KB.id="strizh";KB.d=draftOf("strizh");KB.sel=null;KB.msg="";
  draftSave("strizh",KB.d);
  const D0=draftAll().strizh;ok(!!D0&&D0.it,"рейсовый сохранён");
  kbProjSwitch(1);
  ok((draftAll().strizh.cur|0)===1,"переключение на боевой");
  kbProjSwitch(2);
  ok((draftAll().strizh.cur|0)===2,"пустой трюм");
  const hold=draftOf("strizh").hold;ok(Array.isArray(hold),"пустой трюм читается");
  const p={id:"tpart",kind:"gun",name:"проба",tier:1,seed:1};
  G.inv=(G.inv||[]).concat([p]);
  const fut=kbPartFuture(p);
  ok(fut===null||typeof fut.slot==="number","метка новой части — слот или отказ");
}));
