/* ══════════════ домино за столом ══════════════
   M166. Советский космос без домино в кают-компании неполный. Крошечная
   партия — три хода: цепочка начата, у вас три кости, подходит та, у которой
   совпадает половинка; не подходит — стучите. Соперник ходит из своей руки.
   Ставка — не деньги: выиграли — слух или запасная часть, проиграли —
   подначка. С Вегой любой исход — ссора, и это её правила. Шахматы — только
   с шестой, и она уже улетела: доска стоит, никто не садится.

   ПРАВИЛА ФАЙЛА:
   1. Партия эфемерна (DOM_GAME): день кончился — стол вытерли.
   2. Кости — от посева дня и места: перезаход экрана не пересдаёт руку. */
let DOM_GAME=null;
function dominoTile(r){return [Math.floor(r()*7),Math.floor(r()*7)];}
function dominoStart(who){
  const r=rng(hashi(G.sx*31+G.sy,celDay(),0xD011));
  DOM_GAME={who,day:celDay(),key:G.sx+","+G.sy,
    chain:dominoTile(r),hand:[dominoTile(r),dominoTile(r),dominoTile(r)],
    foe:[dominoTile(r),dominoTile(r),dominoTile(r)],
    turn:0,me:0,him:0,over:0,line:""};
  return DOM_GAME;
}
function dominoFits(t,end){return t[0]===end||t[1]===end;}
function dominoEnd(){return DOM_GAME.chain[1];}
/* ход игрока: i — кость из руки, или -1 «стучу» */
function dominoMove(i){
  const D=DOM_GAME;if(!D||D.over)return;
  if(i>=0){
    const t=D.hand[i];
    if(!dominoFits(t,dominoEnd()))return;
    D.hand.splice(i,1);
    D.chain=[dominoEnd(),t[0]===dominoEnd()?t[1]:t[0]];
    D.me++;
  }
  /* соперник: первая подходящая */
  const j=D.foe.findIndex(t=>dominoFits(t,dominoEnd()));
  if(j>=0){const t=D.foe.splice(j,1)[0];D.chain=[dominoEnd(),t[0]===dominoEnd()?t[1]:t[0]];D.him++;}
  D.turn++;
  if(D.turn>=3||!D.hand.length){D.over=1;dominoSettle();}
}
function dominoSettle(){
  const D=DOM_GAME;
  const win=D.me>D.him;
  const vega=D.who==="Вега";
  if(win){
    const r=rng(hashi(D.key.length,D.day,0xD0F1));
    if(r()<.3){const p=genPart(hashi(G.sx,G.sy,D.day*13),1);G.inv.push(p);D.line="проиграл — держите: «"+p.name+"». Лежала без дела.";logAdd("good","Домино: выигрыш — «"+p.name+"»");}
    else{
      const L=(typeof rumoursHere==="function")?rumoursHere():[];
      D.line=L.length?"с меня слух. "+L[Math.floor(r()*L.length)].text:"с меня слух, но нечего рассказать. Тут тихо.";
      if(L.length)logAdd("dim","Домино: выигран слух");
    }
  }else D.line=D.me===D.him?"ничья. Стол вытираем, никто не видел.":"вы стучали чаще, чем ходили. Бывает.";
  if(vega)D.line=win?"Ты ПОДДАВАЛСЯ. Думаешь, я не вижу? Мы в ссоре.":"Я выиграла. Ты расстроился. Мы в ссоре.";
  peopleLine(D.line,D.who);
  if(vega&&typeof vegaOffend==="function"&&!win)G.vega.mood=Math.max(0,(G.vega.mood||1)-.2);
}
/* блок: кантина или дом. Партия — раз в день на место */
function dominoBlock(who){
  if(!who)return;
  const played=DOM_GAME&&DOM_GAME.over&&DOM_GAME.day===celDay()&&DOM_GAME.key===G.sx+","+G.sy;
  const D=(DOM_GAME&&DOM_GAME.day===celDay()&&DOM_GAME.key===G.sx+","+G.sy)?DOM_GAME:null;
  $body.appendChild(el("div","sec","ЗА ДАЛЬНИМ СТОЛОМ · ДОМИНО"));
  $body.appendChild(el("div","sec","Три хода, ставка не деньгами: выиграли — с вас слух "+
    "(место и сектор, куда стоит слетать) или запасная часть; проиграли — подначка."+
    (who==="Вега"?" С Вегой любой исход — ссора, и это её правила.":"")));
  if(!D){
    const r=el("div","row","<div class='nm'><b>"+who+" двигает кости</b><s>«садись. Три хода. Кто больше положил, тот и прав»</s></div>");
    const b=el("button","act sm","СЫГРАТЬ");b.onclick=()=>{dominoStart(who);renderTab();};
    r.appendChild(b);$body.appendChild(r);
    /* шахматы шестой: доска стоит, никто не садится */
    if(typeof sixthGone==="function"&&sixthGone())
      $body.appendChild(el("div","row","<div class='nm'><s>рядом шахматная доска. Играла только Варламова. Никто не садится.</s></div>"));
    return;
  }
  const tile=t=>"["+t[0]+"|"+t[1]+"]";
  const r=el("div","row","<div class='nm'><b>Цепочка: …"+tile(D.chain)+"</b><s>кладут ту кость, у "+
    "которой половинка совпала с концом цепочки; нечего положить — стучат"+
    "<br>счёт "+D.me+":"+D.him+" · ход "+Math.min(D.turn+1,3)+" из 3"+
    (D.over?"<br>"+D.who+": «"+D.line+"»":"")+"</s></div>");
  if(!D.over){
    D.hand.forEach((t,i)=>{
      const b=el("button","act sm"+(dominoFits(t,dominoEnd())?" gold":""),tile(t));
      b.disabled=!dominoFits(t,dominoEnd());
      b.onclick=()=>{dominoMove(i);renderTab();};
      r.appendChild(b);
    });
    const kb=el("button","act sm","СТУЧУ");kb.onclick=()=>{dominoMove(-1);renderTab();};
    r.appendChild(kb);
  }
  $body.appendChild(r);
}
