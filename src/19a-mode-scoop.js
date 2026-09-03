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
      if(G.hull<=0){G.scoop=null;G.mode="system";wreck();return;}
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
    if(G.hull<=0){G.scoop=null;G.mode="system";wreck();return;}
  }
  /* сбор идёт только в коридоре и только пока есть место в трюме */
  const inBand=S.y>=bt&&S.y<=bb;
  const full=held()>=st.cargoMax;
  if(inBand&&!full){
    S.got+=(.008+st.drill*.004)*dt;
    while(S.got>=1){S.got-=1;if(addRes("volatiles",1)){S.gain++;sfx("drill");}}
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
/* ══════════════ небо гиганта: полосы, а не лепёшки ══════════════ */
/* Первая версия рисовала два десятка полупрозрачных эллипсов на вертикальном
   градиенте. На экране это читалось как наклейки на обоях: у гиганта не было
   ни течения, ни глубины, ни масштаба — а масштаб здесь и есть содержание
   сцены. Настоящие ленты Юпитера получаются не из фигур, а из **искажения
   области**: широтные полосы, продавленные шумом по горизонтали, дают
   фестоны, завихрения и вихри сами собой, без единого нарисованного овала.

   Считается это один раз на планету в отдельный канвас (384×192), дальше
   только растягивается и прокручивается тремя эшелонами с разной скоростью —
   параллакс и есть ощущение скорости. */
/* Кэш на три последних гиганта, а не на одного: выпечка неба стоит ~400 мс,
   и с кэшем в одну запись каждый вход в соседний гигант пёк заново — на
   третьем-четвёртом заходе пауза уже заметна. Три записи покрывают обычный
   маршрут «полетал у одного, слетал ко второму, вернулся». */
const GIANT={key:"",tex:null,cache:[]};
const GIANT_KEEP=3;
function giantTex(p){
  if(GIANT.key===p.seed)return GIANT.tex;
  const hit=GIANT.cache.find(e=>e.key===p.seed);
  if(hit){GIANT.key=hit.key;GIANT.tex=hit.tex;return hit.tex;}
  const TW=768,TH=384;   // 512×256 тянулось на полтора экрана и мылилось (G5)
  const cn=document.createElement("canvas");cn.width=TW;cn.height=TH;
  const c=cn.getContext("2d"),img=c.createImageData(TW,TH),d=img.data;
  const pal=p.T.pal,sd=p.seed|0;
  /* два-три вихря: не рисуются поверх, а вмешиваются в само искажение —
     поэтому полосы вокруг них загибаются, как в настоящем шторме */
  /* характер гиганта — структура, а не палитра (хвост G5): полосатый с
     двумя-тремя вихрями, пятнистый с россыпью мелких штормов, и струйный,
     у которого ленты рвутся восходящими плюмажами */
  const kind=(sd>>>3)%3;
  const rr=rng(hashi(sd,0x5701,9)),eyes=[];
  const ne=kind===1?6+Math.floor(rr()*4):2+Math.floor(rr()*2);
  for(let i=0;i<ne;i++)
    eyes.push({x:rr(),y:.18+rr()*.64,r:kind===1?.025+rr()*.035:.06+rr()*.09,s:(rr()<.5?-1:1)*(.5+rr())});
  /* цвет одной точки ленты. u берётся не только в [0,1): у краёв текстуру
     считают дважды — при u и при u-1 — и сшивают. Так лента замыкается в кольцо
     без шва и без зеркала: зеркало склеивало кромку, но на пол-экрана
     расплывалась бабочка из отражённого вихря. */
  function pix(u,v){
    const w1=fbm2(u*3.2,v*8.5,sd,4)-.5;
    const w2=fbm2(u*7.4+3.1,v*15.0-2.2,sd^0x99,3)-.5;
    let uu=u+w1*.30+w2*.07, vv=v+w2*.022+w1*.012;
    for(const e of eyes){
      let dx=u-e.x;dx-=Math.round(dx);                 // ближайшая копия по кругу
      const dy=(v-e.y)*1.9, dd=Math.hypot(dx,dy);
      if(dd<e.r*2.2){
        const k=(1-dd/(e.r*2.2)),ang=k*k*e.s*2.4;
        const ca=Math.cos(ang),sa=Math.sin(ang);
        uu=e.x+(dx*ca-dy*sa);vv=e.y+(dx*sa+dy*ca)/1.9;
      }
    }
    /* широта задаёт полосу, шум — её толщину и рваность */
    /* фронт резкий, хвост мягкий: лента — это облачный вал, у него передняя
       кромка крутая, а задняя расплывается (хвост G5). Синус давал обе
       кромки одинаково мягкими. У струйного типа ленты ещё и рвёт по v */
    const phs=vv*7.0+Math.sin(uu*2.1)*.08+(kind===2?(fbm2(uu*5,vv*3,sd^0x31,2)-.5)*.6:0);
    const fr=phs-Math.floor(phs);
    const band=fr<.26?fr/.26:1-(fr-.26)/.74;
    const grain=fbm2(uu*9,vv*22,sd^0x1234,3)-.5;
    /* контраст: полосы должны читаться лентами, а не переливом */
    let t=clamp(vv*.42+band*.52+grain*.18,0,1);
    t=clamp((t-.5)*1.5+.5,0,1);t=Math.pow(t,1.35);   // светлые сливки — редкость, а не фон
    /* дизер: растянутый контраст на пяти ступенях палитры давал ступеньки
       поперёк лент — на плавных местах они читались лесенкой */
    t=clamp(t+((hashi(Math.round(u*4096),Math.round(v*4096),sd)&255)/255-.5)*.022,0,1);
    const fi=t*(pal.length-1), i0=Math.min(pal.length-1,Math.floor(fi)), i1=Math.min(pal.length-1,i0+1);
    const f=fi-i0, a=pal[i0], b=pal[i1];
    /* мелкая турбулентность в светлоте — иначе лента остаётся плоской заливкой */
    const lift=1+(fbm2(uu*26,vv*40,sd^0x77,2)-.5)*.20;
    return [(a[0]+(b[0]-a[0])*f)*lift,(a[1]+(b[1]-a[1])*f)*lift,(a[2]+(b[2]-a[2])*f)*lift];
  }
  const SEAM=.22;                                    // ширина сшивки в долях ленты
  for(let y=0;y<TH;y++){
    const v=y/TH;
    for(let x=0;x<TW;x++){
      const o=(y*TW+x)*4, u=x/TW;
      let col=pix(u,v);
      if(u>1-SEAM){
        const s=(u-(1-SEAM))/SEAM, k=s*s*(3-2*s);      // мягкая ступень
        const col2=pix(u-1,v);
        col=[col[0]+(col2[0]-col[0])*k,col[1]+(col2[1]-col[1])*k,col[2]+(col2[2]-col[2])*k];
      }
      d[o]=clamp(col[0],0,255);d[o+1]=clamp(col[1],0,255);d[o+2]=clamp(col[2],0,255);d[o+3]=255;
    }
  }
  c.putImageData(img,0,0);
  GIANT.key=p.seed;GIANT.tex=cn;
  GIANT.cache.push({key:p.seed,tex:cn});
  while(GIANT.cache.length>GIANT_KEEP)GIANT.cache.shift();
  return cn;
}
/* экранная точка ↔ путь: корабль стоит на W*.34, мир течёт мимо */
function scoopScrX(S,wx){return W*.34+(wx-S.x)*SCOOP_PX;}
function drawScoop(){
  const S=G.scoop,p=S.p,[bt,bb]=scoopBandAt(S.x);
  const pal=p.T.pal;
  const sh=(S.shake>0?(Math.random()-.5)*S.shake*7:0);
  ctx.save();ctx.translate(0,sh);
  const T=giantTex(p);
  /* Два эшелона одной ленты: дальний крупный и медленный, ближний мельче и
     быстрее. Скорость читается только по разнице между ними. Трёх не берём:
     одинаковая лента, наложенная трижды, взаимно усредняется в розовую кашу */
  const layers=[[1.35,.30,1,1],[1.0,.85,.3,.9]];
  for(const L of layers){
    const hgt=H*L[0], wid=hgt*1.25;   // тайл шире: при .62 он повторялся дважды на экран, и волны читались копиями (G5)
    const off=-((S.x*L[1]*9+(L===layers[1]?wid*.5:0))%wid);
    ctx.globalAlpha=L[2];
    const yTop=H*.5-hgt*.5*L[3];
    for(let i=-1;i<=Math.ceil(W/wid)+1;i++)ctx.drawImage(T,off+i*wid,yTop,wid,hgt);
  }
  ctx.globalAlpha=1;
  /* ── глубина ──
     Верх и низ кадра выглядели одинаково: две ленты одной текстуры на весь
     экран, и сцена читалась обоями, а не атмосферой, у которой есть верх и
     низ. Теперь вверху разрежённая холодная муть с проглядывающей чернотой
     космоса, внизу — плотная горячая мгла, и в самом низу тёмное дно, куда
     свет уже не доходит. Это же и говорит игроку, куда падать не надо. */
  ctx.drawImage(screenLayer("scoopdepth|"+p.seed,()=>{
  const g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,"rgba(3,5,11,.95)");
  g.addColorStop(.14,"rgba(8,12,24,.55)");
  g.addColorStop(.34,"rgba(10,14,26,.10)");
  g.addColorStop(.58,"rgba(0,0,0,0)");
  /* дно оказалось самым СВЕТЛЫМ местом кадра: кремовая лента внизу спорила с
     замыслом, по которому вниз лететь страшно. Тёплый подсвет остаётся узкой
     полосой, а под ним мгла глушит всё — свет туда уже не доходит */
  g.addColorStop(.74,"rgba("+pal[4].join(",")+",.26)");
  g.addColorStop(.86,"rgba("+Math.round(pal[0][0]*.7)+","+Math.round(pal[0][1]*.6)+","
    +Math.round(pal[0][2]*.7)+",.62)");
  g.addColorStop(1,"rgba(6,4,10,.93)");
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  }),0,0,W,H);   // градиент глубины неизменен — слой, а не 10 мс на кадр (G0)
  /* ── кромки сдвига ──
     Текстура растягивается на полтора экрана и мылится: ни одной чёткой
     границы, глазу не за что зацепиться, и скорость не читается. У настоящих
     полос гиганта кромка резкая — там, где два потока идут в разные стороны.
     Кромки рисуем в экранных координатах: волнистая линия, светлая сверху,
     тёмная снизу, и каждая едет со своей скоростью — вот это и есть скорость. */
  /* Семь кромок ровной волной через весь кадр читались змеями: одинаковая
     амплитуда на равных шагах — это узор, а не течение. Их меньше, они гуще
     книзу (там плотнее газ) и каждая своей длины волны. */
  for(let e=0;e<5;e++){
    const re=rng(hashi(p.seed,e*7717,0x3D9));
    const v=.22+e*e*.036+e*.09+re()*.04, ey=H*v;
    const dep=v<.5?1-v*1.2:.4+v*.4;                 // ближние (нижние) едут быстрее
    const amp=6+re()*16, wl=180+re()*260, spd=(3+re()*7)*dep;
    ctx.beginPath();
    for(let x=-20;x<=W+20;x+=14){
      const yy=ey+Math.sin((x+S.x*spd*11)/wl*TAU)*amp
                 +Math.sin((x*1.7-S.x*spd*6)/(wl*.43)*TAU)*amp*.32;
      if(x<0)ctx.moveTo(x,yy);else ctx.lineTo(x,yy);
    }
    /* Контурная линия поверх мыла — худшее из решений: она читается карандашом
       по обоям, потому что живёт отдельно от тона. Кромка — это ТЕНЬ под
       выступающей лентой: широкий мягкий мазок вниз и узкий тёмный по самой
       границе, без единой светлой обводки. */
    ctx.save();ctx.lineCap="round";
    ctx.strokeStyle="rgba(10,6,16,"+(.16+dep*.18).toFixed(2)+")";
    ctx.lineWidth=14;ctx.globalAlpha=.55;ctx.stroke();
    ctx.globalAlpha=1;
    ctx.strokeStyle="rgba(12,8,18,"+(.20+dep*.20).toFixed(2)+")";ctx.lineWidth=2.6;ctx.stroke();
    ctx.restore();
    /* ── завитки сдвига (M169) ──
       Ровная тень вдоль всей кромки читается проведённой линией. На настоящей
       границе двух потоков растут ВАЛЫ: гребень заворачивается в крючок,
       крючки идут чередой и едут вместе с лентой. Их и рисуем — светлым по
       верхней стороне, тенью под ней; это и есть «резкий фронт» из долга G5. */
    const cw=110+re()*90;
    const off=(S.x*spd*11)%cw;
    for(let x=-cw-off;x<W+cw;x+=cw){
      const yy=ey+Math.sin((x+S.x*spd*11)/wl*TAU)*amp
                 +Math.sin((x*1.7-S.x*spd*6)/(wl*.43)*TAU)*amp*.32;
      /* Вал — это ТЕЛО, а не контур: линиями он читался бровками, набросанными
         карандашом поверх облаков (самокритика M169). Мягкий валик с бликом
         сверху и тенью снизу, размер и наклон из хеша — чередой, но не под
         копирку. */
      const hh=hashi(Math.round(x/cw),e,0x0B11);
      const cr=9+((hh&7)/7)*13, tilt=(((hh>>>3)&15)/15-.5)*.5;
      ctx.save();
      ctx.translate(x,yy);ctx.rotate(tilt);
      const rg=ctx.createLinearGradient(0,-cr*.8,0,cr*.8);
      rg.addColorStop(0,"rgba(248,242,255,"+(.11+dep*.07).toFixed(3)+")");
      rg.addColorStop(.45,"rgba(200,190,220,0)");
      rg.addColorStop(1,"rgba(8,4,14,"+(.13+dep*.10).toFixed(3)+")");
      ctx.fillStyle=rg;
      ctx.beginPath();ctx.ellipse(0,0,cr*1.7,cr*.72,0,0,TAU);ctx.fill();
      ctx.restore();
    }
  }
  /* набегающий поток: тонкие штрихи по всему кадру, гуще к низу */
  ctx.strokeStyle="rgba(255,255,255,.05)";ctx.lineWidth=1;
  for(let i=0;i<26;i++){
    const rr2=rng(hashi(p.seed,i*331,0x51EA));
    const yy=rr2()*H, len=40+rr2()*180, spd=2+rr2()*5;
    const xx=(W+220)-((S.x*spd*11+rr2()*3000)%(W+440));
    ctx.globalAlpha=.03+.09*(yy/H);
    ctx.beginPath();ctx.moveTo(xx,yy);ctx.lineTo(xx+len,yy);ctx.stroke();
  }
  ctx.globalAlpha=1;
  /* гроза в нижних слоях: редкая вспышка снизу — там, куда лучше не опускаться */
  if(Math.random()<.012){
    const lx=Math.random()*W, ly=H*(.86+Math.random()*.1);
    const fg=ctx.createRadialGradient(lx,ly,0,lx,ly,180);
    fg.addColorStop(0,"rgba(255,246,220,.5)");fg.addColorStop(1,"rgba(255,200,140,0)");
    ctx.fillStyle=fg;ctx.beginPath();ctx.arc(lx,ly,180,0,TAU);ctx.fill();
  }
  /* коридор сбора: не две пунктирные линейки поверх мира, а слой более
     плотного газа — он светится и в нём висит взвесь, которую и собирают */
  /* ── дорога, а не полка ──
     Полоса шла ровной лентой через кадр и держать её было нечем — она сама
     держала. Теперь это ДОРОГА: она уходит вверх и вниз, её видно вперёд на
     полтора корпуса пути, и лететь надо по ней. Рисуется по тем же
     координатам, по каким считается столкновение (scoopCenter), иначе
     картинка врёт про правила. */
  const hband=H*(SCOOP_BAND[1]-SCOOP_BAND[0]);
  const STEP=16,cols=[];
  for(let X=-STEP;X<=W+STEP;X+=STEP)cols.push([X,scoopCenter(S.x+(X-W*.34)/SCOOP_PX)]);
  function bandPath(off){
    ctx.beginPath();
    for(let i=0;i<cols.length;i++){const c=cols[i];
      if(i)ctx.lineTo(c[0],c[1]+off);else ctx.moveTo(c[0],c[1]+off);}
  }
  ctx.save();
  ctx.beginPath();
  for(let i=0;i<cols.length;i++){const c=cols[i];
    if(i)ctx.lineTo(c[0],c[1]-hband*.5);else ctx.moveTo(c[0],c[1]-hband*.5);}
  for(let i=cols.length-1;i>=0;i--)ctx.lineTo(cols[i][0],cols[i][1]+hband*.5);
  ctx.closePath();
  ctx.fillStyle="rgba(127,224,200,.17)";ctx.fill();
  ctx.clip();
  /* взвесь внутри ленты: она едет вместе с дорогой, а не поперёк неё */
  ctx.fillStyle="rgba(190,255,238,.5)";
  for(let i=0;i<44;i++){
    const rr3=rng(hashi(p.seed,i*97,0x9AD));
    const spd=3+rr3()*4;
    const xx=(W+60)-((S.x*spd*2.2+rr3()*2600)%(W+120));
    const yy=scoopCenter(S.x+(xx-W*.34)/SCOOP_PX)+(rr3()-.5)*hband*.86;
    ctx.globalAlpha=.10+rr3()*.35;
    ctx.fillRect(xx,yy,2.4,1.4);
  }
  ctx.globalAlpha=1;ctx.restore();
  /* Полоса терялась в лиловой каше: слой газа плотнее, но по краям его не
     видно, а игрок ищет глазами именно границу. Кромка идёт через весь кадр
     штрихом — линейка это или газ, спор решается в пользу читаемости. */
  for(const off of [-hband*.5,hband*.5]){
    ctx.save();ctx.setLineDash([9,7]);ctx.lineDashOffset=-(S.x*7)%16;
    ctx.strokeStyle="rgba(150,240,214,.34)";ctx.lineWidth=1;
    bandPath(off);ctx.stroke();ctx.restore();
  }
  ctx.fillStyle="rgba(127,224,200,.55)";ctx.font="9px ui-monospace,monospace";ctx.textAlign="left";
  ctx.fillText("ПОЛОСА СБОРА",14,cols[1][1]-hband*.5-6);
  /* ── помехи ──
     Ядро — тело с глазом и завихрением, плюмаж — восходящая струя, град —
     россыпь колючих кристаллов. Все три рисуются одним светом (§ свод правил):
     тень снизу, блик сверху, цвет из палитры гиганта. */
  for(const o of S.obs){
    const X=scoopScrX(S,o.x);
    if(X<-160||X>W+160)continue;
    if(o.k===0){
      /* ВИХРЬ — тело, а не спираль карандашом: тёмное ядро, горячий обод и
         рукав, заворачивающийся по ходу. Свет один, сверху-слева, как во всей
         сцене; поэтому низ у него глухой, а верх задран бликом. */
      const R=o.r*1.5;
      const g=ctx.createRadialGradient(X-R*.22,o.y-R*.3,R*.08,X,o.y,R);
      g.addColorStop(0,"rgba(14,9,20,"+(o.hit?.55:.82)+")");
      g.addColorStop(.42,"rgba("+p.T.pal[1].join(",")+","+(o.hit?.34:.58)+")");
      g.addColorStop(.78,"rgba(255,214,168,"+(o.hit?.10:.22)+")");
      g.addColorStop(1,"rgba(255,214,168,0)");
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(X,o.y,R,0,TAU);ctx.fill();
      ctx.save();ctx.beginPath();ctx.arc(X,o.y,o.r,0,TAU);ctx.clip();
      ctx.strokeStyle="rgba(248,236,255,"+(o.hit?.10:.26)+")";ctx.lineWidth=2.4;ctx.lineCap="round";
      for(const s0 of [0,TAU/2]){
        ctx.beginPath();
        for(let a=0;a<TAU*.9;a+=.2){
          const rr=o.r*(.16+a/(TAU*.9)*.9);
          const th=a*o.sp+s0+S.x*.02*o.sp;
          const xx=X+Math.cos(th)*rr,yy=o.y+Math.sin(th)*rr*.82;
          if(a===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);
        }
        ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle="rgba(10,6,14,.42)";ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(X,o.y+2,o.r*.98,.15,Math.PI-.15);ctx.stroke();
    }else if(o.k===1){
      /* ПЛЮМАЖ — восходящая струя, а не прямоугольник: снизу узкое горло,
         кверху разваливается клубами, края рвутся. Он не бьёт — он несёт. */
      const up=o.up,hgt=H*.30;
      ctx.save();
      const g=ctx.createLinearGradient(X,o.y+hgt*.5*up,X,o.y-hgt*.5*up);
      g.addColorStop(0,"rgba(255,206,150,.34)");
      g.addColorStop(.55,"rgba(255,226,190,.16)");
      g.addColorStop(1,"rgba(255,236,214,0)");
      ctx.fillStyle=g;
      ctx.beginPath();
      for(const sgn of [-1,1]){
        const seq=sgn<0?[0,1]:[1,0];
        for(let t=seq[0];sgn<0?t<=1.001:t>=-.001;t+=sgn<0?.06:-.06){
          const yy=o.y+(t-.5)*hgt*up;
          const w=o.r*(.45+t*1.5)+Math.sin(t*7+S.x*.04)*o.r*.3;
          ctx.lineTo(X+sgn*w,yy);
        }
      }
      ctx.closePath();ctx.fill();
      /* клубы по стволу: пара витков, чтобы струя жила */
      ctx.globalAlpha=.5;
      for(let i2=0;i2<5;i2++){
        const t=(i2/5+((S.x*.012+o.x*.01)%1))%1;
        const yy=o.y+(t-.5)*hgt*up, rr=o.r*(.4+t*1.1);
        const cg2=ctx.createRadialGradient(X,yy,0,X,yy,rr);
        cg2.addColorStop(0,"rgba(255,232,198,"+(.18*(1-t)).toFixed(3)+")");
        cg2.addColorStop(1,"rgba(255,232,198,0)");
        ctx.fillStyle=cg2;ctx.beginPath();ctx.arc(X,yy,rr,0,TAU);ctx.fill();
      }
      ctx.globalAlpha=1;ctx.restore();
    }else{
      /* ГРАД — колотый лёд: тёмная нижняя грань, холодный блик сверху,
         короткий морозный след позади. Белым ромбиком он читался наклейкой. */
      ctx.save();ctx.translate(X,o.y);
      ctx.strokeStyle="rgba(214,238,255,.22)";ctx.lineWidth=1.2;
      ctx.beginPath();ctx.moveTo(o.r*.6,0);ctx.lineTo(o.r*.6+16,0);ctx.stroke();
      ctx.rotate(S.x*.03+o.x);
      const g=ctx.createLinearGradient(0,-o.r,0,o.r);
      g.addColorStop(0,"rgba(236,250,255,"+(o.hit?.35:.92)+")");
      g.addColorStop(.55,"rgba(150,196,224,"+(o.hit?.24:.72)+")");
      g.addColorStop(1,"rgba(26,40,58,"+(o.hit?.30:.85)+")");
      ctx.fillStyle=g;
      ctx.beginPath();
      for(let a=0;a<TAU;a+=TAU/6)ctx.lineTo(Math.cos(a)*o.r,Math.sin(a)*o.r*.72);
      ctx.closePath();ctx.fill();
      ctx.strokeStyle="rgba(8,12,20,.55)";ctx.lineWidth=1;ctx.stroke();
      ctx.restore();
    }
  }
  /* корабль: летит боком, слева направо, с набегающим потоком */
  const sx=W*.34,sy=S.y;
  if(S.y>bb){
    const k=clamp((S.y-bb)/120,0,1);
    ctx.strokeStyle="rgba(255,170,90,"+(.25+k*.5).toFixed(2)+")";ctx.lineWidth=2;
    for(let i=0;i<9;i++){
      const yy=sy-26+i*6.5, l=30+Math.abs(Math.sin(i*1.7+S.x*.05))*70*k;
      ctx.beginPath();ctx.moveTo(sx-14,yy);ctx.lineTo(sx-14-l,yy+ (i-4)*1.6);ctx.stroke();
    }
  }
  /* ── след в газе ──
     Корабль летел поверх обоев: среда его не замечала. Теперь за ним остаётся
     разрез — светлая полоса, которую он вспорол, и два завитка по краям, где
     газ сходится обратно. Это же единственное, по чему видно скорость вблизи. */
  {
    const tw=190+Math.abs(S.vy)*4;
    const tg=ctx.createLinearGradient(sx-14,0,sx-14-tw,0);
    tg.addColorStop(0,"rgba(236,246,255,.20)");
    tg.addColorStop(1,"rgba(236,246,255,0)");
    ctx.fillStyle=tg;ctx.fillRect(sx-14-tw,sy-5,tw,10);
    ctx.strokeStyle="rgba(236,246,255,.14)";ctx.lineWidth=1.2;
    for(const s of [-1,1]){
      ctx.beginPath();ctx.moveTo(sx-16,sy+s*4);
      for(let i=1;i<=7;i++){
        const t=i/7;
        ctx.lineTo(sx-16-t*tw,sy+s*(4+t*16)+Math.sin(t*7+S.x*.4+ (s>0?0:1.7))*4*t);
      }
      ctx.stroke();
    }
  }
  ctx.save();ctx.translate(sx,sy);ctx.rotate(S.bank*.5);ctx.scale(1.5,1.5);
  drawHull(G.shipId,keys.thrust&&G.fuel>0,false,S.bank);
  ctx.restore();
  /* сборник: два раструба забирают газ, пока корабль в коридоре */
  if(sy>=bt&&sy<=bb){
    ctx.strokeStyle="rgba(127,224,200,.8)";ctx.lineWidth=1.6;
    for(const s of [-1,1]){
      ctx.beginPath();
      ctx.moveTo(sx-6,sy+s*7);ctx.lineTo(sx-30,sy+s*13);ctx.stroke();
      for(let i=0;i<5;i++){
        const t=(S.x*4+i*22)%110;
        ctx.globalAlpha=.5-t/220;
        ctx.beginPath();ctx.arc(sx-30-t,sy+s*13+Math.sin(t*.1+i)*4,1.8,0,TAU);ctx.stroke();
      }
      ctx.globalAlpha=1;
    }
  }
  ctx.restore();
  /* приборы: нагрев — главный, он же и убивает */
  /* ── прибор, а не пустая рамка (M233) ──
     Плашка была на 20 px, а подпись печаталась на by+16 — то есть НА нижней
     кромке рамки, наполовину снаружи; при нуле нагрева заливки нет вовсе, и
     весь прибор читался пустым прямоугольником с приблудной строкой. У шкалы
     обязан быть жёлоб (видно, что это шкала, даже когда пусто) и порог, за
     которым горит корпус, — тогда ноль означает «холодно», а не «сломано». */
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
}
