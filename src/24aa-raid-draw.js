/* ══════════════ рейд: отрисовка ══════════════
   Отрезано от 24a-mode-raid на распиле 0.108.x: генерация, вход и ход остались
   там, рисование пола, стен, объектов и тел противника — здесь. */
/* Верх кадра для камеры абордажа. Система координат левая (x вправо, y вверх,
   z ВПЕРЁД), поэтому верх — это fwd × right, а не right × fwd: второе даёт
   ровно противоположное направление и переворачивает кадр по вертикали.
   Отдельной функцией — чтобы знак проверялся автотестом, а не глазом. */
function raidUp(fwd,right){
  return [fwd[1]*right[2]-fwd[2]*right[1],
          fwd[2]*right[0]-fwd[0]*right[2],
          fwd[0]*right[1]-fwd[1]*right[0]];
}
/* ══════════════ рисование: пол → стены → объекты → эффекты ══════════════ */
function drawRaid(){
  const S=G.raid,R=S.R;
  ctx.fillStyle="#04060a";ctx.fillRect(0,0,W,H);
  /* камера от третьего лица: позади и выше, коллидится со стеной и подтягивается */
  /* ── камера отодвинута (0.161.0) ──
     Пока тела рисовались вчетверо мельче своей геометрии, камеру в 118
     единицах позади человека это устраивало. Как только масштаб стал
     честным, стало видно, что она стоит вплотную: человек ростом 50 единиц
     на дистанции 118 занимал треть кадра и закрывал собой отсек. Отодвинута
     на 236 — два с половиной роста, — и человек стал ростом с пирата в
     соседней комнате. Выше 110 (потолок отсека) камеру поднимать нельзя:
     канва 2D не отсекает задние грани, и камера над потолком увидит его
     изнанку вместо зала. */
  let back=236;
  for(let t=back;t>30;t-=20){
    const cx=S.x-Math.sin(S.a)*t, cz=S.z-Math.cos(S.a)*t;
    if(!raidSolidAt(R,cx,cz)){back=t;break;}
  }
  const cam=[S.x-Math.sin(S.a)*back, 78+S.y, S.z-Math.cos(S.a)*back];
  const fwd=[Math.sin(S.a),-.16,Math.cos(S.a)];
  const fl=Math.hypot(fwd[0],fwd[1],fwd[2]);fwd[0]/=fl;fwd[1]/=fl;fwd[2]/=fl;
  const right=[Math.cos(S.a),0,-Math.sin(S.a)];
  /* ── «вверх» должен смотреть вверх ──
     Автор про этот экран: «не очень понятно, посмотри на перспективу», и на
     кадре человек стоял на потолке. Так и было, буквально: система координат
     здесь левая (x — вправо, y — вверх, z — ВПЕРЁД), а вектор верха брался
     как right × fwd — правило правой руки. В левой системе это даёт «вниз»:
     измеренный вектор был [0,−0.987,−0.158]. Кадр рисовался зеркально по
     вертикали — пол уходил в верхнюю половину, потолок в нижнюю, а у ходока
     ноги проецировались выше головы. Корпус и стены отсека почти
     симметричны, поэтому перевёрнутый коридор всё ещё выглядел коридором, и
     ошибка прожила до тех пор, пока в кадр не попали стоящие фигуры.
     Правильный верх в левой системе — fwd × right. Вынесено отдельной
     функцией нарочно: за этим знаком не уследить глазами, его должен
     проверять автотест (`91zzze-raid-view`). */
  const up=raidUp(fwd,right);
  const F=Math.min(W,H)*.95;
  /* ── горизонт выше середины (M180) ──
     «Сверху всё» — первое, что сказал автор про этот экран: потолок занимал
     верхнюю треть кадра, потому что главная точка проекции стояла ровно в
     середине. Композиция чинится не наклоном камеры (наклон коверкает
     вертикали), а СДВИГОМ главной точки: горизонт уходит на 40% высоты, кадр
     достаётся полу и тем, кто по нему идёт. Это тот же приём, каким открытку
     кадрируют — линия горизонта не в центре. */
  /* Число подобрано ПОСЛЕ починки вектора верха и отодвинутой камеры, и
     проверено счётом, а не на глаз: горизонт (куда сходятся пол и потолок)
     ложится на .375 высоты, человек — на .59. Верхняя треть достаётся
     дальней стене и потолку, нижняя — полу под ногами; пустой полосы ни
     сверху, ни снизу не остаётся. Пока верх смотрел вниз, те же .44 давали
     горизонт НИЖЕ середины — ровно обратное тому, что здесь написано было. */
  const CY=H*.53;
  function proj(px,py,pz){
    const vx=px-cam[0],vy=py-cam[1],vz=pz-cam[2];
    const zc=vx*fwd[0]+vy*fwd[1]+vz*fwd[2];
    if(zc<8)return null;
    return {x:W/2+(vx*right[0]+vy*right[1]+vz*right[2])*F/zc,
            y:CY-(vx*up[0]+vy*up[1]+vz*up[2])*F/zc, z:zc};
  }
  const polys=[];
  /* Стена одним прямоугольником одного тона — плоская наклейка. Делим её по
     высоте надвое: низ светлее, верх уходит в темноту под потолком. Это
     дешёвая подделка вместо освещения, но именно она даёт отсеку объём. */
  function wall(a,b,c,d,col,li){
    const m0=[a[0],(a[1]+b[1])/2,a[2]], m1=[d[0],(c[1]+d[1])/2,d[2]];
    quad(a,m0,m1,d,col,li*1.08,true);
    quad(m0,b,c,m1,col,li*.72,true);
    /* ── обшивка ──
       Стена была одним тоном с контуром и читалась бумагой (G4). Теперь на ней
       то, что есть на стене любого отсека базы: плинтус у пола, шов между
       листами на трети высоты и кабель-канал под потолком — три тонких
       четырёхугольника в той же проекции, без единого нового прохода. */
    const lerp3=(p,q,t)=>[p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t,p[2]+(q[2]-p[2])*t];
    const dark=[col[0]*.55|0,col[1]*.55|0,col[2]*.6|0];
    quad(a,lerp3(a,b,.06),lerp3(d,c,.06),d,dark,li,false);                       // плинтус
    quad(lerp3(a,b,.36),lerp3(a,b,.385),lerp3(d,c,.385),lerp3(d,c,.36),dark,li*.9,false);   // шов
    quad(lerp3(a,b,.80),lerp3(a,b,.86),lerp3(d,c,.86),lerp3(d,c,.80),[col[0]+26,col[1]+22,col[2]+14],li*.95,false); // кабель-канал
    /* заклёпки по шву — только вблизи, иначе это шум */
    const A=proj(a[0],a[1],a[2]);
    if(A&&A.z<RCELL*3.5){
      for(let t=.12;t<.95;t+=.2){
        const p=lerp3(lerp3(a,b,.40),lerp3(d,c,.40),t),q=lerp3(lerp3(a,b,.43),lerp3(d,c,.43),t+.018);
        quad(p,[p[0],q[1],p[2]],q,[q[0],p[1],q[2]],[col[0]+40,col[1]+40,col[2]+40],li,false);
      }
    }
  }
  function quad(a,b,c,d,col,li,edge,emis,dBias){
    const A=proj(a[0],a[1],a[2]),B=proj(b[0],b[1],b[2]),
          C=proj(c[0],c[1],c[2]),D=proj(d[0],d[1],d[2]);
    if(!A||!B||!C||!D)return;
    polys.push({p:[A,B,C,D],d:(A.z+B.z+C.z+D.z)/4+(dBias||0),col,li,edge,emis});
  }
  /* ── скальная стена (хвост G4) ──
     Там, где за переборкой не отсек, а толща астероида, обшивки нет: база
     врезана в камень, и камень виден. Низ светлее, верх в тени, по стене
     три неровных пласта. Ни плинтуса, ни швов — их тут некому ставить */
  function rockWall(a,b,c,d,li,seed){
    const lerp3=(p,q,t)=>[p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t,p[2]+(q[2]-p[2])*t];
    quad(a,lerp3(a,b,.55),lerp3(d,c,.55),d,[64,55,46],li*.98,false);
    quad(lerp3(a,b,.55),b,c,lerp3(d,c,.55),[46,40,36],li*.68,false);
    for(let i=0;i<3;i++){
      const t0=.12+i*.28+((seed>>>(i*3))&3)*.03, t1=t0+.05, sk=(((seed>>>(i*2+1))&3)-1.5)*.03;
      quad(lerp3(a,b,t0),lerp3(a,b,t1),lerp3(d,c,t1+sk),lerp3(d,c,t0+sk),[32,28,26],li*.8,false);
    }
    const A=proj(a[0],a[1],a[2]);
    if(A&&A.z<RCELL*3){                       // вблизи — крупные камни в кладке
      for(let t=.15;t<.9;t+=.3){
        const p=lerp3(lerp3(a,b,.22),lerp3(d,c,.22),t),q=lerp3(lerp3(a,b,.34),lerp3(d,c,.34),t+.12);
        quad(p,[p[0],q[1],p[2]],q,[q[0],p[1],q[2]],[76,66,56],li*.9,false);
      }
    }
  }
  /* Коробка из пяти граней (низ не виден): всё крупное железо в ангаре собрано
     из них — контейнеры, опоры, катер. Ярче светится верх, бока темнее, и
     этого хватает, чтобы предмет стоял в пространстве, а не лежал наклейкой. */
  function box(bx,by,bz,bw,bh,bd,col,li){
    const x0=bx-bw/2,x1=bx+bw/2,z0=bz-bd/2,z1=bz+bd/2,y1=by+bh;
    /* контактная тень на полу: без неё коробка висит над плитой (G4) */
    quad([x0-4,by+.5,z0-4],[x1+4,by+.5,z0-4],[x1+4,by+.5,z1+4],[x0-4,by+.5,z1+4],[6,8,12],li*.5,false,0,6);
    quad([x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1],col,li*1.15,true);   // верх
    /* кант крышки: тёмная полоса под верхом по всем четырём бокам — ящик, а не куб */
    const rim=[col[0]*.5|0,col[1]*.5|0,col[2]*.55|0],ry=y1-Math.min(3,bh*.18);
    quad([x0,ry,z0],[x0,y1,z0],[x1,y1,z0],[x1,ry,z0],rim,li,false,0,-.5);
    quad([x1,ry,z1],[x1,y1,z1],[x0,y1,z1],[x0,ry,z1],rim,li,false,0,-.5);
    quad([x0,ry,z1],[x0,y1,z1],[x0,y1,z0],[x0,ry,z0],rim,li,false,0,-.5);
    quad([x1,ry,z0],[x1,y1,z0],[x1,y1,z1],[x1,ry,z1],rim,li,false,0,-.5);
    quad([x0,by,z0],[x0,y1,z0],[x1,y1,z0],[x1,by,z0],col,li*.95,true);
    quad([x1,by,z1],[x1,y1,z1],[x0,y1,z1],[x0,by,z1],col,li*.72,true);
    quad([x0,by,z1],[x0,y1,z1],[x0,y1,z0],[x0,by,z0],col,li*.82,true);
    quad([x1,by,z0],[x1,y1,z0],[x1,y1,z1],[x1,by,z1],col,li*.82,true);
  }
  const c0=Math.floor(S.x/RCELL),r0=Math.floor(S.z/RCELL);
  const rad=Math.round(9*G.opts.gfx.draw);
  for(let rr=r0-rad;rr<=r0+rad;rr++)for(let c=c0-rad;c<=c0+rad;c++){
    if(c<0||rr<0||c>=RAID_N||rr>=RAID_N)continue;
    if(raidSolid(R,c,rr))continue;
    const x0=c*RCELL,z0=rr*RCELL,x1=x0+RCELL,z1=z0+RCELL;
    const K=R.kind[raidIdx(c,rr)];
    const base=RAID_ROOMS[K]?RAID_ROOMS[K].col:[40,44,52];
    const h=raidFloorH(R,c,rr);
    /* затухание с расстоянием заменяет освещение; фонарь на шлеме добавляет
       света прямо по курсу, а аварийные лампы дышат по всему отсеку */
    const cxw=x0+RCELL/2,czw=z0+RCELL/2;
    const dd=Math.hypot(cxw-S.x,czw-S.z);
    const ang=Math.abs(angDiff(Math.atan2(cxw-S.x,czw-S.z),S.a));
    const lamp=K==="reactor"?.16*Math.sin(G.t*.09+c):(K==="corr"?.1*Math.sin(G.t*.05+rr):0);
    const torch=clamp((1-ang/1.1),0,1)*clamp(1-dd/620,0,1)*.5;
    /* пятно у ног: нашлемный фонарь светит по курсу, но и вокруг человека
       светло — иначе ближний пол под камерой уходил в чёрную жижу (M180) */
    const near=clamp(1-dd/(RCELL*2.6),0,1)*.34;
    const li=clamp(.95-dd/(RCELL*9)+torch+lamp+near,.1,1.15);
    quad([x0,h,z0],[x1,h,z0],[x1,h,z1],[x0,h,z1],base,li*.9,false);
    /* плита пола с зазором по кромке и пятно света под лампой: пол был
       одной заливкой от стены до стены (G4) */
    const gp=RCELL*.05;
    quad([x0+gp,h+.3,z0+gp],[x1-gp,h+.3,z0+gp],[x1-gp,h+.3,z1-gp],[x0+gp,h+.3,z1-gp],
         [base[0]+6,base[1]+6,base[2]+6],li*.93,false,0,-.2);
    if(K==="corr"||K==="reactor"||K==="hangar"){
      const pc=K==="reactor"?[base[0]+10,base[1]+34,base[2]+34]:[base[0]+30,base[1]+26,base[2]+14];
      const pp=RCELL*.24;
      quad([x0+pp,h+.6,z0+pp],[x1-pp,h+.6,z0+pp],[x1-pp,h+.6,z1-pp],[x0+pp,h+.6,z1-pp],pc,li*1.05,false,0,-.4);
    }
    /* ── потолок ──
       Он темнее пола, потому что свет идёт сверху вниз, — но .28 без единой
       детали давали не потолок, а дыру: верхняя треть кадра уходила в чёрное,
       и отсек читался открытым сверху. Значение поднято до .42, и по каждой
       клетке идёт поперечная балка чуть светлее полотна. Балка тут не
       украшение: ритм повторяющихся рёбер — единственное, чем плоскость над
       головой сообщает глубину, ей нечем больше (пол это делает швами плит).
       Два четырёхугольника на клетку, ни одного нового прохода. */
    quad([x0,RAID_H,z1],[x1,RAID_H,z1],[x1,RAID_H,z0],[x0,RAID_H,z0],base,li*.42,false);
    {
      const bcol=[base[0]+18,base[1]+18,base[2]+22], bz=z0+RCELL*.5, bw=RCELL*.055;
      quad([x0,RAID_H-1.2,bz+bw],[x1,RAID_H-1.2,bz+bw],[x1,RAID_H-1.2,bz-bw],[x0,RAID_H-1.2,bz-bw],
           bcol,li*.62,false,0,-.3);
    }
    /* стены рисуем только там, где соседняя клетка — порода; если за ней ещё
       порода во все стороны, это толща астероида — стена скальная (G4) */
    const thick=(cc,r2,dc,dr)=>raidSolid(R,cc+dc,r2+dr)&&raidSolid(R,cc-dr,r2+dc)&&raidSolid(R,cc+dr,r2-dc);
    const sdw=hashi(c,rr,0x5CA1);
    if(raidSolid(R,c,rr-1)){
      if(thick(c,rr-1,0,-1))rockWall([x0,h,z0],[x0,RAID_H,z0],[x1,RAID_H,z0],[x1,h,z0],li,sdw);
      else wall([x0,h,z0],[x0,RAID_H,z0],[x1,RAID_H,z0],[x1,h,z0],base,li);
    }
    if(raidSolid(R,c,rr+1)){
      if(thick(c,rr+1,0,1))rockWall([x1,h,z1],[x1,RAID_H,z1],[x0,RAID_H,z1],[x0,h,z1],li,sdw^5);
      else wall([x1,h,z1],[x1,RAID_H,z1],[x0,RAID_H,z1],[x0,h,z1],base,li);
    }
    if(raidSolid(R,c-1,rr)){
      if(thick(c-1,rr,-1,0))rockWall([x0,h,z1],[x0,RAID_H,z1],[x0,RAID_H,z0],[x0,h,z0],li*.92,sdw^9);
      else wall([x0,h,z1],[x0,RAID_H,z1],[x0,RAID_H,z0],[x0,h,z0],base,li*.92);
    }
    if(raidSolid(R,c+1,rr)){
      if(thick(c+1,rr,1,0))rockWall([x1,h,z0],[x1,RAID_H,z0],[x1,RAID_H,z1],[x1,h,z1],li*.92,sdw^13);
      else wall([x1,h,z0],[x1,RAID_H,z0],[x1,RAID_H,z1],[x1,h,z1],base,li*.92);
    }
    /* ── ворота ангара (хвост G4) ──
       Ангар — то, куда сели: в его торцевой стене ворота, за ними космос, и
       от них по полу ложится холодный конус. Один на базу, в середине стены
       первого отсека */
    if(K==="hangar"&&R.rooms&&R.rooms[0]){
      const HG=R.rooms[0];
      if(rr===HG.r0&&c===Math.floor((HG.c0+HG.c1)/2)&&raidSolid(R,c,rr-1)){
        quad([x0+8,h,z0+.6],[x0+8,RAID_H-6,z0+.6],[x1-8,RAID_H-6,z0+.6],[x1-8,h,z0+.6],[24,30,40],li,false,0,-.2);
        quad([x0+12,h+2,z0+.9],[x0+12,RAID_H-10,z0+.9],[x1-12,RAID_H-10,z0+.9],[x1-12,h+2,z0+.9],[140,180,225],1.0,false,1,-.3);
        quad([x0+12,h+.8,z0+1],[x1-12,h+.8,z0+1],[x1+RCELL*.7,h+.8,z0+RCELL*2.4],[x0-RCELL*.7,h+.8,z0+RCELL*2.4],[110,150,200],.55,false,1,-.25);
      }
    }
    /* потолочная лампа: единственный видимый источник света в отсеке. Раньше
       свет был только числом в li — на экране светильников не было вовсе */
    if(K==="corr"||K==="reactor"||K==="hangar"){
      const em=K==="reactor"?[120,220,230]:[255,232,196];
      const f=K==="reactor"?(.5+Math.sin(G.t*.09+c)*.22):(K==="corr"?.62:.42);
      /* полоса узкая и короткая: во всю клетку она под острым углом заливала
         светом полкадра и потолок читался ярче пола */
      quad([x0+RCELL*.45,RAID_H-3,z0+RCELL*.3],[x0+RCELL*.55,RAID_H-3,z0+RCELL*.3],
           [x0+RCELL*.55,RAID_H-3,z1-RCELL*.3],[x0+RCELL*.45,RAID_H-3,z1-RCELL*.3],em,f,false,1);
    }
    /* ── ангар: крупные предметы ──
       Большое помещение без обстановки — серый зал: пол, потолок и дальняя
       стена сходятся в один тон, зацепиться не за что. Ставим то, что стоит
       в настоящем ангаре, по устойчивому расчёту от координат клетки: контейнеры
       у стен, фермы и кран-балка под потолком, разбитый катер, бочки. */
    if(K==="hangar"){
      const HR=rng(hashi(c,rr,1301)),pick=HR();
      const px=x0+RCELL/2,pz=z0+RCELL/2;
      /* Всё крупное ставим ТОЛЬКО в клетках у стены. Во-первых, в проходе оно
         оказывалось фантомом: столкновений у обстановки нет, и игрок шёл сквозь
         ферму. Во-вторых, лес колонн посреди пролёта закрывал сам зал —
         предметы должны обрамлять пространство, а не заполнять его. */
      const near=raidSolid(R,c-1,rr)||raidSolid(R,c+1,rr)||raidSolid(R,c,rr-1)||raidSolid(R,c,rr+1);
      if(!near){
        if((c*5+rr*3)%7===0)box(px,RAID_H-12,pz,RCELL,5,8,[52,58,68],li*.85);  // кран-балка пролёта
      }else if(pick<.55){
        /* штабель контейнеров у стены: второй ярус со сдвигом, иначе выходит куб */
        const n=1+((HR()*2.4)|0);
        for(let i=0;i<n;i++){
          const bw=44,bd=30;
          box(px+(HR()-.5)*12,h+i*22,pz+(HR()-.5)*12,bw,21,bd,
              [56+i*6,62+i*4,72],li*(1-i*.04));
        }
      }else if(pick<.68){
        /* ферма от пола до потолка с раскосами: вертикаль, по которой глаз
           меряет высоту зала */
        box(px,h,pz,10,RAID_H-h,10,[64,70,80],li*.9);
        for(let i=0;i<3;i++)box(px,h+12+i*28,pz,26,4,4,[70,76,86],li*.8);
      }else if(pick<.80){
        /* разбитый катер: корпус под наклоном, крыло, обломок сопла */
        box(px,h+2,pz,70,16,26,[62,58,58],li*.95);
        box(px-10,h+18,pz,34,10,20,[70,66,66],li);
        box(px+30,h+4,pz+14,20,4,26,[54,52,54],li*.8);
        box(px-40,h,pz-10,14,8,14,[46,44,46],li*.7);
      }else if(pick<.9){
        /* бочки и мелочь: пол не должен быть стерильным */
        for(let i=0;i<4;i++)
          box(px+(HR()-.5)*54,h,pz+(HR()-.5)*54,13,17,13,[58,54,46],li*.9);
      }
      /* тельфер на балке — единственное, что висит над проходом */
      if(near&&(c+rr)%5===0)box(px+((c*37)%40)-20,RAID_H-26,pz,14,13,14,[68,74,84],li*.9);
    }
    /* перепад высоты к соседу — вертикальный борт антресоли или пандуса */
    const sideCol=[base[0]+14,base[1]+12,base[2]+10];
    const hn=raidFloorH(R,c,rr-1),hs=raidFloorH(R,c,rr+1),
          hw=raidFloorH(R,c-1,rr),he=raidFloorH(R,c+1,rr);
    if(!raidSolid(R,c,rr-1)&&hn<h)quad([x0,hn,z0],[x0,h,z0],[x1,h,z0],[x1,hn,z0],sideCol,li,true);
    if(!raidSolid(R,c,rr+1)&&hs<h)quad([x1,hs,z1],[x1,h,z1],[x0,h,z1],[x0,hs,z1],sideCol,li,true);
    if(!raidSolid(R,c-1,rr)&&hw<h)quad([x0,hw,z1],[x0,h,z1],[x0,h,z0],[x0,hw,z0],sideCol,li,true);
    if(!raidSolid(R,c+1,rr)&&he<h)quad([x1,he,z0],[x1,h,z0],[x1,h,z1],[x1,he,z1],sideCol,li,true);
    /* дверной проём: клетка коридора у самой комнаты получает косяк */
    if(K==="corr"){
      for(const [dc,dr] of [[0,-1],[0,1],[-1,0],[1,0]]){
        const nk=(!raidSolid(R,c+dc,rr+dr))?R.kind[raidIdx(c+dc,rr+dr)]:null;
        if(!nk||nk==="corr")continue;
        const jamb=[90,70,60];
        if(dr){
          const zz=dr<0?z0:z1;
          quad([x0,h,zz],[x0,h+14,zz],[x1,h+14,zz],[x1,h,zz],jamb,li*.8,true);
        }else{
          const xx=dc<0?x0:x1;
          quad([xx,h,z0],[xx,h+14,z0],[xx,h+14,z1],[xx,h,z1],jamb,li*.8,true);
        }
      }
    }
  }
  /* ── лут и подбираемое — ЯЩИКИ В МИРЕ (M180, дорисовано в 0.161.0) ──
     Контейнер рисовался оранжевым прямоугольником в экранных координатах с
     мигающей точкой — наклейка интерфейса поверх зала, где всё остальное
     стоит в проекции. M180 обещал заменить его коробкой box(): она стоит на
     полу, ловит свет своей клетки, даёт контактную тень, — и код для этого
     написали. Только вызывали его ПОСЛЕ того, как список полигонов уже
     отсортирован и вылит на канву, поэтому ни один ящик за все эти версии не
     нарисовался ни разу: на экране оставался один маячок, парящий в пустоте.
     Обещание в комментарии есть, вещи на экране нет — ровно то, что в этом
     проекте называется заглушкой. Теперь коробки кладутся в `polys` ДО
     сортировки и живут по общим правилам: глубина, дымка, перекрытие стеной.

     Нижний порог света у тары выше, чем у стен (.40 против .15), и это не
     поблажка: контур при `li>.3` не рисуется вовсе, и дальний ящик без него
     читается как «здесь ничего не нарисовано». Стены могут уйти в темноту,
     тара — нет: за ней сюда и пришли. */
  for(const L of S.loot){
    if(L.taken)continue;
    const fl0=raidFloorAt(R,L.x,L.z);
    const dd=Math.hypot(L.x-S.x,L.z-S.z);
    const li=clamp(.95-dd/(RCELL*9)+clamp(1-dd/620,0,1)*.4,.40,1.1);
    box(L.x,fl0,L.z,30,20,24,[122,96,58],li);
  }
  /* подбираемое — тоже вещи на полу: кофр аптечки, ящик брони, короб зарядов.
     Значок остаётся, но МАЛЕНЬКИЙ и на крышке — как трафарет на таре */
  for(const P of S.picks){
    if(P.taken)continue;
    const fl0=raidFloorAt(R,P.x,P.z);
    const dd=Math.hypot(P.x-S.x,P.z-S.z);
    const li=clamp(.95-dd/(RCELL*9)+clamp(1-dd/620,0,1)*.4,.40,1.1);
    const col=P.kind==="medkit"?[188,186,178]:(P.kind==="armor"?[92,110,128]:[110,102,84]);
    box(P.x,fl0,P.z,18,11,14,col,li);
  }
  polys.sort((a,b)=>b.d-a.d);
  /* Дымка расстояния: без неё дальняя геометрия просто темнеет, и глубина
     не читается. Смешиваем цвет грани с цветом взвешенной пыли тем сильнее,
     чем дальше грань. Светильники дымкой не гасим — они и должны пробиваться */
  const FOG=[9,11,17], FAR=RCELL*10;
  for(const P of polys){
    const [r8,g8,b8]=P.col;
    const k=P.emis?0:clamp((P.d-RCELL*1.5)/FAR,0,.85);
    const mix=(v,f)=>Math.round(v*P.li*(1-k)+f*k);
    ctx.fillStyle="rgb("+mix(r8,FOG[0])+","+mix(g8,FOG[1])+","+mix(b8,FOG[2])+")";
    ctx.beginPath();ctx.moveTo(P.p[0].x,P.p[0].y);
    for(let i=1;i<P.p.length;i++)ctx.lineTo(P.p[i].x,P.p[i].y);
    ctx.closePath();ctx.fill();
    if(P.edge&&P.li>.3){
      ctx.strokeStyle="rgba(0,0,0,.35)";ctx.lineWidth=1;ctx.stroke();
    }
  }
  /* ── метка не проходит сквозь стену (хвост M180) ──
     Маячки, трафареты и полоски здоровья рисуются поверх всей геометрии, без
     теста глубины: на кадре пиратской базы два маячка горели по тёмной стене
     справа, а ящиков под ними не было — они лежали в соседнем отсеке. Игрок
     при этом видел сквозь переборку и где лут, и где стоят живые.
     Настоящий z-буфер тут не нужен: сетка отсеков известна, достаточно
     пройти лучом от ходока до метки. Луч берём ТОТ ЖЕ, которым стреляют и
     видят враги (`raidLineOfSight`, 24a): если метка видна глазу, но пуля
     туда не летит, игрок обманут — а два разных понятия «видно» однажды
     разойдутся. Десяток меток на два десятка шагов — двести проверок по
     массиву за кадр, ничего. */
  const raidSee=(x1,z1)=>raidLineOfSight(R,S.x,S.z,x1,z1);
  const marks=[];
  for(const L of S.loot){
    if(L.taken||!raidSee(L.x,L.z))continue;
    const p=proj(L.x,raidFloorAt(R,L.x,L.z)+24,L.z);if(!p)continue;
    marks.push({p,kind:"loot",o:L});
  }
  for(const P of S.picks){
    if(P.taken||!raidSee(P.x,P.z))continue;
    const p=proj(P.x,raidFloorAt(R,P.x,P.z)+13,P.z);if(!p)continue;
    marks.push({p,kind:"pick",o:P});
  }
  /* Рост тела в единицах мира. Потолок отсека — 110, человек ровно вдвое
     ниже: по этому числу считается и масштаб спрайта, и куда ставить его
     точку опоры (спрайты нарисованы вокруг СЕРЕДИНЫ тела, а не вокруг ног,
     поэтому метка стоит на половине роста). */
  const RBODY=50;
  for(const f of S.foes){
    if(f.hp<=0||!raidSee(f.x,f.z))continue;
    const p=proj(f.x,raidFloorAt(R,f.x,f.z)+RBODY*.5+Math.sin(f.bob)*3,f.z);if(!p)continue;
    marks.push({p,kind:"foe",o:f});
  }
  const me=proj(S.x,S.y+RBODY*.5,S.z);
  if(me)marks.push({p:me,kind:"me",o:S});
  marks.sort((a,b)=>b.p.z-a.p.z);
  for(const m of marks){
    /* ── человек — мерило, и здесь он им не был ──
       Масштаб тел брался из `clamp(2200/z, .25, 3)`. Потолок в тройке
       упирался на любой игровой дистанции, поэтому ходок рисовался ОДНОГО
       размера с любого расстояния (перспектива тел не работала вовсе) — и
       размер этот был вчетверо меньше того, что требует геометрия отсека.
       Меряется это по кадру, а не на глаз: клетка пола (RCELL=90) рядом с
       ходоком занимала ~250 px, то есть 2.8 px на единицу мира, а человек
       ростом в 50 единиц был нарисован 55 px вместо 140. Отсек в 110 единиц
       высотой читался залом на пять этажей.
       Теперь масштаб берётся из САМОЙ проекции: сколько пикселей в кадре
       занимает столб высотой RBODY на этом месте — столько и будет тело.
       Врать этот способ не может по устройству, и перспектива тел включается
       сама собой. `ppu` — пикселей на единицу мира в точке метки; всё
       остальное (тень, полоска здоровья, маячок) считается в единицах мира и
       умножается на неё, чтобы не разъехаться. */
    const mx=m.o.x!=null?m.o.x:S.x, mz=m.o.z!=null?m.o.z:S.z, mfl=raidFloorAt(R,mx,mz);
    const mf=proj(mx,mfl,mz), mh=proj(mx,mfl+RBODY,mz);
    const ppu=(mf&&mh)?Math.abs(mf.y-mh.y)/RBODY:(2200/m.p.z)*.06;
    /* `s` осталось прежним именем, но теперь это честный масштаб тела: доля,
       на которую надо растянуть спрайт ростом 25 px (астронавт) или 32 px
       (пират), чтобы он занял в кадре свои 50 единиц мира. Спрайты меряны, а
       не угаданы (`91zzze-raid-view` стережёт и это). */
    const s=clamp(RBODY*ppu/25,.2,26);
    if(m.kind==="loot"){
      /* сам ящик уже стоит в мире; здесь только дыхание маячка на крышке */
      const on=Math.sin(G.t*.14)>0;
      /* размеры маячка — в единицах мира, чтобы он оставался лампочкой на
         крышке, а не рос в фонарь при подходе */
      ctx.fillStyle=on?"#7fe6d8":"rgba(127,230,216,.35)";
      ctx.beginPath();ctx.arc(m.p.x,m.p.y,Math.max(1.5,2.6*ppu),0,TAU);ctx.fill();
      if(on){
        const gr=Math.max(6,16*ppu);
        const gg=ctx.createRadialGradient(m.p.x,m.p.y,0,m.p.x,m.p.y,gr);
        gg.addColorStop(0,"rgba(127,230,216,.30)");gg.addColorStop(1,"rgba(127,230,216,0)");
        ctx.fillStyle=gg;ctx.beginPath();ctx.arc(m.p.x,m.p.y,gr,0,TAU);ctx.fill();
      }
    }else if(m.kind==="pick"){
      /* сам кофр стоит в мире; здесь только трафарет на крышке — маленький,
         без дыхания и без заливки: тара с маркировкой, а не парящая иконка */
      const P=m.o,C=PICKUPS[P.kind];
      ctx.save();ctx.translate(m.p.x,m.p.y);
      ctx.scale(Math.max(.5,ppu*1.1),Math.max(.5,ppu*1.1));
      ctx.strokeStyle=C.col;ctx.lineWidth=2;
      if(P.kind==="medkit"){ctx.beginPath();ctx.moveTo(-4,0);ctx.lineTo(4,0);
        ctx.moveTo(0,-4);ctx.lineTo(0,4);ctx.stroke();}
      else if(P.kind==="armor"){ctx.beginPath();ctx.moveTo(0,-5);ctx.lineTo(5,-1);
        ctx.lineTo(0,5);ctx.lineTo(-5,-1);ctx.closePath();ctx.stroke();}
      else{ctx.beginPath();ctx.rect(-3,-4,6,8);ctx.stroke();}
      ctx.restore();
    }else if(m.kind==="foe"){
      const f=m.o,K=FOE_KINDS[f.kind]||FOE_KINDS.grunt;
      /* контактная тень на полу: без неё тело висит в воздухе на своей
         клетке — те самые «человечки», к которым автор и придрался (M180).
         Тень стоит на ПОЛУ, а не под качающимся телом: качание — тела, пол
         не качается */
      /* Страховка по вертикали: тень рисуется только НИЖЕ тела на экране.
         Писалась она против «врага, у которого пол выше собственной головы»,
         но настоящей причиной был перевёрнутый вектор верха — пол проецировался
         ВЫШЕ тел, и страховка глушила тени почти всем сразу (автор: «человечки»,
         M180). Вектор починен; страховка оставлена — она дёшева и всё ещё
         закрывает честный случай мезонина над залом. */
      /* тень — в единицах мира: пятно под ногами шириной чуть меньше плеч */
      const pf=proj(f.x,raidFloorAt(R,f.x,f.z)+1,f.z);
      if(pf&&pf.y>m.p.y+2){
        ctx.fillStyle="rgba(0,0,0,.42)";
        ctx.beginPath();ctx.ellipse(pf.x,pf.y,Math.max(3,11*ppu),Math.max(1.2,3.2*ppu),0,0,TAU);ctx.fill();
      }
      /* спрайт пирата ростом 32 px против 25 у астронавта — `s` посчитан под
         астронавта, поэтому здесь поправка 25/32 */
      ctx.save();ctx.translate(m.p.x,m.p.y);ctx.scale(s*.78,s*.78);
      drawFoeBody(f,K);
      ctx.restore();
      /* полоска здоровья стоит над головой: середина тела плюс полроста */
      const w=Math.max(14,(f.baron?34:22)*ppu),hp=clamp(f.hp/f.hpMax,0,1);
      const by=m.p.y-Math.max(12,32*ppu),bh=f.baron?6:4;
      ctx.fillStyle="rgba(0,0,0,.6)";ctx.fillRect(m.p.x-w/2,by,w,bh);
      ctx.fillStyle=f.baron?"rgba(255,140,90,.98)":
                   (f.boss?"rgba(255,90,70,.95)":"rgba(242,178,92,.9)");
      ctx.fillRect(m.p.x-w/2,by,w*hp,bh);
      if(f.baron){
        ctx.fillStyle="rgba(255,180,120,.95)";ctx.font="9px ui-monospace,monospace";
        ctx.textAlign="center";
        ctx.fillText("БАРОН",m.p.x,by-6);
      }
    }else{
      /* и у самого скафандра тень тоже: он ходит по тому же полу */
      const pm=proj(S.x,raidFloorAt(R,S.x,S.z)+1,S.z);
      if(pm&&pm.y>m.p.y+2){
        ctx.fillStyle="rgba(0,0,0,.45)";
        ctx.beginPath();ctx.ellipse(pm.x,pm.y,Math.max(3,9.5*ppu),Math.max(1.2,2.9*ppu),0,0,TAU);ctx.fill();
      }
      /* Метка стоит на середине роста, а спрайт нарисован вокруг своей
         середины — доводка на +10*s больше не нужна и при честном масштабе
         превратилась бы в полроста вниз. */
      ctx.save();ctx.translate(m.p.x,m.p.y);ctx.scale(s,s);
      drawAstronaut({phase:S.walkPhase,amp:keys.thrust||keys.brake?1:0,walk:false,air:false});
      ctx.restore();
    }
  }
  /* ── воздух отсека ──
     Пыль в луче нашлемного фонаря: три десятка частиц, привязанных к сетке
     вокруг игрока, чтобы они не «ехали» вместе с камерой. Без взвеси объём
     пустого коридора ничем не выдаёт себя. */
  {
    const gx0=Math.round(S.x/RCELL),gz0=Math.round(S.z/RCELL);
    ctx.fillStyle="rgba(210,225,240,.5)";
    for(let i=0;i<34;i++){
      const hh=hashi(gx0*31+i,gz0*17+i*7,0xD05);
      const px=(gx0-1.5)*RCELL+((hh>>>3)&255)/255*RCELL*3;
      const pz=(gz0-1.5)*RCELL+((hh>>>11)&255)/255*RCELL*3;
      const py=14+((hh>>>19)&127)/127*(RAID_H-24)+Math.sin(G.t*.03+i)*4;
      const p=proj(px,py,pz);if(!p)continue;
      const dd=Math.hypot(px-S.x,pz-S.z);
      ctx.globalAlpha=clamp(.28-dd/1400,0,.28);
      const s2=clamp(1600/p.z,.4,2.4);
      ctx.fillRect(p.x,p.y,s2,s2);
    }
    ctx.globalAlpha=1;
  }
  /* выстрелы и вспышки — последними, поверх всего */
  for(const sh of S.shots){
    const sy2=raidFloorAt(R,sh.x,sh.z)+40;
    const p=proj(sh.x,sy2,sh.z),q=proj(sh.x-sh.vx*2,sy2,sh.z-sh.vz*2);
    if(!p||!q)continue;
    ctx.strokeStyle=sh.mine?"rgba(127,230,216,.95)":"rgba(255,120,90,.95)";
    ctx.lineWidth=Math.max(1,2200/p.z*.06);
    ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(p.x,p.y);ctx.stroke();
  }
  /* ── свет шлема и тьма по краям ──
     Фонарь до сих пор жил только числом в li: сцена была равномерно освещена
     ниоткуда. Тёплое пятно по курсу и глубокая виньетка по краям делают
     из этого чужую базу, в которую влезли с фонарём. */
  {
    const tg=ctx.createRadialGradient(W/2,H*.52,0,W/2,H*.52,Math.min(W,H)*.5);
    tg.addColorStop(0,"rgba(255,238,205,.10)");
    tg.addColorStop(1,"rgba(255,238,205,0)");
    ctx.save();ctx.globalCompositeOperation="lighter";
    ctx.fillStyle=tg;ctx.fillRect(0,0,W,H);ctx.restore();
    const vg=ctx.createRadialGradient(W/2,H*.5,Math.min(W,H)*.28,W/2,H*.5,Math.max(W,H)*.72);
    vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,"rgba(0,0,0,.62)");
    ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
  }
  if(S.hurt>0){
    ctx.fillStyle="rgba(255,50,40,"+(S.hurt/10*.28).toFixed(2)+")";ctx.fillRect(0,0,W,H);
  }
  /* приборы: скафандр — он же здоровье */
  /* полоса скафандра и заряды ушли из угла канвы: скафандр — в строке
     состояния, заряды и броня — в строке места (hud(), M178). Пэды больше
     ничего не перекрывают. */
}
/* ── тело противника ──
   Абордаж — единственное место игры, где враг стоит на ногах в полный рост,
   а рисовался овалом с кружком-головой: на фоне отсеков с их сваркой и
   решётками это читалось фишкой из настолки. Здесь тело по тем же правилам,
   что фигуры в кантине и рубке: плечи шире таза, ноги врозь с разным тоном,
   оружие в руках, шлем с забралом. Барон отличается не размером, а силуэтом —
   плащ, гребень на шлеме и тяжёлый ствол на сошке. */
function drawFoeBody(f,K){
  const col=hex2rgb(K.col),r=K.r;
  const body=rgba(col,.95),dark=rgba(mixc(col,[8,12,18],.6),.96);
  const sc=f.baron?1.35:1;
  ctx.scale(sc,sc);
  /* поза покоя (хвост G4): пока тревоги нет, каждый второй привалился к
     стене — фигура скошена; оружие у всех опущено (ниже, у ствола) */
  if(!f.aware&&(f.seed&1))ctx.transform(1,0,.16,1,0,0);
  const bob=Math.sin((f.bob||0)+G.t*.05)*.8;
  ctx.fillStyle="rgba(0,0,0,.45)";                 // тень под ногами
  ctx.beginPath();ctx.ellipse(0,r*1.5,r*1.1,r*.3,0,0,TAU);ctx.fill();
  if(f.baron){
    /* Плащ — трапеция с изломом по низу, а не эллипс: округлый «мешок» съедал
       силуэт и делал барона снеговиком. Рисуется ДО ног, поэтому ноги видны. */
    ctx.fillStyle=rgba(mixc(col,[18,10,14],.55),.92);
    ctx.beginPath();
    // плащ узкий и с вырезом: широкий закрывал ноги, и барон читался конусом
    ctx.moveTo(-r*.62,-r*.85);ctx.lineTo(-r*1.05,r*1.2);ctx.lineTo(-r*.62,r*1.05);
    ctx.lineTo(-r*.5,r*.2);ctx.lineTo(r*.5,r*.2);ctx.lineTo(r*.62,r*1.05);
    ctx.lineTo(r*1.05,r*1.2);ctx.lineTo(r*.62,-r*.85);ctx.closePath();ctx.fill();
    ctx.strokeStyle=rgba(mixc(col,[255,220,190],.4),.35);ctx.lineWidth=r*.07;
    ctx.stroke();
  }
  ctx.fillStyle=dark;                              // ноги длиннее: тело было пеньком
  ctx.fillRect(r*.14,r*.45,r*.4,r*1.35);
  ctx.fillStyle=rgba(mixc(col,[8,12,18],.3),.96);
  ctx.fillRect(-r*.54,r*.45,r*.4,r*1.35);
  ctx.fillStyle="rgba(0,0,0,.35)";                 // подошвы
  ctx.fillRect(r*.1,r*1.68,r*.48,r*.16);ctx.fillRect(-r*.58,r*1.68,r*.48,r*.16);
  ctx.fillStyle=body;                              // торс трапецией
  ctx.beginPath();
  ctx.moveTo(-r*.62,-r*.75+bob);ctx.lineTo(r*.62,-r*.75+bob);
  ctx.lineTo(r*.82,-r*.15+bob);ctx.lineTo(r*.56,r*.55);ctx.lineTo(-r*.56,r*.55);
  ctx.lineTo(-r*.82,-r*.15+bob);ctx.closePath();ctx.fill();
  const sg=ctx.createLinearGradient(-r,0,r,0);     // объём
  sg.addColorStop(0,"rgba(255,255,255,.12)");sg.addColorStop(1,"rgba(0,0,0,.3)");
  ctx.fillStyle=sg;ctx.fill();
  ctx.fillStyle="rgba(0,0,0,.3)";                  // ремень
  ctx.fillRect(-r*.6,r*.12,r*1.2,r*.16);
  /* оружие: у тяжёлого и барона — ствол на сошке, у прочих короткий автомат.
     В покое — стволом вниз, поворотом всего блока рук вокруг плеча */
  ctx.save();
  if(!f.aware)ctx.rotate(.62);
  ctx.strokeStyle=dark;ctx.lineWidth=r*.28;ctx.lineCap="round";
  // обе руки: одна на рукояти, вторая на цевье — раньше ствол торчал из плеча
  ctx.beginPath();ctx.moveTo(r*.6,-r*.5+bob);ctx.lineTo(r*.85,r*.05);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-r*.55,-r*.45+bob);ctx.lineTo(r*.1,r*.1);
  ctx.lineTo(r*1.15,-r*.02);ctx.stroke();
  ctx.lineCap="butt";
  ctx.fillStyle="rgba(40,46,56,.98)";
  const gl=f.baron||f.kind==="heavy"?r*1.5:r*.95;
  ctx.fillRect(r*.75,-r*.1,gl,r*.22);
  if(f.baron||f.kind==="heavy"){                   // сошка под стволом
    ctx.strokeStyle="rgba(40,46,56,.9)";ctx.lineWidth=r*.1;
    ctx.beginPath();ctx.moveTo(r*1.6,r*.1);ctx.lineTo(r*1.4,r*.6);
    ctx.moveTo(r*1.6,r*.1);ctx.lineTo(r*1.9,r*.6);ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle=dark;                              // шея
  ctx.fillRect(-r*.16,-r*.95+bob,r*.32,r*.22);
  ctx.fillStyle="#1b2229";                         // шлем: голова была втрое велика
  ctx.beginPath();ctx.arc(0,-r*1.18+bob,r*.5,0,TAU);ctx.fill();
  if(f.baron){                                     // гребень: узкий и с завалом назад
    ctx.fillStyle=rgba(mixc(col,[255,220,180],.55),.95);
    ctx.beginPath();
    ctx.moveTo(r*.05,-r*1.72+bob);ctx.lineTo(r*.14,-r*1.62+bob);
    ctx.lineTo(r*.12,-r*1.35+bob);ctx.lineTo(-r*.26,-r*1.45+bob);ctx.closePath();ctx.fill();
    // наплечники: ранг виден плечами, а не размером
    ctx.fillStyle=rgba(mixc(col,[255,225,190],.35),.95);
    ctx.beginPath();ctx.ellipse(-r*.7,-r*.6+bob,r*.26,r*.16,-.4,0,TAU);ctx.fill();
    ctx.beginPath();ctx.ellipse(r*.7,-r*.6+bob,r*.26,r*.16,.4,0,TAU);ctx.fill();
  }
  ctx.fillStyle=f.aware?"rgba(255,90,70,.95)":"rgba(255,200,120,.7)";
  ctx.fillRect(-r*.34,-r*1.28+bob,r*.68,r*.18);    // забрало-полоса, а не глаз-точка
}
