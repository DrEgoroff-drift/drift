/* ══════════════ слой #ovl: фишки у кромки и подписи мира на видеокарте (08bi, docs/DESIGN-gpu.md §G) ══════════════
   Атлас масок вытесняет слой, которого дольше всех не касались (LRU по кадру); 600 кадров ровного
   полёта — ни одной строки в растр после разгона; пустой слой спрятан; подпись, которой нет 600 кадров,
   забыта. Ворота «0 вызовов 2D» у слоя — в 91zzzzzzy3 */
TEST_SUITES.push(()=>suite("слой #ovl: атлас LRU, 600 кадров без растра, пустой спрятан",{tier:"browser"},()=>{
  if(!ok(GPU.ok&&!!GPU.dev,"видеокарта есть"))return;
  /* LRU: свой атлас на время проверки, 4 слоя по 4 маски 500² */
  const A0=OVL.A,f0=OVL.fno,A=OVL.A={dev:null,tex:null,view:null,L:4,S:1024,pg:[],map:new Map(),cur:0,ev:0,thr:0};
  try{
    const mk=()=>({w:500,h:500,ox:0,oy:0,a:new Uint8Array(250000)}),add=k=>ovAtlas(k,mk);
    for(let l=0;l<4;l++){OVL.fno=100+l;for(let j=0;j<4;j++)add("k"+(l*4+j));}
    eq(A.pg.map(p=>p.keys.length).join(),"4,4,4,4","16 масок легли по четыре на слой");
    OVL.fno=104;add("k0");eq(A.ev,0,"касание готовой маски не растрит и не вытесняет");
    add("k16");
    ok(A.map.has("k0")&&!A.map.has("k4")&&A.map.has("k8"),"вытеснен слой, которого дольше всех не касались (второй), а не первый, тронутый только что");
    eq(A.ev+"/"+A.thr,"1/0","одно вытеснение, без трёпки в кадре");
  }finally{if(A.tex)GPU.trash.push(A.tex);OVL.A=A0;OVL.fno=f0;}
  /* 600 кадров ровного полёта: подписи и фишки в кадре, строк в растр — только в разгоне */
  resetWorld();G.mode="system";
  const st=gate2dChips();if(!ok(!!st,"сцена с фишкой и подписью нашлась"))return;
  /* растр после разгона честен только в кадре, где на слое появился новый текст (луна въехала в кадр,
     число сменилось); строка, которую уже растрили, второй раз не растрится */
  const run0=G.running,loop0=LOOP_OFF,at0=ovAtlas,late=[],made=new Set(),texts=new Set();
  G.running=true;LOOP_OFF=false;let t=wallMs(),seen=0,i=0,dup=0,fresh=false;
  window.ovAtlas=function(k,mk){if(!OVL.A.map.has(k)){if(made.has(k))dup++;made.add(k);if(i>=30)late.push(i);}return at0(k,mk);};
  try{
    const bad=[];
    for(i=0;i<600;i++){gate2dChips();const n0=late.length;frameBody(t+=16.7);
      fresh=false;for(const M of [OVL.lab,OVL.chip])for(const e of M.values())if(e.on&&!texts.has(e.s)){texts.add(e.s);fresh=true;}
      if(late.length>n0&&!fresh)bad.push(i);
      if(OVL.on&&OVL.nl>0&&[...OVL.chip.values()].some(e=>e.on))seen++;}
    window.ovAtlas=at0;
    eq(dup,0,"600 кадров — ни одна строка не растрилась дважды");
    eq(bad.length,0,"после разгона растр только в кадре с новым текстом ("+late.length+" строк за "+texts.size+" текстов)"+(bad.length?": кадры "+bad.slice(0,5).join(","):""));
    ok(seen>=570,"слой горел с подписями и фишками ("+seen+" из 600)");
    const keys=[...OVL.lab.keys()];
    /* мир без подписей и фишек (чистый кадр заглавной) — слой спрятан; 600 кадров — подписи забыты */
    G.running=false;for(let i=0;i<3;i++)frameBody(t+=16.7);
    ok(!OVL.on&&OVL.cv&&OVL.cv.style.display==="none","пустой слой спрятан (display:none — композитор его не сводит)");
    const f1=OVL.fno+601;OVL.fno=f1;frameBody(t+=16.7);
    ok(OVL.fno>f1&&keys.length>0&&keys.every(k=>!OVL.lab.has(k)),"подпись, которой не было 600 кадров, забыта ("+keys.length+")");
  }finally{window.ovAtlas=at0;G.running=run0;LOOP_OFF=loop0;resetWorld();}
}));
