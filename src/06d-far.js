/* ══════════════ дальние залежи: присутствие и тяжёлый хвост удачи (M465, DESIGN-resources §3) ══════════════
   Для каждой системы и каждого из десяти товаров — бросок на СВОЁМ зерне
   (0xFA12): ни одна существующая система, планета или цена не сдвигается.
   Товар появляется только в своей полосе и дальше, только там, где есть его
   место (гигант — заборник, пояс — пояс, лёд и джунгли — пещера…), с
   вероятностью, что растёт через полосу: у начала полосы редкость, через
   десять секторов — обычное дело. Дальше своей полосы товар не исчезает:
   товары фронтира есть везде за фронтиром.

   Богатство — логнормальное exp(N(μ(r),1)): ~70 % бедная («на обратную
   дорогу»), ~25 % хорошая (трюм), ~5 % богатая (×5), ~0.5 % ЖИЛА (×20). Удача
   честная: бросок — мира, его видит прибор (M466), ничего не спрятано.

   Мёртвых звёзд (белых карликов, пульсаров) в игре пока нет, поэтому места
   берутся по заменам и сказано это вслух: магнитная пыль — пояса у горячих
   звёзд (бело-голубая и голубой гигант), тёмное стекло — вулканы и кристаллы
   у старых красных карликов, нейтронная крошка — каменные и металлические
   миры за r=50. Ничего не хранится: залежь — функция зерна; копаное живёт в
   G.mined, как у старых товаров. */
const FAR_SALT=0xFA12;
const FAR_Z=[.524,1.645,2.576];           /* границы сортов по z: 70 / 95 / 99.5 % */
const FAR_GRADE=["бедная","хорошая","богатая","ЖИЛА"];
const FAR_UNITS=[[4,8],[30,50],[150,250],[600,1000]];   /* единиц: от и плюс до */
const FAR_CACHE=new Map();
function farR(sx,sy){return Math.hypot(sx,sy);}
/* вероятность встретить товар на расстоянии r: до полосы — ноль, у её начала
   четверть, через десять секторов — четыре пятых */
function farPresence(band,r){
  if(r<band)return 0;
  return clamp(.25+.55*(r-band)/10,0,.8);
}
/* где в системе стоит место товара: список {kind,i} или пусто */
function farPlaces(sys,k){
  const F=RES[k].far,out=[];
  const hot=sys.cls&&sys.cls.t>=1.4,old=sys.cls&&sys.cls.t<=.5;
  for(const spec of F.place.split(",")){
    const [what,cond]=spec.split(":");
    if(cond==="hot"&&!hot)continue;
    if(cond==="old"&&!old)continue;
    if(what==="belt"){if(sys.belt)out.push({kind:"belt"});continue;}
    if(what==="fauna"){
      /* зверьё водится там же, где флора (21-mode-surface): то же условие */
      (sys.planets||[]).forEach((p,i)=>{
        if(p.T&&((p.T.atm||"").indexOf("пригодна")>=0||p.type==="toxic"||p.type==="jungle"||p.mix==="toxic"||p.mix==="jungle"))
          out.push({kind:"planet",i});});
      continue;
    }
    (sys.planets||[]).forEach((p,i)=>{if(p.type===what)out.push({kind:"planet",i});});
  }
  return out;
}
/* нормальное из двух равномерных (Бокс — Мюллер) */
function farNormal(r){
  const u=Math.max(1e-9,r()),v=r();
  return Math.sqrt(-2*Math.log(u))*Math.cos(TAU*v);
}
function farGradeOf(z){let g=0;while(g<3&&z>=FAR_Z[g])g++;return g;}
/* все дальние залежи системы: [{k,place,z,grade,units}] */
function farDeposits(sx,sy){
  const key=sx+","+sy;
  if(FAR_CACHE.has(key))return FAR_CACHE.get(key);
  const sys=getSystem(sx,sy),R=farR(sx,sy),out=[];
  FAR_KEYS.forEach((k,ki)=>{
    const r=rng((hashi(sx,sy,FAR_SALT)^(ki*0x9E3779B1))>>>0);
    const p=farPresence(RES[k].far.band,R),roll=r();
    if(roll>=p)return;
    const places=farPlaces(sys,k);
    if(!places.length)return;
    const place=places[Math.floor(r()*places.length)];
    /* медиана растёт с расстоянием медленно: даль платит чуть щедрее */
    const z=farNormal(r)+.006*clamp(R-RES[k].far.band,0,25);   /* не больше +0.15: хвост держит доли §3 */
    const g=farGradeOf(z),lo=g?FAR_Z[g-1]:-3,hi=g<3?FAR_Z[g]:4;
    const u=clamp((z-lo)/(hi-lo),0,1),U=FAR_UNITS[g];
    out.push({k,place,z,grade:g,units:Math.round(U[0]+U[1]*u)});
  });
  if(FAR_CACHE.size>2000)FAR_CACHE.clear();
  FAR_CACHE.set(key,out);
  return out;
}
function farGradeRu(g){return FAR_GRADE[g]||"";}
