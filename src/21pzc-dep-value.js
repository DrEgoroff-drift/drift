/* ══════════════ дорогая жила — находка (M904d · DESIGN-game §4.1a) ══════════════
   Замер экономики (M903) показал: круг добычи платит втрое против модели, и деньги дают не
   объём, а дорогая руда — у яруса T1 кристаллы и иридий были 29 000 из 46 000 в час. Причина в
   залежах: 22 на полосу, и тип берётся из профиля планеты поровну, так что кристалл на
   вулканической планете лежал так же густо, как железо. Поверхность — для железа и кремния;
   за дорогим идут вглубь (23-mode-dig: ярусы глубины), а дорогая жила наверху — удача часа.

   ПРАВИЛА ФАЙЛА:
   1. Чем дороже руда, тем реже жила: свежая залежь дорогой руды остаётся собой с весом
      DEP_REF/цена (кремний и дешевле — всегда), иначе это самая дешёвая руда того же профиля.
      Кристалл — одна залежь из шести, иридий — из четырёх, титан — почти через раз.
   2. Решает зерно залежи (система, планета, номер), не rnd: перезаход видит то же самое.
   3. Тип решается и для выбранной залежи: генератор рождает её прежней, и без повтора она
      «дорожала» бы второй посадкой. Остаток (G.mined) не трогается.
   4. Генератор (21-mode-surface) и шахта (23-mode-dig) не тронуты: обёртка поверх входа на
      грунт, после 21pih и 21pzb — до первого кадра, который рисует залежи (21pi). */
const DEP_REF=17;
function depValueF(k){
  const p=RES[k]&&RES[k].price;
  return p>0?Math.min(1,DEP_REF/p):1;
}
function depCheap(S){
  const prof=(S.p&&(S.p.res||PROFILE[S.p.type]))||[];
  let best=null;
  for(const k of prof)if(RES[k]&&RES[k].price>0&&(!best||RES[k].price<RES[best].price))best=k;
  return best;
}
function depValue(S){
  if(!S||!Array.isArray(S.deposits)||!S.p)return 0;
  const cheap=depCheap(S);
  if(!cheap)return 0;
  let n=0;
  for(const d of S.deposits){
    const f=depValueF(d.res);if(f>=1||d.res===cheap)continue;
    const r=rng(hashi(G.sx|0,G.sy|0,0xDE9+(S.p.idx|0)*97+((d.i|0)*7919)));
    if(r()>=f){d.res=cheap;n++;}
  }
  return n;
}
const DEP_VALUE_OLD_ENTER=enterSurface;
enterSurface=function(){
  const r=DEP_VALUE_OLD_ENTER.apply(this,arguments);
  if(G.mode==="surface")depValue(G.surf);
  return r;
};
