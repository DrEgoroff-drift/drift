/* ══════════════ тихая пятёрка как места действия (M627b, проход 2) ══════════════
   Храм, монолит, зарубка, врата, обсерватория — записи той же таблицы PLN_ACT.kinds (21pif): мерки,
   места, переходы, got, привод тела. Движок не трогается. Правила (DESIGN-marks §2): одна развилка
   на памятник — взять наверняка (памятник гаснет навсегда) или разбудить (свет остаётся, и есть
   маленький подарок дня через plnActDaily); кредитов — никогда; каждый акт виден в теле — движется
   часть или меняется свет. Тела и места под рукой — 21pieb. */

/* ── слова монолита: два из тех, что несут куски отчёта (LORE[].word) — иначе слово не выучить и
   монолит не открыть никогда; по семени; знакомые — словом, незнакомые — глифами посёлка ── */
function plnMonoWords(seed){
  const pool=[];for(const R of LORE)if(R.word&&pool.indexOf(R.word)<0)pool.push(R.word);
  const n=pool.length,a=hashi(seed>>>0,0x1F,1)%n;let b=hashi(seed>>>0,0x1F,2)%n;if(b===a)b=(a+1)%n;
  return [pool[a],pool[b]];
}
function plnMonoKnown(W){const v=loreVocab();return (W||[]).filter(w=>v.indexOf(w)>=0);}
function plnActGlyphs(word){let h=7;for(let i=0;i<word.length;i++)h=(Math.imul(h,131)+word.charCodeAt(i))>>>0;
  const r=rng(h),n=2+Math.floor(r()*3);let g="";for(let i=0;i<n;i++)g+=SETTLE_GLYPH[Math.floor(r()*SETTLE_GLYPH.length)];return g;}
function plnMonoLine(m){const v=loreVocab();return (m.n.w||[]).map(w=>v.indexOf(w)>=0?w:plnActGlyphs(w)).join(" ");}
/* засечка зарубки: строка глифов со знакомыми словами вперемешку, по семени памятника */
function plnActNotchLine(seed){
  const r=rng(hashi(seed>>>0,0x7A,9)),v=loreVocab(),out=[];
  for(let i=0;i<4;i++){if(v.length&&r()<Math.min(.75,v.length/12))out.push(v[Math.floor(r()*v.length)]);
    else out.push(plnActGlyphs(String(hashi(seed>>>0,i,0x33))));}
  return out.join(" ");
}
/* дар храму: что из трюма показано сейчас — грузы по три и больше, по четыре секунды каждый */
function plnTempleGift(){
  /* ксенобиом храм возвращает сам — класть его на алтарь значит менять три на четыре */
  const ks=Object.keys(G.cargo||{}).filter(k=>RES[k]&&k!=="xeno"&&(G.cargo[k]|0)>=3).sort();
  return ks.length?ks[Math.floor((G.t||0)/240)%ks.length]:null;
}
/* координаты храма — закон 20b: звезда в пяти секторах */
function plnActHint(seed){
  const r=plnActRoll(seed,0x7EB,1);
  for(let i=0;i<40;i++){const sx=G.sx+Math.round((r()*2-1)*5),sy=G.sy+Math.round((r()*2-1)*5);
    if(starAt(sx,sy)){G.relicHint={sx,sy};return "координаты: сектор "+sx+":"+sy;}}
  return null;
}
/* артефакт по броску, иначе запасное; вернуть строку того, что взято */
function plnActRelic(seed,salt,chance,why,fall){
  const id=relicRoll(hashi(seed>>>0,0x7E,salt),chance);
  if(id&&relicFind(id,why))return "артефакт «"+ARTIFACTS[id].ru+"»";
  return fall();
}
function plnActRoom(){return held()<stat().cargoMax;}
const plnActFull=()=>({keep:true,short:"трюм полон",full:"Трюм полон\nвзять некуда"});
/* топливо: доля бака, не больше, чем влезет */
function plnActFuel(f){const fm=stat().fuelMax,n=Math.max(0,Math.min(Math.round(fm*f),Math.round(fm-G.fuel)));G.fuel+=n;return n;}

/* ══════════════ храм (§4.2) ══════════════
   Алтарь у линии: прочесть плиты (координаты, как 20b), потом развилка у того же алтаря — дар
   (три единицы груза: артефакт или редкость и ксенобиом; храм принимает и становится убежищем —
   скафандр полнится, пока стоишь у алтаря) или образец (ксенобиом сразу; плиты трескаются, свет
   умирает, грань падает — навсегда) */
PLN_ACT.kinds.temple={ru:"ХРАМ",
  dims:H=>({H,W:H*1.7}),
  got:m=>m.st===0?"плиты не читаны":m.st===1?"плиты прочитаны":m.way==="gift"?"храм принял дар · убежище":"плиты разбиты",
  spots:[
    {id:"plates",ru:"плиты",dx:()=>.6,r:1.6,hold:2,tool:false,hum:false,verb:"ЧИТАТЬ ПЛИТЫ",sfx:"motif",when:m=>m.st===0,
      act:c=>{c.m.st=1;c.m.n.read=1;
        if(G.relicHint){const n=2+Math.floor(plnActRoll(c.q.seed,0x7EA,1)()*3+c.d*2),g=addRes("xeno",n);
          return {short:g?"образцы с плит: ксенобиом ×"+g:"плиты те же, а трюм полон"};}
        return {short:plnActHint(c.q.seed)||"надписи стёрты"};}},
    {id:"gift",ru:"алтарь",dx:()=>.6,r:1.6,fork:"altar",forkAlt:true,sfx:"motif",when:m=>m.st===1,
      verb:()=>{const k=plnTempleGift();return k?"ПОЛОЖИТЬ НА АЛТАРЬ: "+RES[k].ru.toUpperCase()+" ×3":null;},
      note:"на алтарь — три единицы одного груза",
      act:c=>{const k=plnTempleGift();if(!k)return {keep:true,short:"нечего положить"};
        G.cargo[k]-=3;
        const what=plnActRelic(c.q.seed,1,.4,"дар храму",()=>{
          if(typeof rareTake==="function")rareTake("temple",c.q.seed,"здесь: храм");
          const n=addRes("xeno",4);return "ксенобиом ×"+n;});
        c.m.st=2;c.m.way="gift";c.m.n.gift=k;
        return {short:"храм принял: "+RES[k].ru.toLowerCase()+" ×3 · "+what};}},
    {id:"refuge",ru:"алтарь",dx:()=>.6,r:1.6,when:m=>m.st===2&&m.way==="gift",verb:null,
      note:()=>{const S=G.surf;return "убежище · скафандр "+(S&&S.suit!=null?Math.round(S.suit):0)+"/"+suitMax();},
      stand:(S,dT)=>{if(S&&S.suit!=null&&S.suit<suitMax())S.suit=Math.min(suitMax(),S.suit+dT/60*20);}},
    {id:"sample",ru:"образец",dx:()=>-1.2,r:1.2,hold:3,verb:"ВЗЯТЬ ОБРАЗЕЦ",fork:"altar",sfx:"crackle",when:m=>m.st<2,
      act:c=>{if(!plnActRoom())return plnActFull();
        const r=plnActRoll(c.q.seed,0x5A1,1),n=addRes("xeno",4+Math.floor(r()*4+c.d*4)),lost=c.m.st===0;
        c.m.st=3;c.m.way="take";
        return {short:"ксенобиом ×"+n+" · плиты разбиты"+(lost?" · надписи стёрты":"")};}}],
  drive:(m,age,D,t,nk)=>{
    const E=plnActEase,P={},st=m.st|0,last=m.n.last,gift=m.way==="gift",take=m.way==="take";
    const ev=(id,a,b)=>last===id?E((age-a)/(b-a)):1;
    const g=gift?ev("gift",0,4):0,op=gift?ev("gift",3.5,5):0,f=take?(last==="sample"?Math.pow(clamp(age/.9,0,1),2):1):0;
    const oy=-D.H*.12*g-D.H*.135*f;
    P.octa={y:oy,hk:1-.62*op,roll:.55*f,k:take?.5:1};
    P.core={y:oy,k:1+2*op,s:1+.25*op,hide:take};
    const read=last==="plates"&&age<3?1-age/3:0;
    P.grooves={k:take?0:gift?1.8:.35+1.3*nk+2*read,hide:take};
    P.plates={roll:take?.2*ev("sample",0,.4):0,x:take?.05:0,y:take?-.015:0};
    const pul=.72+.28*Math.sin(t*.9);
    /* дар: полоса под крышей горит вдвое ярче нетронутой, и от алтаря к ней идут мотыльки — по 22 с
       путь, восемь вразбежку; колыхание вбок и дуга вверх, без мигания */
    const light=take?(last==="sample"?Math.max(0,1-age/1.2)*pul:0):gift?2*pul+.8*op*(1-ev("gift",5,7)):pul;
    const mo=gift?ev("gift",4,6):0;
    for(let i=0;i<8;i++){const u=((t/22)+i/8)%1,s=Math.sin(Math.PI*u);
      P["moth"+i]={go:u,x:.45*Math.sin(t*.7+i*1.7)*s,y:D.H*.08*s+.25*Math.sin(t*1.1+i)*s,k:2.2*mo*Math.pow(s,.6),hide:mo<.01};}
    const lamps=[];
    if(gift)lamps.push({id:"altar",r:6,k:1.2+.8*nk});
    else if(read>0)lamps.push({id:"altar",r:4,k:2.2*read});
    return {light,lampK:take?0:gift?2:1,parts:P,lamps};
  }};

/* ══════════════ монолит (§4.7) ══════════════
   Лицо плиты у линии: коснуться (шов отвечает, на лице два глифа — слова монолита); сказать оба
   слова, если оба знакомы (держать ДЕЙСТВИЕ, пока подсказка их показывает) — плита расходится,
   внутри свет, артефакт по броску; или образец с кромки — шов умирает, лицо пустеет навсегда */
PLN_ACT.kinds.monolith={ru:"МОНОЛИТ",
  dims:H=>({H,w:H*.17,d:H*.055}),
  got:m=>m.st===0?"отвечает на касание":m.st===1?"ждёт слова: "+plnMonoLine(m):m.st===2?"плита разошлась":"шов умер, лицо пустое",
  spots:[
    {id:"touch",ru:"шов",dx:()=>0,r:2,verb:"КОСНУТЬСЯ",sfx:"motif",when:m=>m.st===0,
      act:c=>{c.m.st=1;c.m.n.w=plnMonoWords(c.q.seed);G.data+=18;
        return {short:"шов отозвался · на лице: "+plnMonoLine(c.m)+" · +18 данных"};}},
    {id:"say",ru:"шов",dx:()=>0,r:2,hold:2,tool:false,hum:false,fork:"face",sfx:"motif",when:m=>m.st===1,
      verb:m=>{const W=m.n.w||[];return plnMonoKnown(W).length>=2?"СКАЗАТЬ: "+W.join(" ").toUpperCase():null;},
      note:m=>"не хватает слов: "+(2-plnMonoKnown(m.n.w).length),
      act:c=>{const what=plnActRelic(c.q.seed,2,.6,"монолит открылся",()=>{
          if(!G.relicHint){const h=plnActHint(c.q.seed^0x10);if(h)return h;}
          return "ксенобиом ×"+addRes("xeno",3);});
        c.m.st=2;c.m.way="word";
        return {short:"монолит открылся · "+what};}},
    {id:"sample",ru:"кромка",dx:D=>D.w*1.05,r:1.3,hold:4,verb:"ВЗЯТЬ ОБРАЗЕЦ",fork:"face",sfx:"crackle",when:m=>m.st<2,
      act:c=>{if(!plnActRoom())return plnActFull();
        const r=plnActRoll(c.q.seed,0x5A2,1),n=addRes("xeno",5+Math.floor(r()*4+c.d*4));
        c.m.st=3;c.m.way="take";
        return {short:"ксенобиом ×"+n+" · монолит молчит"};}}],
  drive:(m,age,D,t,nk)=>{
    const E=plnActEase,P={},st=m.st|0,last=m.n.last;
    const o=st===2?(last==="say"?E(age/3):1):0,rip=last==="touch"&&age<1.2?1-age/1.2:0;
    P.l={x:-.6*o};P.r={x:.6*o};
    P.inner={k:2.4*o,hide:o<.02};
    const K=st===1||st===2?plnMonoKnown(m.n.w):[];
    const pul=.72+.28*Math.sin(t*.9);
    const light=st===3?(last==="sample"?Math.max(0,1-age/1.5)*pul:0):st===2?1.25:pul+1.8*rip;
    /* глифы: борозда видна с касания и уезжает с правой половиной; свет борозды — у услышанного слова,
       той же яркости, что шов (геометрия светит вдвое слабее) */
    const on=st===1||st===2;
    for(let i=0;i<2;i++){const w=(m.n.w||[])[i],kn=st===2||K.indexOf(w)>=0;
      P["g"+(i+1)]={x:.6*o,hide:!on};P["g"+(i+1)+"L"]={x:.6*o,k:on&&kn?light:0,hide:!(on&&kn)};}
    const lamps=o>.02?[{id:"face",r:7,k:2*o}]:[];
    return {light,lampK:st===3?(last==="sample"?Math.max(0,1-age/1.5):0):st===2?1.6:1+rip,parts:P,lamps};
  }};

/* ══════════════ зарубка (§4.11) ══════════════
   Засечка на клинке у линии: прочесть (кусок отчёта, как 20b); развилка — оставить свою засечку
   (счёт — plnActNotches() по памяти памятников, слава в системе) или с ранца снять клин у вершины (артефакт или сплавы; верх падает
   к линии, засечка больше не читается, посёлок этой системы помнит) */
function plnActNotches(){let n=0;for(const k in G.poiSeen||{}){const v=G.poiSeen[k];if(v&&v.way==="carve")n++;}return n;}
PLN_ACT.kinds.obelisk={ru:"ЗАРУБКА",
  dims:H=>({H,wedge:H*.845,top:H*.93}),
  got:m=>m.st===3?"верх обрушен":m.st===2?"ваша засечка рядом":m.st===1?"прочитана":"засечка резана рукой",
  spots:[
    {id:"read",ru:"засечка",dx:()=>0,r:1.6,verb:m=>m.n.read?null:"ПРОЧЕСТЬ",sfx:"pen",when:m=>m.st!==3,
      act:c=>{const L=loreTake(c.q.seed),line=plnActNotchLine(c.q.seed);
        let s;if(L)s="кусок отчёта · "+L.chapRu;else{G.data+=16;s="засечка знакомая · +16 данных";}
        c.m.n.read=1;if(c.m.st===0)c.m.st=1;
        return {short:s,full:"Зарубка\n"+line+"\n"+s};}},
    {id:"carve",ru:"своя засечка",dx:()=>1.6,r:1.2,hold:3,verb:"ОСТАВИТЬ ЗАСЕЧКУ",fork:"blade",sfx:"pen",hum:"pen",when:m=>m.st<2,
      act:c=>{c.m.st=2;c.m.way="carve";
        if(typeof repAdd==="function")repAdd(1);
        return {short:"ваша засечка · люди видят, кто здесь был"};}},
    {id:"wedge",ru:"клин",dx:()=>0,r:3,air:D=>D.wedge-2.5,verb:"СНЯТЬ КЛИН",fork:"blade",sfx:"boom",when:m=>m.st<2,
      need:S=>S&&S.jet!=null&&S.jet<.6?"заряд ранца меньше 60 %":null,
      act:c=>{const what=plnActRelic(c.q.seed,3,.35,"клин зарубки",()=>"сплавы ×"+addRes("alloy",6));
        const V=typeof settleHere==="function"?settleHere():null;
        if(V)V.mood=clamp((V.mood||0)-10,0,100);
        const lost=!c.m.n.read;c.m.st=3;c.m.way="wedge";
        return {short:"клин снят · "+what+" · верх обрушен"+(lost?" · засечка не прочитана":"")+(V?" · посёлок видел":"")};}}],
  drive:(m,age,D,t,nk)=>{
    const E=plnActEase,P={},last=m.n.last,wedge=m.way==="wedge",carve=m.way==="carve";
    const u=wedge?(last==="wedge"?clamp(age/1.2,0,1):1):0,uw=wedge?(last==="wedge"?clamp(age/.8,0,1):1):0;
    P.top={go:u*u};P.wedge={go:uw*uw};
    P.scratch={k:carve?2.2*(last==="carve"?E(age/.6):1):0,hide:!carve};
    const rd=last==="read"&&age<4?1-age/4:0;
    P.lines={k:wedge?0:(m.n.read?.35:0)+1.8*rd,hide:wedge||!(m.n.read||rd>0)};
    const lamps=[];
    if(last==="carve"&&age<1.5)lamps.push({id:"carve",r:3,c:[1,.8,.5],k:2*(1-age/1.5)});
    else if(rd>0)lamps.push({id:"notch",r:3.5,c:[1,.78,.5],k:1.6*rd});
    return {light:wedge?0:nk*(Math.sin(t*2.6)>.8?1:.5),parts:P,lamps};
  }};

/* ══════════════ врата (§4.9) ══════════════
   Порог у линии: пробудить — шов загорается от подошвы, ключи кружат, между пилонами сорок секунд
   стоит тёмное зеркало. Пока оно стоит — развилка у порога: слить заряд (40 % бака, врата гаснут
   навсегда) или оставить открытыми (20 % сейчас, 20 % каждый день у порога и адрес близнеца) */
function plnPortalOpen(m){return !!m&&m.st===1&&m.n.last==="wake"&&plnActAge(m)<40;}
PLN_ACT.kinds.portal={ru:"ВРАТА",
  dims:H=>({H,gx:H*.42}),
  got:m=>m.st===0?"кольцо держит заряд":m.st===1?"врата отзываются":m.st===2?"врата открыты · 20 % в день":"заряд слит",
  spots:[
    {id:"wake",ru:"порог",dx:()=>0,r:2.6,hold:3,tool:false,hum:false,verb:"ПРОБУДИТЬ ВРАТА",sfx:"motif",
      when:m=>m.st===0||(m.st===1&&!plnPortalOpen(m)),
      act:c=>{c.m.st=1;return {short:"врата отозвались · зеркало стоит сорок секунд"};}},
    {id:"drain",ru:"слить заряд",dx:()=>-1.6,r:1.6,hold:3,fork:"gate",forkAlt:true,sfx:"boom",when:plnPortalOpen,
      /* полный бак — сливать некуда: глагол не зовёт держать впустую */
      verb:()=>G.fuel>=stat().fuelMax?null:"СЛИТЬ ЗАРЯД В БАКИ",note:"баки полны — сливать некуда",
      act:c=>{const n=plnActFuel(.4);if(n<=0)return {keep:true,short:"баки и так полны"};
        c.m.st=3;c.m.way="drain";return {short:"топливо ×"+n+" · врата погасли"};}},
    {id:"keep",ru:"оставить открытыми",dx:()=>1.6,r:1.6,verb:"ОСТАВИТЬ ОТКРЫТЫМИ",fork:"gate",sfx:"ok",when:plnPortalOpen,
      act:c=>{const n=plnActFuel(.2);let tw="";
        const A=typeof loreAddr==="function"?loreAddr((c.q.seed^0x9A7E)>>>0):null;
        if(A){loreMarks().push({sx:A.sx,sy:A.sy,id:"portal:"+c.q.seed});tw=" · врата отзываются из сектора "+A.sx+":"+A.sy;}
        c.m.day=celDay();c.m.st=2;c.m.way="keep";
        return {short:(n>0?"топливо ×"+n:"баки полны")+tw};}},
    {id:"day",ru:"порог",dx:()=>0,r:2.6,when:m=>m.st===2,verb:m=>plnActDailyReady(m)?"ЗАРЯД ДНЯ":null,note:"заряд дня взят · завтра снова",sfx:"ok",
      act:c=>{if(!plnActDaily(c.m))return {keep:true,short:"заряд дня взят"};
        const n=plnActFuel(.2);return {short:"заряд дня · топливо ×"+n};}}],
  drive:(m,age,D,t,nk)=>{
    const E=plnActEase,P={},st=m.st|0,last=m.n.last;
    const open=st===1&&last==="wake"&&age<40,rise=last==="wake"?E(age/4):1,fade=open?clamp((40-age)/4,0,1)*E(age/2):0;
    /* оставленные открытыми врата держат слабое зеркало навсегда — иначе их не отличить от нетронутых */
    const kept=st===2?.4*(last==="keep"?E(age/3):1):0,mk=Math.max(fade,kept);
    P.mirror={k:(.26+.08*Math.sin(t*.45))*mk,hide:mk<.01};
    const spin=open?t*.7:st===2?t*.12:0;
    P.keyL={yaw:spin};P.keyR={yaw:-spin};
    const pul=.72+.28*Math.sin(t*.9),dr=last==="drain"&&age<2?1-E(age/2):0;
    P.foot={k:st===3?2*dr:open?.5+1.8*rise:st===2?1.1:.45+.15*Math.sin(t*.9),hide:st===3&&dr<=0};
    /* заряд дня: порог вспыхивает и гаснет за три секунды */
    const dd=st===2&&last==="day"&&age<3?1-E(age/3):0;
    if(dd)P.foot.k+=1.6*dd;
    const light=st===3?dr:open?.55+.75*rise:st===2?.8+.9*dd:pul;
    const lamps=open?[{id:"foot",r:5,k:1.8*rise*fade}]:dd?[{id:"foot",r:4,k:1.6*dd}]:[];
    return {light,lampK:st===3?dr:open?1.8:st===2?1.2:1,parts:P,lamps};
  }};

/* ══════════════ обсерватория (§4.10) ══════════════
   Одна батарея на сутки: пульт у линии открывает купол (днём — цены соседней станции, по одной в
   день; ночью — что висит в пустоте системы, по виду и часам, и ближнее затмение, +12 данных), ворот
   настраивает антенну (кусок отчёта один раз, дальше +10 данных). Что взято первым — то и съело
   заряд; второе — на следующий день. Ничего не ломается: развилка — время */
function plnObsSky(c){
  const out=[],sys=G.sys;
  for(const f of (typeof findsIn==="function"&&sys?findsIn(sys):[])){
    if(typeof findSeen==="function"&&findSeen(f))continue;
    const K=FIND_KINDS[f.k],h=((Math.round(-Math.atan2(f.y,f.x)/TAU*12+3)%12)+12)%12||12;
    out.push((K?K.ru:f.k)+" на "+h+" часов, "+Math.round(Math.hypot(f.x,f.y)/100)*100+" от звезды");
  }
  let ecl="затмений не будет сегодня";
  const p=c.p;
  if(p&&typeof celEclipse==="function"&&!celEclipse(p,G.t)){
    const per=CEL_DAY*(6+(((p.seed|0)>>>7)&3)),t0=G.t||0;
    for(let dt=per/96;dt<per;dt+=per/96)if(celEclipse(p,t0+dt)){ecl="затмение через "+Math.max(1,Math.round(dt/per*24))+" ч";break;}
  }else if(p&&typeof celEclipse==="function")ecl="затмение идёт сейчас";
  G.data+=12;
  return {short:(out.length?"в пустоте: "+out.join(" · "):"в пустоте тихо")+" · "+ecl+" · +12 данных"};
}
PLN_ACT.kinds.observ={ru:"ОБСЕРВАТОРИЯ",
  dims:H=>({H,R:H*.3}),
  got:m=>m.st===2?"работает · день — купол, день — антенна":m.st===1?(m.n.dome!=null?"купол открыт · антенна ждёт":"антенна настроена · купол ждёт"):"батарея заряжена",
  spots:[
    {id:"dome",ru:"пульт",dx:D=>-D.R*1.2,r:2,hold:3,fork:"charge",sfx:"creak",hum:"ui",
      verb:m=>plnActDailyReady(m)?"ОТКРЫТЬ КУПОЛ":null,note:"батарея пуста · зарядится за день",
      act:c=>{if(!plnActDaily(c.m))return {keep:true,short:"батарея пуста"};
        let out;
        if(c.night)out=plnObsSky(c);
        else{const l=plnActPriceLead(plnActRoll(c.q.seed,0x0B5,celDay()));out={short:l?l.toLowerCase():"архив: ничего нового"};}
        const m=c.m;m.n.dome=celDay();m.n.domeYaw=c.night?-.55:.45;
        m.st=m.n.dish!=null?2:1;m.way=m.st===2?"both":null;
        return out;}},
    {id:"dish",ru:"ворот антенны",dx:D=>D.R*1.8,r:2,hold:3,fork:"charge",sfx:"signoff",hum:"crackle",
      verb:m=>plnActDailyReady(m)?"НАСТРОИТЬ АНТЕННУ":null,note:"батарея пуста · зарядится за день",
      act:c=>{if(!plnActDaily(c.m))return {keep:true,short:"батарея пуста"};
        const m=c.m;let s;
        if(!m.n.lore){m.n.lore=1;const L=loreTake((c.q.seed^0x5A7)>>>0);
          if(L)s="кусок отчёта · "+L.chapRu;else{G.data+=10;s="эфир пуст · +10 данных";}}
        else{G.data+=10;s="эфир · +10 данных";}
        m.n.dish=celDay();m.st=m.n.dome!=null?2:1;m.way=m.st===2?"both":null;
        return {short:s};}}],
  drive:(m,age,D,t,nk)=>{
    const E=plnActEase,P={},last=m.n.last,today=celDay();
    const dy=(m.n.domeYaw||0)*(last==="dome"?E(age/6):1),open=m.n.dome===today?(last==="dome"?E(age/1.5):1):0;
    /* створка уходит по кругу купола дальше своей ширины, к объективу (против поворота купола), — сдвинута
       набок явно; нутро днём тусклое,
       ночью тёплое */
    const sk=open*(.25+1.55*nk);
    P.dome={yaw:dy};P.slit={yaw:dy,k:sk,hide:sk<.02};P.shutter={yaw:dy+(dy>0?-1.15:1.15)*open};
    const de=m.n.dish!=null?(last==="dish"?E(age/5):1):0;
    /* на три четверти, не ребром: ребром тарелка пропадала, и казалось, что её сняли */
    P.dish={yaw:-.85*de,roll:.45*de};
    const h=PLN_ACT.hold,work=h&&h.id==="dish";
    P.crank={roll:work?t*5:(last==="dish"&&age<5?(1-age/5)*2:0)};
    P.screen={k:plnActDailyReady(m)?1.3+.25*Math.sin(t*1.7):.18};
    /* свет щели — первым (на обод и стену башни); окно пульта светит лампой вида (21pieb) */
    const lamps=open>.02&&nk>.1?[{id:"slit",r:D.H*.45,c:[1,.74,.42],k:1.8*open*nk},{id:"console",r:4,c:[.5,1,.7],k:.4}]:[];
    return {light:nk,parts:P,lamps};
  }};
