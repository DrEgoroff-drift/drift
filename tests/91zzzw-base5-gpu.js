/* ══════════════ автотесты: база на видеокарте (G11) ══════════════
   Кадр базы разрезан на выпечки и живое (21ad): тело станка печётся один раз,
   живое рисуется кадром. Выпечка честна, только если то, что в неё попало, от
   времени НЕ зависит — иначе замёрзший кадр пара или стрелки. Проверяем это
   записью: кисть рисует в записывающий холст при двух разных G.t, и две
   записи тела должны совпасть команда в команду. */
function baseRecCtx(){
  const log=[],st={canvas:{width:800,height:600}};
  const r=v=>typeof v==="number"?Math.round(v*100)/100:(typeof v==="string"?v:(v&&v.__g)||"o");
  const grad=(k,a)=>({__g:k+":"+a.map(r).join(","),addColorStop(o,c){log.push("stop "+r(o)+" "+c);}});
  const C=new Proxy(st,{
    get(t,p){
      if(p in t)return t[p];
      if(p==="createLinearGradient"||p==="createRadialGradient")return (...a)=>grad(p,a);
      if(p==="measureText")return s=>({width:String(s).length*6});
      if(p==="getTransform")return ()=>({a:1,b:0,c:0,d:1,e:0,f:0});
      if(p==="getLineDash")return ()=>[];
      return (...a)=>{log.push(p+"("+a.map(r).join(",")+")");};
    },
    set(t,p,v){t[p]=v;log.push(p+"="+r(v));return true;}});
  return {log,C};
}
/* кисть в записывающий холст при заданном G.t → запись */
function baseRec(t,fn){
  const R=baseRecCtx(),prev=ctx,t0=G.t;G.t=t;ctx=R.C;
  try{fn();}finally{ctx=prev;G.t=t0;}
  return R.log;
}
/* база со всеми станками: каждый вид отсека — в своей клетке */
function baseAllKinds(){
  resetWorld();
  const p=G.sys.planets.find(x=>x.type!=="gas");
  const kinds=Object.keys(BASE_ROOM),cells=[];
  for(let i=0;i<BASE_COLS*BASE_ROWS_DEEP;i++)cells.push(i<kinds.length?{k:kinds[i],hp:1}:null);
  G.bases[baseKey(G.sx,G.sy,p.idx)]={sx:G.sx,sy:G.sy,idx:p.idx,name:p.name,type:p.type,res:p.res.slice(0,3),
    cells,rows:BASE_ROWS_DEEP,pool:{},tMs:now(),built:now()};
  for(let q=0;q<6;q++){const cw=genMerc(hashi(q*77+13,5,3));cw.order={kind:"base",sx:G.sx,sy:G.sy,idx:p.idx};G.crew.push(cw);}
  enterBase(p);
  return {p,B:G.base.B,kinds};
}
TEST_SUITES.push(()=>suite("база G11: тело станка не зависит от времени, живое — меньше целого",()=>{
  const {B,kinds}=baseAllKinds();
  ok(kinds.length>=9,"станков в таблице: "+kinds.length);
  for(let i=0;i<kinds.length;i++){
    const k=kinds[i],c=i%BASE_COLS,r=(i/BASE_COLS)|0,x=BASE_OX+c*BCELL_W,y=BASE_OY+r*BCELL_H;
    const body=t=>baseRec(t,()=>drawModuleBody(k,x,y,.8,c,r,B)).join("\n");
    const a=body(100),b=body(1777);
    ok(a.length>0,k+": тело что-то рисует");
    ok(a===b,k+": тело при G.t 100 и 1777 одно и то же — его можно печь");
    /* станок целиком (как рисовался до G11) и только его живое */
    const F=BASE_ROOM[k],run=pass=>baseRec(100,()=>basePass(pass,()=>F(x+6,y+6,BCELL_W-12,BCELL_H-12,
      x+6+(BCELL_W-12)/2,y+BCELL_H-12,.8,hashi(c+1,r+1,(B.idx|0)+7),B,basePower(B),c,r))).length;
    const whole=run(0),live=run(2);
    baseRec(100,()=>drawModuleLive(k,x,y,.8,c,r,B));   /* и с людьми смены не падает */
    ok(live<whole,k+": кадром рисуется меньше, чем раньше: "+live+" из "+whole);
    eq(BASE_PASS,0,k+": проход снят после кисти");
  }
}));
TEST_SUITES.push(()=>suite("база G11: выпечки мира не зависят от времени",()=>{
  const {p,B}=baseAllKinds();
  const R=baseWorldRect(B);
  const lay={
    "гора и порода":()=>baseGroundPaint(B,p,R),
    "выработка и стволы":()=>baseBackPaint(B,.8),
    "отсеки":()=>baseRoomsPaint(B,.8),
    "передний план":()=>baseFrontPaint(B,.8),
    "маска поля":()=>baseMaskPaint(B,R),
    "небо":()=>baseSkyPaint(B,p,baseParRect(R,.3))};
  for(const nm in lay){
    const a=baseRec(10,lay[nm]).join("\n"),b=baseRec(2345,lay[nm]).join("\n");
    ok(a.length>0,nm+": рисуется");
    ok(a===b,nm+": при другом G.t — та же выпечка");
  }
  /* свои лампы станков и неподвижные пятна ушли в карту света, а не в выпечку */
  const mk=baseRec(10,lay["маска поля"]).join("\n");
  ok(mk.indexOf("rgba(0,0,255")>=0,"в карте света есть лампы станков");
  const rooms=baseRec(10,lay["отсеки"]).join("\n");
  ok(rooms.indexOf("globalCompositeOperation=lighter")<0,"в выпечке отсеков нет ни одного «lighter» — свет не краска");
  /* зерно лежит в породе: у мира нет экрана, значит нет и W в кисти горы */
  const w0=W;W=w0+300;
  const c1=baseRec(10,()=>baseGroundPaint(B,p,R)).join("\n");W=w0;
  ok(c1===baseRec(10,()=>baseGroundPaint(B,p,R)).join("\n"),"гора не зависит от ширины экрана при том же прямоугольнике мира");
}));
TEST_SUITES.push(()=>suite("база G11: кадр с плавильней рисуется (дым читал чужую переменную)",()=>{
  const {B}=baseAllKinds();
  ok(B.cells.some(x=>x&&x.k==="refinery"),"плавильня построена");
  const wx=BASE_OX+B.cells.findIndex(x=>x&&x.k==="refinery")%BASE_COLS*BCELL_W;
  ok(isFinite(baseSurfY(B,wx)),"кромка склона над плавильней известна: "+baseSurfY(B,wx).toFixed(1));
  const log=baseRec(100,()=>drawBase());
  ok(log.some(s=>s.indexOf("arc(")===0),"кадр дорисован до дыма и дальше: "+log.length+" команд");
  eq(BASE_PASS,0,"проход снят");
}));
TEST_SUITES.push(()=>suite("база G11: выход на поверхность отдаёт выпечки",()=>{
  const {p}=baseAllKinds();
  BASE_BK.set("probe",{key:"x",B:null});
  ok(BASE_BK.size>0,"выпечка в кэше есть");
  exitBase();
  eq(G.mode,"surface","вышли на поверхность");
  eq(BASE_BK.size,0,"кэш выпечек базы пуст");
  enterBase(p);eq(G.mode,"base","и вход обратно работает");
}));
