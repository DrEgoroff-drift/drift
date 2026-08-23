/* ══════════════ имена расходятся: вы — источник, по которому учат карту ══════════════
   M149. Систему можно ПЕРЕИМЕНОВАТЬ, и подпись игрока — то, что карта показывает
   вместо процедурного кода. Игра никогда не предлагает имени.
   Бортжурнал пишет только факты: координата, дата, что сделали. Ни одной
   трактовки — это уже так.
   ИМЯ, РАССКАЗАННОЕ В БАРЕ, УХОДИТ СО СЛУХОМ, и пятнадцать прыжков спустя
   диспетчер на другом конце рукава говорит ВАШИМ словом, слегка искажённым.
   Галактика перенимает вашу топонимику.

   ПРАВИЛА ФАЙЛА:
   1. Только текст, длина зажата. Никаких подсказок, никакого «назовите?».
   2. Хранится G.names={key:имя}, G.namesTold={key:прыжок}. */

const NAME_MAX=18;
function namesAll(){return (G.names||(G.names={}));}
function namesToldAll(){return (G.namesTold||(G.namesTold={}));}
function namesFor(key){return namesAll()[key]||null;}
/* имя системы для карты, шапки и журнала: ваше, если дали */
function nameOf(sys){
  if(!sys)return "";
  return namesFor(sys.key||(sys.sx+","+sys.sy))||sys.name;
}
function nameSet(sys,name){
  name=(name||"").replace(/[<>]/g,"").trim().slice(0,NAME_MAX);
  const key=sys.key||(sys.sx+","+sys.sy);
  if(!name){delete namesAll()[key];return false;}
  namesAll()[key]=name;
  logAdd("dim","Сектор "+sys.sx+":"+sys.sy+" · названо: "+name);
  return true;
}
/* рассказать в баре: с этого прыжка имя идёт по рукам */
function nameTell(sys){
  const key=sys.key||(sys.sx+","+sys.sy);
  if(!namesFor(key)||namesToldAll()[key]!=null)return false;
  namesToldAll()[key]=(G.odo&&G.odo.jumps)|0;
  return true;
}
/* искажение в пересказе: выпадает одна внутренняя буква */
function namesMangle(n){
  if(!n||n.length<4)return n;
  const i=1+hashi(n.length,n.charCodeAt(1),7)%(n.length-2);
  return n.slice(0,i)+n.slice(i+1);
}
/* диспетчер на другом конце рукава: ваше слово, один раз на имя */
function namesEtherLine(){
  const T=namesToldAll(),j=(G.odo&&G.odo.jumps)|0;
  for(const key in T){
    if(T[key]<0||j-T[key]<15)continue;
    const n=namesFor(key);T[key]=-1;
    if(!n)continue;
    return "…борт, курс держите на «"+namesMangle(n)+"», как все. Повторяю: на «"+namesMangle(n)+"».";
  }
  return null;
}
/* блок в кантине: поле и две кнопки. Подсказки нет — поле пустое */
function namesBlock(){
  if(!G.sys)return;
  const key=G.sys.key,cur=namesFor(key);
  $body.appendChild(el("div","sec","ИМЯ СИСТЕМЫ"));
  const r=el("div","row");
  r.appendChild(el("div","nm","<b>"+(cur||G.sys.name)+"</b><s>"+(cur?"ваше имя. На карте — оно":"код карты. Своё имя — если есть что сказать")+"</s>"));
  const inp=document.createElement("input");inp.type="text";inp.maxLength=NAME_MAX;inp.value=cur||"";inp.style.cssText="width:9em;background:#0b1016;color:#cfe3ea;border:1px solid #2a3a44;padding:6px 8px";
  r.appendChild(inp);
  const b=el("button","act sm","НАЗВАТЬ");b.onclick=()=>{nameSet(G.sys,inp.value);renderTab();};r.appendChild(b);
  if(cur&&namesToldAll()[key]==null){const t=el("button","act sm","РАССКАЗАТЬ");t.onclick=()=>{nameTell(G.sys);renderTab();};r.appendChild(t);}
  $body.appendChild(r);
}
