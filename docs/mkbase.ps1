# База в разрезе: снимок экрана `base` целиком.
#
# Пункт очереди M55 — «`scoop` и `base` до сих пор на старой графике». Чтобы
# это чинить, нужно сначала увидеть: база — экран, на котором игрок сидит
# подолгу, и смотреть на него надо целиком, а не через живое окно игры.
$src = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot "..\drift.html")
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  G.running=true;
  // база с полным набором отсеков: пустая сетка ничего не говорит о графике.
  // Ключ и формат клеток — как в 21a-mode-base: плоский массив BASE_COLS*ROWS
  var p=G.sys.planets.find(function(x){return x.type!=="gas";})||G.sys.planets[0];
  var kinds=Object.keys(BUILD);
  var cells=[];
  for(var i=0;i<BASE_COLS*BASE_ROWS;i++)cells.push(null);
  for(var i=0;i<cells.length;i++)
    if((i*7)%11<8)cells[i]={k:kinds[i%kinds.length],hp:1};
  G.bases[baseKey(G.sx,G.sy,p.idx)]={sx:G.sx,sy:G.sy,idx:p.idx,name:p.name,type:p.type,
    res:p.res.slice(0,3),cells:cells,pool:{},tMs:Date.now(),built:Date.now()};
  // на стенде нужен штат: людей ровно столько, сколько нанято, и пустая база
  // остаётся пустой — поэтому для снимка нанимаем смену
  for(var q=0;q<8;q++){var cw=genMerc(hashi(q*77+13,5,3));cw.order={kind:"base",sx:G.sx,sy:G.sy,idx:p.idx};G.crew.push(cw);}
  enterBase(p);
  setTimeout(function(){
    for(var f=0;f<3;f++)frame(performance.now()+f*16);
    var cv=document.getElementById("c");
    try{fetch("/base.png",{method:"POST",body:cv.toDataURL("image/png")});}catch(e){}
  },1200);
},1500);
</script>
'@
[IO.File]::WriteAllText((Join-Path $PSScriptRoot "base.html"), $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
