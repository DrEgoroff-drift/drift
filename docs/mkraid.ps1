# Стенд логова: занятая система, вход в абордаж, барон на мостике.
$src = Get-Content -Raw -Encoding UTF8 "$PSScriptRoot\..\drift.html"
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  G.running=true;
  G.occ={}; occSet(G.sx,G.sy,3);
  var PB={orbit:2000,ang:0,x:0,y:0,seed:12345,level:2,name:"база Тарнис"};
  enterRaid(PB);
  // поставить барона и свиту прямо перед игроком, чтобы кадр их поймал
  var S=G.raid;
  S.foes.length=0;
  var fx=S.x, fz=S.z;
  S.a=0;
  function put(kind,dist,side,baron){
    var K=FOE_KINDS[kind];
    var dx=Math.cos(S.a)*dist-Math.sin(S.a)*side;
    var dz=Math.sin(S.a)*dist+Math.cos(S.a)*side;
    S.foes.push({x:fx+dx,z:fz+dz,a:Math.PI,kind:kind,hp:K.hp*(baron?3:1),
      hpMax:K.hp*(baron?3:1),boss:kind==="boss",baron:baron,cool:0,aware:true,
      seed:99,bob:0});
  }
  put("boss",230,-130,true);
  put("heavy",300,-190,false);
  put("grunt",180,-90,false);
},1400);
</script>
'@
[IO.File]::WriteAllText("$PSScriptRoot\raid.html", $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
