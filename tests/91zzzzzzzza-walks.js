/* ══════════════ прогоны: пути игрока под детекторами (M444, DESIGN-tests §3.3) ══════════════
   Сквозной набор (91zzzzzzzz-detect) ставит сцену и делает пять жестов; игрок
   же идёт ПУТЁМ: взлетел, долетел, состыковался, продал, сел, накопал, вернулся.
   Здесь такие пути записаны по пять-семь строк каждый, читаются глазами и идут
   ботом с целью (T.bot, 90a-tools) теми же клавишами и кнопками, что у игрока.
   После КАЖДОГО шага — все детекторы: сбой, застой, закон, приборы, картина;
   сам шаг судится по ответу бота ({ok, why}): провал цели — застой с именем
   шага, а не исключение.

   Пути взяты из журналов плейтестов (PLAYTEST-01: «первые минуты в космосе»,
   «посадка и поверхность», «шахта», «станция», «пояс») и §9 DESIGN-screens
   (91zzy-walk): с той разницей, что здесь путь ведёт бот, а не набор жмёт
   функции. Экраны между шагами остаются открытыми (S.keep): станция должна
   пережить шаг «продать», а не закрыться детектором дверей.

   В конце — карта покрытия: режим × шаг в этом окне. Пустая клетка — список
   работ, а не догадка (§3.3). Набор идёт в каждом окне прогона (1280×800,
   телефон, высокое): путь тот же, кнопки — этого окна. */
const WALKS=[
  {id:"первые минуты",steps:[
    ["старт в системе",()=>T.go("система")],
    ["К ЗВЕЗДЕ",()=>T.bot("star")],
    ["к станции",()=>T.bot("station")],
    ["стыковка",()=>T.bot("dock")],
    ["отстыковка",()=>T.bot("undock")]]},
  {id:"посадка и залежь",steps:[
    ["старт в системе",()=>T.go("система")],
    ["к планете",()=>T.bot("planet")],
    ["посадка",()=>T.bot("land")],
    ["бурение до полного трюма",()=>T.bot("mine")],
    ["к кораблю",()=>T.bot("ship")],
    ["взлёт",()=>T.bot("launch")]]},
  {id:"шахта",steps:[
    ["грунт днём",()=>T.go("грунт день")],
    ["спуск на три яруса",()=>T.bot("dig",3)],
    ["подъём наверх",()=>T.bot("up")]]},
  {id:"торговля",steps:[
    ["в системе с грузом",()=>{T.go("система");T.give("cargo","iron",10);return true;}],
    ["к станции",()=>T.bot("station")],
    ["стыковка",()=>T.bot("dock")],
    ["продать всё",()=>T.bot("sell")],
    ["отстыковка",()=>T.bot("undock")]]},
  {id:"прыжок",steps:[
    ["старт",()=>T.go("старт")],
    ["прыжок к соседу",()=>{const j=stat().jump;const s=T.find(q=>{const d=Math.hypot(q.sx,q.sy);return d>0&&d<=j;});
      return s?T.bot("jump",{sx:s.sx,sy:s.sy}):{ok:false,why:"соседа в дальности "+j+" нет"};}],
    ["К ЗВЕЗДЕ после прыжка",()=>T.bot("star")]]},
  {id:"пояс под руками",steps:[
    ["пояс",()=>T.go("пояс")],
    ["триста кадров случайных рук",()=>{T.hands(300);return G.mode==="belt"||G.mode==="system";}]]},
  {id:"огонь в полёте",steps:[
    ["старт в системе",()=>T.go("система")],
    ["сто кадров огня",()=>{T.press("fire",100);return true;}]]},
  {id:"запись и возврат",steps:[
    ["грунт днём",()=>T.go("грунт день")],
    ["бурение",()=>T.bot("mine")],
    ["к кораблю",()=>T.bot("ship")],
    ["взлёт",()=>T.bot("launch")],
    ["сохранить",()=>T.bot("save")],
    ["перечитать запись",()=>{const cr=G.credits,hd=held(),m=G.mode;applySave(JSON.parse(JSON.stringify(snapshot())));
      return {ok:G.credits===cr&&held()===hd&&G.mode===m,why:"после чтения записи: режим "+G.mode+", трюм "+held()+"/"+hd+", кредиты "+G.credits+"/"+cr};}]]}
];

TEST_SUITES.push(()=>suite("прогоны: восемь путей игрока ботом под всеми детекторами, и карта покрытия",{tier:"browser"},()=>{
  const T0=performance.now(),key=W+"x"+H;
  const opts0=G.opts;
  if(DET_OPTS_BOOT){G.opts=JSON.parse(DET_OPTS_BOOT);invalidateKeyMap();}
  resetWorld();
  const snap=JSON.parse(JSON.stringify(snapshot()));
  const V=[],seenV={},exempted={},cov={},stuck=[];let steps=0;
  const judge=(c,DS)=>{
    for(const D of DS){
      let got=[];
      try{got=D(c);}catch(e){got=[detV(c,"детектор",D.name+" упал: "+e.message)];}
      for(const v of got){
        const why=detExempt(v);if(why){exempted[why]=(exempted[why]||0)+1;continue;}
        const k=v.det+"|"+v.what.replace(/\d+(\.\d+)?/g,"#");
        if(seenV[k]){seenV[k].n++;continue;}
        seenV[k]=v;v.n=1;V.push(v);
      }
    }
  };
  try{
    for(const Wk of WALKS){
      resetWorld();
      const S={id:Wk.id,frame:null,churn:0,types:null,idleB:null,keep:true};
      for(const [name,fn] of Wk.steps){
        /* сам шаг: уши открыты, после него — сбой и закон */
        DET.errs=[];DET.cons=[];DET.on=true;
        const crash0=crashN,mode0=G.mode,threw=[];let r=null;
        try{r=fn();}catch(e){threw.push(name+": "+(e&&e.message||e));}
        DET.on=false;
        const cA={scene:Wk.id,gesture:name,mode0,mode1:G.mode,threw,errs:DET.errs,cons:DET.cons,crash:crashN-crash0,walk:detWalk(),names:detNames()};
        judge(cA,[detCrash,detLaw]);
        const ok=threw.length?false:(r==null?true:(typeof r==="object"?!!r.ok:!!r));
        (cov[mode0]||(cov[mode0]={}))[name]=1;
        if(G.mode!==mode0)(cov[G.mode]||(cov[G.mode]={}))["← "+name]=1;
        if(!ok){stuck.push(Wk.id+" · "+name+": "+(threw[0]||(r&&r.why)||"бот ответил «нет»")+" (режим "+G.mode+")");break;}
        /* и покой после шага — под всеми детекторами, как в сквозном; жест
           остаётся «покой» (детектор органов судит только жесты), а имя шага
           уходит в имя сцены */
        detHook(true);
        detSettle(6,2);S.frame=detGrab();S.types=null;   /* смена режима печёт растр по кадрам: осадка как в сквозном */
        const c=detStep(S,"покой");c.scene=Wk.id+" · после «"+name+"»";
        judge(c,DETECTORS);
        detHook(false);
        steps++;
      }
      T.calm();
    }
  }finally{
    detHook(false);DET.on=false;DET.texts=null;DET.astro=null;
    for(const k in keys)keys[k]=false;
    T.calm();
    try{applySave(snap);}catch(e){}
    G.mode="system";G.land=null;G.surf=null;G.dig=null;G.cave=null;G.base=null;G.hin=null;
    resetWorld();
    G.opts=opts0;invalidateKeyMap();
  }
  const modes=Object.keys(cov).sort();
  note("покрытие в окне "+key+": "+modes.map(m=>m+" ← "+Object.keys(cov[m]).join(", ")).join(" · "));
  ok(steps>=20,"путей "+WALKS.length+", шагов под детекторами "+steps+" · "+Math.round(performance.now()-T0)+" мс"+
    (Object.keys(exempted).length?" · исключено по праву: "+Object.keys(exempted).map(k=>k+" ×"+exempted[k]).join("; "):""));
  ok(modes.length>=5,"режимов, до которых довёл бот: "+modes.length+" ("+modes.join(", ")+")");
  eq(stuck.join(" ;; "),"","каждый путь пройден до конца"+(stuck.length?" (застряло "+stuck.length+")":""));
  const lines=V.map(v=>v.scene+" · "+v.gesture+" · ["+v.det+"] "+v.what+(v.where?" @"+v.where:"")+(v.n>1?" (×"+v.n+")":""));
  for(const L of lines)TEST.lines.push("    · "+L);
  eq(lines.slice(0,12).join(" ;; "),"","ни один детектор не нашёл нарушения на путях"+(lines.length?" (всего "+lines.length+")":""));
}));
