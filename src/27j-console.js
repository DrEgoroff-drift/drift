/* ══════════════ пульт: приёмник, подсказка, кресло ══════════════
   M151a. Полоса по низу КАЖДОГО экрана — три вещи, по одной на голос.

   ПРИЁМНИК. Ручка (25e) переехала сюда из кантины: то, что слышно, — прибор
   кабины, а не вкладка. Голоса приходят с щелчком: диспетчер (11b), слухи
   (11t), истории, звонки (M153), циркуляр (M156), пульс Кольца (M154).
   Игрок крутит ручку и находит голоса сам — игра не толкает.
   Строка живёт тут, тетрадь ЭФИР (11-log) её помнит.

   КРЕСЛО. Кто летит с вами: `G.seat` — {name, line, draw(c,W,H), act()}.
   Пусто — кресла не видно. Заполняют вехи (Вега M153, стажёр M163,
   пассажир баржи M156).

   ЖЁРДОЧКА. Трепло сидит на пульте, а не в меню: клик по птице — её окно.

   ПРАВИЛА ФАЙЛА:
   1. Пульт ничего не сочиняет и не хранит, кроме частоты (G.radioF).
   2. DOM обновляется раз в секунду с небольшим, не каждый кадр: это текст. */
let conT=0,conLast="",conFresh=0,conHeld=null,conDwell=0,perchT=0;
function consoleHeard(text,who){
  const line=document.getElementById("rxLine"),band=document.getElementById("rxBand"),rx=document.getElementById("rx");
  if(!line)return;
  line.textContent=(who?who+": ":"")+text;
  if(band)band.textContent="ЭФИР · ПРИНЯТО";
  conFresh=8;conLast=text;
  if(rx)rx.classList.add("fresh");
  sfx("ui",{f:1400,to:900,d:.05,v:.18});
}
function consoleTick(dt){
  conT-=dt;
  if(conFresh>0){conFresh-=dt/60;if(conFresh<=0){const rx=document.getElementById("rx");if(rx)rx.classList.remove("fresh");}}
  if(conT>0)return;
  conT=70;  /* ~секунда с небольшим при 60 к/с */
  const con=document.getElementById("console");if(!con)return;
  const rx=document.getElementById("rx"),knob=document.getElementById("rxKnob"),
        line=document.getElementById("rxLine"),band=document.getElementById("rxBand");
  /* приёмник: если свежей строки нет — показываем то, что ловится на частоте */
  const RN=(typeof ringLine==="function")?ringLine():null;   /* Кольцо (M154): пока звучит — только оно */
  const rec=document.getElementById("rxRec");if(rec)rec.style.display=(RN&&G.ringNow&&!G.ringNow.rec)?"":"none";
  if(RN&&line){band.textContent=RN.ru;line.textContent=RN.text;con.classList.remove("quiet");}
  else if(conFresh<=0&&line&&typeof radioTune==="function"){
    const f=(G.radioF==null?.05:G.radioF);
    if(knob&&document.activeElement!==knob)knob.value=f;
    const R=radioTune(f);
    /* у стойки ловит лучше: слова не выпадают */
    if(G.mode==="dock"&&R.q>0&&R.q<.55)R.text=radioTune(Math.min(1,f+.001)).text;
    band.textContent=R.ru||"ШУМ";
    line.textContent=R.text;
    /* задержался на волне — тетрадь запомнит строку, один раз на строку */
    if(R.q>.55&&R.text!==conHeld){conDwell+=1;if(conDwell>=3){conHeld=R.text;conDwell=0;logAdd("ether",R.ru+" · "+R.text);}}
    else if(R.q<=.55)conDwell=0;
    con.classList.toggle("quiet",R.q<=0&&conFresh<=0&&!G.seat);
  }else con.classList.remove("quiet");
  /* кресло */
  const seat=document.getElementById("seat");
  if(seat){
    const S=G.seat;
    seat.style.display=S?"":"none";
    if(S){
      document.getElementById("seatName").textContent=S.name||"—";
      document.getElementById("seatLine").textContent=S.line||"";
      const cv=document.getElementById("seatcv");
      if(cv&&typeof S.draw==="function"){const c=cv.getContext("2d");c.clearRect(0,0,cv.width,cv.height);S.draw(c,cv.width,cv.height);}
    }
  }
  /* жёрдочка: птица есть — сидит на пульте */
  const perch=document.getElementById("perch");
  if(perch){
    const has=typeof parrotHas==="function"&&parrotHas();
    perch.style.display=has?"":"none";
    if(has&&typeof parrotDraw==="function"){
      const cv=document.getElementById("perchcv");
      if(cv){const c=cv.getContext("2d");c.clearRect(0,0,cv.width,cv.height);
        if(typeof parStep==="function")parStep(1.1);
        parrotDraw(c,cv.width,cv.height);}
    }
  }
}
(function consoleWire(){
  /* класс mobile — сразу и на каждый resize, не дожидаясь кадра (M167) */
  const setMob=()=>document.body.classList.toggle("mobile",innerWidth<=760);
  setMob();addEventListener("resize",setMob);
  const knob=document.getElementById("rxKnob");
  if(knob){
    const tune=()=>{
      if(typeof radioTune!=="function")return;
      const R=radioTune(+knob.value);
      conFresh=0;conDwell=0;
      const rx=document.getElementById("rx");if(rx)rx.classList.remove("fresh");
      document.getElementById("rxBand").textContent=R.ru||"ШУМ";
      document.getElementById("rxLine").textContent=R.text;
      const con=document.getElementById("console");if(con)con.classList.remove("quiet");
    };
    knob.addEventListener("input",tune);
    /* телефон (M167): тикер открывает ручку по тапу и прячет через пару секунд */
    const rx=document.getElementById("rx");let sheetT=0;
    const sheetHide=()=>{if(rx)rx.classList.remove("sheet");};
    if(rx)rx.addEventListener("click",e=>{
      if(!document.body.classList.contains("mobile")||e.target===knob)return;
      rx.classList.toggle("sheet");clearTimeout(sheetT);sheetT=setTimeout(sheetHide,2500);
    });
    knob.addEventListener("input",()=>{clearTimeout(sheetT);sheetT=setTimeout(sheetHide,2000);});
    /* колесо на ручке — тоже ручка */
    knob.addEventListener("wheel",e=>{knob.value=clamp(+knob.value-Math.sign(e.deltaY)*.01,0,1);tune();e.preventDefault();},{passive:false});
  }
  const seat=document.getElementById("seat");
  if(seat)seat.addEventListener("click",()=>{if(G.seat&&typeof G.seat.act==="function")G.seat.act();});
  const perch=document.getElementById("perch");
  if(perch)perch.addEventListener("click",()=>{if(typeof toggleParrotWin==="function")toggleParrotWin(true);});
  const rec=document.getElementById("rxRec");
  if(rec)rec.addEventListener("click",()=>{if(typeof rxRecord==="function")rxRecord();});
})();
