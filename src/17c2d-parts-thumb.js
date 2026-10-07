/* ══════════════ миниатюры частей (M724) ══════════════
   Та же часть, что стоит на подвесе (17c2b h3dParts), — одна, на постаменте студии: карточки лотка ангара,
   герой инспектора, плашка слота на телефоне, части в продаже и в мастерской станции, добыча «С БОЯ».
   Модель одна на корабле и в карточке: что купил на прилавке, то и встанет на крыло.

   Постамент — «корпус» из одной тумбы: крыльев, боксов и рубки нет, палуба — плоский верх тумбы, у двигателя —
   своё сопло (ошейник 17c2b садится на него, как на корме), под соплом — ложементы. Тумба графитовая с поясом
   цвета рода — той же метки, что на подвесе ангара. Выпечки краски нет: пустая текстура, и часть, и тумба —
   своим цветом (17c2a: доля своего цвета ≥ 1 там, где выпечка пуста), плоскость краски отбрасывается.

   ПРАВИЛА ФАЙЛА:
   1. Холст карточки рисуется вне кадра: partThumb кладёт его в очередь, очередь разбирает таймер, каждую
      миниатюру — своим энкодером (08bi ovPaint). Студия и цель ×4 общие на размер, поэтому подряд в одном
      энкодере две миниатюры не пишутся: вторая перетёрла бы первую до отправки.
   2. Видеопамяти на карточку нет: картинку держит сам холст до следующей перестройки; кэш — только сетки
      (по подписи части, последние 48) и студии по размеру (последние 8).
   3. Без видеокарты (Node, ?gpu=0) холст пуст, место держит CSS (у баннера — пропорция): карточка читается
      и без картинки.
   4. Кадр — тот же для всех: курс и наклон P3T_CAM, свет студии слева сверху; часть вписана в рамку по своим
      вершинам, так что калибр L и H — одного роста в карточке (размер написан в строке, а не нарисован). */
const P3T={M:new Map(),S:new Map(),q:[],t:0,Z:null,zd:null,n:0};
const P3T_CAM={yaw:.66,tilt:1.16,persp:.16,lz:.95,fill:.42,rim:.65,gear:null,aim:null};
function p3tSig(q){return [q.kind,q.seed>>>0,q.tier|0,q.by,q.fam||"",q.lead||"",q.sz|0].join("|");}
/* сетка: часть на тумбе; q — p3PartOf(часть) */
function p3tMesh(q){
  const sig=p3tSig(q);let m=P3T.M.get(sig);
  if(m){P3T.M.delete(sig);P3T.M.set(sig,m);return m;}
  const eng=q.kind==="engine",by=P3_MK[q.by]?q.by:"gt",MK=P3_MK[by];
  const h={by,wings:[],pods:[],nacs:[],eng:eng?[{x:-1.2,y:0,r:1.15}]:[],greeb:[],mark:{},yac:false,
    prof:[[5,2.6],[-5,2.6]],len:30,bw:2.6,form:"",seed:1};
  const kit=h3dKit(),deck=(x,y)=>Math.hypot(x,y)<3.4?.02:0;
  let zt=.02;
  /* сопло двигателя — бочка, как у корпуса (17c2a h3dMesh): раструб назад, зев тлеет */
  if(eng){const e=h.eng[0],bl=Math.max(3,e.r*2.4),br=e.r*1.05,x0=e.x-bl*.1,iron=kit.C(MK.dk),emb=kit.C(mixc(MK.dk,[0,0,0],.6));
    kit.lathe(x0,e.y,0,[[-e.r*.5,br*1.12],[-e.r*.15,br*1.02],[0,br],[bl,br],[bl+.6,br*.8]],iron,.6,.7,0,16,[emb,0,1],[iron,.3,0]);
    zt=-br*1.12-.06;}
  const g={slot:0,kind:q.kind,mount:q.kind==="gun"&&P3_FIX.includes(q.fam)?"fix":"turret",size:MOUNT_SIZES[q.sz|0]||"L",
    x:eng?h.eng[0].x:0,y:0,p:q};
  const pr=h3dParts(kit,h,{list:[g],dry:false},deck);
  /* тумба по следу основания — того, что лежит на самом верху тумбы. Ствол турели низок и длинен: по «всему, что
     ниже полуметра» тумба росла до его дульного среза и становилась вдвое больше вещи. Ствол пусть нависает */
  let R=.5;const V=kit.V;
  for(let i=0;i<V.length;i+=12)if(V[i+2]<zt+.2)R=Math.max(R,Math.hypot(V[i],V[i+1]));
  R=Math.min(R*1.1,eng?2.6:3.2);
  const T=p3Tools(kit),{rev,bx,mt,glo}=T,kc=p3KindCol(q.kind);
  T.seat=zt-.8;
  /* тумба темнее вещи: верх графитовый, свет студии ложится на часть, а не на стол */
  const Mp=mt([30,32,37],.55,.5),Mt=mt([40,43,49],.35,.6),Mg=glo(kc,1),Mb=mt([12,13,15],.1,.1);
  rev([0,0,zt-.8],[0,0,1],[[0,R*1.16],[.46,R*1.16],[.54,R*1.08],[.6,R*1.05,Mg],[.64,R*1.03],[.72,R*.99,Mt],[.8,R*.95,Mt],[.8,0,Mt]],40,Mp);
  /* риски по кромке верха: каждая шестая длиннее — шкала поворотного стола */
  for(let i=0;i<36;i++){const a=i/36*TAU,c=Math.cos(a),s=Math.sin(a),l=i%6?.07:.16;
    bx([c*(R*.93-l),s*(R*.93-l),zt+.005],l,.018,.006,0,i%6?Mb:Mg,[c,s,0],[-s,c,0]);}
  if(eng){const e=h.eng[0],br=e.r*1.05,hz=(-br*.9-zt)/2;
    for(const dx of [-.9,1.3])bx([e.x+dx,0,zt+hz],.22,br*.7,hz,.05,mt(MK.dk,.6,.5));}
  m=h3dPack(V,1,{st:[],ne:2.6,kh:.6,gl:.6,rig:pr.rigs,tops:pr.tops});
  m.R=Math.max(m.R,pr.R*1.02);m.FR=new Map();
  if(P3T.M.size>=48){const k0=P3T.M.keys().next().value,o=P3T.M.get(k0);if(o.buf)o.buf.destroy();P3T.M.delete(k0);}
  P3T.M.set(sig,m);return m;
}
/* рамка w×h: центр и масштаб, чтобы часть с тумбой легла с полями (как hgUnits ангара, один курс) */
function p3tFrame(m,w,h){
  const key=w+"x"+h;let F=m.FR.get(key);if(F)return F;
  const C=P3T_CAM,V=m.v,N=(m.n-6)*12,cy=Math.cos(C.yaw),sy=Math.sin(C.yaw),ct=Math.cos(C.tilt),st=Math.sin(C.tilt),k=C.persp*(1-C.persp)/m.R;
  let u0=1e9,u1=-1e9,v0=1e9,v1=-1e9;
  for(let i=0;i<N;i+=12){const px=V[i],py=V[i+1],pz=V[i+2],X=px*cy-py*sy,Y0=px*sy+py*cy,Y=Y0*ct-pz*st,Z=Y0*st+pz*ct,w1=1-k*Z,u=X/w1,v=Y/w1;
    if(u<u0)u0=u;if(u>u1)u1=u;if(v<v0)v0=v;if(v>v1)v1=v;}
  const sc=Math.min(w*.9/Math.max(u1-u0,.1),h*.88/Math.max(v1-v0,.1));
  F={sc,x:w/2-(u0+u1)/2*sc,y:h/2-(v0+v1)/2*sc};m.FR.set(key,F);return F;
}
/* пустая выпечка: и краска, и материал — нули (своё устройство) */
function p3tZero(){
  const d=GPU.dev;
  if(P3T.zd!==d){P3T.zd=d;const t=d.createTexture({size:[4,4],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING});
    P3T.Z={view:t.createView(),mat:{view:t.createView()}};}
  return P3T.Z;
}
/* холст cv размером w×h CSS — часть q; только вне кадра (правило 1) */
function p3tPaint(cv,q,w,h){
  const nd=panelNd(),pw=Math.max(1,Math.round(w*nd)),ph=Math.max(1,Math.round(h*nd));
  if(cv.width!==pw)cv.width=pw;if(cv.height!==ph)cv.height=ph;
  return ovPaint(cv,nd,()=>{
    const m=p3tMesh(q),F=p3tFrame(m,w,h),key=w+"x"+h+"|"+nd;
    let S=P3T.S.get(key);
    if(!S){if(P3T.S.size>=8){const k0=P3T.S.keys().next().value,o=P3T.S.get(k0);P3T.S.delete(k0);
        if(o.dev===GPU.dev){if(o.tex)GPU.trash.push(o.tex);if(o.d3)GPU.trash.push(o.d3.ms,o.d3.md,o.d3.res);}}
      S={v3:P3T_CAM};P3T.S.set(key,S);}
    if(!studioOpen(S,w,h,nd))return false;
    let ok=false;
    try{ok=h3dRun(m,p3tZero(),F.x,F.y,0,F.sc,0,HS_LT[0],HS_LT[1],null,0,null,S);}finally{studioClose(S);}
    if(!ok)return false;
    ovImage({tex:S.tex,view:S.view,dev:S.dev,inv:true},w/2,h/2,w,h,0,0,0,1,1,1);
    P3T.n++;
  });
}
/* холст миниатюры части p размером w×h CSS (cls — свой класс); картинка ляжет таймером, вне кадра.
   Класс «fl» — баннер во всю ширину карточки: рисуется в w×h, на месте держит пропорцию */
function partThumb(p,w,h,cls){
  const cv=document.createElement("canvas");cv.className="p3th"+(cls?" "+cls:"");
  if(cls&&/\bfl\b/.test(cls))cv.style.aspectRatio=w+"/"+h;
  else{cv.style.width=w+"px";cv.style.height=h+"px";}
  if(p&&PART_KINDS[p.kind])cv.style.setProperty("--k",PART_KINDS[p.kind].col);
  const q=p&&p.kind&&PART_KINDS[p.kind]?p3PartOf(p):null;
  if(q){P3T.q.push([cv,q,w,h]);if(!P3T.t)P3T.t=setTimeout(p3tFlush,0);}
  return cv;
}
function p3tFlush(){
  P3T.t=0;const L=P3T.q.splice(0);
  if(GPU.enc){P3T.q.push(...L);P3T.t=setTimeout(p3tFlush,0);return;}   /* кадр ещё открыт — следующим таймером */
  /* баннер «fl» рисуется в свой настоящий рост, иначе растянут и мылит. Ширины читаются разом до рисования
     (одна вёрстка на пачку) и здесь, в таймере, — не в кадре и не в пальце (0.3) */
  const J=L.filter(it=>it[0].isConnected).map(([cv,q,w,h])=>{
    const fl=cv.classList.contains("fl"),cw=fl?cv.clientWidth:0,ch=fl?cv.clientHeight:0;   /* высоту может срезать max-height */
    return cw>8&&ch>8?[cv,q,Math.round(cw),Math.round(ch)]:[cv,q,w,h];});
  for(const [cv,q,w,h] of J)p3tPaint(cv,q,w,h);
}
