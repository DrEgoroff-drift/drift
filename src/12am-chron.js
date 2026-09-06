/* ══════════════ летопись (M370, §7.5, §16.2–16.4) ══════════════
   Галактика живёт без игрока: шесть держав торгуют, ссорятся, воюют и мирятся,
   фронты ходят, системы меняют хозяев. Ни один такт при этом нигде не тикает.

   Как это устроено. Состояние на сводке N — это РЕЗУЛЬТАТ ПОВТОРА сводок 0…N:
   `step()` детерминирован, зерно галактики постоянно, значит любой клиент,
   повторив ту же историю, получит те же владения байт в байт. Ничего не
   моделируется на сервере, и в сохранение летопись не попадает вовсе (§16.4):
   её место — свой ключ `drift_war_v1`, и он всего лишь КЭШ. Потерялся — повтор
   от нуля занимает миллисекунды.

   Три правила, из которых всё остальное следует (§16.3, D04):
     · только целые, доли — в промилле;
     · ни экспонент, ни синусов, ни степеней в этом файле — насыщение берётся
       таблицей (тест проверяет это чтением исходника: на дробной математике
       браузеры расходятся, а летопись обязана совпадать байт в байт);
     · сводка длится шесть часов, номер считается от часов, а не от такта.

   Что здесь есть сегодня: география (D12), агенты и их ходы, фронты, ограничители,
   строки в эфир голосом ГЛАВТРАССЫ, хэш и кэш. Чего нет: ведомости игроков
   (M376), циркуляры (M381) и Директор (M371) — их места в `step()` отмечены и
   пусты, и это НЕ заглушки-обманки: пустой шаг честно ничего не делает. */
const CHRON_KEY="drift_war_v1";
const CHRON_SHIFT=21600000;               /* шесть часов — одна сводка */
/* сводка № 0 — начало летописи, а не начало эпохи Unix: иначе повтор считал бы
   восемьдесят тысяч пустых сводок до того, как в галактике кто-то родился */
const CHRON_EPOCH=Date.UTC(2026,0,1);
const CHRON_SEED=0x0DF17;                 /* зерно летописи: одна галактика на всех */
const CHRON_R=10;                         /* радиус обжитого круга: ~317 систем */
const CHRON_LINES=500;                    /* сколько строк держим для новостей */
/* насыщение 1−exp(−n/12) в промилле, 51 запись (§16.3): дробей в коде нет,
   значит и расхождений между браузерами нет */
const CHRON_SAT=[0,80,154,221,283,341,393,442,487,528,565,600,632,662,689,713,736,757,777,795,
  811,826,840,853,865,875,885,895,903,911,918,924,931,936,941,946,950,954,958,961,964,967,970,
  972,974,976,978,980,982,983,984];
function chronSat(n){n=n|0;return CHRON_SAT[n<0?0:(n>50?50:n)];}
/* ── география (D12) ──
   Шесть домов стоят шестиугольником вокруг центра — целыми координатами, без
   единого синуса. «Ялта» лежит в центре круга и не принадлежит никому. */
const CHRON_HOME=[[8,0],[4,7],[-4,7],[-8,0],[-4,-7],[4,-7]];
function chronKeys(){
  if(CHRON._keys)return CHRON._keys;
  const out=[];
  for(let x=-CHRON_R;x<=CHRON_R;x++)for(let y=-CHRON_R;y<=CHRON_R;y++)
    if(x*x+y*y<=CHRON_R*CHRON_R)out.push(x+","+y);
  return CHRON._keys=out;
}
function chronHomeOf(x,y){
  /* хозяин по рождению — ближайший дом; при равенстве побеждает младший индекс */
  let best=0,bd=1e9;
  for(let i=0;i<6;i++){
    const dx=x-CHRON_HOME[i][0],dy=y-CHRON_HOME[i][1],d=dx*dx+dy*dy;
    if(d<bd){bd=d;best=i;}
  }
  return best;
}
function chronYaltaKey(){
  const y=(typeof yaltaAt==="function")?yaltaAt():{sx:0,sy:0};
  return y.sx+","+y.sy;
}
/* ── состояние ── */
let CHRON={N:-1,powers:null,systems:null,wars:null,lines:null,_keys:null,off:0};
function chronFresh(){
  const P=[];
  for(let i=0;i<6;i++)P.push({
    hold:0,                                  /* сколько систем держит */
    need:{ore:500,goods:500,hulls:500,link:500},
    rel:[0,0,0,0,0,0],                       /* −1000…1000 */
    str:500,tension:0,arc:null});
  const S={};
  const yk=chronYaltaKey();
  for(const k of chronKeys()){
    const p=k.split(","),x=p[0]|0,y=p[1]|0;
    const yalta=(k===yk);
    const o=yalta?-1:chronHomeOf(x,y);
    S[k]={owner:o,since:0,front:0,yalta:yalta?1:0};
    if(o>=0)P[o].hold++;
  }
  return {N:-1,powers:P,systems:S,wars:[],lines:[],_keys:CHRON._keys,off:CHRON.off|0};
}
/* ── ход одной сводки (§16.2) ── */
function chronStep(st,N){
  const rr=(a,b)=>hashi(N,a,(b|0)^CHRON_SEED);           /* целый бросок */
  /* 1 ведомость игроков — M376; 2 циркуляр — M381; 3 Директор — M371.
     Места заняты и пусты: пустой шаг ничего не делает и ничего не врёт. */
  if(typeof chronDirector==="function")chronDirector(st,N);
  /* 4 агенты ходят по семенному порядку: каждый делает один ход */
  const order=[0,1,2,3,4,5].sort((a,b)=>(rr(a,7)%1000)-(rr(b,7)%1000));
  for(const i of order){
    if(typeof chronAgentMove==="function")chronAgentMove(st,N,i,rr);
  }
  /* 5 фронты: у каждой войны фронт ходит на систему за сводку. Куда — решает
     бросок с поправкой на силу сторон, насыщенную таблицей */
  for(const w of st.wars){
    const A=st.powers[w.a],B=st.powers[w.b];
    const push=chronSat(Math.abs(A.str-B.str)/40|0);
    const dir=(A.str>=B.str)?1:-1;
    const roll=rr(w.a*13+w.b,0x1F)%1000;
    if(roll>500-((push*dir)/4|0))chronFlip(st,N,w.a,w.b,rr);
    else chronFlip(st,N,w.b,w.a,rr);
  }
  /* 6 ограничители (§15): никто не держит больше половины круга, война не
     идёт вечно, «Ялта» не меняет хозяина никогда */
  const total=chronKeys().length;
  for(let i=0;i<6;i++){
    const P=st.powers[i];
    /* сила гуляет вокруг потолка, а не упирается в тысячу: потолок считается
       от того, сколько держава держит, и выше него её тянет вниз */
    const cap=clampi(300+P.hold*6,300,900);
    P.str=clampi(P.str+((rr(i,0x5E)%21)-10)+(P.str>cap?-7:3),100,1000);
    P.tension=clampi(P.tension-3,0,1000);
    if(P.hold>(total/2|0))P.str=clampi(P.str-40,100,1000);
  }
  /* фронт — не клеймо: через две сводки после перехода система перестаёт быть
     фронтом, иначе половина круга навсегда светится войной */
  for(const k of chronKeys()){
    const S=st.systems[k];
    if(S.front&&N-S.since>2)S.front=0;
  }
  for(let i=st.wars.length-1;i>=0;i--){
    const w=st.wars[i];
    if(N-w.t0>=12||st.powers[w.a].str<160||st.powers[w.b].str<160){
      st.wars.splice(i,1);
      const A=st.powers[w.a],B=st.powers[w.b];
      A.rel[w.b]=clampi(A.rel[w.b]+250,-1000,1000);
      B.rel[w.a]=A.rel[w.b];
      chronLine(st,N,"truce",w.a,null,{b:w.b});
    }
  }
  st.N=N;
  return st;
}
function clampi(v,a,b){v=v|0;return v<a?a:(v>b?b:v);}
/* ── одна система переходит из рук в руки ── */
function chronFlip(st,N,from,to,rr){
  const keys=chronKeys();
  const start=rr(from*7+to,0x2C)%keys.length;
  for(let i=0;i<keys.length;i++){
    const k=keys[(start+i)%keys.length];
    const S=st.systems[k];
    if(!S||S.yalta||S.owner!==to)continue;        /* «Ялта» не переходит никогда */
    /* фронт идёт по границе: берём только то, что соседствует с наступающим */
    if(!chronBorders(st,k,from))continue;
    S.owner=from;S.since=N;S.front=1;
    st.powers[to].hold--;st.powers[from].hold++;
    chronLine(st,N,"take",from,k,{from:to});
    return true;
  }
  return false;
}
function chronBorders(st,k,who){
  const p=k.split(","),x=p[0]|0,y=p[1]|0;
  for(const d of [[1,0],[-1,0],[0,1],[0,-1]]){
    const S=st.systems[(x+d[0])+","+(y+d[1])];
    if(S&&S.owner===who)return true;
  }
  return false;
}
/* ── строки: пока звучит только ГЛАВТРАССА (шесть волн — M371) ── */
function chronLine(st,N,kind,p,sys,args){
  st.lines.push({N,kind,p,sys:sys||null,args:args||null});
  if(st.lines.length>CHRON_LINES)st.lines.splice(0,st.lines.length-CHRON_LINES);
}
function chronLineRu(L){
  const P=(typeof POWERS!=="undefined")?POWERS[MAKER_KEYS[L.p]]:null;
  const who=P?P.ru:"держава";
  if(L.kind==="take")return "На трассе спокойно. Отмечено движение в секторе "+L.sys+".";
  if(L.kind==="truce")return "На трассе спокойно. Подписано в Ялте.";
  if(L.kind==="war")return "На трассе спокойно. "+who+" сообщает о временных трудностях на отдельных участках.";
  if(L.kind==="deal")return "На трассе спокойно. План выполнен на 103 %.";
  return "На трассе спокойно.";
}
/* ── номер сводки от часов (§16.3) ── */
function chronNow(){
  const t=Date.now()+(CHRON.off|0)-CHRON_EPOCH;
  return t>0?Math.floor(t/CHRON_SHIFT):0;
}
/* ── хэш состояния: FNV-1a по целым (D06) ── */
function chronHash(st){
  let h=0x811c9dc5>>>0;
  const mix=v=>{h=(h^(v>>>0))>>>0;h=Math.imul(h,0x01000193)>>>0;};
  mix(st.N+1);
  for(const P of st.powers){
    mix(P.hold);mix(P.str);mix(P.tension);
    for(const r of P.rel)mix(r+2000);
    mix(P.need.ore);mix(P.need.goods);mix(P.need.hulls);mix(P.need.link);
  }
  for(const k of chronKeys()){
    const S=st.systems[k];
    mix((S.owner+2)*8+S.front);
  }
  for(const w of st.wars){mix(w.a*8+w.b);mix(w.t0+1);}
  return h>>>0;
}
/* ── повтор: от нуля или от кэша ── */
function chronReplay(N,from){
  let st=from?chronClone(from):chronFresh();
  const start=(st.N|0)+1;
  for(let n=start;n<=N;n++)chronStep(st,n);
  return st;
}
function chronClone(st){
  const S={};
  for(const k in st.systems){const s=st.systems[k];S[k]={owner:s.owner,since:s.since,front:s.front,yalta:s.yalta};}
  const P=st.powers.map(p=>({hold:p.hold,need:{ore:p.need.ore,goods:p.need.goods,hulls:p.need.hulls,link:p.need.link},
    rel:p.rel.slice(),str:p.str,tension:p.tension,arc:p.arc}));
  return {N:st.N,powers:P,systems:S,wars:st.wars.map(w=>({a:w.a,b:w.b,t0:w.t0})),
    lines:st.lines.slice(),off:st.off|0};
}
/* ── состояние на сейчас: кэш, потом повтор ── */
function chronState(N){
  if(N===undefined)N=chronNow();
  if(CHRON.powers&&CHRON.N===N)return CHRON;
  let base=null;
  if(CHRON.powers&&CHRON.N<=N)base=CHRON;
  else{
    const c=chronLoad();
    if(c&&c.N<=N)base=c;
  }
  const st=chronReplay(N,base);
  CHRON=st;CHRON._keys=chronKeys();
  chronSave(st);
  return st;
}
/* ── кэш в своём ключе, а не в сохранении (§16.4) ── */
function chronSave(st){
  try{
    const o={v:1,N:st.N,off:st.off|0,
      p:st.powers.map(p=>[p.hold,p.str,p.tension,p.rel.slice(),
        [p.need.ore,p.need.goods,p.need.hulls,p.need.link]]),
      s:chronKeys().map(k=>st.systems[k].owner+","+st.systems[k].since+","+st.systems[k].front).join("|"),
      w:st.wars.map(w=>[w.a,w.b,w.t0])};
    localStorage.setItem(CHRON_KEY,JSON.stringify(o));
  }catch(e){}
}
function chronLoad(){
  try{
    const o=JSON.parse(localStorage.getItem(CHRON_KEY)||"null");
    if(!o||o.v!==1||!o.p||!o.s)return null;
    const st=chronFresh();
    st.N=o.N|0;st.off=o.off|0;
    o.p.forEach((q,i)=>{
      st.powers[i].hold=q[0]|0;st.powers[i].str=q[1]|0;st.powers[i].tension=q[2]|0;
      st.powers[i].rel=q[3].map(v=>v|0);
      st.powers[i].need={ore:q[4][0]|0,goods:q[4][1]|0,hulls:q[4][2]|0,link:q[4][3]|0};
    });
    const parts=o.s.split("|"),keys=chronKeys();
    if(parts.length!==keys.length)return null;
    keys.forEach((k,i)=>{
      const v=parts[i].split(",");
      st.systems[k].owner=v[0]|0;st.systems[k].since=v[1]|0;st.systems[k].front=v[2]|0;
    });
    st.wars=(o.w||[]).map(w=>({a:w[0]|0,b:w[1]|0,t0:w[2]|0}));
    return st;
  }catch(e){return null;}
}
/* ── что спрашивает у летописи остальная игра ── */
function chronOwner(sx,sy){
  const st=chronState();
  const S=st.systems[(sx|0)+","+(sy|0)];
  return S?S.owner:-1;
}
function chronOwnerKey(sx,sy){
  const o=chronOwner(sx,sy);
  return o>=0?MAKER_KEYS[o]:null;
}
function chronFront(sx,sy){
  const st=chronState();
  const S=st.systems[(sx|0)+","+(sy|0)];
  return !!(S&&S.front);
}
function chronWars(){return chronState().wars;}
