/* ══════════════ Зрение 2.0: мир (закон «масштаб») ══════════════
   Зрение 1.0 судит интерфейс. Мир оно не судило — и шахта на большом экране клала ствол, крепь и
   кромку травы в K раз мельче в левый верхний угол («ствол в небе», автор, 15.10): фигуры видеокарты
   (gpuShapes, gpuImage) шли в мировых пикселях мимо withScale. На окне 1000 этого не видно —
   масштаб кадра там 1.
   Закон: мир, нарисованный в окне 1000×560 (K=1) и 2000×1120 (K=2), один и тот же — значит,
   фигуры видеокарты в долях кадра лежат там же. Разошлись больше чем на 4 % кадра — «масштаб».
   Подсадка: gpuShpAt (08c) подменяется тождеством — брак обязан найтись. */
const GEO_WORLD=[
  /* шахта с 0.499.11 целиком на 3D-движке (23c*, dig3Draw), как пещера и поверхность (21p*, 22d*): фигур
     видеокарты у них нет, закон по фигурам их не видит и слепнул в воротах (22.10). Сцена и подсадка сняты,
     пока нет закона по телам; новая сцена с фигурами видеокарты в мире — сюда, подсадка вернётся с ней */
];
/* где легли фигуры видеокарты за один кадр: рамка всех центров, в долях кадра */
function geoWorldBox(){
  const oS=gpuShapes,oI=gpuImage,P=[];
  gpuShapes=function(pass,items,o){for(const t of items||[]){if(t[0]===5)P.push([(t[1]+t[3]+t[5])/3,(t[2]+t[4]+t[6])/3]);
    else if(t[0]===1||t[0]===3||t[0]===4)P.push([t[1],t[2]]);else P.push([(t[1]+t[3])/2,(t[2]+t[4])/2]);}
    return oS.apply(this,arguments);};
  gpuImage=function(pass,B,rects,o){for(const r of rects||[])P.push([r.x,r.y]);return oI.apply(this,arguments);};
  try{geoFrame1();}finally{gpuShapes=oS;gpuImage=oI;}
  const f=P.filter(q=>isFinite(q[0])&&isFinite(q[1]));if(f.length<8)return null;
  /* рамка по 5-му и 95-му перцентилю: одна случайная фигура у края не решает */
  const xs=f.map(q=>q[0]/W).sort((a,b)=>a-b),ys=f.map(q=>q[1]/H).sort((a,b)=>a-b),at=(A,u)=>A[Math.floor(u*(A.length-1))];
  return {n:f.length,b:[at(xs,.05),at(ys,.05),at(xs,.95),at(ys,.95)]};
}
function geoWorldOne(sc,out,plant){
  const keep=typeof gpuShpAt==="function"?gpuShpAt:null;
  if(plant&&!keep)return null;
  if(plant)gpuShpAt=L=>L;
  try{
    resetWorld();if(!sc.open())return null;
    T.window(1000,560);const a=geoWorldBox();
    T.window(2000,1120);const b=geoWorldBox();
    T.window();
    if(!a||!b)return null;
    const d=Math.max(...a.b.map((v,i)=>Math.abs(v-b.b[i])));
    return {d,a,b};
  }finally{if(plant)gpuShpAt=keep;T.window();}
}
function geoWorld(out){
  if(!GEO_WORLD.length)return;
  if(!GPU.ok||!GPU.dev){out.blind.push("мир: видеокарты нет — закон «масштаб» не смотрел");return;}   /* без видеокарты мир рисует 2D, и масштаб у него свой */
  for(const sc of GEO_WORLD){
    let r=null;
    try{r=geoWorldOne(sc,out,false);}catch(e){out.errs.push("мир · "+sc.name+": "+(e&&e.message));continue;}
    if(!r){out.blind.push("мир · "+sc.name+": фигур видеокарты нет — закон «масштаб» не видит сцену");continue;}
    if(r.d>.04)out.findings.push({law:"масштаб",who:"мир · "+sc.name,m:Math.round(r.d*1000)/10,where:"мир · "+sc.name,
      with:"доли кадра K=1 "+r.a.b.map(v=>v.toFixed(2)).join(",")+" · K=2 "+r.b.b.map(v=>v.toFixed(2)).join(",")});
  }
  /* подсадка: мир без перевода в CSS обязан разойтись — иначе закон слеп */
  try{const r=geoWorldOne(GEO_WORLD[0],out,true);
    if(r&&r.d<=.04)out.blind.push("мир · подсадка «масштаб» не поймана (расхождение "+(r.d*100).toFixed(1)+" %)");}
  catch(e){out.errs.push("мир · подсадка: "+(e&&e.message));}
  resetWorld();
}
