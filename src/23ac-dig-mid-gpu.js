/* ══════════════ средний слой шахты на видеокарте (G15) ══════════════
   Двойник digMid (23a): руда, ход, сколы, стены и пол, следы работы, крепь, лестница —
   фигурами сцены (08c gpuShapes) сразу после света породы (digShade). Кисти и числа те же;
   что сменилось и почему:
   · заливка хода — непрозрачные скруглённые прямоугольники (вид 6). У 2D она лежала .94–.88
     поверх породы одним путём; клетками полупрозрачная заливка двоилась бы в стыках сеткой.
     Порода, что просвечивала, вмешана в цвет клетки средним палитры; градиент по высоте и
     дымка от человека — цветом клетки по её середине (шаг меньше уровня);
   · сколы снаружи хода кладутся ДО заливки — она их и обрезает, как клип evenodd;
   · тени стен и пол — полосами в пиксель, обрезанными по скруглению открытого угла;
   · клип по ходу у следов работы снят: всё, что они рисуют, лежит внутри раздутой клетки;
   · табличка глубины — текст выпечкой GPU-холста, одна на число (кэш DIG_TXT). */
const DIG_TXT=new Map();
function digMidGpu(D,p,camx,camy,px,py,scanAll,r0,r1){
  if(!GPU.on||!GPU.dev)return false;
  const pass=gpuScene();if(!pass)return false;
  const C=DIG_CELL,O=[],A=[],S=[],TX=[];
  const dug=(c,r)=>{const q=D.cells[c+","+r];return !!(q&&q.dug);};
  const rect=(L,x,y,w,h,r,g,b,a)=>{if(w>0&&h>0)L.push([0,x,y,x+w,y+h,0,0,r,g,b,a]);};
  const tri=(L,a,b,c,col,m)=>L.push([5,a[0],a[1],b[0],b[1],c[0],c[1],col[0],col[1],col[2],col[3],m|0]);
  /* ── руда: ореол, зёрна с бликом, зарево тела (сложением) ── */
  for(let row=r0;row<=r1;row++)for(let col=-DIG_HALF;col<=DIG_HALF;col++){
    const cell=D.cells[col+","+row]||digCell(D,col,row);
    if(cell.dug||(!cell.res&&!cell.nearNode))continue;
    const dist=Math.hypot(col-D.col,row-D.row);
    if(!scanAll&&dist>7)continue;
    const x=col*C-camx,y=row*C-camy;
    if(cell.nearNode&&!cell.res){O.push([1,x+C/2,y+C/2,0,0,0,C*.85,0,0,0,.09]);continue;}
    if(!cell.res)continue;
    const c2=hexRGB(RES[cell.res].col);
    const vis=clamp((scanAll?1:1.15-dist/8),0,1),lampK=clamp(1.25-dist/3.5,0,1);
    const n=3+Math.min(5,cell.amount);
    for(let i=0;i<n;i++){
      const hh=hashi(col*137+i*31,row*211+i,0x0E2E);
      const cx=x+(hh&31)/31*C,cy=y+((hh>>>5)&31)/31*C;
      const rr=1.1+((hh>>>10)&3)*.55,el=1.7+((hh>>>13)&3)*.5;
      const an=.35+((hh>>>16)&7)/7*.5,ca=Math.cos(an),sa=Math.sin(an);
      /* эллипс — капсула вдоль наклона: полуось rr·el, толщина rr */
      const e=rr*el-rr;
      O.push([2,cx-ca*e,cy-sa*e,cx+ca*e,cy+sa*e,rr,0,c2[0],c2[1],c2[2],(.30+((hh>>>19)&7)/7*.35)*vis*(0.85+lampK*.35)]);
      const hx=cx+(-rr*.3*ca+rr*.35*sa),hy=cy+(-rr*.3*sa-rr*.35*ca),he=rr*.22;
      O.push([2,hx-ca*he,hy-sa*he,hx+ca*he,hy+sa*he,rr*.28,0,255,250,235,Math.min(1,(.22+((hh>>>22)&3)/3*.3)*vis*(0.7+lampK*1.5))]);
    }
    A.push([1,x+C/2,y+C/2,0,0,0,C*.8,c2[0],c2[1],c2[2],.07*vis]);
  }
  /* ── сколы и выщербины на породе у хода: до заливки, она обрежет лишнее ── */
  for(let row=r0;row<=r1;row++)for(let col=-DIG_HALF;col<=DIG_HALF;col++){
    if(!dug(col,row))continue;
    const x=col*C-camx,y=row*C-camy;
    const near=clamp(1-Math.hypot(col-D.col,row-D.row)/9,0,1);
    if(near<=.02)continue;
    const a1=.07+near*.16;
    for(let i=0;i<11;i++){
      const hh=hashi(col*31+i,row*17+i*7,0x9F1C);
      const ang=(hh&3),len=3+((hh>>>2)&5);
      const ox=(hh>>>5&31)/31*(C+8)-4,oy=(hh>>>10&31)/31*(C+8)-4;
      rect(S,x+ox,y+oy,ang%2?len:1.4,ang%2?1.4:len,214,206,188,a1);
    }
    for(let i=0;i<4;i++){
      const hh=hashi(col*13+i*5,row*29+i,0xB3E7);
      const ox=(hh&31)/31*(C+8)-4,oy=((hh>>>6)&31)/31*(C+8)-4;
      const rr=1+((hh>>>12)&2)*.7;
      S.push([1,x+ox,y+oy,rr,0,0,0,0,0,0,.16+near*.18]);
      rect(S,x+ox-rr*.7,y+oy+rr*.5,rr*1.4,.9,226,218,200,.05+near*.08);
    }
  }
  /* ── заливка хода: те же клетки, что digVoidPath, непрозрачно ── */
  const pal=(p&&p.T&&p.T.pal)||[[70,70,74]],rk=[0,0,0];
  for(const c of pal)for(let j=0;j<3;j++)rk[j]+=c[j]/pal.length;
  const g0=-camy%C,hx0=px-camx+C/2,hy0=py-camy+C/2;
  const voidCol=(yc,xc)=>{
    const t=clamp((yc-g0)/Math.max(1,H-g0),0,1),al=.94-.06*t;
    const hz=.085*clamp((Math.hypot(xc-hx0,yc-hy0)-40)/420,0,1);
    const v=[4+5*t,5+3*t,8-t];
    return [0,1,2].map(j=>{const b=v[j]*al+rk[j]*(1-al)*.6;return b+(([78,80,86])[j]-b)*hz;});
  };
  for(let row=r0;row<=r1;row++)for(let col=-DIG_HALF;col<=DIG_HALF;col++){
    if(!dug(col,row))continue;
    const x=col*C-camx,y=row*C-camy,h=hashi(col,row,0xD16C),rad=5+((h>>>3)&7)*.9;
    const vc=voidCol(y+C/2,x+C/2);
    S.push([6,x-4,y-4,x+C+4,y+C+4,rad,0,vc[0],vc[1],vc[2],1]);
    if(col===0&&dug(0,row-1)&&!dug(-1,row)&&!dug(1,row)){
      const m=row%11;
      if(m===5||m===6)rect(S,x-15,y-3,C+30,C+6,vc[0],vc[1],vc[2],1);
      else{const hn=hashi(row,0x4E1C,1);
        if((hn&7)===0){const s=((hn>>>3)&1)?1:-1,nx=s<0?x-13:x+C+1;rect(S,nx,y+7,12,17,vc[0],vc[1],vc[2],1);}}
    }
  }
  /* ── стены и пол внутри хода: полосами, обрезанными по открытому скруглённому углу ── */
  for(let row=r0;row<=r1;row++)for(let col=-DIG_HALF;col<=DIG_HALF;col++){
    if(!dug(col,row))continue;
    const x=col*C-camx,y=row*C-camy,h=hashi(col,row,0xD16C),rad=5+((h>>>3)&7)*.9;
    const X0=x-4,Y0=y-4,X1=x+C+4,Y1=y+C+4;
    const up=dug(col,row-1),dn=dug(col,row+1),lf=dug(col-1,row),rt=dug(col+1,row);
    const tl=!up&&!lf&&!dug(col-1,row-1),tr=!up&&!rt&&!dug(col+1,row-1),
          bl=!dn&&!lf&&!dug(col-1,row+1),br=!dn&&!rt&&!dug(col+1,row+1);
    const ins=d=>d>=rad?0:rad-Math.sqrt(Math.max(0,rad*rad-(rad-d)*(rad-d)));
    const hb=(xa,xb,ya,yb,r,g,b,a)=>{const ym=(ya+yb)/2;let l=xa,rr=xb;
      if(ym<Y0+rad){const i=ins(ym-Y0);if(tl)l=Math.max(l,X0+i);if(tr)rr=Math.min(rr,X1-i);}
      if(ym>Y1-rad){const i=ins(Y1-ym);if(bl)l=Math.max(l,X0+i);if(br)rr=Math.min(rr,X1-i);}
      rect(S,l,ya,rr-l,yb-ya,r,g,b,a);};
    const vb=(xa,xb,ya,yb,r,g,b,a)=>{const xm=(xa+xb)/2;let t=ya,bo=yb;
      if(xm<X0+rad){const i=ins(xm-X0);if(tl)t=Math.max(t,Y0+i);if(bl)bo=Math.min(bo,Y1-i);}
      if(xm>X1-rad){const i=ins(X1-xm);if(tr)t=Math.max(t,Y0+i);if(br)bo=Math.min(bo,Y1-i);}
      rect(S,xa,t,xb-xa,bo-t,r,g,b,a);};
    /* тень от стены внутрь хода и волосок света по самой грани */
    if(!up){for(let i=0;i<10;i++)hb(x-4,x+C+4,y-4+i,y-3+i,0,0,0,.62*(1-(i+.5)/10));
      hb(x-4,x+C+4,y-4,y-2.8,185,220,240,.16);}
    if(!dn)for(let i=0;i<6;i++)hb(x-4,x+C+4,y+C-2+i,y+C-1+i,0,0,0,.62);
    if(!lf){for(let i=0;i<8;i++)vb(x-4+i,x-3+i,y-4,y+C+4,0,0,0,.62*(1-(i+.5)/8));
      vb(x-4,x-2.8,y-4,y+C+4,185,220,240,.10);}
    if(!rt){for(let i=0;i<8;i++)vb(x+C-4+i,x+C-3+i,y-4,y+C+4,0,0,0,.62);
      vb(x+C+2.8,x+C+4,y-4,y+C+4,185,220,240,.10);}
    /* пол: осыпь, отбитая порода, волосок света по кромке */
    if(!dn){
      const fy=y+C-3;
      for(let i=0;i<13;i++)hb(x-4,x+C+4,fy-7+i,fy-6+i,96,86,70,.42*(i+.5)/13);
      for(let i=0;i<6;i++){
        const hh=hashi(col*41+i,row*23,0x71B0);
        const ox=(hh&63)/63*C,s=1.2+((hh>>>7)&3)*.8,edge=Math.abs(ox-C/2)/(C/2);
        gpuQuad(S,[x+ox-s,fy+3],[x+ox-s*.3,fy+3-s*1.1],[x+ox+s*.8,fy+3-s*.4],[x+ox+s*.5,fy+3],
          [118+((hh>>>9)&15),106+((hh>>>13)&15),88,Math.round((.22+edge*.26)*100)/100]);
      }
      hb(x-4,x+C+4,fy-7.4,fy-6.4,206,196,172,.10);
    }
  }
  /* ── следы работы: путь, вагонетка, инструмент, труба, полки, лампы, камеры и ниши ── */
  const lamp=(lx,ly)=>{rect(S,lx-2,ly-3,5,7,60,66,72,.95);rect(S,lx-1,ly-1,3,3,255,228,170,.95);
    (D._lamps||(D._lamps=[])).push([lx+.5,ly+.5]);};
  for(let row=r0;row<=r1;row++)for(let col=-DIG_HALF;col<=DIG_HALF;col++){
    if(!dug(col,row))continue;
    const x=col*C-camx,y=row*C-camy;
    const floor=!dug(col,row+1),along=dug(col-1,row)||dug(col+1,row);
    if(floor&&along&&col!==0){
      const fy=y+C-5;
      for(let k=0;k<3;k++)rect(S,x+2+k*10,fy+1.4,7,2.2,74,58,40,.55);
      rect(S,x-4,fy,C+8,1.3,150,152,158,.42);rect(S,x-4,fy+3.6,C+8,1.3,150,152,158,.42);
      if(((hashi(col,row,0x7ADD)>>>4)&31)===0){
        const bx=x+4,bw=C-9,by=fy-12;
        rect(S,bx-1,fy-1,bw+2,2,0,0,0,.35);
        gpuQuad(S,[bx,by],[bx+bw,by],[bx+bw-3,fy-2],[bx+3,fy-2],[62,56,50,.96]);
        rect(S,bx+3,by+5,bw-6,1.2,38,34,30,.9);
        rect(S,bx-1,by-1.6,bw+2,2.2,112,104,92,.95);
        rect(S,bx-1,by-1.6,bw+2,.8,170,160,144,.35);
        /* горка породы: пять точек с ложбиной — три треугольника, общие рёбра жёсткие */
        const P0=[bx+1,by-1],P1=[bx+bw*.3,by-6],P2=[bx+bw*.55,by-4],P3=[bx+bw*.75,by-7],P4=[bx+bw-1,by-1],pc=[92,84,72,.95];
        tri(S,P0,P1,P2,pc,4);tri(S,P0,P2,P4,pc,3);tri(S,P2,P3,P4,pc,4);
        rect(S,bx+bw*.3-1,by-6,2,1.4,150,140,120,.3);rect(S,bx+bw*.75-1,by-7,2,1.4,150,140,120,.3);
        for(const wx of [bx+4,bx+bw-4])S.push([1,wx,fy,2.4,0,0,0,20,18,16,.95]);
        for(const wx of [bx+4,bx+bw-4])S.push([1,wx,fy,.9,0,0,0,120,120,124,.5]);
      }
      else if(!dug(col-1,row)||!dug(col+1,row)){
        if(((hashi(col,row,0x1700)>>>3)&7)===0){
          const s=dug(col+1,row)?-1:1,hx=s<0?x+3:x+C-3;
          S.push([2,hx,fy,hx+s*6,fy-17,.9,0,128,104,72,.8]);
          S.push([2,hx+s*3,fy-19,hx+s*10,fy-15,1.1,0,150,154,160,.75]);
        }
      }
    }
    if(col===0&&dug(col,row-1)){
      rect(S,x+C-7,y,4.4,C,74,86,92,.75);
      rect(S,x+C-7,y,1.2,C,150,168,176,.20);
      if(row%3===0)rect(S,x+C-8.4,y+C*.3,7.2,2.6,96,104,110,.9);
      if(row%8===0&&floor===false){
        const by=y+C-7,h=hashi(row,0x7A1F,5);
        rect(S,x-4,by+3,C+8,3,0,0,0,.45);
        rect(S,x-4,by,C+8,3.4,118,90,56,.92);
        rect(S,x-4,by,C+8,1,200,168,118,.22);
        for(const s of [-1,1]){const kx=s<0?x-3:x+C+3;tri(S,[kx,by+3],[kx+s*-6,by+3],[kx,by+9],[96,104,112,.9]);}
        if(h&1){rect(S,x+2,by-9,11,9,70,64,54,.95);rect(S,x+2,by-9,11,1.2,120,110,92,.6);rect(S,x+7,by-9,1,9,0,0,0,.35);}
        lamp(x-1,y+6);
        rect(S,x+C-14,y+4,12,6,30,32,36,.95);
        TX.push(["−"+(row*3),x+C-14,y+4]);
      }
      const sd=dug(col-1,row)||dug(col+1,row);
      if(!sd){
        const m=row%11;
        if(m===5){for(const s of [-1,1])lamp(s<0?x-12:x+C+12,y+8);}
        else if(m===6){
          const bx=x-13,bw=9,by=y+C-14;
          rect(S,bx-1,by+13,bw+2,2,0,0,0,.4);
          rect(S,bx,by,bw,14,72,66,58,.96);
          rect(S,bx,by,1.2,14,150,140,120,.35);
          rect(S,bx-.6,by+3,bw+1.2,1.4,120,124,130,.85);rect(S,bx-.6,by+9.5,bw+1.2,1.4,120,124,130,.85);
        }else{
          const hn=hashi(row,0x4E1C,1);
          if((hn&7)===0){
            const s=((hn>>>3)&1)?1:-1,nx=s<0?x-13:x+C+1;
            rect(S,nx,y+22,12,2,118,90,56,.92);rect(S,nx,y+24,12,1.4,0,0,0,.4);
            if((hn>>>4)&1){rect(S,nx+2,y+14,8,8,70,64,54,.95);rect(S,nx+2,y+14,8,1,120,110,92,.6);}
            else lamp(nx+6,y+17);
          }
        }
      }
    }
  }
  /* ── крепь: две стойки, верхняк, косынки ── */
  for(let row=r0;row<=r1;row++)for(let col=-DIG_HALF;col<=DIG_HALF;col++){
    if(!dug(col,row))continue;
    if(col===0?(row%4):(col%4))continue;
    const x=col*C-camx,y=row*C-camy,h=hashi(col*73856+row*19349,0x7100,3);
    const lean=((h&7)/7-.5)*1.6,w0=1.9+((h>>>3)&3)*.35,top=y+2.2;
    for(const [qx,dir] of [[x-2.4,1],[x+C+.6,-1]]){
      gpuQuad(S,[qx,y+C],[qx+w0,y+C],[qx+w0+dir*lean,top],[qx+dir*lean,top],[122,92,58,.86]);
      rect(S,qx+w0*.3,top+2,.8,C-4,198,162,110,.16);
      rect(S,qx+w0-.7,top+1,.7,C-2,0,0,0,.28);
    }
    rect(S,x-5,top-2.6,C+10,4.4,138,104,64,.9);
    rect(S,x-5,top-2.6,C+10,1,214,182,132,.18);
    rect(S,x-5,top+1.8,C+10,2.2,0,0,0,.34);
    for(const s of [-1,1]){const qx=s<0?x-1.6:x+C+1.6;tri(S,[qx,top+2],[qx+s*5.5,top+2],[qx,top+8],[120,90,56,.8]);}
  }
  /* ── лестница: тень, тетивы, ступени, хомуты ── */
  for(let row=r0;row<=r1;row++)for(let col=-DIG_HALF;col<=DIG_HALF;col++){
    const cell=D.cells[col+","+row];
    if(!cell||!cell.dug||!cell.ladder)continue;
    const x=col*C-camx,y=row*C-camy,h=hashi(col,row,0x1ADD);
    const off=((h&7)/7-.5)*1.4,L=x+C*.34+off,R=x+C*.62+off;
    rect(S,L+2.2,y,R-L,C,0,0,0,.30);
    rect(S,L,y,1.8,C,150,112,66,.85);rect(S,R,y,1.8,C,150,112,66,.85);
    rect(S,L,y,.7,C,206,168,112,.20);rect(S,R,y,.7,C,206,168,112,.20);
    for(let k=0;k<4;k++){const ry=y+C*(k+.5)/4;
      rect(S,L,ry,R-L+1.8,1.7,164,124,74,.9);rect(S,L,ry+1.7,R-L+1.8,.9,0,0,0,.3);}
    if(row%4===0)rect(S,L-1.4,y+1.5,R-L+4.6,2.2,96,104,112,.8);
  }
  gpuShapes(pass,O,{blend:"over"});
  gpuShapes(pass,A,{blend:"add"});
  gpuShapes(pass,S,{blend:"over"});
  /* табличка глубины: число — выпечка GPU-холста, одна на число */
  for(const [t,x,y] of TX){
    const B=gpuBaked(DIG_TXT,t,48,24,g=>{g.setTransform(4,0,0,4,0,0);g.fillStyle="rgba(255,228,170,.75)";
      g.font="5px ui-monospace,monospace";g.textAlign="center";g.fillText(t,6,5);},{mips:false,ss:1,keep:64});
    if(B)gpuImage(pass,B,[{x,y,w:12,h:6}]);
  }
  return true;
}
/* двойник кромки на видеокарте (G15): те же травины и щебень фигурами сцены —
   кривая травины ломается в два отрезка по её середине, эллипс щебня — капсула,
   градиент воздуха — шестнадцать полос по три пикселя (шаг альфы .02 глазу не виден).
   Ложь — видеокарты нет, рисует 2D */
function digSurfFringeGpu(p,camx,camy){
  if(!GPU.on||!GPU.dev)return false;
  if(camy>60||camy+H<-40)return true;
  const pass=gpuScene();if(!pass)return false;
  const C=digSoilCols(p), s=(p&&p.seed)|0, S=[];
  {
    const yh=digSurfY(p,camx+W*.5)-camy;
    const sky=(p.T&&p.T.sky&&p.T.sky[0])||[90,120,150];
    for(let i=0;i<16;i++){
      const t=(i+.5)/16, y0=yh-46+i*3;
      S.push([0,0,y0,W,y0+3,0,0,Math.min(255,sky[0]+38*t),Math.min(255,sky[1]+38*t),Math.min(255,sky[2]+38*t),.30*t]);
    }
  }
  const rub=C.air?null:digSMix(C.turf,[210,210,214],.35);
  for(let wx=Math.floor((camx-30)/13)*13;wx<camx+W+30;wx+=13){
    const hh=hashi(Math.floor(wx/13),s,0x7A5E);
    if((hh&3)===0||((hh>>>17)&7)<2)continue;
    const x=wx-camx+((hh>>>2)&7)-3, y=digSurfY(p,wx)-camy+.5;
    if(C.air){
      const n=2+((hh>>>5)&3);
      for(let i=0;i<n;i++){
        const h2=hashi(Math.floor(wx/13)*5+i,s,0x3C1D);
        const ln=2.5+((h2>>>2)&7)*1.15, an=-1.57+(((h2>>>6)&15)/15-.5)*1.5;
        const hw=(1+((h2>>>10)&1)*.4)*.5;
        const x0=x+i*.9-1, qx=x+Math.cos(an)*ln*.6, qy=y+Math.sin(an)*ln*.7,
              ex=x+Math.cos(an)*ln, ey=y+Math.sin(an)*ln,
              mx=.25*x0+.5*qx+.25*ex, my=.25*y+.5*qy+.25*ey;
        S.push([2,x0,y,mx,my,hw,0,26,34,18,.62],[2,mx,my,ex,ey,hw,0,26,34,18,.62]);
      }
    }else{
      const rr=1.3+((hh>>>5)&3)*.6, ry=rr*.8, dx=rr*1.4-ry, cy=y-rr*.35;
      S.push([2,x-dx,cy,x+dx,cy,ry,0,rub[0],rub[1],rub[2],.9],
             [0,x-rr*1.3,y,x+rr*1.3,y+1,0,0,0,0,0,.25]);
    }
  }
  gpuShapes(pass,S,{blend:"over"});
  return true;
}
