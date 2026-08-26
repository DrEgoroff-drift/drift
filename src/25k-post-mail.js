/* ══════════════ почта на столе ══════════════
   M190. Стопка карточек, скреплённая скрепкой, — вот и вся «переписка». Имени
   у корреспондента нет и не будет; узнают его по тому, КАК ОН ВЫЧЁРКИВАЕТ и
   что фотографирует. Своя карточка и чужая лежат в стопке вперемешку, по
   времени, чтобы разговор читался разговором.

   ОДНА КНОПКА ПРО ЧЕЛОВЕКА — «не принимать». Не жалоба, не блок-лист, не
   объяснение: цепочка просто умирает, и на том конце об этом не сообщается
   ничего. Так это и бывает, когда перестают писать.

   ОТВЕТ — ЭТО ТОЖЕ КАРТОЧКА, а не строка: чтобы ответить, нужен свой снимок,
   подписанный бланком. Поэтому «ОТВЕТИТЬ» показывает подписанные карточки из
   альбома, а не поле ввода, которого в этой игре нет нигде.

   ЗАКЛАДКА ЖИВЁТ, ПОКА ЖИВА ПОЧТА: офлайн её нет вовсе, и ни одна строка
   интерфейса о почте не заикается — открытый с рабочего стола файл это игра
   без почты, а не игра со сломанной почтой. */
let mailOpen=-1,mailPick=-1,mailBack=-1;
function mailCard(box,s,w,ro,onTap){
  const cell=document.createElement("div");
  cell.className="card"+(ro?" theirs":"");
  const h=Math.round(w*.625);
  const cv=document.createElement("canvas");
  cv.width=Math.round(w*2);cv.height=Math.round(h*2);
  cv.style.width=w+"px";cv.style.height=h+"px";
  const cc=cv.getContext("2d");cc.scale(2,2);
  if(!drawPostcard(cc,s,w,h)){cc.fillStyle="#12161d";cc.fillRect(0,0,w,h);}
  cell.appendChild(cv);
  const cap=document.createElement("s");
  cap.textContent=(ro?"":"ваша · ")+postCaption(s);
  cell.appendChild(cap);
  if(onTap)cell.onclick=e=>{e.stopPropagation();onTap();};
  box.appendChild(cell);
  return cell;
}
function renderMail(box){
  box.innerHTML="";
  const M=mailAll();
  if(!mailOn()){
    /* Офлайн почты не существует. Сказать «почта недоступна» значило бы
       пообещать её — поэтому закладка сюда просто не пускает */
    tableRow(box,"dim","","здесь ничего нет");
    return;
  }
  if(!M.st.length){
    tableRow(box,"dim","","почта пуста: подпишите снимок в альбоме и отправьте — карточку поймает кто-нибудь");
    tableRow(box,"dim","","чужие карточки и ответы приходят при стыковке, по одной за раз");
    return;
  }
  const wrap=document.createElement("div");wrap.className="album mail";
  M.st.forEach((st,i)=>{
    const open=(mailOpen===i);
    const pack=document.createElement("div");
    pack.className="pack"+(open?" open":"")+(st.mute?" mute":"");
    /* шапка стопки: сколько карточек и чья последняя. Ни имени, ни числа,
       по которому человека можно было бы искать */
    const hd=document.createElement("div");hd.className="ph";
    const last=st.c[st.c.length-1];
    hd.innerHTML="<b>СТОПКА · "+st.c.length+"</b><s>"+
      (st.mute?"закрыта":(st.fresh?"пришло новое":(last&&last.mine?"ждём ответа":"ваш ход")))+"</s>";
    hd.onclick=()=>{mailOpen=open?-1:i;mailPick=-1;mailBack=-1;st.fresh=0;tableRender();};
    pack.appendChild(hd);

    const row=document.createElement("div");row.className="row";
    const list=open?st.c:st.c.slice(-3);
    list.forEach((c,ci)=>{
      const gi=open?ci:st.c.length-list.length+ci;
      const showBack=open&&mailBack===gi;
      if(showBack&&typeof renderCardBack==="function"){
        const host=document.createElement("div");
        host.className="card side";host.style.width="228px";host.style.minHeight="143px";
        renderCardBack(host,c,null,true);
        host.onclick=e=>{e.stopPropagation();mailBack=-1;tableRender();};
        row.appendChild(host);
      }else{
        mailCard(row,c,open?228:150,!c.mine,open?()=>{mailBack=gi;tableRender();}:null);
      }
    });
    pack.appendChild(row);

    if(open&&!st.mute){
      const acts=document.createElement("div");acts.className="acts";
      const rep=document.createElement("button");
      rep.className="act sm gold";rep.textContent=mailPick===i?"НЕ ОТВЕЧАТЬ":"ОТВЕТИТЬ";
      rep.onclick=e=>{e.stopPropagation();mailPick=(mailPick===i?-1:i);tableRender();};
      acts.appendChild(rep);
      const mu=document.createElement("button");
      mu.className="act sm";mu.textContent="НЕ ПРИНИМАТЬ";
      mu.onclick=e=>{e.stopPropagation();mailMute(st);};
      acts.appendChild(mu);
      pack.appendChild(acts);

      if(mailPick===i){
        const mine=albumAll().filter(a=>postSigned(a));
        const pick=document.createElement("div");pick.className="row pick";
        if(!mine.length){
          const n=document.createElement("s");
          n.className="none";
          n.textContent="в альбоме нет подписанной карточки: закладка АЛЬБОМ, развернуть снимок, ПОДПИСАТЬ";
          pick.appendChild(n);
        }else for(const a of mine)
          mailCard(pick,a,150,false,()=>{mailSend(a,st.ch);mailPick=-1;});
        pack.appendChild(pick);
      }
    }
    wrap.appendChild(pack);
  });
  box.appendChild(wrap);
}
