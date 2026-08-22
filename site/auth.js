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
    const reg=m==="register";
    $("#boxTitle").textContent=reg?"Новая запись":"Вход";
    $("#boxHint").textContent=reg
      ?"Придумайте имя и пароль. Почта необязательна — она нужна только на случай, если пароль забудется."
      :"Чтобы продолжить полёт с любого устройства.";
    $("#goBtn").textContent=reg?"СОЗДАТЬ":"ВОЙТИ";
    $("#pw").autocomplete=reg?"new-password":"current-password";
    $("#swap").textContent=reg?"уже есть запись — войти":"нет записи — создать";
    const mw=$("#mailWrap"), fw=$("#forgotWrap");
    if(mw)mw.style.display=reg?"":"none";
    if(fw)fw.style.display=reg?"none":"";
    $("#note").textContent=""; $("#note").className="note";
    setTimeout(()=>$("#lg").focus(),50);
  }

  /* Забытый пароль. Ответ сервера всегда одинаковый — есть такая запись или
     нет, письмо ушло или нет, — иначе форма превратится в способ узнать,
     кто у нас зарегистрирован. */
  async function forgot(){
    const note=$("#note"), login=$("#lg").value.trim();
    if(!login){note.className="note bad";
      note.textContent="сначала впишите имя — на него и пошлём письмо";$("#lg").focus();return}
    note.className="note"; note.textContent="…";
    try{
      await call("forgot",{login});
      note.className="note ok";
      note.textContent="если у этой записи есть почта, письмо уже летит. Ссылка живёт час.";
    }catch(e){note.className="note bad";note.textContent="сервер не ответил"}
  }
  const close=()=>$("#veil").classList.remove("on");
  window.driftAuth={open,close,tok,name};

  /* Кликабельные спаны сами по себе недоступны с клавиатуры: браузер не даёт им
     ни фокуса, ни срабатывания по Enter. Делаем их кнопками по сути, не трогая
     вид, — иначе половина окна входа работает только мышью. */
  function actionable(el){
    if(!el)return;
    el.setAttribute("role","button");
    el.setAttribute("tabindex","0");
    el.addEventListener("keydown",e=>{
      if(e.key==="Enter"||e.key===" "){e.preventDefault();el.click();}
    });
  }
  document.querySelectorAll(".linkish,.x").forEach(actionable);

  $("#swap").onclick=()=>open(mode==="login"?"register":"login");
  if($("#forgot"))$("#forgot").onclick=forgot;
  $("#veilX").onclick=close;
  $("#veilX").setAttribute("aria-label","закрыть");
  $("#veil").onclick=e=>{if(e.target===$("#veil"))close()};
  document.addEventListener("keydown",e=>{if(e.key==="Escape")close()});

  $("#authForm").onsubmit=async e=>{
    e.preventDefault();
    const note=$("#note"), btn=$("#goBtn");
    const login=$("#lg").value.trim(), pass=$("#pw").value;
    const mailEl=$("#ml"), mail=mailEl?mailEl.value.trim():"";
    if(!login||!pass){note.className="note bad";note.textContent="заполните имя и пароль";return}
    btn.disabled=true; note.className="note"; note.textContent="…";
    try{
      const d=await call(mode,mode==="register"?{login,pass,mail}:{login,pass});
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
      w.querySelectorAll("[data-a]").forEach(el=>{el.onclick=()=>open(el.dataset.a);actionable(el);});
      if(sub)sub.textContent="";
      return;
    }
    w.innerHTML='вы вошли как <b style="color:var(--good);font-weight:400">'+name()+
      '</b> · <span class="linkish" data-a="out">выйти</span>';
    const outBtn=w.querySelector("[data-a=out]"); actionable(outBtn);
    outBtn.onclick=async()=>{
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
