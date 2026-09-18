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
  return id==="survey"?.10:id==="ore"?.60:.35;
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
