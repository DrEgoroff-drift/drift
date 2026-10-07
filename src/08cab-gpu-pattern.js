/* ══════════════ Узор на GPU-холсте: createPattern (docs/GPU-PORT-CENSUS.md §2, дыра 2) ══════════════
   Узор — краска kind 3: шейдер заливки (paintOf, 08ca) берёт точку выпечки, обратной матрицей
   переводит её в пространство узора и читает плитку сэмплером с повтором; «repeat-x/-y» и
   «no-repeat» гасят краску за краем плитки по своей оси. Плитка — любой источник gcImg:
   выпечка GPU-холста или 2D-холст (грузится один раз, gpuCanvasTex).
   Узор, что создан настоящим 2D-контекстом (материал грунта 18a печёт плитку в 2D и зовёт
   createPattern у него), непрозрачен, как Path2D, — поэтому createPattern и setTransform
   2D-контекста при загрузке обёрнуты: узор помнит плитку, повтор и матрицу, и GcCtx красит им
   так же, как своим. Текст узором — громко (маска текста и плитка делят одну привязку). */
const GC_REP={"repeat":3,"repeat-x":1,"repeat-y":2,"no-repeat":0};
class GcPat{
  constructor(img,rep){this.img=img;this.rep=rep;this.m=null;}
  setTransform(m){this.m=gcPatM(m);}
}
function gcPatM(m){if(!m)return null;const M=[m.a??m.m11??1,m.b??m.m12??0,m.c??m.m21??0,m.d??m.m22??1,m.e??m.m41??0,m.f??m.m42??0];
  return M.every(isFinite)?M:null;}
function gcRep(r){const k=r==null||r===""?"repeat":String(r);
  if(!(k in GC_REP))throw new SyntaxError("GPU-холст: createPattern повтор «"+k+"»");return GC_REP[k];}
GcCtx.prototype.createPattern=function(img,rep){
  if(!img||!(img.view&&img.tex||img.width&&img.height))throw gcNo("createPattern("+(img&&img.constructor&&img.constructor.name||typeof img)+")");
  return new GcPat(img,gcRep(rep));};
/* узор краски: свой, помеченный 2D-узор или null */
function gcPatOf(s){
  if(s instanceof GcPat)return s;
  if(s&&s._gcImg)return {img:s._gcImg,rep:s._gcRep,m:s._gcM||null};
  return null;}
/* обёртки 2D: узор настоящего контекста помнит, из чего он */
(function(){
  const C2=globalThis.CanvasRenderingContext2D,CP=globalThis.CanvasPattern;
  if(!C2||!C2.prototype.createPattern)return;
  const cp=C2.prototype.createPattern;
  C2.prototype.createPattern=function(img,rep){const p=cp.call(this,img,rep);
    if(p){p._gcImg=img;p._gcRep=GC_REP[rep==null||rep===""?"repeat":rep]??3;}return p;};
  const st=CP&&CP.prototype.setTransform;
  if(st)CP.prototype.setTransform=function(m){st.call(this,m);this._gcM=gcPatM(m);};
})();
/* сэмплер плитки: повтор по обеим осям (края «no-repeat» гасит шейдер) */
function gcRepSmp(nr){const k=nr?"repn":"rep";
  return GPU.S[k]||(GPU.S[k]=GPU.dev.createSampler({addressModeU:"repeat",addressModeV:"repeat",magFilter:nr?"nearest":"linear",minFilter:nr?"nearest":"linear"}));}
