/* Порча байтов сейва (лаборатория 15.10; Factorio: два из шестнадцати мутированных сейвов роняли
   игру; bugnet «save corruption corpus»). Наборы 91zzzzza ломают ТИП поля в целом объекте; здесь
   ломается сама строка: обрезка, подмена знаков, 1e999 вместо числа, пустые формы. Закон двух исходов:
   либо loadGame честно отказывает и мир не тронут ни на бит (stateHash тот же — полузагрузка хуже
   отказа: игра пойдёт дальше на мире из двух сейвов), либо принимает — и тогда мир целый: деньги
   конечны, режим известен, мир сам сохраняется и читается обратно. Ни одного исключения наружу. */
TEST_SUITES.push(()=>suite("порча байтов сейва: отказ без следа или целый мир",{tier:"node"},()=>{
  resetWorld();
  G.credits=12345;G.cargo={ice:7,organics:3};
  const good=saveText();
  ok(typeof good==="string"&&good.length>200,"исходный сейв: "+(good?good.length:0)+" байт");
  let seed=20261015;
  const rnd01=()=>((seed=(seed*1103515245+12345)>>>0)/4294967296);
  const M=[];
  for(const f of [.02,.1,.5,.9,.99])M.push(["обрезан до "+Math.round(f*100)+" %",good.slice(0,Math.floor(good.length*f))]);
  M.push(["без последнего знака",good.slice(0,-1)]);
  for(let i=0;i<12;i++){const p=Math.floor(rnd01()*good.length),c=String.fromCharCode(32+Math.floor(rnd01()*94));
    M.push(["знак "+p+" → "+JSON.stringify(c),good.slice(0,p)+c+good.slice(p+1)]);}
  for(let i=0;i<6;i++){const p=Math.floor(rnd01()*good.length);M.push(["выпал знак "+p,good.slice(0,p)+good.slice(p+1)]);}
  M.push(["деньги 1e999",good.replace(/"credits":[-0-9.e]+/,'"credits":1e999')]);
  M.push(["деньги -1e999",good.replace(/"credits":[-0-9.e]+/,'"credits":-1e999')]);
  M.push(["все числа 1e999",good.replace(/:(-?\d+(\.\d+)?)(?=[,}])/g,":1e999")]);
  M.push(["все числа отрицательны",good.replace(/:(\d+(\.\d+)?)(?=[,}])/g,":-$1")]);
  for(const s of ["","{}","[]","null","0","\"\"","{\"v\":5}","{\"v\":4}","{\"v\":99}","{\"v\":5,\"credits\":null}","\u0000","{\"__proto__\":{\"x\":1}}"])M.push(["форма "+JSON.stringify(s),s]);
  const bad=[];let took=0,refused=0;
  for(const [name,raw] of M){
    resetWorld();G.credits=777;
    const h0=stateHash();
    stSet(SAVE_KEY,raw);
    let r;
    try{r=loadGame();}catch(e){bad.push(name+": исключение "+e.message);continue;}
    if(!r){refused++;
      const h1=stateHash();
      if(h1!==h0)bad.push(name+": отказ, но мир изменён (полузагрузка)");
      continue;}
    took++;
    const why=[];
    if(!isFinite(G.credits))why.push("деньги "+G.credits);
    if(typeof G.mode!=="string"||!G.mode)why.push("режим "+G.mode);
    for(const k in G.cargo||{})if(!isFinite(G.cargo[k])){why.push("трюм "+k+"="+G.cargo[k]);break;}
    try{const t=saveText();if(!t)why.push("не сохраняется");else{JSON.parse(t);}}catch(e){why.push("сохранение бросает: "+e.message);}
    if(why.length)bad.push(name+": принят, но "+why.join(", "));
  }
  note("мутаций "+M.length+": принято "+took+", отказано "+refused);
  ok(took+refused+bad.filter(b=>/исключение/.test(b)).length===M.length,"каждая мутация дала исход");
  ok(!bad.length,"порча: "+bad.length+(bad.length?" — "+bad.slice(0,6).join("; "):""));
  resetWorld();
}));
