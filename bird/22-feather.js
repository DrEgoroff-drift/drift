/* ══════════════ перо ══════════════
   Одно перо на всю птицу — остальное делают инстансы. Форма ланцетовидная:
   узкое у основания, широкое в средней трети, острое на конце. Стержень
   выгнут, опахало «зачерпнуто» — плоский четырёхугольник читается фольгой.

   ПРАВИЛО (то же, что в двумерной птице): щель между перьями заметнее самого
   пера. Поэтому ряды кладутся черепицей с перекрытием, а не встык, и под
   ними всегда лежит тёмная масса тела.

   Прозрачности нет ни грамма: контур пера — это геометрия. Так перья честно
   попадают в карту теней и не требуют сортировки. */
function buildFeather(cols,rows){
  const M={v:[],i:[],n:0};
  const P=[];
  /* кончик у контурного пера ЗАКРУГЛЁН, а не заострён: острые концы дают
     чешую, и первая сборка ушла именно в неё */
  const wid=v=>{
    const b=Math.pow(Math.sin(Math.pow(clamp(v,0,1),0.62)*Math.PI),0.42);
    /* и ещё раз про кончик: он скругляется дугой на последней восьмой длины.
       Без этого перо сходится в остриё, ряд читается чешуёй, а на силуэте
       птица покрывается шипами */
    const e=Math.max(0,(v-0.86)/0.14);
    return b*Math.sqrt(Math.max(0,1-e*e));
  };
  const cup=(u,v)=>-0.16*u*u*wid(v)-0.10*v*v;      /* чашка опахала и выгиб стержня */
  for(let i=0;i<rows;i++){
    const v=i/(rows-1),row=[];
    for(let j=0;j<cols;j++){
      const u=(j/(cols-1)-0.5)*2;
      row.push([u*wid(v)*0.5,cup(u,v),v]);
    }
    P.push(row);
  }
  const at=(i,j)=>P[clamp(i,0,rows-1)][clamp(j,0,cols-1)];
  const V=[];
  for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){
    const du=vSub(at(i+1,j),at(i-1,j)),dv=vSub(at(i,j+1),at(i,j-1));
    let n=vNorm(vCross(dv,du));
    if(n[1]<0)n=vMul(n,-1);
    const u=(j/(cols-1)-0.5)*2,v=i/(rows-1);
    V.push(...at(i,j),...n,u,v);
  }
  const idx=[];
  for(let i=0;i<rows-1;i++)for(let j=0;j<cols-1;j++){
    const a=i*cols+j,b=a+1,c=a+cols,d=c+1;
    idx.push(a,c,b,b,c,d);
  }
  return {verts:new Float32Array(V),index:new Uint16Array(idx),stride:8,
          attrs:[["p",3,0],["n",3,3],["uv",2,6]]};
}

/* ── укладка ──
   Инстанс: матрица 3×4 (12), цвет (3), настройки (4: чашка, выгиб, t хребта,
   род пера). Строится один раз — поза живёт в вершинной программе. */
const FEA_STRIDE=19;
function feaPush(out,p,dir,up,len,wid,col,par){
  const Z=vNorm(dir);
  let Y=vNorm(vSub(up,vMul(Z,vDot(up,Z))));
  if(vLen(Y)<1e-4)Y=basisFrom(Z)[1];
  const X=vCross(Y,Z);
  /* матрица кладётся тремя строками по четыре: столбцы — оси, четвёртое
     число строки — сдвиг. Так в шейдере она читается тремя vec4 */
  out.push(X[0]*wid,Y[0]*wid,Z[0]*len,p[0],
           X[1]*wid,Y[1]*wid,Z[1]*len,p[1],
           X[2]*wid,Y[2]*wid,Z[2]*len,p[2],
           col[0],col[1],col[2],
           par[0],par[1],par[2],par[3]);
}
/* тангенс «к хвосту» на поверхности тела: перо всегда лежит вдоль потока */
function flowAt(t,a){
  const e=0.012;
  const p1=bodyAt(clamp(t-e,0,1),a),p2=bodyAt(clamp(t+e,0,1),a);
  return vNorm(vSub(p1,p2));      /* от головы к хвосту */
}
function normalAt(t,a){
  const e=0.01,d=0.05;
  const p=bodyAt(t,a);
  const du=vSub(bodyAt(clamp(t+e,0,1),a),bodyAt(clamp(t-e,0,1),a));
  const dv=vSub(bodyAt(t,a+d),bodyAt(t,a-d));
  let n=vNorm(vCross(du,dv));
  /* наружу: сверяемся с направлением от оси тела */
  const S=spineAt(t),out=vSub(p,S.c);
  if(vDot(n,out)<0)n=vMul(n,-1);
  return n;
}

/* ── оперение корпуса ──
   Ряды снизу вверх, каждый следующий перекрывает предыдущий. Шаг ряда меньше
   длины пера — иначе между рядами видно тело. */
function layoutCoat(){
  const out=[],R=rnd(0x7b1d);
  const ROWS=54;
  for(let r=0;r<ROWS;r++){
    const t0=mix(0.055,0.995,r/(ROWS-1));
    const S=spineAt(t0);
    const girth=(S.rw+S.rf+S.rb)*0.5;
    const n=Math.max(8,Math.round(girth*90));
    for(let j=0;j<n;j++){
      const a=(j+(r%2)*0.5)/n*TAU+R()*0.10;
      /* ряд не должен читаться рядом: каждое перо гуляет вдоль хребта на
         полшага, и черепица становится оперением, а не кладкой */
      const t=clamp(t0+(R()-0.5)*0.028,0.03,0.998);
      /* Голое место на птице — только клюв, восковица и кольцо вокруг глаза.
         Первая версия резала перья по (t,a) на глазок и оставляла голубую
         лысину во всю голову: голова у птицы и есть то место, где перьев
         больше всего, просто они там мелкие. Проверка идёт по РАССТОЯНИЮ до
         настоящих частей, а не по параметрам поверхности. */
      const base=bodyAt(t,a);
      if(base[1]>1.50&&base[2]>0.17&&Math.abs(base[0])<0.15)continue;   /* клюв */
      if(base[1]>1.79&&base[2]>0.05&&Math.abs(base[0])<0.13)continue;   /* восковица */
      let inEye=false;
      for(const sx of [-1,1]){
        const d=Math.hypot(base[0]-sx*0.248,base[1]-1.786,base[2]-0.100);
        if(d<0.115){inEye=true;break;}
      }
      if(inEye)continue;
      const p=normalAt(t,a);
      const dir=flowAt(t,a);
      /* перо не лежит плашмя: конец приподнят, иначе ряд читается чешуёй */
      const lift=0.075+R()*0.035;
      const d2=vNorm(vAdd(dir,vMul(p,lift)));
      const len=mix(0.170,0.088,smooth(0.35,1.0,t))*(0.84+R()*0.32);
      const wid=len*mix(0.68,0.90,R());
      const col=bodyColor(t,a);
      const cv=0.86+R()*0.28;
      feaPush(out,vAdd(base,vMul(p,-0.012)),d2,p,len,wid,
        [col[0]*cv,col[1]*cv,col[2]*cv],[1.0,0.5+R()*0.5,t,0.0]);
    }
  }
  return new Float32Array(out);
}

/* ── маховые, кроющие, хвост, хохол ──
   Крупные перья лежат по своим осям: у сложенного крыла это дуга от плеча к
   хвосту, у хвоста — веер из одной точки. Их немного, и каждое видно. */
function layoutPlumes(){
  const out=[],R=rnd(0x51c3);
  for(const sx of [-1,1]){
    /* маховые: от плеча вдоль бока назад, кончики сходятся у корня хвоста */
    for(let i=0;i<10;i++){
      const k=i/9;
      const t=mix(0.60,0.40,k),a=sx>0?mix(0.10,-0.35,k):Math.PI-mix(0.10,-0.35,k);
      const base=bodyAt(t,a),nrm=normalAt(t,a);
      const tip=[sx*mix(0.16,0.05,k),mix(0.72,0.52,k),mix(-0.62,-0.95,k)];
      const dir=vNorm(vSub(tip,base));
      const len=mix(0.72,1.02,k)*(0.97+R()*0.06);
      feaPush(out,vAdd(base,vMul(nrm,0.004)),vNorm(vAdd(dir,vMul(nrm,0.05))),nrm,
        len,len*0.20,vLerp(BIRD_C.blueD,BIRD_C.body,0.25+k*0.35),
        [0.7,0.85,t,1.0]);
    }
    /* второстепенные: короче, выше, дают крылу толщину */
    for(let i=0;i<9;i++){
      const k=i/8;
      const t=mix(0.66,0.46,k),a=sx>0?mix(0.34,-0.05,k):Math.PI-mix(0.34,-0.05,k);
      const base=bodyAt(t,a),nrm=normalAt(t,a);
      const dir=vNorm(vAdd(flowAt(t,a),vMul(nrm,0.10)));
      feaPush(out,base,dir,nrm,mix(0.40,0.56,k),mix(0.15,0.20,k),
        vLerp(BIRD_C.blue,BIRD_C.blueD,0.35+k*0.4),[0.85,0.7,t,1.0]);
    }
    /* кроющие плеча: янтарный эполет, три коротких ряда */
    for(let r=0;r<3;r++)for(let i=0;i<7;i++){
      const k=i/6,t=mix(0.70,0.52,k)-r*0.015;
      const a=(sx>0?1:-1)*(0.30+r*0.16)+(sx>0?0:Math.PI);
      const aa=sx>0?a:Math.PI-(0.30+r*0.16);
      const base=bodyAt(t,aa),nrm=normalAt(t,aa);
      const dir=vNorm(vAdd(flowAt(t,aa),vMul(nrm,0.22)));
      const c=vLerp(BIRD_C.amber,BIRD_C.amberD,0.35+r*0.22+R()*0.25);
      feaPush(out,base,dir,nrm,0.125-r*0.012,0.088,c,[1.0,0.6,t,0.0]);
    }
  }
  /* хвост: длинный, слоёный, средняя пара длиннее всех */
  for(let i=0;i<11;i++){
    const k=(i/10-0.5)*2;
    const a=Math.PI*1.5+k*0.5;
    const base=bodyAt(0.045,a);
    const dir=vNorm([k*0.30,-0.34-Math.abs(k)*0.10,-1.0]);
    const len=1.30-Math.abs(k)*0.34;
    const c=vLerp(BIRD_C.blue,BIRD_C.blueD,0.30+Math.abs(k)*0.45);
    feaPush(out,base,dir,vNorm([k*0.3,1,-0.2]),len,len*0.13,c,[0.55,0.55,0.05,2.0]);
  }
  /* хохол: отведённые назад пёрышки, на конце каждого — бусина (21-parts) */
  for(let i=0;i<CREST_N;i++){
    const q=crestQuill(i);
    /* пёрышко хохла шире, чем кажется: узкая спица читается проволокой, а
       бусина на конце — лампочкой на проводе */
    feaPush(out,q.base,q.dir,normalAt(0.96,Math.PI*1.5),q.len,q.len*0.26,
      vLerp(BIRD_C.blueL,BIRD_C.amber,0.30+Math.abs(q.k)*0.35),[0.9,1.1,1.0,3.0]);
  }
  return new Float32Array(out);
}
