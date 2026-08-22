/* ДРЕЙФ — планеты для фона сайта.
 *
 * Это не «похожие» планеты, а тот же генератор, что в игре (`src/07-planet.js`):
 * шум фрактальный, отображение сферическое, палитры взяты из таблицы миров
 * (`src/02-world.js`) без изменений. Отсюда и разница с прежним фоном — там были
 * градиент и полоски, то есть картинка про планету, а не планета.
 *
 * Что пришлось изменить и почему:
 *   — кадров вращения меньше (в игре шестнадцать на планету размером в сотню
 *     пикселей, здесь фон во весь экран, и каждый кадр стоит дороже);
 *   — печём не сразу, а по одному кадру за раз в паузах между кадрами показа,
 *     иначе первый заход в страницу встанет на полсекунды;
 *   — жизни и биомов нет: они читаются только вблизи, а платить за них
 *     пришлось бы на каждом пикселе.
 *
 * Наружу отдаётся `makePlanet({type,size,seed})` → объект с `frames` и методом
 * `draw(ctx,x,y,turn)`. Пока кадры не готовы, рисуется тот, что уже есть.
 */
(function(){
  /* ── шум: дословно из 01-core ── */
  const lerp=(a,b,t)=>a+(b-a)*t;
  const clamp=(v,a,b)=>v<a?a:v>b?b:v;
  function h01(x,y,s){
    let h=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(s|0,2246822519);
    h=Math.imul(h^h>>>13,1274126177);
    return ((h^h>>>16)>>>0)/4294967296;
  }
  function noise2(x,y,s){
    const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;
    const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
    return lerp(lerp(h01(xi,yi,s),h01(xi+1,yi,s),u),
                lerp(h01(xi,yi+1,s),h01(xi+1,yi+1,s),u),v);
  }
  function fbm2(x,y,s,oct){
    let v=0,a=.5,f=1,n=0; oct=oct||5;
    for(let i=0;i<oct;i++){v+=a*noise2(x*f,y*f,s+i*97);n+=a;a*=.5;f*=2;}
    return v/n;
  }
  function ramp(pal,t){
    t=clamp(t,0,.9999);
    const s=t*(pal.length-1),i=Math.floor(s),f=s-i;
    const a=pal[i],b=pal[Math.min(pal.length-1,i+1)];
    return [lerp(a[0],b[0],f),lerp(a[1],b[1],f),lerp(a[2],b[2],f)];
  }

  /* ── палитры: скопированы из таблицы миров игры ── */
  const WORLD={
    terran:{pal:[[14,38,72],[22,64,104],[46,102,70],[104,138,72],[186,178,150],[236,240,244]],rough:.55},
    ocean:{pal:[[8,26,58],[14,52,96],[28,92,132],[52,132,150],[214,224,226]],rough:.25},
    desert:{pal:[[92,58,34],[144,96,52],[186,140,78],[214,176,116],[236,214,176]],rough:.7},
    ice:{pal:[[36,58,84],[74,106,140],[136,172,200],[196,220,236],[244,250,252]],rough:.5},
    crystal:{pal:[[10,9,22],[24,18,44],[46,34,76],[86,62,124],[168,140,214],[246,240,255]],rough:.85},
    jungle:{pal:[[8,22,16],[16,48,28],[30,84,42],[68,124,52],[126,166,72],[196,206,140]],rough:.6},
    volcanic:{pal:[[18,10,10],[54,20,14],[112,32,18],[198,74,22],[248,178,64]],rough:.95},
    gas:{pal:[[52,38,72],[96,68,110],[152,116,138],[204,168,158],[238,216,198]],rough:0}
  };

  /* ── один кадр вращения ── */
  function bakeFrame(P,fr){
    const S=P.res, cn=document.createElement("canvas");
    cn.width=cn.height=S;
    const cx=cn.getContext("2d"), img=cx.createImageData(S,S), d=img.data;
    const W=WORLD[P.type]||WORLD.terran, pal=W.pal, gas=P.type==="gas";
    const lon0=fr/P.frames*Math.PI*2, seed=P.seed;
    for(let py=0;py<S;py++)for(let px=0;px<S;px++){
      const o=(py*S+px)*4;
      const nx=(px+.5)/S*2-1, ny=(py+.5)/S*2-1, r2=nx*nx+ny*ny;
      if(r2>1){d[o+3]=0;continue;}
      const nz=Math.sqrt(1-r2);
      /* долгота крутится, широта нет: поворот вокруг оси, а не кувырок */
      const lon=Math.atan2(nx,nz)+lon0, lat=Math.asin(clamp(ny,-1,1));
      let v;
      if(gas){
        v=fbm2(lon*.7+9,lat*7+3,seed,4);
        v=clamp(v*.6+.5*(.5+.5*Math.sin(lat*9+fbm2(lon*1.6,lat*3,seed+5,3)*4)),0,1);
      }else{
        v=fbm2(lon*2.4+11,lat*2.4+11,seed,5);
        v=clamp((v-.5)*(1+W.rough*.9)+.5,0,1);
        v=clamp(v+Math.pow(Math.abs(lat)/1.5708,3.2)*.55,0,1);   // шапки на полюсах
      }
      const c=ramp(pal,v);
      /* свет сбоку и подсвеченный лимб — то же, что в игре */
      const light=clamp(nx*-.52+ny*-.42+nz*.74,0,1);
      const sh=.16+1.02*Math.pow(light,.85), rim=Math.pow(1-nz,4)*(gas?.5:.34);
      d[o]  =clamp(c[0]*sh+rim*130,0,255);
      d[o+1]=clamp(c[1]*sh+rim*180,0,255);
      d[o+2]=clamp(c[2]*sh+rim*210,0,255);
      d[o+3]=255;
    }
    cx.putImageData(img,0,0);
    return cn;
  }

  /* Кольца рисуются отдельным слоем, не текстурой: у игры их нет вовсе, а фону
     нужен хотя бы один силуэт, который узнаётся мгновенно. */
  function bakeRing(size){
    const c=document.createElement("canvas"), S=Math.ceil(size*2.4);
    c.width=c.height=S;
    const g=c.getContext("2d"), r=size/2;
    g.translate(S/2,S/2); g.scale(1,.24); g.rotate(-.2);
    for(const [rad,w,a] of [[r*1.28,r*.10,.20],[r*1.46,r*.16,.13],[r*1.62,r*.07,.09]]){
      g.strokeStyle="rgba(212,204,224,"+a+")"; g.lineWidth=w;
      g.beginPath(); g.arc(0,0,rad,0,Math.PI*2); g.stroke();
    }
    return c;
  }

  const QUEUE=[];
  let baking=false;
  /* Печём по одному кадру в паузе браузера: страница обязана открыться сразу,
     а вращение может доехать через секунду — этого никто не заметит. */
  function pump(){
    if(baking||!QUEUE.length)return;
    baking=true;
    const step=()=>{
      const job=QUEUE[0];
      if(!job){baking=false;return;}
      job.P.tex[job.fr]=bakeFrame(job.P,job.fr);
      QUEUE.shift();
      if(QUEUE.length)(window.requestIdleCallback||
        (f=>setTimeout(f,24)))(step,{timeout:400});
      else baking=false;
    };
    (window.requestIdleCallback||(f=>setTimeout(f,24)))(step,{timeout:400});
  }

  window.makePlanet=function(o){
    const P={
      type:o.type||"terran",
      size:Math.max(24,Math.round(o.size)),
      /* Печём не крупнее 360 пикселей и растягиваем при отрисовке: полноразмерный
         кадр большой планеты стоит 51 мс на настольной машине, а на телефоне это
         рывок при открытии. Планета на фоне приглушена и обведена атмосферой,
         мягкость там не читается, зато цена падает втрое. */
      res:Math.min(360,Math.max(24,Math.round(o.size))),
      seed:(o.seed|0)||1234,
      frames:o.frames||10,
      tex:[],
      ring:o.ring?bakeRing(Math.round(o.size)):null
    };
    P.tex[0]=bakeFrame(P,0);                       // первый кадр — сразу, он и покажется
    for(let i=1;i<P.frames;i++)QUEUE.push({P,fr:i});
    pump();
    /* turn — доля оборота 0…1; берём ближайший готовый кадр, а не ждём нужный */
    P.draw=function(ctx,x,y,turn){
      let fr=Math.floor(((turn%1)+1)%1*P.frames)%P.frames;
      let n=0;
      while(!P.tex[fr]&&n++<P.frames)fr=(fr+P.frames-1)%P.frames;
      const t=P.tex[fr]; if(!t)return;
      const h=P.size/2;
      if(P.ring){
        const rs=P.ring.width;
        ctx.drawImage(P.ring,x-rs/2,y-rs/2);       // кольца за диском и перед ним
      }
      ctx.drawImage(t,x-h,y-h,P.size,P.size);   // текстура меньше — растягиваем
      if(P.ring){
        const rs=P.ring.width;
        ctx.save();
        ctx.beginPath(); ctx.rect(x-rs/2,y,rs,rs/2); ctx.clip();
        ctx.drawImage(P.ring,x-rs/2,y-rs/2);
        ctx.restore();
      }
    };
    return P;
  };
})();
