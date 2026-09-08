/* ДРЕЙФ — карта войны на сайте (M411).
 *
 * Здесь нет второй летописи. `war.js` — модули игры, склеенные build.ps1:
 * зерно, шесть держав, агенты, Директор, ноты, циркуляры, провод. Страница
 * зовёт тот же `chronStep`, что и клиенты, и потому обязана сходиться с игрой
 * байт в байт (D06: хэш тот же). Что она добавляет — только взгляд: круг систем
 * с владениями, фронтами и домами; шесть держав с силой, нуждами и отношениями;
 * войны и ноты; лента «кто куда когда» правдой или голосом любой из волн;
 * ползунок по сводкам — история повторяется за миллисекунды, и её можно
 * отмотать.
 *
 * Правило открытки держится и здесь: ни имён игроков, ни текста. Рука людей
 * видна счётчиками ведомости: «на обороне 12 бортов». */
(function(){
"use strict";
const $=s=>document.querySelector(s);
const NAMES=MAKER_KEYS.map(k=>POWERS[k].ru), COLS=MAKER_KEYS.map(k=>POWERS[k].col);
const ARC_STAGE=["началось","идёт","в разгаре","на исходе","развязка"];
/* звезда есть или нет — как в 06-galaxy: (0,0) всегда, остальные по зерну */
const starAt=(x,y)=>(x===0&&y===0)||h01(x,y,4242)<.52;
/* имя системы — как в getSystem: первый бросок уходит на класс звезды, второй — имя */
const NAME_CACHE={};
function nameOf(x,y){
  const k=x+","+y;
  if(NAME_CACHE[k])return NAME_CACHE[k];
  const r=rng(hashi(x,y,90210));r();
  return NAME_CACHE[k]=genName(r);
}
if(typeof NEWS_NAME!=="undefined")NEWS_NAME=nameOf;
const MONTHS=["янв","фев","мар","апр","мая","июн","июл","авг","сен","окт","ноя","дек"];
const svodMs=n=>CHRON_EPOCH+n*CHRON_SHIFT-(CHRON.off|0);
const two=v=>String(v).padStart(2,"0");
function fmt(n){const d=new Date(svodMs(n));return d.getDate()+" "+MONTHS[d.getMonth()]+", "+two(d.getHours())+":"+two(d.getMinutes());}
function fmtDay(n){const d=new Date(svodMs(n));return d.getDate()+" "+MONTHS[d.getMonth()];}
function hexA(h,a){
  const v=parseInt(h.slice(1),16);
  return "rgba("+(v>>16&255)+","+(v>>8&255)+","+(v&255)+","+a+")";
}
function pl(n,a,b,c){const m=n%10,h=n%100;return (h>=11&&h<=19)?c:(m===1?a:(m>=2&&m<=4?b:c));}

/* ── состояние на сводке n ──
   Повтор от нуля тем же шагом, что у клиентов, с ведомостями и циркулярами
   с провода; снимки каждые 24 сводки, дальше до 23 шагов. Дисковый кэш игры
   (chronState) здесь не используется нарочно: он не хранит строк летописи, а
   лента «кто куда когда» — это они и есть. */
let NOW=chronNow(),CUR=NOW,LIVE=null;
const SNAP=[];
function stateAt(n){
  n=Math.max(0,Math.min(NOW,n|0));
  if(n>=NOW&&LIVE)return LIVE;
  const k=Math.floor(n/24);
  if(!SNAP[k]){
    let from=k-1;while(from>=0&&!SNAP[from])from--;
    const st=from>=0?chronClone(SNAP[from]):chronFresh();
    for(let m=(from>=0?from+1:0);m<=k;m++){
      for(let i=st.N+1;i<=m*24;i++)chronStep(st,i);
      SNAP[m]=chronClone(st);
    }
  }
  const st=chronClone(SNAP[k]);
  for(let i=st.N+1;i<=n;i++)chronStep(st,i);
  if(n>=NOW)LIVE=st;
  return st;
}
function warBetween(st,a,b){
  if(a<0||b<0||a===b)return false;
  for(const w of st.wars)if((w.a===a&&w.b===b)||(w.a===b&&w.b===a))return true;
  return false;
}
/* недавние переходы: откуда и когда — по строкам летописи */
function recentTakes(st,n){
  const out={};
  for(let i=st.lines.length-1;i>=0;i--){
    const L=st.lines[i];
    if(n-L.N>8)break;
    if(L.kind==="take"&&L.sys&&!out[L.sys])out[L.sys]={from:L.args&&L.args.from,to:L.p,N:L.N};
  }
  return out;
}

/* ── правда: одна строка на событие, без эфира ── */
/* ── склонения держав и слов летописи (M422): лента читается как речь, а не как
   поле базы. Порядок — MAKER_KEYS: gt co or km ra hf. */
const DECL={
  gt:{g:"f",gen:"ГЛАВТРАССЫ",dat:"ГЛАВТРАССЕ",ins:"ГЛАВТРАССОЙ"},
  co:{g:"f",gen:"Компании",dat:"Компании",ins:"Компанией"},
  or:{g:"m",gen:"Орднунга",dat:"Орднунгу",ins:"Орднунгом"},
  km:{g:"f",gen:"Коммуны",dat:"Коммуне",ins:"Коммуной"},
  ra:{g:"m",gen:"Рассвета",dat:"Рассвету",ins:"Рассветом"},
  hf:{g:"m",gen:"Хай-Фронта",dat:"Хай-Фронту",ins:"Хай-Фронтом"}
};
const dOf=i=>DECL[MAKER_KEYS[i]]||{g:"f",gen:"державы",dat:"державе",ins:"державой"};
const GEN=i=>i>=0?dOf(i).gen:"соседа", DAT=i=>i>=0?dOf(i).dat:"соседу", INS=i=>i>=0?dOf(i).ins:"соседом";
/* глагол в прошедшем времени по роду: V(i,"занял") → занял/заняла */
const V=(i,m)=>m+(i>=0&&dOf(i).g==="f"?"а":"");
/* происшествие — одной фразой; %n держава, %g родительный, %V(глагол) по роду */
const INC_SAY={
  vein:"в поясах %g нашли жилу",fair:"%n %V(собрал) ярмарку",embargo:"%n %V(объявил) эмбарго",
  strike:"у %g забастовка",holiday:"у %g праздник",refugee:"переселение: люди уходят от %g",
  storm:"вспышка над домом %g",swarm:"рой у границ %g",drain:"пояса %g истощены",
  coup:"у %g сменилось правление",purge:"чистка у %g",envoy:"%n %V(отправил) посольство",
  spy:"утечка у %g",patrol:"%n %V(ужесточил) досмотр",census:"%n %V(провёл) перепись",
  cult:"тихий уезд из систем %g",revolt:"бунт в системах %g",find:"находка у %g",
  secede:"откол: часть систем %g ушла сама по себе"
};
/* дуга — существительное со своим родом: началась экспедиция, начался дефицит */
const ARC_G={shortage:"m",frontier:"m",succession:"n",expedition:"f",quarantine:"m",goldrush:"f"};
const NV=(g,m)=>m+(g==="f"?"ась":g==="n"?"ось":"ся");
function say(tpl,i){
  return tpl.replace(/%V\(([^)]+)\)/g,(_,m)=>V(i,m)).replace(/%n/g,NAMES[i]||"держава").replace(/%g/g,GEN(i));
}
function truth(L){
  const i=L.p|0,who=NAMES[i]||"держава";
  const j=(L.args&&typeof L.args.b==="number")?L.args.b:-1;
  const k=L.args&&L.args.k;
  switch(L.kind){
    case "take":{
      const p=L.sys?L.sys.split(","):null;
      const nm=p?"«"+nameOf(p[0]|0,p[1]|0)+"»":"сектор";
      const from=(L.args&&typeof L.args.from==="number")?L.args.from:-1;
      return from>=0?who+" "+V(i,"отбил")+" у "+GEN(from)+" "+nm+" <s>("+L.sys+")</s>":who+" "+V(i,"занял")+" "+nm+" <s>("+L.sys+")</s>";
    }
    case "war":return who+" "+V(i,"начал")+" войну с "+INS(j);
    case "truce":return who+" и "+NAMES[j]+" заключили перемирие";
    case "ult":return who+" "+V(i,"предъявил")+" ноту "+DAT(j)+": ответ через "+DIP_ULT_DUE+" сводок";
    case "note":return "нота "+GEN(i)+" к "+DAT(j)+" снята";
    case "deal":return who+" и "+NAMES[j]+" договорились о поставках";
    case "inc":return (INC_SAY[k]?say(INC_SAY[k],i):who+": "+(CHRON_INC_RU[k]||k))+((L.args&&L.args.forced)?" — по настоянию Директора":"");
    case "arc":{
      const a=CHRON_ARC_RU[k]||k,g=ARC_G[k]||"f",st=L.args&&L.args.stage|0;
      return st===0?NV(g,"начал")+" "+a+" "+GEN(i):
             st===1?a+" "+GEN(i)+" продолжается":
             st===2?a+" "+GEN(i)+" в разгаре":
             st===3?a+" "+GEN(i)+" на исходе":a+" "+GEN(i)+": развязка";
    }
    case "arcend":{
      const a=CHRON_ARC_RU[k]||k,g=ARC_G[k]||"f";
      return a+" "+GEN(i)+" "+NV(g,"кончил")+((L.args&&L.args.forced)?" сама собой".replace("сама",g==="f"?"сама":g==="n"?"само":"сам"):"");
    }
    case "rite":return who+" "+V(i,"объявил")+" обряд «"+((typeof RITES!=="undefined"&&RITES[k])?RITES[k].ru:k)+"»";
  }
  return who+": "+L.kind;
}
const KIND_CLASS={war:"war",take:"take",truce:"truce",ult:"war",note:"truce",inc:"dim",arc:"dim",arcend:"dim",rite:"dim",deal:"dim"};

/* ── карта ── */
const cv=$("#map"),c2=cv.getContext("2d");
let GEO=null,TERR=null;
function geo(){
  const rect=cv.getBoundingClientRect();
  const W=Math.max(2,Math.round(rect.width)),H=Math.max(2,Math.round(rect.height));
  const c=Math.min(W,H)/21.6;
  return {W,H,c,ox:W/2,oy:H/2};
}
function drawMap(st,n,t){
  const dpr=Math.min(3,devicePixelRatio||1);
  const g=GEO=geo();
  if(cv.width!==g.W*dpr||cv.height!==g.H*dpr){cv.width=g.W*dpr;cv.height=g.H*dpr;}
  c2.setTransform(dpr,0,0,dpr,0,0);
  c2.clearRect(0,0,g.W,g.H);
  const c=g.c,X=x=>g.ox+x*c,Y=y=>g.oy+y*c;
  const keys=chronKeys();
  const yk=chronYaltaKey();
  /* владения (M423): не клетчатая доска, а туманности. Квадраты хозяев
     рисуются на слой и размываются — держава становится телом с мягким краем,
     как звёздная пыль вокруг неё; слой считается один раз на сводку и ширину
     (карта дышит фронтами каждый кадр, а владения между кадрами не меняются).
     Коммуна и Компания в игре обе голубые — Коммуне штриховка, она же в легенде */
  const tk=n+"|"+g.W+"|"+NOW;
  if(!TERR||TERR.key!==tk){
    const raw=document.createElement("canvas"),soft=document.createElement("canvas");
    raw.width=soft.width=g.W*dpr;raw.height=soft.height=g.H*dpr;
    const r2=raw.getContext("2d");r2.setTransform(dpr,0,0,dpr,0,0);
    for(const k of keys){
      const S=st.systems[k];if(S.owner<0)continue;
      const p=k.split(","),x=p[0]|0,y=p[1]|0;
      r2.fillStyle=hexA(COLS[S.owner],.5);
      r2.fillRect(X(x)-c/2,Y(y)-c/2,c,c);
      if(S.owner===3){
        r2.save();r2.beginPath();r2.rect(X(x)-c/2,Y(y)-c/2,c,c);r2.clip();
        r2.strokeStyle="rgba(5,7,12,.5)";r2.lineWidth=Math.max(1,c*.08);
        for(let q=-c;q<c*2;q+=c/3){r2.beginPath();r2.moveTo(X(x)-c/2+q,Y(y)-c/2);r2.lineTo(X(x)-c/2+q-c,Y(y)+c/2);r2.stroke();}
        r2.restore();
      }
    }
    const s2=soft.getContext("2d");
    s2.filter="blur("+(c*.55*dpr).toFixed(1)+"px)";s2.globalAlpha=.55;s2.drawImage(raw,0,0);
    s2.filter="blur("+(c*.18*dpr).toFixed(1)+"px)";s2.globalAlpha=.35;s2.drawImage(raw,0,0);
    s2.filter="none";s2.globalAlpha=1;
    TERR={key:tk,cv:soft};
  }
  c2.drawImage(TERR.cv,0,0,g.W,g.H);
  /* обвод круга: у карты есть тело */
  c2.strokeStyle="rgba(207,227,234,.09)";c2.lineWidth=1;
  c2.beginPath();c2.arc(g.ox,g.oy,(CHRON_R+.5)*c,0,TAU);c2.stroke();
  /* границы: между воюющими — огнём; между мирными соседями — едва, туман сам показывает край */
  for(const k of keys){
    const S=st.systems[k];if(S.owner<0)continue;
    const p=k.split(","),x=p[0]|0,y=p[1]|0;
    for(const d of [[1,0],[0,1]]){
      const Q=st.systems[(x+d[0])+","+(y+d[1])];
      if(!Q||Q.owner<0||Q.owner===S.owner)continue;
      const war=warBetween(st,S.owner,Q.owner);
      c2.strokeStyle=war?"rgba(255,107,87,.85)":"rgba(5,7,12,.25)";
      c2.lineWidth=war?2:1;
      c2.beginPath();
      if(d[0]){c2.moveTo(X(x)+c/2,Y(y)-c/2);c2.lineTo(X(x)+c/2,Y(y)+c/2);}
      else{c2.moveTo(X(x)-c/2,Y(y)+c/2);c2.lineTo(X(x)+c/2,Y(y)+c/2);}
      c2.stroke();
    }
  }
  /* недавние переходы: уголок прежнего флага гаснет за двое суток */
  const RT=recentTakes(st,n);
  for(const k in RT){
    const r=RT[k];if(typeof r.from!=="number"||r.from<0)continue;
    const p=k.split(","),x=p[0]|0,y=p[1]|0;
    const a=.9*(1-(n-r.N)/9);
    c2.fillStyle=hexA(COLS[r.from],a);
    c2.beginPath();c2.moveTo(X(x)-c/2,Y(y)-c/2);c2.lineTo(X(x)-c/2+c*.42,Y(y)-c/2);c2.lineTo(X(x)-c/2,Y(y)-c/2+c*.42);c2.closePath();c2.fill();
  }
  /* звёзды: разной величины, ничьи — тусклее; сдвиг от зерна — как в игре */
  for(const k of keys){
    const S=st.systems[k];const p=k.split(","),x=p[0]|0,y=p[1]|0;
    if(!starAt(x,y))continue;
    const j=sysJitter(x,y),m=h01(x,y,777);
    const sx=X(x)+j[0]*c*.6,sy=Y(y)+j[1]*c*.6;
    const own=S.owner>=0,col=own?COLS[S.owner]:"#cfe3ea";
    const r=Math.max(1.1,c*(.045+.055*m));
    c2.fillStyle=col;c2.globalAlpha=own?.95:.5;
    c2.beginPath();c2.arc(sx,sy,r,0,TAU);c2.fill();
    if(own||m>.8){c2.globalAlpha=own?.2:.1;c2.beginPath();c2.arc(sx,sy,r*2.4,0,TAU);c2.fill();}
    c2.globalAlpha=1;
  }
  /* фронт: кольцо, которое дышит */
  const pulse=.55+.45*Math.sin(t/380);
  for(const k of keys){
    const S=st.systems[k];if(!S.front)continue;
    const p=k.split(","),x=p[0]|0,y=p[1]|0;
    c2.strokeStyle="rgba(255,107,87,"+(.35+.5*pulse).toFixed(2)+")";c2.lineWidth=1.5;
    c2.beginPath();c2.arc(X(x),Y(y),c*.36+pulse*1.5,0,TAU);c2.stroke();
  }
  /* дома: эмблема державы тем же рисунком, что в игре (12al) */
  ctx=c2;
  for(let i=0;i<6;i++){
    const hx=CHRON_HOME[i][0],hy=CHRON_HOME[i][1];
    c2.fillStyle="rgba(5,7,12,.7)";
    c2.beginPath();c2.arc(X(hx),Y(hy),c*.5,0,TAU);c2.fill();
    powerEmblem(MAKER_KEYS[i],X(hx),Y(hy),c*.36);
  }
  /* «Ялта»: ничья и не воюет */
  {
    const p=yk.split(","),x=p[0]|0,y=p[1]|0;
    c2.strokeStyle="rgba(207,227,234,.75)";c2.lineWidth=1;
    c2.beginPath();c2.arc(X(x),Y(y),c*.3,0,TAU);c2.stroke();
    c2.fillStyle="rgba(207,227,234,.8)";c2.font=Math.max(8,c*.32)+"px "+getComputedStyle(document.body).fontFamily;
    c2.textAlign="center";c2.fillText("Ялта",X(x),Y(y)+c*.75);
  }
  /* рука людей: ведомость сводки — засечки по числу бортов */
  if(n>=NOW){
    const L=warLedger(n);
    if(L)for(const k in L){
      if(k==="__votes")continue;
      const p=k.split(","),x=p[0]|0,y=p[1]|0;
      if(!(x*x+y*y<=CHRON_R*CHRON_R))continue;
      let a=0;for(const kind in L[k]){const cell=L[k][kind];if(cell&&cell.a)a=Math.max(a,cell.a.length);}
      if(!a)continue;
      c2.strokeStyle="rgba(127,230,216,.9)";c2.lineWidth=1.2;
      const m=Math.min(6,a);
      for(let q=0;q<m;q++){c2.beginPath();c2.moveTo(X(x)-c/2+3+q*3,Y(y)+c/2-3);c2.lineTo(X(x)-c/2+3+q*3,Y(y)+c/2-8);c2.stroke();}
    }
    /* сборы: чип с числом ответивших */
    for(const r of RALLY){
      const p=(r.sys||"").split(",");if(p.length!==2)continue;
      const x=p[0]|0,y=p[1]|0;
      c2.fillStyle="rgba(242,178,92,.9)";c2.font=Math.max(8,c*.3)+"px "+getComputedStyle(document.body).fontFamily;
      c2.textAlign="center";c2.fillText("сбор "+(r.yes|0),X(x),Y(y)-c*.55);
    }
    /* «Ревизия»: шестиугольник у дома той области */
    const B=(typeof bossActive==="function")?bossActive():null;
    if(B&&!B.dead){
      c2.strokeStyle="rgba(201,201,212,.9)";c2.lineWidth=1.5;
      c2.beginPath();
      for(let q=0;q<6;q++){const a=q/6*TAU;const px=X(B.x)+Math.cos(a)*c*.85,py=Y(B.y)+Math.sin(a)*c*.85;q?c2.lineTo(px,py):c2.moveTo(px,py);}
      c2.closePath();c2.stroke();
    }
  }
}

/* ── подсказка над клеткой ── */
const tip=$("#tip");
let HOVER=null;
function cellAt(ev){
  if(!GEO)return null;
  const rect=cv.getBoundingClientRect();
  const mx=ev.clientX-rect.left,my=ev.clientY-rect.top;
  const x=Math.round((mx-GEO.ox)/GEO.c),y=Math.round((my-GEO.oy)/GEO.c);
  if(x*x+y*y>CHRON_R*CHRON_R)return null;
  return {x,y,k:x+","+y,mx,my};
}
function showTip(cell){
  if(!cell){tip.style.display="none";HOVER=null;return;}
  const st=stateAt(CUR),S=st.systems[cell.k];
  if(!S){tip.style.display="none";return;}
  HOVER=cell.k;
  const own=S.owner<0?"ничья — «Ялта»":NAMES[S.owner];
  let home=-1;for(let i=0;i<6;i++)if(CHRON_HOME[i][0]===cell.x&&CHRON_HOME[i][1]===cell.y)home=i;
  let h="<b>"+(home>=0?"дом · "+NAMES[home]:(starAt(cell.x,cell.y)?nameOf(cell.x,cell.y):"пустой сектор"))+"</b> · "+cell.k+
    "<s>"+own+(S.owner>=0&&S.since>0?" · с "+fmt(S.since):"")+(S.front?" · <span style='color:#ff6b57'>фронт</span>":"")+"</s>";
  const RT=recentTakes(st,CUR)[cell.k];
  if(RT&&typeof RT.from==="number"&&RT.from>=0)h+="<s>взята у "+NAMES[RT.from]+" · "+fmt(RT.N)+"</s>";
  if(CUR>=NOW){
    const L=warLedger(CUR);
    if(L&&L[cell.k]){
      const RU={def:"на обороне",tow:"буксиров",ore:"руды в дефицит",mail:"почты",clear:"расчистки",build:"стройки",crew:"снятых экипажей",fuel:"топлива отдано",scan:"сканирований"};
      const parts=[];
      for(const kind in L[cell.k]){const c=L[cell.k][kind];if(c&&c.q)parts.push((RU[kind]||kind)+" "+c.q+(c.a?" ("+c.a.length+" "+pl(c.a.length,"борт","борта","бортов")+")":""));}
      if(parts.length)h+="<s style='color:#7fe6d8'>рука людей: "+parts.join(" · ")+"</s>";
    }
  }
  const last=[];
  for(let i=st.lines.length-1;i>=0&&last.length<3;i--){const L=st.lines[i];if(L.sys===cell.k)last.push(fmtDay(L.N)+" — "+truth(L));}
  if(last.length)h+="<s>"+last.join("<br>")+"</s>";
  tip.innerHTML=h;
  tip.style.display="block";
  const bw=cv.getBoundingClientRect().width;
  tip.style.left=Math.min(cell.mx+14,bw-tip.offsetWidth-6)+"px";
  tip.style.top=Math.max(4,cell.my-tip.offsetHeight-10)+"px";
}
cv.addEventListener("pointermove",ev=>showTip(cellAt(ev)));
cv.addEventListener("pointerleave",()=>showTip(null));
cv.addEventListener("pointerdown",ev=>showTip(cellAt(ev)));

/* ── панель: державы, войны, ноты, обряды, «Ревизия», сборы ── */
function bar(v,max,cls,txt){return "<div class='bar"+(cls?" "+cls:"")+"'><i style='width:"+Math.round(100*Math.max(0,Math.min(1,v/max)))+"%'></i>"+(txt?"<em>"+txt+"</em>":"")+"</div>";}
function drawPanel(st,n){
  const P=st.powers;
  let h="<h3>Ведомость · сводка "+n+"</h3>";
  const order=[0,1,2,3,4,5].sort((a,b)=>P[b].hold-P[a].hold);
  for(const i of order){
    const p=P[i];
    const wars=st.wars.filter(w=>w.a===i||w.b===i).map(w=>w.a===i?w.b:w.a);
    const ults=(st.ults||[]).filter(u=>u.a===i||u.b===i);
    const home=p.home|0;
    let rels="";
    for(let q=0;q<6;q++){
      if(q===i)continue;
      const v=p.rel[q];
      const cls=wars.indexOf(q)>=0?"w":(ults.some(u=>(u.a===i&&u.b===q)||(u.a===q&&u.b===i))?"u":(v>350?"a":""));
      rels+="<b class='"+cls+"' title='"+NAMES[q]+": "+v+"'>"+HULL_MAKER[MAKER_KEYS[q]].ab+" "+(v>0?"+":"")+Math.round(v/10)+"</b>";
    }
    h+="<div class='pw'><canvas data-em='"+MAKER_KEYS[i]+"' width='36' height='36'></canvas>"+
      "<div class='nm'>"+NAMES[i]+"<s>"+POWERS[MAKER_KEYS[i]].wants+"</s></div>"+
      "<div class='n'>"+p.hold+"<s>систем · дом "+home+"</s></div>"+
      "<div class='bars'>"+
        "<div>руда"+bar(p.need.ore,1000)+"</div><div>товары"+bar(p.need.goods,1000)+"</div>"+
        "<div>корпуса"+bar(p.need.hulls,1000)+"</div><div>связь"+bar(p.need.link,1000)+"</div>"+
        "<div>сила · напряжение"+bar(p.str,1000,"s",p.str)+bar(p.tension,1000,"",p.tension)+"</div>"+
      "</div>"+
      "<div class='rel'>"+rels+"</div>"+
      (wars.length?"<div class='li alarm' style='grid-column:1/4;border:0;padding:2px 0'>воюет с "+wars.map(q=>NAMES[q]).join(", ")+"</div>":"")+
    "</div>";
  }
  /* войны и ноты */
  h+="<h3>Войны</h3>";
  if(!st.wars.length)h+="<div class='empty'>войн нет: торгуют, ссорятся, строят и ждут повода</div>";
  for(const w of st.wars){
    let ta=0,tb=0;
    for(const L of st.lines)if(L.kind==="take"&&L.N>=w.t0){if(L.p===w.a&&L.args&&L.args.from===w.b)ta++;else if(L.p===w.b&&L.args&&L.args.from===w.a)tb++;}
    h+="<div class='li alarm'>"+NAMES[w.a]+" × "+NAMES[w.b]+"<s>с "+fmt(w.t0)+" · взято: "+NAMES[w.a]+" "+ta+", "+NAMES[w.b]+" "+tb+"</s></div>";
  }
  const ults=st.ults||[];
  if(ults.length){
    h+="<h3>Ноты со сроком</h3>";
    for(const u of ults){
      const left=Math.max(0,DIP_ULT_DUE-(n-u.t0));
      h+="<div class='li'>"+NAMES[u.a]+" → "+NAMES[u.b]+"<s>срок "+(left?"через "+left+" "+pl(left,"сводку","сводки","сводок")+" · "+fmt(u.t0+DIP_ULT_DUE):"вышел")+"</s></div>";
    }
  }
  /* что идёт: дуги, обряды, свежие происшествия */
  const D=st.dir;
  if(D){
    const arcs=D.arcs||[],rites=D.rites||[];
    if(arcs.length||rites.length){
      h+="<h3>Что идёт сейчас</h3>";
      for(const a of arcs)h+="<div class='li'>"+(CHRON_ARC_RU[a.kind]||a.kind)+" "+GEN(a.p)+"<s>"+(ARC_STAGE[a.stage|0]||"идёт")+" · с "+fmtDay(a.t0)+"</s></div>";
      for(const r of rites)h+="<div class='li good'>"+NAMES[r.p]+": обряд «"+((typeof RITES!=="undefined"&&RITES[r.kind])?RITES[r.kind].ru:r.kind)+"»<s>объявлен "+fmtDay(r.t0)+" · одна кнопка в игре</s></div>";
    }
    /* последние происшествия здесь не повторяются: они в ленте под картой (M424) */
  }
  if(n>=NOW){
    const B=(typeof bossActive==="function")?bossActive():null;
    if(B){
      h+="<h3>«Ревизия»</h3><div class='li"+(B.dead?" good":" alarm")+"'>"+(B.dead?"сбита · изменения области закреплены":"стоит у дома "+NAMES[B.i])+
        "<s>"+(B.dead?"":"корпус "+Math.round(B.hull*100/BOSS_HULL)+" % · в бою бортов: "+Math.max(1,B.ships)+" · карта области перекроена на "+B.pct+" %")+"</s></div>";
    }
    if(RALLY.length){
      h+="<h3>Сигналы сбора</h3>";
      for(const r of RALLY)h+="<div class='li good'>сектор "+r.sys+" · сводка "+((r.at|0)%1000)+"<s>ответили: "+(r.yes|0)+" · "+fmt(r.at|0)+"</s></div>";
    }
  }
  $("#panel").innerHTML=h;
  /* эмблемы — тем же рисунком, что в игре */
  document.querySelectorAll("#panel canvas[data-em]").forEach(el=>{
    const c=el.getContext("2d");c.clearRect(0,0,36,36);
    const keep=ctx;ctx=c;powerEmblem(el.dataset.em,18,18,14);ctx=keep;
  });
}

/* рубрика (M431): раньше заголовком строки была целая фраза, и заметка под ней
   начинала с того же самого — «Коммуна объявила обряд „регата“ / Коммуна
   объявила регату». Теперь сверху ярлык: что и у кого, тремя словами. */
const STAGE_TAG=["начало","идёт","в разгаре","на исходе","развязка"];
function tag(L){
  const who=(L.p>=0?NAMES[L.p]:"галактика"),k=L.args&&L.args.k;
  switch(L.kind){
    case "inc":return (CHRON_INC_RU[k]||k)+" · "+who;
    case "arc":return (CHRON_ARC_RU[k]||k)+" · "+who+" · "+(STAGE_TAG[(L.args&&L.args.stage|0)>4?4:(L.args&&L.args.stage|0)]||"идёт");
    case "arcend":return (CHRON_ARC_RU[k]||k)+" · "+who+" · конец";
    case "rite":return ((typeof RITES!=="undefined"&&RITES[k])?RITES[k].ru:k)+" · "+who;
    case "take":return "передел · "+who;
    case "war":return "война · "+who+" × "+(L.args&&L.args.b>=0?NAMES[L.args.b]:"соседом");
    case "truce":return "перемирие · "+who+" × "+(L.args&&L.args.b>=0?NAMES[L.args.b]:"соседом");
    case "ult":return "нота со сроком · "+who;
    case "note":return "нота снята · "+who;
    case "deal":return "поставки · "+who;
  }
  return who;
}
/* ── лента ── */
/* Лента показывается порциями (M422): сперва последние двое суток, «ещё» —
   ещё двое, вместо четырёхсот строк за раз. Порция — по сводкам, не по строкам,
   чтобы день не рвался пополам. */
const FEED_STEP=8;
let FEED_DEPTH=FEED_STEP;
function drawLines(st,n){
  const wave=$("#wave").value;
  let h="",last=-1,shown=0,days=0,more=false;
  for(let i=st.lines.length-1;i>=0;i--){
    const L=st.lines[i];
    let txt;
    if(wave){txt=chronSay(L,wave);if(!txt)continue;txt="<span class='w'>"+POWERS[wave].ru+":</span> "+txt;}
    else txt=truth(L);
    if(L.N!==last){
      if(++days>FEED_DEPTH){more=true;break;}
      last=L.N;h+="<div class='tlh"+(L.N===n?" now":"")+"'>сводка "+L.N+" · "+fmt(L.N)+"</div>";
    }
    const col=L.p>=0?COLS[L.p]:"#cfe3ea";
    /* заметка (M431): заголовок отвечает «что», абзац под ним — «в подробностях,
       и что вам с этого». Сводка без второго — это опись, а не новость. */
    const note=(wave||typeof newsOf!=="function")?"":newsOf(L,st);
    const head=note?"<span class='tg'>"+tag(L)+"</span>":txt;
    h+="<div class='tle "+(KIND_CLASS[L.kind]||"")+"'><i style='background:"+col+"'></i><div>"+head+
      (note?"<span class='nw'>"+note+"</span>":"")+"</div></div>";
    shown++;
  }
  if(!shown)h="<div class='empty'>пока ни одной строки</div>";
  $("#lines").innerHTML=h;
  const btn=$("#moreBtn");
  btn.hidden=!more;
  
}
$("#moreBtn").addEventListener("click",()=>{FEED_DEPTH+=FEED_STEP;drawLines(stateAt(CUR),CUR);});
/* ── шапка и ползунок ── */
function drawNow(){
  const n=NOW,ms=svodMs(n+1)-Date.now();
  const hh=Math.max(0,Math.floor(ms/3600000)),mm=Math.max(0,Math.floor(ms%3600000/60000));
  $("#now").innerHTML="сводка <b>"+n+"</b> · "+fmt(n)+" · следующая через "+hh+" ч "+two(mm)+" мин"+
    ((typeof warHere==="function"&&warHere())?"":" · <span title='страница открыта без сети: часы свои, ведомостей нет'>без сети</span>");
}
function drawLabel(n){
  $("#svodLbl").innerHTML="сводка <b>"+n+"</b> · "+fmt(n)+(n>=NOW?" · сейчас":"");
}
function view(n){
  CUR=Math.max(0,Math.min(NOW,n|0));
  const st=stateAt(CUR);
  drawMap(st,CUR,performance.now());
  drawPanel(st,CUR);
  drawLines(st,CUR);
  drawLabel(CUR);
  if(HOVER){const p=HOVER.split(",");showTip({x:p[0]|0,y:p[1]|0,k:HOVER,mx:0,my:0});tip.style.display="none";}
}
const slider=$("#svod");
function setSlider(){
  slider.min=Math.max(0,NOW-720);slider.max=NOW;
  if(CUR>NOW)CUR=NOW;
  slider.value=CUR;
}
slider.addEventListener("input",()=>view(+slider.value));
$("#nowBtn").addEventListener("click",()=>{slider.value=NOW;view(NOW);});
/* волны — тот же список, что в игре */
{
  const sel=$("#wave");
  for(const k of MAKER_KEYS){const o=document.createElement("option");o.value=k;o.textContent="эфир · "+POWERS[k].ru;sel.appendChild(o);}
  sel.addEventListener("change",()=>drawLines(stateAt(CUR),CUR));
}
/* легенда */
{
  let h="";
  for(let i=0;i<6;i++)h+="<span><i style='background:"+hexA(COLS[i],.6)+(i===3?";background-image:repeating-linear-gradient(135deg,rgba(255,255,255,.35) 0 1px,transparent 1px 3px)":"")+"'></i>"+NAMES[i]+"</span>";
  h+="<span><i class='f'></i>фронт</span><span><i class='t'></i>взято за двое суток</span><span><i class='y'></i>Ялта — ничья</span>";
  $("#legend").innerHTML=h;
}
/* ── дыхание фронтов: кадр только когда есть что дышать ── */
let RAF=0;
function tick(){
  RAF=0;
  const st=stateAt(CUR);
  let any=false;for(const k of chronKeys())if(st.systems[k].front){any=true;break;}
  drawMap(st,CUR,performance.now());
  if(any&&document.visibilityState==="visible")RAF=requestAnimationFrame(tick);
}
addEventListener("resize",()=>{GEO=null;TERR=null;view(CUR);});
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&!RAF)tick();});

/* ── провод: ведомости, часы, сборы — и пересчёт, когда приехало новое ── */
let RALLY=[];
function pull(){
  if(typeof warPull!=="function"||typeof warHere!=="function"||!warHere())return Promise.resolve(false);
  return warPull(true).then(ok=>{
    const n2=chronNow();
    if(n2!==NOW||ok){NOW=n2;LIVE=null;SNAP.length=0;TERR=null;}
    return (typeof warCall==="function")?warCall("rallies",{}).then(r=>{RALLY=(r&&r.ok&&Array.isArray(r.rows))?r.rows:[];return ok;}).catch(()=>ok):ok;
  }).catch(()=>false);
}
function refresh(){
  const was=CUR>=NOW;
  pull().then(()=>{
    NOW=chronNow();
    setSlider();
    if(was){CUR=NOW;slider.value=NOW;}
    drawNow();view(CUR);tick();
  });
}
/* первый кадр — сразу и без сети: летопись повторяется от зерна */
setSlider();drawNow();view(NOW);tick();
$("#ver").textContent="летопись 0."+(typeof VER==="string"?VER.split(".")[1]:"");
setTimeout(refresh,600);
setInterval(refresh,90000);
setInterval(drawNow,30000);
})();
