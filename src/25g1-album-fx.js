/* ══════════════ альбом: большая карточка, фильтры, снимок себе (P13, плейтест §4.3) ══════════════
   Автор: «фото должны открываться большими по тычку»; «оставить перерисовку
   из снимка, но рисовать куда лучше — фотофильтры»; «настоящий красивый
   скриншот себе в галерею, с подписью — и ничего на нашем сервере».
   • Тычок по карточке — во весь экран (#albumLb), в настоящих пикселях экрана;
   • фильтр на карточку: ПЛЁНКА, СЕПИЯ, ХОЛОД, НОЧЬ — поверх той же
     перерисовки; выбор лежит в снимке (s.fx, пара байт), случай — от снимка,
     не от Math.random;
   • СОХРАНИТЬ — PNG с полосой подписи («ДРЕЙФ» · место · сектор · час) на
     устройство игрока, скачиванием. На сервер не уходит ничего. */
/* Фильтры — на видеокарте (G15, 26.09): карточка печётся той же кистью в GPU-холст и ложится в свою
   канву WebGPU одной картинкой ovImage с матрицей 3×4 и зерном (08bi). Формулы — прежнего прохода по
   пикселям: яркость L=.3R+.59G+.11B, сдвиги в единицах 0..255; зерно ±g/2 на пиксель экрана */
const ALBUM_FX={
  none:{ru:"КАК ЕСТЬ"},
  film:{ru:"ПЛЁНКА",m:[.92,0,0,30, 0,.9,0,22, 0,0,.82,18],g:18},        /* выцветшие чёрные, тёплый свет */
  sepia:{ru:"СЕПИЯ",m:albumL([1.07,.88,.66],[28,14,0]),g:10},
  /* R·.86, G·.97+4, B·1.08+14, затем контраст ×1.12 вокруг 128 */
  cold:{ru:"ХОЛОД",m:[.9632,0,0,-15.36, 0,1.0864,0,-10.88, 0,0,1.2096,.32],g:6},
  night:{ru:"НОЧЬ",m:albumL([.35,1.05,.45],[0,10,0]),g:26}              /* прибор ночного видения */
};
/* строки матрицы «яркость во все каналы»: канал = L·k + сдвиг */
function albumL(k,o){const m=[];for(let i=0;i<3;i++)m.push(.3*k[i],.59*k[i],.11*k[i],o[i]);return m;}
/* матрица ovImage для фильтра k; случай зерна — от снимка, не от Math.random */
function albumM(s,k){const F=ALBUM_FX[k];if(!F||!F.m)return null;
  return {m:F.m.map((v,i)=>i%4===3?v/255:v),grain:F.g/255,seed:hashi(s.sx|0,s.sy|0,(s.t|0)^0xF11A)>>>0};}
/* виньетка: край темнеет, как у настоящего объектива; одна малая выпечка на карточку любого размера */
const ALBUM_VIG=new Map();
function albumVig(night){
  return gpuBaked(ALBUM_VIG,night?1:0,128,80,c=>{
    const g=c.createRadialGradient(64,40,28,64,40,Math.hypot(128,80)*.55);
    g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,night?"rgba(0,10,0,.7)":"rgba(0,0,0,.45)");
    c.fillStyle=g;c.fillRect(0,0,128,80);},{mips:false,ss:1});
}
/* кисть карточки в выпечку cw×ch при плотности nd; снимок не читается — null */
function albumBake(s,cw,ch,nd){let ok=false;
  const B=gpuBake(cw*nd,ch*nd,c=>{c.setTransform(nd,0,0,nd,0,0);ok=drawPostcard(c,s,cw,ch);},{once:true,mips:false});
  if(B&&!ok){gpuBakeDrop(B);return null;}return B;}
/* выпечку B — в канву cv с фильтром k; без выпечки — пустой бланк */
function albumPut(cv,s,cw,ch,nd,B,k){
  const M=B&&albumM(s,k);
  return ovPaint(cv,nd,()=>{
    if(!B){ovRect(0,0,cw,ch,"#12161d");return;}
    ovImage(B,cw/2,ch/2,cw,ch,0,0,0,1,1,1,M);
    if(M)ovImage(albumVig(k==="night"),cw/2,ch/2,cw,ch,0,0,0,1,1,1);});
}
/* одна карточка на своей канве: перерисовка + фильтр */
function albumCanvas(s,cw,ch,dpr){
  const cv=document.createElement("canvas");
  cv.width=Math.round(cw*dpr);cv.height=Math.round(ch*dpr);
  cv.style.width=cw+"px";cv.style.height=ch+"px";
  const B=albumBake(s,cw,ch,dpr);
  albumPut(cv,s,cw,ch,dpr,B,s&&s.fx);gpuBakeDrop(B);
  return cv;
}
function albumDpr(){return Math.min(3,(typeof window!=="undefined"&&window.devicePixelRatio)||1);}
function albumClose(){const w=document.getElementById("albumLb");if(w)w.remove();}
/* во весь экран: карточка, фильтры, подписать / отправить / сохранить */
function albumLightbox(s,i){
  albumClose();
  const lb=document.createElement("div");lb.id="albumLb";
  const vw=(typeof window!=="undefined"?window.innerWidth:390),vh=(typeof window!=="undefined"?window.innerHeight:844);
  const cw=Math.round(Math.min(vw-24,(vh-220)/.625,1100)),ch=Math.round(cw*.625);
  const host=document.createElement("div");host.className="lb-card";
  if(albumBack&&typeof renderCardBack==="function"){
    const side=document.createElement("div");side.className="side";side.style.width=cw+"px";side.style.minHeight=ch+"px";
    renderCardBack(side,s,()=>tableRender());host.appendChild(side);
  }else host.appendChild(albumCanvas(s,cw,ch,albumDpr()));
  lb.appendChild(host);
  const cap=document.createElement("div");cap.className="lb-cap";
  cap.textContent=postCaption(s)+(s.ver&&s.ver!==VER?" · снято на "+s.ver:"");
  lb.appendChild(cap);
  if(!albumBack){
    const fr=document.createElement("div");fr.className="lb-fx";
    /* фильтр показывает себя (D23): карточка испечена ОДИН раз малой, пять
       фильтров — та же выпечка с разной матрицей, а не пять перерисовок */
    const tw=Math.max(44,Math.min(64,Math.floor((vw-56)/5)-10)),th=Math.round(tw*.625),td=Math.min(2,albumDpr());
    const base=albumBake(s,tw,th,td);
    for(const k in ALBUM_FX){
      const b=document.createElement("button");b.className="chip fxth"+(((s.fx||"none")===k)?" on":"");
      const cv=document.createElement("canvas");cv.width=Math.round(tw*td);cv.height=Math.round(th*td);cv.style.width=tw+"px";cv.style.height=th+"px";
      albumPut(cv,s,tw,th,td,base,k);
      b.appendChild(cv);b.appendChild(document.createElement("span")).textContent=ALBUM_FX[k].ru;
      b.onclick=e=>{e.stopPropagation();s.fx=k;albumLightbox(s,i);};
      fr.appendChild(b);
    }
    gpuBakeDrop(base);
    lb.appendChild(fr);
  }
  const row=document.createElement("div");row.className="lb-acts";
  const mk=(t,cls,fn)=>{const b=document.createElement("button");b.className="act "+(cls||"");b.textContent=t;b.onclick=e=>{e.stopPropagation();fn();};row.appendChild(b);return b;};
  const signed=(typeof postSigned==="function")&&postSigned(s);
  mk(albumBack?"ЛИЦО":(signed?"ПЕРЕВЕРНУТЬ":"ПОДПИСАТЬ"),"",()=>{
    if(!albumBack&&!signed&&typeof postSign==="function")postSign(s);
    albumBack=!albumBack;tableRender();});
  if(signed&&typeof mailOn==="function"&&mailOn()){
    const left=mailLeft(),b=mk(left>0?"ОТПРАВИТЬ":"СЕГОДНЯ ХВАТИТ","gold",()=>mailSend(s,null));b.disabled=left<=0;
  }
  if(!albumBack)mk("СОХРАНИТЬ СЕБЕ","",()=>albumSave(s));
  mk("ЗАКРЫТЬ","",()=>{albumOpen=-1;albumBack=false;albumClose();tableRender();});
  lb.appendChild(row);
  lb.onclick=e=>{if(e.target===lb){albumOpen=-1;albumBack=false;albumClose();tableRender();}};
  document.body.appendChild(lb);
}
/* снимок себе — страницей альбома (D23): чёрная бумага с зерном, карточка в
   кремовой рамке на четырёх уголках, подпись белым карандашом под ней. Тот же
   язык, что у большой карточки в игре, — снимок узнаётся своим */
function albumSave(s){
  const cw=1200,ch=750,m=16,pad=64,capH=118,PW=cw+2*(pad+m),PH=ch+2*m+pad+capH;
  /* карточка — с видеокарты тем же путём, что в игре; страница вокруг — 2D: это файл PNG */
  const B=albumBake(s,cw,ch,1),M=B&&albumM(s,s.fx);let px=null;
  try{px=ovRead(cw,ch,()=>{if(!B){ovRect(0,0,cw,ch,"#12161d");return;}ovImage(B,cw/2,ch/2,cw,ch,0,0,0,1,1,1,M);
    if(M)ovImage(albumVig(s.fx==="night"),cw/2,ch/2,cw,ch,0,0,0,1,1,1);});}finally{gpuBakeDrop(B);}
  if(!px)return false;
  const cv=document.createElement("canvas");cv.width=PW;cv.height=PH;
  const c=cv.getContext("2d");if(!c)return false;
  const g=c.createRadialGradient(PW/2,PH*.3,0,PW/2,PH*.3,PW*.8);
  g.addColorStop(0,"#2a231c");g.addColorStop(.7,"#15110d");g.addColorStop(1,"#120e0b");
  c.fillStyle=g;c.fillRect(0,0,PW,PH);
  const r=rng(hashi(s.sx|0,s.sy|0,(s.t|0)^0xA1B));
  for(let i=0;i<PW*PH/70;i++){c.fillStyle=i&1?"rgba(255,240,220,.035)":"rgba(0,0,0,.22)";c.fillRect(r()*PW|0,r()*PH|0,1,1);}
  const x0=pad,y0=pad;
  c.save();c.shadowColor="rgba(0,0,0,.72)";c.shadowBlur=28;c.shadowOffsetY=7;
  c.fillStyle="#f3ecdc";c.fillRect(x0,y0,cw+2*m,ch+2*m);c.restore();
  c.putImageData(new ImageData(new Uint8ClampedArray(px.buffer,px.byteOffset,px.length),cw,ch),x0+m,y0+m);
  /* фотоуголки: тёмная бумага поверх рамки, светлая кромка по гипотенузе */
  const L=46,o=10,C=[[x0-o,y0-o,1,1],[x0+cw+2*m+o,y0-o,-1,1],[x0-o,y0+ch+2*m+o,1,-1],[x0+cw+2*m+o,y0+ch+2*m+o,-1,-1]];
  for(const [qx,qy,sx,sy] of C){
    c.fillStyle="#3b2f22";c.beginPath();c.moveTo(qx,qy);c.lineTo(qx+sx*L,qy);c.lineTo(qx,qy+sy*L);c.closePath();c.fill();
    c.strokeStyle="rgba(255,236,200,.14)";c.lineWidth=1.5;c.beginPath();c.moveTo(qx+sx*L,qy);c.lineTo(qx,qy+sy*L);c.stroke();
  }
  const cy=y0+ch+2*m+capH*.42;
  c.textAlign="center";c.textBaseline="middle";
  c.fillStyle="rgba(236,228,210,.9)";c.font="italic 32px Georgia,\"Times New Roman\",serif";
  c.fillText("«Дрейф» · "+postCaption(s),PW/2,cy,PW-2*pad);
  c.fillStyle="rgba(200,184,150,.55)";c.font="17px ui-monospace,monospace";
  c.fillText("сектор "+(s.sx|0)+":"+(s.sy|0)+" · drift-game.ru",PW/2,cy+38);
  const name="drift-"+(s.sx|0)+"_"+(s.sy|0)+"-"+(s.t|0)+".png";
  const go=url=>{const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();};
  if(cv.toBlob)cv.toBlob(b=>{if(!b)return;const u=URL.createObjectURL(b);go(u);setTimeout(()=>URL.revokeObjectURL(u),4000);},"image/png");
  else go(cv.toDataURL("image/png"));
  if(typeof say==="function")say("Снимок сохранён на устройство",90);
  return true;
}
