/* ══════════════ большой уезд: город без кнопок ══════════════
   M140-county. Край археологов и мародёров (06c, `county`, игла масс-детектора):
   копают, возят, подделывают и продают «древности». На окраине — тяжёлую
   кладку берут на строительный камень; ближе — четырёхметровые двери и
   двенадцатитонные подъёмники уже приспособлены под склады.

   ЯДРО — ЦЕЛЫЙ ГОРОД БЕЗ ЕДИНОЙ КНОПКИ: всё отвечает на ЗВУК. Интерфейс — шум:
   ранец, бур, удар о грунт. Игрок учится говорить громкостью.
   ПОВОРОТ: детская маленькая. Жители были нашего роста. Значит, масштаб был
   никогда не для жителей — ДЛЯ ГОСТЯ.
   Город всё ещё слушает. Шуметь можно сколько угодно. Когда-нибудь — не здесь
   и не скоро — что-то ответит.

   ПРАВИЛА ФАЙЛА:
   1. Шум не хранится: громкость — счётчик на этой высадке. Хранится только,
      что город вас услышал и ответил ли (G.county).
   2. Ответ приходит один раз, далеко отсюда, не раньше двадцати прыжков,
      и он не объясняется. */

const COUNTY_LVL=[30,70,120,160];           // двери · свет · подъёмник · услышали
function countyAll(){return (G.county||(G.county={called:0,at:0,answered:0,saw:0}));}
function countyDepthAt(sx,sy){
  if(typeof regionAt!=="function")return 0;
  const R=regionAt(sx,sy);
  if(R.theme!=="county")return 0;
  return (R.core.sx===sx&&R.core.sy===sy)?2:1;
}
function countyDepthHere(){return countyDepthAt(G.sx,G.sy);}
function countyCorePlanet(sys){
  if(!sys||countyDepthAt(sys.sx,sys.sy)!==2)return null;
  for(const p of sys.planets||[])if(typeof settleCanLive==="function"&&settleCanLive(p))return p;
  return null;
}
function countyIsCore(p){const c=countyCorePlanet(G.sys);return !!(c&&p&&c.idx===p.idx);}
/* кладка в уезде крупнее: окраина в полтора раза, ядро вдвое (20a genPOI) */
function countyPoiK(){const d=countyDepthHere();return d===2?2:(d===1?1.5:1);}
/* дворы города — под гостя, не под жителей (12t settleDraw) */
function countyHouseK(p){return countyIsCore(p)?2.3:1;}
function countyGroundLine(){
  const d=countyDepthHere();
  if(!d)return null;
  return d===1?"Кладку разбирают на камень. Блоки — в рост человека.":"Двери в четыре метра. Кнопок нет нигде.";
}
/* ── шум ──
   Зовётся из updateSurface каждый кадр на планете ядра. Ранец, бур и удар
   о грунт — громкость; тишина — спад. Уровни открывают город по очереди. */
function countyNoiseTick(S,dt){
  if(!countyIsCore(S.p))return;
  let n=S.noise||0;
  if(S.jetOn)n+=.9*dt;
  if(S.mining)n+=.6*dt;
  if(S.shake>4)n+=6;
  n=Math.max(0,n-.12*dt);
  S.noise=n;
  const lvl=countyLevel(S);
  if(lvl>=3&&!countyAll().saw){countyAll().saw=1;logAdd("dim","Подъёмник пошёл. Наверху — детская. Кроватки по нашему росту.");}
  if(lvl>=4&&!countyAll().called){const C=countyAll();C.called=1;C.at=(G.odo&&G.odo.jumps)|0;logAdd("dim","Город услышал. Что-то — не здесь и не скоро.");}
}
function countyLevel(S){
  const n=(S&&S.noise)||0;
  let l=0;for(const t of COUNTY_LVL)if(n>=t)l++;
  return l;
}
/* ── вид ──
   Зовётся из settleDraw после дворов: у самого крупного двора — дверь в
   четыре метра, открывается по уровню; на втором уровне свет в окнах; на
   третьем — подъёмник с детской наверху. */
function countyDrawTown(S,tr,camx,camy,p,sx,n){
  if(!countyIsCore(p)||!G.surf)return;
  const lvl=countyLevel(G.surf);
  const ox=sx+(n-1)/2*26*1.2, oy=groundAt(tr,ox+camx)-camy;
  const H4=96,Wd=34;
  /* ── дверь под тем же солнцем (G6) ──
     Была чёрная плашка с серой плашкой поверх и белым контуром. Теперь:
     косяки и перемычка — камень, под светом звезды (placeShade, 11va);
     створка — тяжёлая, в досках и оковке, уходит в стену по уровню; в проёме
     не чернота, а глубина — и, когда город зажёг свет, изнутри на порог и
     на грунт перед дверью ложится тёплое (placeLamp) */
  const open=lvl>=1?clamp(((G.surf.noise||0)-COUNTY_LVL[0])/40,0,1):0;
  const stone=p.T.pal[Math.min(p.T.pal.length-1,2)].map(v=>Math.round(v*.5+60));
  const jw=7,lit=lvl>=2;
  /* проём: глубина, уходящая в темноту; со светом — тёплая глубина */
  const gi=ctx.createLinearGradient(0,oy-H4,0,oy);
  gi.addColorStop(0,lit?"rgba(70,48,26,.95)":"rgba(8,9,12,.96)");
  gi.addColorStop(1,lit?"rgba(150,104,56,.95)":"rgba(18,18,20,.96)");
  ctx.fillStyle=gi;ctx.fillRect(ox-Wd/2,oy-H4,Wd,H4);
  if(lit&&open>0){
    ctx.fillStyle="rgba(255,214,150,"+(.5*open).toFixed(3)+")";ctx.fillRect(ox-Wd/2,oy-3,Wd*open,3);   /* свет на пороге */
    placeLamp(ox-Wd/2+Wd*open*.5,oy-H4*.35,60+open*120,[1,.78,.5],.35+.55*open,-24);
  }
  /* створка: доски, две оковки, тень на проёме от её кромки */
  if(open<1){
    const lx=ox-Wd/2+Wd*open,lw=Wd*(1-open);
    ctx.fillStyle="rgba(0,0,0,.35)";ctx.fillRect(lx-3,oy-H4,3,H4);
    placeShade(()=>{ctx.rect(lx,oy-H4,lw,H4);},lx,oy-H4,lx+lw,oy,[84,74,62],p,0x70D1,{ao:.3});
    ctx.fillStyle="rgba(0,0,0,.22)";
    for(let xx=lx+6;xx<lx+lw;xx+=6)ctx.fillRect(xx,oy-H4,1,H4);
    ctx.fillStyle="rgba(60,64,70,.9)";
    for(const t of [.22,.74])ctx.fillRect(lx,oy-H4*t-2,lw,3);
  }
  /* косяки и перемычка */
  placeShade(()=>{ctx.rect(ox-Wd/2-jw,oy-H4-jw,jw,H4+jw);},ox-Wd/2-jw,oy-H4-jw,ox-Wd/2,oy,stone,p,0x70D2);
  placeShade(()=>{ctx.rect(ox+Wd/2,oy-H4-jw,jw,H4+jw);},ox+Wd/2,oy-H4-jw,ox+Wd/2+jw,oy,stone,p,0x70D3);
  placeShade(()=>{ctx.rect(ox-Wd/2-jw-3,oy-H4-jw-9,Wd+jw*2+6,10);},ox-Wd/2-jw-3,oy-H4-jw-9,ox+Wd/2+jw+3,oy-H4-jw+1,stone,p,0x70D4,{ao:.2});
  if(lit){
    /* окна: свет не только в стекле — на стене и на земле под ними */
    for(let i=0;i<3;i++){
      const wx=ox-Wd/2-30-i*22,wy=oy-H4*.6;
      ctx.fillStyle="rgba(0,0,0,.45)";ctx.fillRect(wx-1,wy-1,8,8);
      ctx.fillStyle="rgba(255,214,150,.9)";ctx.fillRect(wx,wy,6,6);
      placeLamp(wx+3,wy+3,54,[1,.8,.52],.4,-10);
    }
  }
  if(lvl>=3){
    /* подъёмник: платформа на уровне детской, в ней четыре кроватки по нашему росту */
    const ly=oy-H4-24;
    ctx.strokeStyle="rgba(150,156,160,.6)";ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(ox+Wd/2+8,ly);ctx.lineTo(ox+Wd/2+8,oy);ctx.moveTo(ox+Wd/2+60,ly);ctx.lineTo(ox+Wd/2+60,oy);ctx.stroke();
    placeShade(()=>{ctx.rect(ox+Wd/2+6,ly,56,18);},ox+Wd/2+6,ly,ox+Wd/2+62,ly+18,[46,50,56],p,0x70D5,{ao:.25});
    ctx.fillStyle="rgba(226,206,160,.85)";for(let i=0;i<4;i++)ctx.fillRect(ox+Wd/2+12+i*12,ly+10,8,3);
    if(lit)placeLamp(ox+Wd/2+34,ly+8,70,[1,.84,.6],.3,-8);
  }
}
/* ── ответ ──
   Один раз, далеко, не раньше двадцати прыжков: строка в эфире без пояснений. */
function countyAnswerLine(){
  const C=countyAll();
  if(!C.called||C.answered||countyDepthHere())return null;
  if((((G.odo&&G.odo.jumps)|0)-C.at)<20)return null;
  C.answered=1;
  return "…(низкий гул. Три такта. Как гудок, только ниже. Потом тишина.)";
}
