/* ══════════════ отметка о проезде: штамп на границе (M453, DESIGN-borders §2.2) ══════════════
   Единственное слово, которое граница говорит вслух, и оно — бумага. Пересёк
   границу (хозяин сменился, или из дикого космоса в землю державы) — через
   экран на 1.2 с падает штамп, и он же ложится в ТРУДОВУЮ КНИЖКУ на страницу
   ОТМЕТКИ О ПРОЕЗДЕ. У каждой державы своя бумага; у Компании не штамп, а
   чек, который выползает снизу.

   Хранится внутри G.record (книжка уже сохраняется, формат сейва не меняется):
   R.st = {by:{n,d,sx,sy,v}} — первая отметка каждой державы и сколько раз,
   R.last — чья земля была под кораблём в прошлом прибытии. */
const STAMP_ORDER=["gt","co","or","km","ra","hf","yalta","pirate"];
const STAMP_RU={gt:"ГЛАВТРАССА",co:"Компания",or:"Орднунг",km:"Коммуна",ra:"Рассвет",hf:"Хай-Фронт",
  yalta:"Ялта",pirate:"пираты"};
const STAMP_POEM=["и звёзды, как соль на ладони","мы все немного космос","здесь обедают медленно",
  "ни шагу без песни","дорога — это тоже дом"];
function stampOwnerAt(sx,sy){
  const o=(typeof chronOwnerKey==="function")?chronOwnerKey(sx,sy):null;
  if(o&&STAMP_RU[o])return o;
  const sys=getSystem(sx,sy),st=sys&&sys.station;
  return (st&&st.by&&STAMP_RU[st.by])?st.by:null;
}
function stampBook(){const R=recordAll();if(!R.st||typeof R.st!=="object")R.st={};return R;}
/* текст отметки: одна и та же для штампа на экране и для клетки на странице */
function stampText(by,e){
  const n=10+(hashi(e.sx|0,e.sy|0,0x6E57)>>>0)%89;
  const mins=Math.floor(((e.t||0)%CEL_DAY)/CEL_DAY*1440);
  const hm=String(Math.floor(mins/60)).padStart(2,"0")+":"+String(mins%60).padStart(2,"0");
  if(by==="gt")return ["ОТМЕТКА О ПРОЕЗДЕ","ПОСТ № "+n,"зампол. ______"];
  if(by==="co")return ["КОМПАНИЯ™","ВЪЕЗД — 0 кр (акция)","спасибо за выбор"];
  if(by==="or")return ["§ 14.3 · ЭКЗ. 1 ИЗ 3","ДЕНЬ "+e.d+" · "+hm,"ПРОВЕРЕНО"];
  if(by==="km")return ["Коммуна · въезд",STAMP_POEM[n%STAMP_POEM.length],"день "+(e.d+1+n%3)+", кажется"];
  if(by==="ra")return ["☀ ЗАХОДИ, БРАТ","был у нас "+e.d+"-го","— мастер"];
  if(by==="hf")return ["HF-GATE v4.1","ДОВЕРИЕ "+(40+n%57),"ID "+((n*7919)%100000)];
  return [STAMP_RU[by]||by];
}
/* зовёт gestArrive (17h) при каждом прибытии: from — хозяин покинутой системы */
function stampArrive(fromBy){
  const by=stampOwnerAt(G.sx,G.sy),R=stampBook();
  const last=R.last===undefined?fromBy:R.last;
  R.last=by;
  if(!by||by===last)return null;
  const had=R.st[by];
  const e=had||(R.st[by]={d:celDay(),t:G.t,sx:G.sx,sy:G.sy,v:0});
  e.v=(e.v|0)+1;
  stampShow(by,had?{d:celDay(),t:G.t,sx:G.sx,sy:G.sy}:e);
  if(!had&&typeof recordAdd==="function")recordAdd(STAMP_RU[by],"отметка о проезде — "+stampText(by,e).join(" · "));
  if(!had&&typeof passportIssue==="function")passportIssue();   /* седьмая отметка — паспорт (M505) */
  if(typeof volBorder==="function")volBorder(by);   /* животное без бумаг — пикет (M511) */
  return by;
}
/* ── штамп через экран: DOM на бумаге, 1.2 с ── */
function stampShow(by,e){
  if(typeof document==="undefined"||!document.body)return;
  const old=document.getElementById("stampFx");if(old)old.remove();
  const d=document.createElement("div");d.id="stampFx";d.className="stp-fx stp-"+by;
  const tilt=(5+(hashi(e.sx|0,e.sy|0,0x57A9)>>>0)%8)*((e.sx+e.sy)&1?-1:1);
  d.style.setProperty("--tilt",tilt+"deg");
  const L=stampText(by,e);
  d.innerHTML=L.map((s,i)=>"<div class='l"+i+"'>"+s+"</div>").join("");
  document.body.appendChild(d);
  setTimeout(()=>{if(d.parentNode)d.remove();},1300);
}
/* ── страница ОТМЕТКИ О ПРОЕЗДЕ в КНИЖКЕ (11aa) ── */
function stampPage(box){
  const R=stampBook();
  const got=STAMP_ORDER.filter(k=>R.st[k]).length;
  tableRow(box,"sec","","ОТМЕТКИ О ПРОЕЗДЕ · "+got+" ИЗ "+STAMP_ORDER.length);
  const g=document.createElement("div");g.className="stp-grid";
  for(const k of STAMP_ORDER){
    const e=R.st[k],c=document.createElement("div");
    if(e){
      c.className="stp-cell stp-"+k;
      const tilt=(5+(hashi(e.sx|0,e.sy|0,0x57A9)>>>0)%8)*((e.sx+e.sy)&1?-1:1);
      c.style.setProperty("--tilt",(tilt*.6)+"deg");
      c.innerHTML=stampText(k,e).map((s,i)=>"<div class='l"+i+"'>"+s+"</div>").join("")+
        (e.v>1?"<i>×"+e.v+"</i>":"");
    }else{
      c.className="stp-cell stp-none";
      c.innerHTML="<div class='l0'>"+STAMP_RU[k]+"</div><div class='l1'>"+
        (k==="yalta"?"все шесть — в одном месте":k==="pirate"?"царапина, не печать":"пересечь границу")+"</div>";
    }
    g.appendChild(c);
  }
  box.appendChild(g);
  /* паспорт (M505, D25): бордовая корочка на той же странице, пока действует */
  if(typeof passportOn==="function"&&passportOn()){
    const p=document.createElement("div");p.className="stp-pass";
    p.innerHTML="<b>ДИПЛОМАТИЧЕСКИЙ ПАСПОРТ</b><s>семь отметок · дорога даром · вопросов меньше</s><i>до "+Math.ceil((R.pass.until-now())/HOLD_SHIFT)+" смен</i>";
    box.appendChild(p);
  }
}
