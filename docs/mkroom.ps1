# Отсеки базы крупным планом: восемь типов в сетке, по 3×.
#
# На общем разрезе (mkbase.ps1) комната — полтораста пикселей, и внутри её не
# разглядеть. Интерьер при этом самое дорогое место экрана: игрок сидит в базе
# подолгу и смотрит именно внутрь. Здесь каждый отсек нарисован крупно, чтобы
# было видно, что в нём мебель, а что мусор.
$src = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot "..\drift.html")
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  G.running=false;
  var keys=Object.keys(BUILD);
  var SC=3, CW=BCELL_W*SC, CH=BCELL_H*SC;
  var COLS=2, W2=CW*COLS+40, H2=CH*Math.ceil(keys.length/COLS)+40*Math.ceil(keys.length/COLS);
  var dpr=2;
  var cv=document.createElement("canvas");cv.width=W2*dpr;cv.height=H2*dpr;
  cv.style.cssText="position:fixed;left:0;top:0;z-index:99999;width:"+W2+"px;height:"+H2+"px";
  document.body.appendChild(cv);
  var c=cv.getContext("2d");c.setTransform(dpr,0,0,dpr,0,0);
  c.fillStyle="#05070a";c.fillRect(0,0,W2,H2);
  // живая база со штатом: людей рисуем ровно столько, сколько нанято
  var p=G.sys.planets.find(function(x){return x.type!=="gas";})||G.sys.planets[0];
  var cells=[];for(var q=0;q<BASE_COLS*BASE_ROWS;q++)cells.push(null);
  cells[2]={k:"reactor",hp:1};
  G.bases[baseKey(G.sx,G.sy,p.idx)]={sx:G.sx,sy:G.sy,idx:p.idx,name:p.name,type:p.type,
    res:p.res.slice(0,3),cells:cells,pool:{},tMs:Date.now(),built:Date.now()};
  var B=G.bases[baseKey(G.sx,G.sy,p.idx)];
  for(var q=0;q<8;q++){var cw=genMerc(hashi(q*77+13,5,3));
    cw.order={kind:"base",sx:G.sx,sy:G.sy,idx:p.idx};G.crew.push(cw);}
  var old=ctx;ctx=c;
  keys.forEach(function(k,n){
    var cx=(n%COLS)*CW+20, cy=((n/COLS)|0)*(CH+40)+30;
    c.save();c.translate(cx,cy);c.scale(SC,SC);
    drawModule(k,0,0,.95,n%BASE_COLS,(n/BASE_COLS)|0,B);
    c.restore();
    c.fillStyle="#8fa6b4";c.font="12px ui-monospace,monospace";c.textAlign="left";
    c.fillText(BUILD[k].ru.toUpperCase(),cx,cy-8);
    c.strokeStyle="rgba(120,150,175,.12)";c.strokeRect(cx+.5,cy+.5,CW-1,CH-1);
  });
  ctx=old;
  try{fetch("/base-rooms.png",{method:"POST",body:cv.toDataURL("image/png")});}catch(e){}
},1600);
</script>
'@
[IO.File]::WriteAllText((Join-Path $PSScriptRoot "rooms.html"), $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
