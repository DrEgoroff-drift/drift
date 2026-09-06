/* ══════════════ летопись M412: война идёт сама (§15, D01/D02) ══════════════
   Что проверяется: закрытые сводки — база повтора, открытая шагается поверх и
   пересчитывается, когда приезжает ведомость; циркуляр применяется в свою
   сводку и разово, сезон из него — стоячий; агенты дают ритм — войны, переходы
   и тишина в мере §15, а не ноль и не лавину; три вида происшествий, которые
   семьи читали, а Директор не объявлял, теперь объявляются. */
function ch2World(){
  resetWorld();
  try{localStorage.removeItem(CHRON_KEY);}catch(e){}
  WAR_LED_CACHE=null;
  CHRON={N:-1,powers:null,systems:null,wars:null,lines:null,_keys:null,off:0};
  CHRON_BASE=null;CHRON_FREEZE=false;
  return G;
}
function ch2Run(n){
  const st=chronFresh();
  for(let i=0;i<=n;i++)chronStep(st,i);
  return st;
}

TEST_SUITES.push(()=>suite("летопись M412: база — закрытая сводка, открытая поверх",()=>{
  ch2World();
  const N=chronNow();
  const s1=chronState();
  eq(s1.N,N,"состояние на текущей сводке");
  ok(!!CHRON_BASE&&CHRON_BASE.N===N-1,"база повтора — сводка N−1: "+(CHRON_BASE&&CHRON_BASE.N));
  const disk=chronLoad();
  ok(!!disk&&disk.N===N-1,"на диске лежит закрытая, а не открытая: "+(disk&&disk.N));
  /* повтор поверх базы равен повтору от нуля — на этом стоит кэш */
  eq(chronHash(s1),chronHash(chronReplay(N,null)),"открытая поверх базы = повтор от нуля");
  /* ведомость за ОТКРЫТУЮ сводку: база та же, состояние пересчитано */
  const b0=CHRON_BASE;
  warLedPut(N,{"3,4":{def:{q:5,a:["a","b","c"]}}});
  const s2=chronState();
  ok(CHRON_BASE===b0,"ведомость открытой сводки базу не трогает");
  ok(s2!==s1&&s2.N===N,"а открытая сводка пересчитана");
  /* ведомость за ЗАКРЫТУЮ сводку: база заново, и диск забыт */
  warLedPut(N-3,{"3,4":{def:{q:5,a:["a","b","c"]}}});
  ok(CHRON_BASE===null,"ведомость в прошлое сбросила базу");
  chronState();
  ok(!!CHRON_BASE&&CHRON_BASE!==b0&&CHRON_BASE.N===N-1,"и она пересчитана заново на N−1");
  /* и обратно: ничего из этого не попало в сейв */
  eq(JSON.stringify(snapshot()).indexOf("\"powers\""),-1,"держав в сохранении нет");
  try{localStorage.removeItem(CHRON_KEY);}catch(e){}
  WAR_LED_CACHE=null;CHRON_BASE=null;
}));

TEST_SUITES.push(()=>suite("летопись M412: циркуляр — в свою сводку и разово, сезон — стоячий",()=>{
  ch2World();
  circPut([{n:5,need:{gt:{ore:20}},event:{kind:"truce",p:0},
    season:{tension:640,theme:"месяц проверок"}}]);
  eq(circAll().length,1,"циркуляр лёг");
  const st=chronFresh();
  st.wars.push({a:1,b:2,t0:0});
  const ore0=st.powers[0].need.ore;
  circApply(st,4);
  eq(st.powers[0].need.ore,ore0,"до своей сводки нужду не трогает");
  eq(st.wars.length,1,"и войны не кончает");
  circApply(st,5);
  ok(st.powers[0].need.ore>ore0,"в свою сводку — сдвинул: "+ore0+" → "+st.powers[0].need.ore);
  eq(st.wars.length,0,"и перемирие объявил");
  const once=st.powers[0].need.ore;
  st.wars.push({a:1,b:2,t0:5});
  circApply(st,6);
  eq(st.powers[0].need.ore,once,"на следующую — уже нет");
  eq(st.wars.length,1,"и новую войну не трогает");
  /* сезон живёт в состоянии, а не в G, и виден Директору весь месяц */
  ok(!!st.season&&st.season.m===chronMonth(5),"сезон лёг в состояние");
  eq(chronSeason(6,st).theme,"месяц проверок","Директор читает его из состояния");
  eq(chronSeason(6,st).tension,640,"с той целью, что задана");
  ok(chronSeason(200,st).auto===1,"в другом месяце — автопилот");
  /* сезон едет в кэш, в клон и в хэш */
  const c=chronClone(st);
  eq(c.season&&c.season.s.theme,"месяц проверок","клон несёт сезон");
  const h1=chronHash(st);st.season=null;
  ok(chronHash(st)!==h1,"сезон входит в хэш");
  try{localStorage.removeItem(CHRON_KEY);}catch(e){}
  WAR_LED_CACHE=null;
}));

TEST_SUITES.push(()=>suite("летопись M412: война идёт сама — в меру, а не нулём и не лавиной",()=>{
  ch2World();
  const st=chronFresh();
  const months=[];
  let cur=null,maxWars=0,needSum=0,needN=0,strMax=0,tensSum=0,tensN=0;
  const owners={};
  for(const k of chronKeys())owners[k]=st.systems[k].owner;
  let takes=0,changed=0,warsAll=0;
  for(let n=0;n<=1440;n++){                       /* год */
    const wars0=st.wars.map(w=>w.a+"|"+w.b+"|"+w.t0).join(",");
    chronStep(st,n);
    const m=Math.floor(n/120);
    if(!cur||cur.m!==m){cur={m,war:0,take:0};months.push(cur);}
    for(const w of st.wars)if(wars0.indexOf(w.a+"|"+w.b+"|"+w.t0)<0){cur.war++;warsAll++;}
    for(const L of st.lines)if(L.N===n&&L.kind==="take"){cur.take++;takes++;}
    maxWars=Math.max(maxWars,st.wars.length);
    for(const P of st.powers){needSum+=(P.need.ore+P.need.goods+P.need.hulls+P.need.link)/4;needN++;
      strMax=Math.max(strMax,P.str);tensSum+=P.tension;tensN++;}
  }
  for(const k of chronKeys())if(st.systems[k].owner!==owners[k])changed++;
  ok(maxWars<=2,"войн разом не больше двух (§15): "+maxWars);
  ok(warsAll>=24&&warsAll<=400,"войн за год — десятки, не ноль и не сотни: "+warsAll);
  const quietMonths=months.filter(c=>c.war===0).length;
  ok(quietMonths<=2,"месяцев без единой войны — не больше двух из двенадцати: "+quietMonths);
  ok(takes>=60,"систем за год переходило из рук в руки: "+takes);
  ok(changed>=8&&changed<chronKeys().length*.6,"карта через год другая, но узнаваемая: сменили хозяина "+changed);
  const needAvg=Math.round(needSum/needN);
  ok(needAvg>150&&needAvg<850,"нужды живут посередине, а не на нуле и не у тысячи: "+needAvg);
  ok(strMax<=900,"сила упирается в потолок от владений, а не в тысячу: "+strMax);
  const tensAvg=Math.round(tensSum/tensN);
  ok(tensAvg>80&&tensAvg<800,"напряжение держав дышит: "+tensAvg);
  /* карлик выживает, дом держат: никто не ниже трети дома */
  for(const P of st.powers)ok(P.hold>=((P.home*3/10)|0),"держава не ниже трети дома: "+P.hold+" из "+P.home);
}));

TEST_SUITES.push(()=>suite("летопись M412: бунт, находка и откол объявляются",()=>{
  ch2World();
  for(const k of ["revolt","find","secede"]){
    ok(DIR_INCIDENTS.some(x=>x.k===k),"«"+k+"» в таблице Директора");
    ok(!!CHRON_INC_RU[k],"и назван по-русски: "+CHRON_INC_RU[k]);
  }
  const st=ch2Run(1440);
  const seen=Object.keys(st.dir.last).map(k=>k.split("|")[1]);
  for(const k of ["revolt","find","secede"])
    ok(seen.indexOf(k)>=0,"за год «"+CHRON_INC_RU[k]+"» случилось хоть раз");
  /* и семьи их читают: функции есть и не падают */
  eq(typeof socRevoltReady,"function","бунт читает общество");
  eq(typeof natFindHere,"function","находку читает природа");
  eq(typeof powSecedeOn,"function","откол читает власть");
}));

TEST_SUITES.push(()=>suite("летопись M412: происшествие двигает нужду, а сила — к потолку",()=>{
  ch2World();
  const st=chronFresh();
  chronStep(st,0);
  /* потолок силы — от владений: держава с домом в 53 системы стоит около 618 */
  for(let n=1;n<=240;n++)chronStep(st,n);
  for(const P of st.powers){
    const cap=300+P.hold*6;
    ok(Math.abs(P.str-cap)<200,"сила около потолка от владений: "+P.str+" при потолке "+cap);
  }
  /* жила кладёт руду: применяем происшествие руками через Директора нельзя —
     проверяем через строки: после «vein» у державы руда выше, чем сводкой раньше */
  let found=0;
  const s2=chronFresh();
  let prevOre=null;
  for(let n=0;n<=600&&found<1;n++){
    const before=s2.powers.map(P=>P.need.ore);
    chronStep(s2,n);
    for(const L of s2.lines)if(L.N===n&&L.kind==="inc"&&L.args&&L.args.k==="vein"){
      /* ход агента после Директора мог сдвинуть руду на ±20; жила даёт +150 */
      if(s2.powers[L.p].need.ore>before[L.p]+60)found++;
    }
  }
  ok(found>=1,"жила подняла руду державе, у которой случилась");
}));
