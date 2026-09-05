/* ══════════════ стол как стол: предметы, а не тринадцать закладок ══════════════
   Замысел M151a называл стол столом: «деревянная столешница, лампа, окно того
   места, где сейчас корабль. На нём лежат: тетрадь с тремя закладками, ленты,
   письма, вещи, трудовая книжка, вырезки». Столешницу и лампу построили сразу
   (`tableBake`, 27i), а вот всё, что на ней лежит, год складывалось в один
   ряд закладок — по одной за веху, и каждая была права поодиночке. К августу
   их стало восемнадцать: 777 px ленты в окне 393, шесть видно, выбранная
   могла стоять за краем. Автор сказал: «там сейчас каша, ничего не понятно
   что происходит… мы постепенно всё добавляли и теперь нелогично» — и выбрал
   из двух путей этот: не разделы, как на станции, а вернуть стол.

   Верхний уровень стола — КАРТИНКА, а не меню: вещи лежат на досках, у каждой
   своё лицо, и по ним тыкают. Внутри вещи — то же, что было во вкладке; у
   тетради свои три закладки, у накладной две, у прочих ни одной, потому что
   выбирать там не из чего.

   ПРАВИЛА ФАЙЛА:
   1. Здесь только раскладка и рисунок. Ни одна строка содержимого не живёт
      тут: её по-прежнему пишут renderLog, renderThings, renderStrips и прочие.
   2. Вещь показывается, только если она у игрока есть. Пустая вещь на столе —
      обещание содержимого, которого нет.
   3. Рисуют по правилу процедурной сборки: тело, обвод, один свет. Лампа
      висит над столом и чуть слева — значит блик сверху слева, тень вправо
      вниз, и у всех вещей одинаково. */

/* ── общие приёмы ──────────────────────────────────────────────────────────
   Три помощника на все двенадцать вещей: тень под предметом, лист бумаги и
   линовка. Без них каждая вещь заводила бы свой свет, и стол рассыпался бы на
   двенадцать разных столов. */
function dkShadow(c,x,y,w,h){
  const g=c.createRadialGradient(x+w*.5,y+h*.92,2,x+w*.5,y+h*.92,Math.max(w,h)*.62);
  g.addColorStop(0,"rgba(0,0,0,.5)");g.addColorStop(1,"rgba(0,0,0,0)");
  c.fillStyle=g;c.beginPath();
  c.ellipse(x+w*.52,y+h*.9,w*.56,h*.2,0,0,Math.PI*2);c.fill();
}
/* лист: тело, светлая кромка сверху-слева, тёмная снизу-справа, обвод */
function dkPaper(c,x,y,w,h,tone){
  const T=tone||["#d9c9a2","#c3b085","#8a7a58"];
  c.fillStyle=T[0];c.fillRect(x,y,w,h);
  const g=c.createLinearGradient(x,y,x+w*.35,y+h);
  g.addColorStop(0,"rgba(255,246,224,.5)");g.addColorStop(1,"rgba(255,246,224,0)");
  c.fillStyle=g;c.fillRect(x,y,w,h);
  c.fillStyle=T[1];c.fillRect(x,y+h-2,w,2);c.fillRect(x+w-2,y,2,h);
  c.strokeStyle=T[2];c.lineWidth=1;c.strokeRect(x+.5,y+.5,w-1,h-1);
}
function dkRule(c,x,y,w,n,step,col){
  c.strokeStyle=col||"rgba(90,74,48,.45)";c.lineWidth=1;
  for(let i=0;i<n;i++){
    const yy=Math.round(y+i*step)+.5, ww=w*(i%3===2?.62:i%2?.86:1);
    c.beginPath();c.moveTo(x,yy);c.lineTo(x+ww,yy);c.stroke();
  }
}

/* ── двенадцать вещей ──────────────────────────────────────────────────────
   Каждая рисуется в коробке w×h и обязана читаться с ладони: силуэт первым,
   подробности вторыми. Подпись под вещью говорит, что это; рисунок говорит,
   которая из них. */
const DESK_DRAW={
  /* ТЕТРАДЬ — то, что записывают: эфир, борт, люди.
     Три закладки из верхней кромки — это и есть те самые три; больше про них
     ничего говорить не надо, они видны. */
  book:(c,w,h)=>{
    const x=w*.13,y=h*.2,bw=w*.74,bh=h*.6;
    dkShadow(c,x,y,bw,bh);
    /* закладки торчат ИЗ-ПОД обложки, значит рисуются первыми */
    const TB=["#8f6a3a","#7a3b2a","#4e6b52"];
    for(let i=0;i<3;i++){
      c.fillStyle=TB[i];
      c.fillRect(x+bw*(.3+i*.2),y-h*.09,bw*.11,h*.12);
      c.fillStyle="rgba(0,0,0,.22)";
      c.fillRect(x+bw*(.3+i*.2),y-h*.09,bw*.11,2);
    }
    /* блок страниц: видна кромка справа и снизу — тетрадь толстая */
    c.fillStyle="#c9ba95";c.fillRect(x+3,y+3,bw,bh);
    c.fillStyle="#b0a077";c.fillRect(x+3,y+bh,bw,3);
    for(let i=1;i<5;i++){c.fillStyle="rgba(90,74,48,.35)";
      c.fillRect(x+bw+1,y+3+i*1.6,3,1);}
    /* обложка */
    dkPaper(c,x,y,bw,bh,["#d9c9a2","#c3b085","#8a7a58"]);
    /* коленкоровый корешок */
    const sp=bw*.1;
    c.fillStyle="#4a3a26";c.fillRect(x,y,sp,bh);
    c.fillStyle="rgba(255,236,200,.16)";c.fillRect(x,y,sp,2);
    c.fillStyle="rgba(0,0,0,.35)";c.fillRect(x+sp-1,y,1,bh);
    /* поле для подписи и линовка под ним */
    c.strokeStyle="rgba(90,74,48,.5)";c.lineWidth=1;
    c.strokeRect(Math.round(x+bw*.2)+.5,Math.round(y+bh*.14)+.5,
      Math.round(bw*.5),Math.round(bh*.2));
    dkRule(c,x+bw*.2,y+bh*.52,bw*.66,4,bh*.11);
    /* карандаш поперёк — вещь, которой пользуются */
    c.save();c.translate(x+bw*.62,y+bh*.86);c.rotate(-.22);
    c.fillStyle="#c9a13f";c.fillRect(-bw*.3,0,bw*.5,h*.045);
    c.fillStyle="#e6c470";c.fillRect(-bw*.3,0,bw*.5,h*.015);
    c.fillStyle="#e8dcc0";c.beginPath();
    c.moveTo(bw*.2,0);c.lineTo(bw*.26,h*.022);c.lineTo(bw*.2,h*.045);c.closePath();c.fill();
    c.fillStyle="#2b2118";c.beginPath();
    c.moveTo(bw*.245,h*.014);c.lineTo(bw*.26,h*.022);c.lineTo(bw*.245,h*.031);c.closePath();c.fill();
    c.restore();
  },
  /* ДЕЛА — папка: язычок слева сверху, бумаги торчат из-под крышки */
  deeds:(c,w,h)=>{
    const x=w*.12,y=h*.2,bw=w*.76,bh=h*.56;
    dkShadow(c,x,y,bw,bh);
    /* бумаги внутри — видны по верхней кромке, папка от этого набитая */
    for(let i=0;i<3;i++){
      c.fillStyle=i?"#d8caa4":"#e7dcbc";
      c.fillRect(x+bw*(.08+i*.04),y-4-i*2.5,bw*(.8-i*.1),6+i*2);
    }
    /* язычок */
    c.fillStyle="#a5763e";c.fillRect(x,y-h*.1,bw*.36,h*.12);
    c.fillStyle="rgba(255,232,190,.2)";c.fillRect(x,y-h*.1,bw*.36,2);
    /* крышка */
    c.fillStyle="#b98a4e";c.fillRect(x,y,bw,bh);
    const g=c.createLinearGradient(x,y,x+bw*.3,y+bh);
    g.addColorStop(0,"rgba(255,232,190,.32)");g.addColorStop(1,"rgba(60,38,14,.38)");
    c.fillStyle=g;c.fillRect(x,y,bw,bh);
    c.strokeStyle="#6b4a20";c.lineWidth=1;c.strokeRect(x+.5,y+.5,bw-1,bh-1);
    /* тиснёная рамка и завязка */
    c.strokeStyle="rgba(90,60,20,.55)";c.strokeRect(x+5.5,y+5.5,bw-11,bh-11);
    c.strokeStyle="#5c4118";c.lineWidth=1.6;
    c.beginPath();c.moveTo(x+bw,y+bh*.5);c.lineTo(x+bw*.66,y+bh*.5);c.stroke();
    c.fillStyle="#5c4118";c.beginPath();c.arc(x+bw*.66,y+bh*.5,2.2,0,Math.PI*2);c.fill();
  },
  /* ЛЕНТЫ — оторванная полоса самописца, с кривой пера */
  strips:(c,w,h)=>{
    const x=w*.1,y=h*.2,bw=w*.8,bh=h*.44;
    dkShadow(c,x,y,bw,bh);
    dkPaper(c,x,y,bw,bh,["#e2d7bb","#cbbd98","#8d7f5e"]);
    /* рваный край слева */
    c.fillStyle="#241810";
    for(let i=0;i<7;i++)c.fillRect(x,y+i*bh/7,2+((i*7)%3),bh/7*.6);
    /* деления и кривая */
    c.strokeStyle="rgba(120,100,64,.5)";c.lineWidth=1;
    for(let i=1;i<7;i++){const xx=Math.round(x+bw*i/7)+.5;
      c.beginPath();c.moveTo(xx,y+2);c.lineTo(xx,y+bh-2);c.stroke();}
    c.strokeStyle="#7a3b2a";c.lineWidth=1.4;c.beginPath();
    for(let i=0;i<=24;i++){
      const t=i/24,xx=x+bw*t,yy=y+bh*(.5+.3*Math.sin(t*7.5)*Math.cos(t*3.1));
      i?c.lineTo(xx,yy):c.moveTo(xx,yy);
    }
    c.stroke();
  },
  /* ВЕЩИ — то, что досталось: конверт, бумажка, находка */
  things:(c,w,h)=>{
    dkShadow(c,w*.12,h*.2,w*.76,h*.56);
    /* бумажка снизу */
    c.save();c.translate(w*.5,h*.5);c.rotate(-.12);
    dkPaper(c,-w*.34,-h*.2,w*.6,h*.38,["#d3c39c","#bda97e","#867752"]);
    c.restore();
    /* конверт сверху */
    c.save();c.translate(w*.55,h*.52);c.rotate(.09);
    dkPaper(c,-w*.3,-h*.18,w*.56,h*.34,["#e6dcc2","#cfc3a0","#8d8163"]);
    c.strokeStyle="rgba(110,92,60,.7)";c.lineWidth=1;
    c.beginPath();c.moveTo(-w*.3,-h*.18);c.lineTo(-w*.02,h*.02);c.lineTo(w*.26,-h*.18);c.stroke();
    c.restore();
    /* находка — камешек с гранью */
    c.fillStyle="#6f7d84";c.beginPath();
    c.moveTo(w*.2,h*.72);c.lineTo(w*.29,h*.62);c.lineTo(w*.37,h*.72);c.lineTo(w*.27,h*.79);
    c.closePath();c.fill();
    c.fillStyle="rgba(210,232,240,.5)";c.beginPath();
    c.moveTo(w*.2,h*.72);c.lineTo(w*.29,h*.62);c.lineTo(w*.3,h*.71);c.closePath();c.fill();
  },
  /* КНИЖКА — трудовая: чужой рукой про тебя */
  record:(c,w,h)=>{
    const x=w*.24,y=h*.16,bw=w*.52,bh=h*.62;
    dkShadow(c,x,y,bw,bh);
    c.fillStyle="#5d2b26";c.fillRect(x,y,bw,bh);
    const g=c.createLinearGradient(x,y,x+bw*.4,y+bh);
    g.addColorStop(0,"rgba(255,200,170,.22)");g.addColorStop(1,"rgba(0,0,0,.3)");
    c.fillStyle=g;c.fillRect(x,y,bw,bh);
    c.strokeStyle="#3a1a17";c.lineWidth=1;c.strokeRect(x+.5,y+.5,bw-1,bh-1);
    /* тиснение */
    c.strokeStyle="rgba(226,196,138,.75)";c.lineWidth=1;
    c.strokeRect(x+5.5,y+5.5,bw-11,bh-11);
    c.beginPath();c.arc(x+bw*.5,y+bh*.42,bw*.16,0,Math.PI*2);c.stroke();
    c.beginPath();c.moveTo(x+bw*.28,y+bh*.72);c.lineTo(x+bw*.72,y+bh*.72);c.stroke();
  },
  /* АЛЬБОМ — снимок с белым полем и уголком */
  album:(c,w,h)=>{
    const x=w*.16,y=h*.14,bw=w*.68,bh=h*.66;
    dkShadow(c,x,y,bw,bh);
    c.fillStyle="#e9e3d2";c.fillRect(x,y,bw,bh);
    c.strokeStyle="#8d8674";c.lineWidth=1;c.strokeRect(x+.5,y+.5,bw-1,bh-1);
    /* сам кадр: горизонт и светило — снимок места, а не портрет */
    const ix=x+5,iy=y+5,iw=bw-10,ih=bh-16;
    const sky=c.createLinearGradient(ix,iy,ix,iy+ih);
    sky.addColorStop(0,"#2a3550");sky.addColorStop(1,"#6b5a55");
    c.fillStyle=sky;c.fillRect(ix,iy,iw,ih);
    c.fillStyle="#211a1c";c.fillRect(ix,iy+ih*.66,iw,ih*.34);
    c.fillStyle="rgba(255,224,178,.85)";c.beginPath();
    c.arc(ix+iw*.7,iy+ih*.4,3.2,0,Math.PI*2);c.fill();
    /* уголок держателя */
    c.fillStyle="#c9bda0";c.beginPath();
    c.moveTo(x,y);c.lineTo(x+9,y);c.lineTo(x,y+9);c.closePath();c.fill();
  },
  /* ПОЧТА — стопка карточек, верхняя с маркой */
  mail:(c,w,h)=>{
    dkShadow(c,w*.14,h*.2,w*.72,h*.5);
    for(let i=2;i>=0;i--){
      c.save();c.translate(w*.5+i*2,h*.5+i*2.5);c.rotate((i-1)*.05);
      dkPaper(c,-w*.32,-h*.2,w*.62,h*.38,
        i?["#cfc099","#b8a77e","#867752"]:["#e7ddc4","#d0c4a2","#8d8163"]);
      if(!i){
        c.fillStyle="#7a3b2a";c.fillRect(w*.13,-h*.16,w*.13,h*.13);
        c.fillStyle="rgba(255,240,214,.6)";c.fillRect(w*.15,-h*.14,w*.09,h*.09);
        dkRule(c,-w*.26,h*.02,w*.34,3,h*.07,"rgba(90,74,48,.4)");
      }
      c.restore();
    }
  },
  /* ПОЛКА — книги, лежащие плашмя */
  books:(c,w,h)=>{
    dkShadow(c,w*.12,h*.3,w*.76,h*.4);
    const cols=["#3d5a4a","#5d3f2c","#38455f"];
    for(let i=0;i<3;i++){
      const bw=w*(.66-i*.05),bh=h*.12,x=w*.16+i*3,y=h*.62-i*(bh+2);
      c.fillStyle=cols[i];c.fillRect(x,y,bw,bh);
      c.fillStyle="rgba(255,240,214,.2)";c.fillRect(x,y,bw,2);
      c.fillStyle="#e3d9bd";c.fillRect(x+bw,y+1,3,bh-2);       /* обрез */
      c.strokeStyle="rgba(0,0,0,.45)";c.lineWidth=1;c.strokeRect(x+.5,y+.5,bw-1,bh-1);
      c.fillStyle="rgba(226,196,138,.6)";c.fillRect(x+bw*.12,y+bh*.4,bw*.3,1.5);
    }
  },
  /* СМЕНА — переплетённый том: тёмная обложка, корешок, ляссе (M353) */
  smena:(c,w,h)=>{
    const x=w*.22,y=h*.16,bw=w*.56,bh=h*.66;
    dkShadow(c,x,y,bw,bh);
    c.fillStyle="#3a2c22";c.fillRect(x,y,bw,bh);
    c.fillStyle="#241a14";c.fillRect(x,y,bw*.12,bh);            /* корешок */
    c.fillStyle="rgba(255,240,214,.16)";c.fillRect(x+bw*.12,y,1.5,bh);
    c.strokeStyle="rgba(0,0,0,.5)";c.lineWidth=1;c.strokeRect(x+.5,y+.5,bw-1,bh-1);
    c.fillStyle="rgba(226,196,138,.55)";c.fillRect(x+bw*.3,y+bh*.3,bw*.5,1.5);c.fillRect(x+bw*.3,y+bh*.36,bw*.34,1.5);
    c.fillStyle="#8a4128";c.fillRect(x+bw*.7,y+bh*.6,2,bh*.5);   /* ляссе */
  },
  /* ПРИЁМНИКИ — шкала с иглой: мачты, пойманные в шуме */
  relay:(c,w,h)=>{
    const x=w*.14,y=h*.22,bw=w*.72,bh=h*.5;
    dkShadow(c,x,y,bw,bh);
    c.fillStyle="#2e2a26";c.fillRect(x,y,bw,bh);
    c.strokeStyle="#151210";c.lineWidth=1;c.strokeRect(x+.5,y+.5,bw-1,bh-1);
    const gl=c.createLinearGradient(x,y,x,y+bh);
    gl.addColorStop(0,"rgba(190,220,210,.16)");gl.addColorStop(1,"rgba(0,0,0,.2)");
    c.fillStyle=gl;c.fillRect(x+3,y+3,bw-6,bh-6);
    c.strokeStyle="rgba(160,220,210,.6)";c.lineWidth=1;
    for(let i=1;i<10;i++){const xx=Math.round(x+bw*i/10)+.5;
      c.beginPath();c.moveTo(xx,y+bh*(i%2?.18:.3));c.lineTo(xx,y+bh*.62);c.stroke();}
    c.strokeStyle="#f2b25c";c.lineWidth=1.6;
    c.beginPath();c.moveTo(x+bw*.62,y+4);c.lineTo(x+bw*.62,y+bh-4);c.stroke();
  },
  /* ПАРТИЯ — доска и две фигуры */
  chess:(c,w,h)=>{
    const s=Math.min(w*.6,h*.62),x=w*.5-s/2,y=h*.5-s/2;
    dkShadow(c,x,y,s,s);
    c.fillStyle="#d8c9a4";c.fillRect(x,y,s,s);
    c.fillStyle="#5b4227";
    for(let i=0;i<6;i++)for(let k=0;k<6;k++)
      if((i+k)&1)c.fillRect(x+i*s/6,y+k*s/6,s/6,s/6);
    c.strokeStyle="#3a2a18";c.lineWidth=1;c.strokeRect(x+.5,y+.5,s-1,s-1);
    /* две фигуры: белая и чёрная, обе с обводом */
    const man=(cx,cy,col,edge)=>{
      c.fillStyle=col;c.beginPath();c.ellipse(cx,cy,s*.075,s*.055,0,0,Math.PI*2);c.fill();
      c.beginPath();c.moveTo(cx-s*.05,cy);c.lineTo(cx-s*.03,cy-s*.12);
      c.lineTo(cx+s*.03,cy-s*.12);c.lineTo(cx+s*.05,cy);c.closePath();c.fill();
      c.beginPath();c.arc(cx,cy-s*.14,s*.045,0,Math.PI*2);c.fill();
      c.strokeStyle=edge;c.lineWidth=1;c.stroke();
    };
    man(x+s*.28,y+s*.68,"#efe6cd","#8d8674");
    man(x+s*.68,y+s*.44,"#2a2420","#000");
  },
  /* ОТЧЁТ — казённая стопка со скрепкой */
  lore:(c,w,h)=>{
    const x=w*.2,y=h*.12,bw=w*.6,bh=h*.72;
    dkShadow(c,x,y,bw,bh);
    dkPaper(c,x+3,y+3,bw,bh,["#c9bb96","#b3a479","#7d6f4f"]);
    dkPaper(c,x,y,bw,bh,["#ded2b0","#c6b78e","#8a7c58"]);
    dkRule(c,x+6,y+bh*.24,bw-12,6,bh*.1);
    c.strokeStyle="#8d949a";c.lineWidth=1.6;
    c.beginPath();
    c.moveTo(x+bw*.2,y+bh*.02);c.lineTo(x+bw*.2,y-4);
    c.lineTo(x+bw*.34,y-4);c.lineTo(x+bw*.34,y+bh*.12);
    c.stroke();
  },
  /* ДНЕВНИК — бланки зимовки */
  diary:(c,w,h)=>{
    const x=w*.18,y=h*.14,bw=w*.64,bh=h*.68;
    dkShadow(c,x,y,bw,bh);
    dkPaper(c,x,y,bw,bh,["#d5cdb6","#bcb298","#847c66"]);
    c.fillStyle="rgba(80,100,120,.16)";c.fillRect(x+4,y+4,bw-8,bh*.18);
    dkRule(c,x+6,y+bh*.36,bw-12,5,bh*.12,"rgba(70,86,104,.42)");
    c.strokeStyle="rgba(70,86,104,.5)";c.lineWidth=1;
    c.beginPath();c.moveTo(x+bw*.62,y+4);c.lineTo(x+bw*.62,y+bh-4);c.stroke();
  }
};

/* ── что лежит на столе ────────────────────────────────────────────────────
   `tabs` — закладки, которые эта вещь открывает. Одна закладка — ленты нет
   вовсе: выбирать не из чего. `live` — есть ли вещь у игрока. */
const DESK_ITEMS=[
  {id:"book",  ru:"ТЕТРАДЬ", note:"что слышали, что было, что сказали",
   tabs:["ether","bort","folk"], live:()=>true, wide:true},
  {id:"deeds", ru:"ДЕЛА",    note:"что вы должны и кому",
   tabs:["deeds"], live:()=>true},
  {id:"strips",ru:"ЛЕНТЫ",   note:"оторванные полосы самописца",
   tabs:["strips"], live:()=>((G.strips||[]).length>0)},
  {id:"things",ru:"ВЕЩИ",    note:"письма, находки, бумаги",
   tabs:["things"], live:()=>(typeof thingsAll==="function"&&thingsAll().length>0)},
  {id:"record",ru:"КНИЖКА",  note:"записи чужими руками",
   tabs:["record"], live:()=>true},
  {id:"album", ru:"АЛЬБОМ",  note:"снимки мест, где вы стояли",
   tabs:["album"], live:()=>(typeof albumAll==="function"&&albumAll().length>0)},
  {id:"mail",  ru:"ПОЧТА",   note:"карточки, скреплённые скрепкой",
   tabs:["mail","qsl"],
   live:()=>((typeof mailOn==="function"&&mailOn()&&
             (mailAll().st.length||(typeof albumAll==="function"&&albumAll().length)))||
             (typeof qslAll==="function"&&Object.keys(qslAll().heard).length))},
  {id:"books", ru:"ПОЛКА",   note:"что нашлось в обломках и уцелело",
   tabs:["books"], live:()=>((typeof bookCount==="function"&&bookCount()>0)||(typeof boxCount==="function"&&boxCount()>0))},
  {id:"smena", ru:"СМЕНА",   note:"роман · открывается, когда прожит",
   tabs:["smena"], live:()=>true},
  {id:"diary", ru:"ДНЕВНИК", note:"бланками, потому что писать некому",
   tabs:["diary"],
   live:()=>((typeof winOn==="function"&&winOn())||
             (typeof thingsAll==="function"&&thingsAll().some(t=>t.diary)))},
  {id:"relay", ru:"ПРИЁМНИКИ",note:"мачты, пойманные в шуме",
   tabs:["relay"], live:()=>(typeof relayAll==="function"&&Object.keys(relayAll()).length>0)},
  {id:"chess", ru:"ПАРТИЯ",  note:"ход в сутки, доска считается из ходов",
   tabs:["chess"], live:()=>(typeof chessAll==="function"&&Object.keys(chessAll().g).length>0)},
  {id:"lore",  ru:"ОТЧЁТ",   note:"«Долгий ход», по кускам",
   tabs:["lore"], live:()=>(typeof loreCount==="function"&&loreCount()>0)}
];
function deskItemOf(tab){
  /* null, а не «первая попавшаяся»: закладка, которой нет ни у одной вещи,
     не имеет права показать чужую ленту — лучше не показывать никакой */
  return DESK_ITEMS.find(it=>it.tabs.indexOf(tab)>=0)||null;
}
/* сургучная точка на вещи — сумма непрочитанного по её закладкам */
function deskItemNew(it){
  let n=0;
  for(const t of it.tabs)if(typeof tableNewBy==="function")n+=tableNewBy(t)|0;
  return n;
}
/* ── сам стол ── */
function renderDeskTop(box){
  box.textContent="";
  const dpr=Math.min(2,window.devicePixelRatio||1)*(typeof UIK==="number"?UIK:1);
  for(const it of DESK_ITEMS){
    let live=false;try{live=!!it.live();}catch(e){live=false;}
    if(!live)continue;
    const n=deskItemNew(it);
    const cell=document.createElement("div");
    cell.className="item"+(n?" new":"")+(it.wide?" wide":"");
    const cv=document.createElement("canvas");
    const w=it.wide?300:150,h=it.wide?150:96;
    cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);
    cv.style.width="100%";cv.style.height=h+"px";
    const c=cv.getContext("2d");
    c.setTransform(cv.width/w,0,0,cv.width/w,0,0);
    try{DESK_DRAW[it.id](c,w,h);}catch(e){}
    cell.appendChild(cv);
    const tx=document.createElement("em");tx.textContent=it.ru;
    const nt=document.createElement("s");nt.textContent=it.note;
    cell.appendChild(tx);cell.appendChild(nt);
    cell.onclick=()=>{sfx("ui");tableSetTab(it.tabs[0]);};
    box.appendChild(cell);
  }
}
