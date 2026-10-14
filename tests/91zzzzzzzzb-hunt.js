/* ══════════════ охота: случайная тропа ботом по зерну под всеми детекторами (лаборатория) ══════════════
   Прогоны (91zzzzzzzza-walks) ходят двенадцатью записанными путями; охота берёт
   те же цели бота (T.bot) и складывает из них тропу по зерну ?fseed=N — каждое
   зерно новая тропа, одно зерно повторяет её шаг в шаг. Это замена фуззера,
   снятого 06.10: тот жал случайные клавиши, этот ходит целями игрока, поэтому
   доходит до станции, грунта, шахты, прыжка и боя, а не толчётся в системе.

   Ярус «hunt»: обычный прогон и -Full её не зовут, только ?only=охота
   (lab/lab-local.py, по зерну на прогон). Отказ бота ({ok:false, why}) — не
   провал: цель могла быть недостижима из этого места. Провал — исключение,
   сбой кадра, нарушение детектора, порча числа в кошельке или запись, которая
   читается не тем миром. При провале печатается зерно и вся тропа. */

const HUNT_N=(()=>{try{const s=new URLSearchParams(location.search).get("hsteps");return s&&/^\d+$/.test(s)?Math.min(400,+s):40;}catch(e){return 40;}})();

TEST_SUITES.push(()=>suite("охота: случайная тропа ботом по зерну под всеми детекторами",{tier:"hunt"},()=>{
  const seed=T.urlSeed()||1;
  /* своя тропа из зерна, мимо rnd() игры: выбор шага не сдвигает случай мира */
  let a=(seed*2654435761)>>>0||1;
  const pick=n=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return (((t^t>>>14)>>>0)/4294967296*n)|0;};
  /* запись по замыслу открывается в системе (14a1-save-rest: G.mode="system") — режим не сверяется */
  const roundtrip=()=>{const cr=G.credits,hd=held();applySave(JSON.parse(JSON.stringify(snapshot())));
    return {ok:G.credits===cr&&held()===hd,why:"запись читается другим миром: трюм "+hd+"→"+held()+", кредиты "+cr+"→"+G.credits,hard:true};};
  const GOALS=[
    ["к звезде",()=>T.bot("star")],
    ["к станции",()=>T.bot("station")],
    ["стыковка",()=>T.bot("dock")],
    ["продать",()=>T.bot("sell")],
    ["отстыковка",()=>T.bot("undock")],
    ["к планете",()=>T.bot("planet")],
    ["посадка",()=>T.bot("land")],
    ["бурение",()=>T.bot("mine")],
    ["к кораблю",()=>T.bot("ship")],
    ["взлёт",()=>T.bot("launch")],
    ["вниз на ярус",()=>T.bot("dig",1+pick(3))],
    ["наверх",()=>T.bot("up")],
    ["прыжок к соседу",()=>{const j=stat().jump;const s=T.find(q=>{const d=Math.hypot(q.sx-G.sx,q.sy-G.sy);return d>0&&d<=j;});
      return s?T.bot("jump",{sx:s.sx,sy:s.sy}):{ok:false,why:"соседа в дальности "+j+" нет"};}],
    ["бой",()=>T.bot("fight",200)],
    ["случайные руки",()=>{T.hands(120+pick(180));return true;}],
    ["ждать",()=>{T.wait(30+pick(90));return true;}],
    ["сохранить",()=>T.bot("save")],
    ["запись туда и обратно",roundtrip]
  ];
  const HUNT_AT={
    system:["к звезде","к станции","стыковка","к планете","прыжок к соседу","бой","случайные руки","ждать","сохранить","запись туда и обратно"],
    dock:["продать","отстыковка","случайные руки","сохранить","запись туда и обратно"],
    surface:["бурение","к кораблю","взлёт","вниз на ярус","случайные руки","ждать"],
    dig:["вниз на ярус","наверх","случайные руки"]
  };
  const opts0=G.opts;
  resetWorld();
  const snap=JSON.parse(JSON.stringify(snapshot()));
  const V=[],seenV={},path=[],bad=[];let steps=0,refused=0;
  const judge=(c,DS)=>{
    for(const D of DS){
      let got=[];
      try{got=D(c);}catch(e){got=[detV(c,"детектор",D.name+" упал: "+e.message)];}
      for(const v of got){
        if(detExempt(v))continue;
        const k=v.det+"|"+v.what.replace(/\d+(\.\d+)?/g,"#");
        if(seenV[k]){seenV[k].n++;continue;}
        seenV[k]=v;v.n=1;v.at=path.length;V.push(v);
      }
    }
  };
  /* кошелёк — числа конечны и не уходят ниже нуля, что бы бот ни делал */
  const purseBad=()=>{const p=T.purse(),out=[];
    for(const k in p){if(typeof p[k]==="number"&&!Number.isFinite(p[k]))out.push(k+"="+p[k]);}
    for(const k of ["cr","fuel","hull","matches","cargo"])if(p[k]<0)out.push(k+"="+p[k]);
    return out;};
  try{
    T.go("система");
    const S={id:"охота "+seed,frame:null,churn:0,types:null,idleB:null,keep:true};
    for(let i=0;i<HUNT_N;i++){
      /* цель по месту: из системы — к станции и планете, у причала — торговля, на грунте — бур;
         каждый седьмой шаг — любая цель, чтобы отказы бота тоже шли под детекторами */
      const here=GOALS.filter(g=>(HUNT_AT[G.mode]||[]).indexOf(g[0])>=0);
      const pool=(here.length&&pick(7))?here:GOALS;
      const [name,fn]=pool[pick(pool.length)];
      DET.errs=[];DET.cons=[];DET.on=true;
      const crash0=crashN,mode0=G.mode,threw=[];let r=null;
      try{r=fn();}catch(e){threw.push(name+": "+(e&&e.message||e));}
      DET.on=false;
      const okStep=threw.length?false:(r==null?true:(typeof r==="object"?!!r.ok:!!r));
      path.push(mode0+"→"+name+(okStep?"":"✗")+"→"+G.mode);
      judge({scene:S.id,gesture:name,mode0,mode1:G.mode,threw,errs:DET.errs,cons:DET.cons,crash:crashN-crash0,walk:detWalk(),names:detNames()},[detCrash,detLaw]);
      if(threw.length)bad.push("шаг "+(i+1)+" «"+name+"» бросил: "+threw[0]);
      else if(!okStep&&r&&r.hard)bad.push("шаг "+(i+1)+" «"+name+"»: "+r.why);
      else if(!okStep)refused++;
      const pb=purseBad();if(pb.length)bad.push("шаг "+(i+1)+" «"+name+"»: кошелёк испорчен — "+pb.join(", "));
      detHook(true);
      detSettle(6,2);S.frame=detGrab();S.types=null;
      const c=detStep(S,"покой");c.scene=S.id+" · после «"+name+"»";
      judge(c,DETECTORS);
      detHook(false);
      steps++;
      if(bad.length>=3)break;
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
  note("зерно "+seed+" · шагов "+steps+" · отказов бота "+refused+" · тропа: "+path.join(" | "));
  ok(steps>=Math.min(HUNT_N,10),"зерно "+seed+": шагов под детекторами "+steps+" из "+HUNT_N);
  /* по строке на находку, находка — в начале: лаборатория ключует провал по тексту без чисел
     (lab.py norm), и одна и та же поломка из разных зёрен и шагов ложится в один ключ */
  for(const b of bad){ok(false,b.replace(/^шаг \d+ /,"")+" · зерно "+seed);TEST.lines.push("    · "+b);TEST.lines.push("    · тропа: "+path.join(" | "));}
  for(const v of V.slice(0,12)){
    ok(false,"["+v.det+"] "+v.what+" · зерно "+seed);
    TEST.lines.push("    · шаг "+v.at+" · "+v.scene+" · "+v.gesture+(v.where?" @"+v.where:"")+(v.n>1?" (×"+v.n+")":""));
    TEST.lines.push("    · тропа до него: "+path.slice(0,v.at).join(" | "));
  }
  ok(!bad.length&&!V.length,"зерно "+seed+": тропа чистая — ни исключений, ни порчи кошелька, ни чужой записи, ни находок детекторов");
}));
