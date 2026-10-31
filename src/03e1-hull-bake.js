/* ══════════════ ключ выпечки корпуса ══════════════
   2D-печка (hullBakeDraw / getImageData / mkCanvas) снята: тело печёт
   hullGpuBake (17c2) на GPU-холсте. Здесь остаются общий ключ неподвижного
   тела и живые вставки (строка Компании, венцы), которые читает видеокарта. */
/* всё, от чего зависит неподвижное тело, кроме крена: общий ключ видеокарты (17c2) */
function hullBakeKey(id,sb){
  return sb+"|"+Math.round(wearOf(id)*64)+"|"+(typeof seamsOf==="function"?seamsOf(id):0)+"|"+(typeof tapesOf==="function"?tapesOf(id):0)+
    "|"+(typeof cosmOn==="function"?cosmOn("mark"):"")+
    "|"+((typeof scarsOf==="function")?scarsOf(shipData(id)).join(""):"")+"|"+((typeof regPending==="function"&&regPending(id))?1:0)+"|"+((G.railSeal&&id===G.shipId)?1:0);   /* шрамы, транзитка и пломба — в выпечке (D25/M482, 18.09) */
}
/* живые вставки между кусками тела: бегущая строка Компании и венцы — с ними тело не печётся одним слоем */
function hullLiveInserts(h,id){
  const ticks=(h.outs||[]).some(o=>o.k==="runline");
  const crowns=id===G.shipId&&!!G.crowns&&NODE_FAMS.some(f=>G.crowns[f.id]);
  return {ticks,crowns};
}
