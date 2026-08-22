/* ══════════════ зеркало: чужой эфир без источника ══════════════
   M134. Транзитная область (06c, `mirror`), через которую все летают и
   которую знают только по скверной связи. На окраине — обрывки чужого эфира
   без источника: строка приходит, и через тридцать семь секунд приходит ещё
   раз, слово в слово. Диспетчеры отмахиваются: отражение.

   ЯДРО — НЕ ИСТОЧНИК, А ЗЕРКАЛО. Место, где старые отражения лежат друг на
   друге десятками, со всех курсов и из всех лет. Всегда тридцать семь секунд.
   Источник — вне сферы, дальше, чем кто-либо летает; наградой — координата,
   до которой не долететь.

   ПРАВИЛА ФАЙЛА:
   1. Фраза не выдумывается (M116): отражение — это строка, которая уже есть
      в эфире (11b) или в быту ядра ниже. Зеркало ничего не сочиняет.
   2. Содержание бытовое: сигнал времени, фраза без интонации, перекличка.
      «Их, наверное, давно нет» доходит только через обыкновенное.
   3. Зеркало — находка семьи 17b: тот же подход, то же действие. Оно не
      берётся и не кончается: слушать можно сколько угодно, пеленг — один раз.
   4. Ничего не хранится, кроме факта, что пеленг уже дан (G.mirror). */

const MIRROR_DELAY=37*60;              // кадров: тридцать семь секунд, всегда
const MIRROR_CORE=[
  "…сигнал точного времени. Шесть часов. Шесть часов. Шесть часов.",
  "…второй на месте. Четвёртый на месте. Пятый. Пятый? Пятый на месте.",
  "…повторяю для ночной смены: повторяю для ночной смены: повторяю для ночной…",
  "…температура по жилому ярусу девятнадцать. По складу восемь. Конец сводки.",
  "…дежурный, принял. Дежурный, принял. Дежурный, принял.",
  "…кто забыл кружку в рубке — заберите. Кто забыл кружку в рубке…"
];
function mirrorAll(){return (G.mirror||(G.mirror={bearing:0}));}
/* на окраине зеркала: в области, но не в её ядре */
function mirrorDepthHere(){
  if(typeof regionAt!=="function")return 0;
  const R=regionAt(G.sx,G.sy);
  if(R.theme!=="mirror")return 0;
  return (R.core.sx===G.sx&&R.core.sy===G.sy)?2:(regionDepth(G.sx,G.sy)>0?1:0);
}
/* ── окраина: эхо ──
   etherTick зовёт это после того, как выдал строку. Если мы на окраине зеркала,
   строка запомнится и вернётся через тридцать семь секунд. Мир не хранит эхо:
   улетели — не услышали. */
function mirrorEchoArm(line){
  if(mirrorDepthHere()!==1||line==null)return;
  G.mirrorEcho={line,at:G.t+MIRROR_DELAY,key:G.sys?G.sys.key:""};
}
function mirrorEchoTick(){
  const E=G.mirrorEcho;if(!E)return;
  if(G.mode!=="system"||!G.sys||G.sys.key!==E.key){G.mirrorEcho=null;return;}
  if(G.t<E.at)return;
  G.mirrorEcho=null;
  logAdd("dim",E.line);
  /* диспетчер отмахивается — изредка, иначе объяснение забьёт само явление */
  if(Math.random()<.3)logAdd("dim","…это отражение, не отвечайте. Отражение, говорю. Летите себе.");
}
/* ── ядро: зеркало как находка ──
   В ядре всегда есть одна находка вида `echo`. Слушать — значит получить
   несколько старых отражений разом; они наслаиваются, поэтому строк две-четыре. */
function mirrorFind(sys){
  const R=regionAt(sys.sx,sys.sy);
  if(R.theme!=="mirror"||R.core.sx!==sys.sx||R.core.sy!==sys.sy)return null;
  const r=rng(hashi(sys.seed|0,0x3E1,0x5E));
  const a=r()*TAU,rad=900+r()*900;
  return {i:9,k:"echo",seed:hashi(sys.seed|0,0x3E1,0x5F),x:Math.cos(a)*rad,y:Math.sin(a)*rad,id:sys.key+":echo"};
}
function mirrorListen(f){
  const r=rng(hashi(f.seed,(G.t/MIRROR_DELAY)|0,0x3E2));
  const pool=MIRROR_CORE.concat(ETHER);
  const n=2+Math.floor(r()*3),out=[];
  for(let i=0;i<n;i++){const l=pick(pool,r);if(out.indexOf(l)<0)out.push(l);}
  for(const l of out)logAdd("dim",l);
  const M=mirrorAll();
  let tail="тридцать семь секунд. Всегда тридцать семь.";
  if(!M.bearing){
    /* источник вне сферы: координата, до которой не долететь. Дальность
       считается от радиуса опасности (sysDanger=1 на 40), втрое дальше */
    const a2=rng(hashi(f.seed,0xBEA5,13))()*TAU,d=120+Math.round(r()*40);
    const sx=Math.round(Math.cos(a2)*d),sy=Math.round(Math.sin(a2)*d);
    M.bearing=1;
    if(typeof loreMarks==="function")loreMarks().push({sx,sy,id:"mirror"});
    tell("tech","Пеленг источника: сектор "+sx+":"+sy,
      "Источник вне сферы\nпеленг: сектор "+sx+":"+sy+"\nметка на карте");
    tail+="\nИсточник — сектор "+sx+":"+sy+". Туда никто не летает.";
  }
  return out.join("\n")+"\n"+tail;
}
