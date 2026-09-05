/* ══════════════ силуэт корпуса и вход в ОПИСЬ ══════════════
   До M341 здесь жил экран КОРАБЛЬ|СКАФАНДР: корпус со слотами, список частей,
   кукла с полкой. Всё это переехало на один стол — ОПИСЬ (27j-ui-opis): что
   на тебе, что в трюме, что снято. От экрана остался силуэт с якорями слотов —
   его рисует ОПИСЬ — и кнопка меню, которая открывает стол. Ниже — настройки. */
/* корпус лежит горизонтально, как в полёте; якоря слотов — кружки цвета рода
   части: занятый залит, пустой обведён с плюсом, выбранный крупнее и с кольцом.
   Возвращает список якорей в координатах канвы — для тапа и переноса. */
function hullSilhouette(c,cw,ch,id,sel,fm){
  const h=hullOf(id),anchors=slotAnchors(id);fm=fm||{};
  c.clearRect(0,0,cw,ch);
  const cx=(h.nose+h.tail)*.5;
  const sc=Math.min(cw/(h.len+26),(ch-24)/(h.halfW*2+22));
  const px=x=>cw/2+(x-cx)*sc, py=y=>ch/2+y*sc;
  const old=ctx;ctx=c;
  c.save();
  c.translate(px(0),py(0));c.scale(sc,sc);
  drawHull(id,false,false,G.mods.engine);
  c.restore();
  ctx=old;
  const hit=[];
  anchors.forEach(a=>{
    const sx=px(a.x), sy=py(a.y);
    const K=PART_KINDS[a.kind],on=fm[a.i]!=null,isSel=sel===a.i;
    hit.push({x:sx,y:sy,i:a.i,kind:a.kind});
    c.beginPath();c.arc(sx,sy,isSel?9:7,0,TAU);
    c.fillStyle=on?K.col:"rgba(10,14,20,.85)";
    c.globalAlpha=on?.9:1;c.fill();c.globalAlpha=1;
    c.lineWidth=isSel?2.2:1.3;
    c.strokeStyle=isSel?"#fff":K.col;c.stroke();
    if(!on){c.fillStyle=K.col;c.font="9px ui-monospace,monospace";c.textAlign="center";
      c.textBaseline="middle";c.fillText("+",sx,sy+.5);c.textBaseline="alphabetic";}
    if(isSel){
      c.beginPath();c.arc(sx,sy,13,0,TAU);
      c.strokeStyle="rgba(255,255,255,.35)";c.lineWidth=1;c.stroke();
    }
  });
  return hit;
}
document.getElementById("shipbtn").addEventListener("click",()=>{tableToggle(true,"hold");});

function keyRow(section,action){
  const r=el("div","row");
  r.appendChild(el("div","nm","<b>"+ACTION_RU[action]+"</b>"));
  const cur=actionKey(section,action);
  const isRebinding=rebinding&&rebinding.section===section&&rebinding.action===action;
  const b=el("button","act"+(isRebinding?" gold":""),isRebinding?"…НАЖМИТЕ КЛАВИШУ":keyLabel(cur));
  b.onclick=()=>{rebinding={section,action};renderOpts();};
  r.appendChild(b);
  return r;
}
function renderOpts(){
  $optBody.innerHTML="";
  const mk=(title,note,val,on)=>{
    const r=el("div","row");
    r.appendChild(el("div","nm","<b>"+title+"</b><s>"+note+"</s>"));
    const b=el("button","act"+(val?" gold":""),val?"ВКЛ":"ВЫКЛ");
    b.onclick=()=>{on();renderOpts();};
    r.appendChild(b);$optBody.appendChild(r);
  };
  $optBody.appendChild(el("div","sec","ПОСАДКА"));
  mk("Автоматическая посадка","корабль сам заходит на площадку; выключите — сажать вручную по приборам",
    G.opts.easyLand,()=>G.opts.easyLand=!G.opts.easyLand);
  $optBody.appendChild(el("div","sec","АВТОПИЛОТ"));
  mk("Стыковаться автоматически","по прибытии к станции сразу открывать терминал",
    G.opts.autoDock,()=>G.opts.autoDock=!G.opts.autoDock);
  $optBody.appendChild(el("div","sec","КЛАВИШИ · ПОЛЁТ И ПЛАНЕТА"));
  for(const act of ["left","right","thrust","brake","act","fire","launch"]){
    $optBody.appendChild(keyRow("main",act));
  }
  $optBody.appendChild(el("div","sec","КЛАВИШИ · ПОЯС АСТЕРОИДОВ"));
  for(const act of ["left","right","pup","pdown","rollL","rollR","thrust","brake","act","fire"]){
    $optBody.appendChild(keyRow("belt",act));
  }
  const rrst=el("div","row");
  rrst.appendChild(el("div","nm","<b>Сбросить управление</b><s>вернуть клавиши по умолчанию</s>"));
  const brst=el("button","act","СБРОС");
  brst.onclick=()=>{G.opts.keys={main:{},belt:{}};invalidateKeyMap();renderOpts();};
  rrst.appendChild(brst);$optBody.appendChild(rrst);
  $optBody.appendChild(el("div","sec","ЭКРАННЫЕ КНОПКИ"));
  const PADS=[["auto","АВТО"],["always","ВСЕГДА"],["hide","СКРЫТЬ"]];
  const rp=el("div","row");
  rp.appendChild(el("div","nm","<b>Показывать пэды</b><s>«авто» — прячутся при вводе с клавиатуры/мыши, "+
    "возвращаются от касания</s>"));
  const bp=el("button","act gold",PADS.find(p=>p[0]===G.opts.pads)[1]);
  bp.onclick=()=>{const i=PADS.findIndex(p=>p[0]===G.opts.pads);G.opts.pads=PADS[(i+1)%PADS.length][0];
    applyPadMode();renderOpts();};
  rp.appendChild(bp);$optBody.appendChild(rp);
  const rps=el("div","row");
  rps.appendChild(el("div","nm","<b>Размер кнопок</b><s>мельче — меньше загораживают экран</s>"));
  const SZ=[[.8,"МЕЛКИЕ"],[1,"ОБЫЧНЫЕ"],[1.25,"КРУПНЫЕ"]];
  const bsz=el("button","act gold",SZ.find(s=>s[0]===G.opts.padSize)[1]);
  bsz.onclick=()=>{const i=SZ.findIndex(s=>s[0]===G.opts.padSize);G.opts.padSize=SZ[(i+1)%SZ.length][0];
    applyPadSize();renderOpts();};
  rps.appendChild(bsz);$optBody.appendChild(rps);
  $optBody.appendChild(el("div","sec","ЗВУК"));
  mk("Звук","всё синтезируется на лету — ни одного звукового файла",
    audioOn(),()=>{G.opts.audio.on=!audioOn();applyVolumes();
      if(audioOn())unlockAudio();else{stopEngine();musicStop();}});
  /* ползунок, а не перебор шагов: три источника приходится сводить друг с другом,
     и четырёх ступеней для этого мало */
  const volRow=(title,note,key,onTest)=>{
    const rr=el("div","row");
    const lab=el("div","nm","<b>"+title+"</b><s>"+note+"</s>");
    rr.appendChild(lab);
    const val=el("div","qt",Math.round(G.opts.audio[key]*100)+"%");
    const sl=document.createElement("input");
    sl.type="range";sl.min=0;sl.max=100;sl.step=5;
    sl.value=Math.round(G.opts.audio[key]*100);
    sl.className="vol";
    sl.oninput=()=>{
      G.opts.audio[key]=(+sl.value)/100;
      val.textContent=sl.value+"%";
      applyVolumes();unlockAudio();
    };
    sl.onchange=()=>{if(onTest)onTest();};
    rr.appendChild(sl);rr.appendChild(val);
    $optBody.appendChild(rr);
  };
  volRow("Музыка","фоновая мелодия, своя в каждой локации и на каждой планете","music");
  volRow("Эффекты","выстрелы, бур, шаги, интерфейс","sfx",()=>sfx("ui",{f:900}));
  volRow("Двигатель","гул тяги — звучит только когда двигатель работает","engine",()=>{
    engineLoop(1,.5);setTimeout(stopEngine,700);});
  /* ── голос приёмника (M349a): системные голоса, по имени; только в полёте и в дороге ── */
  if(typeof voiceOpts==="function"){
    const VO=voiceOpts(),VL=voiceList();
    mk("Голос приёмника","маяк ГЛАВТРАССЫ и прочие читаются вслух — тихо, в полёте и в дороге; голоса — те, что стоят в системе",
      !!VO.on,()=>{VO.on=!VO.on;if(!VO.on)voiceCancel();});
    if(VO.on){
      const rv=el("div","row");
      rv.appendChild(el("div","nm","<b>Громкость голоса</b><s>фон, не объявление: по умолчанию 35 %</s>"));
      const val=el("div","qt",Math.round(VO.vol*100)+"%");
      const sl=document.createElement("input");sl.type="range";sl.min=0;sl.max=100;sl.step=5;sl.value=Math.round(VO.vol*100);sl.className="vol";
      sl.oninput=()=>{VO.vol=(+sl.value)/100;val.textContent=sl.value+"%";};
      rv.appendChild(sl);rv.appendChild(val);$optBody.appendChild(rv);
      const RT=[[.85,"НЕ СПЕША"],[1,"ОБЫЧНЫЙ"],[1.15,"ЖИВЕЕ"]];
      const rr=el("div","row");rr.appendChild(el("div","nm","<b>Темп</b><s>пробу читал .88 — автору было «медленно»</s>"));
      const ir=Math.max(0,RT.findIndex(x=>Math.abs(x[0]-VO.rate)<.01));
      const br=el("button","act gold",RT[ir][1]);br.onclick=()=>{VO.rate=RT[(ir+1)%RT.length][0];renderOpts();};
      rr.appendChild(br);$optBody.appendChild(rr);
      const roles=[["beacon","Маяк ГЛАВТРАССЫ","ровный, мужской, если есть"],["keeper","Хранитель «Сороки»","тихий"],["disp","Диспетчер станции","женский, если есть"]];
      for(const [id,ru,note] of roles){
        const r2=el("div","row");
        const cur=voicePick(id);
        r2.appendChild(el("div","nm","<b>"+ru+"</b><s>"+note+(VL.length?" · голосов в системе: "+VL.length:" · русских голосов в системе нет — поставьте в ОС, игра увидит сама")+"</s>"));
        const b2=el("button","act",cur?cur.name:"НЕТ ГОЛОСА");b2.disabled=VL.length<2;
        b2.onclick=()=>{const i=VL.findIndex(v=>cur&&v.name===cur.name);VO[id]=VL[(i+1)%VL.length].name;renderOpts();};
        r2.appendChild(b2);
        const bt=el("button","act sm","ПРОБА");bt.disabled=!VL.length;
        bt.onclick=()=>{voiceCancel();voiceSay(id==="beacon"?"Маяк ГЛАВТРАССЫ. Смена. Принято / сто тонн / титана.":(id==="keeper"?"Спички считаем целыми.":"Диспетчер. Причал свободен."),id);};
        r2.appendChild(bt);$optBody.appendChild(r2);
      }
    }
  }
  $optBody.appendChild(el("div","sec","ГРАФИКА"));
  const GLV=[[.6,"НИЗКАЯ"],[1,"СРЕДНЯЯ"],[1.5,"ВЫСОКАЯ"],[2,"МАКСИМУМ"]];
  const gfxRow=(title,note,key)=>{
    const rr=el("div","row");
    rr.appendChild(el("div","nm","<b>"+title+"</b><s>"+note+"</s>"));
    const i0=GLV.findIndex(g=>g[0]===G.opts.gfx[key]);
    const bb=el("button","act gold",GLV[i0<0?1:i0][1]);
    bb.onclick=()=>{G.opts.gfx[key]=GLV[((i0<0?1:i0)+1)%GLV.length][0];renderOpts();};
    rr.appendChild(bb);$optBody.appendChild(rr);
  };
  gfxRow("Дальность прорисовки","астероиды и объекты дальше/ближе от корабля","draw");
  gfxRow("Детализация моделей","дистанция, на которой астероиды остаются подробными","detail");
  gfxRow("Плотность частиц","шлейф двигателя, пыль, обломки","particles");
  gfxRow("Растительность","количество растений и живности на планетах — влияет на новые посадки","plants");
  /* Потолок кадров стоит отдельно от четырёх ползунков качества: те убирают
     из мира предметы, а этот не убирает ничего — он только реже рисует то же
     самое. На слабой или встроенной видеокарте помогает сильнее всех
     остальных вместе взятых, и картинка при этом не беднеет. */
  /* Ступени выбраны так, чтобы каждая была ДОСТИЖИМА. Развёртка выдаёт кадры
     через равные промежутки, и потолок между двумя её ступенями округляется
     вниз до ближней: 45 на шестидесятигерцовом экране молча превращается в 30,
     и пункт меню начинает врать. Остаются 60 и 30 — на обычном экране это
     «как было» и «вдвое реже», а на скоростном (120 и выше) шестьдесят сами
     по себе снимают половину нагрузки, которую игра до сих пор жгла впустую. */
  const FLV=[[0,"БЕЗ ПОТОЛКА"],[60,"60 КАДРОВ"],[30,"30 КАДРОВ"]];
  const rfp=el("div","row");
  rfp.appendChild(el("div","nm","<b>Потолок кадров</b><s>не выше указанного: реже рисовать — тише вентилятор и холоднее видеокарта, на скорость движения не влияет</s>"));
  const j0=Math.max(0,FLV.findIndex(g=>g[0]===G.opts.gfx.fps));
  const bfp=el("button","act gold",FLV[j0][1]);
  bfp.onclick=()=>{G.opts.gfx.fps=FLV[(j0+1)%FLV.length][0];renderOpts();};
  rfp.appendChild(bfp);$optBody.appendChild(rfp);
  /* Разрешение канвы: самая тяжёлая статья на ретине — вчетверо больше
     пикселей за те же кадры. «Авто» начинает с полного и само спускается,
     если кадр не держится; вручную — когда хочется либо чёткости любой
     ценой, либо тишины вентилятора. */
  const RLV=[[0,"АВТО"],[1,"1×"],[1.5,"1.5×"],[2,"2× (ЧЁТКО)"]];
  const rres=el("div","row");
  const rNote=(G.opts.gfx.res?"":"сейчас ×"+DPR+" · ")+"экран ×"+(window.devicePixelRatio||1).toFixed(1)+
    "; меньше пикселей — быстрее кадр, на логику не влияет";
  rres.appendChild(el("div","nm","<b>Разрешение</b><s>"+rNote+"</s>"));
  const jr=Math.max(0,RLV.findIndex(g=>g[0]===G.opts.gfx.res));
  const bres=el("button","act gold",RLV[jr][1]);
  bres.onclick=()=>{G.opts.gfx.res=RLV[(jr+1)%RLV.length][0];RES_AUTO=2;resize();renderOpts();};
  rres.appendChild(bres);$optBody.appendChild(rres);
  const rpr=el("div","row");
  rpr.appendChild(el("div","nm","<b>Пресет</b><s>выставить всё сразу</s>"));
  const bpr=el("button","act","НИЗКИЕ / СРЕДНИЕ / ВЫСОКИЕ / МАКС");
  bpr.onclick=()=>{
    const cur=G.opts.gfx.draw;
    const i0=GLV.findIndex(g=>g[0]===cur);
    const nv=GLV[((i0<0?1:i0)+1)%GLV.length][0];
    /* потолок кадров пресетом не трогается: это отдельное решение игрока
       про железо, а не про то, насколько подробен мир */
    G.opts.gfx={draw:nv,detail:nv,particles:nv,plants:nv,fps:G.opts.gfx.fps};
    renderOpts();
  };
  rpr.appendChild(bpr);$optBody.appendChild(rpr);
  $optBody.appendChild(el("div","sec","УПРАВЛЕНИЕ В КАБИНЕ"));
  mk("Инверсия по вертикали","тянуть вниз — нос вверх, как в авиасимуляторах",
    G.opts.invY,()=>G.opts.invY=!G.opts.invY);
  mk("Инверсия по горизонтали","тянуть влево — обзор вправо",
    G.opts.invX,()=>G.opts.invX=!G.opts.invX);
  mk("Инверсия рулей ◀ ▶","меняет местами кнопки рыскания",
    G.opts.invYaw,()=>G.opts.invYaw=!G.opts.invYaw);
  const SENS=[[.55,"НИЗКАЯ"],[1,"ОБЫЧНАЯ"],[1.7,"ВЫСОКАЯ"],[2.6,"РЕЗКАЯ"]];
  const si=SENS.findIndex(s=>s[0]===G.opts.lookSens);
  const rs=el("div","row");
  rs.appendChild(el("div","nm","<b>Чувствительность обзора</b><s>скорость поворота головы при протяжке по стеклу</s>"));
  const bs=el("button","act gold",SENS[si<0?1:si][1]);
  bs.onclick=()=>{G.opts.lookSens=SENS[((si<0?1:si)+1)%SENS.length][0];renderOpts();};
  rs.appendChild(bs);$optBody.appendChild(rs);
  $optBody.appendChild(el("div","sec","ОБЗОР"));
  const r=el("div","row");
  r.appendChild(el("div","nm","<b>Масштаб</b><s>текущий ×"+G.zoom.toFixed(2)+
    " · щипок двумя пальцами или кнопки + −</s>"));
  const b=el("button","act","СБРОС");
  b.onclick=()=>{setZoom(1);renderOpts();};
  r.appendChild(b);$optBody.appendChild(r);
  $optBody.appendChild(el("div","sec","СОХРАНЕНИЕ"));
  if(!STORAGE_OK)$optBody.appendChild(el("div","sec",
    "ХРАНИЛИЩЕ БРАУЗЕРА НЕДОСТУПНО — ТАК БЫВАЕТ В ПРЕДПРОСМОТРЕ. "+
    "ОТКРОЙТЕ ФАЙЛ С САЙТА ИЛИ ПОЛЬЗУЙТЕСЬ КОДОМ НИЖЕ."));
  const rsv=el("div","row");
  rsv.appendChild(el("div","nm","<b>Записать полёт</b><s>также сохраняется само: при стыковке, прыжке, взлёте</s>"));
  const bsv=el("button","act gold","СОХРАНИТЬ");
  bsv.onclick=()=>{saveGame(false);renderOpts();};
  rsv.appendChild(bsv);$optBody.appendChild(rsv);

  const rld=el("div","row");
  const has=hasSave();
  rld.appendChild(el("div","nm","<b>Загрузить запись</b><s>"+
    (has?"вернуться к последнему сохранению":"записей пока нет")+"</s>"));
  const bld=el("button","act","ЗАГРУЗИТЬ");
  bld.disabled=!has;
  bld.onclick=()=>{if(loadGame()){$opts.classList.remove("open");say("Полёт восстановлен");}
    else say("Не удалось прочитать запись");};
  rld.appendChild(bld);$optBody.appendChild(rld);

  const rcd=el("div","row");
  const box=document.createElement("textarea");
  box.className="codebox";box.placeholder="код сохранения";
  const wrap=el("div","nm","<b>Код сохранения</b><s>перенос между устройствами без сервера</s>");
  wrap.appendChild(box);
  rcd.appendChild(wrap);
  const bex=el("button","act","ПОЛУЧИТЬ");
  bex.onclick=()=>{box.value=exportCode();box.select();};
  const bim=el("button","act gold","ПРИМЕНИТЬ");
  bim.onclick=()=>{
    if(!box.value.trim()){say("Вставьте код");return;}
    if(importCode(box.value)){saveGame(true);$opts.classList.remove("open");say("Код принят");}
    else say("Код не распознан");
  };
  rcd.appendChild(bex);rcd.appendChild(bim);$optBody.appendChild(rcd);

  /* Облако показывается только когда игра открыта с сайта: у игры с диска
     сервера рядом нет, и обещать ему нечего. */
  if(cloudHere()){
    const rcl=el("div","row");
    rcl.appendChild(el("div","nm",cloudOn()
      ? "<b>Облако</b><s>учётная запись: "+cloudName()+"<br>полёт уезжает на сервер сам</s>"
      : "<b>Облако</b><s>вы не вошли — запись живёт только в этом браузере<br>вход на заглавной странице</s>"));
    if(cloudOn()){
      const b1=el("button","act","ВЫГРУЗИТЬ");b1.onclick=()=>cloudPush(true);
      const b2=el("button","act gold","ЗАБРАТЬ");b2.onclick=()=>{cloudPull();renderOpts();};
      rcl.appendChild(b1);rcl.appendChild(b2);
    }else{
      const b3=el("button","act gold","ВОЙТИ");b3.onclick=()=>{location.href="/";};
      rcl.appendChild(b3);
    }
    $optBody.appendChild(rcl);
    /* ── уйти совсем ──
       Раньше уйти было нельзя: запись, почта и хеш пароля оставались навсегда, а
       просьба «удалите меня» упиралась в переписку. Кнопка стоит последней и
       спрашивает пароль — необратимое действие должно стоить усилия. */
    if(cloudOn()){
      const rdel=el("div","row");
      rdel.appendChild(el("div","nm","<b>Удалить учётную запись</b>"+
        "<s>с сервера уйдёт всё: запись, почта, облачное сохранение и суточные копии.<br>"+
        "полёт в этом браузере останется — он хранится здесь</s>"));
      const bd=el("button","act","УДАЛИТЬ");
      bd.onclick=()=>{
        const p=prompt("Это необратимо: с сервера уйдёт всё.\nВведите пароль, чтобы подтвердить:");
        if(!p)return;
        cloudCall("delete",{pass:p}).then(d=>{
          if(d&&d.ok){cloudForget();say("Учётная запись удалена\nполёт остался в этом браузере",260);renderOpts();}
          else say("Не удалено\n"+((d&&d.error)||"сервер не ответил"),220);
        }).catch(()=>say("Облако недоступно"));
      };
      rdel.appendChild(bd);
      $optBody.appendChild(rdel);
    }
  }

  const rrs=el("div","row");
  rrs.appendChild(el("div","nm","<b>Начать заново</b><s>стирает запись без возможности вернуть</s>"));
  const brs=el("button","act",resetArm?"ТОЧНО СТЕРЕТЬ?":"СБРОС");
  brs.onclick=()=>{
    if(!resetArm){resetArm=true;renderOpts();setTimeout(()=>{resetArm=false;},4000);return;}
    stDel(SAVE_KEY);resetArm=false;location.reload();
  };
  rrs.appendChild(brs);$optBody.appendChild(rrs);

  $optBody.appendChild(el("div","sec","СВОДКА"));
  const s2=stat(),r2=el("div","row");
  r2.appendChild(el("div","nm","<s>сборка 4 — вид из кабины, приборная панель, инверсия осей<br>корпус «"+s2.S.ru+"» · "+G.credits.toLocaleString("ru")+
    " кр · "+G.data+" данных<br>открыто тел: "+G.found.size+" · видов: "+G.species.size+"</s>"));
  $optBody.appendChild(r2);
  optGroups();
}
/* ── вкладки настроек ──
   Экран был одним свитком на двадцать разделов: чтобы дойти до звука, надо
   было пролистать все клавиши. Разделы теперь собраны в пять вкладок по
   смыслу; сами разделы и их порядок не тронуты — вкладка лишь прячет чужие. */
const OPT_TABS=[["ПОЛЁТ",/ПОСАДКА|АВТОПИЛОТ|КАБИНЕ|ОБЗОР/],["КЛАВИШИ",/КЛАВИШИ|ЭКРАННЫЕ/],
  ["ЗВУК",/ЗВУК/],["ГРАФИКА",/ГРАФИКА/],["ЗАПИСЬ",/СОХРАНЕНИЕ|ХРАНИЛИЩЕ|СВОДКА/]];
let optTab="ПОЛЁТ";
function optGroups(){
  const nav=document.getElementById("optTabs");if(!nav)return;
  nav.innerHTML="";
  for(const [name] of OPT_TABS){
    const b=el("button",name===optTab?"on":"",name);
    b.onclick=()=>{optTab=name;renderOpts();$optBody.scrollTop=0;};
    nav.appendChild(b);
  }
  let cur=null;
  for(const n of Array.from($optBody.children)){
    if(n.classList.contains("sec")){
      const t=n.textContent;
      const g=OPT_TABS.find(x=>x[1].test(t));
      cur=g?g[0]:cur;
    }
    n.style.display=(cur===optTab)?"":"none";
  }
}
