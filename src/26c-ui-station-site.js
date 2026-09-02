/* ══════════════ станция · вкладка СТРОЙКА (ВЛАДЕНИЯ) ══════════════
   M291, шаг 3. Экранов не прибавляется: вкладка живёт в разделе ВЛАДЕНИЯ рядом
   с базами (91f-ui держит шесть разделов). Наверху — что здесь стоит и что оно
   вам должно, ниже — что можно заложить, в конце — почему остальное нельзя.
   Термины впервые встречаются в последствии, а не в справке: «ПЕЧЬ ВЗЯЛА 6 —
   ЗА ВАМИ ЗАПИСАНЫ СПЛАВЫ». */
function renderSiteTab(){
  const sys=G.sys;if(!sys||!sys.station)return;
  const r=rungOf(sys.sx,sys.sy),pts=rungPoints(sys.sx,sys.sy);
  const sites=bldSites(r),built=bldBuiltHere(sys),now=Date.now();
  $body.appendChild(el("div","sec","СТРОЙКА · "+(sites?"ПЛОЩАДОК "+sites+" · ЗАНЯТО "+built.length:"ПЛОЩАДКИ ЕЩЁ НЕТ")+
    " · ЗДЕСЬ ВАС ЗОВУТ: "+rungAddress(r,sys.sx,sys.sy).toUpperCase()));
  if(r<11){
    const gates=rungGateTxt(sys.sx,sys.sy);
    const need=Math.max(0,RUNG_T[11]-pts);
    $body.appendChild(el("div","row","<div class='nm'><b>Монтажная площадка откроется, когда система станет вашей</b><s>"+
      (need>0?"считается всё, что вы здесь сделали: посадки, шахты, база, имя, посёлок, дроны, привезённый груз · сделано на "+pts+" из "+RUNG_T[11]:"дел здесь уже довольно")+
      (gates.length?"<br>ещё нужно: "+gates.join(", "):"")+"</s></div>"));
  }
  /* ── что стоит ── */
  for(const id of built){
    const def=BLD[id],B=bldEntry(sys.key,id);if(!def||!B)continue;
    bldTick(sys.key,id,now);
    const row=el("div","row");
    let st;
    if(!bldReady(B,now))st="монтаж · готово через "+Math.max(1,Math.ceil((B.ready-now)/60000))+" мин";
    else if(def.fam==="A")st="делает "+Object.keys(def.makes).map(k=>RES[k].ru.toLowerCase()+" "+def.makes[k]*B.lvl).join(", ")+" в смену";
    else{
      const Q=bldQuota(def,B.lvl);
      st="ест "+Object.keys(Q).map(k=>RES[k].ru.toLowerCase()+" "+Q[k]).join(" + ")+" в смену · в бункере "+
        Object.keys(Q).map(k=>(B.my[k]|0)).join("/")+" · запас на "+HOLD_CAP_SHIFTS*holdCapMul(sys.key)+" смены";
    }
    row.appendChild(el("div","nm","<b>"+def.ru+" ×"+B.lvl+"</b><s>"+st+"</s>"));
    /* поднять уровень */
    if(B.lvl<3&&bldReady(B,now)){
      const cost=bldUpgradeCost(def,B.lvl+1),can=bldCanPay(cost);
      const b=el("button","act sm"+(can?" gold":""),"×"+(B.lvl+1));
      b.title=bldCostTxt(cost).replace(/<[^>]+>/g,"");
      b.disabled=!can;
      b.onclick=()=>{const why=bldUpgrade(sys,id);
        if(why)say(why);else tell("tech",def.ru+" на «"+G.st.name+"» поднят до ×"+B.lvl,def.ru+"\n×"+B.lvl+" · монтаж идёт");
        renderTab();};
      row.appendChild(b);
    }
    $body.appendChild(row);
    if(!bldReady(B,now))continue;
    if(def.fam==="A"){
      /* запас промысла — продаётся вам со скидкой */
      for(const k in def.makes){
        const have=Math.floor(B.got[k]||0),price=srcPrice(sys,k);
        const rr=el("div","row");
        rr.appendChild(el("div","nm","<b style='color:"+RES[k].col+"'>"+RES[k].ru+" в запасе: "+have+"</b><s>по "+price+" кр — 0.7 цены · копится до "+
          def.makes[k]*B.lvl*HOLD_CAP_SHIFTS*holdCapMul(sys.key)+"</s>"));
        const free=Math.max(0,stat().cargoMax-held()),can=Math.min(have,free,Math.floor(G.credits/price));
        const b=el("button","act"+(can?" gold":""),can?"ВЗЯТЬ ×"+can:"НЕЧЕГО");
        b.disabled=!can;
        b.onclick=()=>{const n=bldBuySrc(sys,id,k,can);
          if(n)tell("money","Взято с промысла на «"+G.st.name+"»: "+RES[k].ru.toLowerCase()+" ×"+n,"С промысла: "+RES[k].ru+" ×"+n);
          renderTab();};
        rr.appendChild(b);$body.appendChild(rr);
      }
    }else{
      /* сдать в цех то, что он ест и что есть в трюме */
      for(const k in def.eats){
        const have=G.cargo[k]|0;if(!have)continue;
        const want=Math.min(have,bldWant(sys,k));
        const price=RES[k].ind?indPrice(k):marketFor(sys)[k];
        const rr=el("div","row");
        rr.appendChild(el("div","nm","<b>Сдать в цех: <span style='color:"+RES[k].col+"'>"+RES[k].ru.toLowerCase()+"</span> ×"+have+"</b><s>"+
          (want?"возьмёт "+want+" по "+price+" кр · за вами запишут "+Object.keys(def.makes).map(kk=>RES[kk].ru.toLowerCase()).join(", "):"бункер полон — приходите через смену")+"</s></div>"));
        const b=el("button","act"+(want?" gold":""),"СДАТЬ");
        b.disabled=!want;
        b.onclick=()=>{
          const rev=RES[k].ind?bldSellInd(sys,k,want):sellCargo(sys,k,want);
          tell("money",def.ru.toUpperCase()+" ВЗЯЛ "+want+" "+RES[k].ru.toUpperCase()+" — ЗА ВАМИ ЗАПИСАНЫ "+Object.keys(def.makes).map(kk=>RES[kk].ru.toUpperCase()).join(", ")+" · +"+rev.toLocaleString("ru")+" кр",
               def.ru+" взял "+want+"\n+"+rev.toLocaleString("ru")+" кр · пай растёт");
          renderTab();};
        rr.appendChild(b);$body.appendChild(rr);
      }
      /* пай */
      const got=Object.keys(B.got).filter(k=>Math.floor(B.got[k])>0);
      const cap=Object.keys(def.makes).map(k=>RES[k].ru.toLowerCase()+" до "+def.makes[k]*B.lvl*HOLD_CAP_SHIFTS*holdCapMul(sys.key)).join(", ");
      const rr=el("div","row");
      rr.appendChild(el("div","nm","<b>Ваш пай: "+(got.length?got.map(k=>"<span style='color:"+RES[k].col+"'>"+RES[k].ru.toLowerCase()+" "+Math.floor(B.got[k])+"</span>").join(", "):"пока ничего")+
        "</b><s>лежит здесь под вашим именем · "+cap+" · дальше — ничьё</s></div>"));
      const b=el("button","act"+(got.length?" gold":""),"ЗАБРАТЬ");
      b.disabled=!got.length;
      b.onclick=()=>{const n=bldCollect(sys,id);
        if(n)tell("money","Пай забран на «"+G.st.name+"»: "+n+" ед","Пай\n"+n+" ед в трюм");
        else say("В трюме нет места");
        renderTab();};
      rr.appendChild(b);$body.appendChild(rr);
    }
  }
  /* ── что можно заложить ── */
  if(r>=11){
    const A=bldAvailable(sys),free=bldFreeSites(sys);
    if(A.ok.length){
      $body.appendChild(el("div","sec",(free?"МОЖНО ЗАЛОЖИТЬ · ":"ПЛОЩАДКИ ЗАНЯТЫ · ")+"МОНТАЖ "+BLD_SHIFTS[1]+"–"+BLD_SHIFTS[3]+" СМЕНЫ ПО ЯРУСУ"));
      for(const fam of BLD_FAM_KEYS){
        const L=A.ok.filter(x=>x.def.fam===fam);if(!L.length)continue;
        for(const x of L){
          const def=x.def,can=free>0&&bldCanPay(def.cost);
          const row=el("div","row");
          row.appendChild(el("div","nm","<b>"+def.ru+"</b><s>"+BLD_FAM[fam].ru.toLowerCase()+" · "+bldIoTxt(def)+"<br>цена: "+bldCostTxt(def.cost)+
            (!can&&free>0?"<br>не хватает: "+bldLack(def.cost).join(", "):"")+"</s>"));
          const b=el("button","act"+(can?" gold":""),"ЗАЛОЖИТЬ");
          b.disabled=!can;
          b.onclick=()=>{const why=bldLay(sys,def.id);
            if(why)say(why);
            else tell("tech","Заложен "+def.ru.toLowerCase()+" на «"+G.st.name+"» · монтаж "+BLD_SHIFTS[def.tier]+" смены",
                      def.ru+"\nзаложен · монтаж идёт");
            renderTab();};
          row.appendChild(b);$body.appendChild(row);
        }
      }
    }
    if(A.no.length){
      /* остальное — одной строкой на причину, а не списком в сорок строк */
      const byWhy={};
      for(const x of A.no){if(x.why==="уже стоит")continue;(byWhy[x.why]=byWhy[x.why]||[]).push(x.def.ru);}
      const keys=Object.keys(byWhy);
      if(keys.length){
        $body.appendChild(el("div","sec","ЗДЕСЬ НЕ ПОСТАВИТЬ"));
        for(const w of keys)$body.appendChild(el("div","row","<div class='nm'><b>"+w+"</b><s>"+byWhy[w].length+" — "+byWhy[w].slice(0,4).join(", ")+(byWhy[w].length>4?"…":"")+"</s></div>"));
      }
    }
  }
}
