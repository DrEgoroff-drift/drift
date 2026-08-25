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
uniform float uHeadYaw,uHeadPitch,uHeadRoll,uBreath,uLean,uBow,uTime,uPuff;
uniform vec3 uNeckP;
mat3 rotAxis(vec3 ax,float a){
  float c=cos(a),s=sin(a),k=1.0-c;
  return mat3(ax.x*ax.x*k+c, ax.x*ax.y*k+ax.z*s, ax.x*ax.z*k-ax.y*s,
              ax.y*ax.x*k-ax.z*s, ax.y*ax.y*k+c, ax.y*ax.z*k+ax.x*s,
              ax.z*ax.x*k+ax.y*s, ax.z*ax.y*k-ax.x*s, ax.z*ax.z*k+c);
}
/* t — положение вдоль хребта (0 хвост, 1 темя); для частей, у которых своего t
   нет (клюв, хохол), передаётся единица: они едут с головой целиком */
void rigApply(inout vec3 p, inout vec3 n, float t){
  float bw=smoothstep(0.15,0.60,t)*smoothstep(1.0,0.72,t);
  p+=n*(uBreath*bw+uPuff*(0.35+0.65*bw));
  float w=smoothstep(0.66,0.92,t);
  mat3 R=rotAxis(vec3(0.0,1.0,0.0),uHeadYaw*w)
        *rotAxis(vec3(1.0,0.0,0.0),uHeadPitch*w)
        *rotAxis(vec3(0.0,0.0,1.0),uHeadRoll*w);
  p=uNeckP+R*(p-uNeckP); n=R*n;
  /* корпус: наклон вперёд-назад от бёдер и поклон */
  vec3 hip=vec3(0.0,0.62,-0.30);
  mat3 B=rotAxis(vec3(1.0,0.0,0.0),uLean+uBow*smoothstep(0.1,0.9,t));
  p=hip+B*(p-hip); n=B*n;
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
  float s=0.0;
  for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++)
    s+=texture(uShadow,vec3(q.xy+vec2(float(x),float(y))*uShadowTexel,q.z-bias));
  return s/9.0;
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
    col+=uKeyCol*alb*trans*bt*sh*1.4;
  }
  /* подбой: холодный, без тени и без блика — это отражённый свет комнаты */
  {
    float NoL=clamp(dot(N,uFillDir)*0.5+0.5,0.0,1.0);
    col+=uFillCol*alb*NoL*NoL;
  }
  /* обвод: узкая кромка по краю силуэта, чтобы птица отделялась от пустоты */
  col+=uRimCol*pow(1.0-NoV,3.5)*(0.35+0.65*trans);
  /* полусфера: небо сверху, пол снизу */
  col+=alb*mix(uGndCol,uSkyCol,N.y*0.5+0.5);
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
  rigApply(pp,nn,ta.x);
  vP=pp;vN=normalize(nn);vC=c;vTA=ta;
  gl_Position=uVP*vec4(pp,1.0);
}`;
const FS_BODY=GL_LIGHT+`
in vec3 vP,vN,vC;
in vec2 vTA;
out vec4 o;
void main(){
  vec3 N=normalize(vN);
  /* тело под перьями — тёмная масса: оно видно в щелях и на кромке, поэтому
     красится своим цветом, приглушённым, а не цветом оперения */
  vec3 alb=vC*0.34;
  o=vec4(lightPoint(vP,N,alb,0.62,0.10,vec3(0.0,1.0,0.0),0.0),1.0);
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
