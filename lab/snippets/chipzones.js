/* chip touch zones in the system (SYS_CHIPS, 17-mode-system): pairwise overlap of zones, and how much of each
   chip's own plate a finger loses to a neighbour under the input's nearest-centre rule (15-input). Units: CSS px
   (zones are in canvas px; divide by canvas px per CSS px) */
new Promise(res=>setTimeout(()=>{
  const cv=document.getElementById("c"),k=cv.width/cv.getBoundingClientRect().width;
  const Z=SYS_CHIPS.map(c=>({l:c.l,x0:c.x/k,y0:c.y/k,x1:(c.x+c.w)/k,y1:(c.y+c.h)/k,p:c.pl.map(v=>v/k)}));
  const ov=[];
  for(let i=0;i<Z.length;i++)for(let j=i+1;j<Z.length;j++){const a=Z[i],b=Z[j];
    const w=Math.min(a.x1,b.x1)-Math.max(a.x0,b.x0),h=Math.min(a.y1,b.y1)-Math.max(a.y0,b.y0);
    if(w>0&&h>0)ov.push([a.l,b.l,+w.toFixed(1),+h.toFixed(1)]);}
  /* plate sampled 9×5: the point goes to the zone whose centre is nearest, among zones that hold it */
  const lost=[];
  for(const a of Z){const [px,py,pw,ph]=a.p;let n=0,bad=0;
    for(let u=0;u<9;u++)for(let v=0;v<5;v++){const x=px+pw*(u+.5)/9,y=py+ph*(v+.5)/5;n++;
      let best=null,bd=1e9;for(const c of Z){if(x<c.x0||x>c.x1||y<c.y0||y>c.y1)continue;
        const d=Math.hypot(x-(c.x0+c.x1)/2,y-(c.y0+c.y1)/2);if(d<bd){bd=d;best=c;}}
      if(best!==a)bad++;}
    if(bad)lost.push([a.l,Math.round(100*bad/n)+"%"]);}
  res({W:innerWidth,H:innerHeight,k:+k.toFixed(2),chips:Z.length,zoneOverlaps:ov,plateLost:lost});
},1500))
