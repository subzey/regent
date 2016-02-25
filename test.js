var regexpClassString = require('./lib/regexpclass').classString;

console.log(regexpClassString([
	{from: 0x5E, to: 0x60},
	{from: 0x2D, to: 0x30},
]));