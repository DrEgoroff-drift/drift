/* ══════════════ орудие в семи числах, щит в трёх повадках (M362, §2 §4) ══════════════
   До сих пор «пушка» была двумя числами — урон и откат, — и весь бой сводился
   к тому, чтобы держать нос на цели. Семь чисел делают из неё вещь, у которой
   есть характер: медленный снаряд промахивается по быстрому, узкий конус не
   прощает разворота, медленная наводка не поспевает за тем, кто ходит бортом.
   Всё семь пишутся на карточке — скрытых чисел у орудия нет (§2).

   Щит — не тридцать чисел, а три повадки: сплошной, лобовой, импульсный (§4).
   Тип берётся из seed самой части, а не из отдельной таблицы: значит, поле,
   которое лежит у вас в трюме, УЖЕ имеет свой характер, и его не надо выдавать
   заново. Так же и у пиратов — по рангу.

   Чего здесь НЕТ и почему. §4 просит перенести бак и дальность прыжка с
   реактора на бак и двигатель, а реактору отдать ёмкость и регенерацию. Это
   правка genPart: аффиксы восстанавливаются из seed, и смена набора аффиксов
   категории втихую переписала бы уже собранные части у всех. Такая правка
   заводит `PART_GEN` 2 — она стоит в очереди на M364–M366 вместе с двадцатью
   семействами. Пока ёмкость и регенерация энергии считаются от уровня реактора
   (модуль `weapon`) и тира установленной части `core`. */

/* ── тип урона (§2) ──
   Кинетика: по корпусу полностью, по щиту вполовину. Энергия — наоборот.
   Фугас — поровну. Матрица одна на всех: и по вам стреляют по ней же. */
const DMG_TYPES={
  kin:  {ru:"кинетический", hull:1,  shield:.5},
  en:   {ru:"энергетический",hull:.5, shield:1},
  blast:{ru:"фугасный",     hull:.8, shield:.8},
  /* термический (M364): §2 знает три типа, а §2.1 говорит про лазер «слаб по
     щиту» — энергетический по матрице как раз СИЛЁН по щиту. Лазер не режет
     поле, он добивает корпус, и ему нужен свой тип. В DMG_KEYS его нет
     намеренно: типы стволов первого поколения выбираются по `%3`, и четвёртый
     ключ в списке переписал бы их всем. */
  therm:{ru:"термический",  hull:1.15,shield:.35}
};
const DMG_KEYS=["kin","en","blast"];
function dmgMul(type,onShield){
  const T=DMG_TYPES[type]||DMG_TYPES.kin;
  return onShield?T.shield:T.hull;
}
/* ── три повадки щита (§4) ── */
const SHIELD_TYPES={
  solid:{ru:"сплошной", note:"ровно со всех сторон"},
  front:{ru:"лобовой",  note:"вдвое в лоб, ничего в корму"},
  pulse:{ru:"импульсный",note:"не восстанавливается, возвращается целиком раз в 20 с"}
};
const SHIELD_KEYS=["solid","front","pulse"];
const SHIELD_DELAY=90;       /* кадров тишины после попадания, прежде чем поле растёт */
const SHIELD_PULSE=1200;     /* импульсный собирается целиком раз в двадцать секунд */
/* Доля щита по месту попадания: лобовой держит вдвое в лоб и не держит в корму.
   `ang` — угол между КУРСОМ ВЫСТРЕЛА и носом цели, та же мера, что у
   hitLocMul: ноль значит «летит туда же, куда смотрит нос», то есть вошёл
   С КОРМЫ; π значит «летит навстречу носу», то есть в лоб. */
function shieldFace(type,ang){
  if(type!=="front")return 1;
  const a=Math.abs(ang);
  return a<Math.PI/3?0:(a>Math.PI*2/3?2:1);
}
/* тип берётся из seed части: поле в трюме уже имеет характер */
function shieldTypeOf(part){
  if(!part)return "solid";
  return SHIELD_KEYS[(part.seed>>>5)%3];
}
/* ── семь чисел орудия ──
   Считаются от того, что уже есть: уровня орудийного модуля, установленной
   части `gun` и её тира. Разные пушки различаются seed'ом части, а не новой
   таблицей: двадцать семейств придут в M364–M366 и заменят эту развёртку. */
const GUN_RANGE0=760, GUN_SPEED0=9, GUN_CONE0=.35, GUN_LEAD0=.2;
/* stat() зовут десятки раз за кадр, а семь чисел меняются только со сменой
   ствола или уровня. Без этой памятки прогон набора вырос вчетверо на одних
   toFixed — считаем один раз на сборку. */
let GUN_CACHE=null,GUN_KEY="";
function gunSpec(dmg,cool,gunPart,lvl){
  const key=dmg+"|"+cool+"|"+(gunPart?gunPart.seed+":"+gunPart.tier+":"+(gunPart.fam||"-")+":"+(gunPart.named||"-"):"-")+"|"+lvl;
  if(GUN_KEY===key&&GUN_CACHE)return GUN_CACHE;
  GUN_KEY=key;return GUN_CACHE=gunSpecMake(dmg,cool,gunPart,lvl);
}
function gunSpecMake(dmg,cool,gunPart,lvl){
  const s=gunPart?gunPart.seed:0;
  const t=gunPart?(gunPart.tier|0):0;
  /* без установленной части ствол — середина каждого разброса, а не его дно:
     seed 0 давал бы самый узкий конус, самый медленный снаряд и худшую
     точность разом, и стартовое орудие читалось бы как поломанное */
  const r=k=>gunPart?((s>>>k)&255)/255:.5;
  /* тип орудия: у ствола он свой и написан на карточке */
  const type=gunPart?DMG_KEYS[(s>>>3)%3]:"kin";
  /* тир двигает числа в разные стороны: тяжёлый ствол бьёт дальше и точнее,
     но ведёт цель медленнее и смотрит уже */
  const base={
    dmg,type,cool,
    range:Math.round(GUN_RANGE0*(.85+r(0)*.35)+t*40),
    speed:+(GUN_SPEED0*(.8+r(8)*.5)+t*.35).toFixed(2),
    cone:+(GUN_CONE0*(.6+r(16)*1.1)).toFixed(3),
    lead:+(GUN_LEAD0*(.55+r(24)*1.0)).toFixed(3),
    /* разброс падает с тиром: отменный ствол кладёт снаряд туда, куда смотрит */
    /* .05 в середине даёт замеренную кривую попаданий: 100 % на двухстах,
       86 % на четырёхстах, 43 % на шестистах, 34 % на пределе. Точка,
       где стоит подойти ближе, — примерно пятьсот. */
    spread:+(.05*(.6+r(2)*1.2)/(1+t*.35)).toFixed(4),
    fx:"bullet",en:1,lvl:lvl|0
  };
  return gunPart&&gunPart.fam?gunFamilyApply(base,gunPart):base;
}
/* ── семейство поверх семи чисел (M364, §2.1) ──
   Семейство и завод двигают ТЕ ЖЕ числа, а не заводят вторых: кривая
   попаданий M362 замерена, терять её незачем. Свои аффиксы ствола
   (дальность, конус, наводка, расход, жар, разброс) читаются из бонусов
   САМОЙ части — они про этот ствол, а не про всю сборку. */
function gunFamilyApply(g,p){
  const F=GUN_FAMILY[p.fam];
  if(!F)return g;
  const W=GUN_FACTORY[p.fact]||GUN_FACTORY[0];
  const b=p.bonus||{};
  const mul=(k,d)=>Math.max(.15,1+(b[k]||0))*(d===undefined?1:d);
  const out={
    dmg:g.dmg*F.dmg*W.dmg,
    type:F.type,
    cool:Math.max(3,Math.round(g.cool*F.cool*W.cool)),
    range:Math.round(g.range*F.range*mul("rangeMul")),
    speed:F.speed?+(g.speed*F.speed).toFixed(2):0,
    cone:+(g.cone*F.cone*mul("coneMul")).toFixed(3),
    lead:+(g.lead*F.lead*mul("leadMul")).toFixed(3),
    spread:+(g.spread*F.spread*W.spread*mul("spreadMul")).toFixed(4),
    en:+(F.en*mul("enMul")).toFixed(3),
    fx:F.fx,fam:p.fam,lvl:g.lvl
  };
  /* именной: та же семья, но повадка чужая и числа сильнее (M366) */
  if(p.named&&typeof GUN_NAMED_BY_ID!=="undefined"&&GUN_NAMED_BY_ID[p.named]){
    const N=GUN_NAMED_BY_ID[p.named];
    out.fx=N.fx;
    out.dmg*=N.dmg;
    out.cool=Math.max(3,Math.round(out.cool*N.cool));
    out.named=N.id;
  }
  if(F.pellets)out.pellets=F.pellets;
  if(F.burn)out.burn=+(F.burn*mul("burnMul")).toFixed(3);
  if(F.heat)out.heat=+(F.heat*mul("burnMul")).toFixed(3);
  if(b.knockMul)out.knock=+b.knockMul.toFixed(3);
  return out;
}
/* промах — это угол, а не скрытый бросок (§2): снаряд виден, и видно, что он
   ушёл мимо. Ошибка растёт с дальностью и с угловой скоростью цели. */
function gunMiss(g,dist,angVel,r){
  const far=clamp(dist/Math.max(1,g.range),0,1);
  const spin=clamp(Math.abs(angVel||0)*26,0,1.4);
  return (r-.5)*2*g.spread*(.45+far)*(1+spin);
}
/* честное упреждение по снаряду: куда смотреть, чтобы попасть в того, кто идёт.
   Две итерации — этого хватает, и это дешевле решения квадратного уравнения. */
function gunLeadAngle(sx,sy,tgt,speed){
  let t=0;
  for(let i=0;i<2;i++){
    const px=tgt.x+(tgt.vx||0)*t,py=tgt.y+(tgt.vy||0)*t;
    t=Math.hypot(px-sx,py-sy)/Math.max(.1,speed);
  }
  const px=tgt.x+(tgt.vx||0)*t,py=tgt.y+(tgt.vy||0)*t;
  return Math.atan2(py-sy,px-sx);
}
/* ── энергия (§4) ──
   Одна шкала на выстрелы, регенерацию щита и маневровые. Пустая — не смерть:
   огонь вполовину, щит стоит, маневровые вялые. Ни сброса, ни перегрева. */
const EN_SHOT=7;        /* выстрел */
const EN_SHIELD=.9;     /* за единицу восстановленного щита */
const EN_THR=.055;      /* маневровые, за кадр полной тяги */
/* Ёмкость и восполнение — от уровня реактора, тира его части и её аффиксов
   (M366 отдал долг M362: `enCapAdd`/`enRegenAdd` живут на `core`). */
function energyCap(lvl,coreTier,add){return Math.round(48+lvl*26+coreTier*14+(add||0));}
function energyRegen(lvl,coreTier,add){return Math.round((.34+lvl*.16+coreTier*.07+(add||0))*1000)/1000;}
/* ── ствол ведёт метку сам (§2) ──
   У ствола есть свой угол. Он живёт внутри конуса вокруг носа и подходит
   к упреждению со своей скоростью наводки — не мгновенно. Автор о старом
   поведении: «можно носом вертеть, и она не наводится». Состояние на
   корабле одно: подвесов пока один, в M363 их станет несколько и каждый
   получит свой угол в этом же виде. */
function gunAimTick(g,sh,mk,dt,key){
  const k=key===undefined?0:key;
  if(!G.aim||typeof G.aim!=="object")G.aim={};
  if(!isFinite(G.aim[k]))G.aim[k]=sh.a;
  let want=sh.a;
  if(mk&&mk.hull>0)want=gunLeadAngle(sh.x,sh.y,mk,g.speed);
  /* внутрь конуса: за его край ствол не выходит ни при каком упреждении */
  const off=clamp(angDiff(want,sh.a),-g.cone,g.cone);
  const goal=angWrap(sh.a+off);
  G.aim[k]=angWrap(G.aim[k]+clamp(angDiff(goal,G.aim[k]),-g.lead*dt,g.lead*dt));
  /* нос повернули рывком — ствол не телепортируется, но и не остаётся за спиной */
  const back=angDiff(G.aim[k],sh.a);
  if(Math.abs(back)>g.cone)G.aim[k]=angWrap(sh.a+clamp(back,-g.cone,g.cone));
  return G.aim[k];
}
/* ── подвес правит числа ствола (M363, §3.1) ──
   Жёсткая: конус вдвое уже, урон ×1.25. Турель: как есть. Это не новый
   ствол, а тот же — поставленный иначе, поэтому правка идёт поверх семи
   чисел, а не внутрь них. */
function gunOnMount(g,m){
  if(!m)return g;
  const M=MOUNT_KINDS[m.mount]||MOUNT_KINDS.turret;
  if(M.cone===1&&M.dmg===1)return g;
  const out=Object.assign({},g);
  out.cone=+(g.cone*M.cone).toFixed(3);
  out.dmg=g.dmg*M.dmg;
  out.mount=m.mount;
  return out;
}
/* Семь чисел для КАЖДОГО установленного ствола, с поправкой его подвеса.
   Кэш тот же по смыслу, что у одиночного: stat() зовут десятки раз за кадр,
   а список меняется только при смене оснастки или уровня. */
let GUNS_CACHE=null,GUNS_KEY="";
function gunSpecs(list,dmg,cool,lvl){
  const key=dmg+"|"+cool+"|"+lvl+"|"+list.map(a=>a.slot+":"+a.part.seed+":"+a.part.tier+":"+(a.m?a.m.mount:"-")).join(",");
  if(GUNS_KEY===key&&GUNS_CACHE)return GUNS_CACHE;
  GUNS_KEY=key;
  return GUNS_CACHE=list.map(a=>({slot:a.slot,part:a.part,m:a.m,
    g:gunOnMount(gunSpecMake(dmg,cool,a.part,lvl),a.m)}));
}
/* ── группы 1–3 (§3.3) ──
   «всё», «дальнее», «ближнее». Дальнее — стволы с дальностью выше средней
   по сборке, ближнее — остальные; при одном стволе он и там, и там.
   Автоогонь берёт группу, у которой метка в дальности и в конусе, и
   переключается сам, пока игрок не закрепил одну (`G.gunPin`). */
const GUN_GROUPS=[{ru:"всё"},{ru:"дальнее"},{ru:"ближнее"}];
function gunGroupOf(list,i){
  if(list.length<2)return 0;
  let sum=0;for(const a of list)sum+=a.g.range;
  return list[i].g.range>=sum/list.length?1:2;
}
function gunsInGroup(list,grp){
  if(!grp)return list;
  return list.filter((a,i)=>gunGroupOf(list,i)===grp);
}
/* какая группа сейчас работает: закреплённая — или та, что достаёт метку */
function gunGroupPick(list,sh,mk){
  if(G.gunPin)return clamp(G.gunGroup|0,0,2);
  if(!mk||mk.hull<=0||list.length<2)return 0;
  const d=Math.hypot(mk.x-sh.x,mk.y-sh.y);
  const fits=g=>d<g.range&&Math.abs(angDiff(Math.atan2(mk.y-sh.y,mk.x-sh.x),sh.a))<g.cone;
  /* берём группу, у которой метку достаёт наибольшая ДОЛЯ стволов: иначе
     «всё» побеждало всегда — в него входит и дальний ствол, и ближний,
     который на девятистах только жжёт энергию. При равной доле выигрывает
     та, где стволов больше. */
  let best=0,bs=-1,bn=-1;
  for(const grp of [0,1,2]){
    const gs=gunsInGroup(list,grp);
    if(!gs.length)continue;
    const n=gs.filter(a=>fits(a.g)).length,sc=n/gs.length;
    if(sc>bs+1e-9||(Math.abs(sc-bs)<1e-9&&n>bn)){bs=sc;bn=n;best=grp;}
  }
  G.gunGroup=best;
  return best;
}
/* ── ствол виден на корпусе (M363, §3.1) ──
   Рисуется в осях корпуса, внутри его же поворота и масштаба, и смотрит
   туда, куда наведён: жёсткая почти по носу, турель — вслед за меткой.
   По этому и читается сборка раньше первого выстрела (кодекс §13: сперва
   увидеть, потом узнать). У пиратов стволов пока нет — их сборки приходят
   в M368, и тогда эта же функция нарисует и их. */
function gunBarrelsDraw(guns,shipA){
  if(!guns||!guns.length)return;
  ctx.save();
  for(const A of guns){
    const m=A.m;if(!m)continue;
    const aim=(G.aim&&isFinite(G.aim[A.slot]))?G.aim[A.slot]:shipA;
    const la=angWrap(aim-shipA);
    const sz=sizeIdx(partSize(A.part));
    /* длина мерена по корпусу: 2.6 читалось только на стенде, в игре ствола
       было не видно вовсе. 4.5–9 единиц — это десятая-пятая часть корпуса,
       столько и должен занимать ствол, чтобы сборка читалась силуэтом. */
    const len=4.5+sz*2.2, w=1.05+sz*.3;
    ctx.save();ctx.translate(m.x,m.y);ctx.rotate(la);
    /* ствол — тело в тени, а не проволока: конусная трубка тёмной заливкой,
       один светлый блик по верхней грани и дульный срез. Первая версия рисовала
       светлую линию поверх корпуса, и на близком плане она читалась усиком
       антенны, а не орудием (самокритика M363). */
    ctx.fillStyle="rgba(20,24,30,.95)";
    ctx.beginPath();
    ctx.moveTo(0,-w);ctx.lineTo(len,-w*.62);ctx.lineTo(len,w*.62);ctx.lineTo(0,w);
    ctx.closePath();ctx.fill();
    /* обвод, как у пластин корпуса: тёмное тело на тёмном корпусе без него
       не читается вовсе — на кадре ствол пропадал в силуэте */
    ctx.strokeStyle="rgba(186,198,212,.5)";ctx.lineWidth=.4;ctx.stroke();
    ctx.strokeStyle="rgba(214,224,236,.4)";ctx.lineWidth=.3;
    ctx.beginPath();ctx.moveTo(.5,-w*.62);ctx.lineTo(len-.4,-w*.42);ctx.stroke();
    /* жёсткая сидит в набор приливом, турель стоит на тумбе */
    ctx.fillStyle=m.mount==="fix"?"rgba(20,24,30,.95)":"rgba(52,60,70,.95)";
    ctx.beginPath();ctx.arc(0,0,m.mount==="fix"?w*.9:w*1.35,0,TAU);ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
function gunTotals(guns){
  const out={hull:0,shield:0,perEnergy:0};
  if(!guns||!guns.length)return out;
  let dmgSum=0;
  for(const A of guns){
    const g=A.g,rate=60/Math.max(1,g.cool);
    out.hull+=g.dmg*dmgMul(g.type,false)*rate;
    out.shield+=g.dmg*dmgMul(g.type,true)*rate;
    dmgSum+=g.dmg;
  }
  out.hull=Math.round(out.hull*10)/10;
  out.shield=Math.round(out.shield*10)/10;
  out.perEnergy=Math.round(dmgSum/Math.max(1e-6,EN_SHOT*guns.length)*100)/100;
  return out;
}
