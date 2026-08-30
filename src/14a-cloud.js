/* ══════════════ облако, вкладки и обмен ══════════════
   Отрезано от `14-save` 25.08.2026: там остались снимок игры и его разбор
   (`snapshot`/`applySave` — пара, которую разносить нельзя), здесь всё про
   ОБМЕН: учётная запись, отправка и приём, видимое состояние обмена и правило
   «играет та вкладка, которую открыли последней».

   Разбор рисков онлайна — docs/DESIGN-online-risks.md. Главное из него: сервер
   не знает и не может знать, сколько игрок заработал, и это правильно; опасен
   не читер, а ТИШИНА — обмен, который не сложился и промолчал.
/* ══════════════ одна вкладка — одна игра ══════════════
   Две открытые вкладки писали в один и тот же ключ, каждая своё, и побеждала та,
   что сохранилась последней: вкладка, забытая утром, к вечеру затирала вечер.
   Никакого злоумышленника для этого не нужно — достаточно случайно открыть игру
   дважды, что люди и делают.

   Правило: играет та вкладка, которую открыли ПОСЛЕДНЕЙ. Старая не спорит и не
   пропадает — она перестаёт записывать и говорит об этом прямо, чтобы человек
   понимал, в каком окне продолжать. Летать в ней по-прежнему можно. */
let TAB_LIVE=true;
const TAB_ID=Math.random().toString(36).slice(2)+Date.now().toString(36);
let TAB_CH=null;
try{
  TAB_CH=new BroadcastChannel("drift-tabs");
  TAB_CH.onmessage=e=>{
    const d=e&&e.data;
    if(!d||d.id===TAB_ID)return;
    if(d.k==="hello"&&TAB_LIVE){
      /* пришла новая — уступаем место и замолкаем */
      TAB_LIVE=false;
      if(typeof say==="function")say("ИГРА ОТКРЫТА В ДРУГОЙ ВКЛАДКЕ\nздесь запись остановлена,\nчтобы не затереть ту",420);
      if(typeof logAdd==="function")logAdd("warn","Игра открыта в другой вкладке — эта больше не сохраняется.");
    }
  };
  TAB_CH.postMessage({k:"hello",id:TAB_ID});
}catch(e){TAB_CH=null;}          /* нет BroadcastChannel — работаем как раньше */
function tabLive(){return TAB_LIVE;}

function saveGame(quiet){
  if(!TAB_LIVE){
    if(!quiet)say("Здесь запись остановлена\nигра открыта в другой вкладке");
    return false;
  }
  /* строка собирается через saveText (14-save): она не бросает и сама
     называет виновника, если состояние разбухло. Раньше здесь стоял голый
     JSON.stringify, и его исключение уходило в сторож кадра. */
  const txt=saveText();
  const ok=(txt!==null)&&stSet(SAVE_KEY,txt);
  if(!quiet)say(ok?"Полёт записан":"Хранилище недоступно\nвоспользуйтесь кодом");
  if(ok)cloudPush(false);
  return ok;
}
function autosave(){
  if(G.t-lastSave<600)return;
  lastSave=G.t;saveGame(true);
}
function loadGame(){
  const raw=stGet(SAVE_KEY);if(!raw)return false;
  try{return applySave(JSON.parse(raw));}catch(e){return false;}
}
function hasSave(){return !!stGet(SAVE_KEY);}
function exportCode(){const t=saveText();return t?b64enc(t):"";}
function importCode(c){
  try{return applySave(JSON.parse(b64dec(c)));}catch(e){return false;}
}
/* ══════════════ облако ══════════════
   Три состояния, и путать их нельзя: игра с диска (облака нет вовсе), игра на
   сайте без входа (есть, но не наше) и игра с учётной записью. */
function cloudTok(){return stGet(CLOUD.tkey)||"";}
function cloudName(){return stGet(CLOUD.lkey)||"";}
function cloudHere(){return location.protocol==="http:"||location.protocol==="https:";}
function cloudOn(){return cloudHere()&&!!cloudTok();}
function cloudCall(a,body){
  return fetch(CLOUD.api+"?a="+a,{method:"POST",
    headers:{"Content-Type":"application/json","X-Drift-Token":cloudTok()},
    body:JSON.stringify(body||{})}).then(r=>r.json());
}
function cloudForget(){stDel(CLOUD.tkey);stDel(CLOUD.lkey);}

let cloudBusy=0,cloudLastTs=0;
/* ══════════════ видимое состояние обмена ══════════════
   Отправка молчалива по замыслу — она случается сама, раз в двадцать секунд, и
   болтать о каждой удаче ей незачем. Беда была в том, что молчала она и когда
   НЕ вышло: сеть пропала, вход устарел, в облаке запись новее. Игрок при этом
   уверен, что всё сложено, летит дальше — а вечером открывает игру на другом
   устройстве и не находит своего вечера.

   Поэтому: удача по-прежнему молчит (кроме короткой отметки времени), а всякая
   неудача остаётся на виду до тех пор, пока не разрешится. Ругаемся один раз
   на смену состояния, а не каждые двадцать секунд: строка в углу — не
   напоминание, а сообщение. */
let CLOUD_ST={k:"",ts:0,said:""};
function cloudMark(k){
  CLOUD_ST.k=k;CLOUD_ST.ts=Date.now();
  if(CLOUD_ST.said===k)return;                 /* об одном и том же — один раз */
  CLOUD_ST.said=k;
  if(k==="gone"){
    logAdd("warn","Облако: вход устарел — войдите заново на вкладке КОРАБЛЬ");
    say("ОБЛАКО\nвход устарел\nвойдите заново",220);
  }else if(k==="conflict"){
    logAdd("warn","Облако: там запись новее этой. Заберите её или выгрузите свою — вкладка КОРАБЛЬ");
    say("ОБЛАКО\nтам запись новее\nвкладка КОРАБЛЬ",240);
  }else if(k==="big"){
    logAdd("warn","Облако: запись слишком велика, она больше не отправляется");
  }
}
/* Строка для угла кадра. Пусто — значит сказать нечего, и место остаётся миру. */
function cloudLine(){
  if(typeof TAB_LIVE!=="undefined"&&!TAB_LIVE)return "запись здесь остановлена";
  if(!cloudOn())return "";
  const k=CLOUD_ST.k;
  if(k==="fail")return "облако · не отправлено";
  if(k==="gone")return "облако · вход устарел";
  if(k==="conflict")return "облако · там запись новее";
  if(k==="big")return "облако · запись велика";
  return "";
}
/* Не вышло — пробуем снова, когда появился повод: вернулась сеть или игрок
   вернулся во вкладку. Раньше следующая попытка ждала следующего сохранения, а
   его могло и не случиться — игру просто закрывали. */
function cloudRetry(){
  if(!cloudOn())return;
  const k=CLOUD_ST.k;
  if(k!=="fail"&&k!=="")return;
  cloudBusy=0;cloudPush(false);
}
if(typeof window!=="undefined"){
  window.addEventListener("online",cloudRetry);
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)cloudRetry();});
}
/* Отправка идёт молча и не чаще раза в двадцать секунд: сохранение случается
   часто, а сеть — единственное в игре, что умеет тормозить кадр. */
function cloudPush(loud){
  if(!cloudOn()){if(loud)say("Вы не вошли в учётную запись");return;}
  const now=Date.now();
  if(!loud&&now-cloudBusy<20000)return;
  cloudBusy=now;
  /* та же охраняемая строка, что и у местной записи: голый snapshot() уходил
     в fetch, а тот сериализует тело сам — и падал бы ровно там же, только
     уже внутри отправки (14-save, saveText) */
  const txt=saveText();
  if(txt===null){if(loud)say("Запись не собралась\nв облако не отправлена");return;}
  cloudCall("push",{save:JSON.parse(txt)})
    .then(d=>{
      if(d&&d.ok){cloudLastTs=d.ts;cloudMark("");CLOUD_ST.said="";if(loud)say("Отправлено в облако");}
      else if(d&&d.reason){cloudMark("conflict");if(loud)say("В облаке запись новее\nсначала заберите её");}
      else if(d&&d.error==="нужен вход"){cloudForget();cloudMark("gone");if(loud)say("Вход устарел\nвойдите заново");}
      /* «слишком большая запись» приходила как 413 и не подходила ни под одну
         ветку: облако переставало обновляться навсегда, и никто об этом не
         узнавал (A5 в docs/DESIGN-online-risks.md) */
      else if(d&&d.error){cloudMark("big");if(loud)say("Облако не приняло запись\n"+d.error);}
    })
    .catch(()=>{cloudMark("fail");if(loud)say("Облако недоступно");});
}
function cloudPull(){
  if(!cloudOn()){say("Вы не вошли в учётную запись");return;}
  cloudCall("pull")
    .then(d=>{
      if(!d||!d.ok){say("В облаке нет записи");return;}
      /* забрали чужое-новое — спор исчерпан, метка снимается */
      if(applySave(d.save)){stSet(SAVE_KEY,JSON.stringify(d.save));cloudMark("");CLOUD_ST.said="";say("Загружено из облака");}
      else say("Запись из облака не подошла");
    })
    .catch(()=>say("Облако недоступно"));
}
/* На запуске облако не спрашивает игрока и ничего не перетирает молча: оно лишь
   кладёт в локальное хранилище ту запись, которая новее, — а продолжать полёт
   или начинать заново, по-прежнему решает кнопка на заставке. */
function cloudBoot(then){
  if(!cloudOn()){then&&then(false);return;}
  cloudCall("pull")
    .then(d=>{
      if(!d||!d.ok||!d.save){then&&then(false);return;}
      let mine=0;
      try{mine=(JSON.parse(stGet(SAVE_KEY))||{}).ts||0;}catch(e){}
      if((d.save.ts||0)>mine){stSet(SAVE_KEY,JSON.stringify(d.save));then&&then(true);}
      else then&&then(false);
    })
    .catch(()=>{then&&then(false);});
}

