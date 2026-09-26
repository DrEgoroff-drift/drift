/* ══════════════ дальние залежи в игре: выемка, прибор, ЖИЛА (M466, DESIGN-resources §3) ══════════════
   Залежь — функция зерна (06d); хранится только выбранное: G.farTaken
   {"sx,sy,k": единиц}. Глаголы, что уже есть, отдают дальний товар своими
   кусками мира — пояс камнями, шахта рудными телами, заборник долей сбора, —
   и всё это из СВОЕГО потока случайности (0xFA13): состав старых поясов,
   стволов и заходов не едет.

   Прибор показывает залежь диапазоном, «осмий: 40–160», и диапазон сужается
   по классу корпуса — правило честности профессий (03f): изыскатель ±10 %,
   рудовоз ±60 %, остальные ±35 %. Врать прибор не умеет: правда всегда внутри
   диапазона, просто середина сдвинута зерном. ЖИЛА объявляется на месте, при
   первой выемке: слово через экран — единственный раз, когда игра кричит, — и
   строка на борту. */
const FAR_TAKE_SALT=0xFA13;
function farTakenAll(){return G.farTaken||(G.farTaken={});}
function farKey(sx,sy,k){return sx+","+sy+","+k;}
function farLeft(sx,sy,d){return Math.max(0,d.units-(farTakenAll()[farKey(sx,sy,d.k)]|0));}
/* залежи текущей системы у этого места: kind — "belt" или индекс планеты */
function farHere(kind){
  if(!G.sys)return [];
  return farDeposits(G.sx,G.sy).filter(d=>
    kind==="belt"?d.place.kind==="belt":(d.place.kind==="planet"&&d.place.i===kind));
}
function farPlanetIdx(p){return G.sys&&G.sys.planets?G.sys.planets.indexOf(p):-1;}
/* взять n единиц дальнего товара k из залежи текущей системы */
function farTake(k,n){
  if(!n||!RES[k]||!RES[k].far)return;
  const key=farKey(G.sx,G.sy,k),T=farTakenAll(),first=!(T[key]>0);
  T[key]=(T[key]|0)+n;
  if(first){
    const d=farDeposits(G.sx,G.sy).find(x=>x.k===k);
    if(d&&d.grade===3){farVein(d);if(typeof rushStart==="function")rushStart(G.sx,G.sy);}   /* ажиотаж на дороге (M504) */
  }
}
/* ── прибор: честный диапазон ── */
function farSpread(){
  const r=(typeof hullRole==="function")?hullRole():null,id=r&&r.id;
  const e=id==="survey"?.10:id==="ore"?.60:.35;
  return G.tech&&G.tech.has("lens")?e/2:e;   /* линза тёмного стекла — вдвое тоньше (M466) */
}
function farReading(d){
  const left=farLeft(G.sx,G.sy,d),e=farSpread();
  const off=(h01(G.sx*31+G.sy,d.units,FAR_TAKE_SALT)-.5)*e;    /* середина сдвинута, правда — внутри */
  const c=left*(1+off);
  return {lo:Math.max(0,Math.floor(c*(1-e))),hi:Math.ceil(c*(1+e)),left};
}
function farReadLine(list){
  return list.filter(d=>farLeft(G.sx,G.sy,d)>0).map(d=>{
    const R=farReading(d);
    return RES[d.k].ru.toLowerCase()+": "+(R.lo===R.hi?R.lo:R.lo+"–"+R.hi);
  }).join(" · ");
}
/* табличка прибора на входе (D12): залежь — шкалой, диапазон — полосой. Ширина
   полосы и есть честность прибора: у изыскателя узкая, у рудовоза во всю шкалу */
function farReadShow(list){
  if(typeof document==="undefined"||!document.body)return false;
  const L=list.filter(d=>farLeft(G.sx,G.sy,d)>0);if(!L.length)return false;
  const old=document.getElementById("farRead");if(old)old.remove();
  const e=farSpread(),pct=Math.round(e*100);
  const lens=!!(G.tech&&G.tech.has("lens")),e0=lens?e*2:e;
  const who=(e0<=.1?"изыскатель":e0>=.6?"рудовоз":"прибор борта")+(lens?" · линза":"");
  let h="<div class='fr-h'><b>ПРИБОР · ЗАЛЕЖЬ</b><s>"+who+" · ±"+pct+" %</s></div>";
  for(const d of L){
    const R=farReading(d),mx=Math.max(1,R.hi*1.25),a=R.lo/mx*100,w=Math.max(1.5,(R.hi-R.lo)/mx*100);
    h+="<div class='fr-row' style='--c:"+RES[d.k].col+"'><b>"+RES[d.k].ru+"</b><span class='fr-bar'><i style='left:"+a.toFixed(1)+
      "%;width:"+w.toFixed(1)+"%'></i></span><em>"+(R.lo===R.hi?R.lo:R.lo+"–"+R.hi)+"</em></div>";
  }
  const el0=document.createElement("div");el0.id="farRead";el0.innerHTML=h;
  document.body.appendChild(el0);
  setTimeout(()=>{if(el0.parentNode)el0.remove();},6500);
  return true;
}
/* ── ЖИЛА: слово через экран, строка на борту ── */
function farVein(d){
  logAdd("good","ЖИЛА · "+RES[d.k].ru+" · сектор "+G.sx+":"+G.sy+" · по прибору — на двадцать трюмов");
  if(typeof document==="undefined"||!document.body)return;
  const old=document.getElementById("stampFx");if(old)old.remove();
  const el=document.createElement("div");el.id="stampFx";el.className="stp-fx stp-vein";
  el.style.setProperty("--tilt","-4deg");
  el.innerHTML="<div class='l0'>ЖИЛА</div><div class='l1'>"+RES[d.k].ru.toUpperCase()+"</div>";
  document.body.appendChild(el);
  setTimeout(()=>{if(el.parentNode)el.remove();},1300);
}
/* ── пояс: часть камней — дальнего товара ── */
function farBeltDress(ast,B){
  const list=farHere("belt");
  list.forEach((d,di)=>{
    let left=farLeft(G.sx,G.sy,d);if(left<=0)return;
    const r=rng((hashi(B.seed,di,FAR_TAKE_SALT))>>>0);
    const want=Math.min(Math.floor(ast.length*.35),Math.ceil(left/16));
    for(let n=0,guard=0;n<want&&left>0&&guard<ast.length*3;guard++){
      const a=ast[Math.floor(r()*ast.length)];
      if(RES[a.res].far||RES[a.res].rare)continue;
      a.res=d.k;a.oreCol=hexRGB(RES[d.k].col);a.left=Math.min(left,8+Math.floor(r()*24));
      left-=a.left;n++;
    }
  });
}
/* ── шахта: часть рудных тел — дальнего товара ── */
function farDigNode(D,nc,nr,node){
  if(!node)return node;
  const pi=farPlanetIdx(D.p);if(pi<0)return node;
  const list=farHere(pi).filter(d=>{const v=RES[d.k].far.verb;return v==="mine"||v==="drill";});
  if(!list.length)return node;
  const r=rng(hashi(D.p.seed+nc*7717,nr*5381,FAR_TAKE_SALT));
  if(r()>=.3)return node;
  const d=list[Math.floor(r()*list.length)];
  if(farLeft(G.sx,G.sy,d)<=0)return node;
  node.res=d.k;return node;
}
/* ── заборник: каждая третья единица сбора — дальний газ, пока он есть ── */
function farScoopPick(S){
  const pi=farPlanetIdx(S.p);if(pi<0)return null;
  const d=farHere(pi).find(x=>RES[x.k].far.verb==="scoop"&&farLeft(G.sx,G.sy,x)>0);
  if(!d)return null;
  S.farN=(S.farN|0)+1;
  return S.farN%3===0?d.k:null;
}
/* ── охота: жемчуг пустоты — с образца (M466) ──
   Зверь, что носит жемчуг, водится там же, где флора (06d): оглушили, взяли
   образец — и в образце пара зёрен, пока залежь не выбрана. Живым в клетку
   (M496) жемчуг не отдаёт: зверь едет на ферму целым */
function farHunt(p,bx,by){
  const pi=farPlanetIdx(p);if(pi<0)return 0;
  const d=farHere(pi).find(x=>RES[x.k].far.verb==="fauna"&&farLeft(G.sx,G.sy,x)>0);
  if(!d)return 0;
  const r=rng(hashi(Math.round(bx),Math.round(by),FAR_TAKE_SALT^0x9EA1));
  if(r()>=.6)return 0;
  const got=addRes(d.k,Math.min(farLeft(G.sx,G.sy,d),2+Math.floor(r()*5)));
  if(got)farTake(d.k,got);
  return got;
}
/* ── пещера: янтарь натёками по концам ходов (M466) ──
   Места — своим потоком от зерна пещеры; сколько натёков — по остатку залежи,
   так что выбранная пещера в следующий раз беднее. Берётся сам, подойдя */
function farCaveAmber(C,p){
  const pi=farPlanetIdx(p);if(pi<0)return [];
  const d=farHere(pi).find(x=>RES[x.k].far.verb==="cave");
  if(!d)return [];
  let left=farLeft(G.sx,G.sy,d);if(left<=0)return [];
  const r=rng(hashi(C.seed,d.units,FAR_TAKE_SALT)),out=[];
  const spots=(C.branchEnds||[]).map(e=>({x:e.x,y:e.y}));
  for(let i=0;i<6;i++){const low=r()<.5,x=380+r()*(CAVE_W-700);spots.push({x,y:low?caveLowY(C,x):caveGalY(C,x)});}
  const n=Math.min(spots.length,Math.ceil(left/9));
  for(let i=0;i<n&&left>0;i++){
    const s=spots[Math.floor(r()*spots.length)],y=caveScanDown(C,s.x,s.y-30);
    if(y>=CAVE_Y1-10)continue;
    const u=Math.min(left,4+Math.floor(r()*9));left-=u;
    out.push({k:"amber",x:s.x,y,u,res:d.k,seed:(r()*1e9)|0});
  }
  return out;
}
function farCaveAmberTake(C){
  for(const a of C.props||[]){
    if(a.k!=="amber"||a.took||Math.hypot(a.x-C.x,a.y-C.y)>34)continue;
    const got=addRes(a.res,a.u);
    if(!got){G.prompt="ТРЮМ ПОЛОН · ЯНТАРЬ ОСТАЁТСЯ";return;}
    a.took=true;farTake(a.res,got);sfx("drill");
    tell("good",RES[a.res].ru+" ×"+got+" · натёк со стены",RES[a.res].ru.toUpperCase()+"\n×"+got+"\nнатёк со стены пещеры");
    return;
  }
}
/* ── ЖИЛА в пересказе (M466, DESIGN-resources §3) ──
   Прогремевшая жила — это выбранная залежь третьего сорта: G.farTaken уже
   помнит её, нового поля в записи нет. Через сводку (смену) о ней говорят на
   ближних станциях, и с тех пор на подходе к системе есть компания. Пока
   сводка не вышла — молчат: время удара знает ажиотаж (G.rush, 18j) */
function farVeinsKnown(){
  const out=[],T=G.farTaken||{};
  for(const key in T){
    if(!(T[key]>0))continue;
    const [sx,sy,k]=key.split(",");const x=+sx,y=+sy;
    const d=farDeposits(x,y).find(q=>q.k===k);
    if(!d||d.grade!==3)continue;
    const R=G.rush;
    if(R&&R.sx===x&&R.sy===y&&typeof HOLD_SHIFT==="number"&&now()<R.until-(RUSH_SHIFTS-1)*HOLD_SHIFT)continue;
    out.push({sx:x,sy:y,k});
  }
  return out;
}
/* слух на станции в двенадцати секторах от жилы; свой поток — чужие слухи не едут */
function farVeinRumour(){
  if(!G.sys)return null;
  const V=farVeinsKnown().filter(v=>Math.max(Math.abs(v.sx-G.sx),Math.abs(v.sy-G.sy))<=12);
  if(!V.length)return null;
  const r=rng(hashi(rumourSeedHere(),V.length,0xFA14)),v=V[Math.floor(r()*V.length)];
  const rad=2,q={id:"vein",sx:v.sx,sy:v.sy,rad,wrong:false,
    img:"жила — "+RES[v.k].ru.toLowerCase()+", говорят, на двадцать трюмов",src:"старатель у стойки",
    det:"сам не видел, но кружку за неё поднимали трижды"};
  q.where=rumourWhere(q);
  q.text="Старатель у стойки рассказывал про жилу: "+RES[v.k].ru.toLowerCase()+". "+capRu(q.where)+". "+capRu(q.det)+".";
  q.lines=["Жила · "+RES[v.k].ru,capRu(q.where),"со слов: старатель у стойки — "+q.det];
  q.short="жила, "+RES[v.k].ru.toLowerCase()+" — где-то у сектора "+v.sx+":"+v.sy;
  return q;
}
/* компания на подходе: в системе прогремевшей жилы один-два лишних борта */
function farVeinCompany(sx,sy,r){
  if(!farVeinsKnown().some(v=>v.sx===sx&&v.sy===sy))return 0;
  return 1+(r()<.5?1:0);
}
