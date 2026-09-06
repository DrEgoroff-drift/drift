/* ══════════════ девять законов трудности (M401, DESIGN-base §22) ══════════════
   Трудно — это не большие числа. Большие числа — это скука. Из девяти законов
   §22 шесть уже стоят в игре и работают: всё трогает три шкалы (M391–M393),
   отклик отложен на смены (M390), место — самая дорогая валюта (M396), беда
   спускается лавиной (M392→M397), планета и есть сложность (M400), а вторая
   база — ловушка, которую никто не сторожит.

   Здесь достраиваются три оставшихся, и все три — про то, чего у игрока НЕТ.

   ЗАКОН ТРЕТИЙ: сведения покупаются. Без радиста и без приборов шкалы читаются
   словами — «мало · впритык · хватает», — а прогноз звучит «барограф падает», а
   не «буря через три смены». Точность — это человек и вещь, а не подарок.

   ЗАКОН ЧЕТВЁРТЫЙ: изнашивается всё. База в идеальном равновесии выходит из
   него сама, и чем дальше тепло от полосы покоя, тем быстрее. Ничто никогда не
   доделано.

   ЗАКОН ПЯТЫЙ: люди — не множители. У вахтовика есть черты, и лучший список —
   не список самых умелых: один боится тесноты, другой не спит у реактора,
   третий пьёт, а четвёртый не ладит с конкретным человеком.

   И сторож надо всеми девятью: ТРУДНО, НО НЕ НЕПОНЯТНО. Игрок обязан всегда
   мочь сказать, что убило базу, — на это отвечает `baseWhy`. */
/* ── закон 3: сведения покупаются ── */
function baseSharp(B){
  let s=0;
  /* радист на базе — тот, кто снимает показания и передаёт их словами цифр */
  if(typeof baseRoleForce==="function"&&baseRoleForce(B,"radist")>0)s++;
  /* ── приборы на борту (разбор 0.409.1) ──
     Порог стоял на ЧИСЛЕ, а число у казённого приёмника гуляет: разброс
     экземпляра (05b) и профессия корпуса поднимают его выше любого порога, и
     цифры получались у всех с первой минуты — «большинство летает на
     прилагательных» оставалось фразой в шапке. Считается не число, а ЗАВОД:
     нужен приёмник лучше того, что ставят на верфи, и не разбитый. */
  if(typeof instrUnit==="function"&&typeof instrWorks==="function"){
    const u=instrUnit("radio");
    if(instrWorks(u).res>1&&clamp(u.wear||0,0,1)<.6)s++;
  }
  return s;
}
const SHARP_WORD=["нет","мало","впритык","хватает"];
function sharpWord(v,need){
  if(!need)return v>0?"хватает":"нет";
  const k=v/need;
  return k<=0?"нет":(k<3?"мало":(k<8?"впритык":"хватает"));
}
/* строка запасов на том языке, который игрок себе позволил */
function baseGaugeLine(B){
  const L=baseLife(B),n=Math.max(1,baseCrewN(B));
  if(baseSharp(B)>0)
    return "воздух "+L.air+" · вода "+L.water+" · харч "+(L.food|0);
  return "воздух — "+sharpWord(L.air,n*LIFE_AIR)+
       " · вода — "+sharpWord(L.water,n*LIFE_WATER)+
       " · харч — "+sharpWord(L.food|0,n*LIFE_FOOD);
}
/* прогноз: слово или срок */
function baseWarnLine(B,n){
  if(typeof baseForecast!=="function")return "";
  const f=baseForecast(B,n);
  if(!f)return "";
  if(baseSharp(B)>=2)return f.ru.toUpperCase()+" ЧЕРЕЗ СМЕНУ";
  return f.warn.toUpperCase();
}
/* ── закон 4: изнашивается всё ──
   По одной ячейке за смену, и всегда одной и той же для одной и той же смены.
   В полосе покоя износ едва заметен; за её краем он тот, что уже написан в
   M392, — этот только добавляет ровное «ничто не доделано». */
/* Ровный износ — это «ничто не доделано», а не «база съедает себя». Первая
   мерка (0.006 плюс полшага за жару) стирала отсек за десяток смен и была не
   законом, а поломкой: одна ячейка за смену, и та вразнобой, — значит цифра
   должна быть такой, чтобы инженер и мастерская её перекрывали, а брошенная
   база к этому приходила за неделю, а не за вечер. */
const WEAR_BASE=.004;
function baseWearStep(B,n){
  const live=[];
  for(let i=0;i<B.cells.length;i++)if(B.cells[i]&&B.cells[i].hp>0)live.push(i);
  if(!live.length)return 0;
  const r=rng(hashi(B.sx*401+B.sy,(B.idx|0)*19+13,hashi(n,0x0EA7,0x1)));
  const i=live[Math.floor(r()*live.length)];
  const h=(typeof baseHeat==="function")?Math.abs(baseHeat(B,n)):0;
  const far=clamp((h-HEAT_OK)/2500,0,.04);
  const was=B.cells[i].hp;
  B.cells[i].hp=Math.max(0,was-(WEAR_BASE+far));
  if(was>0&&B.cells[i].hp<=0){
    baseLog(B,"worn",n,{what:BUILD[B.cells[i].k].ru});
    return 1;
  }
  return 0;
}
/* ── закон 5: люди — не множители ──
   Черты вахтовика выводятся из его же семени: ничего нового не хранится, а
   список людей перестаёт быть списком чисел. */
const CREW_BASE_TRAITS=[
  {id:"tight", ru:"боится тесноты",  note:"на большой базе ему тяжело"},
  {id:"drink", ru:"пьёт",            note:"смену через смену работает вполсилы"},
  {id:"noreac",ru:"не спит у реактора",note:"жильё рядом с реактором его добивает"},
  {id:"lone",  ru:"нелюдим",         note:"в полном отсеке от него мало толку"}
];
function crewBaseTraits(c){
  if(!c)return [];
  const r=rng(hashi((c.seed|0)*7+3,0x0B7A,0x5));
  const out=[];
  if(r()<.45)out.push(CREW_BASE_TRAITS[Math.floor(r()*CREW_BASE_TRAITS.length)]);
  return out;
}
function crewBaseHas(c,id){
  for(const t of crewBaseTraits(c))if(t.id===id)return true;
  return false;
}
/* что черты делают с духом базы: каждая — своя причина, и все они называются */
function baseTraitSpirit(B){
  if(typeof baseStaff!=="function")return 0;
  const staff=baseStaff(B);
  let s=0;
  const built=(typeof charterBuilt==="function")?charterBuilt(B):0;
  const P=(typeof basePower==="function")?basePower(B):{habPenalty:0};
  for(const c of staff){
    if(crewBaseHas(c,"tight")&&built>=8)s-=6;
    if(crewBaseHas(c,"noreac")&&(P.habPenalty|0)>0)s-=6;
    if(crewBaseHas(c,"lone")&&staff.length>=4)s-=5;
    if(crewBaseHas(c,"drink"))s-=3;
  }
  return s;
}
/* пьющий: смену через смену работает вполсилы — по номеру смены, не по кадру */
function baseDrinkMul(B,n){
  if(typeof baseStaff!=="function")return 1;
  let m=1;
  for(const c of baseStaff(B))
    if(crewBaseHas(c,"drink")&&((n+(c.seed|0))%2===0))m*=.92;
  return m;
}
/* ── сторож: игрок обязан мочь сказать, что убило базу ──
   Не «низкий дух», а имя причины и её вес. Строка эта пишется всегда — и
   словами, если сведения не куплены. */
function baseWhy(B){
  const L=baseLife(B),out=[];
  const n=baseCrewN(B);
  if(!n)return "людей нет — база просто стоит";
  const left=baseLifeLeft(B);
  if(baseParked(B))out.push(B.park<0?"стоит по вашему приказу":"встала: запас кончился");
  if((L.food|0)<=0)out.push("нечего есть");
  else if(L.q==="poor")out.push("харч скверный");
  if(left.air<3)out.push("воздуха на исходе");
  if(left.water<3)out.push("воды на исходе");
  const b=(typeof baseHeatBand==="function")?baseHeatBand(B):0;
  if(b>0)out.push("жарко");else if(b<0)out.push("холодно");
  const P=basePower(B);
  if(P.eff<.7)out.push("энергии не хватает");
  if((P.habPenalty|0)>0)out.push("жильё прижато к реактору");
  if(B.fire)out.push("горит");
  const tr=baseTraitSpirit(B);
  if(tr<0)out.push("людям тут не по себе");
  if(!out.length)return "всё в порядке: дух "+baseSpirit(B)+"%";
  return out.join(" · ");
}
