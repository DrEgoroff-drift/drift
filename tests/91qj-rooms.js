/* ══════════════ комнаты на движке (DESIGN-rooms §7) ══════════════ */
/* Штаб, дом (ход и снимок «ВЛАДЕНИЯ»), зимовка, санаторий, «Сорока»: у каждой комнаты есть сборщик сцены и
   ровно один ключ с тенью; ламп ≤ R3_MAXL, теней ≤ R3_SH в кадре на 1920 и 390; окно каждой — своего рода
   (двор, метель, море, щель) и этот род есть в шейдере; старых 2D-кистей нет; у зимовки и санатория каждая
   вещь из таблицы касаний имеет рамку в кадре; ключ зимовки следует рычагу СВЕТ; солнце санатория — часу
   дня; лицо пилота переживает сейв. Настоящий G, сетки — без видеокарты. */
TEST_SUITES.push(()=>suite("комнаты на движке: сцены, свет, окна",()=>{
  resetWorld();
  const SZ=[{cw:1920,ch:1080,wide:true,rw:1920},{cw:390,ch:844,wide:false,rw:390}];
  const lum=c=>c[0]+c[1]+c[2];
  const law=(nm,S,kind)=>{
    const L=S.lights;
    ok(L.length<=R3_MAXL,nm+": ламп "+L.length+" ≤ "+R3_MAXL);
    const sh=L.filter(l=>l.shadow).length;ok(sh<=R3_SH,nm+": теней "+sh+" ≤ "+R3_SH);
    const k=L.filter(l=>l.key&&l.shadow);eq(k.length,1,nm+": ключ с тенью — ровно один");
    ok(L.every(l=>l.p.every(Number.isFinite)&&l.c.every(Number.isFinite)&&l.range>0),nm+": свет без NaN");
    if(kind!=null)eq(S.win2&&S.win2[1],kind,nm+": окно своего рода");
  };
  const sv={home:G.home,hin:G.hin,win:G.win,spa:G.spa,wan:G.wan,mode:G.mode};
  try{
    /* ── окна: четыре рода комнат есть в шейдере движка ── */
    for(const k of [7,8,9,10])ok(R3_WGSL.includes("kind=="+k),"в шейдере комнат есть окно рода "+k);

    /* ── штаб ── */
    {const L=hq3Layout();
      for(const z of SZ){const cam=hallCam(HQ3_CAMS.all,z.cw,z.ch,z.wide);law("штаб "+z.cw,hq3Scene(L,cam,1.5),null);}}

    /* ── дом: ход по комнатам (ступени 1, 4, 8) и снимок «ВЛАДЕНИЯ» (все лампы) ── */
    for(const tier of [1,4,8]){G.home=homeInit();G.home.tier=tier;G.home.sx=G.sx;G.home.sy=G.sy;enterHomeIn();
      ok(!!G.hin,"дом "+tier+": вошли");
      for(const z of SZ){HOME3.t0=0;const cam=home3Cam(z,1.5);law("дом "+tier+" · "+z.cw,home3Scene(cam,1.5),7);}
      const St=home3Scene(homeStillCam(hinGroundRooms().length,1920/600),1.5,true);
      ok(St.lights.length<=R3_MAXL&&St.lights.filter(l=>l.shadow).length<=R3_SH,"снимок дома "+tier+": в пределах движка");}

    /* ── зимовка: ключ — рычаг СВЕТ; без света ключ — печь ── */
    {winTake({sx:G.sx,sy:G.sy,pi:0,pname:"Проба",sysName:"Проба"});ok(!!G.win,"зимовка: смена взята");
      const W=G.win,cam0=win3Cam(SZ[0],1.5);let prev=-1;
      for(const lv of [1,2,3]){W.pw.light=lv;const S=win3Scene(cam0,1.5);law("зимовка СВЕТ "+lv,S,8);
        const k=S.lights.find(l=>l.key);ok(lum(k.c)>prev,"зимовка: СВЕТ "+lv+" — ключ ярче, чем "+(lv-1));prev=lum(k.c);}
      W.pw.light=0;{const S=win3Scene(cam0,1.5);law("зимовка без света",S,8);
        ok(S.lights.find(l=>l.key).c[0]>S.lights.find(l=>l.key).c[2]*1.5,"зимовка без света: ключ — тёплая печь");}
      W.pw.light=2;W.faults=[{k:"light"}];
      for(const z of SZ){const cam=win3Cam(z,1.5),H=win3Hits(W,cam,z),has=(k,id)=>H.some(h=>h.k===k&&(id==null||h.id===id)&&h.x1>h.x0&&h.y1>h.y0);
        for(const k of WIN3_LEV)ok(has("lever",k),"зимовка "+z.cw+": рычаг «"+k+"» под пальцем");
        for(const k of ["wall","diary","bunk"])ok(has(k),"зимовка "+z.cw+": «"+k+"» под пальцем");
        ok(has("fix","light"),"зимовка "+z.cw+": неполадка под пальцем");}
      W.faults=[];}

    /* ── санаторий: солнце по часу дня, вещи доски и палубы под пальцем ── */
    {const S=G.spa={day:1,days:SPA_DAYS,slot:0,done:0,took:{},talked:0,pname:"",home:{sx:G.sx,sy:G.sy},seed:hashi(G.sx,G.sy,0x5A9)};
      const cam=spa3Cam(SZ[0],1.5),el=[];
      for(const s of [.15,.5,.85]){S.sun=s;const Sc=spa3Scene(cam,1.5,S);law("санаторий · солнце "+s,Sc,9);
        const k=Sc.lights.find(l=>l.key);el.push(-k.d[1]);}
      ok(el[1]>el[0]&&el[1]>el[2],"санаторий: в полдень солнце выше, чем утром и вечером ("+el.map(v=>v.toFixed(2)).join(" / ")+")");
      delete S.sun;
      for(const z of SZ){const H=spa3Hits(S,spa3Cam(z,1.5),z),has=(k,id)=>H.some(h=>h.k===k&&(id==null||h.id===id)&&h.x1>h.x0&&h.y1>h.y0);
        for(const id of ["cock","chess","walk"])ok(has("take",id),"санаторий "+z.cw+": «"+id+"» под пальцем");
        for(const r of spa3BoardGrid())ok(has("take",r.k),"санаторий "+z.cw+": строка доски «"+r.k+"» под пальцем");
        ok(has("talk")&&has("sleep"),"санаторий "+z.cw+": сосед и шезлонг под пальцем");}}

    /* ── «Сорока» ── */
    {ok(openWanderer({force:true})!==false&&!!G.wan,"«Сорока»: открыта");
      const S=wanAll(),lots=wanLots(),cur=0;
      for(const z of SZ)law("«Сорока» "+z.cw,wan3Scene(S,lots,wan3Cam(z,1.5,cur,lots.length),1.5,cur),10);}

    /* ── старых 2D-кистей комнат нет (22.10: «2D не должно быть») ── */
    for(const n of ["drawHqRoom","hinFigure","winFigure","spaFolk","drawHomeRoom","facePath","aiFace",
      "homeFigure","homeCrewFigure","hqFigure","vegaHomeFigure","wanKeeper","roomBake","roomSz","rpgFrame","rpgImage","rpgShapes","mgrFace"])
      ok(!(n in globalThis),"2D-кисти «"+n+"» нет");
    /* прежние имена хода комнат остались входами цикла (28) — они только зовут кадр движка, 2D-холста в них нет */
    for(const f of [drawHomeIn,drawWinter,drawSpa])ok(!/\bctx\b|getContext/.test(String(f)),"«"+f.name+"» — вход в кадр движка, без 2D");

    /* ── лицо пилота переживает сейв ── */
    {G.home=homeInit();G.home.tier=4;G.home.sx=G.sx+5;G.home.sy=G.sy-3;
      const a=home3PilotM(),s=JSON.parse(JSON.stringify(snapshot()));resetWorld();applySave(s);const b=home3PilotM();
      eq(b.seed,a.seed,"лицо пилота то же после сейва");eq(home3PilotM().seed,b.seed,"и то же при втором вызове (не случайное)");}
  }finally{Object.assign(G,sv);}
}));
/* ореол колбы в комнатах (22.10): копии формулы зала без отсечения клали ореол и лампе за кадром, и лампе у
   плоскости объектива (x 2·10⁵ px — ровный жёлтый слой на весь кадр, 91qc «зал: ореол колбы»). Все кадры комнат
   и снимок дома зовут одну hallBulbU (кадры обёрнуты чужими модулями — проверяется формула в кадре, не текст); в кадре «Сороки» на 390 крайняя лампа витрины за правой кромкой — без ореола */
TEST_SUITES.push(()=>suite("комнаты: ореол колбы — одна формула зала",()=>{
  resetWorld();const sv={wan:G.wan,mode:G.mode};
  try{openWanderer({force:true});const S=wanAll(),lots=wanLots();
    for(const z of [{cw:1920,ch:1080,wide:true,rw:1920},{cw:390,ch:844,wide:false,rw:390}]){
      const cam=wan3Cam(z,1.5,0,lots.length),Sc=wan3Scene(S,lots,cam,1.5,0),U=new Float32Array(60);
      hallBulbU(U,cam.vp,Sc.bulbs,z.cw,z.ch);
      let lit=0,off=0;Sc.bulbs.slice(0,6).forEach((b,i)=>{const q=r3Proj(cam.vp,b,z.cw,z.ch);
        if(U[i*4+3]>0){lit++;ok(U[i*4+2]>=2&&U[i*4+2]<HALL_BULB_R,"«Сорока» "+z.cw+": ореол лампы "+i+" — "+U[i*4+2].toFixed(1)+" px");}
        else if(q&&(q[0]<-40||q[0]>z.cw+40))off++;});
      ok(lit>0,"«Сорока» "+z.cw+": лампы в кадре с ореолом ("+lit+")");
      if(z.cw===390)ok(off>0,"«Сорока» 390: лампа за кромкой — без ореола ("+off+")");
      ok(Array.from(U).every(v=>Math.abs(v)<5000),"«Сорока» "+z.cw+": в поле нет чисел за кадром");}
  }finally{Object.assign(G,sv);}
}));
