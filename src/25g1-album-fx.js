/* ══════════════ альбом: большая карточка, фильтры, снимок себе (P13, плейтест §4.3) ══════════════
   Автор: «фото должны открываться большими по тычку»; «оставить перерисовку
   из снимка, но рисовать куда лучше — фотофильтры»; «настоящий красивый
   скриншот себе в галерею, с подписью — и ничего на нашем сервере».
   • Тычок по карточке — во весь экран (#albumLb), в настоящих пикселях экрана;
   • фильтр на карточку: ПЛЁНКА, СЕПИЯ, ХОЛОД, НОЧЬ — поверх той же
     перерисовки; выбор лежит в снимке (s.fx, пара байт), случай — от снимка,
     не от Math.random;
   • СОХРАНИТЬ — PNG с полосой подписи («ДРЕЙФ» · место · сектор · час) на
     устройство игрока, скачиванием. На сервер не уходит ничего. */
const ALBUM_FX={
  none:{ru:"КАК ЕСТЬ"},
  film:{ru:"ПЛЁНКА"},
  sepia:{ru:"СЕПИЯ"},
  cold:{ru:"ХОЛОД"},
  night:{ru:"НОЧЬ"}
};
function albumFx(c,w,h,s,dpr){
  const fx=s&&s.fx;if(!fx||fx==="none"||!ALBUM_FX[fx])return;
  const W2=Math.round(w*dpr),H2=Math.round(h*dpr);
  let img;try{img=c.getImageData(0,0,W2,H2);}catch(e){return;}
  const d=img.data,r=rng(hashi(s.sx|0,s.sy|0,(s.t|0)^0xF11A));
  const grain=fx==="film"?18:fx==="night"?26:fx==="sepia"?10:6;
  for(let i=0;i<d.length;i+=4){
    let R=d[i],Gc=d[i+1],B=d[i+2];
    const L=.3*R+.59*Gc+.11*B;
    if(fx==="film"){R=R*.92+30;Gc=Gc*.9+22;B=B*.82+18;}                 /* выцветшие чёрные, тёплый свет */
    else if(fx==="sepia"){R=L*1.07+28;Gc=L*.88+14;B=L*.66;}
    else if(fx==="cold"){R=R*.86;Gc=Gc*.97+4;B=B*1.08+14;const k=1.12;R=(R-128)*k+128;Gc=(Gc-128)*k+128;B=(B-128)*k+128;}
    else if(fx==="night"){R=L*.35;Gc=L*1.05+10;B=L*.45;}                /* прибор ночного видения */
    const n=(r()-.5)*grain;
    d[i]=clamp(R+n,0,255);d[i+1]=clamp(Gc+n,0,255);d[i+2]=clamp(B+n,0,255);
  }
  c.save();c.setTransform(1,0,0,1,0,0);c.putImageData(img,0,0);c.restore();
  /* виньетка: край темнеет, как у настоящего объектива */
  const g=c.createRadialGradient(w/2,h/2,Math.min(w,h)*.35,w/2,h/2,Math.hypot(w,h)*.55);
  g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,fx==="night"?"rgba(0,10,0,.7)":"rgba(0,0,0,.45)");
  c.fillStyle=g;c.fillRect(0,0,w,h);
}
/* одна карточка на холсте: перерисовка + фильтр */
function albumCanvas(s,cw,ch,dpr){
  const cv=document.createElement("canvas");
  cv.width=Math.round(cw*dpr);cv.height=Math.round(ch*dpr);
  cv.style.width=cw+"px";cv.style.height=ch+"px";
  const cc=cv.getContext("2d");
  if(!cc)return cv;
  cc.scale(dpr,dpr);
  if(!drawPostcard(cc,s,cw,ch)){cc.fillStyle="#12161d";cc.fillRect(0,0,cw,ch);}
  else albumFx(cc,cw,ch,s,dpr);
  return cv;
}
function albumDpr(){return Math.min(3,(typeof window!=="undefined"&&window.devicePixelRatio)||1);}
function albumClose(){const w=document.getElementById("albumLb");if(w)w.remove();}
/* во весь экран: карточка, фильтры, подписать / отправить / сохранить */
function albumLightbox(s,i){
  albumClose();
  const lb=document.createElement("div");lb.id="albumLb";
  const vw=(typeof window!=="undefined"?window.innerWidth:390),vh=(typeof window!=="undefined"?window.innerHeight:844);
  const cw=Math.round(Math.min(vw-24,(vh-220)/.625,1100)),ch=Math.round(cw*.625);
  const host=document.createElement("div");host.className="lb-card";
  if(albumBack&&typeof renderCardBack==="function"){
    const side=document.createElement("div");side.className="side";side.style.width=cw+"px";side.style.minHeight=ch+"px";
    renderCardBack(side,s,()=>tableRender());host.appendChild(side);
  }else host.appendChild(albumCanvas(s,cw,ch,albumDpr()));
  lb.appendChild(host);
  const cap=document.createElement("div");cap.className="lb-cap";
  cap.textContent=postCaption(s)+(s.ver&&s.ver!==VER?" · снято на "+s.ver:"");
  lb.appendChild(cap);
  if(!albumBack){
    const fr=document.createElement("div");fr.className="lb-fx";
    /* фильтр показывает себя (D23): карточка перерисована ОДИН раз в малый
       холст, пять фильтров — по его копиям; на телефоне это пять проходов по
       пикселям размером с ноготь, а не пять перерисовок */
    const tw=Math.max(44,Math.min(64,Math.floor((vw-56)/5)-10)),th=Math.round(tw*.625),td=Math.min(2,albumDpr());
    const base=albumCanvas(Object.assign({},s,{fx:"none"}),tw,th,td);
    for(const k in ALBUM_FX){
      const b=document.createElement("button");b.className="chip fxth"+(((s.fx||"none")===k)?" on":"");
      const cv=document.createElement("canvas");cv.width=base.width;cv.height=base.height;cv.style.width=tw+"px";cv.style.height=th+"px";
      const cc=cv.getContext("2d");
      if(cc){cc.scale(td,td);cc.drawImage(base,0,0,tw,th);albumFx(cc,tw,th,Object.assign({},s,{fx:k}),td);}
      b.appendChild(cv);b.appendChild(document.createElement("span")).textContent=ALBUM_FX[k].ru;
      b.onclick=e=>{e.stopPropagation();s.fx=k;albumLightbox(s,i);};
      fr.appendChild(b);
    }
    lb.appendChild(fr);
  }
  const row=document.createElement("div");row.className="lb-acts";
  const mk=(t,cls,fn)=>{const b=document.createElement("button");b.className="act "+(cls||"");b.textContent=t;b.onclick=e=>{e.stopPropagation();fn();};row.appendChild(b);return b;};
  const signed=(typeof postSigned==="function")&&postSigned(s);
  mk(albumBack?"ЛИЦО":(signed?"ПЕРЕВЕРНУТЬ":"ПОДПИСАТЬ"),"",()=>{
    if(!albumBack&&!signed&&typeof postSign==="function")postSign(s);
    albumBack=!albumBack;tableRender();});
  if(signed&&typeof mailOn==="function"&&mailOn()){
    const left=mailLeft(),b=mk(left>0?"ОТПРАВИТЬ":"СЕГОДНЯ ХВАТИТ","gold",()=>mailSend(s,null));b.disabled=left<=0;
  }
  if(!albumBack)mk("СОХРАНИТЬ СЕБЕ","",()=>albumSave(s));
  mk("ЗАКРЫТЬ","",()=>{albumOpen=-1;albumBack=false;albumClose();tableRender();});
  lb.appendChild(row);
  lb.onclick=e=>{if(e.target===lb){albumOpen=-1;albumBack=false;albumClose();tableRender();}};
  document.body.appendChild(lb);
}
/* снимок себе — страницей альбома (D23): чёрная бумага с зерном, карточка в
   кремовой рамке на четырёх уголках, подпись белым карандашом под ней. Тот же
   язык, что у большой карточки в игре, — снимок узнаётся своим */
function albumSave(s){
  const cw=1200,ch=750,m=16,pad=64,capH=118,PW=cw+2*(pad+m),PH=ch+2*m+pad+capH;
  const cv=document.createElement("canvas");cv.width=PW;cv.height=PH;
  const c=cv.getContext("2d");if(!c)return false;
  const g=c.createRadialGradient(PW/2,PH*.3,0,PW/2,PH*.3,PW*.8);
  g.addColorStop(0,"#2a231c");g.addColorStop(.7,"#15110d");g.addColorStop(1,"#120e0b");
  c.fillStyle=g;c.fillRect(0,0,PW,PH);
  const r=rng(hashi(s.sx|0,s.sy|0,(s.t|0)^0xA1B));
  for(let i=0;i<PW*PH/70;i++){c.fillStyle=i&1?"rgba(255,240,220,.035)":"rgba(0,0,0,.22)";c.fillRect(r()*PW|0,r()*PH|0,1,1);}
  const x0=pad,y0=pad;
  c.save();c.shadowColor="rgba(0,0,0,.72)";c.shadowBlur=28;c.shadowOffsetY=7;
  c.fillStyle="#f3ecdc";c.fillRect(x0,y0,cw+2*m,ch+2*m);c.restore();
  c.drawImage(albumCanvas(s,cw,ch,1),x0+m,y0+m);
  /* фотоуголки: тёмная бумага поверх рамки, светлая кромка по гипотенузе */
  const L=46,o=10,C=[[x0-o,y0-o,1,1],[x0+cw+2*m+o,y0-o,-1,1],[x0-o,y0+ch+2*m+o,1,-1],[x0+cw+2*m+o,y0+ch+2*m+o,-1,-1]];
  for(const [qx,qy,sx,sy] of C){
    c.fillStyle="#3b2f22";c.beginPath();c.moveTo(qx,qy);c.lineTo(qx+sx*L,qy);c.lineTo(qx,qy+sy*L);c.closePath();c.fill();
    c.strokeStyle="rgba(255,236,200,.14)";c.lineWidth=1.5;c.beginPath();c.moveTo(qx+sx*L,qy);c.lineTo(qx,qy+sy*L);c.stroke();
  }
  const cy=y0+ch+2*m+capH*.42;
  c.textAlign="center";c.textBaseline="middle";
  c.fillStyle="rgba(236,228,210,.9)";c.font="italic 32px Georgia,\"Times New Roman\",serif";
  c.fillText("«Дрейф» · "+postCaption(s),PW/2,cy,PW-2*pad);
  c.fillStyle="rgba(200,184,150,.55)";c.font="17px ui-monospace,monospace";
  c.fillText("сектор "+(s.sx|0)+":"+(s.sy|0)+" · drift-game.ru",PW/2,cy+38);
  const name="drift-"+(s.sx|0)+"_"+(s.sy|0)+"-"+(s.t|0)+".png";
  const go=url=>{const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();};
  if(cv.toBlob)cv.toBlob(b=>{if(!b)return;const u=URL.createObjectURL(b);go(u);setTimeout(()=>URL.revokeObjectURL(u),4000);},"image/png");
  else go(cv.toDataURL("image/png"));
  if(typeof say==="function")say("Снимок сохранён на устройство",90);
  return true;
}
