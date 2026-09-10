/* ══════════════ хэш состояния (M441) ══════════════
   Одно число на весь мир: два прогона одной сцены на одном семени и одних
   часах обязаны давать его одинаковым каждые сто кадров (тест Factorio,
   tests/91zzzzzs-hash). Им же пользуется наблюдатель state() тестового API
   (M442) и будет пользоваться всё, что сравнивает миры: повтор по записи,
   облачная запись, «где разошлось».

   Что входит. Всё, что достижимо из корня как ДАННЫЕ: числа (по битам
   float64, так что 0.1+0.2 и 0.3 — разные), строки, логические, null и
   undefined, массивы, простые объекты (ключи в порядке сортировки — порядок
   заведения полей не судится), Map и Set (в порядке вставки: у повторимого
   мира он тот же), типизированные массивы поэлементно. Общая ссылка и цикл
   хэшируются номером первой встречи — обход конечен и одинаков.
   Что не входит. Функции и символы; всё, что не простой объект, — канвы,
   контексты, Path2D, звуковые узлы, DOM, экземпляры классов (кэши растра
   и звука, а не мир); ключи, начатые с «_» (закрытые кэши и подпорки:
   `CHRON._keys`, `G._dial` наборов); и ключи из STATE_HASH_SKIP ниже.
   Без аргумента хэшируется G и вдобавок положение потока случая МИРА (rnd)
   и часы игры: мир, в котором те же поля, но другой следующий бросок, — уже
   другой мир. Поток картинки (rndFx) не входит нарочно: от него в мире не
   зависит ничего, и прогон с рисованием обязан совпасть с прогоном без.
   stateHash(obj) — хэш одного поддерева; stateHashParts() — {ключ G: хэш}
   для ответа на вопрос «что именно разошлось». */
const STATE_HASH_SKIP=new Set([
  "tex",         /* подложка карты (17z): растр, а не мир */
  "prompt"       /* строка подсказки: пересобирается каждый кадр из мира и из
                    того, что игрок уже видел за сеанс (BASE_WALKED и такие же
                    «один раз за сеанс»), — это вид, а не мир */
]);
function stateHash(root,skip){
  const top=root===undefined;
  if(top)root=G;
  skip=skip||STATE_HASH_SKIP;
  let h1=0x2F6B3A1D|0,h2=0x6C8E9CF5|0;
  const F=new Float64Array(1),U=new Uint32Array(F.buffer);
  const mix=x=>{h1=Math.imul(h1^x,2654435761);h2=Math.imul(h2^x,1597334677);
    h1^=h1>>>15;h2^=h2>>>13;};
  const mixS=s=>{mix(s.length);for(let i=0;i<s.length;i++)mix(s.charCodeAt(i));};
  const mixN=n=>{F[0]=n;mix(U[0]);mix(U[1]);};
  const seen=new Map();let ids=0;
  const walk=v=>{
    const t=typeof v;
    if(t==="number"){mix(1);mixN(v);return;}
    if(t==="string"){mix(2);mixS(v);return;}
    if(t==="boolean"){mix(v?3:4);return;}
    if(t==="undefined"){mix(5);return;}
    if(t==="bigint"){mix(6);mixS(String(v));return;}
    if(t!=="object")return;                     /* функции и символы — не мир */
    if(v===null){mix(7);return;}
    if(seen.has(v)){mix(8);mix(seen.get(v));return;}
    if(ArrayBuffer.isView(v)){
      if(typeof v.length!=="number")return;     /* DataView — не данные мира */
      seen.set(v,++ids);mix(9);mix(v.length);
      for(let i=0;i<v.length;i++)mixN(v[i]);
      return;
    }
    if(Array.isArray(v)){seen.set(v,++ids);mix(10);mix(v.length);for(let i=0;i<v.length;i++)walk(v[i]);return;}
    if(v instanceof Map){seen.set(v,++ids);mix(11);mix(v.size);for(const [k,x] of v){walk(k);walk(x);}return;}
    if(v instanceof Set){seen.set(v,++ids);mix(12);mix(v.size);for(const x of v)walk(x);return;}
    const pr=Object.getPrototypeOf(v);
    if(pr!==Object.prototype&&pr!==null)return; /* канва, DOM, класс — кэш, не мир */
    seen.set(v,++ids);mix(13);
    const ks=Object.keys(v).sort();
    for(const k of ks){
      if(k.charCodeAt(0)===95||skip.has(k))continue;
      const x=v[k];
      if(typeof x==="function")continue;
      mixS(k);walk(x);
    }
  };
  walk(root);
  if(top){const r=rndState();mix(r[1]|0);mixN(now());}
  return ((h1>>>0).toString(16).padStart(8,"0"))+((h2>>>0).toString(16).padStart(8,"0"));
}
function stateHashParts(root){
  root=root||G;
  const out={};
  for(const k of Object.keys(root).sort()){
    if(k.charCodeAt(0)===95||STATE_HASH_SKIP.has(k)||typeof root[k]==="function")continue;
    out[k]=stateHash({v:root[k]});
  }
  return out;
}
