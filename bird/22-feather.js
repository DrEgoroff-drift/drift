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
  /* Лист, а не прямоугольник: самое широкое место — чуть ниже середины, к
     концу опахало сходит плавно, и последняя четверть скругляется дугой.
     Видно у пера всё равно только кончик, поэтому форма кончика и решает,
     читается оперение перьями или кирпичной кладкой. */
  const wid=v=>{
    const x=clamp(v,0,1);
    const b=Math.pow(Math.sin(Math.pow(x,0.55)*Math.PI),0.38);
    const e=Math.max(0,(x-0.75)/0.25);
    return b*Math.sqrt(Math.max(0,1-e*e));
  };
  const cup=(u,v)=>-0.28*u*u*wid(v)-0.13*v*v;      /* чашка опахала и выгиб стержня */
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
function feaPush(out,p,dir,up,len,wid,col,par,roll){
  const Z=vNorm(dir);
  let Y=vNorm(vSub(up,vMul(Z,vDot(up,Z))));
  if(vLen(Y)<1e-4)Y=basisFrom(Z)[1];
  /* поворот пера вокруг собственной оси: без него пучок перьев лежит в одной
     плоскости и читается веером из бумаги. Часть перьев обязана стоять ребром */
  if(roll){
    const c=Math.cos(roll),s=Math.sin(roll),X0=vCross(Y,Z);
    Y=vAdd(vMul(Y,c),vMul(X0,s));
  }
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
/* нормаль берётся из 20-body: одна формула на тело и на перья */
const normalAt=(t,a)=>bodyNormal(t,a);

/* ── оперение корпуса ──
   Ряды снизу вверх, каждый следующий перекрывает предыдущий. Шаг ряда меньше
   длины пера — иначе между рядами видно тело. */
/* шары вдоль клюва и восковицы: перьев внутри них не бывает */
const BEAK_BALLS=[
  [0,1.826,0.090,0.115],[0,1.790,0.150,0.120],[0,1.752,0.235,0.115],
  [0,1.712,0.305,0.100],[0,1.665,0.355,0.085],[0,1.660,0.180,0.105]
];
const COAT_STAT={all:0,head:0,cut:0};
function layoutCoat(rows,dens){
  const out=[],R=rnd(0x7b1d);
  const ROWS=rows||64,DENS=dens||118;
  for(let r=0;r<ROWS;r++){
    const t0=mix(0.055,0.995,r/(ROWS-1));
    const S=spineAt(t0);
    const girth=(S.rw+S.rf+S.rb)*0.5;
    const n=Math.max(9,Math.round(girth*DENS));
    for(let j=0;j<n;j++){
      const a=(j+(r%2)*0.5)/n*TAU+R()*0.10;
      /* ряд не должен читаться рядом: каждое перо гуляет вдоль хребта на
         полшага, и черепица становится оперением, а не кладкой */
      const t=clamp(t0+(R()-0.5)*0.028,0.03,0.998);
      /* Голое место на птице — только клюв, восковица и кольцо у глаза.
         Граница считается по РАССТОЯНИЮ до частей, а не коробкой: коробка
         режет оперение прямой линией, и у основания клюва получался ровный
         вертикальный срез, какого на птице не бывает. */
      const base=bodyAt(t,a);
      let bare=false;
      for(const b of BEAK_BALLS){
        const d=Math.hypot(base[0]-b[0],base[1]-b[1],base[2]-b[2]);
        if(d<b[3]){bare=true;break;}
      }
      if(!bare)for(const sx of [-1,1]){
        const d=Math.hypot(base[0]-sx*0.248,base[1]-1.786,base[2]-0.100);
        if(d<0.079){bare=true;break;}
      }
      if(bare){COAT_STAT.cut++;continue;}
      COAT_STAT.all++; if(base[1]>1.60)COAT_STAT.head++;
      const p=normalAt(t,a);
      const dir=flowAt(t,a);
      /* Перо ДЛИННЕЕ шага ряда втрое: у настоящей птицы видно не перья, а их
         кончики — черепица, где каждое следующее прикрывает предыдущее на две
         трети. Пока длина была равна шагу, оперение читалось мозаикой из
         бумажных фишек. */
      const len=mix(0.240,0.092,smooth(0.30,0.94,t))*(0.86+R()*0.28);
      /* НАСКОЛЬКО поднят конец пера — считается, а не подбирается. Перо
         лежит по касательной, а тело под ним круглое: на голове радиусом
         0.28 перо длиной 0.09 уходит под поверхность на полтора сантиметра
         и пропадает совсем. Первая версия так и потеряла всё оперение
         головы — осталась голубая лысина. Наклон len/2R как раз выводит
         кончик обратно наружу, дальше — вкус. */
      const meanR=Math.max(0.10,(S.rw+S.rf+S.rb)/3);
      const lift=Math.min(0.20,0.075+len/(2*meanR))+R()*0.03;
      const d2=vNorm(vAdd(dir,vMul(p,lift)));
      const wid=len*mix(0.44,0.58,R());
      const col=bodyColor(t,a);
      const cv=0.84+R()*0.28;
      /* тёплый-холодный разброс по перьям: ровное поле одного цвета читается
         краской, а не оперением. Сдвиг мелкий — породу он не трогает. */
      const wc=(R()-0.5)*0.055;
      feaPush(out,vAdd(base,vMul(p,-0.006)),d2,p,len,wid,
        [col[0]*cv*(1+wc),col[1]*cv,col[2]*cv*(1-wc)],[1.0,0.04+R()*0.06,t,0.0]);
    }
  }
  return new Float32Array(out);
}

/* ── маховые, кроющие, хвост, хохол ──
   Крупные перья лежат по своим осям, и каждое видно поимённо.

   СЛОЖЕННОЕ КРЫЛО — не пучок ножей, торчащих из бока. Это слоёная лопасть:
   маховые идут от плеча назад и сходятся кончиками ЗА корнем хвоста, каждое
   следующее чуть ниже и длиннее предыдущего; поверх их основания ложатся
   второстепенные, а поверх тех — кроющие. Поэтому длина пера здесь не
   подбирается на глаз, а считается как расстояние до его кончика: только так
   веер сходится в одну точку, а не рассыпается. */
function layoutPlumes(){
  const out=[],R=rnd(0x51c3);
  for(const sx of [-1,1]){
    const flip=a=>sx>0?a:Math.PI-a;
    /* маховые */
    const NP=11;
    for(let i=0;i<NP;i++){
      const k=i/(NP-1);
      const t=mix(0.62,0.30,k),a=flip(mix(0.18,-0.26,k));
      const base=bodyAt(t,a),nrm=normalAt(t,a);
      const tip=[sx*mix(0.22,0.07,k),mix(0.76,0.52,k),mix(-0.56,-0.94,k)];
      const dir=vSub(tip,base),len=vLen(dir);
      feaPush(out,vAdd(base,vMul(nrm,0.008)),
        vNorm(vAdd(vNorm(dir),vMul(nrm,0.03))),nrm,
        len,len*0.26,vLerp(BIRD_C.blue,BIRD_C.blueD,0.42+k*0.42),[0.6,0.14,t,1.0]);
    }
    /* второстепенные: короче, выше, дают крылу толщину */
    const NS=9;
    for(let i=0;i<NS;i++){
      const k=i/(NS-1);
      const t=mix(0.68,0.44,k),a=flip(mix(0.40,0.02,k));
      const base=bodyAt(t,a),nrm=normalAt(t,a);
      const tip=[sx*mix(0.26,0.16,k),mix(0.86,0.66,k),mix(-0.40,-0.72,k)];
      const dir=vSub(tip,base),len=vLen(dir);
      feaPush(out,vAdd(base,vMul(nrm,0.004)),
        vNorm(vAdd(vNorm(dir),vMul(nrm,0.06))),nrm,
        len,len*0.30,vLerp(BIRD_C.blue,BIRD_C.blueD,0.20+k*0.45),[0.7,0.8,t,1.0]);
    }
    /* кроющие плеча: янтарный эполет, три коротких ряда черепицей */
    for(let r=0;r<3;r++)for(let i=0;i<8;i++){
      const k=i/7,t=mix(0.72,0.50,k)-r*0.012;
      const a=flip(0.30-r*0.15+k*0.10);
      const base=bodyAt(t,a),nrm=normalAt(t,a);
      const dir=vNorm(vAdd(flowAt(t,a),vMul(nrm,0.16)));
      const c=vLerp(BIRD_C.amber,BIRD_C.amberD,0.30+r*0.24+R()*0.22);
      feaPush(out,base,dir,nrm,0.135-r*0.014,0.100-r*0.008,c,[1.0,0.10,t,0.0]);
    }
  }
  /* хвост: длинный, слоёный, средняя пара длиннее всех.
     Перья слегка расходятся веером и лежат друг на друге — сложенный хвост
     это стопка, а не одна доска: первая сборка давала ровно доску. */
  for(let i=0;i<11;i++){
    const k=(i/10-0.5)*2,ak=Math.abs(k);
    const a=Math.PI*1.5+k*0.42;
    const base=bodyAt(0.05,a);
    const dir=vNorm([k*0.26,-0.44-ak*0.07,-1.0]);
    const len=1.34-ak*0.32;
    const c=vLerp(BIRD_C.blue,BIRD_C.blueD,0.26+ak*0.42);
    /* каждое следующее перо чуть выше предыдущего: стопка, а не плоскость */
    const up=vNorm([k*0.34,1,-0.16]);
    feaPush(out,vAdd(base,vMul(up,0.006*(5-Math.abs(i-5)))),dir,up,
      len,len*0.16,c,[0.55,0.10,0.05,2.0]);
  }
  /* хохол: длинные плюмажи широкой дугой. Цвет идёт по вееру — передние
     янтарные, средние кобальтовые, задние с фиалковым отливом: на листе
     породы хохол трёхцветный, и именно это делает его хохлом, а не гребнем. */
  for(let i=0;i<CREST_N;i++){
    const q=crestQuill(i);
    const s=q.s;
    let c=vLerp(BIRD_C.amber,BIRD_C.blue,smooth(0.05,0.50,s));
    c=vLerp(c,BIRD_C.viol,smooth(0.55,1.0,s)*0.75);
    c=vLerp(c,BIRD_C.blueL,Math.abs(q.k)*0.22);
    feaPush(out,q.base,q.dir,normalAt(0.96,Math.PI*1.5),q.len,q.len*0.22,
      c,[0.9,0.52+s*0.20,1.0,3.0],(i%3-1)*0.55+((i%2)?0.25:-0.25));
  }
  return new Float32Array(out);
}
/* ── пыль в воздухе ──
   Строится один раз: точки в объёме вокруг птицы, всё движение — в шейдере. */
function buildDust(n){
  const R=rnd(0x0d51),d=[];
  for(let i=0;i<n;i++){
    const a=R()*TAU,r=0.5+R()*2.4;
    d.push(Math.cos(a)*r,0.1+R()*2.3,Math.sin(a)*r-0.2,R());
  }
  return new Float32Array(d);
}
