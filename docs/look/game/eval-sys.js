/* the system round the man: the planets, their moons, the angular size and the phase of each */
(function(){
  var p0=G.surf&&G.surf.p;
  return {here:p0&&{name:p0.name,type:p0.type,moons:p0.moons.length,parent:p0.parentIdx},
    planets:G.sys.planets.map(function(p){return [p.name,p.type,p.moons.map(function(m){
      return [m.type,+(m.radius/Math.max(20,m.orbit)).toFixed(3),+celMoonPhase(m,G.t).toFixed(2)];})];})};
})()
