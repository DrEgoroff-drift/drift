/* ══════════════ устье пещеры не под ориентиром (M627b) ══════════════
   Посадка (21-mode-surface) отодвигает устье только от площадки — на ровно keep = 3 зоны корабля, —
   а ориентиры ставит своя полоса (20a-poi) в 700 от площадки и дальше. Отступ устья и полоса
   ориентира часто совпадают: на съёмке пятёрки пещера легла на друзу и на пушку, и у пушки
   ДЕЙСТВИЕ забирала пещера — места ориентира были недостижимы. Цепочку не трогаем: устье, оказавшись
   на теле ориентира с его местами действия, сдвигается к ближнему краю этого отрезка (а если там
   площадка — к дальнему), и пятачок у нового устья расчищается от растений, как у старого.
   Залежи у устья отодвигает 21pih (оно в его глушителях). */
function caveRoomSpans(S){
  const out=[];
  for(const q of (S.tr&&S.tr.poi)||[]){
    const K=PLN_MARK.kinds[q.k],H=plnMarkH(q);
    /* тело — доля роста по ширине, места — до 12 м в стороны; плюс полкорпуса холма пещеры */
    const r=(Math.max(H*((K&&K.w)||1)*.5,14)+6)*PLN_M;
    out.push([q.x-r,q.x+r]);
  }
  out.sort((a,b)=>a[0]-b[0]);
  const M=[];
  for(const s of out){const l=M[M.length-1];if(l&&s[0]<=l[1])l[1]=Math.max(l[1],s[1]);else M.push(s.slice());}
  return M;
}
function caveRoom(S){
  if(!S||!S.cave||!S.tr||!isFinite(S.cave.x))return false;
  const x=S.cave.x,sp=caveRoomSpans(S).find(s=>x>s[0]&&x<s[1]);
  if(!sp)return false;
  const tr=S.tr,keep=Math.max(300,(typeof shipZoneR==="function"?shipZoneR():90)*3);
  const ok=v=>v>=150&&v<=tr.W-150&&Math.abs(v-tr.padX)>=keep;
  const near=x-sp[0]<sp[1]-x?sp[0]:sp[1],far=near===sp[0]?sp[1]:sp[0];
  const nx=ok(near)?near:ok(far)?far:null;
  if(nx==null)return false;
  S.cave.x=nx;
  if(S.plants)for(let i=S.plants.length-1;i>=0;i--)if(Math.abs(S.plants[i].x-nx)<50)S.plants.splice(i,1);
  return true;
}
const CAVE_ROOM_OLD_ENTER=enterSurface;
enterSurface=function(){
  const r=CAVE_ROOM_OLD_ENTER.apply(this,arguments);
  if(G.mode==="surface")caveRoom(G.surf);
  return r;
};
