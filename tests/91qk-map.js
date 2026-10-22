/* ══════════════ карта без 2D и с мирами выбора (M822b, 22.10) ══════════════ */
/* Кадр карты пишет только в очереди пера: без видеокарты он не кладёт на ctx ни одного пикселя (игрок
   видит плашку 08b2, а не 2D-карту). Фон 17z (туманность, полоса, румбы, звезда) живёт только на сайте
   (site/war-backdrop.js). У выбранной системы — ряд её миров шарами 17gab по порядку орбит: в кадре,
   над полом карты, за кольцом прицела, миры не налезают друг на друга и лежат в чернилах карты (их обходят
   подписи мира); табличка выбора главнее ряда — ряд уходит от её рамки.
   M822c: ряду преграда и «ВЫ» (плашка и кольцо вашей звезды); нет чистого хода полным рядом — плотный
   (rMin, без колец), но не под табличкой и не под «ВЫ». Табличке выбора у пола телефона — запасной бок
   через середину (08bj o.spare). Роза карты встаёт над подсказкой #prompt, а не под ней.
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
    let F=null;mapOrbsDraw=(...a)=>(F=sv.od(...a));
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
      /* подписи мира обходят чернила карты (mapLateFlush): каждый мир — в них */
      ok(F.every(f=>{const b=box(f);return MAP_INK.some(q=>q.x0<=b.x0&&q.y0<=b.y0&&q.x1>=b.x1&&q.y1>=b.y1&&!q.fb);}),W+": каждый мир — в чернилах карты, подписи мира его обходят");
    }
    /* ── у кромки ряд ложится внутрь кадра ── */
    W=390;H=844;HUD_FLOOR=HUD_RAIL=0;
    const cell=mapCell();
    for(const at of [[W-20,H-120],[20,H-120],[W/2,20]]){
      const L=mapOrbFan({s:pick.s,x:at[0],y:at[1]},cell);
      ok(L.every(f=>f.x-f.ext>=0&&f.x+f.ext<=W&&f.y-f.ext>=0&&f.y+f.ext<=mapDeck()),
        "390: звезда у ("+at.map(v=>v|0).join(",")+") — ряд внутри кадра (ход "+L[0].dx+","+L[0].dy+")");}
    /* табличка главнее ряда: ряд ложится туда, где не задевает её рамку прошлого кадра */
    {const s0={s:pick.s,x:W/2,y:H*.45},dn=mapOrbFan(s0,cell);
      eq(dn[0].dx+","+dn[0].dy,"0,1","390: без таблички ряд — вниз от звезды");
      ok(!dn[0].flat,"390: место есть — ряд полный, не плотный");
      const av={x0:W/2-60,y0:H*.45+12,x1:W/2+60,y1:H*.45+260},up=mapOrbFan(s0,cell,av);
      ok(!up.some(f=>f.x+f.ext>av.x0&&f.x-f.ext<av.x1&&f.y+f.ext>av.y0&&f.y-f.ext<av.y1),
        "390: табличка под звездой — ряд уходит от неё (ход "+up[0].dx+","+up[0].dy+")");}
    /* ── у пола телефона: табличка над звездой, «ВЫ» над ней — ряд не под тем и не под другим ── */
    {const x=W*.4,y=mapDeck()-14,s0={s:pick.s,x,y},hit=(f,A)=>f.x+f.ext>A.x0&&f.x-f.ext<A.x1&&f.y+f.ext>A.y0&&f.y-f.ext<A.y1;
      const av={x0:x-68,y0:y-80,x1:x+66,y1:y-38},you={x0:x+10,y0:y-120,x1:x+60,y1:y-86},ring={x0:x+14,y0:y-112,x1:x+50,y1:y-76};
      const L=mapOrbFan(s0,cell,av,[you,ring]);
      ok(L.every(f=>f.x-f.ext>=0&&f.x+f.ext<=mapRail()&&f.y-f.ext>=0&&f.y+f.ext<=mapDeck()),"390 у пола: ряд в кадре (ход "+L[0].dx.toFixed(2)+","+L[0].dy.toFixed(2)+(L[0].flat?", плотный":"")+")");
      ok(!L.some(f=>hit(f,av)),"390 у пола: ряд не под табличкой выбора");
      ok(!L.some(f=>hit(f,you)||hit(f,ring)),"390 у пола: ряд не под «ВЫ» и не на вашем кольце");
      ok(L.every(f=>!f.flat||f.r===MAP_ORB.rMin),"плотный ряд — все миры по "+MAP_ORB.rMin+" px");}
    /* ── табличка выбора у пола: без запасного бока не встаёт, с ним — встаёт и в кадре ── */
    {W=390;H=844;HUD_FLOOR=612;HUD_RAIL=292;
      const mk=o=>({id:"map.sel",lines:["КВАОМОРА","ПРЫЖОК · 38 топлива"],x:162,y:586,o});
      const A=mk({r:27,verb:1}),B=mk({r:27,verb:1,spare:1});
      hangLayout([A],1);hangLayout([B],1);
      ok(A.hide,"табличка у пола без запасного бока не встаёт (так было: висела подсказка внизу)");
      ok(!B.hide&&!!B.R,"с запасным боком (spare) табличка встаёт");
      if(B.R)ok(B.R.x0>=8&&B.R.x1<=HUD_RAIL&&B.R.y0>=0&&B.R.y1<=HUD_FLOOR,"и стоит в кадре, левее борта и над полом ("+[B.R.x0,B.R.y0,B.R.x1,B.R.y1].map(Math.round).join(",")+")");}
    /* ── роза карты над подсказкой ── */
    {W=390;H=844;HUD_FLOOR=HUD_RAIL=0;MAP_BOX.length=0;MAP_DOMR.length=0;mapRoseDraw(null);
      const r0=MAP_BOX.find(b=>b.s==="роза");ok(!!r0,"роза на месте без подсказки");
      if(r0){const pr={left:10,right:296,top:r0.y+r0.h-10,bottom:r0.y+r0.h+18};
        MAP_BOX.length=0;MAP_DOMR.push({sel:"#prompt",r:pr});mapRoseDraw(null);
        const r1=MAP_BOX.find(b=>b.s==="роза");
        ok(!r1||r1.y+r1.h<=pr.top,"подсказка в углу — роза над ней ("+(r1?Math.round(r1.y+r1.h)+" ≤ "+Math.round(pr.top):"уступила")+")");}
      MAP_BOX.length=0;MAP_DOMR.length=0;}
  }finally{W=sv.W;H=sv.H;ctx=sv.ctx;G.mode=sv.mode;G.sel=sv.sel;G.mapView=sv.view;G.mapMore=sv.more;mapOrbsDraw=sv.od;HUD_FLOOR=hud0[0];HUD_RAIL=hud0[1];}
}));
