/* ══════════════ режим: на борту «Сороки» (M343) ══════════════
   Большая новая сцена — новый режим (сквозное правило): свой update и свой
   draw (24c-mode-wanderer-draw), свой пульт (26d-ui-wanderer). Внутри хребта —
   длинный низкий коридор в разрезе, уходящий к стойке хранителя; по стенам
   витрины, в каждой одна вещь на сукне и своя ровная лампочка. Игрок идёт по
   коридору ←/→ (или ◀ ▶ на пульте): витрина перед ним показывает карточку —
   происхождение, что просят, строка из журнала. Ни сетки магазина, ни списка.

   Состояние — G.wan, эфемерно: ушёл — забылось. Товар, время и место — из
   часов (12v) и семени эпохи (12v-wander-shop); сохранение несёт только
   G.wander (что куплено, что отдано, полка).

   ПРАВИЛА ФАЙЛА:
   1. Комната открывается только у трапа во время стоянки; стенд может форсировать
      (openWanderer({force:true,epoch:0})) — тогда полка эпохи 0, чтобы кадр
      прибора не плыл с реальными сутками.
   2. Стоянка кончилась, пока вы внутри, — вас честно выводят: борт ушёл, вы
      висите там, где он стоял.
   3. Ничего не происходит без нажатия: прогулка, покупка, сдача — всё руками. */
let wanPrevL=false,wanPrevR=false,wanPrevA=false;
function wanAll(){return G.wan||null;}
function openWanderer(opts){
  opts=opts||{};
  const w=wanderAt();
  const here=!!G.sys&&w.phase==="stop"&&G.sys.sx===w.sx&&G.sys.sy===w.sy;
  if(!here&&!opts.force){say("«Сорока» здесь не стоит");return false;}
  for(const k in keys)keys[k]=false;
  G.ship.vx=0;G.ship.vy=0;
  const epoch=(opts.epoch!==undefined)?opts.epoch:w.epoch;
  const W2=(opts.epoch!==undefined)?Object.assign({},w,{epoch,dark:wanderLoop()[((epoch%WANDER_N)+WANDER_N)%WANDER_N].dark}):Object.assign({},w);
  if(opts.force)W2.forced=true;
  G.wan={sx:G.sys.sx,sy:G.sys.sy,epoch,dark:!!W2.dark,cursor:0,t0:Date.now(),
         from:G.mode==="wanderer"?"system":G.mode,seed:hashi(epoch|0,0x50A0,0xCA),
         said:0,flash:0,counter:false,w:W2};
  G.mode="wanderer";
  say(WANDER_LINES.hello,320);
  if(typeof peopleLine==="function")peopleLine(WANDER_LINES.hello,"хранитель «Сороки»",true);
  if(typeof sfx==="function")sfx("creak");
  if(typeof recordAdd==="function"&&!(G.wander&&G.wander.been)){wanderRec().been=1;recordAdd("«Сорока»","поднялись на борт парусника");}
  return true;
}
function exitWanderer(why){
  if(G.mode==="wanderer")G.mode="system";
  for(const k in keys)keys[k]=false;
  if(why)say(why,260);
  G.wan=null;
  if(typeof saveGame==="function")saveGame(true);
}
function wanLots(){const S=wanAll();return S?wanderLots(S.w):[];}
function wanCur(){const S=wanAll();if(!S)return null;const L=wanLots();return L[clamp(S.cursor,0,Math.max(0,L.length-1))]||null;}
function wanStep(d){
  const S=wanAll();if(!S)return;
  const L=wanLots();if(!L.length)return;
  S.cursor=clamp(S.cursor+d,0,L.length-1);
  S.counter=false;
  if(typeof sfx==="function")sfx("step");
}
function updateWanderRoom(dt){
  const S=wanAll();if(!S)return;
  /* стоянка кончилась — борт ушёл, а вы остались там, где он стоял */
  if(!S.w.forced){
    const w=wanderAt();
    if(!(w.phase==="stop"&&w.sx===S.sx&&w.sy===S.sy)){
      exitWanderer("«Сорока» ушла. Вы висите там, где она стояла.");
      logAdd("warn","«Сорока» отчалила, пока вы были на борту: вас высадили у трапа");
      return;
    }
    S.w=w;
    /* последний час: хранитель чиркает спичку — один раз, вспышка, «Туда.» */
    if(w.tLeft<3600e3&&!S.flash){
      S.flash=1;S.flashT=Date.now();
      say(WANDER_LINES.leave1+"\n… "+WANDER_LINES.leave2,300);
      if(typeof peopleLine==="function")peopleLine(WANDER_LINES.leave1+" — "+WANDER_LINES.leave2,"хранитель «Сороки»",true);
    }
  }
  /* прогулка: фронт клавиши, не удержание — шаг за нажатие */
  if(keys.left&&!wanPrevL)wanStep(-1);
  if(keys.right&&!wanPrevR)wanStep(1);
  if(keys.act&&!wanPrevA){const lot=wanCur();if(lot&&!lot.empty&&!lot.gone)wanderBuy(lot);}
  wanPrevL=keys.left;wanPrevR=keys.right;wanPrevA=keys.act;
  /* редкая реплика хранителя, сама по себе, не чаще раза в полминуты */
  S.said=(S.said|0)+dt;
  if(S.said>2400){S.said=0;S.saidN=(S.saidN|0)+1;
    const r=rng(hashi(S.seed,S.saidN,7));
    say(WANDER_LINES.idle[Math.floor(r()*WANDER_LINES.idle.length)],260);}
  G.prompt=(wanCur()&&!wanCur().empty&&!wanCur().gone)?"◀ ▶ — ПО КОРИДОРУ · ДЕЙСТВИЕ — ВЗЯТЬ":"◀ ▶ — ПО КОРИДОРУ";
  if(typeof wanPanelSync==="function")wanPanelSync();
}
