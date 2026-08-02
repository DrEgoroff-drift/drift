# Замер экономики: считает доход источников в кредитах за минуту на настоящем G.
$src = Get-Content -Raw -Encoding UTF8 "$PSScriptRoot\..\drift.html"
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  var out=[];
  try{
  function L(s){out.push(s);}
  // ── дроны: сколько стоит точка и когда отбивается дрон ──
  L("=== ДРОН (цена "+DRONES.miner.price+", "+DRONES.miner.ratePerMin+" ед/мин) ===");
  ["ice","iron","silicon","organics","titan","isotopes","iridium","crystal"].forEach(function(k){
    var cap=droneCapacity(k), tot=cap*RES[k].price, mins=cap/DRONES.miner.ratePerMin;
    L(k+" цена "+RES[k].price+" · пул "+cap+" ед = "+tot+" кр · "+Math.round(mins)+" мин · "+
      (RES[k].price*DRONES.miner.ratePerMin).toFixed(1)+" кр/мин · возврат x"+(tot/DRONES.miner.price).toFixed(1));
  });
  // ── фактор: доход маршрута ──
  G.credits=1e6;G.mgrs=[];
  var m=genMgr(4242,["fact"]); hireMgr(m); m=mgrOf("fact");
  // плечи: две ближайшие станции
  var found=[];
  for(var dx=-6;dx<=6&&found.length<4;dx++)for(var dy=-6;dy<=6&&found.length<4;dy++){
    if(!starAt(dx,dy))continue; var s=getSystem(dx,dy); if(s.station)found.push(s);
  }
  found.forEach(function(s){mgrRouteVisit(s);});
  mgrToggleRule(m,"run");
  function income(label){
    var before=G.credits; mgrWorkFact(m,1); L(label+": "+Math.round(G.credits-before)+" кр/мин"+
      (m.legNote?" · "+m.legNote:" · маржи нет, пол"));
  }
  L("=== ФАКТОР (плеч "+m.route.length+", макс "+mgrRouteMax(m)+") ===");
  income("голый lv1");
  ["spec","second","duty","mono","leg"].forEach(function(p){m.perks.push(p);});
  m.xp=MGR_XP[5];
  income("все перки + lv6");
  L("оклад "+mgrPay(m)+" кр/мин · доля "+(mgrCut(m)*100).toFixed(1)+"%");
  // ── наёмник ──
  L("=== НАЁМНИК ===");
  L("жалованье спец: бой "+CREW_SPEC.fight.pay+" · добыча "+CREW_SPEC.mine.pay+
    " · возка "+CREW_SPEC.haul.pay+" кр/мин · рейс отбивает "+(CREW_YIELD*100)+"%");
  // ── дом ──
  L("=== ДОМ: пороги ===");
  HOME_TIERS.forEach(function(t,i){
    var prev=i?HOME_TIERS[i-1].t:0;
    L(t.ru+": "+t.t.toLocaleString("ru")+" (x"+(prev?(t.t/prev).toFixed(2):"-")+")");
  });
  // ── корабли ──
  L("=== КОРПУСА ===");
  for(var id in SHIPS)L(SHIPS[id].ru+": "+SHIPS[id].price+" кр · трюм "+SHIPS[id].cargo);
  }catch(e){out.push("ОШИБКА: "+(e&&e.stack||e));}
  var pre=document.createElement("pre");
  pre.id="econ"; pre.textContent=out.join("\n");
  pre.style.cssText="position:fixed;inset:0;z-index:99999;background:#05070c;color:#bfe8f0;font:11px monospace;overflow:auto;padding:12px";
  document.body.appendChild(pre);
},1500);
</script>
'@
[IO.File]::WriteAllText("$PSScriptRoot\econ.html", $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
