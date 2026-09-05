/* ══════════════ автотесты: «Маяк ГЛАВТРАССЫ» и голос приёмника (M349, M349a) ══════════════
   Ни строки без причины; маяк не называет «Сороку»; праздник удваивает норму
   ровно в тот день; голос — только в полёте и в дороге, без голосов молчит без
   ошибки, текст доходит до очереди синтеза. */
TEST_SUITES.push(()=>suite("маяк: ни строки без причины, сводка на смену, «Сорока» не названа",()=>{
  resetWorld();
  G.beacon=null;G.shiftLog=null;G.freedLog=[];G.scripLog=[];G.hold={};G.occ={};G.opts.voice={on:false};
  const now0=Date.now;
  try{
    let T=WANDER_T0+100*HOLD_SHIFT+1000;Date.now=()=>T;
    eq(mayakTick(),null,"первый кадр только запоминает смену");
    const s=holdShift();
    /* пустая смена — молчание */
    T+=HOLD_SHIFT;eq(mayakTick(),null,"без перемен сводки нет");
    /* смена с переменами: тоннаж, сдача игрока, очищенный сектор, курс бон, занятый сектор */
    const S=nearestStation(0,0);
    const s2=holdShift();
    G.hold[S.key]={ate:{iron:[120,s2]}};
    G.shiftLog={s:s2,sold:{iron:60},earned:600};
    mayakFreed(S.sx,S.sy,S);
    G.scripLog=[{id:"kova",d:3,why:"тест",t:T+1000},{id:"kova",d:2,why:"тест",t:T+2000}];
    const O=nearestStation(3,3);if(O&&O.key!==S.key){G.occ[O.key]={lvl:1,kills:0,t:T+500};}
    T+=HOLD_SHIFT;
    const bul=mayakTick();
    ok(!!bul&&bul.lines.length>=4,"сводка собрана: "+(bul?bul.lines.length:0)+" строк");
    ok(bul.lines.every(l=>l.cause&&l.cause.k),"у каждой строки причина");
    ok(bul.lines.some(l=>l.cause.k==="tonnage"&&/принято/.test(l.t)),"тоннаж — из аппетита станции");
    ok(bul.lines.some(l=>l.cause.k==="over"&&/перевыполнил/.test(l.t)&&/Стриж/.test(l.t)),"игрок назван бортом");
    ok(bul.lines.some(l=>l.cause.k==="freed"&&/очищен/.test(l.t)),"очищенный сектор назван");
    ok(bul.lines.some(l=>l.cause.k==="scrip"&&/плюс 5/.test(l.t)),"курс бон — суммой за смену");
    if(O&&O.key!==S.key)ok(bul.lines.some(l=>l.cause.k==="lost"&&/особый режим/.test(l.t)),"потерянный — «особый режим», не «потерян»");
    const all=[mayakHead(bul.shift)].concat(bul.lines.map(l=>l.t)).join(" ");
    ok(!/Сорок|wander|парус/i.test(all),"«Сорока» не упомянута");
    ok(/^МАЯК ГЛАВТРАССЫ\. СМЕНА \d+\.$/.test(mayakHead(bul.shift)),"заголовок плаката");
    eq(mayakLadder(bul.lines[0].t).length,3,"первая строка ложится лесенкой в три ступени");
    /* сводка легла в эфир и хранится */
    ok((G.log||[]).some(e=>e.k==="ether"&&/Маяк ГЛАВТРАССЫ/.test(e.s||"")),"в ЭФИРЕ есть строка маяка");
    eq(mayakLast().shift,bul.shift,"последняя сводка помнится");
    const snap=snapshot();G.beacon=null;applySave(snap);
    eq(mayakLast().shift,bul.shift,"и возвращается из сейва");
  }finally{Date.now=now0;}
  G.beacon=null;G.shiftLog=null;G.freedLog=[];G.scripLog=[];G.hold={};G.occ={};G.opts.voice=null;
}));

TEST_SUITES.push(()=>suite("маяк: продажа пишет смену, праздник удваивает норму флота",()=>{
  resetWorld();
  G.shiftLog=null;
  const S=nearestStation(0,0);G.sys=S;G.sx=S.sx;G.sy=S.sy;G.st=S.station;G.mode="dock";
  G.cargo.iron=20;
  const before=(G.shiftLog&&G.shiftLog.sold.iron)|0;
  sellCargo(S,"iron",10);
  eq((G.shiftLog.sold.iron|0)-before,10,"продажа записана в смену");
  eq(G.shiftLog.s,holdShift(),"и смена — текущая");
  /* норма флота: одна на смену, в праздник — две */
  const h0=holNow;
  try{
    holNow=()=>null;
    const k1=fleetNormKey();
    holNow=()=>({id:"cos",ru:"День космонавтики"});
    ok(/×2|\/2|hol/.test(String(fleetNormKey()))||fleetNormKey()!==k1,"в праздник ключ нормы другой — вторая заправка в смену");
    ok(fleetNormTwice(),"норма двойная");
    holNow=()=>null;
    ok(!fleetNormTwice(),"в будни — одна");
  }finally{holNow=h0;}
  G.mode="system";G.st=null;G.cargo.iron=0;G.shiftLog=null;
}));

TEST_SUITES.push(()=>suite("голос приёмника: очередь синтеза, тишина без голосов, молчит на столе",()=>{
  resetWorld();
  const SS0=window.speechSynthesis,U0=window.SpeechSynthesisUtterance;
  const spoken=[];
  try{
    /* speechSynthesis у окна — только чтение: подменяем собственным свойством поверх прототипа */
    Object.defineProperty(window,"SpeechSynthesisUtterance",{value:function(t){this.text=t;this.volume=1;this.rate=1;},configurable:true,writable:true});
    const mock={speak(u){spoken.push(u);setTimeout(()=>{if(u.onend)u.onend();},0);},cancel(){spoken.push({cancel:1});},getVoices(){return [{name:"Павел",lang:"ru-RU"},{name:"Irina",lang:"ru-RU"},{name:"Zira",lang:"en-US"}];}};
    Object.defineProperty(window,"speechSynthesis",{value:mock,configurable:true,writable:true});
    G.opts.voice=null;
    const o=voiceOpts();
    ok(o.on&&o.vol===.35&&o.rate===1,"по умолчанию: включён, тихо, без спешки");
    eq(voiceList().length,2,"английский голос не в списке");
    eq(voicePick("beacon").name,"Павел","маяк — мужской голос, если есть");
    eq(voicePick("disp").name,"Irina","диспетчер — женский");
    G.mode="system";G.pirates=[];
    ok(voiceSay(["МАЯК. СМЕНА 1.","Сектор 1:1: принято / сто тонн / титана."],"beacon"),"в полёте говорит");
    eq(spoken.length,1,"первая ступень пошла в синтез сразу");
    ok(spoken[0].text==="МАЯК. СМЕНА 1."&&Math.abs(spoken[0].volume-.35)<.01&&spoken[0].voice.name==="Павел","текст, громкость и голос как заданы");
    /* бой — вполголоса */
    voiceCancel();spoken.length=0;G.pirates=[{aware:true}];
    voiceSay("Тише.","beacon");
    ok(spoken.length&&Math.abs(spoken[0].volume-.175)<.01,"под боем вполголоса, не молчит");
    G.pirates=[];voiceCancel();spoken.length=0;
    /* на столе и на станции — ни звука */
    G.mode="dock";ok(!voiceSay("Тест","beacon"),"на станции молчит");
    G.mode="wanderer";ok(!voiceSay("Тест","beacon"),"на борту «Сороки» молчит");
    eq(spoken.filter(u=>u.text).length,0,"ничего не произнесено");
    G.mode="system";
    /* выключен — молчит */
    voiceOpts().on=false;ok(!voiceSay("Тест","beacon"),"выключенный молчит");voiceOpts().on=true;
    /* смена режима сбрасывает очередь */
    voiceSay(["а","б","в"],"beacon");G.mode="dock";voiceTick();
    ok(spoken.some(u=>u.cancel),"уход со связи — отмена");
    G.mode="system";
    /* нет голосов — тишина без ошибки */
    mock.getVoices=()=>[];
    let err="";try{ok(!voiceSay("Тест","beacon"),"без голосов молчит");}catch(e){err=e.message;}
    eq(err,"","и не бросает");
  }finally{delete window.speechSynthesis;delete window.SpeechSynthesisUtterance;if(U0)window.SpeechSynthesisUtterance=U0;voiceCancel();}
  G.opts.voice=null;
}));
