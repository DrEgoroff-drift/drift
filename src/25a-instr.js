/* ══════════════ приборы: пять стрелок и невязка ══════════════
   Набор, на котором стоит всё остальное (M122). Приборы заведены НЕ ради поиска
   аномалий: каждый из них нужен в работе — сроки, прокладка курса, масса, эфир,
   свет. То, что по ним читается область (06b-region), — побочный продукт.

   ЧЕМ ЭТО НЕ ЯВЛЯЕТСЯ. Не детектор и не подсказка. Прибор никогда не пищит, не
   мигает тревожным цветом и не пишет строку в журнал: он просто показывает.
   Замечает игрок, а не игра, — и это единственный способ, которым чужое
   присутствие в галактике может остаться странным, а не отмеченным.

   ПРАВИЛА ФАЙЛА:
   1. Ни звука, ни сообщения, ни смены цвета. Ни одной ветки, зовущей `say`,
      `tell`, `logAdd` или `sfx`. Суита сторожит это дословно.
   2. Показание сначала рабочее, потом странное: у каждого прибора есть база от
      настоящего состояния мира, и лишь поверх неё ложится отклонение.
   3. Отклонение получает ровно один прибор — тот, что принадлежит области.
   4. Ничего не персистится: всё выводится из положения и таблиц. */

const INSTR=[
  {id:"chrono", ru:"ХРОНОМЕТР",  unit:"",     dig:3,
   /* сроки, длина местных суток, когда стемнеет */
   base:()=>1},
  {id:"course", ru:"КУРСОГРАФ",  unit:"КМ",   dig:1,
   /* счисление против звёздной обсервации: расхождение прокладки */
   base:()=>{
     const s=G.sys?Math.hypot(G.ship.vx||0,G.ship.vy||0):0;
     return .4+s*.03;
   }},
  {id:"mass",   ru:"МАСС-ДЕТЕКТОР",unit:"КТ", dig:1,
   /* масса вокруг: трюм, пояс, тела системы */
   base:()=>{
     let m=(typeof held==="function"?held():0)*.05;
     if(G.sys){
       if(G.sys.belt)m+=6;
       for(const p of G.sys.planets)m+=p.radius*.05;
     }
     return m;
   }},
  {id:"radio",  ru:"ПРИЁМНИК",   unit:"ДБ",   dig:1,
   /* шумовая шкала: цены, движение, погода, слухи */
   base:()=>{
     const d=G.sys?(typeof sysDanger==="function"?sysDanger(G.sys.sx,G.sys.sy):.4):.4;
     return 12+d*9+(G.sys&&G.sys.station?4:0);
   }},
  {id:"actino", ru:"АКТИНОМЕТР", unit:"ВТ",   dig:0,
   /* сколько света приходит: заряд, безопасность посадки, оранжерея */
   base:()=>{
     if(!G.sys)return 900;
     const R=G.sys.radius||60;
     const d=Math.hypot((G.ship.x||0),(G.ship.y||0))||600;
     return clamp(R*R*22/Math.max(120,d),40,4000);
   }}
];
const INSTR_KEYS=INSTR.map(i=>i.id);
const INSTR_BY_ID={};for(const I of INSTR)INSTR_BY_ID[I.id]=I;
/* ── показания ──
   Правило 3: отклонение достаётся прибору области и никому больше. Величина
   отклонения — невязка, то есть чем ближе к ядру, тем сильнее врёт. */
function instrRead(sx,sy){
  const x=(sx===undefined?G.sx:sx)|0, y=(sy===undefined?G.sy:sy)|0;
  const R=regionAt(x,y), m=misclose(x,y);
  return INSTR.map(I=>{
    const base=I.base();
    const dev=I.id===R.needle?m:0;
    /* отклонение — доля от собственного показания прибора: у хронометра это
       ход, у актинометра ватты. Одно число на всех сделало бы шкалы игрушечными */
    const val=I.id==="chrono"?base+dev*.22:base*(1+dev*.85);
    return {id:I.id,ru:I.ru,unit:I.unit,dig:I.dig,val,dev,base};
  });
}
/* сама невязка: одно маленькое число, которое печатает корабль, сверив себя
   пятью способами. Здесь она просто берётся из области — считать её иначе
   значило бы завести второй источник правды. */
function instrMisclose(sx,sy){
  return misclose((sx===undefined?G.sx:sx)|0,(sy===undefined?G.sy:sy)|0);
}
/* ── панель ──
   Живёт на потолочном блоке над остеклением: это физическая поверхность, на
   которую игрок поднимает глаза, а не слой поверх мира. Пять шкал в ряд и
   невязка цифрами с краю. Цвет один на всю панель и не меняется никогда
   (правило 1): тревожная подсветка — это и есть детектор. */
function instrPanel(P,FS){
  const brow=P.brow;
  if(brow<26)return;                       // на низком потолке панели нет места
  const R=instrRead();
  const w=Math.min(P.BW*.52,420), x0=(W-w)/2, cw=w/5;
  /* панель обязана уместиться В блоке, а не свешивать корытце на остекление:
     высота шкалы считается от того, сколько осталось до кромки проёма */
  const h=clamp((brow-12)/2.7,5,14), y=5+h;
  const col="rgba(150,176,190,";
  ctx.save();
  /* корытце панели: она утоплена в блок, а не наклеена на него */
  ctx.fillStyle="rgba(6,9,13,.55)";
  ctx.fillRect(x0-8,y-h-4,w+16,h*2+10);
  ctx.strokeStyle=col+".18)";ctx.lineWidth=1;
  ctx.strokeRect(x0-8.5,y-h-4.5,w+17,h*2+11);
  ctx.textAlign="center";
  for(let i=0;i<R.length;i++){
    const r=R[i],cx=x0+cw*(i+.5);
    /* шкала: дуга с делениями и стрелка. Отклонение двигает стрелку, и больше
       ничего: ни цвета, ни толщины, ни свечения */
    ctx.strokeStyle=col+".30)";ctx.lineWidth=1.2;
    ctx.beginPath();ctx.arc(cx,y+h*.5,h*.86,Math.PI*1.12,Math.PI*1.88);ctx.stroke();
    ctx.strokeStyle=col+".16)";ctx.lineWidth=1;
    for(let k=0;k<=4;k++){
      const a=Math.PI*1.12+(Math.PI*.76)*k/4;
      const c1=Math.cos(a),s1=Math.sin(a);
      ctx.beginPath();
      ctx.moveTo(cx+c1*h*.86,y+h*.5+s1*h*.86);
      ctx.lineTo(cx+c1*h*.66,y+h*.5+s1*h*.66);
      ctx.stroke();
    }
    /* положение стрелки: рабочая величина, сжатая в шкалу логарифмом, плюс
       отклонение. Шкала у каждого прибора своя, потому и делений всего пять */
    const t=clamp(Math.log10(1+Math.abs(r.val))/2.6+r.dev*.42,0,1);
    const a=Math.PI*1.12+Math.PI*.76*t;
    ctx.strokeStyle=col+".85)";ctx.lineWidth=1.4;
    ctx.beginPath();
    ctx.moveTo(cx,y+h*.5);
    ctx.lineTo(cx+Math.cos(a)*h*.78,y+h*.5+Math.sin(a)*h*.78);
    ctx.stroke();
    ctx.fillStyle=col+".85)";
    ctx.beginPath();ctx.arc(cx,y+h*.5,1.4,0,TAU);ctx.fill();
    ctx.fillStyle=col+".45)";
    ctx.font=Math.round(6*FS)+"px ui-monospace,monospace";
    ctx.fillText(r.ru,cx,y+h*1.6);
  }
  /* невязка: цифры на краю панели, без подписи «внимание» и без рамки */
  ctx.textAlign="right";
  ctx.fillStyle=col+".5)";
  ctx.font=Math.round(7*FS)+"px ui-monospace,monospace";
  ctx.fillText("НЕВЯЗКА "+instrMisclose().toFixed(3),x0+w+4,y-h+2);
  ctx.restore();
}
