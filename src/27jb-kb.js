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
  gun:{ok:q=>q.kind==="nose"||q.kind==="side"||q.kind==="spine",no:"орудие — на обшивку или на хребет (башня)"},
  m_armor:{ok:q=>q.kind==="side"||q.kind==="nose",no:"броня — по обшивке"}
};
const KB={sel:null,msg:"",id:null};
/* ── формы (§3, M477): 1 — клетка, 2 — две в линию (поворачивается), 4 — квадрат.
   Верфь Орднунга работает по формуляру: формы не поворачивает ── */
function kbShape(need,turn){return need===4?[[0,0],[0,1],[1,0],[1,1]]:need===2?(turn?[[0,0],[1,0]]:[[0,0],[0,1]]):[[0,0]];}
function kbTurnOf(it){const c=it.cells;return c.length===2&&c[1].i!==c[0].i?1:0;}
function kbYard(){return (typeof stampOwnerAt==="function")?stampOwnerAt(G.sx,G.sy):null;}
/* чужая верфь (не ваш флаг) берёт за каждую переложенную клетку */
const KB_CELL_FEE=12;
function kbForeign(){const y=kbYard();return !!y&&y!==((typeof playerFlag==="function")?playerFlag():"gt");}
function kbCellMap(d){const m={};for(const x of d.items)for(const q of x.cells)m[q.i+","+q.j]=x.key;for(const q of d.hold)m[q.i+","+q.j]="трюм";return m;}
function kbMoved(){
  if(!KB.map0||!KB.d)return 0;
  const a=KB.map0,b=kbCellMap(KB.d);let n=0;
  for(const k in a)if(a[k]!==b[k])n++;
  for(const k in b)if(!(k in a))n++;
  return n;
}
/* ── ПРОЕКТЫ ×3 (§7): три чертежа на корпус; пустой — упаковщик, «пустой трюм» — без трюма ── */
const KB_PR=["РЕЙСОВЫЙ","БОЕВОЙ","ПУСТОЙ ТРЮМ"];
function kbProjSwitch(k){
  const id=KB.id,A=draftAll(),D=A[id]||{};
  const pr=D.pr||[null,null,null],cur=D.cur|0;if(k===cur)return;
  pr[cur]=D.it?{it:D.it,hold:D.hold}:null;
  const nx=pr[k];
  A[id]=nx?{it:nx.it,hold:nx.hold,pr,cur:k}:(k===2?{hold:[],pr,cur:k}:{pr,cur:k});
  if(typeof GUN_LIST!=="undefined")GUN_LIST=null;
  KB.d=draftOf(id);KB.sel=null;KB.msg="проект «"+KB_PR[k].toLowerCase()+"»";
}
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
  const o=draftAll()[id],rec={it,hold:d.hold.map(q=>[q.i,q.j])};
  if(o&&o.pr){rec.pr=o.pr;rec.cur=o.cur|0;}   /* ПРОЕКТЫ (M477) лежат рядом */
  draftAll()[id]=rec;
  if(typeof GUN_LIST!=="undefined")GUN_LIST=null;   /* подвес мог стать башней (M479) */
}
/* орудие этого слота стоит на хребте? — тогда это башня: {x,y} клетки в координатах корпуса */
function draftTowerAt(id,slot){
  const D=G.draft&&G.draft[id],c=D&&D.it&&D.it["p"+slot];
  if(!c||!c.length)return null;
  const P=planOf(id),q=P.cells.find(x=>x.i===c[0][0]&&x.j===c[0][1]);
  return q&&q.kind==="spine"?{x:q.x,y:q.y}:null;
}
function kbRule(it){return KB_RULE[(it.what==="mod"?"m_":"")+it.kind]||null;}
/* положить вещь якорем в клетку q: остальные клетки — ближайшие свободные, где правило пускает */
function kbPlace(d,it,q,turn){
  const R=kbRule(it);
  if(R&&!R.ok(q))return R.no;
  const busy=new Set();for(const x of d.items)if(x!==it)for(const c of x.cells)busy.add(c);
  if(busy.has(q))return "клетка занята";
  /* форма вещи от клетки-якоря (M477): 2 — в линию, как повёрнута; 4 — квадрат */
  const cells=[];
  for(const o of kbShape(it.need,turn==null?kbTurnOf(it):turn)){
    const c=d.P.cells.find(x=>x.i===q.i+o[0]&&x.j===q.j+o[1]);
    if(!c)return "не влезает: форма выходит за корпус";
    if(busy.has(c))return "не влезает: клетка занята";
    if(R&&!R.ok(c))return R.no;
    cells.push(c);
  }
  if(cells.length<it.need)return "не влезает: нужно клеток "+it.need;
  it.cells=cells;
  d.hold=d.hold.filter(c=>cells.indexOf(c)<0);
  return "";
}
function kbNums(d){
  const used=d.items.reduce((a,x)=>a+x.cells.length,0),st=stat(),F=planFactors();
  return {cells:used+d.hold.length,cargo:st.cargoMax,fuel:st.fuelMax,energy:st.energyMax,mass:F.mass};
}
/* полоска чисел (§8): каждое — цветом разницы с чертежом, каким он был на входе в КБ */
function kbNumbers(d){
  const n=kbNums(d),b=KB.base||n;
  const one=(lab,v,v0,fmt)=>{const dv=v-v0,c=Math.abs(dv)<1e-6?"":dv>0?"up":"dn";
    return lab+" <b class='"+c+"'>"+fmt(v)+(c?" ("+(dv>0?"+":"−")+fmt(Math.abs(dv))+")":"")+"</b>";};
  const I=v=>String(Math.round(v)),X=v=>v.toFixed(2);
  return one("ЯЧЕЙКИ",n.cells,b.cells,I)+"/"+d.P.cells.length+" · "+one("ТРЮМ",n.cargo,b.cargo,I)+" · "+one("БАК",n.fuel,b.fuel,I)+
    " · "+one("ЭНЕРГИЯ",n.energy,b.energy,I)+" · "+one("РАЗГОН ×",n.mass,b.mass,X);
}
/* ── экран ── */
function kbOpen(){
  KB.id=G.shipId;KB.sel=null;KB.msg="";KB.d=draftOf(KB.id);
  KB.base=kbNums(KB.d);KB.map0=kbCellMap(KB.d);KB.orig=JSON.stringify(draftAll()[KB.id]||null);
  let w=document.getElementById("kbWin");
  if(!w){w=document.createElement("div");w.id="kbWin";document.body.appendChild(w);}
  w.classList.add("open");kbRender();
}
function kbClose(){const w=document.getElementById("kbWin");if(w)w.classList.remove("open");}
function kbRender(){
  const w=document.getElementById("kbWin");if(!w)return;
  const d=KB.d,S=shipData(KB.id);
  const D0=draftAll()[KB.id],cur=D0&&D0.pr?D0.cur|0:0,fo=kbForeign(),mv=kbMoved();
  w.innerHTML="<div class='kb-head'><b>КБ · ЧЕРТЁЖ «"+(S?S.ru:KB.id).toUpperCase()+"»</b><s>нос вверх · тап по вещи — взять, по клетке — положить, по взятой ещё раз — повернуть · свободная клетка палубы — трюм</s></div>"+
    "<div class='kb-pr'>"+KB_PR.map((n,k)=>"<button class='act sm kb-p"+(k===cur?" on":"")+"' data-k='"+k+"'>"+n+"</button>").join("")+"</div>"+
    "<div class='kb-strip'>"+kbNumbers(d)+"</div>"+
    (fo?"<div class='kb-bill'>ВЕРФЬ «"+(STAMP_RU[kbYard()]||kbYard()).toUpperCase()+"» · ЧУЖАЯ · "+KB_CELL_FEE+" КР ЗА КЛЕТКУ · ПЕРЕЛОЖЕНО "+mv+" · К ОПЛАТЕ "+mv*KB_CELL_FEE+" КР</div>":"")+
    "<canvas class='kb-cv'></canvas>"+
    "<div class='kb-msg'>"+(KB.msg||"&nbsp;")+"</div><div class='kb-tray'></div><div class='kb-inv'></div>"+
    "<div class='kb-acts'><button class='act kb-typ'>ТИПОВОЙ · КАК У ВСЕХ</button><button class='act gold kb-done'>ГОТОВО</button></div>";
  const tray=w.querySelector(".kb-tray");
  d.items.forEach((it,k)=>{
    const b=document.createElement("button");b.className="act kb-it"+(KB.sel===k?" on":"");
    const nm=it.what==="mod"?(MODS[it.kind]?MODS[it.kind].ru:it.kind):(PART_KINDS[it.kind]?PART_KINDS[it.kind].ru:it.kind);
    b.innerHTML="<i style='background:"+(it.what==="mod"?PLAN_ITEM_COL.mod:(PLAN_ITEM_COL[it.kind]||"#fff"))+"'></i>"+nm+"<s>"+it.need+" кл.</s>";
    b.onclick=()=>{KB.sel=KB.sel===k?null:k;KB.msg="";kbRender();};
    tray.appendChild(b);
  });
  w.querySelectorAll(".kb-p").forEach(b=>b.onclick=()=>{kbProjSwitch(+b.dataset.k);kbRender();});
  /* лоток из трюма (§8): части, что лежат в инвентаре; тап при взятой вещи того же рода — замена на том же месте */
  const inv=w.querySelector(".kb-inv"),selIt=KB.sel!=null?d.items[KB.sel]:null;
  const spare=(G.inv||[]).filter(p=>!isFitted(p.id)).slice(0,12);
  if(spare.length){
    inv.appendChild(el("div","kb-sec","В ТРЮМЕ · "+(selIt&&selIt.what==="part"?"тап — поставить вместо взятой":"возьмите поставленную вещь, чтобы заменить")));
    for(const p of spare){
      const fits=!!(selIt&&selIt.what==="part"&&selIt.kind===p.kind);
      const b=document.createElement("button");b.className="act kb-it"+(fits?"":" dim");
      b.innerHTML="<i style='background:"+(PLAN_ITEM_COL[p.kind]||"#fff")+"'></i>"+p.name+"<s>"+(PART_KINDS[p.kind]?PART_KINDS[p.kind].ru.toLowerCase():p.kind)+"</s>";
      b.onclick=()=>{
        if(!fits){KB.msg=selIt?"не тот род: нужна «"+(PART_KINDS[selIt.kind]?PART_KINDS[selIt.kind].ru.toLowerCase():selIt.kind)+"»":"сперва возьмите поставленную вещь";kbRender();return;}
        const ok=fitPart(selIt.slot,p.id);
        KB.msg=ok?"поставлено: "+p.name:"не встаёт: подвес мал или оснастка полна";
        if(ok){KB.d=draftOf(KB.id);KB.sel=null;}
        kbRender();
      };
      inv.appendChild(b);
    }
  }
  const cv=w.querySelector(".kb-cv"),P=d.P;
  const cw=Math.min(340,(typeof innerWidth==="number"?innerWidth:390)-40),s=Math.floor(cw/P.cols),ch=s*P.N;
  const dpr=Math.min(2,window.devicePixelRatio||1);
  cv.style.width=(s*P.cols)+"px";cv.style.height=ch+"px";
  /* план КБ печётся на видеокарте (27i0): кисть та же, канва WebGPU */
  panelGpu(cv,s*P.cols,ch,dpr,c=>kbDraw(c,s,d));
  cv.onclick=e=>{
    const r=cv.getBoundingClientRect(),j=Math.floor((e.clientX-r.left)/s),i=Math.floor((e.clientY-r.top)/s);
    kbTap(i,j);
  };
  w.querySelector(".kb-typ").onclick=()=>{const o=draftAll()[KB.id];
    if(o&&o.pr)draftAll()[KB.id]={pr:o.pr,cur:o.cur|0};else delete draftAll()[KB.id];   /* проекты не стираем (M477) */
    KB.d=draftOf(KB.id);KB.sel=null;KB.msg="как у всех";kbRender();};
  w.querySelector(".kb-done").onclick=kbDone;
}
function kbTap(i,j){
  const d=KB.d,q=d.P.cells.find(c=>c.i===i&&c.j===j);if(!q)return;
  const owner=d.items.findIndex(x=>x.cells.indexOf(q)>=0);
  if(KB.sel!=null){
    const it=d.items[KB.sel];
    if(owner===KB.sel){
      /* по взятой ещё раз — повернуть (M477); по формуляру Орднунга — нельзя */
      if(it.need===2){
        if(kbYard()==="or")KB.msg="поворот не предусмотрен формуляром";
        else{const no=kbPlace(d,it,it.cells[0],1-kbTurnOf(it));KB.msg=no||"повёрнуто";if(!no)draftSave(KB.id,d);}
      }else{KB.sel=null;KB.msg="";}
      kbRender();return;
    }
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
  /* чужая верфь выставляет счёт за переложенные клетки (M477); нечем платить — чертёж откатывают */
  const fee=kbForeign()?kbMoved()*KB_CELL_FEE:0;
  if(fee>0){
    if(G.credits<fee){
      const o=JSON.parse(KB.orig||"null");if(o)draftAll()[KB.id]=o;else delete draftAll()[KB.id];
      if(typeof GUN_LIST!=="undefined")GUN_LIST=null;
      KB.d=draftOf(KB.id);KB.sel=null;KB.msg="не хватает "+fee+" кр — чертёж вернули как был";kbRender();return;
    }
    G.credits-=fee;
    logAdd("money","Верфь «"+(STAMP_RU[kbYard()]||kbYard())+"»: переложено "+(fee/KB_CELL_FEE)+" клеток · −"+fee+" кр");
    KB.map0=kbCellMap(KB.d);
  }
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
  c.strokeStyle="rgba(120,226,150,.75)";c.lineWidth=1.2;   /* трюм — зелёный, как обещает легенда (M476) */
  for(const q of d.hold){c.fillStyle="rgba(80,190,110,.24)";c.fillRect(q.j*s+3,q.i*s+3,s-6,s-6);
    c.save();c.beginPath();c.rect(q.j*s+3,q.i*s+3,s-6,s-6);c.clip();
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
/* ── числа от чертежа (M478, DESIGN-shipyard §3) ──
   Неподвижная точка: пока чертёж не правили — оба множителя ровно 1, и у
   старого сейва ни одно число не сдвинулось. Правка двигает два числа:
   трюм = клетки трюма × плотность, откалиброванная так, что типовой чертёж даёт
   сегодняшний трюм, потолок ×1.4 (торговля не ломается); тяга и поворот — от
   массы плана (вещь — клетка, пустой трюм — полклетки) против типового,
   зажато в .8…1.1 (чувство руля P8 не разваливается). */
const PLAN_F={key:"",v:{cargo:1,mass:1}};
function planFactors(){
  const id=G.shipId,D=G.draft&&G.draft[id];
  if(!D)return {cargo:1,mass:1};
  const key=id+"|"+JSON.stringify(D)+"|"+JSON.stringify(G.fit[id]||{})+"|"+JSON.stringify(G.mods||{});
  if(PLAN_F.key===key)return PLAN_F.v;
  const d=draftOf(id),t=planPack(id,G.fit[id]||{},G.mods||{});
  const mass=pk=>pk.items.reduce((a,x)=>a+x.cells.length,0)+pk.hold.length*.5;
  const cargo=t.hold.length?clamp(d.hold.length/t.hold.length,0,1.4):1;
  const m=clamp(Math.sqrt(Math.max(1,mass(t))/Math.max(1,mass(d))),.8,1.1);
  PLAN_F.key=key;PLAN_F.v={cargo,mass:m};
  return PLAN_F.v;
}
