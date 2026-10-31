/* ══════════════ рекламные щиты на подъезде (M460, DESIGN-life §3.2, review §4.2) ══════════════
   Неон — свет с источником: ферма, панель, надпись в три штриха (свечение,
   тело, добела раскалённая середина) и ОДНА бегущая строка. Строка полезна:
   это настоящая цена у соседей — «ТИТАН 41 У ПАРТНЁРА В 2 ПРЫЖКАХ — ВЫГОДНО
   КАК НИКОГДА», — сказанная голосом хозяина земли. У ГЛАВТРАССЫ одна буква
   всегда мертва, и раз в минуту вывеска гудит (провал на 200 мс) — это
   единственное разрешённое мигание в кадре.

   Щиты у людной станции (жизнь ≥ .45), сбоку полосы у второй пары бакенов: 1–3 по жизни
   (M460 rest). Строка пересчитывается раз в десять секунд игры. */
const BB_TITLE={gt:"ТРАССА — ДЕЛО КАЖДОГО",co:"ЗОНА ПАРТНЁРА™",or:"ОРДНУНГ · ПОРЯДОК",km:"LA COMMUNE",ra:"РАССВЕТ · СВОИ",hf:"HIGH-FRONT"};
const BB_CACHE=new Map();   /* ключ sx,sy,i,тик → строка; щиты врут порознь */
/* сколько щитов: жизнь .45 → 1, .65 → 2, .85 → 3 (бюджет DESIGN-life §4) */
function bbCount(life){return life>=.85?3:life>=.65?2:life>=.45?1:0;}
/* все щиты подъезда; bbHere — первый (план ГЛАВТРАССЫ, 17k1) */
function bbAll(){
  const sys=G.sys;if(!sys||!sys.station||typeof sysLane!=="function")return [];
  const P=sysLane(sys),n=bbCount(P&&P.life);if(!n)return [];
  const a=Math.atan2(P.uy,P.ux),out=[];
  for(let i=0;i<n;i++){
    const d=LANE_DOCK+LANE_GAP*(1.55+i*.55),lat=(200-i*95)*P.side;
    out.push({x:P.st.x+P.ux*d+P.uy*lat,y:P.st.y+P.uy*d-P.ux*lat,a,by:P.by,P,i});
  }
  return out;
}
function bbHere(){const L=bbAll();return L.length?L[0]:null;}
/* лучшая цена у соседей: товар, станция, сколько секторов.
   i — номер щита на подъезде: часть врёт (M460 fork B) — цена с прошлых сводок /
   сдвинутая; вилка как у записей маршрута (12r), и нередко «выгоднее, чем есть». */
function bbDeal(i){
  let best=null;
  for(let dx=-3;dx<=3;dx++)for(let dy=-3;dy<=3;dy++){
    if(!dx&&!dy)continue;const sx=G.sx+dx,sy=G.sy+dy;
    if(!starAt(sx,sy))continue;const s=getSystem(sx,sy);if(!s.station)continue;
    /* база станции, а не marketFor: тот заводит запись рынка — щит не должен трогать мир */
    const M=s.station.prices||{};
    for(const k of TRADE_KEYS){if(!M[k])continue;const v=M[k]/Math.max(1,RES[k].price);if(!best||v>best.v)best={v,k,p:M[k],st:s.station.name,d:Math.max(Math.abs(dx),Math.abs(dy))};}
  }
  if(!best||i==null)return best;
  /* ~38 % щитов: семя места и номера, не жизни — иначе все три врали бы разом */
  if(((hashi(G.sx,G.sy,(i|0)+0xBBAD)>>>0)%100)>=38)return best;
  const r=rng(hashi(G.sx,G.sy,(i|0)*19+7,Math.floor(G.t/(HOLD_SHIFT||1800))|0));
  const age=1+Math.floor(r()*6),fork=Math.min(.4,age*.03);
  /* чаще вверх: реклама обещает лучше, чем стоит у соседа сейчас */
  const bait=r()<.62,mid=bait?(1+fork*(.45+r()*.55)):(1+(r()-.5)*2*fork);
  const p=Math.max(1,Math.round(best.p*mid));
  return {v:best.v*mid,k:best.k,p,st:best.st,d:best.d,lie:1,age,fork};
}
/* строка сводки голосом хозяина (M460): последнее, что рассказывают, не старше смены */
const BB_NEWS={gt:"СВОДКА: ",co:"НОВОСТИ ПАРТНЁРА™: ",or:"ЦИРКУЛЯР № ",km:"ГАЗЕТА «КОММУНА»: ",ra:"ГОВОРЯТ: ",hf:"FEED // "};
function bbNews(by){
  const L=G.news;if(!L||!L.length)return null;
  const n=L[L.length-1];if(!n||!n.ru||now()-n.t>HOLD_SHIFT)return null;
  let t=String(n.ru).toUpperCase();if(t.length>160)t=t.slice(0,158)+"…";
  const pre=BB_NEWS[by]||BB_NEWS.gt;
  return by==="or"?pre+(1+(hashi(n.t|0,7,0x0C)>>>0)%400)+": "+t:pre+t;
}
/* строка владения: ваша станция рядом сама себя рекламирует */
function bbHold(by){
  if(typeof rungOfCached!=="function")return null;
  let best=null;
  for(let dx=-3;dx<=3;dx++)for(let dy=-3;dy<=3;dy++){
    const sx=G.sx+dx,sy=G.sy+dy;if(!starAt(sx,sy))continue;
    const s=getSystem(sx,sy);if(!s||!s.station||rungOfCached(sx,sy)<1)continue;
    const d=Math.max(Math.abs(dx),Math.abs(dy));if(!best||d<best.d)best={d,s};
  }
  if(!best)return null;
  const nm=((G.names&&G.names[best.s.key])||best.s.station.name).toUpperCase();
  return by==="co"?"«"+nm+"» — ТОПЛИВО ЕСТЬ™ · ОДОБРЕНО ПАРТНЁРОМ":
    by==="hf"?nm+" // FUEL:OK":
    "СТАНЦИЯ «"+nm+"» — ТОПЛИВО ЕСТЬ"+(best.d?" · "+best.d+" "+pl3(best.d,"ПРЫЖОК","ПРЫЖКА","ПРЫЖКОВ"):" · ВЫ ЗДЕСЬ");
}
function bbLine(by,i){
  const key=G.sx+","+G.sy+","+(i|0)+","+Math.floor(G.t/600);
  if(BB_CACHE.has(key))return BB_CACHE.get(key);
  const D=bbDeal(i);let L;
  /* ГЛАВТРАССА через раз вешает план (M503) */
  const gp=(by==="gt"&&(Math.floor(G.t/600)&1)&&typeof gosBbLine==="function")?gosBbLine():null;
  /* три строки по очереди (M460): цена, сводка, ваше владение — пустая уступает цене */
  const slot=Math.floor(G.t/600)%3,N=slot===1?bbNews(by):null,H=slot===2?bbHold(by):null;
  if(gp)L=gp;
  else if(N)L=N;
  else if(H)L=H;
  else if(!D)L="СВОБОДНОЕ МЕСТО ДЛЯ ВАШЕЙ РЕКЛАМЫ";
  else{
    const g=RES[D.k].ru.toUpperCase(),n=D.d+" "+pl3(D.d,"ПРЫЖОК","ПРЫЖКА","ПРЫЖКОВ");
    /* врёт — вилка записей (как 12r), без слова «врёт»: щит не сознаётся */
    const px=(D.lie&&typeof routeForkTxt==="function")?routeForkTxt(D.p,D.fork):String(D.p);
    L=by==="co"?g+" "+px+" У ПАРТНЁРА В "+D.d+" "+pl3(D.d,"ПРЫЖКЕ","ПРЫЖКАХ","ПРЫЖКАХ")+" — ВЫГОДНО КАК НИКОГДА™ · ДО КОНЦА АКЦИИ 00:00:03":
      by==="or"?"ЦЕНА НА "+g+": "+px+" КР · «"+D.st.toUpperCase()+"» · "+n+" · ПРОВЕРЕНО":
      by==="km"?g+" — "+px+", НО ДЕЛО НЕ В ЦЕНЕ · «"+D.st.toUpperCase()+"» · ОБЕД С 13 ДО 14":
      by==="ra"?"БРАТ! "+g+" ПО "+px+" НА «"+D.st.toUpperCase()+"» — ЗАХОДИ":
      by==="hf"?g+":"+px+" @"+D.st.toUpperCase()+" Δ"+D.d+" // РЕКОМЕНДОВАНО":
      "ТОВАРИЩ! "+g+" — "+px+" КР НА «"+D.st.toUpperCase()+"» · "+n;
  }
  if(BB_CACHE.size>24)BB_CACHE.clear();
  BB_CACHE.set(key,L);
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
  /* стойки — телом 17c2m; на выпечке только табло */
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
  /* стойки телом под панелью (17c2m); панель с буквами — выпечка */
  bodyBb(x,y+ph*.55,s,B.x,B.y);
  const q=s/Pn.s,l=px(x-Pn.ox*q),t=px(y-Pn.oy*q);
  gpuImage(pass,Pn.B,[{x:l+Pn.w*q/2,y:t+Pn.h*q/2,w:Pn.w*q,h:Pn.h*q,a:rd}]);
  const buzz=B.by==="gt"&&((G.t/60)%60)<.2?.35:1;
  const N=neonBake("bb",bbTitle(B.by),BB_TITLE[B.by]||BB_TITLE.gt,Math.round(11*s),col,"middle");
  neonDraw(pass,N,x,y-ph*.18,rd,BB_NEON*buzz*rd);
  if(GP)return;
  /* бегущая строка: окно (x-pw/2+4 … +pw-8) показывает полосу с отступа off, по кругу */
  const S=bbStripBake(bbLine(B.by,B.i)+"   ·   ",Math.round(8*s),col,true);if(!S||S.P<2)return;
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
  neonAhead(T,full,F,col,"middle");
  if(!GP)bbStripBake(bbLine(B.by,B.i)+"   ·   ",Math.round(8*s),col,false);
}
/* корпус ловит цвет щита (Law 2, DESIGN-life §3.2): в R неон ложится на обшивку */
const BB_TINT_R=380;
function bbHullTint(sh){
  const list=bbAll();if(!list.length||!sh)return null;
  let best=null,bd=BB_TINT_R;
  for(const B of list){const d=Math.hypot(sh.x-B.x,sh.y-B.y);if(d<bd){bd=d;best=B;}}
  if(!best)return null;
  const col=(typeof laneLampCol==="function")?laneLampCol(best.by):[255,190,110];
  const u=clamp(1-bd/BB_TINT_R,0,1);
  return {c:col,k:u*u,by:best.by};
}
function bbHullPaint(x,y,sc){
  const T=bbHullTint(G.ship);if(!T||T.k<.05)return;
  const pass=gpuScene();if(!pass)return;
  const a=T.k*.5,c=T.c,h=mixc(c,[255,255,255],.35),r=Math.max(9,16*sc);
  gpuShapes(pass,[[1,x,y,r,0,0,r*1.5,c[0],c[1],c[2],a],[1,x,y,r*.4,0,0,r*.35,h[0],h[1],h[2],a*.65]],{blend:"add"});
}
function drawBillboard(zx,zy,Z){
  const list=bbAll();if(!list.length)return;
  const s=Math.max(1,clamp(Z,.6,1.5))*UIK,col=(typeof laneLampCol==="function")?laneLampCol(list[0].by):[255,190,110];
  const rd=clamp((Z-.3)/.2,0,1);
  let pass=null;
  for(const B of list){
    const x=zx(B.x),y=zy(B.y);
    /* издали — табличка без букв; буквы с ×0.5 (снимок автора 19.09) */
    if(x<-160*s||x>W+160*s||y<-120*s||y>H+120*s){
      if(rd>0&&GPU.dev&&pbOnScreen(x-160*s,y-120*s,320*s,240*s,.6))bbAhead(B,s,col);
      continue;
    }
    if(!pass){pass=gpuScene();if(!pass)return;}
    bbDrawGpu(pass,B,x,y,s,col,rd,Z);
    if(rd>0&&typeof hangBlock==="function"){const n=ovNd();hangBlock((x-64*s)*n,(y-24*s)*n,(x+64*s)*n,(y+24*s)*n);}
  }
}
