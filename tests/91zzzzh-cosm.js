/* ══════════════ автотесты: косметика «Сороки» (M344) ══════════════
   Вещь, которой не видно, — та же ложь, что перк без кода: каждая косметика
   обязана изменить хоть один пиксель своего художника. Меряем художников на
   закадровой канве: без вещи и с ней. */
function cosmPix(draw){
  const cv=document.createElement("canvas");cv.width=160;cv.height=120;
  const c=cv.getContext("2d");c.fillStyle="#000";c.fillRect(0,0,160,120);
  const old=ctx;ctx=c;
  try{draw(c);}finally{ctx=old;}
  return c.getImageData(0,0,160,120).data;
}
function cosmDiff(a,b){let n=0;for(let i=0;i<a.length;i+=4)if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2])n++;return n;}
TEST_SUITES.push(()=>suite("косметика: каждая вещь меняет пиксели своего художника",()=>{
  resetWorld();
  G.cosm=null;
  const all=[];for(const s of COSM_SLOTS)for(const id in COSM_TABLES[s])all.push(id);
  eq(all.length,27,"двадцать семь вещей в семи слотах");
  ok(all.every(id=>WANDER_BY_ID[id]&&WANDER_BY_ID[id].fam==="cosm"&&WANDER_BY_ID[id].pay.m>=6&&WANDER_BY_ID[id].pay.m<=20),"все в каталоге «Сороки», за спички 6–20");
  const mute=[];
  /* выхлоп: корабль в центре закадровой канвы, тяга полная */
  G.ship.x=0;G.ship.y=0;G.ship.a=0;
  const zx=x=>80+x,zy=y=>60+y;
  const exh=()=>cosmPix(()=>drawExhaust(zx,zy,1,1));
  cosmRec();const base=exh();
  for(const id in COSM_EXH){cosmRec().owned=[id];cosmWear(id);if(cosmDiff(exh(),base)<20)mute.push(id);}
  G.cosm=null;
  /* след: цвета края и середины другие */
  const T0={core:[255,255,255],mid:[200,200,200],edge:[100,100,100]};
  for(const id in COSM_TRAIL){cosmRec().owned=[id];cosmWear(id);const T=cosmTrail(T0);if(T.edge.join()===T0.edge.join()||T.mid.join()===T0.mid.join())mute.push(id);}
  G.cosm=null;
  /* отделка и забрало: кукла */
  const doll=()=>{const cv=document.createElement("canvas");cv.width=120;cv.height=200;drawKitFigure(cv.getContext("2d"),120,200,null,0);return cv.getContext("2d").getImageData(0,0,120,200).data;};
  G.kit=null;const d0=doll();
  for(const id in COSM_SUIT){cosmRec().owned=[id];cosmWear(id);if(cosmDiff(doll(),d0)<50)mute.push(id);G.cosm=null;}
  for(const id in COSM_VISOR){cosmRec().owned=[id];cosmWear(id);if(cosmDiff(doll(),d0)<5)mute.push(id);G.cosm=null;}
  /* ходок на грунте тоже читает забрало */
  const walker=()=>cosmPix(c=>{c.translate(80,60);c.scale(4,4);drawAstronaut({phase:0,walk:0,air:false,face:1});});
  const w0=walker();
  cosmRec().owned=["vi_amber"];cosmWear("vi_amber");if(cosmDiff(walker(),w0)<3)mute.push("vi_amber(ходок)");G.cosm=null;
  cosmRec().owned=["su_gold"];cosmWear("su_gold");if(cosmDiff(walker(),w0)<20)mute.push("su_gold(ходок)");G.cosm=null;
  /* метка: корпус */
  const hull=()=>cosmPix(c=>{c.translate(80,60);c.scale(2.2,2.2);drawHull(G.shipId,false,false,0);});
  const h0=hull();
  for(const id in COSM_MARK){cosmRec().owned=[id];cosmWear(id);if(cosmDiff(hull(),h0)<4)mute.push(id);G.cosm=null;}
  /* огни: рисунок отличается от «мигает» хотя бы в одном из ста кадров */
  for(const id in COSM_LIGHTS){cosmRec().owned=[id];cosmWear(id);let dif=0;
    for(let t=0;t<100;t++){const bl=Math.sin(t*.07);if(cosmLightOn(-1,bl,t)!==(bl>0)||cosmLightOn(1,bl,t)!==(bl>0))dif++;}
    if(!dif)mute.push(id);G.cosm=null;}
  /* сигнал: своё имя и настоящий синтез */
  for(const id in COSM_CHIME){cosmRec().owned=[id];cosmWear(id);const n=cosmChimeName();if(!n||!SFX[n])mute.push(id);G.cosm=null;}
  eq(mute.join(", "),"","ни одна косметика не молчит");
  G.cosm=null;G.kit=null;
}));

TEST_SUITES.push(()=>suite("косметика: шкатулка, слоты, сейв и полка «Сороки»",()=>{
  resetWorld();
  G.cosm=null;G.wander=null;
  ok(!cosmWear("ex_blue"),"чужое не надевается");
  ok(cosmGive("ex_blue")&&cosmOn("exhaust")==="ex_blue","купленное в пустой слот надевается сразу");
  ok(cosmGive("ex_fan")&&cosmOn("exhaust")==="ex_blue","второе в тот же слот — в шкатулку, надетое не сбито");
  ok(cosmWear("ex_fan")&&cosmOn("exhaust")==="ex_fan","надели второе");
  ok(cosmTakeOff("exhaust")&&cosmOn("exhaust")===null,"сняли — слот пуст");
  eq(cosmSlotOf("vi_amber"),"visor","забрало знает свой слот");
  /* сейв: своё и надетое; чужой id снимается */
  cosmWear("ex_fan");cosmGive("su_gold");
  const snap=snapshot();
  G.cosm=null;applySave(snap);
  eq(cosmOn("exhaust"),"ex_fan","надетое вернулось из сейва");
  eq(cosmRec().owned.length,3,"и всё своё");
  const s2=JSON.parse(JSON.stringify(snap));s2.cosm.exhaust="ex_никакой";applySave(s2);
  eq(cosmOn("exhaust"),null,"незнакомое из сейва — снято, не упало");
  delete s2.cosm;applySave(s2);
  eq(cosmRec().owned.length,0,"старый сейв без поля — пустая шкатулка");
  /* полка «Сороки»: две вещи косметики на обитаемой стоянке, купленная — бирка */
  G.cosm=null;
  const w=wanderAt(WANDER_T0+1000),L=wanderLots(w);
  eq(L.filter(l=>l.fam==="cosm").length,w.dark?1:2,"косметики на полке — две (одна на тёмной)");
  const c=L.find(l=>l.fam==="cosm");
  G.matches=40;
  ok(wanderBuy(c),"куплена за спички");
  ok(cosmOwns(c.id)&&cosmOn(c.cat.slot)===c.id,"лежит в шкатулке и надета");
  ok(wanderLots(w)[c.i].gone,"витрина пуста");
  /* ОПИСЬ: шкатулка открыта, у вещи кнопка */
  tableToggle(true,"hold");
  const box=document.getElementById("loglist");
  const card=box.querySelector(".op-card.cosm[data-id='"+c.id+"']");
  ok(!!card,"вещь в шкатулке на сукне");
  ok(!!card&&[...card.querySelectorAll("button")].some(b=>/СНЯТЬ/.test(b.textContent)),"надетая — со «СНЯТЬ»");
  tableToggle(false);
  G.cosm=null;G.wander=null;G.matches=0;
}));
