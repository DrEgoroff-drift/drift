/* ══════════════ трепло: репертуар ══════════════
   Птица живёт в своём окне: открыл — она там, закрыл — её нет. Значит, всё,
   что игрок про неё поймёт, он поймёт из того, чем она занята, пока на неё
   смотрят. Одной качки на лапах для этого мало: через минуту наблюдения покой
   становится циклом, а цикл — заставкой.

   ПОЧЕМУ ЭТО ДАННЫЕ, А НЕ ПЯТЬДЕСЯТ ФУНКЦИЙ. Пятьдесят написанных вручную
   анимаций — это пятьдесят кусков кода, которые никто не отладит и половину
   которых никто не увидит. Здесь вместо них десяток степеней свободы (12y:
   наклон, втягивание, шаг, разворот, потягивание, поджатая лапа, веер, зевок,
   дрожь, поклон, вис) и маленький секвенсор поверх пружин. Повадка — одна
   строка, которая на своём отрезке времени пишет в эти степени; всё остальное
   (успокоение, рябь, дыхание, моргание) продолжает идти само.

   ТРИ ПРАВИЛА РЕПЕРТУАРА:

   1. **Повадка не выключает жизнь.** Она пишет только свои степени свободы.
      Дыхание, качка, рябь по перу и моргание идут поверх неё всегда — иначе на
      время «анимации» птица превращается в проигрыватель.
   2. **Настроение решает, что вообще может случиться.** Дремать разъярённой
      нельзя, плясать засыпая — тоже. Три состояния (покой, взвинчена, сонная)
      набираются сами: сонливость копится, пока птицу не трогают, и сбрасывается
      тычком. Это единственная память между повадками, и её хватает, чтобы
      вечер у окна отличался от первой минуты.
   3. **Редкое должно быть редким.** Вис вниз головой — трюк; если он выпадает
      каждую минуту, он перестаёт быть трюком. Вес минимальный, и настроение
      своё.

   И общее правило со всей игрой: птица не выдумывает. Повадка «повторить
   услышанное» достаёт строку из её памяти (12x), а не сочиняет фразу. */

/* колокол: 0 → 1 → 0 без углов. Основа почти всякой повадки: движение должно
   войти и выйти, а не включиться и выключиться */
function parBell(p){return Math.sin(Math.max(0,Math.min(1,p))*Math.PI);}
/* полка: быстрый вход, удержание, мягкий выход — для позы, а не для взмаха */
function parHold(p,in_,out){
  const i=in_||.18, o=out||.22;
  if(p<i)return p/i;
  if(p>1-o)return (1-p)/o;
  return 1;
}
/* строка в поле речи: птица иногда говорит сама, а не только на тычок */
function parSay(text){
  if(!text)return;
  PAR.say=text;PAR.sayT=PAR.t;PAR.beak=1;
  const el=document.getElementById("parrotsay");
  if(el){el.textContent=text;el.classList.remove("on");void el.offsetWidth;el.classList.add("on");}
}

/* ── репертуар ──
   `ru` — как повадка называется (её видно в стенде и в отладке),
   `w` — вес в жеребьёвке, `d` — длительность в секундах,
   `m` — настроение, при котором она возможна: "" любое, "c" покой,
   "x" взвинчена, "s" сонная,
   `f(p,S)` пишет степени свободы; `S` — карман на один заход, в нём держатся
   разовые срабатывания (толчок пружины должен случиться один раз, а не
   каждый кадр). */
const PAR_ACT=[
/* ── осмотреться и переступить: из этого состоит покой ── */
{ru:"осмотреться",w:9,d:2.6,m:"",f:(p,S)=>{PAR.look=Math.sin(p*6.283)*1.1;}},
{ru:"наклон головы",w:9,d:2.2,m:"",f:(p,S)=>{
  if(!S.s)S.s=Math.random()<.5?-1:1;
  PAR.roll=parBell(p)*S.s;}},
{ru:"долгий наклон",w:5,d:3.4,m:"c",f:(p,S)=>{PAR.roll=parHold(p,.22,.3)*.9;PAR.look=.4;}},
{ru:"переступить",w:8,d:1.9,m:"",f:(p,S)=>{
  if(!S.d)S.d=(Math.random()<.5?-1:1)*(8+Math.random()*16);
  PAR.step=parHold(p,.3,.3)*S.d;PAR.footUp=parBell(p)*.5;}},
{ru:"пройтись по жёрдочке",w:4,d:3.6,m:"",f:(p,S)=>{
  if(!S.d)S.d=(Math.random()<.5?-1:1)*(22+Math.random()*14);
  PAR.step=Math.sin(p*3.14159)*S.d;
  PAR.footUp=Math.abs(Math.sin(p*12.5))*.45;PAR.lean=Math.sin(p*12.5)*.05;}},
{ru:"переминаться",w:6,d:2.4,m:"",f:(p,S)=>{
  PAR.step=Math.sin(p*9.4)*4;PAR.footUp=Math.abs(Math.sin(p*9.4))*.4;}},
/* ── уход за собой: то, чем птица занята большую часть суток ── */
{ru:"поджать лапу",w:7,d:4.5,m:"",f:(p,S)=>{PAR.footUp=parHold(p,.12,.14);PAR.tuck=parHold(p)*.35;}},
{ru:"сменить лапу",w:4,d:3.2,m:"",f:(p,S)=>{
  PAR.footUp=p<.45?parHold(p/.45,.2,.2):0;PAR.lean=parBell(p)*.2;}},
{ru:"потянуть крыло",w:6,d:2.4,m:"",f:(p,S)=>{PAR.stretch=parBell(p);PAR.fan=parBell(p)*.4;}},
{ru:"потянуться целиком",w:4,d:3.0,m:"",f:(p,S)=>{
  PAR.stretch=parHold(p,.3,.3);PAR.fan=parHold(p,.3,.3)*.8;
  PAR.footUp=parHold(p,.35,.35)*.7;PAR.yawn=parBell(p)*.5;}},
{ru:"почесать голову",w:5,d:3.0,m:"",f:(p,S)=>{
  /* лапа к щеке, голова — навстречу лапе, и мелкая тряска, пока чешет */
  const h=parHold(p,.25,.25);
  PAR.footUp=h;PAR.scratch=h;PAR.tuck=h*.55;PAR.roll=h*.25;
  PAR.shiver=h*.6+Math.sin(p*40)*h*.3;}},
{ru:"чистить грудь",w:7,d:3.2,m:"",f:(p,S)=>{
  PAR.bow=parHold(p,.2,.2)*.7;PAR.roll=Math.sin(p*15.7)*.18;
  if(Math.random()<.14)PAR.peck=.6;}},
{ru:"чистить хвост",w:4,d:3.4,m:"",f:(p,S)=>{
  PAR.bow=parHold(p,.22,.22)*1.05;PAR.fan=parHold(p,.25,.25)*.7;
  PAR.roll=Math.sin(p*12)*.22;}},
{ru:"перебрать перо",w:6,d:2.9,m:"",f:(p,S)=>{
  PAR.preen=parHold(p,.25,.25);if(Math.random()<.10)PAR.peck=.5;}},
{ru:"распушиться",w:6,d:2.0,m:"",f:(p,S)=>{PAR.ruff+=parBell(p)*.06;PAR.tuck=parBell(p)*.5;}},
{ru:"встряхнуться",w:6,d:1.5,m:"",f:(p,S)=>{
  PAR.shiver=parBell(p)*1.3;PAR.fan=parBell(p)*.5;
  if(!S.o&&p>.3){S.o=1;PAR.flapV+=6;PAR.crestV+=8;}}},
{ru:"почистить клюв",w:5,d:2.6,m:"",f:(p,S)=>{
  PAR.bow=parHold(p,.2,.2)*.95;PAR.step=Math.sin(p*9)*3;
  if(Math.random()<.22)PAR.peck=.8;}},
{ru:"точить клюв",w:3,d:2.2,m:"",f:(p,S)=>{
  PAR.bow=parHold(p,.2,.2)*.8;PAR.beak=Math.abs(Math.sin(p*25))*.5;}},
/* ── крылья и прыжки: то, что видно через всё окно ── */
{ru:"хлопнуть крыльями",w:6,d:1.4,m:"",f:(p,S)=>{
  if(!S.o){S.o=1;PAR.flapV+=13;PAR.crestV+=6;}
  PAR.fan=parBell(p)*.6;}},
{ru:"расправить и сложить",w:4,d:2.6,m:"",f:(p,S)=>{
  PAR.flap=parHold(p,.25,.35)*.85;PAR.fan=parHold(p,.3,.3);PAR.lean=parBell(p)*.15;}},
{ru:"подпрыгнуть",w:4,d:1.6,m:"",f:(p,S)=>{
  if(!S.o){S.o=1;PAR.hopV+=16;PAR.flapV+=9;}}},
/* разворот: доля, а не сторона. Ноль — покой, единица — полный оборот через
   ребро; половина — момент, когда птица стоит к игроку боком */
{ru:"развернуться",w:5,d:1.8,m:"",f:(p,S)=>{
  PAR.turn=parHold(p,.02,.02)*p;PAR.footUp=parBell(p)*.4;
  if(p>=1)PAR.turn=0;}},
{ru:"обернуться и назад",w:4,d:3.0,m:"",f:(p,S)=>{
  PAR.turn=parBell(p)*.62;PAR.look=Math.sin(p*6.283)*.8;}},
{ru:"подскок с разворотом",w:3,d:2.0,m:"",f:(p,S)=>{
  if(!S.o){S.o=1;PAR.hopV+=15;PAR.flapV+=11;}
  PAR.turn=parBell(p)*.7;}},
{ru:"веер хвостом",w:5,d:1.8,m:"",f:(p,S)=>{PAR.fan=parBell(p);}},
{ru:"качнуть хвостом",w:5,d:1.6,m:"",f:(p,S)=>{
  PAR.fan=parBell(p)*.5;PAR.lean=Math.sin(p*9.4)*.16;}},
/* ── общение с тем, кто смотрит ── */
{ru:"поклон",w:5,d:1.9,m:"",f:(p,S)=>{PAR.bow=parBell(p);PAR.crest=parBell(p)*.4;}},
{ru:"кивать",w:5,d:2.4,m:"",f:(p,S)=>{PAR.bow=(1-Math.cos(p*18.8))*.32;}},
{ru:"уставиться",w:6,d:3.8,m:"",f:(p,S)=>{
  PAR.look=0;PAR.tuck=parHold(p,.3,.3)*.25;
  if(!S.o){S.o=1;PAR.blinkAt=PAR.t+3.4;}}},
{ru:"заглянуть вниз",w:5,d:2.2,m:"",f:(p,S)=>{PAR.bow=parHold(p,.3,.3)*.85;PAR.look=.7;}},
{ru:"заглянуть вверх",w:4,d:2.2,m:"",f:(p,S)=>{PAR.roll=parHold(p,.3,.3)*-.7;PAR.look=-.6;}},
{ru:"насторожиться",w:5,d:2.6,m:"",f:(p,S)=>{
  if(!S.o){S.o=1;PAR.crestV+=14;}
  PAR.tuck=parHold(p,.15,.3)*.5;PAR.look=p<.5?-1:1;}},
{ru:"щёлкнуть клювом",w:5,d:1.6,m:"",f:(p,S)=>{
  PAR.beak=Math.abs(Math.sin(p*18.8))*.9;
  if(!S.o&&p>.2){S.o=1;PAR.peck=.7;}}},
{ru:"бормотать",w:6,d:2.8,m:"",f:(p,S)=>{
  PAR.beak=(1-Math.cos(p*25))*.22;PAR.tuck=parHold(p)*.2;
  if(!S.o&&p>.25){S.o=1;
    if(Math.random()<.5&&typeof parrotLine==="function")parSay(parrotLine("body"));}}},
{ru:"повторить услышанное",w:4,d:2.4,m:"",f:(p,S)=>{
  if(!S.o){S.o=1;PAR.crestV+=6;
    if(typeof parrotLine==="function")parSay(parrotLine("beak"));}
  PAR.beak=parBell(p)*.8;PAR.bow=parBell(p)*.3;}},
{ru:"чихнуть",w:3,d:1.3,m:"",f:(p,S)=>{
  if(p<=.35){PAR.roll=-p*1.4;return;}
  if(!S.o){S.o=1;PAR.shiver=1.4;PAR.flapV+=6;PAR.crestV+=9;}
  PAR.bow=parBell((p-.35)/.65)*.9;}},
{ru:"кашлянуть",w:4,d:1.7,m:"",f:(p,S)=>{
  PAR.bow=Math.abs(Math.sin(p*9.4))*.55;PAR.beak=Math.abs(Math.sin(p*9.4))*.6;}},
{ru:"зевнуть",w:5,d:2.2,m:"",f:(p,S)=>{PAR.yawn=parBell(p);PAR.roll=parBell(p)*-.25;}},
/* ── взвинчена: только когда её задели ── */
{ru:"вскинуть хохол",w:6,d:1.8,m:"x",f:(p,S)=>{if(!S.o){S.o=1;PAR.crestV+=22;}}},
{ru:"хохол дыбом и осесть",w:5,d:3.0,m:"x",f:(p,S)=>{
  PAR.crest=parHold(p,.1,.45);PAR.ruff+=parBell(p)*.05;PAR.look=Math.sin(p*9.4)*.8;}},
{ru:"расхаживать",w:4,d:3.4,m:"x",f:(p,S)=>{
  PAR.step=Math.sin(p*6.283)*20;PAR.crest=parHold(p,.2,.2)*.6;
  PAR.footUp=Math.abs(Math.sin(p*18.8))*.4;}},
{ru:"вспорхнуть на месте",w:3,d:2.2,m:"x",f:(p,S)=>{
  if(!S.o){S.o=1;PAR.hopV+=20;PAR.flapV+=17;PAR.crestV+=10;}
  PAR.fan=parBell(p)*.9;}},
{ru:"огрызнуться",w:4,d:1.6,m:"x",f:(p,S)=>{
  if(!S.o){S.o=1;PAR.peck=1;PAR.crestV+=12;}
  PAR.beak=parBell(p);PAR.bow=parBell(p)*.5;}},
{ru:"плясать",w:3,d:3.6,m:"x",f:(p,S)=>{
  PAR.step=Math.sin(p*15.7)*9;PAR.bow=(1-Math.cos(p*15.7))*.28;
  PAR.crest=parHold(p,.2,.2)*.7;PAR.footUp=Math.abs(Math.sin(p*15.7))*.4;}},
/* ── сонная: копится сама, сбрасывается тычком ── */
{ru:"моргать медленно",w:7,d:3.2,m:"s",f:(p,S)=>{
  PAR.tuck=parHold(p,.3,.3)*.4;
  if(Math.random()<.05){PAR.blink=1;PAR.blinkAt=PAR.t+1.2;}}},
{ru:"клевать носом",w:6,d:4.2,m:"s",f:(p,S)=>{
  PAR.bow=(1-Math.cos(p*9.4))*.30;PAR.tuck=parHold(p,.2,.2)*.6;
  if(Math.random()<.08)PAR.blink=1;}},
{ru:"спрятать голову",w:5,d:6.5,m:"s",f:(p,S)=>{
  PAR.tuck=parHold(p,.14,.16);PAR.footUp=parHold(p,.2,.2)*.9;
  PAR.blink=Math.max(PAR.blink,parHold(p,.2,.2));}},
{ru:"дремать на одной лапе",w:4,d:7.5,m:"s",f:(p,S)=>{
  PAR.tuck=parHold(p,.12,.14)*.8;PAR.footUp=parHold(p,.1,.1);
  PAR.blink=Math.max(PAR.blink,parHold(p,.18,.18)*.9);}},
{ru:"проснуться",w:4,d:2.6,m:"s",f:(p,S)=>{
  PAR.yawn=parBell(p)*.8;PAR.shiver=parBell(p)*.9;PAR.fan=parBell(p)*.5;
  if(!S.o&&p>.5){S.o=1;PAR.crestV+=8;PAR.sleep=0;}}},
/* ── трюки: редкие по весу и по настроению ── */
{ru:"повиснуть вниз головой",w:1,d:5.0,m:"c",f:(p,S)=>{
  PAR.hang=parHold(p,.22,.22);
  PAR.fan=parHold(p,.3,.3)*.5;PAR.crest=parHold(p)*.4;}},
{ru:"качнуться на висе",w:1,d:6.0,m:"c",f:(p,S)=>{
  PAR.hang=parHold(p,.18,.18);
  PAR.lean=Math.sin(p*12.5)*.28;PAR.fan=parHold(p,.25,.25)*.7;}},
{ru:"повисеть и вернуться",w:1,d:4.4,m:"c",f:(p,S)=>{
  PAR.hang=parBell(p);PAR.footUp=parBell(p)*.5;
  if(!S.o&&p>.5){S.o=1;PAR.flapV+=7;}}}
];

/* ── жеребьёвка ──
   Вес, настроение и запрет на повтор двух последних. Без запрета случайность
   выдаёт «переступить, переступить, переступить» — и весь репертуар пропадает
   зря именно в те минуты, когда на птицу смотрят. */
let PAR_LAST=[];
function parMood(){
  if(PAR.mad>.25)return "x";
  if((PAR.sleep||0)>.62)return "s";
  return "c";
}
function parPickAct(){
  const m=parMood();
  let sum=0;const pool=[];
  for(const a of PAR_ACT){
    /* повадка без настроения годится всегда: настроение меняет не набор
       целиком, а его окраску — иначе сонная птица разучилась бы чесаться */
    if(a.m&&a.m!==m)continue;
    if(PAR_LAST.indexOf(a)>=0)continue;
    /* профильная повадка в своём настроении весит втрое. Без этого сонная
       птица чаще чистит перо, чем дремлет: нейтральных повадок вчетверо
       больше, и настроение читалось бы только по статистике, а не глазами */
    const w=a.m===m?a.w*3:a.w;
    sum+=w;pool.push([a,w]);
  }
  if(!pool.length)return PAR_ACT[0];
  let r=Math.random()*sum;
  for(const e of pool){
    r-=e[1];
    if(r<=0){PAR_LAST.push(e[0]);if(PAR_LAST.length>2)PAR_LAST.shift();return e[0];}
  }
  return pool[pool.length-1][0];
}
/* ── ход ──
   Вызывается из `parStep` последним: сначала пружины и рябь, потом повадка
   переписывает свои степени свободы поверх них. */
function parActs(dt){
  /* сонливость копится сама, тратится движением и обнуляется сном. Одного
     накопления мало: без расхода она упирается в потолок и висит там, и
     птица, за которой смотрят полчаса, дремлет три четверти времени —
     измерено, а не предположено. */
  PAR.sleep=Math.max(0,Math.min(1,(PAR.sleep||0)+dt*.008-PAR.mad*dt*2.5));
  /* дрёма — фаза, а не финал: она сама кончается через полминуты. Модель
     «сонливость тратится сонной повадкой» была верна на бумаге и неверна на
     деле — сонная повадка выпадала раз в пару минут, и птица, за которой
     смотрят полчаса, дремала три четверти времени. Здесь конец дрёмы не
     зависит от жребия вовсе. */
  if(PAR.sleep>.62){
    if(!PAR.napT)PAR.napT=PAR.t;
    else if(PAR.t-PAR.napT>24+((PAR.napT*7)%14)){PAR.sleep=0;PAR.napT=0;}
  }else PAR.napT=0;
  if(PAR.act){
    PAR.actT+=dt;
    const p=PAR.actT/PAR.actDur;
    PAR.act.f(Math.min(1,p),PAR.st);
    if(p>=1){
      /* сон отсыпается: сонная повадка сама убавляет сонливость, иначе окно,
         открытое надолго, усыпляет птицу навсегда — за полчаса наблюдения
         девять повадок из полусотни не выпадали ни разу */
      if(PAR.act.m==="s")PAR.sleep=0;
      PAR.act=null;PAR.actNext=PAR.t+.5+Math.random()*2.6;}
    return;
  }
  if(PAR.t<PAR.actNext)return;
  const a=parPickAct();
  PAR.act=a;PAR.actT=0;PAR.st={};
  PAR.actDur=a.d*(.85+Math.random()*.3);
}
