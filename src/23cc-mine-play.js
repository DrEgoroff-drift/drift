/* ══════════════ рудник: ствол, клеть, горизонты, забой (M631, docs/DESIGN-mine.md) ══════════════
   Шахта была сыром: человек грыз клетки в четыре стороны и висел в пустой трубе (автор, 15.10:
   «че он вниз лезет и висит … сгенерируй что типо реально шахта»). Теперь это рудник:
   - ствол (столбец 0) с клетью на канате: W/S — клеть вверх/вниз по остановкам; у верха W — на волю;
   - горизонты каждые пять рядов (4, 9, 14 …): с них в стороны ведут штреки, по полу которых человек
     ходит (A/D, тычок) и нигде не висит;
   - забой — конец штрека: идти в него — бурить, штрек прирастает клеткой (2.3 м); порода — в отвал,
     руда — в трюм;
   - углубка: в самом низу ствола S бурит ствол вниз, клеть опускается за забоем; дошёл до ряда
     горизонта — горизонт открыт;
   - вверх и вниз из штрека — только по руде (клетка с рудой или у рудного тела): так отбивают
     рудное тело, а по выработке ходят лестницами.
   Клетки, руда, твёрдость, ярусы, обвалы, грызуны, реликвии, скафандр, запись выработки — прежние
   (23-mode-dig, не тронут): ход игры лишь решает, какую клетку грызть и где стоит человек.
   Человек — ноги в мировых px (x, y; y вниз), клетка — floor(x/30), ряд — по полу; D.col/D.row
   держатся по ним, поэтому фауна, приборы и маяк читают их как прежде. ?dig=0 — старая шахта целиком. */
const MINE={on:true};
try{if(typeof location!=="undefined"&&/[?&]dig=0\b/.test(location.search))MINE.on=false;}catch(e){}
/* штрек тянется на 40 клеток в каждую сторону (92 м); горизонты — ряд 4 и дальше через пять */
const MINE_HALF=40, MINE_L0=4, MINE_LS=5;
/* скорости, px за шаг игры (60 в секунду): ход 2.3 м/с, лестница 1 м/с, клеть до 7.7 м/с */
const MINE_V={walk:.5,climb:.22,cage:1.75,cageMin:.35,cageK:.05,body:7};

function mineIsLevel(r){return r>=MINE_L0&&(r-MINE_L0)%MINE_LS===0;}
function mineLevelNo(r){return (r-MINE_L0)/MINE_LS+1;}
function mineDug(D,c,r){const k=D.cells[c+","+r];return !!(k&&k.dug);}
/* низ ствола: последний выкопанный подряд ряд столбца 0 */
function mineSump(D){let r=0;while(mineDug(D,0,r+1))r++;return r;}
/* пол клети на остановке: у верха — земля, на ряду — низ клетки */
function mineStopY(r){return r<=0?0:(r+1)*DIG_CELL;}
/* остановки клети сверху вниз: верх, горизонты до низа ствола, сам низ (полок углубки) */
function mineStops(D){
  const s=mineSump(D),out=[0];
  for(let r=MINE_L0;r<=s;r+=MINE_LS)out.push(r);
  if(s>0&&out[out.length-1]!==s)out.push(s);
  return out;
}
function mineRowOf(y){return Math.max(0,Math.floor((y-1)/DIG_CELL));}
/* можно ли отбивать клетку вверх/вниз: только руду и то, что у рудного тела */
function mineOre(D,c,r){const k=digCell(D,c,r);return !!(k.res||k.nearNode);}
function mineState(D){
  if(!D.mm)D.mm={mode:"cage",x:DIG_CELL/2,y:0,cy:0,cto:null,wait:false,word:"ВНИЗ",ride:0};
  return D.mm;
}

/* ── укус: та же проходка, что у 2D (23-mode-dig updateDig), для одной клетки ──
   возвращает true, когда клетка выкопана */
function mineBite(D,tc,tr,dt,st,head,vert){
  const S=G.surf;
  if(tr<0||Math.abs(tc)>MINE_HALF){D.target=null;G.prompt=head+"\nДАЛЬШЕ ГРАНИЦА УЧАСТКА";return false;}
  const ti=tierAt(tr);
  if(ti>st.digTier){D.target=null;G.prompt=head+"\nПОРОДА НЕ ПОДДАЁТСЯ — НУЖЕН "+DEPTH_TIERS[ti].need.toUpperCase();return false;}
  const cell=digCell(D,tc,tr);
  if(cell.dug){D.target=null;return true;}
  if(held()>=st.cargoMax&&cell.res){D.target=null;G.prompt=head+"\nТРЮМ ПОЛОН — НАВЕРХ, К КОРАБЛЮ";return false;}
  D.target=cell;
  cell.prog+=.019*st.drill*kitStat().drill*dt;
  G.prompt=head+"\nПРОХОДКА "+Math.round(clamp(cell.prog/cell.hard,0,1)*100)+"%"+
    (cell.res?" · ЖИЛА: "+RES[cell.res].ru.toUpperCase():"")+
    (st.drill<1.3?"\nБЫСТРЕЕ — МОДУЛЬ «БУРОВАЯ УСТАНОВКА» НА СТАНЦИИ":"");
  if(cell.prog<cell.hard)return false;
  cell.dug=true;D.target=null;D.maskV=(D.maskV|0)+1;
  if(vert){cell.ladder=true;digCell(D,D.col,D.row).ladder=true;}
  D.deepest=Math.max(D.deepest,tr);
  nodeDrop("в шахте",clamp(tr/60,0,1)+sysDanger(G.sx,G.sy)*.4,hashi(tc,tr,0x0DE7));
  if(cell.res){
    const got=addRes(cell.res,Math.round(cell.amount*st.refine));
    if(got&&RES[cell.res].far&&typeof farTake==="function")farTake(cell.res,got);
    if(got)say("Добыто: "+RES[cell.res].ru+" ×"+got);
  }
  if(tr>=14){
    const onTrail=G.relicHint&&G.relicHint.sx===G.sx&&G.relicHint.sy===G.sy;
    const ch=Math.min(.05,(tr-14)*.0012)*(onTrail?2:1);
    const id=relicRoll(hashi(D.p.seed+tc*17,tr*91,0x2E1),ch);
    if(id){relicFind(id,"из пласта на "+(tr*3)+" м");if(onTrail)G.relicHint=null;}
  }
  const cr=rng(hashi(D.p.seed+tc*31,tr*57,0xCAFE));
  if(ti>0&&cr()<.03+ti*.015){
    logAdd("warn","Обвал на глубине "+(tr*3)+" м · скафандр "+Math.round(Math.max(0,S.suit-8))+"%");
    suitHit(8+ti*6+cr()*8,"Обвал породы");
  }
  return true;
}

/* подсказка: клавиши из живой раскладки, на телефоне — слова пэдов */
function mineKeys(pc,ph){
  const mob=typeof document!=="undefined"&&document.body&&document.body.classList.contains("mobile");
  if(mob)return ph;
  return pc.replace(/\{(\w+):(\w)\}/g,(m,k,d)=>(typeof ctlHint==="function")?ctlHint(k,d):d);
}

function mineUpdate(dt){
  const D=G.dig,S=G.surf,st=stat(),M=mineState(D),V=MINE_V;
  /* клетка — по ногам: их мог переставить маяк, загрузка или стенд */
  D.col=Math.floor(M.x/DIG_CELL);D.row=mineRowOf(M.y);
  document.getElementById("dronebtn").style.display="none";
  S.suit=Math.max(0,S.suit-(.0025+D.row*.0006)*st.suitWear*kitHeatMul()*dt);
  if(S.suit<=25&&!S.warned){S.warned=true;say("СКАФАНДР НА ИСХОДЕ\n▲ наверх, к кораблю");
    if(typeof vegaOffend==="function"&&vegaAboard())vegaOffend("копь до предупреждения");}
  if(S.suit<=0){suitFailure();return;}
  digFauna(dt,st);
  if(G.mode!=="dig")return;
  const depth=D.row*3;
  let head="ГЛУБИНА "+depth+" м · "+(mineIsLevel(D.row)?"ГОРИЗОНТ "+mineLevelNo(D.row)+" · ":"")+
    geoAt(D.p,D.row*DIG_CELL*DIG_GEO_K).ru.toUpperCase()+
    "\nСКАФАНДР "+Math.round(S.suit)+"% · ТРЮМ "+held()+"/"+st.cargoMax;
  if(D.bugs.some(b=>b.stun<=0&&b.flee<=0)){
    const fk=(typeof ctlHint==="function")?ctlHint("fire",""):"F";
    head+="\nКУСАЧИЕ РЯДОМ · ОГОНЬ"+(fk?" ("+fk+")":"")+" — ИМПУЛЬС, ПОТОМ ПОДОЙТИ ЗА ОБРАЗЦОМ";
  }
  /* намерение: клавиши, иначе тычок (клетка) */
  let up=!!keys.thrust,down=!!keys.brake,lr=keys.left?-1:keys.right?1:0;
  const act=!!keys.act;
  if(up||down||lr||act)D.walkTarget=null;
  else if(D.walkTarget){
    const T=D.walkTarget,dr=T.row-D.row,dc=T.col-D.col;
    if(M.mode==="cage"){
      if(dr&&M.cto==null)(dr>0?down=true:up=true);
      else if(!dr&&dc)lr=Math.sign(dc);
      else if(!dr&&!dc)D.walkTarget=null;
    }else if(M.mode==="ladder"){
      if(dr)(dr>0?down=true:up=true);else if(dc)lr=Math.sign(dc);else D.walkTarget=null;
    }else{
      /* по штреку к клетке; в другой ряд — через ствол: к клети, а там поедет */
      if(dr&&D.col!==0&&T.col!==D.col)lr=-Math.sign(D.col);
      else if(dr)(dr>0?down=true:up=true);
      else if(dc){
        const cx=T.col*DIG_CELL+DIG_CELL/2;
        if(Math.abs(cx-M.x)>2)lr=Math.sign(cx-M.x);else D.walkTarget=null;
      }else D.walkTarget=null;
    }
  }
  const moving=M.mode==="walk"&&(lr||act)||M.mode==="ladder"&&(up||down);
  D.walkAmp=clamp(D.walkAmp+(moving?1:-1)*.12*dt,0,1);
  if(moving)D.walkPhase+=dt*.3;
  D.target=null;
  const sync=()=>{D.col=Math.floor(M.x/DIG_CELL);D.row=mineRowOf(M.y);};

  /* ── клеть ── */
  if(M.cto!=null){
    const d=M.cto-M.cy,v=clamp(Math.abs(d)*V.cageK,V.cageMin,V.cage)*dt;
    M.cy=Math.abs(d)<=v?M.cto:M.cy+Math.sign(d)*v;
    M.ride=Math.sign(d);
    if(M.cy===M.cto){M.cto=null;M.ride=0;
      const r=mineRowOf(M.cy);
      if(M.mode==="cage"&&mineIsLevel(r))say("ГОРИЗОНТ "+mineLevelNo(r)+" · "+r*3+" м",90);}
  }
  if(M.mode==="cage"){
    M.x+=(DIG_CELL/2-M.x)*Math.min(1,.2*dt);M.y=M.cy;sync();
    const stops=mineStops(D),here=stops.findIndex(r=>mineStopY(r)===M.cy),sump=mineSump(D),r=D.row;
    M.word=here===stops.length-1?"УГЛУБИТЬ":"ВНИЗ";
    if(M.cto!=null){G.prompt=head+"\nКЛЕТЬ "+(M.ride>0?"ВНИЗ":"ВВЕРХ");return;}
    /* клеть меж остановок (выработку переписали) — к ближней */
    if(here<0){let b=stops[0];for(const q of stops)if(Math.abs(mineStopY(q)-M.cy)<Math.abs(mineStopY(b)-M.cy))b=q;M.cto=mineStopY(b);return;}
    if(up){
      if(here<=0){exitDig();return;}
      M.cto=mineStopY(stops[here-1]);return;
    }
    if(down||act){
      if(here>=0&&here<stops.length-1){M.cto=mineStopY(stops[here+1]);return;}
      /* низ ствола: углубка — ствол грызут вниз, полок с клетью идёт за забоем */
      if(mineBite(D,0,sump+1,dt,st,head,true)){
        M.cto=mineStopY(sump+1);
        if(mineIsLevel(sump+1)){say("ГОРИЗОНТ "+mineLevelNo(sump+1)+" ОТКРЫТ · "+(sump+1)*3+" м\nштреки ведут с него в стороны");
          logAdd("tech","Шахта на "+D.p.name+": горизонт "+mineLevelNo(sump+1)+" на "+(sump+1)*3+" м");}
      }
      return;
    }
    if(lr&&r>0){
      if(mineDug(D,lr,r)){M.mode="walk";D.face=lr;M.x=DIG_CELL/2+lr*4;return;}
      if(mineIsLevel(r)){D.face=lr;mineBite(D,lr,r,dt,st,head,false);return;}
      G.prompt=head+"\nЗДЕСЬ НЕ ГОРИЗОНТ · ШТРЕКИ ВЕДУТ С ГОРИЗОНТОВ";return;
    }
    const nl=stops.find(s=>s>r&&mineIsLevel(s)),need=sump<MINE_L0?MINE_L0:Math.ceil((sump+1-MINE_L0)/MINE_LS)*MINE_LS+MINE_L0;
    G.prompt=head+"\n"+(here===stops.length-1
      ?(r===0&&sump===0?mineKeys("{brake:S} — ЗАЛОЖИТЬ СТВОЛ · ДО ГОРИЗОНТА 1: "+MINE_L0*3+" м","ВНИЗ — ЗАЛОЖИТЬ СТВОЛ")
        :mineKeys("{brake:S} — УГЛУБИТЬ СТВОЛ · ДО ГОРИЗОНТА "+mineLevelNo(need)+": "+(need-sump)*3+" м","ВНИЗ — УГЛУБИТЬ СТВОЛ"))
      :mineKeys("{brake:S} — КЛЕТЬ ВНИЗ"+(nl?" (ГОРИЗОНТ "+mineLevelNo(nl)+")":""),"ВНИЗ — КЛЕТЬ"))+
      (r>0&&mineIsLevel(r)?mineKeys(" · {left:A} {right:D} — НА ГОРИЗОНТ"," · ◀ ▶ — НА ГОРИЗОНТ"):"")+
      (r===0?mineKeys(" · {thrust:W} — НАВЕРХ"," · ВВЕРХ — НАВЕРХ"):"");
    return;
  }

  /* ── штрек ── */
  if(M.mode==="walk"){
    const r=D.row;M.y=mineStopY(r);
    const col=Math.floor(M.x/DIG_CELL);
    M.word=col===0?"КЛЕТЬ":"БУРИТЬ";
    /* у ствола: W/S — в клеть (клеть не здесь — её зовут, ждём) */
    if((up||down||act&&col===0)&&col===0){
      const sy=mineStopY(r);
      if(M.cy!==sy){if(M.cto!==sy){M.cto=sy;say("Клеть вызвана",60);}G.prompt=head+"\nКЛЕТЬ ИДЁТ";return;}
      M.mode="cage";
      const stops=mineStops(D),here=stops.indexOf(r);
      if(up&&here>0)M.cto=mineStopY(stops[here-1]);
      else if(!up&&here>=0&&here<stops.length-1)M.cto=mineStopY(stops[here+1]);
      return;
    }
    /* вверх/вниз из штрека: лестница по выработке или отбойка руды */
    if((up||down)&&col!==0){
      const dr=up?-1:1,tr=r+dr;
      if(tr>=0&&mineDug(D,col,tr)){M.mode="ladder";M.x=col*DIG_CELL+DIG_CELL/2;return;}
      if(tr>=0&&mineOre(D,col,tr)){mineBite(D,col,tr,dt,st,head,true);return;}
      G.prompt=head+"\nПУСТАЯ ПОРОДА · ВВЕРХ И ВНИЗ ОТБИВАЮТ ТОЛЬКО РУДУ";return;
    }
    const dir=lr||(act?(D.face||1):0);
    if(dir){
      D.face=dir;
      const nx=M.x+dir*V.walk*dt,edge=nx+dir*V.body,ca=Math.floor(edge/DIG_CELL);
      /* ворота ствола: клети на этом горизонте нет — шаг в пустоту не делают, клеть зовут */
      if(ca===0&&col!==0&&M.cy!==mineStopY(r)){
        M.x=dir>0?Math.min(nx,-V.body-.01):Math.max(nx,DIG_CELL+V.body+.01);
        if(M.cto!==mineStopY(r)){M.cto=mineStopY(r);say("Клеть вызвана",60);}
        sync();G.prompt=head+"\nКЛЕТЬ ИДЁТ";return;
      }
      if(ca===col||mineDug(D,ca,r))M.x=nx;
      else{
        /* забой: встал вплотную и бурит */
        M.x=dir>0?Math.min(nx,ca*DIG_CELL-V.body-.01):Math.max(nx,(ca+1)*DIG_CELL+V.body+.01);
        sync();mineBite(D,ca,r,dt,st,head,false);return;
      }
    }
    sync();
    const ahead=Math.floor((M.x+(D.face||1)*(V.body+4))/DIG_CELL),atFace=ahead!==D.col&&!mineDug(D,ahead,r);
    G.prompt=head+"\n"+(D.col===0?mineKeys("{thrust:W} {brake:S} — КЛЕТЬ · {left:A} {right:D} — ПО ШТРЕКУ","ВВЕРХ · ВНИЗ — КЛЕТЬ · ◀ ▶ — ПО ШТРЕКУ")
      :atFace?mineKeys((D.face<0?"{left:A}":"{right:D}")+" — БУРИТЬ ЗАБОЙ · {brake:S} {thrust:W} — РУДУ ВНИЗ / ВВЕРХ",(D.face<0?"◀":"▶")+" — БУРИТЬ ЗАБОЙ")
      :mineKeys("{left:A} {right:D} — ИДТИ · В ЗАБОЕ — БУРИТЬ","◀ ▶ — ИДТИ · В ЗАБОЕ — БУРИТЬ"));
    return;
  }

  /* ── лестница по выработке ── */
  if(M.mode==="ladder"){
    const col=Math.floor(M.x/DIG_CELL);
    M.word="ВНИЗ";
    M.x+=(col*DIG_CELL+DIG_CELL/2-M.x)*Math.min(1,.25*dt);
    let r0=mineRowOf(M.y),top=r0,bot=r0;
    while(top>0&&mineDug(D,col,top-1))top--;
    while(mineDug(D,col,bot+1))bot++;
    const ymin=mineStopY(top),ymax=mineStopY(bot),onFloor=Math.abs(M.y-mineStopY(r0))<3;
    if(up||down){
      const ny=M.y+(up?-1:1)*V.climb*dt;
      if(up&&ny<ymin){M.y=ymin;sync();if(top>0&&mineOre(D,col,top-1)){mineBite(D,col,top-1,dt,st,head,true);return;}}
      else if(down&&ny>ymax){M.y=ymax;sync();if(mineOre(D,col,bot+1)){mineBite(D,col,bot+1,dt,st,head,true);return;}}
      else M.y=ny;
    }else if(lr&&onFloor){
      M.y=mineStopY(r0);sync();
      if(mineDug(D,col+lr,r0)){M.mode="walk";D.face=lr;return;}
      if(mineOre(D,col+lr,r0)){D.face=lr;mineBite(D,col+lr,r0,dt,st,head,false);return;}
    }else if(!up&&!down){
      /* отпустил: на полу — стоит, между полами — держится за лестницу */
      if(onFloor&&!mineDug(D,col,r0+1)){M.y=mineStopY(r0);M.mode="walk";}
    }
    sync();
    G.prompt=head+"\n"+mineKeys("{thrust:W} {brake:S} — ПО ЛЕСТНИЦЕ · {left:A} {right:D} — СОЙТИ","ВВЕРХ · ВНИЗ — ПО ЛЕСТНИЦЕ · ◀ ▶ — СОЙТИ");
  }
}
/* слово большой кнопки: в клети — вниз (внизу — углубить), в штреке — бурить, у ствола — клеть */
function mineActWord(){
  const D=G.dig;if(!MINE.on||!D||!D.mm)return "";
  return D.mm.word;
}

/* ── переключатель ── */
const MINE_OLD_UPDATE=updateDig;
updateDig=function(dt){
  if(!MINE.on||!G.dig)return MINE_OLD_UPDATE.apply(this,arguments);
  return mineUpdate(dt);
};
