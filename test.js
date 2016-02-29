/*jshint node:true, esnext:true */
'use strict';

let serializeRanges = require('./lib/regexpclass').serializeRanges;
let rangeLib = require('./lib/range');
let Range = rangeLib.Range;

let specialRangeDot = rangeLib.specialRanges.filter(r => r.str === '.')[0];
let specialRangeAlnum = rangeLib.specialRanges.filter(r => r.str === '\\w')[0];

console.log(new RegExp(serializeRanges([
	new Range(0x21, 0x22),
	specialRangeDot
], false)));

console.log(new RegExp(serializeRanges([
	new Range(0x21, 0x23),
	specialRangeDot
], false)));
