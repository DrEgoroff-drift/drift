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
function mapTW(t){return hangTW(ctx.font,String(t));}
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
  else if(poor)L=[nm,what,mapDryWord(cost),pk+more],verb=2;   /* «НЕ ХВАТИТ ТОПЛИВА: 48 из 30» — числа в самой причине */
  else L=[nm,what,(onRoute?"ПРЫЖОК ПО МАРШРУТУ · ":"ПРЫЖОК · ")+cost+" топлива","останется "+Math.round(G.fuel-cost)+" · "+pk+more],verb=2;
  /* телефон: имя и глагол с ценой — две строки встают сбоку от выбора; подробности — в подвале нет,
     во второй тап (карточка) */
  if(W<=760&&L.length>2){L=[L[0],L[verb==null?1:verb]];verb=verb==null?undefined:1;}
  ovHang("map.sel",L,sel.x,sel.y,{r:rr+21,verb,spare:1});   /* spare: у кромки — запасной бок, съезд вдоль звезды и перенос строк (08bj) */
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
  /* ряд миров выбора (Q.orb) табличке не преграда: она главнее, шары лежат под ней в сцене, а сам ряд
     уходит от её рамки (mapOrbFan) — иначе на тесном кадре ряд занимал её место и вылезали запасные */
  for(let i=0;i<n0;i++){const Q=MAP_INK[i];if((!hung||!Q.fb)&&!Q.orb)B(Q.x0,Q.y0,Q.x1,Q.y1);}
  for(const b of MAP_BOX)if(!hung||b.s!=="подвал слева · выбор")B(b.x,b.y,b.x+b.w,b.y+b.h);
  for(const d of MAP_DOMR)if(!hung||d.sel!=="#prompt")B(d.r.left,d.r.top,d.r.right,d.r.bottom);
}
/* ── планеты выбранной системы — шарами 17gab (M822b) ──
   До сих пор планет на карте не было вовсе — только «N планет» строкой. Теперь у выбора — ряд его
   миров по порядку орбит от кольца прицела: ближний к звезде — первым, гигант крупнее камня (корень
   отношения радиусов), кольцо гиганта — тем же броском, что в системе. Свет — от самой выбранной
   звезды: её цвет, направление на неё в кадре (а не звезда, у которой стоите вы). Ряд — чернила
   карты: подписи мира его обходят. Табличка у выбора главнее ряда: для неё ряд не преграда, а ряд
   ложится туда, где не задевает её рамку прошлого кадра (avoid). Вниз от звезды; не влез над полом
   карты или там табличка — вверх; не влез и так (телефон, звезда у кромки) — вбок, к середине кадра. Шары только у выбора:
   всё небо шарами — шум и цена. mapOrbFan — чистая раскладка (её мерит 91qk-map), mapOrbsDraw — рисунок */
/* rMin 6: мельче свет и ночь на шаре не читаются — выходил плоский кружок (Контроль 22.10); разница миров —
   в промежутке rMin…rMax, гигант всегда крупнее камня */
const MAP_ORB={rMin:6,rMax:10,gap:4,lz:.8};
function mapOrbInk(p){const P=p.type==="gas"?GOR_GAS[(h01(p.seed|0,3,0x6A5)*GOR_GAS.length)|0]:(p.T&&p.T.pal)||[[150,160,170]],c=P[Math.min(3,P.length-1)];
  return "rgba("+c[0]+","+c[1]+","+c[2]+",.92)";}
/* avoid — рамка таблички выбора прошлого кадра; you — то, что держит место «вы»: плашка «ВЫ» этого кадра и
   кольцо вашей звезды. Всё это ряду преграда, табличка главнее: не обойти всё — ряд уступает табличке, потом
   «вы». Восемь ходов: вниз, вверх, вбок к середине, от середины, затем четыре косых — у пола телефона прямые
   либо не влезают, либо идут сквозь «ВЫ» (Контроль 22.10, 390 у пола). Каждый шар мерится своей рамкой.
   Не нашлось чистого хода — второй заход плотным рядом: все миры по rMin и без колец (flat), он короче
   вдвое и встаёт вбок там, где полный упирался в борт; лучше ровный ряд, чем шары под табличкой */
function mapOrbFan(sel,cell,avoid,you){
  const s=sel.s,P=(s.planets||[]);if(!P.length)return [];
  const rr=1.8+s.cls.t*2.2,U=mapU(),big=clamp(cell*.2,MAP_ORB.rMin+2,MAP_ORB.rMax)*Math.min(U,1.4);
  const mR=Math.max(...P.map(p=>p.radius||1));
  const L=P.map(p=>{const r=MAP_ORB.rMin+(big-MAP_ORB.rMin)*Math.sqrt((p.radius||1)/mR),ring=planetRing(p);
    return {p,r,ext:ring&&r>5?r*ring.o:r};}),Lc=P.map(p=>({p,r:MAP_ORB.rMin,ext:MAP_ORB.rMin,flat:1}));
  const r0=rr+24*U,g=MAP_ORB.gap*U,x0=8*U,y0=8*U,x1=mapRail(),y1=mapDeck();
  const lay=(D,M)=>{let d=r0;return (M||L).map(o=>{d+=o.ext;const f={p:o.p,r:o.r,ext:o.ext,flat:o.flat,x:sel.x+D[0]*d,y:sel.y+D[1]*d,dx:D[0],dy:D[1]};d+=o.ext+g;return f;});};
  const fits=F=>F.every(f=>f.x-f.ext>=x0&&f.x+f.ext<=x1&&f.y-f.ext>=y0&&f.y+f.ext<=y1);
  const clear=(F,R)=>!R||F.every(f=>f.x+f.ext+g<=R.x0||f.x-f.ext-g>=R.x1||f.y+f.ext+g<=R.y0||f.y-f.ext-g>=R.y1);
  const A=[].concat(you||[]).filter(Boolean),free=F=>A.every(R=>clear(F,R));
  const side=sel.x<(x0+x1)/2?1:-1,q=Math.SQRT1_2;
  const DIR=[[0,1],[0,-1],[side,0],[-side,0],[side*q,q],[side*q,-q],[-side*q,q],[-side*q,-q]];
  const C=DIR.map(D=>lay(D)).filter(fits),Cc=DIR.map(D=>lay(D,Lc)).filter(fits),pl=F=>clear(F,avoid),both=F=>pl(F)&&free(F);
  return C.find(both)||Cc.find(both)||C.find(pl)||Cc.find(pl)||C.find(free)||Cc.find(free)||C[0]||Cc[0]||lay([0,sel.y<(y0+y1)/2?1:-1]);
}
function mapOrbsDraw(sel,cell,you){
  const HL=HANG.last.find(e=>e.id==="map.sel"),F=mapOrbFan(sel,cell,HL&&HL.r,you);if(!F.length)return F;
  const c=hex2rgb(sel.s.cls.col||"#ffe08a"),m=Math.max(1,c[0],c[1],c[2]),sun=[c[0]/m,c[1]/m,c[2]/m];
  const a=F[0],b=F[F.length-1],U=mapU();
  /* ось ряда — волосок от кольца прицела до последнего мира: ряд читается схемой системы */
  const l0=MPN.lay;MPN.lay="u";   /* ось — в сцену, под шары; прицел и слова над ними — в слое интерфейса */
  mpLine(a.x-a.dx*(a.ext+4*U),a.y-a.dy*(a.ext+4*U),b.x,b.y,1,"rgba(207,227,234,.22)");
  mpFlush();MPN.lay=l0;
  for(const f of F){
    const lx=sel.x-f.x,ly=sel.y-f.y,l=Math.hypot(lx,ly)||1;
    /* запасной диск — пока конвейер своего рода собирается (первые кадры) или ?orb=0: цветом мира, не серым */
    if(!(GOR.on&&gpuOrb(f.p,f.x,f.y,f.r,0,{sun,lit:[lx/l,ly/l],lz:MAP_ORB.lz,key:"m",noRing:f.flat})))mpDisc(f.x,f.y,f.r,mapOrbInk(f.p));
    mapInkBox(f.x-f.ext-2,f.y-f.ext-2,f.ext*2+4,f.ext*2+4);MAP_INK[MAP_INK.length-1].orb=1;
  }
  return F;
}
