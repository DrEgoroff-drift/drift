/* ══════════════ подвижная пятёрка как места действия (M627b, проход 4) ══════════════
   Друза, кольцо ускорителя, аномалия, завод, батарея (пушка Долгого марша) — записи той же таблицы
   PLN_ACT.kinds (21pif). Здесь развилка чаще не в пространстве, а в риске: друзу можно сыграть или
   выломать, кольцо — остановить или разогнать до предела (кости решают, бросит ли оно слиток или
   разорвётся), аномалию — кормить или осушить, завод — держать на ходу или переналадить на часть,
   пушку — выстрелить один раз (ракета над равниной или разорванный ствол). Тела — 21piec. */

/* ── друза: порядок трёх ключей — по семени, одна из шести перестановок ── */
const PLN_DRUSE_ORD=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
function plnDruseOrder(seed){return PLN_DRUSE_ORD[hashi(seed>>>0,0xD5,1)%6];}
/* три ноты — три звука игры: у пищалки нет высоты, а у трёх разных голосов есть свой характер */
const PLN_DRUSE_SFX=["pen","ui","ok"];
function plnDruseKey(i){
  return {id:"k"+i,ru:"ключ",dx:()=>(i-1)*3,r:1.5,verb:"УДАРИТЬ",tool:false,
    when:m=>m.st<2,
    act:c=>{
      const m=c.m,ord=plnDruseOrder(c.q.seed),p=m.n.p|0;
      m.st=Math.max(m.st,1);m.n.hit=i;
      if(ord[p]!==i){m.n.p=0;m.n.bad=(m.n.bad|0)+1;return {short:"призма тускнеет · не тот звук",sfx:"hit"};}
      m.n.p=p+1;
      if(m.n.p<3)return {short:"призма звенит · "+["первая","вторая"][p]+" нота",sfx:PLN_DRUSE_SFX[i]};
      /* резонанс: вся друза поёт, большая призма расходится надвое */
      const r=plnActRoll(c.q.seed,0xC75,1),n=addRes("crystal",8+Math.floor(r()*8+c.d*6));
      if(typeof rareTake==="function")rareTake("poi",c.q.seed,"здесь: друза");
      m.st=2;m.way="ring";m.n.p=0;
      return {short:"резонанс · друза поёт · кристаллы ×"+n,sfx:"motif"};}};
}
PLN_ACT.kinds.crystals={ru:"ДРУЗА",
  dims:H=>({H,W:H*1.9}),
  got:m=>m.st===2?"друза поёт · растёт":m.st===3?"друза разбита":"звенит, если тронуть",
  spots:[plnDruseKey(0),plnDruseKey(1),plnDruseKey(2),
    {id:"mine",ru:"край друзы",dx:()=>6,r:2,hold:3,verb:"ДОБЫВАТЬ",sfx:"crackle",when:m=>m.st<2,
      act:c=>{if(!plnActRoom())return plnActFull();
        const r=plnActRoll(c.q.seed,0xC76,1),n=addRes("crystal",4+Math.floor(r()*7+c.d*5));
        c.m.st=3;c.m.way="mine";
        return {short:"кристаллы ×"+n+" · друза разбита, ключи молчат"};}},
    {id:"rung",ru:"край друзы",dx:()=>6,r:2,when:m=>m.st===2,verb:null,note:"кристалл звенит и не колется"},
    {id:"grow",ru:"подножие",dx:()=>0,r:3,when:m=>m.st===2,verb:m=>plnActDailyReady(m)?"СНЯТЬ КРИСТАЛЛ":null,
      note:"новый кристалл ещё растёт · завтра",sfx:"pen",
      act:c=>{if(!plnActDaily(c.m))return {keep:true,short:"кристалл ещё растёт"};
        const n=addRes("crystal",2);return {short:n?"кристалл дня · ×"+n:"трюм полон"};}}],
  drive:(m,age,D,t,nk,q)=>{
    const E=plnActEase,P={},st=m.st|0,last=m.n.last;
    const ring=m.way==="ring",mine=m.way==="mine";
    /* ключ, по которому ударили: вспышка .6 с; верный порядок держит набранные ключи слабым светом */
    const hitK=i=>last==="k"+i&&age<.6?1-age/.6:0;
    /* ночью свет налобника на подножии выдаёт порядок: раз в 12 с ключи вспыхивают по очереди */
    const o=q?plnDruseOrder(q.seed):null;
    const cyc=(t%12),show=st<2&&nk>.3?1:0;
    for(let i=0;i<3;i++){
      const pos=o?o.indexOf(i):i,cue=show&&cyc>pos*.8&&cyc<pos*.8+.5?1:0;
      const held=!ring&&!mine&&(m.n.p|0)>0&&o&&o.indexOf(i)<(m.n.p|0)?.45:0;
      const dull=last==="k"+i&&m.n.p===0&&m.n.bad&&age<1.5?1:0;
      const k=mine?0:ring?.6+.25*Math.sin(t*1.3+i*2.1):Math.max(2*hitK(i),1.4*cue,held)*(dull?0:1);
      P["k"+i+"L"]={k,hide:k<.01};
      P["k"+i]={k:dull?.55:1,hk:mine?.25:1,y:mine?-.15:0};
    }
    /* большая призма расходится надвое за 2 с после резонанса */
    const sp=ring?(last==="k0"||last==="k1"||last==="k2"?E((age-.4)/2):1):0;
    P.topL={roll:.22*sp,x:-.35*sp*D.H*.08};P.topR={roll:-.22*sp,x:.35*sp*D.H*.08};
    /* добыча: пять призм подножия ломаются по одной, полсекунды на каждую */
    for(let i=1;i<=5;i++){const e=mine?(last==="mine"?E((age-(i-1)*.45)/.4):1):0;
      P["p"+i]={hk:1-.85*e,roll:.5*e*(i%2?1:-1),y:-.1*e,k:1-.5*e};}
    const res=ring&&(last==="k0"||last==="k1"||last==="k2")&&age<6?1-age/6:0;
    const gr=last==="grow"&&age<3?1-age/3:0;
    /* после удара друза гудит 3 с; не та нота глушит её на полторы */
    const struck=!ring&&!mine&&/^k\d$/.test(last||"")&&age<3?1-age/3:0,bad=struck&&m.n.p===0&&age<1.5?.4:1;
    const light=mine?0:ring?.8+1.6*res+.8*gr:(.15+.25*nk+.6*struck)*bad*Math.max(.5,1-.1*(m.n.bad|0));
    const lamps=[];
    if(res>0||gr>0)lamps.push({id:"foot",r:7,c:[.9,.7,1],k:2.2*Math.max(res,gr)});
    else if(o&&show&&cyc<2.5)lamps.push({id:"foot",r:3.5,c:[.9,.75,1],k:.8});
    /* друза светит сама: ночью тускло, спетая — всегда; выломанная — нет */
    else if(!mine&&(ring||nk>.15))lamps.push({id:"foot",r:ring?7:5,c:[.75,.6,1],k:ring?.5+.6*nk:.45*nk});
    return {light,lampK:mine?0:ring?1.5:1,parts:P,lamps};
  }};

/* ══════════════ кольцо ускорителя (§4.5) ══════════════
   Вентиль у линии запускает кольцо: пульс полосы учащается, узлы бегут огнём. У вентиля развилка:
   остановить (иридий из тёплого узла, потом прокрутка раз в день) или разогнать до предела —
   кости: слиток слетает с кольца по касательной и ложится залежью в двенадцати метрах, или кольцо
   разрывает (три узла падают, скафандр −15, узел «в аномалии») */
function plnRingDep(q){return q.x+12*PLN_M;}
PLN_ACT.kinds.ring={ru:"КОЛЬЦО УСКОРИТЕЛЯ",
  dims:H=>({H,R:H*.5}),
  got:m=>m.st===0?"кольцо стоит":m.st===1?"кольцо на ходу":m.way==="stop"?"кольцо кормит · иридий":m.way==="throw"?"кольцо выбросило слиток":"кольцо разорвано",
  spots:[
    {id:"valve",ru:"вентиль",dx:()=>-6,r:2.2,hold:3,tool:false,verb:"ЗАПУСТИТЬ КОЛЬЦО",sfx:"alarm",hum:"creak",when:m=>m.st===0,
      act:c=>{c.m.st=1;return {short:"кольцо на ходу · узлы бегут огнём"};}},
    {id:"stop",ru:"тормоз",dx:()=>-7.6,r:1.3,verb:"ОСТАНОВИТЬ",fork:"limit",sfx:"creak",when:m=>m.st===1,
      act:c=>{const r=plnActRoll(c.q.seed,0x1B1,1),n=addRes("iridium",2+Math.floor(r()*4));
        c.m.st=2;c.m.way="stop";c.m.day=celDay();
        return {short:"кольцо встало · тёплый узел: иридий ×"+n};}},
    {id:"limit",ru:"рычаг разгона",dx:()=>-4.4,r:1.3,hold:4,tool:false,verb:"РАЗОГНАТЬ ДО ПРЕДЕЛА",fork:"limit",hum:"alarm",when:m=>m.st===1,
      act:c=>{
        const r=plnActRoll(c.q.seed,0x1B2,1),m=c.m;
        if(r()<.65-.3*c.d){
          const left=12+Math.floor(r()*8);
          m.dep={x:Math.round(plnRingDep(c.q)),left};m.st=2;m.way="throw";
          plnRingDepPut(c.q,m,G.surf);
          return {short:"кольцо выбросило слиток · иридий лёг залежью справа",sfx:"boom"};}
        const S=G.surf;if(S&&S.suit!=null)S.suit=Math.max(1,S.suit-15);
        nodeDrop("в аномалии",.4+c.d*.6,hashi(c.q.seed,0x1B3,1));
        m.st=3;m.way="broke";
        return {short:"кольцо разорвано · скафандр −15",sfx:"boom"};}},
    {id:"day",ru:"вентиль",dx:()=>-6,r:2.2,when:m=>m.st===2&&m.way==="stop",verb:m=>plnActDailyReady(m)?"ПРОКРУТИТЬ КОЛЬЦО":null,
      note:"кольцо остыло · завтра снова",sfx:"creak",
      act:c=>{if(!plnActDaily(c.m))return {keep:true,short:"кольцо остыло"};
        const n=addRes("iridium",2);return {short:n?"прокрутка · иридий ×"+n:"трюм полон"};}}],
  /* слиток — залежь игры: каждая посадка кладёт её снова, остаток — из памяти; пока человек здесь,
     память читает, сколько осталось (бур берёт её как любую залежь) */
  tick:(q,m,S)=>{if(m.way==="throw"&&m.dep&&S)plnRingDepPut(q,m,S);},
  drive:(m,age,D,t,nk)=>{
    const E=plnActEase,P={},st=m.st|0,last=m.n.last;
    /* частота полосы: стоит .6 Гц, на ходу — до 3 Гц за 6 с; на пределе — выше и ярче */
    const run=st===1?(last==="valve"?E(age/6):1):0;
    const spin=last==="day"&&age<6?1-age/6:0,stop=last==="stop"&&age<4?1-E(age/4):0;
    const hz=.6+2.4*Math.max(run,spin,stop);
    const ph=t*hz*TAU,pul=.6+.4*Math.pow(.5+.5*Math.sin(ph),3);
    const dead=st===3,thrown=m.way==="throw";
    /* узлы: бегущий огонь по кругу, пока кольцо на ходу */
    for(let k=0;k<8;k++){const u=((t*hz*.5-k/8)%1+1)%1,on=Math.max(run,spin,stop);
      const v=dead?0:on>0?on*(1.6*Math.pow(1-u,4))+.12:thrown?.25:0;
      P["n"+k]={k:v,hide:v<.01};}
    /* разрыв: три узла падают с кольца */
    const br=dead?(last==="limit"?E(age/1.1):1):0;
    for(let i=0;i<3;i++)P["f"+i]={go:br,roll:1.4*br*(i-1)};
    /* слиток: 1.2 с по дуге к залежи, дальше лежит, пока его не выбрали */
    const sl=thrown?(last==="limit"?clamp(age/1.2,0,1):1):0;
    P.slug={go:sl,y:D.H*.35*Math.sin(Math.PI*sl),k:1.4,hide:!thrown||(last!=="limit"||age>6)};
    const h=PLN_ACT.hold,w=h&&(h.id==="valve"||h.id==="limit");
    P.wheel={roll:w?t*3:run>0&&last==="valve"?(1-run)*2:0};
    P.lever={roll:m.way==="stop"||last==="stop"?-.9:h&&h.id==="limit"?.9*h.k:dead||thrown?.9:0};
    const light=dead?(last==="limit"&&age<.8?2*(1-age/.8):0):pul*(st===1?1:.3+.7*Math.max(spin,stop))*(1+.8*Math.max(run,spin))+(h&&h.id==="limit"?1.2*h.k:0)+(h&&h.id==="valve"?.7*h.k:0);
    const lamps=[];
    if(br>0&&age<1.5)lamps.push({id:"core",r:D.R*1.6,c:[1,.7,.4],k:3*(1-age/1.5)});
    else if(run>0)lamps.push({id:"core",r:D.R*1.4,k:.8*run});
    /* разорванное: у вентиля мигает аварийный красный, пока кольцо не забудут */
    else if(dead)lamps.push({id:"valve",r:5,c:[1,.32,.18],k:Math.sin(t*3.6)>0?1.1:.25});
    return {light,lampK:dead?0:1+run,parts:P,lamps};
  }};
function plnRingDepPut(q,m,S){
  if(!S||!S.deposits||!m.dep)return;
  let d=S.deposits.find(z=>z.ring===q.seed);
  if(!d){if(!(m.dep.left>0))return;
    d={x:m.dep.x,y:(S.tr?groundAt(S.tr,m.dep.x):0)-6,res:"iridium",left:m.dep.left,prog:0,i:null,ring:q.seed};
    S.deposits.push(d);}
  else m.dep.left=d.left|0;
}

/* ══════════════ аномалия (§4.6) ══════════════
   Колышек замерщика у линии. Чем ближе человек — тем быстрее кружат осколки. Замер — данные; дальше
   кормить: одна единица груза летит в шар, а из шара падает другая по своей таблице (три входа —
   три выхода; чужое шар просто ест); двенадцать обменов — и она сыта. Или взять осколок с ранца —
   аномалия схлопывается, кормить больше нечего */
function plnAnomTable(seed){
  const r=rng(hashi(seed>>>0,0xA7,1)),K=TRADE_KEYS.slice(),T={};
  for(let i=K.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[K[i],K[j]]=[K[j],K[i]];}
  for(let i=0;i<3&&i+3<K.length;i++)T[K[i]]=K[i+3];
  return T;
}
/* что бросить: всё, что лежит в трюме, по четыре секунды каждое */
function plnAnomFeed(){
  const ks=Object.keys(G.cargo||{}).filter(k=>RES[k]&&(G.cargo[k]|0)>=1).sort();
  return ks.length?ks[Math.floor((G.t||0)/240)%ks.length]:null;
}
const PLN_ANOM_GL="▓▒░";
PLN_ACT.kinds.anomaly={ru:"АНОМАЛИЯ",
  dims:H=>({H,yc:H*.62,Rv:H*.21}),
  got:m=>m.st===0?"приборы врут":m.st===1?"меняет одно на другое":m.st===2?"насытилась":"схлопнулась",
  /* пока аномалия жива, приборы у неё врут: вторая строка — шум */
  line2:m=>{if(m.st>=2)return null;let s="",h=Math.floor((G.t||0)/9);
    for(let i=0;i<4;i++)s+=PLN_ANOM_GL[hashi(h,i,0xA1)%3];return "ПРИБОРЫ: "+s+" М";},
  spots:[
    {id:"gauge",ru:"колышек",dx:()=>0,r:3,verb:"ЗАМЕРИТЬ",sfx:"crackle",when:m=>m.st===0,
      act:c=>{G.data+=14;c.m.st=1;return {short:"замер · +14 данных"};}},
    {id:"feed",ru:"колышек",dx:()=>0,r:3,sfx:"crackle",when:m=>m.st===1,
      verb:()=>{const k=plnAnomFeed();return k?"БРОСИТЬ: "+RES[k].ru.toUpperCase():null;},
      note:"бросить нечего · трюм пуст",
      act:c=>{const k=plnAnomFeed();if(!k)return {keep:true,short:"бросить нечего"};
        const m=c.m,T=plnAnomTable(c.q.seed),out=T[k];
        G.cargo[k]-=1;m.n.inK=k;
        if(!out){m.n.outK=null;return {short:"аномалия проглотила: "+RES[k].ru.toLowerCase()};}
        G.cargo[out]=(G.cargo[out]|0)+1;m.n.outK=out;m.n.fed=(m.n.fed|0)+1;
        if(m.n.fed>=12){m.st=2;m.way="fed";nodeDrop("в аномалии",.5+c.d*.5,hashi(c.q.seed,0xA8,1));
          return {short:RES[k].ru.toLowerCase()+" → "+RES[out].ru.toLowerCase()+" · аномалия насытилась и уснула"};}
        return {short:RES[k].ru.toLowerCase()+" → "+RES[out].ru.toLowerCase()+" · обменов: "+m.n.fed+" из 12"};}},
    {id:"shard",ru:"осколок",dx:()=>0,r:5,air:3,verb:"ВЗЯТЬ ОСКОЛОК",sfx:"boom",when:m=>m.st<2,
      act:c=>{if(!plnActRoom())return plnActFull();
        const n=addRes("xeno",4);G.data+=20;c.m.st=3;c.m.way="drain";
        return {short:"осколок пойман · ксенобиом ×"+n+" · +20 данных · аномалия схлопнулась"};}}],
  drive:(m,age,D,t,nk,q)=>{
    const E=plnActEase,P={},st=m.st|0,last=m.n.last;
    const dr=m.way==="drain",fed=m.way==="fed";
    /* человек рядом — осколки кружат быстрее: до втрое в шаге, за 30 м — как всегда */
    const S=G.surf,dm=S&&q?Math.abs(S.x-q.x)/PLN_M:99,near=1+2*clamp(1-dm/30,0,1);
    const sp=dr?0:fed?.25:near;
    const ph=plnActPhase(q?q.seed:0,t,.11*sp);
    const col=last==="shard"?E(age/3):dr?1:0;
    P.core={s:Math.max(.02,1-col),hide:col>=.999};
    /* бросок: единица летит в шар 1 с по дуге; шар вспыхивает; другая падает к колышку */
    const fy=last==="feed"&&age<3;
    const inC=m.n.inK&&RES[m.n.inK]?plnHex(RES[m.n.inK].col):[1,1,1],outC=m.n.outK&&RES[m.n.outK]?plnHex(RES[m.n.outK].col):[1,1,1];
    const bi=fy?clamp(age,0,1):1;
    P.bit={go:bi,y:D.H*.18*Math.sin(Math.PI*bi),c:inC,hide:!fy||bi>=1};
    const ou=fy&&m.n.outK?clamp((age-1.2)/1.1,0,1):0;
    P.out={go:ou*ou,c:outC,hide:!fy||!m.n.outK||age<1.2};
    const eat=fy&&age>.9&&age<1.5?1-Math.abs(age-1.2)/.3:0;
    /* замер: кольцо отвечает на прибор волной света за 2 с */
    const gz=last==="gauge"&&age<2?Math.sin(Math.PI*age/2):0;
    const light=dr?(col<1?1-col:0):fed?.35:(.72+.28*Math.sin(t*.9))*(1+.5*(near-1))+2*eat+1.2*gz;
    const lamps=eat>0?[{id:"core",r:D.H*.6,k:2.5*eat}]:[];
    return {light,lampK:dr?1-col:fed?.4:1,parts:P,lamps,move:{y:dr?-(D.yc+D.H*.22)*col:0,yaw:ph}};
  }};
/* фаза вращения с переменной скоростью: копится по часам кадра, чтобы ускорение не дёргало круг */
const PLN_ACT_PH={};
function plnActPhase(seed,t,w){
  const o=PLN_ACT_PH[seed]||(PLN_ACT_PH[seed]={t,a:(seed%97)*.1});
  const dt=t-o.t;o.t=t;
  if(dt>0&&dt<1)o.a+=dt*w;
  return o.a;
}

/* ══════════════ завод (§4.8) ══════════════
   Щит у линии запитывают от скафандра (−30): окна загораются волнами, труба дымит, ворота поднимаются,
   линия гудит. Ящик скатывается по рампе к линии — техкомпоненты; дальше ящик раз в день. Или у щита
   переналадить линию на часть корабля (восемь техкомпонентов) — линия выработана навсегда */
PLN_ACT.kinds.factory={ru:"ЗАВОД",
  dims:H=>({H,W:H*2.3}),
  got:m=>m.st===0?"обесточен":m.st===1?"линия на ходу":m.st===2?"работает · ящик в день":"выработан на часть",
  spots:[
    {id:"power",ru:"щит",dx:D=>-D.W*.3,r:2.4,hold:3,tool:false,hum:"crackle",sfx:"alarm",when:m=>m.st===0,
      verb:()=>{const S=G.surf;return S&&S.suit!=null&&S.suit<40?null:"ЗАПИТАТЬ ОТ СКАФАНДРА";},
      note:"скафандр слаб · нужно 40",
      act:c=>{const S=G.surf;if(S&&S.suit!=null){if(S.suit<40)return {keep:true,short:"скафандр слаб"};S.suit=Math.max(1,S.suit-30);}
        c.m.st=1;return {short:"линия на ходу · скафандр −30"};}},
    {id:"crate",ru:"рампа",dx:D=>D.W*.1,r:2.6,verb:"ЗАБРАТЬ ЯЩИК",sfx:"ok",when:m=>m.st===1,
      act:c=>{if(!plnActRoom())return plnActFull();
        const r=plnActRoll(c.q.seed,0xFAC,1),n=addRes("techcomp",3+Math.floor(r()*6+c.d*4));
        c.m.st=2;c.m.way="run";c.m.day=celDay();
        return {short:"ящик с линии · техкомпоненты ×"+n};}},
    {id:"day",ru:"рампа",dx:D=>D.W*.1,r:2.6,when:m=>m.st===2,verb:m=>plnActDailyReady(m)?"ЯЩИК ДНЯ":null,
      note:"ящик дня взят · завтра снова",sfx:"ok",
      act:c=>{if(!plnActDaily(c.m))return {keep:true,short:"ящик дня взят"};
        const n=addRes("techcomp",2);return {short:n?"ящик дня · техкомпоненты ×"+n:"трюм полон"};}},
    {id:"retool",ru:"щит",dx:D=>-D.W*.3,r:2.4,hold:4,hum:"alarm",sfx:"boom",when:m=>m.st===1||m.st===2,
      verb:()=>(G.cargo.techcomp|0)>=8?"ПЕРЕНАЛАДИТЬ: ЧАСТЬ":null,
      note:"переналадить на часть · нужно техкомпонентов: 8",
      act:c=>{if((G.cargo.techcomp|0)<8)return {keep:true,short:"нужно техкомпонентов: 8"};
        G.cargo.techcomp-=8;
        const P=addPart(genPart(hashi(c.q.seed,9,0x1E),tierFromDanger(c.d,plnActRoll(c.q.seed,0x1E,2))));
        c.m.st=3;c.m.way="part";
        return {short:"линия выработана · часть"+(P&&P.name?": "+P.name:"")};}}],
  drive:(m,age,D,t,nk)=>{
    const E=plnActEase,P={},st=m.st|0,last=m.n.last;
    const run=st===1||st===2,part=m.way==="part";
    const up=last==="power"?E(age/4):run?1:0;
    /* переналадка: зал красный на время работы, после — гаснет */
    const red=part?(last==="retool"?clamp(1-(age-3)/2,0,1):0):0,h=PLN_ACT.hold,ret=h&&h.id==="retool"?h.k:0;
    P.red={k:2*Math.max(red,ret),hide:Math.max(red,ret)<.01};
    P.gate={y:D.H*.14*(run?up:part?1:0)};
    P.lever={roll:run||part?-1:h&&h.id==="power"?-h.k:0};
    P.blamp={k:run?1.6:part?0:.05+.05*Math.sin(t*3),hide:part};
    P.belt={k:run?.9+.4*Math.sin(t*2):0,hide:!run};
    /* ящик: 3 с по рампе от ворот до линии; потом лежит, пока его не взяли — снимается взятием */
    const rolling=(last==="crate"||last==="day"||last==="retool")&&age<6;
    const cg=rolling?E(age/3):0;
    P.crate={go:cg,s:last==="day"?.8:1,hide:!(rolling||(st===1)),roll:-.3*(rolling?Math.sin(age*7)*(1-cg):0)};
    /* дым из трубы: три клуба по кругу, пока линия на ходу */
    for(let i=0;i<3;i++){const u=((t/7)+i/3)%1;P["s"+i]={go:u,s:.6+1.4*u,hide:!run||up<.5,k:.9-.4*u};}
    const light=part?0:run?1.6*up:0;
    const lamps=[];
    if(run||ret>0)lamps.push({id:"board",r:4,c:ret>0?[1,.2,.1]:[.5,1,.6],k:.9});
    if(rolling&&cg<1)lamps.push({id:"gate",r:9,c:[1,.66,.35],k:1.6});
    return {light,lampK:part?0:run?1.6:0,parts:P,lamps};
  }};

/* ══════════════ батарея — пушка Долгого марша (§4.12) ══════════════
   Ствол задран в небо и разорван у среза. Затвор у линии: в нём последняя гильза с кусками отчёта.
   Маховик наводки разворачивает башню вдоль ленты и опускает ствол. Выстрел один: кости — ракета
   зависает над равниной (звери бегут, ночь светла 25 с) или разорванный срез отпускает ствол */
function plnGunLaid(m){return m.st>=2;}
PLN_ACT.kinds.battery={ru:"БАТАРЕЯ",
  dims:H=>({H,u:H/7}),
  got:m=>m.st===0?"ствол разорван у среза":m.st===1?"затвор открыт":m.st===2?"наведена":m.way==="shot"?"выстрел был · ракета над равниной":"ствол разорвало",
  spots:[
    {id:"breech",ru:"затвор",dx:()=>-1.5,r:2.2,hold:2,tool:false,hum:"creak",verb:"ОТКРЫТЬ ЗАТВОР",sfx:"creak",when:m=>m.st===0,
      act:c=>{c.m.st=1;
        const L=typeof loreTake==="function"?loreTake((c.q.seed^0xBA77)>>>0):null;
        if(L){c.m.n.lore=1;return {short:"в затворе гильза · кусок отчёта · "+L.chapRu};}
        const n=addRes("alloy",3+Math.floor(plnActRoll(c.q.seed,0xBA7,1)()*4));
        return {short:"в затворе гильза · сплавы ×"+n};}},
    {id:"lay",ru:"маховик",dx:()=>3,r:2.2,hold:3,tool:false,hum:"creak",verb:"ПРОВЕРНУТЬ БАШНЮ",sfx:"creak",when:m=>m.st===1,
      act:c=>{c.m.st=2;return {short:"башня развёрнута вдоль ленты · ствол опущен"};}},
    {id:"fire",ru:"спуск",dx:()=>3,r:2.2,hold:4,tool:false,hum:"alarm",verb:"ВЫСТРЕЛИТЬ",sfx:"boom",when:m=>m.st===2,
      act:c=>{const r=plnActRoll(c.q.seed,0x5407,1),m=c.m,S=G.surf;
        if(r()<.6-.3*c.d){
          G.data+=20;
          if(typeof holdDeed==="function")holdDeed(G.sx,G.sy,"shot");
          /* зверьё в 120 м разворачивается и бежит от пушки */
          if(S)for(const b of S.fauna||[])if(Math.abs(b.x-c.q.x)<120*PLN_M){b.shy=1;b.vx=(b.x>=c.q.x?1:-1)*.16;b.face=b.vx>0?1:-1;}
          m.st=3;m.way="shot";
          return {short:"выстрел · ракета над равниной · запись отдачи +20 данных"};}
        if(S&&S.suit!=null)S.suit=Math.max(1,S.suit-20);
        nodeDrop("в аномалии",.4+c.d*.6,hashi(c.q.seed,0x5408,1));
        m.st=3;m.way="burst";
        return {short:"срез не выдержал · ствол сорвало · скафандр −20"};}},
    {id:"empty",ru:"спуск",dx:()=>3,r:2.2,when:m=>m.st===3,verb:null,note:"ствол пуст"}],
  drive:(m,age,D,t,nk)=>{
    const E=plnActEase,P={},st=m.st|0,last=m.n.last,u=D.u,G0=PLN_GUN;
    const yaw=PLN_MARK.kinds.battery.yaw,cy=Math.cos(yaw),sy=Math.sin(yaw);
    /* мир → местное: сдвиг вдоль ленты X и вверх Y */
    const along=(X,Y)=>({x:X*cy,y:Y,z:X*sy});
    const lay=st>=2?(last==="lay"?E(age/6):1):0,h=PLN_ACT.hold;
    const ty=G0.yaw(yaw)*lay,el=lerp(G0.up,G0.down,lay);
    const shot=m.way==="shot",burst=m.way==="burst";
    P.turret={yaw:ty};
    /* затвор: отъезжает назад вдоль ствола за 1.2 с */
    const bo=st>=1?(last==="breech"?E(age/1.2):1):0;
    const ax=G0.axis(el,ty-Math.PI/2);
    /* отдача: ствол уходит на полтора метра назад и возвращается за 1.2 с */
    const rc=shot&&last==="fire"&&age<1.2?Math.sin(Math.PI*Math.min(1,age/1.2))*(age<.1?age/.1:1):0;
    /* разрыв: ствол сорвало — он клонится и падает за 1.4 с */
    const fall=burst?(last==="fire"?E(age/1.4):1):0;
    P.barrel={yaw:ty,roll:el-fall*(el+.18),x:-ax[0]*1.5*u*rc+fall*ax[0]*2*u,y:-ax[1]*1.5*u*rc-fall*G0.ty*u*.72,z:-ax[2]*1.5*u*rc+fall*ax[2]*2*u};
    P.breech={yaw:ty,roll:el-fall*(el+.18),x:P.barrel.x-ax[0]*.9*u*bo,y:P.barrel.y-ax[1]*.9*u*bo,z:P.barrel.z-ax[2]*.9*u*bo};
    P.hwheel={roll:h&&h.id==="lay"?t*4:last==="lay"&&age<6?(1-age/6)*3:0};
    /* снаряд: 2 с вдоль ленты и вверх; ракета висит 25 с, медленно опускаясь */
    const fly=shot&&last==="fire"?clamp(age/2,0,1):1,hang=shot?(last==="fire"?clamp((age-2)/25,0,1):1):1;
    const mz=G0.muzzle(u,el,ty-Math.PI/2);
    const sx=60*fly,sh=along(sx,26*Math.sin(Math.PI*.5*fly));
    P.shell={x:sh.x,y:sh.y,z:sh.z,k:3,hide:!(shot&&last==="fire"&&age<2)};
    const fl=along(60,26-14*hang);
    const flareOn=shot&&last==="fire"&&age>=2&&age<27;
    P.flare={x:fl.x,y:fl.y,z:fl.z,k:4,s:1+.3*Math.sin(t*9),hide:!flareOn};
    for(let i=0;i<3;i++){const uu=((t/5)+i/3)%1;P["s"+i]={go:uu,s:.6+1.5*uu,k:.8-.4*uu,hide:!(burst&&(last!=="fire"||age<20))};}
    const lamps=[];
    if(flareOn)lamps.push({id:"flare",p:[G0.piv[0]+mz[0]+fl.x,G0.ty*u+mz[1]+fl.y,G0.piv[2]+mz[2]+fl.z],r:70,c:[1,.95,.85],k:4*Math.min(1,(age-2)/.3)*(1-.6*hang)});
    else if(burst&&last==="fire"&&age<1)lamps.push({id:"breechL",r:8,c:[1,.6,.3],k:3*(1-age)});
    /* вспышка выстрела: ключ белеет на два кадра, как от молнии */
    const flash=shot&&last==="fire"&&age<.05?1:burst&&last==="fire"&&age<.05?.6:0;
    return {light:st===3?0:nk,lampK:1,parts:P,lamps,flash};
  }};
/* мерки пушки в долях u = H/7: высота цапфы, подъём ствола в покое и на наводке, поворот башни на
   ленту; ось и срез ствола в местных метрах — одна правда для тела (21piec) и привода */
const PLN_GUN={ty:2.9,up:1.05,down:.35,len:8,brl:2.2,piv:[0,0,0],
  yaw:by=>Math.PI/2-by,
  axis:(el,ps)=>{const c=Math.cos(el),s=Math.sin(el);return [c*Math.cos(ps),s,-c*Math.sin(ps)];},
  muzzle:(u,el,ps)=>{const a=PLN_GUN.axis(el,ps);return [a[0]*PLN_GUN.len*u,a[1]*PLN_GUN.len*u,a[2]*PLN_GUN.len*u];}};
