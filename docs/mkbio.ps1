# Биология (M174): лист для самокритики — вид, возраст, место, заросль.
#
# Прежние стенды показывали ОДИН кадр поверхности, и по нему нельзя было
# сказать главного: похожи ли два растения одного вида, отличается ли всход от
# старика телом, а не масштабом, и меняет ли сухой гребень то же самое
# растение. Здесь шесть кадров: виды планеты в ряд, возраст в ряд, место в ряд
# и три настоящих кадра игры на трёх мирах.
$src = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot "..\drift.html")
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  G.running=true;
  var cv=document.getElementById("c");
  var PW=650,PH=406;
  var out=document.createElement("canvas");
  out.width=PW*2;out.height=PH*4;
  out.style.cssText="position:fixed;left:0;top:0;z-index:99999;width:"+out.width+"px;height:"+out.height+"px";
  document.body.appendChild(out);
  var oc=out.getContext("2d");
  oc.fillStyle="#05070a";oc.fillRect(0,0,out.width,out.height);

  function setWorld(t,shift){
    var p=G.sys.planets.find(function(x){return x.type!=="gas";})||G.sys.planets[0];
    p.type=t;p.T=TYPES[t]||p.T;p.mix=null;p.mw=null;
    p.rough=Math.min(1.2,p.T.rough);p.res=worldRes(t,null,null);
    delete p.tex;delete p.mat;delete p.strata;delete p.geo;delete p.bio;
    delete p.biome;delete p.flora;delete p.fauna2;delete p.fauna3;delete p.caveFlora;
    p.seed=(p.seed^(0x5A17+shift*15485863))>>>0;
    var tr=genTerrain(p);
    G.land={p:p,tr:tr,x:tr.padX,y:groundAt(tr,tr.padX)};
    enterSurface();
    G.surf.x=tr.W*.5;G.surf.y=groundAt(tr,G.surf.x)-10;
    G.surf.walkAmp=1;G.surf.walkPhase=1.1;
    var period=CEL_DAY*(6+((p.seed>>>7)&3));
    G.t=period*((.30-(p.seed%100)/100+1)%1);   /* утро: свет сбоку, наклон виден */
    return p;
  }
  /* экземпляр с заданным возрастом: возраст бросается внутри specimenPlant,
     поэтому просто перебираем броски, пока не попадём в нужную полосу */
  function aged(sp,p,lo,hi,env,salt){
    for(var k=0;k<3000;k++){
      var s=specimenPlant(rng(salt*7919+k),sp,p,120+salt*37,0,env);
      if(s.age>=lo&&s.age<=hi)return s;
    }
    return specimenPlant(rng(salt),sp,p,120,0,env);
  }
  function begin(){
    ctx.setTransform(cv.width/W,0,0,cv.height/H,0,0);
    ctx.fillStyle="#0d1117";ctx.fillRect(0,0,W,H);
    ctx.fillStyle="#161b22";ctx.fillRect(0,H*.86,W,H*.14);
    ctx.strokeStyle="rgba(160,180,200,.14)";ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(0,H*.86);ctx.lineTo(W,H*.86);ctx.stroke();
  }
  function cap(x,y,s,dim){
    ctx.font="11px ui-monospace,monospace";ctx.textAlign="center";
    ctx.fillStyle=dim?"#5d6b7a":"#9fb3c2";
    ctx.fillText(s,x,y);
  }
  /* ряд из шести клеток: что рисовать — решает f(i) */
  function row(n,f,Z){
    var base=H*.86;
    for(var i=0;i<n;i++){
      var x=W*(i+.5)/n;
      var it=f(i);
      if(!it)continue;
      ctx.save();ctx.translate(x,base);ctx.scale(Z,Z);
      drawPlant(it[0],0,0);
      ctx.restore();
      cap(x,base+18,it[1]);
      if(it[2])cap(x,base+32,it[2],true);
    }
  }

  var frames=[];
  /* 1 — виды планеты: по одному взрослому от каждого вида */
  frames.push(function(){
    var p=setWorld("terran",1);
    begin();
    var fl=floraOf(p);
    row(fl.length,function(i){
      var sp=fl[i];
      return [aged(sp,p,.4,.7,{wet:.6,hollow:.55},i+1),
              sp.name.split(", ")[0],sp.name.split(", ")[1]];
    },fl.length<=3?3.0:2.4);
    return "ВИДЫ ОДНОЙ ПЛАНЕТЫ";
  });
  /* 2 — возраст одного вида: всход → взрослый → старик */
  frames.push(function(){
    var p=setWorld("terran",1);
    begin();
    var fl=floraOf(p);
    var sp=null;
    for(var k=0;k<fl.length;k++)if(plantStemForm(fl[k].kind)&&fl[k].nb>0){sp=fl[k];break;}
    if(!sp)sp=fl[0];
    var bands=[[.02,.12],[.16,.26],[.34,.5],[.6,.78],[.86,.99]];
    var word=["всход","подрост","взрослый","в силе","старый"];
    row(5,function(i){
      var s=aged(sp,p,bands[i][0],bands[i][1],{wet:.6,hollow:.55},i+9);
      return [s,word[i],"рост "+Math.round(s.h)+(s.dead&&s.dead.length?" · сухостой":"")];
    },3.0);
    cap(W*.5,26,sp.name);
    return "ВОЗРАСТ ОДНОГО ВИДА";
  });
  /* 3 — место: тот же вид от сухого гребня до мокрой ложбины */
  frames.push(function(){
    var p=setWorld("terran",1);
    begin();
    var fl=floraOf(p);
    var src=fl[0];
    for(var k=0;k<fl.length;k++)if(plantStemForm(fl[k].kind)){src=fl[k];break;}
    /* показываем влаголюбивый вид: иначе ряд идёт от «хорошо» к «плохо» и
       разницу видно наоборот. Копия — чтобы не портить биосферу планеты */
    var sp={};for(var q in src)sp[q]=src[q];
    sp.wet=1;
    var env=[{wet:0,hollow:0},{wet:.25,hollow:.25},{wet:.5,hollow:.5},
             {wet:.75,hollow:.75},{wet:1,hollow:1}];
    var word=["сухой гребень","склон","ровно","низина","мокрая ложбина"];
    row(5,function(i){
      var s=aged(sp,p,.45,.65,env[i],i+21);
      return [s,word[i],"рост "+Math.round(s.h)+" · ствол "+(Math.round(s.w*10)/10)];
    },3.0);
    cap(W*.5,26,sp.name+" · виду нужна сырость");
    return "ОДИН ВИД, РАЗНЫЕ МЕСТА";
  });
  /* 4..6 — настоящие кадры игры */
  /* 4 — виды зверя той же планеты: архетип, окрас и повадка закреплены */
  frames.push(function(){
    var p=setWorld("terran",1);
    begin();
    var fa=faunaOf(p);
    var base=H*.86, Z=2.6;
    for(var i=0;i<fa.length;i++){
      var sp=fa[i], x=W*(i+.5)/fa.length;
      /* два экземпляра рядом: у стайного вида так и ходят */
      for(var k2=0;k2<2;k2++){
        var b=specimenBeast(rng(i*911+k2*17+5),sp,0,0);
        ctx.save();ctx.translate(x+(k2?38:-38),base);ctx.scale(Z,Z);
        drawBeast(b,0,0,false,0);
        ctx.restore();
      }
      cap(x,base+18,sp.name.split(", ")[0]);
      cap(x,base+32,sp.name.split(", ")[1]+(sp.herd?" · стаей":""),true);
    }
    return "ВИДЫ ЗВЕРЯ ТОЙ ЖЕ ПЛАНЕТЫ";
  });
  /* пустыня без воздуха не родит вовсе (enterSurface: флора там, где есть чем
     дышать) — на лист берём миры, где действительно что-то растёт */
  ["terran","toxic","jungle"].forEach(function(t,k){
    frames.push(function(){
      setWorld(t,3+k);
      for(var f=0;f<6;f++){G.t+=.01;updateSurface(1);drawSurface();}
      return "ЗАРОСЛЬ · "+((TYPES[t]&&TYPES[t].ru||t).toUpperCase());
    });
  });
  /* 8 — ночь: светящиеся виды на своём месте, остальное в тени */
  frames.push(function(){
    var p=setWorld("terran",7);
    var period=CEL_DAY*(6+((p.seed>>>7)&3));
    G.t=period*((.78-(p.seed%100)/100+1)%1);
    for(var f=0;f<6;f++){G.t+=.01;updateSurface(1);drawSurface();}
    return "ЗАРОСЛЬ · ЗЕМЛЕПОДОБНАЯ, НОЧЬ";
  });

  var n=0,tries=0;
  function ready(){
    if((cv.width<2||cv.height<2)&&tries++<20){resize();setTimeout(ready,120);return;}
    shot();
  }
  function shot(){
    if(n>=frames.length){
      try{fetch("/bio.png",{method:"POST",body:out.toDataURL("image/png")});}catch(e){}
      return;
    }
    var title=frames[n]();
    var px=(n%2)*PW, py=Math.floor(n/2)*PH;
    oc.drawImage(cv,0,0,cv.width,cv.height,px,py,PW,PH);
    oc.fillStyle="rgba(0,0,0,.5)";oc.fillRect(px,py,PW,20);
    oc.fillStyle="#9fb3c2";oc.font="11px ui-monospace,monospace";oc.textAlign="left";
    oc.fillText(title,px+8,py+14);
    oc.strokeStyle="rgba(0,0,0,.7)";oc.lineWidth=2;oc.strokeRect(px,py,PW,PH);
    n++;
    setTimeout(shot,300);
  }
  ready();
},1600);
</script>
'@
[IO.File]::WriteAllText((Join-Path $PSScriptRoot "bio.html"), $head + $add + "</body></html>", (New-Object Text.UTF8Encoding $true))
Write-Output "ok"
