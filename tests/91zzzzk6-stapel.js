/* ══ СТАПЕЛЬ — корпус по заказу (M481, DESIGN-shipyard §5) ══
   Сторож: заказ только на верфи державы в её земле; числа — функция заказа
   и живут в коридоре класса; ползунки меняют силуэт; в сейве лежит только
   заказ, корпус после загрузки тот же; старые корпуса ползунков не видят. */
TEST_SUITES.push(()=>suite("стапель: заказ, смена, корпус из заказа",()=>{
  resetWorld();
  let at=null;
  for(let sx=-14;sx<=14&&!at;sx++)for(let sy=-14;sy<=14&&!at;sy++){
    const s=getSystem(sx,sy);
    if(s.station&&s.station.stype==="yard"&&stampOwnerAt(sx,sy))at=[sx,sy];
  }
  ok(!!at,"в круге 14 есть верфь в земле державы");
  if(!at)return;
  G.sx=at[0];G.sy=at[1];G.sys=getSystem(G.sx,G.sy);G.st=G.sys.station;
  const by=stapelYardBy();ok(!!HULL_MAKER[by],"хозяйка земли строит: "+by);
  /* числа — в коридоре класса и от ползунков */
  let out=[];
  for(const cls in HULL_CLASS)for(const size of STAPEL_SIZES)for(const l of STAPEL_L)for(const w of STAPEL_L){
    const N=stapelStats({cls,size,l,w}),P=FLEET_PROFILE[cls];
    for(const k of ["thr","turn","fuel","cargo","hull"])if(N[k]<P[k][0]-.01||N[k]>P[k][1]+.01)out.push(cls+"/"+size+"/"+k);
  }
  eq(out.join(" "),"","числа заказа не выходят из коридора класса");
  const a=stapelStats({cls:"hauler",size:"medium",l:1,w:.85}),b=stapelStats({cls:"hauler",size:"medium",l:1,w:1.15});
  ok(b.cargo>a.cargo&&b.turn<a.turn,"шире — трюм больше, поворот хуже");
  const h=stapelStats({cls:"hauler",size:"heavy",l:1,w:1}),lt=stapelStats({cls:"hauler",size:"light",l:1,w:1});
  ok(h.price>lt.price&&h.hull>lt.hull,"тяжёлый дороже и крепче лёгкого");
  /* ползунок двигает силуэт */
  const pv=o=>{NPC_SHIPS.spT=stapelShip(Object.assign({seed:77,no:0,by},o));delete HULL_CACHE["spT!"+by];return hullOf("spT");};
  const s1=pv({cls:"scout",size:"medium",l:.85,w:1}),s2=pv({cls:"scout",size:"medium",l:1.15,w:1});
  ok(s2.len>s1.len*1.2,"длиннее по ползунку: "+s1.len.toFixed(1)+" → "+s2.len.toFixed(1));
  delete NPC_SHIPS.spT;
  /* заказ: деньги, одна смена, забрать */
  G.credits=1e6;
  ok(stapelOrder({cls:"warship",size:"heavy",l:1.1,w:.9}),"заказ принят");
  ok(!stapelOrder({cls:"scout",size:"light",l:1,w:1}),"второй заказ — только после первого");
  ok(stapelCollect()===null,"до смены не забрать");
  G.stapel.o.ready=now()-1;stapelTick();
  ok(G.stapel.o.told===1,"готово — строка в почте");
  const id=stapelCollect();ok(!!id&&G.owned[id],"забрали: "+id);
  const S0=JSON.stringify(shipData(id)),len0=hullOf(id).len;
  /* сейв: только заказ */
  const snap=snapshot();
  ok(!snap.uniqueShips[id],"в сейве нет выведенного корпуса");
  eq(snap.stapel.done.length,1,"в сейве один заказ");
  delete G.uniqueShips[id];
  applySave(JSON.parse(JSON.stringify(snap)));
  eq(JSON.stringify(shipData(id)),S0,"после загрузки корпус тот же");
  delete HULL_CACHE[id+"!"+by];
  ok(Math.abs(hullOf(id).len-len0)<1e-9,"и силуэт тот же");
  /* старые корпуса ползунков не видят */
  ok(!SHIPS.strizh.hl&&!FLEET.f0.hl,"у каталожных корпусов нет hl/hw");
  G.stapel={};delete G.uniqueShips[id];delete G.owned[id];
}));
