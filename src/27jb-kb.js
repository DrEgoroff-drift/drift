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
/* ── плотности от дальних грузов и доводка (M478, §3; M469 хвост) ──
   Верфь кладёт дальний груз в дело: гелий-3 — котёл плотнее (энергия),
   палладий — контакты приборов (обзор), осмий — броня, магнитная пыль —
   щит. По ступени на единицу груза, три ступени на корпус. Нейтронная
   крошка — доводка вместо узла: модуль вваривают, он работает ступенью выше
   и больше не двигается; два на корпус. Лежит в G.draft[id] (dens, weld):
   без них все множители ровно 1 — старый сейв с теми же числами */
const PLAN_DENS={he3:{k:"en",ru:"КОТЁЛ",step:.12,what:"энергия"},palladium:{k:"see",ru:"ПРИБОРЫ",step:.06,what:"обзор"},
  osmium:{k:"hull",ru:"БРОНЯ",step:.08,what:"корпус"},magdust:{k:"sh",ru:"ЩИТ",step:.12,what:"щит"}};
const PLAN_DENS_MAX=3,PLAN_WELD_MAX=2,PLAN_WELD_FEE=800;
/* ── встроенное верфью (M480, shipyard §4): клетка, которой не нужна вещь ──
   Только на заказанных корпусах (стапель, "sp…"), как и весь характер верфей:
   Хай-Фронт — «дальний захват», прибор в носовой трети, обзор на ступень;
   Орднунг — «лобовой щит в комплекте» на носовой обшивке (его число — та же
   носовая броня +8 % в STAPEL_YARD, клетка её показывает). Встроенное не снимают
   и не двигают; клетку выбирает верфь — самую носовую из тех, что упаковщик не занял */
const KB_FREE={
  hf:{ru:"дальний захват",ab:"ПР",ok:q=>q.nose3,note:"прибор в носу даром · обзор на ступень"},
  or:{ru:"лобовой щит",ab:"ЩТ",ok:q=>q.kind==="nose",note:"щит в комплекте · носовая броня"}
};
function kbFreeBy(id){
  if(!/^sp\d/.test(String(id)))return null;
  const sh=G.uniqueShips&&G.uniqueShips[id];
  return sh&&KB_FREE[sh.by]?sh.by:null;
}
function planDensOf(id){const D=G.draft&&G.draft[id];return (D&&D.dens)||null;}
function planDens(){
  const d=planDensOf(G.shipId),o={en:1,see:1,hull:1,sh:1};if(!d)return planDensFree(o);
  for(const g in PLAN_DENS){const n=d[g]|0;if(n)o[PLAN_DENS[g].k]=1+PLAN_DENS[g].step*n;}
  return planDensFree(o);
}
/* обзор с «дальним захватом» Хай-Фронта — ступень палладия сверху, без груза */
function planDensFree(o){
  if(kbFreeBy(G.shipId)==="hf")o.see*=1+PLAN_DENS.palladium.step;
  return o;
}
function planMods(mods){
  const D=G.draft&&G.draft[G.shipId];if(!D||!D.weld||!D.weld.length)return mods;
  const o=Object.assign({},mods);
  for(const key of D.weld)if(key[0]==="m"){const k=key.slice(1);if((o[k]|0)>0)o[k]=(o[k]|0)+1;}
  return o;
}
function kbWelded(it){const D=G.draft&&G.draft[KB.id||G.shipId];return !!(D&&D.weld&&it&&D.weld.indexOf(it.key)>=0);}
function kbRec(){const A=draftAll();if(!A[KB.id])draftSave(KB.id,KB.d);return A[KB.id];}
function kbDensUp(g){
  const P=PLAN_DENS[g];if(!P)return "";
  const R=kbRec(),d=R.dens||(R.dens={});
  if((d[g]|0)>=PLAN_DENS_MAX)return P.ru+": предел — "+PLAN_DENS_MAX+" ступени";
  if(!((G.cargo[g]|0)>0))return "нет в трюме: "+RES[g].ru.toLowerCase();
  G.cargo[g]--;d[g]=(d[g]|0)+1;
  logAdd("dim","Верфь: "+RES[g].ru.toLowerCase()+" в дело · "+P.ru.toLowerCase()+" плотнее · ступень "+d[g]+" из "+PLAN_DENS_MAX);
  return P.ru+" · ступень "+d[g]+" · "+P.what+" +"+Math.round(P.step*d[g]*100)+"%";
}
function kbWeld(it){
  if(!it||it.what!=="mod")return "вваривают модуль, не часть";
  const R=kbRec(),w=R.weld||(R.weld=[]);
  if(w.indexOf(it.key)>=0)return "уже вварено";
  if(w.length>=PLAN_WELD_MAX)return "доводка: не больше "+PLAN_WELD_MAX+" на корпус";
  if(!((G.cargo.neutron|0)>0))return "нужна нейтронная крошка";
  if(G.credits<PLAN_WELD_FEE)return "доводка стоит "+PLAN_WELD_FEE+" кр";
  G.cargo.neutron--;G.credits-=PLAN_WELD_FEE;w.push(it.key);
  if(typeof afterFitChange==="function")afterFitChange();
  const nm=MODS[it.kind]?MODS[it.kind].ru:it.kind;
  logAdd("money","Доводка: «"+nm+"» вварен · ступенью выше · −"+PLAN_WELD_FEE+" кр и крошка");
  return "вварено: «"+nm+"» — ступенью выше, больше не двигается";
}
/* ── метка новой части (M483, §7): запасная часть из трюма — куда встанет и что
   даст. Слот ищет ОПИСЬ (opisTarget), число — предпросмотр сборки (statPreview);
   показываем самое заметное изменение одной строкой ── */
const KB_DELTA=[["hullMax","КОРПУС",0],["cargoMax","ТРЮМ",0],["fuelMax","БАК",0],["energyMax","ЭНЕРГИЯ",0],
  ["shieldMax","ЩИТ",0],["dmg","УРОН",1],["see","ОБЗОР",0],["thr","ТЯГА",2]];
function kbPartFuture(p){
  if(typeof opisShipFuture!=="function")return null;
  const f=opisShipFuture({t:"part",id:p.id});if(!f||f.slot<0||!f.st)return f?{slot:-1,txt:f.why}:null;
  const s0=stat();let best=null,bv=0;
  const pick=(o,k)=>k==="dps"?((o.gunTot&&o.gunTot.hull)||0):(+o[k]||0);   /* огонь в секунду по корпусу — у стволов */
  for(const [k,ru,dig] of KB_DELTA.concat([["dps","ОГОНЬ/С",1]])){const a=pick(s0,k),b=pick(f.st,k),rel=(b-a)/Math.max(1e-6,Math.abs(a)||1);
    if(Math.abs(rel)>Math.abs(bv)+1e-9){bv=rel;best=[ru,b-a,dig];}}
  const txt=best?best[0]+" "+(best[1]>0?"+":"−")+Math.abs(best[1]).toFixed(best[2]):"без разницы";
  return {slot:f.slot,up:bv>0,txt:txt+(f.cap?" · не хватит места "+f.cap:"")};
}
/* ── ПРОЕКТЫ ×3 (§7): три чертежа на корпус; пустой — упаковщик, «пустой трюм» — без трюма ── */
const KB_PR=["РЕЙСОВЫЙ","БОЕВОЙ","ПУСТОЙ ТРЮМ"];
function kbProjSwitch(k){
  const id=KB.id,A=draftAll(),D=A[id]||{};
  const pr=D.pr||[null,null,null],cur=D.cur|0;if(k===cur)return;
  pr[cur]=D.it?{it:D.it,hold:D.hold}:null;
  const nx=pr[k];
  A[id]=nx?{it:nx.it,hold:nx.hold,pr,cur:k}:(k===2?{hold:[],pr,cur:k}:{pr,cur:k});
  if(D.dens)A[id].dens=D.dens;if(D.weld)A[id].weld=D.weld;
  if(typeof GUN_LIST!=="undefined")GUN_LIST=null;
  KB.d=draftOf(id);KB.sel=null;KB.msg="проект «"+KB_PR[k].toLowerCase()+"»";
}
function draftAll(){return G.draft||(G.draft={});}
/* чертёж корабля: сохранённый — или упаковщик, если правки не было */
function draftOf(id){
  const P=planOf(id),pk=planPack(id,G.fit[id]||{},G.mods||{});
  const D=draftAll()[id],items=[];
  const cellAt=(i,j)=>P.cells.find(q=>q.i===i&&q.j===j)||null;
  /* встроенное верфью (M480): самая носовая подходящая клетка вне упаковщика, ближе к оси */
  let free=null;const fb=kbFreeBy(id);
  if(fb){
    const pu=new Set();for(const it of pk.items)for(const q of it.cells)pu.add(q.i+","+q.j);
    const mid=(P.cols-1)/2,c=P.cells.filter(q=>!pu.has(q.i+","+q.j)&&KB_FREE[fb].ok(q))
      .sort((a,b)=>a.i-b.i||Math.abs(a.j-mid)-Math.abs(b.j-mid));
    if(c.length)free={by:fb,q:c[0]};
  }
  for(const it of pk.items){
    const key=(it.what==="mod"?"m":"p")+(it.what==="mod"?it.kind:it.slot);
    const saved=D&&D.it&&D.it[key];
    let cells=it.cells;
    if(saved&&saved.length===it.need){const c=saved.map(x=>cellAt(x[0],x[1]));if(c.every(Boolean)&&!(free&&c.indexOf(free.q)>=0))cells=c;}
    items.push({...it,key,cells});
  }
  const used=new Set();for(const it of items)for(const q of it.cells)used.add(q);
  if(free)used.add(free.q);
  let hold;
  if(D&&D.hold)hold=D.hold.map(x=>cellAt(x[0],x[1])).filter(q=>q&&!used.has(q));
  else hold=P.cells.filter(q=>!used.has(q)&&(q.kind==="deck"||q.kind==="spine"));
  return {P,items,hold,free};
}
function draftSave(id,d){
  const it={};for(const x of d.items)it[x.key]=x.cells.map(q=>[q.i,q.j]);
  const o=draftAll()[id],rec={it,hold:d.hold.map(q=>[q.i,q.j])};
  if(o&&o.pr){rec.pr=o.pr;rec.cur=o.cur|0;}   /* ПРОЕКТЫ (M477) лежат рядом */
  if(o&&o.dens)rec.dens=o.dens;if(o&&o.weld)rec.weld=o.weld;   /* плотности и доводка — корпуса, не проекта (M478) */
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
  if(kbWelded(it))return "вварено — не двигается";
  const R=kbRule(it);
  if(R&&!R.ok(q))return R.no;
  const busy=new Set();for(const x of d.items)if(x!==it)for(const c of x.cells)busy.add(c);
  if(d.free)busy.add(d.free.q);   /* встроенное верфью не уступает клетку */
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
  return {cells:used+d.hold.length+(d.free?1:0),cargo:st.cargoMax,fuel:st.fuelMax,energy:st.energyMax,mass:F.mass};
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
  if(d.free){const F=KB_FREE[d.free.by],b=document.createElement("button");b.className="act kb-it dim";
    b.innerHTML="<i style='background:#dce8f4'></i>"+capRu(F.ru)+"<s>встроено верфью</s>";
    b.onclick=()=>{KB.msg="«"+F.ru+"» — "+F.note+" · не снимается";kbRender();};tray.appendChild(b);}
  w.querySelectorAll(".kb-p").forEach(b=>b.onclick=()=>{kbProjSwitch(+b.dataset.k);kbRender();});
  /* лоток из трюма (§8): части, что лежат в инвентаре; тап при взятой вещи того же рода — замена на том же месте */
  const inv=w.querySelector(".kb-inv"),selIt=KB.sel!=null?d.items[KB.sel]:null;
  const spare=(G.inv||[]).filter(p=>!isFitted(p.id)).slice(0,12);
  if(spare.length){
    inv.appendChild(el("div","kb-sec","В ТРЮМЕ · "+(selIt&&selIt.what==="part"?"тап — поставить вместо взятой":"возьмите поставленную вещь, чтобы заменить")));
    KB.mark=[];
    for(const p of spare){
      const fits=!!(selIt&&selIt.what==="part"&&selIt.kind===p.kind),F=kbPartFuture(p);
      if(F&&F.up&&F.slot>=0)KB.mark.push(F.slot);   /* метка на чертеже: сюда встанет лучше */
      const b=document.createElement("button");b.className="act kb-it"+(fits||(!selIt&&F&&F.up)?"":" dim");
      b.innerHTML="<i style='background:"+(PLAN_ITEM_COL[p.kind]||"#fff")+"'></i>"+p.name+"<s>"+(PART_KINDS[p.kind]?PART_KINDS[p.kind].ru.toLowerCase():p.kind)+
        (F?" · <b class='"+(F.up?"up":"dn")+"'>"+F.txt+"</b>":"")+"</s>";
      b.onclick=()=>{
        /* ничего не взято — берём то, что стоит в её слоте, и показываем место */
        if(!selIt&&F&&F.slot>=0){const k=d.items.findIndex(x=>x.what==="part"&&x.slot===F.slot);
          if(k>=0){KB.sel=k;KB.msg="сюда: "+F.txt+" · тап по части ещё раз — поставить";kbRender();return;}
          const ok=fitPart(F.slot,p.id);KB.msg=ok?"поставлено в свободный слот: "+p.name:"не встаёт: оснастка полна";
          if(ok)KB.d=draftOf(KB.id);kbRender();return;}
        if(!fits){KB.msg=selIt?"не тот род: нужна «"+(PART_KINDS[selIt.kind]?PART_KINDS[selIt.kind].ru.toLowerCase():selIt.kind)+"»":"сперва возьмите поставленную вещь";kbRender();return;}
        const ok=fitPart(selIt.slot,p.id);
        KB.msg=ok?"поставлено: "+p.name:"не встаёт: подвес мал или оснастка полна";
        if(ok){KB.d=draftOf(KB.id);KB.sel=null;}
        kbRender();
      };
      inv.appendChild(b);
    }
  }
  {
    const box=w.querySelector(".kb-inv"),dn=planDensOf(KB.id)||{};
    box.appendChild(el("div","kb-sec","ДАЛЬНИЕ ГРУЗЫ В ДЕЛО · ПЛОТНОСТЬ"));
    for(const g in PLAN_DENS){const P0=PLAN_DENS[g],n=dn[g]|0,have=G.cargo[g]|0;
      const b=document.createElement("button");b.className="act kb-it"+(have>0&&n<PLAN_DENS_MAX?"":" dim");
      b.innerHTML="<i style='background:"+RES[g].col+"'></i>"+P0.ru+" "+n+"/"+PLAN_DENS_MAX+"<s>"+RES[g].ru.toLowerCase()+" · в трюме "+have+"</s>";
      b.onclick=()=>{KB.msg=kbDensUp(g);kbRender();};box.appendChild(b);}
    if(selIt&&selIt.what==="mod"){
      const b=document.createElement("button");b.className="act kb-it"+((G.cargo.neutron|0)>0&&!kbWelded(selIt)?"":" dim");
      b.innerHTML="<i style='background:"+RES.neutron.col+"'></i>ДОВОДКА · ВВАРИТЬ<s>крошка + "+PLAN_WELD_FEE+" кр</s>";
      b.onclick=()=>{KB.msg=kbWeld(selIt);KB.sel=null;kbRender();};box.appendChild(b);
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
    if(o&&(o.pr||o.dens||o.weld)){const r={};if(o.pr){r.pr=o.pr;r.cur=o.cur|0;}if(o.dens)r.dens=o.dens;if(o.weld)r.weld=o.weld;draftAll()[KB.id]=r;}
    else delete draftAll()[KB.id];   /* проекты, плотности и доводку не стираем (M477–M478) */
    KB.d=draftOf(KB.id);KB.sel=null;KB.msg="как у всех";kbRender();};
  w.querySelector(".kb-done").onclick=kbDone;
}
function kbTap(i,j){
  /* утильсбор (M513): своя верфь не перечерчивает корпус на транзитных номерах */
  if(typeof regPending==="function"&&regPending(KB.id)&&kbYard()===playerFlag()){
    KB.msg="своя верфь не перечерчивает: корпус не на учёте · «сначала номера, потом чертёж»";kbRender();return;}
  const d=KB.d,q=d.P.cells.find(c=>c.i===i&&c.j===j);if(!q)return;
  if(d.free&&q===d.free.q){const F=KB_FREE[d.free.by];KB.msg="встроено верфью · «"+F.ru+"» — "+F.note+" · не снимается";kbRender();return;}
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
  /* встроенное верфью: белёсый оттиск с пунктиром — не охра вещей, её не берут в руки */
  if(d.free){const q=d.free.q;
    c.fillStyle="rgba(214,228,242,.80)";c.fillRect(q.j*s+6,q.i*s+6,s-12,s-12);
    c.strokeStyle="rgba(232,240,255,.95)";c.lineWidth=1.2;c.setLineDash([3,2]);c.strokeRect(q.j*s+3.5,q.i*s+3.5,s-7,s-7);c.setLineDash([]);
    c.fillStyle="#0f2d52";c.font="bold "+Math.max(9,Math.floor(s*.22))+"px ui-monospace,monospace";c.textAlign="center";c.textBaseline="middle";
    c.fillText(KB_FREE[d.free.by].ab,q.j*s+s/2,q.i*s+s/2);}
  d.items.forEach((it,k)=>{
    const on=KB.sel===k;
    for(const q of it.cells){
      c.fillStyle=on?"rgba(255,214,140,.95)":"rgba(214,160,80,.85)";
      c.fillRect(q.j*s+6,q.i*s+6,s-12,s-12);
    }
    if(KB.mark&&it.what==="part"&&KB.mark.indexOf(it.slot)>=0){c.strokeStyle="rgba(143,208,138,.95)";c.lineWidth=2;c.setLineDash([4,3]);
      for(const q of it.cells)c.strokeRect(q.j*s+1.5,q.i*s+1.5,s-3,s-3);c.setLineDash([]);}   /* метка новой части (M483) */
    if(kbWelded(it)){c.strokeStyle="rgba(232,240,255,.95)";c.lineWidth=1.5;c.setLineDash([2,2]);
      for(const q of it.cells)c.strokeRect(q.j*s+4,q.i*s+4,s-8,s-8);c.setLineDash([]);}   /* шов доводки */
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
