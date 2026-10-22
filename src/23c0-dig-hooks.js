/* ══════════════ шахта: крючки к 23-mode-dig (M631, «No 2D») ══════════════
   23-mode-dig не правится (правило автора), а плоской кисти у шахты больше нет. Таблица крючков:
   имя → mk(старое). Чего ждёт крючок и нет — громкая ошибка при загрузке, не тихий чёрный кадр.
   drawDig — кадр движком (23c dig3Draw); drawDigFauna — кольцо на холсте, его место занял
   dig3ZapFrame (23ce): позвавший его получает ошибку с адресом. */
const DIG3_HOOKS={
  drawDig:()=>dig3Draw,
  drawDigFauna:O=>{if(typeof O!=="function")throw new Error("крючок шахты: нет drawDigFauna в 23-mode-dig");
    return ()=>{throw new Error("2D: drawDigFauna снят — зверей и импульс рисует движок (23ce)");};}
};
for(const n in DIG3_HOOKS){
  const O=globalThis[n],f=DIG3_HOOKS[n](O);
  if(typeof f!=="function")throw new Error("крючок шахты: "+n+" — нет функции");
  globalThis[n]=f;
}
