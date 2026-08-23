/* ══════════════ три света: область без ночи ══════════════
   M135. Область кратных звёзд (06c, `lights`, игла `actino`). На окраине —
   бесконечные сумерки: ночь не доходит до ночи, колонии спят по свету, а не
   по часам, и у каждого двора ставни, которых никто не объясняет. В ядре —
   мир, где ночи нет вовсе.

   СОЕДИНЕНИЕ. Раз в несколько недель три света сходятся в один. За сутки до
   него жители закрывают всё и сидят внутри — это и есть знак, по которому
   событие можно предвидеть. В само соединение третий свет ПОКАЗЫВАЕТ: дороги,
   фундаменты и один вход в породу, которого при обычном свете нет.

   ПРАВИЛА ФАЙЛА:
   1. Игрок пропускает первый раз. Всегда. Календарь заводится с первого
      прихода в ядро так, что соединение было ВЧЕРА; дальше он не сдвигается
      ни под чей прилёт: сдвинуть событие под прибытие значит сделать мир
      декорацией. Второй визит — его собственный расчёт и его намерение.
   2. Ничего не объявляется: ни отсчёта в рубке, ни строки «через N суток».
      Предвидеть можно только по ставням и по тому, как ходят три света.
   3. Вход физический: та же пещера (22), тем же действием, но с другим зерном
      и без кусачих — и найти его в обычном свете нельзя.
   4. Хранится только день первого прихода и факт, что внутри были (G.lights). */

const LIGHTS_SOON=1;                       // суток до соединения, когда закрывают ставни
function lightsAll(){return (G.lights||(G.lights={t0:-1,seen:0}));}
/* 0 вне области, 1 окраина (внутри склона), 2 ядро */
function lightsDepthAt(sx,sy){
  if(typeof regionAt!=="function")return 0;
  const R=regionAt(sx,sy);
  if(R.theme!=="lights")return 0;
  return (R.core.sx===sx&&R.core.sy===sy)?2:(regionDepth(sx,sy)>0?1:0);
}
function lightsDepthHere(){return lightsDepthAt(G.sx,G.sy);}
/* период соединения — от зерна области: недели, не дни */
function lightsPeriod(){
  const at=(typeof regionOfTheme==="function")?regionOfTheme("lights"):null;
  if(!at)return 28;
  return 24+(hashi(at.rx,at.ry,0x7E1)>>>3)%12;
}
/* планета ядра: первый твёрдый мир системы ядра, на него и садятся */
function lightsCorePlanet(sys){
  if(!sys||lightsDepthAt(sys.sx,sys.sy)!==2)return null;
  for(const p of sys.planets||[])if(p.type!=="gas")return p;
  return null;
}
function lightsIsCore(p){
  const c=lightsCorePlanet(G.sys);
  return !!(c&&p&&c.idx===p.idx);
}
/* ── календарь ──
   Заводится первым приходом в ядро (правило 1): t0 — тот день, а соединение
   было в день t0−1. Дальше — строго через период. До первого прихода
   календаря нет: соединений, которые никто не видел, не существует. */
function lightsArrive(){
  const L=lightsAll();
  if(L.t0<0&&lightsDepthHere()===2)L.t0=celDay();
}
function lightsConj(t){
  const L=lightsAll();
  if(L.t0<0)return {k:0,left:-1,soon:false};
  const P=lightsPeriod();
  const ph=(((celDayF(t)-(L.t0-1))%P)+P)%P;        /* 0…P суток с последнего соединения */
  const k=ph<1?Math.sin(ph*Math.PI):0;             /* соединение длится сутки, пик в середине */
  const left=ph<1?0:P-ph;
  return {k,left,soon:!k&&left<=LIGHTS_SOON};
}
/* ── сумерки ──
   Окраина: ночь не доходит до ночи. Ядро: ночи нет. Зовётся из surfNight. */
function lightsNight(k){
  const d=lightsDepthHere();
  return d===2?0:(d===1?Math.min(k,.22):k);
}
/* ставни закрыты? Одно на всю область: за сутки до соединения и в него */
function lightsShut(){
  if(!lightsDepthHere())return false;
  const C=lightsConj();
  return C.soon||C.k>0;
}
/* третий свет показывает — только на планете ядра и только в соединение */
function lightsOpen(p){
  return lightsIsCore(p)&&lightsConj().k>.12;
}
/* где на планете ядра вход: подальше от устья обычной пещеры */
function lightsEntryX(tr,p){
  const r=rng(hashi(p.seed|0,0x7E1,0x11));
  let x=clamp(tr.W*(.25+r()*.5),400,tr.W-400);
  if(G.surf&&G.surf.cave&&Math.abs(G.surf.cave.x-x)<500)x+=x<G.surf.cave.x?-520:520;
  return clamp(x,300,tr.W-300);
}
/* строка к посадке: ставни — единственное объяснение, и оно не объясняет */
function lightsGroundLine(){
  const d=lightsDepthHere();
  if(!d)return null;
  const C=lightsConj();
  if(C.soon)return "Ставни закрыты. Все до одной. Внутри кто-то есть — слышно.";
  if(C.k>0)return d===2?"Третий свет встал над грядой. Тени легли в одну сторону.":"Три света сошлись в один. Ставни закрыты.";
  return d===2?"Ночи здесь не бывает: три света по очереди.":"Сумерки, которые не кончаются. На каждом дворе — ставни.";
}
/* ── три света на небе ──
   Рисуется после диска главной звезды (19-mode-landing). Окраина — один
   тусклый спутник, ядро — два; к соединению они сходятся к главному, и
   третий свет даёт белёсый ореол. Громкость неба не растёт: это три диска. */
function lightsSuns(p,sunX,sunY,sunR){
  const d=lightsDepthHere();if(!d)return;
  const C=lightsConj(),k=C.k;
  const n=d===2?2:1;
  for(let i=0;i<n;i++){
    const ox=(i?-1:1)*W*(.11+i*.05)*(1-k), oy=H*(.05+i*.03)*(1-k);
    const x=sunX+ox,y=sunY+oy,r=sunR*(.55-i*.12+k*.3);
    ctx.fillStyle=i?"rgba(255,214,170,.75)":"rgba(226,236,255,.8)";
    ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();
  }
  if(k>0){
    const g=ctx.createRadialGradient(sunX,sunY,sunR,sunX,sunY,sunR*3.2);
    g.addColorStop(0,"rgba(255,250,236,"+(.34*k).toFixed(3)+")");
    g.addColorStop(1,"rgba(255,250,236,0)");
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(sunX,sunY,sunR*3.2,0,TAU);ctx.fill();
  }
}
/* ── ставни на дворах посёлка (12t) ──
   Обычная архитектура области: окно со ставнями на каждом дворе. Закрыты —
   доска поперёк; открыты — тёплый свет изнутри. Вне области ничего. */
function lightsShutters(ox,oy,ww,hh){
  if(!lightsDepthHere())return;
  const x=ox+ww*.22,y=oy-hh*.62,w=4.5,h=4.5;
  if(lightsShut()){
    ctx.fillStyle="rgba(40,32,24,.95)";ctx.fillRect(x-.5,y-.5,w+1,h+1);
    ctx.strokeStyle="rgba(210,190,160,.5)";ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(x,y+h*.5);ctx.lineTo(x+w,y+h*.5);ctx.stroke();
  }else{
    ctx.fillStyle="rgba(255,222,160,.6)";ctx.fillRect(x,y,w,h);
  }
}
/* ── явление ──
   Дороги и фундаменты — не открытка: бледные линии по грунту, которые при
   обычном свете совпадают с грунтом. Вход — арка в породе с кромкой света.
   Всё стоит на своём месте всегда; свет лишь делает его видимым. */
function lightsDrawReveal(tr,camx,camy,p){
  if(!lightsOpen(p))return;
  const k=lightsConj().k,ex=lightsEntryX(tr,p);
  const a=clamp((k-.12)/.5,0,1);
  const r=rng(hashi(p.seed|0,0x7E1,0x12));
  /* дорога: пунктир по грунту на полтора экрана в обе стороны */
  ctx.strokeStyle="rgba(255,240,206,"+(.42*a).toFixed(3)+")";ctx.lineWidth=1.2;
  ctx.setLineDash([9,7]);ctx.beginPath();
  let pen=false;
  for(let wx=ex-1400;wx<=ex+1400;wx+=12){
    const sx=wx-camx;if(sx<-20||sx>W+20){pen=false;continue;}
    const sy=groundAt(tr,wx)-camy-1.5;
    pen?ctx.lineTo(sx,sy):ctx.moveTo(sx,sy);pen=true;
  }
  ctx.stroke();ctx.setLineDash([]);
  /* фундаменты: прямоугольники, вросшие в склон, по нескольку в обе стороны */
  ctx.strokeStyle="rgba(255,236,196,"+(.55*a).toFixed(3)+")";ctx.lineWidth=1;
  for(let i=0;i<6;i++){
    const wx=ex+(i-2.5)*(260+r()*160),w=40+r()*70,h=6+r()*10;
    const sx=wx-camx;if(sx<-120||sx>W+120)continue;
    const sy=groundAt(tr,wx)-camy;
    ctx.strokeRect(sx-w/2,sy-h,w,h);
    ctx.beginPath();ctx.moveTo(sx-w/2,sy-h*.5);ctx.lineTo(sx+w/2,sy-h*.5);ctx.stroke();
  }
  /* вход: арка */
  const cx=ex-camx;
  if(cx>-60&&cx<W+60){
    const cy=groundAt(tr,ex)-camy;
    ctx.fillStyle="#060709";
    ctx.beginPath();ctx.ellipse(cx,cy-2,18,22,0,0,Math.PI,true);ctx.fill();
    ctx.strokeStyle="rgba(255,244,214,"+(.8*a).toFixed(3)+")";ctx.lineWidth=1.6;
    ctx.beginPath();ctx.ellipse(cx,cy-2,19,23,0,0,Math.PI,true);ctx.stroke();
  }
}
/* вход под третьим светом: та же пещера, другое зерно, без кусачих (22) */
function lightsEnter(){
  G.surf.ancient=true;
  lightsAll().seen=Math.max(lightsAll().seen|0,1);
  logAdd("dim","Вход, которого днём нет. Свод холодный.");
  enterCave();
}
/* что внутри: данные, артефакт с хорошим шансом, память птицы */
function lightsCaveFind(C){
  G.data+=120;
  lightsAll().seen=2;
  if(typeof heardAdd==="function")heardAdd("ground",{sx:G.sx,sy:G.sy,note:"вход под третьим светом"},null);
  const id=(typeof relicRoll==="function")?relicRoll(hashi(G.sx,G.sy,0x7E1),.7):null;
  if(id)relicFind(id,"под третьим светом");
  tell("tech","Под третьим светом · +120 данных","Под третьим светом\nкладка старше дорог\n+120 данных");
}
