/* ══════════════ Слова на вещах (M803): табличка у вещи, центр кадра пуст ══════════════
   Строки, которые прежде вставали посреди экрана (прибытие, штамп границы, заход на посадку,
   ковш, пояс), и «что» у памятника на поверхности висят теперь у самой вещи: маленькая табличка
   материалом «Борта» (M720) — дымчатый графит, срезанный угол, кремовые чернила, акцент только у
   глагола. Закон кадра: в средних 40 % по ширине и высоте не стоит ничего, кроме самой вещи, — и
   табличка отходит от вещи наружу, а к вещи тянется тонкий поводок с точкой.
   Раскладка — перебор: восемь сторон вокруг вещи, шаг наружу, пока прямоугольник не выйдет из
   середины, из-под приборов (HUD_BAND сверху, HUD_FLOOR снизу, борт HUD_RAIL справа — числа 27z,
   чтения вёрстки в кадре нет), из-под других табличек и подписей мира. Прошлая сторона дешевле:
   табличка не прыгает. Не встала нигде — не рисуется (на телефоне так и бывает: под ней пэды).
   Рисует ovHangFlush из ovFlush (08bi) — после мира, до прохода слоя. Без видеокарты слоя нет:
   hangSay тогда говорит прежним say(), ovHang молчит.
   Очередь — интерфейс (OVL.uq); пока рисуется табличка, OVL.hangOn — её первая строка: зрение
   (90b2) метит этим её буквы и плашку, и закон «центр» судит только их, не подписи мира. */
const HANG={on:true,q:[],t:[],at:{},mem:{},w:new Map(),st:new Map(),last:[],k:1,
  FACE:"Bahnschrift,'Roboto Condensed','Arial Narrow',sans-serif",
  INK:"#f1ebde",INK2:"#a59d8f",VERB:"#ff6a2b",BODY:"rgb(18,17,16)",EDGE:"rgb(232,220,196)"};
/* восемь сторон: вправо, вправо-вверх, вверх, … — с ценой; up — для вещей на земле (поверхность) */
const HANG_DIR=[[1,0,0],[.71,-.71,6],[0,-1,10],[-.71,-.71,12],[-1,0,8],[-.71,.71,18],[0,1,24],[.71,.71,14]];
/* слой будет: видеокарта есть и не потеряна (GPU.on — «кадр идёт», вне кадра он ложь: say и
   подсказки пишутся и из ввода); положить в очередь — только внутри кадра (hangIn) */
function hangOk(){return HANG.on&&typeof GPU!=="undefined"&&!!GPU.ok&&!GPU.lost;}
function hangIn(){return hangOk()&&GPU.on;}
/* табличка на этот кадр: id — её память стороны, text — строки (\n или массив), (x,y) — точка вещи
   в пикселях CSS, o: {r — радиус вещи на экране, verb — номер строки-глагола, ink — цвет штампа,
   al — прозрачность, up — сперва вверх} */
function ovHang(id,text,x,y,o){
  if(!hangIn()||!isFinite(x)||!isFinite(y))return;
  const L=Array.isArray(text)?text:String(text).split("\n");
  HANG.q.push({id,lines:L.filter(s=>s!=null&&s!==""),x,y,o:o||{}});
}
/* точка вещи этого кадра для говорящих по таймеру (ship, scoop, rock): кладёт режим. z — камера,
   а не вещь (sys): (x,y) — середина кадра в мире, z — масштаб; вещь тогда — o.obj говорящего {x,y,radius} */
function hangAt(kind,x,y,r,z){
  if(!hangIn())return;
  const a=HANG.at[kind]||(HANG.at[kind]={});
  a.x=x;a.y=y;a.r=r||12;a.z=z||0;a.f=OVL.fno;
}
/* чужая плашка этого кадра, которой нет в OVL.lab/chip (полоса подсказки поверхности, 21e):
   рамка в пикселях устройства (как ovPush; под withScale ovNd() уже не тот), живёт один кадр — раскладка её обходит */
function hangBlock(x0,y0,x1,y1){
  if(!hangIn())return;
  if(!HANG.blk||HANG.blkF!==OVL.fno){HANG.blk=[];HANG.blkF=OVL.fno;}
  HANG.blk.push({x0,y0,x1,y1});
}
/* сказать у вещи на d кадров (как say): без слоя — прежний say() в #msg. Возвращает, повешено ли */
function hangSay(id,text,kind,d,o){
  const L=Array.isArray(text)?text:String(text).split("\n");
  if(!hangOk()){say(L.join("\n"));return false;}   /* прежний голос — прежнего срока */
  const T=HANG.t;
  for(let i=T.length-1;i>=0;i--)if(T[i].id===id)T.splice(i,1);
  T.push({id,lines:L,kind,n:d||150,n0:d||150,mode:G.mode,o:o||{}});
  return true;
}
/* ── мерки: ширина строки та же, что у ovText (цифры — моноширинно по «0») ── */
function hangSt(font){let s=HANG.st.get(font);if(!s)HANG.st.set(font,s=Object.assign({},GC_DEF,{font,textBaseline:"alphabetic",textAlign:"left"}));return s;}
function hangTW(font,s){
  const key=font+"|"+s;let w=HANG.w.get(key);
  if(w!==undefined)return w;
  const st=hangSt(font),d0=GC_GLYPHS.measure(st,"0").width;w=0;
  for(const r of (s.match(OVL_RUN)||[])){const c=r.charCodeAt(0);w+=(c>47&&c<58)?d0*r.length:GC_GLYPHS.measure(st,r).width;}
  if(HANG.w.size>400)HANG.w.clear();
  HANG.w.set(key,w);return w;
}
function hangFont(i,P){return (i===0?"600 12px ":"11px ")+HANG.FACE;}
/* размер таблички в пикселях CSS (k — линейка интерфейса) */
function hangSize(P,k){
  let tw=0;
  for(let i=0;i<P.lines.length;i++)tw=Math.max(tw,hangTW(hangFont(i,P),P.lines[i]));
  const n=P.lines.length;
  return {w:Math.ceil(tw*k+20*k),h:Math.ceil((17+(n-1)*14+11)*k)};
}
/* ── геометрия ── */
const hangHit=(a,b,m)=>a.x0<b.x1+m&&a.x1>b.x0-m&&a.y0<b.y1+m&&a.y1>b.y0-m;
/* выноска режет чужую плашку: шестнадцать точек отрезка от вещи до таблички */
function hangCut(ax,ay,bx,by,O){
  for(const B of O)for(let i=1;i<16;i++){const t=i/16,x=ax+(bx-ax)*t,y=ay+(by-ay)*t;if(x>B.x0&&x<B.x1&&y>B.y0&&y<B.y1)return true;}
  return false;
}
function hangRectAt(P,dx,dy,d,w,h){
  const px=P.x+dx*d,py=P.y+dy*d;
  const x0=dx>.3?px:dx<-.3?px-w:px-w/2,y0=dy>.3?py:dy<-.3?py-h:py-h/2;
  return {x0,y0,x1:x0+w,y1:y0+h};
}
/* препятствия кадра: борт справа, подписи и фишки мира прошлого кадра (их рамки знает 08bi) */
function hangObstacles(bot){
  const O=[];
  if(typeof HUD_RAIL==="number"&&HUD_RAIL>0&&HUD_RAIL<W)O.push({x0:HUD_RAIL,y0:Math.max(0,HUD_RAILTOP||0),x1:W,y1:bot});
  for(const M of [OVL.lab,OVL.chip])for(const e of M.values()){
    if(e.fr!==OVL.fno)continue;   /* положены этим кадром: e.on станет верным только в ovFlush */
    if(e.w!=null)O.push({x0:e.x,y0:e.y,x1:e.x+e.w,y1:e.y+e.h});
    else if(e.x0!=null)O.push({x0:e.x0,y0:e.y0,x1:e.x1,y1:e.y1});
  }
  if(HANG.blk&&HANG.blkF===OVL.fno){const s=1/ovNd();for(const b of HANG.blk)O.push({x0:b.x0*s,y0:b.y0*s,x1:b.x1*s,y1:b.y1*s});}
  /* строка сообщения #msg (DOM, style.css): по центру на четверти высоты, капсом, разрядка .14em.
     DOM в кадре не читаем — рамка считается по тексту теми же глифами, с запасом */
  if(G.msgT>0&&G.msg&&!(typeof msgHeld==="function"&&msgHeld())){
    /* телефон (max-width:760px): верх 20 %, кегль 11, строка 1.4, ширина до краёв без 24, перенос до трёх строк */
    const ph=W<=760,k=Math.max(1,uiK()),L=String(G.msg).toUpperCase().split("\n"),fs=ph?11:12,f=fs+"px "+HANG.FACE;
    const mw=Math.min(ph?W-24:W*.84,W/2);let w=0,n=0;   /* left:50% — блок сжимается до половины окна */
    for(const s of L){const sw=(hangTW(f,s)+s.length*fs*.14)*k+12*k;w=Math.max(w,sw);n+=Math.max(1,Math.ceil(sw/mw));}
    w=Math.min(mw,w);const h=Math.min(n,ph?3:9)*fs*(ph?1.4:1.95)*k+4*k;
    const t=Math.max(H*(ph?.2:.25),(typeof HUD_MAPBAR==="number"&&HUD_MAPBAR>0)?HUD_MAPBAR+8*k:0);
    O.push({x0:W/2-w/2,y0:t,x1:W/2+w/2,y1:t+h});
  }
  return O;
}
/* раскладка: каждая табличка — первая годная точка по каждой стороне, лучшая по цене */
function hangLayout(Q,k){
  const band={x0:W*.3,y0:H*.3,x1:W*.7,y1:H*.7};
  const top=Math.max(8,(typeof HUD_BAND==="number"?HUD_BAND:0)+6);
  const bot=((typeof HUD_FLOOR==="number"&&HUD_FLOOR>0)?Math.min(H,HUD_FLOOR):H)-6;
  const O=hangObstacles(bot+6),placed=[],g=12*k,step=4*k,maxD=Math.max(W,H)*.7;
  for(const P of Q){
    const S=hangSize(P,k),r=Math.max(4,P.o.r||10),mem=HANG.mem[P.id];
    let best=null;
    for(let di=0;di<8;di++){
      const D=HANG_DIR[di],pref=P.o.up?(di===2?-12:di===1||di===3?-4:D[2]):D[2];
      for(let d=r+g;d<maxD;d+=step){
        const R=hangRectAt(P,D[0],D[1],d,S.w,S.h);
        if(R.x0<8||R.x1>W-8||R.y0<top||R.y1>bot)continue;
        if(hangHit(R,band,2*k))continue;   /* кайма шире рамки на 1k, плюс сетка устройства */
        /* не на самой вещи: ближняя точка таблички дальше её радиуса */
        const nx=clamp(P.x,R.x0,R.x1),ny=clamp(P.y,R.y0,R.y1);
        if(Math.hypot(nx-P.x,ny-P.y)<r*.9)continue;
        let bad=false;
        for(const B of placed)if(hangHit(R,B,6*k)){bad=true;break;}
        if(!bad)for(const B of O)if(hangHit(R,B,4*k)){bad=true;break;}
        if(bad)continue;
        const cost=d+pref*k-(mem===di?40*k:0)+(hangCut(P.x,P.y,nx,ny,O)?400*k:0);
        if(!best||cost<best.cost)best={R,cost,di,d,nx,ny};
        break;
      }
    }
    if(!best){P.hide=true;continue;}
    HANG.mem[P.id]=best.di;P.R=best.R;P.nx=best.nx;P.ny=best.ny;P.r=r;
    placed.push(best.R);
  }
}
/* ── рисунок ── */
function hangTri(ax,ay,bx,by,cx,cy,pm){
  const s=ovNd(),t=[ax*s,ay*s,bx*s,by*s,cx*s,cy*s];
  ovPush(OVL.uq,Math.min(t[0],t[2],t[4]),Math.min(t[1],t[3],t[5]),Math.max(t[0],t[2],t[4]),Math.max(t[1],t[3],t[5]),pm,2,0,0,0,t);
}
/* шестиугольник со срезами справа сверху и слева снизу: средний прямоугольник во всю высоту
   (он же — плашка надписей для зрения), две колонки по краям и два треугольника срезов. Куски
   не перекрываются и стоят на пикселях устройства — шва нет */
function hangHex(x0,y0,x1,y1,c,col,al){
  const pm=ovPm(col,al);
  ovRect(x0,y0,x0+c,y1-c,col,al);hangTri(x0,y1-c,x0+c,y1-c,x0+c,y1,pm);
  ovRect(x1-c,y0+c,x1,y1,col,al);hangTri(x1-c,y0,x1,y0+c,x1-c,y0+c,pm);
  ovRect(x0+c,y0,x1-c,y1,col,al);
}
function hangDraw(P,k){
  const nd=ovNd(),sn=v=>Math.round(v*nd)/nd,R=P.R,al=P.o.al==null?1:P.o.al;
  const x0=sn(R.x0),y0=sn(R.y0),x1=sn(R.x1),y1=sn(R.y1),c=sn(6*k),ink=P.o.ink||null;
  /* поводок: от кромки вещи к ближней точке таблички, если та отошла */
  const dx=P.nx-P.x,dy=P.ny-P.y,dl=Math.hypot(dx,dy);
  if(dl>P.r+16*k){
    const ux=dx/dl,uy=dy/dl,ax=P.x+ux*(P.r+3*k),ay=P.y+uy*(P.r+3*k);
    ovCap(ax,ay,P.nx-ux*2*k,P.ny-uy*2*k,1*k,ink||HANG.INK,.42*al);
    ovEll(ax,ay,2*k,2*k,0,ink||HANG.INK,.85*al);
  }
  OVL.hangOn=P.lines[0]||"·";
  const e=ink?1.5*k:1*k;
  hangHex(sn(x0-e),sn(y0-e),sn(x1+e),sn(y1+e),sn(c+e*.42),ink||HANG.EDGE,(ink?.62:.17)*al);
  hangHex(x0,y0,x1,y1,c,HANG.BODY,.86*al);
  const tx=x0+10*k;
  for(let i=0;i<P.lines.length;i++){
    const col=ink||(i===P.o.verb?HANG.VERB:i===0?HANG.INK:HANG.INK2);
    ovText(OVL.uq,tx,y0+(17+i*14)*k-(i?1*k:0),P.lines[i],hangFont(i,P),col,"left","alphabetic",al,k);
  }
  OVL.hangOn=0;
}
/* ── слив: зовёт ovFlush (08bi) первым делом ── */
function ovHangFlush(){
  const Q=HANG.q;
  for(let i=HANG.t.length-1;i>=0;i--){const e=HANG.t[i];
    if(e.mode!==G.mode||--e.n<=0){HANG.t.splice(i,1);continue;}
    const a=HANG.at[e.kind];
    if(!a||a.f!==OVL.fno)continue;
    const al=Math.min(1,e.n/30,(e.n0-e.n+1)/8),b=e.o.obj;
    if(a.z&&b)Q.push({id:e.id,lines:e.lines,x:W/2+(b.x-a.x)*a.z,y:H/2+(b.y-a.y)*a.z,o:Object.assign({},e.o,{r:Math.max(6,(b.radius||4)*a.z),al})});
    else if(!a.z)Q.push({id:e.id,lines:e.lines,x:a.x,y:a.y,o:Object.assign({},e.o,{r:a.r,al})});}
  hangSurface();
  HANG.last.length=0;
  if(!Q.length||OVL.hush||!hangIn()){Q.length=0;return;}
  const k=Math.max(1,uiK());HANG.k=k;
  hangLayout(Q,k);
  for(const P of Q)if(!P.hide){hangDraw(P,k);HANG.last.push({id:P.id,s:P.lines[0],r:P.R});}
  Q.length=0;
}
/* ── поверхность под движком планеты: «что» у вещи, одной строкой ──
   Подсказка G.prompt остаётся в кнопке ДЕЙСТВИЯ как была; её строка «ИМЯ · СОСТОЯНИЕ» ещё и
   висит у вещи: у памятника — над вершиной (plnMarkWorld, 21pie), у залежи — над камнем.
   Точка вещи в кадр — тем же объективом, что у кадра (plnLens с окном кадра G.viewX/G.viewY) */
function hangSurface(){
  if(G.mode!=="surface"||typeof PLN==="undefined"||!PLN.on||!hangIn())return;
  const S=G.surf,pr=String(G.prompt||"");
  if(!S||!S.tr||!pr||G.viewK==null)return;
  let w=null,line=null,id;
  if(typeof PLN_ACT!=="undefined"&&PLN_ACT.wrote&&pr===PLN_ACT.wrote){
    const q=poiNear(S,S.tr),L=PLN_LAND.cur,M=L&&L.marks,it=q&&M&&M.items.find(i=>i.q===q);
    if(!it)return;
    const K=PLN_ACT.kinds[q.k]||{},nm=String(q.ru||K.ru||"").toUpperCase();
    line=pr.split("\n").find(s=>s.indexOf(nm+" · ")===0);
    w=plnMarkWorld(it,0,it.H*.5,0);id="pln.mark";   /* середина тела: it.H — рост с запасом, макушка висит в небе */
  }else if(pr.indexOf("ЗАЛЕЖЬ")>=0){
    let dep=null,dd=1e9;
    for(const d of S.deposits||[]){if(d.left<=0)continue;const q=Math.abs(d.x-S.x);if(q<26&&q<dd){dd=q;dep=d;}}
    if(!dep)return;
    line=RES[dep.res].ru.toUpperCase()+" · ЗАЛЕЖЬ "+dep.left;
    const L=PLN_LAND.cur,z=plnThingDepZ(dep),x=dep.x/PLN_M;
    w=[x,(L?plnThingGround(L,x,z).h:(PLN.y0-dep.y)/PLN_M)+1.6,z];id="pln.dep";
  }
  if(!line||!w)return;
  const C=plnLens(S,G.viewK,{vx:G.viewX,vy:G.viewY}),m=C.vp;
  const pj=v=>{const cw=m[3]*v[0]+m[7]*v[1]+m[11]*v[2]+m[15];if(!(cw>0))return null;
    return [((m[0]*v[0]+m[4]*v[1]+m[8]*v[2]+m[12])/cw*.5+.5)*W,(.5-(m[1]*v[0]+m[5]*v[1]+m[9]*v[2]+m[13])/cw*.5)*H];};
  const a=pj(w);if(!a)return;
  /* человек — не подставка для таблички: его рост от ступней до макушки с запасом в полроста по бокам */
  const mx=S.x/PLN_M,my=plnY(S.y+10),f=pj([mx,my,0]),h=pj([mx,my+1.9,0]);
  if(f&&h){const t=Math.abs(f[1]-h[1]),n=ovNd();hangBlock((f[0]-t*.45)*n,(h[1]-t*.1)*n,(f[0]+t*.45)*n,(f[1]+t*.05)*n);}
  ovHang(id,line,a[0],a[1],{r:6,up:true});
}
