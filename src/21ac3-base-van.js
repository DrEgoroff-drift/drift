/* ══════════════ «Буханка» — машина базы с именем (M498 хвост, M485) ══════════════
   Автор: «челнок базы поверхность–корабль как именная машина: коробчатый
   старый фургон с двигателями, всегда немного сломанный, единственная машина,
   которую игрок может переименовать (из таблицы, без свободного текста)».

   Машина заводится у базы с площадкой: имя из VAN_NAMES по семени базы,
   причуда из VAN_QUIRKS — одна и навсегда, как у дронов (M485). Причуда
   честная и маленькая: «не заводится с первого раза» — каждая третья
   переброска с площадки требует второго нажатия; остальные — строка в
   журнале раз в двенадцать смен и деталь на рисунке (дверь на проволоке —
   изолента на двери; поворотник — горит всегда; греется — марево над капотом).
   Переименовать — кнопка на столе станции: имя идёт по кругу таблицы, и
   журнал базы это записывает. B.van = {n, q, tries}. */
const VAN_NAMES=["Буханка","Таблетка","Головастик","Шишига","Козлик","Пирожок","Бочка","Утюг"];
const VAN_QUIRKS=[
  {id:"start",ru:"не заводится с первого раза"},
  {id:"heat", ru:"греется"},
  {id:"door", ru:"дверь на проволоке"},
  {id:"stove",ru:"печка не работает"},
  {id:"blink",ru:"правый поворотник горит всегда"}
];
const VAN_SAY=12;
Object.assign(BLOG,{
  van:   (B,a)=>"«"+(a.who||"Буханка")+"»: "+(a.what||"опять что-то")+" · "+(a.how||"починили тем, что было"),
  vanren:(B,a)=>"машину переименовали: «"+(a.was||"?")+"» → «"+(a.who||"?")+"» · табличку перевесили"
});
const VAN_HOW={start:"завели со второго",heat:"постояла — остыла",door:"проволоку подкрутили",stove:"ехали в куртках",blink:"пусть горит"};
function vanHasPad(B){
  for(const cell of (B&&B.cells)||[])if(cell&&cell.k==="pad")return true;
  return false;
}
function vanOf(B){
  if(!B||!vanHasPad(B))return null;
  if(!B.van){const s=hashi(B.sx*13+B.sy,(B.idx|0)+5,0xBA9)>>>0;B.van={n:s%VAN_NAMES.length,q:(s>>>4)%VAN_QUIRKS.length,tries:0};}
  return B.van;
}
function vanName(B){const v=vanOf(B);return v?VAN_NAMES[v.n%VAN_NAMES.length]:"";}
function vanQuirk(B){const v=vanOf(B);return v?VAN_QUIRKS[v.q%VAN_QUIRKS.length]:null;}
function vanLine(B){const v=vanOf(B);return v?"«"+vanName(B)+"» · "+vanQuirk(B).ru:"";}
/* единственная машина, которую можно переименовать — по кругу, без свободного текста */
function vanRename(B){
  const v=vanOf(B);if(!v)return "";
  const was=vanName(B);v.n=(v.n+1)%VAN_NAMES.length;
  const n=(typeof baseShift==="function")?baseShift():0;
  baseLog(B,"vanren",n,{was,who:vanName(B)});
  logAdd("dim","База «"+B.name+"»: машина теперь «"+vanName(B)+"» (была «"+was+"»)");
  return vanName(B);
}
/* переброска с площадки: «не заводится с первого раза» — каждая третья требует второго нажатия */
function vanStart(B){
  const v=vanOf(B);if(!v)return true;
  v.tries=(v.tries|0)+1;
  if(vanQuirk(B).id==="start"&&(v.tries%3)===1){
    say("«"+vanName(B)+"» не завелась\nещё раз",100);sfx("ui",{f:160,to:90,d:.3,v:.3});
    return false;
  }
  return true;
}
/* смена: раз в двенадцать — строка о причуде. Зовёт baseShiftRun */
function vanStep(B,n){
  const v=vanOf(B);if(!v||(n%VAN_SAY)!==0)return 0;
  const q=vanQuirk(B);
  baseLog(B,"van",n,{who:vanName(B),what:q.ru,how:VAN_HOW[q.id]});
  return 1;
}
/* ── рисунок: фургон у причала, носом в отсек ──
   Коробка со скруглёнными углами, плоская морда с разрезным лобовым стеклом,
   две круглые фары, бампер; сбоку окно и сдвижная дверь; на крыше багажник с
   канистрой; сзади снизу два двигателя вместо колёс, полозья. На борту —
   имя по трафарету. Причуда — на рисунке. */
function drawVan(x0,fy,lit,seed,B){
  const v=vanOf(B),q=vanQuirk(B),name=vanName(B);
  const vx=x0-6,vw=52,vh=24,vy=fy-8-vh;             /* стоит на полозьях в 8 px над полом */
  ctx.fillStyle="rgba(0,0,0,.32)";ctx.beginPath();ctx.ellipse(vx+vw/2,fy-1,vw*.55,3,0,0,TAU);ctx.fill();
  /* двигатели снизу сзади и полозья */
  ctx.fillStyle="rgba(40,44,50,.98)";
  ctx.beginPath();ctx.roundRect(vx+4,fy-9,12,6,2);ctx.fill();
  ctx.beginPath();ctx.roundRect(vx+vw-20,fy-9,12,6,2);ctx.fill();
  const eg=.35+.25*Math.sin(G.t*.07+seed);
  ctx.fillStyle="rgba(255,170,90,"+(eg*.5).toFixed(2)+")";ctx.fillRect(vx+2,fy-8,2,4);ctx.fillRect(vx+vw-22,fy-8,2,4);
  ctx.fillStyle="rgba(90,98,108,.98)";ctx.fillRect(vx+2,fy-3,vw-4,2);
  ctx.fillRect(vx+8,fy-4,2,2);ctx.fillRect(vx+vw-10,fy-4,2,2);
  /* кузов: тёплый серо-зелёный, как красили такие машины */
  const body=ctx.createLinearGradient(0,vy,0,vy+vh);
  body.addColorStop(0,"rgba(122,134,112,"+(.9+lit*.1).toFixed(2)+")");
  body.addColorStop(.5,"rgba(98,110,90,.98)");
  body.addColorStop(1,"rgba(70,80,66,.98)");
  ctx.fillStyle=body;
  ctx.beginPath();ctx.roundRect(vx,vy,vw,vh,[5,7,3,3]);ctx.fill();
  ctx.fillStyle="rgba(255,255,255,"+(.10+lit*.10).toFixed(3)+")";ctx.fillRect(vx+4,vy+1,vw-10,1.2);   /* блик по крыше */
  ctx.fillStyle="rgba(0,0,0,.18)";ctx.fillRect(vx,vy+vh-6,vw,6);                                      /* низ темнее */
  /* морда: лобовое в два стекла, фары, бампер */
  ctx.fillStyle="rgba(14,20,28,.95)";
  ctx.fillRect(vx+vw-14,vy+4,6,8);ctx.fillRect(vx+vw-7,vy+4,5,8);
  ctx.fillStyle="rgba(150,190,220,"+(.18+lit*.18).toFixed(2)+")";ctx.fillRect(vx+vw-13,vy+5,2,3);
  ctx.fillStyle="rgba(255,236,190,"+(.8+lit*.2).toFixed(2)+")";
  ctx.beginPath();ctx.arc(vx+vw-3,vy+15,2.2,0,TAU);ctx.fill();
  bGlow(vx+vw-2,vy+15,10,"255,230,170",.08+lit*.06);
  ctx.fillStyle="rgba(60,64,70,.98)";ctx.fillRect(vx+vw-6,vy+vh-4,7,3);                               /* бампер */
  /* борт: окно, сдвижная дверь, ручка, трафарет имени */
  ctx.fillStyle="rgba(14,20,28,.95)";ctx.fillRect(vx+8,vy+5,12,7);
  ctx.strokeStyle="rgba(0,0,0,.35)";ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(vx+22,vy+3);ctx.lineTo(vx+22,vy+vh-2);ctx.moveTo(vx+36,vy+3);ctx.lineTo(vx+36,vy+vh-2);ctx.stroke();
  ctx.fillStyle="rgba(200,206,210,.8)";ctx.fillRect(vx+33,vy+13,2,1.4);
  ctx.fillStyle="rgba(236,232,220,"+(.7+lit*.2).toFixed(2)+")";
  ctx.font="5px ui-monospace,monospace";ctx.textAlign="left";ctx.textBaseline="alphabetic";
  ctx.fillText(name.toUpperCase(),vx+11,vy+vh-4);   /* от стены: левый край машины уходит в бокс */
  /* багажник на крыше и канистра */
  ctx.strokeStyle="rgba(80,86,92,.95)";ctx.lineWidth=1.2;
  ctx.beginPath();ctx.moveTo(vx+6,vy-2);ctx.lineTo(vx+vw-16,vy-2);ctx.moveTo(vx+8,vy-2);ctx.lineTo(vx+8,vy);ctx.moveTo(vx+vw-18,vy-2);ctx.lineTo(vx+vw-18,vy);ctx.stroke();
  bBox(vx+12,vy-8,8,6,"rgba(160,60,50,.96)",lit,"rgba(0,0,0,.4)");
  /* причуда на рисунке */
  if(q){
    if(q.id==="door"){                                  /* изолента крест-накрест на двери */
      ctx.strokeStyle="rgba(20,20,22,.9)";ctx.lineWidth=1.6;
      ctx.beginPath();ctx.moveTo(vx+24,vy+8);ctx.lineTo(vx+34,vy+18);ctx.moveTo(vx+34,vy+8);ctx.lineTo(vx+24,vy+18);ctx.stroke();
    }
    if(q.id==="blink"){                                 /* правый поворотник горит всегда */
      ctx.fillStyle="rgba(255,170,60,.95)";ctx.fillRect(vx+vw-4,vy+8,3,3);bGlow(vx+vw-2,vy+9,9,"255,170,60",.12);
    }
    if(q.id==="heat"){                                  /* марево над капотом */
      ctx.strokeStyle="rgba(255,255,255,"+(.08+lit*.06).toFixed(3)+")";ctx.lineWidth=1;
      for(let i=0;i<3;i++){const hx=vx+vw-12+i*4,ph=G.t*.08+i;
        ctx.beginPath();for(let k=0;k<=6;k++)ctx.lineTo(hx+Math.sin(ph+k*.9)*1.5,vy-1-k*1.6);ctx.stroke();}
    }
    if(q.id==="start"){                                 /* капот приоткрыт, кто-то заглядывает */
      ctx.fillStyle="rgba(98,110,90,.98)";ctx.beginPath();ctx.moveTo(vx+vw-14,vy+2);ctx.lineTo(vx+vw-2,vy-3);ctx.lineTo(vx+vw-1,vy+2);ctx.closePath();ctx.fill();
    }
    if(q.id==="stove"){                                 /* куртка на крючке в окне */
      ctx.fillStyle="rgba(150,110,70,.9)";ctx.fillRect(vx+10,vy+6,4,5);
    }
  }
}
/* на плато: та же машина издали, стоит на площадке */
function drawVanSmall(x,y,B){
  if(!vanOf(B))return;
  ctx.fillStyle="rgba(98,110,90,.98)";ctx.beginPath();ctx.roundRect(x,y-9,22,9,[2,3,1,1]);ctx.fill();
  ctx.fillStyle="rgba(14,20,28,.95)";ctx.fillRect(x+15,y-7,4,3);ctx.fillRect(x+3,y-7,5,3);
  ctx.fillStyle="rgba(255,236,190,.9)";ctx.fillRect(x+21,y-4,1.4,1.4);
  ctx.fillStyle="rgba(40,44,50,.98)";ctx.fillRect(x+2,y,5,2);ctx.fillRect(x+15,y,5,2);
}
