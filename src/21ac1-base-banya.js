/* ══════════════ баня и чайный гриб (M497, PLAN st. 7, DESIGN-base §6/§10) ══════════════
   Автор, 14.09: «баня на базе; чайный гриб как событие». Два дополнения к
   базе, оба про людей, а не про цифры выработки.

   БАНЯ — отсек. Раз в шесть смен (BANYA_EVERY) — банный вечер: берёт воду из
   запаса базы, и после него шесть смен всей базе +3 духа, жилому по
   соседству — +8 (таблица соседства, «пар»). Усталость управляющего (ось С5
   правил о людях: изъян — это лицо усталости) снимается на BANYA_REST смен:
   после бани он «отходит» и изъян молчит. Проверка ПАЛАТЫ на базе с баней
   находит на одно нарушение меньше: инспектор «заодно попарился» — честный
   человек, любит баню. Воды нет — баня холодная, и это строка в журнале.

   ЧАЙНЫЙ ГРИБ — событие режиссёра, только на базе с живой оранжереей:
   культура разрослась, три смены харч ×2 (GRIB_BOOM), потом она ест
   органику базы по GRIB_EAT за смену, пока её не вырежут АВРАЛОМ в самой
   оранжерее. Срез — товар «Чайный гриб», Рассвет платит за него полтора
   (FAR_EAT_LAND). Аврал упущен — гриб остаётся и ест дальше: он не пожар, он
   никуда не идёт, он просто никогда не наедается. */
const BANYA_EVERY=6,BANYA_WATER=4,BANYA_GLOW=6,BANYA_REST=12,BANYA_SPIRIT=3,BANYA_PAL=40;
const GRIB_BOOM=3,GRIB_EAT=5,GRIB_CUT=[6,14];
BUILD.banya={ru:"Баня",cost:{credits:1300,alloy:3},power:-5,
  note:"банный вечер раз в шесть смен: духу лучше, управляющий отходит, инспектор мягче; ест воду"};
ROOM_FIN.banya={wall:"soft",tint:"66,46,32",lamp:"255,206,150",ln:2,dim:.9,floor:"soft",warn:0,work:.72,bare:1,calm:1,
  dress:["stencil","personal"],junk:["bottles","bag"]};
ADJ.push({a:"banya",b:["habitat"],k:"steam",ru:"пар",note:"+8 духа жилому: до парной два шага"});
FAR_EAT_LAND.grib=["ra",1.5];
DIR_EV.push({k:"grib",ru:"чайный гриб",warn:"в оранжерее что-то пузырится",w:1,worlds:["*"],good:1,need:"garden"});
AVR_KINDS.push({k:"grib",ru:"ЧАЙНЫЙ ГРИБ",what:"разросся",note:"лезет из грядок в коридор"});
Object.assign(BLOG,{
  bath:    (B,a)=>"банный вечер · воды −"+a.q+" · "+(a.who?"«"+a.who+" сказал: живём» ":"")+"пар до утра",
  bathcold:()=>"баня холодная: воды нет, топить нечем",
  palbanya:(B,a)=>a.rank+" "+a.who+" заодно попарился: одно нарушение «не заметил»",
  grib:    ()=>"чайный гриб разросся: харч вдвое, «а потом посмотрим»",
  gribeat: (B,a)=>"чайный гриб ест органику · −"+a.q+" · вырезать — аврал в оранжерее",
  gribcut: (B,a)=>"чайный гриб вырезан · срез "+a.q+" ед · Рассвет такое берёт"
});
function banyaLive(B){
  for(const cell of (B&&B.cells)||[])if(cell&&cell.k==="banya"&&cell.hp>0)return true;
  return false;
}
/* пар держится: банный вечер был недавно */
function banyaWarm(B,n){
  if(!B||B.bath===undefined||B.bath===null)return false;
  if(n===undefined)n=(typeof baseShift==="function")?baseShift():0;
  return banyaLive(B)&&(n-B.bath)>=0&&(n-B.bath)<BANYA_GLOW;
}
function banyaSpirit(B,n){return banyaWarm(B,n)?BANYA_SPIRIT:0;}
/* банный вечер — по номеру смены, зовёт baseShiftRun после управляющего */
function banyaStep(B,n){
  if(!banyaLive(B)||(n%BANYA_EVERY)!==0)return 0;
  if(!((typeof baseCrewN==="function")?baseCrewN(B):0))return 0;
  const L=baseLife(B);
  if((L.water|0)<BANYA_WATER){
    if(B.bathCold===n)return 0;
    B.bathCold=n;baseLog(B,"bathcold",n,{});return 1;
  }
  L.water-=BANYA_WATER;B.bath=n;
  const M=(typeof bmgrOfBase==="function")?bmgrOfBase(B):null;
  if(M&&B.mgr)B.mgr.rest=n;   /* на записи базы: bmgrOfBase порождает объект заново каждый раз */
  baseLog(B,"bath",n,{q:BANYA_WATER,who:M?M.name:""});
  return 1;
}
/* усталость управляющего: после бани изъян молчит BANYA_REST смен */
function banyaRested(M,n){return !!(M&&M.rest!==undefined&&M.rest!==null&&(n-M.rest)>=0&&(n-M.rest)<BANYA_REST);}
/* ── чайный гриб ── */
function gribOn(B){return !!(B&&B.grib);}
function gribStart(B,n){
  if(B.grib)return 0;
  B.grib={n0:n};baseLog(B,"grib",n,{});return 1;
}
function gribMul(B,n){return (B&&B.grib&&(n-B.grib.n0)<GRIB_BOOM)?2:1;}
function gribEat(B,n){
  if(!B||!B.grib||(n-B.grib.n0)<GRIB_BOOM)return 0;
  const q=Math.min(GRIB_EAT,B.pool.organics|0);
  if(q<=0)return 0;
  B.pool.organics-=q;
  if(((n-B.grib.n0)%3)===0){baseLog(B,"gribeat",n,{q});return 1;}
  return 0;
}
/* аврал в оранжерее: гриб созрел для ножа — заход начинается с него */
function gribAvral(S,B){
  if(!B||!B.grib||S.avr)return null;
  const n=(typeof baseShift==="function")?baseShift():0;
  if((n-B.grib.n0)<GRIB_BOOM)return null;
  for(let r=0;r<baseRows(B);r++)for(let c=0;c<BASE_COLS;c++){
    const cell=baseCell(B,c,r);
    if(cell&&cell.k==="garden"&&cell.hp>0){
      S.avr={c,r,k:"grib",t:AVR_TIME,hold:0};
      const kind=AVR_KINDS.find(k=>k.k==="grib");
      baseLog(B,"avral",n,{what:BUILD.garden.ru,ru:kind.ru});
      say("АВРАЛ · "+kind.ru+" · ОРАНЖЕРЕЯ\n"+kind.note+" · ДОЙТИ И ДЕРЖАТЬ ДЕЙСТВИЕ",220);
      sfx("ui",{f:220,to:140,d:.5,v:.35});
      return S.avr;
    }
  }
  B.grib=null;   /* оранжереи не стало — и гриба нет */
  return null;
}
function gribCut(B){
  const n=(typeof baseShift==="function")?baseShift():0;
  const r=rng(hashi(B.sx*7+B.sy,(B.idx|0)*3+1,n));
  const q=GRIB_CUT[0]+Math.floor(r()*(GRIB_CUT[1]-GRIB_CUT[0]+1));
  const got=addRes("grib",q);
  if(q-got>0)B.pool.grib=(B.pool.grib|0)+(q-got);
  B.grib=null;
  baseLog(B,"gribcut",n,{q});
  tell("good","Чайный гриб вырезан","ЧАЙНЫЙ ГРИБ ВЫРЕЗАН\nсрез "+q+" ед"+(got<q?" · "+(q-got)+" на складе базы":"")+"\nРассвет платит ×1,5");
  sfx("ui",{f:420,to:660,d:.25,v:.3});
}
/* ── ПАРНАЯ: разрез отсека ──
   Мерило — человек: полок в две ступени по пояс и по грудь, каменка по колено,
   шайка у ноги. Свет один — тёплая лампа под потолком, и жар из топки снизу.
   Стены — доска, не панель: единственный отсек базы из дерева, и это видно с
   первого взгляда. Пар — тем гуще, чем ближе банный вечер. */
BASE_ROOM.banya=function(x0,y0,w,h,cx,fy,lit,seed,B,P){
  const n=(typeof baseShift==="function")?baseShift():0;
  const hot=(B&&banyaWarm(B,n))?1:.35;
  const warm=.35+lit*.5,S=bS(),L=bL();
  const sx=x0+12,sw=32,sh=34,sy=fy-sh;
  const bx=x0+w*.50,bw=w-(bx-x0)-8,vx=x0+w*.42,vy=y0+14;
  /* тело парной (доска, каменка, полок, лежащий) печётся; жар в топке,
     сидящий, веник на сквозняке и пар — кадром */
  if(S){
  /* доска: горизонтальные плахи с тёмным швом и сучками поверх мягкой стены */
  ctx.save();ctx.beginPath();ctx.rect(x0,y0,w,h-8);ctx.clip();
  const R=rng(seed+7);
  for(let py=y0+6;py<fy-4;py+=9){
    ctx.fillStyle="rgba(120,84,52,"+(.16+lit*.16).toFixed(3)+")";ctx.fillRect(x0,py,w,8);
    ctx.fillStyle="rgba(30,18,10,"+(.32+lit*.14).toFixed(2)+")";ctx.fillRect(x0,py+8,w,1);
    ctx.fillStyle="rgba(255,220,170,"+(.05+lit*.05).toFixed(3)+")";ctx.fillRect(x0,py,w,1);
    if(R()<.55){const kx=x0+R()*w;ctx.fillStyle="rgba(50,30,16,"+(.35+lit*.2).toFixed(2)+")";
      ctx.beginPath();ctx.ellipse(kx,py+4,2.4,1.6,0,0,TAU);ctx.fill();}
  }
  ctx.restore();
  /* каменка слева: чугунный короб на ножках, топка с решёткой, камни сверху, труба в потолок */
  bPipe([[sx+sw/2,sy-8],[sx+sw/2,y0+6]],6,"70,66,64",lit);
  ctx.fillStyle="rgba(0,0,0,.32)";ctx.beginPath();ctx.ellipse(sx+sw/2,fy-1,sw*.62,3,0,0,TAU);ctx.fill();
  ctx.fillStyle="rgba(34,32,34,.98)";ctx.fillRect(sx+3,fy-5,4,5);ctx.fillRect(sx+sw-7,fy-5,4,5);
  bBox(sx,sy,sw,sh-5,"rgba(44,42,44,.98)",lit,"rgba(0,0,0,.45)");
  ctx.fillStyle="rgba(255,255,255,"+(.06+lit*.06).toFixed(3)+")";ctx.fillRect(sx+2,sy+2,sw-4,1);
  bGlow(sx+16,sy+22,26,"255,140,60",.10+.12*hot);
  ctx.fillStyle="rgba(255,150,70,"+(.08+.10*hot).toFixed(2)+")";
  ctx.beginPath();ctx.ellipse(sx+16,fy-2,22,3,0,0,TAU);ctx.fill();
  /* камни: лоток сверху, серые окатыши, на банный вечер верхние светятся */
  ctx.fillStyle="rgba(60,58,60,.98)";ctx.fillRect(sx-2,sy-4,sw+4,5);
  const Rs=rng(seed+19);
  for(let i=0;i<7;i++){
    const px=sx+4+i*4.2+Rs()*1.5,py=sy-5-Rs()*4,rr=2.4+Rs()*1.6;
    ctx.fillStyle="rgba("+(110+Rs()*20|0)+","+(104+Rs()*14|0)+","+(100+Rs()*10|0)+","+(.8+lit*.2).toFixed(2)+")";
    ctx.beginPath();ctx.arc(px,py,rr,0,TAU);ctx.fill();
    ctx.fillStyle="rgba(255,110,50,"+((py<sy-6?.35:.12)*hot).toFixed(2)+")";
    ctx.beginPath();ctx.arc(px,py,rr*.7,0,TAU);ctx.fill();
  }
  /* шайка и ковш у каменки */
  bBox(sx+sw+6,fy-8,13,8,"rgba(120,90,58,.96)",lit,"rgba(0,0,0,.4)");
  ctx.fillStyle="rgba(180,210,230,"+(.3+lit*.3).toFixed(2)+")";ctx.fillRect(sx+sw+8,fy-7,9,1.6);
  ctx.strokeStyle="rgba(150,120,80,"+(.5+lit*.3).toFixed(2)+")";ctx.lineWidth=1.4;
  ctx.beginPath();ctx.moveTo(sx+sw+12,fy-8);ctx.lineTo(sx+sw+22,fy-18);ctx.stroke();
  ctx.fillStyle="rgba(150,120,80,"+(.6+lit*.3).toFixed(2)+")";
  ctx.beginPath();ctx.ellipse(sx+sw+11,fy-8,3.2,2,0,0,TAU);ctx.fill();
  /* полок справа: две ступени, нижний сидит в шапке, верхний лежит */
  const py1=fy-16,py2=fy-34;
  ctx.fillStyle="rgba(0,0,0,.30)";ctx.fillRect(bx,py1+4,bw,fy-py1-4);
  bBox(bx,py1,bw,5,"rgba(150,110,66,.98)",lit,"rgba(0,0,0,.45)");
  bBox(bx+bw*.34,py2,bw*.66,5,"rgba(150,110,66,.98)",lit,"rgba(0,0,0,.45)");
  ctx.fillStyle="rgba(255,230,180,"+(.10+lit*.10).toFixed(3)+")";ctx.fillRect(bx,py1,bw,1);ctx.fillRect(bx+bw*.34,py2,bw*.66,1);
  ctx.fillStyle="rgba(40,26,14,"+(.45+lit*.2).toFixed(2)+")";
  for(let px=bx+6;px<bx+bw;px+=11)ctx.fillRect(px,py1+1,1,3);
  for(let px=bx+bw*.34+6;px<bx+bw;px+=11)ctx.fillRect(px,py2+1,1,3);
  ctx.fillStyle="rgba(120,86,50,.98)";ctx.fillRect(bx+2,py1+5,3,fy-py1-5);ctx.fillRect(bx+bw*.34+2,py2+5,3,py1-py2-5);
  /* лежащий на верхней ступени: тело, голова на согнутой руке, колено */
  {
    const lx=bx+bw*.40,ly=py2-1,skin="rgba(214,168,128,"+(.55+lit*.35).toFixed(2)+")";
    ctx.fillStyle=skin;
    ctx.beginPath();ctx.roundRect(lx+8,ly-8,bw*.36,8,4);ctx.fill();          // корпус до пояса
    ctx.beginPath();ctx.arc(lx+6,ly-6,4.2,0,TAU);ctx.fill();                  // голова
    /* ноги: бедро поднято к колену, голень обратно на полок — одна линия, а не второй бугор */
    const kx=lx+bw*.52,ky=ly-15;
    ctx.lineCap="round";ctx.strokeStyle=skin;ctx.lineWidth=5.5;
    ctx.beginPath();ctx.moveTo(lx+8+bw*.36-2,ly-4);ctx.lineTo(kx,ky);ctx.lineTo(kx+9,ly-3);ctx.stroke();
    ctx.lineCap="butt";
    ctx.fillStyle="rgba(230,224,210,"+(.7+lit*.2).toFixed(2)+")";              // полотенце на бёдрах
    ctx.beginPath();ctx.roundRect(lx+8+bw*.24,ly-9,bw*.16,9,2);ctx.fill();
    ctx.fillStyle="rgba(120,80,50,"+(.6+lit*.2).toFixed(2)+")";                // волосы
    ctx.beginPath();ctx.arc(lx+5,ly-7.5,3.4,Math.PI*.95,Math.PI*1.95);ctx.fill();
  }
  ctx.strokeStyle="rgba(120,90,50,"+(.6+lit*.3).toFixed(2)+")";ctx.lineWidth=1.6;
  ctx.beginPath();ctx.moveTo(vx,vy);ctx.lineTo(vx,vy+10);ctx.stroke();       // гвоздь и черенок
  const tx=x0+w*.42+18,ty=y0+12;                                            // градусник
  bBox(tx,ty,6,20,"rgba(230,226,214,.95)",lit,"rgba(0,0,0,.4)");
  ctx.fillStyle="rgba(210,50,40,.95)";ctx.fillRect(tx+2.3,ty+20-4-12*hot,1.6,4+12*hot);
  bLamp(cx+10,y0+4,30,fy,"255,206,150",.28+lit*.38);
  }
  if(!L)return;
  /* топка: дверца, за решёткой жар — единственный низкий свет в отсеке */
  const fg=.45+.35*hot+Math.sin(G.t*.09)*.08;
  ctx.fillStyle="rgba(255,120,40,"+(fg*.9).toFixed(2)+")";ctx.fillRect(sx+8,sy+16,16,10);
  ctx.fillStyle="rgba(255,220,140,"+(fg*.5).toFixed(2)+")";ctx.fillRect(sx+10,sy+18,12,3);
  ctx.fillStyle="rgba(30,28,30,.95)";
  for(let i=0;i<3;i++)ctx.fillRect(sx+8,sy+18+i*3.2,16,1.2);
  ctx.fillRect(sx+12,sy+16,1.2,10);ctx.fillRect(sx+19,sy+16,1.2,10);
  /* сидящий на нижней — войлочная шапка (единственный головной убор бани) */
  bWorker(bx+bw*.16,fy,lit,true,G.t*.03+seed,-1,1);
  {  /* шапка сидит на голове (bWorker: макушка сидящего на fy−21.5), а не над ней */
    const hx=bx+bw*.16+1,hy=fy-22;
    ctx.fillStyle="rgba(196,186,160,"+(.7+lit*.2).toFixed(2)+")";
    ctx.beginPath();ctx.moveTo(hx-5.5,hy);ctx.lineTo(hx+5.5,hy);ctx.lineTo(hx+3,hy-6.5);ctx.lineTo(hx-3,hy-6.5);ctx.closePath();ctx.fill();
    ctx.fillStyle="rgba(120,110,90,"+(.5+lit*.2).toFixed(2)+")";ctx.fillRect(hx-5.5,hy-1.2,11,1.2);
  }
  /* веник на гвозде и градусник: приметы, по которым баня — баня */
  {
    for(let i=0;i<7;i++){
      const a=Math.PI/2+(i-3)*.22+Math.sin(G.t*.01+i)*.03,len=9+((i*29)%4)*1.8;
      ctx.strokeStyle="rgba("+(i%2?"84,112,58":"102,132,64")+","+(.5+lit*.3).toFixed(2)+")";ctx.lineWidth=2.2;
      ctx.beginPath();ctx.moveTo(vx,vy+10);ctx.lineTo(vx+Math.cos(a)*len,vy+10+Math.sin(a)*len);ctx.stroke();
    }
  }
  /* пар: волны от каменки вверх и к полку, гуще в банный вечер */
  ctx.save();ctx.beginPath();ctx.rect(x0,y0,w,h-8);ctx.clip();
  for(let i=0;i<6;i++){
    const u=((G.t*.004+i*.17)%1),ex=sx+16+u*(w*.55)+Math.sin(G.t*.02+i*1.7)*8,ey=sy-10-u*(sy-10-y0-8)*.9;
    const a=(.05+.09*hot)*(1-u)*(1-u)*warm*2;
    ctx.fillStyle="rgba(255,240,225,"+a.toFixed(3)+")";
    ctx.beginPath();ctx.ellipse(ex,ey,14+u*26,6+u*9,0,0,TAU);ctx.fill();
  }
  ctx.restore();
};
BUILD_KEYS.push("banya");   /* список меню собран в 21a раньше этого файла */
