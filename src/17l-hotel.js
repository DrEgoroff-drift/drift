/* ══════════════ гостиницы (M461, DESIGN-life §3.3) ══════════════
   Одно тело — плита окон — и шесть одевок хозяина: какие окна горят и что на
   вывеске. «ГОС ИНИЦА «КОСМОС»» (две буквы мертвы, на доске «МЕСТ НЕТ», у
   стойки «для вас найдём»), «ДЖЕКПОТ-СИТИ™», «Пансион № 4» (свет гасят в 22),
   «Ля Люн», дверь в скале, соты. Гостиница — дверь для тихих вещей, что уже
   есть: кино (27da), слухи кантины, номер. Доброта: корпус ниже трети —
   ночь даром, «потом заплатите».

   Стоит у людной станции (жизнь ≥ .45) по другую сторону полосы от щита. */
const HOTEL_SIGN={gt:"ГОС ИНИЦА «КОСМОС»",co:"ДЖЕКПОТ-СИТИ™",or:"ПАНСИОН № 4",km:"LA LUNE",ra:"ДВЕРЬ В СКАЛЕ",hf:"HIVE·HOTEL v2"};
const HOTEL_NIGHT=12;
function hotelHere(){
  const sys=G.sys;if(!sys||!sys.station||typeof sysLane!=="function")return null;
  const P=sysLane(sys);if(!P||P.life<.45)return null;
  const d=LANE_DOCK+LANE_GAP*.4;
  return {x:P.st.x+P.ux*d+P.uy*280*P.side,y:P.st.y+P.uy*d-P.ux*280*P.side,by:P.by,name:HOTEL_SIGN[P.by]||HOTEL_SIGN.gt};
}
/* Хрущёвка (автор 19.09: «гостиница всратая … перерисуй хрущевку, покрупнее, чтобы окна
   гасли»). Пять этажей панели с тёмными швами, вальмовая крыша с трубами и антеннами на
   проволоке, застеклённые балконы вразнобой — у каждого свой цвет, лавка у подъезда.
   Окна живут по суткам: у каждого свой порог по зерну, вечером горит почти всё, к ночи
   гаснет по одному, к утру — редкие; раз в несколько секунд одно окно передумывает.
   Размер — мировой (растёт с зумом), издали — плита без мелочей. */
const HR_COLS=12,HR_SIDE=3,HR_ROWS=5,HR_W=160,HR_SW=34,HR_SK=12,HR_FH=84,HR_TOP=46,HR_BW=200,HR_BH=136,HR_PX=1.6;
function hotelLitFrac(by,hr){
  if(by==="co")return .95;
  if(by==="or"&&(hr>=22||hr<6))return .04;
  const T=[.12,.08,.06,.05,.06,.15,.45,.55,.35,.18,.12,.12,.14,.14,.14,.16,.25,.5,.8,.9,.88,.75,.55,.3];
  return T[hr|0];
}
/* окна дома: фасад 12×5 и торец 3×5 — по порядку; у каждого своё зерно-порог,
   раз в шесть секунд одно-два окна передумывают */
function hotelWinLit(sd,lit,flick){
  let m="";
  for(let n=0;n<(HR_COLS+HR_SIDE)*HR_ROWS;n++){
    const h=hashi(n,sd,0x407E)>>>0;let on=((h%1000)/1000)<lit;
    if(((hashi(n,flick,0xF11C)>>>0)%89)===0)on=!on;
    m+=on?"1":"0";
  }
  return m;
}
const HOTEL_MS=3,HOTEL_STEPS=8;   /* кисть за вызов: мс и шагов (этажей) */
let HOTEL_BAKE=null,HOTEL_REC=null;   /* REC — записи кисти по половинам (hotelBake) */
/* Хрущёвка печётся целиком (правило «что не движется — рисуется раз») дважды: все окна
   погашены и все горят, в один атлас на слой (сверху — погашенный дом, ниже — горящий).
   Какие окна горят — решает кадр: погашенный дом целиком, поверх — рамки горящих окон из
   нижней половины. Смена часа и окно, что передумало, не печёт и не грузит ничего.
   Вид три четверти, как у макета на столе: фасад, торец в тени, вальмовая крыша
   шифером, трубы, антенны на проволоке.
   Три слоя (16/n): cv — краска без света; em — свет стёкол, узкий ореол в долю окна
   (свечение принадлежит окну, шире — дело блума, и его мало); sh — тот же дом под
   тёплым светом вывески сверху, сходит на нет ко второму этажу */
const HOTEL_EM=1,HOTEL_NEON=1.2,HOTEL_SHEEN=.8;
/* стекло балкона и бумага «ПРОДАЮ» глушат свет окна за ними на .22 — так было вечером, когда
   стирание брало альфу чужой заливки (горящего соседа) и зависело от соседних окон */
const HOTEL_VEIL="rgba(0,0,0,.22)";
/* мастер дома берётся на уровень крупнее (как прежний gpuCvLevel: не мельче экрана) —
   окна и рамы резкие; .785 общего правила смешивал его со следующим, −10 % резкости */
const HOTEL_LOD=.5;
const HOTEL_LAMP=[[255,169,87],[255,178,104],[255,163,80],[255,186,118],[255,172,94],[255,180,110],[180,200,235]];
/* рамка окна n в единицах дома: всё, чем горящее окно отличается от погашенного (стекло,
   балкон перед ним, тень света), с полем под ореол; соседние рамки не перекрываются */
function hotelWinBox(sd,n){
  const cw=HR_W/HR_COLS,rh=HR_FH/HR_ROWS,X0=4,T0=HR_TOP,m=1.2;
  if(n>=HR_COLS*HR_ROWS){
    const q=n-HR_COLS*HR_ROWS,j=(q/HR_SIDE)|0,i=q%HR_SIDE,u=(i+.3)/HR_SIDE,ww=HR_SW/HR_SIDE*.4;
    const px=X0+HR_W+u*HR_SW,py=T0+(j+.24)/HR_ROWS*HR_FH-u*HR_SK;
    return [px-m,py-ww*HR_SK/HR_SW-m,px+ww+m,py+rh*.52+m];
  }
  const j=(n/HR_COLS)|0,i=n%HR_COLS,x=X0+i*cw,y=T0+j*rh;
  if([3,8].includes(i))return j<HR_ROWS-1?[x+cw*.24-m,y+rh*.66-m,x+cw*.76+m,y+rh*.88+m]:null;
  const b=[x+cw*.2-m,y+rh*.2-m,x+cw*.8+m,y+rh*.76+m];
  const bal=q=>q>=0&&q<HR_COLS&&j<HR_ROWS-1&&![3,8].includes(q)&&!((hashi(q*7+j,sd,0xBA1C)>>>0)%4);
  if(bal(i)){   /* балкон: стекло шире окна, поле уже — до соседа */
    const bx=x-cw*.06,by=y+rh*.14,bw=cw*1.12;b[0]=Math.min(b[0],bx-.4);b[1]=Math.min(b[1],by-.8);b[2]=Math.max(b[2],bx+bw+.4);
    /* соседние балконы заходят друг на друга, правый поверх: граница — начало его стекла */
    if(bal(i-1))b[0]=bx+.4;
    if(bal(i+1))b[2]=bx+cw+.4;
  }
  return b;
}
const HR_GAP=16;   /* поле между половинами атласа, в пикселях: мипы не смешивают дома */
/* атлас: сверху дом со всеми погашенными окнами, под полем — со всеми горящими. Три выпечки
   GPU-холста (08ca) 320×452 с мипами: краска, свет стёкол, отсвет вывески. 2D-холстов и
   выгрузок нет (прежде — шесть 2D-холстов половин, три атласа и их мипы спуском 2D) */
function hotelBake(sd,col){
  const ck=col.join();
  if(HOTEL_BAKE&&HOTEL_BAKE.sd===sd&&HOTEL_BAKE.ck===ck&&HOTEL_BAKE.cv.dev===GPU.dev)return HOTEL_BAKE;
  if(!GPU.dev)return null;
  const N=(HR_COLS+HR_SIDE)*HR_ROWS,w=Math.ceil(HR_BW*HR_PX),ph=Math.ceil(HR_BH*HR_PX),th=ph*2+HR_GAP;
  /* кисть — дорогая часть (~25 мс на обе половины), выпечка из готовой записи — дешёвая. Поэтому
     кисть идёт по половине за вызов (за кадр) и пишет оба слоя сразу, как в 2D: краска и свет
     стёкол — в две записи того же размера и сглаживания, что у выпечки; команды записи — готовые
     вершины в px цели, от холста не зависят и уходят в выпечку как есть. Выпечки из записи — тоже
     по одной за вызов: краска, свет, отсвет. Пока шаг не последний — null */
  if(HOTEL_REC&&(HOTEL_REC.sd!==sd||HOTEL_REC.cv&&HOTEL_REC.cv.dev!==GPU.dev)){for(const q of [HOTEL_REC.cv,HOTEL_REC.em])gpuBakeDrop(q);HOTEL_REC=null;}
  if(!HOTEL_REC)HOTEL_REC={sd,P:[],cv:null,em:null,it:null};
  const Q=HOTEL_REC,P=Q.P;
  if(P.length<2){
    if(!Q.it){const i=P.length,oy=i?ph+HR_GAP:0,g=new GcCtx(w,th,2),E=new GcCtx(w,th,2);
      for(const q of [g,E]){q.beginPath();q.rect(0,oy,w,ph);q.clip();q.translate(0,oy);q.scale(HR_PX,HR_PX);}
      Q.it=hotelPaint(sd,String(i).repeat(N),g,E,0);Q.g=g;Q.E=E;}
    /* этажи — пока не вышли за HOTEL_MS; потолок шагов — на случай стоящих часов (стенд тестов) */
    const t0=wallMs();let k=0,d;
    do d=Q.it.next().done;while(!d&&++k<HOTEL_STEPS&&wallMs()-t0<HOTEL_MS);
    if(d){P.push([Q.g._ops,Q.E._ops]);Q.it=Q.g=Q.E=null;}
    return null;}
  if(!Q.cv){Q.cv=gpuBake(w,th,g=>{for(const q of P)g._ops.push(...q[0]);},{ss:2});return null;}
  /* ореол стёкол — одна тень со всего слоя, пиксель в пиксель (ss 1), а не своя на каждое окно:
     у GPU-холста тень — проход по всей цели, 84 окна давали секунду на телефоне */
  if(!Q.em){const em0=gpuBake(w,th,g=>{for(const q of P)g._ops.push(...q[1]);},{ss:2,mips:false});
    Q.em=gpuBake(w,th,g=>{g.shadowColor=HOTEL_GLOW;g.shadowBlur=1.2;g.drawImage(em0,0,0);},{ss:1});gpuBakeDrop(em0);return null;}
  const cv=Q.cv,em=Q.em;Q.cv=Q.em=null;   /* теперь они — у HOTEL_BAKE; записи остаются: смена цвета перепечёт без кисти */
  if(HOTEL_BAKE&&HOTEL_BAKE.cv!==cv)for(const q of [HOTEL_BAKE.cv,HOTEL_BAKE.em,HOTEL_BAKE.sh])gpuBakeDrop(q);
  /* отсвет вывески: дом, умноженный на её цвет, от конька до второго этажа — в каждой половине */
  const rh=HR_FH/HR_ROWS;
  /* multiply 2D на полупрозрачном (тонкие антенны, провода, кромки) прибавляет цвет градиента
     с весом 1−α дома, у GPU-холста этой части нет — отсвет тонкого гас. Дом на белом даёт её
     точно: s·(d+1−α), а destination-in домом — тот же множитель α, что у 2D */
  const sh=gpuBake(w,th,g=>{g.fillStyle="#fff";g.fillRect(0,0,w,th);g.drawImage(cv,0,0);g.globalCompositeOperation="multiply";
    for(const oy of [0,ph+HR_GAP]){
      const gs=g.createLinearGradient(0,oy+6*HR_PX,0,oy+(HR_TOP+rh*1.4)*HR_PX);gs.addColorStop(0,rgba(col,1));gs.addColorStop(.45,rgba(col.map(v=>v*.35),1));gs.addColorStop(1,"#000");
      g.fillStyle=gs;g.fillRect(0,oy,w,ph);}
    g.globalCompositeOperation="destination-in";g.drawImage(cv,0,0);},{ss:1});   /* пиксель в пиксель: при ss 2 drawImage дома растягивается и сводится — мыло, −12 % краёв */
  /* рамки — в целых пикселях холста (округление монотонно: соседние не наезжают) */
  const win=[];for(let n=0;n<N;n++){const b=hotelWinBox(sd,n);win.push(b&&b.map(v=>Math.round(v*HR_PX)));}
  const shY=Math.ceil((HR_TOP+HR_FH/HR_ROWS*1.4)*HR_PX)+2;   /* ниже отсвета вывески нет (градиент sh) */
  HOTEL_BAKE={sd,ck,cv,em,sh,ph,win,shY,ver:((HOTEL_BAKE&&HOTEL_BAKE.ver)|0)+1};return HOTEL_BAKE;
}
/* дом по маске окон: c — краска, e — свет стёкол; оба уже в единицах дома (×HR_PX) */
const HOTEL_GLOW="rgba(255,176,96,.7)";
function* hotelPaint(sd,mask,c,e,blur=1.2){   /* генератор: шаг — этаж или часть дома (hotelBake режет по кадрам) */
  c.save();e.save();
  e.shadowColor=HOTEL_GLOW;e.shadowBlur=blur;   /* в пикселях холста, мимо трансформа: ~десятая окна */
  const r=rng((sd^0x5A11)>>>0),T0=HR_TOP,FW=HR_W,FH=HR_FH,cw=FW/HR_COLS,rh=FH/HR_ROWS,X0=4;
  const CURT=["#e8b86a","#f0d49a","#d98d5a","#c9e0a0","#f4c2a8","#b8c8e8","#e0a0a0"];
  const ENTR=[3,8];
  /* окно: откос в тени, стекло — тёмное с бликом или тёплое со шторами, белая рама */
  const winAt=(x,y,w,h,on,hh,big)=>{
    c.fillStyle="rgba(40,34,26,.55)";c.fillRect(x-.5,y-.5,w+1,h+1);
    if(on){
      /* комната — краской темнее лампы (стекло само не светит), свет — пятном от лампы,
         а не ровным прямоугольником. Лампы накаливания 2700–3000 K, каждое седьмое окно —
         холодное (телевизор, дневная лампа). Окно тусклее вывески: акцент — вывеска */
      const lc=HOTEL_LAMP[(hh>>>4)%HOTEL_LAMP.length];
      const g=c.createLinearGradient(x,y,x,y+h);g.addColorStop(0,rgba(lc.map(v=>v*.46),1));g.addColorStop(1,rgba(lc.map(v=>v*.36),1));
      c.fillStyle=g;c.fillRect(x,y,w,h);
      c.fillStyle=CURT[hh%CURT.length];c.globalAlpha=.8;
      c.fillRect(x,y,w*.28,h);c.fillRect(x+w*.72,y,w*.28,h);
      c.fillStyle="rgba(30,20,12,.32)";c.fillRect(x,y,w*.28,h);c.fillRect(x+w*.72,y,w*.28,h);c.globalAlpha=1;   /* штора — ткань на просвет */
      if(hh%7===0){c.fillStyle="rgba(60,40,30,.55)";c.beginPath();c.arc(x+w*.52,y+h*.45,h*.14,0,TAU);c.fill();c.fillRect(x+w*.42,y+h*.58,w*.2,h*.42);}
      const lr=Math.max(w,h)*.8,lg=e.createRadialGradient(x+w*.5,y+h*.4,0,x+w*.5,y+h*.4,lr);
      lg.addColorStop(0,rgba(lc,.3));lg.addColorStop(.55,rgba(lc,.15));lg.addColorStop(1,rgba(lc,.05));
      e.fillStyle=lg;e.fillRect(x,y,w,h);   /* переплёт не светит */
      e.save();e.globalCompositeOperation="destination-out";e.shadowBlur=0;e.fillStyle="#000";
      e.fillRect(x+w*.5-.22,y,.45,h);if(big)e.fillRect(x,y+h*.32,w,.4);
      if(hh%7===0){e.globalAlpha=.6;e.beginPath();e.arc(x+w*.52,y+h*.45,h*.14,0,TAU);e.fill();e.fillRect(x+w*.42,y+h*.58,w*.2,h*.42);}
      e.restore();
    }else{
      const g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,"#3a4550");g.addColorStop(1,"#1a2027");
      c.fillStyle=g;c.fillRect(x,y,w,h);
      c.fillStyle="rgba(180,200,220,.18)";c.beginPath();c.moveTo(x,y+h*.6);c.lineTo(x+w*.5,y);c.lineTo(x+w*.75,y);c.lineTo(x,y+h);c.closePath();c.fill();
    }
    c.fillStyle="#c9c1ae";
    c.fillRect(x,y,w,.45);c.fillRect(x,y+h-.45,w,.45);c.fillRect(x,y,.45,h);c.fillRect(x+w-.45,y,.45,h);
    c.fillRect(x+w*.5-.22,y,.45,h);if(big)c.fillRect(x,y+h*.32,w,.4);
  };
  /* ── торец в тени: параллелограмм вверх-вправо ── */
  const SX=X0+FW,SW=HR_SW,SK=HR_SK,sideP=(u,v)=>[SX+u*SW,T0+v*FH-u*SK];
  const quad=(a,b,d,e)=>{c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.lineTo(d[0],d[1]);c.lineTo(e[0],e[1]);c.closePath();};
  c.fillStyle="#8f7f60";quad(sideP(0,0),sideP(1,0),sideP(1,1),sideP(0,1));c.fill();
  c.strokeStyle="rgba(50,52,50,.7)";c.lineWidth=.45;c.beginPath();
  for(let i=1;i<HR_SIDE;i++){const a=sideP(i/HR_SIDE,0),b=sideP(i/HR_SIDE,1);c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);}
  for(let j=1;j<HR_ROWS;j++){const a=sideP(0,j/HR_ROWS),b=sideP(1,j/HR_ROWS);c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);}
  c.stroke();
  for(let j=0;j<HR_ROWS;j++){for(let i=0;i<HR_SIDE;i++){
    const n=HR_COLS*HR_ROWS+j*HR_SIDE+i,p=sideP((i+.3)/HR_SIDE,(j+.24)/HR_ROWS);
    c.save();c.translate(p[0],p[1]);c.transform(1,-SK/SW,0,1,0,0);
    e.save();e.translate(p[0],p[1]);e.transform(1,-SK/SW,0,1,0,0);e.globalAlpha=.7;   /* торец в тени: стекло под углом, свет глуше */
    winAt(0,0,SW/HR_SIDE*.4,rh*.52,mask[n]==="1",hashi(n,sd,0x407E)>>>0,false);c.restore();e.restore();
  }yield;}
  {const p=sideP(.35,.9);c.strokeStyle="rgba(40,40,40,.55)";c.lineWidth=.5;c.beginPath();
   c.arc(p[0],p[1]-3,2.4,0,TAU);c.moveTo(p[0]-3,p[1]+1);c.lineTo(p[0]+4,p[1]-1);c.stroke();}
  /* ── фасад ── */
  c.fillStyle="#cdb98f";c.fillRect(X0,T0,FW,FH);
  for(let j=0;j<HR_ROWS;j++)for(let i=0;i<HR_COLS;i++){   /* панели разного тона — дом латали */
    const t=r();if(t<.35){c.fillStyle=t<.12?"rgba(120,100,70,.14)":"rgba(255,245,220,.10)";c.fillRect(X0+i*cw,T0+j*rh,cw,rh);}
  }
  {const g=c.createLinearGradient(0,T0,0,T0+8);g.addColorStop(0,"rgba(60,50,40,.35)");g.addColorStop(1,"rgba(60,50,40,0)");c.fillStyle=g;c.fillRect(X0,T0,FW,8);
   const g2=c.createLinearGradient(0,T0+FH-10,0,T0+FH);g2.addColorStop(0,"rgba(50,50,50,0)");g2.addColorStop(1,"rgba(50,50,50,.45)");c.fillStyle=g2;c.fillRect(X0,T0+FH-10,FW,10);}
  c.strokeStyle="rgba(46,50,48,.85)";c.lineWidth=.55;c.beginPath();   /* швы — мастика */
  for(let i=1;i<HR_COLS;i++){c.moveTo(X0+i*cw,T0);c.lineTo(X0+i*cw,T0+FH);}
  for(let j=1;j<HR_ROWS;j++){c.moveTo(X0,T0+j*rh);c.lineTo(X0+FW,T0+j*rh);}
  c.stroke();
  for(let j=0;j<HR_ROWS;j++){for(let i=0;i<HR_COLS;i++){
    const n=j*HR_COLS+i,on=mask[n]==="1",hh=hashi(n,sd,0x407E)>>>0,x=X0+i*cw,y=T0+j*rh;
    if(ENTR.includes(i)){   /* лестничная клетка — узкое окно между этажами */
      if(j<HR_ROWS-1){c.fillStyle="rgba(40,34,26,.5)";c.fillRect(x+cw*.2,y+rh*.62,cw*.6,rh*.3);
        c.fillStyle=on?"#8e8462":"#2c343b";c.fillRect(x+cw*.24,y+rh*.66,cw*.52,rh*.22);
        if(on){e.fillStyle="rgba(236,226,190,.4)";e.fillRect(x+cw*.24,y+rh*.66,cw*.52,rh*.22);}
        c.fillStyle="#c9c1ae";c.fillRect(x+cw*.5-.2,y+rh*.66,.4,rh*.22);}
      continue;
    }
    winAt(x+cw*.2,y+rh*.2,cw*.6,rh*.56,on,hh,(hh>>>3)%3!==0);
  }yield;}
  /* застеклённые балконы — у каждого хозяина свой цвет */
  const BAL=[["#4d9a8e","#2f6f66"],["#a3353a","#6e2226"],["#7d8b97","#56626c"],["#5b8cc0","#3b6690"],["#7a563a","#553a26"],["#d8d0b0","#a8a080"],["#c8508a","#8c3060"]];
  for(let j=0;j<HR_ROWS-1;j++){for(let i=0;i<HR_COLS;i++){
    if(ENTR.includes(i))continue;
    const hh=hashi(i*7+j,sd,0xBA1C)>>>0;if(hh%4)continue;
    const on=mask[j*HR_COLS+i]==="1",[ca,cb]=BAL[(hh>>>5)%BAL.length];
    const x=X0+i*cw-cw*.06,y=T0+j*rh+rh*.14,w=cw*1.12,h=rh*.86;
    c.fillStyle="rgba(0,0,0,.35)";c.fillRect(x+w,y+1,1.2,h);
    c.fillStyle=cb;c.fillRect(x,y+h*.55,w,h*.45);
    c.fillStyle=ca;c.fillRect(x,y+h*.55,w,h*.08);
    c.fillStyle=on?"#6e5436":"#33404a";c.fillRect(x+.4,y,w-.8,h*.55);
    e.save();e.globalCompositeOperation="destination-out";e.shadowBlur=0;e.fillStyle=HOTEL_VEIL;e.fillRect(x,y,w,h);e.restore();   /* балкон застеклён: свет окна за ним глушится на пятую часть */
    if(on){e.fillStyle="rgba(255,176,100,.22)";e.fillRect(x+.4,y,w-.8,h*.55);}
    c.fillStyle="#c9c1ae";for(let k=0;k<=4;k++)c.fillRect(x+.4+k*(w-1.2)/4,y,.4,h*.55);
    c.fillRect(x,y,w,.5);
    c.fillStyle=cb;c.fillRect(x-.3,y-1,w+.6,1);
  }yield;}
  for(let k=0;k<5;k++){   /* кондиционеры */
    const i=(hashi(k,sd,0xAC)>>>0)%HR_COLS,j=(hashi(k,sd,0xAD)>>>0)%HR_ROWS;if(ENTR.includes(i))continue;
    const x=X0+i*cw+cw*.78,y=T0+j*rh+rh*.66;
    c.fillStyle="#c4c2ba";c.fillRect(x,y,cw*.28,rh*.22);
    c.strokeStyle="rgba(80,80,80,.7)";c.lineWidth=.3;c.beginPath();c.arc(x+cw*.14,y+rh*.11,rh*.07,0,TAU);c.stroke();
  }
  {const i=1+(hashi(1,sd,0x5E11)>>>0)%(HR_COLS-2),j=1+(hashi(2,sd,0x5E11)>>>0)%3;   /* «ПРОДАЮ» */
   if(!ENTR.includes(i)){const x=X0+i*cw+cw*.18,y=T0+j*rh+rh*.3;c.fillStyle="#aca695";c.fillRect(x,y,cw*.64,rh*.22);
    e.save();e.globalCompositeOperation="destination-out";e.shadowBlur=0;e.globalAlpha=1;e.fillStyle=HOTEL_VEIL;e.fillRect(x,y,cw*.64,rh*.22);e.restore();   /* бумага глушит лампу за ней */
    c.fillStyle="#c0203a";c.font="bold 2.3px ui-monospace,monospace";c.textAlign="center";c.textBaseline="middle";c.fillText("ПРОДАЮ",x+cw*.32,y+rh*.11);}}
  for(const i of [1,6]){   /* решётки «солнышком» на первом этаже */
    const x=X0+i*cw+cw*.2,y=T0+4*rh+rh*.2,w=cw*.6,h=rh*.56;
    c.strokeStyle="rgba(235,235,230,.8)";c.lineWidth=.3;c.beginPath();
    for(let k=0;k<7;k++){const a=Math.PI+k*Math.PI/6;c.moveTo(x+w/2,y+h);c.lineTo(x+w/2+Math.cos(a)*w*.5,y+h+Math.sin(a)*h*.95);}
    c.stroke();
  }
  for(const i of ENTR){   /* подъезд: дверь, козырёк, лампа, лавка */
    const x=X0+i*cw,y=T0+FH;
    c.fillStyle="#3c2a1e";c.fillRect(x+cw*.22,y-rh*.72,cw*.56,rh*.72);
    c.fillStyle="#5a4230";c.fillRect(x+cw*.26,y-rh*.68,cw*.22,rh*.66);c.fillRect(x+cw*.52,y-rh*.68,cw*.22,rh*.66);
    c.fillStyle="#6c7075";c.fillRect(x-cw*.05,y-rh*.84,cw*1.1,rh*.1);
    c.fillStyle="rgba(0,0,0,.3)";c.fillRect(x-cw*.05,y-rh*.74,cw*1.1,rh*.05);
    c.fillStyle="#ffe8a8";c.fillRect(x+cw*.46,y-rh*.73,cw*.08,rh*.05);
    e.fillStyle="rgba(255,232,168,.9)";e.fillRect(x+cw*.46,y-rh*.73,cw*.08,rh*.05);
    const bx=x+cw*1.25;c.fillStyle="#2f8a3a";c.fillRect(bx,y-3.2,cw*.95,1.2);c.fillStyle="#1f5a26";c.fillRect(bx,y-2,cw*.95,.6);
    c.fillStyle="#555";c.fillRect(bx+.4,y-2,.5,2);c.fillRect(bx+cw*.95-.9,y-2,.5,2);
  }
  c.fillStyle="#3a3c3e";c.fillRect(X0-1,T0+FH,FW+1,3);   /* цоколь */
  {const a=sideP(0,1),b=sideP(1,1);quad(a,b,[b[0],b[1]+3],[a[0],a[1]+3]);c.fillStyle="#2c2e30";c.fill();}
  yield;
  /* ── вальмовая крыша ── */
  const RH=16,ov=2.5,eL=[X0-ov,T0],eR=[SX+SW+ov*.6,T0-SK-ov*.3],eF=[SX+ov*.4,T0+.5];
  const rL=[X0+14,T0-RH],rR=[SX+SW-10,T0-RH-SK+4];
  c.fillStyle="#4b4a49";quad(eL,rL,rR,eF);c.fill();
  c.fillStyle="#3a3938";c.beginPath();c.moveTo(eF[0],eF[1]);c.lineTo(rR[0],rR[1]);c.lineTo(eR[0],eR[1]);c.closePath();c.fill();
  c.save();quad(eL,rL,rR,eF);c.clip();   /* шифер, ржавчина, латки */
  c.strokeStyle="rgba(20,20,20,.28)";c.lineWidth=.35;c.beginPath();
  for(let k=0;k<60;k++){const x=X0-4+k*3.2;c.moveTo(x,T0+1);c.lineTo(x+RH*.5,T0-RH-1);}c.stroke();
  for(let k=0;k<9;k++){c.fillStyle=k%3?"rgba(130,70,50,.25)":"rgba(120,120,115,.3)";c.fillRect(X0+r()*FW,T0-RH*r(),4+r()*8,2+r()*3);}
  c.restore();
  c.fillStyle="#4a2e22";c.beginPath();c.moveTo(eL[0],eL[1]);c.lineTo(eF[0],eF[1]);c.lineTo(eR[0],eR[1]);c.lineTo(eR[0],eR[1]+1.6);c.lineTo(eF[0],eF[1]+1.6);c.lineTo(eL[0],eL[1]+1.6);c.closePath();c.fill();
  for(const u of [.14,.2,.46,.52,.86]){   /* трубы: кирпич, грань светлее */
    const x=X0+FW*u,y=T0-RH*.72-(u>.8?3:0);
    c.fillStyle="#6a3a2a";c.fillRect(x,y-6,4,7);c.fillStyle="#8a4e38";c.fillRect(x+4,y-6.6,1.4,7.2);
    c.fillStyle="#3a2018";c.fillRect(x-.4,y-6.6,5.8,1);
  }
  c.strokeStyle="rgba(28,28,30,.95)";c.lineWidth=.45;c.beginPath();   /* антенны-«ёлки» и провода */
  const tops=[];
  for(const [u,hA] of [[.18,20],[.38,24],[.6,22],[.84,19]]){
    const x=X0+FW*u,y=T0-RH*.8,ty=y-hA;tops.push([x,ty+5]);
    c.moveTo(x,y);c.lineTo(x+.8,ty);
    for(let k=0;k<4;k++){const yy=ty+2+k*2.6,L=5-k*.8;c.moveTo(x+.8-L,yy+.8);c.lineTo(x+.8+L*.6,yy-.4);}
  }
  c.moveTo(X0+FW*.72+5,T0-RH*.8-12);c.arc(X0+FW*.72,T0-RH*.8-12,5,0,TAU);
  for(let k=0;k<tops.length-1;k++){const [x0,y0]=tops[k],[x1,y1]=tops[k+1];c.moveTo(x0,y0);c.quadraticCurveTo((x0+x1)/2,Math.max(y0,y1)+7,x1,y1);}
  c.stroke();
  c.restore();e.restore();
}
/* неон вывески — общая печь 17k0: буква — трубка, всё имя тёмным стеклом (мёртвая Т видна) */
const HOTEL_SIGN_FULL={gt:"ГОСТИНИЦА «КОСМОС»"};
const hotelNeon=(Ht,k,col)=>neonBake("hotel",Ht.name,Ht.name===HOTEL_SIGN.gt?HOTEL_SIGN_FULL.gt:Ht.name,Math.round(8*Math.max(1,k)*UIK),col,"alphabetic");
function drawHotel(zx,zy,Z){
  const Ht=hotelHere();if(!Ht)return;
  const x=zx(Ht.x),y=zy(Ht.y),k=Math.max(.08,Z*.42),   /* втрое меньше первой пробы (автор 19.09) */
  w=HR_BW*k,h=HR_BH*k;
  const sd=G.sx*31+G.sy,col=(typeof laneLampCol==="function")?laneLampCol(Ht.by):[255,190,110];
  /* за краем, но в экране от него — печём заранее по шагу за кадр: на глаза дом выходит готовым */
  if(x<-w||x>W+w||y<-h*1.5||y>H+h){
    if(x>-W-w&&x<2*W+w&&y>-H-h*1.5&&y<2*H+h){const B0=HOTEL_BAKE,B=hotelBake(sd,col);
      if(B&&B===B0&&Z>.3)hotelNeon(Ht,k,col);}   /* вывеска — кадром позже дома, не в одном с ним */
    return;}
  const hr=((G.t%CEL_DAY)/CEL_DAY)*24,fa=clamp((Z-.3)/.2,0,1);
  const pass=gpuScene();if(!pass)return;
  const B=hotelBake(sd,col);if(!B)return;
  const mask=hotelWinLit(sd,hotelLitFrac(Ht.by,hr),Math.floor(G.t/60/6));
  const ox=x-(4+HR_W/2)*k,oy=y-(HR_TOP+HR_FH/2)*k;   /* якорь — центр фасада */
  /* вывеска — там же, где был fillText по центру на базовой линии oy+6k */
  const S=fa>0?hotelNeon(Ht,k,col):null;
  const cw=B.cv.w,ph=B.ph,lit=[];
  for(let n=0;n<mask.length;n++)if(B.win[n]&&mask[n]==="1")lit.push(B.win[n]);
  {
    /* кусок атласа [x0,y0,x1,y1] (пиксели половины; dy — какая половина) → прямоугольник
       на экране той же долей дома */
    const th=B.cv.h,sx=w/cw,sy=h/ph,L=q=>q;
    const R=(Q,a,dy)=>Q.map(q=>({x:ox+(q[0]+q[2])/2*sx,y:oy+(q[1]+q[3])/2*sy,w:(q[2]-q[0])*sx,h:(q[3]-q[1])*sy,a,
      u0:q[0]/cw,v0:(q[1]+dy)/th,u1:q[2]/cw,v1:(q[3]+dy)/th}));
    const on=ph+HR_GAP,all=[[0,0,cw,ph]];
    /* краска: погашенный дом, поверх — горящие окна (стекло непрозрачно, замена точная) */
    gpuImage(pass,L(B.cv),R(all,1,0).concat(R(lit,1,on)),{lod:HOTEL_LOD});
    /* свет стёкол: у погашенного дома в рамках его нет — горящие просто прибавляются */
    gpuImage(pass,L(B.em),R(all,HOTEL_EM,0).concat(R(lit,HOTEL_EM,on)),{blend:"add",lod:HOTEL_LOD});
    if(S){   /* отсвет вывески в рамке есть у обоих: погашенный вычесть, горящий прибавить */
      const a=HOTEL_SHEEN*fa,top=lit.filter(q=>q[1]<B.shY);
      gpuImage(pass,L(B.sh),R(all,a,0),{blend:"add",lod:HOTEL_LOD});
      if(top.length){gpuImage(pass,L(B.sh),R(top,a,0),{blend:"sub",lod:HOTEL_LOD});gpuImage(pass,L(B.sh),R(top,a,on),{blend:"add",lod:HOTEL_LOD});}
    }
  }
  if(S)neonDraw(pass,S,x,oy+6*k,fa,HOTEL_NEON*fa);
}
function hotelInteract(sh){
  const Ht=hotelHere();if(!Ht)return false;
  if(Math.hypot(sh.x-Ht.x,sh.y-Ht.y)>150)return false;
  const board=Ht.by==="gt"?" · МЕСТ НЕТ":"";
  const shown=cue(Ht.name+board+"\nДЕЙСТВИЕ — К СТОЙКЕ",CUE_ACT);
  if(shown&&actEdge)hotelDesk(Ht);
  return true;
}
function hotelDesk(Ht){
  const hm=stat().hullMax,low=G.hull<hm/3;
  const free=low;                                   /* доброта: ниже трети — даром */
  if(!free&&G.credits<HOTEL_NIGHT){say((Ht.by==="gt"?"«Мест нет.»":"«Номер — "+HOTEL_NIGHT+" кр.»")+"\nне хватает",110);return;}
  if(!free)G.credits-=HOTEL_NIGHT;
  const heal=Math.round(hm*.1);G.hull=Math.min(hm,G.hull+heal);
  const greet=Ht.by==="gt"?"«Мест нет. …Для вас найдём.»":Ht.by==="co"?"«Номер категории Партнёр™. Завтрак — отдельно.»":
    Ht.by==="or"?"«Отбой в 22:00. Подъём в 6:00.»":Ht.by==="km"?"«Ключ под ковриком, мы на собрании.»":
    Ht.by==="ra"?"«Ложись где свободно, брат.»":"«Ваша капсула рассчитана.»";
  logAdd("good",Ht.name+": ночь в номере"+(free?" — даром, «потом заплатите»":" · −"+HOTEL_NIGHT+" кр")+" · корпус +"+heal+" за ночь стоянки");
  say(greet+(free?"\n«…потом заплатите»":""),150);
  if(typeof kinoHere==="function"&&kinoHere())peopleLine("в холле афиша: сегодня кино. Идите, пока не началось.","портье",false);
}
