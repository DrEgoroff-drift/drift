/* ══════════════ аврал (M398, DESIGN-base §11) ══════════════
   Единственное место всего слоя, где время идёт по-настоящему, — и единственный
   ответ на вопрос «зачем вообще заходить в сцену».

   Всё остальное на базе считается лениво: сколько смен прошло, столько и
   отыграется, и руки игрока там ни при чём. Аврал — наоборот. Пока игрок
   ВНУТРИ, директор может поджечь отсек: у игрока тридцать-сорок секунд, чтобы
   дойти и подержать ДЕЙСТВИЕ. Не дошёл — беда становится той самой ходячей
   (§10.3) и уходит гулять по базе без него.

   Асимметрия и есть замысел: вдали за вас справляются люди — настолько,
   насколько позволяют их роли; здесь вы справляетесь ЛУЧШЕ, чем они. Ни новой
   сцены, ни нового режима: та же ходьба, тот же свет, та же камера.

   Правила короткие. Один аврал на заход, примерно раз в четыре захода. Держать
   две секунды; люди в этом отсеке и в соседнем держат вместе с вами, мастерская
   помогает. Провалить его не смертельно: отсек побит, огонь пошёл дальше — то
   есть ровно то, что было бы, если бы вас тут не было. */
const AVR_CHANCE=.25;        /* примерно раз в четыре захода */
const AVR_TIME=40*60;        /* сорок секунд в кадрах */
const AVR_HOLD=120;          /* две секунды удержания */
const AVR_NEAR=1;            /* «рядом» — соседняя клетка */
const AVR_BURN=.35;          /* столько отсек теряет за весь аврал, и не больше */
const AVR_KINDS=[
  {k:"fire", ru:"ПОЖАР",  what:"горит",   note:"дым идёт в коридор"},
  {k:"vent", ru:"РАЗГЕРМЕТИЗАЦИЯ",what:"свистит",note:"воздух уходит в породу"},
  {k:"flood",ru:"ПРОРЫВ", what:"хлещет", note:"вода заливает пол"}
];
/* ── бросок на заход ──
   Делается один раз, на входе. Заход — это не смена: он живёт настоящими
   секундами, и потому здесь честный случайный бросок, а не функция от номера. */
function avrRoll(S,B){
  if(!S||S.avrDone)return null;
  S.avrDone=1;
  if(!B||baseParked(B))return null;
  const live=[];
  for(let r=0;r<baseRows(B);r++)for(let c=0;c<BASE_COLS;c++){
    const cell=baseCell(B,c,r);
    if(cell&&cell.hp>0)live.push({c,r,k:cell.k});
  }
  if(live.length<2)return null;                /* на пустой базе гореть нечему */
  /* заход, а не секунда: два входа в одну секунду давали один и тот же бросок */
  G.baseVisit=(G.baseVisit|0)+1;
  const r=rng(hashi(B.sx*53+B.sy,(B.idx|0)*31+7,G.baseVisit));
  if(r()>AVR_CHANCE)return null;
  const spot=live[Math.floor(r()*live.length)];
  const kind=AVR_KINDS[Math.floor(r()*AVR_KINDS.length)];
  S.avr={c:spot.c,r:spot.r,k:kind.k,t:AVR_TIME,hold:0};
  const n=(typeof baseShift==="function")?baseShift():0;
  if(typeof baseLog==="function")baseLog(B,"avral",n,{what:BUILD[spot.k].ru,ru:kind.ru});
  say("АВРАЛ · "+kind.ru+" · "+BUILD[spot.k].ru.toUpperCase()+"\n"+kind.note+
    " · ДОЙТИ И ДЕРЖАТЬ ДЕЙСТВИЕ",220);
  sfx("ui",{f:220,to:140,d:.5,v:.35});
  return S.avr;
}
/* сколько рук помогает: люди в этом отсеке и рядом, и мастерская */
function avrHands(B,A){
  let h=1;
  if(typeof baseStaff==="function")for(const c of baseStaff(B)){
    const cell=baseCell(B,A.c,A.r);
    const role=(typeof baseCellRole==="function")?baseCellRole(cell):null;
    if(role&&c.role===role)h+=.8;              /* он тут и работает */
  }
  for(let d=-AVR_NEAR;d<=AVR_NEAR;d++){
    const nb=baseCell(B,A.c+d,A.r);
    if(!nb||nb.hp<=0||!d)continue;
    if(nb.k==="shop")h+=.7;                    /* мастерская под боком */
    if(nb.k==="seal")h+=.3;                    /* и затвор помогает: не растечётся */
  }
  return h;
}
/* ── такт аврала ──
   Возвращает true, пока он идёт: сцена в это время не строит и не собирает. */
function avrTick(S,B,dt,act){
  const A=S&&S.avr;
  if(!A)return false;
  const here=(S.cur|0)===A.c&&(S.row|0)===A.r;
  const kind=AVR_KINDS.find(x=>x.k===A.k)||AVR_KINDS[0];
  A.t-=dt;
  if(here&&act){
    A.hold+=dt*avrHands(B,A);
    if(A.hold>=AVR_HOLD)return avrWin(S,B);
  }else if(!act)A.hold=Math.max(0,A.hold-dt*.5);
  /* ── цена аврала в цифрах (разбор 0.409.1) ──
     Было `(G.t|0)%12===0` и −.004 за удар: сорок секунд горения давали ~.8 hp,
     а провал добавлял ещё .4 — упущенный аврал ВСЕГДА убивал отсек, хотя
     замысел говорит «отсек побит». Считаем по времени, а не по кадрам, и
     держим потолок: после провала отсеку остаётся треть-половина. */
  const cell=baseCell(B,A.c,A.r);
  if(cell&&cell.hp>0){
    const step=Math.min(.0006*dt,Math.max(0,AVR_BURN-(A.burn||0)));
    if(step>0){A.burn=(A.burn||0)+step;cell.hp=Math.max(.05,cell.hp-step);}
  }
  G.prompt="АВРАЛ · "+kind.ru+" В ОТСЕКЕ "+(A.c+1)+":"+(A.r+1)+
    "\n"+(here?"ДЕРЖИТЕ ДЕЙСТВИЕ · "+Math.round(A.hold/AVR_HOLD*100)+"%"
              :"ДОЙТИ ТУДА: ◀ ▶ — ПЕРЕХОД, ▲ ▼ — УРОВНИ")+
    "\nОСТАЛОСЬ "+Math.max(0,Math.ceil(A.t/60))+" с";
  if(A.t<=0)avrLose(S,B);
  return true;
}
function avrWin(S,B){
  const A=S.avr;S.avr=null;
  const n=(typeof baseShift==="function")?baseShift():0;
  if(typeof baseLog==="function")baseLog(B,"avrok",n,{who:baseWho(B,"engineer")});
  tell("good","Аврал отбит","АВРАЛ ОТБИТ\nотсек цел, беда не пошла дальше");
  sfx("ui",{f:420,to:660,d:.25,v:.3});
  return true;
}
function avrLose(S,B){
  const A=S.avr;S.avr=null;
  const n=(typeof baseShift==="function")?baseShift():0;
  const cell=baseCell(B,A.c,A.r);
  /* побит, но не уничтожен: чинить его игрок будет сам, и это дешевле, чем
     ставить заново */
  if(cell)cell.hp=Math.max(.3,cell.hp-.25);
  /* не успел — беда становится ходячей (§10.3) и живёт дальше без вас */
  if(typeof baseFireStart==="function")baseFireStart(B,A.c,A.r,n,A.k);
  if(typeof baseLog==="function")baseLog(B,"avrno",n,{});
  tell("warn","Аврал упущен","АВРАЛ УПУЩЕН\nтеперь это пойдёт по базе само");
  return false;
}
/* ── рисование: отсек, в котором беда ── */
function avrDraw(S,X,Y,lit){
  const A=S&&S.avr;
  if(!A||typeof ctx==="undefined")return;
  const x=X(BASE_OX+A.c*BCELL_W),y=Y(BASE_OY+A.r*BCELL_H);
  const p=.5+.5*Math.sin(G.t*.25);
  const col=A.k==="fire"?[255,140,60]:(A.k==="vent"?[150,220,255]:[110,180,255]);
  ctx.save();
  ctx.globalCompositeOperation="lighter";
  const g=ctx.createRadialGradient(x+BCELL_W/2,y+BCELL_H/2,4,x+BCELL_W/2,y+BCELL_H/2,BCELL_W*.8);
  g.addColorStop(0,"rgba("+col.join(",")+","+(.20+.22*p).toFixed(3)+")");
  g.addColorStop(1,"rgba("+col.join(",")+",0)");
  ctx.fillStyle=g;ctx.fillRect(x-BCELL_W*.3,y-BCELL_H*.3,BCELL_W*1.6,BCELL_H*1.6);
  ctx.restore();
  ctx.strokeStyle="rgba("+col.join(",")+","+(.5+.4*p).toFixed(2)+")";
  ctx.lineWidth=2;
  ctx.strokeRect(x+5.5,y+5.5,BCELL_W-11,BCELL_H-11);
  ctx.fillStyle="rgba("+col.join(",")+",.95)";
  ctx.font="10px ui-monospace,monospace";ctx.textAlign="center";
  const kind=AVR_KINDS.find(q=>q.k===A.k)||AVR_KINDS[0];
  ctx.fillText(kind.ru,x+BCELL_W/2,y+16);
  /* полоса удержания — там же, где беда, а не на краю экрана */
  if(A.hold>0){
    const w=(BCELL_W-24)*clamp(A.hold/AVR_HOLD,0,1);
    ctx.fillStyle="rgba(127,230,216,.85)";
    ctx.fillRect(x+12,y+BCELL_H-16,w,4);
  }
}
