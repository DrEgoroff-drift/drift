/* ══════════════ планета: состав в кадре — круг (M610), человек (M620), корабль (M621) ══════════════
   Человек с M620 живёт в 21pha (риг с шестью гнёздами комплекта), корабль с M621 — в 21phb
   (по корпусу игры, на опорах); здесь — их места в кадре, круг на воде и пятно тени под
   человеком. Сетки лежат в начале координат, ноги на нуле; в мир их ставит запись
   расстановки, так что шаг не стоит ни одной вершины. */
const PLN_CAST={gen:-1,ring:null,ringI:null,
  ra:new Float32Array(16),
  sink:.6,                              /* на сколько тело в воде сидит ниже, чем его держит игра, м */
  belt:1.0};                            /* высота круга над подошвой, м */

/* станции корпуса, сглаженные: Катмулл — Ром через заданные (корабль 21phb) */
function plnCastResample(st,n){
  const out=[],keys=["x","ry","rz","y"];
  for(let i=0;i<n;i++){
    const u=i/(n-1)*(st.length-1),k=Math.min(Math.floor(u),st.length-2),t=u-k;
    const a=st[Math.max(k-1,0)],b=st[k],c=st[k+1],d=st[Math.min(k+2,st.length-1)],o={};
    for(const q of keys)o[q]=.5*((2*b[q])+(-a[q]+c[q])*t+(2*a[q]-5*b[q]+4*c[q]-d[q])*t*t+(-a[q]+3*b[q]-3*c[q]+d[q])*t*t*t);
    out.push(o);
  }
  return out;
}
/* спасательный круг: тор в цвете людей с белыми перехватами. Скафандр надувает его в воде,
   человек сидит в нём по пояс */
function plnCastRingMesh(){
  const m=plnMesh(1024),suit=plnHex("#ee7326"),white=plnHex("#efe9dc"),path=[],n=32;
  for(let k=0;k<=n;k++){const a=k/n*TAU;path.push([Math.cos(a)*.46,0,Math.sin(a)*.46]);}
  plnTube(m,{path,rad:.15,sides:10,up:[0,1,0],col:t=>((t*4+.11)%1)<.22?white:suit,mat:PLN_MAT.man,x:.2});
  return m;
}
/* сетки и записи этого поколения устройства */
function plnCast(){
  const Q=PLN_CAST;
  if(Q.gen===PLN_GPU.gen)return Q;
  Q.gen=PLN_GPU.gen;
  Q.ring=plnGeo(plnCastRingMesh());
  Q.ringI=plnInst(Q.ra,0,1);
  return Q;
}
/* Ставит человека и корабль в кадр: тела, лампу люка и пятна тени под ними.
   man и ship — места в метрах, face — куда человек смотрит, swim — насколько надут круг (0…1),
   o — состояние для рига и корабля: {S: G.surf, lamp: сила фонаря 0…1, L: земля} */
function plnCastFrame(F,man,face,ship,yaw,swim,o){
  const Q=plnCast(),B=PLN_KIND.body;
  plnManFrame(F,man,face,swim,o);
  plnShipFrame(F,ship,yaw,{L:o&&o.L,gear:1,sq:0,thr:0});
  if(swim>0){
    plnRec(Q.ra,0,[man[0],man[1]+Q.belt,man[2]],.3+.7*swim,0,1,3);
    plnInstSet(Q.ringI,Q.ra,1);
    F.batches.push({geo:Q.ring,inst:Q.ringI,kind:B,to:PLN_TO.all});
  }
  const b=F.blobs;
  let n=b[0]|0;
  if(n<64){b.set([man[0],man[2],.55,.5],4+n*4);n++;}
  b[0]=n;
}
