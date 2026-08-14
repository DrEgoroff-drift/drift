# Лист зарубок: шесть камней по шести семенам, крупно и рядом.
#
# Зарубка обязана читаться СВОЕЙ на фоне монолита и отличаться от соседней
# зарубки: разная ширина, наклон, скол вершины — и, главное, разный счёт на
# грани. Шесть штук в ряд — единственный способ увидеть глазами, что счёт
# не превратился в обои. Седьмая клетка — монолит для сравнения языка.
$src = Get-Content -Raw -Encoding UTF8 "$PSScriptRoot\..\drift.html"
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  G.running=false;
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  var seeds=[0x1111,0x2f7a,0x51c3,0x9004,0xbeef,0xd13a];
  var CELL=190,W2=CELL*(seeds.length+1),H2=340,dpr=2;
  var cv=document.createElement("canvas");
  cv.width=W2*dpr;cv.height=H2*dpr;
  cv.style.cssText="position:fixed;left:0;top:0;width:"+W2+"px;height:"+H2+"px;z-index:99999;background:#151109";
  document.body.appendChild(cv);
  var c=cv.getContext("2d");c.setTransform(dpr,0,0,dpr,0,0);
  var old=ctx;ctx=c;
  /* палитра грунта — как у каменистой планеты: камень должен читаться породой,
     а не силуэтом-дырой, и это проверяется только на цветном грунте */
  var pal=[[46,38,30],[78,64,48],[112,94,70],[168,148,116]];
  var mix=function(a,b){return Math.round(a+(b-a)*.22);};
  function cellDraw(n,seed,kind){
    var q={k:kind,seed:seed,h:210,x:0,y:0};
    var dark="rgb("+[mix(28,pal[0][0]),mix(30,pal[0][1]),mix(36,pal[0][2])].join(",")+")";
    var lite="rgb("+[mix(150,pal[3][0]),mix(158,pal[3][1]),mix(168,pal[3][2])].join(",")+")";
    c.save();
    c.strokeStyle="rgba(120,150,175,.12)";c.strokeRect(n*CELL+.5,.5,CELL-1,H2-1);
    /* линия грунта: без неё не видно, стоит камень или висит */
    c.strokeStyle="rgba(180,160,120,.20)";
    c.beginPath();c.moveTo(n*CELL+8,H2-52.5);c.lineTo(n*CELL+CELL-8,H2-52.5);c.stroke();
    c.translate(n*CELL+CELL/2,H2-52);
    POI_SEED=seed;POI_MAT=null;POI_OX=0;POI_OY=0;
    var rr=rng(seed);
    if(kind==="obelisk")drawObelisk(q,rr,dark,lite,pal);
    else drawMonolith(q,rr,dark,lite,pal);
    c.restore();
    c.font="10px ui-monospace,monospace";c.textAlign="center";
    c.fillStyle=kind==="obelisk"?"#cfe3ea":"#8fa6b4";
    c.fillText(kind==="obelisk"?("ЗАРУБКА "+seed.toString(16)):"МОНОЛИТ",
      n*CELL+CELL/2,H2-18);
  }
  seeds.forEach(function(s,n){cellDraw(n,s,"obelisk");});
  cellDraw(seeds.length,0x7777,"monolith");
  ctx=old;
},1400);
</script>
'@
[IO.File]::WriteAllText("$PSScriptRoot\stone.html", $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
