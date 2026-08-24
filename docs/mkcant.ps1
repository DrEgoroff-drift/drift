# Кантина: пять типов зала в одном листе.
#
# Раньше стенд просто открывал станцию и оставлял человека смотреть глазами —
# сравнить торговый зал с научным было нельзя, а именно в сравнении и видно,
# что залы отличаются только палитрой. Теперь все пять рисуются подряд в свой
# холст (drawCantinaRoom берёт любой), и лист уходит на стенд.
$src = Get-Content -Raw -Encoding UTF8 "$PSScriptRoot\..\drift.html"
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  G.running=false; G.credits=1e6;
  var found=null;
  for(var dx=-6;dx<=6&&!found;dx++)for(var dy=-6;dy<=6&&!found;dy++){
    if(!starAt(dx,dy))continue; var s=getSystem(dx,dy); if(s.station)found=s;
  }
  G.sx=found.sx;G.sy=found.sy;G.sys=found;
  openStation();
  var kinds=[["trade","TRADE HALL"],["indust","WORKS"],["yard","SHIPYARD"],
             ["sci","SCIENCE"],["outpost","OUTPOST"]];
  var RW=1100, RH=300, PAD=26, dpr=2;
  var cv=document.createElement("canvas");
  cv.width=RW*dpr; cv.height=(RH+PAD)*kinds.length*dpr;
  var c=cv.getContext("2d"); c.scale(dpr,dpr);
  c.fillStyle="#05070c"; c.fillRect(0,0,RW,(RH+PAD)*kinds.length);
  var list=stationMgrs(G.sys);
  var deals=(typeof stationDeals==="function")?stationDeals(G.sys):[];
  kinds.forEach(function(kind,n){
    var room=document.createElement("canvas");
    room.width=RW*dpr; room.height=RH*dpr;
    var rc=room.getContext("2d"); rc.setTransform(dpr,0,0,dpr,0,0);
    G.st.stype=kind[0];
    /* у каждого зала своё зерно: иначе пять залов — один и тот же чертёж */
    G.sys.seed=(found.seed^(n*0x9E37))>>>0;
    try{ drawCantinaRoom({width:RW,height:RH,getContext:function(){return rc;}},
                          list,null,null,deals); }catch(e){ console.log("зал "+kind[0]+": "+e.message); }
    var y=n*(RH+PAD)+PAD;
    c.drawImage(room,0,y,RW,RH);
    c.fillStyle="#8fa6b4"; c.font="12px ui-monospace,monospace"; c.textAlign="left";
    c.fillText(kind[1],4,y-8);
    c.strokeStyle="rgba(120,150,175,.16)"; c.strokeRect(.5,y+.5,RW-1,RH-1);
  });
  try{fetch("/shot?n=cant",{method:"POST",body:cv.toDataURL("image/png")});}catch(e){}
},1500);
</script>
'@
[IO.File]::WriteAllText("$PSScriptRoot\cant.html", $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
