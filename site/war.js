/* ДРЕЙФ — летопись войны вне игры (M411).
 *
 * Карта на сайте считает войну ТЕМ ЖЕ кодом, что и клиенты игры: build.ps1
 * склеивает этот заголовок с модулями `01-core`, `03a-hull-maker` (таблица
 * изготовителей — это и есть шесть держав), `12al-powers`, `12am-chron*`,
 * `12at-vote`, `12av-boss`, `12aw-circ`, `12b0-fx-pow`, `14b-war-net` в
 * `site/war.js`. Ничего здесь не переписано: летопись — чистая функция от
 * зерна и номера сводки, значит страница и игра обязаны сходиться байт в байт,
 * и единственный способ этого добиться — не иметь второго кода.
 *
 * Модули игры ждут пару глобальных вещей, которых на странице нет. Здесь —
 * ровно они и ничего сверх: `G` с пустыми настройками (летопись читает
 * `G.opts.wave` и `G.warSeason`, «Ялта» кэширует в `G._yalta`), холст `ctx`
 * для эмблем (страница подставляет свой перед рисованием), и молчащие
 * `say/tell/logAdd/sfx/earn` — чтобы случайный вызов из общего кода не ронял
 * страницу, а честно ничего не делал. */
"use strict";
const G={opts:{},sx:0,sy:0,credits:0,cargo:{},crew:[],warSeason:null};
let ctx=null;
const NPC_SHIPS={};
function say(){}
function tell(){}
function logAdd(){}
function sfx(){}
function earn(){}

"use strict";
/* Версия игры. Одна на всё: заставка, журнал, патчноуты (PATCHNOTES.md).
   К формату сохранения отношения не имеет — тот навсегда v:4. */
const VER="0.407.1";
/* ══════════════ математика ══════════════ */
const TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const lerp=(a,b,t)=>a+(b-a)*t;
function hashi(x,y,s){
  let h=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(s|0,1442695041);
  h=Math.imul(h^(h>>>13),1274126177);
  return (h^(h>>>16))>>>0;
}
const h01=(x,y,s)=>hashi(x,y,s)/4294967296;
function rng(seed){let a=seed>>>0;return function(){a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
const pick=(arr,r)=>arr[Math.floor(r()*arr.length)];
/* ── русское согласование числительных (полировочный круг) ──
   По коду жило четыре самодельных склонения, и три врали: «1 прыжка»,
   «1 станция получили», стаж «21 ЛЕТ». Одна честная функция на всех:
   pl3(21,"прыжок","прыжка","прыжков") → «прыжок»; 11–14 — всегда много. */
function pl3(n,one,few,many){
  const m=Math.abs(n)%100,d=m%10;
  if(m>=11&&m<=14)return many;
  if(d===1)return one;
  if(d>=2&&d<=4)return few;
  return many;
}
function noise1(x,s){const i=Math.floor(x),f=x-i,t=f*f*(3-2*f);return lerp(h01(i,0,s),h01(i+1,0,s),t);}
function fbm1(x,s,oct){let v=0,a=.5,f=1,n=0;oct=oct||5;
  for(let i=0;i<oct;i++){v+=a*noise1(x*f,s+i*131);n+=a;a*=.5;f*=2;}return v/n;}
function noise2(x,y,s){
  const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;
  const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  return lerp(lerp(h01(xi,yi,s),h01(xi+1,yi,s),u),lerp(h01(xi,yi+1,s),h01(xi+1,yi+1,s),u),v);
}
function fbm2(x,y,s,oct){let v=0,a=.5,f=1,n=0;oct=oct||5;
  for(let i=0;i<oct;i++){v+=a*noise2(x*f,y*f,s+i*97);n+=a;a*=.5;f*=2;}return v/n;}
/* ── синий шум: плитка порогов 64×64 (M250, DESIGN-craft §7) ──
   У белого шума есть низкие частоты — комки: точки сбиваются в пятна, и на
   ровной заливке это читается грязью. Синий комков не имеет ПО ПОСТРОЕНИЮ.
   Метод — последовательное заполнение «в самую большую пустоту»: каждая
   следующая точка ставится туда, где суммарная энергия уже поставленных
   минимальна (гаусс по тору, σ≈1.9), её ранг запоминается. Порог по рангу
   отбирает равномерную россыпь любой плотности. Считается один раз, лениво:
   ~17 млн сравнений, десятки миллисекунд. Детерминирован — открытка обязана
   рисоваться попиксельно одинаково. */
let BLUE_TAB=null;
function blueNoise(){
  if(BLUE_TAB)return BLUE_TAB;
  const S=64,N=S*S,E=new Float64Array(N),rank=new Float32Array(N),
        taken=new Uint8Array(N);
  const r=rng(hashi(0xB1DE,0x0157,1));
  for(let i=0;i<N;i++)E[i]=r()*1e-6;          /* посев рвёт ничьи, не форму */
  const R=6,K=[];
  for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++)
    K.push([dx,dy,Math.exp(-(dx*dx+dy*dy)/(2*1.9*1.9))]);
  for(let n=0;n<N;n++){
    let bi=0,be=Infinity;
    for(let i=0;i<N;i++)if(!taken[i]&&E[i]<be){be=E[i];bi=i;}
    taken[bi]=1;rank[bi]=n/N;
    const bx=bi%S,by=(bi/S)|0;
    for(const q of K)E[((by+q[1]+S)%S)*S+((bx+q[0]+S)%S)]+=q[2];
  }
  return BLUE_TAB=rank;
}
/* Печётся заранее, в простое заставки: холодная выпечка стоит 77 мс (замер
   M251), и лениво она пришлась бы на ПЕРВЫЙ игровой кадр — спотык ровно в
   момент СТАРТ. Полсекунды после load хватает, чтобы не мешать открытию. */
if(typeof addEventListener==="function")
  addEventListener("load",()=>setTimeout(blueNoise,500));
/* ── поле направлений (M253, DESIGN-craft §2/§5) ──
   Угол потока в точке. Весь шум игры изотропен — у него нет направления, и
   волокно, царапину, залегание из него не получить в принципе. Поле берёт
   не сам fbm, а его ИЗОЛИНИИ: градиент повёрнут на четверть, линии тока идут
   вдоль изолиний — не пересекаются и текут согласованно, как причёсанные.
   sc — крупность (1/период в мировых px). Считается на точку при выпечке
   тайла или чанка, в кадре его звать незачем. */
function dirAt(x,y,s,sc){
  const f=(sc==null?1/240:sc),E=6;
  const a=fbm2((x+E)*f,y*f,s,4)-fbm2((x-E)*f,y*f,s,4);
  const b=fbm2(x*f,(y+E)*f,s,4)-fbm2(x*f,(y-E)*f,s,4);
  return Math.atan2(-a,b);
}
/* Разница углов, кратчайшей дугой. Прежняя формула — ((a-b+3π)%TAU)-π — верна
   ровно до тех пор, пока a-b не меньше -3π: остаток в JS берёт знак делимого,
   и на больших отрицательных разностях ответ уезжает и по знаку, и за пределы
   полуоборота. Курс корабля нигде не сворачивался и копился оборотами — в живом
   сохранении он дорос до -500 рад, и доворот вектора скорости к носу принялся
   разворачивать скорость в противоположную сторону. Корабль дёргался на месте
   под полной тягой и жёг топливо: ни ошибки, ни просадки кадров. */
const angWrap=x=>{const d=x%TAU;return d>Math.PI?d-TAU:(d<-Math.PI?d+TAU:d);};
const angDiff=(a,b)=>angWrap(a-b);

/* ══════════════ имена ══════════════ */
const S1=["ка","зе","вор","ти","мел","сар","ква","ар","ни","кси","лу","дра","он","пи","ха","ци","ур","гал","об","векс","сол","ит","кор","энт","ра","тау","ней","ом"];
const S2=["нис","тар","он","экс","ур","ал","иос","ат","ин","ора","икс","ун","эш","ара","орн","ил","аде","ий","от","ис","эль","ум"];
const ROMAN=["I","II","III","IV","V","VI","VII","VIII","IX","X"];
function genName(r){let s=pick(S1,r);if(r()<.55)s+=pick(S1,r);s+=pick(S2,r);
  return s[0].toUpperCase()+s.slice(1);}

/* ══════════════ удалённость и настрой сектора ══════════════ */
function sysDanger(sx,sy){return clamp(Math.hypot(sx,sy)/40,0,1);}
function sysJitter(gx,gy){
  const jr=rng(hashi(gx,gy,55551));
  const a=jr()*TAU,rad=jr()*.42;
  return [Math.cos(a)*rad,Math.sin(a)*rad];
}
const DESC_MOOD=[
  {w:["тихий","забытый","сонный"],ok:s=>!s.station&&!s.belt},
  {w:["оживлённый","обжитой","многообещающий"],ok:s=>!!(s.station&&s.belt)},
  {w:["пограничный","неспокойный","дикий"],ok:s=>sysDanger(s.sx,s.sy)>.55},
  {w:["разведанный","картографированный"],ok:s=>!!s.station&&sysDanger(s.sx,s.sy)<=.55}
];
const DESC_TAIL=["сектор","рубеж","участок","угол галактики","карман пространства","закоулок"];
function genDesc(r,sys){
  const cands=DESC_MOOD.filter(m=>m.ok(sys));
  const pool=cands.length?cands:DESC_MOOD;
  const mood=pick(pick(pool,r).w,r);
  const tail=pick(DESC_TAIL,r);
  const bits=[mood[0].toUpperCase()+mood.slice(1)+" "+tail];
  const kinds=sys.planets.map(p=>p.T.ru).filter((v,i,a)=>a.indexOf(v)===i);
  if(kinds.length)bits.push(kinds.length+" "+pl3(kinds.length,"тип","типа","типов")+" миров: "+kinds.join(", "));
  if(sys.belt)bits.push("пояс богат "+sys.belt.res.map(k=>RES[k].ru.toLowerCase()).join(", "));
  if(sys.station)bits.push(sys.station.kind.toLowerCase());
  return bits.join(" · ");
}

/* ══════════════ у всего есть изготовитель (M369, §19.1, §19.4) ══════════════
   Класс отвечает «кто это»: курьер, рудовоз, фрегат. Изготовитель отвечает на
   другой вопрос — «чей»: курьер Орднунга и курьер Коммуны одного класса и
   разной породы. Это ВТОРАЯ ось генератора, поперечная классу, и она не
   покраска: у изготовителя своя грамматика формы.

   Восемь измерений §19.4, и первые три обязаны читаться силуэтом:
     1 закон профиля — как строится кривая полуширины;
     2 набор схем    — какие планеры класс вправе взять у этого изготовителя;
     3 приметы       — то, что ВСЕГДА торчит за обвод;
     4 стык          — чем навеска встречается с обшивкой;
     5 поверхность   — грунт, полоса, лак, износ;
     6 метки и огни  — номер, логотип, имя, вымпел, солнце, глиф;
     7 подпись тяги  — факел и след (нулевого следа нет: обрубок в четверть
                       длины на ходу читается как «следа не оставляет»);
     8 звук и крен   — тембр и то, как корабль ложится в поворот.

   Восьмое нарочно мало: повадка остаётся классовой, изготовитель меняет КРЕН
   и ЗВУК, но никогда числа, за которые игрок заплатил.

   Шести хватает, седьмого не будет (§20, settled). «Яхта» — класс, а не
   изготовитель: яхта Коммуны и яхта Компании различаются этой же таблицей. */
const HULL_MAKER={
  gt:{ru:"ГЛАВТРАССА",ab:"ГТ",short:"ГТ",
    bw:1.06, len:.97,  prof:"step",    forms:null,
    out:["hook","rad"],            joint:"clamp",
    ground:[220,213,194],tint:.10,stripe:1,gloss:0,  wear:1.3,
    mark:"num",  lights:"amber",
    eng:{col:[255,168,86], w:1.25,trail:1,   soot:1},
    snd:{f:70, bank:1},
    note:"по ГОСТу: ступени, хомут, номер и «изделие»"},
  co:{ru:"Компания",ab:"КП",short:"КП",
    bw:.90,  len:1.04, prof:"capsule", forms:["twin","swept"],
    out:["logofin","runline"],     joint:"flush",
    ground:[246,247,249],tint:.06,stripe:2,gloss:1,  wear:.5,
    mark:"logo", lights:"run",
    eng:{col:[150,205,255],w:.85, trail:.5, twin:1},
    snd:{f:150,bank:1.35},
    note:"белое и гладкое, логотип во весь борт, бегущая строка"},
  or:{ru:"Орднунг",ab:"ОР",short:"ОР",
    bw:1.02, len:1.12, prof:"chamfer", forms:["slab","boxed","twin"],
    out:["plinth","comb"],         joint:"flange",
    ground:[138,144,152],tint:.02,stripe:0,gloss:0,  wear:.8, ribs:1,
    mark:"stencil",lights:"none",
    eng:{col:[240,248,255],w:.6,  trail:.25},
    snd:{f:96, bank:0},
    note:"прямые грани, гребень рёбер, номера по трафарету и ни одной лишней линии"},
  km:{ru:"Коммуна",ab:"КМ",short:"КМ",
    bw:.84,  len:1.18, prof:"swan",    forms:["swept","delta"],
    out:["bowsprit","band","pennant"],joint:"fillet",
    ground:[176,204,234],tint:.18,stripe:1,gloss:.6, wear:.9,
    mark:"name", lights:"band",
    eng:{col:[190,150,255],w:1.1, trail:1.5},
    snd:{f:120,bank:1.5},
    note:"лебединый обвод, бушприт, лента окон и вымпел; имя, а не номер"},
  ra:{ru:"Рассвет",ab:"РС",short:"РС",
    bw:1.28, len:.94,  prof:"modules", forms:["boxed","twin","slab"],
    out:["tanks","braces"],        joint:"weld",
    ground:[198,150,74], tint:.20,stripe:0,gloss:0,  wear:1.6,
    mark:"sun",  lights:"lantern",
    eng:{col:[255,214,120],w:1.15,trail:1.2,spark:1},
    snd:{f:58, bank:1.1},
    note:"сваренный из модулей, баки наружу, охра и чёрное, имя от руки"},
  hf:{ru:"Хай-Фронт",ab:"ХФ",short:"ХФ",
    bw:.72,  len:1.16, prof:"spindle", forms:["trident","xwing"],
    out:["array","under"],         joint:"gap",
    ground:[206,216,224],tint:.05,stripe:0,gloss:.35,wear:.6,
    mark:"glyph",lights:"under",
    eng:{col:[130,255,236],w:.5,  trail:.3, pulse:1},
    snd:{f:210,bank:1.8},
    note:"веретено, антенны длиннее корпуса, свет из-под обшивки, один глиф"}
};
const MAKER_KEYS=Object.keys(HULL_MAKER);
/* ── чей это корпус ──
   Каталог ГЛАВТРАССЫ (`SHIPS`) и её же флот — нулевой изготовитель: игрок
   рождается здесь, и его корабль по умолчанию отсюда (§7.5: «ты по рождению
   уже тут»). Всё остальное — уникальные корпуса, пиратские, чужие — берёт
   изготовителя из своего же seed, один раз и навсегда: `by` остаётся в записи
   корабля, а значит переживает и кэш, и сохранение. */
function makerOf(id,S){
  S=S||(id&&shipData(id));
  if(!S)return "gt";
  if(S.by&&HULL_MAKER[S.by])return S.by;
  if(id&&(SHIPS[id]||(typeof FLEET!=="undefined"&&FLEET&&FLEET[id])))return S.by="gt";
  return S.by=MAKER_KEYS[hashi(S.seed||1,0x4B17,0x11)%MAKER_KEYS.length];
}
function makerRow(by){return HULL_MAKER[by]||HULL_MAKER.gt;}
/* порода вещи, у которой нет записи корабля: баржа, тело станции, купол */
function makerBySeed(seed){return MAKER_KEYS[hashi(seed|0,0x4B17,0x11)%MAKER_KEYS.length];}
function makerRu(by){return makerRow(by).ru;}
/* схемы планера: изготовитель сужает выбор класса, но не отменяет его —
   если пересечение пусто, класс сильнее (рудовоз Хай-Фронта существует) */
function makerForms(by,forms){
  const M=makerRow(by);
  if(!M.forms)return forms;
  const keep=forms.filter(f=>M.forms.indexOf(f)>=0);
  /* пустое пересечение — не повод отменить грамматику: рудовоз Хай-Фронта
     существует и собран по-хайфронтовски. Класс остаётся в пропорциях, схема
     принадлежит изготовителю (§19.4, измерение 2) */
  return keep.length?keep:M.forms;
}
/* ── закон профиля ──
   Работает поверх уже построенной кривой полуширины: класс задал пропорции,
   изготовитель задаёт ХАРАКТЕР этой кривой. Меняются только полуширины —
   длина и габарит остаются классовыми, иначе изготовитель начал бы менять
   числа корабля. */
function makerProfile(by,prof,r){
  const M=makerRow(by),N=prof.length-1;
  if(N<2)return prof;
  const w0=prof.map(p=>p[1]);
  const wmax=Math.max.apply(null,w0);
  const q=r||Math.random;
  if(M.prof==="step"){
    /* ступени: не кривая вовсе, а полки. Нос — две узкие, мидель — короб во
       всю ширину, корма — две пониже. Плавных переходов нет ни одного: борт
       «по ГОСТу» набирается из готовых секций, и это видно */
    const b0=.30+q()*.06, b1=.60+q()*.06;
    for(let i=0;i<=N;i++){
      const t=i/N;
      let w;
      if(t<b0)      w=wmax*(t<b0*.5?.40:.66);
      else if(t<b1) w=wmax*1.12;      /* короб амидшип шире всего корпуса */
      else          w=wmax*(t<b1+.18?.72:.50);
      prof[i][1]=Math.max(.7,w);
    }
  }else if(M.prof==="capsule"){
    /* капсула: ровная середина и скруглённые концы — таблетка, а не веретено.
       Ровный участок и отличает её от лебедя Коммуны: у капсулы мидель длинный
       и лежит посередине, у лебедя он один и сдвинут к корме */
    for(let i=0;i<=N;i++){
      const t=i/N;
      const w=t<.20?lerp(.34,1,Math.pow(t/.20,.7)):
              (t>.80?lerp(1,.44,Math.pow((t-.80)/.20,1.3)):1);
      prof[i][1]=Math.max(.7,wmax*w);
    }
  }else if(M.prof==="chamfer"){
    /* прямые участки и фаски: три узла, между ними — отрезок, без кривой */
    const kn=[0,.30+q()*.08,.62+q()*.08,1];
    const kw=[w0[0],wmax*(.92+q()*.08),wmax*(.86+q()*.1),w0[N]];
    for(let i=0;i<=N;i++){
      const t=i/N;
      let s=0;while(s<kn.length-2&&t>kn[s+1])s++;
      const u=(t-kn[s])/Math.max(1e-6,kn[s+1]-kn[s]);
      prof[i][1]=Math.max(.7,lerp(kw[s],kw[s+1],u));
    }
  }else if(M.prof==="swan"){
    /* лебедь: узкая талия у носа, единственный мидель ЗА серединой и долгий
       тонкий сход к корме. Ровного участка нет нигде — этим он и не капсула */
    const waist=.26+q()*.06, belly=.62+q()*.06;
    for(let i=0;i<=N;i++){
      const t=i/N;
      const dip=1-.55*Math.exp(-Math.pow((t-waist)/.10,2));
      const bell=Math.exp(-Math.pow((t-belly)/.30,2));
      prof[i][1]=Math.max(.55,wmax*(.18+.82*bell)*dip);
    }
  }else if(M.prof==="modules"){
    /* модули: три-пять блоков разной ширины, встык, со швом между ними */
    const n=3+Math.floor(q()*3),cut=[];
    for(let k=0;k<n;k++)cut.push(wmax*(.55+q()*.45));
    for(let i=0;i<=N;i++){
      const t=i/N,k=Math.min(n-1,Math.floor(t*n));
      prof[i][1]=Math.max(.7,cut[k]);
    }
  }else if(M.prof==="spindle"){
    /* веретено: симметричный эллипс без выемок вовсе */
    for(let i=0;i<=N;i++){
      const t=i/N;
      prof[i][1]=Math.max(.6,wmax*Math.sqrt(Math.max(.03,1-Math.pow(t*2-1,2)))*.98);
    }
  }
  return prof;
}
/* ── приметы: то, что торчит за обвод ──
   Считаются от габаритов корпуса, а не рисуются на глаз: примета обязана
   выходить ЗА силуэт, иначе на восьми пикселях её нет (§0 закон 7). */
function makerOuts(by,nose,tail,bw,len,seed){
  const M=makerRow(by),out=[],r=rng(hashi(seed||1,0x0DE,7));
  for(const k of (M.out||[])){
    if(k==="hook")      out.push({k,x:tail-len*.16,y:0,l:len*.16,w:bw*.7});
    else if(k==="rad")  out.push({k,x:lerp(nose*.1,tail*.6,.5),y:bw*1.32,l:len*.26,w:bw*.30});
    else if(k==="logofin")out.push({k,x:lerp(nose*.42,tail*.3,r()),y:bw*1.9,l:len*.24,w:bw*.7});
    else if(k==="runline")out.push({k,x:nose*.55,y:bw*1.02,l:len*.62,w:bw*.12});
    else if(k==="plinth") out.push({k,x:nose*(.30+r()*.14),y:0,l:len*.14,w:bw*2.2});
    else if(k==="comb")   out.push({k,x:nose*.34,y:0,l:len*.62,w:bw*2.3});
    else if(k==="bowsprit")out.push({k,x:nose,y:0,l:len*.22,w:bw*.34});
    else if(k==="band")   out.push({k,x:nose*.42,y:bw*.9,l:len*.5,w:bw*.30});
    else if(k==="pennant")out.push({k,x:tail+len*.04,y:0,l:len*.16,w:bw*.7});
    else if(k==="tanks")  out.push({k,x:lerp(nose*.2,tail*.5,.4+r()*.2),y:bw*1.7,l:len*.3,w:bw*.9});
    else if(k==="braces") out.push({k,x:lerp(nose*.3,tail*.4,r()),y:bw*1.3,l:len*.16,w:bw*.5});
    else if(k==="array")  out.push({k,x:nose*.3,y:bw*1.5,l:len*1.06,w:bw*.16});
    else if(k==="under")  out.push({k,x:lerp(nose*.5,tail*.6,.5),y:bw*1.06,l:len*.5,w:bw*.16});
  }
  return out;
}
/* ── стык: чем навеска встречается с обшивкой (§19.4, измерение 4) ──
   Одна короткая фигура в точке, где деталь садится на борт. Дёшево, а породу
   держит: у Орднунга фланец с болтами, у Рассвета сварной шов, у Хай-Фронта
   тёмный зазор — деталь висит в пикселе от корпуса. */
function makerJoint(h,x,y,s){
  const J=makerRow(h.by).joint;
  const u=Math.max(.5,h.bw*.24);
  ctx.save();
  if(J==="clamp"){
    ctx.strokeStyle=rgba(h.iron,.9);ctx.lineWidth=.55;
    ctx.beginPath();ctx.rect(x-u*.7,y-u*.5*s-(s>0?0:u*.5),u*1.4,u*.5);ctx.stroke();
  }else if(J==="flush"){
    ctx.strokeStyle=rgba(h.lite,.28);ctx.lineWidth=.4;
    ctx.beginPath();ctx.moveTo(x-u,y);ctx.quadraticCurveTo(x,y-u*.4*s,x+u,y);ctx.stroke();
  }else if(J==="flange"){
    ctx.fillStyle=rgba(h.iron,.95);
    ctx.fillRect(x-u*.8,y-u*.22,u*1.6,u*.44);
    ctx.fillStyle=rgba(h.lite,.5);
    for(let k=0;k<4;k++)ctx.fillRect(x-u*.62+k*u*.4,y-u*.1,u*.14,u*.2);
  }else if(J==="fillet"){
    ctx.strokeStyle=rgba(h.lite,.35);ctx.lineWidth=.5;
    ctx.beginPath();ctx.arc(x,y,u*.8,0,Math.PI,s>0);ctx.stroke();
  }else if(J==="weld"){
    ctx.strokeStyle="rgba(40,32,26,.75)";ctx.lineWidth=.7;
    ctx.beginPath();
    for(let k=0;k<5;k++)ctx.lineTo(x-u+k*u*.5,y+(k&1?u*.16:-u*.16)*s);
    ctx.stroke();
  }else if(J==="gap"){
    ctx.strokeStyle="rgba(0,0,0,.7)";ctx.lineWidth=.8;
    ctx.beginPath();ctx.moveTo(x-u*.9,y);ctx.lineTo(x+u*.9,y);ctx.stroke();
  }
  ctx.restore();
}
/* ── приметы и огни на корпусе ──
   Рисуется после тела и до общего света: примета — часть корабля, а не
   наклейка поверх кадра. */
function makerDraw(h){
  const M=makerRow(h.by),u=h.bw;
  for(const o of (h.outs||[])){
    const sides=(o.k==="hook"||o.k==="plinth"||o.k==="comb"||o.k==="bowsprit"||o.k==="pennant")?[0]:[1,-1];
    for(const s of sides){
      const y=o.y*(s||1);
      ctx.save();
      if(o.k==="hook"){
        /* буксирный крюк: ГЛАВТРАССА возит чужое, и крюк у неё всегда */
        ctx.strokeStyle=rgba(h.iron,1);ctx.lineWidth=Math.max(.6,u*.18);
        ctx.beginPath();ctx.moveTo(o.x+o.l,0);ctx.lineTo(o.x,0);
        ctx.arc(o.x,o.w*.3,o.w*.3,-Math.PI/2,Math.PI*.9);ctx.stroke();
      }else if(o.k==="rad"){
        ctx.fillStyle=rgba(h.radm,1);ctx.strokeStyle=rgba(h.iron,.8);ctx.lineWidth=.4;
        ctx.beginPath();ctx.rect(o.x-o.l*.5,y-o.w*.5*(s||1)-(s>0?0:o.w*.5),o.l,o.w*.5);
        ctx.fill();ctx.stroke();
        makerJoint(h,o.x,y*.72,s||1);
      }else if(o.k==="logofin"){
        /* киль с логотипом: у Компании он и есть вывеска */
        ctx.fillStyle=rgba(h.col,1);ctx.strokeStyle=rgba(h.dark,.8);ctx.lineWidth=.45;
        ctx.beginPath();
        ctx.moveTo(o.x+o.l*.5,y*.62);ctx.lineTo(o.x-o.l*.5,y);
        ctx.lineTo(o.x-o.l*.1,y*1.02);ctx.closePath();ctx.fill();ctx.stroke();
        ctx.fillStyle="rgba(70,130,220,.95)";
        ctx.beginPath();ctx.arc(o.x-o.l*.14,y*.86,Math.max(.5,u*.16),0,TAU);ctx.fill();
        makerJoint(h,o.x,y*.6,s||1);
      }else if(o.k==="runline"){
        ctx.fillStyle="rgba(120,190,255,.55)";
        ctx.fillRect(o.x-o.l,y-o.w*.5,o.l,o.w);
        ctx.fillStyle="rgba(200,235,255,.9)";
        for(let k=0;k<5;k++)ctx.fillRect(o.x-o.l+k*o.l*.2+((G.t*.6)%(o.l*.2)),y-o.w*.4,o.l*.05,o.w*.8);
      }else if(o.k==="plinth"){
        /* тумба под турель: Орднунг возит её даже на грузовике */
        ctx.fillStyle=rgba(h.body,1);ctx.strokeStyle=rgba(h.iron,.9);ctx.lineWidth=.5;
        ctx.beginPath();ctx.rect(o.x-o.l*.5,-o.w*.5,o.l,o.w);ctx.fill();ctx.stroke();
        ctx.strokeStyle=rgba(h.iron,1);ctx.lineWidth=Math.max(.6,u*.16);
        ctx.beginPath();ctx.moveTo(o.x,0);ctx.lineTo(o.x+o.l*.9,0);ctx.stroke();
        makerJoint(h,o.x-o.l*.5,-o.w*.5,1);
      }else if(o.k==="comb"){
        /* гребень рёбер по хребту: каждые восемь пикселей, ровно */
        ctx.strokeStyle=rgba(h.iron,.85);ctx.lineWidth=.5;
        const n=Math.max(4,Math.round(o.l/Math.max(2,u*.7)));
        for(let k=0;k<n;k++){
          const x=o.x-o.l*(k/n);
          ctx.beginPath();ctx.moveTo(x,-o.w*.5);ctx.lineTo(x,o.w*.5);ctx.stroke();
        }
      }else if(o.k==="bowsprit"){
        /* бушприт: штанга ВПЕРЁД, ни у кого больше её нет. Сходит на конус и
           кончается шаром — иначе на листе это была игла шприца */
        ctx.strokeStyle=rgba(h.lite,.95);ctx.lineWidth=Math.max(1,o.w);
        ctx.beginPath();ctx.moveTo(o.x,0);ctx.lineTo(o.x+o.l*.7,0);ctx.stroke();
        ctx.lineWidth=Math.max(.6,o.w*.55);
        ctx.beginPath();ctx.moveTo(o.x+o.l*.7,0);ctx.lineTo(o.x+o.l,0);ctx.stroke();
        ctx.fillStyle=rgba(h.lite,.85);
        ctx.beginPath();ctx.arc(o.x+o.l,0,Math.max(.6,o.w*.8),0,TAU);ctx.fill();
        /* и растяжки к скулам: без них штанга висит в пустоте */
        ctx.strokeStyle=rgba(h.lite,.45);ctx.lineWidth=.4;
        for(const q of [1,-1]){
          ctx.beginPath();ctx.moveTo(o.x+o.l*.7,0);ctx.lineTo(o.x-o.l*.3,q*h.bw*.55);ctx.stroke();
        }
      }else if(o.k==="band"){
        ctx.fillStyle="rgba(190,230,255,.5)";
        ctx.fillRect(o.x-o.l,y-o.w*.5,o.l,o.w*.6);
        ctx.strokeStyle=rgba(h.lite,.5);ctx.lineWidth=.35;
        ctx.strokeRect(o.x-o.l,y-o.w*.5,o.l,o.w*.6);
      }else if(o.k==="pennant"){
        /* вымпел: у Коммуны он вместо номера */
        ctx.strokeStyle=rgba(h.lite,.7);ctx.lineWidth=.45;
        ctx.beginPath();ctx.moveTo(o.x,0);ctx.lineTo(o.x-o.l,0);ctx.stroke();
        ctx.fillStyle="rgba(226,238,255,.9)";
        ctx.beginPath();
        ctx.moveTo(o.x-o.l,-o.w*.34);ctx.lineTo(o.x-o.l*.45,0);
        ctx.lineTo(o.x-o.l,o.w*.34);ctx.closePath();ctx.fill();
      }else if(o.k==="tanks"){
        /* баки наружу: у Рассвета внутренности снаружи, и это его порода */
        ctx.fillStyle=rgba(h.foil,1);ctx.strokeStyle="rgba(40,32,26,.8)";ctx.lineWidth=.5;
        ctx.beginPath();ctx.rect(o.x-o.l*.5,y-o.w*.5*(s||1)-(s>0?0:o.w*.5),o.l,o.w*.5);
        ctx.fill();ctx.stroke();
        makerJoint(h,o.x,y*.7,s||1);
      }else if(o.k==="braces"){
        ctx.strokeStyle=rgba(h.iron,.95);ctx.lineWidth=Math.max(.5,u*.12);
        ctx.beginPath();
        ctx.moveTo(o.x-o.l*.5,u*.6*(s||1));ctx.lineTo(o.x+o.l*.5,y);
        ctx.moveTo(o.x+o.l*.5,u*.6*(s||1));ctx.lineTo(o.x-o.l*.5,y);
        ctx.stroke();
      }else if(o.k==="array"){
        /* антенны длиннее корпуса (§19.4): но это МАЧТА с траверсами и
           тарелкой на конце, а не волосок во весь лист — тонкая линия длиной
           в полтора корпуса читалась царапиной на снимке, а не антенной */
        ctx.strokeStyle=rgba(h.lite,.95);ctx.lineWidth=Math.max(.9,o.w);
        ctx.beginPath();
        ctx.moveTo(o.x-o.l*.5,y*.5);ctx.lineTo(o.x+o.l*.5,y*.5);ctx.stroke();
        ctx.lineWidth=Math.max(.6,o.w*.7);
        for(let k=1;k<5;k++){
          const x=o.x-o.l*.5+o.l*(k/5);
          ctx.beginPath();ctx.moveTo(x,y*.5-u*(.34+k*.06));ctx.lineTo(x,y*.5+u*(.34+k*.06));ctx.stroke();
        }
        ctx.strokeStyle=rgba(h.lite,.85);ctx.lineWidth=Math.max(.5,o.w*.6);
        ctx.beginPath();ctx.arc(o.x+o.l*.5,y*.5,u*.5,-1.2,1.2);ctx.stroke();
      }else if(o.k==="under"){
        /* свет из-под обшивки: не огонь и не окно — полоса под бортом */
        const g=ctx.createLinearGradient(0,y-o.w,0,y+o.w);
        g.addColorStop(0,"rgba(255,90,80,0)");
        g.addColorStop(.5,"rgba(255,96,86,.75)");
        g.addColorStop(1,"rgba(255,90,80,0)");
        ctx.fillStyle=g;ctx.fillRect(o.x-o.l*.5,y-o.w,o.l,o.w*2);
      }
      ctx.restore();
    }
  }
  /* ── огни изготовителя ── одна семья на всех: не гирлянда, а подпись */
  if(M.lights==="amber"){
    ctx.fillStyle="rgba(255,190,90,.85)";
    for(const s of [1,-1]){
      ctx.beginPath();ctx.arc(h.nose*.42,profW(h.prof,h.nose*.42)*.55*s,Math.max(.5,u*.14),0,TAU);ctx.fill();
    }
  }else if(M.lights==="lantern"){
    const x=h.nose*.5;
    ctx.fillStyle="rgba(255,214,140,.9)";
    ctx.beginPath();ctx.arc(x,-profW(h.prof,x)*.7,Math.max(.6,u*.2),0,TAU);ctx.fill();
    ctx.strokeStyle="rgba(70,52,30,.8)";ctx.lineWidth=.4;ctx.stroke();
  }
}
/* ── метки: номер, логотип, имя, солнце, глиф (измерение 6) ──
   Каждый изготовитель метит корпус по-своему, и это второй после силуэта
   признак: на восьми пикселях его не видно, на тридцати — уже да. */
function makerMarks(h){
  const M=makerRow(h.by),S=h.seed,u=Math.max(1.2,h.bw*.5);
  const mid=lerp(h.nose*.6,h.tail*.4,.5);
  ctx.save();
  if(M.mark==="num"){
    /* номер и слово «изделие»: у ГЛАВТРАССЫ борт — это накладная */
    ctx.fillStyle="rgba(30,28,26,.55)";
    const n=(S%900+100)|0;
    ctx.font=u.toFixed(1)+"px monospace";ctx.textAlign="center";
    ctx.fillText(String(n),mid,u*.35);
  }else if(M.mark==="logo"){
    /* логотип во весь борт: круг с хвостом, читается пятном */
    ctx.strokeStyle="rgba(60,120,210,.75)";ctx.lineWidth=Math.max(.5,u*.22);
    ctx.beginPath();ctx.arc(mid,0,u*.9,-2.1,1.4);ctx.stroke();
    ctx.beginPath();ctx.moveTo(mid+u*.5,u*.5);ctx.lineTo(mid+u*1.5,u*.9);ctx.stroke();
  }else if(M.mark==="stencil"){
    /* трафарет в трёх местах и ни одного имени */
    ctx.fillStyle="rgba(20,22,24,.7)";
    ctx.font=(u*.8).toFixed(1)+"px monospace";ctx.textAlign="center";
    const n=(S%90+10)|0;
    for(const t of [.24,.52,.8]){
      const x=lerp(h.nose*.86,h.tail*.86,t);
      ctx.fillText(String(n)+"-"+((S>>>(3+t*10))&7),x,u*.3);
    }
  }else if(M.mark==="name"){
    /* имя, и никогда номер */
    ctx.fillStyle="rgba(40,60,90,.6)";
    ctx.font="italic "+(u*.85).toFixed(1)+"px serif";ctx.textAlign="center";
    ctx.fillText("«"+String.fromCharCode(65+(S%26))+"»",mid,u*.3);
  }else if(M.mark==="sun"){
    /* солнце от руки: круг и лучи, нарочно неровные */
    ctx.strokeStyle="rgba(60,36,18,.8)";ctx.lineWidth=Math.max(.5,u*.16);
    ctx.beginPath();ctx.arc(mid,0,u*.55,0,TAU);ctx.stroke();
    for(let k=0;k<7;k++){
      const a=k/7*TAU+((S>>>k)&3)*.06;
      ctx.beginPath();
      ctx.moveTo(mid+Math.cos(a)*u*.7,Math.sin(a)*u*.7);
      ctx.lineTo(mid+Math.cos(a)*u*1.05,Math.sin(a)*u*1.05);ctx.stroke();
    }
  }else if(M.mark==="glyph"){
    /* один глиф и версия: Хай-Фронт метит корпус так же, как прошивку */
    ctx.strokeStyle="rgba(210,60,50,.85)";ctx.lineWidth=Math.max(.5,u*.2);
    ctx.beginPath();ctx.arc(mid,0,u*.42,0,TAU);ctx.stroke();
    ctx.fillStyle="rgba(40,44,48,.6)";
    ctx.font=(u*.55).toFixed(1)+"px monospace";ctx.textAlign="center";
    ctx.fillText("v"+(1+(S%4))+"."+(S%10),mid+u*1.5,u*.2);
  }
  ctx.restore();
}
/* подпись тяги (измерение 7) и крен со звуком (измерение 8) */
function makerFlame(by){return makerRow(by).eng;}
function makerBank(by){return makerRow(by).snd.bank;}
function makerHum(by){return makerRow(by).snd.f;}
/* ── закон профиля как чистая функция (M369a) ──
   `makerProfile` правит готовый обвод корабля; остальным генераторам — флоту,
   баржам, телам станций — нужна та же грамматика в виде «дай долю ширины на
   доле длины». Один закон, шесть строк, читают все пятеро (D24). */
function makerWidth(by,t,q){
  const P=makerRow(by).prof;
  t=clamp(t,0,1);
  if(P==="step"){
    /* полки: три уступа и короб амидшип */
    return t<.30?(t<.15?.42:.68):(t<.62?1:(t<.80?.74:.52));
  }
  if(P==="capsule")return t<.20?lerp(.34,1,Math.pow(t/.20,.7)):
    (t>.80?lerp(1,.44,Math.pow((t-.80)/.20,1.3)):1);
  if(P==="chamfer"){
    /* прямые отрезки между тремя узлами */
    const kn=[0,.30,.62,1],kw=[.46,.96,.88,.52];
    let s=0;while(s<kn.length-2&&t>kn[s+1])s++;
    return lerp(kw[s],kw[s+1],(t-kn[s])/(kn[s+1]-kn[s]));
  }
  if(P==="swan"){
    const dip=1-.55*Math.exp(-Math.pow((t-.26)/.10,2));
    return (.18+.82*Math.exp(-Math.pow((t-.62)/.30,2)))*dip;
  }
  if(P==="modules"){
    /* блоки встык: их число и ширины от того же зерна, что и сама вещь */
    const n=4,k=Math.min(n-1,Math.floor(t*n));
    const w=[.72,1,.62,.86];
    return w[(k+((q|0)%n))%n];
  }
  if(P==="spindle")return Math.sqrt(Math.max(.04,1-Math.pow(t*2-1,2)));
  return 1;
}
/* грунт, огонь и огни — то, чем красится любая сборка изготовителя */
function makerGround(by){return makerRow(by).ground;}
function makerWear(by){return makerRow(by).wear;}
function makerLightCol(by){
  const L=makerRow(by).lights;
  return L==="amber"?[255,190,90]:L==="run"?[150,200,255]:L==="band"?[190,230,255]:
         L==="lantern"?[255,214,140]:L==="under"?[255,96,86]:[160,170,180];
}
/* ── сборка по-своему (M369a, §19.4 «то же восемь на других генераторах») ──
   Для станций и барж грамматика говорит не про обвод, а про то, КАК куски
   собраны: стойка и барабан, ряд одинаковых, дуги и кольцо, лоскут на ферме,
   один хребет с мачтами, короб с логотипом и подами вокруг. */
const MAKER_ASSEMBLY={gt:"rack",co:"block",or:"stack",km:"ring",ra:"patch",hf:"spine"};
function makerAssembly(by){return MAKER_ASSEMBLY[by]||"rack";}

/* ══════════════ шесть держав (M369, §7.1) ══════════════
   Держава — не фракция с полоской отношения, а страна: у неё своя дорога, свои
   ворота, свой голос в эфире и свой завод. Завод — это `HULL_MAKER`
   (03a-hull-maker), и ключи здесь те же: держава и её изготовитель — одно, но
   таблицы разные, потому что грамматика формы живёт отдельно от политики.

   ГЛАВТРАССА — та, откуда игрок: «ты по рождению уже тут» (§7.5). Флаг у него
   её и остаётся, на каком бы корпусе он ни летал: транспондер — не обшивка
   (D09). Пираты — не держава, а то, что между ними осталось.

   Сатира здесь на ГОСУДАРСТВО — на его канцелярию и его эфир, — и никогда на
   людей: правило §7.1, и оно же мера при любом добавлении строки.

   Что уже работает: имена, эфирная строка, приветствие на подходе, семейства
   орудий (они есть в 05b-guns; ракеты — не семейство, а вид части, поэтому у
   доктрины они отдельным полем `msl`), эмблема и флаг. Война, фронты и сводки — M371
   и дальше; здесь только таблица, к которой они придут. */
const POWERS={
  gt:{ru:"ГЛАВТРАССА",full:"ГЛАВТРАССА",from:"СССР",
    wants:"чтобы дорога была открыта",
    fams:["heavy","flak","auto","cluster"],
    doctrine:"масса и терпение: отступает редко, теряет много, не сообщает ничего",
    emblem:"star",col:"#e0d28a",
    hail:"Борт, откуда, чей, по какой надобности. Записываю",
    air:"На трассе спокойно",
    never:"о потерях",
    food:"щи из концентрата, компот, хлеб по норме",
    paper:"трафарет и параграф",suit:"«Стриж»",
    voice:{f:150,to:120,d:.5},say:{rate:.92,pitch:.85}},
  co:{ru:"Компания",full:"КОМПАНИЯ ВОСТОЧНЫХ РЫНКОВ",from:"США",
    wants:"рыночные станции и всё, что продаётся",
    fams:["aimed","flak","auto"],msl:1,
    doctrine:"бьёт издалека и деньгами, нанимает пиратов",
    emblem:"ring",col:"#7fb8ff",
    hail:"Приветствуем на территории партнёра. Стыковка от 40 кредитов, спасибо за выбор",
    air:"Выгодно как никогда",
    never:"о ценах — только «выгодно»",
    food:"комплексный обед «Партнёр»™ — три перемены, кофе отдельно",
    paper:"фирменный знак на каждой странице",suit:"SafeLine™",
    voice:{f:320,to:360,d:.3},say:{rate:1.18,pitch:1.05}},
  or:{ru:"Орднунг",full:"ОРДНУНГ",from:"Германия",
    wants:"узлы прыжка и горловины",
    fams:["rail","heavy","shot"],
    doctrine:"стоит стеной, не отступает, строй ровный",
    emblem:"grid",col:"#c9c9d4",
    hail:"Идентификация. Формуляр. Ожидайте",
    air:"Согласно регламенту",
    never:"о чувствах",
    food:"порция 2-Б: суп, второе, компот. Время приёма пищи — 18 минут",
    paper:"нумерованные параграфы, без единой лишней строки",suit:"Typ 4/B",
    voice:{f:200,to:200,d:.22},say:{rate:1.05,pitch:.8}},
  km:{ru:"Коммуна",full:"ЛА КОММУНА",from:"Франция",
    wants:"верфи и красивые системы (для неё это одно и то же)",
    fams:["laser","siphon","jam","harpoon"],
    doctrine:"изящно: уходит показательно и возвращается внезапно",
    emblem:"wave",col:"#9fd8ff",
    hail:"А, ещё один. Ну проходи, только не сегодня, сегодня мы не работаем",
    air:"Об этом стоит подумать дольше, чем длится сводка",
    never:"— она говорит обо всём и часами",
    food:"суп дня, сыр, и разговор — обед идёт час, меньше не бывает",
    paper:"курсив и длинные абзацы",suit:"«Éloise»",
    voice:{f:260,to:190,d:.7},say:{rate:.85,pitch:1}},
  ra:{ru:"Рассвет",full:"ПАН-АФРИКАНСКИЙ КООПЕРАТИВ «РАССВЕТ»",from:"Африка",
    wants:"пояса, руду и всё, что копают",
    fams:["drill","shove","mortar","ram"],
    doctrine:"вплотную, много мелких, чинится в бою из хлама",
    emblem:"sun",col:"#f2b25c",
    hail:"Заходи, брат, чинить есть что?",
    air:"Успеется",
    never:"о сроках",
    food:"общий котёл: кто пришёл, тот и ест",
    paper:"надписи от руки",suit:"собран из трёх",
    voice:{f:120,to:150,d:.9},say:{rate:.8,pitch:.9}},
  hf:{ru:"Хай-Фронт",full:"ХАЙ-ФРОНТ",from:"Япония и Корея",
    wants:"маяки и ретрансляторы — всё, что смотрит",
    fams:["aimed","laser","cluster","needle"],
    doctrine:"видит первым, бьёт первым, не спорит",
    emblem:"dot",col:"#ff8b7a",
    hail:"Добро пожаловать. Ваш рейтинг доверия рассчитан. Просим извинить за неудобства",
    air:"Обновление установлено",
    never:"о том, что уже сделала",
    food:"набор питания v4.1, время приёма рассчитано",
    paper:"строка версии на обложке",suit:"KIT v3.2",
    voice:{f:420,to:430,d:.18},say:{rate:1.25,pitch:1.15}}
};
const POWER_KEYS=Object.keys(POWERS);
function powerOf(k){return POWERS[k]||POWERS.gt;}
function powerRu(k){return powerOf(k).ru;}
/* ── флаг, а не обшивка (D09) ──
   Транспондер отвечает за принадлежность, корпус — нет: на компанейском
   корпусе под флагом ГЛАВТРАССЫ вас запишут именно как своего, просто в
   приветствии это отметят. Пираты флага не несут вовсе. */
function playerFlag(){return G.flag||"gt";}
function flagOf(o){
  if(!o)return null;
  if(o===G.ship)return playerFlag();
  if(o.pw)return o.pw;
  if((o.owner||"")==="fleet")return "gt";
  return null;                     /* пират — не держава */
}
/* приветствие на подходе: одна строка на державу (§7.1) */
function powerHail(k){return powerOf(k).hail;}
/* эмблема — круглая, одной конструкции на все шесть: круг, внутри знак.
   Шесть цветов на карте были бы шумом (holding §13), поэтому на карте — чип
   с эмблемой, а не заливка. */
function powerEmblem(k,x,y,r){
  const P=powerOf(k),col=P.col;
  ctx.save();
  ctx.strokeStyle=col;ctx.lineWidth=Math.max(1,r*.16);
  ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();
  ctx.fillStyle=col;
  if(P.emblem==="star"){
    /* пятиконечная — но собранная из лучей, а не залитая: на чипе в шесть
       пикселей залитая звезда превращается в кляксу */
    for(let i=0;i<5;i++){
      const a=-Math.PI/2+i/5*TAU;
      ctx.beginPath();ctx.moveTo(x,y);
      ctx.lineTo(x+Math.cos(a)*r*.72,y+Math.sin(a)*r*.72);
      ctx.lineWidth=Math.max(1,r*.22);ctx.strokeStyle=col;ctx.stroke();
    }
  }else if(P.emblem==="ring"){
    ctx.beginPath();ctx.arc(x,y,r*.42,0,TAU);ctx.stroke();
  }else if(P.emblem==="grid"){
    ctx.lineWidth=Math.max(1,r*.14);
    for(const t of [-.35,.35]){
      ctx.beginPath();ctx.moveTo(x+r*t,y-r*.55);ctx.lineTo(x+r*t,y+r*.55);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x-r*.55,y+r*t);ctx.lineTo(x+r*.55,y+r*t);ctx.stroke();
    }
  }else if(P.emblem==="wave"){
    ctx.lineWidth=Math.max(1,r*.16);
    ctx.beginPath();
    for(let i=0;i<=8;i++){
      const t=i/8,px=x-r*.6+r*1.2*t,py=y+Math.sin(t*TAU)*r*.34;
      i?ctx.lineTo(px,py):ctx.moveTo(px,py);
    }
    ctx.stroke();
  }else if(P.emblem==="sun"){
    ctx.beginPath();ctx.arc(x,y,r*.34,0,TAU);ctx.fill();
    ctx.lineWidth=Math.max(1,r*.12);
    for(let i=0;i<8;i++){
      const a=i/8*TAU;
      ctx.beginPath();
      ctx.moveTo(x+Math.cos(a)*r*.5,y+Math.sin(a)*r*.5);
      ctx.lineTo(x+Math.cos(a)*r*.78,y+Math.sin(a)*r*.78);ctx.stroke();
    }
  }else{
    ctx.beginPath();ctx.arc(x,y,r*.3,0,TAU);ctx.fill();
  }
  ctx.restore();
}
/* ══════════════ «Ялта» (M369, D12) ══════════════
   Одна система на всю галактику, куда все шестеро летают отдыхать и где никто
   не стреляет: пиратов там нет, оружие опечатано, фронт туда не приходит
   никогда. Адрес считается от постоянного зерна галактики — значит он один и
   тот же у всех и его можно назвать вслух, не сговариваясь.

   Содержимое «Ялты» — регата, рынок, встречи — приходит в M372; здесь только
   адрес и три запрета, на которые уже сегодня опирается бой. */
const YALTA_R=6;
function yaltaAt(){
  if(G._yalta)return G._yalta;
  /* зерно галактики постоянно (§7.5: одна галактика на всех), поэтому и адрес
     постоянен: угол от зерна, радиус ровно шестой круг */
  const a=h01(0x1A17,0x5EA,77)*TAU;
  const p={sx:Math.round(Math.cos(a)*YALTA_R),sy:Math.round(Math.sin(a)*YALTA_R)};
  return G._yalta=p;
}
function yaltaIs(sx,sy){
  const y=yaltaAt();
  return (sx|0)===y.sx&&(sy|0)===y.sy;
}
function yaltaHere(){return yaltaIs(G.sx,G.sy);}
/* оружие опечатано: не «выстрел не проходит», а прямой отказ с причиной —
   игрок обязан понимать, почему кнопка молчит */
function yaltaSealed(){
  if(!yaltaHere())return false;
  if((G._yaltaSaid||0)<G.t-180){G._yaltaSaid=G.t;say("ЯЛТА · ОРУЖИЕ ОПЕЧАТАНО",90);}
  return true;
}

/* ══════════════ шесть агентов (M370, §7.5, §16.2 шаг 4) ══════════════
   Держава — не таблица настроений, а АГЕНТ с нуждами. У каждой четыре нужды в
   промилле (руда, товары, корпуса, связь), сила, отношения к пятерым и ход раз
   в сводку. Ход выбирается не «настроением», а тем, чего не хватает: у кого
   просела руда — тот идёт за поясами, у кого связь — за узлами.

   Шесть ходов, ровно как в §16.2: сделка, ссора, война, перемирие, альянс,
   стройка. Ни одного дробного числа: всё целое, броски через `hashi`. */
const CHRON_MOVES=["deal","quarrel","war","truce","ally","build"];
/* чего хочет каждая (§7.1 «wants»), в порядке ключей MAKER_KEYS */
const CHRON_WANT=[
  {ore:1,goods:1,hulls:1,link:2},   /* ГЛАВТРАССА: дорога и связь */
  {ore:0,goods:3,hulls:1,link:1},   /* Компания: товары */
  {ore:1,goods:1,hulls:2,link:1},   /* Орднунг: узлы и корпуса */
  {ore:0,goods:1,hulls:3,link:1},   /* Коммуна: верфи */
  {ore:3,goods:1,hulls:0,link:1},   /* Рассвет: руда */
  {ore:0,goods:1,hulls:1,link:3}    /* Хай-Фронт: связь и маяки */
];
function chronNeedLow(P){
  let k="ore",v=P.need.ore;
  for(const q of ["goods","hulls","link"])if(P.need[q]<v){v=P.need[q];k=q;}
  return k;
}
/* с кем граничим: матрица 6×6 по клеткам круга, считается раз на сводку в
   chronStep и лежит в `st._touch` (кэш, не состояние: в клон не входит).
   Ссорятся и воюют с соседом — у войны без общей границы нет фронта, и до
   M412 половина войн шла «через круг» и не двигала ни одной системы */
function chronTouch(st){
  const T=[];for(let i=0;i<6;i++){T.push([false,false,false,false,false,false]);}
  for(const k of chronKeys()){
    const S=st.systems[k];if(!S||S.owner<0)continue;
    const p=k.split(","),x=p[0]|0,y=p[1]|0;
    for(const d of [[1,0],[0,1]]){
      const Q=st.systems[(x+d[0])+","+(y+d[1])];
      if(!Q||Q.owner<0||Q.owner===S.owner)continue;
      T[S.owner][Q.owner]=true;T[Q.owner][S.owner]=true;
    }
  }
  return T;
}
function chronRelWorst(st,i){
  const T=st._touch;
  let j=-1,v=1001;
  for(let q=0;q<6;q++){if(q===i||(T&&!T[i][q]))continue;if(st.powers[i].rel[q]<v){v=st.powers[i].rel[q];j=q;}}
  if(j>=0||!T)return j;
  for(let q=0;q<6;q++){if(q===i)continue;if(st.powers[i].rel[q]<v){v=st.powers[i].rel[q];j=q;}}
  return j;
}
function chronRelBest(st,i){
  let j=-1,v=-1001;
  for(let q=0;q<6;q++){if(q===i)continue;if(st.powers[i].rel[q]>v){v=st.powers[i].rel[q];j=q;}}
  return j;
}
function chronAtWar(st,a,b){
  for(const w of st.wars)if((w.a===a&&w.b===b)||(w.a===b&&w.b===a))return w;
  return null;
}
/* любая война этой державы: §15 — одна война на державу, две на галактику */
function chronWarOf(st,i){
  for(const w of st.wars)if(w.a===i||w.b===i)return w;
  return null;
}
function chronAtWarAny(st,i){return !!chronWarOf(st,i);}
/* сколько систем j забрал у i за последние сутки — по строкам летописи, они
   хронологичны, и старше суток дальше смотреть незачем */
function chronGrudge(st,N,i,j){
  if(j<0)return 0;
  let n=0;
  for(let q=st.lines.length-1;q>=0;q--){
    const L=st.lines[q];
    if(N-L.N>24)break;
    if(L.kind==="take"&&L.p===j&&L.args&&L.args.from===i)n++;
  }
  return n;
}
const CHRON_NEED_KEYS=["ore","goods","hulls","link"];
/* один ход одной державы */
function chronAgentMove(st,N,i,rr){
  const P=st.powers[i];
  const roll=rr(i,0x9A)%1000;
  const want=CHRON_WANT[i];
  /* ── нужды (M412) ──
     Тают от того, чего держава хочет, и пополняются тем, что она держит.
     Равновесие — у державы размером с дом (~53 системы): меньше дома — нужды
     тают, и она идёт за ними; больше — копятся, и ей есть чем торговать.
     Прежний закон «−20−want·6+hold·(want+1)/12» бил прибыль убылью всегда:
     все шестеро сидели на нуле, ход был вечно «ссора/война», сделок не
     случалось — 24 войны в месяц против 2–4 по §15 (замер 0.401.1,
     docs/warsim.js). Дрожь ±6 от зерна — чтобы равновесие не было мёртвой
     точкой, из которой нечему выйти. */
  for(let q=0;q<4;q++){
    const k=CHRON_NEED_KEYS[q];
    const gain=(P.hold*(want[k]+1)*3/16)|0;
    const use=16+want[k]*6;
    const jit=(rr(i*4+q,0x7E)%13)-6;
    P.need[k]=clampi(P.need[k]-use+gain+jit,0,1000);
  }
  /* война ест: каждая её сводка стоит силы, товаров и корпусов — потому она и
     кончается, и потому после неё есть о чём торговать */
  if(chronAtWarAny(st,i)){
    P.str=clampi(P.str-6,100,1000);
    P.need.goods=clampi(P.need.goods-6,0,1000);
    P.need.hulls=clampi(P.need.hulls-8,0,1000);
  }
  const low=chronNeedLow(P);
  /* отношения тянет к нулю: без этого через сотню сводок все дружат со всеми
     на тысячу и галактика застывает */
  for(let q=0;q<6;q++){
    if(q===i)continue;
    const v=P.rel[q];
    /* §15: пять процентов за сводку (было 2,5: пары примерзали к ±1000) */
    P.rel[q]=v>0?v-((v/20|0)+1):(v<0?v+((-v/20|0)+1):0);
  }
  /* ── курс месяца (M378) ──
     Толпа не правит державой, но подталкивает её: победивший на выборах ответ
     смещает пороги хода. «Держать фронт» — раньше ссорится и воюет; «строить»
     — чаще строит и торгует. Держава при этом остаётся собой. */
  /* курс: то, за что проголосовала толпа, — и то, что от него оставил
     переворот (M385) */
  const course=(typeof powCourse==="function")?powCourse(i,N,st)
    :((typeof voteCourse==="function")?voteCourse(i,N):null);
  const warBias=(course==="war")?90:((course==="build")?-70:0);
  /* ── выбор хода (M412) ──
     Злее всего тот, у кого нужда на дне и есть с кем ссориться, — но за нуждой
     держава сперва идёт ТОРГОВАТЬ (у кого отношения не испорчены), и только
     потом ссориться. Прежний порядок «война, иначе ссора» не давал сделке
     случиться никогда, пока нужда ниже 450, — и нужда не поднималась никогда.
     §15: одна война на державу, две на галактику. */
  const worst=chronRelWorst(st,i),best=chronRelBest(st,i);
  const atWar=chronAtWarAny(st,i);
  const scarce=P.need[low]<450+warBias,dire=P.need[low]<250+warBias;
  /* обида: сколько систем худший забрал у нас за последние сутки. Это и есть
     «спорная граница» §7.5 — повод для ссоры, а с ней и для войны в ответ */
  const grudge=chronGrudge(st,N,i,worst);
  /* ── вероятности ходов, в промилле (таблица §15) ──
     В войне держава мирится тем охотнее, чем дольше воюет, а между делом
     строит и торгует; вне войны — объявляет её, ссорится, торгует, дружит или
     строит, и каждое с вероятностью, которую двигают нужда, обида, напряжение
     и курс месяца. Розыгрыш один на ход, бросок один и тот же (`roll`) */
  let move="build";
  if(atWar){
    const w=chronWarOf(st,i),age=N-w.t0;
    if(P.str<300||roll<60+age*30)move="truce";
    else move=(roll&1)?"build":"deal";
  }else{
    /* воюет тот, кто может: сила выше 450, владений не меньше половины дома
       (карлик у пола §15 выживает, а не воюет), отношения с худшим ниже −200 */
    const canWar=st.wars.length<2&&worst>=0&&!chronAtWarAny(st,worst)&&P.str>450&&
      P.hold*20>=P.home*9&&P.rel[worst]<=-250;
    const partnerOk=best>=0&&P.rel[best]>-50&&st.powers[best].need[low]>=550;   /* у партнёра излишек */
    const pWar=canWar?(35+(dire?80:0)+grudge*60):0;
    const pQuar=(worst>=0)?(20+(scarce?60:0)+(P.tension/40|0)+grudge*60+Math.max(0,warBias)):0;
    const pDeal=(scarce&&partnerOk)?600:(partnerOk?150:40);
    const pAlly=(best>=0&&P.rel[best]>350)?80:0;
    let t=roll;
    if((t-=pWar)<0)move="war";else if((t-=pQuar)<0)move="quarrel";else if((t-=pDeal)<0)move="deal";
    else if((t-=pAlly)<0)move="ally";else move="build";
  }
  /* торгуют и дружат с лучшим; ссорятся и воюют с худшим */
  const j=(move==="ally"||move==="deal")?best:worst;
  if(move==="deal"&&j>=0){
    /* сделка: нужда закрывается тем, что у партнёра в избытке, и обе теплеют.
       Излишек конечен: партнёр отдаёт, и у него становится меньше */
    P.need[low]=clampi(P.need[low]+50,0,1000);
    const Q=st.powers[j];
    Q.need[low]=clampi(Q.need[low]-25,0,1000);
    Q.need[chronNeedLow(Q)]=clampi(Q.need[chronNeedLow(Q)]+35,0,1000);
    P.rel[j]=clampi(P.rel[j]+40,-1000,1000);Q.rel[i]=clampi(Q.rel[i]+40,-1000,1000);
    /* договорились — нота отозвана (M386): это единственный способ отменить
       уже предъявленный срок, и он требует хода, а не времени */
    if(typeof chronUltDrop==="function")chronUltDrop(st,N,i,j);
    if((rr(i,0x0D)%1000)<120)chronLine(st,N,"deal",i,null,{b:j});
  }else if(move==="quarrel"&&j>=0){
    const Q=st.powers[j];
    P.rel[j]=clampi(P.rel[j]-130,-1000,1000);Q.rel[i]=clampi(Q.rel[i]-90,-1000,1000);
    P.tension=clampi(P.tension+120,0,1000);
  }else if(move==="war"&&j>=0&&!chronAtWar(st,i,j)){
    /* сперва бумага (M386): нота со сроком вместо выстрела. Если нот уже три,
       круг больше не ждёт — война начинается сразу */
    if(typeof chronUltFile==="function"&&chronUltFile(st,N,i,j))return move;
    st.wars.push({a:i,b:j,t0:N});
    P.rel[j]=clampi(P.rel[j]-300,-1000,1000);
    st.powers[j].rel[i]=clampi(st.powers[j].rel[i]-300,-1000,1000);
    P.tension=clampi(P.tension+300,0,1000);
    chronLine(st,N,"war",i,null,{b:j});
  }else if(move==="truce"){
    /* мирятся с тем, с кем воюют, — а не с тем, кто сейчас худший: за время
       войны худшим успевает стать третий, и война шла бы до срока всегда */
    const w=chronWarOf(st,i);
    if(w){
      const e=(w.a===i)?w.b:w.a;
      st.wars.splice(st.wars.indexOf(w),1);
      P.rel[e]=clampi(P.rel[e]+280,-1000,1000);
      st.powers[e].rel[i]=clampi(st.powers[e].rel[i]+280,-1000,1000);
      chronLine(st,N,"truce",i,null,{b:e});
    }
  }else if(move==="ally"&&j>=0){
    if(typeof chronUltDrop==="function")chronUltDrop(st,N,i,j);
    P.rel[j]=clampi(P.rel[j]+120,-1000,1000);
    st.powers[j].rel[i]=clampi(st.powers[j].rel[i]+120,-1000,1000);
    P.str=clampi(P.str+12,100,1000);
  }else{
    /* стройка: сила растёт медленно и упирается в то, сколько держава держит */
    const cap=300+P.hold*6;
    P.str=clampi(P.str+((P.str<cap)?16:2),100,1000);
    P.need.goods=clampi(P.need.goods-8,0,1000);
  }
  return move;
}
/* ── ультиматум со сроком (M386, §15.1) ──
   До сегодняшнего дня война возникала из ничего: держава решала воевать, и в
   ту же сводку начинала. Игрок узнавал об этом по чужому бою в небе.

   Теперь между решением и выстрелом лежит бумага. Держава предъявляет ноту со
   сроком; срок виден на станции числом; истёк — война начинается САМА и уже
   ничем не отменяется. Отменить её можно только одним способом: настоящим
   потеплением до срока — сделкой или союзом, а не тем, что обида остыла сама.

   Ход агента при этом не изменился ни на бросок — сдвинулся момент. Зато у
   игрока появилось окно, в котором ещё можно что-то успеть: увезти груз,
   довезти письмо, увести наёмника с той стороны. */
const DIP_ULT_OFF=-120;      /* теплее этого — нота отозвана */
const DIP_ULT_DUE=6;        /* столько сводок сроку: полтора суток */
const DIP_ULT_MAX=3;        /* больше трёх нот разом круг не выдерживает */
/* нота вместо выстрела: `true` — бумага подана, войну откладываем */
function chronUltFile(st,N,i,j){
  if(!st.ults)st.ults=[];
  for(const u of st.ults)if((u.a===i&&u.b===j)||(u.a===j&&u.b===i))return true;
  if(st.ults.length>=DIP_ULT_MAX)return false;   /* очереди у ноты нет */
  st.ults.push({a:i,b:j,t0:N});
  chronLine(st,N,"ult",i,null,{b:j});
  return true;
}
/* отозвать ноту: только настоящим ходом навстречу — сделкой или союзом */
function chronUltDrop(st,N,i,j){
  if(!st.ults)return false;
  for(let q=0;q<st.ults.length;q++){
    const u=st.ults[q];
    if((u.a===i&&u.b===j)||(u.a===j&&u.b===i)){
      st.ults.splice(q,1);
      chronLine(st,N,"note",i,null,{b:j});
      return true;
    }
  }
  return false;
}
function chronUltStep(st,N,rr){
  if(!st.ults)st.ults=[];
  for(let q=st.ults.length-1;q>=0;q--){
    const u=st.ults[q],A=st.powers[u.a],B=st.powers[u.b];
    if(chronAtWar(st,u.a,u.b)){st.ults.splice(q,1);continue;}
    if(A.rel[u.b]>DIP_ULT_OFF&&B.rel[u.a]>DIP_ULT_OFF){
      st.ults.splice(q,1);
      chronLine(st,N,"note",u.a,null,{b:u.b});      /* нота отозвана */
      continue;
    }
    if(N-u.t0<DIP_ULT_DUE)continue;
    /* §15: двух войн разом галактике хватает — нота ждёт своей очереди (M412) */
    if(st.wars.length>=2)continue;
    st.ults.splice(q,1);
    /* срок вышел — но воюют не от обиды, а от нужды: если у предъявившей
       ноту нужда за это время выправилась, воевать ей больше незачем, и нота
       гаснет сама. Это и есть «нота, на которую ответили» */
    /* срок вышел — но воюют не от обиды, а от нужды: если у предъявившей
       ноту нужда за это время выправилась, воевать ей больше незачем, и нота
       гаснет сама. Это и есть «нота, на которую ответили» */
    if(A.need[chronNeedLow(A)]>=250){chronLine(st,N,"note",u.a,null,{b:u.b});continue;}
    st.wars.push({a:u.a,b:u.b,t0:N});
    A.rel[u.b]=clampi(A.rel[u.b]-300,-1000,1000);
    B.rel[u.a]=clampi(B.rel[u.a]-300,-1000,1000);
    A.tension=clampi(A.tension+300,0,1000);
    chronLine(st,N,"war",u.a,null,{b:u.b});
  }
}

/* ══════════════ Директор (M371, §15) ══════════════
   Автор: «продумай, чтобы оно месяц без тебя автономно могло жить… ты рулящий
   верхнеуровнево». Директор — это не сюжет и не расписание, а РИТМ: он следит,
   чтобы в галактике не наступала тишина дольше четырёх сводок, чтобы после
   пика был спад, и чтобы ничего не разгонялось до бесконечности.

   Три вида событий (§15): происшествие — одна сводка и одна строка; дуга —
   от четырёх до двадцати сводок со стадиями и обязательной развязкой; обряд —
   то, в чём участвуют игроки (объявляется здесь, работает с M379).

   Напряжение — целое 0…1000 на державу плюс общее по галактике. Оно растёт от
   происшествий и войн и падает в тишине; пик держится не дольше трёх суток
   (12 сводок), тишина — не дольше двух. Это тот самый режиссёр из Left 4 Dead,
   только на шестичасовом шаге и целыми числами.

   Всё детерминировано: те же зерно и номер сводки — те же события у всех. */
const DIR_FAMILY=["econ","soc","nature","power","diplo","sec","cult"];
/* происшествия: семья, ключ, и то, насколько поднимают напряжение */
const DIR_INCIDENTS=[
  {k:"vein",   f:"econ",  up:40},   /* жила в поясе: туда летят все */
  {k:"fair",   f:"econ",  up:0},    /* ярмарка */
  {k:"embargo",f:"econ",  up:90},
  {k:"strike", f:"soc",   up:60},
  {k:"holiday",f:"soc",   up:0},
  {k:"refugee",f:"soc",   up:70},
  {k:"storm",  f:"nature",up:50},
  {k:"swarm",  f:"nature",up:60},
  {k:"drain",  f:"nature",up:40},
  {k:"coup",   f:"power", up:150},
  {k:"purge",  f:"power", up:130},
  {k:"envoy",  f:"diplo", up:0},
  {k:"spy",    f:"sec",   up:110},
  {k:"patrol", f:"sec",   up:30},
  {k:"census", f:"cult",  up:0},
  {k:"cult",   f:"cult",  up:40},
  /* три вида, которые семьи читали, а Директор не объявлял (M412): бунт в
     занятой системе (12ay), находка — планета пригодна (12az), откол кластера
     (12b0). Обещание без строки в этой таблице — ложь по правилу проекта */
  {k:"revolt", f:"soc",   up:80},
  {k:"find",   f:"nature",up:0},
  {k:"secede", f:"power", up:120}
];
const DIR_ARCS=["shortage","frontier","succession","expedition","quarantine","goldrush"];
/* обряды §14 своими именами (M379): Директор их объявляет, `12au-rites` знает,
   что они значат и что делают */
const DIR_RITES=["build","loan","subbot","coupon","quar","lost","census","amnesty",
  "reform","regatta"];
const DIR_QUIET=4;      /* дольше четырёх сводок без события галактика не молчит */
/* пик держится не дольше трёх суток (§15) — а это ДВЕНАДЦАТЬ сводок вместе со
   спадом, а не двенадцать сводок до него: считать надо то, что видит игрок */
const DIR_PEAK=7;
const DIR_ARC_MAX=20;   /* дуга обязана кончиться */
/* ── сезон: восемь ручек, раз в месяц или никогда (§15) ──
   Регулятор (это Клод раз в месяц, §12) может положить сезон; если его нет или
   он не проходит проверку — «автопилот»: умеренное напряжение и тема от зерна
   месяца. Плохой сезон не ломает ничего и не применяется вовсе. */
const DIR_THEMES=["месяц дефицита","весна строек","тихий месяц","месяц перемен",
  "месяц дорог","месяц отчётов"];
function chronMonth(N){return Math.floor((N|0)/120);}
function chronSeasonValid(s){
  if(!s||typeof s!=="object")return false;
  if(typeof s.tension!=="number"||s.tension<0||s.tension>1000)return false;
  if(typeof s.theme!=="string"||!s.theme.length||s.theme.length>40)return false;
  if(s.arcs&&!Array.isArray(s.arcs))return false;
  if(s.arcs&&s.arcs.some(a=>DIR_ARCS.indexOf(a)<0))return false;
  if(s.rites&&(!Array.isArray(s.rites)||s.rites.some(a=>DIR_RITES.indexOf(a)<0)))return false;
  return true;
}
function chronSeason(N,st){
  const m=chronMonth(N);
  /* сезон живёт в состоянии летописи (M412): его кладёт циркуляр в свою сводку
     (12aw), и он едет с повтором у всех одинаково. `G.warSeason` остаётся
     вторым входом — для стенда и наборов */
  let put=null;
  if(st&&st.season&&st.season.m===m)put=st.season.s;
  else if(typeof G!=="undefined"&&G.warSeason&&G.warSeason.m===m)put=G.warSeason.s;
  if(chronSeasonValid(put))return put;
  /* автопилот */
  const h=hashi(m,0x5EA,CHRON_SEED);
  return {tension:420+(h%180),theme:DIR_THEMES[h%DIR_THEMES.length],
    arcs:DIR_ARCS,rites:DIR_RITES,auto:1};
}
/* ── один шаг Директора (шаг 3 в §16.2) ── */
function chronDirector(st,N){
  const S=chronSeason(N,st);
  const rr=(a,b)=>hashi(N,a,(b|0)^0x0D18);
  if(!st.dir)st.dir={quiet:0,peak:0,calm:0,tens:0,last:{},arcs:[],rites:[]};
  const D=st.dir;
  /* напряжение галактики тянется к сезонной цели и растёт от войн */
  const wars=st.wars.length;
  const target=clampi(S.tension+wars*120,0,1000);
  /* ── подъём, пик, СПАД ──
     Первый заход сбрасывал напряжение на пике и тут же получал его обратно от
     происшествий той же сводки: пик длился сорок сводок вместо двенадцати
     (замер 0.371.0). Спад поэтому не «минус двести шестьдесят», а ОКНО: пока
     оно идёт, происшествия напряжение не поднимают вовсе. */
  if(D.calm>0){
    D.calm--;
    D.tens=clampi(D.tens-120,0,1000);
    D.peak=0;
  }else D.tens=clampi(D.tens+((target>D.tens)?18:-14),0,1000);
  let any=false;
  /* происшествия: у каждой державы свой бросок, и один вид не повторяется
     раньше чем через десять сводок */
  for(let i=0;i<6;i++){
    if((rr(i,0x11)%1000)>=350)continue;
    const pool=DIR_INCIDENTS.filter(x=>((N-(D.last[i+"|"+x.k]||-99))>10));
    if(!pool.length)continue;
    const inc=pool[rr(i,0x22)%pool.length];
    D.last[i+"|"+inc.k]=N;
    st.powers[i].tension=clampi(st.powers[i].tension+inc.up,0,1000);
    if(D.calm<=0)D.tens=clampi(D.tens+(inc.up/3|0),0,1000);
    /* ── семья ВЛАСТИ (M385, §15.1) ──
       Три происшествия этой семьи меняют не цену и не тишину, а саму державу,
       поэтому живут они здесь, внутри повтора: чистка отнимает треть силы,
       наследник обнуляет отношения, переворот переворачивает курс. Всё это
       детерминировано, как и остальное, и входит в хэш. */
    /* ── происшествие трогает нужды (M412) ──
       Жила и находка кладут руду, истощение и эмбарго её и товары отнимают,
       забастовка и переселение бьют по товарам, ярмарка их прибавляет. Так у
       агентов появляется то, чего им не хватает, — и повод торговать или
       ссориться приходит извне, от Директора, а не только из их же арифметики:
       без этого нужды сходились к равновесию и галактика засыпала */
    {
      const Q=st.powers[i].need,k=inc.k;
      const bump=(key,v)=>{Q[key]=clampi(Q[key]+v,0,1000);};
      if(k==="vein")bump("ore",150);else if(k==="find")bump("ore",100);
      else if(k==="drain")bump("ore",-150);
      else if(k==="embargo")bump("goods",-100);
      else if(k==="strike")bump("goods",-60);
      else if(k==="refugee")bump("goods",-40);
      else if(k==="fair")bump("goods",100);
      else if(k==="holiday")bump("goods",60);
      else if(k==="storm")bump("link",-60);
      else if(k==="swarm")bump("hulls",-40);
      else if(k==="patrol")bump("link",40);
    }
    if(inc.k==="purge")st.powers[i].str=clampi((st.powers[i].str*7/10)|0,100,1000);
    if(inc.k==="coup")st.powers[i].tension=clampi(st.powers[i].tension+150,0,1000);
    if(inc.k==="envoy"){                       /* посольство: наследник и сброс */
      const P=st.powers[i];
      for(let q=0;q<6;q++)if(q!==i){
        P.rel[q]=(P.rel[q]/2)|0;
        st.powers[q].rel[i]=(st.powers[q].rel[i]/2)|0;
      }
    }
    chronLine(st,N,"inc",i,null,{k:inc.k,f:inc.f});
    any=true;
  }
  /* пик считается ПОСЛЕ происшествий (M412): они поднимают напряжение в ту же
     сводку, и счётчик, стоявший до них, видел спад там, где игрок видел пик —
     пик тянулся четырнадцать сводок вместо двенадцати */
  if(D.calm<=0){
    if(D.tens>800)D.peak++;else D.peak=0;
    if(D.peak>DIR_PEAK){D.calm=5;D.peak=0;}
  }
  /* дуги: начинаются редко и обязаны кончиться — либо своей развязкой, либо
     развязкой по умолчанию на двадцатой сводке */
  for(let i=0;i<6;i++){
    const cur=D.arcs.find(a=>a.p===i);
    if(!cur){
      /* §15: .08 — при .12 дуга висела на каждой державе всегда (M412) */
      if(D.tens<820&&(rr(i,0x33)%1000)<80){
        const allow=(S.arcs&&S.arcs.length)?S.arcs:DIR_ARCS;
        const kind=allow[rr(i,0x44)%allow.length];
        D.arcs.push({p:i,kind,t0:N,stage:0});
        chronLine(st,N,"arc",i,null,{k:kind,stage:0});
        any=true;
      }
    }else{
      const age=N-cur.t0;
      if(age>=DIR_ARC_MAX||((rr(i,0x55)%1000)<140&&age>=4)){
        chronLine(st,N,"arcend",i,null,{k:cur.kind,forced:age>=DIR_ARC_MAX?1:0});
        D.arcs.splice(D.arcs.indexOf(cur),1);
        any=true;
      }else if(age>0&&age%4===0&&cur.stage<4){
        cur.stage++;
        chronLine(st,N,"arc",i,null,{k:cur.kind,stage:cur.stage});
        any=true;
      }
    }
  }
  /* обряды: объявляются, пока их меньше трёх; работают с M379 */
  D.rites=D.rites.filter(r=>N-r.t0<12);
  if(D.rites.length<3&&(rr(0,0x66)%1000)<200){
    const allow=(S.rites&&S.rites.length)?S.rites:DIR_RITES;
    const kind=allow[rr(1,0x77)%allow.length];
    const p=rr(2,0x88)%6;
    D.rites.push({kind,p,t0:N});
    chronLine(st,N,"rite",p,null,{k:kind});
    any=true;
  }
  /* ── гарантия жизни ──
     Четыре сводки подряд без единого события — это сутки тишины, и она
     кончается не «когда-нибудь», а принудительно: Директор объявляет
     происшествие сам. Без этой строки месяц без игрока превращается в
     пустой лог, и никакие вероятности этого не чинят. */
  D.quiet=any?0:D.quiet+1;
  if(D.quiet>=DIR_QUIET){
    const i=rr(3,0x99)%6;
    const inc=DIR_INCIDENTS[rr(4,0xAA)%DIR_INCIDENTS.length];
    D.last[i+"|"+inc.k]=N;
    chronLine(st,N,"inc",i,null,{k:inc.k,f:inc.f,forced:1});
    D.quiet=0;
  }
  /* ограничители §15: сила восстанавливается на восьмую часть разрыва за
     сводку — к ПОТОЛКУ ОТ ВЛАДЕНИЙ, а не к тысяче (M412). Тянуть к тысяче
     значило, что ограничитель шага 6 не работает: все шестеро сидели у 900,
     разница сил была нулём и фронт бросал монетку (замер 0.401.1). Держава
     не падает ниже трети своего дома — ниже этого она «выживает», а не
     исчезает; это шаг 6 в 12am-chron */
  for(let i=0;i<6;i++){
    const P=st.powers[i];
    const cap=clampi(300+P.hold*6,300,900);
    P.str=clampi(P.str+((cap-P.str)/12|0),100,1000);
  }
}
/* ── что сейчас происходит ──
   Директор объявляет происшествия строкой; семьи механик (M382–M388) читают
   их отсюда и превращают в последствия. Живым считается происшествие, которому
   меньше `span` сводок: у каждой семьи свой срок, и он написан у неё. */
function chronIncSince(span,st,N){
  st=st||chronState();
  N=(N===undefined)?st.N:N;
  const out=[];
  for(const L of st.lines||[]){
    if(L.kind!=="inc"||!L.args)continue;
    if(N-L.N>span)continue;
    out.push({k:L.args.k,f:L.args.f,p:L.p,N:L.N});
  }
  return out;
}
/* происшествие этого вида — у кого и когда; null, если его сейчас нет */
function chronIncOf(kind,span,st,N){
  const L=chronIncSince(span===undefined?8:span,st,N);
  let best=null;
  /* при равных сводках побеждает ПОСЛЕДНЯЯ строка: строки идут по времени, и
     свежая новость о том же виде происшествия отменяет предыдущую */
  for(const x of L)if(x.k===kind&&(!best||x.N>=best.N))best=x;
  return best;
}
/* сколько сейчас идёт дуг и обрядов — для новостей и тестов */
function chronArcs(){const st=chronState();return (st.dir&&st.dir.arcs)||[];}
function chronRites(){const st=chronState();return (st.dir&&st.dir.rites)||[];}
function chronTension(){const st=chronState();return (st.dir&&st.dir.tens)|0;}

/* ══════════════ шесть волн (M371, §7.3, §15) ══════════════
   Одна и та же сводка, шесть версий. Правда — это карта; эфир — это то, что
   каждая держава считает нужным сказать. Сатира здесь на ГОСУДАРСТВО и его
   канцелярию, никогда на людей (§7.1), и она ровная: ГЛАВТРАССА врёт не больше
   и не меньше остальных, просто по-своему.

   Шаблон выбирается по виду события и волне; вставки — держава, сектор, вид
   происшествия. Ни одной свободной строки от игрока здесь нет и быть не может
   (правило открытки: без имён и без свободного текста). */
const CHRON_INC_RU={
  vein:"жила в поясе",fair:"ярмарка",embargo:"эмбарго",strike:"забастовка",
  holiday:"праздник",refugee:"переселение",storm:"вспышка",swarm:"рой",
  drain:"истощение",coup:"смена правления",purge:"чистка",envoy:"посольство",
  spy:"утечка",patrol:"досмотр",census:"перепись",cult:"тихий уезд",
  revolt:"бунт",find:"находка",secede:"откол"
};
const CHRON_ARC_RU={
  shortage:"дефицит",frontier:"рубеж",succession:"наследство",
  expedition:"экспедиция",quarantine:"карантин",goldrush:"золотая лихорадка"
};
const CHRON_RITE_RU={
  regatta:"регата",census:"перепись",parade:"парад",subbotnik:"субботник",
  relief:"помощь",memorial:"память"
};
/* по волне и виду события — одна строка. `%p` — держава, о которой речь,
   `%s` — сектор, `%k` — вид происшествия, `%n` — номер сводки. */
const CHRON_SAY={
  war:{
    gt:"На трассе спокойно. Отмечены временные трудности на отдельных участках.",
    co:"Рынок реагирует ростом: %p открывает новое направление. Отличное время войти.",
    or:"Пункт 4.1: %p приступила к операции. Формуляры приняты.",
    km:"%p объявила войну. Мы находим это грубым и предсказуемым — и всё же спросим себя, чего ей не хватало.",
    ra:"Опять начали. Ну ничего, мы уже готовим место, где чинить.",
    hf:"%p начала боевые действия. Ваш рейтинг доверия не изменился. Приносим извинения за потери противника."
  },
  truce:{
    gt:"На трассе спокойно. В Ялте подписано.",
    co:"Стороны договорились. Наши партнёры не пострадали, спасибо за выбор.",
    or:"Пункт 9.2: боевые действия прекращены согласно регламенту.",
    km:"Подписано. Как всегда, в Ялте, как всегда, за обедом, и как всегда — поздно.",
    ra:"Помирились. Значит, будем чинить не под огнём.",
    hf:"Соглашение зарегистрировано. Обновление доставлено всем сторонам."
  },
  take:{
    gt:"На трассе спокойно. Отмечено движение в секторе %s.",
    co:"Сектор %s меняет владельца — ожидаем оживления торга.",
    or:"Сектор %s. Формуляр передачи оформлен в трёх экземплярах.",
    km:"В секторе %s опять переставили флаг. Люди там те же самые.",
    ra:"В %s пришли новые. Барже всё равно, кому платить пошлину.",
    hf:"Сектор %s: владелец обновлён. Данные синхронизированы."
  },
  deal:{
    gt:"На трассе спокойно. План выполнен на 103 %.",
    co:"Сделка закрыта. Выгодно как никогда.",
    or:"Обмен произведён согласно регламенту.",
    km:"Договорились. Не спрашивайте о чём: важно, что говорили долго.",
    ra:"Сговорились. Значит, будет чем чинить.",
    hf:"Сделка зафиксирована. Рейтинг доверия сторон пересчитан."
  },
  inc:{
    gt:"На трассе спокойно. По многочисленным просьбам трудящихся: %k.",
    co:"%k — и это возможность. Наши партнёры уже там.",
    or:"%k. Согласно регламенту, пункт 12.",
    km:"%k. Мы напишем об этом эссе, а пока — просто помолчим.",
    ra:"%k. Ну что ж, бывает. Заходи, чинить есть что?",
    hf:"%k. Обновление установлено. Просим извинить за неудобства."
  },
  arc:{
    gt:"На трассе спокойно. Отдельные участки: %k.",
    co:"%k продолжается — рынок держим в курсе.",
    or:"%k, стадия по плану.",
    km:"%k. Это надолго, и это интересно.",
    ra:"%k. Мы посмотрим, чем это кончится.",
    hf:"%k: этап завершён, следующий начат."
  },
  arcend:{
    gt:"На трассе спокойно. Вопрос снят.",
    co:"История закрыта. Кто был с нами — заработал.",
    or:"Дело закрыто, формуляр подшит.",
    km:"Кончилось. Как всё кончается: тише, чем начиналось.",
    ra:"Отпустило.",
    hf:"Инцидент закрыт. Благодарим за понимание."
  },
  /* нота со сроком (M386): о ней говорят все шестеро, и каждый — про своё.
     Сатира на канцелярию, не на людей: бумага смешна, срок — нет */
  ult:{
    gt:"На трассе спокойно. %p направила %b документ со сроком. Срок обычный.",
    co:"%p выставила %b срок. Рынок закладывается на худшее — а значит, на этом можно заработать.",
    or:"Пункт 2.7: нота вручена. Срок исчисляется со следующей сводки.",
    km:"Нота. Сначала пишут бумагу, потом стреляют, и всегда именно в этом порядке.",
    ra:"Опять бумагами машут. Ну, значит, ещё немного повозим спокойно.",
    hf:"%p направила ноту %b. Ваш рейтинг доверия не изменился. Срок отображается корректно."
  },
  note:{
    gt:"На трассе спокойно. Документ отозван, срок снят.",
    co:"Нота отозвана — кто держал позицию, тот заработал.",
    or:"Пункт 2.9: нота отозвана, срок аннулирован, формуляр подшит.",
    km:"Отозвали. Значит, кто-то всё-таки перечитал, что написал.",
    ra:"Помирились до срока. Хорошо: чинить меньше.",
    hf:"Нота отозвана. Обновление доставлено обеим сторонам."
  },
  rite:{
    gt:"На трассе спокойно. Объявлен %k. Явка добровольная.",
    co:"%k — участие платное, места ограничены.",
    or:"%k проводится согласно регламенту. Форма одежды по списку.",
    km:"%k. Приходите, если хочется; не приходите, если не хочется.",
    ra:"%k. Приходи, брат, всем хватит.",
    hf:"%k. Ваше участие повысит рейтинг доверия."
  }
};
function chronWave(){
  const w=(typeof G!=="undefined"&&G.opts&&G.opts.wave)||"gt";
  return (typeof HULL_MAKER!=="undefined"&&HULL_MAKER[w])?w:"gt";
}
function chronWaveSet(by){
  if(typeof HULL_MAKER!=="undefined"&&!HULL_MAKER[by])return chronWave();
  if(typeof G!=="undefined"&&G.opts)G.opts.wave=by;
  return by;
}
function chronWaveNext(){
  const k=MAKER_KEYS,i=k.indexOf(chronWave());
  return chronWaveSet(k[(i+1)%k.length]);
}
/* строка события в заданной волне */
function chronSay(L,wave){
  wave=wave||chronWave();
  const T=CHRON_SAY[L.kind];
  if(!T)return "";
  let s=T[wave]||T.gt;
  const who=(typeof POWERS!=="undefined"&&POWERS[MAKER_KEYS[L.p]])?POWERS[MAKER_KEYS[L.p]].ru:"держава";
  /* `%b` — вторая сторона: у ноты и у войны их всегда две, и называть надо
     обеих, иначе строка врёт умолчанием */
  const bi=(L.args&&typeof L.args.b==="number")?L.args.b:-1;
  const bru=(bi>=0&&typeof POWERS!=="undefined"&&POWERS[MAKER_KEYS[bi]])?POWERS[MAKER_KEYS[bi]].ru:"соседа";
  const k=L.args&&L.args.k;
  const kru=k?(CHRON_INC_RU[k]||CHRON_ARC_RU[k]||CHRON_RITE_RU[k]||k):"";
  s=s.split("%p").join(who).split("%b").join(bru)
     .split("%s").join(L.sys||"—").split("%k").join(kru)
     .split("%n").join(String(L.N));
  return s;
}
/* последние строки сводки N в выбранной волне: это и есть «повернуть ручку» */
function chronWaveLines(N,wave,max){
  /* позор (M385): волна молчит. Не «говорит другое» — молчит, и это слышно
     лучше любых слов */
  if(typeof powWaveSilent==="function"&&powWaveSilent(wave||chronWave()))return [];
  const st=chronState();
  if(N===undefined)N=st.N;
  const out=[];
  for(let i=st.lines.length-1;i>=0&&out.length<(max||6);i--){
    const L=st.lines[i];
    if(L.N!==N)continue;
    const s=chronSay(L,wave);
    if(s)out.push(s);
  }
  return out;
}
/* один заголовок волны: у каждой державы своя подпись эфира */
function chronWaveHead(wave,N){
  wave=wave||chronWave();
  const P=(typeof POWERS!=="undefined")?POWERS[wave]:null;
  const st=chronState();
  if(N===undefined)N=st.N;
  return (P?P.ru.toUpperCase():"ЭФИР")+" · СВОДКА "+((N|0)%1000);
}

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
    if(o>=0){P[o].hold++;P[o].home=(P[o].home|0)+1;}
  }
  return {N:-1,powers:P,systems:S,wars:[],ults:[],lines:[],dir:null,season:null,_keys:CHRON._keys,off:CHRON.off|0};
}
/* ── ход одной сводки (§16.2) ── */
function chronStep(st,N){
  const rr=(a,b)=>hashi(N,a,(b|0)^CHRON_SEED);           /* целый бросок */
  /* 1 ведомость игроков (M376) входит в шаг 5 как давление; 2 циркуляр (M381)
     здесь; 3 Директор (M371) следом. */
  if(typeof circApply==="function")circApply(st,N);
  if(typeof chronDirector==="function")chronDirector(st,N);
  /* 4 агенты ходят по семенному порядку: каждый делает один ход — и знают,
     с кем граничат (M412): ссора и война идут к соседу */
  if(typeof chronTouch==="function")st._touch=chronTouch(st);
  const order=[0,1,2,3,4,5].sort((a,b)=>(rr(a,7)%1000)-(rr(b,7)%1000));
  for(const i of order){
    if(typeof chronAgentMove==="function")chronAgentMove(st,N,i,rr);
  }
  /* 4a ноты со сроком (M386): пишутся после ходов и разрешаются до фронтов —
     война по просроченной ноте должна двигать фронт в ту же сводку */
  if(typeof chronUltStep==="function")chronUltStep(st,N,rr);
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
    /* напряжение державы остывает долей, а не тремя единицами: при двух
       происшествиях на сводку −3 держало всех у тысячи навсегда (M412) */
    P.tension=clampi(P.tension-(P.tension/12|0)-2,0,1000);
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
    /* ── рука людей (шаг 1, §16.2) ──
       Ведомость сводки — единственное, чего клиент сам знать не может. Оборона,
       расчистка и стройка в этой системе тянут бросок к её хозяину, но не
       больше чем на четверть: одну систему на сводку удержать можно, войну
       повернуть нельзя (§7.4). */
    if(typeof warPressure==="function"){
      const press=warPressure(st,N,from,to,k);
      if(press>0&&(rr(from*3+to,0x77)%1000)<press)continue;
    }
    /* §15: ниже трети своего дома держава не падает — она «выживает», а не
       исчезает, иначе месяц без игрока кончается пятью державами */
    if(st.powers[to].hold<=((st.powers[to].home*3/10)|0))continue;
    /* фронт идёт по границе: берём только то, что соседствует с наступающим */
    if(!chronBorders(st,k,from))continue;
    /* дом держат (M412): в шести секторах от своего дома защитник отбивает
       треть попыток — фронты ходят по окраинам, а не съедают дома за
       неделю; без этого сильный ел слабого до пола и там оставался */
    if(chronHomeNear(k,to)&&(rr(from*5+to,0x0DE)%1000)<350)continue;
    S.owner=from;S.since=N;S.front=1;
    st.powers[to].hold--;st.powers[from].hold++;
    chronLine(st,N,"take",from,k,{from:to});
    return true;
  }
  return false;
}
function chronHomeNear(k,i){
  const p=k.split(","),dx=(p[0]|0)-CHRON_HOME[i][0],dy=(p[1]|0)-CHRON_HOME[i][1];
  return dx*dx+dy*dy<=36;
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
  /* ноты со сроком (M386) входят в хэш: расхождение по сроку — это расхождение
     по тому, будет ли завтра война */
  for(const u of (st.ults||[])){mix(u.a*8+u.b+1);mix(u.t0+2);}
  /* Директор входит в хэш: расхождение по напряжению — такое же расхождение,
     как по владениям, и молчать о нём нельзя (D06) */
  if(st.dir){
    mix(st.dir.tens+1);mix(st.dir.quiet+1);mix(st.dir.peak+1);
    for(const a of st.dir.arcs)mix(a.p*32+a.stage*4+(a.t0&3)+1);
    mix(st.dir.rites.length+1);
  }
  /* сезон из циркуляра (M412) входит в хэш: он двигает цель напряжения */
  if(st.season&&st.season.s)mix((st.season.m|0)*4096+(st.season.s.tension|0)+1);
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
  /* `home` — тоже в клон (M412): без него пол «треть дома» после кэша считался
     от undefined, то есть не работал никогда, а повтор от кэша расходился с
     повтором от нуля ровно на этом */
  const P=st.powers.map(p=>({hold:p.hold,home:p.home|0,need:{ore:p.need.ore,goods:p.need.goods,hulls:p.need.hulls,link:p.need.link},
    rel:p.rel.slice(),str:p.str,tension:p.tension,arc:p.arc}));
  const D=st.dir?{quiet:st.dir.quiet|0,peak:st.dir.peak|0,calm:st.dir.calm|0,tens:st.dir.tens|0,
    last:Object.assign({},st.dir.last),
    arcs:st.dir.arcs.map(a=>({p:a.p,kind:a.kind,t0:a.t0,stage:a.stage})),
    rites:st.dir.rites.map(r=>({kind:r.kind,p:r.p,t0:r.t0}))}:null;
  return {N:st.N,powers:P,systems:S,wars:st.wars.map(w=>({a:w.a,b:w.b,t0:w.t0})),
    ults:(st.ults||[]).map(u=>({a:u.a,b:u.b,t0:u.t0})),
    lines:st.lines.slice(),dir:D,off:st.off|0,
    season:st.season?{m:st.season.m|0,n:st.season.n|0,s:st.season.s}:null};
}
/* ── состояние на сейчас: закрытые сводки из кэша, открытая — поверх ──
   D01/D02: кэшируется и пишется на диск только состояние после последней
   ЗАКРЫТОЙ сводки (N−1); открытая шагается поверх него при каждом вопросе —
   её ведомость ещё растёт. До M412 кэшем была открытая сводка: она шагалась
   один раз с той ведомостью, что была на руках в первую секунду, и никогда
   больше; клиенты расходились по тому, кто когда впервые посчитал, а рука
   людей (M376) в повтор почти не попадала. */
let CHRON_BASE=null;     /* состояние после сводки N−1 */
let CHRON_STAMP=0;       /* растёт с каждой приехавшей ведомостью и циркуляром */
let CHRON_BUSY=0;
/* заморозка — для наборов (90-harness): состояние отдаётся как есть, ведомости
   его не сбрасывают. Игра этого флага не ставит никогда */
let CHRON_FREEZE=false;
function chronState(N){
  if(N===undefined)N=chronNow();
  /* ── повтор не зовёт себя ──
     Любой вызов `chronState()` ИЗНУТРИ шага — это повтор внутри повтора, то
     есть бесконечная рекурсия. Такое уже случилось однажды (0.385.0: курс
     державы спросил у летописи, идёт ли переворот). Правило: внутри шага
     состояние передаётся параметром; предохранитель ниже — на случай, когда
     кто-то опять забудет. */
  if(CHRON_BUSY)return CHRON;
  if(CHRON_FREEZE&&CHRON.powers)return CHRON;
  if(CHRON.powers&&CHRON.N===N&&CHRON.stamp===CHRON_STAMP)return CHRON;
  CHRON_BUSY=1;
  try{
    if(!(CHRON_BASE&&CHRON_BASE.N===N-1)){
      let base=null;
      if(CHRON_BASE&&CHRON_BASE.N<=N-1)base=CHRON_BASE;
      else{const c=chronLoad();if(c&&c.N<=N-1)base=c;}
      CHRON_BASE=chronReplay(N-1,base);
      chronSave(CHRON_BASE);
    }
    const st=chronClone(CHRON_BASE);
    chronStep(st,N);
    st.stamp=CHRON_STAMP;
    CHRON=st;CHRON._keys=chronKeys();
  }finally{CHRON_BUSY=0;}
  return CHRON;
}
/* ведомость или циркуляр за сводку n приехали после того, как n уже шагали:
   всё от n и дальше считается заново. Это и есть рука людей в повторе. */
function chronInvalidate(n){
  if(CHRON_FREEZE)return;
  CHRON_STAMP++;
  if(CHRON_BASE&&(n|0)<=CHRON_BASE.N){CHRON_BASE=null;chronForget();}
  CHRON.powers=null;CHRON.N=-1;
}
/* забыть кэш состояния на диске, не трогая ведомости, циркуляры и часы */
function chronForget(){
  try{
    const o=JSON.parse(localStorage.getItem(CHRON_KEY)||"null");
    if(!o||typeof o!=="object")return;
    delete o.p;delete o.s;delete o.w;delete o.u;delete o.d;delete o.se;o.N=-1;
    localStorage.setItem(CHRON_KEY,JSON.stringify(o));
  }catch(e){}
}
/* ── кэш в своём ключе, а не в сохранении (§16.4) ── */
function chronSave(st){
  try{
    /* ключ один на всё военное (§16.4): здесь же лежат ведомости и смещение
       часов от `14b-war-net`. Пишем свои поля и не трогаем чужие */
    let keep={};
    try{const q=JSON.parse(localStorage.getItem(CHRON_KEY)||"null");if(q&&typeof q==="object")keep=q;}catch(e){}
    /* смещение часов пишет только провод (`warClock`): у одного поля один
       хозяин, иначе они затирают друг друга по очереди */
    const o={v:1,N:st.N,off:(typeof keep.off==="number")?keep.off:(st.off|0),led:keep.led,
      p:st.powers.map(p=>[p.hold,p.str,p.tension,p.rel.slice(),
        [p.need.ore,p.need.goods,p.need.hulls,p.need.link]]),
      s:chronKeys().map(k=>st.systems[k].owner+","+st.systems[k].since+","+st.systems[k].front).join("|"),
      w:st.wars.map(w=>[w.a,w.b,w.t0]),
      u:(st.ults||[]).map(u=>[u.a,u.b,u.t0]),
      d:st.dir?{q:st.dir.quiet|0,pk:st.dir.peak|0,cm:st.dir.calm|0,t:st.dir.tens|0,l:st.dir.last,
        a:st.dir.arcs.map(a=>[a.p,a.kind,a.t0,a.stage]),
        r:st.dir.rites.map(r=>[r.kind,r.p,r.t0])}:null,
      se:st.season||null};
    /* циркуляры — чужое поле того же ключа (12aw): не трогаем */
    if(keep.circ)o.circ=keep.circ;
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
    st.ults=(o.u||[]).map(u=>({a:u[0]|0,b:u[1]|0,t0:u[2]|0}));
    st.dir=o.d?{quiet:o.d.q|0,peak:o.d.pk|0,calm:o.d.cm|0,tens:o.d.t|0,last:o.d.l||{},
      arcs:(o.d.a||[]).map(a=>({p:a[0]|0,kind:a[1],t0:a[2]|0,stage:a[3]|0})),
      rites:(o.d.r||[]).map(r=>({kind:r[0],p:r[1]|0,t0:r[2]|0}))}:null;
    st.season=(o.se&&typeof o.se==="object"&&typeof chronSeasonValid==="function"&&chronSeasonValid(o.se.s))
      ?{m:o.se.m|0,n:o.se.n|0,s:o.se.s}:null;
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
/* ноты со сроком (M386): их спрашивает станция, чтобы показать число */
function chronUlts(){return chronState().ults||[];}
function chronUltBetween(a,b){
  for(const u of chronUlts())if((u.a===a&&u.b===b)||(u.a===b&&u.b===a))return u;
  return null;
}
/* воюют ли эти двое прямо сейчас — спрашивает карта, чтобы нарисовать фронт */
function chronWarBetween(a,b){
  if(a<0||b<0||a===b)return false;
  for(const w of chronState().wars)
    if((w.a===a&&w.b===b)||(w.a===b&&w.b===a))return true;
  return false;
}

/* ══════════════ выборы и сигнал сбора (M378, §11.2, §14) ══════════════
   Две вещи, обе на одну кнопку и обе без единого слова от игрока.

   **Выборы.** Раз в месяц (сто двадцать сводок) каждая держава решает, чем ей
   заниматься дальше. Вопрос и два ответа берутся из зерна месяца, а не
   придумываются: значит они одинаковы у всех, и их можно назвать вслух, не
   сговариваясь. Голос — один на учётную запись на вопрос, считает сервер.
   Итог входит в летопись КУРСОМ: победивший ответ смещает ходы этой державы на
   месяц. Не «игрок правит миром», а «толпа подтолкнула, и это видно на карте».

   **Сигнал сбора.** «Всем сказать в игре» без чата: три поля — система, сводка,
   и всё. Ни имени, ни текста. Виден всем, отвечается одной кнопкой, счётчик
   «ответили: 23». Один сигнал на борт в сутки. Это и есть весь созыв флота на
   «Ревизию» (§11.2), и больше ничего для него не нужно. */
const VOTE_MONTH=120;             /* сводок в месяце выборов */
const VOTE_Q=[
  {q:"course",ru:"курс на месяц",picks:[["war","держать фронт"],["build","строить и торговать"]]},
  {q:"road",  ru:"чем заняться",  picks:[["ore","добывать"],["link","связывать узлы"]]},
  {q:"door",  ru:"кого пускать",  picks:[["open","всех"],["shut","только своих"]]}
];
function voteMonth(N){return Math.floor(((N===undefined?chronNow():N)|0)/VOTE_MONTH);}
/* вопрос месяца для державы: от зерна месяца, значит один и тот же у всех */
function voteQuestion(by,N){
  const m=voteMonth(N),i=MAKER_KEYS.indexOf(by);
  if(i<0)return null;
  const Q=VOTE_Q[hashi(m,i+1,0x0E17)%VOTE_Q.length];
  return {key:"m"+m+"-"+by+"-"+Q.q,ru:Q.ru,picks:Q.picks,by,m};
}
/* ── итог ──
   Считаем по всем ведомостям, что есть на руках: голоса лежат в тех же сводках,
   что и дела. Нет ведомостей — нет и итога, и держава идёт своим ходом. */
function voteTally(key){
  const out={};
  if(typeof warLed!=="function")return out;
  const L=warLed();
  for(const n in L){
    const v=L[n]&&L[n].__votes;
    if(!v||!v[key])continue;
    for(const p in v[key].p)out[p]=(out[p]||0)+(v[key].p[p]|0);
  }
  return out;
}
function voteWinner(by,N){
  const Q=voteQuestion(by,N);
  if(!Q)return null;
  const t=voteTally(Q.key);
  let best=null,bn=0;
  for(const p in t)if(t[p]>bn){bn=t[p];best=p;}
  return best?{pick:best,n:bn,q:Q}:null;
}
/* курс державы: то, что подтолкнула толпа. Читает `chronAgentMove` — но только
   как СМЕЩЕНИЕ хода, а не как приказ: держава остаётся собой. */
function voteCourse(i,N){
  const by=MAKER_KEYS[i];
  const w=by?voteWinner(by,N):null;
  return w?w.pick:null;
}
function voteCast(by,pick,N){
  const Q=voteQuestion(by,N);
  if(!Q||typeof warCall!=="function")return Promise.resolve(false);
  return warCall("vote",{n:(N===undefined?chronNow():N),q:Q.key.slice(0,24),pick})
    .then(r=>{
      if(r&&r.ok){say("ГОЛОС ПОДАН",120);return true;}
      say((r&&r.error)?r.error.toUpperCase():"ГОЛОС НЕ ПРИНЯТ",120);
      return false;
    }).catch(()=>false);
}
/* ── сигнал сбора ── */
let RALLY_CACHE=null;
function rallyList(force){
  if(typeof warCall!=="function")return Promise.resolve([]);
  if(!force&&RALLY_CACHE&&Date.now()-RALLY_CACHE.t<120000)return Promise.resolve(RALLY_CACHE.rows);
  return warCall("rallies",{}).then(r=>{
    const rows=(r&&r.ok&&Array.isArray(r.rows))?r.rows:[];
    RALLY_CACHE={t:Date.now(),rows};
    return rows;
  }).catch(()=>[]);
}
function rallyRows(){return (RALLY_CACHE&&RALLY_CACHE.rows)||[];}
function rallyRaise(at){
  if(typeof warCall!=="function")return Promise.resolve(false);
  const N=chronNow();
  return warCall("rally",{sys:(G.sx|0)+","+(G.sy|0),at:at||(N+2)}).then(r=>{
    if(r&&r.ok){
      RALLY_CACHE=null;
      say("СИГНАЛ СБОРА ПОДНЯТ",140);
      logAdd("tech","Сигнал сбора: сектор "+G.sx+":"+G.sy+" · сводка "+((at||(N+2))%1000));
      return true;
    }
    say((r&&r.error)?r.error.toUpperCase():"СИГНАЛ НЕ ПОДНЯТ",120);
    return false;
  }).catch(()=>false);
}
function rallyJoin(i){
  if(typeof warCall!=="function")return Promise.resolve(false);
  return warCall("join",{i}).then(r=>{
    if(r&&r.ok){RALLY_CACHE=null;say("ОТВЕЧЕНО НА СБОР",120);return true;}
    return false;
  }).catch(()=>false);
}
/* сигналы видны на карте: чип с числом ответивших, без имён и без текста */
function rallyAt(sx,sy){
  const k=(sx|0)+","+(sy|0);
  for(const r of rallyRows())if(r.sys===k)return r;
  return null;
}
/* ── блок на доске: вопрос месяца, итог и сбор ── */
function voteBlock(){
  if(typeof $body==="undefined"||typeof chronOwnerKey!=="function")return;
  const by=chronOwnerKey(G.sx,G.sy)||"gt";
  const Q=voteQuestion(by);
  if(!Q)return;
  const P=(typeof powerOf==="function")?powerOf(by):null;
  const t=voteTally(Q.key);
  $body.appendChild(el("div","sec","ВЫБОРЫ · "+(P?P.ru.toUpperCase():"")+" · "+Q.ru.toUpperCase()+
    " · ОДИН ГОЛОС НА БОРТ"));
  for(const [pick,ru] of Q.picks){
    const r=el("div","row");
    r.appendChild(el("div","nm","<b>"+ru+"</b><s>голосов: "+((t[pick]|0))+"</s>"));
    const b=el("button","act","ГОЛОС");
    b.onclick=()=>{voteCast(by,pick).then(()=>renderTab());};
    r.appendChild(b);
    $body.appendChild(r);
  }
  /* сбор: поднять здесь и ответить на чужой */
  rallyList();
  const rows=rallyRows();
  $body.appendChild(el("div","sec","СИГНАЛ СБОРА · ТРИ ПОЛЯ, НИ ОДНОГО СЛОВА"));
  const rr=el("div","row");
  rr.appendChild(el("div","nm","<b>Поднять сбор здесь</b><s>сектор "+G.sx+":"+G.sy+
    " · через две сводки · один сигнал на борт в сутки</s>"));
  const rb=el("button","act","ПОДНЯТЬ");
  rb.onclick=()=>{rallyRaise().then(()=>renderTab());};
  rr.appendChild(rb);
  $body.appendChild(rr);
  for(let i=0;i<rows.length&&i<6;i++){
    const R=rows[i];
    const row=el("div","row");
    row.appendChild(el("div","nm","<b>Сбор · сектор "+R.sys+"</b><s>сводка "+((R.at|0)%1000)+
      " · ответили: "+(R.yes|0)+"</s>"));
    const b=el("button","act","ОТВЕТИТЬ");
    b.onclick=()=>{rallyJoin(i).then(()=>renderTab());};
    row.appendChild(b);
    $body.appendChild(row);
  }
}

/* ══════════════ девять обрядов и регата (M379, §14) ══════════════
   Обряд — это то, в чём участвует ТОЛПА, и всё, что от неё требуется, — одна
   кнопка. Ни слова, ни имени, ни сговора: счётчик, порог и последствие, которое
   видно на карте или на станции.

   Девять из §14 плюс регата «Ялты» (§16.6). У каждого свой вид дела на сервере
   (`war.php` их принимает и режет потолком), своя цель и своё последствие. Порог
   считается от числа бортов, а не от их упорства: сто записей одного — это один
   борт, и насыщение считает сервер.

   Объявляет обряды Директор (12am-chron-director): пока их меньше трёх, раз в
   несколько сводок появляется новый. Здесь — что они значат и что делают. */
const RITES={
  build:  {ru:"стройка века",  kind:"build",goal:4000,ru2:"нести материал",
           done:"построено бортами",note:"объект встанет и останется навсегда"},
  loan:   {ru:"заём",          kind:"loan", goal:12000,ru2:"купить облигацию",
           done:"подписка закрыта",note:"вернут с надбавкой, если кампания выиграна"},
  subbot: {ru:"субботник",     kind:"clear",goal:400, ru2:"расчистить пояс",
           done:"пояс расчищен",note:"после боя в поясе мусор, и он мешает всем"},
  coupon: {ru:"талоны",        kind:"coup", goal:60,  ru2:"отоварить талон",
           done:"талоны отоварены",note:"бак по талону — один на борт за сводку"},
  quar:   {ru:"карантин",      kind:"med",  goal:300, ru2:"провезти лекарство",
           done:"карантин снят",note:"пикет разворачивает всех, пока не довезут"},
  lost:   {ru:"пропажа",       kind:"scan", goal:200, ru2:"просканировать систему",
           done:"флагман найден",note:"ищут все и без уговора"},
  census: {ru:"перепись",      kind:"cens", goal:80,  ru2:"ответить на вопрос",
           done:"перепись проведена",note:"на волнах «99,7 % довольны»"},
  amnesty:{ru:"амнистия",      kind:"amn",  goal:40,  ru2:"привести дезертира",
           done:"амнистия объявлена",note:"буксир вместо выстрела"},
  reform: {ru:"реформа",       kind:"cens", goal:1,   ru2:"принять к сведению",
           done:"реформа проведена",note:"на бумаге изменилось всё, в небе — ничего"},
  regatta:{ru:"регата",        kind:"reg",  goal:30,  ru2:"пройти круг",
           done:"регата состоялась",note:"только в «Ялте»: там не стреляют"}
};
const RITE_KEYS=Object.keys(RITES);
const RITE_WINDOW=12;                 /* сводок живёт обряд */
/* какие обряды объявлены прямо сейчас (Директор) */
function riteLive(){
  const L=(typeof chronRites==="function")?chronRites():[];
  return L.map(r=>({key:RITE_KEYS.indexOf(r.kind)>=0?r.kind:riteMap(r.kind),p:r.p,t0:r.t0}))
          .filter(r=>!!RITES[r.key]);
}
/* Директор называет обряды своими словами (М371); здесь их имена сходятся */
function riteMap(k){
  return ({regatta:"regatta",census:"census",parade:"reform",subbotnik:"subbot",
    relief:"quar",memorial:"amnesty"})[k]||k;
}
/* ── счётчик ──
   Сумма по ведомостям за окно обряда. Ведомостей нет — счётчик пуст, и это
   честно: без провода обряд не идёт, а игра идёт. */
function riteCount(key,t0){
  const R=RITES[key];
  if(!R||typeof warLed!=="function")return {q:0,a:0};
  const L=warLed(),N=(typeof chronNow==="function")?chronNow():0;
  const from=(t0===undefined)?N-RITE_WINDOW:t0;
  let q=0,a=0;
  for(const n in L){
    if((n|0)<from||(n|0)>N)continue;
    const body=L[n];
    for(const sys in body){
      if(sys==="__votes")continue;
      const cell=body[sys][R.kind];
      if(!cell)continue;
      q+=cell.q|0;
      a=Math.max(a,(cell.a&&cell.a.length)|0);
    }
  }
  return {q,a};
}
function riteDone(key,t0){
  const R=RITES[key];
  if(!R)return false;
  return riteCount(key,t0).q>=R.goal;
}
function ritePct(key,t0){
  const R=RITES[key];
  if(!R)return 0;
  return Math.min(100,Math.round(riteCount(key,t0).q/R.goal*100));
}
/* ── вложиться ──
   Одна кнопка и ничего больше. Что именно она стоит — зависит от обряда: где-то
   это груз из трюма, где-то кредиты, где-то просто «я здесь был». */
function riteGive(key,qty){
  const R=RITES[key];
  if(!R||typeof warPut!=="function")return Promise.resolve(false);
  qty=Math.max(1,qty|0);
  /* стройка берёт материал, заём — кредиты, остальное — само дело */
  if(key==="build"){
    const have=(G.cargo.alloy|0);
    if(have<qty){say("НЕЧЕГО НЕСТИ",120);return Promise.resolve(false);}
    G.cargo.alloy=have-qty;
  }else if(key==="loan"){
    if(G.credits<qty){say("НЕ ХВАТАЕТ КРЕДИТОВ",120);return Promise.resolve(false);}
    G.credits-=qty;
    G.bonds=(G.bonds|0)+qty;
  }
  return warPut(R.kind,qty).then(ok=>{
    if(ok){
      say(R.ru.toUpperCase()+" · ЗАПИСАНО",120);
      logAdd("tech",R.ru+": вложено "+qty);
    }else say("СЕРВЕР НЕ ПРИНЯЛ",120);
    return ok;
  });
}
/* ── последствия ──
   Каждое последствие читается из счётчика, а не хранится: значит оно одинаково
   у всех, кто видел те же ведомости, и не требует ни синхронизации, ни доверия
   к клиенту. */
function riteFuelMul(){
  /* талоны: бак по талону — четверть цены, один раз за сводку */
  if(!riteDone("coupon"))return 1;
  const N=(typeof chronNow==="function")?chronNow():0;
  if((G.coupN|0)===N)return 1;
  return .25;
}
function riteFuelUsed(){
  const N=(typeof chronNow==="function")?chronNow():0;
  G.coupN=N;
}
function ritePirateMul(){
  /* субботник и амнистия: в системе на сводку тише */
  let m=1;
  if(riteDone("subbot"))m*=.5;
  if(riteDone("amnesty"))m*=.7;
  return m;
}
function riteQuarantine(){
  /* карантин: пока лекарство не довезли, пикет разворачивает всех */
  const live=riteLive().some(r=>r.key==="quar");
  return live&&!riteDone("quar");
}
/* заём: выплата, когда кампания кончилась. Выиграна — с надбавкой, нет — потеря */
function riteLoanSettle(){
  const b=G.bonds|0;
  if(!b)return 0;
  if(!riteDone("loan"))return 0;
  const wars=(typeof chronWars==="function")?chronWars().length:0;
  const win=wars===0;                       /* войн нет — значит кампания закрыта */
  G.bonds=0;
  const pay=win?Math.round(b*1.5):0;
  /* деньги входят одной воронкой (`earn`), иначе их не видят ни дом, ни
     кооператив, и сеть «доход идёт одной воронкой» краснеет по делу */
  if(pay){earn(pay,"заём");tell("kill","Заём выплачен: "+pay+" кр","ЗАЁМ\nвыплачено "+pay+" кр");}
  else tell("warn","Заём не выплачен: кампания не выиграна","ЗАЁМ\nсгорел");
  return pay;
}
/* ── блок на доске ── */
function riteBlock(){
  if(typeof $body==="undefined")return;
  const live=riteLive();
  if(!live.length)return;
  $body.appendChild(el("div","sec","ОБРЯДЫ · ОДНА КНОПКА, НИ ОДНОГО СЛОВА"));
  for(const L of live){
    const R=RITES[L.key];
    const P=(typeof powerOf==="function")?powerOf(MAKER_KEYS[L.p]):null;
    const c=riteCount(L.key,L.t0);
    const done=c.q>=R.goal;
    const r=el("div","row");
    r.appendChild(el("div","nm","<b>"+R.ru.toUpperCase()+(P?" · "+P.ru:"")+"</b><s>"+
      R.note+"<br>"+(done?(R.done+": "+c.q):("собрано "+c.q+" из "+R.goal+
      " · бортов "+c.a))+"</s>"));
    if(!done){
      const b=el("button","act"+(L.key==="build"||L.key==="loan"?"":" gold"),R.ru2.toUpperCase());
      b.disabled=(L.key==="regatta"&&!(typeof yaltaHere==="function"&&yaltaHere()));
      b.onclick=()=>{
        const q=(L.key==="build")?10:(L.key==="loan"?500:1);
        riteGive(L.key,q).then(()=>renderTab());
      };
      r.appendChild(b);
    }else r.appendChild(el("div","qt","СДЕЛАНО"));
    $body.appendChild(r);
  }
  if((G.bonds|0)>0){
    const r=el("div","row");
    r.appendChild(el("div","nm","<b>Облигации на руках</b><s>вложено "+(G.bonds|0)+
      " кр · вернут с надбавкой, если кампания выиграна</s>"));
    const b=el("button","act","ПРЕДЪЯВИТЬ");
    b.onclick=()=>{riteLoanSettle();renderTab();};
    r.appendChild(b);
    $body.appendChild(r);
  }
}

/* ══════════════ «РЕВИЗИЯ» (M380, §11.2, D13) ══════════════
   Не держава и не пират. Флагман времён «Долгого Хода», автоматический,
   исполняющий приказ, который никто не отменил: «восстановить план». Он и есть
   антагонист саги (§8), и он приходит туда, где карта изменилась сильнее всего.

   Зачем он нужен. Толпа может перекроить четверть галактики за неделю (§11.1) —
   и на этом упирается в потолок. «Ревизия» — это потолок с лицом: пока она
   стоит в области, вклад толпы там делится на четыре, а сбитая — ЗАКРЕПЛЯЕТ
   изменения области в летописи. Единственная строка, которую не переврёт ни
   одна волна.

   Почему один не может, а толпа может — без всякого live-мультиплеера:

   · щит восстанавливается быстрее, чем стреляет лучший одиночка (2.5×);
   · урон складывается на СЕРВЕРЕ по минутам и по учётным записям, а корпус
     там не восстанавливается вовсе;
   · значит трое сильных или восемь средних В ОДНУ СВОДКУ пробивают щит, и это
     видно каждому из них как ведомость «в бою бортов: 7» и как призраки чужих
     корпусов рядом;
   · и всё-таки один может: щит импульсный и раз в десять минут сам падает на
     двадцать секунд. Сто таких окон — семнадцать часов. Возможно. Очень тяжело.

   Никто никого не видит в реальном времени. Всё, что связывает бортов, — это
   счётчики сводки и семя, из которого рисуется корпус. */
const BOSS_HULL=720000;          /* тридцать минут огня толпы из восьми */
const BOSS_SHIELD=90000;         /* поле, которое надо продавить за сводку */
const BOSS_REGEN=7500;           /* восстановление поля за минуту: 2.5× лучшего одиночки */
const BOSS_WIN=20;               /* секунд окна, когда поле само падает */
const BOSS_EVERY=600;            /* и раз в столько секунд оно падает */
const BOSS_TRIG=25;              /* процентов области, изменившихся за трое суток */
const BOSS_SPAN=12;              /* сводок в «трёх сутках» */
const BOSS_LIFE=40;              /* сводок стоит, если не сбить */
/* ── где он ──
   Область — это дом державы и полоса вокруг него (CHRON_HOME). Считаем, где за
   последние двенадцать сводок сменилось больше четверти систем, и туда он и
   идёт. Считается это из летописи, значит одинаково у всех и не хранится. */
function bossArea(st,N){
  st=st||chronState();
  N=(N===undefined)?st.N:N;
  let best=-1,bestPct=BOSS_TRIG;
  for(let i=0;i<6;i++){
    let tot=0,ch=0;
    for(const k of chronKeys()){
      const p=k.split(","),x=p[0]|0,y=p[1]|0;
      const dx=x-CHRON_HOME[i][0],dy=y-CHRON_HOME[i][1];
      if(dx*dx+dy*dy>36)continue;                 /* дом и полоса вокруг него */
      tot++;
      const S=st.systems[k];
      if(S&&N-S.since<=BOSS_SPAN)ch++;
    }
    if(!tot)continue;
    const pct=Math.round(ch*100/tot);
    if(pct>bestPct){bestPct=pct;best=i;}
  }
  return best<0?null:{i:best,pct:bestPct,x:CHRON_HOME[best][0],y:CHRON_HOME[best][1]};
}
function bossHere(){
  const A=bossActive();
  if(!A)return false;
  const dx=(G.sx|0)-A.x,dy=(G.sy|0)-A.y;
  return dx*dx+dy*dy<=36;
}
/* ── сколько по нему уже отстреляли ──
   Сумма по ведомостям с той сводки, когда он пришёл. Корпус на сервере не
   восстанавливается — значит и здесь не восстанавливается. */
function bossDamage(t0){
  if(typeof warLed!=="function")return {q:0,a:0};
  const L=warLed(),N=(typeof chronNow==="function")?chronNow():0;
  let q=0,a=0;
  for(const n in L){
    if((n|0)<t0||(n|0)>N)continue;
    for(const sys in L[n]){
      if(sys==="__votes")continue;
      const cell=L[n][sys].boss;
      if(!cell)continue;
      q+=cell.q|0;
      a=Math.max(a,(cell.a&&cell.a.length)|0);
    }
  }
  return {q,a};
}
/* ── он здесь или его нет ── */
function bossActive(){
  const st=chronState();
  const A=bossArea(st,st.N);
  if(!A)return null;
  const t0=st.N-((st.N-1)%BOSS_LIFE);            /* окно, в котором он стоит */
  const d=bossDamage(t0);
  const hull=Math.max(0,BOSS_HULL-d.q);
  return {i:A.i,x:A.x,y:A.y,pct:A.pct,t0,hull,dmg:d.q,ships:d.a,
    dead:hull<=0,pinned:hull<=0};
}
/* окно щита: раз в десять минут поле само падает на двадцать секунд. Часы те
   же, что у сводки, значит окно у всех одно и то же */
function bossWindow(){
  const t=Math.floor((Date.now()+(CHRON.off|0))/1000);
  return (t%BOSS_EVERY)<BOSS_WIN;
}
/* щит: пробит, если за прошлую сводку по нему били быстрее, чем он растёт */
function bossShieldDown(A){
  if(!A)return false;
  if(bossWindow())return true;
  const per=A.dmg/Math.max(1,(chronNow()-A.t0+1)*360);   /* урона в минуту */
  return per>BOSS_REGEN;
}
/* ── его корпус в системе ──
   Рисуется тем же генератором, что все: флагманская выпечка ренегата (12i) и
   вдвое крупнее. Отдельного арта у него нет и не нужно. */
function bossShip(){
  const A=bossActive();
  if(!A||A.dead)return null;
  const id="revizia";
  if(!NPC_SHIPS[id])NPC_SHIPS[id]={name:id,seed:0x0E7151,hcls:"warship",col:"#c9c9d4",
    hull:BOSS_HULL,cargo:0,fuel:999,thr:.8,cls:"«Ревизия»",by:"gt"};
  return {id,A};
}
let BOSS_ACC=0,BOSS_SENT=0;
/* урон копится на клиенте и уходит на сервер раз в минуту: по минутам его и
   складывают (§11.2), а каждый выстрел слать — это не игра, а флуд */
function bossHit(dmg){
  const A=bossActive();
  if(!A||A.dead)return;
  BOSS_ACC+=Math.max(0,dmg|0);
  const now=Date.now();
  if(now-BOSS_SENT<60000||BOSS_ACC<=0)return;
  BOSS_SENT=now;
  const q=Math.min(60000,BOSS_ACC|0);
  BOSS_ACC=0;
  if(typeof warPut==="function")warPut("boss",q,A.x+","+A.y);
}
/* ── строка для игрока ──
   Ни чата, ни списка: ведомость и призраки. Сколько бортов бьётся — единственное,
   что он знает о других, и этого достаточно, чтобы не чувствовать себя одному. */
function bossLine(){
  const A=bossActive();
  if(!A)return "";
  if(A.dead)return "«РЕВИЗИЯ» СБИТА · ИЗМЕНЕНИЯ ЗАКРЕПЛЕНЫ";
  const pc=Math.round(A.hull*100/BOSS_HULL);
  return "«РЕВИЗИЯ» · КОРПУС "+pc+" % · В БОЮ БОРТОВ: "+Math.max(1,A.ships)+
    (bossShieldDown(A)?" · ПОЛЕ ПРОБИТО":" · ПОЛЕ ДЕРЖИТ");
}
/* пока он стоит, вклад толпы в этой области делится на четыре (§11.2) */
function bossPressMul(sx,sy,area){
  const A=area||bossActive();
  if(!A||A.dead)return 1;
  const dx=(sx|0)-A.x,dy=(sy|0)-A.y;
  return (dx*dx+dy*dy<=36)?.25:1;
}

/* ══════════════ циркуляры и конституция (M381, §12, D18) ══════════════
   Автор: «ты будешь как регулятор всего, а без тебя там всё происходит само».
   Значит нужен слой, который (а) действует редко и сверху, (б) НИКОГДА не может
   тронуть то, что игрок нажил, и (в) проверяется машиной, а не совестью.

   Циркуляр — запись в той же летописи, только автор у неё не зерно, а регулятор
   (это Клод, раз в день или раз в неделю, через ssh). Клиенты забирают циркуляры
   вместе с ведомостями и повторяют историю с ними: значит мир у всех один, а
   регулятору не нужно быть в сети.

   **Конституция** (`docs/WAR-CONSTITUTION.md`) — это не пожелание, а список,
   который проверяет `circValid`. Что можно: веса нужд ±30 %, названные события,
   тексты волн на день, ручки §11.5 ±20 %, сезон. Что нельзя НИКОГДА: трогать
   вещи и деньги игроков, стирать эпизоды, убивать людей из книжек, отменять
   «закреплено». Проверка одна и та же на клиенте и в CLI: циркуляр, который её
   не прошёл, не применяется вовсе — и это единственный способ сделать так,
   чтобы регулятор не мог сам себя переубедить. */
const CIRC_EVENTS=["election","strike","embargo","ultimatum","truce","build","revizia"];
const CIRC_DIALS=["sat","ceiling","bosstrig","leftlife","rally"];
const CIRC_MAX_TEXT=280;
function circAll(){
  if(typeof warStore!=="function")return [];
  const o=warStore();
  return Array.isArray(o.circ)?o.circ:[];
}
function circPut(list){
  if(typeof warStoreSet!=="function")return;
  const keep=list.filter(c=>circValid(c)).slice(-24);
  warStoreSet({circ:keep});
}
/* ── проверка по конституции ──
   Каждая строка ниже — это строка из `docs/WAR-CONSTITUTION.md`, и расходиться
   им нельзя: тест сверяет одно с другим. */
function circValid(c){
  if(!c||typeof c!=="object")return false;
  if(!(typeof c.n==="number"&&c.n>=0))return false;
  /* веса нужд: только шесть держав, только четыре нужды, только ±30 % */
  if(c.need){
    if(typeof c.need!=="object")return false;
    for(const by in c.need){
      if(typeof HULL_MAKER==="undefined"||!HULL_MAKER[by])return false;
      const w=c.need[by];
      if(typeof w!=="object")return false;
      for(const k in w){
        if(["ore","goods","hulls","link"].indexOf(k)<0)return false;
        const v=+w[k];
        if(!isFinite(v)||v<-30||v>30)return false;
      }
    }
  }
  /* названные события — только из списка, и только про существующие державы */
  if(c.event){
    if(CIRC_EVENTS.indexOf(c.event.kind)<0)return false;
    if(c.event.p!==undefined&&(typeof HULL_MAKER==="undefined"||!HULL_MAKER[MAKER_KEYS[c.event.p|0]]))return false;
  }
  /* ручки §11.5 — не больше пятой части в любую сторону */
  if(c.dials){
    for(const k in c.dials){
      if(CIRC_DIALS.indexOf(k)<0)return false;
      const v=+c.dials[k];
      if(!isFinite(v)||v<-20||v>20)return false;
    }
  }
  /* тексты волн: шесть строк, короткие, без переносов и без адресатов */
  if(c.say){
    for(const by in c.say){
      if(typeof HULL_MAKER==="undefined"||!HULL_MAKER[by])return false;
      const t=c.say[by];
      if(typeof t!=="string"||!t.length||t.length>CIRC_MAX_TEXT)return false;
      if(/[<>@]/.test(t))return false;
    }
  }
  /* сезон — по своей же проверке (M371) */
  if(c.season&&!(typeof chronSeasonValid==="function"&&chronSeasonValid(c.season)))return false;
  /* и ни одного поля, которого конституция не знает: запрет здесь именно в
     ЭТОЙ строке — иначе завтра появится «ещё одно маленькое поле» */
  for(const k in c)
    if(["n","need","event","dials","say","season","who","ru"].indexOf(k)<0)return false;
  return true;
}
/* ── что циркуляр делает в шаге 2 повтора (§16.2) ── */
function circFor(N){
  let best=null;
  for(const c of circAll())if(c.n<=N&&(!best||c.n>best.n))best=c;
  return best;
}
function circApply(st,N){
  const c=circFor(N);
  if(!c||!circValid(c))return null;
  /* сезон — стоячее (M412): он про месяц и живёт в состоянии летописи, пока
     его не сменит следующий циркуляр; Директор читает его через chronSeason */
  if(c.season&&typeof chronMonth==="function"){
    const m=chronMonth(c.n|0);
    if(!st.season||st.season.n!==(c.n|0))st.season={m,n:c.n|0,s:c.season};
  }
  /* нужды и событие — разово, в ту сводку, которой циркуляр помечен
     (конституция: «применяется от неё вперёд», а не каждую сводку заново: до
     M412 один и тот же циркуляр складывал +30 % за сводку до тысячи и одним
     перемирием кончал все войны навсегда) */
  if((c.n|0)!==(N|0))return c;
  if(c.need)for(const by in c.need){
    const i=MAKER_KEYS.indexOf(by);
    if(i<0)continue;
    for(const k in c.need[by])
      st.powers[i].need[k]=clampi(st.powers[i].need[k]+((+c.need[by][k]*10)|0),0,1000);
  }
  if(c.event&&c.event.kind==="truce"){
    /* перемирие с датой: войны кончаются, но систем никто не отдаёт */
    for(let i=st.wars.length-1;i>=0;i--){
      const w=st.wars[i];
      st.wars.splice(i,1);
      st.powers[w.a].rel[w.b]=clampi(st.powers[w.a].rel[w.b]+300,-1000,1000);
      st.powers[w.b].rel[w.a]=st.powers[w.a].rel[w.b];
    }
    chronLine(st,N,"truce",c.event.p|0,null,{b:(c.event.p|0)});
  }
  if(c.event&&c.event.kind==="embargo"&&c.event.p!==undefined){
    const i=c.event.p|0;
    st.powers[i].need.goods=clampi(st.powers[i].need.goods-120,0,1000);
  }
  if(c.event&&c.event.kind==="ultimatum"&&c.event.p!==undefined){
    const i=c.event.p|0;
    st.powers[i].tension=clampi(st.powers[i].tension+200,0,1000);
  }
  return c;
}
/* ── бумага ──
   Циркуляр виден в игре именно как БУМАГА: у ГЛАВТРАССЫ это циркуляр, у
   Компании пресс-релиз, у Орднунга приказ с номером. Сатира замыкается на самом
   регуляторе, и это правильно: он тоже бумага сверху. */
const CIRC_PAPER={gt:"ЦИРКУЛЯР",co:"ПРЕСС-РЕЛИЗ",or:"ПРИКАЗ",km:"ОБРАЩЕНИЕ",
  ra:"ОБЪЯВЛЕНИЕ",hf:"ОБНОВЛЕНИЕ"};
function circPaperName(by){return CIRC_PAPER[by]||"ЦИРКУЛЯР";}
function circSay(by,N){
  const c=circFor(N===undefined?chronNow():N);
  if(!c||!c.say)return "";
  return c.say[by]||"";
}
function circBlock(){
  if(typeof $body==="undefined")return;
  const c=circFor(chronNow());
  if(!c)return;
  const by=(typeof chronWave==="function")?chronWave():"gt";
  const P=(typeof powerOf==="function")?powerOf(by):null;
  const t=circSay(by)||(c.ru||"");
  if(!t)return;
  $body.appendChild(el("div","sec",circPaperName(by)+" · СВОДКА "+((c.n|0)%1000)+
    (P?" · "+P.ru.toUpperCase():"")));
  const r=el("div","row");
  r.appendChild(el("div","nm","<b>"+t+"</b><s>бумага сверху; её читают все, и она ничего "+
    "не может отнять — ни вещи, ни эпизода, ни человека</s>"));
  $body.appendChild(r);
}

/* ══════════════ семья механик: ВЛАСТЬ (M385, §15.1) ══════════════
   Держава — не пейзаж: у неё меняются правители, её чистят, от неё откалываются
   и её позорят. Часть этой семьи живёт внутри повтора (чистка отнимает силу,
   наследник обнуляет отношения — 12am-chron-director), потому что она меняет
   само состояние. Здесь то, что видно игроку: перевёрнутый курс, вдвое больше
   дезертиров, молчащая волна и отколовшийся кластер с собственным флагом.

   Ни одно из этих последствий не отнимает у игрока ничего: они меняют то, ЧЬЁ
   вокруг небо и что о нём говорят. */
const POW_COUP=24;         /* шесть суток, пока переворот виден */
const POW_PURGE=24;        /* столько же живёт волна дезертирства */
const POW_SCANDAL=12;      /* трое суток молчащей волны */
const POW_SECEDE=120;      /* месяц откола */
/* ── о состоянии спрашиваем БЕЗ пересчёта ──
   Эти функции зовут и из повтора (курс державы читает `chronAgentMove`), а
   `chronState()` внутри повтора запускает повтор заново — и это бесконечная
   рекурсия, которая в 0.385.0 повесила прогон набора. Поэтому состояние всегда
   передаётся сверху, а chronState зовётся только снаружи. */
function powInc(kind,span,st,N){
  return (typeof chronIncOf==="function")?chronIncOf(kind,span,st,N):null;
}
/* ── переворот ──
   «Правитель меняется вне выборов; курс переворачивается за сводку.» Курс
   выбирала толпа (M378) — переворот его отменяет, и это единственный способ
   отменить её выбор. Взамен толпа получает вопрос заново в следующем месяце. */
function powCoupOn(i,st,N){
  const inc=powInc("coup",POW_COUP,st,N);
  return !!(inc&&inc.p===i);
}
function powCourse(i,N,st){
  const base=(typeof voteCourse==="function")?voteCourse(i,N):null;
  if(!base)return null;
  if(!powCoupOn(i,st,N))return base;
  const Q=(typeof voteQuestion==="function")?voteQuestion(MAKER_KEYS[i],N):null;
  if(!Q)return base;
  for(const [pick] of Q.picks)if(pick!==base)return pick;   /* ровно наоборот */
  return base;
}
/* ── чистка ──
   Часть флота исчезает: сила уже отнята в повторе, а здесь — дезертиры. Их
   вдвое больше, и они те самые, у кого номер закрашен свежо (M369a). */
function powPurgeOn(i){
  const inc=powInc("purge",POW_PURGE);
  return !!(inc&&inc.p===i);
}
function powDeserterMul(sx,sy){
  const inc=powInc("purge",POW_PURGE);
  if(!inc||typeof chronOwner!=="function")return 1;
  return chronOwner(sx===undefined?G.sx:sx,sy===undefined?G.sy:sy)===inc.p?2:1;
}
/* ── позор ──
   «Диктор исчезает из эфира.» Волна молчит: не «говорит другое», а молчит, и
   это слышно лучше любых слов. */
function powScandalOn(by){
  const inc=powInc("spy",POW_SCANDAL);
  return !!(inc&&MAKER_KEYS[inc.p]===by);
}
function powWaveSilent(by){
  by=by||((typeof chronWave==="function")?chronWave():"gt");
  /* ретранслятор починили (M387): молчание кончается раньше срока — у него
     появилась управа, и это единственный способ вернуть волну */
  if(typeof secRelayFixed==="function"&&secRelayFixed(by))return false;
  return powScandalOn(by);
}
/* ── откол ──
   Кластер объявляет себя седьмой силой на месяц: у него свой флаг на карте и
   своя строка в эфире. Механики седьмой державы нет и не будет — «шесть, и
   седьмого не будет» (§20 settled); откол — это событие о том, что бывает,
   когда шестая перестаёт держать своё. */
function powSecedeOn(sx,sy){
  const inc=powInc("secede",POW_SECEDE);
  if(!inc||typeof chronOwner!=="function")return false;
  return chronOwner(sx===undefined?G.sx:sx,sy===undefined?G.sy:sy)===inc.p;
}
function powLine(){
  const out=[];
  const own=(typeof chronOwner==="function")?chronOwner(G.sx,G.sy):-1;
  if(own>=0&&powCoupOn(own))out.push("ПЕРЕВОРОТ · КУРС ПЕРЕВЁРНУТ");
  if(own>=0&&powPurgeOn(own))out.push("ЧИСТКА · ДЕЗЕРТИРОВ ВДВОЕ");
  if(powSecedeOn())out.push("ОТКОЛ · ЗДЕСЬ ПОДНЯЛИ СВОЙ ФЛАГ");
  if(own>=0&&powWaveSilent(MAKER_KEYS[own]))out.push("ВОЛНА МОЛЧИТ · ЧИНИТСЯ СКАНИРОВАНИЕМ");
  return out.join(" · ");
}

/* ══════════════ провод войны (M376, §13, §16.4) ══════════════
   Летопись считается у каждого своя и совпадает у всех (12am-chron). По проводу
   ездит только то, чего клиент знать не может: ЧТО СДЕЛАЛИ ЛЮДИ. Сервер
   (`site/war.php`) складывает их дела в ведомости по сводкам и отдаёт их
   пачками; клиент кладёт ведомость в шаг 1 повтора — и галактика получает
   человеческую руку, не переставая быть детерминированной.

   Три правила, из которых состоит весь обмен:

   1. Ни имён, ни свободного текста, ни обмена между игроками — счётчики по
      системам и видам дел, как на открытке (`DESIGN-online-risks.md`).
   2. Насыщение по УЧЁТНЫМ ЗАПИСЯМ, а не по строкам: сто записей одного борта
      это один борт. Считает это сервер, потому что клиенту такое не доверишь.
   3. Сеть необязательна. Нет провода — игра идёт, летопись повторяется без
      ведомостей, и это честно видно по хэшу (D06), а не молча.

   Ведомости лежат в том же ключе, что и кэш летописи (`drift_war_v1`, §16.4):
   `chronSave` пишет своё поле и не трогает чужие. */
const WAR_API="/war.php";
const WAR_PULL_MS=90000;            /* чаще не спрашиваем: сводка длится шесть часов */
let WAR_BUSY=0,WAR_LAST=0;
function warHere(){return location.protocol==="http:"||location.protocol==="https:";}
function warTok(){return (typeof cloudTok==="function")?cloudTok():"";}
function warStore(){
  try{
    const o=JSON.parse(localStorage.getItem(CHRON_KEY)||"null");
    return (o&&typeof o==="object")?o:{};
  }catch(e){return {};}
}
function warStoreSet(patch){
  try{
    const o=warStore();
    for(const k in patch)o[k]=patch[k];
    localStorage.setItem(CHRON_KEY,JSON.stringify(o));
  }catch(e){}
}
/* ── ведомости на руках ──
   `led[N] = {"sx,sy":{kind:{q,a}}}`: сколько сделано и сколькими бортами. Больше
   ста двадцати сводок (месяц) не держим: старое уже вошло в кэш состояния. */
/* ── ведомости держим в памяти ──
   `chronFlip` спрашивает ведомость на каждую попытку перехода, а попыток за
   повтор года — сотни тысяч. Разбор localStorage на каждую из них удлинял
   прогон набора вдвое (замер 0.376.0): читаем один раз и держим, пока не
   положили новое. */
let WAR_LED_CACHE=null;
function warLed(){
  if(WAR_LED_CACHE)return WAR_LED_CACHE;
  const o=warStore();
  return WAR_LED_CACHE=((o.led&&typeof o.led==="object")?o.led:{});
}
function warLedger(N){
  const L=warLed();
  return L[N]||null;
}
function warLedPut(N,body){
  const L=warLed();
  L[N]=body;
  const keys=Object.keys(L).map(Number).sort((a,b)=>a-b);
  while(keys.length>120)delete L[keys.shift()];
  WAR_LED_CACHE=L;
  warStoreSet({led:L});
  /* сводка, которую уже шагали, получила ведомость: повтор от неё заново (M412) */
  if(typeof chronInvalidate==="function")chronInvalidate(N);
}
function warLedLast(){
  const keys=Object.keys(warLed()).map(Number);
  return keys.length?Math.max.apply(null,keys):-1;
}
/* ── часы ──
   Номер сводки считает сервер, и его ответ задаёт смещение локальных часов
   (§16.3, D05): переведённые часы игрока не двигают войну. */
function warClock(serverN){
  if(!(serverN>=0))return;
  const mine=chronNow();
  if(mine===serverN)return;
  const want=(serverN*CHRON_SHIFT)+CHRON_EPOCH-Date.now()+1;
  CHRON.off=want;
  warStoreSet({off:want});
  /* состояние пересчитывается на новый номер: старое было посчитано по чужим часам */
  CHRON.N=-1;CHRON.powers=null;
}
function warCall(a,body){
  return fetch(WAR_API+"?a="+a,{method:"POST",
    headers:{"Content-Type":"application/json","X-Drift-Token":warTok()},
    body:JSON.stringify(body||{})}).then(r=>r.json());
}
/* ── взять новое: закрытые сводки после последней известной ── */
function warPull(force){
  if(!warHere()||WAR_BUSY)return Promise.resolve(false);
  const now=Date.now();
  if(!force&&now-WAR_LAST<WAR_PULL_MS)return Promise.resolve(false);
  WAR_BUSY=1;WAR_LAST=now;
  return warCall("pull",{since:warLedLast()}).then(r=>{
    WAR_BUSY=0;
    if(!r||!r.ok)return false;
    warClock(r.N|0);
    /* голоса лежат в той же сводке, что и дела, и приезжают вместе с ними:
       отдельного канала у выборов нет (M378) */
    const body=s=>{const o=s.sys||{};o.__votes=s.votes||{};return o;};
    for(const s of (r.svodki||[]))if(s&&s.n!==undefined)warLedPut(s.n|0,body(s));
    if(r.open&&r.open.n!==undefined)warLedPut(r.open.n|0,body(r.open));
    /* циркуляры приезжают тем же ответом и проверяются конституцией на входе
       (M381): негодный не кладётся вовсе */
    if(Array.isArray(r.circ)&&r.circ.length&&typeof circPut==="function"){
      circPut(circAll().concat(r.circ));
      /* циркуляр помечен сводкой: от неё повтор заново (M412) */
      if(typeof chronInvalidate==="function")
        chronInvalidate(Math.min.apply(null,r.circ.map(c=>c.n|0)));
    }
    /* хэш за прошлую сводку: сервер только считает, кто с кем сошёлся. Прошлая
       сводка — это и есть закрытая база повтора (M412), считать её заново от
       нуля незачем */
    try{
      const st=chronState();
      const base=(typeof CHRON_BASE!=="undefined"&&CHRON_BASE&&CHRON_BASE.N===st.N-1)?CHRON_BASE:null;
      if(st&&st.N>0)warCall("hash",{n:st.N-1,h:String(chronHash(base||chronReplay(st.N-1,null)))})
        .then(h=>{if(h&&h.ok&&h.agree===false&&typeof logAdd==="function")logAdd("warn","Летопись разошлась с большинством на сводке "+h.n);})
        .catch(()=>{});
    }catch(e){}
    return true;
  }).catch(()=>{WAR_BUSY=0;return false;});
}
/* ── положить дело ──
   Кладётся то, что игрок и правда сделал: оборона в системе на фронте, буксир,
   снятый экипаж, отданное топливо, руда в дефицит. Без учётной записи сервер
   не примет, и это не ошибка игры — просто её рука не считается. */
function warPut(kind,qty,sys){
  if(!warHere()||!warTok())return Promise.resolve(false);
  const N=chronNow();
  return warCall("put",{n:N,sys:sys||((G.sx|0)+","+(G.sy|0)),kind,qty:Math.max(1,qty|0)})
    .then(r=>!!(r&&r.ok)).catch(()=>false);
}
/* ── ведомость в шаг 1 повтора (§16.2) ──
   Счётчики становятся ДАВЛЕНИЕМ на бросок фронта: оборона тянет систему к её
   хозяину, буксиры и снятые экипажи — к тому, чей это был борт. Не больше
   четверти броска (§7.4: «одна система на одну сводку, войну не повернуть»). */
function warPressure(st,N,fromIdx,toIdx,key){
  const L=warLedger(N);
  if(!L||!L[key])return 0;
  const cell=L[key];
  let def=0,acc=0;
  for(const k in cell){
    const c=cell[k];
    if(!c)continue;
    if(k==="def"||k==="clear"||k==="build"){def+=c.q|0;acc=Math.max(acc,(c.a&&c.a.length)|0);}
  }
  if(!def)return 0;
  /* насыщение по числу бортов, а не по числу строк; а если в области стоит
     «Ревизия» — вклад толпы там делится на четыре (M380, §11.2) */
  const p=Math.min(250,(chronSat(acc)/4)|0);
  const pr=key.split(",");
  const mul=(typeof bossPressMul==="function")?bossPressMul(pr[0]|0,pr[1]|0):1;
  return Math.round(p*mul);
}
/* ── запуск ──
   Тянем при загрузке и при каждом прыжке; чаще незачем — сводка длится шесть
   часов. Ошибки молчаливы: провод войны не должен мешать играть. */
function warBoot(){
  if(!warHere())return;
  const o=warStore();
  if(typeof o.off==="number")CHRON.off=o.off;
  warPull(true);
}
/* Одна попытка при загрузке — дальше по прыжкам. Через полторы секунды после
   загрузки: раньше страница занята собой, и лишний запрос в этот момент только
   отнимает у неё кадр. */
if(typeof addEventListener==="function")
  addEventListener("load",()=>setTimeout(()=>{try{warBoot();}catch(e){}},1500));
