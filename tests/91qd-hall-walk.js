/* ══════════════ станция пешком (M816) ══════════════ */
/* Места на линии в постоянном порядке; ход клавишами от шлюза доходит до каждого, дверь → бар шагом ≤ 7 с;
   «действие» входит в место (вкладки — только его), «назад» выходит; доли кадра числами: человек на ходу,
   вещь места не под карточкой (ПК — левые 64 %, телефон — верхние 45 %). Настоящий G и зал; видеокарта
   не нужна — камера здесь числа, кадр — проекция. Прямоугольник карточки меряет второй набор (браузер). */
TEST_SUITES.push(()=>suite("станция пешком: места, ход, карточки (M816)",()=>{
  resetWorld();
  ok(T.board("near"),"у старта есть станция — причалили");
  const W=HALL.walk;
  ok(HALL.open&&!!W,"зал открыт на ходу");if(!W){T.leave();return;}
  const P=hallPlacesHere(),ord=HALL_PLACES.map(p=>p.id);
  eq(P[0].id,"lock","первое место — шлюз");
  ok(P.length>=3,"мест на станции "+P.length+" ≥ 3");
  ok(P.every((p,i)=>i===0||ord.indexOf(p.id)>ord.indexOf(P[i-1].id)),"порядок мест — постоянный: "+P.map(p=>p.id).join(" "));
  const run=(P[P.length-1].x-P[0].x)/HALL_WALK_V;
  ok(run<=7,"от шлюза до последнего места шагом "+run.toFixed(2)+" с ≤ 7");

  /* клавиши: вправо от шлюза — под ногами побывало каждое место */
  W.x=P[0].x;W.goal=null;W.go=null;W.eng=null;const seen={};
  keys.right=true;
  try{for(let i=0;i<600&&W.x<P[P.length-1].x-.01;i++){hallWalkStep(.05);const n=hallWalkNear(W);if(n)seen[n.id]=1;}}
  finally{keys.right=false;}
  const miss=P.filter(p=>!seen[p.id]).map(p=>p.id);
  ok(!miss.length,"клавишами до каждого места"+(miss.length?": не дошёл до "+miss.join(","):""));
  hallWalkStep(.05);ok(Math.abs(W.v)<HALL_WALK_V,"клавиши отпущены — шаг гаснет");
  /* зона места — только у таблички на экране, не полоса пола (0.499.46) */
  ok(typeof hallWalkHitAt==="function"&&typeof HALL_HIT_R==="undefined","мир-полоса HIT_R снята — клик по полу снова ход");
  const pose=hallWalkPose({v:HALL_WALK_V,ph:1.1,face:1});
  ok(Array.isArray(pose)&&pose.length===HALL_RIG_POSE.stand.length,"поза шага — массив углов рига");
  ok(Math.abs(pose[3]-HALL_RIG_POSE.stand[3])>.15||Math.abs(pose[4]-HALL_RIG_POSE.stand[4])>.2,"шаг гнёт ногу, не прямые «коньки»");

  /* полоса: тап зовёт к месту бегом и входит по приходу */
  hallWalkTo(P[1].id,true);
  for(let i=0;i<400&&W.eng!==P[1].id;i++)hallWalkStep(.05);
  eq(W.eng,P[1].id,"полоса: пришёл к «"+P[1].id+"» и вошёл");
  hallWalkBack();ok(!W.eng,"назад — карточка закрыта");

  const PC={cw:1920,ch:1080,wide:true},PH={cw:390,ch:844,wide:false};
  if(!HALL.L)HALL.L=hallLayout((G.st&&G.st.stype)||"trade");   /* кадра ещё не было — раскладка та же, что строит он */
  for(const p of P){
    /* на ходу, у места: человек — мерило кадра */
    hallWalkBack(true);W.x=p.x;W.goal=null;hallWalkSettle();
    eq(W.at,p.id,"«"+p.id+"»: под ногами своё место");
    const pw=hallWalkPilot();
    for(const [sz,lo,hi] of [[PC,.26,.31],[PH,.22,.28]]){
      const k=hallManK(hallWalkCam(HALL.L,sz,null),pw[0],pw[1],sz.ch);
      ok(k>=lo&&k<=hi,"«"+p.id+"» "+sz.cw+": идущий "+k.toFixed(3)+" высоты кадра ("+lo+"–"+hi+")");
    }
    /* вход: вкладки — только места, вещь места — мимо карточки */
    hallWalkEngage(p.id);hallWalkSettle();
    eq(W.eng,p.id,"«"+p.id+"»: действие входит в место");
    if(p.tabs.length)ok(p.tabs.indexOf(tab)>=0,"«"+p.id+"»: вкладка «"+tab+"» — из места");
    const c0=HALL_CAMS[hallWalkPlaceCam()];
    ok(!!c0,"«"+p.id+"»: у места есть ближний вид");if(!c0)continue;
    for(const sz of [PC,PH]){
      W.tl=0;const cam=hallWalkCam(HALL.L,sz,c0),q=r3Proj(cam.vp,p.tag,sz.cw,sz.ch);
      ok(!!q&&q.every(Number.isFinite),"«"+p.id+"» "+sz.cw+": вещь места в проекции");if(!q)continue;
      const fx=hallWalkFree(sz.cw)*sz.cw;
      if(sz.wide)ok(q[0]>=0&&q[0]<=fx,"«"+p.id+"» ПК: вещь x "+q[0].toFixed(0)+" — левее карточки ("+fx.toFixed(0)+")");
      else ok(q[1]>=0&&q[1]<=sz.ch*.45,"«"+p.id+"» телефон: вещь y "+q[1].toFixed(0)+" — над листом ("+(sz.ch*.45).toFixed(0)+")");
    }
    hallWalkBack();ok(!W.eng,"«"+p.id+"»: назад выходит");
  }
  T.leave();
}));

/* карточка места — прямоугольником (браузер): на ПК ≤ 36 % ширины справа, на телефоне лист ≤ 55 % высоты снизу */
TEST_SUITES.push(()=>suite("станция пешком: карточка — сбоку или листом (M816)",{tier:"browser"},()=>{
  resetWorld();
  ok(T.board("near"),"причалили");
  if(!HALL.walk){T.leave();ok(false,"зал не на ходу");return;}
  hallWalkEngage("trade");
  const b=$st.querySelector(".body"),r=b&&b.getBoundingClientRect(),w=innerWidth,h=innerHeight;
  ok(!!r&&r.width>0,"тело карточки на экране");
  if(r&&w>760)ok(r.left>=Math.min(w*.64,w-560*UIK)-2&&r.width>=Math.min(w,560*UIK)-40,"ПК: карточка x "+r.left.toFixed(0)+", ширина "+r.width.toFixed(0)+" — 36 % из "+w+", не уже 560");
  else if(r)ok(r.top>=h*.45-1,"телефон: лист от y "+r.top.toFixed(0)+" ≥ 45 % из "+h);
  ok($st.classList.contains("eng"),"зал помечен «в месте»");
  hallWalkBack();ok(!$st.classList.contains("eng"),"назад снимает метку");
  T.leave();
}));

/* кинодень (27da): подошёл к бару — сеанс засчитан раз; после переноса кино в бар (0.499.12) kinoWatch никто не звал */
TEST_SUITES.push(()=>suite("станция пешком: кинодень у бара засчитан один раз",{tier:"browser"},()=>{
  resetWorld();
  ok(T.board("near"),"причалили");
  if(!HALL.walk||!hallPlacesHere().find(p=>p.id==="folk")){T.leave();ok(false,"у причала нет бара на ходу");return;}
  const k0=kinoHere;G.kino=[];
  kinoHere=()=>({title:"«Проба»",id:"t@1",seed:1});
  try{hallWalkEngage("folk");hallWalkBack(true);hallWalkEngage("folk");}
  finally{kinoHere=k0;hallWalkBack(true);}
  eq(G.kino.join(","),"t@1","сеанс в трудовой — один раз за два подхода");
  T.leave();
}));
