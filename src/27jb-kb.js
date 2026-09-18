/* ══════════════ КБ: редактор чертежа, синька (M477, DESIGN-shipyard §3, review §2.2) ══════════════
   Второй и последний новый экран партии. Синька: прусская лазурь, силуэт и
   сетка светлой линией, вещи — охристые оттиски по роду, трюм — штриховка.
   Тап по вещи в лотке — взять; тап по клетке — положить. Правила места — одной
   строкой, когда отказывают: «двигатели — только в кормовой ряд», «реактор у
   борта не ставят», «приборы видят из носовой трети», «орудие — на обшивку».
   Трюм — это то, что осталось: свободная клетка палубы красится тапом.
   ТИПОВОЙ — «как у всех» (упаковщик). ГОТОВО — «ваш чертёж 4-й в очереди»,
   и штамп «СОГЛАСОВАНО» ложится сам.

   Сохраняется G.draft[shipId] = {it:{ключ:[[i,j]…]}, hold:[[i,j]…]}; ключ —
   "p"+слот для части и "m"+модуль. Нет записи — упаковщик (applySave по
   умолчанию). Числа корабля от чертежа пока не зависят (M478). */
const KB_RULE={
  engine:{ok:q=>q.kind==="stern",no:"двигатели — только в кормовой ряд"},
  m_engine:{ok:q=>q.kind==="stern",no:"двигатели — только в кормовой ряд"},
  core:{ok:q=>q.kind!=="side"&&q.kind!=="nose",no:"реактор у борта не ставят"},
  m_weapon:{ok:q=>q.kind!=="side"&&q.kind!=="nose",no:"реактор у борта не ставят"},
  util:{ok:q=>q.nose3,no:"приборы видят из носовой трети"},
  gun:{ok:q=>q.kind==="nose"||q.kind==="side",no:"орудие — на обшивку"},
  m_armor:{ok:q=>q.kind==="side"||q.kind==="nose",no:"броня — по обшивке"}
};
const KB={sel:null,msg:"",id:null};
function draftAll(){return G.draft||(G.draft={});}
/* чертёж корабля: сохранённый — или упаковщик, если правки не было */
function draftOf(id){
  const P=planOf(id),pk=planPack(id,G.fit[id]||{},G.mods||{});
  const D=draftAll()[id],items=[];
  const cellAt=(i,j)=>P.cells.find(q=>q.i===i&&q.j===j)||null;
  for(const it of pk.items){
    const key=(it.what==="mod"?"m":"p")+(it.what==="mod"?it.kind:it.slot);
    const saved=D&&D.it&&D.it[key];
    let cells=it.cells;
    if(saved&&saved.length===it.need){const c=saved.map(x=>cellAt(x[0],x[1]));if(c.every(Boolean))cells=c;}
    items.push({...it,key,cells});
  }
  const used=new Set();for(const it of items)for(const q of it.cells)used.add(q);
  let hold;
  if(D&&D.hold)hold=D.hold.map(x=>cellAt(x[0],x[1])).filter(q=>q&&!used.has(q));
  else hold=P.cells.filter(q=>!used.has(q)&&(q.kind==="deck"||q.kind==="spine"));
  return {P,items,hold};
}
function draftSave(id,d){
  const it={};for(const x of d.items)it[x.key]=x.cells.map(q=>[q.i,q.j]);
  draftAll()[id]={it,hold:d.hold.map(q=>[q.i,q.j])};
}
function kbRule(it){return KB_RULE[(it.what==="mod"?"m_":"")+it.kind]||null;}
/* положить вещь якорем в клетку q: остальные клетки — ближайшие свободные, где правило пускает */
function kbPlace(d,it,q){
  const R=kbRule(it);
  if(R&&!R.ok(q))return R.no;
  const busy=new Set();for(const x of d.items)if(x!==it)for(const c of x.cells)busy.add(c);
  if(busy.has(q))return "клетка занята";
  const pool=d.P.cells.filter(c=>c!==q&&!busy.has(c)&&(!R||R.ok(c)))
    .sort((a,b)=>Math.hypot(a.i-q.i,a.j-q.j)-Math.hypot(b.i-q.i,b.j-q.j));
  const cells=[q].concat(pool.slice(0,it.need-1));
  if(cells.length<it.need)return "не влезает: нужно клеток "+it.need;
  if(cells.some(c=>Math.hypot(c.i-q.i,c.j-q.j)>1.5*it.need))return "не влезает целиком — разорвало бы";
  it.cells=cells;
  d.hold=d.hold.filter(c=>cells.indexOf(c)<0);
  return "";
}
function kbNumbers(d){
  const used=d.items.reduce((a,x)=>a+x.cells.length,0);
  return "ЯЧЕЙКИ "+(used+d.hold.length)+"/"+d.P.cells.length+" · ТРЮМ "+d.hold.length+" КЛ.";
}
/* ── экран ── */
function kbOpen(){
  KB.id=G.shipId;KB.sel=null;KB.msg="";KB.d=draftOf(KB.id);
  let w=document.getElementById("kbWin");
  if(!w){w=document.createElement("div");w.id="kbWin";document.body.appendChild(w);}
  w.classList.add("open");kbRender();
}
function kbClose(){const w=document.getElementById("kbWin");if(w)w.classList.remove("open");}
function kbRender(){
  const w=document.getElementById("kbWin");if(!w)return;
  const d=KB.d,S=shipData(KB.id);
  w.innerHTML="<div class='kb-head'><b>КБ · ЧЕРТЁЖ «"+(S?S.ru:KB.id).toUpperCase()+"»</b><s>нос вверх · тап по вещи — взять, по клетке — положить · свободная клетка палубы — трюм</s></div>"+
    "<div class='kb-strip'>"+kbNumbers(d)+"</div><canvas class='kb-cv'></canvas>"+
    "<div class='kb-msg'>"+(KB.msg||"&nbsp;")+"</div><div class='kb-tray'></div>"+
    "<div class='kb-acts'><button class='act kb-typ'>ТИПОВОЙ · КАК У ВСЕХ</button><button class='act gold kb-done'>ГОТОВО</button></div>";
  const tray=w.querySelector(".kb-tray");
  d.items.forEach((it,k)=>{
    const b=document.createElement("button");b.className="act kb-it"+(KB.sel===k?" on":"");
    const nm=it.what==="mod"?(MODS[it.kind]?MODS[it.kind].ru:it.kind):(PART_KINDS[it.kind]?PART_KINDS[it.kind].ru:it.kind);
    b.innerHTML="<i style='background:"+(it.what==="mod"?PLAN_ITEM_COL.mod:(PLAN_ITEM_COL[it.kind]||"#fff"))+"'></i>"+nm+"<s>"+it.need+" кл.</s>";
    b.onclick=()=>{KB.sel=KB.sel===k?null:k;KB.msg="";kbRender();};
    tray.appendChild(b);
  });
  const cv=w.querySelector(".kb-cv"),P=d.P;
  const cw=Math.min(340,(typeof innerWidth==="number"?innerWidth:390)-40),s=Math.floor(cw/P.cols),ch=s*P.N;
  const dpr=Math.min(2,window.devicePixelRatio||1);
  cv.style.width=(s*P.cols)+"px";cv.style.height=ch+"px";cv.width=s*P.cols*dpr;cv.height=ch*dpr;
  const c=cv.getContext("2d");if(c){c.setTransform(dpr,0,0,dpr,0,0);kbDraw(c,s,d);}
  cv.onclick=e=>{
    const r=cv.getBoundingClientRect(),j=Math.floor((e.clientX-r.left)/s),i=Math.floor((e.clientY-r.top)/s);
    kbTap(i,j);
  };
  w.querySelector(".kb-typ").onclick=()=>{delete draftAll()[KB.id];KB.d=draftOf(KB.id);KB.sel=null;KB.msg="как у всех";kbRender();};
  w.querySelector(".kb-done").onclick=kbDone;
}
function kbTap(i,j){
  const d=KB.d,q=d.P.cells.find(c=>c.i===i&&c.j===j);if(!q)return;
  const owner=d.items.findIndex(x=>x.cells.indexOf(q)>=0);
  if(KB.sel!=null){
    const it=d.items[KB.sel];
    if(owner===KB.sel){KB.sel=null;KB.msg="";kbRender();return;}
    const no=kbPlace(d,it,q);
    KB.msg=no;if(!no){KB.sel=null;draftSave(KB.id,d);}
    kbRender();return;
  }
  if(owner>=0){KB.sel=owner;KB.msg="";kbRender();return;}
  /* свободная клетка: трюм — да/нет */
  if(q.kind==="deck"||q.kind==="spine"){
    const k=d.hold.indexOf(q);if(k>=0)d.hold.splice(k,1);else d.hold.push(q);
    draftSave(KB.id,d);KB.msg="";
  }else KB.msg="трюм — только внутри, на палубе";
  kbRender();
}
function kbDone(){
  const m=document.querySelector("#kbWin .kb-msg");
  if(m)m.textContent="ваш чертёж 4-й в очереди…";
  setTimeout(()=>{
    const w=document.getElementById("kbWin");if(!w||!w.classList.contains("open"))return;
    const st=document.createElement("div");st.className="kb-stamp";st.textContent="СОГЛАСОВАНО";w.appendChild(st);
    setTimeout(kbClose,900);
  },700);
}
/* синька: прусская лазурь, сетка светлой линией, оттиски охрой, трюм штриховкой */
function kbDraw(c,s,d){
  const P=d.P;
  c.fillStyle="#0f2d52";c.fillRect(0,0,s*P.cols,s*P.N);
  c.strokeStyle="rgba(200,225,255,.12)";c.lineWidth=1;
  for(let i=0;i<=P.N;i++){c.beginPath();c.moveTo(0,i*s+.5);c.lineTo(s*P.cols,i*s+.5);c.stroke();}
  for(let j=0;j<=P.cols;j++){c.beginPath();c.moveTo(j*s+.5,0);c.lineTo(j*s+.5,s*P.N);c.stroke();}
  for(const q of P.cells){
    c.strokeStyle=q.kind==="deck"||q.kind==="spine"?"rgba(220,236,255,.55)":"rgba(255,226,170,.7)";
    c.lineWidth=q.kind==="stern"?2:1.2;c.strokeRect(q.j*s+3,q.i*s+3,s-6,s-6);
  }
  c.strokeStyle="rgba(220,236,255,.35)";c.lineWidth=1;
  for(const q of d.hold){c.save();c.beginPath();c.rect(q.j*s+3,q.i*s+3,s-6,s-6);c.clip();
    for(let k=-s;k<s;k+=6){c.beginPath();c.moveTo(q.j*s+k,q.i*s);c.lineTo(q.j*s+k+s,q.i*s+s);c.stroke();}c.restore();}
  d.items.forEach((it,k)=>{
    const on=KB.sel===k;
    for(const q of it.cells){
      c.fillStyle=on?"rgba(255,214,140,.95)":"rgba(214,160,80,.85)";
      c.fillRect(q.j*s+6,q.i*s+6,s-12,s-12);
    }
    const q=it.cells[0];if(!q)return;
    c.fillStyle="#1a1206";c.font="bold "+Math.max(9,Math.floor(s*.22))+"px ui-monospace,monospace";c.textAlign="center";c.textBaseline="middle";
    const ab={gun:"ОР",shield:"ЩТ",engine:"ДВ",hull:"БР",core:"РК",util:"ПР",missile:"ПУ"}[it.kind]||({engine:"ДВ",tank:"БК",armor:"БР",drill:"БУ",hyper:"ГП",weapon:"РК"}[it.kind]||"?");
    c.fillText(ab,q.j*s+s/2,q.i*s+s/2);
  });
}
