/* ══════════════ Директор (M371, §15) ══════════════
   Автор: «продумай, чтобы оно месяц без тебя автономно могло жить… ты рулящий
   верхнеуровнево». Директор — это не сюжет и не расписание, а РИТМ: он следит,
   чтобы в галактике не наступала тишина дольше четырёх сводок, чтобы после
   пика был спад, и чтобы ничего не разгонялось до бесконечности.

   Три вида событий (§15): происшествие — одна сводка и одна строка; дуга —
   от четырёх до двадцати сводок со стадиями и обязательной развязкой; обряд —
   то, в чём участвуют игроки (объявляется здесь, работает с M379).

   Напряжение — целое 0…1000 на державу плюс общее по галактике. Оно растёт от
   происшествий и войн и падает в тишине; пик держится не дольше трёх суток
   (12 сводок), тишина — не дольше двух. Это тот самый режиссёр из Left 4 Dead,
   только на шестичасовом шаге и целыми числами.

   Всё детерминировано: те же зерно и номер сводки — те же события у всех. */
const DIR_FAMILY=["econ","soc","nature","power","diplo","sec","cult"];
/* происшествия: семья, ключ, и то, насколько поднимают напряжение */
const DIR_INCIDENTS=[
  {k:"vein",   f:"econ",  up:40},   /* жила в поясе: туда летят все */
  {k:"fair",   f:"econ",  up:0},    /* ярмарка */
  {k:"embargo",f:"econ",  up:90},
  {k:"strike", f:"soc",   up:60},
  {k:"holiday",f:"soc",   up:0},
  {k:"refugee",f:"soc",   up:70},
  {k:"storm",  f:"nature",up:50},
  {k:"swarm",  f:"nature",up:60},
  {k:"drain",  f:"nature",up:40},
  {k:"coup",   f:"power", up:150},
  {k:"purge",  f:"power", up:130},
  {k:"envoy",  f:"diplo", up:0},
  {k:"spy",    f:"sec",   up:110},
  {k:"patrol", f:"sec",   up:30},
  {k:"census", f:"cult",  up:0},
  {k:"cult",   f:"cult",  up:40}
];
const DIR_ARCS=["shortage","frontier","succession","expedition","quarantine","goldrush"];
/* обряды §14 своими именами (M379): Директор их объявляет, `12au-rites` знает,
   что они значат и что делают */
const DIR_RITES=["build","loan","subbot","coupon","quar","lost","census","amnesty",
  "reform","regatta"];
const DIR_QUIET=4;      /* дольше четырёх сводок без события галактика не молчит */
/* пик держится не дольше трёх суток (§15) — а это ДВЕНАДЦАТЬ сводок вместе со
   спадом, а не двенадцать сводок до него: считать надо то, что видит игрок */
const DIR_PEAK=8;
const DIR_ARC_MAX=20;   /* дуга обязана кончиться */
/* ── сезон: восемь ручек, раз в месяц или никогда (§15) ──
   Регулятор (это Клод раз в месяц, §12) может положить сезон; если его нет или
   он не проходит проверку — «автопилот»: умеренное напряжение и тема от зерна
   месяца. Плохой сезон не ломает ничего и не применяется вовсе. */
const DIR_THEMES=["месяц дефицита","весна строек","тихий месяц","месяц перемен",
  "месяц дорог","месяц отчётов"];
function chronMonth(N){return Math.floor((N|0)/120);}
function chronSeasonValid(s){
  if(!s||typeof s!=="object")return false;
  if(typeof s.tension!=="number"||s.tension<0||s.tension>1000)return false;
  if(typeof s.theme!=="string"||!s.theme.length||s.theme.length>40)return false;
  if(s.arcs&&!Array.isArray(s.arcs))return false;
  if(s.arcs&&s.arcs.some(a=>DIR_ARCS.indexOf(a)<0))return false;
  if(s.rites&&(!Array.isArray(s.rites)||s.rites.some(a=>DIR_RITES.indexOf(a)<0)))return false;
  return true;
}
function chronSeason(N){
  const m=chronMonth(N);
  const put=(typeof G!=="undefined"&&G.warSeason&&G.warSeason.m===m)?G.warSeason.s:null;
  if(chronSeasonValid(put))return put;
  /* автопилот */
  const h=hashi(m,0x5EA,CHRON_SEED);
  return {tension:420+(h%180),theme:DIR_THEMES[h%DIR_THEMES.length],
    arcs:DIR_ARCS,rites:DIR_RITES,auto:1};
}
/* ── один шаг Директора (шаг 3 в §16.2) ── */
function chronDirector(st,N){
  const S=chronSeason(N);
  const rr=(a,b)=>hashi(N,a,(b|0)^0x0D18);
  if(!st.dir)st.dir={quiet:0,peak:0,calm:0,tens:0,last:{},arcs:[],rites:[]};
  const D=st.dir;
  /* напряжение галактики тянется к сезонной цели и растёт от войн */
  const wars=st.wars.length;
  const target=clampi(S.tension+wars*120,0,1000);
  /* ── подъём, пик, СПАД ──
     Первый заход сбрасывал напряжение на пике и тут же получал его обратно от
     происшествий той же сводки: пик длился сорок сводок вместо двенадцати
     (замер 0.371.0). Спад поэтому не «минус двести шестьдесят», а ОКНО: пока
     оно идёт, происшествия напряжение не поднимают вовсе. */
  if(D.calm>0){
    D.calm--;
    D.tens=clampi(D.tens-120,0,1000);
    D.peak=0;
  }else{
    D.tens=clampi(D.tens+((target>D.tens)?18:-14),0,1000);
    if(D.tens>800)D.peak++;else D.peak=0;
    if(D.peak>DIR_PEAK){D.calm=5;D.peak=0;}
  }
  let any=false;
  /* происшествия: у каждой державы свой бросок, и один вид не повторяется
     раньше чем через десять сводок */
  for(let i=0;i<6;i++){
    if((rr(i,0x11)%1000)>=350)continue;
    const pool=DIR_INCIDENTS.filter(x=>((N-(D.last[i+"|"+x.k]||-99))>10));
    if(!pool.length)continue;
    const inc=pool[rr(i,0x22)%pool.length];
    D.last[i+"|"+inc.k]=N;
    st.powers[i].tension=clampi(st.powers[i].tension+inc.up,0,1000);
    if(D.calm<=0)D.tens=clampi(D.tens+(inc.up/3|0),0,1000);
    chronLine(st,N,"inc",i,null,{k:inc.k,f:inc.f});
    any=true;
  }
  /* дуги: начинаются редко и обязаны кончиться — либо своей развязкой, либо
     развязкой по умолчанию на двадцатой сводке */
  for(let i=0;i<6;i++){
    const cur=D.arcs.find(a=>a.p===i);
    if(!cur){
      if(D.tens<820&&(rr(i,0x33)%1000)<120){
        const allow=(S.arcs&&S.arcs.length)?S.arcs:DIR_ARCS;
        const kind=allow[rr(i,0x44)%allow.length];
        D.arcs.push({p:i,kind,t0:N,stage:0});
        chronLine(st,N,"arc",i,null,{k:kind,stage:0});
        any=true;
      }
    }else{
      const age=N-cur.t0;
      if(age>=DIR_ARC_MAX||((rr(i,0x55)%1000)<140&&age>=4)){
        chronLine(st,N,"arcend",i,null,{k:cur.kind,forced:age>=DIR_ARC_MAX?1:0});
        D.arcs.splice(D.arcs.indexOf(cur),1);
        any=true;
      }else if(age>0&&age%4===0&&cur.stage<4){
        cur.stage++;
        chronLine(st,N,"arc",i,null,{k:cur.kind,stage:cur.stage});
        any=true;
      }
    }
  }
  /* обряды: объявляются, пока их меньше трёх; работают с M379 */
  D.rites=D.rites.filter(r=>N-r.t0<12);
  if(D.rites.length<3&&(rr(0,0x66)%1000)<200){
    const allow=(S.rites&&S.rites.length)?S.rites:DIR_RITES;
    const kind=allow[rr(1,0x77)%allow.length];
    const p=rr(2,0x88)%6;
    D.rites.push({kind,p,t0:N});
    chronLine(st,N,"rite",p,null,{k:kind});
    any=true;
  }
  /* ── гарантия жизни ──
     Четыре сводки подряд без единого события — это сутки тишины, и она
     кончается не «когда-нибудь», а принудительно: Директор объявляет
     происшествие сам. Без этой строки месяц без игрока превращается в
     пустой лог, и никакие вероятности этого не чинят. */
  D.quiet=any?0:D.quiet+1;
  if(D.quiet>=DIR_QUIET){
    const i=rr(3,0x99)%6;
    const inc=DIR_INCIDENTS[rr(4,0xAA)%DIR_INCIDENTS.length];
    D.last[i+"|"+inc.k]=N;
    chronLine(st,N,"inc",i,null,{k:inc.k,f:inc.f,forced:1});
    D.quiet=0;
  }
  /* ограничители §15: сила восстанавливается, но держава не падает ниже
     трети своего дома — ниже этого она «выживает», а не исчезает */
  for(let i=0;i<6;i++){
    const P=st.powers[i];
    P.str=clampi(P.str+((1000-P.str)/12|0),100,1000);
  }
}
/* сколько сейчас идёт дуг и обрядов — для новостей и тестов */
function chronArcs(){const st=chronState();return (st.dir&&st.dir.arcs)||[];}
function chronRites(){const st=chronState();return (st.dir&&st.dir.rites)||[];}
function chronTension(){const st=chronState();return (st.dir&&st.dir.tens)|0;}
