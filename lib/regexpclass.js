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
	const CHAR_CODE_DASH = 0x2D;
	const CHAR_CODE_CARET = 0x5E;

	let rangesCopy = []; // Do not modify the original array

	for (let range of ranges) {
		if (
			!range.special &&
			range.to - range.from === 1 &&
			(range.to === CHAR_CODE_DASH || range.from === CHAR_CODE_DASH)
		) {
			// Split range of two chars of one of these chars is dash
			rangesCopy.push({
				from: range.from,
				to: range.from
			});
			rangesCopy.push({
				from: range.to,
				to: range.to
			});
		} else {
			rangesCopy.push(range);
		}
	}

	let dashSanitized = false;
	for (let i = rangesCopy.length; i--; ){
		let range = rangesCopy[i];
		if (!negated && i === 0 && range.from === CHAR_CODE_CARET) {
			// Move range starting with caret to the end
			rangesCopy.splice(i, 1);
			rangesCopy.push(range);
		} else if (!dashSanitized && i !== 0 && range.from === CHAR_CODE_DASH && range.to === range.from) {
			// Move singular dash letter to the start
			rangesCopy.splice(i, 1);
			rangesCopy.unshift(range);
		}
	}

	// Assemble the string
	let retVal = '';
	for (let i = 0; i < rangesCopy.length; i++) {
		let range = rangesCopy[i];
		if (range.special) {
			retVal += range.toString();
			continue;
		}

		let str = rangeClassString(range.from, range.to);
		if (!negated && i === 0 && str.charCodeAt(0) === CHAR_CODE_CARET) {
			str = '\\' + str;
		} else if (i !== 0 && i !== rangesCopy.length - 1 && str.charCodeAt(0) === CHAR_CODE_DASH) {
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
	let notInCharClass = [];
	let classRanges = [];
	let hasLongRanges = false;

	for (let range of ranges) {
		if (range.special && range.notInCharClass) {
			notInCharClass.push(range);
		} else {
			classRanges.push(range);
			if (range.to - range.from > 3) {
				// The worst case I could imagine
				// [\#-\#]
				// #|#|#|#
				// (where # is any character)
				hasLongRanges = true;
			}
		}
	}

	if (negated && notInCharClass.length) {
		throw new Error('Dot outside character class is not implemented');
	}

	let charClassStr = serializeRangesAsClass(classRanges, negated);

	if (!negated && !hasLongRanges) {
		// try to use "a|b" instead of "[ab]"
		const altStr = classRanges.map(serializeRangesAsAlternatives).join('|');
		const utf8Module = require('./utf8');

		if (utf8Module.byteCount(altStr) < utf8Module.byteCount(charClassStr)) {
			charClassStr = altStr;
		}
	}

	if (notInCharClass.length) {
		return charClassStr + '|' + notInCharClass.map(serializeRangesAsAlternatives).join('|');
	} else {
		return charClassStr;
	}
};

const serializeRangesAsAlternatives = (range) => {
	if (range.special) {
		return range.toString();
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

exports.escapeChar = escapeChar;
exports.escapeClassChar = escapeClassChar;
exports.serializeRangesAsAlternatives = serializeRangesAsAlternatives;
exports.serializeRangesAsClass = serializeRangesAsClass;
exports.serializeRanges = serializeRanges;