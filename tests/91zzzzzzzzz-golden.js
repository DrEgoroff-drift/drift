/* ══════════════ золотые кадры: пятый оракул (M443, DESIGN-tests §3.2) ══════════════
   Четыре детектора судят кадр законами — не пуст, не выжжен, текст читается.
   Закон не видит, что планета стала на треть меньше или у корабля пропал
   хвост: это не нарушение, это ДРУГОЙ кадр. Пятый оракул сравнивает кадр
   сцены с эталоном, снятым раньше, и краснеет на разнице — а человек смотрит
   только на список сцен, которые разошлись, и решает: баг или новый эталон.

   Эталон — не картинка, а подпись: кадр в четверть (detGrab, 320 по ширине)
   режется на блоки 8×8 копии (32×32 холста в окне 1280), от каждого блока
   хранится средняя яркость — один байт. Сцена в окне — килобайт с небольшим;
   пятнадцать сцен на три окна — под сотню килобайт текста, и никакого PNG в
   гите (правило про картинки в CLAUDE.md). Средняя по блоку глушит то, что
   разнится между машинами честно: сглаживание шрифтов, зерно, дождь.

   Порог — два числа: блок «разошёлся», если его яркость ушла больше чем на
   GOLD_TOL из 255; сцена красная, если разошлось больше GOLD_SHARE блоков.
   Числа стартовые, их правит история лаборатории (§3.6): набор в карантине
   до 2026-09-18, и до тех пор его провалы печатаются, но вердикт не решают.

   Эталоны лежат в docs/golden/<W>x<H>.json и вшиваются сборкой константой
   GOLDEN (build.ps1): страница с file:// сама их не прочтёт. Окно без
   эталона — не провал: набор печатает, что снимать, и кладёт снятое в
   <pre id="golden">; `test.ps1 -Accept` забирает его оттуда и пишет файл.
   Так же принимают новый эталон после нарочной правки картинки. */
const GOLD_BW=8,GOLD_TOL=18,GOLD_SHARE=.03;
function goldSig(L){
  const nx=Math.floor(L.w/GOLD_BW),ny=Math.floor(L.h/GOLD_BW);
  let s="";
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
    let a=0;
    for(let y=j*GOLD_BW;y<j*GOLD_BW+GOLD_BW;y++)for(let x=i*GOLD_BW;x<i*GOLD_BW+GOLD_BW;x++)a+=L[y*L.w+x];
    s+=Math.min(255,Math.round(a/(GOLD_BW*GOLD_BW))).toString(16).padStart(2,"0");
  }
  return {w:nx,h:ny,k:+(L.k*GOLD_BW).toFixed(2),b:s};
}
function goldCmp(g,s){
  if(g.w!==s.w||g.h!==s.h)return {diff:1,where:["сетка "+g.w+"×"+g.h+" против "+s.w+"×"+s.h]};
  const n=g.w*g.h,bad=[];
  for(let i=0;i<n;i++){
    const d=Math.abs(parseInt(g.b.substr(i*2,2),16)-parseInt(s.b.substr(i*2,2),16));
    if(d>GOLD_TOL)bad.push([i,d]);
  }
  bad.sort((a,b)=>b[1]-a[1]);
  const where=bad.slice(0,3).map(([i,d])=>Math.round(((i%g.w)+.5)*s.k)+","+Math.round((Math.floor(i/g.w)+.5)*s.k)+"±"+d);
  return {diff:bad.length/n,where};
}

TEST_SUITES.push(()=>suite("золотые кадры: каждая сцена против своего эталона в этом окне",{tier:"browser",stage:"новый оракул, порог по истории лаборатории, до 2026-09-18"},()=>{
  const key=W+"x"+H,base=GOLDEN[key]||null;
  const accept=/[?&]accept=1/.test(location.search);
  const snap=JSON.parse(JSON.stringify(snapshot()));
  const fresh={},bad=[],missing=[];let n=0;
  try{
    for(const sc of lookScenes()){
      resetWorld();
      let up=true;try{up=sc.set()!==false;}catch(e){up=false;}
      if(!up||G.mode==="none")continue;
      detSettle(6,2);
      const sig=goldSig(detGrab());
      fresh[sc.id]=sig;n++;
      const g=base&&base[sc.id];
      if(!g){missing.push(sc.id);continue;}
      const r=goldCmp(g,sig);
      if(r.diff>GOLD_SHARE)bad.push(sc.id+": разошлось "+(r.diff*100).toFixed(1)+"% блоков @"+r.where.join(" "));
    }
  }finally{
    T.calm();try{applySave(snap);}catch(e){}
    G.mode="system";G.land=null;G.surf=null;G.dig=null;G.cave=null;G.base=null;G.hin=null;
    resetWorld();
  }
  ok(n>=12,"сцен снято "+n+" в окне "+key+(base?"":" — эталона для этого окна нет: test.ps1 -Accept снимет его"));
  /* снятое — в разметку: -Accept забирает отсюда; без эталона кладём всегда */
  if(accept||!base){
    const pre=document.createElement("pre");pre.id="golden";pre.hidden=true;pre.setAttribute("data-key",key);
    /* по сцене на строку: разница эталонов в гите читается глазами */
    pre.textContent="{\n"+Object.keys(fresh).map(k=>JSON.stringify(k)+":"+JSON.stringify(fresh[k])).join(",\n")+"\n}\n";
    document.body.appendChild(pre);
  }
  if(base){
    eq(bad.join(" ;; "),"","кадры сцен те же, что в эталоне (допуск "+GOLD_TOL+"/255 на блок, "+(GOLD_SHARE*100)+"% блоков)");
    if(missing.length)note("сцен без эталона в этом окне: "+missing.join(", ")+" — test.ps1 -Accept");
  }
}));
