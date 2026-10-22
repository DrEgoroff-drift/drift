/* ── метка системы не ложится на строку подсказки (rooms-a, кадр 1600, 22.10):
   плашка «Звезда · 1139» ехала к новому слоту со скоростью CHIP_SPEED и в пути лежала
   на «СТАНЦИЯ «КВАДРАТ» · ЖЕЛЕЗНАЯ ДОРОГА». Ставим каждую фишку прямо на строку (как
   будто она туда ещё едет), зажигаем подсказку и меряем: плашки (SYS_CHIPS.pl, пиксели
   холста) не пересекают #prompt ни в одном кадре. Окно — какое дал test.ps1: 1600 —
   `-Size 1600,900`, 390 — `-Mobile` ── */
TEST_SUITES.push(()=>suite("метка системы не ложится на подсказку",{tier:"browser"},()=>{
  resetWorld();T.go("старт");G.mode="system";
  const pe=promptEl();ok(!!pe,"есть #prompt");if(!pe)return;
  const was=pe.textContent,wasD=pe.style.display;
  const k=W/innerWidth,U=(typeof UIK==="number"&&UIK>0)?UIK:1;
  const hit=(a,b)=>!(a[0]+a[2]<=b[0]||b[0]+b[2]<=a[0]||a[1]+a[3]<=b[1]||b[1]+b[3]<=a[1]);
  try{
    T.wait(30);   /* фишки встали на свои слоты без подсказки */
    ok(CHIP_POS.size>0,"фишки есть: "+CHIP_POS.size);
    pe.textContent="СТАНЦИЯ «КВАДРАТ» · ЖЕЛЕЗНАЯ ДОРОГА\nДЕЙСТВИЕ — СТЫКОВКА";pe.style.display="block";
    rectsDirty();
    const r=promptRect();ok(!!r&&r.height>0,"подсказка на экране");if(!r||!r.height)return;
    /* каждая фишка — посреди строки подсказки, в пути к своему слоту */
    for(const st of CHIP_POS.values()){st.x=r.left/U+4;st.y=r.top/U+2;st.px=st.x;st.py=st.y;st.jf=null;st.fading=false;}
    const P=[r.left*k,r.top*k,r.width*k,r.height*k];
    let bad=0,seen=0,worst="";
    for(let f=0;f<40;f++){
      pe.textContent=pe.textContent;   /* подсказку держит тест, не кадр */
      T.wait(1);
      for(const c of SYS_CHIPS){if(!c.pl)continue;seen++;if(hit(c.pl,P)){bad++;if(!worst)worst=c.l+" ["+c.pl.map(v=>v.toFixed(0))+"] кадр "+f;}}
    }
    ok(seen>0,"фишки рисовались: "+seen+" плашек за 40 кадров, окно "+innerWidth+"×"+innerHeight);
    eq(bad,0,"плашка на подсказке ["+P.map(v=>v.toFixed(0))+"]: "+(worst||"нет"));
  }finally{pe.textContent=was;pe.style.display=wasD;rectsDirty();CHIP_POS.clear();}
}));
