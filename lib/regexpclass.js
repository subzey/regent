/*jshint node:true, esnext:true */
'use strict';

const escapeChar = (character) => {
	switch (character) {
		case '\r':
			return '\\r';
		case '\n':
			return '\\n';
		case '$':
		case '(':
		case ')':
		case '*':
		case '+':
		case '.':
		case '/':
		case '?':
		case '[':
		case '\\':
		// ']' does not need to be escaped
		case '^':
		case '{':
		case '|':
		case '}':
		case '\u2028':
		case '\u2029':
			return '\\' + character;
		default:
			return character;
	}
};

const escapeClassChar = (character) => {
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

const rangeClassString = (fromCharCode, toCharCode) => {
	if (fromCharCode === toCharCode) {
		return escapeClassChar(String.fromCharCode(fromCharCode));
	} else if (fromCharCode === toCharCode - 1) {
		return (
			escapeClassChar(String.fromCharCode(fromCharCode)) +
			escapeClassChar(String.fromCharCode(toCharCode))
		);
	} else {
		return (
			escapeClassChar(String.fromCharCode(fromCharCode)) +
			'-' +
			escapeClassChar(String.fromCharCode(toCharCode))
		);
	}
};


const serializeRangesAsClass = (ranges, negated) => {
	// `negated` does not inverse the special ranges
	// For example, serializeRangesAsClass([<Range \s>], true)
	// returns '[^\\s]', not '[\\S]' or '\\S'.
	// Use other methods to do so.

	// In other words: negated = true just inserts leading ^.

	const CHAR_CODE_DASH = 0x2D;
	const CHAR_CODE_CARET = 0x5E;

	// Copy array: do not change it by reference
	ranges = ranges.slice();
	for (let i = ranges.length; i--;) {
		let range = ranges[i];
		if (range.special) {
			continue;
		}
		if (range.to === CHAR_CODE_DASH && range.from - range.to === 1) {
			ranges.splice(i, 1,
				{from: range.from, to: range.from},
				{from: range.to, to: range.to}
			);
			i += 2;
		} else if (i !== 0 && range.from === CHAR_CODE_DASH) {
			ranges.splice(i, 1);
			if (ranges[0].from === CHAR_CODE_DASH) {
				if (ranges[0].to < range.to) {
					ranges.splice(0, 1, range);
				}
			} else {
				ranges.splice(0, 0, range);
			}

		} else if (!negated && range.from === CHAR_CODE_CARET) {
			ranges.splice(i, 1);
			ranges.push(range);
		}
	}

	// Assemble the string
	let retVal = '';
	for (let range of ranges) {
		let str;
		if (range.special) {
			str = range.toString();
		} else {
			str = rangeClassString(range.from, range.to);
		}

		if (!negated && i === 0 && str.charCodeAt === CHAR_CODE_CARET) {
			str = '\\' + str;
		}
		retVal += str;
	}

	if (negated) {
		return '[^' + retVal + ']';
	} else {
		return '[' + retVal + ']';
	}
};

const serializeRanges = (ranges, negated) => {
	let charClassStr = serializeRangesAsClass(ranges, negated);

	// try to use "a|b" instead of "[ab]"

	const byteCount = require('./utf8').byteCount;
	// Do not try for negated ranges: /[^\s\d]/ is not the same as /\S|\D/
	// and [^ab] has no (at least, short) equivalent.
	if (negated) {
		// Except one particular case: when there's only one range
		// and it's special and have an inverse.
		// Forexample, we can use \D instead of [^\d]
		if (ranges.length === 1 && ranges[0].special && ranges[0].inverse) {
			const altStr = serializeRangesAsAlternatives(ranges[0].inverse);
			if (byteCount(altStr) < byteCount(charClassStr)) {
				charClassStr = altStr;
			}
		};
	} else {
		// /a|b|c|d|e/ can never be shorter than /[a-e]/
		// So it's useless even to try
		let hasNoLongRanges = ranges.every(range => range.special || range.to - range.from <= 3);
		if (hasNoLongRanges) {
			const altStr = ranges.map(serializeRangesAsAlternatives).join('|');
			if (byteCount(altStr) < byteCount(charClassStr)) {
				charClassStr = altStr;
			}
		}
	}

	return charClassStr;
};

const serializeRangesAsAlternatives = (range) => {
	// No `negated` argument.

	if (range.special) {
		let str = range.toString();
		if (str) {
			return str;
		} else {
			return range.subranges.map(serializeRangesAsAlternatives).join('|');
		}
	}

	if (range.from === range.to) {
		return escapeChar(String.fromCharCode(range.from));
	}

	let arr = [];

	for (let i = range.from; i <= range.to; i++) {
		arr.push(escapeChar(String.fromCharCode(i)));
	}

	return arr.join('|');
};

const serializeRangesComplex = (plain, negated) => {
	let str = '';
	if (plain.length) {
		str += serializeRanges(plain, false);

		if (negated.length) {
			str += '|';
		}
	}
	if (negated.length) {
		str += serializeRanges(negated, true);
	}

	return str;
};

exports.escapeChar = escapeChar;
exports.escapeClassChar = escapeClassChar;
exports.serializeRangesAsAlternatives = serializeRangesAsAlternatives;
exports.serializeRangesAsClass = serializeRangesAsClass;
exports.serializeRanges = serializeRanges;
exports.serializeRangesComplex = serializeRangesComplex;