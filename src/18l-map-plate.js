/* ══════════════ карта: веса и таблички (M822) ══════════════
   Вынесено из 18-mode-map: три веса пера, лицо и мера строк состояния, табличка у выбранной
   системы. Всё здесь зовётся из кадра, на верхнем уровне никто не читает — порядок склейки
   после 18-mode-map ничего не ломает. */
/* три веса карты (M822): «вы» — вы, выбранная система и курс к ней; путь — круг прыжка, связи в его
   пределах, свой маршрут; остальное — сетка, кольца, владения, слухи, флот, чужие линии, бирки.
   Вес — множитель пера (mpWeight, 17z4): остальное читается фоном, на котором видно вас и выбор */
const MAP_W={you:1,route:.8,rest:.42};
/* лицо строк состояния — то же, что у табличек у вещи (HANG.FACE, M720), а не моноширинный */
/* ширина строки так, как её положит перо: на видеокарте слой ставит цифры моноширинно по «0» (hangTW,
   08bj) — строка из цифр шире, чем мерит ctx, и вылетала из своей плашки на 7 px (зрение, 390) */
function mapTW(t){return MPN.gpu?hangTW(ctx.font,String(t)):ctx.measureText(t).width;}
function mapFace(px,b){ctx.font=(b?"600 ":"")+Math.max(8,px*mapU()).toFixed(1)+"px "+HANG.FACE;}
/* ── табличка у выбранной системы (M822, закон L5: слова висят на вещи) ──
   Что это, дотянусь ли и что будет по ДЕЙСТВИЮ — у самой звезды, материалом «Борта», глагол акцентом.
   Подсказка внизу кадра и подпись на середине курса этим кадром не нужны: строка #prompt гаснет, пока
   табличка висит (27z, mapHintHung), а кнопка ДЕЙСТВИЯ берёт глагол из G.prompt, как прежде */
function mapSelHang(sel,dsel,cost,st){
  const s=sel.s,rr=1.8+s.cls.t*2.2,far=dsel>st.jump+.02,poor=!far&&cost>G.fuel;
  const nm=((typeof nameOf==="function")?nameOf(s):s.name).toUpperCase();
  const what=s.cls.ru+" · "+s.planets.length+" "+pl3(s.planets.length,"планета","планеты","планет")+(s.station?" · станция":"")+(s.belt?" · пояс":"");
  const NX=(typeof routeNext==="function"&&routeOf().legs.length>=2)?routeNext():null;
  const onRoute=NX&&NX.sys.sx===G.sel.x&&NX.sys.sy===G.sel.y;
  const pk=dsel.toFixed(1).replace(".",",")+" пк",more=G.mapMore?"":" · ещё тап — подробнее";
  let L,verb;
  if(dsel===0){L=["ВЫ ЗДЕСЬ · "+nm,what,"тап по звезде — курс"];verb=undefined;}
  else if(far){const n=Math.ceil(dsel/Math.max(.5,st.jump));
    L=[nm,what,"ВНЕ РАДИУСА · "+n+" "+pl3(n,"прыжок","прыжка","прыжков"),pk+more];verb=2;}
  else if(poor)L=[nm,what,"НЕ ХВАТАЕТ ТОПЛИВА · "+cost,"в баке "+Math.round(G.fuel)+" · "+pk+more],verb=2;
  else L=[nm,what,(onRoute?"ПРЫЖОК ПО МАРШРУТУ · ":"ПРЫЖОК · ")+cost+" топлива","останется "+Math.round(G.fuel-cost)+" · "+pk+more],verb=2;
  /* телефон: имя и глагол с ценой — две строки встают сбоку от выбора; подробности — в подвале нет,
     во второй тап (карточка) */
  if(W<=760&&L.length>2){L=[L[0],L[verb==null?1:verb]];verb=verb==null?undefined:1;}
  ovHang("map.sel",L,sel.x,sel.y,{r:rr+21,verb});
}
/* табличка у выбора висела в прошлом кадре — подсказке внизу молчать (27z) */
function mapHintHung(){return G.mode==="map"&&HANG.last.some(e=>e.id==="map.sel");}
/* пунктир курса — от кромки вашего кольца и из-за вашей плашки до кольца прицела: линия не протыкает
   ни кольца, ни слова */
function mapCourseDash(cur,sel,youR,far,col){
  const x0=cur.x,y0=cur.y,x1=sel.x,y1=sel.y,L=Math.hypot(x1-x0,y1-y0),cr=cur.edge?0:(cur.rr||4)+16,sr=1.8+sel.s.cls.t*2.2+11;
  let t0=Math.min(.5,cr/L);const t1=Math.max(t0,1-sr/L);
  if(youR&&!cur.edge){let last=-1;
    for(let t=t0;t<t1;t+=1/128){const qx=x0+(x1-x0)*t,qy=y0+(y1-y0)*t;if(qx>=youR.x0&&qx<=youR.x1&&qy>=youR.y0&&qy<=youR.y1)last=t;}
    if(last>=0)t0=last+1/128;}
  if(t1>t0)mpDash(x0+(x1-x0)*t0,y0+(y1-y0)*t0,x0+(x1-x0)*t1,y0+(y1-y0)*t1,far?1:1.4,col,far?[2,6]:[7,5]);
}
/* табличка у выбора главнее подписей мира: те встают после неё, на её рамку прошлого кадра. Сама она
   обходит только то, что останется, когда она висит: свои метки, линейки, шапку, вёрстку поверх листа, —
   но не запасные к ней строки (подсказку #prompt, строки выбора в подвале, подпись на курсе): они гаснут,
   едва она встала, и держать её место им нельзя — иначе на тесном кадре табличка не встаёт никогда,
   потому что её не пускают её же запасные. mapSelInk — до слива подписей (возвращает, сколько чернил
   было своих), mapSelBlock — после */
function mapSelInk(){
  const n0=MAP_INK.length,HL=HANG.last.find(e=>e.id==="map.sel");
  if(HL&&HL.r)mapInkBox(HL.r.x0-4,HL.r.y0-4,HL.r.x1-HL.r.x0+8,HL.r.y1-HL.r.y0+8);
  return n0;
}
/* hung — табличка у выбора висит: её запасные (подвал выбора, подпись курса, #prompt) не держат места.
   Не висит (M826: на карте висит только сообщение) — держат: они на листе */
function mapSelBlock(n0,hung){
  const n=ovNd(),B=(x0,y0,x1,y1)=>hangBlock(x0*n,y0*n,x1*n,y1*n);
  for(let i=0;i<n0;i++){const Q=MAP_INK[i];if(!hung||!Q.fb)B(Q.x0,Q.y0,Q.x1,Q.y1);}
  for(const b of MAP_BOX)if(!hung||b.s!=="подвал слева · выбор")B(b.x,b.y,b.x+b.w,b.y+b.h);
  for(const d of MAP_DOMR)if(!hung||d.sel!=="#prompt")B(d.r.left,d.r.top,d.r.right,d.r.bottom);
}
