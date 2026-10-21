/* ══════════════ штаб: порядок доменов и фигура человека ══════════════
   Рубку рисует движок (29r-rooms-r3, M850a). 2D-рубки нет (22.10, автор: «2D не должно быть»): художник
   drawHqRoom с выпечками, светом и подписями удалён вместе с ?room=0. Здесь остались порядок доменов (его
   читает 29r) и 2D-фигура hqFigure — её зовут чужие панели (11w-vega, 27e-ui-home), к комнате она не относится. */
/* Домены стоят в постоянном порядке: рубка не должна перекладываться от того,
   кого наняли раньше. */
const HQ_ORDER=["cmd","keep","fact","sci"];
function hqMgrAt(i){return G.mgrs.find(x=>x.role===HQ_ORDER[i])||null;}
/* ── стоящий у пульта ──
   Тело, а не палки: комбинезон трапецией, плечи шире таза, ранец на спине,
   дальняя нога темнее ближней, одна рука лежит на пульте. Голова — настоящий
   портрет управляющего, тот же, что в карточке. */
function hqFigure(c,x,fy,col,phase,face,ai,m,pose,part){
  /* part — для спрайтов рубки (27f1): "legs" — тень и ноги, "top" — корпус и голова
     без метки поручения (она живая); без part — вся фигура, как рисуют остальные */
  const bob=Math.sin(phase)*1.0,sw=Math.sin(phase*1.3);
  /* Поза у каждого домена своя, иначе рубка — четыре оловянных солдатика в ряд.
     Командир стоит прямо, обе руки на пульте; смотритель развёрнут к экрану;
     фактор опёрся локтем; исследователь держит планшет и смотрит в него.
     Разворот показан сужением корпуса и сдвигом портрета, а не вторым набором
     фигур: половинки и сдвиги дешевле и не расходятся с языком остальных сцен. */
  const P=[{turn:0,lean:0,arm:1},{turn:.5,lean:-.06,arm:2},
           {turn:-.35,lean:.10,arm:3},{turn:.25,lean:.04,arm:4}][pose|0]||
          {turn:0,lean:0,arm:1};
  /* Пропорции: рост 89, голова 26 — три с половиной головы. Меньшая голова
     превращала портрет в пятно, большая — в куклу. Ноги 30, торс 34: пульт
     приходится ровно по пояс, и это делает комнату комнатой. */
  const body=rgba(col,.94),dark=rgba(mixc(col,[8,12,18],.62),.96),
        mid=rgba(mixc(col,[8,12,18],.3),.96),
        lite=rgba(mixc(col,[245,250,255],.35),.95);
  c.save();c.translate(x,fy);
  if(part!=="top"){
  c.fillStyle="rgba(0,0,0,.4)";                       // тень под ногами
  c.beginPath();c.ellipse(0,1,14,3.6,0,0,TAU);c.fill();
  /* ноги врозь, дальняя темнее: без разницы в тоне это одна доска */
  c.fillStyle=dark;
  c.fillRect(2.5,-30,7,29);c.fillRect(1.5,-3,9.5,3);
  c.fillStyle=mid;
  c.fillRect(-9.5,-30,7,29);c.fillRect(-11,-3,9.5,3);
  c.fillStyle="rgba(0,0,0,.28)";c.fillRect(-1,-30,2,29); // зазор между ног
  }
  if(part==="legs"){c.restore();return;}
  /* торс и голова живут в своей системе: наклон от бедра, разворот — сужением */
  c.save();c.translate(0,-30);c.rotate(P.lean);c.scale(1-Math.abs(P.turn)*.3,1);
  c.translate(0,30);
  c.fillStyle=dark;                                    // ранец краем из-за плеча
  c.fillRect(P.turn>0?8.5:-13,-58+bob,4.5,19);
  c.fillStyle="rgba(0,0,0,.25)";c.fillRect(-13,-50+bob,4.5,2);
  /* торс: плечи явным углом, а не дугой — от дуги выходит яйцо */
  const tp=b=>{
    c.beginPath();
    c.moveTo(-9,-64+b);c.lineTo(-4,-67.5+b);c.lineTo(4,-67.5+b);c.lineTo(9,-64+b);
    c.lineTo(14,-58+b);c.lineTo(9.5,-30);c.lineTo(-9.5,-30);c.lineTo(-14,-58+b);
    c.closePath();
  };
  c.fillStyle=body;tp(bob);c.fill();
  c.strokeStyle="rgba(230,240,250,.20)";c.lineWidth=1;tp(bob);c.stroke();
  const sg=c.createLinearGradient(-14,0,14,0);         // свет слева, тень справа
  sg.addColorStop(0,"rgba(255,255,255,.13)");sg.addColorStop(.55,"rgba(255,255,255,0)");
  sg.addColorStop(1,"rgba(0,0,0,.28)");
  c.fillStyle=sg;tp(bob);c.fill();
  c.fillStyle="rgba(0,0,0,.22)";                       // ворот
  c.beginPath();c.moveTo(-5,-66+bob);c.lineTo(0,-59+bob);c.lineTo(5,-66+bob);c.closePath();c.fill();
  c.fillStyle="rgba(0,0,0,.3)";c.fillRect(-9.7,-40+bob*.4,19.4,2.6); // ремень
  c.fillStyle=lite;c.fillRect(-9.7,-40+bob*.4,4,2.6);               // пряжка
  c.fillStyle=rgba(mixc(col,[240,246,255],.5),.85);                 // нашивка домена
  c.fillRect(-12.5,-62+bob,4.5,3.6);
  c.fillStyle="rgba(0,0,0,.18)";c.fillRect(3,-52+bob,6,7);          // нагрудный карман
  /* руки по позе: на пульте, поднятая к экрану, локоть на кромке, планшет */
  c.lineCap="round";
  const hand=(hx,hy)=>{c.fillStyle=lite;c.beginPath();c.arc(hx,hy,2.6,0,TAU);c.fill();};
  c.strokeStyle=body;c.lineWidth=5.4;
  if(P.arm===2){                                        // рука поднята к экрану
    c.beginPath();c.moveTo(10,-60+bob);c.lineTo(17,-64+bob);c.lineTo(23,-70+bob+sw*.8);c.stroke();
    hand(23,-70+bob+sw*.8);
  }else if(P.arm===3){                                  // локоть на кромке пульта
    c.beginPath();c.moveTo(10,-60+bob);c.lineTo(18,-40);c.lineTo(9,-31+sw*.8);c.stroke();
    hand(9,-30+sw*.8);
  }else if(P.arm===4){                                  // держит планшет перед собой
    c.beginPath();c.moveTo(10,-60+bob);c.lineTo(13,-48+bob);c.lineTo(6,-44+bob);c.stroke();
    c.beginPath();c.moveTo(-10,-60+bob);c.lineTo(-13,-48+bob);c.lineTo(-6,-44+bob);c.stroke();
    c.save();c.rotate(-.22);
    c.fillStyle="rgba(24,30,40,.95)";c.fillRect(-9,-50+bob,18,11);
    c.fillStyle=rgba(col,.35);c.fillRect(-7.5,-48.5+bob,15,8);
    c.restore();
  }else{                                                // обе руки на пульте
    c.beginPath();c.moveTo(10,-60+bob);c.lineTo(16,-46+bob*.5);c.lineTo(19,-33+sw*1.2);c.stroke();
    hand(19.5,-32+sw*1.2);
  }
  if(P.arm!==4){                                        // дальняя рука
    c.strokeStyle=dark;c.lineWidth=5;
    c.beginPath();c.moveTo(-10,-60+bob);c.lineTo(-14,-46+bob*.5);c.lineTo(-13,-36+sw*.6);c.stroke();
  }
  c.lineCap="butt";
  c.fillStyle=dark;c.fillRect(-3.5,-70+bob,7,5);        // шея
  if(face){                                             // голова-портрет
    const hx=P.turn*4;                                  // голова доворачивается за корпусом
    c.save();
    c.beginPath();c.arc(hx,-76+bob,13,0,TAU);c.clip();
    c.drawImage(face,hx-13,-89+bob,26,26);
    c.fillStyle="rgba(0,0,0,.18)";                      // щека в тени с дальней стороны
    c.fillRect(P.turn>0?hx-13:hx+4,-89+bob,9,26);
    c.restore();
    c.strokeStyle=rgba(col,.6);c.lineWidth=1.6;
    c.beginPath();c.arc(hx,-76+bob,13,0,TAU);c.stroke();
    c.fillStyle="rgba(0,0,0,.22)";                      // тень от подбородка на грудь
    c.beginPath();c.ellipse(0,-64+bob,7,2.4,0,0,TAU);c.fill();
    if(ai){c.strokeStyle="rgba(159,216,255,.5)";c.lineWidth=1;
      c.beginPath();c.arc(0,-76+bob,16.5,0,TAU);c.stroke();}
  }
  c.restore();                                          // конец системы торса
  /* поручение со сроком висит меткой над плечом: его видно из зала */
  if(m&&m.job&&!part){
    c.fillStyle="rgba(242,178,92,"+(.5+.4*Math.sin(G.t*2.4)).toFixed(2)+")";
    c.beginPath();c.moveTo(16,-72+bob);c.lineTo(22,-66+bob);c.lineTo(16,-60+bob);
    c.closePath();c.fill();
  }
  c.restore();
}
