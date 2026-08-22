/* ══════════════ память места: три счётчика и одометр ══════════════
   M132. Мир помнит, что вы делали в каждом месте, — но не как карму и не как
   репутацию (12k-rep — про людей и деньги). Здесь три ГРУБЫХ счётчика:
     take — сколько вырыли и увезли;
     hurt — сколько стреляли и взрывали;
     care — сколько чинили, привозили, оставляли.
   Они нигде не показываются и ни на что не влияют сами по себе: это сырьё для
   отложенного следствия (M138 роща помнит выстрел, M145 насекомые строят из
   выброшенного, M128 люди меняют обращение).

   СОЗРЕВАНИЕ — ПО ПУТИ, НЕ ПО ЧАСАМ. Мир не знает, сколько вы просидели в
   меню; он знает, сколько вы прошли: одометр G.odo считает посадки и прыжки.
   Возраст памяти места — путь, пройденный с последнего визита (placeAge).

   ПРАВИЛА ФАЙЛА:
   1. Ключ места — как у историй (11c): система на станции, система/планета
      на поверхности. Запись создаётся только при ПОСАДКЕ; поступок в месте,
      где вы не садились, пишется на систему.
   2. Ничего не возвращается в интерфейс. Функции чтения — для других модулей.
   3. Формат сейва v:4 не меняется: G.place и G.odo — два объекта с дефолтами. */

const PLACE_KINDS=["take","hurt","care"];

function odo(){return (G.odo||(G.odo={lands:0,jumps:0}));}
function odoSum(){const o=odo();return (o.lands|0)+(o.jumps|0);}
function odoAdd(kind){const o=odo();o[kind]=(o[kind]|0)+1;}
function placeAll(){return (G.place||(G.place={}));}
function placeKeyHere(){
  const sys=G.sys;if(!sys)return null;
  const p=(G.surf&&G.surf.p)||(G.land&&G.land.p)||null;
  return (G.st||!p)?sys.key:sys.key+"/"+p.idx;
}
/* запись места: f — одометр первого визита, l — последнего, n — посадок */
function placeMem(key){return placeAll()[key]||null;}
/* посадка: станция, поверхность, база */
function placeMark(){
  const k=placeKeyHere();if(!k)return null;
  odoAdd("lands");
  const P=placeAll();
  const rec=P[k]||(P[k]={f:odoSum(),l:0,n:0,take:0,hurt:0,care:0});
  rec.n++;rec.l=odoSum();
  return rec;
}
/* поступок в текущем месте. Без записи места — на систему, без системы — в никуда */
function placeNote(kind,n){
  if(PLACE_KINDS.indexOf(kind)<0||!G.sys)return;
  const P=placeAll();
  const k=placeKeyHere();
  const rec=P[k]||P[G.sys.key]||(P[G.sys.key]={f:odoSum(),l:odoSum(),n:0,take:0,hurt:0,care:0});
  rec[kind]=Math.max(0,(rec[kind]|0)+(n===undefined?1:n|0));
}
/* сколько пути пройдено с последнего визита: 0 — вы здесь, ∞ — вы тут не были */
function placeAge(key){
  const rec=placeMem(key);
  return rec?Math.max(0,odoSum()-rec.l):Infinity;
}
/* чем место вас запомнило — одним словом, для тех, кто будет читать память:
   null, пока ни один счётчик не перевесил остальные заметно */
function placeMood(key){
  const rec=placeMem(key);if(!rec)return null;
  const t=rec.take|0,h=rec.hurt|0,c=rec.care|0,m=Math.max(t,h,c);
  if(m<3)return null;
  return m===h?"hurt":m===c?"care":"take";
}
