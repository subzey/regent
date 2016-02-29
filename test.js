/*jshint node:true, esnext:true */
'use strict';

let serializeRanges = require('./lib/regexpclass').serializeRanges;
let rangeLib = require('./lib/range');
let Range = rangeLib.Range;

let specialRangeDot = rangeLib.specialRanges.filter(r => r.str === '.')[0];
let specialRangeAlnum = rangeLib.specialRanges.filter(r => r.str === '\\w')[0];
let specialRangeDigits = rangeLib.specialRanges.filter(r => r.str === '\\d')[0];

let rangesGroupLib = require('./lib/rangesgroup');

// console.log(new RegExp(serializeRanges([
// 	new Range(0x21, 0x22),
// 	specialRangeDot
// ], false)));

// console.log(new RegExp(serializeRanges([
// 	new Range(0x21, 0x23),
// 	specialRangeDot
// ], false)));

// console.log(rangesGroupLib.isRangeContainedWithin(
// 	specialRangeAlnum,
// 	[new Range(0x5F, 0x5F), specialRangeDigits, new Range(0x41, 0x5A), new Range(0x61, 0x7A)]
// ));

// console.log(rangesGroupLib.isRangeIntersected(
// 	specialRangeDot,
// 	[new Range(33, 33)]
// ));

// let r = rangesGroupLib.getRangesFromString('\0\u0001Foo bar baz\uFFFF');
// let i = rangesGroupLib.inverseRanges(r);

// console.log(r);
// console.log(i);


console.log(specialRangeDigits.size());

// let arr = rangesGroupLib.grinder('for(i=a.length; i--; )');
// arr.map(v => console.log(v));
