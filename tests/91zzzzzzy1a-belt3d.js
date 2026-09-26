/* ══════════════ пояс в 3D (G8): данные для видеокарты ══════════════
   Камень рисуется сеткой с глубиной и светом по пикселю (24be). Картинку сторожат
   ворота ступени (91zzzzzzy1) и пары кадров; здесь — то, что видеокарте отдаёт JS:
   нормали вершин наружу и единичные (иначе свет ляжет на теневую сторону — так и
   было в первой сборке, пока не сменили обход граней), затенение ложбин в своих
   пределах, руда по вершине, и пыль, что светится против светила ярче, чем по свету */
TEST_SUITES.push(()=>suite("пояс в 3D: сетка камня для видеокарты — нормали наружу, ложбины темнее, руда по вершине",()=>{
  resetWorld();
  let s=null;
  for(let r=0;r<=10&&!s;r++)for(let x=-r;x<=r&&!s;x++)for(let y=-r;y<=r&&!s;y++){const q=getSystem(x,y);if(q.belt){s=q;G.sx=x;G.sy=y;}}
  if(!ok(s,"нашлась система с поясом"))return;
  G.sys=s;G.mode="system";enterBelt();
  const b=G.belt,out=new Float32Array(BROCK_NV*8);
  let bad=0,unit=0,aoLo=9,aoHi=-9,ore=0,dark=0,n=0;
  for(const a of b.ast.slice(0,12)){
    ok(a.mesh.vore&&a.mesh.vore.length===BROCK_NV,"руда по вершине у камня есть");
    brockMeshData(a.mesh,out,0);
    for(let i=0;i<BROCK_NV;i++){
      const k=i*8,d=out[k]*out[k+4]+out[k+1]*out[k+5]+out[k+2]*out[k+6];
      if(d<=0)bad++;
      if(Math.abs(Math.hypot(out[k+4],out[k+5],out[k+6])-1)<1e-4)unit++;
      aoLo=Math.min(aoLo,out[k+3]);aoHi=Math.max(aoHi,out[k+3]);
      if(Math.abs(out[k+7]-a.mesh.vore[i])<1e-6)ore++;
      if(out[k+3]<.97)dark++;
      n++;
    }
  }
  eq(bad,0,"все нормали смотрят наружу");
  eq(unit,n,"все нормали единичные");
  ok(aoLo>=.449&&aoHi<=1.121,"затенение в пределах [.45, 1.12]: "+aoLo.toFixed(2)+"…"+aoHi.toFixed(2));
  ok(dark>n*.1,"ложбины есть — затенение не пустое ("+dark+" из "+n+")");
  eq(ore,n,"руда вершин ушла в сетку как есть");
  resetWorld();
}));
TEST_SUITES.push(()=>suite("пояс в 3D: пыль против светила ярче и в его цвет, по свету — тусклая; за спиной не рисуется",()=>{
  resetWorld();
  let s=null;
  for(let r=0;r<=10&&!s;r++)for(let x=-r;x<=r&&!s;x++)for(let y=-r;y<=r&&!s;y++){const q=getSystem(x,y);if(q.belt){s=q;G.sx=x;G.sy=y;}}
  if(!ok(s,"нашлась система с поясом"))return;
  G.sys=s;G.mode="system";enterBelt();
  const b=G.belt;b.x=900;b.y=0;b.z=0;b.vx=b.vy=b.vz=0;b.roll=0;b.pitch=0;
  const scol=hex2rgb(s.cls.col),SUN=[-1,0,0];
  const look=yaw=>{b.yaw=yaw;const f=beltFwd(b);b.dust=[{x:b.x+f[0]*120,y:b.y+f[1]*120,z:b.z+f[2]*120},{x:b.x-f[0]*120,y:b.y,z:b.z-f[2]*120}];
    const m=beltDust(b,SUN,scol),D=BROCK.D,t=D[8]+D[9]+D[10],ts=scol[0]+scol[1]+scol[2];
    /* насколько цвет пылинки ушёл к цвету светила — расстояние в цветности */
    return {m,a:D[3],c:Math.hypot(D[8]/t-scol[0]/ts,D[9]/t-scol[1]/ts,D[10]/t-scol[2]/ts)};};
  const to=look(-Math.PI/2),away=look(Math.PI/2);
  eq(to.m,1,"пылинка за спиной не рисуется — в кадре одна");
  ok(to.a>away.a*2,"против светила пылинка ярче: "+to.a.toFixed(3)+" против "+away.a.toFixed(3));
  ok(to.c<away.c,"и берёт цвет светила, по свету — свой холодный: "+to.c.toFixed(3)+" < "+away.c.toFixed(3));
  resetWorld();
}));
