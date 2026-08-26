/* ══════════════ шахматы по почте ══════════════
   M192. Та же труба, что у открытки (25j): ход — это данные, значит правило
   «ничего напечатанного человеком не проходит» держится без единой оговорки.
   Партия анонимна ровно так же, как переписка: никто не знает, с кем играет,
   и узнаёт соперника по тому, как тот ходит.

   ОГОВОРКА, КОТОРУЮ НАДО ПРОИЗНЕСТИ. План просил делать это ПОСЛЕ того, как
   почта обживётся, — а почта появилась в ту же ночь и живых корреспондентов у
   неё пока нет. Веха сделана по прямой просьбе автора «делать всё подряд»;
   пока в куче никого, доска просто не заводится, и вреда от этого никакого.

   ПРАВИЛА ЗДЕСЬ НАСТОЯЩИЕ. Соблазн был сделать «доску, на которой фигуры
   двигаются как хочешь» — по переписке ведь и правда играли на доверии. Но
   игра, которая пускает ладью по диагонали, не шахматы, а шашечница: правила
   и есть содержание. Здесь ходы всех фигур, взятие на проходе, рокировка,
   превращение и запрет оставлять короля под боем. Мата и пата движок не
   объявляет сам — это делает тот, кто смотрит на доску, и по переписке всегда
   так и было.

   ХОД В СУТКИ. Не ограничение, а темп: у партии по переписке ход занимал
   неделю, и в этом была вся её прелесть. Сутки — компромисс, при котором
   партия живёт месяц, а не год.

   ПРАВИЛА ФАЙЛА:
   1. Позиция НЕ хранится: хранится список ходов, позиция считается из него.
      Так партию нельзя испортить рассинхроном, и так же её видит соперник.
   2. Ни одного напечатанного знака по проводу: ход — три маленьких числа. */
const CH_START="rnbqkbnrpppppppp................................PPPPPPPPRNBQKBNR";
const CH_DIRS={
  n:[[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]],
  b:[[1,1],[1,-1],[-1,-1],[-1,1]],
  r:[[1,0],[0,1],[-1,0],[0,-1]],
  k:[[1,1],[1,0],[1,-1],[0,-1],[0,1],[-1,-1],[-1,0],[-1,1]]
};
const CH_PROMO=["q","r","b","n"];
function chWhite(p){return p>="A"&&p<="Z";}
function chBlack(p){return p>="a"&&p<="z";}
function chMine(p,w){return p!=="."&&(w?chWhite(p):chBlack(p));}
function chAt(B,f,r){return (f<0||f>7||r<0||r>7)?null:B[r*8+f];}
/* ── позиция из списка ходов ──
   Единственный источник правды. Список ходов и есть партия; доска — его
   пересказ, и потому рассинхрона между двумя концами не бывает в принципе. */
function chPosition(moves){
  let B=CH_START.split("");
  const st={ep:-1,wk:true,wq:true,bk:true,bq:true};
  for(const m of (moves||[]))chApply(B,st,m);
  return {B,st,turn:((moves||[]).length%2===0)};
}
/* ход применяется без проверок: проверку делает chLegal до того, как ход
   попадёт в список. Здесь только механика доски */
function chApply(B,st,m){
  const f=m.f|0,t=m.t|0;
  const p=B[f];
  const ff=f%8, fr=(f/8)|0, tf=t%8, tr=(t/8)|0;
  const w=chWhite(p);
  /* взятие на проходе: пешка идёт по диагонали на пустое поле */
  if((p==="P"||p==="p")&&tf!==ff&&B[t]==="."){
    B[fr*8+tf]=".";
  }
  /* рокировка: король ходит на две клетки — ладья прыгает через него */
  if((p==="K"||p==="k")&&Math.abs(tf-ff)===2){
    const rf=tf>ff?7:0, nf=tf>ff?tf-1:tf+1;
    B[fr*8+nf]=B[fr*8+rf];B[fr*8+rf]=".";
  }
  B[t]=p;B[f]=".";
  /* превращение */
  if(p==="P"&&tr===0)B[t]=(CH_PROMO[m.p|0]||"q").toUpperCase();
  if(p==="p"&&tr===7)B[t]=(CH_PROMO[m.p|0]||"q");
  /* поле для взятия на проходе живёт ровно один ход */
  st.ep=((p==="P"||p==="p")&&Math.abs(tr-fr)===2)?(((fr+tr)/2)*8+ff):-1;
  /* права на рокировку теряются навсегда */
  if(p==="K"){st.wk=st.wq=false;}
  if(p==="k"){st.bk=st.bq=false;}
  if(f===56||t===56)st.wq=false;
  if(f===63||t===63)st.wk=false;
  if(f===0||t===0)st.bq=false;
  if(f===7||t===7)st.bk=false;
}
/* бьётся ли поле стороной w */
function chAttacked(B,sq,w){
  const sf=sq%8, sr=(sq/8)|0;
  /* пешки */
  const pd=w?1:-1;                       /* белые идут вверх (к меньшим r) */
  const pw=w?"P":"p";
  for(const df of [-1,1]){
    const p=chAt(B,sf+df,sr+pd);
    if(p===pw)return true;
  }
  for(const d of CH_DIRS.n){
    const p=chAt(B,sf+d[0],sr+d[1]);
    if(p===(w?"N":"n"))return true;
  }
  for(const d of CH_DIRS.k){
    const p=chAt(B,sf+d[0],sr+d[1]);
    if(p===(w?"K":"k"))return true;
  }
  const slide=(dirs,ps)=>{
    for(const d of dirs){
      let f=sf+d[0],r=sr+d[1];
      while(f>=0&&f<8&&r>=0&&r<8){
        const p=B[r*8+f];
        if(p!=="."){if(ps.indexOf(p)>=0)return true;break;}
        f+=d[0];r+=d[1];
      }
    }
    return false;
  };
  if(slide(CH_DIRS.b,w?"BQ":"bq"))return true;
  if(slide(CH_DIRS.r,w?"RQ":"rq"))return true;
  return false;
}
function chKing(B,w){
  const k=w?"K":"k";
  for(let i=0;i<64;i++)if(B[i]===k)return i;
  return -1;
}
/* ── куда может пойти фигура ──
   Псевдоходы: правила фигуры, но без проверки на собственного короля. */
function chPseudo(B,st,sq){
  const p=B[sq];if(p===".")return [];
  const w=chWhite(p),k=p.toLowerCase();
  const f=sq%8,r=(sq/8)|0,out=[];
  const add=(nf,nr)=>{
    if(nf<0||nf>7||nr<0||nr>7)return false;
    const q=B[nr*8+nf];
    if(q!=="."&&chMine(q,w))return false;
    out.push(nr*8+nf);
    return q===".";
  };
  if(k==="p"){
    const d=w?-1:1, home=w?6:1, last=w?0:7;
    if(chAt(B,f,r+d)==="."){
      out.push((r+d)*8+f);
      if(r===home&&chAt(B,f,r+2*d)===".")out.push((r+2*d)*8+f);
    }
    for(const df of [-1,1]){
      const q=chAt(B,f+df,r+d);
      if(q!==null&&q!=="."&&!chMine(q,w))out.push((r+d)*8+f+df);
      /* взятие на проходе */
      if(st&&st.ep>=0&&st.ep===(r+d)*8+f+df&&q===".")out.push(st.ep);
    }
  }else if(k==="n"){
    for(const d of CH_DIRS.n)add(f+d[0],r+d[1]);
  }else if(k==="k"){
    for(const d of CH_DIRS.k)add(f+d[0],r+d[1]);
    /* рокировка: король и ладья не ходили, между ними пусто, и король не идёт
       ни из-под шаха, ни через битое поле, ни под шах */
    if(st&&!chAttacked(B,sq,!w)){
      const rr=w?7:0;
      const canK=w?st.wk:st.bk, canQ=w?st.wq:st.bq;
      if(canK&&B[rr*8+5]==="."&&B[rr*8+6]==="."&&
         !chAttacked(B,rr*8+5,!w)&&!chAttacked(B,rr*8+6,!w))out.push(rr*8+6);
      if(canQ&&B[rr*8+1]==="."&&B[rr*8+2]==="."&&B[rr*8+3]==="."&&
         !chAttacked(B,rr*8+3,!w)&&!chAttacked(B,rr*8+2,!w))out.push(rr*8+2);
    }
  }else{
    const dirs=k==="b"?CH_DIRS.b:(k==="r"?CH_DIRS.r:CH_DIRS.b.concat(CH_DIRS.r));
    for(const d of dirs){
      let nf=f+d[0],nr=r+d[1];
      while(add(nf,nr)){nf+=d[0];nr+=d[1];}
    }
  }
  return out;
}
/* законные ходы: те псевдоходы, после которых свой король не под боем */
function chMoves(B,st,sq){
  const p=B[sq];if(p===".")return [];
  const w=chWhite(p);
  return chPseudo(B,st,sq).filter(t=>{
    const B2=B.slice(), st2=Object.assign({},st);
    chApply(B2,st2,{f:sq,t,p:0});
    return !chAttacked(B2,chKing(B2,w),!w);
  });
}
/* все законные ходы стороны: по ним и видно, что партия кончилась */
function chAllMoves(B,st,w){
  const out=[];
  for(let i=0;i<64;i++)if(chMine(B[i],w))
    for(const t of chMoves(B,st,i))out.push({f:i,t});
  return out;
}
function chCheck(B,w){return chAttacked(B,chKing(B,w),!w);}
/* состояние партии словами: мат, пат, шах или ничего */
function chState(moves){
  const P=chPosition(moves);
  const w=P.turn;
  const any=chAllMoves(P.B,P.st,w).length;
  if(any)return chCheck(P.B,w)?"шах":"";
  return chCheck(P.B,w)?"мат":"пат";
}
function chLegal(moves,m){
  const P=chPosition(moves);
  if(!chMine(P.B[m.f|0],P.turn))return false;
  return chMoves(P.B,P.st,m.f|0).indexOf(m.t|0)>=0;
}
/* ── партии ──
   Одна на цепочку переписки: партия и переписка — это одно и то же знакомство,
   и заводить для неё второй список корреспондентов незачем. */
function chessAll(){
  if(!G.chess||typeof G.chess!=="object")G.chess={g:{}};
  if(!G.chess.g||typeof G.chess.g!=="object")G.chess.g={};
  return G.chess;
}
function chessGame(ch){return chessAll().g[ch]||null;}
function chessStart(ch,mine){
  const C=chessAll();
  if(C.g[ch])return C.g[ch];
  C.g[ch]={mv:[],w:mine?1:0,t:Date.now()};
  return C.g[ch];
}
/* мой ли ход: белые ходят чётными номерами */
function chessMyTurn(ch){
  const g=chessGame(ch);if(!g)return false;
  const white=(g.mv.length%2===0);
  return white===!!g.w;
}
/* ход в сутки на партию: темп переписки, а не ограничение */
function chessCanMove(ch){
  const g=chessGame(ch);if(!g)return false;
  if(!chessMyTurn(ch))return false;
  return (Date.now()-(g.sent||0))>=86400000||!g.sent;
}
function chessMove(ch,m){
  const g=chessGame(ch);if(!g)return false;
  if(!chessMyTurn(ch)||!chLegal(g.mv,m))return false;
  g.mv.push({f:m.f|0,t:m.t|0,p:m.p|0});
  g.sent=Date.now();
  const s=chState(g.mv);
  if(s)logAdd("good","Ход послан · "+s);
  else logAdd("tech","Ход послан. Ответ придёт не скоро.");
  return true;
}
/* ход, пришедший с той стороны */
function chessTake(ch,m){
  const g=chessGame(ch)||chessStart(ch,false);
  if(chessMyTurn(ch))return false;                 /* не его очередь — не берём */
  if(!chLegal(g.mv,m))return false;                /* незаконный ход не ложится */
  g.mv.push({f:m.f|0,t:m.t|0,p:m.p|0});
  const s=chState(g.mv);
  logAdd("good","Пришёл ход"+(s?" · "+s:""));
  tell("good","Пришёл ход"+(s?": "+s:""),"ПРИШЁЛ ХОД"+(s?"\n"+s.toUpperCase():"")+"\nдоска на столе");
  return true;
}

/* ── доска на столе ──
   Клетки, фигуры знаками, и подсветка возможных ходов у поднятой фигуры.
   Фигуры — юникодные знаки, а не рисунок: шахматная фигура узнаётся формой,
   которую все знают наизусть, и рисовать её заново значило бы делать её хуже. */
const CH_GLYPH={K:"♔",Q:"♕",R:"♖",B:"♗",N:"♘",P:"♙",
                k:"♚",q:"♛",r:"♜",b:"♝",n:"♞",p:"♟"};
let chSel=-1, chOpen="";
function chessDraw(cv,ch,flip){
  const g=chessGame(ch);if(!g)return;
  const P=chPosition(g.mv);
  const c=cv.getContext("2d");
  const S=cv.width/8;
  const idx=(i)=>flip?63-i:i;
  const legal=(chSel>=0&&chessMyTurn(ch))?chMoves(P.B,P.st,chSel):[];
  for(let i=0;i<64;i++){
    const j=idx(i), f=i%8, r=(i/8)|0;
    c.fillStyle=((f+r)%2)?"#8a7050":"#d8c8a8";
    c.fillRect(f*S,r*S,S,S);
    if(j===chSel){c.fillStyle="rgba(240,200,110,.55)";c.fillRect(f*S,r*S,S,S);}
    else if(legal.indexOf(j)>=0){
      c.fillStyle="rgba(120,200,140,.42)";
      c.beginPath();c.arc(f*S+S/2,r*S+S/2,S*0.17,0,TAU);c.fill();
    }
    const p=P.B[j];
    if(p&&p!=="."){
      c.fillStyle=chWhite(p)?"#f6f2e8":"#20242a";
      c.font=Math.round(S*0.82)+"px serif";
      c.textAlign="center";c.textBaseline="middle";
      /* обвод: белая фигура на светлой клетке и чёрная на тёмной иначе тонут */
      c.strokeStyle=chWhite(p)?"rgba(20,22,26,.7)":"rgba(240,236,226,.55)";
      c.lineWidth=Math.max(1,S*0.030);
      c.strokeText(CH_GLYPH[p]||p,f*S+S/2,r*S+S*0.54);
      c.fillText(CH_GLYPH[p]||p,f*S+S/2,r*S+S*0.54);
    }
  }
  c.textAlign="left";c.textBaseline="alphabetic";
}
/* ── закладка ──
   Партии живут в тех же стопках, что переписка, и потому список здесь тот же:
   цепочка, доска, чей ход. Ответ уходит вместе с карточкой. */
function renderChess(box){
  box.innerHTML="";
  const C=chessAll();
  const keys=Object.keys(C.g||{});
  if(!keys.length){
    tableRow(box,"dim","","партий нет: партия заводится ходом, посланным вместе с карточкой в стопке");
    return;
  }
  const wrap=document.createElement("div");wrap.className="album mail";
  for(const ch of keys){
    const g=C.g[ch];
    const st=chState(g.mv);
    const mine=chessMyTurn(ch);
    const pack=document.createElement("div");
    pack.className="pack open"+(mine?"":" mute");
    const hd=document.createElement("div");hd.className="ph";
    hd.innerHTML="<b>ПАРТИЯ · ХОД "+(g.mv.length+1)+"</b><s>"+
      (st?st:(mine?"ваш ход":"ждём ответа"))+" · вы "+(g.w?"белые":"чёрные")+"</s>";
    pack.appendChild(hd);
    const row=document.createElement("div");row.className="row";
    const cv=document.createElement("canvas");
    cv.width=352;cv.height=352;cv.style.width="264px";cv.style.height="264px";
    cv.style.borderRadius="2px";
    chessDraw(cv,ch,!g.w);
    cv.onclick=(e)=>{
      if(!mine||st==="мат"||st==="пат")return;
      const rc=cv.getBoundingClientRect();
      const f=Math.floor((e.clientX-rc.left)/rc.width*8);
      const r=Math.floor((e.clientY-rc.top)/rc.height*8);
      let sq=r*8+f; if(!g.w)sq=63-sq;
      const P=chPosition(g.mv);
      if(chSel>=0&&chMoves(P.B,P.st,chSel).indexOf(sq)>=0){
        const m={f:chSel,t:sq,p:0};
        chSel=-1;
        chessMove(ch,m);
        /* ход уходит вместе с карточкой: партия — это та же переписка */
        const card=albumAll().find(a=>postSigned(a));
        if(card&&typeof mailSend==="function")mailSend(card,ch,m);
        else logAdd("dim","Ход записан. Уйдёт со следующей карточкой.");
      }else chSel=chMine(P.B[sq],P.turn)?sq:-1;
      tableRender();
    };
    row.appendChild(cv);
    pack.appendChild(row);
    wrap.appendChild(pack);
  }
  box.appendChild(wrap);
}
