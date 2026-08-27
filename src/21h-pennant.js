/* ══════════════ переходящий вымпел ══════════════
   M206, из списка «радостей». Раз в квартал лучшая из ваших баз получает на
   стену знамя и одну строку в эфире. И всё.

   ЭТО ЧИСТАЯ ФОРМА, И ТАК ЗАДУМАНО. Вымпел не даёт ни прибавки к выработке,
   ни скидки, ни репутации, ни очков. Он висит. Смысл переходящего знамени
   ровно в том, что оно переходит: в следующем квартале его снимут и увезут
   на другую базу, может быть на вашу же, может быть нет, и единственное, что
   от него останется, — строка в трудовой книжке о том, что оно у вас было.

   ЛУЧШАЯ — ЭТО КОТОРАЯ БОЛЬШЕ ПОСТРОЕНА И ЛУЧШЕ СВЕДЕНА ПО ЭНЕРГИИ. Не самая
   доходная: доход и так виден в цифрах, и знамя за него было бы второй раз
   про одно и то же. Здесь считается труд, а не выручка.

   КВАРТАЛ СЧИТАЕТСЯ, А НЕ ХРАНИТСЯ (правило про эфемерное): кто держит вымпел
   сейчас, выводится из состава баз и номера квартала. Хранится ровно одно —
   за какие кварталы уже сказали в эфир, чтобы не повторяться.

   ПРАВИЛА ФАЙЛА:
   1. Ни одного числа в экономику. Никогда.
   2. Ничего, кроме списка объявленных кварталов. */
const PENN_DAYS=90;                 /* квартал в календарных сутках */
function pennQuarter(){return Math.floor(celDay()/PENN_DAYS);}
function pennAll(){if(!Array.isArray(G.penn))G.penn=[];return G.penn;}
/* счёт базы: построено плюс сведённый баланс. Выручки тут нет намеренно */
function pennScore(B){
  if(!B)return -1;
  const built=(B.cells||[]).filter(c=>!!c).length;
  let p=0;
  try{p=(typeof basePower==="function")?basePower(B):0;}catch(e){p=0;}
  const bal=(p&&typeof p==="object")?((p.out|0)-(p.use|0)):(p|0);
  /* сведённый баланс — это ноль или чуть выше: запас в двадцать киловатт
     говорит не о хозяйстве, а о том, что реактор поставили и забыли */
  const tidy=bal>=0?Math.max(0,6-Math.abs(bal))*2:-8;
  return built*3+tidy;
}
/* хэш ключа базы: строка целиком, а не её длина. Первый счёт брал
   `k.length`, а у ключей «1,1:0» и «5,5:0» она одна и та же — разброса не было
   вовсе, и знамя навсегда прирастало к первой базе в списке. Поймано тестом
   «он переходит, а не прирастает». */
function pennHash(s){
  let h=2166136261>>>0;
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}
  return h>>>0;
}
/* кто держит вымпел в этом квартале */
function pennHolder(){
  const keys=Object.keys(G.bases||{});
  if(!keys.length)return null;
  let best=null,bs=-1e9;
  for(const k of keys){
    const B=G.bases[k];
    const s=pennScore(B)+((hashi(pennHash(k),pennQuarter(),0x0905)%9)-4)*0.5;
    if(s>bs){bs=s;best=k;}
  }
  return bs>0?best:null;
}
function pennHere(){
  const B=G.base;
  if(!B)return false;
  const k=baseKey(B.sx!=null?B.sx:G.sx,B.sy!=null?B.sy:G.sy,B.idx|0);
  return pennHolder()===k;
}
/* объявление: раз в квартал, при первой стыковке или заходе на базу */
function pennTick(){
  const q=pennQuarter();
  const P=pennAll();
  if(P.indexOf(q)>=0)return false;
  const k=pennHolder();
  if(!k)return false;
  P.push(q);
  while(P.length>16)P.shift();
  const nm=k.split(":")[0];
  logAdd("ether","Переходящий вымпел за квартал — вашей базе в секторе "+nm+".");
  tell("good","Переходящий вымпел — вашей базе","ПЕРЕХОДЯЩИЙ ВЫМПЕЛ\nсектор "+nm+
       "\nна квартал");
  if(typeof recordAdd==="function")
    recordAdd("вымпел","переходящее знамя за квартал · сектор "+nm);
  return true;
}
/* ── знамя на стене ──
   Полотнище с бахромой, древко наискось, тень на стену. Висит в отсеке, а не
   парит: у знамени есть крепление, и его видно. */
function pennDraw(x,y,w,h){
  const t=G.t*0.02;
  ctx.fillStyle="rgba(0,0,0,.28)";
  ctx.fillRect(x+w*0.06,y+h*0.05,w,h);
  /* древко */
  ctx.fillStyle="rgba(122,98,68,.95)";
  ctx.save();
  ctx.translate(x,y);ctx.rotate(-0.22);
  ctx.fillRect(-w*0.03,0,Math.max(2,w*0.05),h*1.15);
  ctx.restore();
  /* полотнище: бегущая волна от древка к свободной кромке (M232) — у древка
     ткань закреплена и не ходит, к кромке ход растёт. Медленный цикл, не
     мигание: волна ЕДЕТ по ткани, глаз читает ветер, а не дрожь. */
  const wv=q=>Math.sin(t*1.35-q*4.6)*h*.045*q;
  ctx.fillStyle="rgba(168,44,40,.95)";
  ctx.beginPath();
  ctx.moveTo(x,y);
  for(let i=1;i<=6;i++){const q=i/6;ctx.lineTo(x+w*q,y+h*0.06*q+wv(q));}
  for(let i=6;i>=0;i--){const q=i/6;ctx.lineTo(x+w*q,y+h*(0.94-0.08*q)+wv(q)*1.15);}
  ctx.closePath();ctx.fill();
  ctx.fillStyle="rgba(255,255,255,.10)";
  ctx.beginPath();
  ctx.moveTo(x,y);ctx.lineTo(x+w*0.42,y+h*0.03+wv(.42));
  ctx.lineTo(x+w*0.42,y+h*0.92+wv(.42)*1.15);ctx.lineTo(x,y+h*0.94);
  ctx.closePath();ctx.fill();
  /* бахрома идёт той же волной, что и кромка, — иначе она отрывается от ткани */
  ctx.fillStyle="rgba(226,190,96,.9)";
  for(let i=0;i<10;i++){
    const q=i/9;
    const bx=x+w*q, by=y+h*(0.94-0.08*q)+wv(q)*1.15;
    ctx.fillRect(bx,by,Math.max(1.5,w*0.02),h*0.10);
  }
  /* звезда посередине — ничего не значит, и в этом всё дело */
  ctx.fillStyle="rgba(240,222,150,.95)";
  const cx=x+w*0.56, cy=y+h*0.46+wv(0.56)*0.9, rr=Math.min(w,h)*0.22;
  ctx.beginPath();
  for(let i=0;i<10;i++){
    const a=-Math.PI/2+i*Math.PI/5, q=i%2?rr*0.44:rr;
    const px=cx+Math.cos(a)*q, py=cy+Math.sin(a)*q;
    i?ctx.lineTo(px,py):ctx.moveTo(px,py);
  }
  ctx.closePath();ctx.fill();
}
