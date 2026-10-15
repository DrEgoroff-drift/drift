/* Развилка 5 плейтеста 14.10: «НА КАРТУ» со станции — карта поверх, НАЗАД возвращает на ту же станцию. */
TEST_SUITES.push(()=>suite("развилка 5: «НА КАРТУ» со станции — карта поверх, НАЗАД на ту же станцию",()=>{
  resetWorld();
  let st=null;
  for(let r=0;r<=10&&!st;r++)for(let x=-r;x<=r&&!st;x++)for(let y=-r;y<=r&&!st;y++){
    const s=getSystem(x,y);if(!s.station)continue;
    G.sx=x;G.sy=y;G.sys=s;st=s.station;
  }
  ok(!!st,"система со станцией найдена");
  G.mode="system";G.ap=null;G.haul=null;G.pirates=[];
  openStation();
  ok(G.mode==="dock"&&G.st===st,"пристыкованы: "+G.mode);
  const fuel0=G.fuel,sx0=G.sx,sy0=G.sy;
  /* то, что делает кнопка «НА КАРТУ» у слуха на доске, в кантине и в эфире */
  rumourToMap({sx:G.sx+2,sy:G.sy+1,rad:3});
  ok(G.mode==="map","карта открыта: "+G.mode);
  ok(G.st===st,"стыковка не порвана: станция на месте");
  ok(!!G.mapPeek,"режим подгляда помнит, откуда пришли");
  /* прыжок отсюда невозможен: не отстыкованы */
  try{actEdge=true;stepWorld(1);}finally{actEdge=false;}
  ok(G.mode==="map"&&G.sx===sx0&&G.sy===sy0&&G.fuel===fuel0,"со станции не прыгнуть и не потратить топливо");
  /* закрытие карты (клавиша M и кнопка «Назад» — один путь) возвращает на станцию */
  navAction();
  ok(G.mode==="dock","НАЗАД вернул на станцию: "+G.mode);
  ok(G.st===st&&!G.mapPeek,"станция та же, подгляд снят");
  ok($st.classList.contains("open"),"экран станции снова открыт");
  /* без станции карта открывается и закрывается как раньше: в полёт */
  /* уходим дверью, а не присваиванием: G.mode="system" оставлял открытым зал (HALL.open), и «зал
     станции» дальше по прогону видел его открытым */
  closeStation();G.mode="system";G.st=null;
  rumourToMap({sx:G.sx+2,sy:G.sy+1,rad:3});
  ok(G.mode==="map"&&!G.mapPeek,"из полёта — обычная карта, без подгляда");
  navAction();
  ok(G.mode==="system","из обычной карты — в полёт: "+G.mode);
}));
