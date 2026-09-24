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
let HOTEL_BAKE=null;
/* Хрущёвка печётся целиком в свой холст (правило «что не движется — рисуется раз»):
   перепекается, только когда меняется набор горящих окон, — раз в несколько секунд.
   Вид три четверти, как у макета на столе: фасад, торец в тени, вальмовая крыша
   шифером, трубы, антенны на проволоке.
   Три слоя (16/n): cv — краска без света; em — свет стёкол, узкий ореол в долю окна
   (свечение принадлежит окну, шире — дело блума, и его мало); sh — тот же дом под
   тёплым светом вывески сверху, сходит на нет ко второму этажу */
const HOTEL_EM=1,HOTEL_NEON=1.4,HOTEL_SHEEN=.8;
function hotelBake(sd,mask,col){
  const ck=col.join();
  if(HOTEL_BAKE&&HOTEL_BAKE.sd===sd&&HOTEL_BAKE.mask===mask&&HOTEL_BAKE.ck===ck)return HOTEL_BAKE;
  const mk=k=>(HOTEL_BAKE&&HOTEL_BAKE[k])||document.createElement("canvas");
  const cv=mk("cv"),em=mk("em"),shc=mk("sh");
  for(const q of [cv,em,shc]){q.width=Math.ceil(HR_BW*HR_PX);q.height=Math.ceil(HR_BH*HR_PX);}
  const c=cv.getContext("2d");c.setTransform(HR_PX,0,0,HR_PX,0,0);c.clearRect(0,0,HR_BW,HR_BH);
  const e=em.getContext("2d");e.setTransform(HR_PX,0,0,HR_PX,0,0);e.clearRect(0,0,HR_BW,HR_BH);
  e.shadowColor="rgba(255,176,96,.7)";e.shadowBlur=1.6;   /* в пикселях холста, мимо трансформа: ~десятая окна */
  const r=rng((sd^0x5A11)>>>0),T0=HR_TOP,FW=HR_W,FH=HR_FH,cw=FW/HR_COLS,rh=FH/HR_ROWS,X0=4;
  const CURT=["#e8b86a","#f0d49a","#d98d5a","#c9e0a0","#f4c2a8","#b8c8e8","#e0a0a0"];
  const ENTR=[3,8];
  /* окно: откос в тени, стекло — тёмное с бликом или тёплое со шторами, белая рама */
  const winAt=(x,y,w,h,on,hh,big)=>{
    c.fillStyle="rgba(40,34,26,.55)";c.fillRect(x-.5,y-.5,w+1,h+1);
    if(on){
      const g=c.createLinearGradient(x,y,x,y+h);g.addColorStop(0,"#ffe3a6");g.addColorStop(1,"#f2a95a");
      c.fillStyle=g;c.fillRect(x,y,w,h);
      c.fillStyle=CURT[hh%CURT.length];c.globalAlpha=.8;
      c.fillRect(x,y,w*.28,h);c.fillRect(x+w*.72,y,w*.28,h);c.globalAlpha=1;
      if(hh%7===0){c.fillStyle="rgba(60,40,30,.55)";c.beginPath();c.arc(x+w*.52,y+h*.45,h*.14,0,TAU);c.fill();c.fillRect(x+w*.42,y+h*.58,w*.2,h*.42);}
      e.fillStyle="rgba(255,168,80,.5)";e.fillRect(x,y,w,h);   /* лампа за шторой, оранжевее стекла: плечо тона белит, тепло держит цвет; переплёт не светит */
      e.save();e.globalCompositeOperation="destination-out";e.shadowBlur=0;e.fillStyle="#000";
      e.fillRect(x+w*.5-.22,y,.45,h);if(big)e.fillRect(x,y+h*.32,w,.4);
      if(hh%7===0){e.globalAlpha=.6;e.beginPath();e.arc(x+w*.52,y+h*.45,h*.14,0,TAU);e.fill();e.fillRect(x+w*.42,y+h*.58,w*.2,h*.42);}
      e.restore();
    }else{
      const g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,"#3a4550");g.addColorStop(1,"#1a2027");
      c.fillStyle=g;c.fillRect(x,y,w,h);
      c.fillStyle="rgba(180,200,220,.18)";c.beginPath();c.moveTo(x,y+h*.6);c.lineTo(x+w*.5,y);c.lineTo(x+w*.75,y);c.lineTo(x,y+h);c.closePath();c.fill();
    }
    c.fillStyle="#f3efe4";
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
  for(let j=0;j<HR_ROWS;j++)for(let i=0;i<HR_SIDE;i++){
    const n=HR_COLS*HR_ROWS+j*HR_SIDE+i,p=sideP((i+.3)/HR_SIDE,(j+.24)/HR_ROWS);
    c.save();c.translate(p[0],p[1]);c.transform(1,-SK/SW,0,1,0,0);
    e.save();e.translate(p[0],p[1]);e.transform(1,-SK/SW,0,1,0,0);e.globalAlpha=.7;   /* торец в тени: стекло под углом, свет глуше */
    winAt(0,0,SW/HR_SIDE*.4,rh*.52,mask[n]==="1",hashi(n,sd,0x407E)>>>0,false);c.restore();e.restore();
  }
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
  for(let j=0;j<HR_ROWS;j++)for(let i=0;i<HR_COLS;i++){
    const n=j*HR_COLS+i,on=mask[n]==="1",hh=hashi(n,sd,0x407E)>>>0,x=X0+i*cw,y=T0+j*rh;
    if(ENTR.includes(i)){   /* лестничная клетка — узкое окно между этажами */
      if(j<HR_ROWS-1){c.fillStyle="rgba(40,34,26,.5)";c.fillRect(x+cw*.2,y+rh*.62,cw*.6,rh*.3);
        c.fillStyle=on?"#e9d8a0":"#2c343b";c.fillRect(x+cw*.24,y+rh*.66,cw*.52,rh*.22);
        if(on){e.fillStyle="rgba(240,220,160,.4)";e.fillRect(x+cw*.24,y+rh*.66,cw*.52,rh*.22);}
        c.fillStyle="#f3efe4";c.fillRect(x+cw*.5-.2,y+rh*.66,.4,rh*.22);}
      continue;
    }
    winAt(x+cw*.2,y+rh*.2,cw*.6,rh*.56,on,hh,(hh>>>3)%3!==0);
  }
  /* застеклённые балконы — у каждого хозяина свой цвет */
  const BAL=[["#4d9a8e","#2f6f66"],["#a3353a","#6e2226"],["#7d8b97","#56626c"],["#5b8cc0","#3b6690"],["#7a563a","#553a26"],["#d8d0b0","#a8a080"],["#c8508a","#8c3060"]];
  for(let j=0;j<HR_ROWS-1;j++)for(let i=0;i<HR_COLS;i++){
    if(ENTR.includes(i))continue;
    const hh=hashi(i*7+j,sd,0xBA1C)>>>0;if(hh%4)continue;
    const on=mask[j*HR_COLS+i]==="1",[ca,cb]=BAL[(hh>>>5)%BAL.length];
    const x=X0+i*cw-cw*.06,y=T0+j*rh+rh*.14,w=cw*1.12,h=rh*.86;
    c.fillStyle="rgba(0,0,0,.35)";c.fillRect(x+w,y+1,1.2,h);
    c.fillStyle=cb;c.fillRect(x,y+h*.55,w,h*.45);
    c.fillStyle=ca;c.fillRect(x,y+h*.55,w,h*.08);
    c.fillStyle=on?"#f7cf85":"#33404a";c.fillRect(x+.4,y,w-.8,h*.55);
    if(on){e.fillStyle="rgba(255,206,128,.42)";e.fillRect(x+.4,y,w-.8,h*.55);}
    c.fillStyle="#f3efe4";for(let k=0;k<=4;k++)c.fillRect(x+.4+k*(w-1.2)/4,y,.4,h*.55);
    c.fillRect(x,y,w,.5);
    c.fillStyle=cb;c.fillRect(x-.3,y-1,w+.6,1);
  }
  for(let k=0;k<5;k++){   /* кондиционеры */
    const i=(hashi(k,sd,0xAC)>>>0)%HR_COLS,j=(hashi(k,sd,0xAD)>>>0)%HR_ROWS;if(ENTR.includes(i))continue;
    const x=X0+i*cw+cw*.78,y=T0+j*rh+rh*.66;
    c.fillStyle="#e8e6e0";c.fillRect(x,y,cw*.28,rh*.22);
    c.strokeStyle="rgba(80,80,80,.7)";c.lineWidth=.3;c.beginPath();c.arc(x+cw*.14,y+rh*.11,rh*.07,0,TAU);c.stroke();
  }
  {const i=1+(hashi(1,sd,0x5E11)>>>0)%(HR_COLS-2),j=1+(hashi(2,sd,0x5E11)>>>0)%3;   /* «ПРОДАЮ» */
   if(!ENTR.includes(i)){const x=X0+i*cw+cw*.18,y=T0+j*rh+rh*.3;c.fillStyle="#fbfbf6";c.fillRect(x,y,cw*.64,rh*.22);
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
  /* отсвет вывески: дом, умноженный на её цвет, от конька до второго этажа */
  const s=shc.getContext("2d");s.setTransform(1,0,0,1,0,0);s.globalCompositeOperation="source-over";
  s.clearRect(0,0,shc.width,shc.height);s.drawImage(cv,0,0);
  const gs=s.createLinearGradient(0,6*HR_PX,0,(T0+rh*1.4)*HR_PX);gs.addColorStop(0,rgba(col,1));gs.addColorStop(.45,rgba(col.map(v=>v*.35),1));gs.addColorStop(1,"#000");
  s.globalCompositeOperation="multiply";s.fillStyle=gs;s.fillRect(0,0,shc.width,shc.height);
  s.globalCompositeOperation="destination-in";s.drawImage(cv,0,0);s.globalCompositeOperation="source-over";
  HOTEL_BAKE={sd,mask,ck,cv,em,sh:shc,ver:((HOTEL_BAKE&&HOTEL_BAKE.ver)|0)+1};return HOTEL_BAKE;
}
/* неон (16/n): буква — трубка. Альбедо — всё имя тёмным стеклом (мёртвые буквы видны
   трубкой без газа), эмиссия — живые буквы: насыщенный цвет трубки с ореолом уже
   просвета между буквами и бледное горячее ядро тоньше штриха. Печётся в пикселях
   устройства под размер шрифта на экране — ложится один к одному */
const HOTEL_SIGN_FULL={gt:"ГОСТИНИЦА «КОСМОС»"};
let HOTEL_SIGNB=null;
function hotelSignBake(name,full,F,col){
  const d=DPR,key=name+"|"+full+"|"+F+"|"+col.join()+"|"+d;
  if(HOTEL_SIGNB&&HOTEL_SIGNB.key===key)return HOTEL_SIGNB;
  const al=(HOTEL_SIGNB&&HOTEL_SIGNB.al)||document.createElement("canvas"),em=(HOTEL_SIGNB&&HOTEL_SIGNB.em)||document.createElement("canvas");
  const Fd=F*d,fb="bold "+Fd+"px ui-monospace,monospace",fr=Fd+"px ui-monospace,monospace";
  let a=al.getContext("2d");a.font=fb;
  const tw=Math.ceil(a.measureText(full).width),pad=Math.ceil(3*d),base=pad+Math.ceil(Fd*.82);
  for(const q of [al,em]){q.width=tw+pad*2;q.height=base+Math.ceil(Fd*.28)+pad;}
  a=al.getContext("2d");a.font=fb;a.textAlign="left";a.textBaseline="alphabetic";
  a.fillStyle="rgba(78,64,62,.9)";a.fillText(full,pad,base);
  const e=em.getContext("2d");e.font=fb;e.textAlign="left";e.textBaseline="alphabetic";
  e.shadowColor=rgba(col,.85);e.shadowBlur=Math.max(1,Fd*.14);e.fillStyle=rgba(col,1);e.fillText(name,pad,base);
  e.shadowBlur=0;e.shadowColor="rgba(0,0,0,0)";e.font=fr;
  e.fillStyle=rgba(col.map(v=>v+(255-v)*.62),1);e.fillText(name,pad,base);
  HOTEL_SIGNB={key,al,em,tw,pad,base};return HOTEL_SIGNB;
}
function drawHotel(zx,zy,Z){
  const Ht=hotelHere();if(!Ht)return;
  const x=zx(Ht.x),y=zy(Ht.y),k=Math.max(.08,Z*.42),   /* втрое меньше первой пробы (автор 19.09) */
  w=HR_BW*k,h=HR_BH*k;
  if(x<-w||x>W+w||y<-h*1.5||y>H+h)return;
  const sd=G.sx*31+G.sy,hr=((G.t%CEL_DAY)/CEL_DAY)*24;
  const col=(typeof laneLampCol==="function")?laneLampCol(Ht.by):[255,190,110],fa=clamp((Z-.3)/.2,0,1);
  const B=hotelBake(sd,hotelWinLit(sd,hotelLitFrac(Ht.by,hr),Math.floor(G.t/60/6)),col);
  const ox=x-(4+HR_W/2)*k,oy=y-(HR_TOP+HR_FH/2)*k;   /* якорь — центр фасада */
  const F=Math.round(8*Math.max(1,k)*UIK),S=fa>0?hotelSignBake(Ht.name,Ht.name===HOTEL_SIGN.gt?HOTEL_SIGN_FULL.gt:Ht.name,F,col):null;
  /* вывеска: там же, где был fillText по центру на базовой линии oy+6k, — в целых пикселях устройства */
  const d=DPR,sl=S?Math.round((x-S.tw/2/d-S.pad/d)*d)/d:0,st=S?Math.round((oy+6*k-S.base/d)*d)/d:0,sw=S?S.al.width/d:0,sh=S?S.al.height/d:0;
  const pass=gpuScene();
  if(pass){
    const v=B.ver,L=q=>gpuCvLevel(q,v,w*d),R=a=>[{x:ox+w/2,y:oy+h/2,w,h,a}];
    gpuImage(pass,L(B.cv),R(1),{ver:v});
    gpuImage(pass,L(B.em),R(HOTEL_EM),{blend:"add",ver:v});
    if(S){
      gpuImage(pass,L(B.sh),R(HOTEL_SHEEN*fa),{blend:"add",ver:v});
      const r=a=>[{x:sl+sw/2,y:st+sh/2,w:sw,h:sh,a}];
      gpuImage(pass,S.al,r(fa),{ver:S.key});
      gpuImage(pass,S.em,r(HOTEL_NEON*fa),{blend:"add",ver:S.key});
    }
    return;
  }
  ctx.drawImage(B.cv,ox,oy,w,h);
  ctx.save();ctx.globalCompositeOperation="lighter";ctx.drawImage(B.em,ox,oy,w,h);
  if(S){ctx.globalAlpha=HOTEL_SHEEN*fa;ctx.drawImage(B.sh,ox,oy,w,h);ctx.globalCompositeOperation="source-over";
    ctx.globalAlpha=fa;ctx.drawImage(S.al,sl,st,sw,sh);ctx.globalCompositeOperation="lighter";ctx.drawImage(S.em,sl,st,sw,sh);}
  ctx.restore();
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
