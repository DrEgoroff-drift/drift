/* Петли рынка (лаборатория 15.10, по Micro-Machinations и поиску арбитражных циклов): у одного
   прилавка деньги из воздуха не берутся. Перебор — до сорока станций × каждый товар прейскуранта ×
   три объёма, и три петли: «купил — тут же сдал», «купил — подождал смену — сдал тут же» (аппетит
   обновился, а товар чужой не стал) и «купил — сдал — купил — сдал» (давление и запрос не
   разворачиваются в плюс на втором круге). Любой круг в плюс — кран, найденный перебором.
   Один набор проверял одну станцию и один товар; здесь — всё, что стоит на карте рядом с домом. */
TEST_SUITES.push(()=>suite("рынок: петли у одного прилавка не печатают деньги",{tier:"node"},()=>{
  resetWorld();
  const st=[];
  for(let r=0;r<=14&&st.length<40;r++)for(let x=-r;x<=r&&st.length<40;x++)for(let y=-r;y<=r&&st.length<40;y++){
    if(Math.max(Math.abs(x),Math.abs(y))!==r||!starAt(x,y))continue;
    const s=getSystem(x,y);if(s&&s.station&&s.station.prices)st.push(s);
  }
  ok(st.length>=10,"станций в переборе: "+st.length);
  const bad=[];let loops=0;
  for(const S of st){
    const keys=TRADE_KEYS.filter(k=>S.station.prices[k]);
    for(const k of keys)for(const q of [1,10,50]){
      for(const kind of ["сразу","через смену","два круга"]){
        resetWorld();
        G.credits=1e7;G.cargo={};marketFor(S);
        const c0=G.credits;let b=0;
        try{
          b=buyCargo(S,k,q);
          if(!b)continue;
          if(kind==="через смену")clockAdvance(HOLD_SHIFT);
          sellCargo(S,k,G.cargo[k]|0);
          if(kind==="два круга"){const b2=buyCargo(S,k,q);if(b2)sellCargo(S,k,G.cargo[k]|0);}
        }catch(e){bad.push(S.station.name+" «"+k+"» ×"+q+" "+kind+": сбой "+e.message);continue;}
        loops++;
        const d=G.credits-c0;
        if(!(isFinite(G.credits))||d>0)bad.push(S.station.name+" ("+S.sx+","+S.sy+") «"+k+"» ×"+q+" "+kind+": +"+Math.round(d)+" кр");
      }
    }
  }
  ok(loops>100,"кругов прогнано: "+loops);
  ok(!bad.length,"петли в плюс: "+bad.length+(bad.length?" — "+bad.slice(0,6).join("; "):""));
  resetWorld();
}));
