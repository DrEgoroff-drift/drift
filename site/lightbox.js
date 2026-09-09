/* ДРЕЙФ — кадр во весь экран по клику.
 *
 * Общий на весь сайт: страница ничего не объявляет, скрипт сам находит все
 * кадры (`figure img` внутри `.gal`, `.shot`, `.m`) и вешает на них клик.
 * Ничего не подгружается заранее — показывается ТОТ ЖЕ файл, что уже стоит в
 * странице, просто без рамки; поэтому лайтбокс ничего не стоит до первого
 * клика. Стрелки и Esc с клавиатуры, свайп по горизонтали на телефоне,
 * клик по фону — закрыть.
 *
 * Стили лежат в site.css (`.lb`), разметка создаётся здесь: страница, которая
 * забыла добавить <div class="lb">, всё равно получает увеличение. */
(function(){
  const pics=[...document.querySelectorAll(".gal figure img, .shot img, .m figure img")];
  if(!pics.length)return;

  const lb=document.createElement("div");
  lb.className="lb";
  lb.innerHTML='<span class="x">&times;</span>'+
               '<span class="nav prev">&#8249;</span><span class="nav next">&#8250;</span>'+
               '<img alt=""><div class="cap"></div>';
  document.body.appendChild(lb);
  const im=lb.querySelector("img"),cap=lb.querySelector(".cap");

  let at=-1;
  /* подпись собирается из самой карточки: заголовок и текст, как на странице */
  const capOf=el=>{
    const f=el.closest("figure");
    if(!f)return el.alt||"";
    const h=f.querySelector("h3"),
          p=f.querySelector("figcaption p")||f.querySelector("figcaption");
    const t=x=>x?x.textContent.replace(/\s+/g," ").trim():"";
    return [t(h),t(p)].filter(Boolean).join(" — ");
  };
  const show=i=>{
    at=(i+pics.length)%pics.length;
    const el=pics[at];
    im.src=el.currentSrc||el.src;im.alt=el.alt||"";
    cap.textContent=capOf(el);
    lb.classList.add("on");document.body.style.overflow="hidden";
  };
  const hide=()=>{lb.classList.remove("on");document.body.style.overflow="";im.src="";};

  pics.forEach((el,i)=>{el.classList.add("zoomable");el.addEventListener("click",()=>show(i));});
  lb.querySelector(".x").onclick=hide;
  lb.querySelector(".prev").onclick=e=>{e.stopPropagation();show(at-1);};
  lb.querySelector(".next").onclick=e=>{e.stopPropagation();show(at+1);};
  lb.addEventListener("click",e=>{if(e.target===lb||e.target===im||e.target===cap)hide();});
  addEventListener("keydown",e=>{
    if(!lb.classList.contains("on"))return;
    if(e.key==="Escape")hide();
    else if(e.key==="ArrowLeft")show(at-1);
    else if(e.key==="ArrowRight")show(at+1);
  });
  let x0=null;
  lb.addEventListener("touchstart",e=>{x0=e.touches[0].clientX;},{passive:true});
  lb.addEventListener("touchend",e=>{
    if(x0===null)return;
    const dx=e.changedTouches[0].clientX-x0;x0=null;
    if(Math.abs(dx)>50)show(at+(dx<0?1:-1));
  },{passive:true});
})();
