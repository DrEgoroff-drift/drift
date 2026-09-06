/* ══════════════ циркуляры и конституция (M381, §12, D18) ══════════════
   Автор: «ты будешь как регулятор всего, а без тебя там всё происходит само».
   Значит нужен слой, который (а) действует редко и сверху, (б) НИКОГДА не может
   тронуть то, что игрок нажил, и (в) проверяется машиной, а не совестью.

   Циркуляр — запись в той же летописи, только автор у неё не зерно, а регулятор
   (это Клод, раз в день или раз в неделю, через ssh). Клиенты забирают циркуляры
   вместе с ведомостями и повторяют историю с ними: значит мир у всех один, а
   регулятору не нужно быть в сети.

   **Конституция** (`docs/WAR-CONSTITUTION.md`) — это не пожелание, а список,
   который проверяет `circValid`. Что можно: веса нужд ±30 %, названные события,
   тексты волн на день, ручки §11.5 ±20 %, сезон. Что нельзя НИКОГДА: трогать
   вещи и деньги игроков, стирать эпизоды, убивать людей из книжек, отменять
   «закреплено». Проверка одна и та же на клиенте и в CLI: циркуляр, который её
   не прошёл, не применяется вовсе — и это единственный способ сделать так,
   чтобы регулятор не мог сам себя переубедить. */
const CIRC_EVENTS=["election","strike","embargo","ultimatum","truce","build","revizia"];
const CIRC_DIALS=["sat","ceiling","bosstrig","leftlife","rally"];
const CIRC_MAX_TEXT=280;
function circAll(){
  if(typeof warStore!=="function")return [];
  const o=warStore();
  return Array.isArray(o.circ)?o.circ:[];
}
function circPut(list){
  if(typeof warStoreSet!=="function")return;
  const keep=list.filter(c=>circValid(c)).slice(-24);
  warStoreSet({circ:keep});
}
/* ── проверка по конституции ──
   Каждая строка ниже — это строка из `docs/WAR-CONSTITUTION.md`, и расходиться
   им нельзя: тест сверяет одно с другим. */
function circValid(c){
  if(!c||typeof c!=="object")return false;
  if(!(typeof c.n==="number"&&c.n>=0))return false;
  /* веса нужд: только шесть держав, только четыре нужды, только ±30 % */
  if(c.need){
    if(typeof c.need!=="object")return false;
    for(const by in c.need){
      if(typeof HULL_MAKER==="undefined"||!HULL_MAKER[by])return false;
      const w=c.need[by];
      if(typeof w!=="object")return false;
      for(const k in w){
        if(["ore","goods","hulls","link"].indexOf(k)<0)return false;
        const v=+w[k];
        if(!isFinite(v)||v<-30||v>30)return false;
      }
    }
  }
  /* названные события — только из списка, и только про существующие державы */
  if(c.event){
    if(CIRC_EVENTS.indexOf(c.event.kind)<0)return false;
    if(c.event.p!==undefined&&(typeof HULL_MAKER==="undefined"||!HULL_MAKER[MAKER_KEYS[c.event.p|0]]))return false;
  }
  /* ручки §11.5 — не больше пятой части в любую сторону */
  if(c.dials){
    for(const k in c.dials){
      if(CIRC_DIALS.indexOf(k)<0)return false;
      const v=+c.dials[k];
      if(!isFinite(v)||v<-20||v>20)return false;
    }
  }
  /* тексты волн: шесть строк, короткие, без переносов и без адресатов */
  if(c.say){
    for(const by in c.say){
      if(typeof HULL_MAKER==="undefined"||!HULL_MAKER[by])return false;
      const t=c.say[by];
      if(typeof t!=="string"||!t.length||t.length>CIRC_MAX_TEXT)return false;
      if(/[<>@]/.test(t))return false;
    }
  }
  /* сезон — по своей же проверке (M371) */
  if(c.season&&!(typeof chronSeasonValid==="function"&&chronSeasonValid(c.season)))return false;
  /* и ни одного поля, которого конституция не знает: запрет здесь именно в
     ЭТОЙ строке — иначе завтра появится «ещё одно маленькое поле» */
  for(const k in c)
    if(["n","need","event","dials","say","season","who","ru"].indexOf(k)<0)return false;
  return true;
}
/* ── что циркуляр делает в шаге 2 повтора (§16.2) ── */
function circFor(N){
  let best=null;
  for(const c of circAll())if(c.n<=N&&(!best||c.n>best.n))best=c;
  return best;
}
function circApply(st,N){
  const c=circFor(N);
  if(!c||!circValid(c))return null;
  if(c.need)for(const by in c.need){
    const i=MAKER_KEYS.indexOf(by);
    if(i<0)continue;
    for(const k in c.need[by])
      st.powers[i].need[k]=clampi(st.powers[i].need[k]+((+c.need[by][k]*10)|0),0,1000);
  }
  if(c.event&&c.event.kind==="truce"){
    /* перемирие с датой: войны кончаются, но систем никто не отдаёт */
    for(let i=st.wars.length-1;i>=0;i--){
      const w=st.wars[i];
      st.wars.splice(i,1);
      st.powers[w.a].rel[w.b]=clampi(st.powers[w.a].rel[w.b]+300,-1000,1000);
      st.powers[w.b].rel[w.a]=st.powers[w.a].rel[w.b];
    }
    chronLine(st,N,"truce",c.event.p|0,null,{b:(c.event.p|0)});
  }
  if(c.event&&c.event.kind==="embargo"&&c.event.p!==undefined){
    const i=c.event.p|0;
    st.powers[i].need.goods=clampi(st.powers[i].need.goods-120,0,1000);
  }
  if(c.event&&c.event.kind==="ultimatum"&&c.event.p!==undefined){
    const i=c.event.p|0;
    st.powers[i].tension=clampi(st.powers[i].tension+200,0,1000);
  }
  return c;
}
/* ── бумага ──
   Циркуляр виден в игре именно как БУМАГА: у ГЛАВТРАССЫ это циркуляр, у
   Компании пресс-релиз, у Орднунга приказ с номером. Сатира замыкается на самом
   регуляторе, и это правильно: он тоже бумага сверху. */
const CIRC_PAPER={gt:"ЦИРКУЛЯР",co:"ПРЕСС-РЕЛИЗ",or:"ПРИКАЗ",km:"ОБРАЩЕНИЕ",
  ra:"ОБЪЯВЛЕНИЕ",hf:"ОБНОВЛЕНИЕ"};
function circPaperName(by){return CIRC_PAPER[by]||"ЦИРКУЛЯР";}
function circSay(by,N){
  const c=circFor(N===undefined?chronNow():N);
  if(!c||!c.say)return "";
  return c.say[by]||"";
}
function circBlock(){
  if(typeof $body==="undefined")return;
  const c=circFor(chronNow());
  if(!c)return;
  const by=(typeof chronWave==="function")?chronWave():"gt";
  const P=(typeof powerOf==="function")?powerOf(by):null;
  const t=circSay(by)||(c.ru||"");
  if(!t)return;
  $body.appendChild(el("div","sec",circPaperName(by)+" · СВОДКА "+((c.n|0)%1000)+
    (P?" · "+P.ru.toUpperCase():"")));
  const r=el("div","row");
  r.appendChild(el("div","nm","<b>"+t+"</b><s>бумага сверху; её читают все, и она ничего "+
    "не может отнять — ни вещи, ни эпизода, ни человека</s>"));
  $body.appendChild(r);
}
