/* ══════════════ автотесты: открытка в пяти других местах (M208) ══════════════
   Проверяется не красота — её проверяют глазами на docs/shots/scenes.png.
   Проверяется то, что от красоты не зависит: снимок делается там, где обещано;
   формат не вырос; художник места ничего не должен живому миру; кадр из
   пещеры и кадр с гребня — РАЗНЫЕ кадры, а не один и тот же с подписью. */
function psPlanet(kind){
  for(let dx=-8;dx<=8;dx++)for(let dy=-8;dy<=8;dy++){
    if(!starAt(dx,dy))continue;
    const s=getSystem(dx,dy);
    for(const p of s.planets){
      if(kind==="gas"&&p.type==="gas")return {s,p};
      if(kind!=="gas"&&p.type!=="gas")return {s,p};
    }
  }
  return null;
}
function psSnap(F,m,over){
  return Object.assign({v:POST_V,m,sx:F.s.sx,sy:F.s.sy,pi:F.p.idx,mi:-1,
    lon:null,cx:0,cy:0,t:CEL_DAY*7+123,ver:VER},over||{});
}
TEST_SUITES.push(()=>suite("открытка: восемь мест, и в каждом свой кадр",()=>{
  resetWorld();
  const F=psPlanet("rock"), Gg=psPlanet("gas");
  ok(!!F,"нашлась планета с грунтом");
  const seen=[];
  for(const m of ["c","d","b","y","g"]){
    const src=(m==="g"&&Gg)?Gg:F;
    const snap=psSnap(src,m,{cx:m==="b"?40:12,cy:m==="g"?620:20});
    const bytes=JSON.stringify(snap).length;
    ok(bytes<300,"снимок «"+m+"» укладывается в пару сотен байт ("+bytes+")");
    const A=pcTestPixels(snap,160,100);
    ok(A.ok,"кадр «"+m+"» нарисован");
    /* кадр не пустой: сплошная заливка одним цветом означала бы, что
       художник упал молча, а `true` вернул по инерции */
    let uniq=0;const seenPx={};
    for(let i=0;i<A.data.length;i+=4){
      const k=(A.data[i]>>4)+","+(A.data[i+1]>>4)+","+(A.data[i+2]>>4);
      if(!seenPx[k]){seenPx[k]=1;uniq++;}
    }
    ok(uniq>8,"в кадре «"+m+"» есть что смотреть ("+uniq+" тонов)");
    /* дважды — попиксельно одно и то же: ни одного своего случайного числа */
    const B=pcTestPixels(snap,160,100);
    ok(pcSame(A.data,B.data),"кадр «"+m+"» повторяется в точности");
    seen.push({m,d:A.data});
  }
  /* и все пять — РАЗНЫЕ. Это главное: если бы дежурный художник рисовал
     всем одно и то же, все проверки выше прошли бы */
  for(let i=0;i<seen.length;i++)for(let j=i+1;j<seen.length;j++)
    ok(!pcSame(seen[i].d,seen[j].d),"«"+seen[i].m+"» не равно «"+seen[j].m+"»");
}));
TEST_SUITES.push(()=>suite("открытка: художник места не трогает живой мир",()=>{
  resetWorld();
  const F=psPlanet("rock");
  const snaps=["c","d","b","y","g"].map(m=>psSnap(F,m,{cx:20,cy:30}));
  const before=snaps.map(s=>pcTestPixels(s,120,80).data);
  /* мир меняем целиком: режим, состояние, время, система */
  const keep={mode:G.mode,t:G.t,sx:G.sx,sy:G.sy,cave:G.cave,dig:G.dig,
              belt:G.belt,scoop:G.scoop,surf:G.surf};
  G.mode="dock";G.t=keep.t+CEL_DAY*99;G.sx=99;G.sy=-99;
  G.cave=null;G.dig=null;G.belt=null;G.scoop=null;G.surf=null;
  snaps.forEach((s,i)=>{
    const after=pcTestPixels(s,120,80).data;
    ok(pcSame(before[i],after),"«"+s.m+"»: мир сдвинулся — карточка та же");
  });
  Object.assign(G,keep);
  /* и обратно: рисование не наследило в G */
  const snap=JSON.stringify({mode:G.mode,sx:G.sx,sy:G.sy,t:G.t});
  pcTestPixels(snaps[0],60,40);
  eq(JSON.stringify({mode:G.mode,sx:G.sx,sy:G.sy,t:G.t}),snap,"после рисования G не изменился");
}));
TEST_SUITES.push(()=>suite("камера: пять новых мест снимают, стол и станция — нет",()=>{
  resetWorld();
  G.album=[];G.log=[];G.running=true;
  const F=psPlanet("rock"), Gg=psPlanet("gas");
  const tr=genTerrain(F.p,null);
  G.sx=F.s.sx;G.sy=F.s.sy;G.sys=F.s;
  /* пещера: планета берётся с поверхности, и без неё снимка нет */
  G.mode="cave";G.cave={x:420,y:120};G.surf=null;
  ok(!postCanShoot(),"пещера без поверхности не снимается");
  G.surf={p:F.p,tr,x:tr.W*.5};
  ok(postCanShoot(),"а с ней — снимается");
  let s=postTake();
  ok(!!s&&s.m==="c","снимок из пещеры");
  eq(s.cx,420,"снимок помнит шаг по галерее");
  /* шахта */
  G.mode="dig";G.cave=null;G.dig={p:F.p,col:3,row:5};
  s=postTake();
  ok(!!s&&s.m==="d"&&s.cy===5,"снимок из шахты помнит клетку");
  /* пояс */
  G.mode="belt";G.dig=null;G.belt={yaw:1.2,pitch:.1};
  s=postTake();
  ok(!!s&&s.m==="b","снимок в поясе");
  ok(Math.abs(s.cx)<=360,"курс уложен в градусы: "+s.cx);
  /* атмосфера */
  if(Gg){
    G.mode="scoop";G.belt=null;G.scoop={p:Gg.p,y:H*.5,bank:.2};
    G.sx=Gg.s.sx;G.sy=Gg.s.sy;G.sys=Gg.s;
    s=postTake();
    ok(!!s&&s.m==="g","снимок из атмосферы");
    ok(s.cy>0&&s.cy<=1000,"высота уложена в тысячную долю: "+s.cy);
  }
  /* система: снимается, и снимок про ближнюю планету */
  G.mode="system";G.scoop=null;G.sx=F.s.sx;G.sy=F.s.sy;G.sys=F.s;
  G.ship.x=(F.p.x||0)+40;G.ship.y=(F.p.y||0)+40;
  s=postTake();
  ok(!!s&&s.m==="y","снимок с орбиты");
  eq(s.pi,F.p.idx,"и он про ту планету, к которой подошли");
  /* а вот там, где мир не рисуется, кнопки нет */
  for(const m of ["dock","hangar","base","table","raid","map"]){
    G.mode=m;
    ok(!postCanShoot(),"«"+m+"» камеру не получает");
  }
  G.mode="system";
}));
TEST_SUITES.push(()=>suite("подпись: под землёй нет часа, и место называется местом",()=>{
  resetWorld();
  const F=psPlanet("rock");
  const cap=(m,over)=>postCaption(psSnap(F,m,over));
  ok(cap("c").indexOf("пещера")>0,"пещера названа пещерой: "+cap("c"));
  ok(cap("d").indexOf("шахта")>0,"шахта названа шахтой");
  /* под землёй часа не видно — и врать про полдень нельзя */
  ok(cap("c").indexOf("полдень")<0&&cap("c").indexOf("ночь")<0,"в пещере часа нет");
  ok(cap("d").indexOf("закат")<0,"и в шахте тоже");
  /* а над землёй час остаётся, и место добавляется к нему */
  const b=cap("b");
  ok(b.indexOf("пояс")>0,"пояс назван поясом: "+b);
  ok(/полдень|день|закат|рассвет|сумерки|ночь/.test(b),"и час при нём остался");
  /* имя планеты стоит первым во всех восьми */
  for(const m of ["s","l","c","d","b","y","g"])
    ok(cap(m).indexOf(F.p.name)===0,"«"+m+"»: место названо первым");
  /* и ни в одной подписи нет числа из интерфейса */
  for(const m of ["s","l","c","d","b","y","g"])
    ok(!/\d/.test(cap(m).replace(F.p.name,"")),"«"+m+"»: в подписи нет цифр");
}));
TEST_SUITES.push(()=>suite("камера: над открытым экраном ФОТО не висит",()=>{
  resetWorld();
  G.running=true;
  const F=psPlanet("rock");
  G.sx=F.s.sx;G.sy=F.s.sy;G.sys=F.s;
  G.mode="system";
  G.ship.x=(F.p.x||0)+40;G.ship.y=(F.p.y||0)+40;
  ok(postCanShoot(),"в полёте снимать есть что");
  /* M208 открыл камеру в системе — и ФОТО повисло над штабом и рынком:
     пульт над экраном оставлен нарочно, но кнопка съёмки к нему не относится */
  document.body.classList.add("screen");
  ok(!postCanShoot(),"над открытым экраном — нет");
  ok(postSnap()!==null,"снимок при этом собрать всё ещё можно: запрет на кнопке");
  document.body.classList.remove("screen");
  ok(postCanShoot(),"экран закрыли — кнопка вернулась");
  /* и то же на грунте: правило про экран сильнее правила про место */
  const tr=genTerrain(F.p,null);
  G.mode="surface";G.surf={p:F.p,tr,x:tr.W*.5};
  ok(postCanShoot(),"на грунте снимают");
  document.body.classList.add("screen");
  ok(!postCanShoot(),"а с открытым столом — нет");
  document.body.classList.remove("screen");
}));
