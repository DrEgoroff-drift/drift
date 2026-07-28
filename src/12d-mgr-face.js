/* ══════════════ портреты управляющих ══════════════ */
/* Ни одной заготовленной картинки: лицо собирается из seed теми же hashi/rng, что
   и всё остальное в игре. На десятом управляющем нарисованные портреты начали бы
   повторяться, а процедурные — нет.

   Портрет здесь не украшение, а интерфейс. По нему читаются четыре вещи, ради
   которых не нужно открывать лист: роль (цвет фона и ворот), уровень (нашивки),
   настроение (брови и рот от лояльности) и часть черт — клеймо каторги видно,
   импланты означают, что человек уживается с машиной. */
const FACE_SKIN=["#e8c39a","#d6a97c","#b98254","#8c5a38","#f0d8bd","#c9a184",
                 "#6f4a33","#a8b2a0","#93a7b8","#d9d2c6"];
const FACE_HAIR=["#2a2320","#453026","#6b4a2c","#a87c48","#d8cbb4","#8f9aa5",
                 "#3d4550","#5a2f2a","#1b1b1f","#c0c6cc"];
const FACE_EYE =["#3b5a6b","#5a7a4a","#7a5a3a","#2f2f38","#8a6a2a","#4a3a5a"];
const FACE_ROLE_BG={cmd:"#3a2018",keep:"#17281c",fact:"#332612",sci:"#141f33"};
function faceRnd(m,salt){return rng(hashi(m.seed,salt,0xFACE));}
/* Череп строится точками с сидовым разбросом — тем же приёмом, что и корпуса
   кораблей: форма не повторяется точно, но всегда остаётся лицом. */
function facePath(c,r,cx,cy,w,h){
  const jaw=.55+r()*.45, brow=.75+r()*.3, chin=.5+r()*.6;
  c.beginPath();
  c.moveTo(cx,cy-h*brow);
  c.bezierCurveTo(cx+w*brow,cy-h*.85,cx+w,cy-h*.1,cx+w*jaw,cy+h*.45);
  c.bezierCurveTo(cx+w*jaw*.7,cy+h*.9*chin,cx,cy+h*chin,cx,cy+h*chin);
  c.bezierCurveTo(cx,cy+h*chin,cx-w*jaw*.7,cy+h*.9*chin,cx-w*jaw,cy+h*.45);
  c.bezierCurveTo(cx-w,cy-h*.1,cx-w*brow,cy-h*.85,cx,cy-h*brow);
  c.closePath();
}
function mgrFace(m,size){
  const key=size+":"+Math.round((m.loy||55)/12)+":"+mgrLevel(m);
  if(m._face&&m._faceKey===key)return m._face;
  const S=size,cn=document.createElement("canvas");
  cn.width=S;cn.height=S;
  const c=cn.getContext("2d");
  const r=faceRnd(m,1);
  const R=MGR_ROLES[m.role];
  /* габарит головы тоже от seed: без этого все лица одного размера и на витрине
     кантины читаются как один человек в разных париках */
  const rg=faceRnd(m,3);
  const cx=S*.5,cy=S*(.5+rg()*.08),w=S*(.23+rg()*.08),h=S*(.3+rg()*.09);
  /* 1. фон — роль цветом, шум от seed */
  c.fillStyle=FACE_ROLE_BG[m.role]||"#151a22";
  c.fillRect(0,0,S,S);
  const g=c.createRadialGradient(cx,cy-S*.1,S*.05,cx,cy,S*.75);
  g.addColorStop(0,"rgba(255,255,255,.14)");g.addColorStop(1,"rgba(0,0,0,.55)");
  c.fillStyle=g;c.fillRect(0,0,S,S);
  for(let i=0;i<S*1.2;i++){
    c.fillStyle="rgba(255,255,255,"+(r()*.05).toFixed(3)+")";
    c.fillRect(Math.floor(r()*S),Math.floor(r()*S),1,1);
  }
  /* 2. плечи — комплекция */
  const build=.7+r()*.7;
  c.fillStyle="rgba(10,14,18,.9)";
  c.beginPath();
  c.moveTo(cx-w*2.1*build,S);
  c.quadraticCurveTo(cx-w*1.1*build,S*.72,cx,S*.72);
  c.quadraticCurveTo(cx+w*1.1*build,S*.72,cx+w*2.1*build,S);
  c.closePath();c.fill();
  /* 3. причёска задним планом.
     Раньше она рисовалась поверх готового лица — и капюшон честно закрывал глаза.
     Объём идёт под череп, вперёд выходит только чёлка (ниже). */
  const hair=FACE_HAIR[Math.floor(r()*FACE_HAIR.length)];
  const style=Math.floor(r()*7);
  c.fillStyle=hair;
  if(style===1){                                   // хвост
    c.beginPath();c.ellipse(cx,cy-h*.5,w*1.05,h*.62,0,0,TAU);c.fill();
    c.beginPath();c.ellipse(cx+w*1.0,cy-h*.05,w*.22,h*.45,0,0,TAU);c.fill();
  }else if(style===2){                             // каре
    c.beginPath();c.ellipse(cx,cy-h*.2,w*1.22,h*.95,0,0,TAU);c.fill();
  }else if(style===3){                             // дреды
    for(let i=0;i<9;i++){
      const a=Math.PI+i/8*Math.PI;
      c.beginPath();
      c.ellipse(cx+Math.cos(a)*w*.95,cy-h*.45+Math.sin(a)*h*.3,S*.024,h*.42,a,0,TAU);
      c.fill();
    }
  }else if(style===4){                             // капюшон
    c.fillStyle="rgba(24,30,36,.98)";
    c.beginPath();c.ellipse(cx,cy-h*.18,w*1.42,h*1.1,0,0,TAU);c.fill();
  }else if(style===5){                             // шлем-нейролинк
    c.fillStyle="#333c46";
    c.beginPath();c.ellipse(cx,cy-h*.32,w*1.18,h*.86,0,0,TAU);c.fill();
    c.fillStyle=R.col;c.fillRect(cx-w*1.18,cy-h*.72,w*2.36,S*.014);
  }else if(style===6){                             // короткая стрижка
    c.beginPath();c.ellipse(cx,cy-h*.3,w*1.06,h*.82,0,0,TAU);c.fill();
  }
  /* 4. череп и кожа */
  const skin=FACE_SKIN[Math.floor(r()*FACE_SKIN.length)];
  const rr=faceRnd(m,7);
  facePath(c,rr,cx,cy,w,h);
  c.fillStyle=skin;c.fill();
  c.save();c.clip();
  /* лёгкая светотень: без неё лицо читается как наклейка */
  const sg=c.createLinearGradient(cx-w,cy-h,cx+w,cy+h);
  sg.addColorStop(0,"rgba(255,255,255,.16)");sg.addColorStop(1,"rgba(0,0,0,.4)");
  c.fillStyle=sg;c.fillRect(cx-w*1.5,cy-h*1.5,w*3,h*3);
  /* 7. метки — шрам, тату, клеймо каторги */
  const marks=Math.floor(r()*3);
  for(let i=0;i<marks;i++){
    const t=r();
    if(t<.4){                                   // шрам
      c.strokeStyle="rgba(120,50,40,.7)";c.lineWidth=Math.max(1,S*.012);
      const x=cx+(r()-.5)*w*1.2,y=cy+(r()-.5)*h;
      c.beginPath();c.moveTo(x,y);c.lineTo(x+(r()-.5)*w*.5,y+h*.25);c.stroke();
    }else if(t<.75){                            // тату гильдии
      c.fillStyle="rgba(40,90,110,.45)";
      c.beginPath();c.arc(cx-w*.6,cy-h*.1,S*.045,0,TAU);c.fill();
    }else if(mgrHas(m,"pirate")){               // клеймо: честно предупреждает
      c.fillStyle="rgba(180,60,40,.5)";
      c.fillRect(cx+w*.35,cy-h*.35,S*.06,S*.055);
    }
  }
  c.restore();
  facePath(c,faceRnd(m,7),cx,cy,w,h);
  c.strokeStyle="rgba(0,0,0,.45)";c.lineWidth=Math.max(1,S*.008);c.stroke();
  /* 6. глаза — форма, цвет, импланты; мрачность от лояльности */
  const loy=clamp((m.loy==null?55:m.loy)/100,0,1);
  const eyeY=cy-h*.12,eyeX=w*.42,eyeR=S*.035*(.8+r()*.5);
  /* импланты редки намеренно: они означают «этот уживается с машиной», а признак,
     который есть у половины, ничего не означает */
  const impl=r()<.1?2:(r()<.14?1:0);            // 0 нет, 1 один глаз, 2 оба
  m._impl=impl;
  const eyeCol=FACE_EYE[Math.floor(r()*FACE_EYE.length)];
  for(let s=-1;s<=1;s+=2){
    const ex=cx+s*eyeX;
    const machine=impl===2||(impl===1&&s<0);
    c.fillStyle=machine?"#101418":"#f2ece2";
    c.beginPath();c.ellipse(ex,eyeY,eyeR*1.5,eyeR*(machine?.8:1),0,0,TAU);c.fill();
    c.fillStyle=machine?"#ff9d5a":eyeCol;
    c.beginPath();c.arc(ex,eyeY,eyeR*(machine?.5:.72),0,TAU);c.fill();
    if(machine){
      c.strokeStyle="rgba(255,157,90,.7)";c.lineWidth=Math.max(1,S*.008);
      c.beginPath();c.arc(ex,eyeY,eyeR*1.15,0,TAU);c.stroke();
    }
    /* брови: чем ниже лояльность, тем ближе к переносице */
    c.strokeStyle="rgba(0,0,0,.55)";c.lineWidth=Math.max(1,S*.016);
    c.beginPath();
    c.moveTo(ex-s*eyeR*1.6,eyeY-eyeR*(1.9-(1-loy)*.9));
    c.lineTo(ex+s*eyeR*1.6,eyeY-eyeR*(1.9+(1-loy)*.6));
    c.stroke();
  }
  /* нос: одна линия, но без неё лицо плоское */
  c.strokeStyle="rgba(0,0,0,.28)";c.lineWidth=Math.max(1,S*.01);
  c.beginPath();
  c.moveTo(cx-w*.05,cy-h*.02);
  c.quadraticCurveTo(cx-w*.16,cy+h*.2,cx+w*.06,cy+h*.2);
  c.stroke();
  /* рот: уголки вниз, когда человек мрачнеет */
  c.strokeStyle="rgba(60,30,25,.7)";c.lineWidth=Math.max(1,S*.012);
  c.beginPath();
  c.moveTo(cx-w*.28,cy+h*.42);
  c.quadraticCurveTo(cx,cy+h*.42+(loy-.55)*S*.09,cx+w*.28,cy+h*.42);
  c.stroke();
  /* 5. чёлка: единственное, что выходит перед лицом. Ниже бровей не опускается —
     иначе портрет перестаёт работать как индикатор настроения. */
  c.fillStyle=style===4?"rgba(24,30,36,.98)":(style===5?"#333c46":hair);
  if(style===0){                                 // бритая: только тень над лбом
    c.globalAlpha=.3;
    c.beginPath();c.ellipse(cx,cy-h*.55,w*.85,h*.22,0,Math.PI,TAU);c.fill();
    c.globalAlpha=1;
  }else{
    c.beginPath();
    c.moveTo(cx-w*.95,cy-h*.42);
    c.quadraticCurveTo(cx-w*.3,cy-h*(style===2?.18:.32),cx+w*.5,cy-h*.4);
    c.quadraticCurveTo(cx+w*.85,cy-h*.52,cx+w*.95,cy-h*.46);
    c.lineTo(cx+w*.95,cy-h*.8);c.lineTo(cx-w*.95,cy-h*.8);
    c.closePath();c.fill();
  }
  /* борода — ещё одна ось различия, дешёвая и хорошо заметная в списке */
  const beard=r();
  if(beard<.34){
    c.fillStyle=hair;c.globalAlpha=.85;
    c.beginPath();
    if(beard<.14){                               // полная
      c.ellipse(cx,cy+h*.5,w*.72,h*.4,0,0,Math.PI);c.fill();
      c.fillRect(cx-w*.72,cy+h*.42,w*1.44,h*.12);
    }else if(beard<.24){                          // эспаньолка
      c.ellipse(cx,cy+h*.62,w*.26,h*.18,0,0,TAU);c.fill();
    }else{                                        // усы
      c.ellipse(cx,cy+h*.34,w*.34,h*.08,0,0,TAU);c.fill();
    }
    c.globalAlpha=1;
  }
  /* 8. ворот и нашивки: портрет растёт вместе с уровнем */
  const lv=mgrLevel(m);
  c.fillStyle="rgba(18,24,30,.95)";
  c.beginPath();
  c.moveTo(cx-w*1.5,S);c.lineTo(cx-w*.55,S*.78);c.lineTo(cx,S*.9);
  c.lineTo(cx+w*.55,S*.78);c.lineTo(cx+w*1.5,S);c.closePath();c.fill();
  c.strokeStyle=R.col;c.lineWidth=Math.max(1,S*.01);c.stroke();
  for(let i=0;i<Math.min(3,Math.floor((lv-1)/2)+(lv>=4?1:0));i++){
    c.fillStyle=R.col;
    c.fillRect(cx-w*1.35+i*S*.05,S*.9,S*.032,S*.05);
  }
  if(lv>=6){                                     // знак домена: виден издалека
    c.fillStyle=R.col;
    c.beginPath();c.arc(cx+w*1.15,S*.87,S*.035,0,TAU);c.fill();
  }
  /* рамка по роли — по ней список читается одним взглядом */
  c.strokeStyle=R.col;c.globalAlpha=.55;c.lineWidth=Math.max(1,S*.016);
  c.strokeRect(0,0,S,S);c.globalAlpha=1;
  m._face=cn;m._faceKey=key;
  return cn;
}
