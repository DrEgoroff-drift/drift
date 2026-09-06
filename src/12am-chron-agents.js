/* ══════════════ шесть агентов (M370, §7.5, §16.2 шаг 4) ══════════════
   Держава — не таблица настроений, а АГЕНТ с нуждами. У каждой четыре нужды в
   промилле (руда, товары, корпуса, связь), сила, отношения к пятерым и ход раз
   в сводку. Ход выбирается не «настроением», а тем, чего не хватает: у кого
   просела руда — тот идёт за поясами, у кого связь — за узлами.

   Шесть ходов, ровно как в §16.2: сделка, ссора, война, перемирие, альянс,
   стройка. Ни одного дробного числа: всё целое, броски через `hashi`. */
const CHRON_MOVES=["deal","quarrel","war","truce","ally","build"];
/* чего хочет каждая (§7.1 «wants»), в порядке ключей MAKER_KEYS */
const CHRON_WANT=[
  {ore:1,goods:1,hulls:1,link:2},   /* ГЛАВТРАССА: дорога и связь */
  {ore:0,goods:3,hulls:1,link:1},   /* Компания: товары */
  {ore:1,goods:1,hulls:2,link:1},   /* Орднунг: узлы и корпуса */
  {ore:0,goods:1,hulls:3,link:1},   /* Коммуна: верфи */
  {ore:3,goods:1,hulls:0,link:1},   /* Рассвет: руда */
  {ore:0,goods:1,hulls:1,link:3}    /* Хай-Фронт: связь и маяки */
];
function chronNeedLow(P){
  let k="ore",v=P.need.ore;
  for(const q of ["goods","hulls","link"])if(P.need[q]<v){v=P.need[q];k=q;}
  return k;
}
/* с кем граничим: матрица 6×6 по клеткам круга, считается раз на сводку в
   chronStep и лежит в `st._touch` (кэш, не состояние: в клон не входит).
   Ссорятся и воюют с соседом — у войны без общей границы нет фронта, и до
   M412 половина войн шла «через круг» и не двигала ни одной системы */
function chronTouch(st){
  const T=[];for(let i=0;i<6;i++){T.push([false,false,false,false,false,false]);}
  for(const k of chronKeys()){
    const S=st.systems[k];if(!S||S.owner<0)continue;
    const p=k.split(","),x=p[0]|0,y=p[1]|0;
    for(const d of [[1,0],[0,1]]){
      const Q=st.systems[(x+d[0])+","+(y+d[1])];
      if(!Q||Q.owner<0||Q.owner===S.owner)continue;
      T[S.owner][Q.owner]=true;T[Q.owner][S.owner]=true;
    }
  }
  return T;
}
function chronRelWorst(st,i){
  const T=st._touch;
  let j=-1,v=1001;
  for(let q=0;q<6;q++){if(q===i||(T&&!T[i][q]))continue;if(st.powers[i].rel[q]<v){v=st.powers[i].rel[q];j=q;}}
  if(j>=0||!T)return j;
  for(let q=0;q<6;q++){if(q===i)continue;if(st.powers[i].rel[q]<v){v=st.powers[i].rel[q];j=q;}}
  return j;
}
function chronRelBest(st,i){
  let j=-1,v=-1001;
  for(let q=0;q<6;q++){if(q===i)continue;if(st.powers[i].rel[q]>v){v=st.powers[i].rel[q];j=q;}}
  return j;
}
function chronAtWar(st,a,b){
  for(const w of st.wars)if((w.a===a&&w.b===b)||(w.a===b&&w.b===a))return w;
  return null;
}
/* любая война этой державы: §15 — одна война на державу, две на галактику */
function chronWarOf(st,i){
  for(const w of st.wars)if(w.a===i||w.b===i)return w;
  return null;
}
function chronAtWarAny(st,i){return !!chronWarOf(st,i);}
/* сколько систем j забрал у i за последние сутки — по строкам летописи, они
   хронологичны, и старше суток дальше смотреть незачем */
function chronGrudge(st,N,i,j){
  if(j<0)return 0;
  let n=0;
  for(let q=st.lines.length-1;q>=0;q--){
    const L=st.lines[q];
    if(N-L.N>24)break;
    if(L.kind==="take"&&L.p===j&&L.args&&L.args.from===i)n++;
  }
  return n;
}
const CHRON_NEED_KEYS=["ore","goods","hulls","link"];
/* один ход одной державы */
function chronAgentMove(st,N,i,rr){
  const P=st.powers[i];
  const roll=rr(i,0x9A)%1000;
  const want=CHRON_WANT[i];
  /* ── нужды (M412) ──
     Тают от того, чего держава хочет, и пополняются тем, что она держит.
     Равновесие — у державы размером с дом (~53 системы): меньше дома — нужды
     тают, и она идёт за ними; больше — копятся, и ей есть чем торговать.
     Прежний закон «−20−want·6+hold·(want+1)/12» бил прибыль убылью всегда:
     все шестеро сидели на нуле, ход был вечно «ссора/война», сделок не
     случалось — 24 войны в месяц против 2–4 по §15 (замер 0.401.1,
     docs/warsim.js). Дрожь ±6 от зерна — чтобы равновесие не было мёртвой
     точкой, из которой нечему выйти. */
  for(let q=0;q<4;q++){
    const k=CHRON_NEED_KEYS[q];
    const gain=(P.hold*(want[k]+1)*3/16)|0;
    const use=16+want[k]*6;
    const jit=(rr(i*4+q,0x7E)%13)-6;
    P.need[k]=clampi(P.need[k]-use+gain+jit,0,1000);
  }
  /* война ест: каждая её сводка стоит силы, товаров и корпусов — потому она и
     кончается, и потому после неё есть о чём торговать */
  if(chronAtWarAny(st,i)){
    P.str=clampi(P.str-6,100,1000);
    P.need.goods=clampi(P.need.goods-6,0,1000);
    P.need.hulls=clampi(P.need.hulls-8,0,1000);
  }
  const low=chronNeedLow(P);
  /* отношения тянет к нулю: без этого через сотню сводок все дружат со всеми
     на тысячу и галактика застывает */
  for(let q=0;q<6;q++){
    if(q===i)continue;
    const v=P.rel[q];
    /* §15: пять процентов за сводку (было 2,5: пары примерзали к ±1000) */
    P.rel[q]=v>0?v-((v/20|0)+1):(v<0?v+((-v/20|0)+1):0);
  }
  /* ── курс месяца (M378) ──
     Толпа не правит державой, но подталкивает её: победивший на выборах ответ
     смещает пороги хода. «Держать фронт» — раньше ссорится и воюет; «строить»
     — чаще строит и торгует. Держава при этом остаётся собой. */
  /* курс: то, за что проголосовала толпа, — и то, что от него оставил
     переворот (M385) */
  const course=(typeof powCourse==="function")?powCourse(i,N,st)
    :((typeof voteCourse==="function")?voteCourse(i,N):null);
  const warBias=(course==="war")?90:((course==="build")?-70:0);
  /* ── выбор хода (M412) ──
     Злее всего тот, у кого нужда на дне и есть с кем ссориться, — но за нуждой
     держава сперва идёт ТОРГОВАТЬ (у кого отношения не испорчены), и только
     потом ссориться. Прежний порядок «война, иначе ссора» не давал сделке
     случиться никогда, пока нужда ниже 450, — и нужда не поднималась никогда.
     §15: одна война на державу, две на галактику. */
  const worst=chronRelWorst(st,i),best=chronRelBest(st,i);
  const atWar=chronAtWarAny(st,i);
  const scarce=P.need[low]<450+warBias,dire=P.need[low]<250+warBias;
  /* обида: сколько систем худший забрал у нас за последние сутки. Это и есть
     «спорная граница» §7.5 — повод для ссоры, а с ней и для войны в ответ */
  const grudge=chronGrudge(st,N,i,worst);
  /* ── вероятности ходов, в промилле (таблица §15) ──
     В войне держава мирится тем охотнее, чем дольше воюет, а между делом
     строит и торгует; вне войны — объявляет её, ссорится, торгует, дружит или
     строит, и каждое с вероятностью, которую двигают нужда, обида, напряжение
     и курс месяца. Розыгрыш один на ход, бросок один и тот же (`roll`) */
  let move="build";
  if(atWar){
    const w=chronWarOf(st,i),age=N-w.t0;
    if(P.str<300||roll<60+age*30)move="truce";
    else move=(roll&1)?"build":"deal";
  }else{
    /* воюет тот, кто может: сила выше 450, владений не меньше половины дома
       (карлик у пола §15 выживает, а не воюет), отношения с худшим ниже −200 */
    const canWar=st.wars.length<2&&worst>=0&&!chronAtWarAny(st,worst)&&P.str>450&&
      P.hold*20>=P.home*9&&P.rel[worst]<=-250;
    const partnerOk=best>=0&&P.rel[best]>-50&&st.powers[best].need[low]>=550;   /* у партнёра излишек */
    const pWar=canWar?(35+(dire?80:0)+grudge*60):0;
    const pQuar=(worst>=0)?(20+(scarce?60:0)+(P.tension/40|0)+grudge*60+Math.max(0,warBias)):0;
    const pDeal=(scarce&&partnerOk)?600:(partnerOk?150:40);
    const pAlly=(best>=0&&P.rel[best]>350)?80:0;
    let t=roll;
    if((t-=pWar)<0)move="war";else if((t-=pQuar)<0)move="quarrel";else if((t-=pDeal)<0)move="deal";
    else if((t-=pAlly)<0)move="ally";else move="build";
  }
  /* торгуют и дружат с лучшим; ссорятся и воюют с худшим */
  const j=(move==="ally"||move==="deal")?best:worst;
  if(move==="deal"&&j>=0){
    /* сделка: нужда закрывается тем, что у партнёра в избытке, и обе теплеют.
       Излишек конечен: партнёр отдаёт, и у него становится меньше */
    P.need[low]=clampi(P.need[low]+50,0,1000);
    const Q=st.powers[j];
    Q.need[low]=clampi(Q.need[low]-25,0,1000);
    Q.need[chronNeedLow(Q)]=clampi(Q.need[chronNeedLow(Q)]+35,0,1000);
    P.rel[j]=clampi(P.rel[j]+40,-1000,1000);Q.rel[i]=clampi(Q.rel[i]+40,-1000,1000);
    /* договорились — нота отозвана (M386): это единственный способ отменить
       уже предъявленный срок, и он требует хода, а не времени */
    if(typeof chronUltDrop==="function")chronUltDrop(st,N,i,j);
    if((rr(i,0x0D)%1000)<120)chronLine(st,N,"deal",i,null,{b:j});
  }else if(move==="quarrel"&&j>=0){
    const Q=st.powers[j];
    P.rel[j]=clampi(P.rel[j]-130,-1000,1000);Q.rel[i]=clampi(Q.rel[i]-90,-1000,1000);
    P.tension=clampi(P.tension+120,0,1000);
  }else if(move==="war"&&j>=0&&!chronAtWar(st,i,j)){
    /* сперва бумага (M386): нота со сроком вместо выстрела. Если нот уже три,
       круг больше не ждёт — война начинается сразу */
    if(typeof chronUltFile==="function"&&chronUltFile(st,N,i,j))return move;
    st.wars.push({a:i,b:j,t0:N});
    P.rel[j]=clampi(P.rel[j]-300,-1000,1000);
    st.powers[j].rel[i]=clampi(st.powers[j].rel[i]-300,-1000,1000);
    P.tension=clampi(P.tension+300,0,1000);
    chronLine(st,N,"war",i,null,{b:j});
  }else if(move==="truce"){
    /* мирятся с тем, с кем воюют, — а не с тем, кто сейчас худший: за время
       войны худшим успевает стать третий, и война шла бы до срока всегда */
    const w=chronWarOf(st,i);
    if(w){
      const e=(w.a===i)?w.b:w.a;
      st.wars.splice(st.wars.indexOf(w),1);
      P.rel[e]=clampi(P.rel[e]+280,-1000,1000);
      st.powers[e].rel[i]=clampi(st.powers[e].rel[i]+280,-1000,1000);
      chronLine(st,N,"truce",i,null,{b:e});
    }
  }else if(move==="ally"&&j>=0){
    if(typeof chronUltDrop==="function")chronUltDrop(st,N,i,j);
    P.rel[j]=clampi(P.rel[j]+120,-1000,1000);
    st.powers[j].rel[i]=clampi(st.powers[j].rel[i]+120,-1000,1000);
    P.str=clampi(P.str+12,100,1000);
  }else{
    /* стройка: сила растёт медленно и упирается в то, сколько держава держит */
    const cap=300+P.hold*6;
    P.str=clampi(P.str+((P.str<cap)?16:2),100,1000);
    P.need.goods=clampi(P.need.goods-8,0,1000);
  }
  return move;
}
/* ── ультиматум со сроком (M386, §15.1) ──
   До сегодняшнего дня война возникала из ничего: держава решала воевать, и в
   ту же сводку начинала. Игрок узнавал об этом по чужому бою в небе.

   Теперь между решением и выстрелом лежит бумага. Держава предъявляет ноту со
   сроком; срок виден на станции числом; истёк — война начинается САМА и уже
   ничем не отменяется. Отменить её можно только одним способом: настоящим
   потеплением до срока — сделкой или союзом, а не тем, что обида остыла сама.

   Ход агента при этом не изменился ни на бросок — сдвинулся момент. Зато у
   игрока появилось окно, в котором ещё можно что-то успеть: увезти груз,
   довезти письмо, увести наёмника с той стороны. */
const DIP_ULT_OFF=-120;      /* теплее этого — нота отозвана */
const DIP_ULT_DUE=6;        /* столько сводок сроку: полтора суток */
const DIP_ULT_MAX=3;        /* больше трёх нот разом круг не выдерживает */
/* нота вместо выстрела: `true` — бумага подана, войну откладываем */
function chronUltFile(st,N,i,j){
  if(!st.ults)st.ults=[];
  for(const u of st.ults)if((u.a===i&&u.b===j)||(u.a===j&&u.b===i))return true;
  if(st.ults.length>=DIP_ULT_MAX)return false;   /* очереди у ноты нет */
  st.ults.push({a:i,b:j,t0:N});
  chronLine(st,N,"ult",i,null,{b:j});
  return true;
}
/* отозвать ноту: только настоящим ходом навстречу — сделкой или союзом */
function chronUltDrop(st,N,i,j){
  if(!st.ults)return false;
  for(let q=0;q<st.ults.length;q++){
    const u=st.ults[q];
    if((u.a===i&&u.b===j)||(u.a===j&&u.b===i)){
      st.ults.splice(q,1);
      chronLine(st,N,"note",i,null,{b:j});
      return true;
    }
  }
  return false;
}
function chronUltStep(st,N,rr){
  if(!st.ults)st.ults=[];
  for(let q=st.ults.length-1;q>=0;q--){
    const u=st.ults[q],A=st.powers[u.a],B=st.powers[u.b];
    if(chronAtWar(st,u.a,u.b)){st.ults.splice(q,1);continue;}
    if(A.rel[u.b]>DIP_ULT_OFF&&B.rel[u.a]>DIP_ULT_OFF){
      st.ults.splice(q,1);
      chronLine(st,N,"note",u.a,null,{b:u.b});      /* нота отозвана */
      continue;
    }
    if(N-u.t0<DIP_ULT_DUE)continue;
    /* §15: двух войн разом галактике хватает — нота ждёт своей очереди (M412) */
    if(st.wars.length>=2)continue;
    st.ults.splice(q,1);
    /* срок вышел — но воюют не от обиды, а от нужды: если у предъявившей
       ноту нужда за это время выправилась, воевать ей больше незачем, и нота
       гаснет сама. Это и есть «нота, на которую ответили» */
    /* срок вышел — но воюют не от обиды, а от нужды: если у предъявившей
       ноту нужда за это время выправилась, воевать ей больше незачем, и нота
       гаснет сама. Это и есть «нота, на которую ответили» */
    if(A.need[chronNeedLow(A)]>=250){chronLine(st,N,"note",u.a,null,{b:u.b});continue;}
    st.wars.push({a:u.a,b:u.b,t0:N});
    A.rel[u.b]=clampi(A.rel[u.b]-300,-1000,1000);
    B.rel[u.a]=clampi(B.rel[u.a]-300,-1000,1000);
    A.tension=clampi(A.tension+300,0,1000);
    chronLine(st,N,"war",u.a,null,{b:u.b});
  }
}
