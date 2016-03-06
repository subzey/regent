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


let arr = rangesGroupLib.grinder('for(i=a.length;i--;)');
// arr.map(v => console.log(v));
