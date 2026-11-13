"""Measure landing latency on a real clock/GPU; no network or production writes.

python docs/probe-landing.py --approach --slow 1
python docs/probe-landing.py --slow 6
Outputs a temporary screenshot and the CPU time spent in the warm-up queue.
"""
import argparse
import pathlib
import sys
import tempfile
import shot

args = argparse.ArgumentParser()
args.add_argument('--approach', action='store_true')
args.add_argument('--slow', type=int, default=1)
opt = args.parse_args()
original_call = shot.WS.call

def call(self, method, **params):
    if method == 'Page.navigate' and opt.slow > 1:
        original_call(self, 'Emulation.setCPUThrottlingRate', rate=opt.slow)
    return original_call(self, method, **params)

shot.WS.call = call
js = r'''(()=>{
 const ps=plnBodyAll(G.sys).filter(p=>p.type!=="gas"),p=ps.find(p=>p.parentIdx!=null)||ps[0];
 window.LP={body:p.name,done:false,prep:performance.now(),cpu:0,steps:0,phases:{}};
 const warm=plnWarmStep;
 plnWarmStep=function(){const phase=PLN_FLORA.kit?(arguments[0].warm||{}).st:"kit",t=performance.now(),r=warm.apply(this,arguments);
   if(!arguments[6]){const dt=performance.now()-t;LP.cpu+=dt;LP.steps++;LP.phases[phase]=(LP.phases[phase]||0)+dt;}return r;};
 G.ship.x=p.x+p.radius+(APPROACH?600:80);G.ship.y=p.y;
 G.ship.vx=p.vx||0;G.ship.vy=p.vy||0;G.opts.easyLand=true;
 if(APPROACH)G.ap={kind:"planet",p};
 const timer=setInterval(()=>{
   if(!LP.start&&(!APPROACH||G.orbit&&G.orbit.p===p||performance.now()-LP.prep>30000)){
     LP.arrived=!!(G.orbit&&G.orbit.p===p);LP.prepMs=performance.now()-LP.prep;
     LP.cached=!!(p.__land&&p.__land.warmDone);LP.start=performance.now();
     LP.kit=!!PLN_FLORA.kit;LP.remaining=p.__land&&p.__land.left;LP.stage=p.__land&&p.__land.warm&&p.__land.warm.st;
     startLanding(p);LP.initial={mode:G.mode,on:PLN.on,bad:PLN.bad,err:PLN.err,y:G.land.y,pad:G.land.tr.padY};LP.sync=performance.now()-LP.start;
   }
   if(LP.start&&(PLN_DESC.live||performance.now()-LP.start>30000)){
     LP.elapsed=performance.now()-LP.start;LP.live=PLN_DESC.live;LP.mode=G.mode;LP.bad=PLN.bad;LP.err=PLN.err;LP.done=true;clearInterval(timer);
   }
 },16);
})()'''.replace('APPROACH', 'true' if opt.approach else 'false')
out = pathlib.Path(tempfile.gettempdir()) / ('drift-landing-approach.png' if opt.approach else 'drift-landing-cold.png')
sys.argv = ['shot.py', 'system', '--js', js, '--until', 'window.LP&&LP.done',
            '--eval', 'LP', '--out', str(out), '--gpu', 'real', '--clock', 'wall',
            '--delay', '1000', '--budget', '70000']
shot.main()
