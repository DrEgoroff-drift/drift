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
function drawCantinaRoom(cn,list,sel,hover){
  const c=cn.getContext("2d");
  /* Рисуем в СВОИХ единицах: комната высотой 200, ширина — сколько дала панель.
     Без этого на широком экране зал растягивался в ленту, а люди в нём
     оставались ростом в пятую часть кадра, то есть игрушками. */
  c.clearRect(0,0,cn.width,cn.height);
  const k=cn.height/200, H2=200, W2=cn.width/k;
  c.save();c.scale(k,k);
  const hits=cantRoomBody(c,W2,H2,list,sel,hover);
  c.restore();
  for(const h of hits){h.x*=k;h.y*=k;h.w*=k;h.h*=k;}
  return hits;
}
function cantRoomBody(c,W2,H2,list,sel,hover){
  const S=cantStyle(),seed=(G.sys.seed^0xCA47)>>>0,R=rng(seed);
  const acc=hex2rgb(S.acc);
  const fy=H2-20;                                  // пол
  /* Стойка сидящему по грудь, не по подбородок: при высокой стойке над ней
     торчали одни макушки, и в зале было не разглядеть, кто там сидит. */
  const cy=fy-52;
  /* ── стена и потолок ── */
  const wg=c.createLinearGradient(0,0,0,fy);
  wg.addColorStop(0,rgba(mixc(S.wall,[6,8,12],.55),1));
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
  const shx=16,shw=Math.min(W2*.42,260);
  c.fillStyle="rgba(18,22,30,.9)";c.fillRect(shx,44,shw,cy-52);
  for(let s=0;s<2;s++){
    const sy=58+s*26;
    c.fillStyle="rgba(52,44,36,.95)";c.fillRect(shx,sy,shw,3);
    const RR=rng(seed+s*77);
    for(let x=shx+6;x<shx+shw-8;x+=11+RR()*7){
      const bh=10+RR()*9,hue=[[86,120,96],[130,96,74],[70,96,130],[128,84,110]][(RR()*4)|0];
      c.fillStyle=rgba(hue,.8);c.fillRect(x,sy-bh,5,bh);
      c.fillStyle="rgba(255,255,255,.12)";c.fillRect(x,sy-bh,1.4,bh);
      c.fillStyle="rgba(220,230,240,.25)";c.fillRect(x+1.6,sy-bh-3,1.8,3);
    }
  }
  /* ── реквизит по типу станции ── */
  cantProps(c,S.props,W2,fy,cy,seed,acc);
  /* ── посетители на заднем плане: силуэты, чтобы зал не был пустым ── */
  const back=2+((seed>>3)&1);
  for(let i=0;i<back;i++){
    const bx=W2*(.18+i*.26)+((seed>>(i*3))&15);
    c.globalAlpha=.30;
    cantFigure(c,bx,cy+16,[54,60,72],G.t*.02+i*2.3,null,0);
    c.globalAlpha=1;
  }
  /* ── бармен и кандидаты рисуются ДО стойки ──
     Порядок здесь и есть вся сцена: стойка закрывает сидящим низ, и люди
     оказываются ЗА ней. Пока фигуры рисовались поверх, ноги и табуреты висели
     на передней панели, и зал читался аппликацией. */
  const bmx=W2-Math.min(W2*.16,88);
  cantFigure(c,bmx,cy+16,[96,104,118],G.t*.03,null,0,true);
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
    cantFigure(c,x,fy-40,hex2rgb(R2.col),G.t*.028+i*1.7,mgrFace(m,34),m.ai?1:0);
    hits.push({id:m.id,x:x-26,y:cy-78,w:52,h:86});
  });
  /* ── стойка ── */
  c.fillStyle="rgba(24,28,36,.98)";c.fillRect(0,cy,W2,fy-cy);
  c.fillStyle="rgba(58,46,36,.98)";c.fillRect(0,cy-7,W2,8);        // столешница
  c.fillStyle="rgba(210,190,160,.16)";c.fillRect(0,cy-7,W2,1.6);   // блик по кромке
  c.fillStyle="rgba(0,0,0,.35)";c.fillRect(0,cy+1,W2,2);
  for(let i=0;i<Math.ceil(W2/48);i++){                              // филёнки
    c.fillStyle="rgba(255,255,255,.035)";c.fillRect(i*48+6,cy+8,36,fy-cy-20);
    c.fillStyle="rgba(0,0,0,.22)";c.fillRect(i*48+42,cy+8,2,fy-cy-20);
  }
  c.fillStyle=rgba(mixc([180,196,210],acc,.3),.22);                 // подножка
  c.fillRect(0,fy-9,W2,3);
  const cg=c.createLinearGradient(0,cy,0,fy);                       // свет ложится на переднюю панель сверху
  cg.addColorStop(0,"rgba(255,226,180,.07)");cg.addColorStop(1,"rgba(0,0,0,.35)");
  c.fillStyle=cg;c.fillRect(0,cy+1,W2,fy-cy-1);
  /* ── лампы: полоса и конус на стойку ── */
  const lamps=3;
  for(let i=0;i<lamps;i++){
    const lx=W2*(i+.5)/lamps;
    c.strokeStyle="rgba(120,132,148,.5)";c.lineWidth=1;
    c.beginPath();c.moveTo(lx,10);c.lineTo(lx,26);c.stroke();
    c.fillStyle="rgba(40,46,56,.95)";
    c.beginPath();c.moveTo(lx-11,38);c.lineTo(lx-4,26);c.lineTo(lx+4,26);c.lineTo(lx+11,38);
    c.closePath();c.fill();
    c.fillStyle=rgba(mixc([255,226,180],acc,.35),.9);c.fillRect(lx-9,37,18,2.5);
    const g=c.createLinearGradient(0,38,0,cy);
    g.addColorStop(0,rgba(mixc([255,226,180],acc,.3),.16*S.warm));
    g.addColorStop(1,"rgba(255,226,180,0)");
    c.fillStyle=g;c.beginPath();
    c.moveTo(lx-10,38);c.lineTo(lx+10,38);c.lineTo(lx+46,cy);c.lineTo(lx-46,cy);c.closePath();c.fill();
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
  /* ── воздух: пыль в конусах и виньетка ── */
  c.save();c.globalCompositeOperation="lighter";
  for(let i=0;i<26;i++){
    const RR=rng(seed+i*131),px=RR()*W2;
    const py=((G.t*.12*(0.4+RR())+i*37)%(cy-40))+30;
    c.fillStyle="rgba(255,226,180,"+(.05+RR()*.05).toFixed(3)+")";
    c.beginPath();c.arc(px,py,.8+RR()*1.1,0,TAU);c.fill();
  }
  c.restore();
  const vg=c.createRadialGradient(W2/2,H2/2,H2*.35,W2/2,H2/2,H2*1.05);
  vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,"rgba(0,0,0,.55)");
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
function cantFigure(c,x,fy,col,phase,face,ai,stand){
  const bob=Math.sin(phase)*1.2, sw=Math.sin(phase*1.4);
  const body=rgba(col,.92), dark=rgba(mixc(col,[10,14,20],.55),.95);
  c.save();c.translate(x,fy);
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
