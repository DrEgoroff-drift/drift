/* ══════════════ чертёж корабля: клетки из корпуса и упаковщик (M476, DESIGN-shipyard §3, review §2.2) ══════════════
   Корпус — шасси с планом, и план ЧИТАЕТСЯ из корпуса (hullOf), а не хранится.
   Один вид, нос вверх. Силуэт растрируется на квадратные клетки: сторона =
   длина / N, N от 8 (лёгкий) до 14 (тяжёлый); клетка внутри, если её центр в
   профиле тела, а крылья и гондолы — обшивка.

   Классы клеток:
     nose  — обшивка носовой трети на оси: жёсткая установка;
     side  — обшивка по бортам, крылья, гондолы: турель, дуга наружу;
     spine — ось за носовой третью, не обшивка: БАШНЯ (M479);
     stern — кормовой ряд тела: сопла выходят сквозь обшивку;
     deck  — всё остальное внутри: реактор, баки, приборы, трюм.

   Упаковщик кладёт в план то, что стоит на корабле сегодня (части по слотам и
   модули станции), по привычке: орудие — на обшивку у своего подвеса, мотор —
   в корму, прибор — в носовую треть, пусковая — на хребет, остальное — на
   палубу; свободная палуба и хребет — ТРЮМ. Это только вид (M476): ни одно
   число корабля от плана пока не зависит, поэтому «старый сейв — те же числа»
   выполняется по построению; сторож — «всё, что стоит, влезло». */
const PLAN_CACHE={};
function planN(h){return clamp(Math.round(h.len/4.2),8,14);}
function planPtIn(poly,x,y){
  let c=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const a=poly[i],b=poly[j];
    if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/((b[1]-a[1])||1e-9)+a[0])c=!c;
  }
  return c;
}
/* клетки корпуса: {N,cols,c,cells:[{i,j,x,y,body,kind}]}; i — ряд от носа, j — колонка слева направо */
function planOf(id){
  if(PLAN_CACHE[id])return PLAN_CACHE[id];
  const h=hullOf(id);
  let hw=0;for(const p of h.prof)hw=Math.max(hw,p[1]);
  for(const w of h.wings)for(const p of w)hw=Math.max(hw,Math.abs(p[1]));
  /* поперёк не больше семи клеток: на телефоне 390 px клетка не мельче 44 px.
     Широкий корпус (крылья шире длины) берёт клетку крупнее, а рядов меньше */
  /* и не уже трёх клеток по телу: у иглы иначе нет нутра — клетка мельче, план длиннее (прокрутка вдоль, §3) */
  let bw=0;for(const p of h.prof)bw=Math.max(bw,p[1]);
  const c=Math.max(Math.min(h.len/planN(h),bw*2/3),hw*2/7),N=Math.max(4,Math.min(24,Math.round(h.len/c)));
  let cols=Math.max(3,Math.ceil(hw*2/c));if(cols%2===0)cols++;   /* нечётно: ось — своя колонка */
  cols=Math.min(7,cols);
  const mid=(cols-1)/2,grid=[],cells=[];
  for(let i=0;i<N;i++){grid.push([]);
    for(let j=0;j<cols;j++){
      const x=h.nose-(i+.5)*c,y=(j-mid)*c;
      const body=Math.abs(y)<=profW(h.prof,x)+c*.15;
      let wing=false;
      if(!body)for(const w of h.wings)if(planPtIn(w,x,-Math.abs(y))||planPtIn(w,x,Math.abs(y))){wing=true;break;}
      const cell=(body||wing)?{i,j,x,y,body,kind:null}:null;
      grid[i].push(cell);if(cell)cells.push(cell);
    }
  }
  const at=(i,j)=>(i>=0&&i<N&&j>=0&&j<cols)?grid[i][j]:null;
  let lastBody=0,firstBody=N;for(const q of cells)if(q.body){lastBody=Math.max(lastBody,q.i);firstBody=Math.min(firstBody,q.i);}
  const rowW=[];for(let i=0;i<N;i++)rowW.push(grid[i].filter(q=>q&&q.body).length);
  const isB=(i,j)=>{const q=at(i,j);return !!(q&&q.body);};
  for(const q of cells){
    /* обшивка тела — боковая кромка ряда, где тело шире двух клеток, и самый
       нос; у тонкого корпуса нутро — это его ось, обшивка — крылья */
    const rim=!q.body||q.i===firstBody||(rowW[q.i]>=3&&!(isB(q.i,q.j-1)&&isB(q.i,q.j+1)));
    const noseThird=q.i<N/3,axis=q.j===mid;
    if(q.body&&q.i===lastBody)q.kind="stern";
    else if(rim)q.kind=(noseThird&&Math.abs(q.j-mid)<=1)?"nose":"side";
    else if(axis&&!noseThird)q.kind="spine";
    else q.kind="deck";
    q.nose3=noseThird;
  }
  return PLAN_CACHE[id]={N,cols,c,mid,cells,grid};
}
/* сколько клеток занимает вещь: орудия по размеру подвеса (L 1, M 2, H 4),
   модуль — одна клетка при любой ступени */
function planFoot(kind,size,lvl){
  if(size)return size==="H"?4:size==="M"?2:1;
  return 1;   /* модуль — одна клетка: ступень — это плотность, а не площадь (§3) */
}
/* куда вещь хочет лечь: список классов клеток по убыванию желания */
const PLAN_WANT={gun:["nose","side"],shield:["deck","spine"],engine:["stern","deck"],hull:["side","deck"],
  core:["deck","spine"],util:["deck"],missile:["spine","deck","side"],
  m_engine:["stern","deck"],m_tank:["deck","spine"],m_armor:["side"],m_drill:["deck"],m_hyper:["deck","spine"],m_weapon:["deck","spine"]};
/* упаковать сегодняшнюю оснастку: [{what,ru,cells:[cell]}] + трюм и пустое */
function planPack(id,fit,mods){
  const P=planOf(id),free=new Set(P.cells),out=[];
  const pick=(want,n,near,nose3)=>{
    const got=[];
    for(const k of want){
      let pool=[...free].filter(q=>q.kind===k&&(!nose3||q.nose3));
      if(near)pool.sort((a,b)=>Math.hypot(a.x-near.x,a.y-near.y)-Math.hypot(b.x-near.x,b.y-near.y));
      else pool.sort((a,b)=>a.i-b.i||Math.abs(a.j-P.mid)-Math.abs(b.j-P.mid));
      for(const q of pool){if(got.length>=n)break;got.push(q);free.delete(q);}
      if(got.length>=n)break;
    }
    /* не хватило своих — в любую свободную клетку тела: оснастка не «выпадает» */
    if(got.length<n)for(const q of [...free]){if(got.length>=n)break;if(q.body){got.push(q);free.delete(q);}}
    if(got.length<n)for(const q of [...free]){if(got.length>=n)break;got.push(q);free.delete(q);}   /* и в крыло, если тела не хватило */
    return got;
  };
  const slots=slotsOf(id),M=(typeof mountsOf==="function")?mountsOf(id):[];
  (fit?Object.keys(fit):[]).forEach(si=>{
    const pid=fit[si];if(pid==null)return;
    const kind=slots[si]||"util",m=M.find(x=>x.i===+si);
    const n=planFoot(kind,kind==="gun"?(m&&m.size):null,0);
    const cells=pick(PLAN_WANT[kind]||["deck"],n,m&&kind==="gun"?m:null,kind==="util");
    out.push({what:"part",kind,slot:+si,id:pid,cells,need:n});
  });
  for(const k in (mods||{})){
    const lvl=mods[k]|0;if(!lvl||k==="hold")continue;
    const n=planFoot(k,null,lvl);
    out.push({what:"mod",kind:k,lvl,cells:pick(PLAN_WANT["m_"+k]||["deck"],n,null,k==="drill"),need:n});
  }
  const hold=[...free].filter(q=>q.kind==="deck"||q.kind==="spine");
  for(const q of hold)free.delete(q);
  return {P,items:out,hold,empty:[...free]};
}
/* текущий корабль игрока */
function planNow(){return planPack(G.shipId,G.fit[G.shipId]||{},G.mods||{});}
/* ── нарисовать чертёж (вид ОПИСИ, синька в M477): нос вверх ── */
const PLAN_COL={nose:"#e8b35a",side:"#c9924a",spine:"#9ab6d6",stern:"#e07a50",deck:"#3a5068"};
const PLAN_ITEM_COL={gun:"#f2b25c",shield:"#7fe6d8",engine:"#ff8f6a",hull:"#b9a58a",core:"#c58ae0",util:"#8fd08a",missile:"#ff6a6a",mod:"#d9dde3"};
function drawPlan(cx,W0,H0,pk){
  const P=pk.P,s=Math.min(W0/P.cols,H0/P.N);
  const ox=(W0-s*P.cols)/2,oy=(H0-s*P.N)/2;
  cx.clearRect(0,0,W0,H0);
  for(const q of P.cells){
    cx.fillStyle=q.kind==="deck"||q.kind==="spine"?"rgba(58,80,104,.35)":"rgba(201,146,74,.18)";
    cx.fillRect(ox+q.j*s+1,oy+q.i*s+1,s-2,s-2);
    cx.strokeStyle=PLAN_COL[q.kind];cx.globalAlpha=.55;cx.lineWidth=1;
    cx.strokeRect(ox+q.j*s+1.5,oy+q.i*s+1.5,s-3,s-3);cx.globalAlpha=1;
  }
  for(const q of pk.hold){cx.fillStyle="rgba(143,208,138,.14)";cx.fillRect(ox+q.j*s+3,oy+q.i*s+3,s-6,s-6);}
  for(const it of pk.items){
    const col=it.what==="mod"?PLAN_ITEM_COL.mod:(PLAN_ITEM_COL[it.kind]||"#fff");
    for(const q of it.cells){
      cx.fillStyle=col;cx.globalAlpha=.85;
      cx.fillRect(ox+q.j*s+4,oy+q.i*s+4,s-8,s-8);cx.globalAlpha=1;
    }
  }
}
/* ── блок ЧЕРТЁЖ в ОПИСИ (M476): только вид, правка — КБ (M477) ── */
function opisPlanBlock(){
  const pk=planNow(),P=pk.P;
  const box=document.createElement("div");box.className="op-plan";
  const n=k=>P.cells.filter(q=>q.kind===k).length;
  box.innerHTML="<h4>ЧЕРТЁЖ<s>"+P.cells.length+" клеток · трюм "+pk.hold.length+" · нос вверх</s></h4>";
  const cv=document.createElement("canvas");
  const w=200,h=Math.min(380,Math.round(w*P.N/P.cols)),dpr=Math.min(2,window.devicePixelRatio||1)*(typeof UIK==="number"?UIK:1);
  cv.style.width=w+"px";cv.style.height=h+"px";cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);
  const c=cv.getContext("2d");if(c){c.setTransform(dpr,0,0,dpr,0,0);drawPlan(c,w,h,pk);}
  box.appendChild(cv);
  const lg=document.createElement("s");lg.className="chalk";
  lg.textContent="обшивка "+(n("nose")+n("side"))+" · хребет "+n("spine")+" · корма "+n("stern")+" · палуба "+n("deck")+" · зелёное — трюм";
  box.appendChild(lg);
  return box;
}
