/* ══════════════ облака: поле шума в перспективе, а не гроздь эллипсов ══════════════ */
/* Старые облака были набором радиальных градиентов: каждый сгусток читался
   отдельной наклейкой, все они висели на одной высоте и двигались с одной
   скоростью. Небо от этого оставалось задником.

   Здесь другое устройство, и оно ближе к тому, как небо устроено на самом деле:

   1. Один раз на планету печётся бесшовный тайл поля плотности (`tfbm`, как
      `planetMat` и `nebula`). Порог по плотности даёт кромку облака, мягкий
      порог — рыхлый край. Освещение печётся в тот же тайл: плотность сравнивается
      с плотностью на шаг в сторону светила, и грань, обращённая к светилу,
      светлеет. Это подделка нормали, но в кадре она неотличима от расчёта.
   2. Слой рисуется не одной картинкой, а полосами по глубине. Дальняя полоса
      мельче и бледнее ближней, полосы сгущаются к горизонту — облака сходятся
      вдаль, как им и положено. Это и есть разница между «небом» и «текстурой,
      натянутой поперёк экрана».
   3. Слоёв три, у каждого своя высота, скорость и параллакс: перистые наверху
      почти неподвижны, кучевые в середине идут заметно, рваные низкие бегут
      быстрее всех и появляются только к непогоде.

   Стоимость: три тайла 256×256 при заходе на планету, в кадре — тридцать
   заливок паттерном. Ничего покадрово не считается. */

const CLOUD_S=256;
/* характер неба по типу мира: cov — покрытие (чем выше, тем ниже порог),
   soft — рыхлость кромки, tint — насколько облако забирает цвет неба */
const CLOUD_TPL={
  terran:  {cov:.38,soft:.26,tint:.30},
  ocean:   {cov:.52,soft:.30,tint:.34},
  desert:  {cov:.16,soft:.20,tint:.42},
  ice:     {cov:.46,soft:.36,tint:.26},
  volcanic:{cov:.34,soft:.24,tint:.50},
  toxic:   {cov:.48,soft:.32,tint:.46},
  rocky:   {cov:.12,soft:.22,tint:.36},
  gas:     {cov:.62,soft:.40,tint:.40}
};
/* слои: y — доля высоты неба, где слой начинается; sc — размер тайла на экране;
   par — параллакс по камере; spd — собственный снос; a — громкость */
/* stretch умножается на решётку тайла, и произведение обязано быть целым —
   иначе горизонтальная бесшовность ломается и по небу идёт вертикальный шов */
const CLOUD_LAYERS=[
  {kind:"cirrus", sc:1.3,sq:.40,par:.03,spd:.010,a:.40,oct:4,stretch:3.5,lo:-.10},
  {kind:"cumulus",sc:2.3,sq:.55,par:.09,spd:.026,a:.80,oct:5,stretch:1.5,lo:.02},
  {kind:"scud",   sc:3.2,sq:.42,par:.20,spd:.060,a:.55,oct:4,stretch:2,  lo:.16}
];

/* ── выпечка тайла ── */
function cloudTile(p,L,i){
  const T=CLOUD_TPL[p.type]||CLOUD_TPL.terran;
  const S=CLOUD_S,cn=document.createElement("canvas");cn.width=cn.height=S;
  const c=cn.getContext("2d"),img=c.createImageData(S,S),d=img.data;
  const sd=(p.seed^(0x0C10D+i*7919))>>>0;
  const sun=starRGB(), amb=p.T.sky[1];
  /* перистые режутся тоньше и покрывают меньше — иначе три одинаковых слоя
     складываются в кашу и небо становится молочным */
  const cov=T.cov*(L.kind==="cirrus"?.62:L.kind==="scud"?.5:1);
  /* решётка крупная: на мелкой поле читается зерном, а не облаком. Форма
     облака должна быть больше самого облака — тогда края рвутся, а не шумят */
  const LT=L.kind==="cirrus"?4:3;
  const F=(u,v)=>tfbm(u*L.stretch,v,LT,sd,L.oct);
  /* Поле считаем один раз в массив, и порог берём не числом, а квантилью по
     самому полю. Порог числом означал, что покрытие зависит от seed: у одной
     планеты небо затянуто, у соседней той же породы — ни облака, и оба раза
     это случайность, а не замысел. По квантили покрытие ровно такое, какое
     заказано таблицей. */
  const f=new Float32Array(S*S);
  const HB=256, hist=new Uint32Array(HB);
  let mn=1e9,mx=-1e9;
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){
    const v=F(x/S,y/S);f[y*S+x]=v;
    if(v<mn)mn=v;if(v>mx)mx=v;
  }
  const span=Math.max(1e-6,mx-mn);
  for(let k=0;k<f.length;k++)hist[Math.min(HB-1,Math.floor((f[k]-mn)/span*HB))]++;
  let need=f.length*cov, acc=0, bin=HB-1;
  while(bin>0&&acc+hist[bin]<need){acc+=hist[bin];bin--;}
  const thr=mn+span*(bin/HB);
  const soft=T.soft*(L.kind==="cirrus"?.55:1)*span*.45;
  /* шаг к светилу: солнце в кадре справа сверху (SUN_DIR), значит грань,
     смотрящая вправо-вверх, освещена. Соседа берём из того же массива
     с заворотом — считать шум второй раз незачем */
  const SD=Math.max(1,Math.round(S*.035));
  const ddx=Math.round(SUN_DIR.x*SD), ddy=Math.round(SUN_DIR.y*SD);
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){
    const o=(y*S+x)*4;
    const fv=f[y*S+x];
    const fs=f[(((y+ddy)%S+S)%S)*S+(((x+ddx)%S+S)%S)];
    let a=(fv-thr)/Math.max(.001,soft);
    if(a<=0){d[o+3]=0;continue;}
    a=clamp(a,0,1);
    a=a*a*(3-2*a);
    /* освещение: плотность на шаг к светилу меньше нашей — значит мы на
       обращённой к нему грани, и нас надо высветлить */
    const lit=clamp(.5+(fv-fs)/span*4.6,0,1);
    /* и глубина: в толще облака свет не проходит, поэтому ядро темнее кромки
       снизу и светлее сверху — одного «lit» мало, он даёт плоскую фольгу */
    const core=clamp((fv-thr)/Math.max(.001,soft*2.2),0,1);
    const litC=[0,1,2].map(j=>lerp(255,sun[j],.22));
    const shC=[0,1,2].map(j=>lerp(lerp(255,amb[j],.55),amb[j],.45));
    const R=[0,1,2].map(j=>clamp(lerp(shC[j],litC[j],lit*(1-core*.45)+.12),0,255));
    d[o]=R[0];d[o+1]=R[1];d[o+2]=R[2];
    d[o+3]=clamp(a*255*(1-core*.10),0,255);
  }
  c.putImageData(img,0,0);
  return cn;
}
function cloudsOf(p){
  if(p.clouds)return p.clouds;
  p.clouds=CLOUD_LAYERS.map((L,i)=>({L,pat:ctx.createPattern(cloudTile(p,L,i),"repeat")}));
  return p.clouds;
}

/* ── отрисовка ── */
/* Полосы по глубине: шаг геометрический, поэтому у горизонта они сами собой
   сгущаются. y полосы выводится из глубины, а не наоборот — так перспектива
   получается одной формулой и не разъезжается при смене высоты камеры. */
function drawClouds(p,camx,camy){
  if(p.T.atm==="отсутствует")return;
  const layers=cloudsOf(p);
  const wp=weatherPower(p);
  const yH=H*.56-camy*.03;                  // горизонт облачного слоя
  /* Слой рисуется одной заливкой, а не полосами по глубине. Полосы честнее
     считали перспективу, но каждая полоса — свой масштаб тайла и своя
     прозрачность, и стыки читались прямоугольниками поперёк неба: подделка
     видна, а ради чего — непонятно. Перспективу теперь несут сами слои:
     перистые мелкие, высокие и почти неподвижные, кучевые крупнее и заметно
     идут, рваные низкие крупные и быстрые. Плюс сжатие по вертикали — облако
     смотрится снизу, а не сверху. */
  ctx.save();
  for(let li=0;li<layers.length;li++){
    const L=layers[li].L, pat=layers[li].pat;
    /* низкие рваные приходят с непогодой и уходят с ней: в ясный день их
       не должно быть вовсе, иначе погода перестаёт читаться по небу */
    const vol=L.a*(L.kind==="scud"?clamp(wp*1.6-.15,0,1):lerp(1,1.25,wp));
    if(vol<=.02)continue;
    const yT=-60+H*L.lo;
    const s=L.sc*3.4, sq=L.sq;
    const ox=(camx*L.par+G.t*L.spd*260)/s;
    const oy=(camy*L.par*.4+yT*0)/(s*sq);
    ctx.globalAlpha=vol;
    ctx.save();
    ctx.translate(-ox*s,-oy*s*sq);
    ctx.scale(s,s*sq);
    ctx.fillStyle=pat;
    ctx.fillRect((ox*s-4)/s,(yT+oy*s*sq)/(s*sq),(W+8)/s,(yH-yT+4)/(s*sq));
    ctx.restore();
  }
  ctx.globalAlpha=1;
  ctx.restore();
  /* дымка у самого горизонта: облака не обрываются линией, а тонут в воздухе */
  const amb=p.T.sky[1];
  const hg=ctx.createLinearGradient(0,yH-H*.16,0,yH+2);
  hg.addColorStop(0,"rgba("+amb.join(",")+",0)");
  hg.addColorStop(1,"rgba("+amb.join(",")+",.55)");
  ctx.fillStyle=hg;ctx.fillRect(0,yH-H*.16,W,H*.16+2);
}
