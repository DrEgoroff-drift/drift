/* запуск: после того как игра полностью инициализировалась.
   Останавливаем игровой цикл (G.running=false), чтобы кадры не гоняли состояние
   параллельно тестам, и прячем интро. */
setTimeout(()=>{
  G.running=false;
  const intro=document.getElementById("intro");
  if(intro)intro.style.display="none";
  runTests();
},60);
