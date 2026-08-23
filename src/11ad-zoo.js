/* ══════════════ космозоо: зверь едет домой ══════════════
   M164. Булычёвский ключ: попугай — Говорун, а фауна (20-life) уже сканируется
   и рисуется. Продолжение: ОТСКАНИРОВАННОГО зверя можно поймать — он занимает
   слот трюма и ворчит, — а дома, в жилой части, для него ставится ЖИВОЙ УГОЛ.
   Звери требуют корм (органика из трюма), переговариваются, иногда сбегают и
   находятся в кабинете. Вега против. Зоостанция — стойка ядра области «Роща»:
   принимает зверей как груз, платит и пишет в книжку — «Тайна третьей планеты»
   целиком.

   ПРАВИЛА ФАЙЛА:
   1. Зверь — запись {ru, seed, from, fed}: рисуется тем же генератором по
      посеву, ничего нового не выдумано.
   2. Не ферма: угол держит троих, кормится органикой, дохода не даёт. */
const ZOO_PEN_CAP=3;
function zooAll(){if(!G.zoo||typeof G.zoo!=="object")G.zoo={carry:[],pen:[]};return G.zoo;}
function zooCarry(){return zooAll().carry;}
function zooPen(){return zooAll().pen;}
/* поймать: только отсканированного, рядом, не хищного */
function zooCatch(b){
  const Z=zooAll();
  if(!b||!b.scanned||Z.carry.length>=2)return false;
  Z.carry.push({ru:b.name,seed:b.seed|0,from:(G.surf&&G.surf.p&&G.surf.p.name)||"",fed:celDay()});
  b.caught=1;
  tell("tech","Пойман: "+b.name+" · клетка в трюме (−1 слот)","ПОЙМАН\n"+b.name);
  peopleLine("вяк. Вяк-вяк. (недовольно)",b.name);
  if(typeof vegaAboard==="function"&&vegaAboard())peopleLine("Это ЧТО. Оно будет ЖИТЬ У НАС? Оно на меня смотрело!","Вега",true);
  if(typeof recordAdd==="function")recordAdd("биослужба","взят зверь: "+b.name);
  return true;
}
/* клетки занимают трюм: читается в stat() */
function zooCargoSlots(){return zooCarry().length;}
/* дома: пересадить в угол */
function zooSettle(){
  const Z=zooAll();
  if(!Z.carry.length||Z.pen.length>=ZOO_PEN_CAP)return false;
  const b=Z.carry.shift();Z.pen.push(b);
  logAdd("good",b.ru+" переехал в живой угол.");
  return true;
}
/* день: кормёжка из органики, разговоры, побег в кабинет */
function zooTick(){
  const Z=zooAll();if(!Z.pen.length)return;
  const d=celDay();if(Z.lastDay===d)return;Z.lastDay=d;
  const r=rng(hashi(d,Z.pen.length,0x200));
  for(const b of Z.pen){
    if(d-b.fed>=2){
      if((G.cargo.organics|0)>0){G.cargo.organics--;b.fed=d;b.hungry=0;}
      else if(!b.hungry){b.hungry=1;logAdd("warn",b.ru+" в углу голоден: нужна органика в трюме");}
    }else b.hungry=0;
  }
  if(Z.pen.length>=2&&r()<.3)logAdd("dim","В живом углу переговариваются: "+Z.pen[0].ru.split(" ")[1]+" и "+Z.pen[1].ru.split(" ")[1]+". О чём — неясно.");
  if(!Z.escaped&&r()<.08){Z.escaped=Z.pen[Math.floor(r()*Z.pen.length)].ru;logAdd("warn",Z.escaped+" сбежал из угла. Ищите в кабинете.");}
  else if(Z.escaped&&r()<.5){logAdd("dim",Z.escaped+" нашёлся в кабинете, сидел на книжке. Водворён.");Z.escaped=null;}
}
/* зоостанция: стойка ядра области «Роща» */
function zooStationHere(){
  if(!G.st||typeof regionAt!=="function")return false;
  const R=regionAt(G.sx,G.sy);
  return !!(R&&R.theme==="grove"&&typeof regionDepth==="function"&&regionDepth(G.sx,G.sy)>=.99);
}
function zooSell(i){
  const Z=zooAll();const b=Z.carry[i];if(!b||!zooStationHere())return false;
  Z.carry.splice(i,1);
  const pay=Math.round((300+(b.seed%400))/10)*10;
  earn(pay,"zoo");
  tell("money","Зоостанция приняла: "+b.ru+" · "+pay+" кр","ЗООСТАНЦИЯ\n+"+pay+" кр");
  peopleLine("хороший экземпляр. Кормили? Видно, что кормили. В вольер его.","зоостанция",true);
  if(typeof recordAdd==="function")recordAdd("зоостанция","сдан зверь: "+b.ru);
  return true;
}
/* доска: зоостанция принимает */
function zooBlock(){
  const Z=zooAll();
  if(zooStationHere()&&Z.carry.length){
    $body.appendChild(el("div","sec","ЗООСТАНЦИЯ · ПРИНИМАЕМ ЗВЕРЕЙ"));
    Z.carry.forEach((b,i)=>{
      const r=el("div","row","<div class='nm'><b>"+b.ru+"</b><s>с планеты "+(b.from||"—")+"</s></div>");
      const bt=el("button","act sm gold","СДАТЬ");bt.onclick=()=>{zooSell(i);renderTab();};
      r.appendChild(bt);$body.appendChild(r);
    });
  }
}
/* дом: угол и пересадка */
function zooHomeBlock(){
  const Z=zooAll();
  if(!Z.carry.length&&!Z.pen.length)return;
  $body.appendChild(el("div","sec","ЖИВОЙ УГОЛ · "+Z.pen.length+" / "+ZOO_PEN_CAP+(Z.escaped?" · "+Z.escaped.toUpperCase()+" СБЕЖАЛ":"")));
  if(Z.pen.length)$body.appendChild(el("div","row","<div class='nm'><s>"+Z.pen.map(b=>b.ru+(b.hungry?" (голоден)":"")).join(" · ")+"<br>кормятся органикой из трюма · раз в два дня</s></div>"));
  if(Z.carry.length&&homeHas("living")){
    const r=el("div","row","<div class='nm'><b>В клетке: "+Z.carry[0].ru+"</b><s>пересадить в угол — клетка освободит слот трюма</s></div>");
    const b=el("button","act sm","В УГОЛ");b.disabled=Z.pen.length>=ZOO_PEN_CAP;
    b.onclick=()=>{zooSettle();renderTab();};
    r.appendChild(b);$body.appendChild(r);
  }
}
/* угол в жилой части: клетка и силуэты по посеву зверя */
function zooDrawPen(c,x0,fy){
  const Z=zooAll();if(!Z.pen.length)return;
  c.strokeStyle="rgba(180,170,150,.6)";c.lineWidth=1.2;
  c.strokeRect(x0,fy-18,22,18);
  for(let i=1;i<4;i++){c.beginPath();c.moveTo(x0+i*5.5,fy-18);c.lineTo(x0+i*5.5,fy);c.stroke();}
  Z.pen.slice(0,3).forEach((b,i)=>{
    const r=rng(b.seed^0x200);
    c.fillStyle="rgba("+(120+Math.floor(r()*80))+","+(100+Math.floor(r()*60))+","+(80+Math.floor(r()*40))+",.9)";
    const bx=x0+4+i*6,by=fy-4;
    c.beginPath();c.ellipse(bx,by,2.6,1.8+r()*1.2,0,0,TAU);c.fill();
    c.beginPath();c.arc(bx+2,by-2,1.2,0,TAU);c.fill();
  });
}
