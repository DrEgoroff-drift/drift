/* ══════════════ сеть сейва: каждое поле мира либо хранится, либо названо эфемерным (0.438.0) ══════════════
   snapshot() — белый список, и всё, что в него не вписано, теряется молча. Три
   множества: G_FIELDS (сборка: каждое `G.имя=` в src/), ключи snapshot() и
   SAVE_EPHEMERAL (14a2). Поле обязано быть ровно в одном из двух списков.
   Второй набор — «туда-обратно»: сейв, загрузка, сейв — состав и значения равны. */
TEST_SUITES.push(() => suite("сейв: поле мира либо хранится, либо названо эфемерным",{tier:"node"}, () => {
  resetWorld();
  /* поля мира: то, что заводит литерал G в 08-state (ключи после сброса), плюс
     каждое `G.имя=` в src/ (сборка, G_FIELDS) */
  const fields=[...new Set([...G_FIELDS,...Object.keys(G)])].sort();
  const saved=new Set(Object.keys(snapshot()));
  const lost=fields.filter(k=>!saved.has(k)&&!(k in SAVE_EPHEMERAL));
  eq(lost.join(" "),"","поля на G вне snapshot() и вне SAVE_EPHEMERAL (новое поле — впиши в один из списков)");
  const both=Object.keys(SAVE_EPHEMERAL).filter(k=>saved.has(k));
  eq(both.join(" "),"","в SAVE_EPHEMERAL названо то, что snapshot() уже хранит — список врёт");
  const stale=Object.keys(SAVE_EPHEMERAL).filter(k=>!fields.includes(k));
  eq(stale.join(" "),"","в SAVE_EPHEMERAL есть поле, которого у G нет — вычеркни");
  ok(fields.length>200,"список полей мира не пуст: "+fields.length);
}));

TEST_SUITES.push(() => suite("сейв: туда-обратно — состав и значения после загрузки те же",{tier:"node"}, () => {
  resetWorld();
  /* немного жизни, чтобы поля не были пустыми */
  G.credits=1234;G.cargo[RES_KEYS[0]]=3;G.data=7;G.matches=2;
  /* первая загрузка ДОПОЛНЯЕТ сейв умолчаниями (tow:null, kit, scripRate…) — это
     не расхождение, а правило «старый сейв получает безопасное умолчание». Судим
     неподвижную точку: второй круг обязан вернуть ровно то, что дал первый */
  applySave(JSON.parse(JSON.stringify(snapshot())));
  const a=snapshot();
  applySave(JSON.parse(JSON.stringify(a)));
  const b=snapshot();
  const ka=Object.keys(a),kb=Object.keys(b);
  eq(kb.filter(k=>!ka.includes(k)).join(" "),"","после загрузки в сейве появились ключи");
  eq(ka.filter(k=>!kb.includes(k)).join(" "),"","после загрузки из сейва пропали ключи");
  const diff=[];
  for(const k of ka){
    if(k==="ts")continue;
    const x=JSON.stringify(a[k]),y=JSON.stringify(b[k]);
    if(x!==y)diff.push(k+": "+String(x).slice(0,40)+" → "+String(y).slice(0,40));
  }
  eq(diff.join("\n"),"","значения разошлись после сейв→загрузка→сейв");
}));

/* облако на PHP возвращает числа строками; M443 чинил одно поле (padSize), теперь
   класс целиком: любое число в опциях после загрузки — число, а не строка */
TEST_SUITES.push(() => suite("сейв: числа опций из облака возвращаются числами, а не строками",{tier:"node"}, () => {
  resetWorld();
  const s=JSON.parse(JSON.stringify(snapshot()));
  s.opts=Object.assign({},s.opts,{padSize:"1.25",gfx:{draw:"1",detail:"1",particles:"1",plants:"1",fps:"30",res:"1.5"},audio:{on:true,music:"0.3",sfx:"0.6",engine:"0.4"},keys:{main:{thrust:"KeyW"},belt:{}}});
  applySave(s);
  eq(G.opts.padSize,1.25,"padSize — число");
  eq(G.opts.gfx.fps,30,"gfx.fps — число из списка, не сброшен в 0");
  eq(G.opts.gfx.res,1.5,"gfx.res — число из списка, не сброшен в 0");
  eq(G.opts.audio.music,.3,"audio.music — число, не умолчание");
  eq(G.opts.keys.main.thrust,"KeyW","имя клавиши осталось строкой");
}));
