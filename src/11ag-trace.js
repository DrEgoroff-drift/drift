/* ══════════════ чужой след: одна метка на всю жизнь ══════════════
   M171. Единственное место, где в игру попадает другой живой человек, — и он
   попадает молча. Правило, из которого следует всё остальное:

     НИЧЕГО НАПЕЧАТАННОГО ЧЕЛОВЕКОМ НЕ ПЕРЕХОДИТ В ЧУЖУЮ ИГРУ.

   Переходит ЗНАК — одна из двенадцати фигур, вырезанных рукой, — и ВЕЩЬ:
   единицы груза, действительно снятые с трюма. Модерировать нечего, потому
   что писать нечем.

   Знак не выбирают: он выводится из анонимной метки пилота (localStorage
   drift_pilot — случайная, без учётной записи; у дорожного спутника M168c с
   25.08.2026 метка СВОЯ, чтобы игра и поездки не сходились в одну ниточку).
   Поэтому знак ваш и он один; выбрать фигуру «со значением» нельзя.
   Значения у фигур нет вовсе, и игра его никогда не объясняет.

   Рядом со знаком ходит РУКА — шесть шестнадцатеричных знаков от той же метки,
   никогда не показываемых текстом. Она нужна ровно для одного: заметить, что
   этот знак вырезала та же рука, что и найденный четыре системы назад. На
   второй встрече тетрадь пишет строку и ничего не поясняет.

   ПРАВИЛА ФАЙЛА:
   1. Оффлайн — не урезанный режим, а обычный. На file:// и без сети следов нет
      и действия «оставить» нет; интерфейс молчит, а не жалуется.
   2. Сеть не держит кадр: один запрос на посадку, не чаще 20 с, ошибки молча.
   3. Формат сейва v:4 не меняется: G.trace — объект с дефолтом.
   4. Ключ места — как у историй (11c) и у памяти места (11d).
   Замысел целиком: docs/DESIGN-trace.md */

/* двенадцать фигур. Рисуются штрихами в квадрате −1..1, толщина снаружи —
   поэтому один и тот же знак читается и на земле, и в тетради */
const TRACE_MARK=[
  {ru:"стрела",   d:c=>{c.moveTo(0,1);c.lineTo(0,-1);c.moveTo(-.5,-.4);c.lineTo(0,-1);c.lineTo(.5,-.4);}},
  {ru:"крест",    d:c=>{c.moveTo(-.8,-.8);c.lineTo(.8,.8);c.moveTo(.8,-.8);c.lineTo(-.8,.8);}},
  {ru:"кольцо",   d:c=>{c.moveTo(.8,0);c.arc(0,0,.8,0,6.283);c.moveTo(.16,0);c.arc(0,0,.16,0,6.283);}},
  {ru:"три черты",d:c=>{for(let i=-1;i<=1;i++){c.moveTo(i*.55,-.85);c.lineTo(i*.55,.85);}}},
  {ru:"вилка",    d:c=>{c.moveTo(0,1);c.lineTo(0,0);c.lineTo(-.7,-.9);c.moveTo(0,0);c.lineTo(.7,-.9);}},
  {ru:"часы",     d:c=>{c.moveTo(-.7,-.9);c.lineTo(.7,-.9);c.lineTo(-.7,.9);c.lineTo(.7,.9);c.closePath();}},
  {ru:"гребень",  d:c=>{c.moveTo(-.9,.5);c.lineTo(.9,.5);for(let i=0;i<4;i++){const x=-.75+i*.5;c.moveTo(x,.5);c.lineTo(x,-.8);}}},
  {ru:"волна",    d:c=>{c.moveTo(-.9,.2);c.bezierCurveTo(-.4,-.9,.4,.9,.9,-.2);}},
  {ru:"крюк",     d:c=>{c.moveTo(-.2,-.9);c.lineTo(-.2,.4);c.bezierCurveTo(-.2,.95,.7,.95,.7,.3);}},
  {ru:"звезда",   d:c=>{for(let i=0;i<3;i++){const a=i*Math.PI/3;c.moveTo(-Math.cos(a)*.9,-Math.sin(a)*.9);c.lineTo(Math.cos(a)*.9,Math.sin(a)*.9);}}},
  {ru:"лестница", d:c=>{c.moveTo(-.5,-.9);c.lineTo(-.5,.9);c.moveTo(.5,-.9);c.lineTo(.5,.9);for(let i=0;i<3;i++){const y=-.5+i*.5;c.moveTo(-.5,y);c.lineTo(.5,y);}}},
  {ru:"глаз",     d:c=>{c.moveTo(-.9,0);c.quadraticCurveTo(0,-.75,.9,0);c.quadraticCurveTo(0,.75,-.9,0);c.moveTo(.22,0);c.arc(0,0,.22,0,6.283);}}
];
const TRACE_CAP_DAY=3, TRACE_MAX_UNITS=5;

function traceAll(){return (G.trace||(G.trace={day:"",left:0,hands:{},seen:0}));}
/* метка пилота: общая с дорогой (M168c) — там она уже заведена и уже случайна */
/* метку читаем один раз за сеанс: условие «оставить знак» проверяется каждый
   кадр у корабля, а localStorage — синхронный вызов, ему там не место */
let tracePilot=null;
function traceId(){
  if(tracePilot!==null)return tracePilot;
  let id=stGet("drift_pilot")||"";
  if(!id){
    try{id=Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b=>b.toString(16).padStart(2,"0")).join("");}
    catch(e){return (tracePilot="");}
    if(!stSet("drift_pilot",id))return (tracePilot="");
  }
  return (tracePilot=id);
}
function traceHashOf(s){
  let h=2166136261>>>0;
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}
  return h>>>0;
}
/* рука: шесть знаков, никогда не показываемых текстом. Не обратима в человека */
function traceHand(id){const h=traceHashOf((id||traceId())+"|рука");return ("00000"+h.toString(16)).slice(-6);}
function traceMarkOf(id){return traceHashOf((id||traceId())+"|знак")%TRACE_MARK.length;}
function traceOn(){return typeof location!=="undefined"&&location.protocol.indexOf("http")===0&&!!traceId();}
function traceToday(){const d=new Date();return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();}
function traceLeftToday(){
  const T=traceAll(),t=traceToday();
  if(T.day!==t){T.day=t;T.left=0;}
  return Math.max(0,TRACE_CAP_DAY-(T.left|0));
}

/* ── сеть ── одна дорога наружу, ошибки молча, кадр не ждёт */
let traceBusy=0;
function traceCall(op,body){
  if(!traceOn())return Promise.resolve(null);
  const b=Object.assign({op:op,id:traceId()},body||{});
  return fetch(CLOUD.api+"?a=trace",{method:"POST",body:JSON.stringify(b)})
    .then(r=>r.json()).catch(()=>null);
}
/* спросить место при посадке. Ответ кладётся в S.trace — эфемерно, не в сейв */
function traceAsk(){
  const S=G.surf;if(!S||!traceOn())return;
  const key=(typeof placeKeyHere==="function")?placeKeyHere():null;
  if(!key)return;
  const now=Date.now();
  if(now-traceBusy<20000)return;
  traceBusy=now;
  traceCall("ask",{key:key}).then(j=>{
    if(!j||!j.ok||G.surf!==S)return;
    /* ваш знак подняли — единственная обратная связь, и в ней только счёт */
    const took=j.took|0;
    if(took>0&&typeof etherLine==="function")
      etherLine("ваш знак подняли"+(took>1?" ×"+took:""));
    if(j.t&&typeof j.t.m==="number")S.trace=Object.assign({},j.t,{key:key});
  });
}
/* где лежит: место в полосе выводится из ключа и руки, а не из камеры */
function traceSpotX(tr,t){
  const r=rng(traceHashOf(t.key+"|"+t.h+"|"+String(t.i||"")));
  return 120+r()*Math.max(60,tr.W-240);
}
function traceHere(){
  const S=G.surf;if(!S||!S.trace||S.trace.done)return null;
  return S.trace;
}
function traceNear(S,tr){
  const t=traceHere();if(!t)return null;
  if(t.x==null)t.x=traceSpotX(tr,t);
  return Math.abs(t.x-S.x)<32?t:null;
}

/* ── поднять ── первый пришедший забирает; остальным здесь уже ничего нет */
function traceTake(t){
  const n=Math.max(1,Math.min(TRACE_MAX_UNITS,t.n|0));
  const k=RES[t.r]?t.r:"ice";
  const got=(typeof addRes==="function")?addRes(k,n):0;
  t.done=true;
  traceCall("take",{key:t.key,i:String(t.i||"")});
  const M=TRACE_MARK[t.m%TRACE_MARK.length];
  /* вторая встреча той же руки — одна строка и никаких пояснений */
  const T=traceAll();
  T.hands=T.hands||{};
  const met=(T.hands[t.h]|0)+1;T.hands[t.h]=met;
  T.seen=(T.seen|0)+1;
  if(typeof logAdd==="function")
    logAdd("good","Чужой знак — "+M.ru+(got>0?", под ним "+RES[k].ru.toLowerCase()+" ×"+got:", под ним ничего не осталось"));
  if(met===2&&typeof logAdd==="function")logAdd("dim","Рука та же.");
  if(typeof sfx==="function")sfx("ui");
  if(typeof say==="function")
    say("ПОДНЯТО · "+M.ru.toUpperCase()+(got>0?"\n"+RES[k].ru+" ×"+got:"\nтрюм полон"),160);
  if(typeof placeNote==="function")placeNote("care",1);
}
/* ── оставить ── у корабля, из того, чего в трюме больше всего, и это стоит груза */
function traceBigRes(){
  let best=null,bn=0;
  for(const k of RES_KEYS){
    if(k==="folk"||k==="missile")continue;   /* людей и боеприпас в земле не оставляют */
    const n=G.cargo[k]|0;if(n>bn){bn=n;best=k;}
  }
  return best?{k:best,n:Math.min(TRACE_MAX_UNITS,bn)}:null;
}
function traceCanLeave(){
  if(!traceOn()||traceLeftToday()<=0)return null;
  if(typeof placeKeyHere!=="function"||!placeKeyHere())return null;
  return traceBigRes();
}
function traceLeave(){
  const g=traceCanLeave();if(!g)return false;
  const key=placeKeyHere();
  G.cargo[g.k]-=g.n;
  const T=traceAll();traceLeftToday();T.left=(T.left|0)+1;
  traceCall("put",{key:key,m:traceMarkOf(),h:traceHand(),r:g.k,n:g.n});
  const M=TRACE_MARK[traceMarkOf()];
  if(typeof sfx==="function")sfx("pen");
  if(typeof say==="function")say("ЗНАК ОСТАВЛЕН · "+M.ru.toUpperCase()+"\n"+RES[g.k].ru+" ×"+g.n,170);
  if(typeof logAdd==="function")logAdd("dim","Оставлен знак — "+M.ru+", под ним "+RES[g.k].ru.toLowerCase()+" ×"+g.n+".");
  if(typeof placeNote==="function")placeNote("care",1);
  /* ── первая запись в тетради, которой никто не ведёт (11ai) ──
     Груз, оставленный чужому, который никогда не узнает, что это был ты, —
     ровно тот поступок, ради которого тетрадь и заведена. Цена настоящая:
     товар ушёл из трюма по своей цене. Игроку об этом не сообщается ничем. */
  if(typeof deedAdd==="function")
    deedAdd("mark",g.n*((RES[g.k]&&RES[g.k].price)||1));
  return true;
}

/* ── как это выглядит ── прорез в грунте и вещь рядом, размером с ящик, не с дом */
function traceDrawMark(m,sc,col,w){
  const M=TRACE_MARK[m%TRACE_MARK.length];
  ctx.save();ctx.scale(sc,sc);
  ctx.beginPath();M.d(ctx);
  ctx.strokeStyle=col;ctx.lineWidth=(w||2)/sc;ctx.lineCap="round";ctx.lineJoin="round";
  ctx.stroke();ctx.restore();
}
/* ТРЕТИЙ ПРОХОД, и он переделал замысел, а не толщину линии.
   Знак задумывался вырезанным в земле — и в первых двух проходах читался
   палкой, воткнутой в грунт. Причина не в размере: игра смотрит на мир СБОКУ,
   и всё, что лежит на земле, видно с нулевой высоты. Прорез в грунте в такой
   проекции не существует физически.
   Поэтому знак режут на КАМНЕ: пилот ставит плиту у своего груза и режет знак
   по её лицу. Вертикальная грань — единственная поверхность, которую этот мир
   показывает целиком, и она же честнее по смыслу: камень ставят нарочно.
   Мерило прежнее — человек: ходок 26 px, плита ему по грудь. */
const TRACE_SC=11;
function traceDraw(tr,camx,camy,p){
  const t=traceHere();if(!t)return;
  if(t.x==null)t.x=traceSpotX(tr,t);
  const x=t.x-camx;
  if(x<-90||x>W+90)return;
  const y=groundAt(tr,t.x)-camy;
  const pal=p.T.pal;
  /* ЧЕТВЁРТЫЙ ПРОХОД. Плита читалась вывеской: ровный прямоугольник и яркая
     светлая полка сверху, которая выглядела дощатой крышей другого материала.
     Камень стал ниже (ходоку по грудь, а не выше головы), кромка — фаской
     того же камня, а не белым, и силуэт у каждого свой: рвань выводится из
     руки, поэтому две плиты рядом не близнецы. */
  const HS=30, HW=13;
  if(!t.j){const r=rng(traceHashOf((t.h||"")+"|"+(t.i||"")+"|плита"));t.j=[r(),r(),r(),r(),r()];}
  const j=t.j;
  const body="rgb("+pal[1].map(v=>Math.round(v*.62)).join(",")+")";
  const lite="rgb("+pal[3].map((v,i)=>Math.round((v*.45+pal[1][i]*.55)*1.1)).join(",")+")";
  const dark="rgba("+pal[0].map(v=>Math.round(v*.28)).join(",")+",.95)";
  ctx.save();
  ctx.translate(x,y);
  /* тень у подножия: без неё плита висит */
  ctx.beginPath();ctx.ellipse(2,0,HW*1.5,4,0,0,6.283);
  ctx.fillStyle="rgba(0,0,0,.34)";ctx.fill();
  /* сама плита: камень ставили руками — верх сколот, бока не параллельны */
  const tl=-HS*(.62+j[0]*.34), tr2=-HS*(.58+j[1]*.38);
  ctx.beginPath();
  ctx.moveTo(-HW*(.86+j[2]*.3),2);
  ctx.lineTo(-HW*(.68+j[3]*.34),tl);
  ctx.lineTo(-HW*(.36-j[4]*.5),-HS);
  ctx.lineTo(HW*(.5+j[4]*.42),tr2);
  ctx.lineTo(HW*(.8+j[0]*.28),2);
  ctx.closePath();
  ctx.fillStyle=body;ctx.fill();
  ctx.strokeStyle="rgba(0,0,0,.45)";ctx.lineWidth=1;ctx.stroke();
  ctx.save();ctx.clip();
  /* фаска: тот же камень, чуть светлее, узкой полосой — не полка и не крыша */
  ctx.beginPath();ctx.moveTo(-HW*.78,tl);ctx.lineTo(-HW*.16,-HS-1);ctx.lineTo(HW*.62,tr2);
  ctx.lineTo(HW*.62,tr2+3.4);ctx.lineTo(-HW*.16,-HS+3.4);ctx.lineTo(-HW*.78,tl+3.4);ctx.closePath();
  ctx.fillStyle=lite;ctx.globalAlpha=.42;ctx.fill();ctx.globalAlpha=1;
  /* правая щека в тени — плита получает толщину */
  ctx.beginPath();ctx.moveTo(HW*.3,tr2);ctx.lineTo(HW,2);ctx.lineTo(HW*.3,2);ctx.closePath();
  ctx.fillStyle="rgba(0,0,0,.26)";ctx.fill();
  /* трещина от скола вниз: камень битый, а не пиленый */
  ctx.beginPath();ctx.moveTo(-HW*(.3-j[2]*.4),tl+2);
  ctx.lineTo(-HW*(.1-j[3]*.5),tl+HS*.34);ctx.lineTo(-HW*(.34-j[1]*.4),2);
  ctx.strokeStyle="rgba(0,0,0,.2)";ctx.lineWidth=.9;ctx.stroke();
  ctx.restore();
  /* знак: прорез по лицу — тёмная борозда и подсвеченная нижняя кромка */
  ctx.save();ctx.translate(-1,-HS*.45);
  ctx.translate(0,1);traceDrawMark(t.m,TRACE_SC,"rgba(255,255,255,.22)",3);
  ctx.translate(0,-1);traceDrawMark(t.m,TRACE_SC,dark,2.6);
  ctx.restore();
  /* Вещь рядом. Второй проход: пять одинаковых пилюль в ряд читались пуговицами,
     а не грузом. Мешков всегда не больше трёх — счёт единиц игрок видит строкой,
     а глазу нужна КУЧА: разный размер, перевязь у горловины, общая тень. */
  const n=Math.max(1,Math.min(TRACE_MAX_UNITS,t.n|0));
  const bags=Math.min(3,n);
  const rc=(RES[t.r]&&RES[t.r].col)||"#b4b4b4";
  const hx=26;
  ctx.save();ctx.translate(hx,0);
  ctx.beginPath();ctx.ellipse(0,0,7+bags*3.6,3.6,0,0,6.283);
  ctx.fillStyle="rgba(0,0,0,.34)";ctx.fill();
  for(let i=0;i<bags;i++){
    const a=bags>1?(i/(bags-1)-.5)*2:0;
    /* мешок, а не кочан: низ плоский — он стоит на земле, — бока обвисают,
       горловина стянута и торчит хвостом. Блик по левой щеке узкий и слабый */
    const r=6.4-Math.abs(a)*1.5, bx=a*(3+bags*2.4);
    ctx.save();ctx.translate(bx,0);
    ctx.beginPath();
    ctx.moveTo(-r,0);
    ctx.bezierCurveTo(-r*1.12,-r*.7,-r*.72,-r*1.16,-r*.26,-r*1.3);
    ctx.lineTo(r*.26,-r*1.3);
    ctx.bezierCurveTo(r*.72,-r*1.16,r*1.12,-r*.7,r,0);
    ctx.closePath();
    ctx.fillStyle=rc;ctx.fill();
    ctx.strokeStyle="rgba(0,0,0,.55)";ctx.lineWidth=.9;ctx.stroke();
    ctx.beginPath();ctx.moveTo(-r*.36,-r*1.24);ctx.lineTo(r*.36,-r*1.24);
    ctx.strokeStyle="rgba(0,0,0,.5)";ctx.lineWidth=1.2;ctx.stroke();
    ctx.beginPath();ctx.moveTo(-r*.1,-r*1.3);ctx.lineTo(r*.12,-r*1.62);
    ctx.strokeStyle="rgba(0,0,0,.45)";ctx.lineWidth=1;ctx.stroke();
    ctx.beginPath();ctx.moveTo(-r*.62,-r*.16);ctx.bezierCurveTo(-r*.86,-r*.6,-r*.6,-r*.95,-r*.28,-r*1.1);
    ctx.strokeStyle="rgba(255,255,255,.18)";ctx.lineWidth=.9;ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
  ctx.restore();
}
