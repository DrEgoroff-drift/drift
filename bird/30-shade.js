/* ══════════════ шейдеры ══════════════
   Всё освещение в линейном пространстве и в HDR; sRGB и тон-компрессия — один
   раз, в самом конце (`50-render`). Куски, общие для тела, перьев и частей,
   держатся здесь строками и склеиваются в программы: расходиться им нельзя,
   иначе перо освещено не так, как тело под ним, и птица распадается.

   СВЕТ ПТИЦЫ — тот же, что в игре: тёплый ключ сверху, холодный подбой слева
   (в игре — от приборов), и обвод сзади, чтобы силуэт не тонул в пустоте. */

/* ── общая часть вершинных программ: поза ──
   Кости не нужны: у сидящей птицы всего три сустава — шея, корпус и лапы.
   Поворот шеи взвешен по параметру хребта t, поэтому голова тянет за собой
   шею, а не отрывается от неё. */
const GL_RIG=`
uniform float uHeadYaw,uHeadPitch,uHeadRoll,uBreath,uLean,uBow,uTime,uPuff,uBlink,uJaw;
uniform float uFlap,uStretch,uFan,uCrest,uTuck,uStep,uHop,uTurn,uFootUp,uFootSide,uPeck,uHang;
uniform vec3 uNeckP;
mat3 rotAxis(vec3 ax,float a){
  float c=cos(a),s=sin(a),k=1.0-c;
  return mat3(ax.x*ax.x*k+c, ax.x*ax.y*k+ax.z*s, ax.x*ax.z*k-ax.y*s,
              ax.y*ax.x*k-ax.z*s, ax.y*ax.y*k+c, ax.y*ax.z*k+ax.x*s,
              ax.z*ax.x*k+ax.y*s, ax.z*ax.y*k-ax.x*s, ax.z*ax.z*k+c);
}
/* ── суставы оперения ──
   Крыло, хвост и хохол — три поворота, без которых повадки из игры нечем
   играть: «хлопнуть крыльями», «веер хвостом», «вскинуть хохол» опираются
   именно на них. Ось крыла — плечо, хвоста — его корень, хохла — темя.
   Считается ДО поворота головы и корпуса: сустав локальный, поза общая. */
const vec3 SHOULDER=vec3(0.20,1.16,-0.06);
const vec3 TAILROOT=vec3(0.0,0.56,-0.62);
const vec3 CROWN=vec3(0.0,1.80,-0.02);
void crestTurn(inout vec3 p, inout vec3 n){
  mat3 R=rotAxis(vec3(1.0,0.0,0.0),-uCrest*0.62);
  p=CROWN+R*(p-CROWN); n=R*n;
}
void plumeJoints(inout vec3 p, inout vec3 n, float kind, float sx, float tSpine, float bx){
  if(kind>0.5&&kind<1.5){
    vec3 sh=vec3(sx*SHOULDER.x,SHOULDER.y,SHOULDER.z);
    /* Ось РАСКРЫТИЯ — вертикальная: сложенное крыло лежит вдоль тела назад, а
     раскрытое смотрит вбок, то есть перо надо повернуть из -Z в +X. Поворот
     вокруг Z, который стоял здесь сначала, почти не двигает перья, лежащие
     вдоль Z, — крыло просто пропадало внутри тела. Подъём добавляется вторым
     поворотом, уже вокруг Z. */
    /* ВЕЕР КРЫЛА: чем дальше перо от плеча по хребту, тем сильнее оно
       отводится. Без этого раскрытое крыло — одна лопасть, а на листе
       породы в полёте видно каждое маховое отдельно. */
    /* Крыло раскрывается ЦЕЛИКОМ одним поворотом, и только поверх него идёт
       веер — небольшой доворот в плоскости самого крыла, свой у каждого пера.
       Когда веером двигали основной угол, дальние перья уходили вверх-вперёд
       и крыло накрывало голову. */
    float ord=clamp((0.66-tSpine)*3.0,0.0,1.0);
    /* Раскрытие до ста десяти градусов: по обмеру настоящего ары крыло уходит
       почти строго вбок, и его длина близка к длине корпуса. При прежних
       восьмидесяти сверху крыло выступало на треть корпуса — не крыло, а
       оборка. */
    float open=uFlap*0.95+uStretch*0.60;
    float sprd=open+(ord-0.5)*0.18*open;
    mat3 R=rotAxis(vec3(0.0,0.0,1.0),sx*uFlap*0.42)
          *rotAxis(vec3(0.0,1.0,0.0),-sx*sprd);
    p=sh+R*(p-sh); n=R*n;
  }else if(kind>1.5&&kind<2.5){
    /* веер: перо отводится тем сильнее, чем дальше оно от середины хвоста */
    /* Веер считается от места, где перо РАСТЁТ, а не от координаты вершины:
       у длинного пера кончик уезжает за середину, знак по дороге меняется, и
       хвост раскрывался крестом вместо веера. */
    float lat=clamp(bx*7.0,-1.0,1.0);
    /* раскрытый хвост не только расходится, но и ОПУСКАЕТСЯ: сложенный он
       лежит за телом и в вееере остаётся за ним же, если его не увести вниз */
    mat3 R=rotAxis(vec3(0.0,1.0,0.0),-lat*uFan*0.62)
          *rotAxis(vec3(1.0,0.0,0.0),uFan*0.30);
    p=TAILROOT+R*(p-TAILROOT); n=R*n;
  }else if(kind>2.5){
    crestTurn(p,n);
  }
}
/* ── подвижные части головы и лап ──
   Веко, подклювье, ус и поджатая лапа. Все без костей: вершина знает свой
   материал и по нему решает, вокруг чего ей поворачиваться. */
void partJoints(inout vec3 p, inout vec3 n, float m, float t){
  if(m>=9.5){
    /* ус: качка по своей доле вдоль нити (дробная часть материала). Фаза
       ступенчатая по |x| — у нити и бусины координаты вершин разные, и от
       плавной фазы бусина уезжала в сторону от кончика. */
    float s=m-10.0;
    float ph=sign(p.x)*1.7+floor(abs(p.x)*4.0)*1.3;
    float amp=s*s*0.085;
    p.x+=sin(uTime*1.9+ph)*amp;
    p.y+=sin(uTime*2.7+ph*1.7)*amp*0.55;
    p.z+=cos(uTime*1.5+ph*0.8)*amp*0.60;
    if(t>0.5)crestTurn(p,n);      /* усы хохла едут с хохлом, хвостовые — нет */
    return;
  }
  if(m>7.5&&m<8.5){
    vec3 c=vec3(sign(p.x)*0.252,1.758,0.108);
    mat3 R=rotAxis(vec3(1.0,0.0,0.0),-(1.0-uBlink)*1.55);
    p=c+R*(p-c); n=R*n;
  }else if(m>8.5){
    vec3 h=vec3(0.0,1.676,0.118);
    mat3 R=rotAxis(vec3(1.0,0.0,0.0),uJaw);
    p=h+R*(p-h); n=R*n;
  }else if(m>3.5&&m<4.5||m>6.5&&m<7.5){
    /* поджатая лапа: поворачивается ОДНА, та, что назначена. Птица стоит на
       одной ноге чаще, чем на двух, и без этого половина повадок пропадает */
    if(sign(p.x)==uFootSide&&uFootUp>0.001){
      vec3 hip=vec3(sign(p.x)*0.14,0.62,-0.08);
      mat3 R=rotAxis(vec3(1.0,0.0,0.0),uFootUp*1.15);
      p=hip+R*(p-hip); n=R*n;
    }
  }
}
/* t — положение вдоль хребта (0 хвост, 1 темя); для частей, у которых своего t
   нет (клюв, хохол), передаётся единица: они едут с головой целиком.
   Отрицательное t — геометрия, которая не едет вовсе (жёрдочка). */
void rigApply(inout vec3 p, inout vec3 n, float t){
  if(t<0.0)return;
  float bw=smoothstep(0.15,0.60,t)*smoothstep(1.0,0.72,t);
  p+=n*(uBreath*bw+uPuff*(0.35+0.65*bw));
  /* ── голова ──
     Втянуть (tuck) и клюнуть (peck) идут ДО поворота: втянутая голова
     поворачивается вокруг того же места, что и вытянутая, иначе на каждой
     сонной повадке шея ломается вбок. */
  float w=smoothstep(0.66,0.92,t);
  p.y-=uTuck*0.115*w;
  p.z-=uTuck*0.055*w;
  p.z+=uPeck*0.095*w;
  mat3 R=rotAxis(vec3(0.0,1.0,0.0),uHeadYaw*w)
        *rotAxis(vec3(1.0,0.0,0.0),uHeadPitch*w)
        *rotAxis(vec3(0.0,0.0,1.0),uHeadRoll*w);
  p=uNeckP+R*(p-uNeckP); n=R*n;
  /* корпус: наклон вперёд-назад от бёдер и поклон */
  vec3 hip=vec3(0.0,0.62,-0.30);
  mat3 B=rotAxis(vec3(1.0,0.0,0.0),uLean+uBow*smoothstep(0.1,0.9,t));
  p=hip+B*(p-hip); n=B*n;
  /* ── вся птица ──
     Подскок поднимает корпус, но не лапы: они остаются на ветке и тянутся.
     Шаг и разворот едут целиком, включая лапы, — ветка стоит (t<0). */
  p.y+=uHop*smoothstep(0.02,0.24,t);
  p.x+=uStep;
  if(abs(uTurn)>0.0005){
    vec3 c=vec3(uStep,0.62,-0.10);
    mat3 T=rotAxis(vec3(0.0,1.0,0.0),uTurn*6.2831853);
    p=c+T*(p-c); n=T*n;
  }
  /* вис вниз головой: птица поворачивается вокруг САМОЙ ЖЁРДОЧКИ, держась за
     неё лапами. Поэтому ось — ось ветки, а не что-нибудь внутри тела */
  if(uHang>0.001){
    vec3 c=vec3(uStep,0.150,-0.040);
    mat3 H=rotAxis(vec3(1.0,0.0,0.0),uHang*3.1415927);
    p=c+H*(p-c); n=H*n;
  }
}`;

/* ── общая часть фрагментных программ: свет ── */
const GL_LIGHT=`
uniform vec3 uEye,uKeyDir,uKeyCol,uFillDir,uFillCol,uRimCol,uSkyCol,uGndCol;
uniform sampler2DShadow uShadow;
uniform mat4 uLightVP;
uniform float uShadowTexel;

float D_GGX(float NoH,float a){float a2=a*a;float d=NoH*NoH*(a2-1.0)+1.0;return a2/(3.14159265*d*d+1e-7);}
float V_Smith(float NoV,float NoL,float a){
  float k=a*0.5;
  return 0.5/max(1e-5, mix(NoV,1.0,k)*mix(NoL,1.0,k)*2.0);
}
vec3 F_Schlick(vec3 f0,float u){return f0+(1.0-f0)*pow(1.0-u,5.0);}

/* тень: PCF по девяти точкам с наклонным смещением — на пере, стоящем почти
   вдоль луча, постоянный сдвиг либо рвёт контакт, либо даёт полосы */
float shadowAt(vec3 wp,float NoL){
  vec4 lp=uLightVP*vec4(wp,1.0);
  vec3 q=lp.xyz/lp.w*0.5+0.5;
  if(q.z>1.0||q.x<0.0||q.x>1.0||q.y<0.0||q.y>1.0)return 1.0;
  float bias=uShadowTexel*(0.9+2.6*sqrt(1.0-NoL*NoL)/max(NoL,0.15));
  /* шире, чем один тексель: тень между перьями должна быть мягкой, иначе
     оперение выглядит вырезанным из бумаги и наклеенным */
  float s=0.0;
  for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++)
    s+=texture(uShadow,vec3(q.xy+vec2(float(x),float(y))*uShadowTexel*1.7,q.z-bias));
  return mix(0.16,1.0,s/9.0);
}

/* Материал: альбедо, шероховатость, «пропускание» (перо и клюв просвечивают
   на контровом свете) и анизотропия вдоль стержня пера. */
vec3 lightPoint(vec3 wp,vec3 N,vec3 alb,float rough,float trans,vec3 tang,float aniso){
  vec3 V=normalize(uEye-wp);
  float NoV=max(dot(N,V),1e-4);
  vec3 col=vec3(0.0);
  /* ключ */
  {
    vec3 L=uKeyDir,H=normalize(L+V);
    float NoL=dot(N,L);
    float sh=shadowAt(wp,max(NoL,0.05));
    /* обёрнутый рассеянный: перо — не гипс, свет заходит за терминатор */
    float wr=clamp((NoL+0.35)/1.35,0.0,1.0);
    float NoH=max(dot(N,H),0.0);
    float a=rough*rough;
    /* анизотропия: вдоль стержня блик тянется, поперёк собирается */
    vec3 Ht=H-tang*dot(H,tang);
    float NoHa=mix(NoH,clamp(length(Ht),0.0,1.0),aniso*0.55);
    float spec=D_GGX(NoHa,a)*V_Smith(NoV,max(NoL,1e-4),a);
    vec3 F=F_Schlick(vec3(0.045),max(dot(H,V),0.0));
    col+=uKeyCol*sh*(alb*wr+F*spec*max(NoL,0.0)*2.0);
    /* просвет: свет, прошедший насквозь, приходит с обратной стороны */
    float bt=pow(clamp(dot(V,-L),0.0,1.0),2.5)*clamp(1.0-abs(dot(N,L)),0.0,1.0);
    col+=uKeyCol*alb*trans*bt*sh*0.70;
  }
  /* подбой: холодный, без тени и без блика — это отражённый свет комнаты */
  {
    float NoL=clamp(dot(N,uFillDir)*0.5+0.5,0.0,1.0);
    col+=uFillCol*alb*NoL*NoL;
  }
  /* обвод: узкая кромка по краю силуэта, чтобы птица отделялась от пустоты.
     Со спины он единственный источник формы — ключ туда не достаёт */
  col+=uRimCol*pow(1.0-NoV,3.0)*(0.35+0.65*trans);
  /* контровой сзади: холодная подсветка затылка и спины. Без неё птица,
     повёрнутая спиной, проваливается в фон целиком */
  {
    vec3 B=normalize(vec3(-0.25,0.42,-0.87));
    col+=uRimCol*alb*pow(clamp(dot(N,B),0.0,1.0),1.6)*0.55*(1.0-trans*0.55);
  }
  /* полусфера: небо сверху, пол снизу */
  col+=alb*mix(uGndCol,uSkyCol,N.y*0.5+0.5);
  /* тёплый отсвет снизу: под птицей ветка и стол, и они не чёрные */
  col+=alb*uKeyCol*0.030*clamp(-N.y,0.0,1.0);
  return col;
}`;

/* ── тело ── */
const VS_BODY=GL_RIG+`
layout(location=0) in vec3 p;
layout(location=1) in vec3 n;
layout(location=2) in vec2 ta;
layout(location=3) in vec3 c;
uniform mat4 uVP;
out vec3 vP,vN,vC;
out vec2 vTA;
void main(){
  vec3 pp=p,nn=n;
  partJoints(pp,nn,ta.y,ta.x);
  rigApply(pp,nn,ta.x);
  vP=pp;vN=normalize(nn);vC=c;vTA=ta;
  gl_Position=uVP*vec4(pp,1.0);
}`;
const FS_SOLID=GL_LIGHT+`
in vec3 vP,vN,vC;
in vec2 vTA;
/* uTime объявлен и в вершинной части (GL_RIG): одно и то же имя одного типа
   в двух ступенях — это одна общая переменная, и ставить её отдельно не надо */
uniform float uTime;
out vec4 o;
/* мелкая клетка кожи на лапах: без неё палец выглядит резиновым */
float scales(vec3 p){
  vec3 q=p*78.0;
  return smoothstep(0.20,0.95,abs(sin(q.y*1.0+q.x*0.3))*abs(sin(q.z*0.75+q.x*0.5)));
}
void main(){
  vec3 N=normalize(vN);
  float m=vTA.y;
  vec3 alb=vC;float rough=0.6,trans=0.1,ao=1.0;
  if(m<0.5){
    /* тело под перьями — тёмная масса: его видно в щелях и на кромке, и
       красится оно приглушённым своим цветом, а не цветом оперения */
    alb=vC*0.30;rough=0.72;trans=0.06;
  }else if(m<1.5||(m>8.5&&m<9.5)){
    /* Клюв — рог, а не пластмасса: вдоль верха идёт киль, к концу рог темнеет
       и уплотняется, у основания видны следы роста — поперечные бороздки.
       Без них клюв читается леденцом: гладкая жёлтая масса и один блик. */
    alb=vC;
    /* киль по верху клюва: узкая светлая грань вдоль оси. На листе она есть, и
     без неё рог выходит мыльным овалом */
    float ridge=smoothstep(0.042,0.0,abs(vP.x))*clamp(N.y,0.0,1.0);
    float ridgeW=smoothstep(0.10,0.03,abs(vP.x))*clamp(N.y,0.0,1.0);
    float tipk=smoothstep(1.68,1.52,vP.y)*smoothstep(0.26,0.38,vP.z);
    alb*=mix(1.0,0.46,tipk);
    alb*=0.92+0.16*ridge+0.05*ridgeW;
    /* рог матовее пластика: блик у клюва широкий и слабый */
    rough=0.30;
    /* ноздря — ПЯТНОМ, а не геометрией: шарик на роге раз за разом оказывался
       внутри клюва, потому что сечение наклонено. Пятно ложится ровно там,
       где нужно, и стоит ноль вершин */
    float nz=1.0-smoothstep(0.012,0.030,
      length(vec3((abs(vP.x)-0.056)*1.0,(vP.y-1.772)*0.80,(vP.z-0.262)*0.70)));
    alb=mix(alb,vec3(0.018,0.014,0.018),nz*0.95);
    rough=mix(rough,0.7,nz);
    float grooves=sin(vP.y*54.0+vP.z*16.0)*0.5+0.5;
    float bs=smoothstep(0.34,0.14,vP.z);
    rough=0.30+0.22*grooves*bs+0.16*tipk-0.10*ridge;
    trans=0.50*(1.0-tipk*0.55);
    /* тень от надклювья на подклювье: без неё две челюсти читаются одним
       куском рога, и рот пропадает. Полоса узкая и идёт по линии смыкания */
    if(m>8.5){
      float lip=smoothstep(0.050,0.0,abs(vP.y-(1.686-vP.z*0.12)));
      alb*=mix(1.0,0.34,lip);
    }
  }else if(m<2.5){
    /* глаз: тёмный и мокрый. Кроме честного блика от ключа ему дан один
       «поймай-свет» с постоянного направления — без него зрачок читается
       дыркой, стоит ключу уйти за голову */
    rough=0.06;trans=0.0;alb=vC*0.7;
    float cl=pow(clamp(dot(normalize(N),normalize(vec3(-0.45,0.75,0.49))),0.0,1.0),120.0);
    o=vec4(lightPoint(vP,N,alb,rough,trans,vec3(0.0,1.0,0.0),0.0)+vec3(2.6)*cl,1.0);
    return;
  }else if(m<3.5){
    rough=0.88;trans=0.02;alb=vC;         /* дерево */
    /* кора: продольные волокна плюс крапина, иначе ветка — крашеная труба */
    float ang=atan(vP.z+0.04,vP.y-0.305);
    alb*=0.86+0.16*sin(ang*13.0+vP.x*2.1)*0.5+0.10*sin(ang*41.0+vP.x*7.0);
    alb*=0.80+0.28*fract(sin(floor(vP.x*26.0)*12.9898+floor(ang*9.0)*4.1414)*43758.5453);
    rough=0.92;
  }else if(m<4.5){
    /* чешуя: на листе лапа заметно чешуйчатая, и это единственное, что не даёт
       ей выглядеть резиновой. Клетка мельче и глубже прежней */
    float s=scales(vP);
    rough=0.42+0.34*s;trans=0.12;alb=vC*(0.70+0.52*s);
    N=normalize(N+vec3(0.0,s*0.18-0.09,s*0.06));
  }else if(m<5.5){
    rough=0.80;trans=0.42;alb=vC;         /* голая кожа: восковица, кольцо */
  }else if(m<7.5){
    rough=0.22;trans=0.10;alb=vC;         /* коготь */
  }else if(m<9.5){
    /* веко: кожа, но тоньше и теплее — на просвет через него видно кровь */
    rough=0.70;trans=0.55;alb=vC;
  }else{
    /* ── УС СВЕТИТСЯ САМ ──
       Была «почти чёрная нить, разогретая к концу»: добавка тонула в общем
       свете и порога свечения (bright-pass, 50-render) не брала — светились
       одни бусины, а усы висели тёмными проводами. Теперь нить сама
       источник: ровное ядро по всей длине, разгон к концу и ореол по
       касательной. Яркость на кончике заведомо выше порога, поэтому ус
       попадает в размытие и вокруг него встаёт гало. */
    float s=m-10.0;
    rough=0.34;trans=0.85;alb=vC;
    vec3 Vw=normalize(uEye-vP);
    float fres=1.0-abs(dot(N,Vw));
    /* дышит в такт бусине: та же частота 1.7, что у uGlow в 50-render */
    float puls=0.86+0.14*sin(uTime*1.7-s*3.4);
    vec3 heat=vec3(0.10,0.62,0.86)*(0.20+2.70*pow(s,2.2))*puls
             +vec3(0.30,0.86,1.00)*pow(fres,2.0)*(0.18+1.50*pow(s,2.6))*puls;
    o=vec4(lightPoint(vP,N,alb,rough,trans,vec3(0.0,1.0,0.0),0.0)*0.55+heat,1.0);
    return;
  }
  o=vec4(lightPoint(vP,N,alb,rough,trans,vec3(0.0,1.0,0.0),0.0)*ao,1.0);
}`;

/* ── глубина для карты теней ──
   Одна программа на всё: геометрия та же, поза та же, цвет не нужен. */
const VS_DEPTH=GL_RIG+`
layout(location=0) in vec3 p;
layout(location=1) in vec3 n;
layout(location=2) in vec2 ta;
uniform mat4 uVP;
void main(){
  vec3 pp=p,nn=n;
  partJoints(pp,nn,ta.y,ta.x);
  rigApply(pp,nn,ta.x);
  gl_Position=uVP*vec4(pp,1.0);
}`;
const FS_DEPTH=`
void main(){}`;

/* ── фон ──
   Пустота «Дрейфа»: холодный градиент, тёплое пятно там, откуда бьёт ключ, и
   виньетка. Ни одной картинки — модуль обязан остаться одним файлом. */
const VS_FLAT=`
layout(location=0) in vec2 p;
out vec2 vUV;
void main(){vUV=p*0.5+0.5;gl_Position=vec4(p,0.0,1.0);}`;
const FS_BG=`
in vec2 vUV;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uSkyCol,uKeyCol;
out vec4 o;
void main(){
  vec2 uv=vUV;
  float asp=uRes.x/uRes.y;
  vec2 q=(uv-0.5)*vec2(asp,1.0);
  float d=length(q);
  vec3 col=mix(vec3(0.012,0.019,0.032),vec3(0.004,0.006,0.011),smoothstep(0.0,0.9,d));
  /* пятно ключа: свет приходит сверху справа и оставляет след на стене */
  col+=uKeyCol*0.055*exp(-6.0*length(q-vec2(0.34,0.34)));
  col+=uSkyCol*0.35*exp(-3.0*length(q-vec2(-0.42,0.10)));
  col*=1.0-0.55*smoothstep(0.35,1.05,d);
  o=vec4(col,1.0);
}`;

/* ── вывод на экран ──
   ACES (подгонка Нарковица) плюс дизеринг: без него в тёмном градиенте виден
   бандинг, а вся сцена здесь — тёмный градиент. */
const FS_TONE=`
in vec2 vUV;
uniform sampler2D uSrc,uBloom;
uniform float uExposure,uBloomK,uTime;
out vec4 o;
vec3 aces(vec3 x){
  const float a=2.51,b=0.03,c=2.43,d=0.59,e=0.14;
  return clamp((x*(a*x+b))/(x*(c*x+d)+e),0.0,1.0);
}
void main(){
  vec3 c=texture(uSrc,vUV).rgb;
  c+=texture(uBloom,vUV).rgb*uBloomK;
  c=aces(c*uExposure);
  c=pow(c,vec3(1.0/2.2));
  float dth=fract(sin(dot(gl_FragCoord.xy+uTime,vec2(12.9898,78.233)))*43758.5453);
  o=vec4(c+(dth-0.5)/255.0,1.0);
}`;

/* ── перо ──
   Геометрия у пера общая на всех, а различие — в настройках инстанса: длина,
   ширина, чашка, род (корпус, маховое, хвост, хохол). Рисунок опахала не
   текстура, а функция: бородки идут под углом к стержню, стержень светлее и
   глаже, кромка темнее. Текстуры нет, потому что модуль — один файл. */
const VS_FEATHER=GL_RIG+`
layout(location=0) in vec3 p;
layout(location=1) in vec3 n;
layout(location=2) in vec2 uv;
layout(location=3) in vec4 r0;
layout(location=4) in vec4 r1;
layout(location=5) in vec4 r2;
layout(location=6) in vec3 icol;
layout(location=7) in vec4 ipar;
uniform mat4 uVP;
uniform float uRuffle;
out vec3 vP,vN,vC,vT;
out vec2 vUV;
out float vKind,vId;
void main(){
  vec3 lp=p;
  lp.y*=ipar.x;
  /* дуга: перья хохла и хвоста не прямые, они выгнуты по всей длине. Выгиб
     идёт по квадрату доли — у корня перо остаётся касательным к телу */
  lp.y+=ipar.y*lp.z*lp.z*0.62;
  /* рябь: у каждого пера своя фаза, поэтому оперение шевелится волной, а не
     всё разом. Это то же правило, что у двумерной птицы. */
  float id=float(gl_InstanceID);
  float ph=fract(sin(id*12.9898)*43758.5453);
  float lift=sin(uTime*2.6+ph*6.2831)*uRuffle*(0.5+0.5*ph);
  lp.y+=lift*lp.z*lp.z*1.6;
  vec3 cx=vec3(r0.x,r1.x,r2.x), cy=vec3(r0.y,r1.y,r2.y), cz=vec3(r0.z,r1.z,r2.z);
  float sx=length(cx), sy=length(cy), sz=length(cz);
  vec3 wp=vec3(dot(r0.xyz,lp)+r0.w, dot(r1.xyz,lp)+r1.w, dot(r2.xyz,lp)+r2.w);
  /* нормаль по обратно-транспонированной: у пера масштаб вдоль и поперёк
     отличается впятеро, и обычный поворот дал бы нормаль набок */
  vec3 wn=normalize(cx*(n.x/(sx*sx))+cy*(n.y/(sy*sy))+cz*(n.z/(sz*sz)));
  vec3 wt=cz/max(sz,1e-5);
  /* сустав оперения (крыло/хвост/хохол) — до общей позы: он локальный */
  float sxw=r0.w<0.0?-1.0:1.0;
  plumeJoints(wp,wn,ipar.w,sxw,ipar.z,r0.w);
  rigApply(wp,wn,ipar.z);
  /* стержень поворачивается вместе с пером: тангенс нужен блику */
  vec3 dummy=wt; vec3 dn=wt; vec3 dp=wp;
  vP=wp;vN=wn;vC=icol;vT=wt;vUV=uv;vKind=ipar.w;vId=ph;
  gl_Position=uVP*vec4(wp,1.0);
}`;
const FS_FEATHER=GL_LIGHT+`
in vec3 vP,vN,vC,vT;
in vec2 vUV;
in float vKind,vId;
out vec4 o;
void main(){
  float u=vUV.x, v=vUV.y;
  vec3 N=normalize(vN);
  if(!gl_FrontFacing)N=-N;              /* перо двустороннее */
  /* бородки: частые полоски под углом к стержню. Они не рисуются линиями, а
     качают нормаль — иначе на движении получается муар. */
  /* частота бородок зависит от рода пера: на маховом длиной в полптицы
     редкие бородки читаются рёбрами жалюзи */
  float bf=vKind>0.5?92.0:(vKind<-0.5?30.0:58.0);   /* у пуха бородки редкие и мягкие */
  float barb=sin((v*bf+abs(u)*9.0+vId*3.0)*3.14159);
  float barb2=sin((v*bf*2.4+abs(u)*21.0)*3.14159);
  vec3 side=normalize(cross(N,vT));
  N=normalize(N+side*barb*0.055*sign(u)+vT*barb2*0.022);
  /* стержень: светлее, глаже, чуть выпуклый */
  float rach=smoothstep(0.10,0.0,abs(u));
  N=normalize(N+side*sign(u)*rach*0.35);
  vec3 alb=vC;
  alb*=0.80+0.20*barb*0.5;
  alb=mix(alb,alb*1.35+0.02,rach*0.5);
  /* кромка опахала темнее, кончик светлее — так ряд читается рядом, а не
     сплошным полем. На светлом пере кант приходится делать сильнее: на
     кремовой груди слабый кант не виден вовсе, и грудь читается куполом */
  float pale=smoothstep(0.35,0.75,dot(alb,vec3(0.33)));
  alb*=mix(1.0,mix(0.72,0.56,pale),smoothstep(0.50,1.0,abs(u)));
  /* у крупных перьев край ещё и подсвечен изнутри: без этой пары «светлее
     внутри — темнее по кромке» сложенное крыло и хвост сливаются в одну
     синюю доску, сколько бы перьев в них ни лежало */
  if(vKind>0.5&&vKind<2.5){
    alb*=1.0+0.26*smoothstep(0.92,0.66,abs(u))*smoothstep(0.66,0.86,abs(u)+0.20);
    /* кант по кромке крупного пера ЧЁРНЫЙ, а не просто тёмный: только им
       соседние перья отделяются друг от друга, когда лежат вплотную */
    alb*=mix(1.0,0.34,smoothstep(0.80,1.0,abs(u)));
  }
  alb=mix(alb,alb*1.28,smoothstep(0.55,1.0,v));
  /* основание пера всегда в тени соседнего: без этого черепица плоская */
  alb*=mix(0.84,1.0,smoothstep(0.0,0.28,v));
  float rough=mix(0.42,0.30,rach);
  float trans=mix(0.55,0.30,rach);
  /* ── ПУХ (род -1) ──
     У пуха нет ни жёсткой кромки, ни плотного опахала: он тонкий, и свет
     идёт сквозь него насквозь. Поэтому кромку ему не темним, а наоборот
     подсвечиваем, и к кончику пёрышко почти прозрачно. Ровно это и
     читается пушистостью — не число перьев, а свет между ними. */
  if(vKind<-0.5){
    alb=mix(alb,alb*1.50+0.03,smoothstep(0.28,1.0,v));
    alb*=1.0+0.34*smoothstep(0.40,1.0,abs(u));
    rough=0.66;trans=0.94;
  }
  if(vKind>2.5){                      /* хохол: к концу перо разогрето бусиной */
    alb+=uRimCol*0.0;
    trans=0.30;
  }
  vec3 col=lightPoint(vP,N,alb,rough,trans,vT,0.75);
  if(vKind>2.5)col+=vec3(0.05,0.20,0.26)*smoothstep(0.62,1.0,v)*0.30;
  o=vec4(col,1.0);
}`;

/* ── бусина ──
   Кладётся ПОСЛЕ света и аддитивно: свет не должен её гасить. Внутри —
   плотное ядро, снаружи — ореол по краю сферы. */
const VS_BEAD=GL_RIG+`
layout(location=0) in vec3 p;
layout(location=1) in vec3 n;
layout(location=2) in vec2 tm;
layout(location=3) in vec3 c;
uniform mat4 uVP;
out vec3 vP,vN,vC;
void main(){
  vec3 pp=p,nn=n;
  partJoints(pp,nn,tm.y,tm.x);
  rigApply(pp,nn,tm.x);
  vP=pp;vN=normalize(nn);vC=c;
  gl_Position=uVP*vec4(pp,1.0);
}`;
const FS_BEAD=`
in vec3 vP,vN,vC;
uniform vec3 uEye;
uniform float uGlow;
out vec4 o;
void main(){
  vec3 V=normalize(uEye-vP);
  float f=1.0-abs(dot(normalize(vN),V));
  /* ядро ровное, ореол по касательной: так бусина выглядит стеклянной, а не
     закрашенным кружком */
  o=vec4(vC*(1.1+3.4*pow(f,2.2))*uGlow,1.0);
}`;

/* ── свечение: порог и ступени ── */
const FS_BRIGHT=`
in vec2 vUV;
uniform sampler2D uSrc;
uniform vec2 uTexel;
uniform float uThresh;
out vec4 o;
void main(){
  vec3 c=vec3(0.0);
  /* четыре точки вместо одной: порог по одиночному пикселю мерцает на
     движении, а бусины у нас как раз мелкие и подвижные */
  c+=texture(uSrc,vUV+uTexel*vec2( 1.0, 1.0)).rgb;
  c+=texture(uSrc,vUV+uTexel*vec2(-1.0, 1.0)).rgb;
  c+=texture(uSrc,vUV+uTexel*vec2( 1.0,-1.0)).rgb;
  c+=texture(uSrc,vUV+uTexel*vec2(-1.0,-1.0)).rgb;
  c*=0.25;
  float l=max(max(c.r,c.g),c.b);
  o=vec4(c*smoothstep(uThresh,uThresh*2.0,l),1.0);
}`;
const FS_BLUR=`
in vec2 vUV;
uniform sampler2D uSrc;
uniform vec2 uTexel;
uniform float uK;
out vec4 o;
void main(){
  /* палатка из девяти точек: на билинейной выборке это уже гладко */
  vec3 c=texture(uSrc,vUV).rgb*4.0;
  c+=texture(uSrc,vUV+vec2( uTexel.x,0.0)).rgb*2.0;
  c+=texture(uSrc,vUV+vec2(-uTexel.x,0.0)).rgb*2.0;
  c+=texture(uSrc,vUV+vec2(0.0, uTexel.y)).rgb*2.0;
  c+=texture(uSrc,vUV+vec2(0.0,-uTexel.y)).rgb*2.0;
  c+=texture(uSrc,vUV+uTexel).rgb;
  c+=texture(uSrc,vUV-uTexel).rgb;
  c+=texture(uSrc,vUV+vec2(uTexel.x,-uTexel.y)).rgb;
  c+=texture(uSrc,vUV+vec2(-uTexel.x,uTexel.y)).rgb;
  o=vec4(c/16.0*uK,1.0);
}`;

/* ── пыль ──
   Несколько сот пылинок в луче: они дают воздуху объём и говорят, что птица
   сидит В КОМНАТЕ, а не висит на градиенте. Каждая — билборд в один пиксель с
   ореолом, летит по своей медленной спирали, ярче там, где стоит ключ.
   Рисуются аддитивно и после всего света, глубину читают, но не пишут. */
const VS_DUST=`
layout(location=0) in vec2 p;
layout(location=1) in vec4 seed;      /* xyz — точка, w — размер */
uniform mat4 uVP;
uniform vec3 uEye;
uniform float uTime;
out vec2 vUV;
out float vB;
void main(){
  vec3 c=seed.xyz;
  float ph=seed.w*37.0;
  /* дрейф: три несоизмеримые синусоиды — движение не зацикливается на глаз */
  c+=vec3(sin(uTime*0.13+ph)*0.30, sin(uTime*0.09+ph*1.7)*0.22+uTime*0.012,
          cos(uTime*0.11+ph*2.3)*0.30);
  c.y=mod(c.y+1.2,2.6)-1.2;
  vec3 f=normalize(uEye-c),r=normalize(cross(vec3(0.0,1.0,0.0),f)),u=cross(f,r);
  float s=0.004+seed.w*0.010;
  vec3 wp=c+r*p.x*s+u*p.y*s;
  vUV=p;
  /* ярче в конусе ключа и мягко гаснет к краям кадра */
  vB=(0.25+0.75*smoothstep(-0.2,0.9,dot(normalize(c-vec3(0.0,1.0,0.0)),vec3(0.55,0.8,0.45))))
     *(0.5+0.5*sin(uTime*0.7+ph));
  gl_Position=uVP*vec4(wp,1.0);
}`;
const FS_DUST=`
in vec2 vUV;
in float vB;
uniform vec3 uCol;
out vec4 o;
void main(){
  float d=length(vUV);
  if(d>1.0)discard;
  float a=pow(1.0-d,3.0);
  o=vec4(uCol*a*vB*0.9,1.0);
}`;
