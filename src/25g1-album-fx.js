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
    for(const k in ALBUM_FX){
      const b=document.createElement("button");b.className="chip"+(((s.fx||"none")===k)?" on":"");b.textContent=ALBUM_FX[k].ru;
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
/* снимок себе: карточка крупно и полоса подписи — PNG скачиванием */
function albumSave(s){
  const cw=1200,ch=750,band=64;
  const cv=document.createElement("canvas");cv.width=cw;cv.height=ch+band;
  const c=cv.getContext("2d");if(!c)return false;
  if(!drawPostcard(c,s,cw,ch)){c.fillStyle="#12161d";c.fillRect(0,0,cw,ch);}else albumFx(c,cw,ch,s,1);
  c.fillStyle="#f3ecdc";c.fillRect(0,ch,cw,band);
  c.fillStyle="#2a241a";c.font="600 24px Georgia,serif";c.textBaseline="middle";
  c.fillText("«Дрейф» · "+postCaption(s),24,ch+band/2);
  c.font="16px ui-monospace,monospace";c.textAlign="right";c.fillStyle="#7a6a50";
  c.fillText("сектор "+(s.sx|0)+":"+(s.sy|0)+" · drift-game.ru",cw-24,ch+band/2);
  const name="drift-"+(s.sx|0)+"_"+(s.sy|0)+"-"+(s.t|0)+".png";
  const go=url=>{const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();};
  if(cv.toBlob)cv.toBlob(b=>{if(!b)return;const u=URL.createObjectURL(b);go(u);setTimeout(()=>URL.revokeObjectURL(u),4000);},"image/png");
  else go(cv.toDataURL("image/png"));
  if(typeof say==="function")say("Снимок сохранён на устройство",90);
  return true;
}
