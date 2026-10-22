/* ══════════════ шахта: запись выработки и земля над ней (M631, docs/DESIGN-mine.md «No 2D») ══════════════
   Что пережило плоский кадр рудника (23a-dig-draw, 23aa-dig-rock — сняты 22.10, автор: «от 2D
   избавляться»): запись выкопанного на планете (её читают 21-mode-surface, 23-mode-dig, 23cc) и кривая
   земли с дёрном — их рисует движок (23ca). Имена прежние. Стоит до 23-mode-dig по порядку склейки:
   23cc оборачивает mineSave/mineLoad при загрузке, 23ca читает DIG_TURF/DIG_SUB. */
/* ── шахта остаётся выкопанной ──
   Ствол осыпался, стоило подняться на поверхность: спустился второй раз — снова
   целая порода. Это врало о мире: копали-то по-настоящему, руда из ячейки
   уходила в трюм насовсем. Теперь выработка персистентна, а порода — нет:
   сохраняется ТОЛЬКО то, что игрок изменил, то есть список выкопанных ячеек.
   Всё остальное (руда, твёрдость, жилы) по-прежнему выводится из seed. */
function mineKey(p){return G.sx+","+G.sy+":"+(p&&p.idx!==undefined?p.idx:0);}
/* ── где на этой планете уже копали (M234) ──
   Запись шахты знала «сколько выкопано», но не «где»: устье не имело адреса,
   и на поверхности не было видно ничего. Игрок ходил по грунту и не мог
   отличить исхоженное от нетронутого — а копал всё время в один и тот же
   ствол. Адрес пишется рядом с выработкой; у сохранений до M234 его нет, и
   тогда ответ — null: ствол ещё не привязан, первый спуск его и поставит. */
function mineSpotX(p){
  const rec=G.mines&&G.mines[mineKey(p)];
  return (rec&&typeof rec.x==="number")?rec.x:null;
}
function mineDeep(p){
  const rec=G.mines&&G.mines[mineKey(p)];
  return rec?(rec.deepest|0):0;
}
function mineLoad(D,p){
  const rec=G.mines&&G.mines[mineKey(p)];
  if(!rec)return;
  for(const key of rec.dug||[]){
    const c=digCell(D,...key.split(",").map(Number));
    /* выкопанное — пустая ячейка: руду из неё уже вынесли, второй раз её нет */
    c.dug=true;c.res=null;c.amount=0;c.prog=0;
  }
  D.deepest=rec.deepest|0;
}
function mineSave(D,p){
  if(!G.mines)G.mines={};
  const dug=[];
  for(const key in D.cells)if(D.cells[key].dug)dug.push(key);
  /* ствол растёт, и запись растёт вместе с ним; но она плоская и коротка —
     тысяча ячеек это тысяча строк "c,r", а не тысяча объектов */
  const was=mineSpotX(p);
  G.mines[mineKey(p)]={dug,deepest:D.deepest|0,
    x:(typeof D.x0==="number")?D.x0:(was!=null?was:0)};
}

const DIG_TURF=9, DIG_SUB=27;
function digSMix(a,b,t){return [Math.round(lerp(a[0],b[0],t)),Math.round(lerp(a[1],b[1],t)),Math.round(lerp(a[2],b[2],t))];}
/* линия поверхности: две волны, обе от посева планеты. Больше двенадцати
   пикселей размаха брать нельзя — верхний ряд клеток стоит от нуля, и рельеф
   не должен выедать его наполовину */
function digSurfY(p,wx){
  const s=(p&&p.seed)|0;
  return (noise1(wx*.0085,s^0x50A1)-.5)*23+(noise1(wx*.038,s^0x11B2)-.5)*8;
}
function digSoilCols(p){
  const pal=(p&&p.T&&p.T.pal)||[[70,70,74]];
  const top=pal[Math.min(3,pal.length-1)];
  const G0=(typeof geologyOf==="function")?geologyOf(p):null;
  const rock=(G0&&G0[0]&&G0[0].col)||[90,88,86];
  const air=!!(p&&p.T&&p.T.atm!=="отсутствует");
  return {
    air,
    /* дёрн: тот же тон, что виден сверху, но втоптанный в органику. Без
       воздуха вместо него реголит — светлее камня, а не темнее */
    turf: air?digSMix(top,[24,20,13],.60):digSMix(top,[150,148,150],.42),
    /* подпочва БУРАЯ: она темнее и теплее и камня, и того, что видно сверху.
       Первый счёт мешал только эти два тона и на зелёном мире выходил зелёным —
       то есть тем же камнем, только светлее, и профиля в кадре не было */
    sub:  digSMix(digSMix(top,rock,.5),[96,68,38],.46),
    rock
  };
}
