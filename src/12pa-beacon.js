/* ══════════════ «Маяк ГЛАВТРАССЫ»: официальный голос в эфире (M349, M349a) ══════════════
   Одна сводка на смену (HOLD_SHIFT, двадцать реальных минут) и на праздник
   (11am). Тон плаката: заголовок лесенкой, потом сухая сводка. Образец автора
   (2026-09-04): «МАЯК ГЛАВТРАССЫ. СМЕНА 412. Сектор 4:−7, станция «Ласковый-2»:
   принято / тысяча тонн / титана. План смены — сто двенадцать процентов. Слава
   сдавшим!»

   ПРАВИЛА (все из плана, ни одно не украшение):
   1. За каждой строкой — настоящая перемена состояния, и она хранится как
      `cause`: тоннаж — из аппетита станций (12ab, что сдали дроны и игрок);
      «очищен» — из 13b; курс бон — из журнала курса (12u); праздник — из
      календаря. Строка без дельты запрещена: нет перемен — нет сводки.
   2. Точен, но лжёт умолчанием: потерянный сектор — «переведён на особый режим»,
      «Сорока» не упоминается никогда, разорённая артель не называется. Что маяк
      не скажет — расскажут в кантине; каналы не дублируют друг друга.
   3. Игрок появляется: сдал в смену больше нормы — назван борт («экипаж борта
      «Стриж» перевыполнил план по титану»); имена игрока (11u) в ходу.
   4. У праздника есть следствие: норма флота двойная в этот день (12ai), и маяк
      это объявляет.
   5. Слышно: в ЭФИРЕ на столе, голосом приёмника в полёте и в дороге (27k),
      листом на стене кантины (27c); всякий адрес в нём нажимается (18a).

   ГОЛОС (M349a): браузерный speechSynthesis, lang ru-RU, ни одного файла — правило
   нуля ресурсов держится. Автор услышал пробу: «как рипово, давай только тихо,
   пусть болтает» — фон, не объявление: громкость .35, темп 1.0, тон .9; треск
   приёмника до и короткий двутон после; никогда не перебивает звук игры, гаснет
   (не рвётся) под «СБОЙ» и боем. Голоса — системные: игрок ставит их в ОС, игра
   видит сама; выбор хранится по ИМЕНИ голоса, запасной — первый ru. Только в
   полёте и в дороге, никогда на столе и на станции. Первая сводка говорит, где
   выключается.

   ПРАВИЛА ФАЙЛА:
   1. Хранится G.beacon={shift,log:[…],saidOff}, G.shiftLog (сдано игроком за
      смену), G.freedLog (очищенные сектора); настройки голоса — в G.opts.voice.
   2. Никаких таймеров: сводка собирается, когда кадр видит новую смену.
   3. Мулды фраз — руками, таблицей, не генератором. */
const MAYAK_KEEP=6, MAYAK_OVER=50;      /* сколько сводок помним; сколько единиц за смену — «перевыполнил» */
function mayakRec(){
  let B=G.beacon;
  if(!B||typeof B!=="object"||!Array.isArray(B.log)){B=G.beacon={shift:null,log:[],saidOff:0};}
  return B;
}
function shiftLogRec(){
  const s=holdShift();
  if(!G.shiftLog||G.shiftLog.s!==s)G.shiftLog={s,sold:{},earned:0};
  return G.shiftLog;
}
/* что игрок сдал (12-economy зовёт из продажи) */
function mayakSold(sys,k,qty,revenue){
  const L=shiftLogRec();
  L.sold[k]=(L.sold[k]|0)+(qty|0);L.earned=(L.earned|0)+(revenue|0);
}
/* сектор очищен игроком (13b зовёт при освобождении) */
function mayakFreed(sx,sy,sys){
  if(!Array.isArray(G.freedLog))G.freedLog=[];
  G.freedLog.push({sx,sy,name:(sys&&sys.station)?sys.station.name:"",shift:holdShift(),t:Date.now()});
  while(G.freedLog.length>12)G.freedLog.shift();
}
/* адрес, как его говорит маяк: имя игрока в ходу (11u) */
function mayakSector(sx,sy){
  const nm=(typeof namesFor==="function")?namesFor(sx+","+sy):null;
  return "сектор "+(nm?"«"+nm+"» ("+sx+":"+sy+")":sx+":"+sy);
}
/* числа словами — по-плакатному, только круглые; остальное цифрами */
const MAYAK_NUM={100:"сто",200:"двести",300:"триста",500:"пятьсот",1000:"тысяча"};
function mayakNum(n){return MAYAK_NUM[n]||String(n);}
/* ── сводка за смену s: строки с причинами ── */
function mayakCompose(s){
  const lines=[],D=HOLD_SHIFT;
  const t0=s*D,t1=t0+D;
  /* 1. тоннаж: что станции приняли в аппетит за эту смену (дроны и игрок) */
  let best=null;
  const HH=G.hold||{};
  for(const key in HH){
    const h=HH[key];if(!h||!h.ate)continue;
    for(const k in h.ate){
      const a=h.ate[k];if(!Array.isArray(a)||a[1]!==s||!(a[0]>0))continue;
      if(!best||a[0]>best.n){
        const [sx,sy]=key.split(",").map(Number);
        const sys=starAt(sx,sy)?getSystem(sx,sy):null;
        if(!sys||!sys.station)continue;
        const left=(typeof appetiteOf==="function"&&appetiteOf(sys)&&appetiteOf(sys)[k])?appetiteOf(sys)[k]:0;
        best={n:a[0],k,sx,sy,name:sys.station.name,norm:left};
      }
    }
  }
  if(best){
    lines.push({t:mayakSector(best.sx,best.sy).replace(/^с/,"С")+", станция «"+best.name+"»: принято / "+mayakNum(best.n)+" "+pl3(best.n,"тонна","тонны","тонн")+" / "+RES[best.k].ru.toLowerCase()+".",
      cause:{k:"tonnage",sx:best.sx,sy:best.sy,res:best.k,n:best.n},ladder:1});
    if(best.norm>0){const pct=Math.round(100*best.n/best.norm);
      lines.push({t:"План смены — "+pct+" процентов."+(pct>=100?" Слава сдавшим!":""),cause:{k:"plan",pct}});}
  }
  /* 2. игрок сверх нормы — назван борт */
  const SL=G.shiftLog;
  if(SL&&SL.s===s){
    let bk=null;for(const k in SL.sold)if(SL.sold[k]>=MAYAK_OVER&&(!bk||SL.sold[k]>SL.sold[bk]))bk=k;
    if(bk)lines.push({t:"Экипаж борта «"+stat().S.ru+"»"+((G.name&&G.name.trim())?" ("+G.name.trim()+")":"")+" перевыполнил план по "+RES[bk].ru.toLowerCase()+": "+SL.sold[bk]+" "+pl3(SL.sold[bk],"единица","единицы","единиц")+".",
      cause:{k:"over",res:bk,n:SL.sold[bk]}});
  }
  /* 3. очищено (игроком) и переведено на особый режим (занято) */
  for(const f of (G.freedLog||[]))if(f.shift===s)
    lines.push({t:mayakSector(f.sx,f.sy).replace(/^с/,"С")+(f.name?", станция «"+f.name+"»":"")+": очищен от нарушителей режима.",cause:{k:"freed",sx:f.sx,sy:f.sy}});
  for(const key in (G.occ||{})){
    const o=G.occ[key];if(!o||!(o.lvl>0)||!o.t||o.t<t0||o.t>=t1)continue;
    const [sx,sy]=key.split(",").map(Number);
    if(!starAt(sx,sy)||!getSystem(sx,sy).station)continue;
    lines.push({t:mayakSector(sx,sy).replace(/^с/,"С")+" переведён на особый режим.",cause:{k:"lost",sx,sy,lvl:o.lvl}});
    if(lines.length>6)break;
  }
  /* 4. курс бон за смену — суммой по дому */
  const moves={};
  for(const m of (G.scripLog||[]))if(m.t>=t0&&m.t<t1)moves[m.id]=(moves[m.id]|0)+m.d;
  for(const id in moves){const d=moves[id];if(!d)continue;
    lines.push({t:"Курс бон дома "+HOUSE_BY_ID[id].ru+": "+(d>0?"плюс ":"минус ")+Math.abs(d)+" "+pl3(Math.abs(d),"пункт","пункта","пунктов")+".",cause:{k:"scrip",id,d}});}
  /* 5. праздник — со следствием */
  const hol=(typeof holNow==="function")?holNow():null;
  if(hol)lines.push({t:"Праздник: "+hol.ru+". Норма флота — двойная. Всех сдавших — с праздником.",cause:{k:"holiday",id:hol.id}});
  return lines;
}
function mayakHead(s){return "МАЯК ГЛАВТРАССЫ. СМЕНА "+(s%1000)+".";}
/* лесенка — для голоса и листа: заголовок и первая строка разбиты по «/» */
function mayakLadder(line){return String(line).split(" / ");}
function mayakLast(){const B=mayakRec();return B.log.length?B.log[B.log.length-1]:null;}
/* кадр видит новую смену — сводка за прошедшую */
function mayakTick(){
  const B=mayakRec(),s=holdShift();
  if(B.shift===null||B.shift===undefined){B.shift=s;return null;}
  if(B.shift===s)return null;
  const prev=B.shift;B.shift=s;
  const lines=mayakCompose(prev);
  if(!lines.length)return null;                      /* без перемен маяк молчит */
  const bul={shift:prev,t:Date.now(),lines};
  B.log.push(bul);while(B.log.length>MAYAK_KEEP)B.log.shift();
  const first=lines[0].t.replace(/ \/ /g," ");
  etherLine(mayakHead(prev)+" "+first+(lines.length>1?" …ещё "+(lines.length-1)+" "+pl3(lines.length-1,"строка","строки","строк")+" — на столе.":""),"Маяк ГЛАВТРАССЫ");
  const said=[mayakHead(prev)].concat(lines.map(l=>l.t));
  if(!B.saidOff){B.saidOff=1;said.push("Голос приёмника выключается в настройках, раздел «Звук».");}
  voiceSay(said,"beacon");
  return bul;
}
/* лист на стене кантины (27c) */
function mayakBlock(){
  const bul=mayakLast();if(!bul||typeof $body==="undefined")return;
  $body.appendChild(el("div","sec","МАЯК ГЛАВТРАССЫ · СМЕНА "+(bul.shift%1000)+" · ЛИСТ НА СТЕНЕ"));
  const r=el("div","row");
  const lad=mayakLadder(bul.lines[0].t).map((p,i)=>"<span style='display:block;padding-left:"+(i*14)+"px'>"+p+"</span>").join("");
  r.appendChild(el("div","nm","<b>"+lad+"</b><s style='line-height:1.9'>"+bul.lines.slice(1).map(l=>l.t).join("<br>")+"</s>"));
  $body.appendChild(r);
}
/* ── голос приёмника (M349a) ── */
function voiceOpts(){
  const o=G.opts.voice;
  if(!o||typeof o!=="object")G.opts.voice={on:true,rate:1,vol:.35,pitch:.9,beacon:"",keeper:"",disp:""};
  return G.opts.voice;
}
function voiceList(){
  if(typeof speechSynthesis==="undefined"||!speechSynthesis.getVoices)return [];
  try{return speechSynthesis.getVoices().filter(v=>/^ru/i.test(v.lang||""));}catch(e){return [];}
}
/* три роли — три голоса, если устройство их даёт; иначе один на всех */
const VOICE_MALE=/pavel|dmitr|maxim|yuri|artem|павел|дмитрий|максим|юрий|артём/i;
const VOICE_FEMALE=/irina|svetlana|ekaterina|dariya|ирина|светлана|екатерина|дарья/i;
function voicePick(role){
  const L=voiceList();if(!L.length)return null;
  const want=voiceOpts()[role];
  if(want){const v=L.find(x=>x.name===want);if(v)return v;}
  if(role==="beacon"){const v=L.find(x=>VOICE_MALE.test(x.name));if(v)return v;}
  if(role==="disp"){const v=L.find(x=>VOICE_FEMALE.test(x.name));if(v)return v;}
  if(role==="keeper"&&L.length>2)return L[2%L.length];
  return L[0];
}
let VOICE_Q=[],VOICE_BUSY=false,VOICE_MODE="";
function voiceCan(){return !!(voiceOpts().on&&typeof speechSynthesis!=="undefined"&&typeof SpeechSynthesisUtterance!=="undefined"&&(G.mode==="system"||G.mode==="road"));}
/* cancel() — вызов в процесс браузера: зовём только когда есть что глушить, иначе
   каждая смена режима в тестах стоила десятки миллисекунд (прогон удвоился) */
function voiceCancel(){
  const had=VOICE_BUSY||VOICE_Q.length>0;
  VOICE_Q=[];VOICE_BUSY=false;
  if(had)try{if(typeof speechSynthesis!=="undefined")speechSynthesis.cancel();}catch(e){}
}
/* сказать строки одну за другой: треск — строки с паузами на ступенях лесенки — двутон */
function voiceSay(lines,role){
  if(!voiceCan())return false;
  const v=voicePick(role||"beacon");
  if(!v)return false;                                   /* голосов нет — молчим, без ошибки */
  const arr=(Array.isArray(lines)?lines:[lines]).flatMap(l=>mayakLadder(l));
  if(!arr.length)return false;
  if(typeof sfx==="function")sfx("crackle",{v:.12});
  for(const t of arr)VOICE_Q.push({t,v,role:role||"beacon"});
  VOICE_Q.push({sign:1});
  voiceNext();
  return true;
}
function voiceNext(){
  if(VOICE_BUSY||!VOICE_Q.length)return;
  const it=VOICE_Q.shift();
  if(it.sign){if(typeof sfx==="function")sfx("signoff",{v:.1});voiceNext();return;}
  const o=voiceOpts();
  const u=new SpeechSynthesisUtterance(it.t);
  u.lang="ru-RU";u.voice=it.v;u.rate=clamp(+o.rate||1,.7,1.3);u.pitch=clamp(+o.pitch||.9,.6,1.3);
  /* гаснет, не рвётся: под боем и сбоем вполголоса */
  const duck=((G.pirates||[]).some(p=>p.aware)||(typeof G.fail!=="undefined"&&G.fail))?.5:1;
  u.volume=clamp((+o.vol||.35)*duck,0,1);
  VOICE_BUSY=true;
  const done=()=>{VOICE_BUSY=false;setTimeout(voiceNext,220);};   /* пауза между ступенями */
  u.onend=done;u.onerror=done;
  try{speechSynthesis.speak(u);}catch(e){done();}
}
/* смена режима — очередь сбрасывается: голос только в полёте и в дороге */
function voiceTick(){
  if(VOICE_MODE!==G.mode){VOICE_MODE=G.mode;if(!(G.mode==="system"||G.mode==="road"))voiceCancel();}
}
