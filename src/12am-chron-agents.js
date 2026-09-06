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
function chronRelWorst(st,i){
  let j=-1,v=1001;
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
/* один ход одной державы */
function chronAgentMove(st,N,i,rr){
  const P=st.powers[i];
  const roll=rr(i,0x9A)%1000;
  const low=chronNeedLow(P);
  const want=CHRON_WANT[i];
  /* нужды тают сами и пополняются тем, что держава держит: чем больше систем,
     тем медленнее просадка. Это и есть «экономика» на данном проходе */
  for(const k of ["ore","goods","hulls","link"]){
    /* держава ест столько, сколько держит: расширение не бесплатно, иначе
       большой ни в чём не нуждается и воевать ему незачем (замер 0.370.0:
       при дешёвом расширении за триста сводок не случилось ни одной войны) */
    const gain=(P.hold*(want[k]+1))/12|0;
    P.need[k]=clampi(P.need[k]-20-(want[k]*6)+gain,0,1000);
  }
  /* отношения тянет к нулю: без этого через сотню сводок все дружат со всеми
     на тысячу и галактика застывает */
  for(let q=0;q<6;q++){
    if(q===i)continue;
    const v=P.rel[q];
    P.rel[q]=v>0?v-((v/40|0)+1):(v<0?v+((-v/40|0)+1):0);
  }
  /* ── курс месяца (M378) ──
     Толпа не правит державой, но подталкивает её: победивший на выборах ответ
     смещает пороги хода. «Держать фронт» — раньше ссорится и воюет; «строить»
     — чаще строит и торгует. Держава при этом остаётся собой. */
  const course=(typeof voteCourse==="function")?voteCourse(i,N):null;
  const warBias=(course==="war")?90:((course==="build")?-70:0);
  /* выбор хода: злее всего тот, у кого нужда на дне и есть с кем ссориться */
  const worst=chronRelWorst(st,i),best=chronRelBest(st,i);
  let move;
  if(P.need[low]<250+warBias&&worst>=0&&P.rel[worst]<-150&&P.str>280)move="war";
  else if(P.need[low]<450+warBias&&worst>=0)move="quarrel";
  else if(chronAtWar(st,i,worst)&&(P.str<260||roll<120))move="truce";
  else if(P.rel[best]>500&&roll<200)move="ally";
  else if(roll<520-warBias)move="deal";
  else move="build";
  const j=(move==="ally")?best:worst;
  if(move==="deal"&&j>=0){
    /* сделка: обе стороны получают то, чего им не хватает, и теплеют */
    P.need[low]=clampi(P.need[low]+50,0,1000);
    const Q=st.powers[j];
    Q.need[chronNeedLow(Q)]=clampi(Q.need[chronNeedLow(Q)]+35,0,1000);
    P.rel[j]=clampi(P.rel[j]+40,-1000,1000);Q.rel[i]=clampi(Q.rel[i]+40,-1000,1000);
    if((rr(i,0x0D)%1000)<120)chronLine(st,N,"deal",i,null,{b:j});
  }else if(move==="quarrel"&&j>=0){
    const Q=st.powers[j];
    P.rel[j]=clampi(P.rel[j]-130,-1000,1000);Q.rel[i]=clampi(Q.rel[i]-90,-1000,1000);
    P.tension=clampi(P.tension+120,0,1000);
  }else if(move==="war"&&j>=0&&!chronAtWar(st,i,j)){
    st.wars.push({a:i,b:j,t0:N});
    P.rel[j]=clampi(P.rel[j]-300,-1000,1000);
    st.powers[j].rel[i]=clampi(st.powers[j].rel[i]-300,-1000,1000);
    P.tension=clampi(P.tension+300,0,1000);
    chronLine(st,N,"war",i,null,{b:j});
  }else if(move==="truce"){
    const w=chronAtWar(st,i,worst);
    if(w){
      st.wars.splice(st.wars.indexOf(w),1);
      P.rel[worst]=clampi(P.rel[worst]+280,-1000,1000);
      st.powers[worst].rel[i]=clampi(st.powers[worst].rel[i]+280,-1000,1000);
      chronLine(st,N,"truce",i,null,{b:worst});
    }
  }else if(move==="ally"&&j>=0){
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
