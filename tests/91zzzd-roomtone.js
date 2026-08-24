/* Тон места (M178-10). Звук в headless не послушать, но устройство проверяемо:
   у каждого места свой запрос, вакуум молчит совсем, буря слышна раньше, чем
   видна, дом слышит погоду глухо, и tick не создаёт узлов на каждый кадр. */

TEST_SUITES.push(()=>suite("тон места: у каждого экрана свой, вакуум молчит",()=>{
  resetWorld();
  /* поверхность с атмосферой */
  const p=landOnTestPlanet();
  G.mode="surface";
  const wSurf=rtWant();
  if(p.T.atm==="отсутствует"){
    eq(wSurf[0],0,"безвоздушная поверхность молчит");
  }else{
    ok(wSurf[0]>0,"на поверхности слышен ветер");
  }
  /* вакуум: подменяем атмосферу — тон обязан упасть в ноль */
  const atm0=p.T.atm;
  p.T={...p.T,atm:"отсутствует"};
  const wVac=rtWant();
  eq(wVac[0],0,"в вакууме ветра нет");
  eq(wVac[2],0,"и низа нет");
  p.T={...p.T,atm:atm0};
  /* пещера и шахта — низ есть, ветра почти нет */
  G.cave={};G.mode="cave";
  const wCave=rtWant();
  ok(wCave[2]>wCave[0],"в пещере порода громче ветра");
  G.cave=null;
  G.dig={row:30};G.mode="dig";
  const wDig=rtWant();
  const wDig0=(()=>{G.dig.row=0;const v=rtWant();G.dig.row=30;return v;})();
  ok(wDig[3]<wDig0[3],"глубже — ниже частота породы");
  G.dig=null;
  /* база — вентиляция */
  G.base={};G.mode="base";
  ok(rtWant()[0]>0,"на базе слышна вентиляция");
  G.base=null;G.mode="system";
  eq(rtWant()[0],0,"в системном виде тона нет");
}));

TEST_SUITES.push(()=>suite("тон места: бурю слышно раньше, чем видно",()=>{
  resetWorld();
  const p=landOnTestPlanet();
  if(p.T.atm==="отсутствует"){ok(true,"мир безвоздушный — проверка не о нём");return;}
  G.mode="surface";
  const w=weatherOf(p);
  if(!w.kind){ok(true,"на этом мире погоды не бывает");return;}
  /* ставим время так, чтобы сила была под порогом видимости (.14), но не ноль */
  let tFaint=null,tLoud=null;
  for(let t=0;t<w.per*2;t+=w.per/160){
    G.t=t;
    const k=weatherPower(p);
    if(tFaint===null&&k>.03&&k<.12)tFaint=t;
    if(tLoud===null&&k>.5)tLoud=t;
    if(tFaint!==null&&tLoud!==null)break;
  }
  if(tFaint===null||tLoud===null){ok(true,"цикл этой планеты не даёт нужных фаз");return;}
  G.t=tFaint;
  const faint=rtWant();
  eq(weatherName(p),null,"погода ещё не видна и не названа");
  G.t=tLoud;
  const loud=rtWant();
  ok(loud[0]>faint[0]*1.5,"а слышна уже: буря громче затишья ("+
     loud[0].toFixed(3)+" против "+faint[0].toFixed(3)+")");
  ok(faint[0]>.012,"и даже затишье не мёртвая тишина");
}));

TEST_SUITES.push(()=>suite("тон места: дом слышит погоду сквозь стену",()=>{
  resetWorld();
  const p=landOnTestPlanet();
  if(p.T.atm==="отсутствует"||!weatherOf(p).kind){ok(true,"миру нечем шуметь");return;}
  /* ловим сильную погоду */
  const w=weatherOf(p);
  for(let t=0;t<w.per*2;t+=w.per/120){G.t=t;if(weatherPower(p)>.5)break;}
  G.mode="surface";
  const out=rtWant();
  G.home=homeInit();G.home.tier=2;
  enterHomeIn();
  const inside=rtWant();
  ok(inside[0]<out[0],"внутри буря тише, чем снаружи");
  ok(inside[0]>0,"но не беззвучна — её слышно сквозь стену");
  ok(inside[3]<=140,"и только низом: стена срезает верх");
  exitHomeIn();
}));

TEST_SUITES.push(()=>suite("тон места: узлы не плодятся",()=>{
  resetWorld();
  /* без запущенного AudioContext tick обязан выйти молча и ничего не создать */
  const was=RTONE.on;
  for(let i=0;i<50;i++)roomToneTick(1);
  ok(RTONE.on===was||SND.ready,"без звука узлы не создаются");
  /* rtInit после инициализации второй раз ничего не строит */
  if(RTONE.on){
    const bp=RTONE.bp;
    rtInit();
    ok(RTONE.bp===bp,"повторный init не пересоздаёт цепь");
  }else ok(true,"звук в headless не поднят — и не должен был");
}));
