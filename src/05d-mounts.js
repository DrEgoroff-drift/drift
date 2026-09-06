/* ══════════════ подвесы: размер и повадка (M363, §3.1) ══════════════
   Точки на корпусе уже есть (`slotAnchors`, 05-parts) — до сих пор они
   различались только категорией: сюда орудие, сюда двигательный блок. Теперь у
   каждой ещё две вещи, и они делают корпуса разными НЕ силуэтом.

   Размер — L/M/H. Тяжёлое в лёгкое не встаёт; лёгкое в тяжёлое встаёт всегда,
   и это не подарок: место занято, а числа остались лёгкими. Размер точки
   выводится из массы корпуса и из того, где точка сидит: на законцовке крыла
   подвес всегда на ступень легче, чем в теле.

   Повадка — жёсткая или турель. Жёсткая смотрит по носу: конус вдвое уже, зато
   урон ×1.25 — ствол упирается в набор, а не висит на приводе. Турель ходит в
   своём конусе целиком. Точки на оси корпуса (нос, брюхо) — жёсткие; всё, что
   вынесено вбок, — турели. У сторожевого корпуса (`guard`) жёсткой становится
   и первая крыльевая: он для того и построен.

   Ничего из этого не сохраняется: и размер, и повадка выводятся из корпуса,
   как и сами точки (сквозное правило — не персистить выводимое). */
const MOUNT_SIZES=["L","M","H"];
const MOUNT_SIZE_RU={L:"лёгкий",M:"средний",H:"тяжёлый"};
const MOUNT_KINDS={
  fix:   {ru:"жёсткая", sh:"Ж", cone:.5,  dmg:1.25, note:"смотрит по носу: конус вдвое уже, урон выше"},
  turret:{ru:"турель",  sh:"Т", cone:1,   dmg:1,    note:"ходит в своём конусе целиком"}
};
const MOUNT_CACHE={};
function mountsOf(id){
  if(MOUNT_CACHE[id])return MOUNT_CACHE[id];
  const S=shipData(id),h=hullOf(id),an=slotAnchors(id);
  const guard=(typeof roleOf==="function")&&roleOf(id)&&roleOf(id).id==="guard";
  const mass=S?(S.hull>=180?2:(S.hull>=120?1:0)):1;
  let wing=0;
  const out=an.map(a=>{
    const side=Math.abs(a.y)>h.len*.09;
    let sz=mass;
    if(side)sz=Math.max(0,sz-1);                 /* на выносе подвес легче */
    let kind=side?"turret":"fix";
    if(side&&guard&&wing++===0)kind="fix";        /* сторожевой несёт одну жёсткую на крыле */
    return {i:a.i,kind:a.kind,size:MOUNT_SIZES[sz],mount:kind,x:a.x,y:a.y};
  });
  MOUNT_CACHE[id]=out;
  return out;
}
function mountAt(id,slot){
  const m=mountsOf(id);
  for(const x of m)if(x.i===slot)return x;
  return null;
}
/* ── размер самой части ──
   Выводится из seed и тира: тяжёлые стволы редки и просят тяжёлого подвеса.
   Части не-орудийных категорий размера не имеют — они ставятся в своё гнездо
   и спорить там не с чем. */
function partSize(p){
  /* размер есть только у стволов: пусковая висит в своём единственном
     подвесе, и спорить там не с чем (M112) — размерное правило её не
     касается, иначе тяжёлая пусковая просто переставала ставиться */
  if(!p||p.kind!=="gun")return "L";
  const t=p.tier|0,r=((p.seed>>>11)&255)/255;
  if(t>=4&&r>.35)return "H";
  if(t>=2&&r>.45)return "M";
  return t>=3?"M":"L";
}
function sizeIdx(s){const i=MOUNT_SIZES.indexOf(s);return i<0?0:i;}
/* тяжёлое в лёгкое не встаёт */
function mountTakes(m,p){
  if(!m||!p)return false;
  if(m.kind!==p.kind)return false;
  if(p.kind!=="gun")return true;
  return sizeIdx(partSize(p))<=sizeIdx(m.size);
}
/* почему не встало — одной строкой, на языке игрока */
function mountWhyNot(m,p){
  if(!m)return "на этом корпусе нет такого подвеса";
  if(m.kind!==p.kind)return "не тот подвес: там "+PART_KINDS[m.kind].ru.toLowerCase();
  if(p.kind==="gun"&&sizeIdx(partSize(p))>sizeIdx(m.size))
    return "подвес "+MOUNT_SIZE_RU[m.size]+", а часть "+MOUNT_SIZE_RU[partSize(p)];
  return "";
}
