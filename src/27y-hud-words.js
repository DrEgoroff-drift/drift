/* ── СЛОВА ПРИБОРОВ: регистр имён и десятичная запятая (пара HUD 15/n) ──
   Подписи пэдов, эфирной полосы и ЦЕЛИ пишутся как предложение: первое слово с
   большой буквы, дальше строчные. Но строки подсказок идут капсом, и в «К
   ГЛАВТРАССЕ» имя от глагола уже не отличить — CSS-строчные делали из неё «К
   главтрассе» (правка Контроля: имя — всегда как в игре). Имена узнаём по
   словарю того, что рядом: система, станция, планеты и луны, державы. Склонение
   — по основе: «ГЛАВТРАССЕ» узнаётся по «ГЛАВТРАСС», и слово берёт регистр
   имени, а окончание остаётся своим. */
let PADNAME_K=null,PADNAME=null;
function padNames(){
  const s=G.sys,k=s?(s.sx+","+s.sy+"|"+(s.name||"")+"|"+((s.station&&s.station.name)||"")):"";
  if(PADNAME&&PADNAME_K===k)return PADNAME;
  const m=new Map();
  const add=n=>{for(const t of String(n||"").split(/[\s«»"·,:()]+/)){
    /* слово имени — то, что в таблице с заглавной: «посёлок Воркораде» даёт одно */
    if(t.length<2||!/^[А-ЯЁA-Z]/.test(t))continue;
    const u=t.toUpperCase(),s0=u.length>4?u.replace(/[АЕЁИОУЫЭЮЯЙЬ]+$/,""):u,st=s0.length>=3?s0:u;
    if(!m.has(st))m.set(st,t);}};
  if(typeof POWERS==="object")for(const p in POWERS)add(POWERS[p].ru);
  if(s){add(s.name);if(s.station)add(s.station.name);
    for(const p of s.planets||[]){add(p.name);for(const q of p.moons||[])add(q.name);}}
  PADNAME_K=k;return PADNAME=m;
}
/* слово w (капсом) в регистре имени t: заглавные там, где они у имени */
function nameLike(w,t,at){
  if(t===t.toUpperCase())return w.toUpperCase();
  const a=w.toLowerCase().split("");
  for(let i=0;i<t.length&&at+i<a.length;i++)if(t[i]!==t[i].toLowerCase())a[at+i]=a[at+i].toUpperCase();
  return a.join("");
}
/* hud() зовёт padCase каждый кадр с тем же словом (кнопка действия, ЦЕЛЬ): 17 мкс разбора на вызов — 6 мс за 5 с.
   Ответ зависит от строки и словаря имён рядом — кэш по строке, сброс со словарём (M826, перф) */
const PADCASE=new Map();let PADCASE_K=null;
function padCase(s){
  const m=padNames(),k=String(s);
  if(PADCASE_K!==PADNAME_K){PADCASE.clear();PADCASE_K=PADNAME_K;}
  let r=PADCASE.get(k);if(r!==undefined)return r;
  r=padCaseRaw(k,m);if(PADCASE.size>256)PADCASE.clear();PADCASE.set(k,r);return r;
}
function padCaseRaw(s,m){
  return s.split(" ").map((w,i)=>{
    const lead=(/^[«"(]+/.exec(w)||[""])[0].length,core=w.slice(lead).replace(/[»")·,.:!?]+$/,"").toUpperCase();
    if(/^[IVXLC]+$/.test(core)||/^\d/.test(core))return w;   // номер луны, число
    /* основа короче трёх букв — только целым словом: «Ио» не ловит «ИОН» */
    for(let n=core.length;n>=2&&core.length-n<=3;n--){const t=m.get(core.slice(0,n));if(t!==undefined&&(n>=3||n===core.length))return nameLike(w,t,lead);}
    const l=w.toLowerCase();return i?l:l.charAt(0).toUpperCase()+l.slice(1);
  }).join(" ");
}
/* число, которое читает игрок: одна десятичная запятая на весь экран («1,4к» у
   фишек, «×1,40» у масштаба, невязка «0,012») */
function decRu(v,n){return (+v).toFixed(n).replace(".",",");}
