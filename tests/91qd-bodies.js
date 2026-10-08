/* ══════════════ тела под звездой (M820) ══════════════ */
/* Каждая станция ST_TYPES собирается сеткой в пределах h3d; каждый класс ГЛАВТРАССЫ находит корпус;
   у баржи 3–6 рам по вместимости; ?body=0 возвращает прежние вызовы; полоса — только у раненого и
   взятого в захват, не у целого, не у своего борта державы. Сетки строятся без видеокарты. */
TEST_SUITES.push(()=>suite("тела: станции, флот, баржа, выключатель, полоса",()=>{
  resetWorld();
  const on0=BODY.on,marks0=G.marks;
  try{
    BODY.on=true;
    /* ── станции: каждый тип, два завода ── */
    for(const t of ST_TYPES)for(const by of ["gt","co"]){
      const m=h3dStationMesh({by},t.id,by,hashi(7,t.id.length,by.charCodeAt(0)));
      ok(m&&m.n>60,"станция «"+t.id+"/"+by+"» собрана: "+(m&&m.n)+" вершин");
      ok(m.n<=60000&&isFinite(m.R)&&m.R>0&&m.R<=140,"станция «"+t.id+"/"+by+"» в пределах h3d: n="+m.n+" R="+(m.R|0));
      ok(Array.isArray(m.L)&&m.L.length>0,"у станции «"+t.id+"» есть огни причала");
    }
    /* ── флот: каждый класс — корпус или осознанно прежняя выпечка ── */
    for(const k of Object.keys(FLEET_CLASSES)){
      const id=bodyFleetHull({k,seed:12345,by:"gt"});
      if(k==="node"||k==="derelict"){eq(id,null,"«"+k+"» не корабль — тела нет");continue;}
      ok(!!id,"класс «"+k+"» нашёл корпус");
      if(id){const h=hullOf(id);ok(h&&h.nose>h.tail,"корпус «"+k+"» → "+BODY_FCLS[k]+" собран");}
    }
    /* ── баржа: рамы по вместимости ── */
    let prev=0;
    for(const cap of [40,90,125,160,195,230,400]){
      const n=bodyBargeFrames(cap);
      ok(n>=3&&n<=6&&n>=prev,"баржа на "+cap+": рам "+n+" (3–6, не убывает)");prev=n;
    }
    eq(bodyBargeFrames(90),3,"малая баржа — три рамы");eq(bodyBargeFrames(400),6,"большая — шесть");
    const bm=h3dBargeMesh(4242,"gt",230);
    ok(bm.frames===6&&bm.n>100&&bm.R<=140,"сетка большой баржи: рам "+bm.frames+", n="+bm.n);
    const wm=h3dBargeWreck(4242);ok(wm&&wm.n>100&&isFinite(wm.R),"остов баржи собран: n="+wm.n);
    ok(!!bodyShuttleMesh([35,43,54]).n,"челнок собран");
    /* ── полоса: целый и не замеченный — нет; свой борт державы — нет; в захвате и раненый — да ── */
    const pir={hull:50,hullMax:50,aware:false},pw={hull:10,hullMax:50,pw:"gt",iff:1};
    G.marks=[];
    eq(bodyBar(pir),false,"целый пират вне захвата полосы не носит");
    eq(bodyBar(pw),false,"свой борт державы полосы не носит даже раненым");
    eq(bodyBar(Object.assign({},pw,{iff:0})),true,"раненый чужой борт державы — полоса");
    eq(bodyBar({hull:30,hullMax:50}),true,"пират ниже 70 % — полоса");
    G.marks=[pir];eq(bodyBar(pir),true,"взятый в захват — полоса");
    eq(bodyBar({hull:50,hullMax:50,rogue:1}),true,"ренегат — полоса, как была");
    /* ── выключатель: прежние вызовы ── */
    BODY.on=false;G.marks=[];
    eq(bodyBar(pir),true,"?body=0: полоса по прежнему правилу");
    eq(bodyBarge({seed:1,cap:90,x:0,y:0,a:0},0,0,1),false,"?body=0: баржа — прежняя выпечка");
    eq(bodyBargeWreck({seed:1,x:0,y:0},0,0,1),false,"?body=0: остов — прежний");
    eq(bodyStation({by:"gt"},0,0,1,"trade"),false,"?body=0: станция — прежний мастер");
    eq(bodyShuttle(0,0,0,1,[35,43,54],0,0),false,"?body=0: челнок — прежний спрайт");
    eq(bodyFleet({k:"post",seed:1,by:"gt"},0,0,0,1,1),false,"?body=0: борт линии — прежний");
    eq(bodyPower({pw:"gt",shipId:"x"},0,0,1,0,0),false,"?body=0: борт державы — сварной, как был");
    eq(bodyPirFlame({}),null,"?body=0: факел пирата прежний");
  }finally{BODY.on=on0;G.marks=marks0;}
}));
