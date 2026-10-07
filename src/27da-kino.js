/* ══════════════ кинопередвижка ══════════════
   M205, из списка «радостей». Баржа привозит фильм, и на один вечер кантина
   пересаживается рядами: стойка гаснет, стулья разворачивают к стене, на стене
   идёт короткий журнал — про области, про экспедицию, про то, что и так все
   знают, только под музыку и с дикторским голосом.

   ЖУРНАЛ, А НЕ ФИЛЬМ. Фильм показывать нечем и незачем: он идёт где-то там, а
   игра показывает то, ради чего в зал и приходят раньше времени — киножурнал.
   Шесть кадров с подписями, каждый про что-то, что в этой игре уже есть.

   ГДЕ И КОГДА — СЧИТАЕТСЯ, А НЕ ХРАНИТСЯ. Идёт ли сегодня кино на этой
   станции, выводится из её координат и календарной недели (правило про
   эфемерное). Хранится ровно одно: какие журналы игрок уже видел, — и то
   ради строки в трудовой книжке.

   ПРАВИЛА ФАЙЛА:
   1. Ничего не даёт: ни денег, ни данных, ни репутации. Вечер и вечер.
   2. Ни одного кадра, нарисованного «просто так»: каждый — про что-то, что
      в игре есть на самом деле. */
const KINO_EVERY=6;               /* раз в столько календарных суток на станцию */
/* Киножурнал: кадр — это подпись и способ его нарисовать. Тексты сухие,
   дикторские: журнал не умиляется, он сообщает. */
const KINO_REEL=[
  {k:"map",  t:"НОВЫЕ ОБЛАСТИ. Съёмка с борта. Границы уточняются."},
  {k:"ship", t:"ЭКСПЕДИЦИЯ. Сбор оборудования идёт по плану."},
  {k:"crowd",t:"НА МЕСТАХ. Смена сдана без замечаний. Так работают все."},
  {k:"plant",t:"БИОЛОГИЯ. Описано ещё несколько видов. Названия утверждены."},
  {k:"star", t:"НЕБО. Календарь событий составлен на год вперёд."},
  {k:"home", t:"БЫТ. Дома строятся. Это тоже работа, и не самая лёгкая."}
];
const KINO_TITLES=[
  "«Дорога длиною в смену»","«Четверо на дальнем»","«Здравствуй, край»",
  "«Полдень над Гривой»","«Возвращение шестого»","«Тихая вода»",
  "«Люди с той стороны»","«Один в поле»"
];
function kinoSeen(){if(!Array.isArray(G.kino))G.kino=[];return G.kino;}
/* идёт ли сегодня кино на этой станции: считается, а не хранится */
function kinoWeek(){return Math.floor(celDay()/KINO_EVERY);}
function kinoAt(sx,sy){
  const r=rng(hashi(sx|0,sy|0,0x0C1E+kinoWeek()));
  if(r()>0.30)return null;
  return {title:KINO_TITLES[Math.floor(r()*KINO_TITLES.length)],
          id:(sx|0)+","+(sy|0)+"@"+kinoWeek(),
          seed:hashi(sx|0,sy|0,kinoWeek()*7+3)};
}
function kinoHere(){
  if(!G.st||!G.sys)return null;
  return kinoAt(G.sx,G.sy);
}
/* пришёл в зал: отмечаем один раз на сеанс */
function kinoWatch(){
  const K=kinoHere();if(!K)return false;
  const S=kinoSeen();
  if(S.indexOf(K.id)>=0)return false;
  S.push(K.id);
  while(S.length>40)S.shift();
  logAdd("good","Кино: "+K.title+" · зал полон");
  if(S.length===1&&typeof recordAdd==="function")
    recordAdd("кантина","был на кинопередвижке");
  return true;
}
/* какой кадр журнала идёт прямо сейчас: журнал крутится сам, по часам */
function kinoFrame(K){
  if(!K)return null;
  const i=Math.floor(now()/4200)%KINO_REEL.length;
  return Object.assign({i},KINO_REEL[i]);
}
/* ── экран на стене ──
   Полотно, луч из будки, кадр журнала и подпись. Кадр рисуется НЕ картинкой из
   игры, а так, как его снял бы оператор с рук: несколько силуэтов и много
   зерна. Иначе это не кино, а окно. */
function kinoScreen(c,x,y,w,h,K,seed){
  const F=kinoFrame(K);
  /* полотно и рама */
  c.fillStyle="rgba(12,14,18,.95)";
  c.fillRect(x-w*.03,y-h*.05,w*1.06,h*1.10);
  c.fillStyle="rgb(216,214,206)";
  c.fillRect(x,y,w,h);
  c.save();
  c.beginPath();c.rect(x,y,w,h);c.clip();
  /* плёнка в фильмовом канале гуляет: кадр чуть дрожит целиком, вместе с
     подписью — её печатают на той же плёнке (G11) */
  const fq=hashi(seed|0,Math.floor(now()/120),11);
  const jx=((fq&255)/255-.5)*w*.006, jy=(((fq>>>8)&255)/255-.5)*h*.010;
  c.save();c.translate(jx,jy);
  const cx=x+w*.5, cy=y+h*.52;
  const ink="rgba(30,34,38,.86)", pale="rgba(120,126,130,.55)";
  if(F&&F.k==="map"){
    c.strokeStyle=pale;c.lineWidth=Math.max(1,h*.012);
    for(let i=0;i<4;i++){
      c.beginPath();
      c.ellipse(cx,cy,w*(.10+i*.09),h*(.14+i*.11),0.2,0,TAU);c.stroke();
    }
    c.fillStyle=ink;
    for(let i=0;i<7;i++){
      const a=i*1.1, rr=w*(.06+((i*7)%5)*.05);
      c.beginPath();c.arc(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr*.7,Math.max(1.4,h*.022),0,TAU);c.fill();
    }
  }else if(F&&F.k==="ship"){
    c.fillStyle=ink;
    c.beginPath();
    c.moveTo(cx-w*.22,cy);c.lineTo(cx+w*.16,cy-h*.10);
    c.lineTo(cx+w*.24,cy);c.lineTo(cx+w*.16,cy+h*.10);
    c.closePath();c.fill();
    c.fillStyle=pale;
    c.fillRect(cx-w*.30,cy-h*.02,w*.10,h*.04);
  }else if(F&&F.k==="crowd"){
    /* ── смена, а не семь леденцов (M233) ──
       Семь одинаковых кругов на одинаковых прямоугольниках через равный шаг
       читались узором, а подпись под кадром говорит «так работают все» — то
       есть в кадре должны стоять ЛЮДИ. Рост, ширина и шаг гуляют по хэшу,
       у каждого плечи и ноги врозь, задний ряд бледнее и мельче: в две
       глубины строй перестаёт быть орнаментом. Ничего не движется — это
       кинокадр, а не сцена. */
    for(let row=0;row<2;row++){
      const back=row===0;
      c.fillStyle=back?pale:ink;
      const n=back?6:7;
      for(let i=0;i<n;i++){
        const hs=hashi(i+1,row+3,(seed|0)+0x0C1D);
        const sp=w*(back?.115:.104), jx=((hs&7)/7-.5)*w*.022;
        const px=cx+(i-(n-1)/2)*sp+jx+(back?w*.03:0);
        const k=(back?.80:1)*(.88+((hs>>>3)&7)/7*.24);
        const by=cy-h*(back?.20:.16), bh=h*.30*k, bw=w*.050*k;
        c.fillRect(px-bw/2,by,bw,bh*.62);                       // корпус
        c.fillRect(px-bw*.62,by,bw*1.24,bh*.16);                // плечи
        c.fillRect(px-bw*.34,by+bh*.62,bw*.26,bh*.38);          // ноги врозь
        c.fillRect(px+bw*.08,by+bh*.62,bw*.26,bh*.38);
        c.beginPath();c.arc(px,by-h*.034*k,Math.max(1.6,h*.030*k),0,TAU);c.fill();
      }
    }
  }else if(F&&F.k==="plant"){
    c.strokeStyle=ink;c.lineWidth=Math.max(1.4,h*.018);
    for(let i=0;i<3;i++){
      const px=cx+(i-1)*w*.16;
      c.beginPath();c.moveTo(px,cy+h*.18);
      c.quadraticCurveTo(px+w*.04,cy-h*.04,px,cy-h*.18);c.stroke();
      c.fillStyle=pale;
      c.beginPath();c.ellipse(px,cy-h*.20,w*.05,h*.035,0,Math.PI,TAU);c.fill();
    }
  }else if(F&&F.k==="star"){
    c.fillStyle=pale;
    const rr=rng(seed|0);
    for(let i=0;i<40;i++)c.fillRect(x+rr()*w,y+rr()*h,1.4,1.4);
    c.fillStyle=ink;
    c.beginPath();c.arc(cx,cy,Math.max(3,h*.05),0,TAU);c.fill();
    c.strokeStyle=ink;c.lineWidth=Math.max(1,h*.010);
    c.beginPath();c.arc(cx,cy,h*.16,0,TAU);c.stroke();
  }else{
    c.fillStyle=ink;
    c.beginPath();
    c.moveTo(cx-w*.18,cy+h*.16);c.lineTo(cx-w*.18,cy-h*.04);
    c.lineTo(cx,cy-h*.18);c.lineTo(cx+w*.18,cy-h*.04);
    c.lineTo(cx+w*.18,cy+h*.16);c.closePath();c.fill();
    c.fillStyle=pale;
    c.fillRect(cx-w*.04,cy+h*.02,w*.08,h*.14);
  }
  /* зерно и дрожание кадра: без них полотно — просто белый прямоугольник */
  const rg=rng(hashi(seed|0,Math.floor(now()/120),9));
  c.fillStyle="rgba(0,0,0,.10)";
  for(let i=0;i<Math.round(w*h/240);i++)c.fillRect(x+rg()*w,y+rg()*h,1,1);
  c.fillStyle="rgba(255,255,255,.10)";
  c.fillRect(x,y+rg()*h,w,1);
  c.restore();
  /* полотно — как у main: гладкое кремовое, своё зерно и отсвет. Царапины читались швами,
     горячая середина с провалом углов и мигание лампы серили его и снимали контраст
     изображения (Контроль 26.09: «без швов и без мятой бумаги») */
  /* подпись журнала */
  if(F){
    c.fillStyle="rgba(16,18,22,.80)";
    c.fillRect(x,y+h*.80,w,h*.20);
    c.fillStyle="rgba(232,228,214,.92)";
    /* кегль считается ОТ ШИРИНЫ ПОЛОТНА, а не от его высоты: подпись в
       пол-экрана высотой вылезала за края с обеих сторон и читалась обрывком.
       Моноширинный знак — примерно .62 кегля, из этого и назначаем */
    const fs=Math.max(5,Math.min(h*.085,(w*0.92)/(F.t.length*0.62)));
    c.font=Math.round(fs)+"px ui-monospace,monospace";
    c.textAlign="center";
    c.fillText(F.t,cx,y+h*.925);
    c.textAlign="left";
  }
  c.restore();
}
