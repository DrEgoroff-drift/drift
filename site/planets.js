/* ДРЕЙФ — планеты для фона сайта.
 *
 * Тот же генератор, что в игре (`src/07-planet.js`): фрактальный шум, палитры из
 * таблицы миров, свет сбоку и подсвеченный лимб. Отличается только способ
 * вращения, и в этом весь смысл файла.
 *
 * Как было и почему не годилось. Игра печёт шестнадцать кадров оборота и
 * переключает их — планета в системе размером с ноготь, шаг незаметен. На фоне
 * сайта планета во весь экран, и шестнадцать кадров превращаются в слайд-шоу:
 * видно, как она щёлкает. Печь шестьдесят кадров нельзя — это тридцать мегабайт
 * на одну планету.
 *
 * Как сделано. Печётся ОДНА развёртка (карта поверхности, долгота по горизонтали,
 * синус широты по вертикали) — и она разворачивается на шар прямо в кадре,
 * вертикальными полосками. Хитрость, которая делает это дешёвым: при взгляде на
 * шар высота точки на экране равна синусу её широты, а значит по вертикали
 * растягивать нечего — развёртка ложится один к одному, и остаётся только
 * посчитать, какая долгота приходится на каждый столбец. Поворот — это сдвиг
 * по развёртке, то есть вращение непрерывное, без единого шага.
 *
 * Свет при этом не крутится вместе с поверхностью — он и не должен: звезда стоит
 * на месте. Поэтому тень и ободок атмосферы пекутся отдельными накладками и
 * ложатся поверх уже повёрнутого шара. В игре свет запечён в каждый кадр именно
 * потому, что кадры и есть повороты; здесь это разошлось, и разошлось правильно.
 *
 * Наружу: `makePlanet({type,size,seed,ring})` → объект с `draw(ctx,x,y,turn)`,
 * где turn — доля оборота, любое дробное число.
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

  const TAU=Math.PI*2;

  /* ── развёртка поверхности ──
     Горизонталь — долгота на полный оборот, вертикаль — синус широты (именно
     синус: так строка развёртки совпадает со строкой экрана и не нужно
     ничего растягивать). Света здесь нет: он не вращается. */
  function bakeStrip(P){
    const W=P.res*2, H=P.res;
    const cn=document.createElement("canvas"); cn.width=W; cn.height=H;
    const cx=cn.getContext("2d"), img=cx.createImageData(W,H), d=img.data;
    const T=WORLD[P.type]||WORLD.terran, pal=T.pal, gas=P.type==="gas";
    /* Шум по долготе не периодичен, поэтому левый и правый край развёртки не
       сходятся — на шаре это читается вертикальным швом посреди диска. Лечим
       перекрёстным затуханием: у правого края подмешиваем то же поле, взятое
       на оборот раньше, и к самому краю остаётся только оно. */
    const BLEND=.14;
    const surf=(lon,lat)=>{
      let n;
      if(gas){
        n=fbm2(lon*.7+9,lat*7+3,P.seed,4);
        return clamp(n*.6+.5*(.5+.5*Math.sin(lat*9+fbm2(lon*1.6,lat*3,P.seed+5,3)*4)),0,1);
      }
      n=fbm2(lon*2.4+11,lat*2.4+11,P.seed,5);
      n=clamp((n-.5)*(1+T.rough*.9)+.5,0,1);
      return clamp(n+Math.pow(Math.abs(lat)/1.5708,3.2)*.55,0,1);   // шапки на полюсах
    };
    for(let y=0;y<H;y++){
      const v=(y+.5)/H*2-1, lat=Math.asin(clamp(v,-1,1));
      for(let x=0;x<W;x++){
        const f=(x+.5)/W, lon=f*TAU, o=(y*W+x)*4;
        let n=surf(lon,lat);
        if(f>1-BLEND){
          const w=(f-(1-BLEND))/BLEND;          // 0 у начала склейки, 1 у самого края
          const s=w*w*(3-2*w);                   // плавно, без излома
          n=lerp(n,surf(lon-TAU,lat),s);
        }
        const c=ramp(pal,n);
        d[o]=c[0]; d[o+1]=c[1]; d[o+2]=c[2]; d[o+3]=255;
      }
    }
    cx.putImageData(img,0,0);
    return cn;
  }

  /* ── свет: две накладки поверх шара ──
     Тень — чёрный с переменной прозрачностью (та же формула, что в игре),
     ободок — добавляемое свечение по краю диска. Обе не вращаются. */
  function bakeLight(P){
    const S=P.res;
    const sh=document.createElement("canvas"); sh.width=sh.height=S;
    const rim=document.createElement("canvas"); rim.width=rim.height=S;
    const gs=sh.getContext("2d"), gr=rim.getContext("2d");
    const is=gs.createImageData(S,S), ir=gr.createImageData(S,S);
    const ds=is.data, dr=ir.data, gas=P.type==="gas";
    for(let py=0;py<S;py++)for(let px=0;px<S;px++){
      const o=(py*S+px)*4;
      const nx=(px+.5)/S*2-1, ny=(py+.5)/S*2-1, r2=nx*nx+ny*ny;
      if(r2>1){ds[o+3]=0;dr[o+3]=0;continue;}
      const nz=Math.sqrt(1-r2);
      const light=clamp(nx*-.52+ny*-.42+nz*.74,0,1);
      const k=.16+1.02*Math.pow(light,.85);          // множитель яркости из игры
      ds[o]=0;ds[o+1]=0;ds[o+2]=0;
      ds[o+3]=clamp((1-k)*255,0,255);                 // чем темнее, тем плотнее чёрный
      /* В игре множитель яркости доходит до 1.18, то есть свет ещё и подсвечивает.
         Накладка тенью так не умеет — поэтому избыток уходит в добавляемый слой,
         иначе дневная сторона выходит бледнее, чем в игре. */
      const up=clamp(k-1,0,1)*.9;
      const r=Math.pow(1-nz,4)*(gas?.5:.34);
      dr[o]=clamp(130*r+235*up,0,255);
      dr[o+1]=clamp(180*r+240*up,0,255);
      dr[o+2]=clamp(210*r+245*up,0,255);
      dr[o+3]=255*clamp(r+up,0,1);
      /* край диска сглаживаем, иначе на большой планете видна лесенка */
      const edge=clamp((1-Math.sqrt(r2))*S*.5,0,1);
      ds[o+3]*=edge; dr[o+3]*=edge;
    }
    gs.putImageData(is,0,0); gr.putImageData(ir,0,0);
    return {sh,rim};
  }

  /* Кольца — отдельным слоем: в игре их нет, а фону нужен силуэт,
     который узнаётся мгновенно. */
  function bakeRing(size){
    const c=document.createElement("canvas"), S=Math.ceil(size*2.4);
    c.width=c.height=S;
    const g=c.getContext("2d"), r=size/2;
    g.translate(S/2,S/2); g.scale(1,.24); g.rotate(-.2);
    for(const [rad,w,a] of [[r*1.28,r*.10,.20],[r*1.46,r*.16,.13],[r*1.62,r*.07,.09]]){
      g.strokeStyle="rgba(212,204,224,"+a+")"; g.lineWidth=w;
      g.beginPath(); g.arc(0,0,rad,0,TAU); g.stroke();
    }
    return c;
  }

  window.makePlanet=function(o){
    const size=Math.max(24,Math.round(o.size));
    const P={
      type:o.type||"terran",
      size,
      /* Развёртка не крупнее 320 по высоте: планета на фоне приглушена и обведена
         атмосферой, мягкости там не видно, а печь дешевле втрое. */
      res:Math.min(320,size),
      seed:(o.seed|0)||1234
    };
    P.strip=bakeStrip(P);
    const L=bakeLight(P);
    P.sh=L.sh; P.rim=L.rim;
    P.ring=o.ring?bakeRing(size):null;

    /* Столбцы считаем один раз: от поворота зависит только сдвиг по развёртке. */
    const half=size/2;
    const step=size>300?3:2;                  // шире полоска — меньше вызовов, разницы не видно
    const cols=[];
    for(let sx=-half;sx<half;sx+=step){
      const w=Math.min(step,half-sx);
      const nx1=clamp(sx/half,-1,1), nx2=clamp((sx+w)/half,-1,1);
      const lon1=Math.asin(nx1), lon2=Math.asin(nx2);
      cols.push({
        dx:sx, dw:w,
        u:lon1/TAU,                            // доля оборота для левого края полоски
        su:Math.max(1,(lon2-lon1)/TAU*P.strip.width)   // сколько пикселей развёртки в неё попадает
      });
    }

    /* ── собранный шар кэшируется целиком ──
       Намотка развёртки на шар стоит по одному `drawImage` на вертикальную
       полоску — на большой планете это под две сотни вызовов, и до сих пор они
       повторялись каждый кадр, хотя рисовали одно и то же. А поворот здесь
       медленный: даже у самой быстрой планеты на фоне один пиксель развёртки
       проходит мимо края за шестнадцатую долю секунды, у крупной — за треть.
       Поэтому шар собирается в свой холст и пересобирается, только когда
       поворот сдвинулся хотя бы на три четверти пикселя текстуры. В кадре
       остаётся один `drawImage`. Вращение при этом не становится ступенчатым:
       шаг мельче пикселя, увидеть его нечем. */
    const rs=P.ring?P.ring.width:size;
    const box=Math.ceil(rs)+2;
    let disc=null,discCx=null,discTurn=null;
    const turnStep=.75/P.strip.width;

    function paint(ctx,x,y,turn){
      const S=P.size, sw=P.strip.width, sh=P.strip.height;
      if(P.ring)ctx.drawImage(P.ring,x-rs/2,y-rs/2);   // задняя дуга колец — до диска
      ctx.save();
      ctx.beginPath(); ctx.arc(x,y,half,0,TAU); ctx.clip();
      for(let i=0;i<cols.length;i++){
        const c=cols[i];
        const u=((c.u+turn)%1+1)%1*sw;
        /* полоска может перейти через шов развёртки — тогда рисуем в два приёма */
        const over=u+c.su-sw;
        if(over>0){
          const part=(c.su-over)/c.su;
          ctx.drawImage(P.strip,u,0,c.su-over,sh, x+c.dx,y-half,c.dw*part,S);
          ctx.drawImage(P.strip,0,0,over,sh, x+c.dx+c.dw*part,y-half,c.dw*(1-part),S);
        }else{
          ctx.drawImage(P.strip,u,0,c.su,sh, x+c.dx,y-half,c.dw,S);
        }
      }
      ctx.restore();
      ctx.drawImage(P.sh,x-half,y-half,S,S);   // тень
      const op=ctx.globalCompositeOperation;
      ctx.globalCompositeOperation="lighter";
      ctx.drawImage(P.rim,x-half,y-half,S,S);  // ободок атмосферы
      ctx.globalCompositeOperation=op;
      if(P.ring){
        ctx.save();
        ctx.beginPath(); ctx.rect(x-rs/2,y,rs,rs/2); ctx.clip();
        ctx.drawImage(P.ring,x-rs/2,y-rs/2);   // передняя дуга — поверх диска
        ctx.restore();
      }
    }

    P.draw=function(ctx,x,y,turn){
      if(!disc){
        disc=document.createElement("canvas");
        disc.width=disc.height=box;
        discCx=disc.getContext("2d");
      }
      if(discTurn===null||Math.abs(turn-discTurn)>=turnStep){
        discCx.clearRect(0,0,box,box);
        paint(discCx,box/2,box/2,turn);
        discTurn=turn;
      }
      /* по целым пикселям: доля пикселя заставила бы пересэмплировать весь диск
         и мылила бы кромку, а полпикселя на плывущем фоне не разглядеть */
      ctx.drawImage(disc,Math.round(x-box/2),Math.round(y-box/2));
    };
    return P;
  };
})();
