/* ══════════════ планета: ориентиры как места действия (M627b) ══════════════
   Грамматика (docs/DESIGN-marks.md §2–§3):
   · у памятника есть места под рукой — смещение dx (м) от середины вдоль линии хода и охват r;
     человек подходит к части памятника, а не к памятнику целиком;
   · глаголы только свои: нажать ДЕЙСТВИЕ, удержать (полоса ━━━━╌╌╌╌, отпустил — тает),
     нажать в воздухе на ранце; нового интерфейса нет — строка подсказки, say, tell, журнал, звук;
   · тело отвечает: свет, лампы и подвижные части читают память памятника каждый кадр;
   · одна развилка на памятник: взять наверняка или разбудить; кредитов — никогда;
   · память — G.poiSeen[seed] = {k,got,t,st,way,t0,n,day,dep}; got — короткая строка состояния,
     её по-прежнему читают «ОСМОТРЕНО» поверхности и журнал; старые 1 и {} поднимаются до st:0.
   Вид — одна запись PLN_ACT.kinds[вид]: мерки dims(H), места spots[], переходы act, got(m),
   привод тела drive(m,age,D,t,nk). Новый вид — новая запись, движок не трогается.

   Перехват без правок чужих файлов: охват poiNear раздвинут до дальнего места памятника;
   память пишется в тот кадр, когда поверхность в ветке памятника, — старый осмотр (20b) больше
   не срабатывает; подсказку переписывает кадр рисунка (28-loop: шаг мира → рисунок → hud()).
   Первый акт на памятнике платит то же, что платил осмотр 20b: данные, узел, редкость. */
const PLN_ACT={on:true,kinds:{},
  pinAge:null,                          /* стенд: сколько секунд прошло после последнего акта (кадр ловит тело в движении) */
  hold:{seed:null,id:null,p:0,lock:false},
  inp:{prev:false,lastT:null,down:false,edge:false,dT:0},
  wrote:"",dbg:null,sfxT:0};
function plnActOn(){return !!(PLN_ACT.on&&(typeof PLN_MARK==="undefined"||PLN_MARK.on));}

/* ── память памятника ── make — завести, если нет */
function plnActMemo(q,make){
  if(!q)return null;
  if(!G.poiSeen||Array.isArray(G.poiSeen))G.poiSeen=(typeof asMap==="function")?asMap(G.poiSeen):{};
  const K=PLN_ACT.kinds[q.k];
  let v=G.poiSeen[q.seed];
  if(!v){
    if(!make)return null;
    v={k:q.k,got:"",t:Math.round(G.t||0),st:0,way:null,t0:0,n:{},day:null,dep:null};
    G.poiSeen[q.seed]=v;
  }else if(typeof v!=="object"||v.st==null){
    /* старое сохранение: единица или {k,got,t} — памятник уже осмотрен и уже заплатил */
    const o=(typeof v==="object")?v:{};
    v=Object.assign({},o,{k:o.k||q.k,t:o.t|0,st:0,way:null,t0:0,n:{paid:1},day:null,dep:null});
    if(o.got)v.n.old=String(o.got);
    G.poiSeen[q.seed]=v;
  }
  if(!v.n||typeof v.n!=="object")v.n={};
  if(K&&(!v.got||v.got!==K.got(v)))v.got=K.got(v);
  if(typeof v.got!=="string")v.got=String(v.got||"");
  return v;
}
/* память без заведения: тело читает её каждый кадр */
function plnMarkState(q){return plnActMemo(q,false);}

/* ── броски и подарки ── */
function plnActRoll(seed,salt,n){return rng(hashi(seed>>>0,salt|0,n|0));}
function plnActDailyReady(m){return !!m&&m.day!==celDay();}
function plnActDaily(m){if(!plnActDailyReady(m))return false;m.day=celDay();return true;}

/* ── места ── */
function plnActDims(q){const K=PLN_ACT.kinds[q.k];return K?K.dims(plnMarkH(q)):null;}
function plnActSpotDx(kind,id,H){
  const K=PLN_ACT.kinds[kind];if(!K)return 0;
  const s=K.spots.find(x=>x.id===id);return s?s.dx(K.dims(H)):0;
}
/* как далеко от середины памятника лежит его дальнее место, м */
function plnActSpan(q){
  const K=PLN_ACT.kinds[q.k];if(!K)return 0;
  const D=K.dims(plnMarkH(q));let w=0;
  for(const s of K.spots)w=Math.max(w,Math.abs(s.dx(D))+s.r);
  return w;
}
function plnActLive(K,s,m,D){return !s.when||s.when(m,D);}
/* место под рукой: ближайшее живое; на земле — стоя, не на бегу; в воздухе — выше места */
function plnActReach(q,S,m){
  const K=PLN_ACT.kinds[q.k];if(!K||!S)return null;
  const D=K.dims(plnMarkH(q)),xm=S.x/PLN_M,cx=q.x/PLN_M;
  const hAir=(S.on!==false||!S.tr)?0:Math.max(0,(groundAt(S.tr,S.x)-S.y)/PLN_M);
  let best=null,near=null;
  for(const s of K.spots){
    if(!plnActLive(K,s,m,D))continue;
    const dx=cx+s.dx(D)-xm,d=Math.abs(dx);
    let ok=d<s.r;
    if(ok&&s.air)ok=S.on===false&&hAir>=s.air;
    else if(ok)ok=S.on!==false&&!S.jetOn&&(S.walkAmp||0)<.25;
    if(ok){if(!best||d<best.d)best={s,d,dx};}
    else if(!near||d<near.d)near={s,d,dx};
  }
  return {at:best,near,D,xm};
}
/* полоса удержания: восемь клеток, ━ — сделано, ╌ — осталось */
function plnActBar(f){const n=clamp(Math.round(f*8),0,8);return "━".repeat(n)+"╌".repeat(8-n);}
function plnActVerb(s,m,D){return typeof s.verb==="function"?s.verb(m,D):s.verb;}

/* ── подсказка: не больше двух строк; глагол — первым после «ДЕЙСТВИЕ —» (его берёт кнопка телефона) ── */
function plnActPrompt(q,m,R,holdP){
  const K=PLN_ACT.kinds[q.k],name=String(q.ru||K.ru||"").toUpperCase(),st=String(m.got||"").toUpperCase();
  const arrow=x=>(x>0?"▶ ":"◀ ")+Math.max(1,Math.round(Math.abs(x)))+" М";
  if(R.at){
    const s=R.at.s,v=plnActVerb(s,m,R.D);
    if(!v)return name+" · "+String(s.note||st).toUpperCase()+"\n"+st;
    const l1=s.hold?("УДЕРЖИВАЙТЕ ДЕЙСТВИЕ — "+v+" · "+plnActBar(holdP/s.hold)):("ДЕЙСТВИЕ — "+v+(v.indexOf(String(s.ru).toUpperCase())>=0?"":" · "+String(s.ru).toUpperCase()));
    /* развилка видна с места: второе живое место той же развилки названо с направлением */
    let l2=name+" · "+st;
    if(s.fork)for(const o of K.spots)if(o!==s&&o.fork===s.fork&&plnActLive(K,o,m,R.D)){
      l2="ИЛИ "+String(o.ru).toUpperCase()+" "+arrow(q.x/PLN_M+o.dx(R.D)-R.xm)+" · ОДНО ИЗ ДВУХ";break;}
    return l1+"\n"+l2;
  }
  const l1=name+" · "+st;
  if(R.near){const v=plnActVerb(R.near.s,m,R.D);
    if(v)return l1+"\n"+String(R.near.s.ru).toUpperCase()+" "+arrow(R.near.dx);}
  return l1;
}

/* ── первый акт платит то же, что осмотр 20b: данные, узел «из аномалии», редкость на своём адресе ── */
function plnActPay(q,m,d){
  if(m.n.paid)return 0;
  m.n.paid=1;
  const base=8+Math.floor(d*10);
  G.data+=base;
  nodeDrop("в аномалии",.4+d*.6,hashi(q.seed,0xA0,3));
  if(typeof rareTake==="function"){
    const at="здесь: "+String(q.ru||q.k).toLowerCase();
    if(q.k==="temple"&&G.relicHint)rareTake("temple",q.seed,at);
    else rareTake("poi",q.seed,at);
  }
  return base;
}
/* ── переход: чистая функция места; ctx — {d,p} (опасность, планета), в игре берутся сами ── */
function plnActDo(q,id,ctx){
  const K=q&&PLN_ACT.kinds[q.k];
  if(!K)return null;
  const m=plnActMemo(q,true),D=K.dims(plnMarkH(q)),s=K.spots.find(x=>x.id===id);
  if(!s||!plnActLive(K,s,m,D)||!plnActVerb(s,m,D))return null;
  ctx=ctx||{};
  const d=ctx.d!=null?ctx.d:sysDanger(G.sx,G.sy),p=ctx.p||(G.surf&&G.surf.p)||null;
  const c={q,m,D,d,p,K};
  const out=s.act(c)||{};
  if(out.keep){say(out.full||out.short||"");return {id,keep:true,msg:out.short||""};}
  const base=plnActPay(q,m,d);
  m.t0=G.t||0;m.n.last=id;m.t=Math.round(G.t||0);
  m.got=K.got(m);
  const ru=String(q.ru||K.ru||q.k);
  const head=ru.charAt(0)+ru.slice(1).toLowerCase()+": "+(out.short||m.got)+(base?" · +"+base+" данных":"");
  const full=out.full?(out.full+(base?"\n+"+base+" данных":"")):(ru+"\n"+(out.short||m.got)+(base?"\n+"+base+" данных":""));
  tell("tech",head,full);
  if(base)logAdd("tech","Осмотр: "+ru.toLowerCase()+" · "+(out.short||m.got));
  sfx(s.sfx||"ok");
  return {id,msg:out.short||"",paid:base,st:m.st,way:m.way};
}

/* ── ввод: один раз за кадр, свой фронт и своё время (G.t: 60 в секунду) ── */
function plnActInput(){
  const I=PLN_ACT.inp,now=G.t||0;
  I.dT=I.lastT==null?0:clamp(now-I.lastT,0,4);I.lastT=now;
  I.down=!!(typeof keys!=="undefined"&&keys&&keys.act);
  I.edge=I.down&&!I.prev;I.prev=I.down;
  return I;
}
/* ветка памятника у поверхности: её подсказка или наша прошлого кадра */
function plnActBranch(){
  const g=String(G.prompt||"");
  return g.indexOf("ОСМОТРЕНО")===0||g.indexOf("ДЕЙСТВИЕ — ОСМОТРЕТЬ")===0||(PLN_ACT.wrote&&g===PLN_ACT.wrote);
}
const plnActEase=u=>{u=clamp(u,0,1);return u*u*(3-2*u);};
/* ── кадр одного памятника: привод тела, а если человек у него — подсказка и ввод ──
   it — запись памятника (21pie), nk — ночь, t — часы кадра. Возвращает {prompt, drive} */
function plnActFrame(it,S,p,nk,t){
  const q=it.q,K=PLN_ACT.kinds[q.k];
  if(!K||!plnActOn())return null;
  const own=S&&S.tr&&poiNear(S,S.tr)===q&&plnActBranch();
  const m=own?plnActMemo(q,true):plnMarkState(q);
  const D=K.dims(it.H);
  const age=PLN_ACT.pinAge!=null?PLN_ACT.pinAge:(m?((G.t||0)-(m.t0||0))/60:99);
  const mm=m||{st:0,way:null,n:{},got:""};
  const drive=K.drive?K.drive(mm,age,D,t,nk):{};
  let prompt=null,H=PLN_ACT.hold;
  if(own){
    const I=PLN_ACT.inp,R=plnActReach(q,S,m),s=R.at&&R.at.s;
    if(!s||H.seed!==q.seed||H.id!==s.id){H.seed=q.seed;H.id=s?s.id:null;H.p=0;}
    if(!I.down)H.lock=false;
    if(s&&plnActVerb(s,m,R.D)){
      if(s.hold){
        if(I.down&&!H.lock){
          H.p+=I.dT/60;
          if((G.t||0)-PLN_ACT.sfxT>22){PLN_ACT.sfxT=G.t||0;sfx(s.hum||"drill");}
          if(H.p>=s.hold){H.p=0;H.lock=true;plnActDo(q,s.id);}
        }else H.p=Math.max(0,H.p-I.dT/60*1.5);
        if(H.p>0&&H.id===s.id)drive.spark={id:s.id,k:.6+.4*Math.abs(Math.sin((G.t||0)*.9))};
      }else if(I.edge){plnActDo(q,s.id);H.lock=true;}
    }
    prompt=plnActPrompt(q,m,R,H.p);
    PLN_ACT.dbg={seed:q.seed,prompt,spot:s?s.id:null,hold:+H.p.toFixed(2)};
  }
  return {prompt,drive,age};
}
/* охват подхода: поверхность зовёт памятник «рядом», пока человек в пределах его дальнего места */
const PLN_ACT_POI_NEAR=poiNear;
poiNear=function(S,tr){
  const q=PLN_ACT_POI_NEAR(S,tr);
  if(q||!plnActOn()||!S)return q;
  for(const z of (tr&&tr.poi)||[]){
    if(!PLN_ACT.kinds[z.k])continue;
    if(Math.abs(z.x-S.x)<plnActSpan(z)*PLN_M)return z;
  }
  return null;
};

/* ══════════════ остов корабля (§4.1) ══════════════
   Нос — к +x, задран; корма — к −x, на ней двигательный отсек с соплами. Люк — в корме у
   разлома; грузовой отсек — в носу; самописец лежит у линии под носом; маяк — мачта у кормы,
   которую поставили те, кто ушёл. Развилка — отсеки: двигательный отдаёт часть, и пар выжигает
   груз; грузовой отдаёт ящики, и корма с двигателем уходит в ленту. */
const PLN_WRECK_END=[
  "Второй двигатель не отвечает. Садимся на что есть. Кто найдёт нас — груз ваш.",
  "Связи нет третий день. Воду делим на четверых, хотя нас уже трое.",
  "Маяк оставляю включённым. Если кто-то видит огонь — мы шли не зря.",
  "Корпус треснул у отсеков. Режьте с кормы, там переборка ещё держит.",
  "Ночью вокруг корпуса кто-то ходит. Люк не открываем до самого света.",
  "Кислорода на сорок часов. Пишу, чтобы было слышно не только себя.",
  "Ушли пешком к хребту. Если вернёмся — сотрите эту запись, стыдно.",
  "Курс был верный, планета — нет. Передайте на трассу: здесь не садиться."];
/* цены соседней станции — как архив обсерватории (20b) */
function plnActPriceLead(r){
  for(let i=0;i<30;i++){
    const sx=G.sx+Math.round((r()*2-1)*4),sy=G.sy+Math.round((r()*2-1)*4);
    if(!starAt(sx,sy))continue;
    const s=getSystem(sx,sy);
    if(!s.station||(G.market&&G.market[s.key]))continue;
    if(!G.market)G.market={};
    G.market[s.key]={pressure:{},t:G.t};
    return "Последняя сводка: цены станции «"+s.station.name+"» ("+sx+":"+sy+")";
  }
  return null;
}
const plnWreckBeacon=m=>m.n.beacon!==0;
PLN_ACT.kinds.wreck={ru:"ОСТОВ КОРАБЛЯ",
  dims:H=>({H,L:H*2.6,R:H*.34}),
  got:m=>m.st===0?"не вскрыт":m.st===1?"люк вскрыт":m.way==="part"?"снята часть, груз сгорел":"взят груз, отсек ушёл",
  spots:[
    {id:"hatch",ru:"люк",dx:D=>-D.L*.2,r:3,hold:3,verb:"ВСКРЫТЬ ЛЮК",sfx:"creak",when:m=>m.st===0,
      act:c=>{c.m.st=1;return {short:"люк вскрыт"};}},
    {id:"part",ru:"двигательный отсек",dx:D=>-D.L*.36,r:3,hold:4,verb:"РЕЗАТЬ ДВИГАТЕЛЬНЫЙ ОТСЕК",fork:"bay",sfx:"boom",when:m=>m.st===1,
      act:c=>{
        const P=addPart(genPart(hashi(c.q.seed,7,0x1E),tierFromDanger(c.d,plnActRoll(c.q.seed,0x1E,1))));
        c.m.st=2;c.m.way="part";
        return {short:"снята часть"+(P&&P.name?" · "+P.name:"")+" · пар выжег грузовой отсек"};}},
    {id:"cargo",ru:"грузовой отсек",dx:D=>D.L*.2,r:3,hold:4,verb:"ВСКРЫТЬ ГРУЗОВОЙ ОТСЕК",fork:"bay",sfx:"boom",when:m=>m.st===1,
      act:c=>{
        if(held()>=stat().cargoMax)return {keep:true,short:"трюм полон",full:"Трюм полон\nящики останутся в отсеке"};
        const r=plnActRoll(c.q.seed,0xCA6,1);
        let pool=((c.p&&c.p.res)||[]).filter(k=>TRADE_KEYS.indexOf(k)>=0);
        if(pool.length<2)pool=pool.concat(TRADE_KEYS.filter(k=>pool.indexOf(k)<0));
        const a=pool[Math.floor(r()*pool.length)],rest=pool.filter(k=>k!==a),b=rest[Math.floor(r()*rest.length)];
        const got=[];
        for(const k of [a,b]){const n=addRes(k,3+Math.floor(r()*5+c.d*4));if(n>0)got.push(RES[k].ru+" ×"+n);}
        const tc=addRes("techcomp",2);if(tc>0)got.push(RES.techcomp.ru+" ×"+tc);
        c.m.st=2;c.m.way="cargo";
        return {short:"ящики: "+(got.length?got.join(", "):"трюм полон")+" · корма ушла в грунт"};}},
    {id:"log",ru:"рубка",dx:D=>D.L*.42,r:3,verb:m=>m.n.log?null:"СНЯТЬ ЗАПИСЬ",note:"запись снята",sfx:"signoff",
      act:c=>{
        const r=plnActRoll(c.q.seed,0x10C,1),end=PLN_WRECK_END[Math.floor(r()*PLN_WRECK_END.length)];
        const l1="Самописец рубки · запись "+(2+Math.floor(r()*38))+"-го дня";
        let l3=null;
        if(r()<.5&&typeof loreAddr==="function"){
          const A=loreAddr(c.q.seed^0x3EC);
          if(A){loreMarks().push({sx:A.sx,sy:A.sy,id:"wreck:"+c.q.seed});l3="Куда они шли: сектор "+A.sx+":"+A.sy;}
        }
        if(!l3)l3=plnActPriceLead(r);
        if(!l3){G.data+=10;l3="Дальше запись стёрта · +10 данных";}
        c.m.n.log=1;
        return {short:"самописец · "+l3.toLowerCase(),full:l1+"\n«"+end+"»\n"+l3};}},
    {id:"beacon",ru:"маяк",dx:D=>-D.L*.44,r:3,verb:m=>plnWreckBeacon(m)?"ВЫКЛЮЧИТЬ МАЯК":"ВКЛЮЧИТЬ МАЯК",sfx:"ui",
      act:c=>{const on=!plnWreckBeacon(c.m);c.m.n.beacon=on?1:0;
        return {short:on?"маяк снова мигает":"маяк погашен"};}}],
  /* привод тела: части сдвигаются от своих мест в местных метрах; k — яркость или копоть */
  drive:(m,age,D,t,nk)=>{
    const E=plnActEase,last=m.n.last,P={},st=m.st|0;
    const ev=(id,a,b)=>last===id?E((age-a)/(b-a)):1;
    const open=st>=1?ev("hatch",0,1):0;
    P.hatch={yaw:1.4*open};
    P.inside={k:.5*open*(.85+.15*Math.sin(t*.37)),hide:open<.02};
    const cargo=m.way==="cargo",part=m.way==="part";
    const doorE=cargo?ev("cargo",0,.8):part?ev("part",.15,.5):0;
    P.door={roll:-1.45*doorE,y:-.08*doorE,k:part?.35:1};
    const out=-(D.R*.45+1.4);
    for(let i=1;i<=3;i++){const e=cargo?ev("cargo",.5+i*.3,1.5+i*.3):0;
      P["crate"+i]={z:out*e*(1-.12*(i-2)),x:(i-2)*.35*e,y:-.14*e,yaw:.25*(i-2)*e,k:part?.3:1};}
    const bay=cargo?ev("cargo",2.2,3.4):0;
    P.bay={y:-2*bay,roll:.32*bay};
    /* пар: вспухает за треть секунды и съёживается к двум, оставаясь ярким — свечение непрозрачно, тусклое читалось бы копотью */
    const vap=part&&last==="part"&&age<2.2?clamp(1-(age-.4)/1.8,0,1):0;
    P.vapour={k:1.6+1.6*vap,s:.15+1.15*clamp(age/.3,0,1)*Math.sqrt(vap),hide:vap<=0};
    P.boxLamp={k:m.n.log?0:(Math.sin(t*.22)>.2?1.4:.15),hide:!!m.n.log};
    const on=plnWreckBeacon(m),blink=Math.sin(t*1.4)>.55?1:.08;
    const lamps=[];
    /* по важности: ламп у кадра мало, приводу памятников достаётся две */
    if(!P.vapour.hide)lamps.push({id:"vapour",r:6+D.R*2,c:[1,.8,.55],k:2.5*P.vapour.k});
    if(open>.02)lamps.push({id:"inside",r:3.5+D.R,c:[1,.66,.36],k:(.5+1.2*nk)*open});
    if(on&&blink>.5)lamps.push({id:"beacon",r:7,c:[1,.16,.08],k:1.3*Math.max(.25,nk)});
    return {light:on?blink:0,parts:P,lamps};
  }};
