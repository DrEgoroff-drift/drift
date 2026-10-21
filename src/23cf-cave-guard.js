/* ══════════════ пещера без озера: глаз не NaN (Контроль, 15.10) ══════════════
   M630e (22d cave3DiveFrame) берёт опуск глаза на нырке от высоты воды M.dvY; в пещере без озера её
   нет, drop выходит NaN, а cave3Lens умножает его на долю нырка: NaN·0 = NaN — глаз, матрица и весь
   кадр пещеры пустые (стенд: пусто 100 %, до M630e — 50 %). Файл 22d — planet-сеанса, поэтому здесь
   обёртка; когда строка поправится у них, обёртка ничего не делает и снимается. */
const CAVE_OLD_DIVE=cave3DiveFrame;
cave3DiveFrame=function(floorY,wy,k,asp){
  const r=CAVE_OLD_DIVE(floorY,wy,k,asp);
  if(!isFinite(r.drop))r.drop=CAVE3_LENS.dvDrop;
  return r;
};
