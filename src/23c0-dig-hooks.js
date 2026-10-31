/* ══════════════ шахта: крючки к 23-mode-dig (M631, «No 2D») ══════════════
   Плоской кисти у шахты больше нет: кадр рисует движок (23c dig3Draw), зверей и
   импульс — 23ce. Таблица крючков: имя → mk(старое); чего крючок ждёт и нет —
   громкая ошибка при загрузке, не тихий чёрный кадр. */
const DIG3_HOOKS={
  drawDig:()=>dig3Draw
};
for(const n in DIG3_HOOKS){
  const O=globalThis[n],f=DIG3_HOOKS[n](O);
  if(typeof f!=="function")throw new Error("крючок шахты: "+n+" — нет функции");
  globalThis[n]=f;
}
