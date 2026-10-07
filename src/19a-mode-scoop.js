/* ══════════════ сбор летучих газов: заход в атмосферу гиганта ══════════════ */
/* Газовый гигант перестал быть красивой картинкой, мимо которой пролетаешь:
   сесть на него по-прежнему нельзя, но можно пройти по касательной в верхних
   слоях и набрать летучие газы. Смысл сцены — узкий коридор высоты: выше
   сборник хватает пустоту, ниже растёт нагрев, а турбулентность всё время
   сбивает с высоты, поэтому это работа руками, а не полоска прогресса. */
/* ── коридор больше не линейка ──
   Плейтест 03.09.2026: «легко добываются, сделай прям на планете, чтобы
   препятствия там были, чтобы извилисто летать, а не только по прямой, как
   платформер, чтобы зудело у всех». Так и есть: держать одну высоту полминуты —
   это не работа руками, это ожидание. Полоса сбора теперь ИДЁТ — она ползёт
   вверх и вниз длинной волной, и лететь приходится по ней; а поперёк дороги
   стоят вихревые ядра, восходящие плюмажи и град кристаллов. Полоса остаётся
   той же толщины: трудность в дороге, а не в игольном ушке. */
const SCOOP_BAND=[.50,.63];        // толщина коридора в долях высоты экрана (.13H)
const SCOOP_PX=1.6;                // экранных точек на единицу пути: дальше видно за ~1.3 с
function scoopCenter(x){
  const S=G.scoop;if(!S)return H*.565;
  /* амплитуда набирается за первые сотни единиц: первый заход обязан дать
     понять правило, а не встретить стеной */
  const amp=.105*clamp((x-240)/1100,0,1);
  const w=Math.sin(x/520*TAU+S.phase)*.62+Math.sin(x/197*TAU+S.phase*1.7)*.38;
  return H*(.565+amp*w);
}
function scoopBandAt(x){
  const h=H*(SCOOP_BAND[1]-SCOOP_BAND[0]),c=scoopCenter(x);
  return [c-h*.5,c+h*.5];
}
function scoopBand(){return scoopBandAt(G.scoop?G.scoop.x:0);}
/* ── что стоит поперёк ──
   Три помехи, и каждая просит своего движения: ядро обходят, плюмаж
   пересекают на разгоне, град пережидают выше или ныряют под него. */
function scoopSpawn(){
  const S=G.scoop;
  while(!S.obs.length||S.obs[S.obs.length-1].x<S.x+900){
    const n=S.n++;
    const r=rng(hashi(S.p.seed,n*3701,0x0B11));
    const x=(S.obs.length?S.obs[S.obs.length-1].x:S.x+520)+150+r()*230;
    const kind=n<2?0:(r()<.42?0:(r()<.66?1:2));
    const c=scoopCenter(x),h=H*(SCOOP_BAND[1]-SCOOP_BAND[0]);
    const side=r()<.5?-1:1;
    if(kind===0)      S.obs.push({k:0,x,y:c+side*h*(.30+r()*.55),r:26+r()*20,hit:0,sp:(r()<.5?-1:1)*(.4+r()*.8)});
    else if(kind===1) S.obs.push({k:1,x,y:c,r:20+r()*12,hit:0,up:(r()<.5?-1:1)});
    else{
      const nn=4+Math.floor(r()*5);
      for(let i=0;i<nn;i++)S.obs.push({k:2,x:x+i*26+r()*14,y:c+(r()-.5)*h*1.5,r:6+r()*4,hit:0});
    }
  }
  while(S.obs.length&&S.obs[0].x<S.x-260)S.obs.shift();
}
function startScoop(p){
  G.scoop={p,y:H*.34,vy:0,heat:0,bank:0,got:0,x:0,phase:rng(hashi(p.seed,0x6A5,3))()*TAU,
    lastWarn:0,shake:0,obs:[],n:0,bump:0,knock:0,gain:0};
  scoopSpawn();
  G.mode="scoop";G.ap=null;G.orbit=null;
  for(const k in keys)keys[k]=false;
  document.querySelectorAll(".pads button").forEach(b=>b.classList.remove("on"));
  /* кнопка справа в этом режиме подписана ВЫХОД (28-loop) — подсказка обязана
     звать её тем же словом: «НАЗАД» на экране нет, и взлёт было не найти */
  say("Заход в атмосферу\n"+p.name+"\n▲ ▼ — высота · полоса сбора идёт волной, держитесь её\nвихри и град бьют корпус, плюмажи несут\nВЫХОД — уход на орбиту");
}
function exitScoop(msg){
  const S=G.scoop,p=S.p;
  const a=Math.atan2(G.ship.y-p.y,G.ship.x-p.x)||0;
  G.ship.x=p.x+Math.cos(a)*(p.radius+150);G.ship.y=p.y+Math.sin(a)*(p.radius+150);
  G.ship.vx=p.vx||0;G.ship.vy=p.vy||0;
  G.scoop=null;G.mode="system";
  saveGame(true);
  /* «Ничего не получил» (плейтест 03.09.2026) — это не про пустой трюм, а про
     то, что игра ни разу не сказала, ЧТО он получил: газы рынок не берёт, и
     строка с их числом читалась пустым звуком. Теперь выход называет едока. */
  say(msg+"\nлетучих газов в трюме: "+G.cargo.volatiles+
      "\nрынок их не берёт: верфь, криоцех — или сдать торговой барже");
}
function updateScoop(dt){
  const S=G.scoop,st=stat();
  S.x+=(5.2+st.thr*.7)*dt;S.phase+=dt*.03;
  scoopSpawn();
  const [bt,bb]=scoopBandAt(S.x);
  /* высота: тяга поднимает, тормоз прижимает, и всегда есть снос вниз —
     висеть в коридоре, ничего не трогая, не получится */
  if(keys.thrust&&G.fuel>0){S.vy-=.055*st.thr*dt;G.fuel=Math.max(0,G.fuel-.016*dt);}
  if(keys.brake)S.vy+=.045*dt;
  S.vy+=.021*dt;
  /* турбулентность: чем глубже, тем сильнее болтанка */
  const deep=clamp((S.y-bt)/(H*.3),0,1.6);
  S.vy+=Math.sin(S.x*.021+S.phase)*.012*dt*(.4+deep*1.9);
  S.vy+=Math.sin(S.x*.0071+S.phase*2.3)*.02*dt*(.3+deep);
  S.vy*=Math.pow(.94,dt);
  S.y=clamp(S.y+S.vy*dt*4,H*.14,H*.86);
  if(S.y<=H*.14+.5&&S.vy<0)S.vy=0;
  S.bank+=(clamp(S.vy*.5,-.7,.7)-S.bank)*Math.min(1,.09*dt);
  S.shake=Math.max(0,S.shake-dt*.05);
  S.bump=Math.max(0,S.bump-dt*.04);
  /* ── помехи ──
     Ядро бьёт корпус и сбивает с высоты, град царапает мелко и часто, плюмаж
     не вредит вовсе — он несёт, и потому опаснее всего у нижней кромки, где
     из коридора выносит вниз, в нагрев. */
  for(const o of S.obs){
    const dx=o.x-S.x;
    if(dx>240||dx<-90)continue;
    if(o.k===1){
      if(Math.abs(dx)<o.r+16&&Math.abs(S.y-o.y)<H*.22){
        S.vy+=o.up*.085*dt;S.shake=Math.min(1,S.shake+.012*dt);S.knock=1;
      }
      continue;
    }
    if(o.k===0)o.y+=Math.sin(S.x*.006+o.x*.01)*o.sp*.5*dt;
    const d=Math.hypot(dx,S.y-o.y);
    if(d<o.r+14&&!o.hit){
      o.hit=1;
      const heavy=o.k===0;
      G.hull-=heavy?4.5:1.4;
      S.vy+=(S.y<o.y?-1:1)*(heavy?.75:.22);
      S.shake=Math.min(1,S.shake+(heavy?.75:.22));
      S.bump=1;
      sfx("hit",{v:heavy?.7:.35});
      if(G.hull<=0){G.scoop=null;G.mode="system";wreck("атмосфера гиганта");return;}
    }
  }
  S.knock=Math.max(0,(S.knock||0)-dt*.08);
  /* нагрев копится только ниже коридора и медленно стравливается выше него */
  if(S.y>bb){
    S.heat=Math.min(120,S.heat+(S.y-bb)*.019*dt);
    S.shake=Math.min(1,S.shake+(S.y-bb)*.0016*dt);
  }else S.heat=Math.max(0,S.heat-.34*dt);
  if(S.heat>=100){
    G.hull-=.5*dt;
    if(G.t-S.lastWarn>90){S.lastWarn=G.t;sfx("hit");}
    /* автомат прерывает заход раньше гибели: сцена входится одним нажатием,
       и первый же неудачный урок стоил ВЕСЬ корпус и груз (плейтест
       30.08.2026). Ожог до пятой части корпуса остаётся уроком, аварийный
       ремонт приберегается для настоящих аварий. */
    if(G.hull<=st.hullMax*.18){exitScoop("Автомат прервал заход\nкорпус на пределе");return;}
    if(G.hull<=0){G.scoop=null;G.mode="system";wreck("атмосфера гиганта");return;}
  }
  /* сбор идёт только в коридоре и только пока есть место в трюме */
  const inBand=S.y>=bt&&S.y<=bb;
  const full=held()>=st.cargoMax;
  if(inBand&&!full){
    S.got+=(.008+st.drill*.004)*dt;
    while(S.got>=1){
      S.got-=1;
      /* гелий-3 и антивещество — каждая третья единица, пока залежь есть (M466) */
      const fk=(typeof farScoopPick==="function")?farScoopPick(S):null;
      if(addRes(fk||"volatiles",1)){S.gain++;sfx("drill");if(fk)farTake(fk,1);}
    }
  }
  if(keys.left)S.vy-=.006*dt;      // мелкая доводка рулями, чтобы удержание было точнее
  if(keys.right)S.vy+=.006*dt;
  const heat=Math.round(S.heat);
  /* горящий корпус называет оба выхода: «нагрев растёт» — это прогноз погоды,
     а игроку в пожаре нужна инструкция (плейтест 30.08.2026) */
  G.prompt=(S.heat>=100?"КОРПУС ГОРИТ · ТЯГА — ВВЕРХ\nВЫХОД — УХОД НА ОРБИТУ":
      full?"ТРЮМ ПОЛОН · ВЫХОД — УХОД НА ОРБИТУ":
      inBand?"СБОР ИДЁТ · ДЕРЖИТЕ ВЫСОТУ":
      S.y<bt?"ВЫШЕ КОРИДОРА · СБОРНИК ХВАТАЕТ ПУСТОТУ":"НИЖЕ КОРИДОРА · НАГРЕВ РАСТЁТ")+
    "\nНАГРЕВ "+heat+"% · ГАЗЫ "+G.cargo.volatiles+" · ТРЮМ "+held()+"/"+st.cargoMax;
  /* Без топлива подняться нечем, и прежде сцена просто дожидалась пожара:
     корпус горел до пятой части, заход обрывал автомат, и весь труд оставался
     «ничем» (плейтест 03.09.2026). Пустой бак — провал захода, а не казнь:
     автомат вытягивает на остатке инерции, собранное остаётся в трюме, платой
     служат уже полученный нагрев и сам пустой бак. */
  if(G.fuel<=0&&S.y>bb){
    G.prompt="ТОПЛИВО КОНЧИЛОСЬ · АВАРИЙНЫЙ ПОДЪЁМ";
    /* «Вытягивает если, то груза тоже нет» (автор, 03.09.2026). Верно: на
       пустом баке корабль поднимают, сбрасывая набранное — иначе провал
       захода оказывается выгоднее аккуратного выхода. Теряется ровно то, что
       набрано в этом заходе: чужой груз из трюма никто за борт не бросает. */
    const lost=S.gain|0;
    if(lost>0)G.cargo.volatiles=Math.max(0,G.cargo.volatiles-lost);
    exitScoop(lost>0?"Топливо кончилось\nсборник сброшен, чтобы вытянуть корабль\nпотеряно газов: "+lost
                    :"Топливо кончилось\nавтомат вытянул на орбиту");
    return;
  }
}
/* небо гиганта — поле на видеокарте: 19a1-scoop-gpu (G9). Пиксельный цикл giantTex
   и его кэш на три гиганта ушли вместе с растягиванием одной замёрзшей ленты */
/* экранная точка ↔ путь: корабль стоит на W*.34, мир течёт мимо */
function scoopScrX(S,wx){return W*.34+(wx-S.x)*SCOOP_PX;}
function drawScoop(){
  const S=G.scoop;
  const sh=(S.shake>0?(rndFx()-.5)*S.shake*7:0);
  ctx.save();ctx.translate(0,sh);
  /* небо гиганта, глубина и гроза — одно живое поле на видеокарте (19a1) */
  const pass=gpuScene(),LS=scoopGpuAir(pass,S,sh);
  /* кромки сдвига с валами, набегающий поток и коридор сбора — второе поле (19a1).
     Коридор рисуется по тем же координатам, по каким считается столкновение
     (scoopCenter), иначе картинка врёт про правила */
  scoopGpuFlow(pass,S,sh,LS);
  const hband=H*(SCOOP_BAND[1]-SCOOP_BAND[0]);
  /* подпись полосы читается поверх газа: плашка под ней, как у фишек, и
     кегль по линейке интерфейса. На .55 без подложки лиловый газ съедал её
     до контраста 2.6 (M443, детектор текста) */
  {
    const u=uiK(),ly=scoopCenter(S.x-W*.34/SCOOP_PX)-hband*.5-6*u;
    ctx.font=uiFont(9);ctx.textAlign="left";
    const lw=ctx.measureText("ПОЛОСА СБОРА").width;
    ctx.fillStyle="rgba(5,7,12,.62)";ctx.fillRect(10,ly-10*u,lw+8*u,13*u);
    ctx.fillStyle="rgba(127,224,200,.92)";
    ctx.fillText("ПОЛОСА СБОРА",14,ly);
  }
  /* помехи, след, раструбы и сам корабль — на видеокарте, тем же светом звезды (19a1).
     Ядро — тело с глазом и рукавами, плюмаж несёт, град — колотый лёд */
  scoopGpuThings(pass,S,sh,LS);
  ctx.restore();
  /* приборы: нагрев — главный, он же и убивает */
  /* ── прибор, а не пустая рамка (M233) ──
     Плашка была на 20 px, а подпись печаталась на by+16 — то есть НА нижней
     кромке рамки, наполовину снаружи; при нуле нагрева заливки нет вовсе, и
     весь прибор читался пустым прямоугольником с приблудной строкой. У шкалы
     обязан быть жёлоб (видно, что это шкала, даже когда пусто) и порог, за
     которым горит корпус, — тогда ноль означает «холодно», а не «сломано». */
  /* прибор — интерфейс и растёт с бортом (M221): в окне 1920 плашка и её
     подпись стояли в 9 px рядом с раздутыми панелями (M443, детектор кегля) */
  withScale(uiK(),()=>{
    const bw=Math.min(W-40,300),bx=W/2-bw/2,by=H*.145;   /* ниже угловых панелей: на 26 полоса налезала на них */
    ctx.fillStyle="rgba(6,10,16,.72)";ctx.fillRect(bx-8,by-7,bw+16,30);
    ctx.strokeStyle="rgba(242,178,92,.5)";ctx.lineWidth=1;ctx.strokeRect(bx-8.5,by-7.5,bw+17,31);
    const hk=clamp(S.heat/100,0,1);
    ctx.fillStyle="rgba(0,0,0,.45)";ctx.fillRect(bx,by,bw,8);          // жёлоб шкалы
    ctx.fillStyle="rgba(242,178,92,.16)";ctx.fillRect(bx,by,bw,1);
    ctx.fillStyle="rgba(255,80,60,.18)";ctx.fillRect(bx+bw*.8,by,bw*.2,8);  // порог пожара
    ctx.fillStyle=hk>.8?"rgba(255,80,60,.95)":(hk>.5?"rgba(255,180,80,.9)":"rgba(127,224,200,.85)");
    ctx.fillRect(bx,by,bw*hk,8);
    ctx.fillStyle="rgba(242,178,92,.35)";                              // деления по четвертям
    for(let i=1;i<4;i++)ctx.fillRect(bx+bw*i/4,by,1,8);
    ctx.fillStyle="rgba(242,178,92,.85)";ctx.font="9px ui-monospace,monospace";ctx.textAlign="center";
    ctx.fillText("НАГРЕВ КОРПУСА "+Math.round(S.heat)+"%",W/2,by+19);
    if(S.heat>=100){
      ctx.fillStyle=(Math.sin(G.t*.3)>0)?"rgba(255,70,50,.9)":"rgba(255,70,50,.3)";
      ctx.textAlign="center";ctx.font="12px ui-monospace,monospace";
      ctx.fillText("ПЕРЕГРЕВ · КОРПУС ГОРИТ",W/2,by+42);   /* под выросшей плашкой */
    }
  });
}
