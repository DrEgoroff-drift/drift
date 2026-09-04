/* ══════════════ косметика «Сороки»: вещи без чисел (M344) ══════════════
   Второй ряд полки парусника — то, что ничего не меняет в счёте и меняет вид:
   восемь выхлопов со своей формой пламени, следы прыжка, отделка скафандра и
   тон забрала, редкие метки на корпусе, рисунок бортовых огней, свой сигнал
   стыковки. Платят спичками (§12), 6–20; шкатулка на ОПИСИ хранит купленное,
   и оттуда вещь надевают на корпус или на комплект — тычком или перетаскиванием.

   ОДНО ПРАВИЛО НА ВСЕ ХУКИ: художник сам читает свою косметику там, где рисует
   (drawExhaust, drawTrail, kitPalette, забрала куклы и ходока, бортовые огни,
   трафареты, стыковка) — здесь только таблица, состояние и переводчики цвета.
   Набор 91zzzzh сторожит, что каждая вещь меняет хоть один пиксель своего
   художника: косметика, которой не видно, — та же ложь, что перк без кода.

   ПРАВИЛА ФАЙЛА:
   1. Хранится G.cosm={owned:[id…],exhaust,trail,suit,visor,mark,lights,chime}.
   2. Ни одного числа игры: ни тяги, ни брони, ни цены за след.
   3. Цвета — в правилах кодекса: одно тело, один свет; пламя остаётся пламенем. */
const COSM_SLOTS=["exhaust","trail","suit","visor","mark","lights","chime"];
const COSM_SLOT_RU={exhaust:"выхлоп",trail:"след прыжка",suit:"отделка скафандра",visor:"забрало",
  mark:"метка на корпусе",lights:"бортовые огни",chime:"сигнал стыковки"};
/* выхлопы: цвета ядра/середины/края, длина, ширина, форма */
const COSM_EXH={
  ex_blue:   {ru:"Синее пламя",       col:["255,250,240","120,190,255","60,110,255"],len:1.1,wide:.9,shape:"plain"},
  ex_needle: {ru:"Игольчатый факел",  col:["255,246,222","255,178,96","255,96,48"],len:1.8,wide:.42,shape:"plain"},
  ex_fan:    {ru:"Веерное сопло",     col:["255,246,222","255,178,96","255,96,48"],len:.7,wide:1.7,shape:"plain"},
  ex_twin:   {ru:"Двойной выхлоп",    col:["255,246,222","255,178,96","255,96,48"],len:1.1,wide:.5,shape:"twin"},
  ex_copper: {ru:"Медное пламя",      col:["255,240,210","232,150,80","170,70,30"],len:1.0,wide:1.0,shape:"plain"},
  ex_green:  {ru:"Зелёный факел",     col:["240,255,240","140,230,150","40,160,80"],len:1.15,wide:.85,shape:"plain"},
  ex_ring:   {ru:"Кольцевой выхлоп",  col:["255,246,222","255,178,96","255,96,48"],len:1.0,wide:.8,shape:"ring"},
  ex_white:  {ru:"Белый жар",         col:["255,255,255","240,240,255","180,190,220"],len:1.3,wide:.7,shape:"plain"}
};
const COSM_TRAIL={
  tr_emerald:{ru:"Изумрудный след",edge:[60,200,120]},
  tr_copper: {ru:"Медный след",    edge:[220,140,70]},
  tr_violet: {ru:"Лиловый след",   edge:[170,110,230]},
  tr_ice:    {ru:"Ледяной след",   edge:[170,220,255]}
};
const COSM_SUIT={
  su_gold:     {ru:"Золочёный скафандр",       main:"#c9a24a",dark:"#7a5a1c",acc:"#f2e6c8"},
  su_black:    {ru:"Воронёный скафандр",       main:"#2a2d31",dark:"#15171a",acc:"#8a9299"},
  su_mirror:   {ru:"Зеркальный скафандр",      main:"#e6edf3",dark:"#9aa7b3",acc:"#7fe6d8"},
  su_porcelain:{ru:"Фарфоровый с росписью",    main:"#f2efe6",dark:"#b9b3a4",acc:"#a52a2a"}
};
const COSM_VISOR={
  vi_amber: {ru:"Янтарное забрало",  col:[255,200,90]},
  vi_green: {ru:"Зелёное забрало",   col:[120,230,150]},
  vi_mirror:{ru:"Зеркальное забрало",col:[235,240,250]}
};
const COSM_MARK={
  mk_plate: {ru:"Заводская табличка", note:"настоящая, с номером партии"},
  mk_stripe:{ru:"Красная полоса",     note:"по борту, как у почтовых"},
  mk_star:  {ru:"Звезда на борту",    note:"одна, у миделя"}
};
const COSM_LIGHTS={
  li_double:{ru:"Двойной проблеск"},
  li_steady:{ru:"Ровные огни"},
  li_alt:   {ru:"Попеременные огни"}
};
const COSM_CHIME={
  ch_two: {ru:"Свой сигнал стыковки",sfx:"chime"},
  ch_bell:{ru:"Колокол у причала",   sfx:"bell"}
};
const COSM_TABLES={exhaust:COSM_EXH,trail:COSM_TRAIL,suit:COSM_SUIT,visor:COSM_VISOR,mark:COSM_MARK,lights:COSM_LIGHTS,chime:COSM_CHIME};
function cosmSlotOf(id){for(const s of COSM_SLOTS)if(COSM_TABLES[s][id])return s;return null;}
function cosmRu(id){const s=cosmSlotOf(id);return s?COSM_TABLES[s][id].ru:id;}
function cosmRec(){
  let c=G.cosm;
  if(!c||typeof c!=="object"||!Array.isArray(c.owned)){c=G.cosm={owned:[]};for(const s of COSM_SLOTS)c[s]=null;}
  return c;
}
function cosmOwns(id){return !!(G.cosm&&Array.isArray(G.cosm.owned)&&G.cosm.owned.indexOf(id)>=0);}
function cosmOn(slot){const c=G.cosm;return c?c[slot]||null:null;}
/* надеть: только своё и только в свой слот; снять — слот пуст */
function cosmWear(id){
  const s=cosmSlotOf(id);if(!s||!cosmOwns(id))return false;
  cosmRec()[s]=id;
  if(s==="trail"&&typeof TRAIL_TINT!=="undefined")for(const k in TRAIL_TINT)delete TRAIL_TINT[k];
  return true;
}
function cosmTakeOff(slot){const c=cosmRec();if(!c[slot])return false;c[slot]=null;return true;}
function cosmGive(id){
  const s=cosmSlotOf(id);if(!s)return false;
  const c=cosmRec();
  if(c.owned.indexOf(id)<0)c.owned.push(id);
  if(!c[s])cosmWear(id);                       /* пустой слот — надеваем сразу */
  return true;
}
/* ── переводчики для художников ── */
function cosmExhaust(){const id=cosmOn("exhaust");return id?COSM_EXH[id]||null:null;}
/* след прыжка: край — цвет вещи, середина — смесь, ядро — как было */
function cosmTrail(T){
  const id=cosmOn("trail"),C=id?COSM_TRAIL[id]:null;if(!C)return T;
  return {core:T.core,mid:mixc(C.edge,[255,255,255],.35),edge:C.edge};
}
function cosmSuit(out){
  const id=cosmOn("suit"),S=id?COSM_SUIT[id]:null;if(!S)return out;
  for(const p of ["helmet","torso","gloves","boots","pack"])out[p]={main:S.main,dark:S.dark,acc:S.acc};
  return out;
}
function cosmVisor(){const id=cosmOn("visor");return id?COSM_VISOR[id].col:null;}
/* бортовые огни: рисунок вместо «мигает/не мигает» */
function cosmLightOn(side,blink,t){
  const id=cosmOn("lights");
  if(id==="li_steady")return true;
  if(id==="li_double"){const u=(t||0)%70;return u<7||(u>13&&u<20);}
  if(id==="li_alt")return side<0?blink>0:blink<=0;
  return blink>0;
}
function cosmChimeName(){const id=cosmOn("chime");return id?COSM_CHIME[id].sfx:null;}
function cosmChimePlay(){const n=cosmChimeName();if(n&&typeof sfx==="function")sfx(n);return n;}
/* метка на корпусе: в координатах корпуса, после трафаретов (03e) */
function drawCosmMark(h){
  const id=cosmOn("mark");if(!id)return;
  const P=h.prof;
  if(id==="mk_stripe"){
    const x0=lerp(h.nose,h.tail,.30),x1=lerp(h.nose,h.tail,.40);
    ctx.fillStyle="rgba(190,40,40,.85)";
    ctx.beginPath();ctx.moveTo(x0,-profW(P,x0)*.9);ctx.lineTo(x1,-profW(P,x1)*.9);ctx.lineTo(x1,profW(P,x1)*.9);ctx.lineTo(x0,profW(P,x0)*.9);ctx.closePath();ctx.fill();
    ctx.fillStyle="rgba(255,255,255,.22)";ctx.fillRect(x0,-profW(P,x0)*.9,(x1-x0)*.25,profW(P,x0)*1.8);
  }else if(id==="mk_star"){
    const x=lerp(h.nose,h.tail,.42),r=Math.max(1.4,profW(P,x)*.5);
    ctx.fillStyle="rgba(214,150,44,.95)";ctx.beginPath();
    for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=(i&1)?r*.45:r;ctx.lineTo(x+Math.cos(a)*rr,Math.sin(a)*rr);}
    ctx.closePath();ctx.fill();
    ctx.strokeStyle="rgba(190,40,40,.9)";ctx.lineWidth=.4;ctx.stroke();
  }else{
    const x=lerp(h.nose,h.tail,.58),w=profW(P,x);if(w<1.2)return;
    ctx.fillStyle="#c9a24a";ctx.fillRect(x-2.2,-w*.55-1,4.4,2);
    ctx.fillStyle="rgba(0,0,0,.5)";ctx.fillRect(x-1.9,-w*.55-.7,.4,.4);ctx.fillRect(x+1.5,-w*.55+.3,.4,.4);
    ctx.fillStyle="rgba(0,0,0,.55)";for(let i=0;i<4;i++)ctx.fillRect(x-1.2+i*.7,-w*.55-.2,.4,.7);
  }
}
/* ── в каталог «Сороки»: 27 вещей, семейство cosm, спички 6–20 ── */
(function cosmCatalogue(){
  const price={exhaust:12,trail:10,suit:20,visor:8,mark:14,lights:6,chime:9};
  const note={exhaust:"из нашего ремонта: горит тем, что в него положили",trail:"так уходили те, кто до вас",
    suit:"шили на заказ; заказчик не пришёл",visor:"стекло с старого шлема, тон не смывается",
    mark:"краска с наших же парусов",lights:"схему переписали с чужого борта",chime:"записан на станции, которой нет"};
  for(const s of COSM_SLOTS){
    for(const id in COSM_TABLES[s]){
      const T=COSM_TABLES[s][id];
      WANDER_CAT.push({id,fam:"cosm",slot:s,ru:T.ru,note:note[s],fx:COSM_SLOT_RU[s]+" · видно, а не считается",pay:{m:price[s]},hook:"12v-wander-shop-cosm"});
      WANDER_BY_ID[id]=WANDER_CAT[WANDER_CAT.length-1];
    }
  }
})();
