/* ══════════════ материал грунта ══════════════ */
/* Готовность породы для кадра: флаг на планете после короткой порционной
   очереди (M418). 2D-тайл 256² снят (M807): fillMaterial — заглушка, грунт
   кладёт движок (21p*). Характер мира (MAT_CHAR) и минеральная палитра
   (MINERAL) остаются законом формы — их читают пещера и будущий шейдер. */

/* минеральная примесь: у каждой планеты своя, иначе все жилы одного цвета */
const MINERAL=[[210,180,110],[120,210,220],[220,130,150],[150,230,160],
               [190,160,240],[240,190,120],[120,160,230],[230,230,240]];
const MAT_S=256;
/* У каждого типа мира — своя макроформа породы, не только палитра: дюнная рябь,
   плиты льда, корка лавы с тлеющими швами, раскисшие берега, слоистая почва.
   `facet`/`plate`/`moss`/`rubble`/`dune`/`frost`/`crust`/`sludge`/`soil`. */
const MAT_CHAR={crystal:"facet",metal:"plate",jungle:"moss",ruin:"rubble",
  desert:"dune",ice:"frost",volcanic:"crust",toxic:"sludge",terran:"soil",ocean:"soil"};
/* ── очередь готовности ПО КАДРАМ (M418) ──
   Раньше считала пиксели тайла 383 мс; теперь только двигает счётчик, чтобы
   ключи выпечек (poi/deco) и свет посадки (tr.mat) по-прежнему ждали несколько
   кадров. Бюджет wallMs и потолок строк — на случай стоящих часов в стенде. */
const MAT_MS=3;
const MAT_ROWS=1;
const MAT_CAP=8;
let MAT_JOB=null;
/* Возвращает готовый материал — или null, пока очередь идёт. Заказ ставится сам */
function planetMat(p){
  if(p.mat)return p.mat;
  if(!MAT_JOB||MAT_JOB.p!==p){MAT_JOB=matJobMake(p);MAT_JOB.at=G.t;return null;}
  if(MAT_JOB.at!==G.t){MAT_JOB.at=G.t;matTick();}
  return p.mat||null;
}
function matRows(){
  const J=MAT_JOB;if(!J)return false;
  const t0=wallMs();
  let rows=0;
  while(J.y<J.S){
    matJobRows(J,MAT_ROWS);rows+=MAT_ROWS;
    if(rows>=MAT_CAP||wallMs()-t0>MAT_MS)break;
  }
  return J.y>=J.S;
}
function matTick(){
  if(matRows()){matJobDone(MAT_JOB);MAT_JOB=null;}
}
function planetMatNow(p){
  if(p.mat)return p.mat;
  if(!MAT_JOB||MAT_JOB.p!==p)MAT_JOB=matJobMake(p);
  const J=MAT_JOB;
  while(J.y<J.S)matJobRows(J,64);
  matJobDone(J);MAT_JOB=null;
  return p.mat;
}
function matJobMake(p){return {p,S:MAT_S,y:0};}
function matJobRows(J,rows){J.y=Math.min(J.S,J.y+rows);}
function matJobDone(J){J.p.mat=1;J.p.matHue=1;return J.p.mat;}
function planetMatHue(p){
  if(!p.matHue&&!p.mat)return null;
  return p.matHue||null;
}
/* 2D-краска породы снята (M807): без видеокарты поверхности нет, грунт кладёт движок (21p*).
   Зовут её только запертые 19-mode-landing-ground, 20a-poi, 21b-surface-deco — пустая заглушка
   ждёт разблокировки автора. */
function fillMaterial(){}
