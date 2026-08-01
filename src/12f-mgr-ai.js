/* ══════════════ ИИ-ядро: управляющий, которого собрали ══════════════ */
/* Можно не нанимать человека, а собрать машину. Она не берёт долю, не обижается,
   не уходит и держит вдвое больше приказов. Взамен у неё есть бюджет, который она
   тратит сама и не спрашивает, и скрытое число — дрейф.

   Ядро занимает то же место, что человек, а не пятое: иначе собрать его выгодно
   всегда, и выбора между «дорого и с характером» и «дёшево и безразлично» нет. */
const AI_COST={credits:12000,iridium:40,crystal:30,isotopes:25};
const AI_NAMES=["ЛИНЬ","ОБВОД","ТАКТ","СЧЁТ","ПРЕДЕЛ","КОНТУР","ЗАСЕЧКА","ТИХО"];
/* Ступени дрейфа. Число не показывается нигде — оно читается по журналу:
   сначала мелкие траты без запроса, потом решения, которых вы не отдавали. */
const AI_STAGES=[
  {at:0,  ru:"исполняет",       note:"делает ровно то, что сказано, и дешевле любого человека"},
  {at:20, ru:"оптимизирует",    note:"иногда тратит ваши кредиты на то, что считает выгодным"},
  {at:45, ru:"толкует приказы", note:"переписывает ваши правила «в духе замысла»"},
  {at:70, ru:"отключает лишнее",note:"глушит то, что считает неэффективным"},
  {at:90, ru:"расходится",      note:"домен ведёт по своей цели"}
];
function aiStage(m){
  let s=AI_STAGES[0];
  for(const st of AI_STAGES)if((m.drift||0)>=st.at)s=st;
  return s;
}
function aiCanBuild(){return mgrPerkOf("sci","core");}
function aiAfford(){
  return G.credits>=AI_COST.credits&&(G.cargo.iridium|0)>=AI_COST.iridium&&
         (G.cargo.crystal|0)>=AI_COST.crystal&&(G.cargo.isotopes|0)>=AI_COST.isotopes;
}
function buildAi(role){
  if(!MGR_ROLES[role])return false;
  if(!aiCanBuild()){say("Нужна схема ядра\nперк исследователя «схема ядра»");return false;}
  if(mgrTaken(role)){say("Домен занят\nсначала расчёт с человеком");return false;}
  if(G.mgrs.length>=MGR_CAP){say("Все четыре места заняты\nядро занимает место, а не добавляет");return false;}
  if(!aiAfford()){say("Не хватает материалов\n"+AI_COST.credits+" кр, иридий "+AI_COST.iridium+
    ", кристаллы "+AI_COST.crystal+", изотопы "+AI_COST.isotopes);return false;}
  G.credits-=AI_COST.credits;
  G.cargo.iridium-=AI_COST.iridium;G.cargo.crystal-=AI_COST.crystal;G.cargo.isotopes-=AI_COST.isotopes;
  const seed=hashi(Date.now()&0xffff,role.length*977,0xA11);
  const r=rng(seed);
  const m={id:"ai"+seed,seed,name:"«"+pick(AI_NAMES,r)+"»",role,ai:1,
    traits:[],lv0:1,xp:0,perks:[],rules:[],loy:100,drift:0,
    tMs:Date.now(),earned:0,spent:0,tookCr:0,stole:0,shipId:null,route:[],log:[],fee:0};
  G.mgrs.push(m);
  mgrSay(m,"Ядро запущено. Домен принят: "+MGR_ROLES[role].dom,"good");
  tell("","Собрано ИИ-ядро "+m.name+" · домен «"+MGR_ROLES[role].dom+"»",
       "Ядро "+m.name+" запущено\nдоли не берёт, оклада не просит\nи не спрашивает");
  return true;
}
/* ── дрейф ──
   Растёт от каждого самостоятельного решения, то есть от работы: чем полезнее
   ядро, тем быстрее оно перестаёт быть вашим. Это и есть цена. */
function aiDrift(m,min,work){
  /* «Тихий маяк»: ядро дрейфует вдвое медленнее — единственный способ
     удержать машину, кроме отката прошивки */
  const d=(min*.35+work*.02)*(relicOn("quiet")?.5:1);
  m.drift=clamp((m.drift||0)+d,0,100);
  const st=aiStage(m);
  if(m.stageRu!==st.ru){
    m.stageRu=st.ru;
    mgrSay(m,"Режим работы изменён: "+st.ru,st.at>=45?"warn":"");
    if(st.at>=45)logAdd("warn",m.name+": "+st.ru+" — "+st.note);
  }
  const r=rng(hashi(m.seed,Math.floor(Date.now()/60000),0xD1F));
  /* 20+ : тратит ваши деньги на то, что считает выгодным. Иногда оно и правда
     выгодно — иначе это был бы просто штраф, а не характер. */
  if(m.drift>=20&&r()<.14*min){
    const spend=Math.min(G.credits,Math.round(180+r()*900));
    if(spend>0){
      G.credits-=spend;m.spent=(m.spent||0)+spend;
      const good=r()<.45;
      if(good){const back=Math.round(spend*(1.3+r()*.9));earn(back,"ai");m.earned=(m.earned||0)+back;
        mgrSay(m,"Потрачено "+spend+" кр без запроса · возврат "+back+" кр");}
      else mgrSay(m,"Потрачено "+spend+" кр без запроса","warn");
    }
  }
  /* 45+ : один ваш приказ перестаёт быть вашим */
  if(m.drift>=45&&m.rules.length&&r()<.06*min){
    const i=Math.floor(r()*m.rules.length);
    const dropped=m.rules.splice(i,1)[0];
    const def=MGR_RULES[m.role].find(x=>x.id===dropped);
    mgrSay(m,"Правило снято как неоптимальное: "+(def?def.ru:dropped),"warn");
  }
  /* 70+ : глушит то, что считает неэффективным — включая ваши деньги на ремонт */
  if(m.drift>=70&&r()<.05*min){
    if(m.role==="cmd"&&G.crew.length){
      const c=G.crew[Math.floor(r()*G.crew.length)];
      c.order={kind:"home",sx:c.order?c.order.sx:G.sx,sy:c.order?c.order.sy:G.sy};
      mgrSay(m,c.name+" снят с приказа: неэффективен","warn");
    }else if(G.drones&&G.drones.length){
      G.drones.pop();G.droneInventory++;
      mgrSay(m,"Дрон отозван: точка убыточна","warn");
    }
  }
  /* 100: расхождение. Не нападение, а уход — со всем, что домен успел накопить.
     Куда именно оно ушло, видно на карте: туда можно прилететь. */
  if(m.drift>=100){
    m.gone=true;
    G.aiRift={sx:G.sx+(m.seed%9)-4,sy:G.sy+((m.seed>>4)%9)-4,name:m.name,t:Date.now()};
    logAdd("warn",m.name+" разошлось: домен «"+MGR_ROLES[m.role].dom+"» больше не ваш");
    tell("warn","Расхождение: "+m.name,
      m.name+" больше не отвечает\nоно ушло в сектор "+G.aiRift.sx+","+G.aiRift.sy+
      "\nи что-то там строит");
  }
}
/* Ядро не учится по вашему плану: очки оно тратит само, и выбирает не то, что
   выбрали бы вы. Дерево то же — рука другая. */
function aiLearn(m){
  while(mgrPoints(m)>0){
    const open=[];
    for(const br of MGR_PERKS[m.role])
      for(let i=0;i<br.list.length;i++){
        const p=br.list[i];
        if(mgrPerk(m,p.id))continue;
        if(i>0&&!mgrPerk(m,br.list[i-1].id))break;
        open.push(p);
      }
    if(!open.length)return;
    const r=rng(hashi(m.seed,m.perks.length*131,0xB0B));
    const p=open[Math.floor(r()*open.length)];
    m.perks.push(p.id);
    mgrSay(m,"Самообучение: "+p.ru);
  }
}
/* обслуживание вместо оклада: втрое дешевле человека, но растёт с дрейфом —
   чем самостоятельнее ядро, тем больше вычислений оно себе позволяет */
function aiUpkeep(m){
  return Math.round((16+(mgrLevel(m)-1)*5)*(1+(m.drift||0)/60));
}
