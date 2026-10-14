/* ══════════════ сиды: законы земли на многих мирах (лаборатория, 15.10) ══════════════ */
/* Автор, 15.10: «каждый раз захожу в игру и что-то нахожу». Законы опоры (91qk) мерят одну тестовую
   планету — а брак живёт на той, куда сел игрок. Фазз по зёрнам (research top-10 №1): тот же порядок
   постройки, что у захода (19-mode-landing: рельеф → постройки → крупные формы → вещи земли → лента),
   на двух десятках твёрдых миров разных систем, и пять законов на каждом:
   — числа: лента конечна и в разумных пределах (NaN в высоте — дыра в мире);
   — площадка: под кораблём ровно (±.25 м) и сухо, постройка не сдвинула её отметку;
   — опора: человек ступает по нарисованной земле (как 91qk, но на каждом мире);
   — тесно: устье пещеры, памятники и площадка не стоят друг на друге;
   — залежь: каждая доступна — не под кораблём (там действие у корабля) и не на устье. */
function seedWorlds(n){
  const W=[],seen={};
  for(let k=0;W.length<n&&k<400;k++){
    const sx=(k*7)%41-20,sy=Math.floor(k*7/41)*3-12,S=getSystem(sx,sy);
    for(const p of S.planets){
      if(p.type==="gas"||W.length>=n)continue;
      const key=p.type+(p.mix||"");
      if((seen[key]|0)>=3)continue;                 /* разные породы, а не двадцать пустынь */
      seen[key]=(seen[key]|0)+1;W.push({sx,sy,p});
    }
  }
  return W;
}
function seedLand(w){
  G.sx=w.sx;G.sy=w.sy;G.sys=getSystem(w.sx,w.sy);
  const p=w.p,tr=genTerrain(p),padY0=tr.padY;
  genPOI(tr,p);genDeco(tr,p);
  const g=surfGen(tr,p),L=plnLandMake(tr,p,tr.padX);
  return {p,tr,g,L,padY0,name:p.type+(p.mix?"/"+p.mix:"")+"#"+(p.seed>>>0)};
}
TEST_SUITES.push(()=>suite("сиды: земля, площадка, опора и тесноты на двадцати мирах",{tier:"node"},()=>{
  resetWorld();
  const sx0=G.sx,sy0=G.sy,sys0=G.sys,Wd=seedWorlds(20),bad={числа:[],площадка:[],опора:[],тесно:[],залежь:[],сбой:[]};
  const put=(k,s)=>{if(bad[k].length<3)bad[k].push(s);else bad[k].n=(bad[k].n||3)+1;};
  const zone=shipZoneR();
  for(const w of Wd){
    let X;
    try{X=seedLand(w);}catch(e){put("сбой",w.p.type+"#"+(w.p.seed>>>0)+": "+String(e&&e.message||e).slice(0,80));continue;}
    const {tr,g,L,name}=X,Wt=waterOf(tr,w.p);
    /* числа */
    let nan=0,big=0;
    for(let i=0;i<L.T.length;i+=7){const v=L.T[i];if(!isFinite(v))nan++;else if(Math.abs(v)>3000)big++;}
    for(let xu=100;xu<tr.W-100;xu+=301)for(const z of [-20,-4,0,3,9,30]){const v=plnLandRibAt(L,xu/PLN_M,z);if(!isFinite(v))nan++;}
    if(nan||big)put("числа",name+": не числа "+nan+", за 3 км "+big);
    /* площадка: корабль стоит на z=7 (shipZ), опоры — в паре метров вокруг */
    let lo=1e9,hi=-1e9;
    for(let dx=-3;dx<=3;dx+=.5)for(const z of [5,7,9]){const v=plnLandRibAt(L,L.shipX+dx,z);lo=Math.min(lo,v);hi=Math.max(hi,v);}
    const moved=Math.abs(groundAt(tr,tr.padX)-X.padY0)/PLN_M;
    if(hi-lo>.5)put("площадка",name+": перепад под кораблём "+(hi-lo).toFixed(2)+" м");
    if(moved>.3)put("площадка",name+": постройка сдвинула площадку на "+moved.toFixed(1)+" м");
    if(Wt&&tr.padX>Wt.x0-zone&&tr.padX<Wt.x1+zone)put("площадка",name+": корабль в воде (площадка x="+Math.round(tr.padX)+", вода "+
      Math.round(Wt.x0)+"…"+Math.round(Wt.x1)+", уровень выше площадки на "+((Wt.y<tr.padY?tr.padY-Wt.y:0)/PLN_M).toFixed(1)+" м)");
    /* опора человека */
    let n=0,off=0,worst=0;
    for(let xu=200;xu<tr.W-200;xu+=53){
      if(Wt&&xu>Wt.x0-40&&xu<Wt.x1+40)continue;
      const d=(tr.padY-groundAt(tr,xu))/PLN_M-plnLandRibAt(L,xu/PLN_M,0);
      n++;if(Math.abs(d)>.15)off++;if(Math.abs(d)>Math.abs(worst))worst=d;
    }
    if(off>.02*n)put("опора",name+": мимо земли "+off+" из "+n+", до "+worst.toFixed(2)+" м");
    /* тесно */
    const cx=g.cave&&g.cave.x;
    if(cx!=null&&Math.abs(cx-tr.padX)<zone*2.5)put("тесно",name+": устье пещеры в "+Math.round(Math.abs(cx-tr.padX))+" от площадки");
    for(const q of tr.poi||[]){
      if(Math.abs(q.x-tr.padX)<400)put("тесно",name+": "+q.k+" в "+Math.round(Math.abs(q.x-tr.padX))+" от площадки");
      if(cx!=null&&Math.abs(q.x-cx)<120)put("тесно",name+": "+q.k+" на устье пещеры ("+Math.round(Math.abs(q.x-cx))+")");
    }
    /* залежь */
    for(const d of g.deposits){
      if(Math.abs(d.x-tr.padX)<zone)put("залежь",name+": залежь №"+d.i+" под кораблём ("+Math.round(Math.abs(d.x-tr.padX))+" < "+Math.round(zone)+")");
      if(!isFinite(d.y))put("числа",name+": залежь без высоты");
    }
  }
  G.sx=sx0;G.sy=sy0;G.sys=sys0;
  ok(Wd.length>=16,"миров собрано: "+Wd.length+" ("+Wd.map(w=>w.p.type).join(",")+")");
  for(const k in bad)ok(!bad[k].length,k+": "+bad[k].length+(bad[k].n?"+"+(bad[k].n-3):"")+" — "+bad[k].join("; "));
  resetWorld();
}));
