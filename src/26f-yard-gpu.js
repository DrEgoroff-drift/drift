/* ── витрина верфи на движке (G15): строки верфи, ангара и сплава держат пустое место
   (shipThumb), а корпуса рисует ОДНА канва #yardCv поверх колонки мест — студия 17c2
   (hullStudio) на каждый корабль, сборка кадром через ov* (08bi), как силуэт ОПИСИ. Холст
   стоит у экрана станции, не в прокрутке: прокрутка, смена вкладки и размер меняют подпись,
   кадр перекладывает готовые студии. 2D у витрины нет. YARD.n — сколько сборок было */
const YARD={cv:null,cx:null,dev:null,T:null,S:new Map(),sig:"",n:0};
function shipThumb(id,w,h){
  const d=document.createElement("div");d.className="yth";d.dataset.ship=id;
  d.style.cssText="flex:0 0 auto;width:"+w+"px;height:"+h+"px";
  return d;
}
function yardCanvas(){
  let cv=YARD.cv;
  if(!cv||!cv.isConnected){cv=document.getElementById("yardCv");
    if(!cv){cv=document.createElement("canvas");cv.id="yardCv";
      cv.style.cssText="position:absolute;pointer-events:none;display:none";$st.appendChild(cv);}
    YARD.cv=cv;YARD.cx=null;YARD.sig="";}
  return cv;
}
function yardHide(){const cv=YARD.cv;if(cv&&cv.style.display!=="none")cv.style.display="none";YARD.sig="";}
/* кадр (hud): мест нет или экран закрыт — холст спрятан */
function yardTick(){
  if(!$st.classList.contains("open")||!GPU.on||!GPU.enc||!GPU.dev)return yardHide();
  const L=$body.getElementsByClassName("yth");if(!L.length)return yardHide();
  const cv=yardCanvas(),br=$body.getBoundingClientRect(),k=br.height/($body.offsetHeight||1)||1,nd=panelNd();
  const R=[];let x0=1e9,x1=-1e9;
  for(const e of L){const r=e.getBoundingClientRect(),x=(r.left-br.left)/k,y=(r.top-br.top)/k,w=r.width/k,h=r.height/k;
    x0=Math.min(x0,x);x1=Math.max(x1,x+w);R.push([e.dataset.ship,x,y,w,h]);}
  const bh=$body.clientHeight,cw=Math.max(1,Math.ceil(x1-x0)),vis=R.filter(q=>q[2]+q[4]>0&&q[2]<bh);
  const sig=[GPU.dev===YARD.dev,nd,x0,cw,bh,$body.offsetLeft,$body.offsetTop,vis.map(q=>q[0]+"@"+q[1].toFixed(1)+","+q[2].toFixed(1)+"~"+hullBakeKey(q[0],1)).join(";")].join("|");
  if(sig===YARD.sig)return;
  const s=cv.style;s.display="";s.left=($body.offsetLeft+x0)+"px";s.top=$body.offsetTop+"px";s.width=cw+"px";s.height=bh+"px";
  const pw=Math.max(1,Math.round(cw*nd)),ph=Math.max(1,Math.round(bh*nd));
  if(cv.width!==pw)cv.width=pw;if(cv.height!==ph)cv.height=ph;
  if(!YARD.cx||YARD.dev!==GPU.dev){const cx=cv.getContext("webgpu");if(!cx)return;
    cx.configure({device:GPU.dev,format:GPU.fmt,alphaMode:"premultiplied"});
    if(YARD.dev!==GPU.dev){YARD.S.clear();YARD.T=ovTarget();}YARD.cx=cx;YARD.dev=GPU.dev;}
  yardDraw(vis,x0,nd,pw,ph);YARD.sig=sig;
}
/* студия — одна на корабль и размер места; готовая текстура перекладывается без прохода */
function yardDraw(vis,x0,nd,pw,ph){
  const put=[];
  if(YARD.S.size>48){for(const S of YARD.S.values()){if(S.tex)GPU.trash.push(S.tex);if(S.bk)gpuBakeDrop(S.bk.B);}YARD.S.clear();}   /* ангар без края: студии не копятся */
  for(const [id,x,y,w,h] of vis){
    const key=id+"|"+w+"x"+h+"|"+nd+"|"+hullBakeKey(id,1);let S=YARD.S.get(id+"|"+w+"x"+h);
    if(!S){S={};YARD.S.set(id+"|"+w+"x"+h,S);}
    if(S.key!==key){const hl=hullOf(id),sc=Math.min(w/(hl.len+14),h/(hl.halfW*2+10));
      if(!hullStudio(S,id,w,h,nd,w/2-(hl.nose+hl.tail)*.5*sc,h/2,sc,0))continue;S.key=key;}
    put.push([S,x-x0,y,w,h]);}
  const T=YARD.T;
  ovInto(T,nd,()=>{for(const [S,x,y,w,h] of put)ovImage({tex:S.tex,view:S.view,dev:S.dev,inv:true},x+w/2,y+h/2,w,h,0,0,0,1,1,1);});
  ovPass(T,YARD.cx.getCurrentTexture().createView(),pw,ph,[T.uq],"yard");
  YARD.n++;
}
