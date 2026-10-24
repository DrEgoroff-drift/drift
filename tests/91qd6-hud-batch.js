/* ══════════════ вёрстка HUD при смене режима: чтения пачкой (24.10, телефон) ══════════════ */
/* 27z hudFloorMeasure: запись переменной в корень (--padsh, --hudband, --railw, --mapbar) пересчитывает стиль всей
   страницы, и чтение рамки или стиля сразу после неё платит этот пересчёт. Кадр прилёта на S23 платил четыре таких
   (тестер, раунд 13–14: 1,3–4,5 мс каждый). Теперь чтения идут заходом до записей, второй заход — только по
   сдвинутому, --mapbar пишется в конце hud, обёртка пещеры (22d) берёт рамки плашек из первого захода.
   Мерило — сколько раз hud при смене «карта ↔ система» читает вёрстку после свежей записи в корень */
TEST_SUITES.push(()=>suite("вёрстка HUD при смене режима: чтения пачкой",{tier:"browser"},()=>{
  resetWorld();G.mode="system";
  const RS=document.documentElement.style,GB=Element.prototype.getBoundingClientRect,GC=window.getComputedStyle,SP=CSSStyleDeclaration.prototype.setProperty;
  let dirty=false,paid=0;
  const read=()=>{if(dirty){paid++;dirty=false;}};
  const flip=mode=>{G.mode=mode;if(mode==="map"){G.sel.x=G.sx;G.sel.y=G.sy;}
    drawWorld();dirty=false;paid=0;
    try{
      Element.prototype.getBoundingClientRect=function(){read();return GB.call(this);};
      window.getComputedStyle=function(){read();return GC.apply(window,arguments);};
      CSSStyleDeclaration.prototype.setProperty=function(k,v){if(this===RS&&this.getPropertyValue(k)!==String(v))dirty=true;return SP.apply(this,arguments);};
      hud();
    }finally{Element.prototype.getBoundingClientRect=GB;window.getComputedStyle=GC;CSSStyleDeclaration.prototype.setProperty=SP;}
    return paid;};
  try{
    for(let i=0;i<3;i++){drawWorld();hud();}
    const a=flip("map"),b=flip("system");
    ok(a<=2,"система → карта: чтений после записи в корень "+a+" (не больше двух: после ряда пэдов и по сдвинутому)");
    ok(b<=2,"карта → система: чтений после записи в корень "+b);
    ok(RS.getPropertyValue("--mapbar")==="0px","на системе строка сообщения не держит отступ карты (--mapbar "+RS.getPropertyValue("--mapbar")+")");
    ok(HUD_FLOOR>0&&HUD_FLOOR<=viewH()&&HUD_RAIL>0&&HUD_RAIL<=viewW(),"пол и борт сняты ("+HUD_FLOOR+", "+HUD_RAIL+")");
  }finally{G.mode="system";}
}));
