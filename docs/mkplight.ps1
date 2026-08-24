# Свет планет (M175): откуда падает свет на диск в системном виде.
#
# Вектор света был зашит в выпечку константой — все планеты системы освещались
# из верхнего левого угла, где бы ни стояло светило. Здесь шесть планет по
# кольцу вокруг звезды: терминатор обязан смотреть от звезды у каждой, и это
# видно с одного взгляда. Второй кадр — настоящий системный вид.
$src = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot "..\drift.html")
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  G.running=true;
  var cv=document.getElementById("c");
  var PW=760,PH=475;
  var out=document.createElement("canvas");
  out.width=PW;out.height=PH*2;
  out.style.cssText="position:fixed;left:0;top:0;z-index:99999;width:"+out.width+"px;height:"+out.height+"px";
  document.body.appendChild(out);
  var oc=out.getContext("2d");
  oc.fillStyle="#05070a";oc.fillRect(0,0,out.width,out.height);

  var frames=[];
  /* 1 — кольцо планет вокруг нарисованной звезды */
  frames.push(function(){
    ctx.setTransform(cv.width/W,0,0,cv.height/H,0,0);
    ctx.fillStyle="#06080e";ctx.fillRect(0,0,W,H);
    var cx=W*.5, cy=H*.5, R=Math.min(W,H)*.34;
    /* звезда */
    var g=ctx.createRadialGradient(cx,cy,0,cx,cy,90);
    g.addColorStop(0,"rgba(255,240,200,1)");g.addColorStop(.22,"rgba(255,206,120,.9)");
    g.addColorStop(1,"rgba(255,180,80,0)");
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,90,0,TAU);ctx.fill();
    var sys=G.sys, N=6;
    for(var k=0;k<N;k++){
      var a=k/N*TAU-Math.PI*.5;
      var p=sys.planets[k%sys.planets.length];
      /* копия планеты со своим местом на орбите: своя выпечка не трогается */
      var q={};for(var f in p)q[f]=p[f];
      q.x=Math.cos(a)*1000;q.y=Math.sin(a)*1000;
      q.disc=null;q.discTurn=null;q.lite=null;q.strip=null;q.stripLvl=null;q.tex=null;
      planetDraw(q,cx+Math.cos(a)*R,cy+Math.sin(a)*R,46);
      /* черта на звезду: свет обязан приходить вдоль неё */
      ctx.strokeStyle="rgba(140,190,220,.22)";ctx.lineWidth=1;
      ctx.beginPath();
      ctx.moveTo(cx+Math.cos(a)*(R-52),cy+Math.sin(a)*(R-52));
      ctx.lineTo(cx+Math.cos(a)*(R+52),cy+Math.sin(a)*(R+52));
      ctx.stroke();
    }
    ctx.fillStyle="#9fb3c2";ctx.font="11px ui-monospace,monospace";ctx.textAlign="center";
    ctx.fillText("тонкая черта — направление на звезду; тень обязана лежать по её дальнюю сторону",cx,H-24);
    return "ШЕСТЬ ПЛАНЕТ ВОКРУГ ОДНОЙ ЗВЕЗДЫ";
  });
  /* 2 — настоящий системный вид */
  frames.push(function(){
    G.mode="system";
    G.zoom=.34;
    for(var f=0;f<4;f++){G.t+=.02;drawSystem();}
    return "СИСТЕМНЫЙ ВИД, КАК ЕГО ВИДИТ ИГРОК";
  });

  var n=0,tries=0;
  function ready(){
    if((cv.width<2||cv.height<2)&&tries++<20){resize();setTimeout(ready,120);return;}
    shot();
  }
  function shot(){
    if(n>=frames.length){
      try{fetch("/plight.png",{method:"POST",body:out.toDataURL("image/png")});}catch(e){}
      return;
    }
    var title=frames[n]();
    oc.drawImage(cv,0,0,cv.width,cv.height,0,n*PH,PW,PH);
    oc.fillStyle="rgba(0,0,0,.5)";oc.fillRect(0,n*PH,PW,20);
    oc.fillStyle="#9fb3c2";oc.font="11px ui-monospace,monospace";oc.textAlign="left";
    oc.fillText(title,8,n*PH+14);
    oc.strokeStyle="rgba(0,0,0,.7)";oc.lineWidth=2;oc.strokeRect(0,n*PH,PW,PH);
    n++;
    setTimeout(shot,400);
  }
  ready();
},1600);
</script>
'@
[IO.File]::WriteAllText((Join-Path $PSScriptRoot "plight.html"), $head + $add + "</body></html>", (New-Object Text.UTF8Encoding $true))
Write-Output "ok"
