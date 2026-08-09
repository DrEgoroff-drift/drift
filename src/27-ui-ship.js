/* ══════════════ экран корабля ══════════════ */
const $sv=document.getElementById("shipview"),$svBody=document.getElementById("svBody");
const $svCan=document.getElementById("svcan"),$svFil=document.getElementById("svfilter");
let svSlot=-1, svFilter="all", svHit=[];
/* куда вернуться по ЗАКРЫТЬ: "station" — обратно в терминал станции, иначе в полёт */
let svReturn=null;
function svDraw(){
  const id=G.shipId,h=hullOf(id),anchors=slotAnchors(id),fm=G.fit[id]||{};
  const cw=$sv.clientWidth||W, ch=Math.max(150,Math.min(260,Math.round((window.innerHeight||600)*.32)));
  const dpr=Math.min(2,window.devicePixelRatio||1);
  $svCan.width=cw*dpr;$svCan.height=ch*dpr;
  $svCan.style.height=ch+"px";
  const c=$svCan.getContext("2d");
  c.setTransform(dpr,0,0,dpr,0,0);
  c.clearRect(0,0,cw,ch);
  /* корпус лежит горизонтально, как в полёте: сцена широкая и низкая,
     так он занимает её целиком. Запас по краям — под кружки слотов. */
  const cx=(h.nose+h.tail)*.5;
  const sc=Math.min(cw/(h.len+26),(ch-24)/(h.halfW*2+22));
  const px=x=>cw/2+(x-cx)*sc, py=y=>ch/2+y*sc;
  const old=ctx;ctx=c;
  c.save();
  c.translate(px(0),py(0));c.scale(sc,sc);
  drawHull(id,false,false,G.mods.engine);
  c.restore();
  ctx=old;
  svHit=[];
  anchors.forEach(a=>{
    const sx=px(a.x), sy=py(a.y);
    const K=PART_KINDS[a.kind],on=fm[a.i]!=null,sel=svSlot===a.i;
    svHit.push({x:sx,y:sy,i:a.i});
    c.beginPath();c.arc(sx,sy,sel?9:7,0,TAU);
    c.fillStyle=on?K.col:"rgba(10,14,20,.85)";
    c.globalAlpha=on?.9:1;c.fill();c.globalAlpha=1;
    c.lineWidth=sel?2.2:1.3;
    c.strokeStyle=sel?"#fff":K.col;c.stroke();
    if(!on){c.fillStyle=K.col;c.font="9px ui-monospace,monospace";c.textAlign="center";
      c.textBaseline="middle";c.fillText("+",sx,sy+.5);}
    if(sel){
      c.beginPath();c.arc(sx,sy,13,0,TAU);
      c.strokeStyle="rgba(255,255,255,.35)";c.lineWidth=1;c.stroke();
    }
  });
}
function svRender(){
  const id=G.shipId,S=shipData(id),slots=slotsOf(id),fm=G.fit[id]||{};
  const cap=capOf(id),used=capUsed();
  document.getElementById("svName").textContent="«"+S.ru+"»";
  document.getElementById("svSub").textContent=S.cls;
  const capEl=document.getElementById("svCap");
  capEl.textContent="оснастка "+used+"/"+cap;
  capEl.style.color=used>=cap?"#ff9d7a":"";
  document.getElementById("svSlots").textContent=
    Object.keys(fm).length+" из "+slots.length+" слотов занято";
  document.getElementById("svhint").textContent=
    svSlot<0?"выберите слот на корпусе":
      (PART_KINDS[slots[svSlot]].ru+" · слот "+(svSlot+1)+
       (fm[svSlot]!=null?" · занят":" · свободен"));
  svDraw();

  /* фильтр по категориям — показываем только те, что есть на этом корпусе */
  $svFil.textContent="";
  const kinds=["all"].concat(PART_KEYS.filter(k=>slots.indexOf(k)>=0));
  for(const k of kinds){
    const b=el("button",svFilter===k?"on":"",k==="all"?"ВСЕ":PART_KINDS[k].sh);
    b.onclick=()=>{svFilter=k;svSlot=-1;svRender();};
    $svFil.appendChild(b);
  }

  $svBody.textContent="";
  const cur=stat();

  /* ── занятые слоты ── */
  const filled=slots.map((k,i)=>i).filter(i=>fm[i]!=null&&(svFilter==="all"||slots[i]===svFilter));
  /* налёт часов — первой строкой: это состояние машины, а не одна из её частей */
  $svBody.appendChild(el("div","sec",wearLine()));
  if(filled.length){
    $svBody.appendChild(el("div","sec","УСТАНОВЛЕНО"));
    for(const i of filled){
      const p=partById(fm[i]),K=PART_KINDS[slots[i]];
      const r=el("div","row"+(svSlot===i?" on":""));
      r.appendChild(el("div","nm","<b style='color:"+K.col+"'>"+p.name+"</b><s>"+
        "<span class='pill'>слот "+(i+1)+" · "+K.ru.toLowerCase()+"</span>"+
        "<span class='pill'>"+TIER_RU[p.tier]+" · место "+p.cap+"</span><br>"+
        p.aff.map(a=>"<span class='"+(a.v>0?"up":"dn")+"'>"+affLabel(a)+"</span>").join(" · ")+
        deltaHtml(cur,statPreview(i,null))+"</s>"));
      const b=el("button","act sm","СНЯТЬ");
      b.onclick=()=>{unfitPart(i);svRender();};
      r.appendChild(b);
      r.onclick=e=>{if(e.target!==b){svSlot=svSlot===i?-1:i;svRender();}};
      $svBody.appendChild(r);
    }
  }

  /* ── инвентарь ── */
  const free=G.inv.filter(p=>!isFitted(p.id))
    .filter(p=>svFilter==="all"||p.kind===svFilter)
    .filter(p=>svSlot<0||slots[svSlot]===p.kind)
    .sort((a,b)=>b.tier-a.tier);
  $svBody.appendChild(el("div","sec",
    (svSlot>=0?"ПОДХОДИТ В СЛОТ "+(svSlot+1):"В ИНВЕНТАРЕ")+" · "+free.length+
    " · ВСЕГО "+G.inv.length+"/"+PART_MAX));
  if(!free.length)
    $svBody.appendChild(el("div","row","<div class='nm'><s>"+
      (svSlot>=0?"нет частей этой категории — их роняют пираты и продают станции"
                :"пусто")+"</s></div>"));
  for(const p of free){
    const K=PART_KINDS[p.kind];
    /* куда встанет: выбранный слот, иначе первый свободный подходящий */
    let target=svSlot;
    if(target<0||slots[target]!==p.kind){
      target=-1;
      for(let i=0;i<slots.length;i++)if(slots[i]===p.kind&&fm[i]==null){target=i;break;}
      if(target<0)for(let i=0;i<slots.length;i++)if(slots[i]===p.kind){target=i;break;}
    }
    const fits=target>=0&&capUsed()-(fm[target]!=null?partById(fm[target]).cap:0)+p.cap<=cap;
    const r=el("div","row");
    r.appendChild(el("div","nm","<b style='color:"+K.col+"'>"+p.name+"</b><s>"+
      "<span class='pill'>"+K.ru.toLowerCase()+"</span>"+
      "<span class='pill'>"+TIER_RU[p.tier]+" · место "+p.cap+"</span><br>"+
      p.aff.map(a=>"<span class='"+(a.v>0?"up":"dn")+"'>"+affLabel(a)+"</span>").join(" · ")+
      (target>=0?deltaHtml(cur,statPreview(target,p.id)):"")+
      (target>=0&&!fits?"<span class='delta dn'>не хватает места в оснастке</span>":"")+"</s>"));
    const box=el("div","modbtns");
    const b=el("button","act sm"+(fits?" gold":""),
      target<0?"НЕТ СЛОТА":(fm[target]!=null?"ЗАМЕНИТЬ":"СТАВИТЬ"));
    b.disabled=target<0||!fits;
    b.onclick=()=>{
      if(!fitPart(target,p.id)){say("Не встаёт: нет места в оснастке");return;}
      svSlot=-1;svRender();};
    box.appendChild(b);
    const sb=el("button","act sm","РАЗОБРАТЬ");
    sb.onclick=()=>{
      const res=scrapPart(p.id);
      if(!res)return;
      const list=Object.keys(res.got).map(k=>RES[k].ru.toLowerCase()+" ×"+res.got[k]).join(", ");
      tell("money","Разобрано: "+res.part.name+(list?" → "+list:" → трюм полон"),
           res.part.name+"\nразобрано"+(list?"\n"+list:"\nтрюм полон"));
      svRender();};
    box.appendChild(sb);
    r.appendChild(box);
    $svBody.appendChild(r);
  }
}
function openShipView(){
  for(const k in keys)keys[k]=false;
  document.querySelectorAll(".pads button").forEach(b=>b.classList.remove("on"));
  toggleLog(false);
  svSlot=-1;svFilter="all";
  $sv.classList.add("open");
  svRender();
}
document.getElementById("shipbtn").addEventListener("click",()=>{svReturn=null;openShipView();});
document.getElementById("svClose").addEventListener("click",()=>{
  $sv.classList.remove("open");saveGame(true);
  /* если сюда пришли со станции — возвращаемся в терминал, а не в открытый космос */
  if(svReturn==="station"){svReturn=null;
    if(G.mode==="dock"&&G.st){$st.classList.add("open");syncTabs();renderTab();}
  }
  svReturn=null;});
$svCan.addEventListener("click",e=>{
  const rc=$svCan.getBoundingClientRect();
  const mx=e.clientX-rc.left,my=e.clientY-rc.top;
  let best=-1,bd=22;
  for(const p of svHit){
    const d=Math.hypot(p.x-mx,p.y-my);
    if(d<bd){bd=d;best=p.i;}
  }
  if(best>=0){svSlot=svSlot===best?-1:best;svRender();}
});
window.addEventListener("resize",()=>{if($sv.classList.contains("open"))svRender();});

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
  const rpr=el("div","row");
  rpr.appendChild(el("div","nm","<b>Пресет</b><s>выставить всё сразу</s>"));
  const bpr=el("button","act","НИЗКИЕ / СРЕДНИЕ / ВЫСОКИЕ / МАКС");
  bpr.onclick=()=>{
    const cur=G.opts.gfx.draw;
    const i0=GLV.findIndex(g=>g[0]===cur);
    const nv=GLV[((i0<0?1:i0)+1)%GLV.length][0];
    G.opts.gfx={draw:nv,detail:nv,particles:nv,plants:nv};
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

  if(CLOUD.url){
    const rcl=el("div","row");
    rcl.appendChild(el("div","nm","<b>Облако</b><s>идентификатор: "+(CLOUD.id||"не задан")+"</s>"));
    const b1=el("button","act","ВЫГРУЗИТЬ");b1.onclick=()=>{cloudPush();say("Отправлено");};
    const b2=el("button","act gold","ЗАБРАТЬ");b2.onclick=()=>{cloudPull();renderOpts();};
    rcl.appendChild(b1);rcl.appendChild(b2);$optBody.appendChild(rcl);
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
}
