/* ══════════════ стойка: товар ящиками (M811, docs/DESIGN-hall.md §8) ══════════════
   Что в таблице рынка — то лежит на стойке перед пилотом: ящик на строку, в том же порядке. Есть в трюме —
   ящик полон по количеству; нет — пуст, видно дно. Строка под мышью или пальцем зажигает свой ящик:
   плашка товара на боку горит его цветом, над ящиком — малый свет того же тона.
   Сетка ящиков — своя, по ключу (тип, груз, горящий), сетку зала не трогает. */
const HALL_GOODS={mesh:null,key:"",hot:null};
/* строки таблицы рынка (26e stTabMarket): торговые всегда, дальние — когда лежат в трюме */
function hallGoodsKeys(){const c=(G&&G.cargo)||{};return TRADE_KEYS.concat(FAR_KEYS.filter(k=>(c[k]||0)>0));}
/* место ящика: два ряда поперёк стойки, от ближнего к камере конца к хозяину */
function hallGoodsAt(i){return [i&1?-4.97:-5.4,1.02,2.32-.33*(i>>1)];}
function hallGoodsCol(k){return hex2rgb(RES[k].col);}
const HALL_GOODS_ACC=[255,106,43];   /* --c-acc плиты: подсветка строки и обвязка её ящика — один цвет */
/* трафарет на доске: цвет ромба таблицы, приглушённый до насыщенности s (HSV) и чуть темнее — краска впиталась */
function hallStencil(c,s){const mx=Math.max(c[0],c[1],c[2]),mn=Math.min(c[0],c[1],c[2]),sat=mx>0?(mx-mn)/mx:0,k=sat>s?s/sat:1;
  return c.map(v=>Math.round((mx-(mx-v)*k)*.82));}
function hallGoodsMesh(keys){
  const K=r3Kit(),P=R3P,c=(G&&G.cargo)||{},w=.15,h=.065;K.flags=2;   /* ящики — тела под резкостью */   /* мелкий лоток: камера смотрит на стойку почти вдоль, глубокий ящик прятал товар */
  const Wd=K.mt([136,94,56],.3,6,P.wood),In=K.mt([70,50,34],.15,4,P.wood);
  keys.slice(0,12).forEach((k,i)=>{const [x,y,z]=hallGoodsAt(i),q=c[k]||0,col=hallGoodsCol(k),hot=HALL_GOODS.hot===k;
    K.box([x,y+.008,z],[w,.008,w],In,.002);   /* дно */
    for(const s of [-1,1]){K.box([x+s*(w-.008),y+h,z],[.008,h,w],Wd,.003);K.box([x,y+h,z+s*(w-.008)],[w-.016,h,.008],Wd,.003);}
    K.box([x,y+h*1.25,z+w+.001],[w*.98,.012,.003],In,0);K.box([x+w+.001,y+h*1.25,z],[.003,.012,w*.98],In,0);   /* планка обвязки */
    if(q>0){const f=clamp(q/24,.15,1),hh=(2*h-.03)*(.6+.4*f),Mg=K.mt(col,k==="ice"?.6:.32,k==="ice"?12:7,k==="ice"?P.glass:0);
      K.box([x,y+.016+hh/2,z],[w-.016,hh/2,w-.016],Mg,.01);K.ell([x,y+.016+hh,z],[w-.026,.02+.05*f,w-.026],Mg,5,10);}   /* горка над краем — сколько в трюме */
    /* горящий: по краю ящика — обвязка акцента плиты, тот же цвет, что подсветка строки */
    if(hot){const Ac=K.mt(HALL_GOODS_ACC,.2,4,0,1.1,true);for(const s of [-1,1]){K.box([x+s*(w-.006),y+2*h+.004,z],[.009,.006,w],Ac,0);K.box([x,y+2*h+.004,z+s*(w-.006)],[w,.006,.009],Ac,0);}}
    /* трафарет товара на боку к залу: цвет ромба из таблицы, приглушённый (≤45 %), матовой краской по доске,
       без свечения — горит только обвязка */
    K.box([x+w+.0015,y+h*.85,z],[.0008,h*.36,w*.58],K.mt(hallStencil(col,.45),.08,3,P.wood),0);});
  return K.pack();
}
/* сетка по ключу; вне торгового места и без таблицы — тот же ящик, стойка одна на все разделы */
function hallGoodsUp(L){
  const keys=hallGoodsKeys(),c=(G&&G.cargo)||{},key=L.st+"|"+keys.map(k=>k+":"+Math.min(24,c[k]||0)).join(",")+"|"+HALL_GOODS.hot;
  if(!HALL_GOODS.mesh||HALL_GOODS.key!==key){r3Drop(HALL_GOODS.mesh);HALL_GOODS.mesh=hallGoodsMesh(keys);HALL_GOODS.key=key;}
  return HALL_GOODS.mesh;
}
/* свет над горящим ящиком: малый, цвета товара, без тени */
function hallGoodsLight(){
  const k=HALL_GOODS.hot,i=k?hallGoodsKeys().indexOf(k):-1;if(i<0||i>=12)return null;
  const p=hallGoodsAt(i);return {p:[p[0]+.1,1.55,p[2]+.08],range:1.2,c:r3Sc(r3Lin(mixc(hallGoodsCol(k),[255,236,210],.15)),.9),vol:0,goods:k};
}
/* строка таблицы ↔ ящик: наведение мыши или касание пальцем; ушёл с плиты — ящик гаснет */
function hallGoodsWire(){
  if($body.__hallGoods)return;$body.__hallGoods=1;
  const set=e=>{const c=e.target&&e.target.closest?e.target:null,r=c&&c.closest(".mk-r[data-k]"),q=c&&c.closest(".row[data-instr],.row[data-offer]");
    HALL_GOODS.hot=r?r.dataset.k:null;HALL_INSTR.hot=q?(q.dataset.instr||q.dataset.offer):null;};   /* строка прибора (M813) зажигает его шкалу на верстаке */
  $body.addEventListener("pointerover",set,{passive:true});$body.addEventListener("pointerdown",set,{passive:true});
  /* палец уходит с экрана — это не «ушёл с плиты»: на телефоне ящик горит до следующего касания */
  $body.addEventListener("pointerleave",e=>{if(e.pointerType!=="touch"){HALL_GOODS.hot=null;HALL_INSTR.hot=null;}},{passive:true});
}
function hallGoodsDrop(){r3Drop(HALL_GOODS.mesh);HALL_GOODS.mesh=null;HALL_GOODS.key="";HALL_GOODS.hot=null;HALL_LENS.g=0;HALL_LENS.last=0;HALL_LENS.t=0;}

/* ── объектив к ящику (правило M624, plnGlide): общий план не увеличен; горит строка — объектив
   скользит к ящикам, цель — середина между хозяином и ящиком, хозяин ~.27 кадра. Отпустил — ждёт
   45 кадров (750 мс: мышь переходит между строками через щель) и возвращается. Постоянного зума нет ── */
const HALL_LENS={g:0,t:0,last:0,m:1.31,hold:750};
/* хочет ли объектив к ящику в момент tm: горит строка на месте стойки или горела меньше hold назад */
function hallLensWant(tm){
  if(HALL_GOODS.hot&&HALL.place==="trade"&&hallGoodsKeys().indexOf(HALL_GOODS.hot)>=0)HALL_LENS.last=tm;
  if(HALL_INSTR.hot&&HALL_INSTR_PLACES.includes(HALL.place)&&INSTR_KEYS.indexOf(HALL_INSTR.hot)>=0)HALL_LENS.last=tm;   /* и прибор на верстаке (M813) */
  if(HALL.place==="board"&&HALL_BOARD.hot>=0&&hallBoardSheet(HALL_BOARD.hot))HALL_LENS.last=tm;   /* и лист на доске (M814) */
  if(HALL.place==="hold"&&HALL_HOLD.hot&&hallHoldPin(HALL_HOLD.hot))HALL_LENS.last=tm;   /* и фишка на карте конторы (M814) */
  return HALL_LENS.last>0&&tm-HALL_LENS.last<HALL_LENS.hold?1:0;
}
/* шаг скольжения: туда .45 с, обратно .7 с — те же постоянные, что у plnGlide */
function hallLensStep(tm){
  const dt=Math.min(.1,Math.max(0,(tm-(HALL_LENS.t||tm))/1000)),want=hallLensWant(tm),g=HALL_LENS.g;HALL_LENS.t=tm;
  let v=g+(want-g)*(1-Math.exp(-dt/(want>g?.45:.7)));if(Math.abs(v-want)<.002)v=want;
  return HALL_LENS.g=v;
}
function hallLensMoving(){return HALL_LENS.g>0&&HALL_LENS.g<1;}
/* к чему тянется объектив: у стойки — хозяин и ящик, у верстака — пилот и шкала прибора (M813). Ключ помнит
   последнюю вещь, чтобы отпущенная строка возвращала объектив от неё, а не скачком */
function hallLensAim(L){
  const at=HALL_INSTR_PLACES.includes(HALL.place),bd=HALL.place==="board",hd=HALL.place==="hold",g=at||bd||hd?"":HALL_GOODS.hot,
    n=at?HALL_INSTR.hot:"",b=bd?HALL_BOARD.hot:-1,h=hd?HALL_HOLD.hot:"";
  const k=g?"g:"+g:n?"i:"+n:b>=0?"b:"+b:h?"h:"+h:HALL_LENS.k;if(!k)return null;HALL_LENS.k=k;
  if(k[0]==="h"){const p=hallHoldPin(k.slice(2)),M=HALL_MAP;return p?[[M.x,M.y,M.z],p]:null;}   /* у стола — фишка и середина карты */
  if(k[0]==="b"){const s=hallBoardSheet(+k.slice(2)),B=HALL_BOARD_BOX;   /* у доски — лист и середина доски: кадр не задирается к верхнему листу */
    return s?[[(B.x0+B.x1)/2,(B.y0+B.y1)/2,s.c[2]],s.c]:null;}
  if(k[0]==="g"){const i=hallGoodsKeys().indexOf(k.slice(2)),k0=L.people[0];if(i<0||i>=12||!k0)return null;
    const p=hallGoodsAt(i);return [[k0.x,1.45,k0.z],[p[0],p[1]+.08,p[2]]];}
  const i=INSTR_KEYS.indexOf(k.slice(2)),P=hallPilotAt(HALL.place)||HALL_PILOT_AT.ship;if(i<0)return null;
  return [[P[0],1.45,P[1]],hallInstrFace(i)];
}
/* место камеры с объективом: глаз тот же, цель — к середине человек↔вещь, поле уже в m раз; g — доля пути */
function hallLens(c,L,g){
  if(!(g>0)||!L)return c;
  const A=hallLensAim(L);if(!A)return c;
  const mid=[(A[0][0]+A[1][0])/2,(A[0][1]+A[1][1])/2,(A[0][2]+A[1][2])/2],m=1+(HALL_LENS.m-1)*g;
  return {eye:c.eye,tgt:hallMix3(c.tgt,mid,g),fy:2*Math.atan(Math.tan(c.fy/2)/m),k:c.k};
}
