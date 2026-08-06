/* ══════════════ торговые баржи ══════════════
   У торгового фактора (12c-mgr, 12-economy) был маршрут, но у маршрута не было
   тела: игрок видел спред строкой на карте и не более. Баржа — это тот же
   маршрут, ставший вещью, к которой можно подойти. Она возит настоящий товар
   между настоящими станциями фактора, торгует без стыковки и живёт своей
   жизнью, не завися от игрока.

   Эфемерна, как пираты и пояс: набирается заново из seed сектора и времени, в
   snapshot() не идёт. Персистить нечего — решений игрока в ней нет, пока он не
   заключит сделку, а сделка меняет кредиты и трюм, которые и так сохраняются. */

const BARGE_PERIOD=1500000;              // окно, в котором состав барж держится
const BARGE_CAP=6;                       // потолок на галактику (замысел M94)
/* норов капитана — не число к урону, а то, как он себя ведёт в торге и в беде.
   Уступка идёт в цену: жадный уступает меньше, пугливый — больше, лишь бы
   разойтись; боевой держит цену, но и пиратов встречает огнём (M95). */
const BARGE_TEMPER={
  greedy:{ru:"прижимистый",give:-.03,note:"уступает с трудом"},
  timid: {ru:"пугливый",   give:.03, note:"лишь бы разойтись миром"},
  bold:  {ru:"крепкий",    give:0,   note:"держит цену и курс"}
};
const BARGE_TKEYS=Object.keys(BARGE_TEMPER);
const BARGE_CAPNAMES=["Тук","Барма","Овод","Севрюга","Кряж","Морок","Пест","Дуга","Волок","Ушкуй"];

function bargeSysAt(key){
  if(typeof key!=="string")return null;
  const p=key.split(",");if(p.length!==2)return null;
  const sx=+p[0],sy=+p[1];
  if(!isFinite(sx)||!isFinite(sy)||!starAt(sx,sy))return null;
  const s=getSystem(sx,sy);
  return s&&s.station?s:null;
}
/* ── плечи маршрута ──
   Берём их у настоящего фактора: пары соседних станций из его route. Так баржа
   становится видимым следствием экономики, а не декорацией с грузом. Если
   фактора ещё нет или маршрут короче двух станций, берём честный запасной вход:
   текущая станция и ближайшая к ней — тоже настоящая пара, по которой реально
   есть спред. */
function bargeLegs(){
  const legs=[];const seen={};
  const push=(a,b)=>{
    if(!a||!b||a.key===b.key)return;
    const id=a.key<b.key?a.key+"|"+b.key:b.key+"|"+a.key;
    if(seen[id])return;seen[id]=1;legs.push([a,b]);
  };
  const F=typeof mgrOf==="function"?mgrOf("fact"):null;
  if(F&&!F.stalled&&Array.isArray(F.route)&&F.route.length>=2){
    const keys=F.route.slice(0,typeof mgrRouteMax==="function"?mgrRouteMax(F):4);
    for(let i=0;i<keys.length-1;i++)push(bargeSysAt(keys[i]),bargeSysAt(keys[i+1]));
  }
  if(!legs.length){
    const here=G.sys&&G.sys.station?G.sys:bargeSysAt(G.sx+","+G.sy);
    if(here){
      /* ближайшая ДРУГАЯ станция: nearestStation может вернуть ту же систему,
         поэтому ищем первую станцию с ключом, отличным от here */
      let other=null;
      for(let rad=1;rad<=24&&!other;rad++)
        for(let dx=-rad;dx<=rad&&!other;dx++)for(let dy=-rad;dy<=rad;dy++){
          if(Math.max(Math.abs(dx),Math.abs(dy))!==rad)continue;
          const s=bargeSysAt((here.sx+dx)+","+(here.sy+dy));
          if(s&&s.key!==here.key){other=s;break;}
        }
      if(other)push(here,other);
    }
  }
  return legs;
}
/* цена товара на станции назначения — та же, что заплатил бы игрок сам, довезя
   груз. От неё пляшет весь торг с баржой. */
function bargeDestPrice(b,good){
  const dst=bargeSysAt(b.to)||bargeSysAt(b.from);
  if(!dst)return Math.max(1,RES[good]?RES[good].price:11);
  return marketFor(dst)[good]||Math.max(1,RES[good]?RES[good].price:11);
}
/* наценка баржи: 8–12% от seed, плюс поправка на норов. Обе цены (и как баржа
   продаёт, и как покупает) ВСЕГДА хуже станции назначения — иначе баржа стала бы
   бесплатным арбитражем. Выигрыш игрока тут во времени, а не в деньгах. */
function bargeMarkup(b){
  const r=rng(hashi(b.seed,0x8A2E,3));
  return clamp(.08+r()*.04-(BARGE_TEMPER[b.temper]||BARGE_TEMPER.bold).give,.03,.18);
}
function bargeSellPrice(b,good){          // баржа продаёт вам — дороже станции
  return Math.max(2,Math.ceil(bargeDestPrice(b,good)*(1+bargeMarkup(b))));
}
function bargeBuyPrice(b,good){           // баржа покупает у вас — дешевле станции
  return Math.max(1,Math.floor(bargeDestPrice(b,good)*(1-bargeMarkup(b))));
}

/* ── набор барж текущего сектора ──
   Баржа живёт в местных координатах системы, как пират: летит по хорде мимо
   станции, медленно, без оружия. Присутствие и состав детерминированы от
   seed сектора и окна времени. */
function spawnBarges(){
  G.barges=[];
  const legs=bargeLegs();
  if(!legs.length)return;
  const hereKey=G.sx+","+G.sy;
  /* баржи именно этой системы: те плечи, у которых текущий сектор — конец */
  const local=legs.filter(l=>l[0].key===hereKey||l[1].key===hereKey);
  if(!local.length)return;
  const bucket=Math.floor(Date.now()/BARGE_PERIOD);
  const r=rng(hashi(G.sx,G.sy,bucket*131+0x0BA6));
  let made=0;
  for(const leg of local){
    if(made>=2||G.barges.length>=BARGE_CAP)break;
    if(r()>=.6)continue;                  // не в каждом окне и не на каждом плече
    const from=leg[0].key===hereKey?leg[0]:leg[1];
    const to=leg[0].key===hereKey?leg[1]:leg[0];
    const seed=hashi(G.sx*7+G.sy*13,bucket*977+made,0x17E);
    const rb=rng(seed);
    /* товар — тот, что реально возят по этому плечу: самый дорогой у назначения,
       на нём и держится спред */
    let good=TRADE_KEYS[0],best=-1;
    for(const k of TRADE_KEYS){const p=(marketFor(to)[k]||0);if(p>best){best=p;good=k;}}
    const cap=90+Math.floor(rb()*140);
    const hullMax=140+Math.floor(rb()*120);
    const a=rb()*TAU, rad=2600+rb()*900;
    const heading=a+Math.PI+(rb()-.5)*.7;
    const sp=.7+rb()*.5;
    /* застали в беде: если в системе есть пираты, часть барж встречаешь уже под
       обстрелом. Их корпус подранен, они тише ходят — и тут решает поступок:
       вписаться, пройти мимо или добить самому. */
    const distress=G.pirates&&G.pirates.some(p=>!p.rogue)&&rb()<.5;
    /* пассажир — не груз, а человек: изредка, только на баржах в беде (их-то и
       спасают). Довезённый всплывёт в кантине наёмником. */
    const paxSeed=(distress&&rb()<.4)?hashi(seed,0x9A5,3):0;
    G.barges.push({
      seed,from:from.key,to:to.key,good,
      qty:Math.floor(cap*(.4+rb()*.5)),cap,budget:1400+Math.floor(rb()*2600),
      temper:BARGE_TKEYS[Math.floor(rb()*BARGE_TKEYS.length)],
      capName:BARGE_CAPNAMES[Math.floor(rb()*BARGE_CAPNAMES.length)],
      fac:(from.station&&from.station.name)||"вольный торг",
      hullMax,hp:distress?Math.floor(hullMax*(.3+rb()*.3)):hullMax,
      distress:distress?1:0,wasPirateDistress:distress?1:0,paxSeed,
      repGiven:0,dealt:0,escort:0,done:0,
      x:Math.cos(a)*(distress?rad*.6:rad),y:Math.sin(a)*(distress?rad*.6:rad),
      vx:Math.cos(heading)*(distress?sp*.5:sp),vy:Math.sin(heading)*(distress?sp*.5:sp),a:heading
    });
    made++;
  }
}
function bargeAttackers(b){
  return G.pirates.filter(p=>p&&!p.rogue&&p.hull>0&&Math.hypot(p.x-b.x,p.y-b.y)<1500);
}
function updateBarges(dt){
  for(let i=G.barges.length-1;i>=0;i--){
    const b=G.barges[i];
    b.x+=b.vx*dt;b.y+=b.vy*dt;
    /* ── баржа в беде: пираты выгрызают корпус, пока их не отгонят ── */
    if(b.distress){
      const atk=bargeAttackers(b);
      b.underFire=atk.length;
      if(atk.length){
        b.hp-=(.05+.03*atk.length)*dt;
        /* пираты и правда стреляют по ней — видно, что бой настоящий */
        for(const p of atk)if(Math.random()<.02*dt){
          const ang=Math.atan2(b.y-p.y,b.x-p.x);
          fireShot(p.x,p.y,ang,6,0,false);b._pshot=1;
        }
        if(b.hp<=0){bargeSunk(b,b.mineHit?"player":"pirates");continue;}
      }else if(b.wasPirateDistress&&!b.done){
        /* всех нападавших отогнали, а баржа жива — вы её спасли. Только для той,
           что громили пираты: баржу, которую подстрелили вы сами, никто не
           «спасает» — она просто идёт подранком */
        bargeRescued(b);
      }
    }
    const d=Math.hypot(b.x,b.y);
    if(d>4200){
      const inb=Math.atan2(-b.y,-b.x);
      b.a+=angDiff(inb,b.a)*Math.min(1,.02*dt);
      const sp=Math.hypot(b.vx,b.vy)||1;
      b.vx=Math.cos(b.a)*sp;b.vy=Math.sin(b.a)*sp;
    }
  }
}
/* ── попадание вашего выстрела по барже: только так её можно добить самому ── */
function bargeMineHit(s){
  for(const b of G.barges){
    if(Math.hypot(s.x-b.x,s.y-b.y)<26){
      b.hp-=s.dmg;b.distress=1;b.mineHit=1;   // выстрелив по ней, вы её и добиваете
      if(typeof sfx==="function")sfx("hit",{v:.3});
      if(b.hp<=0)bargeSunk(b,"player");
      return true;
    }
  }
  return false;
}
/* ── исход: спасли ──
   Репутация вверх (в пределах потолка шкалы), доля груза благодарностью, и
   капитан вас запомнил. Пассажир, если он был, теперь довезён — ждёт в кантине. */
function bargeRescued(b){
  if(b.done)return;b.done=1;b.distress=0;b.rescued=1;
  const dst=bargeSysAt(b.to)||bargeSysAt(b.from);
  if(dst&&typeof repAdd==="function")repAdd(2,dst);
  const share=3+Math.floor(Math.random()*5);
  const got=addRes(b.good,share);
  if(b.escort)bargeEscortEnd(b,true);
  if(b.paxSeed)bargePaxDeliver(b);
  say("Баржа «"+b.capName+"» спасена"+(got?"\n+"+got+" "+RES[b.good].ru.toLowerCase()+" в благодарность":""));
  logAdd("good","Баржа «"+b.capName+"» спасена от пиратов"+
    (got?" · +"+got+" "+RES[b.good].ru.toLowerCase():""));
}
/* ── исход: погибла ──
   Оставляет остов в этой системе — его позже можно осмотреть ровно раз. Если её
   добили ВЫ, фракция это запомнит (репутация вниз резко; полноценная месть — в
   M98), а груз ваш. Если добили пираты — вы просто опоздали. */
function bargeSunk(b,cause){
  const i=G.barges.indexOf(b);if(i>=0)G.barges.splice(i,1);
  if(b.escort)bargeEscortEnd(b,false);
  const key=G.sx+","+G.sy;
  if(!G.wrecks[key])G.wrecks[key]=[];
  if(G.wrecks[key].length<12)
    G.wrecks[key].push({seed:hashi(b.seed,0x3E7,cause==="player"?1:2),
      x:b.x,y:b.y,tier:clamp(1+Math.floor(sysDanger(G.sx,G.sy)*2),0,3),
      seen:0,good:b.good,name:b.capName});
  if(cause==="player"){
    const dst=bargeSysAt(b.from)||bargeSysAt(b.to);
    if(dst&&typeof repAdd==="function")repAdd(-3,dst);
    /* груз ваш: часть добычи падает контейнерами, как с пирата */
    if(typeof addRes==="function")addRes(b.good,4+Math.floor(Math.random()*6));
    say("Баржа «"+b.capName+"» разбита вами\nгруз ваш · вас запомнят");
    logAdd("warn","Вы разбили баржу «"+b.capName+"» · груз взят, репутация упала");
  }else{
    say("Баржу «"+b.capName+"» потопили пираты\nостался остов");
    logAdd("warn","Баржа «"+b.capName+"» погибла · остался остов");
  }
}
/* ── пассажир доставлен: встаёт кандидатом в кантине (12a-crew), не дважды ── */
function bargePaxDeliver(b){
  if(!b.paxSeed)return;
  if(G.bargePax.some(p=>p.seed===b.paxSeed))return;
  const c=genMerc(b.paxSeed,null);
  c.id="bp"+b.paxSeed;
  c.story="вы вытащили его с баржи «"+b.capName+"»";
  G.bargePax.push({id:c.id,seed:c.seed,name:c.name,spec:c.spec,traits:c.traits,
    xp:c.xp,fee:Math.round(c.fee*.6),story:c.story});   // спасённый идёт к вам дешевле
  b.paxSeed=0;
  logAdd("good","С баржи спасён пассажир — "+c.name+" ищет вас в кантине");
}
/* ── проверка подхода: возвращает true, если игрок у баржи (и, может, открыл торг) */
function bargeInteract(sh){
  let near=null,nd=1e9;
  for(const b of G.barges){
    const d=Math.hypot(sh.x-b.x,sh.y-b.y);
    if(d<nd){nd=d;near=b;}
  }
  if(!near||nd>230)return false;
  const T=BARGE_TEMPER[near.temper]||BARGE_TEMPER.bold;
  /* под обстрелом не торгуют: баржу надо сперва отбить у пиратов. Прилавок
     закрыт, зато видно, что помочь можно огнём — или добить самому. */
  if(near.distress){
    G.prompt="БАРЖА «"+near.capName.toUpperCase()+"» ПОД ОБСТРЕЛОМ · "+
      Math.round(clamp(near.hp/near.hullMax,0,1)*100)+"%\n"+
      "ОТГОНИТЕ ПИРАТОВ — ИЛИ ДОБЕЙТЕ САМИ";
    return true;
  }
  G.prompt="ТОРГОВАЯ БАРЖА «"+near.capName.toUpperCase()+"» · "+T.ru.toUpperCase()+
    "\nДЕЙСТВИЕ — ТОРГ БЕЗ СТЫКОВКИ";
  if(actEdge)openBarge(near);
  return true;
}

/* ══════════════ контракт охраны ══════════════
   Наняться проводить баржу: плата вперёд, маршрут известен заранее (адрес — в
   журнале). Провал НЕ отнимает кредиты — он отнимает репутацию. Стабильного
   плюса тут нет, как и у наёмника: аванс мал, а риск ваш. */
function bargeEscortAdvance(b){return 200+Math.floor((b.cap||100)*3);}
function bargeEscortAccept(b){
  if(b.escort||b.distress)return false;
  b.escort=1;
  const adv=bargeEscortAdvance(b);
  earn(adv,"escort");
  const dst=bargeSysAt(b.to);
  if(typeof questAdd==="function")questAdd("escort:"+b.seed,{
    ru:"Проводить баржу «"+b.capName+"»",kind:"job",from:"баржа",
    note:"довести до «"+((dst&&dst.station&&dst.station.name)||"назначения")+
      "» живой. Аванс уже выплачен; провал бьёт по репутации, не по кошельку",
    sx:dst?dst.sx:null,sy:dst?dst.sy:null,reward:"репутация у назначения"});
  say("Аванс охраны +"+adv+" кр\nдоведите баржу живой");
  logAdd("money","Наняты охраной баржи «"+b.capName+"» · аванс +"+adv+" кр");
  return true;
}
function bargeEscortEnd(b,ok){
  if(!b.escort)return;b.escort=0;
  const key="escort:"+b.seed;
  if(ok){
    if(typeof questDone==="function")questDone(key,"баржа дошла");
  }else{
    if(typeof questFail==="function")questFail(key,"баржу потеряли");
    /* провал: репутация вниз, но кредиты (аванс) не отбираются */
    const dst=bargeSysAt(b.to)||bargeSysAt(b.from);
    if(dst&&typeof repAdd==="function")repAdd(-2,dst);
  }
}
/* баржа ушла из системы живой с контрактом — довели: засчитываем при despawn.
   Здесь нет отдельного despawn-события, поэтому договор закрывается либо
   спасением (bargeRescued), либо гибелью (bargeSunk); если баржа просто мирно
   ушла за край без боя, считаем это доводкой. */
function bargeEscortLeave(b){if(b.escort)bargeEscortEnd(b,true);}

/* ══════════════ остовы погибших барж ══════════════ */
function wrecksHere(){return G.wrecks[G.sx+","+G.sy]||null;}
/* подход к остову в системе → осмотр ровно раз (та же награда, что «остов
   корабля» из POI_FIND: годная часть с обломков) */
function wreckInteract(sh){
  const list=wrecksHere();if(!list)return false;
  let near=null,nd=1e9;
  for(const w of list){const d=Math.hypot(sh.x-w.x,sh.y-w.y);if(d<nd){nd=d;near=w;}}
  if(!near||nd>240)return false;
  if(near.seen){G.prompt="ОСТОВ БАРЖИ «"+String(near.name).toUpperCase()+"» · УЖЕ ОБЫСКАН";return true;}
  G.prompt="ОСТОВ БАРЖИ «"+String(near.name).toUpperCase()+"»\nДЕЙСТВИЕ — ОБЫСКАТЬ ОБЛОМКИ";
  if(actEdge){
    near.seen=1;
    const F=(typeof POI_FIND!=="undefined"&&POI_FIND.wreck)?POI_FIND.wreck:null;
    const r=rng(hashi(near.seed,0xF17D,3));
    let got="ничего годного";
    if(F&&typeof F.give==="function")got=F.give(r,sysDanger(G.sx,G.sy));
    else if(typeof addPart==="function"){addPart(genPart(hashi(near.seed,7,0x1E),near.tier|0));got="часть с обломков";}
    tell("tech","Остов баржи: "+got,"Остов баржи «"+near.name+"»\n"+got);
    logAdd("tech","Обыск остова баржи «"+near.name+"» · "+got);
    if(typeof saveGame==="function")saveGame(true);
  }
  return true;
}
function drawWrecksSystem(zx,zy,Z){
  const list=wrecksHere();if(!list)return;
  for(const w of list){
    const x=zx(w.x),y=zy(w.y);
    if(x<-60||x>W+60||y<-60||y>H+60)continue;
    /* тёмный переломленный корпус: тело, обвод, тусклый аварийный маяк */
    ctx.save();ctx.translate(x,y);
    const s=clamp(Z,.5,1.4);ctx.scale(s,s);ctx.rotate((w.seed%628)/100);
    ctx.fillStyle="rgba(24,26,32,.96)";ctx.strokeStyle="rgba(0,0,0,.5)";ctx.lineWidth=.8;
    ctx.beginPath();
    ctx.moveTo(-34,-6);ctx.lineTo(-6,-11);ctx.lineTo(30,-7);ctx.lineTo(34,3);
    ctx.lineTo(-4,7);ctx.lineTo(-30,6);ctx.closePath();ctx.fill();ctx.stroke();
    for(let i=0;i<5;i++){ctx.strokeStyle="rgba(0,0,0,.4)";
      ctx.beginPath();ctx.moveTo(-24+i*12,-9);ctx.lineTo(-24+i*12,6);ctx.stroke();}
    /* отломанная секция рядом */
    ctx.fillStyle="rgba(20,22,28,.95)";
    ctx.beginPath();ctx.moveTo(40,4);ctx.lineTo(52,-2);ctx.lineTo(50,8);ctx.closePath();ctx.fill();
    ctx.restore();
    if(!w.seen){
      const bl=Math.pow(Math.max(0,Math.sin(G.t*.05+w.seed)),8);
      if(bl>.02){ctx.fillStyle="rgba(255,110,90,"+(.9*bl).toFixed(2)+")";
        ctx.beginPath();ctx.arc(x,y-10,2.2,0,TAU);ctx.fill();}
      ctx.fillStyle="rgba(255,150,120,.7)";ctx.font="8px ui-monospace,monospace";
      ctx.textAlign="center";ctx.fillText("ОСТОВ БАРЖИ",x,y+22);
    }
  }
}

/* ══════════════ корпус баржи ══════════════
   Собран той же школой, что пиратский корпус (12i) и правило «много кусков —
   одно тело»: сперва тёмная масса-силуэт, всё навесное внутрь обвода, один свет
   последним слоем. Но язык другой — не сварной ком, а длинный работяга:
   вытянутое тело, хребет с контейнерами, большие тихоходные движки, ходовая
   рубка у носа. Оружия нет вовсе. Печётся один раз на seed в офскрин. */
const BARGE_SS=3;
const BARGE_ART={};
function bargeArtOf(b){
  const key="bg"+b.seed;
  if(BARGE_ART[key])return BARGE_ART[key];
  const r=rng(hashi(b.seed,0x5A19,9));
  const L=104+r()*40, hw=L*(.14+r()*.04);
  const nose=L*.52, tail=-L*.48;
  const polys=[],lines=[],cont=[],lights=[];
  const add=(pts,c,e)=>polys.push({p:pts,c,e:e||0});
  /* корпусный цвет — промышленный, приглушённый, не пиратская ржавь */
  const base=[54+r()*26,64+r()*30,80+r()*30];
  const C=[mixc(base,[8,10,14],.72),mixc(base,[10,12,18],.42),
    mixc(base,[236,226,206],.30),mixc(base,[24,28,36],.55)];
  /* ── тело: одна длинная масса под всей сборкой ── */
  const bodyN=8,body=[],top=[];
  for(let i=0;i<=bodyN;i++){
    const t=i/bodyN,x=lerp(tail,nose,t);
    const w=hw*(t<.12?t/.12:(t>.86?(1-t)/.14*.7+.3:1));
    top.push([x,-w]);body.push([x,-w]);
  }
  for(let i=bodyN;i>=0;i--){
    const t=i/bodyN,x=lerp(tail,nose,t);
    const w=hw*(t<.12?t/.12:(t>.86?(1-t)/.14*.7+.3:1));
    body.push([x,w]);
  }
  add(body,0);
  /* обшивка секциями: длинный корпус без швов читается штампованной трубой */
  const segN=6+Math.floor(r()*3);
  for(let i=1;i<segN;i++){
    const x=lerp(tail*.9,nose*.9,i/segN);
    lines.push([x,-hw*.92,x,hw*.92,.5]);
  }
  /* нижний киль-балка — по нему идут трюмные люки */
  add([[tail*.8,hw*.5],[nose*.8,hw*.5],[nose*.7,hw*1.02],[tail*.7,hw*1.02]],3);
  for(let i=0;i<5;i++){
    const x=lerp(tail*.7,nose*.7,(i+.5)/5);
    add([[x-L*.03,hw*.55],[x+L*.03,hw*.55],[x+L*.03,hw*.95],[x-L*.03,hw*.95]],1);
  }
  /* ── хребет с контейнерами: это и есть подпись баржи ──
     Ряд коробов разной высоты и приглушённых цветов вдоль спины, часть с люком,
     часть открытая. Держим их СТРОГО внутри обвода тела по длине. */
  const stackN=4+Math.floor(r()*3);
  const cCols=[[92,84,70],[70,86,96],[96,72,66],[74,92,74],[86,80,96]];
  for(let i=0;i<stackN;i++){
    const cx=lerp(tail*.62,nose*.6,(i+.5)/stackN), cw=L*(.07+r()*.02);
    const ch=hw*(1.1+r()*.9), cy=-hw*.85;
    const cc=cCols[Math.floor(r()*cCols.length)];
    cont.push({x:cx,w:cw,y0:cy,y1:cy-ch,c:cc,r:r()});
  }
  /* ── ходовая рубка у носа: небольшой горб с окном ── */
  const bx=nose*.72,bw=L*.06,bh=hw*1.3;
  add([[bx-bw,-hw*.7],[bx+bw*1.2,-hw*.7],[bx+bw,-hw*.7-bh],[bx-bw*.8,-hw*.7-bh*.9]],1);
  lights.push({x:bx,y:-hw*.7-bh*.6,c:"win"});
  /* ── движки: два-три больших тихоходных раструба на корме ── */
  const engN=2+(r()<.5?1:0);
  for(let i=0;i<engN;i++){
    const ey=(i-(engN-1)/2)*hw*.9;
    const el=L*.1,ew=hw*.5;
    add([[tail+el,ey-ew],[tail-el*.8,ey-ew*1.15],[tail-el*.8,ey+ew*1.15],[tail+el,ey+ew]],3);
    add([[tail-el*.8,ey-ew*1.15],[tail-el*1.3,ey-ew*.7],[tail-el*1.3,ey+ew*.7],
      [tail-el*.8,ey+ew*1.15]],0);
    lights.push({x:tail-el,y:ey,c:"eng",r:ew*.7});
  }
  /* ── навесная мелочь: трубы, баки, антенны — вся внутри обвода ── */
  const gN=12+Math.floor(r()*10);
  for(let i=0;i<gN;i++){
    const x=lerp(tail*.85,nose*.8,r()), y=(r()*2-1)*hw*.55;
    const w=L*(.01+r()*.02),h=hw*(.08+r()*.14);
    add([[x,y],[x+w,y-h*.2],[x+w,y+h],[x,y+h*.9]],r()<.4?0:3);
  }
  /* бортовые ходовые огни: красный слева, зелёный справа — как у станции */
  lights.push({x:nose*.4,y:-hw,c:"nav",g:0});
  lights.push({x:nose*.4,y:hw,c:"nav",g:1});

  const rad=L*.75;
  const cn=document.createElement("canvas");
  cn.width=cn.height=Math.ceil(rad*2*BARGE_SS);
  const g=cn.getContext("2d");const prev=ctx;ctx=g;
  g.setTransform(BARGE_SS,0,0,BARGE_SS,rad*BARGE_SS,rad*BARGE_SS);
  for(const q of polys){
    ctx.beginPath();ctx.moveTo(q.p[0][0],q.p[0][1]);
    for(let i=1;i<q.p.length;i++)ctx.lineTo(q.p[i][0],q.p[i][1]);
    ctx.closePath();
    ctx.fillStyle=rgba(C[q.c],1);ctx.fill();
    ctx.strokeStyle="rgba(0,0,0,"+(q.e?.5:.24)+")";ctx.lineWidth=q.e?.8:.4;ctx.stroke();
  }
  /* контейнеры поверх корпуса: тело коробки, обвод, светлая верхняя грань */
  for(const k of cont){
    ctx.fillStyle="rgb("+(k.c[0]|0)+","+(k.c[1]|0)+","+(k.c[2]|0)+")";
    ctx.strokeStyle="rgba(0,0,0,.45)";ctx.lineWidth=.6;
    ctx.beginPath();ctx.rect(k.x-k.w,k.y1,k.w*2,k.y0-k.y1);ctx.fill();ctx.stroke();
    /* люк или перемычки — короб не должен быть пустой заливкой */
    ctx.strokeStyle="rgba(0,0,0,.3)";ctx.lineWidth=.4;
    ctx.beginPath();ctx.moveTo(k.x,k.y1);ctx.lineTo(k.x,k.y0);ctx.stroke();
    ctx.strokeStyle="rgba(255,240,220,.25)";
    ctx.beginPath();ctx.moveTo(k.x-k.w,k.y1);ctx.lineTo(k.x+k.w,k.y1);ctx.stroke();
  }
  for(const l of lines){
    ctx.strokeStyle="rgba(0,0,0,"+(l[4]*.6).toFixed(2)+")";ctx.lineWidth=l[4];
    ctx.beginPath();ctx.moveTo(l[0],l[1]);ctx.lineTo(l[2],l[3]);ctx.stroke();
  }
  /* ── один свет на всю сборку последним слоем ── */
  ctx.globalCompositeOperation="source-atop";
  const lg=ctx.createLinearGradient(0,-hw*2.4,0,hw*1.4);
  lg.addColorStop(0,"rgba(255,240,216,.32)");
  lg.addColorStop(.45,"rgba(255,224,196,0)");
  lg.addColorStop(1,"rgba(0,0,0,.48)");
  ctx.fillStyle=lg;ctx.fillRect(-rad,-rad,rad*2,rad*2);
  ctx.globalCompositeOperation="source-over";
  /* верхняя кромка ловит свет — по ней силуэт читается на тёмном космосе */
  ctx.strokeStyle="rgba(255,238,216,.5)";ctx.lineWidth=.7;
  ctx.beginPath();
  top.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));
  ctx.stroke();
  ctx=prev;
  const art={cn,rad,L,hw,lights,cols:C};
  BARGE_ART[key]=art;return art;
}
function drawBarge(b){
  const art=bargeArtOf(b);
  ctx.drawImage(art.cn,-art.rad,-art.rad,art.rad*2,art.rad*2);
  /* живой слой: ходовые огни и рубка мигают — печь их нельзя */
  for(const li of art.lights){
    if(li.c==="nav"){
      ctx.fillStyle=li.g?"rgba(120,240,150,":"rgba(255,90,80,";
      const on=Math.sin(G.t*.08+(li.g?1.6:0))>0?.95:.25;
      ctx.fillStyle+=on+")";
      ctx.beginPath();ctx.arc(li.x,li.y,1.6,0,TAU);ctx.fill();
    }else if(li.c==="win"){
      ctx.fillStyle=(Math.sin(G.t*.05)>-.3)?"rgba(255,228,170,.9)":"rgba(255,228,170,.45)";
      ctx.beginPath();ctx.arc(li.x,li.y,1.5,0,TAU);ctx.fill();
    }
  }
  /* выхлоп тихоходных движков: тёмный раструб с горящим зевом, а не факел.
     Раньше здесь были налегающие полупрозрачные круги — на корме они сходились
     мыльными пузырями. Теперь у каждого сопла тёмное кольцо и компактное
     свечение в горловине, кольца не налегают. */
  for(const li of art.lights){
    if(li.c!=="eng")continue;
    const ex=li.x-1;
    ctx.fillStyle="rgba(10,12,16,.95)";
    ctx.beginPath();ctx.arc(ex,li.y,li.r,0,TAU);ctx.fill();
    ctx.strokeStyle="rgba(0,0,0,.6)";ctx.lineWidth=.8;ctx.stroke();
    const fg=ctx.createRadialGradient(ex,li.y,0,ex,li.y,li.r);
    fg.addColorStop(0,"rgba(255,214,158,.9)");fg.addColorStop(.55,"rgba(255,150,80,.4)");
    fg.addColorStop(1,"rgba(255,120,60,0)");
    ctx.fillStyle=fg;ctx.beginPath();ctx.arc(ex,li.y,li.r*.82,0,TAU);ctx.fill();
  }
}
function drawBarges(zx,zy,Z){
  for(const b of G.barges){
    const x=zx(b.x),y=zy(b.y);
    if(x>-80&&x<W+80&&y>-80&&y<H+80){
      ctx.save();ctx.translate(x,y);ctx.rotate(b.a);
      const s=clamp(Z,.5,1.5)*.8;ctx.scale(s,s);
      drawBarge(b);
      ctx.restore();
      const hp=clamp(b.hp/b.hullMax,0,1);
      if(hp<.999){
        ctx.fillStyle="rgba(255,255,255,.14)";ctx.fillRect(x-24,y-30,48,3);
        ctx.fillStyle="#8fd08a";ctx.fillRect(x-24,y-30,48*hp,3);
      }
      ctx.fillStyle="rgba(143,208,138,.8)";ctx.font="8px ui-monospace,monospace";
      ctx.textAlign="center";
      ctx.fillText("БАРЖА «"+b.capName.toUpperCase()+"»",x,y+30);
    }else if(G.tech.has("radar")){
      const ang=Math.atan2(b.y-G.ship.y,b.x-G.ship.x);
      const mx=W/2+Math.cos(ang)*(Math.min(W,H)/2-32),my=H/2+Math.sin(ang)*(Math.min(W,H)/2-32);
      ctx.fillStyle="rgba(143,208,138,.8)";
      ctx.beginPath();ctx.arc(mx,my,3,0,TAU);ctx.fill();
    }
  }
}
/* дот баржи на карте: медленная точка на плече маршрута фактора (18-mode-map) */
function drawBargesMap(vis){
  const legs=bargeLegs();
  if(!legs.length)return;
  const at=key=>{const[sx,sy]=key.split(",").map(Number);
    return vis.find(v=>v.gx===sx&&v.gy===sy)||null;};
  const bucket=Math.floor(Date.now()/BARGE_PERIOD);
  for(let li=0;li<legs.length;li++){
    const a=at(legs[li][0].key),c=at(legs[li][1].key);
    if(!a||!c)continue;
    const r=rng(hashi(legs[li][0].sx+legs[li][1].sx,legs[li][0].sy+legs[li][1].sy,bucket*53));
    if(r()>=.6)continue;
    /* точка ползёт туда-обратно по плечу — гружёная в одну сторону, порожняя в
       другую, видно без единой цифры */
    const ph=((G.t*.03+r()*7)%2);
    const t=ph<1?ph:2-ph;
    const bx=lerp(a.x,c.x,t),by=lerp(a.y,c.y,t);
    ctx.fillStyle="rgba(143,208,138,.9)";
    ctx.beginPath();ctx.arc(bx,by,2.4,0,TAU);ctx.fill();
    ctx.strokeStyle="rgba(143,208,138,.3)";ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(bx,by,5,0,TAU);ctx.stroke();
  }
}

/* ══════════════ торг с баржой ══════════════ */
const $bg=document.getElementById("barge"),$bgBody=document.getElementById("bgBody");
let bargeCur=null;
function openBarge(b){
  bargeCur=b;G.mode="barge";G.ap=null;G.orbit=null;
  for(const k in keys)keys[k]=false;
  const T=BARGE_TEMPER[b.temper]||BARGE_TEMPER.bold;
  document.getElementById("bgName").textContent="БАРЖА «"+b.capName.toUpperCase()+"»";
  document.getElementById("bgKind").textContent=
    "капитан "+T.ru+" · "+T.note+" · рейс: "+b.fac;
  logAdd("dim","Сблизились с баржой «"+b.capName+"»");
  $bg.classList.add("open");renderBarge();
}
function closeBarge(){
  $bg.classList.remove("open");G.mode="system";
  const b=bargeCur;
  if(b){const dx=G.ship.x-b.x,dy=G.ship.y-b.y,d=Math.hypot(dx,dy)||1;
    G.ship.x=b.x+dx/d*260;G.ship.y=b.y+dy/d*260;
    G.ship.vx=b.vx;G.ship.vy=b.vy;}
  say("Разошлись бортами");bargeCur=null;
}
document.getElementById("bLeaveBarge").addEventListener("click",closeBarge);
/* маленькая репутационная подвижка за состоявшуюся сделку — как у слабой
   станции, и только раз с одной баржи, чтобы торг не качал репутацию бесконечно */
function bargeRepNudge(b){
  if(b.repGiven)return;b.repGiven=1;
  const dst=bargeSysAt(b.to);if(dst&&typeof repAdd==="function")repAdd(1,dst);
}
function bargeElRow(label,sub,btns){
  const r=el("div","row");
  r.appendChild(el("div","nm","<b>"+label+"</b><s>"+sub+"</s>"));
  const wrap=el("div","");wrap.style.display="flex";wrap.style.gap="6px";
  for(const bt of btns){
    const btn=el("button","act"+(bt.gold?" gold":""),bt.txt);
    btn.disabled=bt.dis;btn.onclick=bt.on;wrap.appendChild(btn);
  }
  r.appendChild(wrap);return r;
}
function renderBarge(){
  const b=bargeCur;if(!b)return;
  const st=stat();
  document.getElementById("bgCr").textContent=G.credits.toLocaleString("ru")+" кр";
  document.getElementById("bgHold").textContent="трюм "+held()+"/"+st.cargoMax;
  $bgBody.innerHTML="";
  $bgBody.appendChild(el("div","sec","БАРЖА ВЕЗЁТ · "+RES[b.good].ru.toUpperCase()+
    " ×"+b.qty+" · назначение «"+((bargeSysAt(b.to)||{station:{name:"?"}}).station.name)+"»"));
  /* наняться охраной: аванс вперёд, довести живой (12l — контракт охраны) */
  if(!b.escort){
    const adv=bargeEscortAdvance(b);
    $bgBody.appendChild(bargeElRow("НАНЯТЬСЯ ОХРАНОЙ",
      "аванс +"+adv+" кр вперёд · довести до назначения живой · провал бьёт по репутации, не по кошельку",
      [{txt:"ВЗЯТЬ РЕЙС",gold:1,dis:false,on:()=>{bargeEscortAccept(b);renderBarge();}}]));
  }else{
    $bgBody.appendChild(el("div","sec","ВЫ ОХРАНА ЭТОГО РЕЙСА · ведите баржу до назначения"));
  }
  /* купить у баржи её груз */
  {
    const p=bargeSellPrice(b,b.good);
    const room=Math.max(0,st.cargoMax-held());
    const canN=Math.min(b.qty,room,Math.floor(G.credits/p));
    const buy=n=>{
      n=Math.min(n,b.qty,Math.max(0,st.cargoMax-held()),Math.floor(G.credits/p));
      if(n<=0){say("Некуда или не на что");return;}
      G.credits-=n*p;addRes(b.good,n);b.qty-=n;b.dealt+=n;bargeRepNudge(b);
      logAdd("money","Куплено у баржи: "+RES[b.good].ru.toLowerCase()+" ×"+n+" по "+p+" кр");
      renderBarge();
    };
    $bgBody.appendChild(bargeElRow("КУПИТЬ "+RES[b.good].ru,
      p+" кр/ед · на станции назначения "+bargeDestPrice(b,b.good)+" кр · экономите перелёт",
      [{txt:"+1",dis:canN<1,on:()=>buy(1)},{txt:"+10",dis:canN<1,on:()=>buy(10)},
       {txt:"ВСЁ",gold:1,dis:canN<1,on:()=>buy(canN)}]));
  }
  /* продать барже из своего трюма — по любому ходовому товару */
  const mine=TRADE_KEYS.filter(k=>G.cargo[k]>0);
  if(mine.length){
    $bgBody.appendChild(el("div","sec","ПРОДАТЬ БАРЖЕ · платит меньше станции, зато прямо здесь"));
    for(const k of mine){
      const p=bargeBuyPrice(b,k);
      const sell=n=>{
        n=Math.min(n,G.cargo[k],Math.floor(b.budget/p));
        if(n<=0){say(b.budget<p?"У баржи не хватает кредитов":"Нет товара");return;}
        G.cargo[k]-=n;const rev=n*p;earn(rev,"trade");b.budget-=rev;b.dealt+=n;bargeRepNudge(b);
        G.soldTotal=(G.soldTotal|0)+rev;
        logAdd("money","Продано барже: "+RES[k].ru.toLowerCase()+" ×"+n+" по "+p+" кр");
        renderBarge();
      };
      const canN=Math.min(G.cargo[k],Math.floor(b.budget/p));
      $bgBody.appendChild(bargeElRow(RES[k].ru+" ×"+G.cargo[k],
        p+" кр/ед · на станции назначения "+bargeDestPrice(b,k)+" кр",
        [{txt:"−1",dis:canN<1,on:()=>sell(1)},{txt:"−10",dis:canN<1,on:()=>sell(10)},
         {txt:"ВСЁ",dis:canN<1,on:()=>sell(G.cargo[k])}]));
    }
  }else{
    $bgBody.appendChild(el("div","row","<div class='nm'><b>Трюм пуст</b>"+
      "<s>барже нечего у вас купить — но её груз можно взять</s></div>"));
  }
}
