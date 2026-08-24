/* ══════════════ трюм как раскладка (M179) ══════════════
   Автор показал инвентарь The Forest: всё, что несёшь, РАЗЛОЖЕНО на поверхности
   предметами, и по одному взгляду видно, чего много, чего мало и чего нет.
   В «Дрейфе» трюм был строками «Кремний ×12» на экране корабля — таблицей.

   Здесь трюм ложится на стол (вкладка ТРЮМ, сукно того же стола M177):
   каждый ресурс — своя КУЧА, и её вид отвечает на два вопроса без цифр:
   · ЧТО это — лёд колотыми глыбами, железо ржавыми слитками, кристаллы
     друзой, газ баллонами, ракеты в ряд, люди... люди сидят на краю;
   · СКОЛЬКО — куча растёт с числом единиц: три предмета, семь, горка.
   Цифра остаётся мелкой подписью — она справка, а не главный канал.

   ПРАВИЛА ФАЙЛА:
   1. Рисуется на канве вкладки (в .desk-ряду это <canvas> в .thing), никакого
      DOM на каждую единицу груза.
   2. Формы детерминированы от ключа ресурса и индекса единицы: раскладка не
      прыгает между открытиями.
   3. Читает G.cargo и держатели, ничего не меняет и не хранит. */

/* сколько предметов рисовать при n единицах: рост со степенью, чтобы сотня
   не превращалась в кашу */
function holdPileN(n){return Math.min(16,Math.max(1,Math.round(Math.pow(n,.72))));}

/* одна фигура ресурса в точке (0,0), размер s. Формы грубые нарочно: это
   вещи на столе, а не иконки — у них есть низ, блик и тень рядом. */
function holdPiece(c,k,s,j){
  const col=RES[k].col;
  c.save();
  c.rotate(((j*137)%40-20)*.006);
  const sh=(a)=>{c.fillStyle="rgba(0,0,0,"+a+")";
    c.beginPath();c.ellipse(0,s*.42,s*.72,s*.2,0,0,TAU);c.fill();};
  if(k==="ice"||k==="icecrys"){
    sh(.30);
    c.fillStyle=col;
    c.beginPath();c.moveTo(-s*.6,s*.3);c.lineTo(-s*.24,-s*.52);c.lineTo(s*.2,-s*.28);
    c.lineTo(s*.62,s*.3);c.closePath();c.fill();
    c.fillStyle="rgba(255,255,255,.5)";
    c.beginPath();c.moveTo(-s*.24,-s*.52);c.lineTo(s*.02,-s*.34);c.lineTo(-s*.2,s*.1);
    c.closePath();c.fill();
  }else if(k==="iron"||k==="titan"||k==="alloy"){
    sh(.32);
    /* слиток: брусок с фаской */
    c.fillStyle=col;
    c.beginPath();c.moveTo(-s*.62,s*.3);c.lineTo(-s*.44,-s*.26);c.lineTo(s*.5,-s*.26);
    c.lineTo(s*.66,s*.3);c.closePath();c.fill();
    c.fillStyle="rgba(255,255,255,.28)";
    c.fillRect(-s*.44,-s*.26,s*.94,s*.1);
    c.fillStyle="rgba(0,0,0,.2)";
    c.fillRect(-s*.55,s*.16,s*1.16,s*.14);
  }else if(k==="silicon"){
    sh(.28);
    c.fillStyle=col;
    c.beginPath();c.ellipse(0,0,s*.52,s*.4,0,0,TAU);c.fill();
    c.fillStyle="rgba(0,0,0,.18)";
    c.beginPath();c.ellipse(s*.1,s*.06,s*.3,s*.2,0,0,TAU);c.fill();
    c.fillStyle="rgba(255,255,255,.35)";
    c.beginPath();c.ellipse(-s*.16,-s*.14,s*.16,s*.09,-.4,0,TAU);c.fill();
  }else if(k==="organics"){
    sh(.26);
    /* тюк, перевязанный крест-накрест */
    c.fillStyle=col;
    c.beginPath();c.ellipse(0,0,s*.55,s*.42,0,0,TAU);c.fill();
    c.strokeStyle="rgba(0,0,0,.35)";c.lineWidth=Math.max(1,s*.07);
    c.beginPath();c.moveTo(-s*.5,0);c.lineTo(s*.5,0);c.stroke();
    c.beginPath();c.moveTo(0,-s*.4);c.lineTo(0,s*.4);c.stroke();
  }else if(k==="crystal"||k==="xeno"){
    sh(.3);
    c.fillStyle=col;
    for(let i=0;i<3;i++){
      const a=(i-1)*.5, l=s*(.6-Math.abs(i-1)*.14);
      c.beginPath();c.moveTo(0,s*.3);
      c.lineTo(Math.sin(a)*s*.3-s*.09,s*.3-l*.55);
      c.lineTo(Math.sin(a)*s*.36,s*.3-l);
      c.lineTo(Math.sin(a)*s*.3+s*.09,s*.3-l*.55);
      c.closePath();c.fill();
    }
    c.fillStyle="rgba(255,255,255,.4)";
    c.beginPath();c.moveTo(0,s*.3);c.lineTo(-s*.04,s*.1);c.lineTo(s*.06,-s*.2);
    c.lineTo(s*.06,s*.24);c.closePath();c.fill();
  }else if(k==="isotopes"){
    sh(.3);
    /* бочонок с маркировкой */
    c.fillStyle="#6a6f78";
    c.beginPath();c.ellipse(0,0,s*.4,s*.46,0,0,TAU);c.fill();
    c.fillStyle=col;
    c.fillRect(-s*.4,-s*.1,s*.8,s*.2);
    c.fillStyle="rgba(0,0,0,.5)";
    c.beginPath();c.arc(0,0,s*.11,0,TAU);c.fill();
  }else if(k==="iridium"){
    sh(.3);
    c.fillStyle=col;
    c.beginPath();c.moveTo(-s*.5,s*.24);c.lineTo(-s*.14,-s*.44);c.lineTo(s*.42,-s*.2);
    c.lineTo(s*.52,s*.24);c.closePath();c.fill();
    c.fillStyle="rgba(255,255,255,.45)";
    c.beginPath();c.moveTo(-s*.14,-s*.44);c.lineTo(s*.1,-s*.3);c.lineTo(-s*.04,-s*.02);
    c.closePath();c.fill();
  }else if(k==="carbon"){
    sh(.26);
    c.fillStyle=col;
    for(let i=0;i<3;i++){
      const hx=((i*53)%3-1)*s*.3,hy=((i*29)%3-1)*s*.14;
      c.beginPath();c.ellipse(hx,hy,s*.26,s*.2,i,0,TAU);c.fill();
    }
    c.fillStyle="rgba(255,255,255,.14)";
    c.beginPath();c.ellipse(-s*.2,-s*.16,s*.1,s*.06,0,0,TAU);c.fill();
  }else if(k==="volatiles"){
    sh(.3);
    /* баллон: стоймя, с вентилем */
    c.fillStyle=col;
    c.beginPath();c.roundRect(-s*.2,-s*.5,s*.4,s*.9,s*.16);c.fill();
    c.fillStyle="rgba(0,0,0,.3)";c.fillRect(-s*.2,-s*.1,s*.4,s*.1);
    c.fillStyle="#8a97a0";c.fillRect(-s*.06,-s*.62,s*.12,s*.14);
    c.fillStyle="rgba(255,255,255,.3)";c.fillRect(-s*.14,-s*.46,s*.08,s*.6);
  }else if(k==="techcomp"){
    sh(.28);
    c.fillStyle="#3a4148";
    c.fillRect(-s*.5,-s*.34,s,s*.64);
    c.fillStyle=col;
    for(let i=0;i<4;i++)c.fillRect(-s*.4+i*s*.24,-s*.22,s*.14,s*.14);
    c.strokeStyle="rgba(255,255,255,.25)";c.lineWidth=1;
    c.strokeRect(-s*.5,-s*.34,s,s*.64);
  }else if(k==="missile"){
    sh(.24);
    c.fillStyle=col;
    c.beginPath();c.roundRect(-s*.62,-s*.12,s*1.1,s*.24,s*.1);c.fill();
    c.fillStyle="#d9dde3";
    c.beginPath();c.moveTo(s*.48,-s*.12);c.lineTo(s*.72,0);c.lineTo(s*.48,s*.12);
    c.closePath();c.fill();
    c.fillStyle="rgba(0,0,0,.3)";
    c.beginPath();c.moveTo(-s*.62,-s*.12);c.lineTo(-s*.78,-s*.22);c.lineTo(-s*.78,s*.22);
    c.lineTo(-s*.62,s*.12);c.closePath();c.fill();
  }else if(k==="folk"){
    /* человек сидит на краю: единственный «груз», который смотрит на тебя */
    c.fillStyle="rgba(0,0,0,.3)";
    c.beginPath();c.ellipse(0,s*.5,s*.4,s*.12,0,0,TAU);c.fill();
    c.fillStyle=col;
    c.beginPath();c.arc(0,-s*.34,s*.17,0,TAU);c.fill();
    c.beginPath();c.roundRect(-s*.2,-s*.2,s*.4,s*.5,s*.1);c.fill();
    c.fillStyle="rgba(0,0,0,.25)";
    c.fillRect(-s*.2,s*.16,s*.4,s*.14);
  }else{
    sh(.28);
    c.fillStyle=col;
    c.beginPath();c.ellipse(0,0,s*.44,s*.34,0,0,TAU);c.fill();
  }
  c.restore();
}

/* куча одного ресурса на канве w×h: предметы лежат внахлёст, дальние выше и
   мельче — та же глубина, что у куртин */
function holdDrawPile(c,k,n,w,h){
  c.clearRect(0,0,w,h);
  const N=holdPileN(n);
  const cx=w*.5, base=h*.66, s=Math.min(w,h)*.42;
  const spots=[];
  for(let i=0;i<N;i++){
    const hh=hashi(i*31,k.length*17+k.charCodeAt(0),0x4D17);
    const row=i<5?0:(i<9?1:(i<13?2:3));
    const inRow=row===0?Math.min(N,5):(row===1?Math.min(N-5,4):(row===2?Math.min(N-9,4):N-13));
    const idx=row===0?i:(row===1?i-5:(row===2?i-9:i-13));
    spots.push({x:cx+(idx-(inRow-1)/2)*s*.82+((hh&15)-8)*.05*s,
                y:base-row*s*.36,
                z:row,j:hh});
  }
  spots.sort((a,b)=>b.z-a.z||a.y-b.y);
  for(const sp of spots){
    c.save();c.translate(sp.x,sp.y);
    const kz=1-sp.z*.12;
    c.scale(kz,kz);
    holdPiece(c,k,s,sp.j);
    c.restore();
  }
}

/* вкладка ТРЮМ на столе: .desk-ряд карточек, в каждой куча и мелкая подпись */
function renderHold(box){
  box.textContent="";
  const st=stat();
  const keys2=RES_KEYS.filter(k=>(G.cargo[k]|0)>0);
  tableRow(box,"head","","ТРЮМ · "+held()+"/"+st.cargoMax+
    (keys2.length?"":" · ПУСТО"));
  if(!keys2.length){
    tableRow(box,"dim","","всё, что добудете и купите, ляжет сюда кучами");
    return;
  }
  for(const k of keys2){
    const n=G.cargo[k]|0;
    const row=document.createElement("div");row.className="thing";
    const cv=document.createElement("canvas");cv.width=250;cv.height=120;
    cv.style.cssText="width:100%;height:auto";
    holdDrawPile(cv.getContext("2d"),k,n,250,120);
    const nm=document.createElement("div");nm.className="nm";
    const R0=RES[k];
    nm.innerHTML="<b>"+R0.ru+" × "+n+"</b><s>"+
      (R0.price?("рынок ~"+R0.price+" кр за единицу"):(R0.rare||R0.ammo||R0.pax||""))+"</s>";
    row.appendChild(cv);row.appendChild(nm);
    box.appendChild(row);
  }
}
