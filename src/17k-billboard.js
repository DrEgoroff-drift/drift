/* ══════════════ рекламные щиты на подъезде (M460, DESIGN-life §3.2, review §4.2) ══════════════
   Неон — свет с источником: ферма, панель, надпись в три штриха (свечение,
   тело, добела раскалённая середина) и ОДНА бегущая строка. Строка полезна:
   это настоящая цена у соседей — «ТИТАН 41 У ПАРТНЁРА В 2 ПРЫЖКАХ — ВЫГОДНО
   КАК НИКОГДА», — сказанная голосом хозяина земли. У ГЛАВТРАССЫ одна буква
   всегда мертва, и раз в минуту вывеска гудит (провал на 200 мс) — это
   единственное разрешённое мигание в кадре.

   Щит есть у людной станции (жизнь ≥ .45), сбоку полосы у второй пары бакенов.
   Строка пересчитывается раз в десять секунд игры. */
const BB_TITLE={gt:"ТРАССА — ДЕЛО КАЖДОГО",co:"ЗОНА ПАРТНЁРА™",or:"ОРДНУНГ · ПОРЯДОК",km:"LA COMMUNE",ra:"РАССВЕТ · СВОИ",hf:"HIGH-FRONT"};
const BB_CACHE={key:"",line:""};
function bbHere(){
  const sys=G.sys;if(!sys||!sys.station||typeof sysLane!=="function")return null;
  const P=sysLane(sys);if(!P||P.life<.45)return null;
  const d=LANE_DOCK+LANE_GAP*1.8;
  return {x:P.st.x+P.ux*d+P.uy*200*P.side,y:P.st.y+P.uy*d-P.ux*200*P.side,a:Math.atan2(P.uy,P.ux),by:P.by,P};
}
/* лучшая цена у соседей: товар, станция, сколько секторов */
function bbDeal(){
  let best=null;
  for(let dx=-3;dx<=3;dx++)for(let dy=-3;dy<=3;dy++){
    if(!dx&&!dy)continue;const sx=G.sx+dx,sy=G.sy+dy;
    if(!starAt(sx,sy))continue;const s=getSystem(sx,sy);if(!s.station)continue;
    /* база станции, а не marketFor: тот заводит запись рынка — щит не должен трогать мир */
    const M=s.station.prices||{};
    for(const k of TRADE_KEYS){if(!M[k])continue;const v=M[k]/Math.max(1,RES[k].price);if(!best||v>best.v)best={v,k,p:M[k],st:s.station.name,d:Math.max(Math.abs(dx),Math.abs(dy))};}
  }
  return best;
}
function bbLine(by){
  const key=G.sx+","+G.sy+","+Math.floor(G.t/600);
  if(BB_CACHE.key===key)return BB_CACHE.line;
  const D=bbDeal();let L;
  /* ГЛАВТРАССА через раз вешает план (M503) */
  const gp=(by==="gt"&&(Math.floor(G.t/600)&1)&&typeof gosBbLine==="function")?gosBbLine():null;
  if(gp)L=gp;
  else if(!D)L="СВОБОДНОЕ МЕСТО ДЛЯ ВАШЕЙ РЕКЛАМЫ";
  else{
    const g=RES[D.k].ru.toUpperCase(),n=D.d+" "+pl3(D.d,"ПРЫЖОК","ПРЫЖКА","ПРЫЖКОВ");
    L=by==="co"?g+" "+D.p+" У ПАРТНЁРА В "+D.d+" "+pl3(D.d,"ПРЫЖКЕ","ПРЫЖКАХ","ПРЫЖКАХ")+" — ВЫГОДНО КАК НИКОГДА™ · ДО КОНЦА АКЦИИ 00:00:03":
      by==="or"?"ЦЕНА НА "+g+": "+D.p+" КР · «"+D.st.toUpperCase()+"» · "+n+" · ПРОВЕРЕНО":
      by==="km"?g+" — "+D.p+", НО ДЕЛО НЕ В ЦЕНЕ · «"+D.st.toUpperCase()+"» · ОБЕД С 13 ДО 14":
      by==="ra"?"БРАТ! "+g+" ПО "+D.p+" НА «"+D.st.toUpperCase()+"» — ЗАХОДИ":
      by==="hf"?g+":"+D.p+" @"+D.st.toUpperCase()+" Δ"+D.d+" // РЕКОМЕНДОВАНО":
      "ТОВАРИЩ! "+g+" — "+D.p+" КР НА «"+D.st.toUpperCase()+"» · "+n;
  }
  BB_CACHE.key=key;BB_CACHE.line=L;
  return L;
}
/* заголовок щита; у ГЛАВТРАССЫ одна буква мертва (пробел — трубка без газа) */
function bbTitle(by){
  let T=BB_TITLE[by]||BB_TITLE.gt;
  if(by==="gt"){const i=2+hashi(G.sx,G.sy,0xDEAD)%(T.length-3);if(T[i]!==" ")T=T.slice(0,i)+" "+T.slice(i+1);}
  return T;
}
/* 16/n: щит на видеокарте. Панель (ферма, рамка, кумач плана) печётся раз в пикселях
   устройства; заголовок — общий неон 17k0 (буква — трубка, эмиссия явно, ядро только на
   толстом штрихе); бегущая строка — полоса текста, окно листает её по u. Ничего светлого
   не ложится на #c, emit() щита не видит */
const BB_NEON=1.2,BB_TICK=1;
const BB_BAKE={pan:new Map(),str:new Map(),cur:null,ps:0};   // печи по ключу (bakeKeep); cur — панель последнего кадра
/* выпечка — GPU-холст через prebake (17a0): щит за краем экрана печётся заранее, в бюджете
   PB_MS/PB_PX, и выходит на глаза готовым; sync — щит уже виден, а показать нечего.
   Готовое держит bakeKeep; устройство поднято заново — старое бросаем, печём снова */
function bbKeep(M,key,job,sync){
  let v=M.get(key);
  if(v&&v.B&&v.B.dev===GPU.dev)return bakeKeep(M,key,6,()=>v);
  if(v){M.delete(key);v.drop();}
  v=prebake(key,job,sync);
  return v&&v.B?bakeKeep(M,key,6,()=>v):null;
}
function bbPanelKey(s,GP){return "bbp|"+s+"|"+DPR+"|"+(GP?GP.n+"|"+GP.k+"|"+GP.svodka+"|"+GP.price:"");}
function bbPanelBake(s,GP,sync){
  const d=DPR,gk=GP?GP.n+"|"+GP.k+"|"+GP.svodka+"|"+GP.price:"",key=bbPanelKey(s,GP);
  return bbKeep(BB_BAKE.pan,key,function*(){return bbPanelMake(s,GP,d,key,gk);},sync);
}
function bbPanelMake(s,GP,d,key,gk){
  const pw=120*s,ph=40*s,cw=Math.ceil((pw+2)*d),ch=Math.ceil((ph*1.6+2)*d);
  const B=gpuBake(cw,ch,g=>{
  g.setTransform(d,0,0,d,(pw/2+1)*d,(ph/2+1)*d);   /* начало — середина панели */
  g.strokeStyle="rgba(150,164,180,.6)";g.lineWidth=1;
  g.beginPath();g.moveTo(-pw*.3,ph*.5);g.lineTo(-pw*.3,ph*1.1);g.moveTo(pw*.3,ph*.5);g.lineTo(pw*.3,ph*1.1);g.stroke();
  g.fillStyle="#0e1217";g.fillRect(-pw/2,-ph/2,pw,ph);
  g.strokeStyle="rgba(40,48,58,.9)";g.strokeRect(-pw/2,-ph/2,pw,ph);
  if(GP){
    const px=-pw/2+3,py=ph*.02,qw=pw-6,qh=ph*.62;
    g.fillStyle="#0e1217";g.fillRect(-pw/2,ph*.5,pw,ph*.2);
    g.fillStyle="rgba(150,26,22,.96)";g.fillRect(px,py,qw,qh);
    g.fillStyle="rgba(255,120,90,.18)";g.fillRect(px,py,qw,Math.max(1,qh*.08));
    const sx0=px+qh*.5,sy0=py+qh*.5,sr=qh*.34;
    g.fillStyle="#f2c14e";g.beginPath();
    for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i&1?sr*.42:sr;i?g.lineTo(sx0+Math.cos(a)*rr,sy0+Math.sin(a)*rr):g.moveTo(sx0+Math.cos(a)*rr,sy0+Math.sin(a)*rr);}
    g.closePath();g.fill();
    g.textAlign="left";g.textBaseline="middle";g.fillStyle="#fff4e0";
    g.font="bold "+Math.round(8.5*s)+"px ui-monospace,monospace";
    g.fillText("ПЛАН: "+GP.n+" ЕД. "+RES[GP.k].ru.toUpperCase(),px+qh,py+qh*.3,qw-qh-3);
    g.fillStyle="rgba(255,230,200,.82)";g.font=Math.round(6.5*s)+"px ui-monospace,monospace";
    g.fillText("ДО СВОДКИ "+GP.svodka+" · ПО "+GP.price+" КР · СДАВАТЬ ЗДЕСЬ",px+qh,py+qh*.72,qw-qh-3);
  }
  });
  return {B,key,s,d,gk,ox:pw/2+1,oy:ph/2+1,w:cw/d,h:ch/d,drop(){gpuBakeDrop(B);}};
}
/* полоса бегущей строки — в пикселях устройства, без мипов: идёт пиксель в пиксель */
function bbStripBake(L,Fp,col,sync){
  const d=DPR,key="bbs|"+L+"|"+Fp+"|"+d+"|"+col.join();
  return bbKeep(BB_BAKE.str,key,function*(){
    const f=Fp*d+"px ui-monospace,monospace",tw=Math.max(1,Math.ceil(gcMeasure(f,L).width)),th=Math.ceil(Fp*1.6*d);
    const B=gpuBake(tw,th,g=>{
      g.font=f;g.textAlign="left";g.textBaseline="middle";
      g.fillStyle=rgba(mixc(col,[255,255,255],.3),.85);g.fillText(L,0,th/2);
    },{mips:false});
    return {B,key,P:tw/d,h:th/d,drop(){gpuBakeDrop(B);}};
  },sync);
}
function bbDrawGpu(pass,B,x,y,s,col,rd,Z){
  const d=DPR,px=v=>Math.round(v*d)/d;
  if(rd<=0){
    const w=Math.max(6,120*Z),h=Math.max(2,40*Z);
    gpuShapes(pass,[[0,x-w/2,y-h/2,x+w/2,y+h/2,0,0,14,18,23,1],[0,x-w/2+1,y-h*.25,x+w/2-1,y-h*.25+Math.max(1,h*.2),0,0,col[0],col[1],col[2],.55]]);
    return;
  }
  const pw=120*s,ph=40*s,GP=(typeof gosBbPlan==="function")?gosBbPlan(B.by):null;
  /* панель: в покое — печь ровно под масштаб (рамка и буквы пиксель в пиксель); пока зум
     едет — последняя печь в нужном масштабе: сто печей за проезд не нужны */
  const gk=GP?GP.n+"|"+GP.k+"|"+GP.svodka+"|"+GP.price:"",still=BB_BAKE.ps===s,c0=BB_BAKE.cur;BB_BAKE.ps=s;
  /* старая печь годна показать, пока новая печётся за кадром (сменился план, зум встал) */
  const show=c0&&c0.d===DPR&&c0.B&&c0.B.dev===GPU.dev;
  let Pn=(!still&&show&&c0.gk===gk)?c0:bbPanelBake(s,GP,!show);
  if(Pn)BB_BAKE.cur=Pn;else Pn=show?c0:null;
  if(!Pn)return;
  const q=s/Pn.s,l=px(x-Pn.ox*q),t=px(y-Pn.oy*q);
  gpuImage(pass,Pn.B,[{x:l+Pn.w*q/2,y:t+Pn.h*q/2,w:Pn.w*q,h:Pn.h*q,a:rd}]);
  const buzz=B.by==="gt"&&((G.t/60)%60)<.2?.35:1;
  const N=neonBake("bb",bbTitle(B.by),BB_TITLE[B.by]||BB_TITLE.gt,Math.round(11*s),col,"middle");
  neonDraw(pass,N,x,y-ph*.18,rd,BB_NEON*buzz*rd);
  if(GP)return;
  /* бегущая строка: окно (x-pw/2+4 … +pw-8) показывает полосу с отступа off, по кругу */
  const S=bbStripBake(bbLine(B.by)+"   ·   ",Math.round(8*s),col,true);if(!S||S.P<2)return;
  const ww=pw-8,off=(G.t*.6*s)%S.P,yc=px(y+ph*.25-S.h/2)+S.h/2,R=[];
  let u=off,xx=x-pw/2+4,rem=ww;
  while(rem>.01&&R.length<8){const len=Math.min(S.P-u,rem);R.push({x:xx+len/2,y:yc,w:len,h:S.h,a:BB_TICK*rd,u0:u/S.P,u1:(u+len)/S.P});xx+=len;rem-=len;u=0;}
  gpuImage(pass,S.B,R,{blend:"add"});
}
/* щит на подлёте (за краем, в экране от края): печём заранее, в бюджете prebake — панель,
   бегущую строку и неон заголовка (neonBake тот же, только позван раньше) */
function bbAhead(B,s,col){
  const GP=(typeof gosBbPlan==="function")?gosBbPlan(B.by):null;
  if(!bbPanelBake(s,GP,false))return;
  const F=Math.round(11*s),T=bbTitle(B.by),full=BB_TITLE[B.by]||BB_TITLE.gt;
  prebake("bbn|"+T+"|"+F+"|"+col.join()+"|"+DPR,function*(){return neonBake("bb",T,full,F,col,"middle");},false);
  if(!GP)bbStripBake(bbLine(B.by)+"   ·   ",Math.round(8*s),col,false);
}
function drawBillboard(zx,zy,Z){
  const B=bbHere();if(!B)return;
  /* щит читают: мельче мерки борта не сжимается (кегль × UIK, как всё, что читает игрок) */
  const x=zx(B.x),y=zy(B.y),s=Math.max(1,clamp(Z,.6,1.5))*UIK;
  const col=(typeof laneLampCol==="function")?laneLampCol(B.by):[255,190,110];
  /* издали щит — табличка по масштабу мира, без букв: читаемый кегль на ×0.16 ложится
     поверх очереди полосы и отеля кашей (снимок автора 19.09). Буквы проявляются к ×0.5 */
  const rd=clamp((Z-.3)/.2,0,1);
  if(x<-160*s||x>W+160*s||y<-120*s||y>H+120*s){
    if(rd>0&&GPU.dev&&pbOnScreen(x-160*s,y-120*s,320*s,240*s,.6))bbAhead(B,s,col);
    return;
  }
  const pass=gpuScene();if(!pass)return;   /* 2D-пути у щита нет (без видеокарты щита не видно) */
  bbDrawGpu(pass,B,x,y,s,col,rd,Z);
}
