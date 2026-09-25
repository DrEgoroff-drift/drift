/* ══════════════ GPU-холст, v2: текст (docs/DESIGN-gpu.md, «GPU canvas») ══════════════
   fillText/strokeText/measureText с метриками 2D. Источник глифов сменный (GC_GLYPHS) — выбор
   автора: а) 2D-канва для растра строк (сейчас), б) свой шрифт; атлас не знает, откуда маска.
   Строка растрится целиком — кернинг и лигатуры как у 2D — в итоговых пикселях: с линейной
   частью преобразования (поворот, масштаб — их Skia кладёт на контур, как у 2D) и дробью
   позиции. Маска ложится пиксель в пиксель, в холст ss×ss — блоками ss×ss, и после сжатия
   это ровно тот растр: ни растяжения атласа, ни мыла. Растр ×ss выходил тоньше (жирность
   −8…−22 %: контраст мелкого кегля Skia даёт только в родном размере). Растр — в цвете
   краски: Skia правит контраст маски по яркости цвета (у градиента — по среднему его точек),
   и маска, снятая белым, у голубого текста была на 7–11 % жирнее. */
const GC_SHADOW_INK="rgb(80,80,80)";
const GC_TXT_KEYS=["font","textAlign","textBaseline","direction","letterSpacing","wordSpacing","fontKerning"];
const GC_TM=["width","actualBoundingBoxLeft","actualBoundingBoxRight","actualBoundingBoxAscent","actualBoundingBoxDescent",
  "fontBoundingBoxAscent","fontBoundingBoxDescent","emHeightAscent","emHeightDescent","hangingBaseline","alphabeticBaseline","ideographicBaseline"];

/* источник глифов а): одна 2D-канва на всю игру, только растр строк и мерка */
const GC_GLYPHS={
  cv:null,x:null,mc:new Map(),n:0,
  _c(){if(!this.x){if(typeof document==="undefined")throw gcNo("источник глифов (нет document)");
      this.cv=document.createElement("canvas");this.cv.width=this.cv.height=64;this.x=this.cv.getContext("2d",{willReadFrequently:true});}
    return this.x;},
  /* шрифт без px 2D молча пропустил бы — здесь громко */
  _set(x,st){if(!/\d*\.?\d+px/.test(st.font))throw gcNo("шрифт без px «"+st.font+"»");
    x.font=st.font;x.textAlign=st.textAlign;x.textBaseline=st.textBaseline;x.direction=st.direction;
    x.letterSpacing=st.letterSpacing;x.wordSpacing=st.wordSpacing;x.fontKerning=st.fontKerning;},
  /* метрики как у 2D — это они и есть; в кэше неизменяемая копия */
  measure(st,t){const key=GC_TXT_KEYS.map(q=>st[q]).join("|")+"|"+t;let r=this.mc.get(key);if(r)return r;
    const x=this._c();this._set(x,st);const m=x.measureText(t);r={};for(const q of GC_TM)r[q]=m[q];
    if(this.mc.size>2048)this.mc.clear();this.mc.set(key,Object.freeze(r));return r;},
  /* маска строки в px итога: M — линейная часть преобразования (px итога на единицу),
     якорь — в (ox+fx, oy+fy) */
  raster(st,t,M,fx,fy,sk,mw,col){
    const x=this._c();this._set(x,st);const m=x.measureText(t);let L=m.actualBoundingBoxLeft,R=m.actualBoundingBoxRight;
    if(mw!=null&&m.width>mw){const f=mw/m.width;L*=f;R*=f;}
    const pl=sk?sk.lw/2*(sk.join==="miter"?Math.max(1,sk.ml):1):0,A=m.actualBoundingBoxAscent+pl,Dn=m.actualBoundingBoxDescent+pl;
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
    for(const [u,v] of [[-L-pl,-A],[R+pl,-A],[R+pl,Dn],[-L-pl,Dn]]){const X=M[0]*u+M[2]*v,Y=M[1]*u+M[3]*v;
      x0=Math.min(x0,X);x1=Math.max(x1,X);y0=Math.min(y0,Y);y1=Math.max(y1,Y);}
    const ox=Math.ceil(-x0)+2,oy=Math.ceil(-y0)+2,w=ox+Math.ceil(x1)+3,h=oy+Math.ceil(y1)+3;
    if(!(w>0&&h>0)||w>8192||h>8192)throw gcNo("строка крупнее 8192 px");
    if(this.cv.width<w||this.cv.height<h){this.cv.width=Math.max(this.cv.width,w);this.cv.height=Math.max(this.cv.height,h);this._set(x,st);}
    x.setTransform(1,0,0,1,0,0);x.globalAlpha=1;x.globalCompositeOperation="source-over";x.clearRect(0,0,w,h);
    x.setTransform(M[0],M[1],M[2],M[3],ox+fx,oy+fy);x.fillStyle=x.strokeStyle=col;
    if(sk){x.lineWidth=sk.lw;x.lineJoin=sk.join;x.miterLimit=sk.ml;x.lineCap=sk.cap;x.setLineDash(sk.dash);x.lineDashOffset=sk.off;
      x.strokeText(t,0,0,mw);x.setLineDash([]);}
    else x.fillText(t,0,0,mw);
    x.setTransform(1,0,0,1,0,0);
    const D=x.getImageData(0,0,w,h).data,a=new Uint8Array(w*h);for(let i=0;i<a.length;i++)a[i]=D[i*4+3];
    this.n++;return {w,h,ox,oy,a};}
};

/* атлас масок: страницы r8 1024², полки через пиксель; крупная строка — своя страница.
   Маски нужны только на время выпечки (готовая выпечка их не держит), так что переполнение —
   просто сброс; смена устройства — тоже */
const GC_ATL={dev:null,pages:[],map:new Map(),up:0,gen:0};   /* gen — поколение страниц: растёт, когда они уходят в мусор */
function gcAtlas(key,mk){
  const A=GC_ATL,d=GPU.dev,U=GPUTextureUsage;
  if(A.dev!==d){A.dev=d;A.pages=[];A.map.clear();A.gen++;}
  let e=A.map.get(key);if(e)return e;
  const r=mk(),page=(W,H)=>{const p={tex:d.createTexture({size:[W,H],format:"r8unorm",usage:U.TEXTURE_BINDING|U.COPY_DST}),W,H,x:0,y:0,rh:0};
    p.view=p.tex.createView();return p;};
  let pg=A.pages[A.pages.length-1];
  const fit=p=>{if(p.x+r.w>p.W){p.x=0;p.y+=p.rh+1;p.rh=0;}return p.y+r.h<=p.H;};
  if(r.w>1024||r.h>1024||!pg||pg.big||!fit(pg)){
    if(A.pages.length>=6){for(const p of A.pages)GPU.trash.push(p.tex);A.pages=[];A.map.clear();A.gen++;}
    pg=r.w>1024||r.h>1024?Object.assign(page(r.w,r.h),{big:1}):page(1024,1024);A.pages.push(pg);}
  const x=pg.x,y=pg.y;pg.x+=r.w+1;pg.rh=Math.max(pg.rh,r.h);
  d.queue.writeTexture({texture:pg.tex,origin:[x,y]},r.a,{bytesPerRow:r.w},[r.w,r.h]);A.up++;
  e={view:pg.view,W:pg.W,H:pg.H,x,y,w:r.w,h:r.h,ox:r.ox,oy:r.oy};A.map.set(key,e);return e;
}

/* мерка строки без выпечки — печке нужен размер холста до рисования */
function gcMeasure(font,t){return GC_GLYPHS.measure(Object.assign({},GC_DEF,{font}),String(t));}

Object.assign(GcCtx.prototype,{
  measureText(t){return GC_GLYPHS.measure(this,String(t));},
  fillText(t,x,y,mw){this._text(String(t),x,y,mw,null);},
  strokeText(t,x,y,mw){this._text(String(t),x,y,mw,{lw:this._lw,join:this.lineJoin,ml:this._ml,cap:this.lineCap,dash:this._dash,off:this.lineDashOffset});},
  /* строка → четырёхугольник маски в пикселях выпечки; краска — как у заливки (цвет или градиент) */
  _text(t,x,y,mw,sk){
    if(!t||!isFinite(x)||!isFinite(y)||mw!==undefined&&!(mw>0))return;   /* как 2D: maxWidth ≤ 0 или NaN — ничего */
    const op=this.globalCompositeOperation;this._chk(op);
    if(!GPU.dev)throw gcNo("текст без видеокарты");
    const p=this._paint(sk?this.strokeStyle:this.fillStyle,1);if(!p)return;
    const m=this._m,k=this._k,ax=(m[0]*x+m[2]*y+m[4])*k,ay=(m[1]*x+m[3]*y+m[5])*k;
    if(!(Math.abs(m[0]*m[3]-m[1]*m[2])>1e-12))return;
    /* якорь — в px итога; растр берёт его дробь (точно: 1/16 давала Δ 62 на моноширинном) и линейную часть преобразования */
    const fa=ax/k,fb=ay/k,fx=fa-Math.floor(fa),fy=fb-Math.floor(fb),st=this;
    const M=[m[0],m[1],m[2],m[3]].map(v=>Math.round(v*1e6)/1e6);
    /* цвет растра — яркость для контраста Skia: сплошная краска — её цвет, градиент — среднее точек */
    const col=p.k?p.g.s.reduce((a,q)=>a.map((v,i)=>v+q[1][i]/p.g.s.length),[0,0,0]):[0,1,2].map(i=>p.c[3]>0?p.c[i]/p.c[3]:0);
    const pc="rgb("+col.slice(0,3).map(v=>Math.round(v*255)).join(",")+")";
    const base=GC_TXT_KEYS.map(q=>st[q]).join("|")+"|"+M+"|"+fx+"|"+fy+"|"+mw+"|"+(sk?[sk.lw,sk.join,sk.ml,sk.cap,sk.dash.join(","),sk.off].join(","):"")+"|"+t;
    const quad=c=>{const e=gcAtlas(base+"|"+c,()=>GC_GLYPHS.raster(st,t,M,fx,fy,sk,mw,c));
      const T=[[0,0],[e.w,0],[e.w,e.h],[0,e.h]],X=Math.floor(fa)-e.ox,Y=Math.floor(fb)-e.oy,v=[];
      for(const i of [0,1,2,0,2,3])v.push((X+T[i][0])*k,(Y+T[i][1])*k,(e.x+T[i][0])/e.W,(e.y+T[i][1])/e.H);return [v,e.view];};
    const [v,view]=quad(pc),sh=this._sh(op);
    /* тень текста Skia строит из маски без контраста по цвету: по массе это растр цвета #505050
       (замер 25.09: 8, 11, 18 px — ±0.5 %); цветная маска давала ореолу неона +5…7 % света */
    const [sv,sview]=sh?quad(GC_SHADOW_INK):[null,null];
    this._ops.push({t:"x",v,view,near:true,p,op,clip:this._clip,sh,sv,sview});}
});
