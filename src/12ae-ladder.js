/* ══════════════ холдинг · лестница видимая ══════════════
   M292, шаг 4 (DESIGN-holding §8, §13). Число ступени считает 12ad-site
   (rungOf — от счётчиков, не хранится). Здесь — имена, шесть пятилеток и то,
   как это ВИДНО: кольцо у звезды на карте, момент в эфире при стыковке,
   строка на доске и слово у стойки.

   ЗАКОН F16: эффект несут только шесть ★-ступеней, и каждый читается через
   rungHas(sx,sy,id) — тест держит, что все шесть кто-то спрашивает. Остальные
   двадцать четыре — МОМЕНТЫ: одна строка при стыковке, сегмент кольца, и ни
   одного крючка в чужих модулях. Слово «ступень» в интерфейсе не звучит:
   игрок видит пятилетку римской цифрой и слышит, что теперь здесь стоит. */
const RUNG_PLAN=["","РАЗВЕДКА","ПРИСУТСТВИЕ","МОНТАЖ","УЗЕЛ","ХОЗЯЙСТВО","КОЛЬЦО"];
const RUNGS=[null,
  {id:"mark",    ru:"Отметка",             note:"система отмечена на карте"},
  {id:"calc",    ru:"Расчёт",              note:"орбиты рассчитаны и записаны"},
  {id:"gate",    ru:"Створ",               note:"пройдена своим ходом"},
  {id:"pennant", ru:"Вымпел",              note:"знак оставлен: система ваша по праву первого"},
  {id:"buoy",    ru:"Буй",         star:1, note:"автоматический буй работает: слышно в эфире"},
  {id:"strip",   ru:"Полоса",              note:"посадочная полоса: вы стояли на грунте"},
  {id:"core",    ru:"Керн",                note:"проба грунта взята"},
  {id:"range",   ru:"Полигон",             note:"рабочая площадь размечена"},
  {id:"lock",    ru:"Шлюз",                note:"первое давление"},
  {id:"cycle",   ru:"Замкнутый цикл",star:1,note:"свой воздух и вода: у причала латают по-свойски"},
  {id:"site",    ru:"Монтажная площадка",star:1,note:"открылась стройка"},
  {id:"habmod",  ru:"Жилой модуль",        note:"есть руки"},
  {id:"store",   ru:"Хранилище",           note:"стоит склад"},
  {id:"enrich",  ru:"Обогатитель",         note:"руда идёт через фабрику"},
  {id:"site2",   ru:"Литейный модуль",star:1,note:"вторая площадка"},
  {id:"dock",    ru:"Стыковочный узел",    note:"здесь стыкуются не только ваши"},
  {id:"terminal",ru:"Грузовой терминал",   note:"грузу есть где ждать"},
  {id:"town",    ru:"Городок",             note:"люди живут семьями"},
  {id:"pier",    ru:"Причальная ферма",    note:"баржа может стоять и грузиться"},
  {id:"hub",     ru:"Промышленный узел",star:1,note:"второй ярус и третья площадка"},
  {id:"board",   ru:"Правление",           note:"своя сводка"},
  {id:"slipway", ru:"Стапельная",          note:"можно заложить стапель"},
  {id:"chair",   ru:"Кафедра",             note:"кафедра института учит здесь"},
  {id:"frontier",ru:"Рубеж",               note:"пиратский очаг здесь не растёт"},
  {id:"lines",   ru:"Узел трасс",   star:1,note:"трассы сходятся: третий ярус"},
  {id:"district",ru:"Округ",               note:"окружная контора"},
  {id:"line",    ru:"Трасса",              note:"регулярная линия к соседу"},
  {id:"belt",    ru:"Пояс огней",          note:"ночная сторона светится по кругу"},
  {id:"noon",    ru:"Полдень",             note:"система кормит себя сама"},
  {id:"ring",    ru:"Кольцо",       star:1,note:"вошла в кольцо: здесь окликают первыми, по имени"}
];
const RUNG_STARS=RUNGS.filter(x=>x&&x.star).map(x=>x.id);
function rungDef(r){return RUNGS[r]||null;}
function rungPlanOf(r){return r>0?Math.min(6,Math.ceil(r/5)):0;}
function rungRoman(n){return["","I","II","III","IV","V","VI"][n]||"";}
function rungIndex(id){for(let i=1;i<RUNGS.length;i++)if(RUNGS[i].id===id)return i;return-1;}
/* единственный способ спросить эффект: тест держит, что каждую ★ спрашивают */
function rungHas(sx,sy,id){
  const i=rungIndex(id);if(i<0)return false;
  (rungHas.asked||(rungHas.asked={}))[id]=1;
  return rungOf(sx,sy)>=i;
}
/* сегменты кольца на карте: по одному на закрытую пятилетку, с ★5 */
function rungRingSegs(r){return r>=5?Math.floor(r/5):0;}
/* rungOf на карте спрашивают для каждой видимой звезды каждый кадр: одна
   памятка на кадр, иначе счётчики перебираются сотни раз */
function rungOfCached(sx,sy){
  const M=rungOfCached;
  if(M.t!==G.t){M.t=G.t;M.m={};}
  const k=sx+","+sy;
  if(M.m[k]===undefined)M.m[k]=rungOf(sx,sy);
  return M.m[k];
}
/* подвал карты: только римская цифра — подвалу на телефоне отведено две строки */
function rungFootTxt(sx,sy){
  const r=rungOf(sx,sy);   /* одна звезда на кадр — без памятки */
  return r>=5?" · "+rungRoman(rungPlanOf(r)):"";
}
/* кольцо у звезды: сегменты по пятилеткам, зазубрина с Рубежа, столбик огней по постройкам */
function drawRungRing(x,y,rr,sx,sy){
  const r=rungOfCached(sx,sy);
  if(r<5)return;
  const seg=rungRingSegs(r),R=rr+8;
  ctx.strokeStyle="rgba(127,230,216,.7)";ctx.lineWidth=1.3;
  for(let i=0;i<seg;i++){
    const a0=-Math.PI/2+i*TAU/6+.07,a1=-Math.PI/2+(i+1)*TAU/6-.07;
    ctx.beginPath();ctx.arc(x,y,R,a0,a1);ctx.stroke();
  }
  if(r>=24){ctx.beginPath();ctx.moveTo(x,y-R-3);ctx.lineTo(x,y-R+3);ctx.stroke();}
  const H=G.hold&&G.hold[sx+","+sy],nb=H&&H.bld?Object.keys(H.bld).length:0;
  if(nb){
    ctx.fillStyle="rgba(242,178,92,.85)";
    for(let j=0;j<Math.min(8,nb);j++)ctx.fillRect(x+rr+12,y+2-j*3.5,2,2);
  }
}
/* ── момент при стыковке: что здесь теперь стоит ──
   Объявляется верхняя из пройденных ступеней и каждая ★ между ними; смена
   пятилетки — своей строкой. Хранится только последняя объявленная (G.hold.rung). */
function rungMoments(sys){
  if(!sys||!sys.station)return 0;
  const H=holdOf(sys.key),r=rungOf(sys.sx,sys.sy),seen=H.rung|0;
  if(r<=seen){H.rung=Math.min(seen,r);return 0;}
  const nm=(G.names&&G.names[sys.key])||sys.station.name;
  let n=0;
  for(let i=seen+1;i<=r;i++){
    const d=RUNGS[i];if(!d)continue;
    if(i===r||d.star){
      tell("tech",nm+" · "+d.ru.toUpperCase()+" — "+d.note,d.ru+"\n"+d.note);n++;
    }
    if(i%5===0&&i<30){
      const p=rungPlanOf(i+1);
      tell("tech",nm+" · СИСТЕМА ПЕРЕШЛА В "+rungRoman(p)+" ПЯТИЛЕТКУ — "+RUNG_PLAN[p],
           rungRoman(p)+" пятилетка\n"+RUNG_PLAN[p].toLowerCase());n++;
    }
  }
  H.rung=r;
  return n;
}
/* ДОСКА: строка о системе — имя, пятилетка, что стоит, как зовут */
function rungBoardBlock(){
  const sys=G.sys;if(!sys||!sys.station)return;
  const r=rungOf(sys.sx,sys.sy);if(r<1)return;
  const d=RUNGS[r],nm=(G.names&&G.names[sys.key])||sys.station.name;
  $body.appendChild(el("div","sec",nm.toUpperCase()+" · "+rungRoman(rungPlanOf(r))+" ПЯТИЛЕТКА · "+d.ru.toUpperCase()));
  $body.appendChild(el("div","row","<div class='nm'><b>"+d.note+"</b><s>здесь вас зовут: "+rungAddress(r,sys.sx,sys.sy)+
    (r<30?" · дальше — "+RUNGS[r+1].ru.toLowerCase():"")+"</s></div>"));
  /* Архив (I3): летопись — всё, что здесь стояло */
  const AL=(typeof holdArchiveLines==="function")?holdArchiveLines(sys):[];
  if(AL.length)$body.appendChild(el("div","row","<div class='nm'><b>Летопись</b><s>"+AL.join("<br>")+"</s></div>"));
}
/* эфир (11b): буй отвечает — в системах с ★5 автомат слышен */
function buoyEtherLine(r){
  if(r()>.18)return null;
  const rad=6,L=[];
  for(let x=G.sx-rad;x<=G.sx+rad;x++)for(let y=G.sy-rad;y<=G.sy+rad;y++){
    if(!starAt(x,y))continue;
    if(!rungHas(x,y,"buoy"))continue;
    const S=getSystem(x,y);if(!S||!S.station)continue;
    L.push(S);
  }
  if(!L.length)return null;
  const S=L[Math.floor(r()*L.length)],nm=(G.names&&G.names[S.key])||S.station.name;
  return pick(["…буй «"+nm+"» отвечает: автомат в порядке, почта принята.",
               "…«"+nm+"», буй: слышу вас. Ретранслирую.",
               "…автомат «"+nm+"» отстучал сводку. Значит, стоит."],r);
}
