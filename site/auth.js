/* ДРЕЙФ — вход и регистрация. Один файл на все страницы сайта.
 *
 * Токен кладётся в localStorage того же домена, что и игра, поэтому игра
 * подхватывает его сама — передавать между страницами ничего не нужно.
 * Разметку окна страница даёт свою (см. #veil), здесь только поведение.
 */
(function(){
  const API="/api.php", TKEY="drift_token", LKEY="drift_login";
  const $=s=>document.querySelector(s);
  if(!$("#veil"))return;

  const tok=()=>{try{return localStorage.getItem(TKEY)||""}catch(e){return""}};
  const name=()=>{try{return localStorage.getItem(LKEY)||""}catch(e){return""}};
  const setAcc=(t,l)=>{try{t?(localStorage.setItem(TKEY,t),localStorage.setItem(LKEY,l))
    :(localStorage.removeItem(TKEY),localStorage.removeItem(LKEY))}catch(e){}};

  function call(action,payload,withTok){
    const h={"Content-Type":"application/json"};
    if(withTok)h["X-Drift-Token"]=tok();
    return fetch(API+"?a="+action,{method:"POST",headers:h,
      body:JSON.stringify(payload||{})}).then(r=>r.json());
  }

  let mode="login";
  function open(m){
    mode=m; $("#veil").classList.add("on");
    $("#boxTitle").textContent=m==="login"?"Вход":"Новая запись";
    $("#boxHint").textContent=m==="login"
      ?"Чтобы продолжить полёт с любого устройства."
      :"Имя и пароль, почта не нужна. Восстановить пароль будет нечем — запишите его.";
    $("#goBtn").textContent=m==="login"?"ВОЙТИ":"СОЗДАТЬ";
    $("#pw").autocomplete=m==="login"?"current-password":"new-password";
    $("#swap").textContent=m==="login"?"нет записи — создать":"уже есть запись — войти";
    $("#note").textContent=""; $("#note").className="note";
    setTimeout(()=>$("#lg").focus(),50);
  }
  const close=()=>$("#veil").classList.remove("on");
  window.driftAuth={open,close,tok,name};

  $("#swap").onclick=()=>open(mode==="login"?"register":"login");
  $("#veilX").onclick=close;
  $("#veil").onclick=e=>{if(e.target===$("#veil"))close()};
  document.addEventListener("keydown",e=>{if(e.key==="Escape")close()});

  $("#authForm").onsubmit=async e=>{
    e.preventDefault();
    const note=$("#note"), btn=$("#goBtn");
    const login=$("#lg").value.trim(), pass=$("#pw").value;
    if(!login||!pass){note.className="note bad";note.textContent="заполните оба поля";return}
    btn.disabled=true; note.className="note"; note.textContent="…";
    try{
      const d=await call(mode,{login,pass});
      if(d.ok){
        setAcc(d.token,d.login);
        note.className="note ok";
        note.textContent=mode==="login"?"вошли — полёт подтянется сам":"запись создана";
        paint(); setTimeout(close,700);
      }else{note.className="note bad";note.textContent=d.error||"не вышло"}
    }catch(err){note.className="note bad";note.textContent="сервер не ответил"}
    btn.disabled=false;
  };

  /* Строка состояния: кто вошёл, и что это значит для сохранения. */
  async function paint(){
    const w=$("#who"); if(!w)return;
    const play=$("#playBtn"), sub=play&&play.querySelector("s");
    if(!tok()){
      w.innerHTML='сохранение только в этом браузере · '+
        '<span class="linkish" data-a="login">войти</span> или '+
        '<span class="linkish" data-a="register">создать запись</span>';
      w.querySelectorAll("[data-a]").forEach(el=>el.onclick=()=>open(el.dataset.a));
      if(sub)sub.textContent="";
      return;
    }
    w.innerHTML='вы вошли как <b style="color:var(--good);font-weight:400">'+name()+
      '</b> · <span class="linkish" data-a="out">выйти</span>';
    w.querySelector("[data-a=out]").onclick=async()=>{
      try{await call("logout",{},true)}catch(e){}
      setAcc("",""); paint();
    };
    if(sub)sub.textContent="продолжить полёт";
    try{                                   /* токен мог истечь за девяносто дней */
      const d=await call("me",{},true);
      if(!d.ok){setAcc("","");paint();}
    }catch(e){}
  }
  paint();
})();
