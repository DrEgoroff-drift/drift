/* ══════════════ детекторы, часть вторая: законы (M443) ══════════════
   Первая часть (90b-detect) — уши и глаз: что случилось за шаг, кадр в
   четверть, меры кадра, обход G, ловушка опечаток. Здесь — таблица приборов,
   исключения по праву и сами детекторы `detX(ctx) → нарушения`. Файл разрезан
   по этому шву, чтобы каждый читался целиком (сторож размера, 40 КБ). */

/* ── приборы: цифра на экране против поля, из которого она обязана читать ──
   Одна короткая таблица на всё, что игрок читает глазами как ПОКАЗАНИЕ.
   `dom` — элемент (судится, только когда виден), `cv` — строка с канвы по
   образцу, `want` — что там должно стоять, посчитанное из мира ТЕМ ЖЕ способом,
   каким игрок это понимает, а не тем, каким это считает hud(). «РАКЕТА 0»
   с кнопки, у которой нет пусковой, или ноль при полном трюме — умирают здесь. */
function detSuitSrc(){
  return (G.mode==="raid"&&G.raid)?G.raid:(G.surf&&(G.mode==="surface"||G.mode==="cave"||G.mode==="dig")?G.surf:null);
}
const DET_INSTR=[
  {ru:"бак",dom:"fnum",want:()=>Math.round(G.fuel)+"/"+Math.round(stat().fuelMax)},
  {ru:"корпус",dom:"hnum",want:()=>Math.round(G.hull)+"/"+Math.round(stat().hullMax)},
  {ru:"трюм",dom:"cnum",want:()=>held()+"/"+stat().cargoMax},
  {ru:"щит",dom:"snum",want:()=>Math.round(G.shield||0)+"/"+Math.round(stat().shieldMax)},
  {ru:"энергия",dom:"enum",want:()=>Math.round(clamp(G.energy||0,0,stat().energyMax))+"/"+stat().energyMax},
  {ru:"скафандр",dom:"unum",want:()=>{const s=detSuitSrc();return s?Math.round(clamp(s.suit,0,100))+"%":null;}},
  {ru:"ранец",dom:"jnum",want:()=>(G.surf)?Math.round(clamp(jetFuel(),0,1)*100)+"%":null},
  {ru:"кошелёк",dom:"purse",re:/^([\d\s  ]+) кр · (\d+) дан/,want:m=>[String(Math.round(G.credits)),String(G.data)],
    got:m=>[m[1].replace(/[\s  ]/g,""),m[2]]},
  /* ракеты: остаток в трюме, а не счётчик кнопки; «…» — перезарядка */
  {ru:"ракеты",dom:"mslbtn",re:/^РАКЕТА (\d+)$/,want:()=>[String(G.cargo.missile|0)],got:m=>[m[1]]},
  {ru:"кошелёк станции",dom:"wCr",re:/^([\d\s  ]+) кр$/,want:()=>[String(G.credits|0)],got:m=>[m[1].replace(/[\s  ]/g,"")]},
  {ru:"данные станции",dom:"wDt",re:/^(\d+) данных$/,want:()=>[String(G.data)],got:m=>[m[1]]},
  /* канва: масштаб камеры и расстояния на фишках у кромки (17-mode-system) */
  {ru:"масштаб",cv:/^МАСШТАБ ×(\d+\.\d\d)$/,mode:"system",want:()=>[G.zoom.toFixed(2)]},
  {ru:"до звезды",cv:/^ЗВЕЗДА · (\d+)$/,mode:"system",want:()=>[String(Math.round(Math.hypot(G.ship.x,G.ship.y)))],tol:2},
  {ru:"до станции",cv:/^(.+) · (\d+)$/,mode:"system",
    pick:m=>G.sys&&G.sys.station&&m[1]===G.sys.station.name.toUpperCase(),
    want:()=>[G.sys.station.name.toUpperCase(),String(Math.round(Math.hypot(G.sys.station.x-G.ship.x,G.sys.station.y-G.ship.y)))],tol:2},
  /* трюм на приборной доске пояса (24-mode-belt) */
  {ru:"трюм пояса",cv:/^ТРЮМ (\d+) \/ (\d+)$/,mode:"belt",want:()=>[String(held()),String(stat().cargoMax)]}
];
/* снять показания — это наблюдение, его делает шаг; судит detInstr */
function detInstrRead(texts){
  const out=[];
  for(const I of DET_INSTR){
    if(I.mode&&I.mode!==G.mode)continue;
    let want;try{want=I.want();}catch(e){want=null;}
    if(want==null)continue;
    if(I.dom){
      const el=document.getElementById(I.dom);if(!el)continue;
      const cs=getComputedStyle(el);
      if(cs.visibility==="hidden"||!el.getClientRects().length)continue;
      const txt=String(el.textContent||"").trim();
      if(I.re){const m=I.re.exec(txt);if(!m)continue;out.push({ru:I.ru,shown:I.got(m),want:I.want(m),tol:I.tol||0});}
      else out.push({ru:I.ru,shown:[txt],want:[want],tol:0});
    }else if(I.cv&&texts){
      for(const t of texts){const m=I.cv.exec(t.s);if(!m)continue;if(I.pick&&!I.pick(m))continue;
        out.push({ru:I.ru,shown:m.slice(1),want,tol:I.tol||0});}
    }
  }
  return out;
}

/* ── исключения по праву: у каждого имя и причина ──
   Сюда не кладут «ну он такой». Кладут то, что задумано так, и говорят, где
   это задумано. Детектор, покрасневший не на баг, чинят в детекторе, а не здесь. */
const DET_EXEMPT=[
  /* номера ярусов у стенки ствола — меловая риска, не прибор: гаснут
     вместе со светом отсека, яркий только текущий (21ac-base-draw) */
  {det:"картина",mode:"base",what:/^текст «\d+»/,why:"номера ярусов — краска на стене ствола"},
  /* погашенная лампа табло пояса тусклая нарочно: «погашенная и так ничего не
     значит, а над миром висит только нужное сейчас» (25-cockpit); горящая
     зажигается своим цветом */
  {det:"картина",mode:"belt",what:/^текст «(СБЛИЖЕНИЕ|ТОПЛИВО|ТРЮМ ПОЛОН)» не читается/,why:"погашенная лампа табло"},
  /* капли и хлопья рисуются в каждом кадре на новом месте (19d-weather):
     это движение погоды, и на тёмном небе каждая капля — «выскочивший» блок */
  {det:"картина",what:/^(за один кадр выскакивает|кадр в покое мигает).*\(осадки: (rain|acid|snow|ash|dust|spore)\)/,why:"осадки — новые капли в каждом кадре"},
  /* рост человека: разрез базы меряется своим человеком (21aa-base-rooms:
     «ростом 26 px»), абордаж — проекцией с глубиной (24aa-raid-draw) */
  {det:"картина",what:/^рост человека · (база|рейд)/,why:"сцена со своим масштабом по замыслу"}
];
function detExempt(v){
  for(const E of DET_EXEMPT){
    if(E.det&&E.det!==v.det)continue;
    if(E.mode&&E.mode!==v.mode)continue;
    if(E.scene&&E.scene!==v.scene)continue;
    if(E.gesture&&E.gesture!==v.gesture)continue;
    if(E.what&&!E.what.test(v.what))continue;
    return E.why;
  }
  return "";
}

/* ══════════════ сами детекторы: ctx → нарушения ══════════════ */
function detV(c,det,what,where){return {det,scene:c.scene,gesture:c.gesture,mode:c.mode1||c.mode0,what,where:where||""};}

/* 1. СБОЙ */
function detCrash(c){
  const v=[];
  for(const e of c.threw||[])v.push(detV(c,"сбой","исключение в шаге: "+e));
  if(c.crash>0)v.push(detV(c,"сбой","сторож кадра сработал "+c.crash+" раз"));
  for(const e of c.errs||[])v.push(detV(c,"сбой","window.onerror: "+e));
  for(const e of c.cons||[])v.push(detV(c,"сбой","console.error: "+e));
  return v;
}
/* 2. ЗАСТОЙ */
function detStuck(c){
  const v=[];
  if(c.sick)v.push(detV(c,"застой",c.sick));
  for(const o of c.overlays||[])if(!o.closed)v.push(detV(c,"застой","экран «"+o.what+"» не закрывается ни своей кнопкой, ни Escape",o.tried||""));
  /* рука на руле, а в кадре и в мире — ничего: ни пикселя, ни поля */
  if((c.gesture==="W"||c.gesture==="A")&&c.mode1===c.mode0&&!c.spoke&&
     c.before&&c.after&&detDiff(c.before,c.after)===0&&c.sig0===c.sig1)
    /* ровно ноль, не «почти»: с допуском .002 закон сработал на карте под W/A,
       где клавиши по замыслу молчат (0.438.0) — смягчать можно только вместе
       с таблицей молчания драйвера (DET_SILENT в 91zzzzzzzz-detect) */
    v.push(detV(c,"застой","под клавишей "+c.gesture+" не сдвинулось ничего — ни кадр, ни мир"));
  return v;
}
/* 3. ЗАКОН: числа, типы, опечатки */
function detLaw(c){
  const v=[];
  if(c.walk){
    for(const b of c.walk.bad)v.push(detV(c,"закон","не число в мире: "+b));
    if(c.prevTypes)for(const [p,t] of c.walk.types){
      const t0=c.prevTypes.get(p);if(!t0||t0===t)continue;
      if((t0==="number"&&(t==="string"||t==="undefined"))||(t0==="string"&&t==="number")||(t0==="boolean"&&t==="string"))
        v.push(detV(c,"закон","поле сменило тип: "+p+" было "+t0+", стало "+t));
    }
  }
  const N=c.names;
  if(N&&N.ok){
    for(const k of Object.keys(c.reads||{})){
      const nm=k.slice(k.lastIndexOf(".")+1);
      if(!N.set.has(nm))v.push(detV(c,"закон","читают поле, которого не пишет никто: "+k+" ×"+c.reads[k]));
    }
    for(const k of Object.keys(c.writes||{})){
      const nm=k.slice(k.lastIndexOf(".")+1);
      if((N.count.get(nm)||0)<=1)v.push(detV(c,"закон","пишут поле, которого не читает никто: "+k));
    }
  }
  return v;
}
/* 3. ЗАКОН: приборы и числа на глазах */
const DET_DIRTY=/NaN|undefined|Infinity|\bnull\b|-0(?![.,\d])|\d\.\d{4,}|\d+e[+-]?\d+/;
function detInstr(c){
  const v=[];
  for(const r of c.inst||[]){
    for(let i=0;i<r.want.length;i++){
      const a=r.shown[i],b=r.want[i];
      const same=a===b||(r.tol&&isFinite(+a)&&isFinite(+b)&&Math.abs(+a-+b)<=r.tol);
      if(!same){v.push(detV(c,"закон","прибор «"+r.ru+"» показывает "+r.shown.join("/")+", а в мире "+r.want.join("/")));break;}
    }
  }
  for(const t of c.texts||[])if(!t.hull&&DET_DIRTY.test(t.s))v.push(detV(c,"закон","число на канве не человеческое: «"+t.s.slice(0,40)+"»"));
  for(const s of c.hudText||[])if(DET_DIRTY.test(s))v.push(detV(c,"закон","число на приборах не человеческое: «"+s.slice(0,40)+"»"));
  for(const s of c.nameless||[])v.push(detV(c,"закон","кнопка без слова — ни текста, ни aria-label, ни title: "+s));
  return v;
}
/* 3. ЗАКОН: орган управления отвечает кадром — и по смыслу (M437) */
function detControls(c){
  const v=[];
  if(c.gesture==="покой"||!c.before||!c.after)return v;
  const d=detDiff(c.before,c.after),churn=c.churn||0;
  const other=c.spoke||c.dom1!==c.dom0||c.mode1!==c.mode0;
  /* ── смысл жеста — там, где он у жеста есть ──
     Там класс и есть ответ: W в полёте двигает корабль на пиксели, а не на
     проценты кадра, и порог «вдвое больше своего шевеления» его не слышит.
     Корабль, ушедший по носу относительно фона, — ответ, который видно. */
  let cls=null,why="";
  if(c.mode1===c.mode0){
    if(c.gesture==="W"&&c.mode0==="system"&&c.p0&&c.p1&&c.ship0){
      const sp=detPatchShift(c.p0,c.p1,16);
      const sx=c.ship0[0]/c.before.k,sy=c.ship0[1]/c.before.k;
      const bg=detBgShift(c.before,c.after,3,(x,y)=>Math.hypot(x-sx,y-sy)>18);
      const rx=sp.dx-bg.dx,ry=sp.dy-bg.dy,m=Math.hypot(rx,ry);
      const along=m?(rx*Math.cos(c.nose0)+ry*Math.sin(c.nose0))/m:0;
      cls=m>=3&&along>.5;
      why="W: корабль не пошёл по носу — сдвиг относительно фона "+rx.toFixed(0)+","+ry.toFixed(0)+" px, по носу "+along.toFixed(2);
    }else if(c.gesture==="A"&&c.mode0==="system"&&c.p0&&c.p1){
      const r=detRot(c.p0,c.p1);
      cls=r.th<=-4&&r.iNeg>r.iPos+.05&&r.iNeg>r.i0+.05;
      why="A: нос не повернул против часовой — лучший поворот силуэта "+r.th+"° (совпадение против "+r.iNeg.toFixed(2)+", по "+r.iPos.toFixed(2)+", без поворота "+r.i0.toFixed(2)+")"+(c.diag?" · "+c.diag:"");
    }else if(c.gesture==="колесо"&&(c.mode0==="system"||c.mode0==="map")&&c.zc){
      const s=detScale(c.before,c.after,c.zc[0]/c.before.k,c.zc[1]/c.before.k);
      cls=s.s>=1.07&&s.e<s.e1;   /* лучший масштаб крупнее, и он лучше «ничего не случилось» */
      why="«+» и колесо: кадр не укрупнился от центра (лучший масштаб ×"+s.s+")";
    }else if(c.gesture==="протяжка"&&c.mode0==="map"&&c.drag){
      const p=detParallax(c.before,c.after,c.drag[0],c.drag[1]);
      cls=p.deep>=.2&&p.sheet>=.1;   /* живая карта ~33 %, небо прибито 12–15 %, едет с листом 3 % */
      why="протяжка карты: слои не идут по глубине — с листом "+Math.round(p.sheet*100)+"% блоков, с небом "+
        Math.round(p.deep*100)+"%, прибито к экрану "+Math.round(p.still*100)+"%";
    }
  }
  if(cls===false){v.push(detV(c,"закон",why));return v;}
  if(cls===true||other||c.mute)return v;
  const fresh=detNewMotion(detBlocks(c.before,c.after),c.idleB);
  if(!(d>Math.max(churn*2,.004))&&fresh<2)
    v.push(detV(c,"закон","жест «"+c.gesture+"» остался без ответа: кадр "+(d*100).toFixed(2)+"% при своём шевелении "+
      (churn*100).toFixed(2)+"%, нового движения "+fresh+" блоков, голоса нет, окна нет, режим тот же"+
      (c.fieldMoved?" (поле при этом менялось — игрок его не видит)":"")));
  return v;
}
/* 4. КАРТИНА: кадр в покое */
const DET_TEXT_MIN=8;     /* кегль в CSS-пикселях при мерке 1; дальше — × UIK (M221) */
function detLum(r,g,b){const f=x=>{x/=255;return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4);};return .2126*f(r)+.7152*f(g)+.0722*f(b);}
function detColor(s){
  let m=/^#([0-9a-f]{6})$/i.exec(s);if(m){const n=parseInt(m[1],16);return [n>>16,(n>>8)&255,n&255,1];}
  m=/^#([0-9a-f]{3})$/i.exec(s);if(m){const h=m[1];return [parseInt(h[0]+h[0],16),parseInt(h[1]+h[1],16),parseInt(h[2]+h[2],16),1];}
  m=/rgba?\(([^)]+)\)/.exec(s);if(m){const p=m[1].split(",").map(Number);return [p[0],p[1],p[2],p.length>3?p[3]:1];}
  return null;
}
/* контраст текста: цвет заливки поверх того, что лежит вокруг надписи. Фон —
   медиана кольца в два пикселя вокруг габарита: плашка под фишкой — тоже фон,
   и так и должно быть */
function detContrast(t,full,fw,fh){
  const c=detColor(t.col);if(!c||!full)return null;
  const x0=Math.max(0,Math.floor(t.x0)-2),y0=Math.max(0,Math.floor(t.y0)-2),x1=Math.min(fw-1,Math.ceil(t.x1)+2),y1=Math.min(fh-1,Math.ceil(t.y1)+2);
  if(x1-x0<3||y1-y0<3)return null;
  const L=[];
  const put=(x,y)=>{const i=(y*fw+x)*4;L.push(detLum(full[i],full[i+1],full[i+2]));};
  for(let x=x0;x<=x1;x+=2){put(x,y0);put(x,y1);}
  for(let y=y0;y<=y1;y+=2){put(x0,y);put(x1,y);}
  L.sort((a,b)=>a-b);const bg=L[L.length>>1];
  const a=c[3]*(t.al==null?1:t.al),tl=detLum(c[0],c[1],c[2])*a+bg*(1-a);
  return (Math.max(tl,bg)+.05)/(Math.min(tl,bg)+.05);
}
function detPicture(c){
  const v=[];
  /* ── кегль × мерка: кадр большого окна (M221, M437) ──
     В окне прогона мерка ≈1, и текст, забывший про неё, выглядит нормально:
     ровно так карта полгода печатала подписи в 8 px при раздутом борте. Поэтому
     кегль судится в кадре 2560×1440 (мерка ×1.75), который шаг рисует отдельно:
     всё, что игрок читает, обязано вырасти вместе с бортом — хотя бы до 8 px × мерку. */
  if(c.gesture==="мерка"){
    const need=DET_TEXT_MIN*(c.UIK||1)*.97;
    for(const t of c.texts||[]){
      if(t.hull||!t.s.trim())continue;
      if(t.px<need)v.push(detV(c,"картина","текст «"+t.s.slice(0,28)+"» "+t.px.toFixed(1)+" px в окне "+c.W+"×"+c.H+
        " (мерка ×"+(c.UIK||1).toFixed(2)+") — нужно не меньше "+need.toFixed(1)));
    }
    return v;
  }
  if(c.gesture!=="покой")return v;
  const f=c.before;
  if(f){
    let s=0,s2=0,hot=0;for(let i=0;i<f.length;i++){s+=f[i];s2+=f[i]*f[i];if(f[i]>250)hot++;}
    const mu=s/f.length,sd=Math.sqrt(Math.max(0,s2/f.length-mu*mu));
    if(sd<3)v.push(detV(c,"картина","кадр пуст: разброс яркости "+sd.toFixed(1)));
    if(hot/f.length>.5)v.push(detV(c,"картина","кадр выжжен: белого "+Math.round(hot/f.length*100)+"%"));
  }
  if(c.f1&&c.f2&&f&&!c.camMove){   /* под едущей камерой блоки у кромки — панорама, не мигание */
    const b=detBlink(f,c.f1,c.f2,c.f3);
    if(b.blink>.01)v.push(detV(c,"картина","кадр в покое мигает: "+(b.blink*100).toFixed(1)+"% блоков"+
      (c.precip?" (осадки: "+c.precip+")":""),b.where.join(" ")));
    if(b.pop>.005)v.push(detV(c,"картина","за один кадр выскакивает или пропадает "+(b.pop*100).toFixed(1)+"% блоков"+
      (c.precip?" (осадки: "+c.precip+")":""),b.where.join(" ")));
  }
  /* текст: контраст в настоящем кадре (кегль — в кадре «мерка» выше) */
  for(const t of c.texts||[]){
    if(t.hull||!t.s.trim())continue;
    /* погашенное нарочно читаться не обязано: под окном оклика и бака фишки
       компаса гаснут до .12, как борт (R0, дизайн 12.09) — это знак «не сейчас».
       Только под открытым модальным окном: без него тусклый текст — ошибка */
    if(t.modal&&t.al!=null&&t.al<.2)continue;
    const cr=detContrast(t,c.full,c.fw,c.fh);
    if(cr!=null&&cr<3)v.push(detV(c,"картина","текст «"+t.s.slice(0,28)+"» не читается: контраст "+cr.toFixed(1)+" (нужно 3)"));
  }
  /* резкость: холст равен окну × плотность, растр в панели не мельче своей рамки */
  if(c.cvsW!=null&&c.cvsW!==Math.round(c.W*c.DPR))v.push(detV(c,"картина","холст "+c.cvsW+" px при окне "+c.W+"×"+c.DPR));
  for(const k of c.canv||[])if(k.bw<k.cw*k.dpr*.9||k.bh<k.ch*k.dpr*.9)
    v.push(detV(c,"картина","растр «"+k.id+"» мыльный: "+k.bw+"×"+k.bh+" на рамку "+k.cw.toFixed(0)+"×"+k.ch.toFixed(0)+" (×"+k.dpr+")"));
  return v;
}
/* 4. КАРТИНА за весь прогон: у человека один рост на ногах */
const DET_ASTRO_H=25;   /* рост астронавта в своих единицах (20-life: шлем −13, ботинок 11.5) */
function detHuman(run){
  const v=[],by={};
  for(const r of run)if(r.astro&&r.astro.length){const a=r.astro.slice().sort((x,y)=>x-y);by[r.scene]={mode:r.mode,h:a[a.length>>1]*DET_ASTRO_H};}
  const foot=Object.keys(by).filter(s=>["surface","cave","dig"].includes(by[s].mode));
  if(foot.length>=2){
    const hs=foot.map(s=>by[s].h),lo=Math.min(...hs),hi=Math.max(...hs);
    if(hi>lo*1.12)v.push({det:"картина",scene:"все",gesture:"покой",mode:"",what:"рост человека на ногах разный: "+foot.map(s=>s+" "+by[s].h.toFixed(0)).join(", "),where:""});
    for(const s of Object.keys(by))if(!foot.includes(s)){
      const h=by[s].h;if(h<lo*.88||h>hi*1.12)
        v.push({det:"картина",scene:s,gesture:"покой",mode:by[s].mode,what:"рост человека · "+s+" "+h.toFixed(0)+" px против "+lo.toFixed(0)+" на ногах",where:""});
    }
  }
  return v;
}
const DETECTORS=[detCrash,detStuck,detLaw,detInstr,detControls,detPicture];
/* ══ конец инструментов ══ */
/* детекторы (90b/90c) — тоже инструменты (DESIGN-tests §3.2): им можно спрашивать окружение;
   сеть над наборами (90-harness, testNetHits) начинается отсюда */
