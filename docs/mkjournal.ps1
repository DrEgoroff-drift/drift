# Журнал с делами: поручение, пленный, фронт.
$src = Get-Content -Raw -Encoding UTF8 "$PSScriptRoot\..\drift.html"
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  G.running=true; G.credits=1e6; G.quests=[];
  questAdd("j1",{ru:"Догнать конвой",kind:"job",from:"Нидраат · фактор",
    note:"— Наш борт увели прямо с плеча. Догоните, пока он не ушёл за границу сектора.",
    sx:3,sy:-2,until:Date.now()+7*60000,reward:"часть груза и его лояльность"});
  questAdd("j2",{ru:"Выкупить или отбить: Тиомара",kind:"crew",from:"звено",
    note:"её держат пираты. Выкуп растёт, пока тянете; штурм базы в том же секторе освобождает даром",
    sx:-4,sy:5,reward:"человек вернётся в звено"});
  questAdd("j3",{ru:"Отбить «Мелпиат»",kind:"occ",from:"фронт",
    note:"док и лаборатория закрыты, дроны не сдают. Считаются сбитые в этой системе",
    sx:6,sy:4,reward:"станция снова заработает, призовые за освобождение"});
  questAdd("j4",{ru:"Найти образец ксеноархива",kind:"job",from:"кантина «Нейэль»",
    note:"— Где именно он лежит, никто не знает. Спросите на дальних станциях.",
    reward:"чертёж, которого нет в продаже"});
  logAdd("money","Продано 40 иридия · +2 960 кр");
  logAdd("kill","Пират «Гриф» уничтожен · +410 кр");
  toggleLog(true);
},1400);
</script>
'@
[IO.File]::WriteAllText("$PSScriptRoot\journal.html", $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
