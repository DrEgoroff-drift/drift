/* ══════════════ дом изнутри: по нему ходят ══════════════
   M170, по просьбе автора: «дом должен быть на планете, до него можно дойти,
   в него зайти, походить по комнатам, порассматривать, чтобы Вега тоже
   отрисовывалась — сидела, бегала». Панель «ВЛАДЕНИЕ» (27e) остаётся сводкой;
   здесь дом — МЕСТО, такое же, как поверхность или база.

   ПРАВИЛА ФАЙЛА:
   1. Мерило — человек. Хозяин 46 px: это ближе, чем на поверхности (17), и
      дальше, чем портрет. Комнаты меряются им: дверь в полтора роста, стол по
      бедро, стеллаж в полтора.
   2. Комнаты — те же ступени (HOME_TIERS), в том же порядке слева направо.
      Чего не построено — того нет: за последней стеной глухая кладка.
   3. Ходить, а не листать: камера едет за человеком, комнаты разделены
      проёмами, у каждой вещи своё место, к которому можно подойти.
   4. Жильцы живут: у каждого своё место, свои дела и свой шаг. Вега сидит,
      встаёт, ходит и работает — это её дом тоже.
   5. Ничего нового не хранится. Позиция, дела жильцов, время — эфемерны;
      сохранение остаётся v:4. */

const HIN_MAN=46;                       /* рост хозяина в единицах комнаты */
const HIN_FLOOR=0;                      /* пол — ноль по вертикали, всё вверх — минус */
const HIN_ROOM_H=HIN_MAN*2.3;           /* высота комнаты: чуть выше двух ростов.
                                           2.6 читалось цехом: дом — не ангар,
                                           и потолок в нём слышно головой (M173) */
const HIN_DOORW=HIN_MAN*1.1;
/* ширина комнаты по ступеням: угол тесный, гараж и жилая часть широкие */
const HIN_ROOM_W=[190,150,290,170,240,210,260,230];
function hinRooms(){
  const H=G.home;if(!H||!H.tier)return [];
  const out=[];let x=0;
  for(let i=0;i<H.tier;i++){
    const T=HOME_TIERS[i],w=HIN_ROOM_W[i]||200;
    out.push({key:T.key,ru:T.ru,x,w,i});
    x+=w;
  }
  return out;
}
function hinWidth(){const R=hinRooms();return R.length?R[R.length-1].x+R[R.length-1].w:0;}
function hinRoomAt(x){
  for(const r of hinRooms())if(x>=r.x&&x<r.x+r.w)return r;
  return null;
}
/* ── вход и выход ── */
function enterHomeIn(){
  const H=G.home;if(!H||!H.tier)return;
  for(const k in keys)keys[k]=false;
  G.hin={x:HIN_ROOM_W[0]*.5,vx:0,face:1,walk:0,phase:0,cam:0,
         look:null,lookT:0,folk:hinFolkMake(),t0:G.t};
  G.mode="homein";
  say("Дом\n← → пройтись · ДЕЙСТВИЕ — рассмотреть\nНАЗАД — выйти во двор",200);
}
function exitHomeIn(){
  G.hin=null;
  G.mode="surface";
  for(const k in keys)keys[k]=false;
}
/* ── жильцы ──
   Хозяин ходит сам; остальные живут по своим делам. У каждого: комната, точка,
   к которой он идёт, поза и таймер. Дела берутся из того, кто это: Вега сидит
   в кабинете и встаёт к витрине, домочадец хлопочет в жилой части, стажёр
   вертится в мастерской, экипаж отдыхает. */
function hinFolkMake(){
  const R=hinRooms(),out=[];
  if(!R.length)return out;
  const roomX=key=>{const r=R.find(v=>v.key===key);return r?r.x+r.w*.5:R[R.length-1].x+R[R.length-1].w*.5;};
  /* Вега узнаётся по платью и косынке — тем же, что на портрете в кресле
     (11w-vega): один и тот же человек не может выглядеть в доме иначе */
  if(typeof vegaAboard==="function"&&vegaAboard())
    out.push({who:"vega",name:"ВЕГА",col:[91,74,110],look:{skirt:1,scarf:"#b8323a",skin:[230,201,168]},
              x:roomX("study"),tx:roomX("study"),pose:"sit",t:0,face:-1,home:"study"});
  if(typeof homeMateName==="function"&&G.home.tier>=2)
    out.push({who:"mate",name:homeMateName().toUpperCase(),col:[196,168,132],
              x:roomX("living"),tx:roomX("living"),pose:"work",t:0,face:1,home:"living"});
  if(typeof traineeAboard==="function"&&traineeAboard())
    out.push({who:"trainee",name:"СТАЖЁР",col:[168,196,150],x:roomX("shop"),tx:roomX("shop"),
              pose:"work",t:0,face:1,home:"shop"});
  /* экипаж, что сейчас не в рейсе, отдыхает дома — но не больше двоих в кадре */
  const crew=(G.crew||[]).filter(c=>!c.run).slice(0,2);
  crew.forEach((c,i)=>out.push({who:"crew",name:(c.name||"").toUpperCase(),col:[176,164,150],
    x:roomX("hall")+(i?52:-52),tx:roomX("hall")+(i?52:-52),pose:i?"stand":"sit",t:0,face:i?-1:1,home:"hall"}));
  /* у каждого своя глубина в комнате (M173): без неё пятеро жильцов стояли
     на одной линии и читались рядом одинаковых вырезок, а не компанией */
  out.forEach((f,i)=>{f.z=((i*7)%5)/5*.8;});
  return out;
}
function hinFolkTick(dt){
  const S=G.hin;if(!S)return;
  const R=hinRooms();if(!R.length)return;
  for(const f of S.folk){
    f.t-=dt;
    if(f.t<=0){
      /* новое дело: посидеть, поработать, перейти в другую комнату */
      const r=rng(hashi(Math.round(G.t),f.x|0,0x40F1));
      const roll=r();
      if(roll<.34){f.pose="sit";f.t=300+r()*400;}
      else if(roll<.62){f.pose="work";f.t=260+r()*380;}
      else{
        /* уходит в свою или в соседнюю комнату — дом живёт, а не позирует */
        const room=(r()<.6?R.find(v=>v.key===f.home):R[Math.floor(r()*R.length)])||R[0];
        f.tx=room.x+22+r()*(room.w-44);
        f.pose="walk";f.t=200+r()*300;
      }
    }
    /* посторонись: хозяин и жилец стояли ровно в одной точке и рисовались
       один сквозь другого (самокритика M170). Кто стоит — отступает в сторону.
       Жильцы расходятся и между собой: две фигуры в одной точке читаются
       кляксой ничуть не лучше. */
    const gap=f.x-S.x;
    if(Math.abs(gap)<16){
      f.x+=(gap>=0?1:-1)*.9*dt;
      f.face=gap>=0?1:-1;
      if(f.pose==="sit")f.pose="stand";
    }
    for(const o of S.folk){
      if(o===f)continue;
      const d2=f.x-o.x;
      if(Math.abs(d2)<26)f.x+=(d2>=0?1:-1)*.5*dt;   /* 14 было треть роста: жильцы всё равно слипались (M173) */
    }
    if(f.pose==="walk"){
      const d=f.tx-f.x;
      if(Math.abs(d)<3){f.pose=Math.random()<.5?"stand":"work";f.t=200+Math.random()*300;}
      else{f.face=d>0?1:-1;f.x+=f.face*Math.min(1.05,Math.abs(d))*dt*.7;f.walk=(f.walk||0)+dt*.22;}
    }
  }
}
/* ── ход ── */
function updateHomeIn(dt){
  const S=G.hin;if(!S){G.mode="surface";return;}
  const wmax=hinWidth();
  const spd=1.55;
  let mv=0;
  if(keys.left)mv-=1;
  if(keys.right)mv+=1;
  if(mv){S.face=mv;S.walk+=dt*.25;}
  S.x=clamp(S.x+mv*spd*dt,14,wmax-14);
  S.phase+=dt*.05;
  hinFolkTick(dt);
  /* что рядом: вещь этой комнаты, к которой стоит присмотреться */
  const near=hinNear(S.x);
  const folk=S.folk.find(f=>Math.abs(f.x-S.x)<26);
  if(folk){
    G.prompt="ДЕЙСТВИЕ — ОКЛИКНУТЬ · "+folk.name;
    if(actEdge){hinTalk(folk);return;}
  }else if(near){
    G.prompt="ДЕЙСТВИЕ — РАССМОТРЕТЬ · "+near.ru.toUpperCase();
    if(actEdge){S.look=near;S.lookT=420;sfx("ui");}
  }else if(S.x<26){
    G.prompt="ДЕЙСТВИЕ — ВЫЙТИ ВО ДВОР";
    if(actEdge){exitHomeIn();return;}
  }else G.prompt="";
  if(S.lookT>0)S.lookT-=dt;
  else S.look=null;
}
/* ── вещи, к которым подходят ──
   Ровно то, что в этой комнате есть: не список, а места. Координата — доля
   ширины комнаты, чтобы вещи не наезжали на проёмы. */
const HIN_THINGS={
  corner:[{at:.30,ru:"матрас",say:"Матрас у стены. С него всё началось."},
          {at:.72,ru:"кружка",say:"Кружка на ящике. Чай остыл ещё вчера."}],
  hall:  [{at:.35,ru:"крючки",say:"Крючки у двери: скафандр, куртка, чей-то шарф."},
          {at:.75,ru:"сапоги",say:"Сапоги в грязи с трёх разных планет."}],
  garage:[{at:.30,ru:"катер",say:"Второй корабль под чехлом. Ждёт своей очереди."},
          {at:.78,ru:"стеллаж",say:"Запчасти на стеллаже, разложены по калибру."}],
  case:  [{at:.50,ru:"витрина",say:"Витрина: то, что не продаётся ни за какие деньги."}],
  shop:  [{at:.32,ru:"верстак",say:"Верстак. Недоделанный узел ждёт рук."},
          {at:.74,ru:"станок",say:"Станок, смазан и накрыт. Работает, когда просят."}],
  study: [{at:.34,ru:"стол",say:"Стол с бумагами: маршруты, счета, письма."},
          {at:.76,ru:"карта",say:"Карта сектора на стене, с булавками и нитками."}],
  living:[{at:.30,ru:"кровать",say:"Кровать заправлена. Кто-то заправил её за вас."},
          {at:.70,ru:"стол",say:"Общий стол. За ним ужинают, когда все дома."}],
  dock:  [{at:.40,ru:"пульт маяка",say:"Пульт маяка. Огонь виден с орбиты."},
          {at:.80,ru:"причал",say:"Причальные захваты. Тут швартуется тяжёлое."}]
};
function hinNear(x){
  const r=hinRoomAt(x);if(!r)return null;
  const list=HIN_THINGS[r.key]||[];
  for(const t of list){
    const tx=r.x+r.w*t.at;
    if(Math.abs(tx-x)<24)return {ru:t.ru,say:t.say,x:tx,room:r};
  }
  return null;
}
function hinTalk(f){
  const S=G.hin;
  let line="";
  /* Вега говорит своими словами: тот же набор, что на борту (11w-vega) */
  if(f.who==="vega"&&typeof VEGA_ABOARD!=="undefined"&&VEGA_ABOARD.length)
    line=VEGA_ABOARD[Math.abs(hashi(Math.round(G.t/300),7,0x40F3))%VEGA_ABOARD.length];
  if(!line){
    const pool={
      vega:["Тут тише, чем на борту.","Я разложила твои бумаги. Не благодари.","Дома странно. Хорошо, но странно."],
      mate:["Печь топится, обед будет.","Полы мыла, ходи аккуратно.","Заходил сосед, спрашивал про тебя."],
      trainee:["Я всё записал, честно!","А можно потрогать станок?","Когда снова в рейс?"],
      crew:["Отдыхаем, командир.","Ноги гудят после пояса.","Дом у тебя ладный."]
    }[f.who]||["…"];
    line=pool[Math.abs(hashi(Math.round(G.t/300),f.x|0,0x40F2))%pool.length];
  }
  S.look={ru:f.name,say:line,x:f.x,room:hinRoomAt(f.x)};
  S.lookT=420;
  sfx("ui");
}
