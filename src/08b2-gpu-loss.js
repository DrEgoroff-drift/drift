/* ══════════════ отказ видеокарты: потеря, сбой кадра, нет WebGPU (DESIGN-gpu §G) ══════════════
   Устройство роняет только настоящая беда видеокарты: lost или исключение самого API (DOMException).
   Ошибка JS в сборке кадра — это сбой кадра, его ловит и называет страж (28-loop «СБОЙ · …»):
   иначе один бросок художника приборов гасил видеокарту на 1.5 с и бросал устройство целиком. */
/* нет WebGPU — говорим прямо, какой браузер нужен (игрок видит это вместо мира) */
function gpuNone(why){
  GPU.none=true;GPU_PIPES.done=true;GPU_PIPES.open();
  try{crashShip("gpu","нет WebGPU: "+why,"");}catch(_){}
  if(typeof document==="undefined"||!document.body||document.getElementById("nogpu"))return;
  const d=document.createElement("div");d.id="nogpu";
  if(GPU.frameNo>0){d.innerHTML="<b>Видеокарта перестала отвечать</b><s>Мир рисует видеокарта, и после сбоя она не поднялась. Перезагрузите страницу — запись цела.</s>";document.body.appendChild(d);return;}
  d.innerHTML="<b>Этому браузеру не хватает WebGPU</b><s>«Дрейф» рисует мир видеокартой. Подойдут свежие Chrome, Edge, Яндекс Браузер и Opera, Safari 26 и новее.</s>";
  document.body.appendChild(d);
}
/* устройство потеряно (сон телефона, сброс драйвера): кадр ждёт, ядро поднимается заново */
function gpuDrop(why,retry){
  GPU.ok=false;GPU.on=false;GPU.lost=true;GPU.enc=null;GPU.scenePass=null;
  /* устройство, брошенное без destroy(), держит кадровые цели и печи до сборщика мусора — сносим сразу
     (у потерянного это пустой вызов; lost с причиной destroyed обработчик gpuInit пропускает) */
  try{if(GPU.dev)GPU.dev.destroy();}catch(_){}
  try{crashShip("gpu",why,"");}catch(_){}
  if(retry)setTimeout(()=>{GPU.lost=false;GPU.dev=null;gpuInit();},1500);
}
/* сборка или показ кадра бросили: беда устройства — ронять и поднимать; иначе кадр бросается
   без отправки, а исключение уходит стражу кадра */
function gpuFail(e,where){
  if(GPU.lost||(typeof DOMException!=="undefined"&&e instanceof DOMException)){gpuDrop(where+": "+((e&&e.message)||e),true);return;}
  GPU.scenePass=null;GPU.overPass=null;GPU.enc=null;GPU.on=false;
  throw e;
}
