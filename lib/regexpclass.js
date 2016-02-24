/*jshint node:true, esnext:true */
'use strict';

let escapeChar = (character) => {
	if (
		character === ']' ||
		character === '/' ||
		character === '\\' ||
		character === '\u2028' ||
		character === '\u2029'
	) {
		return '\\' + character;
	}
	if (character === '\r') {
		return '\\r';
	}
	if (character === '\n') {
		return '\\n';
	}
	return character;
};

let rangeString = (fromCharCode, toCharCode) => {
	if (fromCharCode === toCharCode) {
		return escapeChar(String.fromCharCode(fromCharCode));
	} else if (fromCharCode === toCharCode - 1) {
		return (
			escapeChar(String.fromCharCode(fromCharCode)) +
			escapeChar(String.fromCharCode(toCharCode))
		);
	} else {
		return (
			escapeChar(String.fromCharCode(fromCharCode)) +
			'-' +
			escapeChar(String.fromCharCode(toCharCode))
		);
	}
};


let classString = (ranges, negated) => {
	let rangesCopy = [];
	let leadingDashSingles = [];
	let leadingDashMultiples = [];

	const _assign = (range) => {
		if (!range.special && range.from === 0x2D) {
			if (range.to === range.from) {
				leadingDashSingles.push(range);
			} else {
				leadingDashMultiples.push(range);
			}
		} else {
			rangesCopy.push(range);
		}
	};

	for (let range of ranges) {
		if (range.special || range.to - range.from !== 1) {
			_assign(range);
		} else {
			// Treat as two separate singles
			_assign({
				from: range.from,
				to: range.from
			});
			_assign({
				from: range.to,
				to: range.to
			});
		}
	}

	// Leading dash multiples should always go first
	// That is, [--z] or [^--z]
	let chunks = leadingDashMultiples;
	// true: "a-z" (it's safe to put anything)
	// false: "a" (dash is unsafe)
	// "a-" is allowed only at the end of the string

	let isRangeClosed = true;
	outer: do {
		if (isRangeClosed && leadingDashSingles.length) {
			chunks.push(leadingDashSingles.shift());
			isRangeClosed = false;
			break;
		}

		for (let i = 0; i < rangesCopy.length; i++){
			let range = rangesCopy[i];
			if (!negated && chunks.length === 0 && !range.special && range.from === 0x5E) {
				// Caret at the start
				continue;
			}

			chunks.push(rangesCopy[i]);
			rangesCopy.slice(i);
			isRangeClosed = !range.special && (range.from !== range.to);
			continue outer;
		}
	} while (false);


};

exports.escapeChar = escapeChar;