/* ══════════════ дом в «ВЛАДЕНИИ»: снимок движка (M850b) ══════════════
   Панель дома на станции показывала разрез 2D-кистями (27e, удалён). Теперь в ней тот же дом, по которому
   ходят (29rb home3Mesh/home3Scene): общий план первого этажа, хозяин в средней комнате, жильцы на местах.

   ПРАВИЛА ФАЙЛА:
   1. Ни одного 2D-холста: картинку рисует движок (27f2 r3Frame) прямо в холст панели, как портрет (27f5).
   2. Вне кадра: холст встаёт в очередь и рисуется таймером; пока кадр открыт (GPU.enc) — следующим таймером.
   3. Снимок, а не цикл: у экрана станции своего цикла нет; дом перерисуется, когда панель нарисуют заново.
   4. Без видеокарты холст пуст — экран закрывает табличка «нужен WebGPU» (08b2); 2D-замены нет.
   5. Дом растёт — растёт и кадр: ширина по панели, высота по длине дома (1.5…3.2 к одному). */
const HST={q:[],t:0,hid:null,mesh:null,rkey:""};
/* холст панели: CSS-ширина по месту, пропорции по длине дома; рисует очередь */
function homeStill(){
  const R=hinGroundRooms();if(!R.length)return null;
  const cv=document.createElement("canvas");cv.className="home3s";cv.setAttribute("aria-hidden","true");
  const asp=homeStillAsp(R.length);
  cv.style.cssText="display:block;width:100%;aspect-ratio:"+asp.toFixed(3)+";border-radius:8px;margin:6px 0;background:#0b0e13";
  const nd=panelNd(),w=Math.max(8,Math.round(Math.min(640,innerWidth-24)*nd));
  cv.width=w;cv.height=Math.max(8,Math.round(w/asp));
  HST.q.push([cv,nd]);if(!HST.t)HST.t=setTimeout(homeStillFlush,0);
  return cv;
}
function homeStillAsp(n){return clamp((n*HOME3_RW+2)/4.6,1.5,3.2);}
function homeStillFlush(){
  HST.t=0;const L=HST.q.splice(0);
  if(GPU.enc){HST.q.push(...L);HST.t=setTimeout(homeStillFlush,0);return;}   /* кадр ещё открыт — следующим таймером */
  /* только у станции: панель могли закрыть до таймера, а снимок в полёте — компиляция конвейеров комнат посреди
     полёта (сеть «конвейеры: после прогрева полёт не компилирует» ловила это изредка) */
  if(G.mode!=="dock")return;
  for(const it of L)if(it[0].isConnected)homeStillPaint(it[0],it[1]);
}
/* камера общего плана: на три четверти справа, на высоте чуть выше роста — дом уходит вглубь кадра, ближняя
   комната крупно, дальние мельче; этаж целиком с полем в треть комнаты */
function homeStillCam(n,asp){
  const X1=n*HOME3_RW,cx=X1/2,fy=.62,half=Math.tan(fy/2)*asp;
  /* СР · Визуал 22.10: ближе и ниже — люди в треть кадра по высоте, а не мухи; дальний край дома уходит за кадр,
     это общий план с ближней комнатой крупно, не чертёж фасада */
  const d=Math.max(4.6,(X1/2+.6)/half*.8);
  const eye=[cx+.34*d,1.6+.05*d,HOME3_MZ+.95*d],tgt=[cx-.02*d,1.25,-1.0];
  const P=r3Persp(fy,asp,.1,140);
  return {eye,tgt,fy,vp:r3Mul(P,r3Look(eye,tgt,[0,1,0]))};
}
function homeStillPaint(cv,nd){
  if(!GPU.ok||GPU.lost||!GPU.dev||!r3Dev())return;
  const R=hinGroundRooms();if(!R.length)return;
  const w=cv.width,h=cv.height;
  let hc=HST.hid;
  if(!hc||hc.width!==w||hc.height!==h){if(hc)r3Free(hc);hc=HST.hid=document.createElement("canvas");hc.width=w;hc.height=h;}
  let cx=cv.__cpx;
  if(!cx||cv.__cpd!==GPU.dev){cx=cv.getContext("webgpu");if(!cx)return;
    cx.configure({device:GPU.dev,format:"rgba16float",alphaMode:"premultiplied"});cv.__cpx=cx;cv.__cpd=GPU.dev;}
  const Rg=rpgGet(hc);if(!Rg)return;Rg.dpr=nd;
  const rk="still|"+G.home.tier+"|"+(hinHasUp()?1:0);
  if(!HST.mesh||HST.rkey!==rk){r3Drop(HST.mesh);HST.mesh=home3Mesh(false);HST.rkey=rk;}
  /* сцена дома читает хозяина и жильцов из G.hin: на время снимка — хозяин в средней комнате, лицом к нам */
  const mid=R[Math.floor(R.length/2)],hin0=G.hin,mesh0=HOME3.mesh;
  G.hin={x:mid.x+mid.w*.5,vx:0,face:-1,walk:0,phase:0,cam:0,up:0,look:null,lookT:0,folk:hinFolkMake(),t0:G.t};
  HOME3.mesh=HST.mesh;
  try{
    const asp=w/h,cam=homeStillCam(R.length,asp),t=wallMs()/1000,S=home3Scene(cam,t,true);
    S.gnd[3]*=.22;S.fog[3]*=.1;S.sky[3]*=.8;   /* плотность дымки — gnd.w (27f2): рассчитана на 6 м до хозяина, общий план в 25 м — молоко; небо чуть тише */
    /* ключ снимка — солнце двора: ему тень (дом ложится на газон, люди — на пол), иначе кадр без ключа и без веса */
    for(const l of S.lights)if(l.range===40){l.shadow=1;break;}
    const U=new Float32Array(60);
    S.bulbs.slice(0,6).forEach((b,i)=>{const q=r3Proj(cam.vp,b,w/nd,h/nd),q2=r3Proj(cam.vp,[b[0]+.05,b[1],b[2]],w/nd,h/nd);
      if(q&&q2&&q[2]>0)U.set([q[0],q[1]+2,Math.max(2,Math.abs(q2[0]-q[0])),b[3]],i*4);});
    U.set([...r3Lin([255,200,140]),1.0],24);U[43]=t;U[44]=1;U[47]=1;
    U.set([.5,.5,HALL_CA,1],48);U.set([1,h/w,HALL_SHARP,1],52);
    r3Frame(hc,S,(pl,Sv,Vv,Bv)=>rpgField(Rg,pl,"r3post",R3_POST_WGSL,U,[Sv,{view:R3.blank},Vv,Bv]),{cx,w,h});
  }finally{G.hin=hin0;HOME3.mesh=mesh0;}
}
