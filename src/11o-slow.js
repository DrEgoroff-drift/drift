/* ══════════════ медленный: долина, у которой одна мысль длится сутками ══════════════
   M143-slow. Бедный уезд (06c, `slow`, игла хронометра): биологи и две станции
   снабжения, живущие сырьём, которое растёт веками. На окраине вялая фауна,
   растения, которые «будто движутся», учёные, жалующиеся в эфире, что вахта
   слишком коротка, чтобы хоть что-то измерить.

   ЯДРО — ДОЛИНА, КОТОРАЯ ОДИН ОРГАНИЗМ, и один такт его мысли длится сутками.
   ВЫ ДЛЯ НЕЁ — МЕЛЬКАНИЕ.
   МЕХАНИКА — ПЕРЕПИСКА. Выложить фигуру из предметов, улететь по делам,
   вернуться через цикл созревания — и в ответ что-то выложено. Пять-шесть
   обменов: сначала копия, потом продолжение, потом ОСМЫСЛЕННАЯ ОШИБКА — она
   добавляет то, чего вы не клали, но что подходит. Прочитанный прямо, первый
   настоящий ответ спрашивает: «ты живой?» — всё быстрое здесь прежде было
   ветром и камнепадом.
   Глазу ничего не видно. Первое доказательство, что долина жива, приходит
   С ЛЕНТЫ САМОПИСЦА: хронометр у выкладки даёт горб, когда ответ созрел.
   Бросить — ничего не случится: у неё другое время. Ответ будет лежать.

   ПРАВИЛА ФАЙЛА:
   1. Не она ученица — вы нетерпеливый. Игра этого не говорит; это видно.
   2. Хранится G.slow={fig,at,round}: что выложено, в какой день, который обмен.
      Ответ не хранится — он функция фигуры и номера обмена. */

const SLOW_CYCLE=5;                          // суток созревания
const SLOW_ETHER=[
  "…биостанция два. За вахту ничего не выросло. Ничего. Продлите вахту.",
  "…оно сдвинулось. Нет, показалось. Нет, сдвинулось. Запишите оба.",
  "…снабжение, заберите пробы, они всё равно не меняются."
];
function slowAll(){return (G.slow||(G.slow={fig:null,at:-1,round:0}));}
function slowDepthAt(sx,sy){
  if(typeof regionAt!=="function")return 0;
  const R=regionAt(sx,sy);
  if(R.theme!=="slow")return 0;
  return (R.core.sx===sx&&R.core.sy===sy)?2:1;
}
function slowDepthHere(){return slowDepthAt(G.sx,G.sy);}
function slowCorePlanet(sys){
  if(!sys||slowDepthAt(sys.sx,sys.sy)!==2)return null;
  for(const p of sys.planets||[])if(p.type!=="gas")return p;
  return null;
}
function slowIsCore(p){const c=slowCorePlanet(G.sys);return !!(c&&p&&c.idx===p.idx);}
function slowSpotX(tr,p){
  const r=rng(hashi(p.seed|0,0x510,0x3));
  return clamp(tr.W*(.3+r()*.4),300,tr.W-300);
}
function slowEtherLine(r){
  if(slowDepthHere()!==1||r()>.3)return null;
  return pick(SLOW_ETHER,r);
}
function slowGroundLine(){
  const d=slowDepthHere();
  if(!d)return null;
  return d===1?"Растения будто движутся. Если не смотреть.":"Долина. Тихо так, что слышно, как она думает.";
}
/* ── выкладка ──
   Фигура — до четырёх разных видов груза, по единице каждого. */
function slowLay(){
  const S=slowAll();
  if(S.fig)return false;
  const fig=[];
  for(const k of RES_KEYS){if((G.cargo[k]|0)>0&&fig.length<4)fig.push(k);}
  if(!fig.length){say("Выложить нечего:\nв трюме пусто");return false;}
  for(const k of fig)G.cargo[k]--;
  S.fig=fig;S.at=celDay();
  logAdd("dim","Выложили: "+fig.map(k=>RES[k].ru.toLowerCase()).join(", ")+". Улетайте. У неё другое время.");
  return true;
}
/* созрел ли ответ */
function slowReady(){
  const S=slowAll();
  return !!(S.fig&&S.at>=0&&celDay()-S.at>=SLOW_CYCLE);
}
/* ответ — функция фигуры и номера обмена: копия, продолжение, осмысленная ошибка, дальше — своё */
function slowReply(){
  const S=slowAll();if(!S.fig)return null;
  const f=S.fig.slice(),r=S.round|0;
  if(r===0)return f;
  if(r===1)return f.concat([f[0]]);
  /* осмысленная ошибка: добавляет то, чего не клали, но что подходит — того же цвета ряда */
  const rr=rng(hashi(f.length,r,0x510E));
  const pool=RES_KEYS.filter(k=>f.indexOf(k)<0&&k!=="folk"&&k!=="missile");
  const add=pool.length?pool[Math.floor(rr()*pool.length)]:f[0];
  const out=f.concat([f[f.length-1],add]);
  if(r>=3)out.push(add);
  return out;
}
/* прочесть ответ: следующий обмен. Строка — что это значит, прочитанное прямо */
function slowRead(){
  const S=slowAll();
  if(!slowReady())return null;
  const rep=slowReply();
  const ru=rep.map(k=>RES[k].ru.toLowerCase()).join(", ");
  const r=S.round|0;
  const mean=r===0?"Копия. Точно такая же.":(r===1?"Продолжение. Прочитанное прямо: «ты живой?»":
             (r===2?"Она добавила то, чего вы не клали. Подходит.":"Своё. Вы уже не первый в разговоре."));
  logAdd("good","Ответ: "+ru+". "+mean);
  tell("tech","Ответ долины · обмен "+(r+1),ru+"\n"+mean);
  if(typeof heardAdd==="function")heardAdd("ground",{sx:G.sx,sy:G.sy,note:"долина ответила"},null);
  S.round=r+1;S.fig=null;S.at=-1;
  return rep;
}
/* горб на хронометре: у выкладки, когда ответ созрел (25a) */
function slowDrift(){
  const S=G.surf;
  if(!S||!slowIsCore(S.p)||!slowReady())return 0;
  const d=Math.abs(S.x-slowSpotX(S.tr,S.p));
  return d<400?.5*(1-d/400):0;
}
function slowHere(S){return !!(S&&slowIsCore(S.p)&&Math.abs(S.x-slowSpotX(S.tr,S.p))<36);}
/* ── вид ──
   Фигура — цветные метки по грунту; ответ, когда созрел, рядом и тусклее.
   Ничего больше: глазу не видно, что здесь кто-то есть. */
function slowDraw(tr,camx,camy,p){
  if(!slowIsCore(p))return;
  const S=slowAll(),x0=slowSpotX(tr,p),sx=x0-camx;
  if(sx<-200||sx>W+200)return;
  const y=groundAt(tr,x0)-camy;
  ctx.fillStyle="rgba(226,236,240,.35)";ctx.fillRect(sx-1,y-14,2,10);   /* колышек: место */
  const draw=(arr,ox,a)=>{for(let i=0;i<arr.length;i++){ctx.fillStyle=rgba(hex2rgb(RES[arr[i]].col),a);ctx.fillRect(sx+ox+i*9,y-5,6,4);}};
  if(S.fig)draw(S.fig,-18,.9);
  if(slowReady())draw(slowReply(),-18,.35);
}
