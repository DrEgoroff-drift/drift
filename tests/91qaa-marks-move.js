/* ══════════════ подвижная пятёрка как места действия (M627b, проход 4) ══════════════
   Друза, кольцо, аномалия, завод, пушка: каждое место достижимо и делается; каждый акт виден в теле
   через секунду; кредитов нет; друза поёт только в своём порядке; кольцо на пределе либо кладёт
   залежь (и она возвращается на посадке, остаток помнится), либо рвётся; аномалия меняет по своей
   таблице и сыта после двенадцати; завод переналаживается только за восемь техкомпонентов и после
   этого молчит; пушка стреляет один раз, звери бегут, деяние «shot» записано. */
const MV_FIVE=["crystals","ring","anomaly","factory","battery"];
function mvPrep(){
  for(const k of RES_KEYS)G.cargo[k]=0;
  G.cargo.iron=6;G.cargo.techcomp=10;G.fuel=0;
}
function mvExplore(k,seed,depthMax){
  const q=MA_Q(seed,k),K=PLN_ACT.kinds[k],live=new Set(),acted=new Set(),t0=G.t,ctx={d:.3,night:false};
  const replay=path=>{delete G.poiSeen[q.seed];G.t=t0;mvPrep();
    for(const a of path){if(a==="+day")G.t+=CEL_DAY;else plnActDo(q,a,ctx);}};
  const paths={};
  const step=(path,depth)=>{
    replay(path);
    const m=plnActMemo(q,true),D=plnActDims(q),cand=[];
    for(const s of K.spots)if(plnActLive(K,s,m,D)){live.add(s.id);if(plnActVerb(s,m,D))cand.push(s);}
    if(depth>=depthMax)return;
    for(const s of cand){replay(path);const R=plnActDo(q,s.id,ctx);
      if(R&&!R.keep){if(!acted.has(s.id)){acted.add(s.id);paths[s.id]=path.slice();}step(path.concat([s.id]),depth+1);}}
    if(path[path.length-1]!=="+day")step(path.concat(["+day"]),depth+1);
  };
  step([],0);
  G.t=t0;
  return {q,K,live,acted,paths,replay,ctx};
}
TEST_SUITES.push(()=>suite("ориентиры: подвижная пятёрка — места, тело, кости",()=>{
  resetWorld();
  const pOn=PLN.on,pBad=PLN.bad,pSurf=G.surf;PLN.on=true;PLN.bad=0;PLN_ACT.pinAge=null;G.surf=null;
  const cr=G.credits;
  for(const k of MV_FIVE){
    const X=mvExplore(k,hashi(k.length,0x5EED,9),4);
    for(const s of X.K.spots)ok(X.live.has(s.id),k+": место «"+s.id+"» достижимо из st 0");
    for(const s of X.K.spots)if(s.verb!=null)ok(X.acted.has(s.id),k+": акт «"+s.id+"» сделан хоть раз");
    /* каждый акт виден в теле через секунду: свет, лампа или часть */
    const body=m=>JSON.stringify((({light,lampK,parts,move})=>({light,lampK,parts,move}))(X.K.drive(m,1,plnActDims(X.q),0,.5,X.q)));
    for(const id of X.acted){
      X.replay(X.paths[id]);
      const before=body(JSON.parse(JSON.stringify(plnActMemo(X.q,true))));
      ok(plnActDo(X.q,id,X.ctx),k+": акт «"+id+"» по найденному пути");
      ok(body(plnActMemo(X.q,true))!==before,k+": акт «"+id+"» меняет тело");
    }
    eq(typeof plnActMemo(X.q,true).got,"string",k+": got — строка");
  }
  const ctx={d:.3,night:false};

  /* ── друза: только свой порядок; неверная нота сбрасывает; спетая не колется, выломанная молчит ── */
  {const q=MA_Q(0xD5E,"crystals"),o=plnDruseOrder(q.seed);mvPrep();
    plnActDo(q,"k"+o[0],ctx);plnActDo(q,"k"+o[2],ctx);
    eq(plnActMemo(q,true).n.p,0,"друза: не та нота — набор сброшен");
    const c0=G.cargo.crystal|0;
    for(const i of o)plnActDo(q,"k"+i,ctx);
    const m=plnActMemo(q,true);
    eq(m.st,2,"друза: три ноты по порядку — резонанс");eq(m.way,"ring","друза: путь «ring»");
    ok((G.cargo.crystal|0)>c0,"друза: резонанс дал кристаллы");
    eq(plnActDo(q,"mine",ctx),null,"друза: спетая не колется");
    ok(plnActDo(q,"grow",ctx),"друза: кристалл дня");
    eq(plnActDo(q,"grow",ctx),null,"друза: второй раз за день — нет");
    const q2=MA_Q(0xD5F,"crystals");mvPrep();
    ok(plnActDo(q2,"mine",ctx),"друза: выломана");
    eq(plnActDo(q2,"k0",ctx),null,"друза: ключи выломанной молчат");}

  /* ── кольцо: предел — бросок слитка или разрыв; слиток ложится залежью и помнит остаток ── */
  {let thrown=null,broke=null;
    for(let s=1;s<60&&!(thrown&&broke);s++){const q=MA_Q(0x41B00+s,"ring");mvPrep();
      plnActDo(q,"valve",ctx);plnActDo(q,"limit",ctx);const m=plnActMemo(q,true);
      if(m.way==="throw"&&!thrown)thrown=q;if(m.way==="broke"&&!broke)broke=q;}
    ok(thrown,"кольцо: есть семя, где оно бросает слиток");ok(broke,"кольцо: есть семя, где оно рвётся");
    if(thrown){const m=plnActMemo(thrown,true),S={deposits:[],tr:null,x:thrown.x};
      ok(m.dep&&m.dep.left>=12&&m.dep.left<20,"кольцо: память держит залежь 12..19");
      PLN_ACT.kinds.ring.tick(thrown,m,S);PLN_ACT.kinds.ring.tick(thrown,m,S);
      eq(S.deposits.length,1,"кольцо: залежь кладётся один раз");
      const d=S.deposits[0];eq(d.res,"iridium","кольцо: залежь — иридий");eq(d.i,null,"кольцо: залежь не пишется в G.mined");
      d.left=5;PLN_ACT.kinds.ring.tick(thrown,m,S);eq(m.dep.left,5,"кольцо: остаток читается назад в память");
      const S2={deposits:[],tr:null};PLN_ACT.kinds.ring.tick(thrown,m,S2);eq(S2.deposits[0].left,5,"кольцо: на новой посадке — тот же остаток");
      eq(plnActDo(thrown,"stop",ctx),null,"кольцо: после броска не останавливается");}
    if(broke){eq(plnActMemo(broke,true).st,3,"кольцо: разорвано — st 3");eq(plnActDo(broke,"day",ctx),null,"кольцо: разорванное не крутится");}}

  /* ── аномалия: таблица три к трём, чужое съедено, двенадцать обменов — сыта, осколок после — нет ── */
  {const q=MA_Q(0xA4A,"anomaly"),T=plnAnomTable(q.seed),ins=Object.keys(T);
    eq(ins.length,3,"аномалия: три входа в таблице");
    for(const k of ins)ok(TRADE_KEYS.indexOf(T[k])>=0&&ins.indexOf(T[k])<0,"аномалия: выход «"+T[k]+"» — другой груз");
    mvPrep();for(const k of RES_KEYS)G.cargo[k]=0;
    plnActDo(q,"gauge",ctx);
    const eat=TRADE_KEYS.find(k=>!T[k]);G.cargo[eat]=1;
    plnActDo(q,"feed",ctx);
    eq(G.cargo[eat]|0,0,"аномалия: чужое съедено");eq(plnActMemo(q,true).n.fed|0,0,"аномалия: съеденное не обмен");
    let got=0;
    for(let i=0;i<12;i++){for(const k of RES_KEYS)G.cargo[k]=0;G.cargo[ins[0]]=1;
      plnActDo(q,"feed",ctx);got+=G.cargo[T[ins[0]]]|0;}
    const m=plnActMemo(q,true);
    eq(m.st,2,"аномалия: двенадцать обменов — сыта");eq(got,12,"аномалия: выдала двенадцать");
    eq(plnActDo(q,"shard",ctx),null,"аномалия: у сытой осколка не взять");
    const q2=MA_Q(0xA4B,"anomaly");mvPrep();plnActDo(q2,"shard",ctx);
    eq(plnActMemo(q2,true).way,"drain","аномалия: осколок — схлопнулась");
    eq(plnActDo(q2,"feed",ctx),null,"аномалия: схлопнувшуюся не кормят");
    const pr=plnActPrompt(q,plnActMemo(MA_Q(0xA4C,"anomaly"),true),{at:{s:PLN_ACT.kinds.anomaly.spots[0],d:0,dx:0},near:null,D:plnActDims(q),xm:q.x/PLN_M},0);
    ok(/ПРИБОРЫ: [▓▒░]{4} М/.test(pr),"аномалия: приборы врут во второй строке");}

  /* ── завод: переналадка за восемь техкомпонентов, после неё линия молчит ── */
  {const q=MA_Q(0xFAC,"factory");mvPrep();
    plnActDo(q,"power",ctx);
    G.cargo.techcomp=7;
    const r0=plnActDo(q,"retool",ctx);eq(r0,null,"завод: без восьми техкомпонентов переналадки нет");
    G.cargo.techcomp=8;const ids0=new Set(G.inv.map(p=>p.id));
    ok(plnActDo(q,"retool",ctx),"завод: переналажен");
    eq(G.cargo.techcomp|0,0,"завод: восемь техкомпонентов ушли");
    ok(G.inv.some(p=>!ids0.has(p.id)),"завод: часть корабля получена");
    eq(plnActDo(q,"crate",ctx),null,"завод: выработанный не даёт ящик");}

  /* ── пушка: один выстрел; звери бегут; деяние записано ── */
  {let shot=null,burst=null;
    for(let s=1;s<60&&!(shot&&burst);s++){const q=MA_Q(0x6A400+s,"battery");mvPrep();
      G.surf={x:q.x,suit:100,deposits:[],fauna:[{x:q.x+40*PLN_M,shy:0,vx:-.1},{x:q.x-500*PLN_M,shy:0,vx:.1}],plants:[]};
      const d0=((holdOf(G.sx+","+G.sy).deeds||{}).shot)|0;
      plnActDo(q,"breech",ctx);plnActDo(q,"lay",ctx);plnActDo(q,"fire",ctx);
      const m=plnActMemo(q,true);
      if(m.way==="shot"&&!shot){shot=q;
        eq(G.surf.fauna[0].shy,1,"пушка: ближний зверь пугается");ok(G.surf.fauna[0].vx>0,"пушка: ближний зверь бежит прочь");
        eq(G.surf.fauna[1].shy,0,"пушка: дальний не слышит");
        eq(((holdOf(G.sx+","+G.sy).deeds||{}).shot)|0,d0+1,"пушка: деяние «shot» записано");}
      if(m.way==="burst"&&!burst){burst=q;eq(G.surf.suit,80,"пушка: разрыв — скафандр −20");}
      eq(plnActDo(q,"fire",ctx),null,"пушка: второго выстрела нет");}
    ok(shot,"пушка: есть семя с выстрелом");ok(burst,"пушка: есть семя с разрывом");
    G.surf=null;}

  /* ── устье пещеры уходит с ориентира; к площадке не подходит ── */
  {const q={k:"battery",x:5000,h:204,sc:1,seed:7},S={tr:{poi:[q],W:10000,padX:1000},cave:{x:5010},plants:[{x:5000},{x:9000}]};
    ok(caveRoom(S),"устье на пушке — сдвинуто");
    ok(!caveRoomSpans(S).some(s=>S.cave.x>s[0]&&S.cave.x<s[1]),"устье вне тела и мест ориентира: "+Math.round(S.cave.x));
    ok(S.plants.every(p=>Math.abs(p.x-S.cave.x)>=50),"у нового устья пятачок расчищен");
    const sp=caveRoomSpans(S)[0],S2={tr:{poi:[q],W:10000,padX:sp[0]-200},cave:{x:q.x-5},plants:[]};
    caveRoom(S2);eq(Math.round(S2.cave.x),Math.round(sp[1]),"ближний край у площадки — устье уходит к дальнему");
    const S3={tr:{poi:[q],W:10000,padX:1000},cave:{x:8000},plants:[]};
    ok(!caveRoom(S3)&&S3.cave.x===8000,"устье в стороне не трогается");}

  eq(G.credits,cr,"ни один акт пятёрки не дал кредитов");
  G.surf=pSurf;PLN.on=pOn;PLN.bad=pBad;
}));
