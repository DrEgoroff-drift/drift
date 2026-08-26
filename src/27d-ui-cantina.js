/* ══════════════ кантина: помещение, а не список ══════════════ */
/* Раньше кантина была строчками с портретами. Теперь это комната, нарисованная
   тем же языком, что база и абордаж: стойка, лампы с конусами света, полка
   с бутылками, окно в док, посетители за спиной — и на табуретах те самые
   кандидаты. По человеку тыкают, и под сценой раскрывается его карточка.

   ПРАВИЛА, КОТОРЫМ ПОДЧИНЁН ФАЙЛ:
   1. Голова сидящего — это его настоящий портрет (`mgrFace`), уменьшённый.
      Рисовать второе лицо значило бы, что в списке и в зале сидят разные люди.
   2. Комната своя у каждой станции: палитра, вывеска, что за окном и чем
      заставлены углы, берутся из `stype` и seed системы. Одна кантина на всю
      галактику — то, ради чего всё это и переделывалось.
   3. Масштаб как везде: сидящий человек ~54 px, стойка ему по грудь, лампа
      над головой. Всё остальное меряется этим. */
const CANT_STYLE={
  trade:  {acc:"#f2b25c", wall:[34,32,40], warm:1,   view:"dock",
           sign:"ТОРГОВЫЙ ЗАЛ", props:["plant","crates","lantern"]},
  indust: {acc:"#ff9d7a", wall:[38,34,30], warm:.8,  view:"foundry",
           sign:"СМЕНА КОНЧИЛАСЬ", props:["pipes","barrel","fan"]},
  yard:   {acc:"#8fd08a", wall:[30,36,38], warm:.7,  view:"slip",
           sign:"ДОК · КАНТИНА", props:["gantry","crates","toolboard"]},
  sci:    {acc:"#9fd8ff", wall:[28,34,44], warm:.5,  view:"stars",
           sign:"ТИХИЙ ЗАЛ", props:["holo","plant","books"]},
  outpost:{acc:"#c58ae0", wall:[36,30,32], warm:.9,  view:"dust",
           sign:"ПОСЛЕДНЯЯ", props:["barrel","hazard","lantern"]}
};
function cantStyle(){
  const S=CANT_STYLE[G.st&&G.st.stype]||CANT_STYLE.trade;
  return S;
}
/* ── сцена ── */
function drawCantinaRoom(cn,list,sel,hover,deals){
  const c=cn.getContext("2d");
  /* Рисуем в СВОИХ единицах: комната высотой 200, ширина — сколько дала панель.
     Без этого на широком экране зал растягивался в ленту, а люди в нём
     оставались ростом в пятую часть кадра, то есть игрушками. */
  c.clearRect(0,0,cn.width,cn.height);
  const k=cn.height/200, H2=200, W2=cn.width/k;
  c.save();c.scale(k,k);
  const hits=cantRoomBody(c,W2,H2,list,sel,hover,deals);
  c.restore();
  for(const h of hits){h.x*=k;h.y*=k;h.w*=k;h.h*=k;}
  return hits;
}
function cantRoomBody(c,W2,H2,list,sel,hover,deals){
  const S=cantStyle(),seed=(G.sys.seed^0xCA47)>>>0,R=rng(seed);
  const acc=hex2rgb(S.acc);
  const fy=H2-20;                                  // пол
  /* Стойка сидящему по грудь, не по подбородок: при высокой стойке над ней
     торчали одни макушки, и в зале было не разглядеть, кто там сидит. */
  const cy=fy-52;
  /* ── стена и потолок ── */
  const wg=c.createLinearGradient(0,0,0,fy);
  wg.addColorStop(0,rgba(mixc(S.wall,[6,8,12],.40),1));
  wg.addColorStop(1,rgba(S.wall,1));
  c.fillStyle=wg;c.fillRect(0,0,W2,fy);
  /* обшивка секциями: вертикальные швы и заклёпки — та же стена, что в отсеках */
  for(let i=0;i<Math.ceil(W2/64);i++){
    c.fillStyle="rgba(255,255,255,"+(.012+R()*.016).toFixed(3)+")";
    c.fillRect(i*64,10,60,fy-10);
    c.fillStyle="rgba(0,0,0,.22)";c.fillRect(i*64+60,10,2,fy-10);
    c.fillStyle="rgba(200,214,228,.05)";
    c.fillRect(i*64+8,16,2,2);c.fillRect(i*64+8,fy-14,2,2);
  }
  c.fillStyle="rgba(0,0,0,.35)";c.fillRect(0,0,W2,12);   // потолочный кант
  /* ── окно: у каждой станции своё ── */
  const wx=W2*.56,ww=Math.min(W2*.40,240),wy=26,wh=64;
  c.fillStyle="rgba(6,9,14,.95)";c.fillRect(wx,wy,ww,wh);
  c.save();c.beginPath();c.rect(wx,wy,ww,wh);c.clip();
  cantView(c,S.view,wx,wy,ww,wh,seed,acc);
  c.restore();
  c.strokeStyle="rgba(150,170,190,.35)";c.lineWidth=2;c.strokeRect(wx,wy,ww,wh);
  c.fillStyle="rgba(120,140,160,.25)";
  for(let i=1;i<3;i++)c.fillRect(wx+i*ww/3,wy,2,wh);
  /* ── вывеска ── */
  c.font="10px ui-monospace,monospace";c.textAlign="left";
  const sgw=c.measureText(S.sign).width+16;
  c.fillStyle="rgba(8,12,18,.8)";c.fillRect(14,20,sgw,18);
  c.strokeStyle=rgba(acc,.35);c.lineWidth=1;c.strokeRect(14.5,20.5,sgw-1,17);
  const flick=(Math.sin(G.t*.31+seed%7)>-.92)?1:.35;   // неон подмигивает
  c.fillStyle=rgba(acc,.85*flick);c.fillText(S.sign,22,33);
  c.shadowColor=rgba(acc,.5*flick);c.shadowBlur=10;c.fillText(S.sign,22,33);c.shadowBlur=0;
  /* ── полка с бутылками за стойкой ── */
  /* ── что за стойкой ──
     Стена бутылок стояла всюду, включая научную станцию и аванпост, где ей
     взяться неоткуда. За стойкой стоит то, чем это место торгует: в торговом
     зале и на верфи — бутылки, на комбинате — цеховые фляги в два ряда без
     затей, в научной — колбы и термосы на ровных полках, на аванпосте полки
     нет вовсе: ящики один на другом, потому что мебель сюда не возят. */
  const shx=16,shw=Math.min(W2*.42,260);
  const back=(G.st&&G.st.stype)||"trade";
  c.fillStyle="rgba(18,22,30,.9)";c.fillRect(shx,44,shw,cy-52);
  if(back==="outpost"){
    const RR=rng(seed^0x5C);
    for(let x=shx+4;x<shx+shw-20;x+=26+RR()*10){
      const rows=1+((RR()*3)|0);
      for(let k=0;k<rows;k++){
        const bw2=20+RR()*6,bh2=15+RR()*4,by=cy-12-k*(bh2+2);
        c.fillStyle=rgba([64,58,50],.95);c.fillRect(x,by-bh2,bw2,bh2);
        c.strokeStyle="rgba(0,0,0,.5)";c.lineWidth=1;c.strokeRect(x+.5,by-bh2+.5,bw2-1,bh2-1);
        c.fillStyle="rgba(255,255,255,.07)";c.fillRect(x,by-bh2,bw2,2);
        c.fillStyle=rgba(acc,.25);c.fillRect(x+3,by-bh2*.55,bw2-6,2);   // трафарет
      }
    }
  }else for(let s=0;s<(back==="sci"?3:2);s++){
    const sy=58+s*26;
    c.fillStyle=back==="sci"?"rgba(70,78,90,.95)":"rgba(52,44,36,.95)";
    c.fillRect(shx,sy,shw,3);
    const RR=rng(seed+s*77);
    for(let x=shx+6;x<shx+shw-8;x+=(back==="indust"?9:11)+RR()*7){
      const bh=10+RR()*9;
      if(back==="sci"){                        // колбы и термосы: стекло и сталь
        c.fillStyle="rgba(150,170,190,.5)";c.fillRect(x,sy-bh,5,bh);
        c.fillStyle="rgba(190,230,240,.35)";c.fillRect(x,sy-bh*.45,5,bh*.45);
        c.fillStyle="rgba(230,244,250,.3)";c.fillRect(x,sy-bh,1.3,bh);
      }else if(back==="indust"){               // фляги: одинаковые, цеховые
        c.fillStyle="rgba(96,88,70,.9)";c.fillRect(x,sy-bh*.8,6,bh*.8);
        c.fillStyle="rgba(255,255,255,.1)";c.fillRect(x,sy-bh*.8,1.6,bh*.8);
        c.fillStyle="rgba(30,26,20,.6)";c.fillRect(x,sy-bh*.8,6,1.6);
      }else{
        /* Бутылки были одним прямоугольником в пять пикселей, повторённым сорок
           раз: полка читалась штрихкодом (самокритика M169). Теперь три формы —
           штоф с плечом, пузатая, плоская фляга, — у каждой своё горло, пробка,
           этикетка и блик; и пара стаканов между ними. */
        const hue=[[86,120,96],[130,96,74],[70,96,130],[128,84,110],[150,132,80]][(RR()*5)|0];
        const kind=(RR()*3)|0, bw3=kind===1?7:kind===2?8:5.4;
        c.fillStyle=rgba(hue,.82);
        c.beginPath();
        if(kind===0){                              /* штоф: плечо и высокое горло */
          c.moveTo(x,sy);c.lineTo(x,sy-bh*.62);
          c.lineTo(x+bw3*.3,sy-bh*.78);c.lineTo(x+bw3*.3,sy-bh);
          c.lineTo(x+bw3*.7,sy-bh);c.lineTo(x+bw3*.7,sy-bh*.78);
          c.lineTo(x+bw3,sy-bh*.62);c.lineTo(x+bw3,sy);
        }else if(kind===1){                        /* пузатая */
          c.moveTo(x,sy);
          c.quadraticCurveTo(x-1.4,sy-bh*.5,x+bw3*.32,sy-bh*.72);
          c.lineTo(x+bw3*.32,sy-bh);c.lineTo(x+bw3*.68,sy-bh);
          c.lineTo(x+bw3*.68,sy-bh*.72);
          c.quadraticCurveTo(x+bw3+1.4,sy-bh*.5,x+bw3,sy);
        }else{                                     /* плоская фляга */
          c.moveTo(x,sy);c.lineTo(x,sy-bh*.8);
          c.lineTo(x+bw3*.36,sy-bh*.94);c.lineTo(x+bw3*.64,sy-bh*.94);
          c.lineTo(x+bw3,sy-bh*.8);c.lineTo(x+bw3,sy);
        }
        c.closePath();c.fill();
        c.fillStyle="rgba(255,255,255,.14)";c.fillRect(x+.6,sy-bh*.6,1.2,bh*.55);
        c.fillStyle="rgba(226,214,180,.5)";                            /* этикетка */
        if(bh>13)c.fillRect(x+.8,sy-bh*.42,bw3-1.6,bh*.2);
        c.fillStyle="rgba(30,26,22,.75)";                              /* пробка */
        c.fillRect(x+bw3*.3,sy-bh-2.2,bw3*.4,2.4);
        if(RR()<.16){                                                  /* стакан рядом */
          c.fillStyle="rgba(198,214,222,.35)";
          c.fillRect(x+bw3+2,sy-5,3.6,5);
          c.fillStyle="rgba(226,196,120,.4)";c.fillRect(x+bw3+2,sy-2.4,3.6,2.4);
        }
      }
    }
  }
  /* ── реквизит по типу станции ── */
  cantProps(c,S.props,W2,fy,cy,seed,acc);
  /* ── толпа ──
     Во всех пяти залах стояли одни и те же два-три силуэта: зал был «не
     пустым», но одинаково не пустым везде. Народ — вторая после света примета
     места, и он считается не для красоты: на комбинате смена кончилась и в
     зале не протолкнуться, в научной сидят двое и врозь, на аванпосте — трое,
     и каждый сам по себе. `CROWD` задаёт, сколько их, как плотно они стоят и
     насколько тесно жмутся друг к другу. */
  const CROWD={
    trade:  {n:6, spread:.92, clump:.5},
    indust: {n:9, spread:.96, clump:.85},
    yard:   {n:5, spread:.9,  clump:.6},
    sci:    {n:2, spread:.7,  clump:0},
    outpost:{n:3, spread:1,   clump:0}
  };
  const CR=CROWD[(G.st&&G.st.stype)||"trade"]||CROWD.trade;
  for(let i=0;i<CR.n;i++){
    const RR=rng(seed+i*911);
    /* кучкуются парами, а не выстраиваются по линейке: `clump` сдвигает
       каждого второго вплотную к соседу — так это и выглядит в кабаке */
    const base=W2*(.06+(i/Math.max(1,CR.n-1))*CR.spread*.88);
    const bx=base+((i&1)?-10*CR.clump:0)+RR()*8-4;
    const far=RR()<.45;                       // кто-то стоит дальше и темнее
    c.globalAlpha=far?.30:.52;   // толпа была тенями по .18–.32 и не читалась вовсе (кантина, проход 2)
    cantFigure(c,bx,cy+16+(far?-4:0),far?[46,52,62]:[[96,88,70],[70,84,96],[92,72,74],[76,92,78]][i%4],
               G.t*.02+i*2.3,null,0,false,(hashi(seed,i,0x9051)>>>3)&3);
    c.globalAlpha=1;
  }
  /* ── бармен и кандидаты рисуются ДО стойки ──
     Порядок здесь и есть вся сцена: стойка закрывает сидящим низ, и люди
     оказываются ЗА ней. Пока фигуры рисовались поверх, ноги и табуреты висели
     на передней панели, и зал читался аппликацией. */
  /* Бармен стоит у ПОЛКИ, а не в дальнем углу под окном: там его съедала
     темнота задней стены, и хозяина зала было не найти (самокритика M169) */
  /* Место бармена — САМЫЙ ШИРОКИЙ ПРОСВЕТ у стойки, а не точка на глазок:
     иначе его загораживает то кандидат, то вывеска столика (самокритика M169) */
  let bmx=Math.max(70,W2*.235);
  {
    const st=cantSeats(list.length,W2).concat([W2*.10]).sort((a,b)=>a-b);
    let best=-1;
    for(let i=0;i<=st.length;i++){
      const a=i===0?36:st[i-1], b=i===st.length?W2-40:st[i];
      if(b-a>best){best=b-a;bmx=(a+b)/2;}
    }
    bmx=clamp(bmx,60,W2-60);
  }
  cantBarkeep(c,bmx,cy,fy,acc,seed,back);
  const seats=cantSeats(list.length,W2);
  const hits=[];
  list.forEach((m,i)=>{
    const x=seats[i], on=sel===m.id, hv=hover===m.id;
    const R2=MGR_ROLES[m.role];
    /* нимб за головой вместо рамки вокруг человека: метка не должна
       перечёркивать то, на что смотрят */
    if(on||hv){
      const g2=c.createRadialGradient(x,cy-46,2,x,cy-46,44);
      g2.addColorStop(0,rgba(acc,on?.34:.18));g2.addColorStop(1,rgba(acc,0));
      c.fillStyle=g2;c.beginPath();c.arc(x,cy-46,44,0,TAU);c.fill();
    }
    /* кандидату поза достаётся от его зерна: один и тот же человек сидит
       одинаково, пока сидит в этом зале */
    cantFigure(c,x,fy-40,hex2rgb(R2.col),G.t*.028+i*1.7,mgrFace(m,34),m.ai?1:0,
               false,(m.seed>>>5)&1?1:0);
    hits.push({id:m.id,x:x-26,y:cy-78,w:52,h:86});
  });
  if(typeof storyCantFigures==="function")storyCantFigures(c,W2,fy,cy);   // люди историй — за стойкой, как все (11c)
  /* ── стойка ── */
  /* пол перед стойкой: светлее стены, иначе низ кадра — та же темнота */
  c.fillStyle=rgba(mixc(S.wall,[96,90,82],.45),1);c.fillRect(0,fy,W2,H2-fy);
  c.fillStyle="rgba(0,0,0,.35)";c.fillRect(0,fy,W2,2);
  for(let x=0;x<W2;x+=72){c.fillStyle="rgba(0,0,0,.18)";c.fillRect(x+70,fy+2,2,H2-fy-2);}
  cantCounter(c,W2,fy,cy,back,acc,seed);
  if(typeof storyCantProps==="function")storyCantProps(c,W2,fy,cy);       // их вещи — на столешнице
  /* ── свет ──
     Пять залов отличались вывеской, окном и оттенком акцента — а светили
     одинаково: три лампы через равные промежутки, один и тот же конус. Свет
     и есть главное, чем кабак отличается от кабака: в торговом зале его много
     и он ровный; на комбинате две грязно-жёлтых лампы на весь зал и длинные
     провалы между ними; в научной — холодная сплошная полоса без конусов,
     потому что это не кабак, а комната отдыха; на верфи лампы висят на
     кронштейнах и качаются; на аванпосте лампа одна, и половина зала в темноте.
     `LIGHT` — не украшение, а планировка света: сколько, какого тона, какой
     ширины конус и что творится между лампами. */
  const LIGHT={
    trade:  {n:4, tone:[255,226,180], cone:1,   pow:1,   sway:0},
    indust: {n:2, tone:[255,196,110], cone:1.25,pow:.85, sway:0},
    yard:   {n:3, tone:[214,238,255], cone:.9,  pow:.8,  sway:1},
    sci:    {n:5, tone:[228,244,255], cone:.4,  pow:.7,  sway:0},
    outpost:{n:1, tone:[255,180,120], cone:1.5, pow:.9,  sway:0}
  };
  const LT=LIGHT[(G.st&&G.st.stype)||"trade"]||LIGHT.trade;
  for(let i=0;i<LT.n;i++){
    const sw=LT.sway?Math.sin(G.t*.021+i*2.1)*3:0;   // на верфи лампы качает
    const lx=W2*(i+.5)/LT.n+sw;
    c.strokeStyle="rgba(120,132,148,.5)";c.lineWidth=1;
    c.beginPath();c.moveTo(W2*(i+.5)/LT.n,10);c.lineTo(lx,26);c.stroke();
    c.fillStyle="rgba(40,46,56,.95)";
    c.beginPath();c.moveTo(lx-11,38);c.lineTo(lx-4,26);c.lineTo(lx+4,26);c.lineTo(lx+11,38);
    c.closePath();c.fill();
    c.fillStyle=rgba(mixc(LT.tone,acc,.3),.9);c.fillRect(lx-9,37,18,2.5);
    c.fillStyle=rgba(mixc(LT.tone,acc,.3),.11*LT.pow);                       // пятно света на полу
    c.beginPath();c.ellipse(lx,fy+9,52*LT.cone,6,0,0,TAU);c.fill();
    const g=c.createLinearGradient(0,38,0,cy);
    g.addColorStop(0,rgba(mixc(LT.tone,acc,.25),.17*S.warm*LT.pow));
    g.addColorStop(1,"rgba(255,226,180,0)");
    c.fillStyle=g;c.beginPath();
    const cw=46*LT.cone;
    c.moveTo(lx-10,38);c.lineTo(lx+10,38);c.lineTo(lx+cw,cy);c.lineTo(lx-cw,cy);
    c.closePath();c.fill();
  }
  /* провал между лампами: там, где их мало, темнота обязана быть видимой —
     иначе «две лампы» и «пять ламп» отличаются только числом абажуров */
  if(LT.n<=2){
    const dk=c.createLinearGradient(0,38,0,cy);
    dk.addColorStop(0,"rgba(0,0,0,.42)");dk.addColorStop(1,"rgba(0,0,0,.1)");
    c.fillStyle=dk;
    for(let i=0;i<=LT.n;i++){
      const x0=W2*i/LT.n-W2*.14, x1=W2*i/LT.n+W2*.14;
      c.fillRect(x0,38,x1-x0,cy-38);
    }
  }
  /* ── что стоит на самой стойке: без этого столешница — пустая доска ── */
  const tapx=bmx-46;
  c.fillStyle="rgba(150,164,180,.55)";c.fillRect(tapx,cy-22,4,15);   // колонка розлива
  c.fillRect(tapx-5,cy-9,14,3);
  c.fillStyle="rgba(120,134,150,.5)";c.fillRect(tapx+4,cy-19,7,3);
  const RP=rng(seed^0x77);
  for(let i=0;i<5;i++){                                              // стаканы и бутылка
    const gx=20+RP()*(W2-60);
    if(RP()<.35){
      c.fillStyle="rgba(96,120,96,.7)";c.fillRect(gx,cy-21,5,14);
      c.fillStyle="rgba(220,232,240,.14)";c.fillRect(gx,cy-21,1.4,14);
    }else{
      c.fillStyle="rgba(190,215,225,.16)";c.fillRect(gx,cy-13,7,7);
      c.fillStyle="rgba(230,244,250,.2)";c.fillRect(gx,cy-13,1.4,7);
    }
  }
  /* ── подписи над выбранным ── */
  list.forEach((m,i)=>{
    const x=seats[i], on=sel===m.id, hv=hover===m.id;
    const R2=MGR_ROLES[m.role];
    /* стакан перед каждым — мелочь, из которой и состоит место */
    c.fillStyle="rgba(190,215,225,.20)";c.fillRect(x+15,cy-16,8,10);
    c.fillStyle=rgba(mixc(hex2rgb(R2.col),[220,220,220],.4),.4);c.fillRect(x+15,cy-11,8,5);
    c.fillStyle="rgba(230,244,250,.22)";c.fillRect(x+15,cy-16,1.6,10);
    if(on||hv){
      c.font="9px ui-monospace,monospace";c.textAlign="center";
      const nm=m.name.toUpperCase()+" · "+R2.ru.toUpperCase();
      const tw=c.measureText(nm).width, ty=cy-84;
      c.fillStyle="rgba(6,10,16,.88)";c.fillRect(x-tw/2-6,ty,tw+12,14);
      c.strokeStyle=rgba(acc,.55);c.lineWidth=1;c.strokeRect(x-tw/2-5.5,ty+.5,tw+11,13);
      c.fillStyle=on?"#e8f4f2":"rgba(220,232,240,.75)";
      c.fillText(nm,x,ty+10);
      c.textAlign="left";
    }
  });
  /* столики с делами — на переднем плане, после стойки: подойти к ним можно,
     только пройдя зал, и порядок рисования говорит ровно это */
  for(const h of cantTables(c,W2,fy,cy,deals,sel,hover,acc,seed))hits.push(h);
  /* ── воздух: пыль в конусах и виньетка ── */
  c.save();c.globalCompositeOperation="lighter";
  for(let i=0;i<26;i++){
    const RR=rng(seed+i*131),px=RR()*W2;
    const py=((G.t*.12*(0.4+RR())+i*37)%(cy-40))+30;
    c.fillStyle="rgba(255,226,180,"+(.05+RR()*.05).toFixed(3)+")";
    c.beginPath();c.arc(px,py,.8+RR()*1.1,0,TAU);c.fill();
  }
  c.restore();
  /* ── кинопередвижка (M205) ──
     Зал на один вечер: свет гаснет, на стене полотно, перед нами ряды затылков.
     Рисуется раньше ёлки — ёлка в углу стоит и на сеансе тоже. */
  if(typeof kinoHere==="function"){
    const K9=kinoHere();
    if(K9&&typeof kinoOverlay==="function")kinoOverlay(c,W2,H2,fy,cy,K9,seed);
  }
  /* ── ёлка тридцать первого декабря (M201) ──
     По настоящему календарю, один раз в году. Стоит В УГЛУ ПЕРЕДНЕГО ПЛАНА и
     рисуется последней: поставленная вместе с прочим реквизитом, она уходила
     за стойку и за спины — то есть её не было видно вовсе. Ёлку в зале ставят
     туда, где она никому не мешает и всем видна, и рисовать её надо так же. */
  if(typeof holTreeUp==="function"&&holTreeUp()&&typeof holTree==="function")
    holTree(c,W2*0.93,fy+H2*0.10,fy*0.72,rgba(acc,.5));
  const vg=c.createRadialGradient(W2/2,H2/2,H2*.35,W2/2,H2/2,H2*1.05);
  vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,"rgba(0,0,0,.36)");   // виньетка в .55 топила зал
  c.fillStyle=vg;c.fillRect(0,0,W2,H2);
  return hits;
}
/* места: раскладываются по ширине, но не ближе 84 px друг к другу */
/* Места кучнее середины: разнесённые по краям кандидаты выглядели так, будто
   сидят в разных заведениях, а между ними — пустая стойка. */
function cantSeats(n,W2){
  const out=[],step=Math.min(96,W2/(n+1.6)),c0=W2*.44;
  for(let i=0;i<n;i++)out.push(c0+(i-(n-1)/2)*step);
  return out;
}
/* Сидящий человек. Голова — настоящий портрет управляющего: рисовать второе
   лицо значило бы, что в зале и в списке разные люди. Тело — комбинезон цвета
   его домена: роль читается силуэтом раньше подписи. */
function cantFigure(c,x,fy,col,phase,face,ai,stand,pose){
  const bob=Math.sin(phase)*1.2, sw=Math.sin(phase*1.4);
  const body=rgba(col,.92), dark=rgba(mixc(col,[10,14,20],.55),.95);
  c.save();c.translate(x,fy);
  /* Поза (M169). Все посетители сидели анфас с рукой на стойке — зал читался
     шеренгой. Поза наклоняет корпус и разворачивает фигуру: облокотился,
     ссутулился над стаканом, повернулся к соседу. Мелочь в три пикселя,
     но именно она отличает зал от строя. */
  const P=pose|0;
  if(P===1)c.transform(1,0,-.16,1,0,0);          /* облокотился на стойку */
  else if(P===2)c.transform(1,0,.10,1,0,0);      /* откинулся назад */
  else if(P===3)c.scale(-1,1);                    /* повернулся к соседу */
  if(!stand){                                   // ноги сидящего: бедро и голень
    c.fillStyle=dark;
    c.fillRect(-2,-4,12,5);c.fillRect(7,-1,5,20);
    c.fillRect(-6,-4,10,5);c.fillRect(-6,-1,5,18);
  }
  c.fillStyle=dark;c.fillRect(-10,-30+bob,5,14);  // рука, лежащая на стойке
  c.fillStyle=body;                              // корпус: плечи шире таза
  c.beginPath();
  c.moveTo(-11,-32+bob);c.quadraticCurveTo(0,-37+bob,11,-32+bob);
  c.lineTo(8,-2);c.lineTo(-8,-2);
  c.closePath();c.fill();
  c.strokeStyle="rgba(230,240,250,.20)";c.lineWidth=1;c.stroke();
  c.fillStyle="rgba(0,0,0,.22)";                 // ворот
  c.beginPath();c.moveTo(-6,-33+bob);c.lineTo(0,-27+bob);c.lineTo(6,-33+bob);c.closePath();c.fill();
  c.fillStyle="rgba(0,0,0,.25)";c.fillRect(-8,-16+bob,16,2);      // ремень
  c.strokeStyle=body;c.lineWidth=5;c.lineCap="round";             // рука к стакану
  c.beginPath();c.moveTo(6,-30+bob);c.lineTo(13,-22+sw*1.5);c.stroke();
  c.lineCap="butt";
  if(face){                                                       // голова-портрет
    const hs=face.width||34;
    c.save();
    c.beginPath();c.arc(0,-48+bob,hs*.48,0,TAU);c.clip();
    c.drawImage(face,-hs/2,-48-hs/2+bob,hs,hs);
    c.restore();
    c.strokeStyle=rgba(col,.55);c.lineWidth=1.6;
    c.beginPath();c.arc(0,-48+bob,hs*.48,0,TAU);c.stroke();
    if(ai){                                                       // у ядра свой нимб
      c.strokeStyle="rgba(159,216,255,.5)";c.lineWidth=1;
      c.beginPath();c.arc(0,-48+bob,hs*.62,0,TAU);c.stroke();
    }
  }else{
    c.fillStyle=rgba(mixc(col,[220,226,236],.4),.9);
    c.beginPath();c.arc(0,-44+bob,7,0,TAU);c.fill();
  }
  c.restore();
}
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
