/* ══════════════ зал кантины под сценой (M725) ══════════════
   Под залом — те же люди крупно: карточка-портрет на каждого, кто ищет работу, столик на каждое дело,
   завсегдатай; справа — стойка: вывеска, бармен и его слова, слухи с адресом, вход «к стойке».

   ПРАВИЛА ФАЙЛА:
   1. Человек — лицом, а не строкой. Портрет — тот же человек в объёме, что в зале и в штабе (27f5 cpPortrait),
      только крупно и в нише цвета роли; роль, имя, уровень и черты — на карточке, цифры — в досье.
   2. Один тычок — одно дело. Карточка выбирает человека (под сценой раскрывается досье), кнопка на ней
      сразу делает своё (НАНЯТЬ, ВЫСЛУШАТЬ); выбор в зале и выбор карточкой — один cantSel.
   3. Стойка — место, а не кнопка. Слухи живут у бармена (их же пишет доска, 11t rumourHeard — запись
      в тетрадь одна на станцию и бакет); «к стойке» открывает стол, поздний час и отказы, как раньше.
   4. Широко — две колонки (люди | стойка), узко — одна: сначала люди, стойка под ними. Решает ширина
      самого зала (flex-wrap), а не окна: та же вёрстка в средней колонке станции и на телефоне. */

/* портрет в объёме (27f5): тот же человек, что в зале, на холсте плотности панели css×css */
function cantFace(m,css,cut){return cpPortrait(m,css,cut);}
/* бармен — свой человек станции: лицо от её зерна, как у всех, но вырезом — фартук ему рисует ниша */
function cantKeeper(){
  const s=(hashi(G.sys.seed>>>0,0xBA4,7)>>>0);
  return {seed:s,role:"fact",loy:72,xp:0,traits:[],name:"бармен"};
}
/* что сказал бармен последним; пока он молчит — слово зала по типу станции */
const CANT_KEEP_LINE={
  trade:"Наливаем допоздна, слушаем бесплатно. Работу ищут вон те, у стойки.",
  indust:"Смена кончилась — значит, полный зал. Кто трезвый, тот и нанимается.",
  yard:"С верфи все с руками. Спрашивайте, кто что чинил.",
  sci:"Тише. Здесь думают. Кто за столиком — у того и дело.",
  outpost:"Последняя кружка перед пустотой. Кто остался — тот и есть."
};
function cantKeeperLine(){
  if(typeof cantBubble!=="undefined"&&cantBubble&&now()-cantBubble.t<60000)return cantBubble.line;
  return CANT_KEEP_LINE[(G.st&&G.st.stype)||"trade"]||CANT_KEEP_LINE.trade;
}
/* выбрать в зале (или снять выбор); зал и карточки — одни люди */
function cantPick(id){cantSel=(id&&id===cantSel)?null:id;sfx("ui");renderTab();}

/* ── зал под сценой ── */
function cantHall(free,deals,folk){
  secHead("В ЗАЛЕ",{count:free.length+deals.length+(folk?1:0),
    note:"тыкните по человеку в зале или по карточке — это те же люди; бармен справа, у него слухи",key:"cant"});
  const hall=el("div","cant-hall"),main=el("div","ch-main"),grid=el("div","ch-grid");
  for(const m of free)grid.appendChild(cantCard(m));
  for(const d of deals)grid.appendChild(cantDealCard(d));
  if(folk&&FOLK[folk.id])grid.appendChild(cantFolkCard(folk));
  if(!grid.children.length)grid.appendChild(el("div","ch-empty","<b>Пусто</b><s>сегодня работу никто не ищет и дел не предлагают — загляните в другой раз или спросите у стойки</s>"));
  main.appendChild(grid);hall.appendChild(main);
  hall.appendChild(cantBarPanel());
  $body.appendChild(hall);
}
/* кандидат: ниша с портретом, роль, имя, черты (если расспросили), цена и НАНЯТЬ */
function cantCard(m){
  const R=MGR_ROLES[m.role],taken=mgrTaken(m.role),fee=mgrFee(m);
  const known=!!G.cantina.talked[m.id]||mgrPerkOf("cmd","read")||relicDeep("ledger");
  const c=el("div","ch-card hire"+(cantSel===m.id?" on":""));
  c.style.setProperty("--k",R.col);
  c.onclick=ev=>{if(ev.target.closest("button"))return;cantPick(m.id);};
  const f=el("div","ch-face");
  f.innerHTML="<i class='ch-role'>"+R.ru.toUpperCase()+"</i><i class='ch-lv'>УР "+mgrLevel(m)+"</i>";
  f.appendChild(cantFace(m,124));
  c.appendChild(f);
  c.appendChild(el("div","ch-id","<b>"+m.name+"</b><s>"+(taken?"домен занят: "+mgrOf(m.role).name:R.dom)+"</s>"));
  const tr=el("div","ch-tr");
  if(known)tr.innerHTML=m.traits.map(t=>{const T=mgrTrait(t);return "<i title='"+T.note+"'>"+T.ru+"</i>";}).join("");
  else tr.innerHTML="<i class='q'>черты — после разговора</i>";
  c.appendChild(tr);
  const go=el("div","ch-go");
  const b=el("button","act"+(taken?"":" gold"),"НАНЯТЬ · "+fee.toLocaleString("ru")+" кр");
  b.disabled=taken||G.credits<fee||G.mgrs.length>=MGR_CAP;
  b.onclick=()=>{if(hireMgr(m)){hqSel=m.id;cantSel=null;renderTab();}};
  go.appendChild(b);c.appendChild(go);
  return c;
}
/* столик с делом: что, кто, ВЫСЛУШАТЬ */
const CANT_TABLE_SVG="<svg viewBox='0 0 64 40' aria-hidden='true'><path d='M8 22h48M14 22l-4 16M50 22l4 16M32 22v16' fill='none' stroke='currentColor' stroke-width='2'/>"+
  "<path d='M20 20v-8h6v8M38 20v-11h5v11' fill='none' stroke='currentColor' stroke-width='1.6'/><circle cx='32' cy='9' r='2.4' fill='currentColor'/></svg>";
function cantDealCard(d){
  const D=d.def,id="deal:"+d.key;
  const c=el("div","ch-card deal"+(cantSel===id?" on":""));
  c.onclick=ev=>{if(ev.target.closest("button"))return;cantPick(id);};
  c.appendChild(el("div","ch-face sm","<i class='ch-role'>ЗА СТОЛИКОМ</i>"+CANT_TABLE_SVG));
  c.appendChild(el("div","ch-id","<b>"+D.ru+"</b><s>"+d.name+" · "+D.who+"</s>"));
  const go=el("div","ch-go"),b=el("button","act","ВЫСЛУШАТЬ");
  b.onclick=()=>cantPick(id);
  go.appendChild(b);c.appendChild(go);
  return c;
}
/* завсегдатай: говорит своё, попросить не может */
const CANT_FOLK_SVG="<svg viewBox='0 0 64 40' aria-hidden='true'><circle cx='32' cy='11' r='6' fill='currentColor'/>"+
  "<path d='M18 40c1-12 6-18 14-18s13 6 14 18' fill='currentColor'/></svg>";
function cantFolkCard(f){
  const F=FOLK[f.id],id="folk:"+f.id;
  const c=el("div","ch-card folk"+(cantSel===id?" on":""));
  c.onclick=ev=>{if(ev.target.closest("button"))return;cantPick(id);};
  c.appendChild(el("div","ch-face sm","<i class='ch-role'>ЗАВСЕГДАТАЙ</i>"+CANT_FOLK_SVG));
  c.appendChild(el("div","ch-id","<b>"+F.ru+"</b><s>"+(F.where==="dock"?"у дока":"в зале")+(F.note?" · "+F.note:"")+"</s>"));
  const go=el("div","ch-go"),b=el("button","act","ПОДОЙТИ");
  b.onclick=()=>cantPick(id);
  go.appendChild(b);c.appendChild(go);
  return c;
}
/* ── стойка: вывеска, бармен, слухи, вход ── */
function cantBarPanel(){
  const S=cantStyle(),p=el("aside","ch-bar");
  p.style.setProperty("--k",S.acc);
  const cby=(G.sys&&G.sys.station&&G.sys.station.by)||"gt",CP=(typeof powerOf==="function")?powerOf(cby):null;
  p.appendChild(el("div","ch-sign","<b>"+S.sign+"</b>"+(CP&&CP.food?"<s>сегодня: "+CP.food+"</s>":"")));
  const k=el("div","ch-keep"),kf=el("div","ch-kf");
  kf.appendChild(cantFace(cantKeeper(),64,true));
  k.appendChild(kf);
  k.appendChild(el("div","ch-say","<b>Бармен</b><s>— "+cantKeeperLine()+"</s>"));
  p.appendChild(k);
  const L=(typeof rumoursHere==="function")?rumoursHere():[];
  if(L.length){
    p.appendChild(el("div","ch-h","<span>СЛУХИ</span><i>"+L.length+"</i>"));
    for(const q of L){
      const r=el("div","ch-rum","<b>"+q.lines[0]+"</b><s>"+q.lines[1]+"</s><s class='src'>"+q.lines[2]+"</s>");
      const b=el("button","act sm","НА КАРТУ");b.onclick=()=>rumourToMap(q);
      r.appendChild(b);p.appendChild(r);
    }
    if(typeof rumourHeard==="function")rumourHeard(L);
  }
  const go=el("button","act gold","К СТОЙКЕ");
  go.onclick=()=>{cantSel="counter";sfx("ui");renderTab();};
  p.appendChild(go);
  return p;
}
/* ── досье выбранного: портрет крупно, слова, цифры, черты с объяснением, действия ── */
function cantDossier(m){
  const R=MGR_ROLES[m.role],taken=mgrTaken(m.role),fee=mgrFee(m);
  const known=!!G.cantina.talked[m.id]||mgrPerkOf("cmd","read")||relicDeep("ledger");
  const d=el("div","ch-dos");d.style.setProperty("--k",R.col);
  const f=el("div","ch-face big");
  f.innerHTML="<i class='ch-role'>"+R.ru.toUpperCase()+"</i>";
  f.appendChild(cantFace(m,168));
  d.appendChild(f);
  const t=el("div","ch-txt");
  t.innerHTML="<b class='nm'>"+m.name+"</b><s class='rl'>"+R.ru.toLowerCase()+" · "+R.note+"</s>"+
    "<div class='ch-fig'><span><em>уровень</em><b>"+mgrLevel(m)+"</b></span><span><em>оклад</em><b>"+mgrPay(m)+" кр/мин</b></span>"+
    "<span><em>доля</em><b>"+(mgrCut(m)*100).toFixed(1)+"%</b></span><span><em>найм</em><b>"+fee.toLocaleString("ru")+" кр</b></span></div>"+
    (known?"<div class='ch-trl'>"+m.traits.map(x=>{const T=mgrTrait(x);return "<p><b>"+T.ru+"</b>"+T.note+"</p>";}).join("")+"</div>"
      :"<s class='rl'>чем хорош и чем плох — видно после разговора"+(m.traits.length>2?" (черт три)":"")+"</s>")+
    (taken?"<s class='busy'>домен занят: "+mgrOf(m.role).name+"</s>":"");
  const acts=el("div","ch-acts");
  if(!known){const bt=el("button","act","РАССПРОСИТЬ");bt.onclick=()=>{G.cantina.talked[m.id]=1;renderTab();};acts.appendChild(bt);}
  const b=el("button","act"+(taken?"":" gold"),"НАНЯТЬ · "+fee.toLocaleString("ru")+" кр");
  b.disabled=taken||G.credits<fee||G.mgrs.length>=MGR_CAP;
  b.onclick=()=>{if(hireMgr(m)){hqSel=m.id;cantSel=null;renderTab();}};
  acts.appendChild(b);t.appendChild(acts);
  d.appendChild(t);
  $body.appendChild(d);
}
