/* ══════════════ кантина: бармен, виды, реквизит, столики, стойка ══════════════
   Отрезано от 27d-ui-cantina 27.08.2026 по шву «люди зала / убранство зала»
   (имя тянет хвост 27d-ui-cantina-…, а не 27da-…: культурная сортировка build.ps1
   ставит 27da- ПЕРЕД 27d-, см. ловушку в CLAUDE.md):
   файл дорос до 46 КБ. Здесь то, что стоит в зале и за стойкой; сам зал,
   сцена и фигуры посетителей остались в 27d. Склейка: 27d объявляет
   drawCantinaRoom и зовёт эти функции только в кадре, порядок безразличен. */
/* ── бармен ──
   Долг из гроссбуха: «бармен, который двигается». До M169 за стойкой стояла
   та же безликая фигура, что в толпе, и зал был помещением без хозяина.
   Теперь у него есть дело, и дело меняется: протирает стойку, наливает,
   отворачивается к полке, стоит облокотившись. Цикл идёт от G.t и от зерна
   зала — в двух кантинах он занят разным в одну и ту же секунду.
   Он рисуется ДО стойки, поэтому виден по грудь: так и стоят за стойкой. */
function cantBarkeep(c,x,cy,fy,acc,seed,back){
  const R=rng((seed^0xBA12)>>>0);
  const skin=[[186,152,120],[142,108,84],[206,178,148],[112,86,68]][Math.floor(R()*4)];
  /* одежда светлее толпы: хозяин зала обязан читаться первым, а не тонуть
     в общей темноте (самокритика M169) */
  const cloth=mixc([124,132,144],acc,.30);
  /* фаза: четыре дела по восемь секунд, порядок свой у каждого зала */
  const T=(G.t*.016+R()*40)%32, act=Math.floor(T/8), t=(T%8)/8;
  const lean=act===3?1.4:0;
  const turn=act===2;                                  /* отвернулся к полке */
  c.save();c.translate(x,cy+10);                       /* за стойкой стоят на помосте */
  /* корпус: плечи шире таза, фартук поверх */
  c.fillStyle=rgba(cloth,.96);
  c.beginPath();
  c.moveTo(-13+lean,-34);c.quadraticCurveTo(0+lean,-40,13+lean,-34);
  c.lineTo(10,-2);c.lineTo(-10,-2);c.closePath();c.fill();
  c.strokeStyle="rgba(230,240,250,.18)";c.lineWidth=1;c.stroke();
  c.fillStyle="rgba(226,222,208,.22)";                 /* фартук */
  c.beginPath();
  c.moveTo(-8+lean*.6,-26);c.lineTo(8+lean*.6,-26);c.lineTo(9,-2);c.lineTo(-9,-2);c.closePath();c.fill();
  c.fillStyle="rgba(0,0,0,.22)";c.fillRect(-9+lean*.6,-16,18,2);
  /* голова: затылок, если отвернулся */
  const hy=-48;
  c.fillStyle=rgba(turn?mixc(skin,[20,22,26],.55):skin,1);
  c.beginPath();c.arc(lean*1.2,hy,7.4,0,TAU);c.fill();
  c.fillStyle="rgba(24,20,18,.85)";                    /* волосы */
  c.beginPath();c.arc(lean*1.2,hy-1.6,7.4,Math.PI*(turn?0:1.05),Math.PI*(turn?2:1.95));c.fill();
  if(!turn){
    c.fillStyle="rgba(20,18,16,.8)";
    c.fillRect(lean*1.2-3.2,hy-1,1.4,1.4);c.fillRect(lean*1.2+1.8,hy-1,1.4,1.4);
  }
  /* руки — по делу */
  c.strokeStyle=rgba(cloth,1);c.lineWidth=4.6;c.lineCap="round";
  if(act===0){                                          /* протирает стойку */
    const sw=Math.sin(t*TAU*3)*11;
    c.beginPath();c.moveTo(7,-30);c.lineTo(10+sw,-14);c.stroke();
    c.beginPath();c.moveTo(-7,-30);c.lineTo(-9,-18);c.stroke();
    c.fillStyle="rgba(214,216,206,.9)";                  /* тряпка */
    c.fillRect(6+sw,-16,9,4);
  }else if(act===1){                                    /* наливает */
    c.beginPath();c.moveTo(7,-30);c.lineTo(14,-24);c.stroke();
    c.beginPath();c.moveTo(-7,-30);c.lineTo(-12,-20);c.stroke();
    c.save();c.translate(15,-26);c.rotate(-.9-t*.5);
    c.fillStyle="rgba(96,132,96,.95)";c.fillRect(0,-3,13,6);
    c.fillStyle="rgba(200,220,200,.5)";c.fillRect(11,-1.4,4,2.4);
    c.restore();
    c.fillStyle="rgba(226,236,240,.55)";                 /* струя */
    c.fillRect(19,-22,1.4,7+t*4);
  }else if(act===2){                                    /* тянется к полке */
    c.beginPath();c.moveTo(6,-32);c.lineTo(9,-46+Math.sin(t*TAU)*3);c.stroke();
    c.beginPath();c.moveTo(-6,-32);c.lineTo(-8,-22);c.stroke();
  }else{                                                /* облокотился, слушает */
    c.beginPath();c.moveTo(7+lean,-30);c.lineTo(15,-16);c.stroke();
    c.beginPath();c.moveTo(-7+lean,-30);c.lineTo(-14,-16);c.stroke();
  }
  c.lineCap="butt";
  c.restore();
  /* на аванпосте бармен и есть хозяин: у него под рукой ружьё у стены */
  if(back==="outpost"){
    c.save();c.translate(x+26,cy+16);
    c.strokeStyle="rgba(60,54,46,.9)";c.lineWidth=2.4;
    c.beginPath();c.moveTo(0,-2);c.lineTo(-4,-34);c.stroke();
    c.fillStyle="rgba(40,36,32,.95)";c.fillRect(-6,-38,5,8);
    c.restore();
  }
}
/* что видно в окне — своё на каждый тип станции */
function cantView(c,kind,x,y,w,h,seed,acc){
  const R=rng(seed^0x5EE);
  if(kind==="stars"||kind==="dust"){
    const g=c.createLinearGradient(0,y,0,y+h);
    g.addColorStop(0,kind==="dust"?"rgba(60,44,40,1)":"rgba(10,14,26,1)");
    g.addColorStop(1,kind==="dust"?"rgba(28,22,22,1)":"rgba(4,6,12,1)");
    c.fillStyle=g;c.fillRect(x,y,w,h);
    for(let i=0;i<40;i++){
      c.fillStyle="rgba(220,232,246,"+(.15+R()*.6).toFixed(2)+")";
      c.fillRect(x+R()*w,y+R()*h,1.2,1.2);
    }
    if(kind==="dust")for(let i=0;i<5;i++){       // пыльные вихри у аванпоста
      c.fillStyle="rgba(150,120,96,.10)";
      c.beginPath();c.ellipse(x+R()*w,y+h*(.5+R()*.5),20+R()*30,5+R()*7,0,0,TAU);c.fill();
    }
    if(kind==="stars"){                          // и планета в углу
      const px=x+w*.72,py=y+h*.62,pr=h*.42;
      c.fillStyle="rgba(70,110,150,.9)";c.beginPath();c.arc(px,py,pr,0,TAU);c.fill();
      c.fillStyle="rgba(0,0,0,.45)";c.beginPath();c.arc(px+pr*.35,py-pr*.2,pr,0,TAU);c.fill();
    }
  }else if(kind==="dock"||kind==="slip"){
    c.fillStyle="rgba(12,18,26,1)";c.fillRect(x,y,w,h);
    /* створ дока: фермы, огни и чужой корабль на приколе */
    c.strokeStyle="rgba(120,140,160,.35)";c.lineWidth=2;
    for(let i=0;i<4;i++){c.beginPath();c.moveTo(x+i*w/4,y);c.lineTo(x+i*w/4+10,y+h);c.stroke();}
    c.fillStyle="rgba(40,50,64,.95)";
    c.fillRect(x+w*.18,y+h*.42,w*.5,h*.26);
    c.fillStyle="rgba(56,68,84,.95)";
    c.beginPath();c.moveTo(x+w*.68,y+h*.42);c.lineTo(x+w*.86,y+h*.55);
    c.lineTo(x+w*.68,y+h*.68);c.closePath();c.fill();
    for(let i=0;i<6;i++){
      const on=((G.t*.1|0)%6)===i;
      c.fillStyle=on?rgba(acc,.9):rgba(acc,.25);
      c.beginPath();c.arc(x+8+i*(w-16)/5,y+h-7,2,0,TAU);c.fill();
    }
    if(kind==="slip"){                            // на верфи — искры сварки
      const fl=Math.sin(G.t*.7)>.4;
      if(fl){
        c.fillStyle="rgba(200,235,255,.85)";
        c.beginPath();c.arc(x+w*.36,y+h*.5,3,0,TAU);c.fill();
        c.fillStyle="rgba(160,210,255,.25)";
        c.beginPath();c.arc(x+w*.36,y+h*.5,12,0,TAU);c.fill();
      }
    }
  }else{                                          // foundry: жар за стеклом
    const g=c.createLinearGradient(0,y,0,y+h);
    g.addColorStop(0,"rgba(40,26,20,1)");g.addColorStop(1,"rgba(96,40,16,1)");
    c.fillStyle=g;c.fillRect(x,y,w,h);
    for(let i=0;i<3;i++){
      const gx=x+w*(.2+i*.3),gh=h*(.3+((seed>>i)&3)*.12);
      c.fillStyle="rgba(20,14,12,.9)";c.fillRect(gx-14,y+h-gh,28,gh);
      const fg=c.createLinearGradient(0,y+h-gh,0,y+h);
      fg.addColorStop(0,"rgba(255,200,110,"+(.3+Math.abs(Math.sin(G.t*.05+i))*.4).toFixed(2)+")");
      fg.addColorStop(1,"rgba(255,110,40,.15)");
      c.fillStyle=fg;c.fillRect(gx-11,y+h-gh+3,22,gh-3);
    }
  }
}
/* углы зала: по два-три предмета на станцию, дальше повторяться нельзя */
function cantProps(c,props,W2,fy,cy,seed,acc){
  const R=rng(seed^0x9A1);
  for(const p of props){
    const x=20+R()*(W2-90);
    if(p==="plant"){
      c.fillStyle="rgba(58,46,38,.95)";c.fillRect(x-9,fy-16,18,16);
      for(let i=0;i<6;i++){
        const a=-Math.PI/2+(i-2.5)*.34;
        c.strokeStyle="rgba("+(i%2?"74,124,78":"92,148,90")+",.8)";c.lineWidth=i%2?1.4:2;
        c.beginPath();c.moveTo(x,fy-16);
        c.quadraticCurveTo(x+Math.cos(a)*8,fy-26,x+Math.cos(a)*15,fy-30-((i*7)%9));c.stroke();
      }
    }else if(p==="crates"){
      for(let i=0;i<3;i++){
        const w2=20+((i*13)%9);
        c.fillStyle="rgba(52,46,38,.96)";c.fillRect(x+i*22,fy-16-((i%2)*14),w2,16);
        c.strokeStyle="rgba(0,0,0,.5)";c.lineWidth=1;
        c.strokeRect(x+i*22+.5,fy-15.5-((i%2)*14),w2-1,15);
        c.fillStyle=rgba(acc,.25);c.fillRect(x+i*22+3,fy-13-((i%2)*14),8,3);
      }
    }else if(p==="barrel"){
      c.fillStyle="rgba(46,54,48,.96)";c.fillRect(x,fy-24,17,24);
      c.strokeStyle="rgba(160,180,196,.2)";c.lineWidth=1;
      c.beginPath();c.moveTo(x,fy-18);c.lineTo(x+17,fy-18);
      c.moveTo(x,fy-8);c.lineTo(x+17,fy-8);c.stroke();
    }else if(p==="pipes"){
      c.strokeStyle="rgba(90,100,112,.7)";c.lineWidth=6;
      c.beginPath();c.moveTo(x-20,14);c.lineTo(x+40,14);c.lineTo(x+52,30);c.stroke();
      c.strokeStyle="rgba(255,255,255,.07)";c.lineWidth=1.4;
      c.beginPath();c.moveTo(x-20,12);c.lineTo(x+40,12);c.stroke();
    }else if(p==="fan"){
      c.strokeStyle="rgba(120,134,150,.5)";c.lineWidth=1.4;
      c.beginPath();c.arc(x,26,11,0,TAU);c.stroke();
      for(let i=0;i<3;i++){
        const a=G.t*.12+i*TAU/3;
        c.beginPath();c.moveTo(x,26);c.lineTo(x+Math.cos(a)*10,26+Math.sin(a)*10);c.stroke();
      }
    }else if(p==="gantry"){
      c.fillStyle="rgba(46,54,64,.9)";c.fillRect(x,14,7,cy-30);
      c.fillRect(x-14,14,40,6);
    }else if(p==="toolboard"){
      c.fillStyle="rgba(26,32,40,.95)";c.fillRect(x,44,44,26);
      c.strokeStyle="rgba(150,168,186,.35)";c.lineWidth=1.4;
      for(let i=0;i<4;i++){
        c.beginPath();c.moveTo(x+7+i*10,48);c.lineTo(x+7+i*10,62+((i*5)%7));c.stroke();
      }
    }else if(p==="holo"){
      c.save();c.globalCompositeOperation="lighter";
      const hx=x+14,hy=cy-40;
      const g=c.createLinearGradient(0,hy+18,0,hy-14);
      g.addColorStop(0,"rgba(159,216,255,.16)");g.addColorStop(1,"rgba(159,216,255,0)");
      c.fillStyle=g;c.beginPath();
      c.moveTo(hx-4,hy+18);c.lineTo(hx+4,hy+18);c.lineTo(hx+16,hy-12);c.lineTo(hx-16,hy-12);
      c.closePath();c.fill();
      c.strokeStyle="rgba(159,216,255,.5)";c.lineWidth=1;
      for(let i=0;i<3;i++){
        const rr=10-i*2.6,sq=Math.abs(Math.cos(G.t*.02+i));
        c.beginPath();c.ellipse(hx,hy-i*3,rr,rr*(.25+sq*.5),0,0,TAU);c.stroke();
      }
      c.restore();
    }else if(p==="books"){
      for(let i=0;i<7;i++){
        c.fillStyle="rgba("+(60+i*6)+","+(56+i*4)+","+(70-i*3)+",.95)";
        c.fillRect(x+i*5,48-((i*3)%7),4,18+((i*3)%7));
      }
    }else if(p==="lantern"){
      const fl=.6+Math.sin(G.t*.09+seed)*.2;
      c.strokeStyle="rgba(110,124,140,.6)";c.lineWidth=1;
      c.beginPath();c.moveTo(x,12);c.lineTo(x,30);c.stroke();
      c.fillStyle="rgba(255,190,120,"+(.7*fl).toFixed(2)+")";
      c.beginPath();c.arc(x,34,5,0,TAU);c.fill();
      c.fillStyle="rgba(255,190,120,.12)";
      c.beginPath();c.arc(x,34,16,0,TAU);c.fill();
    }else if(p==="hazard"){
      c.save();c.beginPath();c.rect(x,fy-8,54,8);c.clip();
      c.fillStyle="rgba(24,20,14,.8)";c.fillRect(x,fy-8,54,8);
      c.strokeStyle=rgba(acc,.4);c.lineWidth=3;
      for(let i=-8;i<54;i+=8){c.beginPath();c.moveTo(x+i,fy);c.lineTo(x+i+8,fy-8);c.stroke();}
      c.restore();
    }
  }
}
/* ── столики с делами ──
   За стойкой сидят те, кого нанимают; за столиками — те, у кого своё дело
   (`27g-deals`). Разные люди должны и располагаться по-разному: наём — у стойки
   лицом к бармену, дело — в глубине зала, за отдельным столом, куда подходят
   поговорить. Столик рисуется ПОСЛЕ стойки и ближе к нижней кромке: он на
   переднем плане, и это единственное, что отделяет его от «зала за спиной».  */
function cantTables(c,W2,fy,cy,deals,sel,hover,acc,seed){
  const hits=[];
  if(!deals||!deals.length)return hits;
  const n=Math.min(3,deals.length);
  for(let i=0;i<n;i++){
    const d=deals[i],id="deal:"+d.key;
    const on=sel===id,hv=hover===id;
    /* столики стоят на переднем плане слева направо, но не под стойкой */
    /* столики подняты над нижней кромкой и разнесены шире: у самого низа
       у сидящих обрезало плечи, а метки налезали на стойку */
    const x=W2*(.14+i*.34)+((seed>>(i*4))&9);
    const y=fy-10;
    const R=rng(hashi(d.seed||1,i*97,0x7AB));
    /* тень и ножка: стол должен стоять, а не висеть */
    c.fillStyle="rgba(0,0,0,.4)";
    c.beginPath();c.ellipse(x,y+3,26,5,0,0,TAU);c.fill();
    if(on||hv){
      const g2=c.createRadialGradient(x,y-34,2,x,y-34,54);
      g2.addColorStop(0,rgba(acc,on?.30:.16));g2.addColorStop(1,rgba(acc,0));
      c.fillStyle=g2;c.beginPath();c.arc(x,y-34,54,0,TAU);c.fill();
    }
    /* человек сидит ЗА столом: рисуется первым, стол перекроет ему низ */
    /* за столиком сидят в тени зала: тон темнее, чем у стойки, — иначе это
       читается как ещё один кандидат на найм */
    cantFigure(c,x,y-10,[92,84,76],G.t*.022+i*1.9,null,0);
    c.fillStyle="rgba(38,32,26,.98)";                 // ножка
    c.fillRect(x-3,y-14,6,14);
    c.fillStyle="rgba(58,46,36,.99)";                 // столешница
    c.beginPath();c.ellipse(x,y-15,24,7,0,0,TAU);c.fill();
    c.fillStyle="rgba(210,190,160,.18)";
    c.beginPath();c.ellipse(x,y-16.4,24,7,0,0,TAU);c.fill();
    /* что на столе: кружка и то, ради чего пришли, — бумага, ящик или колода */
    c.fillStyle="rgba(190,215,225,.22)";c.fillRect(x+8,y-24,7,9);
    c.fillStyle="rgba(230,244,250,.22)";c.fillRect(x+8,y-24,1.4,9);
    if(R()<.5){                                        // бумаги
      c.fillStyle="rgba(226,220,200,.7)";
      c.save();c.translate(x-9,y-19);c.rotate(-.2);c.fillRect(-7,-4,14,8);c.restore();
    }else{                                             // ящик
      c.fillStyle="rgba(70,62,52,.95)";c.fillRect(x-16,y-25,13,10);
      c.fillStyle="rgba(255,255,255,.07)";c.fillRect(x-16,y-25,13,1.6);
    }
    /* метка над столиком: у дела есть имя, и его видно из зала */
    c.font="8px ui-monospace,monospace";c.textAlign="center";
    const lab=d.def.ru.toUpperCase();
    const tw=c.measureText(lab).width;
    const ly=y-58;
    c.fillStyle="rgba(6,10,16,.85)";c.fillRect(x-tw/2-5,ly-9,tw+10,13);
    c.strokeStyle=rgba(acc,on?.8:.45);c.lineWidth=1;
    c.strokeRect(x-tw/2-4.5,ly-8.5,tw+9,12);
    c.fillStyle=on?"#e8f4f2":"rgba(226,214,190,.85)";
    c.fillText(lab,x,ly);
    c.textAlign="left";
    hits.push({id,x:x-30,y:y-60,w:60,h:62});
  }
  return hits;
}

/* ── стойка по типу станции ──
   Одна и та же филёнчатая стойка во всю ширину стояла в пяти залах (долг
   «cantina» в PLAN). Стойка — это то, на что человек опирается локтем, и по
   ней зал опознаётся не хуже вывески: в торговом зале дерево с латунным
   поручнем и закруглённым торцом; на комбинате стальной лист с заклёпками и
   рифлёнкой, короче зала — слева стоит бочка; на верфи верстак с ящиками и
   тисками на торце; в научной — стекло с холодной подсветкой и тонкая
   столешница; на аванпосте доски на двух бочках, с просветами. */
function cantCounter(c,W2,fy,cy,back,acc,seed){
  const R=rng(seed^0xC0A7);
  const h=fy-cy;
  let x0=0,x1=W2;
  if(back==="indust"){x0=54;}
  if(back==="outpost"){x0=36;x1=W2-30;}
  /* длина стойки — от семени зала (хвост M55): в одном зале она во всю
     стену, в другом на две трети, и конец её отступает от окна */
  {const cut=Math.floor(R()*3)*36;if(back==="trade"||back==="sci")x1-=cut;else x0+=Math.round(cut*.5);}
  /* корпус */
  const body={trade:"rgba(24,28,36,.98)",indust:"rgba(44,48,54,.98)",yard:"rgba(40,36,30,.98)",
    sci:"rgba(18,26,36,.98)",outpost:"rgba(20,18,16,.98)"}[back]||"rgba(24,28,36,.98)";
  c.fillStyle=body;
  if(back==="trade"){
    c.beginPath();c.moveTo(x0,cy);c.lineTo(x1-26,cy);c.quadraticCurveTo(x1,cy,x1,cy+26);
    c.lineTo(x1,fy);c.lineTo(x0,fy);c.closePath();c.fill();
  }else if(back==="outpost"){
    /* две бочки и настил сверху */
    for(const bx of [x0+30,x1-60]){
      c.fillStyle="rgba(58,52,44,.98)";c.fillRect(bx,cy+6,34,h-6);
      c.fillStyle="rgba(0,0,0,.35)";c.fillRect(bx,cy+6,34,2);c.fillRect(bx,cy+h*.55,34,2);
      c.fillStyle="rgba(140,130,110,.25)";c.fillRect(bx+3,cy+6,2,h-6);
    }
    c.fillStyle=body;c.fillRect(x0,cy,x1-x0,9);
  }else c.fillRect(x0,cy,x1-x0,h);
  /* столешница */
  const top={trade:"rgba(58,46,36,.98)",indust:"rgba(86,90,96,.98)",yard:"rgba(96,80,58,.98)",
    sci:"rgba(150,176,196,.55)",outpost:"rgba(84,70,50,.98)"}[back]||"rgba(58,46,36,.98)";
  c.fillStyle=top;c.fillRect(x0,cy-7,x1-x0,8);
  c.fillStyle="rgba(230,220,200,.18)";c.fillRect(x0,cy-7,x1-x0,1.6);      // блик по кромке
  c.fillStyle="rgba(0,0,0,.35)";c.fillRect(x0,cy+1,x1-x0,2);
  if(back==="trade"){
    for(let i=0;i<Math.ceil((x1-x0)/48);i++){                                // филёнки
      c.fillStyle="rgba(255,255,255,.035)";c.fillRect(x0+i*48+6,cy+8,36,h-20);
      c.fillStyle="rgba(0,0,0,.22)";c.fillRect(x0+i*48+42,cy+8,2,h-20);
    }
    c.fillStyle="rgba(214,176,96,.55)";c.fillRect(x0,cy-11,x1-x0-30,2.2);   // латунный поручень
    c.fillStyle="rgba(255,236,180,.25)";c.fillRect(x0,cy-11,x1-x0-30,.8);
    for(let x=x0+40;x<x1-40;x+=120){c.fillStyle="rgba(214,176,96,.6)";c.fillRect(x,cy-11,2,5);}
  }else if(back==="indust"){
    for(let y=cy+10;y<fy-12;y+=7)for(let x=x0+4;x<x1-4;x+=7){              // рифлёнка
      c.fillStyle="rgba(255,255,255,.045)";c.fillRect(x+((y/7|0)%2)*3,y,2.4,1.2);}
    c.fillStyle="rgba(180,190,200,.35)";
    for(let x=x0+8;x<x1-6;x+=22){c.fillRect(x,cy+6,2,2);c.fillRect(x,fy-16,2,2);}   // заклёпки
    c.fillStyle="rgba(0,0,0,.4)";c.fillRect(x0,cy,2,h);
    /* бочка слева, где стойки нет */
    c.fillStyle="rgba(70,62,52,.98)";c.fillRect(8,cy+4,38,h-4);
    c.fillStyle="rgba(0,0,0,.35)";c.fillRect(8,cy+4,38,2);c.fillRect(8,cy+h*.5,38,2);
    c.fillStyle=rgba(acc,.3);c.fillRect(12,cy+h*.3,30,3);
  }else if(back==="yard"){
    for(let x=x0+10;x<x1-70;x+=56){                                        // ящики верстака
      c.fillStyle="rgba(52,46,38,.98)";c.fillRect(x,cy+10,46,h*.36);c.fillRect(x,cy+12+h*.36,46,h*.36);
      c.fillStyle="rgba(180,170,150,.4)";c.fillRect(x+17,cy+10+h*.18,12,2);c.fillRect(x+17,cy+12+h*.54,12,2);
      c.fillStyle="rgba(0,0,0,.3)";c.fillRect(x,cy+10,46,1.2);
    }
    /* тиски на торце */
    c.fillStyle="rgba(120,126,134,.95)";c.fillRect(x1-40,cy-16,22,10);c.fillRect(x1-34,cy-22,4,6);
    c.fillStyle="rgba(0,0,0,.4)";c.fillRect(x1-40,cy-8,22,2);
    c.fillStyle="rgba(200,206,214,.4)";c.fillRect(x1-40,cy-16,22,1.2);
  }else if(back==="sci"){
    const g=c.createLinearGradient(0,cy+4,0,fy);                           // стекло с подсветкой
    g.addColorStop(0,rgba(mixc([150,200,240],acc,.4),.26));g.addColorStop(1,"rgba(60,90,120,.05)");
    c.fillStyle=g;c.fillRect(x0,cy+4,x1-x0,h-12);
    c.fillStyle="rgba(200,230,250,.12)";
    for(let x=x0;x<x1;x+=90)c.fillRect(x,cy+4,1,h-12);
    c.fillStyle="rgba(20,28,40,.98)";c.fillRect(x0,cy-7,x1-x0,3);       // тонкая столешница
  }else if(back==="outpost"){
    for(let x=x0;x<x1;x+=34){                                              // доски настила с просветами
      c.fillStyle="rgba("+(80+R()*20|0)+","+(66+R()*16|0)+",46,.98)";c.fillRect(x,cy-7,30,9);
      c.fillStyle="rgba(0,0,0,.45)";c.fillRect(x+30,cy-7,4,9);
    }
  }
  /* подножка и свет сверху на переднюю панель — у всех, кроме аванпоста */
  if(back!=="outpost"){
    c.fillStyle=rgba(mixc([180,196,210],acc,.3),.22);c.fillRect(x0,fy-9,x1-x0,3);
    const cg=c.createLinearGradient(0,cy,0,fy);
    cg.addColorStop(0,"rgba(255,226,180,.07)");cg.addColorStop(1,"rgba(0,0,0,.35)");
    c.fillStyle=cg;c.fillRect(x0,cy+1,x1-x0,h-1);
  }
}
