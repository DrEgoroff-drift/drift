/* ══════════════ детекторы: законы, которые смотрят после каждого шага (M443) ══════════════
   Набор проверяет СЛУЧАЙ, который придумал его автор. Детектор проверяет ЗАКОН
   — и потому годится для любого случая: его зовут после каждого шага каждого
   сценария, и на новый сценарий он распространяется даром (docs/DESIGN-tests.md
   §3.2). Восемьсот наборов пропустили пятнадцать авторских багов не потому, что
   их мало, а потому, что каждый проверял свой случай, а законы, записанные
   словами в шапках модулей, не проверял никто. Здесь четыре оракула из пяти:

   1. СБОЙ — сторож кадра («СБОЙ · …»), window.onerror, console.error — за шаг.
   2. ЗАСТОЙ — режим без своего состояния (тихое зависание из 91zzzzze-keys),
      экран, который не закрывается своей кнопкой, кадр, не шелохнувшийся под
      рукой при неподвижном мире.
   3. ЗАКОН — числа в G (NaN, ∞, строка там, где было число), поле, которое
      читают, но не пишет никто (прототип-Proxy — самый дешёвый ловец опечаток),
      приборы против полей, из которых они обязаны читать, и ответ органа
      управления по СМЫСЛУ, а не по полю (M437): W ведёт по носу, A крутит
      против часовой, «+» укрупняет кадр от центра, протяжка карты двигает
      слои по глубине.
   4. КАРТИНА — не пусто и не выжжено, текст читается (размер × мерка UIK и
      контраст), холст равен окну, кадр в покое не мигает и ничто не
      выскакивает за один кадр, у человека один рост на ногах.

   Здесь уши, глаз и меры; таблица приборов, исключения и сами детекторы — в
   90c-detect-laws. Детектор — чистая функция `detX(ctx) → [{det, scene, what, where}]`: мир он
   не трогает и не читает ничего, кроме ctx. Всё, что ему нужно знать, шаг
   сценария кладёт в ctx заранее (`detStep` в 91zzzzzzzz-detect): кадры, текст с
   канвы, голос игры, ошибки, показания приборов. Пятый оракул — дисбаланс по
   семенам — и золотые кадры ждут M441: им нужен сеянный rnd() и приколоченный
   now() (§3.2, «после слияния»). */

/* ── уши: что случилось на странице за шаг ──
   Ставятся на загрузке страницы тестов и молчат, пока DET.on не поднят: весь
   прочий корпус идёт мимо них, как шёл. В игре (drift.html) этого файла нет. */
const DET={on:false,errs:[],cons:[],said:0,texts:null,astro:null,hull:0,reads:null,writes:null};
/* настройки игрока — какими они были при заводке страницы. resetWorld их не
   трогает (G.opts — имя с заводки), и набор про порченый сейв оставлял
   следующим «текст» в графике и строку в размере пэдов: драйвер мерил бы уже
   не игру, а чужой мусор. Правило то же, что у G_BOOT_KEYS и UI_BOOT */
const DET_OPTS_BOOT=(()=>{try{return JSON.stringify(G.opts);}catch(e){return null;}})();
addEventListener("error",e=>{
  if(!DET.on)return;
  const x=e&&e.error;
  /* где именно: два первых своих имени из стека, как у сторожа кадра (28-loop) */
  let at="";try{at=(x)?crashAt(x):"";}catch(_){}
  DET.errs.push(String((x&&x.message)||(e&&e.message)||"?").slice(0,160)+(at?" · "+at:""));
});
addEventListener("unhandledrejection",e=>{
  if(!DET.on)return;
  const x=e&&e.reason;
  DET.errs.push("обещание: "+String((x&&x.message)||x).slice(0,160));
});
(function(){
  const ce=console.error;
  console.error=function(){
    if(DET.on)try{DET.cons.push([...arguments].map(a=>(a&&a.message)||String(a)).join(" ").slice(0,160));}catch(_){}
    return ce.apply(console,arguments);
  };
  /* голос игры — сами вызовы, а не строка на экране: та же строка второй раз
     выглядит молчанием, а чужая строка того же кадра — ответом (91zzzzzi) */
  for(const nm of ["say","tell","logAdd"]){
    const f=window[nm];if(typeof f!=="function")continue;
    window[nm]=function(){DET.said++;return f.apply(this,arguments);};
  }
  /* текст с канвы: что, каким кеглем (в CSS-пикселях, с учётом преобразования)
     и где. Пишется, только пока шаг держит DET.texts открытым */
  /* под Node (test-node.js) канвы нет вовсе — там детекторы не гоняются */
  if(typeof CanvasRenderingContext2D!=="undefined"){
    const P=CanvasRenderingContext2D.prototype,ft=P.fillText;
    P.fillText=function(s,x,y){
      if(DET.texts&&this.canvas===cvs)try{detInk(this,s,x,y);}catch(_){}
      return ft.apply(this,arguments);
    };
  }
  /* надписи на корпусе — краска, а не текст для чтения: бортовой номер «ЧВ-94»
     в полтора пикселя на дальнем корабле — фактура обшивки (03d-hull-marks) */
  {
    const dh=drawHull;
    window.drawHull=function(){DET.hull++;try{return dh.apply(this,arguments);}finally{DET.hull--;}};
  }
  /* рост человека: масштаб, в котором рисуется астронавт (20-life) */
  {
    const da=drawAstronaut;
    window.drawAstronaut=function(){
      if(DET.astro)try{const t=ctx.getTransform();DET.astro.push(Math.hypot(t.c,t.d)/(DPR||1));}catch(_){}
      return da.apply(this,arguments);
    };
  }
})();
function detInk(c,s,x,y){
  const t=c.getTransform(),m=/(\d+(?:\.\d+)?)px/.exec(c.font);
  const k=Math.hypot(t.c,t.d),px=(m?+m[1]:0)*k/(DPR||1);
  s=String(s);
  const mt=c.measureText(s),al=c.textAlign;
  const x0=al==="center"?x-mt.width/2:(al==="right"||al==="end")?x-mt.width:x;
  const asc=mt.actualBoundingBoxAscent||0,dsc=mt.actualBoundingBoxDescent||0;
  const P=[[x0,y-asc],[x0+mt.width,y-asc],[x0,y+dsc],[x0+mt.width,y+dsc]].map(q=>[t.a*q[0]+t.c*q[1]+t.e,t.b*q[0]+t.d*q[1]+t.f]);
  DET.texts.push({s,px,col:typeof c.fillStyle==="string"?c.fillStyle:"",al:c.globalAlpha,hull:DET.hull>0,
    x0:Math.min(...P.map(p=>p[0])),y0:Math.min(...P.map(p=>p[1])),x1:Math.max(...P.map(p=>p[0])),y1:Math.max(...P.map(p=>p[1]))});
}

/* ── глаз: кадр в четверть (320 по ширине) ──
   Полный getImageData стоит 30–50 мс (синхронизация с видеокартой), уменьшенная
   копия через drawImage — столько же, но дальше по ней считать вшестеро дешевле.
   Яркость — одна на пиксель; цвет детекторам кадра не нужен. */
let DET_SM=null,DET_SX=null;
function detGrab(){
  const SW=320,SH=Math.max(2,Math.round(320*cvs.height/Math.max(1,cvs.width)));
  if(!DET_SM||DET_SM.height!==SH){DET_SM=document.createElement("canvas");DET_SM.width=SW;DET_SM.height=SH;DET_SX=DET_SM.getContext("2d");}
  DET_SX.clearRect(0,0,SW,SH);DET_SX.drawImage(cvs,0,0,SW,SH);
  const d=DET_SX.getImageData(0,0,SW,SH).data,L=new Float32Array(SW*SH);
  for(let i=0,j=0;j<L.length;i+=4,j++)L[j]=.299*d[i]+.587*d[i+1]+.114*d[i+2];
  L.w=SW;L.h=SH;L.k=cvs.width/SW;       /* во сколько раз холст крупнее копии */
  return L;
}
/* участок холста в полном разрешении — вокруг корабля, для поворота и хода */
function detPatch(cx,cy,R){
  const n=2*R,x0=Math.round(cx-R),y0=Math.round(cy-R);
  if(x0<0||y0<0||x0+n>cvs.width||y0+n>cvs.height)return null;
  const d=cvs.getContext("2d").getImageData(x0,y0,n,n).data,L=new Float32Array(n*n);
  for(let i=0,j=0;j<L.length;i+=4,j++)L[j]=.299*d[i]+.587*d[i+1]+.114*d[i+2];
  return {L,n};
}

/* ── меры кадра: чистые функции над яркостью ── */
/* доля проб, сдвинувшихся заметно для глаза (как hDiff в 91zzzzzzz-hands) */
function detDiff(a,b){
  if(!a||!b||a.length!==b.length)return 1;
  let n=0;for(let i=0;i<a.length;i++)if(Math.abs(a[i]-b[i])>6)n++;
  return n/a.length;
}
function detSamp(a,x,y){
  const SW=a.w,SH=a.h;
  if(x<0||y<0||x>SW-1.001||y>SH-1.001)return -1;
  const x0=x|0,y0=y|0,fx=x-x0,fy=y-y0,i=y0*SW+x0;
  return a[i]*(1-fx)*(1-fy)+a[i+1]*fx*(1-fy)+a[i+SW]*(1-fx)*fy+a[i+SW+1]*fx*fy;
}
/* средняя ошибка «b(x,y) против a(f(x,y))» по сетке с шагом st */
function detErr(a,b,f,st,mask){
  let s=0,n=0;
  for(let y=4;y<a.h-4;y+=st)for(let x=4;x<a.w-4;x+=st){
    if(mask&&!mask(x,y))continue;
    const p=f(x,y),v=detSamp(a,p[0],p[1]);if(v<0)continue;
    s+=Math.abs(b[y*a.w+x]-v);n++;
  }
  return n>50?s/n:1e9;
}
/* сдвиг фона (в пикселях холста): целый шаг по копии, корабль вырезан маской */
function detBgShift(a,b,R,mask){
  let best={dx:0,dy:0,e:1e9};
  for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){
    const e=detErr(a,b,(x,y)=>[x-dx,y-dy],3,mask);
    if(e<best.e)best={dx,dy,e};
  }
  return {dx:best.dx*a.k,dy:best.dy*a.k,e:best.e};
}
/* сдвиг содержимого участка: куда уехал корабль */
function detPatchShift(p0,p1,R){
  if(!p0||!p1)return null;
  const n=p0.n;let best={dx:0,dy:0,e:1e9};
  for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){
    let s=0,k=0;
    for(let y=R;y<n-R;y+=2)for(let x=R;x<n-R;x+=2){s+=Math.abs(p1.L[y*n+x]-p0.L[(y-dy)*n+(x-dx)]);k++;}
    const e=s/Math.max(1,k);if(e<best.e)best={dx,dy,e};
  }
  return best;
}
/* поворот участка вокруг центра, в градусах экрана (y вниз): меньше нуля —
   против часовой. Проба ±40° шагом 4°. Сравнивается СИЛУЭТ — пиксели заметно
   ярче фона участка, — а не яркость целиком: зерно кадра (grainPass) и
   туманность шумят в каждом пикселе, и по сумме разниц поворот корабля в них
   тонул (в безголовом Хроме оценка «против/по» выходила 6.8 к 6.8) */
function detRot(p0,p1){
  if(!p0||!p1)return null;
  const n=p0.n,c=n/2,R=c-2;
  const med=L=>{const v=Array.from(L).sort((a,b)=>a-b);return v[v.length>>1];};
  const t0=med(p0.L)+40,t1=med(p1.L)+40;
  let best={th:0,iou:-1},i0=0,iNeg=0,iPos=0;
  for(let th=-40;th<=40;th+=4){
    const t=th*Math.PI/180,co=Math.cos(t),si=Math.sin(t);let both=0,any=0;
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const u=x-c,v=y-c;if(u*u+v*v>R*R)continue;
      const X=Math.round(c+co*u+si*v),Y=Math.round(c-si*u+co*v);
      const a=(X>=0&&Y>=0&&X<n&&Y<n)&&p0.L[Y*n+X]>t0,b=p1.L[y*n+x]>t1;
      if(a&&b)both++;if(a||b)any++;
    }
    const iou=any?both/any:0;
    if(th===0)i0=iou;if(th<0&&iou>iNeg)iNeg=iou;if(th>0&&iou>iPos)iPos=iou;
    if(iou>best.iou)best={th,iou};
  }
  best.i0=i0;best.iNeg=iNeg;best.iPos=iPos;return best;
}
/* масштаб от центра: во сколько раз содержимое выросло */
function detScale(a,b,cx,cy){
  let best={s:1,e:1e9},e1=1e9;
  for(const s of [.6,.7,.8,.87,.93,1,1.07,1.15,1.25,1.35,1.5,1.7,1.9,2.1]){
    const e=detErr(a,b,(x,y)=>[cx+(x-cx)/s,cy+(y-cy)/s],2);
    if(s===1)e1=e;if(e<best.e)best={s,e};
  }
  best.e1=e1;return best;
}
/* ── слои на протяжке (M438): «небо стоит в мире, лист едет перед ним» ──
   Кадр режется на блоки; для каждого фактурного блока ищется, какую ДОЛЮ
   протяжки он прошёл. Лист карты идёт один к одному, полоса Галактики и
   туманность — сотыми-десятыми, зерно — десятыми. Мерка проверена мутантами:
   небо, прибитое к экрану (`mapSkyShift=()=>0`), даёт глубоких блоков 12 %,
   небо, едущее с листом (`=d`), — 3 %, живая игра — 33 %. */
function detParallax(a,b,DX,DY){
  const SW=a.w,SH=a.h,dx=DX/a.k,dy=DY/a.k,B=20;
  const ks=[0,.03,.06,.1,.14,.2,.3,.4,.55,.7,.85,1,1.15];
  let tex=0,deep=0,sheet=0,still=0;
  for(let by=0;by+B<=SH;by+=B)for(let bx=0;bx+B<=SW;bx+=B){
    let mn=1e9,mx=-1;
    for(let y=by;y<by+B;y++)for(let x=bx;x<bx+B;x++){const v=b[y*SW+x];if(v<mn)mn=v;if(v>mx)mx=v;}
    if(mx-mn<12)continue;
    let bk=0,be=1e9;
    for(const k of ks){
      let s=0,n=0;
      for(let y=by;y<by+B;y++)for(let x=bx;x<bx+B;x++){
        const v=detSamp(a,x-dx*k,y-dy*k);if(v<0)continue;s+=Math.abs(b[y*SW+x]-v);n++;
      }
      const e=n>40?s/n:1e9;if(e<be){be=e;bk=k;}
    }
    tex++;
    if(bk===0)still++;else if(bk<=.2)deep++;else if(bk>=.85)sheet++;
  }
  return {tex,deep:deep/Math.max(1,tex),sheet:sheet/Math.max(1,tex),still:still/Math.max(1,tex)};
}
/* сколько проб в каждом блоке 8×8 копии сдвинулось резко: где именно кадр ожил */
function detBlocks(a,b){
  const SW=a.w,SH=a.h,B=8,nx=Math.floor(SW/B),ny=Math.floor(SH/B),out=new Uint8Array(nx*ny);
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
    let n=0;for(let y=j*B;y<j*B+B;y++)for(let x=i*B;x<i*B+B;x++)if(Math.abs(a[y*SW+x]-b[y*SW+x])>24)n++;
    out[j*nx+i]=n;
  }
  return out;
}
/* «новое движение»: блоки, ожившие под жестом там, где в покое было тихо.
   Человечек, прошедший по комнате под снегопадом, меняет полпроцента кадра —
   меньше, чем снег за то же время, — но меняет там, где снег не менял ничего;
   курсор базы, ушедший на клетку, — тонкие уголки и подпись, сотые доли кадра,
   но на месте, которое в покое стояло */
function detNewMotion(gB,idleB){
  if(!gB||!idleB||gB.length!==idleB.length)return 0;
  let n=0;for(let i=0;i<gB.length;i++)if(gB[i]>=3&&idleB[i]<=1)n++;
  return n;
}
/* блоки 8×8 копии по четырём кадрам подряд.
   Мигание — блок ходит туда-обратно ДВАЖДЫ подряд (A→B→A→B): пролетевшая
   искра или капля меняет блок один раз и уходит в соседний, мерцание остаётся
   на месте. Выскакивание — плоский блок стал фактурным и ОСТАЛСЯ таким (или
   наоборот): летящая точка на следующем кадре уже в другом блоке */
function detBlink(f0,f1,f2,f3){
  const SW=f0.w,SH=f0.h,B=8;let fl=0,pop=0,n=0;const where=[];
  const tri=(a,b,c,i0)=>{let d01=0,d12=0,d02=0;for(const i of i0){d01+=Math.abs(b[i]-a[i]);d12+=Math.abs(c[i]-b[i]);d02+=Math.abs(c[i]-a[i]);}
    const k=i0.length;d01/=k;d12/=k;d02/=k;return d01>6&&d12>6&&d02<Math.min(d01,d12)*.35;};
  const rng=(f,i0)=>{let lo=1e9,hi=-1;for(const i of i0){if(f[i]<lo)lo=f[i];if(f[i]>hi)hi=f[i];}return hi-lo;};
  for(let by=0;by+B<=SH;by+=B)for(let bx=0;bx+B<=SW;bx+=B){
    n++;const I=[];for(let y=by;y<by+B;y++)for(let x=bx;x<bx+B;x++)I.push(y*SW+x);
    const blink=tri(f0,f1,f2,I)&&(!f3||tri(f1,f2,f3,I));
    const c0=rng(f0,I),c1=rng(f1,I),c2=f3?rng(f2,I):c1;
    const popped=(c0<6&&c1>40&&c2>40)||(c0>40&&c1<6&&c2<6);
    if(blink)fl++;if(popped)pop++;
    if((blink||popped)&&where.length<3)where.push(Math.round((bx+B/2)*f0.k)+","+Math.round((by+B/2)*f0.k));
  }
  return {blink:fl/Math.max(1,n),pop:pop/Math.max(1,n),where};
}

/* ── числа в G ──
   Обход с потолком: G огромен (системы, растры, журналы), и шаг сценария не
   имеет права стоить дороже самого кадра. Типы полей помнятся на два уровня
   вглубь — между шагами сверяется, не стал ли номер строкой. */
function detWalk(cap){
  cap=cap||30000;
  const seen=new WeakSet(),bad=[],types=new Map();let n=0;
  const walk=(v,path,depth)=>{
    if(bad.length>=8||n>cap)return;
    n++;
    const t=typeof v;
    if(depth<=2&&depth>0)types.set(path,v===null?"null":Array.isArray(v)?"array":t);
    if(t==="number"){if(!Number.isFinite(v))bad.push(path+"="+v);return;}
    if(v===null||t!=="object")return;
    if(seen.has(v))return;seen.add(v);
    if(typeof Node!=="undefined"&&v instanceof Node)return;
    if(v instanceof Set||v instanceof Map||v instanceof WeakMap)return;
    if((typeof ImageData!=="undefined"&&v instanceof ImageData)||(typeof CanvasRenderingContext2D!=="undefined"&&v instanceof CanvasRenderingContext2D))return;
    /* в типизированных массивах NaN — законная метка «ещё не посчитано»
       (пол и свод пещеры, 22-mode-cave: `fill(NaN)` и досчёт по месту);
       бесконечность — нет */
    if(ArrayBuffer.isView(v)){for(let i=0;i<v.length&&i<2000;i+=7)if(v[i]===Infinity||v[i]===-Infinity){bad.push(path+"["+i+"]="+v[i]);break;}return;}
    if(Array.isArray(v)){for(let i=0;i<v.length&&i<600;i++)walk(v[i],path+"["+i+"]",depth+1);return;}
    for(const k of Object.keys(v))walk(v[k],path+"."+k,depth+1);
  };
  walk(G,"G",0);
  return {bad,types,n};
}

/* ── опечатки: поле, которое читают, но не пишет никто ──
   Прототип-Proxy под G и под состоянием режима: чтение СВОЕГО поля до него не
   доходит вовсе (цепочка прототипов спрашивает прототип, только когда поля
   нет), поэтому живая игра через ловушку не ходит. Ловушка отдаёт то же, что
   отдал бы Object.prototype, и запись кладёт полем на сам объект — поведение
   то же, изменился только слух. Ставится драйвером на время прогона и снимается
   за собой; в сборке игры этого файла нет.
   Имя «кто-то пишет» берётся из исходника игры: присваивание `.имя=`, ключ
   литерала `имя:` или строка "имя" (динамический ключ). Опечатка — имя, которого
   нет ни в одной из трёх форм. */
let DET_NAMES=null;
function detNames(){
  if(DET_NAMES)return DET_NAMES;
  let src="";
  try{src=document.scripts[0].textContent;const cut=src.indexOf("автотесты: каркас");if(cut>0)src=src.slice(0,cut);}catch(e){}
  const S=new Set(),C=new Map();
  const put=re=>{let m;while((m=re.exec(src)))S.add(m[1]);};
  put(/\.([A-Za-z_$][\w$]*)\s*(?:=(?!=)|\+=|-=|\*=|\/=|%=|\|=|&=|\|\|=|\?\?=|&&=|\+\+|--)/g);
  put(/[{,]\s*([A-Za-z_$][\w$]*)\s*:/g);
  put(/["'`]([A-Za-z_$][\w$]*)["'`]/g);
  put(/\+\+\s*[A-Za-z_$][\w$.]*\.([A-Za-z_$][\w$]*)/g);
  /* сколько раз имя встречается вообще — для «пишут, но не читает никто» */
  {const re=/\.([A-Za-z_$][\w$]*)/g;let m;while((m=re.exec(src)))C.set(m[1],(C.get(m[1])||0)+1);}
  DET_NAMES={set:S,count:C,ok:src.length>100000};
  return DET_NAMES;
}
const DET_PROTOS=new Map();
function detProtoOf(name){
  let P=DET_PROTOS.get(name);if(P)return P;
  P=new Proxy({},{
    get(t,k,recv){
      if(DET.reads&&typeof k==="string"&&!(k in Object.prototype)){
        const key=name+"."+k;DET.reads[key]=(DET.reads[key]||0)+1;
      }
      return Reflect.get(t,k,recv);
    },
    set(t,k,v,recv){
      if(DET.writes&&typeof k==="string")DET.writes[name+"."+k]=1;
      return Reflect.set(t,k,v,recv);
    }
  });
  DET_PROTOS.set(name,P);
  return P;
}
const DET_HOOKED=[];
function detHook(on){
  if(!on){
    for(const o of DET_HOOKED)try{if(DET_PROTOS.size&&[...DET_PROTOS.values()].includes(Object.getPrototypeOf(o)))Object.setPrototypeOf(o,Object.prototype);}catch(e){}
    DET_HOOKED.length=0;DET.reads=null;DET.writes=null;return;
  }
  if(!DET.reads){DET.reads={};DET.writes={};}
  const put=(o,name)=>{
    if(!o||typeof o!=="object"||Array.isArray(o))return;
    if(Object.getPrototypeOf(o)!==Object.prototype)return;
    Object.setPrototypeOf(o,detProtoOf(name));DET_HOOKED.push(o);
  };
  put(G,"G");put(G.ship,"G.ship");
  const st=DET_STATE_OF[G.mode];if(st)put(G[st],"G."+st);
}
/* режим → его состояние в G: пустое состояние при живом режиме — тихое
   зависание (та же пара, что keyStateOK в 91zzzzze-keys) */
const DET_STATE_OF={surface:"surf",landing:"land",dig:"dig",cave:"cave",belt:"belt",scoop:"scoop",
  base:"base",raid:"raid",homein:"hin",winter:"win",spa:"spa",wanderer:"wan"};
