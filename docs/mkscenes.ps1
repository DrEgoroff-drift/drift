# Открытка, пять других мест (M208): пещера, шахта, пояс, орбита, атмосфера.
#
# Сестра mkpost.ps1 и работает так же: drawPostcard зовётся в чужой контекст
# со слепленным снимком, игра при этом не трогается. Если лист выглядит
# хорошо, значит художник места и правда ничего не должен G.
#
#   powershell -ExecutionPolicy Bypass -File docs\shot.ps1 scenes
$src = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot "..\drift.html")
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  var PW=480,PH=300,COLS=3,ROWS=2,PAD=16,CAP=22;
  var out=document.createElement("canvas");
  out.width=PAD+COLS*(PW+PAD);
  out.height=PAD+ROWS*(PH+CAP+PAD);
  out.style.cssText="position:fixed;left:0;top:0;z-index:99999;width:"+out.width+"px;height:"+out.height+"px";
  document.body.appendChild(out);
  var oc=out.getContext("2d");
  oc.fillStyle="#0b0e13";oc.fillRect(0,0,out.width,out.height);
  /* шесть кадров: режим, тип мира, час, cx, cy. Орбита взята дважды — вблизи
     и издали: радиус диска единственное число этого кадра, которое игрок
     чувствует телом, и лист обязан показать оба конца */
  var cases=[["c","terran",.30,420,0,"пещера"],
             ["d","rocky", .30, 3,4,"шахта"],
             ["b","rocky", .40, 40,0,"пояс"],
             ["y","terran",.35, 20,14,"орбита, вблизи"],
             ["y","ice",   .35,200,90,"орбита, издали"],
             ["g","gas",   .45, 30,620,"атмосфера"]];
  var card=document.createElement("canvas");card.width=PW;card.height=PH;
  var cc=card.getContext("2d");
  for(var n=0;n<cases.length;n++){
    var mode=cases[n][0], t=cases[n][1], hour=cases[n][2];
    var cx=cases[n][3], cy=cases[n][4], name=cases[n][5];
    var sys=getSystem(0,0);
    var p=sys.planets.find(function(x){return x.type!=="gas";})||sys.planets[0];
    p.type=t;p.T=TYPES[t]||p.T;p.mix=null;p.mw=null;
    p.rough=Math.min(1.2,p.T.rough);p.res=worldRes(t,null,null);
    delete p.tex;delete p.wx;
    p.seed=(p.seed^(0x7700+n*15485863))>>>0;
    POST_TR.clear();
    var period=CEL_DAY*(6+((p.seed>>>7)&3));
    var tt=Math.round(period*(40+(hour-(p.seed%100)/100+1)%1));
    var lon=null;
    if(mode==="c"){var tr=genTerrain(p,null);lon=+tr.lon.toFixed(3);}
    var snap={v:1,m:mode,sx:0,sy:0,pi:p.idx,mi:-1,lon:lon,cx:cx,cy:cy,t:tt,ver:VER};
    cc.clearRect(0,0,PW,PH);
    var ok=drawPostcard(cc,snap,PW,PH);
    var px=PAD+(n%COLS)*(PW+PAD), py=PAD+Math.floor(n/COLS)*(PH+CAP+PAD);
    oc.drawImage(card,px,py);
    oc.strokeStyle="rgba(255,255,255,.10)";oc.lineWidth=1;
    oc.strokeRect(px+.5,py+.5,PW-1,PH-1);
    oc.fillStyle="#9fb3c2";oc.font="12px ui-monospace,monospace";oc.textAlign="left";
    oc.fillText((ok?"":"ПУСТО · ")+name.toUpperCase()+" · "+postCaption(snap),px,py+PH+15);
  }
  try{fetch("/scenes.png",{method:"POST",body:out.toDataURL("image/png")});}catch(e){}
},1600);
</script>
'@
[IO.File]::WriteAllText((Join-Path $PSScriptRoot "scenes.html"), $head + $add + "</body></html>", (New-Object Text.UTF8Encoding $true))
Write-Output "ok"
