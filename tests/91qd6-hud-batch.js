/* ══════════════ вёрстка HUD при смене режима: переменные на читателях (24.10, телефон) ══════════════ */
/* Своя переменная в стиле корня или <body> пересчитывает стиль всей страницы, и чтение рамки после записи платит
   этот пересчёт: кадр смены режима на S23 платил два-три таких по 5,5–9 мс (тестер, раунды 13–16). Переменные
   раскладки HUD (--padsh, --hudband, --railw, --conx, --mapbar, --rackbot, --helmlift) лежат на своих читателях
   (08a1). Мерила: hud при смене «карта ↔ система» не пишет своих переменных ни в корень, ни в <body>; каждый узел,
   чьё правило в таблице стилей читает такую переменную, видит её нынешнее значение; плашка, рождённая после
   записи, получает значения сразу */
TEST_SUITES.push(()=>suite("вёрстка HUD при смене режима: переменные на читателях",{tier:"browser"},()=>{
  resetWorld();G.mode="system";
  const RS=document.documentElement.style,BS=document.body.style,SP=CSSStyleDeclaration.prototype.setProperty;
  let wide=[];
  const flip=mode=>{G.mode=mode;if(mode==="map"){G.sel.x=G.sx;G.sel.y=G.sy;}
    drawWorld();wide=[];
    try{
      CSSStyleDeclaration.prototype.setProperty=function(k,v){
        if((this===RS||this===BS)&&String(k).startsWith("--")&&this.getPropertyValue(k)!==String(v))wide.push(k);
        return SP.apply(this,arguments);};
      hud();
    }finally{CSSStyleDeclaration.prototype.setProperty=SP;}
    return wide.join(",");};
  /* правила таблицы, читающие переменную k: на каждом совпавшем узле — нынешнее значение */
  const law=()=>{const bad=[],n={};
    const walk=rules=>{for(const r of rules){
      if(!r.selectorText){if(r.cssRules)walk(r.cssRules);continue;}
      for(const k in HUDV_SEL){
        if(HUDV[k]===undefined||!r.style.cssText.includes("var("+k))continue;
        const sel=r.selectorText.replace(/::?(before|after|placeholder|-webkit-[\w-]+)/g,"");
        for(const e of document.querySelectorAll(sel)){n[k]=(n[k]||0)+1;
          const v=getComputedStyle(e).getPropertyValue(k).trim();if(v!==HUDV[k])bad.push(sel+" "+k+"="+(v||"нет"));}}}};
    for(const s of document.styleSheets)walk(s.cssRules);
    return {bad,n};};
  /* плашка, рождённая заново: старую снимаем, новую сверяем и убираем, старую возвращаем */
  const reborn=(id,make)=>{const old=document.getElementById(id);if(old)old.remove();
    const e=make(),miss=[];
    try{for(const k in HUDV)if(e.matches(HUDV_SEL[k])&&e.style.getPropertyValue(k)!==HUDV[k])miss.push(k);}
    finally{e.remove();if(old)document.body.appendChild(old);}
    return miss.join(",");};
  try{
    for(let i=0;i<3;i++){drawWorld();hud();}
    const a=flip("map"),b=flip("system");
    ok(a==="","система → карта: своих переменных в корень или <body> — "+(a||"ни одной"));
    ok(b==="","карта → система: своих переменных в корень или <body> — "+(b||"ни одной"));
    padsFit();
    for(const k of ["--padsh","--hudband","--railw","--mapbar"])
      ok(HUDV[k]!==undefined&&RS.getPropertyValue(k)===""&&BS.getPropertyValue(k)==="",k+" записана ("+HUDV[k]+") и не в корне, не в <body>");
    const L=law();
    ok(!L.bad.length,"читатели в таблице стилей видят переменные: "+(L.bad.slice(0,6).join("; ")||"все"));
    ok((L.n["--padsh"]||0)>=4&&(L.n["--railw"]||0)>=1&&(L.n["--hudband"]||0)>=2,"сверка дошла до узлов: "+JSON.stringify(L.n));
    ok(document.getElementById("msg").style.getPropertyValue("--mapbar")==="0px","на системе строка сообщения не держит отступ карты");
    const w=reborn("wanwin",wanPanel),m=reborn("mapaddr",mapAddrBox);
    const og=GOT.el;GOT.el=null;let g;
    try{g=reborn("gotwin",gotEl);}finally{GOT.el=og;}
    ok(w===""&&m===""&&g==="","рождённые плашки берут значения сразу (сорока «"+w+"», адрес «"+m+"», добыча «"+g+"»)");
    ok(HUD_FLOOR>0&&HUD_FLOOR<=viewH()&&HUD_RAIL>0&&HUD_RAIL<=viewW(),"пол и борт сняты ("+HUD_FLOOR+", "+HUD_RAIL+")");
  }finally{G.mode="system";}
}));
