/* Без присмотра (M905, DESIGN-game §10.5, 28k-offline): такт дронов после разрыва дольше минуты —
   догон без игрока: те же круги, но в кассу 60 % и не больше часа чистого яруса; одна строка
   говорит, сколько сдали и сколько дошло. Живой такт каждые 3 с платит как раньше. */
TEST_SUITES.push(()=>suite("без присмотра: дроны на 60 %, потолок — час яруса",()=>{
  resetWorld();
  const mk=(rate,pool)=>{G.drones=[{sx:G.sx,sy:G.sy,res:"iron",rate,pool}];tickDrones();return G.drones[0];};
  /* онлайн: такт каждые 3 с, полчаса */
  let d=mk(3,5000);const c0=G.credits;
  for(let s=0;s<1800;s+=3){clockAdvance(3000);tickDrones();}
  const gA=G.credits-c0,trA=d.trips;
  ok(gA>0&&trA>0&&!G.log.some(x=>/Дроны без вас/.test(x.s)),"полчаса с игроком: "+trA+" рейсов, "+gA+" кр, строки догона нет");
  /* тот же дрон в том же мире — полчаса без единого такта */
  resetWorld();d=mk(3,5000);const c1=G.credits;
  clockAdvance(1800*1000);tickDrones();
  const gB=G.credits-c1;
  ok(Math.abs(d.trips-trA)<=1,"рейсов столько же: "+d.trips+" против "+trA);
  ok(gB>=.5*gA&&gB<=.61*gA,"без присмотра в кассу "+gB+" кр против "+gA+" — "+Math.round(gB/gA*100)+" %");
  ok(Math.abs((d.earned|0)-gB)<=2,"счётчик машины — дошедшее до кассы: "+d.earned);
  const line=G.log.find(x=>/Дроны без вас/.test(x.s));
  ok(!!line&&/шестьдесят процентов/.test(line.s),"строка: «"+(line&&line.s)+"»");
  /* потолок: сутки жирного дрона — не больше часа яруса */
  resetWorld();d=mk(40,1e6);const c2=G.credits,cap=offCap();   /* до догона: доход может поднять дом, а с ним ярус */
  clockAdvance(24*3600000);tickDrones();
  const gC=G.credits-c2;
  const l2=G.log.filter(x=>/Дроны без вас/.test(x.s)).pop();
  ok(gC<=cap&&gC>=cap-2&&/больше часа/.test(l2&&l2.s),"сутки без присмотра: в кассу "+gC+" при потолке "+cap+" · «"+(l2&&l2.s)+"»");
  /* следующий живой такт — по-старому, полной ценой */
  const c3=G.credits;for(let s=0;s<600;s+=3){clockAdvance(3000);tickDrones();}
  ok(G.credits-c3>0&&OFF_POOL===null,"после догона живой такт платит полностью: +"+(G.credits-c3));
  resetWorld();
}));
