/* ДРЕЙФ — фон звёздной карты: туманность, полоса Галактики, пеленги (M436).
 *
 * Три слоя, которые делают карту космосом, а не листом в клетку. Жили внутри
 * `drawMap` (18-mode-map) и потому были видны только в игре; страница войны
 * (site/war.html) рисовала свои владения на пустоте и выглядела политической
 * картой из учебника. Теперь слои живут здесь, `build.ps1` кладёт этот модуль
 * и в `site/war.js`, и обе карты — одна и та же бумага.
 *
 * Договор: каждая функция красит ПЕРЕДАННЫЙ контекст в поле W×H и не читает
 * ничего из `G`. В игре они зовутся внутри `screenLayer` (кэш на размер
 * экрана), на сайте — прямо в свой холст. Ни одна из них не двигает камеру:
 * смещение туманности по сектору остаётся делом зовущего.
 */
const MAPBG={tex:null};
function mapNebula(){
  if(MAPBG.tex)return MAPBG.tex;
  const S=160,cn=document.createElement("canvas");cn.width=cn.height=S;
  const c=cn.getContext("2d"),img=c.createImageData(S,S),d=img.data;
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){
    const o=(y*S+x)*4,u=x/S*2.6,v=y/S*2.6;
    /* два поля: холодное «молоко» рукава и тёплые угли древних вспышек */
    const a=clamp((fbm2(u,v,7717,5)-.46)*2.6,0,1);
    const b=clamp((fbm2(u+3.7,v-1.9,4243,4)-.52)*2.9,0,1);
    /* пылевая полоса вычитается: без тёмных прожилок туманность — просто клякса */
    const dust=clamp((fbm2(u*1.7-2.2,v*1.7+4.4,913,3)-.44)*3.2,0,1);
    const al=clamp((Math.pow(a,1.9)*.46+Math.pow(b,2.2)*.34)*(1-dust*.8),0,1);
    d[o]  =28+b*150+a*24;
    d[o+1]=22+a*54+b*44;
    d[o+2]=58+a*140+b*30;
    d[o+3]=al*255;
  }
  c.putImageData(img,0,0);MAPBG.tex=cn;return cn;
}

/* полоса Галактики: две ступени значения, пылевая лента и тёплое ядро */
function mapBandPaint(c,W,H){
  c.save();
  c.translate(W/2,H/2);c.rotate(-.34);
  const L=Math.hypot(W,H);
  c.globalCompositeOperation="lighter";
  const BW=[.46,.34,.22,.12],BA=[.05,.06,.08,.10];
  for(let i=0;i<BW.length;i++){
    const g=c.createLinearGradient(0,-H*BW[i]/2,0,H*BW[i]/2);
    g.addColorStop(0,"rgba(150,180,220,0)");
    g.addColorStop(.5,"rgba(178,200,228,"+BA[i]+")");
    g.addColorStop(1,"rgba(150,180,220,0)");
    c.fillStyle=g;c.fillRect(-L/2,-H*BW[i]/2,L,H*BW[i]);
  }
  /* ── вторая ступень значения (M308, §16) ──
     Полоса была одним плавным значением; масса на карте мерилась в 2%.
     У настоящей полосы есть яркое узкое ядро и тёмная пылевая лента,
     которая его режет, — две ступени вместо одной, и по ним полоса
     читается телом, а не подсветкой. Плюс звёздная крошка в ядре. */
  {
    const cg2=c.createLinearGradient(0,-H*.075,0,H*.075);
    cg2.addColorStop(0,"rgba(200,214,236,0)");cg2.addColorStop(.5,"rgba(214,224,240,.13)");cg2.addColorStop(1,"rgba(200,214,236,0)");
    c.fillStyle=cg2;c.fillRect(-L/2,-H*.075,L,H*.15);
    const rs=rng(0x3A11);
    c.fillStyle="rgba(230,236,248,.5)";
    for(let i=0;i<260;i++){const x=(rs()-.5)*L,y=(rs()-.5)*H*.16*(.4+rs()*.6);c.fillRect(x,y,rs()<.2?1.2:.8,.8);}
    c.globalCompositeOperation="source-over";
    const dl=c.createLinearGradient(0,-H*.03,0,H*.03);
    dl.addColorStop(0,"rgba(6,8,14,0)");dl.addColorStop(.5,"rgba(6,8,14,.38)");dl.addColorStop(1,"rgba(6,8,14,0)");
    c.fillStyle=dl;
    c.beginPath();
    for(let x=-L/2;x<=L/2;x+=40){const y=Math.sin(x*.004)*H*.02+Math.sin(x*.011+1)*H*.01;if(x===-L/2)c.moveTo(x,y-H*.03);else c.lineTo(x,y-H*.03);}
    for(let x=L/2;x>=-L/2;x-=40){const y=Math.sin(x*.004)*H*.02+Math.sin(x*.011+1)*H*.01;c.lineTo(x,y+H*.03);}
    c.closePath();c.fill();
    c.globalCompositeOperation="lighter";
  }
  /* тёплое ядро полосы — вторая температура листа */
  const cg=c.createRadialGradient(-W*.18,0,0,-W*.18,0,W*.34);
  cg.addColorStop(0,"rgba(236,206,160,.10)");
  cg.addColorStop(1,"rgba(236,206,160,0)");
  c.fillStyle=cg;c.fillRect(-L/2,-H/2,L,H);
  c.restore();
}

/* сеть пеленгов — шестнадцать румбов из центра листа */
function mapRhumbPaint(c,W,H){
  const L=Math.hypot(W,H);
  c.save();c.translate(W/2,H/2);
  for(let i=0;i<16;i++){
    const a=i/16*TAU;
    c.strokeStyle="rgba(150,182,212,"+((i%4===0)?.075:.04)+")";
    c.lineWidth=(i%4===0)?1:.7;
    c.beginPath();c.moveTo(0,0);
    c.lineTo(Math.cos(a)*L,Math.sin(a)*L);c.stroke();
  }
  /* скрытая окружность построения — как процарапанная на пергаменте */
  c.strokeStyle="rgba(150,182,212,.05)";c.lineWidth=1;
  c.beginPath();c.arc(0,0,Math.min(W,H)*.42,0,TAU);c.stroke();
  c.restore();
}
