/* ══════════════ порода: тело ══════════════
   Та же птица, что в игре (src/12y): кобальт спины, кремовая грудь, янтарь на
   плече, хохол из отведённых назад пёрышек с холодной бусиной на конце. Здесь
   она в объёме, поэтому порода задаётся не рисунком, а СИЛУЭТОМ: одиннадцать
   станций вдоль хребта, у каждой ширина, вынос вперёд (грудь) и назад (спина).

   Ось: X вправо, Y вверх, Z вперёд — птица смотрит в +Z, лапы на нуле.

   ПРАВИЛО ТЕЛА (то же, что в двумерной сборке). Сперва одна масса силуэта, и
   только потом на неё кладутся перья. Тело здесь — не подложка «чтобы не
   просвечивало», а то, что читается на просвет между перьями и на кромке. */

const BIRD_C={
  body:sRGB("#101a2e"),
  blue:sRGB("#2f6fd6"), blueD:sRGB("#17417f"), blueL:sRGB("#7cbdf5"),
  cream:sRGB("#fdf7e9"), creamD:sRGB("#ddcbab"),
  amber:sRGB("#f2a03c"), amberD:sRGB("#bc6a1c"),
  viol:sRGB("#7a5ad2"),
  beak:sRGB("#f7cd94"), beakD:sRGB("#c8853f"),
  foot:sRGB("#b4763f"), footD:sRGB("#6f431f"),
  glow:sRGB("#6ff0ff"),
  eye:sRGB("#120b16"),
  perch:sRGB("#4a3a2c")
};

/* станция: [t, y, z, ширина, вынос вперёд, вынос назад] */
const BIRD_SPINE=[
  [0.00, 0.60,-0.64, 0.09, 0.09, 0.09],
  [0.10, 0.64,-0.50, 0.22, 0.20, 0.17],
  [0.22, 0.71,-0.30, 0.34, 0.31, 0.27],
  [0.35, 0.83,-0.13, 0.40, 0.40, 0.31],
  [0.48, 1.01,-0.03, 0.41, 0.43, 0.32],
  [0.60, 1.21, 0.00, 0.37, 0.38, 0.31],
  [0.70, 1.39,-0.05, 0.29, 0.27, 0.28],
  [0.78, 1.51,-0.05, 0.26, 0.25, 0.27],
  [0.86, 1.65, 0.00, 0.30, 0.31, 0.30],
  [0.94, 1.79, 0.05, 0.28, 0.28, 0.27],
  [1.00, 1.92, 0.03, 0.08, 0.08, 0.08]
];
const SP_PTS=BIRD_SPINE.map(s=>s.slice(1));   /* для сплайна: без параметра t */

/* точка хребта и его локальный базис.
   N — «перёд» сечения: у шеи это грудь, у хвоста — брюхо. Считается из
   касательной, поэтому силуэт правится одними числами таблицы. */
function spineAt(t){
  const s=catmull(SP_PTS,t);
  const e=1e-3,a=catmull(SP_PTS,clamp(t-e,0,1)),b=catmull(SP_PTS,clamp(t+e,0,1));
  const T=vNorm([0,b[0]-a[0],b[1]-a[1]]);
  const N=[0,-T[2],T[1]];
  return {c:[0,s[0],s[1]],T,N,rw:s[2],rf:s[3],rb:s[4]};
}
/* точка поверхности тела: a=0 — бок, a=+90° — грудь/брюхо, a=180° — другой бок */
function bodyAt(t,a){
  const S=spineAt(t),sa=Math.sin(a),ca=Math.cos(a);
  const r=S.rb+(S.rf-S.rb)*(.5+.5*sa);
  return [S.c[0]+ca*S.rw, S.c[1]+S.N[1]*r*sa, S.c[2]+S.N[2]*r*sa+ca*0];
}

/* ── окрас ──
   Не текстура, а функция от (t,a): пятна породы должны переживать любую
   пересборку сетки и одинаково красить и тело, и перья поверх него. */
function bodyColor(t,a){
  const belly=.5+.5*Math.sin(a);          /* 1 — грудь, 0 — спина */
  const side=Math.abs(Math.cos(a));
  let c=vLerp(BIRD_C.blueD,BIRD_C.blue,smooth(.0,.55,belly)*.8+.2);
  /* грудь и брюхо кремовые, с тёплой подпалиной к хвосту */
  const cream=smooth(.50,.68,belly)*smooth(.68,.57,t);
  c=vLerp(c,vLerp(BIRD_C.creamD,BIRD_C.cream,smooth(.2,.6,t)),cream);
  /* плечо: янтарный эполет по бокам корпуса */
  const ep=smooth(.62,.44,Math.abs(t-.55)*6)*smooth(.35,.75,side)*smooth(.30,.45,belly);
  c=vLerp(c,BIRD_C.amber,clamp(ep,0,1)*.9);
  /* подхвостье уходит в фиолетовый — единственное холодное пятно внизу */
  c=vLerp(c,BIRD_C.viol,smooth(.16,.02,t)*.7);
  /* щека: тёплое пятно под глазом, чтобы голова не была одноцветной */
  const ch=smooth(.075,.0,Math.abs(t-.885))*smooth(.55,.95,side)*smooth(.30,.62,belly);
  c=vLerp(c,BIRD_C.amber,clamp(ch,0,1)*.95);
  /* темя темнее лба: голова круглая, и без этого она читается шаром */
  c=vLerp(c,BIRD_C.blueD,smooth(.90,1.0,t)*.5*(1-belly*.4));
  return c;
}

/* ── сетка тела ──
   Лофт по станциям: NT колец по NA точек. Нормали считаются разностями по
   сетке — надёжнее аналитики, которая на капах врёт.
   Атрибуты: pos(3) nrm(3) t(1) a(1) col(3) — по 11 чисел на вершину. */
function buildBody(NT,NA){
  const verts=new Float32Array(NT*NA*11),idx=[];
  const P=[],Nn=[];
  for(let i=0;i<NT;i++){
    const t=i/(NT-1);
    for(let j=0;j<NA;j++){
      const a=j/NA*TAU;
      P.push(bodyAt(t,a));
    }
  }
  const at=(i,j)=>P[i*NA+((j%NA)+NA)%NA];
  for(let i=0;i<NT;i++)for(let j=0;j<NA;j++){
    const i0=Math.max(0,i-1),i1=Math.min(NT-1,i+1);
    const du=vSub(at(i1,j),at(i0,j)),dv=vSub(at(i,j+1),at(i,j-1));
    let n=vNorm(vCross(dv,du));
    if(i===0||i===NT-1){ /* на капах разность вырождается — берём осевое направление */
      const S=spineAt(i===0?0:1);
      n=vNorm(vAdd(vMul(S.T,i===0?-1:1),vMul(n,.35)));
    }
    Nn.push(n);
  }
  for(let i=0;i<NT;i++)for(let j=0;j<NA;j++){
    const k=(i*NA+j)*11,p=P[i*NA+j],n=Nn[i*NA+j],t=i/(NT-1),a=j/NA*TAU,c=bodyColor(t,a);
    verts[k]=p[0];verts[k+1]=p[1];verts[k+2]=p[2];
    verts[k+3]=n[0];verts[k+4]=n[1];verts[k+5]=n[2];
    verts[k+6]=t;verts[k+7]=0;   /* материал 0: тёмная масса под перьями */
    verts[k+8]=c[0];verts[k+9]=c[1];verts[k+10]=c[2];
  }
  for(let i=0;i<NT-1;i++)for(let j=0;j<NA;j++){
    const j1=(j+1)%NA,A=i*NA+j,B=i*NA+j1,C=(i+1)*NA+j,D=(i+1)*NA+j1;
    idx.push(A,C,B, B,C,D);
  }
  return {verts,index:new Uint16Array(idx),stride:11,
          attrs:[["p",3,0],["n",3,3],["tm",2,6],["c",3,8]]};
}
