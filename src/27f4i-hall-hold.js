/* ── M814 ВЛАДЕНИЯ: карта сектора под стеклом конторского стола ──
   Строки плиты ↔ фишки на карте: дом — красный флажок, каждая база — флажок цвета станции, станция, где вы стоите, —
   чернильный круг под стеклом. Карта печатная: сетка секторов (шаг — чтобы клетка была не мельче 3 см), точки звёзд,
   рамка, роза и штамп; от круга «вы здесь» к базам — карандашные пунктиры маршрутов. Окно карты — по фишкам: все
   влезают, а пустая сеть показывает хотя бы девять на пять секторов вокруг. Наведение на строку дома или базы —
   фишка поднята и горит под своим светом, объектив скользит к ней (тот же HALL_LENS, что у ящиков, приборов, листов) */
const HALL_HOLD={mesh:null,key:"",hot:""};
const HALL_MAP={x:4.88,y:.774,z:-1.68,w:.44,h:.27};   /* середина листа на столе конторы (27f4b: стол 4.9,-1.7), полуширины */

/* фишки из состояния игры, не из плиты: стол виден и из других мест зала */
function hallHoldPins(){
  const out=[];
  if(G.home&&G.home.tier)out.push({k:"home",sx:G.home.sx,sy:G.home.sy});
  if(G.bases)baseList().forEach((B,i)=>out.push({k:"b"+i,sx:B.sx,sy:B.sy}));
  return out;
}
/* окно карты: середина и масштаб (м на сектор) — все фишки и «вы здесь» внутри поля с отступом */
function hallHoldView(pins){
  const xs=[G.sx,...pins.map(p=>p.sx)],ys=[G.sy,...pins.map(p=>p.sy)],M=HALL_MAP;
  const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
  const sw=Math.max(9,x1-x0+3),sh=Math.max(5,y1-y0+3),s=Math.min(2*M.w*.86/sw,2*M.h*.8/sh);
  return {cx:(x0+x1)/2,cy:(y0+y1)/2,s};
}
/* сектор → точка на столе: x карты — x зала, y карты — к сидящему (+z), как строки на листе */
function hallHoldAt(v,sx,sy){return [HALL_MAP.x+(sx-v.cx)*v.s,HALL_MAP.y,HALL_MAP.z+(sy-v.cy)*v.s];}
function hallHoldPin(k){
  const pins=hallHoldPins(),p=pins.find(q=>q.k===k);if(!p)return null;
  const a=hallHoldAt(hallHoldView(pins),p.sx,p.sy);return [a[0],a[1]+.05,a[2]];
}

/* плита ВЛАДЕНИЙ → строка дома и строки баз получают data-pin (по нему наведение находит фишку) */
function hallHoldDress(){
  if(typeof $body==="undefined"||!$body)return;
  let sec="",i=0;
  for(const x of $body.children){
    if(x.classList.contains("sec")){sec=((x.textContent||"").trim().match(/^ВАШ(И БАЗЫ| ДОМ)/)||[""])[0];continue;}
    if(!x.classList.contains("row"))continue;
    if(sec==="ВАШ ДОМ"){x.dataset.pin="home";sec="";}
    else if(sec==="ВАШИ БАЗЫ")x.dataset.pin="b"+(i++);
  }
  if($body.__hallHold)return;$body.__hallHold=1;
  const set=e=>{const c=e.target&&e.target.closest?e.target:null,r=c&&c.closest(".row[data-pin]");HALL_HOLD.hot=r?r.dataset.pin:"";};
  $body.addEventListener("pointerover",set,{passive:true});$body.addEventListener("pointerdown",set,{passive:true});
  $body.addEventListener("pointerleave",e=>{if(e.pointerType!=="touch")HALL_HOLD.hot="";},{passive:true});
}

/* печатная карта: бумага, рамка, сетка, звёзды, роза, штамп; маршруты и круг «вы здесь» — карандашом и чернилом */
function hallHoldChart(K,v,pins){
  const M=HALL_MAP,y=M.y,ink=K.mt([62,58,54],.05,2,0),grid=K.mt([150,160,150],.05,2,0),pen=K.mt([96,90,82],.05,2,0);
  const ln=(x0,z0,x1,z1,t,Mt,dy)=>{const dx=x1-x0,dz=z1-z0,l=Math.hypot(dx,dz);if(l<1e-4)return;
    K.push([(x0+x1)/2,y+(dy||.0006),(z0+z1)/2],Math.atan2(-dz,dx));K.box([0,0,0],[l/2,.0002,t],Mt,0);K.pop();};
  K.box([M.x,y-.001,M.z],[M.w,.0012,M.h],K.mt([214,204,172],.08,3,0),.0005);   /* лист */
  for(const e of [.012,.02])for(const s of [-1,1]){ln(M.x-M.w+e,M.z+s*(M.h-e),M.x+M.w-e,M.z+s*(M.h-e),e>.015?.0012:.0007,ink);
    ln(M.x+s*(M.w-e),M.z-M.h+e,M.x+s*(M.w-e),M.z+M.h-e,e>.015?.0012:.0007,ink);}
  /* сетка: шаг 1, 2, 5, 10… секторов — клетка не мельче 3 см */
  let k=1;for(const q of [1,2,5,10,20,50,100,200,500,1000])if(q*v.s>=.03){k=q;break;}else k=q;
  const ix=M.w-.022,iz=M.h-.022,sx0=Math.ceil((v.cx-ix/v.s)/k)*k,sy0=Math.ceil((v.cy-iz/v.s)/k)*k;
  for(let sx=sx0;(sx-v.cx)*v.s<=ix;sx+=k){const x=M.x+(sx-v.cx)*v.s;ln(x,M.z-iz,x,M.z+iz,.0005,grid);}
  for(let sy=sy0;(sy-v.cy)*v.s<=iz;sy+=k){const z=M.z+(sy-v.cy)*v.s;ln(M.x-ix,z,M.x+ix,z,.0005,grid);}
  if(k===1)for(let sx=Math.ceil(v.cx-ix/v.s);(sx-v.cx)*v.s<=ix;sx++)for(let sy=Math.ceil(v.cy-iz/v.s);(sy-v.cy)*v.s<=iz;sy++){
    if(!starAt(sx,sy))continue;const a=hallHoldAt(v,sx+.5,sy+.5);if(Math.abs(a[0]-M.x)>ix||Math.abs(a[2]-M.z)>iz)continue;
    const r=.0022+.0022*h01(sx,sy,77);K.box([a[0],y+.0008,a[2]],[r,.0002,r],ink,0);}
  /* роза в левом верхнем углу и штамп справа внизу */
  {const cx=M.x-M.w+.06,cz=M.z-M.h+.06;ln(cx,cz-.03,cx,cz+.03,.0012,ink);ln(cx-.02,cz,cx+.02,cz,.0008,ink);
    K.push([cx,y+.0008,cz-.034]);K.tri([-.006,0,.008],[0,0,-.006],[.006,0,.008],K.mt([150,40,32],.1,3,0),[0,1,0]);K.pop();}
  {const bx=M.x+M.w-.1,bz=M.z+M.h-.05;K.box([bx,y+.0004,bz],[.07,.0003,.028],K.mt([200,190,156],.08,3,0),0);
    for(let i=0;i<3;i++)ln(bx-.06,bz-.016+i*.012,bx+.06-(i===2?.05:0),bz-.016+i*.012,.0012,ink,.0009);}
  /* «вы здесь» — чернильный круг; от него к базам — карандашный пунктир */
  const h=hallHoldAt(v,G.sx,G.sy);
  for(let i=0;i<14;i++){const a=i/14*TAU,b=(i+1)/14*TAU,r=.02;ln(h[0]+Math.cos(a)*r,h[2]+Math.sin(a)*r,h[0]+Math.cos(b)*r,h[2]+Math.sin(b)*r,.0011,ink,.0009);}
  K.box([h[0],y+.0009,h[2]],[.004,.0002,.004],ink,0);
  for(const p of pins){const a=hallHoldAt(v,p.sx,p.sy),dx=a[0]-h[0],dz=a[2]-h[2],l=Math.hypot(dx,dz);if(l<.05)continue;
    const n=Math.max(1,Math.floor((l-.05)/.018));for(let i=0;i<n;i++){const t0=(.025+i*.018)/l,t1=Math.min((.025+i*.018+.01)/l,1-.025/l);
      if(t1>t0)ln(h[0]+dx*t0,h[2]+dz*t0,h[0]+dx*t1,h[2]+dz*t1,.0008,pen,.0008);}}
}
/* фишка: шайба и флажок на древке; дом — красный и выше; горящая поднята и светится */
function hallHoldToken(K,a,home,acc,hot){
  const c=home?[176,40,32]:acc,e=hot?.22:0,up=hot?.012:0,ph=home?.09:.072,r=home?.019:.016;
  K.push([a[0],HALL_MAP.y+.004+up,a[2]],0,0,0,hot?1.35:1);
  K.lathe([[0,r],[.012,r],[.016,r*.7],[.018,0]],12,K.mt(home?[120,32,28]:mixc(c,[40,40,44],.35),.4,8,0,e*.4));
  K.tube([[0,.017,0],[0,ph,0]],.0017,K.mt([150,150,156],.8,12,R3P.brushed),5);
  const fm=K.mt(c,.15,4,0,e),f=[[0,ph,0],[.034,ph-.011,0],[0,ph-.022,0]];
  K.tri(f[0],f[1],f[2],fm,[0,0,1]);K.tri(f[0],f[2],f[1],fm,[0,0,-1]);
  K.pop();
}
function hallHoldMesh(acc){
  const K=r3Kit();K.flags=2;   /* карта и фишки — тела под резкостью поста: сетка не мылится */
  const pins=hallHoldPins(),v=hallHoldView(pins);
  hallHoldChart(K,v,pins);
  for(const p of pins)hallHoldToken(K,hallHoldAt(v,p.sx,p.sy),p.k==="home",acc,p.k===HALL_HOLD.hot);
  /* стекло поверх листа: само не рисуется (сплошная плита стекла белит карту), видна его латунная окантовка */
  const M=HALL_MAP,br=K.mt([150,120,70],.7,11,R3P.brushed);
  for(const s of [-1,1]){K.box([M.x,M.y+.003,M.z+s*(M.h+.006)],[M.w+.012,.003,.006],br,.002);K.box([M.x+s*(M.w+.006),M.y+.003,M.z],[.006,.003,M.h],br,.002);}
  return K.pack();
}
function hallHoldUp(L){
  const key=L.st+"|"+G.sx+","+G.sy+"|"+hallHoldPins().map(p=>p.k+p.sx+","+p.sy).join(";")+"|"+HALL_HOLD.hot;
  if(!HALL_HOLD.mesh||HALL_HOLD.key!==key){r3Drop(HALL_HOLD.mesh);HALL_HOLD.mesh=hallHoldMesh(L.acc);HALL_HOLD.key=key;}
  return HALL_HOLD.mesh;
}
/* горящая фишка: малый тёплый свет над ней, без тени */
function hallHoldLight(){
  const p=HALL_HOLD.hot?hallHoldPin(HALL_HOLD.hot):null;if(!p)return null;
  return {p:[p[0]-.04,p[1]+.22,p[2]+.08],range:.38,c:r3Sc(r3Lin([255,236,206]),.7),vol:0,hold:HALL_HOLD.hot};
}
/* стройка за окном (M814): три площадки станции — цифрами по шесть для шейдера окна (27f2 outside): 0 нет, 1 свободна,
   2 строится, 3–5 построена (ступень); 216 — мест ещё нет, на месте будущей стройки вехи. Заправка стройки не держит */
function hallSiteW(L){
  const sys=G.sys;if(!sys||L.st==="fuel")return 0;
  const n=Math.min(3,bldSitesAt(sys.sx,sys.sy)),ids=bldBuiltHere(sys);let w=0;
  for(let i=0;i<3;i++){let d=0;
    if(i<ids.length){const B=bldEntry(sys.key,ids[i]);d=bldReady(B)?2+Math.min(3,Math.max(1,B.lvl|0)):2;}else if(i<n)d=1;
    w+=d*Math.pow(6,i);}
  return w||216;
}
function hallHoldDrop(){r3Drop(HALL_HOLD.mesh);HALL_HOLD.mesh=null;HALL_HOLD.key="";HALL_HOLD.hot="";}
