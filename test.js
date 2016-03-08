/*jshint node:true, esnext:true */
'use strict';
let Range = require('./lib/range').Range;
let rangesGroupLib = require('./lib/rangesgroup');

let subtractRanges = rangesGroupLib.subtractRanges;

// console.log(subtractRanges(
// 	[
// 		new Range(0, 0xFFFF),
// 	],
// 	[
// 		new Range(50, 60),
// 		new Range(200, 300),
// 	]
// ))


let arr = rangesGroupLib.grinder(
`b.bgColor&=function n(){h=a.height^=0;w=a.width;d=(Date.now()-t)/99;c.translate(w/2,h/2);c.scale(s=Math.min(w,h)/600,s);f=c.createRadialGradient(0,0,0,0,0,99);f.addColorStop(0,"#fff");f.addColorStop(.1,"hsla("+(d%360+80)+",50%,70%,.2)");f.addColorStop(1,"hsla("+(d%360+120)+",50%,50%,0)");c.fillStyle = f;for(i=121;--i;c.restore())z=i&1?90:60,c.save(),c.scale(s=1/(Math.cos(i)+2),s),c.translate(Math.cos((i/10+(i&1||3))*d/z)*500,Math.cos((i/10+2)*d/z)*500),c.fillRect(-99,-99,198,198);f=c.createRadialGradient(0,0,0,0,0,99);f.addColorStop(0,"hsla("+(d%360)+",50%,70%,1)");f.addColorStop(1,"hsla("+(d%360+60)+",50%,50%,0)");for(c.fillStyle=f;i<30;i++)c.fillRect(-99, -99, 198, 198),c.translate(Math.sin(i*i+d/4)*10,-30),c.scale(.9,.9),c.globalAlpha*=.8+Math.sin(d/10)*.1;requestAnimationFrame(n)}(t=Date.now())`
);
// arr.map(v => console.log(v));
