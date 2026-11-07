/* Редкости: закрытая сотня (12m). Читаем живые RARE, RARE_WHERE, RARE_FX,
   RARE_BY_ID и RARE_BY_WHERE. Генератор сюда не копируем — копия не поймала бы
   поломку той таблицы, с которой играет человек. */
TEST_SUITES.push(()=>suite("редкости: сто записей, адреса и указатели целы",{tier:"node"},()=>{
  resetWorld();
  /* русское — непустая строка с кириллицей; номер серии у имени («венец 2») не мешает */
  const ruText=s=>typeof s==="string"&&s.trim().length>0&&/[А-Яа-яЁё]/.test(s);
  const show=a=>a.length?a.slice(0,6).join(" · ")+(a.length>6?" …ещё "+(a.length-6):""):"";
  const rows=Array.isArray(RARE)?RARE:[];

  eq(rows.length,100,"RARE — ровно сто записей");

  const whereIds=[],whereSeen={},whereBad=[];
  if(!Array.isArray(RARE_WHERE))whereBad.push("RARE_WHERE не список");
  else for(const w of RARE_WHERE){
    const id=w&&w.id;
    if(typeof id!=="string"||id.length===0)whereBad.push("пустое место");
    else if(whereSeen[id])whereBad.push("дважды: "+id);
    else{whereSeen[id]=1;whereIds.push(id);}
  }
  eq(whereIds.join(","),"poi,temple,cave,belt,lair,barge","мест шесть: poi, temple, cave, belt, lair, barge");
  eq(show(whereBad),"","id мест не пустые и не повторяются");

  const fxSeen={},fxBad=[];
  if(!Array.isArray(RARE_FX))fxBad.push("RARE_FX не список");
  else for(const f of RARE_FX){
    const tag=f&&f.tag;
    if(typeof tag!=="string"||tag.length===0)fxBad.push("пустой тег");
    else if(fxSeen[tag])fxBad.push("дважды: "+tag);
    else fxSeen[tag]=1;
  }
  ok(Object.keys(fxSeen).length>0,"у эффектов есть теги");
  eq(show(fxBad),"","теги эффектов не пустые и не повторяются");

  const idBad=[],idxBad=[],textBad=[],whBad=[],fxEnt=[],idSeen={};
  for(let i=0;i<rows.length;i++){
    const R=rows[i],id=R&&R.id,who=(typeof id==="string"&&id)?id:"поз "+i;
    if(i>=100||id!=="r"+i)idBad.push(who+": id "+JSON.stringify(id)+", позиция "+i);
    if(typeof id==="string"){
      if(idSeen[id])idBad.push(id+" повторяется");
      idSeen[id]=1;
    }
    if(!R||R.idx!==i)idxBad.push(who+": idx "+JSON.stringify(R&&R.idx)+", позиция "+i);
    if(!R||!ruText(R.ru))textBad.push(who+": имя");
    if(!R||!ruText(R.grade))textBad.push(who+": грейд");
    if(!R||!ruText(R.note))textBad.push(who+": заметка");
    if(!R||typeof R.where!=="string"||!whereSeen[R.where])whBad.push(who+": место "+JSON.stringify(R&&R.where));
    const fx=R&&R.fx;
    if(!fx||typeof fx.tag!=="string"||!fxSeen[fx.tag])fxEnt.push(who+": тег "+JSON.stringify(fx&&fx.tag));
    else if(typeof fx.val!=="number"||!Number.isFinite(fx.val)||fx.val<0)fxEnt.push(who+": val "+JSON.stringify(fx.val));
  }
  const miss=[];
  for(let i=0;i<100;i++)if(!idSeen["r"+i])miss.push("нет r"+i);
  eq(show(idBad.concat(miss)),"","id — ровно r0…r99, каждая на своей позиции, без повторов");
  eq(show(idxBad),"","idx совпадает с позицией в RARE");
  eq(show(textBad),"","у каждой записи непустые русские имя, грейд и заметка");
  eq(show(whBad),"","место каждой записи — одно из шести id RARE_WHERE");
  eq(show(fxEnt),"","тег эффекта — из RARE_FX, величина — конечное число ≥ 0");

  /* указатель по id: та же запись, не копия, и ни одного чужого ключа */
  const byBad=[];
  const byKeys=(RARE_BY_ID&&typeof RARE_BY_ID==="object")?Object.keys(RARE_BY_ID):null;
  if(!byKeys)byBad.push("RARE_BY_ID нет");
  else{
    const hit={};
    for(let i=0;i<rows.length;i++){
      const R=rows[i],id=R&&R.id;
      if(!R||RARE_BY_ID[id]!==R)byBad.push((typeof id==="string"?id:"поз "+i)+": указатель не на эту запись");
      else hit[id]=(hit[id]|0)+1;
    }
    for(const k of byKeys){
      const R=RARE_BY_ID[k];
      if(rows.indexOf(R)<0)byBad.push("лишнее: "+k);
      else if(R.id!==k)byBad.push(k+": ключ не равен id");
    }
    if(byKeys.length!==rows.length)byBad.push("ключей "+byKeys.length+", записей "+rows.length);
  }
  eq(show(byBad),"","RARE_BY_ID покрывает каждую запись и ничего лишнего");

  /* указатель по месту: бакеты — ровно шесть id, внутри только записи этого места */
  const bwBad=[];
  const bwKeys=(RARE_BY_WHERE&&typeof RARE_BY_WHERE==="object")?Object.keys(RARE_BY_WHERE):null;
  if(!bwKeys)bwBad.push("RARE_BY_WHERE нет");
  else{
    const seen=new Set();
    for(const k of bwKeys){
      if(!whereSeen[k])bwBad.push("лишнее место "+k);
      const pool=RARE_BY_WHERE[k];
      if(!Array.isArray(pool)){bwBad.push(k+": не список");continue;}
      for(const R of pool){
        if(!R||rows.indexOf(R)<0){bwBad.push(k+": чужое "+JSON.stringify(R&&R.id));continue;}
        if(seen.has(R))bwBad.push(R.id+" дважды");
        seen.add(R);
        if(R.where!==k)bwBad.push(R.id+": в «"+k+"», а where «"+R.where+"»");
      }
    }
    for(const id of whereIds)if(bwKeys.indexOf(id)<0)bwBad.push("нет места "+id);
    for(let i=0;i<rows.length;i++){
      const R=rows[i];
      if(!R||!seen.has(R))bwBad.push((R&&R.id||"поз "+i)+": нет в указателе мест");
    }
    let n=0;
    for(const k of bwKeys)if(Array.isArray(RARE_BY_WHERE[k]))n+=RARE_BY_WHERE[k].length;
    if(n!==rows.length)bwBad.push("слотов "+n+", записей "+rows.length);
  }
  eq(show(bwBad),"","RARE_BY_WHERE покрывает каждую запись и ничего лишнего");
}));
