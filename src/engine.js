export const W=40,H=28;
export const TYPES={
 hq:{name:'建造基地',hp:1800,w:3,h:3,power:30},
 power:{name:'发电厂',hp:600,w:2,h:2,cost:300,time:8,power:100},
 barracks:{name:'兵营',hp:700,w:2,h:2,cost:400,time:10,use:25},
 factory:{name:'战车工厂',hp:1000,w:3,h:2,cost:900,time:18,use:65},
 refinery:{name:'矿石精炼厂',hp:800,w:3,h:2,cost:700,time:14,use:20},
 soldier:{name:'步兵',hp:90,cost:100,time:4,speed:2.5,range:3.5,damage:12,cool:0.8,requires:'barracks'},
 tank:{name:'坦克',hp:360,cost:450,time:10,speed:1.7,range:5,damage:48,cool:1.4,requires:'factory'},
 harvester:{name:'矿车',hp:400,cost:500,time:12,speed:1.4,requires:'refinery'}
};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export class Game {
 constructor(){this.time=0;this.nextId=1;this.entities=[];this.money=[1800,1800];this.queue=[[],[]];this.ready=[null,null];this.winner=null;this.aiAt=16;this.waveAt=40;this.ore=new Map();this.rocks=new Set();
 for(let x=16;x<24;x++)for(let y=5;y<23;y++)if(y!==13&&y!==14&&((x*7+y*11)%9<3))this.rocks.add(`${x},${y}`);
 for(const [ox,oy] of [[8,6],[29,20]])for(let x=ox;x<ox+4;x++)for(let y=oy;y<oy+3;y++)this.ore.set(`${x},${y}`,800);
 for(const team of [0,1]){const x=team?33:3,y=team?20:4;this.add('hq',team,x,y);this.add('refinery',team,x,team?24:8);this.add('harvester',team,x+4,y+4);this.add('soldier',team,x+3,y+1);this.add('soldier',team,x+4,y+1);}
 }
 add(type,team,x,y){const t=TYPES[type];const e={id:this.nextId++,type,team,x,y,hp:t.hp,maxHp:t.hp,path:[],cool:0,cargo:0,order:null};this.entities.push(e);return e;}
 alive(team,type){return this.entities.filter(e=>e.hp>0&&e.team===team&&(!type||e.type===type));}
 power(team){let out=0,use=0;for(const e of this.alive(team)){out+=TYPES[e.type].power||0;use+=TYPES[e.type].use||0;}return {out,use,ratio:out>=use?1:0.4};}
 blocked(x,y){if(x<0||y<0||x>=W||y>=H||this.rocks.has(`${x},${y}`))return true;return this.entities.some(e=>e.hp>0&&TYPES[e.type].w&&x>=e.x&&x<e.x+TYPES[e.type].w&&y>=e.y&&y<e.y+TYPES[e.type].h);}
 path(sx,sy,gx,gy){sx=Math.floor(sx);sy=Math.floor(sy);gx=Math.floor(gx);gy=Math.floor(gy);if(this.blocked(gx,gy))return [];const start=`${sx},${sy}`,goal=`${gx},${gy}`,q=[[sx,sy]],prev=new Map([[start,null]]);for(let i=0;i<q.length;i++){const [x,y]=q[i];if(`${x},${y}`===goal)break;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=`${nx},${ny}`;if(!prev.has(k)&&!this.blocked(nx,ny)){prev.set(k,`${x},${y}`);q.push([nx,ny]);}}}if(!prev.has(goal))return [];const path=[];for(let k=goal;k!==start;k=prev.get(k)){const [x,y]=k.split(',').map(Number);path.push({x:x+.5,y:y+.5});}return path.reverse();}
 nearPath(e,target){const t=TYPES[target.type]||{},w=t.w||1,h=t.h||1,candidates=[];for(let y=Math.floor(target.y)-1;y<=target.y+h;y++)for(let x=Math.floor(target.x)-1;x<=target.x+w;x++)if(!this.blocked(x,y))candidates.push({x,y});candidates.sort((a,b)=>dist(e,a)-dist(e,b));for(const c of candidates){const p=this.path(e.x,e.y,c.x,c.y);if(p.length||dist(e,{x:c.x+.5,y:c.y+.5})<1)return p;}return [];}
 move(ids,x,y){let n=0;for(const e of this.entities.filter(e=>ids.includes(e.id)&&!TYPES[e.type].w&&e.team===0)){const tx=Math.max(0,Math.min(W-1,Math.floor(x)+n%3)),ty=Math.max(0,Math.min(H-1,Math.floor(y)+Math.floor(n/3)));e.path=this.path(e.x,e.y,tx,ty);e.order={kind:'move'};n++;}}
 attack(ids,target){for(const e of this.entities.filter(e=>ids.includes(e.id)&&e.team!==target.team&&TYPES[e.type].damage)){e.order={kind:'attack',id:target.id};e.path=[];}}
 enqueue(team,type){const t=TYPES[type];if(!t?.cost||this.winner!==null)return '无法生产';if(!this.alive(team,'hq').length)return '需要基地';if(t.requires&&!this.alive(team,t.requires).length)return `需要${TYPES[t.requires].name}`;if(this.queue[team].length>=8)return '队列已满';if(this.money[team]<t.cost)return '资金不足';this.money[team]-=t.cost;this.queue[team].push({type,left:t.time,total:t.time});return '';}
 canPlace(team,type,x,y){const t=TYPES[type];if(!t?.w)return false;for(let xx=x;xx<x+t.w;xx++)for(let yy=y;yy<y+t.h;yy++)if(this.blocked(xx,yy)||this.ore.has(`${xx},${yy}`))return false;return this.alive(team).some(e=>TYPES[e.type].w&&dist(e,{x,y})<8);}
 place(team,x,y){const type=this.ready[team];if(!type||!this.canPlace(team,type,x,y))return false;this.add(type,team,x,y);this.ready[team]=null;return true;}
 tick(dt){if(this.winner!==null)return;this.time+=dt;
 for(const team of [0,1]){const q=this.queue[team][0];if(q&&!this.ready[team]){if(!TYPES[q.type].requires||this.alive(team,TYPES[q.type].requires).length){q.left-=dt*this.power(team).ratio;if(q.left<=0){const t=TYPES[q.type];if(t.w)this.ready[team]=q.type;else{const base=this.alive(team,t.requires)[0];let spot=null;const bt=TYPES[base.type];for(let y=base.y-1;y<=base.y+bt.h;y++){for(let x=base.x-1;x<=base.x+bt.w;x++)if(!this.blocked(x,y)){spot={x:x+.5,y:y+.5};break;}if(spot)break;}if(spot)this.add(q.type,team,spot.x,spot.y);else continue;}this.queue[team].shift();}}}}
 for(const e of this.entities){if(e.hp<=0||TYPES[e.type].w)continue;const t=TYPES[e.type];e.cool-=dt;
 if(e.type==='harvester'&&(!e.order||e.order.kind!=='move')){const ref=this.alive(e.team,'refinery')[0];if(e.cargo>=100||(!this.ore.size&&e.cargo)){if(ref){if(dist(e,ref)<4.5){this.money[e.team]+=e.cargo;e.cargo=0;e.path=[];}else if(!e.path.length)e.path=this.nearPath(e,ref);}}else{const patches=[...this.ore].filter(([,v])=>v>0).map(([k])=>{const [x,y]=k.split(',').map(Number);return {x:x+.5,y:y+.5,k};}).sort((a,b)=>dist(e,a)-dist(e,b));const ore=patches[0];if(ore){if(dist(e,ore)<.8){const amount=Math.min(25*dt,100-e.cargo,this.ore.get(ore.k));e.cargo+=amount;this.ore.set(ore.k,this.ore.get(ore.k)-amount);if(this.ore.get(ore.k)<=0)this.ore.delete(ore.k);}else if(!e.path.length)e.path=this.path(e.x,e.y,ore.x,ore.y);}}}
 if(t.damage){let target=e.order?.kind==='attack'?this.entities.find(a=>a.id===e.order.id&&a.hp>0):null;if(!target&&e.order?.kind==='attack')e.order=null;
 if(!target)target=this.entities.filter(a=>a.hp>0&&a.team!==e.team&&dist(e,a)<=t.range).sort((a,b)=>dist(e,a)-dist(e,b))[0];
 if(target){if(dist(e,target)<=t.range){e.path=[];if(e.cool<=0){target.hp-=t.damage;e.cool=t.cool;e.shot={x:target.x,y:target.y,until:this.time+.15};}}else if(!e.path.length)e.path=this.nearPath(e,target);}}
 if(e.path.length){const p=e.path[0],d=dist(e,p),step=t.speed*dt;if(this.blocked(Math.floor(p.x),Math.floor(p.y))){e.path=[];}else if(d<=step){e.x=p.x;e.y=p.y;e.path.shift();}else{e.x+=(p.x-e.x)/d*step;e.y+=(p.y-e.y)/d*step;}}
 if(!e.path.length&&e.order?.kind==='move')e.order=null;
 }
 this.entities=this.entities.filter(e=>e.hp>0);if(!this.alive(0,'hq').length)this.winner=1;else if(!this.alive(1,'hq').length)this.winner=0;
 this.ai();
 }
 ai(){if(this.ready[1]){outer:for(let y=18;y<H;y++)for(let x=28;x<W;x++)if(this.place(1,x,y))break outer;}
 if(this.time>=this.aiAt){this.aiAt=this.time+6;const pending=t=>this.alive(1,t).length||this.queue[1].some(q=>q.type===t)||this.ready[1]===t;let type=!pending('power')?'power':!pending('barracks')?'barracks':!pending('factory')?'factory':this.alive(1,'tank').length<4?'tank':'soldier';this.enqueue(1,type);}
 if(this.time>=this.waveAt){this.waveAt=this.time+35;const hq=this.alive(0,'hq')[0];if(hq)this.attack(this.alive(1).filter(e=>TYPES[e.type].damage).map(e=>e.id),hq);}
 }
}
