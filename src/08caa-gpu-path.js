/* ══════════════ Path2D, что помнит себя — для GPU-холста (docs/GPU-PORT-CENSUS.md §2, дыра 1) ══════════════
   Настоящий Path2D непрозрачен: 2D-контекст читает его изнутри Skia, а GcCtx — нет. Шестнадцать
   модулей строят силуэт в Path2D один раз и заливают/обводят/клипают его по нескольку раз.
   Поэтому Path2D подменяется при загрузке наследником, что сам по-прежнему настоящий Path2D
   (2D-контекст его рисует как раньше), но ещё и пишет свои команды плоским массивом:
   код команды, затем её аргументы как есть. GcCtx проигрывает запись через свой же путь и
   триангулятор (gcPathSp) — с тем преобразованием, что действует в момент fill/stroke/clip,
   как у 2D. Развёрнутый путь кэшируется на самом Path2D по (матрица, масштаб выпечки, длина
   записи): заливка и обводка одного силуэта разворачивают его один раз.
   Path2D из строки SVG не пишется — такой путь на GPU-холсте громко падает. */
const GC_P2D=globalThis.Path2D||null;
/* команды записи: имя, код, число аргументов (addPath — отдельно, у него снимок чужой записи) */
const GC_PCMD=[["moveTo",0,2],["lineTo",1,2],["closePath",2,0],["quadraticCurveTo",3,4],["bezierCurveTo",4,6],
  ["arc",5,6],["arcTo",6,5],["ellipse",7,8],["rect",8,4],["roundRect",9,5]];
class GcPath2D extends (GC_P2D||Object){
  constructor(p){
    if(p===undefined)super();else super(p);
    this._r=[];this._s=[];this._c=null;this._svg=false;
    if(p instanceof GcPath2D){this._r=p._r.slice();this._s=p._s.slice();this._svg=p._svg;}
    else if(p!==undefined)this._svg=true;}
  /* addPath: снимок записи на момент вызова (как у 2D — позже правки чужого пути сюда не доходят) */
  addPath(p,m){
    if(GC_P2D&&GC_P2D.prototype.addPath)super.addPath(p,m);
    if(!(p instanceof GcPath2D)||p._svg){this._svg=true;return;}
    const M=m?[m.a??m.m11??1,m.b??m.m12??0,m.c??m.m21??0,m.d??m.m22??1,m.e??m.m41??0,m.f??m.m42??0]:[1,0,0,1,0,0];
    this._s.push({r:p._r.slice(),s:p._s.slice(),m:M});this._r.push(10,this._s.length-1);}
}
for(const [k,op,n] of GC_PCMD){
  const f=GC_P2D&&GC_P2D.prototype[k];
  GcPath2D.prototype[k]=f?function(){f.apply(this,arguments);const r=this._r;r.push(op);for(let i=0;i<n;i++)r.push(arguments[i]);}
    :function(){const r=this._r;r.push(op);for(let i=0;i<n;i++)r.push(arguments[i]);};}
if(GC_P2D)globalThis.Path2D=GcPath2D;

/* проигрыш записи в GcCtx: команды идут в g._sp через его же moveTo/lineTo/…; addPath — со своей матрицей */
function gcReplay(g,r,s){
  for(let i=0,n=r.length;i<n;){
    switch(r[i]){
      case 0:g.moveTo(r[i+1],r[i+2]);i+=3;break;
      case 1:g.lineTo(r[i+1],r[i+2]);i+=3;break;
      case 2:g.closePath();i+=1;break;
      case 3:g.quadraticCurveTo(r[i+1],r[i+2],r[i+3],r[i+4]);i+=5;break;
      case 4:g.bezierCurveTo(r[i+1],r[i+2],r[i+3],r[i+4],r[i+5],r[i+6]);i+=7;break;
      case 5:g.arc(r[i+1],r[i+2],r[i+3],r[i+4],r[i+5],!!r[i+6]);i+=7;break;
      case 6:g.arcTo(r[i+1],r[i+2],r[i+3],r[i+4],r[i+5]);i+=6;break;
      case 7:g.ellipse(r[i+1],r[i+2],r[i+3],r[i+4],r[i+5],r[i+6],r[i+7],!!r[i+8]);i+=9;break;
      case 8:g.rect(r[i+1],r[i+2],r[i+3],r[i+4]);i+=5;break;
      case 9:g.roundRect(r[i+1],r[i+2],r[i+3],r[i+4],r[i+5]);i+=6;break;
      case 10:{const e=s[r[i+1]],M=e.m,sv=g._m;g.transform(M[0],M[1],M[2],M[3],M[4],M[5]);gcReplay(g,e.r,e.s);g._m=sv;i+=2;break;}
      default:throw gcNo("Path2D: команда "+r[i]);}}}
/* путь из Path2D в подпути GcCtx (в пикселях выпечки); текущий путь холста не трогается */
function gcPathSp(g,P){
  if(!(P instanceof GcPath2D))throw gcNo("fill/stroke/clip(не записанный Path2D)");
  if(P._svg)throw gcNo("Path2D из SVG");
  const c=P._c,m=g._m,L=P._r.length;
  if(c&&c.n===L&&c.k===g._k&&c.m0===m[0]&&c.m1===m[1]&&c.m2===m[2]&&c.m3===m[3]&&c.m4===m[4]&&c.m5===m[5])return c.sp;
  const sv=g._sp;g._sp=[];
  try{gcReplay(g,P._r,P._s);}catch(x){g._m=m;g._sp=sv;throw x;}
  const sp=g._sp;g._sp=sv;
  if(c){c.n=L;c.k=g._k;c.m0=m[0];c.m1=m[1];c.m2=m[2];c.m3=m[3];c.m4=m[4];c.m5=m[5];c.sp=sp;}
  else P._c={n:L,k:g._k,m0:m[0],m1:m[1],m2:m[2],m3:m[3],m4:m[4],m5:m[5],sp};
  return sp;}
