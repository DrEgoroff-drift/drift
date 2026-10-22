/* ══════════════ карта без 2D и с мирами выбора (M822b, 22.10) ══════════════ */
/* Кадр карты пишет только в очереди пера: без видеокарты он не кладёт на ctx ни одного пикселя (игрок
   видит плашку 08b2, а не 2D-карту). Фон 17z (туманность, полоса, румбы, звезда) живёт только на сайте
   (site/war-backdrop.js). У выбранной системы — ряд её миров шарами 17gab по порядку орбит: в кадре,
   над полом карты, за кольцом прицела, миры не налезают друг на друга и лежат в чернилах карты (их обходят
   табличка выбора и подписи мира).
   Настоящий G, без видеокарты. */
TEST_SUITES.push(()=>suite("карта: без 2D, миры выбора шарами",()=>{
  resetWorld();
  const sv={W,H,ctx,mode:G.mode,sel:G.sel,view:G.mapView,more:G.mapMore,od:mapOrbsDraw};
  const hud0=[HUD_FLOOR,HUD_RAIL];
  const PAINT=new Set(["fill","stroke","fillText","strokeText","fillRect","strokeRect","drawImage","putImageData","clearRect"]);
  try{
    /* ── фона 17z в игре нет ── */
    for(const n of ["mapNebula","mapBandPaint","mapRhumbPaint","mapGridPaint","mapStarPaint","MAPBG"])
      ok(!(n in globalThis),"2D-фона карты «"+n+"» в игре нет (он на сайте)");
    /* ── выбор: ближняя звезда с планетами ── */
    let pick=null;
    for(let dy=-3;dy<=3&&!pick;dy++)for(let dx=-3;dx<=3;dx++){if((!dx&&!dy)||!starAt(G.sx+dx,G.sy+dy))continue;
      const s=getSystem(G.sx+dx,G.sy+dy);if(s.planets.length>=4&&Math.hypot(dx,dy)<=2.5){pick={x:G.sx+dx,y:G.sy+dy,s};break;}}
    ok(!!pick,"рядом есть звезда с четырьмя и более мирами");
    let F=null;mapOrbsDraw=(sl,c)=>(F=sv.od(sl,c));
    for(const z of [[1920,1080],[390,844]]){
      W=z[0];H=z[1];HUD_FLOOR=HUD_RAIL=0;G.mode="map";G.mapView=null;G.mapMore=false;G.sel={x:pick.x,y:pick.y};F=null;
      /* счётчик пикселей на ctx игры */
      let n=0;const real=sv.ctx;
      ctx=new Proxy(real,{get(t,p){const v=t[p];return v instanceof Function?(PAINT.has(p)?(...a)=>{n++;return v.apply(t,a);}:v.bind(t)):v;},
        set(t,p,v){t[p]=v;return true;}});
      drawMap();ovHangFlush();drawMap();   /* второй кадр — табличка уже висела: раскладка с ней */
      ctx=real;
      eq(n,0,W+": кадр карты без видеокарты не красит ctx");
      ok(!!F&&F.length===pick.s.planets.length,W+": у выбора ряд из "+pick.s.planets.length+" миров ("+(F?F.length:"нет")+")");
      if(!F)continue;
      const rr=1.8+pick.s.cls.t*2.2,cx=W/2+(pick.x-mapViewC().x)*mapCell(),cy=H/2+(pick.y-mapViewC().y)*mapCell();
      const box=f=>({x0:f.x-f.ext,y0:f.y-f.ext,x1:f.x+f.ext,y1:f.y+f.ext});
      ok(F.every(f=>{const b=box(f);return b.x0>=0&&b.x1<=W&&b.y0>=0&&b.y1<=mapDeck();}),W+": ряд в кадре и над полом карты");
      ok(F.every(f=>Math.hypot(f.x-cx,f.y-cy)-f.ext>rr+20),W+": миры за кольцом прицела");
      ok(F.every((f,i)=>i===0||Math.hypot(f.x-F[i-1].x,f.y-F[i-1].y)>=f.ext+F[i-1].ext),W+": миры не налезают друг на друга");
      ok(F.every((f,i)=>i===0||Math.hypot(f.x-cx,f.y-cy)>Math.hypot(F[i-1].x-cx,F[i-1].y-cy)),W+": по порядку орбит — от звезды наружу");
      ok(F.every(f=>f.r>=MAP_ORB.rMin&&f.r<=MAP_ORB.rMax*1.4),W+": шар "+MAP_ORB.rMin+"–"+MAP_ORB.rMax+" px");
      /* табличка у выбора и подписи мира обходят чернила карты (mapSelBlock, mapLateFlush): каждый мир — в них */
      ok(F.every(f=>{const b=box(f);return MAP_INK.some(q=>q.x0<=b.x0&&q.y0<=b.y0&&q.x1>=b.x1&&q.y1>=b.y1&&!q.fb);}),W+": каждый мир — в чернилах карты, табличка и подписи его обходят");
    }
    /* ── у кромки ряд ложится внутрь кадра ── */
    W=390;H=844;HUD_FLOOR=HUD_RAIL=0;
    const cell=mapCell();
    for(const at of [[W-20,H-120],[20,H-120],[W/2,20]]){
      const L=mapOrbFan({s:pick.s,x:at[0],y:at[1]},cell);
      ok(L.every(f=>f.x-f.ext>=0&&f.x+f.ext<=W&&f.y-f.ext>=0&&f.y+f.ext<=mapDeck()),
        "390: звезда у ("+at.map(v=>v|0).join(",")+") — ряд внутри кадра (ход "+L[0].dx+","+L[0].dy+")");}
  }finally{W=sv.W;H=sv.H;ctx=sv.ctx;G.mode=sv.mode;G.sel=sv.sel;G.mapView=sv.view;G.mapMore=sv.more;mapOrbsDraw=sv.od;HUD_FLOOR=hud0[0];HUD_RAIL=hud0[1];}
}));
