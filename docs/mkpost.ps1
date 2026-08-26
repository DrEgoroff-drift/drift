# Открытка (M188): лист из шести карточек — художник открытки, а не игра.
#
# Здесь не снимается экран режима. Здесь вызывается drawPostcard в чужой
# контекст, ровно так, как его будет звать альбом на столе и получатель
# карточки: снимок → кадр. Если лист выглядит хорошо, а игра при этом не
# трогалась ни разу — значит художник и правда ничего не должен G.
#
#   powershell -ExecutionPolicy Bypass -File docs\shot.ps1 post
$src = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot "..\drift.html")
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  /* карточка: 480×300, как в замере против JPEG */
  var PW=480,PH=300,COLS=3,ROWS=2,PAD=16,CAP=22;
  var out=document.createElement("canvas");
  out.width=PAD+COLS*(PW+PAD);
  out.height=PAD+ROWS*(PH+CAP+PAD);
  out.style.cssText="position:fixed;left:0;top:0;z-index:99999;width:"+out.width+"px;height:"+out.height+"px";
  document.body.appendChild(out);
  var oc=out.getContext("2d");
  oc.fillStyle="#0b0e13";oc.fillRect(0,0,out.width,out.height);
  /* шесть мест: тип мира, час суток, режим. Час ставится через t — фаза
     выводится из него и семени планеты (06a-celest) */
  var cases=[["terran",.25,"s"],["desert",.52,"s"],["ice",.78,"s"],
             ["jungle",.30,"s"],["rocky",.62,"l"],["volcanic",.20,"s"]];
  var card=document.createElement("canvas");card.width=PW;card.height=PH;
  var cc=card.getContext("2d");
  for(var n=0;n<cases.length;n++){
    var t=cases[n][0], hour=cases[n][1], mode=cases[n][2];
    var sys=getSystem(0,0);
    var p=sys.planets.find(function(x){return x.type!=="gas";})||sys.planets[0];
    /* лепим мир нужного типа из настоящей планеты: снимок ссылается на неё
       индексами, значит художник возьмёт ровно её */
    p.type=t;p.T=TYPES[t]||p.T;p.mix=null;p.mw=null;
    p.rough=Math.min(1.2,p.T.rough);p.res=worldRes(t,null,null);
    delete p.tex;delete p.wx;
    p.seed=(p.seed^(0x3300+n*15485863))>>>0;
    POST_TR.clear();
    var period=CEL_DAY*(6+((p.seed>>>7)&3));
    /* час ставится ФАЗОЙ: celSun выводит её из t и семени. Прибавить сверху
       «сорок суток для красоты» значит сдвинуть фазу и снять весь час */
    var tt=Math.round(period*(40+(hour-(p.seed%100)/100+1)%1));
    var tr=genTerrain(p,null);
    var snap={v:1,m:mode,sx:0,sy:0,pi:p.idx,mi:-1,lon:+tr.lon.toFixed(3),
              cx:Math.round(tr.W*.5),t:tt,ver:VER};
    cc.clearRect(0,0,PW,PH);
    var ok=drawPostcard(cc,snap,PW,PH);
    var px=PAD+(n%COLS)*(PW+PAD), py=PAD+Math.floor(n/COLS)*(PH+CAP+PAD);
    oc.drawImage(card,px,py);
    oc.strokeStyle="rgba(255,255,255,.10)";oc.lineWidth=1;
    oc.strokeRect(px+.5,py+.5,PW-1,PH-1);
    oc.fillStyle="#9fb3c2";oc.font="12px ui-monospace,monospace";oc.textAlign="left";
    oc.fillText((ok?"":"ПУСТО · ")+(TYPES[t]&&TYPES[t].ru||t).toUpperCase()+
      " · "+postCaption(snap)+(mode==="l"?" · аппарат":""),px,py+PH+15);
  }
  try{fetch("/post.png",{method:"POST",body:out.toDataURL("image/png")});}catch(e){}
},1600);
</script>
'@
[IO.File]::WriteAllText((Join-Path $PSScriptRoot "post.html"), $head + $add + "</body></html>", (New-Object Text.UTF8Encoding $true))
Write-Output "ok"
