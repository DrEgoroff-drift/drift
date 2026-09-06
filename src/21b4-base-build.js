/* ══════════════ он строит и развивает (M407, DESIGN-base §24.6, §37) ══════════════
   Наёмный смотритель не даёт базе простаивать. НАСТОЯЩИЙ её развивает — сам,
   каждую смену, из вашего кармана и не спрашивая.

   И вот в чём ловушка, ради которой вся веха: СТРОЯТ ВСЕ. Строят и плохие, и
   сносные, и настоящий. Разница не в том, строит ли он, а в том, ЧТО он ставит:
   радиатор на вулкане раньше второго бура; электролизёр раньше третьего склада;
   нижний ярус — только когда порода и тепло это оправдывают. Хороший читает
   формуляр планеты (M400), плохой — шаблон у себя в голове, и это читается не
   как ошибка, а как база, которая сорок смен тихо не такая.

   Отсюда и три оставшихся изъяна M405, которым нужно было именно это:
   «строит не то» ставит по своему шаблону, «боится глубины» никогда не вскроет
   нижний ряд, «паникует» после аврала изводит полсклада на царапину.

   Планету он по-прежнему не выбирает, баз не закладывает и от безнадёжного
   камня откажется (§24.7): разведка и расширение остаются игроку. */
const DEV_EVERY=6;           /* раз в столько смен он делает один ход */
const DEV_KEEP=1500;         /* меньше этого на счету он не тратит */
/* ── что он поставит следующим ──
   Чтение формуляра: сперва то, чего не хватает жизни, потом то, что мешает
   планета, и только потом добыча. Плохой берёт тот же список задом наперёд. */
function devWant(B,M){
  const P=basePower(B),D=(typeof baseDialOf==="function")?baseDialOf(B):null;
  const has=k=>{for(const c of (B.cells||[]))if(c&&c.hp>0&&c.k===k)return true;return false;};
  const cnt=k=>{let n=0;for(const c of (B.cells||[]))if(c&&c.hp>0&&c.k===k)n++;return n;};
  const good=[];
  /* 1. энергия: без неё всё остальное — половина */
  if(P.prod<=0||P.eff<.75)good.push("reactor");
  /* 2. жизнь: воздух, вода, харч — в этом порядке */
  if(!has("lyse"))good.push("lyse");
  if(!has("melter"))good.push("melter");
  if(!has("garden")&&!has("vat"))good.push("garden");
  if(!has("habitat"))good.push("habitat");
  /* 3. то, чем эта планета бьёт (M400) */
  if(D&&D.heat>=1&&!has("radiator"))good.unshift("radiator");
  if(D&&D.heat<=-1&&cnt("reactor")<2)good.unshift("reactor");
  if(D&&D.press>=1.4&&!has("seal"))good.push("seal");
  if(D&&D.wind>=1.4&&!has("shop"))good.push("shop");
  /* 4. и только теперь добыча и передел */
  if(cnt("drill")<2)good.push("drill");
  if(!has("storage"))good.push("storage");
  if(!has("refinery"))good.push("refinery");
  if(!has("mast"))good.push("mast");
  /* плохой строит тот же список задом наперёд: склад там, где нужен радиатор */
  const F=(typeof bmgrFlawOn==="function")?bmgrFlawOn(B):null;
  if(F&&F.id==="wrong")return good.slice().reverse();
  return good;
}
/* куда поставить: наверх — то, что смотрит в небо, вниз — остальное */
function devSpot(B,k,M){
  const surf=!!(BUILD[k]&&BUILD[k].surfaceOnly);
  const F=(typeof bmgrFlawOn==="function")?bmgrFlawOn(B):null;
  const deepOk=!(F&&F.id==="deep");
  const rows=baseRows(B);
  for(let r=surf?0:0;r<rows;r++){
    if(surf&&r>0)break;
    /* «боится глубины» (M405): нижний ярус для него не существует */
    if(!deepOk&&r>=rows-1)continue;
    for(let c=0;c<BASE_COLS;c++)if(!baseCell(B,c,r))return {c,r};
  }
  return null;
}
/* ── один ход развития ── */
function devStep(B,n){
  const M=(typeof bmgrOfBase==="function")?bmgrOfBase(B):null;
  if(!M||(n%DEV_EVERY))return 0;
  if(typeof baseIsRuin==="function"&&baseIsRuin(B))return 0;
  /* паникует (M405): после аврала он изводит полсклада на царапину */
  const F=(typeof bmgrFlawOn==="function")?bmgrFlawOn(B):null;
  if(F&&F.id==="panic"&&B.fire){
    let lost=0;
    for(const k in (B.pool||{})){
      const q=B.pool[k]|0;if(q<4)continue;
      const t=Math.ceil(q/2);B.pool[k]=q-t;lost+=t;
    }
    if(lost){baseLog(B,"panic",n,{q:lost});return 1;}
  }
  /* сперва чинит разбитое: развивать поверх сломанного — это не развитие */
  for(let r=0;r<baseRows(B);r++)for(let c=0;c<BASE_COLS;c++){
    const cell=baseCell(B,c,r);
    if(!cell||cell.hp>0)continue;
    const fc=(typeof baseFixCost==="function")?baseFixCost(B,cell.k):{credits:400,alloy:1};
    if(G.credits-fc.credits<DEV_KEEP)return 0;
    if((G.cargo.alloy|0)<(fc.alloy|0))return 0;
    G.credits-=fc.credits;G.cargo.alloy-=(fc.alloy|0);
    cell.hp=1;
    baseLog(B,"devfix",n,{what:BUILD[cell.k].ru,who:M.name});
    return 1;
  }
  /* потом ставит следующее — по формуляру или по своему шаблону */
  const want=devWant(B,M);
  for(const k of want){
    const spot=devSpot(B,k,M);
    if(!spot)continue;
    const cost=baseCost(k,B);
    if(G.credits-cost.credits<DEV_KEEP)return 0;
    if(cost.alloy&&(G.cargo.alloy|0)<cost.alloy)continue;
    G.credits-=cost.credits;if(cost.alloy)G.cargo.alloy-=cost.alloy;
    baseSet(B,spot.c,spot.r,{k,hp:1});
    baseLog(B,"dev",n,{what:BUILD[k].ru,who:M.name});
    return 1;
  }
  /* и отказывается расти дальше того, что планета держит: это тоже ход */
  return 0;
}
/* ── он снабжает себя (§37) ──
   Заказывает лёд и харч в свой запас, пока на счету есть деньги. Настоящий
   делает это раньше, чем запас кончится; плохой — когда уже поздно. */
const DEV_ICE=40, DEV_FOOD=40, DEV_BUY=9;
function devSupply(B,n){
  const M=(typeof bmgrOfBase==="function")?bmgrOfBase(B):null;
  if(!M)return 0;
  const L=baseLife(B),need=baseLifeNeed(B);
  const soon=M.q>=.6?8:3;                    /* хороший смотрит вперёд дальше */
  const low=(L.air<need.air*soon)||(L.water<need.water*soon)||((L.food|0)<need.food*soon);
  if(!low)return 0;
  const cost=DEV_BUY*(DEV_ICE+DEV_FOOD)/10|0;
  if(G.credits-cost<DEV_KEEP)return 0;
  G.credits-=cost;
  B.pool.ice=(B.pool.ice|0)+DEV_ICE;
  L.food=Math.min(LIFE_CAP,(L.food|0)+DEV_FOOD);
  if(L.q!=="good"&&M.q>=.6)L.q="good";
  baseLog(B,"devbuy",n,{who:M.name});
  return 1;
}
