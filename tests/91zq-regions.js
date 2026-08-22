/* ══════════════ области: таблица, расстановка, память места ══════════════ */
TEST_SUITES.push(()=>suite("области: пятнадцать тем расставлены, ядра живые и далёкие",()=>{
  resetWorld();
  eq(REGION_TABLE.length,15,"в таблице пятнадцать областей");
  const ids=new Set();for(const T of REGION_TABLE)ids.add(T.id);
  eq(ids.size,REGION_TABLE.length,"id областей уникальны");
  for(const T of REGION_TABLE)if(T.needle)ok(INSTR_KEYS.indexOf(T.needle)>=0,T.id+": прибор "+T.needle+" существует");
  const cores=[];
  for(const T of REGION_TABLE){
    const at=regionOfTheme(T.id);
    ok(!!at,T.id+": область нашла место на решётке");
    if(!at)continue;
    const R=regionAt(at.rx*REGION_SPAN,at.ry*REGION_SPAN);
    eq(R.theme,T.id,T.id+": regionAt видит тему");
    eq(R.name,T.ru,T.id+": имя области — имя темы");
    const S=getSystem(R.core.sx,R.core.sy);
    ok(!!(S&&S.station),T.id+": в ядре есть станция");
    ok(!!regionPlainSys(at.rx,at.ry,R.core),T.id+": есть обычное место с торговлей");
    cores.push({id:T.id,x:R.core.sx,y:R.core.sy});
    /* невязка монотонна к ядру: по лучу от края области к ядру не убывает */
    const bx=at.rx*REGION_SPAN,by=at.ry*REGION_SPAN;
    let prev=-1,mono=true;
    for(let d=REGION_SPAN;d>=0;d--){
      const x=clamp(R.core.sx-d,bx,bx+REGION_SPAN-1),y=R.core.sy;
      const m=misclose(x,y);if(m<prev-1e-9)mono=false;prev=m;
    }
    ok(mono,T.id+": невязка растёт к ядру без провалов");
    /* правило 5: почтовый круг молчит, остальные — нет */
    if(T.id==="post")eq(misclose(R.core.sx,R.core.sy),0,"почтовый круг: приборы молчат даже в ядре");
    else ok(misclose(R.core.sx,R.core.sy)>0,T.id+": в ядре прибор врёт");
  }
  /* правило 3: два ядра не ближе двух стоковых прыжков */
  const JUMP=3;let minD=1e9;
  for(let i=0;i<cores.length;i++)for(let j=i+1;j<cores.length;j++)
    minD=Math.min(minD,Math.hypot(cores[i].x-cores[j].x,cores[i].y-cores[j].y));
  ok(minD>JUMP*2,"ядра не ближе двух прыжков (мин. "+minD.toFixed(1)+" сект.)");
  /* каждое ядро достижимо на стоковом корабле: прыжок ≤3 сект., заправка на станциях */
  const seen={"0,0":1},q=[{x:0,y:0}],LIM=30;
  while(q.length){
    const c=q.shift();
    for(let dx=-JUMP;dx<=JUMP;dx++)for(let dy=-JUMP;dy<=JUMP;dy++){
      const x=c.x+dx,y=c.y+dy,k=x+","+y;
      if(seen[k]||Math.abs(x)>LIM||Math.abs(y)>LIM||Math.hypot(dx,dy)>JUMP+.02||!starAt(x,y))continue;
      seen[k]=1;
      const S=getSystem(x,y);if(S&&S.station)q.push({x,y});
    }
  }
  for(const c of cores)ok(!!seen[c.x+","+c.y],c.id+": ядро достижимо со стоковым баком");
}));

TEST_SUITES.push(()=>suite("память места: три счётчика, одометр, созревание по пути",()=>{
  resetWorld();
  G.st=G.sys.station;G.mode="dock";
  const k=placeKeyHere();ok(!!k,"ключ места на станции — система");
  eq(placeAge(k),Infinity,"пока не сели — места нет в памяти");
  placeMark();
  const rec=placeMem(k);ok(!!rec,"после посадки запись есть");
  eq(rec.n,1,"одна посадка");eq(odo().lands,1,"одометр: одна посадка");
  eq(placeAge(k),0,"возраст памяти здесь — ноль");
  placeNote("take",5);placeNote("hurt");placeNote("care",2);
  eq(rec.take,5,"take считается");eq(rec.hurt,1,"hurt по умолчанию +1");eq(rec.care,2,"care считается");
  eq(placeMood(k),"take","настроение места — что перевесило");
  placeNote("bogus",9);eq(rec.take+rec.hurt+rec.care,8,"неизвестный счётчик не пишется");
  /* созревание — по пути, не по часам */
  odoAdd("jumps");odoAdd("jumps");G.t+=1e6;
  eq(placeAge(k),2,"два прыжка — возраст два, время не в счёт");
  /* поступок без посадки пишется на систему */
  G.st=null;G.sys=getSystem(1,0)||G.sys;G.sx=1;G.sy=0;
  placeNote("hurt",2);
  const r2=placeMem(G.sys.key);ok(!!r2&&r2.hurt===2&&r2.n===0,"выстрел без посадки — на систему, посадок ноль");
  /* сейв: два поля, формат прежний, мусор отсекается */
  const s=snapshot();eq(s.v,4,"формат v:4");
  ok(s.place&&s.place[k]&&s.place[k].take===5,"память места в сейве");
  s.place.junk=null;s.place[k].take=-4;s.odo={lands:"x",jumps:7};
  applySave(s);
  ok(!G.place.junk,"мусор в памяти места отброшен");
  eq(G.place[k].take,0,"отрицательный счётчик обнулён");
  eq(G.odo.jumps,7,"одометр прыжков пережил сейв");eq(G.odo.lands,0,"нечисловой одометр — ноль");
}));
