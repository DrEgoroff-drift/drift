/* ══════════════ зал за экранами (M810) ══════════════ */
/* Каждый тип станции (и блошинец) имеет зал и убранство; у каждого раздела есть место камеры;
   сцена любого типа укладывается в пределы движка (экземпляры, части, лампы, тени) и держит
   ключ над хозяином первым; наезд камеры приходит к цели; ?hall=0 не трогает DOM.
   Настоящий G, настоящая раскладка и сетка зала — видеокарта не нужна. */
TEST_SUITES.push(()=>suite("зал станции",()=>{
  resetWorld();
  const types=ST_TYPES.map(t=>t.id).concat(["bazaar"]);
  for(const id of types){
    ok(!!HALL_TYPES[id],"у типа «"+id+"» есть зал");
    ok(!!HALL_DRESS[id],"у типа «"+id+"» есть убранство");
  }
  for(const g of ST_GROUPS.map(x=>x.id).concat(["site"]))ok(!!HALL_CAMS[g],"у раздела «"+g+"» есть место камеры");
  /* стройка — своё место у окна (участок), остальные вкладки — к месту своего раздела */
  for(const g of ST_GROUPS)for(const t of g.tabs)eq(hallPlaceOf(t),t==="site"?"site":g.id,"вкладка «"+t+"» ведёт камеру к своему месту");

  const cam=hallCam(HALL_CAMS.trade,1280,720,true);
  for(const id of types){
    const L=hallLayout(id);L.room=hallRoomMesh(L);
    ok(L.room&&L.room.v&&L.room.v.length>0,"«"+id+"»: сетка зала собрана");
    const S=hallScene(L,cam,1.5),lim=hallLimits(S);
    ok(lim.inst<=R3_MAXI,"«"+id+"»: экземпляров "+lim.inst+" ≤ "+R3_MAXI);
    ok(lim.parts<=R3_PART,"«"+id+"»: частей "+lim.parts+" ≤ "+R3_PART);
    ok(lim.lamps<=R3_MAXL,"«"+id+"»: ламп "+lim.lamps+" ≤ "+R3_MAXL);
    ok(lim.shadow<=R3_SH,"«"+id+"»: теней "+lim.shadow+" ≤ "+R3_SH);
    const k=S.lights[0];
    ok(k&&k.shadow&&Math.abs(k.p[0]-HALL_KEYX)<1e-6,"«"+id+"»: первый свет — ключ над хозяином, с тенью");
    eq(L.people[0].kind,"keep","«"+id+"»: хозяин стоит за стойкой");
    ok(S.lights.every(l=>l.c.every(Number.isFinite)&&l.p.every(Number.isFinite)),"«"+id+"»: свет без NaN");
  }

  /* мерило «Сцены»: человек на месте раздела — .18–.23 высоты кадра ПК; поле одно на любой ширине */
  for(const p of Object.keys(HALL_CAMS)){
    const c=HALL_CAMS[p],pa=HALL_PILOT_AT[p];
    ok(c.fy>.8&&c.fy<=1.35,"место «"+p+"»: поле "+c.fy+" рад");
    if(!pa)continue;
    const k=hallManK(hallCam(c,1920,1080,true),pa[0],pa[1],1080),k2=hallManK(hallCam(c,2560,1080,true),pa[0],pa[1],1080);
    ok(k>=.18&&k<=.23,"место «"+p+"»: пилот "+k.toFixed(3)+" высоты кадра");
    ok(Math.abs(k-k2)<.005,"место «"+p+"»: доля человека не зависит от ширины окна");
  }
  {const L=hallLayout("trade"),k0=L.people[0],k=hallManK(hallCam(HALL_CAMS.trade,1920,1080,true),k0.x,k0.z,1080);
    ok(k>=.18&&k<=.23,"хозяин стойки — "+k.toFixed(3)+" высоты кадра");}
  /* пилот занимает место в пределах движка; ночь слушается стенда */
  {const was=HALL.place;HALL.place="trade";
    for(const id of types){const L=hallLayout(id);L.room=hallRoomMesh(L);
      const lim=hallLimits(hallScene(L,hallCam(HALL_CAMS.trade,1920,1080,true),1.5));
      ok(lim.inst<=R3_MAXI,"«"+id+"» с пилотом: экземпляров "+lim.inst+" ≤ "+R3_MAXI);}
    HALL.place=was;}
  {const was=HALL.night;HALL.night=1;eq(hallNight(),1,"?hallnight=1 — ночь");HALL.night=0;eq(hallNight(),0,"?hallnight=0 — день");HALL.night=was;}
  /* день ≠ ночь: днём рассеянный свет дока вдвое сильнее ночного, окно ярче; ночью ключ — лампы людей */
  {const was=HALL.night,L=hallLayout("trade");L.room=hallRoomMesh(L);const cm=hallCam(HALL_CAMS.trade,1920,1080,true);
    HALL.night=0;const D=hallScene(L,cm,1.5);HALL.night=1;const N=hallScene(L,cm,1.5);HALL.night=was;
    ok(D.sky[3]>=2*N.sky[3],"днём рассеянный "+D.sky[3].toFixed(2)+" ≥ 2× ночного "+N.sky[3].toFixed(2));
    ok(D.win2[3]>N.win2[3]*1.8,"ночью окно гаснет: "+D.win2[3].toFixed(2)+" → "+N.win2[3].toFixed(2));
    ok(N.lights[0].c[0]>D.lights[0].c[0],"ночью лампа над стойкой сильнее дневной");
    /* бар — дальний конец того же зала: не больше трёх тёплых ламп, без конусов в дыму */
    const bl=D.lights.filter(l=>l.p[0]>HALL_XB-4.6);
    ok(hallLamps(L).length<=3,"над баром ламп "+hallLamps(L).length+" ≤ 3");
    ok(bl.length>0&&bl.every(l=>(l.vol||0)<=.3),"у света бара нет конусов в дыму (vol ≤ .3)");
    /* сидящие у стойки — на табуретах лицом к стойке, не к камере */
    const cand=L.people.filter(P=>P.kind==="cand");
    ok(cand.every(P=>/^stool/.test(P.pose)&&Math.cos(P.yaw)<-.5),"кандидаты бара ("+cand.length+") сидят лицом к стойке");
    ok(cand.every(P=>P.x<HALL_XB+HALL_SEAT_PILOT-.3),"табурет пилота у правого конца стойки свободен");}
  /* зал не пуст: кроме хозяина и пилота — ещё люди в работе */
  ok(hallLayout("trade").people.filter(P=>P.kind==="crowd"&&P.x<HALL_XB-4.6).length>=2,"в зале, кроме хозяина, ещё двое");
  /* хозяин — человек, не манекен: волосы тёмные, лампа не бьёт в макушку; за каждым столиком бара по двое */
  for(const id of ["trade","yard","outpost","bazaar"]){const L=hallLayout(id),K0=L.people.find(P=>P.kind==="keep"),g=cpGene(K0.m);
    ok([0,4,5].indexOf(g.style)<0&&hallLum(g.hair)<110,"«"+id+"»: у хозяина волосы (стиль "+g.style+", тон "+hallLum(g.hair).toFixed(0)+")");
    ok(Math.abs(K0.x-HALL_KEYX)>.4,"«"+id+"»: лампа над стойкой не над головой хозяина");
    if(L.bar)for(const T2 of HALL_BAR_TABLES){const n=L.people.filter(P=>T2.seats.some(s=>Math.hypot(P.x-HALL_XB-s[0],P.z-s[1])<.05)).length;
      eq(n,2,"«"+id+"»: за столиком x="+T2.x+" сидят двое");}}
  /* M811: что в таблице рынка — то ящиками на стойке; строка под мышью зажигает свой ящик */
  {const L=hallLayout("trade"),keys=hallGoodsKeys(),c0=Object.assign({},G.cargo);
    ok(keys.join()===TRADE_KEYS.concat(FAR_KEYS.filter(k=>(G.cargo[k]||0)>0)).join(),"ящики идут в порядке строк таблицы");
    ok(keys.slice(0,12).every((k,i)=>{const p=hallGoodsAt(i);return p[0]-.15>-5.62&&p[0]+.15<-4.78&&p[2]+.15<2.5&&p[2]-.15>.5;}),
      "ящики лежат на столешнице, ближе к камере, чем гроссбух и руки хозяина");
    HALL_GOODS.hot=null;G.cargo.iron=0;hallGoodsDrop();const n0=hallGoodsUp(L).n;
    G.cargo.iron=18;const n1=hallGoodsUp(L).n;
    ok(n1>n0,"железо в трюме — его ящик полон ("+n0+" → "+n1+" вершин)");
    ok(hallGoodsLight()===null,"без наведения ни один ящик не горит");
    HALL_GOODS.hot="iron";const n2=hallGoodsUp(L).n,gl=hallGoodsLight();
    ok(n2>n1&&gl&&gl.goods==="iron","строка «Железо» под мышью — обвязка и свет над её ящиком");
    const cm=hallCam(HALL_CAMS.trade,1920,1080,true);L.room=hallRoomMesh(L);
    ok(hallScene(L,cm,1).lights.some(l=>l.goods==="iron"),"свет горящего ящика попадает в кадр (не срезан пределом ламп)");
    /* объектив: общий план не увеличен; горящая строка ведёт его к ящику (хозяин .26–.28 кадра), отпустил — 45 кадров ждёт */
    const k0=L.people[0],c=HALL_CAMS.trade,wp=HALL.place;HALL.place="trade";
    eq(hallLens(c,L,0),c,"без горящей строки объектив — общий план");
    const kl=hallManK(hallCam(hallLens(c,L,1),1920,1080,true),k0.x,k0.z,1080);
    ok(kl>=.26&&kl<=.28,"объектив у ящика: хозяин "+kl.toFixed(3)+" высоты кадра");
    const pg=r3Proj(hallCam(hallLens(c,L,1),1920,1080,true).vp,hallGoodsAt(hallGoodsKeys().indexOf("iron")),1920,1080);
    ok(pg&&pg[0]>0&&pg[0]<1920*hallHero(1920)&&pg[1]>0&&pg[1]<1080,"ящик «Железо» в кадре зала при объективе");
    HALL_LENS.last=0;eq(hallLensWant(1e6),1,"горит строка — объектив хочет к ящику");HALL_GOODS.hot=null;
    eq(hallLensWant(1e6+700),1,"отпустил: 700 мс объектив ещё держит");eq(hallLensWant(1e6+760),0,"после 45 кадров — назад к общему плану");
    HALL.place=wp;HALL_GOODS.hot=null;hallGoodsDrop();G.cargo=c0;}

  /* M814: холст зала на ПК — только видимое из-под плиты; срез проекции не сдвигает ни одной точки кадра,
     плотность — экранная до 2 в бюджете (на 1920×1080 при DPR 2 — ровно 2, без растяжки) */
  {const rw=hallDrawW(1920,true);ok(rw<1920*.45&&rw>=1920*hallHero(1920),"холст зала — зона героя ("+rw+" из 1920)");
    eq(hallDrawW(390,false),390,"на телефоне — вся полоса");
    ok(hallDpr(681,1080,2)===2&&hallDpr(681,1080,1)===1,"плотность экранная: DPR 2 → 2, DPR 1 → 1 (зона героя 1920×1080 при --ui 1.42)");
    ok(hallDpr(1920,1080,2)*hallDpr(1920,1080,2)*1920*1080<=HALL_PX+1,"во весь экран — в бюджете пикселей");
    const vp=hallCam(HALL_CAMS.ship,1920,1080,true).vp,h=rw/1920,cv=hallCrop(vp,h);let worst=0;
    for(let i=0;i<INSTR_KEYS.length;i++){const p=hallInstrFace(i),a=r3Proj(vp,p,1920,1080),b=r3Proj(cv,p,rw,1080);worst=Math.max(worst,Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]));}
    ok(worst<.01,"срез кадра не сдвигает точки ("+worst.toFixed(4)+" px)");}

  /* M814: ночью рабочая лампа держит весь ряд полным лучом; контр у верстака — за рядом, ниже подоконника, тусклее лампы */
  {const wp=HALL.place,wn=HALL.night,L=hallLayout("yard");L.room=hallRoomMesh(L);HALL.place="ship";HALL.night=1;
    const S=hallScene(L,hallCam(HALL_CAMS.ship,1920,1080,true),1.5),wl=S.lights.find(l=>l.work),rim=S.lights.find(l=>l.rim);
    ok(!!wl&&INSTR_KEYS.every((id,i)=>{const p=hallInstrFace(i),v=[p[0]-wl.p[0],p[1]-wl.p[1],p[2]-wl.p[2]],d=Math.hypot(...v);
      return (v[0]*wl.d[0]+v[1]*wl.d[1]+v[2]*wl.d[2])/d>=wl.cosI;}),"ночью все пять шкал — в полном луче рабочей лампы");
    ok(!!rim&&rim.p[2]<hallInstrAt(0)[2]&&rim.p[1]<1.05&&!rim.shadow,"контр — за рядом приборов, ниже подоконника, без тени");
    ok(!!rim&&!!wl&&hallLum(rim.c.map(v=>v*255))<hallLum(wl.c.map(v=>v*255)),"контр тусклее рабочей лампы");
    HALL.night=0;const D=hallScene(L,hallCam(HALL_CAMS.ship,1920,1080,true),1.5);ok(!D.lights.some(l=>l.rim),"днём контра нет");
    HALL.place="trade";HALL.night=1;const Tn=hallScene(L,hallCam(HALL_CAMS.trade,1920,1080,true),1.5);ok(!Tn.lights.some(l=>l.rim),"у стойки контра нет");
    HALL.place=wp;HALL.night=wn;}

  /* M814b: резкость — по маске тел: у приборов и ящиков бит 2²³, у комнаты нет; часть читается точно (round, не +.5) */
  {const flags=m=>{const s=new Set();for(let i=11;i<m.v.length;i+=12)s.add(m.v[i]);return [...s];},im=hallInstrMesh(),L=hallLayout("yard"),rm=hallRoomMesh(L);
    ok(flags(im).every(f=>f>=8388608),"все вершины приборов — под маской резкости");
    ok(flags(rm).every(f=>f<8388608),"комната (рейки, стена) — без маски: муара нет");
    ok(flags(im).every(f=>Math.round(f)%16<=INSTR_KEYS.length&&Math.round(f)===f),"флаги приборов — целые, часть ≤ "+INSTR_KEYS.length);
    const sh=R3_WGSL;ok(!/u32\(i\.m\.z\+\.5\)/.test(sh),"шейдер читает флаги round(): у 2²³ +.5 уводило часть");}

  /* M814: плита — один ключ сверху-слева: верх тела светлее низа на ≥ .12 value у каждого завода */
  {const val=h=>{const n=parseInt(h.slice(1),16);return Math.max(n>>16,(n>>8)&255,n&255)/255;},K=HALL_DIAL_KEY;
    for(const w of Object.keys(HALL_INSTR_MAT)){const sv=HALL_INSTR_MAT[w].sv,top=val(sv[0])*(1-K.hi)+K.hi,bot=val(sv[sv.length-1])*(1-K.lo);
      ok(top-bot>=.12,w+": верх тела светлее низа на "+(top-bot).toFixed(2)+" ≥ .12");}
    ok(Object.keys(HALL_INSTR_MAT).every(w=>HALL_INSTR_HL[w]),"у каждого завода свой блик");}

  /* M813: пять приборов на верстаке — один экземпляр, стрелки частями 1–5; стрелка не уходит за шкалу ни у какого
     завода и износа; горящая строка прибора ведёт объектив к его шкале с места КОРАБЛЬ */
  {const K=instrKit(),k0=JSON.stringify(K),L=hallLayout("yard"),wp=HALL.place;L.room=hallRoomMesh(L);
    const m=hallInstrUp();ok(m&&m.n>0,"приборы на верстаке собраны ("+(m?m.n:0)+" вершин)");
    ok(INSTR_KEYS.length+1<=R3_PART,"стрелки помещаются в части экземпляра");
    let worst=0;for(const w of Object.keys(INSTR_WORKS))for(const wear of [0,.5,1]){
      for(const id of INSTR_KEYS){K[id]={w,s:7,wear};for(const t of [0,3.7,41,977])worst=Math.max(worst,Math.abs(hallInstrNeedle(id,t)));}}
    ok(worst<=.95,"стрелка в пределах шкалы при любом заводе и износе (|θ| "+worst.toFixed(3)+" ≤ .95)");
    K.mass={w:"artel",s:9,wear:1};const a1=hallInstrNeedle("mass",10),a2=hallInstrNeedle("mass",14);
    K.mass={w:"vekha",s:9,wear:0};const b1=hallInstrNeedle("mass",10),b2=hallInstrNeedle("mass",14);
    ok(Math.abs(a1-a2)>Math.abs(b1-b2),"разбитый артельный гуляет шире новой «Вехи»");
    const cm=hallCam(HALL_CAMS.ship,1920,1080,true);
    for(let i=0;i<INSTR_KEYS.length;i++){const q=r3Proj(cm.vp,hallInstrFace(i),1920,1080);
      ok(q&&q[0]>0&&q[0]<1920*hallHero(1920)&&q[1]>0&&q[1]<1080,"прибор "+INSTR_KEYS[i]+" в кадре места КОРАБЛЬ");}
    /* M814: продаваемую вещь не заслоняет продавец — лучи от глаза места КОРАБЛЬ к передней грани каждого тела
       (сетка 7×6) не задевают людей зала и пилота (цилиндр r .3, рост 1.85): видно ≥ 90 % */
    const E=HALL_CAMS.ship.eye,PA=hallPilotAt("ship"),men=L.people.map(P=>[P.x,P.z]).concat(PA?[[PA[0],PA[1]]]:[]);
    const hit=(a,b)=>men.some(([mx,mz])=>{const dx=b[0]-a[0],dz=b[2]-a[2],fx=a[0]-mx,fz=a[2]-mz,A=dx*dx+dz*dz,Bq=2*(fx*dx+fz*dz),C=fx*fx+fz*fz-.09,disc=Bq*Bq-4*A*C;
      if(disc<0)return false;const s=(-Bq-Math.sqrt(disc))/(2*A);if(s<0||s>1)return false;const y=a[1]+(b[1]-a[1])*s;return y>=0&&y<=1.85;});
    for(let i=0;i<INSTR_KEYS.length;i++){const id=INSTR_KEYS[i],B=HALL_INSTR_BODY[id],p=hallInstrAt(i);let seen=0,all=0;
      for(let u=0;u<7;u++)for(let v=0;v<6;v++){all++;if(!hit(E,[p[0]-B.w/2+B.w*(u+.5)/7,p[1]+B.h*(v+.5)/6,p[2]+B.d]))seen++;}
      ok(seen/all>=.9,id+" виден с глаза на "+(100*seen/all|0)+" % ≥ 90");}
    /* пять тел — пять силуэтов: пропорции попарно разнятся ≥ 12 % */
    const asp=INSTR_KEYS.map(id=>HALL_INSTR_BODY[id].w/HALL_INSTR_BODY[id].h);let close=0;
    for(let a=0;a<asp.length;a++)for(let b=a+1;b<asp.length;b++)if(Math.abs(asp[a]-asp[b])/Math.max(asp[a],asp[b])<.12)close++;
    eq(close,0,"пропорции пяти тел различимы");
    HALL.place="ship";HALL_INSTR.hot="mass";HALL_LENS.k=null;HALL_LENS.last=0;
    eq(hallLensWant(2e6),1,"строка прибора горит у окна — объектив хочет к шкале");
    const c=HALL_CAMS.ship,cl=hallLens(c,L,1),pd=hallInstrFace(INSTR_KEYS.indexOf("mass"));
    const d0=Math.hypot(c.tgt[0]-pd[0],c.tgt[2]-pd[2]),d1=Math.hypot(cl.tgt[0]-pd[0],cl.tgt[2]-pd[2]);
    ok(d1<d0&&cl.fy<c.fy,"объектив идёт к шкале и сужает поле");
    const pq=r3Proj(hallCam(cl,1920,1080,true).vp,pd,1920,1080);
    ok(pq&&pq[0]>0&&pq[0]<1920*hallHero(1920)&&pq[1]>0&&pq[1]<1080,"горящий прибор в кадре при объективе");
    const sc=hallScene(L,cm,1);ok(sc.draws.some(d=>d[0]===HALL_INSTR.mesh),"приборы в кадре зала");
    HALL.place=wp;HALL_LENS.last=0;HALL_LENS.k=null;hallInstrDrop();hallGoodsDrop();
    for(const k in K)delete K[k];Object.assign(K,JSON.parse(k0));}

  /* M812: у окна ночью свой ключ — рабочая лампа над верстаком, не над головой пилота, и предел ламп её не срезает */
  {const was=HALL.night,wp=HALL.place,L=hallLayout("yard");L.room=hallRoomMesh(L);HALL.place="ship";HALL.night=1;
    const pa=HALL_PILOT_AT.ship,N=hallScene(L,hallCam(HALL_CAMS.ship,1920,1080,true),1.5),wl=N.lights.find(l=>l.work);
    ok(!!wl,"ночью у окна горит рабочая лампа");
    ok(Math.hypot(HALL_WORK[0]-pa[0],HALL_WORK[1]-pa[1])>=.4&&HALL_WORK[1]-pa[1]>=.4,"рабочая лампа ближе к камере, чем голова пилота");
    const near=N.lights.filter(l=>!l.work&&Math.hypot(l.p[0]-HALL_WORK[0],l.p[2]-HALL_WORK[1])<3.2);
    ok(!!wl&&near.length>0&&near.every(l=>l.c[0]<wl.c[0]),"у окна ночью она — ключ: ярче "+near.length+" ламп рядом");
    HALL.night=was;HALL.place=wp;}

  /* M813: со стойки рабочая лампа у окна — второй дальний слой, не второй ключ: её вклад в голову хозяина ≤ 1/3 ключа.
     Затухание — как в шейдере 27f2: (1 − d⁴/r⁴)/(d² + .2), у прожектора — плавный край конуса */
  {const att=(l,q)=>{const v=[q[0]-l.p[0],q[1]-l.p[1],q[2]-l.p[2]],d2=v[0]*v[0]+v[1]*v[1]+v[2]*v[2],d=Math.sqrt(d2);
      let a=clamp(1-d2*d2/Math.pow(l.range,4),0,1)/(d2+.2);
      if(l.spot){const c=(v[0]*l.d[0]+v[1]*l.d[1]+v[2]*l.d[2])/Math.max(1e-6,d),x=clamp((c-l.cosO)/Math.max(1e-6,l.cosI-l.cosO),0,1);a*=x*x*(3-2*x);}
      return a*hallLum(l.c.map(v2=>v2*255));};
    const wp=HALL.place,wn=HALL.night,L=hallLayout("trade");L.room=hallRoomMesh(L);HALL.place="trade";
    for(const nk of [0,1]){HALL.night=nk;const S=hallScene(L,hallCam(HALL_CAMS.trade,1920,1080,true),1.5),k0=L.people[0],q=[k0.x,1.6,k0.z];
      const kw=att(S.lights.find(l=>l.work),q),kk=att(S.lights[0],q);
      ok(kw<=kk/3,(nk?"ночью":"днём")+" со стойки рабочая лампа у окна — "+(kk>0?(kw/kk).toFixed(3):"—")+" ключа (≤ 1/3)");}
    HALL.place=wp;HALL.night=wn;}
  /* M813: переплёт окна с места КОРАБЛЬ — не толще 3 px на 1920 */
  {const cm=hallCam(HALL_CAMS.ship,1920,1080,true),wx=(HALL_WIN[0]+HALL_WIN[1])/2,y=1.9,
      a=r3Proj(cm.vp,[wx-HALL_WIN_FW,y,HALL_B+.05],1920,1080),b=r3Proj(cm.vp,[wx+HALL_WIN_FW,y,HALL_B+.05],1920,1080);
    ok(a&&b&&Math.abs(b[0]-a[0])<=3,"переплёт окна "+(a&&b?Math.abs(b[0]-a[0]).toFixed(1):"—")+" px ≤ 3");}

  /* M812: в месте карточки (≥120 px) корпус — объём ангара, длинная сторона не меньше 160 px; в малом — прежний вид сверху */
  {const wo=H3D.on;H3D.on=true;
    for(const id of SHIP_KEYS){const S={},f=hallYardFit(S,id,400,HALL_YARD_H),m=h3dMesh(hullOf(id),S.v3&&S.v3.gear),U=hgUnits(m,S.v3.tilt,S.v3.persp,[S.v3.yaw]);
      const lw=f[2]*Math.max(U.hu1-U.hu0,U.hv1-U.hv0);
      ok(!!S.v3&&lw>=160&&f[2]*(U.hv1-U.hv0)<=HALL_YARD_H,"корпус «"+id+"» в карточке — объём, "+lw.toFixed(0)+" px по длинной стороне, в высоту места");}
    const S0={};hallYardFit(S0,SHIP_KEYS[0],120,64);ok(S0.v3===null,"в малом месте — вид сверху, как раньше");
    H3D.on=wo;}

  /* наезд: от двери к месту, к концу — ровно цель */
  hallGo("board",true);
  const end=hallGlideAt(HALL.g0+HALL.gd+50),c=HALL_CAMS.board;
  eq(end.k,1,"наезд доходит до конца");
  ok(end.eye.every((v,i)=>Math.abs(v-c.eye[i])<1e-9)&&end.tgt.every((v,i)=>Math.abs(v-c.tgt[i])<1e-9),"и стоит ровно на месте доски");
  const mid=hallGlideAt(HALL.g0+HALL.gd/2);
  ok(mid.k>0&&mid.k<1,"в середине наезда камера в пути (k="+mid.k.toFixed(2)+")");
  HALL.from=HALL.to=null;

  /* ?hall=0: прежний стол — ни класса, ни холста */
  const was=HALL.on;HALL.on=false;HALL.cn=null;
  hallOpen();
  ok(!HALL.open&&!HALL.cn,"с выключенным залом hallOpen ничего не открывает");
  HALL.on=was;
}));

/* подсказка say() в зале на ПК — плашкой на плите, не полосой через зал (окно ≥ 900) */
TEST_SUITES.push(()=>suite("зал станции: подсказка не ложится на зал",{tier:"browser"},()=>{
  const m=document.getElementById("msg"),st=document.getElementById("station");
  ok(!!m&&!!st,"есть #msg и #station");if(!m||!st)return;
  const was=st.className,txt=m.textContent;
  st.classList.add("scr","hall","open");m.textContent="Отметка: система отмечена на карте";
  const r=m.getBoundingClientRect(),w=innerWidth;
  if(w>=900)ok(r.left>=w*hallHero(w)-1,"плашка левее края зала нет: "+r.left.toFixed(0)+" ≥ "+(w*hallHero(w)).toFixed(0));
  ok(r.width<w*.62,"плашка, не полоса: "+r.width.toFixed(0)+" из "+w);
  st.className=was;m.textContent=txt;
}));

/* верфь в зале (M812): корпус — карточка, место под корабль ≥160 px, класс — тегом у имени */
TEST_SUITES.push(()=>suite("зал станции: карточки верфи",{tier:"browser"},()=>{
  resetWorld();const st=document.getElementById("station");ok(!!st,"есть #station");if(!st)return;
  const was=st.className,id=SHIP_KEYS[1]||SHIP_KEYS[0],box=el("div","hcards");
  st.classList.add("scr","hall","open");const card=hallShipCard(id,SHIPS[id]);box.appendChild(card);st.appendChild(box);
  const th=card.querySelector(".yth.big"),tag=card.querySelector(".cls");
  ok(!!th&&th.getBoundingClientRect().height>=160,"место под корабль "+(th?th.getBoundingClientRect().height.toFixed(0):"—")+" px ≥ 160");
  ok(!!tag&&tag.textContent===SHIPS[id].cls,"класс — тегом у имени");
  box.remove();st.className=was;
}));

/* приборы в зале (M813): пять гнёзд — карточки со шкалой рисунком, проза ушла, прилавок — тоже шкалами */
TEST_SUITES.push(()=>suite("зал станции: приборы карточками",{tier:"browser"},()=>{
  resetWorld();const st=document.getElementById("station");ok(!!st&&!!$body,"есть #station и плита");if(!st||!$body)return;
  const was=st.className,wo=HALL.open,html=$body.innerHTML;st.classList.add("scr","hall","open");HALL.open=true;$body.innerHTML="";
  stTabInstr();
  const cards=$body.querySelectorAll(".hdials .row.hdial[data-instr]");
  eq(cards.length,INSTR_KEYS.length,"пять гнёзд — пять карточек");
  ok([...cards].every(r=>r.querySelector("svg.hdial-svg :is(.hneedle,.hslide)")&&r.querySelector(".cls")),"у каждой тело со стрелкой и завод тегом");
  eq(new Set([...cards].map(r=>r.querySelector("svg.hdial-svg").dataset.kind)).size,INSTR_KEYS.length,"пять приборов — пять разных тел рисунком");
  ok(![...$body.querySelectorAll(".hdial .nm")].some(n=>/различает|стрелка|перо/.test(n.textContent)),"проза про разрешение и перо ушла");
  /* M814: на теле свет — копия ключа поверх каждой заливки, блик по материалу под маской тела, контактная тень, стекло шкалы */
  for(const r of cards){const sv=r.querySelector("svg.hdial-svg"),id=sv.dataset.kind,hl=sv.querySelector("g.hl[data-hl]");
    ok(sv.querySelectorAll("[fill$='k)']").length>0,id+": ключ лежит на теле");
    ok(!!hl&&(hl.dataset.hl==="matte"?sv.querySelectorAll("circle").length>=12:hl.children.length>0),id+": блик «"+(hl?hl.dataset.hl:"—")+"» есть");
    ok(!!sv.querySelector("ellipse[fill$='s)']"),id+": контактная тень");
    ok(id==="chrono"||!!sv.querySelector(".glass"),id+": блик стекла шкалы");}
  ok([...$body.querySelectorAll(".sec")].every(s=>s.textContent.indexOf("·")<0||!/ГНЁЗД|ПРИЛАВОК/.test(s.textContent)),"заголовки без пояснений");
  const h=cards[0]&&cards[0].getBoundingClientRect().height;ok(h>0&&h<480,"карточка не растянута ("+(h|0)+" px)");
  $body.innerHTML=html;HALL.open=wo;st.className=was;
}));

/* телефон (M813): сообщение say() в зале идёт строкой в полосу эфира, на ПК — нет; одно и то же — один раз */
TEST_SUITES.push(()=>suite("зал станции: сообщение на телефоне — в эфир",{tier:"browser"},()=>{
  resetWorld();const line=document.getElementById("rxLine");ok(!!line,"есть строка эфира #rxLine");if(!line)return;
  const wo=HALL.open,txt=line.textContent;HALL.open=true;HALL.msgLast=null;
  say("Отметка: система\nотмечена на карте",120);
  eq(hallMsgEther(true),false,"на ПК сообщение остаётся плашкой");
  ok(hallMsgEther(false)&&line.textContent==="Отметка: система · отмечена на карте","на телефоне — в полосу эфира одной строкой");
  eq(hallMsgEther(false),false,"то же сообщение второй раз не идёт");
  G.msgT=0;hallMsgEther(false);HALL.open=wo;line.textContent=txt;
}));
