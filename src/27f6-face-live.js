/* ══════════════ живое лицо (M729) ══════════════
   Выражение человека во времени: моргание, взгляд, дыхание, настроение и всплески эмоций на события.
   Числа отдаются оснастке cpRig (27f3) — сетка лица одна на все настроения.

   ПРАВИЛА ФАЙЛА:
   1. Состояние — по зерну человека, только в памяти (не в сейве): не больше 64 лиц, давние забываются.
   2. Время — wallMs() (анимация интерфейса), не now(): лицо живёт и на паузе игры, и в кантине без хода.
   3. Настроение читается из самого человека (cpMood): верность, черты, заказ генератора; событие
      (cpEmote) кладёт эмоцию поверх на время и уходит обратно в настроение.
   4. Нрав (черты) — не только лицо, но и повадка: трус чаще моргает и бегает глазами, пьющий — тяжёлые веки,
      легенда смотрит прямо и редко отводит взгляд. */
/* выражения: lu — верхнее веко (+ прищур, − распахнуто), ll — щёки поднимают нижнее, br — брови [левая, правая]
   вверх, bi — излом (внутренний конец вверх), sm — улыбка (− уголки вниз), sk — усмешка на одну сторону,
   mo — рот открыт, gz — взгляд от направления [вбок, вверх] */
const CP_EMO={
  calm:{lu:.04,ll:.1,br:[0,0],bi:[0,0],sm:.1,sk:0,mo:0,gz:[0,0]},
  glad:{lu:.1,ll:.7,br:[.25,.25],bi:[.1,.1],sm:1,sk:0,mo:.28,gz:[0,.02]},
  angry:{lu:.14,ll:.4,br:[-.55,-.55],bi:[-1,-1],sm:-.5,sk:0,mo:0,gz:[0,-.02]},
  sad:{lu:.24,ll:0,br:[0,0],bi:[1,1],sm:-.7,sk:0,mo:0,gz:[.05,-.16]},
  surprised:{lu:-.3,ll:0,br:[1,1],bi:[.45,.45],sm:0,sk:0,mo:.9,gz:[0,.03]},
  sly:{lu:.26,ll:.35,br:[.65,-.25],bi:[0,-.35],sm:.3,sk:.75,mo:0,gz:[.14,0]}
};
const CP_EMO_RU={calm:"спокоен",glad:"доволен",angry:"злится",sad:"грустит",surprised:"удивлён",sly:"хитрит"};
/* нрав по чертам: моргание (раз в сек), подвижность глаз, тяжесть век, привычная доля эмоции */
const CP_TEMPER={coward:{bk:.55,sac:1.8,lid:0,k:"sad",w:.25},para:{bk:.45,sac:2,lid:-.05,k:"surprised",w:.15},
  drink:{bk:.2,sac:.6,lid:.18,k:"glad",w:.25},legend:{bk:.18,sac:.5,lid:.05,k:"glad",w:.15},
  selfish:{bk:.3,sac:1.2,lid:.08,k:"sly",w:.45},pirate:{bk:.28,sac:1,lid:.1,k:"sly",w:.55},
  grip:{bk:.25,sac:.8,lid:.06,k:"angry",w:.3},mentor:{bk:.3,sac:.8,lid:0,k:"glad",w:.3},xeno:{bk:.3,sac:1.3,lid:-.04,k:"surprised",w:.2}};
/* настроение: заказ генератора (m.mood), иначе верность и черты */
function cpMood(m){
  if(!m||m.ai)return {k:"calm",w:0,T:null};
  let T=null;if(m.traits)for(const id of m.traits)if(CP_TEMPER[id]){T=CP_TEMPER[id];break;}
  if(m.mood&&CP_EMO[m.mood])return {k:m.mood,w:.75,T};
  const loy=(m.loy==null?55:m.loy)/100;
  if(loy<.22)return {k:"angry",w:.75,T};
  if(loy<.38)return {k:"sad",w:.6,T};
  if(T)return {k:T.k,w:T.w,T};
  if(loy>.78)return {k:"glad",w:.45,T};
  return {k:"calm",w:1,T};
}
const CP_FACE=new Map();
/* событие: эмоция k на ms миллисекунд поверх настроения (приветствие, сделка, отказ, плохая весть) */
function cpEmote(m,k,ms){
  if(!m||!CP_EMO[k])return;
  const F=cpFaceState(m);F.ev={k,t0:wallMs(),dur:ms||2400};
}
function cpFaceState(m){
  const key=m.seed>>>0;let F=CP_FACE.get(key);
  if(F){CP_FACE.delete(key);CP_FACE.set(key,F);return F;}
  const r=rng(hashi(key,0xFAC3,0x29));
  F={r,t:0,X:null,nb:0,bp:-1e9,b2:0,ns:0,sac:[0,0],away:0,ev:null};
  if(CP_FACE.size>=64)CP_FACE.delete(CP_FACE.keys().next().value);
  CP_FACE.set(key,F);return F;
}
/* смесь выражений: A + (B − A)·w по всем числам */
function cpEmoMix(A,B,w){
  const o={};for(const k in A){const a=A[k],b=B[k];o[k]=Array.isArray(a)?a.map((x,i)=>x+(b[i]-x)*w):a+(b-a)*w;}return o;
}
/* выражение на сейчас; base — взгляд, к которому он возвращается ([вбок, вверх] — на собеседника или в объектив) */
function cpFace(m,base){
  if(!m||m.ai)return null;
  const F=cpFaceState(m),t=wallMs(),dt=F.t?Math.min(.25,(t-F.t)/1000):1;F.t=t;
  const md=cpMood(m),T=md.T||{bk:.3,sac:1,lid:0};
  let tg=cpEmoMix(CP_EMO.calm,CP_EMO[md.k],md.w);
  if(F.ev){const e=(t-F.ev.t0)/F.ev.dur;
    if(e>=1)F.ev=null;
    else{const env=Math.min(1,e*8)*Math.min(1,(1-e)*4);tg=cpEmoMix(tg,CP_EMO[F.ev.k],env);}}
  tg.lu+=T.lid;
  /* взгляд: короткие скачки около цели, иногда — в сторону (вспоминает, прикидывает) и обратно */
  if(t>=F.ns){const r=F.r,aw=r()<.14*T.sac;
    F.away=aw?t+500+r()*700:0;
    F.sac=aw?[(r()<.5?-1:1)*(.18+r()*.14),(r()-.6)*.14]:[(r()-.5)*.08,(r()-.5)*.05];
    F.ns=t+(aw?1300:(500+r()*1900)/T.sac);}
  if(F.away&&t>F.away){F.sac=[0,0];F.away=0;}
  const bg=base||[0,0];
  tg.gz=[bg[0]+tg.gz[0]+F.sac[0],bg[1]+tg.gz[1]+F.sac[1]];
  /* моргание: 70 мс вниз, 40 держит, 120 вверх; бывает двойное; взгляд в сторону часто начинается с моргания */
  if(t>=F.nb){F.bp=t;const r=F.r;F.b2=r()<.15?1:0;F.nb=t+(600+r()*2*1000/Math.max(.05,T.bk))*(F.ev&&F.ev.k==="surprised"?2:1);}
  const bt=t-F.bp,b1=bt<70?bt/70:bt<110?1:bt<230?1-(bt-110)/120:0;
  const bt2=bt-260,b2=F.b2&&bt2>0?(bt2<70?bt2/70:bt2<110?1:bt2<230?1-(bt2-110)/120:0):0;
  /* к цели — с запаздыванием: лицо 7/с, глаза 18/с (скачок), моргание — сразу */
  if(!F.X)F.X=cpEmoMix(tg,tg,0);
  const kf=1-Math.exp(-7*dt),kg=1-Math.exp(-18*dt),X=F.X;
  for(const k of ["lu","ll","sm","sk","mo"])X[k]+=(tg[k]-X[k])*kf;
  for(let i=0;i<2;i++){X.br[i]+=(tg.br[i]-X.br[i])*kf;X.bi[i]+=(tg.bi[i]-X.bi[i])*kf;X.gz[i]+=(tg.gz[i]-X.gz[i])*kg;}
  /* лёгкая жизнь рта и бровей: дыхание чуть приоткрывает губы, брови вздрагивают при взгляде в сторону */
  const br=Math.sin(t*.00157+(m.seed&255));   /* вдох раз в 4 с */
  return {lu:X.lu,ll:X.ll,sm:X.sm,sk:X.sk,mo:Math.max(0,X.mo+.03+.025*br),br:X.br.map(v=>v+(F.away?.18:0)),bi:X.bi,gz:X.gz,bl:Math.max(b1,b2),k:F.ev?F.ev.k:md.k};
}
