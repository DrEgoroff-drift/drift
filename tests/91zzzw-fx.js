/* ══════════════ семьи механик Директора (M382–M388, §15.1) ══════════════
   Каждая семья — это происшествия, у которых есть последствие. Мерится здесь
   одно и то же для всех: последствие вычисляется из летописи (значит одинаково
   у всех), держится ровно свой срок, не трогает вещи игрока и не выходит за
   границы, которые сам себе назначил. */
function fxWorld(){
  resetWorld();
  try{localStorage.removeItem(CHRON_KEY);}catch(e){}
  if(typeof WAR_LED_CACHE!=="undefined")WAR_LED_CACHE=null;
  CHRON={N:-1,powers:null,systems:null,wars:null,lines:null,_keys:null,off:0};
  return G;
}
/* поставить одно происшествие в летопись «здесь и сейчас» */
function fxInc(kind,p){
  const st=chronState();
  st.lines.push({N:st.N,kind:"inc",p:p|0,sys:null,args:{k:kind,f:"x"}});
  return st;
}

TEST_SUITES.push(()=>suite("экономика M382: волна, жила, ярмарка, эмбарго",()=>{
  fxWorld();
  /* волна цен: своя у каждой державы, в границах девяти процентов и без дробной
     математики в основе — иначе она разошлась бы у двух клиентов */
  let lo=9,hi=0;
  for(let n=0;n<120;n++){
    for(const by of MAKER_KEYS){
      const m=econCycleMul(by,n);
      lo=Math.min(lo,m);hi=Math.max(hi,m);
    }
  }
  ok(lo>.9&&hi<1.1,"волна держится в девяти процентах: "+lo.toFixed(3)+"…"+hi.toFixed(3));
  ok(econCycleMul("gt",0)!==econCycleMul("co",0),"у держав волны сдвинуты");
  eq(econCycleMul("gt",5),econCycleMul("gt",5),"и она не гуляет между вызовами");
  eq(econCycleMul("нет такой",5),1,"у несуществующей державы волны нет");
  /* без происшествий — никаких последствий */
  fxWorld();
  eq(econVeinHere(0,0),false,"жилы нет");
  eq(econEmbargoOn(0,0),false,"эмбарго нет");
  eq(econTierBonus(0,0),0,"и тир не поднят");
  /* жила: только во владениях той державы, у которой она объявлена */
  const st=chronState();
  const own=chronOwner(0,0);
  if(own>=0){
    fxInc("vein",own);
    ok(econVeinHere(0,0),"жила во владениях объявившей державы");
    eq(econTierBonus(0,0),1,"тир находок выше на один");
    let other=-1;
    for(const k of chronKeys()){
      const p=k.split(",");
      if(chronOwner(p[0]|0,p[1]|0)>=0&&chronOwner(p[0]|0,p[1]|0)!==own){other=k;break;}
    }
    if(other){
      const p=other.split(",");
      eq(econVeinHere(p[0]|0,p[1]|0),false,"у соседа жилы нет");
    }
  }
  /* эмбарго двигает цену вверх, и на обе стороны прилавка сразу */
  fxWorld();
  const own2=chronOwner(0,0);
  if(own2>=0){
    const before=econPriceMul(0,0);
    fxInc("embargo",own2);
    const after=econPriceMul(0,0);
    ok(after>before,"эмбарго дороже: "+before.toFixed(3)+" → "+after.toFixed(3));
    ok(after/before<1.3,"но не втрое: "+(after/before).toFixed(2));
  }
}));
