# Чужой след (M171): двенадцать фигур подряд и знак, лежащий на грунте.
#
# Смотреть надо два разных вопроса. Первый — читается ли фигура как ВЫРЕЗАННАЯ
# РУКОЙ, а не как иконка: для этого они стоят рядом крупно. Второй — виден ли
# знак на настоящем кадре поверхности с той дистанции, с которой игрок идёт
# мимо: для этого два мира с человеком в кадре и без приближения.
$src = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot "..\drift.html")
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  G.running=true;
  var RW=1280,RH1=210,RH=300,worlds=["terran","desert"];
  var out=document.createElement("canvas");
  out.width=RW;out.height=RH1+RH*worlds.length;
  out.style.cssText="position:fixed;left:0;top:0;z-index:99999;width:"+RW+"px;height:"+out.height+"px";
  document.body.appendChild(out);
  var oc=out.getContext("2d");
  oc.fillStyle="#0b0e12";oc.fillRect(0,0,RW,out.height);
  var cv=document.getElementById("c"),n=0,tries=0;
  /* ── лист первый: словарь руки ── рисуется той же рукой, что и в игре,
     то есть через ctx игровой канвы, и уже оттуда переносится на лист */
  function sheetMarks(){
    var sc=W/RW;
    ctx.save();
    ctx.fillStyle="#0b0e12";ctx.fillRect(0,0,W,RH1*sc);
    ctx.fillStyle="#7f8c99";ctx.font=(12*sc)+"px ui-monospace,monospace";ctx.textAlign="left";
    ctx.fillText("ДВЕНАДЦАТЬ ФИГУР · ЗНАЧЕНИЯ НЕТ НИ У ОДНОЙ",12*sc,20*sc);
    for(var k=0;k<TRACE_MARK.length;k++){
      var cx=(68+(k%6)*206)*sc, cy=(k<6?86:158)*sc;
      ctx.save();ctx.translate(cx,cy);
      traceDrawMark(k,22*sc,"rgba(214,226,236,.92)",2.6*sc);
      ctx.restore();
      ctx.fillStyle="#6d7a86";ctx.font=(11*sc)+"px ui-monospace,monospace";ctx.textAlign="center";
      ctx.fillText(TRACE_MARK[k].ru.toUpperCase(),cx,cy+40*sc);
    }
    ctx.restore();
    oc.drawImage(cv,0,0,cv.width,cv.height*(RH1*sc/H),0,0,RW,RH1);
  }
  function ready(){
    if((cv.width<2||cv.height<2)&&tries++<20){resize();setTimeout(ready,120);return;}
    sheetMarks();shot();
  }
  function shot(){
    if(n>=worlds.length){
      try{fetch("/trace.png",{method:"POST",body:out.toDataURL("image/png")});}catch(e){}
      return;
    }
    var t=worlds[n];
    var p=G.sys.planets.find(function(x){return x.type!=="gas";})||G.sys.planets[0];
    p.type=t;p.T=TYPES[t]||p.T;p.mix=null;p.mw=null;
    p.rough=Math.min(1.2,p.T.rough);p.res=worldRes(t,null,null);
    delete p.tex;delete p.mat;delete p.strata;delete p.geo;delete p.bio;
    p.seed=(p.seed^0x2200+n*104729)>>>0;
    var tr=genTerrain(p);
    G.land={p:p,tr:tr,x:tr.padX,y:groundAt(tr,tr.padX)};
    enterSurface();
    G.surf.x=tr.W*.5;G.surf.y=groundAt(tr,G.surf.x)-10;
    /* знак лежит в трёх шагах от человека: так его и встречают */
    G.surf.trace={key:"0,0/1",i:"stand",m:(n===0?0:8),h:"abcdef",r:(n===0?"titan":"organics"),n:5,
                  x:G.surf.x+54};
    for(var f=0;f<4;f++){G.t+=6;updateSurface(1);drawSurface();}
    var yt=RH1+n*RH, k=cv.width/W;
    /* слева — как идёшь мимо, справа — крупно: два разных вопроса к одной вещи */
    oc.drawImage(cv,cv.width*.30,cv.height*.46,cv.width*.40,cv.height*.42,0,yt,860,RH);
    var tx=(G.surf.trace.x-G.viewX)*k, ty=(groundAt(tr,G.surf.trace.x)-G.viewY)*k, cw=132*k;
    oc.drawImage(cv,tx-cw*.42,ty-cw*.42,cw,cw*(RH/420),860,yt,420,RH);
    oc.fillStyle="#9fb3c2";oc.font="12px ui-monospace,monospace";oc.textAlign="left";
    oc.fillText((TYPES[t]&&TYPES[t].ru||t).toUpperCase()+" · ЗНАК В ТРЁХ ШАГАХ",10,yt+18);
    oc.fillText("КРУПНО ×3",870,yt+18);
    oc.strokeStyle="rgba(0,0,0,.6)";oc.lineWidth=2;oc.strokeRect(860,yt,420,RH);
    n++;
    setTimeout(shot,260);
  }
  ready();
},1600);
</script>
'@
[IO.File]::WriteAllText((Join-Path $PSScriptRoot "trace.html"), $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
