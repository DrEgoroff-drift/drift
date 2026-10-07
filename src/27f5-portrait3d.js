/* ══════════════ портрет в объёме (M725) ══════════════
   Тот же человек, что в зале (27f3 cpMesh), крупно: бюст в нише цвета роли, свет студии — тёплый ключ
   сверху-слева с тенью, холодная заливка справа, контровой цвета роли сзади, пятно на заднике за головой.

   ПРАВИЛА ФАЙЛА:
   1. Ни одного 2D-холста: картинку рисует движок (27f2 r3Frame) прямо в холст карточки.
   2. Вне кадра: холсты встают в очередь и рисуются таймером пачкой (как 17c2d partThumb); из кадра
      и из пальца ничего не рисуется и ничего не читается из вёрстки.
   3. Цели рендера общие на размер (до четырёх размеров): портретов на экране десяток, MSAA-цели — по размеру.
   4. Взгляд — в камеру: голова чуть повёрнута к зрителю, камера на три четверти и чуть выше глаз.
   5. Портрет живой (M729): холсты на странице перерисовываются таймером — дыхание, моргание, взгляд, эмоция
      (27f6 cpFace). Не больше CPP_LIVE за такт, по кругу; скрытая вкладка и отцепленные холсты не рисуются. */
const CPP={q:[],t:0,hid:new Map(),bd:new Map(),M:null,OT:null,n:0,live:[],lt:0,rr:0};
const CPP_LIVE=6,CPP_MS=50;
/* холст портрета css×css (CSS-пиксели), плотность панели; cut — крупнее, одна голова (бармен в реплике) */
function cpPortrait(m,css,cut){
  const cv=document.createElement("canvas");cv.className="cp3";
  cv.style.width=css+"px";cv.style.height=css+"px";cv.style.display="block";
  const nd=panelNd(),px=Math.max(8,Math.round(css*nd));cv.width=px;cv.height=px;
  CPP.q.push([cv,m,!!cut,nd]);if(!CPP.t)CPP.t=setTimeout(cppFlush,0);
  return cv;
}
function cppFlush(){
  CPP.t=0;const L=CPP.q.splice(0);
  if(GPU.enc){CPP.q.push(...L);CPP.t=setTimeout(cppFlush,0);return;}   /* кадр ещё открыт — следующим таймером */
  for(const it of L)if(it[0].isConnected){cppPaint(it[0],it[1],it[2],it[3]);CPP.live.push(it);}
  if(CPP.live.length&&!CPP.lt)CPP.lt=setTimeout(cppTick,CPP_MS);
}
/* такт живых портретов: отцепленные — вон; рисуются по кругу не больше CPP_LIVE за раз */
function cppTick(){
  CPP.lt=0;
  CPP.live=CPP.live.filter(it=>it[0].isConnected);
  if(!CPP.live.length)return;
  const hid=typeof document!=="undefined"&&document.hidden;
  if(!hid&&!GPU.enc){const n=Math.min(CPP_LIVE,CPP.live.length);
    for(let k=0;k<n;k++){const it=CPP.live[(CPP.rr+k)%CPP.live.length];cppPaint(it[0],it[1],it[2],it[3]);}
    CPP.rr=(CPP.rr+n)%CPP.live.length;}
  CPP.lt=setTimeout(cppTick,hid?500:CPP_MS);
}
/* задник: полукруглая ниша за спиной, тёмная в цвет роли */
function cppBackdrop(rc){
  const key=rc.join(",");let b=CPP.bd.get(key);if(b&&b.dev===GPU.dev)return b;
  const K=r3Kit(),M=K.mt(mixc(rc,[14,16,20],.88),.3,6,R3P.wall);
  K.surf(16,6,(u,v)=>{const a=(u-.5)*2.2;return [[Math.sin(a)*1.1,.6+v*2.2,-.62+(1-Math.cos(a))*1.1*.8]];},M);
  b=K.pack();if(CPP.bd.size>=8){const k0=CPP.bd.keys().next().value;r3Drop(CPP.bd.get(k0));CPP.bd.delete(k0);}
  CPP.bd.set(key,b);return b;
}
function cppScene(M,cut,asp){
  const g=M.g,hc=M.at.head,nk=M.at.neck,rc=g.role?hex2rgb(g.role.col):[150,170,200];
  if(!CPP.M){CPP.M=new Float32Array(R3_MAXI*R3_PART*16);CPP.OT=new Float32Array(R3_MAXI*R3_PART*4);}
  const I=r3Xf([0,0,0]),MM=CPP.M;for(let i=0;i<2*R3_PART;i++)MM.set(I,i*16);
  /* дыхание — грудь и плечи; голова к зрителю (шарнир — основание шеи) и чуть живёт: покачивание, кивок на эмоцию */
  const t=wallMs()/1000,ph=(M.g.ai?0:(M.at.head[1]*997)%6),bth=Math.sin(t*1.57+ph);
  const B=r3Mul(r3Xf([0,0,0]),[1,0,0,0, 0,1+.004*bth,0,0, 0,0,1+.006*bth,0, 0,0,0,1]);
  MM.set(B,0);MM.set(B,2*16);MM.set(B,3*16);
  const X=cppX(M),sad=X&&X.k==="sad"?1:0,ang=X&&X.k==="angry"?1:0;
  const Mh=r3Pivot(B,nk,.22+.025*Math.sin(t*.37+ph)+(X?X.gz[0]*.25:0),-.04+.012*Math.sin(t*.53+ph*2)+.05*sad-.025*ang,.015*Math.sin(t*.29+ph));
  MM.set(Mh,1*16);   /* экземпляр 0, часть 1 — голова */
  cpRig(MM,0,Mh,M,X);
  const hgt=cut?.27:.5,tg=[hc[0]+.01,hc[1]-(cut?.006:.1),hc[2]],dist=1.3;
  const eye=[tg[0]+.52,tg[1]+.08,tg[2]+dist*.9],fy=2*Math.atan(hgt/2/dist);
  const vp=r3Mul(r3Persp(fy,asp,.2,6),r3Look(eye,tg,[0,1,0]));
  const dir=(p,q)=>{const v=[q[0]-p[0],q[1]-p[1],q[2]-p[2]],l=Math.hypot(...v);return v.map(x=>x/l);};
  const key=[tg[0]-.8,tg[1]+.7,tg[2]+1.0],rim=[tg[0]+.6,tg[1]+.4,tg[2]-.75],rim2=[tg[0]-.65,tg[1]+.25,tg[2]-.6];
  const rl=r3Lin(rc);
  const lights=[
    {p:key,range:4.5,c:r3Sc(r3Lin([255,240,228]),1.9),spot:1,d:dir(key,tg),cosO:Math.cos(.42),cosI:Math.cos(.22),shadow:1,vol:0},
    {p:[tg[0]+1.15,tg[1]-.05,tg[2]+.9],range:4,c:r3Sc(r3Lin([150,172,215]),.7),vol:0},
    {p:rim,range:3,c:r3Sc(rl,3.2),spot:1,d:dir(rim,[tg[0],tg[1]+.05,tg[2]]),cosO:Math.cos(.5),cosI:Math.cos(.28),vol:0},
    {p:rim2,range:3,c:r3Sc(r3Mix(rl,[1,1,1],.4),1.3),spot:1,d:dir(rim2,tg),cosO:Math.cos(.5),cosI:Math.cos(.3),vol:0},
    {p:[tg[0]-.1,tg[1]+.05,-.3],range:1.3,c:r3Sc(rl,.8),vol:0}];
  CPP.OT.fill(0);
  return {draws:[[M,0,1],[cppBackdrop(rc),1,1]],vp,cam:eye,t:0,lights,
    sky:[...r3Lin(mixc(rc,[170,176,190],.6)),.1],gnd:[...r3Lin([30,26,24]),0],fog:[0,0,0,0],acc:[...rl,1],
    win:[0,0,0,0],win2:[0,0,0,0],sgn:[0,0,0,0],sgn2:[0,1,0,0],flm:[0,0,0,0],flm2:[0,0,0,0],tsg:null,tfl:null,M:MM,ot:CPP.OT};
}
/* выражение портрета: взгляд — в объектив (CP_GAZE), остальное — живое лицо человека */
function cppX(M){return M.m?cpFace(M.m,CP_GAZE):null;}
function cppPaint(cv,m,cut,nd){
  if(!GPU.ok||GPU.lost||!GPU.dev||!r3Dev())return;
  const w=cv.width,h=cv.height,key=w+"x"+h;
  let hc=CPP.hid.get(key);
  if(hc){CPP.hid.delete(key);CPP.hid.set(key,hc);}
  else{if(CPP.hid.size>=4){const k0=CPP.hid.keys().next().value;r3Free(CPP.hid.get(k0));CPP.hid.delete(k0);}
    hc=document.createElement("canvas");hc.width=w;hc.height=h;CPP.hid.set(key,hc);}
  let cx=cv.__cpx;
  if(!cx||cv.__cpd!==GPU.dev){cx=cv.getContext("webgpu");if(!cx)return;
    cx.configure({device:GPU.dev,format:"rgba16float",alphaMode:"premultiplied"});cv.__cpx=cx;cv.__cpd=GPU.dev;}
  const R=rpgGet(hc);if(!R)return;R.dpr=nd;
  const M=cpMesh(m,"stand",2);M.m=m;const S=cppScene(M,cut,w/h);
  const U=new Float32Array(60);U.set([1,1,1,1.05],24);U[44]=.45;U[47]=.6;
  r3Frame(hc,S,(pl,Sv,Vv,Bv)=>rpgField(R,pl,"r3post",R3_POST_WGSL,U,[Sv,{view:R3.blank},Vv,Bv]),{cx,w,h});
  CPP.n++;
}
