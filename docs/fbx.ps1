# Читалка бинарного FBX: достаёт из файла сетку — вершины и полигоны.
#
# Зачем: чужая модель нужна не как геометрия для игры (её туда не вставить),
# а как ЛИНЕЙКА. По ней сверяются пропорции нашей птицы: голова к телу, клюв к
# голове, хвост к росту. Спорить с картинкой на глаз — то же, что мерить на
# глаз; здесь получаются числа.
#
#   powershell -ExecutionPolicy Bypass -File docs\fbx.ps1 -Fbx путь.fbx -Out docs\ref\macaw
#   → docs\ref\macaw-pos.bin (float32 x3) и macaw-idx.bin (int32), плюс сводка
#
# Формат (7400): заголовок 27 байт, дальше дерево записей. У записи —
# смещение конца, число свойств, длина списка свойств, имя. Массивы бывают
# сжаты zlib; DeflateStream не ест двухбайтовый заголовок zlib, поэтому он
# пропускается вручную.
param([Parameter(Mandatory=$true)][string]$Fbx,[string]$Out="docs\ref\mesh")

$ErrorActionPreference="Stop"
trap { "СБОЙ строка " + $_.InvocationInfo.ScriptLineNumber + ": " + $_.Exception.Message; break }
$b=[IO.File]::ReadAllBytes($Fbx)
$ver=[BitConverter]::ToUInt32($b,23)
Write-Output ("FBX версия {0}, файл {1:N0} байт" -f $ver,$b.Length)
$script:best=$null

function Unzip([byte[]]$data,[int]$off,[int]$len){
  # ВНИМАНИЕ: New-Object Type($a,$b,$c) PowerShell разбирает как ОДИН массив,
  # и арифметика внутри скобок уезжает на него целиком. Аргументы считаются
  # заранее и передаются через -ArgumentList — иначе «op_Subtraction на Object[]».
  $o=$off+2; $l=$len-2
  $ms=New-Object IO.MemoryStream -ArgumentList $data,$o,$l
  $ds=New-Object IO.Compression.DeflateStream($ms,[IO.Compression.CompressionMode]::Decompress)
  $out=New-Object IO.MemoryStream
  $ds.CopyTo($out); $ds.Close()
  return $out.ToArray()
}
function ReadArray([byte[]]$b,[int]$p,[char]$type){
  $len=[BitConverter]::ToUInt32($b,$p)
  $enc=[BitConverter]::ToUInt32($b,$p+4)
  $clen=[BitConverter]::ToUInt32($b,$p+8)
  $data=if($enc -eq 1){ Unzip $b ($p+12) $clen } else { $raw=New-Object byte[] $clen; [Array]::Copy($b,$p+12,$raw,0,$clen); $raw }
  return @{len=$len; data=$data; next=$p+12+$clen}
}
# один проход по дереву; в узлы Geometry заходим, остальные перепрыгиваем
function Walk([int]$p,[int]$end,[string]$parent){
  while($p -lt $end){
    $endOff=[BitConverter]::ToUInt32($b,$p)
    if($endOff -eq 0){ return $p+13 }
    $nprop=[BitConverter]::ToUInt32($b,$p+4)
    $plen=[BitConverter]::ToUInt32($b,$p+8)
    $nlen=$b[$p+12]
    $name=[Text.Encoding]::ASCII.GetString($b,$p+13,$nlen)
    $pp=$p+13+$nlen
    $propsEnd=$pp+$plen
    if(($name -eq "Vertices" -or $name -eq "PolygonVertexIndex") -and $parent -eq "Geometry"){
      $t=[char]$b[$pp]
      $a=ReadArray $b ($pp+1) $t
      if($name -eq "Vertices"){
        if($null -eq $script:best -or $a.len -gt $script:best.vlen){
          $script:best=@{vlen=$a.len; vdata=$a.data; ilen=0; idata=$null}
        }
      } elseif($null -ne $script:best -and $script:best.ilen -eq 0){
        $script:best.ilen=$a.len; $script:best.idata=$a.data
      }
    }
    # внутрь заходим только там, где может лежать геометрия
    if($propsEnd -lt $endOff){
      $childParent=if($name -eq "Geometry"){"Geometry"}else{$parent}
      [void](Walk $propsEnd $endOff $childParent)
    }
    $p=$endOff
  }
  return $p
}
[void](Walk 27 $b.Length "")
if($null -eq $script:best){ throw "в файле не нашлось ни одной сетки" }
$V=$script:best.vlen/3
Write-Output ("сетка: {0:N0} вершин, {1:N0} индексов" -f $V,$script:best.ilen)

# Вершины пишутся КАК ЕСТЬ — сырыми double. Поэлементный перевод в float32
# средствами PowerShell на трёх миллионах чисел идёт минутами; читателю
# (Float64Array в браузере) исходный формат безразличен.
[IO.File]::WriteAllBytes("$Out-pos64.bin",$script:best.vdata)
[IO.File]::WriteAllBytes("$Out-idx.bin",$script:best.idata)

# Для стенда — прорежённое облако точек во float32: пропорции по нему видно
# ровно так же, а весит оно меньше мегабайта.
$step=[math]::Max(1,[math]::Floor($V/50000))
$cnt=[math]::Floor($V/$step)
$pt=New-Object byte[] ($cnt*12)
for($i=0;$i -lt $cnt;$i++){
  for($k=0;$k -lt 3;$k++){
    $d=[BitConverter]::ToDouble($script:best.vdata,(($i*$step)*3+$k)*8)
    [BitConverter]::GetBytes([float]$d).CopyTo($pt,($i*3+$k)*4)
  }
}
[IO.File]::WriteAllBytes("$Out-cloud.bin",$pt)
Write-Output ("облако: {0:N0} точек, шаг {1}" -f $cnt,$step)

# габарит: сразу видно, как модель стоит и что с чем мерить
$mn=@([double]::MaxValue,[double]::MaxValue,[double]::MaxValue)
$mx=@([double]::MinValue,[double]::MinValue,[double]::MinValue)
for($i=0;$i -lt $cnt;$i++){
  for($k=0;$k -lt 3;$k++){
    $v=[BitConverter]::ToSingle($pt,($i*3+$k)*4)
    if($v -lt $mn[$k]){$mn[$k]=$v}
    if($v -gt $mx[$k]){$mx[$k]=$v}
  }
}
Write-Output ("габарит X {0:N3}..{1:N3}  Y {2:N3}..{3:N3}  Z {4:N3}..{5:N3}" -f $mn[0],$mx[0],$mn[1],$mx[1],$mn[2],$mx[2])
Write-Output ("размеры: {0:N3} x {1:N3} x {2:N3}" -f ($mx[0]-$mn[0]),($mx[1]-$mn[1]),($mx[2]-$mn[2]))
