/* ══ M128: очередь реплик и вещь на столе ══
   Сторож замысла: за посадку тратится одна реплика, обращение растёт от числа
   посадок, молчание — полноправная строка, а лента становится вещью, которая
   лежит на столе и продаётся. */
TEST_SUITES.push(()=>suite("Речь: очередь, обращение и вещь вместо слов",()=>{
  resetWorld();
  G.speech={};G.visits={};G.strips=[];
  G.st=G.sys.station||{name:"Проба",stype:"trade",kind:"узел"};

  /* ── одна реплика за посадку ── */
  visitMark();
  const a=speechHere(), b=speechHere();
  eq(a.line,b.line,"пока не улетели, реплика та же");
  visitMark();
  const c=speechHere();
  ok(c.line!==a.line||c.silent!==a.silent,"после нового захода очередь сдвинулась");
  ok(LOCAL.some(l=>l===null),"молчание есть в таблице как строка");
  let sil=0;
  for(let i=0;i<LOCAL.length;i++){visitMark();if(speechHere().silent)sil++;}
  ok(sil>0,"молчание выпадает в очереди: "+sil+" раз");

  /* ── обращение растёт от числа посадок ── */
  G.visits={};
  const first=addrForm();
  for(let i=0;i<8;i++)visitMark();
  const later=addrForm();
  ok(first!==later,"к своему обращаются иначе, чем к чужому: «"+first+"» → «"+later+"»");

  /* ── лента становится вещью ── */
  G.tape=null;tapeInit();
  for(let i=0;i<60;i++)tapeSample();
  const n0=tapeInit().n;
  const s=tapeTear();
  ok(s&&s.span===n0,"полоса унесла ровно то, что было записано: "+n0);
  eq(tapeInit().n,0,"после отрыва бумага начинается заново");
  eq(stripsAll().length,1,"лента лежит в вещах");
  ok(stripValue(s)>0,"у ленты есть цена");
  const rich=stripValue({mis:.6,span:600}),dull=stripValue({mis:0,span:60});
  ok(rich>dull*2,"хорошая лента стоит заметно дороже пустой: "+rich+" против "+dull);
  /* короткую ленту рвать нечего */
  G.tape=null;tapeInit();
  eq(tapeTear(),null,"пустую бумагу не отрывают");

  /* ── стол: отвечают на предмет ── */
  G.strips=[s];
  const res=putOnTable("strip",0);
  ok(res&&(typeof res.line==="string"||res.silent),"на ленту отвечают строкой или молчанием");
  ok(!putOnTable("ерунда",0),"на то, чего нет, стол не отвечает");
  const money=G.credits;
  const got=stripSell(0);
  ok(got>0&&G.credits===money+got,"ленту купили, деньги пришли: +"+got);
  eq(stripsAll().length,0,"проданной ленты у вас больше нет");

  /* ── эфир говорит в полёте и молчит на стоянке ── */
  const log0=G.log.length;
  G.running=true;G.mode="dock";G.etherT=0;
  for(let i=0;i<50;i++)etherTick(1);
  eq(G.log.length,log0,"на стыковке эфир не бубнит");
  G.mode="system";G.etherT=0;
  etherTick(1);
  ok(G.log.length>log0,"в полёте эфир слышен");
  G.st=null;
}));
