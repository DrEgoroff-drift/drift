# Дом (M170): снаружи на планете и изнутри, по комнатам.
#
# Дом растёт восемью ступенями, и смотреть на него надо так же, как на посёлок:
# несколько состояний подряд, крупно. Ряды: двор при дневном свете, двор ночью,
# полный дом изнутри (все восемь комнат в одном кадре не помещаются — камера
# стоит на середине), и бедный дом из двух комнат, чтобы видеть, что пустое
# место справа читается как «ещё не построено», а не как ошибка.
$src = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot "..\drift.html")
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  G.running=false;
  /* дом заводим здесь же: ступень восьмая, чтобы видеть всё владение.
     resetWorld живёт только в тестовой сборке — стенд строится из игры */
  G.home=homeInit();G.home.tier=8;G.home.sx=G.sx;G.home.sy=G.sy;
  G.home.trophies=[{k:"a"},{k:"b"},{k:"c"},{k:"d"}];
  G.owned=G.owned||{};G.owned["skat"]=1;G.home.garage=["skat"];
  /* жильцы: Вега на борту, домочадец и пара из экипажа — иначе дом пустой */
  G.vega={stage:2,aboard:1,att:0,mood:1,offend:-1,calls:0,said:0};
  G.crew=[{name:genName(rng(11)),role:"pilot"},{name:genName(rng(22)),role:"tech"}];
  var p=null;
  for(var q=0;q<G.sys.planets.length;q++)if(G.sys.planets[q].type!=="gas"){p=G.sys.planets[q];break;}
  if(!p){console.log("нет твёрдой планеты");return;}
  startLanding(p);enterSurface();
  var S=G.surf,tr=S.tr;
  var rows=[["THE YARD, DAY",0],["THE YARD, NIGHT",1],["INSIDE, FULL HOUSE",2],["INSIDE, TWO ROOMS",3]];
  var K=1.6, CW=Math.round(W/K), CH=Math.round(H*.62);
  var dpr=2, W2=CW*K, H2=(CH*K+30)*rows.length;
  var cv=document.createElement("canvas");cv.width=W2*dpr;cv.height=H2*dpr;
  var c=cv.getContext("2d");c.scale(dpr,dpr);
  c.fillStyle="#05070c";c.fillRect(0,0,W2,H2);
  var live=document.getElementById("c");
  var t0=G.t;
  rows.forEach(function(row,n){
    G.t=row[1]===1?t0+CEL_DAY*(3+((p.seed>>>7)&3))*.5:t0;
    if(row[1]<=1){
      G.mode="surface";
      var hx=homeDoorX(tr,p);
      S.x=hx+40;S.y=groundAt(tr,S.x)-10;S.on=true;
      S.cam={x:hx,y:groundAt(tr,hx)-10};
      drawSurface();
    }else{
      G.home.tier=row[1]===3?2:8;
      enterHomeIn();
      /* хозяин встаёт там, где живут: иначе камера снимает пустые комнаты */
      var st=hinRooms().find(function(v){return v.key==="garage";});
      G.hin.x=row[1]===3?90:(st?st.x+st.w*.5:hinWidth()*.5);
      for(var f=0;f<40;f++){hinFolkTick(1);}
      /* камера доезжает сама: сглаживание в drawHomeIn, поэтому кадров надо
         несколько — иначе снимаем дом, пока камера ещё в пути */
      for(var f2=0;f2<24;f2++)drawHomeIn();
    }
    var sy0=row[1]<=1?Math.max(0,Math.min(H-CH,H*.5-CH*.42)):Math.max(0,Math.min(H-CH,H-CH));
    var cy=n*(CH*K+30)+24;
    c.drawImage(live,Math.max(0,(W-CW)/2),sy0,CW,CH,0,cy,CW*K,CH*K);
    c.fillStyle="#8fa6b4";c.font="12px ui-monospace,monospace";c.textAlign="left";
    c.fillText(row[0],4,cy-8);
    c.strokeStyle="rgba(120,150,175,.14)";c.strokeRect(.5,cy+.5,W2-1,CH*K-1);
  });
  G.t=t0;
  try{fetch("/shot?n=homein",{method:"POST",body:cv.toDataURL("image/png")});}catch(e){}
},1600);
</script>
'@
[IO.File]::WriteAllText((Join-Path $PSScriptRoot "homein.html"), $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
