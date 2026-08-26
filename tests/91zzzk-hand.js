/* ══════════════ автотесты: посёлок под рукой (M198) ══════════════ */
function handTestSettle(){
  resetWorld();
  G.settle={};G.record=null;G.log=[];
  /* планета, где есть кому жить */
  let F=null;
  for(let dx=-8;dx<=8&&!F;dx++)for(let dy=-8;dy<=8&&!F;dy++){
    if(!starAt(dx,dy))continue;
    const s=getSystem(dx,dy);
    for(const p of s.planets)if(settleCanLive(p)&&!F)F={s,p};
  }
  if(!F)return null;
  G.sx=F.s.sx;G.sy=F.s.sy;G.sys=F.s;
  const S=settleMake(F.p);
  S.name=F.p.name;
  return S;
}
TEST_SUITES.push(()=>suite("посёлок: под руку берут со второй ступени и навсегда",()=>{
  const S=handTestSettle();
  ok(!!S,"посёлок есть");
  ok(!settleMine(S),"по умолчанию он свой собственный");
  ok(!settleCanHand(S),"на первой ступени брать нечего");
  ok(!settleTakeHand(S),"и кнопка не сработает");
  S.stage=2;
  ok(settleCanHand(S),"со второй ступени — можно");
  ok(settleTakeHand(S),"взят");
  ok(settleMine(S),"и теперь он под рукой");
  ok(recordAll().e.some(x=>/взят под руку/.test(x.s)),"запись в книжке");
  ok(!settleCanHand(S),"дважды не берут");
  ok(!settleTakeHand(S),"обратного хода нет и повтора тоже");
  /* и ни одного слова оценки нигде */
  const said=(G.log||[]).map(x=>x.text||x.s||"").join(" ");
  ok(!/нельзя|плохо|жаль|потеря|ошибк/i.test(said),"игра не оценивает: "+said.slice(0,70));
}));
TEST_SUITES.push(()=>suite("посёлок: под рукой всё лучше по цифрам и беднее на слух",()=>{
  const S=handTestSettle();
  S.stage=2;
  /* речь до: глифы или понятые слова */
  const before=settleLine(S,1);
  ok(before.length>0,"пиджин звучит: "+before);
  const glyphy=[...before].some(ch=>SETTLE_GLYPH.indexOf(ch)>=0);
  /* берём под руку */
  settleTakeHand(S);
  const after=settleLine(S,1);
  ok(HAND_LINE.some(l=>after.indexOf(l)===0),"под рукой отвечают служебным: "+after);
  ok(![...after].some(ch=>SETTLE_GLYPH.indexOf(ch)>=0),"и ни одного глифа");
  if(glyphy)ok(after!==before,"речь и правда сменилась");
  /* амбар больше */
  G.cargo.iron=3000;
  const n=settleGive(S,"iron",2000);
  ok(n>SETTLE_STOCK,"амбар под рукой вместительнее ("+n+" при обычных "+SETTLE_STOCK+")");
  /* растёт быстрее: та же еда даёт больше построек */
  const A=handTestSettle();A.stage=2;A.diet={iron:400};A.fed=SETTLE_STEP*3;
  const B=handTestSettle();B.stage=2;B.diet={iron:400};B.fed=SETTLE_STEP*3;
  B.mine=1;
  A.last=Date.now()-1;B.last=Date.now()-1;
  settleTick(A);settleTick(B);
  ok(B.built.length>A.built.length,
     "под рукой построек больше на ту же еду ("+B.built.length+" против "+A.built.length+")");
  /* и выбор перестал быть своим: он повторяем */
  const C=handTestSettle();C.stage=2;C.mine=1;C.diet={iron:900,ice:10};
  eq(settleHandPick(C),"kiln","под рукой поднимают то, чем кормили больше всего");
  const D=handTestSettle();D.stage=2;D.mine=1;D.diet={iron:900,ice:10};
  eq(settleHandPick(D),settleHandPick(C),"и у второго посёлка выйдет то же самое");
}));
TEST_SUITES.push(()=>suite("посёлок: улица под рукой становится прямой",()=>{
  const S=handTestSettle();
  S.stage=2;S.built=["kiln","field","cut","weir"];
  const F=(function(){for(const p of G.sys.planets)if(settleCanLive(p))return p;return null;})();
  const tr=genTerrain(F,null);
  const free=settlePlan(S,tr,F);
  ok(!!free,"улица посчитана");
  const backFree=free.yards.filter(y=>y.back).length;
  const kFree=new Set(free.yards.map(y=>Math.round(y.k*100))).size;
  ok(backFree>0,"у своего посёлка есть дальний ряд");
  ok(kFree>1,"и дворы разного роста");
  S._plan=null;S.mine=1;
  const hand=settlePlan(S,tr,F);
  eq(hand.yards.filter(y=>y.back).length,0,"под рукой дальнего ряда нет");
  eq(new Set(hand.yards.map(y=>Math.round(y.k*100))).size,1,"и все дворы в один рост");
  /* шаг мерится ОТ КРАЯ ДО КРАЯ: расстояние между серединами гуляет само собой,
     потому что дворы разной ширины, и мерить надо просвет */
  const gaps=hand.yards.map((y,i,a)=>i?Math.round((y.wx-y.w/2)-(a[i-1].wx+a[i-1].w/2)):0).slice(1);
  eq(new Set(gaps).size,1,"просвет между дворами всюду один: "+gaps.join(","));
  ok(hand.yards.every(y=>y.lift===0),"никто не поднят по склону");
  /* и посёлок остаётся на месте: улица другая, а место то же */
  eq(Math.round(hand.bx),Math.round(free.bx),"место не переехало");
}));
TEST_SUITES.push(()=>suite("посёлок: решение переживает сохранение",()=>{
  const S=handTestSettle();
  S.stage=2;settleTakeHand(S);
  const key=settleKeyOf(G.sx,G.sy);
  const snap=snapshot();
  G.settle={};
  applySave(JSON.parse(JSON.stringify(snap)));
  const S2=settleMap()[key];
  ok(!!S2,"посёлок на месте");
  ok(settleMine(S2),"и он по-прежнему под рукой");
}));
