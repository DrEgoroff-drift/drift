/* ══════════════ look() — прибор кадра ══════════════
   `prof()` отвечает, во что обходится кадр. `look()` отвечает, ЧТО в нём.

   Автор сказал про графику «что-то не нравится всё», и разбор глазами дал
   список из одиннадцати придирок — то есть ничего, что можно проверить. Тогда
   кадры померили: во всех сценах, кроме двух, тепло либо 0–3%, либо 88–99%
   (то есть картинка одноцветная), пусто 55–91%, контраст 0.07–0.27, а живых
   тонов 2–6 из 36. После этого «не нравится» перестало быть вкусом и стало
   четырьмя числами, у которых есть мишень.

   Прибор меряет ТО, ЧТО НАРИСОВАНО, а не то, что задумано: читает канву.
   Поэтому он одинаково честен к любому режиму и к любой правке. */
const LOOK_TARGET={warm:[25,75],empty:45,contrast:.30,tones:5};
/* ── замер одного кадра ──
   Считаем по каждому четвёртому пикселю: точность та же, стоимость вчетверо
   меньше. Тон учитывается только у насыщенных и не чёрных пикселей — у серого
   тона нет, и складывать его в гистограмму значит врать себе. */
function lookFrame(){
  const cx=cvs.getContext("2d");
  const W2=cvs.width,H2=cvs.height;
  const d=cx.getImageData(0,0,W2,H2).data;
  const hue=new Array(36).fill(0);
  const sat=[],val=[];let warm=0,cold=0;
  for(let y=0;y<H2;y+=4)for(let x=0;x<W2;x+=4){
    const i=(y*W2+x)*4,r=d[i]/255,g=d[i+1]/255,b=d[i+2]/255;
    const mx=Math.max(r,g,b),mn=Math.min(r,g,b),v=mx,s=mx?(mx-mn)/mx:0;
    let h=0;
    if(mx!==mn){
      if(mx===r)h=60*(((g-b)/(mx-mn))%6);
      else if(mx===g)h=60*((b-r)/(mx-mn)+2);
      else h=60*((r-g)/(mx-mn)+4);
      if(h<0)h+=360;
    }
    sat.push(s);val.push(v);
    if(s>.12&&v>.06){
      hue[Math.floor(h/10)%36]++;
      if(h>=10&&h<70)warm++;else if(h>=170&&h<280)cold++;
    }
  }
  sat.sort((a,b)=>a-b);val.sort((a,b)=>a-b);
  const n=val.length||1;
  const tot=hue.reduce((a,b)=>a+b,0)||1;
  /* «пусто» — доля квадратов 16×16 без единой детали: не тёмное, а именно
     то, на что не на что смотреть */
  let empty=0,blocks=0;
  for(let by=0;by<H2-16;by+=16)for(let bx=0;bx<W2-16;bx+=16){
    let lo=999,hi=-1;
    for(let y=by;y<by+16;y+=3)for(let x=bx;x<bx+16;x+=3){
      const i=(y*W2+x)*4,L=.299*d[i]+.587*d[i+1]+.114*d[i+2];
      if(L<lo)lo=L;if(L>hi)hi=L;
    }
    blocks++;if(hi-lo<10)empty++;
  }
  return {
    tones:hue.filter(v=>v/tot>=.05).length,          /* сколько тонов держат кадр */
    warm:Math.round(100*warm/Math.max(1,warm+cold)), /* тёплых против холодных, % */
    contrast:+(val[Math.floor(n*.95)]-val[Math.floor(n*.05)]).toFixed(2),
    empty:Math.round(100*empty/Math.max(1,blocks)),
    sat:+sat[Math.floor(n/2)].toFixed(2),
    val:+val[Math.floor(n/2)].toFixed(2)
  };
}
/* Приговор по мишеням: строка из галочек, чтобы в консоли было видно сразу */
function lookVerdict(m){
  const T=LOOK_TARGET;
  const ok=[];
  ok.push((m.warm>=T.warm[0]&&m.warm<=T.warm[1]?"✓":"×")+"тепло "+m.warm+"%");
  ok.push((m.empty<=T.empty?"✓":"×")+"пусто "+m.empty+"%");
  ok.push((m.contrast>=T.contrast?"✓":"×")+"контраст "+m.contrast);
  ok.push((m.tones>=T.tones?"✓":"×")+"тонов "+m.tones);
  return ok.join(" · ");
}
/* ── что мерить ──
   Список сцен один на всех: им пользуется и прибор, и фуззер в тестах. Второй
   такой же список разошёлся бы с этим за месяц (M238). Постановка сцены НЕ
   трогает сохранение: `lookAll` снимает снимок до и возвращает его после. */
function lookScenes(){
  const find=pred=>{
    for(let r0=0;r0<12;r0++)for(let x=-r0;x<=r0;x++)for(let y=-r0;y<=r0;y++){
      if(Math.max(Math.abs(x),Math.abs(y))!==r0)continue;
      if(!starAt(x,y))continue;
      const s=getSystem(x,y);if(pred(s))return s;
    }
    return null;
  };
  const jump=s=>{if(!s)return false;G.sx=s.sx;G.sy=s.sy;G.sys=s;G.ap=null;G.orbit=null;return true;};
  const land=pred=>{
    const s=find(q=>(q.planets||[]).some(pred));if(!jump(s))return false;
    const p=s.planets.find(pred);const tr=genTerrain(p);
    G.land={p,tr,x:tr.padX,y:groundAt(tr,tr.padX)};enterSurface();return true;
  };
  const day=p=>p.type!=="gas"&&p.T.atm!=="отсутствует";
  return [
    {id:"система",set:()=>{const s=find(q=>q.station&&(q.planets||[]).length>=3);if(!jump(s))return false;
      G.mode="system";G.ship.x=s.planets[1].x+380;G.ship.y=s.planets[1].y+220;G.zoom=.7;return true;}},
    {id:"карта",set:()=>{G.mode="map";return true;}},
    {id:"заход",set:()=>{const s=find(q=>(q.planets||[]).some(p=>p.type!=="gas"));if(!jump(s))return false;
      startLanding(s.planets.find(p=>p.type!=="gas"));return true;}},
    {id:"грунт",set:()=>land(day)},
    {id:"шахта",set:()=>{if(!land(day))return false;enterDig();return true;}},
    {id:"пещера",set:()=>{if(!land(day))return false;enterCave();return !!G.cave;}},
    {id:"пояс",set:()=>{const s=find(q=>!!q.belt);if(!jump(s))return false;enterBelt();return true;}},
    {id:"черпак",set:()=>{const s=find(q=>(q.planets||[]).some(p=>p.type==="gas"));if(!jump(s))return false;
      startScoop(s.planets.find(p=>p.type==="gas"));return true;}},
    {id:"база",set:()=>{if(!land(day))return false;
      const p=G.surf.p;
      /* деньги и сплавы прибору нужны только чтобы поставить сцену; сохранение
         возвращается целиком в lookAll, а «+=» к кошельку в этой игре имеет
         право писать одна функция earn() — её сторожит отдельный тест */
      G.credits=Math.max(G.credits|0,99999);G.cargo.alloy=Math.max(G.cargo.alloy|0,20);
      if(!baseAt(G.sx,G.sy,p.idx)&&!foundBase(p))return false;
      enterBase(p);return G.mode==="base";}},
    {id:"дом",set:()=>{if(!G.home)G.home=homeInit();
      G.home.tier=Math.max(4,G.home.tier|0);
      const s=find(q=>(q.planets||[]).some(day));if(!jump(s))return false;
      G.home.sx=G.sx;G.home.sy=G.sy;
      if(!land(day))return false;enterHomeIn();return G.mode==="homein";}}
  ];
}
/* ── прогон по всем сценам ──
   Сохранение снимается до и возвращается после: прибор не имеет права
   переставить игроку мир. Печатает таблицу и возвращает её же. */
function lookAll(frames){
  frames=frames||14;
  const snap=JSON.parse(JSON.stringify(snapshot()));
  const rows=[];
  for(const sc of lookScenes()){
    let ok=true;
    try{ok=sc.set()!==false;}catch(e){ok=false;}
    if(!ok)continue;
    try{
      for(let i=0;i<frames;i++){G.t++;stepWorld(1);}
      drawWorld();
      rows.push(Object.assign({сцена:sc.id},lookFrame()));
    }catch(e){rows.push({сцена:sc.id,ошибка:e.message});}
  }
  try{applySave(snap);}catch(e){}
  G.mode="system";G.land=null;G.surf=null;G.dig=null;G.cave=null;G.base=null;G.hin=null;
  if(typeof console.table==="function")console.table(rows);
  for(const r of rows)if(!r.ошибка)console.log(r.сцена+": "+lookVerdict(r));
  return rows;
}
/* Один кадр, тот что сейчас на экране: `look()` в консоли во время игры */
function look(){
  const m=lookFrame();
  console.log(G.mode+" · "+lookVerdict(m));
  return m;
}
