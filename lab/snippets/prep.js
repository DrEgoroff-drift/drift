/* the hall's background prep in the system (27f4a hallPrepTick): per 10 s — bodies generated (cpBodyGen),
   prep steps, done/cdone, CP_MESH size, evictions; 60 s, turning right/left as jank does */
new Promise(res=>{const S=60,rows=[];let gen=0,steps=0,ev=0,last=0;
const og=globalThis.cpBodyGen;globalThis.cpBodyGen=function(){gen++;return og.apply(this,arguments);};
const os=globalThis.hallPrepStep;globalThis.hallPrepStep=function(){steps++;return os.apply(this,arguments);};
const od=CP_MESH.delete.bind(CP_MESH);CP_MESH.delete=function(k){ev++;return od(k);};
const t0=performance.now();
const iv=setInterval(()=>{const s=(performance.now()-t0)/1000,ph=Math.floor(s/8)%2;keys.right=!ph;keys.left=!!ph;
  if(s-last>=10){last+=10;const P=HALL_PRE;rows.push(Math.round(s)+"с: тел "+gen+", шагов "+steps+", вытеснено "+ev+", кэш "+CP_MESH.size+", done "+P.done+"/"+P.cdone+", люди "+(P.L?P.i+"/"+P.L.people.length:"-")+", кантина "+(P.cl?P.ci+"/"+P.cl.people.length:"-"));gen=steps=ev=0;}
  if(s>=S){clearInterval(iv);keys.right=keys.left=false;globalThis.cpBodyGen=og;globalThis.hallPrepStep=os;delete CP_MESH.delete;
    res({mode:G.mode,station:!!(G.sys&&G.sys.station),rows});}},100);})
