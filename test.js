/*jshint node:true, esnext:true */
'use strict';
let Range = require('./lib/range').Range;
let rangesGroupLib = require('./lib/rangesgroup');

let getBestCharCodes = require('./lib/utf8').getBestCharCodes;

console.log(getBestCharCodes(123, 126, 2));


// let arr = rangesGroupLib.grinder(
// `for(var i=arr.length;i--;);`
// );
// arr.map(v => console.log(v));
