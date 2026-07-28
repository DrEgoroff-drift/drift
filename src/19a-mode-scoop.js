/* ══════════════ сбор летучих газов: заход в атмосферу гиганта ══════════════ */
/* Газовый гигант перестал быть красивой картинкой, мимо которой пролетаешь:
   сесть на него по-прежнему нельзя, но можно пройти по касательной в верхних
   слоях и набрать летучие газы. Смысл сцены — узкий коридор высоты: выше
   сборник хватает пустоту, ниже растёт нагрев, а турбулентность всё время
   сбивает с высоты, поэтому это работа руками, а не полоска прогресса. */
const SCOOP_BAND=[.50,.63];        // коридор сбора в долях высоты экрана
function scoopBand(){return [H*SCOOP_BAND[0],H*SCOOP_BAND[1]];}
function startScoop(p){
  G.scoop={p,y:H*.34,vy:0,heat:0,bank:0,got:0,x:0,phase:rng(hashi(p.seed,0x6A5,3))()*TAU,
    lastWarn:0,shake:0};
  G.mode="scoop";G.ap=null;G.orbit=null;
  for(const k in keys)keys[k]=false;
  document.querySelectorAll(".pads button").forEach(b=>b.classList.remove("on"));
  say("Заход в атмосферу\n"+p.name+"\n▲ ▼ — высота · держитесь в полосе сбора\nНАЗАД — уход на орбиту");
}
function exitScoop(msg){
  const S=G.scoop,p=S.p;
  const a=Math.atan2(G.ship.y-p.y,G.ship.x-p.x)||0;
  G.ship.x=p.x+Math.cos(a)*(p.radius+150);G.ship.y=p.y+Math.sin(a)*(p.radius+150);
  G.ship.vx=p.vx||0;G.ship.vy=p.vy||0;
  G.scoop=null;G.mode="system";
  saveGame(true);
  say(msg+"\nлетучих газов в трюме: "+G.cargo.volatiles);
}
function updateScoop(dt){
  const S=G.scoop,st=stat(),[bt,bb]=scoopBand();
  S.x+=(5.2+st.thr*.7)*dt;S.phase+=dt*.03;
  /* высота: тяга поднимает, тормоз прижимает, и всегда есть снос вниз —
     висеть в коридоре, ничего не трогая, не получится */
  if(keys.thrust&&G.fuel>0){S.vy-=.055*st.thr*dt;G.fuel=Math.max(0,G.fuel-.016*dt);}
  if(keys.brake)S.vy+=.045*dt;
  S.vy+=.021*dt;
  /* турбулентность: чем глубже, тем сильнее болтанка */
  const deep=clamp((S.y-bt)/(H*.3),0,1.6);
  S.vy+=Math.sin(S.x*.021+S.phase)*.012*dt*(.4+deep*1.9);
  S.vy+=Math.sin(S.x*.0071+S.phase*2.3)*.02*dt*(.3+deep);
  S.vy*=Math.pow(.94,dt);
  S.y=clamp(S.y+S.vy*dt*4,H*.14,H*.86);
  if(S.y<=H*.14+.5&&S.vy<0)S.vy=0;
  S.bank+=(clamp(S.vy*.5,-.7,.7)-S.bank)*Math.min(1,.09*dt);
  S.shake=Math.max(0,S.shake-dt*.05);
  /* нагрев копится только ниже коридора и медленно стравливается выше него */
  if(S.y>bb){
    S.heat=Math.min(120,S.heat+(S.y-bb)*.019*dt);
    S.shake=Math.min(1,S.shake+(S.y-bb)*.0016*dt);
  }else S.heat=Math.max(0,S.heat-.34*dt);
  if(S.heat>=100){
    G.hull-=.5*dt;
    if(G.t-S.lastWarn>90){S.lastWarn=G.t;sfx("hit");}
    if(G.hull<=0){G.scoop=null;G.mode="system";wreck();return;}
  }
  /* сбор идёт только в коридоре и только пока есть место в трюме */
  const inBand=S.y>=bt&&S.y<=bb;
  const full=held()>=st.cargoMax;
  if(inBand&&!full){
    S.got+=(.008+st.drill*.004)*dt;
    while(S.got>=1){S.got-=1;if(addRes("volatiles",1))sfx("drill");}
  }
  if(keys.left)S.vy-=.006*dt;      // мелкая доводка рулями, чтобы удержание было точнее
  if(keys.right)S.vy+=.006*dt;
  const heat=Math.round(S.heat);
  G.prompt=(full?"ТРЮМ ПОЛОН · НАЗАД — УХОД":
      inBand?"СБОР ИДЁТ · ДЕРЖИТЕ ВЫСОТУ":
      S.y<bt?"ВЫШЕ КОРИДОРА · СБОРНИК ХВАТАЕТ ПУСТОТУ":"НИЖЕ КОРИДОРА · НАГРЕВ РАСТЁТ")+
    "\nНАГРЕВ "+heat+"% · ГАЗЫ "+G.cargo.volatiles+" · ТРЮМ "+held()+"/"+st.cargoMax;
  if(G.fuel<=0&&S.y>bb)G.prompt="ТОПЛИВО КОНЧИЛОСЬ · ПОДНЯТЬСЯ НЕЧЕМ";
}
function drawScoop(){
  const S=G.scoop,p=S.p,[bt,bb]=scoopBand();
  const pal=p.T.pal;
  const sh=(S.shake>0?(Math.random()-.5)*S.shake*7:0);
  ctx.save();ctx.translate(0,sh);
  /* небо гиганта: сверху разрежённая тьма, ниже — всё плотнее слои */
  const g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,"#05070c");
  g.addColorStop(.28,"rgb("+pal[0].join(",")+")");
  g.addColorStop(.62,"rgb("+pal[2].join(",")+")");
  g.addColorStop(1,"rgb("+pal[4].join(",")+")");
  ctx.fillStyle=g;ctx.fillRect(0,-20,W,H+40);
  /* полосы облаков едут навстречу — это и есть ощущение скорости */
  for(let i=0;i<26;i++){
    const rr=rng(hashi(p.seed,i*613,0xC10D));
    const yy=H*.16+rr()*H*.9, hgt=6+rr()*30;
    const spd=.35+rr()*1.5, off=(S.x*spd*7+rr()*4000)%(W+520)-260;
    const c=pal[1+Math.floor(rr()*4)];
    ctx.fillStyle="rgba("+c.join(",")+","+(.14+rr()*.3).toFixed(2)+")";
    ctx.beginPath();ctx.ellipse(off,yy,150+rr()*260,hgt,0,0,TAU);ctx.fill();
  }
  /* коридор сбора: единственная подсказка, где держаться */
  ctx.fillStyle="rgba(127,224,200,.10)";ctx.fillRect(0,bt,W,bb-bt);
  ctx.strokeStyle="rgba(127,224,200,.55)";ctx.lineWidth=1.5;ctx.setLineDash([12,10]);
  ctx.beginPath();ctx.moveTo(0,bt);ctx.lineTo(W,bt);ctx.stroke();
  ctx.beginPath();ctx.moveTo(0,bb);ctx.lineTo(W,bb);ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle="rgba(127,224,200,.7)";ctx.font="9px ui-monospace,monospace";ctx.textAlign="left";
  ctx.fillText("ПОЛОСА СБОРА",14,bt-6);
  /* горизонт нижних слоёв — туда лучше не опускаться */
  const hz=H*.82;
  const hg=ctx.createLinearGradient(0,hz-40,0,H);
  hg.addColorStop(0,"rgba(255,150,90,0)");hg.addColorStop(1,"rgba(255,120,60,.5)");
  ctx.fillStyle=hg;ctx.fillRect(0,hz-40,W,H-hz+40);
  /* корабль: летит боком, слева направо, с набегающим потоком */
  const sx=W*.34,sy=S.y;
  if(S.y>bb){
    const k=clamp((S.y-bb)/120,0,1);
    ctx.strokeStyle="rgba(255,170,90,"+(.25+k*.5).toFixed(2)+")";ctx.lineWidth=2;
    for(let i=0;i<9;i++){
      const yy=sy-26+i*6.5, l=30+Math.abs(Math.sin(i*1.7+S.x*.05))*70*k;
      ctx.beginPath();ctx.moveTo(sx-14,yy);ctx.lineTo(sx-14-l,yy+ (i-4)*1.6);ctx.stroke();
    }
  }
  ctx.save();ctx.translate(sx,sy);ctx.rotate(S.bank*.5);
  drawHull(G.shipId,keys.thrust&&G.fuel>0,false,S.bank);
  ctx.restore();
  /* сборник: два раструба забирают газ, пока корабль в коридоре */
  if(sy>=bt&&sy<=bb){
    ctx.strokeStyle="rgba(127,224,200,.8)";ctx.lineWidth=1.6;
    for(const s of [-1,1]){
      ctx.beginPath();
      ctx.moveTo(sx-6,sy+s*7);ctx.lineTo(sx-30,sy+s*13);ctx.stroke();
      for(let i=0;i<5;i++){
        const t=(S.x*4+i*22)%110;
        ctx.globalAlpha=.5-t/220;
        ctx.beginPath();ctx.arc(sx-30-t,sy+s*13+Math.sin(t*.1+i)*4,1.8,0,TAU);ctx.stroke();
      }
      ctx.globalAlpha=1;
    }
  }
  ctx.restore();
  /* приборы: нагрев — главный, он же и убивает */
  const bw=Math.min(W-40,300),bx=W/2-bw/2,by=26;
  ctx.fillStyle="rgba(6,10,16,.72)";ctx.fillRect(bx-6,by-6,bw+12,20);
  ctx.strokeStyle="rgba(242,178,92,.5)";ctx.lineWidth=1;ctx.strokeRect(bx-6,by-6,bw+12,20);
  const hk=clamp(S.heat/100,0,1);
  ctx.fillStyle=hk>.8?"rgba(255,80,60,.95)":(hk>.5?"rgba(255,180,80,.9)":"rgba(127,224,200,.85)");
  ctx.fillRect(bx,by,bw*hk,8);
  ctx.fillStyle="rgba(242,178,92,.85)";ctx.font="9px ui-monospace,monospace";ctx.textAlign="center";
  ctx.fillText("НАГРЕВ КОРПУСА "+Math.round(S.heat)+"%",W/2,by+16);
  if(S.heat>=100){
    ctx.fillStyle=(Math.sin(G.t*.3)>0)?"rgba(255,70,50,.9)":"rgba(255,70,50,.3)";
    ctx.textAlign="center";ctx.font="12px ui-monospace,monospace";
    ctx.fillText("ПЕРЕГРЕВ · КОРПУС ГОРИТ",W/2,by+34);
  }
}
