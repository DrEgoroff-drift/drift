/* ══════════════ страница вокруг птицы ══════════════
   Правило одно: птица главная. Всё остальное — мелкий шрифт у кромки, гаснет
   само и не спорит с ней ни цветом, ни размером.

   ТРИ ВЕЩИ, которые человек должен понять без объяснений: птицу можно
   покрутить, её можно потрогать, её можно забрать себе. Первые две объясняет
   одна строка, которая исчезает после первого прикосновения. Третью —
   единственная кнопка. */
const UI={hinted:false,idle:0,prompt:null};

function uiInit(){
  const Q=new URLSearchParams(location.search);
  /* режим «только птица»: установленное окно, ни одной подписи */
  if(Q.has("pet"))document.body.classList.add("pet");

  /* установка. Кнопка появляется, только если браузер и вправду готов
     поставить — обещать то, чего не будет, нельзя */
  const btn=document.getElementById("install");
  addEventListener("beforeinstallprompt",e=>{
    e.preventDefault();UI.prompt=e;
    if(btn)btn.style.display="";
  });
  if(btn)btn.addEventListener("click",async()=>{
    if(!UI.prompt)return;
    UI.prompt.prompt();
    await UI.prompt.userChoice;
    UI.prompt=null;btn.style.display="none";
  });
  /* «забрать файлом»: страница и есть птица, поэтому качается она сама */
  const dl=document.getElementById("grab");
  if(dl){
    dl.href=location.pathname;
    dl.setAttribute("download","треплo-3d.html");
  }
  const about=document.getElementById("aboutBtn"),box=document.getElementById("about");
  if(about&&box)about.addEventListener("click",()=>box.classList.toggle("on"));

  /* работает без сети: иначе «поставил на стол» — это ярлык на страницу,
     которая однажды не откроется. На file:// работника нет и не надо. */
  if("serviceWorker" in navigator&&location.protocol.startsWith("http"))
    navigator.serviceWorker.register("/treplo3d-sw.js").catch(()=>{});
}
/* подсказка гаснет, как только птицу потрогали или покрутили */
function uiTouched(){
  if(UI.hinted)return;
  UI.hinted=true;
  const h=document.getElementById("hint");
  if(h)h.classList.add("gone");
}
