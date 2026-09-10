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

   Детектор — чистая функция `detX(ctx) → [{det, scene, what, where}]`: мир он
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
  let at="";try{at=(typeof crashAt==="function"&&x)?crashAt(x):"";}catch(_){}
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
  if(typeof drawHull==="function"){
    const dh=drawHull;
    window.drawHull=function(){DET.hull++;try{return dh.apply(this,arguments);}finally{DET.hull--;}};
  }
  /* рост человека: масштаб, в котором рисуется астронавт (20-life) */
  if(typeof drawAstronaut==="function"){
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
   против часовой. Проба ±40° шагом 4° */
function detRot(p0,p1){
  if(!p0||!p1)return null;
  const n=p0.n,c=n/2,R=c-2;let best={th:0,e:1e9},e0=1e9,eNeg=1e9,ePos=1e9;
  for(let th=-40;th<=40;th+=4){
    const t=th*Math.PI/180,co=Math.cos(t),si=Math.sin(t);let s=0,k=0;
    for(let y=0;y<n;y+=2)for(let x=0;x<n;x+=2){
      const u=x-c,v=y-c;if(u*u+v*v>R*R)continue;
      const X=Math.round(c+co*u+si*v),Y=Math.round(c-si*u+co*v);
      if(X<0||Y<0||X>=n||Y>=n)continue;
      s+=Math.abs(p1.L[y*n+x]-p0.L[Y*n+X]);k++;
    }
    const e=s/Math.max(1,k);if(th===0)e0=e;if(e<best.e)best={th,e};
    if(th<0&&e<eNeg)eNeg=e;if(th>0&&e<ePos)ePos=e;
  }
  best.e0=e0;best.eNeg=eNeg;best.ePos=ePos;return best;
}
/* масштаб от центра: во сколько раз содержимое выросло */
function detScale(a,b,cx,cy){
  let best={s:1,e:1e9},e1=1e9;
  for(const s of [.6,.7,.8,.87,.93,1,1.07,1.15,1.25,1.35,1.5,1.7]){
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
/* блоки 8×8 копии: мигание (A→B→A) и выскакивание (плоское ↔ фактурное) */
function detBlink(f0,f1,f2){
  const SW=f0.w,SH=f0.h,B=8;let fl=0,pop=0,n=0;const where=[];
  for(let by=0;by+B<=SH;by+=B)for(let bx=0;bx+B<=SW;bx+=B){
    n++;let d01=0,d12=0,d02=0,a0=1e9,b0=-1,a1=1e9,b1=-1;
    for(let y=by;y<by+B;y++)for(let x=bx;x<bx+B;x++){
      const i=y*SW+x;d01+=Math.abs(f1[i]-f0[i]);d12+=Math.abs(f2[i]-f1[i]);d02+=Math.abs(f2[i]-f0[i]);
      if(f0[i]<a0)a0=f0[i];if(f0[i]>b0)b0=f0[i];if(f1[i]<a1)a1=f1[i];if(f1[i]>b1)b1=f1[i];
    }
    d01/=B*B;d12/=B*B;d02/=B*B;
    const blink=d01>6&&d12>6&&d02<Math.min(d01,d12)*.35;
    const c0=b0-a0,c1=b1-a1,popped=(c0<6&&c1>40)||(c1<6&&c0>40);
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
    if(typeof HTMLCanvasElement!=="undefined"&&(v instanceof ImageData||v instanceof CanvasRenderingContext2D))return;
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

/* ── приборы: цифра на экране против поля, из которого она обязана читать ──
   Одна короткая таблица на всё, что игрок читает глазами как ПОКАЗАНИЕ.
   `dom` — элемент (судится, только когда виден), `cv` — строка с канвы по
   образцу, `want` — что там должно стоять, посчитанное из мира ТЕМ ЖЕ способом,
   каким игрок это понимает, а не тем, каким это считает hud(). «РАКЕТА 0»
   с кнопки, у которой нет пусковой, или ноль при полном трюме — умирают здесь. */
function detSuitSrc(){
  return (G.mode==="raid"&&G.raid)?G.raid:(G.surf&&(G.mode==="surface"||G.mode==="cave"||G.mode==="dig")?G.surf:null);
}
const DET_INSTR=[
  {ru:"бак",dom:"fnum",want:()=>Math.round(G.fuel)+"/"+Math.round(stat().fuelMax)},
  {ru:"корпус",dom:"hnum",want:()=>Math.round(G.hull)+"/"+Math.round(stat().hullMax)},
  {ru:"трюм",dom:"cnum",want:()=>held()+"/"+stat().cargoMax},
  {ru:"щит",dom:"snum",want:()=>Math.round(G.shield||0)+"/"+Math.round(stat().shieldMax)},
  {ru:"энергия",dom:"enum",want:()=>Math.round(clamp(G.energy||0,0,stat().energyMax))+"/"+stat().energyMax},
  {ru:"скафандр",dom:"unum",want:()=>{const s=detSuitSrc();return s?Math.round(clamp(s.suit,0,100))+"%":null;}},
  {ru:"ранец",dom:"jnum",want:()=>(typeof jetFuel==="function"&&G.surf)?Math.round(clamp(jetFuel(),0,1)*100)+"%":null},
  {ru:"кошелёк",dom:"purse",re:/^([\d\s  ]+) кр · (\d+) дан/,want:m=>[String(Math.round(G.credits)),String(G.data)],
    got:m=>[m[1].replace(/[\s  ]/g,""),m[2]]},
  /* ракеты: остаток в трюме, а не счётчик кнопки; «…» — перезарядка */
  {ru:"ракеты",dom:"mslbtn",re:/^РАКЕТА (\d+)$/,want:()=>[String(G.cargo.missile|0)],got:m=>[m[1]]},
  {ru:"кошелёк станции",dom:"wCr",re:/^([\d\s  ]+) кр$/,want:()=>[String(G.credits|0)],got:m=>[m[1].replace(/[\s  ]/g,"")]},
  {ru:"данные станции",dom:"wDt",re:/^(\d+) данных$/,want:()=>[String(G.data)],got:m=>[m[1]]},
  /* канва: масштаб камеры и расстояния на фишках у кромки (17-mode-system) */
  {ru:"масштаб",cv:/^МАСШТАБ ×(\d+\.\d\d)$/,mode:"system",want:()=>[G.zoom.toFixed(2)]},
  {ru:"до звезды",cv:/^ЗВЕЗДА · (\d+)$/,mode:"system",want:()=>[String(Math.round(Math.hypot(G.ship.x,G.ship.y)))],tol:2},
  {ru:"до станции",cv:/^(.+) · (\d+)$/,mode:"system",
    pick:m=>G.sys&&G.sys.station&&m[1]===G.sys.station.name.toUpperCase(),
    want:()=>[G.sys.station.name.toUpperCase(),String(Math.round(Math.hypot(G.sys.station.x-G.ship.x,G.sys.station.y-G.ship.y)))],tol:2},
  /* трюм на приборной доске пояса (24-mode-belt) */
  {ru:"трюм пояса",cv:/^ТРЮМ (\d+) \/ (\d+)$/,mode:"belt",want:()=>[String(held()),String(stat().cargoMax)]}
];
/* снять показания — это наблюдение, его делает шаг; судит detInstr */
function detInstrRead(texts){
  const out=[];
  for(const I of DET_INSTR){
    if(I.mode&&I.mode!==G.mode)continue;
    let want;try{want=I.want();}catch(e){want=null;}
    if(want==null)continue;
    if(I.dom){
      const el=document.getElementById(I.dom);if(!el)continue;
      const cs=getComputedStyle(el);
      if(cs.visibility==="hidden"||!el.getClientRects().length)continue;
      const txt=String(el.textContent||"").trim();
      if(I.re){const m=I.re.exec(txt);if(!m)continue;out.push({ru:I.ru,shown:I.got(m),want:I.want(m),tol:I.tol||0});}
      else out.push({ru:I.ru,shown:[txt],want:[want],tol:0});
    }else if(I.cv&&texts){
      for(const t of texts){const m=I.cv.exec(t.s);if(!m)continue;if(I.pick&&!I.pick(m))continue;
        out.push({ru:I.ru,shown:m.slice(1),want,tol:I.tol||0});}
    }
  }
  return out;
}

/* ── исключения по праву: у каждого имя и причина ──
   Сюда не кладут «ну он такой». Кладут то, что задумано так, и говорят, где
   это задумано. Детектор, покрасневший не на баг, чинят в детекторе, а не здесь. */
const DET_EXEMPT=[
  /* номера ярусов у стенки ствола — меловая риска, не прибор: гаснут
     вместе со светом отсека, яркий только текущий (21ac-base-draw) */
  {det:"картина",mode:"base",what:/^текст «\d+»/,why:"номера ярусов — краска на стене ствола"},
  /* погашенная лампа табло пояса тусклая нарочно: «погашенная и так ничего не
     значит, а над миром висит только нужное сейчас» (25-cockpit); горящая
     зажигается своим цветом */
  {det:"картина",mode:"belt",what:/^текст «(СБЛИЖЕНИЕ|ТОПЛИВО|ТРЮМ ПОЛОН)» не читается/,why:"погашенная лампа табло"},
  /* капли и хлопья рисуются в каждом кадре на новом месте (19d-weather):
     это движение погоды, и на тёмном небе каждая капля — «выскочивший» блок */
  {det:"картина",what:/^за один кадр выскакивает.*\(осадки: (rain|acid|snow|ash|dust|spore)\)/,why:"осадки — новые капли в каждом кадре"},
  /* рост человека: разрез базы меряется своим человеком (21aa-base-rooms:
     «ростом 26 px»), абордаж — проекцией с глубиной (24aa-raid-draw) */
  {det:"картина",what:/^рост человека · (база|рейд)/,why:"сцена со своим масштабом по замыслу"}
];
function detExempt(v){
  for(const E of DET_EXEMPT){
    if(E.det&&E.det!==v.det)continue;
    if(E.mode&&E.mode!==v.mode)continue;
    if(E.scene&&E.scene!==v.scene)continue;
    if(E.gesture&&E.gesture!==v.gesture)continue;
    if(E.what&&!E.what.test(v.what))continue;
    return E.why;
  }
  return "";
}

/* ══════════════ сами детекторы: ctx → нарушения ══════════════ */
function detV(c,det,what,where){return {det,scene:c.scene,gesture:c.gesture,mode:c.mode1||c.mode0,what,where:where||""};}

/* 1. СБОЙ */
function detCrash(c){
  const v=[];
  for(const e of c.threw||[])v.push(detV(c,"сбой","исключение в шаге: "+e));
  if(c.crash>0)v.push(detV(c,"сбой","сторож кадра сработал "+c.crash+" раз"));
  for(const e of c.errs||[])v.push(detV(c,"сбой","window.onerror: "+e));
  for(const e of c.cons||[])v.push(detV(c,"сбой","console.error: "+e));
  return v;
}
/* 2. ЗАСТОЙ */
function detStuck(c){
  const v=[];
  if(c.sick)v.push(detV(c,"застой",c.sick));
  for(const o of c.overlays||[])if(!o.closed)v.push(detV(c,"застой","экран «"+o.what+"» не закрывается ни своей кнопкой, ни Escape",o.tried||""));
  /* рука на руле, а в кадре и в мире — ничего: ни пикселя, ни поля */
  if((c.gesture==="W"||c.gesture==="A")&&c.mode1===c.mode0&&!c.spoke&&
     c.before&&c.after&&detDiff(c.before,c.after)===0&&c.sig0===c.sig1)
    v.push(detV(c,"застой","под клавишей "+c.gesture+" не сдвинулось ничего — ни кадр, ни мир"));
  return v;
}
/* 3. ЗАКОН: числа, типы, опечатки */
function detLaw(c){
  const v=[];
  if(c.walk){
    for(const b of c.walk.bad)v.push(detV(c,"закон","не число в мире: "+b));
    if(c.prevTypes)for(const [p,t] of c.walk.types){
      const t0=c.prevTypes.get(p);if(!t0||t0===t)continue;
      if((t0==="number"&&(t==="string"||t==="undefined"))||(t0==="string"&&t==="number")||(t0==="boolean"&&t==="string"))
        v.push(detV(c,"закон","поле сменило тип: "+p+" было "+t0+", стало "+t));
    }
  }
  const N=c.names;
  if(N&&N.ok){
    for(const k of Object.keys(c.reads||{})){
      const nm=k.slice(k.lastIndexOf(".")+1);
      if(!N.set.has(nm))v.push(detV(c,"закон","читают поле, которого не пишет никто: "+k+" ×"+c.reads[k]));
    }
    for(const k of Object.keys(c.writes||{})){
      const nm=k.slice(k.lastIndexOf(".")+1);
      if((N.count.get(nm)||0)<=1)v.push(detV(c,"закон","пишут поле, которого не читает никто: "+k));
    }
  }
  return v;
}
/* 3. ЗАКОН: приборы и числа на глазах */
const DET_DIRTY=/NaN|undefined|Infinity|\bnull\b|-0(?![.,\d])|\d\.\d{4,}|\d+e[+-]?\d+/;
function detInstr(c){
  const v=[];
  for(const r of c.inst||[]){
    for(let i=0;i<r.want.length;i++){
      const a=r.shown[i],b=r.want[i];
      const same=a===b||(r.tol&&isFinite(+a)&&isFinite(+b)&&Math.abs(+a-+b)<=r.tol);
      if(!same){v.push(detV(c,"закон","прибор «"+r.ru+"» показывает "+r.shown.join("/")+", а в мире "+r.want.join("/")));break;}
    }
  }
  for(const t of c.texts||[])if(!t.hull&&DET_DIRTY.test(t.s))v.push(detV(c,"закон","число на канве не человеческое: «"+t.s.slice(0,40)+"»"));
  for(const s of c.hudText||[])if(DET_DIRTY.test(s))v.push(detV(c,"закон","число на приборах не человеческое: «"+s.slice(0,40)+"»"));
  return v;
}
/* 3. ЗАКОН: орган управления отвечает кадром — и по смыслу (M437) */
function detControls(c){
  const v=[];
  if(c.gesture==="покой"||!c.before||!c.after)return v;
  const d=detDiff(c.before,c.after),churn=c.churn||0;
  const other=c.spoke||c.dom1!==c.dom0||c.mode1!==c.mode0;
  /* ── смысл жеста — там, где он у жеста есть ──
     Там класс и есть ответ: W в полёте двигает корабль на пиксели, а не на
     проценты кадра, и порог «вдвое больше своего шевеления» его не слышит.
     Корабль, ушедший по носу относительно фона, — ответ, который видно. */
  let cls=null,why="";
  if(c.mode1===c.mode0){
    if(c.gesture==="W"&&c.mode0==="system"&&c.p0&&c.p1&&c.ship0){
      const sp=detPatchShift(c.p0,c.p1,16);
      const sx=c.ship0[0]/c.before.k,sy=c.ship0[1]/c.before.k;
      const bg=detBgShift(c.before,c.after,3,(x,y)=>Math.hypot(x-sx,y-sy)>18);
      const rx=sp.dx-bg.dx,ry=sp.dy-bg.dy,m=Math.hypot(rx,ry);
      const along=m?(rx*Math.cos(c.nose0)+ry*Math.sin(c.nose0))/m:0;
      cls=m>=3&&along>.5;
      why="W: корабль не пошёл по носу — сдвиг относительно фона "+rx.toFixed(0)+","+ry.toFixed(0)+" px, по носу "+along.toFixed(2);
    }else if(c.gesture==="A"&&c.mode0==="system"&&c.p0&&c.p1){
      const r=detRot(c.p0,c.p1);
      cls=r.th<=-4&&r.eNeg<r.ePos*.95;
      why="A: нос не повернул против часовой — лучший поворот кадра "+r.th+"° (против "+r.eNeg.toFixed(1)+", по "+r.ePos.toFixed(1)+")";
    }else if(c.gesture==="колесо"&&(c.mode0==="system"||c.mode0==="map")&&c.zc){
      const s=detScale(c.before,c.after,c.zc[0]/c.before.k,c.zc[1]/c.before.k);
      cls=s.s>=1.07&&s.e<s.e1*.97;
      why="«+» и колесо: кадр не укрупнился от центра (лучший масштаб ×"+s.s+")";
    }else if(c.gesture==="протяжка"&&c.mode0==="map"&&c.drag){
      const p=detParallax(c.before,c.after,c.drag[0],c.drag[1]);
      cls=p.deep>=.15&&p.sheet>=.1;
      why="протяжка карты: слои не идут по глубине — с листом "+Math.round(p.sheet*100)+"% блоков, с небом "+
        Math.round(p.deep*100)+"%, прибито к экрану "+Math.round(p.still*100)+"%";
    }
  }
  if(cls===false){v.push(detV(c,"закон",why));return v;}
  if(cls===true||other||c.mute)return v;
  const fresh=detNewMotion(detBlocks(c.before,c.after),c.idleB);
  if(!(d>Math.max(churn*2,.004))&&fresh<2)
    v.push(detV(c,"закон","жест «"+c.gesture+"» остался без ответа: кадр "+(d*100).toFixed(2)+"% при своём шевелении "+
      (churn*100).toFixed(2)+"%, нового движения "+fresh+" блоков, голоса нет, окна нет, режим тот же"+
      (c.fieldMoved?" (поле при этом менялось — игрок его не видит)":"")));
  return v;
}
/* 4. КАРТИНА: кадр в покое */
const DET_TEXT_MIN=8;     /* кегль в CSS-пикселях при мерке 1; дальше — × UIK (M221) */
function detLum(r,g,b){const f=x=>{x/=255;return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4);};return .2126*f(r)+.7152*f(g)+.0722*f(b);}
function detColor(s){
  let m=/^#([0-9a-f]{6})$/i.exec(s);if(m){const n=parseInt(m[1],16);return [n>>16,(n>>8)&255,n&255,1];}
  m=/^#([0-9a-f]{3})$/i.exec(s);if(m){const h=m[1];return [parseInt(h[0]+h[0],16),parseInt(h[1]+h[1],16),parseInt(h[2]+h[2],16),1];}
  m=/rgba?\(([^)]+)\)/.exec(s);if(m){const p=m[1].split(",").map(Number);return [p[0],p[1],p[2],p.length>3?p[3]:1];}
  return null;
}
/* контраст текста: цвет заливки поверх того, что лежит вокруг надписи. Фон —
   медиана кольца в два пикселя вокруг габарита: плашка под фишкой — тоже фон,
   и так и должно быть */
function detContrast(t,full,fw,fh){
  const c=detColor(t.col);if(!c||!full)return null;
  const x0=Math.max(0,Math.floor(t.x0)-2),y0=Math.max(0,Math.floor(t.y0)-2),x1=Math.min(fw-1,Math.ceil(t.x1)+2),y1=Math.min(fh-1,Math.ceil(t.y1)+2);
  if(x1-x0<3||y1-y0<3)return null;
  const L=[];
  const put=(x,y)=>{const i=(y*fw+x)*4;L.push(detLum(full[i],full[i+1],full[i+2]));};
  for(let x=x0;x<=x1;x+=2){put(x,y0);put(x,y1);}
  for(let y=y0;y<=y1;y+=2){put(x0,y);put(x1,y);}
  L.sort((a,b)=>a-b);const bg=L[L.length>>1];
  const a=c[3]*(t.al==null?1:t.al),tl=detLum(c[0],c[1],c[2])*a+bg*(1-a);
  return (Math.max(tl,bg)+.05)/(Math.min(tl,bg)+.05);
}
function detPicture(c){
  const v=[];
  /* ── кегль × мерка: кадр большого окна (M221, M437) ──
     В окне прогона мерка ≈1, и текст, забывший про неё, выглядит нормально:
     ровно так карта полгода печатала подписи в 8 px при раздутом борте. Поэтому
     кегль судится в кадре 2560×1440 (мерка ×1.75), который шаг рисует отдельно:
     всё, что игрок читает, обязано вырасти вместе с бортом — хотя бы до 8 px × мерку. */
  if(c.gesture==="мерка"){
    const need=DET_TEXT_MIN*(c.UIK||1)*.97;
    for(const t of c.texts||[]){
      if(t.hull||!t.s.trim())continue;
      if(t.px<need)v.push(detV(c,"картина","текст «"+t.s.slice(0,28)+"» "+t.px.toFixed(1)+" px в окне "+c.W+"×"+c.H+
        " (мерка ×"+(c.UIK||1).toFixed(2)+") — нужно не меньше "+need.toFixed(1)));
    }
    return v;
  }
  if(c.gesture!=="покой")return v;
  const f=c.before;
  if(f){
    let s=0,s2=0,hot=0;for(let i=0;i<f.length;i++){s+=f[i];s2+=f[i]*f[i];if(f[i]>250)hot++;}
    const mu=s/f.length,sd=Math.sqrt(Math.max(0,s2/f.length-mu*mu));
    if(sd<3)v.push(detV(c,"картина","кадр пуст: разброс яркости "+sd.toFixed(1)));
    if(hot/f.length>.5)v.push(detV(c,"картина","кадр выжжен: белого "+Math.round(hot/f.length*100)+"%"));
  }
  if(c.f1&&c.f2&&f){
    const b=detBlink(f,c.f1,c.f2);
    if(b.blink>.01)v.push(detV(c,"картина","кадр в покое мигает: "+(b.blink*100).toFixed(1)+"% блоков",b.where.join(" ")));
    if(b.pop>.005)v.push(detV(c,"картина","за один кадр выскакивает или пропадает "+(b.pop*100).toFixed(1)+"% блоков"+
      (c.precip?" (осадки: "+c.precip+")":""),b.where.join(" ")));
  }
  /* текст: контраст в настоящем кадре (кегль — в кадре «мерка» выше) */
  for(const t of c.texts||[]){
    if(t.hull||!t.s.trim())continue;
    const cr=detContrast(t,c.full,c.fw,c.fh);
    if(cr!=null&&cr<3)v.push(detV(c,"картина","текст «"+t.s.slice(0,28)+"» не читается: контраст "+cr.toFixed(1)+" (нужно 3)"));
  }
  /* резкость: холст равен окну × плотность, растр в панели не мельче своей рамки */
  if(c.cvsW!=null&&c.cvsW!==Math.round(c.W*c.DPR))v.push(detV(c,"картина","холст "+c.cvsW+" px при окне "+c.W+"×"+c.DPR));
  for(const k of c.canv||[])if(k.bw<k.cw*k.dpr*.9||k.bh<k.ch*k.dpr*.9)
    v.push(detV(c,"картина","растр «"+k.id+"» мыльный: "+k.bw+"×"+k.bh+" на рамку "+k.cw.toFixed(0)+"×"+k.ch.toFixed(0)+" (×"+k.dpr+")"));
  return v;
}
/* 4. КАРТИНА за весь прогон: у человека один рост на ногах */
const DET_ASTRO_H=25;   /* рост астронавта в своих единицах (20-life: шлем −13, ботинок 11.5) */
function detHuman(run){
  const v=[],by={};
  for(const r of run)if(r.astro&&r.astro.length){const a=r.astro.slice().sort((x,y)=>x-y);by[r.scene]={mode:r.mode,h:a[a.length>>1]*DET_ASTRO_H};}
  const foot=Object.keys(by).filter(s=>["surface","cave","dig"].includes(by[s].mode));
  if(foot.length>=2){
    const hs=foot.map(s=>by[s].h),lo=Math.min(...hs),hi=Math.max(...hs);
    if(hi>lo*1.12)v.push({det:"картина",scene:"все",gesture:"покой",mode:"",what:"рост человека на ногах разный: "+foot.map(s=>s+" "+by[s].h.toFixed(0)).join(", "),where:""});
    for(const s of Object.keys(by))if(!foot.includes(s)){
      const h=by[s].h;if(h<lo*.88||h>hi*1.12)
        v.push({det:"картина",scene:s,gesture:"покой",mode:by[s].mode,what:"рост человека · "+s+" "+h.toFixed(0)+" px против "+lo.toFixed(0)+" на ногах",where:""});
    }
  }
  return v;
}
const DETECTORS=[detCrash,detStuck,detLaw,detInstr,detControls,detPicture];
