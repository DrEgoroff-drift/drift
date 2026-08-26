/* ══════════════ автотесты: открытка — снимок сцены (M188) ══════════════ */
function pcTestPlanet(){
  for(let dx=-8;dx<=8;dx++)for(let dy=-8;dy<=8;dy++){
    if(!starAt(dx,dy))continue;
    const s=getSystem(dx,dy);
    for(const p of s.planets)if(p.type!=="gas")return {s,p};
  }
  return null;
}
/* снимок собирается руками: тесты не летают, а художник и не должен знать,
   откуда снимок взялся — в этом весь смысл отдельного художника */
function pcTestSnap(F,over){
  const tr=genTerrain(F.p,null);
  return Object.assign({v:POST_V,m:"s",sx:F.s.sx,sy:F.s.sy,pi:F.p.idx,mi:-1,
    lon:+tr.lon.toFixed(3),cx:Math.round(tr.W*.5),t:CEL_DAY*7+123,ver:VER},over||{});
}
function pcTestPixels(snap,w,h){
  const cv=document.createElement("canvas");cv.width=w;cv.height=h;
  const c=cv.getContext("2d");
  const ok=drawPostcard(c,snap,w,h);
  return {ok,data:c.getImageData(0,0,w,h).data};
}
function pcSame(a,b){
  if(a.length!==b.length)return false;
  for(let i=0;i<a.length;i++)if(a[i]!==b[i])return false;
  return true;
}
TEST_SUITES.push(()=>suite("открытка: один снимок — один кадр, и художник не знает про G",()=>{
  resetWorld();
  const F=pcTestPlanet();
  ok(!!F,"нашлась планета с грунтом");
  const snap=pcTestSnap(F);
  /* размер снимка: он поедет по проводу, и это его единственное оправдание */
  const bytes=JSON.stringify(snap).length;
  ok(bytes<300,"снимок укладывается в пару сотен байт ("+bytes+")");
  ok(!/[a-z]*(pixel|data:)/.test(JSON.stringify(snap)),"в снимке нет пикселей");
  /* один и тот же снимок — один и тот же кадр */
  const A=pcTestPixels(snap,160,100), B=pcTestPixels(snap,160,100);
  ok(A.ok&&B.ok,"кадр нарисован");
  ok(pcSame(A.data,B.data),"дважды — попиксельно одно и то же");
  /* другой час — другой кадр: небо и правда считается от времени */
  const C=pcTestPixels(pcTestSnap(F,{t:CEL_DAY*7+123+CEL_DAY*3}),160,100);
  ok(!pcSame(A.data,C.data),"через трое суток кадр другой");
  /* другое место в полосе — другой кадр */
  const D=pcTestPixels(pcTestSnap(F,{cx:snap.cx+4000}),160,100);
  ok(!pcSame(A.data,D.data),"с другого места — другой кадр");
  /* и главное: художник ничего не должен живому миру. Мир меняем целиком,
     кадр обязан остаться прежним — иначе открытка врёт про место */
  const keep={mode:G.mode,surf:G.surf,land:G.land,t:G.t,sx:G.sx,sy:G.sy,sys:G.sys};
  G.mode="dock";G.surf=null;G.land=null;G.t=keep.t+CEL_DAY*99;
  G.sx=99;G.sy=-99;G.sys=getSystem(0,0);
  const E=pcTestPixels(snap,160,100);
  ok(pcSame(A.data,E.data),"мир сдвинулся — карточка та же");
  Object.assign(G,keep);
  /* пустой и битый снимок не роняют художника */
  const cv=document.createElement("canvas");cv.width=40;cv.height=25;
  const cc=cv.getContext("2d");
  ok(drawPostcard(cc,null,40,25)===false,"без снимка — false, а не исключение");
  ok(drawPostcard(cc,{v:1,sx:0,sy:0,pi:999,mi:-1,t:0},40,25)!==undefined,"чужой индекс не роняет");
}));
TEST_SUITES.push(()=>suite("открытка: камера снимает только там, где есть что снять",()=>{
  resetWorld();
  G.album=[];G.log=[];
  const F=pcTestPlanet();
  G.mode="system";G.running=true;
  ok(!postCanShoot(),"в полёте снимать нечего");
  ok(postSnap()===null,"и снимка не выходит");
  ok(postTake()===null,"кнопка ничего не делает");
  /* встали на грунт */
  const tr=genTerrain(F.p,null);
  G.sx=F.s.sx;G.sy=F.s.sy;G.sys=F.s;
  G.mode="surface";G.surf={p:F.p,tr,x:tr.W*.5};
  ok(postCanShoot(),"на грунте — есть");
  const s=postTake();
  ok(!!s&&s.m==="s","снимок сделан с поверхности");
  eq(albumAll().length,1,"лёг в альбом");
  eq(s.pi,F.p.idx,"снимок помнит планету");
  ok(postCaption(s).indexOf(F.p.name)===0,"подпись называет место: "+postCaption(s));
  /* на заходе — тоже, и это другой снимок */
  G.mode="landing";G.surf=null;G.land={p:F.p,tr,x:tr.W*.25};
  const s2=postTake();
  ok(!!s2&&s2.m==="l","снимок с захода");
  eq(albumAll().length,2,"альбом растёт");
  G.mode="system";G.land=null;
}));
TEST_SUITES.push(()=>suite("открытка: альбом — двенадцать мест, и он переживает сохранение",()=>{
  resetWorld();
  G.album=[];G.log=[];
  const F=pcTestPlanet();
  const tr=genTerrain(F.p,null);
  G.sx=F.s.sx;G.sy=F.s.sy;G.sys=F.s;
  G.mode="surface";G.surf={p:F.p,tr,x:tr.W*.5};
  for(let i=0;i<ALBUM_MAX+4;i++){G.surf.x=1000+i*700;G.t+=90;postTake();}
  eq(albumAll().length,ALBUM_MAX,"больше двенадцати не лежит");
  ok(albumAll()[0].cx!==albumAll()[1].cx,"снимки разные, а не копия одного");
  ok((G.log||[]).some(x=>/место в альбоме кончилось/.test(x.text||x.s||"")),
     "о вынутом снимке сказано вслух");
  /* вес альбома в сохранении: ради этого пиксели и не хранятся */
  const kb=JSON.stringify(albumAll()).length/1024;
  ok(kb<3,"весь альбом весит меньше трёх килобайт ("+kb.toFixed(2)+" КБ)");
  const first=JSON.stringify(albumAll()[0]);
  const snap=snapshot();G.album=[];applySave(JSON.parse(JSON.stringify(snap)));
  eq(albumAll().length,ALBUM_MAX,"альбом пережил сохранение");
  eq(JSON.stringify(albumAll()[0]),first,"и первый снимок тот же");
  /* старое сохранение без альбома грузится и даёт пустой */
  const old=snapshot();delete old.album;
  applySave(JSON.parse(JSON.stringify(old)));
  eq(albumAll().length,0,"сохранение без альбома — пустой альбом, а не падение");
  G.mode="system";G.surf=null;
}));
