var serializeRanges = require('./lib/regexpclass').serializeRanges;

// console.log(serializeRanges([
// 	{from: 0x5E, to: 0x60},
// 	{from: 0x2D, to: 0x30},
// ]));

console.log(serializeRanges([
	{from: 0x21, to: 0x22},
]));

console.log(serializeRanges([
	{from: 0x21, to: 0x23},
]));