/* ══════════════ три шкалы станции и каскад (M906 · DESIGN-game §4.2, §7.1) ══════════════
   У каждой станции три числа: СКЛАД, ЛЮДИ, ПОРЯДОК (0–1). Нужда, которую не закрыли, бьёт по
   складу и людям; пустой склад останавливает цех, и то, что станция делала, становится нуждой
   у соседей — каскад. Занятость бьёт по порядку, освобождение его поднимает. Всё само тянется
   к середине: оставленный участок — посредственный, а не мёртвый.

   ПРАВИЛА ФАЙЛА:
   1. Числа игроку не показываются. Их видно по залу (толпа в кантине — ЛЮДИ), по цене, по
      прилавку (цех стоит) и словами на доске. Ни процентов, ни полосок.
   2. Судят только сыгранные окна нужд (15 минут игры, 12aa) и только станции участка плюс два
      прыжка вокруг игрока. Остальная галактика не считается — она лениво стоит на середине.
   3. Хранится разреженно: G.gauge[key]=[склад,люди,порядок в сотых, минута записи]. Чтение
      досчитывает возврат к середине по времени (постоянная два часа); запись, вернувшаяся
      к середине, удаляется. Каскад — G.casc {s: остановленные цеха, n: нужды у соседей}.
   4. Нужду, закрытую баржами (watchNpc, 28j), не судят ни в плюс, ни в минус: в плюс идёт
      только ваш привоз. Нужда соседей по каскаду живёт час и не каскадирует дальше.
   5. Каскадная нужда идёт ПЕРВОЙ: своя нужда соседа на это время спрятана и потому не судится
      ни здесь, ни в норме участка (watchNeedAt молчит). Иначе каскад прятался бы за своей
      нуждой — кадр 15.10: «Энтурикс · кремний», а изотопы, ради которых всё, не видны.
      Закрытая каскадная идёт в норму участка как сданный наряд (W.ord).
   6. Отступления от §4.2 — в DESIGN-game (Built 14.10): цех встаёт не от каждой нужды, а
      когда склад падает ниже четверти; возврат к середине — по времени, а не шагом сводки. */
const GAUGE_MID=.6,GAUGE_TAU=7200000,GAUGE_DRY=.25,GAUGE_LOW=.4,GAUGE_SOUR_MUL=.92;
const GAUGE_NEAR=2,CASC_MS=3600000,CASC_N=2,CASC_R=3;
let GAUGE_W=null;   /* последнее окно нужд, которое видел такт; G.t начинается заново каждый заход */
function gaugeAll(){return G.gauge||(G.gauge={});}
function gaugeCasc(){const C=G.casc||(G.casc={s:{},n:{}});C.s=C.s||{};C.n=C.n||{};return C;}
function gaugeKeyXY(key){const p=String(key).split(",");return [p[0]|0,p[1]|0];}
/* куда тянется порядок: занятость держит его ниже */
function gaugeMidO(sx,sy){return Math.max(0,GAUGE_MID-.15*occLvl(sx,sy));}
function gaugeRead(key){
  const xy=gaugeKeyXY(key),tO=gaugeMidO(xy[0],xy[1]),A=gaugeAll()[key];
  if(!A)return {s:GAUGE_MID,m:GAUGE_MID,o:tO};
  const f=Math.exp(-Math.max(0,now()-A[3]*60000)/GAUGE_TAU);
  return {s:GAUGE_MID+(A[0]/100-GAUGE_MID)*f,m:GAUGE_MID+(A[1]/100-GAUGE_MID)*f,o:tO+(A[2]/100-tO)*f};
}
function gaugeOf(sys){return gaugeRead(sys.key);}
function gaugeAdd(sys,ds,dm,dO){
  const g=gaugeOf(sys),p=x=>Math.round(clamp(x,0,1)*100);
  const A=[p(g.s+ds),p(g.m+dm),p(g.o+dO),Math.floor(now()/60000)];
  gaugeAll()[sys.key]=A;
  if(dm&&G.sys&&G.sys.key===sys.key)HALL.L=null;   /* люди сменились при вас — зал перестроится */
  return {s:A[0]/100,m:A[1]/100,o:A[2]/100};
}
/* для тестов и стенда: поставить шкалы как есть */
function gaugeSet(sys,v){const g=gaugeOf(sys);return gaugeAdd(sys,(v.s!=null?v.s:g.s)-g.s,(v.m!=null?v.m:g.m)-g.m,(v.o!=null?v.o:g.o)-g.o);}
function gaugeSour(sys){return !!(sys&&sys.station)&&gaugeOf(sys).m<GAUGE_LOW;}
/* наступление пиратов в эту систему: при плохом порядке — в полтора раза смелее (13b) */
function gaugeSpread(sx,sy){
  if(!starAt(sx,sy))return 1;
  const S=getSystem(sx,sy);
  return S&&S.station&&gaugeOf(S).o<GAUGE_LOW?1.5:1;
}
/* ── цех и каскад ── */
function gaugeStopOf(sys){const C=G.casc&&G.casc.s&&G.casc.s[sys.key];return C&&C.u>now()?C:null;}
function gaugeStopped(sys,k){const C=sys&&gaugeStopOf(sys);return !!(C&&C.k===k);}
/* что станция делает сама: товар, который у неё дешевле всего против базовой цены */
function gaugeMade(sys){
  let best=null,bv=1e9;
  for(const k of ORE_KEYS){const p=sys.station.prices[k];if(!p)continue;const v=p/RES[k].price;if(v<bv){bv=v;best=k;}}
  return best;
}
function gaugeStop(S){
  const k=gaugeMade(S);if(!k)return null;
  const C=gaugeCasc(),u=now()+CASC_MS,nb=[];
  C.s[S.key]={k,u};
  for(let x=S.sx-CASC_R;x<=S.sx+CASC_R;x++)for(let y=S.sy-CASC_R;y<=S.sy+CASC_R;y++){
    if((x===S.sx&&y===S.sy)||!starAt(x,y))continue;
    const N=getSystem(x,y);
    if(!N||!N.station||!N.station.prices||!N.station.prices[k])continue;
    const c=C.n[N.key];if(c&&!c.d&&c.u>now())continue;
    nb.push({N,d:Math.max(Math.abs(x-S.sx),Math.abs(y-S.sy))});
  }
  nb.sort((a,b)=>(a.d-b.d)||(a.N.key<b.N.key?-1:1));
  const to=nb.slice(0,CASC_N).map(x=>x.N);
  for(const N of to)C.n[N.key]={k,f:S.key,u,d:0};
  logAdd("warn","«"+S.station.name+"»: склад пуст, встал цех — "+RES[k].ru.toLowerCase()+
    (to.length?" ждут у "+gaugeNames(to.map(N=>N.key)):" здесь не купить"));
  return {k,to:to.map(N=>N.key)};
}
/* ── суд над окном нужд ── */
function gaugeJudgeSet(){
  const out=new Map();
  for(const S of watchStations())out.set(S.key,S);
  for(let x=G.sx-GAUGE_NEAR;x<=G.sx+GAUGE_NEAR;x++)for(let y=G.sy-GAUGE_NEAR;y<=G.sy+GAUGE_NEAR;y++){
    if(!starAt(x,y))continue;
    const S=getSystem(x,y);
    if(S&&S.station&&S.station.prices&&!out.has(S.key))out.set(S.key,S);
  }
  return [...out.values()];
}
function gaugeCascAt(sys){
  const C=G.casc&&G.casc.n&&G.casc.n[sys.key];
  return C&&!C.d&&C.u>now()&&sys.station&&sys.station.prices&&sys.station.prices[C.k]&&RES[C.k]?C:null;
}
function gaugeJudge(w){
  const out=[];
  for(const S of gaugeJudgeSet()){
    const k=watchNeedAt(S,w);if(!k)continue;
    const c=needAll()[S.key];
    if(c&&c.win===w)continue;   /* закрыли вы (нужду соседей закрывают только после своей) */
    if(watchNpc(S,w))continue;  /* закрыли баржи */
    const g=gaugeAdd(S,-.2,-.1,0);
    const stop=(g.s<GAUGE_DRY&&!gaugeStopOf(S))?gaugeStop(S):null;
    out.push({key:S.key,k,stop});
  }
  return out;
}
function gaugePrune(){
  const A=gaugeAll(),t=now();
  for(const key in A){
    const g=gaugeRead(key),xy=gaugeKeyXY(key);
    if(Math.abs(g.s-GAUGE_MID)<.02&&Math.abs(g.m-GAUGE_MID)<.02&&Math.abs(g.o-gaugeMidO(xy[0],xy[1]))<.02)delete A[key];
  }
  if(G.casc){
    for(const k in G.casc.s||{})if(!(G.casc.s[k].u>t))delete G.casc.s[k];
    for(const k in G.casc.n||{})if(!(G.casc.n[k].u>t))delete G.casc.n[k];
  }
}
function gaugeTick(){
  const w=needWin();
  if(GAUGE_W==null||w<GAUGE_W){GAUGE_W=w;return null;}
  if(w===GAUGE_W)return null;
  let out=[];
  for(let v=Math.max(GAUGE_W,w-4);v<w;v++)out=out.concat(gaugeJudge(v));
  GAUGE_W=w;
  gaugePrune();
  return out;
}
/* такт — вместе с участком (сданная смена его останавливает: 28j возвращается раньше) */
const GAUGE_OLD_MGR=mgrTick;
mgrTick=function(){
  if(!watchHanded()){try{gaugeTick();}catch(e){logAdd("warn","СБОЙ · шкалы станций: "+(e&&e.message));}}
  return GAUGE_OLD_MGR.apply(this,arguments);
};
/* нужда соседей идёт первой (правило 5); своя на это время молчит и в суде участка */
const GAUGE_OLD_NEEDOF=needOf;
needOf=function(sys){
  const C=sys&&sys.station?gaugeCascAt(sys):null;
  if(!C)return GAUGE_OLD_NEEDOF.apply(this,arguments);
  const xy=gaugeKeyXY(C.f),F=starAt(xy[0],xy[1])?getSystem(xy[0],xy[1]):null;
  return {k:C.k,win:needWin(),ru:RES[C.k].ru.toLowerCase(),casc:C.f,
    why:"встал цех"+(F&&F.station?" у «"+F.station.name+"»":"")};
};
const GAUGE_OLD_NEEDAT=watchNeedAt;
watchNeedAt=function(S,w){return gaugeCascAt(S)?null:GAUGE_OLD_NEEDAT.apply(this,arguments);};
/* ваш привоз: склад +.3, люди +.05. Каскадную закрывают здесь же, мимо отметки окна (G.need):
   иначе один привоз закрыл бы заодно и свою нужду станции в этом окне */
const GAUGE_OLD_CLOSE=needClose;
needClose=function(sys,k){
  const N=needOf(sys);
  if(N&&N.casc){
    if(N.k!==k)return false;
    G.casc.n[sys.key].d=1;
    gaugeAdd(sys,.3,.05,0);
    repAdd(2,sys);
    recordAdd(sys.station.name,"благодарность: привёз "+N.ru+", когда "+N.why);
    peopleLine("привезли "+N.ru+", когда "+N.why+". Это помнят.",sys.station.name,true);
    sfx("ok",{v:.4});
    if(!watchHanded()&&watchHas(sys)){watchTick();watchSt().ord++;}
    return true;
  }
  const r=GAUGE_OLD_CLOSE.apply(this,arguments);
  if(r&&sys&&sys.station)gaugeAdd(sys,.3,.05,0);
  return r;
};
/* порядок: заняли — минус, отбили — плюс */
const GAUGE_OLD_OCCSET=occSet;
occSet=function(sx,sy,lvl){
  const was=occLvl(sx,sy);
  const r=GAUGE_OLD_OCCSET.apply(this,arguments);
  const now_=occLvl(sx,sy);
  if(now_!==was&&starAt(sx,sy)){
    const S=getSystem(sx,sy);
    if(S&&S.station){
      if(now_>was)gaugeAdd(S,0,0,-.3*(now_-was));
      else if(!now_)gaugeAdd(S,0,0,.5);
    }
  }
  return r;
};
/* люди хмурые: скупщик берёт на восемь процентов дешевле; ваша покупка — по обычной цене */
const GAUGE_OLD_CTX=marketCtx;
marketCtx=function(sys,m){
  const C=GAUGE_OLD_CTX.apply(this,arguments);
  if(gaugeSour(sys))C.occ*=GAUGE_SOUR_MUL;
  return C;
};
const GAUGE_OLD_BUYP=buyPriceFor;
buyPriceFor=function(sys,k){
  const p=GAUGE_OLD_BUYP.apply(this,arguments);
  return gaugeSour(sys)?Math.max(p,Math.round(p/GAUGE_SOUR_MUL)):p;
};
/* и именного от хмурой станции не будет */
const GAUGE_OLD_OFFER=offerAdd;
offerAdd=function(kind,who,named){
  const sour=G.sys&&who==="st:"+G.sys.key&&gaugeSour(G.sys);
  if(!sour)return GAUGE_OLD_OFFER.apply(this,arguments);
  const f=folkOf(who),w0=f.warm,n0=f.named;
  const o=GAUGE_OLD_OFFER.call(this,kind,who,false);
  if(o&&o.named){o.named=0;f.warm=w0;f.named=n0;}
  return o;
};
/* цех стоит: сделанного здесь не купить */
const GAUGE_OLD_BUY=buyCargo;
buyCargo=function(sys,k,qty){
  if(gaugeStopped(sys,k)){say("Цех стоит\n"+RES[k].ru.toLowerCase()+" здесь не делают",120);return 0;}
  return GAUGE_OLD_BUY.apply(this,arguments);
};
const GAUGE_OLD_COOPBUY=coopBuy;
coopBuy=function(sys,k,qty){
  if(gaugeStopped(sys,k)){say("Цех стоит\n"+RES[k].ru.toLowerCase()+" здесь не делают",120);return 0;}
  return GAUGE_OLD_COOPBUY.apply(this,arguments);
};
/* ── толпа в зале — это ЛЮДИ (§7.1): у середины столько, сколько у типа станции; выше — больше,
   до девяти; к трети — один у стойки ── */
function gaugeCrowd(list){
  if(!G.sys||!G.sys.station)return list;
  const m=gaugeOf(G.sys).m,b=list.length;
  let n=m>=GAUGE_MID?Math.round(b*(1+(m-GAUGE_MID)/.3*.5)):Math.round(1+(b-1)*clamp((m-.3)/.3,0,1));
  n=clamp(n,1,C3_SLOT.length);
  if(n<=b)return list.slice(0,n);
  const out=list.slice();
  for(let k=0;k<C3_SLOT.length&&out.length<n;k++)if(out.indexOf(k)<0)out.push(k);
  return out;
}
/* ходячий зал (27f4a): посетитель у доски, грузчик, пары за столиками стоят всегда — ниже
   середины их становится меньше, к трети остаётся один; выше середины зал полнее за счёт кантины */
function gaugeHallCrowd(P){
  if(!G.sys||!G.sys.station)return P;
  const m=gaugeOf(G.sys).m;if(m>=GAUGE_MID)return P;
  const n=P.filter(p=>p.kind==="crowd").length,keep=Math.round(1+(n-1)*clamp((m-.3)/.3,0,1));
  let i=0;return P.filter(p=>p.kind!=="crowd"||i++<keep);
}
/* ── доска: положение станции словами ── */
function gaugeNames(keys){
  const L=keys.map(k=>{const xy=gaugeKeyXY(k);return {n:getSystem(xy[0],xy[1]).station.name,xy};});
  return L.map(x=>"«"+x.n+"»"+(L.filter(y=>y.n===x.n).length>1?" "+x.xy[0]+":"+x.xy[1]:"")).join(", ");
}
function gaugeRows(){
  const rows=[],S=G.sys;
  if(!S||!S.station||!S.station.prices)return rows;
  const g=gaugeOf(S),st=gaugeStopOf(S);
  if(st){
    const c=G.casc.n,to=Object.keys(c).filter(k=>c[k].f===S.key&&!c[k].d&&c[k].u>now());
    rows.push(["Цех стоит: "+RES[st.k].ru.toLowerCase()+" не делают","склад пуст — нужду не закрыли вовремя"+
      (to.length?". Ждут у "+gaugeNames(to):"")+" · снова через "+Math.max(1,Math.round((st.u-now())/60000))+" мин"]);
  }
  if(g.m<GAUGE_LOW)rows.push(["Люди хмурые","скупщик сбавляет цену, именного не предложат. Привезёте, чего нет, — оттают"]);
  if(g.o<GAUGE_LOW&&occLvl(S.sx,S.sy))rows.push(["Отбить «"+S.name+"»","порядка нет: пираты крепнут быстрее. Считаются сбитые в этой системе"]);
  const W=G.uch;
  if(W&&watchHas(S)){
    let n=0;
    for(const T of watchStations()){
      if(T===S||n>=2)continue;
      const ts=gaugeStopOf(T),lo=gaugeOf(T).o<GAUGE_LOW&&occLvl(T.sx,T.sy);
      if(!ts&&!lo)continue;
      const d=Math.max(Math.abs(T.sx-S.sx),Math.abs(T.sy-S.sy));
      rows.push(["«"+T.station.name+"»: "+(ts?"цех стоит":"отбить"),(ts?"нет "+RES[ts.k].ru.toLowerCase():"пираты крепнут")+" · "+d+" "+pl3(d,"прыжок","прыжка","прыжков")]);
      n++;
    }
  }
  return rows;
}
function gaugeSection(){
  const rows=gaugeRows();if(!rows.length)return;
  secHead("ПОЛОЖЕНИЕ");
  for(const [b,s] of rows)$body.appendChild(el("div","row","<div class='nm'><b>"+b+"</b><s>"+s+"</s></div>"));
}
const GAUGE_OLD_WSEC=watchSection;
watchSection=function(){const r=GAUGE_OLD_WSEC.apply(this,arguments);gaugeSection();return r;};
/* ── запись ── */
const GAUGE_OLD_SNAP=snapshot;
snapshot=function(){
  const s=GAUGE_OLD_SNAP.apply(this,arguments);
  s.gauge=G.gauge&&Object.keys(G.gauge).length?G.gauge:null;
  s.casc=G.casc&&(Object.keys(G.casc.s||{}).length||Object.keys(G.casc.n||{}).length)?G.casc:null;
  return s;
};
const GAUGE_OLD_APPLY=applySave;
applySave=function(s){
  const r=GAUGE_OLD_APPLY.apply(this,arguments);
  if(!r)return r;   /* отказ: мир не тронут (91qo) */
  G.gauge={};G.casc=null;GAUGE_W=null;
  const g=s&&s.gauge;
  if(g&&typeof g==="object")for(const k in g){
    const A=g[k];
    if(/^-?\d+,-?\d+$/.test(k)&&Array.isArray(A)&&A.length===4&&A.every(x=>isFinite(x)))
      G.gauge[k]=[clamp(A[0]|0,0,100),clamp(A[1]|0,0,100),clamp(A[2]|0,0,100),A[3]|0];
  }
  const c=s&&s.casc;
  if(c&&typeof c==="object"){
    const C=gaugeCasc();
    for(const k in c.s||{}){const x=c.s[k];if(x&&RES[x.k]&&isFinite(x.u))C.s[k]={k:x.k,u:+x.u};}
    for(const k in c.n||{}){const x=c.n[k];if(x&&RES[x.k]&&isFinite(x.u))C.n[k]={k:x.k,f:String(x.f||""),u:+x.u,d:x.d?1:0};}
  }
  return r;
};
