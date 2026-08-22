/* ══════════════ почтовый круг: вещь идёт по рукам десятилетиями ══════════════
   M133. Первая тематическая область (06c, `post`). Люди, которые передают
   вещи дальше, потому что так заведено. Посылка — обыкновенный предмет; вы
   везёте её по шести адресам, и на каждом человек, который когда-то сам её
   нёс, узнаёт свёрток и говорит ОДНУ СТРОКУ — о себе, никогда о посылке, —
   и называет, кому дальше.

   ПРАВИЛА ФАЙЛА:
   1. Ни таймера, ни провала, ни платы. Круг не торопит и не ждёт.
   2. Никто не говорит о посылке. Строка — про человека: где он был, кем.
   3. Посылку можно вскрыть. Цепочка продолжается; последний заметит. Не
      упрекнёт — заметит.
   4. В почтовом кругу приборы молчат (06c): единственное такое место, и
      игрок должен это увидеть сам, а не прочесть.
   5. Адреса считаются от посева и не хранятся; хранится только G.post:
      сколько звеньев пройдено, вскрыта ли, доставлена ли. */

const POST_SALT=0x9057;
const POST_WHAT="две фотографии без подписи, лента к счётчику и записка, которую не разобрать";
const POST_ITEMS=["свёрток в промасленной бумаге, перевязанный шпагатом",
  "банка с чем-то тёмным, горлышко залито воском",
  "разводной ключ, обмотанный тряпкой, с биркой без букв"];
/* шесть звеньев: первые пять — те, кто нёс; шестой — кому. Строка у каждого
   одна и про себя. «next» — как он называет следующего */
const POST_LINKS=[
  {who:"Ряженцев",line:"Мне её отдали в шестьдесят третьем. Я тогда на «Прибое» стоял, вторым механиком.",
   next:"Дальше — Устинье. Она бухгалтером где-то по руке; свёрток она узнает сама."},
  {who:"Устинья",line:"Я двенадцать лет держала её в сейфе. Сейф продали, а её нет.",
   next:"Теперь к Гапону. Где он — не скажу, но он тебя сам найдёт, когда сядешь."},
  {who:"Гапон",line:"Я нёс её через карантин сорок первого. Меня три недели не выпускали, а её не тронули.",
   next:"Следующая — Маша Рогова. Была Машей, теперь Мария Карповна, уж как найдёшь."},
  {who:"Мария Карповна",line:"У меня тут тогда ещё дочь родилась. Теперь у дочери свои.",
   next:"Передай Сысою. Он буфетчик, такой, с бородой; ты его узнаешь."},
  {who:"Сысой",line:"Я её на полке за стойкой держал, между солью и накладными. Год, наверное.",
   next:"Ну, тебе последнему. В самый круг, на ядро. Там спросишь — там знают."},
  {who:"Арсений Фомич",line:"Я её сорок два года жду.",
   opened:"Вскрыта. Ну да. Сорок два года — кто бы не вскрыл.\nЯ её сорок два года жду.",
   next:null}
];

function postAll(){return (G.post||(G.post={stage:0,opened:0,done:0}));}
function postItem(){return POST_ITEMS[hashi(1,2,POST_SALT)%POST_ITEMS.length];}
/* ── адреса ──
   Звено 0 — обычное место почтового круга (правило 4 из 06c), звено 5 — ядро.
   Промежуточные — станции по всей руке, 4–14 секторов от начала, каждая своя. */
let POST_ADDR=null;
function postAddrs(){
  if(POST_ADDR)return POST_ADDR;
  const out=[];
  const at=(typeof regionOfTheme==="function")?regionOfTheme("post"):null;
  if(!at)return POST_ADDR=out;
  const R=regionAt(at.rx*REGION_SPAN,at.ry*REGION_SPAN);
  const plain=regionPlainSys(at.rx,at.ry,R.core);
  const core={sx:R.core.sx,sy:R.core.sy};
  if(!plain)return POST_ADDR=out;
  out.push(plain.sx+","+plain.sy);
  const r=rng(hashi(at.rx,at.ry,POST_SALT));
  for(let i=1;i<POST_LINKS.length-1;i++){
    let k=null;
    for(let t=0;t<600&&!k;t++){
      const a=r()*TAU,d=4+r()*10;
      const sx=Math.round(Math.cos(a)*d),sy=Math.round(Math.sin(a)*d);
      if(!starAt(sx,sy)||regionKey(sx,sy)===R.key)continue;
      const key=sx+","+sy;if(out.indexOf(key)>=0)continue;
      const s=getSystem(sx,sy);if(s&&s.station)k=key;
    }
    out.push(k);
  }
  out.push(core.sx+","+core.sy);
  return POST_ADDR=out;
}
/* какое звено — это место, или -1 */
function postLinkHere(){
  if(!G.st||!G.sys)return -1;
  return postAddrs().indexOf(G.sys.key);
}
/* ── движение ──
   При стыковке: если это следующее звено — человек подходит сам. Возвращает
   то, что он сказал, или null. Вызывается один раз за посадку. */
function postDock(){
  const P=postAll();
  if(P.done)return null;
  const i=postLinkHere();
  if(i<0||i!==P.stage)return null;
  const mark=r=>{POST_LAST={v:odoSum(),r};return r;};
  const L=POST_LINKS[i];
  if(i===POST_LINKS.length-1){
    P.done=1;
    const line=((P.opened&&L.opened)?L.opened:L.line)+(P.strip?"\nА лента — ваша? Оставлю. Пусть лежит с ней.":"");
    logAdd("good",L.who+": "+line.replace(/\n/g," "));
    if(typeof placeNote==="function")placeNote("care",3);
    return mark({who:L.who,line,next:null,last:true});
  }
  P.stage=i+1;
  logAdd("dim",L.who+": "+L.line+(L.next?" — "+L.next:""));
  return mark({who:L.who,line:L.line,next:L.next,first:i===0});
}
/* вскрыть: содержимое обыкновенное, и оно одно на всю игру */
function postOpen(){
  const P=postAll();
  if(!P.stage||P.done||P.opened)return null;
  P.opened=1;
  const what=POST_WHAT;
  logAdd("dim","Посылка вскрыта: "+what);
  return what;
}
function postHolding(){const P=postAll();return !!P.stage&&!P.done;}

/* ── блок в кантине ──
   Посылка лежит рядом со столом. Что сказал человек на этой посадке — видно
   здесь же; вскрыть можно где угодно, один раз. */
let POST_LAST=null;                      // что сказали на этой посадке (не хранится)
function postBlock(){
  const P=postAll();
  const said=POST_LAST&&POST_LAST.v===odoSum()?POST_LAST.r:null;
  if(!P.stage&&!said)return;
  if(P.done&&!said)return;
  $body.appendChild(el("div","sec","ПОСЫЛКА · "+(P.done?"ДОСТАВЛЕНА":"ВЫ ЕЁ ВЕЗЁТЕ")));
  /* к посылке можно приложить ленту (хвост M133): полоса уходит из ваших,
     последний её заметит — и только */
  if(!P.done&&P.stage&&!P.strip&&typeof stripsAll==="function"&&stripsAll().length){
    const rs=el("div","row");
    rs.appendChild(el("div","nm","<b>Приложить ленту</b><s>одна из ваших полос пойдёт с посылкой по рукам</s>"));
    const bs=el("button","act sm","ПРИЛОЖИТЬ");
    bs.onclick=()=>{stripsAll().shift();P.strip=1;logAdd("dim","К свёртку приложена лента");renderTab();};
    rs.appendChild(bs);$body.appendChild(rs);
  }
  if(said){
    $body.appendChild(el("div","row","<div class='nm'><b>"+said.who+"</b><s style='color:#cfe3ea;line-height:1.9'>"+
      said.line.replace(/\n/g,"<br>")+(said.next?"<br><i>"+said.next+"</i>":"")+"</s></div>"));
  }
  if(P.done)return;
  const r=el("div","row");
  r.appendChild(el("div","nm","<b>"+postItem()+"</b><s>"+
    (P.opened?"вскрыта: "+POST_WHAT:"ни адреса, ни имени — только то, что вам сказали")+"</s>"));
  if(!P.opened){
    const b=el("button","act sm","ВСКРЫТЬ");
    b.onclick=()=>{postOpen();renderTab();};
    r.appendChild(b);
  }
  $body.appendChild(r);
}
