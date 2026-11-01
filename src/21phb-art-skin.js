/* Компактные сетки персонажей: координаты с шагом 1/4096 м, общие вершины,
   четыре плавных веса. Распаковка только при первом появлении модели. */
function artBytes(s){const t=atob(s),a=new Uint8Array(t.length);for(let i=0;i<t.length;i++)a[i]=t.charCodeAt(i);return a;}
function artLz4(a,size){
  const out=new Uint8Array(size);let i=0,o=0;
  while(i<a.length){const token=a[i++];let n=token>>4;
    if(n===15){let v;do{v=a[i++];n+=v;}while(v===255);}
    if(i+n>a.length||o+n>size)throw Error("Повреждена сетка персонажа");
    out.set(a.subarray(i,i+n),o);i+=n;o+=n;if(i>=a.length)break;
    const offset=a[i++]|a[i++]<<8;let len=(token&15)+4;
    if((token&15)===15){let v;do{v=a[i++];len+=v;}while(v===255);}
    if(!offset||offset>o||o+len>size)throw Error("Повреждены веса персонажа");
    for(let k=0;k<len;k++){out[o]=out[o-offset];o++;}
  }
  if(o!==size)throw Error("Неполная сетка персонажа");return out;
}
function artSkinRead(q){
  const n=q.n,stride=q.s||20,packed=artBytes(q.v),rawV=q.z?artLz4(packed,n*stride):packed,b=q.p?new Uint8Array(n*stride):rawV;
  if(q.p)for(let k=0;k<stride;k++)for(let i=0;i<n;i++)b[i*stride+k]=rawV[k*n+i];
  const d=new DataView(b.buffer),code=new Uint8Array(n);
  const p=new Float32Array(n*3),no=new Float32Array(n*3),c=new Float32Array(n*3),j=new Uint8Array(n*4),w=new Float32Array(n*4);
  for(let i=0;i<n;i++){const o=i*stride,k=i*3,h=i*4;code[i]=stride>20?b[o+20]:0;
    for(let a=0;a<3;a++){p[k+a]=d.getInt16(o+a*2,true)/4096;no[k+a]=d.getInt8(o+6+a)/127;c[k+a]=b[o+9+a]/255;}
    for(let a=0;a<4;a++){j[h+a]=b[o+12+a];w[h+a]=b[o+16+a]/255;}}
  const raw=artBytes(q.i),ib=q.z?artLz4(raw,q.d||q.t*6):raw,id=new DataView(ib.buffer),ix=new Uint16Array(q.t*3);
  if(q.d){let at=0,prev=0;for(let i=0;i<ix.length;i++){let v=0,shift=0,x;do{x=ib[at++];v|=(x&127)<<shift;shift+=7;}while(x&128);prev+=(v&1)?-((v+1)>>1):v>>1;ix[i]=prev;}}
  else for(let i=0;i<ix.length;i++)ix[i]=id.getUint16(i*2,true);
  return {p,no,c,j,w,ix,n,b:q.b,code};
}
/* Матрица отрезка: поворот + растяжение вдоль кости. Пальцы следуют кисти,
   а четыре веса на стыках сохраняют цельную кожу при посадке и ходьбе. */
function artSkinSegment(a,b,c,d){
  const u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],v=[d[0]-c[0],d[1]-c[1],d[2]-c[2]];
  const lu=Math.hypot(...u)||1,lv=Math.hypot(...v)||1;
  for(let k=0;k<3;k++){u[k]/=lu;v[k]/=lv;}
  const dot=Math.max(-1,Math.min(1,u[0]*v[0]+u[1]*v[1]+u[2]*v[2]));
  let ax=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],sn=Math.hypot(...ax);
  if(sn<1e-7){if(dot>0)ax=[0,0,1];else{ax=Math.abs(u[0])<.8?[0,u[2],-u[1]]:[-u[2],0,u[0]];const l=Math.hypot(...ax);ax=ax.map(x=>x/l);}}
  else ax=ax.map(x=>x/sn);
  const [x,y,z]=ax,k=1-dot,R=[dot+x*x*k,x*y*k-z*sn,x*z*k+y*sn,y*x*k+z*sn,dot+y*y*k,y*z*k-x*sn,z*x*k-y*sn,z*y*k+x*sn,dot+z*z*k];
  const M=new Float32Array(12),stretch=lv/lu-1;
  for(let r=0;r<3;r++){for(let col=0;col<3;col++)M[r*4+col]=R[r*3+col]+v[r]*u[col]*stretch;
    M[r*4+3]=c[r]-M[r*4]*a[0]-M[r*4+1]*a[1]-M[r*4+2]*a[2];}
  return M;
}
/* Применяет веса один раз при сборке позы; совместим с исходными индексами. */
function artSkinPose(Q,mat,out){
  const p=out?out.p:new Float32Array(Q.n*3),no=out?out.no:new Float32Array(Q.n*3);
  const ids=out&&out.ids,count=ids?ids.length:Q.n;
  for(let at=0;at<count;at++){const i=ids?ids[at]:at,v=i*3,h=i*4,x=Q.p[v],y=Q.p[v+1],z=Q.p[v+2],nx=Q.no[v],ny=Q.no[v+1],nz=Q.no[v+2];
    p[v]=p[v+1]=p[v+2]=no[v]=no[v+1]=no[v+2]=0;
    for(let a=0;a<4;a++){const w=Q.w[h+a];if(!w)continue;const m=mat[Q.j[h+a]];
      for(let r=0;r<3;r++){const b=r*4;p[v+r]+=(m[b]*x+m[b+1]*y+m[b+2]*z+m[b+3])*w;
        no[v+r]+=(m[b]*nx+m[b+1]*ny+m[b+2]*nz)*w;}}
    const l=Math.hypot(no[v],no[v+1],no[v+2]);if(l<1e-8)no[v+1]=1;else for(let r=0;r<3;r++)no[v+r]/=l;
  }
  return out||{p,no};
}
