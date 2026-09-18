/* ══════════════ постановка на учёт — утильсбор (M513, PLAN «new mechanics», st. 6) ══════════════
   Автор, 14.09: «купил корабль — тебя останавливают, надо на учёт поставить».
   Корпус, купленный или заказанный в земле ЧУЖОЙ державы, летает на
   ТРАНЗИТНЫХ НОМЕРАХ — бумажка на борту, годна три сводки (девять смен).
   Первый прилёт в землю своего флага — пикет: «постановка на учёт».
   УТИЛЬСБОР — «сбор за будущую утилизацию», по массе корпуса (дороже всего
   тому, кого никогда не разрежут), форма 2-ТС в трёх экземплярах, номер в
   очереди, ждать сводку (три смены). Не уложились в транзит — каждый пикет
   своей земли штрафует, «транзит просрочен». Поставили — номера своего флага.
   Доброта: однажды инспектор машет рукой, «до понедельника», и ничего не пишет.
   Состояние — по кораблю, G.reg[id] = {by, until, q, done}; G.regWave — раз. */
const REG_TRANSIT=9,REG_WAIT=3,REG_FINE=60;
function regAll(){return G.reg||(G.reg={});}
function regOf(id){return regAll()[id]||null;}
/* куплено/заказано: в чужой земле — транзитные номера */
function regBought(id,by){
  if(!id||!by||by===playerFlag())return null;
  const r={by,until:now()+REG_TRANSIT*HOLD_SHIFT,q:0,done:0};
  regAll()[id]=r;
  logAdd("dim","Транзитные номера «"+makerRu(by)+"» · годны "+REG_TRANSIT+" смен · на учёт — в земле своего флага");
  return r;
}
function regFee(id){const S=shipData(id);return S?Math.round((S.hull*8+S.cargo*3)/10)*10:0;}
function regPending(id){const r=regOf(id);return !!(r&&!r.done);}
/* прилёт: зовёт arriveSystem */
function regArrive(){
  const id=G.shipId,r=regOf(id);
  if(!r||r.done)return null;
  const own=(typeof stampOwnerAt==="function")?stampOwnerAt(G.sx,G.sy):null;
  if(own!==playerFlag())return null;
  /* очередь дошла — номера выданы */
  if(r.q&&now()>=r.q){r.done=1;logAdd("good","Учёт: номера "+makerRu(own)+" выданы · транзитка снята");say("Поставлен на учёт\nномера выданы",140);return "done";}
  if(r.q){
    if(now()>r.until){
      if(G.credits>=REG_FINE)G.credits-=REG_FINE;
      logAdd("bad","Пикет: транзит просрочен · штраф "+REG_FINE+" кр · «очередь ваша ещё не подошла, а номера уже не годны»");
      return "fine";
    }
    return null;
  }
  /* первый раз: доброта или 2-ТС */
  if(!G.regWave){G.regWave=1;
    logAdd("good","Пикет: инспектор смотрит на транзитку и машет рукой — «до понедельника». Ничего не записал.");
    say("Пикет\n«Езжайте. До понедельника.»",150);return "wave";}
  const fee=regFee(id);
  if(G.credits<fee){logAdd("bad","Пикет: утильсбор "+fee+" кр — не хватает. «Приходите с деньгами»");return "broke";}
  G.credits-=fee;r.q=now()+REG_WAIT*HOLD_SHIFT;
  const no=10+hashi(G.sx,G.sy,(now()/60000)|0)%90;
  logAdd("money","Постановка на учёт: утильсбор "+fee+" кр («сбор за будущую утилизацию») · форма 2-ТС в трёх экземплярах · очередь № "+no+" · через сводку");
  say("Постановка на учёт\nутильсбор "+fee+" кр · очередь № "+no,170);
  return "queued";
}
